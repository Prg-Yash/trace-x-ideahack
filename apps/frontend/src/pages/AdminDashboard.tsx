import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Building2, Globe2, MapPin, Loader2, BarChart3, Users, Settings, LogOut } from "lucide-react";
import { fetchBranches } from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { SettingsModal } from "@/components/auth/SettingsModal";

interface AdminDashboardProps {
  onSelectBranch: (branchCode: string | null) => void;
}

const cardStyle = {
  backgroundColor: "var(--card)",
  border: "2px solid var(--border)",
  borderRadius: 0,
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
      <div className="flex-1 flex flex-col items-center justify-center p-8 h-screen" style={{ backgroundColor: "var(--background)" }}>
        <Loader2 className="h-10 w-10 animate-spin text-[#a3e635] mb-4" />
        <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--muted-foreground)" }}>Loading Branch Data...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 min-h-screen" style={{ backgroundColor: "var(--background)" }}>
      {/* HEADER */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="flex items-center justify-between p-5" style={{ backgroundColor: "var(--card)", border: "2px solid var(--border)" }}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] mb-1" style={{ color: "#a3e635" }}>
              // Global Intelligence
            </p>
            <h1 className="text-2xl font-black uppercase tracking-tight" style={{ color: "var(--foreground)" }}>
              Admin Overview
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>
              Select a branch or view overall system data
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="space-y-1 w-48">
              <label className="text-[9px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">Filter by City</label>
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger
                  className="w-full rounded-none border-2 h-9 bg-transparent text-[12px] focus-visible:ring-0 focus-visible:border-[#a3e635]"
                  style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
                >
                  <SelectValue placeholder="All Cities" />
                </SelectTrigger>
                <SelectContent className="rounded-none border-2" style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}>
                  {cities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city === "ALL" ? "All Cities" : city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="h-12 flex items-center justify-center space-x-2">
              <button
                onClick={() => setSettingsOpen(true)}
                className="h-12 w-12 flex items-center justify-center transition-colors border border-transparent hover:border-[#a3e635] hover:bg-[#a3e635]/10"
              >
                <Settings className="h-5 w-5 text-[var(--muted-foreground)] hover:text-[#a3e635]" />
              </button>
              <button
                onClick={logout}
                className="h-12 w-12 flex items-center justify-center transition-colors border border-transparent hover:border-red-500 hover:bg-red-500/10"
              >
                <LogOut className="h-5 w-5 text-[var(--muted-foreground)] hover:text-red-500" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} user={user} />

      {/* OVERALL BLOCK */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }} 
        animate={{ opacity: 1, scale: 1 }} 
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div 
          onClick={() => onSelectBranch(null)}
          className="p-6 flex items-center justify-between hover:bg-white/5 border-[#a3e635] shadow-[4px_4px_0px_#a3e635] hover:shadow-[6px_6px_0px_#a3e635]" 
          style={cardStyle}
        >
          <div className="flex items-center gap-5">
            <div className="h-14 w-14 flex items-center justify-center" style={{ backgroundColor: "rgba(163,230,53,0.15)", border: "2px solid #a3e635" }}>
              <BarChart3 className="h-7 w-7 text-[#a3e635]" />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight text-[var(--foreground)]">Overall System Data</h2>
              <p className="text-[12px] font-bold tracking-wider text-[var(--muted-foreground)] mt-1 uppercase">Global View across all regions</p>
            </div>
          </div>
          <div className="hidden sm:block text-right">
            <p className="text-[24px] font-black text-[#a3e635]">{branches.length}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">Total Branches</p>
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
            className="group p-5 hover:bg-white/5 hover:border-[#a3e635] flex flex-col justify-between"
            style={cardStyle}
          >
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
                  <Building2 className="h-5 w-5 text-gray-400 group-hover:text-[#a3e635] transition-colors" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-[var(--foreground)] leading-tight">{branch.name}</h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#a3e635] mt-1">{branch.branch_code}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between mt-auto pt-4" style={{ borderTop: "1px solid var(--border)" }}>
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
                <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">{branch.city}</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#a3e635] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                View Data &rarr;
              </span>
            </div>
          </motion.div>
        ))}

        {filteredBranches.length === 0 && (
          <div className="col-span-full h-48 flex flex-col items-center justify-center" style={{ border: "2px dashed var(--border)" }}>
            <Building2 className="h-8 w-8 text-[var(--muted-foreground)] mb-3 opacity-50" />
            <p className="text-[12px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">No branches found in {selectedCity}</p>
          </div>
        )}
      </div>
    </div>
  );
}
