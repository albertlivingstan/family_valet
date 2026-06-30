import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import RootLayout from "./layouts/RootLayout";

// Import pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import AlbumDetails from "./pages/AlbumDetails";
import Members from "./pages/Members";
import Profile from "./pages/Profile";

// Admin-only route guard
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user || user.role !== "admin") {
    return <Navigate to="/" replace />;
  }
  return children;
};

function AppContent() {
  return (
    <BrowserRouter>
      <RootLayout>
        <Routes>
          {/* ── Public routes (no login needed) ── */}
          <Route path="/" element={<Home />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/login" element={<Login />} />

          {/* ── Admin-only routes ── */}
          <Route path="/profile"   element={<AdminRoute><Profile /></AdminRoute>} />
          <Route path="/dashboard" element={<AdminRoute><Dashboard /></AdminRoute>} />
          <Route path="/albums/:id" element={<AdminRoute><AlbumDetails /></AdminRoute>} />
          <Route path="/members"   element={<AdminRoute><Members /></AdminRoute>} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </RootLayout>
    </BrowserRouter>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
