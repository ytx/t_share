import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  createProjectVariable,
  updateProjectVariable,
  deleteProjectVariable,
  getProjectVariable,
  getProjectVariables,
  bulkCreateProjectVariables,
} from '../controllers/projectVariableController';

const router = express.Router();

router.use(authenticateToken);

// Project-specific variable routes
router.post('/project/:projectId', createProjectVariable);
router.post('/project/:projectId/bulk', bulkCreateProjectVariables);
router.get('/project/:projectId', getProjectVariables);

// Individual variable routes
router.get('/:id', getProjectVariable);
router.put('/:id', updateProjectVariable);
router.delete('/:id', deleteProjectVariable);

export default router;