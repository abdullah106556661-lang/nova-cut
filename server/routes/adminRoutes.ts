import { Router, Response } from "express";
import { db } from "../db";
import { AuthenticatedRequest, requireAdmin, requireSuperAdmin } from "../auth";
import { config } from "../config";
import { sendError, sendSuccess } from "../utils/errors";
import { logger } from "../utils/logger";

export const adminRouter = Router();

// Apply requireAdmin middleware to all routes
adminRouter.use(requireAdmin);

// 1. ADMIN SYSTEM HEALTH & STATUS
adminRouter.get("/status", (_req: AuthenticatedRequest, res: Response) => {
  return sendSuccess(res, {
    status: "online",
    hasApiKey: Boolean(config.geminiApiKey),
    database: {
      type: db.getStorageType(),
      postgresConnected: db.isPostgresConnected(),
    },
    models: config.models,
    nodeEnv: config.nodeEnv,
    platform: config.isVercel ? "Vercel Serverless" : "Cloud Run Container",
    uptimeSeconds: Math.floor(process.uptime()),
    memoryUsageMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    totalUsers: db.getAllUsers().length,
    totalAuditLogs: db.getAuditLogs().length,
    totalPayments: db.getPayments().length,
  });
});

// 2. GET ALL PLATFORM USERS
adminRouter.get("/users", (req: AuthenticatedRequest, res: Response) => {
  const users = db.getAllUsers().map((u) => {
    const { passwordHash, passwordResetToken, emailVerificationToken, ...safe } = u;
    return safe;
  });

  db.addAuditLog({
    userId: req.user?.id,
    userEmail: req.user?.email,
    eventType: "ADMIN_ACTION",
    ipAddress: req.ip || "unknown",
    status: "SUCCESS",
    details: `Admin viewed platform users list (${users.length} total users).`,
  });

  return sendSuccess(res, { users });
});

// 3. ELEVATE OR CHANGE USER ROLE
adminRouter.patch("/user/:id/role", (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { role } = req.body;

  const validRoles = ["user", "creator", "admin", "superadmin"];
  if (!role || !validRoles.includes(role)) {
    return sendError(res, "Invalid role specified. Must be user, creator, admin, or superadmin.", 400, "VALIDATION_ERROR");
  }

  // Only SuperAdmin can assign 'superadmin' or 'admin'
  if ((role === "superadmin" || role === "admin") && req.user?.role !== "superadmin") {
    return sendError(res, "Only SuperAdmin can promote users to Admin or SuperAdmin.", 403, "FORBIDDEN");
  }

  const targetUser = db.findUserById(id);
  if (!targetUser) {
    return sendError(res, "User not found.", 404, "NOT_FOUND");
  }

  // Prevent modifying SuperAdmin account by others
  if (targetUser.role === "superadmin" && req.user?.role !== "superadmin") {
    return sendError(res, "Cannot modify SuperAdmin account.", 403, "FORBIDDEN");
  }

  const updated = db.updateUser(id, { role });

  db.addAuditLog({
    userId: req.user?.id,
    userEmail: req.user?.email,
    eventType: "PRIVILEGE_ESCALATION",
    ipAddress: req.ip || "unknown",
    status: "SUCCESS",
    details: `Admin '${req.user?.email}' updated user '${targetUser.email}' role from '${targetUser.role}' to '${role}'.`,
  });

  const { passwordHash, passwordResetToken, emailVerificationToken, ...safe } = updated;
  return sendSuccess(res, { user: safe });
});

// 4. CHANGE USER PLAN
adminRouter.patch("/user/:id/plan", (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { plan } = req.body;

  if (plan !== "free" && plan !== "creator" && plan !== "studio_pro") {
    return sendError(res, "Invalid plan specified.", 400, "VALIDATION_ERROR");
  }

  const targetUser = db.findUserById(id);
  if (!targetUser) return sendError(res, "User not found.", 404, "NOT_FOUND");

  const updated = db.updateUser(id, {
    plan,
    storageLimitMb: plan === "free" ? 1000 : 500000,
  });

  db.addAuditLog({
    userId: req.user?.id,
    userEmail: req.user?.email,
    eventType: "ADMIN_ACTION",
    ipAddress: req.ip || "unknown",
    status: "SUCCESS",
    details: `Admin changed plan of '${targetUser.email}' to ${plan}.`,
  });

  const { passwordHash, passwordResetToken, emailVerificationToken, ...safe } = updated;
  return sendSuccess(res, { user: safe });
});

