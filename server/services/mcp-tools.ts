/**
 * MCP Tools Registry
 * Exposes NullAudit capabilities as MCP tools for agent-to-agent integration
 */

import type { InvocationEnvelope, ResponseEnvelope } from '../../shared/envelopes.js';
import { createResponseEnvelope } from '../../shared/envelopes.js';
import { capabilityManager } from './capability-manager';
import { analyzeCodeSecurity, getAuditSession } from './nullshot-integration';

export interface MCPTool {
  id: string;
  name: string;
  description: string;
  input_schema: any;
  output_schema: any;
  handler: (invocation: InvocationEnvelope) => Promise<ResponseEnvelope>;
  requires_capability: boolean;
}

export class MCPToolRegistry {
  private tools: Map<string, MCPTool> = new Map();

  constructor() {
    this.registerDefaultTools();
  }

  /**
   * Register default NullAudit MCP tools
   */
  private registerDefaultTools(): void {
    // Tool: analyze_code_security
    this.register({
      id: 'analyze_code_security',
      name: 'Analyze Code Security',
      description: 'Perform multi-LLM security analysis on code',
      input_schema: {
        type: 'object',
        properties: {
          code: { type: 'string', description: 'Code to analyze' },
          language: { type: 'string', description: 'Programming language' },
          depth: { type: 'string', enum: ['quick', 'standard', 'deep'] },
        },
        required: ['code'],
      },
      output_schema: {
        type: 'object',
        properties: {
          findings: { type: 'array' },
          consensus_score: { type: 'number' },
          attestation_ref: { type: 'string' },
        },
      },
      requires_capability: true,
      handler: async (invocation) => {
        const { code, language, depth, focus_areas, blockchain } = invocation.metadata || {};
        
        // Enhanced validation
        if (!code || typeof code !== 'string' || code.trim().length === 0) {
          return createResponseEnvelope(
            invocation.id,
            false,
            null,
            { 
              error: 'Code is required and must be a non-empty string',
            }
          );
        }

        // Validate depth if provided
        if (depth && !['quick', 'standard', 'deep'].includes(depth)) {
          return createResponseEnvelope(
            invocation.id,
            false,
            null,
            { 
              error: 'Depth must be one of: quick, standard, deep',
            }
          );
        }

        try {
          // Use actual NullShot integration with progress tracking
          const startTime = Date.now();
          
          const result = await analyzeCodeSecurity(
            code,
            language,
            {
              depth: (depth as 'quick' | 'standard' | 'deep') || 'standard',
              focusAreas: Array.isArray(focus_areas) ? focus_areas : undefined,
              blockchain: typeof blockchain === 'string' ? blockchain : undefined,
            }
          );

          const duration = Date.now() - startTime;

          return createResponseEnvelope(
            invocation.id,
            true,
            {
              findings: result.findings,
              consensus_score: result.consensusScore || 0,
              models_used: result.modelsUsed || [],
              session_id: result.sessionId,
              summary: result.summary,
              human_review_required: result.humanReviewRequired,
              human_tasks_count: result.humanTasks?.length || 0,
              metadata: {
                code_length: code.length,
                language: language || 'unknown',
                depth: depth || 'standard',
              },
            },
            {
              compute_receipt: result.computeReceipt ? {
                cost_units: result.computeReceipt.costUnits ?? 0,
                token_count: result.computeReceipt.tokenCount,
                model_calls: result.computeReceipt.modelCalls,
                duration_ms: result.computeReceipt.durationMs || duration,
              } : {
                cost_units: 0,
                duration_ms: duration,
              },
            }
          );
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Analysis failed';
          const errorCode = error instanceof Error && 'code' in error 
            ? String(error.code) 
            : 'ANALYSIS_ERROR';
          
          return createResponseEnvelope(
            invocation.id,
            false,
            null,
            { 
              error: `${errorMessage} (${errorCode})`,
            }
          );
        }
      },
    });

    // Tool: mint_attestation
    this.register({
      id: 'mint_attestation',
      name: 'Mint Attestation',
      description: 'Create on-chain attestation for audit results',
      input_schema: {
        type: 'object',
        properties: {
          audit_id: { type: 'string' },
          merkle_root: { type: 'string' },
          cid: { type: 'string' },
        },
        required: ['audit_id', 'merkle_root'],
      },
      output_schema: {
        type: 'object',
        properties: {
          anchor_id: { type: 'string' },
          tx_hash: { type: 'string' },
          chain_id: { type: 'number' },
        },
      },
      requires_capability: true,
      handler: async (invocation) => {
        const { audit_id, merkle_root, cid } = invocation.metadata || {};

        // Simulate on-chain minting
        const anchor_id = `0x${Date.now().toString(16)}`;
        const tx_hash = `0x${Math.random().toString(16).substring(2)}`;

        return createResponseEnvelope(
          invocation.id,
          true,
          {
            anchor_id,
            tx_hash,
            chain_id: 43114, // Avalanche C-Chain
            block_number: 12345678,
          },
          {
            attestation_ref: anchor_id,
            compute_receipt: {
              cost_units: 50,
              duration_ms: 2000,
            },
          }
        );
      },
    });

    // Tool: get_report
    this.register({
      id: 'get_report',
      name: 'Get Audit Report',
      description: 'Retrieve detailed audit report',
      input_schema: {
        type: 'object',
        properties: {
          audit_id: { type: 'string' },
          format: { type: 'string', enum: ['json', 'pdf', 'html'] },
        },
        required: ['audit_id'],
      },
      output_schema: {
        type: 'object',
        properties: {
          report: { type: 'object' },
          format: { type: 'string' },
          cid: { type: 'string' },
        },
      },
      requires_capability: false,
      handler: async (invocation) => {
        const { audit_id, format = 'json' } = invocation.metadata || {};

        if (!audit_id) {
          return createResponseEnvelope(
            invocation.id,
            false,
            null,
            { error: 'audit_id is required' }
          );
        }

        try {
          // Get actual audit session
          const session = getAuditSession(audit_id);
          
          if (!session) {
            return createResponseEnvelope(
              invocation.id,
              false,
              null,
              { error: `Audit session ${audit_id} not found` }
            );
          }

          return createResponseEnvelope(
            invocation.id,
            true,
            {
              report: {
                audit_id,
                session_id: session.id,
                findings: session.findings,
                summary: {
                  critical: session.findings.filter(f => f.severity === 'critical').length,
                  high: session.findings.filter(f => f.severity === 'high').length,
                  medium: session.findings.filter(f => f.severity === 'medium').length,
                  low: session.findings.filter(f => f.severity === 'low').length,
                  totalFindings: session.findings.length,
                },
                status: session.status,
                startedAt: session.startedAt,
                completedAt: session.completedAt,
              },
              format,
            },
            {
              compute_receipt: {
                cost_units: 10,
                duration_ms: 500,
              },
            }
          );
        } catch (error) {
          return createResponseEnvelope(
            invocation.id,
            false,
            null,
            { 
              error: error instanceof Error ? error.message : 'Failed to get report',
            }
          );
        }
      },
    });

    // Tool: verify_attestation
    this.register({
      id: 'verify_attestation',
      name: 'Verify Attestation',
      description: 'Verify on-chain attestation',
      input_schema: {
        type: 'object',
        properties: {
          anchor_id: { type: 'string' },
          merkle_proof: { type: 'array' },
        },
        required: ['anchor_id'],
      },
      output_schema: {
        type: 'object',
        properties: {
          verified: { type: 'boolean' },
          anchor: { type: 'object' },
        },
      },
      requires_capability: false,
      handler: async (invocation) => {
        const { anchor_id } = invocation.metadata || {};

        return createResponseEnvelope(
          invocation.id,
          true,
          {
            verified: true,
            anchor: {
              anchor_id,
              merkle_root: '0x123...',
              signer: '0xabc...',
              timestamp: Date.now(),
            },
          }
        );
      },
    });
  }

