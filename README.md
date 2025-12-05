<p align="center">
  <img src="client/public/images/nullaudit-banner.png" alt="NullAudit Banner" width="100%"/>
</p>

<h1 align="center">NullAudit</h1>

<p align="center">
  <strong>Deterministic, attested AI audits & agent orchestration</strong>
</p>

<p align="center">
  <a href="#features"><img src="https://img.shields.io/badge/AI_Powered-Multi_LLM-00d4ff?style=for-the-badge&logo=openai&logoColor=white" alt="AI Powered"/></a>
  <a href="#architecture"><img src="https://img.shields.io/badge/Web3-Attestation-8b5cf6?style=for-the-badge&logo=ethereum&logoColor=white" alt="Web3"/></a>
  <a href="#quickstart"><img src="https://img.shields.io/badge/Edge-Ready-10b981?style=for-the-badge&logo=cloudflare&logoColor=white" alt="Edge Ready"/></a>
  <a href="#license"><img src="https://img.shields.io/badge/License-MIT-f59e0b?style=for-the-badge" alt="License"/></a>
</p>

<p align="center">
  Multi-LLM agent pipeline with canonical envelopes, attestation anchoring, MCP tooling, and optional on-chain verification.<br/>
  Reproducible AI-driven audits with auditable outputs and Web3 attestation.
</p>

---

## Dashboard Preview

<p align="center">
  <img src="client/public/images/dashboard-preview.png" alt="NullAudit Dashboard" width="100%" style="border-radius: 8px;"/>
</p>

---

## Features

| Feature | Description |
|---------|-------------|
| 🔒 **Deterministic Audits** | Canonicalizes inputs into reproducible `input_hash` |
| 🤖 **Multi-LLM Ensemble** | Runs multiple AI models for consensus-based findings |
| ⛓️ **On-Chain Attestation** | Merkleized findings anchored to blockchain |
| 🔧 **MCP Tooling** | Model Context Protocol integration for tool orchestration |
| 👥 **Human-in-the-Loop** | HITL gating for critical decisions |
| 📊 **Security Scoring** | Automated severity classification and scoring |

---

## Table of Contents

