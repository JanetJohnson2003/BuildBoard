const { Server } = require('socket.io');

let io;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  const onlineUsers = new Map();

  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    socket.on('user:online', (userId) => {
      if (userId) {
        onlineUsers.set(userId, socket.id);
        socket.userId = userId;
        socket.join(`user:${userId}`);
        console.log(`User ${userId} is online`);
      }
    });

    socket.on('repo:join', (repoId) => {
      socket.join(`repo:${repoId}`);
    });

    socket.on('repo:leave', (repoId) => {
      socket.leave(`repo:${repoId}`);
    });

    socket.on('disconnect', () => {
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
        console.log(`User ${socket.userId} went offline`);
      }
      console.log('Socket disconnected:', socket.id);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

const emitToRepo = (repoId, event, data) => {
  if (io) {
    io.to(`repo:${repoId}`).emit(event, data);
  }
};

module.exports = { initializeSocket, getIO, emitToUser, emitToRepo };
