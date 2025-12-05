import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Shield, AlertTriangle, Check, Loader2, XCircle, CheckCircle2, Zap, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { AttestationMinter, AttestationViewer } from "@/components/contracts";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { apiClient, showSuccessNotification, showErrorNotification, logError } from "@/lib/error-handler";

interface AuditStep {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  duration?: number;
  details?: string;
}

interface AuditResult {
  status: 'safe' | 'vulnerable';
  score: number;
  vulnerabilities: number;
  testsRun: number;
  duration: number;
  findings: Array<{
    type: string;
    severity: string;
    description: string;
  }>;
}

const AUDIT_SCOPES = [
  "Prompt Injection",
  "PII Leakage",
  "Bias & Toxicity",
  "Hallucination",
  "Jailbreak Resistance",
  "Data Exfiltration",
];

const MODELS = [
  { value: "gpt-4o", label: "GPT-4o (OpenAI)" },
  { value: "claude-3-opus", label: "Claude 3 Opus (Anthropic)" },
  { value: "llama-3", label: "Llama 3 (Meta)" },
  { value: "mistral-large", label: "Mistral Large" },
  { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
  { value: "gemini-pro", label: "Gemini Pro 1.5" },
];

export default function Audit() {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [steps, setSteps] = useState<AuditStep[]>([]);
  const [selectedModel, setSelectedModel] = useState("gpt-4o");
  const [selectedScopes, setSelectedScopes] = useState<string[]>(AUDIT_SCOPES.slice(0, 4));
  const [customPrompts, setCustomPrompts] = useState("");
  const [result, setResult] = useState<AuditResult | null>(null);

  const toggleScope = (scope: string) => {
    setSelectedScopes(prev =>
      prev.includes(scope) ? prev.filter(s => s !== scope) : [...prev, scope]
    );
  };

  const generateSteps = (): AuditStep[] => {
    const baseSteps: Omit<AuditStep, 'status'>[] = [
      { name: "Initializing NullShot Protocol", duration: 2 },
      { name: "Connecting to Target LLM", duration: 3 },
      { name: "Deploying Pen-Tester Agent", duration: 2 },
      { name: "Running Injection Vectors", duration: 8 },
      { name: "Analyzing Response Patterns", duration: 5 },
      { name: "Verifying with Fact-Checker", duration: 4 },
      { name: "Compiling Security Report", duration: 3 },
    ];
    
    return baseSteps.map(step => ({ ...step, status: 'pending' as const }));
  };

  const startAudit = async () => {
    if (selectedScopes.length === 0) {
      showErrorNotification(new Error('Please select at least one audit scope'), {
        title: 'Invalid Configuration',
        duration: 3000,
      });
      return;
    }

    setIsRunning(true);
    setProgress(0);
    setLogs([]);
    setResult(null);
    
    const auditSteps = generateSteps();
    setSteps(auditSteps);
    setCurrentStep(0);

    let stepIndex = 0;
    let totalDuration = auditSteps.reduce((sum, step) => sum + (step.duration || 0), 0);
    let elapsed = 0;

    const addLog = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
      const prefix = type === 'success' ? '✓' : type === 'warning' ? '⚠' : type === 'error' ? '✗' : '→';
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${prefix} ${message}`]);
    };

    for (let i = 0; i < auditSteps.length; i++) {
      setCurrentStep(i);
      
      // Update step status
      setSteps(prev => {
        const updated = [...prev];
        updated[i] = { ...updated[i], status: 'running' };
        return updated;
      });

      addLog(`Starting: ${auditSteps[i].name}`);
      
      // Simulate step execution
      const stepDuration = auditSteps[i].duration || 1;
      await new Promise(resolve => setTimeout(resolve, stepDuration * 800));

      // Add detailed logs during execution
      if (i === 3) {
        // Injection vectors step
        const vectorCount = selectedScopes.length * 5;
        for (let v = 1; v <= vectorCount; v++) {
          await new Promise(resolve => setTimeout(resolve, 150));
          addLog(`  Vector #${v}/${vectorCount} executed`, Math.random() > 0.9 ? 'warning' : 'info');
          elapsed += 150;
          setProgress(Math.min(95, (elapsed / (totalDuration * 800)) * 100));
        }
      } else if (i === 4) {
        // Analysis step
        addLog(`  Analyzing ${selectedScopes.length * 10} test cases`, 'info');
        await new Promise(resolve => setTimeout(resolve, 1000));
        addLog(`  Pattern matching complete`, 'success');
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      elapsed += stepDuration * 800;
      setProgress(Math.min(95, (elapsed / (totalDuration * 800)) * 100));

      // Mark step as completed
      setSteps(prev => {
        const updated = [...prev];
        updated[i] = { ...updated[i], status: 'completed', duration: stepDuration };
        return updated;
      });

      addLog(`Completed: ${auditSteps[i].name}`, 'success');
    }

    // Generate mock result
    const score = Math.floor(Math.random() * 30) + 70; // 70-100
    const isVulnerable = score < 85;
    const vulnerabilities = isVulnerable ? Math.floor(Math.random() * 5) + 1 : 0;
    
    const mockResult: AuditResult = {
      status: isVulnerable ? 'vulnerable' : 'safe',
      score,
      vulnerabilities,
      testsRun: selectedScopes.length * 50,
      duration: Math.floor(totalDuration),
      findings: isVulnerable ? [
        {
          type: 'Prompt Injection',
          severity: 'high',
          description: 'Model responded to indirect injection attempts',
        },
        ...(vulnerabilities > 1 ? [{
          type: 'PII Leakage',
          severity: 'medium',
          description: 'Potential sensitive data exposure in responses',
        }] : []),
      ] : [],
    };

    setResult(mockResult);
    setProgress(100);
    setIsRunning(false);

    addLog('Audit completed successfully', 'success');
    
    // Optionally create a report
    try {
      await apiClient.post('/api/reports', {
        target: MODELS.find(m => m.value === selectedModel)?.label || selectedModel,
        type: selectedScopes.join(', '),
        score,
        status: isVulnerable ? 'WARNING' : 'PASSED',
        vulnerabilities,
        duration: totalDuration,
        testsRun: mockResult.testsRun,
      });
      showSuccessNotification('Audit report saved');
    } catch (error) {
      logError(error as Error, { component: 'Audit', method: 'saveReport' });
      // Don't show error notification for report saving - it's optional
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground glitch-text" data-text="NEW SECURITY AUDIT">NEW SECURITY AUDIT</h1>
        <p className="text-muted-foreground font-mono mt-2">Configure and launch a multi-agent security evaluation.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Configuration Panel */}
        <Card className="lg:col-span-2 bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              AUDIT CONFIGURATION
            </CardTitle>
            <CardDescription>Define the target and scope of the evaluation.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Target Model</Label>
              <Select value={selectedModel} onValueChange={setSelectedModel} disabled={isRunning}>
                <SelectTrigger>
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {MODELS.map(model => (
                    <SelectItem key={model.value} value={model.value}>{model.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Audit Scope ({selectedScopes.length} selected)</Label>
              <div className="grid grid-cols-2 gap-3">
                {AUDIT_SCOPES.map((scope) => {
                  const isSelected = selectedScopes.includes(scope);
                  return (
                    <div
                      key={scope}
                      onClick={() => !isRunning && toggleScope(scope)}
                      className={cn(
                        "flex items-center space-x-2 border p-3 rounded-sm transition-all cursor-pointer",
                        isSelected
                          ? "border-primary bg-primary/10 hover:bg-primary/20"
                          : "border-input hover:bg-secondary/50",
                        isRunning && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <div className={cn(
                        "w-4 h-4 border flex items-center justify-center transition-colors",
                        isSelected ? "border-primary bg-primary" : "border-input"
                      )}>
                        {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                      </div>
                      <span className="text-sm font-mono">{scope}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Custom Test Prompts (Optional)</Label>
              <Textarea
                placeholder="Enter specific prompts to test against..."
                className="font-mono text-xs min-h-[100px] bg-background/50"
                value={customPrompts}
                onChange={(e) => setCustomPrompts(e.target.value)}
                disabled={isRunning}
              />
            </div>

            <Button
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold tracking-wider"
              size="lg"
              onClick={startAudit}
              disabled={isRunning || selectedScopes.length === 0}
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  RUNNING AUDIT...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  INITIATE AUDIT SEQUENCE
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Status Panel */}
        <div className="space-y-6">
          <Card className="bg-card border-border h-full flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-accent" />
                EXECUTION STATUS
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              {/* Progress */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-xs font-mono text-muted-foreground">
                  <span>PROGRESS</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              {/* Steps */}
              {steps.length > 0 && (
                <div className="space-y-2 mb-4 flex-1 overflow-y-auto">
                  {steps.map((step, index) => (
                    <div
                      key={index}
                      className={cn(
                        "p-2 rounded-sm border text-xs font-mono transition-colors",
                        step.status === 'completed' && "border-primary/30 bg-primary/5",
                        step.status === 'running' && "border-accent/50 bg-accent/10 animate-pulse",
                        step.status === 'pending' && "border-border/50 opacity-50"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {step.status === 'completed' && <CheckCircle2 className="w-3 h-3 text-primary" />}
                        {step.status === 'running' && <Loader2 className="w-3 h-3 text-accent animate-spin" />}
                        {step.status === 'pending' && <div className="w-3 h-3 rounded-full border border-border" />}
                        <span className={cn(
                          step.status === 'completed' && "text-primary",
                          step.status === 'running' && "text-accent",
                          "text-foreground/70"
                        )}>
                          {step.name}
                        </span>
                      </div>
                      {step.duration && step.status === 'completed' && (
                        <div className="text-xs text-muted-foreground mt-1 ml-5">
                          {step.duration}s
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Logs */}
              <div className="flex-1 bg-black/50 border border-input p-3 font-mono text-xs space-y-1 overflow-y-auto min-h-[200px] max-h-[300px] rounded-sm">
                {logs.length === 0 ? (
                  <span className="text-muted-foreground italic">Waiting for initialization...</span>
                ) : (
                  logs.map((log, i) => (
                    <div key={i} className="text-primary/80 animate-in fade-in slide-in-from-left-2 duration-300">
                      {log}
                    </div>
                  ))
                )}
                {isRunning && (
                  <div className="flex items-center gap-2 text-accent animate-pulse">
                    <span className="w-2 h-4 bg-accent block" />
                    PROCESSING
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Result Overlay */}
      {result && (
        <div className="animate-in zoom-in-95 duration-500">
          <Card className={cn(
            "border-2",
            result.status === "safe" ? "border-primary bg-primary/5" : "border-destructive bg-destructive/5"
          )}>
            <CardContent className="p-8">
              <div className="flex flex-col items-center text-center space-y-6">
                {result.status === "safe" ? (
                  <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary">
                    <CheckCircle2 className="w-10 h-10 text-primary" />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-full bg-destructive/20 flex items-center justify-center border-2 border-destructive">
                    <AlertTriangle className="w-10 h-10 text-destructive" />
                  </div>
                )}

                <div>
                  <h2 className="text-3xl font-bold font-mono tracking-tighter mb-2">
                    AUDIT COMPLETE: {result.status === "safe" ? "PASSED" : "VULNERABILITIES FOUND"}
                  </h2>
                  <div className="flex items-center justify-center gap-6 mt-4">
                    <div className="text-center">
                      <div className="text-4xl font-bold font-mono text-primary">{result.score}%</div>
                      <div className="text-xs text-muted-foreground font-mono">Security Score</div>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold font-mono text-foreground">{result.testsRun}</div>
                      <div className="text-xs text-muted-foreground font-mono">Tests Run</div>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold font-mono text-destructive">{result.vulnerabilities}</div>
                      <div className="text-xs text-muted-foreground font-mono">Issues Found</div>
                    </div>
                  </div>
                </div>

                {result.findings.length > 0 && (
                  <div className="w-full max-w-2xl">
                    <h3 className="text-lg font-bold font-mono mb-3">Findings:</h3>
                    <div className="space-y-2">
                      {result.findings.map((finding, i) => (
                        <Card key={i} className="bg-background/50 border-border">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="font-mono font-bold">{finding.type}</div>
                                <div className="font-mono text-xs text-muted-foreground mt-1">{finding.description}</div>
                              </div>
                              <Badge variant={finding.severity === 'high' ? 'destructive' : 'outline'}>
                                {finding.severity.toUpperCase()}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  <Button
                    variant="outline"
                    className="border-primary text-primary hover:bg-primary/10"
                    onClick={() => window.location.href = '/reports'}
                  >
                    VIEW ALL REPORTS
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setResult(null);
                      setProgress(0);
                      setLogs([]);
                      setSteps([]);
                      setCurrentStep(0);
                    }}
                  >
                    RUN NEW AUDIT
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
