import { v2 as cloudinary } from 'cloudinary';
import sharp from 'sharp';
import config from '../config/index.js';

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret
});

const uploadBuffer = (buffer, options) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
    stream.end(buffer);
  });

export const uploadImage = async (buffer, folder = 'bildyapp') => {
  const optimized = await sharp(buffer)
    .resize({ width: 800, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();

  const result = await uploadBuffer(optimized, {
    folder,
    resource_type: 'image',
    format: 'webp'
  });

  return { url: result.secure_url, publicId: result.public_id };
};

export const uploadPdf = async (buffer, folder = 'bildyapp/pdfs') => {
  const result = await uploadBuffer(buffer, {
    folder,
    resource_type: 'raw',
    format: 'pdf'
  });

  return { url: result.secure_url, publicId: result.public_id };
};

export const deleteFile = (publicId, resourceType = 'image') =>
  cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
