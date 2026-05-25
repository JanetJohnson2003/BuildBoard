const Repository = require('../models/Repository');
const Commit = require('../models/Commit');
const PullRequest = require('../models/PullRequest');
const Issue = require('../models/Issue');
const Release = require('../models/Release');

const resolveRepo = async (owner, repo) => {
  const repoDoc = await Repository.findOne({ slug: repo }).populate('owner', 'username name avatar');
  if (!repoDoc || repoDoc.owner.username !== owner) return null;
  return repoDoc;
};

exports.getRepoAssistant = async (req, res) => {
  try {
    const repoDoc = await resolveRepo(req.params.owner, req.params.repo);
    if (!repoDoc) return res.status(404).json({ message: 'Repository not found' });

    const [recentCommits, openIssues, openPRs, releases] = await Promise.all([
      Commit.find({ repository: repoDoc._id }).sort({ createdAt: -1 }).limit(10),
      Issue.find({ repository: repoDoc._id, status: { $ne: 'closed' } }).sort({ priority: -1, updatedAt: -1 }).limit(10),
      PullRequest.find({ repository: repoDoc._id, status: 'open' }).sort({ updatedAt: -1 }).limit(10),
      Release.find({ repository: repoDoc._id }).sort({ createdAt: -1 }).limit(3),
    ]);

    const commitSummary = recentCommits.length
      ? recentCommits.map((commit) => `- ${commit.sha.slice(0, 7)} ${commit.message}`).join('\n')
      : 'No commits yet. Start by adding a README, license, and first implementation commit.';

    const releaseNotes = releases.length
      ? `Latest release ${releases[0].tagName}: ${releases[0].title}. ${releases[0].body || 'No release body supplied.'}`
      : `Draft release notes for ${repoDoc.name}: summarize merged pull requests, notable fixes, and migration notes before publishing.`;

    const codeReviewSuggestions = openPRs.map((pr) => ({
      pullRequest: pr.number,
      title: pr.title,
      suggestion: pr.isDraft
        ? 'Keep this PR in draft until tests and reviewer context are ready.'
        : 'Check for linked issues, required tests, and branch protection status before merge.',
    }));

    const bugPrediction = openIssues
      .filter((issue) => ['high', 'critical'].includes(issue.priority))
      .map((issue) => ({
        issue: issue.number,
        title: issue.title,
        risk: issue.priority,
        reason: 'High-priority open work increases delivery and regression risk.',
      }));

    const healthScore = Math.max(
      30,
      100 - openIssues.length * 5 - openPRs.filter((pr) => pr.reviewDecision === 'changes_requested').length * 10
    );

    res.json({
      commitSummary,
      releaseNotes,
      codeReviewSuggestions,
      bugPrediction,
      sprintAnalysis: {
        focus: openIssues.slice(0, 5).map((issue) => issue.title),
        recommendation: openIssues.length > 5 ? 'Split active work by milestone and close stale issues.' : 'Current work-in-progress is manageable.',
      },
      projectHealthScore: healthScore,
      documentationGenerator: `# ${repoDoc.name}\n\n${repoDoc.description || 'Project overview'}\n\n## Getting started\n\nAdd setup, test, deployment, and contribution instructions here.`,
      repositoryInsights: {
        language: repoDoc.language || 'Unclassified',
        stars: repoDoc.starCount,
        forks: repoDoc.forkCount,
        openIssues: openIssues.length,
        openPullRequests: openPRs.length,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
