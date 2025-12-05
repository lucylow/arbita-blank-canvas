/**
 * Enhanced Web3 Contract Client for NullAudit
 * Uses ethers.js for real blockchain interactions
 */

import { Contract, ContractTransactionResponse, formatUnits, parseUnits } from "ethers";
import { ContractError, AppError, ErrorCode, normalizeError } from '../../../shared/errors';
import { logError } from './error-handler';

export interface AttestationAnchorConfig {
  address: string;
  abi: any[];
}

export interface AnchorData {
  merkleRoot: string;
  ts: bigint;
  signer: string;
  cid: string;
  verified: boolean;
}

export interface AttestationData {
  id: string;
  artifactHash: string;
  issuer: string;
  metadataURI: string;
  timestamp: number;
}

export interface ProjectInfo {
  id: number;
  creator: string;
  metadataURI: string;
  status: 'Pending' | 'Active' | 'Completed' | 'Failed';
  createdAt: number;
  completedAt: number;
  attestations: string[];
}

/**
 * AttestationAnchor ABI (minimal interface)
 */
export const ATTESTATION_ANCHOR_ABI = [
  "function anchor(bytes32 anchorId, bytes32 merkleRoot, string calldata cid) external",
  "function verify(bytes32 anchorId, bytes32[] calldata proof) external returns (bool)",
  "function getAnchor(bytes32 anchorId) external view returns (tuple(bytes32 merkleRoot, uint256 ts, address signer, string cid, bool verified))",
  "function exists(bytes32 anchorId) external view returns (bool)",
  "function batchAnchor(bytes32[] calldata anchorIds, bytes32[] calldata merkleRoots, string[] calldata cids) external",
  "event AnchorCreated(bytes32 indexed anchorId, bytes32 merkleRoot, uint256 ts, address indexed signer, string cid)",
  "event AnchorVerified(bytes32 indexed anchorId, address indexed verifier)",
] as const;

export class Web3ContractClient {
  private contract: Contract | null = null;
  private config: AttestationAnchorConfig;

  constructor(config: AttestationAnchorConfig, contractInstance?: Contract) {
    this.config = config;
    this.contract = contractInstance || null;
  }

  /**
   * Set contract instance (from Web3 context)
   */
  setContract(contract: Contract | null) {
    this.contract = contract;
  }

  /**
   * Get contract instance
   */
  getContract(): Contract | null {
    return this.contract;
  }

  /**
   * Create anchor for attestation
   */
  async createAnchor(
    anchorId: string,
    merkleRoot: string,
    ipfsCid: string
  ): Promise<ContractTransactionResponse> {
    try {
      if (!this.contract) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          'Contract not initialized. Please connect wallet first.',
          400
        );
      }

