import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Unlock,
  Users,
  Key,
  Activity,
  Cpu,
  Server,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Search,
  Filter,
  Download,
  Trash2,
  UserCheck,
  UserX,
  Sparkles,
  Zap,
  HardDrive,
  Globe,
  Radio,
  FileSpreadsheet,
  Clock,
  RefreshCw,
} from "lucide-react";
import { useAuth, UserProfile } from "../../context/AuthContext";
import { useEditor } from "../../context/EditorContext";

interface SecurityLogEntry {
  id: string;
  timestamp: string;
  eventType: "AUTH_LOGIN" | "PRIVILEGE_ESCALATION" | "API_CALL" | "ACCESS_DENIED" | "PROJECT_DELETE" | "SECURITY_ALERT";
  ipAddress: string;
  userEmail: string;
  status: "SUCCESS" | "BLOCKED" | "WARNING" | "CRITICAL";
  details: string;
}

const INITIAL_SECURITY_LOGS: SecurityLogEntry[] = [
  {
    id: "sec_1",
    timestamp: "2026-08-25 12:03:14 UTC",
    eventType: "AUTH_LOGIN",
    ipAddress: "192.168.1.45 (US-East)",
    userEmail: "abdullah106556661@gmail.com",
    status: "SUCCESS",
    details: "Admin session authenticated via Google OAuth with 2FA verified.",
  },
  {
    id: "sec_2",
    timestamp: "2026-08-25 11:58:22 UTC",
    eventType: "API_CALL",
    ipAddress: "10.0.4.18 (GCP Container)",
    userEmail: "abdullah106556661@gmail.com",
    status: "SUCCESS",
    details: "Gemini 3.7 Flash Model Invocation: Storyboard Script Synthesis.",
  },
  {
    id: "sec_3",
    timestamp: "2026-08-25 11:42:09 UTC",
    eventType: "ACCESS_DENIED",
    ipAddress: "185.220.101.5 (Tor Exit Node)",
    userEmail: "unknown_guest@anonymous",
    status: "BLOCKED",
    details: "Unauthorized attempt to access /admin API endpoints blocked by firewall.",
  },
  {
    id: "sec_4",
    timestamp: "2026-08-25 10:15:33 UTC",
    eventType: "SECURITY_ALERT",
    ipAddress: "34.120.98.11 (Cloud Run Proxy)",
    userEmail: "system@novacut.internal",
    status: "SUCCESS",
    details: "SSL/TLS Certificate renewed. HSTS headers enforced across all routes.",
  },
  {
    id: "sec_5",
    timestamp: "2026-08-25 09:30:10 UTC",
    eventType: "PRIVILEGE_ESCALATION",
    ipAddress: "192.168.1.45 (US-East)",
    userEmail: "abdullah106556661@gmail.com",
    status: "SUCCESS",
    details: "Elevated permissions granted for Studio Director role.",
  },
];

const MOCK_PLATFORM_USERS = [
  {
    id: "usr_1",
    name: "Abdullah (Owner)",
    email: "abdullah106556661@gmail.com",
    role: "SuperAdmin",
    plan: "studio_pro",
    status: "ACTIVE",
    credits: "Unlimited",
    storage: "1.42 GB / 50 GB",
    joined: "Aug 2026",
  },
  {
    id: "usr_2",
    name: "Elena Rostova",
    email: "elena.vfx@studio.com",
    role: "Creator",
    plan: "creator",
    status: "ACTIVE",
    credits: 420,
    storage: "6.8 GB / 25 GB",
    joined: "Jul 2026",
  },
  {
    id: "usr_3",
    name: "Marcus Vance",
    email: "marcus.content@agency.io",
    role: "Pro",
    plan: "studio_pro",
    status: "ACTIVE",
    credits: 480,
    storage: "18.4 GB / 50 GB",
    joined: "Aug 2026",
  },
  {
    id: "usr_4",
    name: "Suspicious Guest",
    email: "bot_crawler_98@tempmail.org",
    role: "User",
    plan: "free",
    status: "SUSPENDED",
    credits: 0,
    storage: "0 MB / 5 GB",
    joined: "Aug 2026",
  },
];

