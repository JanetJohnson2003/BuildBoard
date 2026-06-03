const slugify = require('slugify');

const User = require('../models/User');
const Repository = require('../models/Repository');
const Issue = require('../models/Issue');
const PullRequest = require('../models/PullRequest');
const Discussion = require('../models/Discussion');
const File = require('../models/File');
const Commit = require('../models/Commit');
const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog');
const Organization = require('../models/Organization');
const Team = require('../models/Team');

const contributionDays = async (userId) => {
  const since = new Date();
  since.setDate(since.getDate() - 364);

  const rows = await ActivityLog.aggregate([
    { $match: { user: userId, createdAt: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return rows.map((row) => ({ date: row._id, count: row.count }));
};

exports.getHomeDashboard = async (req, res) => {
  try {
    const userId = req.user._id;
    const ownedRepoIds = (await Repository.find({ owner: userId }).select('_id')).map((repo) => repo._id);

    const [
      recentRepositories,
      assignedIssues,
      pullRequests,
      activityFeed,
      notifications,
      trendingRepositories,
      contributionGraph,
      organizations,
    ] = await Promise.all([
      Repository.find({ owner: userId }).populate('owner', 'username name avatar').sort({ updatedAt: -1 }).limit(10),
      Issue.find({ assignees: userId, status: { $ne: 'closed' } })
        .populate('repository', 'name slug owner')
        .populate('author', 'username name avatar')
        .sort({ updatedAt: -1 })
        .limit(10),
      PullRequest.find({
        $or: [{ author: userId }, { 'reviewers.user': userId }],
        status: 'open',
      })
        .populate('repository', 'name slug owner')
        .populate('author', 'username name avatar')
        .sort({ updatedAt: -1 })
        .limit(10),
      ActivityLog.find({
        $or: [{ user: userId }, { repository: { $in: ownedRepoIds } }],
      })
        .populate('user', 'username name avatar')
        .populate({
          path: 'repository',
          select: 'name slug owner',
          populate: { path: 'owner', select: 'username name avatar' }
        })
        .sort({ createdAt: -1 })
        .limit(20),
      Notification.find({ recipient: userId })
        .populate('sender', 'username name avatar')
        .populate('repository', 'name slug owner')
        .sort({ createdAt: -1 })
        .limit(10),
      Repository.find({ visibility: 'public', isArchived: false })
        .populate('owner', 'username name avatar')
        .sort({ starCount: -1, forkCount: -1, updatedAt: -1 })
        .limit(10),
      contributionDays(userId),
      Organization.find({ 'members.user': userId }).sort({ updatedAt: -1 }).limit(8),
    ]);

    res.json({
      recentRepositories,
      assignedIssues,
      pullRequests,
      activityFeed,
      notifications,
      trendingRepositories,
      contributionGraph,
      organizations,
      stats: {
        repositories: recentRepositories.length,
        assignedIssues: assignedIssues.length,
        pullRequests: pullRequests.length,
        unreadNotifications: notifications.filter((item) => !item.read).length,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.globalSearch = async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    const type = req.query.type || 'all';
    const regex = q ? new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') : /.*/;

    const tasks = {};
    if (type === 'all' || type === 'users') {
      tasks.users = User.find({ $or: [{ username: regex }, { name: regex }, { bio: regex }] })
        .select('username name avatar bio skills')
        .limit(10);
    }
    if (type === 'all' || type === 'repositories') {
      tasks.repositories = Repository.find({
        visibility: 'public',
        $or: [{ name: regex }, { slug: regex }, { description: regex }, { topics: regex }],
      })
        .populate('owner', 'username name avatar')
        .sort({ starCount: -1 })
        .limit(10);
    }
    if (type === 'all' || type === 'issues') {
      tasks.issues = Issue.find({ $or: [{ title: regex }, { body: regex }] })
        .populate('repository', 'name slug owner')
        .populate('author', 'username name avatar')
        .limit(10);
    }
    if (type === 'all' || type === 'pullrequests') {
      tasks.pullRequests = PullRequest.find({ $or: [{ title: regex }, { body: regex }] })
        .populate('repository', 'name slug owner')
        .populate('author', 'username name avatar')
        .limit(10);
    }
    if (type === 'all' || type === 'discussions') {
      tasks.discussions = Discussion.find({ $or: [{ title: regex }, { body: regex }] })
        .populate('repository', 'name slug owner')
        .populate('author', 'username name avatar')
        .limit(10);
    }
    if (type === 'all' || type === 'organizations') {
      tasks.organizations = Organization.find({ $or: [{ name: regex }, { slug: regex }, { description: regex }] }).limit(10);
    }
    if (type === 'all' || type === 'files') {
      tasks.files = File.find({ type: 'file', $or: [{ name: regex }, { path: regex }, { content: regex }] })
        .populate('repository', 'name slug owner')
        .limit(10);
    }
    if (type === 'all' || type === 'commits') {
      tasks.commits = Commit.find({ $or: [{ sha: regex }, { message: regex }] })
        .populate('repository', 'name slug owner')
        .populate('author', 'username name avatar')
        .limit(10);
    }

    const entries = await Promise.all(Object.entries(tasks).map(async ([key, promise]) => [key, await promise]));
    res.json(Object.fromEntries(entries));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createOrganization = async (req, res) => {
  try {
    const { name, description, visibility, website, location } = req.body;
    if (!name) return res.status(400).json({ message: 'Organization name is required' });

    const slug = slugify(req.body.slug || name, { lower: true, strict: true });
    const org = await Organization.create({
      name,
      slug,
      description: description || '',
      visibility: visibility || 'public',
      website: website || '',
      location: location || '',
      owners: [req.user._id],
      members: [{ user: req.user._id, role: 'owner' }],
    });

    await ActivityLog.create({
      action: 'ORG_CREATED',
      user: req.user._id,
      referenceType: 'organization',
      referenceId: org._id,
      details: { name: org.name, slug: org.slug },
    });

    res.status(201).json(org);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getOrganizations = async (req, res) => {
  try {
    const orgs = await Organization.find({
      $or: [{ visibility: 'public' }, { 'members.user': req.user._id }],
    }).sort({ updatedAt: -1 });
    res.json(orgs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getOrganization = async (req, res) => {
  try {
    const org = await Organization.findOne({ slug: req.params.org })
      .populate('members.user', 'username name avatar role')
      .populate('owners', 'username name avatar');
    if (!org) return res.status(404).json({ message: 'Organization not found' });

    const [teams, repositories] = await Promise.all([
      Team.find({ organization: org._id }).populate('members.user', 'username name avatar'),
      Repository.find({ organization: org._id }).populate('owner', 'username name avatar').sort({ updatedAt: -1 }),
    ]);

    res.json({ organization: org, teams, repositories });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createTeam = async (req, res) => {
  try {
    const org = await Organization.findOne({ slug: req.params.org });
    if (!org) return res.status(404).json({ message: 'Organization not found' });

    const requester = org.members.find((member) => member.user.toString() === req.user._id.toString());
    if (!requester || !['owner', 'admin'].includes(requester.role)) {
      return res.status(403).json({ message: 'Organization admin access required' });
    }

    const slug = slugify(req.body.slug || req.body.name, { lower: true, strict: true });
    const team = await Team.create({
      organization: org._id,
      name: req.body.name,
      slug,
      description: req.body.description || '',
      privacy: req.body.privacy || 'visible',
      members: req.body.members || [{ user: req.user._id, role: 'maintainer' }],
      repositories: req.body.repositories || [],
    });

    await ActivityLog.create({
      action: 'TEAM_CREATED',
      user: req.user._id,
      referenceType: 'team',
      referenceId: team._id,
      details: { organization: org.slug, team: team.slug },
    });

    res.status(201).json(team);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.executeCode = async (req, res) => {
  try {
    const { code, language } = req.body;
    if (!code) return res.status(400).json({ message: 'Code is required' });

    const { execFile } = require('child_process');
    const fs = require('fs').promises;
    const os = require('os');
    const path = require('path');
    
    // Create a temporary directory
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'buildboard-run-'));
    let tempFile = '';
    let cmd = '';
    let args = [];

    if (language === 'javascript' || language === 'typescript') {
      tempFile = path.join(tempDir, 'script.js');
      await fs.writeFile(tempFile, code);
      cmd = 'node';
      args = [tempFile];
    } else if (language === 'python') {
      tempFile = path.join(tempDir, 'script.py');
      await fs.writeFile(tempFile, code);
      cmd = 'python';
      args = [tempFile];
    } else {
      return res.status(400).json({ message: 'Unsupported language for execution. Currently only JavaScript and Python are supported.' });
    }

    // Execute with a timeout of 5 seconds to prevent infinite loops
    execFile(cmd, args, { timeout: 5000, maxBuffer: 1024 * 1024 }, async (error, stdout, stderr) => {
      // Cleanup temp dir
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch (e) {
        console.error('Failed to cleanup temp dir:', e);
      }

      if (error && error.killed) {
        return res.status(200).json({ stdout: '', stderr: 'Execution timed out (5s limit)' });
      }
      
      res.status(200).json({
        stdout: stdout || '',
        stderr: stderr || (error ? error.message : '')
      });
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
