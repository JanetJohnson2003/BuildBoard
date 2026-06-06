const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const versionController = require('../controllers/versionController');
const upload = require('../middleware/uploadMiddleware');

console.log('✅ Versions routes loading...');

// ✅ IMPORTANT: Download route MUST be first (more specific)
router.get('/download/:versionId', auth, (req, res, next) => {
  console.log('⬇️ GET /download/:versionId route hit');
  console.log('⬇️ Version ID:', req.params.versionId);
  versionController.downloadVersion(req, res, next);
});

// ✅ POST - Create/Upload version
router.post('/:projectId', auth, upload.single('file'), (req, res, next) => {
  console.log('📦 POST /:projectId route hit');
  versionController.createVersion(req, res, next);
});

// ✅ GET all versions for a project
router.get('/:projectId', auth, (req, res, next) => {
  console.log('📥 GET /:projectId route hit');
  versionController.getVersions(req, res, next);
});

// ✅ GET version by ID (more specific)
router.get('/details/:versionId', auth, (req, res, next) => {
  console.log('📖 GET /details/:versionId route hit');
  versionController.getVersionById(req, res, next);
});

// ✅ PUT - Update version
router.put('/:versionId', auth, (req, res, next) => {
  console.log('✏️ PUT /:versionId route hit');
  versionController.updateVersion(req, res, next);
});

// ✅ DELETE - Delete version
router.delete('/:versionId', auth, (req, res, next) => {
  console.log('🗑️ DELETE /:versionId route hit');
  versionController.deleteVersion(req, res, next);
});

console.log('✅ Versions routes loaded successfully');

module.exports = router;