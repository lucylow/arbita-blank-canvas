/**
 * Human-in-the-Loop (HITL) Manager
 * Manages human review tasks, escalation policies, and feedback collection
 */

import type { HumanTask, HumanFeedback, EscalationPolicy, SecurityFinding } from '@/../../shared/hitl-types';

export class HITLManager {
  private tasks: Map<string, HumanTask> = new Map();
  private feedbackHistory: Map<string, HumanFeedback[]> = new Map();
  private activeEscalations: Map<string, NodeJS.Timeout> = new Map();
  
  private escalationPolicies: EscalationPolicy[] = [
    {
      name: 'critical_security',
      conditions: {
        confidenceThreshold: 0.7,
        severity: ['critical', 'high'],
        riskCategories: ['data_breach', 'auth_bypass', 'rce'],
        complexity: 'high',
      },
      humanRoles: ['senior_security_analyst', 'security_lead'],
      timeoutMs: 300000, // 5 minutes
      fallbackAction: 'defer',
    },
    {
      name: 'compliance_review',
      conditions: {
        confidenceThreshold: 0.8,
        severity: ['high', 'medium'],
        riskCategories: ['gdpr', 'hipaa', 'pci'],
        complexity: 'medium',
      },
      humanRoles: ['compliance_officer'],
      timeoutMs: 600000, // 10 minutes
      fallbackAction: 'auto_reject',
    },
  ];

  /**
   * Evaluate if human review is needed
   */
  async evaluateForHumanReview(
    finding: SecurityFinding,
    context: any
  ): Promise<HumanTask | null> {
    const shouldEscalate = this.shouldEscalateToHuman(finding);
    
    if (!shouldEscalate) {
      return null;
    }

    const policy = this.selectEscalationPolicy(finding);
    const task = this.createHumanTask(finding, policy, context);
    
    this.tasks.set(task.id, task);
    this.startEscalationTimer(task, policy);
    
    return task;
  }

  /**
   * Determine if escalation to human is needed
   */
  private shouldEscalateToHuman(finding: SecurityFinding): boolean {
    const criteria = [
      finding.confidenceScore < 0.8,
      ['critical', 'high'].includes(finding.severity),
      finding.estimatedCost && finding.estimatedCost > 10,
      finding.complexity === 'high',
      finding.complianceViolations && finding.complianceViolations.length > 0,
    ];

    return criteria.some(c => c === true);
  }

