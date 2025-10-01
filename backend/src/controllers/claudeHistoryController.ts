import { Request, Response } from 'express';
import { z } from 'zod';
import claudeHistoryService from '../services/claudeHistoryService';
import logger from '../utils/logger';
import { handleControllerError } from '../utils/errorHandler';
import multer from 'multer';

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.originalname.endsWith('.jsonl')) {
      cb(null, true);
    } else {
      cb(new Error('Only .jsonl files are allowed'));
    }
  },
});

// Multer upload middleware
export const uploadMiddleware = upload.single('file');

// Validation schemas
const importRequestSchema = z.object({
  projectId: z.string().transform(val => parseInt(val)),
});

const historyRequestSchema = z.object({
  projectId: z.string().optional().transform(val => val ? parseInt(val) : undefined),
});

/**
 * Import JSONL file
 */
export const importJsonl = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.user as { id: number }).id;

    // Validate request
    const validation = importRequestSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        error: 'Invalid request data',
        details: validation.error.issues,
      });
      return;
    }

    const { projectId } = validation.data;

    // Check if file was uploaded
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    // Read file content
    const jsonlContent = req.file.buffer.toString('utf-8');

    // Import
    const result = await claudeHistoryService.importJsonl(
      userId,
      jsonlContent,
      req.file.originalname,
      req.file.size,
      projectId
    );

    logger.info(`JSONL import completed for user ${userId}:`, result);

    res.json({
      success: true,
      result,
    });
  } catch (error: unknown) {
    handleControllerError(error, res, 'Import JSONL failed');
  }
};

/**
 * Get import statistics
 */
export const getImportStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.user as { id: number }).id;

    const stats = await claudeHistoryService.getImportStats(userId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error: unknown) {
    handleControllerError(error, res, 'Get import stats failed');
  }
};

/**
 * Get import history
 */
export const getImportHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.user as { id: number }).id;

    const validation = historyRequestSchema.safeParse(req.query);
    if (!validation.success) {
      res.status(400).json({
        error: 'Invalid request data',
        details: validation.error.issues,
      });
      return;
    }

    const { projectId } = validation.data;
    const history = await claudeHistoryService.getImportHistory(userId, projectId);

    res.json({
      success: true,
      data: history,
    });
  } catch (error: unknown) {
    handleControllerError(error, res, 'Get import history failed');
  }
};
