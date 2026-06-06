const router = require('express').Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/send-otp', authLimiter, authController.sendOtp);
router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/forgot-password', authLimiter, authController.requestPasswordReset);
router.post('/reset-password', authLimiter, authController.resetPassword);
router.post('/verify-email', authController.verifyEmail);
router.get('/me', auth, authController.getCurrentUser);
router.post('/logout', auth, authController.logout);
router.put('/change-password', auth, authController.changePassword);
router.put('/2fa', auth, authController.configureTwoFactor);

module.exports = router;
