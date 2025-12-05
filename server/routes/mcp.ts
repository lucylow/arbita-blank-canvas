import { Router } from 'express';
import type { Request, Response } from 'express';
import { validateInvocation } from '../../shared/envelopes.js';
import { mcpToolRegistry } from '../services/mcp-tools';
import { capabilityManager } from '../services/capability-manager';
import { requireSubscription, attachSubscription } from '../middleware/subscription.js';
import { trackUsage } from '../services/stripe-service.js';
import { asyncHandler } from '../utils/error-handler.js';
import { ValidationError, NotFoundError } from '../../shared/errors.js';

const router = Router();

/**
 * GET /api/mcp/manifest
 * Get MCP server manifest (tool discovery)
 */
router.get('/manifest', asyncHandler(async (req: Request, res: Response) => {
  const manifest = mcpToolRegistry.getManifest();
  res.json(manifest);
}));

/**
 * GET /api/mcp/tools
 * List all available MCP tools
 */
router.get('/tools', asyncHandler(async (req: Request, res: Response) => {
  const tools = mcpToolRegistry.listTools().map(tool => ({
    id: tool.id,
    name: tool.name,
    description: tool.description,
    input_schema: tool.input_schema,
    output_schema: tool.output_schema,
    requires_capability: tool.requires_capability,
  }));
  
  res.json({ tools });
}));

/**
 * POST /api/mcp/invoke
 * Invoke an MCP tool
 */
router.post('/invoke', attachSubscription, asyncHandler(async (req: Request, res: Response) => {
  // Validate invocation envelope
  let invocation;
  try {
    invocation = validateInvocation(req.body);
  } catch (error) {
    throw new ValidationError(
      error instanceof Error ? error.message : 'Invalid invocation envelope',
      undefined,
      { body: req.body }
    );
  }
  
  // Check subscription for AI agent tools (analyze_code_security)
  if (invocation.tool_id === 'analyze_code_security') {
    const userId = req.headers['x-user-id'] as string || 'demo-user';
    const isDeepAnalysis = invocation.metadata?.depth === 'deep';
    
    // Check if user can make the call
    const { canMakeAICall } = await import('../services/stripe-service.js');
    const canCall = canMakeAICall(userId, isDeepAnalysis);
    
    if (!canCall.allowed) {
      const subscription = (req as any).subscription;
      const plan = (req as any).plan;
      throw new ValidationError(
        canCall.reason || 'Subscription required',
        undefined,
        {
          subscription,
          plan,
          upgradeRequired: true,
        }
      );
    }
    
    // Invoke tool
    const response = await mcpToolRegistry.invoke(invocation);
    
    // Track usage after successful call
    trackUsage(userId, isDeepAnalysis);
    
    // Add usage info to response metadata
    const updatedResponse = {
      ...response,
      metadata: {
        ...((response as any).metadata || {}),
        usage_tracked: true,
        subscription_plan: (req as any).plan?.id || 'free',
      },
    };
    
    res.json(updatedResponse);
  } else {
    // Invoke tool (no subscription check for non-AI tools)
    const response = await mcpToolRegistry.invoke(invocation);
    res.json(response);
  }
}));

/**
 * POST /api/mcp/capability/mint
 * Mint a capability token
 */
router.post('/capability/mint', asyncHandler(async (req: Request, res: Response) => {
  const { tool_id, caller, allowed_actions, ttl_seconds, scope } = req.body;
  
  if (!tool_id || !caller || !allowed_actions) {
    throw new ValidationError(
      'Missing required fields: tool_id, caller, and allowed_actions are required',
      undefined,
      { missingFields: { tool_id: !tool_id, caller: !caller, allowed_actions: !allowed_actions } }
    );
  }
  
  if (!Array.isArray(allowed_actions) || allowed_actions.length === 0) {
    throw new ValidationError('allowed_actions must be a non-empty array', 'allowed_actions');
  }
  
  const token = capabilityManager.mint({
    tool_id,
    caller,
    allowed_actions,
    ttl_seconds,
    scope,
  });
  
  res.json({
    success: true,
    token,
    expires_in: ttl_seconds || 3600,
  });
}));

/**
 * POST /api/mcp/capability/verify
 * Verify a capability token
 */
router.post('/capability/verify', asyncHandler(async (req: Request, res: Response) => {
  const { token, tool_id, action } = req.body;
  
  if (!token) {
    throw new ValidationError('Token is required', 'token');
  }
  
  if (tool_id && action) {
    const canPerform = capabilityManager.canPerformAction(token, tool_id, action);
    return res.json({
      valid: canPerform,
      can_perform: canPerform,
    });
  }
  
  const capability = capabilityManager.verify(token);
  res.json({
    valid: capability !== null,
    capability,
  });
}));

/**
 * POST /api/mcp/capability/revoke
 * Revoke a capability token
 */
router.post('/capability/revoke', asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.body;
  
  if (!token) {
    throw new ValidationError('Token is required', 'token');
  }
  
  capabilityManager.revoke(token);
  
  res.json({
    success: true,
    message: 'Token revoked',
  });
}));

/**
 * GET /api/mcp/health
 * Health check endpoint
 */
router.get('/health', asyncHandler(async (req: Request, res: Response) => {
  try {
    const toolsCount = mcpToolRegistry.listTools().length;
    res.json({
      status: 'healthy',
      version: '2.0.0',
      mcp_enabled: true,
      tools_count: toolsCount,
    });
  } catch (error) {
    // Health check should still return a response even if there's an error
    res.status(503).json({
      status: 'unhealthy',
      version: '2.0.0',
      mcp_enabled: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}));

export default router;
