const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const {
  createProject,
  getProjects,
  shareProject
} = require('../controllers/projectController');

router.post('/', auth, createProject);
router.get('/', auth, getProjects);
router.post('/share', auth, shareProject);

module.exports = router;