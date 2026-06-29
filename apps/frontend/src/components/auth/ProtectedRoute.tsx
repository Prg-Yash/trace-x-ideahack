import React from "react";
import { useAuth } from "@/context/AuthContext";
import { Redirect } from "wouter";
import { Shield } from "lucide-react";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center" style={{ backgroundColor: "var(--background)" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <Shield className="h-12 w-12 text-slate-700 opacity-20" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-4 w-4 rounded-full border-2 border-slate-500 border-t-transparent animate-spin" />
            </div>
          </div>
          <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">Authenticating Session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  return <>{children}</>;
}
