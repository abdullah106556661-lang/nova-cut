import { Request, Response, NextFunction } from "express";

export interface LogEntry {
  id: string;
  timestamp: string;
  level: "info" | "warn" | "error" | "debug";
  message: string;
  requestId?: string;
  method?: string;
  route?: string;
  statusCode?: number;
  durationMs?: number;
  userId?: string;
  userEmail?: string;
  clientIp?: string;
  userAgent?: string;
  details?: any;
}

// In-memory ring buffer for the last 500 logs for admin observability
const LOG_BUFFER_LIMIT = 500;
const logRingBuffer: LogEntry[] = [];

// Sensitive field keys to redact from logs
const SENSITIVE_KEYS = new Set([
  "password",
  "newpassword",
  "confirmpassword",
  "token",
  "authorization",
  "cookie",
  "secret",
  "apikey",
  "creditcard",
  "cvv",
]);

export function redactSensitive(obj: any): any {
  if (!obj || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) {
    return obj.map(redactSensitive);
  }
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      clean[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      clean[key] = redactSensitive(value);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

export function log(level: "info" | "warn" | "error" | "debug", message: string, meta?: Partial<LogEntry>) {
  const entry: LogEntry = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
    details: meta?.details ? redactSensitive(meta.details) : undefined,
  };

  // Structured JSON to stdout/stderr
  const jsonStr = JSON.stringify(entry);
  if (level === "error") {
    console.error(jsonStr);
  } else if (level === "warn") {
    console.warn(jsonStr);
  } else {
    console.log(jsonStr);
  }

  // Add to ring buffer for admin view
  logRingBuffer.push(entry);
  if (logRingBuffer.length > LOG_BUFFER_LIMIT) {
    logRingBuffer.shift();
  }
}

export const logger = {
  info: (msg: string, meta?: Partial<LogEntry>) => log("info", msg, meta),
  warn: (msg: string, meta?: Partial<LogEntry>) => log("warn", msg, meta),
  error: (msg: string, meta?: Partial<LogEntry>) => log("error", msg, meta),
  debug: (msg: string, meta?: Partial<LogEntry>) => log("debug", msg, meta),
  getRecentLogs: (limit = 100) => logRingBuffer.slice(-Math.min(limit, LOG_BUFFER_LIMIT)),
};

// Express middleware for logging HTTP requests
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const requestId = (req.headers["x-request-id"] as string) || `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  res.setHeader("X-Request-ID", requestId);

  res.on("finish", () => {
    const durationMs = Date.now() - start;
    const statusCode = res.statusCode;
    const level = statusCode >= 500 ? "error" : statusCode >= 400 ? "warn" : "info";

    logger[level](`${req.method} ${req.originalUrl} -> ${statusCode} (${durationMs}ms)`, {
      requestId,
      method: req.method,
      route: req.originalUrl,
      statusCode,
      durationMs,
      userId: (req as any).user?.id,
      userEmail: (req as any).user?.email,
      clientIp: req.ip || (req.headers["x-forwarded-for"] as string) || "unknown",
      userAgent: req.headers["user-agent"],
    });
  });

  next();
}
