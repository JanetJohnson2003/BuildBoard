const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const adminController = require('../controllers/adminController');

console.log('✅ Admin routes loading...');

// ✅ Middleware to check if user is admin
const adminOnly = (req, res, next) => {
  const user = req.user;
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// ✅ Middleware to check if user is admin or reviewer
const reviewerOrAdmin = (req, res, next) => {
  const user = req.user;
  if (!user || (user.role !== 'admin' && user.role !== 'reviewer')) {
    return res.status(403).json({ message: 'Admin or Reviewer access required' });
  }
  next();
};

// ===== USER MANAGEMENT =====
router.get('/users', auth, adminOnly, adminController.getAllUsers);
router.post('/users', auth, adminOnly, adminController.createUser);
router.get('/users/:userId', auth, adminOnly, adminController.getUserDetails);
router.put('/users/:userId/role', auth, adminOnly, adminController.changeUserRole);
router.put('/users/:userId/ban', auth, adminOnly, adminController.banUser);
router.put('/users/:userId/unban', auth, adminOnly, adminController.unbanUser);
router.delete('/users/:userId', auth, adminOnly, adminController.deleteUser);

// ===== SYSTEM BROADCAST =====
router.post('/broadcast', auth, adminOnly, adminController.systemBroadcast);

// ===== SYSTEM ANALYTICS =====
router.get('/analytics/dashboard', auth, adminOnly, adminController.getDashboardAnalytics);
router.get('/analytics/users', auth, adminOnly, adminController.getUsersAnalytics);
router.get('/analytics/projects', auth, adminOnly, adminController.getProjectsAnalytics);
router.get('/analytics/feedback', auth, adminOnly, adminController.getFeedbackAnalytics);
router.get('/analytics/activities', auth, adminOnly, adminController.getActivityAnalytics);

// ===== ACTIVITY LOGGING =====
router.get('/logs', auth, adminOnly, adminController.getActivityLogs);
router.get('/logs/export', auth, adminOnly, adminController.exportLogs);
router.delete('/logs/:logId', auth, adminOnly, adminController.deleteLog);

// ===== PROJECT MANAGEMENT =====
router.get('/projects', auth, adminOnly, adminController.getAllProjects);
router.get('/projects/:projectId', auth, adminOnly, adminController.getProjectDetails);
router.delete('/projects/:projectId', auth, adminOnly, adminController.deleteProject);
router.put('/projects/:projectId/archive', auth, adminOnly, adminController.archiveProject);
router.put('/projects/:projectId/restore', auth, adminOnly, adminController.restoreProject);

// ===== REPOSITORY MANAGEMENT =====
router.get('/repos', auth, reviewerOrAdmin, adminController.getAllRepositories);

// ===== CONTENT MODERATION =====
router.get('/moderation/feedback', auth, reviewerOrAdmin, adminController.getFlaggedFeedback);
router.put('/feedback/:feedbackId/flag', auth, reviewerOrAdmin, adminController.flagFeedback);
router.delete('/feedback/:feedbackId', auth, reviewerOrAdmin, adminController.deleteFeedback);
router.put('/users/:userId/warn', auth, reviewerOrAdmin, adminController.warnUser);

console.log('✅ Admin routes loaded successfully');

module.exports = router;