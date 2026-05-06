import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import mongoose from 'mongoose';
import { api } from './helpers.js';

beforeAll(async () => {
  await mongoose.connect(process.env.DB_URI);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
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
