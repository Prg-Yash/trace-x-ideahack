import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useLocation } from "wouter";
import { BASE } from "../lib/api";

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Check for token on mount
    const storedToken = localStorage.getItem("trace_x_token");
    if (storedToken) {
      setToken(storedToken);
      // Fetch user /me could be done here to hydrate user state.
      // For now, we'll set a placeholder or decode JWT in real app.
      // Or we can just set authenticated true if token exists.
      fetch(`${BASE}/auth/me`, {
        headers: {
          "Authorization": `Bearer ${storedToken}`
        }
      }).then(res => {
        if (res.ok) {
          return res.json();
        } else {
          throw new Error("Invalid token");
        }
      }).then(data => {
        setUser(data);
      }).catch(() => {
        logout();
      }).finally(() => {
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem("trace_x_token", newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem("trace_x_token");
    setToken(null);
    setUser(null);
    setLocation("/login");
  };

  const value = {
    token,
    user,
    login,
    logout,
    isAuthenticated: !!token,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
