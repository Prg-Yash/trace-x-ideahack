import { useState, useEffect, useRef, useMemo, type CSSProperties, type MouseEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle, Search, X, Clock, User,
  ChevronRight, ChevronDown, CheckCircle2, Network, Shield,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getTimelineByAlertId,
  getTransactionsByAccountId,
  type Alert,
} from "@/data/staticData";
import { getInvestigationAlertById } from "@/data/investigationData";
import { useInvestigation } from "@/context/InvestigationContext";
import { useAlertsQuick, useTrace } from "@/hooks/useApi";

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

const cardStyle: CSSProperties = {
  backgroundColor: "#ffffff",
  border: "2px solid #130537",
  borderRadius: 0,
  boxShadow: "6px 6px 0px #130537",
};

/* ── Alert Detail Drawer Theme ── */
const DRAWER = {
  bg: "#141820",
  surface: "#1A1F27",
  border: "#2A2F35",
  text: "#E8E8E2",
  textMuted: "rgba(232,232,226,0.45)",
  label: "rgba(163,230,53,0.55)",
  accent: "#a3e635",
  accentDark: "#130537",
} as const;

function DrawerDivider() {
  return <div style={{ height: 1, backgroundColor: DRAWER.border }} />;
}

function DrawerSectionLabel({ children }: { children: ReactNode }) {
  return (
    <p
      className="text-[8px] font-bold uppercase tracking-[0.22em] mb-3"
      style={{ color: DRAWER.label }}
    >
      {children}
    </p>
  );
}

