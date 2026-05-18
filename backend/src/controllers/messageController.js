const mongoose = require('mongoose');
const Message = require('../models/Message');
const Media = require('../models/Media');
const { ALLOWED, validateSize } = require('../middleware/upload');
const { getIO, sidFor } = require('../socket');

const TTL_DAYS = Number(process.env.MEDIA_TTL_DAYS) || 7;

function serializeMessage(m) {
  return {
    id: m._id.toString(),
    sender: m.sender.toString(),
    receiver: m.receiver.toString(),
    type: m.type,
    text: m.text,
    media: m.media
      ? {
          id: m.media._id ? m.media._id.toString() : m.media.toString(),
          fileName: m.media.fileName,
          fileType: m.media.fileType,
          kind: m.media.kind,
          size: m.media.size,
          uploadDate: m.media.uploadDate,
          expiryDate: m.media.expiryDate,
        }
      : null,
    seen: m.seen,
    seenAt: m.seenAt,
    createdAt: m.createdAt,
  };
}

exports.sendText = async (req, res) => {
  const { to, text } = req.body || {};
  if (!to || !text || !text.trim()) return res.status(400).json({ error: 'to and text required' });
  if (!mongoose.isValidObjectId(to)) return res.status(400).json({ error: 'invalid recipient' });

  const msg = await Message.create({
    sender: req.user.id,
    receiver: to,
    type: 'text',
    text: text.trim(),
  });

  const payload = serializeMessage(msg);
  emitMessageNew(req.user.id, to, payload);
  return res.status(201).json({ message: payload });
};

exports.sendMedia = async (req, res) => {
  const { to } = req.body || {};
  if (!to || !mongoose.isValidObjectId(to)) return res.status(400).json({ error: 'invalid recipient' });
  if (!req.file) return res.status(400).json({ error: 'file required' });

  const meta = ALLOWED[req.file.mimetype];
  if (!meta) return res.status(400).json({ error: 'unsupported file type' });
  const sizeErr = validateSize(req.file);
  if (sizeErr) return res.status(413).json({ error: sizeErr });

  const expiryDate = new Date(Date.now() + TTL_DAYS * 24 * 60 * 60 * 1000);

  const media = await Media.create({
    fileName: req.file.originalname,
    fileType: req.file.mimetype,
    kind: meta.kind,
    size: req.file.size,
    data: req.file.buffer,
    sender: req.user.id,
    receiver: to,
    uploadDate: new Date(),
    expiryDate,
  });

  const msg = await Message.create({
    sender: req.user.id,
    receiver: to,
    type: meta.kind,
    media: media._id,
  });

  // Populate the lean fields for the response (data is still excluded by select: false).
  await msg.populate('media', '-data');
  const payload = serializeMessage(msg);
  emitMessageNew(req.user.id, to, payload);
  return res.status(201).json({ message: payload });
};

function emitMessageNew(fromId, toId, payload) {
  const io = getIO();
  if (!io) return;
  const selfSid = sidFor(fromId);
  // Self-chat: emit once. Otherwise emit to both peers.
  if (String(fromId) === String(toId)) {
    if (selfSid) io.to(selfSid).emit('message:new', payload);
    return;
  }
  const recipientSid = sidFor(toId);
  if (recipientSid) io.to(recipientSid).emit('message:new', payload);
  if (selfSid) io.to(selfSid).emit('message:new', payload);
}

exports.history = async (req, res) => {
  const otherId = req.params.userId;
  if (!mongoose.isValidObjectId(otherId)) return res.status(400).json({ error: 'invalid user id' });

  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const before = req.query.before ? new Date(req.query.before) : null;

  const filter = {
    $or: [
      { sender: req.user.id, receiver: otherId },
      { sender: otherId, receiver: req.user.id },
    ],
  };
  if (before && !isNaN(before)) filter.createdAt = { $lt: before };

  const messages = await Message.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('media', '-data');

  return res.json({ messages: messages.reverse().map(serializeMessage) });
};

exports.markSeen = async (req, res) => {
  const { from } = req.body || {};
  if (!from || !mongoose.isValidObjectId(from)) return res.status(400).json({ error: 'invalid sender id' });

  const now = new Date();
  const result = await Message.updateMany(
    { sender: from, receiver: req.user.id, seen: false },
    { $set: { seen: true, seenAt: now } }
  );

  const io = getIO();
  if (io && result.modifiedCount > 0) {
    const senderSid = sidFor(from);
    if (senderSid) io.to(senderSid).emit('message:seen', { by: req.user.id, at: now });
  }
  return res.json({ updated: result.modifiedCount });
};

exports.deleteConversation = async (req, res) => {
  const otherId = req.params.userId;
  if (!mongoose.isValidObjectId(otherId)) return res.status(400).json({ error: 'invalid user id' });

  const filter = {
    $or: [
      { sender: req.user.id, receiver: otherId },
      { sender: otherId, receiver: req.user.id },
    ],
  };

  // Collect media refs so we also drop the BLOBs, not just the message rows.
  const messages = await Message.find(filter).select('media');
  const mediaIds = messages.map((m) => m.media).filter(Boolean);

  if (mediaIds.length > 0) {
    await Media.deleteMany({ _id: { $in: mediaIds } });
  }
  const result = await Message.deleteMany(filter);

  const io = getIO();
  if (io) {
    const payload = { between: [String(req.user.id), String(otherId)] };
    const selfSid = sidFor(req.user.id);
    if (selfSid) io.to(selfSid).emit('chat:cleared', payload);
    if (String(req.user.id) !== String(otherId)) {
      const otherSid = sidFor(otherId);
      if (otherSid) io.to(otherSid).emit('chat:cleared', payload);
    }
  }

  return res.json({ deletedMessages: result.deletedCount, deletedMedia: mediaIds.length });
};
