const path = require('path');
const os = require('os');

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

const uploadDir =
  process.env.UPLOAD_DIR ||
  (isServerless ? path.join(os.tmpdir(), 'buildboard-uploads') : path.join(__dirname, '..', 'uploads'));

module.exports = { uploadDir };
