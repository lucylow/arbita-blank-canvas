import { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  ChevronDown, 
  ChevronUp,
  Copy,
  ExternalLink
} from 'lucide-react';
import { useSecurityScan } from '@/hooks/useSecurityScan';
import { Vulnerability } from '@/data/mockData';
import { sampleCodeExamples } from '@/data/mockData';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const severityColors = {
  critical: 'bg-red-500/20 text-red-400 border-red-500/50',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
  low: 'bg-blue-500/20 text-blue-400 border-blue-500/50'
};

export default function CodeDemo() {
  const [code, setCode] = useState(sampleCodeExamples.javascript);
  const [language, setLanguage] = useState('javascript');
  const [expandedVulns, setExpandedVulns] = useState<Set<string>>(new Set());
  const { isScanning, progress, result, scanCode, reset } = useSecurityScan();

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    setCode(sampleCodeExamples[lang as keyof typeof sampleCodeExamples] || sampleCodeExamples.javascript);
    reset();
  };

  const handleScan = () => {
    scanCode(code, language);
  };

  const toggleVuln = (id: string) => {
    const newExpanded = new Set(expandedVulns);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedVulns(newExpanded);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const getSeverityIcon = (severity: Vulnerability['severity']) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-4 h-4" />;
      case 'high':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  return (
    <section id="demo" className="py-24 bg-[#0a0f22]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-[#59d7b5] to-[#5f6dfa] bg-clip-text text-transparent font-mono">
            Real-Time Security Analysis
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Paste your code and watch multiple LLMs analyze it in real-time
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Code Editor */}
          <Card className="bg-[#1a1f3a] border-[#59d7b5]/20 p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <select
                  value={language}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="bg-[#0a0f22] border border-[#59d7b5]/30 text-white px-3 py-1.5 rounded font-mono text-sm"
                >
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="solidity">Solidity</option>
                </select>
              </div>
              <Button
                onClick={handleScan}
                disabled={isScanning || !code.trim()}
                className="bg-gradient-to-r from-[#59d7b5] to-[#5f6dfa] hover:from-[#59d7b5]/90 hover:to-[#5f6dfa]/90"
              >
                <Play className="w-4 h-4 mr-2" />
                {isScanning ? 'Scanning...' : 'Run Security Scan'}
              </Button>
            </div>

            <div className="border border-[#59d7b5]/20 rounded overflow-hidden">
              <Editor
                height="400px"
                language={language}
                value={code}
                onChange={(value) => setCode(value || '')}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2,
                  wordWrap: 'on'
                }}
              />
            </div>

            {/* Progress Bar */}
            {isScanning && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400 font-mono">{progress.message}</span>
                  <span className="text-sm text-[#59d7b5] font-mono">{progress.progress}%</span>
                </div>
                <Progress value={progress.progress} className="h-2" />
              </motion.div>
            )}
          </Card>

          {/* Results Panel */}
          <Card className="bg-[#1a1f3a] border-[#59d7b5]/20 p-6">
            {!result && !isScanning && (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
                <div className="w-16 h-16 bg-[#59d7b5]/10 rounded-full flex items-center justify-center mb-4">
                  <Info className="w-8 h-8 text-[#59d7b5]" />
                </div>
                <p className="text-gray-400 font-mono">Run a security scan to see results</p>
              </div>
            )}

            {isScanning && (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-16 h-16 border-4 border-[#59d7b5]/30 border-t-[#59d7b5] rounded-full mb-4"
                />
                <p className="text-[#59d7b5] font-mono">{progress.message}</p>
              </div>
            )}

            {result && !isScanning && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Security Score */}
                <div className="text-center p-6 bg-gradient-to-r from-[#59d7b5]/10 to-[#5f6dfa]/10 rounded-lg border border-[#59d7b5]/30">
                  <div className="text-5xl font-bold text-[#59d7b5] font-mono mb-2">
                    {result.score}
                  </div>
                  <div className="text-sm text-gray-400 font-mono">Security Score</div>
                </div>

                {/* Vulnerabilities */}
                <div>
                  <h3 className="text-lg font-bold text-white mb-4 font-mono">
                    Vulnerabilities Found ({result.vulnerabilities.length})
                  </h3>
                  <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    <AnimatePresence>
                      {result.vulnerabilities.map((vuln) => (
                        <motion.div
                          key={vuln.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className={cn(
                            'border rounded-lg p-4 cursor-pointer transition-all',
                            severityColors[vuln.severity],
                            expandedVulns.has(vuln.id) && 'bg-opacity-30'
                          )}
                          onClick={() => toggleVuln(vuln.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                              {getSeverityIcon(vuln.severity)}
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge
                                    variant="outline"
                                    className={cn('font-mono text-xs', severityColors[vuln.severity])}
                                  >
                                    {vuln.severity.toUpperCase()}
                                  </Badge>
                                  <span className="text-xs text-gray-400 font-mono">{vuln.location}</span>
                                </div>
                                <h4 className="font-bold text-white mb-1 font-mono">{vuln.type.replace('_', ' ').toUpperCase()}</h4>
                                <p className="text-sm text-gray-300">{vuln.description}</p>
                                
                                {expandedVulns.has(vuln.id) && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mt-4 pt-4 border-t border-white/10"
                                  >
                                    <div className="mb-3">
                                      <div className="text-xs text-gray-400 mb-2 font-mono">SUGGESTED FIX:</div>
                                      <code className="block bg-black/30 p-3 rounded text-xs text-[#59d7b5] font-mono whitespace-pre-wrap">
                                        {vuln.suggestedFix}
                                      </code>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                      <div>
                                        <span className="text-gray-400 font-mono">LLM Consensus: </span>
                                        <span className="text-[#59d7b5] font-mono">{vuln.llmConsensus}%</span>
                                      </div>
                                      <div className="flex gap-1">
                                        {vuln.modelsFound.map((model) => (
                                          <Badge key={model} variant="outline" className="text-xs font-mono">
                                            {model}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </div>
                            </div>
                            <button className="ml-2">
                              {expandedVulns.has(vuln.id) ? (
                                <ChevronUp className="w-5 h-5 text-gray-400" />
                              ) : (
                                <ChevronDown className="w-5 h-5 text-gray-400" />
                              )}
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>

                {/* LLM Consensus Summary */}
                <div className="p-4 bg-[#0a0f22] rounded-lg border border-[#59d7b5]/20">
                  <div className="text-sm text-gray-400 mb-2 font-mono">LLM MODELS USED:</div>
                  <div className="flex gap-2 flex-wrap">
                    {['gpt-4', 'claude-3', 'gemini'].map((model) => (
                      <Badge key={model} variant="outline" className="font-mono">
                        {model}
                      </Badge>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </Card>
        </div>
      </div>
    </section>
  );
}

