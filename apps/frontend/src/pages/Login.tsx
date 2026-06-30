import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "wouter";
import { Shield, Lock, User, KeyRound, AlertTriangle, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { BASE } from "@/lib/api";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [needs2FA, setNeeds2FA] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formData = new URLSearchParams();
      formData.append("username", username);
      formData.append("password", password);
      if (needs2FA && otp) {
        formData.append("totp_code", otp);
      }

      const res = await fetch(`${BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString()
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        if (errorData.detail === "2FA code required") {
          setNeeds2FA(true);
          setIsSubmitting(false);
          toast({
            title: "Email OTP Required",
            description: "We've sent a 6-digit code to your email address.",
          });
          return;
        }
        throw new Error(errorData.detail || "Invalid credentials");
      }

      const data = await res.json();
      
      const meRes = await fetch(`${BASE}/auth/me`, {
        headers: { "Authorization": `Bearer ${data.access_token}` }
      });
      const userData = await meRes.json();
      
      const userPayload = {
        id: userData.id,
        name: userData.full_name || userData.name,
        role: userData.role,
        username: userData.username,
        branchCode: userData.branch_code
      };

      login(userPayload, data.access_token);
      toast({
        title: "Authentication Successful",
        description: `Welcome back, ${userPayload.role} ${userPayload.name}.`,
      });
      setLocation("/dashboard");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Authentication Failed",
        description: "Invalid credentials. Unauthorized access is logged.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4 relative overflow-hidden font-sans" style={{ backgroundColor: "#e8e8e2" }}>
      {/* Background aesthetics */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <svg className="absolute w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#130537" strokeOpacity="0.05" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md z-10"
      >
        <div 
          className="relative bg-[#ffffff] p-8"
          style={{
            border: "2px solid #130537",
            boxShadow: "8px 8px 0px #130537",
            borderRadius: 0
          }}
        >
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#a3e635] border-b-2 border-[#130537]" />
          
          <div className="flex flex-col items-center mb-8 mt-2">
            <div 
              className="h-16 w-16 flex items-center justify-center mb-4 relative group"
              style={{
                backgroundColor: "#f5f5f0",
                border: "2px solid #130537",
                boxShadow: "4px 4px 0px #130537"
              }}
            >
              <Shield className="h-8 w-8 text-[#130537]" />
            </div>
            <h1 className="text-3xl font-black text-[#130537] tracking-tighter uppercase">TRACE-X</h1>
            <p className="text-[10px] font-bold tracking-[0.2em] mt-1 uppercase" style={{ color: "#a3e635" }}>
              <span className="bg-[#130537] px-2 py-0.5">Secure Investigator Portal</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[#130537] uppercase tracking-widest block">
                // Operator ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <User className="h-4 w-4 text-[#130537] opacity-50" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[#f5f5f0] border-2 border-[#130537] rounded-none py-3 pl-10 pr-4 text-sm text-[#130537] placeholder-[#130537] placeholder-opacity-40 focus:outline-none focus:ring-0 focus:border-[#a3e635] transition-colors font-mono font-bold"
                  placeholder="Enter operator ID"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[#130537] uppercase tracking-widest block">
                // Access Key
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <KeyRound className="h-4 w-4 text-[#130537] opacity-50" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#f5f5f0] border-2 border-[#130537] rounded-none py-3 pl-10 pr-4 text-sm text-[#130537] placeholder-[#130537] placeholder-opacity-40 focus:outline-none focus:ring-0 focus:border-[#a3e635] transition-colors font-mono tracking-widest font-bold"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {needs2FA && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-2"
              >
                <label className="text-[10px] font-bold text-[#130537] uppercase tracking-widest block mb-1">
                  // Email OTP Code
                  <span className="block mt-1 text-[9px] text-[#130537]/70 normal-case tracking-normal">Check your inbox for a 6-digit code.</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Shield className="h-4 w-4 text-[#130537] opacity-50" />
                  </div>
                  <input
                    type="text"
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full bg-[#f5f5f0] border-2 border-[#130537] rounded-none py-3 pl-10 pr-4 text-sm text-[#130537] placeholder-[#130537] placeholder-opacity-40 focus:outline-none focus:ring-0 focus:border-[#a3e635] transition-colors font-mono tracking-widest font-bold"
                    placeholder="123456"
                    maxLength={6}
                  />
                </div>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full group bg-[#130537] hover:bg-[#a3e635] text-[#e8e8e2] hover:text-[#130537] font-black py-4 px-4 transition-all mt-4 flex items-center justify-center gap-2 border-2 border-[#130537] hover:shadow-[4px_4px_0px_#130537]"
            >
              {isSubmitting ? (
                <div className="h-4 w-4 rounded-none border-2 border-[#a3e635] border-t-transparent animate-spin" />
              ) : (
                <>
                  <Lock className="h-4 w-4 group-hover:text-[#130537] text-[#a3e635]" />
                  <span className="uppercase tracking-widest text-[13px] group-hover:text-[#130537] text-[#e8e8e2]">Initialize Session</span>
                  <ArrowRight className="h-4 w-4 opacity-100 group-hover:translate-x-1 transition-transform group-hover:text-[#130537] text-[#a3e635]" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 flex items-start gap-3" style={{ borderTop: "2px solid #130537" }}>
            <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: "#ef4444" }} />
            <p className="text-[10px] font-mono leading-tight font-bold" style={{ color: "rgba(19,5,55,0.6)" }}>
              WARNING: This system is for authorized AML investigators only. All activity is logged and monitored. Unauthorized access attempts will be reported.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
