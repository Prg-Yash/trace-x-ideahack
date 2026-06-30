import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";
import { replayTimeline, formatINR, formatTime, type ReplayTimelineEntry } from "@/data/replayData";
import { REPLAY_THEME, cardStyle, sectionLabelClass } from "./replayTheme";

type TimelinePanelProps = {
  timeline: ReplayTimelineEntry[];
  currentIndex: number;
  onSeek: (index: number) => void;
};

export function TimelinePanel({ timeline, currentIndex, onSeek }: TimelinePanelProps) {
  return (
    <div className="flex flex-col h-full overflow-hidden" style={cardStyle}>
      <div className="px-3 py-2 shrink-0" style={{ borderBottom: `1px solid ${REPLAY_THEME.borderMuted}` }}>
        <p className={sectionLabelClass} style={{ color: REPLAY_THEME.textDim }}>
          // Transaction Timeline
        </p>
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-1.5 space-y-1.5">
        {timeline.map((entry, index) => {
          const isActive = index === currentIndex;
          const isPast = index < currentIndex;
          const isFuture = index > currentIndex;

          return (
            <motion.button
              key={entry.id}
              type="button"
              onClick={() => onSeek(index)}
              initial={false}
              animate={{
                opacity: isFuture ? 0.35 : 1,
                scale: isActive ? 1 : 0.98,
              }}
              className="w-full text-left p-2.5 transition-colors"
              style={{
                border: `1px solid ${isActive ? REPLAY_THEME.accent : REPLAY_THEME.borderMuted}`,
                backgroundColor: isActive
                  ? "rgba(163,230,53,0.08)"
                  : isPast
                    ? REPLAY_THEME.surfaceAlt
                    : REPLAY_THEME.surface,
                boxShadow: isActive ? `inset 3px 0 0 ${REPLAY_THEME.accent}` : undefined,
              }}
            >
              <p
                className="font-mono text-[10px] tabular-nums mb-2"
                style={{ color: isActive ? REPLAY_THEME.accent : REPLAY_THEME.textDim }}
              >
                {formatTime(entry.timestamp)}
              </p>
              <p className="text-[11px] font-semibold truncate" style={{ color: REPLAY_THEME.text }}>
                {entry.fromLabel}
              </p>
              <div className="flex items-center gap-1 my-1">
                <ArrowDown className="h-3 w-3" style={{ color: REPLAY_THEME.textDim }} />
              </div>
              <p className="text-[11px] font-semibold truncate" style={{ color: REPLAY_THEME.text }}>
                {entry.toLabel}
              </p>
              <p className="font-mono text-[12px] font-black mt-2 tabular-nums" style={{ color: REPLAY_THEME.text }}>
                {formatINR(entry.amount)}
              </p>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
