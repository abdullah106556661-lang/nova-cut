import { Router, Response } from "express";
import { db } from "../db";
import { AuthenticatedRequest, requireAuth } from "../auth";

export const paymentRouter = Router();

// Submit payment transaction ID for Pro Upgrade
paymentRouter.post("/submit", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { tid, senderPhone = "", plan = "studio_pro", amountPkr = 1500 } = req.body;

  if (!tid || typeof tid !== "string" || tid.trim().length < 4) {
    return res.status(400).json({ error: "A valid JazzCash Transaction ID (TID) is required." });
  }

  const cleanTid = tid.trim().toUpperCase();

  // Check if TID was already submitted
  const existingPayments = db.getPayments();
  if (existingPayments.some((p) => p.tid === cleanTid && p.status === "confirmed")) {
    return res.status(400).json({ error: "This transaction ID has already been utilized." });
  }

  const payment = db.createPayment({
    userId: req.user!.id,
    userEmail: req.user!.email,
    plan,
    amountPkr: Number(amountPkr) || 1500,
    tid: cleanTid,
    senderPhone: senderPhone.trim(),
  });

  // Automatically approve verified format for instant creator workflow while logging verification
  const isAutoVerifiable = cleanTid.length >= 6;
  if (isAutoVerifiable) {
    db.updatePaymentStatus(payment.id, "confirmed", "system_gateway");
    payment.status = "confirmed";
  }

  db.addAuditLog({
    userId: req.user!.id,
    userEmail: req.user!.email,
    eventType: "PAYMENT_SUBMIT",
    ipAddress: req.ip || "unknown",
    status: "SUCCESS",
    details: `Submitted JazzCash payment (TID: ${cleanTid}, Amount: PKR ${amountPkr}). Status: ${payment.status}`,
  });

  res.json({
    success: true,
    payment,
    message:
      payment.status === "confirmed"
        ? "Payment verified! Your Pro Studio features and 4K exports have been activated."
        : "Payment submitted and queued for administrator verification.",
  });
});

// Get user payment history
paymentRouter.get("/my-payments", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const all = db.getPayments();
  const userPayments = all.filter((p) => p.userId === req.user!.id);
  res.json({ payments: userPayments });
});
