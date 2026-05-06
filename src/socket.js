import { Server } from 'socket.io';
import { verifyToken } from './utils/jwt.js';
import User from './models/user.js';

let io;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: { origin: '*' }
  });

  // Middleware de autenticación JWT en cada conexión WebSocket
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

    // Cada usuario entra en la room de su compañía
    if (companyId) {
      socket.join(companyId);
    }

    socket.on('disconnect', () => {});
  });

  return io;
};

// Los controladores llaman a getIO() para emitir eventos
export const getIO = () => {
  if (!io) {
    // En tests no se inicializa Socket.IO — devolvemos un stub silencioso
    if (process.env.NODE_ENV === 'test') {
      return { to: () => ({ emit: () => {} }) };
    }
    throw new Error('Socket.IO no inicializado');
  }
  return io;
};
