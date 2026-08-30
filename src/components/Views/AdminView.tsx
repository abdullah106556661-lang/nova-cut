import React, { useState, useEffect, useCallback } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Users,
  Key,
  Activity,
  Cpu,
  Server,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  Download,
  Sparkles,
  Zap,
  HardDrive,
  Globe,
  Radio,
  FileSpreadsheet,
  Clock,
  RefreshCw,
  CreditCard,
  Check,
  X,
  UserCheck,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useEditor } from "../../context/EditorContext";
import { apiFetch } from "../../utils/api";

interface PlatformUser {
  id: string;
  name: string;
  email: string;
  role: "user" | "creator" | "admin" | "superadmin";
  plan: "free" | "creator" | "studio_pro";
  status: "ACTIVE" | "SUSPENDED";
  aiCreditsRemaining: number;
  dailyCreditsLimit: number;
  storageUsedMb: number;
  storageLimitMb: number;
  projectsCount: number;
  isEmailVerified: boolean;
  joinedDate: string;
}

interface AuditLog {
  id: string;
  timestamp: string;
  eventType: string;
  ipAddress: string;
  userId?: string;
  userEmail?: string;
  status: "SUCCESS" | "BLOCKED" | "WARNING" | "CRITICAL";
  details: string;
}

interface PaymentRecord {
  id: string;
  userId: string;
  userEmail: string;
  plan: string;
  amountPkr: number;
  tid: string;
  senderPhone?: string;
  status: "pending" | "confirmed" | "rejected";
  timestamp: string;
}

interface SystemStatus {
  status: string;
  hasApiKey: boolean;
  nodeEnv: string;
  platform: string;
  uptimeSeconds: number;
  model: string;
  totalUsers: number;
  totalAuditLogs: number;
}

