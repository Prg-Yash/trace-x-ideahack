import { motion, AnimatePresence } from "framer-motion";
import { Bot } from "lucide-react";
import type { RiskEvent } from "@/data/replayData";
import { formatTime } from "@/data/replayData";
import { REPLAY_THEME, cardStyle, sectionLabelClass } from "./replayTheme";

const RISK_COLORS: Record<string, string> = {
  LOW: REPLAY_THEME.low,
  MEDIUM: REPLAY_THEME.medium,
  HIGH: REPLAY_THEME.high,
  CRITICAL: REPLAY_THEME.critical,
};

type CommentaryPanelProps = {
  events: RiskEvent[];
  currentEvent: RiskEvent | null;
};

export function CommentaryPanel({ events, currentEvent }: CommentaryPanelProps) {
  const displayEvents = currentEvent
    ? [currentEvent, ...events.filter(e => e.id !== currentEvent.id)].slice(0, 4)
    : events.slice(-3);

  return (
    <div className="flex flex-col h-full overflow-hidden" style={cardStyle}>
      <div
        className="px-3 py-2 flex items-center gap-2 shrink-0"
        style={{ borderBottom: `1px solid ${REPLAY_THEME.borderMuted}` }}
      >
        <Bot className="h-3.5 w-3.5" style={{ color: REPLAY_THEME.accent }} />
        <p className={sectionLabelClass} style={{ color: REPLAY_THEME.textDim }}>
          // AI Commentary
        </p>
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-1.5 space-y-1.5">
        <AnimatePresence mode="popLayout">
          {displayEvents.length === 0 ? (
            <p className="text-[12px] italic p-3" style={{ color: REPLAY_THEME.textMuted }}>
              Press Play to begin AI-guided investigation replay…
            </p>
          ) : (
            displayEvents.map((event, i) => (
              <motion.div
                key={event.id}
                layout
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                className="p-3"
                style={{
                  border: `1px solid ${i === 0 ? REPLAY_THEME.accent : REPLAY_THEME.borderMuted}`,
                  backgroundColor: i === 0 ? "rgba(163,230,53,0.06)" : REPLAY_THEME.surfaceAlt,
                  boxShadow: i === 0 ? `inset 2px 0 0 ${REPLAY_THEME.accent}` : undefined,
                }}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span
                    className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5"
                    style={{
                      backgroundColor: `${RISK_COLORS[event.riskLevel]}20`,
                      color: RISK_COLORS[event.riskLevel],
                      border: `1px solid ${RISK_COLORS[event.riskLevel]}40`,
                    }}
                  >
                    {event.riskLevel}
                  </span>
                  <span className="font-mono text-[9px] tabular-nums" style={{ color: REPLAY_THEME.textDim }}>
                    {formatTime(event.timestamp)}
                  </span>
                </div>
                <p className="text-[12px] leading-relaxed" style={{ color: REPLAY_THEME.text }}>
                  {event.explanation}
                </p>
                <p className="text-[10px] mt-1.5 font-semibold uppercase tracking-wide" style={{ color: REPLAY_THEME.textMuted }}>
                  {event.pattern}
                </p>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
