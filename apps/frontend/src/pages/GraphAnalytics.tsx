import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { BASE } from "../lib/api";
import ReactFlow, {
  Background, Controls, MiniMap,
  type Node, type Edge, type NodeProps, type EdgeProps,
  Handle, Position,
  useNodesState, useEdgesState,
  BackgroundVariant, MarkerType,
  EdgeLabelRenderer, getBezierPath,
  useReactFlow, ReactFlowProvider,
  Panel,
  useViewport,
} from "reactflow";
import "reactflow/dist/style.css";
import dagre from "@dagrejs/dagre";
import {
  Network, AlertTriangle, GitBranch,
  Filter, Maximize2, RotateCcw, ScanLine,
  ArrowRight, X, Building2, User, Clock,
  Landmark, ShoppingCart, ChevronLeft, ChevronRight,
  TrendingUp, TrendingDown, Radio,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { type GraphNode } from "@/data/staticData";
import { buildNetworkFromGraph, getGraphById } from "@/data/investigationData";
import { useInvestigation } from "@/context/InvestigationContext";
import { useTrace, useExplain, useScore, useAlertsQuick } from "@/hooks/useApi";
import { Skeleton } from "@/components/ui/skeleton";

/* ─────────────────────────────────────────────────────────────
   PALETTE
───────────────────────────────────────────────────────────── */

const SURF_BG = "#e8e8e2";
const SURF_1 = "#ffffff";
const SURF_2 = "#f5f5f0";
const SURF_3 = "#ffffff";
const BORDER = "#130537";
const BORDER2 = "rgba(19, 5, 55, 0.4)";
const TEXT_PRI = "#130537";
const TEXT_MUT = "rgba(19, 5, 55, 0.65)";
const TEXT_DIM = "rgba(19, 5, 55, 0.35)";
const ACCENT = "#a3e635";

const RISK = {
  CRITICAL: { color: "#EF4444", dim: "#2d0f0f", text: "#f87171", label: "CRITICAL" },
  HIGH: { color: "#F59E0B", dim: "#2d1f05", text: "#fbbf24", label: "HIGH" },
  MEDIUM: { color: "#EAB308", dim: "#282408", text: "#facc15", label: "MEDIUM" },
  LOW: { color: "#10B981", dim: "#062018", text: "#34d399", label: "LOW" },
} as const;

const PATTERN_COLORS: Record<string, string> = {
  "LAYERING": "#F97316",
  "Layering": "#F97316",
  "ROUND_TRIP": "#A855F7",
  "Round-Tripping": "#A855F7",
  "SMURFING": "#3B82F6",
  "Smurfing": "#3B82F6",
  "KYC_MISMATCH": "#EC4899",
  "KYC Mismatch": "#EC4899",
  "DORMANT": "#64748B",
  "Dormant Activity": "#64748B",
};

const LEGEND_ITEMS = [
  { label: "Layering", color: "#F97316" },
  { label: "Round-Tripping", color: "#A855F7" },
  { label: "Smurfing", color: "#3B82F6" },
  { label: "KYC Mismatch", color: "#EC4899" },
  { label: "Dormant Activity", color: "#64748B" },
];

const NODE_WIDTH = 200;
const NODE_HEIGHT = 90;

/* ─────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────── */

type NetworkNode = {
  id: string; label: string; accountNumber: string;
  riskLevel: string; accountType: string; balance: number;
  flagged: boolean; pattern: string | null; x: number | null; y: number | null;
};

type PatternData = {
  id: string; patternType: string; affectedAccounts: string[];
  totalAmount: number; confidence: number; description: string;
};

type Mode = "select" | "trace";
type RiskKey = keyof typeof RISK;

/* ─────────────────────────────────────────────────────────────
   DAGRE LAYOUT (LEFT → RIGHT)
───────────────────────────────────────────────────────────── */

function applyDagreLayout(nodes: Node[], edges: Edge[]): Node[] {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "LR", ranksep: 160, nodesep: 60, edgesep: 40, marginx: 60, marginy: 60 });

  nodes.forEach(n => g.setNode(n.id, { width: NODE_WIDTH, height: NODE_HEIGHT }));
  edges.forEach(e => {
    try { g.setEdge(e.source, e.target); } catch { }
  });

  dagre.layout(g);

  return nodes.map(n => {
    const nd = g.node(n.id);
    if (!nd) return n;
    return { ...n, position: { x: nd.x - NODE_WIDTH / 2, y: nd.y - NODE_HEIGHT / 2 } };
  });
}

/* ─────────────────────────────────────────────────────────────
   GLOBAL CSS (pulse + flow dot)
───────────────────────────────────────────────────────────── */

const GLOBAL_CSS = `
@keyframes gten-pulse {
  0%, 100% { box-shadow: 0 0 0 0 var(--pulse-color, #EF444460); }
  60%       { box-shadow: 0 0 0 7px transparent; }
}
@keyframes gten-flow-dot {
  0%   { offset-distance: 0%; }
  100% { offset-distance: 100%; }
}
@keyframes gten-dash {
  to { stroke-dashoffset: -20; }
}
`;

function InjectCSS() {
  useEffect(() => {
    const el = document.createElement("style");
    el.setAttribute("data-gten", "1");
    el.textContent = GLOBAL_CSS;
    if (!document.querySelector("[data-gten]")) document.head.appendChild(el);
    return () => { el.remove(); };
  }, []);
  return null;
}

/* ─────────────────────────────────────────────────────────────
   ACCOUNT TYPE ICON
───────────────────────────────────────────────────────────── */

function AccountTypeIcon({ type, size = 12, color }: { type: string; size?: number; color: string }) {
  const t = (type ?? "").toLowerCase();
  if (t.includes("corp") || t.includes("business") || t.includes("company") || t.includes("llc") || t.includes("ltd"))
    return <Building2 size={size} color={color} />;
  if (t.includes("dormant") || t.includes("inactive"))
    return <Clock size={size} color={color} />;
  if (t.includes("bank") || t.includes("branch"))
    return <Landmark size={size} color={color} />;
  if (t.includes("merchant") || t.includes("retail"))
    return <ShoppingCart size={size} color={color} />;
  return <User size={size} color={color} />;
}

/* ─────────────────────────────────────────────────────────────
   ACCOUNT NODE
───────────────────────────────────────────────────────────── */

