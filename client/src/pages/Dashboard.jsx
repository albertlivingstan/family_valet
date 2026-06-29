import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { Plus, Folder, Globe, Users, Lock, ChevronRight, AlertCircle, Info, Image as ImageIcon } from "lucide-react";

const Dashboard = () => {
  const { user } = useAuth();
  
  // Albums list
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal / Form state
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [privacy, setPrivacy] = useState("family");
  const [coverImage, setCoverImage] = useState("");
  
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchAlbums = async () => {
    setLoading(true);
    try {
      const response = await api.get("/albums");
      setAlbums(response.data.albums);
    } catch (err) {
      console.error("Error fetching albums:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlbums();
  }, []);

  const handleCreateAlbum = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      return setError("Album title is required");
    }

    setError("");
    setSubmitting(true);
    try {
      const payload = { title, description, privacy };
      if (coverImage.trim()) {
        payload.coverImage = coverImage;
      }
      
      const response = await api.post("/albums", payload);
      setAlbums([response.data.album, ...albums]);
      
      // Reset form & close modal
      setTitle("");
      setDescription("");
      setPrivacy("family");
      setCoverImage("");
      setModalOpen(false);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to create album. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const getPrivacyIcon = (privacyLevel) => {
    switch (privacyLevel) {
      case "public":
        return <Globe className="w-3.5 h-3.5 text-emerald-400" />;
      case "family":
        return <Users className="w-3.5 h-3.5 text-indigo-400" />;
      default:
        return <Lock className="w-3.5 h-3.5 text-rose-400" />;
    }
  };

  const myAlbums = albums.filter((album) => album.ownerId._id === user._id || album.ownerId === user._id);
  const familyAlbums = albums.filter((album) => album.ownerId._id !== user._id && album.ownerId !== user._id);

  return (
    <div className="space-y-8">
      {/* Header section with Create button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-100 flex items-center gap-2">
            <Folder className="w-8 h-8 text-indigo-400" />
            <span>Memory Albums</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Organize family memories, manage access rules, and upload photo batches.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 transition-all duration-200 text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Album</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Section: My Created Albums */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
              <Folder className="w-4 h-4 text-indigo-400" />
              <span>Created by Me</span>
              <span className="px-2 py-0.5 text-[10px] rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/10 font-bold">
                {myAlbums.length}
              </span>
            </h2>

            {myAlbums.length === 0 ? (
              <div className="glass-panel p-8 text-center rounded-2xl border-dashed border-white/10 space-y-3">
                <p className="text-slate-400 text-xs sm:text-sm">You haven't created any albums yet.</p>
                <button
                  onClick={() => setModalOpen(true)}
                  className="px-4 py-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 text-xs font-semibold rounded-lg border border-indigo-500/20 transition-all"
                >
                  Create Your First Album
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {myAlbums.map((album) => (
                  <Link
                    key={album._id}
                    to={`/albums/${album._id}`}
                    className="group glass-panel glass-panel-hover rounded-2xl overflow-hidden shadow-lg flex flex-col h-full"
                  >
                    <div className="aspect-[16/10] overflow-hidden bg-slate-950 relative">
                      <img
                        src={album.coverImage}
                        alt={album.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/15 text-[10px] font-bold uppercase tracking-wider text-slate-200">
                        {getPrivacyIcon(album.privacy)}
                        <span className="ml-1">{album.privacy}</span>
                      </span>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                      <div className="space-y-1">
                        <h3 className="text-sm font-bold text-slate-200 truncate group-hover:text-indigo-400 transition-colors">
                          {album.title}
                        </h3>
                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                          {album.description || "No description provided."}
                        </p>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-white/5">
                        <span>Created {new Date(album.createdAt).toLocaleDateString()}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Section: Shared Family Albums */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" />
              <span>Shared Family Albums</span>
              <span className="px-2 py-0.5 text-[10px] rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/10 font-bold">
                {familyAlbums.length}
              </span>
            </h2>

            {familyAlbums.length === 0 ? (
              <div className="glass-panel p-8 text-center rounded-2xl">
                <p className="text-slate-500 text-xs sm:text-sm">No albums have been shared by other family members yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {familyAlbums.map((album) => (
                  <Link
                    key={album._id}
                    to={`/albums/${album._id}`}
                    className="group glass-panel glass-panel-hover rounded-2xl overflow-hidden shadow-lg flex flex-col h-full"
                  >
                    <div className="aspect-[16/10] overflow-hidden bg-slate-950 relative">
                      <img
                        src={album.coverImage}
                        alt={album.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/15 text-[10px] font-bold uppercase tracking-wider text-slate-200">
                        {getPrivacyIcon(album.privacy)}
                        <span className="ml-1">{album.privacy}</span>
                      </span>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                      <div className="space-y-1">
                        <h3 className="text-sm font-bold text-slate-200 truncate group-hover:text-indigo-400 transition-colors">
                          {album.title}
                        </h3>
                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                          {album.description || "No description provided."}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between pt-3 border-t border-white/5">
                        <div className="flex items-center gap-2">
                          <img
                            src={album.ownerId.profileImage}
                            alt={album.ownerId.name}
                            className="w-5.5 h-5.5 rounded-full object-cover"
                          />
                          <span className="text-[10px] font-semibold text-slate-400 truncate max-w-[100px]">
                            {album.ownerId.name}
                          </span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Create Album */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-panel p-6 sm:p-8 rounded-2xl shadow-2xl space-y-5 relative animate-fade-in">
            
            {/* Header */}
            <div className="flex justify-between items-center pb-3 border-b border-white/5">
              <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-indigo-400" />
                <span>Create New Album</span>
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 hover:bg-white/5 rounded-md"
              >
                ✕
              </button>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleCreateAlbum} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">Album Title *</label>
                <input
                  type="text"
                  placeholder="Summer Vacation 2026"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-all"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">Description</label>
                <textarea
                  placeholder="Memories from our trip..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-all h-20 resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">Cover Image URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/... (Defaults to default graphic)"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400">Privacy Setting</label>
                <div className="grid grid-cols-3 gap-3">
                  <label className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center cursor-pointer transition-all ${
                    privacy === "private"
                      ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                      : "bg-slate-950/50 border-white/5 text-slate-400 hover:bg-white/5"
                  }`}>
                    <input
                      type="radio"
                      name="privacy"
                      value="private"
                      checked={privacy === "private"}
                      onChange={() => setPrivacy("private")}
                      className="sr-only"
                    />
                    <Lock className="w-4 h-4 mb-1" />
                    <span className="text-[10px] font-semibold uppercase">Private</span>
                  </label>

                  <label className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center cursor-pointer transition-all ${
                    privacy === "family"
                      ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
                      : "bg-slate-950/50 border-white/5 text-slate-400 hover:bg-white/5"
                  }`}>
                    <input
                      type="radio"
                      name="privacy"
                      value="family"
                      checked={privacy === "family"}
                      onChange={() => setPrivacy("family")}
                      className="sr-only"
                    />
                    <Users className="w-4 h-4 mb-1" />
                    <span className="text-[10px] font-semibold uppercase">Family</span>
                  </label>

                  <label className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center cursor-pointer transition-all ${
                    privacy === "public"
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                      : "bg-slate-950/50 border-white/5 text-slate-400 hover:bg-white/5"
                  }`}>
                    <input
                      type="radio"
                      name="privacy"
                      value="public"
                      checked={privacy === "public"}
                      onChange={() => setPrivacy("public")}
                      className="sr-only"
                    />
                    <Globe className="w-4 h-4 mb-1" />
                    <span className="text-[10px] font-semibold uppercase">Public</span>
                  </label>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 text-sm font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-sm font-semibold rounded-xl transition-all shadow-md flex items-center justify-center"
                >
                  {submitting ? (
                    <span className="w-4 h-4 border-2 border-indigo-200 border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    "Create Album"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
