# NullAudit v3.0 - Multi-LLM Security & Evaluation Agent

## 🏆 NullShot Hackathon Submission - Track 1 & Track 2

**NullAudit** is an advanced security auditing platform that leverages the **NullShot Agent Framework** and **Model Context Protocol (MCP)** to perform comprehensive security analysis with human-in-the-loop (HITL) capabilities and Web3 integration.

### 🎯 Hackathon Focus Areas

✅ **Raise Awareness of NullShot Agent and MCP Framework** - Full integration with NullShot's agent orchestration and MCP tool ecosystem  
✅ **Encourage Innovation in Decentralized AI Agent Development** - Autonomous agent-to-agent security auditing  
✅ **Engage Blockchain Ecosystems** - Smart contract analysis and on-chain attestations for Web3 applications

---

## 🚀 Key Features

### 1. NullShot Agent Framework Integration ⭐ NEW v3.0
- **Agent Orchestration**: Leverage NullShot's multi-agent coordination for consensus-based security analysis
- **MCP Tool Exposure**: Expose security analysis as standardized MCP tools for agent-to-agent communication
- **Agent Interoperability**: Enable other NullShot agents to invoke audits through standardized MCP interface
- **Deterministic Execution**: Input hashing (Keccak256) and evidence refs for reproducible audits
- **Capability Tokens**: Fine-grained access control with scoped, time-limited tokens
- **Compute Receipts**: Track LLM costs and performance metrics for each analysis

### 2. Model Context Protocol (MCP) Integration ⭐ NEW v3.0
- **5 Core MCP Tools**: Standardized tool descriptors with Zod validation
  - `analyze_code_security` - Multi-LLM consensus analysis
  - `mint_attestation` - On-chain attestation creation
  - `get_report` - Multi-format report retrieval
  - `verify_attestation` - Merkle proof verification
  - `get_agent_metrics` - Agent performance monitoring
- **Tool Discovery**: Complete MCP manifest for client discovery
- **Resource URIs**: Standardized resource access patterns
- **Prompt Templates**: Pre-defined prompts for security analysis

### 3. Web3 & Blockchain Integration ⭐ NEW v3.0
- **Multi-Chain Support**: Ethereum, Polygon, Arbitrum, Optimism, Base
- **Smart Contract Analysis**: Specialized security checks for Solidity code
- **On-Chain Attestations**: Immutable proof of security audits via Merkle roots
- **IPFS Storage**: Decentralized evidence storage with CID references
- **Merkle Verification**: Cryptographic proof validation on-chain
- **Gas Optimization**: Minimal on-chain storage footprint

### 4. Human-in-the-Loop (HITL) System
- **Intelligent Escalation**: Automatically escalates findings based on confidence scores, severity, and risk categories
- **Task Management**: Create, assign, and track human review tasks
- **Feedback Collection**: Structured feedback system for human reviewers
- **Escalation Policies**: Configurable policies for different security scenarios
- **Timeout Handling**: Automatic fallback actions when human review times out

### 5. Multi-LLM Security Analysis
- **Agent Coordination**: Multiple AI agents working together for comprehensive security audits
- **Consensus Scoring**: Aggregate confidence from multiple LLMs (GPT-4, Claude, Gemini, etc.)
- **Evidence Collection**: Detailed evidence tracking for each security finding
- **Compliance Checking**: Built-in checks for OWASP Top 10, CWE, GDPR, HIPAA, PCI-DSS

### 6. Enhanced UI/UX
- **Review Dashboard**: Dedicated interface for human reviewers
- **Task Queue**: Prioritized task management with real-time updates
- **Evidence Viewer**: Comprehensive evidence presentation
- **Analytics**: Performance metrics and review statistics
- **Agent Monitoring**: Real-time visibility into NullShot agent orchestration

---

## 📁 Project Structure

