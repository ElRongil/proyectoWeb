import { describe, it, expect } from '@jest/globals';
import { generateDeliveryNotePdf } from '../../src/services/pdf.service.js';

const address = { street: 'Calle Test', number: '1', postal: '28001', city: 'Madrid', province: 'Madrid' };

const baseNote = {
  workDate: new Date('2025-06-01'),
  format: 'hours',
  description: 'Trabajo de prueba',
  hours: 8,
  workers: [{ name: 'Juan García', hours: 8 }, { name: 'María López', hours: 6 }],
  signed: false,
  user: { name: 'Test', lastName: 'User', email: 'test@test.com' },
  client: { name: 'Cliente Test', cif: 'B12345678', email: 'client@test.com', address },
  project: { name: 'Proyecto Test', projectCode: 'P001', address, notes: 'Notas del proyecto' },
  company: { name: 'Empresa Test', cif: 'A12345678', address }
};

describe('generateDeliveryNotePdf', () => {
  it('genera PDF de albarán de horas con workers', async () => {
    const buffer = await generateDeliveryNotePdf(baseNote);
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(500);
    expect(buffer.slice(0, 4).toString()).toBe('%PDF');
  });

  it('genera PDF de albarán de materiales', async () => {
    const note = {
      ...baseNote,
      format: 'material',
      material: 'Cemento Portland',
      quantity: 50,
      unit: 'kg',
      workers: []
    };
    const buffer = await generateDeliveryNotePdf(note);
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(500);
  });

  it('genera PDF de albarán de horas sin workers pero con total', async () => {
    const note = { ...baseNote, workers: [], hours: 12 };
    const buffer = await generateDeliveryNotePdf(note);
    expect(Buffer.isBuffer(buffer)).toBe(true);
  });

  it('genera PDF de albarán firmado sin imagen de firma', async () => {
    const note = { ...baseNote, signed: true, signedAt: new Date('2025-06-02') };
    const buffer = await generateDeliveryNotePdf(note, null);
    expect(Buffer.isBuffer(buffer)).toBe(true);
  });

  it('maneja valores nulos en user, client, project, company', async () => {
    const note = { ...baseNote, user: null, client: null, project: null, company: null };
    const buffer = await generateDeliveryNotePdf(note);
    expect(Buffer.isBuffer(buffer)).toBe(true);
  });

  it('maneja dirección nula en addressText', async () => {
    const note = {
      ...baseNote,
      client: { name: 'Sin dirección', cif: 'B99999999', email: null, address: null },
      project: { name: 'Proyecto', projectCode: 'P002', address: null, notes: null },
      company: { name: 'Empresa', cif: 'A99999999', address: null }
    };
    const buffer = await generateDeliveryNotePdf(note);
    expect(Buffer.isBuffer(buffer)).toBe(true);
  });

  it('genera PDF con descripción', async () => {
    const note = { ...baseNote, description: 'Descripción detallada del trabajo' };
    const buffer = await generateDeliveryNotePdf(note);
    expect(Buffer.isBuffer(buffer)).toBe(true);
  });
});
