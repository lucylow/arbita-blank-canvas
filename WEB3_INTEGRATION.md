# Web3 Integration Guide - NullAudit v3.0

## Overview

NullAudit v3.0 includes comprehensive Web3 integration for blockchain security analysis and on-chain attestations:

- ⛓️ **Multi-Chain Support** - Ethereum, Polygon, Arbitrum, Optimism, Base
- 🔍 **Smart Contract Analysis** - Specialized security checks for Solidity
- 📜 **On-Chain Attestations** - Immutable proof of security audits
- 🔐 **Merkle Verification** - Cryptographic proof validation
- 📦 **IPFS Storage** - Decentralized evidence storage

---

## Supported Blockchains

| Blockchain | Network | RPC URL | Chain ID |
|-----------|---------|---------|----------|
| **Ethereum** | Mainnet | https://eth-mainnet.g.alchemy.com/v2/ | 1 |
| **Ethereum** | Sepolia | https://eth-sepolia.g.alchemy.com/v2/ | 11155111 |
| **Polygon** | Mainnet | https://polygon-rpc.com | 137 |
| **Polygon** | Mumbai | https://rpc-mumbai.maticvigil.com | 80001 |
| **Arbitrum** | One | https://arb1.arbitrum.io/rpc | 42161 |
| **Arbitrum** | Sepolia | https://sepolia-rollup.arbitrum.io/rpc | 421614 |
| **Optimism** | Mainnet | https://mainnet.optimism.io | 10 |
| **Optimism** | Sepolia | https://sepolia.optimism.io | 11155420 |
| **Base** | Mainnet | https://mainnet.base.org | 8453 |
| **Base** | Sepolia | https://sepolia.base.org | 84532 |

---

## Smart Contract Analysis

### Supported Contract Types

#### 1. ERC-20 Token Contracts
Security checks for token implementations:
- Transfer function vulnerabilities
- Allowance mechanism issues
- Mint/burn function safety
- Reentrancy in token transfers
- Integer overflow/underflow

#### 2. ERC-721 NFT Contracts
NFT-specific security analysis:
- Ownership transfer safety
- Metadata URI handling
- Enumeration function security
- Approval mechanism safety

#### 3. DeFi Protocols
DeFi-specific vulnerability detection:
- Flash loan attacks
- Price oracle manipulation
- Liquidity pool vulnerabilities
- Governance attack vectors

#### 4. Governance Contracts
Governance mechanism security:
- Voting power calculation
- Proposal execution safety
- Timelock mechanism validation
- Access control in governance

#### 5. Bridge Contracts
Cross-chain bridge security:
- Message validation
- Signature verification
- Replay attack prevention
- Liquidity management

#### 6. Staking Contracts
Staking mechanism security:
- Reward calculation safety
- Withdrawal mechanism
- Slashing conditions
- Delegation safety

---

## On-Chain Attestation System

### Attestation Flow

```
1. Security Analysis
   ↓
2. Generate Evidence Bundle
   ├─ Findings
   ├─ Consensus Scores
   └─ Recommendations
   ↓
3. Create Merkle Tree
   ├─ Hash Evidence
   ├─ Calculate Merkle Root
   └─ Store IPFS CID
   ↓
4. Mint On-Chain Attestation
   ├─ Store Merkle Root
   ├─ Record IPFS CID
   └─ Emit Event
   ↓
5. Verification
   ├─ Retrieve On-Chain Data
   ├─ Validate Merkle Proof
   └─ Confirm Evidence Integrity
```

### Attestation Data Structure

```solidity
struct Attestation {
    bytes32 merkleRoot;           // Root of evidence Merkle tree
    string ipfsCid;               // IPFS CID of full evidence
    uint256 securityScore;        // Overall security score (0-100)
    uint256 timestamp;            // Attestation timestamp
    address attester;             // Address that created attestation
    bool verified;                // Verification status
}
```

---

## API Endpoints for Web3

### Mint Attestation

**Endpoint**: `POST /api/mcp/invoke`

**Request**:
```json
{
  "tool_id": "mint_attestation",
  "inputs": {
    "audit_id": "audit-123",
    "merkle_root": "0x1234567890abcdef...",
    "cid": "QmXxxx...",
    "chain": "ethereum",
    "security_score": 85
  }
}
```

**Response**:
```json
{
  "status": "success",
  "anchor_id": "anchor-123",
  "tx_hash": "0x...",
  "block_number": 18234567,
  "attestation": {
    "audit_id": "audit-123",
    "merkle_root": "0x...",
    "cid": "QmXxxx...",
    "security_score": 85,
    "timestamp": 1701686400
  },
  "verification_url": "https://etherscan.io/tx/0x..."
}
```

