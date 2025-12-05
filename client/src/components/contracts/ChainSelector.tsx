import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWeb3, SUPPORTED_CHAINS } from "@/contexts/Web3Context";
import { Network, Loader2 } from "lucide-react";
import { useState } from "react";

export default function ChainSelector() {
  const { currentChain, switchChain, isSwitching, chainId } = useWeb3();
  const [selectedChain, setSelectedChain] = useState<string>("");

  const handleChainChange = async (chainKey: string) => {
    setSelectedChain(chainKey);
    await switchChain(chainKey);
  };

  const getCurrentChainKey = () => {
    if (!chainId) return "";
    const chain = Object.entries(SUPPORTED_CHAINS).find(
      ([_, config]) => config.id === chainId
    );
    return chain ? chain[0] : "";
  };

  return (
    <div className="flex items-center gap-2">
      <Network className="w-4 h-4 text-muted-foreground" />
      <Select
        value={selectedChain || getCurrentChainKey()}
        onValueChange={handleChainChange}
        disabled={isSwitching}
      >
        <SelectTrigger className="w-[180px] font-mono text-xs">
          <SelectValue placeholder="Select chain">
            {isSwitching ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Switching...</span>
              </div>
            ) : currentChain ? (
              currentChain.name
            ) : (
              "Select Chain"
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {Object.entries(SUPPORTED_CHAINS).map(([key, chain]) => (
            <SelectItem key={key} value={key} className="font-mono text-xs">
              <div className="flex items-center justify-between w-full">
                <span>{chain.name}</span>
                {chainId === chain.id && (
                  <div className="w-2 h-2 bg-primary rounded-full ml-2" />
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}


