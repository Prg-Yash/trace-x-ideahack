import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Building2, MapPin, Loader2, BarChart3, Settings, LogOut } from "lucide-react";
import { fetchBranches } from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { SettingsModal } from "@/components/auth/SettingsModal";

interface AdminDashboardProps {
  onSelectBranch: (branchCode: string | null) => void;
}

const cardStyle: React.CSSProperties = {
  backgroundColor: "var(--color-card)",
  border: "2px solid var(--color-border)",
  borderRadius: 0,
  boxShadow: "6px 6px 0px var(--color-border)",
  cursor: "pointer",
  transition: "all 0.2s",
};

export default function AdminDashboard({ onSelectBranch }: AdminDashboardProps) {
  const [branches, setBranches] = useState<{ id: number; branch_code: string; name: string; city: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState<string>("ALL");
  const { logout, user } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);

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

  const cities = useMemo(() => {
    const uniqueCities = Array.from(new Set(branches.map((b) => b.city))).sort();
    return ["ALL", ...uniqueCities];
  }, [branches]);

  const filteredBranches = useMemo(() => {
    if (selectedCity === "ALL") return branches;
    return branches.filter((b) => b.city === selectedCity);
  }, [branches, selectedCity]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 h-screen bg-background text-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Loading Branch Data...</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 lg:p-10 space-y-6 min-h-screen bg-background text-foreground pb-20">
      
      {/* HEADER */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="flex flex-col md:flex-row md:items-end justify-between p-6 md:p-8 gap-6" style={{ ...cardStyle, cursor: 'default' }}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] mb-1 text-primary">
              // Global Intelligence
            </p>
            <h1 className="text-2xl font-black uppercase tracking-tight text-foreground">
              Admin Overview
            </h1>
            <p className="mt-1 text-[10px] font-mono font-bold uppercase tracking-widest text-foreground/80">
              Select a branch or view overall system data
            </p>
          </div>
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="space-y-1 w-full md:w-48">
              <label className="text-[9px] font-bold uppercase tracking-widest text-foreground">Filter by City</label>
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger className="w-full rounded-none border-2 border-border h-10 bg-transparent text-[12px] focus-visible:ring-0 focus-visible:border-primary text-foreground font-bold uppercase tracking-wider">
                  <SelectValue placeholder="All Cities" />
                </SelectTrigger>
                <SelectContent className="rounded-none border-2 border-border bg-card">
                  {cities.map((city) => (
                    <SelectItem key={city} value={city} className="font-bold uppercase tracking-wider text-xs">
                      {city === "ALL" ? "All Cities" : city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="h-10 flex items-center justify-center space-x-2 md:mt-4">
              <button
                onClick={() => setSettingsOpen(true)}
                className="h-10 w-10 flex items-center justify-center transition-colors border-2 border-transparent hover:border-primary hover:bg-primary/10"
              >
                <Settings className="h-4 w-4 text-muted-foreground hover:text-primary" />
              </button>
              <button
                onClick={logout}
                className="h-10 w-10 flex items-center justify-center transition-colors border-2 border-transparent hover:border-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4 text-muted-foreground hover:text-destructive" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
      
      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} user={user} />

      {/* OVERALL BLOCK */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div 
          onClick={() => onSelectBranch(null)}
          className="p-6 md:p-8 flex items-center justify-between hover:bg-primary/5 group" 
          style={cardStyle}
        >
          <div className="flex items-center gap-5">
            <div className="h-14 w-14 flex items-center justify-center bg-transparent border-2 border-primary group-hover:bg-primary/10 transition-colors">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight text-foreground">Overall System Data</h2>
              <p className="text-[10px] font-mono font-bold tracking-widest text-foreground/80 mt-1 uppercase">Global View across all regions</p>
            </div>
          </div>
          <div className="hidden sm:block text-right">
            <p className="text-3xl font-black text-foreground">{branches.length}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-foreground mt-1">Total Branches</p>
          </div>
        </div>
      </motion.div>

      {/* BRANCH BLOCKS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
        {filteredBranches.map((branch, idx) => (
          <motion.div
            key={branch.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.15 + idx * 0.05 }}
            onClick={() => onSelectBranch(branch.branch_code)}
            className="group p-6 flex flex-col justify-between hover:bg-primary/5"
            style={cardStyle}
          >
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 flex items-center justify-center bg-primary/10 border-2 border-transparent group-hover:border-primary transition-all">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-[14px] font-black text-foreground uppercase tracking-wider leading-tight">{branch.name}</h3>
                  <p className="text-[10px] font-mono font-bold tracking-widest text-foreground/80 mt-1">@{branch.branch_code}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between mt-auto pt-4 border-t-2 border-border/50 group-hover:border-primary/30 transition-colors">
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-foreground group-hover:text-primary transition-colors" />
                <span className="text-[10px] font-black uppercase tracking-widest text-foreground">{branch.city}</span>
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                View Data &rarr;
              </span>
            </div>
          </motion.div>
        ))}

        {filteredBranches.length === 0 && (
          <div className="col-span-full h-48 flex flex-col items-center justify-center border-2 border-dashed border-border bg-card">
            <Building2 className="h-8 w-8 text-muted-foreground mb-3 opacity-50" />
            <p className="text-[11px] font-bold uppercase tracking-widest text-foreground">No branches found in {selectedCity}</p>
          </div>
        )}
      </div>
    </div>
  );
}