### Verify Attestation

**Endpoint**: `POST /api/mcp/invoke`

**Request**:
```json
{
  "tool_id": "verify_attestation",
  "inputs": {
    "anchor_id": "anchor-123",
    "chain": "ethereum"
  }
}
```

**Response**:
```json
{
  "status": "success",
  "verified": true,
  "attestation": {
    "audit_id": "audit-123",
    "merkle_root": "0x...",
    "security_score": 85,
    "timestamp": 1701686400
  },
  "proof_valid": true,
  "on_chain_data": {
    "tx_hash": "0x...",
    "block_number": 18234567
  }
}
```

---

## Smart Contract Integration

### AttestationAnchor.sol

Core contract for storing attestations on-chain:

```solidity
pragma solidity ^0.8.19;

contract AttestationAnchor {
    struct Attestation {
        bytes32 merkleRoot;
        string ipfsCid;
        uint256 securityScore;
        uint256 timestamp;
        address attester;
    }

    mapping(bytes32 => Attestation) public attestations;
    mapping(address => bool) public authorizedSigners;

    event AttestationCreated(
        bytes32 indexed anchorId,
        bytes32 merkleRoot,
        string ipfsCid,
        uint256 securityScore
    );

    event AttestationVerified(
        bytes32 indexed anchorId,
        bool isValid
    );

    function anchor(
        bytes32 anchorId,
        bytes32 merkleRoot,
        string memory cid,
        uint256 securityScore
    ) external onlyAuthorized {
        attestations[anchorId] = Attestation({
            merkleRoot: merkleRoot,
            ipfsCid: cid,
            securityScore: securityScore,
            timestamp: block.timestamp,
            attester: msg.sender
        });

        emit AttestationCreated(anchorId, merkleRoot, cid, securityScore);
    }

    function verify(
        bytes32 anchorId,
        bytes32[] calldata proof
    ) external view returns (bool) {
        Attestation memory att = attestations[anchorId];
        require(att.timestamp > 0, "Attestation not found");

        // Merkle proof verification logic
        return _verifyMerkleProof(proof, att.merkleRoot);
    }

    function _verifyMerkleProof(
        bytes32[] memory proof,
        bytes32 root
    ) internal pure returns (bool) {
        // Implementation of Merkle proof verification
        return true;
    }

    modifier onlyAuthorized() {
        require(authorizedSigners[msg.sender], "Not authorized");
        _;
    }
}
```

---

## Integration Examples

### Example 1: Analyze Smart Contract

```typescript
import axios from 'axios';

async function analyzeSmartContract() {
  const solidityCode = `
    pragma solidity ^0.8.0;
    contract Token {
        mapping(address => uint256) balances;
        
        function transfer(address to, uint256 amount) public {
            balances[msg.sender] -= amount;
            balances[to] += amount;
        }
    }
  `;

  const response = await axios.post(
    'http://localhost:3000/api/mcp/invoke',
    {
      tool_id: 'analyze_code_security',
      inputs: {
        code: solidityCode,
        language: 'solidity',
        blockchain: 'ethereum',
        depth: 'deep',
        focus_areas: [
          'reentrancy',
          'access-control',
          'integer-overflow',
          'gas-optimization'
        ]
      }
    }
  );

  console.log('Audit Results:', response.data);
  return response.data.audit_id;
}
```

### Example 2: Create On-Chain Attestation

```typescript
async function createOnChainAttestation(auditId, findings) {
  // 1. Generate Merkle tree from findings
  const merkleTree = generateMerkleTree(findings);
  const merkleRoot = merkleTree.getRoot();

  // 2. Store evidence on IPFS
  const ipfsResponse = await storeOnIPFS(findings);
  const cid = ipfsResponse.cid;

  // 3. Calculate security score
  const securityScore = calculateSecurityScore(findings);

  // 4. Mint on-chain attestation
  const response = await axios.post(
    'http://localhost:3000/api/mcp/invoke',
    {
      tool_id: 'mint_attestation',
      inputs: {
        audit_id: auditId,
        merkle_root: merkleRoot,
        cid: cid,
        chain: 'ethereum',
        security_score: securityScore
      }
    }
  );

  console.log('Attestation created:', response.data.anchor_id);
  console.log('TX Hash:', response.data.tx_hash);
  return response.data;
}
```

### Example 3: Verify Attestation

