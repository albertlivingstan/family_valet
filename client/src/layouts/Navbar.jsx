import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Camera, Image, Users, LogOut, LogIn, UserPlus, User, Clock, Shield } from "lucide-react";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const navLinkClass = (path) => {
    const base = "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200";
    if (isActive(path)) {
      return `${base} bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 text-glow`;
    }
    return `${base} text-slate-300 hover:text-white hover:bg-white/5 border border-transparent`;
  };

  return (
    <nav className="sticky top-0 z-50 w-full glass-panel border-b border-white/5 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Brand */}
          <Link to="/" className="flex items-center gap-2 text-xl font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
            <Camera className="w-6 h-6 text-indigo-400" />
            <span>FamilyVault</span>
          </Link>

          {/* Navigation Links (Desktop) */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/" className={navLinkClass("/")}>
              <Image className="w-4 h-4" />
              <span>Memories</span>
            </Link>

            {user && (
              <>
                <Link to="/dashboard" className={navLinkClass("/dashboard")}>
                  <User className="w-4 h-4" />
                  <span>My Albums</span>
                </Link>
                <Link to="/upload" className={navLinkClass("/upload")}>
                  <Camera className="w-4 h-4" />
                  <span>Upload</span>
                </Link>
                <Link to="/members" className={navLinkClass("/members")}>
                  <Users className="w-4 h-4" />
                  <span>Family</span>
                </Link>
              </>
            )}

            {user && (
              <Link to="/profile" className={navLinkClass("/profile")}>
                <User className="w-4 h-4" />
                <span>Profile</span>
              </Link>
            )}
          </div>

          {/* Actions / Auth (Desktop) */}
          <div className="hidden md:flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <img
                    src={user.profileImage}
                    alt={user.name}
                    className="w-8 h-8 rounded-full border border-white/20 object-cover"
                  />
                  <div className="text-left leading-tight">
                    <p className="text-xs font-semibold text-slate-200">{user.name}</p>
                    <span className="text-[10px] uppercase tracking-wider font-bold text-indigo-400 flex items-center gap-1">
                      {user.role === "admin" ? (
                        <>
                          <Shield className="w-2.5 h-2.5" /> Admin
                        </>
                      ) : (
                        "Member"
                      )}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-white hover:bg-white/5 focus:outline-none"
            >
              <svg className="h-6 h-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-panel border-t border-white/5 px-2 pt-2 pb-3 space-y-1">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-white/5"
          >
            <Image className="w-5 h-5" />
            <span>Memories</span>
          </Link>

          {user && (
            <>
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-white/5"
              >
                <User className="w-5 h-5" />
                <span>My Albums</span>
              </Link>
              <Link
                to="/upload"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-white/5"
              >
                <Camera className="w-5 h-5" />
                <span>Upload</span>
              </Link>
              <Link
                to="/members"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-white/5"
              >
                <Users className="w-5 h-5" />
                <span>Family</span>
              </Link>
            </>
          )}

          {user && (
            <Link
              to="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-white/5"
            >
              <User className="w-5 h-5" />
              <span>Profile</span>
            </Link>
          )}

          <div className="pt-4 pb-2 border-t border-white/5">
            {user && (
              <div className="px-3">
                <div className="flex items-center gap-3">
                  <img
                    src={user.profileImage}
                    alt={user.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-200">{user.name}</p>
                    <p className="text-xs text-slate-400">{user.email}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
