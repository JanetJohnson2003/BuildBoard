const router = require('express').Router();
const aiController = require('../controllers/aiController');
const aiCodingController = require('../controllers/aiCodingController');
const auth = require('../middleware/authMiddleware');

router.get('/:owner/:repo/assistant', auth, aiController.getRepoAssistant);

// AI IDE Chat
router.post('/:owner/:repo/ide-chat', auth, aiCodingController.ideChat);

// AI Coding Assistant
router.post('/:owner/:repo/code-assistant', auth, aiCodingController.generateCodeDiff);

// AI PR Reviewer
router.post('/:owner/:repo/pulls/:number/ai-review', auth, aiCodingController.generateAiReview);

// AI Release Slideshow
router.post('/:owner/:repo/releases/:tag/slideshow', auth, aiCodingController.generateReleaseSlideshow);

// AI Flowchart Generator
router.post('/:owner/:repo/flowchart', auth, aiCodingController.generateFlowchart);

// AI PR Predictor
router.post('/:owner/:repo/predict-pr', auth, aiCodingController.predictPr);

// AI Auto-Test Generator
router.post('/:owner/:repo/generate-tests', auth, aiCodingController.generateTests);

// Self-Healing Code (Auto-Fixer)
router.post('/:owner/:repo/auto-fix', auth, aiCodingController.autoFix);

// AI Secrets Vault Scanner
router.post('/:owner/:repo/audit-secrets', auth, aiCodingController.auditSecrets);

module.exports = router;