```
nullaudit-improved/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── hitl/                    # HITL UI components
│   │   │   ├── contracts/               # Smart contract interfaces
│   │   │   ├── nullshot/                # NullShot agent monitoring
│   │   │   └── ui/                      # Reusable UI components
│   │   ├── lib/
│   │   │   ├── hitl/                    # HITL manager and logic
│   │   │   ├── contract-client.ts       # Smart contract client
│   │   │   ├── nullshot-integration.ts  # NullShot SDK integration
│   │   │   └── mcp-client.ts            # MCP client for agent communication
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx            # Main dashboard with HITL metrics
│   │   │   ├── HumanReview.tsx          # Human review interface
│   │   │   ├── Audit.tsx                # Audit execution page
│   │   │   ├── Reports.tsx              # Audit reports
│   │   │   ├── AgentMonitoring.tsx      # NullShot agent monitoring
│   │   │   └── Settings.tsx             # Configuration
│   │   └── App.tsx
│   └── public/
├── server/
│   ├── routes/
│   │   ├── hitl.ts                      # HITL API routes
│   │   ├── mcp.ts                       # MCP API routes
│   │   └── nullshot.ts                  # NullShot integration routes
│   ├── services/
│   │   ├── mcp-tools.ts                 # MCP tool registry
│   │   ├── capability-manager.ts        # Capability token management
│   │   └── agent-orchestrator.ts        # NullShot agent coordination
│   └── index.ts                         # Server entry point
├── shared/
│   ├── envelopes.ts                     # MCP envelope schemas
│   └── hitl-types.ts                    # Shared TypeScript types
├── contracts/
│   ├── AttestationAnchor.sol            # On-chain attestation storage
│   └── NullshotCore.sol                 # Core smart contracts
├── mcp.json                             # MCP configuration
└── package.json
```

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, TailwindCSS, Wouter
- **Backend**: Express.js, Node.js
- **Agent Framework**: NullShot Agent Framework with MCP support
- **Smart Contracts**: Solidity ^0.8.19
- **Blockchain**: Ethereum, Polygon, Arbitrum, Optimism, Base
- **Storage**: IPFS (via CID references)
- **UI Components**: Radix UI, Lucide Icons
- **Charts**: Recharts
- **Build Tool**: Vite
- **Validation**: Zod (runtime type validation)

---

## 🔧 Installation & Setup

### Prerequisites
- Node.js 18+ and pnpm
- Lovable account (for deployment)

### Installation

```bash
# Install dependencies
pnpm install

# Development mode (auto-reload)
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

### Environment Configuration

Create a `.env` file:

```env
# Server
PORT=3000
NODE_ENV=development

# NullShot Integration
NULLSHOT_API_KEY=your-nullshot-api-key
NULLSHOT_AGENT_ID=your-agent-id

# Blockchain
ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/your-key
POLYGON_RPC_URL=https://polygon-rpc.com
ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc

# IPFS
IPFS_GATEWAY=https://gateway.pinata.cloud

# LLM Providers
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
GOOGLE_API_KEY=your-google-key
```

---

## 🎯 NullShot Agent Framework Integration

### How It Works

1. **Agent Orchestration**: NullAudit acts as both an MCP server and a NullShot agent
2. **Multi-Agent Consensus**: Coordinates multiple LLMs for security analysis
3. **Tool Exposure**: Exposes security analysis tools via MCP for other agents
4. **Evidence Synthesis**: Combines findings from multiple agents into consensus reports
5. **On-Chain Anchoring**: Records attestations on blockchain for verification

### MCP Tools Available

#### 1. `analyze_code_security`
Perform multi-LLM security analysis with consensus scoring.

```bash
curl -X POST http://localhost:3000/api/mcp/invoke \
  -H "Content-Type: application/json" \
  -d '{
    "tool_id": "analyze_code_security",
    "inputs": {
      "code": "// your code here",
      "language": "solidity",
      "blockchain": "ethereum",
      "depth": "deep"
    }
  }'
```

#### 2. `mint_attestation`
Create on-chain attestation for audit results.

```bash
curl -X POST http://localhost:3000/api/mcp/invoke \
  -H "Content-Type: application/json" \
  -d '{
    "tool_id": "mint_attestation",
    "inputs": {
      "audit_id": "audit-123",
      "merkle_root": "0x...",
      "chain": "ethereum",
      "security_score": 85
    }
  }'
