import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import {
  X,
  Heart,
  MessageSquare,
  Calendar,
  MapPin,
  Download,
  Trash2,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Globe,
  Users,
  Lock,
} from "lucide-react";

const PhotoViewer = ({ photos, initialIndex, onClose, onPhotoDeleted }) => {
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [likesCount, setLikesCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  
  const slideshowTimer = useRef(null);
  const photo = photos[currentIndex];

  const getFullImageUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http") || url.startsWith("data:")) return url;
    return `${api.defaults.baseURL.replace("/api", "")}${url}`;
  };

  // Fetch comments and likes when the photo changes
  useEffect(() => {
    if (!photo) return;
    
    const fetchPhotoDetails = async () => {
      setLoadingComments(true);
      try {
        // Fetch comments
        const commResponse = await api.get(`/comments/photo/${photo._id}`);
        setComments(commResponse.data.comments);

        // Fetch likes info
        const likesResponse = await api.get(`/likes/photo/${photo._id}`);
        setLikesCount(likesResponse.data.likesCount);
        setHasLiked(likesResponse.data.hasLiked);
      } catch (err) {
        console.error("Error loading photo social metrics:", err);
      } finally {
        setLoadingComments(false);
      }
    };

    fetchPhotoDetails();
  }, [currentIndex, photo]);

  // Slideshow logic
  useEffect(() => {
    if (isPlaying) {
      slideshowTimer.current = setInterval(() => {
        handleNext();
      }, 4000);
    } else {
      if (slideshowTimer.current) {
        clearInterval(slideshowTimer.current);
      }
    }

    return () => {
      if (slideshowTimer.current) {
        clearInterval(slideshowTimer.current);
      }
    };
  }, [isPlaying, currentIndex, photos.length]);

  if (!photo) return null;

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % photos.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + photos.length) % photos.length);
  };

  const handleToggleLike = async () => {
    if (!user) return;
    try {
      const response = await api.post(`/likes/photo/${photo._id}`);
      setHasLiked(response.data.liked);
      setLikesCount(response.data.likesCount);
    } catch (err) {
      console.error("Error toggling like:", err);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    try {
      const response = await api.post(`/comments/photo/${photo._id}`, {
        comment: newComment,
      });
      setComments([...comments, response.data.comment]);
      setNewComment("");
    } catch (err) {
      console.error("Error posting comment:", err);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await api.delete(`/comments/${commentId}`);
      setComments(comments.filter((c) => c._id !== commentId));
    } catch (err) {
      console.error("Error deleting comment:", err);
    }
  };

  const handleDeletePhoto = async () => {
    if (!window.confirm("Are you sure you want to permanently delete this photo?")) return;
    try {
      await api.delete(`/photos/${photo._id}`);
      onPhotoDeleted(photo._id);
      if (photos.length <= 1) {
        onClose();
      } else {
        handleNext();
      }
    } catch (err) {
      console.error("Error deleting photo:", err);
    }
  };

  const handleDownload = async () => {
    try {
      const imgUrl = getFullImageUrl(photo.imageURL);
      if (imgUrl.startsWith("data:")) {
        const link = document.createElement("a");
        link.href = imgUrl;
        link.download = photo.caption || "familyvault-photo.jpg";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }
      
      const response = await fetch(imgUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = photo.caption || "familyvault-photo.jpg";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download failed, opening image in new window", err);
      window.open(getFullImageUrl(photo.imageURL), "_blank");
    }
  };

  const getPrivacyIcon = (privacy) => {
    switch (privacy) {
      case "public":
        return <Globe className="w-4 h-4 text-emerald-400" title="Public" />;
      case "family":
        return <Users className="w-4 h-4 text-indigo-400" title="Family Only" />;
      default:
        return <Lock className="w-4 h-4 text-rose-400" title="Private" />;
    }
  };

  const isOwnerOrAdmin = user && (user._id === photo.ownerId._id || user._id === photo.ownerId || user.role === "admin");

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-lg flex items-center justify-center p-2 sm:p-4 overflow-hidden">
      {/* Lightbox container */}
      <div className="relative w-full max-w-6xl h-[90vh] glass-panel border border-white/10 rounded-2xl flex flex-col md:flex-row overflow-hidden shadow-2xl animate-fade-in">
        
        {/* Left Side: Photo Frame */}
        <div className="relative flex-1 bg-black/40 flex items-center justify-center p-4 select-none group min-h-0">
          <img
            src={getFullImageUrl(photo.imageURL)}
            alt={photo.caption}
            className="max-w-full max-h-full object-contain rounded-lg transition-transform duration-300"
          />

          {/* Left Arrow */}
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-slate-900/60 hover:bg-indigo-600/80 border border-white/10 text-white rounded-full transition-all duration-200"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Right Arrow */}
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-slate-900/60 hover:bg-indigo-600/80 border border-white/10 text-white rounded-full transition-all duration-200"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Control Bar (Top) */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-center bg-gradient-to-b from-black/50 to-transparent p-2 rounded-t-xl opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <span className="text-xs font-semibold text-slate-300">
              {currentIndex + 1} / {photos.length}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`p-2 rounded-lg text-white transition-all ${
                  isPlaying ? "bg-indigo-600" : "bg-slate-900/60 hover:bg-slate-800"
                }`}
                title={isPlaying ? "Pause Slideshow" : "Play Slideshow"}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <button
                onClick={handleDownload}
                className="p-2 bg-slate-900/60 hover:bg-slate-800 rounded-lg text-white transition-all"
                title="Download Original"
              >
                <Download className="w-4 h-4" />
              </button>
              {isOwnerOrAdmin && (
                <button
                  onClick={handleDeletePhoto}
                  className="p-2 bg-slate-900/60 hover:bg-rose-600 rounded-lg text-white transition-all"
                  title="Delete Photo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Info & Comments Sidebar */}
        <div className="w-full md:w-96 border-t md:border-t-0 md:border-l border-white/10 bg-slate-900/40 flex flex-col h-[40vh] md:h-full">
          {/* Top Panel: Close Button */}
          <div className="absolute top-4 right-4 z-10 md:static md:flex md:justify-end md:p-3">
            <button
              onClick={onClose}
              className="p-2 bg-slate-900/80 hover:bg-rose-600/20 hover:text-rose-400 border border-white/10 rounded-full text-slate-300 transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Photo Metadata */}
          <div className="p-4 border-b border-white/5 space-y-3">
            <div className="flex items-center gap-3">
              <img
                src={photo.ownerId.profileImage}
                alt={photo.ownerId.name || "Uploader"}
                className="w-10 h-10 rounded-full border border-white/10 object-cover"
              />
              <div className="leading-tight">
                <h4 className="text-sm font-semibold text-slate-200">{photo.ownerId.name || "Family Member"}</h4>
                <span className="text-[10px] text-slate-400">
                  Uploaded {new Date(photo.uploadedAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div>
              <h3 className="text-base font-semibold text-slate-100">{photo.caption}</h3>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-400">
              {photo.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{photo.location}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                <span>{new Date(photo.dateTaken).toLocaleDateString(undefined, { dateStyle: "medium" })}</span>
              </div>
              <div className="flex items-center gap-1">
                {getPrivacyIcon(photo.privacy)}
                <span className="capitalize">{photo.privacy}</span>
              </div>
            </div>

            {/* Social Indicators */}
            <div className="flex items-center gap-4 pt-1">
              <button
                onClick={handleToggleLike}
                disabled={!user}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  hasLiked
                    ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                    : "bg-white/5 border-white/5 text-slate-300 hover:bg-rose-500/5 hover:border-rose-500/10 hover:text-rose-400"
                }`}
              >
                <Heart className={`w-4 h-4 ${hasLiked ? "fill-rose-500 text-rose-500" : ""}`} />
                <span>{likesCount} {likesCount === 1 ? "Like" : "Likes"}</span>
              </button>

              <div className="flex items-center gap-1.5 text-slate-400 text-xs py-1.5 px-3">
                <MessageSquare className="w-4 h-4 text-indigo-400" />
                <span>{comments.length} Comments</span>
              </div>
            </div>
          </div>

          {/* Comments Section (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 bg-black/10">
            {loadingComments ? (
              <div className="flex justify-center items-center h-20">
                <div className="w-5 h-5 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center text-xs text-slate-500 py-8">
                No comments yet. Share your thoughts!
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment._id} className="flex gap-2 text-xs text-slate-300 group/comment">
                  <img
                    src={comment.userId.profileImage}
                    alt={comment.userId.name}
                    className="w-6 h-6 rounded-full object-cover border border-white/10"
                  />
                  <div className="flex-1 bg-white/5 rounded-xl p-2.5 border border-white/5">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-slate-200">{comment.userId.name}</span>
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] text-slate-500">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                        {user && (user._id === comment.userId._id || user.role === "admin" || user._id === photo.ownerId._id) && (
                          <button
                            onClick={() => handleDeleteComment(comment._id)}
                            className="text-slate-500 hover:text-rose-400 ml-1 opacity-0 group-hover/comment:opacity-100 transition-opacity duration-150"
                            title="Delete Comment"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="leading-relaxed text-slate-300 break-words">{comment.comment}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Add Comment Input Form */}
          {user ? (
            <form onSubmit={handleAddComment} className="p-3 border-t border-white/5 bg-slate-900/80">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Share a memory..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
                />
                <button
                  type="submit"
                  disabled={!newComment.trim()}
                  className="px-3 py-1.5 bg-indigo-600 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-semibold rounded-lg hover:bg-indigo-500 shadow-md shadow-indigo-500/10 transition-all"
                >
                  Post
                </button>
              </div>
            </form>
          ) : (
            <div className="p-3 border-t border-white/5 bg-slate-950/40 text-center text-xs text-slate-500">
              "Sign in to write comments."
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PhotoViewer;
