const router = require('express').Router();
const aiController = require('../controllers/aiController');
const auth = require('../middleware/authMiddleware');

router.get('/:owner/:repo/assistant', auth, aiController.getRepoAssistant);

module.exports = router;
