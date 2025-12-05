import { Router } from 'express';
import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/error-handler.js';
import {
  generateDashboardStats,
  generateActivityData,
  generateAgentStatus,
  generateVulnerabilityBreakdown,
} from '../services/mock-data.js';

const router = Router();

/**
 * GET /api/dashboard/stats
 * Get dashboard statistics
 */
router.get('/stats', asyncHandler(async (req: Request, res: Response) => {
  const stats = generateDashboardStats();
  res.json(stats);
}));

/**
 * GET /api/dashboard/activity
 * Get activity data for charts
 */
router.get('/activity', asyncHandler(async (req: Request, res: Response) => {
  const hours = parseInt(req.query.hours as string) || 24;
  const activity = generateActivityData(hours);
  res.json(activity);
}));

/**
 * GET /api/dashboard/agents
 * Get agent network status
 */
router.get('/agents', asyncHandler(async (req: Request, res: Response) => {
  const agents = generateAgentStatus();
  res.json(agents);
}));

/**
 * GET /api/dashboard/vulnerabilities
 * Get vulnerability breakdown data
 */
router.get('/vulnerabilities', asyncHandler(async (req: Request, res: Response) => {
  const breakdown = generateVulnerabilityBreakdown();
  res.json(breakdown);
}));

export default router;


