import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Play, Shield, AlertTriangle, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Audit() {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [result, setResult] = useState<null | "safe" | "vulnerable">(null);

  const startAudit = () => {
    setIsRunning(true);
    setProgress(0);
    setLogs([]);
    setResult(null);

    const steps = [
      "Initializing NullShot Protocol...",
      "Connecting to Target LLM...",
      "Deploying Pen-Tester Agent...",
      "Running Injection Vector #1...",
      "Running Injection Vector #2...",
      "Analyzing Response Patterns...",
      "Verifying with Fact-Checker...",
      "Compiling Final Report..."
    ];

    let currentStep = 0;

    const interval = setInterval(() => {
      if (currentStep >= steps.length) {
        clearInterval(interval);
        setIsRunning(false);
        setResult("safe"); // Mock result
        return;
      }

      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${steps[currentStep]}`]);
      setProgress(((currentStep + 1) / steps.length) * 100);
      currentStep++;
    }, 800);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
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
              <Select defaultValue="gpt-4o">
                <SelectTrigger>
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4o">GPT-4o (OpenAI)</SelectItem>
                  <SelectItem value="claude-3-opus">Claude 3 Opus (Anthropic)</SelectItem>
                  <SelectItem value="llama-3">Llama 3 (Meta)</SelectItem>
                  <SelectItem value="mistral-large">Mistral Large</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Audit Scope</Label>
              <div className="grid grid-cols-2 gap-4">
                {["Prompt Injection", "PII Leakage", "Bias & Toxicity", "Hallucination"].map((scope) => (
                  <div key={scope} className="flex items-center space-x-2 border border-input p-3 hover:bg-secondary/50 transition-colors cursor-pointer">
                    <div className="w-4 h-4 border border-primary bg-primary/20 flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-sm font-mono">{scope}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Custom Test Prompts (Optional)</Label>
              <Textarea 
                placeholder="Enter specific prompts to test against..." 
                className="font-mono text-xs min-h-[100px] bg-background/50"
              />
            </div>

            <Button 
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold tracking-wider"
              size="lg"
              onClick={startAudit}
              disabled={isRunning}
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
                <AlertTriangle className="w-4 h-4 text-accent" />
                LIVE EXECUTION LOG
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="flex-1 bg-black/50 border border-input p-4 font-mono text-xs space-y-2 overflow-y-auto min-h-[300px] max-h-[500px]">
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

              {/* Progress Bar */}
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-xs font-mono text-muted-foreground">
                  <span>PROGRESS</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-2 bg-secondary w-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
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
            result === "safe" ? "border-primary bg-primary/5" : "border-destructive bg-destructive/5"
          )}>
            <CardContent className="p-8 flex flex-col items-center text-center space-y-4">
              {result === "safe" ? (
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary mb-4">
                  <Check className="w-8 h-8 text-primary" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center border-2 border-destructive mb-4">
                  <AlertTriangle className="w-8 h-8 text-destructive" />
                </div>
              )}
              
              <h2 className="text-3xl font-bold font-mono tracking-tighter">
                AUDIT COMPLETE: {result === "safe" ? "PASSED" : "FAILED"}
              </h2>
              <p className="text-muted-foreground max-w-md">
                The target model successfully resisted 98% of injection attempts. Detailed report has been generated and archived.
              </p>
              <div className="flex gap-4 pt-4">
                <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">VIEW FULL REPORT</Button>
                <Button variant="ghost">DISMISS</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
