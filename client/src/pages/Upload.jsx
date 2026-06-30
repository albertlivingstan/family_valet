import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";
import { UploadCloud, Folder, MapPin, Calendar, Globe, Users, Lock, X, AlertCircle } from "lucide-react";

const Upload = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryAlbumId = searchParams.get("albumId");

  // Albums state
  const [albums, setAlbums] = useState([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState("");
  const [loadingAlbums, setLoadingAlbums] = useState(true);

  // Upload Form States
  const [files, setFiles] = useState([]);
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [dateTaken, setDateTaken] = useState(new Date().toISOString().split("T")[0]);
  const [privacy, setPrivacy] = useState("public"); // Default to public for Instagram style

  // Status
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const fetchUserAlbums = async () => {
      setLoadingAlbums(true);
      try {
        const response = await api.get("/albums");
        setAlbums(response.data.albums);
        
        // Auto-select query album or first available
        if (queryAlbumId) {
          setSelectedAlbumId(queryAlbumId);
        } else if (response.data.albums.length > 0) {
          setSelectedAlbumId(response.data.albums[0]._id);
        }
      } catch (err) {
        console.error("Failed to load albums list", err);
      } finally {
        setLoadingAlbums(false);
      }
    };

    fetchUserAlbums();
  }, [queryAlbumId]);

  useEffect(() => {
    if (selectedAlbumId && albums.length > 0) {
      const selected = albums.find((a) => a._id === selectedAlbumId);
      if (selected) {
        setPrivacy(selected.privacy);
      }
    }
  }, [selectedAlbumId, albums]);

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    addFiles(selectedFiles);
  };

  const addFiles = (newFiles) => {
    const imageFiles = newFiles.filter((file) => file.type.startsWith("image/"));
    if (imageFiles.length !== newFiles.length) {
      setError("Only image files are supported in this vault");
    }
    setFiles((prevFiles) => [...prevFiles, ...imageFiles]);
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  // Helper to read file as base64 data URL
  const readFileAsDataURL = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0) {
      return setError("Please choose at least one photo to upload");
    }

    setError("");
    setUploading(true);
    setProgress(0);

    try {
      const base64Images = [];
      
      // Convert files sequentially to track progress
      for (let i = 0; i < files.length; i++) {
        const base64 = await readFileAsDataURL(files[i]);
        base64Images.push(base64);
        setProgress(Math.round(((i + 1) / files.length) * 100));
      }

      const payload = {
        caption,
        location,
        dateTaken,
        privacy,
        images: base64Images, // Send the base64 data URLs directly!
      };

      if (selectedAlbumId) {
        payload.albumId = selectedAlbumId;
      }

      await api.post("/photos/upload", payload);
      setProgress(100);
      
      setTimeout(() => {
        navigate("/");
      }, 500);
    } catch (err) {
      console.error("Upload error:", err);
      setError(err.response?.data?.message || err.message || "Failed to upload photos to server.");
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-100 flex items-center gap-2">
          <UploadCloud className="w-8 h-8 text-indigo-400" />
          <span>Upload to Firebase</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Post photos directly to Google Firebase Cloud Storage, linked in your Instagram feed.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm font-semibold animate-shake">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleUploadSubmit} className="space-y-6">
        
        {/* Optional Album Selection */}
        <div className="glass-panel p-5 rounded-2xl space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Folder className="w-4 h-4 text-indigo-400" />
              <span>Target Album (Optional)</span>
            </h3>
            <span className="text-[10px] text-slate-400">If none is selected, this post will publish directly to your feed</span>
          </div>
          {loadingAlbums ? (
            <div className="text-xs text-slate-500">Loading albums...</div>
          ) : (
            <select
              value={selectedAlbumId}
              onChange={(e) => setSelectedAlbumId(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="">Post directly to Main Feed (Instagram Style)</option>
              {albums.map((album) => (
                <option key={album._id} value={album._id}>
                  {album.title} ({album.privacy})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Drag & Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="glass-panel rounded-2xl border-2 border-dashed border-white/10 hover:border-indigo-500/40 p-8 text-center cursor-pointer transition-colors group relative"
        >
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={uploading}
          />
          <div className="space-y-3 pointer-events-none">
            <div className="inline-flex p-4 bg-indigo-600/10 rounded-full text-indigo-400 border border-indigo-500/10 group-hover:scale-105 transition-transform duration-200">
              <UploadCloud className="w-8 h-8 text-glow" />
            </div>
            <h4 className="text-base font-bold text-slate-200">Drag & drop your photos here</h4>
            <p className="text-xs text-slate-500">Images will be hosted securely on your Firebase cloud bucket.</p>
            <button
              type="button"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl"
            >
              Select Files
            </button>
          </div>
        </div>

        {/* Files Preview list */}
        {files.length > 0 && (
          <div className="glass-panel p-5 rounded-2xl space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <h4 className="text-xs font-bold text-slate-300">Files to Upload ({files.length})</h4>
              <button
                type="button"
                onClick={() => setFiles([])}
                className="text-xs text-rose-400 hover:underline"
              >
                Clear all
              </button>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-48 overflow-y-auto p-1">
              {files.map((file, idx) => (
                <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-slate-950 border border-white/10 group">
                  <img
                    src={URL.createObjectURL(file)}
                    alt="preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="absolute top-1 right-1 p-1 bg-black/60 rounded-md text-slate-400 hover:text-white hover:bg-rose-600 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Meta Tags */}
        <div className="glass-panel p-5 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-slate-200">Add Post Details</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                <span>Location</span>
              </label>
              <input
                type="text"
                placeholder="Paris, France"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={uploading}
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                <span>Date Taken</span>
              </label>
              <input
                type="date"
                value={dateTaken}
                onChange={(e) => setDateTaken(e.target.value)}
                disabled={uploading}
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400">Caption / Description</label>
            <input
              type="text"
              placeholder="Write a caption..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              disabled={uploading}
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Privacy */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400">Post Privacy</label>
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
                <span className="text-[10px] font-semibold uppercase">Family Only</span>
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
        </div>

        {/* Progress loader */}
        {uploading && (
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span>Uploading to Family Vault...</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-white/5">
              <div
                className="bg-gradient-to-r from-indigo-500 to-pink-500 h-full rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={uploading || files.length === 0}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold rounded-xl transition-all shadow-md shadow-indigo-500/10 hover:shadow-indigo-500/20 flex items-center justify-center gap-2"
        >
          {uploading ? (
            <span className="w-5 h-5 border-2 border-indigo-200 border-t-transparent rounded-full animate-spin"></span>
          ) : (
            <span>Share {files.length} {files.length === 1 ? "Post" : "Posts"}</span>
          )}
        </button>
      </form>
    </div>
  );
};

export default Upload;
