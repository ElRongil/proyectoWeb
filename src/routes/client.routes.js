import { Router } from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import { createClientSchema, updateClientSchema } from '../validators/client.validator.js';
import {
  createClient,
  getClients,
  getClient,
  updateClient,
  deleteClient,
  getArchivedClients,
  restoreClient
} from '../controllers/client.controller.js';

const router = Router();

router.use(authMiddleware);

router.get('/archived', getArchivedClients);
router.get('/', getClients);
router.get('/:id', getClient);
router.post('/', validate(createClientSchema), createClient);
router.put('/:id', validate(updateClientSchema), updateClient);
router.delete('/:id', deleteClient);
router.patch('/:id/restore', restoreClient);

export default router;
