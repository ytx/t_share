import { Response } from 'express';
import logger from './logger';

/**
 * Type guard to check if error is an Error instance
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Extract error message from unknown error type
 */
export function getErrorMessage(error: unknown): string {
  if (isError(error)) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  return 'Unknown error occurred';
}

/**
 * Extract error stack from unknown error type
 */
export function getErrorStack(error: unknown): string | undefined {
  if (isError(error)) {
    return error.stack;
  }
  return undefined;
}

/**
 * Log error with appropriate level and details
 */
export function logError(error: unknown, context: string): void {
  const message = getErrorMessage(error);
  const stack = getErrorStack(error);

  logger.error(`${context}: ${message}`, {
    error: message,
    stack,
    context
  });
}

/**
 * Handle controller errors with consistent response format
 */
export function handleControllerError(
  error: unknown,
  res: Response,
  context: string,
  defaultMessage: string = 'An error occurred'
): Response {
  logError(error, context);

  // Check for specific error types that might have status codes
  if (isError(error)) {
    // Handle not found errors
    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Not Found',
        message: error.message,
      });
    }

    // Handle authorization errors
    if (error.message.includes('Not authorized') || error.message.includes('Unauthorized')) {
      return res.status(403).json({
        error: 'Forbidden',
        message: error.message,
      });
    }

    // Handle Prisma conflicts
    if (error.message.includes('already exists') || error.message.includes('already taken')) {
      return res.status(409).json({
        error: 'Conflict',
        message: error.message,
      });
    }

    // Handle validation errors
    if (error.message.includes('validation') || error.message.includes('invalid')) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.message,
      });
    }
  }

  // Default error response
  return res.status(500).json({
    error: 'Internal Server Error',
    message: defaultMessage,
  });
}

/**
 * Create a typed error object for service layer
 */
export function createServiceError(message: string, cause?: unknown): Error {
  const error = new Error(message);
  if (cause) {
    error.cause = cause;
  }
  return error;
}