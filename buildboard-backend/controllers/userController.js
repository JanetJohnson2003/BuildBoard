const User = require('../models/User');

// GET ALL USERS (for sharing - ONLY REVIEWERS)
exports.getAllUsers = async (req, res) => {
  try {
    // Only return users with role 'reviewer'
    const users = await User.find({ 
      role: 'reviewer',
      _id: { $ne: req.userId } // Exclude current user
    })
      .select('_id name email role')
      .sort({ name: 1 });

    console.log('✅ Reviewers fetched:', users.length);
    res.json(users);
  } catch (error) {
    console.error('❌ Error fetching reviewers:', error);
    res.status(500).json({ message: error.message });
  }
};

// GET ALL REVIEWERS (same as getAllUsers now)
exports.getAllReviewers = async (req, res) => {
  try {
    const reviewers = await User.find({ role: 'reviewer' })
      .select('_id name email role')
      .sort({ name: 1 });

    console.log('✅ Reviewers fetched:', reviewers.length);
    res.json(reviewers);
  } catch (error) {
    console.error('❌ Error fetching reviewers:', error);
    res.status(500).json({ message: error.message });
  }
};