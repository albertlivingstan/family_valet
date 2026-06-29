import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import RootLayout from "./layouts/RootLayout";

// Import pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import AlbumDetails from "./pages/AlbumDetails";
import Members from "./pages/Members";
import Profile from "./pages/Profile";

// Route guard for authenticated and approved users
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return null;
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Route guard for logged in users (approved or pending)
const AuthRequiredRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return null;
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function AppContent() {
  return (
    <BrowserRouter>
      <RootLayout>
        <Routes>
          {/* Guest / Public route */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* User Profile (available to pending and approved) */}
          <Route
            path="/profile"
            element={
              <AuthRequiredRoute>
                <Profile />
              </AuthRequiredRoute>
            }
          />

          {/* Secure family routes (approved only) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/upload"
            element={
              <ProtectedRoute>
                <Upload />
              </ProtectedRoute>
            }
          />
          <Route
            path="/albums/:id"
            element={
              <ProtectedRoute>
                <AlbumDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/members"
            element={
              <ProtectedRoute>
                <Members />
              </ProtectedRoute>
            }
          />

          {/* Catch-all redirect */}
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
