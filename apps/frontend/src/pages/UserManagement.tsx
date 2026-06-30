import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { User, Shield, Users, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { fetchInvestigators, createInvestigator, updateInvestigatorPassword, deleteInvestigator, fetchBranches, unlockInvestigator } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const cardStyle = {
  backgroundColor: "var(--card)",
  border: "2px solid var(--border)",
  borderRadius: 0,
};

export default function UserManagement() {
  const [investigators, setInvestigators] = useState<{id: string; username: string; full_name: string; role?: string; is_locked?: boolean}[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newFullName, setNewFullName] = useState("");
  const [newBranchId, setNewBranchId] = useState("");
  const [newRole, setNewRole] = useState("Investigator");
  const [createLoading, setCreateLoading] = useState(false);
  const [branches, setBranches] = useState<{id: number; branch_code: string; name: string}[]>([]);
  const { user } = useAuth();

  // Password Update states
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [selectedInvestigator, setSelectedInvestigator] = useState<{id: string; username: string} | null>(null);
  const [updatePasswordValue, setUpdatePasswordValue] = useState("");
  const [updatePasswordLoading, setUpdatePasswordLoading] = useState(false);

  // Delete states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    loadInvestigators();
    if (user?.role === "Admin") {
      fetchBranches().then(setBranches).catch(console.error);
    }
  }, [user]);

  const loadInvestigators = async () => {
    try {
      setLoading(true);
      const data = await fetchInvestigators();
      setInvestigators(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load investigators");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newUsername || !newPassword || !newFullName) return;
    
    setCreateLoading(true);
    try {
      await createInvestigator({ 
        username: newUsername, 
        password: newPassword, 
        full_name: newFullName,
        branch_id: newBranchId ? parseInt(newBranchId) : undefined,
        role: newRole
      });
      toast.success("User created successfully!");
      setNewUsername("");
      setNewPassword("");
      setNewFullName("");
      setNewBranchId("");
      setNewRole("Investigator");
      await loadInvestigators();
    } catch (err: any) {
      toast.error(err.message || "Failed to create investigator");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!selectedInvestigator || !updatePasswordValue) return;
    
    setUpdatePasswordLoading(true);
    try {
      await updateInvestigatorPassword(selectedInvestigator.id, updatePasswordValue);
      toast.success("Password updated successfully!");
      setPasswordModalOpen(false);
      setUpdatePasswordValue("");
      setSelectedInvestigator(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to update password");
    } finally {
      setUpdatePasswordLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedInvestigator) return;
    
    setDeleteLoading(true);
    try {
      await deleteInvestigator(selectedInvestigator.id);
      toast.success("Investigator deleted successfully!");
      setDeleteModalOpen(false);
      setSelectedInvestigator(null);
      await loadInvestigators();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete investigator");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleUnlock = async (userId: string) => {
    try {
      await unlockInvestigator(userId);
      toast.success("Investigator unlocked successfully!");
      await loadInvestigators();
    } catch (err: any) {
      toast.error(err.message || "Failed to unlock investigator");
    }
  };

  return (
    <div className="p-6 space-y-5 min-h-screen" style={{ backgroundColor: "var(--background)" }}>
      {/* HEADER */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="flex items-center justify-between p-5" style={cardStyle}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] mb-1" style={{ color: "#a3e635" }}>
              // System Administration
            </p>
            <h1 className="text-2xl font-black uppercase tracking-tight" style={{ color: "var(--foreground)" }}>
              User Management
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>
              Manage system access and onboard new FIU investigators
            </p>
          </div>
          <div className="h-12 w-12 flex items-center justify-center" style={{ backgroundColor: "rgba(163,230,53,0.1)", border: "1px solid #a3e635" }}>
            <Users className="h-5 w-5 text-[#a3e635]" />
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* CREATE FORM */}
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.1 }} className="lg:col-span-1 space-y-5">
          <div className="p-6 space-y-5" style={cardStyle}>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] mb-2" style={{ color: "#a3e635" }}>
                // Onboarding
              </p>
              <h2 className="text-lg font-black uppercase tracking-tight" style={{ color: "var(--foreground)" }}>
                Create User
              </h2>
            </div>

            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">Full Name</label>
                <Input
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  className="rounded-none border-2 h-10 px-3 bg-transparent text-[13px] transition-colors focus-visible:ring-0 focus-visible:border-[#a3e635]"
                  style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
                  placeholder="e.g. John Doe"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">Username</label>
                <Input
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="rounded-none border-2 h-10 px-3 bg-transparent text-[13px] transition-colors focus-visible:ring-0 focus-visible:border-[#a3e635]"
                  style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
                  placeholder="e.g. jdoe"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">Password</label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="rounded-none border-2 h-10 px-3 bg-transparent text-[13px] transition-colors focus-visible:ring-0 focus-visible:border-[#a3e635]"
                  style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
                  placeholder="••••••••"
                />
              </div>
              {user?.role === "Admin" && (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">Branch</label>
                  <Select value={newBranchId} onValueChange={setNewBranchId}>
                    <SelectTrigger
                      className="w-full rounded-none border-2 h-10 bg-transparent text-[13px] transition-colors focus-visible:ring-0 focus-visible:border-[#a3e635]"
                      style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
                    >
                      <SelectValue placeholder="Select Branch" />
                    </SelectTrigger>
                    <SelectContent className="rounded-none border-2" style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}>
                      {branches.map(b => (
                        <SelectItem key={b.id} value={b.id.toString()}>
                          {b.name} ({b.branch_code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {user?.role === "Admin" && (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">Role</label>
                  <Select value={newRole} onValueChange={setNewRole}>
                    <SelectTrigger
                      className="w-full rounded-none border-2 h-10 bg-transparent text-[13px] transition-colors focus-visible:ring-0 focus-visible:border-[#a3e635]"
                      style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
                    >
                      <SelectValue placeholder="Select Role" />
                    </SelectTrigger>
                    <SelectContent className="rounded-none border-2" style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}>
                      <SelectItem value="Investigator">Investigator</SelectItem>
                      <SelectItem value="Branch Manager">Branch Manager</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button
                disabled={createLoading || !newUsername || !newPassword || !newFullName || (user?.role === "Admin" && !newBranchId)}
                onClick={handleCreate}
                className="w-full h-11 rounded-none text-[11px] font-black uppercase tracking-widest mt-2 transition-all hover:brightness-110"
                style={{
                  backgroundColor: "#a3e635",
                  color: "#130537",
                  border: "1px solid #a3e635",
                  boxShadow: "3px 3px 0px #a3e635"
                }}
              >
                {createLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Account"}
              </Button>
            </div>
          </div>
        </motion.div>

        {/* INVESTIGATORS LIST */}
        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.15 }} className="lg:col-span-2">
          <div className="p-0 overflow-hidden h-full flex flex-col" style={cardStyle}>
            <div className="p-5 border-b-[2px] border-[var(--border)] flex items-center justify-between bg-[var(--background)]">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] mb-1" style={{ color: "#a3e635" }}>
                  // Directory
                </p>
                <h2 className="text-lg font-black uppercase tracking-tight" style={{ color: "var(--foreground)" }}>
                  Active Users
                </h2>
              </div>
              <div className="px-3 py-1 bg-[#130537] border border-[#a3e635]">
                <p className="text-[10px] font-bold text-[#a3e635] uppercase tracking-wider">
                  Total: {investigators.length}
                </p>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto bg-[var(--card)] p-5">
              {loading ? (
                <div className="flex justify-center items-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin text-[var(--muted-foreground)]" />
                </div>
              ) : investigators.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-[var(--border)] text-[var(--muted-foreground)]">
                  <User className="h-8 w-8 mb-3 opacity-20" />
                  <p className="text-xs uppercase tracking-widest font-bold">No users found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {investigators.map((inv) => (
                    <div key={inv.id} className="p-4 border-2 border-[var(--border)] bg-[var(--background)] flex items-start gap-4 transition-colors hover:border-[rgba(163,230,53,0.3)]">
                      <div className="h-10 w-10 bg-[#130537] flex items-center justify-center border border-[#a3e635] flex-shrink-0">
                        <Shield className="h-4 w-4 text-[#a3e635]" />
                      </div>
                      <div className="overflow-hidden flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-[var(--foreground)] truncate">{inv.full_name}</p>
                          {inv.is_locked && (
                            <span className="px-1.5 py-0.5 bg-red-500/20 text-red-500 border border-red-500 text-[9px] uppercase font-bold tracking-widest flex items-center gap-1">
                              <Lock className="h-2 w-2" /> Locked
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] font-mono text-[var(--muted-foreground)] mt-1">@{inv.username}</p>
                        <div className="mt-3 inline-flex px-2 py-0.5 bg-[rgba(163,230,53,0.1)] border border-[#a3e635]">
                          <p className="text-[9px] uppercase font-bold text-[#a3e635] tracking-widest">{inv.role || "Investigator"}</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        {inv.is_locked && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUnlock(inv.id)}
                            className="text-[10px] uppercase font-bold tracking-widest text-green-500 hover:bg-green-500/10 h-7 px-2 justify-start"
                          >
                            Unlock
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedInvestigator({ id: inv.id, username: inv.username });
                            setPasswordModalOpen(true);
                          }}
                          className="text-[10px] uppercase font-bold tracking-widest text-[#a3e635] hover:bg-[#a3e635]/10 h-7 px-2 justify-start"
                        >
                          Password
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedInvestigator({ id: inv.id, username: inv.username });
                            setDeleteModalOpen(true);
                          }}
                          className="text-[10px] uppercase font-bold tracking-widest text-red-500 hover:bg-red-500/10 h-7 px-2 justify-start"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* PASSWORD CHANGE MODAL */}
      <Dialog open={passwordModalOpen} onOpenChange={setPasswordModalOpen}>
        <DialogContent
          className="rounded-none p-0 overflow-hidden"
          style={{
            backgroundColor: "#1A1F27",
            border: `1px solid #2A2F35`,
            boxShadow: "0px 10px 40px rgba(0,0,0,0.5)"
          }}
        >
          <DialogHeader className="px-6 pt-6 pb-4" style={{ borderBottom: "1px solid #2A2F35" }}>
            <DialogTitle className="text-lg font-black uppercase tracking-widest" style={{ color: "#a3e635" }}>
              Update Password
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-5">
            <p className="text-sm text-[var(--muted-foreground)]">
              Enter a new password for <strong>{selectedInvestigator?.username}</strong>.
            </p>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(163,230,53,0.55)" }}>New Password</label>
              <Input
                type="password"
                value={updatePasswordValue}
                onChange={(e) => setUpdatePasswordValue(e.target.value)}
                className="rounded-none border h-10 px-3 bg-transparent text-[13px] transition-colors focus-visible:ring-0 focus-visible:border-[#a3e635]"
                style={{ borderColor: "#2A2F35", color: "#E8E8E2" }}
                placeholder="••••••••"
              />
            </div>
            <Button
              disabled={updatePasswordLoading || !updatePasswordValue}
              onClick={handleUpdatePassword}
              className="w-full h-11 rounded-none text-[11px] font-black uppercase tracking-widest mt-4 transition-all hover:brightness-110"
              style={{
                backgroundColor: "#a3e635",
                color: "#130537",
                border: "1px solid #a3e635",
                boxShadow: "3px 3px 0px #a3e635"
              }}
            >
              {updatePasswordLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update Password"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION MODAL */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent
          className="rounded-none p-0 overflow-hidden max-w-sm"
          style={{
            backgroundColor: "#1A1F27",
            border: `1px solid #2A2F35`,
            boxShadow: "0px 10px 40px rgba(0,0,0,0.5)"
          }}
        >
          <DialogHeader className="px-6 pt-6 pb-4" style={{ borderBottom: "1px solid #2A2F35" }}>
            <DialogTitle className="text-lg font-black uppercase tracking-widest text-red-500">
              Confirm Deletion
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-5">
            <p className="text-sm text-[var(--muted-foreground)]">
              Are you sure you want to delete <strong>{selectedInvestigator?.username}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3 mt-4">
              <Button
                variant="outline"
                onClick={() => setDeleteModalOpen(false)}
                className="flex-1 rounded-none text-[11px] font-black uppercase tracking-widest transition-all"
                style={{
                  backgroundColor: "transparent",
                  color: "var(--foreground)",
                  border: "1px solid #2A2F35",
                }}
              >
                Cancel
              </Button>
              <Button
                disabled={deleteLoading}
                onClick={handleDelete}
                className="flex-1 rounded-none text-[11px] font-black uppercase tracking-widest transition-all hover:brightness-110"
                style={{
                  backgroundColor: "#EF4444",
                  color: "#ffffff",
                  border: "1px solid #EF4444",
                  boxShadow: "3px 3px 0px #991B1B"
                }}
              >
                {deleteLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
