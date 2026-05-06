import { Router } from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import upload from '../middleware/upload.js';
import { createDeliveryNoteSchema } from '../validators/deliverynote.validator.js';
import {
  createDeliveryNote,
  getDeliveryNotes,
  getDeliveryNote,
  deleteDeliveryNote,
  signDeliveryNote,
  getDeliveryNotePdf
} from '../controllers/deliverynote.controller.js';

const router = Router();

router.use(authMiddleware);

// Rutas fijas antes de /:id para evitar conflictos
router.get('/pdf/:id', getDeliveryNotePdf);

router.get('/', getDeliveryNotes);
router.get('/:id', getDeliveryNote);
router.post('/', validate(createDeliveryNoteSchema), createDeliveryNote);
router.patch('/:id/sign', upload.single('signature'), signDeliveryNote);
router.delete('/:id', deleteDeliveryNote);

export default router;
