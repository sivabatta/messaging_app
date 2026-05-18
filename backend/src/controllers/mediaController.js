const mongoose = require('mongoose');
const Media = require('../models/Media');

exports.download = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'invalid media id' });

  const media = await Media.findById(id).select('+data');
  if (!media) return res.status(404).json({ error: 'media not found or expired' });

  // Only sender or receiver may download.
  const me = req.user.id;
  if (media.sender.toString() !== me && media.receiver.toString() !== me) {
    return res.status(403).json({ error: 'forbidden' });
  }

  if (media.isExpired()) {
    return res.status(410).json({ error: 'media expired' });
  }

  res.setHeader('Content-Type', media.fileType);
  res.setHeader('Content-Length', media.size);
  res.setHeader(
    'Content-Disposition',
    `inline; filename="${encodeURIComponent(media.fileName)}"`
  );
  res.setHeader('Cache-Control', 'private, max-age=300');
  return res.end(media.data);
};

exports.meta = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'invalid media id' });
  const media = await Media.findById(id);
  if (!media) return res.status(404).json({ error: 'not found' });

  const me = req.user.id;
  if (media.sender.toString() !== me && media.receiver.toString() !== me) {
    return res.status(403).json({ error: 'forbidden' });
  }

  return res.json({
    id: media._id.toString(),
    fileName: media.fileName,
    fileType: media.fileType,
    kind: media.kind,
    size: media.size,
    uploadDate: media.uploadDate,
    expiryDate: media.expiryDate,
    expired: media.isExpired(),
  });
};
