const router = require('express').Router();
const issueController = require('../controllers/issueController');
const auth = require('../middleware/authMiddleware');

router.get('/:owner/:repo', auth, issueController.getIssues);
router.get('/:owner/:repo/board', auth, issueController.getIssueBoard);
router.get('/:owner/:repo/labels', auth, issueController.getLabels);
router.post('/:owner/:repo/labels', auth, issueController.createLabel);
router.get('/:owner/:repo/milestones', auth, issueController.getMilestones);
router.post('/:owner/:repo/milestones', auth, issueController.createMilestone);
router.get('/:owner/:repo/:number', auth, issueController.getIssue);
router.post('/:owner/:repo', auth, issueController.createIssue);
router.put('/:owner/:repo/:number', auth, issueController.updateIssue);
router.post('/:owner/:repo/:number/comments', auth, issueController.addComment);

module.exports = router;
