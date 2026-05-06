import { Router } from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import { createProjectSchema, updateProjectSchema } from '../validators/project.validator.js';
import {
  createProject, getProjects, getProject, updateProject,
  deleteProject, getArchivedProjects, restoreProject
} from '../controllers/project.controller.js';

const router = Router();
router.use(authMiddleware);

/**
 * @swagger
 * /project:
 *   get:
 *     summary: Listar proyectos de la compañía
 *     tags: [Proyectos]
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
 *       - in: query
 *         name: client
 *         schema: { type: string }
 *         description: Filtrar por ID de cliente
 *       - in: query
 *         name: active
 *         schema: { type: boolean }
 *       - in: query
 *         name: sort
 *         schema: { type: string, default: '-createdAt' }
 *     responses:
 *       200:
 *         description: Lista paginada de proyectos
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Pagination'
 *                 - type: object
 *                   properties:
 *                     projects:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/Project' }
 */
router.get('/', getProjects);

/**
 * @swagger
 * /project/archived:
 *   get:
 *     summary: Listar proyectos archivados
 *     tags: [Proyectos]
 *     responses:
 *       200:
 *         description: Lista de proyectos archivados
 */
router.get('/archived', getArchivedProjects);

/**
 * @swagger
 * /project/{id}:
 *   get:
 *     summary: Obtener un proyecto concreto
 *     tags: [Proyectos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Proyecto encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 project: { $ref: '#/components/schemas/Project' }
 *       404:
 *         description: Proyecto no encontrado
 */
router.get('/:id', getProject);

/**
 * @swagger
 * /project:
 *   post:
 *     summary: Crear un proyecto
 *     tags: [Proyectos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, projectCode, client]
 *             properties:
 *               name: { type: string }
 *               projectCode: { type: string }
 *               client: { type: string, description: ID del cliente }
 *               address: { $ref: '#/components/schemas/Address' }
 *               email: { type: string, format: email }
 *               notes: { type: string }
 *     responses:
 *       201:
 *         description: Proyecto creado
 *       404:
 *         description: Cliente no encontrado en la compañía
 *       409:
 *         description: Código de proyecto ya existe
 */
router.post('/', validate(createProjectSchema), createProject);

/**
 * @swagger
 * /project/{id}:
 *   put:
 *     summary: Actualizar un proyecto
 *     tags: [Proyectos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/Project' }
 *     responses:
 *       200:
 *         description: Proyecto actualizado
 *       404:
 *         description: Proyecto no encontrado
 */
router.put('/:id', validate(updateProjectSchema), updateProject);

/**
 * @swagger
 * /project/{id}:
 *   delete:
 *     summary: Eliminar proyecto (soft o hard)
 *     tags: [Proyectos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: soft
 *         schema: { type: boolean }
 *     responses:
 *       200:
 *         description: Proyecto eliminado o archivado
 */
router.delete('/:id', deleteProject);

/**
 * @swagger
 * /project/{id}/restore:
 *   patch:
 *     summary: Restaurar proyecto archivado
 *     tags: [Proyectos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Proyecto restaurado
 */
router.patch('/:id/restore', restoreProject);

export default router;
