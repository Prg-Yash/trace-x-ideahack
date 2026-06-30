import { Camera, Check } from "lucide-react";
import type { EvidenceSnapshotData } from "@/data/replayData";
import { REPLAY_THEME, cardStyle, sectionLabelClass } from "./replayTheme";

type EvidenceSnapshotProps = {
  snapshots: EvidenceSnapshotData[];
  onCapture: () => void;
};

export function EvidenceSnapshotPanel({ snapshots, onCapture }: EvidenceSnapshotProps) {
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={onCapture}
        className="flex items-center justify-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-[0.15em] transition-all hover:brightness-105"
        style={{
          backgroundColor: REPLAY_THEME.accent,
          color: REPLAY_THEME.border,
          border: `1px solid ${REPLAY_THEME.border}`,
          boxShadow: `2px 2px 0px ${REPLAY_THEME.border}`,
        }}
      >
        <Camera className="h-3.5 w-3.5" />
        Capture Snapshot
      </button>

      {snapshots.length > 0 && (
        <div className="max-h-28 overflow-y-auto space-y-1.5 p-2" style={cardStyle}>
          <p className={sectionLabelClass} style={{ color: REPLAY_THEME.textDim }}>
            // Evidence ({snapshots.length})
          </p>
          {snapshots.slice(0, 5).map(snap => (
            <div
              key={snap.id}
              className="flex items-center gap-2 text-[10px] py-1"
              style={{ borderBottom: `1px solid ${REPLAY_THEME.borderMuted}` }}
            >
              <Check className="h-3 w-3 shrink-0" style={{ color: REPLAY_THEME.low }} />
              <span className="font-mono truncate" style={{ color: REPLAY_THEME.textMuted }}>
                {new Date(snap.capturedAt).toLocaleTimeString()} · Risk {snap.riskScore} · Txn {snap.visibleTransactionIds.length}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
