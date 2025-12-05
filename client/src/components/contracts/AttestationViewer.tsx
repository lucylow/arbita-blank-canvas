import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useContract } from "@/hooks/useContract";
import { Shield, Search, Loader2, CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { formatUnits } from "ethers";
import { logError, showErrorNotification } from "@/lib/error-handler";

interface AttestationViewerProps {
  contractAddress?: string;
}

export default function AttestationViewer({ contractAddress }: AttestationViewerProps) {
  const { contractClient, isReady } = useContract(contractAddress);
  const [anchorId, setAnchorId] = useState("");
  const [loading, setLoading] = useState(false);
  const [anchorData, setAnchorData] = useState<any>(null);

  const handleSearch = async () => {
    if (!anchorId.trim()) {
      toast.error("Please enter an anchor ID");
      return;
    }

    if (!isReady || !contractClient) {
      toast.error("Contract not ready. Please connect wallet.");
      return;
    }

    try {
      setLoading(true);
      const data = await contractClient.getAnchor(anchorId);
      if (data) {
        setAnchorData(data);
        toast.success("Attestation found");
      } else {
        setAnchorData(null);
        toast.info("Attestation not found");
      }
    } catch (error: any) {
      logError(error as Error, { component: 'AttestationViewer', method: 'handleSearch', anchorId });
      showErrorNotification(error, {
        title: 'Failed to fetch attestation',
        duration: 5000,
      });
      setAnchorData(null);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-mono">
          <Shield className="w-4 h-4 text-primary" />
          VIEW ATTESTATION
        </CardTitle>
        <CardDescription className="font-mono text-xs">
          Query on-chain attestation data by anchor ID
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="searchAnchorId" className="font-mono text-xs">
            Anchor ID
          </Label>
          <div className="flex gap-2">
            <Input
              id="searchAnchorId"
              placeholder="Enter anchor ID..."
              value={anchorId}
              onChange={(e) => setAnchorId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="font-mono text-xs"
            />
            <Button
              onClick={handleSearch}
              disabled={loading || !isReady}
              size="icon"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {anchorData && (
          <div className="space-y-3 p-4 bg-secondary/50 rounded border border-border">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-muted-foreground">Status</span>
              <Badge
                variant={anchorData.verified ? "default" : "outline"}
                className="font-mono text-xs"
              >
                {anchorData.verified ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Verified
                  </>
                ) : (
                  <>
                    <XCircle className="w-3 h-3 mr-1" />
                    Unverified
                  </>
                )}
              </Badge>
            </div>

            <div className="space-y-2">
              <div>
                <span className="text-xs font-mono text-muted-foreground">Merkle Root</span>
                <div className="font-mono text-xs break-all bg-background/50 p-2 rounded mt-1">
                  {anchorData.merkleRoot}
                </div>
              </div>

              <div>
                <span className="text-xs font-mono text-muted-foreground">IPFS CID</span>
                <div className="font-mono text-xs break-all bg-background/50 p-2 rounded mt-1">
                  {anchorData.cid}
                </div>
              </div>

              <div>
                <span className="text-xs font-mono text-muted-foreground">Signer</span>
                <div className="font-mono text-xs break-all bg-background/50 p-2 rounded mt-1">
                  {anchorData.signer}
                </div>
              </div>

              <div>
                <span className="text-xs font-mono text-muted-foreground">Timestamp</span>
                <div className="font-mono text-xs bg-background/50 p-2 rounded mt-1">
                  {formatTimestamp(anchorData.ts)}
                </div>
              </div>
            </div>
          </div>
        )}

        {!isReady && (
          <div className="text-xs text-muted-foreground font-mono text-center p-4 bg-secondary/50 rounded">
            Connect wallet to view attestations
          </div>
        )}
      </CardContent>
    </Card>
  );
}

