const User = require('../models/User');
const Repository = require('../models/Repository');
const Follow = require('../models/Follow');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');
const { emitToUser } = require('../config/socket');

// GET USER PROFILE BY USERNAME
exports.getUserProfile = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username })
      .select('-password -refreshToken')
      .populate('pinnedRepos');

    if (!user) return res.status(404).json({ message: 'User not found' });

    // Count repos
    const repoCount = await Repository.countDocuments({
      owner: user._id,
      visibility: 'public',
    });

    // Count followers/following
    const followerCount = await Follow.countDocuments({ following: user._id });
    const followingCount = await Follow.countDocuments({ follower: user._id });

    // Check if current user follows this user
    let isFollowing = false;
    if (req.user && req.user._id.toString() !== user._id.toString()) {
      const follow = await Follow.findOne({
        follower: req.user._id,
        following: user._id,
      });
      isFollowing = !!follow;
    }

    res.json({
      ...user.toJSON(),
      repoCount,
      followerCount,
      followingCount,
      isFollowing,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET USER REPOS
exports.getUserRepos = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const filter = { owner: user._id };
    // Show private repos only to the owner
    if (!req.user || req.user._id.toString() !== user._id.toString()) {
      filter.visibility = 'public';
    }

    const repos = await Repository.find(filter)
      .populate('owner', 'username name avatar')
      .sort({ updatedAt: -1 });

    res.json(repos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// FOLLOW / UNFOLLOW USER
exports.toggleFollow = async (req, res) => {
  try {
    const { username } = req.params;
    const targetUser = await User.findOne({ username });
    if (!targetUser) return res.status(404).json({ message: 'User not found' });

    if (targetUser._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot follow yourself' });
    }

    const existing = await Follow.findOne({
      follower: req.user._id,
      following: targetUser._id,
    });

    if (existing) {
      await Follow.deleteOne({ _id: existing._id });
      // Update arrays
      await User.findByIdAndUpdate(req.user._id, { $pull: { following: targetUser._id } });
      await User.findByIdAndUpdate(targetUser._id, { $pull: { followers: req.user._id } });

      res.json({ following: false });
    } else {
      await Follow.create({ follower: req.user._id, following: targetUser._id });
      // Update arrays
      await User.findByIdAndUpdate(req.user._id, { $addToSet: { following: targetUser._id } });
      await User.findByIdAndUpdate(targetUser._id, { $addToSet: { followers: req.user._id } });

      // Notify
      const notification = await Notification.create({
        recipient: targetUser._id,
        sender: req.user._id,
        type: 'new_follower',
        title: 'New Follower',
        message: `${req.user.username} started following you`,
      });
      emitToUser(targetUser._id.toString(), 'notification:new', notification);

      await ActivityLog.create({
        action: 'USER_FOLLOWED',
        user: req.user._id,
        referenceType: 'user',
        referenceId: targetUser._id,
        details: { username: targetUser.username },
      });

      res.json({ following: true });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE PROFILE
exports.updateProfile = async (req, res) => {
  try {
    const { name, bio, location, company, skills, socialLinks, avatar } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (bio !== undefined) updates.bio = bio;
    if (location !== undefined) updates.location = location;
    if (company !== undefined) updates.company = company;
    if (skills !== undefined) updates.skills = skills;
    if (socialLinks !== undefined) updates.socialLinks = socialLinks;
    if (avatar !== undefined) updates.avatar = avatar;

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true })
      .select('-password -refreshToken');

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET ALL USERS (for search/admin)
exports.getAllUsers = async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;
    const filter = {};
    if (q) {
      filter.$or = [
        { username: { $regex: q, $options: 'i' } },
        { name: { $regex: q, $options: 'i' } },
      ];
    }

    const users = await User.find(filter)
      .select('username name avatar bio role')
      .limit(parseInt(limit))
      .sort({ name: 1 });

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET USER ACTIVITY
exports.getUserActivity = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const activities = await ActivityLog.find({
      user: user._id,
      isPublic: true,
    })
      .populate('repository', 'name slug')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET CONTRIBUTION DATA (for heatmap)
exports.getContributions = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Get activity counts per day for last 365 days
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const contributions = await ActivityLog.aggregate([
      {
        $match: {
          user: user._id,
          createdAt: { $gte: oneYearAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json(contributions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET FOLLOWERS
exports.getFollowers = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const follows = await Follow.find({ following: user._id })
      .populate('follower', 'username name avatar bio')
      .sort({ createdAt: -1 });

    res.json(follows.map((f) => f.follower));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET FOLLOWING
exports.getFollowing = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const follows = await Follow.find({ follower: user._id })
      .populate('following', 'username name avatar bio')
      .sort({ createdAt: -1 });

    res.json(follows.map((f) => f.following));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const { GoogleGenerativeAI } = require('@google/generative-ai');

exports.getTrendOracle = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ message: 'GEMINI_API_KEY is not configured on the server.' });
    }

    const repos = await Repository.find({ owner: user._id }).select('name language description topics visibility createdAt').limit(20);
    const activities = await ActivityLog.find({ user: user._id }).select('title type createdAt').sort({ createdAt: -1 }).limit(50);

    const repoData = repos.map(r => `${r.name} (${r.language || 'Mixed'}) - ${r.description}`).join('\n');
    const activityData = activities.map(a => `${a.type}: ${a.title}`).join('\n');

    const prompt = `You are an elite Developer Trend Oracle AI. Analyze the following data about the software developer '${username}'.
Repositories:
${repoData || 'No public repositories.'}

Recent Activity:
${activityData || 'No recent activity.'}

Based on this data, predict their past trajectory, current focus, and what their future holds in tech.
Format your output exactly as valid JSON with no markdown wrapping, matching this schema:
{
  "pastTrend": { "title": "string", "description": "string" },
  "currentTrend": { "title": "string", "description": "string" },
  "futurePrediction": { "title": "string", "description": "string" },
  "summary": "string"
}`;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    
    let jsonStr = result.response.text().trim();
    if (jsonStr.startsWith('\`\`\`json')) jsonStr = jsonStr.replace(/^\`\`\`json\n?/, '');
    if (jsonStr.startsWith('\`\`\`')) jsonStr = jsonStr.replace(/^\`\`\`\n?/, '');
    if (jsonStr.endsWith('\`\`\`')) jsonStr = jsonStr.replace(/\n?\`\`\`$/, '');

    res.json(JSON.parse(jsonStr));

  } catch (error) {
    console.error('Trend Oracle Error:', error);
    res.status(500).json({ message: error.message });
  }
};