  /**
   * Create human review task
   */
  private createHumanTask(
    finding: SecurityFinding,
    policy: EscalationPolicy,
    context: any
  ): HumanTask {
    const taskId = `hitl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      id: taskId,
      type: this.determineTaskType(finding),
      priority: this.determinePriority(finding),
      title: `Review: ${finding.type} - ${finding.severity.toUpperCase()} Severity`,
      description: this.generateTaskDescription(finding),
      metadata: {
        agentId: context.agentId || 'unknown',
        sessionId: context.sessionId || 'unknown',
        timestamp: new Date(),
        confidenceScore: finding.confidenceScore,
        context: finding.context,
      },
      payload: finding,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      deadline: new Date(Date.now() + policy.timeoutMs),
    };
  }

  /**
   * Submit human feedback
   */
  async submitFeedback(
    taskId: string,
    feedback: Partial<HumanFeedback>
  ): Promise<HumanFeedback> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    const completeFeedback: HumanFeedback = {
      id: `feedback_${Date.now()}`,
      taskId,
      reviewerId: feedback.reviewerId || 'anonymous',
      action: feedback.action || 'approved',
      comments: feedback.comments,
      corrections: feedback.corrections,
      confidence: feedback.confidence,
      timestamp: new Date(),
      responseTime: Date.now() - task.createdAt.getTime(),
    };

    task.status = 'completed';
    task.updatedAt = new Date();

    if (!this.feedbackHistory.has(taskId)) {
      this.feedbackHistory.set(taskId, []);
    }
    this.feedbackHistory.get(taskId)!.push(completeFeedback);

    this.clearEscalationTimer(taskId);

    return completeFeedback;
  }

  /**
   * Get pending tasks
   */
  getPendingTasks(limit = 50): HumanTask[] {
    const pending: HumanTask[] = [];
    
    for (const task of this.tasks.values()) {
      if (task.status === 'pending') {
        pending.push(task);
        if (pending.length >= limit) break;
      }
    }

    return pending.sort((a, b) => {
      const priorityOrder = { critical: 3, high: 2, medium: 1, low: 0 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Assign task to reviewer
   */
  assignTask(taskId: string, reviewerId: string): void {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    task.status = 'assigned';
    task.assignedTo = reviewerId;
    task.updatedAt = new Date();
  }

  private startEscalationTimer(task: HumanTask, policy: EscalationPolicy): void {
    const timer = setTimeout(() => {
      this.handleEscalationTimeout(task, policy);
    }, policy.timeoutMs);
    
    this.activeEscalations.set(task.id, timer);
  }

  private async handleEscalationTimeout(
    task: HumanTask,
    policy: EscalationPolicy
  ): Promise<void> {
    if (task.status !== 'pending' && task.status !== 'assigned') {
      return;
    }

    switch (policy.fallbackAction) {
      case 'auto_approve':
        await this.submitFeedback(task.id, {
          reviewerId: 'system',
          action: 'approved',
          comments: 'Auto-approved due to timeout',
        });
        break;
      case 'auto_reject':
        await this.submitFeedback(task.id, {
          reviewerId: 'system',
          action: 'rejected',
          comments: 'Auto-rejected due to timeout',
        });
        break;
      case 'defer':
        task.status = 'cancelled';
        task.updatedAt = new Date();
        break;
    }

    this.clearEscalationTimer(task.id);
  }

  private clearEscalationTimer(taskId: string): void {
    const timer = this.activeEscalations.get(taskId);
    if (timer) {
      clearTimeout(timer);
      this.activeEscalations.delete(taskId);
    }
  }

  private determineTaskType(finding: SecurityFinding): HumanTask['type'] {
    if (finding.confidenceScore < 0.5) return 'review';
    if (finding.severity === 'critical') return 'approval';
    if (finding.complianceViolations && finding.complianceViolations.length > 0) return 'correction';
    return 'escalation';
  }

  private determinePriority(finding: SecurityFinding): HumanTask['priority'] {
    if (finding.severity === 'critical') return 'critical';
    if (finding.confidenceScore < 0.6) return 'high';
    if (finding.estimatedCost && finding.estimatedCost > 50) return 'high';
    return 'medium';
  }

  private selectEscalationPolicy(finding: SecurityFinding): EscalationPolicy {
    for (const policy of this.escalationPolicies) {
      const matches =
        finding.confidenceScore < policy.conditions.confidenceThreshold &&
        policy.conditions.severity.includes(finding.severity) &&
        policy.conditions.riskCategories.some(c =>
          finding.riskCategories?.includes(c)
        );
      
      if (matches) {
        return policy;
      }
    }

    return {
      name: 'default',
      conditions: {
        confidenceThreshold: 0.8,
        severity: ['critical', 'high', 'medium'],
        riskCategories: [],
        complexity: 'medium',
      },
      humanRoles: ['security_analyst'],
      timeoutMs: 900000,
      fallbackAction: 'auto_approve',
    };
  }

  private generateTaskDescription(finding: SecurityFinding): string {
    return `
Security finding requires human review:

**Type:** ${finding.type}
**Severity:** ${finding.severity}
**Confidence:** ${(finding.confidenceScore * 100).toFixed(1)}%
**Risk:** ${finding.riskLevel}
**Location:** ${finding.location?.file || 'Unknown'}:${finding.location?.line || 'N/A'}

**Description:**
${finding.description}

**Evidence:**
${finding.evidence?.slice(0, 3).map(e => `- ${e}`).join('\n')}

**Action Required:**
Please review and confirm if this finding is valid and requires action.
    `.trim();
  }
}

export const hitlManager = new HITLManager();
