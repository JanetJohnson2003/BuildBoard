const Issue = require('../models/Issue');
const Repository = require('../models/Repository');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog');
const Label = require('../models/Label');
const Milestone = require('../models/Milestone');
const { emitToUser, emitToRepo } = require('../config/socket');

// Helper to get next issue number
const getNextNumber = async (repoId) => {
  const lastIssue = await Issue.findOne({ repository: repoId }).sort({ number: -1 });
  const lastPR = require('../models/PullRequest');
  const lastPr = await lastPR.findOne({ repository: repoId }).sort({ number: -1 });
  const maxIssue = lastIssue ? lastIssue.number : 0;
  const maxPr = lastPr ? lastPr.number : 0;
  return Math.max(maxIssue, maxPr) + 1;
};

// Helper to check read access
const canRead = (req, repoDoc) => {
  if (repoDoc.visibility === 'public') return true;
  if (req.user?.role === 'reviewer' || req.user?.role === 'admin') return true;

  const userId = req.user?._id?.toString();
  if (!userId) return false;

  if (repoDoc.owner?._id?.toString() === userId) return true;

  return repoDoc.collaborators?.some((collaborator) => {
    const collaboratorId = collaborator.user?._id?.toString?.() || collaborator.user?.toString();
    return collaboratorId === userId;
  });
};

