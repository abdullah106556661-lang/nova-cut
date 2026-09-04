import fs from "fs";
import path from "path";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { config } from "./config";
import { getPostgresPool, isPostgresActive } from "./database/postgres";
import { logger } from "./utils/logger";

const DATA_DIR = path.join(process.cwd(), "data");
let isFsWritable = true;
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const testFile = path.join(DATA_DIR, ".write_test");
  fs.writeFileSync(testFile, "test", "utf-8");
  fs.unlinkSync(testFile);
} catch {
  isFsWritable = false;
  logger.warn("[Database] Read-only or serverless filesystem detected. Running with in-memory caching and sync.");
}

export type UserRole = "user" | "creator" | "admin" | "superadmin";
export type UserPlan = "free" | "creator" | "studio_pro";

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: UserRole;
  plan: UserPlan;
  avatarUrl: string;
  aiCreditsRemaining: number;
  dailyCreditsLimit: number;
  lastCreditResetDate: string; // YYYY-MM-DD
  creditsCycleDays?: number;
  lastCreditResetTimestamp?: number;
  nextCreditResetTimestamp?: number;
  storageUsedMb: number;
  storageLimitMb: number;
  projectsCount?: number;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: number;
  status: "ACTIVE" | "SUSPENDED";
  createdAt: string;
  updatedAt: string;
}

export interface SessionRecord {
  token: string;
  userId: string;
  createdAt: number;
  expiresAt: number;
  userAgent?: string;
  ipAddress?: string;
}

export interface ProjectRecord {
  id: string;
  userId: string;
  title: string;
  description?: string;
  aspectRatio: "16:9" | "9:16" | "1:1" | "4:5";
  resolution: "720p" | "1080p" | "4k";
  fps: number;
  duration: number;
  tracks: any[];
  thumbnailUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRecord {
  id: string;
  userId: string;
  userEmail: string;
  plan: UserPlan;
  amountPkr: number;
  tid: string;
  senderPhone?: string;
  status: "pending" | "confirmed" | "rejected";
  createdAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
}

export interface AuditLogRecord {
  id: string;
  timestamp: string;
  eventType:
    | "AUTH_LOGIN"
    | "AUTH_SIGNUP"
    | "AUTH_LOGOUT"
    | "PRIVILEGE_ESCALATION"
    | "API_CALL"
    | "ACCESS_DENIED"
    | "PROJECT_CREATE"
    | "PROJECT_DELETE"
    | "CREDIT_DEDUCT"
    | "PAYMENT_SUBMIT"
    | "ADMIN_ACTION"
    | "SECURITY_ALERT";
  userId?: string;
  userEmail?: string;
  ipAddress: string;
  status: "SUCCESS" | "BLOCKED" | "WARNING" | "CRITICAL";
  details: string;
  metadata?: any;
}

export interface PasswordResetTokenRecord {
  id: string;
  email: string;
  code: string;
  tokenHash: string;
  expiresAt: number;
  used: boolean;
  createdAt: string;
}

class Database {
  private usersFile = path.join(DATA_DIR, "users.json");
  private sessionsFile = path.join(DATA_DIR, "sessions.json");
  private projectsFile = path.join(DATA_DIR, "projects.json");
  private paymentsFile = path.join(DATA_DIR, "payments.json");
  private auditLogsFile = path.join(DATA_DIR, "audit_logs.json");
  private resetTokensFile = path.join(DATA_DIR, "reset_tokens.json");

  private memCache: Map<string, any> = new Map();

  constructor() {
    this.initDatabase();
    // Attempt asynchronous PostgreSQL initialization in the background
    getPostgresPool().then((pool) => {
      if (pool) {
        this.syncFromPostgres();
      }
    });
  }

