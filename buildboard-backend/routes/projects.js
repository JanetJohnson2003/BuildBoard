const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const {
  getProjects,
  createProject,
  getProject,
  shareProject,
  removeAccess,
  deleteProject
} = require('../controllers/projectController');

// Get all projects
router.get('/', auth, getProjects);

// Create project
router.post('/', auth, createProject);

// Get single project
router.get('/:id', auth, getProject);

// Share project with user
router.post('/share', auth, shareProject);

// Remove access
router.post('/remove-access', auth, removeAccess);

// Delete project
router.delete('/:id', auth, deleteProject);

module.exports = router;