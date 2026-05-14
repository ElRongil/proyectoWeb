import { Router } from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import { createClientSchema, updateClientSchema } from '../validators/client.validator.js';
import {
  createClient, getClients, getClient, updateClient,
  deleteClient, getArchivedClients, restoreClient
} from '../controllers/client.controller.js';

const router = Router();
router.use(authMiddleware);

/**
 * @swagger
 * /client:
 *   get:
 *     summary: Listar clientes de la compañía
 *     tags: [Clientes]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: name
 *         schema: { type: string }
 *         description: Búsqueda parcial por nombre
 *       - in: query
 *         name: sort
 *         schema: { type: string, default: '-createdAt' }
 *     responses:
 *       200:
 *         description: Lista paginada de clientes
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Pagination'
 *                 - type: object
 *                   properties:
 *                     clients:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/Client' }
 */
router.get('/', getClients);

/**
 * @swagger
 * /client/archived:
 *   get:
 *     summary: Listar clientes archivados (soft deleted)
 *     tags: [Clientes]
 *     responses:
 *       200:
 *         description: Lista de clientes archivados
 */
router.get('/archived', getArchivedClients);

/**
 * @swagger
 * /client/{id}:
 *   get:
 *     summary: Obtener un cliente concreto
 *     tags: [Clientes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Cliente encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 client: { $ref: '#/components/schemas/Client' }
 *       404:
 *         description: Cliente no encontrado
 */
router.get('/:id', getClient);

/**
 * @swagger
 * /client:
 *   post:
 *     summary: Crear un cliente
 *     tags: [Clientes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, cif]
 *             properties:
 *               name: { type: string }
 *               cif: { type: string }
 *               email: { type: string, format: email }
 *               phone: { type: string }
 *               address: { $ref: '#/components/schemas/Address' }
 *     responses:
 *       201:
 *         description: Cliente creado
 *       409:
 *         description: CIF ya existe en la compañía
 */
router.post('/', validate(createClientSchema), createClient);

/**
 * @swagger
 * /client/{id}:
 *   patch:
 *     summary: Actualizar parcialmente un cliente
 *     tags: [Clientes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/Client' }
 *     responses:
 *       200:
 *         description: Cliente actualizado
 *       400:
 *         description: Datos de entrada inválidos
 *       404:
 *         description: Cliente no encontrado
 */
router.patch('/:id', validate(updateClientSchema), updateClient);

/**
 * @swagger
 * /client/{id}:
 *   delete:
 *     summary: Eliminar cliente (soft o hard)
 *     tags: [Clientes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: soft
 *         schema: { type: boolean }
 *         description: Si true, archiva en lugar de borrar
 *     responses:
 *       200:
 *         description: Cliente eliminado o archivado
 *       404:
 *         description: Cliente no encontrado
 */
router.delete('/:id', deleteClient);

/**
 * @swagger
 * /client/{id}/restore:
 *   patch:
 *     summary: Restaurar cliente archivado
 *     tags: [Clientes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Cliente restaurado
 *       404:
 *         description: Cliente archivado no encontrado
 */
router.patch('/:id/restore', restoreClient);

export default router;
