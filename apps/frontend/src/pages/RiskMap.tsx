import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, AlertTriangle, TrendingUp, Shield, Activity,
  ChevronRight, Search, Globe2, Zap, Eye
} from "lucide-react";
import { useAlertsQuick, useBranchChannelAnalytics } from "@/hooks/useApi";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";

const cardStyle: React.CSSProperties = {
  backgroundColor: "var(--color-card)",
  border: "2px solid var(--color-border)",
  borderRadius: 0,
  boxShadow: "6px 6px 0px var(--color-border)",
};

// ── Exact real branch codes → geo coordinates (matched from DB) ───────────────
const BRANCH_GEO: Record<string, { lat: number; lng: number; city: string; state: string }> = {
  // Maharashtra
  MH042: { lat: 19.23, lng: 73.13, city: "Kalyan", state: "Maharashtra" },
  MH099: { lat: 19.06, lng: 72.87, city: "BKC Mumbai", state: "Maharashtra" },
  MH033: { lat: 18.52, lng: 73.86, city: "Pune", state: "Maharashtra" },
  MH001: { lat: 18.94, lng: 72.83, city: "Mumbai", state: "Maharashtra" },
  // Karnataka
  KA005: { lat: 12.97, lng: 77.60, city: "Bengaluru", state: "Karnataka" },
  // Tamil Nadu
  TN019: { lat: 13.06, lng: 80.27, city: "Chennai", state: "Tamil Nadu" },
  // Delhi
  DL011: { lat: 28.63, lng: 77.22, city: "Delhi", state: "Delhi" },
  DL001: { lat: 28.70, lng: 77.10, city: "Rohini", state: "Delhi" },
  // Haryana
  HR022: { lat: 28.50, lng: 77.03, city: "Gurugram", state: "Haryana" },
  // Telangana
  TS008: { lat: 17.42, lng: 78.45, city: "Hyderabad", state: "Telangana" },
  // West Bengal
  WB014: { lat: 22.58, lng: 88.42, city: "Kolkata", state: "West Bengal" },
  // Others (fallbacks if data contains more)
  GJ001: { lat: 23.02, lng: 72.57, city: "Ahmedabad", state: "Gujarat" },
  RJ001: { lat: 26.91, lng: 75.79, city: "Jaipur", state: "Rajasthan" },
  UP001: { lat: 26.85, lng: 80.95, city: "Lucknow", state: "Uttar Pradesh" },
  MP001: { lat: 23.26, lng: 77.41, city: "Bhopal", state: "Madhya Pradesh" },
  PB001: { lat: 30.73, lng: 76.78, city: "Chandigarh", state: "Punjab" },
  AP001: { lat: 17.69, lng: 83.22, city: "Visakhapatnam", state: "Andhra Pradesh" },
};

// Normalized 0–100 SVG coords. India bounding box: lat 6–37, lng 68–98
function normCoords(lat: number, lng: number) {
  const x = ((lng - 68) / (98 - 68)) * 100;
  const y = ((37 - lat) / (37 - 6)) * 100;
  return { x, y };
}

// India rough SVG outline
const INDIA_PATH = `
  M 28,8 L 33,7 L 40,9 L 47,8 L 54,11 L 62,12 L 66,11 L 71,15 L 76,13
  L 80,17 L 83,16 L 86,20 L 88,19 L 91,24 L 93,22 L 95,27 L 93,31
  L 91,35 L 88,38 L 86,42 L 84,46 L 82,50 L 79,53 L 77,57 L 74,61
  L 71,65 L 68,69 L 66,73 L 63,77 L 60,80 L 57,84 L 55,88 L 52,92
  L 50,88 L 48,83 L 46,78 L 43,74 L 41,70 L 38,65 L 35,60 L 32,55
  L 29,51 L 27,47 L 24,43 L 21,39 L 18,34 L 15,29 L 14,24 L 16,20
  L 19,16 L 22,13 L 25,10 L 28,8 Z
`;

