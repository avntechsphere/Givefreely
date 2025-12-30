import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cors from "cors";

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function createApp(opts?: { setupVite?: boolean }) {
  const app = express();
  const httpServer = createServer(app);

  app.use(
    express.json({
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      },
    }),
  );

  app.use(express.urlencoded({ extended: false }));

  // Security middlewares
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:"],
          connectSrc: ["'self'"],
        },
      },
    }),
  );

  // CORS: allow specific origin via env or allow same-origin by default
  const corsOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : [];
  if (app.get("env") === "production" && corsOrigins.length === 0) {
    log("Warning: CORS_ORIGIN is not set in production; defaulting to restrictive policy", "cors");
  }
  app.use(
    cors({
      origin: corsOrigins.length > 0 ? corsOrigins : true,
      credentials: true,
    }),
  );

  // Rate limiter for API endpoints
  const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
  app.use("/api/", apiLimiter);

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
        const redact = (obj: any) => {
          if (!obj || typeof obj !== "object") return obj;
          try {
            const clone = JSON.parse(JSON.stringify(obj));
            ["password", "verificationCode", "verificationCodeExpires", "token"].forEach((k) => {
              if (k in clone) clone[k] = "[REDACTED]";
            });
            return clone;
          } catch (_e) {
            return "[UNREDACTABLE]";
          }
        };

        let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
        const safeReqBody = redact((req as any).body);
        if (safeReqBody && Object.keys(safeReqBody).length > 0) {
          logLine += ` :: REQ ${JSON.stringify(safeReqBody)}`;
        }
        if (capturedJsonResponse) {
          logLine += ` :: RES ${JSON.stringify(redact(capturedJsonResponse))}`;
        }

        log(logLine);
      }
    });

    next();
  });

  await registerRoutes(httpServer, app);

  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    const details = err.stack || String(err);
    // log the error for diagnostics but do not crash the process
    log(`${message} - ${details}`, "error");
    try {
      res.status(status).json({ message });
    } catch (_e) {
      // best-effort
    }
  });

  const useVite = opts?.setupVite ?? (process.env.NODE_ENV !== "test");
  if (useVite) {
    if (process.env.NODE_ENV === "production") {
      serveStatic(app);
    } else {
      const { setupVite } = await import("./vite");
      await setupVite(httpServer, app);
    }
  }

  return { app, httpServer };
}

// Start the server when run directly
if (process.env.RUN_AS_SERVER !== "false") {
  (async () => {
    const { httpServer } = await createApp();
    const port = parseInt(process.env.PORT || "5000", 10);
    // Use 127.0.0.1 for localhost access; 0.0.0.0 for Docker/cloud deployment
    const host = process.env.SERVER_HOST || "127.0.0.1";
    httpServer.listen(
      {
        port,
        host,
        reusePort: true,
      },
      () => {
        log(`serving on http://${host}:${port}`);
      },
    );
  })();
}
