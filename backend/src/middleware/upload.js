const multer = require('multer');

const ALLOWED = {
  'image/jpeg': { kind: 'image', ext: 'jpg' },
  'image/png': { kind: 'image', ext: 'png' },
  'video/mp4': { kind: 'video', ext: 'mp4' },
  'video/quicktime': { kind: 'video', ext: 'mov' }, // .mov
};

const MB = 1024 * 1024;
const maxImage = (Number(process.env.MAX_IMAGE_MB) || 10) * MB;
const maxVideo = (Number(process.env.MAX_VIDEO_MB) || 50) * MB;

const storage = multer.memoryStorage();

function fileFilter(_req, file, cb) {
  if (!ALLOWED[file.mimetype]) {
    return cb(new Error('unsupported file type — only JPG, PNG, MP4, MOV allowed'));
  }
  cb(null, true);
}

// Hard cap at max(image,video) here; per-kind cap is enforced in the controller after we know the kind.
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: Math.max(maxImage, maxVideo) },
});

function validateSize(file) {
  const meta = ALLOWED[file.mimetype];
  if (!meta) return 'unsupported file type';
  const cap = meta.kind === 'image' ? maxImage : maxVideo;
  if (file.size > cap) return `${meta.kind} exceeds ${cap / MB}MB limit`;
  return null;
}

module.exports = { upload, ALLOWED, validateSize };
