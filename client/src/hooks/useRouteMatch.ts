import { useLocation } from "wouter";

/**
 * Hook to check if current route matches a pattern
 * Supports exact matches and prefix matches
 */
export function useRouteMatch(pattern: string | string[], exact: boolean = false): boolean {
  const [location] = useLocation();
  
  if (Array.isArray(pattern)) {
    return pattern.some((p) => {
      if (exact) {
        return location === p;
      }
      return location.startsWith(p);
    });
  }
  
  if (exact) {
    return location === pattern;
  }
  
  return location.startsWith(pattern);
}

/**
 * Hook to get route metadata
 */
export function useRouteInfo() {
  const [location] = useLocation();
  
  const routeConfig: Record<string, { title: string; description?: string; category?: string }> = {
    "/": { title: "Home", category: "Main" },
    "/login": { title: "Login", category: "Auth" },
    "/dashboard": { title: "Dashboard", category: "Main" },
    "/audit": { title: "Security Audit", category: "Security" },
    "/reports": { title: "Reports", category: "Reports" },
    "/logs": { title: "Agent Logs", category: "Monitoring" },
    "/settings": { title: "Settings", category: "Configuration" },
    "/review": { title: "Human Review", category: "Security" },
    "/pricing": { title: "Pricing", category: "Main" },
  };
  
  const currentRoute = routeConfig[location] || { title: "Unknown", category: "Other" };
  
  return {
    path: location,
    ...currentRoute,
    isActive: (path: string) => location === path,
    isActivePrefix: (path: string) => location.startsWith(path),
  };
}


