import React, { createContext, useContext, useState, useEffect } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithPopup,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import { auth, googleProvider } from "../services/firebase";
import api from "../services/api";

const AuthContext = createContext(null);

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const syncUserWithBackend = async (fbUser) => {
    try {
      const token = await fbUser.getIdToken(true);
      localStorage.setItem("token", token);
      
      const response = await api.post("/auth/sync", {
        name: fbUser.displayName || fbUser.email.split("@")[0],
        email: fbUser.email,
        profileImage: fbUser.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${fbUser.email}`,
      });
      
      setUser(response.data.user);
      return response.data.user;
    } catch (error) {
      console.error("Error syncing user with backend:", error);
      localStorage.removeItem("token");
      setUser(null);
      throw error;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setLoading(true);
      if (fbUser) {
        setFirebaseUser(fbUser);
        try {
          await syncUserWithBackend(fbUser);
        } catch (e) {
          console.error("Authentication sync failed", e);
        }
      } else {
        setFirebaseUser(null);
        setUser(null);
        localStorage.removeItem("token");
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await syncUserWithBackend(userCredential.user);
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password, name) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Update profile in Firebase
      await updateProfile(userCredential.user, {
        displayName: name,
        photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${name || email}`,
      });
      // Force reload user to get the display name updated
      await userCredential.user.reload();
      const updatedUser = auth.currentUser;
      setFirebaseUser(updatedUser);
      await syncUserWithBackend(updatedUser);
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await syncUserWithBackend(result.user);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setUser(null);
      setFirebaseUser(null);
      localStorage.removeItem("token");
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    if (!firebaseUser) return;
    try {
      const token = await firebaseUser.getIdToken(true);
      localStorage.setItem("token", token);
      const response = await api.get("/users/me");
      setUser(response.data.user);
    } catch (error) {
      console.error("Error refreshing user:", error);
    }
  };

  const value = {
    firebaseUser,
    user,
    loading,
    login,
    register,
    loginWithGoogle,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
