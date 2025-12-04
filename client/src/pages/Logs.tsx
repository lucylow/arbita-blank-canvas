import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Terminal, Search, RefreshCw, Download, Filter } from "lucide-react";
import { useState, useEffect } from "react";

// Generate massive amount of mock logs
const generateLogs = (count: number) => {
  const types = ["INFO", "WARN", "ERROR", "SUCCESS", "DEBUG"];
  const components = ["Orchestrator", "PenTester", "FactChecker", "NetworkLayer", "AuthService", "Database"];
  const messages = [
    "Connection established with remote node.",
    "Latency spike detected (240ms).",
    "Failed to authenticate user token.",
    "Audit sequence #4492 initiated.",
    "Vulnerability scan completed. 0 threats found.",
    "Database backup successful.",
    "Rate limit exceeded for API key ending in ...9X2.",
    "New model definition loaded: GPT-5-Preview.",
    "Memory usage critical: 92%.",
    "Garbage collection triggered.",
    "User login from IP 192.168.1.42.",
    "Injection attempt blocked by firewall.",
    "Report generated: AUD-2025-001.pdf",
    "Syncing with NullShot protocol...",
    "Agent 'Alpha' status changed to IDLE."
  ];

  return Array.from({ length: count }).map((_, i) => {
    const type = types[Math.floor(Math.random() * types.length)];
    const component = components[Math.floor(Math.random() * components.length)];
    const message = messages[Math.floor(Math.random() * messages.length)];
    const date = new Date();
    date.setSeconds(date.getSeconds() - i * 15);
    
    return {
      id: `LOG-${10000 + i}`,
      timestamp: date.toISOString(),
      type,
      component,
      message
    };
  });
};

const initialLogs = generateLogs(100);

export default function Logs() {
  const [logs, setLogs] = useState(initialLogs);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    if (!isLive) return;
    
    const interval = setInterval(() => {
      const newLog = generateLogs(1)[0];
      newLog.timestamp = new Date().toISOString();
      setLogs(prev => [newLog, ...prev].slice(0, 500));
    }, 2000);

    return () => clearInterval(interval);
  }, [isLive]);

  const filteredLogs = logs.filter(log => 
    log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.component.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 h-[calc(100vh-140px)] flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-foreground glitch-text" data-text="SYSTEM LOGS">SYSTEM LOGS</h1>
          <p className="text-muted-foreground font-mono mt-1 text-sm">REAL-TIME EVENT STREAM // BUFFER SIZE: 500</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={isLive ? "default" : "outline"} 
            className={isLive ? "bg-primary text-primary-foreground hover:bg-primary/90" : "border-primary text-primary"}
            onClick={() => setIsLive(!isLive)}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLive ? "animate-spin" : ""}`} />
            {isLive ? "LIVE STREAMING" : "PAUSED"}
          </Button>
          <Button variant="outline" className="border-border">
            <Download className="w-4 h-4 mr-2" />
            EXPORT
          </Button>
        </div>
      </div>

      <Card className="bg-card border-border flex-1 flex flex-col min-h-0">
        <CardHeader className="pb-3 shrink-0">
          <div className="flex items-center gap-4">
            <Terminal className="w-4 h-4 text-primary" />
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Filter logs by keyword, component, or type..." 
                className="pl-8 bg-background/50 border-input font-mono text-xs"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 min-h-0 overflow-hidden p-0">
          <div className="h-full overflow-y-auto p-4 font-mono text-xs space-y-1 bg-black/40">
            {filteredLogs.map((log) => (
              <div key={log.id} className="flex gap-3 hover:bg-white/5 p-1 rounded transition-colors group">
                <span className="text-muted-foreground opacity-50 w-36 shrink-0">{log.timestamp}</span>
                <span className={`w-16 shrink-0 font-bold ${
                  log.type === "INFO" ? "text-blue-400" :
                  log.type === "WARN" ? "text-yellow-400" :
                  log.type === "ERROR" ? "text-red-500" :
                  log.type === "SUCCESS" ? "text-green-500" :
                  "text-purple-400"
                }`}>{log.type}</span>
                <span className="text-accent w-32 shrink-0 hidden md:block">[{log.component}]</span>
                <span className="text-foreground/90 break-all">{log.message}</span>
              </div>
            ))}
            {filteredLogs.length === 0 && (
              <div className="text-center text-muted-foreground py-10">No logs found matching filter.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
