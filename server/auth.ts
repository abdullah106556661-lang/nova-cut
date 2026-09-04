import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db, UserRecord } from "./db";
import { config } from "./config";
import { sendError } from "./utils/errors";

export interface AuthenticatedRequest extends Request {
  user?: UserRecord;
  sessionToken?: string;
}

export function hashPassword(plainText: string): string {
  const salt = bcrypt.genSaltSync(config.saltRounds || 12);
  return bcrypt.hashSync(plainText, salt);
}

export function comparePassword(plainText: string, hash: string): boolean {
  if (!plainText || !hash) return false;
  try {
    return bcrypt.compareSync(plainText, hash);
  } catch {
    return false;
  }
}

export function generateCryptoToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function generate6DigitCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Extract session token from cookie, Authorization header, or x-session-token header
export function extractToken(req: Request): string | null {
  if (req.cookies && req.cookies[config.sessionCookieName]) {
    return req.cookies[config.sessionCookieName];
  }
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7).trim();
  }
  const customHeader = req.headers["x-session-token"];
  if (typeof customHeader === "string" && customHeader.trim()) {
    return customHeader.trim();
  }
  return null;
}

// Attach cookie and return sanitized user data on auth success
export function sendAuthSuccess(res: Response, user: UserRecord, token: string, statusCode = 200) {
  const isSecure = config.isProduction || reqIsHttps(res.req);
  res.cookie(config.sessionCookieName, token, {
    httpOnly: true,
    secure: isSecure,
    sameSite: isSecure ? "none" : "lax", // 'none' allows iframe embedding in preview
    maxAge: config.sessionExpiryDays * 24 * 60 * 60 * 1000,
    path: "/",
  });

  const { passwordHash, passwordResetToken, emailVerificationToken, ...safeUser } = user;
  return res.status(statusCode).json({
    success: true,
    user: safeUser,
    token,
  });
}

function reqIsHttps(req?: Request): boolean {
  if (!req) return false;
  return req.secure || req.headers["x-forwarded-proto"] === "https";
}

// Authentication middleware - attaches user if valid session token exists
export function authenticateMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (token) {
    const session = db.getSession(token);
    if (session) {
      let user = db.findUserById(session.userId);
      if (user && user.status !== "SUSPENDED") {
        user = db.checkAndResetDailyCredits(user);
        req.user = user;
        req.sessionToken = token;
        return next();
      }
    }
  }

  req.user = undefined;
  req.sessionToken = undefined;
  next();
}

// Require valid authentication
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return sendError(res, "Authentication required. Please sign in to continue.", 401, "UNAUTHORIZED");
  }
  next();
}

// Role Hierarchy: 'superadmin' > 'admin' > 'creator' > 'user'
export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    db.addAuditLog({
      eventType: "ACCESS_DENIED",
      ipAddress: req.ip || "unknown",
      status: "BLOCKED",
      details: `Unauthenticated attempt to access admin endpoint: ${req.originalUrl}`,
    });
    return sendError(res, "Authentication required for administrative access.", 401, "UNAUTHORIZED");
  }

  const role = req.user.role;
  if (role !== "admin" && role !== "superadmin") {
    db.addAuditLog({
      userId: req.user.id,
      userEmail: req.user.email,
      eventType: "ACCESS_DENIED",
      ipAddress: req.ip || "unknown",
      status: "BLOCKED",
      details: `Unauthorized admin access attempt by user '${req.user.email}' (role: ${role}) to ${req.originalUrl}`,
    });
    return sendError(res, "Access Forbidden. Administrative privileges required.", 403, "FORBIDDEN");
  }

  next();
}

// SuperAdmin only middleware
export function requireSuperAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== "superadmin") {
    return sendError(res, "Access Forbidden. SuperAdmin privileges required.", 403, "FORBIDDEN");
  }
  next();
}

// Pro Plan requirement middleware
export function requireProPlan(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return sendError(res, "Authentication required. Please sign in to access Pro features.", 401, "UNAUTHORIZED");
  }

  const isPro =
    req.user.plan === "studio_pro" ||
    req.user.plan === "creator" ||
    req.user.role === "admin" ||
    req.user.role === "superadmin";

  if (!isPro) {
    db.addAuditLog({
      userId: req.user.id,
      userEmail: req.user.email,
      eventType: "ACCESS_DENIED",
      ipAddress: req.ip || "unknown",
      status: "BLOCKED",
      details: `Pro feature blocked for free plan user '${req.user.email}' on ${req.originalUrl}`,
    });

    return sendError(
      res,
      "Pro Studio Plan required. Please transfer PKR 1,500 via JazzCash to 03176901963 and submit your Transaction ID for activation.",
      403,
      "PRO_REQUIRED"
    );
  }

  next();
}

// Server-side credit deduction middleware
export function checkAndDeductCredits(cost: number, featureName: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, "Authentication required. Please sign in or create an account to use AI tools.", 401, "UNAUTHORIZED");
    }

    // SuperAdmin has unlimited credits
    if (req.user.role === "superadmin") {
      return next();
    }

    if (req.user.aiCreditsRemaining < cost) {
      return sendError(
        res,
        `Insufficient AI credits. This operation requires ${cost} credits, but you have ${req.user.aiCreditsRemaining} / 500 Credits remaining. Free credits automatically refresh every 3 days.`,
        402,
        "INSUFFICIENT_CREDITS",
        { required: cost, available: req.user.aiCreditsRemaining }
      );
    }

    const updated = db.updateUser(req.user.id, {
      aiCreditsRemaining: Math.max(0, req.user.aiCreditsRemaining - cost),
    });
    req.user = updated;

    db.addAuditLog({
      userId: req.user.id,
      userEmail: req.user.email,
      eventType: "CREDIT_DEDUCT",
      ipAddress: req.ip || "unknown",
      status: "SUCCESS",
      details: `Deducted ${cost} AI credits for ${featureName}. Remaining: ${updated.aiCreditsRemaining}`,
    });

    next();
  };
}
