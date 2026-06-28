import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FileText, Plus, Shield, ChevronRight,
  AlertTriangle, Download, Check, Loader2, Lock
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  staticEvidenceCases, getCaseDetail, type EvidenceCase,
} from "@/data/staticData";
import { useReport, useAlertsQuick } from "@/hooks/useApi";
import * as XLSX from "xlsx";

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function caseToCSV(detail: any) {
  const rows: string[][] = [];

  // Case metadata as a single row
  const metaHeaders = ["Case ID", "Title", "Investigator", "Alert ID", "Status", "Total Amount"];
  const metaValues = [detail.case.caseId, detail.case.title, detail.case.investigator, detail.case.alertId, detail.case.status, String(detail.case.totalAmount)];
  rows.push(metaHeaders);
  rows.push(metaValues);
  rows.push([""]); // spacer

  // FIU Report as a single row
  const fiuHeaders = ["FIU Report ID", "Reporting Entity", "Report Date", "Activity Type", "Narrative Summary"];
  const fiuValues = [detail.fiuReportData.reportId, detail.fiuReportData.reportingEntity, detail.fiuReportData.reportDate, detail.fiuReportData.suspiciousActivityType, detail.fiuReportData.narrativeSummary];
  rows.push(fiuHeaders);
  rows.push(fiuValues);
  rows.push([""]); // spacer

  // Fund flow table
  if (Array.isArray(detail.fundFlowSummary) && detail.fundFlowSummary.length) {
    rows.push(["Step", "From", "To", "Amount", "Method", "Date"]);
    detail.fundFlowSummary.forEach((s: any) => rows.push([String(s.step), s.fromAccount, s.toAccount, String(s.amount), s.method, new Date(s.timestamp).toLocaleDateString()]));
    rows.push([""]); // spacer
  }

  // Findings table
  if (Array.isArray(detail.findings) && detail.findings.length) {
    rows.push(["Category", "Finding", "Evidence", "Severity"]);
    detail.findings.forEach((f: any) => rows.push([f.category, f.finding, f.evidence || "", f.severity]));
  }

  // Normalize rows to consistent column count (helps Excel parsing)
  const maxCols = rows.reduce((m, r) => Math.max(m, r.length), 0);
  const normalized = rows.map(r => {
    const copy = r.slice();
    while (copy.length < maxCols) copy.push("");
    return copy;
  });

  // Convert to CSV with BOM and CRLF (Windows Excel friendly)
  const csvLines = normalized.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(","));
  return "\uFEFF" + csvLines.join("\r\n");
}

function exportCSV(detail: any) {
  try {
    const csv = caseToCSV(detail);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    downloadBlob(`${detail.case.caseId}-evidence.csv`, blob);
  } catch (e) {
    console.error(e);
    alert("Failed to export CSV");
  }
}

function exportPDF(detail: any) {
  try {
    // Simple printable HTML - user can choose "Save as PDF" in print dialog
    const html = `
      <html>
      <head>
        <title>${detail.case.caseId} - Evidence</title>
        <meta charset="utf-8" />
        <style>body{font-family:Arial,Helvetica,sans-serif;padding:20px;color:#130537} h1{font-size:18px} .section{margin-bottom:16px} .k{font-weight:700}</style>
      </head>
      <body>
        <h1>${detail.case.caseId} — ${detail.case.title}</h1>
        <div class="section"><div class="k">Investigator:</div> ${detail.case.investigator}</div>
        <div class="section"><div class="k">Alert ID:</div> ${detail.case.alertId}</div>
        <div class="section"><div class="k">Status:</div> ${detail.case.status}</div>
        <div class="section"><div class="k">Total Amount:</div> ${detail.case.totalAmount}</div>
        <h2>FIU Report</h2>
        <div>${detail.fiuReportData.narrativeSummary}</div>
        <hr />
        <h2>Fund Flow</h2>
        ${Array.isArray(detail.fundFlowSummary) && detail.fundFlowSummary.length ? detail.fundFlowSummary.map((s: any) => `<div>${s.step}. ${s.fromAccount} → ${s.toAccount} — ${s.amount}</div>`).join("") : '<div>No fund flow data</div>'}
        <h2>Findings</h2>
        ${Array.isArray(detail.findings) && detail.findings.length ? detail.findings.map((f: any) => `<div><strong>${f.severity}</strong> — ${f.finding}<div style="color:#666">${f.evidence || ""}</div></div>`).join("") : '<div>No findings</div>'}
      </body>
      </html>
    `;
    // Use an invisible iframe to avoid popup blockers — print triggered in user gesture
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.srcdoc = html;
    document.body.appendChild(iframe);
    iframe.onload = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.error(err);
        alert("Unable to open print dialog — check browser settings or popup blocker.");
      }
      setTimeout(() => { try { document.body.removeChild(iframe); } catch { } }, 1500);
    };
  } catch (e) {
    console.error(e);
    alert("Failed to export PDF");
  }
}

