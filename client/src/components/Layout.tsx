import { Link, useLocation } from "wouter";
import { Shield, Activity, Terminal, FileText, Settings, Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { icon: Activity, label: "Dashboard", path: "/" },
    { icon: Shield, label: "Security Audit", path: "/audit" },
    { icon: Terminal, label: "Agent Logs", path: "/logs" },
    { icon: FileText, label: "Reports", path: "/reports" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  return (
    <div className="min-h-screen flex bg-background text-foreground overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-300 ease-in-out lg:transform-none flex flex-col",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary/20 border border-primary flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <span className="font-mono font-bold text-xl tracking-tighter text-primary">NULL<span className="text-foreground">AUDIT</span></span>
          </div>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location === item.path;
            return (
              <Link key={item.path} href={item.path}>
                <div 
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 text-sm font-mono transition-all border border-transparent cursor-pointer group",
                    isActive 
                      ? "bg-primary/10 border-primary text-primary shadow-[0_0_10px_rgba(0,255,65,0.2)]" 
                      : "hover:bg-secondary hover:text-secondary-foreground hover:border-secondary-foreground/30"
                  )}
                >
                  <item.icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground group-hover:text-secondary-foreground")} />
                  <span className="uppercase">{item.label}</span>
                  {isActive && <div className="ml-auto w-1.5 h-1.5 bg-primary animate-pulse" />}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="bg-secondary/50 border border-border p-3 text-xs font-mono">
            <div className="flex justify-between mb-1">
              <span className="text-muted-foreground">SYSTEM STATUS</span>
              <span className="text-primary animate-pulse">ONLINE</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">VERSION</span>
              <span>v0.9.2-BETA</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-border bg-background/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5" />
            </Button>
            <div className="hidden md:flex items-center gap-2 text-xs font-mono text-muted-foreground">
              <span>/</span>
              <span className="text-foreground uppercase">{navItems.find(i => i.path === location)?.label || "UNKNOWN"}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-destructive/10 border border-destructive/30 text-destructive text-xs font-mono">
              <Activity className="w-3 h-3" />
              <span>THREAT LEVEL: ELEVATED</span>
            </div>
            <div className="w-8 h-8 bg-secondary border border-border flex items-center justify-center">
              <span className="font-mono text-xs font-bold">AD</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 relative">
          {/* Scanline overlay */}
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 bg-[length:100%_2px,3px_100%] opacity-20" />
          <div className="relative z-10">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
