import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Building2, Loader2, Plus, Edit2, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { fetchBranches, createBranch, updateBranch, deleteBranch } from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CITIES = [
  "Mumbai",
  "Delhi",
  "Bangalore",
  "Hyderabad",
  "Chennai",
  "Kolkata",
  "Pune",
  "Ahmedabad",
  "Jaipur",
  "Surat"
];

const cardStyle = {
  backgroundColor: "var(--card)",
  border: "2px solid var(--border)",
  borderRadius: 0,
};

export default function Branches() {
  const [branches, setBranches] = useState<{id: number; branch_code: string; name: string; city: string; created_at: string}[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [newCity, setNewCity] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  useEffect(() => {
    loadBranches();
  }, []);

  const loadBranches = async () => {
    try {
      setLoading(true);
      const data = await fetchBranches();
      setBranches(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load branches");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newCode || !newName || !newCity) return;
    
    setCreateLoading(true);
    try {
      await createBranch({ branch_code: newCode, name: newName, city: newCity });
      toast.success("Branch created successfully!");
      setNewCode("");
      setNewName("");
      setNewCity("");
      await loadBranches();
    } catch (err: any) {
      toast.error(err.message || "Failed to create branch");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this branch?")) return;
    
    try {
      await deleteBranch(id);
      toast.success("Branch deleted successfully!");
      await loadBranches();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete branch");
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
              Branch Management
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>
              Manage bank branches and regional offices
            </p>
          </div>
          <div className="h-12 w-12 flex items-center justify-center" style={{ backgroundColor: "rgba(163,230,53,0.1)", border: "1px solid #a3e635" }}>
            <Building2 className="h-5 w-5 text-[#a3e635]" />
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* CREATE FORM */}
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.1 }} className="lg:col-span-1 space-y-5">
          <div className="p-6 space-y-5" style={cardStyle}>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] mb-2" style={{ color: "#a3e635" }}>
                // New Entity
              </p>
              <h2 className="text-lg font-black uppercase tracking-tight" style={{ color: "var(--foreground)" }}>
                Add Branch
              </h2>
            </div>

            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">Branch Code</label>
                <Input
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  className="rounded-none border-2 h-10 px-3 bg-transparent text-[13px] transition-colors focus-visible:ring-0 focus-visible:border-[#a3e635] uppercase"
                  style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
                  placeholder="e.g. MH001"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">Branch Name</label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="rounded-none border-2 h-10 px-3 bg-transparent text-[13px] transition-colors focus-visible:ring-0 focus-visible:border-[#a3e635]"
                  style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
                  placeholder="e.g. Mumbai HQ"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">City</label>
                <Select value={newCity} onValueChange={setNewCity}>
                  <SelectTrigger
                    className="w-full rounded-none border-2 h-10 bg-transparent text-[13px] transition-colors focus-visible:ring-0 focus-visible:border-[#a3e635]"
                    style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
                  >
                    <SelectValue placeholder="Select City" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-2" style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}>
                    {CITIES.map(city => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                disabled={createLoading || !newCode || !newName || !newCity}
                onClick={handleCreate}
                className="w-full h-11 rounded-none text-[11px] font-black uppercase tracking-widest mt-2 transition-all hover:brightness-110"
                style={{
                  backgroundColor: "#a3e635",
                  color: "#130537",
                }}
              >
                {createLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Register Branch
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>

        {/* LIST */}
        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.2 }} className="lg:col-span-2">
          <div className="p-6" style={cardStyle}>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] mb-2" style={{ color: "#a3e635" }}>
                  // Directory
                </p>
                <h2 className="text-lg font-black uppercase tracking-tight" style={{ color: "var(--foreground)" }}>
                  Active Branches
                </h2>
              </div>
            </div>

            {loading ? (
              <div className="h-64 flex flex-col items-center justify-center text-[var(--muted-foreground)]">
                <Loader2 className="h-8 w-8 animate-spin mb-4 text-[#a3e635]" />
                <p className="text-[11px] font-bold uppercase tracking-widest">Loading branches...</p>
              </div>
            ) : branches.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-[var(--muted-foreground)] border-2 border-dashed" style={{ borderColor: "var(--border)" }}>
                <Building2 className="h-8 w-8 mb-4 opacity-50" />
                <p className="text-[11px] font-bold uppercase tracking-widest">No branches found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {branches.map((branch) => (
                  <div
                    key={branch.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-2 transition-colors hover:bg-white/5"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <div className="flex items-center gap-4 mb-4 sm:mb-0">
                      <div className="h-10 w-10 flex flex-shrink-0 items-center justify-center" style={{ backgroundColor: "rgba(163,230,53,0.1)" }}>
                        <Building2 className="h-5 w-5 text-[#a3e635]" />
                      </div>
                      <div>
                        <p className="text-[14px] font-bold text-[var(--foreground)]">{branch.name}</p>
                        <div className="flex gap-3 mt-1">
                          <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
                            CODE: <span className="text-[#a3e635]">{branch.branch_code}</span>
                          </p>
                          <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
                            CITY: <span className="text-white/80">{branch.city}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleDelete(branch.id)}
                        variant="ghost"
                        size="sm"
                        className="rounded-none text-red-500 hover:text-red-400 hover:bg-red-500/10 h-8 px-3"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
