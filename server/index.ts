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
    console.log('[index] routes registered');
  })
  .catch((err) => {
    // Log but don't crash immediately; tests may provide their own mocks.
    console.error('Error registering routes at module init', err);
  });

// Attach global error handler at app-level so tests importing `app` directly
// receive consistent JSON error responses. createServer also attaches a
// handler for server-start flows, but we need this for the test import path.
app.use(errorHandler);

export async function createServer() {
  const server = routesRegistered && _registeredServer ? _registeredServer : await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Only setup Vite in development. In production we serve static files.
  // Critically, do NOT import `./vite` when running under NODE_ENV=test because
  // that file imports Vite/esbuild at top-level which can break the test runtime.
  if (process.env.NODE_ENV === 'development') {
    const { setupVite } = await import('./vite');
    await setupVite(app, server);
  } else if (process.env.NODE_ENV === 'production') {
    const { serveStatic } = await import('./vite');
    serveStatic(app);
  }

  return server;
}

// If not running under test, start listening immediately
if (process.env.NODE_ENV !== 'test') {
  (async () => {
    const server = await createServer();
    const port = parseInt(process.env.PORT || '3000', 10);
    server.listen({
      port,
      host: "localhost",
    }, () => {
      log(`serving on port ${port}`);
    });
  })();
}
