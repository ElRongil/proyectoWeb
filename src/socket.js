import { Server } from 'socket.io';
import { verifyToken } from './utils/jwt.js';
import User from './models/user.js';

let io;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: { origin: '*' }
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Token requerido'));

      const decoded = verifyToken(token);
      const user = await User.findById(decoded._id);
      if (!user || user.deleted) return next(new Error('Usuario no encontrado'));

      socket.user = user;
      next();
    } catch {
      next(new Error('Token inválido'));
    }
  });

  io.on('connection', (socket) => {
    const companyId = socket.user.company?.toString();

    if (companyId) {
      socket.join(companyId);
    }

    socket.on('disconnect', () => {});
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    if (process.env.NODE_ENV === 'test') {
      return { to: () => ({ emit: () => {} }) };
    }
    throw new Error('Socket.IO no inicializado');
  }
  return io;
};
