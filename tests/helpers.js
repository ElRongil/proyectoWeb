import request from 'supertest';
import app from '../src/app.js';

export const api = request(app);

export const registerAndLogin = async (email = 'test@test.com', password = 'password123') => {
  await api.post('/api/user/register').send({ email, password });
  const res = await api.post('/api/user/login').send({ email, password });
  return {
    token: res.body.accessToken,
    refreshToken: res.body.refreshToken,
    user: res.body.user
  };
};

export const setupCompany = async (token, overrides = {}) => {
  const res = await api
    .patch('/api/user/company')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: 'Empresa Test',
      cif: 'B12345678',
      isFreelance: false,
      ...overrides
    });
  return res.body.company;
};
