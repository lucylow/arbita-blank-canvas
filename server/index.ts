import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import hitlRoutes from "./routes/hitl.js";
import mcpRoutes from "./routes/mcp.js";
import dashboardRoutes from "./routes/dashboard.js";
import reportsRoutes from "./routes/reports.js";
import logsRoutes from "./routes/logs.js";
import { errorHandler, notFoundHandler, logError } from "./utils/error-handler.js";
import { AppError, ErrorCode, normalizeError } from "../shared/errors.js";
import { requestLogger } from "./middleware/logger.js";
import { sanitizeInput, rateLimiter, corsHeaders, securityHeaders } from "./middleware/security.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Security middleware (must be first)
  app.use(securityHeaders);
  app.use(corsHeaders);
  
  // Request logging
  app.use(requestLogger);
  
  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  
  // Input sanitization
  app.use(sanitizeInput);
  
  // Rate limiting for API routes
  app.use('/api', rateLimiter(60000, 100)); // 100 requests per minute

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
    });
  });

  // API Routes
  app.use("/api/hitl", hitlRoutes);
  app.use("/api/mcp", mcpRoutes);
  app.use("/api/dashboard", dashboardRoutes);
  app.use("/api/reports", reportsRoutes);
  app.use("/api/logs", logsRoutes);

  // Serve static files from dist/public in production
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  // 404 handler for API routes (must be before catch-all route)
  app.use("/api/*", notFoundHandler);

  // Handle client-side routing - serve index.html for all non-API routes
  app.get("*", (req, res, next) => {
    // Skip API routes - they should have been handled by now
    if (req.path.startsWith("/api/")) {
      return next();
    }
    res.sendFile(path.join(staticPath, "index.html"));
  });

  // Error handling middleware (must be last)
  app.use(errorHandler);

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    console.log(`HITL API available at http://localhost:${port}/api/hitl`);
    console.log(`MCP API available at http://localhost:${port}/api/mcp`);
    console.log(`Dashboard API available at http://localhost:${port}/api/dashboard`);
    console.log(`Reports API available at http://localhost:${port}/api/reports`);
    console.log(`Logs API available at http://localhost:${port}/api/logs`);
  });

  // Handle server errors
  server.on("error", (error: Error) => {
    const appError = normalizeError(error);
    logError(appError, {
      source: "server_error_event",
      port,
    });
  });

  // Graceful shutdown handlers
  const gracefulShutdown = (signal: string) => {
    console.log(`${signal} signal received: closing HTTP server`);
    server.close(() => {
      console.log("HTTP server closed");
      process.exit(0);
    });

    // Force close after 10 seconds
    setTimeout(() => {
      logError(new Error("Forced shutdown after timeout"), {
        context: "graceful_shutdown_timeout",
        signal,
      });
      process.exit(1);
    }, 10000);
  };

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));

  // Handle unhandled promise rejections
  process.on("unhandledRejection", (reason: unknown, promise: Promise<any>) => {
    const error = normalizeError(reason);
    logError(error, {
      source: "unhandled_rejection",
      promise: promise.toString().substring(0, 100),
    });
  });

  // Handle uncaught exceptions
  process.on("uncaughtException", (error: Error) => {
    const appError = normalizeError(error);
    logError(appError, {
      source: "uncaught_exception",
    });
    
    // Close server gracefully before exiting
    server.close(() => {
      process.exit(1);
    });
  });
}

startServer().catch((error) => {
  const appError = normalizeError(error);
  logError(appError, {
    source: "server_startup",
  });
  process.exit(1);
});
