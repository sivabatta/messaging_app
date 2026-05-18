const User = require('../models/User');
const { signToken } = require('../middleware/auth');

exports.signup = async (req, res) => {
  const { username, email, password } = req.body || {};
  if (!username || !email || !password) return res.status(400).json({ error: 'username, email, password required' });
  if (password.length < 6) return res.status(400).json({ error: 'password must be at least 6 chars' });

  const exists = await User.findOne({ $or: [{ email: email.toLowerCase() }, { username }] });
  if (exists) return res.status(409).json({ error: 'username or email already taken' });

  const user = new User({ username, email });
  await user.setPassword(password);
  await user.save();
  return res.status(201).json({ token: signToken(user), user: user.toPublicJSON() });
};

exports.login = async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !(await user.verifyPassword(password))) {
    return res.status(401).json({ error: 'invalid credentials' });
  }
  return res.json({ token: signToken(user), user: user.toPublicJSON() });
};

exports.me = async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ error: 'not found' });
  return res.json({ user: user.toPublicJSON() });
};

exports.listUsers = async (req, res) => {
  const users = await User.find({ _id: { $ne: req.user.id } })
    .select('username email online lastSeen')
    .sort({ username: 1 });
  return res.json({
    users: users.map((u) => ({
      id: u._id.toString(),
      username: u.username,
      email: u.email,
      online: u.online,
      lastSeen: u.lastSeen,
    })),
  });
};
