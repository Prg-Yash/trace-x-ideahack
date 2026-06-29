import { Flame, Layers } from "lucide-react";
import { REPLAY_THEME } from "./replayTheme";

type HeatmapToggleProps = {
  enabled: boolean;
  onToggle: () => void;
};

export function HeatmapToggle({ enabled, onToggle }: HeatmapToggleProps) {
  return (
    <div
      className="flex items-center overflow-hidden"
      style={{ border: `1px solid ${REPLAY_THEME.borderMuted}` }}
    >
      <button
        type="button"
        onClick={() => enabled && onToggle()}
        className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors"
        style={{
          backgroundColor: !enabled ? "rgba(163,230,53,0.12)" : "transparent",
          color: !enabled ? REPLAY_THEME.border : REPLAY_THEME.textMuted,
          borderRight: `1px solid ${REPLAY_THEME.borderMuted}`,
        }}
      >
        <Layers className="h-3 w-3" />
        Normal View
      </button>
      <button
        type="button"
        onClick={() => !enabled && onToggle()}
        className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors"
        style={{
          backgroundColor: enabled ? "rgba(163,230,53,0.12)" : "transparent",
          color: enabled ? REPLAY_THEME.border : REPLAY_THEME.textMuted,
        }}
      >
        <Flame className="h-3 w-3" />
        Heatmap View
      </button>
    </div>
  );
}
