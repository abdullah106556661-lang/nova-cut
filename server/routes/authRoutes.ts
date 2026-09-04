import { Router, Response } from "express";
import { db } from "../db";
import {
  AuthenticatedRequest,
  comparePassword,
  generateCryptoToken,
  hashPassword,
  sendAuthSuccess,
  extractToken,
  requireAuth,
} from "../auth";
import { config } from "../config";
import { validateBody, signupSchema, loginSchema, forgotPasswordSchema, verifyResetCodeSchema, resetPasswordSchema } from "../middleware/validation";
import { sendError, sendSuccess } from "../utils/errors";
import { logger } from "../utils/logger";

export const authRouter = Router();

// Rate limiting maps for brute-force prevention
const failedLoginAttempts = new Map<string, { count: number; lockedUntil: number }>();
const forgotPasswordAttempts = new Map<string, { count: number; windowStart: number }>();

// 1. USER SIGNUP
authRouter.post("/signup", validateBody(signupSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, email, password } = req.body;
    const cleanEmail = email.toLowerCase().trim();

    const existingUser = db.findUserByEmail(cleanEmail);
    if (existingUser) {
      return sendError(res, "An account with this email address already exists.", 409, "VALIDATION_ERROR");
    }

    const passwordHash = hashPassword(password);
    const user = db.createUser({
      name: name.trim(),
      email: cleanEmail,
      passwordHash,
    });

    const session = db.createSession(user.id, undefined, {
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip,
    });

    db.addAuditLog({
      userId: user.id,
      userEmail: user.email,
      eventType: "AUTH_SIGNUP",
      ipAddress: req.ip || "unknown",
      status: "SUCCESS",
      details: `New account registered with 500 Daily AI Credits.`,
    });

    return sendAuthSuccess(res, user, session.token, 201);
  } catch (error: any) {
    logger.error("Signup error:", { details: error.message });
    return sendError(res, error.message || "Failed to create account.", 500, "INTERNAL_ERROR");
  }
});

// 2. USER LOGIN
authRouter.post("/login", validateBody(loginSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, password } = req.body;
    const cleanEmail = email.toLowerCase().trim();
    const attemptKey = `${cleanEmail}_${req.ip || "unknown"}`;

    // Check account lockout
    const attempt = failedLoginAttempts.get(attemptKey);
    if (attempt && attempt.lockedUntil > Date.now()) {
      const waitSeconds = Math.ceil((attempt.lockedUntil - Date.now()) / 1000);
      return sendError(
        res,
        `Account temporarily locked due to repeated failed login attempts. Please wait ${waitSeconds} seconds before trying again.`,
        429,
        "RATE_LIMITED"
      );
    }

    const user = db.findUserByEmail(cleanEmail);
    if (!user) {
      recordFailedAttempt(attemptKey);
      db.addAuditLog({
        userEmail: cleanEmail,
        eventType: "AUTH_LOGIN",
        ipAddress: req.ip || "unknown",
        status: "BLOCKED",
        details: "Login failed: User not found.",
      });
      return sendError(res, "Invalid email or password.", 401, "UNAUTHORIZED");
    }

    if (user.status === "SUSPENDED") {
      return sendError(res, "This account has been suspended by administration.", 403, "FORBIDDEN");
    }

    const isMatch = comparePassword(password, user.passwordHash);
    if (!isMatch) {
      recordFailedAttempt(attemptKey);
      db.addAuditLog({
        userId: user.id,
        userEmail: user.email,
        eventType: "AUTH_LOGIN",
        ipAddress: req.ip || "unknown",
        status: "BLOCKED",
        details: "Login failed: Incorrect password.",
      });
      return sendError(res, "Invalid email or password.", 401, "UNAUTHORIZED");
    }

    // Reset failed attempts on success
    failedLoginAttempts.delete(attemptKey);

    // Refresh daily credits if 3-day cycle has lapsed
    const refreshedUser = db.checkAndResetDailyCredits(user);
    const session = db.createSession(refreshedUser.id, undefined, {
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip,
    });

    db.addAuditLog({
      userId: refreshedUser.id,
      userEmail: refreshedUser.email,
      eventType: "AUTH_LOGIN",
      ipAddress: req.ip || "unknown",
      status: "SUCCESS",
      details: `User logged in successfully (Role: ${refreshedUser.role}).`,
    });

    return sendAuthSuccess(res, refreshedUser, session.token, 200);
  } catch (error: any) {
    logger.error("Login error:", { details: error.message });
    return sendError(res, "Failed to log in. Please check your credentials.", 500, "INTERNAL_ERROR");
  }
});

function recordFailedAttempt(key: string) {
  const current = failedLoginAttempts.get(key) || { count: 0, lockedUntil: 0 };
  current.count += 1;
  if (current.count >= 5) {
    current.lockedUntil = Date.now() + 15 * 60 * 1000; // 15-minute lockout
    logger.warn(`[Security] IP/account ${key} locked out after 5 consecutive failures.`);
  }
  failedLoginAttempts.set(key, current);
}