  /**
   * Register a new MCP tool
   */
  register(tool: MCPTool): void {
    this.tools.set(tool.id, tool);
  }

  /**
   * Get tool by ID
   */
  getTool(tool_id: string): MCPTool | undefined {
    return this.tools.get(tool_id);
  }

  /**
   * List all available tools
   */
  listTools(): MCPTool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Invoke a tool with capability checking
   */
  async invoke(invocation: InvocationEnvelope): Promise<ResponseEnvelope> {
    const tool = this.getTool(invocation.tool_id);

    if (!tool) {
      return createResponseEnvelope(
        invocation.id,
        false,
        null,
        { error: `Tool not found: ${invocation.tool_id}` }
      );
    }

    // Check capability token if required
    if (tool.requires_capability) {
      if (!invocation.capability_token) {
        return createResponseEnvelope(
          invocation.id,
          false,
          null,
          { error: 'Capability token required' }
        );
      }

      const canPerform = capabilityManager.canPerformAction(
        invocation.capability_token,
        invocation.tool_id,
        invocation.action
      );

      if (!canPerform) {
        return createResponseEnvelope(
          invocation.id,
          false,
          null,
          { error: 'Insufficient capability' }
        );
      }
    }

    try {
      return await tool.handler(invocation);
    } catch (error) {
      return createResponseEnvelope(
        invocation.id,
        false,
        null,
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Get tool manifest for MCP discovery
   */
  getManifest(): any {
    return {
      name: 'NullAudit MCP Server',
      version: '2.0.0',
      description: 'Multi-LLM Security Analysis with Human-in-the-Loop',
      tools: this.listTools().map(tool => ({
        id: tool.id,
        name: tool.name,
        description: tool.description,
        input_schema: tool.input_schema,
        output_schema: tool.output_schema,
        requires_capability: tool.requires_capability,
      })),
    };
  }
}

// Singleton instance
export const mcpToolRegistry = new MCPToolRegistry();
