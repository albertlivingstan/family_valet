import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { User, Shield, Check, AlertCircle, RefreshCw } from "lucide-react";

const Profile = () => {
  const { user, refreshUser } = useAuth();
  
  const [name, setName] = useState(user?.name || "");
  const [avatarSeed, setAvatarSeed] = useState(user?.name || user?.email || "vault");
  const [profileImage, setProfileImage] = useState(user?.profileImage || "");
  
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [updating, setUpdating] = useState(false);

  const handleGenerateAvatar = () => {
    const randomSeed = Math.random().toString(36).substring(7);
    const newAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${randomSeed}`;
    setProfileImage(newAvatar);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      return setError("Display name is required");
    }

    setError("");
    setSuccess("");
    setUpdating(true);
    try {
      const payload = {
        name,
        profileImage: profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${name}`,
      };

      await api.put("/users/profile", payload);
      setSuccess("Profile updated successfully!");
      
      // Update Auth context user data
      await refreshUser();
    } catch (err) {
      console.error(err);
      setError("Failed to update profile settings.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-100 flex items-center gap-2">
          <User className="w-8 h-8 text-indigo-400" />
          <span>My Profile</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Customize your display details and view your account authorization.
        </p>
      </div>

      {/* Notifications */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm font-semibold animate-fade-in">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm font-semibold animate-fade-in">
          <Check className="w-4 h-4" />
          <span>{success}</span>
        </div>
      )}

      {user && (
        <div className="space-y-6">
          {/* Summary Card */}
          <div className="glass-panel p-6 rounded-2xl flex items-center gap-5">
            <div className="relative group shrink-0">
              <img
                src={profileImage || user.profileImage}
                alt={user.name}
                className="w-20 h-20 rounded-full object-cover border-2 border-indigo-500/30 shadow-lg"
              />
              <button
                type="button"
                onClick={handleGenerateAvatar}
                className="absolute bottom-0 right-0 p-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-full text-white border border-slate-950 transition-colors shadow"
                title="Generate Random Avatar"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1.5 min-w-0">
              <h2 className="text-lg font-bold text-slate-200 truncate">{user.name}</h2>
              <p className="text-xs text-slate-400 truncate">{user.email}</p>
              
              <div className="flex flex-wrap gap-2 pt-1">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider ${
                  user.role === "admin"
                    ? "bg-indigo-500/20 text-indigo-400"
                    : "bg-slate-800 text-slate-400"
                }`}>
                  {user.role === "admin" && <Shield className="w-2.5 h-2.5" />}
                  <span>{user.role}</span>
                </span>
                
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider ${
                  user.approved
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-amber-500/20 text-amber-400"
                }`}>
                  <span>{user.approved ? "Approved" : "Pending Approval"}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleUpdate} className="glass-panel p-6 rounded-2xl space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400">Display Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name"
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-all"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400">Profile Image URL</label>
              <input
                type="url"
                value={profileImage}
                onChange={(e) => setProfileImage(e.target.value)}
                placeholder="https://api.dicebear.com/..."
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-all"
              />
            </div>

            <div className="text-[10px] text-slate-500 leading-normal bg-black/10 p-3 rounded-lg border border-white/5">
              Avatar images are pulled from initial seeds or absolute URLs. Clicking the refresh icon above automatically generates initials SVGs.
            </div>

            <button
              type="submit"
              disabled={updating}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-indigo-500/10 flex items-center justify-center"
            >
              {updating ? (
                <span className="w-5 h-5 border-2 border-indigo-200 border-t-transparent rounded-full animate-spin"></span>
              ) : (
                "Save Profile"
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Profile;
