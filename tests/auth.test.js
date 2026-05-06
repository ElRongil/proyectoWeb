import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { api } from './helpers.js';
import User from '../src/models/user.js';

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongod.stop();
});

describe('GET /api/health', () => {
  it('devuelve estado ok con DB conectado', async () => {
    const res = await api.get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body).toHaveProperty('db');
    expect(res.body).toHaveProperty('uptime');
    expect(res.body).toHaveProperty('timestamp');
  });
});

describe('Ruta desconocida', () => {
  it('devuelve 404 para rutas no existentes', async () => {
    const res = await api.get('/api/ruta-que-no-existe');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe(true);
  });
});

describe('POST /api/user/register', () => {
  it('crea un usuario y devuelve tokens', async () => {
    const res = await api.post('/api/user/register')
      .send({ email: 'auth@test.com', password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
    expect(res.body.user.email).toBe('auth@test.com');
    expect(res.body.user.status).toBe('pending');
  });

  it('rechaza email duplicado con 409', async () => {
    await api.post('/api/user/register').send({ email: 'dup@test.com', password: 'password123' });
    const res = await api.post('/api/user/register').send({ email: 'dup@test.com', password: 'password123' });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe(true);
  });

  it('rechaza password corta con 400', async () => {
    const res = await api.post('/api/user/register').send({ email: 'short@test.com', password: '123' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/user/login', () => {
  beforeAll(async () => {
    await api.post('/api/user/register').send({ email: 'login@test.com', password: 'password123' });
  });

  it('devuelve tokens con credenciales correctas', async () => {
    const res = await api.post('/api/user/login').send({ email: 'login@test.com', password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
  });

  it('rechaza contraseña incorrecta con 401', async () => {
    const res = await api.post('/api/user/login').send({ email: 'login@test.com', password: 'wrongpass' });
    expect(res.status).toBe(401);
  });

  it('rechaza email inexistente con 401', async () => {
    const res = await api.post('/api/user/login').send({ email: 'noexiste@test.com', password: 'password123' });
    expect(res.status).toBe(401);
  });
});

describe('POST /api/user/refresh', () => {
  it('devuelve nuevo accessToken con refreshToken válido', async () => {
    const reg = await api.post('/api/user/register').send({ email: 'refresh@test.com', password: 'password123' });
    const res = await api.post('/api/user/refresh').send({ refreshToken: reg.body.refreshToken });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  it('rechaza refreshToken inválido con 401', async () => {
    const res = await api.post('/api/user/refresh').send({ refreshToken: 'token-falso' });
    expect(res.status).toBe(401);
  });

  it('rechaza sin refreshToken con 400', async () => {
    const res = await api.post('/api/user/refresh').send({});
    expect(res.status).toBe(400);
  });
});

describe('GET /api/user', () => {
  it('devuelve el usuario autenticado', async () => {
    const reg = await api.post('/api/user/register').send({ email: 'getuser@test.com', password: 'password123' });
    const res = await api.get('/api/user').set('Authorization', `Bearer ${reg.body.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('getuser@test.com');
  });

  it('rechaza sin token con 401', async () => {
    const res = await api.get('/api/user');
    expect(res.status).toBe(401);
  });
});

describe('PUT /api/user/validation (verifyEmail)', () => {
  let token;
  let verifyCode;

  beforeAll(async () => {
    const reg = await api.post('/api/user/register').send({ email: 'verify@test.com', password: 'password123' });
    token = reg.body.accessToken;
    const user = await User.findOne({ email: 'verify@test.com' });
    verifyCode = user.verificationCode;
  });

  it('verifica email con código correcto', async () => {
    const res = await api.put('/api/user/validation')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: verifyCode });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/verificado/i);
  });

  it('rechaza código incorrecto con 400', async () => {
    const reg = await api.post('/api/user/register').send({ email: 'verify2@test.com', password: 'password123' });
    const res = await api.put('/api/user/validation')
      .set('Authorization', `Bearer ${reg.body.accessToken}`)
      .send({ code: '000000' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/incorrecto/i);
  });

  it('rechaza cuando se agotan los intentos', async () => {
    const reg = await api.post('/api/user/register').send({ email: 'verify3@test.com', password: 'password123' });
    const tok = reg.body.accessToken;
    await User.findOneAndUpdate({ email: 'verify3@test.com' }, { verificationAttempts: 0 });

    const res = await api.put('/api/user/validation')
      .set('Authorization', `Bearer ${tok}`)
      .send({ code: '123456' });

    expect(res.status).toBe(429);
  });
});

describe('PUT /api/user/register (updatePersonalData)', () => {
  let token;

  beforeAll(async () => {
    const reg = await api.post('/api/user/register').send({ email: 'personal@test.com', password: 'password123' });
    token = reg.body.accessToken;
  });

  it('actualiza nombre, apellido y NIF', async () => {
    const res = await api.put('/api/user/register')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Juan', lastName: 'García', nif: '12345678A' });

    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe('Juan');
    expect(res.body.user.lastName).toBe('García');
  });

  it('rechaza datos incompletos con 400', async () => {
    const res = await api.put('/api/user/register')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Solo nombre' });

    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/user/company (updateCompany)', () => {
  let token;

  beforeAll(async () => {
    const reg = await api.post('/api/user/register').send({ email: 'company@test.com', password: 'password123' });
    token = reg.body.accessToken;
    await api.put('/api/user/register').set('Authorization', `Bearer ${token}`)
      .send({ name: 'Ana', lastName: 'López', nif: 'X1234567B' });
  });

  it('crea empresa nueva (no freelance)', async () => {
    const res = await api.patch('/api/user/company')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Mi Empresa SL', cif: 'B98765432', isFreelance: false });

    expect(res.status).toBe(200);
    expect(res.body.company.cif).toBe('B98765432');
    expect(res.body.role).toBe('admin');
  });

  it('une a empresa existente como guest', async () => {
    const reg2 = await api.post('/api/user/register').send({ email: 'guest@test.com', password: 'password123' });
    const token2 = reg2.body.accessToken;

    const res = await api.patch('/api/user/company')
      .set('Authorization', `Bearer ${token2}`)
      .send({ name: 'Mi Empresa SL', cif: 'B98765432', isFreelance: false });

    expect(res.status).toBe(200);
    expect(res.body.role).toBe('guest');
  });

  it('crea empresa como autónomo (isFreelance)', async () => {
    const reg3 = await api.post('/api/user/register').send({ email: 'freelance@test.com', password: 'password123' });
    const tok3 = reg3.body.accessToken;
    await api.put('/api/user/register').set('Authorization', `Bearer ${tok3}`)
      .send({ name: 'Carlos', lastName: 'Ruiz', nif: 'Y9876543Z' });

    const res = await api.patch('/api/user/company')
      .set('Authorization', `Bearer ${tok3}`)
      .send({ name: 'Ignored', cif: 'Ignored', isFreelance: true });

    expect(res.status).toBe(200);
    expect(res.body.company.isFreelance).toBe(true);
    expect(res.body.role).toBe('admin');
  });
});

describe('POST /api/user/logout', () => {
  it('cierra sesión correctamente', async () => {
    const reg = await api.post('/api/user/register').send({ email: 'logout@test.com', password: 'password123' });
    const res = await api.post('/api/user/logout')
      .set('Authorization', `Bearer ${reg.body.accessToken}`)
      .send({ refreshToken: reg.body.refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/cerrada/i);
  });
});

describe('DELETE /api/user', () => {
  it('soft delete: marca usuario como eliminado', async () => {
    const reg = await api.post('/api/user/register').send({ email: 'softdel@test.com', password: 'password123' });
    const res = await api.delete('/api/user?soft=true')
      .set('Authorization', `Bearer ${reg.body.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.deleted).toBe(true);
  });

  it('hard delete: elimina usuario permanentemente', async () => {
    const reg = await api.post('/api/user/register').send({ email: 'harddel@test.com', password: 'password123' });
    const res = await api.delete('/api/user')
      .set('Authorization', `Bearer ${reg.body.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/permanentemente/i);
  });
});

describe('PUT /api/user/password (changePassword)', () => {
  let token;

  beforeAll(async () => {
    const reg = await api.post('/api/user/register').send({ email: 'changepw@test.com', password: 'password123' });
    token = reg.body.accessToken;
  });

  it('cambia contraseña correctamente', async () => {
    const res = await api.put('/api/user/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'password123', newPassword: 'newpass456' });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/actualizada/i);
  });

  it('rechaza contraseña actual incorrecta con 401', async () => {
    const res = await api.put('/api/user/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'wrongpass', newPassword: 'newpass789' });

    expect(res.status).toBe(401);
  });

  it('rechaza si nueva contraseña es igual a la actual con 400', async () => {
    const res = await api.put('/api/user/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'newpass456', newPassword: 'newpass456' });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/user/invite', () => {
  let adminToken;
  let guestToken;

  beforeAll(async () => {
    const reg = await api.post('/api/user/register').send({ email: 'inviteadmin@test.com', password: 'password123' });
    adminToken = reg.body.accessToken;
    await api.patch('/api/user/company').set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Empresa Invite', cif: 'B55555555', isFreelance: false });

    const reg2 = await api.post('/api/user/register').send({ email: 'inviteguest@test.com', password: 'password123' });
    guestToken = reg2.body.accessToken;
    await api.patch('/api/user/company').set('Authorization', `Bearer ${guestToken}`)
      .send({ name: 'Empresa Invite', cif: 'B55555555', isFreelance: false });
  });

  it('admin puede invitar a un usuario nuevo', async () => {
    const res = await api.post('/api/user/invite')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: 'nuevo@test.com', name: 'Nuevo', lastName: 'Usuario' });

    expect(res.status).toBe(201);
    expect(res.body.invited.email).toBe('nuevo@test.com');
  });

  it('rechaza invitar email ya registrado con 409', async () => {
    const res = await api.post('/api/user/invite')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: 'inviteguest@test.com', name: 'Repetido', lastName: 'Email' });

    expect(res.status).toBe(409);
  });

  it('guest no puede invitar (403)', async () => {
    const res = await api.post('/api/user/invite')
      .set('Authorization', `Bearer ${guestToken}`)
      .send({ email: 'otro@test.com', name: 'Otro', lastName: 'Usuario' });

    expect(res.status).toBe(403);
  });
});
