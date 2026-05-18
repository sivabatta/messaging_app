const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true, minlength: 3, maxlength: 32 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
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
    email: this.email,
    online: this.online,
    lastSeen: this.lastSeen,
  };
};

module.exports = mongoose.model('User', userSchema);
