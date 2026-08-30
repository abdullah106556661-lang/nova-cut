import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { apiFetch, setAuthToken } from "../utils/api";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  plan: "free" | "creator" | "studio_pro";
  role: "user" | "creator" | "admin" | "superadmin";
  storageUsedMb: number;
  storageLimitMb: number;
  aiCreditsRemaining: number;
  dailyCreditsLimit: number;
  lastCreditResetDate: string; // YYYY-MM-DD
  jazzCashTid?: string;
  projectsCount: number;
  isEmailVerified: boolean;
  joinedDate?: string;
  status?: "ACTIVE" | "SUSPENDED";
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

export const DAILY_CREDITS_MAX = 500;
export const COST_PHOTO = 5;
export const COST_VIDEO = 10;
export const COST_PROMPT = 10;
export const JAZZCASH_NUMBER = "03176901963";
export const JAZZCASH_TITLE = "Abdullah / NovaCut Pro";

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isPro: boolean;
  loading: boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  signUp: (name: string, email: string, password?: string) => Promise<boolean>;
  loginWithGoogle: (customEmail?: string, customName?: string) => Promise<boolean>;
  continueAsGuest: () => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<boolean>;
  deductCredits: (amount: number, reason?: string) => boolean;
  resetDailyCredits: () => Promise<void>;
  activateProWithJazzCash: (tid: string, senderPhone?: string) => Promise<boolean>;

  // Modals & UI
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  authInitialTab: "login" | "signup" | "forgot" | "verify" | "jazzcash";
  setAuthInitialTab: (tab: "login" | "signup" | "forgot" | "verify" | "jazzcash") => void;
  jazzCashModalOpen: boolean;
  setJazzCashModalOpen: (open: boolean) => void;

  // Password & Verification
  requestPasswordReset: (email: string) => Promise<boolean>;
  verifyResetCode: (email: string, code: string) => Promise<boolean>;
  completePasswordReset: (email: string, code: string, newPass: string) => Promise<boolean>;
  directPasswordReset: (email: string, newPass: string) => Promise<boolean>;
  sendVerificationEmail: () => Promise<boolean>;
  verifyEmailCode: (code: string) => Promise<boolean>;

  // Notifications
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (title: string, message: string, type?: "info" | "success" | "warning" | "error", actionUrl?: string) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearNotifications: () => void;
}

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: "notif_1",
    title: "Welcome to NovaCut AI Studio",
    message: "Your daily 500 AI Generation Credits have been reset. Enjoy creating!",
    type: "success",
    timestamp: "Just now",
    read: false,
  },
  {
    id: "notif_2",
    title: "Pro Plan via JazzCash (03176901963)",
    message: "Upgrade to Pro with JazzCash for unlimited 4K exports and priority Gemini Live conversation.",
    type: "info",
    timestamp: "10m ago",
    read: false,
  },
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authInitialTab, setAuthInitialTab] = useState<"login" | "signup" | "forgot" | "verify" | "jazzcash">("login");
  const [jazzCashModalOpen, setJazzCashModalOpen] = useState(false);

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem("novacut_notifications");
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_NOTIFICATIONS;
  });

  const addNotification = useCallback(
    (title: string, message: string, type: "info" | "success" | "warning" | "error" = "info", actionUrl?: string) => {
      const newNotif: AppNotification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        title,
        message,
        type,
        timestamp: "Just now",
        read: false,
        actionUrl,
      };
      setNotifications((prev) => [newNotif, ...prev]);
    },
    []
  );

  // Sync notifications to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("novacut_notifications", JSON.stringify(notifications));
    } catch {}
  }, [notifications]);

  // Fetch current session from server on mount
  const refreshUser = useCallback(async () => {
    try {
      const res = await apiFetch("/api/auth/me", {
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.token) {
          setAuthToken(data.token);
        }
        if (data.authenticated && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const markNotificationAsRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Server-authorized role checks
  const isSuperAdmin = Boolean(user && user.role === "superadmin");
  const isAdmin = Boolean(user && (user.role === "admin" || user.role === "superadmin"));
  const isPro = Boolean(user && (user.plan === "studio_pro" || user.plan === "creator" || isAdmin));

  // Deduct credits on client state optimistically (verified and enforced on server on every API call)
  const deductCredits = useCallback(
    (amount: number, reason = "AI Generation"): boolean => {
      if (!user) {
        return true; // Don't block client if server handles guest session
      }

      if (isSuperAdmin) {
        return true;
      }

      if (user.aiCreditsRemaining >= amount) {
        const remaining = user.aiCreditsRemaining - amount;
        setUser((prev) => (prev ? { ...prev, aiCreditsRemaining: remaining } : null));
        return true;
      } else {
        addNotification(
          "Insufficient Credits",
          `You need ${amount} credits for ${reason}. Your balance is ${user.aiCreditsRemaining} / 500 Daily Credits. Daily reset provides 500 fresh credits every 24 hours.`,
          "warning"
        );
        return false;
      }
    },
    [user, isSuperAdmin, addNotification]
  );

  // Reset daily credits to 500
  const resetDailyCredits = useCallback(async () => {
    if (!user) return;
    try {
      const res = await apiFetch("/api/auth/reset-daily-credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (res.ok) {
        await refreshUser();
        addNotification("Daily Credits Reset", data.message || "Successfully reset your balance to 500 Daily AI Credits!", "success");
      }
    } catch {
      addNotification("Reset Error", "Could not refresh daily credits.", "error");
    }
  }, [user, refreshUser, addNotification]);

  // Activate Pro Plan via JazzCash
  const activateProWithJazzCash = useCallback(
    async (tid: string, senderPhone = ""): Promise<boolean> => {
      if (!user) {
        setAuthModalOpen(true);
        return false;
      }

      try {
        const res = await apiFetch("/api/payments/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tid, senderPhone, plan: "studio_pro", amountPkr: 1500 }),
        });

        const data = await res.json();
        if (!res.ok) {
          addNotification("Payment Error", data.error || "Failed to submit JazzCash transaction.", "error");
          return false;
        }

        await refreshUser();
        setJazzCashModalOpen(false);
        addNotification("Pro Plan Activated 🎉", data.message || `JazzCash TID: ${tid} confirmed!`, "success");
        return true;
      } catch (err: any) {
        addNotification("Network Error", err.message || "Failed to verify transaction.", "error");
        return false;
      }
    },
    [user, refreshUser, addNotification]
  );

  // Secure Server-side Login
  const login = async (email: string, password = ""): Promise<boolean> => {
    try {
      const res = await apiFetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to sign in");
      }

      if (data.token) {
        setAuthToken(data.token);
      }
      setUser(data.user);
      setAuthModalOpen(false);
      addNotification(
        "Signed In Successfully",
        `Welcome ${data.user.name}! ${data.user.role === "superadmin" ? "SuperAdmin Unlimited Access Active." : "500 Daily AI Credits ready."}`,
        "success"
      );
      return true;
    } catch (err: any) {
      addNotification("Sign In Failed", err.message || "Invalid credentials", "error");
      throw err;
    }
  };

  // Secure Server-side Signup
  const signUp = async (name: string, email: string, password = ""): Promise<boolean> => {
    try {
      const res = await apiFetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to register account");
      }

      if (data.token) {
        setAuthToken(data.token);
      }
      setUser(data.user);
      setAuthModalOpen(false);
      addNotification(
        "Account Created Successfully",
        `Welcome to NovaCut Studio, ${data.user.name}! 500 Daily AI Credits added to your account.`,
        "success"
      );
      return true;
    } catch (err: any) {
      addNotification("Registration Failed", err.message || "Registration error", "error");
      throw err;
    }
  };

  // Google OAuth / Identity Flow
  const loginWithGoogle = async (customEmail?: string, customName?: string): Promise<boolean> => {
    try {
      const targetEmail = customEmail || user?.email || "creator.studio@gmail.com";
      const targetName = customName || "Google Creator";

      const res = await apiFetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail, name: targetName }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Google authentication failed");
      }

      if (data.token) {
        setAuthToken(data.token);
      }
      setUser(data.user);
      setAuthModalOpen(false);
      addNotification("Google Sign-In", `Authenticated as ${data.user.email} (Role: ${data.user.role})`, "success");
      return true;
    } catch (err: any) {
      addNotification("Google Auth Failed", err.message || "Google auth error", "error");
      return false;
    }
  };

  // 1-Click Guest & Demo Access
  const continueAsGuest = async (): Promise<boolean> => {
    try {
      const res = await apiFetch("/api/auth/guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to initialize guest session");
      }

      if (data.token) {
        setAuthToken(data.token);
      }
      setUser(data.user);
      setAuthModalOpen(false);
      addNotification("Welcome Guest Creator", "500 Daily AI Generation Credits ready for use!", "success");
      return true;
    } catch (err: any) {
      // Fallback local guest session if offline
      const guestLocal: UserProfile = {
        id: `guest_${Date.now()}`,
        name: "Guest Creator",
        email: "guest@novacut.local",
        avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        plan: "free",
        role: "creator",
        storageUsedMb: 0,
        storageLimitMb: 5000,
        aiCreditsRemaining: 500,
        dailyCreditsLimit: 500,
        lastCreditResetDate: new Date().toISOString().split("T")[0],
        projectsCount: 1,
        isEmailVerified: true,
        status: "ACTIVE",
      };
      setUser(guestLocal);
      setAuthModalOpen(false);
      addNotification("Welcome Guest Creator", "500 Daily AI Generation Credits active.", "success");
      return true;
    }
  };

  // Logout
  const logout = async () => {
    try {
      await apiFetch("/api/auth/logout", {
        method: "POST",
      });
    } catch {}
    setAuthToken("");
    setUser(null);
    addNotification("Signed Out", "You have securely logged out of NovaCut.", "info");
  };

  // Update Profile
  const updateProfile = async (updates: Partial<UserProfile>): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updates),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile");

      setUser(data.user);
      addNotification("Profile Updated", "Your profile details have been saved.", "success");
      return true;
    } catch (err: any) {
      addNotification("Update Failed", err.message, "error");
      return false;
    }
  };

  // Password reset
  const requestPasswordReset = async (email: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      addNotification("Password Reset Code", data.message || `Verification code sent to ${email}`, "info");
      return true;
    } catch {
      return false;
    }
  };

  const verifyResetCode = async (email: string, code: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/verify-reset-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      return Boolean(res.ok && data.valid);
    } catch {
      return false;
    }
  };

  const completePasswordReset = async (email: string, code: string, newPass: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, newPassword: newPass }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reset password");
      addNotification("Password Reset Complete", data.message || "Password updated. You can now sign in.", "success");
      return true;
    } catch (err: any) {
      addNotification("Reset Failed", err.message, "error");
      return false;
    }
  };

  const directPasswordReset = async (email: string, newPass: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/direct-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword: newPass }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update password");
      if (data.token) {
        setAuthToken(data.token);
      }
      setUser(data.user);
      setAuthModalOpen(false);
      addNotification("Password Updated Successfully", "Your new password is now active and you are signed in.", "success");
      return true;
    } catch (err: any) {
      addNotification("Reset Failed", err.message, "error");
      return false;
    }
  };

  // Verification
  const sendVerificationEmail = async (): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/send-verification", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      addNotification("Verification Code", data.message || "Code sent to your email.", "info");
      return true;
    } catch {
      return false;
    }
  };

  const verifyEmailCode = async (code: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");
      await refreshUser();
      addNotification("Email Verified", "Your email address is now fully verified.", "success");
      return true;
    } catch (err: any) {
      addNotification("Verification Error", err.message, "error");
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isAdmin,
        isSuperAdmin,
        isPro,
        loading,
        login,
        signUp,
        loginWithGoogle,
        continueAsGuest,
        logout,
        refreshUser,
        updateProfile,
        deductCredits,
        resetDailyCredits,
        activateProWithJazzCash,
        authModalOpen,
        setAuthModalOpen,
        authInitialTab,
        setAuthInitialTab,
        jazzCashModalOpen,
        setJazzCashModalOpen,
        requestPasswordReset,
        verifyResetCode,
        completePasswordReset,
        directPasswordReset,
        sendVerificationEmail,
        verifyEmailCode,
        notifications,
        unreadCount,
        addNotification,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        clearNotifications,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
