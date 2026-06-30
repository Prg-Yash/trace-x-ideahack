import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  RefreshCw,
  AlertTriangle,
  Sparkles,
  ShieldAlert,
  BarChart2,
  Target,
  Lightbulb,
  Clock,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { REPLAY_THEME, cardStyle, sectionLabelClass } from "./replayTheme";

/* ── Colour helpers ── */
const RISK_COLORS = {
  LOW: REPLAY_THEME.low,
  MEDIUM: REPLAY_THEME.medium,
  HIGH: REPLAY_THEME.high,
  CRITICAL: REPLAY_THEME.critical,
};

const RISK_DOT = {
  LOW: "●",
  MEDIUM: "◆",
  HIGH: "▲",
  CRITICAL: "■",
};

function riskColor(level) {
  return RISK_COLORS[level?.toUpperCase()] ?? REPLAY_THEME.high;
}

/* ── Sub-components ── */

function SectionHeader({ icon: Icon, label }) {
  return (
    <div
      className="flex items-center gap-1.5 px-3 py-1.5 shrink-0"
      style={{ borderBottom: `1px solid ${REPLAY_THEME.borderMuted}` }}
    >
      <Icon className="h-3 w-3" style={{ color: REPLAY_THEME.accent }} />
      <p className={sectionLabelClass} style={{ color: REPLAY_THEME.textDim }}>
        {label}
      </p>
    </div>
  );
}

