const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const User = require('../models/User');

// ✅ GET ALL USERS (for sharing)
router.get('/', auth, async (req, res) => {
  try {
    console.log('📥 Fetching all users for sharing');
    console.log('User ID:', req.userId);

    const users = await User.find()
      .select('_id name email role')
      .sort('name');

    console.log('✅ Total users found:', users.length);

    // Remove current user from list
    const filteredUsers = users.filter(
      user => user._id.toString() !== req.userId
    );

    console.log('✅ Filtered users (excluding self):', filteredUsers.length);
    res.json(filteredUsers);
  } catch (error) {
    console.error('❌ Get users error:', error.message);
    res.status(500).json({ message: error.message });
  }
});

// SEARCH USERS BY NAME/EMAIL
router.get('/search/:query', auth, async (req, res) => {
  try {
    const { query } = req.params;

    console.log('🔍 Searching users:', query);

    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    })
      .select('_id name email role')
      .sort('name')
      .limit(10);

    console.log('✅ Found users:', users.length);

    // Remove current user
    const filteredUsers = users.filter(
      user => user._id.toString() !== req.userId
    );

    console.log('✅ Filtered search results:', filteredUsers.length);
    res.json(filteredUsers);
  } catch (error) {
    console.error('❌ Search users error:', error.message);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;