import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle, Shield,
  Activity, Users, Zap, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { Link } from "wouter";
import {
  staticDashboardKpis,
  staticTransactionTrend,
  staticRiskDistribution,
  staticFraudPatterns,
  staticAlerts,
  staticTopSuspiciousAccounts,
} from "@/data/staticData";
import { useStats, useAlertsQuick } from "@/hooks/useApi";

/* ── DESIGN TOKENS ── */
const TOOLTIP_STYLE = {
  backgroundColor: "var(--card)",
  border: "2px solid var(--border)",
  borderRadius: 0,
  fontSize: 12,
  color: "var(--foreground)",
};
const LABEL_STYLE = { color: "var(--foreground)" };
const GRID_COLOR = "var(--border)";
const TICK_COLOR = "rgba(19, 5, 55, 0.4)";

/* card border style */
const cardStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  border: "2px solid #130537",
  borderRadius: 0,
  boxShadow: "6px 6px 0px #130537",
};

const SEV: Record<string, { badge: string; dot: string; bar: string }> = {
  CRITICAL: { badge: "bg-red-500/10 text-red-400 border-red-500/25", dot: "bg-red-500", bar: "bg-red-500" },
  HIGH: { badge: "bg-amber-500/10 text-amber-400 border-amber-500/25", dot: "bg-amber-500", bar: "bg-amber-500" },
  MEDIUM: { badge: "bg-yellow-500/10 text-yellow-400 border-yellow-500/25", dot: "bg-yellow-400", bar: "bg-yellow-400" },
  LOW: { badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25", dot: "bg-emerald-500", bar: "bg-emerald-500" },
};

const RISK_PIE: Record<string, string> = {
  CRITICAL: "#EF4444",
  HIGH: "#F59E0B",
  MEDIUM: "#EAB308",
  LOW: "#10B981",
};

const PATTERN_BAR_COLORS = ["#a3e635", "#06B6D4", "#F59E0B", "#EF4444", "#8B5CF6"];

export default function Dashboard() {
  const { data: statsData, loading: statsLoading } = useStats();
  const { data: alertsData, loading: alertsLoading } = useAlertsQuick(500);

  // Merge live API data with static fallback
  const kpis = {
    ...staticDashboardKpis,
    totalTransactions: statsData?.total_transactions ?? staticDashboardKpis.totalTransactions,
    activeAlerts: statsData?.total_flagged ?? alertsData?.total ?? staticDashboardKpis.activeAlerts,
    highRiskAccounts: statsData?.critical_count ?? staticDashboardKpis.highRiskAccounts,
    dormantActivated: statsData?.dormant_count ?? 30,
  };
  const trend = staticTransactionTrend;

  const riskDist = useMemo(() => {
    if (!alertsData?.alerts?.length) return staticRiskDistribution;
    const counts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
    alertsData.alerts.forEach(a => {
      const lvl = a.risk_level as keyof typeof counts;
      if (counts[lvl] !== undefined) counts[lvl]++;
      else counts.HIGH++;
    });
    const total = alertsData.alerts.length || 1;
    return [
      { level: "CRITICAL", count: counts.CRITICAL, percentage: Math.round((counts.CRITICAL / total) * 100) },
      { level: "HIGH", count: counts.HIGH, percentage: Math.round((counts.HIGH / total) * 100) },
      { level: "MEDIUM", count: counts.MEDIUM, percentage: Math.round((counts.MEDIUM / total) * 100) },
      { level: "LOW", count: counts.LOW, percentage: Math.round((counts.LOW / total) * 100) },
    ];
  }, [alertsData]);

  const fraudPatterns = useMemo(() => {
    if (!alertsData?.alerts?.length) return staticFraudPatterns;
    const pCounts: Record<string, number> = {};
    alertsData.alerts.forEach(a => {
      const p = (a.flagged_for[0] || "other").toLowerCase();
      if (p.includes("layer")) pCounts["Layering"] = (pCounts["Layering"] || 0) + 1;
      else if (p.includes("round")) pCounts["Round-Trip"] = (pCounts["Round-Trip"] || 0) + 1;
      else if (p.includes("smurf") || p.includes("struct")) pCounts["Structuring"] = (pCounts["Structuring"] || 0) + 1;
      else if (p.includes("kyc")) pCounts["KYC Mismatch"] = (pCounts["KYC Mismatch"] || 0) + 1;
      else if (p.includes("dorm")) pCounts["Dormant Act."] = (pCounts["Dormant Act."] || 0) + 1;
      else pCounts["Other"] = (pCounts["Other"] || 0) + 1;
    });
    return Object.entries(pCounts).map(([pattern, count]) => ({ pattern, count }));
  }, [alertsData]);

  // Build recent alerts from live data if available, else static
  const recentAlerts = alertsData?.alerts?.length
    ? alertsData.alerts.slice(0, 8).map((a, i) => ({
        id: i + 1,
        alertId: `ALT-${a.account_id}`,
        accountId: i + 1,
        severity: a.risk_level,
        status: "OPEN",
        pattern: a.flagged_for[0] ?? "UNKNOWN",
        amount: a.total_amount ?? a.score * 1_000_000,
        assignee: null,
        description: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        accountName: a.account_id,
        accountNumber: a.account_id,
      }))
    : staticAlerts;

  const topAccounts = alertsData?.alerts?.length
    ? alertsData.alerts.slice(0, 5).map((a, i) => ({
        id: i + 1,
        accountName: a.account_id,
        accountNumber: a.account_id,
        riskScore: Math.round(a.score * 100),
        riskLevel: a.risk_level,
        alertCount: 1,
        totalSuspiciousAmount: a.total_amount ?? Math.round(a.score * 5_000_000),
      }))
    : staticTopSuspiciousAccounts;

  const kpiCards = [
    {
      title: "Total Transactions",
      value: kpis.totalTransactions.toLocaleString(),
      change: kpis.transactionChange,
      icon: Activity,
      accentColor: "#06B6D4",
      iconColor: "#06B6D4",
    },
    {
      title: "Active Alerts",
      value: kpis.activeAlerts.toLocaleString(),
      change: kpis.alertChange,
      icon: AlertTriangle,
      accentColor: "#EF4444",
      iconColor: "#EF4444",
    },
    {
      title: "High Risk Accounts",
      value: kpis.highRiskAccounts.toLocaleString(),
      change: kpis.riskChange,
      icon: Shield,
      accentColor: "#F59E0B",
      iconColor: "#F59E0B",
    },
    {
      title: "Dormant Activated",
      value: kpis.dormantActivated.toLocaleString(),
      change: kpis.dormantChange,
      icon: Zap,
      accentColor: "#a3e635",
      iconColor: "#a3e635",
    },
  ];

  if ((statsLoading || alertsLoading) && !statsData && !alertsData) {
    return (
      <div className="p-6 space-y-6 min-h-screen" style={{ backgroundColor: "var(--background)" }}>
        <Skeleton className="h-20 w-full" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-80 lg:col-span-2 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 min-h-screen" style={{ backgroundColor: "var(--background)" }}>

      {/* ── HEADER ── */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div
          className="flex items-center justify-between p-5 mb-2"
          style={cardStyle}
        >
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] mb-1" style={{ color: "#a3e635" }}>
              // Operations Dashboard
            </p>
            <h1 className="text-2xl font-black uppercase tracking-tight" style={{ color: "var(--foreground)" }}>
              Fraud Intelligence Overview
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "rgba(19, 5, 55, 0.5)" }}>
              Real-time fraud monitoring and entity risk intelligence
            </p>
          </div>
          <div className="flex items-center gap-2 text-[12px]" style={{ color: "rgba(19, 5, 55, 0.5)" }}>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#a3e635] animate-pulse" />
              <span className="font-bold text-[#a3e635] text-[11px] uppercase tracking-widest">Live</span>
            </span>
            <span style={{ color: "var(--border)" }}>|</span>
            <span>Updated {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </motion.div>

      {/* ── KPI CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpiCards.map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <div
              className="p-5 overflow-hidden hover:border-opacity-70 transition-colors"
              style={{
                ...cardStyle,
                borderTop: `3px solid ${card.accentColor}`,
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className="p-2"
                  style={{
                    border: `1px solid ${card.accentColor}30`,
                    backgroundColor: `${card.accentColor}10`,
                  }}
                >
                  <card.icon className="h-4 w-4" style={{ color: card.iconColor }} />
                </div>
                {card.change != null && (
                  <span
                    className="flex items-center gap-1 text-[11px] font-bold"
                    style={{ color: card.change >= 0 ? "#EF4444" : "#a3e635" }}
                  >
                    {card.change >= 0
                      ? <ArrowUpRight className="h-3 w-3" />
                      : <ArrowDownRight className="h-3 w-3" />}
                    {Math.abs(card.change)}%
                  </span>
                )}
              </div>
              <p className="text-3xl font-black tracking-tight" style={{ color: "var(--foreground)" }}>
                {card.value}
              </p>
              <p
                className="text-[11px] mt-1 font-bold uppercase tracking-widest"
                style={{ color: "rgba(19, 5, 55, 0.4)" }}
              >
                {card.title}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── CHARTS ROW ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* Transaction Trend */}
        <motion.div className="xl:col-span-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.28 }}>
          <div style={cardStyle} className="h-full">
            <div className="p-4" style={{ borderBottom: "2px solid var(--border)" }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.3em] mb-1" style={{ color: "#a3e635" }}>
                    // Transaction Volume
                  </p>
                  <p className="text-[14px] font-black uppercase" style={{ color: "var(--foreground)" }}>Volume Trend</p>
                  <p className="text-[12px] mt-0.5" style={{ color: "rgba(19, 5, 55, 0.4)" }}>
                    Daily volume vs flagged transactions — last 14 days
                  </p>
                </div>
                <div className="flex items-center gap-4 text-[11px]" style={{ color: "rgba(19, 5, 55, 0.5)" }}>
                  <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5" style={{ backgroundColor: "#06B6D4" }} />Volume</span>
                  <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5" style={{ backgroundColor: "#EF4444" }} />Flagged</span>
                </div>
              </div>
            </div>
            <div className="p-4">
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={trend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="flagGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: TICK_COLOR, fontSize: 11 }} tickFormatter={v => v.slice(5)} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: TICK_COLOR, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={LABEL_STYLE} />
                  <Area type="monotone" dataKey="volume" stroke="#06B6D4" strokeWidth={1.5} fill="url(#volGrad)" name="Volume" />
                  <Area type="monotone" dataKey="flagged" stroke="#EF4444" strokeWidth={1.5} fill="url(#flagGrad)" name="Flagged" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>

        {/* Risk Distribution */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.32 }}>
          <div style={cardStyle} className="h-full">
            <div className="p-4" style={{ borderBottom: "2px solid var(--border)" }}>
              <p className="text-[9px] font-bold uppercase tracking-[0.3em] mb-1" style={{ color: "#a3e635" }}>
                // Risk Profile
              </p>
              <p className="text-[14px] font-black uppercase" style={{ color: "var(--foreground)" }}>Risk Distribution</p>
              <p className="text-[12px] mt-0.5" style={{ color: "rgba(19, 5, 55, 0.4)" }}>Account risk level breakdown</p>
            </div>
            <div className="p-4">
              <ResponsiveContainer width="100%" height={170}>
                <PieChart>
                  <Pie data={riskDist} dataKey="count" nameKey="level" cx="50%" cy="50%" innerRadius={48} outerRadius={72} strokeWidth={0} paddingAngle={2}>
                    {riskDist.map((item) => (
                      <Cell key={item.level} fill={RISK_PIE[item.level] ?? "#06B6D4"} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={LABEL_STYLE} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-2">
                {riskDist.map((item) => (
                  <div key={item.level} className="flex items-center justify-between text-[12px]">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 flex-shrink-0" style={{ backgroundColor: RISK_PIE[item.level] }} />
                      <span style={{ color: "rgba(19, 5, 55, 0.5)" }}>{item.level}</span>
                    </div>
                    <span className="font-bold tabular-nums" style={{ color: "var(--foreground)" }}>
                      {item.count} <span style={{ color: "rgba(19, 5, 55, 0.4)" }} className="font-normal">({item.percentage}%)</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── PATTERNS + ALERTS ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

        {/* Fraud Pattern Analysis */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.38 }}>
          <div style={cardStyle}>
            <div className="p-4" style={{ borderBottom: "2px solid var(--border)" }}>
              <p className="text-[9px] font-bold uppercase tracking-[0.3em] mb-1" style={{ color: "#a3e635" }}>
                // Pattern Detection
              </p>
              <p className="text-[14px] font-black uppercase" style={{ color: "var(--foreground)" }}>Fraud Pattern Analysis</p>
              <p className="text-[12px] mt-0.5" style={{ color: "rgba(19, 5, 55, 0.4)" }}>Detected pattern frequency this period</p>
            </div>
            <div className="p-4">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={fraudPatterns} margin={{ top: 0, right: 10, left: -20, bottom: 0 }} barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
                  <XAxis dataKey="pattern" tick={{ fill: TICK_COLOR, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: TICK_COLOR, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={LABEL_STYLE} />
                  <Bar dataKey="count" radius={[0, 0, 0, 0]} name="Count">
                    {fraudPatterns.map((_, i) => (
                      <Cell key={i} fill={PATTERN_BAR_COLORS[i % PATTERN_BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>

        {/* Recent Alerts Feed */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.42 }}>
          <div style={cardStyle}>
            <div className="p-4 flex items-center justify-between" style={{ borderBottom: "2px solid var(--border)" }}>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.3em] mb-1" style={{ color: "#a3e635" }}>
                  // Alert Feed
                </p>
                <p className="text-[14px] font-black uppercase" style={{ color: "var(--foreground)" }}>Recent Alerts</p>
                <p className="text-[12px] mt-0.5" style={{ color: "rgba(19, 5, 55, 0.4)" }}>Latest fraud detection events</p>
              </div>
              <Link href="/alerts">
                <span
                  className="text-[12px] font-bold uppercase tracking-widest cursor-pointer transition-colors hover:opacity-80"
                  style={{ color: "#a3e635" }}
                >
                  View all →
                </span>
              </Link>
            </div>
            <div className="space-y-0 max-h-[224px] overflow-y-auto">
              {recentAlerts.slice(0, 6).map((alert) => {
                const s = SEV[alert.severity];
                const barColor = alert.severity === "CRITICAL" ? "#EF4444" : alert.severity === "HIGH" ? "#F59E0B" : alert.severity === "MEDIUM" ? "#EAB308" : "#10B981";
                return (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between px-4 py-3 cursor-pointer transition-colors"
                    style={{
                      borderLeft: `3px solid ${barColor}`,
                      borderBottom: "1px solid var(--border)",
                    }}
                    onMouseEnter={(e) => (e.currentTarget as HTMLDivElement).style.backgroundColor = "rgba(19, 5, 55, 0.03)"}
                    onMouseLeave={(e) => (e.currentTarget as HTMLDivElement).style.backgroundColor = "transparent"}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold truncate" style={{ color: "var(--foreground)" }}>{alert.accountName}</p>
                        <p className="text-[11px] truncate" style={{ color: "rgba(19, 5, 55, 0.4)" }}>{alert.pattern}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 ml-2 flex-shrink-0">
                      <span className="text-[11px] font-mono tabular-nums" style={{ color: "rgba(19, 5, 55, 0.5)" }}>
                        ${(alert.amount / 1000).toFixed(0)}K
                      </span>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 border ${s?.badge}`}>
                        {alert.severity}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── TOP SUSPICIOUS ACCOUNTS ── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.46 }}>
        <div style={cardStyle}>
          <div className="p-4 flex items-center justify-between" style={{ borderBottom: "2px solid var(--border)" }}>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.3em] mb-1" style={{ color: "#a3e635" }}>
                // Account Intelligence
              </p>
              <p className="text-[14px] font-black uppercase" style={{ color: "var(--foreground)" }}>Top Suspicious Accounts</p>
              <p className="text-[12px] mt-0.5" style={{ color: "rgba(19, 5, 55, 0.4)" }}>Highest risk accounts by composite score</p>
            </div>
            <Link href="/accounts">
              <span
                className="text-[12px] font-bold uppercase tracking-widest cursor-pointer transition-colors hover:opacity-80"
                style={{ color: "#a3e635" }}
              >
                Investigate →
              </span>
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", backgroundColor: "rgba(19, 5, 55, 0.02)" }}>
                  {["// Account", "// ID", "// Risk", "// Alerts", "// Exposure"].map((h, i) => (
                    <th
                      key={i}
                      className={`px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest ${i >= 2 ? "text-right" : "text-left"}`}
                      style={{ color: "rgba(19, 5, 55, 0.35)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topAccounts.map((acc) => {
                  const riskColor = acc.riskScore >= 90 ? "#EF4444" : acc.riskScore >= 70 ? "#F59E0B" : "#EAB308";
                  return (
                    <tr
                      key={acc.id}
                      className="transition-colors"
                      style={{ borderBottom: "1px solid var(--border)" }}
                      onMouseEnter={(e) => (e.currentTarget as HTMLTableRowElement).style.backgroundColor = "rgba(19, 5, 55, 0.03)"}
                      onMouseLeave={(e) => (e.currentTarget as HTMLTableRowElement).style.backgroundColor = "transparent"}
                    >
                      <td className="px-5 py-3">
                        <Link href="/accounts">
                          <span
                            className="font-semibold cursor-pointer transition-colors hover:opacity-80"
                            style={{ color: "#a3e635" }}
                          >
                            {acc.accountName}
                          </span>
                        </Link>
                      </td>
                      <td className="px-5 py-3 font-mono text-[11px]" style={{ color: "rgba(19, 5, 55, 0.4)" }}>
                        {acc.accountNumber}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span
                          className="inline-flex items-center justify-center h-6 w-10 text-[11px] font-black"
                          style={{
                            border: `1px solid ${riskColor}40`,
                            backgroundColor: `${riskColor}10`,
                            color: riskColor,
                          }}
                        >
                          {acc.riskScore}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums" style={{ color: "rgba(19, 5, 55, 0.5)" }}>
                        {acc.alertCount}
                      </td>
                      <td className="px-5 py-3 text-right font-black tabular-nums" style={{ color: "var(--foreground)" }}>
                        ${(acc.totalSuspiciousAmount / 1_000_000).toFixed(2)}M
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>

    </div>
  );
}
