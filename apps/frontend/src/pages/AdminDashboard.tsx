import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Building2, MapPin, Loader2, BarChart3, Settings, LogOut, Search } from "lucide-react";
import { fetchBranches } from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
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
  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
};

export default function AdminDashboard({ onSelectBranch }: AdminDashboardProps) {
  const [branches, setBranches] = useState<{ id: number; branch_code: string; name: string; city: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
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
    let result = branches;
    if (selectedCity !== "ALL") {
      result = result.filter((b) => b.city === selectedCity);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(b => b.name.toLowerCase().includes(q) || b.branch_code.toLowerCase().includes(q));
    }
    return result;
  }, [branches, selectedCity, searchQuery]);

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
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] mb-2 text-primary flex items-center gap-2">
              <span className="h-1.5 w-1.5 bg-primary inline-block" /> Global Intelligence
            </p>
            <h1 className="text-3xl font-black uppercase tracking-tight text-foreground leading-none">
              Admin Overview
            </h1>
            <p className="mt-2 text-[11px] font-mono font-bold uppercase tracking-widest text-foreground/60">
              Select a branch or view overall system data
            </p>
          </div>
          <div className="flex flex-col md:flex-row md:items-end gap-4 w-full md:w-auto">
            <div className="space-y-1.5 w-full md:w-56">
              <label className="text-[9px] font-bold uppercase tracking-widest text-foreground/80">Search Branch</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground/50" />
                <Input 
                  placeholder="Code or Name..." 
                  className="pl-9 h-10 w-full rounded-none border-2 border-border bg-card text-[11px] font-bold uppercase tracking-wider focus-visible:ring-0 focus-visible:border-primary placeholder:text-foreground/30"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5 w-full md:w-48">
              <label className="text-[9px] font-bold uppercase tracking-widest text-foreground/80">Filter by City</label>
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger className="w-full rounded-none border-2 border-border h-10 bg-card text-[11px] focus-visible:ring-0 focus-visible:border-primary text-foreground font-bold uppercase tracking-wider">
                  <SelectValue placeholder="All Cities" />
                </SelectTrigger>
                <SelectContent className="rounded-none border-2 border-border bg-card">
                  {cities.map((city) => (
                    <SelectItem key={city} value={city} className="font-bold uppercase tracking-wider text-[11px]">
                      {city === "ALL" ? "All Cities" : city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="h-10 flex items-center justify-center space-x-2">
              <button
                onClick={() => setSettingsOpen(true)}
                className="h-10 w-10 flex items-center justify-center transition-colors border-2 border-border bg-card hover:border-primary hover:bg-primary/10"
              >
                <Settings className="h-4 w-4 text-foreground/80 hover:text-primary" />
              </button>
              <button
                onClick={logout}
                className="h-10 w-10 flex items-center justify-center transition-colors border-2 border-border bg-card hover:border-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4 text-foreground/80 hover:text-destructive" />
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
          className="p-6 md:p-8 flex items-center justify-between hover:bg-primary/5 group mt-8 relative overflow-hidden" 
          style={{ ...cardStyle, borderLeft: "4px solid var(--color-primary)" }}
        >
          {/* Subtle background glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          
          <div className="flex items-center gap-6 relative z-10">
            <div className="h-16 w-16 flex items-center justify-center bg-card border-2 border-primary group-hover:scale-105 transition-transform duration-300 shadow-[4px_4px_0px_rgba(163,230,53,0.3)] group-hover:shadow-[4px_4px_0px_rgba(163,230,53,1)]">
              <BarChart3 className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-foreground group-hover:text-primary transition-colors">Overall System Data</h2>
              <p className="text-[11px] font-mono font-bold tracking-widest text-foreground/60 mt-1 uppercase">Global View across all regions</p>
            </div>
          </div>
          <div className="hidden sm:block text-right relative z-10">
            <p className="text-4xl font-black text-foreground group-hover:text-primary transition-colors">{branches.length}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/80 mt-1">Total Branches</p>
          </div>
        </div>
      </motion.div>

      {/* BRANCH BLOCKS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
        {filteredBranches.map((branch, idx) => (
          <motion.div
            key={branch.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.15 + (idx % 10) * 0.05 }}
            onClick={() => onSelectBranch(branch.branch_code)}
            className="group p-6 flex flex-col justify-between hover:bg-primary/5 relative overflow-hidden"
            style={cardStyle}
          >
            <div className="flex justify-between items-start mb-8 relative z-10">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 mt-0.5 flex-shrink-0 flex items-center justify-center bg-card border-2 border-border group-hover:border-primary group-hover:bg-primary/10 transition-all duration-300">
                  <Building2 className="h-5 w-5 text-foreground/70 group-hover:text-primary transition-colors" />
                </div>
                <div>
                  <h3 className="text-[14px] font-black text-foreground uppercase tracking-wider leading-tight group-hover:text-primary transition-colors">{branch.name}</h3>
                  <p className="text-[10px] font-mono font-bold tracking-widest text-foreground/60 mt-1.5 group-hover:text-foreground/80 transition-colors">@{branch.branch_code}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between mt-auto pt-5 border-t-2 border-border group-hover:border-primary/50 transition-colors relative z-10">
              <div className="flex items-center gap-2.5">
                <div className="h-6 w-6 rounded-none bg-card border-2 border-border flex items-center justify-center group-hover:border-primary group-hover:bg-primary/10 transition-colors">
                  <MapPin className="h-3 w-3 text-foreground/70 group-hover:text-primary transition-colors" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-foreground/80 group-hover:text-foreground transition-colors">{branch.city}</span>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-primary opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center gap-1.5 transform translate-x-2 group-hover:translate-x-0">
                VIEW <span className="text-[14px] leading-none">&rarr;</span>
              </span>
            </div>
          </motion.div>
        ))}

        {filteredBranches.length === 0 && (
          <div className="col-span-full h-48 flex flex-col items-center justify-center border-2 border-dashed border-border bg-card">
            <Building2 className="h-8 w-8 text-foreground/30 mb-3" />
            <p className="text-[11px] font-bold uppercase tracking-widest text-foreground/70">No branches found matching your criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}
