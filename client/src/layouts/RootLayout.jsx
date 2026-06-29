import React from "react";
import Navbar from "./Navbar";
import { useAuth } from "../context/AuthContext";
import { Clock } from "lucide-react";

const RootLayout = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-400 font-medium">Entering Vault...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      {/* Warning banner for authenticated but unapproved users */}
      {user && !user.approved && (
        <div className="w-full bg-amber-500/10 border-b border-amber-500/20 py-3 px-4">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-amber-400 text-sm font-medium">
            <Clock className="w-4 h-4 animate-pulse" />
            <span>
              Your profile is awaiting approval from a family administrator. You currently only have access to public albums.
            </span>
          </div>
        </div>
      )}

      {/* Main page content container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Vault Footer */}
      <footer className="w-full py-6 text-center text-xs text-slate-500 border-t border-white/5 mt-auto">
        <p>© {new Date().getFullYear()} FamilyVault. Built with security and love for families.</p>
      </footer>
    </div>
  );
};

export default RootLayout;
