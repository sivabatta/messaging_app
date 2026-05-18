const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['text', 'image', 'video'], required: true },
    text: { type: String, default: '' },
    media: { type: mongoose.Schema.Types.ObjectId, ref: 'Media', default: null },
    seen: { type: Boolean, default: false },
    seenAt: { type: Date, default: null },
  },
  { timestamps: true }
);

messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
