/**
 * MCP Tools Registry
 * Exposes NullAudit capabilities as MCP tools for agent-to-agent integration
 */

import type { InvocationEnvelope, ResponseEnvelope } from '../../shared/envelopes';
import { createResponseEnvelope } from '../../shared/envelopes';
import { capabilityManager } from './capability-manager';

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
        // Simulate security analysis
        const findings = [
          {
            type: 'SQL Injection',
            severity: 'high',
            confidence: 0.85,
            location: { line: 42 },
          },
        ];

        return createResponseEnvelope(
          invocation.id,
          true,
          {
            findings,
            consensus_score: 0.85,
            models_used: ['gpt-4', 'claude-3', 'gemini-pro'],
          },
          {
            compute_receipt: {
              cost_units: 150,
              token_count: 2500,
              model_calls: 3,
              duration_ms: 4500,
            },
          }
        );
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
        const tx_hash = `0x${Math.random().toString(16).substr(2)}`;

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

        return createResponseEnvelope(
          invocation.id,
          true,
          {
            report: {
              audit_id,
              findings: [],
              summary: 'Mock report',
            },
            format,
            cid: 'QmExample123',
          },
          {
            compute_receipt: {
              cost_units: 10,
              duration_ms: 500,
            },
          }
        );
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
