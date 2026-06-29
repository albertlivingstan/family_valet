import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from local storage token
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const response = await api.get("/users/me");
          setUser(response.data.user);
        } catch (error) {
          console.error("Session token validation failed:", error);
          localStorage.removeItem("token");
          setUser(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (name, password) => {
    setLoading(true);
    try {
      const response = await api.post("/auth/login", { name, password });
      localStorage.setItem("token", response.data.token);
      setUser(response.data.user);
      return response.data.user;
    } catch (error) {
      console.error("Login failed:", error);
      const msg = error.response?.data?.message || "Invalid username or password";
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, password, email) => {
    setLoading(true);
    try {
      const response = await api.post("/auth/register", { name, password, email });
      localStorage.setItem("token", response.data.token);
      setUser(response.data.user);
      return response.data.user;
    } catch (error) {
      console.error("Registration failed:", error);
      const msg = error.response?.data?.message || "Username already taken";
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const response = await api.get("/users/me");
      setUser(response.data.user);
    } catch (error) {
      console.error("Error refreshing user profile:", error);
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
