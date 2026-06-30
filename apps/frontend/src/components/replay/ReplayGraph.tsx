import { memo, useEffect, useMemo, useCallback } from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Handle,
  Position,
  ReactFlowProvider,
  useReactFlow,
  getBezierPath,
  type Node,
  type Edge,
  type NodeProps,
  type EdgeProps,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import dagre from "@dagrejs/dagre";
import { motion, AnimatePresence } from "framer-motion";
import {
  getAccountById,
  getHeatmapColor,
  formatINR,
  computeAccountSnapshot,
  type ReplayDataset,
} from "@/data/replayData";
import { REPLAY_THEME } from "./replayTheme";

const NODE_W = 168;
const NODE_H = 72;

const REPLAY_CSS = `
@keyframes replay-pulse {
  0%, 100% { box-shadow: 0 0 0 0 var(--pulse-color); }
  50% { box-shadow: 0 0 0 10px transparent; }
}
@keyframes replay-flow {
  from { stroke-dashoffset: 0; }
  to { stroke-dashoffset: -36; }
}
@keyframes replay-dot {
  0% { offset-distance: 0%; opacity: 0; }
  8% { opacity: 1; }
  92% { opacity: 1; }
  100% { offset-distance: 100%; opacity: 0; }
}
@keyframes replay-glow-pulse {
  0%, 100% { stroke-opacity: 0.08; stroke-width: 14; }
  50% { stroke-opacity: 0.22; stroke-width: 20; }
}
@keyframes replay-label-in {
  0% { opacity: 0; transform: translateY(4px) scale(0.92); }
  100% { opacity: 1; transform: translateY(0px) scale(1); }
}
`;

type ReplayNodeData = {
  label: string;
  customerName: string;
  accountNumber: string;
  balance: number;
  state: "origin" | "active" | "suspicious" | "visited" | "hidden";
  heatmapColor: string;
  heatmapMode: boolean;
  riskScore: number;
  isNew: boolean;
};

type ReplayEdgeData = {
  amount: number;
  isActive: boolean;
  isCompleted: boolean;
  isPreview: boolean;
  pattern: string | null;
};

function ReplayNode({ data }: NodeProps<ReplayNodeData>) {
  const stateStyles: Record<ReplayNodeData["state"], React.CSSProperties> = {
    origin: {
      borderLeft: `3px solid ${REPLAY_THEME.accent}`,
      boxShadow: `0 0 16px ${REPLAY_THEME.accent}30`,
    },
    active: {
      borderLeft: `3px solid ${REPLAY_THEME.cyan}`,
      boxShadow: `0 0 20px ${REPLAY_THEME.cyan}40`,
      animation: "replay-pulse 1.8s ease-in-out infinite",
      ["--pulse-color" as string]: `${REPLAY_THEME.cyan}50`,
    },
    suspicious: {
      borderLeft: `3px solid ${REPLAY_THEME.critical}`,
      boxShadow: `0 0 18px ${REPLAY_THEME.critical}35`,
      animation: "replay-pulse 1.4s ease-in-out infinite",
      ["--pulse-color" as string]: `${REPLAY_THEME.critical}50`,
    },
    visited: {
      borderLeft: `3px solid ${REPLAY_THEME.borderMuted}`,
    },
    hidden: { opacity: 0 },
  };

  const bgColor = data.heatmapMode ? `${data.heatmapColor}18` : REPLAY_THEME.surface;

  return (
    <motion.div
      initial={data.isNew ? { opacity: 0, scale: 0.85 } : false}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      style={{ width: NODE_W }}
    >
      <Handle type="target" position={Position.Left} style={{ opacity: 0, width: 1, height: 1 }} />
      <div
        style={{
          background: bgColor,
          border: `1px solid ${REPLAY_THEME.border}`,
          width: "100%",
          ...stateStyles[data.state],
        }}
      >
        <div className="px-2.5 py-1.5" style={{ borderBottom: `1px solid ${REPLAY_THEME.borderMuted}` }}>
          <div className="flex items-center justify-between gap-1">
            <span
              className="font-mono text-[9px] truncate"
              style={{ color: REPLAY_THEME.textMuted }}
            >
              {data.accountNumber}
            </span>
            <span
              className="text-[8px] font-black px-1"
              style={{
                background: data.heatmapMode ? data.heatmapColor : REPLAY_THEME.accent,
                color: data.heatmapMode ? "#fff" : REPLAY_THEME.border,
              }}
            >
              {data.label}
            </span>
          </div>
        </div>
        <div className="px-2.5 py-2">
          <p
            className="text-[10px] font-semibold truncate leading-tight"
            style={{ color: REPLAY_THEME.text }}
          >
            {data.customerName}
          </p>
          <p className="font-mono text-[9px] mt-0.5 tabular-nums" style={{ color: REPLAY_THEME.textDim }}>
            {formatINR(data.balance)}
          </p>
        </div>
      </div>
      <Handle type="source" position={Position.Right} style={{ opacity: 0, width: 1, height: 1 }} />
    </motion.div>
  );
}

function ReplayEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data }: EdgeProps<ReplayEdgeData>) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition, curvature: 0.28,
  });

  const stroke = data?.isActive
    ? REPLAY_THEME.cyan
    : data?.isPreview
      ? REPLAY_THEME.borderMuted
      : data?.isCompleted
        ? `${REPLAY_THEME.border}99`
        : REPLAY_THEME.borderMuted;

  const amountLabel = data?.amount != null
    ? `₹${Number(data.amount).toLocaleString("en-IN")}`
    : null;

  // Estimate text width for the background rect (monospace ~7px per char at 11px)
  const labelW = amountLabel ? amountLabel.length * 7.2 + 16 : 0;
  const labelH = 20;

  return (
    <>
      {/* Outer glow pulse on active edge */}
      {data?.isActive && (
        <path
          d={edgePath}
          fill="none"
          stroke={REPLAY_THEME.cyan}
          strokeWidth={14}
          strokeOpacity={0.10}
          style={{
            pointerEvents: "none",
            animation: "replay-glow-pulse 1.6s ease-in-out infinite",
          }}
        />
      )}
      {/* Inner glow halo */}
      {data?.isActive && (
        <path
          d={edgePath}
          fill="none"
          stroke={REPLAY_THEME.cyan}
          strokeWidth={5}
          strokeOpacity={0.25}
          style={{ pointerEvents: "none" }}
        />
      )}
      {/* Main edge line */}
      <path
        id={`edge-${id}`}
        d={edgePath}
        fill="none"
        stroke={stroke}
        strokeWidth={data?.isActive ? 2.5 : data?.isPreview ? 1 : 1.5}
        strokeOpacity={data?.isPreview ? 0.3 : 1}
        strokeDasharray={data?.isActive ? "10 5" : data?.isPreview ? "4 7" : undefined}
        style={{
          animation: data?.isActive ? "replay-flow 0.7s linear infinite" : undefined,
          transition: "stroke 0.4s ease, stroke-opacity 0.4s ease",
        }}
        markerEnd={`url(#arrow-${data?.isActive ? "active" : "done"})`}
      />
      {/* Traveling orb */}
      {data?.isActive && (
        <>
          {/* Orb glow halo */}
          <circle
            r={7}
            fill="none"
            stroke={REPLAY_THEME.cyan}
            strokeWidth={2}
            strokeOpacity={0.35}
            style={{
              offsetPath: `path('${edgePath}')`,
              animation: "replay-dot 1.1s ease-in-out infinite",
              pointerEvents: "none",
            }}
          />
          {/* Orb core */}
          <circle
            r={4.5}
            fill={REPLAY_THEME.cyan}
            style={{
              offsetPath: `path('${edgePath}')`,
              animation: "replay-dot 1.1s ease-in-out infinite",
              filter: `drop-shadow(0 0 6px ${REPLAY_THEME.cyan})`,
              pointerEvents: "none",
            }}
          />
        </>
      )}
      {/* Amount label on active edge — native SVG for precise positioning */}
      {data?.isActive && amountLabel && (
        <g style={{ pointerEvents: "none" }}>
          <rect
            x={labelX - labelW / 2}
            y={labelY - labelH / 2 - 12}
            width={labelW}
            height={labelH}
            rx={2}
            fill={REPLAY_THEME.border}
            stroke={REPLAY_THEME.cyan}
            strokeWidth={1}
          />
          <text
            x={labelX}
            y={labelY - 12}
            textAnchor="middle"
            dominantBaseline="central"
            fill={REPLAY_THEME.accent}
            fontFamily="monospace"
            fontSize={11}
            fontWeight={800}
            letterSpacing="0.08em"
          >
            {amountLabel}
          </text>
        </g>
      )}
      {/* Completed edge amount label — smaller, muted, native SVG */}
      {data?.isCompleted && amountLabel && (
        <g style={{ pointerEvents: "none" }}>
          <rect
            x={labelX - labelW / 2 + 4}
            y={labelY - (labelH - 2) / 2 - 10}
            width={labelW - 8}
            height={labelH - 2}
            rx={1}
            fill="rgba(245,245,240,0.92)"
            stroke={REPLAY_THEME.borderMuted}
            strokeWidth={0.5}
          />
          <text
            x={labelX}
            y={labelY - 10}
            textAnchor="middle"
            dominantBaseline="central"
            fill={REPLAY_THEME.textMuted}
            fontFamily="monospace"
            fontSize={9}
            fontWeight={700}
          >
            {amountLabel}
          </text>
        </g>
      )}
    </>
  );
}