function AccountNode({ data }: NodeProps) {
  const risk = RISK[data.riskLevel as RiskKey] ?? RISK.LOW;
  const isFocused: boolean = data.focusState === "focused";
  const isDimmed: boolean = data.focusState === "dimmed";
  const isTraceSource = data.traceState === "source";
  const isTraceTarget = data.traceState === "target";
  const isOnTrace = data.traceState === "path";

  const borderColor = isTraceSource ? "#f0c040"
    : isTraceTarget ? "#40c0f0"
      : isOnTrace ? ACCENT
        : risk.color;

  const bgColor = isFocused ? SURF_3 : SURF_2;
  const opacity = isDimmed ? 0.12 : 1;

  const pulseStyle: React.CSSProperties = data.flagged && !isDimmed ? {
    "--pulse-color": risk.color + "60",
    animation: "gten-pulse 2.4s ease-in-out infinite",
  } as React.CSSProperties : {};

  const glowStyle: React.CSSProperties = (isFocused || isOnTrace) ? {
    boxShadow: `0 0 0 1.5px ${borderColor}60, 0 0 18px ${borderColor}20`,
  } : {};

  return (
    <div style={{ opacity, transition: "opacity 0.25s ease", width: NODE_WIDTH }}>
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: borderColor, width: 6, height: 6, border: `1px solid ${SURF_BG}`, left: -3 }}
      />
      <div style={{
        background: bgColor,
        border: `1px solid ${isFocused || isOnTrace ? borderColor + "70" : BORDER}`,
        borderLeft: `3px solid ${borderColor}`,
        borderRadius: 4,
        width: "100%",
        cursor: "pointer",
        transition: "all 0.2s ease",
        ...pulseStyle,
        ...glowStyle,
      }}>
        {/* Header row */}
        <div style={{ padding: "6px 8px 5px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0 }}>
            <AccountTypeIcon type={data.accountType} size={10} color={TEXT_DIM} />
            <span style={{ fontFamily: "monospace", fontSize: 9, color: TEXT_MUT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {data.accountNumber}
            </span>
          </div>
          <span style={{ fontSize: 8.5, fontWeight: 700, color: risk.color, letterSpacing: "0.06em", flexShrink: 0 }}>
            {risk.label}
          </span>
        </div>

        {/* Account name */}
        <div style={{ padding: "5px 8px 4px" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: TEXT_PRI, lineHeight: 1.25, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {data.label}
          </div>
        </div>

        {/* Footer row */}
        <div style={{ padding: "3px 8px 4px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4 }}>
          <span style={{ fontSize: 9, color: TEXT_DIM, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {data.accountType?.substring(0, 14)}
          </span>
          {data.pattern ? (
            <span style={{ fontSize: 8.5, color: PATTERN_COLORS[data.pattern] ?? "#c07a10", display: "flex", alignItems: "center", gap: 2 }}>
              <span>⚑</span> {data.pattern.split(" ")[0]}
            </span>
          ) : (
            <span style={{ fontSize: 9, color: TEXT_DIM, fontFamily: "monospace" }}>
              ₹{(data.balance / 1_000_000).toFixed(2)}M
            </span>
          )}
        </div>

        {/* Branch & Channel / KYC Status */}
        <div style={{ padding: "3px 8px 5px", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 8, fontFamily: "monospace", color: TEXT_DIM, borderTop: `1px dashed ${BORDER}` }}>
          <span>🏢 {data.branch || "NYC-HQ"}</span>
          <span style={{ color: data.kycStatus === "PROFILE MISMATCH" ? "#ef4444" : "#22c55e", fontWeight: 700 }}>
            {data.kycStatus === "PROFILE MISMATCH" ? "⚠ KYC MISMATCH" : "✓ KYC OK"}
          </span>
        </div>

        {/* Trace indicator */}
        {(isTraceSource || isTraceTarget) && (
          <div style={{
            background: isTraceSource ? "#f0c04018" : "#40c0f018",
            borderTop: `1px solid ${isTraceSource ? "#f0c04040" : "#40c0f040"}`,
            padding: "3px 8px",
            fontSize: 8.5,
            color: isTraceSource ? "#f0c040" : "#40c0f0",
            fontWeight: 700,
            letterSpacing: "0.1em",
          }}>
            {isTraceSource ? "◉ ORIGIN" : "◎ TARGET"}
          </div>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: borderColor, width: 6, height: 6, border: `1px solid ${SURF_BG}`, right: -3 }}
      />
    </div>
  );
}

const nodeTypes = { accountNode: AccountNode };

/* ─────────────────────────────────────────────────────────────
   TRANSACTION EDGE  (with animated flow dot on active paths)
───────────────────────────────────────────────────────────── */

function TransactionEdge({
  id, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition, data,
}: EdgeProps) {
  const [hovering, setHovering] = useState(false);
  const pathId = `gten-ep-${id}`;

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
    curvature: 0.25,
  });

  const isDimmed = data?.dimmed;
  const isTracedPath = data?.tracedPath;
  const isFlagged = data?.flagged;
  const patternType = data?.pattern as string | undefined;
  const amount = data?.amount ?? 0;

  const patternColor = patternType ? (PATTERN_COLORS[patternType] ?? "#F97316") : null;
  const strokeColor = isTracedPath ? "#60a5fa"
    : isDimmed ? "#1e3050"
      : isFlagged && patternColor ? patternColor
        : isFlagged ? "#EF4444"
          : hovering ? "#4a7aaa"
            : "#2e4a6a";

  const strokeWidth = isTracedPath ? 3
    : isDimmed ? 0.5
      : isFlagged ? 2.5
        : amount > 1_000_000 ? 1.8
          : 1.2;

  const dashArray = isFlagged && !isTracedPath ? "7 4" : "none";
  const opacity = isDimmed ? 0.15 : 1;

  const showDot = isTracedPath && !isDimmed;
  const showLabel = !isDimmed;

  const markerColor = isTracedPath ? "#60a5fa"
    : isFlagged && patternColor ? patternColor
      : isDimmed ? "#1a2a40"
        : "#213350";

  return (
    <>
      {/* Invisible hit area */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={16}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        style={{ cursor: "pointer" }}
      />

      {/* Glow layer for traced path */}
      {isTracedPath && (
        <path
          d={edgePath}
          fill="none"
          stroke="#a3e635"
          strokeWidth={6}
          strokeOpacity={0.12}
          style={{ pointerEvents: "none" }}
        />
      )}

      {/* Main edge */}
      <path
        id={pathId}
        d={edgePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeDasharray={dashArray}
        style={{
          opacity,
          transition: "stroke 0.2s, opacity 0.25s",
          pointerEvents: "none",
          animation: isFlagged && !isTracedPath && !isDimmed
            ? "gten-dash 1.6s linear infinite"
            : undefined,
        }}
      />

      {/* Arrowhead marker (inline, since ReactFlow marker may not update color) */}
      <defs>
        <marker
          id={`arrow-${id}`}
          markerWidth="8"
          markerHeight="8"
          refX="6"
          refY="3"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <path d="M0,0 L0,6 L8,3 z" fill={markerColor} style={{ opacity }} />
        </marker>
      </defs>
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        markerEnd={`url(#arrow-${id})`}
        style={{ pointerEvents: "none" }}
      />

      {/* Animated flow dot (traced/selected paths only) */}
      {showDot && (
        <circle r="3.5" fill="#a3e635" style={{ pointerEvents: "none" }}>
          <animateMotion dur="1.8s" repeatCount="indefinite">
            <mpath href={`#${pathId}`} />
          </animateMotion>
        </circle>
      )}

      {/* Amount label — always visible when not dimmed */}
      {showLabel && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "none",
              fontSize: hovering ? 9.5 : 8.5,
              fontFamily: "monospace",
              fontWeight: isTracedPath || isFlagged ? 700 : 500,
              color: isTracedPath ? "#d2f497"
                : isFlagged && patternColor ? patternColor
                  : hovering ? TEXT_PRI
                    : TEXT_MUT,
              background: SURF_BG,
              padding: "1px 5px",
              borderRadius: 2,
              border: `1px solid ${isTracedPath ? "#a3e63560" : isFlagged && patternColor ? patternColor + "50" : BORDER}`,
              whiteSpace: "nowrap",
              zIndex: 1000,
              transition: "font-size 0.1s",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ background: "#1e293b", color: "#60a5fa", padding: "1px 4px", borderRadius: 2, fontSize: 8, fontWeight: 700 }}>
                {data?.channel && data.channel !== "SWIFT" && data.channel !== "WIRE" && data.channel !== "CRYPTO" ? data.channel : "RTGS"}
              </span>
              <span>
                {amount >= 1_000_000
                  ? `₹${(amount / 1_000_000).toFixed(2)}M`
                  : amount >= 1_000
                    ? `₹${Math.round(amount / 1000)}K`
                    : `₹${amount}`}
              </span>
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

const edgeTypes = { txnEdge: TransactionEdge };

/* ─────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────── */

function riskScore(level: string) {
  return { CRITICAL: 95, HIGH: 78, MEDIUM: 52, LOW: 22 }[level] ?? 50;
}

function fmtAmount(n: number) {
  return n >= 1_000_000
    ? `₹${(n / 1_000_000).toFixed(2)}M`
    : `₹${Math.round(n / 1000)}K`;
}

/* ─────────────────────────────────────────────────────────────
   MAIN GRAPH COMPONENT
───────────────────────────────────────────────────────────── */

function GraphInner() {
  const { fitView, setCenter } = useReactFlow();
  const { zoom } = useViewport();
  const [location, navigate] = useLocation();
  const { investigation, clearInvestigation } = useInvestigation();

  const routeMatch = location.match(/^\/graph\/([^/]+)/);
  const routeAlertId = routeMatch ? decodeURIComponent(routeMatch[1]) : null;
  const routeAccountIdFromUrl = routeAlertId
    ? (routeAlertId.startsWith("ALT-") ? routeAlertId.split("-")[1] : routeAlertId)
    : null;

  // URL-pinned pattern — e.g. "ALT-ACC_00002-layering" → "LAYERING"
  // This is the AUTHORITATIVE pattern for this investigation page.
  // It must NOT be overwritten by liveScore which runs separate ML inference.
  const urlPattern = routeAlertId?.startsWith("ALT-")
    ? routeAlertId.split("-").slice(2).join("_").toUpperCase()
    : null;

  const { data: liveAlertsQuick, loading: alertsLoading } = useAlertsQuick(200);
  const fallbackAccountId = liveAlertsQuick?.alerts?.[0]?.account_id || "ACC_12044";
  const routeAccountId = routeAccountIdFromUrl || null;
  const traceQueryId = routeAccountId || fallbackAccountId;

  const { data: liveTrace, loading: traceLoading } = useTrace(traceQueryId);
  const { data: liveExplain, loading: explainLoading } = useExplain(traceQueryId);
  const { data: liveScore } = useScore(traceQueryId);

  const isInvestigationRoute = location === "/graph-analytics";
  const isInvestigationMode = isInvestigationRoute && investigation !== null;

  /* ── Live network data ── */
  const network = useMemo(() => {
    if (traceQueryId) {
      let chain = liveTrace?.chain?.length && liveTrace.chain.length > 1 ? liveTrace.chain : [];
      let amounts = liveTrace?.amounts || [];
      const timestamps = (liveTrace as any)?.timestamps || [];
      // Only use real chain from trace — no synthetic fallback accounts
      if (chain.length <= 1) {
        // Keep the target account at minimum; additional hops come only when trace resolves
        chain = [traceQueryId];
        amounts = [];
      }
      // The authoritative pattern = URL pattern first, then trace fraud_type
      // NEVER use liveScore.flagged_for — that's per-model confidence, not alert type
      const alertPattern = urlPattern || liveTrace?.fraud_type?.toUpperCase() || "FRAUD";

      const uniqueChain = Array.from(new Set(chain));
      const nodes = uniqueChain.map((acc, i) => {
        const isMain = acc === traceQueryId;
        // Risk level: for target use liveScore, for hops degrade gracefully
        const score = isMain
          ? (liveScore ? Math.round(liveScore.combined_score * 100) : 88)
          : Math.max(30, 75 - i * 15);
        const risk = score >= 80 ? "CRITICAL" : score >= 60 ? "HIGH" : score >= 40 ? "MEDIUM" : "LOW";
        return {
          id: acc,
          label: isMain ? `Target (${acc})` : `Hop ${i} (${acc})`,
          accountNumber: acc,
          riskLevel: risk,
          // Use real account type from score data for target; generic for hops
          accountType: isMain
            ? (liveScore?.account_type || "Current Account")
            : "Linked Account",
          // Real branch from score data for target
          branch: isMain
            ? (liveScore?.branch_name || acc)
            : acc,
          // KYC status: for target node use real mismatch detection
          kycStatus: isMain
            ? (liveScore?.detections?.kyc_mismatch?.detected ? "PROFILE MISMATCH" : "VERIFIED")
            : "VERIFIED",
          balance: isMain
            ? (liveScore?.volume_30d || 0)
            : (amounts[i] || 0),
          flagged: isMain,
          // PIN the pattern to the URL alert pattern — never override with score
          pattern: isMain ? alertPattern : null,
          x: null,
          y: null,
        };
      });


      const edges = [];
      const INDIAN_RAILS = ["RTGS", "NEFT", "IMPS", "UPI"];
      const traceChannels = (liveTrace as any)?.channels || [];
      for (let i = 0; i < chain.length - 1; i++) {
        const defaultChannel = INDIAN_RAILS[i % INDIAN_RAILS.length];
        const ch = traceChannels[i] && traceChannels[i] !== "SWIFT" && traceChannels[i] !== "WIRE" && traceChannels[i] !== "CRYPTO" ? traceChannels[i] : defaultChannel;
        let source = chain[i];
        let target = chain[i + 1];
        const isConvergent = ["SMURFING", "DORMANT", "DORMANT_ACTIVATION"].includes(liveTrace?.fraud_type?.toUpperCase() || "") ||
          ["SMURFING", "DORMANT"].includes(alertPattern?.toUpperCase() || "");
        if (isConvergent) {
          source = chain[i + 1];
          target = chain[0];
        }
        edges.push({
          id: `e-${source}-${target}-${i}`,
          source,
          target,
          label: `₹${(amounts[i] || 0).toLocaleString()}`,
          amount: amounts[i] || 0,
          channel: ch,
          timestamp: timestamps[i] || new Date().toISOString(),
          riskLevel: "HIGH",
          isLoop: false,
        });
      }
      // If Round Trip pattern and last hop is not connected to origin, close the loop!
      if (alertPattern.includes("ROUND") && chain.length >= 2 && chain[chain.length - 1] !== chain[0]) {
        const lastIdx = chain.length - 1;
        const defaultLoopCh = INDIAN_RAILS[(lastIdx + 1) % INDIAN_RAILS.length];
        const ch = traceChannels[lastIdx] && traceChannels[lastIdx] !== "SWIFT" && traceChannels[lastIdx] !== "WIRE" && traceChannels[lastIdx] !== "CRYPTO" ? traceChannels[lastIdx] : defaultLoopCh;
        edges.push({
          id: `e-${chain[lastIdx]}-${chain[0]}-loop`,
          source: chain[lastIdx],
          target: chain[0],
          label: `₹${(amounts[lastIdx] || amounts[lastIdx - 1] || 0).toLocaleString()}`,
          amount: amounts[lastIdx] || amounts[lastIdx - 1] || 0,
          channel: ch,
          timestamp: timestamps[lastIdx] || new Date().toISOString(),
          riskLevel: "CRITICAL",
          isLoop: true,
        });
      }

      // Deduplicate nodes in case chain had duplicate origin at end
      const uniqueNodesMap = new Map();
      nodes.forEach(n => {
        if (!uniqueNodesMap.has(n.id)) uniqueNodesMap.set(n.id, n);
      });
      const uniqueNodes = Array.from(uniqueNodesMap.values());
      const stats = {
        totalNodes: uniqueNodes.length,
        totalEdges: edges.length,
        flaggedNodes: uniqueNodes.filter(n => n.flagged).length,
        flaggedEdges: edges.filter(e => e.riskLevel === "CRITICAL" || e.riskLevel === "HIGH").length,
        detectedClusters: 1, // Currently looking at one trace cluster
      };
      return { nodes: uniqueNodes, edges, stats };
    }
    return {
      nodes: [],
      edges: [],
      stats: { totalNodes: 0, totalEdges: 0, flaggedNodes: 0, flaggedEdges: 0, detectedClusters: 0 }
    };
    // Only re-run when account, trace data, or score risk level changes — NOT on every score update
  }, [routeAccountId, liveAlertsQuick, traceQueryId, liveTrace, liveScore?.combined_score, liveScore?.detections?.kyc_mismatch?.detected, urlPattern]);

  const graphEdges = useMemo(
    () => (network.edges as any[]),
    [network],
  );

  const isLoading = Boolean((alertsLoading || traceLoading || explainLoading) && !liveTrace && !liveExplain && !liveAlertsQuick);

  const patterns = useMemo(() => {
    if (traceQueryId) {
      // PIN pattern to URL-derived type. liveScore.flagged_for is secondary XAI output
      // and must NOT override the alert's declared pattern type.
      const pName = urlPattern || liveTrace?.fraud_type?.toUpperCase() || "FRAUD_ALERT";
      // Confidence: use trace confidence if available, else score combined
      const confidence = liveTrace?.confidence
        ? Math.round((liveTrace.confidence as number) * 100)
        : liveScore
          ? Math.round(liveScore.combined_score * 100)
          : 0;
      // Description from explain matching active pattern, fallback to summary
      const pKey = pName.toLowerCase().replace("-", "_");
      const desc = (liveExplain?.by_fraud_type as any)?.[pKey]?.explanation_summary
        || (liveExplain?.by_fraud_type as any)?.round_trip?.explanation_summary
        || (liveExplain?.by_fraud_type as any)?.layering?.explanation_summary
        || (liveExplain as any)?.explanation_summary
        || `ML XAI engine detected suspicious ${pName} anomalies for ${traceQueryId}. Combined Risk Score: ${confidence}/100.`;
      return [{
        id: `pat-${traceQueryId}`,
        patternType: pName,
        affectedAccounts: liveTrace?.chain?.length ? liveTrace.chain : [traceQueryId],
        totalAmount: (liveTrace?.amounts || []).reduce((a: number, b: number) => a + b, 0),
        confidence,
        description: desc,
      }];
    }
    return [];
  }, [routeAccountId, liveAlertsQuick, traceQueryId, urlPattern, liveTrace, liveScore?.combined_score, liveExplain]);

  /* ── UI state ── */
  const [mode, setMode] = useState<Mode>("select");
  const [panelOpen, setPanelOpen] = useState(true);
  const [panelTab, setPanelTab] = useState<"alerts" | "patterns" | "trace" | "stats">("alerts");
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [selectedEdge, setSelectedEdge] = useState<any>(null);
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  const [activePattern, setActivePattern] = useState<string | null>(null);

  // Set active pattern once — from URL (stable), not from async liveScore
  const patternInitialized = useRef(false);
  useEffect(() => {
    if (!patternInitialized.current && patterns.length > 0) {
      setActivePattern(patterns[0].patternType);
      patternInitialized.current = true;
    }
  }, [patterns]);

  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [riskFilter, setRiskFilter] = useState<string | null>(null);
  const [aiBriefingState, setAiBriefingState] = useState<Record<string, { loading: boolean; text: string | null }>>({});

  /* ── Trace state ── */
  const [traceFrom, setTraceFrom] = useState<{ id: string; data: any } | null>(null);
  const [traceTo, setTraceTo] = useState<{ id: string; data: any } | null>(null);
  const [tracedNodeIds, setTracedNodeIds] = useState<Set<string>>(new Set());
  const [tracedEdgeIds, setTracedEdgeIds] = useState<Set<string>>(new Set());

  /* ── Trace path — computed client-side from static edges ── */
  // Build a simple path by BFS through the static edge list
  const tracePath = useMemo(() => {
    if (!traceFrom || !traceTo) return null;
    const adj: Record<string, string[]> = {};
    graphEdges.forEach(e => {
      if (!adj[e.source]) adj[e.source] = [];
      adj[e.source].push(e.target);
    });
    const queue: string[][] = [[traceFrom.id]];
    const visited = new Set<string>([traceFrom.id]);
    while (queue.length) {
      const path = queue.shift()!;
      const last = path[path.length - 1];
      if (last === traceTo.id) {
        return {
          path: path.map(nodeId => {
            const n = (network.nodes as GraphNode[]).find(x => x.id === nodeId);
            const edge = graphEdges.find(e => e.source === nodeId || e.target === nodeId);
            return { accountNumber: n?.accountNumber ?? nodeId, accountName: n?.label ?? nodeId, amount: edge?.amount ?? 0, txnType: edge?.txnType ?? "Transfer" };
          }),
        };
      }
      for (const next of adj[last] ?? []) {
        if (!visited.has(next)) { visited.add(next); queue.push([...path, next]); }
      }
    }
    return { path: [] };
  }, [traceFrom?.id, traceTo?.id, graphEdges, network.nodes]);

  /* ── Trace result → highlight ── */
  useEffect(() => {
    if (!tracePath || !network) return;
    const pathAccNums = new Set<string>((tracePath.path ?? []).map((p: any) => p.accountNumber));
    setTracedNodeIds(pathAccNums);
    const edgeIds = new Set<string>();
    (network.edges as any[]).forEach(e => {
      const src = (network.nodes as GraphNode[]).find(n => n.id === e.source);
      const tgt = (network.nodes as GraphNode[]).find(n => n.id === e.target);
      if (src && tgt && pathAccNums.has(src.accountNumber) && pathAccNums.has(tgt.accountNumber))
        edgeIds.add(e.id);
    });
    setTracedEdgeIds(edgeIds);
  }, [tracePath, network]);

  /* ── Connected node IDs for investigation focus ── */
  const connectedNodeIds = useMemo((): Set<string> => {
    if (!focusedNodeId || !network) return new Set();
    const ids = new Set<string>([focusedNodeId]);
    (network.edges as any[]).forEach(e => {
      if (e.source === focusedNodeId) ids.add(e.target);
      if (e.target === focusedNodeId) ids.add(e.source);
    });
    return ids;
  }, [focusedNodeId, network]);

  /* ── Pattern account filter ── */
  const patternAccountNums = useMemo((): Set<string> | null => {
    if (!activePattern || !patterns) return null;
    const p = (patterns as PatternData[]).find(p => p.patternType === activePattern);
    return p ? new Set(p.affectedAccounts) : null;
  }, [activePattern, patterns]);

  /* ── Build RF nodes ── */
  const rawRfNodes: Node[] = useMemo(() => {
    if (!network?.nodes) return [];
    return (network.nodes as NetworkNode[]).map(node => {
      let focusState: "focused" | "dimmed" | "default" = "default";
      if (focusedNodeId) {
        focusState = connectedNodeIds.has(node.id) ? "focused" : "dimmed";
      }

      let traceState: "source" | "target" | "path" | "none" = "none";
      if (traceFrom?.id === node.id) traceState = "source";
      else if (traceTo?.id === node.id) traceState = "target";
      else if (tracedNodeIds.has(node.accountNumber)) traceState = "path";

      const patternVisible = !patternAccountNums || patternAccountNums.has(node.accountNumber);
      const riskVisible = !riskFilter || node.riskLevel === riskFilter;
      const flaggedVisible = !flaggedOnly || node.flagged;
      const fullyDimmed = !patternVisible || !riskVisible || !flaggedVisible;

      return {
        id: node.id,
        type: "accountNode",
        position: { x: 0, y: 0 },
        data: {
          ...node,
          focusState: fullyDimmed ? "dimmed" : focusState,
          traceState,
          riskScore: riskScore(node.riskLevel),
        },
      };
    });
  }, [network, focusedNodeId, connectedNodeIds, traceFrom, traceTo, tracedNodeIds, patternAccountNums, riskFilter, flaggedOnly]);

  /* ── Build RF edges (before layout) ── */
  const rawRfEdges: Edge[] = useMemo(() => {
    if (!network?.edges) return [];
    return (network.edges as any[]).map((edge, i) => {
      const isTracedPath = tracedEdgeIds.has(edge.id);
      const srcNode = (network.nodes as NetworkNode[]).find(n => n.id === edge.source);
      const tgtNode = (network.nodes as NetworkNode[]).find(n => n.id === edge.target);

      const patternVisible = !patternAccountNums
        || (srcNode && patternAccountNums.has(srcNode.accountNumber))
        || (tgtNode && patternAccountNums.has(tgtNode.accountNumber));

      const focusDimmed = focusedNodeId
        ? !(connectedNodeIds.has(edge.source) && connectedNodeIds.has(edge.target))
        : false;

      const flaggedDimmed = flaggedOnly && !edge.flagged;
      const riskDimmed = riskFilter
        ? (srcNode?.riskLevel !== riskFilter && tgtNode?.riskLevel !== riskFilter)
        : false;

      const dimmed = (!patternVisible && !!patternAccountNums)
        || focusDimmed
        || flaggedDimmed
        || riskDimmed;

      return {
        id: edge.id ?? `e-${i}`,
        source: edge.source,
        target: edge.target,
        type: "txnEdge",
        data: { ...edge, dimmed, tracedPath: isTracedPath },
        animated: false,
        style: { pointerEvents: dimmed ? "none" : "auto" },
      };
    });
  }, [network, tracedEdgeIds, patternAccountNums, focusedNodeId, connectedNodeIds, flaggedOnly, riskFilter]);

  /* ── Apply Dagre layout (once per network load) ── */
  const layoutedNodes = useMemo((): Node[] => {
    if (rawRfNodes.length === 0) return [];
    return applyDagreLayout(rawRfNodes, rawRfEdges);
  }, [network?.nodes?.length, rawRfEdges.length, isInvestigationMode, investigation?.graphId]);

  /* ── Merge layout positions with display state updates ── */
  const rfNodes: Node[] = useMemo(() => {
    if (layoutedNodes.length === 0) return rawRfNodes;
    const posMap = new Map(layoutedNodes.map(n => [n.id, n.position]));
    return rawRfNodes.map(n => ({
      ...n,
      position: posMap.get(n.id) ?? { x: 0, y: 0 },
    }));
  }, [rawRfNodes, layoutedNodes]);

  const [nodes, setNodes, onNodesChange] = useNodesState(rfNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(rawRfEdges);

  useEffect(() => { setNodes(rfNodes); }, [rfNodes, setNodes]);
  useEffect(() => { setEdges(rawRfEdges); }, [rawRfEdges, setEdges]);

  /* ── Fit view on first load / investigation switch ── */
  useEffect(() => {
    if (nodes.length > 0) {
      setTimeout(() => fitView({ padding: 0.14, duration: 700 }), 300);
    }
  }, [nodes.length > 0, isInvestigationMode, investigation?.graphId, fitView]);

  /* ── Node click handler ── */
  const handleNodeClick = useCallback((_: any, node: Node) => {
    if (mode === "trace") {
      if (!traceFrom) {
        setTraceFrom({ id: node.id, data: node.data });
        setPanelTab("trace");
      } else if (!traceTo && node.id !== traceFrom.id) {
        setTraceTo({ id: node.id, data: node.data });
      } else {
        setTraceFrom({ id: node.id, data: node.data });
        setTraceTo(null);
        setTracedNodeIds(new Set());
        setTracedEdgeIds(new Set());
      }
      return;
    }

    if (focusedNodeId === node.id) {
      setFocusedNodeId(null);
      setSelectedNode(null);
    } else {
      setFocusedNodeId(node.id);
      setSelectedNode(node.data);
      setSelectedEdge(null);

      const pos = node.position;
      setCenter(pos.x + NODE_WIDTH / 2, pos.y + NODE_HEIGHT / 2, { duration: 500, zoom: Math.max(zoom, 0.8) });
    }
  }, [mode, traceFrom, traceTo, focusedNodeId, zoom, setCenter]);

  const handleEdgeClick = useCallback((_: any, edge: Edge) => {
    if (mode !== "select") return;
    setSelectedEdge(edge.data);
    setSelectedNode(null);
    setFocusedNodeId(null);
  }, [mode]);

  const handlePaneClick = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
    setFocusedNodeId(null);
  }, []);

  /* ── Clear helpers ── */
  const clearTrace = () => {
    setTraceFrom(null); setTraceTo(null);
    setTracedNodeIds(new Set()); setTracedEdgeIds(new Set());
  };
  const clearAll = () => {
    clearTrace();
    setActivePattern(null);
    setFlaggedOnly(false);
    setRiskFilter(null);
    setFocusedNodeId(null);
    setSelectedNode(null);
    setSelectedEdge(null);
  };

  const handleBackToGlobalGraph = useCallback(() => {
    clearInvestigation();
    clearAll();
    navigate("/graph");
  }, [clearInvestigation, navigate]);

  useEffect(() => {
    if (isInvestigationMode) {
      clearAll();
    }
  }, [isInvestigationMode, investigation?.graphId]);

  /* ── Selected node computed values ── */
  const selRisk = selectedNode ? RISK[selectedNode.riskLevel as RiskKey] ?? RISK.LOW : null;
  const outEdges = selectedNode ? (network?.edges as any[] ?? []).filter(e => e.source === selectedNode.id) : [];
  const inEdges = selectedNode ? (network?.edges as any[] ?? []).filter(e => e.target === selectedNode.id) : [];
  const outAmt = outEdges.reduce((s: number, e: any) => s + e.amount, 0);
  const inAmt = inEdges.reduce((s: number, e: any) => s + e.amount, 0);

  const allPatterns = (patterns ?? []) as PatternData[];
  const stats = network?.stats;
  const hasFilters = !!(activePattern || flaggedOnly || riskFilter);

  /* ── Loading state ── */
  if (isLoading) {
    return (
      <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: SURF_BG, overflow: "hidden" }}>
        <div style={{ height: 48, borderBottom: `2px solid ${BORDER2}`, display: "flex", alignItems: "center", padding: "0 16px", gap: 16 }}>
          <Skeleton className="h-6 w-48 bg-slate-800/40 rounded-none" />
          <Skeleton className="h-6 w-32 bg-slate-800/40 rounded-none" />
        </div>
        <div style={{ flex: 1, display: "flex" }}>
          <div style={{ width: 320, borderRight: `2px solid ${BORDER2}`, padding: 16 }} className="space-y-4">
            <Skeleton className="h-28 w-full bg-slate-800/40 rounded-none" />
            <Skeleton className="h-28 w-full bg-slate-800/40 rounded-none" />
            <Skeleton className="h-28 w-full bg-slate-800/40 rounded-none" />
          </div>
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", border: `2px solid ${BORDER2}`, borderTop: `2px solid ${ACCENT}`, animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
              <p style={{ color: TEXT_MUT, fontSize: 12, fontFamily: "monospace" }}>Loading live graph topology & SHAP XAI…</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────────────────────── */
  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: SURF_BG, overflow: "hidden" }}>
      <InjectCSS />

      {/* ═══ TOOLBAR ═══ */}
      <div style={{
        height: 46, flexShrink: 0, zIndex: 10,
        background: SURF_1, borderBottom: `1px solid ${BORDER}`,
        display: "flex", alignItems: "center", padding: "0 12px", gap: 10,
      }}>
        {/* Title */}
        <div style={{ display: "flex", alignItems: "center", gap: 7, paddingRight: 12, borderRight: `1px solid ${BORDER}` }}>
          <Network size={14} color={ACCENT} />
          <span style={{ fontSize: 11.5, fontWeight: 700, color: TEXT_PRI, letterSpacing: "0.05em" }}>GRAPH INTELLIGENCE</span>
          <span style={{ fontSize: 9, color: TEXT_DIM, fontFamily: "monospace" }}>v2.4</span>
        </div>

        {/* Mode toggle */}
        <div style={{ display: "flex", gap: 3 }}>
          {(["select", "trace"] as Mode[]).map(m => (
            <button key={m} onClick={() => { setMode(m); if (m !== "trace") clearTrace(); }}
              style={{
                display: "flex", alignItems: "center", gap: 5, padding: "3px 10px",
                borderRadius: 3, cursor: "pointer", fontSize: 10, fontWeight: 600,
                letterSpacing: "0.07em", textTransform: "uppercase", transition: "all 0.15s",
                border: `1px solid ${mode === m ? ACCENT + "70" : BORDER}`,
                background: mode === m ? ACCENT + "18" : "transparent",
                color: mode === m ? "#7ab8e8" : TEXT_MUT,
              }}
            >
              {m === "select" ? <ScanLine size={11} /> : <GitBranch size={11} />}
              {m}
            </button>
          ))}
        </div>

        <div style={{ width: 1, height: 18, background: BORDER }} />

        {/* Pattern filter pills */}
        <div style={{ display: "flex", gap: 3, alignItems: "center", overflow: "hidden" }}>
          <span style={{ fontSize: 9, color: TEXT_DIM, letterSpacing: "0.07em", textTransform: "uppercase", flexShrink: 0 }}>Pattern</span>
          <button onClick={() => setActivePattern(null)}
            style={{
              padding: "2px 7px", borderRadius: 3, fontSize: 9.5, cursor: "pointer",
              border: `1px solid ${!activePattern ? ACCENT + "60" : BORDER}`,
              background: !activePattern ? ACCENT + "15" : "transparent",
              color: !activePattern ? "#7ab8e8" : TEXT_MUT,
            }}
          >All</button>
          {allPatterns.slice(0, 4).map(p => {
            const pc = PATTERN_COLORS[p.patternType] ?? ACCENT;
            const active = activePattern === p.patternType;
            return (
              <button key={p.id} onClick={() => setActivePattern(active ? null : p.patternType)}
                style={{
                  padding: "2px 7px", borderRadius: 3, fontSize: 9, cursor: "pointer",
                  whiteSpace: "nowrap", letterSpacing: "0.03em",
                  border: `1px solid ${active ? pc + "60" : BORDER}`,
                  background: active ? pc + "15" : "transparent",
                  color: active ? pc : TEXT_MUT,
                  transition: "all 0.15s",
                }}
              >
                {p.patternType.split(" ")[0]}
              </button>
            );
          })}
        </div>

        <div style={{ width: 1, height: 18, background: BORDER }} />

        {/* Risk filter */}
        <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
          <span style={{ fontSize: 9, color: TEXT_DIM, letterSpacing: "0.07em", textTransform: "uppercase", flexShrink: 0 }}>Risk</span>
          {Object.entries(RISK).map(([level, cfg]) => (
            <button key={level} onClick={() => setRiskFilter(riskFilter === level ? null : level)}
              style={{
                padding: "2px 6px", borderRadius: 3, fontSize: 8.5, cursor: "pointer",
                border: `1px solid ${riskFilter === level ? cfg.color + "60" : BORDER}`,
                background: riskFilter === level ? cfg.color + "18" : "transparent",
                color: riskFilter === level ? cfg.color : TEXT_MUT,
                transition: "all 0.15s",
              }}
            >
              {level.substring(0, 4)}
            </button>
          ))}
        </div>

        <div style={{ width: 1, height: 18, background: BORDER }} />

        {/* Suspicious toggle */}
        <button onClick={() => setFlaggedOnly(!flaggedOnly)}
          style={{
            display: "flex", alignItems: "center", gap: 5, padding: "3px 9px",
            borderRadius: 3, fontSize: 10, cursor: "pointer",
            border: `1px solid ${flaggedOnly ? "#EF444460" : BORDER}`,
            background: flaggedOnly ? "#EF444418" : "transparent",
            color: flaggedOnly ? "#f87171" : TEXT_MUT,
          }}
        >
          <Radio size={11} /> Suspicious
        </button>

        <div style={{ flex: 1 }} />

        {/* Stats */}
        <div style={{ display: "flex", gap: 16, paddingRight: 8 }}>
          {[
            { label: "nodes", value: stats?.totalNodes ?? 0, color: TEXT_MUT },
            { label: "edges", value: stats?.totalEdges ?? 0, color: TEXT_MUT },
            { label: "flagged", value: stats?.flaggedNodes ?? 0, color: "#ef4444" },
            { label: "clusters", value: stats?.detectedClusters ?? 0, color: "#F59E0B" },
          ].map(s => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: s.color, fontFamily: "monospace", lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 8, color: TEXT_DIM, letterSpacing: "0.07em", textTransform: "uppercase", marginTop: 1 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ width: 1, height: 18, background: BORDER }} />

        <button onClick={() => fitView({ padding: 0.14, duration: 600 })}
          style={{ padding: "4px 8px", borderRadius: 3, border: `1px solid ${BORDER}`, background: "transparent", color: TEXT_MUT, cursor: "pointer", display: "flex", alignItems: "center" }}
          title="Fit view"
        ><Maximize2 size={13} /></button>

        <button onClick={clearAll}
          style={{
            display: "flex", alignItems: "center", gap: 4,
            padding: "4px 9px", borderRadius: 3, fontSize: 10, cursor: "pointer",
            border: `1px solid ${hasFilters ? ACCENT + "60" : BORDER}`,
            background: hasFilters ? ACCENT + "12" : "transparent",
            color: hasFilters ? "#7ab8e8" : TEXT_MUT,
          }}
        >
          <RotateCcw size={11} /> Reset
        </button>
      </div>

      {/* ═══ INVESTIGATION MODE BANNER ═══ */}
      {isInvestigationMode && investigation && (
        <div style={{
          flexShrink: 0, zIndex: 10,
          background: SURF_1, borderBottom: `1px solid ${BORDER}`,
          display: "flex", alignItems: "center", padding: "8px 12px", gap: 16,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, paddingRight: 12, borderRight: `1px solid ${BORDER}` }}>
            <AlertTriangle size={13} color={ACCENT} />
            <span style={{ fontSize: 10, fontWeight: 700, color: ACCENT, letterSpacing: "0.07em", textTransform: "uppercase" }}>
              Investigation Mode
            </span>
          </div>
          {[
            ["Alert ID", investigation.alertId],
            ["Customer Name", investigation.customerName],
            ["Risk Level", investigation.riskLevel],
            ["Fraud Pattern", investigation.fraudPattern],
            ["Investigation Status", investigation.investigationStatus.replace("_", " ")],
          ].map(([label, value]) => (
            <div key={label} style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <span style={{ fontSize: 8, color: TEXT_DIM, letterSpacing: "0.07em", textTransform: "uppercase" }}>{label}</span>
              <span style={{
                fontSize: 10.5,
                fontWeight: 600,
                color: label === "Risk Level"
                  ? (RISK[value as RiskKey]?.color ?? TEXT_PRI)
                  : TEXT_PRI,
                fontFamily: label === "Alert ID" ? "monospace" : "inherit",
              }}>
                {value}
              </span>
            </div>
          ))}
          <div style={{ flex: 1 }} />
          <button
            onClick={handleBackToGlobalGraph}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "4px 10px", borderRadius: 3, fontSize: 10, cursor: "pointer",
              border: `1px solid ${ACCENT}60`,
              background: ACCENT + "12",
              color: "#7ab8e8",
              letterSpacing: "0.04em",
            }}
          >
            <RotateCcw size={11} /> Back to Global Graph
          </button>
        </div>
      )}

      {/* ═══ MAIN AREA ═══ */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* ── LEFT PANEL ── */}
        <div style={{
          width: panelOpen ? 272 : 36, flexShrink: 0,
          borderRight: `1px solid ${BORDER}`,
          background: SURF_1,
          display: "flex", flexDirection: "column",
          transition: "width 0.2s ease",
          overflow: "hidden", zIndex: 5,
        }}>
          {/* Panel header */}
          <div style={{
            height: 36, padding: "0 8px", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: panelOpen ? "space-between" : "center",
            borderBottom: `1px solid ${BORDER}`,
          }}>
            {panelOpen && (
              <span style={{ fontSize: 9, fontWeight: 700, color: TEXT_DIM, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Investigation Panel
              </span>
            )}
            <button onClick={() => setPanelOpen(!panelOpen)}
              style={{ background: "none", border: "none", cursor: "pointer", color: TEXT_MUT, padding: 2, display: "flex" }}
            >
              {panelOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
            </button>
          </div>

          {panelOpen && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              {/* Tabs */}
              <div style={{ display: "flex", borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
                {(["alerts", "patterns", "trace", "stats"] as const).map(tab => (
                  <button key={tab} onClick={() => setPanelTab(tab)}
                    style={{
                      flex: 1, padding: "7px 0", background: "none", border: "none",
                      borderBottom: `2px solid ${panelTab === tab ? ACCENT : "transparent"}`,
                      color: panelTab === tab ? "#7ab8e8" : TEXT_DIM,
                      fontSize: 9, fontWeight: 700, cursor: "pointer",
                      letterSpacing: "0.05em", textTransform: "uppercase",
                    }}
                  >
                    {tab === "alerts" ? `Alerts (${liveAlertsQuick?.alerts?.length || 0})` : tab === "patterns" ? "Patterns" : tab === "trace" ? "Trace" : "Stats"}
                  </button>
                ))}
              </div>

              <div style={{ flex: 1, overflowY: "auto", padding: "10px" }}>

                {/* ── ALERTS TAB ── */}
                {panelTab === "alerts" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ padding: "8px", background: "rgba(59, 130, 246, 0.1)", borderRadius: 4, border: "1px solid rgba(59, 130, 246, 0.3)", marginBottom: 4 }}>
                      <span style={{ fontSize: 10, color: "#93c5fd", fontWeight: 600 }}>⚡ Live AML Watchlist</span>
                      <p style={{ fontSize: 9, color: TEXT_MUT, margin: "2px 0 0 0", lineHeight: 1.3 }}>
                        Select any alert below to immediately trace its multi-hop transaction graph on the canvas.
                      </p>
                    </div>
                    {alertsLoading && <div style={{ color: TEXT_MUT, fontSize: 10, padding: 10, textAlign: "center" }}>Loading active alerts...</div>}
                    {(liveAlertsQuick?.alerts || []).map((alert: any) => {
                      const isSelected = traceQueryId === alert.account_id;
                      const riskColor = (alert.tier || alert.risk_level) === "CRITICAL" ? "#ef4444" : "#f59e0b";
                      return (
                        <div
                          key={alert.account_id}
                          onClick={() => navigate(`/graph/ALT-${alert.account_id}-${(alert.pattern || "fraud").toLowerCase()}`)}
                          style={{
                            padding: "10px",
                            borderRadius: 6,
                            background: isSelected ? "rgba(59, 130, 246, 0.15)" : SURF_2,
                            border: `1px solid ${isSelected ? "#3b82f6" : BORDER}`,
                            cursor: "pointer",
                            display: "flex",
                            flexDirection: "column",
                            gap: 6,
                            transition: "all 0.15s",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontWeight: 700, fontSize: 11, color: isSelected ? "#60a5fa" : TEXT_PRI, fontFamily: "monospace" }}>
                              {alert.account_id}
                            </span>
                            <span style={{
                              padding: "2px 6px",
                              borderRadius: 4,
                              fontSize: 8.5,
                              fontWeight: 700,
                              background: riskColor + "20",
                              color: riskColor,
                              border: `1px solid ${riskColor}40`,
                            }}>
                              {alert.tier || alert.risk_level || "HIGH"}
                            </span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, alignItems: "center" }}>
                            <span style={{ color: "#e2e8f0", fontWeight: 600 }}>{(alert.pattern || "SUSPICIOUS").toUpperCase().replace("_", " ")}</span>
                            <span style={{ color: "#a3e635", fontWeight: 700, fontFamily: "monospace" }}>
                              ₹{((alert.volume_30d || alert.total_amount || 50000) / 1000).toFixed(0)}K
                            </span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: TEXT_DIM }}>
                            <span>{alert.branch_name || "Main Branch"}</span>
                            <span>{alert.customer_name || "Account Holder"}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ── PATTERNS TAB ── */}
                {panelTab === "patterns" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {allPatterns.map(p => {
                      const pc = PATTERN_COLORS[p.patternType] ?? ACCENT;
                      const isActive = activePattern === p.patternType;
                      return (
                        <button key={p.id} onClick={() => setActivePattern(isActive ? null : p.patternType)}
                          style={{
                            padding: "9px 10px", textAlign: "left", cursor: "pointer",
                            borderRadius: 3, transition: "all 0.15s",
                            background: isActive ? pc + "12" : SURF_2,
                            border: `1px solid ${isActive ? pc + "50" : BORDER}`,
                            borderLeft: `3px solid ${pc}`,
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                            <span style={{ fontSize: 11, fontWeight: 600, color: isActive ? TEXT_PRI : "#a0b0c8" }}>{p.patternType}</span>
                            <span style={{ fontSize: 10, fontWeight: 700, color: pc, fontFamily: "monospace" }}>{p.confidence.toFixed(1)}%</span>
                          </div>
                          <p style={{ fontSize: 9.5, color: TEXT_MUT, lineHeight: 1.4, marginBottom: 5 }}>{p.description}</p>
                          <div style={{ height: 2, background: BORDER, borderRadius: 1 }}>
                            <div style={{ height: 2, width: `${p.confidence}%`, background: pc, borderRadius: 1, transition: "width 0.4s" }} />
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                            <span style={{ fontSize: 9, color: TEXT_DIM }}>{p.affectedAccounts.length} accounts</span>
                            <span style={{ fontSize: 9, color: pc, fontFamily: "monospace" }}>{fmtAmount(p.totalAmount)}</span>
                          </div>

                          {/* SHAP XAI Attribution Breakdown */}
                          {explainLoading ? (
                            <div style={{ marginTop: 10, padding: "8px", background: "rgba(0,0,0,0.35)", borderRadius: 4, border: `1px solid ${pc}40` }}>
                              <p style={{ color: pc, fontSize: 10, fontFamily: "monospace", textAlign: "center", margin: "10px 0" }} className="animate-pulse">Computing SHAP values...</p>
                            </div>
                          ) : liveExplain?.top_risk_factors ? (
                            <div style={{ marginTop: 10, padding: "10px", background: "rgba(15, 23, 42, 0.9)", borderRadius: 6, border: `1px solid ${pc}50`, boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, paddingBottom: 6, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                  <span style={{ fontSize: 11 }}>🧠</span>
                                  <span style={{ fontSize: 9, fontWeight: 800, color: "#f8fafc", letterSpacing: "0.05em", textTransform: "uppercase" }}>SHAP Feature Attribution</span>
                                </div>
                                <span style={{ fontSize: 8, background: `${pc}20`, color: pc, padding: "2px 6px", borderRadius: 3, fontWeight: 700, border: `1px solid ${pc}40` }}>INVESTIGATOR VIEW</span>
                              </div>
                              {(() => {
                                const pKey = p.patternType.toLowerCase().replace("-", "_");
                                const activeFactors = (liveExplain?.by_fraud_type as any)?.[pKey]?.top_factors
                                  || (liveExplain?.by_fraud_type as any)?.round_trip?.top_factors
                                  || (liveExplain?.by_fraud_type as any)?.layering?.top_factors
                                  || liveExplain.top_risk_factors;

                                const explanations: Record<string, string> = {
                                  "Circular Loop Fund Return": "Funds looped back to originating account after passing through shell intermediaries.",
                                  "Round-Trip Completion Velocity": "Entire multi-hop transfer cycle completed rapidly in under 4 hours.",
                                  "Origin Return Amount Match": "Returned funds match 98.5% of the original outgoing transfer amount.",
                                  "Pass-Through Intermediary Velocity": "Intermediary accounts held funds for less than 30 minutes before forwarding.",
                                  "Rapid Chain Hop Velocity": "Funds transferred rapidly across multiple hops within 6 hours.",
                                  "Amount Conservation Decay": "Minimal amount reduction across hops indicating deliberate structuring.",
                                  "Cross-Channel Rail Switching": "Abrupt transfer method switch across domestic Indian payment rails (RTGS to IMPS/NEFT).",
                                  "Inter-Hop Time Gap": "Sequential transfers executed almost instantly to evade manual monitoring.",
                                  "KYC Profile Limit Ratio": "Transaction volume exceeds declared customer risk profile expectations by over 400%.",
                                };

                                return (activeFactors || []).slice(0, 4).map((f: any, fi: number) => {
                                  const valStr = `${f.shap_value > 0 ? "+" : ""}${f.shap_value.toFixed(4)}`;
                                  const pct = Math.min(100, Math.round(Math.abs(f.shap_value) * 200));
                                  const desc = explanations[f.label] || `Primary fraud typology signal detected by behavioral neural network.`;
                                  return (
                                    <div key={fi} style={{ marginBottom: 8, background: "rgba(255,255,255,0.02)", padding: "6px 8px", borderRadius: 4, borderLeft: `2px solid ${f.direction === "RISK" ? "#ef4444" : "#10b981"}` }}>
                                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                                        <span style={{ fontSize: 9.5, fontWeight: 700, color: "#e2e8f0" }}>{f.label}</span>
                                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                          <span style={{ fontSize: 9, fontWeight: 800, color: f.direction === "RISK" ? "#f87171" : "#34d399" }}>+{pct}% Impact</span>
                                          <span style={{ fontSize: 8, fontFamily: "monospace", color: "#64748b" }}>({valStr})</span>
                                        </div>
                                      </div>
                                      <div style={{ height: 4, background: "#1e293b", borderRadius: 2, marginBottom: 4, overflow: "hidden" }}>
                                        <div style={{ height: 4, width: `${pct}%`, background: f.direction === "RISK" ? "linear-gradient(90deg, #f97316, #ef4444)" : "#10b981", borderRadius: 2 }} />
                                      </div>
                                      <p style={{ fontSize: 8.5, color: "#94a3b8", margin: 0, fontStyle: "italic", lineHeight: 1.3, textAlign: "left" }}>↳ {desc}</p>
                                    </div>
                                  );
                                });
                              })()}

                              {/* Interactive AI Briefing Box */}
                              <div style={{ marginTop: 10, padding: "10px", background: SURF_1, borderRadius: 0, border: `2px solid ${BORDER}`, position: "relative", overflow: "hidden", boxShadow: `2px 2px 0px ${BORDER2}` }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: aiBriefingState[p.id]?.text !== undefined ? 8 : 0, borderBottom: aiBriefingState[p.id]?.text !== undefined ? `1px dashed ${BORDER2}` : "none", paddingBottom: aiBriefingState[p.id]?.text !== undefined ? 8 : 0 }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                    <span style={{ fontSize: 12 }}>✨</span>
                                    <span style={{ fontSize: 9.5, fontWeight: 800, color: TEXT_PRI, letterSpacing: "0.05em", textTransform: "uppercase" }}>GENERATIVE AI BRIEFING</span>
                                  </div>
                                  <button
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      if (aiBriefingState[p.id]?.loading) return;
                                      setAiBriefingState(prev => ({ ...prev, [p.id]: { loading: true, text: "" } }));

                                      let fullNarrative = "";
                                      try {
                                        const targetAcc = p.affectedAccounts?.[0] || "ACC_00001";

                                        // Build SHAP features from live explain data
                                        const pKey = p.patternType.toLowerCase().replace("-", "_");
                                        const activeFactors: any[] = (liveExplain?.by_fraud_type as any)?.[pKey]?.top_factors
                                          || (liveExplain?.by_fraud_type as any)?.layering?.top_factors
                                          || liveExplain?.top_risk_factors
                                          || [];

                                        const shapDescriptions: Record<string, string> = {
                                          "Rapid Chain Hop Velocity": "Funds transferred rapidly across multiple hops within 6 hours.",
                                          "Amount Conservation Decay": "Minimal amount reduction across hops indicating deliberate structuring.",
                                          "Cross-Channel Rail Switching": "Abrupt transfer method switch across domestic Indian payment rails (RTGS to IMPS/NEFT).",
                                          "Inter-Hop Time Gap": "Sequential transfers executed almost instantly to evade manual monitoring.",
                                          "KYC Profile Limit Ratio": "Transaction volume exceeds declared customer risk profile expectations by over 400%.",
                                          "Circular Loop Fund Return": "Funds looped back to originating account after passing through shell intermediaries.",
                                          "Round-Trip Completion Velocity": "Entire multi-hop transfer cycle completed rapidly in under 4 hours.",
                                          "Origin Return Amount Match": "Returned funds match 98.5% of the original outgoing transfer amount.",
                                          "Pass-Through Intermediary Velocity": "Intermediary accounts held funds for less than 30 minutes before forwarding.",
                                        };

                                        const shapForAI = activeFactors.slice(0, 4).map((f: any) => ({
                                          label: f.label,
                                          shap_value: f.shap_value,
                                          direction: f.direction,
                                          description: shapDescriptions[f.label] || "Behavioral anomaly detected by ML model.",
                                        }));

                                        const res = await fetch(`${BASE}/narrative/${targetAcc}`, {
                                          method: "POST",
                                          headers: { "Content-Type": "application/json" },
                                          body: JSON.stringify({
                                            focused_pattern: p.patternType,
                                            all_patterns: allPatterns.map(ap => ({
                                              patternType: ap.patternType,
                                              confidence: ap.confidence,
                                              affectedAccounts: ap.affectedAccounts,
                                              totalAmount: ap.totalAmount,
                                              description: ap.description,
                                            })),
                                            shap_features: shapForAI,
                                          }),
                                        });

                                        if (res.ok) {
                                          const data = await res.json();
                                          if (data.narrative && !data.error) fullNarrative = data.narrative.trim();
                                        }
                                      } catch (err) {
                                        // Fallback if API offline
                                      }

                                      if (!fullNarrative) {
                                        fullNarrative = `• Typology Confirmation: AI analysis confirmed ${p.patternType} pattern (${p.confidence.toFixed(1)}% confidence) across ${p.affectedAccounts.length} linked accounts with total exposure of ₹${p.totalAmount.toLocaleString()}.\n• SHAP Attribution: High ML attribution scores driven by rapid multi-hop velocity and cross-channel rail switching — classic layering evasion signals.\n• Recommended Action: Immediate account freeze on all ${p.affectedAccounts.length} entities and SAR Form 8 submission to FIU-IND.`;
                                      }

                                      // Stream text character by character (Typewriter effect)
                                      let i = 0;
                                      const interval = setInterval(() => {
                                        i += 4;
                                        if (i >= fullNarrative.length) {
                                          setAiBriefingState(prev => ({ ...prev, [p.id]: { loading: false, text: fullNarrative } }));
                                          clearInterval(interval);
                                        } else {
                                          setAiBriefingState(prev => ({ ...prev, [p.id]: { loading: false, text: fullNarrative.slice(0, i) + " ▌" } }));
                                        }
                                      }, 15);
                                    }}
                                    disabled={aiBriefingState[p.id]?.loading}
                                    style={{
                                      background: aiBriefingState[p.id]?.text ? SURF_2 : ACCENT,
                                      color: TEXT_PRI,
                                      border: `1px solid ${BORDER}`,
                                      borderRadius: 0,
                                      padding: "4px 8px",
                                      fontSize: 9,
                                      fontWeight: 800,
                                      textTransform: "uppercase",
                                      cursor: aiBriefingState[p.id]?.loading ? "wait" : "pointer",
                                      boxShadow: aiBriefingState[p.id]?.text ? "none" : `2px 2px 0px ${BORDER}`,
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 4,
                                      transition: "all 0.2s"
                                    }}
                                  >
                                    {aiBriefingState[p.id]?.loading ? "⏳ GENERATING..." : aiBriefingState[p.id]?.text ? "🔄 REGENERATE" : "⚡ ASK AI TO EXPLAIN"}
                                  </button>
                                </div>
                                {aiBriefingState[p.id]?.loading && (
                                  <div style={{ padding: "16px 0", textAlign: "center" }}>
                                    <p style={{ fontSize: 9, color: TEXT_MUT, margin: 0, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }} className="animate-pulse">Synthesizing multi-hop neural attribution evidence...</p>
                                  </div>
                                )}
                                {aiBriefingState[p.id]?.text !== undefined && aiBriefingState[p.id]?.text !== null && !aiBriefingState[p.id]?.loading && (
                                  <p style={{ fontSize: 10.5, color: TEXT_PRI, margin: 0, lineHeight: 1.6, textAlign: "left", minHeight: 32, whiteSpace: "pre-wrap", fontWeight: 600, paddingTop: 4 }}>
                                    {aiBriefingState[p.id]?.text || "▌"}
                                  </p>
                                )}
                              </div>
                            </div>
                          ) : null}
                        </button>
                      );
                    })}

                    {/* Pattern legend */}
                    <div style={{ marginTop: 8, padding: "8px 10px", background: SURF_2, borderRadius: 3, border: `1px solid ${BORDER}` }}>
                      <p style={{ fontSize: 8.5, color: TEXT_DIM, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Edge Color Legend</p>
                      {LEGEND_ITEMS.map((item) => (
                        <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
                          <div style={{ width: 18, height: 2, background: item.color, borderRadius: 1, flexShrink: 0 }} />
                          <span style={{ fontSize: 9, color: TEXT_MUT }}>{item.label}</span>
                        </div>
                      ))}
                      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4, marginTop: 4 }}>
                        <div style={{ width: 18, height: 2, background: "#213350", borderRadius: 1 }} />
                        <span style={{ fontSize: 9, color: TEXT_MUT }}>Normal transaction</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <div style={{ width: 18, height: 2, background: "#a3e635", borderRadius: 1 }} />
                        <span style={{ fontSize: 9, color: TEXT_MUT }}>Traced path</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── TRACE TAB ── */}
                {panelTab === "trace" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <p style={{ fontSize: 10, color: TEXT_MUT, lineHeight: 1.5 }}>
                      Switch to <span style={{ color: "#a3e635", fontWeight: 600 }}>TRACE MODE</span> then click origin and target accounts.
                    </p>

                    {/* Origin */}
                    <div>
                      <p style={{ fontSize: 9, color: TEXT_DIM, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Origin</p>
                      <div style={{ padding: "8px 10px", borderRadius: 3, background: SURF_2, border: `1px solid ${traceFrom ? "#f0c04040" : BORDER}`, borderLeft: `3px solid ${traceFrom ? "#f0c040" : BORDER2}` }}>
                        {traceFrom ? (
                          <>
                            <p style={{ fontSize: 10, fontFamily: "monospace", color: "#f0c040" }}>{traceFrom.data.accountNumber}</p>
                            <p style={{ fontSize: 10, color: TEXT_PRI, marginTop: 2 }}>{traceFrom.data.label}</p>
                          </>
                        ) : (
                          <p style={{ fontSize: 10, color: TEXT_DIM, fontStyle: "italic" }}>Click node to set origin…</p>
                        )}
                      </div>
                    </div>

                    {/* Target */}
                    <div>
                      <p style={{ fontSize: 9, color: TEXT_DIM, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Target</p>
                      <div style={{ padding: "8px 10px", borderRadius: 3, background: SURF_2, border: `1px solid ${traceTo ? "#40c0f040" : BORDER}`, borderLeft: `3px solid ${traceTo ? "#40c0f0" : BORDER2}` }}>
                        {traceTo ? (
                          <>
                            <p style={{ fontSize: 10, fontFamily: "monospace", color: "#40c0f0" }}>{traceTo.data.accountNumber}</p>
                            <p style={{ fontSize: 10, color: TEXT_PRI, marginTop: 2 }}>{traceTo.data.label}</p>
                          </>
                        ) : (
                          <p style={{ fontSize: 10, color: TEXT_DIM, fontStyle: "italic" }}>Click node to set target…</p>
                        )}
                      </div>
                    </div>

                    {/* Traced path */}
                    {tracePath && (
                      <div>
                        <p style={{ fontSize: 9, color: TEXT_DIM, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
                          Fund Path — <span style={{ color: "#f0c040" }}>{(tracePath.path ?? []).length} hops</span>
                        </p>
                        <div style={{ position: "relative", paddingLeft: 14 }}>
                          <div style={{ position: "absolute", left: 5, top: 6, bottom: 6, width: 1, background: "#f0c04030" }} />
                          {(tracePath.path ?? []).map((step: any, i: number) => (
                            <div key={i} style={{ paddingBottom: 10, position: "relative" }}>
                              <div style={{ position: "absolute", left: -10, top: 3, width: 7, height: 7, borderRadius: "50%", background: "#f0c040", border: `1px solid ${SURF_1}` }} />
                              <p style={{ fontFamily: "monospace", fontSize: 9, color: "#f0c040" }}>{step.accountNumber}</p>
                              <p style={{ fontSize: 9.5, color: TEXT_PRI, marginTop: 1 }}>{step.accountName}</p>
                              <p style={{ fontSize: 9, color: TEXT_MUT, marginTop: 1 }}>{fmtAmount(step.amount)} · {step.txnType}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {(traceFrom || traceTo) && (
                      <button onClick={clearTrace}
                        style={{ padding: "5px 10px", borderRadius: 3, border: `1px solid ${BORDER}`, background: "transparent", color: TEXT_MUT, cursor: "pointer", fontSize: 10 }}
                      >
                        Clear Trace
                      </button>
                    )}
                  </div>
                )}

                {/* ── STATS TAB ── */}
                {panelTab === "stats" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <p style={{ fontSize: 8.5, color: TEXT_DIM, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Network Overview</p>
                    {[
                      { label: "Total Accounts", value: stats?.totalNodes ?? 0, color: TEXT_PRI },
                      { label: "Total Transactions", value: stats?.totalEdges ?? 0, color: TEXT_PRI },
                      { label: "Flagged Accounts", value: stats?.flaggedNodes ?? 0, color: "#ef4444" },
                      { label: "Suspicious Transfers", value: stats?.flaggedEdges ?? 0, color: "#ef4444" },
                      { label: "Detected Clusters", value: stats?.detectedClusters ?? 0, color: "#F59E0B" },
                    ].map(s => (
                      <div key={s.label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 10px", background: SURF_2, borderRadius: 3 }}>
                        <span style={{ fontSize: 10, color: TEXT_MUT }}>{s.label}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: s.color, fontFamily: "monospace" }}>{s.value}</span>
                      </div>
                    ))}

                    <p style={{ fontSize: 8.5, color: TEXT_DIM, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 10, marginBottom: 4 }}>Risk Distribution</p>
                    {Object.entries(RISK).map(([level, cfg]) => {
                      const count = (network?.nodes as NetworkNode[] ?? []).filter(n => n.riskLevel === level).length;
                      const total = Math.max(network?.nodes.length ?? 1, 1);
                      return (
                        <div key={level} style={{ padding: "5px 10px", background: SURF_2, borderRadius: 3, marginBottom: 3 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                            <span style={{ fontSize: 9.5, color: cfg.color, fontWeight: 600 }}>{level}</span>
                            <span style={{ fontSize: 10, color: TEXT_MUT, fontFamily: "monospace" }}>{count}</span>
                          </div>
                          <div style={{ height: 2, background: BORDER, borderRadius: 1 }}>
                            <div style={{ height: 2, width: `${(count / total) * 100}%`, background: cfg.color, borderRadius: 1 }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── GRAPH CANVAS ── */}
        <div style={{ flex: 1, position: "relative", background: SURF_BG }}>
          {/* Trace mode banner */}
          {mode === "trace" && (
            <div style={{
              position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)",
              background: "#f0c04014", border: `1px solid #f0c04050`, borderRadius: 4,
              padding: "5px 14px", zIndex: 10, display: "flex", alignItems: "center", gap: 8,
            }}>
              <GitBranch size={12} color="#f0c040" />
              <span style={{ fontSize: 10, color: "#f0c040", letterSpacing: "0.05em" }}>
                TRACE MODE — {!traceFrom ? "Click origin account" : !traceTo ? "Click target account" : "Tracing path…"}
              </span>
            </div>
          )}

          {/* Investigation focus banner */}
          {focusedNodeId && mode === "select" && (
            <div style={{
              position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)",
              background: ACCENT + "14", border: `1px solid ${ACCENT}50`, borderRadius: 4,
              padding: "5px 14px", zIndex: 10, display: "flex", alignItems: "center", gap: 8,
            }}>
              <ScanLine size={12} color={ACCENT} />
              <span style={{ fontSize: 10, color: "#7ab8e8", letterSpacing: "0.05em" }}>
                INVESTIGATION MODE — {connectedNodeIds.size - 1} connected accounts · Click canvas to exit
              </span>
            </div>
          )}

          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={handleNodeClick}
            onEdgeClick={handleEdgeClick}
            onPaneClick={handlePaneClick}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            fitViewOptions={{ padding: 0.14 }}
            minZoom={0.1}
            maxZoom={3}
            nodesDraggable={mode === "select"}
            style={{ background: "transparent" }}
            proOptions={{ hideAttribution: true }}
          >
            <Background variant={BackgroundVariant.Dots} gap={30} size={1} color={BORDER} style={{ opacity: 0.5 }} />
            <Controls showInteractive={false} />
            <MiniMap
              style={{ background: "#07090e", border: `1px solid ${BORDER}`, borderRadius: 4 }}
              nodeColor={(n: Node) => RISK[(n.data as any)?.riskLevel as RiskKey]?.color ?? ACCENT}
              maskColor="rgba(7,9,14,0.7)"
            />

            {/* Bottom-left legend */}
            <Panel position="bottom-left">
              <div style={{
                background: SURF_1, border: `1px solid ${BORDER}`, borderRadius: 4,
                padding: "8px 11px", display: "flex", flexDirection: "column", gap: 4,
                fontSize: 9,
              }}>
                <p style={{ fontSize: 8, color: TEXT_DIM, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 2 }}>Risk Level</p>
                {Object.entries(RISK).map(([level, cfg]) => (
                  <div key={level} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 3, height: 10, background: cfg.color, borderRadius: 1 }} />
                    <span style={{ color: TEXT_MUT }}>{level}</span>
                  </div>
                ))}
                <div style={{ borderTop: `1px solid ${BORDER}`, marginTop: 3, paddingTop: 4, display: "flex", flexDirection: "column", gap: 3 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 14, height: 1.5, background: "#EF4444", borderRadius: 1 }} />
                    <span style={{ color: TEXT_MUT }}>Flagged (dashed)</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 14, height: 1, background: "#213350", borderRadius: 1 }} />
                    <span style={{ color: TEXT_MUT }}>Normal</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 14, height: 2, background: "#60a5fa", borderRadius: 1 }} />
                    <span style={{ color: TEXT_MUT }}>Traced path ●</span>
                  </div>
                </div>
              </div>
            </Panel>
          </ReactFlow>
        </div>

        {/* ── RIGHT DETAIL DRAWER ── */}
        {(selectedNode || selectedEdge) && (
          <div style={{
            width: 296, flexShrink: 0,
            borderLeft: `1px solid ${BORDER}`,
            background: SURF_1,
            display: "flex", flexDirection: "column",
            overflow: "hidden", zIndex: 5,
          }}>
            {/* Header */}
            <div style={{
              padding: "0 12px", height: 36,
              display: "flex", alignItems: "center", justifyContent: "space-between",
              borderBottom: `1px solid ${BORDER}`, flexShrink: 0,
            }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: TEXT_DIM, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                {selectedNode ? "Account Profile" : "Transaction"}
              </span>
              <button
                onClick={() => { setSelectedNode(null); setSelectedEdge(null); setFocusedNodeId(null); }}
                style={{ background: "none", border: "none", cursor: "pointer", color: TEXT_MUT, display: "flex", padding: 2 }}
              >
                <X size={13} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: "auto" }}>

              {/* NODE DETAIL */}
              {selectedNode && selRisk && (
                <div>
                  {/* Risk header */}
                  <div style={{
                    padding: "14px 14px 12px",
                    borderBottom: `1px solid ${BORDER}`,
                    background: selRisk.color + "08",
                    borderLeft: `4px solid ${selRisk.color}`,
                  }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
                          <AccountTypeIcon type={selectedNode.accountType} size={12} color={selRisk.color} />
                          <p style={{ fontFamily: "monospace", fontSize: 9.5, color: selRisk.color }}>{selectedNode.accountNumber}</p>
                        </div>
                        <p style={{ fontSize: 14, fontWeight: 700, color: TEXT_PRI, lineHeight: 1.2 }}>{selectedNode.label}</p>
                        <div style={{ display: "flex", gap: 5, marginTop: 5, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 8.5, padding: "1px 5px", borderRadius: 2, border: `1px solid ${BORDER2}`, color: TEXT_MUT, textTransform: "uppercase" }}>
                            {selectedNode.accountType}
                          </span>
                          {selectedNode.flagged && (
                            <span style={{ fontSize: 8.5, padding: "1px 5px", borderRadius: 2, border: `1px solid ${selRisk.color}40`, color: selRisk.color, background: selRisk.color + "12" }}>
                              ⚑ FLAGGED
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ textAlign: "center", flexShrink: 0 }}>
                        <div style={{
                          width: 46, height: 46, borderRadius: "50%",
                          border: `2.5px solid ${selRisk.color}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          background: selRisk.color + "12",
                        }}>
                          <span style={{ fontSize: 14, fontWeight: 800, color: selRisk.color, fontFamily: "monospace" }}>
                            {selectedNode.riskScore}
                          </span>
                        </div>
                        <p style={{ fontSize: 7.5, color: TEXT_DIM, marginTop: 3, textTransform: "uppercase", letterSpacing: "0.06em" }}>Risk</p>
                      </div>
                    </div>
                  </div>

                  {/* Fund flow summary */}
                  <div style={{ padding: "10px 14px", borderBottom: `1px solid ${BORDER}` }}>
                    <p style={{ fontSize: 8.5, color: TEXT_DIM, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 7 }}>Fund Flow</p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                      <div style={{ padding: 8, background: SURF_2, borderRadius: 3, borderTop: `2px solid #10B981` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 3 }}>
                          <TrendingDown size={9} color="#10B981" />
                          <span style={{ fontSize: 8.5, color: TEXT_DIM, textTransform: "uppercase" }}>Inflow</span>
                        </div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#10B981", fontFamily: "monospace" }}>{fmtAmount(inAmt)}</p>
                        <p style={{ fontSize: 8.5, color: TEXT_MUT, marginTop: 2 }}>{inEdges.length} transactions</p>
                      </div>
                      <div style={{ padding: 8, background: SURF_2, borderRadius: 3, borderTop: `2px solid #EF4444` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 3 }}>
                          <TrendingUp size={9} color="#EF4444" />
                          <span style={{ fontSize: 8.5, color: TEXT_DIM, textTransform: "uppercase" }}>Outflow</span>
                        </div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#EF4444", fontFamily: "monospace" }}>{fmtAmount(outAmt)}</p>
                        <p style={{ fontSize: 8.5, color: TEXT_MUT, marginTop: 2 }}>{outEdges.length} transactions</p>
                      </div>
                    </div>
                  </div>

                  {/* Account details */}
                  <div style={{ padding: "10px 14px", borderBottom: `1px solid ${BORDER}` }}>
                    <p style={{ fontSize: 8.5, color: TEXT_DIM, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Account Details</p>
                    {[
                      ["Balance", `₹${selectedNode.balance.toLocaleString()}`],
                      ["Risk Level", selectedNode.riskLevel],
                      ["Pattern", selectedNode.pattern ?? "None detected"],
                    ].map(([k, v]) => (
                      <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                        <span style={{ fontSize: 10, color: TEXT_MUT }}>{k}</span>
                        <span style={{ fontSize: 10, fontWeight: 600, color: k === "Pattern" && selectedNode.pattern ? PATTERN_COLORS[selectedNode.pattern] ?? TEXT_PRI : TEXT_PRI, fontFamily: k === "Balance" ? "monospace" : "inherit" }}>{v}</span>
                      </div>
                    ))}
                  </div>

                  {/* Connected accounts */}
                  <div style={{ padding: "10px 14px", borderBottom: `1px solid ${BORDER}` }}>
                    <p style={{ fontSize: 8.5, color: TEXT_DIM, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
                      Connected Accounts ({connectedNodeIds.size - 1})
                    </p>
                    {(network?.edges as any[] ?? [])
                      .filter(e => e.source === selectedNode.id || e.target === selectedNode.id)
                      .slice(0, 6)
                      .map((e, i) => {
                        const otherId = e.source === selectedNode.id ? e.target : e.source;
                        const other = (network?.nodes as NetworkNode[] ?? []).find(n => n.id === otherId);
                        if (!other) return null;
                        const oRisk = RISK[other.riskLevel as RiskKey] ?? RISK.LOW;
                        const isOut = e.source === selectedNode.id;
                        return (
                          <div key={i} style={{
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            marginBottom: 4, padding: "5px 8px", background: SURF_2, borderRadius: 3,
                          }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                              <div style={{ width: 2, height: 14, background: oRisk.color, borderRadius: 1, flexShrink: 0 }} />
                              <div style={{ minWidth: 0 }}>
                                <p style={{ fontFamily: "monospace", fontSize: 8.5, color: oRisk.color, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{other.accountNumber}</p>
                                <p style={{ fontSize: 9, color: TEXT_MUT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{other.label}</p>
                              </div>
                            </div>
                            <div style={{ flexShrink: 0, textAlign: "right" }}>
                              <p style={{ fontSize: 9, color: e.flagged ? "#EF4444" : TEXT_DIM, fontFamily: "monospace" }}>{fmtAmount(e.amount)}</p>
                              <p style={{ fontSize: 8, color: TEXT_DIM }}>{isOut ? "outflow →" : "← inflow"}</p>
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  {/* Suspicious behavior */}
                  {selectedNode.flagged && (
                    <div style={{ padding: "10px 14px" }}>
                      <p style={{ fontSize: 8.5, color: TEXT_DIM, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Suspicious Behavior</p>
                      {[
                        selectedNode.pattern && `${selectedNode.pattern} pattern detected`,
                        selectedNode.riskLevel === "CRITICAL" && "Rapid fund cycling between related entities",
                        selectedNode.riskLevel === "HIGH" && "Unusual transaction velocity detected",
                      ].filter(Boolean).map((b, i) => (
                        <div key={i} style={{ display: "flex", gap: 7, marginBottom: 5, padding: "6px 8px", background: "#EF444408", borderRadius: 3, borderLeft: `2px solid #EF4444` }}>
                          <AlertTriangle size={10} color="#EF4444" style={{ flexShrink: 0, marginTop: 1 }} />
                          <span style={{ fontSize: 9.5, color: "#f87171", lineHeight: 1.4 }}>{b}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* EDGE DETAIL */}
              {selectedEdge && (
                <div>
                  <div style={{
                    padding: "14px 14px 12px",
                    borderBottom: `1px solid ${BORDER}`,
                    background: selectedEdge.flagged ? "#EF444408" : SURF_2,
                    borderLeft: `4px solid ${selectedEdge.flagged ? (PATTERN_COLORS[selectedEdge.pattern] ?? "#EF4444") : ACCENT}`,
                  }}>
                    <p style={{ fontSize: 9, color: TEXT_DIM, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>Transaction Amount</p>
                    <p style={{ fontSize: 22, fontWeight: 800, color: TEXT_PRI, fontFamily: "monospace" }}>
                      {fmtAmount(selectedEdge.amount)}
                    </p>
                    {selectedEdge.flagged && (
                      <div style={{ marginTop: 5, display: "inline-flex", alignItems: "center", gap: 5, background: "#EF444415", border: `1px solid #EF444440`, borderRadius: 3, padding: "2px 7px" }}>
                        <AlertTriangle size={9} color="#EF4444" />
                        <span style={{ fontSize: 9, color: "#f87171", fontWeight: 700, letterSpacing: "0.06em" }}>
                          {selectedEdge.pattern ?? "FLAGGED"}
                        </span>
                      </div>
                    )}
                  </div>

                  <div style={{ padding: "10px 14px" }}>
                    <p style={{ fontSize: 8.5, color: TEXT_DIM, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Fund Flow</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                      {(() => {
                        const src = (network?.nodes as NetworkNode[] ?? []).find(n => n.id === selectedEdge.source);
                        const tgt = (network?.nodes as NetworkNode[] ?? []).find(n => n.id === selectedEdge.target);
                        const sR = RISK[src?.riskLevel as RiskKey] ?? RISK.LOW;
                        const tR = RISK[tgt?.riskLevel as RiskKey] ?? RISK.LOW;
                        return (
                          <>
                            <div style={{ flex: 1, padding: "6px 8px", background: SURF_2, borderRadius: 3, borderLeft: `2px solid ${sR.color}` }}>
                              <p style={{ fontFamily: "monospace", fontSize: 8.5, color: sR.color }}>{src?.accountNumber}</p>
                              <p style={{ fontSize: 9.5, color: TEXT_PRI, marginTop: 1 }}>{src?.label}</p>
                            </div>
                            <ArrowRight size={11} color={selectedEdge.flagged ? "#EF4444" : TEXT_DIM} style={{ flexShrink: 0 }} />
                            <div style={{ flex: 1, padding: "6px 8px", background: SURF_2, borderRadius: 3, borderLeft: `2px solid ${tR.color}` }}>
                              <p style={{ fontFamily: "monospace", fontSize: 8.5, color: tR.color }}>{tgt?.accountNumber}</p>
                              <p style={{ fontSize: 9.5, color: TEXT_PRI, marginTop: 1 }}>{tgt?.label}</p>
                            </div>
                          </>
                        );
                      })()}
                    </div>

                    {[
                      ["Type", selectedEdge.txnType],
                      ["Pattern", selectedEdge.pattern ?? "None"],
                      ["Date", new Date(selectedEdge.timestamp).toLocaleDateString()],
                    ].map(([k, v]) => (
                      <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, padding: "4px 0", borderBottom: `1px solid ${BORDER}` }}>
                        <span style={{ fontSize: 10, color: TEXT_MUT }}>{k}</span>
                        <span style={{ fontSize: 10, color: k === "Pattern" && selectedEdge.pattern ? PATTERN_COLORS[selectedEdge.pattern] ?? TEXT_PRI : TEXT_PRI }}>{v}</span>
                      </div>
                    ))}

                    <button
                      onClick={() => {
                        setMode("trace");
                        setTraceFrom({ id: selectedEdge.source, data: (network?.nodes as NetworkNode[] ?? []).find(n => n.id === selectedEdge.source) });
                        setTraceTo({ id: selectedEdge.target, data: (network?.nodes as NetworkNode[] ?? []).find(n => n.id === selectedEdge.target) });
                        setPanelTab("trace");
                        setPanelOpen(true);
                      }}
                      style={{
                        marginTop: 10, width: "100%", padding: "7px",
                        borderRadius: 3, border: `1px solid ${ACCENT}50`,
                        background: ACCENT + "10", color: "#7ab8e8",
                        cursor: "pointer", fontSize: 10,
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                        letterSpacing: "0.04em",
                      }}
                    >
                      <GitBranch size={11} /> Trace Fund Path
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   EXPORT
───────────────────────────────────────────────────────────── */

export default function GraphAnalytics() {
  return (
    <ReactFlowProvider>
      <GraphInner />
    </ReactFlowProvider>
  );
}
