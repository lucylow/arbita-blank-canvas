import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Web3Provider } from "./contexts/Web3Context";
import { NavigationProvider } from "./contexts/NavigationContext";
import Layout from "./components/Layout";
import { Spinner } from "@/components/ui/spinner";

// Lazy load pages for code splitting
const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Audit = lazy(() => import("./pages/Audit"));
const Reports = lazy(() => import("./pages/Reports"));
const Logs = lazy(() => import("./pages/Logs"));
const Settings = lazy(() => import("./pages/Settings"));
const HumanReview = lazy(() => import("./pages/HumanReview"));
const Pricing = lazy(() => import("./pages/Pricing"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center h-64">
    <Spinner className="w-8 h-8 text-primary" />
  </div>
);

// Route configuration with metadata
const routeConfig: Record<string, { title: string; description?: string }> = {
  "/": { title: "Home | NULLAUDIT", description: "Multi-LLM Security Audit Platform" },
  "/login": { title: "Login | NULLAUDIT", description: "Sign in to your account" },
  "/dashboard": { title: "Dashboard | NULLAUDIT", description: "Security dashboard overview" },
  "/audit": { title: "Security Audit | NULLAUDIT", description: "Run security audits" },
  "/reports": { title: "Reports | NULLAUDIT", description: "View audit reports" },
  "/logs": { title: "Agent Logs | NULLAUDIT", description: "View agent activity logs" },
  "/settings": { title: "Settings | NULLAUDIT", description: "Application settings" },
  "/review": { title: "Human Review | NULLAUDIT", description: "Review audit findings" },
  "/pricing": { title: "Pricing | NULLAUDIT", description: "View pricing plans" },
  "/404": { title: "Page Not Found | NULLAUDIT", description: "The page you're looking for doesn't exist" },
};

// Page transition variants
const pageVariants = {
  initial: {
    opacity: 0,
    y: 10,
    scale: 0.98,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.98,
  },
};

const pageTransition = {
  type: "tween" as const,
  ease: "easeInOut" as const,
  duration: 0.3,
};

function Router() {
  const [location] = useLocation();
  
  // Pages that don't need the Layout wrapper (landing, login)
  const noLayoutPaths = ["/", "/login"];
  const needsLayout = !noLayoutPaths.includes(location);

  // Update document title and meta description
  useEffect(() => {
    const config = routeConfig[location] || routeConfig["/404"];
    document.title = config.title;
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription && config.description) {
      metaDescription.setAttribute("content", config.description);
    }
  }, [location]);

  // Scroll to top on route change (except for hash links)
  useEffect(() => {
    if (!location.includes("#")) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [location]);

  const routes = (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageVariants}
        transition={pageTransition}
        className="w-full"
      >
        <Suspense fallback={<PageLoader />}>
          <Switch>
            <Route path={"/"} component={Home} />
            <Route path={"/login"} component={Login} />
            <Route path={"/dashboard"} component={Dashboard} />
            <Route path={"/audit"} component={Audit} />
            <Route path={"/reports"} component={Reports} />
            <Route path={"/logs"} component={Logs} />
            <Route path={"/settings"} component={Settings} />
            <Route path={"/review"} component={HumanReview} />
            <Route path={"/pricing"} component={Pricing} />
            <Route path={"/404"} component={NotFound} />
            {/* Final fallback route */}
            <Route component={NotFound} />
          </Switch>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );

  return needsLayout ? <Layout>{routes}</Layout> : routes;
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <Web3Provider>
          <NavigationProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </NavigationProvider>
        </Web3Provider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
