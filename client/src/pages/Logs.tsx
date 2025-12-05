import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Terminal, Search, RefreshCw, Download, Filter } from "lucide-react";
import { useState, useEffect } from "react";
import { apiClient, logError, showErrorNotification } from "@/lib/error-handler";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LogEntry {
  id: string;
  timestamp: string;
  type: string;
  component: string;
  message: string;
}

export default function Logs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [componentFilter, setComponentFilter] = useState<string>("all");
  const [isLive, setIsLive] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
    if (isLive) {
      const interval = setInterval(fetchLogs, 2000);
      return () => clearInterval(interval);
    }
  }, [isLive]);

  useEffect(() => {
    filterLogs();
  }, [logs, searchTerm, typeFilter, componentFilter]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<{ logs: LogEntry[] }>('/api/logs?limit=500');
      setLogs(response.logs || []);
    } catch (error) {
      logError(error as Error, { component: 'Logs', method: 'fetchLogs' });
      showErrorNotification(error, { title: 'Failed to load logs' });
    } finally {
      setLoading(false);
    }
  };

  const filterLogs = () => {
    let filtered = [...logs];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(log =>
        log.message.toLowerCase().includes(searchLower) ||
        log.component.toLowerCase().includes(searchLower) ||
        log.type.toLowerCase().includes(searchLower)
      );
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter(log => log.type === typeFilter);
    }

    if (componentFilter !== "all") {
      filtered = filtered.filter(log => log.component === componentFilter);
    }

    setFilteredLogs(filtered);
  };

  const exportLogs = () => {
    try {
      const logContent = filteredLogs.map(log =>
        `${log.timestamp} [${log.type}] [${log.component}] ${log.message}`
      ).join('\n');
      
      const blob = new Blob([logContent], { type: 'text/plain' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `system-logs-${new Date().toISOString().split('T')[0]}.txt`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      logError(error as Error, { component: 'Logs', method: 'exportLogs' });
      showErrorNotification(error, { title: 'Failed to export logs' });
    }
  };

  const uniqueTypes = Array.from(new Set(logs.map(log => log.type)));
  const uniqueComponents = Array.from(new Set(logs.map(log => log.component)));

  return (
    <div className="space-y-6 h-[calc(100vh-140px)] flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-foreground glitch-text" data-text="SYSTEM LOGS">SYSTEM LOGS</h1>
          <p className="text-muted-foreground font-mono mt-1 text-sm">
            REAL-TIME EVENT STREAM // BUFFER SIZE: {logs.length} // FILTERED: {filteredLogs.length}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={isLive ? "default" : "outline"}
            className={isLive ? "bg-primary text-primary-foreground hover:bg-primary/90" : "border-primary text-primary"}
            onClick={() => setIsLive(!isLive)}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLive ? "animate-spin" : ""}`} />
            {isLive ? "LIVE" : "PAUSED"}
          </Button>
          <Button
            variant="outline"
            className="border-border"
            onClick={fetchLogs}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            REFRESH
          </Button>
          <Button
            variant="outline"
            className="border-border"
            onClick={exportLogs}
            disabled={filteredLogs.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            EXPORT
          </Button>
        </div>
      </div>

      <Card className="bg-card border-border flex-1 flex flex-col min-h-0">
        <CardHeader className="pb-3 shrink-0">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-primary" />
              <CardTitle className="text-lg font-mono">LOG VIEWER</CardTitle>
            </div>
            <div className="flex flex-1 items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Filter logs by keyword, component, or type..."
                  className="pl-8 bg-background/50 border-input font-mono text-xs"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {uniqueTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={componentFilter} onValueChange={setComponentFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Component" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Components</SelectItem>
                  {uniqueComponents.map(component => (
                    <SelectItem key={component} value={component}>{component}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 min-h-0 overflow-hidden p-0">
          <div className="h-full overflow-y-auto p-4 font-mono text-xs space-y-1 bg-black/40">
            {loading && logs.length === 0 ? (
              <div className="text-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground font-mono">Loading logs...</p>
              </div>
            ) : filteredLogs.length > 0 ? (
              filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex gap-3 hover:bg-white/5 p-1 rounded transition-colors group"
                >
                  <span className="text-muted-foreground opacity-50 w-36 shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>
                  <span
                    className={`w-16 shrink-0 font-bold ${
                      log.type === "INFO" ? "text-blue-400" :
                      log.type === "WARN" ? "text-yellow-400" :
                      log.type === "ERROR" ? "text-red-500" :
                      log.type === "SUCCESS" ? "text-green-500" :
                      "text-purple-400"
                    }`}
                  >
                    {log.type}
                  </span>
                  <span className="text-accent w-32 shrink-0 hidden md:block">[{log.component}]</span>
                  <span className="text-foreground/90 break-all">{log.message}</span>
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-10 font-mono">
                No logs found matching filters.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
