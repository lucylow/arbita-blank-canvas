/**
 * Server-side Error Handling Utilities
 */

import type { Request, Response, NextFunction } from 'express';
import {
  AppError,
  normalizeError,
  ErrorCode,
  APIError,
  ValidationError,
  NotFoundError,
  isAppError,
} from '../../shared/errors.js';

/**
 * Error logging utility
 */
export function logError(error: Error | AppError, context?: Record<string, any>): void {
  const timestamp = new Date().toISOString();
  const errorInfo = {
    timestamp,
    name: error.name,
    message: error.message,
    stack: error.stack,
    ...(isAppError(error) && {
      code: error.code,
      statusCode: error.statusCode,
      context: error.context,
      isOperational: error.isOperational,
    }),
    ...context,
  };

  // In production, you might want to send this to a logging service
  if (process.env.NODE_ENV === 'production') {
    console.error(JSON.stringify(errorInfo));
  } else {
    console.error('Error:', errorInfo);
  }
}

/**
 * Error response formatter
 */
export function formatErrorResponse(error: AppError, includeStack = false) {
  const response: any = {
    success: false,
    error: {
      code: error.code,
      message: error.message,
      ...(error.context && { context: error.context }),
    },
  };

  if (includeStack && process.env.NODE_ENV !== 'production') {
    response.error.stack = error.stack;
  }

  return response;
}

/**
 * Express error handling middleware
 */
export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const normalizedError = normalizeError(error);
  
  // Log the error
  logError(normalizedError, {
    method: req.method,
    path: req.path,
    query: req.query,
    body: req.body,
    ip: req.ip,
  });

  // Send error response
  const statusCode = normalizedError.statusCode || 500;
  const response = formatErrorResponse(
    normalizedError,
    process.env.NODE_ENV !== 'production'
  );

  res.status(statusCode).json(response);
}

/**
 * Async route handler wrapper
 * Catches errors from async route handlers and passes them to error middleware
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Validation middleware helper
 */
export function validateRequest(
  validator: (body: any) => { valid: boolean; errors?: string[] }
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = validator(req.body);
    
    if (!result.valid) {
      const error = new ValidationError(
        result.errors?.join(', ') || 'Invalid request data',
        undefined,
        { validationErrors: result.errors }
      );
      return next(error);
    }
    
    next();
  };
}

/**
 * 404 handler for undefined routes
 */
export function notFoundHandler(req: Request, res: Response, next: NextFunction): void {
  const error = new NotFoundError('Route', req.path);
  next(error);
}

