import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { Users, Shield, Clock, Check, X, AlertCircle } from "lucide-react";

const Members = () => {
  const { user } = useAuth();
  
  const [members, setMembers] = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchMembersAndPending = async () => {
    setLoading(true);
    try {
      // Fetch approved members
      const membersRes = await api.get("/users/members");
      setMembers(membersRes.data.members);

      // Fetch pending members if Admin
      if (user && user.role === "admin") {
        const pendingRes = await api.get("/users/pending");
        setPending(pendingRes.data.pendingUsers);
      }
    } catch (err) {
      console.error("Failed to load members catalog", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembersAndPending();
  }, [user]);

  const handleApprove = async (id) => {
    setError("");
    setSuccess("");
    try {
      const response = await api.post(`/users/${id}/approve`);
      setSuccess(response.data.message);
      
      // Refresh Lists
      const approvedUser = pending.find((p) => p._id === id);
      setPending(pending.filter((p) => p._id !== id));
      if (approvedUser) {
        setMembers([...members, { ...approvedUser, approved: true }]);
      }
    } catch (err) {
      setError("Failed to approve member");
    }
  };

  const handleRemove = async (id) => {
    if (!window.confirm("Are you sure you want to remove this user from the family album vault?")) return;
    setError("");
    setSuccess("");
    try {
      await api.delete(`/users/${id}`);
      setSuccess("User deleted successfully.");
      
      // Update local state
      setMembers(members.filter((m) => m._id !== id));
      setPending(pending.filter((p) => p._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to remove user");
    }
  };

  const handleChangeRole = async (id, newRole) => {
    setError("");
    setSuccess("");
    try {
      const response = await api.put(`/users/${id}/role`, { role: newRole });
      setSuccess(response.data.message);
      
      // Update local state
      setMembers(members.map((m) => (m._id === id ? { ...m, role: newRole } : m)));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update role");
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-100 flex items-center gap-2">
          <Users className="w-8 h-8 text-indigo-400" />
          <span>Family Directory</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Browse registered family members, view active roles, and manage approvals.
        </p>
      </div>

      {/* Notifications */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm font-semibold">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm font-semibold">
          <Check className="w-4 h-4" />
          <span>{success}</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Members list (Left / Main pane) */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2 mb-4">
              <span>Active Members</span>
              <span className="px-2 py-0.5 text-[10px] rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/10 font-bold">
                {members.length}
              </span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {members.map((member) => (
                <div key={member._id} className="glass-panel p-4 rounded-xl flex items-center gap-4 relative overflow-hidden group">
                  <img
                    src={member.profileImage}
                    alt={member.name}
                    className="w-12 h-12 rounded-full object-cover border border-white/10"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-slate-200 truncate">{member.name}</h3>
                    <p className="text-xs text-slate-400 truncate">{member.email}</p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                        member.role === "admin"
                          ? "bg-indigo-500/20 text-indigo-400"
                          : "bg-slate-800 text-slate-400"
                      }`}>
                        {member.role === "admin" && <Shield className="w-2.5 h-2.5" />}
                        <span>{member.role}</span>
                      </span>
                      <span className="text-[9px] text-slate-500">
                        Joined {new Date(member.joinedDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Admin actions (Promote/Demote/Remove) */}
                  {user && user.role === "admin" && member._id !== user._id && (
                    <div className="absolute right-3 top-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-slate-900/90 pl-2 rounded-lg py-1 border border-white/5 shadow-md">
                      <select
                        value={member.role}
                        onChange={(e) => handleChangeRole(member._id, e.target.value)}
                        className="bg-transparent border-0 text-[10px] text-slate-300 font-semibold focus:outline-none cursor-pointer pr-1"
                      >
                        <option value="member" className="bg-slate-950">Member</option>
                        <option value="admin" className="bg-slate-950">Admin</option>
                      </select>
                      <button
                        onClick={() => handleRemove(member._id)}
                        className="p-1 hover:bg-rose-500/10 hover:text-rose-400 text-slate-500 rounded-md"
                        title="Remove Member"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Pending approvals section (Admin Only Sidebar) */}
          {user && user.role === "admin" && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2 mb-4">
                <span>Pending Approvals</span>
                <span className="px-2 py-0.5 text-[10px] rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/10 font-bold">
                  {pending.length}
                </span>
              </h2>

              {pending.length === 0 ? (
                <div className="glass-panel p-6 text-center rounded-2xl">
                  <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">No pending approval requests.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pending.map((pendingUser) => (
                    <div key={pendingUser._id} className="glass-panel p-4 rounded-xl space-y-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={pendingUser.profileImage}
                          alt={pendingUser.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold text-slate-200 truncate">{pendingUser.name}</h4>
                          <p className="text-[10px] text-slate-400 truncate">{pendingUser.email}</p>
                          <span className="text-[9px] text-slate-500">
                            Registered {new Date(pendingUser.joinedDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(pendingUser._id)}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleRemove(pendingUser._id)}
                          className="px-2.5 py-1.5 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-400 text-xs rounded-lg transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Members;
