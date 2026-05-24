const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/authMiddleware');

console.log('✅ Auth routes loading...');

// ✅ POST - Register new user
router.post('/register', (req, res, next) => {
  console.log('📝 POST /register route hit');
  authController.register(req, res, next);
});

// ✅ POST - Login user
router.post('/login', (req, res, next) => {
  console.log('🔐 POST /login route hit');
  authController.login(req, res, next);
});

// ✅ GET - Get current user
router.get('/me', auth, (req, res, next) => {
  console.log('👤 GET /me route hit');
  authController.getCurrentUser(req, res, next);
});

// ✅ POST - Logout user
router.post('/logout', auth, (req, res, next) => {
  console.log('🚪 POST /logout route hit');
  authController.logout(req, res, next);
});

// ✅ POST - Change password
router.post('/change-password', auth, (req, res, next) => {
  console.log('🔑 POST /change-password route hit');
  authController.changePassword(req, res, next);
});

console.log('✅ Auth routes loaded successfully');

module.exports = router;