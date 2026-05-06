import multer from 'multer';

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten imágenes jpeg, png o webp'), false);
  }
};

// Memoria en lugar de disco: el buffer llega a req.file.buffer
// y Sharp + Cloudinary lo procesan antes de persistir nada localmente
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter
});

export default upload;