- [Architecture](#architecture-high-level)
- [Core Concepts](#core-concepts--data-contracts)
- [Repository Layout](#repository-layout)
- [Quickstart](#quickstart--local-development)
- [Deployment](#run-on-lovable--supabase--workers)
- [MCP Integration](#mcp--durable-object-integration)
- [Attestation Flow](#attestation-flow--smart-contract-interface)
- [Analytics & Billing](#analytics-monitoring--billing-stripe)
- [CI/CD](#ci--cd-example-github-actions)
- [Testing](#testing-and-verification)
- [Security](#security--ops-checklist)
- [Contributing](#contributing)
- [License](#license)

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

```json
{
  "report_id": "uuid",
  "score": 67,
  "severity_vector": { "reentrancy": 0.8, "access_control": 0.2 },
  "evidence_weight": 0.85,
  "leaf_refs": ["cid:...", "cid:..."]
}
```

---

## Repository layout

```
/
├─ contracts/                   # Solidity attestation contract(s)
│  ├─ AttestationAnchor.sol
│  └─ NullshotCore.sol
├─ client/                      # Frontend React application
│  ├─ src/
│  │  ├─ components/            # UI components
│  │  ├─ pages/                 # Page components
│  │  └─ contexts/              # React contexts
├─ server/                      # Backend Express server
│  ├─ routes/                   # API routes
│  ├─ services/                 # Business logic
│  └─ middleware/               # Express middleware
├─ shared/                      # Shared types and utilities
├─ supabase/                    # Supabase configuration
└─ README.md
```

---

## Quickstart — Local development

> **Prerequisites:** Node >=18, npm/pnpm

### 1. Clone & Install

```bash
git clone https://github.com/lucylow/arbita-blank-canvas.git
cd arbita-blank-canvas
npm install
```

### 2. Environment Setup

Create `.env.local`:

```env
# AI provider
AI_PROVIDER=openai
AI_PROVIDER_API_KEY=sk-...

# MCP
MCP_SERVER_URL=http://localhost:3000

# Optional: Stripe
STRIPE_SECRET_KEY=sk_live_...
```

### 3. Run Development Server

```bash
npm run dev
```

---

## Run on Lovable / Supabase / Workers

This repo is architected for edge platforms:

- **Lovable Cloud**: Full-stack deployment with Supabase backend
- **Cloudflare Workers**: Durable Objects for session & MCP servers
- **Docker**: Containerized deployment option

**Configuration Notes:**

- Store API keys in environment secrets
- Configure bindings for `ANALYTICS`, `MEMORY_STORE`, and `STREAM`

---

## MCP & Durable Object integration

### Demo Client Example

```js
import fetch from 'node-fetch';
import crypto from 'crypto';

const MCP_URL = process.env.MCP_SERVER_URL || 'http://localhost:3000';

async function mintAttestation(merkleRoot, reportCID, score) {
  const body = { merkleRoot, reportCID, score, signer: 'demo-signer' };
  const res = await fetch(`${MCP_URL}/mcp/tool/mint_attestation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return res.json();
}
```

---

## Attestation flow & Smart contract interface

### Attestor Workflow

1. Build AuditBundle JSON
2. Create leaf per finding: `sha256(JSON.stringify(findingEnvelope))`
3. Build Merkle tree → `merkleRoot`
4. Pin AuditBundle to IPFS/Arweave → `reportCID`
5. Call `mint_attestation` MCP tool
6. Optionally anchor on-chain via `AttestationAnchor.sol`

### Solidity Interface

```solidity
interface IAttestationAnchor {
    event Anchored(bytes32 root, uint256 anchorId, uint256 blockNumber);
    function anchor(bytes32 merkleRoot, uint256 blockNumber, bytes calldata signerSigs) external returns (uint256 anchorId);
    function getAnchor(uint256 anchorId) external view returns (bytes32 root, uint256 blockNumber, bytes memory signerSigs);
}
```

---

## Analytics, monitoring & billing (Stripe)

- Time-series metrics: `agent_metrics`, `billing_events`, `user_satisfaction`
- Key metrics: `processing_time_ms`, `tokens_consumed`, `compute_cost`
- Usage-based billing via Stripe metered subscriptions

---

## CI / CD (example GitHub Actions)

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
```
NullAudit — Technical README
NullAudit — Multi-LLM Security & Evaluation Agent
 The Security Layer for NullShot’s Agentic Economy
This README is a complete, implementation-oriented guide for NullAudit. It includes architecture diagrams, data schemas, API examples, smart contract interfaces, deployment steps, CI recipes, testing guidance (including adversarial tests), monitoring, governance hooks, and recommended production parameters. Treat this as the canonical developer & operator reference for building, running, and contributing to NullAudit.

Table of contents
Project overview (tl;dr)


Quickstart — run locally


High-level architecture (diagrams)


Core components & responsibilities


Canonical data models & JSON schemas


Protocol flows (audit, attestation, graduation)


Smart contract interfaces (canonical)


CLI & SDK examples


Deployment (Docker, k8s) & environment


CI / GitHub Actions example (audit as pre-merge gate)


Testing & adversarial scenarios


Monitoring, metrics, and SLAs


Security considerations and operational best practices


Governance, parameters & on-chain interactions


Contributing


License & acknowledgements



Project overview (tl;dr)
NullAudit converts code / contracts / agent artifacts into deterministic, auditable security reports using:
deterministic static tools (Semgrep, Slither),


a multi-LLM ensemble (cloud + on-prem + specialized) via the MCP (Model & Capability Provider) framework, and


a Security & Evaluation Agent (SEA) that builds canonical findings, computes a normalized SecurityScore (0–100), produces a Merkleized AuditBundle, and anchors attestations on XAVA L1 (or other supported chains).


Outputs:
Human readable report, machine JSON (AuditBundle), and an on-chain Attestation (attestationId) used for launch gating (canGraduate) and settlement.


Goals: reproducibility, tamper evidence, multi-model triangulation, governance-adjustable thresholds.

Quickstart — run locally
This quickstart sets up a minimal local environment for experimentation: a simple orchestrator, a local mock MCP provider, Semgrep scans, and a simulated AttestationAnchor (local dev Ethereum node).
Requirements
Node.js >= 18, npm/yarn


Python 3.10+ (for some scanner wrappers)


Docker & docker-compose


Hardhat or Ganache for local EVM dev (we use Hardhat in examples)


Clone & install
git clone https://github.com/<your-org>/nullaudit.git
cd nullaudit
# Install orchestrator / workers
cd services/orchestrator && npm install
cd ../sea && npm install
cd ../mcp-mock && npm install

ENV (example .env.local)
# orchestrator
ORCH_HOST=0.0.0.0
ORCH_PORT=4000
XAVA_RPC=http://localhost:8545
ATTESTATION_CONTRACT=0xAaAa...  # deployed local contract
SEA_SIGNER_PRIVATE_KEY=0xabc...
MCP_REGISTRY_URL=http://localhost:5001/registry
CACHE_DIR=./cache

Start local chain (Hardhat)
# from project root
docker-compose -f dev/docker-compose.yml up --build
# (or run `npx hardhat node` in evm node directory)

Deploy local AttestationAnchor (sample Hardhat task)
cd contracts
npx hardhat run scripts/deploy-attestation-anchor.js --network localhost
# output: AttestationAnchor at 0x...

Run services
# from services/
# start mock MCP provider
cd mcp-mock && npm run start

# start SEA (scanner + aggregator)
cd ../sea && npm run dev

# start orchestrator API
cd ../orchestrator && npm run dev

Run a sample audit (curl)
curl -X POST http://localhost:4000/api/v1/audit \
  -H "Content-Type: application/json" \
  -d '{
    "repo_url":"https://github.com/example/vulnerable-contract",
    "commit":"main",
    "entry":"contracts/MyToken.sol",
    "options": {"deepScan": false}
  }'

Expected result: orchestrator returns job id, you can GET /api/v1/audit/:id to stream progress and final AuditBundle CID + attestationRef after anchor.

High-level architecture (diagrams)
Below are the canonical diagrams. Use Mermaid to render locally in README previewers that support it.
System overview (Mermaid)
flowchart LR
  subgraph CLIENTS
    UI[UI / SDK / CLI]
    AGENT[NullShot Agents]
  end

  UI --> ORCH[Orchestrator / Supervisor]
  AGENT --> ORCH

  ORCH --> MCP[MCP Framework (Provider Registry)]
  ORCH --> SEA[Security & Evaluation Agent]
  ORCH --> STORE[Off-chain Storage (IPFS / S3)]
  SEA --> SCANNERS[Static Tools (Semgrep/Slither/Fuzzers)]
  SEA --> MCP
  SEA --> STORE
  SEA --> ATT[AttestationAnchor (XAVA L1)]
  ATT --> CHAIN[XAVA L1]
  ORCH --> SETTLE[SettlementRouter (XAVA L1)]
  SETTLE --> RELAY[Relayer Network]
  RELAY --> HUB[Hub Chains / Omnichain]

  STORE -.-> UI
  CHAIN -.-> HUB

Audit flow (sequence)
sequenceDiagram
  participant User
  participant Orchestrator
  participant Scanner
  participant MCPProviders
  participant ConsensusEngine
  participant SEA
  participant IPFS
  participant AttestationAnchor (XAVA)
  User->>Orchestrator: Submit audit job
  Orchestrator->>Scanner: Run Semgrep/Slither
  Scanner-->>Orchestrator: evidence_refs (CID)
  Orchestrator->>MCPProviders: parallel invocations (InvocationEnvelope)
  MCPProviders-->>Orchestrator: ResponseEnvelope (signed)
  Orchestrator->>ConsensusEngine: collate responses
  ConsensusEngine-->>Orchestrator: canonical findings + scores
  Orchestrator->>IPFS: store AuditBundle
  IPFS-->>Orchestrator: bundleCID
  Orchestrator->>SEA: create attestation payload
  SEA->>AttestationAnchor: anchor(merkleRoot, ts, sigs)
  AttestationAnchor-->>Orchestrator: anchorId
  Orchestrator-->>User: audit report + attestationRef


Core components & responsibilities
Orchestrator / Supervisor
Accepts audit jobs, manages sessions, composes InvocationEnvelopes, manages capability tokens, tracks job progress, and collects responses.


Responsibilities:


Job queue (Redis / BullMQ)


Parallel provider invocations


Provenance bundling


Compute receipts forwarding to FeeDistributor


Persistence to off-chain storage (IPFS / S3)


Expose HTTP/GraphQL API and SDK


Security & Evaluation Agent (SEA)
Runs deterministic scanners, aggregates model outputs, constructs consensus, computes SecurityScore, builds AuditBundle, signs attestation payloads, and calls AttestationAnchor.


Subcomponents:


Scanner layer (Semgrep, Slither, fuzzing orchestrator)


Ensemble adapter (MCP client)


Consensus & correlation engine (fingerprinting, grouping, weighted aggregation)


Scoring engine (CS → EW → Exposure → S)


Attestor: Merkle tree builder + signer keyset / BLS aggregated signature manager


MCP Framework
Provider Registry (on-chain minimal + off-chain descriptor store)


Tool Descriptor (TD) spec (prompt templates, schemas, cost model)


Invocation & Response envelope schemas (EIP-712 style)


Cache & replay layer for deterministic prompts


Tool Registry & Scanner Agents
Semgrep ruleset packages, scanner configuration, dynamic test harnesses


Rule versioning & provenance metadata


Storage & Event/Mem Fabric
IPFS/Arweave for AuditBundles


Vector DB (e.g., Milvus, Pinecone) for semantic retrieval (RAG)


Event log (append-only) with periodic Merkle anchors on XAVA L1


On-chain primitives
AttestationAnchor — stores Merkle roots and signer signatures


Registry — provider & tool listings


SettlementRouter — posts settlementIntents and finalizes with relayerProofs


CommitmentVault (for launches) — holds collateral & conviction logic



Canonical data models & JSON schemas
Below are the canonical JSON schemas used across the system.
InvocationEnvelope (EIP-712 typed)
{
  "tool_id":"mcp://auditor/semgrep-v1",
  "caller":"orchestrator-0xabc",
  "prompt_template_id":"ipfs://QmTemplateHash",
  "inputs": {"code":"..."},
  "input_hash":"0xabc123...",
  "invocation_nonce":"0xdeadbeef",
  "timestamp": 1710000000,
  "signature":"0x..."
}

ResponseEnvelope (provider response)
{
  "tool_id":"mcp://model/gpt4-code",
  "invocation_id":"inv-0x456",
  "structured_output": {
    "findings":[
      {
        "finding_id":"f-0xabc",
        "fingerprint":"0xdef...",
        "category":"reentrancy",
        "summary":"Possible reentrancy in X function",
        "confidence":0.91,
        "suggested_patch":"code diff..."
      }
    ]
  },
  "evidence_refs":["ipfs://QmEvidence1"],
  "compute_receipt":{"units":200,"unit_price_xava":0.002,"total_cost":0.4},
  "storage_ref":"ipfs://QmProviderTranscript",
  "timestamp":1710000030,
  "signature":"0x..."
}

AuditBundle (stored to IPFS)
{
  "spec_hash":"0x....",
  "repo":"https://github.com/foo/bar",
  "commit":"abc123",
  "findings":[ ... ],
  "provenance":[
    {"type":"responseEnvelope","cid":"ipfs://Qm..."},
    {"type":"scannerEvidence","cid":"ipfs://Qm..."}
  ],
  "merkleLeaves":[ "0xleaf1", "0xleaf2" ],
  "merkleRoot":"0xroot...",
  "created_at":1710000100
}

AttestationPayload (anchored on chain)
{
  "merkleRoot":"0xroot...",
  "bundleCID":"ipfs://QmBundle",
  "auditTimestamp":1710000123,
  "signerIds":["sea-0x1","sea-0x2"],
  "aggregatedSignature":"0x..."
}

Full JSON Schema files live under /schemas/ in the repo (invocation.schema.json, response.schema.json, audit.schema.json).

Protocol flows (audit, attestation, graduation)
1) Audit run (detailed steps)
User submits job → Orchestrator assigns jobId.


Orchestrator runs deterministic scanners; produce evidence_refs.


Compose InvocationEnvelope per provider + sign; conduct parallel calls.


Collect ResponseEnvelopes; verify provider signatures and schema.


Group & correlate findings (fingerprint + LSH fuzzy grouping).


Compute CS and S as per scoring pipeline.


Persist AuditBundle to IPFS; compute Merkle root over canonical finding payloads.


SEA signs AttestationPayload; call AttestationAnchor.anchor.


Return reportURL, bundleCID, attestationId to user.


2) Graduating a launch (canary → omnichain)
LaunchContract requires attestationId to proceed to graduate().


canGraduate(attestationId) calls SecurityOracle.getScore(attestationId) or reads on-chain attestation metadata.


If S >= S_min and anchor_fresh & signer_quorum satisfied → graduate() proceeds; otherwise blocked.


Upon graduation, SettlementRouter posts settlement intents for bridging; relayers verify attestation before minting wTOKEN.



Smart contract interfaces (canonical)
AttestationAnchor (Solidity)
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface IAttestationAnchor {
    event Anchored(uint256 indexed anchorId, bytes32 merkleRoot, uint256 auditTimestamp, address indexed submitter);

    function anchor(bytes32 merkleRoot, uint256 auditTimestamp, bytes calldata aggregatedSig) external returns (uint256);
    function getAnchor(uint256 anchorId) external view returns (bytes32 merkleRoot, uint256 auditTimestamp, address submitter);
}

CommitmentVault (for launches)
interface ICommitmentVault {
  event Committed(address indexed participant, uint256 commitId, uint256 amount, uint256 lockUntil);
  function commit(bytes32 commitmentHash) external payable returns (uint256 commitId);
  function reveal(uint256 commitId, uint256 amount, bytes32 nonce) external;
  function finalize() external;
  function claimAllocation(uint256 commitId) external;
  function refund(uint256 commitId) external;
}

SettlementRouter (simplified)
interface ISettlementRouter {
  event SettlementIntentPosted(bytes32 intentId, address indexed sender, uint256 amount, uint256 destChainId);
  function postSettlementIntent(bytes calldata intent) external returns (bytes32 intentId);
  function finalizeSettlement(bytes calldata relayerProof) external;
}

(Full contracts and tests live under /contracts/.)

CLI & SDK examples
Node.js SDK (example)
import { NullAuditClient } from "@nullaudit/sdk";

const client = new NullAuditClient({ baseUrl: process.env.ORCH_URL, apiKey: process.env.NA_API_KEY });

const job = await client.createAudit({
  repo: "https://github.com/example/vulnerable-contract",
  entry: "contracts/MyToken.sol",
  deepScan: true
});

console.log("Job ID:", job.id);

const res = await client.waitForJob(job.id, { timeout: 600000 });
console.log("Audit complete:", res.reportUrl, res.attestationId);

CLI (example)
# using curl
curl -X POST $ORCH_URL/api/v1/audit -H 'Authorization: Bearer $API_KEY' \
  -d '{"repo":"https://github.com/foo/bar","entry":"contracts/X.sol","options":{"deepScan":true}}'

SDK (TypeScript) and Python client live in /sdk/js and /sdk/py.

Deployment (Docker, k8s) & environment
Microservices layout
orchestrator (Node.js, Express) — REST/GraphQL API, job queue.


sea (Node.js/Python) — scanner orchestrator, consensus engine.


mcp-proxy (Node.js) — orchestrates calls to external LLM providers.


mcp-mock — local test provider (for CI).


storage — IPFS node or S3-compatible service.


db — Postgres for job meta, Redis for queue.


vector-db — Milvus or Pinecone for RAG indexing.


Docker Compose (dev)
dev/docker-compose.yml includes services for db, redis, ipfs, orchestrator, sea, mcp-mock, hardhat.
Kubernetes (production) recommendations
Each service deployed as separate Deployment + HPA


Use PersistentVolumes for cache/keys


Secrets via K8s secrets or HashiCorp Vault


Service mesh (optional) for telemetry and mTLS


Use CronJob for periodic anchoring & registry snapshots


Environment variables (partial)
# Orchestrator
ORCH_PORT=4000
DB_URL=postgres://nullaudit:pass@db:5432/nullaudit
REDIS_URL=redis://redis:6379
IPFS_API=http://ipfs:5001
XAVA_RPC=https://rpc.xava.local
ATTESTATION_ADDRESS=0x...
SEA_SIGNER_PRIVATE_KEY=0x...
MCP_REGISTRY_URL=https://registry.nullaudit.local


CI / GitHub Actions example (audit as pre-merge gate)
Add workflow: .github/workflows/audit.yml to block PRs that fail NullAudit.
name: NullAudit premerge
on: [pull_request]

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run static checks
        run: npm ci && npm run lint
      - name: Submit to NullAudit (local or hosted)
        run: |
          JOB=$(curl -X POST http://nullaudit.local/api/v1/audit -H "Authorization: Bearer $NA_KEY" \
            -d '{"repo":"'$GITHUB_SERVER_URL'/'$GITHUB_REPOSITORY'","commit":"'$GITHUB_SHA'","entry":"contracts/*.sol"}')
          echo "Job: $JOB"
      - name: Wait for audit
        run: |
          # poll the orchestrator for job status...
          # if SecurityScore < threshold -> fail

This allows CI to block merges until SecurityScore >= threshold.

Testing & adversarial scenarios
Testing is essential. Include unit tests, integration tests, and adversarial scenarios.
Unit tests
Validate schema parsers (invocation / response / bundle)


Test consensus aggregation math with synthetic models


Mock provider signature verification


Integration tests
Run local Hardhat chain; deploy AttestationAnchor and SettlementRouter.


Start mcp-mock and sea integration; run a full audit end-to-end and assert anchorId created and canGraduate semantics as expected.


Adversarial tests (recommended)
Prompt injection: craft LLM inputs containing malicious instructions; assert SEA reduces weight of uncorroborated model outputs and flags.


Provider compromise: mock a provider that returns fabricated ResponseEnvelopes (with invalid evidence_refs); ensure signature verification & registry bonding prevent acceptance for high-severity actions.


Replay / tampering: mutate AuditBundle off-chain and verify merkle proof fails.


DOS / cost attack: script large numbers of audit requests; assert rate limits & quota enforcement.


Relayer fraud simulation: simulate incorrect relayer proof and assert SettlementRouter handles challenge & slashing correctly.


Example test harness tests/integration/test_audit_flow.js uses mocha + chai.

Monitoring, metrics, and SLAs
Key metrics to expose:
audit.job.latency.p50/p95 (seconds)


audit.cost.avg (XAVA)


model.disagreement.rate (fraction of findings with > X variance)


scanner.coverage (percentage of rules executed)


attestation.anchor.latency (time between audit completion and anchor TX)


relayer.finalization.latency


Use Prometheus + Grafana:
Instrument Orchestrator and SEA with Prometheus metrics.


Alerts:


audit.latency.p95 > 10m → page ops


model.disagreement > 0.4 → model roster review


attestation.fail_rate > 0.01 → inspect signer keys


SLAs:
Quick scan: p50 < 30s, p95 < 60s


Standard scan: p50 3–6min, p95 10–15min


Attestation finalization: anchor TX inclusion within 1–5min (depending on chain)



Security considerations & operational best practices
Key management: Use threshold signing (BLS / Gnosis Safe) for SEA signers; rotate keys regularly and publish rotations.


Provider registry bonding: require economic bonds for high-risk providers; implement slashing when misbehavior detected.


Immutable evidence: push scanner outputs & provider transcripts to IPFS to ensure immutability; anchor Merkle roots frequently.


Privacy modes: support encrypted AuditBundles where only merkle root is public and payload requires authorized decryption.


Least privilege: capability tokens must be scoped and time-bound for side effects (on-chain writes, minting).


Monitoring & canarying: roll out new provider integrations or consensus threshold changes gradually using canary deployments and a small test corpus.


Mitigate DOS: rate limiting, CAPTCHAs on UI, and quotas for compute.



Governance, parameters & on-chain interactions
Key governance variables (should be adjustable via DAO):
S_min (SecurityScore threshold for graduation): default 85


alpha (evidence weight per scanner hit): default 0.10


H_cap (max scanner hit boost): default 5


relayer_bond_min: default 100,000 XAVA


attestation_challenge_window: default 12–72 hours depending on cross-chain finality


anchoring_cadence: default hourly


On-chain interactions:
AttestationAnchor receives anchor events.


Registry publishes provider information and tool descriptors (hash only on chain; content addressed off-chain).


SettlementRouter consumes attestationRef to validate before minting wrapped tokens or finalizing bridging.



Contributing
We welcome contributions — please follow the repo conventions.
Fork & clone.


Create a feature branch: git checkout -b feat/<short-desc>.


Run tests, linters: npm run test and npm run lint.


Open PR with description, design rationale, unit & integration tests, and add new schema files if needed.


All PRs must pass CI (unit + integration with mcp-mock and Hardhat local node).


For major feature changes (new provider class, scoring changes), include an ADR (architecture decision record) under /docs/adr/.


Coding style:
Node services use ESLint + Prettier.


Smart contracts follow OpenZeppelin styles; use Solhint for linting.



License & acknowledgements
NullAudit is released under the Apache-2.0 license. See LICENSE for details.
Acknowledgements: many concepts in this project borrow from best practices in on-chain attestation systems, LLM orchestration frameworks, and multi-party security architectures. Credit to the NullShot team, MCP authors, and oss communities for Semgrep, Slither, Hardhat, and IPFS.

Appendix — useful snippets
Compute / scoring pseudocode
def compute_S(models, scanner_hits, exposure, alpha=0.1, H_cap=5):
    # models: list of tuples (confidence, weight)
    W_sum = sum(w for _, w in models)
    ac_sum = sum(conf * w for conf, w in models)
    CS = ac_sum / W_sum if W_sum > 0 else 0.0
    EW = 1.0 + alpha * min(scanner_hits, H_cap)
    raw = CS * EW * exposure
    S = round(100 * min(raw, 1.0))
    return S

Verify attestation (python)
def verify_attestation(attestation_record, payload_hash, merkle_proof, signer_keys):
    # 1. check timestamp freshness
    if time.time() - attestation_record['auditTimestamp'] > T_FRESH:
        return False
    # 2. verify aggregator signature (BLS/multisig)
    if not verify_aggregated_attestor_sig(attestation_record['aggregatedSig'], attestation_record['merkleRoot'], signer_keys):
        return False
    # 3. verify merkle proof
    if not verify_merkle_proof(payload_hash, merkle_proof, attestation_record['merkleRoot']):
        return False
    return True


If you’d like I can:
Generate a ready-to-paste docker-compose.dev.yml and Kubernetes manifests (Helm charts) for production & staging,


Produce a full ADR and versioned parameter proposal for governance, or


Implement a sample AuditBundle verifier script (Node.js / Python) that fetches the IPFS bundle and validates merkle proofs + signatures end-to-end.


Which one do you want next?


---

## Testing and verification

```bash
npm run test            # Unit tests
npm run test:integration
npm run lint
```

---

## Security & Ops checklist

- ✅ Secrets in secure managers (never in code)
- ✅ Short TTL capability tokens with least-privilege
- ✅ Prompt templates versioned and anchored
- ✅ HSM/KMS for attestation signing
- ✅ Circuit-breakers for cost thresholds
- ✅ Two independent audits before production

---

## Contributing

Contributions welcome! Please:

1. Follow repo linting rules
2. Add unit tests
3. Update README for public API changes

```bash
git checkout -b feat/your-feature
npm test && npm run lint
git commit -m "feat: ..." && git push
```

---

## License

MIT © NullAudit / Lucy Low

---

<p align="center">
  <sub>Built with ❤️ using React, TypeScript, and Web3</sub>
</p>
