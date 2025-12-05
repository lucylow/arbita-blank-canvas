# Web3 Components for NullAudit

This directory contains React components for Web3 integration, including wallet connection, chain switching, and on-chain attestation operations.

## Components

### WalletConnect
A button component that handles wallet connection and displays wallet information.

**Usage:**
```tsx
import { WalletConnect } from "@/components/contracts";

<WalletConnect />
```

**Features:**
- Connect/disconnect wallet
- Display wallet address and balance
- Copy address to clipboard
- View address on block explorer
- Auto-reconnect on page load

### ChainSelector
A dropdown component for switching between supported blockchain networks.

**Usage:**
```tsx
import { ChainSelector } from "@/components/contracts";

<ChainSelector />
```

**Supported Chains:**
- Ethereum (Mainnet & Sepolia)
- Polygon (Mainnet & Mumbai)
- Arbitrum (One & Sepolia)
- Optimism (Mainnet & Sepolia)
- Base (Mainnet & Sepolia)

### TransactionStatus
Displays the status of blockchain transactions with explorer links.

**Usage:**
```tsx
import { TransactionStatus } from "@/components/contracts";

<TransactionStatus
  hash="0x..."
  status="pending" // "idle" | "pending" | "success" | "error"
  error="Optional error message"
  onClose={() => setStatus({ status: "idle" })}
/>
```

### AttestationMinter
A form component for creating on-chain attestations.

**Usage:**
```tsx
import { AttestationMinter } from "@/components/contracts";

<AttestationMinter contractAddress="0x..." />
```

**Features:**
- Create attestation anchors
- Auto-generate Merkle roots
- Submit transactions to blockchain
- Real-time transaction status

### AttestationViewer
Query and display on-chain attestation data.

**Usage:**
```tsx
import { AttestationViewer } from "@/components/contracts";

<AttestationViewer contractAddress="0x..." />
```

## Context

### Web3Context
Provides global Web3 state and functions throughout the app.

**Usage:**
```tsx
import { useWeb3 } from "@/contexts/Web3Context";

function MyComponent() {
  const {
    isConnected,
    address,
    connect,
    disconnect,
    balance,
    currentChain,
    switchChain,
    getContract,
  } = useWeb3();

  // Use Web3 functionality
}
```

## Hooks

### useContract
A hook for interacting with smart contracts.

**Usage:**
```tsx
import { useContract } from "@/hooks/useContract";

function MyComponent() {
  const { contract, contractClient, isReady } = useContract("0x...");

  if (isReady && contractClient) {
    // Interact with contract
  }
}
```

## Contract Client

### Web3ContractClient
A TypeScript class for interacting with the AttestationAnchor contract.

**Usage:**
```tsx
import { Web3ContractClient, defaultAttestationAnchorConfig } from "@/lib/web3-contract-client";
import { useWeb3 } from "@/contexts/Web3Context";

function MyComponent() {
  const { getContract } = useWeb3();
  const contract = getContract(address, abi);
  const client = new Web3ContractClient(config, contract);

  // Create anchor
  const tx = await client.createAnchor(anchorId, merkleRoot, ipfsCid);
  await client.waitForTransaction(tx);

  // Get anchor data
  const data = await client.getAnchor(anchorId);
}
```

## Setup

1. **Install dependencies:**
```bash
pnpm install
```

2. **Wrap your app with Web3Provider:**
```tsx
import { Web3Provider } from "@/contexts/Web3Context";

function App() {
  return (
    <Web3Provider>
      {/* Your app */}
    </Web3Provider>
  );
}
```

3. **Use components in your pages:**
```tsx
import { WalletConnect, ChainSelector, AttestationMinter } from "@/components/contracts";

function MyPage() {
  return (
    <div>
      <WalletConnect />
      <ChainSelector />
      <AttestationMinter />
    </div>
  );
}
```

## Environment Variables

Configure contract addresses per chain:

```env
ATTESTATION_ANCHOR_ADDRESS_ETHEREUM=0x...
ATTESTATION_ANCHOR_ADDRESS_POLYGON=0x...
ATTESTATION_ANCHOR_ADDRESS_ARBITRUM=0x...
```

## Smart Contract ABI

The components use the AttestationAnchor contract ABI defined in `web3-contract-client.ts`. Key functions:

- `anchor(bytes32 anchorId, bytes32 merkleRoot, string cid)` - Create attestation
- `verify(bytes32 anchorId, bytes32[] proof)` - Verify attestation
- `getAnchor(bytes32 anchorId)` - Get anchor data
- `exists(bytes32 anchorId)` - Check if anchor exists

## Error Handling

All components include comprehensive error handling:
- Wallet connection errors
- Transaction failures
- Network errors
- Contract interaction errors

Errors are displayed via toast notifications and component states.

## Best Practices

1. **Always check `isConnected` before contract operations**
2. **Use `isReady` from `useContract` before calling contract methods**
3. **Handle transaction confirmations with `waitForTransaction`**
4. **Display loading states during async operations**
5. **Provide user feedback for all Web3 actions**

## Examples

See the following files for complete examples:
- `client/src/components/Layout.tsx` - Integration in header
- `client/src/pages/Audit.tsx` - Can be extended with Web3 features
- `client/src/components/contracts/AttestationMinter.tsx` - Full transaction flow


