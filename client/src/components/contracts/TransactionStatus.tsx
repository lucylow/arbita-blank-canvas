import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle, ExternalLink, Copy } from "lucide-react";
import { useWeb3 } from "@/contexts/Web3Context";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface TransactionStatusProps {
  hash?: string;
  status: "idle" | "pending" | "success" | "error";
  error?: string;
  onClose?: () => void;
}

export default function TransactionStatus({
  hash,
  status,
  error,
  onClose,
}: TransactionStatusProps) {
  const { currentChain } = useWeb3();
  const [copied, setCopied] = useState(false);

  const getExplorerUrl = (txHash: string) => {
    if (!currentChain?.blockExplorer) return null;
    return `${currentChain.blockExplorer}/tx/${txHash}`;
  };

  const copyHash = async () => {
    if (!hash) return;
    try {
      await navigator.clipboard.writeText(hash);
      setCopied(true);
      toast.success("Transaction hash copied");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy hash");
    }
  };

  if (status === "idle") return null;

  return (
    <Card className={cn(
      "border-2",
      status === "success" && "border-primary bg-primary/5",
      status === "error" && "border-destructive bg-destructive/5",
      status === "pending" && "border-accent bg-accent/5"
    )}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-mono text-sm">
          {status === "pending" && (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-accent" />
              TRANSACTION PENDING
            </>
          )}
          {status === "success" && (
            <>
              <CheckCircle2 className="w-4 h-4 text-primary" />
              TRANSACTION CONFIRMED
            </>
          )}
          {status === "error" && (
            <>
              <XCircle className="w-4 h-4 text-destructive" />
              TRANSACTION FAILED
            </>
          )}
        </CardTitle>
        <CardDescription className="font-mono text-xs">
          {status === "pending" && "Waiting for blockchain confirmation..."}
          {status === "success" && "Your transaction has been confirmed on-chain."}
          {status === "error" && "The transaction could not be completed."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hash && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-mono">Transaction Hash</span>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={copyHash}
                >
                  {copied ? (
                    <CheckCircle2 className="w-3 h-3 text-primary" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </Button>
                {getExplorerUrl(hash) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => window.open(getExplorerUrl(hash)!, "_blank")}
                  >
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
            <div className="font-mono text-xs break-all bg-secondary/50 p-2 rounded">
              {hash}
            </div>
          </div>
        )}

        {error && (
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground font-mono">Error Message</div>
            <div className="font-mono text-xs text-destructive bg-destructive/10 p-2 rounded">
              {error}
            </div>
          </div>
        )}

        {status === "success" && (
          <Badge variant="outline" className="w-full justify-center font-mono">
            ✓ Verified on {currentChain?.name || "Blockchain"}
          </Badge>
        )}

        {onClose && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="w-full font-mono text-xs"
          >
            Close
          </Button>
        )}
      </CardContent>
    </Card>
  );
}


