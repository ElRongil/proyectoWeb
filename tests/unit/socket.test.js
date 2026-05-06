import { jest, describe, it, expect, beforeAll, beforeEach } from '@jest/globals';

const mockMiddlewareCb = { fn: null };
const mockConnectionCb = { fn: null };

const mockServerInstance = {
  use: jest.fn().mockImplementation((fn) => { mockMiddlewareCb.fn = fn; }),
  on: jest.fn().mockImplementation((event, fn) => {
    if (event === 'connection') mockConnectionCb.fn = fn;
  })
};
const MockServer = jest.fn().mockReturnValue(mockServerInstance);

jest.unstable_mockModule('socket.io', () => ({ Server: MockServer }));

const mockVerifyToken = jest.fn();
jest.unstable_mockModule('../../src/utils/jwt.js', () => ({
  verifyToken: mockVerifyToken,
  signToken: jest.fn(),
  signRefreshToken: jest.fn(),
  verifyRefreshToken: jest.fn()
}));

const mockFindById = jest.fn();
jest.unstable_mockModule('../../src/models/user.js', () => ({
  default: { findById: mockFindById }
}));

let initSocket, getIO;

beforeAll(async () => {
  const mod = await import('../../src/socket.js');
  initSocket = mod.initSocket;
  getIO = mod.getIO;
});

describe('getIO antes de initSocket (io=undefined)', () => {
  it('devuelve stub silencioso en entorno test', () => {
    const io = getIO();
    expect(io).toBeDefined();
    expect(typeof io.to).toBe('function');

    const room = io.to('company123');
    expect(typeof room.emit).toBe('function');
    room.emit('test:event', { data: 1 });
  });
});

describe('initSocket', () => {
  const mockHttpServer = {};

  beforeAll(() => {
    initSocket(mockHttpServer);
  });

  it('crea instancia de Socket.IO Server con cors', () => {
    expect(MockServer).toHaveBeenCalledWith(
      mockHttpServer,
      expect.objectContaining({ cors: expect.objectContaining({ origin: '*' }) })
    );
  });

  it('registra middleware de autenticación', () => {
    expect(mockServerInstance.use).toHaveBeenCalled();
    expect(typeof mockMiddlewareCb.fn).toBe('function');
  });

  it('registra handler de conexión', () => {
    expect(mockServerInstance.on).toHaveBeenCalledWith('connection', expect.any(Function));
    expect(typeof mockConnectionCb.fn).toBe('function');
  });

  it('getIO devuelve la instancia io tras init', () => {
    const io = getIO();
    expect(io).toBe(mockServerInstance);
  });

  describe('middleware de autenticación JWT', () => {
    const mockNext = jest.fn();

    beforeEach(() => {
      mockNext.mockClear();
      mockVerifyToken.mockReset();
      mockFindById.mockReset();
    });

    it('llama next(error) si no hay token', async () => {
      const mockSocket = { handshake: { auth: {} } };
      await mockMiddlewareCb.fn(mockSocket, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(mockNext.mock.calls[0][0].message).toBe('Token requerido');
    });

    it('llama next(error) si usuario no existe en DB', async () => {
      mockVerifyToken.mockReturnValue({ _id: 'user123' });
      mockFindById.mockResolvedValue(null);

      const mockSocket = { handshake: { auth: { token: 'valid-token' } } };
      await mockMiddlewareCb.fn(mockSocket, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(mockNext.mock.calls[0][0].message).toBe('Usuario no encontrado');
    });

    it('llama next(error) si usuario está eliminado', async () => {
      mockVerifyToken.mockReturnValue({ _id: 'user123' });
      mockFindById.mockResolvedValue({ _id: 'user123', deleted: true });

      const mockSocket = { handshake: { auth: { token: 'valid-token' } } };
      await mockMiddlewareCb.fn(mockSocket, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('asigna usuario y llama next() sin error si token es válido', async () => {
      const mockUser = { _id: 'user123', deleted: false, company: 'company456' };
      mockVerifyToken.mockReturnValue({ _id: 'user123' });
      mockFindById.mockResolvedValue(mockUser);

      const mockSocket = { handshake: { auth: { token: 'good-token' } } };
      await mockMiddlewareCb.fn(mockSocket, mockNext);

      expect(mockSocket.user).toBe(mockUser);
      expect(mockNext.mock.calls[0]).toHaveLength(0);
    });

    it('llama next(error) si verifyToken lanza excepción', async () => {
      mockVerifyToken.mockImplementation(() => { throw new Error('jwt malformed'); });

      const mockSocket = { handshake: { auth: { token: 'bad-token' } } };
      await mockMiddlewareCb.fn(mockSocket, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(mockNext.mock.calls[0][0].message).toBe('Token inválido');
    });
  });

  describe('handler de conexión', () => {
    it('une el socket a la room de su compañía', () => {
      const mockSocket = {
        user: { company: { toString: () => 'company789' } },
        join: jest.fn(),
        on: jest.fn()
      };
      mockConnectionCb.fn(mockSocket);

      expect(mockSocket.join).toHaveBeenCalledWith('company789');
      expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
    });

    it('no une si el usuario no tiene compañía', () => {
      const mockSocket = {
        user: { company: null },
        join: jest.fn(),
        on: jest.fn()
      };
      mockConnectionCb.fn(mockSocket);

      expect(mockSocket.join).not.toHaveBeenCalled();
      expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
    });
  });
});
