import React from "react";
import { EditorProvider, useEditor } from "./context/EditorContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { EditorWorkspace } from "./components/Editor/EditorWorkspace";
import { Navbar } from "./components/Navigation/Navbar";
import { Footer } from "./components/Navigation/Footer";
import { SearchModal } from "./components/Navigation/SearchModal";
import { AuthModal } from "./components/Auth/AuthModal";
import { AuthLandingGate } from "./components/Auth/AuthLandingGate";
import { JazzCashModal } from "./components/Payment/JazzCashModal";

import { MobileBottomNav } from "./components/Navigation/MobileBottomNav";
import { LiveAIAssistant } from "./components/AI/LiveAIAssistant";

// Views
import { HomeView } from "./components/Views/HomeView";
import { DashboardView } from "./components/Views/DashboardView";
import { ProjectsView } from "./components/Views/ProjectsView";
import { AIGenerateView } from "./components/Views/AIGenerateView";
import { MediaTransformView } from "./components/Views/MediaTransformView";
import { AdminView } from "./components/Views/AdminView";
import { LoginView } from "./components/Views/LoginView";
import { SignupView } from "./components/Views/SignupView";
import { TemplatesView } from "./components/Views/TemplatesView";
import { PricingView } from "./components/Views/PricingView";
import { ProfileView } from "./components/Views/ProfileView";
import { SettingsView } from "./components/Views/SettingsView";
import { HelpView } from "./components/Views/HelpView";
import { ContactView } from "./components/Views/ContactView";
import { LegalView } from "./components/Views/LegalView";
import { ProtectedRoute } from "./components/Auth/ProtectedRoute";

const PlatformRouter: React.FC = () => {
  const { activeTab } = useEditor();
  const { isAuthenticated } = useAuth();

  // If user is not logged in / signed up, show the mandatory Auth Portal Gate
  if (!isAuthenticated) {
    return (
      <>
        <AuthLandingGate />
        <JazzCashModal />
        <AuthModal />
      </>
    );
  }

  // If in Video Editor Fullscreen Studio
  if (activeTab === "editor") {
    return (
      <main className="w-screen h-screen overflow-hidden bg-slate-950 text-slate-100 relative">
        <EditorWorkspace />
        <LiveAIAssistant />
        <SearchModal />
        <AuthModal />
        <JazzCashModal />
      </main>
    );
  }

  // Full Studio Website Interface
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-sky-500 selection:text-white">
      {/* Platform Navigation */}
      <Navbar />

      {/* Main Routed Content Area */}
      <main className="flex-1">
        {activeTab === "home" && <HomeView />}
        {activeTab === "dashboard" && <DashboardView />}
        {activeTab === "projects" && <ProjectsView />}
        {activeTab === "ai-generate" && <AIGenerateView />}
        {activeTab === "media-transform" && <MediaTransformView />}
        {activeTab === "admin" && (
          <ProtectedRoute requiredRole="admin">
            <AdminView />
          </ProtectedRoute>
        )}
        {activeTab === "login" && <LoginView />}
        {activeTab === "signup" && <SignupView />}
        {activeTab === "templates" && <TemplatesView />}
        {activeTab === "pricing" && <PricingView />}
        {activeTab === "profile" && <ProfileView />}
        {activeTab === "settings" && <SettingsView />}
        {activeTab === "help" && <HelpView />}
        {activeTab === "contact" && <ContactView />}
        {(activeTab === "privacy" || activeTab === "terms") && <LegalView />}
      </main>

      {/* Platform Footer */}
      <Footer />

      {/* Mobile CapCut-Style Bottom Navigation */}
      <MobileBottomNav />

      {/* Google-Style Live AI Voice & Interactive Assistant */}
      <LiveAIAssistant />

      {/* Global Modals */}
      <SearchModal />
      <AuthModal />
      <JazzCashModal />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <EditorProvider>
          <PlatformRouter />
        </EditorProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
