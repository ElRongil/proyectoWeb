import { Router } from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import { createProjectSchema, updateProjectSchema } from '../validators/project.validator.js';
import {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  getArchivedProjects,
  restoreProject
} from '../controllers/project.controller.js';

const router = Router();

router.use(authMiddleware);

router.get('/archived', getArchivedProjects);
router.get('/', getProjects);
router.get('/:id', getProject);
router.post('/', validate(createProjectSchema), createProject);
router.put('/:id', validate(updateProjectSchema), updateProject);
router.delete('/:id', deleteProject);
router.patch('/:id/restore', restoreProject);

export default router;