```

#### 3. `get_report`
Retrieve detailed audit reports in multiple formats.

```bash
curl -X POST http://localhost:3000/api/mcp/invoke \
  -H "Content-Type: application/json" \
  -d '{
    "tool_id": "get_report",
    "inputs": {
      "audit_id": "audit-123",
      "format": "json"
    }
  }'
```

#### 4. `verify_attestation`
Verify on-chain attestations with Merkle proofs.

```bash
curl -X POST http://localhost:3000/api/mcp/invoke \
  -H "Content-Type: application/json" \
  -d '{
    "tool_id": "verify_attestation",
    "inputs": {
      "anchor_id": "anchor-123",
      "chain": "ethereum"
    }
  }'
```

#### 5. `get_agent_metrics`
Monitor NullShot agent performance and orchestration metrics.

```bash
curl -X POST http://localhost:3000/api/mcp/invoke \
  -H "Content-Type: application/json" \
  -d '{
    "tool_id": "get_agent_metrics",
    "inputs": {
      "time_range": "24h"
    }
  }'
```

---

## 🔐 Security Features

### Vulnerability Detection
- SQL Injection
- Cross-Site Scripting (XSS)
- Authentication Weaknesses
- Data Exposure
- Authorization Bypass
- Reentrancy (Smart Contracts)
- Integer Overflow/Underflow
- Gas Optimization Issues

### Compliance Checks
- OWASP Top 10
- CWE (Common Weakness Enumeration)
- GDPR
- HIPAA
- PCI-DSS
- ERC-20/ERC-721 Standards (for tokens)

### Smart Contract Specific
- Access Control Vulnerabilities
- State Management Issues
- External Call Risks
- Fallback Function Security
- Delegatecall Risks

---

## 👥 Human-in-the-Loop Workflow

1. **Analysis**: NullShot agents analyze codebase using multiple LLMs
2. **Evaluation**: System evaluates findings for human review needs
3. **Escalation**: Low-confidence or high-severity findings escalated
4. **Review**: Human reviewers examine findings in dedicated UI
5. **Feedback**: Reviewers approve, reject, or request changes
6. **Learning**: System learns from human feedback to improve
7. **Attestation**: Approved findings anchored on-chain for verification

---

## 📊 Key Improvements in v3.0

### New Features
✅ **Full NullShot Agent Framework Integration**  
✅ **5 MCP Tools with standardized descriptors**  
✅ **Multi-chain smart contract support**  
✅ **On-chain attestation with Merkle verification**  
✅ **Agent performance monitoring dashboard**  
✅ **Deterministic execution with input hashing**  
✅ **Capability token-based access control**  
✅ **IPFS-based evidence storage**  
✅ **Compute receipt tracking**  
✅ **Web3 integration for blockchain audits**  

### Enhanced Components
✅ Agent orchestration monitoring  
✅ MCP tool discovery and invocation  
✅ Blockchain attestation management  
✅ Evidence verification interface  
✅ Multi-chain deployment support  

---

## 🏗️ Smart Contracts

### AttestationAnchor.sol
Stores cryptographic proofs of security audits on-chain with:
- Merkle root storage for evidence verification
- IPFS CID anchoring for full evidence access
- Authorized signer management
- Batch anchoring for efficiency
- Governance controls

### NullshotCore.sol
Core smart contracts for:
- Attestation registry
- Commitment vault with slashing
- Launch manager for project lifecycle
- Fee router for stakeholder distribution

---

## 🌐 Web3 Integration

### Supported Blockchains
- **Ethereum** - Mainnet and testnets
- **Polygon** - Scaling solution
- **Arbitrum** - Layer 2 optimistic rollup
- **Optimism** - Layer 2 optimistic rollup
- **Base** - Coinbase Layer 2

### Smart Contract Analysis
NullAudit provides specialized security analysis for:
- ERC-20 Token Contracts
- ERC-721 NFT Contracts
- DeFi Protocols
- Governance Contracts
- Bridge Contracts
- Staking Contracts

---

## 🔮 Future Enhancements

- [ ] Real blockchain deployment (testnet)
- [ ] Advanced ML models for confidence prediction
- [ ] Automated remediation suggestions
- [ ] Integration with CI/CD pipelines
- [ ] Mobile app for reviewers
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Plugin system for custom security rules
- [ ] ZK proofs for privacy
- [ ] Cross-chain relayer support

---

## 📝 API Endpoints

### MCP Endpoints

```
GET  /api/mcp/manifest              # Tool discovery
GET  /api/mcp/tools                 # List available tools
POST /api/mcp/invoke                # Invoke MCP tool
POST /api/mcp/capability/mint       # Mint capability token
POST /api/mcp/capability/verify     # Verify token
POST /api/mcp/capability/revoke     # Revoke token
GET  /api/mcp/health                # Health check
```

### HITL Endpoints

```
GET  /api/hitl/tasks/pending          # Get pending review tasks
GET  /api/hitl/tasks/:taskId          # Get specific task
POST /api/hitl/tasks/:taskId/feedback # Submit feedback
POST /api/hitl/tasks/:taskId/assign   # Assign task to reviewer
GET  /api/hitl/stats                  # Get HITL statistics
```

### NullShot Integration Endpoints

```
GET  /api/nullshot/agents             # List active agents
GET  /api/nullshot/metrics            # Agent performance metrics
POST /api/nullshot/orchestrate        # Trigger agent orchestration
GET  /api/nullshot/consensus          # Get consensus results
```

---

## 🎨 Design Philosophy

- **Cyberpunk Aesthetic**: Matrix-inspired green-on-black terminal theme
- **Clarity**: Clear information hierarchy and visual feedback
- **Efficiency**: Streamlined workflows for rapid security assessment
- **Transparency**: Full evidence and context for every finding
- **Decentralization**: Web3-native design with on-chain verification

---

## 🤝 Contributing

This project is built for the NullShot Hackathon. Contributions, suggestions, and feedback are welcome!

---

## 📄 License

MIT License

---

## 🏆 Hackathon Criteria Alignment

### Innovation
✅ Novel HITL approach for AI security auditing  
✅ Multi-LLM coordination with NullShot Agent Framework  
✅ On-chain attestation for audit verification  
✅ MCP-based agent-to-agent communication  
✅ Web3-integrated security analysis  

### Technical Excellence
✅ Clean, maintainable TypeScript codebase  
✅ Comprehensive type safety with Zod validation  
✅ Modular architecture with clear separation of concerns  
✅ Production-ready smart contracts  
✅ Deterministic execution with evidence tracking  

### User Experience
✅ Intuitive review interface  
✅ Real-time updates and monitoring  
✅ Clear visual feedback  
✅ Efficient task management  
✅ Agent performance visibility  

### NullShot Integration
✅ Full Agent Framework integration  
✅ MCP tool exposure and discovery  
✅ Multi-agent orchestration  
✅ Evidence synthesis and consensus  
✅ Capability token-based access control  

### Web3 Integration
✅ Multi-chain support  
✅ Smart contract analysis  
✅ On-chain attestations  
✅ Merkle proof verification  
✅ IPFS-based evidence storage  

---

## 🔗 Links

- [NullShot Documentation](https://nullshot.ai/en/docs/developers/overview)
- [NullShot Agent Framework](https://nullshot.ai/en/docs/developers/agents-framework)
- [MCP Framework](https://nullshot.ai/en/docs/developers/mcp-framework)
- [TypeScript Agent Toolkit](https://github.com/null-shot/typescript-agent-tookit)
- [Hackathon Details](https://dorahacks.io/hackathon/nullshothacks/detail)

---

**Built with ❤️ for the NullShot Hackathon**

**Version 3.0** - Full NullShot Agent Framework & Web3 Integration

**Status**: ✅ Ready for Lovable Deployment
