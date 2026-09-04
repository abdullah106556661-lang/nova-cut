import { Router, Response } from "express";
import { db } from "../db";
import { AuthenticatedRequest, requireAuth } from "../auth";
import { validateBody, paymentSubmitSchema } from "../middleware/validation";
import { sendError, sendSuccess } from "../utils/errors";

export const paymentRouter = Router();

// Submit payment transaction ID for Pro Upgrade
paymentRouter.post(
  "/submit",
  requireAuth,
  validateBody(paymentSubmitSchema),
  (req: AuthenticatedRequest, res: Response) => {
    const { tid, senderPhone, plan = "studio_pro", amountPkr = 1500 } = req.body;

    const cleanTid = tid.trim().toUpperCase();
    let cleanPhone = senderPhone.trim();

    // Standardize phone format to 03XXXXXXXXX
    if (cleanPhone.startsWith("+92")) {
      cleanPhone = "0" + cleanPhone.slice(3);
    } else if (cleanPhone.startsWith("92")) {
      cleanPhone = "0" + cleanPhone.slice(2);
    }

    // Check if TID was already submitted and verified
    const existingPayments = db.getPayments();
    if (existingPayments.some((p) => p.tid === cleanTid && p.status === "confirmed")) {
      return sendError(
        res,
        "This JazzCash Transaction ID has already been utilized and verified. Duplicate submission blocked.",
        400,
        "VALIDATION_ERROR"
      );
    }

    if (existingPayments.some((p) => p.tid === cleanTid && p.status === "pending")) {
      return sendError(
        res,
        "This JazzCash Transaction ID is already pending manual verification by the admin team.",
        400,
        "VALIDATION_ERROR"
      );
    }

    const isSuper = req.user!.role === "superadmin" || req.user!.role === "admin";
    const status = isSuper ? "confirmed" : "pending";

    const payment = db.createPayment({
      userId: req.user!.id,
      userEmail: req.user!.email,
      plan: plan === "creator" ? "creator" : "studio_pro",
      amountPkr: Number(amountPkr) || 1500,
      tid: cleanTid,
      senderPhone: cleanPhone,
    });

    if (status === "confirmed") {
      db.updatePaymentStatus(payment.id, "confirmed", req.user!.id);
      payment.status = "confirmed";
    }

    db.addAuditLog({
      userId: req.user!.id,
      userEmail: req.user!.email,
      eventType: "PAYMENT_SUBMIT",
      ipAddress: req.ip || "unknown",
      status: "SUCCESS",
      details: `Submitted JazzCash payment (TID: ${cleanTid}, Sender: ${cleanPhone}, Amount: PKR ${amountPkr}).`,
    });

    return sendSuccess(
      res,
      {
        payment,
        message:
          payment.status === "confirmed"
            ? "Payment confirmed! Pro Studio features and 4K exports are activated."
            : `JazzCash payment (TID: ${cleanTid}) submitted. Transfer of PKR ${amountPkr} to 03176901963 is currently being verified. Pro tools will activate immediately upon confirmation.`,
      },
      201
    );
  }
);

// Check user payment verification status
paymentRouter.get("/status", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const all = db.getPayments();
  const userPayments = all.filter((p) => p.userId === req.user!.id);
  const latest = userPayments[userPayments.length - 1] || null;
  const isPro =
    req.user!.plan === "studio_pro" ||
    req.user!.plan === "creator" ||
    req.user!.role === "admin" ||
    req.user!.role === "superadmin";

  return sendSuccess(res, {
    isPro,
    currentPlan: req.user!.plan,
    latestPayment: latest,
    verified: isPro,
  });
});

// Get user payment history
paymentRouter.get("/my-payments", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const all = db.getPayments();
  const userPayments = all.filter((p) => p.userId === req.user!.id);
  return sendSuccess(res, { payments: userPayments });
});
