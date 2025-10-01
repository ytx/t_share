import prisma from '../config/database';
import logger from '../utils/logger';
import fs from 'fs/promises';
import path from 'path';

interface JsonlMessage {
  type: 'user' | 'assistant' | 'system';
  message?: {
    role: 'user' | 'assistant';
    content: string | Array<{ type: string; text?: string }>;
  };
  timestamp: string;
  uuid: string;
  parentUuid?: string | null;
}

interface ConversationPair {
  userMessage: string;
  assistantMessage: string;
  timestamp: Date;
  uuid: string;
}

interface ImportResult {
  imported: number;
  updated: number;
  skipped: number;
  errors: string[];
}

class ClaudeHistoryService {
  private readonly UPLOAD_BASE_DIR = process.env.UPLOAD_DIR || '/app/uploads/claude_code';

  /**
   * Save uploaded JSONL file to server storage
   * Path format: projectId/userId/timestamp_filename.jsonl
   */
  private async saveUploadedFile(
    projectId: number,
    userId: number,
    fileName: string,
    content: string
  ): Promise<string> {
    try {
      // Create directory structure: claude_code/projectId/userId
      const uploadDir = path.join(this.UPLOAD_BASE_DIR, String(projectId), String(userId));
      await fs.mkdir(uploadDir, { recursive: true });

      // Generate unique filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const uniqueFileName = `${timestamp}_${safeFileName}`;
      const filePath = path.join(uploadDir, uniqueFileName);

      // Save file
      await fs.writeFile(filePath, content, 'utf-8');

      // Return relative path for database storage (including claude_code prefix)
      const relativePath = path.join('claude_code', String(projectId), String(userId), uniqueFileName);
      logger.info(`Saved uploaded file: ${relativePath}`);

      return relativePath;
    } catch (error) {
      logger.error('Failed to save uploaded file:', error);
      throw new Error(`File save failed: ${error}`);
    }
  }

  /**
   * Normalize content by removing extra whitespace and newlines
   */
  private normalizeContent(content: string): string {
    return content
      .replace(/\s+/g, ' ')  // Replace multiple whitespace with single space
      .replace(/\n+/g, ' ')  // Replace newlines with space
      .trim();
  }

  /**
   * Extract text content from message
   */
  private extractTextContent(content: string | Array<{ type: string; text?: string }>): string {
    if (typeof content === 'string') {
      return content;
    }

    if (Array.isArray(content)) {
      return content
        .filter(item => item.type === 'text' && item.text)
        .map(item => item.text)
        .join('\n\n');
    }

    return '';
  }

  /**
   * Parse JSONL file content and extract conversation pairs
   */
  private parseJsonl(jsonlContent: string): ConversationPair[] {
    const lines = jsonlContent.split('\n').filter(line => line.trim());
    const messages: JsonlMessage[] = [];

    // Parse all lines
    for (const line of lines) {
      try {
        const msg = JSON.parse(line) as JsonlMessage;
        if (msg.type === 'user' || msg.type === 'assistant') {
          messages.push(msg);
        }
      } catch (error) {
        logger.error('Failed to parse JSONL line:', error);
      }
    }

    // Extract user-assistant pairs
    const pairs: ConversationPair[] = [];

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];

