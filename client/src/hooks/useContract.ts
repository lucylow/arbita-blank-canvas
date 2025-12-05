import { useEffect, useState } from "react";
import { Contract } from "ethers";
import { useWeb3 } from "@/contexts/Web3Context";
import { Web3ContractClient, defaultAttestationAnchorConfig } from "@/lib/web3-contract-client";
import { logError } from "@/lib/error-handler";
import { normalizeError } from "../../../shared/errors";

export function useContract(contractAddress?: string) {
  const { getContract, isConnected } = useWeb3();
  const [contractClient, setContractClient] = useState<Web3ContractClient | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const address = contractAddress || defaultAttestationAnchorConfig.address;

  useEffect(() => {
    if (isConnected && getContract) {
      try {
        const contractInstance = getContract(address, defaultAttestationAnchorConfig.abi);
        if (contractInstance) {
          setContract(contractInstance);
          try {
            const client = new Web3ContractClient(
              { ...defaultAttestationAnchorConfig, address },
              contractInstance
            );
            setContractClient(client);
            setError(null);
          } catch (clientError) {
            const normalized = normalizeError(clientError);
            logError(normalized, { 
              hook: 'useContract', 
              method: 'Web3ContractClient construction',
              address 
            });
            setError(normalized);
            setContractClient(null);
          }
        } else {
          setContract(null);
          setContractClient(null);
          setError(null);
        }
      } catch (err) {
        const normalized = normalizeError(err);
        logError(normalized, { 
          hook: 'useContract', 
          method: 'getContract',
          address 
        });
        setError(normalized);
        setContract(null);
        setContractClient(null);
      }
    } else {
      setContract(null);
      setContractClient(null);
      setError(null);
    }
  }, [isConnected, address, getContract]);

  return {
    contract,
    contractClient,
    isReady: contractClient !== null && isConnected,
    error,
  };
}

