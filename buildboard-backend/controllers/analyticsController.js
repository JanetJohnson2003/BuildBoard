const Project = require('../models/Project');
const Version = require('../models/Version');
const Feedback = require('../models/Feedback');

// GET DASHBOARD ANALYTICS
exports.getDashboardAnalytics = async (req, res) => {
  try {
    const userId = req.userId;

    // Total projects (owned + shared)
    const totalProjects = await Project.countDocuments({
      $or: [
        { createdBy: userId },
        { sharedWith: userId }
      ]
    });

    // Total versions
    const totalVersions = await Version.countDocuments();

    // Get all feedback
    const allFeedback = await Feedback.find()
      .populate('version')
      .select('rating version');

    // Calculate average rating
    const avgRating = allFeedback.length > 0
      ? (allFeedback.reduce((sum, fb) => sum + fb.rating, 0) / allFeedback.length).toFixed(1)
      : 0;

    // Count feedback by rating (for chart)
    const ratingCounts = {
      1: allFeedback.filter(fb => fb.rating === 1).length,
      2: allFeedback.filter(fb => fb.rating === 2).length,
      3: allFeedback.filter(fb => fb.rating === 3).length,
      4: allFeedback.filter(fb => fb.rating === 4).length,
      5: allFeedback.filter(fb => fb.rating === 5).length,
    };

    // Projects created by user
    const userProjects = await Project.countDocuments({ createdBy: userId });

    // Projects shared with user
    const sharedProjects = await Project.countDocuments({ sharedWith: userId });

    // Total feedback count
    const totalFeedback = allFeedback.length;

    res.json({
      totalProjects,
      userProjects,
      sharedProjects,
      totalVersions,
      totalFeedback,
      avgRating,
      ratingCounts
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ message: error.message });
  }
};

// GET USER STATS
exports.getUserStats = async (req, res) => {
  try {
    const userId = req.userId;

    // Get user's projects
    const userProjects = await Project.find({ createdBy: userId })
      .select('_id title')
      .lean();

    const projectIds = userProjects.map(p => p._id);

    // Get versions for user's projects
    const versions = await Version.find({ project: { $in: projectIds } })
      .select('_id createdAt')
      .lean();

    // Group versions by month
    const versionsByMonth = {};
    versions.forEach(v => {
      const month = new Date(v.createdAt).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short' 
      });
      versionsByMonth[month] = (versionsByMonth[month] || 0) + 1;
    });

    // Sort by date
    const sortedMonths = Object.keys(versionsByMonth).sort((a, b) => 
      new Date(a) - new Date(b)
    ).slice(-6); // Last 6 months

    const versionCounts = sortedMonths.map(month => versionsByMonth[month] || 0);

    res.json({
      months: sortedMonths,
      versionCounts,
      totalVersions: versions.length
    });
  } catch (error) {
    console.error('User stats error:', error);
    res.status(500).json({ message: error.message });
  }
};