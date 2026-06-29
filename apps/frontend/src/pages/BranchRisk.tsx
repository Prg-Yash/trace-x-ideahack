import React from "react";
import { Building2, Activity, Network, MapPin } from "lucide-react";
import { useBranchChannelAnalytics } from "@/hooks/useApi";
import { Skeleton } from "@/components/ui/skeleton";

export default function BranchRisk() {
  const { data, loading } = useBranchChannelAnalytics();

  if (loading && !data) {
    return (
      <div className="p-6 space-y-6 min-h-screen">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  const { branches = [], channels = [], matrix = [] } = data || {};

  return (
    <div className="p-6 space-y-6 min-h-screen pb-20 fade-in" style={{ backgroundColor: "var(--background)" }}>
      {/* HEADER */}
      <div className="flex items-center gap-3 mb-6">
        <Building2 className="w-8 h-8 text-cyan-400" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-black " >
            BRANCH & CHANNEL RISK
          </h1>
          <p className="text-sm text-slate-400 font-mono mt-1">Cross-Dimensional Fraud Topography</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* BRANCHES LIST */}
        <div className="border rounded-md shadow-sm overflow-hidden" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface-1)" }}>
          <div className="p-4 border-b flex justify-between items-center" style={{ borderColor: "var(--border)" }}>
            <h2 className="text-sm font-bold text-black tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-cyan-400" /> TOP HIGH-RISK BRANCHES
            </h2>
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead style={{ backgroundColor: "var(--surface-2)" }}>
                <tr>
                  <th className="px-4 py-3 font-semibold text-black">Branch</th>
                  <th className="px-4 py-3 font-semibold text-black">Flagged Accs</th>
                  <th className="px-4 py-3 font-semibold text-black">Risk Score</th>
                  <th className="px-4 py-3 font-semibold text-black">Dominant Pattern</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {branches.slice(0, 8).map((b, i) => (
                  <tr key={i} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-700">{b.branch_name}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">{b.branch_code} • {b.region}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-red-400 font-mono font-bold">{b.flagged_accounts}</span>
                      <span className="text-slate-500 font-mono text-[10px] ml-1">/ {b.total_accounts}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`font-mono font-bold ${b.risk_score >= 80 ? "text-red-500" : b.risk_score >= 60 ? "text-amber-500" : "text-emerald-500"}`}>
                          {b.risk_score}
                        </span>
                        <div className="w-16 h-1.5 rounded-full bg-slate-800">
                          <div className={`h-full rounded-full ${b.risk_score >= 80 ? "bg-red-500" : b.risk_score >= 60 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${b.risk_score}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-amber-400 font-medium">
                      {b.dominant_pattern}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CHANNELS LIST */}
        <div className="border rounded-md shadow-sm overflow-hidden" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface-1)" }}>
          <div className="p-4 border-b flex justify-between items-center" style={{ borderColor: "var(--border)" }}>
            <h2 className="text-sm font-bold text-black tracking-wider flex items-center gap-2">
              <Network className="w-4 h-4 text-emerald-400" /> CHANNEL VULNERABILITY
            </h2>
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead style={{ backgroundColor: "var(--surface-2)" }}>
                <tr>
                  <th className="px-4 py-3 font-semibold text-black">Channel</th>
                  <th className="px-4 py-3 font-semibold text-black">Fraud Volume</th>
                  <th className="px-4 py-3 font-semibold text-black">Abuse Rate</th>
                  <th className="px-4 py-3 font-semibold text-black">Top Modus Operandi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {channels.map((c, i) => (
                  <tr key={i} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-700 tracking-wide">{c.channel}</td>
                    <td className="px-4 py-3">
                      <div className="text-red-400 font-mono">₹{(c.flagged_volume / 1000000).toFixed(2)}M</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">{c.flagged_txns.toLocaleString()} txns</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-amber-400 font-bold">{c.risk_percentage.toFixed(1)}%</span>
                        <div className="w-16 h-1.5 rounded-full bg-slate-800">
                          <div className="h-full rounded-full bg-amber-400" style={{ width: `${Math.min(100, c.risk_percentage)}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {c.top_pattern}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* MATRIX */}
      <div className="border rounded-md shadow-sm overflow-hidden" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface-1)" }}>
        <div className="p-4 border-b" style={{ borderColor: "var(--border)" }}>
          <h2 className="text-sm font-bold text-black tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-400" /> PATTERN-CHANNEL INTERSECTION MATRIX
          </h2>
          <p className="text-xs text-slate-500 mt-1">Cross-tabulation of Typologies against Transaction Rails</p>
        </div>
        <div className="p-0 overflow-x-auto">
          <table className="w-full text-center text-xs border-collapse">
            <thead style={{ backgroundColor: "var(--surface-2)" }}>
              <tr>
                <th className="px-4 py-3 font-semibold text-black text-left border-r border-slate-800">Typology</th>
                {channels.map((c: any, idx: number) => (
                  <th key={idx} className="px-4 py-3 font-semibold text-black">{c.channel}</th>
                ))}
                <th className="px-4 py-3 font-semibold text-black text-left border-l border-slate-800">Primary Abuse Context</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {matrix.map((m: any, i: number) => (
                <tr key={i}>
                  <td className="px-4 py-3 font-medium text-slate-700 text-left border-r border-slate-800">{m.pattern}</td>
                  {channels.map((c: any, idx: number) => {
                    const val = m[c.channel] !== undefined ? m[c.channel] : (m.channel_breakdown ? m.channel_breakdown[c.channel] : 0) || 0;
                    return (
                      <td key={idx} className="px-4 py-3 font-mono" style={{ backgroundColor: `rgba(239, 68, 68, ${val / 100})`, color: val > 40 ? "#fff" : "#94a3b8" }}>{val}%</td>
                    );
                  })}
                  <td className="px-4 py-3 text-slate-700 text-left border-l border-slate-800">{m.primary_abuse}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
