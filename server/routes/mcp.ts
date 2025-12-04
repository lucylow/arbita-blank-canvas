import { Router } from 'express';
import type { Request, Response } from 'express';
import { validateInvocation } from '../../shared/envelopes';
import { mcpToolRegistry } from '../services/mcp-tools';
import { capabilityManager } from '../services/capability-manager';

const router = Router();

/**
 * GET /api/mcp/manifest
 * Get MCP server manifest (tool discovery)
 */
router.get('/manifest', (req: Request, res: Response) => {
  try {
    const manifest = mcpToolRegistry.getManifest();
    res.json(manifest);
  } catch (error) {
    console.error('Error fetching manifest:', error);
    res.status(500).json({ error: 'Failed to fetch manifest' });
  }
});

/**
 * GET /api/mcp/tools
 * List all available MCP tools
 */
router.get('/tools', (req: Request, res: Response) => {
  try {
    const tools = mcpToolRegistry.listTools().map(tool => ({
      id: tool.id,
      name: tool.name,
      description: tool.description,
      input_schema: tool.input_schema,
      output_schema: tool.output_schema,
      requires_capability: tool.requires_capability,
    }));
    
    res.json({ tools });
  } catch (error) {
    console.error('Error listing tools:', error);
    res.status(500).json({ error: 'Failed to list tools' });
  }
});

/**
 * POST /api/mcp/invoke
 * Invoke an MCP tool
 */
router.post('/invoke', async (req: Request, res: Response) => {
  try {
    // Validate invocation envelope
    const invocation = validateInvocation(req.body);
    
    // Invoke tool
    const response = await mcpToolRegistry.invoke(invocation);
    
    res.json(response);
  } catch (error) {
    console.error('Error invoking tool:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Invalid invocation',
    });
  }
});

/**
 * POST /api/mcp/capability/mint
 * Mint a capability token
 */
router.post('/capability/mint', (req: Request, res: Response) => {
  try {
    const { tool_id, caller, allowed_actions, ttl_seconds, scope } = req.body;
    
    if (!tool_id || !caller || !allowed_actions) {
      return res.status(400).json({ error: 'Missing required fields' });
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
  } catch (error) {
    console.error('Error minting capability:', error);
    res.status(500).json({ error: 'Failed to mint capability' });
  }
});

/**
 * POST /api/mcp/capability/verify
 * Verify a capability token
 */
router.post('/capability/verify', (req: Request, res: Response) => {
  try {
    const { token, tool_id, action } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'Token required' });
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
  } catch (error) {
    console.error('Error verifying capability:', error);
    res.status(500).json({ error: 'Failed to verify capability' });
  }
});

/**
 * POST /api/mcp/capability/revoke
 * Revoke a capability token
 */
router.post('/capability/revoke', (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'Token required' });
    }
    
    capabilityManager.revoke(token);
    
    res.json({
      success: true,
      message: 'Token revoked',
    });
  } catch (error) {
    console.error('Error revoking capability:', error);
    res.status(500).json({ error: 'Failed to revoke capability' });
  }
});

/**
 * GET /api/mcp/health
 * Health check endpoint
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    version: '2.0.0',
    mcp_enabled: true,
    tools_count: mcpToolRegistry.listTools().length,
  });
});

export default router;
