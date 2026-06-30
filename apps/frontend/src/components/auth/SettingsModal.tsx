import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { BASE } from "@/lib/api";

export function SettingsModal({ open, onOpenChange, user }: { open: boolean, onOpenChange: (open: boolean) => void, user: any }) {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(user?.two_factor_enabled || false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && user) {
      setTwoFactorEnabled(user.two_factor_enabled || false);
      setQrCodeUrl("");
      setSecret("");
      setOtp("");
    }
  }, [open, user]);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem("trace-x-token");
      const res = await fetch(`${BASE}/auth/2fa/generate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to generate 2FA");
      const data = await res.json();
      setQrCodeUrl(data.qr_code_url);
      setSecret(data.secret);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!otp) return;
    setLoading(true);
    try {
      const token = sessionStorage.getItem("trace-x-token");
      const res = await fetch(`${BASE}/auth/2fa/verify`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ token: otp })
      });
      if (!res.ok) throw new Error("Invalid 2FA code");
      toast.success("2FA enabled successfully");
      setTwoFactorEnabled(true);
      setQrCodeUrl("");
      setSecret("");
      
      // Update local user state
      if (user) {
        user.two_factor_enabled = true;
        // Ideally we should refetch /me or use context update
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent style={{ backgroundColor: "var(--card)", border: "2px solid var(--border)", borderRadius: 0 }}>
        <DialogHeader>
          <DialogTitle className="text-xl font-black uppercase tracking-widest text-[#e8e8e2]">
            Account Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-4 p-4 border border-[#2A2F35] bg-[#1A1F27]">
            <h3 className="text-[12px] font-bold uppercase tracking-widest text-[#a3e635]">Two-Factor Authentication</h3>
            
            {twoFactorEnabled ? (
              <div className="text-sm text-green-500 font-medium bg-green-500/10 p-3">
                ✓ 2FA is currently enabled for your account.
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-400">Enhance your account security by enabling Two-Factor Authentication.</p>
                
                {!qrCodeUrl ? (
                  <Button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="w-full rounded-none border border-[#a3e635] text-[#a3e635] hover:bg-[#a3e635] hover:text-[#130537] bg-transparent"
                  >
                    Setup 2FA
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-center p-4 bg-white rounded-md">
                      <img src={qrCodeUrl} alt="2FA QR Code" className="w-48 h-48" />
                    </div>
                    <p className="text-xs text-center text-gray-500 break-all">Secret: {secret}</p>
                    
                    <div className="space-y-2">
                      <Input
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="Enter 6-digit code"
                        className="rounded-none border-[#2A2F35] text-center tracking-widest bg-transparent"
                        maxLength={6}
                      />
                      <Button
                        onClick={handleVerify}
                        disabled={loading || otp.length !== 6}
                        className="w-full rounded-none bg-[#a3e635] text-[#130537] hover:brightness-110"
                      >
                        Verify & Enable
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
