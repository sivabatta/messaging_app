const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true, minlength: 4, maxlength: 16 },
    passwordHash: { type: String, required: true },
    online: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

userSchema.methods.setPassword = async function (plain) {
  this.passwordHash = await bcrypt.hash(plain, 12);
};

userSchema.methods.verifyPassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

userSchema.methods.toPublicJSON = function () {
  return {
    id: this._id.toString(),
    username: this.username,
    online: this.online,
    lastSeen: this.lastSeen,
  };
};

module.exports = mongoose.model('User', userSchema);
