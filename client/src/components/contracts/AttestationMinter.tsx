import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useWeb3 } from "@/contexts/Web3Context";
import { Web3ContractClient, defaultAttestationAnchorConfig } from "@/lib/web3-contract-client";
import { Shield, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import TransactionStatus from "./TransactionStatus";
import { keccak256, toUtf8Bytes } from "ethers";
import { logError } from "@/lib/error-handler";

interface AttestationMinterProps {
  contractAddress?: string;
}

export default function AttestationMinter({ contractAddress }: AttestationMinterProps) {
  const { isConnected, getContract, currentChain } = useWeb3();
  const [anchorId, setAnchorId] = useState("");
  const [merkleRoot, setMerkleRoot] = useState("");
  const [ipfsCid, setIpfsCid] = useState("");
  const [isMinting, setIsMinting] = useState(false);
  const [txStatus, setTxStatus] = useState<{
    hash?: string;
    status: "idle" | "pending" | "success" | "error";
    error?: string;
  }>({ status: "idle" });

  const contractAddressToUse = contractAddress || defaultAttestationAnchorConfig.address;

  const generateMerkleRoot = (data: string): string => {
    // Simple hash for demo - in production, use proper Merkle tree
    return keccak256(toUtf8Bytes(data));
  };

  const handleMint = async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!anchorId || !ipfsCid) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setIsMinting(true);
      setTxStatus({ status: "pending" });

      const contract = getContract(
        contractAddressToUse,
        defaultAttestationAnchorConfig.abi
      );

      if (!contract) {
        throw new Error("Contract not available. Please connect wallet.");
      }

      const client = new Web3ContractClient(defaultAttestationAnchorConfig, contract);
      
      // Generate merkle root if not provided
      const root = merkleRoot || generateMerkleRoot(`${anchorId}-${ipfsCid}`);

      const tx = await client.createAnchor(anchorId, root, ipfsCid);
      setTxStatus({ hash: tx.hash, status: "pending" });

      toast.info("Transaction submitted. Waiting for confirmation...");

      const receipt = await client.waitForTransaction(tx);
      
      setTxStatus({ hash: tx.hash, status: "success" });
      toast.success("Attestation anchored on-chain!");

      // Reset form
      setAnchorId("");
      setMerkleRoot("");
      setIpfsCid("");
    } catch (error: any) {
      logError(error as Error, { component: 'AttestationMinter', method: 'handleMint', anchorId, ipfsCid });
      setTxStatus({
        status: "error",
        error: error.message || "Failed to mint attestation",
      });
      toast.error(error.message || "Failed to mint attestation");
    } finally {
      setIsMinting(false);
    }
  };

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Mint On-Chain Attestation
          </CardTitle>
          <CardDescription>
            Connect your wallet to create on-chain attestations
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-mono">
            <Shield className="w-4 h-4 text-primary" />
            MINT ATTESTATION
          </CardTitle>
          <CardDescription className="font-mono text-xs">
            Create an immutable on-chain record of your security audit
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="anchorId" className="font-mono text-xs">
              Anchor ID *
            </Label>
            <Input
              id="anchorId"
              placeholder="unique-anchor-identifier"
              value={anchorId}
              onChange={(e) => setAnchorId(e.target.value)}
              className="font-mono text-xs"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="merkleRoot" className="font-mono text-xs">
              Merkle Root (optional)
            </Label>
            <Input
              id="merkleRoot"
              placeholder="0x..."
              value={merkleRoot}
              onChange={(e) => setMerkleRoot(e.target.value)}
              className="font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground font-mono">
              Leave empty to auto-generate from anchor ID and IPFS CID
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ipfsCid" className="font-mono text-xs">
              IPFS CID *
            </Label>
            <Input
              id="ipfsCid"
              placeholder="QmXxxx..."
              value={ipfsCid}
              onChange={(e) => setIpfsCid(e.target.value)}
              className="font-mono text-xs"
            />
          </div>

          <div className="text-xs text-muted-foreground font-mono bg-secondary/50 p-3 rounded">
            <div className="flex items-center justify-between mb-1">
              <span>Network:</span>
              <span>{currentChain?.name || "Unknown"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Contract:</span>
              <span className="break-all">{contractAddressToUse.slice(0, 10)}...</span>
            </div>
          </div>

          <Button
            onClick={handleMint}
            disabled={isMinting || !anchorId || !ipfsCid}
            className="w-full font-mono"
          >
            {isMinting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                MINTING...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4 mr-2" />
                MINT ATTESTATION
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {txStatus.status !== "idle" && (
        <TransactionStatus
          hash={txStatus.hash}
          status={txStatus.status}
          error={txStatus.error}
          onClose={() => setTxStatus({ status: "idle" })}
        />
      )}
    </div>
  );
}

