const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Repository = require('../models/Repository');
const Branch = require('../models/Branch');
const File = require('../models/File');
const Commit = require('../models/Commit');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');
const PlatformSettings = require('../models/PlatformSettings');
const { findRepositoryByOwnerSlug } = require('../utils/repositoryResolver');
const { emitToUser } = require('../config/socket');

const getSettings = async () => {
  let doc = await PlatformSettings.findOne({ key: 'global' });
  if (!doc) {
    doc = await PlatformSettings.create({ key: 'global' });
  }
  return doc;
};

const logGod = async (action, req, details = {}) => {
  try {
    await ActivityLog.create({
      action,
      user: req.user._id,
      details: { ...details, godMode: true },
    });
  } catch {
    /* non-blocking */
  }
};

const generateTokens = (userId) => {
  const token = jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'devhubpro_secret_key_2024',
    { expiresIn: '2h' }
  );
  const refreshToken = jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET || 'devhubpro_refresh_secret_2024',
    { expiresIn: '1d' }
  );
  return { token, refreshToken };
};

/** Overview + god capabilities */
exports.godOverview = async (req, res) => {
  try {
    const settings = await getSettings();
    const [users, repos, commits, sessions, logs] = await Promise.all([
      User.countDocuments(),
      Repository.countDocuments(),
      Commit.countDocuments(),
      User.countDocuments({ refreshToken: { $ne: null } }),
      ActivityLog.countDocuments(),
    ]);

    res.json({
      role: 'admin',
      clearance: 'GOD_MODE',
      platform: settings,
      stats: { users, repos, commits, activeSessions: sessions, activityLogs: logs },
      powers: [
        'USER_MIRROR',
        'PLATFORM_KILL_SWITCH',
        'MASS_ROLE_ASSIGN',
        'REPO_ANNIHILATION',
        'OMNICHANNEL_BROADCAST',
        'ENTROPY_SCAN',
        'ASCENSION_PROTOCOL',
        'SESSION_OMNISCIENCE',
        'EMERGENCY_LOCKDOWN',
        'TIMELINE_SOVEREIGNTY',
      ],
      inherits: ['reviewer_terminal', 'identity_command', 'all_login_control'],
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** 1. User Mirror Protocol — sign in as any user */
exports.userMirror = async (req, res) => {
  try {
    const target = await User.findById(req.params.userId).select('-password');
    if (!target) return res.status(404).json({ message: 'User not found' });

    const { token, refreshToken } = generateTokens(target._id);
    target.refreshToken = refreshToken;
    await target.save();

    await logGod('GOD_USER_MIRROR', req, {
      targetUserId: target._id,
      targetUsername: target.username,
      targetRole: target.role,
    });

    res.json({
      message: `Mirror active for @${target.username}`,
      mirror: true,
      token,
      refreshToken,
      user: {
        id: target._id,
        username: target.username,
        name: target.name,
        email: target.email,
        role: target.role,
        avatar: target.avatar,
      },
      warning: 'Admin session should be preserved separately before switching context.',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** 2. Platform Kill Switch */
exports.platformKillSwitch = async (req, res) => {
  try {
    const settings = await getSettings();
    if (req.body.enabled !== undefined) settings.loginLockdown = !!req.body.enabled;
    if (req.body.message) settings.lockdownMessage = req.body.message;
    settings.lastModifiedBy = req.user._id;
    await settings.save();

    if (settings.loginLockdown) {
      await User.updateMany(
        { role: { $nin: ['admin'] } },
        { $set: { refreshToken: null } }
      );
    }

    await logGod('GOD_PLATFORM_LOCKDOWN', req, {
      enabled: settings.loginLockdown,
      message: settings.lockdownMessage,
    });

    res.json({
      loginLockdown: settings.loginLockdown,
      lockdownMessage: settings.lockdownMessage,
      message: settings.loginLockdown ? 'Platform lockdown ENABLED' : 'Platform lockdown DISABLED',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** 3. Mass Role Reassignment */
exports.massRoleAssign = async (req, res) => {
  try {
    const { assignments } = req.body;
    if (!Array.isArray(assignments) || !assignments.length) {
      return res.status(400).json({ message: 'assignments array required' });
    }

    const validRoles = ['developer', 'reviewer', 'project_manager', 'admin'];
    const results = [];

    for (const item of assignments) {
      if (!validRoles.includes(item.role)) continue;
      const updated = await User.findByIdAndUpdate(
        item.userId,
        { role: item.role },
        { new: true }
      ).select('username role');
      if (updated) results.push(updated);
    }

    await logGod('GOD_MASS_ROLE_ASSIGN', req, { count: results.length });

    res.json({ message: `Updated ${results.length} operatives`, results });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** 4. Repository Annihilation */
exports.repositoryAnnihilation = async (req, res) => {
  try {
    const { owner, repo } = req.body;
    const repoDoc = await findRepositoryByOwnerSlug(owner, repo, []);
    if (!repoDoc) return res.status(404).json({ message: 'Repository not found' });

    const repoId = repoDoc._id;
    await Promise.all([
      File.deleteMany({ repository: repoId }),
      Branch.deleteMany({ repository: repoId }),
      Commit.deleteMany({ repository: repoId }),
      Repository.findByIdAndDelete(repoId),
    ]);

    await logGod('GOD_REPO_ANNIHILATE', req, {
      owner,
      repo,
      repositoryId: repoId,
      name: repoDoc.name,
    });

    res.json({ message: `Annihilated ${owner}/${repo}`, destroyed: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** 5. Omnichannel Broadcast */
exports.omnichannelBroadcast = async (req, res) => {
  try {
    const { title, message, roles } = req.body;
    if (!title || !message) {
      return res.status(400).json({ message: 'title and message required' });
    }

    const filter = roles?.length ? { role: { $in: roles } } : {};
    const recipients = await User.find(filter).select('_id');

    const notifications = await Promise.all(
      recipients.map((r) =>
        Notification.create({
          recipient: r._id,
          sender: req.user._id,
          type: 'system',
          title,
          message,
        })
      )
    );

    recipients.forEach((r) => {
      const n = notifications.find((x) => x.recipient.toString() === r._id.toString());
      if (n) emitToUser(r._id.toString(), 'notification:new', n);
    });

    await logGod('GOD_BROADCAST', req, { title, recipientCount: recipients.length });

    res.json({
      message: `Broadcast sent to ${recipients.length} users`,
      recipientCount: recipients.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** 6. Platform Entropy Scan */
exports.entropyScan = async (req, res) => {
  try {
    const dayAgo = new Date(Date.now() - 86400000);
    const [
      usersByRole,
      reposByVisibility,
      commits24h,
      openPrs,
      lockedUsers,
      bannedUsers,
      topContributors,
    ] = await Promise.all([
      User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
      Repository.aggregate([{ $group: { _id: '$visibility', count: { $sum: 1 } } }]),
      Commit.countDocuments({ createdAt: { $gte: dayAgo } }),
      require('../models/PullRequest').countDocuments({ status: 'open' }),
      User.countDocuments({ loginLocked: true }),
      User.countDocuments({ isBanned: true }),
      Commit.aggregate([
        { $match: { createdAt: { $gte: dayAgo } } },
        { $group: { _id: '$author', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
        { $unwind: '$user' },
        { $project: { username: '$user.username', commits: '$count' } },
      ]),
    ]);

    const entropyScore = Math.min(
      100,
      Math.round(commits24h / 2 + openPrs + lockedUsers * 5 + bannedUsers * 3)
    );

    res.json({
      entropyScore,
      stability: entropyScore < 40 ? 'stable' : entropyScore < 70 ? 'volatile' : 'critical',
      usersByRole,
      reposByVisibility,
      commits24h,
      openPrs,
      lockedUsers,
      bannedUsers,
      topContributors,
      scannedAt: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** 7. Ascension Protocol — promote/demote anyone */
exports.ascensionProtocol = async (req, res) => {
  try {
    const { userId, role, grantGodClearance } = req.body;
    const validRoles = ['developer', 'reviewer', 'project_manager', 'admin'];
    if (!userId || !validRoles.includes(role)) {
      return res.status(400).json({ message: 'userId and valid role required' });
    }

    if (userId === req.user._id.toString() && role !== 'admin') {
      return res.status(400).json({ message: 'Cannot demote yourself from admin via ascension' });
    }

    const target = await User.findByIdAndUpdate(userId, { role }, { new: true }).select(
      '-password -refreshToken'
    );
    if (!target) return res.status(404).json({ message: 'User not found' });

    if (grantGodClearance && role === 'admin') {
      target.loginLocked = false;
      target.isBanned = false;
      await target.save();
    }

    await logGod('GOD_ASCENSION', req, {
      targetUserId: target._id,
      newRole: role,
      username: target.username,
    });

    res.json({
      message: `@${target.username} ascended to ${role}`,
      user: target,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** 8. Session Omniscience */
exports.sessionOmniscience = async (req, res) => {
  try {
    const sessions = await User.find({ refreshToken: { $ne: null } })
      .select('username name email role lastActive loginLocked isBanned createdAt')
      .sort({ lastActive: -1 })
      .limit(100);

    res.json({
      activeCount: sessions.length,
      sessions: sessions.map((u) => ({
        _id: u._id,
        username: u.username,
        name: u.name,
        role: u.role,
        lastActive: u.lastActive,
        loginLocked: u.loginLocked,
        isBanned: u.isBanned,
        accountAgeDays: Math.floor((Date.now() - new Date(u.createdAt)) / 86400000),
      })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** 9. Emergency Lockdown — lock everyone except admins */
exports.emergencyLockdown = async (req, res) => {
  try {
    const settings = await getSettings();
    settings.loginLockdown = true;
    settings.lockdownMessage =
      req.body.message || 'Emergency lockdown initiated by platform administrator.';
    settings.lastModifiedBy = req.user._id;
    await settings.save();

    const [lockResult, purgeResult] = await Promise.all([
      User.updateMany(
        { role: { $ne: 'admin' } },
        {
          $set: {
            loginLocked: true,
            loginLockReason: 'Emergency god-mode lockdown',
            refreshToken: null,
          },
        }
      ),
      User.updateMany({ role: { $ne: 'admin' } }, { $set: { refreshToken: null, devices: [] } }),
    ]);

    await logGod('GOD_EMERGENCY_LOCKDOWN', req, {
      locked: lockResult.modifiedCount,
      purged: purgeResult.modifiedCount,
    });

    res.json({
      message: 'Emergency lockdown executed',
      usersLocked: lockResult.modifiedCount,
      sessionsPurged: purgeResult.modifiedCount,
      platformLockdown: true,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** 10. Timeline Sovereignty — purge or export activity logs */
exports.timelineSovereignty = async (req, res) => {
  try {
    const { action, olderThanDays, limit } = req.query;

    if (action === 'export') {
      const logs = await ActivityLog.find()
        .populate('user', 'username role')
        .populate('repository', 'name slug')
        .sort({ createdAt: -1 })
        .limit(Math.min(Number(limit) || 500, 2000));

      return res.json({
        exported: logs.length,
        logs,
      });
    }

    if (action === 'purge') {
      const days = Number(olderThanDays) || 90;
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);

      const result = await ActivityLog.deleteMany({ createdAt: { $lt: cutoff } });

      await logGod('GOD_TIMELINE_PURGE', req, {
        deleted: result.deletedCount,
        olderThanDays: days,
      });

      return res.json({
        message: `Purged ${result.deletedCount} log entries older than ${days} days`,
        deleted: result.deletedCount,
      });
    }

    const summary = await ActivityLog.aggregate([
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]);

    res.json({
      totalLogs: await ActivityLog.countDocuments(),
      topActions: summary,
      hint: 'Use action=export or action=purge&olderThanDays=90',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** God genesis — create any user with any role */
exports.userGenesis = async (req, res) => {
  try {
    const { username, name, email, password, role } = req.body;
    const validRoles = ['developer', 'reviewer', 'project_manager', 'admin'];
    if (!username || !name || !email || !password) {
      return res.status(400).json({ message: 'username, name, email, password required' });
    }

    const existing = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }],
    });
    if (existing) return res.status(409).json({ message: 'User already exists' });

    const user = await User.create({
      username: username.toLowerCase(),
      name,
      email: email.toLowerCase(),
      password: await bcrypt.hash(password, 12),
      role: validRoles.includes(role) ? role : 'developer',
      emailVerified: true,
    });

    await logGod('GOD_USER_GENESIS', req, {
      userId: user._id,
      username: user.username,
      role: user.role,
    });

    res.status(201).json({
      message: `Genesis complete: @${user.username}`,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** Full identity override — admin can lock/ban/reset ANY user including reviewers */
exports.godIdentityOverride = async (req, res) => {
  try {
    const { userId, loginLocked, isBanned, newPassword, role } = req.body;
    const target = await User.findById(userId);
    if (!target) return res.status(404).json({ message: 'User not found' });

    if (loginLocked !== undefined) {
      target.loginLocked = !!loginLocked;
      if (!loginLocked) {
        target.loginLockReason = '';
        target.loginLockedUntil = null;
      } else {
        target.loginLockReason = `God override by @${req.user.username}`;
        target.refreshToken = null;
      }
    }
    if (isBanned !== undefined) {
      target.isBanned = !!isBanned;
      if (isBanned) target.refreshToken = null;
    }
    if (newPassword && newPassword.length >= 6) {
      target.password = await bcrypt.hash(newPassword, 12);
      target.refreshToken = null;
    }
    if (role) {
      const validRoles = ['developer', 'reviewer', 'project_manager', 'admin'];
      if (validRoles.includes(role)) target.role = role;
    }
    await target.save();

    await logGod('GOD_IDENTITY_OVERRIDE', req, {
      targetUserId: target._id,
      username: target.username,
    });

    res.json({
      message: `Identity rewritten for @${target.username}`,
      user: {
        _id: target._id,
        username: target.username,
        role: target.role,
        loginLocked: target.loginLocked,
        isBanned: target.isBanned,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
