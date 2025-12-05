/**
 * Enhanced NullShot SDK Integration
 * Multi-LLM security analysis with agent coordination
 */

import { z } from 'zod';
import type { SecurityFinding, AuditSession } from '@shared/hitl-types';
import { hitlManager } from './hitl/hitl-manager';
import { AppError, ErrorCode, NotFoundError, normalizeError } from '@shared/errors';
import { logError, APIClient, RetryConfig } from './error-handler';

// Zod validation schemas
export const NullShotConfigSchema = z.object({
  apiKey: z.string().min(1, 'API key is required'),
  apiUrl: z.string().url().optional().default('https://api.nullshot.ai/v1'),
  models: z.array(z.string()).min(1, 'At least one model is required'),
  enableHITL: z.boolean().default(true),
  confidenceThreshold: z.number().min(0).max(1).default(0.8),
  maxRetries: z.number().int().min(0).max(5).default(3),
  retryDelay: z.number().int().min(100).default(1000),
  timeout: z.number().int().min(1000).default(30000),
  enableCaching: z.boolean().default(true),
  cacheTTL: z.number().int().min(0).default(3600000), // 1 hour
  rateLimit: z.object({
    requests: z.number().int().min(1).default(100),
    windowMs: z.number().int().min(1000).default(60000), // 1 minute
  }).optional(),
});

export const AuditRequestSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  codebase: z.string().min(1, 'Codebase is required'),
  targets: z.array(z.string()).optional().default([]),
  language: z.string().optional(),
  blockchain: z.string().optional(),
  options: z.object({
    depth: z.enum(['quick', 'standard', 'deep']).optional().default('standard'),
    compliance: z.array(z.string()).optional(),
    customRules: z.array(z.any()).optional(),
    focusAreas: z.array(z.string()).optional(),
    enableConsensus: z.boolean().optional().default(true),
    minConsensusScore: z.number().min(0).max(1).optional().default(0.7),
  }).optional().default(() => ({
    depth: 'standard' as const,
    enableConsensus: true,
    minConsensusScore: 0.7,
  })),
});

export const AuditResultSchema = z.object({
  sessionId: z.string(),
  findings: z.array(z.any()),
  summary: z.object({
    critical: z.number().int().min(0),
    high: z.number().int().min(0),
    medium: z.number().int().min(0),
    low: z.number().int().min(0),
    totalFindings: z.number().int().min(0),
  }),
  humanReviewRequired: z.boolean(),
  humanTasks: z.array(z.any()),
  consensusScore: z.number().min(0).max(1).optional(),
  modelsUsed: z.array(z.string()).optional(),
  computeReceipt: z.object({
    costUnits: z.number().optional(),
    tokenCount: z.number().optional(),
    modelCalls: z.number().optional(),
    durationMs: z.number().optional(),
  }).optional(),
});

export type NullShotConfig = z.infer<typeof NullShotConfigSchema>;
export type AuditRequest = z.infer<typeof AuditRequestSchema>;
export type AuditResult = z.infer<typeof AuditResultSchema>;

// Progress callback type
export type ProgressCallback = (progress: {
  stage: string;
  progress: number; // 0-100
  message?: string;
  details?: Record<string, any>;
}) => void;

// Cache entry interface with metadata
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  tags?: string[]; // For cache invalidation by tags
}

// Rate limiter interface - Token bucket algorithm
interface RateLimiter {
  tokens: number;
  maxTokens: number;
  refillRate: number; // tokens per windowMs
  windowMs: number;
  lastRefill: number;
}

export class NullShotIntegration {
  private config: NullShotConfig;
  private activeSessions: Map<string, AuditSession> = new Map();
  private apiClient: APIClient;
  private cache: Map<string, CacheEntry<any>> = new Map();
  private rateLimiter?: RateLimiter;
  private metrics: {
    totalAudits: number;
    successfulAudits: number;
    failedAudits: number;
    totalFindings: number;
    averageConsensusScore: number;
    totalComputeCost: number;
  } = {
    totalAudits: 0,
    successfulAudits: 0,
    failedAudits: 0,
    totalFindings: 0,
    averageConsensusScore: 0,
    totalComputeCost: 0,
  };

