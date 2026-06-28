import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle, Search, X, Clock, User,
  ChevronRight, ChevronDown, CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  staticAlerts,
  getTimelineByAlertId,
  getTransactionsByAccountId,
  type Alert,
} from "@/data/staticData";

/* ── STYLES ── */
const SEV: Record<string, { badge: string; dot: string; leftBar: string; drawerBg: string }> = {
  CRITICAL: {
    badge: "bg-red-500/10 text-red-400 border-red-500/25",
    dot: "bg-red-500",
    leftBar: "#EF4444",
    drawerBg: "border-red-500/20",
  },
  HIGH: {
    badge: "bg-amber-500/10 text-amber-400 border-amber-500/25",
    dot: "bg-amber-500",
    leftBar: "#F59E0B",
    drawerBg: "border-amber-500/20",
  },
  MEDIUM: {
    badge: "bg-yellow-500/10 text-yellow-400 border-yellow-500/25",
    dot: "bg-yellow-400",
    leftBar: "#EAB308",
    drawerBg: "border-yellow-500/20",
  },
  LOW: {
    badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
    dot: "bg-emerald-500",
    leftBar: "#10B981",
    drawerBg: "border-emerald-500/20",
  },
};

const STATUS: Record<string, string> = {
  OPEN: "bg-red-500/10 text-red-400 border-red-500/25",
  UNDER_INVESTIGATION: "bg-violet-500/10 text-violet-400 border-violet-500/25",
  CLOSED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
};

const TL_ICONS: Record<string, typeof Clock> = {
  ALERT_CREATED: AlertTriangle,
  ASSIGNED: User,
  STATUS_CHANGED: CheckCircle2,
  NOTE_ADDED: ChevronRight,
  DOCUMENT_ADDED: ChevronRight,
};

const cardStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  border: "2px solid #130537",
  borderRadius: 0,
  boxShadow: "6px 6px 0px #130537",
};

