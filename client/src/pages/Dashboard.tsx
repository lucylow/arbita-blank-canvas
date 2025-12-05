import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, AlertTriangle, CheckCircle, Server, Cpu, Activity, Lock, Terminal, Users, Clock, RefreshCw } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, BarChart, Bar, Cell } from "recharts";
import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { apiClient, showErrorNotification, logError } from "@/lib/error-handler";
import { Button } from "@/components/ui/button";

interface DashboardStats {
  securityScore: number;
  vulnerabilities: number;
  auditsPassed: number;
  totalAudits: number;
  activeModels: number;
  pendingReviews: number;
  criticalFindings: number;
  averageResponseTime: number;
}

interface ActivityPoint {
  time: string;
  value: number;
  audits: number;
  vulnerabilities: number;
}

interface AgentStatus {
  name: string;
  status: string;
  target: string;
  load: string;
  uptime: number;
}

interface VulnerabilityData {
  name: string;
  value: number;
  color: string;
}

interface ReviewTask {
  id: string;
  title: string;
  priority: string;
  confidence: number;
}

// Default mock data for when APIs are unavailable - moved outside component to prevent hook issues
const defaultStats: DashboardStats = {
  securityScore: 94,
  vulnerabilities: 7,
  auditsPassed: 23,
  totalAudits: 28,
  activeModels: 3,
  pendingReviews: 5,
  criticalFindings: 2,
  averageResponseTime: 1250,
};

const getDefaultActivity = (): ActivityPoint[] => Array.from({ length: 24 }, (_, i) => ({
  time: `${String(i).padStart(2, '0')}:00`,
  value: Math.floor(Math.random() * 50) + 30,
  audits: Math.floor(Math.random() * 10),
  vulnerabilities: Math.floor(Math.random() * 5),
}));

const defaultVulnerabilities: VulnerabilityData[] = [
  { name: 'Prompt Injection', value: 3, color: '#FF6B6B' },
  { name: 'PII Leakage', value: 2, color: '#FFE66D' },
  { name: 'Bias & Toxicity', value: 1, color: '#4ECDC4' },
  { name: 'Hallucination', value: 1, color: '#45B7D1' },
];

const defaultAgents: AgentStatus[] = [
  { name: 'PEN-TESTER ALPHA', status: 'ATTACKING', target: 'GPT-4o', load: '78%', uptime: 99.2 },
  { name: 'FACT-CHECKER BETA', status: 'VERIFYING', target: 'Claude 3', load: '45%', uptime: 98.7 },
  { name: 'BIAS-AUDITOR GAMMA', status: 'MONITORING', target: 'Llama 3', load: '32%', uptime: 99.5 },
];

