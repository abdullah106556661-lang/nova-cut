import React, { useState } from "react";
import {
  Sparkles,
  Search,
  Bell,
  User,
  Plus,
  Video,
  Layers,
  Wand2,
  FolderOpen,
  LayoutTemplate,
  CreditCard,
  HelpCircle,
  Mail,
  Settings,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  CheckCircle,
  Play,
} from "lucide-react";
import { useEditor, NavTab } from "../../context/EditorContext";
import { useAuth } from "../../context/AuthContext";

export const Navbar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    createProject,
    setSearchModalOpen,
  } = useEditor();
  const { user, logout, setAuthModalOpen, setAuthInitialTab, notifications, unreadCount, markAllNotificationsAsRead } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);

  const isAdminUser = Boolean(
    user &&
      (user.role?.toLowerCase() === "admin" ||
        user.role?.toLowerCase() === "superadmin")
  );

  const baseNavLinks: { id: NavTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: "home", label: "Home", icon: Play },
    { id: "dashboard", label: "Dashboard", icon: Layers },
    { id: "projects", label: "Projects", icon: FolderOpen },
    { id: "editor", label: "Video Studio", icon: Video },
    { id: "ai-generate", label: "AI Studio", icon: Wand2 },
    { id: "media-transform", label: "AI Transform", icon: Sparkles },
    { id: "templates", label: "Templates", icon: LayoutTemplate },
    { id: "pricing", label: "Pricing", icon: CreditCard },
  ];

  const navLinks = isAdminUser
    ? [
        ...baseNavLinks.slice(0, 6),
        { id: "admin" as NavTab, label: "Admin", icon: ShieldCheck },
        ...baseNavLinks.slice(6),
      ]
    : baseNavLinks;

  const handleNavClick = (tab: NavTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  const handleNewProject = () => {
    createProject({
      aspectRatio: "16:9",
      width: 1920,
      height: 1080,
      fps: 30,
      backgroundColor: "#080c14",
      duration: 15,
    });
  };

  return (
    <header className="h-16 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-40 px-4 lg:px-8 flex items-center justify-between transition-all">
      {/* Left: Brand Logo & Navigation */}
      <div className="flex items-center gap-6">
        {/* Logo */}
        <button
          onClick={() => handleNavClick("home")}
          className="flex items-center gap-2.5 group text-left outline-none"
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-sky-500 via-indigo-500 to-fuchsia-500 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-sky-500/25 group-hover:scale-105 transition-transform border border-white/20">
            N
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-base tracking-tight text-white">
                Nova<span className="text-sky-400">Cut</span>
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold uppercase tracking-wider">
                AI Platform
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium leading-none hidden sm:block">
              Next-Gen Creative Studio
            </p>
          </div>
        </button>

        {/* Desktop Navigation Links */}
        <nav className="hidden xl:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = activeTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-slate-800 text-sky-400 shadow-sm border border-slate-700/60"
                    : "text-slate-300 hover:text-white hover:bg-slate-900/60"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-sky-400" : "text-slate-400"}`} />
                <span>{link.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5">
        {/* 3-Day Refresh Credits Pill */}
        {user && (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-slate-900/90 border border-slate-800 rounded-xl text-xs">
            <span className="text-slate-400 text-[11px]">Credits:</span>
            <span className="font-mono font-bold text-sky-400">
              {isAdminUser ? "Unlimited" : `${user.aiCreditsRemaining}/500`}
            </span>
            <span className="text-[10px] text-slate-500 font-mono hidden md:inline">
              (3-Day Cycle)
            </span>
            <button
              onClick={() => setActiveTab("pricing")}
              className="text-[10px] text-amber-400 hover:text-amber-300 font-bold ml-1 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20"
              title="JazzCash Pro 03176901963"
            >
              Pro Plan
            </button>
          </div>
        )}

        {/* Global Spotlight Search trigger */}
        <button
          onClick={() => setSearchModalOpen(true)}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-900/90 hover:bg-slate-850 text-slate-400 hover:text-slate-200 border border-slate-800 rounded-xl text-xs transition-all w-44 lg:w-56 justify-between group"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-400 transition-colors" />
            <span className="truncate">Search tools & templates...</span>
          </div>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-800 text-slate-400 rounded border border-slate-700">
            ⌘K
          </kbd>
        </button>

        {/* Quick Launch: AI Studio */}
        <button
          onClick={() => handleNavClick("ai-generate")}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-950/80 to-indigo-950/80 hover:from-purple-900 hover:to-indigo-900 text-purple-200 border border-purple-500/40 rounded-xl text-xs font-bold shadow-sm transition-all"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
          <span>AI Studio</span>
        </button>

        {/* Quick Launch: New Video */}
        <button
          onClick={handleNewProject}
          className="hidden lg:flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-500/20 transition-all transform active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Video</span>
        </button>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => {
              setNotifMenuOpen(!notifMenuOpen);
              setUserMenuOpen(false);
            }}
            aria-label="Notifications"
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-900 rounded-xl relative transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-sky-500 rounded-full ring-2 ring-slate-950 animate-pulse" />
            )}
          </button>

          {notifMenuOpen && (
            <div className="absolute right-0 top-11 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 z-50 text-xs space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-200">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 text-[10px] bg-sky-500/20 text-sky-400 rounded-full font-bold">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <button
                  onClick={markAllNotificationsAsRead}
                  className="text-[11px] text-sky-400 hover:underline"
                >
                  Mark all read
                </button>
              </div>

              <div className="max-h-72 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {notifications.length === 0 ? (
                  <p className="text-slate-500 text-center py-6">No notifications yet</p>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-3 rounded-xl border transition-colors ${
                        notif.read
                          ? "bg-slate-950/40 border-slate-800/60 text-slate-400"
                          : "bg-slate-950 border-sky-500/30 text-slate-200"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-xs text-slate-200">{notif.title}</span>
                        <span className="text-[10px] text-slate-500 shrink-0">{notif.timestamp}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{notif.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Account / Profile */}
        <div className="relative">
          {user ? (
            <button
              onClick={() => {
                setUserMenuOpen(!userMenuOpen);
                setNotifMenuOpen(false);
              }}
              className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-800 transition-colors"
            >
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-8 h-8 rounded-full object-cover border border-sky-400 ring-2 ring-sky-500/20"
              />
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleNavClick("login")}
                className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => handleNavClick("signup")}
                className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold rounded-xl shadow-md transition-all"
              >
                Sign Up
              </button>
            </div>
          )}

          {/* User Dropdown */}
          {user && userMenuOpen && (
            <div className="absolute right-0 top-11 w-64 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-3 z-50 text-xs space-y-3 animate-fadeIn">
              <div className="flex items-center gap-3 pb-2.5 border-b border-slate-800">
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-10 h-10 rounded-full object-cover border border-sky-400"
                />
                <div className="overflow-hidden">
                  <div className="flex items-center gap-1.5">
                    <p className="font-bold text-slate-200 truncate">{user.name}</p>
                    {user.isEmailVerified && (
                      <span title="Verified">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 truncate font-mono">{user.email}</p>
                </div>
              </div>

              {/* Plan & Credits */}
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1.5 text-[11px]">
                <div className="flex justify-between items-center text-slate-300">
                  <span>Current Plan</span>
                  <span className="font-bold text-sky-400 uppercase tracking-wider text-[10px] px-1.5 py-0.5 bg-sky-500/10 rounded border border-sky-500/20">
                    {user.plan.replace("_", " ")}
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>AI Credits</span>
                  <span className="font-mono text-purple-400 font-bold">{user.aiCreditsRemaining} left</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Cloud Storage</span>
                  <span className="font-mono text-slate-400">
                    {(user.storageUsedMb / 1024).toFixed(1)} GB / {(user.storageLimitMb / 1024).toFixed(0)} GB
                  </span>
                </div>
              </div>

              {/* Navigation shortcuts inside User Menu */}
              <div className="space-y-1 pt-1 border-t border-slate-800">
                {isAdminUser && (
                  <button
                    onClick={() => {
                      handleNavClick("admin");
                      setUserMenuOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 hover:bg-slate-800 text-sky-300 rounded-lg flex items-center gap-2 font-medium"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                    <span>Admin Security Console</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    handleNavClick("media-transform");
                    setUserMenuOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 hover:bg-slate-800 text-slate-200 rounded-lg flex items-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>AI Media Transform</span>
                </button>
                <button
                  onClick={() => {
                    handleNavClick("profile");
                    setUserMenuOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 hover:bg-slate-800 text-slate-200 rounded-lg flex items-center gap-2"
                >
                  <User className="w-3.5 h-3.5 text-sky-400" />
                  <span>My Profile & Account</span>
                </button>
                <button
                  onClick={() => {
                    handleNavClick("settings");
                    setUserMenuOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 hover:bg-slate-800 text-slate-200 rounded-lg flex items-center gap-2"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-400" />
                  <span>Studio Settings</span>
                </button>
                <button
                  onClick={() => {
                    handleNavClick("pricing");
                    setUserMenuOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 hover:bg-slate-800 text-purple-300 rounded-lg flex items-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>Upgrade Plan</span>
                </button>
                <button
                  onClick={() => {
                    logout();
                    setUserMenuOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 hover:bg-red-950/60 text-red-400 rounded-lg flex items-center gap-2"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="xl:hidden p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden fixed inset-x-0 top-16 bg-slate-950 border-b border-slate-800 p-4 shadow-2xl z-50 animate-fadeIn">
          <div className="grid grid-cols-2 gap-2 mb-4">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = activeTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-semibold ${
                    isActive
                      ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                      : "bg-slate-900 text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                handleNewProject();
                setMobileMenuOpen(false);
              }}
              className="flex-1 py-2.5 bg-sky-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Video</span>
            </button>
            <button
              onClick={() => {
                handleNavClick("ai-generate");
                setMobileMenuOpen(false);
              }}
              className="flex-1 py-2.5 bg-purple-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>AI Studio</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