  private readJson<T>(filePath: string, fallback: T): T {
    if (this.memCache.has(filePath)) {
      return this.memCache.get(filePath);
    }
    try {
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, "utf-8");
        const parsed = JSON.parse(raw);
        this.memCache.set(filePath, parsed);
        return parsed;
      }
    } catch (e) {
      logger.warn(`[Database] Notice reading ${filePath}, using fallback:`, { details: (e as any)?.message });
    }
    this.memCache.set(filePath, fallback);
    return fallback;
  }

  private writeJson(filePath: string, data: any) {
    this.memCache.set(filePath, data);
    if (!isFsWritable) return;
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
    } catch (e) {
      logger.warn(`[Database] File write skipped in read-only environment:`, { details: (e as any)?.message });
    }
  }

  private getTodayDateString(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  private initDatabase() {
    const users = this.readJson<UserRecord[]>(this.usersFile, []);
    const superAdminEmail = config.superAdminEmail;

    // Check if initial SuperAdmin exists
    const adminUserIndex = users.findIndex((u) => u.email.toLowerCase() === superAdminEmail);
    if (adminUserIndex === -1 && superAdminEmail) {
      const initialPassword = config.superAdminInitialPassword;
      const defaultSalt = bcrypt.genSaltSync(12);
      const defaultHash = bcrypt.hashSync(initialPassword, defaultSalt);

      const adminUser: UserRecord = {
        id: "usr_superadmin_" + crypto.randomBytes(4).toString("hex"),
        email: superAdminEmail,
        name: "SuperAdmin",
        passwordHash: defaultHash,
        role: "superadmin",
        plan: "studio_pro",
        avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
        aiCreditsRemaining: 999999,
        dailyCreditsLimit: 500,
        lastCreditResetDate: this.getTodayDateString(),
        storageUsedMb: 0,
        storageLimitMb: 500000,
        isEmailVerified: true,
        status: "ACTIVE",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      users.unshift(adminUser);
      this.writeJson(this.usersFile, users);
      logger.info(`[Database] SuperAdmin account initialized for ${superAdminEmail}`);
    } else if (adminUserIndex !== -1) {
      // Ensure role is preserved as superadmin
      const currentAdmin = users[adminUserIndex];
      users[adminUserIndex] = {
        ...currentAdmin,
        role: "superadmin",
        plan: "studio_pro",
        status: "ACTIVE",
      };
      this.writeJson(this.usersFile, users);
    }

    if (!fs.existsSync(this.sessionsFile)) this.writeJson(this.sessionsFile, []);
    if (!fs.existsSync(this.projectsFile)) this.writeJson(this.projectsFile, []);
    if (!fs.existsSync(this.paymentsFile)) this.writeJson(this.paymentsFile, []);
    if (!fs.existsSync(this.auditLogsFile)) this.writeJson(this.auditLogsFile, []);
    if (!fs.existsSync(this.resetTokensFile)) this.writeJson(this.resetTokensFile, []);
  }

  // Synchronize data from PostgreSQL if connected
  private async syncFromPostgres() {
    try {
      const pool = await getPostgresPool();
      if (!pool) return;

      const res = await pool.query("SELECT * FROM users LIMIT 1000");
      if (res.rows && res.rows.length > 0) {
        const pgUsers: UserRecord[] = res.rows.map((r: any) => ({
          id: r.id,
          email: r.email,
          name: r.name,
          passwordHash: r.password_hash,
          role: r.role,
          plan: r.plan,
          status: r.status,
          avatarUrl: r.avatar_url || "",
          aiCreditsRemaining: r.ai_credits_remaining,
          dailyCreditsLimit: r.daily_credits_limit,
          lastCreditResetDate: r.last_credit_reset_date || this.getTodayDateString(),
          storageUsedMb: r.storage_used_mb || 0,
          storageLimitMb: r.storage_limit_mb || 1000,
          projectsCount: r.projects_count || 0,
          isEmailVerified: r.is_email_verified || false,
          createdAt: r.created_at?.toISOString() || new Date().toISOString(),
          updatedAt: r.updated_at?.toISOString() || new Date().toISOString(),
        }));

        this.writeJson(this.usersFile, pgUsers);
        logger.info(`[Database] Synced ${pgUsers.length} users from PostgreSQL.`);
      }
    } catch (e: any) {
      logger.warn("[Database] Sync from PostgreSQL notice:", { details: e?.message });
    }
  }

  public isPostgresConnected(): boolean {
    return isPostgresActive();
  }

  public getStorageType(): string {
    return isPostgresActive() ? "PostgreSQL (Production Cloud Pool)" : "Local Persistent Storage Engine";
  }

  // --- USER OPERATIONS ---
  public getAllUsers(): UserRecord[] {
    return this.readJson<UserRecord[]>(this.usersFile, []);
  }

  public findUserById(id: string): UserRecord | null {
    const users = this.getAllUsers();
    return users.find((u) => u.id === id) || null;
  }

  public findUserByEmail(email: string): UserRecord | null {
    const users = this.getAllUsers();
    const cleanEmail = email.toLowerCase().trim();
    return users.find((u) => u.email.toLowerCase().trim() === cleanEmail) || null;
  }

  public createUser(userData: {
    name: string;
    email: string;
    passwordHash: string;
    avatarUrl?: string;
  }): UserRecord {
    const users = this.getAllUsers();
    const cleanEmail = userData.email.toLowerCase().trim();

    if (users.some((u) => u.email.toLowerCase().trim() === cleanEmail)) {
      throw new Error("An account with this email address already exists.");
    }

    const newUser: UserRecord = {
      id: "usr_" + crypto.randomUUID(),
      email: cleanEmail,
      name: userData.name.trim() || cleanEmail.split("@")[0],
      passwordHash: userData.passwordHash,
      role: "user",
      plan: "free",
      avatarUrl: userData.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanEmail}`,
      aiCreditsRemaining: 500,
      dailyCreditsLimit: 500,
      lastCreditResetDate: this.getTodayDateString(),
      creditsCycleDays: 3,
      lastCreditResetTimestamp: Date.now(),
      nextCreditResetTimestamp: Date.now() + 3 * 24 * 60 * 60 * 1000,
      storageUsedMb: 0,
      storageLimitMb: 5000,
      isEmailVerified: false,
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    users.push(newUser);
    this.writeJson(this.usersFile, users);

    // Asynchronously replicate to Postgres if connected
    getPostgresPool().then((pool) => {
      if (pool) {
        pool.query(
          `INSERT INTO users (id, email, name, password_hash, role, plan, status, avatar_url, ai_credits_remaining, daily_credits_limit, last_credit_reset_date, is_email_verified)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
           ON CONFLICT (email) DO NOTHING`,
          [
            newUser.id,
            newUser.email,
            newUser.name,
            newUser.passwordHash,
            newUser.role,
            newUser.plan,
            newUser.status,
            newUser.avatarUrl,
            newUser.aiCreditsRemaining,
            newUser.dailyCreditsLimit,
            newUser.lastCreditResetDate,
            newUser.isEmailVerified,
          ]
        ).catch((err) => logger.warn("[Postgres insert user warning]:", { details: err.message }));
      }
    });

    return newUser;
  }

  public updateUser(id: string, updates: Partial<UserRecord>): UserRecord {
    const users = this.getAllUsers();
    const index = users.findIndex((u) => u.id === id);
    if (index === -1) {
      throw new Error("User not found");
    }

    const { id: _, passwordHash: updatedHash, role: requestedRole, ...safeUpdates } = updates;
    const current = users[index];

    // Prevent unauthorized SuperAdmin role demotion
    let targetRole = current.role;
    if (requestedRole !== undefined) {
      if (current.role === "superadmin" && requestedRole !== "superadmin") {
        logger.warn(`[Security] Blocked attempt to demote SuperAdmin user ${current.email}`);
      } else {
        targetRole = requestedRole;
      }
    }

    const updated: UserRecord = {
      ...current,
      ...safeUpdates,
      passwordHash: updatedHash || current.passwordHash,
      role: targetRole,
      updatedAt: new Date().toISOString(),
    };

    users[index] = updated;
    this.writeJson(this.usersFile, users);

    // Replicate to Postgres
    getPostgresPool().then((pool) => {
      if (pool) {
        pool.query(
          `UPDATE users SET name = $1, password_hash = $2, role = $3, plan = $4, status = $5,
           ai_credits_remaining = $6, is_email_verified = $7, updated_at = CURRENT_TIMESTAMP
           WHERE id = $8`,
          [
            updated.name,
            updated.passwordHash,
            updated.role,
            updated.plan,
            updated.status,
            updated.aiCreditsRemaining,
            updated.isEmailVerified,
            updated.id,
          ]
        ).catch((err) => logger.warn("[Postgres update user warning]:", { details: err.message }));
      }
    });

    return updated;
  }

  public checkAndResetDailyCredits(user: UserRecord): UserRecord {
    const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const today = this.getTodayDateString();

    const isSuper = user.role === "superadmin";
    const isPro = user.plan === "studio_pro" || user.plan === "creator";

    if (!user.nextCreditResetTimestamp) {
      return this.updateUser(user.id, {
        creditsCycleDays: 3,
        lastCreditResetTimestamp: now,
        nextCreditResetTimestamp: now + THREE_DAYS_MS,
      });
    }

    if (now >= user.nextCreditResetTimestamp) {
      const resetLimit = isSuper ? 999999 : isPro ? 50000 : user.dailyCreditsLimit || 500;
      return this.updateUser(user.id, {
        aiCreditsRemaining: resetLimit,
        lastCreditResetDate: today,
        lastCreditResetTimestamp: now,
        nextCreditResetTimestamp: now + THREE_DAYS_MS,
        creditsCycleDays: 3,
      });
    }

    return user;
  }

  // --- SESSIONS ---
  public createSession(
    userId: string,
    durationMs = config.sessionExpiryDays * 24 * 60 * 60 * 1000,
    meta?: { userAgent?: string; ipAddress?: string }
  ): SessionRecord {
    const sessions = this.readJson<SessionRecord[]>(this.sessionsFile, []);
    const token = "sess_" + crypto.randomBytes(32).toString("hex");
    const session: SessionRecord = {
      token,
      userId,
      createdAt: Date.now(),
      expiresAt: Date.now() + durationMs,
      userAgent: meta?.userAgent,
      ipAddress: meta?.ipAddress,
    };
    sessions.push(session);
    this.writeJson(this.sessionsFile, sessions);

    getPostgresPool().then((pool) => {
      if (pool) {
        pool.query(
          `INSERT INTO sessions (token, user_id, user_agent, ip_address, expires_at)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (token) DO UPDATE SET expires_at = $5`,
          [session.token, session.userId, session.userAgent || null, session.ipAddress || null, session.expiresAt]
        ).catch((err) => logger.warn("[Postgres insert session warning]:", { details: err.message }));
      }
    });

    return session;
  }

  public getSession(token: string): SessionRecord | null {
    const sessions = this.readJson<SessionRecord[]>(this.sessionsFile, []);
    const session = sessions.find((s) => s.token === token);
    if (!session) return null;
    if (session.expiresAt < Date.now()) {
      this.deleteSession(token);
      return null;
    }
    return session;
  }

  public deleteSession(token: string) {
    let sessions = this.readJson<SessionRecord[]>(this.sessionsFile, []);
    sessions = sessions.filter((s) => s.token !== token);
    this.writeJson(this.sessionsFile, sessions);

    getPostgresPool().then((pool) => {
      if (pool) {
        pool.query("DELETE FROM sessions WHERE token = $1", [token]).catch(() => {});
      }
    });
  }

  public deleteUserSessions(userId: string) {
    let sessions = this.readJson<SessionRecord[]>(this.sessionsFile, []);
    sessions = sessions.filter((s) => s.userId !== userId);
    this.writeJson(this.sessionsFile, sessions);

    getPostgresPool().then((pool) => {
      if (pool) {
        pool.query("DELETE FROM sessions WHERE user_id = $1", [userId]).catch(() => {});
      }
    });
  }

  // --- PASSWORD RESET TOKENS ---
  public createPasswordResetToken(email: string): string {
    const cleanEmail = email.toLowerCase().trim();
    const tokens = this.readJson<PasswordResetTokenRecord[]>(this.resetTokensFile, []);

    // 6-digit numeric verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const tokenHash = bcrypt.hashSync(code, 10);
    const expiresAt = Date.now() + config.passwordResetExpiryMinutes * 60 * 1000;

    const record: PasswordResetTokenRecord = {
      id: "rst_" + crypto.randomUUID(),
      email: cleanEmail,
      code,
      tokenHash,
      expiresAt,
      used: false,
      createdAt: new Date().toISOString(),
    };

    tokens.push(record);
    this.writeJson(this.resetTokensFile, tokens);

    getPostgresPool().then((pool) => {
      if (pool) {
        pool.query(
          `INSERT INTO password_reset_tokens (id, email, code, token_hash, expires_at, used)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [record.id, record.email, record.code, record.tokenHash, record.expiresAt, false]
        ).catch(() => {});
      }
    });

    return code;
  }

  public verifyPasswordResetToken(email: string, code: string): boolean {
    const cleanEmail = email.toLowerCase().trim();
    const cleanCode = code.trim();
    const tokens = this.readJson<PasswordResetTokenRecord[]>(this.resetTokensFile, []);

    const match = tokens.find(
      (t) => t.email === cleanEmail && t.code === cleanCode && !t.used && t.expiresAt > Date.now()
    );
    return Boolean(match);
  }

  public consumePasswordResetToken(email: string, code: string): boolean {
    const cleanEmail = email.toLowerCase().trim();
    const cleanCode = code.trim();
    const tokens = this.readJson<PasswordResetTokenRecord[]>(this.resetTokensFile, []);

    const match = tokens.find(
      (t) => t.email === cleanEmail && t.code === cleanCode && !t.used && t.expiresAt > Date.now()
    );
    if (!match) return false;

    match.used = true;
    this.writeJson(this.resetTokensFile, tokens);

    getPostgresPool().then((pool) => {
      if (pool) {
        pool.query("UPDATE password_reset_tokens SET used = true WHERE id = $1", [match.id]).catch(() => {});
      }
    });

    return true;
  }

  // --- PROJECTS ---
  public getUserProjects(userId: string): ProjectRecord[] {
    const projects = this.readJson<ProjectRecord[]>(this.projectsFile, []);
    return projects.filter((p) => p.userId === userId);
  }

  public getProjectById(projectId: string, userId: string): ProjectRecord | null {
    const projects = this.readJson<ProjectRecord[]>(this.projectsFile, []);
    const proj = projects.find((p) => p.id === projectId);
    if (!proj || proj.userId !== userId) return null;
    return proj;
  }

  public saveProject(project: Omit<ProjectRecord, "createdAt" | "updatedAt" | "id"> & { id?: string }): ProjectRecord {
    const projects = this.readJson<ProjectRecord[]>(this.projectsFile, []);
    const now = new Date().toISOString();

    if (project.id) {
      const idx = projects.findIndex((p) => p.id === project.id && p.userId === project.userId);
      if (idx !== -1) {
        const updated: ProjectRecord = {
          ...projects[idx],
          ...project,
          id: project.id,
          updatedAt: now,
        };
        projects[idx] = updated;
        this.writeJson(this.projectsFile, projects);

        getPostgresPool().then((pool) => {
          if (pool) {
            pool.query(
              `UPDATE projects SET title = $1, description = $2, aspect_ratio = $3, resolution = $4,
               fps = $5, duration = $6, tracks = $7, thumbnail_url = $8, updated_at = CURRENT_TIMESTAMP
               WHERE id = $9 AND user_id = $10`,
              [
                updated.title,
                updated.description || null,
                updated.aspectRatio,
                updated.resolution,
                updated.fps,
                updated.duration,
                JSON.stringify(updated.tracks),
                updated.thumbnailUrl || null,
                updated.id,
                updated.userId,
              ]
            ).catch(() => {});
          }
        });

        return updated;
      }
    }

    const newProject: ProjectRecord = {
      ...project,
      id: project.id || "proj_" + crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    projects.push(newProject);
    this.writeJson(this.projectsFile, projects);

    getPostgresPool().then((pool) => {
      if (pool) {
        pool.query(
          `INSERT INTO projects (id, user_id, title, description, aspect_ratio, resolution, fps, duration, tracks, thumbnail_url)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (id) DO NOTHING`,
          [
            newProject.id,
            newProject.userId,
            newProject.title,
            newProject.description || null,
            newProject.aspectRatio,
            newProject.resolution,
            newProject.fps,
            newProject.duration,
            JSON.stringify(newProject.tracks),
            newProject.thumbnailUrl || null,
          ]
        ).catch(() => {});
      }
    });

    return newProject;
  }

  public deleteProject(projectId: string, userId: string): boolean {
    let projects = this.readJson<ProjectRecord[]>(this.projectsFile, []);
    const initialLen = projects.length;
    projects = projects.filter((p) => !(p.id === projectId && p.userId === userId));
    if (projects.length !== initialLen) {
      this.writeJson(this.projectsFile, projects);
      getPostgresPool().then((pool) => {
        if (pool) {
          pool.query("DELETE FROM projects WHERE id = $1 AND user_id = $2", [projectId, userId]).catch(() => {});
        }
      });
      return true;
    }
    return false;
  }

  // --- PAYMENTS ---
  public getPayments(): PaymentRecord[] {
    return this.readJson<PaymentRecord[]>(this.paymentsFile, []);
  }

  public createPayment(data: {
    userId: string;
    userEmail: string;
    plan: UserPlan;
    amountPkr: number;
    tid: string;
    senderPhone?: string;
  }): PaymentRecord {
    const payments = this.getPayments();
    const newPayment: PaymentRecord = {
      id: "pay_" + crypto.randomUUID(),
      ...data,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    payments.push(newPayment);
    this.writeJson(this.paymentsFile, payments);

    getPostgresPool().then((pool) => {
      if (pool) {
        pool.query(
          `INSERT INTO payments (id, user_id, user_email, plan, amount_pkr, tid, sender_phone, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (id) DO NOTHING`,
          [
            newPayment.id,
            newPayment.userId,
            newPayment.userEmail,
            newPayment.plan,
            newPayment.amountPkr,
            newPayment.tid,
            newPayment.senderPhone || null,
            newPayment.status,
          ]
        ).catch(() => {});
      }
    });

    return newPayment;
  }

  public updatePaymentStatus(paymentId: string, status: "confirmed" | "rejected", adminUserId: string): PaymentRecord {
    const payments = this.getPayments();
    const payment = payments.find((p) => p.id === paymentId);
    if (!payment) throw new Error("Payment record not found");

    payment.status = status;
    payment.verifiedAt = new Date().toISOString();
    payment.verifiedBy = adminUserId;
    this.writeJson(this.paymentsFile, payments);

    if (status === "confirmed") {
      const user = this.findUserById(payment.userId);
      if (user) {
        this.updateUser(user.id, {
          plan: payment.plan,
          storageLimitMb: 500000,
        });
      }
    }

    getPostgresPool().then((pool) => {
      if (pool) {
        pool.query(
          `UPDATE payments SET status = $1, verified_by = $2, verified_at = CURRENT_TIMESTAMP WHERE id = $3`,
          [status, adminUserId, paymentId]
        ).catch(() => {});
      }
    });

    return payment;
  }

  // --- AUDIT LOGS ---
  public getAuditLogs(): AuditLogRecord[] {
    return this.readJson<AuditLogRecord[]>(this.auditLogsFile, []);
  }

  public addAuditLog(entry: Omit<AuditLogRecord, "id" | "timestamp">): AuditLogRecord {
    const logs = this.getAuditLogs();
    const newLog: AuditLogRecord = {
      id: "log_" + crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      ...entry,
    };
    logs.unshift(newLog);
    if (logs.length > 1000) logs.length = 1000;
    this.writeJson(this.auditLogsFile, logs);

    getPostgresPool().then((pool) => {
      if (pool) {
        pool.query(
          `INSERT INTO audit_logs (id, timestamp, user_id, user_email, event_type, ip_address, status, details, metadata)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            newLog.id,
            Date.now(),
            newLog.userId || null,
            newLog.userEmail || null,
            newLog.eventType,
            newLog.ipAddress,
            newLog.status,
            newLog.details,
            newLog.metadata ? JSON.stringify(newLog.metadata) : null,
          ]
        ).catch(() => {});
      }
    });

    return newLog;
  }
}

export const db = new Database();