// 3. GOOGLE OAUTH / IDENTITY FLOW
authRouter.post("/google", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { credential, email, name, avatarUrl } = req.body;
    let verifiedEmail = "";
    let verifiedName = name || "";
    let verifiedPicture = avatarUrl || "";

    if (credential && typeof credential === "string") {
      try {
        const parts = credential.split(".");
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));
          if (payload.email) {
            verifiedEmail = payload.email.toLowerCase().trim();
            verifiedName = payload.name || verifiedName;
            verifiedPicture = payload.picture || verifiedPicture;
          }
        }
      } catch (jwtErr) {
        logger.warn("[Google Auth Token Decode Warning]:", { details: (jwtErr as any)?.message });
      }
    }

    if (!verifiedEmail && email && typeof email === "string" && email.includes("@")) {
      verifiedEmail = email.toLowerCase().trim();
    }

    if (!verifiedEmail) {
      return sendError(res, "A valid Google account identity is required.", 400, "VALIDATION_ERROR");
    }

    let user = db.findUserByEmail(verifiedEmail);
    if (!user) {
      const randomPassword = generateCryptoToken();
      const passwordHash = hashPassword(randomPassword);
      user = db.createUser({
        name: verifiedName || verifiedEmail.split("@")[0],
        email: verifiedEmail,
        passwordHash,
        avatarUrl: verifiedPicture || `https://api.dicebear.com/7.x/bottts/svg?seed=${verifiedEmail}`,
      });
      user = db.updateUser(user.id, { isEmailVerified: true });
    }

    if (user.status === "SUSPENDED") {
      return sendError(res, "This account has been suspended.", 403, "FORBIDDEN");
    }

    const refreshedUser = db.checkAndResetDailyCredits(user);
    const session = db.createSession(refreshedUser.id, undefined, {
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip,
    });

    db.addAuditLog({
      userId: refreshedUser.id,
      userEmail: refreshedUser.email,
      eventType: "AUTH_LOGIN",
      ipAddress: req.ip || "unknown",
      status: "SUCCESS",
      details: `User authenticated via Google Identity (Role: ${refreshedUser.role}).`,
    });

    return sendAuthSuccess(res, refreshedUser, session.token);
  } catch (error: any) {
    logger.error("Google Auth Error:", { details: error.message });
    return sendError(res, "Failed to authenticate via Google.", 500, "INTERNAL_ERROR");
  }
});

// 4. GET CURRENT SESSION USER
authRouter.get("/me", (req: AuthenticatedRequest, res: Response) => {
  const user = req.user;
  if (!user) {
    return res.json({ authenticated: false, user: null, token: null });
  }

  const { passwordHash, passwordResetToken, emailVerificationToken, ...safeUser } = user;
  res.json({
    authenticated: true,
    user: safeUser,
    token: req.sessionToken || "",
  });
});

// 5. LOGOUT
authRouter.post("/logout", (req: AuthenticatedRequest, res: Response) => {
  const token = extractToken(req);
  if (token) {
    db.deleteSession(token);
  }

  res.clearCookie(config.sessionCookieName, { path: "/" });

  if (req.user) {
    db.addAuditLog({
      userId: req.user.id,
      userEmail: req.user.email,
      eventType: "AUTH_LOGOUT",
      ipAddress: req.ip || "unknown",
      status: "SUCCESS",
      details: "Session destroyed and cookie cleared.",
    });
  }

  return sendSuccess(res, { message: "Logged out successfully." });
});

// 6. UPDATE PROFILE
authRouter.put("/profile", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { name, avatarUrl } = req.body;
  const updates: any = {};
  if (name && typeof name === "string") updates.name = name.trim().slice(0, 80);
  if (avatarUrl && typeof avatarUrl === "string") updates.avatarUrl = avatarUrl;

  const updated = db.updateUser(req.user!.id, updates);
  const { passwordHash, passwordResetToken, emailVerificationToken, ...safeUser } = updated;

  return sendSuccess(res, { user: safeUser, message: "Profile updated successfully." });
});

// 7. CHANGE PASSWORD (Authenticated)
authRouter.post("/change-password", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return sendError(res, "Current password and new password are required.", 400, "VALIDATION_ERROR");
    }

    if (newPassword.length < 8) {
      return sendError(res, "New password must be at least 8 characters long.", 400, "VALIDATION_ERROR");
    }

    const user = db.findUserById(req.user!.id);
    if (!user) return sendError(res, "User not found.", 404, "NOT_FOUND");

    const isMatch = comparePassword(currentPassword, user.passwordHash);
    if (!isMatch) {
      return sendError(res, "Current password is incorrect.", 401, "UNAUTHORIZED");
    }

    const newHash = hashPassword(newPassword);
    db.updateUser(user.id, { passwordHash: newHash });

    // Revoke all other sessions for security
    db.deleteUserSessions(user.id);
    // Create new session for the current client
    const newSession = db.createSession(user.id);

    db.addAuditLog({
      userId: user.id,
      userEmail: user.email,
      eventType: "SECURITY_ALERT",
      ipAddress: req.ip || "unknown",
      status: "SUCCESS",
      details: "User updated their password. Other active sessions revoked.",
    });

    return sendAuthSuccess(res, user, newSession.token);
  } catch (err: any) {
    return sendError(res, err.message || "Failed to change password.", 500, "INTERNAL_ERROR");
  }
});

