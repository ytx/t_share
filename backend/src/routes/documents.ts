import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  createDocument,
  updateDocument,
  deleteDocument,
  getDocument,
  searchDocuments,
  getProjectDocuments,
  getOrCreateSharedProjectDocument,
  getOrCreatePersonalMemo,
} from '../controllers/documentController';

const router = express.Router();

router.use(authenticateToken);

router.post('/', createDocument);
router.get('/search', searchDocuments);
router.get('/personal-memo', getOrCreatePersonalMemo);
router.get('/project/:projectId', getProjectDocuments);
router.get('/project/:projectId/shared', getOrCreateSharedProjectDocument);
router.get('/:id', getDocument);
router.put('/:id', updateDocument);
router.delete('/:id', deleteDocument);

export default router;