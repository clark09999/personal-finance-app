import express, { type Request, Response, NextFunction } from "express";
import cors from 'cors';
import { env } from './config/env';
import { registerRoutes } from "./routes";
import { errorHandler } from './middleware/error';
import { type Server } from 'http';

// Lightweight logger used in tests and runtime. We avoid importing the full
// `./vite` module at top-level because that module pulls in Vite/esbuild which
// can break the test environment when imported under `NODE_ENV=test`.
export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

const app = express();

// CORS - allow frontend dev server and other configured origins
app.use(cors({
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin) return callback(null, true);
    const frontend = process.env.FRONTEND_URL || 'http://localhost:5173';
    const allowed = process.env.NODE_ENV === 'production'
      ? [process.env.FRONTEND_URL || frontend]
      : [frontend, 'http://localhost:3000'];
    if (allowed.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}));

export { app };

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}

// Register body-parsing middleware before routes so handlers see parsed
// req.body. The logging middleware is also attached early so it captures
// responses from route handlers.
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Register routes at module initialization so importing `app` in tests will
// have the routes attached synchronously. We avoid awaiting here; the
// registration function currently completes synchronously in practice.
let _registeredServer: Server | undefined;
let routesRegistered = false;
// Register routes. When running tests we avoid enabling auth globally so test
// suites that import `app` and call endpoints without attaching tokens continue
// to work. For real server runs we enable auth by default.
console.log(`[index] registering routes at module init`);
registerRoutes(app, { requireAuth: true })
  .then((s) => {
    _registeredServer = s;
    routesRegistered = true;
    console.log('[index] ✅ routes registered successfully');
  })
  .catch((err: any) => {
    // CRITICAL: Log error so we can see what's failing
    console.error('[index] ❌ FATAL ERROR registering routes at module init:');
    console.error('[index] Error message:', (err as Error)?.message || err);
    console.error('[index] Error stack:', (err as Error)?.stack || 'N/A');
    console.error('[index] Full error:', JSON.stringify(err, null, 2));
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
  });

// Attach global error handler at app-level so tests importing `app` directly
// receive consistent JSON error responses. createServer also attaches a
// handler for server-start flows, but we need this for the test import path.
app.use(errorHandler);

export async function createServer() {
  console.log('[createServer] 🚀 Starting createServer()...');
  
  // Ensure routes are registered (may already be done at module init)
  console.log('[createServer] Checking if routes registered...');
  if (!routesRegistered) {
    console.log('[createServer] Routes not registered, registering now...');
    try {
      await registerRoutes(app, { requireAuth: true });
      console.log('[createServer] ✅ Routes registered');
    } catch (err) {
      console.error('[createServer] ❌ Failed to register routes:', err);
      throw err;
    }
  } else {
    console.log('[createServer] Routes already registered (from module init)');
  }

  console.log('[createServer] Setting up error handler...');
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });
  console.log('[createServer] ✅ Error handler set up');

  console.log(`[createServer] NODE_ENV=${process.env.NODE_ENV}`);

  // Only setup Vite in development. In production we serve static files.
  // Critically, do NOT import `./vite` when running under NODE_ENV=test because
  // that file imports Vite/esbuild at top-level which can break the test runtime.
  if (process.env.NODE_ENV === 'development') {
    console.log('[createServer] 🚀 Setting up Vite (development mode)...');
    try {
      const { setupVite } = await import('./vite');
      // Use a proper HTTP server for Vite middleware
      const { createServer: createHttpServer } = await import('http');
      const server = createHttpServer(app);
      await setupVite(app, server);
      console.log('[createServer] ✅ Vite setup complete');
      return server;
    } catch (err) {
      console.error('[createServer] ❌ Failed to set up Vite:', err);
      throw err;
    }
  } else if (process.env.NODE_ENV === 'production') {
    console.log('[createServer] 🚀 Setting up static file serving (production mode)...');
    try {
      const { serveStatic } = await import('./vite');
      serveStatic(app);
      console.log('[createServer] ✅ Static file serving set up');
    } catch (err) {
      console.error('[createServer] ❌ Failed to set up static file serving:', err);
      throw err;
    }
  } else {
    console.log(`[createServer] ⚠️ NODE_ENV is "${process.env.NODE_ENV}", not dev or prod`);
  }

  // For production or test, just return the app's built-in server wrapper
  // Create and return a proper HTTP server
  console.log('[createServer] 🚀 Creating HTTP server...');
  const { createServer: createHttpServer } = await import('http');
  const httpServer = createHttpServer(app);
  console.log('[createServer] ✅ HTTP server created');
  console.log('[createServer] ✅ createServer() completed successfully');
  return httpServer;
}

// If not running under test, start listening immediately
if (process.env.NODE_ENV !== 'test') {
  (async () => {
    try {
      console.log('[index] 🚀 Starting server initialization...');
      
      console.log('[index] Creating HTTP server...');
      const server = await createServer();
      console.log('[index] ✅ HTTP server created');
      
      const port = parseInt(process.env.PORT || '3000', 10);
      console.log(`[index] 🚀 Attempting to listen on port ${port}...`);
      
      // Timeout protection: if listen doesn't complete in 10 seconds, force exit
      const listenTimeout = setTimeout(() => {
        console.error(`[index] ❌ TIMEOUT: listen callback never fired after 10 seconds!`);
        process.exit(1);
      }, 10000);

      server.listen({
        port,
        host: "localhost",
      }, () => {
        clearTimeout(listenTimeout);
        log(`serving on port ${port}`);
        console.log(`[index] ✅ Server is ACTUALLY listening (listen callback fired)`);
      });

      // Log errors from the server itself
      server.on('error', (err) => {
        console.error('[index] ❌ Server error event:', err);
        process.exit(1);
      });

      // Handle graceful shutdown
      process.on('SIGINT', () => {
        log('Shutting down...');
        server.close(() => {
          log('Server closed');
          process.exit(0);
        });
        // Force exit if close takes > 5 seconds
        setTimeout(() => {
          console.error('[index] ❌ Forced shutdown after 5 seconds');
          process.exit(1);
        }, 5000);
      });

      // Log any unhandled promise rejections
      process.on('unhandledRejection', (reason, promise) => {
        console.error('[index] ❌ Unhandled Promise Rejection:', reason);
        console.error('[index] Promise:', promise);
      });

    } catch (err) {
      console.error('[index] ❌ FATAL ERROR in server startup:');
      console.error('[index] Error message:', (err as Error)?.message || err);
      console.error('[index] Error stack:', (err as Error)?.stack || 'N/A');
      console.error('[index] Full error:', JSON.stringify(err, null, 2));
      process.exit(1);
    }
  })();
}