export default function Alerts() {
  const [, navigate] = useLocation();
  const { setInvestigation } = useInvestigation();
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState("");
  const [status, setStatus] = useState("OPEN");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [statusOverrides, setStatusOverrides] = useState<Record<number, string>>({});

  const [optimisticAlerts, setOptimisticAlerts] = useState<Alert[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  // Live API data
  const { data: liveAlertsData, loading: alertsLoading, refetch: refetchAlerts } = useAlertsQuick(200);

  useEffect(() => {
    let reconnectTimeout: ReturnType<typeof setTimeout>;

    function connect() {
      const wsUrl = import.meta.env.VITE_WS_URL || "ws://localhost:8000/api/v1/ws";
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket connected for Demo Injector updates.");
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (!payload) return;

          if (payload.event === "STAGE_UPDATE") {
            const data = payload.data;
            toast.info(`Stage ${data.stage}: ${data.message}`);
          }
          else if (payload.event === "NEW_ALERT") {
            const data = payload.data;
            toast.success(`Demo Injection Complete! Alert ${data.alert_id} generated.`);

            // Construct optimistic alert
            const newAlert: Alert = {
              id: Date.now(), // temporary unique id
              alertId: data.alert_id,
              accountId: data.account_ids ? data.account_ids[0] : "unknown",
              severity: data.severity || data.tier || "CRITICAL",
              status: "OPEN",
              pattern: data.pattern || "LAYERING",
              amount: data.total_amount ?? Math.round((data.fraud_prob || data.fraud_probability || 0.95) * 500000),
              assignee: null,
              description: `Live Injection: ${data.pattern}`,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              accountName: data.account_ids ? data.account_ids[0] : "unknown",
              accountNumber: data.account_ids ? data.account_ids[0] : "unknown",
            };

            setOptimisticAlerts(prev => [newAlert, ...prev]);

            // Trigger actual refetch after 1500ms to ensure DB commit is visible
            setTimeout(() => {
              if (refetchAlerts) refetchAlerts();
              setOptimisticAlerts([]); // clear optimistic once live data returns
            }, 1500);
          }
          else if (payload.event === "INJECTION_ERROR") {
            toast.error(`Injection Failed: ${payload.data.message}`);
          }
          else if (payload.event === "DEMO_RESET") {
            toast.success("Demo data cleared.");
            if (refetchAlerts) refetchAlerts();
            setOptimisticAlerts([]);
          }
        } catch (e) {
          console.error("WS Parse Error", e);
        }
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected. Reconnecting in 3s...");
        reconnectTimeout = setTimeout(connect, 3000);
      };
    }

    connect();

    return () => {
      clearTimeout(reconnectTimeout);
      if (wsRef.current) {
        wsRef.current.onclose = null; // Prevent reconnect on unmount
        wsRef.current.close();
      }
    };
  }, [refetchAlerts]);

  const apiAlerts: Alert[] = liveAlertsData?.alerts?.length
    ? liveAlertsData.alerts.map((a: any, i: number) => {
      let createdAtStr = a.created_at || new Date().toISOString();
      if (!isNaN(Number(createdAtStr)) && String(createdAtStr).length >= 10) {
        createdAtStr = new Date(Number(createdAtStr)).toISOString();
      }
      return {
        id: i + 1,
        alertId: a.alert_id || `ALT-${a.account_id}-${(a.flagged_for?.[0] || "fraud").toLowerCase()}`,
        accountId: a.account_id,
        severity: (a.risk_level || a.severity) as string,
        status: "OPEN",
        pattern: a.flagged_for?.[0] ?? a.pattern_type ?? "UNKNOWN",
        amount: a.total_amount ?? Math.round((a.score || a.fraud_probability || 0.9) * 5_000_000),
        assignee: null,
        description: `Fraud pattern detected: ${(a.flagged_for || []).join(", ")}`,
        createdAt: createdAtStr,
        updatedAt: new Date().toISOString(),
        accountName: (a.customer_name || a.account_id).replace(/\s*\(\d+\)$/, ""),
        accountNumber: `${a.account_id} (${a.branch_name || "Main Branch"})`,
        rawAccountId: a.account_id,
      };
    })
    : [];

  const mergedAlerts = [...optimisticAlerts, ...apiAlerts];

  const handleStartInvestigation = (alertId: number) => {
    const alert = mergedAlerts.find(a => a.id === alertId);
    if (alert) {
      setDrawerOpen(false);
      navigate(`/graph/${alert.rawAccountId || alert.alertId}`);
    }
  };

  const handleOpen = (id: number) => {
    setSelectedId(id);
    setDrawerOpen(true);
    setShowTimeline(false);
  };

  const filteredAlerts = mergedAlerts.filter(a => {
    const effectiveStatus = statusOverrides[a.id] ?? a.status;
    const matchSeverity = !severity || severity === "ALL" || a.severity === severity;
    const matchStatus = !status || status === "ALL" || effectiveStatus === status;
    const matchSearch = !search || [a.alertId, a.accountName, a.pattern].some(f =>
      f.toLowerCase().includes(search.toLowerCase())
    );
    return matchSeverity && matchStatus && matchSearch;
  });

  const alerts = filteredAlerts;
  const alertDetail = selectedId ? mergedAlerts.find(a => a.id === selectedId) : null;
  const { data: liveTrace } = useTrace(alertDetail?.accountId || null);
  const timeline = useMemo(() => {
    if (!alertDetail) return [];
    
    let createdTime = new Date(alertDetail.createdAt).getTime();
    if (isNaN(createdTime)) {
      const asNum = Number(alertDetail.createdAt);
      createdTime = isNaN(asNum) ? Date.now() : asNum;
    }

    return [
      { id: 1, eventType: "ALERT_CREATED", timestamp: new Date(createdTime).toISOString(), description: "System detected anomalous activity pattern.", actor: "TRACE-X ML Engine" },
      { id: 2, eventType: "STATUS_CHANGED", timestamp: new Date(createdTime + 1000 * 60 * 5).toISOString(), description: `Alert severity assigned as ${alertDetail.severity}.`, actor: "Risk Scoring Service" }
    ];
  }, [alertDetail]);

  const relatedTransactions = useMemo(() => {
    if (liveTrace && liveTrace.chain && liveTrace.chain.length > 1) {
      const txns = [];
      const chain = liveTrace.chain;
      const amounts = liveTrace.amounts || [];
      const isConvergent = ["SMURFING", "DORMANT", "DORMANT_ACTIVATION"].includes(liveTrace?.fraud_type?.toUpperCase() || "") || 
                           ["SMURFING", "DORMANT"].includes(alertDetail?.pattern?.toUpperCase() || "");
      for (let i = 0; i < chain.length - 1; i++) {
        let fromAccount = chain[i];
        let toAccount = chain[i + 1];
        if (isConvergent) {
            fromAccount = chain[i + 1];
            toAccount = chain[0];
        }
        txns.push({
          id: `TXN-LIVE-${i}`,
          txnId: `TXN-LIVE-${i}`,
          amount: amounts[i] || 0,
          txnType: "Transfer",
          fromAccount,
          toAccount
        });
      }
      return txns;
    }
    return alertDetail ? getTransactionsByAccountId(alertDetail.accountId) : [];
  }, [liveTrace, alertDetail]);

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
          {alerts.length} alerts total
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
                {alertsLoading && !liveAlertsData ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td colSpan={9} className="px-4 py-4">
                        <Skeleton className="h-6 w-full bg-slate-800/40 rounded-none" />
                      </td>
                    </tr>
                  ))
                ) : alerts.length === 0 ? (
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
                        onMouseEnter={(e: MouseEvent<HTMLTableRowElement>) => (e.currentTarget as HTMLTableRowElement).style.backgroundColor = "rgba(19, 5, 55, 0.03)"}
                        onMouseLeave={(e: MouseEvent<HTMLTableRowElement>) => (e.currentTarget as HTMLTableRowElement).style.backgroundColor = "transparent"}
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
                          ₹{(alert.amount / 1000).toFixed(0)}K
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
          className="w-full sm:max-w-[480px] overflow-y-auto p-0 gap-0 [&>button]:text-[rgba(232,232,226,0.45)] [&>button]:hover:text-[#a3e635] [&>button]:right-5 [&>button]:top-5"
          style={{
            backgroundColor: DRAWER.bg,
            borderLeft: `2px solid ${DRAWER.border}`,
            zIndex: 70,
          }}
        >
          {!alertDetail ? (
            <div className="p-6 text-[13px]" style={{ color: DRAWER.textMuted }}>Loading…</div>
          ) : (
            (() => {
              const s = SEV[alertDetail.severity];
              const effectiveStatus = statusOverrides[alertDetail.id] ?? alertDetail.status;
              const statusOptions = ["OPEN", "UNDER_INVESTIGATION", "CLOSED"] as const;

              return (
                <div className="flex flex-col min-h-full">
                  {/* ── Header ── */}
                  <header
                    className="px-6 pt-6 pb-5"
                    style={{
                      borderLeft: `3px solid ${s?.leftBar ?? DRAWER.border}`,
                      borderBottom: `1px solid ${DRAWER.border}`,
                    }}
                  >
                    <div className="flex items-start justify-between gap-4 pr-8">
                      <div className="min-w-0 space-y-0.5">
                        <p
                          className="font-mono text-[10px] font-semibold tracking-wide"
                          style={{ color: DRAWER.accent }}
                        >
                          {alertDetail.alertId}
                        </p>
                        <h2
                          className="font-black text-[17px] uppercase leading-tight tracking-tight truncate"
                          style={{ color: DRAWER.text }}
                        >
                          {alertDetail.accountName}
                        </h2>
                        <p
                          className="font-mono text-[11px] tracking-wide"
                          style={{ color: DRAWER.textMuted }}
                        >
                          {alertDetail.accountNumber}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-1.5 shrink-0 pt-0.5">
                        <Badge
                          variant="outline"
                          className={`${s?.badge} border text-[10px] font-bold px-2 py-0.5 rounded-none`}
                        >
                          {alertDetail.severity}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`${STATUS[effectiveStatus] ?? ""} border text-[10px] font-bold px-2 py-0.5 rounded-none`}
                        >
                          {effectiveStatus.replace("_", " ")}
                        </Badge>
                      </div>
                    </div>
                  </header>

                  <div className="px-6 flex flex-col">
                    {/* ── Metadata Grid ── */}
                    <section className="py-6">
                      <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                        {[
                          ["Pattern", alertDetail.pattern],
                          ["Amount", `₹${alertDetail.amount.toLocaleString()}`],
                          ["Assignee", alertDetail.assignee ?? "Unassigned"],
                          ["Created", new Date(alertDetail.createdAt).toLocaleString()],
                        ].map(([label, value]) => (
                          <div key={label} className="min-w-0">
                            <DrawerSectionLabel>{`// ${label}`}</DrawerSectionLabel>
                            <p
                              className={`text-[13px] leading-snug truncate ${label === "Amount" ? "font-black tabular-nums font-mono" : "font-semibold"}`}
                              style={{ color: DRAWER.text }}
                            >
                              {value}
                            </p>
                          </div>
                        ))}
                      </div>
                    </section>

                    <DrawerDivider />

                    {/* ── Description ── */}
                    {alertDetail.description && (
                      <>
                        <section className="py-6">
                          <DrawerSectionLabel>{`// Description`}</DrawerSectionLabel>
                          <p
                            className="text-[13px] leading-relaxed"
                            style={{ color: "rgba(232,232,226,0.82)" }}
                          >
                            {alertDetail.description}
                          </p>
                        </section>
                        <DrawerDivider />
                      </>
                    )}

                    {/* ── Actions ── */}
                    <section className="py-6 space-y-5">
                      <Button
                        onClick={() => handleStartInvestigation(alertDetail.id)}
                        className="w-full rounded-none text-[11px] font-black uppercase tracking-[0.18em] h-11 transition-all hover:brightness-105"
                        style={{
                          backgroundColor: DRAWER.accent,
                          color: DRAWER.accentDark,
                          border: `1px solid ${DRAWER.accentDark}`,
                          boxShadow: `3px 3px 0px ${DRAWER.accentDark}`,
                        }}
                      >
                        <Network className="h-3.5 w-3.5 mr-2" />
                        Start Investigation
                      </Button>

                      <Button
                        onClick={() => { setDrawerOpen(false); navigate(`/evidence?account=${alertDetail.accountId}`); }}
                        className="w-full rounded-none text-[11px] font-black uppercase tracking-[0.18em] h-11 transition-all hover:brightness-105 mt-3"
                        style={{
                          backgroundColor: "#130537",
                          color: "#e8e8e2",
                          border: `1px solid #a3e635`,
                          boxShadow: `3px 3px 0px #a3e635`,
                        }}
                      >
                        <Shield className="h-3.5 w-3.5 mr-2 text-[#a3e635]" />
                        Escalate to FIU Evidence Case
                      </Button>

                      <div>
                        <DrawerSectionLabel>{`// Update Status`}</DrawerSectionLabel>
                        <div
                          className="flex w-full overflow-hidden"
                          style={{ border: `1px solid ${DRAWER.border}` }}
                        >
                          {statusOptions.map((statusKey, index) => {
                            const isActive = effectiveStatus === statusKey;
                            return (
                              <button
                                key={statusKey}
                                type="button"
                                onClick={() =>
                                  setStatusOverrides(prev => ({ ...prev, [alertDetail.id]: statusKey }))
                                }
                                className="flex-1 px-2 py-2.5 text-[9px] font-bold uppercase tracking-[0.12em] transition-colors"
                                style={{
                                  borderRight: index < statusOptions.length - 1 ? `1px solid ${DRAWER.border}` : undefined,
                                  backgroundColor: isActive ? "rgba(163,230,53,0.12)" : DRAWER.surface,
                                  color: isActive ? DRAWER.accent : DRAWER.textMuted,
                                  boxShadow: isActive ? "inset 0 -2px 0 #a3e635" : undefined,
                                }}
                              >
                                {statusKey.replace("_", " ")}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </section>

                    {/* ── Related Transactions ── */}
                    {relatedTransactions.length > 0 && (
                      <>
                        <DrawerDivider />
                        <section className="py-6">
                          <DrawerSectionLabel>{`// Related Transactions`}</DrawerSectionLabel>
                          <div className="space-y-2">
                            {relatedTransactions.slice(0, 5).map((txn) => (
                              <div
                                key={txn.id}
                                className="px-3.5 py-3 flex justify-between items-start gap-3"
                                style={{
                                  backgroundColor: DRAWER.surface,
                                  border: `1px solid ${DRAWER.border}`,
                                }}
                              >
                                <div className="min-w-0">
                                  <p
                                    className="font-mono text-[10px] font-semibold mb-1 tracking-wide"
                                    style={{ color: DRAWER.accent }}
                                  >
                                    {txn.txnId}
                                  </p>
                                  <p
                                    className="text-[11px] truncate"
                                    style={{ color: DRAWER.textMuted }}
                                  >
                                    {txn.fromAccount} → {txn.toAccount}
                                  </p>
                                </div>
                                <div className="text-right shrink-0">
                                  <p
                                    className="font-black text-[13px] tabular-nums font-mono"
                                    style={{ color: DRAWER.text }}
                                  >
                                    ₹{txn.amount.toLocaleString()}
                                  </p>
                                  <p className="text-[10px] mt-0.5" style={{ color: DRAWER.textMuted }}>
                                    {txn.txnType}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </section>
                      </>
                    )}

                    {/* ── Investigation Timeline ── */}
                    <DrawerDivider />
                    <section className="py-6 pb-8">
                      <button
                        type="button"
                        onClick={() => setShowTimeline(!showTimeline)}
                        className="flex items-center justify-between w-full group mb-3"
                      >
                        <span
                          className="text-[8px] font-bold uppercase tracking-[0.22em]"
                          style={{ color: DRAWER.label }}
                        >
                          // Investigation Timeline
                        </span>
                        <span
                          className="transition-colors"
                          style={{ color: showTimeline ? DRAWER.accent : DRAWER.textMuted }}
                        >
                          {showTimeline ? (
                            <ChevronDown className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5" />
                          )}
                        </span>
                      </button>

                      <AnimatePresence initial={false}>
                        {showTimeline && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            {timeline.length === 0 ? (
                              <p
                                className="text-[12px] italic py-2"
                                style={{ color: DRAWER.textMuted }}
                              >
                                No timeline events yet.
                              </p>
                            ) : (
                              <div
                                className="relative pl-5 pt-1"
                                style={{ borderLeft: `1px solid ${DRAWER.border}` }}
                              >
                                {timeline.map((event, index) => {
                                  const Icon = TL_ICONS[event.eventType] ?? Clock;
                                  const isLast = index === timeline.length - 1;
                                  return (
                                    <div
                                      key={event.id}
                                      className="relative"
                                      style={{
                                        paddingBottom: isLast ? 0 : 16,
                                        marginBottom: isLast ? 0 : 16,
                                        borderBottom: isLast ? undefined : `1px solid ${DRAWER.border}`,
                                      }}
                                    >
                                      <div
                                        className="absolute -left-[21px] top-1 h-3 w-3 flex items-center justify-center"
                                        style={{
                                          backgroundColor: DRAWER.bg,
                                          border: `1px solid rgba(163,230,53,0.35)`,
                                        }}
                                      >
                                        <Icon className="h-2 w-2" style={{ color: DRAWER.accent }} />
                                      </div>
                                      <div className="pl-1">
                                        <p
                                          className="text-[10px] font-mono tabular-nums"
                                          style={{ color: DRAWER.textMuted }}
                                        >
                                          {new Date(event.timestamp).toLocaleString()}
                                        </p>
                                        <p
                                          className="text-[13px] font-semibold mt-1 leading-snug"
                                          style={{ color: DRAWER.text }}
                                        >
                                          {event.description}
                                        </p>
                                        <p className="text-[11px] mt-1" style={{ color: DRAWER.textMuted }}>
                                          {event.actor}
                                        </p>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {!showTimeline && timeline.length > 0 && (
                        <p className="text-[11px] mt-1" style={{ color: DRAWER.textMuted }}>
                          {timeline.length} event{timeline.length !== 1 ? "s" : ""} — click to expand
                        </p>
                      )}
                    </section>
                  </div>
                </div>
              );
            })()
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
