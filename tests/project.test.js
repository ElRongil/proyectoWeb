import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { api, registerAndLogin, setupCompany } from './helpers.js';

let mongod;
let token;
let clientId;
let projectId;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  const auth = await registerAndLogin('project@test.com', 'password123');
  token = auth.token;
  await setupCompany(token, { cif: 'B22222222' });

  const clientRes = await api.post('/api/client')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Cliente Proyecto', cif: 'C11111111' });
  clientId = clientRes.body.client._id;
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongod.stop();
});

describe('POST /api/project', () => {
  it('crea un proyecto correctamente', async () => {
    const res = await api.post('/api/project')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Obra Norte', projectCode: 'P001', client: clientId });

    expect(res.status).toBe(201);
    expect(res.body.project.name).toBe('Obra Norte');
    projectId = res.body.project._id;
  });

  it('rechaza código duplicado en la misma compañía con 409', async () => {
    const res = await api.post('/api/project')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Otra Obra', projectCode: 'P001', client: clientId });

    expect(res.status).toBe(409);
  });

  it('rechaza cliente de otra compañía con 404', async () => {
    const res = await api.post('/api/project')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Obra X', projectCode: 'P999', client: '000000000000000000000000' });

    expect(res.status).toBe(404);
  });
});

describe('GET /api/project', () => {
  it('lista proyectos con paginación', async () => {
    const res = await api.get('/api/project')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.projects)).toBe(true);
    expect(res.body).toHaveProperty('totalItems');
  });

  it('filtra por cliente', async () => {
    const res = await api.get(`/api/project?client=${clientId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.projects.every(p => p.client._id === clientId || p.client === clientId)).toBe(true);
  });

  it('filtra por nombre parcial', async () => {
    const res = await api.get('/api/project?name=Norte')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.projects.length).toBeGreaterThan(0);
  });

  it('filtra por active=true', async () => {
    const res = await api.get('/api/project?active=true')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it('filtra por active=false', async () => {
    const res = await api.get('/api/project?active=false')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });
});

describe('GET /api/project/:id', () => {
  it('devuelve el proyecto con cliente populado', async () => {
    const res = await api.get(`/api/project/${projectId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.project._id).toBe(projectId);
    expect(res.body.project.client).toHaveProperty('name');
  });

  it('devuelve 404 para ID inexistente', async () => {
    const res = await api.get('/api/project/000000000000000000000000')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});

describe('PUT /api/project/:id', () => {
  it('actualiza el proyecto', async () => {
    const res = await api.put(`/api/project/${projectId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Obra Norte Actualizada' });

    expect(res.status).toBe(200);
    expect(res.body.project.name).toBe('Obra Norte Actualizada');
  });

  it('actualiza el proyecto con un cliente válido', async () => {
    const res = await api.put(`/api/project/${projectId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ client: clientId });

    expect(res.status).toBe(200);
  });

  it('rechaza cliente inexistente con 404', async () => {
    const res = await api.put(`/api/project/${projectId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ client: '000000000000000000000000' });

    expect(res.status).toBe(404);
  });

  it('devuelve 404 para proyecto inexistente', async () => {
    const res = await api.put('/api/project/000000000000000000000000')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'No existe' });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/project soft + restore', () => {
  it('archiva con soft=true', async () => {
    const res = await api.delete(`/api/project/${projectId}?soft=true`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('aparece en archivados', async () => {
    const res = await api.get('/api/project/archived')
      .set('Authorization', `Bearer ${token}`);
    const ids = res.body.projects.map(p => p._id);
    expect(ids).toContain(projectId);
  });

  it('restaura el proyecto', async () => {
    const res = await api.patch(`/api/project/${projectId}/restore`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('devuelve 404 al restaurar proyecto no archivado', async () => {
    const res = await api.patch(`/api/project/${projectId}/restore`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/project hard delete', () => {
  let hardDeleteId;

  beforeAll(async () => {
    const res = await api.post('/api/project')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Obra Hard Delete', projectCode: 'HDL001', client: clientId });
    hardDeleteId = res.body.project._id;
  });

  it('elimina permanentemente sin soft=true', async () => {
    const res = await api.delete(`/api/project/${hardDeleteId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/permanentemente/i);
  });

  it('devuelve 404 para proyecto inexistente en hard delete', async () => {
    const res = await api.delete('/api/project/000000000000000000000000')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});
