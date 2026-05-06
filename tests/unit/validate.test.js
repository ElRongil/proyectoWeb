import { describe, it, expect, jest } from '@jest/globals';
import { validate } from '../../src/middleware/validate.js';
import { z } from 'zod';

describe('validate middleware', () => {
  const mockRes = {};

  it('llama next() sin error cuando los datos son válidos', async () => {
    const schema = z.object({ name: z.string() });
    const mockReq = { body: { name: 'test' } };
    const mockNext = jest.fn();

    validate(schema)(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledWith();
    expect(mockReq.body.name).toBe('test');
  });

  it('llama next(AppError) con 400 cuando Zod falla', async () => {
    const schema = z.object({ email: z.string().email() });
    const mockReq = { body: { email: 'no-es-email' } };
    const mockNext = jest.fn();

    validate(schema)(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
    const error = mockNext.mock.calls[0][0];
    expect(error.statusCode).toBe(400);
  });

  it('llama next(error) cuando schema.parse lanza error no-Zod', () => {
    const nonZodError = new Error('Error inesperado del schema');
    const fakeSchema = {
      parse: () => { throw nonZodError; }
    };
    const mockReq = { body: {} };
    const mockNext = jest.fn();

    validate(fakeSchema)(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledWith(nonZodError);
  });
});