function exportXLSX(detail: any) {
  try {
    const wb = XLSX.utils.book_new();

    // Metadata sheet
    const metaHeaders = ["Case ID", "Title", "Investigator", "Alert ID", "Status", "Total Amount"];
    const metaValues = [detail.case.caseId, detail.case.title, detail.case.investigator, detail.case.alertId, detail.case.status, detail.case.totalAmount];
    const metaSheet = XLSX.utils.aoa_to_sheet([metaHeaders, metaValues]);
    XLSX.utils.book_append_sheet(wb, metaSheet, "Metadata");

    // FIU sheet
    const fiuHeaders = ["FIU Report ID", "Reporting Entity", "Report Date", "Activity Type", "Narrative Summary"];
    const fiuValues = [detail.fiuReportData.reportId, detail.fiuReportData.reportingEntity, detail.fiuReportData.reportDate, detail.fiuReportData.suspiciousActivityType, detail.fiuReportData.narrativeSummary];
    const fiuSheet = XLSX.utils.aoa_to_sheet([fiuHeaders, fiuValues]);
    XLSX.utils.book_append_sheet(wb, fiuSheet, "FIU Report");

    // Fund flow sheet
    const fundFlowRows = [];
    fundFlowRows.push(["Step", "From", "To", "Amount", "Method", "Date"]);
    if (Array.isArray(detail.fundFlowSummary)) {
      detail.fundFlowSummary.forEach((s: any) => fundFlowRows.push([s.step, s.fromAccount, s.toAccount, s.amount, s.method, new Date(s.timestamp).toLocaleDateString()]));
    }
    const fundFlowSheet = XLSX.utils.aoa_to_sheet(fundFlowRows);
    XLSX.utils.book_append_sheet(wb, fundFlowSheet, "Fund Flow");

    // Findings sheet
    const findingsRows = [];
    findingsRows.push(["Category", "Finding", "Evidence", "Severity"]);
    if (Array.isArray(detail.findings)) {
      detail.findings.forEach((f: any) => findingsRows.push([f.category, f.finding, f.evidence || "", f.severity]));
    }
    const findingsSheet = XLSX.utils.aoa_to_sheet(findingsRows);
    XLSX.utils.book_append_sheet(wb, findingsSheet, "Findings");

    // Generate binary and download
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], { type: "application/octet-stream" });
    downloadBlob(`${detail.case.caseId}-evidence.xlsx`, blob);
  } catch (e) {
    console.error(e);
    alert("Failed to export XLSX");
  }
}

const CASE_STATUS: Record<string, { badge: string; leftBar: string; label: string }> = {
  OPEN: { badge: "bg-violet-500/10 text-violet-600 border-violet-500/25", leftBar: "#8B5CF6", label: "Open" },
  ACTIVE: { badge: "bg-amber-500/10 text-amber-600 border-amber-500/25", leftBar: "#F59E0B", label: "Active" },
  FIU_SUBMITTED: { badge: "bg-emerald-500/10 text-emerald-600 border-emerald-500/25", leftBar: "#10B981", label: "FIU Submitted" },
  CLOSED: { badge: "bg-slate-100 text-slate-600", leftBar: "#64748b", label: "Closed" },
};

const FINDING_LEFT: Record<string, string> = {
  CRITICAL: "#EF4444",
  HIGH: "#F59E0B",
  MEDIUM: "#EAB308",
  LOW: "#10B981",
};

