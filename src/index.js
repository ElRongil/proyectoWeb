import { setDefaultResultOrder } from 'dns';
setDefaultResultOrder('ipv4first');

import { createServer } from 'http';
import mongoose from 'mongoose';
import app from './app.js';
import config from './config/index.js';
import { initSocket } from './socket.js';

const httpServer = createServer(app);
initSocket(httpServer);

const start = async () => {
  try {
    await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 5000,
      family: 4
    });
    console.log('✅ Conectado a MongoDB');

    httpServer.listen(config.port, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${config.port}`);
    });
  } catch (error) {
    console.error('❌ Error al arrancar:', error.message);
    process.exit(1);
  }
};

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('🔌 Conexión cerrada');
  process.exit(0);
});

start();