interface BranchPoint {
  branchCode: string;
  branchName: string;
  city: string;
  state: string;
  flaggedAccounts: number;
  totalAccounts: number;
  riskScore: number;
  dominantPattern: string;
  fraudVolume: number;
  lat: number;
  lng: number;
  x: number;
  y: number;
}

const PATTERN_COLORS: Record<string, string> = {
  LAYERING: "#ef4444",
  SMURFING: "#f97316",
  ROUND_TRIP: "#a855f7",
  KYC_MISMATCH: "#eab308",
  DORMANT: "#06b6d4",
  DORMANT_ACTIVATION: "#06b6d4",
  None: "#64748b",
};

const PATTERN_LABELS: Record<string, string> = {
  LAYERING: "Layering",
  SMURFING: "Smurfing",
  ROUND_TRIP: "Round-Trip",
  KYC_MISMATCH: "KYC Mismatch",
  DORMANT: "Dormant Revival",
  DORMANT_ACTIVATION: "Dormant Revival",
};

const RISK_LEVELS = [
  { min: 80, color: "#ef4444", label: "Critical" },
  { min: 60, color: "#f97316", label: "High" },
  { min: 40, color: "#eab308", label: "Medium" },
  { min: 0, color: "#10b981", label: "Low" },
];

function getRiskColor(score: number) {
  for (const r of RISK_LEVELS) if (score >= r.min) return r.color;
  return "#10b981";
}

function getRiskLabel(score: number) {
  if (score >= 80) return "CRITICAL";
  if (score >= 60) return "HIGH";
  if (score >= 40) return "MEDIUM";
  return "LOW";
}