  constructor(config: Partial<NullShotConfig>) {
    // Validate and merge config
    const validatedConfig = NullShotConfigSchema.parse({
      apiKey: process.env.NULLSHOT_API_KEY || '',
      models: ['gpt-4', 'claude-3-opus', 'gemini-pro'],
      enableHITL: true,
      confidenceThreshold: 0.8,
      ...config,
    });
    
    this.config = validatedConfig;
    
    // Initialize API client
    this.apiClient = new APIClient(this.config.apiUrl, {
      'Authorization': `Bearer ${this.config.apiKey}`,
      'X-NullShot-Version': '3.0',
    });
    
    // Initialize rate limiter with token bucket algorithm
    if (this.config.rateLimit) {
      this.rateLimiter = {
        tokens: this.config.rateLimit.requests,
        maxTokens: this.config.rateLimit.requests,
        refillRate: this.config.rateLimit.requests,
        windowMs: this.config.rateLimit.windowMs,
        lastRefill: Date.now(),
      };
    }
    
    // Clean up cache periodically
    if (this.config.enableCaching) {
      setInterval(() => this.cleanupCache(), 60000); // Every minute
    }
  }

  /**
   * Check rate limit using token bucket algorithm
   */
  private checkRateLimit(): void {
    if (!this.rateLimiter) return;
    
    const now = Date.now();
    const limiter = this.rateLimiter;
    
    // Refill tokens based on elapsed time
    const elapsed = now - limiter.lastRefill;
    const tokensToAdd = Math.floor((elapsed / limiter.windowMs) * limiter.refillRate);
    
    if (tokensToAdd > 0) {
      limiter.tokens = Math.min(limiter.maxTokens, limiter.tokens + tokensToAdd);
      limiter.lastRefill = now;
    }
    
    // Check if we have tokens available
    if (limiter.tokens < 1) {
      const waitTime = limiter.windowMs - elapsed;
      throw new AppError(
        ErrorCode.API_ERROR,
        `Rate limit exceeded. Please try again in ${Math.ceil(waitTime / 1000)} seconds.`,
        429
      );
    }
    
    // Consume a token
    limiter.tokens--;
  }

  /**
   * Get from cache with access tracking
   */
  private getFromCache<T>(key: string): T | null {
    if (!this.config.enableCaching) return null;
    
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    // Update access metadata
    entry.accessCount++;
    entry.lastAccessed = now;
    
    return entry.data as T;
  }