function SkeletonLine({ w = "100%", h = 8, mt = 0 }) {
  return (
    <div
      className="animate-pulse rounded-none"
      style={{
        width: w,
        height: h,
        marginTop: mt,
        backgroundColor: `${REPLAY_THEME.borderMuted}`,
        opacity: 0.45,
      }}
    />
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col h-full overflow-hidden" style={cardStyle}>
      <SectionHeader icon={Bot} label="// AI Investigation Commentary" />
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        <div
          className="flex items-center gap-2 p-3"
          style={{
            border: `1px solid ${REPLAY_THEME.borderMuted}`,
            backgroundColor: REPLAY_THEME.surfaceAlt,
          }}
        >
          <Loader2
            className="h-4 w-4 animate-spin shrink-0"
            style={{ color: REPLAY_THEME.accent }}
          />
          <p
            className="text-[11px] font-bold uppercase tracking-[0.18em]"
            style={{ color: REPLAY_THEME.textMuted }}
          >
            Generating AI Investigation Commentary…
          </p>
        </div>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-3 space-y-1.5"
            style={{
              border: `1px solid ${REPLAY_THEME.borderMuted}`,
              backgroundColor: REPLAY_THEME.surfaceAlt,
            }}
          >
            <SkeletonLine w="55%" h={7} />
            <SkeletonLine w="100%" h={7} mt={4} />
            <SkeletonLine w="80%" h={7} mt={2} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ErrorState({ error, onRetry }) {
  return (
    <div className="flex flex-col h-full overflow-hidden" style={cardStyle}>
      <SectionHeader icon={Bot} label="// AI Investigation Commentary" />
      <div className="flex-1 flex items-center justify-center px-3 py-4">
        <div
          className="p-4 text-center w-full"
          style={{
            border: `1px solid ${REPLAY_THEME.critical}40`,
            backgroundColor: `${REPLAY_THEME.critical}08`,
          }}
        >
          <AlertCircle
            className="h-6 w-6 mx-auto mb-2"
            style={{ color: REPLAY_THEME.critical }}
          />
          <p
            className="text-[11px] font-bold uppercase tracking-wider mb-1"
            style={{ color: REPLAY_THEME.critical }}
          >
            Unable to generate AI commentary
          </p>
          <p
            className="text-[10px] mb-3"
            style={{ color: REPLAY_THEME.textMuted }}
          >
            {error || "An unexpected error occurred. Please try again."}
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="flex items-center gap-1.5 mx-auto px-3 py-1.5 text-[9px] font-black uppercase tracking-wider transition-all hover:opacity-80"
            style={{
              backgroundColor: REPLAY_THEME.accent,
              color: REPLAY_THEME.border,
              border: `1px solid ${REPLAY_THEME.border}`,
            }}
          >
            <RefreshCw className="h-3 w-3" />
            Retry
          </button>
        </div>
      </div>
    </div>
  );
}

function RiskBadge({ level }) {
  const color = riskColor(level);
  return (
    <span
      className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5"
      style={{
        color,
        border: `1px solid ${color}50`,
        backgroundColor: `${color}12`,
      }}
    >
      {RISK_DOT[level?.toUpperCase()] ?? "●"} {level}
    </span>
  );
}

function PatternBadge({ pattern }) {
  return (
    <span
      className="text-[9px] font-bold uppercase tracking-wide px-2 py-0.5"
      style={{
        color: REPLAY_THEME.cyan,
        border: `1px solid ${REPLAY_THEME.cyan}40`,
        backgroundColor: `${REPLAY_THEME.cyan}0d`,
      }}
    >
      {pattern}
    </span>
  );
}

function CommentaryCard({ item, index }) {
  const isFirst = index === 0;
  const timeLabel = (() => {
    try {
      const d = new Date(item.timestamp);
      if (!isNaN(d.getTime()))
        return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {}
    return item.timestamp;
  })();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="p-2.5"
      style={{
        border: `1px solid ${isFirst ? REPLAY_THEME.accent + "80" : REPLAY_THEME.borderMuted}`,
        backgroundColor: isFirst
          ? "rgba(163,230,53,0.05)"
          : REPLAY_THEME.surfaceAlt,
        borderLeft: `3px solid ${isFirst ? REPLAY_THEME.accent : REPLAY_THEME.borderMuted}`,
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <p
          className="text-[11px] font-black uppercase tracking-wide leading-tight"
          style={{ color: REPLAY_THEME.text }}
        >
          {item.title}
        </p>
        <div
          className="flex items-center gap-1 shrink-0 text-[9px] font-mono"
          style={{ color: REPLAY_THEME.textDim }}
        >
          <Clock className="h-2.5 w-2.5" />
          {timeLabel}
        </div>
      </div>
      <p
        className="text-[11px] leading-relaxed"
        style={{ color: REPLAY_THEME.textMuted }}
      >
        {item.description}
      </p>
    </motion.div>
  );
}

/* ── Main Panel ── */

/**
 * @param {{
 *   commentary: import('../services/openRouterService').AICommentary | null;
 *   loading: boolean;
 *   error: string | null;
 *   onRegenerate: () => void;
 * }} props
 */
export function AICommentaryPanel({ commentary, loading, error, onRegenerate }) {
  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={onRegenerate} />;
  if (!commentary) return null;

  const color = riskColor(commentary.riskLevel);

  return (
    <div className="flex flex-col h-full overflow-hidden" style={cardStyle}>
      {/* Header */}
      <div
        className="px-3 py-2 flex items-center justify-between gap-2 shrink-0"
        style={{ borderBottom: `2px solid ${REPLAY_THEME.border}` }}
      >
        <div className="flex items-center gap-1.5">
          <Bot className="h-3.5 w-3.5" style={{ color: REPLAY_THEME.accent }} />
          <p className={sectionLabelClass} style={{ color: REPLAY_THEME.textDim }}>
            // AI Investigation Commentary
          </p>
        </div>
        <button
          type="button"
          onClick={onRegenerate}
          title="Regenerate AI Commentary"
          className="flex items-center gap-1 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider transition-all hover:opacity-80"
          style={{
            border: `1px solid ${REPLAY_THEME.borderMuted}`,
            color: REPLAY_THEME.textDim,
            backgroundColor: REPLAY_THEME.surfaceAlt,
          }}
        >
          <RefreshCw className="h-2.5 w-2.5" />
          Regenerate
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-0">
        {/* ── Summary ── */}
        <div
          className="px-3 py-2.5"
          style={{ borderBottom: `1px solid ${REPLAY_THEME.borderMuted}` }}
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <Sparkles className="h-3 w-3" style={{ color: REPLAY_THEME.accent }} />
            <p className={`${sectionLabelClass} text-[8px]`} style={{ color: REPLAY_THEME.textDim }}>
              Investigation Summary
            </p>
          </div>
          <p
            className="text-[11px] leading-relaxed"
            style={{ color: REPLAY_THEME.text }}
          >
            {commentary.summary}
          </p>
        </div>

        {/* ── Risk ── */}
        <div
          className="px-3 py-2 flex items-center gap-4"
          style={{ borderBottom: `1px solid ${REPLAY_THEME.borderMuted}` }}
        >
          <div>
            <p className="text-[8px] font-bold uppercase tracking-wider mb-1" style={{ color: REPLAY_THEME.textDim }}>
              Risk Level
            </p>
            <RiskBadge level={commentary.riskLevel} />
          </div>
          <div>
            <p className="text-[8px] font-bold uppercase tracking-wider mb-1" style={{ color: REPLAY_THEME.textDim }}>
              Risk Score
            </p>
            <div className="flex items-center gap-2">
              <span
                className="text-[18px] font-black font-mono tabular-nums leading-none"
                style={{ color }}
              >
                {commentary.overallRiskScore}
              </span>
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] font-bold" style={{ color: REPLAY_THEME.textDim }}>
                  / 100
                </span>
                <div
                  className="w-20 h-1.5 overflow-hidden"
                  style={{ border: `1px solid ${REPLAY_THEME.borderMuted}`, backgroundColor: REPLAY_THEME.surfaceAlt }}
                >
                  <motion.div
                    className="h-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${commentary.overallRiskScore}%` }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                    style={{ backgroundColor: color }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Patterns ── */}
        {commentary.patternsDetected?.length > 0 && (
          <div
            className="px-3 py-2"
            style={{ borderBottom: `1px solid ${REPLAY_THEME.borderMuted}` }}
          >
            <div className="flex items-center gap-1.5 mb-1.5">
              <Target className="h-3 w-3" style={{ color: REPLAY_THEME.accent }} />
              <p className={`${sectionLabelClass} text-[8px]`} style={{ color: REPLAY_THEME.textDim }}>
                Detected AML Patterns
              </p>
            </div>
            <div className="flex flex-wrap gap-1">
              {commentary.patternsDetected.map((p) => (
                <PatternBadge key={p} pattern={p} />
              ))}
            </div>
          </div>
        )}

        {/* ── Timeline Commentary ── */}
        {commentary.commentary?.length > 0 && (
          <div
            className="px-3 py-2"
            style={{ borderBottom: `1px solid ${REPLAY_THEME.borderMuted}` }}
          >
            <div className="flex items-center gap-1.5 mb-2">
              <ShieldAlert className="h-3 w-3" style={{ color: REPLAY_THEME.accent }} />
              <p className={`${sectionLabelClass} text-[8px]`} style={{ color: REPLAY_THEME.textDim }}>
                Timeline Commentary
              </p>
            </div>
            <AnimatePresence>
              <div className="space-y-1.5">
                {commentary.commentary.map((item, i) => (
                  <CommentaryCard key={i} item={item} index={i} />
                ))}
              </div>
            </AnimatePresence>
          </div>
        )}

        {/* ── Recommendation ── */}
        {commentary.recommendation && (
          <div className="px-3 py-2.5">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Lightbulb className="h-3 w-3" style={{ color: REPLAY_THEME.accent }} />
              <p className={`${sectionLabelClass} text-[8px]`} style={{ color: REPLAY_THEME.textDim }}>
                Recommendation
              </p>
            </div>
            <div
              className="p-2.5"
              style={{
                border: `1px solid ${REPLAY_THEME.accent}40`,
                backgroundColor: "rgba(163,230,53,0.06)",
                borderLeft: `3px solid ${REPLAY_THEME.accent}`,
              }}
            >
              <p className="text-[11px] leading-relaxed" style={{ color: REPLAY_THEME.text }}>
                {commentary.recommendation}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
