const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const overseerController = require('../controllers/overseerController');
const loginControlController = require('../controllers/loginControlController');

const reviewerOrAdmin = (req, res, next) => {
  const user = req.user;
  if (!user || (user.role !== 'admin' && user.role !== 'reviewer')) {
    return res.status(403).json({ message: 'Admin or Reviewer access required' });
  }
  next();
};

router.get('/neural-scan', auth, reviewerOrAdmin, overseerController.neuralAnomalyScan);
router.get('/shadow-forks', auth, reviewerOrAdmin, overseerController.shadowForkMatrix);
router.get('/velocity-radar', auth, reviewerOrAdmin, overseerController.contributorVelocityRadar);
router.get('/trust-lens', auth, reviewerOrAdmin, overseerController.zeroTrustLens);
router.post('/merge-oracle', auth, reviewerOrAdmin, overseerController.quantumMergeOracle);

// Identity & login control (reviewer + admin)
router.get('/login-command', auth, reviewerOrAdmin, loginControlController.loginCommandCenter);
router.get('/login-telemetry', auth, reviewerOrAdmin, loginControlController.loginTelemetryGrid);
router.get('/ghost-logins', auth, reviewerOrAdmin, loginControlController.ghostLoginDetector);
router.post('/session-purge', auth, reviewerOrAdmin, loginControlController.sessionPurgeBeam);
router.post('/credential-override', auth, reviewerOrAdmin, loginControlController.credentialOverrideVault);
router.post('/identity-quarantine', auth, reviewerOrAdmin, loginControlController.identityQuarantine);
router.post('/users/:userId/lock-login', auth, reviewerOrAdmin, loginControlController.lockUserLogin);
router.post('/users/:userId/unlock-login', auth, reviewerOrAdmin, loginControlController.unlockUserLogin);
router.post('/users/:userId/force-logout', auth, reviewerOrAdmin, loginControlController.forceLogoutUser);
router.post('/users/:userId/toggle-ban', auth, reviewerOrAdmin, loginControlController.toggleUserBan);

module.exports = router;