const nodeTypes = { replayNode: ReplayNode };
const edgeTypes = { replayEdge: ReplayEdge };

function applyLayout(nodes: Node[], edges: Edge[]): Node[] {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "LR", ranksep: 120, nodesep: 48, marginx: 40, marginy: 40 });
  nodes.forEach(n => g.setNode(n.id, { width: NODE_W, height: NODE_H }));
  edges.forEach(e => { try { g.setEdge(e.source, e.target); } catch { /* skip */ } });
  dagre.layout(g);
  return nodes.map(n => {
    const nd = g.node(n.id);
    if (!nd) return n;
    return { ...n, position: { x: nd.x - NODE_W / 2, y: nd.y - NODE_H / 2 } };
  });
}

type ReplayGraphProps = {
  dataset: ReplayDataset;
  currentIndex: number;
  heatmapMode: boolean;
  selectedNodeId: string | null;
  activePatterns: string[];
  onNodeClick: (nodeId: string) => void;
};

function ReplayGraphInner({
  dataset,
  currentIndex,
  heatmapMode,
  selectedNodeId,
  activePatterns,
  onNodeClick,
}: ReplayGraphProps) {
  const { transactions, originAccountId } = dataset;
  const { fitView, setCenter } = useReactFlow();

  const { nodes, edges, activeNodeId } = useMemo(() => {
    const isPreview = currentIndex < 0;
    const visibleTxns = currentIndex >= 0 ? transactions.slice(0, currentIndex + 1) : [];
    const nodeIds = new Set<string>();

    transactions.forEach(t => {
      nodeIds.add(t.from);
      nodeIds.add(t.to);
    });

    const activeTxn = currentIndex >= 0 ? transactions[currentIndex] : null;
    const activeNode = activeTxn?.to ?? originAccountId;

    const suspiciousPatterns = new Set(["Round Tripping", "Round-Tripping", "Dormant Account Activation", "Layering"]);
    const suspiciousNodes = new Set<string>();
    (isPreview ? transactions : visibleTxns).forEach(t => {
      if (t.patternDetected && suspiciousPatterns.has(t.patternDetected)) {
        suspiciousNodes.add(t.from);
        suspiciousNodes.add(t.to);
      }
    });

    const appearedAt = new Map<string, number>();
    if (isPreview) {
      nodeIds.forEach(id => appearedAt.set(id, -1));
    } else {
      nodeIds.forEach(id => {
        if (currentIndex < 0 && id === originAccountId) appearedAt.set(id, -1);
      });
      visibleTxns.forEach((t, i) => {
        if (!appearedAt.has(t.from)) appearedAt.set(t.from, i);
        if (!appearedAt.has(t.to)) appearedAt.set(t.to, i);
      });
    }

    const rawNodes: Node[] = Array.from(nodeIds).map(id => {
      const acct = getAccountById(dataset, id);
      const snap = computeAccountSnapshot(dataset, id, currentIndex);
      const isActive = !isPreview && id === activeNode;
      const isOrigin = id === originAccountId && (isPreview || currentIndex <= 0);
      const isSuspicious = suspiciousNodes.has(id);
      const isSelected = id === selectedNodeId;
      const firstSeen = appearedAt.get(id) ?? -1;
      const isNew = firstSeen === currentIndex;

      let state: ReplayNodeData["state"] = isPreview ? "visited" : "visited";
      if (isOrigin && (isPreview || currentIndex <= 0)) state = "origin";
      else if (isActive) state = "active";
      else if (isSuspicious) state = "suspicious";

      const riskScore = snap?.riskScore ?? acct?.baseRiskScore ?? 0;

      return {
        id,
        type: "replayNode",
        position: { x: 0, y: 0 },
        data: {
          label: acct?.label ?? id,
          customerName: acct?.customerName ?? id,
          accountNumber: acct?.accountNumber ?? id,
          balance: snap?.balance ?? acct?.initialBalance ?? 0,
          state: isSelected && !isActive ? "active" : state,
          heatmapColor: getHeatmapColor(riskScore),
          heatmapMode,
          riskScore,
          isNew,
        } satisfies ReplayNodeData,
      };
    });

    const edgeSource = isPreview ? transactions : visibleTxns;
    const rawEdges: Edge[] = edgeSource.map((t, i) => ({
      id: t.id,
      source: t.from,
      target: t.to,
      type: "replayEdge",
      data: {
        amount: t.amount,
        isActive: !isPreview && i === currentIndex,
        isCompleted: !isPreview && i < currentIndex,
        isPreview,
        pattern: t.patternDetected,
      } satisfies ReplayEdgeData,
      markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14 },
    }));

    const laid = applyLayout(rawNodes, rawEdges);
    return { nodes: laid, edges: rawEdges, activeNodeId: activeNode };
  }, [dataset, currentIndex, heatmapMode, selectedNodeId, transactions, originAccountId]);

  useEffect(() => {
    if (nodes.length === 0) return;
    if (currentIndex < 0) {
      fitView({ padding: 0.25, duration: 400 });
      return;
    }
    if (!activeNodeId) return;
    const node = nodes.find(n => n.id === activeNodeId);
    if (node) {
      setCenter(node.position.x + NODE_W / 2, node.position.y + NODE_H / 2, { zoom: 1.1, duration: 500 });
    } else {
      fitView({ padding: 0.2, duration: 400 });
    }
  }, [activeNodeId, nodes, setCenter, fitView, currentIndex]);

  const onNodeClickHandler = useCallback(
    (_: React.MouseEvent, node: Node) => onNodeClick(node.id),
    [onNodeClick],
  );

  return (
    <div className="relative w-full h-full" style={{ background: REPLAY_THEME.surfaceAlt }}>
      <svg style={{ position: "absolute", width: 0, height: 0 }}>
        <defs>
          <marker id="arrow-active" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6" fill={REPLAY_THEME.cyan} />
          </marker>
          <marker id="arrow-done" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6" fill={REPLAY_THEME.border} />
          </marker>
        </defs>
      </svg>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={onNodeClickHandler}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        panOnScroll
        zoomOnScroll
        minZoom={0.3}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Lines} gap={24} color="rgba(19,5,55,0.06)" />
      </ReactFlow>

      <AnimatePresence>
        {activePatterns.slice(-2).map((pattern, i) => (
          <motion.div
            key={`${pattern}-${currentIndex}-${i}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute top-3 left-3 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider"
            style={{
              background: "rgba(239,68,68,0.12)",
              border: `1px solid ${REPLAY_THEME.critical}`,
              color: REPLAY_THEME.critical,
              top: 12 + i * 36,
            }}
          >
            ⚠ {pattern} Detected
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function InjectReplayCSS() {
  useEffect(() => {
    const el = document.createElement("style");
    el.setAttribute("data-replay", "1");
    el.textContent = REPLAY_CSS;
    if (!document.querySelector("[data-replay]")) document.head.appendChild(el);
    return () => el.remove();
  }, []);
  return null;
}

export const ReplayGraph = memo(function ReplayGraph(props: ReplayGraphProps) {
  return (
    <>
      <InjectReplayCSS />
      <ReactFlowProvider>
        <ReplayGraphInner {...props} />
      </ReactFlowProvider>
    </>
  );
});
