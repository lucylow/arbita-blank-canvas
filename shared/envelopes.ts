/**
 * Standardized Invocation and Response Envelopes
 * Based on NullShot MCP specification for deterministic, verifiable agent interactions
 */

import { z } from 'zod';

/**
 * Invocation Envelope Schema
 * Used for all incoming agent/MCP tool requests
 */
export const InvocationEnvelopeSchema = z.object({
  id: z.string().describe('Unique invocation identifier'),
  caller: z.string().describe('Caller identity (agent ID or address)'),
  tool_id: z.string().describe('Tool being invoked'),
  action: z.string().describe('Specific action to perform'),
  input_hash: z.string().optional().describe('Keccak256 hash of canonical input'),
  evidence_refs: z.array(z.string()).optional().describe('IPFS/Arweave CIDs for evidence'),
  prompt_template_id: z.string().optional().describe('Template used for LLM prompts'),
  nonce: z.string().optional().describe('Replay protection nonce'),
  ts: z.number().describe('Unix timestamp'),
  capability_token: z.string().optional().describe('JWT capability token for scoped access'),
  metadata: z.record(z.any()).optional().describe('Additional metadata'),
});

export type InvocationEnvelope = z.infer<typeof InvocationEnvelopeSchema>;

/**
 * Response Envelope Schema
 * Standardized response format with compute receipts and signatures
 */
export const ResponseEnvelopeSchema = z.object({
  invocation_id: z.string().describe('Reference to original invocation'),
  success: z.boolean().describe('Whether operation succeeded'),
  payload: z.any().describe('Response data'),
  compute_receipt: z.object({
    cost_units: z.number().describe('Computational cost in units'),
    token_count: z.number().optional().describe('Total tokens used'),
    model_calls: z.number().optional().describe('Number of model invocations'),
    duration_ms: z.number().optional().describe('Execution time in milliseconds'),
  }).optional().describe('Computational cost tracking'),
  sig: z.string().optional().describe('Provider/adapter signature'),
  attestation_ref: z.string().optional().describe('On-chain attestation reference'),
  ts: z.number().describe('Unix timestamp'),
  error: z.string().optional().describe('Error message if failed'),
});

export type ResponseEnvelope = z.infer<typeof ResponseEnvelopeSchema>;

/**
 * Capability Token Schema
 * Short-lived tokens for scoped tool access
 */
export const CapabilityTokenSchema = z.object({
  tool_id: z.string(),
  caller: z.string(),
  allowed_actions: z.array(z.string()),
  exp: z.number().describe('Expiration timestamp'),
  iat: z.number().describe('Issued at timestamp'),
  scope: z.record(z.any()).optional().describe('Additional scope constraints'),
});

export type CapabilityToken = z.infer<typeof CapabilityTokenSchema>;

/**
 * Attestation Anchor Schema
 * On-chain attestation reference
 */
export const AttestationAnchorSchema = z.object({
  anchor_id: z.string().describe('Unique anchor identifier'),
  merkle_root: z.string().describe('Merkle root of evidence bundle'),
  chain_id: z.number().describe('Blockchain chain ID'),
  tx_hash: z.string().optional().describe('Transaction hash'),
  block_number: z.number().optional().describe('Block number'),
  signer: z.string().describe('Signer address'),
  timestamp: z.number().describe('Anchor timestamp'),
  cid: z.string().optional().describe('IPFS CID of full evidence'),
});

export type AttestationAnchor = z.infer<typeof AttestationAnchorSchema>;

/**
 * Evidence Manifest Schema
 * Canonical evidence bundle for IPFS storage
 */
export const EvidenceManifestSchema = z.object({
  invocation: InvocationEnvelopeSchema,
  response: ResponseEnvelopeSchema,
  evidence: z.array(z.object({
    type: z.string(),
    content: z.any(),
    hash: z.string(),
  })),
  models_used: z.array(z.string()),
  consensus_score: z.number().optional(),
  created_at: z.number(),
});

export type EvidenceManifest = z.infer<typeof EvidenceManifestSchema>;

/**
 * Helper: Validate invocation envelope
 */
export function validateInvocation(data: unknown): InvocationEnvelope {
  return InvocationEnvelopeSchema.parse(data);
}

/**
 * Helper: Validate response envelope
 */
export function validateResponse(data: unknown): ResponseEnvelope {
  return ResponseEnvelopeSchema.parse(data);
}

/**
 * Helper: Create invocation envelope
 */
export function createInvocationEnvelope(
  params: Omit<InvocationEnvelope, 'id' | 'ts'>
): InvocationEnvelope {
  return {
    id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ts: Date.now(),
    ...params,
  };
}

/**
 * Helper: Create response envelope
 */
export function createResponseEnvelope(
  invocation_id: string,
  success: boolean,
  payload: any,
  options?: {
    compute_receipt?: ResponseEnvelope['compute_receipt'];
    sig?: string;
    attestation_ref?: string;
    error?: string;
  }
): ResponseEnvelope {
  return {
    invocation_id,
    success,
    payload,
    ts: Date.now(),
    ...options,
  };
}