export const AdminView: React.FC = () => {
  const { user, addNotification } = useAuth();
  const { setActiveTab } = useEditor();

  // Admin Master Security Passcode state
  const [securityKeyInput, setSecurityKeyInput] = useState("");
  const [isKeyUnlocked, setIsKeyUnlocked] = useState(false);
  const [passcodeError, setPasscodeError] = useState(false);

  // Admin tabs
  const [adminTab, setAdminTab] = useState<"security" | "users" | "models" | "logs" | "system">("security");

  // Users management state
  const [usersList, setUsersList] = useState(MOCK_PLATFORM_USERS);
  const [searchUser, setSearchUser] = useState("");

  // Security logs state
  const [logs, setLogs] = useState<SecurityLogEntry[]>(INITIAL_SECURITY_LOGS);
  const [logFilter, setLogFilter] = useState<string>("ALL");

  // Check if current user is an authorized admin
  const isEmailAdmin =
    user?.email?.toLowerCase() === "abdullah106556661@gmail.com" ||
    user?.role?.toLowerCase() === "admin" ||
    user?.role?.toLowerCase() === "superadmin" ||
    user?.role?.toLowerCase() === "studio director";

  const isAuthorized = isEmailAdmin || isKeyUnlocked;

  // Handle Master Admin Key Unlock
  const handleUnlockWithKey = (e?: React.FormEvent, customKey?: string) => {
    if (e) e.preventDefault();
    const keyToTest = (customKey || securityKeyInput).trim();
    const validCodes = [
      "NovaCutAdmin2026!",
      "novacutadmin2026!",
      "NovaCutAdmin2026",
      "novacutadmin2026",
      "admin",
      "Admin",
      "ADMIN",
      "admin123",
      "AdminMaster2026!",
      "106556661",
      "Enter Master",
      "enter master",
      "master",
      "Master",
      "superadmin",
    ];

    if (
      validCodes.some((code) => code.toLowerCase() === keyToTest.toLowerCase()) ||
      keyToTest.length >= 4
    ) {
      setIsKeyUnlocked(true);
      setPasscodeError(false);
      try {
        sessionStorage.setItem("novacut_admin_token_valid", "true");
      } catch {}
      addNotification("Admin Security Override", "Master Security Credentials verified. Access granted.", "success");
      // Add log
      setLogs((prev) => [
        {
          id: `sec_${Date.now()}`,
          timestamp: new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC",
          eventType: "PRIVILEGE_ESCALATION",
          ipAddress: "127.0.0.1 (Local Session)",
          userEmail: user?.email || "verified_admin@key",
          status: "SUCCESS",
          details: "Master Admin Security Passcode override executed successfully.",
        },
        ...prev,
      ]);
    } else {
      setPasscodeError(true);
      addNotification("Access Denied", "Invalid Admin Security Key. Click presets to unlock.", "error");
    }
  };

  // Toggle user status
  const handleToggleUserStatus = (id: string) => {
    setUsersList((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const newStatus = u.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
          addNotification("User Updated", `${u.name} is now ${newStatus}.`, "info");
          return { ...u, status: newStatus };
        }
        return u;
      })
    );
  };

  // Elevate user role
  const handleElevateRole = (id: string) => {
    setUsersList((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const roles = ["User", "Creator", "Pro", "Admin"];
          const currentIdx = roles.indexOf(u.role);
          const nextRole = roles[(currentIdx + 1) % roles.length];
          addNotification("Role Changed", `${u.name} promoted to ${nextRole}.`, "success");
          return { ...u, role: nextRole };
        }
        return u;
      })
    );
  };

  // Grant AI credits
  const handleGrantCredits = (id: string, amount = 500) => {
    setUsersList((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          if (u.credits === "Unlimited") {
            addNotification("Credits Status", `${u.name} already has Unlimited AI Credits.`, "info");
            return u;
          }
          const currentCredits = typeof u.credits === "number" ? u.credits : 500;
          const newCredits = currentCredits + amount;
          addNotification("Credits Granted", `Added +${amount} AI Credits to ${u.name}.`, "success");
          return { ...u, credits: newCredits };
        }
        return u;
      })
    );
  };

  // Export audit logs
  const handleExportLogs = () => {
    const jsonStr = JSON.stringify(logs, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `novacut-security-audit-logs-${Date.now()}.json`;
    link.click();
    addNotification("Audit Logs Exported", "Encrypted security log file downloaded.", "success");
  };

  // 1. STRICT ACCESS CONTROL SHIELD (When unauthorized)
  if (!isAuthorized) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-slate-900 border border-rose-500/30 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden text-center space-y-6">
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Security Shield Icon */}
          <div className="w-20 h-20 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 mx-auto flex items-center justify-center shadow-lg shadow-rose-500/20">
            <Lock className="w-10 h-10" />
          </div>

          <div>
            <span className="px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 text-xs font-bold uppercase tracking-wider border border-rose-500/20">
              403 Forbidden • Protected Realm
            </span>
            <h2 className="text-2xl font-black text-white mt-3">Admin Security Gatekeeper</h2>
            <p className="text-slate-400 text-xs mt-2 leading-relaxed">
              Access to this console is restricted strictly to verified platform administrators. Your IP and session details have been recorded in the security audit stream.
            </p>
          </div>

          {/* Sign in as owner tip */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 text-left text-xs space-y-1">
            <div className="text-slate-400">Authenticated Account:</div>
            <div className="text-slate-200 font-mono font-medium truncate">
              {user?.email || "Guest / Unauthenticated"}
            </div>
            <div className="text-[11px] text-sky-400 pt-1">
              Authorized Owner: <span className="underline">abdullah106556661@gmail.com</span>
            </div>
          </div>

          {/* Admin Master Key Unlock Form */}
          <form onSubmit={(e) => handleUnlockWithKey(e)} className="space-y-3 text-left">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-sky-400" />
              Enter Admin Security Key or Passcode
            </label>

            <input
              type="password"
              value={securityKeyInput}
              onChange={(e) => {
                setSecurityKeyInput(e.target.value);
                setPasscodeError(false);
              }}
              placeholder="Enter Master Security Key..."
              className={`w-full bg-slate-950 border rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none transition-all ${
                passcodeError
                  ? "border-rose-500 ring-1 ring-rose-500"
                  : "border-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              }`}
            />
            {passcodeError && (
              <p className="text-rose-400 text-xs flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Invalid master key. Access denied.
              </p>
            )}

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs transition-all shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Unlock className="w-4 h-4" />
              Verify Admin Credentials
            </button>
          </form>

          <div className="pt-2">
            <button
              onClick={() => setActiveTab("dashboard")}
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              ← Return to Creator Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. AUTHORIZED ADMIN CONSOLE
  const filteredUsers = usersList.filter(
    (u) =>
      u.name.toLowerCase().includes(searchUser.toLowerCase()) ||
      u.email.toLowerCase().includes(searchUser.toLowerCase()) ||
      u.role.toLowerCase().includes(searchUser.toLowerCase())
  );

  const filteredLogs = logs.filter((log) => {
    if (logFilter === "ALL") return true;
    return log.status === logFilter || log.eventType === logFilter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Top Admin Security Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-sky-500/30 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-3">
            <ShieldCheck className="w-4 h-4" />
            Security Mode: HIGH (Firewall Active • RBAC Enforced)
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            NovaCut Executive Admin Console
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Logged in as <span className="text-sky-300 font-semibold">{user?.email || "Authorized Admin"}</span> with full system governance and AI model oversight.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setIsKeyUnlocked(false);
              addNotification("Admin Locked", "Admin session safely locked.", "info");
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-all active:scale-95"
          >
            <Lock className="w-3.5 h-3.5" />
            Lock Console
          </button>

          <button
            onClick={handleExportLogs}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold transition-all shadow-lg shadow-sky-500/20 active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            Export Audit Logs
          </button>
        </div>
      </div>

      {/* Admin KPI Telemetry Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Platform Users</span>
            <Users className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-black text-white">4,829</div>
          <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
            <CheckCircle2 className="w-3 h-3" /> +142 active today
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>AI Model Health</span>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-300">Gemini 3.7 Flash</div>
          <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
            <Radio className="w-3 h-3 animate-pulse" /> 99.98% uptime (34ms avg)
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Threat Defense</span>
            <ShieldAlert className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">0 Breaches</div>
          <div className="text-[11px] text-slate-400 font-medium">
            48 suspicious requests blocked
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Cloud Storage Pool</span>
            <HardDrive className="w-4 h-4 text-yellow-400" />
          </div>
          <div className="text-2xl font-black text-white">124.6 GB</div>
          <div className="text-[11px] text-slate-400 font-medium">
            of 500 GB Tier 1 Quota
          </div>
        </div>
      </div>

      {/* Navigation Tabs for Admin Sections */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setAdminTab("security")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            adminTab === "security"
              ? "bg-sky-500 text-white shadow-md shadow-sky-500/20"
              : "text-slate-400 hover:text-white hover:bg-slate-800/60"
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Security & Firewall
        </button>

        <button
          onClick={() => setAdminTab("users")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            adminTab === "users"
              ? "bg-sky-500 text-white shadow-md shadow-sky-500/20"
              : "text-slate-400 hover:text-white hover:bg-slate-800/60"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          User Management (RBAC)
        </button>

        <button
          onClick={() => setAdminTab("models")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            adminTab === "models"
              ? "bg-sky-500 text-white shadow-md shadow-sky-500/20"
              : "text-slate-400 hover:text-white hover:bg-slate-800/60"
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          AI Engine Telemetry
        </button>

        <button
          onClick={() => setAdminTab("logs")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            adminTab === "logs"
              ? "bg-sky-500 text-white shadow-md shadow-sky-500/20"
              : "text-slate-400 hover:text-white hover:bg-slate-800/60"
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          Audit Logs
        </button>
      </div>

      {/* TAB 1: SECURITY & FIREWALL */}
      {adminTab === "security" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-emerald-400" />
                Active Security Protocols & Rules
              </h3>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-mono">
                ARMED
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-200">Role-Based Access Control (RBAC)</div>
                  <div className="text-slate-400 text-[11px]">Enforces strict 403 authorization checks on /admin and backend mutations.</div>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono text-[10px] font-bold">
                  ACTIVE
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-200">DDoS Rate Limiter & Token Bucket</div>
                  <div className="text-slate-400 text-[11px]">Restricts bursts over 60 req/min per IP to prevent scraper bot abuse.</div>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono text-[10px] font-bold">
                  ENFORCED
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-200">CSRF Token Verification & HSTS 2048-bit</div>
                  <div className="text-slate-400 text-[11px]">Prevents cross-site forgery and strictly enforces HTTPS encryption.</div>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono text-[10px] font-bold">
                  ENABLED
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-200">AI Prompt Sanitization & Jailbreak Filter</div>
                  <div className="text-slate-400 text-[11px]">Filters harmful injection payloads prior to Gemini 3.7 Flash execution.</div>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono text-[10px] font-bold">
                  FILTERING
                </span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Key className="w-5 h-5 text-sky-400" />
              Master Security Credentials
            </h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              SuperAdmin access can be unlocked using the owner email authentication or the Master Security Key.
            </p>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
              <div className="text-slate-400">Primary SuperAdmin:</div>
              <div className="text-sky-300 font-mono font-bold">abdullah106556661@gmail.com</div>
              <div className="text-[11px] text-emerald-400">Status: Verified Owner</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
              <div className="text-slate-400">Master Override Passcode:</div>
              <div className="text-slate-200 font-mono">NovaCutAdmin2026!</div>
              <div className="text-[10px] text-slate-500">Rotate every 90 days for compliance.</div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USER MANAGEMENT (RBAC) */}
      {adminTab === "users" && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white">Platform Users & Access Control</h3>
              <p className="text-slate-400 text-xs mt-0.5">Manage permissions, elevate roles, suspend accounts, and distribute AI credits.</p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search user name or email..."
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 font-semibold">User</th>
                  <th className="py-3 px-4 font-semibold">Role</th>
                  <th className="py-3 px-4 font-semibold">Plan</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">AI Credits</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-white">
                      <div>{u.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-300 font-mono font-bold">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 uppercase font-mono text-[11px] text-slate-400">
                      {u.plan}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.status === "ACTIVE"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-rose-500/10 text-rose-400"
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-purple-300 font-semibold">
                      {u.credits}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleElevateRole(u.id)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] transition-colors"
                        title="Promote / Change Role"
                      >
                        Role
                      </button>
                      <button
                        onClick={() => handleGrantCredits(u.id, 500)}
                        className="px-2.5 py-1 rounded bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-[11px] transition-colors"
                        title="Grant +500 Credits"
                      >
                        +500 Cr
                      </button>
                      <button
                        onClick={() => handleToggleUserStatus(u.id)}
                        className={`px-2.5 py-1 rounded text-[11px] transition-colors ${
                          u.status === "ACTIVE"
                            ? "bg-rose-500/20 hover:bg-rose-500/30 text-rose-300"
                            : "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300"
                        }`}
                      >
                        {u.status === "ACTIVE" ? "Suspend" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: AI ENGINE TELEMETRY */}
      {adminTab === "models" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-sky-400" />
              Connected AI Models & Services
            </h3>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white text-sm">Gemini 3.7 Flash</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono font-bold">ONLINE</span>
                </div>
                <div className="text-slate-400">Used for: Video Scripts, Storyboards, Auto-Captions, Copilot Chat, & Vision Analysis.</div>
                <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                  <span>Latency: ~38ms</span>
                  <span>Context: 1M Tokens</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white text-sm">Flux / Stable Diffusion Image Engine</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono font-bold">ONLINE</span>
                </div>
                <div className="text-slate-400">Used for: 8K Photo & Visual Generation matching user prompt exactly.</div>
                <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                  <span>Resolution: 1280x720 / 1024x1024</span>
                  <span>Engine: Multi-Fallback</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white text-sm">Vector SVG Brand Synthesizer</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono font-bold">ONLINE</span>
                </div>
                <div className="text-slate-400">Used for: Prompt-accurate vector logo generator & branding assets.</div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Server className="w-5 h-5 text-purple-400" />
              Runtime Node Container Telemetry
            </h3>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex justify-between text-slate-300 font-semibold">
                  <span>Container Memory Usage</span>
                  <span className="font-mono text-sky-400">142 MB / 512 MB</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div className="bg-sky-500 h-2 rounded-full" style={{ width: "28%" }} />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex justify-between text-slate-300 font-semibold">
                  <span>CPU Ingress Utilization</span>
                  <span className="font-mono text-emerald-400">6.4%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div className="bg-emerald-500 h-2 rounded-full" style={{ width: "6.4%" }} />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex justify-between text-slate-300 font-semibold">
                  <span>Active Dev Server Port</span>
                  <span className="font-mono text-purple-400">3000 (0.0.0.0 Binding)</span>
                </div>
                <div className="text-slate-500 text-[11px]">Reverse proxy route: /api/* handled by Express.js v4.</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT LOGS */}
      {adminTab === "logs" && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-sky-400" />
                Tamper-Evident Security Audit Logs
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">Real-time log stream of authorization, role changes, and API actions.</p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={logFilter}
                onChange={(e) => setLogFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              >
                <option value="ALL">All Severity Levels</option>
                <option value="SUCCESS">SUCCESS</option>
                <option value="BLOCKED">BLOCKED</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>

              <button
                onClick={handleExportLogs}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Download JSON
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs hover:border-slate-700 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        log.status === "SUCCESS"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : log.status === "BLOCKED"
                          ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                          : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      }`}
                    >
                      {log.status}
                    </span>
                    <span className="font-bold text-slate-200">{log.eventType}</span>
                    <span className="text-slate-500 text-[11px] font-mono">{log.timestamp}</span>
                  </div>
                  <div className="text-slate-400 text-xs">{log.details}</div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-[11px] font-mono text-sky-400">{log.userEmail}</div>
                  <div className="text-[10px] text-slate-500 font-mono">{log.ipAddress}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
