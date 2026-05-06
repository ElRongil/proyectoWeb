import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import mongoose from 'mongoose';
import { api, registerAndLogin, setupCompany } from './helpers.js';

let token;
let clientId;
let projectId;
let noteId;

beforeAll(async () => {
  await mongoose.connect(process.env.DB_URI);
  const auth = await registerAndLogin('dn@test.com', 'password123');
  token = auth.token;
  await setupCompany(token, { cif: 'B33333333' });

  const clientRes = await api.post('/api/client')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Cliente Albarán', cif: 'D11111111' });
  clientId = clientRes.body.client._id;

  const projectRes = await api.post('/api/project')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Proyecto Albarán', projectCode: 'DN001', client: clientId });
  projectId = projectRes.body.project._id;
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

describe('POST /api/deliverynote', () => {
  it('crea albarán de horas', async () => {
    const res = await api.post('/api/deliverynote')
      .set('Authorization', `Bearer ${token}`)
      .send({
        project: projectId, client: clientId,
        format: 'hours', workDate: '2025-06-01',
        workers: [{ name: 'Juan García', hours: 8 }]
      });

    expect(res.status).toBe(201);
    expect(res.body.deliveryNote.format).toBe('hours');
    noteId = res.body.deliveryNote._id;
  });

  it('crea albarán de materiales', async () => {
    const res = await api.post('/api/deliverynote')
      .set('Authorization', `Bearer ${token}`)
      .send({
        project: projectId, client: clientId,
        format: 'material', workDate: '2025-06-02',
        material: 'Cemento', quantity: 50, unit: 'kg'
      });

    expect(res.status).toBe(201);
    expect(res.body.deliveryNote.format).toBe('material');
  });

  it('rechaza hours sin horas ni workers con 400', async () => {
    const res = await api.post('/api/deliverynote')
      .set('Authorization', `Bearer ${token}`)
      .send({ project: projectId, client: clientId, format: 'hours', workDate: '2025-06-01' });

    expect(res.status).toBe(400);
  });

  it('rechaza proyecto de otra compañía con 404', async () => {
    const res = await api.post('/api/deliverynote')
      .set('Authorization', `Bearer ${token}`)
      .send({
        project: '000000000000000000000000', client: clientId,
        format: 'hours', workDate: '2025-06-01', hours: 4
      });

    expect(res.status).toBe(404);
  });
});

describe('GET /api/deliverynote', () => {
  it('lista albaranes con paginación', async () => {
    const res = await api.get('/api/deliverynote')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.deliveryNotes)).toBe(true);
    expect(res.body).toHaveProperty('totalItems');
    expect(res.body.totalItems).toBeGreaterThanOrEqual(2);
  });

  it('filtra por formato', async () => {
    const res = await api.get('/api/deliverynote?format=hours')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.deliveryNotes.every(n => n.format === 'hours')).toBe(true);
  });

  it('filtra por rango de fechas', async () => {
    const res = await api.get('/api/deliverynote?from=2025-06-01&to=2025-06-30')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.deliveryNotes)).toBe(true);
  });
});

describe('GET /api/deliverynote/:id', () => {
  it('devuelve albarán con campos populados', async () => {
    const res = await api.get(`/api/deliverynote/${noteId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.deliveryNote._id).toBe(noteId);
    expect(res.body.deliveryNote.client).toHaveProperty('name');
    expect(res.body.deliveryNote.project).toHaveProperty('name');
  });
});

describe('DELETE /api/deliverynote/:id', () => {
  it('elimina un albarán no firmado', async () => {
    const res = await api.delete(`/api/deliverynote/${noteId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/eliminado/i);
  });

  it('devuelve 404 al intentar obtenerlo tras borrar', async () => {
    const res = await api.get(`/api/deliverynote/${noteId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});
