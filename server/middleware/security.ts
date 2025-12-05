/**
 * Security middleware
 */

import type { Request, Response, NextFunction } from 'express';
import { AppError, ErrorCode } from '../../shared/errors.js';

/**
 * Basic input sanitization
 */
export function sanitizeInput(req: Request, res: Response, next: NextFunction): void {
  // Sanitize query parameters
  if (req.query) {
    for (const key in req.query) {
      if (typeof req.query[key] === 'string') {
        req.query[key] = sanitizeString(req.query[key] as string);
      }
    }
  }

  // Sanitize body parameters
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }

  next();
}

function sanitizeString(str: string): string {
  // Remove potential XSS vectors
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}

function sanitizeObject(obj: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      sanitized[key] = sanitizeString(obj[key]);
    } else if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      sanitized[key] = sanitizeObject(obj[key]);
    } else if (Array.isArray(obj[key])) {
      sanitized[key] = obj[key].map((item: any) => 
        typeof item === 'string' ? sanitizeString(item) : item
      );
    } else {
      sanitized[key] = obj[key];
    }
  }
  
  return sanitized;
}

/**
 * Rate limiting (simple in-memory implementation)
 * For production, use a proper rate limiting library like express-rate-limit
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function rateLimiter(
  windowMs: number = 60000,
  maxRequests: number = 100
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    const record = rateLimitStore.get(key);

    if (!record || now > record.resetTime) {
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (record.count >= maxRequests) {
      throw new AppError(
        ErrorCode.RATE_LIMIT_EXCEEDED,
        `Rate limit exceeded. Please try again in ${Math.ceil((record.resetTime - now) / 1000)} seconds.`,
        429
      );
    }

    record.count++;
    next();
  };
}

/**
 * CORS headers
 */
export function corsHeaders(req: Request, res: Response, next: NextFunction): void {
  const origin = req.headers.origin;
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }

  next();
}

/**
 * Security headers
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
  );

  next();
}


