import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useLocation } from "wouter";

export type Role = "Investigator" | "Branch Manager" | "Admin";

export interface User {
  id: string;
  name: string;
  role: Role;
  username: string;
  branchCode?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Check for stored user and token on mount
    const storedUser = sessionStorage.getItem("trace-x-user");
    const storedToken = sessionStorage.getItem("trace-x-token");
    if (storedUser && storedToken) {
      const data = JSON.parse(storedUser);
      const fetchedUser: User = {
        id: data.id,
        name: data.full_name || data.name,
        role: data.role,
        username: data.username,
        branchCode: data.branch_code || data.branchCode
      };
      setUserState(fetchedUser);
      setTokenState(storedToken);
    }
    setIsLoading(false);
  }, []);

  const login = (newUser: User, newToken: string) => {
    setUserState(newUser);
    setTokenState(newToken);
    sessionStorage.setItem("trace-x-user", JSON.stringify(newUser));
    sessionStorage.setItem("trace-x-token", newToken);
  };

  const logout = () => {
    setUserState(null);
    setTokenState(null);
    sessionStorage.removeItem("trace-x-user");
    sessionStorage.removeItem("trace-x-token");
    setLocation("/login");
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      logout,
      isAuthenticated: !!user && !!token,
      isLoading
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
