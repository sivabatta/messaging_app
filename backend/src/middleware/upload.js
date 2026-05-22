const multer = require('multer');

const MB = 1024 * 1024;
const MAX_MB = Number(process.env.MAX_FILE_MB) || 50;
const MAX_BYTES = MAX_MB * MB;

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: MAX_BYTES },
  // Allow any type. Per-file validation (extra checks, max size, etc.) lives in the controller.
});

function kindFor(mimetype) {
  if (typeof mimetype !== 'string') return 'file';
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  return 'file';
}

module.exports = { upload, kindFor, MAX_MB, MAX_BYTES };
