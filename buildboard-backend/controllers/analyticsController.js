const Repository = require('../models/Repository');
const Issue = require('../models/Issue');
const PullRequest = require('../models/PullRequest');
const Commit = require('../models/Commit');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');

// DASHBOARD ANALYTICS FOR CURRENT USER
exports.getDashboardAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;

    const repoCount = await Repository.countDocuments({ owner: userId });
    const openIssues = await Issue.countDocuments({ assignees: userId, status: 'open' });
    const openPRs = await PullRequest.countDocuments({ author: userId, status: 'open' });
    const totalCommits = await Commit.countDocuments({ author: userId });

    // Commits over last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const commitsOverTime = await Commit.aggregate([
      { $match: { author: userId, createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Issues open vs closed for user's repos
    const userRepoIds = (await Repository.find({ owner: userId }).select('_id')).map((r) => r._id);
    const issueStats = await Issue.aggregate([
      { $match: { repository: { $in: userRepoIds } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // PR stats
    const prStats = await PullRequest.aggregate([
      { $match: { repository: { $in: userRepoIds } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // Languages breakdown
    const languageStats = await Repository.aggregate([
      { $match: { owner: userId, language: { $ne: '' } } },
      { $group: { _id: '$language', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    res.json({
      stats: { repoCount, openIssues, openPRs, totalCommits },
      commitsOverTime,
      issueStats,
      prStats,
      languageStats,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ADMIN PLATFORM ANALYTICS
exports.getAdminAnalytics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalRepos = await Repository.countDocuments();
    const totalIssues = await Issue.countDocuments();
    const totalPRs = await PullRequest.countDocuments();
    const totalCommits = await Commit.countDocuments();

    // Users by role
    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]);

    // New users last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const newUsersOverTime = await User.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Repos created over time
    const reposOverTime = await Repository.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Most starred repos
    const topRepos = await Repository.find()
      .populate('owner', 'username name avatar')
      .sort({ starCount: -1 })
      .limit(10);

    // Recent activity
    const recentActivity = await ActivityLog.find()
      .populate('user', 'username name avatar')
      .populate('repository', 'name slug')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      stats: { totalUsers, totalRepos, totalIssues, totalPRs, totalCommits },
      usersByRole,
      newUsersOverTime,
      reposOverTime,
      topRepos,
      recentActivity,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// REPO ANALYTICS
exports.getRepoAnalytics = async (req, res) => {
  try {
    const { owner, repo } = req.params;
    
    const ownerDoc = await User.findOne({ username: owner });
    if (!ownerDoc) return res.status(404).json({ message: 'Owner not found' });
    
    const repoDoc = await Repository.findOne({ owner: ownerDoc._id, slug: repo }).populate('owner', 'username');
    if (!repoDoc) {
      return res.status(404).json({ message: 'Repository not found' });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const commitsOverTime = await Commit.aggregate([
      { $match: { repository: repoDoc._id, createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const contributorStats = await Commit.aggregate([
      { $match: { repository: repoDoc._id } },
      { $group: { _id: '$author', commits: { $sum: 1 } } },
      { $sort: { commits: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          username: '$user.username',
          name: '$user.name',
          avatar: '$user.avatar',
          commits: 1,
        },
      },
    ]);

    const issueStats = await Issue.aggregate([
      { $match: { repository: repoDoc._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const prStats = await PullRequest.aggregate([
      { $match: { repository: repoDoc._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // Project health score
    const openIssues = await Issue.countDocuments({ repository: repoDoc._id, status: 'open' });
    const closedIssues = await Issue.countDocuments({ repository: repoDoc._id, status: 'closed' });
    const mergedPRs = await PullRequest.countDocuments({ repository: repoDoc._id, status: 'merged' });
    const totalPRs = await PullRequest.countDocuments({ repository: repoDoc._id });
    const recentCommits = await Commit.countDocuments({
      repository: repoDoc._id,
      createdAt: { $gte: thirtyDaysAgo },
    });

    const issueResolutionRate = closedIssues + openIssues > 0
      ? Math.round((closedIssues / (closedIssues + openIssues)) * 100)
      : 100;
    const prMergeRate = totalPRs > 0
      ? Math.round((mergedPRs / totalPRs) * 100)
      : 100;
    const activityScore = Math.min(100, recentCommits * 5);
    const healthScore = Math.round((issueResolutionRate + prMergeRate + activityScore) / 3);

    res.json({
      commitsOverTime,
      contributorStats,
      issueStats,
      prStats,
      healthScore: {
        overall: healthScore,
        issueResolutionRate,
        prMergeRate,
        activityScore,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};