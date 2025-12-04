import { Router } from 'express';
import type { Request, Response } from 'express';

const router = Router();

// Mock data for demonstration
const mockTasks = [
  {
    id: 'hitl_001',
    type: 'review',
    priority: 'critical',
    title: 'Review: SQL Injection - CRITICAL Severity',
    description: `Security finding requires human review:

**Type:** SQL Injection
**Severity:** critical
**Confidence:** 72.0%
**Risk:** high
**Location:** src/api/users.ts:42

**Description:**
Potential SQL injection vulnerability detected in user input handling

**Evidence:**
- Direct string concatenation in SQL query
- User input not sanitized
- No prepared statements used

**Action Required:**
Please review and confirm if this finding is valid and requires action.`,
    metadata: {
      agentId: 'nullshot-agent',
      sessionId: 'audit_001',
      timestamp: new Date(),
      confidenceScore: 0.72,
      context: {},
    },
    payload: {
      type: 'SQL Injection',
      severity: 'critical',
      confidenceScore: 0.72,
      evidence: ['Direct string concatenation', 'No sanitization', 'No prepared statements'],
      context: {
        codeSnippet: 'const query = `SELECT * FROM users WHERE id = ${userId}`;',
      },
    },
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'hitl_002',
    type: 'approval',
    priority: 'high',
    title: 'Review: Weak Authentication - HIGH Severity',
    description: `Security finding requires human review:

**Type:** Insecure Authentication
**Severity:** high
**Confidence:** 65.0%
**Risk:** high
**Location:** src/auth/password.ts:23

**Description:**
Weak password hashing algorithm detected

**Evidence:**
- MD5 hash algorithm used
- No salt applied
- Industry standard recommends bcrypt or argon2

**Action Required:**
Please review and confirm if this finding is valid and requires action.`,
    metadata: {
      agentId: 'nullshot-agent',
      sessionId: 'audit_001',
      timestamp: new Date(),
      confidenceScore: 0.65,
      context: {},
    },
    payload: {
      type: 'Insecure Authentication',
      severity: 'high',
      confidenceScore: 0.65,
      evidence: ['MD5 used', 'No salt', 'Weak algorithm'],
      context: {
        codeSnippet: 'const hash = md5(password);',
      },
    },
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

/**
 * GET /api/hitl/tasks/pending
 * Get all pending human review tasks
 */
router.get('/tasks/pending', (req: Request, res: Response) => {
  try {
    const pendingTasks = mockTasks.filter(task => task.status === 'pending');
    res.json(pendingTasks);
  } catch (error) {
    console.error('Error fetching pending tasks:', error);
    res.status(500).json({ error: 'Failed to fetch pending tasks' });
  }
});

/**
 * GET /api/hitl/tasks/:taskId
 * Get a specific task by ID
 */
router.get('/tasks/:taskId', (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const task = mockTasks.find(t => t.id === taskId);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

/**
 * POST /api/hitl/tasks/:taskId/feedback
 * Submit feedback for a task
 */
router.post('/tasks/:taskId/feedback', (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { action, comments, reviewerId } = req.body;
    
    const task = mockTasks.find(t => t.id === taskId);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
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
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

/**
 * POST /api/hitl/tasks/:taskId/assign
 * Assign a task to a reviewer
 */
router.post('/tasks/:taskId/assign', (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { reviewerId } = req.body;
    
    const task = mockTasks.find(t => t.id === taskId);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    task.status = 'assigned';
    task.updatedAt = new Date();
    
    res.json({
      success: true,
      task,
    });
  } catch (error) {
    console.error('Error assigning task:', error);
    res.status(500).json({ error: 'Failed to assign task' });
  }
});

/**
 * GET /api/hitl/stats
 * Get HITL statistics
 */
router.get('/stats', (req: Request, res: Response) => {
  try {
    const stats = {
      totalTasks: mockTasks.length,
      pending: mockTasks.filter(t => t.status === 'pending').length,
      assigned: mockTasks.filter(t => t.status === 'assigned').length,
      completed: mockTasks.filter(t => t.status === 'completed').length,
      averageResponseTime: 300000, // 5 minutes in ms
      criticalPending: mockTasks.filter(t => t.priority === 'critical' && t.status === 'pending').length,
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
