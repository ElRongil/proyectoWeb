import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { api, registerAndLogin, setupCompany } from './helpers.js';

let mongod;
let token;
let clientId;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  const auth = await registerAndLogin('client@test.com', 'password123');
  token = auth.token;
  await setupCompany(token);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongod.stop();
});

describe('POST /api/client', () => {
  it('crea un cliente correctamente', async () => {
    const res = await api.post('/api/client')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Acme S.L.', cif: 'B11111111', email: 'acme@test.com' });

    expect(res.status).toBe(201);
    expect(res.body.client.name).toBe('Acme S.L.');
    clientId = res.body.client._id;
  });

  it('rechaza CIF duplicado en la misma compañía con 409', async () => {
    const res = await api.post('/api/client')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Otra empresa', cif: 'B11111111' });

    expect(res.status).toBe(409);
  });

  it('rechaza sin nombre con 400', async () => {
    const res = await api.post('/api/client')
      .set('Authorization', `Bearer ${token}`)
      .send({ cif: 'B99999999' });

    expect(res.status).toBe(400);
  });
});

describe('GET /api/client', () => {
  it('lista los clientes con paginación', async () => {
    const res = await api.get('/api/client')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('clients');
    expect(res.body).toHaveProperty('totalItems');
    expect(res.body).toHaveProperty('totalPages');
    expect(res.body).toHaveProperty('currentPage');
    expect(Array.isArray(res.body.clients)).toBe(true);
  });

  it('filtra por nombre parcial', async () => {
    const res = await api.get('/api/client?name=Acme')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.clients.length).toBeGreaterThan(0);
    expect(res.body.clients[0].name).toContain('Acme');
  });
});

describe('GET /api/client/:id', () => {
  it('devuelve el cliente correcto', async () => {
    const res = await api.get(`/api/client/${clientId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.client._id).toBe(clientId);
  });

  it('devuelve 404 para ID inexistente', async () => {
    const res = await api.get('/api/client/000000000000000000000000')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/client/:id', () => {
  it('actualiza el cliente parcialmente', async () => {
    const res = await api.patch(`/api/client/${clientId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Acme Actualizado' });

    expect(res.status).toBe(200);
    expect(res.body.client.name).toBe('Acme Actualizado');
  });

  it('devuelve 404 para cliente inexistente', async () => {
    const res = await api.patch('/api/client/000000000000000000000000')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'No existe' });

    expect(res.status).toBe(404);
  });

  it('es idempotente: dos llamadas con el mismo body producen el mismo estado final', async () => {
    const body = { name: 'Nombre Idempotente', cif: 'B11111111' };

    const res1 = await api.patch(`/api/client/${clientId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(body);

    const res2 = await api.patch(`/api/client/${clientId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(body);

    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);
    expect(res2.body.client.name).toBe(res1.body.client.name);
    expect(res2.body.client.cif).toBe(res1.body.client.cif);
    expect(res2.body.client._id).toBe(res1.body.client._id);
  });
});

describe('DELETE /api/client/:id (soft)', () => {
  it('archiva el cliente con soft=true', async () => {
    const res = await api.delete(`/api/client/${clientId}?soft=true`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/archivado/i);
  });

  it('no aparece en el listado activo', async () => {
    const res = await api.get('/api/client').set('Authorization', `Bearer ${token}`);
    const ids = res.body.clients.map(c => c._id);
    expect(ids).not.toContain(clientId);
  });

  it('devuelve 404 al hacer soft delete de cliente inexistente', async () => {
    const res = await api.delete('/api/client/000000000000000000000000?soft=true')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});

describe('GET /api/client/archived + PATCH restore', () => {
  it('aparece en archivados', async () => {
    const res = await api.get('/api/client/archived')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const ids = res.body.clients.map(c => c._id);
    expect(ids).toContain(clientId);
  });

  it('restaura el cliente', async () => {
    const res = await api.patch(`/api/client/${clientId}/restore`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.client._id).toBe(clientId);
  });

  it('devuelve 404 al restaurar cliente no archivado', async () => {
    const res = await api.patch(`/api/client/${clientId}/restore`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/client/:id (hard delete)', () => {
  let hardClientId;

  beforeAll(async () => {
    const res = await api.post('/api/client')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Para Borrar', cif: 'Z99999999' });
    hardClientId = res.body.client._id;
  });

  it('elimina permanentemente sin soft=true', async () => {
    const res = await api.delete(`/api/client/${hardClientId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/permanentemente/i);
  });

  it('devuelve 404 para cliente inexistente en hard delete', async () => {
    const res = await api.delete('/api/client/000000000000000000000000')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});
