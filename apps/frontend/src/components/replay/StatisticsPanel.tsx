import type { ReplayStatistics } from "@/data/replayData";
import { formatINR } from "@/data/replayData";
import { REPLAY_THEME, cardStyle, sectionLabelClass } from "./replayTheme";
import { cn } from "@/lib/utils";

type StatisticsPanelProps = {
  stats: ReplayStatistics;
  compact?: boolean;
};

const METRICS: { key: keyof ReplayStatistics; label: string; short?: string; format?: (v: number) => string }[] = [
  { key: "replayProgress", label: "Replay Progress", short: "Progress", format: v => `${v}%` },
  { key: "transactionsReplayed", label: "Transactions Replayed", short: "Txns" },
  { key: "accountsVisited", label: "Accounts Visited", short: "Accounts" },
  { key: "branchesVisited", label: "Branches Visited", short: "Branches" },
  { key: "channelsUsed", label: "Channels Used", short: "Channels" },
  { key: "totalAmountMoved", label: "Total Amount Moved", short: "Amount", format: formatINR },
  { key: "currentHopCount", label: "Current Hop Count", short: "Hops" },
  { key: "layerDepth", label: "Layer Depth", short: "Layers" },
  { key: "highestRiskScore", label: "Highest Risk Score", short: "Peak Risk", format: v => `${v}` },
];

export function StatisticsPanel({ stats, compact = false }: StatisticsPanelProps) {
  return (
    <div className={cn(compact ? "px-3 py-2" : "p-4 flex-1 min-w-0")} style={cardStyle}>
      {!compact && (
        <p className={`${sectionLabelClass} mb-3`} style={{ color: REPLAY_THEME.textDim }}>
          // Investigation Statistics
        </p>
      )}
      <div
        className={cn(
          compact
            ? "flex items-center gap-4 overflow-x-auto pb-0.5"
            : "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 gap-3",
        )}
      >
        {METRICS.map(({ key, label, short, format }) => {
          const raw = stats[key];
          const value = typeof raw === "number" ? (format ? format(raw) : String(raw)) : String(raw);
          return (
            <div key={key} className={compact ? "shrink-0" : undefined}>
              <p
                className="text-[8px] font-bold uppercase tracking-[0.12em] mb-0.5 whitespace-nowrap"
                style={{ color: REPLAY_THEME.textDim }}
              >
                {compact ? (short ?? label) : label}
              </p>
              <p
                className={cn(
                  "font-black tabular-nums whitespace-nowrap",
                  compact ? "text-[11px]" : "text-[13px] truncate",
                )}
                style={{ color: REPLAY_THEME.text }}
              >
                {value}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
