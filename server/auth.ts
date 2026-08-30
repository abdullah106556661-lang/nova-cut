import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db, UserRecord } from "./db";

export interface AuthenticatedRequest extends Request {
  user?: UserRecord;
  sessionToken?: string;
}

export function hashPassword(plainText: string): string {
  const salt = bcrypt.genSaltSync(12);
  return bcrypt.hashSync(plainText, salt);
}

export function comparePassword(plainText: string, hash: string): boolean {
  if (!plainText || !hash) return false;
  try {
    return bcrypt.compareSync(plainText, hash);
  } catch (err) {
    return false;
  }
}

export function generateCryptoToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function generate6DigitCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Extract session token from HttpOnly cookie, Authorization header, or custom headers
export function extractToken(req: Request): string | null {
  if (req.cookies && req.cookies.novacut_session) {
    return req.cookies.novacut_session;
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

  // No authenticated session attached
  req.user = undefined;
  req.sessionToken = undefined;
  next();
}

// Require valid authentication
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      error: "Authentication required. Please sign in to continue.",
      code: "UNAUTHORIZED",
    });
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
    return res.status(401).json({
      error: "Authentication required for admin access.",
      code: "UNAUTHORIZED",
    });
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
    return res.status(403).json({
      error: "Access Forbidden. You do not have administrative privileges.",
      code: "FORBIDDEN",
    });
  }

  next();
}

// SuperAdmin only middleware
export function requireSuperAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== "superadmin") {
    return res.status(403).json({
      error: "Access Forbidden. SuperAdmin access required.",
      code: "FORBIDDEN",
    });
  }
  next();
}

// Server-side credit deduction middleware
export function checkAndDeductCredits(cost: number, featureName: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // If user is guest / unauthenticated, allow them with default guest credits rather than blocking with 401
    if (!req.user) {
      return next();
    }

    // SuperAdmin has Unlimited credits
    if (req.user.role === "superadmin") {
      return next();
    }

    if (req.user.aiCreditsRemaining < cost) {
      return res.status(402).json({
        error: `Insufficient AI credits. This operation requires ${cost} credits, but you have ${req.user.aiCreditsRemaining} / 500 Daily Credits remaining. Your credits will automatically refresh at midnight.`,
        code: "INSUFFICIENT_CREDITS",
        required: cost,
        available: req.user.aiCreditsRemaining,
      });
    }

    // Deduct on server atomically
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
