import { jest, describe, it, expect, beforeAll } from '@jest/globals';

const mockEnd = jest.fn();
const mockUploadStream = jest.fn();
const mockDestroy = jest.fn();
const mockConfig = jest.fn();

jest.unstable_mockModule('cloudinary', () => ({
  v2: {
    config: mockConfig,
    uploader: {
      upload_stream: mockUploadStream,
      destroy: mockDestroy
    }
  }
}));

const sharpChain = {
  resize: jest.fn().mockReturnThis(),
  webp: jest.fn().mockReturnThis(),
  toBuffer: jest.fn().mockResolvedValue(Buffer.from('optimized-image'))
};
const mockSharpFn = jest.fn().mockReturnValue(sharpChain);

jest.unstable_mockModule('sharp', () => ({ default: mockSharpFn }));

let uploadImage, uploadPdf, deleteFile;

beforeAll(async () => {
  mockUploadStream.mockImplementation((_opts, cb) => {
    cb(null, { secure_url: 'https://res.cloudinary.com/test/img.webp', public_id: 'test/img' });
    return { end: mockEnd };
  });
  mockDestroy.mockResolvedValue({ result: 'ok' });

  const mod = await import('../../src/services/storage.service.js');
  uploadImage = mod.uploadImage;
  uploadPdf = mod.uploadPdf;
  deleteFile = mod.deleteFile;
});

describe('storage.service', () => {
  describe('uploadImage', () => {
    it('optimiza con sharp y sube a cloudinary', async () => {
      const result = await uploadImage(Buffer.from('raw-image'), 'test/logos');

      expect(mockSharpFn).toHaveBeenCalled();
      expect(sharpChain.resize).toHaveBeenCalled();
      expect(sharpChain.webp).toHaveBeenCalled();
      expect(sharpChain.toBuffer).toHaveBeenCalled();
      expect(mockUploadStream).toHaveBeenCalled();
      expect(result.url).toBe('https://res.cloudinary.com/test/img.webp');
      expect(result.publicId).toBe('test/img');
    });

    it('rechaza si cloudinary devuelve error', async () => {
      mockUploadStream.mockImplementationOnce((_opts, cb) => {
        cb(new Error('cloudinary error'), null);
        return { end: mockEnd };
      });

      await expect(uploadImage(Buffer.from('raw'))).rejects.toThrow('cloudinary error');
    });
  });

  describe('uploadPdf', () => {
    it('sube PDF a cloudinary con resource_type raw', async () => {
      const result = await uploadPdf(Buffer.from('%PDF-1.4'), 'test/pdfs');

      expect(mockUploadStream).toHaveBeenCalledWith(
        expect.objectContaining({ resource_type: 'raw' }),
        expect.any(Function)
      );
      expect(result.url).toBeDefined();
      expect(result.publicId).toBeDefined();
    });
  });

  describe('deleteFile', () => {
    it('elimina archivo de cloudinary con resource_type por defecto image', async () => {
      await deleteFile('test/img123');

      expect(mockDestroy).toHaveBeenCalledWith('test/img123', { resource_type: 'image' });
    });

    it('elimina archivo con resource_type personalizado', async () => {
      await deleteFile('test/doc123', 'raw');

      expect(mockDestroy).toHaveBeenCalledWith('test/doc123', { resource_type: 'raw' });
    });
  });
});