      if (!anchorId || !merkleRoot || !ipfsCid) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          'Anchor ID, merkle root, and IPFS CID are required',
          400
        );
      }

      // Convert anchorId to bytes32
      const anchorIdBytes = this.stringToBytes32(anchorId);
      const merkleRootBytes = this.hexToBytes32(merkleRoot);

      const tx = await this.contract.anchor(anchorIdBytes, merkleRootBytes, ipfsCid);
      return tx;
    } catch (error) {
      const normalized = normalizeError(error);
      logError(normalized, { method: 'createAnchor', anchorId, merkleRoot, ipfsCid });
      
      if (normalized instanceof ContractError) {
        throw normalized;
      }
      
      throw new ContractError(
        `Failed to create anchor: ${normalized.message}`,
        { originalError: normalized.message }
      );
    }
  }

  /**
   * Batch create anchors (gas efficient)
   */
  async batchCreateAnchors(
    anchorIds: string[],
    merkleRoots: string[],
    ipfsCids: string[]
  ): Promise<ContractTransactionResponse> {
    try {
      if (!this.contract) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          'Contract not initialized. Please connect wallet first.',
          400
        );
      }

      if (anchorIds.length !== merkleRoots.length || anchorIds.length !== ipfsCids.length) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          'Arrays must have the same length',
          400
        );
      }

      const anchorIdBytes = anchorIds.map(id => this.stringToBytes32(id));
      const merkleRootBytes = merkleRoots.map(root => this.hexToBytes32(root));

      const tx = await this.contract.batchAnchor(anchorIdBytes, merkleRootBytes, ipfsCids);
      return tx;
    } catch (error) {
      const normalized = normalizeError(error);
      logError(normalized, { method: 'batchCreateAnchors' });
      
      if (normalized instanceof ContractError) {
        throw normalized;
      }
      
      throw new ContractError(
        `Failed to batch create anchors: ${normalized.message}`,
        { originalError: normalized.message }
      );
    }
  }

  /**
   * Verify an anchor
   */
  async verifyAnchor(
    anchorId: string,
    proof: string[]
  ): Promise<boolean> {
    try {
      if (!this.contract) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          'Contract not initialized. Please connect wallet first.',
          400
        );
      }

      const anchorIdBytes = this.stringToBytes32(anchorId);
      const proofBytes = proof.map(p => this.hexToBytes32(p));

      const result = await this.contract.verify(anchorIdBytes, proofBytes);
      return result;
    } catch (error) {
      const normalized = normalizeError(error);
      logError(normalized, { method: 'verifyAnchor', anchorId });
      throw normalized;
    }
  }

  /**
   * Get anchor data
   */
  async getAnchor(anchorId: string): Promise<AnchorData | null> {
    try {
      if (!this.contract) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          'Contract not initialized. Please connect wallet first.',
          400
        );
      }

      const anchorIdBytes = this.stringToBytes32(anchorId);
      const anchor = await this.contract.getAnchor(anchorIdBytes);
      
      return {
        merkleRoot: anchor.merkleRoot,
        ts: anchor.ts,
        signer: anchor.signer,
        cid: anchor.cid,
        verified: anchor.verified,
      };
    } catch (error: any) {
      if (error.message?.includes('Anchor does not exist')) {
        return null;
      }
      const normalized = normalizeError(error);
      logError(normalized, { method: 'getAnchor', anchorId });
      throw normalized;
    }
  }

  /**
   * Check if anchor exists
   */
  async anchorExists(anchorId: string): Promise<boolean> {
    try {
      if (!this.contract) {
        return false;
      }

      const anchorIdBytes = this.stringToBytes32(anchorId);
      const exists = await this.contract.exists(anchorIdBytes);
      return exists;
    } catch (error) {
      const normalized = normalizeError(error);
      logError(normalized, { method: 'anchorExists', anchorId });
      return false;
    }
  }

  /**
   * Wait for transaction confirmation
   */
  async waitForTransaction(
    tx: ContractTransactionResponse,
    confirmations: number = 1
  ): Promise<any> {
    try {
      return await tx.wait(confirmations);
    } catch (error) {
      const normalized = normalizeError(error);
      logError(normalized, { method: 'waitForTransaction', txHash: tx.hash });
      throw normalized;
    }
  }

  /**
   * Helper: Convert string to bytes32
   */
  private stringToBytes32(str: string): string {
    // Pad or truncate to 32 bytes
    const hex = Buffer.from(str.slice(0, 32), 'utf8').toString('hex');
    return '0x' + hex.padEnd(64, '0');
  }

  /**
   * Helper: Convert hex string to bytes32
   */
  private hexToBytes32(hex: string): string {
    // Remove 0x prefix if present
    const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
    // Pad to 64 characters (32 bytes)
    return '0x' + cleanHex.padStart(64, '0').slice(0, 64);
  }
}

// Default configuration
export const defaultAttestationAnchorConfig: AttestationAnchorConfig = {
  address: '0x0000000000000000000000000000000000000000',
  abi: ATTESTATION_ANCHOR_ABI as any,
};


