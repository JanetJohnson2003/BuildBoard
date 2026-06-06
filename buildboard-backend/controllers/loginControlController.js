const bcrypt = require('bcryptjs');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');

const logOverseerAction = async (action, req, details = {}) => {
  try {
    await ActivityLog.create({
      action,
      user: req.user._id,
      referenceType: 'user',
      referenceId: details.targetUserId,
      details,
    });
  } catch {
    /* non-blocking */
  }
};

const canManageUser = (req, target) => {
  if (!target) return { ok: false, message: 'User not found' };
  if (target._id.toString() === req.user._id.toString()) {
    return { ok: false, message: 'Cannot modify your own account through this console' };
  }
  if (['admin', 'reviewer'].includes(target.role) && req.user.role !== 'admin') {
    return { ok: false, message: 'Only admins can manage overseer accounts' };
  }
  return { ok: true };
};

/** Command center — all users + login/session state */
exports.loginCommandCenter = async (req, res) => {
  try {
    const { search, status } = req.query;
    const filter = {};
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
      ];
    }
    if (status === 'locked') filter.loginLocked = true;
    if (status === 'banned') filter.isBanned = true;
    if (status === 'active') {
      filter.isBanned = false;
      filter.loginLocked = false;
    }

    const users = await User.find(filter)
      .select('username name email role isBanned loginLocked loginLockReason loginLockedUntil lastActive refreshToken createdAt loginHistory')
      .sort({ lastActive: -1 })
      .limit(50);

    res.json({
      users: users.map((u) => ({
        _id: u._id,
        username: u.username,
        name: u.name,
        email: u.email,
        role: u.role,
        isBanned: u.isBanned,
        loginLocked: u.loginLocked,
        loginLockReason: u.loginLockReason,
        loginLockedUntil: u.loginLockedUntil,
        hasActiveSession: !!u.refreshToken,
        lastActive: u.lastActive,
        lastLogin: u.loginHistory?.length ? u.loginHistory[u.loginHistory.length - 1] : null,
        loginEventCount: u.loginHistory?.length || 0,
      })),
      stats: {
        total: await User.countDocuments(),
        locked: await User.countDocuments({ loginLocked: true }),
        banned: await User.countDocuments({ isBanned: true }),
        activeSessions: await User.countDocuments({ refreshToken: { $ne: null } }),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** 1. Login Telemetry Grid — platform-wide recent sign-ins */
exports.loginTelemetryGrid = async (req, res) => {
  try {
    const users = await User.find({ 'loginHistory.0': { $exists: true } })
      .select('username role loginHistory isBanned loginLocked')
      .limit(100);

    const events = [];
    users.forEach((user) => {
      (user.loginHistory || []).slice(-5).forEach((entry, index) => {
        events.push({
          id: `${user._id}-${index}-${entry.createdAt}`,
          username: user.username,
          role: user.role,
          ip: entry.ip || 'unknown',
          userAgent: entry.userAgent || 'unknown',
          success: entry.success !== false,
          createdAt: entry.createdAt,
          accountStatus: user.isBanned ? 'banned' : user.loginLocked ? 'locked' : 'active',
        });
      });
    });

    events.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      window: 'recent',
      eventCount: events.length,
      events: events.slice(0, 40),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** 2. Ghost Login Detector — impossible travel / IP hopping */
exports.ghostLoginDetector = async (req, res) => {
  try {
    const users = await User.find({ 'loginHistory.2': { $exists: true } })
      .select('username email role loginHistory loginLocked isBanned')
      .limit(200);

    const ghosts = [];

    users.forEach((user) => {
      const history = user.loginHistory || [];
      const recent = history.slice(-10);
      const uniqueIps = new Set(recent.map((e) => e.ip).filter(Boolean));
      const failed = recent.filter((e) => e.success === false).length;

      if (uniqueIps.size >= 4) {
        ghosts.push({
          userId: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          threat: 'IP_HOP_STORM',
          severity: 'critical',
          detail: `${uniqueIps.size} distinct IPs in last ${recent.length} attempts`,
          uniqueIps: uniqueIps.size,
          loginLocked: user.loginLocked,
        });
      } else if (failed >= 3) {
        ghosts.push({
          userId: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          threat: 'CREDENTIAL_SPRAY',
          severity: 'high',
          detail: `${failed} failed login attempts in recent window`,
          failedAttempts: failed,
          loginLocked: user.loginLocked,
        });
      } else if (recent.length >= 8) {
        const spanHours =
          (new Date(recent[recent.length - 1].createdAt) - new Date(recent[0].createdAt)) /
          3600000;
        if (spanHours < 2 && uniqueIps.size >= 2) {
          ghosts.push({
            userId: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            threat: 'RAPID_MULTI_DEVICE',
            severity: 'medium',
            detail: `${recent.length} logins across ${uniqueIps.size} IPs in ${Math.round(spanHours * 10) / 10}h`,
            loginLocked: user.loginLocked,
          });
        }
      }
    });

    ghosts.sort((a, b) => {
      const rank = { critical: 3, high: 2, medium: 1 };
      return (rank[b.severity] || 0) - (rank[a.severity] || 0);
    });

    res.json({
      scanId: `GLD-${Date.now().toString(36).toUpperCase()}`,
      ghostCount: ghosts.length,
      ghosts: ghosts.slice(0, 25),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** 3. Session Purge Beam — force logout (single or mass) */
exports.sessionPurgeBeam = async (req, res) => {
  try {
    const { userId, scope } = req.body;

    if (userId) {
      const target = await User.findById(userId);
      const guard = canManageUser(req, target);
      if (!guard.ok) return res.status(403).json({ message: guard.message });

      target.refreshToken = null;
      target.devices = [];
      await target.save();

      await logOverseerAction('ADMIN_FORCE_LOGOUT', req, {
        targetUserId: target._id,
        username: target.username,
      });

      return res.json({
        message: `Session purged for @${target.username}`,
        purged: 1,
      });
    }

    if (scope === 'all_developers') {
      const filter =
        req.user.role === 'admin'
          ? { role: { $nin: ['admin'] }, refreshToken: { $ne: null } }
          : { role: 'developer', refreshToken: { $ne: null } };

      const result = await User.updateMany(filter, { $set: { refreshToken: null, devices: [] } });

      await logOverseerAction('ADMIN_SESSION_PURGE_ALL', req, {
        purged: result.modifiedCount,
        scope,
      });

      return res.json({
        message: `Purged ${result.modifiedCount} active sessions`,
        purged: result.modifiedCount,
      });
    }

    return res.status(400).json({ message: 'Provide userId or scope: "all_developers"' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** 4. Credential Override Vault — reset password + force re-auth */
exports.credentialOverrideVault = async (req, res) => {
  try {
    const { userId, newPassword, forceResetOnLogin } = req.body;
    if (!userId || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'userId and newPassword (min 6 chars) required' });
    }

    const target = await User.findById(userId);
    const guard = canManageUser(req, target);
    if (!guard.ok) return res.status(403).json({ message: guard.message });

    target.password = await bcrypt.hash(newPassword, 12);
    target.refreshToken = null;
    target.mustResetPassword = !!forceResetOnLogin;
    await target.save();

    await logOverseerAction('ADMIN_PASSWORD_RESET', req, {
      targetUserId: target._id,
      username: target.username,
      forceResetOnLogin: !!forceResetOnLogin,
    });

    res.json({
      message: `Credentials overridden for @${target.username}. Active sessions terminated.`,
      username: target.username,
      mustResetPassword: target.mustResetPassword,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** 5. Identity Quarantine Field — timed login lock */
exports.identityQuarantine = async (req, res) => {
  try {
    const { userId, hours = 24, reason } = req.body;
    if (!userId) return res.status(400).json({ message: 'userId is required' });

    const target = await User.findById(userId);
    const guard = canManageUser(req, target);
    if (!guard.ok) return res.status(403).json({ message: guard.message });

    const until = new Date();
    until.setHours(until.getHours() + Math.min(Math.max(Number(hours) || 24, 1), 720));

    target.loginLocked = true;
    target.loginLockReason = reason || `Quarantined by @${req.user.username}`;
    target.loginLockedAt = new Date();
    target.loginLockedUntil = until;
    target.loginLockedBy = req.user._id;
    target.refreshToken = null;
    await target.save();

    await logOverseerAction('ADMIN_LOGIN_LOCKED', req, {
      targetUserId: target._id,
      username: target.username,
      until,
      reason: target.loginLockReason,
    });

    res.json({
      message: `@${target.username} quarantined until ${until.toISOString()}`,
      loginLockedUntil: until,
      user: {
        _id: target._id,
        username: target.username,
        loginLocked: true,
        loginLockReason: target.loginLockReason,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.lockUserLogin = async (req, res) => {
  try {
    const { reason } = req.body;
    const target = await User.findById(req.params.userId);
    const guard = canManageUser(req, target);
    if (!guard.ok) return res.status(403).json({ message: guard.message });

    target.loginLocked = true;
    target.loginLockReason = reason || `Locked by @${req.user.username}`;
    target.loginLockedAt = new Date();
    target.loginLockedBy = req.user._id;
    target.loginLockedUntil = null;
    target.refreshToken = null;
    await target.save();

    await logOverseerAction('ADMIN_LOGIN_LOCKED', req, {
      targetUserId: target._id,
      username: target.username,
    });

    res.json({ message: `Login locked for @${target.username}`, user: target });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.unlockUserLogin = async (req, res) => {
  try {
    const target = await User.findById(req.params.userId);
    const guard = canManageUser(req, target);
    if (!guard.ok) return res.status(403).json({ message: guard.message });

    target.loginLocked = false;
    target.loginLockReason = '';
    target.loginLockedAt = null;
    target.loginLockedUntil = null;
    target.loginLockedBy = null;
    await target.save();

    await logOverseerAction('ADMIN_LOGIN_UNLOCKED', req, {
      targetUserId: target._id,
      username: target.username,
    });

    res.json({ message: `Login restored for @${target.username}`, user: target });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.forceLogoutUser = async (req, res) => {
  req.body = { userId: req.params.userId };
  return exports.sessionPurgeBeam(req, res);
};

exports.toggleUserBan = async (req, res) => {
  try {
    const target = await User.findById(req.params.userId);
    const guard = canManageUser(req, target);
    if (!guard.ok) return res.status(403).json({ message: guard.message });

    target.isBanned = !target.isBanned;
    if (target.isBanned) target.refreshToken = null;
    await target.save();

    await logOverseerAction(
      target.isBanned ? 'ADMIN_USER_BANNED' : 'ADMIN_USER_UNBANNED',
      req,
      { targetUserId: target._id, username: target.username }
    );

    res.json({
      message: target.isBanned ? `Banned @${target.username}` : `Unbanned @${target.username}`,
      isBanned: target.isBanned,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
