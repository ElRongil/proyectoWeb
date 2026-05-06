import { describe, it, expect } from '@jest/globals';
import AppError from '../../src/utils/appError.js';

describe('AppError', () => {
  it('crea error con statusCode y isOperational', () => {
    const err = new AppError('test error', 400);
    expect(err.message).toBe('test error');
    expect(err.statusCode).toBe(400);
    expect(err.isOperational).toBe(true);
    expect(err instanceof Error).toBe(true);
  });

  it('badRequest crea 400', () => {
    const err = AppError.badRequest('datos incorrectos');
    expect(err.statusCode).toBe(400);
    expect(err.message).toBe('datos incorrectos');
  });

  it('unauthorized crea 401', () => {
    const err = AppError.unauthorized('no autorizado');
    expect(err.statusCode).toBe(401);
  });

  it('forbidden crea 403', () => {
    const err = AppError.forbidden('prohibido');
    expect(err.statusCode).toBe(403);
    expect(err.message).toBe('prohibido');
  });

  it('notFound crea 404', () => {
    const err = AppError.notFound('no encontrado');
    expect(err.statusCode).toBe(404);
  });

  it('conflict crea 409', () => {
    const err = AppError.conflict('conflicto');
    expect(err.statusCode).toBe(409);
  });

  it('tooMany crea 429', () => {
    const err = AppError.tooMany('demasiadas peticiones');
    expect(err.statusCode).toBe(429);
    expect(err.message).toBe('demasiadas peticiones');
  });

  it('internal crea 500 con mensaje por defecto', () => {
    const err = AppError.internal();
    expect(err.statusCode).toBe(500);
    expect(err.message).toBe('Error interno del servidor');
  });

  it('internal acepta mensaje personalizado', () => {
    const err = AppError.internal('fallo inesperado');
    expect(err.statusCode).toBe(500);
    expect(err.message).toBe('fallo inesperado');
  });
});
