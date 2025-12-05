import { Link, useLocation } from "wouter";
import { Shield, Activity, Terminal, FileText, Settings, Menu, X, Home, ChevronRight, ArrowLeft } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useNavigation } from "@/contexts/NavigationContext";
import { useRouteInfo } from "@/hooks/useRouteMatch";
import WalletConnect from "./contracts/WalletConnect";
import ChainSelector from "./contracts/ChainSelector";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { goBack, canGoBack } = useNavigation();
  const routeInfo = useRouteInfo();
  const navRef = useRef<HTMLDivElement>(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const navItems = [
    { icon: Activity, label: "Dashboard", path: "/dashboard", shortcut: "1" },
    { icon: Shield, label: "Security Audit", path: "/audit", shortcut: "2" },
    { icon: Terminal, label: "Agent Logs", path: "/logs", shortcut: "3" },
    { icon: FileText, label: "Reports", path: "/reports", shortcut: "4" },
    { icon: Shield, label: "Human Review", path: "/review", shortcut: "5" },
    { icon: Settings, label: "Settings", path: "/settings", shortcut: "6" },
  ];

  // Generate breadcrumbs
  const generateBreadcrumbs = () => {
    const breadcrumbs = [{ label: "Home", path: "/" }];
    const currentItem = navItems.find((item) => item.path === location);
    if (currentItem) {
      breadcrumbs.push({ label: currentItem.label, path: currentItem.path });
    }
    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Close sidebar with Escape
      if (e.key === "Escape" && sidebarOpen) {
        setSidebarOpen(false);
        return;
      }

      // Number shortcuts for navigation (only when not in input/textarea)
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      // Number keys 1-6 for navigation
      const num = parseInt(e.key);
      if (num >= 1 && num <= 6 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const item = navItems[num - 1];
        if (item) {
          e.preventDefault();
          window.location.href = item.path;
        }
      }

      // Arrow keys for sidebar navigation (when sidebar is open or focused)
      if (sidebarOpen || document.activeElement?.closest("#sidebar-nav")) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setFocusedIndex((prev) => {
            const next = prev < navItems.length - 1 ? prev + 1 : 0;
            return next;
          });
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setFocusedIndex((prev) => {
            const next = prev > 0 ? prev - 1 : navItems.length - 1;
            return next;
          });
        } else if (e.key === "Enter" && focusedIndex >= 0) {
          e.preventDefault();
          const item = navItems[focusedIndex];
          if (item) {
            window.location.href = item.path;
          }
        }
      }

      // Back navigation with Backspace (when not in input)
      if (
        e.key === "Backspace" &&
        canGoBack &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        if (e.target === document.body || e.target === document.documentElement) {
          e.preventDefault();
          goBack();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sidebarOpen, focusedIndex, canGoBack, goBack, navItems]);

  // Focus navigation item when index changes
  useEffect(() => {
    if (focusedIndex >= 0 && navRef.current) {
      const items = navRef.current.querySelectorAll('[data-nav-item]');
      const item = items[focusedIndex] as HTMLElement;
      if (item) {
        item.focus();
      }
    }
  }, [focusedIndex]);

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
        id="sidebar-nav"
        role="navigation"
        aria-label="Main navigation"
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card/95 backdrop-blur-md border-r border-border transform transition-transform duration-300 ease-in-out lg:transform-none flex flex-col shadow-xl lg:shadow-none",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
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

        <nav ref={navRef} className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item, index) => {
            const isActive = routeInfo.isActive(item.path);
            const isFocused = focusedIndex === index;
            return (
              <Link key={item.path} href={item.path}>
                <div 
                  data-nav-item
                  tabIndex={0}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 text-sm font-mono transition-all duration-300 border border-transparent cursor-pointer group relative outline-none rounded-md",
                    isActive 
                      ? "bg-primary/10 border-primary text-primary shadow-[0_0_15px_rgba(0,255,65,0.3)] scale-[1.02]" 
                      : "hover:bg-secondary/80 hover:text-secondary-foreground hover:border-secondary-foreground/30 hover:translate-x-1 hover:shadow-md",
                    isFocused && !isActive && "ring-2 ring-primary/50 bg-secondary/50"
                  )}
                  onClick={() => {
                    setSidebarOpen(false);
                    setFocusedIndex(-1);
                  }}
                  onFocus={() => setFocusedIndex(index)}
                  onBlur={() => {
                    // Only reset if focus is moving outside nav
                    setTimeout(() => {
                      if (!navRef.current?.contains(document.activeElement)) {
                        setFocusedIndex(-1);
                      }
                    }, 0);
                  }}
                >
                  <item.icon className={cn("w-4 h-4 transition-transform duration-200", isActive ? "text-primary" : "text-muted-foreground group-hover:text-secondary-foreground group-hover:scale-110")} />
                  <span className="uppercase flex-1">{item.label}</span>
                  <div className="flex items-center gap-2">
                    {item.shortcut && (
                      <kbd className="hidden lg:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-60">
                        {item.shortcut}
                      </kbd>
                    )}
                    {isActive && <div className="w-1.5 h-1.5 bg-primary animate-pulse rounded-full" />}
                  </div>
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
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden" id="main-content">
        {/* Skip to main content link for accessibility */}
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded focus:shadow-lg"
        >
          Skip to main content
        </a>
        {/* Header */}
        <header className="h-16 border-b border-border bg-background/95 backdrop-blur-lg flex items-center justify-between px-4 md:px-6 sticky top-0 z-30 shadow-lg shadow-black/20" role="banner">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden" 
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={sidebarOpen}
              aria-controls="sidebar-nav"
            >
              <Menu className="w-5 h-5" />
            </Button>
            {/* Back Button */}
            {canGoBack && (
              <Button
                variant="ghost"
                size="sm"
                onClick={goBack}
                className="hidden md:flex items-center gap-2 text-xs font-mono"
                aria-label="Go back"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </Button>
            )}
            {/* Breadcrumb Navigation */}
            <Breadcrumb className="hidden md:flex">
              <BreadcrumbList>
                {breadcrumbs.map((crumb, index) => {
                  const isLast = index === breadcrumbs.length - 1;
                  return (
                    <div key={crumb.path} className="flex items-center gap-1">
                      <BreadcrumbItem>
                        {isLast ? (
                          <BreadcrumbPage className="text-xs font-mono uppercase">
                            {crumb.label}
                          </BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink asChild>
                            <Link href={crumb.path} className="text-xs font-mono hover:text-primary transition-colors">
                              {index === 0 ? <Home className="w-3 h-3" /> : crumb.label}
                            </Link>
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                      {!isLast && (
                        <BreadcrumbSeparator>
                          <ChevronRight className="w-3 h-3" />
                        </BreadcrumbSeparator>
                      )}
                    </div>
                  );
                })}
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-destructive/10 border border-destructive/30 text-destructive text-xs font-mono rounded-sm transition-all hover:bg-destructive/20 hover:scale-105 cursor-default">
              <Activity className="w-3 h-3 animate-pulse" />
              <span>THREAT LEVEL: ELEVATED</span>
            </div>
            <ChainSelector />
            <WalletConnect />
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 relative">
          {/* Scanline overlay */}
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 bg-[length:100%_2px,3px_100%] opacity-10" />
          <div className="relative z-10 animate-in fade-in duration-500">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
