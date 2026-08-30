import fs from "fs";
import path from "path";
import crypto from "crypto";
import bcrypt from "bcryptjs";

// Ensure data directory exists
const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
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
  eventType: "AUTH_LOGIN" | "AUTH_SIGNUP" | "AUTH_LOGOUT" | "PRIVILEGE_ESCALATION" | "API_CALL" | "ACCESS_DENIED" | "PROJECT_CREATE" | "PROJECT_DELETE" | "CREDIT_DEDUCT" | "PAYMENT_SUBMIT" | "ADMIN_ACTION" | "SECURITY_ALERT";
  userId?: string;
  userEmail?: string;
  ipAddress: string;
  status: "SUCCESS" | "BLOCKED" | "WARNING" | "CRITICAL";
  details: string;
}

class Database {
  private usersFile = path.join(DATA_DIR, "users.json");
  private sessionsFile = path.join(DATA_DIR, "sessions.json");
  private projectsFile = path.join(DATA_DIR, "projects.json");
  private paymentsFile = path.join(DATA_DIR, "payments.json");
  private auditLogsFile = path.join(DATA_DIR, "audit_logs.json");

  constructor() {
    this.initDatabase();
  }

  private readJson<T>(filePath: string, fallback: T): T {
    try {
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, "utf-8");
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error(`Error reading ${filePath}:`, e);
    }
    return fallback;
  }

  private writeJson(filePath: string, data: any) {
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
    } catch (e) {
      console.error(`Error writing ${filePath}:`, e);
    }
  }

  private getTodayDateString(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  private initDatabase() {
    // Initialize users
    const users = this.readJson<UserRecord[]>(this.usersFile, []);
    const superAdminEmail = (process.env.SUPERADMIN_EMAIL || "abdullah106556661@gmail.com").toLowerCase().trim();
    
    // Check if initial SuperAdmin exists
    const adminUserIndex = users.findIndex((u) => u.email.toLowerCase() === superAdminEmail);
    if (adminUserIndex === -1 && superAdminEmail) {
      const initialPassword = process.env.SUPERADMIN_INITIAL_PASSWORD || crypto.randomBytes(16).toString("hex");
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
    } else if (adminUserIndex !== -1) {
      // Preserve existing password hash and settings completely
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

    // Normal signups ALWAYS receive 'user' role - NEVER superadmin or admin
    const newUser: UserRecord = {
      id: "usr_" + crypto.randomUUID(),
      email: cleanEmail,
      name: userData.name.trim() || cleanEmail.split("@")[0],
      passwordHash: userData.passwordHash,
      role: "user",
      plan: "free",
      avatarUrl: userData.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanEmail}`,
      aiCreditsRemaining: 500, // 500 daily credits
      dailyCreditsLimit: 500,
      lastCreditResetDate: this.getTodayDateString(),
      storageUsedMb: 0,
      storageLimitMb: 5000,
      isEmailVerified: false,
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    users.push(newUser);
    this.writeJson(this.usersFile, users);
    return newUser;
  }

  public updateUser(id: string, updates: Partial<UserRecord>): UserRecord {
    const users = this.getAllUsers();
    const index = users.findIndex((u) => u.id === id);
    if (index === -1) {
      throw new Error("User not found");
    }

    // Protect immutable fields
    const { id: _, passwordHash: updatedHash, role: requestedRole, ...safeUpdates } = updates;

    const current = users[index];
    const updated: UserRecord = {
      ...current,
      ...safeUpdates,
      passwordHash: updatedHash || current.passwordHash,
      role: requestedRole !== undefined ? requestedRole : current.role,
      updatedAt: new Date().toISOString(),
    };

    users[index] = updated;
    this.writeJson(this.usersFile, users);
    return updated;
  }

  public checkAndResetDailyCredits(user: UserRecord): UserRecord {
    const today = this.getTodayDateString();
    if (user.lastCreditResetDate !== today) {
      const isSuper = user.role === "superadmin";
      return this.updateUser(user.id, {
        aiCreditsRemaining: isSuper ? 999999 : user.dailyCreditsLimit || 500,
        lastCreditResetDate: today,
      });
    }
    return user;
  }

  // --- SESSIONS ---
  public createSession(userId: string, durationMs = 7 * 24 * 60 * 60 * 1000): SessionRecord {
    const sessions = this.readJson<SessionRecord[]>(this.sessionsFile, []);
    const token = "sess_" + crypto.randomBytes(32).toString("hex");
    const session: SessionRecord = {
      token,
      userId,
      createdAt: Date.now(),
      expiresAt: Date.now() + durationMs,
    };
    sessions.push(session);
    this.writeJson(this.sessionsFile, sessions);
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
  }

  public deleteUserSessions(userId: string) {
    let sessions = this.readJson<SessionRecord[]>(this.sessionsFile, []);
    sessions = sessions.filter((s) => s.userId !== userId);
    this.writeJson(this.sessionsFile, sessions);
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
    return newProject;
  }

  public deleteProject(projectId: string, userId: string): boolean {
    let projects = this.readJson<ProjectRecord[]>(this.projectsFile, []);
    const initialLen = projects.length;
    projects = projects.filter((p) => !(p.id === projectId && p.userId === userId));
    if (projects.length !== initialLen) {
      this.writeJson(this.projectsFile, projects);
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
    // Keep max 1000 logs
    if (logs.length > 1000) logs.length = 1000;
    this.writeJson(this.auditLogsFile, logs);
    return newLog;
  }
}

export const db = new Database();
