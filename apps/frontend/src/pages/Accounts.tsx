import { useState } from "react";
import { motion } from "framer-motion";
import {
  Search, Shield, AlertTriangle, FileText, Plus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getKycByAccountId,
  getTransactionsByAccountId,
  getAlertsByAccountId,
  getRiskFactors,
  getSuspiciousBehaviors,
  type InvestigationNote,
} from "@/data/staticData";
import { useScore, useExplain, useAccounts, useAccountNotes } from "@/hooks/useApi";
import { addAccountNote } from "@/lib/api";

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
        <circle cx="22" cy="22" r="17" fill="none" stroke="var(--color-secondary)" strokeWidth="3" />
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
    <div className="h-1.5 w-full border border-border bg-muted/40 overflow-hidden">
      <div className="h-full transition-all duration-500" style={{ width: `${score}%`, backgroundColor: color }} />
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  backgroundColor: "var(--color-card)",
  border: "2px solid var(--color-border)",
  borderRadius: 0,
  boxShadow: "6px 6px 0px var(--color-border)",
};

export default function Accounts() {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [noteContent, setNoteContent] = useState("");
  const [localNotes, setLocalNotes] = useState<InvestigationNote[]>([]);

  const { data: liveAccounts, loading: accountsLoading } = useAccounts(300);

  const mergedAccounts = liveAccounts?.length
    ? liveAccounts.map((a, i) => ({
        id: i + 1,
        accountName: a.customer_name || a.account_id,
        accountNumber: a.account_id,
        accountType: a.account_type || "Corporate Checking",
        riskLevel: (a.risk_category || "HIGH").toUpperCase() as "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
        riskScore: a.is_fraud ? 88 : 45,
        status: (a.status || "ACTIVE") as "ACTIVE" | "RESTRICTED" | "SUSPENDED" | "CLOSED",
        balance: a.current_balance || a.avg_monthly_volume || 142000,
        kycTier: (a.kyc_tier || 2) as 1 | 2 | 3,
        branch: a.branch_name || a.branch_code || "Main Branch",
        openedAt: a.opened_on || "2025-01-15",
        lastActivity: "2026-06-28",
      }))
    : [];

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

  const { data: apiNotes, refetch: refetchNotes } = useAccountNotes(liveAccountId);

  const kyc = selectedId ? getKycByAccountId(selectedId) : undefined;
  const transactions = selectedId ? getTransactionsByAccountId(selectedId) : [];
  const relatedAlerts = selectedId ? getAlertsByAccountId(selectedId) : [];
  const riskFactors = selectedAccount ? getRiskFactors(selectedAccount) : [];
  const suspiciousBehaviors = selectedAccount ? getSuspiciousBehaviors(selectedAccount) : [];

  // Override static risk with live ML score
  const liveRiskLevel = scoreData?.risk_level ?? selectedAccount?.riskLevel;
  const liveRiskScore = scoreData ? Math.round(scoreData.combined_score * 100) : selectedAccount?.riskScore;
  const liveFlaggedFor = scoreData?.flagged_for ?? [];

  const allNotes = (apiNotes || []).map((n, i) => ({
    id: n.id || i,
    accountId: selectedId || 0,
    content: n.content,
    author: n.author,
    createdAt: n.created_at,
  })).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const handleAddNote = async () => {
    if (!liveAccountId || !noteContent.trim()) return;
    await addAccountNote(liveAccountId, noteContent.trim(), "FINnet Investigator");
    setNoteContent("");
    refetchNotes();
  };

  return (
    <div className="p-6 space-y-5 min-h-screen bg-background text-foreground">
      {/* ── HEADER ── */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="p-5" style={cardStyle}>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] mb-1 text-primary">
            // Account Intelligence
          </p>
          <h1 className="text-2xl font-black uppercase tracking-tight text-foreground">
            Account Investigation
          </h1>
          <p className="text-xs mt-0.5 text-muted-foreground">
            Deep-dive analysis of customer accounts and transaction behavior
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* ── ACCOUNT LIST ── */}
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 }}>
          <div style={cardStyle} className="h-[calc(100vh-148px)] flex flex-col">
            <div className="p-4 flex-shrink-0 border-b-2 border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                  // Accounts
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {filteredAccounts.length} total
                </span>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
                <Input
                  placeholder="Search accounts…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 text-[12px] h-9 rounded-none bg-card border-2 border-border text-foreground focus-visible:ring-0 focus-visible:border-primary"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto space-y-1 p-3">
              {accountsLoading && !liveAccounts ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-none mb-2 border border-border" />
                ))
              ) : filteredAccounts.length === 0 ? (
                <p className="text-center text-xs py-8 text-muted-foreground">No accounts found.</p>
              ) : (
                filteredAccounts.map(acc => {
                  const r = RISK[acc.riskLevel ?? "LOW"];
                  const isSelected = selectedId === acc.id;
                  return (
                    <div
                      key={acc.id}
                      onClick={() => setSelectedId(acc.id)}
                      className="p-3 cursor-pointer transition-all border-2"
                      style={{
                        backgroundColor: isSelected ? "rgba(163,230,53,0.06)" : "var(--color-card)",
                        borderColor: isSelected ? "var(--color-primary)" : "var(--color-border)",
                        borderLeft: `4px solid ${r?.leftBar}`,
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="min-w-0">
                          <p className="text-[13px] font-bold uppercase tracking-tight animate-none text-foreground">
                            {acc.accountName}
                          </p>
                          <p className="text-[11px] font-mono mt-0.5 text-muted-foreground">
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
                })
              )}
            </div>
          </div>
        </motion.div>

        {/* ── ACCOUNT DETAIL ── */}
        <motion.div className="xl:col-span-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.16 }}>
          {!selectedAccount ? (
            <div className="h-[calc(100vh-148px)] flex items-center justify-center" style={cardStyle}>
              <div className="text-center">
                <Shield className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-[13px] uppercase font-bold tracking-wider text-muted-foreground">
                  Select an account to investigate
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6 h-[calc(100vh-148px)] overflow-y-auto pr-2 pb-6">

              {/* Profile header */}
              <div
                style={{
                  ...cardStyle,
                  borderLeftWidth: "6px",
                  borderLeftColor: RISK[selectedAccount.riskLevel]?.leftBar
                }}
                className="p-5"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-[18px] font-black uppercase tracking-tight text-foreground">
                      {selectedAccount.accountName}
                    </h2>
                    <p className="font-mono text-[11px] mt-0.5 text-muted-foreground">
                      {selectedAccount.accountNumber}
                    </p>
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-wider rounded-none border-border text-muted-foreground">
                        {selectedAccount.accountType}
                      </Badge>
                      <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-wider rounded-none border-border text-muted-foreground">
                        {selectedAccount.branch}
                      </Badge>
                      <Badge variant="outline" className={`text-[9px] font-bold uppercase tracking-wider rounded-none ${
                        selectedAccount.status === "UNDER_REVIEW"
                          ? "border-amber-500/25 text-amber-500 bg-amber-500/8"
                          : selectedAccount.status === "ACTIVE"
                          ? "border-emerald-500/25 text-emerald-500 bg-emerald-500/8"
                          : "border-violet-500/25 text-violet-500 bg-violet-500/8"
                      }`}>
                        {selectedAccount.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <RiskScore score={liveRiskScore ?? selectedAccount.riskScore} />
                    <p className="text-[9px] font-bold uppercase tracking-wider mt-1 text-muted-foreground/60">
                      {scoreLoading ? "Scoring…" : "ML Risk Score"}
                    </p>
                    <Badge variant="outline" className={`mt-1.5 text-[9px] rounded-none ${RISK[liveRiskLevel ?? selectedAccount.riskLevel]?.badge}`}>
                      {liveRiskLevel ?? selectedAccount.riskLevel}
                    </Badge>
                    {liveFlaggedFor.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1 justify-end">
                        {liveFlaggedFor.map(f => (
                          <Badge key={f} variant="outline" className="text-[8px] rounded-none border-red-500/30 text-red-500 bg-red-500/5">
                            {f.replace(/_/g, " ")}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t-2 border-border pt-4">
                  {[
                    ["Balance", `₹${selectedAccount.balance.toLocaleString()}`, true],
                    ["Opened", !selectedAccount.openedAt || isNaN(new Date(selectedAccount.openedAt).getTime()) ? (selectedAccount.openedAt || "01/15/2025") : new Date(selectedAccount.openedAt).toLocaleDateString(), false],
                    ["Last Activity", !selectedAccount.lastActivity || isNaN(new Date(selectedAccount.lastActivity).getTime()) ? (selectedAccount.lastActivity || "06/28/2026") : new Date(selectedAccount.lastActivity).toLocaleDateString(), false],
                    ["Related Alerts", String(relatedAlerts.length), false],
                  ].map(([label, value, isMono]) => (
                    <div key={String(label)}>
                      <p className="text-[9px] font-bold uppercase tracking-wider mb-1 text-muted-foreground">
                        {label}
                      </p>
                      <p className={`text-[13px] font-bold ${isMono ? "font-mono text-foreground" : "text-foreground"}`}>
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
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-primary">
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
                            <span className="text-[11px] text-muted-foreground">{label}</span>
                            <span className="text-[11px] font-bold text-foreground">{value}</span>
                          </div>
                        ))}
                        <div className="flex justify-between pt-1 border-b border-border/40">
                          <span className="text-[11px] text-muted-foreground">PEP Status</span>
                          <Badge variant="outline" className={`text-[9px] rounded-none ${kyc.pepStatus ? "border-red-500/25 text-red-500 bg-red-500/8" : "border-emerald-500/25 text-emerald-400 bg-emerald-500/8"}`}>
                            {kyc.pepStatus ? "YES — PEP" : "CLEAR"}
                          </Badge>
                        </div>
                        <div className="flex justify-between pt-2">
                          <span className="text-[11px] text-muted-foreground">Sanction Status</span>
                          <Badge variant="outline" className={`text-[9px] rounded-none ${kyc.sanctionStatus ? "border-red-500/25 text-red-500 bg-red-500/8" : "border-emerald-500/25 text-emerald-400 bg-emerald-500/8"}`}>
                            {kyc.sanctionStatus ? "FLAGGED" : "CLEAR"}
                          </Badge>
                        </div>
                      </>
                    ) : (
                      <p className="text-[12px] italic text-muted-foreground/60">No KYC data available.</p>
                    )}
                  </div>
                </div>

                <div style={cardStyle} className="p-4">
                  <div className="pb-3 border-b-2 border-border mb-3">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-primary">
                      // Risk Factors
                    </h3>
                  </div>
                  <div className="space-y-4">
                    {riskFactors.map((rf) => {
                      const barColor = rf.score >= 80 ? "#EF4444" : rf.score >= 60 ? "#F59E0B" : rf.score >= 40 ? "#EAB308" : "#10B981";
                      return (
                        <div key={rf.factor}>
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-[11px] font-bold text-foreground">{rf.factor}</span>
                            <span className="text-[11px] font-mono font-bold" style={{ color: barColor }}>{rf.score}</span>
                          </div>
                          <RiskBar score={rf.score} color={barColor} />
                          <p className="text-[11px] mt-1 text-muted-foreground">{rf.description}</p>
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
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> // Suspicious Behaviors
                    </h3>
                  </div>
                  <div className="space-y-2.5">
                    {suspiciousBehaviors.map((b, i) => {
                      const r = RISK[b.severity];
                      return (
                        <div
                          key={i}
                          className="p-3 border border-border bg-card"
                          style={{ borderLeft: `4px solid ${r?.leftBar}` }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-[12px] font-bold text-foreground">{b.behavior}</p>
                            <Badge variant="outline" className={`text-[9px] rounded-none flex-shrink-0 ${r?.badge}`}>{b.severity}</Badge>
                          </div>
                          <p className="text-[11px] mt-1 text-muted-foreground">{b.details}</p>
                          <p className="text-[10px] mt-1.5 font-mono text-muted-foreground/60">
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
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-primary">
                      // XAI — Why Was This Account Flagged?
                    </h3>
                    {explainLoading && (
                      <span className="text-[10px] text-amber-400 animate-pulse font-mono">Computing SHAP…</span>
                    )}
                  </div>
                  {explainData ? (
                    <div className="space-y-3">
                      <p className="text-[11px] text-muted-foreground">
                        SHAP values from {explainData.models_used.length} ML models, ranked by impact.
                        <span className="ml-1 text-red-500 font-semibold">Red = pushes toward fraud.</span>
                        <span className="ml-1 text-emerald-600 font-semibold">Green = mitigating.</span>
                      </p>
                      {explainData.top_risk_factors.slice(0, 8).map((f, i) => {
                        const iRisk = f.direction === "RISK";
                        const pct = Math.min(Math.abs(f.shap_value) * 200, 100);
                        return (
                          <div key={i}>
                            <div className="flex items-center justify-between mb-0.5">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className={`text-[9px] font-bold w-4 flex-shrink-0 ${iRisk ? "text-red-500" : "text-emerald-500"}`}>
                                  {iRisk ? "▲" : "▼"}
                                </span>
                                <span className="text-[11px] font-bold truncate text-foreground">
                                  {f.label}
                                </span>
                              </div>
                              <span className={`text-[10px] font-mono font-bold flex-shrink-0 ml-2 ${iRisk ? "text-red-500" : "text-emerald-500"}`}>
                                {f.shap_value > 0 ? "+" : ""}{f.shap_value.toFixed(4)}
                              </span>
                            </div>
                            <div className="h-2 rounded-none border border-border bg-muted/40 overflow-hidden">
                              <div
                                className="h-full transition-all duration-500"
                                style={{
                                  width: `${pct}%`,
                                  backgroundColor: iRisk ? "#EF4444" : "#10B981",
                                }}
                              />
                            </div>
                            <p className="text-[9px] mt-0.5 font-mono text-muted-foreground/60">
                              val={String(f.feature_value).slice(0, 12)}  [{f.fraud_type?.replace(/_/g," ")}]
                            </p>
                          </div>
                        );
                      })}
                      {explainData.by_fraud_type.smurfing?.explanation_summary && (
                        <div className="mt-3 p-3 border border-red-500/20 bg-red-500/5">
                          <p className="text-[10px] font-bold uppercase tracking-wider mb-1 text-red-500">AI Narrative</p>
                          <p className="text-[11px] text-muted-foreground">
                            {explainData.by_fraud_type.smurfing?.explanation_summary}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : !explainLoading ? (
                    <p className="text-[12px] italic text-muted-foreground/60">
                      SHAP explanation not available for this account.
                    </p>
                  ) : null}
                </div>
              )}

              {/* Transaction Timeline */}
              <div style={cardStyle} className="overflow-hidden">
                <div className="p-4 bg-muted/10" style={{ borderBottom: "2px solid var(--color-border)" }}>
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-primary">
                    // Transaction Timeline
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead className="bg-muted/50 border-b border-border text-foreground">
                      <tr>
                        {["TXN ID", "From → To", "Amount", "Type", "Date", "Status"].map((h, i) => (
                          <th
                            key={i}
                            className={`px-4 py-2.5 font-bold uppercase tracking-wider ${i === 2 ? "text-right" : "text-left"}`}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {transactions.slice(0, 10).map((txn) => (
                        <tr
                          key={txn.id}
                          className="transition-colors hover:bg-primary/5"
                          style={txn.flagged ? { borderLeft: "4px solid #EF4444", backgroundColor: "rgba(239,68,68,0.02)" } : {}}
                        >
                          <td className="px-4 py-3 font-mono text-[11px] text-primary font-bold">{txn.txnId}</td>
                          <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">{txn.fromAccount} → {txn.toAccount}</td>
                          <td className="px-4 py-3 text-right font-bold font-mono text-foreground">₹{txn.amount.toLocaleString()}</td>
                          <td className="px-4 py-3 text-muted-foreground">{txn.txnType}</td>
                          <td className="px-4 py-3 text-muted-foreground">{new Date(txn.timestamp).toLocaleDateString()}</td>
                          <td className="px-4 py-3">
                            {txn.flagged ? (
                              <Badge variant="outline" className="bg-red-500/8 text-red-500 border-red-500/25 text-[9px] rounded-none px-1.5 py-0">FLAGGED</Badge>
                            ) : (
                              <Badge variant="outline" className="bg-emerald-500/8 text-emerald-400 border-emerald-500/25 text-[9px] rounded-none px-1.5 py-0">CLEAR</Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                      {transactions.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-xs italic text-muted-foreground/60">
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
                  <FileText className="h-3.5 w-3.5 text-primary" />
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-primary">
                    // Investigation Notes
                  </h3>
                </div>
                <div className="space-y-3">
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {allNotes.length === 0 ? (
                      <p className="text-[12px] italic text-muted-foreground/60">No notes yet.</p>
                    ) : (
                      allNotes.map((note) => (
                        <div key={note.id} className="p-3 border border-border bg-card">
                          <p className="text-[12px] leading-relaxed text-foreground">{note.content}</p>
                          <div className="flex justify-between mt-2 text-[10px] text-muted-foreground/60">
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
                      className="bg-card border-border text-[12px] resize-none h-16 rounded-none focus-visible:ring-0 focus-visible:border-primary text-foreground"
                      style={{ border: "2px solid var(--color-border)" }}
                    />
                    <button
                      onClick={handleAddNote}
                      disabled={!noteContent.trim()}
                      className="px-4 py-2 font-bold border-2 border-border transition-all hover:bg-primary hover:border-border text-white flex-shrink-0 flex items-center justify-center disabled:opacity-50 disabled:pointer-events-none"
                      style={{ backgroundColor: "var(--color-border)", borderColor: "var(--color-border)" }}
                      onMouseEnter={(e) => {
                        if (noteContent.trim()) {
                          (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--color-primary)";
                          (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-border)";
                          (e.currentTarget as HTMLButtonElement).style.color = "var(--color-primary-foreground)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--color-border)";
                        (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-border)";
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
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-primary">
                      // Related Alerts
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {relatedAlerts.map((alert) => {
                      const r = RISK[alert.severity];
                      return (
                        <div
                          key={alert.id}
                          className="flex items-center justify-between p-3 border border-border bg-card"
                          style={{ borderLeft: `4px solid ${r?.leftBar}` }}
                        >
                          <div>
                            <p className="font-mono text-[11px] text-primary font-bold">{alert.alertId}</p>
                            <p className="text-[12px] font-bold mt-0.5 text-foreground">{alert.pattern}</p>
                          </div>
                          <div className="flex items-center gap-2 ml-2">
                            <Badge variant="outline" className={`text-[9px] rounded-none ${r?.badge}`}>{alert.severity}</Badge>
                            <span className="text-[12px] font-mono font-bold text-foreground">₹{(alert.amount / 1000).toFixed(0)}K</span>
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
