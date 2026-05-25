const router = require('express').Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/authMiddleware');

router.get('/search', auth, userController.getAllUsers);
router.get('/:username', auth, userController.getUserProfile);
router.get('/:username/repos', auth, userController.getUserRepos);
router.get('/:username/activity', auth, userController.getUserActivity);
router.get('/:username/contributions', auth, userController.getContributions);
router.get('/:username/followers', auth, userController.getFollowers);
router.get('/:username/following', auth, userController.getFollowing);
router.post('/:username/follow', auth, userController.toggleFollow);
router.put('/profile/update', auth, userController.updateProfile);

module.exports = router;