import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import PhotoViewer from "../components/PhotoViewer";
import {
  Heart,
  MessageCircle,
  MapPin,
  Calendar,
  Download,
  Trash2,
  Globe,
  Users,
  Lock,
  Camera,
  Search,
  AlertCircle,
  Clock,
  Compass
} from "lucide-react";

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [activePhotoIndex, setActivePhotoIndex] = useState(null);

  // Overlay heart animation triggers
  const [popHeartId, setPopHeartId] = useState(null);

  // Inline comment text inputs mapped by photoId
  const [commentInputs, setCommentInputs] = useState({});

  const fetchPhotos = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (location) params.location = location;

      const response = await api.get("/photos/feed", { params });
      setPhotos(response.data.photos);
    } catch (err) {
      console.error("Failed to load timeline feed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, [user]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchPhotos();
  };

  const handleToggleLike = async (photoId) => {
    if (!user) return navigate("/login");
    try {
      const response = await api.post(`/likes/photo/${photoId}`);
      setPhotos((prevPhotos) =>
        prevPhotos.map((p) =>
          p._id === photoId
            ? { ...p, hasLiked: response.data.liked, likesCount: response.data.likesCount }
            : p
        )
      );
    } catch (err) {
      console.error("Error toggling like:", err);
    }
  };

  // Double Click / Double Tap to Like
  const handleImageDoubleTap = async (photoId, hasLiked) => {
    if (!user) return navigate("/login");
    
    // Show popup animation
    setPopHeartId(photoId);
    setTimeout(() => {
      setPopHeartId(null);
    }, 700);

    // If not liked already, send like request
    if (!hasLiked) {
      await handleToggleLike(photoId);
    }
  };

  const handleAddInlineComment = async (e, photoId) => {
    e.preventDefault();
    const commentText = commentInputs[photoId];
    if (!user) return navigate("/login");
    if (!commentText || !commentText.trim()) return;

    try {
      const response = await api.post(`/comments/photo/${photoId}`, {
        comment: commentText,
      });

      // Update inline comments state
      setPhotos((prevPhotos) =>
        prevPhotos.map((p) =>
          p._id === photoId
            ? { ...p, comments: [...(p.comments || []), response.data.comment] }
            : p
        )
      );

      // Clear input
      setCommentInputs((prev) => ({ ...prev, [photoId]: "" }));
    } catch (err) {
      console.error("Error posting inline comment:", err);
    }
  };

  const handleInlineCommentChange = (photoId, val) => {
    setCommentInputs((prev) => ({ ...prev, [photoId]: val }));
  };

  const handleDeletePhoto = async (photoId) => {
    if (!window.confirm("Are you sure you want to permanently delete this post?")) return;
    try {
      await api.delete(`/photos/${photoId}`);
      setPhotos(photos.filter((p) => p._id !== photoId));
    } catch (err) {
      console.error("Error deleting post:", err);
    }
  };

  const handleDownload = async (photo) => {
    try {
      const response = await fetch(photo.imageURL);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = photo.caption || "familyvault-feed.jpg";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      window.open(photo.imageURL, "_blank");
    }
  };

  const getPrivacyIcon = (privacy) => {
    switch (privacy) {
      case "public":
        return <Globe className="w-3.5 h-3.5 text-emerald-400" title="Public" />;
      case "family":
        return <Users className="w-3.5 h-3.5 text-indigo-400" title="Family Only" />;
      default:
        return <Lock className="w-3.5 h-3.5 text-rose-400" title="Private" />;
    }
  };

  const onPhotoDeleted = (deletedId) => {
    setPhotos(photos.filter((p) => p._id !== deletedId));
  };

  return (
    <div className="flex flex-col items-center max-w-xl mx-auto space-y-6">
      
      {/* Brand title for Feed header */}
      <div className="w-full flex items-center justify-between border-b border-white/5 pb-4">
        <h1 className="text-3xl font-extrabold italic bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent tracking-tight">
          FamilyVault
        </h1>
        {user ? (
          <Link
            to="/upload"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-semibold text-white transition-all shadow-md shadow-indigo-500/10"
          >
            <Camera className="w-4 h-4" />
            <span>New Post</span>
          </Link>
        ) : (
          <Link
            to="/login"
            className="px-3.5 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-xs font-semibold text-slate-200 transition-all"
          >
            Sign In
          </Link>
        )}
      </div>

      {/* Search Header Bar */}
      <form onSubmit={handleSearchSubmit} className="w-full flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search feed by caption or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-all"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl"
        >
          Search
        </button>
      </form>

      {/* Feed Area */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
        </div>
      ) : photos.length === 0 ? (
        <div className="w-full glass-panel p-12 text-center rounded-2xl space-y-4">
          <div className="inline-flex p-4 bg-slate-800/40 rounded-full text-slate-500">
            <Compass className="w-8 h-8 animate-spin" />
          </div>
          <h3 className="text-lg font-bold text-slate-300">Feed is empty</h3>
          <p className="text-slate-500 text-xs sm:text-sm max-w-sm mx-auto">
            {user ? "Share your first photo memory with the family!" : "Log in to post photos and explore shared memories."}
          </p>
        </div>
      ) : (
        <div className="w-full space-y-6">
          {photos.map((photo, index) => {
            const isOwner = user && (user._id === photo.ownerId._id || user._id === photo.ownerId || user.role === "admin");
            return (
              <article key={photo._id} className="w-full glass-panel rounded-2xl overflow-hidden shadow-xl border border-white/5 bg-slate-950/20 flex flex-col">
                
                {/* Header: User & Location details */}
                <div className="p-4 flex items-center justify-between border-b border-white/5 bg-slate-950/40">
                  <div className="flex items-center gap-3">
                    <img
                      src={photo.ownerId.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${photo.ownerId.name}`}
                      alt={photo.ownerId.name}
                      className="w-9 h-9 rounded-full object-cover border border-white/10"
                    />
                    <div className="leading-tight text-left">
                      <h4 className="text-xs font-bold text-slate-200">{photo.ownerId.name}</h4>
                      {photo.location && (
                        <span className="text-[10px] text-slate-400 flex items-center gap-0.5 mt-0.5">
                          <MapPin className="w-3 h-3 text-indigo-400" />
                          <span>{photo.location}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-600" />
                      {new Date(photo.uploadedAt).toLocaleDateString(undefined, { dateStyle: "short" })}
                    </span>
                    <span className="p-1 rounded-md bg-white/5 border border-white/10">
                      {getPrivacyIcon(photo.privacy)}
                    </span>
                  </div>
                </div>

                {/* Media Image area with double-click liked animations */}
                <div
                  onDoubleClick={() => handleImageDoubleTap(photo._id, photo.hasLiked)}
                  className="relative aspect-square bg-slate-950 flex items-center justify-center overflow-hidden cursor-pointer select-none"
                >
                  <img
                    src={photo.imageURL}
                    alt={photo.caption}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />

                  {/* Heart popup overlay animation */}
                  {popHeartId === photo._id && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                      <Heart className="w-24 h-24 text-rose-500 fill-rose-500 drop-shadow-2xl animate-heart-pop" />
                    </div>
                  )}
                </div>

                {/* Action Buttons Toolbar */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleToggleLike(photo._id)}
                        className={`p-1 hover:scale-110 transition-transform ${
                          photo.hasLiked ? "text-rose-500" : "text-slate-400 hover:text-white"
                        }`}
                      >
                        <Heart className={`w-6 h-6 ${photo.hasLiked ? "fill-rose-500" : ""}`} />
                      </button>
                      <button
                        onClick={() => setActivePhotoIndex(index)}
                        className="p-1 text-slate-400 hover:text-white hover:scale-110 transition-transform"
                      >
                        <MessageCircle className="w-6 h-6" />
                      </button>
                      <button
                        onClick={() => handleDownload(photo)}
                        className="p-1 text-slate-400 hover:text-white hover:scale-110 transition-transform"
                        title="Download Original"
                      >
                        <Download className="w-5.5 h-5.5" />
                      </button>
                    </div>

                    {isOwner && (
                      <button
                        onClick={() => handleDeletePhoto(photo._id)}
                        className="p-1 text-slate-500 hover:text-rose-500 hover:scale-110 transition-transform"
                        title="Delete Post"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  {/* Likes Count */}
                  <div className="text-xs font-bold text-slate-200">
                    {photo.likesCount || 0} {photo.likesCount === 1 ? "like" : "likes"}
                  </div>

                  {/* Caption */}
                  <div className="text-xs text-left leading-relaxed text-slate-300">
                    <span className="font-extrabold text-slate-200 mr-2">{photo.ownerId.name}</span>
                    <span>{photo.caption}</span>
                  </div>

                  {/* Comments Feed View */}
                  <div className="space-y-1.5 pt-2 border-t border-white/5">
                    {/* View all comments trigger */}
                    {photo.comments && photo.comments.length > 0 && (
                      <button
                        onClick={() => setActivePhotoIndex(index)}
                        className="text-[10px] text-slate-500 hover:underline block mb-1 text-left"
                      >
                        View details and all comments
                      </button>
                    )}

                    <div className="space-y-1">
                      {photo.comments &&
                        photo.comments.map((comm) => (
                          <div key={comm._id} className="text-xs flex gap-1.5 justify-start text-slate-300">
                            <span className="font-bold text-slate-200 shrink-0">
                              {comm.userId?.name || "Member"}:
                            </span>
                            <span className="break-all text-left">{comm.comment}</span>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Inline quick comment field */}
                  {user ? (
                    <form
                      onSubmit={(e) => handleAddInlineComment(e, photo._id)}
                      className="flex gap-2 items-center pt-2"
                    >
                      <input
                        type="text"
                        placeholder="Add a comment..."
                        value={commentInputs[photo._id] || ""}
                        onChange={(e) => handleInlineCommentChange(photo._id, e.target.value)}
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
                      />
                      <button
                        type="submit"
                        disabled={!(commentInputs[photo._id] || "").trim()}
                        className="px-3 py-1.5 bg-indigo-600 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-semibold rounded-lg hover:bg-indigo-500 shadow transition-all"
                      >
                        Post
                      </button>
                    </form>
                  ) : (
                    <div className="text-[10px] text-slate-500 text-center py-1">
                      Sign in to comment or like posts.
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Lightbox / Details Overlay */}
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
