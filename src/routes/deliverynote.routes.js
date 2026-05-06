import { Router } from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import upload from '../middleware/upload.js';
import { createDeliveryNoteSchema } from '../validators/deliverynote.validator.js';
import {
  createDeliveryNote, getDeliveryNotes, getDeliveryNote,
  deleteDeliveryNote, signDeliveryNote, getDeliveryNotePdf
} from '../controllers/deliverynote.controller.js';

const router = Router();
router.use(authMiddleware);

/**
 * @swagger
 * /deliverynote/pdf/{id}:
 *   get:
 *     summary: Descargar albarán en PDF
 *     tags: [Albaranes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: PDF generado al vuelo
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       302:
 *         description: Redirige al PDF firmado en la nube
 *       404:
 *         description: Albarán no encontrado
 */
router.get('/pdf/:id', getDeliveryNotePdf);

/**
 * @swagger
 * /deliverynote:
 *   get:
 *     summary: Listar albaranes
 *     tags: [Albaranes]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: project
 *         schema: { type: string }
 *       - in: query
 *         name: client
 *         schema: { type: string }
 *       - in: query
 *         name: format
 *         schema: { type: string, enum: [material, hours] }
 *       - in: query
 *         name: signed
 *         schema: { type: boolean }
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date }
 *         description: Fecha de trabajo desde (YYYY-MM-DD)
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date }
 *         description: Fecha de trabajo hasta (YYYY-MM-DD)
 *       - in: query
 *         name: sort
 *         schema: { type: string, default: '-workDate' }
 *     responses:
 *       200:
 *         description: Lista paginada de albaranes
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Pagination'
 *                 - type: object
 *                   properties:
 *                     deliveryNotes:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/DeliveryNote' }
 */
router.get('/', getDeliveryNotes);

/**
 * @swagger
 * /deliverynote/{id}:
 *   get:
 *     summary: Obtener albarán con datos completos (populate)
 *     tags: [Albaranes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Albarán con usuario, cliente y proyecto populados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 deliveryNote: { $ref: '#/components/schemas/DeliveryNote' }
 *       404:
 *         description: Albarán no encontrado
 */
router.get('/:id', getDeliveryNote);

/**
 * @swagger
 * /deliverynote:
 *   post:
 *     summary: Crear un albarán
 *     tags: [Albaranes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [project, client, format, workDate]
 *             properties:
 *               project: { type: string }
 *               client: { type: string }
 *               format: { type: string, enum: [material, hours] }
 *               description: { type: string }
 *               workDate: { type: string, format: date }
 *               material: { type: string }
 *               quantity: { type: number }
 *               unit: { type: string }
 *               hours: { type: number }
 *               workers:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name: { type: string }
 *                     hours: { type: number }
 *     responses:
 *       201:
 *         description: Albarán creado
 *       404:
 *         description: Proyecto o cliente no encontrado
 */
router.post('/', validate(createDeliveryNoteSchema), createDeliveryNote);

/**
 * @swagger
 * /deliverynote/{id}/sign:
 *   patch:
 *     summary: Firmar un albarán (multipart/form-data)
 *     tags: [Albaranes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               signature:
 *                 type: string
 *                 format: binary
 *                 description: Imagen de la firma (jpeg/png/webp, max 5MB)
 *     responses:
 *       200:
 *         description: Albarán firmado. Devuelve signatureUrl y pdfUrl.
 *       400:
 *         description: Albarán ya firmado o sin imagen
 *       404:
 *         description: Albarán no encontrado
 */
router.patch('/:id/sign', upload.single('signature'), signDeliveryNote);

/**
 * @swagger
 * /deliverynote/{id}:
 *   delete:
 *     summary: Eliminar albarán (solo si no está firmado)
 *     tags: [Albaranes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Albarán eliminado
 *       400:
 *         description: No se puede eliminar un albarán firmado
 *       404:
 *         description: Albarán no encontrado
 */
router.delete('/:id', deleteDeliveryNote);

export default router;