// 5. SUSPEND OR ACTIVATE USER
adminRouter.patch("/user/:id/status", (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (status !== "ACTIVE" && status !== "SUSPENDED") {
    return sendError(res, "Status must be ACTIVE or SUSPENDED.", 400, "VALIDATION_ERROR");
  }

  const targetUser = db.findUserById(id);
  if (!targetUser) return sendError(res, "User not found.", 404, "NOT_FOUND");

  if (targetUser.role === "superadmin") {
    return sendError(res, "Cannot suspend SuperAdmin account.", 403, "FORBIDDEN");
  }

  const updated = db.updateUser(id, { status });

  if (status === "SUSPENDED") {
    db.deleteUserSessions(id);
  }

  db.addAuditLog({
    userId: req.user?.id,
    userEmail: req.user?.email,
    eventType: "ADMIN_ACTION",
    ipAddress: req.ip || "unknown",
    status: "WARNING",
    details: `Admin changed status of '${targetUser.email}' to ${status}.`,
  });

  const { passwordHash, passwordResetToken, emailVerificationToken, ...safe } = updated;
  return sendSuccess(res, { user: safe });
});

// 6. GRANT OR ADJUST AI CREDITS
adminRouter.post("/user/:id/credits", (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { amount = 500, setUnlimited = false } = req.body;

  const targetUser = db.findUserById(id);
  if (!targetUser) return sendError(res, "User not found.", 404, "NOT_FOUND");

  const newCredits = setUnlimited ? 999999 : Math.max(0, targetUser.aiCreditsRemaining + Number(amount));
  const updated = db.updateUser(id, { aiCreditsRemaining: newCredits });

  db.addAuditLog({
    userId: req.user?.id,
    userEmail: req.user?.email,
    eventType: "ADMIN_ACTION",
    ipAddress: req.ip || "unknown",
    status: "SUCCESS",
    details: `Admin granted ${setUnlimited ? "Unlimited" : `+${amount}`} credits to '${targetUser.email}'. New balance: ${newCredits}`,
  });

  const { passwordHash, passwordResetToken, emailVerificationToken, ...safe } = updated;
  return sendSuccess(res, { user: safe });
});

// 7. GET AUDIT LOGS
adminRouter.get("/audit-logs", (_req: AuthenticatedRequest, res: Response) => {
  const logs = db.getAuditLogs();
  return sendSuccess(res, { logs });
});

// 8. GET RECENT SYSTEM LOGS (Observability)
adminRouter.get("/system-logs", (_req: AuthenticatedRequest, res: Response) => {
  const systemLogs = logger.getRecentLogs(150);
  return sendSuccess(res, { logs: systemLogs });
});

// 9. GET PAYMENTS & VERIFICATION REQUESTS
adminRouter.get("/payments", (_req: AuthenticatedRequest, res: Response) => {
  const payments = db.getPayments();
  return sendSuccess(res, { payments });
});

// 10. APPROVE / REJECT PAYMENT
adminRouter.post("/payments/:id/verify", (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (status !== "confirmed" && status !== "rejected") {
    return sendError(res, "Status must be 'confirmed' or 'rejected'.", 400, "VALIDATION_ERROR");
  }

  try {
    const payment = db.updatePaymentStatus(id, status, req.user!.id);

    db.addAuditLog({
      userId: req.user?.id,
      userEmail: req.user?.email,
      eventType: "ADMIN_ACTION",
      ipAddress: req.ip || "unknown",
      status: "SUCCESS",
      details: `Admin ${status} payment ${payment.id} for user ${payment.userEmail} (TID: ${payment.tid}).`,
    });

    return sendSuccess(res, { payment, message: `Payment ${status} successfully.` });
  } catch (err: any) {
    return sendError(res, err.message || "Failed to update payment status.", 400, "VALIDATION_ERROR");
  }
});
