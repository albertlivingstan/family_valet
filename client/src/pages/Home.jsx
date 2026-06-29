import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import PhotoViewer from "../components/PhotoViewer";
import { Search, MapPin, Calendar, Camera, Globe, Users, ArrowRight, Image as ImageIcon } from "lucide-react";

const Home = () => {
  const { user } = useAuth();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePhotoIndex, setActivePhotoIndex] = useState(null);
  
  // Search state
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");

  const fetchPhotos = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (location) params.location = location;
      if (date) params.date = date;

      const response = await api.get("/photos/feed", { params });
      setPhotos(response.data.photos);
    } catch (err) {
      console.error("Failed to load photo feed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, [user]); // Re-fetch feed when user auth status changes

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchPhotos();
  };

  const handleResetSearch = () => {
    setSearch("");
    setLocation("");
    setDate("");
    // Re-fetch clean list
    api.get("/photos/feed").then((res) => setPhotos(res.data.photos));
  };

  const getFullImageUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    return `${api.defaults.baseURL.replace("/api", "")}${url}`;
  };

  const onPhotoDeleted = (deletedId) => {
    setPhotos(photos.filter((p) => p._id !== deletedId));
  };

  return (
    <div className="space-y-12">
      {/* Hero Showcase Section */}
      <section className="relative glass-panel rounded-3xl overflow-hidden p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-6 shadow-2xl">
        {/* Glow Effects */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[60%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[60%] bg-violet-500/10 rounded-full blur-[120px] pointer-events-none"></div>

        <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
          <Globe className="w-3.5 h-3.5" /> Secure Vault Storage
        </span>
        
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-3xl leading-[1.1] text-glow">
          Preserve Your family's{" "}
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Beautiful Legacy
          </span>
        </h1>
        
        <p className="text-slate-400 text-sm sm:text-base max-w-xl leading-relaxed">
          Create a private family vault to securely host albums, share memories, and map your chronological family timeline. Full access-control privacy built in.
        </p>

        {!user ? (
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <Link
              to="/register"
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-300"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="px-6 py-3 bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 rounded-xl transition-all"
            >
              Log In
            </Link>
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            {user.approved ? (
              <>
                <Link
                  to="/dashboard"
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-lg transition-all"
                >
                  Go to Albums
                </Link>
                <Link
                  to="/upload"
                  className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 rounded-xl transition-all"
                >
                  <Camera className="w-4.5 h-4.5" />
                  <span>Upload Memories</span>
                </Link>
              </>
            ) : (
              <div className="text-amber-400 text-sm font-semibold">
                Waiting for account approval by family administrators.
              </div>
            )}
          </div>
        )}
      </section>

      {/* Unified Search & Filters Form */}
      <section className="glass-panel p-5 rounded-2xl">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          {/* Keyword Search */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 block">Keyword</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Caption or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          {/* Location Search */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 block">Location</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="City, country..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          {/* Date Taken Picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 block">Date Taken</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-all"
            >
              Search
            </button>
            {(search || location || date) && (
              <button
                type="button"
                onClick={handleResetSearch}
                className="px-3 py-2 bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-semibold rounded-xl border border-white/10"
              >
                Reset
              </button>
            )}
          </div>
        </form>
      </section>

      {/* Photo Feed Grid */}
      <section className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-100 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-indigo-400" />
            <span>Shared Memories</span>
          </h2>
          <span className="text-xs text-slate-500">
            Showing {photos.length} photos
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
          </div>
        ) : photos.length === 0 ? (
          <div className="glass-panel p-12 text-center rounded-2xl space-y-4">
            <div className="inline-flex p-4 bg-slate-800/40 rounded-full text-slate-500">
              <Camera className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-300">No memories found</h3>
            <p className="text-slate-500 text-xs sm:text-sm max-w-sm mx-auto">
              {!user
                ? "No public memories have been shared yet. Log in to view shared family memories."
                : "No matching memory records are in this directory."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {photos.map((photo, index) => (
              <div
                key={photo._id}
                onClick={() => setActivePhotoIndex(index)}
                className="group cursor-pointer glass-panel glass-panel-hover rounded-2xl overflow-hidden shadow-md"
              >
                {/* Photo aspect wrapper */}
                <div className="relative aspect-[4/3] bg-black/20 overflow-hidden">
                  <img
                    src={getFullImageUrl(photo.thumbnail || photo.imageURL)}
                    alt={photo.caption}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-4 flex flex-col justify-end">
                    <p className="text-xs text-indigo-300 font-bold mb-0.5">{photo.albumId?.title}</p>
                    <p className="text-sm font-bold text-white leading-tight truncate">{photo.caption}</p>
                  </div>
                  {/* Privacy Badge */}
                  <div className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/15">
                    {photo.privacy === "public" ? (
                      <Globe className="w-3.5 h-3.5 text-emerald-400" />
                    ) : photo.privacy === "family" ? (
                      <Users className="w-3.5 h-3.5 text-indigo-400" />
                    ) : (
                      <Camera className="w-3.5 h-3.5 text-rose-400" />
                    )}
                  </div>
                </div>

                {/* Footer Info */}
                <div className="p-3.5 flex justify-between items-center text-xs border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <img
                      src={photo.ownerId.profileImage}
                      alt={photo.ownerId.name}
                      className="w-5.5 h-5.5 rounded-full object-cover"
                    />
                    <span className="font-semibold text-slate-300 truncate max-w-[100px]">{photo.ownerId.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-500">
                    {new Date(photo.dateTaken).toLocaleDateString(undefined, { dateStyle: "short" })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Lightbox Trigger overlay */}
      {activePhotoIndex !== null && (
        <PhotoViewer
          photos={photos}
          initialIndex={activePhotoIndex}
          onClose={() => setActivePhotoIndex(null)}
          onPhotoDeleted={onPhotoDeleted}
        />
      )}
    </div>
  );
};

export default Home;
