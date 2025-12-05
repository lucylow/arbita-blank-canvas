# NullShot Integration Guide - NullAudit v3.0

## Overview

NullAudit v3.0 is fully integrated with the **NullShot Agent Framework** and **Model Context Protocol (MCP)**, enabling:

- 🤖 **Agent-to-Agent Communication** - Other NullShot agents can invoke security audits
- 🔧 **MCP Tool Exposure** - Standardized tool descriptors for agent discovery
- 📊 **Agent Orchestration** - Multi-agent consensus for security analysis
- 🔐 **Capability Tokens** - Fine-grained access control
- ⛓️ **Web3 Integration** - On-chain attestations and verification

---

## Architecture

### NullAudit as MCP Server

NullAudit exposes security analysis capabilities as MCP tools:

```
┌─────────────────────────────────────────┐
│     NullShot Agent Framework             │
│  (Orchestration, Multi-LLM Consensus)   │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│     NullAudit MCP Server                 │
│  (Tool Registry, Capability Tokens)     │
└────────────┬────────────────────────────┘
             │
        ┌────┴────┬────────┬─────────┐
        ▼         ▼        ▼         ▼
   ┌────────┐ ┌──────┐ ┌─────┐ ┌──────────┐
   │ Analyze│ │Mint  │ │Get  │ │ Verify   │
   │ Code   │ │Attest│ │Report│ │Attestation
   └────────┘ └──────┘ └─────┘ └──────────┘
        │         │        │         │
        └─────────┴────────┴─────────┘
                  │
                  ▼
        ┌──────────────────┐
        │  Smart Contracts │
        │  (Blockchain)    │
        └──────────────────┘
```

### Agent Orchestration Flow

```
1. External Agent Request
   ↓
2. MCP Tool Invocation
   ├─ Capability Token Validation
   ├─ Input Validation (Zod)
   └─ Deterministic Hashing
   ↓
3. NullShot Agent Orchestration
   ├─ Multi-LLM Analysis
   ├─ Consensus Scoring
   └─ Evidence Collection
   ↓
4. Response Generation
   ├─ Compute Receipt
   ├─ Evidence Manifest
   └─ Deterministic Output
   ↓
5. On-Chain Attestation (Optional)
   ├─ Merkle Root Anchoring
   ├─ IPFS CID Storage
   └─ Smart Contract Interaction
```

---

## MCP Tools Reference

### 1. analyze_code_security

**Purpose**: Perform multi-LLM security analysis with consensus scoring

**Input Schema**:
```typescript
{
  code: string;                    // Source code to analyze
  language: string;                // Programming language
  depth?: "quick" | "standard" | "deep";  // Analysis depth
  focus_areas?: string[];          // Specific areas to focus on
  blockchain?: string;             // Target blockchain (for smart contracts)
}
```

**Example Request**:
```bash
curl -X POST http://localhost:3000/api/mcp/invoke \
  -H "Content-Type: application/json" \
  -H "X-Capability-Token: your-token" \
  -d '{
    "tool_id": "analyze_code_security",
    "inputs": {
      "code": "pragma solidity ^0.8.0;\ncontract Token { ... }",
      "language": "solidity",
      "blockchain": "ethereum",
      "depth": "deep",
      "focus_areas": ["reentrancy", "access-control", "gas-optimization"]
    }
  }'
```

---

## Capability Token Management

### Minting Tokens

Capability tokens provide scoped, time-limited access to MCP tools.

**Endpoint**: `POST /api/mcp/capability/mint`

**Request**:
```json
{
  "tool_id": "analyze_code_security",
  "caller": "external-agent-123",
  "expiration_hours": 1,
  "actions": ["invoke"]
}
```

---

## Deployment on Lovable

### Prerequisites
1. Lovable account
2. GitHub repository with NullAudit code
3. Environment variables configured

### Deployment Steps

1. **Push to GitHub**:
```bash
git add .
git commit -m "NullAudit v3.0 with NullShot integration"
git push origin main
```

2. **Connect to Lovable**:
   - Go to https://lovable.dev
   - Click "New Project"
   - Select "Import from GitHub"
   - Choose the NullAudit repository

3. **Configure Environment**:
   - Set environment variables in Lovable dashboard
   - Include API keys for LLM providers
   - Configure blockchain RPC URLs

4. **Deploy**:
   - Lovable auto-detects the project structure
   - Builds and deploys automatically
   - Access at `https://your-project.lovable.app`

---

## Testing

### Test MCP Tool Discovery

```bash
curl http://localhost:3000/api/mcp/manifest | jq
```

### Test Tool Invocation

```bash
curl -X POST http://localhost:3000/api/mcp/invoke \
  -H "Content-Type: application/json" \
  -d '{
    "tool_id": "analyze_code_security",
    "inputs": {
      "code": "console.log(\"test\");",
      "language": "javascript"
    }
  }' | jq
```

---

## Resources

- [NullShot Documentation](https://nullshot.ai/en/docs/developers)
- [MCP Specification](https://modelcontextprotocol.io/)
- [TypeScript Agent Toolkit](https://github.com/null-shot/typescript-agent-tookit)
- [Lovable Deployment Guide](https://lovable.dev/docs)

---

**Version 3.0** - NullShot Agent Framework Integration  
**Last Updated**: December 4, 2024
