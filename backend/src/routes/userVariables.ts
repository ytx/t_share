import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  createUserVariable,
  updateUserVariable,
  deleteUserVariable,
  getUserVariable,
  getUserVariables,
  bulkCreateUserVariables,
} from '../controllers/userVariableController';

const router = express.Router();

router.use(authenticateToken);

router.post('/', createUserVariable);
router.post('/bulk', bulkCreateUserVariables);
router.get('/', getUserVariables);
router.get('/:id', getUserVariable);
router.put('/:id', updateUserVariable);
router.delete('/:id', deleteUserVariable);

export default router;