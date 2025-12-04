import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, AlertTriangle, CheckCircle, Server, Cpu, Activity, Lock, Terminal, Users, Clock } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, BarChart, Bar, Cell } from "recharts";

const activityData = [
  { time: "00:00", value: 45 },
  { time: "04:00", value: 30 },
  { time: "08:00", value: 65 },
  { time: "12:00", value: 85 },
  { time: "16:00", value: 55 },
  { time: "20:00", value: 70 },
  { time: "24:00", value: 60 },
];

const vulnerabilityData = [
  { name: "Injection", value: 65, color: "#FF003C" },
  { name: "Data Leak", value: 45, color: "#FF8A00" },
  { name: "Auth Bypass", value: 30, color: "#FFFF00" },
  { name: "DoS", value: 20, color: "#00F0FF" },
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground glitch-text" data-text="COMMAND CENTER">COMMAND CENTER</h1>
          <p className="text-muted-foreground font-mono mt-1 text-sm">SYSTEM MONITORING // ACTIVE AGENTS: 4 // HITL: ENABLED</p>
        </div>
        <div className="flex gap-2">
          <div className="px-4 py-2 bg-primary/10 border border-primary text-primary font-mono text-sm flex items-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            SYSTEM OPTIMAL
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { title: "SECURITY SCORE", value: "92%", icon: Shield, color: "text-primary", border: "border-primary", link: "/audit" },
          { title: "VULNERABILITIES", value: "12", icon: AlertTriangle, color: "text-destructive", border: "border-destructive", link: "/reports" },
          { title: "AUDITS PASSED", value: "845", icon: CheckCircle, color: "text-accent", border: "border-accent", link: "/reports" },
          { title: "ACTIVE MODELS", value: "08", icon: Server, color: "text-secondary-foreground", border: "border-secondary-foreground", link: "/audit" },
          { title: "PENDING REVIEWS", value: "03", icon: Users, color: "text-yellow-500", border: "border-yellow-500", link: "/review" },
        ].map((stat, i) => (
          <Link key={i} href={stat.link}>
            <Card className={`bg-card border ${stat.border}/50 hover:${stat.border} transition-colors group cursor-pointer h-full`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-mono text-muted-foreground group-hover:text-foreground transition-colors">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold font-mono ${stat.color}`}>{stat.value}</div>
                <div className="h-1 w-full bg-secondary mt-3 overflow-hidden">
                  <div className={`h-full ${stat.color.replace('text-', 'bg-')} w-[70%] animate-[pulse_3s_ease-in-out_infinite]`} />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <Card className="lg:col-span-2 bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              AUDIT ACTIVITY STREAM
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
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
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Vulnerability Breakdown */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-destructive" />
              THREAT VECTOR ANALYSIS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
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
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Agents Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-card border-border overflow-hidden relative">
          <div className="absolute inset-0 bg-[url('/images/agent-network.png')] bg-cover bg-center opacity-20 pointer-events-none" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2 relative z-10">
              <Cpu className="w-4 h-4 text-accent" />
              AGENT NETWORK STATUS
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="space-y-4">
              {[
                { name: "PEN-TESTER ALPHA", status: "ATTACKING", target: "GPT-4o", load: "89%" },
                { name: "FACT-CHECKER BETA", status: "VERIFYING", target: "CLAUDE-3", load: "45%" },
                { name: "BIAS-AUDITOR GAMMA", status: "IDLE", target: "NONE", load: "12%" },
                { name: "HITL-COORDINATOR", status: "MONITORING", target: "MULTI-LLM", load: "34%" },
              ].map((agent, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-background/50 border border-border hover:border-accent/50 transition-colors">
                  <div>
                    <div className="font-mono text-sm font-bold text-accent">{agent.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">TARGET: {agent.target}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xs font-mono px-2 py-1 mb-1 inline-block ${
                      agent.status === "ATTACKING" ? "bg-destructive/20 text-destructive" :
                      agent.status === "VERIFYING" ? "bg-primary/20 text-primary" :
                      agent.status === "MONITORING" ? "bg-yellow-500/20 text-yellow-500" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {agent.status}
                    </div>
                    <div className="text-xs font-mono text-muted-foreground">LOAD: {agent.load}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-foreground" />
              LIVE SYSTEM LOGS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-mono text-xs space-y-2 h-[250px] overflow-y-auto pr-2">
              {[
                { time: "14:23:01", type: "INFO", msg: "System initialization complete." },
                { time: "14:23:05", type: "WARN", msg: "High latency detected on node US-EAST-1." },
                { time: "14:23:12", type: "SUCCESS", msg: "Connected to NullShot Protocol." },
                { time: "14:23:45", type: "INFO", msg: "Starting audit sequence #4492..." },
                { time: "14:24:02", type: "ALERT", msg: "Injection attempt detected in sample 3." },
                { time: "14:24:15", type: "INFO", msg: "Analyzing response patterns..." },
                { time: "14:24:30", type: "SUCCESS", msg: "Audit #4492 completed. Report generated." },
                { time: "14:24:45", type: "INFO", msg: "HITL task created for critical finding." },
                { time: "14:25:01", type: "INFO", msg: "Scheduled maintenance in 4 hours." },
                { time: "14:25:12", type: "SUCCESS", msg: "Human feedback received for task #1234." },
              ].map((log, i) => (
                <div key={i} className="flex gap-3 border-b border-border/30 pb-1 last:border-0">
                  <span className="text-muted-foreground opacity-50">{log.time}</span>
                  <span className={
                    log.type === "INFO" ? "text-blue-400" :
                    log.type === "WARN" ? "text-yellow-400" :
                    log.type === "ALERT" ? "text-red-500" :
                    "text-green-500"
                  }>[{log.type}]</span>
                  <span className="text-foreground/80">{log.msg}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Human Review Queue */}
      <Card className="bg-card border-yellow-500/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-500" />
              HUMAN REVIEW QUEUE
            </CardTitle>
            <Link href="/review">
              <span className="text-sm text-yellow-500 hover:text-yellow-400 cursor-pointer font-mono">
                VIEW ALL →
              </span>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { id: "HITL-001", finding: "SQL Injection - Critical", confidence: "72%", priority: "CRITICAL" },
              { id: "HITL-002", finding: "Weak Authentication - High", confidence: "65%", priority: "HIGH" },
              { id: "HITL-003", finding: "Data Exposure - Medium", confidence: "58%", priority: "MEDIUM" },
            ].map((task, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-background/50 border border-yellow-500/30 hover:border-yellow-500 transition-colors">
                <div className="flex-1">
                  <div className="font-mono text-sm font-bold text-foreground">{task.finding}</div>
                  <div className="text-xs text-muted-foreground mt-1">ID: {task.id} • Confidence: {task.confidence}</div>
                </div>
                <div className={`text-xs font-mono px-3 py-1 ${
                  task.priority === "CRITICAL" ? "bg-red-500/20 text-red-500" :
                  task.priority === "HIGH" ? "bg-orange-500/20 text-orange-500" :
                  "bg-yellow-500/20 text-yellow-500"
                }`}>
                  {task.priority}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
