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

const cardStyle: React.CSSProperties = {
  backgroundColor: "var(--color-card)",
  border: "2px solid var(--color-border)",
  borderRadius: 0,
  boxShadow: "6px 6px 0px var(--color-border)",
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
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] mb-1 text-primary">
              // System Administration
            </p>
            <h1 className="text-2xl font-black uppercase tracking-tight text-foreground">
              Branch Management
            </h1>
            <p className="mt-1 max-w-2xl text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground">
              Directory of all active regional offices and bank branches
            </p>
          </div>
        </div>
      </motion.header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CREATE FORM */}
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.1 }} className="lg:col-span-1 space-y-6">
          <div className="p-6 space-y-5" style={cardStyle}>
            <div className="border-b-2 border-border pb-4 mb-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] mb-2 text-primary">
                // New Entity
              </p>
              <h2 className="text-lg font-black uppercase tracking-tight text-foreground">
                Add Branch
              </h2>
            </div>

            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Branch Code</label>
                <Input
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  className="rounded-none border-2 border-border h-10 px-3 bg-transparent text-[13px] transition-colors focus-visible:ring-0 focus-visible:border-primary uppercase text-foreground"
                  placeholder="e.g. MH001"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Branch Name</label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="rounded-none border-2 border-border h-10 px-3 bg-transparent text-[13px] transition-colors focus-visible:ring-0 focus-visible:border-primary text-foreground"
                  placeholder="e.g. Mumbai HQ"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">City</label>
                <Select value={newCity} onValueChange={setNewCity}>
                  <SelectTrigger className="w-full rounded-none border-2 border-border h-10 bg-transparent text-[13px] transition-colors focus-visible:ring-0 focus-visible:border-primary text-foreground">
                    <SelectValue placeholder="Select City" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-2 border-border bg-card">
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
                className="w-full h-11 rounded-none text-[11px] font-black uppercase tracking-widest mt-4 transition-all hover:brightness-110 bg-primary text-primary-foreground"
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
            <div className="mb-6 flex items-center justify-between border-b-2 border-border pb-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] mb-2 text-primary">
                  // Directory
                </p>
                <h2 className="text-lg font-black uppercase tracking-tight text-foreground">
                  Active Branches
                </h2>
              </div>
            </div>

            {loading ? (
              <div className="h-64 flex flex-col items-center justify-center text-muted-foreground bg-muted/10 border-2 border-border">
                <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
                <p className="text-[11px] font-bold uppercase tracking-widest">Loading branches...</p>
              </div>
            ) : branches.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-border bg-muted/5">
                <Building2 className="h-8 w-8 mb-4 opacity-50" />
                <p className="text-[11px] font-bold uppercase tracking-widest">No branches found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {branches.map((branch) => (
                  <div
                    key={branch.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-2 border-border transition-colors hover:bg-primary/5 bg-muted/5"
                  >
                    <div className="flex items-center gap-4 mb-4 sm:mb-0">
                      <div className="h-10 w-10 flex flex-shrink-0 items-center justify-center bg-primary/10 border border-border">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-[14px] font-bold text-foreground">{branch.name}</p>
                        <div className="flex gap-3 mt-1">
                          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                            CODE: <span className="text-primary">{branch.branch_code}</span>
                          </p>
                          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                            CITY: <span className="text-foreground">{branch.city}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleDelete(branch.id)}
                        variant="ghost"
                        size="sm"
                        className="rounded-none text-destructive hover:text-destructive hover:bg-destructive/10 h-8 px-3 border border-transparent hover:border-destructive"
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
    </div>
  );
}
