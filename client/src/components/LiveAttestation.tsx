import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Copy, ExternalLink, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Attestation {
  id: string;
  chain: 'avalanche' | 'base' | 'solana';
  txHash: string;
  timestamp: string;
  status: 'pending' | 'success' | 'failed';
  score: number;
}

const chainConfig = {
  avalanche: {
    name: 'Avalanche',
    color: 'from-red-500 to-orange-500',
    explorer: 'https://snowtrace.io/tx/'
  },
  base: {
    name: 'Base',
    color: 'from-blue-500 to-cyan-500',
    explorer: 'https://basescan.org/tx/'
  },
  solana: {
    name: 'Solana',
    color: 'from-purple-500 to-pink-500',
    explorer: 'https://solscan.io/tx/'
  }
};

export default function LiveAttestation() {
  const [selectedChain, setSelectedChain] = useState<'avalanche' | 'base' | 'solana'>('base');
  const [attestations, setAttestations] = useState<Attestation[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateMockAttestation = async () => {
    setIsGenerating(true);
    
    // Simulate pending state
    const pendingAttestation: Attestation = {
      id: `attest-${Date.now()}`,
      chain: selectedChain,
      txHash: '',
      timestamp: new Date().toISOString(),
      status: 'pending',
      score: Math.floor(Math.random() * 20) + 80
    };

    setAttestations(prev => [pendingAttestation, ...prev]);

    // Simulate transaction processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Generate mock transaction hash
    const txHash = '0x' + Array.from({ length: 64 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');

    // Update with success
    setAttestations(prev => prev.map(att => 
      att.id === pendingAttestation.id 
        ? { ...att, txHash, status: 'success' as const }
        : att
    ));

    setIsGenerating(false);
    toast.success('Attestation minted successfully!');
  };

  const copyTxHash = (txHash: string) => {
    navigator.clipboard.writeText(txHash);
    toast.success('Transaction hash copied!');
  };

  const openExplorer = (chain: keyof typeof chainConfig, txHash: string) => {
    const explorer = chainConfig[chain].explorer;
    window.open(explorer + txHash, '_blank');
  };

  const formatAddress = (hash: string) => {
    if (!hash) return 'Pending...';
    return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
  };

  return (
    <section className="py-24 bg-[#0a0f22]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-[#59d7b5] to-[#5f6dfa] bg-clip-text text-transparent font-mono">
            Live Blockchain Attestation
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Real-time security audit attestations on multiple blockchains
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chain Selector & Generator */}
          <Card className="bg-[#1a1f3a] border-[#59d7b5]/20 p-6">
            <h3 className="text-xl font-bold text-white mb-6 font-mono">Select Chain</h3>
            
            <div className="space-y-3 mb-6">
              {(Object.keys(chainConfig) as Array<keyof typeof chainConfig>).map((chain) => (
                <button
                  key={chain}
                  onClick={() => setSelectedChain(chain)}
                  className={cn(
                    'w-full p-4 rounded-lg border-2 transition-all text-left',
                    selectedChain === chain
                      ? `border-[#59d7b5] bg-gradient-to-r ${chainConfig[chain].color} bg-opacity-20`
                      : 'border-[#59d7b5]/20 hover:border-[#59d7b5]/40'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white font-mono">{chainConfig[chain].name}</div>
                      <div className="text-xs text-gray-400 mt-1">Layer 1 Blockchain</div>
                    </div>
                    {selectedChain === chain && (
                      <CheckCircle className="w-5 h-5 text-[#59d7b5]" />
                    )}
                  </div>
                </button>
              ))}
            </div>

            <Button
              onClick={generateMockAttestation}
              disabled={isGenerating}
              className="w-full bg-gradient-to-r from-[#59d7b5] to-[#5f6dfa] hover:from-[#59d7b5]/90 hover:to-[#5f6dfa]/90 font-mono"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Minting...
                </>
              ) : (
                'Generate Attestation'
              )}
            </Button>
          </Card>

          {/* Attestations List */}
          <Card className="lg:col-span-2 bg-[#1a1f3a] border-[#59d7b5]/20 p-6">
            <h3 className="text-xl font-bold text-white mb-6 font-mono">Recent Attestations</h3>
            
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              <AnimatePresence>
                {attestations.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 font-mono">
                    No attestations yet. Generate one to get started!
                  </div>
                ) : (
                  attestations.map((attestation) => (
                    <motion.div
                      key={attestation.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className={cn(
                        'p-4 rounded-lg border',
                        attestation.status === 'success' && 'bg-[#0a0f22] border-[#59d7b5]/30',
                        attestation.status === 'pending' && 'bg-[#0a0f22] border-yellow-500/30',
                        attestation.status === 'failed' && 'bg-[#0a0f22] border-red-500/30'
                      )}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'w-12 h-12 rounded-lg bg-gradient-to-r flex items-center justify-center',
                            `bg-gradient-to-r ${chainConfig[attestation.chain].color}`
                          )}>
                            <span className="text-white font-bold font-mono text-xs">
                              {chainConfig[attestation.chain].name.slice(0, 3).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="font-bold text-white font-mono">{chainConfig[attestation.chain].name}</div>
                            <div className="text-xs text-gray-400 font-mono">
                              {new Date(attestation.timestamp).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            'font-mono',
                            attestation.status === 'success' && 'border-[#59d7b5] text-[#59d7b5]',
                            attestation.status === 'pending' && 'border-yellow-500 text-yellow-500',
                            attestation.status === 'failed' && 'border-red-500 text-red-500'
                          )}
                        >
                          {attestation.status === 'pending' && (
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          )}
                          {attestation.status === 'success' && (
                            <CheckCircle className="w-3 h-3 mr-1" />
                          )}
                          {attestation.status === 'failed' && (
                            <XCircle className="w-3 h-3 mr-1" />
                          )}
                          {attestation.status.toUpperCase()}
                        </Badge>
                      </div>

                      {attestation.status === 'pending' && (
                        <div className="mb-4">
                          <div className="h-2 bg-[#0a0f22] rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-gradient-to-r from-[#59d7b5] to-[#5f6dfa]"
                              initial={{ width: '0%' }}
                              animate={{ width: '100%' }}
                              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                            />
                          </div>
                        </div>
                      )}

                      {attestation.txHash && (
                        <div className="mb-4 p-3 bg-[#0a0f22] rounded border border-[#59d7b5]/20">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="text-xs text-gray-400 mb-1 font-mono">Transaction Hash</div>
                              <code className="text-sm text-[#59d7b5] font-mono break-all">
                                {formatAddress(attestation.txHash)}
                              </code>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyTxHash(attestation.txHash)}
                                className="h-8 w-8 p-0"
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openExplorer(attestation.chain, attestation.txHash)}
                                className="h-8 w-8 p-0"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs text-gray-400 font-mono">Security Score</div>
                          <div className="text-2xl font-bold text-[#59d7b5] font-mono">{attestation.score}</div>
                        </div>
                        {attestation.status === 'success' && (
                          <div className="flex items-center gap-2 text-sm text-[#59d7b5] font-mono">
                            <CheckCircle className="w-4 h-4" />
                            Attested on-chain
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}


