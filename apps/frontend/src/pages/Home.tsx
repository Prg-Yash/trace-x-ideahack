import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { InteractiveTypography } from "@/components/InteractiveTypography";
import {
  Network,
  Shield,
  Target,
  AlertTriangle,
  FileText,
  ArrowRight,
  Activity,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  BarChart3,
  Search,
  Lock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

/* ── DATA ── */

const trustedBy = [
  "SWIFT Network",
  "FATF Typologies",
  "OFAC Sanctions",
  "PEP Databases",
  "Open Corporates",
  "Wolfsberg Group",
  "FinCEN Guidelines",
  "Basel AML Index",
];

const steps = [
  {
    num: "01",
    label: "// COLLECT ALERTS",
    title: "Centralize Intelligence",
    desc: "Aggregate transaction monitoring alerts, case feeds, and external intelligence into a single unified workspace.",
  },
  {
    num: "02",
    label: "// MAP RELATIONSHIPS",
    title: "Build the Graph",
    desc: "Construct visual graph views of entities, accounts, and suspicious fund flows across complex networks.",
  },
  {
    num: "03",
    label: "// ASSESS RISK",
    title: "Score & Prioritize",
    desc: "Rank cases with behavioral signals, sanctions context, and automated AML typology detection.",
  },
  {
    num: "04",
    label: "// PUBLISH FINDINGS",
    title: "Deliver Evidence",
    desc: "Generate regulator-ready SAR/STR reports with full fund flow reconstruction and legal-grade findings.",
  },
];

const features = [
  {
    icon: Network,
    label: "// GRAPH INTELLIGENCE",
    title: "Graph-Based Fund Tracing",
    desc: "Visualize complex layering, circular transactions, and money mule networks in a unified investigation workspace.",
  },
  {
    icon: Target,
    label: "// PATTERN DETECTION",
    title: "Automated AML Typologies",
    desc: "Automated identification of structuring, round-tripping, and known FATF typologies with confidence scoring.",
  },
  {
    icon: AlertTriangle,
    label: "// ALERT MANAGEMENT",
    title: "Intelligent Alert Triage",
    desc: "Prioritize investigations with context-aware risk scoring, automated entity resolution, and smart workflows.",
  },
  {
    icon: FileText,
    label: "// COMPLIANCE REPORTING",
    title: "FIU-Ready Evidence Packages",
    desc: "Generate comprehensive SAR/STR reporting packages with full fund flow reconstruction and legal-grade findings.",
  },
  {
    icon: BarChart3,
    label: "// ANALYTICS",
    title: "Real-Time Risk Analytics",
    desc: "Monitor live transaction volumes, alert velocity, and risk exposure across your entire portfolio at a glance.",
  },
  {
    icon: Lock,
    label: "// AUDIT TRAIL",
    title: "Immutable Audit Records",
    desc: "Every investigator action is timestamped and tamper-proof, ensuring full accountability for regulators.",
  },
];

const stats = [
  { value: "14.2M", label: "Transactions Analyzed Daily" },
  { value: "₹840M+", label: "Fraud Exposure Prevented" },
  { value: "12,400", label: "FIU Reports Generated" },
  { value: "98.7%", label: "Alert Accuracy Rate" },
];

const faqs = [
  {
    q: "What makes G-TEN different from traditional AML platforms?",
    a: "G-TEN is built graph-first — every alert, entity, and transaction is connected in a unified investigation workspace. Unlike legacy rule-based systems, G-TEN combines graph analytics, behavioral AI, and compliance reporting in a single platform.",
  },
  {
    q: "Which data sources does G-TEN integrate with?",
    a: "G-TEN connects natively to SWIFT, OFAC sanctions lists, PEP databases, Open Corporates, Wolfsberg Group standards, and your internal transaction monitoring systems via secure API.",
  },
  {
    q: "How does G-TEN handle SAR/STR report generation?",
    a: "G-TEN automatically compiles fund flow reconstructions, entity timelines, alert clusters, and investigator notes into a structured, regulator-ready evidence package exportable to PDF or structured data formats.",
  },
  {
    q: "Is G-TEN suitable for smaller compliance teams?",
    a: "Yes. G-TEN scales from single-analyst teams to enterprise FIU departments. The intelligent alert triage and automated entity resolution reduce manual review time by up to 70%, making small teams highly effective.",
  },
  {
    q: "What compliance frameworks does G-TEN support?",
    a: "G-TEN is aligned with FATF 40 Recommendations, Basel AML Index standards, FinCEN guidance, and local FIU regulatory requirements across 30+ jurisdictions.",
  },
  {
    q: "How secure is investigation data within G-TEN?",
    a: "G-TEN employs end-to-end encryption, role-based access controls, immutable audit logs, and can be deployed on-premise or in a private cloud environment to meet the strictest data sovereignty requirements.",
  },
];

/* ── COMPONENTS ── */

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="border-2 border-[#130537] rounded-none cursor-pointer select-none"
      onClick={() => setOpen(!open)}
    >
      <div className="flex items-center justify-between px-6 py-5 gap-4">
        <span className="font-bold text-[#130537] text-sm md:text-base leading-snug">{q}</span>
        <div className="shrink-0 h-8 w-8 flex items-center justify-center rounded-sm bg-[#a3e635] border-2 border-[#130537]">
          {open ? (
            <ChevronUp className="h-4 w-4 text-[#130537]" strokeWidth={3} />
          ) : (
            <ChevronDown className="h-4 w-4 text-[#130537]" strokeWidth={3} />
          )}
        </div>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-5 text-sm text-slate-600 leading-7 border-t-2 border-[#130537] pt-4">
              {a}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── PAGE ── */

export default function Home() {
  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: "#e8e8e2", color: "#130537" }}>

      {/* ── ANNOUNCEMENT BAR ── */}
      <div
        className="w-full text-center py-2.5 px-4 text-[12px] font-semibold tracking-wide"
        style={{ backgroundColor: "#130537", color: "#e8e8e2" }}
      >
        🚀 New: G-TEN now supports cross-border SWIFT fund tracing &amp; real-time sanctions screening
        <span className="ml-2 underline cursor-pointer hover:text-[#a3e635] transition-colors">
          Learn more →
        </span>
      </div>

      {/* ── NAVBAR ── */}
      <nav
        className="sticky top-0 z-50 border-b-2 border-[#130537]"
        style={{ backgroundColor: "#e8e8e2" }}
      >
        <div className="w-full flex h-16 items-center justify-between px-6 md:px-12">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-[#130537]" style={{ backgroundColor: "#130537" }}>
              <Shield className="h-5 w-5 text-[#a3e635]" />
            </div>
            <div>
              <span className="block text-[22px] font-black tracking-tight text-[#130537] uppercase leading-none">G-TEN</span>
              <span className="text-[11px] uppercase tracking-[0.3em] text-slate-500 font-bold">AML Platform</span>
            </div>
          </div>

          {/* Center Nav */}
          <div className="hidden md:flex items-center gap-8">
            {["Platform", "Features", "Integrations", "Pricing"].map((item) => (
              <a
                key={item}
                href="#"
                className="text-base font-bold text-[#130537] hover:text-emerald-700 transition-colors"
              >
                {item}
              </a>
            ))}
          </div>

          {/* Right CTAs */}
          <div className="flex items-center gap-2">
            <Link href="/dashboard">
              {/* <Button
                variant="ghost"
                size="sm"
                className="text-base font-semibold text-[#130537] hover:bg-[#d0d0ca] rounded-none"
              >
                Sign in
              </Button> */}
            </Link>
            <Link href="/dashboard">
              <button
                className="px-5 py-2.5 text-base font-black border-2 border-[#130537] transition-all hover:bg-[#a3e635] hover:border-[#130537] shadow-[2px_2px_0px_#130537] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                style={{ backgroundColor: "#130537", color: "#e8e8e2" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#a3e635";
                  (e.currentTarget as HTMLButtonElement).style.color = "#130537";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#130537";
                  (e.currentTarget as HTMLButtonElement).style.color = "#e8e8e2";
                }}
              >
                Open Platform
              </button>
            </Link>
          </div>
        </div>
      </nav>

      <main>
        {/* ── HERO ── */}
        <section className="pt-16 pb-20 px-6 text-center relative overflow-hidden">
          {/* Background grid lines (decorative) */}
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage:
                "linear-gradient(to right, #130537 1px, transparent 1px), linear-gradient(to bottom, #130537 1px, transparent 1px)",
              backgroundSize: "80px 80px",
            }}
          />

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative max-w-5xl mx-auto"
          >
            {/* Social proof badge */}
            <div className="inline-flex items-center gap-3 mb-8 border-2 border-[#130537] px-4 py-2 bg-white/60">
              <div className="flex -space-x-2">
                {["#3B82F6", "#10B981", "#F59E0B", "#EF4444"].map((c, i) => (
                  <div
                    key={i}
                    className="h-6 w-6 rounded-full border-2 border-white flex items-center justify-center"
                    style={{ backgroundColor: c }}
                  >
                    <span className="text-[8px] text-white font-bold">
                      {["FI", "CB", "AU", "RA"][i]}
                    </span>
                  </div>
                ))}
              </div>
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#130537]">
                Trusted by <span className="text-emerald-600">50+</span> FIU Teams Globally
              </span>
            </div>

            {/* Main heading */}
            <h1
              className="text-5xl md:text-7xl font-black uppercase leading-[0.95] tracking-tight mb-6"
              style={{ color: "#130537" }}
            >
              Transform Alerts Into{" "}
              <span style={{ color: "#059669" }}>Audit-Ready</span>{" "}
              Investigations
            </h1>

            <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
              G-TEN links alerts, accounts, and entities into a single investigation workspace
              so compliance teams can act faster, stay accountable, and produce regulator-ready evidence.
            </p>

            {/* CTA Row */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
              <Link href="/dashboard">
                <button
                  className="flex items-center gap-2 px-8 py-4 text-base font-black uppercase tracking-wide border-2 border-[#130537] transition-all duration-200 hover:scale-105"
                  style={{ backgroundColor: "#a3e635", color: "#130537" }}
                >
                  Open Platform <ArrowRight className="h-4 w-4" strokeWidth={3} />
                </button>
              </Link>
              <Link href="/graph">
                <button
                  className="flex items-center gap-2 px-8 py-4 text-base font-black uppercase tracking-wide border-2 border-[#130537] transition-all duration-200 hover:bg-[#130537] hover:text-[#e8e8e2]"
                  style={{ backgroundColor: "transparent", color: "#130537" }}
                >
                  View Use Case
                </button>
              </Link>
            </div>

            <p className="text-xs text-slate-500 font-medium tracking-wide">
              No setup required &nbsp;·&nbsp; Regulator-ready from day one &nbsp;·&nbsp; On-premise or cloud deployment
            </p>
          </motion.div>

          {/* Hero dashboard mockup */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative mt-16 max-w-6xl mx-auto border-2 border-[#130537] shadow-[8px_8px_0px_#130537] overflow-hidden bg-[#f8fafc]"
          >
            {/* Mock dashboard Header */}
            <div className="px-5 py-3 border-b-2 border-[#130537] bg-white flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex gap-2">
                  <div className="h-3 w-3 rounded-full border-2 border-[#130537] bg-[#EF4444]" />
                  <div className="h-3 w-3 rounded-full border-2 border-[#130537] bg-[#F59E0B]" />
                  <div className="h-3 w-3 rounded-full border-2 border-[#130537] bg-[#a3e635]" />
                </div>
                <div className="h-4 w-[2px] bg-[#130537]"></div>
                <span className="text-[12px] text-[#130537] font-black tracking-widest uppercase flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#130537] fill-[#a3e635]" />
                  G-TEN Workspace
                  <span className="text-[#130537]">/</span>
                  <span className="font-mono text-[11px]">INV-2024-4471</span>
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-2 px-2 py-1 border-2 border-[#130537] bg-[#a3e635] text-[10px] text-[#130537] font-black uppercase tracking-widest shadow-[2px_2px_0px_#130537]">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white border border-[#130537]"></span>
                  </span>
                  Live
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-12 min-h-[380px]">
              {/* Left sidebar */}
              <div className="col-span-2 border-r-2 border-[#130537] py-4 px-3 flex flex-col gap-2 bg-white">
                {[
                  { name: "Dashboard", icon: BarChart3 },
                  { name: "Alerts", icon: AlertTriangle },
                  { name: "Entities", icon: Target },
                  { name: "Graph", icon: Network, active: true },
                  { name: "Reports", icon: FileText },
                  { name: "Audit Log", icon: Lock },
                ].map((item) => (
                  <div
                    key={item.name}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 text-[12px] font-black uppercase tracking-widest border-2 border-transparent transition-all cursor-default",
                      item.active 
                        ? "bg-[#a3e635] text-[#130537] border-[#130537] shadow-[2px_2px_0px_#130537]" 
                        : "text-slate-500 hover:text-[#130537] hover:border-[#130537]"
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.name}
                  </div>
                ))}
              </div>

              {/* Main Graph Panel */}
              <div className="col-span-7 p-6 flex flex-col relative overflow-hidden bg-[#f8fafc]">
                <div className="mb-4 flex items-center justify-between z-10">
                  <div className="flex items-center gap-2 px-3 py-1 bg-white border-2 border-[#130537] shadow-[2px_2px_0px_#130537]">
                    <Network className="w-4 h-4 text-[#130537]" />
                    <span className="text-[12px] font-black uppercase tracking-widest text-[#130537]">// Fund Flow</span>
                  </div>
                  <div className="flex gap-2">
                    {["Layout", "Filter", "Export"].map((b) => (
                      <button key={b} className="text-[11px] font-black uppercase bg-white border-2 border-[#130537] hover:bg-[#06B6D4] hover:text-white px-3 py-1.5 text-[#130537] shadow-[2px_2px_0px_#130537] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Graph Area */}
                <div className="relative flex-1 border-2 border-[#130537] bg-white overflow-hidden shadow-[inset_4px_4px_0px_rgba(19,5,55,0.05)]">
                  {/* Grid background for graph */}
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#130537_1px,transparent_1px),linear-gradient(to_bottom,#130537_1px,transparent_1px)] bg-[size:2rem_2rem] opacity-[0.07]"></div>
                  
                  {/* Connecting SVG Lines */}
                  <svg className="absolute inset-0 w-full h-full">
                    <defs>
                      <marker id="arrow-normal" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#130537" />
                      </marker>
                      <marker id="arrow-danger" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#EF4444" />
                      </marker>
                      <marker id="arrow-warning" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#F59E0B" />
                      </marker>
                    </defs>
                    
                    {/* Path: Acct A -> Entity X */}
                    <path d="M 12% 50% C 25% 50%, 25% 25%, 38% 25%" fill="none" stroke="#130537" strokeWidth="2" markerEnd="url(#arrow-normal)" />
                    {/* Path: Acct A -> Shell Co. */}
                    <path d="M 12% 50% C 25% 50%, 25% 75%, 38% 75%" fill="none" stroke="#EF4444" strokeWidth="3" strokeDasharray="6 3" markerEnd="url(#arrow-danger)" />
                    
                    {/* Path: Entity X -> Acct B */}
                    <path d="M 38% 25% C 50% 25%, 50% 25%, 62% 25%" fill="none" stroke="#130537" strokeWidth="2" markerEnd="url(#arrow-normal)" />
                    {/* Path: Shell Co. -> Mule #3 */}
                    <path d="M 38% 75% C 50% 75%, 50% 75%, 62% 75%" fill="none" stroke="#F59E0B" strokeWidth="3" markerEnd="url(#arrow-warning)" />
                    
                    {/* Path: Acct B -> FIU Target */}
                    <path d="M 62% 25% C 75% 25%, 75% 50%, 88% 50%" fill="none" stroke="#130537" strokeWidth="2" markerEnd="url(#arrow-normal)" />
                    {/* Path: Mule #3 -> FIU Target */}
                    <path d="M 62% 75% C 75% 75%, 75% 50%, 88% 50%" fill="none" stroke="#EF4444" strokeWidth="3" markerEnd="url(#arrow-danger)" />
                  </svg>

                  {/* Nodes */}
                  {[
                    { x: "12%", y: "50%", label: "Acct A", type: "Account", risk: "Med", rBg: "bg-[#06B6D4]", rColor: "text-white", icon: "🏛️" },
                    { x: "38%", y: "25%", label: "Entity X", type: "Corporate", risk: "Low", rBg: "bg-[#a3e635]", rColor: "text-[#130537]", icon: "🏢" },
                    { x: "38%", y: "75%", label: "Shell Co.", type: "Corporate", risk: "High", rBg: "bg-[#F59E0B]", rColor: "text-[#130537]", icon: "🏢" },
                    { x: "62%", y: "25%", label: "Acct B", type: "Account", risk: "Low", rBg: "bg-[#a3e635]", rColor: "text-[#130537]", icon: "🏛️" },
                    { x: "62%", y: "75%", label: "Mule #3", type: "Individual", risk: "High", rBg: "bg-[#F59E0B]", rColor: "text-[#130537]", icon: "👤" },
                    { x: "88%", y: "50%", label: "FIU Target", type: "Individual", risk: "Crit", rBg: "bg-[#EF4444]", rColor: "text-white", icon: "👤" },
                  ].map((node) => (
                    <div
                      key={node.label}
                      className="absolute flex flex-col items-center justify-center p-2 border-2 border-[#130537] bg-white shadow-[4px_4px_0px_#130537] z-10 w-24 transition-transform hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0px_#130537] cursor-pointer"
                      style={{ left: node.x, top: node.y, transform: "translate(-50%, -50%)" }}
                    >
                      <div className="text-xl mb-1">{node.icon}</div>
                      <div className="text-[11px] font-black uppercase text-[#130537] mb-0.5 truncate w-full text-center">{node.label}</div>
                      <div className="text-[9px] font-bold text-slate-500 mb-2 uppercase">{node.type}</div>
                      <div className={cn("text-[9px] font-black uppercase px-2 py-0.5 border-2 border-[#130537]", node.rBg, node.rColor)}>
                        {node.risk}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right panel: Alert Details */}
              <div className="col-span-3 border-l-2 border-[#130537] bg-white p-6 flex flex-col">
                <div className="flex items-center gap-2 mb-6 border-b-2 border-[#130537] pb-3">
                  <Activity className="w-5 h-5 text-[#130537]" />
                  <span className="text-[13px] font-black uppercase tracking-widest text-[#130537]">Alert Profile</span>
                </div>
                
                {/* Risk Score */}
                <div className="mb-8 text-center p-4 border-2 border-[#130537] bg-[#f8fafc] shadow-[4px_4px_0px_#130537]">
                  <div className="text-[10px] uppercase font-black tracking-widest text-slate-500 mb-1">Confidence Score</div>
                  <div className="text-5xl font-black text-[#EF4444]">
                    94<span className="text-xl text-[#130537]">/100</span>
                  </div>
                </div>

                {/* Attributes */}
                <div className="space-y-4 flex-1">
                  {[
                    { label: "Detected Pattern", value: "Layering", color: "text-[#F59E0B]", bg: "bg-amber-100" },
                    { label: "Linked Entities", value: "6 High-Risk", color: "text-[#EF4444]", bg: "bg-red-100" },
                    { label: "FATF Typology", value: "FATF-12", color: "text-[#06B6D4]", bg: "bg-cyan-100" },
                    { label: "Total Exposure", value: "₹4.2M Est.", color: "text-[#130537]", bg: "bg-slate-200" },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between items-center border-b-2 border-dashed border-slate-300 pb-2">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{item.label}</span>
                      <span className={`text-[11px] font-black uppercase px-2 py-0.5 border-2 border-[#130537] shadow-[2px_2px_0px_#130537] ${item.bg} ${item.color}`}>{item.value}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <div className="mt-8 pt-5">
                  <button className="flex items-center justify-center gap-2 w-full bg-[#a3e635] text-[#130537] border-2 border-[#130537] shadow-[4px_4px_0px_#130537] px-4 py-3 transition-all hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0px_#130537] active:shadow-[2px_2px_0px_#130537] active:translate-x-[2px] active:translate-y-[2px]">
                    <FileText className="w-5 h-5" />
                    <span className="text-[12px] font-black uppercase tracking-widest">
                      File SAR Report
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ── TRUSTED BY LOGOS ── */}
        <section className="py-10 border-t-2 border-b-2 border-[#130537] overflow-hidden" style={{ backgroundColor: "#d8d8d2" }}>
          <div className="text-center mb-5">
            <span className="text-[10px] font-bold uppercase tracking-[0.35em] text-slate-500">
              // Trusted Data Sources & Regulatory Frameworks
            </span>
          </div>
          <div className="flex gap-0 overflow-hidden">
            <motion.div
              animate={{ x: ["0%", "-50%"] }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="flex shrink-0 gap-0"
            >
              {[...trustedBy, ...trustedBy].map((name, i) => (
                <div
                  key={i}
                  className="shrink-0 px-10 py-2 border-r-2 border-[#130537] text-[13px] font-black uppercase tracking-widest text-[#130537] whitespace-nowrap"
                >
                  {name}
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section className="py-24 px-6" style={{ backgroundColor: "#e8e8e2" }}>
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-slate-500 mb-3">
                // G-TEN INVESTIGATION WORKFLOW
              </p>
              <h2 className="text-4xl md:text-6xl font-black uppercase leading-tight text-[#130537]">
                10X FASTER FROM ALERT<br />TRIAGE TO FILED REPORT
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              {steps.map((step, i) => (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="border-2 border-[#130537] p-6 hover:shadow-[6px_6px_0px_#130537] transition-all duration-200 bg-white"
                >
                  <div className="text-[11px] font-bold tracking-widest text-slate-400 mb-4">{step.label}</div>
                  <div
                    className="inline-flex h-10 w-10 items-center justify-center border-2 border-[#130537] text-sm font-black mb-4"
                    style={{ backgroundColor: "#a3e635", color: "#130537" }}
                  >
                    {step.num}
                  </div>
                  <h3 className="text-lg font-black uppercase text-[#130537] mb-3 leading-tight">{step.title}</h3>
                  <p className="text-sm text-slate-600 leading-6">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FEATURE CARDS ── */}
        <section className="py-24 px-6 border-t-2 border-[#130537]" style={{ backgroundColor: "#f5f5f0" }}>
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-slate-500 mb-3">
                // WHAT G-TEN IS FOR
              </p>
              <h2 className="text-4xl md:text-6xl font-black uppercase leading-tight text-[#130537]">
                AI TO EMPOWER YOUR<br />COMPLIANCE PROCESS
              </h2>
              <p className="mt-5 text-slate-600 max-w-2xl mx-auto text-base leading-relaxed">
                One platform for alert triage, network analysis, and compliance reporting — keeping teams aligned and audit-ready at every step.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {features.map((feat, i) => (
                <motion.div
                  key={feat.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07 }}
                  className="border-2 border-[#130537] p-7 bg-white hover:shadow-[6px_6px_0px_#a3e635] transition-all duration-200 group"
                >
                  <div className="text-[10px] font-bold tracking-widest text-slate-400 mb-4">{feat.label}</div>
                  <div
                    className="inline-flex h-12 w-12 items-center justify-center border-2 border-[#130537] mb-5 group-hover:bg-[#a3e635] transition-colors"
                    style={{ backgroundColor: "#130537" }}
                  >
                    <feat.icon className="h-5 w-5 text-[#a3e635] group-hover:text-[#130537] transition-colors" />
                  </div>
                  <h3 className="text-base font-black uppercase text-[#130537] mb-3 leading-tight">{feat.title}</h3>
                  <p className="text-sm text-slate-600 leading-6">{feat.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── DARK STATS SECTION ── */}
        <section className="py-24 px-6 border-t-2 border-[#130537]" style={{ backgroundColor: "#0B1220" }}>
          <div className="max-w-7xl mx-auto">
            <div className="grid gap-12 lg:grid-cols-2 items-center">
              {/* Left copy */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-emerald-400 mb-4">
                  // ENTERPRISE SCALE
                </p>
                <h2 className="text-4xl md:text-5xl font-black uppercase leading-tight text-white mb-6">
                  GRAPH-BASED FUND TRACING AT ENTERPRISE SCALE
                </h2>
                <p className="text-slate-400 text-base leading-relaxed mb-8">
                  G-TEN processes millions of transactions daily, surfaces hidden criminal networks, and delivers FIU-grade evidence packages — all within a single investigation workspace.
                </p>
                <div className="flex flex-col gap-3">
                  {[
                    "Cross-border SWIFT fund flow reconstruction",
                    "Automated FATF typology matching with confidence scores",
                    "Entity resolution across fragmented account data",
                    "One-click SAR/STR generation with full audit trail",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-300">{item}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-8">
                  <Link href="/dashboard">
                    <button
                      className="flex items-center gap-2 px-7 py-3.5 text-sm font-black uppercase tracking-wide border-2 border-[#a3e635] transition-all duration-200 hover:bg-[#a3e635] hover:text-[#130537]"
                      style={{ backgroundColor: "transparent", color: "#a3e635" }}
                    >
                      Open Platform <ArrowRight className="h-4 w-4" strokeWidth={3} />
                    </button>
                  </Link>
                </div>
              </div>

              {/* Right stats grid */}
              <div className="grid grid-cols-2 gap-4">
                {stats.map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="border-2 border-slate-700 p-6 hover:border-emerald-500 transition-colors"
                    style={{ backgroundColor: "#121A2B" }}
                  >
                    <p className="text-3xl md:text-4xl font-black text-[#a3e635] mb-2">{stat.value}</p>
                    <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold">{stat.label}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── CAPABILITIES HIGHLIGHT ── */}
        <section className="py-24 px-6 border-t-2 border-[#130537]" style={{ backgroundColor: "#1a0a38" }}>
          <div className="max-w-7xl mx-auto text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-purple-300 mb-4">
              // CONNECTED INTELLIGENCE
            </p>
            <h2 className="text-4xl md:text-5xl font-black uppercase leading-tight text-white mb-6">
              EVERY ALERT. EVERY ENTITY.<br />ONE INVESTIGATION GRAPH.
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto mb-12 text-base leading-relaxed">
              Isolated alerts become connected cases. Disconnected accounts become visible networks. G-TEN turns your compliance data into actionable intelligence.
            </p>

            <div className="grid gap-4 md:grid-cols-3">
              {[
                {
                  icon: Search,
                  title: "Pattern Recognition",
                  desc: "Automatically detect structuring, round-tripping, layering, and 40+ FATF-defined typologies.",
                },
                {
                  icon: Network,
                  title: "Network Mapping",
                  desc: "Reveal hidden relationships across accounts, beneficial owners, and transaction chains.",
                },
                {
                  icon: Activity,
                  title: "Behavioral Profiling",
                  desc: "Build baseline transaction profiles and flag anomalous deviations in real time.",
                },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="border border-purple-700/50 p-7 text-left hover:border-purple-400 transition-colors"
                  style={{ backgroundColor: "#2a1050" }}
                >
                  <item.icon className="h-8 w-8 text-purple-300 mb-4" />
                  <h3 className="text-sm font-black uppercase text-white mb-3">{item.title}</h3>
                  <p className="text-sm text-slate-400 leading-6">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="py-24 px-6 border-t-2 border-[#130537]" style={{ backgroundColor: "#e8e8e2" }}>
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-slate-500 mb-3">
                // FREQUENTLY ASKED QUESTIONS
              </p>
              <h2 className="text-4xl md:text-5xl font-black uppercase leading-tight text-[#130537]">
                EVERYTHING YOU NEED TO KNOW
              </h2>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                >
                  <FAQItem q={faq.q} a={faq.a} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <section
          className="py-24 px-6 border-t-2 border-[#130537]"
          style={{ backgroundColor: "#d1fae5" }}
        >
          <div className="max-w-5xl mx-auto">
            <div className="grid gap-10 lg:grid-cols-2 items-center">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-emerald-700 mb-4">
                  // GET STARTED TODAY
                </p>
                <h2 className="text-4xl md:text-5xl font-black uppercase leading-tight text-[#130537] mb-5">
                  READY TO TRANSFORM AML OPERATIONS?
                </h2>
                <p className="text-slate-600 text-base leading-relaxed">
                  Start using G-TEN to move from alerts to evidence with confidence and clarity. Deployed and operational within days.
                </p>
              </div>

              <div className="flex flex-col gap-4">
                <div className="border-2 border-[#130537] p-6 bg-white">
                  <h3 className="font-black uppercase text-[#130537] mb-2">Open Platform</h3>
                  <p className="text-sm text-slate-500 mb-4">Access the full G-TEN investigation workspace immediately.</p>
                  <Link href="/dashboard">
                    <button
                      className="w-full py-3 text-sm font-black uppercase tracking-wide border-2 border-[#130537] transition-all duration-200 hover:bg-[#a3e635]"
                      style={{ backgroundColor: "#130537", color: "#e8e8e2" }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#a3e635";
                        (e.currentTarget as HTMLButtonElement).style.color = "#130537";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#130537";
                        (e.currentTarget as HTMLButtonElement).style.color = "#e8e8e2";
                      }}
                    >
                      Open Platform →
                    </button>
                  </Link>
                </div>
                <div className="border-2 border-[#130537] p-6" style={{ backgroundColor: "transparent" }}>
                  <h3 className="font-black uppercase text-[#130537] mb-2">View Demo Case</h3>
                  <p className="text-sm text-slate-600 mb-4">Walk through a live fund-flow investigation from alert to SAR filing.</p>
                  <Link href="/graph">
                    <button
                      className="w-full py-3 text-sm font-black uppercase tracking-wide border-2 border-[#130537] transition-all duration-200 hover:bg-[#130537] hover:text-[#e8e8e2]"
                      style={{ backgroundColor: "transparent", color: "#130537" }}
                    >
                      Explore Demo →
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t-2 border-[#130537] py-10 px-6" style={{ backgroundColor: "#130537" }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid gap-8 md:grid-cols-4 mb-10">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 border-2 border-[#a3e635] flex items-center justify-center">
                  <Shield className="h-4 w-4 text-[#a3e635]" />
                </div>
                <span className="text-sm font-black uppercase tracking-widest text-[#e8e8e2]">G-TEN</span>
              </div>
              <p className="text-xs text-slate-400 leading-5">Graph-Driven Evidence Nexus.<br />Enterprise AML Intelligence Platform.</p>
            </div>

            {/* Links */}
            {[
              { title: "Platform", links: ["Dashboard", "Graph View", "Alert Triage", "Reports"] },
              { title: "Compliance", links: ["FATF Framework", "SAR Filing", "PEP Screening", "OFAC Lists"] },
              { title: "Company", links: ["About", "Security", "Privacy Policy", "Contact"] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-xs text-slate-400 hover:text-[#a3e635] transition-colors font-medium">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-700 pt-6 flex flex-col md:flex-row items-center justify-between gap-2">
            <span className="text-[11px] text-slate-500">© 2024 G-TEN · Graph-Driven Evidence Nexus</span>
            <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-widest">
              Confidential — For Authorized FIU Personnel Only
            </span>
          </div>
        </div>
      </footer>
      <InteractiveTypography />
    </div>
  );
}
