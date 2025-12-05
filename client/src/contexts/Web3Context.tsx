import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { BrowserProvider, JsonRpcProvider, Contract, formatUnits, parseUnits } from "ethers";
import { toast } from "sonner";
import { logError } from "@/lib/error-handler";

export interface ChainConfig {
  id: number;
  name: string;
  rpcUrl: string;
  blockExplorer?: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export const SUPPORTED_CHAINS: Record<string, ChainConfig> = {
  ethereum: {
    id: 1,
    name: "Ethereum",
    rpcUrl: "https://eth-mainnet.g.alchemy.com/v2/demo",
    blockExplorer: "https://etherscan.io",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  },
  sepolia: {
    id: 11155111,
    name: "Sepolia",
    rpcUrl: "https://eth-sepolia.g.alchemy.com/v2/demo",
    blockExplorer: "https://sepolia.etherscan.io",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  },
  polygon: {
    id: 137,
    name: "Polygon",
    rpcUrl: "https://polygon-rpc.com",
    blockExplorer: "https://polygonscan.com",
    nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
  },
  mumbai: {
    id: 80001,
    name: "Mumbai",
    rpcUrl: "https://rpc-mumbai.maticvigil.com",
    blockExplorer: "https://mumbai.polygonscan.com",
    nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
  },
  arbitrum: {
    id: 42161,
    name: "Arbitrum",
    rpcUrl: "https://arb1.arbitrum.io/rpc",
    blockExplorer: "https://arbiscan.io",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  },
  optimism: {
    id: 10,
    name: "Optimism",
    rpcUrl: "https://mainnet.optimism.io",
    blockExplorer: "https://optimistic.etherscan.io",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  },
  base: {
    id: 8453,
    name: "Base",
    rpcUrl: "https://mainnet.base.org",
    blockExplorer: "https://basescan.org",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  },
};

export interface TransactionStatus {
  hash?: string;
  status: "idle" | "pending" | "success" | "error";
  error?: string;
}

interface Web3ContextType {
  // Connection state
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  provider: BrowserProvider | JsonRpcProvider | null;
  signer: any | null;
  
  // Chain management
  currentChain: ChainConfig | null;
  switchChain: (chainKey: string) => Promise<void>;
  
  // Wallet operations
  connect: () => Promise<void>;
  disconnect: () => void;
  
  // Contract operations
  getContract: (address: string, abi: any[]) => Contract | null;
  
  // Balance
  balance: string | null;
  refreshBalance: () => Promise<void>;
  
  // Transaction management
  sendTransaction: (to: string, value: string) => Promise<TransactionStatus>;
  
  // Loading states
  isConnecting: boolean;
  isSwitching: boolean;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export function Web3Provider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | JsonRpcProvider | null>(null);
  const [signer, setSigner] = useState<any | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  const currentChain = chainId
    ? Object.values(SUPPORTED_CHAINS).find((chain) => chain.id === chainId) || null
    : null;

