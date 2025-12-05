/**
 * Server-side NullShot Integration
 * Wraps the client integration for use in server/MCP context
 */

import type { AuditRequest, AuditResult, NullShotConfig } from '../../client/src/lib/nullshot-integration';
import { NullShotIntegration } from '../../client/src/lib/nullshot-integration';
import { logError } from '../utils/error-handler.js';

// Server-side configuration
const serverConfig: Partial<NullShotConfig> = {
  apiKey: process.env.NULLSHOT_API_KEY || '',
  apiUrl: process.env.NULLSHOT_API_URL || 'https://api.nullshot.ai/v1',
  models: (process.env.NULLSHOT_MODELS?.split(',') || ['gpt-4', 'claude-3-opus', 'gemini-pro']).filter(Boolean),
  enableHITL: process.env.NULLSHOT_ENABLE_HITL !== 'false',
  confidenceThreshold: parseFloat(process.env.NULLSHOT_CONFIDENCE_THRESHOLD || '0.8'),
  maxRetries: parseInt(process.env.NULLSHOT_MAX_RETRIES || '3', 10),
  retryDelay: parseInt(process.env.NULLSHOT_RETRY_DELAY || '1000', 10),
  timeout: parseInt(process.env.NULLSHOT_TIMEOUT || '30000', 10),
  enableCaching: process.env.NULLSHOT_ENABLE_CACHE !== 'false',
  cacheTTL: parseInt(process.env.NULLSHOT_CACHE_TTL || '3600000', 10),
  rateLimit: {
    requests: parseInt(process.env.NULLSHOT_RATE_LIMIT_REQUESTS || '100', 10),
    windowMs: parseInt(process.env.NULLSHOT_RATE_LIMIT_WINDOW_MS || '60000', 10),
  },
};

// Create server-side instance
export const serverNullShotClient = new NullShotIntegration(serverConfig);

/**
 * Analyze code security via MCP tool invocation
 */
export async function analyzeCodeSecurity(
  code: string,
  language?: string,
  options?: {
    depth?: 'quick' | 'standard' | 'deep';
    focusAreas?: string[];
    blockchain?: string;
  }
): Promise<AuditResult> {
  try {
    if (!code || typeof code !== 'string' || code.trim().length === 0) {
      throw new Error('Code parameter is required and must be a non-empty string');
    }

    // Validate code length (prevent extremely large inputs)
    const MAX_CODE_LENGTH = 10 * 1024 * 1024; // 10MB
    if (code.length > MAX_CODE_LENGTH) {
      throw new Error(`Code exceeds maximum length of ${MAX_CODE_LENGTH} characters`);
    }

    // Validate language if provided
    if (language && typeof language !== 'string') {
      throw new Error('Language must be a string');
    }

    // Validate depth option
    if (options?.depth && !['quick', 'standard', 'deep'].includes(options.depth)) {
      throw new Error('Depth must be one of: quick, standard, deep');
    }

    const request: AuditRequest = {
      projectId: `mcp-${Date.now()}`,
      codebase: code,
      language,
      blockchain: options?.blockchain,
      targets: [],
      options: {
        depth: options?.depth || 'standard',
        focusAreas: options?.focusAreas,
        enableConsensus: true,
        minConsensusScore: 0.7,
      },
    };

    return await serverNullShotClient.runAudit(request);
  } catch (error) {
    // Re-throw if already an AppError
    if (error instanceof Error && 'code' in error && 'statusCode' in error) {
      throw error;
    }
    // Wrap in a generic error with more context
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(
      `Failed to analyze code security: ${errorMessage}`
    );
  }
}

/**
 * Get audit session by ID
 */
export function getAuditSession(sessionId: string) {
  try {
    if (!sessionId || typeof sessionId !== 'string' || sessionId.trim().length === 0) {
      throw new Error('Session ID is required and must be a non-empty string');
    }
    return serverNullShotClient.getSession(sessionId);
  } catch (error) {
    // Log error but return null for graceful handling
    logError(error instanceof Error ? error : new Error(String(error)), {
      context: 'getAuditSession',
      sessionId,
    });
    return null;
  }
}

/**
 * Get metrics
 */
export function getMetrics() {
  return serverNullShotClient.getMetrics();
}

