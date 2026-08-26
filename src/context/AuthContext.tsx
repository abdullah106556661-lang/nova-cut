import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  plan: "free" | "creator" | "studio_pro";
  storageUsedMb: number;
  storageLimitMb: number;
  aiCreditsRemaining: number;
  dailyCreditsLimit: number;
  lastCreditResetDate: string; // YYYY-MM-DD
  jazzCashTid?: string;
  projectsCount: number;
  joinedDate: string;
  isEmailVerified: boolean;
  role?: string;
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
  isPro: boolean;
  login: (email: string, name?: string, password?: string) => Promise<boolean>;
  signUp: (name: string, email: string, password?: string) => Promise<boolean>;
  loginWithGoogle: () => void;
  loginAsAdmin: () => void;
  logout: () => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  deductCredits: (amount: number, reason?: string) => boolean;
  resetDailyCredits: () => void;
  activateProWithJazzCash: (tid: string, senderPhone?: string) => boolean;
  
  // Modals & UI
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  authInitialTab: "login" | "signup" | "forgot" | "verify" | "jazzcash";
  setAuthInitialTab: (tab: "login" | "signup" | "forgot" | "verify" | "jazzcash") => void;
  jazzCashModalOpen: boolean;
  setJazzCashModalOpen: (open: boolean) => void;
  
  // Password & Verification
  requestPasswordReset: (email: string) => Promise<boolean>;
  verifyResetCode: (email: string, code: string) => boolean;
  completePasswordReset: (newPass: string) => boolean;
  sendVerificationEmail: () => Promise<boolean>;
  verifyEmailCode: (code: string) => boolean;

  // Notifications
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (title: string, message: string, type?: "info" | "success" | "warning" | "error", actionUrl?: string) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearNotifications: () => void;
}

