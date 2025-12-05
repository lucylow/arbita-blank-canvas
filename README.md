**NullAudit — Technical README**
================================

**NullAudit** — Multi-LLM Security & Evaluation Agent _The Security Layer for NullShot’s Agentic Economy_

This README is a complete, implementation-oriented guide for NullAudit. It includes architecture diagrams, data schemas, API examples, smart contract interfaces, deployment steps, CI recipes, testing guidance (including adversarial tests), monitoring, governance hooks, and recommended production parameters. Treat this as the canonical developer & operator reference for building, running, and contributing to NullAudit.

**Table of contents**
---------------------

1.  [Project overview (tl;dr)](https://chatgpt.com/c/692fa192-5a3c-8326-919d-302c9f303400#project-overview-tldr)
    
2.  [Quickstart — run locally](https://chatgpt.com/c/692fa192-5a3c-8326-919d-302c9f303400#quickstart--run-locally)
    
3.  [High-level architecture (diagrams)](https://chatgpt.com/c/692fa192-5a3c-8326-919d-302c9f303400#high-level-architecture-diagrams)
    
4.  [Core components & responsibilities](https://chatgpt.com/c/692fa192-5a3c-8326-919d-302c9f303400#core-components--responsibilities)
    
5.  [Canonical data models & JSON schemas](https://chatgpt.com/c/692fa192-5a3c-8326-919d-302c9f303400#canonical-data-models--json-schemas)
    
6.  [Protocol flows (audit, attestation, graduation)](https://chatgpt.com/c/692fa192-5a3c-8326-919d-302c9f303400#protocol-flows-audit-attestation-graduation)
    
7.  [Smart contract interfaces (canonical)](https://chatgpt.com/c/692fa192-5a3c-8326-919d-302c9f303400#smart-contract-interfaces-canonical)
    
8.  [CLI & SDK examples](https://chatgpt.com/c/692fa192-5a3c-8326-919d-302c9f303400#cli--sdk-examples)
    
9.  [Deployment (Docker, k8s) & environment](https://chatgpt.com/c/692fa192-5a3c-8326-919d-302c9f303400#deployment-docker-k8s--environment)
    
10.  [CI / GitHub Actions example (audit as pre-merge gate)](https://chatgpt.com/c/692fa192-5a3c-8326-919d-302c9f303400#ci--github-actions-example-audit-as-pre-merge-gate)
    
11.  [Testing & adversarial scenarios](https://chatgpt.com/c/692fa192-5a3c-8326-919d-302c9f303400#testing--adversarial-scenarios)
    
12.  [Monitoring, metrics, and SLAs](https://chatgpt.com/c/692fa192-5a3c-8326-919d-302c9f303400#monitoring-metrics-and-slas)
    
13.  [Security considerations and operational best practices](https://chatgpt.com/c/692fa192-5a3c-8326-919d-302c9f303400#security-considerations-and-operational-best-practices)
    
14.  [Governance, parameters & on-chain interactions](https://chatgpt.com/c/692fa192-5a3c-8326-919d-302c9f303400#governance-parameters--on-chain-interactions)
    
15.  [Contributing](https://chatgpt.com/c/692fa192-5a3c-8326-919d-302c9f303400#contributing)
    
16.  [License & acknowledgements](https://chatgpt.com/c/692fa192-5a3c-8326-919d-302c9f303400#license--acknowledgements)
    

**Project overview (tl;dr)**
----------------------------

NullAudit converts code / contracts / agent artifacts into **deterministic, auditable security reports** using:

*   deterministic static tools (Semgrep, Slither),
    
*   a multi-LLM ensemble (cloud + on-prem + specialized) via the **MCP** (Model & Capability Provider) framework, and
    
*   a **Security & Evaluation Agent (SEA)** that builds canonical findings, computes a normalized SecurityScore (0–100), produces a Merkleized AuditBundle, and anchors attestations on XAVA L1 (or other supported chains).
    

Outputs:

*   Human readable report, machine JSON (AuditBundle), and an on-chain Attestation (attestationId) used for launch gating (canGraduate) and settlement.
    

Goals: reproducibility, tamper evidence, multi-model triangulation, governance-adjustable thresholds.

**Quickstart — run locally**
----------------------------

This quickstart sets up a minimal local environment for experimentation: a simple orchestrator, a local mock MCP provider, Semgrep scans, and a simulated AttestationAnchor (local dev Ethereum node).

### **Requirements**

*   Node.js >= 18, npm/yarn
    
*   Python 3.10+ (for some scanner wrappers)
    
*   Docker & docker-compose
    
*   Hardhat or Ganache for local EVM dev (we use Hardhat in examples)
    

### **Clone & install**

git clone https://github.com//nullaudit.git

cd nullaudit

\# Install orchestrator / workers

cd services/orchestrator && npm install

cd ../sea && npm install

cd ../mcp-mock && npm install

### **ENV (example .env.local)**

\# orchestrator

ORCH\_HOST=0.0.0.0

ORCH\_PORT=4000

XAVA\_RPC=http://localhost:8545

ATTESTATION\_CONTRACT=0xAaAa...  # deployed local contract

SEA\_SIGNER\_PRIVATE\_KEY=0xabc...

MCP\_REGISTRY\_URL=http://localhost:5001/registry

CACHE\_DIR=./cache

### **Start local chain (Hardhat)**

\# from project root

docker-compose -f dev/docker-compose.yml up --build

\# (or run \`npx hardhat node\` in evm node directory)

### **Deploy local AttestationAnchor (sample Hardhat task)**

cd contracts

npx hardhat run scripts/deploy-attestation-anchor.js --network localhost

\# output: AttestationAnchor at 0x...

### **Run services**

\# from services/

\# start mock MCP provider

cd mcp-mock && npm run start

\# start SEA (scanner + aggregator)

cd ../sea && npm run dev

\# start orchestrator API

cd ../orchestrator && npm run dev

### **Run a sample audit (curl)**

curl -X POST http://localhost:4000/api/v1/audit \\

  -H "Content-Type: application/json" \\

  -d '{

    "repo\_url":"https://github.com/example/vulnerable-contract",

    "commit":"main",

    "entry":"contracts/MyToken.sol",

    "options": {"deepScan": false}

  }'

Expected result: orchestrator returns job id, you can GET /api/v1/audit/:id to stream progress and final AuditBundle CID + attestationRef after anchor.

**High-level architecture (diagrams)**
--------------------------------------

Below are the canonical diagrams. Use Mermaid to render locally in README previewers that support it.

### **System overview (Mermaid)**

flowchart LR

  subgraph CLIENTS

    UI\[UI / SDK / CLI\]

    AGENT\[NullShot Agents\]

  end

  UI --> ORCH\[Orchestrator / Supervisor\]

  AGENT --> ORCH

  ORCH --> MCP\[MCP Framework (Provider Registry)\]

  ORCH --> SEA\[Security & Evaluation Agent\]

  ORCH --> STORE\[Off-chain Storage (IPFS / S3)\]

  SEA --> SCANNERS\[Static Tools (Semgrep/Slither/Fuzzers)\]

  SEA --> MCP

  SEA --> STORE

  SEA --> ATT\[AttestationAnchor (XAVA L1)\]

  ATT --> CHAIN\[XAVA L1\]

  ORCH --> SETTLE\[SettlementRouter (XAVA L1)\]

  SETTLE --> RELAY\[Relayer Network\]

  RELAY --> HUB\[Hub Chains / Omnichain\]

  STORE -.-> UI

  CHAIN -.-> HUB

### **Audit flow (sequence)**

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

  Scanner-->>Orchestrator: evidence\_refs (CID)

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

**Core components & responsibilities**
--------------------------------------

### **Orchestrator / Supervisor**

*   Accepts audit jobs, manages sessions, composes InvocationEnvelopes, manages capability tokens, tracks job progress, and collects responses.
    
*   Responsibilities:
    
    *   Job queue (Redis / BullMQ)
        
    *   Parallel provider invocations
        
    *   Provenance bundling
        
    *   Compute receipts forwarding to FeeDistributor
        
    *   Persistence to off-chain storage (IPFS / S3)
        
    *   Expose HTTP/GraphQL API and SDK
        

### **Security & Evaluation Agent (SEA)**

*   Runs deterministic scanners, aggregates model outputs, constructs consensus, computes SecurityScore, builds AuditBundle, signs attestation payloads, and calls AttestationAnchor.
    
*   Subcomponents:
    
    *   Scanner layer (Semgrep, Slither, fuzzing orchestrator)
        
    *   Ensemble adapter (MCP client)
        
    *   Consensus & correlation engine (fingerprinting, grouping, weighted aggregation)
        
    *   Scoring engine (CS → EW → Exposure → S)
        
    *   Attestor: Merkle tree builder + signer keyset / BLS aggregated signature manager
        

### **MCP Framework**

*   Provider Registry (on-chain minimal + off-chain descriptor store)
    
*   Tool Descriptor (TD) spec (prompt templates, schemas, cost model)
    
*   Invocation & Response envelope schemas (EIP-712 style)
    
*   Cache & replay layer for deterministic prompts
    

### **Tool Registry & Scanner Agents**

*   Semgrep ruleset packages, scanner configuration, dynamic test harnesses
    
*   Rule versioning & provenance metadata
    

### **Storage & Event/Mem Fabric**

*   IPFS/Arweave for AuditBundles
    
*   Vector DB (e.g., Milvus, Pinecone) for semantic retrieval (RAG)
    
*   Event log (append-only) with periodic Merkle anchors on XAVA L1
    

### **On-chain primitives**

*   AttestationAnchor — stores Merkle roots and signer signatures
    
*   Registry — provider & tool listings
    
*   SettlementRouter — posts settlementIntents and finalizes with relayerProofs
    
*   CommitmentVault (for launches) — holds collateral & conviction logic
    

**Canonical data models & JSON schemas**
----------------------------------------

Below are the canonical JSON schemas used across the system.

### **InvocationEnvelope (EIP-712 typed)**

{

  "tool\_id":"mcp://auditor/semgrep-v1",

  "caller":"orchestrator-0xabc",

  "prompt\_template\_id":"ipfs://QmTemplateHash",

  "inputs": {"code":"..."},

  "input\_hash":"0xabc123...",

  "invocation\_nonce":"0xdeadbeef",

  "timestamp": 1710000000,

  "signature":"0x..."

}

### **ResponseEnvelope (provider response)**

{

  "tool\_id":"mcp://model/gpt4-code",

  "invocation\_id":"inv-0x456",

  "structured\_output": {

    "findings":\[

      {

        "finding\_id":"f-0xabc",

        "fingerprint":"0xdef...",

        "category":"reentrancy",

        "summary":"Possible reentrancy in X function",

        "confidence":0.91,

        "suggested\_patch":"code diff..."

      }

    \]

  },

  "evidence\_refs":\["ipfs://QmEvidence1"\],

  "compute\_receipt":{"units":200,"unit\_price\_xava":0.002,"total\_cost":0.4},

  "storage\_ref":"ipfs://QmProviderTranscript",

  "timestamp":1710000030,

  "signature":"0x..."

}

### **AuditBundle (stored to IPFS)**

{

  "spec\_hash":"0x....",

  "repo":"https://github.com/foo/bar",

  "commit":"abc123",

  "findings":\[ ... \],

  "provenance":\[

    {"type":"responseEnvelope","cid":"ipfs://Qm..."},

    {"type":"scannerEvidence","cid":"ipfs://Qm..."}

  \],

  "merkleLeaves":\[ "0xleaf1", "0xleaf2" \],

  "merkleRoot":"0xroot...",

  "created\_at":1710000100

}

### **AttestationPayload (anchored on chain)**

{

  "merkleRoot":"0xroot...",

  "bundleCID":"ipfs://QmBundle",

  "auditTimestamp":1710000123,

  "signerIds":\["sea-0x1","sea-0x2"\],

  "aggregatedSignature":"0x..."

}

Full JSON Schema files live under /schemas/ in the repo (invocation.schema.json, response.schema.json, audit.schema.json).

**Protocol flows (audit, attestation, graduation)**
---------------------------------------------------

### **1) Audit run (detailed steps)**

1.  User submits job → Orchestrator assigns jobId.
    
2.  Orchestrator runs deterministic scanners; produce evidence\_refs.
    
3.  Compose InvocationEnvelope per provider + sign; conduct parallel calls.
    
4.  Collect ResponseEnvelopes; verify provider signatures and schema.
    
5.  Group & correlate findings (fingerprint + LSH fuzzy grouping).
    
6.  Compute CS and S as per scoring pipeline.
    
7.  Persist AuditBundle to IPFS; compute Merkle root over canonical finding payloads.
    
8.  SEA signs AttestationPayload; call AttestationAnchor.anchor.
    
9.  Return reportURL, bundleCID, attestationId to user.
    

### **2) Graduating a launch (canary → omnichain)**

1.  LaunchContract requires attestationId to proceed to graduate().
    
2.  canGraduate(attestationId) calls SecurityOracle.getScore(attestationId) or reads on-chain attestation metadata.
    
3.  If S >= S\_min and anchor\_fresh & signer\_quorum satisfied → graduate() proceeds; otherwise blocked.
    
4.  Upon graduation, SettlementRouter posts settlement intents for bridging; relayers verify attestation before minting wTOKEN.
    

**Smart contract interfaces (canonical)**
-----------------------------------------

### **AttestationAnchor (Solidity)**

// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

interface IAttestationAnchor {

    event Anchored(uint256 indexed anchorId, bytes32 merkleRoot, uint256 auditTimestamp, address indexed submitter);

    function anchor(bytes32 merkleRoot, uint256 auditTimestamp, bytes calldata aggregatedSig) external returns (uint256);

    function getAnchor(uint256 anchorId) external view returns (bytes32 merkleRoot, uint256 auditTimestamp, address submitter);

}

### **CommitmentVault (for launches)**

interface ICommitmentVault {

  event Committed(address indexed participant, uint256 commitId, uint256 amount, uint256 lockUntil);

  function commit(bytes32 commitmentHash) external payable returns (uint256 commitId);

  function reveal(uint256 commitId, uint256 amount, bytes32 nonce) external;

  function finalize() external;

  function claimAllocation(uint256 commitId) external;

  function refund(uint256 commitId) external;

}

### **SettlementRouter (simplified)**

interface ISettlementRouter {

  event SettlementIntentPosted(bytes32 intentId, address indexed sender, uint256 amount, uint256 destChainId);

  function postSettlementIntent(bytes calldata intent) external returns (bytes32 intentId);

  function finalizeSettlement(bytes calldata relayerProof) external;

}

(Full contracts and tests live under /contracts/.)

**CLI & SDK examples**
----------------------

### **Node.js SDK (example)**

import { NullAuditClient } from "@nullaudit/sdk";

const client = new NullAuditClient({ baseUrl: process.env.ORCH\_URL, apiKey: process.env.NA\_API\_KEY });

const job = await client.createAudit({

  repo: "https://github.com/example/vulnerable-contract",

  entry: "contracts/MyToken.sol",

  deepScan: true

});

console.log("Job ID:", job.id);

const res = await client.waitForJob(job.id, { timeout: 600000 });

console.log("Audit complete:", res.reportUrl, res.attestationId);

### **CLI (example)**

\# using curl

curl -X POST $ORCH\_URL/api/v1/audit -H 'Authorization: Bearer $API\_KEY' \\

  -d '{"repo":"https://github.com/foo/bar","entry":"contracts/X.sol","options":{"deepScan":true}}'

SDK (TypeScript) and Python client live in /sdk/js and /sdk/py.

**Deployment (Docker, k8s) & environment**
------------------------------------------

### **Microservices layout**

*   orchestrator (Node.js, Express) — REST/GraphQL API, job queue.
    
*   sea (Node.js/Python) — scanner orchestrator, consensus engine.
    
*   mcp-proxy (Node.js) — orchestrates calls to external LLM providers.
    
*   mcp-mock — local test provider (for CI).
    
*   storage — IPFS node or S3-compatible service.
    
*   db — Postgres for job meta, Redis for queue.
    
*   vector-db — Milvus or Pinecone for RAG indexing.
    

### **Docker Compose (dev)**

dev/docker-compose.yml includes services for db, redis, ipfs, orchestrator, sea, mcp-mock, hardhat.

### **Kubernetes (production) recommendations**

*   Each service deployed as separate Deployment + HPA
    
*   Use PersistentVolumes for cache/keys
    
*   Secrets via K8s secrets or HashiCorp Vault
    
*   Service mesh (optional) for telemetry and mTLS
    
*   Use CronJob for periodic anchoring & registry snapshots
    

### **Environment variables (partial)**

\# Orchestrator

ORCH\_PORT=4000

DB\_URL=postgres://nullaudit:pass@db:5432/nullaudit

REDIS\_URL=redis://redis:6379

IPFS\_API=http://ipfs:5001

XAVA\_RPC=https://rpc.xava.local

ATTESTATION\_ADDRESS=0x...

SEA\_SIGNER\_PRIVATE\_KEY=0x...

MCP\_REGISTRY\_URL=https://registry.nullaudit.local

**CI / GitHub Actions example (audit as pre-merge gate)**
---------------------------------------------------------

Add workflow: .github/workflows/audit.yml to block PRs that fail NullAudit.

name: NullAudit premerge

on: \[pull\_request\]

jobs:

  audit:

    runs-on: ubuntu-latest

    steps:

      - uses: actions/checkout@v4

      - name: Run static checks

        run: npm ci && npm run lint

      - name: Submit to NullAudit (local or hosted)

        run: |

          JOB=$(curl -X POST http://nullaudit.local/api/v1/audit -H "Authorization: Bearer $NA\_KEY" \\

            -d '{"repo":"'$GITHUB\_SERVER\_URL'/'$GITHUB\_REPOSITORY'","commit":"'$GITHUB\_SHA'","entry":"contracts/\*.sol"}')

          echo "Job: $JOB"

      - name: Wait for audit

        run: |

          # poll the orchestrator for job status...

          # if SecurityScore < threshold -> fail

This allows CI to block merges until SecurityScore >= threshold.

**Testing & adversarial scenarios**
-----------------------------------

Testing is essential. Include unit tests, integration tests, and adversarial scenarios.

### **Unit tests**

*   Validate schema parsers (invocation / response / bundle)
    
*   Test consensus aggregation math with synthetic models
    
*   Mock provider signature verification
    

### **Integration tests**

*   Run local Hardhat chain; deploy AttestationAnchor and SettlementRouter.
    
*   Start mcp-mock and sea integration; run a full audit end-to-end and assert anchorId created and canGraduate semantics as expected.
    

### **Adversarial tests (recommended)**

1.  **Prompt injection**: craft LLM inputs containing malicious instructions; assert SEA reduces weight of uncorroborated model outputs and flags.
    
2.  **Provider compromise**: mock a provider that returns fabricated ResponseEnvelopes (with invalid evidence\_refs); ensure signature verification & registry bonding prevent acceptance for high-severity actions.
    
3.  **Replay / tampering**: mutate AuditBundle off-chain and verify merkle proof fails.
    
4.  **DOS / cost attack**: script large numbers of audit requests; assert rate limits & quota enforcement.
    
5.  **Relayer fraud simulation**: simulate incorrect relayer proof and assert SettlementRouter handles challenge & slashing correctly.
    

Example test harness tests/integration/test\_audit\_flow.js uses mocha + chai.

**Monitoring, metrics, and SLAs**
---------------------------------

Key metrics to expose:

*   audit.job.latency.p50/p95 (seconds)
    
*   audit.cost.avg (XAVA)
    
*   model.disagreement.rate (fraction of findings with > X variance)
    
*   scanner.coverage (percentage of rules executed)
    
*   attestation.anchor.latency (time between audit completion and anchor TX)
    
*   relayer.finalization.latency
    

Use Prometheus + Grafana:

*   Instrument Orchestrator and SEA with Prometheus metrics.
    
*   Alerts:
    
    *   audit.latency.p95 > 10m → page ops
        
    *   model.disagreement > 0.4 → model roster review
        
    *   attestation.fail\_rate > 0.01 → inspect signer keys
        

SLAs:

*   Quick scan: p50 < 30s, p95 < 60s
    
*   Standard scan: p50 3–6min, p95 10–15min
    
*   Attestation finalization: anchor TX inclusion within 1–5min (depending on chain)
    

**Security considerations & operational best practices**
--------------------------------------------------------

*   **Key management**: Use threshold signing (BLS / Gnosis Safe) for SEA signers; rotate keys regularly and publish rotations.
    
*   **Provider registry bonding**: require economic bonds for high-risk providers; implement slashing when misbehavior detected.
    
*   **Immutable evidence**: push scanner outputs & provider transcripts to IPFS to ensure immutability; anchor Merkle roots frequently.
    
*   **Privacy modes**: support encrypted AuditBundles where only merkle root is public and payload requires authorized decryption.
    
*   **Least privilege**: capability tokens must be scoped and time-bound for side effects (on-chain writes, minting).
    
*   **Monitoring & canarying**: roll out new provider integrations or consensus threshold changes gradually using canary deployments and a small test corpus.
    
*   **Mitigate DOS**: rate limiting, CAPTCHAs on UI, and quotas for compute.
    

**Governance, parameters & on-chain interactions**
--------------------------------------------------

Key governance variables (should be adjustable via DAO):

*   S\_min (SecurityScore threshold for graduation): default 85
    
*   alpha (evidence weight per scanner hit): default 0.10
    
*   H\_cap (max scanner hit boost): default 5
    
*   relayer\_bond\_min: default 100,000 XAVA
    
*   attestation\_challenge\_window: default 12–72 hours depending on cross-chain finality
    
*   anchoring\_cadence: default hourly
    

On-chain interactions:

*   AttestationAnchor receives anchor events.
    
*   Registry publishes provider information and tool descriptors (hash only on chain; content addressed off-chain).
    
*   SettlementRouter consumes attestationRef to validate before minting wrapped tokens or finalizing bridging.
    

**Contributing**
----------------

We welcome contributions — please follow the repo conventions.

1.  Fork & clone.
    
2.  Create a feature branch: git checkout -b feat/.
    
3.  Run tests, linters: npm run test and npm run lint.
    
4.  Open PR with description, design rationale, unit & integration tests, and add new schema files if needed.
    
5.  All PRs must pass CI (unit + integration with mcp-mock and Hardhat local node).
    
6.  For major feature changes (new provider class, scoring changes), include an ADR (architecture decision record) under /docs/adr/.
    

Coding style:

*   Node services use ESLint + Prettier.
    
*   Smart contracts follow OpenZeppelin styles; use Solhint for linting.
    

**License & acknowledgements**
------------------------------

NullAudit is released under the **Apache-2.0** license. See LICENSE for details.

Acknowledgements: many concepts in this project borrow from best practices in on-chain attestation systems, LLM orchestration frameworks, and multi-party security architectures. Credit to the NullShot team, MCP authors, and oss communities for Semgrep, Slither, Hardhat, and IPFS.

**Appendix — useful snippets**
------------------------------

### **Compute / scoring pseudocode**

def compute\_S(models, scanner\_hits, exposure, alpha=0.1, H\_cap=5):

    # models: list of tuples (confidence, weight)

    W\_sum = sum(w for \_, w in models)

    ac\_sum = sum(conf \* w for conf, w in models)

    CS = ac\_sum / W\_sum if W\_sum > 0 else 0.0

    EW = 1.0 + alpha \* min(scanner\_hits, H\_cap)

    raw = CS \* EW \* exposure

    S = round(100 \* min(raw, 1.0))

    return S

### **Verify attestation (python)**

def verify\_attestation(attestation\_record, payload\_hash, merkle\_proof, signer\_keys):

    # 1. check timestamp freshness

    if time.time() - attestation\_record\['auditTimestamp'\] > T\_FRESH:

        return False

    # 2. verify aggregator signature (BLS/multisig)

    if not verify\_aggregated\_attestor\_sig(attestation\_record\['aggregatedSig'\], attestation\_record\['merkleRoot'\], signer\_keys):

        return False

    # 3. verify merkle proof

    if not verify\_merkle\_proof(payload\_hash, merkle\_proof, attestation\_record\['merkleRoot'\]):

        return False

    return True
