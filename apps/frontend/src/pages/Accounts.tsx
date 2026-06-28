import { useState } from "react";
import { motion } from "framer-motion";
import {
  Search, Shield, AlertTriangle, FileText, Plus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  staticAccounts,
  getKycByAccountId,
  getTransactionsByAccountId,
  getNotesByAccountId,
  getAlertsByAccountId,
  getRiskFactors,
  getSuspiciousBehaviors,
  type InvestigationNote,
} from "@/data/staticData";
import { useScore, useExplain, useAccounts } from "@/hooks/useApi";

const RISK: Record<string, { badge: string; bar: string; score: string; leftBar: string }> = {
  CRITICAL: { badge: "bg-red-500/10 text-red-400 border-red-500/25",   bar: "#EF4444", score: "text-red-400",   leftBar: "#EF4444" },
  HIGH:     { badge: "bg-amber-500/10 text-amber-400 border-amber-500/25", bar: "#F59E0B", score: "text-amber-400", leftBar: "#F59E0B" },
  MEDIUM:   { badge: "bg-yellow-500/10 text-yellow-400 border-yellow-500/25", bar: "#EAB308", score: "text-yellow-400", leftBar: "#EAB308" },
  LOW:      { badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25", bar: "#10B981", score: "text-emerald-400", leftBar: "#10B981" },
};

function RiskScore({ score }: { score: number }) {
  const color = score >= 80 ? "#EF4444" : score >= 60 ? "#F59E0B" : score >= 40 ? "#EAB308" : "#10B981";
  return (
    <div style={{ position: "relative", width: 44, height: 44 }}>
      <svg width="44" height="44" viewBox="0 0 44 44" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="22" cy="22" r="17" fill="none" stroke="#1e2d45" strokeWidth="3" />
        <circle
          cx="22" cy="22" r="17" fill="none"
          stroke={color} strokeWidth="3"
          strokeDasharray={`${(score / 100) * 106.8} 106.8`}
          strokeLinecap="square"
        />
      </svg>
      <span style={{
        position: "absolute", inset: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 12, fontWeight: 800, color, fontFamily: "monospace",
      }}>{score}</span>
    </div>
  );
}

function RiskBar({ score, color }: { score: number; color: string }) {
  return (
    <div style={{ height: 4, background: "#1e2d45" }}>
      <div style={{ height: 4, width: `${score}%`, background: color, transition: "width 0.5s ease" }} />
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  backgroundColor: "var(--card)",
  borderWidth: "2px",
  borderStyle: "solid",
  borderColor: "var(--border)",
  borderRadius: 0,
};

export default function Accounts() {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [noteContent, setNoteContent] = useState("");
  const [localNotes, setLocalNotes] = useState<InvestigationNote[]>([]);

  const { data: liveAccounts } = useAccounts(100);

  const mergedAccounts = liveAccounts?.length
    ? liveAccounts.map((a, i) => ({
        id: i + 1,
        accountName: a.account_id,
        accountNumber: a.account_id,
        accountType: a.account_type || "Corporate Checking",
        riskLevel: (a.risk_category || "HIGH").toUpperCase() as "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
        riskScore: a.is_fraud ? 88 : 45,
        status: (a.status || "ACTIVE") as "ACTIVE" | "RESTRICTED" | "SUSPENDED" | "CLOSED",
        balance: a.current_balance || 142000,
        kycTier: (a.kyc_tier || 2) as 1 | 2 | 3,
        branch: a.branch_code || "NYC-01",
        lastActivity: "Live today",
      }))
    : staticAccounts;

  const filteredAccounts = mergedAccounts.filter(acc =>
    !search || [acc.accountName, acc.accountNumber, acc.accountType].some(f =>
      f.toLowerCase().includes(search.toLowerCase())
    )
  );

  const selectedAccount = selectedId ? mergedAccounts.find(a => a.id === selectedId) ?? null : null;

  // Live ML risk score + SHAP explanation for the selected account
  const liveAccountId = selectedAccount?.accountNumber ?? null;
  const { data: scoreData, loading: scoreLoading } = useScore(liveAccountId);
  const { data: explainData, loading: explainLoading } = useExplain(liveAccountId);

  const kyc = selectedId ? getKycByAccountId(selectedId) : undefined;
  const transactions = selectedId ? getTransactionsByAccountId(selectedId) : [];
  const staticNotes = selectedId ? getNotesByAccountId(selectedId) : [];
  const relatedAlerts = selectedId ? getAlertsByAccountId(selectedId) : [];
  const riskFactors = selectedAccount ? getRiskFactors(selectedAccount) : [];
  const suspiciousBehaviors = selectedAccount ? getSuspiciousBehaviors(selectedAccount) : [];

  // Override static risk with live ML score
  const liveRiskLevel = scoreData?.risk_level ?? selectedAccount?.riskLevel;
  const liveRiskScore = scoreData ? Math.round(scoreData.combined_score * 100) : selectedAccount?.riskScore;
  const liveFlaggedFor = scoreData?.flagged_for ?? [];

  const allNotes = [
    ...staticNotes,
    ...localNotes.filter(n => n.accountId === selectedId),
  ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const handleAddNote = () => {
    if (!selectedId || !noteContent.trim()) return;
    const newNote: InvestigationNote = {
      id: Date.now(),
      accountId: selectedId,
      content: noteContent.trim(),
      author: "Agent Investigator",
      createdAt: new Date().toISOString(),
    };
    setLocalNotes(prev => [...prev, newNote]);
    setNoteContent("");
  };

  return (
    <div className="p-6 space-y-5 min-h-screen font-sans" style={{ backgroundColor: "var(--background)" }}>
      {/* ── HEADER ── */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="p-5" style={cardStyle}>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] mb-1" style={{ color: "#a3e635" }}>
            // Account Intelligence
          </p>
          <h1 className="text-2xl font-black uppercase tracking-tight" style={{ color: "var(--foreground)" }}>
            Account Investigation
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "rgba(19, 5, 55, 0.5)" }}>
            Deep-dive analysis of customer accounts and transaction behavior
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* ── ACCOUNT LIST ── */}
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 }}>
          <div style={cardStyle} className="h-[calc(100vh-148px)] flex flex-col">
            <div className="p-4 flex-shrink-0" style={{ borderBottom: "2px solid #1e2d45" }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#a3e635]">
                  // Accounts
                </span>
                <span className="text-[11px]" style={{ color: "rgba(232,232,226,0.4)" }}>
                  {filteredAccounts.length} total
                </span>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: "rgba(232,232,226,0.3)" }} />
                <Input
                  placeholder="Search accounts…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 text-[12px] h-9 rounded-none"
                  style={{
                    backgroundColor: "var(--card)",
                    border: "2px solid var(--border)",
                    color: "var(--foreground)",
                  }}
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto space-y-1 p-3">
              {filteredAccounts.map(acc => {
                const r = RISK[acc.riskLevel ?? "LOW"];
                const isSelected = selectedId === acc.id;
                return (
                  <div
                    key={acc.id}
                    onClick={() => setSelectedId(acc.id)}
                    className="p-3 cursor-pointer transition-all border-2"
                    style={{
                      backgroundColor: isSelected ? "rgba(163,230,53,0.06)" : "var(--card)",
                      borderColor: isSelected ? "#a3e635" : "var(--border)",
                      borderLeft: `4px solid ${r?.leftBar}`,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-[13px] font-bold uppercase tracking-tight animate-none" style={{ color: isSelected ? "#a3e635" : "var(--foreground)" }}>
                          {acc.accountName}
                        </p>
                        <p className="text-[11px] font-mono mt-0.5" style={{ color: "rgba(19, 5, 55, 0.4)" }}>
                          {acc.accountNumber}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                        <span className={`text-[11px] font-bold font-mono ${r?.score}`}>
                          {acc.riskScore}
                        </span>
                        <Badge variant="outline" className={`text-[9px] px-1 py-0 rounded-none border ${r?.badge}`}>
                          {acc.riskLevel?.substring(0, 4)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* ── ACCOUNT DETAIL ── */}
        <motion.div className="xl:col-span-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.16 }}>
          {!selectedAccount ? (
            <div className="h-[calc(100vh-148px)] flex items-center justify-center" style={cardStyle}>
              <div className="text-center">
                <Shield className="h-10 w-10 mx-auto mb-3" style={{ color: "rgba(19, 5, 55, 0.15)" }} />
                <p className="text-[13px] uppercase font-bold tracking-wider" style={{ color: "rgba(19, 5, 55, 0.4)" }}>
                  Select an account to investigate
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 h-[calc(100vh-148px)] overflow-y-auto pr-1">

              {/* Profile header */}
              <div
                style={{
                  ...cardStyle,
                  borderLeftWidth: "4px",
                  borderLeftColor: RISK[selectedAccount.riskLevel]?.leftBar
                }}
                className="p-5"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-[18px] font-black uppercase tracking-tight" style={{ color: "var(--foreground)" }}>
                      {selectedAccount.accountName}
                    </h2>
                    <p className="font-mono text-[12px] mt-0.5" style={{ color: "rgba(19, 5, 55, 0.4)" }}>
                      {selectedAccount.accountNumber}
                    </p>
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      <Badge variant="outline" className="text-[10px] rounded-none border-border text-slate-600">
                        {selectedAccount.accountType}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] rounded-none border-border text-slate-500">
                        {selectedAccount.branch}
                      </Badge>
                      <Badge variant="outline" className={`text-[10px] rounded-none ${
                        selectedAccount.status === "UNDER_REVIEW"
                          ? "border-amber-500/25 text-amber-400 bg-amber-500/8"
                          : selectedAccount.status === "ACTIVE"
                          ? "border-emerald-500/25 text-emerald-400 bg-emerald-500/8"
                          : "border-violet-500/25 text-violet-400 bg-violet-500/8"
                      }`}>
                        {selectedAccount.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <RiskScore score={liveRiskScore ?? selectedAccount.riskScore} />
                    <p className="text-[9px] font-bold uppercase tracking-wider mt-1" style={{ color: "rgba(19, 5, 55, 0.35)" }}>
                      {scoreLoading ? "Scoring…" : "ML Risk Score"}
                    </p>
                    <Badge variant="outline" className={`mt-1.5 text-[9px] rounded-none ${RISK[liveRiskLevel ?? selectedAccount.riskLevel]?.badge}`}>
                      {liveRiskLevel ?? selectedAccount.riskLevel}
                    </Badge>
                    {liveFlaggedFor.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1 justify-end">
                        {liveFlaggedFor.map(f => (
                          <Badge key={f} variant="outline" className="text-[8px] rounded-none border-red-500/30 text-red-400 bg-red-500/5">
                            {f.replace(/_/g, " ")}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t-2 border-border pt-4">
                  {[
                    ["Balance", `$${selectedAccount.balance.toLocaleString()}`, true],
                    ["Opened", new Date(selectedAccount.openedAt).toLocaleDateString(), false],
                    ["Last Activity", selectedAccount.lastActivity ? new Date(selectedAccount.lastActivity).toLocaleDateString() : "—", false],
                    ["Related Alerts", String(relatedAlerts.length), false],
                  ].map(([label, value, isMono]) => (
                    <div key={String(label)}>
                      <p className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: "rgba(19, 5, 55, 0.4)" }}>
                        {label}
                      </p>
                      <p className={`text-[13px] font-bold ${isMono ? "font-mono text-[#a3e635]" : "text-var(--foreground)"}`}>
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* KYC + Risk Factors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div style={cardStyle} className="p-4">
                  <div className="pb-3 border-b-2 border-border mb-3">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#a3e635]">
                      // KYC Details
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {kyc ? (
                      <>
                        {[
                          ["Customer ID", kyc.customerId],
                          ["ID Type", kyc.idType],
                          ["Nationality", kyc.nationality],
                          ["Occupation", kyc.occupation],
                          ["KYC Level", kyc.kycLevel],
                          ["Last KYC Date", kyc.lastKycDate],
                        ].map(([label, value]) => (
                          <div key={label} className="flex justify-between py-1 border-b border-border/40 last:border-0">
                            <span className="text-[11px]" style={{ color: "rgba(19, 5, 55, 0.45)" }}>{label}</span>
                            <span className="text-[12px] font-bold text-var(--foreground)">{value}</span>
                          </div>
                        ))}
                        <div className="flex justify-between pt-1 border-b border-border/40">
                          <span className="text-[11px]" style={{ color: "rgba(19, 5, 55, 0.45)" }}>PEP Status</span>
                          <Badge variant="outline" className={`text-[9px] rounded-none ${kyc.pepStatus ? "border-red-500/25 text-red-400 bg-red-500/8" : "border-emerald-500/25 text-emerald-400 bg-emerald-500/8"}`}>
                            {kyc.pepStatus ? "YES — PEP" : "CLEAR"}
                          </Badge>
                        </div>
                        <div className="flex justify-between pt-2">
                          <span className="text-[11px]" style={{ color: "rgba(19, 5, 55, 0.45)" }}>Sanction Status</span>
                          <Badge variant="outline" className={`text-[9px] rounded-none ${kyc.sanctionStatus ? "border-red-500/25 text-red-400 bg-red-500/8" : "border-emerald-500/25 text-emerald-400 bg-emerald-500/8"}`}>
                            {kyc.sanctionStatus ? "FLAGGED" : "CLEAR"}
                          </Badge>
                        </div>
                      </>
                    ) : (
                      <p className="text-[12px] italic" style={{ color: "rgba(19, 5, 55, 0.35)" }}>No KYC data available.</p>
                    )}
                  </div>
                </div>

                <div style={cardStyle} className="p-4">
                  <div className="pb-3 border-b-2 border-border mb-3">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#a3e635]">
                      // Risk Factors
                    </h3>
                  </div>
                  <div className="space-y-4">
                    {riskFactors.map((rf) => {
                      const barColor = rf.score >= 80 ? "#EF4444" : rf.score >= 60 ? "#F59E0B" : rf.score >= 40 ? "#EAB308" : "#10B981";
                      return (
                        <div key={rf.factor}>
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-[12px] font-bold text-var(--foreground)">{rf.factor}</span>
                            <span className="text-[11px] font-mono font-bold" style={{ color: barColor }}>{rf.score}</span>
                          </div>
                          <RiskBar score={rf.score} color={barColor} />
                          <p className="text-[11px] mt-1" style={{ color: "rgba(19, 5, 55, 0.45)" }}>{rf.description}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Suspicious Behaviors */}
              {suspiciousBehaviors.length > 0 && (
                <div style={cardStyle} className="p-4">
                  <div className="pb-3 border-b-2 border-border mb-3">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#a3e635] flex items-center gap-2">
                      <AlertTriangle className="h-3.5 w-3.5" style={{ color: "#F59E0B" }} /> // Suspicious Behaviors
                    </h3>
                  </div>
                  <div className="space-y-2.5">
                    {suspiciousBehaviors.map((b, i) => {
                      const r = RISK[b.severity];
                      return (
                        <div
                          key={i}
                          className="p-3 border border-border bg-[#ffffff]"
                          style={{ borderLeft: `3px solid ${r?.leftBar}` }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-[13px] font-bold text-var(--foreground)">{b.behavior}</p>
                            <Badge variant="outline" className={`text-[9px] rounded-none flex-shrink-0 ${r?.badge}`}>{b.severity}</Badge>
                          </div>
                          <p className="text-[12px] mt-1" style={{ color: "rgba(19, 5, 55, 0.5)" }}>{b.details}</p>
                          <p className="text-[11px] mt-1.5 font-mono" style={{ color: "rgba(19, 5, 55, 0.3)" }}>
                            Detected: {new Date(b.detectedAt).toLocaleDateString()}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── SHAP / XAI EXPLANATION PANEL ── */}
              {liveAccountId && (
                <div style={cardStyle} className="p-4">
                  <div className="pb-3 border-b-2 border-border mb-3 flex items-center justify-between">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#a3e635]">
                      // XAI — Why Was This Account Flagged?
                    </h3>
                    {explainLoading && (
                      <span className="text-[10px] text-amber-400 animate-pulse font-mono">Computing SHAP…</span>
                    )}
                  </div>
                  {explainData ? (
                    <div className="space-y-3">
                      <p className="text-[11px]" style={{ color: "rgba(19,5,55,0.5)" }}>
                        SHAP values from {explainData.models_used.length} ML models, ranked by impact.
                        <span className="ml-1 text-red-400">Red = pushes toward fraud.</span>
                        <span className="ml-1 text-emerald-400">Green = mitigating.</span>
                      </p>
                      {explainData.top_risk_factors.slice(0, 8).map((f, i) => {
                        const iRisk = f.direction === "RISK";
                        const pct = Math.min(Math.abs(f.shap_value) * 200, 100);
                        return (
                          <div key={i}>
                            <div className="flex items-center justify-between mb-0.5">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className={`text-[9px] font-bold w-4 flex-shrink-0 ${iRisk ? "text-red-400" : "text-emerald-400"}`}>
                                  {iRisk ? "▲" : "▼"}
                                </span>
                                <span className="text-[11px] font-semibold truncate" style={{ color: "var(--foreground)" }}>
                                  {f.label}
                                </span>
                              </div>
                              <span className={`text-[10px] font-mono font-bold flex-shrink-0 ml-2 ${iRisk ? "text-red-400" : "text-emerald-400"}`}>
                                {f.shap_value > 0 ? "+" : ""}{f.shap_value.toFixed(4)}
                              </span>
                            </div>
                            <div className="h-1.5 rounded-none" style={{ background: "#e8e8e2" }}>
                              <div
                                className="h-1.5 transition-all duration-500"
                                style={{
                                  width: `${pct}%`,
                                  background: iRisk ? "#EF4444" : "#10B981",
                                }}
                              />
                            </div>
                            <p className="text-[9px] mt-0.5 font-mono" style={{ color: "rgba(19,5,55,0.35)" }}>
                              val={String(f.feature_value).slice(0, 12)}  [{f.fraud_type?.replace(/_/g," ")}]
                            </p>
                          </div>
                        );
                      })}
                      {explainData.by_fraud_type.smurfing?.explanation_summary && (
                        <div className="mt-3 p-3" style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.15)" }}>
                          <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "#EF4444" }}>AI Narrative</p>
                          <p className="text-[11px]" style={{ color: "rgba(19,5,55,0.65)" }}>
                            {explainData.by_fraud_type.smurfing?.explanation_summary}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : !explainLoading ? (
                    <p className="text-[12px] italic" style={{ color: "rgba(19,5,55,0.35)" }}>
                      SHAP explanation not available for this account.
                    </p>
                  ) : null}
                </div>
              )}

              <div style={cardStyle} className="overflow-hidden">
                <div className="p-4" style={{ borderBottom: "2px solid var(--border)" }}>
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#a3e635]">
                    // Transaction Timeline
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr style={{ borderBottom: "2px solid var(--border)", backgroundColor: "rgba(19, 5, 55, 0.02)" }}>
                        {["TXN ID", "From → To", "Amount", "Type", "Date", "Status"].map((h, i) => (
                          <th
                            key={i}
                            className={`px-4 py-2.5 text-[9px] font-bold uppercase tracking-wider text-slate-500 ${i === 2 ? "text-right" : "text-left"}`}
                          >
                            // {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {transactions.slice(0, 10).map((txn) => (
                        <tr
                          key={txn.id}
                          className="hover:bg-slate-50 transition-colors"
                          style={txn.flagged ? { borderLeft: "3px solid #EF4444", backgroundColor: "rgba(239,68,68,0.02)" } : {}}
                        >
                          <td className="px-4 py-3 font-mono text-[11px] text-[#a3e635] font-bold">{txn.txnId}</td>
                          <td className="px-4 py-3 font-mono text-[11px]" style={{ color: "rgba(19, 5, 55, 0.6)" }}>{txn.fromAccount} → {txn.toAccount}</td>
                          <td className="px-4 py-3 text-right font-bold font-mono text-var(--foreground)">${txn.amount.toLocaleString()}</td>
                          <td className="px-4 py-3" style={{ color: "rgba(19, 5, 55, 0.6)" }}>{txn.txnType}</td>
                          <td className="px-4 py-3" style={{ color: "rgba(19, 5, 55, 0.5)" }}>{new Date(txn.timestamp).toLocaleDateString()}</td>
                          <td className="px-4 py-3">
                            {txn.flagged ? (
                              <Badge variant="outline" className="bg-red-500/8 text-red-400 border-red-500/25 text-[9px] rounded-none px-1.5 py-0">FLAGGED</Badge>
                            ) : (
                              <Badge variant="outline" className="bg-emerald-500/8 text-emerald-400 border-emerald-500/25 text-[9px] rounded-none px-1.5 py-0">CLEAR</Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                      {transactions.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-[12px] italic" style={{ color: "rgba(19, 5, 55, 0.35)" }}>
                            No transactions found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Investigation Notes */}
              <div style={cardStyle} className="p-4">
                <div className="pb-3 border-b-2 border-border mb-3 flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 text-[#a3e635]" />
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#a3e635]">
                    // Investigation Notes
                  </h3>
                </div>
                <div className="space-y-3">
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {allNotes.length === 0 ? (
                      <p className="text-[12px] italic" style={{ color: "rgba(19, 5, 55, 0.3)" }}>No notes yet.</p>
                    ) : (
                      allNotes.map((note) => (
                        <div key={note.id} className="p-3 border border-border bg-[#ffffff]">
                          <p className="text-[13px] leading-relaxed text-var(--foreground)">{note.content}</p>
                          <div className="flex justify-between mt-2 text-[10px]" style={{ color: "rgba(19, 5, 55, 0.35)" }}>
                            <span className="font-bold">{note.author}</span>
                            <span>{new Date(note.createdAt).toLocaleString()}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="flex gap-2 pt-3 border-t-2 border-border">
                    <Textarea
                      placeholder="Add investigation note…"
                      value={noteContent}
                      onChange={e => setNoteContent(e.target.value)}
                      className="bg-[#ffffff] border-border text-[13px] resize-none h-16 rounded-none focus-visible:ring-0 focus-visible:border-[#a3e635] text-var(--foreground)"
                      style={{ border: "2px solid var(--border)" }}
                    />
                    <button
                      onClick={handleAddNote}
                      disabled={!noteContent.trim()}
                      className="px-4 py-2 font-bold border-2 border-border transition-all hover:bg-[#a3e635] hover:border-[#130537] text-white flex-shrink-0 flex items-center justify-center disabled:opacity-50 disabled:pointer-events-none"
                      style={{ backgroundColor: "var(--border)" }}
                      onMouseEnter={(e) => {
                        if (noteContent.trim()) {
                          (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#a3e635";
                          (e.currentTarget as HTMLButtonElement).style.borderColor = "#a3e635";
                          (e.currentTarget as HTMLButtonElement).style.color = "#130537";
                        }
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--border)";
                        (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
                        (e.currentTarget as HTMLButtonElement).style.color = "white";
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Related Alerts */}
              {relatedAlerts.length > 0 && (
                <div style={cardStyle} className="p-4">
                  <div className="pb-3 border-b-2 border-border mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-3.5 w-3.5" style={{ color: "#F59E0B" }} />
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#a3e635]">
                      // Related Alerts
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {relatedAlerts.map((alert) => {
                      const r = RISK[alert.severity];
                      return (
                        <div
                          key={alert.id}
                          className="flex items-center justify-between p-3 border border-border bg-[#ffffff]"
                          style={{ borderLeft: `3px solid ${r?.leftBar}` }}
                        >
                          <div>
                            <p className="font-mono text-[11px] text-[#a3e635] font-bold">{alert.alertId}</p>
                            <p className="text-[13px] font-bold mt-0.5 text-var(--foreground)">{alert.pattern}</p>
                          </div>
                          <div className="flex items-center gap-2 ml-2">
                            <Badge variant="outline" className={`text-[9px] rounded-none ${r?.badge}`}>{alert.severity}</Badge>
                            <span className="text-[13px] font-mono font-bold text-var(--foreground)">${(alert.amount / 1000).toFixed(0)}K</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
