import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useWeb3 } from "@/contexts/Web3Context";
import { Wallet, LogOut, Copy, Check, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function WalletConnect() {
  const {
    isConnected,
    address,
    connect,
    disconnect,
    balance,
    currentChain,
    isConnecting,
  } = useWeb3();
  const [copied, setCopied] = useState(false);

  const copyAddress = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      toast.success("Address copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy address");
    }
  };

  const formatAddress = (addr: string | null) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const getExplorerUrl = (address: string) => {
    if (!currentChain?.blockExplorer) return null;
    return `${currentChain.blockExplorer}/address/${address}`;
  };

  if (!isConnected) {
    return (
      <Button
        onClick={connect}
        disabled={isConnecting}
        className="font-mono transition-all duration-300 hover:scale-105 hover:border-primary/80"
        variant="outline"
      >
        <Wallet className="w-4 h-4 mr-2" />
        {isConnecting ? "Connecting..." : "Connect Wallet"}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="font-mono transition-all duration-300 hover:scale-105 hover:border-primary/80">
          <div className="w-2 h-2 bg-primary rounded-full mr-2 animate-pulse" />
          {formatAddress(address)}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="font-mono text-xs">
          WALLET CONNECTED
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <div className="px-2 py-1.5 space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Address</span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={copyAddress}
              >
                {copied ? (
                  <Check className="w-3 h-3 text-primary" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </Button>
              {getExplorerUrl(address!) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => window.open(getExplorerUrl(address!)!, "_blank")}
                >
                  <ExternalLink className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
          <div className="font-mono text-xs break-all bg-secondary/50 p-2 rounded">
            {address}
          </div>
        </div>

        {currentChain && (
          <div className="px-2 py-1.5 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Network</span>
              <span className="font-mono">{currentChain.name}</span>
            </div>
          </div>
        )}

        {balance !== null && (
          <div className="px-2 py-1.5 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Balance</span>
              <span className="font-mono">
                {balance} {currentChain?.nativeCurrency.symbol || "ETH"}
              </span>
            </div>
          </div>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={disconnect}
          className="text-destructive focus:text-destructive font-mono text-xs"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

