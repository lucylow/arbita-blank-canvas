import { Router } from 'express';
import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/error-handler.js';
import { generateLogEntry } from '../services/mock-data.js';

const router = Router();

// In-memory log buffer (in production, this would be a log aggregation service)
let logBuffer: ReturnType<typeof generateLogEntry>[] = [];

// Initialize with some logs
for (let i = 0; i < 100; i++) {
  const log = generateLogEntry();
  log.timestamp = new Date(Date.now() - (100 - i) * 15000).toISOString();
  logBuffer.push(log);
}

/**
 * GET /api/logs
 * Get system logs with optional filtering
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  let logs = [...logBuffer];
  
  // Apply filters
  const { type, component, search, limit, since } = req.query;
  
  if (type) {
    logs = logs.filter(l => l.type.toLowerCase() === (type as string).toLowerCase());
  }
  
  if (component) {
    logs = logs.filter(l => 
      l.component.toLowerCase().includes((component as string).toLowerCase())
    );
  }
  
  if (search) {
    const searchLower = (search as string).toLowerCase();
    logs = logs.filter(l => 
      l.message.toLowerCase().includes(searchLower) ||
      l.component.toLowerCase().includes(searchLower)
    );
  }
  
  if (since) {
    const sinceDate = new Date(since as string);
    logs = logs.filter(l => new Date(l.timestamp) >= sinceDate);
  }
  
  // Sort by timestamp (newest first)
  logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  
  // Apply limit
  const limitNum = limit ? parseInt(limit as string) : 500;
  logs = logs.slice(0, limitNum);
  
  res.json({
    logs,
    total: logBuffer.length,
    filtered: logs.length,
  });
}));

/**
 * POST /api/logs/generate
 * Generate new mock log entries (for testing/demo)
 */
router.post('/generate', asyncHandler(async (req: Request, res: Response) => {
  const count = parseInt(req.body.count as string) || 1;
  const newLogs = Array.from({ length: count }, () => generateLogEntry());
  
  logBuffer.push(...newLogs);
  
  // Keep buffer size manageable
  if (logBuffer.length > 1000) {
    logBuffer = logBuffer.slice(-1000);
  }
  
  res.json({
    success: true,
    generated: newLogs.length,
    total: logBuffer.length,
    logs: newLogs,
  });
}));

/**
 * GET /api/logs/stats
 * Get log statistics
 */
router.get('/stats', asyncHandler(async (req: Request, res: Response) => {
  const stats = {
    total: logBuffer.length,
    byType: {} as Record<string, number>,
    byComponent: {} as Record<string, number>,
    recent: logBuffer.filter(l => {
      const logTime = new Date(l.timestamp).getTime();
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      return logTime >= oneHourAgo;
    }).length,
  };
  
  logBuffer.forEach(log => {
    stats.byType[log.type] = (stats.byType[log.type] || 0) + 1;
    stats.byComponent[log.component] = (stats.byComponent[log.component] || 0) + 1;
  });
  
  res.json(stats);
}));

export default router;