const FINDING_BADGE: Record<string, string> = {
  CRITICAL: "bg-red-500/10 text-red-600 border-red-500/25",
  HIGH: "bg-amber-500/10 text-amber-600 border-amber-500/25",
  MEDIUM: "bg-yellow-500/10 text-yellow-600 border-yellow-500/25",
  LOW: "bg-emerald-500/10 text-emerald-600 border-emerald-500/25",
};

const cardStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderWidth: "2px",
  borderStyle: "solid",
  borderColor: "#130537",
  borderRadius: 0,
  boxShadow: "6px 6px 0px #130537",
};

const surfaceStyle: React.CSSProperties = {
  backgroundColor: "#f5f5f0",
  border: "2px solid #130537",
  borderRadius: 0,
};

export default function Evidence() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ title: "", investigator: "", alertId: "", suspiciousAccounts: "" });
  const [isCreating, setIsCreating] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const { data: liveAlertsData } = useAlertsQuick(100);

  const liveCases = useMemo(() => {
    if (!liveAlertsData?.alerts?.length) return staticEvidenceCases;
    return liveAlertsData.alerts.slice(0, 8).map((a, i) => ({
      id: i + 1,
      caseId: `CASE-2026-${String(i + 1).padStart(3, "0")}`,
      title: `FIU Investigation: ${a.flagged_for[0] || "Suspicious Activity"} (${a.account_id})`,
      investigator: "Agent Investigator",
      alertId: `ALT-${a.account_id}`,
      status: (a.risk_level === "CRITICAL" ? "IN_PROGRESS" : "OPEN") as "OPEN" | "IN_PROGRESS" | "UNDER_REVIEW" | "CLOSED",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      suspiciousAccounts: [a.account_id],
      totalAmount: a.total_amount ?? Math.round(a.score * 5_000_000),
      packageGenerated: i < 3,
    }));
  }, [liveAlertsData]);

  const [cases, setCases] = useState<EvidenceCase[]>(staticEvidenceCases);
  const [packageGenerated, setPackageGenerated] = useState<Set<number>>(
    new Set(staticEvidenceCases.filter((c: EvidenceCase) => c.packageGenerated).map((c: EvidenceCase) => c.id))
  );

  useEffect(() => {
    if (liveAlertsData?.alerts?.length) {
      setCases(liveCases);
      setPackageGenerated(new Set(liveCases.filter(c => c.packageGenerated).map(c => c.id)));
    }
  }, [liveCases, liveAlertsData]);

  // Use the first suspicious account for live report lookup
  const selectedCase = cases.find((x: EvidenceCase) => x.id === selectedId);
  const liveAccountId = selectedCase?.suspiciousAccounts?.[0] ?? null;
  const { data: liveReport, loading: reportLoading } = useReport(liveAccountId);

  const activeCaseDetail = useMemo(() => {
    if (!selectedId || !selectedCase) return null;

    if (liveReport && !reportLoading) {
      // Map the backend's build_evidence_package to the expected frontend format
      const isFlagged = liveReport.score?.is_flagged;
      const findings = [];
      if (liveReport.score?.detections?.smurfing?.detected) findings.push({ category: "Structring", finding: "Multiple deposits below threshold", severity: "CRITICAL" });
      if (liveReport.score?.detections?.kyc_mismatch?.detected) findings.push({ category: "KYC Mismatch", finding: "Account metadata does not align with flow", severity: "HIGH" });
      if (liveReport.score?.detections?.dormant?.detected) findings.push({ category: "Dormant Activation", finding: "Sudden activity after dormancy", severity: "MEDIUM" });
      if (liveReport.score?.detections?.layering?.detected) findings.push({ category: "Layering", finding: "Rapid transfers across nodes", severity: "CRITICAL" });
      if (liveReport.score?.detections?.round_trip?.detected) findings.push({ category: "Round Tripping", finding: "Funds return to origin", severity: "CRITICAL" });

      return {
        case: selectedCase,
        findings: findings.length ? findings : [{ category: "Audit", finding: "Routine screening triggered", severity: "LOW" }],
        fundFlowSummary: liveReport.trace?.chain ? liveReport.trace.chain.map((c: string, i: number) => ({ step: i+1, fromAccount: c, toAccount: liveReport.trace.chain[i+1] ?? "End", amount: liveReport.trace.amounts[i] ?? 0, timestamp: new Date().toISOString() })).slice(0, -1) : [],
        fiuReportData: {
          reportId: `FIU-RPT-${selectedCase.caseId}`,
          reportingEntity: "Trace-X AI Intelligence Platform",
          reportDate: new Date().toLocaleDateString(),
          suspiciousActivityType: isFlagged ? liveReport.score.flagged_for.join(", ") : "Manual Review",
          narrativeSummary: `Machine Learning models analyzed account ${liveReport.account_id}. Overall risk is ${liveReport.score?.risk_level}. ${isFlagged ? "Fraudulent behavior detected." : "No significant anomalies found."}`,
          actionRequired: isFlagged ? "Submit to FIU" : "Close Case",
        },
      };
    }

    // Fallback to static detail
    const detail = getCaseDetail(selectedId);
    if (detail) return detail;
    
    return {
      case: selectedCase,
      findings: [],
      fundFlowSummary: [],
      fiuReportData: {
        reportId: `FIU-RPT-${selectedCase.caseId}`,
        reportingEntity: "Trace-X Intelligence Platform",
        reportDate: new Date().toLocaleDateString(),
        suspiciousActivityType: "Under Investigation",
        narrativeSummary: "This case is newly opened. Findings and fund flow data will be populated as the investigation progresses.",
        actionRequired: "Begin evidence collection and assign investigator resources.",
      },
    };
  }, [selectedId, selectedCase, liveReport, reportLoading]);

  const handleCreate = () => {
    if (!form.title || !form.investigator || !form.alertId) return;
    setIsCreating(true);
    setTimeout(() => {
      const newId = Date.now();
      const newCase: EvidenceCase = {
        id: newId,
        caseId: `CASE-${new Date().getFullYear()}-${String(cases.length + 1).padStart(3, "0")}`,
        title: form.title,
        investigator: form.investigator,
        alertId: form.alertId,
        status: "OPEN",
        description: null,
        suspiciousAccounts: form.suspiciousAccounts.split(",").map(s => s.trim()).filter(Boolean),
        totalAmount: 0,
        packageGenerated: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setCases(prev => [newCase, ...prev]);
      setSelectedId(newId);
      setCreateOpen(false);
      setForm({ title: "", investigator: "", alertId: "", suspiciousAccounts: "" });
      setIsCreating(false);
      toast({ title: "Case created", description: `Case ${newCase.caseId} has been opened.` });
    }, 600);
  };

  const handleGeneratePackage = () => {
    if (!selectedId || !activeCaseDetail) return;
    setIsGenerating(true);
    try {
      const pkg = {
        case: activeCaseDetail.case,
        findings: activeCaseDetail.findings || [],
        fundFlow: activeCaseDetail.fundFlowSummary || [],
        fiuReport: activeCaseDetail.fiuReportData || {},
        csv: caseToCSV(activeCaseDetail),
        generatedAt: new Date().toISOString(),
      };
      const blob = new Blob([JSON.stringify(pkg, null, 2)], { type: "application/json" });
      downloadBlob(`${activeCaseDetail.case.caseId}-package.gtenpkg`, blob);
      setPackageGenerated(prev => new Set([...prev, selectedId]));
      setCases(prev => prev.map(c => c.id === selectedId ? { ...c, packageGenerated: true } : c));
      toast({ title: "Evidence package generated", description: `Package downloaded for ${activeCaseDetail.case.caseId}.` });
    } catch (e) {
      console.error(e);
      toast({ title: "Package generation failed", description: String(e) });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-6 space-y-5 min-h-screen font-sans" style={{ backgroundColor: "#e8e8e2" }}>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4" style={cardStyle}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] mb-1" style={{ color: "#a3e635" }}>
              // Evidence &amp; Reporting
            </p>
            <h1 className="text-2xl font-black uppercase tracking-tight" style={{ color: "#130537" }}>
              Evidence Package Generator
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "rgba(19, 5, 55, 0.6)" }}>
              Build FIU-ready SAR/STR packages and fund flow documentation
            </p>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <button
                className="px-4 py-2.5 text-[13px] font-bold border-2 border-[#130537] transition-all flex items-center justify-center gap-2 self-start md:self-auto"
                style={{ backgroundColor: "#130537", color: "#e8e8e2" }}
              >
                <Plus className="h-4 w-4" /> New Case
              </button>
            </DialogTrigger>
            <DialogContent className="bg-[#ffffff] border-2 border-[#130537] rounded-none text-[#130537]">
              <DialogHeader>
                <DialogTitle className="text-[15px] font-black uppercase tracking-tight text-[#130537]">
                  Create Evidence Case
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                {[
                  { label: "Case Title", key: "title", placeholder: "e.g. Meridian Trade Corp Investigation" },
                  { label: "Investigator Name", key: "investigator", placeholder: "e.g. Agent Sarah Chen" },
                  { label: "Alert ID", key: "alertId", placeholder: "e.g. ALT-2025-001" },
                  { label: "Suspicious Accounts (comma-separated)", key: "suspiciousAccounts", placeholder: "e.g. ACC-00234, ACC-00891" },
                ].map(field => (
                  <div key={field.key} className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-600">{field.label}</Label>
                    <Input
                      value={form[field.key as keyof typeof form]}
                      onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                      placeholder={field.placeholder}
                      className="bg-[#f5f5f0] border-2 border-[#130537] text-[13px] rounded-none text-[#130537] focus-visible:ring-0 focus-visible:border-[#a3e635]"
                    />
                  </div>
                ))}
                <button
                  onClick={handleCreate}
                  disabled={isCreating || !form.title || !form.investigator}
                  className="w-full py-3 mt-2 text-[13px] font-bold border-2 border-[#130537] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
                  style={{ backgroundColor: "#130537", color: "#e8e8e2" }}
                >
                  {isCreating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Create Case
                </button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 }}>
          <div style={cardStyle} className="h-[calc(100vh-155px)] flex flex-col">
            <div className="p-4 flex-shrink-0" style={{ borderBottom: "2px solid #130537" }}>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#a3e635]">// Evidence Cases</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 p-3">
              {cases.length === 0 ? (
                <div className="flex flex-col items-center py-10 text-center">
                  <FileText className="h-8 w-8 mb-2" style={{ color: "rgba(19, 5, 55, 0.18)" }} />
                  <p className="text-[12px]" style={{ color: "rgba(19, 5, 55, 0.45)" }}>No cases yet. Create one to begin.</p>
                </div>
              ) : (
                cases.map((c) => {
                  const cs = CASE_STATUS[c.status];
                  const isSelected = selectedId === c.id;
                  const hasPkg = packageGenerated.has(c.id);
                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedId(c.id)}
                      className="p-3.5 cursor-pointer border-2 transition-all"
                      style={{
                        backgroundColor: isSelected ? "rgba(163,230,53,0.08)" : "#ffffff",
                        borderColor: isSelected ? "#a3e635" : "#130537",
                        borderLeft: `4px solid ${cs?.leftBar}`,
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-mono text-[11px] text-[#a3e635] font-bold">{c.caseId}</p>
                          <p className="text-[13px] font-bold mt-0.5 truncate uppercase tracking-tight" style={{ color: "#130537" }}>{c.title}</p>
                          <p className="text-[11px] mt-0.5" style={{ color: "rgba(19, 5, 55, 0.55)" }}>{c.investigator}</p>
                        </div>
                        <div className="flex flex-col gap-1.5 items-end flex-shrink-0">
                          <Badge variant="outline" className={`text-[9px] px-1.5 py-0 rounded-none border ${cs?.badge}`}>
                            {cs?.label}
                          </Badge>
                          {hasPkg && (
                            <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold font-mono">
                              <Check className="h-2.5 w-2.5" /> PKG
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between text-[11px] mt-3 pt-2 border-t border-[#130537]/20" style={{ color: "rgba(19, 5, 55, 0.55)" }}>
                        <span>{c.suspiciousAccounts.length} accounts</span>
                        <span className="font-mono font-bold" style={{ color: "#130537" }}>${(c.totalAmount / 1_000_000).toFixed(2)}M</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </motion.div>

        <motion.div className="xl:col-span-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.16 }}>
          {!selectedId ? (
            <div className="h-[calc(100vh-155px)] flex items-center justify-center" style={cardStyle}>
              <div className="text-center">
                <FileText className="h-10 w-10 mx-auto mb-3" style={{ color: "rgba(19, 5, 55, 0.15)" }} />
                <p className="text-[13px] font-bold uppercase tracking-wider" style={{ color: "rgba(19, 5, 55, 0.45)" }}>
                  Select a case to view evidence
                </p>
              </div>
            </div>
          ) : !activeCaseDetail ? null : (
            <div className="space-y-4 h-[calc(100vh-155px)] overflow-y-auto pr-1">
              <div
                style={{
                  ...cardStyle,
                  borderLeftWidth: "4px",
                  borderLeftColor: CASE_STATUS[activeCaseDetail.case.status]?.leftBar
                }}
                className="p-5"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <Shield className="h-4 w-4 text-[#a3e635]" />
                      <p className="font-mono text-[12px] text-[#a3e635] font-bold">{activeCaseDetail.case.caseId}</p>
                    </div>
                    <h2 className="text-[18px] font-black uppercase tracking-tight" style={{ color: "#130537" }}>{activeCaseDetail.case.title}</h2>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {/* CSV export removed per request */}
                    <button
                      onClick={() => activeCaseDetail && exportXLSX(activeCaseDetail)}
                      title="Export as native Excel (.xlsx)"
                      className="px-3 py-1.5 text-[11px] font-bold border-2 border-[#130537] transition-all flex items-center gap-1.5 bg-[#ffffff]"
                    >
                      <Download className="h-3 w-3" /> XLSX
                    </button>
                    <button
                      onClick={() => activeCaseDetail && exportPDF(activeCaseDetail)}
                      className="px-3 py-1.5 text-[11px] font-bold border-2 border-[#130537] transition-all flex items-center gap-1.5 bg-[#ffffff]"
                    >
                      <Download className="h-3 w-3" /> PDF
                    </button>
                    <button
                      onClick={handleGeneratePackage}
                      disabled={isGenerating}
                      className="px-3.5 py-1.5 text-[11px] font-bold border-2 border-[#130537] transition-all flex items-center gap-1.5 bg-[#130537] text-[#e8e8e2] disabled:opacity-50"
                    >
                      {isGenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileText className="h-3 w-3" />}
                      Generate Package
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    ["Investigator", activeCaseDetail.case.investigator],
                    ["Alert ID", activeCaseDetail.case.alertId],
                    ["Status", null],
                    ["Total Exposure", `$${(activeCaseDetail.case.totalAmount / 1_000_000).toFixed(2)}M`],
                  ].map(([label, value], i) => (
                    <div key={String(label)} style={surfaceStyle} className="p-3">
                      <p className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: "rgba(19, 5, 55, 0.45)" }}>{label}</p>
                      {i === 2 ? (
                        <Badge variant="outline" className={`text-[10px] rounded-none border ${CASE_STATUS[activeCaseDetail.case.status]?.badge}`}>
                          {CASE_STATUS[activeCaseDetail.case.status]?.label}
                        </Badge>
                      ) : (
                        <p className={`text-[13px] font-bold ${i === 1 ? "font-mono text-[#a3e635]" : i === 3 ? "font-mono text-[#130537]" : "text-[#130537]"}`}>{value}</p>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t-2 border-[#130537]">
                  <p className="text-[9px] font-bold uppercase tracking-wider mb-2" style={{ color: "rgba(19, 5, 55, 0.45)" }}>Suspicious Accounts</p>
                  <div className="flex flex-wrap gap-1.5">
                    {activeCaseDetail.case.suspiciousAccounts.map(acc => (
                      <Badge key={acc} variant="outline" className="font-mono text-[9px] rounded-none bg-red-500/5 border-red-500/20 text-red-600">{acc}</Badge>
                    ))}
                  </div>
                </div>
              </div>

              {activeCaseDetail.fundFlowSummary.length > 0 && (
                <div style={cardStyle} className="p-4">
                  <div className="pb-3 border-b-2 border-[#130537] mb-3">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#a3e635]">// Fund Flow Reconstruction</h3>
                  </div>
                  <div className="relative pl-2">
                    {activeCaseDetail.fundFlowSummary.map((step, i) => (
                      <div key={step.step} className="flex items-start gap-4 mb-4">
                        <div className="flex flex-col items-center flex-shrink-0">
                          <div className="h-6 w-6 border-2 border-[#a3e635] flex items-center justify-center text-[10px] font-black text-[#130537] bg-[#f5f5f0]">
                            {step.step}
                          </div>
                          {i < activeCaseDetail.fundFlowSummary.length - 1 && (
                            <div className="w-0.5 flex-1 bg-[#130537] min-h-[30px] mt-1.5" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-[11px] text-slate-600">{step.fromAccount}</span>
                            <ChevronRight className="h-3.5 w-3.5 text-[#a3e635]" />
                            <span className="font-mono text-[11px] text-slate-600">{step.toAccount}</span>
                          </div>
                          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                            <span className="font-black text-[14px] tabular-nums text-[#130537]">${step.amount.toLocaleString()}</span>
                            <Badge variant="outline" className="text-[9px] rounded-none border-[#130537] text-slate-600">{step.method}</Badge>
                            <span className="text-[11px] text-slate-500 font-mono">{new Date(step.timestamp).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeCaseDetail.findings.length > 0 && (
                <div style={cardStyle} className="p-4">
                  <div className="pb-3 border-b-2 border-[#130537] mb-3">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#a3e635] flex items-center gap-2">
                      <AlertTriangle className="h-3.5 w-3.5" style={{ color: "#F59E0B" }} /> // Investigation Findings
                    </h3>
                  </div>
                  <div className="space-y-2.5">
                    {activeCaseDetail.findings.map((finding) => (
                      <div
                        key={finding.id}
                        style={surfaceStyle}
                        className="p-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                              <Badge variant="outline" className="text-[9px] rounded-none border-[#130537] text-slate-600">{finding.category}</Badge>
                            </div>
                            <p className="text-[13px] font-bold text-[#130537]">{finding.finding}</p>
                            <p className="text-[12px] mt-1 leading-relaxed text-slate-600">{finding.evidence}</p>
                          </div>
                          <Badge variant="outline" className={`text-[10px] rounded-none flex-shrink-0 border ${FINDING_BADGE[finding.severity] ?? ""}`}>
                            {finding.severity}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-4" style={{ ...cardStyle, borderColor: "#130537" }}>
                <div className="pb-3 border-b-2 border-[#130537] mb-3 flex items-center justify-between">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#a3e635] flex items-center gap-2">
                    <Shield className="h-3.5 w-3.5" /> // FIU Report Preview
                  </h3>
                  <div className="flex items-center gap-2">
                    <Lock className="h-3.5 w-3.5 text-amber-600" />
                    <Badge variant="outline" className="text-[9px] bg-amber-500/10 text-amber-600 border-amber-500/25 uppercase tracking-wider rounded-none">
                      Confidential
                    </Badge>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      ["Report ID", activeCaseDetail.fiuReportData.reportId],
                      ["Reporting Entity", activeCaseDetail.fiuReportData.reportingEntity],
                      ["Report Date", activeCaseDetail.fiuReportData.reportDate],
                      ["Activity Type", activeCaseDetail.fiuReportData.suspiciousActivityType],
                    ].map(([label, value]) => (
                      <div key={label} style={surfaceStyle} className="p-3">
                        <p className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: "rgba(19, 5, 55, 0.45)" }}>{label}</p>
                        <p className="text-[12px] font-bold text-[#130537]">{value}</p>
                      </div>
                    ))}
                  </div>

                  <div style={surfaceStyle} className="p-3">
                    <p className="text-[9px] font-bold uppercase tracking-wider mb-2" style={{ color: "rgba(19, 5, 55, 0.45)" }}>Narrative Summary</p>
                    <p className="text-[13px] leading-relaxed text-[#130537]">{activeCaseDetail.fiuReportData.narrativeSummary}</p>
                  </div>

                  <div className="p-3 border-2 border-amber-500/25 bg-amber-500/10" style={{ borderLeft: "4px solid #F59E0B" }}>
                    <p className="text-[9px] text-amber-600 font-bold uppercase tracking-wider mb-1.5">Action Required</p>
                    <p className="text-[13px] leading-relaxed text-slate-700">{activeCaseDetail.fiuReportData.actionRequired}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