// GET ISSUES FOR REPO
exports.getIssues = async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const { status = 'open', label, assignee, sort = 'newest' } = req.query;

    const repoDoc = await Repository.findOne({ slug: repo }).populate('owner', 'username');
    if (!repoDoc || repoDoc.owner.username !== owner) {
      return res.status(404).json({ message: 'Repository not found' });
    }
    if (!canRead(req, repoDoc)) {
      return res.status(404).json({ message: 'Repository not found' });
    }

    const filter = { repository: repoDoc._id };
    if (status !== 'all') filter.status = status;
    if (assignee) filter.assignees = assignee;

    let sortOption = { createdAt: -1 };
    if (sort === 'oldest') sortOption = { createdAt: 1 };
    if (sort === 'most-commented') sortOption = { commentCount: -1 };
    if (sort === 'recently-updated') sortOption = { updatedAt: -1 };

    let issues = await Issue.find(filter)
      .populate('author', 'username name avatar')
      .populate('assignees', 'username name avatar')
      .populate('labels')
      .sort(sortOption);

    if (label) {
      issues = issues.filter((i) =>
        i.labels.some((l) => l.name === label)
      );
    }

    const openCount = await Issue.countDocuments({ repository: repoDoc._id, status: { $ne: 'closed' } });
    const closedCount = await Issue.countDocuments({ repository: repoDoc._id, status: 'closed' });

    res.json({ issues, openCount, closedCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET ISSUES GROUPED FOR BOARD VIEW
exports.getIssueBoard = async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const repoDoc = await Repository.findOne({ slug: repo }).populate('owner', 'username');
    if (!repoDoc || repoDoc.owner.username !== owner) {
      return res.status(404).json({ message: 'Repository not found' });
    }
    if (!canRead(req, repoDoc)) {
      return res.status(404).json({ message: 'Repository not found' });
    }

    const issues = await Issue.find({ repository: repoDoc._id })
      .populate('author', 'username name avatar')
      .populate('assignees', 'username name avatar')
      .populate('labels')
      .sort({ dueDate: 1, priority: -1, updatedAt: -1 });

    const columns = ['open', 'in_progress', 'review', 'testing', 'closed'].map((status) => ({
      status,
      title: status.replace('_', ' '),
      issues: issues.filter((issue) => issue.status === status),
    }));

    res.json({ columns });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getLabels = async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const repoDoc = await Repository.findOne({ slug: repo }).populate('owner', 'username');
    if (!repoDoc || repoDoc.owner.username !== owner) {
      return res.status(404).json({ message: 'Repository not found' });
    }
    if (!canRead(req, repoDoc)) {
      return res.status(404).json({ message: 'Repository not found' });
    }
    const labels = await Label.find({ repository: repoDoc._id }).sort({ name: 1 });
    res.json(labels);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createLabel = async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const repoDoc = await Repository.findOne({ slug: repo }).populate('owner', 'username');
    if (!repoDoc || repoDoc.owner.username !== owner) {
      return res.status(404).json({ message: 'Repository not found' });
    }
    if (!canRead(req, repoDoc)) {
      return res.status(404).json({ message: 'Repository not found' });
    }
    const label = await Label.create({
      repository: repoDoc._id,
      name: req.body.name,
      color: req.body.color || '#e4e669',
      description: req.body.description || '',
    });
    res.status(201).json(label);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMilestones = async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const repoDoc = await Repository.findOne({ slug: repo }).populate('owner', 'username');
    if (!repoDoc || repoDoc.owner.username !== owner) {
      return res.status(404).json({ message: 'Repository not found' });
    }
    if (!canRead(req, repoDoc)) {
      return res.status(404).json({ message: 'Repository not found' });
    }
    const milestones = await Milestone.find({ repository: repoDoc._id }).sort({ dueDate: 1 });
    res.json(milestones);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createMilestone = async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const repoDoc = await Repository.findOne({ slug: repo }).populate('owner', 'username');
    if (!repoDoc || repoDoc.owner.username !== owner) {
      return res.status(404).json({ message: 'Repository not found' });
    }
    if (!canRead(req, repoDoc)) {
      return res.status(404).json({ message: 'Repository not found' });
    }
    const milestone = await Milestone.create({
      repository: repoDoc._id,
      title: req.body.title,
      description: req.body.description || '',
      dueDate: req.body.dueDate || null,
    });
    res.status(201).json(milestone);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET SINGLE ISSUE
exports.getIssue = async (req, res) => {
  try {
    const { owner, repo, number } = req.params;
    const repoDoc = await Repository.findOne({ slug: repo }).populate('owner', 'username');
    if (!repoDoc || repoDoc.owner.username !== owner) {
      return res.status(404).json({ message: 'Repository not found' });
    }
    if (!canRead(req, repoDoc)) {
      return res.status(404).json({ message: 'Repository not found' });
    }

    const issue = await Issue.findOne({ repository: repoDoc._id, number: parseInt(number) })
      .populate('author', 'username name avatar')
      .populate('assignees', 'username name avatar')
      .populate('labels')
      .populate('milestone')
      .populate('closedBy', 'username name avatar');

    if (!issue) return res.status(404).json({ message: 'Issue not found' });

    // Get comments
    const comments = await Comment.find({
      commentableType: 'issue',
      commentableId: issue._id,
    })
      .populate('author', 'username name avatar')
      .sort({ createdAt: 1 });

    res.json({ issue, comments });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// CREATE ISSUE
exports.createIssue = async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const { title, body, labels, assignees, milestone, priority } = req.body;

    if (!title) return res.status(400).json({ message: 'Issue title is required' });

    const repoDoc = await Repository.findOne({ slug: repo }).populate('owner', 'username');
    if (!repoDoc || repoDoc.owner.username !== owner) {
      return res.status(404).json({ message: 'Repository not found' });
    }
    if (!canRead(req, repoDoc)) {
      return res.status(404).json({ message: 'Repository not found' });
    }

    const number = await getNextNumber(repoDoc._id);

    const issue = await Issue.create({
      repository: repoDoc._id,
      number,
      title,
      body: body || '',
      author: req.user._id,
      labels: labels || [],
      assignees: assignees || [],
      milestone: milestone || null,
      priority: priority || 'medium',
    });

    // Update repo open issue count
    repoDoc.openIssueCount += 1;
    await repoDoc.save();

    // Log activity
    await ActivityLog.create({
      action: 'ISSUE_OPENED',
      user: req.user._id,
      repository: repoDoc._id,
      referenceType: 'issue',
      referenceId: issue._id,
      details: { title: issue.title, number: issue.number },
    });

    // Notify assignees
    if (assignees && assignees.length > 0) {
      for (const assigneeId of assignees) {
        if (assigneeId.toString() !== req.user._id.toString()) {
          const notification = await Notification.create({
            recipient: assigneeId,
            sender: req.user._id,
            type: 'issue_assigned',
            title: 'Issue Assigned',
            message: `${req.user.username} assigned you to #${number} ${title}`,
            repository: repoDoc._id,
            referenceType: 'issue',
            referenceId: issue._id,
          });
          emitToUser(assigneeId.toString(), 'notification:new', notification);
        }
      }
    }

    emitToRepo(repoDoc._id.toString(), 'issue:created', issue);

    await issue.populate('author', 'username name avatar');
    await issue.populate('labels');

    res.status(201).json(issue);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE ISSUE (close/reopen/edit)
exports.updateIssue = async (req, res) => {
  try {
    const { owner, repo, number } = req.params;
    const { title, body, status, labels, assignees, milestone, priority } = req.body;

    const repoDoc = await Repository.findOne({ slug: repo }).populate('owner', 'username');
    if (!repoDoc || repoDoc.owner.username !== owner) {
      return res.status(404).json({ message: 'Repository not found' });
    }
    if (!canRead(req, repoDoc)) {
      return res.status(404).json({ message: 'Repository not found' });
    }

    const issue = await Issue.findOne({ repository: repoDoc._id, number: parseInt(number) });
    if (!issue) return res.status(404).json({ message: 'Issue not found' });

    if (title !== undefined) issue.title = title;
    if (body !== undefined) issue.body = body;
    if (labels !== undefined) issue.labels = labels;
    if (assignees !== undefined) issue.assignees = assignees;
    if (milestone !== undefined) issue.milestone = milestone;
    if (priority !== undefined) issue.priority = priority;

    if (status !== undefined && status !== issue.status) {
      const prevStatus = issue.status;
      issue.status = status;
      if (status === 'closed') {
        issue.closedBy = req.user._id;
        issue.closedAt = new Date();
        repoDoc.openIssueCount = Math.max(0, repoDoc.openIssueCount - 1);
        await ActivityLog.create({
          action: 'ISSUE_CLOSED',
          user: req.user._id,
          repository: repoDoc._id,
          referenceType: 'issue',
          referenceId: issue._id,
          details: { title: issue.title, number: issue.number },
        });
      } else if (status === 'open' && prevStatus === 'closed') {
        issue.closedBy = null;
        issue.closedAt = null;
        repoDoc.openIssueCount += 1;
        await ActivityLog.create({
          action: 'ISSUE_REOPENED',
          user: req.user._id,
          repository: repoDoc._id,
          referenceType: 'issue',
          referenceId: issue._id,
          details: { title: issue.title, number: issue.number },
        });
      }
      await repoDoc.save();
    }

    await issue.save();
    await issue.populate('author', 'username name avatar');
    await issue.populate('labels');
    await issue.populate('assignees', 'username name avatar');

    res.json(issue);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ADD COMMENT TO ISSUE
exports.addComment = async (req, res) => {
  try {
    const { owner, repo, number } = req.params;
    const { body } = req.body;

    if (!body) return res.status(400).json({ message: 'Comment body is required' });

    const repoDoc = await Repository.findOne({ slug: repo }).populate('owner', 'username');
    if (!repoDoc || repoDoc.owner.username !== owner) {
      return res.status(404).json({ message: 'Repository not found' });
    }
    if (!canRead(req, repoDoc)) {
      return res.status(404).json({ message: 'Repository not found' });
    }

    const issue = await Issue.findOne({ repository: repoDoc._id, number: parseInt(number) });
    if (!issue) return res.status(404).json({ message: 'Issue not found' });

    const comment = await Comment.create({
      body,
      author: req.user._id,
      commentableType: 'issue',
      commentableId: issue._id,
    });

    issue.commentCount += 1;
    await issue.save();

    // Notify issue author
    if (issue.author.toString() !== req.user._id.toString()) {
      const notification = await Notification.create({
        recipient: issue.author,
        sender: req.user._id,
        type: 'issue_comment',
        title: 'New Comment',
        message: `${req.user.username} commented on #${issue.number} ${issue.title}`,
        repository: repoDoc._id,
        referenceType: 'issue',
        referenceId: issue._id,
      });
      emitToUser(issue.author.toString(), 'notification:new', notification);
    }

    await comment.populate('author', 'username name avatar');

    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