  // Check if wallet is already connected
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window.ethereum !== "undefined") {
        try {
          const accounts = await window.ethereum.request({ method: "eth_accounts" });
          if (accounts.length > 0) {
            await connectWallet();
          }
        } catch (error) {
          logError(error as Error, { component: 'Web3Context', method: 'checkConnection' });
        }
      }
    };

    checkConnection();
  }, []);

  // Listen for account changes
  useEffect(() => {
    const ethereum = window.ethereum;
    if (typeof ethereum !== "undefined") {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnect();
        } else {
          setAddress(accounts[0]);
        }
      };

      const handleChainChanged = (chainIdHex: string) => {
        const chainId = parseInt(chainIdHex, 16);
        setChainId(chainId);
        if (provider) {
          refreshBalance();
        }
      };

      ethereum.on("accountsChanged", handleAccountsChanged);
      ethereum.on("chainChanged", handleChainChanged);

      return () => {
        ethereum.removeListener("accountsChanged", handleAccountsChanged);
        ethereum.removeListener("chainChanged", handleChainChanged);
      };
    }
  }, [provider]);

  const connectWallet = async () => {
    if (typeof window.ethereum === "undefined") {
      toast.error("No wallet detected. Please install MetaMask or another Web3 wallet.");
      return;
    }

    try {
      setIsConnecting(true);
      const browserProvider = new BrowserProvider(window.ethereum);
      const accounts = await browserProvider.send("eth_requestAccounts", []);
      const signer = await browserProvider.getSigner();
      const network = await browserProvider.getNetwork();

      setProvider(browserProvider);
      setSigner(signer);
      setAddress(accounts[0]);
      setChainId(Number(network.chainId));
      setIsConnected(true);

      // Get initial balance
      await refreshBalance();

      toast.success("Wallet connected successfully");
    } catch (error: any) {
      logError(error as Error, { component: 'Web3Context', method: 'connectWallet' });
      if (error.code === 4001) {
        toast.error("Connection rejected by user");
      } else {
        toast.error("Failed to connect wallet");
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const connect = connectWallet;

  const disconnect = () => {
    setProvider(null);
    setSigner(null);
    setAddress(null);
    setChainId(null);
    setBalance(null);
    setIsConnected(false);
    toast.info("Wallet disconnected");
  };

  const switchChain = async (chainKey: string) => {
    const targetChain = SUPPORTED_CHAINS[chainKey];
    if (!targetChain) {
      toast.error(`Unsupported chain: ${chainKey}`);
      return;
    }

    if (typeof window.ethereum === "undefined") {
      toast.error("No wallet detected");
      return;
    }

    try {
      setIsSwitching(true);
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${targetChain.id.toString(16)}` }],
      });
      setChainId(targetChain.id);
      toast.success(`Switched to ${targetChain.name}`);
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: `0x${targetChain.id.toString(16)}`,
                chainName: targetChain.name,
                nativeCurrency: targetChain.nativeCurrency,
                rpcUrls: [targetChain.rpcUrl],
                blockExplorerUrls: targetChain.blockExplorer ? [targetChain.blockExplorer] : [],
              },
            ],
          });
          setChainId(targetChain.id);
          toast.success(`Added and switched to ${targetChain.name}`);
        } catch (addError) {
          logError(addError as Error, { component: 'Web3Context', method: 'switchChain', action: 'addChain' });
          toast.error("Failed to add chain to wallet");
        }
      } else {
        logError(switchError as Error, { component: 'Web3Context', method: 'switchChain' });
        toast.error("Failed to switch chain");
      }
    } finally {
      setIsSwitching(false);
    }
  };

  const refreshBalance = async () => {
    if (!provider || !address) return;

    try {
      const balance = await provider.getBalance(address);
      const formatted = formatUnits(balance, currentChain?.nativeCurrency.decimals || 18);
      setBalance(parseFloat(formatted).toFixed(4));
    } catch (error) {
      logError(error as Error, { component: 'Web3Context', method: 'refreshBalance' });
    }
  };

  const getContract = (address: string, abi: any[]): Contract | null => {
    if (!provider || !signer) return null;
    try {
      return new Contract(address, abi, signer);
    } catch (error) {
      logError(error as Error, { component: 'Web3Context', method: 'getContract', address });
      return null;
    }
  };

  const sendTransaction = async (
    to: string,
    value: string
  ): Promise<TransactionStatus> => {
    if (!signer || !currentChain) {
      return { status: "error", error: "Wallet not connected" };
    }

    try {
      const tx = await signer.sendTransaction({
        to,
        value: parseUnits(value, currentChain.nativeCurrency.decimals),
      });

      return {
        hash: tx.hash,
        status: "pending",
      };
    } catch (error: any) {
      logError(error as Error, { component: 'Web3Context', method: 'sendTransaction', to, value });
      return {
        status: "error",
        error: error.message || "Transaction failed",
      };
    }
  };

  // Refresh balance periodically
  useEffect(() => {
    if (isConnected && address) {
      refreshBalance();
      const interval = setInterval(refreshBalance, 30000); // Every 30 seconds
      return () => clearInterval(interval);
    }
  }, [isConnected, address, provider]);

  return (
    <Web3Context.Provider
      value={{
        isConnected,
        address,
        chainId,
        provider,
        signer,
        currentChain,
        switchChain,
        connect,
        disconnect,
        getContract,
        balance,
        refreshBalance,
        sendTransaction,
        isConnecting,
        isSwitching,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3() {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error("useWeb3 must be used within a Web3Provider");
  }
  return context;
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, handler: (...args: any[]) => void) => void;
      removeListener: (event: string, handler: (...args: any[]) => void) => void;
      isMetaMask?: boolean;
    };
  }
}