export const AdminView: React.FC = () => {
  const { user, isAdmin, isSuperAdmin, addNotification, setAuthModalOpen } = useAuth();
  const { setActiveTab } = useEditor();

  const [adminTab, setAdminTab] = useState<"overview" | "users" | "payments" | "logs" | "system">("overview");
  const [loading, setLoading] = useState(false);

  // Real backend data states
  const [usersList, setUsersList] = useState<PlatformUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [paymentsList, setPaymentsList] = useState<PaymentRecord[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);

  // Filter & Search
  const [searchUser, setSearchUser] = useState("");
  const [logFilter, setLogFilter] = useState<string>("ALL");

  // Fetch all admin data securely
  const fetchAdminData = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      // 1. Fetch Users
      const usersRes = await apiFetch("/api/admin/users");
      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsersList(data.users || []);
      }

      // 2. Fetch Logs
      const logsRes = await apiFetch("/api/admin/audit-logs");
      if (logsRes.ok) {
        const data = await logsRes.json();
        setAuditLogs(data.logs || []);
      }

      // 3. Fetch Payments
      const payRes = await apiFetch("/api/admin/payments");
      if (payRes.ok) {
        const data = await payRes.json();
        setPaymentsList(data.payments || []);
      }

      // 4. Fetch Health & Status
      const statusRes = await apiFetch("/api/admin/status");
      if (statusRes.ok) {
        const data = await statusRes.json();
        setSystemStatus(data);
      }
    } catch (err: any) {
      console.error("Admin data fetch error:", err);
      addNotification("Admin Sync Error", "Could not load administrative data from server.", "error");
    } finally {
      setLoading(false);
    }
  }, [isAdmin, addNotification]);

  useEffect(() => {
    if (isAdmin) {
      fetchAdminData();
    }
  }, [isAdmin, fetchAdminData]);

  // Role update handler
  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const res = await apiFetch(`/api/admin/user/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update role");

      addNotification("Role Updated", `User role changed to ${newRole}.`, "success");
      fetchAdminData();
    } catch (err: any) {
      addNotification("Update Error", err.message, "error");
    }
  };

  // Status toggle handler (Active / Suspended)
  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try {
      const res = await apiFetch(`/api/admin/user/${userId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to toggle status");

      addNotification("Status Updated", `User is now ${newStatus}.`, "info");
      fetchAdminData();
    } catch (err: any) {
      addNotification("Update Error", err.message, "error");
    }
  };

  // Grant AI credits
  const handleGrantCredits = async (userId: string, amount: number, setUnlimited = false) => {
    try {
      const res = await apiFetch(`/api/admin/user/${userId}/credits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, setUnlimited }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to adjust credits");

      addNotification("Credits Adjusted", setUnlimited ? "Set to Unlimited Credits." : `Added +${amount} credits.`, "success");
      fetchAdminData();
    } catch (err: any) {
      addNotification("Error", err.message, "error");
    }
  };

  // Verify JazzCash Payment
  const handleVerifyPayment = async (paymentId: string, status: "confirmed" | "rejected") => {
    try {
      const res = await apiFetch(`/api/admin/payments/${paymentId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to verify payment");

      addNotification(
        "Payment Processed",
        `Payment ${status === "confirmed" ? "approved & Pro plan granted" : "marked as rejected"}.`,
        "success"
      );
      fetchAdminData();
    } catch (err: any) {
      addNotification("Verification Error", err.message, "error");
    }
  };

  // Export audit logs
  const handleExportLogs = () => {
    const jsonStr = JSON.stringify(auditLogs, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `novacut-audit-logs-${Date.now()}.json`;
    link.click();
    addNotification("Audit Exported", "Encrypted audit log file downloaded.", "success");
  };

  // 1. STRICT ACCESS CONTROL SHIELD (When unauthorized)
  if (!isAdmin) {
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
              Access to this console is strictly restricted to verified platform administrators. Your IP and session details are recorded in the security audit stream.
            </p>
          </div>

          <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 text-left space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-400">
              <span>Authentication Status:</span>
              <span className="font-mono text-rose-400 font-bold">{user ? "Authenticated (User)" : "Guest"}</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Current Account:</span>
              <span className="font-mono text-slate-200">{user?.email || "None"}</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Required Role:</span>
              <span className="font-mono text-sky-400 font-bold">admin / superadmin</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setAuthModalOpen(true)}
              className="flex-1 py-3 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold rounded-xl text-xs transition-all cursor-pointer"
            >
              Sign In With Admin Account
            </button>
            <button
              onClick={() => setActiveTab("editor")}
              className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition-all cursor-pointer"
            >
              Return to Studio
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Filtered Users
  const filteredUsers = usersList.filter(
    (u) =>
      u.name.toLowerCase().includes(searchUser.toLowerCase()) ||
      u.email.toLowerCase().includes(searchUser.toLowerCase()) ||
      u.role.toLowerCase().includes(searchUser.toLowerCase())
  );

  // Filtered Logs
  const filteredLogs = auditLogs.filter((log) => {
    if (logFilter === "ALL") return true;
    return log.status === logFilter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Top Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/25">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white">NovaCut Command & Control Console</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {isSuperAdmin ? "SuperAdmin Mode" : "Admin Level 1"}
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-1">
              Verified Administrator: <span className="text-sky-400 font-mono">{user?.email}</span> • Real-time server state & audit logs
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAdminData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition-all border border-slate-700 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Sync Live State</span>
          </button>
          <button
            onClick={handleExportLogs}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Audit Logs</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-4 overflow-x-auto">
        <button
          onClick={() => setAdminTab("overview")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            adminTab === "overview"
              ? "bg-sky-500 text-white shadow-md shadow-sky-500/25"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>System Overview</span>
        </button>

        <button
          onClick={() => setAdminTab("users")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            adminTab === "users"
              ? "bg-sky-500 text-white shadow-md shadow-sky-500/25"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Management ({usersList.length})</span>
        </button>

        <button
          onClick={() => setAdminTab("payments")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            adminTab === "payments"
              ? "bg-sky-500 text-white shadow-md shadow-sky-500/25"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>JazzCash Payments ({paymentsList.filter((p) => p.status === "pending").length} Pending)</span>
        </button>

        <button
          onClick={() => setAdminTab("logs")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            adminTab === "logs"
              ? "bg-sky-500 text-white shadow-md shadow-sky-500/25"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Security Audit Trail ({auditLogs.length})</span>
        </button>
      </div>

      {/* TAB 1: SYSTEM OVERVIEW */}
      {adminTab === "overview" && (
        <div className="space-y-6">
          {/* Metric cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Active Users</span>
                <Users className="w-4 h-4 text-sky-400" />
              </div>
              <div className="text-2xl font-black text-white">{usersList.length}</div>
              <p className="text-[11px] text-emerald-400">Database Synchronized</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Gemini API Status</span>
                <Sparkles className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-2xl font-black text-white">
                {systemStatus?.hasApiKey ? "Connected" : "Key Needed"}
              </div>
              <p className="text-[11px] text-slate-400">gemini-3.7-flash with Multimodal</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>JazzCash Verifications</span>
                <CreditCard className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-white">
                {paymentsList.filter((p) => p.status === "confirmed").length} Approved
              </div>
              <p className="text-[11px] text-amber-400">
                {paymentsList.filter((p) => p.status === "pending").length} Awaiting Verification
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Security Events</span>
                <ShieldAlert className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-2xl font-black text-white">{auditLogs.length}</div>
              <p className="text-[11px] text-emerald-400">All Nodes Monitored</p>
            </div>
          </div>

          {/* Core System Properties */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-200">Server Infrastructure Health</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-slate-500 font-semibold uppercase text-[10px]">Runtime Container</span>
                <div className="font-mono text-slate-200">{systemStatus?.platform || "Cloud Run Container"}</div>
              </div>
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-slate-500 font-semibold uppercase text-[10px]">Active Node Environment</span>
                <div className="font-mono text-emerald-400">{systemStatus?.nodeEnv || "Production"}</div>
              </div>
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-slate-500 font-semibold uppercase text-[10px]">Server Uptime</span>
                <div className="font-mono text-sky-400">
                  {systemStatus?.uptimeSeconds ? `${Math.floor(systemStatus.uptimeSeconds / 60)}m ${Math.floor(systemStatus.uptimeSeconds % 60)}s` : "Online"}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USER MANAGEMENT */}
      {adminTab === "users" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search users by name, email or role..."
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-slate-200 text-xs outline-none focus:border-sky-500"
              />
            </div>
            <div className="text-xs text-slate-400 font-mono">
              Total: <span className="text-white font-bold">{filteredUsers.length}</span> users
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="p-4">User Details</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Plan</th>
                    <th className="p-4">AI Credits</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-slate-100">{u.name}</div>
                        <div className="text-slate-400 font-mono text-[11px]">{u.email}</div>
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            u.role === "superadmin"
                              ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                              : u.role === "admin"
                              ? "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                              : u.role === "creator"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="font-semibold text-slate-200 capitalize">{u.plan.replace("_", " ")}</span>
                      </td>
                      <td className="p-4 font-mono text-sky-400 font-bold">
                        {u.role === "superadmin" ? "Unlimited" : `${u.aiCreditsRemaining} / 500`}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            u.status === "ACTIVE"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        {/* Grant Credits */}
                        <button
                          onClick={() => handleGrantCredits(u.id, 500)}
                          title="Add 500 Credits"
                          className="px-2.5 py-1 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-lg text-[11px] font-semibold cursor-pointer"
                        >
                          +500 Credits
                        </button>

                        {/* Elevate Role (SuperAdmin only) */}
                        {isSuperAdmin && (
                          <button
                            onClick={() => {
                              const roles: ("user" | "creator" | "admin" | "superadmin")[] = ["user", "creator", "admin", "superadmin"];
                              const cur = roles.indexOf(u.role);
                              const next = roles[(cur + 1) % roles.length];
                              handleUpdateRole(u.id, next);
                            }}
                            className="px-2.5 py-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg text-[11px] font-semibold cursor-pointer"
                          >
                            Cycle Role
                          </button>
                        )}

                        {/* Suspend / Activate */}
                        {u.role !== "superadmin" && (
                          <button
                            onClick={() => handleToggleStatus(u.id, u.status)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border cursor-pointer ${
                              u.status === "ACTIVE"
                                ? "bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30"
                                : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                            }`}
                          >
                            {u.status === "ACTIVE" ? "Suspend" : "Activate"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: JAZZCASH PAYMENTS */}
      {adminTab === "payments" && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-100">JazzCash Account: 03176901963</h3>
                <p className="text-xs text-slate-400">Incoming Pro Plan Upgrades & TID Verification Queue</p>
              </div>
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-bold border border-emerald-500/20">
                JazzCash Official Gateway
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="p-4">User Email</th>
                    <th className="p-4">TID Code</th>
                    <th className="p-4">Amount (PKR)</th>
                    <th className="p-4">Sender Phone</th>
                    <th className="p-4">Timestamp</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {paymentsList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">
                        No JazzCash transaction submissions currently pending.
                      </td>
                    </tr>
                  ) : (
                    paymentsList.map((pay) => (
                      <tr key={pay.id} className="hover:bg-slate-800/40">
                        <td className="p-4 font-mono font-semibold text-slate-200">{pay.userEmail}</td>
                        <td className="p-4 font-mono text-sky-400 font-bold">{pay.tid}</td>
                        <td className="p-4 font-bold text-slate-100">PKR {pay.amountPkr}</td>
                        <td className="p-4 font-mono text-slate-400">{pay.senderPhone || "Direct TID"}</td>
                        <td className="p-4 text-slate-400">{pay.timestamp}</td>
                        <td className="p-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              pay.status === "confirmed"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : pay.status === "rejected"
                                ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            }`}
                          >
                            {pay.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          {pay.status === "pending" && (
                            <>
                              <button
                                onClick={() => handleVerifyPayment(pay.id, "confirmed")}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs cursor-pointer"
                              >
                                Approve Pro
                              </button>
                              <button
                                onClick={() => handleVerifyPayment(pay.id, "rejected")}
                                className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs cursor-pointer"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {pay.status === "confirmed" && (
                            <span className="text-emerald-400 font-semibold text-xs flex items-center justify-end gap-1">
                              <Check className="w-3.5 h-3.5" /> Verified
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SECURITY AUDIT TRAIL */}
      {adminTab === "logs" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex gap-2">
              {["ALL", "SUCCESS", "BLOCKED", "WARNING"].map((f) => (
                <button
                  key={f}
                  onClick={() => setLogFilter(f)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    logFilter === f
                      ? "bg-sky-500 text-white"
                      : "bg-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <div className="text-xs text-slate-400 font-mono">
              Total logs: <span className="text-white font-bold">{filteredLogs.length}</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="p-4">Timestamp</th>
                    <th className="p-4">Event Type</th>
                    <th className="p-4">Actor Email</th>
                    <th className="p-4">IP Address</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300 font-mono text-[11px]">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/40">
                      <td className="p-4 text-slate-400 whitespace-nowrap">{log.timestamp}</td>
                      <td className="p-4 font-bold text-slate-200">{log.eventType}</td>
                      <td className="p-4 text-sky-400">{log.userEmail || "Anonymous / System"}</td>
                      <td className="p-4 text-slate-400">{log.ipAddress}</td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            log.status === "SUCCESS"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : log.status === "BLOCKED"
                              ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="p-4 text-slate-300 max-w-xs truncate">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
