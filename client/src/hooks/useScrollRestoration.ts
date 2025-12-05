import { useEffect, useRef } from "react";
import { useLocation } from "wouter";

// Store scroll positions for each route
const scrollPositions = new Map<string, number>();

export function useScrollRestoration(enabled: boolean = true) {
  const [location] = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) return;

    const container = containerRef.current || window;
    const scrollElement = containerRef.current || document.documentElement;

    // Save scroll position before navigation
    const saveScrollPosition = () => {
      const scrollY = containerRef.current
        ? containerRef.current.scrollTop
        : window.scrollY;
      scrollPositions.set(location, scrollY);
    };

    // Restore scroll position after navigation
    const restoreScrollPosition = () => {
      const savedPosition = scrollPositions.get(location);
      if (savedPosition !== undefined) {
        // Use requestAnimationFrame to ensure DOM is ready
        requestAnimationFrame(() => {
          if (containerRef.current) {
            containerRef.current.scrollTop = savedPosition;
          } else {
            window.scrollTo({ top: savedPosition, behavior: "auto" });
          }
        });
      } else {
        // Scroll to top for new routes
        requestAnimationFrame(() => {
          if (containerRef.current) {
            containerRef.current.scrollTop = 0;
          } else {
            window.scrollTo({ top: 0, behavior: "auto" });
          }
        });
      }
    };

    // Save on unmount or before route change
    window.addEventListener("beforeunload", saveScrollPosition);

    // Restore after mount
    restoreScrollPosition();

    return () => {
      window.removeEventListener("beforeunload", saveScrollPosition);
      saveScrollPosition();
    };
  }, [location, enabled]);

  return containerRef;
}


