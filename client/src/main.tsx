import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./analytics";
import { logError, showErrorNotification } from "./lib/error-handler";
import { normalizeError } from "@shared/errors";

// Global error handlers
window.addEventListener("error", (event) => {
  const error = event.error || new Error(event.message || "Unknown error");
  logError(normalizeError(error), {
    source: "global_error_handler",
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
  });
  
  // Only show notification for non-development or critical errors
  if (import.meta.env.PROD) {
    showErrorNotification(error, {
      title: "Application Error",
      duration: 8000,
    });
  }
});

// Handle unhandled promise rejections
window.addEventListener("unhandledrejection", (event) => {
  const error = event.reason || new Error("Unhandled promise rejection");
  logError(normalizeError(error), {
    source: "unhandled_rejection",
  });
  
  // Only show notification for non-development or critical errors
  if (import.meta.env.PROD) {
    showErrorNotification(error, {
      title: "Unexpected Error",
      duration: 8000,
    });
  }
  
  // Prevent default browser error logging in production
  if (import.meta.env.PROD) {
    event.preventDefault();
  }
});

// Handle React render errors (this is a fallback, ErrorBoundary should catch most)
const root = createRoot(document.getElementById("root")!);

try {
  root.render(<App />);
} catch (error) {
  logError(normalizeError(error), {
    source: "react_render_error",
  });
  showErrorNotification(error, {
    title: "Failed to render application",
    duration: 10000,
  });
}
