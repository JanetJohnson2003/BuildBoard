const express = require('express');
const router = express.Router();
const { addVersion, getVersions } = require('../controllers/versionController');
const auth = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/', auth, upload.single('file'), addVersion);
router.get('/:projectId', auth, getVersions);

module.exports = router;
