const PullRequest = require('../models/PullRequest');
const Repository = require('../models/Repository');
const Branch = require('../models/Branch');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog');
const Issue = require('../models/Issue');
const PullRequestReview = require('../models/PullRequestReview');
const { emitToUser, emitToRepo } = require('../config/socket');

const getNextNumber = async (repoId) => {
  const lastIssue = await Issue.findOne({ repository: repoId }).sort({ number: -1 });
  const lastPr = await PullRequest.findOne({ repository: repoId }).sort({ number: -1 });
  const maxIssue = lastIssue ? lastIssue.number : 0;
  const maxPr = lastPr ? lastPr.number : 0;
  return Math.max(maxIssue, maxPr) + 1;
};

// GET PRS FOR REPO
exports.getPullRequests = async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const { status = 'open' } = req.query;

    const repoDoc = await Repository.findOne({ slug: repo }).populate('owner', 'username');
    if (!repoDoc || repoDoc.owner.username !== owner) {
      return res.status(404).json({ message: 'Repository not found' });
    }

    const filter = { repository: repoDoc._id };
    if (status !== 'all') filter.status = status;

    const prs = await PullRequest.find(filter)
      .populate('author', 'username name avatar')
      .populate('sourceBranch', 'name')
      .populate('targetBranch', 'name')
      .populate('labels')
      .populate('reviewers.user', 'username name avatar')
      .sort({ createdAt: -1 });

    const openCount = await PullRequest.countDocuments({ repository: repoDoc._id, status: 'open' });
    const closedCount = await PullRequest.countDocuments({ repository: repoDoc._id, status: 'closed' });
    const mergedCount = await PullRequest.countDocuments({ repository: repoDoc._id, status: 'merged' });

    res.json({ pullRequests: prs, openCount, closedCount, mergedCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET SINGLE PR
exports.getPullRequest = async (req, res) => {
  try {
    const { owner, repo, number } = req.params;
    const repoDoc = await Repository.findOne({ slug: repo }).populate('owner', 'username');
    if (!repoDoc || repoDoc.owner.username !== owner) {
      return res.status(404).json({ message: 'Repository not found' });
    }

    const pr = await PullRequest.findOne({ repository: repoDoc._id, number: parseInt(number) })
      .populate('author', 'username name avatar')
      .populate('sourceBranch', 'name')
      .populate('targetBranch', 'name')
      .populate('labels')
      .populate('reviewers.user', 'username name avatar')
      .populate('assignees', 'username name avatar')
      .populate('mergedBy', 'username name avatar')
      .populate('commits');

    if (!pr) return res.status(404).json({ message: 'Pull request not found' });

    const comments = await Comment.find({
      commentableType: 'pullrequest',
      commentableId: pr._id,
    })
      .populate('author', 'username name avatar')
      .sort({ createdAt: 1 });

    res.json({ pullRequest: pr, comments });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// CREATE PR
exports.createPullRequest = async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const { title, body, sourceBranch, targetBranch, reviewers, labels, isDraft } = req.body;

    if (!title) return res.status(400).json({ message: 'Title is required' });
    if (!sourceBranch || !targetBranch) {
      return res.status(400).json({ message: 'Source and target branches are required' });
    }

    const repoDoc = await Repository.findOne({ slug: repo }).populate('owner', 'username');
    if (!repoDoc || repoDoc.owner.username !== owner) {
      return res.status(404).json({ message: 'Repository not found' });
    }

    const srcBranch = await Branch.findOne({ repository: repoDoc._id, name: sourceBranch });
    const tgtBranch = await Branch.findOne({ repository: repoDoc._id, name: targetBranch });
    if (!srcBranch || !tgtBranch) {
      return res.status(404).json({ message: 'Branch not found' });
    }

    const number = await getNextNumber(repoDoc._id);

    const pr = await PullRequest.create({
      repository: repoDoc._id,
      number,
      title,
      body: body || '',
      author: req.user._id,
      sourceBranch: srcBranch._id,
      targetBranch: tgtBranch._id,
      reviewers: (reviewers || []).map((userId) => ({ user: userId, status: 'pending' })),
      labels: labels || [],
      isDraft: isDraft || false,
    });

    repoDoc.openPrCount += 1;
    await repoDoc.save();

    await ActivityLog.create({
      action: 'PR_OPENED',
      user: req.user._id,
      repository: repoDoc._id,
      referenceType: 'pullrequest',
      referenceId: pr._id,
      details: { title, number },
    });

    // Notify reviewers
    if (reviewers && reviewers.length > 0) {
      for (const reviewerId of reviewers) {
        if (reviewerId.toString() !== req.user._id.toString()) {
          const notification = await Notification.create({
            recipient: reviewerId,
            sender: req.user._id,
            type: 'pr_review_requested',
            title: 'Review Requested',
            message: `${req.user.username} requested your review on #${number} ${title}`,
            repository: repoDoc._id,
            referenceType: 'pullrequest',
            referenceId: pr._id,
          });
          emitToUser(reviewerId.toString(), 'notification:new', notification);
        }
      }
    }

    emitToRepo(repoDoc._id.toString(), 'pr:created', pr);

    await pr.populate('author', 'username name avatar');
    await pr.populate('sourceBranch', 'name');
    await pr.populate('targetBranch', 'name');

    res.status(201).json(pr);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// REVIEW PR
exports.reviewPullRequest = async (req, res) => {
  try {
    const { owner, repo, number } = req.params;
    const { status, comment, inlineComments } = req.body;

    if (!['commented', 'approved', 'changes_requested'].includes(status)) {
      return res.status(400).json({ message: 'Status must be commented, approved, or changes_requested' });
    }

    const repoDoc = await Repository.findOne({ slug: repo }).populate('owner', 'username');
    if (!repoDoc || repoDoc.owner.username !== owner) {
      return res.status(404).json({ message: 'Repository not found' });
    }

    const pr = await PullRequest.findOne({ repository: repoDoc._id, number: parseInt(number) });
    if (!pr) return res.status(404).json({ message: 'Pull request not found' });

    // Update or add review
    const reviewerIndex = pr.reviewers.findIndex(
      (r) => r.user.toString() === req.user._id.toString()
    );

    if (reviewerIndex >= 0) {
      pr.reviewers[reviewerIndex].status = status;
      pr.reviewers[reviewerIndex].reviewedAt = new Date();
      pr.reviewers[reviewerIndex].comment = comment || '';
    } else {
      pr.reviewers.push({
        user: req.user._id,
        status,
        reviewedAt: new Date(),
        comment: comment || '',
      });
    }

    pr.reviewDecision = status;
    await pr.save();

    await PullRequestReview.create({
      pullRequest: pr._id,
      reviewer: req.user._id,
      status,
      body: comment || '',
      inlineComments: inlineComments || [],
    });

    // Notify PR author
    const notifType = status === 'approved' ? 'pr_approved' : status === 'changes_requested' ? 'pr_changes_requested' : 'pr_comment';
    const notifTitle = status === 'approved' ? 'PR Approved' : status === 'changes_requested' ? 'Changes Requested' : 'PR Review Commented';
    const notifMsg = status === 'approved'
      ? `${req.user.username} approved #${pr.number} ${pr.title}`
      : status === 'changes_requested'
        ? `${req.user.username} requested changes on #${pr.number} ${pr.title}`
        : `${req.user.username} reviewed #${pr.number} ${pr.title}`;

    if (pr.author.toString() !== req.user._id.toString()) {
      const notification = await Notification.create({
        recipient: pr.author,
        sender: req.user._id,
        type: notifType,
        title: notifTitle,
        message: notifMsg,
        repository: repoDoc._id,
        referenceType: 'pullrequest',
        referenceId: pr._id,
      });
      emitToUser(pr.author.toString(), 'notification:new', notification);
    }

    await ActivityLog.create({
      action: 'PR_REVIEWED',
      user: req.user._id,
      repository: repoDoc._id,
      referenceType: 'pullrequest',
      referenceId: pr._id,
      details: { status, number: pr.number },
    });

    res.json(pr);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// MERGE PR
exports.mergePullRequest = async (req, res) => {
  try {
    const { owner, repo, number } = req.params;
    const { strategy = 'merge' } = req.body;
    const repoDoc = await Repository.findOne({ slug: repo }).populate('owner', 'username');
    if (!repoDoc || repoDoc.owner.username !== owner) {
      return res.status(404).json({ message: 'Repository not found' });
    }

    const pr = await PullRequest.findOne({ repository: repoDoc._id, number: parseInt(number) });
    if (!pr) return res.status(404).json({ message: 'Pull request not found' });

    if (pr.status !== 'open') {
      return res.status(400).json({ message: 'Can only merge open pull requests' });
    }

    pr.status = 'merged';
    pr.mergedBy = req.user._id;
    pr.mergedAt = new Date();
    pr.mergeStrategy = ['merge', 'squash', 'rebase'].includes(strategy) ? strategy : 'merge';
    await pr.save();

    repoDoc.openPrCount = Math.max(0, repoDoc.openPrCount - 1);
    await repoDoc.save();

    // Notify author
    if (pr.author.toString() !== req.user._id.toString()) {
      const notification = await Notification.create({
        recipient: pr.author,
        sender: req.user._id,
        type: 'pr_merged',
        title: 'PR Merged',
        message: `${req.user.username} merged #${pr.number} ${pr.title}`,
        repository: repoDoc._id,
        referenceType: 'pullrequest',
        referenceId: pr._id,
      });
      emitToUser(pr.author.toString(), 'notification:new', notification);
    }

    await ActivityLog.create({
      action: 'PR_MERGED',
      user: req.user._id,
      repository: repoDoc._id,
      referenceType: 'pullrequest',
      referenceId: pr._id,
      details: { title: pr.title, number: pr.number },
    });

    emitToRepo(repoDoc._id.toString(), 'pr:merged', pr);

    res.json(pr);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// CLOSE PR
exports.closePullRequest = async (req, res) => {
  try {
    const { owner, repo, number } = req.params;
    const repoDoc = await Repository.findOne({ slug: repo }).populate('owner', 'username');
    if (!repoDoc || repoDoc.owner.username !== owner) {
      return res.status(404).json({ message: 'Repository not found' });
    }

    const pr = await PullRequest.findOne({ repository: repoDoc._id, number: parseInt(number) });
    if (!pr) return res.status(404).json({ message: 'Pull request not found' });

    if (pr.status === 'merged') {
      return res.status(400).json({ message: 'Cannot close a merged pull request' });
    }

    const prevStatus = pr.status;
    pr.status = 'closed';
    pr.closedBy = req.user._id;
    pr.closedAt = new Date();
    await pr.save();

    if (prevStatus === 'open') {
      repoDoc.openPrCount = Math.max(0, repoDoc.openPrCount - 1);
      await repoDoc.save();
    }

    res.json(pr);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ADD COMMENT TO PR
exports.addComment = async (req, res) => {
  try {
    const { owner, repo, number } = req.params;
    const { body, filePath, lineNumber } = req.body;

    if (!body) return res.status(400).json({ message: 'Comment body is required' });

    const repoDoc = await Repository.findOne({ slug: repo }).populate('owner', 'username');
    if (!repoDoc || repoDoc.owner.username !== owner) {
      return res.status(404).json({ message: 'Repository not found' });
    }

    const pr = await PullRequest.findOne({ repository: repoDoc._id, number: parseInt(number) });
    if (!pr) return res.status(404).json({ message: 'Pull request not found' });

    const comment = await Comment.create({
      body,
      author: req.user._id,
      commentableType: 'pullrequest',
      commentableId: pr._id,
      filePath: filePath || null,
      lineNumber: lineNumber || null,
    });

    pr.commentCount += 1;
    await pr.save();

    if (pr.author.toString() !== req.user._id.toString()) {
      const notification = await Notification.create({
        recipient: pr.author,
        sender: req.user._id,
        type: 'pr_comment',
        title: 'New Comment on PR',
        message: `${req.user.username} commented on #${pr.number} ${pr.title}`,
        repository: repoDoc._id,
        referenceType: 'pullrequest',
        referenceId: pr._id,
      });
      emitToUser(pr.author.toString(), 'notification:new', notification);
    }

    await comment.populate('author', 'username name avatar');
    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
