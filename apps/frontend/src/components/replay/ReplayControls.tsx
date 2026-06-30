import {
  Play, Pause, Square, SkipBack, SkipForward,
  ChevronLeft, ChevronRight, RotateCcw,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { REPLAY_THEME, cardStyle } from "./replayTheme";
import type { PlaybackSpeed } from "@/data/replayData";
import { cn } from "@/lib/utils";

type ReplayControlsProps = {
  isPlaying: boolean;
  currentIndex: number;
  totalTransactions: number;
  speed: PlaybackSpeed;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onRewind: () => void;
  onForward: () => void;
  onRestart: () => void;
  onSpeedChange: (speed: PlaybackSpeed) => void;
  onSeek: (index: number) => void;
  compact?: boolean;
};

const SPEEDS: PlaybackSpeed[] = [0.5, 1, 2, 4];

function ControlBtn({
  onClick,
  title,
  children,
  active,
  size = "md",
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  active?: boolean;
  size?: "md" | "sm";
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        "flex items-center justify-center transition-colors shrink-0",
        size === "sm" ? "h-7 w-7" : "h-8 w-8",
      )}
      style={{
        border: `1px solid ${active ? REPLAY_THEME.accent : REPLAY_THEME.borderMuted}`,
        backgroundColor: active ? "rgba(163,230,53,0.12)" : "transparent",
        color: active ? REPLAY_THEME.border : REPLAY_THEME.textMuted,
      }}
    >
      {children}
    </button>
  );
}

export function ReplayControls({
  isPlaying,
  currentIndex,
  totalTransactions,
  speed,
  onPlay,
  onPause,
  onStop,
  onPrevious,
  onNext,
  onRewind,
  onForward,
  onRestart,
  onSpeedChange,
  onSeek,
  compact = false,
}: ReplayControlsProps) {
  const sliderValue = currentIndex + 1;

  return (
    <div
      className={cn(compact ? "p-2.5" : "p-4 flex flex-col gap-3")}
      style={cardStyle}
    >
      <div
        className={cn(
          compact
            ? "flex flex-col xl:flex-row xl:items-center gap-2.5"
            : "flex flex-col gap-3",
        )}
      >
        <div className="flex items-center gap-1 flex-wrap shrink-0">
          <ControlBtn onClick={onRewind} title="Rewind" size={compact ? "sm" : "md"}>
            <ChevronLeft className="h-3 w-3" />
            <ChevronLeft className="h-3 w-3 -ml-2" />
          </ControlBtn>
          <ControlBtn onClick={onPrevious} title="Previous" size={compact ? "sm" : "md"}>
            <SkipBack className="h-3 w-3" />
          </ControlBtn>
          <ControlBtn
            onClick={isPlaying ? onPause : onPlay}
            title={isPlaying ? "Pause" : "Play"}
            active={isPlaying}
            size={compact ? "sm" : "md"}
          >
            {isPlaying ? (
              <Pause className="h-3.5 w-3.5" />
            ) : (
              <Play className="h-3.5 w-3.5 ml-0.5" />
            )}
          </ControlBtn>
          <ControlBtn onClick={onStop} title="Stop" size={compact ? "sm" : "md"}>
            <Square className="h-2.5 w-2.5" />
          </ControlBtn>
          <ControlBtn onClick={onNext} title="Next" size={compact ? "sm" : "md"}>
            <SkipForward className="h-3 w-3" />
          </ControlBtn>
          <ControlBtn onClick={onForward} title="Forward" size={compact ? "sm" : "md"}>
            <ChevronRight className="h-3 w-3" />
            <ChevronRight className="h-3 w-3 -ml-2" />
          </ControlBtn>
          <ControlBtn onClick={onRestart} title="Restart" size={compact ? "sm" : "md"}>
            <RotateCcw className="h-3 w-3" />
          </ControlBtn>

          <div className="flex items-center gap-0.5 ml-1">
            {SPEEDS.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => onSpeedChange(s)}
                className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider transition-colors"
                style={{
                  border: `1px solid ${speed === s ? REPLAY_THEME.accent : REPLAY_THEME.borderMuted}`,
                  backgroundColor: speed === s ? "rgba(163,230,53,0.15)" : "transparent",
                  color: speed === s ? REPLAY_THEME.border : REPLAY_THEME.textMuted,
                }}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span
            className="text-[9px] font-mono tabular-nums shrink-0 w-10"
            style={{ color: REPLAY_THEME.textDim }}
          >
            {Math.max(0, sliderValue)}/{totalTransactions}
          </span>
          <Slider
            value={[sliderValue]}
            min={0}
            max={totalTransactions}
            step={1}
            onValueChange={(values: number[]) => onSeek(values[0] - 1)}
            className="flex-1 min-w-[80px]"
          />
        </div>
      </div>
    </div>
  );
}