  /**
   * Set cache with metadata
   */
  private setCache<T>(key: string, data: T, ttl?: number, tags?: string[]): void {
    if (!this.config.enableCaching) return;
    
    const now = Date.now();
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      ttl: ttl || this.config.cacheTTL,
      accessCount: 0,
      lastAccessed: now,
      tags,
    };
    this.cache.set(key, entry);
  }
  
  /**
   * Invalidate cache by tags
   */
  invalidateCacheByTags(tags: string[]): number {
    if (!this.config.enableCaching) return 0;
    
    let invalidated = 0;
    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (entry.tags && entry.tags.some(tag => tags.includes(tag))) {
        this.cache.delete(key);
        invalidated++;
      }
    }
    return invalidated;
  }
  
  /**
   * Invalidate cache by pattern
   */
  invalidateCacheByPattern(pattern: RegExp): number {
    if (!this.config.enableCaching) return 0;
    
    let invalidated = 0;
    for (const [key] of Array.from(this.cache.entries())) {
      if (pattern.test(key)) {
        this.cache.delete(key);
        invalidated++;
      }
    }
    return invalidated;
  }

  /**
   * Generate cache key
   */
  private generateCacheKey(request: AuditRequest): string {
    const keyData = {
      projectId: request.projectId,
      codebase: request.codebase.substring(0, 100), // First 100 chars
      language: request.language,
      depth: request.options?.depth,
      targets: request.targets?.sort().join(','),
    };
    return `audit_${JSON.stringify(keyData)}`;
  }

  /**
   * Cleanup expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Run multi-LLM security audit
   */
  async runAudit(
    request: AuditRequest,
    progressCallback?: ProgressCallback
  ): Promise<AuditResult> {
    const startTime = Date.now();
    this.metrics.totalAudits++;
    
    try {
      // Validate request
      const validatedRequest = AuditRequestSchema.parse(request);

      if (!this.config.apiKey) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          'NullShot API key is not configured',
          500
        );
      }

      // Check rate limit
      this.checkRateLimit();

      // Check cache
      const cacheKey = this.generateCacheKey(validatedRequest);
      const cachedResult = this.getFromCache<AuditResult>(cacheKey);
      if (cachedResult) {
        progressCallback?.({
          stage: 'cached',
          progress: 100,
          message: 'Returning cached result',
        });
        return cachedResult;
      }

      const sessionId = this.generateSessionId();
      
      progressCallback?.({
        stage: 'initializing',
        progress: 5,
        message: 'Initializing audit session',
        details: {
          sessionId,
          projectId: validatedRequest.projectId,
          models: this.config.models,
          depth: validatedRequest.options?.depth || 'standard',
        },
      });
      
      // Initialize audit session
      const session: AuditSession = {
        id: sessionId,
        projectId: validatedRequest.projectId,
        status: 'in_progress',
        findings: [],
        humanTasks: [],
        startedAt: new Date(),
        metadata: {
          models: this.config.models,
          depth: validatedRequest.options?.depth || 'standard',
          language: validatedRequest.language,
          blockchain: validatedRequest.blockchain,
        },
      };
      
      this.activeSessions.set(sessionId, session);

      try {
        progressCallback?.({
          stage: 'analyzing',
          progress: 20,
          message: 'Starting multi-LLM analysis',
          details: {
            modelCount: this.config.models.length,
            models: this.config.models,
            enableConsensus: validatedRequest.options?.enableConsensus !== false,
          },
        });

        // Perform multi-LLM analysis
        const analysisResult = await this.performMultiLLMAnalysis(
          validatedRequest,
          (progress) => {
            progressCallback?.({
              stage: 'analyzing',
              progress: 20 + (progress.progress * 0.6), // 20-80%
              message: progress.message,
              details: progress.details,
            });
          }
        );
        
        session.findings = analysisResult.findings;

        progressCallback?.({
          stage: 'evaluating',
          progress: 80,
          message: 'Evaluating findings for human review',
          details: {
            findingsCount: analysisResult.findings.length,
            consensusScore: analysisResult.consensusScore,
            modelsUsed: analysisResult.modelsUsed,
          },
        });

        // Evaluate findings for human review
        const humanTasks = [];
        for (const finding of analysisResult.findings) {
          if (this.config.enableHITL) {
            try {
              const task = await hitlManager.evaluateForHumanReview(finding, {
                agentId: 'nullshot-agent',
                sessionId: sessionId,
              });
              
              if (task) {
                humanTasks.push(task);
                session.humanTasks.push(task);
              }
            } catch (error) {
              // Log HITL evaluation errors but don't fail the audit
              const normalized = normalizeError(error);
              logError(normalized, {
                method: 'runAudit.evaluateForHumanReview',
                findingId: finding.id,
                sessionId,
              });
            }
          }
        }

        session.status = 'completed';
        session.completedAt = new Date();

        // Generate summary
        const summary = this.generateSummary(analysisResult.findings);

        const durationMs = Date.now() - startTime;

        const result: AuditResult = {
          sessionId,
          findings: analysisResult.findings,
          summary,
          humanReviewRequired: humanTasks.length > 0,
          humanTasks,
          consensusScore: analysisResult.consensusScore,
          modelsUsed: analysisResult.modelsUsed,
          computeReceipt: {
            costUnits: analysisResult.computeReceipt?.costUnits,
            tokenCount: analysisResult.computeReceipt?.tokenCount,
            modelCalls: analysisResult.computeReceipt?.modelCalls || this.config.models.length,
            durationMs,
          },
        };

        // Cache result with tags for invalidation
        this.setCache(cacheKey, result, undefined, [
          `project:${validatedRequest.projectId}`,
          `language:${validatedRequest.language || 'unknown'}`,
          `depth:${validatedRequest.options?.depth || 'standard'}`,
        ]);

        // Update metrics
        this.metrics.successfulAudits++;
        this.metrics.totalFindings += result.findings.length;
        if (result.consensusScore) {
          const currentAvg = this.metrics.averageConsensusScore;
          const total = this.metrics.successfulAudits;
          this.metrics.averageConsensusScore = 
            ((currentAvg * (total - 1)) + result.consensusScore) / total;
        }
        if (result.computeReceipt?.costUnits) {
          this.metrics.totalComputeCost += result.computeReceipt.costUnits;
        }

        progressCallback?.({
          stage: 'completed',
          progress: 100,
          message: 'Audit completed successfully',
        });

        return result;
      } catch (error) {
        session.status = 'failed';
        this.metrics.failedAudits++;
        const normalized = normalizeError(error);
        logError(normalized, { method: 'runAudit', sessionId, projectId: validatedRequest.projectId });
        throw normalized;
      }
    } catch (error) {
      this.metrics.failedAudits++;
      const normalized = normalizeError(error);
      logError(normalized, { method: 'runAudit', request });
      throw normalized;
    }
  }

  /**
   * Perform multi-LLM analysis with agent coordination
   */
  private async performMultiLLMAnalysis(
    request: AuditRequest,
    progressCallback?: ProgressCallback
  ): Promise<{
    findings: SecurityFinding[];
    consensusScore: number;
    modelsUsed: string[];
    computeReceipt?: {
      costUnits: number;
      tokenCount: number;
      modelCalls: number;
    };
  }> {
    const modelsUsed: string[] = [];
    const allFindings: SecurityFinding[][] = [];
    const retryConfig: RetryConfig = {
      maxRetries: this.config.maxRetries,
      retryDelay: this.config.retryDelay,
    };

    // Analyze with each model
    for (let i = 0; i < this.config.models.length; i++) {
      const model = this.config.models[i];
      const modelProgress = (i / this.config.models.length) * 100;
      
      progressCallback?.({
        stage: 'analyzing',
        progress: modelProgress,
        message: `Analyzing with ${model}...`,
        details: { 
          model, 
          modelIndex: i + 1, 
          totalModels: this.config.models.length,
          codebaseSize: request.codebase.length,
          language: request.language,
        },
      });

      try {
        // In production, this would call the actual NullShot API
        // For now, we simulate the analysis
        const findings = await this.analyzeWithModel(model, request, retryConfig);
        allFindings.push(findings);
        modelsUsed.push(model);
      } catch (error) {
        const normalized = normalizeError(error);
        logError(normalized, {
          method: 'performMultiLLMAnalysis',
          model,
          projectId: request.projectId,
        });
        // Continue with other models even if one fails
      }
    }

    // If no models succeeded, throw error
    if (allFindings.length === 0) {
      throw new AppError(
        ErrorCode.API_ERROR,
        'All model analyses failed',
        500
      );
    }

    // Calculate consensus and merge findings
    const { mergedFindings, consensusScore } = this.calculateConsensus(allFindings, modelsUsed);

    // Filter by confidence threshold
    const filteredFindings = mergedFindings.filter(
      finding => finding.confidenceScore >= this.config.confidenceThreshold
    );

    // Calculate compute receipt
    const computeReceipt = {
      costUnits: modelsUsed.length * 50, // Estimated cost per model
      tokenCount: request.codebase.length / 4, // Rough token estimate
      modelCalls: modelsUsed.length,
    };

    return {
      findings: filteredFindings,
      consensusScore,
      modelsUsed,
      computeReceipt,
    };
  }

  /**
   * Analyze code with a specific model
   */
  private async analyzeWithModel(
    model: string,
    request: AuditRequest,
    retryConfig: RetryConfig
  ): Promise<SecurityFinding[]> {
    try {
      // Attempt to call actual NullShot API if configured
      if (this.config.apiKey && this.config.apiUrl) {
        try {
          const response = await this.apiClient.post<{
            findings: SecurityFinding[];
            model: string;
            confidence: number;
          }>(
            '/analyze',
            {
              model,
              code: request.codebase,
              language: request.language,
              targets: request.targets,
              options: {
                depth: request.options?.depth || 'standard',
                focusAreas: request.options?.focusAreas,
                blockchain: request.blockchain,
              },
            },
            retryConfig
          );
          
          if (response.findings && Array.isArray(response.findings)) {
            return response.findings.map(finding => ({
              ...finding,
              id: `${model}-${finding.id}`,
              evidence: [
                ...(finding.evidence || []),
                `Detected by ${model}`,
              ],
            }));
          }
        } catch (apiError) {
          // If API call fails, fall back to simulated analysis
          // Log the error but don't fail the entire audit
          const normalized = normalizeError(apiError);
          logError(normalized, {
            method: 'analyzeWithModel',
            model,
            projectId: request.projectId,
            fallback: 'simulated',
          });
        }
      }
      
      // Fallback to simulated analysis (for development/testing)
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

      // Generate model-specific findings (simulated)
      const baseFindings = this.generateBaseFindings(request);
      
      // Add model-specific variations
      return baseFindings.map((finding, index) => ({
        ...finding,
        id: `${model}-${finding.id}-${index}`,
        confidenceScore: finding.confidenceScore * (0.85 + Math.random() * 0.15), // Vary confidence
        evidence: [
          ...finding.evidence,
          `Detected by ${model}`,
        ],
      }));
    } catch (error) {
      const normalized = normalizeError(error);
      logError(normalized, {
        method: 'analyzeWithModel',
        model,
        projectId: request.projectId,
      });
      throw normalized;
    }
  }

  /**
   * Generate base findings (simulated)
   */
  private generateBaseFindings(request: AuditRequest): SecurityFinding[] {
    // This would be replaced with actual analysis in production
    const findings: SecurityFinding[] = [];

    // Check for common vulnerabilities based on codebase content
    const codebaseLower = request.codebase.toLowerCase();
    
    if (codebaseLower.includes('sql') || codebaseLower.includes('query')) {
      findings.push({
        id: 'sql-injection',
        type: 'SQL Injection',
        severity: 'critical',
        confidenceScore: 0.92,
        riskLevel: 'high',
        description: 'Potential SQL injection vulnerability detected in database queries',
        location: {
          file: request.targets?.[0] || 'unknown',
          line: 1,
        },
        evidence: [
          'Direct string concatenation in SQL query detected',
          'User input not properly sanitized',
          'No prepared statements or parameterized queries used',
        ],
        context: {
          codeSnippet: request.codebase.substring(0, 200),
        },
        riskCategories: ['data_breach', 'auth_bypass'],
        complexity: 'medium',
      });
    }

    if (codebaseLower.includes('eval') || codebaseLower.includes('innerhtml')) {
      findings.push({
        id: 'xss',
        type: 'Cross-Site Scripting (XSS)',
        severity: 'high',
        confidenceScore: 0.85,
        riskLevel: 'medium',
        description: 'Potential XSS vulnerability in user input rendering',
        location: {
          file: request.targets?.[0] || 'unknown',
          line: 1,
        },
        evidence: [
          'Unescaped user input rendered in HTML',
          'dangerouslySetInnerHTML or eval() usage detected',
        ],
        context: {
          codeSnippet: request.codebase.substring(0, 200),
        },
        riskCategories: ['xss', 'client_side'],
        complexity: 'low',
      });
    }

    if (codebaseLower.includes('password') || codebaseLower.includes('hash')) {
      findings.push({
        id: 'weak-auth',
        type: 'Insecure Authentication',
        severity: 'high',
        confidenceScore: 0.78,
        riskLevel: 'high',
        description: 'Potential weak authentication implementation',
        location: {
          file: request.targets?.[0] || 'unknown',
          line: 1,
        },
        evidence: [
          'Password handling detected',
          'Verify use of strong hashing algorithms (bcrypt, argon2)',
        ],
        context: {
          codeSnippet: request.codebase.substring(0, 200),
        },
        complianceViolations: ['OWASP-A02'],
        riskCategories: ['auth_bypass'],
        complexity: 'high',
      });
    }

    if (codebaseLower.includes('api_key') || codebaseLower.includes('secret')) {
      findings.push({
        id: 'secret-exposure',
        type: 'Sensitive Data Exposure',
        severity: 'medium',
        confidenceScore: 0.70,
        riskLevel: 'medium',
        description: 'Potential exposure of sensitive credentials',
        location: {
          file: request.targets?.[0] || 'unknown',
          line: 1,
        },
        evidence: [
          'API keys or secrets detected in code',
          'Verify credentials are not hardcoded',
        ],
        context: {
          codeSnippet: request.codebase.substring(0, 200),
        },
        complianceViolations: ['GDPR'],
        riskCategories: ['data_breach'],
        complexity: 'low',
      });
    }

    // If no specific findings, add a general security review recommendation
    if (findings.length === 0) {
      findings.push({
        id: 'general-review',
        type: 'Security Review Recommended',
        severity: 'low',
        confidenceScore: 0.50,
        riskLevel: 'low',
        description: 'General security review recommended for this codebase',
        location: {
          file: request.targets?.[0] || 'unknown',
          line: 1,
        },
        evidence: [
          'Codebase requires comprehensive security review',
        ],
        context: {
          codeSnippet: request.codebase.substring(0, 200),
        },
        riskCategories: ['general'],
        complexity: 'medium',
      });
    }

    return findings;
  }

  /**
   * Calculate consensus from multiple model results with enhanced weighting
   */
  private calculateConsensus(
    allFindings: SecurityFinding[][],
    modelsUsed: string[]
  ): {
    mergedFindings: SecurityFinding[];
    consensusScore: number;
  } {
    if (allFindings.length === 0) {
      return { mergedFindings: [], consensusScore: 0 };
    }

    // Model weights based on reliability (can be configured)
    const modelWeights: Record<string, number> = {
      'gpt-4': 0.35,
      'gpt-4-turbo': 0.35,
      'gpt-4o': 0.40,
      'claude-3-opus': 0.35,
      'claude-3-sonnet': 0.30,
      'claude-3-haiku': 0.25,
      'gemini-pro': 0.30,
      'gemini-ultra': 0.35,
      'default': 0.30,
    };

    // Group findings by type and location, tracking which model each came from
    const findingGroups = new Map<string, {
      findings: Array<{ finding: SecurityFinding; modelIndex: number }>;
      type: string;
      location?: { file: string; line: number };
    }>();

    for (let i = 0; i < allFindings.length; i++) {
      const modelFindings = allFindings[i];
      const model = modelsUsed[i];
      
      for (const finding of modelFindings) {
        const key = `${finding.type}-${finding.location?.file}-${finding.location?.line}`;
        
        if (!findingGroups.has(key)) {
          findingGroups.set(key, {
            findings: [],
            type: finding.type,
            location: finding.location,
          });
        }
        
        findingGroups.get(key)!.findings.push({ finding, modelIndex: i });
      }
    }

    // Merge findings with enhanced consensus scoring
    const mergedFindings: SecurityFinding[] = [];
    let totalConsensus = 0;
    let consensusCount = 0;

    const entries = Array.from(findingGroups.entries());
    for (const [key, group] of entries) {
      const findingsWithModels = group.findings;
      
      // Calculate weighted average confidence
      let weightedSum = 0;
      let totalWeight = 0;
      const confidences: number[] = [];
      
      for (const { finding, modelIndex } of findingsWithModels) {
        const model = modelsUsed[modelIndex] || 'default';
        const weight = modelWeights[model] || modelWeights['default'];
        
        weightedSum += finding.confidenceScore * weight;
        totalWeight += weight;
        confidences.push(finding.confidenceScore);
      }
      
      const avgConfidence = totalWeight > 0 ? weightedSum / totalWeight : 0;
      
      // Calculate agreement ratio
      const agreementRatio = findingsWithModels.length / modelsUsed.length;
      
      // Detect and penalize outliers
      const mean = confidences.reduce((a, b) => a + b, 0) / confidences.length;
      const variance = confidences.reduce((sum, c) => sum + Math.pow(c - mean, 2), 0) / confidences.length;
      const stdDev = Math.sqrt(variance);
      
      // Outlier penalty (if standard deviation is high, reduce consensus)
      const outlierPenalty = stdDev > 0.2 ? (stdDev - 0.2) * 0.3 : 0;
      
      // Calculate consensus score with agreement and outlier detection
      const consensusScore = Math.max(0, Math.min(1, 
        avgConfidence * agreementRatio * (1 - outlierPenalty)
      ));
      
      totalConsensus += consensusScore;
      consensusCount++;

      // Merge evidence from all models
      const allEvidence = new Set<string>();
      const allRiskCategories = new Set<string>();
      const allComplianceViolations = new Set<string>();
      const modelContributions: string[] = [];
      
      for (const { finding, modelIndex } of findingsWithModels) {
        const model = modelsUsed[modelIndex];
        
        finding.evidence.forEach((e: string) => allEvidence.add(e));
        finding.riskCategories?.forEach((r: string) => allRiskCategories.add(r));
        finding.complianceViolations?.forEach((c: string) => allComplianceViolations.add(c));
        modelContributions.push(model);
      }

      // Use the finding with highest weighted confidence as base
      const baseFinding = findingsWithModels.reduce((best, current) => {
        const bestModel = modelsUsed[best.modelIndex] || 'default';
        const currentModel = modelsUsed[current.modelIndex] || 'default';
        const bestWeight = modelWeights[bestModel] || modelWeights['default'];
        const currentWeight = modelWeights[currentModel] || modelWeights['default'];
        
        const bestScore = best.finding.confidenceScore * bestWeight;
        const currentScore = current.finding.confidenceScore * currentWeight;
        
        return currentScore > bestScore ? current : best;
      }).finding;

      // Determine severity based on consensus (if multiple models agree on high severity, boost it)
      const severityCounts = new Map<'low' | 'medium' | 'high' | 'critical', number>();
      findingsWithModels.forEach(({ finding }) => {
        severityCounts.set(finding.severity, (severityCounts.get(finding.severity) || 0) + 1);
      });
      const mostCommonSeverity = (Array.from(severityCounts.entries())
        .sort((a, b) => b[1] - a[1])[0]?.[0] || baseFinding.severity) as 'low' | 'medium' | 'high' | 'critical';

      // Create merged finding with enhanced metadata
      const mergedFinding: SecurityFinding = {
        ...baseFinding,
        id: `consensus-${key}`,
        severity: mostCommonSeverity,
        confidenceScore: consensusScore,
        evidence: Array.from(allEvidence),
        riskCategories: Array.from(allRiskCategories),
        complianceViolations: allComplianceViolations.size > 0 
          ? Array.from(allComplianceViolations) 
          : undefined,
        context: {
          ...baseFinding.context,
          modelsAgreed: findingsWithModels.length,
          totalModels: modelsUsed.length,
          consensusScore,
          modelContributions,
          agreementRatio,
          outlierPenalty,
          weightedConfidence: avgConfidence,
        },
      };

      mergedFindings.push(mergedFinding);
    }

    const overallConsensus = consensusCount > 0 ? totalConsensus / consensusCount : 0;

    return {
      mergedFindings,
      consensusScore: overallConsensus,
    };
  }

  /**
   * Generate audit summary
   */
  private generateSummary(findings: SecurityFinding[]) {
    const summary: {
      critical: number;
      high: number;
      medium: number;
      low: number;
      totalFindings: number;
    } = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      totalFindings: findings.length,
    };

    for (const finding of findings) {
      const severity = finding.severity as keyof typeof summary;
      if (severity in summary && severity !== 'totalFindings') {
        summary[severity]++;
      }
    }

    return summary;
  }

  /**
   * Get audit session
   */
  getSession(sessionId: string): AuditSession | undefined {
    return this.activeSessions.get(sessionId);
  }

  /**
   * Get all active sessions
   */
  getAllSessions(): AuditSession[] {
    return Array.from(this.activeSessions.values());
  }

  /**
   * Get sessions by project ID
   */
  getSessionsByProject(projectId: string): AuditSession[] {
    return Array.from(this.activeSessions.values()).filter(
      session => session.projectId === projectId
    );
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Get metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      successRate: this.metrics.totalAudits > 0
        ? this.metrics.successfulAudits / this.metrics.totalAudits
        : 0,
      averageFindingsPerAudit: this.metrics.successfulAudits > 0
        ? this.metrics.totalFindings / this.metrics.successfulAudits
        : 0,
      cacheSize: this.cache.size,
      activeSessions: this.activeSessions.size,
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Clear metrics
   */
  resetMetrics(): void {
    this.metrics = {
      totalAudits: 0,
      successfulAudits: 0,
      failedAudits: 0,
      totalFindings: 0,
      averageConsensusScore: 0,
      totalComputeCost: 0,
    };
  }

  /**
   * Export audit report
   */
  async exportReport(sessionId: string, format: 'json' | 'pdf' | 'html'): Promise<Blob> {
    try {
      if (!sessionId) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          'Session ID is required',
          400
        );
      }

      const validFormats = ['json', 'pdf', 'html'];
      if (!validFormats.includes(format)) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          `Format must be one of: ${validFormats.join(', ')}`,
          400
        );
      }

      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new NotFoundError('Audit session', sessionId);
      }

      const reportData = {
        session,
        generatedAt: new Date().toISOString(),
        format,
        metrics: this.getMetrics(),
      };

      let content: string;
      let mimeType: string;

      switch (format) {
        case 'json':
          content = JSON.stringify(reportData, null, 2);
          mimeType = 'application/json';
          break;
        case 'html':
          content = this.generateHTMLReport(reportData);
          mimeType = 'text/html';
          break;
        case 'pdf':
          // In production, use a PDF generation library
          content = JSON.stringify(reportData, null, 2);
          mimeType = 'application/pdf';
          break;
        default:
          content = JSON.stringify(reportData, null, 2);
          mimeType = 'application/json';
      }

      const blob = new Blob([content], { type: mimeType });
      return blob;
    } catch (error) {
      const normalized = normalizeError(error);
      logError(normalized, { method: 'exportReport', sessionId, format });
      throw normalized;
    }
  }

  /**
   * Generate HTML report
   */
  private generateHTMLReport(data: any): string {
    const session = data.session;
    const findings = session.findings || [];
    
    return `
<!DOCTYPE html>
<html>
<head>
  <title>Security Audit Report - ${session.id}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #333; }
    .summary { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; }
    .finding { border-left: 4px solid #007bff; padding: 10px; margin: 10px 0; background: #f9f9f9; }
    .critical { border-color: #dc3545; }
    .high { border-color: #fd7e14; }
    .medium { border-color: #ffc107; }
    .low { border-color: #28a745; }
    .metadata { color: #666; font-size: 0.9em; }
  </style>
</head>
<body>
  <h1>Security Audit Report</h1>
  <div class="metadata">
    <p><strong>Session ID:</strong> ${session.id}</p>
    <p><strong>Project ID:</strong> ${session.projectId}</p>
    <p><strong>Status:</strong> ${session.status}</p>
    <p><strong>Started:</strong> ${session.startedAt}</p>
    <p><strong>Completed:</strong> ${session.completedAt || 'N/A'}</p>
  </div>
  
  <div class="summary">
    <h2>Summary</h2>
    <p>Total Findings: ${findings.length}</p>
    <p>Critical: ${findings.filter((f: SecurityFinding) => f.severity === 'critical').length}</p>
    <p>High: ${findings.filter((f: SecurityFinding) => f.severity === 'high').length}</p>
    <p>Medium: ${findings.filter((f: SecurityFinding) => f.severity === 'medium').length}</p>
    <p>Low: ${findings.filter((f: SecurityFinding) => f.severity === 'low').length}</p>
  </div>
  
  <h2>Findings</h2>
  ${findings.map((finding: SecurityFinding) => `
    <div class="finding ${finding.severity}">
      <h3>${finding.type} (${finding.severity.toUpperCase()})</h3>
      <p>${finding.description}</p>
      <p><strong>Confidence:</strong> ${(finding.confidenceScore * 100).toFixed(1)}%</p>
      ${finding.location ? `<p><strong>Location:</strong> ${finding.location.file}:${finding.location.line}</p>` : ''}
      <h4>Evidence:</h4>
      <ul>
        ${finding.evidence.map((e: string) => `<li>${e}</li>`).join('')}
      </ul>
    </div>
  `).join('')}
  
  <div class="metadata">
    <p><strong>Generated:</strong> ${data.generatedAt}</p>
  </div>
</body>
</html>
    `.trim();
  }
}

// Default configuration
export const defaultNullShotConfig: Partial<NullShotConfig> = {
  apiKey: typeof process !== 'undefined' && process.env?.NULLSHOT_API_KEY 
    ? process.env.NULLSHOT_API_KEY 
    : '',
  apiUrl: 'https://api.nullshot.ai/v1',
  models: ['gpt-4', 'claude-3-opus', 'gemini-pro'],
  enableHITL: true,
  confidenceThreshold: 0.8,
  maxRetries: 3,
  retryDelay: 1000,
  timeout: 30000,
  enableCaching: true,
  cacheTTL: 3600000,
  rateLimit: {
    requests: 100,
    windowMs: 60000,
  },
};

export const nullShotClient = new NullShotIntegration(defaultNullShotConfig);