export default function RiskMap() {
  const { data: alertsData, loading: alertsLoading } = useAlertsQuick(200);
  const { data: branchData, loading: branchLoading } = useBranchChannelAnalytics();
  const [, navigate] = useLocation();
  const [selectedBranch, setSelectedBranch] = useState<BranchPoint | null>(null);
  const [filterPattern, setFilterPattern] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredBranch, setHoveredBranch] = useState<string | null>(null);

  // Build branch points strictly from real API data
  const branchPoints: BranchPoint[] = useMemo(() => {
    const rawBranches = branchData?.branches || [];
    
    return rawBranches
      .filter((b: any) => b.branch_code && b.branch_code !== "UNKNOWN")
      .map((b: any) => {
        const code = b.branch_code as string;
        const geo = BRANCH_GEO[code];
        
        // If we don't have exact geo for this code, skip (avoids phantom dots)
        if (!geo) return null;
        
        const { x, y } = normCoords(geo.lat, geo.lng);
        
        return {
          branchCode: code,
          branchName: b.branch_name || geo.city,
          city: geo.city,
          state: geo.state,
          flaggedAccounts: b.flagged_accounts || 0,
          totalAccounts: b.total_accounts || 1,
          riskScore: b.risk_score || 0,
          dominantPattern: b.dominant_pattern || "None",
          // API uses `flagged_volume` not `fraud_volume`
          fraudVolume: b.flagged_volume || b.fraud_volume || 0,
          lat: geo.lat,
          lng: geo.lng,
          x,
          y,
        } as BranchPoint;
      })
      .filter(Boolean) as BranchPoint[];
  }, [branchData]);

  const filteredPoints = useMemo(() => {
    return branchPoints.filter(bp => {
      const matchesPattern = filterPattern === "ALL"
        || bp.dominantPattern?.toUpperCase() === filterPattern;
      const matchesSearch = !searchQuery
        || bp.city.toLowerCase().includes(searchQuery.toLowerCase())
        || bp.state.toLowerCase().includes(searchQuery.toLowerCase())
        || bp.branchCode.toLowerCase().includes(searchQuery.toLowerCase())
        || bp.branchName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesPattern && matchesSearch;
    });
  }, [branchPoints, filterPattern, searchQuery]);

  const totalFlagged = branchPoints.reduce((a, b) => a + b.flaggedAccounts, 0);
  const totalVolume = branchPoints.reduce((a, b) => a + b.fraudVolume, 0);
  const criticalBranches = branchPoints.filter(b => b.riskScore >= 80).length;
  const topBranch = [...branchPoints].sort((a, b) => b.riskScore - a.riskScore)[0];

  // Distinct patterns across all branches for filter bar
  const activePatterns = useMemo(() => {
    const set = new Set(branchPoints.map(b => b.dominantPattern?.toUpperCase()).filter(Boolean));
    return Array.from(set).filter(p => p !== "NONE" && p !== "None");
  }, [branchPoints]);

  const loading = branchLoading && !branchData;

  if (loading) {
    return (
      <div className="p-6 space-y-4 min-h-screen">
        <Skeleton className="h-10 w-80" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-[500px]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-8 lg:p-10 pb-20 bg-background text-foreground">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* ── HEADER ── */}
        <motion.header 
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="p-6 md:p-8" 
          style={cardStyle}
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center border-2 border-border bg-primary/10">
                <Globe2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] mb-1 text-primary">
                  // Intelligence Workspace
                </p>
                <h1 className="text-2xl font-black uppercase tracking-tight text-foreground">
                  Geospatial Risk Intelligence
                </h1>
                <p className="mt-1 max-w-2xl text-xs text-muted-foreground">
                  Branch-Level Fraud Topography · India AML Network · {branchPoints.length} Branches Live
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider border border-primary/40 text-primary bg-primary/10">
              <Activity className="h-3 w-3" />
              Live Intelligence Feed
            </div>
          </div>
        </motion.header>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          {
            label: "Flagged Accounts",
            value: totalFlagged,
            sub: `across ${branchPoints.length} branches`,
            icon: AlertTriangle,
            color: "#ef4444",
            bg: "rgba(239,68,68,0.08)"
          },
          {
            label: "Critical Branches",
            value: criticalBranches,
            sub: `Risk Score ≥ 80`,
            icon: Zap,
            color: "#f97316",
            bg: "rgba(249,115,22,0.08)"
          },
          {
            label: "Fraud Volume (30d)",
            value: `₹${(totalVolume / 10_000_000).toFixed(2)}Cr`,
            sub: `${(totalVolume / 100_000).toFixed(1)}L total`,
            icon: TrendingUp,
            color: "#a855f7",
            bg: "rgba(168,85,247,0.08)"
          },
          {
            label: "Highest Risk Branch",
            value: topBranch?.city || "—",
            sub: topBranch ? `${topBranch.riskScore}/100 · ${topBranch.state}` : "No data",
            icon: MapPin,
            color: "#ef4444",
            bg: "rgba(239,68,68,0.08)"
          },
        ].map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="p-4"
            style={{ ...cardStyle, borderTop: `4px solid ${card.color}` }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-muted-foreground">{card.label}</p>
                <p className="text-2xl font-black mt-1 text-foreground">{card.value}</p>
                <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{card.sub}</p>
              </div>
              <card.icon className="h-5 w-5 opacity-60 flex-shrink-0" style={{ color: card.color }} />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* MAP PANEL */}
        <div className="xl:col-span-2 overflow-hidden" style={cardStyle}>
          
          {/* Map header + pattern filter */}
          <div className="px-4 py-3 flex flex-wrap items-center gap-2 border-b-2 border-border bg-muted/10">
            <div className="flex items-center gap-2 mr-2">
              <Globe2 className="h-4 w-4 text-primary" />
              <h2 className="text-xs font-black uppercase tracking-[0.25em] text-foreground">India Risk Map</h2>
            </div>
            <div className="flex flex-wrap gap-1.5 ml-auto">
              <button
                onClick={() => setFilterPattern("ALL")}
                className="text-[9px] font-bold uppercase px-2 py-1 transition-all"
                style={{
                  backgroundColor: filterPattern === "ALL" ? "var(--color-primary)" : "transparent",
                  color: filterPattern === "ALL" ? "var(--color-card)" : "var(--color-muted-foreground)",
                  border: "1px solid var(--color-border)",
                }}
              >
                All
              </button>
              {activePatterns.map(pat => (
                <button
                  key={pat}
                  onClick={() => setFilterPattern(filterPattern === pat ? "ALL" : pat)}
                  className="text-[9px] font-bold uppercase px-2 py-1 transition-all"
                  style={{
                    backgroundColor: filterPattern === pat
                      ? (PATTERN_COLORS[pat] || "var(--color-primary)")
                      : "transparent",
                    color: filterPattern === pat ? "var(--color-card)" : "var(--color-muted-foreground)",
                    border: `1px solid ${filterPattern === pat ? (PATTERN_COLORS[pat] || "var(--color-primary)") : "var(--color-border)"}`,
                  }}
                >
                  {(PATTERN_LABELS[pat] || pat).split(" ")[0]}
                </button>
              ))}
            </div>
          </div>

          {/* SVG India Map */}
          <div className="relative bg-muted/10" style={{ height: "460px" }}>

            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* Subtle grid */}
              {[15, 30, 45, 60, 75, 90].map(v => (
                <React.Fragment key={v}>
                  <line x1={v} y1={0} x2={v} y2={100} stroke="var(--color-border)" strokeWidth="0.1" />
                  <line x1={0} y1={v} x2={100} y2={v} stroke="var(--color-border)" strokeWidth="0.1" />
                </React.Fragment>
              ))}
              {/* India outline */}
              <path d={INDIA_PATH} fill="rgba(0,0,0,0.03)" stroke="var(--color-border)" strokeWidth="0.3" />
            </svg>

            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
              {/* Dashed links between top-risk branches */}
              {filteredPoints
                .filter(b => b.riskScore >= 65)
                .slice(0, 8)
                .map((b, i, arr) => {
                  if (i === 0) return null;
                  const prev = arr[i - 1];
                  return (
                    <line key={`link-${i}`}
                      x1={prev.x} y1={prev.y} x2={b.x} y2={b.y}
                      stroke="rgba(239,68,68,0.12)" strokeWidth="0.3" strokeDasharray="1.5,1.5"
                    />
                  );
                })}

              {filteredPoints.map((bp) => {
                const isFiltered = filterPattern !== "ALL" && bp.dominantPattern?.toUpperCase() !== filterPattern;
                const r = 1.0 + (bp.riskScore / 100) * 3.2;
                const color = getRiskColor(bp.riskScore);
                const isSelected = selectedBranch?.branchCode === bp.branchCode;
                const isHovered = hoveredBranch === bp.branchCode;
                const opacity = isFiltered ? 0.15 : 1;

                return (
                  <g key={bp.branchCode} style={{ cursor: "pointer", opacity }}
                    onClick={() => setSelectedBranch(isSelected ? null : bp)}
                    onMouseEnter={() => setHoveredBranch(bp.branchCode)}
                    onMouseLeave={() => setHoveredBranch(null)}>

                    {/* Outer pulse for critical */}
                    {bp.riskScore >= 75 && !isFiltered && (
                      <circle cx={bp.x} cy={bp.y} r={r + 2.5} fill="none" stroke={color} strokeWidth="0.3" opacity="0.3">
                        <animate attributeName="r" values={`${r + 1};${r + 5};${r + 1}`} dur="2.2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.35;0;0.35" dur="2.2s" repeatCount="indefinite" />
                      </circle>
                    )}
                    {/* Inner pulse */}
                    {bp.riskScore >= 60 && !isFiltered && (
                      <circle cx={bp.x} cy={bp.y} r={r + 1} fill="none" stroke={color} strokeWidth="0.25" opacity="0.25">
                        <animate attributeName="r" values={`${r};${r + 2.5};${r}`} dur="1.8s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.25;0;0.25" dur="1.8s" repeatCount="indefinite" />
                      </circle>
                    )}

                    {/* Main dot */}
                    <circle
                      cx={bp.x} cy={bp.y}
                      r={isSelected || isHovered ? r + 1.2 : r}
                      fill={color}
                      opacity={isSelected || isHovered ? 1 : 0.85}
                      stroke={isSelected ? "#fff" : "rgba(0,0,0,0.5)"}
                      strokeWidth={isSelected ? "0.6" : "0.2"}
                    />

                    {/* City label for high risk / hover / selected */}
                    {(!isFiltered && (bp.riskScore >= 65 || isHovered || isSelected)) && (
                      <text x={bp.x + r + 1} y={bp.y + 0.6}
                        fontSize="2.8" fill="var(--color-foreground)"
                        fontFamily="'SF Mono', monospace" fontWeight="bold">
                        {bp.city}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Legend */}
            <div className="absolute bottom-3 left-3 flex gap-4">
              {RISK_LEVELS.map(l => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: l.color }} />
                  <span className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
                    {l.label}
                  </span>
                </div>
              ))}
            </div>
            <div className="absolute bottom-3 right-3 text-[9px] font-mono text-muted-foreground">
              ● Size = Risk Score
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="flex flex-col gap-4">

          {/* Search */}
          <div className="relative" style={cardStyle}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="SEARCH CITY, BRANCH, STATE…"
              className="w-full pl-9 pr-3 py-2.5 text-xs font-mono font-bold uppercase tracking-wider bg-transparent text-foreground border-none focus:outline-none"
            />
          </div>

          {/* Branch ranking list */}
          <div className="overflow-hidden" style={{ ...cardStyle, maxHeight: "340px", overflowY: "auto" }}>
            <div className="px-4 py-2.5 border-b-2 border-border flex items-center justify-between sticky top-0 bg-muted/50">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground">Branch Ranking</span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{filteredPoints.length} SHOWN</span>
            </div>
            <div className="divide-y divide-border/40">
              {[...filteredPoints]
                .sort((a, b) => b.riskScore - a.riskScore)
                .map((bp, i) => (
                  <motion.button key={bp.branchCode}
                    whileHover={{ x: 2 }}
                    onClick={() => setSelectedBranch(selectedBranch?.branchCode === bp.branchCode ? null : bp)}
                    className="w-full text-left px-4 py-2.5 flex items-center gap-3 transition-all hover:bg-primary/5"
                    style={{
                      backgroundColor: selectedBranch?.branchCode === bp.branchCode
                        ? "var(--color-primary-5)" : "transparent",
                      borderLeft: selectedBranch?.branchCode === bp.branchCode
                        ? "3px solid var(--color-primary)" : "3px solid transparent",
                    }}
                  >
                    <span className="text-[10px] font-black font-mono text-muted-foreground w-5">#{i + 1}</span>
                    <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: getRiskColor(bp.riskScore) }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground truncate uppercase">{bp.branchName}</span>
                        <span className="text-[11px] font-black font-mono ml-2" style={{ color: getRiskColor(bp.riskScore) }}>
                          {bp.riskScore}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[9px] font-mono text-muted-foreground">{bp.state}</span>
                        <span className="text-muted-foreground text-[9px]">·</span>
                        <span className="text-[9px] font-bold uppercase tracking-wider"
                          style={{ color: PATTERN_COLORS[bp.dominantPattern?.toUpperCase?.()] || "var(--color-muted-foreground)" }}>
                          {PATTERN_LABELS[bp.dominantPattern?.toUpperCase?.() || ""] || bp.dominantPattern}
                        </span>
                        <span className="text-muted-foreground text-[9px]">·</span>
                        <span className="text-[9px] font-mono text-destructive">{bp.flaggedAccounts} flagged</span>
                      </div>
                    </div>
                    <ChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  </motion.button>
                ))}
              {filteredPoints.length === 0 && (
                <div className="px-4 py-8 text-center text-xs text-slate-400">No branches match filters</div>
              )}
            </div>
          </div>

          {/* Branch Detail Card */}
          <AnimatePresence mode="wait">
            {selectedBranch ? (
              <motion.div key={selectedBranch.branchCode}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                className="p-4 space-y-3"
                style={{ ...cardStyle, borderLeft: `4px solid ${getRiskColor(selectedBranch.riskScore)}` }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" style={{ color: getRiskColor(selectedBranch.riskScore) }} />
                      <span className="text-sm font-black text-foreground uppercase tracking-wider">{selectedBranch.branchName}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                      {selectedBranch.state} · {selectedBranch.branchCode}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black" style={{ color: getRiskColor(selectedBranch.riskScore) }}>
                      {selectedBranch.riskScore}
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: getRiskColor(selectedBranch.riskScore) }}>
                      {getRiskLabel(selectedBranch.riskScore)}
                    </div>
                  </div>
                </div>

                <div className="w-full h-1.5 bg-muted/40 overflow-hidden border border-border">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${selectedBranch.riskScore}%` }}
                    transition={{ duration: 0.5 }} className="h-full"
                    style={{ backgroundColor: getRiskColor(selectedBranch.riskScore) }} />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Flagged Accounts", value: selectedBranch.flaggedAccounts },
                    { label: "Total Accounts", value: selectedBranch.totalAccounts },
                    {
                      label: "Fraud Volume",
                      value: `₹${(selectedBranch.fraudVolume / 100_000).toFixed(1)}L`,
                      color: "var(--color-destructive)"
                    },
                    {
                      label: "Dominant Pattern",
                      value: PATTERN_LABELS[selectedBranch.dominantPattern?.toUpperCase?.() || ""] || selectedBranch.dominantPattern,
                      color: PATTERN_COLORS[selectedBranch.dominantPattern?.toUpperCase?.() || ""]
                    },
                  ].map((item) => (
                    <div key={item.label} className="space-y-0.5">
                      <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{item.label}</p>
                      <p className="text-xs font-bold uppercase tracking-wider" style={{ color: item.color || "var(--color-foreground)" }}>{item.value}</p>
                    </div>
                  ))}
                </div>

                <button onClick={() => navigate(`/branch-risk`)}
                  className="w-full flex items-center justify-center gap-2 py-2 text-[10px] font-bold uppercase tracking-wider transition-all hover:opacity-80"
                  style={{
                    border: `2px solid ${getRiskColor(selectedBranch.riskScore)}`,
                    color: getRiskColor(selectedBranch.riskScore),
                    backgroundColor: `${getRiskColor(selectedBranch.riskScore)}10`,
                  }}>
                  <Eye className="h-3 w-3" />
                  View Full Branch Analysis
                </button>
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="border-2 border-dashed border-slate-200 p-4 text-center">
                <Globe2 className="h-6 w-6 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-400">Click a dot on the map or select a branch to view details</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* BOTTOM STRIP — Per-branch fraud volume bars */}
      <div className="overflow-hidden" style={cardStyle}>
        <div className="px-4 py-3 border-b-2 border-border bg-muted/10">
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-foreground flex items-center gap-2">
            <Shield className="h-3.5 w-3.5 text-primary" />
            Branch-wise Fraud Exposure (₹ Lakhs)
          </span>
        </div>
        <div className="p-4 space-y-2.5">
          {[...branchPoints]
            .sort((a, b) => b.fraudVolume - a.fraudVolume)
            .map((bp) => {
              const maxVol = Math.max(...branchPoints.map(b => b.fraudVolume), 1);
              const pct = (bp.fraudVolume / maxVol) * 100;
              return (
                <div key={bp.branchCode} className="flex items-center gap-3 hover:bg-primary/5 transition-colors p-1">
                  <div className="w-36 text-[10px] font-bold text-foreground uppercase truncate">{bp.branchName}</div>
                  <div className="flex-1 h-2 bg-muted/40 border border-border overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, delay: 0.1 }}
                      className="h-full"
                      style={{ backgroundColor: getRiskColor(bp.riskScore) }}
                    />
                  </div>
                  <div className="w-20 text-right text-[10px] font-mono font-bold" style={{ color: getRiskColor(bp.riskScore) }}>
                    ₹{(bp.fraudVolume / 100_000).toFixed(1)}L
                  </div>
                  <div className="w-8 text-right text-[10px] font-mono text-muted-foreground">
                    {bp.riskScore}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      </div>
    </div>
  );
}
