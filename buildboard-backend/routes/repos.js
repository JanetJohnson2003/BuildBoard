const router = require('express').Router();
const repoController = require('../controllers/repoController');
const featureController = require('../controllers/repositoryFeatureController');
const auth = require('../middleware/authMiddleware');

// User's repos
router.get('/my', auth, repoController.getMyRepos);
router.get('/explore', auth, repoController.getExploreRepos);
router.get('/starred/:username', auth, repoController.getStarredRepos);

// CRUD
router.post('/', auth, repoController.createRepo);
router.get('/:owner/:repo', auth, repoController.getRepo);
router.put('/:owner/:repo', auth, repoController.updateRepo);
router.delete('/:owner/:repo', auth, repoController.deleteRepo);

// Star, Fork, Collaborators
router.post('/:owner/:repo/star', auth, repoController.toggleStar);
router.get('/:owner/:repo/stargazers', auth, repoController.getStargazers);
router.post('/:owner/:repo/fork', auth, repoController.forkRepo);
router.get('/:owner/:repo/forks', auth, repoController.getForks);
router.get('/:owner/:repo/watchers', auth, featureController.getWatchers);
router.post('/:owner/:repo/collaborators', auth, repoController.addCollaborator);

// Repository file system
router.get('/:owner/:repo/architecture', auth, featureController.getArchitectureGraph);
router.get('/:owner/:repo/files', auth, featureController.getFiles);
router.get('/:owner/:repo/file', auth, featureController.getFile);
router.get('/:owner/:repo/file/history', auth, featureController.getFileHistory);
router.get('/:owner/:repo/file/download', auth, featureController.downloadFile);
router.get('/:owner/:repo/download', auth, featureController.downloadProject);
router.put('/:owner/:repo/file', auth, featureController.upsertFile);
router.post('/:owner/:repo/upload', auth, featureController.uploadFiles);
router.delete('/:owner/:repo/file', auth, featureController.deleteFile);
router.post('/:owner/:repo/file/move', auth, featureController.moveFile);
router.post('/:owner/:repo/run', auth, featureController.runCode);

// Branches and commits
router.get('/:owner/:repo/branches', auth, featureController.getBranches);
router.post('/:owner/:repo/branches', auth, featureController.createBranch);
router.delete('/:owner/:repo/branches/:branchName', auth, featureController.deleteBranch);
router.put('/:owner/:repo/branches/:branchName/protection', auth, featureController.protectBranch);
router.get('/:owner/:repo/commits', auth, featureController.getCommits);
router.get('/:owner/:repo/commits/:sha', auth, featureController.getCommit);
router.post('/:owner/:repo/commits/:sha/revert', auth, featureController.revertCommit);
router.get('/:owner/:repo/compare', auth, featureController.compareBranches);

// Tags and releases
router.get('/:owner/:repo/tags', auth, featureController.getTags);
router.post('/:owner/:repo/tags', auth, featureController.createTag);
router.delete('/:owner/:repo/tags/:tagName', auth, featureController.deleteTag);
router.get('/:owner/:repo/releases', auth, featureController.getReleases);
router.post('/:owner/:repo/releases', auth, featureController.createRelease);

// Social/repository state
router.post('/:owner/:repo/watch', auth, featureController.toggleWatch);
router.post('/:owner/:repo/pin', auth, featureController.togglePin);
router.post('/:owner/:repo/archive', auth, featureController.archiveRepository);

// Discussions
router.get('/:owner/:repo/discussions', auth, featureController.getDiscussions);
router.post('/:owner/:repo/discussions', auth, featureController.createDiscussion);
router.get('/:owner/:repo/discussions/:discussionId', auth, featureController.getDiscussion);
router.post('/:owner/:repo/discussions/:discussionId/replies', auth, featureController.replyToDiscussion);
router.post('/:owner/:repo/discussions/:discussionId/upvote', auth, featureController.upvoteDiscussion);

// Wiki
router.get('/:owner/:repo/wiki', auth, featureController.getWikiPages);
router.put('/:owner/:repo/wiki/:slug', auth, featureController.upsertWikiPage);
router.get('/:owner/:repo/wiki/:slug/history', auth, featureController.getWikiHistory);

// Actions/workflows
router.get('/:owner/:repo/workflows', auth, featureController.getWorkflows);
router.post('/:owner/:repo/workflows', auth, featureController.createWorkflow);
router.get('/:owner/:repo/workflow-runs', auth, featureController.getWorkflowRuns);
router.get('/:owner/:repo/workflows/:workflowId/runs', auth, featureController.getWorkflowRuns);
router.post('/:owner/:repo/workflows/:workflowId/runs', auth, featureController.runWorkflow);

// Security, insights, and health
router.get('/:owner/:repo/security', auth, featureController.getSecurityDashboard);
router.get('/:owner/:repo/insights', auth, featureController.getInsights);
router.get('/:owner/:repo/health', auth, featureController.getHealth);
router.get('/:owner/:repo/health/dependencies', auth, featureController.getDependencyHealth);

// Snippets
router.get('/:owner/:repo/snippets', auth, featureController.getSnippets);
router.post('/:owner/:repo/snippets', auth, featureController.createSnippet);

// Chat
router.get('/:owner/:repo/chat', auth, featureController.getChatMessages);
router.post('/:owner/:repo/chat', auth, featureController.postChatMessage);

module.exports = router;
