import { Router } from 'express';
import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/error-handler.js';
import { NotFoundError, ValidationError } from '../../shared/errors.js';
import { generateMockTasks, generateMockTask } from '../services/mock-data.js';

const router = Router();

// In-memory store for tasks (in production, this would be a database)
// Initialize with some mock tasks
let mockTasks = generateMockTasks(5);

/**
 * GET /api/hitl/tasks/pending
 * Get all pending human review tasks
 */
router.get('/tasks/pending', asyncHandler(async (req: Request, res: Response) => {
  const pendingTasks = mockTasks.filter(task => task.status === 'pending');
  res.json(pendingTasks);
}));

/**
 * GET /api/hitl/tasks/:taskId
 * Get a specific task by ID
 */
router.get('/tasks/:taskId', asyncHandler(async (req: Request, res: Response) => {
  const { taskId } = req.params;
  const task = mockTasks.find(t => t.id === taskId);
  
  if (!task) {
    throw new NotFoundError('Task', taskId);
  }
  
  res.json(task);
}));

/**
 * POST /api/hitl/tasks/:taskId/feedback
 * Submit feedback for a task
 */
router.post('/tasks/:taskId/feedback', asyncHandler(async (req: Request, res: Response) => {
  const { taskId } = req.params;
  const { action, comments, reviewerId } = req.body;
  
  // Validate required fields
  if (!action) {
    throw new ValidationError('Action is required', 'action');
  }
  
  const validActions = ['approved', 'rejected', 'modified', 'deferred'];
  if (!validActions.includes(action)) {
    throw new ValidationError(
      `Action must be one of: ${validActions.join(', ')}`,
      'action'
    );
  }
  
  const task = mockTasks.find(t => t.id === taskId);
  
  if (!task) {
    throw new NotFoundError('Task', taskId);
  }
  
  // Update task status
  task.status = 'completed';
  task.updatedAt = new Date();
  
  const feedback = {
    id: `feedback_${Date.now()}`,
    taskId,
    reviewerId: reviewerId || 'anonymous',
    action,
    comments,
    timestamp: new Date(),
    responseTime: Date.now() - task.createdAt.getTime(),
  };
  
  res.json({
    success: true,
    feedback,
    task,
  });
}));

/**
 * POST /api/hitl/tasks/:taskId/assign
 * Assign a task to a reviewer
 */
router.post('/tasks/:taskId/assign', asyncHandler(async (req: Request, res: Response) => {
  const { taskId } = req.params;
  const { reviewerId } = req.body;
  
  if (!reviewerId) {
    throw new ValidationError('Reviewer ID is required', 'reviewerId');
  }
  
  const task = mockTasks.find(t => t.id === taskId);
  
  if (!task) {
    throw new NotFoundError('Task', taskId);
  }
  
  task.status = 'assigned';
  task.assignedTo = reviewerId;
  task.updatedAt = new Date();
  
  res.json({
    success: true,
    task,
  });
}));

/**
 * GET /api/hitl/stats
 * Get HITL statistics
 */
router.get('/stats', asyncHandler(async (req: Request, res: Response) => {
  const completedTasks = mockTasks.filter(t => t.status === 'completed');
  const averageResponseTime = completedTasks.length > 0
    ? completedTasks.reduce((sum, t) => {
        const responseTime = t.updatedAt.getTime() - t.createdAt.getTime();
        return sum + responseTime;
      }, 0) / completedTasks.length
    : 300000; // Default 5 minutes
  
  const stats = {
    totalTasks: mockTasks.length,
    pending: mockTasks.filter(t => t.status === 'pending').length,
    assigned: mockTasks.filter(t => t.status === 'assigned').length,
    completed: mockTasks.filter(t => t.status === 'completed').length,
    averageResponseTime: Math.floor(averageResponseTime),
    criticalPending: mockTasks.filter(t => t.priority === 'critical' && t.status === 'pending').length,
  };
  
  res.json(stats);
}));

/**
 * POST /api/hitl/tasks/generate
 * Generate new mock tasks (for testing/demo)
 */
router.post('/tasks/generate', asyncHandler(async (req: Request, res: Response) => {
  const count = parseInt(req.body.count as string) || 1;
  const newTasks = generateMockTasks(count);
  mockTasks.push(...newTasks);
  
  res.json({
    success: true,
    generated: newTasks.length,
    total: mockTasks.length,
    tasks: newTasks,
  });
}));

export default router;
