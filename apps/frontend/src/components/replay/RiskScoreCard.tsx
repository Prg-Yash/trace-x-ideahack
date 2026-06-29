import { motion } from "framer-motion";
import { ShieldAlert } from "lucide-react";
import { AnimatedScore } from "./AnimatedValue";
import { REPLAY_THEME, cardStyle, sectionLabelClass } from "./replayTheme";
import { cn } from "@/lib/utils";

type RiskScoreCardProps = {
  score: number;
  reasons: { label: string; delta: number }[];
  compact?: boolean;
};

function getScoreColor(score: number): string {
  if (score >= 80) return REPLAY_THEME.critical;
  if (score >= 60) return REPLAY_THEME.high;
  if (score >= 35) return REPLAY_THEME.medium;
  return REPLAY_THEME.low;
}

export function RiskScoreCard({ score, reasons, compact = false }: RiskScoreCardProps) {
  const color = getScoreColor(score);

  if (compact) {
    return (
      <div
        className="px-3 py-2 flex items-center gap-3 shrink-0 min-w-[200px]"
        style={cardStyle}
      >
        <ShieldAlert className="h-4 w-4 shrink-0" style={{ color }} />
        <div className="min-w-0">
          <p className="text-[8px] font-bold uppercase tracking-[0.12em]" style={{ color: REPLAY_THEME.textDim }}>
            Risk
          </p>
          <AnimatedScore
            value={score}
            className="text-xl font-black tabular-nums leading-none"
            style={{ color }}
          />
        </div>
        <div className="flex-1 min-w-[60px] max-w-[100px]">
          <div className="h-1.5 w-full overflow-hidden" style={{ background: REPLAY_THEME.borderMuted }}>
            <motion.div
              className="h-full"
              animate={{ width: `${score}%`, backgroundColor: color }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
        </div>
        {reasons.length > 0 && (
          <p className="text-[9px] truncate max-w-[120px] hidden lg:block" style={{ color: REPLAY_THEME.textMuted }}>
            +{reasons[reasons.length - 1].delta} {reasons[reasons.length - 1].label}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 flex flex-col gap-3 min-w-[180px]" style={cardStyle}>
      <div className="flex items-center gap-2">
        <ShieldAlert className="h-4 w-4" style={{ color }} />
        <p className={sectionLabelClass} style={{ color: REPLAY_THEME.textDim }}>
          // Live Risk Score
        </p>
      </div>

      <div className="flex items-end gap-2">
        <AnimatedScore
          value={score}
          className="text-4xl font-black tabular-nums leading-none"
          style={{ color }}
        />
        <span className="text-[11px] font-bold mb-1" style={{ color: REPLAY_THEME.textDim }}>
          / 100
        </span>
      </div>

      <div className="h-1.5 w-full overflow-hidden" style={{ background: REPLAY_THEME.borderMuted }}>
        <motion.div
          className="h-full"
          animate={{ width: `${score}%`, backgroundColor: color }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>

      {reasons.length > 0 && (
        <div className="space-y-1 max-h-24 overflow-y-auto">
          {reasons.map((r, i) => (
            <motion.div
              key={`${r.label}-${i}`}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center justify-between text-[10px]"
            >
              <span style={{ color: REPLAY_THEME.textMuted }}>+{r.delta} {r.label}</span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
