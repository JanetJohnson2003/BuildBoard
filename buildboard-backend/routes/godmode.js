const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const godModeController = require('../controllers/godModeController');

const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'God Mode requires administrator clearance' });
  }
  next();
};

router.get('/overview', auth, adminOnly, godModeController.godOverview);
router.get('/entropy-scan', auth, adminOnly, godModeController.entropyScan);
router.get('/session-omniscience', auth, adminOnly, godModeController.sessionOmniscience);
router.get('/timeline-sovereignty', auth, adminOnly, godModeController.timelineSovereignty);

router.post('/mirror/:userId', auth, adminOnly, godModeController.userMirror);
router.post('/kill-switch', auth, adminOnly, godModeController.platformKillSwitch);
router.post('/mass-role-assign', auth, adminOnly, godModeController.massRoleAssign);
router.post('/repo-annihilation', auth, adminOnly, godModeController.repositoryAnnihilation);
router.post('/broadcast', auth, adminOnly, godModeController.omnichannelBroadcast);
router.post('/ascension', auth, adminOnly, godModeController.ascensionProtocol);
router.post('/emergency-lockdown', auth, adminOnly, godModeController.emergencyLockdown);
router.post('/user-genesis', auth, adminOnly, godModeController.userGenesis);
router.post('/identity-override', auth, adminOnly, godModeController.godIdentityOverride);

module.exports = router;
