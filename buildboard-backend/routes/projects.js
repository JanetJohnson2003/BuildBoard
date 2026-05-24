const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const {
  getProjects,
  createProject,
  deleteProject,
  shareProject,
  removeShareAccess,
  getSharedProjects,
  getProjectById
} = require('../controllers/projectController');

// ✅ IMPORTANT: Put specific routes BEFORE /:id routes!

// Get shared projects (specific route - must come first)
router.get('/shared', auth, getSharedProjects);

// Get all user's projects
router.get('/', auth, getProjects);

// Create project
router.post('/', auth, createProject);

// ✅ NOW put the /:id routes (general routes come last)

// Get single project by ID
router.get('/:id', auth, getProjectById);

// Delete project
router.delete('/:id', auth, deleteProject);

// Share project with users
router.post('/:id/share', auth, shareProject);

// Remove user from shared project
router.delete('/:id/share/:userId', auth, removeShareAccess);

module.exports = router;