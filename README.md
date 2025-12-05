# NullAudit
> **Deterministic, attested AI audits & agent orchestration**
> Multi-LLM agent pipeline with canonical envelopes, attestation anchoring, MCP tooling, and optional on-chain verification. This repo is an engine / reference for NullAudit: reproducible AI-driven audits with auditable outputs and Web3 attestation.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture (high-level)](#architecture-high-level)
3. [Core Concepts & Data Contracts](#core-concepts--data-contracts)
4. [Repository Layout](#repository-layout)
5. [Quickstart — Local dev](#quickstart--local-dev)
6. [Run on Lovable / Supabase / Workers](#run-on-lovable--supabase--workers)
7. [MCP & Durable Object Integration (examples)](#mcp--durable-object-integration-examples)
8. [Attestation Flow & Smart Contract Interface](#attestation-flow--smart-contract-interface)
9. [Analytics, Monitoring & Billing (Stripe)](#analytics-monitoring--billing-stripe)
10. [CI / CD (example GitHub Actions)](#ci--cd-example-github-actions)
11. [Testing and Verification](#testing-and-verification)
12. [Security & Ops Checklist](#security--ops-checklist)
13. [Contributing](#contributing)
14. [License](#license)

---

## Project overview

`deleteee` is a working demonstration of a **NullAudit** pipeline:

* Canonicalizes inputs (repo, bytecode, manifests) into deterministic `input_hash`.
* Runs static & dynamic scanners (semgrep-like descriptors), bytecode analyzers, fuzzers.
* Invokes a **multi-LLM ensemble** with identical canonical contexts via `InvocationEnvelope`.
* Normalizes outputs into `ResponseEnvelope` JSON, computes consensus, severity and a `SecurityScore`.
* Produces an `AuditBundle` (JSON), merkleizes findings → `merkleRoot`.
* Mint attestation via MCP tool `mint_attestation` (optionally calling an on-chain `AttestationAnchor` contract).
* Supports human-in-the-loop (HITL) gating and policy-as-code guardrails.

Goals: reproducibility, provenance, auditable attestation for high-value flows (deploys, cross-chain bridges, minting).

---

## Architecture (high-level)

```mermaid
flowchart LR
  subgraph INPUT
    A[repo/, bytecode/, manifests/, logs] --> Canon[Canonicalizer]
  end

  Canon --> EvidenceStore[Evidence Store (IPFS/Arweave)]
  Canon --> Scanners[Static & Dynamic Scanners]
  Scanners --> SigGen[Snippet Fingerprints / Rule Hits]
  SigGen --> LLMMesh[LLM Adapter Mesh]
  EvidenceStore --> LLMMesh

  LLMMesh --> Normalizer
  Normalizer --> ConsensusEngine
  Scanners --> ConsensusEngine
  ConsensusEngine --> PolicyEngine[Policy / Guardrails]
  PolicyEngine --> Reporter[Report Builder / AuditBundle]
  Reporter --> Merkleizer[Merkle leaf builder]
  Merkleizer --> Attestor[Attestation Engine]
  Attestor --> MCPTool[mint_attestation (MCP)]
  Attestor -->|attestationId| Blockchain[AttestationAnchor.sol / On-chain]

  Blockchain --> Consumers[CI/CD | Governance | Bridges]
```

---

## Core concepts & data contracts

### InvocationEnvelope (what we send to tools/LLMs)

```json
{
  "id": "uuid-v4",
  "caller": "SupervisorAgent",
  "tool_id": "llm:gpt-4-code",
  "action": "analyze",
  "prompt_template_id": "security-audit-v1",
  "input_hash": "0xabc123...",
  "evidence_refs": ["cid:Qm..."],
  "inputs": { "filePath": "contracts/Bridge.sol", "lineRange": [1, 400] },
  "capability_token": "macaroon-or-jwt",
  "ts": 1712345678
}
```

### ResponseEnvelope (tool responses)

```json
{
  "invocation_id": "uuid-v4",
  "success": true,
  "payload": {
    "findings": [
      { "id":"f1","finding":"reentrancy risk","severity":3,"evidence_ref":"cid:..." }
    ]
  },
  "compute_receipt": { "cost_units": 2.3, "provider_raw": {...} },
  "sig": "base64-provider-signature",
  "ts": 1712345690
}
```

### ConsensusReport

Result of ConsensusAgent. Example:

```json
{
  "report_id": "uuid",
  "score": 67,
  "severity_vector": { "reentrancy": 0.8, "access_control": 0.2 },
  "evidence_weight": 0.85,
  "leaf_refs": ["cid:...", "cid:..."]
}
```

### AuditBundle (synthesized artifact)

* Contains canonical Invocation/Response envelopes, scanners outputs, consensus report, metadata and compute receipts.
* Used to build Merkle leaves and supply `reportCID`.

---

## Repository layout (summary)

```
/
├─ contracts/                   # Solidity attestation contract(s)
│  ├─ AttestationAnchor.sol
│  └─ CanonicalToken.sol (example)
├─ src/
│  ├─ agents/
│  │  └─ sea.ts                 # Supervisor / SEA orchestration
│  ├─ attest/
│  │  ├─ attestor.ts            # merkle, signature, mint_attestation client
│  │  └─ merkle.ts              # merkle utilities
│  ├─ tools/
│  │  ├─ semgrep-descriptor.json
│  │  └─ tool-registry.ts
│  ├─ workflows/
│  │  └─ nullaudit-workflows.ts
│  ├─ mcp/
│  │  ├─ mcp-server.ts         # MCP server templates
│  │  └─ demo-client.js
│  └─ utils/
│     ├─ envelopes.ts           # InvocationEnvelope / ResponseEnvelope helpers
│     └─ logging.ts
├─ scripts/
│  ├─ deploy-attestation.js
│  └─ merkle-gen.js
├─ docker/
│  └─ Dockerfile
├─ .github/
│  └─ workflows/ci.yml
├─ wrangler.toml
├─ mcp.json
└─ README.md
```

---

## Quickstart — Local development

> Prereqs: Node >=18, npm/yarn, Docker (optional), IPFS daemon (or use public pinning service), optionally `wrangler` if deploying Workers.

1. Clone repo

```bash
git clone https://github.com/lucylow/deleteee.git
cd deleteee
```

2. Install

```bash
npm install
# or
yarn
```

3. Environment

Create `.env.local` (example)

```
# AI provider
AI_PROVIDER=openai
AI_PROVIDER_API_KEY=sk-...
MODEL_ID=gpt-4o

# Storage / pinning
IPFS_API_URL=http://127.0.0.1:5001/api/v0

# MCP
MCP_SERVER_URL=http://localhost:3000

# Optional: Stripe
STRIPE_SECRET_KEY=sk_live_...
# Attestation signer (local)
ATTESTATION_PRIVATE_KEY=0x...
```

4. Start local MCP demo server (simple express for testing)

```bash
node src/mcp/mcp-server-dev.js
# this exposes /mcp/tool/mint_attestation and other endpoints
```

5. Run a simple agent instance locally (non-DO mode)

```bash
node src/agents/sea.local.js
```

6. Run a demo client that posts an InvocationEnvelope and mints attestation

```bash
node src/mcp/demo-client.js
```

---

## Run on Lovable / Supabase / Workers

This repo is architected to run on edge platforms:

* **Durable Objects / Cloudflare Workers**: uses Durable Objects for session & MCP servers. `wrangler.toml` contains sample bindings and durable class names.
* **Lovable / Supabase Edge Functions**: backend functions can be ported to Supabase edges; use environment secrets for API keys and MCP URLs.
* **Docker**: You can run server components (mcp demo server, attestor) in Docker for local testing.

**Notes:**

* Ensure bindings for `ANALYTICS`, `MEMORY_STORE`, and `STREAM` are configured per platform.
* Keep keys in environment or secrets managers (Lovable “Add API Key”, `wrangler secret put` for Cloudflare).

---

## MCP & Durable Object integration — examples

### Demo `demo-client.js` (posting an InvocationEnvelope and then minting)

Below is an illustrative snippet — full file lives in `src/mcp/demo-client.js`:

```js
// src/mcp/demo-client.js (simplified)
import fetch from 'node-fetch';
import crypto from 'crypto';

const MCP_URL = process.env.MCP_SERVER_URL || 'http://localhost:3000';

function makeInvocationEnvelope() {
  return {
    id: crypto.randomUUID(),
    caller: 'demo-client',
    tool_id: 'llm:gpt-4-code',
    action: 'analyze',
    prompt_template_id: 'security-audit-v1',
    input_hash: '0xabc' + Date.now().toString(16),
    evidence_refs: ['cid:QmExample'],
    inputs: { path: 'contracts/Bridge.sol' },
    ts: Date.now()
  };
}

async function postInvocation() {
  const envelope = makeInvocationEnvelope();
  const res = await fetch(`${MCP_URL}/mcp/tool/invoke`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(envelope)
  });
  const invocationRes = await res.json();
  console.log('Invocation result', invocationRes);
  return invocationRes;
}

async function mintAttestation(merkleRoot, reportCID, score) {
  const body = { merkleRoot, reportCID, score, signer: 'demo-signer' };
  const res = await fetch(`${MCP_URL}/mcp/tool/mint_attestation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-capability-token': process.env.CAPABILITY_TOKEN || '' },
    body: JSON.stringify(body)
  });
  return res.json();
}

(async () => {
  const inv = await postInvocation();
  // fake merkleRoot/reportCID for demo
  const att = await mintAttestation('0xdeadbeef', 'cid:QmReport', 67);
  console.log('Attestation minted', att);
})();
```

### Durable Object method to call MCP (paste into `SimpleAgent`)

```ts
// inside a Durable Object or SimpleAgent method
async function callMCP(env: Env, envelope: any, capabilityToken?: string) {
  const mcpUrl = env.MCP_PUBLIC_URL || 'https://mcp.example.com';
  const headers: Record<string,string> = {
    'Content-Type': 'application/json'
  };
  if (capabilityToken) headers['x-capability-token'] = capabilityToken;
  const res = await fetch(`${mcpUrl}/mcp/tool/invoke`, {
    method: 'POST',
    headers,
    body: JSON.stringify(envelope)
  });
  if (!res.ok) throw new Error(`MCP call failed ${res.status}`);
  return await res.json();
}
```

---

## Attestation flow & Smart contract interface

### Attestor responsibilities

* Build AuditBundle JSON (includes invocation/response envelopes, compute receipts).
* Create leaf per finding (e.g. `sha256(JSON.stringify(findingEnvelope))`).
* Build Merkle tree, get `merkleRoot`.
* Pin AuditBundle to IPFS/Arweave → `reportCID`.
* Call `mint_attestation` MCP tool with `{ merkleRoot, reportCID, score, signer }`.
* Optionally call `AttestationAnchor.anchor(merkleRoot, blockNumber, signerSigs)` on the L1 contract.

### Minimal Solidity interface (example)

```solidity
// contracts/AttestationAnchor.sol (interface)
pragma solidity ^0.8.18;

interface IAttestationAnchor {
    event Anchored(bytes32 root, uint256 anchorId, uint256 blockNumber);
    function anchor(bytes32 merkleRoot, uint256 blockNumber, bytes calldata signerSigs) external returns (uint256 anchorId);
    function getAnchor(uint256 anchorId) external view returns (bytes32 root, uint256 blockNumber, bytes memory signerSigs);
}
```

> The repo includes a fuller `AttestationAnchor.sol` under `contracts/` with access control (governance-only anchoring), and an example truffle/hardhat deployment script in `scripts/deploy-attestation.js`.

---

## Analytics, monitoring & billing (Stripe)

* The system writes metrics to an analytics dataset (time-series): `agent_metrics`, `billing_events`, `user_satisfaction`.
* Key metrics: `processing_time_ms`, `tokens_consumed`, `compute_cost`, `success` flag.
* Usage-based billing pattern:

  1. Write usage event per run with `base_cost` / `tokens`.
  2. Aggregate per billing cycle and push to Stripe as metered usage (Stripe Billing `usage_records` or `usage-based` plan).
  3. Use Stripe webhooks (e.g., `invoice.paid`) to unlock features.
* Example server-side usage call (Node):

```js
// pseudo
await analytics.writeDataPoint('billing_events', {
  dimensions: { userId: 'u123', plan: 'pro' },
  metrics: { tokens: 123, cost: 0.54 }
});
// later push to Stripe billing via usage_records
```

**Lovable tip:** If hosting on Lovable, use its Stripe integration to scaffold checkout + webhooks and store keys in Lovable Secrets.

---

## CI / CD (example GitHub Actions)

`.github/workflows/ci.yml` skeleton:

```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm test
  build-and-publish:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run build
      # optionally push Docker image
      - name: Login to Docker
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKERHUB_USER }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}
      - name: Build & Push
        run: |
          docker build -t myorg/deleteee:${{ github.sha }} .
          docker push myorg/deleteee:${{ github.sha }}
```

Also provide a `release` job that deploys `AttestationAnchor` via `hardhat` using `PRIVATE_KEY` secret.

---

## Testing and verification

* Unit tests for envelopes, merkle builder, normalizer and consensus agents under `test/`.
* Integration tests:

  * Run a sample repo scan against a canned semgrep descriptor.
  * Verify `AuditBundle` creation, merkle root consistency.
  * Call `mint_attestation` mock MCP endpoint and assert returned `attestationId`.
* Suggested commands:

```bash
npm run test            # run unit tests
npm run test:integration
npm run lint
```

---

## Security & Ops checklist

* **Secrets**: Keep provider keys, Stripe keys, KMS keys in secure secrets manager.
* **Capability tokens**: Use short TTL tokens (macaroons/JWT), least-privilege scopes for tools.
* **Prompt provenance**: Store `prompt_template_id` and anchor templates to prevent prompt-injection drift.
* **KMS**: Sign attestation roots with hardware-backed keys (HSM/KMS) + rotate keys quarterly.
* **Circuit-breakers**: Implement cost & divergence thresholds — pause runs and create HITL tickets.
* **Audits**: At least two independent audits for contract + attestor flows before production.
* **Monitoring**: Track latencies, token counts, error rates and set alerts (e.g. Slack, PagerDuty).

---

## Contributing

Contributions welcome — please open issues describing bugs or feature requests. When submitting PRs:

* Follow repo linting rules.
* Add unit tests.
* Update `README.md` if you add public APIs or env vars.

**Developer workflow**:

```bash
git checkout -b feat/your-feature
# implement
npm test
npm run lint
git commit -m "feat: ..." && git push origin feat/your-feature
# open PR
```

---

## License

MIT © NullAudit / Lucy Low (refer to `LICENSE` file).

---

## Appendix — Useful snippets

### Envelope helpers (TypeScript)

```ts
// src/utils/envelopes.ts
export type InvocationEnvelope = {
  id: string;
  caller: string;
  tool_id: string;
  action: string;
  prompt_template_id?: string;
  input_hash?: string;
  evidence_refs?: string[];
  inputs?: any;
  capability_token?: string;
  ts: number;
};
export function makeInvocation(input: Partial<InvocationEnvelope>): InvocationEnvelope {
  return { id: crypto.randomUUID(), ts: Date.now(), caller: 'cli', ...input } as InvocationEnvelope;
}
```

### Merkle generator (node)

```js
// scripts/merkle-gen.js (simplified)
import { sha256 } from 'js-sha256';
export function buildLeaves(items) {
  return items.map(it => sha256(JSON.stringify(it)));
}
export function buildRoot(leaves) {
  if (leaves.length === 0) return null;
  while (leaves.length > 1) {
    const next = [];
    for (let i=0;i<leaves.length;i+=2) {
      const a = leaves[i];
      const b = leaves[i+1] || a;
      next.push(sha256(a + b));
    }
    leaves = next;
  }
  return `0x${leaves[0]}`;
}
```

-