export default function Alerts() {
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState("");
  const [status, setStatus] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [statusOverrides, setStatusOverrides] = useState<Record<number, string>>({});

  const handleOpen = (id: number) => {
    setSelectedId(id);
    setDrawerOpen(true);
    setShowTimeline(false);
  };

  const filteredAlerts = staticAlerts.filter(a => {
    const effectiveStatus = statusOverrides[a.id] ?? a.status;
    const matchSeverity = !severity || severity === "ALL" || a.severity === severity;
    const matchStatus = !status || status === "ALL" || effectiveStatus === status;
    const matchSearch = !search || [a.alertId, a.accountName, a.pattern].some(f =>
      f.toLowerCase().includes(search.toLowerCase())
    );
    return matchSeverity && matchStatus && matchSearch;
  });

  const alerts = filteredAlerts;
  const alertDetail = selectedId ? staticAlerts.find(a => a.id === selectedId) : null;
  const timeline = selectedId ? getTimelineByAlertId(selectedId) : [];
  const relatedTransactions = alertDetail ? getTransactionsByAccountId(alertDetail.accountId) : [];

  return (
    <div className="p-6 space-y-5 min-h-screen" style={{ backgroundColor: "var(--background)" }}>

      {/* ── HEADER ── */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div
          className="flex items-center justify-between p-5 mb-2"
          style={cardStyle}
        >
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] mb-1" style={{ color: "#a3e635" }}>
              // Alert Intelligence
            </p>
            <h1 className="text-2xl font-black uppercase tracking-tight" style={{ color: "var(--foreground)" }}>
              Alert Center
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>
              Monitor, investigate and resolve fraud alerts across all accounts
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── FILTERS ── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.08 }}>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: "rgba(232,232,226,0.3)" }} />
            <Input
              placeholder="Search by account, pattern, or alert ID…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 text-[13px] h-9 rounded-none"
              style={{
                backgroundColor: "var(--card)",
                border: "2px solid var(--border)",
                color: "var(--foreground)",
              }}
            />
          </div>
          <Select value={severity} onValueChange={setSeverity}>
            <SelectTrigger
              className="w-full sm:w-38 text-[13px] h-9 rounded-none"
              style={{ backgroundColor: "var(--card)", border: "2px solid var(--border)", color: "var(--foreground)" }}
            >
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Severities</SelectItem>
              <SelectItem value="CRITICAL">Critical</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger
              className="w-full sm:w-48 text-[13px] h-9 rounded-none"
              style={{ backgroundColor: "var(--card)", border: "2px solid var(--border)", color: "var(--foreground)" }}
            >
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="OPEN">Open</SelectItem>
              <SelectItem value="UNDER_INVESTIGATION">Under Investigation</SelectItem>
              <SelectItem value="CLOSED">Closed</SelectItem>
            </SelectContent>
          </Select>
          {(severity || status || search) && (
            <button
              onClick={() => { setSeverity(""); setStatus(""); setSearch(""); }}
              className="flex items-center gap-1 px-3 h-9 text-[12px] font-bold uppercase tracking-widest transition-colors"
              style={{ border: "2px solid var(--border)", color: "rgba(19, 5, 55, 0.5)", backgroundColor: "transparent" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#a3e635"; (e.currentTarget as HTMLButtonElement).style.color = "#a3e635"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(19, 5, 55, 0.5)"; }}
            >
              <X className="h-3.5 w-3.5 mr-1" /> Clear
            </button>
          )}
        </div>
      </motion.div>

      {/* ── SUMMARY BADGES ── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.12 }}
        className="flex gap-2.5 flex-wrap items-center">
        <span className="text-[12px] font-bold uppercase tracking-widest" style={{ color: "rgba(19, 5, 55, 0.45)" }}>
          {staticAlerts.length} alerts total
        </span>
        {["CRITICAL", "HIGH", "MEDIUM", "LOW"].map(sev => {
          const count = alerts.filter(a => a.severity === sev).length;
          if (!count) return null;
          return (
            <Badge key={sev} variant="outline" className={`${SEV[sev]?.badge} border text-[11px] px-2 rounded-none`}>
              {count} {sev}
            </Badge>
          );
        })}
      </motion.div>

      {/* ── TABLE ── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.16 }}>
        <div style={cardStyle}>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border)", backgroundColor: "rgba(19, 5, 55, 0.02)" }}>
                  {["// Alert ID", "// Account", "// Pattern", "// Severity", "// Status", "// Amount", "// Assignee", "// Date", ""].map((h, i) => (
                    <th
                      key={i}
                      className={`px-4 py-2.5 text-[9px] font-bold uppercase tracking-widest ${i >= 5 && i < 8 ? "text-right" : "text-left"}`}
                      style={{ color: "rgba(19, 5, 55, 0.45)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {alerts.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-[13px]" style={{ color: "rgba(19, 5, 55, 0.5)" }}>
                      No alerts match the current filters.
                    </td>
                  </tr>
                ) : (
                  alerts.map((alert, i) => {
                    const s = SEV[alert.severity];
                    const effectiveStatus = statusOverrides[alert.id] ?? alert.status;
                    return (
                      <motion.tr
                        key={alert.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.025 }}
                        className="cursor-pointer group transition-colors"
                        style={{ borderLeft: `3px solid ${s?.leftBar ?? "transparent"}`, borderBottom: "1px solid var(--border)" }}
                        onClick={() => handleOpen(alert.id)}
                        onMouseEnter={(e) => (e.currentTarget as HTMLTableRowElement).style.backgroundColor = "rgba(19, 5, 55, 0.03)"}
                        onMouseLeave={(e) => (e.currentTarget as HTMLTableRowElement).style.backgroundColor = "transparent"}
                      >
                        <td className="px-4 py-3 font-mono text-[11px]" style={{ color: "#a3e635" }}>{alert.alertId}</td>
                        <td className="px-4 py-3">
                          <p className="font-semibold" style={{ color: "var(--foreground)" }}>{alert.accountName}</p>
                          <p className="text-[11px] font-mono" style={{ color: "rgba(19, 5, 55, 0.4)" }}>{alert.accountNumber}</p>
                        </td>
                        <td className="px-4 py-3" style={{ color: "rgba(19, 5, 55, 0.5)" }}>{alert.pattern}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className={`h-1.5 w-1.5 rounded-full ${s?.dot}`} />
                            <Badge variant="outline" className={`${s?.badge} border text-[10px] px-1.5 py-0 rounded-none`}>
                              {alert.severity}
                            </Badge>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={`${STATUS[effectiveStatus] ?? ""} border text-[10px] px-1.5 py-0 rounded-none`}>
                            {effectiveStatus.replace("_", " ")}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right font-black tabular-nums font-mono text-[12px]" style={{ color: "var(--foreground)" }}>
                          ${(alert.amount / 1000).toFixed(0)}K
                        </td>
                        <td className="px-4 py-3 text-[12px]" style={{ color: "rgba(19, 5, 55, 0.5)" }}>
                          {alert.assignee ?? <span style={{ color: "rgba(19, 5, 55, 0.35)", fontStyle: "italic" }}>Unassigned</span>}
                        </td>
                        <td className="px-4 py-3 text-[11px] tabular-nums" style={{ color: "rgba(19, 5, 55, 0.4)" }}>
                          {new Date(alert.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <ChevronRight className="h-3.5 w-3.5 transition-colors" style={{ color: "rgba(19, 5, 55, 0.25)" }} />
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>

      {/* ── DETAIL DRAWER ── */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent
          className="w-full sm:max-w-[500px] overflow-y-auto p-0"
          style={{ backgroundColor: "var(--card)", borderLeft: "2px solid var(--border)" }}
        >
          {!alertDetail ? (
            <div className="p-6 text-[13px]" style={{ color: "var(--muted-foreground)" }}>Loading…</div>
          ) : (
            <>
              {/* Severity header */}
              {(() => {
                const s = SEV[alertDetail.severity];
                const effectiveStatus = statusOverrides[alertDetail.id] ?? alertDetail.status;
                return (
                  <div
                    className="p-5"
                    style={{
                      borderLeft: `4px solid ${s?.leftBar}`,
                      borderBottom: "2px solid var(--border)",
                      backgroundColor: "var(--card)",
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-mono text-[11px] mb-1" style={{ color: "var(--color-primary)" }}>{alertDetail.alertId}</p>
                        <p className="font-black text-[18px] uppercase leading-tight" style={{ color: "var(--foreground)" }}>{alertDetail.accountName}</p>
                        <p className="text-[13px] font-mono mt-1" style={{ color: "var(--muted-foreground)" }}>{alertDetail.accountNumber}</p>
                      </div>
                      <div className="flex flex-col gap-1.5 items-end mt-1">
                        <Badge variant="outline" className={`${s?.badge} border text-[11px] rounded-none`}>
                          {alertDetail.severity}
                        </Badge>
                        <Badge variant="outline" className={`${STATUS[effectiveStatus] ?? ""} border text-[10px] rounded-none`}>
                          {effectiveStatus.replace("_", " ")}
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="p-5 space-y-5">
                {/* Details grid */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ["Pattern", alertDetail.pattern],
                    ["Amount", `$${alertDetail.amount.toLocaleString()}`],
                    ["Assignee", alertDetail.assignee ?? "Unassigned"],
                    ["Created", new Date(alertDetail.createdAt).toLocaleString()],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="p-3"
                      style={{ border: "2px solid var(--border)", backgroundColor: "var(--card)" }}
                    >
                      <p className="text-[9px] font-bold uppercase tracking-[0.25em] mb-1" style={{ color: "var(--muted-foreground)" }}>
                        // {label}
                      </p>
                      <p className="text-[13px] font-semibold" style={{ color: "var(--foreground)" }}>{value}</p>
                    </div>
                  ))}
                </div>

                {alertDetail.description && (
                  <div className="p-3" style={{ border: "2px solid var(--border)", backgroundColor: "var(--card)" }}>
                    <p className="text-[9px] font-bold uppercase tracking-[0.25em] mb-1.5" style={{ color: "var(--muted-foreground)" }}>
                      // Description
                    </p>
                    <p className="text-[13px] leading-relaxed" style={{ color: "var(--foreground)" }}>{alertDetail.description}</p>
                  </div>
                )}

                {/* Status actions */}
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.25em] mb-2" style={{ color: "var(--muted-foreground)" }}>
                    // Update Status
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {["OPEN", "UNDER_INVESTIGATION", "CLOSED"].map(s => {
                      const current = statusOverrides[alertDetail.id] ?? alertDetail.status;
                      const isActive = current === s;
                      return (
                        <button
                          key={s}
                          onClick={() => setStatusOverrides(prev => ({ ...prev, [alertDetail.id]: s }))}
                          className="text-[11px] font-bold uppercase tracking-widest px-3 py-1.5 transition-colors"
                          style={{
                            border: `2px solid ${isActive ? "var(--color-primary)" : "var(--border)"}`,
                            backgroundColor: isActive ? "rgba(163,230,53,0.1)" : "transparent",
                            color: isActive ? "var(--color-primary)" : "var(--muted-foreground)",
                          }}
                        >
                          {s.replace("_", " ")}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Related transactions */}
                {relatedTransactions.length > 0 && (
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.25em] mb-2.5" style={{ color: "var(--muted-foreground)" }}>
                      // Related Transactions
                    </p>
                    <div className="space-y-2">
                      {relatedTransactions.slice(0, 5).map((txn) => (
                        <div
                          key={txn.id}
                          className="p-3 flex justify-between items-start"
                          style={{ border: "2px solid var(--border)", backgroundColor: "var(--card)" }}
                        >
                          <div>
                            <p className="font-mono text-[11px] mb-1" style={{ color: "var(--color-primary)" }}>{txn.txnId}</p>
                            <p className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>{txn.fromAccount} → {txn.toAccount}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-black text-[13px] tabular-nums" style={{ color: "var(--foreground)" }}>${txn.amount.toLocaleString()}</p>
                            <p className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>{txn.txnType}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Timeline */}
                <div>
                  <button
                    onClick={() => setShowTimeline(!showTimeline)}
                    className="flex items-center justify-between w-full text-[9px] font-bold uppercase tracking-[0.25em] pb-2"
                    style={{ color: "var(--muted-foreground)", borderBottom: "2px solid var(--border)" }}
                  >
                    // Investigation Timeline
                    {showTimeline ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                  </button>
                  <AnimatePresence>
                    {showTimeline && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3"
                      >
                        {timeline.length === 0 ? (
                          <p className="text-[12px] italic" style={{ color: "var(--muted-foreground)" }}>No timeline events yet.</p>
                        ) : (
                          <div className="relative pl-5">
                            <div className="absolute left-2 top-0 bottom-0 w-px" style={{ backgroundColor: "rgba(232,232,226,0.15)" }} />
                            {timeline.map((event) => {
                              const Icon = TL_ICONS[event.eventType] ?? Clock;
                              return (
                                <div key={event.id} className="relative pb-4">
                                  <div
                                    className="absolute -left-3.5 top-1 h-3.5 w-3.5 flex items-center justify-center"
                                    style={{ backgroundColor: "rgba(163,230,53,0.1)", border: "1px solid rgba(163,230,53,0.3)" }}
                                  >
                                    <Icon className="h-2 w-2" style={{ color: "#a3e635" }} />
                                  </div>
                                  <div className="ml-2">
                                    <p className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>{new Date(event.timestamp).toLocaleString()}</p>
                                    <p className="text-[13px] font-semibold mt-0.5" style={{ color: "var(--foreground)" }}>{event.description}</p>
                                    <p className="text-[11px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>{event.actor}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