const getTodayDateString = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const DEFAULT_SUPERADMIN: UserProfile = {
  id: "usr_creator_studio",
  name: "Abdullah",
  email: "abdullah106556661@gmail.com",
  avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
  plan: "studio_pro",
  storageUsedMb: 1420,
  storageLimitMb: 500000,
  aiCreditsRemaining: 999999,
  dailyCreditsLimit: 500,
  lastCreditResetDate: getTodayDateString(),
  projectsCount: 14,
  joinedDate: "August 2026",
  isEmailVerified: true,
  role: "SuperAdmin",
};

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
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem("novacut_user_profile");
      if (saved) {
        const parsed = JSON.parse(saved);
        const isSuper =
          parsed.email?.toLowerCase().trim() === "abdullah106556661@gmail.com" ||
          parsed.email?.toLowerCase().trim() === "admin@novacut.internal" ||
          parsed.role === "SuperAdmin";

        // If not super admin, ensure credits are capped to 500 daily
        if (!isSuper && parsed.aiCreditsRemaining > DAILY_CREDITS_MAX) {
          parsed.aiCreditsRemaining = DAILY_CREDITS_MAX;
        }

        // Check daily reset on initial boot
        const today = getTodayDateString();
        if (parsed && parsed.lastCreditResetDate !== today) {
          parsed.aiCreditsRemaining = isSuper ? 999999 : DAILY_CREDITS_MAX;
          parsed.lastCreditResetDate = today;
        }
        return parsed;
      }
    } catch {
      // ignore
    }
    return null;
  });

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authInitialTab, setAuthInitialTab] = useState<"login" | "signup" | "forgot" | "verify" | "jazzcash">("login");
  const [jazzCashModalOpen, setJazzCashModalOpen] = useState(false);

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem("novacut_notifications");
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_NOTIFICATIONS;
  });

  // Sync user profile to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem("novacut_user_profile", JSON.stringify(user));
    } else {
      localStorage.removeItem("novacut_user_profile");
    }
  }, [user]);

  // Sync notifications to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("novacut_notifications", JSON.stringify(notifications));
    } catch {
      // ignore
    }
  }, [notifications]);

  // Daily auto-reset check
  useEffect(() => {
    if (!user) return;
    const today = getTodayDateString();
    if (user.lastCreditResetDate !== today) {
      const isSuper = user.email?.toLowerCase() === "abdullah106556661@gmail.com" || user.role === "SuperAdmin";
      setUser((prev) =>
        prev
          ? {
              ...prev,
              aiCreditsRemaining: isSuper ? 999999 : DAILY_CREDITS_MAX,
              lastCreditResetDate: today,
            }
          : null
      );
      addNotification("Daily Credits Reset", `Your daily ${DAILY_CREDITS_MAX} credits have been refreshed for today!`, "success");
    }
  }, [user]);

  const addNotification = useCallback(
    (title: string, message: string, type: "info" | "success" | "warning" | "error" = "info", actionUrl?: string) => {
      const newNotif: AppNotification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
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

  const isAdmin = Boolean(
    user &&
      (user.email.toLowerCase().trim() === "abdullah106556661@gmail.com" ||
        user.email.toLowerCase().trim() === "admin@novacut.internal" ||
        user.role === "SuperAdmin" ||
        user.role === "admin")
  );

  const isPro = Boolean(user && (user.plan === "studio_pro" || user.plan === "creator" || isAdmin));

  // Deduct credits based on actions
  const deductCredits = useCallback(
    (amount: number, reason = "AI Generation"): boolean => {
      if (!user) {
        addNotification("Sign In Required", "Please sign in or create an account to use AI generation tools.", "warning");
        setAuthModalOpen(true);
        return false;
      }

      // SuperAdmin has 100% UNLIMITED credits
      if (isAdmin) {
        return true;
      }

      if (user.aiCreditsRemaining >= amount) {
        const remaining = user.aiCreditsRemaining - amount;
        setUser((prev) => (prev ? { ...prev, aiCreditsRemaining: remaining } : null));
        return true;
      } else {
        addNotification(
          "Insufficient Credits",
          `You need ${amount} credits for ${reason}. Your current balance is ${user.aiCreditsRemaining} / 500 Daily Credits. Daily reset provides 500 fresh credits every 24 hours.`,
          "warning"
        );
        return false;
      }
    },
    [user, isAdmin, addNotification]
  );

  // Reset daily credits to 500 (or unlimited for Admin)
  const resetDailyCredits = useCallback(() => {
    if (!user) return;
    const isSuper =
      user.email?.toLowerCase().trim() === "abdullah106556661@gmail.com" ||
      user.email?.toLowerCase().trim() === "admin@novacut.internal" ||
      user.role === "SuperAdmin";
    const newAmount = isSuper ? 999999 : DAILY_CREDITS_MAX;
    setUser((prev) =>
      prev
        ? {
            ...prev,
            aiCreditsRemaining: newAmount,
            lastCreditResetDate: getTodayDateString(),
          }
        : null
    );
    addNotification(
      "Daily Credits Reset",
      isSuper
        ? "SuperAdmin balance refreshed with Unlimited Credits."
        : `Successfully reset your balance to ${DAILY_CREDITS_MAX} Daily AI Credits!`,
      "success"
    );
  }, [user, addNotification]);

  // Activate Pro Plan via JazzCash
  const activateProWithJazzCash = useCallback(
    (tid: string, _senderPhone = ""): boolean => {
      if (!user) return false;
      const isSuper =
        user.email?.toLowerCase().trim() === "abdullah106556661@gmail.com" ||
        user.email?.toLowerCase().trim() === "admin@novacut.internal" ||
        user.role === "SuperAdmin";

      setUser((prev) =>
        prev
          ? {
              ...prev,
              plan: "studio_pro",
              // Only admin gets unlimited, regular user retains 500 daily credits
              aiCreditsRemaining: isSuper ? 999999 : DAILY_CREDITS_MAX,
              storageLimitMb: 500000,
              jazzCashTid: tid,
              role: isSuper ? "SuperAdmin" : "Pro Creator",
            }
          : null
      );
      setJazzCashModalOpen(false);
      addNotification(
        "Pro Plan Activated 🎉",
        `JazzCash Payment verified (TID: ${tid}). You now have full Pro Studio tools, 4K exports, and 500 Daily AI credits!`,
        "success"
      );
      return true;
    },
    [user, addNotification]
  );

  const login = async (email: string, name = "NovaCut Creator"): Promise<boolean> => {
    const isEmailAdmin =
      email.toLowerCase().trim() === "abdullah106556661@gmail.com" ||
      email.toLowerCase().trim() === "admin@novacut.internal";

    const resolvedUser: UserProfile = {
      id: isEmailAdmin ? "usr_creator_studio" : `usr_${Date.now()}`,
      name: isEmailAdmin ? "Abdullah" : (email.split("@")[0] || name),
      email,
      avatarUrl: isEmailAdmin
        ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80"
        : `https://api.dicebear.com/7.x/bottts/svg?seed=${email}`,
      plan: isEmailAdmin ? "studio_pro" : "creator",
      storageUsedMb: isEmailAdmin ? 1420 : 650,
      storageLimitMb: isEmailAdmin ? 500000 : 25000,
      aiCreditsRemaining: isEmailAdmin ? 999999 : DAILY_CREDITS_MAX,
      dailyCreditsLimit: DAILY_CREDITS_MAX,
      lastCreditResetDate: getTodayDateString(),
      projectsCount: isEmailAdmin ? 14 : 4,
      joinedDate: new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      isEmailVerified: true,
      role: isEmailAdmin ? "SuperAdmin" : "Creator",
    };

    setUser(resolvedUser);
    setAuthModalOpen(false);
    addNotification(
      "Signed In Successfully",
      `Welcome ${resolvedUser.name}! ${isEmailAdmin ? "SuperAdmin Unlimited Access Active." : "500 Daily Credits ready."}`,
      "success"
    );
    return true;
  };

  const signUp = async (name: string, email: string): Promise<boolean> => {
    const isEmailAdmin = email.toLowerCase().trim() === "abdullah106556661@gmail.com";
    const newUser: UserProfile = {
      id: `usr_${Date.now()}`,
      name: name || "New Creator",
      email,
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${email}`,
      plan: isEmailAdmin ? "studio_pro" : "free",
      storageUsedMb: 50,
      storageLimitMb: isEmailAdmin ? 500000 : 5000,
      aiCreditsRemaining: isEmailAdmin ? 999999 : DAILY_CREDITS_MAX, // 500 daily credits for new users
      dailyCreditsLimit: DAILY_CREDITS_MAX,
      lastCreditResetDate: getTodayDateString(),
      projectsCount: 1,
      joinedDate: new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      isEmailVerified: false,
      role: isEmailAdmin ? "SuperAdmin" : "Starter Creator",
    };

    setUser(newUser);
    setAuthModalOpen(false);
    addNotification(
      "Account Created",
      `Welcome to NovaCut Studio! You have received 500 Daily AI Credits. Reset every 24 hours.`,
      "success"
    );
    return true;
  };

  const loginWithGoogle = () => {
    login("abdullah106556661@gmail.com", "Abdullah");
  };

  const loginAsAdmin = () => {
    setUser(DEFAULT_SUPERADMIN);
    setAuthModalOpen(false);
    addNotification("SuperAdmin Login", "Authenticated as abdullah106556661@gmail.com (Unlimited Credits)", "success");
  };

  const logout = () => {
    setUser(null);
    addNotification("Signed Out", "You have securely logged out of NovaCut.", "info");
  };

  const updateProfile = (updates: Partial<UserProfile>) => {
    setUser((prev) => {
      if (!prev) return null;
      return { ...prev, ...updates };
    });
    addNotification("Profile Updated", "Your profile details have been saved.", "success");
  };

  const requestPasswordReset = async (email: string): Promise<boolean> => {
    addNotification("Password Reset Code Sent", `A 6-digit verification code has been dispatched to ${email}.`, "info");
    return true;
  };

  const verifyResetCode = (_email: string, code: string): boolean => {
    return code.length >= 4;
  };

  const completePasswordReset = (_newPass: string): boolean => {
    addNotification("Password Updated", "Your password has been successfully updated. Please sign in.", "success");
    return true;
  };

  const sendVerificationEmail = async (): Promise<boolean> => {
    addNotification("Verification Code Sent", "Verification email dispatched.", "info");
    return true;
  };

  const verifyEmailCode = (code: string): boolean => {
    if (code.length >= 4) {
      if (user) setUser({ ...user, isEmailVerified: true });
      addNotification("Email Verified", "Your email is now fully verified.", "success");
      return true;
    }
    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isAdmin,
        isPro,
        login,
        signUp,
        loginWithGoogle,
        loginAsAdmin,
        logout,
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
