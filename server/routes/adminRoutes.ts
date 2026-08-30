import { Router, Response } from "express";
import { db } from "../db";
import { AuthenticatedRequest, requireAdmin, requireSuperAdmin } from "../auth";

export const adminRouter = Router();

// Apply requireAdmin middleware to all routes in this router
adminRouter.use(requireAdmin);

// 1. ADMIN SYSTEM HEALTH & STATUS
adminRouter.get("/status", (_req: AuthenticatedRequest, res: Response) => {
  res.json({
    status: "online",
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    nodeEnv: process.env.NODE_ENV || "development",
    platform: process.env.VERCEL ? "Vercel Serverless" : "Cloud Run Container",
    uptimeSeconds: process.uptime(),
    memoryUsage: process.memoryUsage(),
    model: "gemini-3.7-flash",
    totalUsers: db.getAllUsers().length,
    totalAuditLogs: db.getAuditLogs().length,
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
    details: `Admin inspected platform users list (${users.length} total users).`,
  });

  res.json({ users });
});

// 3. ELEVATE OR CHANGE USER ROLE
adminRouter.patch("/user/:id/role", (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { role } = req.body;

  const validRoles = ["user", "creator", "admin", "superadmin"];
  if (!role || !validRoles.includes(role)) {
    return res.status(400).json({ error: "Invalid role specified." });
  }

  // Only SuperAdmin can assign 'superadmin' or 'admin'
  if ((role === "superadmin" || role === "admin") && req.user?.role !== "superadmin") {
    return res.status(403).json({ error: "Only SuperAdmin can promote users to Admin or SuperAdmin." });
  }

  const targetUser = db.findUserById(id);
  if (!targetUser) {
    return res.status(404).json({ error: "User not found." });
  }

  // Prevent changing SuperAdmin account unless requested by SuperAdmin
  if (targetUser.role === "superadmin" && req.user?.role !== "superadmin") {
    return res.status(403).json({ error: "Cannot modify SuperAdmin account." });
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
  res.json({ success: true, user: safe });
});

// 4. SUSPEND OR ACTIVATE USER
adminRouter.patch("/user/:id/status", (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (status !== "ACTIVE" && status !== "SUSPENDED") {
    return res.status(400).json({ error: "Status must be ACTIVE or SUSPENDED." });
  }

  const targetUser = db.findUserById(id);
  if (!targetUser) return res.status(404).json({ error: "User not found." });

  if (targetUser.role === "superadmin") {
    return res.status(403).json({ error: "Cannot suspend SuperAdmin account." });
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
  res.json({ success: true, user: safe });
});

// 5. GRANT OR ADJUST AI CREDITS
adminRouter.post("/user/:id/credits", (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { amount = 500, setUnlimited = false } = req.body;

  const targetUser = db.findUserById(id);
  if (!targetUser) return res.status(404).json({ error: "User not found." });

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
  res.json({ success: true, user: safe });
});

// 6. GET SECURITY & AUDIT LOGS
adminRouter.get("/audit-logs", (_req: AuthenticatedRequest, res: Response) => {
  const logs = db.getAuditLogs();
  res.json({ logs });
});

// 7. GET PAYMENTS & VERIFICATION REQUESTS
adminRouter.get("/payments", (_req: AuthenticatedRequest, res: Response) => {
  const payments = db.getPayments();
  res.json({ payments });
});

// 8. APPROVE / REJECT PAYMENT
adminRouter.post("/payments/:id/verify", (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (status !== "confirmed" && status !== "rejected") {
    return res.status(400).json({ error: "Status must be 'confirmed' or 'rejected'." });
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

    res.json({ success: true, payment });
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Failed to update payment status." });
  }
});