      if (msg.type === 'user' && msg.message?.role === 'user') {
        const userContent = this.extractTextContent(msg.message.content);

        // Find corresponding assistant response
        let assistantContent = '';
        for (let j = i + 1; j < messages.length; j++) {
          const nextMsg = messages[j];
          if (nextMsg.type === 'assistant' && nextMsg.message?.role === 'assistant') {
            assistantContent = this.extractTextContent(nextMsg.message.content);
            break;
          }
          // Stop if we hit another user message
          if (nextMsg.type === 'user') {
            break;
          }
        }

        if (userContent && assistantContent) {
          pairs.push({
            userMessage: userContent,
            assistantMessage: assistantContent,
            timestamp: new Date(msg.timestamp),
            uuid: msg.uuid,
          });
        }
      }
    }

    return pairs;
  }

  /**
   * Find existing document by normalized content and timestamp proximity
   */
  private async findExistingDocument(
    userId: number,
    normalizedContent: string,
    timestamp: Date
  ) {
    // Search within ±5 minutes
    const timeBefore = new Date(timestamp.getTime() - 5 * 60 * 1000);
    const timeAfter = new Date(timestamp.getTime() + 5 * 60 * 1000);

    const documents = await prisma.document.findMany({
      where: {
        createdBy: userId,
        createdAt: {
          gte: timeBefore,
          lte: timeAfter,
        },
      },
    });

    // Find by normalized content match
    for (const doc of documents) {
      if (this.normalizeContent(doc.content) === normalizedContent) {
        return doc;
      }
    }

    return null;
  }

  /**
   * Import JSONL file content
   */
  async importJsonl(
    userId: number,
    jsonlContent: string,
    fileName: string,
    fileSize: number,
    projectId: number
  ): Promise<ImportResult> {
    const result: ImportResult = {
      imported: 0,
      updated: 0,
      skipped: 0,
      errors: [],
    };

    try {
      // Save uploaded file to server storage
      const filePath = await this.saveUploadedFile(projectId, userId, fileName, jsonlContent);

      const pairs = this.parseJsonl(jsonlContent);
      logger.info(`Parsed ${pairs.length} conversation pairs from JSONL`);

      for (const pair of pairs) {
        try {
          const normalizedContent = this.normalizeContent(pair.userMessage);
          const existing = await this.findExistingDocument(
            userId,
            normalizedContent,
            pair.timestamp
          );

          if (existing) {
            // Check if response already exists
            if (existing.response) {
              result.skipped++;
              logger.debug(`Skipping existing document with response: ${existing.id}`);
            } else {
              // Update with response
              await prisma.document.update({
                where: { id: existing.id },
                data: { response: pair.assistantMessage },
              });
              result.updated++;
              logger.info(`Updated document ${existing.id} with response`);
            }
          } else {
            // Create new document
            await prisma.document.create({
              data: {
                projectId,
                title: `[CLAUDE_CONVERSATION]_${pair.uuid}`,
                content: pair.userMessage,
                contentMarkdown: '', // Empty markdown for imported conversations
                response: pair.assistantMessage,
                createdBy: userId,
                createdAt: pair.timestamp,
              },
            });
            result.imported++;
            logger.info(`Imported new conversation: ${pair.uuid}`);
          }
        } catch (error) {
          const errorMsg = `Failed to process conversation: ${error}`;
          result.errors.push(errorMsg);
          logger.error(errorMsg, error);
        }
      }

      // Save import history
      await prisma.claudeImportHistory.create({
        data: {
          userId,
          fileName,
          fileSize,
          filePath,
          projectId,
          imported: result.imported,
          updated: result.updated,
          skipped: result.skipped,
          errors: result.errors.length,
        },
      });

      logger.info(`Import completed: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      logger.error('Import failed:', error);
      throw error;
    }
  }

  /**
   * Get import statistics for user
   */
  async getImportStats(userId: number) {
    const totalImported = await prisma.document.count({
      where: {
        createdBy: userId,
        title: {
          startsWith: '[CLAUDE_CONVERSATION]_',
        },
      },
    });

    const withResponse = await prisma.document.count({
      where: {
        createdBy: userId,
        title: {
          startsWith: '[CLAUDE_CONVERSATION]_',
        },
        response: {
          not: null,
        },
      },
    });

    return {
      totalConversations: totalImported,
      withResponses: withResponse,
      withoutResponses: totalImported - withResponse,
    };
  }

  /**
   * Get import history for a specific project
   */
  async getImportHistory(userId: number, projectId?: number) {
    const where: any = { userId };

    if (projectId) {
      where.projectId = projectId;
    }

    const history = await prisma.claudeImportHistory.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return history;
  }
}

export default new ClaudeHistoryService();
