import { Request, Response } from 'express';
import { z } from 'zod';
import documentService from '../services/documentService';
import logger from '../utils/logger';

const createDocumentSchema = z.object({
  projectId: z.number().optional(),
  title: z.string().max(200, 'Title too long').optional(),
  content: z.string().min(1, 'Content is required'),
  contentMarkdown: z.string().min(1, 'Content markdown is required'),
});

const updateDocumentSchema = z.object({
  projectId: z.number().optional(),
  title: z.string().max(200, 'Title too long').optional(),
  content: z.string().optional(),
  contentMarkdown: z.string().optional(),
});

const searchDocumentsSchema = z.object({
  projectId: z.coerce.number().optional(),
  keyword: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export const createDocument = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const validationResult = createDocumentSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.issues,
      });
    }

    const document = await documentService.createDocument(userId, validationResult.data);
    res.status(201).json(document);
  } catch (error) {
    logger.error('Create document failed:', error);
    if (error instanceof Error) {
      if (error.message === 'Project not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message === 'Not authorized to add documents to this project') {
        return res.status(403).json({ error: error.message });
      }
    }
    res.status(500).json({ error: 'Failed to create document' });
  }
};

export const updateDocument = async (req: Request, res: Response) => {
  try {
    const documentId = parseInt(req.params.id);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (isNaN(documentId)) {
      return res.status(400).json({ error: 'Invalid document ID' });
    }

    const validationResult = updateDocumentSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.issues,
      });
    }

    const document = await documentService.updateDocument(documentId, userId, validationResult.data);
    res.json(document);
  } catch (error) {
    logger.error('Update document failed:', error);
    if (error instanceof Error) {
      if (error.message === 'Document not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message === 'Not authorized to update this document') {
        return res.status(403).json({ error: error.message });
      }
      if (error.message === 'Project not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message === 'Not authorized to move document to this project') {
        return res.status(403).json({ error: error.message });
      }
    }
    res.status(500).json({ error: 'Failed to update document' });
  }
};

export const deleteDocument = async (req: Request, res: Response) => {
  try {
    const documentId = parseInt(req.params.id);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (isNaN(documentId)) {
      return res.status(400).json({ error: 'Invalid document ID' });
    }

    await documentService.deleteDocument(documentId, userId);
    res.json({ success: true });
  } catch (error) {
    logger.error('Delete document failed:', error);
    if (error instanceof Error) {
      if (error.message === 'Document not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message === 'Not authorized to delete this document') {
        return res.status(403).json({ error: error.message });
      }
    }
    res.status(500).json({ error: 'Failed to delete document' });
  }
};

export const getDocument = async (req: Request, res: Response) => {
  try {
    const documentId = parseInt(req.params.id);
    const userId = req.user?.id;

    if (isNaN(documentId)) {
      return res.status(400).json({ error: 'Invalid document ID' });
    }

    const document = await documentService.getDocument(documentId, userId);
    res.json(document);
  } catch (error) {
    logger.error('Get document failed:', error);
    if (error instanceof Error) {
      if (error.message === 'Document not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message === 'Not authorized to access this document') {
        return res.status(403).json({ error: error.message });
      }
    }
    res.status(500).json({ error: 'Failed to get document' });
  }
};

export const searchDocuments = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const validationResult = searchDocumentsSchema.safeParse(req.query);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.issues,
      });
    }

    const result = await documentService.searchDocuments(userId, validationResult.data);
    res.json(result);
  } catch (error) {
    logger.error('Search documents failed:', error);
    res.status(500).json({ error: 'Failed to search documents' });
  }
};

export const getProjectDocuments = async (req: Request, res: Response) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (isNaN(projectId)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    const documents = await documentService.getProjectDocuments(projectId, userId);
    res.json({ data: documents });
  } catch (error) {
    logger.error('Get project documents failed:', error);
    if (error instanceof Error) {
      if (error.message === 'Project not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message === 'Not authorized to access this project') {
        return res.status(403).json({ error: error.message });
      }
    }
    res.status(500).json({ error: 'Failed to get project documents' });
  }
};

export const getOrCreateSharedProjectDocument = async (req: Request, res: Response) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (isNaN(projectId)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    const document = await documentService.getOrCreateSharedProjectDocument(projectId, userId);
    res.json({ data: document });
  } catch (error) {
    logger.error('Get or create shared project document failed:', error);
    if (error instanceof Error) {
      if (error.message === 'Project not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message === 'Not authorized to access this project') {
        return res.status(403).json({ error: error.message });
      }
    }
    res.status(500).json({ error: 'Failed to get or create shared project document' });
  }
};

export const getOrCreatePersonalMemo = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const document = await documentService.getOrCreatePersonalMemo(userId);
    res.json({ data: document });
  } catch (error) {
    logger.error('Get or create personal memo failed:', error);
    res.status(500).json({ error: 'Failed to get or create personal memo' });
  }
};