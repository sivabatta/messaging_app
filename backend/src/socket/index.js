const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

let io = null;
const userToSockets = new Map(); // userId -> Set<socketId>

function sidsFor(userId) {
  const set = userToSockets.get(String(userId));
  return set ? Array.from(set) : [];
}

function emitToUser(userId, event, payload) {
  if (!io) return;
  for (const sid of sidsFor(userId)) {
    io.to(sid).emit(event, payload);
  }
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
    const userId = String(socket.user.id);
    let set = userToSockets.get(userId);
    if (!set) {
      set = new Set();
      userToSockets.set(userId, set);
    }
    const wasAlreadyOnline = set.size > 0;
    set.add(socket.id);

    // Only flip the user to online + broadcast presence when the first device connects.
    if (!wasAlreadyOnline) {
      await User.findByIdAndUpdate(userId, { online: true, lastSeen: new Date() });
      socket.broadcast.emit('presence:update', { userId, online: true });
    }

    socket.on('typing:start', ({ to }) => {
      emitToUser(to, 'typing:start', { from: userId });
    });

    socket.on('typing:stop', ({ to }) => {
      emitToUser(to, 'typing:stop', { from: userId });
    });

    socket.on('disconnect', async () => {
      const set = userToSockets.get(userId);
      if (!set) return;
      set.delete(socket.id);
      // User is only truly offline when the last device disconnects.
      if (set.size === 0) {
        userToSockets.delete(userId);
        const now = new Date();
        await User.findByIdAndUpdate(userId, { online: false, lastSeen: now });
        socket.broadcast.emit('presence:update', { userId, online: false, lastSeen: now });
      }
    });
  });

  return io;
}

module.exports = { initSocket, getIO, sidsFor, emitToUser };
