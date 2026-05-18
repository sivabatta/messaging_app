const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

let io = null;
const userToSocket = new Map(); // userId -> socketId

function sidFor(userId) {
  return userToSocket.get(String(userId)) || null;
}

function getIO() {
  return io;
}

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_ORIGIN || '*', credentials: true },
    maxHttpBufferSize: 1e6,
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('missing token'));
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = payload;
      next();
    } catch {
      next(new Error('invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.user.id;
    userToSocket.set(String(userId), socket.id);
    await User.findByIdAndUpdate(userId, { online: true, lastSeen: new Date() });
    socket.broadcast.emit('presence:update', { userId, online: true });

    socket.on('typing:start', ({ to }) => {
      const sid = sidFor(to);
      if (sid) io.to(sid).emit('typing:start', { from: userId });
    });

    socket.on('typing:stop', ({ to }) => {
      const sid = sidFor(to);
      if (sid) io.to(sid).emit('typing:stop', { from: userId });
    });

    socket.on('disconnect', async () => {
      if (userToSocket.get(String(userId)) === socket.id) {
        userToSocket.delete(String(userId));
      }
      const now = new Date();
      await User.findByIdAndUpdate(userId, { online: false, lastSeen: now });
      socket.broadcast.emit('presence:update', { userId, online: false, lastSeen: now });
    });
  });

  return io;
}

module.exports = { initSocket, getIO, sidFor };
