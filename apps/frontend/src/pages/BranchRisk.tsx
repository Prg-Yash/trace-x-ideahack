import React from "react";
import { motion } from "framer-motion";
import { Activity, Building2, MapPin, Network, Shield, TrendingUp } from "lucide-react";
import { useBranchChannelAnalytics } from "@/hooks/useApi";
import { Skeleton } from "@/components/ui/skeleton";

const cardStyle: React.CSSProperties = {
  backgroundColor: "var(--color-card)",
  border: "2px solid var(--color-border)",
  borderRadius: 0,
  boxShadow: "6px 6px 0px var(--color-border)",
};

function getRiskTone(score: number) {
  if (score >= 80) return { label: "Critical", text: "text-red-500 font-bold", accent: "#ef4444", bar: "bg-red-500" };
  if (score >= 60) return { label: "Elevated", text: "text-amber-500 font-bold", accent: "#f59e0b", bar: "bg-amber-500" };
  return { label: "Managed", text: "text-emerald-500 font-bold", accent: "#10b981", bar: "bg-emerald-500" };
}

export default function BranchRisk() {
  const { data, loading } = useBranchChannelAnalytics();

  if (loading && !data) {
    return (
      <div className="min-h-screen p-6 md:p-8 lg:p-10">
        <div className="mx-auto max-w-7xl space-y-6">
          <Skeleton className="h-32 w-full rounded-none border-2 border-border" />
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Skeleton className="h-96 rounded-none border-2 border-border" />
            <Skeleton className="h-96 rounded-none border-2 border-border" />
          </div>
        </div>
      </div>
    );
  }

  const { branches = [], channels = [], matrix = [] } = data || {};
  const topBranch = branches[0];

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
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] mb-1 text-primary">
                  // Intelligence Workspace
                </p>
                <h1 className="text-2xl font-black uppercase tracking-tight text-foreground">
                  Branch & Channel Risk
                </h1>
                <p className="mt-1 max-w-2xl text-xs text-muted-foreground">
                  Cross-dimensional fraud exposure across regional branches, transaction rails, and abuse typologies.
                </p>
              </div>
            </div>

            <div className="grid gap-3 grid-cols-3">
              <div className="min-w-[110px] sm:min-w-[140px] border border-border bg-muted/30 p-3">
                <div className="text-[9px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
                  Active Branches
                </div>
                <div className="mt-1 text-lg sm:text-xl font-black text-foreground">
                  {branches.length}
                </div>
              </div>
              <div className="min-w-[110px] sm:min-w-[140px] border border-border bg-muted/30 p-3">
                <div className="text-[9px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
                  Alert Channels
                </div>
                <div className="mt-1 text-lg sm:text-xl font-black text-foreground">
                  {channels.length}
                </div>
              </div>
              <div className="min-w-[110px] sm:min-w-[140px] border border-border bg-muted/30 p-3">
                <div className="text-[9px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
                  Priority Patterns
                </div>
                <div className="mt-1 text-lg sm:text-xl font-black text-foreground">
                  {matrix.length}
                </div>
              </div>
            </div>
          </div>
        </motion.header>

        {/* ── TWO-COLUMN GRID ── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          
          {/* High-Risk Branches */}
          <motion.section 
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="overflow-hidden" 
            style={cardStyle}
          >
            <div className="flex items-center justify-between border-b-2 border-border p-4 bg-muted/10">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <h2 className="text-xs font-black uppercase tracking-[0.25em] text-foreground">
                  High-Risk Branches
                </h2>
              </div>
              <div className="rounded-none border border-border bg-primary/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-foreground">
                Top 8
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-muted/50 border-b border-border text-foreground">
                  <tr>
                    <th className="px-4 py-3 font-bold uppercase tracking-wider">Branch</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-wider">Flagged</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-wider">Risk Score</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-wider">Pattern</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {branches.slice(0, 8).map((b, i) => {
                    const tone = getRiskTone(b.risk_score);
                    return (
                      <tr key={i} className="transition-colors hover:bg-primary/5">
                        <td className="px-4 py-3">
                          <div className="font-bold text-foreground">{b.branch_name}</div>
                          <div className="mt-0.5 text-[10px] text-muted-foreground font-mono">
                            {b.branch_code} • {b.region}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-destructive">{b.flagged_accounts}</span>
                          <span className="ml-1 text-muted-foreground">/ {b.total_accounts}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className={tone.text}>{b.risk_score}</span>
                            <div className="h-2 w-16 overflow-hidden border border-border bg-muted/40">
                              <div className={`h-full ${tone.bar}`} style={{ width: `${b.risk_score}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-semibold text-foreground">
                          {b.dominant_pattern}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.section>

          {/* Channel Vulnerability */}
          <motion.section 
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="overflow-hidden" 
            style={cardStyle}
          >
            <div className="flex items-center justify-between border-b-2 border-border p-4 bg-muted/10">
              <div className="flex items-center gap-2">
                <Network className="h-4 w-4 text-primary" />
                <h2 className="text-xs font-black uppercase tracking-[0.25em] text-foreground">
                  Channel Vulnerability
                </h2>
              </div>
              <div className="flex items-center gap-1.5 rounded-none border border-border bg-primary/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-foreground">
                <Shield className="h-3 w-3 text-primary animate-pulse" />
                Live
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-muted/50 border-b border-border text-foreground">
                  <tr>
                    <th className="px-4 py-3 font-bold uppercase tracking-wider">Channel</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-wider">Fraud Volume</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-wider">Abuse Rate</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-wider">Modus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {channels.map((c, i) => (
                    <tr key={i} className="transition-colors hover:bg-primary/5">
                      <td className="px-4 py-3 font-bold text-foreground">{c.channel}</td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-destructive font-mono">₹{(c.flagged_volume / 1000000).toFixed(2)}M</div>
                        <div className="mt-0.5 text-[10px] text-muted-foreground font-mono">{c.flagged_txns.toLocaleString()} txns</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground">{c.risk_percentage.toFixed(1)}%</span>
                          <div className="h-2 w-16 overflow-hidden border border-border bg-muted/40">
                            <div className="h-full bg-amber-500" style={{ width: `${Math.min(100, c.risk_percentage)}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {c.top_pattern}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.section>
        </div>

        {/* ── BOTTOM MATRIX SECTION ── */}
        <motion.section 
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="overflow-hidden" 
          style={cardStyle}
        >
          <div className="flex flex-col gap-3 border-b-2 border-border p-4 md:flex-row md:items-center md:justify-between bg-muted/10">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <h2 className="text-xs font-black uppercase tracking-[0.25em] text-foreground">
                Pattern-Channel Intersection Matrix
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span>
                {topBranch ? `${topBranch.branch_name} leads the current exposure window` : "Exposure is being monitored"}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-center text-xs">
              <thead className="bg-muted/50 border-b border-border text-foreground">
                <tr>
                  <th className="border-r border-border/60 px-4 py-3 text-left font-bold uppercase tracking-wider">Typology</th>
                  {channels.map((c: any, idx: number) => (
                    <th key={idx} className="px-4 py-3 font-bold uppercase tracking-wider">{c.channel}</th>
                  ))}
                  <th className="border-l border-border/60 px-4 py-3 text-left font-bold uppercase tracking-wider">Primary Abuse Context</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {matrix.map((m: any, i: number) => (
                  <tr key={i} className="hover:bg-primary/[0.02]">
                    <td className="border-r border-border/60 px-4 py-3 text-left font-bold text-foreground">
                      {m.pattern}
                    </td>
                    {channels.map((c: any, idx: number) => {
                      const val = m[c.channel] !== undefined ? m[c.channel] : (m.channel_breakdown ? m.channel_breakdown[c.channel] : 0) || 0;
                      return (
                        <td
                          key={idx}
                          className="px-4 py-3 font-mono font-bold"
                          style={{
                            backgroundColor: `rgba(239,68,68,${Math.max(0.04, val / 150)})`,
                            color: val > 40 ? "var(--color-destructive)" : "var(--color-foreground)",
                          }}
                        >
                          {val}%
                        </td>
                      );
                    })}
                    <td className="border-l border-border/60 px-4 py-3 text-left text-muted-foreground">
                      {m.primary_abuse}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
