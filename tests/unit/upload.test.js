import { describe, it, expect, beforeAll } from '@jest/globals';
import request from 'supertest';
import express from 'express';

let app;

beforeAll(async () => {
  const uploadModule = await import('../../src/middleware/upload.js');
  const upload = uploadModule.default;

  app = express();

  app.post('/upload', upload.single('file'), (req, res) => {
    res.json({ file: req.file ? 'present' : 'absent' });
  });

  app.use((err, req, res, next) => {
    res.status(400).json({ error: err.message });
  });
});

describe('upload middleware – fileFilter', () => {
  it('acepta imagen jpeg', async () => {
    const buf = Buffer.alloc(10, 0xff);
    const res = await request(app)
      .post('/upload')
      .attach('file', buf, { filename: 'test.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(200);
    expect(res.body.file).toBe('present');
  });

  it('acepta imagen png', async () => {
    const buf = Buffer.alloc(10, 0x89);
    const res = await request(app)
      .post('/upload')
      .attach('file', buf, { filename: 'test.png', contentType: 'image/png' });

    expect(res.status).toBe(200);
    expect(res.body.file).toBe('present');
  });

  it('acepta imagen webp', async () => {
    const buf = Buffer.alloc(10, 0x52);
    const res = await request(app)
      .post('/upload')
      .attach('file', buf, { filename: 'test.webp', contentType: 'image/webp' });

    expect(res.status).toBe(200);
    expect(res.body.file).toBe('present');
  });

  it('rechaza tipo no permitido (pdf)', async () => {
    const buf = Buffer.alloc(10, 0x25);
    const res = await request(app)
      .post('/upload')
      .attach('file', buf, { filename: 'doc.pdf', contentType: 'application/pdf' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/imágenes/i);
  });

  it('rechaza tipo no permitido (gif)', async () => {
    const buf = Buffer.alloc(10, 0x47);
    const res = await request(app)
      .post('/upload')
      .attach('file', buf, { filename: 'image.gif', contentType: 'image/gif' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/jpeg|png|webp/i);
  });
});