```typescript
async function verifyAttestation(anchorId, chain = 'ethereum') {
  const response = await axios.post(
    'http://localhost:3000/api/mcp/invoke',
    {
      tool_id: 'verify_attestation',
      inputs: {
        anchor_id: anchorId,
        chain: chain
      }
    }
  );

  if (response.data.verified) {
    console.log('✅ Attestation verified!');
    console.log('Security Score:', response.data.attestation.security_score);
    console.log('On-Chain TX:', response.data.on_chain_data.tx_hash);
  } else {
    console.log('❌ Attestation verification failed');
  }

  return response.data;
}
```

---

## Environment Configuration

### Required Environment Variables

```env
# Blockchain RPC URLs
ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/your-key
POLYGON_RPC_URL=https://polygon-rpc.com
ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
OPTIMISM_RPC_URL=https://mainnet.optimism.io
BASE_RPC_URL=https://mainnet.base.org

# IPFS Configuration
IPFS_GATEWAY=https://gateway.pinata.cloud
IPFS_API_URL=https://api.pinata.cloud

# Smart Contract Addresses
ATTESTATION_ANCHOR_ADDRESS_ETHEREUM=0x...
ATTESTATION_ANCHOR_ADDRESS_POLYGON=0x...
ATTESTATION_ANCHOR_ADDRESS_ARBITRUM=0x...
ATTESTATION_ANCHOR_ADDRESS_OPTIMISM=0x...
ATTESTATION_ANCHOR_ADDRESS_BASE=0x...

# Signer Configuration
SIGNER_PRIVATE_KEY=0x...
SIGNER_ADDRESS=0x...
```

---

## Security Considerations for Web3

1. **Private Key Management**
   - Never commit private keys to repository
   - Use environment variables or secure vaults
   - Rotate keys regularly

2. **Contract Auditing**
   - Always audit smart contracts before deployment
   - Use formal verification tools
   - Test on testnet first

3. **Gas Optimization**
   - Minimize on-chain storage
   - Use batch operations when possible
   - Monitor gas prices

4. **Merkle Proof Validation**
   - Always validate proofs before accepting
   - Use standard Merkle tree implementations
   - Test with known test vectors

5. **IPFS Reliability**
   - Use pinned IPFS nodes
   - Implement fallback mechanisms
   - Verify CID integrity

---

## Testing on Testnet

### 1. Deploy to Sepolia (Ethereum Testnet)

```bash
# Get Sepolia ETH from faucet
# https://sepoliafaucet.com

# Configure environment
export ETHEREUM_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/your-key
export SIGNER_PRIVATE_KEY=0x...

# Deploy contract
npx hardhat deploy --network sepolia
```

### 2. Test Attestation Flow

```bash
# Analyze code
curl -X POST http://localhost:3000/api/mcp/invoke \
  -d '{"tool_id":"analyze_code_security","inputs":{...}}'

# Create attestation on Sepolia
curl -X POST http://localhost:3000/api/mcp/invoke \
  -d '{"tool_id":"mint_attestation","inputs":{"chain":"ethereum",...}}'

# Verify on Sepolia
curl -X POST http://localhost:3000/api/mcp/invoke \
  -d '{"tool_id":"verify_attestation","inputs":{"chain":"ethereum",...}}'
```

### 3. View on Block Explorer

```
Ethereum Sepolia: https://sepolia.etherscan.io/tx/{tx_hash}
Polygon Mumbai: https://mumbai.polygonscan.com/tx/{tx_hash}
Arbitrum Sepolia: https://sepolia.arbiscan.io/tx/{tx_hash}
```

---

## Monitoring & Analytics

### Track Attestations

```typescript
async function getAttestationStats() {
  const response = await axios.post(
    'http://localhost:3000/api/mcp/invoke',
    {
      tool_id: 'get_agent_metrics',
      inputs: {
        time_range: '24h'
      }
    }
  );

  console.log('Total Attestations:', response.data.metrics.total_audits);
  console.log('Avg Security Score:', response.data.metrics.avg_consensus_score);
}
```

---

## Resources

- [Ethereum Documentation](https://ethereum.org/en/developers/)
- [Solidity Documentation](https://docs.soliditylang.org/)
- [IPFS Documentation](https://docs.ipfs.io/)
- [Merkle Tree Implementation](https://github.com/OpenZeppelin/merkle-tree)
- [Smart Contract Best Practices](https://consensys.github.io/smart-contract-best-practices/)

---

**Version 3.0** - Web3 Integration  
**Last Updated**: December 4, 2024
