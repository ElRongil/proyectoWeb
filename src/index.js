import { setDefaultResultOrder } from 'dns';
setDefaultResultOrder('ipv4first');

import mongoose from 'mongoose';
import app from './app.js';
import config from './config/index.js';


const start = async () => {
  try {
    await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 5000,
      family: 4  // fuerza IPv4
    });
    console.log('✅ Conectado a MongoDB');

    app.listen(config.port, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${config.port}`);
    });
  } catch (error) {
    console.error('❌ Error al arrancar:', error.message);
    process.exit(1);
  }
};

start();