import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
import { useLocation } from "wouter";

interface NavigationContextType {
  previousPath: string | null;
  currentPath: string;
  navigate: (path: string) => void;
  canGoBack: boolean;
  goBack: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const [previousPath, setPreviousPath] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([location]);
  const prevLocationRef = useRef<string>(location);

  useEffect(() => {
    if (location !== prevLocationRef.current) {
      setPreviousPath(prevLocationRef.current);
      setHistory((prev) => {
        // Only add if it's a new location
        if (prev[prev.length - 1] !== location) {
          return [...prev, location];
        }
        return prev;
      });
      prevLocationRef.current = location;
    }
  }, [location]);

  const navigate = (path: string) => {
    setPreviousPath(location);
    setLocation(path);
  };

  const goBack = () => {
    if (history.length > 1) {
      const newHistory = [...history];
      newHistory.pop(); // Remove current
      const previous = newHistory[newHistory.length - 1];
      setHistory(newHistory);
      setLocation(previous);
      setPreviousPath(newHistory.length > 1 ? newHistory[newHistory.length - 2] : null);
    }
  };

  return (
    <NavigationContext.Provider
      value={{
        previousPath,
        currentPath: location,
        navigate,
        canGoBack: history.length > 1,
        goBack,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigation must be used within NavigationProvider");
  }
  return context;
}

