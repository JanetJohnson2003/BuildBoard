const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const Project = require('../models/Project');

// ✅ GET shared projects for current user
router.get('/', auth, async (req, res) => {
  try {
    console.log('📥 Fetching shared projects for user:', req.user.id);
    
    // Find projects where current user is in sharedWith array
    const projects = await Project.find({
      sharedWith: req.user.id
    })
      .populate('createdBy', 'name email')
      .populate('sharedWith', 'name email')
      .sort('-createdAt');

    console.log('✅ Shared projects found:', projects.length);
    res.json(projects);
  } catch (error) {
    console.error('❌ Error fetching shared projects:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;