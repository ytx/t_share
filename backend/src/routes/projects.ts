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

const router = express.Router();

router.use(authenticateToken);

router.post('/', createProject);
router.get('/', getUserProjects);
router.get('/all', getAllProjects);
router.get('/:id', getProject);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);

export default router;