const router = require('express').Router();
const prController = require('../controllers/prController');
const auth = require('../middleware/authMiddleware');

router.get('/:owner/:repo', auth, prController.getPullRequests);
router.get('/:owner/:repo/:number', auth, prController.getPullRequest);
router.post('/:owner/:repo', auth, prController.createPullRequest);
router.post('/:owner/:repo/:number/review', auth, prController.reviewPullRequest);
router.post('/:owner/:repo/:number/merge', auth, prController.mergePullRequest);
router.post('/:owner/:repo/:number/close', auth, prController.closePullRequest);
router.post('/:owner/:repo/:number/comments', auth, prController.addComment);

module.exports = router;
