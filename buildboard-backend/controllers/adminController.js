const User = require('../models/User');
const Project = require('../models/Project');
const Repository = require('../models/Repository');
const Version = require('../models/Version');
const Feedback = require('../models/Feedback');
const ActivityLog = require('../models/ActivityLog');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// ✅ Helper: Get user ID
const getUserId = (req) => {
  return req.user?.id || req.userId;
};

// ✅ Helper: Log activity
const logActivity = async (action, userId, details) => {
  try {
    await ActivityLog.create({
      action,
      userId,
      details,
      timestamp: new Date()
    });
    console.log('📋 Activity logged:', action);
  } catch (error) {
    console.error('❌ Error logging activity:', error.message);
  }
};

// ==================== USER MANAGEMENT ====================

// GET ALL USERS
exports.getAllUsers = async (req, res) => {
  try {
    const adminId = getUserId(req);
    const { role, search, banned } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    console.log('👥 Fetching all users');

    // Build filter
    let filter = {};
    if (role) filter.role = role;
    if (banned === 'true') filter.isBanned = true;
    if (banned === 'false') filter.isBanned = false;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Count total
    const total = await User.countDocuments(filter);

    // Get users
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    console.log('✅ Users fetched:', users.length);

    res.json({
      users,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page
    });

    await logActivity('VIEW_ALL_USERS', adminId, { count: users.length });
  } catch (error) {
    console.error('❌ Get users error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// CREATE USER
exports.createUser = async (req, res) => {
  try {
    const adminId = getUserId(req);
    const { username, name, email, password, role } = req.body;

    if (!username || !name || !email || !password) {
      return res.status(400).json({ message: 'Username, name, email, and password are required' });
    }

    const validRoles = ['developer', 'reviewer', 'project_manager', 'admin'];
    const userRole = validRoles.includes(role) ? role : 'developer';

    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }],
    });

    if (existingUser) {
      return res.status(409).json({ message: 'Email or Username already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      username: username.toLowerCase(),
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: userRole,
      emailVerificationToken: crypto.randomBytes(24).toString('hex'),
    });

    console.log('✅ User created by admin:', user._id);
    await logActivity('CREATE_USER', adminId, { targetUser: user._id, role: userRole });

    res.status(201).json({ message: 'User created successfully', user });
  } catch (error) {
    console.error('❌ Create user error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// GET USER DETAILS
exports.getUserDetails = async (req, res) => {
  try {
    const adminId = getUserId(req);
    const { userId } = req.params;

    console.log('👤 Getting user details:', userId);

    const user = await User.findById(userId)
      .select('-password')
      .populate('projects', 'title createdAt');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user stats
    const projectCount = await Project.countDocuments({ createdBy: userId });
    const versionCount = await Version.countDocuments({ uploadedBy: userId });
    const feedbackCount = await Feedback.countDocuments({ reviewerId: userId });

    res.json({
      user,
      stats: {
        projectCount,
        versionCount,
        feedbackCount
      }
    });

    await logActivity('VIEW_USER_DETAILS', adminId, { targetUser: userId });
  } catch (error) {
    console.error('❌ Get user details error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// CHANGE USER ROLE
exports.changeUserRole = async (req, res) => {
  try {
    const adminId = getUserId(req);
    const { userId } = req.params;
    const { role } = req.body;

    console.log('🔄 Changing user role:', userId, 'to', role);

    const validRoles = ['user', 'reviewer', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('✅ User role changed:', user._id);

    res.json({ message: 'Role changed successfully', user });

    await logActivity('CHANGE_USER_ROLE', adminId, { 
      targetUser: userId, 
      newRole: role 
    });
  } catch (error) {
    console.error('❌ Change role error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// BAN USER
exports.banUser = async (req, res) => {
  try {
    const adminId = getUserId(req);
    const { userId } = req.params;

    console.log('🚫 Banning user:', userId);

    const user = await User.findByIdAndUpdate(
      userId,
      { isBanned: true },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('✅ User banned:', user._id);

    res.json({ message: 'User banned successfully', user });

    await logActivity('BAN_USER', adminId, { targetUser: userId });
  } catch (error) {
    console.error('❌ Ban user error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// UNBAN USER
exports.unbanUser = async (req, res) => {
  try {
    const adminId = getUserId(req);
    const { userId } = req.params;

    console.log('✅ Unbanning user:', userId);

    const user = await User.findByIdAndUpdate(
      userId,
      { isBanned: false },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('✅ User unbanned:', user._id);

    res.json({ message: 'User unbanned successfully', user });

    await logActivity('UNBAN_USER', adminId, { targetUser: userId });
  } catch (error) {
    console.error('❌ Unban user error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// DELETE USER
exports.deleteUser = async (req, res) => {
  try {
    const adminId = getUserId(req);
    const { userId } = req.params;

    if (userId === adminId) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    console.log('🗑️ Deleting user:', userId);

    // Delete user
    await User.findByIdAndDelete(userId);

    // Delete user's projects
    await Project.deleteMany({ createdBy: userId });

    console.log('✅ User deleted:', userId);

    res.json({ message: 'User deleted successfully' });

    await logActivity('DELETE_USER', adminId, { targetUser: userId });
  } catch (error) {
    console.error('❌ Delete user error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// WARN USER
exports.warnUser = async (req, res) => {
  try {
    const adminId = getUserId(req);
    const { userId } = req.params;
    const { reason } = req.body;

    console.log('⚠️ Warning user:', userId);

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Initialize warnings if not exists
    if (!user.warnings) user.warnings = [];

    user.warnings.push({
      reason,
      issuedBy: adminId,
      issuedAt: new Date()
    });

    await user.save();

    console.log('✅ User warned:', user._id);

    res.json({ message: 'User warned successfully', user });

    await logActivity('WARN_USER', adminId, { 
      targetUser: userId, 
      reason 
    });
  } catch (error) {
    console.error('❌ Warn user error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// ==================== SYSTEM ANALYTICS ====================

// DASHBOARD ANALYTICS
exports.getDashboardAnalytics = async (req, res) => {
  try {
    console.log('📊 Fetching dashboard analytics');

    const totalUsers = await User.countDocuments();
    const totalProjects = await Project.countDocuments();
    const totalVersions = await Version.countDocuments();
    const totalFeedback = await Feedback.countDocuments();
    const activeBans = await User.countDocuments({ isBanned: true });

    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    const recentActivity = await ActivityLog.find()
      .sort({ timestamp: -1 })
      .limit(10);

    console.log('✅ Analytics fetched');

    res.json({
      stats: {
        totalUsers,
        totalProjects,
        totalVersions,
        totalFeedback,
        activeBans
      },
      usersByRole,
      recentActivity
    });
  } catch (error) {
    console.error('❌ Dashboard analytics error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// USERS ANALYTICS
exports.getUsersAnalytics = async (req, res) => {
  try {
    console.log('👥 Fetching users analytics');

    const total = await User.countDocuments();
    const banned = await User.countDocuments({ isBanned: true });
    const byRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    // Growth last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const newUsersLastMonth = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    res.json({
      total,
      banned,
      active: total - banned,
      byRole,
      newUsersLastMonth
    });
  } catch (error) {
    console.error('❌ Users analytics error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// PROJECTS ANALYTICS
exports.getProjectsAnalytics = async (req, res) => {
  try {
    console.log('📁 Fetching projects analytics');

    const total = await Project.countDocuments();
    const archived = await Project.countDocuments({ isArchived: true });

    const topProjects = await Project.aggregate([
      {
        $lookup: {
          from: 'feedbacks',
          localField: '_id',
          foreignField: 'versionId',
          as: 'feedback'
        }
      },
      {
        $group: {
          _id: '$_id',
          title: { $first: '$title' },
          feedbackCount: { $sum: { $size: '$feedback' } }
        }
      },
      { $sort: { feedbackCount: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      total,
      archived,
      active: total - archived,
      topProjects
    });
  } catch (error) {
    console.error('❌ Projects analytics error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// FEEDBACK ANALYTICS
exports.getFeedbackAnalytics = async (req, res) => {
  try {
    console.log('💬 Fetching feedback analytics');

    const total = await Feedback.countDocuments();
    const byStatus = await Feedback.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const flagged = await Feedback.countDocuments({ isFlagged: true });

    res.json({
      total,
      flagged,
      byStatus
    });
  } catch (error) {
    console.error('❌ Feedback analytics error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// ACTIVITY ANALYTICS
exports.getActivityAnalytics = async (req, res) => {
  try {
    console.log('📊 Fetching activity analytics');

    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const activities = await ActivityLog.aggregate([
      { $match: { timestamp: { $gte: last7Days } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const topActions = await ActivityLog.aggregate([
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      last7Days: activities,
      topActions
    });
  } catch (error) {
    console.error('❌ Activity analytics error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// ==================== ACTIVITY LOGGING ====================

// GET ACTIVITY LOGS
exports.getActivityLogs = async (req, res) => {
  try {
    const { action, userId } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    console.log('📋 Fetching activity logs');

    let filter = {};
    if (action) filter.action = action;
    if (userId) filter.userId = userId;

    const total = await ActivityLog.countDocuments(filter);
    const logs = await ActivityLog.find(filter)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('userId', 'name email');

    console.log('✅ Logs fetched:', logs.length);

    res.json({
      logs,
      total,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('❌ Get logs error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// EXPORT LOGS
exports.exportLogs = async (req, res) => {
  try {
    const adminId = getUserId(req);
    console.log('📥 Exporting logs');

    const logs = await ActivityLog.find()
      .sort({ timestamp: -1 })
      .populate('userId', 'name email');

    // Convert to CSV
    let csv = 'Timestamp,Action,User,Details\n';
    logs.forEach(log => {
      csv += `"${log.timestamp}","${log.action}","${log.userId?.email}","${JSON.stringify(log.details)}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=logs.csv');
    res.send(csv);

    await logActivity('EXPORT_LOGS', adminId, {});
  } catch (error) {
    console.error('❌ Export logs error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// DELETE LOG
exports.deleteLog = async (req, res) => {
  try {
    const adminId = getUserId(req);
    const { logId } = req.params;

    console.log('🗑️ Deleting activity log:', logId);

    const log = await ActivityLog.findByIdAndDelete(logId);

    if (!log) {
      return res.status(404).json({ message: 'Log not found' });
    }

    console.log('✅ Activity log deleted:', log._id);

    res.json({ message: 'Log deleted successfully' });

    // Don't log this action to avoid log spam, or do it minimally
    // await logActivity('DELETE_LOG', adminId, { targetLog: logId });
  } catch (error) {
    console.error('❌ Delete log error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// ==================== REPOSITORY MANAGEMENT ====================

// GET ALL REPOSITORIES (Reviewer/Admin)
exports.getAllRepositories = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { search, visibility } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    console.log('📂 Fetching all repositories for admin/reviewer');

    // Build filter
    let filter = {};
    if (visibility) filter.visibility = visibility;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Repository.countDocuments(filter);

    const repos = await Repository.find(filter)
      .populate('owner', 'username name avatar')
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    console.log('✅ Repositories fetched:', repos.length);

    res.json({
      repos,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page
    });

    await logActivity('VIEW_ALL_REPOSITORIES', userId, { count: repos.length });
  } catch (error) {
    console.error('❌ Get all repositories error:', error.message);
    res.status(500).json({ message: error.message });
  }
};


// ==================== PROJECT MANAGEMENT ====================

// GET ALL PROJECTS
exports.getAllProjects = async (req, res) => {
  try {
    const { search, archived } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    console.log('📁 Fetching all projects');

    let filter = {};
    if (archived === 'true') filter.isArchived = true;
    if (archived === 'false') filter.isArchived = false;
    if (search) filter.title = { $regex: search, $options: 'i' };

    const total = await Project.countDocuments(filter);
    const projects = await Project.find(filter)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    console.log('✅ Projects fetched:', projects.length);

    res.json({
      projects,
      total,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('❌ Get projects error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// GET PROJECT DETAILS
exports.getProjectDetails = async (req, res) => {
  try {
    const { projectId } = req.params;

    console.log('📖 Getting project details:', projectId);

    const project = await Project.findById(projectId)
      .populate('createdBy', 'name email')
      .populate('sharedWith', 'name email');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const versionCount = await Version.countDocuments({ projectId });
    const feedbackCount = await Feedback.countDocuments({ versionId: { $in: await Version.find({ projectId }).select('_id') } });

    res.json({
      project,
      stats: {
        versions: versionCount,
        feedback: feedbackCount
      }
    });
  } catch (error) {
    console.error('❌ Get project details error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// DELETE PROJECT
exports.deleteProject = async (req, res) => {
  try {
    const adminId = getUserId(req);
    const { projectId } = req.params;

    console.log('🗑️ Deleting project:', projectId);

    await Project.findByIdAndDelete(projectId);

    console.log('✅ Project deleted');

    res.json({ message: 'Project deleted successfully' });

    await logActivity('DELETE_PROJECT', adminId, { projectId });
  } catch (error) {
    console.error('❌ Delete project error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// ARCHIVE PROJECT
exports.archiveProject = async (req, res) => {
  try {
    const adminId = getUserId(req);
    const { projectId } = req.params;

    console.log('📦 Archiving project:', projectId);

    const project = await Project.findByIdAndUpdate(
      projectId,
      { isArchived: true },
      { new: true }
    );

    console.log('✅ Project archived');

    res.json({ message: 'Project archived successfully', project });

    await logActivity('ARCHIVE_PROJECT', adminId, { projectId });
  } catch (error) {
    console.error('❌ Archive project error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// RESTORE PROJECT
exports.restoreProject = async (req, res) => {
  try {
    const adminId = getUserId(req);
    const { projectId } = req.params;

    console.log('♻️ Restoring project:', projectId);

    const project = await Project.findByIdAndUpdate(
      projectId,
      { isArchived: false },
      { new: true }
    );

    console.log('✅ Project restored');

    res.json({ message: 'Project restored successfully', project });

    await logActivity('RESTORE_PROJECT', adminId, { projectId });
  } catch (error) {
    console.error('❌ Restore project error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// ==================== CONTENT MODERATION ====================

// GET FLAGGED FEEDBACK
exports.getFlaggedFeedback = async (req, res) => {
  try {
    console.log('🚩 Fetching flagged feedback');

    const feedback = await Feedback.find({ isFlagged: true })
      .populate('reviewerId', 'name email')
      .populate('versionId', 'versionNumber');

    console.log('✅ Flagged feedback fetched:', feedback.length);

    res.json(feedback);
  } catch (error) {
    console.error('❌ Get flagged feedback error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// FLAG FEEDBACK
exports.flagFeedback = async (req, res) => {
  try {
    const adminId = getUserId(req);
    const { feedbackId } = req.params;
    const { reason } = req.body;

    console.log('🚩 Flagging feedback:', feedbackId);

    const feedback = await Feedback.findByIdAndUpdate(
      feedbackId,
      { isFlagged: true, flagReason: reason, flaggedBy: adminId },
      { new: true }
    );

    console.log('✅ Feedback flagged');

    res.json({ message: 'Feedback flagged successfully', feedback });

    await logActivity('FLAG_FEEDBACK', adminId, { feedbackId, reason });
  } catch (error) {
    console.error('❌ Flag feedback error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// DELETE FEEDBACK
exports.deleteFeedback = async (req, res) => {
  try {
    const adminId = getUserId(req);
    const { feedbackId } = req.params;

    console.log('🗑️ Deleting feedback:', feedbackId);

    await Feedback.findByIdAndDelete(feedbackId);

    console.log('✅ Feedback deleted');

    res.json({ message: 'Feedback deleted successfully' });

    await logActivity('DELETE_FEEDBACK', adminId, { feedbackId });
  } catch (error) {
    console.error('❌ Delete feedback error:', error.message);
    res.status(500).json({ message: error.message });
  }
};