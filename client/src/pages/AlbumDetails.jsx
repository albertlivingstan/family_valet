import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import PhotoViewer from "../components/PhotoViewer";
import {
  FolderOpen,
  Camera,
  Globe,
  Users,
  Lock,
  Trash2,
  Edit,
  ArrowLeft,
  Calendar,
  MapPin,
  Plus,
  AlertCircle
} from "lucide-react";

const AlbumDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [album, setAlbum] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePhotoIndex, setActivePhotoIndex] = useState(null);

  // Edit Album Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPrivacy, setEditPrivacy] = useState("family");
  const [editCover, setEditCover] = useState("");
  const [editError, setEditError] = useState("");
  const [updating, setUpdating] = useState(false);

  const fetchAlbumData = async () => {
    setLoading(true);
    try {
      // Get album details
      const albumRes = await api.get(`/albums/${id}`);
      setAlbum(albumRes.data.album);

      // Initialize edit fields
      setEditTitle(albumRes.data.album.title);
      setEditDescription(albumRes.data.album.description);
      setEditPrivacy(albumRes.data.album.privacy);
      setEditCover(albumRes.data.album.coverImage);

      // Get album photos
      const photosRes = await api.get(`/photos/album/${id}`);
      setPhotos(photosRes.data.photos);
    } catch (err) {
      console.error("Failed to load album data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlbumData();
  }, [id]);

  const handleDeleteAlbum = async () => {
    if (
      !window.confirm(
        "WARNING: Deleting this album will permanently delete all photos stored inside it. Do you want to proceed?"
      )
    ) {
      return;
    }

    try {
      await api.delete(`/albums/${id}`);
      navigate("/dashboard");
    } catch (err) {
      console.error("Error deleting album:", err);
    }
  };

  const handleUpdateAlbum = async (e) => {
    e.preventDefault();
    if (!editTitle.trim()) {
      return setEditError("Album title is required");
    }

    setEditError("");
    setUpdating(true);
    try {
      const response = await api.put(`/albums/${id}`, {
        title: editTitle,
        description: editDescription,
        privacy: editPrivacy,
        coverImage: editCover,
      });

      setAlbum(response.data.album);
      setEditModalOpen(false);
    } catch (err) {
      console.error("Update album failed:", err);
      setEditError("Failed to update album metadata.");
    } finally {
      setUpdating(false);
    }
  };

  const getPrivacyIcon = (privacy) => {
    switch (privacy) {
      case "public":
        return <Globe className="w-4 h-4 text-emerald-400" />;
      case "family":
        return <Users className="w-4 h-4 text-indigo-400" />;
      default:
        return <Lock className="w-4 h-4 text-rose-400" />;
    }
  };

  const getFullImageUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http") || url.startsWith("data:")) return url;
    return `${api.defaults.baseURL.replace("/api", "")}${url}`;
  };

  const onPhotoDeleted = (deletedId) => {
    setPhotos(photos.filter((p) => p._id !== deletedId));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-40">
        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!album) {
    return (
      <div className="glass-panel p-8 text-center rounded-2xl max-w-md mx-auto space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h3 className="text-lg font-bold text-slate-200">Album Not Found</h3>
        <p className="text-slate-400 text-sm">
          It might have been deleted, or you might not have access permissions.
        </p>
        <Link to="/" className="inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-semibold">
          Return Home
        </Link>
      </div>
    );
  }

  const isOwnerOrAdmin =
    user && (user._id === album.ownerId._id || user._id === album.ownerId || user.role === "admin");

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to list</span>
        </button>
      </div>

      {/* Hero Header panel */}
      <section className="relative glass-panel rounded-3xl overflow-hidden p-6 sm:p-8 flex flex-col md:flex-row gap-6 items-center shadow-xl">
        <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl overflow-hidden shrink-0 border border-white/10 bg-slate-950">
          <img src={album.coverImage} alt={album.title} className="w-full h-full object-cover" />
        </div>

        <div className="flex-1 text-center md:text-left space-y-3">
          <div className="flex flex-wrap justify-center md:justify-start items-center gap-2.5">
            <span className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-xs font-bold uppercase tracking-wider text-slate-300">
              {getPrivacyIcon(album.privacy)}
              <span>{album.privacy}</span>
            </span>
            <span className="text-xs text-slate-400">
              Created by <span className="font-semibold text-indigo-400">{album.ownerId.name}</span>
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100">{album.title}</h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl leading-relaxed">
            {album.description || "No description provided."}
          </p>
        </div>

        {/* Action Controls for owner/admin */}
        {isOwnerOrAdmin && (
          <div className="flex sm:flex-col gap-2.5 w-full md:w-auto">
            <button
              onClick={() => setEditModalOpen(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-200 transition-all"
            >
              <Edit className="w-4 h-4" />
              <span>Edit Album</span>
            </button>
            <button
              onClick={handleDeleteAlbum}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 transition-all"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Album</span>
            </button>
          </div>
        )}
      </section>

      {/* Album Photos Grid */}
      <section className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-indigo-400" />
            <span>Album Photos</span>
            <span className="px-2 py-0.5 text-[10px] rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/10 font-bold">
              {photos.length}
            </span>
          </h3>

          {isOwnerOrAdmin && (
            <Link
              to={`/upload?albumId=${album._id}`}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-semibold text-white transition-all shadow-md shadow-indigo-500/10"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Upload Here</span>
            </Link>
          )}
        </div>

        {photos.length === 0 ? (
          <div className="glass-panel p-12 text-center rounded-2xl border-dashed border-white/10 space-y-4">
            <div className="inline-flex p-4 bg-slate-800/40 rounded-full text-slate-500">
              <Camera className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-slate-300">No photos in this album</h4>
            {isOwnerOrAdmin ? (
              <div className="space-y-2">
                <p className="text-xs text-slate-500">Get started by uploading your first family memories.</p>
                <Link
                  to={`/upload?albumId=${album._id}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-semibold text-white transition-all"
                >
                  <Camera className="w-4 h-4" />
                  <span>Upload Photos</span>
                </Link>
              </div>
            ) : (
              <p className="text-xs text-slate-500">Check back later once family members add photos.</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {photos.map((photo, index) => (
              <div
                key={photo._id}
                onClick={() => setActivePhotoIndex(index)}
                className="group cursor-pointer glass-panel glass-panel-hover rounded-2xl overflow-hidden shadow-md flex flex-col"
              >
                <div className="aspect-[4/3] overflow-hidden bg-slate-950 relative">
                  <img
                    src={getFullImageUrl(photo.thumbnail || photo.imageURL)}
                    alt={photo.caption}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Hover Info */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-4 flex flex-col justify-end">
                    <p className="text-xs font-bold text-slate-100 mb-1">{photo.caption}</p>
                    <div className="flex flex-wrap gap-2 text-[10px] text-slate-300">
                      {photo.location && (
                        <span className="flex items-center gap-0.5">
                          <MapPin className="w-3 h-3 text-indigo-400" />
                          <span>{photo.location}</span>
                        </span>
                      )}
                      <span className="flex items-center gap-0.5">
                        <Calendar className="w-3 h-3 text-indigo-400" />
                        <span>{new Date(photo.dateTaken).toLocaleDateString()}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card details */}
                <div className="p-3 text-[10px] text-slate-500 flex justify-between border-t border-white/5 bg-slate-950/20">
                  <span>By {photo.ownerId.name}</span>
                  <span className="capitalize">{photo.privacy}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Lightbox Slider overlay */}
      {activePhotoIndex !== null && (
        <PhotoViewer
          photos={photos}
          initialIndex={activePhotoIndex}
          onClose={() => setActivePhotoIndex(null)}
          onPhotoDeleted={onPhotoDeleted}
        />
      )}

      {/* Modal: Edit Album */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-panel p-6 sm:p-8 rounded-2xl shadow-2xl space-y-5 relative animate-fade-in">
            <div className="flex justify-between items-center pb-3 border-b border-white/5">
              <h3 className="text-lg font-bold text-slate-200">Edit Album Details</h3>
              <button
                onClick={() => setEditModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            {editError && (
              <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-xs font-semibold">
                <AlertCircle className="w-4 h-4" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateAlbum} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">Album Title *</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-all"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">Description</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-all h-20 resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">Cover Image URL</label>
                <input
                  type="url"
                  value={editCover}
                  onChange={(e) => setEditCover(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400">Privacy Setting</label>
                <div className="grid grid-cols-3 gap-3">
                  <label className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center cursor-pointer transition-all ${
                    editPrivacy === "private"
                      ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                      : "bg-slate-950/50 border-white/5 text-slate-400 hover:bg-white/5"
                  }`}>
                    <input
                      type="radio"
                      name="privacy"
                      value="private"
                      checked={editPrivacy === "private"}
                      onChange={() => setEditPrivacy("private")}
                      className="sr-only"
                    />
                    <Lock className="w-4 h-4 mb-1" />
                    <span className="text-[10px] font-semibold uppercase">Private</span>
                  </label>

                  <label className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center cursor-pointer transition-all ${
                    editPrivacy === "family"
                      ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
                      : "bg-slate-950/50 border-white/5 text-slate-400 hover:bg-white/5"
                  }`}>
                    <input
                      type="radio"
                      name="privacy"
                      value="family"
                      checked={editPrivacy === "family"}
                      onChange={() => setEditPrivacy("family")}
                      className="sr-only"
                    />
                    <Users className="w-4 h-4 mb-1" />
                    <span className="text-[10px] font-semibold uppercase">Family</span>
                  </label>

                  <label className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center cursor-pointer transition-all ${
                    editPrivacy === "public"
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                      : "bg-slate-950/50 border-white/5 text-slate-400 hover:bg-white/5"
                  }`}>
                    <input
                      type="radio"
                      name="privacy"
                      value="public"
                      checked={editPrivacy === "public"}
                      onChange={() => setEditPrivacy("public")}
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
                  onClick={() => setEditModalOpen(false)}
                  className="flex-1 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 text-sm font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-sm font-semibold rounded-xl transition-all shadow-md flex items-center justify-center"
                >
                  {updating ? (
                    <span className="w-4 h-4 border-2 border-indigo-200 border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    "Save Changes"
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

export default AlbumDetails;