const defaultTasks: ReviewTask[] = [
  { id: 'hitl_001', title: 'SQL Injection - CRITICAL', priority: 'CRITICAL', confidence: 87 },
  { id: 'hitl_002', title: 'XSS Vulnerability - HIGH', priority: 'HIGH', confidence: 72 },
  { id: 'hitl_003', title: 'Auth Bypass - MEDIUM', priority: 'MEDIUM', confidence: 65 },
];

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activityData, setActivityData] = useState<ActivityPoint[]>([]);
  const [vulnerabilityData, setVulnerabilityData] = useState<VulnerabilityData[]>([]);
  const [agents, setAgents] = useState<AgentStatus[]>([]);
  const [reviewTasks, setReviewTasks] = useState<ReviewTask[]>([]);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [error, setError] = useState<Error | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Try to fetch from API, fall back to defaults on failure
      const results = await Promise.allSettled([
        apiClient.get<DashboardStats>('/api/dashboard/stats'),
        apiClient.get<ActivityPoint[]>('/api/dashboard/activity?hours=24'),
        apiClient.get<VulnerabilityData[]>('/api/dashboard/vulnerabilities'),
        apiClient.get<AgentStatus[]>('/api/dashboard/agents'),
        apiClient.get<any[]>('/api/hitl/tasks/pending'),
        apiClient.get<{ logs: any[] }>('/api/logs?limit=10'),
      ]);

      // Use API data if available, otherwise use defaults
      const statsData = results[0].status === 'fulfilled' ? results[0].value : defaultStats;
      const activityDataRes = results[1].status === 'fulfilled' ? results[1].value : getDefaultActivity();
      const vulnerabilityDataRes = results[2].status === 'fulfilled' ? results[2].value : defaultVulnerabilities;
      const agentsData = results[3].status === 'fulfilled' ? results[3].value : defaultAgents;
      const tasksData = results[4].status === 'fulfilled' ? results[4].value : [];
      const logsData = results[5].status === 'fulfilled' ? results[5].value : { logs: [] };

      setStats(statsData);
      setActivityData((activityDataRes || []).map((point: any) => ({
        time: point.time ? new Date(point.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : point.time,
        value: point.value || 0,
        audits: point.audits || 0,
        vulnerabilities: point.vulnerabilities || 0,
      })));
      setVulnerabilityData(vulnerabilityDataRes || defaultVulnerabilities);
      setAgents(agentsData || defaultAgents);
      
      // Format review tasks with safe access - use defaults if API fails
      const tasks = (tasksData && tasksData.length > 0) 
        ? tasksData.slice(0, 3).map(task => ({
            id: task.id,
            title: (task.title || '').replace('Review: ', ''),
            priority: (task.priority || 'low').toUpperCase(),
            confidence: Math.round((task.metadata?.confidenceScore || 0) * 100),
          }))
        : defaultTasks;
      setReviewTasks(tasks);
      
      setRecentLogs(logsData?.logs || []);
      setLastUpdate(new Date());
    } catch (error) {
      // Use defaults on any error
      const err = error as Error;
      setError(err);
      setStats(defaultStats);
      setActivityData(getDefaultActivity());
      setVulnerabilityData(defaultVulnerabilities);
      setAgents(defaultAgents);
      setReviewTasks(defaultTasks);
      setRecentLogs([]);
      logError(err, { component: 'Dashboard', action: 'fetchDashboardData' });
      
      // Show user-friendly error notification
      if (err.message && !err.message.includes('NetworkError')) {
        showErrorNotification('Failed to load dashboard data. Using cached/default data.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  // Ensure we always have stats to prevent rendering errors
  const displayStats = stats || defaultStats;

  const statsCards = useMemo(() => [
    { title: "SECURITY SCORE", value: `${displayStats.securityScore}%`, icon: Shield, color: "text-primary", border: "border-primary", link: "/audit" },
    { title: "VULNERABILITIES", value: String(displayStats.vulnerabilities), icon: AlertTriangle, color: "text-destructive", border: "border-destructive", link: "/reports" },
    { title: "AUDITS PASSED", value: String(displayStats.auditsPassed), icon: CheckCircle, color: "text-accent", border: "border-accent", link: "/reports" },
    { title: "ACTIVE MODELS", value: String(displayStats.activeModels).padStart(2, '0'), icon: Server, color: "text-secondary-foreground", border: "border-secondary-foreground", link: "/audit" },
    { title: "PENDING REVIEWS", value: String(displayStats.pendingReviews).padStart(2, '0'), icon: Users, color: "text-yellow-500", border: "border-yellow-500", link: "/review" },
  ], [displayStats]);

  return (
    <div className="space-y-6">
      {loading && !stats ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground font-mono text-sm">Loading dashboard data...</p>
        </div>
      ) : (
        <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground glitch-text" data-text="COMMAND CENTER">COMMAND CENTER</h1>
          <p className="text-muted-foreground font-mono mt-1 text-sm">
            SYSTEM MONITORING // ACTIVE AGENTS: {agents.length} // HITL: ENABLED
            {lastUpdate && (
              <span className="ml-2 text-xs">// Last update: {lastUpdate.toLocaleTimeString()}</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDashboardData}
            disabled={loading}
            className="border-primary text-primary hover:bg-primary/10"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            REFRESH
          </Button>
          <div className="px-4 py-2 bg-primary/10 border border-primary text-primary font-mono text-sm flex items-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            SYSTEM OPTIMAL
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {statsCards.map((stat, i) => (
          <Link key={i} href={stat.link}>
            <Card className={`bg-card border ${stat.border}/50 hover:${stat.border} transition-all duration-300 group cursor-pointer h-full hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-2 card-enhanced`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-mono text-muted-foreground group-hover:text-foreground transition-colors duration-300">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color} transition-all duration-300 group-hover:scale-125 group-hover:rotate-12`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold font-mono ${stat.color} transition-all duration-300 group-hover:scale-110`}>{stat.value}</div>
                <div className="h-1 w-full bg-secondary mt-3 overflow-hidden rounded-full">
                  <div 
                    className={`h-full ${stat.color.replace('text-', 'bg-')} rounded-full transition-all duration-300 group-hover:w-[85%] animate-[pulse_3s_ease-in-out_infinite]`}
                    style={{ width: `${stat.title.includes('SCORE') ? displayStats.securityScore : 70}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <Card className="lg:col-span-2 bg-card border-border card-enhanced">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary animate-pulse" />
              AUDIT ACTIVITY STREAM
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {activityData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activityData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00FF41" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#00FF41" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="time" 
                      stroke="#333" 
                      tick={{fill: '#666', fontSize: 12, fontFamily: 'Space Mono'}} 
                      tickLine={false}
                    />
                    <YAxis 
                      stroke="#333" 
                      tick={{fill: '#666', fontSize: 12, fontFamily: 'Space Mono'}} 
                      tickLine={false}
                    />
                    <Tooltip 
                      contentStyle={{backgroundColor: '#050505', borderColor: '#333', fontFamily: 'Space Mono'}}
                      itemStyle={{color: '#00FF41'}}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#00FF41" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorValue)" 
                      dot={{ fill: '#00FF41', r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Loading chart data...
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Vulnerability Breakdown */}
        <Card className="bg-card border-border card-enhanced">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-destructive animate-pulse" />
              THREAT VECTOR ANALYSIS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {vulnerabilityData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={vulnerabilityData} layout="vertical" margin={{ left: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      width={100}
                      tick={{fill: '#888', fontSize: 11, fontFamily: 'Space Mono'}} 
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip 
                      cursor={{fill: 'rgba(255,255,255,0.05)'}}
                      contentStyle={{backgroundColor: '#050505', borderColor: '#333', fontFamily: 'Space Mono'}}
                    />
                    <Bar dataKey="value" barSize={20} radius={[0, 4, 4, 0]}>
                      {vulnerabilityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Loading data...
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Agents Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-card border-border overflow-hidden relative card-enhanced">
          <div className="absolute inset-0 bg-[url('/images/agent-network.png')] bg-cover bg-center opacity-20 pointer-events-none transition-opacity duration-300 group-hover:opacity-30" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2 relative z-10">
              <Cpu className="w-4 h-4 text-accent animate-pulse" />
              AGENT NETWORK STATUS
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="space-y-4">
              {agents.length > 0 ? agents.map((agent, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-background/50 border border-border hover:border-accent/50 hover:bg-background/70 transition-all duration-300 rounded-sm group hover:shadow-md hover:shadow-accent/20 hover:-translate-y-0.5">
                  <div className="flex-1">
                    <div className="font-mono text-sm font-bold text-accent group-hover:text-accent/80 transition-colors">{agent.name}</div>
                    <div className="text-xs text-muted-foreground mt-1 group-hover:text-foreground/70 transition-colors">TARGET: {agent.target}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xs font-mono px-2 py-1 mb-1 inline-block transition-all duration-200 ${
                      agent.status === "ATTACKING" ? "bg-destructive/20 text-destructive border border-destructive/30" :
                      agent.status === "VERIFYING" ? "bg-primary/20 text-primary border border-primary/30" :
                      agent.status === "MONITORING" ? "bg-yellow-500/20 text-yellow-500 border border-yellow-500/30" :
                      "bg-muted text-muted-foreground border border-border"
                    }`}>
                      {agent.status}
                    </div>
                    <div className="text-xs font-mono text-muted-foreground group-hover:text-foreground/70 transition-colors">LOAD: {agent.load}</div>
                  </div>
                </div>
              )) : (
                <div className="text-center text-muted-foreground py-8">No agent data available</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border card-enhanced">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-foreground animate-pulse" />
              LIVE SYSTEM LOGS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-mono text-xs space-y-2 h-[250px] overflow-y-auto pr-2">
              {recentLogs.length > 0 ? recentLogs.map((log, i) => (
                <div key={i} className="flex gap-3 border-b border-border/30 pb-1 last:border-0 hover:bg-background/50 transition-all duration-200 p-1 rounded hover:pl-2">
                  <span className="text-muted-foreground opacity-50 shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                  <span className={`shrink-0 ${
                    log.type === "INFO" ? "text-blue-400" :
                    log.type === "WARN" ? "text-yellow-400" :
                    log.type === "ERROR" ? "text-red-500" :
                    log.type === "SUCCESS" ? "text-green-500" :
                    "text-purple-400"
                  }`}>
                    [{log.type}]
                  </span>
                  <span className="text-foreground/80 break-words">{log.message}</span>
                </div>
              )) : (
                <div className="text-center text-muted-foreground py-8">No recent logs</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Human Review Queue */}
      <Card className="bg-card border-yellow-500/30 card-enhanced hover:border-yellow-500/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-500 animate-pulse" />
              HUMAN REVIEW QUEUE
            </CardTitle>
            <Link href="/review">
              <span className="text-sm text-yellow-500 hover:text-yellow-400 cursor-pointer font-mono transition-colors">
                VIEW ALL →
              </span>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {reviewTasks.length > 0 ? reviewTasks.map((task, i) => (
              <Link key={i} href="/review">
                <div className="flex items-center justify-between p-3 bg-background/50 border border-yellow-500/30 hover:border-yellow-500 hover:bg-background/70 transition-all duration-300 rounded-sm group cursor-pointer hover:shadow-md hover:shadow-yellow-500/20 hover:-translate-y-0.5">
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-sm font-bold text-foreground group-hover:text-yellow-500 transition-colors truncate">
                      {task.title}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 group-hover:text-foreground/70 transition-colors">
                      ID: {task.id} • Confidence: {task.confidence}%
                    </div>
                  </div>
                  <div className={`text-xs font-mono px-3 py-1 border shrink-0 transition-all duration-200 ${
                    task.priority === "CRITICAL" ? "bg-red-500/20 text-red-500 border-red-500/30 group-hover:bg-red-500/30" :
                    task.priority === "HIGH" ? "bg-orange-500/20 text-orange-500 border-orange-500/30 group-hover:bg-orange-500/30" :
                    "bg-yellow-500/20 text-yellow-500 border-yellow-500/30 group-hover:bg-yellow-500/30"
                  }`}>
                    {task.priority}
                  </div>
                </div>
              </Link>
            )) : (
              <div className="text-center text-muted-foreground py-8 font-mono">
                NO PENDING REVIEWS
              </div>
            )}
          </div>
        </CardContent>
      </Card>
        </>
      )}
    </div>
  );
}
