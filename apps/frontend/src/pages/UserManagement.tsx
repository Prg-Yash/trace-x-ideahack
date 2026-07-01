import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { User, Shield, Users, Loader2, Lock, Search, Plus, KeyRound, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { fetchInvestigators, createInvestigator, updateInvestigatorPassword, deleteInvestigator, fetchBranches, unlockInvestigator, updateInvestigator } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const cardStyle: React.CSSProperties = {
  backgroundColor: "var(--color-card)",
  border: "2px solid var(--color-border)",
  borderRadius: 0,
  boxShadow: "6px 6px 0px var(--color-border)",
};

export default function UserManagement() {
  const [investigators, setInvestigators] = useState<{id: string; username: string; full_name: string; role?: string; is_locked?: boolean}[]>([]);
  const [loading, setLoading] = useState(true);

  // Search filter
  const [searchQuery, setSearchQuery] = useState("");

  // Create Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
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

  // Edit states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editUserData, setEditUserData] = useState<any>({});

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
    if (!newUsername || !newEmail || !newPassword || !newFullName) return;
    
    setCreateLoading(true);
    try {
      await createInvestigator({ 
        username: newUsername, 
        email: newEmail,
        password: newPassword, 
        full_name: newFullName,
        branch_id: newBranchId ? parseInt(newBranchId) : undefined,
        role: newRole
      });
      toast.success("User created successfully!");
      setNewUsername("");
      setNewEmail("");
      setNewPassword("");
      setNewFullName("");
      setNewBranchId("");
      setNewRole("Investigator");
      setCreateModalOpen(false);
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

  const handleEdit = (userToEdit: any) => {
    setSelectedInvestigator(userToEdit);
    setEditUserData({
      username: userToEdit.username || "",
      full_name: userToEdit.full_name || "",
      email: userToEdit.email || "",
      role: userToEdit.role || "",
      branch_id: userToEdit.branch_id ? userToEdit.branch_id.toString() : "",
      is_active: userToEdit.is_active !== false,
      password: ""
    });
    setEditModalOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedInvestigator) return;
    
    setEditLoading(true);
    try {
      const payload: any = { ...editUserData };
      if (payload.branch_id) payload.branch_id = parseInt(payload.branch_id);
      else delete payload.branch_id;
      if (!payload.password) delete payload.password;
      
      await updateInvestigator(selectedInvestigator.id, payload);
      toast.success("User updated successfully!");
      setEditModalOpen(false);
      setSelectedInvestigator(null);
      await loadInvestigators();
    } catch (err: any) {
      toast.error(err.message || "Failed to update user");
    } finally {
      setEditLoading(false);
    }
  };

  const filteredInvestigators = useMemo(() => {
    if (!searchQuery.trim()) return investigators;
    const lowerQuery = searchQuery.toLowerCase();
    return investigators.filter(inv => 
      inv.full_name.toLowerCase().includes(lowerQuery) || 
      inv.username.toLowerCase().includes(lowerQuery) ||
      (inv.role && inv.role.toLowerCase().includes(lowerQuery))
    );
  }, [searchQuery, investigators]);

  return (
    <div className="min-h-screen p-6 md:p-8 lg:p-10 pb-20 bg-background text-foreground">
      <div className="mx-auto max-w-7xl space-y-6">
        
        {/* ── HEADER ── */}
        <motion.header 
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="p-6 md:p-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between" 
          style={cardStyle}
        >
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center border-2 border-border bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] mb-1 text-primary">
                // System Administration
              </p>
              <h1 className="text-2xl font-black uppercase tracking-tight text-foreground">
                User Management
              </h1>
              <p className="mt-1 max-w-2xl text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground">
                Manage system access and onboard new FIU investigators
              </p>
            </div>
          </div>
        </motion.header>

        {/* ── TOOLBAR ── */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="flex flex-col md:flex-row gap-4 items-center justify-between"
        >
          <div className="relative w-full md:w-96 flex-shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="SEARCH BY NAME OR USERNAME..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 rounded-none border-2 border-border bg-card font-mono text-xs uppercase tracking-widest focus-visible:ring-0 focus-visible:border-primary text-foreground"
            />
          </div>
          
          <Button 
            onClick={() => setCreateModalOpen(true)}
            className="w-full md:w-auto h-12 rounded-none text-xs font-black uppercase tracking-widest px-6 bg-primary text-primary-foreground hover:brightness-110"
          >
            <Plus className="mr-2 h-4 w-4" /> Add User
          </Button>
        </motion.div>

        {/* ── TABLE ── */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          style={cardStyle}
          className="overflow-hidden"
        >
          <div className="p-4 border-b-2 border-border bg-muted/50 flex justify-between items-center">
             <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-foreground">
                // Directory
              </p>
              <div className="px-3 py-1 bg-transparent border-2 border-primary">
                <p className="text-[10px] font-black text-foreground uppercase tracking-wider">
                  Total: {filteredInvestigators.length}
                </p>
              </div>
          </div>
          
          <div className="overflow-auto max-h-[calc(100vh-280px)] min-h-[400px]">
            <table className="w-full text-left border-collapse relative">
              <thead className="sticky top-0 z-10">
                <tr className="border-b-2 border-border bg-card">
                  <th className="p-4 text-xs font-bold uppercase tracking-widest text-foreground w-20 text-center">Status</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-widest text-foreground text-left">User Details</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-widest text-foreground text-left w-48">Role</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-widest text-foreground text-right w-64">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="p-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                         <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
                         <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Loading Users...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredInvestigators.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-12 text-center border-b border-border bg-muted/5">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <Users className="h-8 w-8 mb-3 opacity-20" />
                        <p className="text-[10px] uppercase tracking-widest font-bold">No users found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredInvestigators.map((inv) => (
                    <tr key={inv.id} className="border-b-2 border-border/50 bg-background transition-colors hover:bg-primary/5">
                      <td className="p-4 align-middle text-center">
                         {inv.is_locked ? (
                           <div className="mx-auto h-8 w-8 flex items-center justify-center border-2 border-destructive bg-destructive/10">
                              <Lock className="h-4 w-4 text-destructive" />
                           </div>
                         ) : (
                           <div className="mx-auto h-8 w-8 flex items-center justify-center border-2 border-primary bg-primary/10">
                              <Shield className="h-4 w-4 text-primary" />
                           </div>
                         )}
                      </td>
                      <td className="p-4 align-middle">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-foreground uppercase tracking-wider">{inv.full_name}</span>
                          <span className="text-[10px] font-mono font-bold text-foreground/70 mt-0.5">@{inv.username}</span>
                        </div>
                      </td>
                      <td className="p-4 align-middle">
                        <div className="inline-flex px-2 py-0.5 bg-transparent border-2 border-primary">
                          <p className="text-[9px] uppercase font-black text-foreground tracking-widest">{inv.role || "Investigator"}</p>
                        </div>
                      </td>
                      <td className="p-4 align-middle">
                        <div className="flex items-center justify-end gap-2">
                          {inv.is_locked && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUnlock(inv.id)}
                              className="text-[10px] uppercase font-bold tracking-widest text-green-500 hover:text-green-500 hover:bg-green-500/10 h-8 px-3 border-2 border-transparent hover:border-green-500/50 rounded-none"
                            >
                              Unlock
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedInvestigator({ id: inv.id, username: inv.username });
                              setDeleteModalOpen(true);
                            }}
                            className="text-[10px] uppercase font-bold tracking-widest text-destructive hover:text-destructive hover:bg-destructive/10 h-8 px-3 border-2 border-transparent hover:border-destructive/50 rounded-none"
                            title="Delete User"
                          >
                            <Trash2 className="h-3.5 w-3.5 md:mr-2" />
                            <span className="hidden md:inline">Delete</span>
                          </Button>
                          {user?.role === "Admin" && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(inv)}
                                className="text-[10px] uppercase font-bold tracking-widest text-primary hover:text-primary hover:bg-primary/10 h-8 px-3 border-2 border-transparent hover:border-primary/50 rounded-none"
                                title="Edit User"
                              >
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedInvestigator({ id: inv.id, username: inv.username });
                                  setPasswordModalOpen(true);
                                }}
                                className="text-[10px] uppercase font-bold tracking-widest text-primary hover:text-primary hover:bg-primary/10 h-8 px-3 border-2 border-transparent hover:border-primary/50 rounded-none"
                                title="Change Password"
                              >
                                Password
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      {/* ── CREATE USER MODAL ── */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="rounded-none p-0 overflow-hidden border-2 border-border bg-card max-w-lg">
          <DialogHeader className="px-6 pt-6 pb-4 border-b-2 border-border bg-muted/50">
            <DialogTitle className="text-lg font-black uppercase tracking-widest text-foreground">
              Create New User
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-4">
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-foreground">Full Name</label>
                  <Input
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    className="rounded-none border-2 border-border h-10 px-3 bg-transparent text-[13px] transition-colors focus-visible:ring-0 focus-visible:border-primary text-foreground"
                    placeholder="e.g. John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-foreground">Username</label>
                  <Input
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="rounded-none border-2 border-border h-10 px-3 bg-transparent text-[13px] transition-colors focus-visible:ring-0 focus-visible:border-primary text-foreground"
                    placeholder="e.g. jdoe"
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-foreground">Email Address</label>
                  <Input 
                    type="email"
                    value={newEmail} onChange={e => setNewEmail(e.target.value)}
                    className="rounded-none border-2 border-border h-10 bg-transparent text-[13px] transition-colors focus-visible:ring-0 focus-visible:border-primary text-foreground"
                    placeholder="jdoe@trace-x.com"
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-foreground">Password</label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="rounded-none border-2 border-border h-10 px-3 bg-transparent text-[13px] transition-colors focus-visible:ring-0 focus-visible:border-primary text-foreground"
                    placeholder="••••••••"
                  />
                </div>

                {user?.role === "Admin" && (
                  <div className="space-y-2 col-span-2 sm:col-span-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-foreground">Branch</label>
                    <Select value={newBranchId} onValueChange={setNewBranchId}>
                      <SelectTrigger className="w-full rounded-none border-2 border-border h-10 bg-transparent text-[13px] transition-colors focus-visible:ring-0 focus-visible:border-primary text-foreground">
                        <SelectValue placeholder="Select Branch" />
                      </SelectTrigger>
                      <SelectContent className="rounded-none border-2 border-border bg-card">
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
                  <div className="space-y-2 col-span-2 sm:col-span-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-foreground">Role</label>
                    <Select value={newRole} onValueChange={setNewRole}>
                      <SelectTrigger className="w-full rounded-none border-2 border-border h-10 bg-transparent text-[13px] transition-colors focus-visible:ring-0 focus-visible:border-primary text-foreground">
                        <SelectValue placeholder="Select Role" />
                      </SelectTrigger>
                      <SelectContent className="rounded-none border-2 border-border bg-card">
                        <SelectItem value="Investigator">Investigator</SelectItem>
                        <SelectItem value="Branch Manager">Branch Manager</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
             </div>

            <Button
              disabled={createLoading || !newUsername || !newEmail || !newPassword || !newFullName || (user?.role === "Admin" && !newBranchId)}
              onClick={handleCreate}
              className="w-full h-11 rounded-none text-[11px] font-black uppercase tracking-widest mt-6 transition-all hover:brightness-110 bg-primary text-primary-foreground"
            >
              {createLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Register Account"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── PASSWORD CHANGE MODAL ── */}
      <Dialog open={passwordModalOpen} onOpenChange={setPasswordModalOpen}>
        <DialogContent className="rounded-none p-0 overflow-hidden border-2 border-border bg-card">
          <DialogHeader className="px-6 pt-6 pb-4 border-b-2 border-border bg-muted/50">
            <DialogTitle className="text-lg font-black uppercase tracking-widest text-primary">
              Update Password
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-5">
            <p className="text-sm font-bold text-foreground">
              Enter a new password for <strong className="text-primary">@{selectedInvestigator?.username}</strong>.
            </p>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-foreground">New Password</label>
              <Input
                type="password"
                value={updatePasswordValue}
                onChange={(e) => setUpdatePasswordValue(e.target.value)}
                className="rounded-none border-2 border-border h-10 px-3 bg-transparent text-[13px] transition-colors focus-visible:ring-0 focus-visible:border-primary text-foreground"
                placeholder="••••••••"
              />
            </div>
            <Button
              disabled={updatePasswordLoading || !updatePasswordValue}
              onClick={handleUpdatePassword}
              className="w-full h-11 rounded-none text-[11px] font-black uppercase tracking-widest mt-4 transition-all hover:brightness-110 bg-primary text-primary-foreground"
            >
              {updatePasswordLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update Password"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── DELETE CONFIRMATION MODAL ── */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="rounded-none p-0 overflow-hidden max-w-sm border-2 border-border bg-card">
          <DialogHeader className="px-6 pt-6 pb-4 border-b-2 border-border bg-muted/50">
            <DialogTitle className="text-lg font-black uppercase tracking-widest text-destructive">
              Confirm Deletion
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-5">
            <p className="text-sm font-bold text-foreground">
              Are you sure you want to delete <strong className="text-primary">@{selectedInvestigator?.username}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3 mt-4">
              <Button
                variant="outline"
                onClick={() => setDeleteModalOpen(false)}
                className="flex-1 rounded-none text-[11px] font-black uppercase tracking-widest transition-all bg-transparent text-foreground border-2 border-border"
              >
                Cancel
              </Button>
              <Button
                disabled={deleteLoading}
                onClick={handleDelete}
                className="flex-1 rounded-none text-[11px] font-black uppercase tracking-widest transition-all hover:brightness-110 bg-destructive text-destructive-foreground border-none"
              >
                {deleteLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── EDIT USER MODAL ── */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="rounded-none p-0 overflow-hidden border-2 border-border bg-card max-w-lg">
          <DialogHeader className="px-6 pt-6 pb-4 border-b-2 border-border bg-muted/50">
            <DialogTitle className="text-lg font-black uppercase tracking-widest text-primary">
              Edit User: <span className="text-foreground">{selectedInvestigator?.username}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-foreground">Full Name</label>
                <Input
                  value={editUserData.full_name || ""}
                  onChange={(e) => setEditUserData({ ...editUserData, full_name: e.target.value })}
                  className="rounded-none border-2 border-border h-10 px-3 bg-transparent text-[13px] transition-colors focus-visible:ring-0 focus-visible:border-primary text-foreground"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-foreground">Username</label>
                <Input
                  value={editUserData.username || ""}
                  onChange={(e) => setEditUserData({ ...editUserData, username: e.target.value })}
                  className="rounded-none border-2 border-border h-10 px-3 bg-transparent text-[13px] transition-colors focus-visible:ring-0 focus-visible:border-primary text-foreground"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-foreground">Email Address</label>
                <Input
                  value={editUserData.email || ""}
                  onChange={(e) => setEditUserData({ ...editUserData, email: e.target.value })}
                  className="rounded-none border-2 border-border h-10 px-3 bg-transparent text-[13px] transition-colors focus-visible:ring-0 focus-visible:border-primary text-foreground"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-foreground">Role</label>
                <Select value={editUserData.role || ""} onValueChange={(val) => setEditUserData({ ...editUserData, role: val })}>
                  <SelectTrigger className="w-full rounded-none border-2 border-border h-10 bg-transparent text-[13px] transition-colors focus-visible:ring-0 focus-visible:border-primary text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-2 border-border bg-card">
                    <SelectItem value="Investigator">Investigator</SelectItem>
                    <SelectItem value="Branch Manager">Branch Manager</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-foreground">Branch</label>
                <Select value={editUserData.branch_id || ""} onValueChange={(val) => setEditUserData({ ...editUserData, branch_id: val })}>
                  <SelectTrigger className="w-full rounded-none border-2 border-border h-10 bg-transparent text-[13px] transition-colors focus-visible:ring-0 focus-visible:border-primary text-foreground">
                    <SelectValue placeholder="No Branch" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-2 border-border bg-card">
                    {branches.map(b => (
                      <SelectItem key={b.id} value={b.id.toString()}>
                        {b.name} ({b.branch_code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-foreground">Update Password</label>
                <Input
                  type="password"
                  value={editUserData.password || ""}
                  onChange={(e) => setEditUserData({ ...editUserData, password: e.target.value })}
                  placeholder="••••••••"
                  className="rounded-none border-2 border-border h-10 px-3 bg-transparent text-[13px] transition-colors focus-visible:ring-0 focus-visible:border-primary text-foreground"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setEditModalOpen(false)} className="rounded-none text-[11px] font-black uppercase tracking-widest border-2 border-border text-foreground">
                Cancel
              </Button>
              <Button onClick={handleUpdateUser} disabled={editLoading} className="rounded-none text-[11px] font-black uppercase tracking-widest hover:brightness-110 bg-primary text-primary-foreground">
                {editLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
