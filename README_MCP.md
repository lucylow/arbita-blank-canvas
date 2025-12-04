# NullAudit MCP Integration Guide

## Overview

NullAudit now includes full Model Context Protocol (MCP) support, enabling agent-to-agent integration and standardized tool invocation for security auditing.

## MCP Features

### 🔧 MCP Tools

NullAudit exposes the following MCP tools:

1. **analyze_code_security** - Multi-LLM security analysis
2. **mint_attestation** - On-chain attestation creation
3. **get_report** - Retrieve audit reports
4. **verify_attestation** - Verify on-chain attestations

### 🎫 Capability Tokens

Short-lived JWT-like tokens for scoped tool access:
- Tool-specific permissions
- Time-limited access
- Action-level authorization
- Revocable credentials

### 📦 Standardized Envelopes

All MCP interactions use validated envelopes:
- **InvocationEnvelope** - Request format with input hashing
- **ResponseEnvelope** - Response format with compute receipts
- **Zod validation** - Runtime type checking

## Quick Start

### 1. Start MCP Server

```bash
npm install
npm run dev
```

The MCP server will be available at `http://localhost:3000/api/mcp`

### 2. Discover Available Tools

```bash
curl http://localhost:3000/api/mcp/manifest
```

Response:
```json
{
  "name": "NullAudit MCP Server",
  "version": "2.0.0",
  "tools": [...]
}
```

### 3. Mint Capability Token

```bash
curl -X POST http://localhost:3000/api/mcp/capability/mint \
  -H "Content-Type: application/json" \
  -d '{
    "tool_id": "analyze_code_security",
    "caller": "agent-123",
    "allowed_actions": ["analyze", "report"],
    "ttl_seconds": 3600
  }'
```

### 4. Invoke MCP Tool

```bash
curl -X POST http://localhost:3000/api/mcp/invoke \
  -H "Content-Type: application/json" \
  -d '{
    "id": "inv_001",
    "caller": "agent-123",
    "tool_id": "analyze_code_security",
    "action": "analyze",
    "capability_token": "YOUR_TOKEN_HERE",
    "ts": 1234567890,
    "metadata": {
      "code": "SELECT * FROM users WHERE id = ${userId}",
      "language": "sql"
    }
  }'
```

## MCP Tool Reference

### analyze_code_security

Perform multi-LLM security analysis on code.

**Input:**
```typescript
{
  code: string;
  language?: string;
  depth?: 'quick' | 'standard' | 'deep';
}
```

**Output:**
```typescript
{
  findings: SecurityFinding[];
  consensus_score: number;
  models_used: string[];
  attestation_ref?: string;
}
```

### mint_attestation

Create on-chain attestation for audit results.

**Input:**
```typescript
{
  audit_id: string;
  merkle_root: string;
  cid?: string;
}
```

**Output:**
```typescript
{
  anchor_id: string;
  tx_hash: string;
  chain_id: number;
  block_number: number;
}
```

### get_report

Retrieve detailed audit report.

**Input:**
```typescript
{
  audit_id: string;
  format?: 'json' | 'pdf' | 'html';
}
```

**Output:**
```typescript
{
  report: AuditReport;
  format: string;
  cid: string;
}
```

### verify_attestation

Verify on-chain attestation.

**Input:**
```typescript
{
  anchor_id: string;
  merkle_proof?: string[];
}
```

**Output:**
```typescript
{
  verified: boolean;
  anchor: AttestationAnchor;
}
```

## Agent-to-Agent Integration

### Example: Claude Desktop Integration

1. Add NullAudit to your MCP config:

```json
{
  "mcpServers": {
    "nullaudit": {
      "url": "http://localhost:3000/api/mcp",
      "capabilities": ["tools"]
    }
  }
}
```

2. Use in Claude Desktop:

```
Analyze this code for security issues:
[paste code]
```

Claude will automatically invoke the `analyze_code_security` tool.

### Example: Custom Agent

```typescript
import { createInvocationEnvelope } from '@nullaudit/shared/envelopes';

const invocation = createInvocationEnvelope({
  caller: 'my-agent',
  tool_id: 'analyze_code_security',
  action: 'analyze',
  metadata: {
    code: sourceCode,
    language: 'javascript',
  },
});

const response = await fetch('http://localhost:3000/api/mcp/invoke', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(invocation),
});

const result = await response.json();
```

## Smart Contract Integration

### AttestationAnchor Contract

Deployed on Avalanche C-Chain for on-chain attestation anchoring.

**Key Functions:**
- `anchor(anchorId, merkleRoot, cid)` - Create attestation
- `verify(anchorId, proof)` - Verify attestation
- `getAnchor(anchorId)` - Retrieve attestation data

**Example:**
```solidity
// Verify attestation on-chain
bool verified = attestationAnchor.verify(anchorId, merkleProof);
require(verified, "Invalid attestation");
```

## Deterministic Execution

All invocations include:
- **input_hash** - Keccak256 of canonical input
- **evidence_refs** - IPFS CIDs for reproducibility
- **nonce** - Replay protection
- **compute_receipt** - Cost tracking

This enables:
- Reproducible audits
- Verifiable results
- Cost accounting
- Audit trails

## Security Considerations

### Capability Tokens
- Short-lived (default 1 hour)
- Tool-specific
- Action-scoped
- Revocable

### Input Validation
- Zod schema validation
- Type checking
- Sanitization

### Rate Limiting
- Per-caller limits
- Per-tool quotas
- Cost-based throttling

## API Endpoints

### MCP Endpoints

```
GET  /api/mcp/manifest          # Get MCP manifest
GET  /api/mcp/tools             # List available tools
POST /api/mcp/invoke            # Invoke MCP tool
GET  /api/mcp/health            # Health check
```

### Capability Endpoints

```
POST /api/mcp/capability/mint   # Mint capability token
POST /api/mcp/capability/verify # Verify token
POST /api/mcp/capability/revoke # Revoke token
```

## Environment Variables

```bash
# Server configuration
PORT=3000
NODE_ENV=production

# MCP configuration
ENABLE_MCP=true
SERVER_KEY=your-secret-key

# Blockchain configuration
CHAIN_ID=43114
RPC_URL=https://api.avax.network/ext/bc/C/rpc
ATTESTATION_CONTRACT=0x...

# NullShot configuration
NULLSHOT_API_KEY=your-api-key
```

## Testing

### Unit Tests
```bash
npm test
```

### Integration Tests
```bash
npm run test:integration
```

### MCP Tool Test
```bash
npm run mcp:test-tool
```

## Monitoring

### Metrics
- `mcp_invocations_total` - Total tool invocations
- `mcp_invocation_duration_ms` - Invocation latency
- `mcp_capability_tokens_issued` - Tokens minted
- `mcp_errors_total` - Error count

### Logs
All MCP operations are logged with:
- Invocation ID
- Caller identity
- Tool ID
- Duration
- Success/failure

## Roadmap

- [ ] ZK proofs for privacy-preserving audits
- [ ] BLS signature aggregation
- [ ] Cross-chain attestation relayer
- [ ] Advanced capability scoping
- [ ] MCP resource providers

## Support

For MCP-related questions:
- Check [NullShot MCP docs](https://nullshot.ai/en/docs/developers/mcp)
- Review `mcp.json` configuration
- Inspect server logs

---

**NullAudit MCP Server - Agent-to-Agent Security Auditing**
