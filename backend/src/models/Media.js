const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema(
  {
    fileName: { type: String, required: true },
    fileType: { type: String, required: true }, // mime type
    kind: { type: String, enum: ['image', 'video', 'file'], required: true },
    size: { type: Number, required: true },
    data: { type: Buffer, required: true, select: false }, // BLOB — never auto-loaded
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    uploadDate: { type: Date, default: Date.now },
    expiryDate: { type: Date, required: true, index: true },
  },
  { timestamps: true }
);

// MongoDB will also evict via this index, but we keep an explicit cleanup job as required.
mediaSchema.index({ expiryDate: 1 }, { expireAfterSeconds: 0 });

mediaSchema.methods.isExpired = function () {
  return this.expiryDate.getTime() <= Date.now();
};

module.exports = mongoose.model('Media', mediaSchema);
