/**
 * Request logging middleware
 */

import type { Request, Response, NextFunction } from 'express';

export interface RequestLog {
  method: string;
  path: string;
  ip: string;
  userAgent?: string;
  timestamp: string;
  duration?: number;
  statusCode?: number;
}

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  const log: RequestLog = {
    method: req.method,
    path: req.path,
    ip: req.ip || req.socket.remoteAddress || 'unknown',
    userAgent: req.get('user-agent'),
    timestamp: new Date().toISOString(),
  };

  // Log response when finished
  res.on('finish', () => {
    log.duration = Date.now() - startTime;
    log.statusCode = res.statusCode;

    // Only log errors and slow requests in production
    if (process.env.NODE_ENV === 'production') {
      if (res.statusCode >= 400 || log.duration > 1000) {
        console.log(JSON.stringify(log));
      }
    } else {
      // Log all requests in development
      const statusColor = res.statusCode >= 400 ? '\x1b[31m' : res.statusCode >= 300 ? '\x1b[33m' : '\x1b[32m';
      console.log(
        `${statusColor}${req.method}\x1b[0m ${req.path} ${statusColor}${res.statusCode}\x1b[0m ${log.duration}ms`
      );
    }
  });

  next();
}