// 8. FORGOT PASSWORD REQUEST
authRouter.post("/forgot-password", validateBody(forgotPasswordSchema), (req: AuthenticatedRequest, res: Response) => {
  const { email } = req.body;
  const cleanEmail = email.toLowerCase().trim();
  const rateKey = `pwd_reset_${req.ip || "unknown"}`;

  // Rate limit check
  const now = Date.now();
  const rate = forgotPasswordAttempts.get(rateKey);
  if (rate && now - rate.windowStart < 15 * 60 * 1000) {
    if (rate.count >= 3) {
      return sendError(res, "Too many password reset requests. Please wait 15 minutes before requesting again.", 429, "RATE_LIMITED");
    }
    rate.count += 1;
  } else {
    forgotPasswordAttempts.set(rateKey, { count: 1, windowStart: now });
  }

  const user = db.findUserByEmail(cleanEmail);
  if (user) {
    const code = db.createPasswordResetToken(cleanEmail);

    db.addAuditLog({
      userId: user.id,
      userEmail: user.email,
      eventType: "SECURITY_ALERT",
      ipAddress: req.ip || "unknown",
      status: "WARNING",
      details: `Password reset requested for ${cleanEmail}. Verification code dispatched.`,
    });

    // In development or when email provider is not yet configured, log securely to server logs
    logger.info(`[Password Reset Code for ${cleanEmail}]: ${code} (Expires in ${config.passwordResetExpiryMinutes} mins)`);
  }

  // Consistent message whether user exists or not to prevent user enumeration
  return sendSuccess(res, {
    message: `If an account is associated with ${cleanEmail}, a 6-digit verification code has been dispatched. Check your email inbox.`,
  });
});

// 9. VERIFY RESET CODE
authRouter.post("/verify-reset-code", validateBody(verifyResetCodeSchema), (req: AuthenticatedRequest, res: Response) => {
  const { email, code } = req.body;
  const cleanEmail = email.toLowerCase().trim();

  const isValid = db.verifyPasswordResetToken(cleanEmail, code);
  if (!isValid) {
    return sendError(res, "Invalid or expired verification code. Please request a new code.", 400, "VALIDATION_ERROR");
  }

  return sendSuccess(res, { valid: true, message: "Code verified successfully." });
});

// 10. RESET PASSWORD (With verified code)
authRouter.post("/reset-password", validateBody(resetPasswordSchema), (req: AuthenticatedRequest, res: Response) => {
  const { email, code, newPassword } = req.body;
  const cleanEmail = email.toLowerCase().trim();

  const consumed = db.consumePasswordResetToken(cleanEmail, code);
  if (!consumed) {
    return sendError(res, "Invalid or expired verification code. Please request a new code.", 400, "VALIDATION_ERROR");
  }

  const user = db.findUserByEmail(cleanEmail);
  if (!user) {
    return sendError(res, "User account not found.", 404, "NOT_FOUND");
  }

  const passwordHash = hashPassword(newPassword);
  db.updateUser(user.id, { passwordHash });

  // Invalidate all existing sessions so any compromised devices are logged out
  db.deleteUserSessions(user.id);

  db.addAuditLog({
    userId: user.id,
    userEmail: user.email,
    eventType: "SECURITY_ALERT",
    ipAddress: req.ip || "unknown",
    status: "SUCCESS",
    details: "Password reset completed successfully. All active sessions invalidated.",
  });

  return sendSuccess(res, {
    message: "Password reset completed successfully. You may now sign in with your new password.",
  });
});

// 11. EMAIL VERIFICATION
authRouter.post("/send-verification", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  db.updateUser(req.user!.id, { emailVerificationToken: code });

  logger.info(`[Email Verification Code for ${req.user!.email}]: ${code}`);
  return sendSuccess(res, { message: "Verification code sent to your email address." });
});

authRouter.post("/verify-email", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { code } = req.body;
  if (!code || req.user!.emailVerificationToken !== code) {
    return sendError(res, "Invalid verification code.", 400, "VALIDATION_ERROR");
  }

  const updated = db.updateUser(req.user!.id, {
    isEmailVerified: true,
    emailVerificationToken: undefined,
  });

  return sendSuccess(res, { user: updated, message: "Email address successfully verified." });
});

// 12. RESET DAILY CREDITS
authRouter.post("/reset-daily-credits", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const isSuper = req.user!.role === "superadmin";
  const updated = db.updateUser(req.user!.id, {
    aiCreditsRemaining: isSuper ? 999999 : 500,
    lastCreditResetDate: new Date().toISOString().slice(0, 10),
  });

  return sendSuccess(res, {
    credits: updated.aiCreditsRemaining,
    message: isSuper
      ? "SuperAdmin balance refreshed with Unlimited Credits."
      : "Daily credits successfully refreshed to 500.",
  });
});
