import { Router } from 'express';
import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/error-handler.js';
import { NotFoundError } from '../../shared/errors.js';
import { generateMockReports } from '../services/mock-data.js';

const router = Router();

// In-memory store for reports (in production, this would be a database)
let reportsCache = generateMockReports(20);

/**
 * GET /api/reports
 * Get all audit reports with optional filtering
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  let reports = [...reportsCache];
  
  // Apply filters
  const { status, minScore, maxScore, target, type } = req.query;
  
  if (status) {
    reports = reports.filter(r => r.status.toLowerCase() === (status as string).toLowerCase());
  }
  
  if (minScore) {
    reports = reports.filter(r => r.score >= parseInt(minScore as string));
  }
  
  if (maxScore) {
    reports = reports.filter(r => r.score <= parseInt(maxScore as string));
  }
  
  if (target) {
    reports = reports.filter(r => 
      r.target.toLowerCase().includes((target as string).toLowerCase())
    );
  }
  
  if (type) {
    reports = reports.filter(r => 
      r.type.toLowerCase().includes((type as string).toLowerCase())
    );
  }
  
  // Sort by date (newest first)
  reports.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  res.json(reports);
}));

/**
 * GET /api/reports/:reportId
 * Get a specific report by ID
 */
router.get('/:reportId', asyncHandler(async (req: Request, res: Response) => {
  const { reportId } = req.params;
  const report = reportsCache.find(r => r.id === reportId);
  
  if (!report) {
    throw new NotFoundError('Report', reportId);
  }
  
  // Expand with additional details
  const detailedReport = {
    ...report,
    summary: `Security audit report for ${report.target} completed on ${report.date}. Score: ${report.score}% with ${report.vulnerabilities} vulnerabilities found.`,
    findings: Array.from({ length: report.vulnerabilities }, (_, i) => ({
      id: `FND-${reportId}-${i + 1}`,
      type: ['SQL Injection', 'XSS', 'CSRF', 'Auth Bypass', 'Data Leak'][i % 5],
      severity: report.vulnerabilities > 5 ? 'high' : 'medium',
      description: `Security vulnerability detected in audit ${reportId}`,
      location: `src/file${i + 1}.ts:${Math.floor(Math.random() * 200) + 1}`,
    })),
    recommendations: [
      'Implement input validation',
      'Use parameterized queries',
      'Add authentication checks',
      'Review access controls',
    ].slice(0, Math.min(3, report.vulnerabilities)),
    metadata: {
      duration: report.duration,
      testsRun: report.testsRun,
      agent: 'PEN-TESTER ALPHA',
      sessionId: `session_${report.id}`,
    },
  };
  
  res.json(detailedReport);
}));

/**
 * POST /api/reports
 * Create a new audit report (for testing/simulation)
 */
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const { generateMockReport } = await import('../services/mock-data.js');
  const newReport = generateMockReport({
    ...req.body,
    id: undefined, // Will be generated
  });
  
  reportsCache.unshift(newReport);
  reportsCache = reportsCache.slice(0, 100); // Keep last 100
  
  res.status(201).json(newReport);
}));

/**
 * GET /api/reports/stats/summary
 * Get summary statistics for reports
 */
router.get('/stats/summary', asyncHandler(async (req: Request, res: Response) => {
  const stats = {
    total: reportsCache.length,
    passed: reportsCache.filter(r => r.status === 'PASSED').length,
    failed: reportsCache.filter(r => r.status === 'FAILED').length,
    warning: reportsCache.filter(r => r.status === 'WARNING').length,
    averageScore: reportsCache.reduce((sum, r) => sum + r.score, 0) / reportsCache.length,
    totalVulnerabilities: reportsCache.reduce((sum, r) => sum + r.vulnerabilities, 0),
    byType: {} as Record<string, number>,
    byTarget: {} as Record<string, number>,
  };
  
  reportsCache.forEach(report => {
    stats.byType[report.type] = (stats.byType[report.type] || 0) + 1;
    stats.byTarget[report.target] = (stats.byTarget[report.target] || 0) + 1;
  });
  
  res.json(stats);
}));

export default router;


