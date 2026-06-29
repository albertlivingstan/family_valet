import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Camera, User, Lock, AlertCircle, ArrowRight } from "lucide-react";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !password) {
      return setError("Please enter your name and password");
    }

    setError("");
    setLoading(true);
    try {
      await login(name, password);
      navigate("/");
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to log in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[70vh] px-4">
      <div className="w-full max-w-md glass-panel p-8 rounded-2xl shadow-2xl space-y-6 relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-violet-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Brand/Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 rounded-xl mb-2">
            <Camera className="w-6 h-6 text-glow" />
          </div>
          <h2 className="text-2xl font-bold text-slate-100">Welcome to FamilyVault</h2>
          <p className="text-xs text-slate-400">Sign in with your name and password</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 block">Name / Username</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                className="w-full bg-slate-950 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-all disabled:opacity-55"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 block">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full bg-slate-950 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-all disabled:opacity-55"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-indigo-500/10 hover:shadow-indigo-500/20 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-indigo-200 border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <p className="text-center text-xs text-slate-400 pt-2">
          New to the vault?{" "}
          <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold underline">
            Register Account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
