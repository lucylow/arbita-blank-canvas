// Human-in-the-Loop (HITL) Type Definitions

export interface HumanTask {
  id: string;
  type: 'review' | 'approval' | 'correction' | 'escalation';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  metadata: {
    agentId: string;
    sessionId: string;
    timestamp: Date;
    confidenceScore: number;
    context: Record<string, any>;
  };
  payload: any;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
  deadline?: Date;
}

export interface HumanFeedback {
  id: string;
  taskId: string;
  reviewerId: string;
  action: 'approved' | 'rejected' | 'modified' | 'deferred';
  comments?: string;
  corrections?: any;
  confidence?: number;
  timestamp: Date;
  responseTime: number;
}

export interface EscalationPolicy {
  name: string;
  conditions: {
    confidenceThreshold: number;
    severity: string[];
    riskCategories: string[];
    complexity: 'low' | 'medium' | 'high';
  };
  humanRoles: string[];
  timeoutMs: number;
  fallbackAction: 'auto_approve' | 'auto_reject' | 'defer';
}

export interface SecurityFinding {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidenceScore: number;
  riskLevel: string;
  description: string;
  location?: {
    file: string;
    line: number;
    column?: number;
  };
  evidence: string[];
  context: Record<string, any>;
  complianceViolations?: string[];
  estimatedCost?: number;
  complexity?: 'low' | 'medium' | 'high';
  riskCategories?: string[];
}

export interface AuditSession {
  id: string;
  projectId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  findings: SecurityFinding[];
  humanTasks: HumanTask[];
  startedAt: Date;
  completedAt?: Date;
  metadata: Record<string, any>;
}
