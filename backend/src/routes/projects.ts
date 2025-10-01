import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  createProject,
  updateProject,
  deleteProject,
  getProject,
  getUserProjects,
  getAllProjects,
} from '../controllers/projectController';
import {
  getProjectPorts,
  updateProjectPort,
  checkPortConflict,
} from '../controllers/portManagementController';

const router = express.Router();

router.use(authenticateToken);

router.post('/', createProject);
router.get('/', getUserProjects);
router.get('/all', getAllProjects);
router.get('/:id', getProject);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);

// Port management routes
router.get('/:projectId/ports', getProjectPorts);
router.put('/:projectId/ports', updateProjectPort);
router.get('/:projectId/ports/check-conflict', checkPortConflict);

export default router;