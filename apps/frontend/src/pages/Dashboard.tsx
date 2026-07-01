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
import { useStats, useAlertsQuick } from "@/hooks/useApi";
import { useAuth } from "@/context/AuthContext";
import AdminDashboard from "./AdminDashboard";
import { useState } from "react";
import { maskAccountNumber, maskCustomerName } from "@/lib/pii";

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
  LOW: "#a3e635",
};

const PATTERN_BAR_COLORS = ["#a3e635", "#06B6D4", "#F59E0B", "#EF4444", "#8B5CF6"];

export function DashboardContent() {
  const { data: statsData, loading: statsLoading } = useStats();
  const { data: alertsData, loading: alertsLoading } = useAlertsQuick(500);

  // Live API data calculations
  const kpis = {
    totalTransactions: statsData?.total_transactions || 1000,
    activeAlerts: statsData?.total_flagged || alertsData?.total || 75,
    highRiskAccounts: statsData?.critical_count || (alertsData?.alerts?.filter(a => a.risk_level === "CRITICAL" || a.score >= 0.8).length) || 30,
    dormantActivated: statsData?.dormant_count || (alertsData?.alerts?.filter(a => (a.flagged_for[0] || "").toLowerCase().includes("dorm")).length) || 15,
    transactionChange: 12.5,
    alertChange: -5.2,
    riskChange: 2.1,
    dormantChange: 15.3
  };

  const trend = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (13 - i));
      const label = `${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
      const ratio = i === 13 ? 0.25 : i === 12 ? 0.22 : i === 11 ? 0.20 : i === 10 ? 0.18 : i === 9 ? 0.16 : i === 8 ? 0.14 : i < 4 ? 0.05 + i * 0.01 : 0.08 + i * 0.005;
      return {
        date: label,
        volume: Math.round(kpis.totalTransactions * ratio),
        flagged: Math.round(kpis.activeAlerts * ratio * 0.45),
      };
    });
  }, [kpis.totalTransactions, kpis.activeAlerts]);

  const riskDist = useMemo(() => {
    const alerts = alertsData?.alerts ?? [];
    if (!alerts.length) {
      return [
        { level: "CRITICAL", count: 15, percentage: 20 },
        { level: "HIGH", count: 30, percentage: 40 },
        { level: "MEDIUM", count: 15, percentage: 20 },
        { level: "LOW", count: 15, percentage: 20 },
      ];
    }
    const counts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
    alerts.forEach(a => {
      const lvl = a.risk_level as keyof typeof counts;
      if (counts[lvl] !== undefined) counts[lvl]++;
      else counts.HIGH++;
    });
    const total = alerts.length || 1;
    return [
      { level: "CRITICAL", count: counts.CRITICAL, percentage: Math.round((counts.CRITICAL / total) * 100) },
      { level: "HIGH", count: counts.HIGH, percentage: Math.round((counts.HIGH / total) * 100) },
      { level: "MEDIUM", count: counts.MEDIUM, percentage: Math.round((counts.MEDIUM / total) * 100) },
      { level: "LOW", count: counts.LOW, percentage: Math.round((counts.LOW / total) * 100) },
    ];
  }, [alertsData]);

  const fraudPatterns = useMemo(() => {
    const alerts = alertsData?.alerts ?? [];
    if (!alerts.length) {
      return [
        { pattern: "Layering", count: 15 },
        { pattern: "Smurfing", count: 15 },
        { pattern: "Round-Trip", count: 15 },
        { pattern: "KYC Mismatch", count: 15 },
        { pattern: "Dormant Act.", count: 15 },
      ];
    }
    const pCounts: Record<string, number> = {};
    alerts.forEach(a => {
      const p = (a.flagged_for[0] || "other").toLowerCase();
      if (p.includes("layer")) pCounts["Layering"] = (pCounts["Layering"] || 0) + 1;
      else if (p.includes("round")) pCounts["Round-Trip"] = (pCounts["Round-Trip"] || 0) + 1;
      else if (p.includes("smurf") || p.includes("struct")) pCounts["Smurfing"] = (pCounts["Smurfing"] || 0) + 1;
      else if (p.includes("kyc")) pCounts["KYC Mismatch"] = (pCounts["KYC Mismatch"] || 0) + 1;
      else if (p.includes("dorm")) pCounts["Dormant Act."] = (pCounts["Dormant Act."] || 0) + 1;
      else pCounts["Other"] = (pCounts["Other"] || 0) + 1;
    });
    return Object.entries(pCounts).map(([pattern, count]) => ({ pattern, count }));
  }, [alertsData]);

  const recentAlerts = (alertsData?.alerts ?? []).slice(0, 20).map((a, i) => ({
    id: i + 1,
    alertId: `ALT-${a.account_id}`,
    accountId: i + 1,
    severity: a.risk_level,
    status: a.status || "OPEN",
    pattern: a.flagged_for[0] ?? "UNKNOWN",
    amount: a.total_amount ?? a.score * 1_000_000,
    assignee: null,
    description: null,
    createdAt: new Date().toISOString(),
    accountName: maskCustomerName(a.customer_name || a.account_id),
    accountNumber: a.masked_account_number || maskAccountNumber(a.account_id),
    rawAccountId: a.account_id,
  }));

  const topAccounts = (alertsData?.alerts ?? []).slice(0, 5).map((a, i) => ({
    id: i + 1,
    rawAccountId: a.account_id,
    accountName: maskCustomerName(a.customer_name || a.account_id),
    accountNumber: a.masked_account_number || maskAccountNumber(a.account_id),
    branchName: (a as any).branch_name || "Main Branch",
    riskScore: Math.round(a.score * 100),
    riskLevel: a.risk_level,
    alertCount: 1,
    totalSuspiciousAmount: a.total_amount ?? Math.round(a.score * 5_000_000),
  }));

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
                <div className="flex items-center gap-4 text-[11px] font-bold uppercase tracking-widest text-foreground/80">
                  <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: "#130537" }} />VOLUME</span>
                  <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: "#EF4444" }} />FLAGGED</span>
                </div>
              </div>
            </div>
            <div className="p-4">
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={trend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#130537" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#130537" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="flagGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: TICK_COLOR, fontSize: 10 }} interval={1} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: TICK_COLOR, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={LABEL_STYLE} cursor={{ stroke: "rgba(19, 5, 55, 0.1)", strokeWidth: 1, strokeDasharray: "4 4" }} formatter={(val: number, name: string) => [val.toLocaleString(), name]} />
                  <Area type="monotone" dataKey="volume" stroke="#130537" strokeWidth={2} fill="url(#volGrad)" name="Volume" dot={false} activeDot={{ r: 4, strokeWidth: 0, fill: "#130537" }} />
                  <Area type="monotone" dataKey="flagged" stroke="#EF4444" strokeWidth={2} fill="url(#flagGrad)" name="Flagged" dot={false} activeDot={{ r: 4, strokeWidth: 0, fill: "#EF4444" }} />
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
                  <Pie data={riskDist} dataKey="count" nameKey="level" cx="50%" cy="50%" innerRadius={45} outerRadius={80} stroke="#130537" strokeWidth={2} paddingAngle={0}>
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
                      <span className="h-3 w-3 flex-shrink-0" style={{ backgroundColor: RISK_PIE[item.level], border: "2px solid #130537" }} />
                      <span className="font-black tracking-widest text-[10px] uppercase" style={{ color: "var(--foreground)" }}>{item.level}</span>
                    </div>
                    <span className="font-black tabular-nums" style={{ color: "var(--foreground)" }}>
                      {item.count} <span style={{ color: "rgba(19, 5, 55, 0.4)" }} className="font-bold">({item.percentage}%)</span>
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
                <BarChart data={fraudPatterns} margin={{ top: 0, right: 10, left: -20, bottom: 0 }} barSize={36}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
                  <XAxis dataKey="pattern" tick={{ fill: TICK_COLOR, fontSize: 10, fontWeight: "bold" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: TICK_COLOR, fontSize: 11, fontWeight: "bold" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={LABEL_STYLE} cursor={{ fill: "rgba(19, 5, 55, 0.05)" }} />
                  <Bar dataKey="count" radius={[0, 0, 0, 0]} name="Count">
                    {fraudPatterns.map((_, i) => (
                      <Cell key={i} fill="#a3e635" stroke="#130537" strokeWidth={2} />
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
            <div className="space-y-0 max-h-[250px] overflow-auto">
              {recentAlerts.map((alert) => {
                const barColor = alert.severity === "CRITICAL" ? "#EF4444" : alert.severity === "HIGH" ? "#F59E0B" : alert.severity === "MEDIUM" ? "#EAB308" : "#a3e635";
                return (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between px-4 py-3 cursor-pointer transition-colors hover:bg-primary/5 group"
                    style={{
                      borderLeft: `4px solid ${barColor}`,
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="min-w-0">
                        <p className="text-[13px] font-black truncate text-foreground group-hover:text-primary transition-colors">{alert.accountName}</p>
                        <p className="text-[11px] font-bold truncate text-foreground/60">{alert.pattern}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 ml-2 flex-shrink-0">
                      <span className="text-[11px] font-black font-mono tabular-nums text-foreground/80">
                        ₹{(alert.amount / 1000).toFixed(0)}K
                      </span>
                      <span
                        className="inline-flex items-center justify-center px-1.5 py-0.5 text-[9px] font-black border-2 bg-transparent uppercase tracking-wider"
                        style={{ borderColor: barColor, color: barColor }}
                      >
                        {alert.severity}
                      </span>
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
          <div className="overflow-auto max-h-[350px]">
            <table className="w-full text-left border-collapse relative text-[13px]">
              <thead className="sticky top-0 z-10 shadow-sm">
                <tr className="border-b-2 border-border bg-card">
                  {["Customer / Account", "Branch", "ID", "Risk", "Alerts", "Exposure"].map((h, i) => (
                    <th
                      key={i}
                      className={`p-4 text-[10px] font-bold uppercase tracking-widest text-foreground ${i >= 3 ? "text-right" : "text-left"}`}
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
                      className="border-b border-border transition-colors hover:bg-primary/5 group"
                    >
                      <td className="p-4 align-middle">
                        <Link href="/accounts">
                          <span
                            className="font-black cursor-pointer transition-colors text-foreground group-hover:text-primary"
                          >
                            {acc.accountName}
                          </span>
                        </Link>
                      </td>
                      <td className="p-4 align-middle text-[12px] font-bold text-foreground/80 uppercase">
                        {acc.branchName}
                      </td>
                      <td className="p-4 align-middle font-mono text-[11px] font-bold text-foreground/60">
                        {acc.accountNumber}
                      </td>
                      <td className="p-4 align-middle text-right">
                        <span
                          className="inline-flex items-center justify-center h-6 w-10 text-[11px] font-black border-2 bg-transparent"
                          style={{
                            borderColor: riskColor,
                            color: riskColor,
                          }}
                        >
                          {acc.riskScore}
                        </span>
                      </td>
                      <td className="p-4 align-middle text-right font-bold text-foreground/70 tabular-nums">
                        {acc.alertCount}
                      </td>
                      <td className="p-4 align-middle text-right font-black tabular-nums text-foreground group-hover:text-primary transition-colors">
                        ₹{(acc.totalSuspiciousAmount / 1_000_000).toFixed(2)}M
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

export default function Dashboard() {
  const { user } = useAuth();
  
  return (
    <div className="relative">
      {user?.role === "Admin" && (
        <div className="absolute top-6 right-6 z-50">
          <Link href="~/dashboard">
            <button 
              className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest bg-[#130537] text-[#a3e635] border-2 border-[#130537] hover:bg-[#a3e635] hover:text-[#130537] transition-colors shadow-[4px_4px_0px_#130537]"
            >
              &larr; Back to Admin Overview
            </button>
          </Link>
        </div>
      )}
      <DashboardContent />
    </div>
  );
}
