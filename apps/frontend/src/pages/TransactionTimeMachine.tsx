import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Link, useRoute } from "wouter";
import { ArrowLeft, Camera, Loader2, Radio, Video, Square } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useReplayEngine } from "@/hooks/useReplayEngine";
import { useLiveReplayDataset } from "@/hooks/useLiveReplayDataset";
import { ReplayGraph } from "@/components/replay/ReplayGraph";
import { ReplayControls } from "@/components/replay/ReplayControls";
import { TimelinePanel } from "@/components/replay/TimelinePanel";
import { AIBriefingPanel, type AIBriefingPanelRef } from "@/components/replay/AIBriefingPanel";
import { AccountInspector } from "@/components/replay/AccountInspector";
import { RiskScoreCard } from "@/components/replay/RiskScoreCard";
import { StatisticsPanel } from "@/components/replay/StatisticsPanel";
import { HeatmapToggle } from "@/components/replay/HeatmapToggle";
import { REPLAY_THEME, cardStyle } from "@/components/replay/replayTheme";
import { getPeakRiskFromScore } from "@/lib/replayFromTrace";
import type { ReplayDataset } from "@/data/replayData";
import type { LiveAlertMeta } from "@/lib/replayFromTrace";

export default function TransactionTimeMachine() {
  const [, params] = useRoute("/transaction-time-machine/:alertId");
  const alertId = decodeURIComponent(params?.alertId ?? "");
  const { toast } = useToast();

  const {
    alertMeta,
    dataset,
    score,
    explain,
    loading,
    hasTrace,
    error,
  } = useLiveReplayDataset(alertId);

  if (loading) {
    return (
      <div
        className="h-screen p-6 flex flex-col items-center justify-center gap-4"
        style={{ backgroundColor: REPLAY_THEME.bg }}
      >
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: REPLAY_THEME.accent }} />
        <p className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: REPLAY_THEME.textMuted }}>
          Loading live transaction trace…
        </p>
      </div>
    );
  }

  if (!dataset || !alertMeta || !hasTrace) {
    return (
      <div
        className="h-screen p-6 flex flex-col items-center justify-center"
        style={{ backgroundColor: REPLAY_THEME.bg }}
      >
        <div className="p-8 text-center max-w-md" style={cardStyle}>
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] mb-2" style={{ color: REPLAY_THEME.textDim }}>
            // Replay Unavailable
          </p>
          <h1 className="text-xl font-black uppercase mb-2" style={{ color: REPLAY_THEME.text }}>
            No Trace Data
          </h1>
          <p className="text-[13px] mb-6" style={{ color: REPLAY_THEME.textMuted }}>
            {error
              ? `Could not load trace for alert ${alertId}: ${error.message}`
              : `No transaction chain found for alert ${alertId || "—"}. Open from Alert Details after a live trace is available.`}
          </p>
          <Link href="/alerts">
            <button
              type="button"
              className="px-4 py-2 text-[11px] font-black uppercase tracking-wider"
              style={{
                backgroundColor: REPLAY_THEME.accent,
                color: REPLAY_THEME.border,
                border: `1px solid ${REPLAY_THEME.border}`,
              }}
            >
              Back to Alerts
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <TransactionTimeMachineReplay
      alertId={alertId}
      alert={alertMeta}
      dataset={dataset}
      explain={explain}
      peakRisk={getPeakRiskFromScore(score, dataset.transactions.length)}
      toast={toast}
    />
  );
}

function TransactionTimeMachineReplay({
  alertId,
  alert,
  dataset,
  explain,
  peakRisk,
  toast,
}: {
  alertId: string;
  alert: LiveAlertMeta;
  dataset: ReplayDataset;
  explain: any;
  peakRisk: number;
  toast: ReturnType<typeof useToast>["toast"];
}) {
  const engine = useReplayEngine(dataset);
  const aiBriefingRef = useRef<AIBriefingPanelRef>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const handleRecordVideo = async () => {
    if (isRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      
      const recorder = new MediaRecorder(displayStream, { mimeType: "video/webm" });
      const chunks: BlobPart[] = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `transaction_replay_${alertId}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        setIsRecording(false);
      };
      
      displayStream.getVideoTracks()[0].onended = () => {
        if (recorder.state !== 'inactive') recorder.stop();
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      
      engine.restart();
      engine.play();
      
      if (!aiBriefingRef.current?.getText()) {
        await aiBriefingRef.current?.generateBriefing();
      }
      
      await aiBriefingRef.current?.speak();
      
      // Stop recording automatically when voice finishes
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      
      displayStream.getTracks().forEach(t => t.stop());
      
      toast({
        title: "Video Recorded",
        description: "Transaction replay and AI voiceover downloaded successfully.",
      });
    } catch (e) {
      console.error("Recording failed:", e);
      setIsRecording(false);
      toast({
        title: "Recording Failed",
        description: "Could not start video recording.",
        variant: "destructive"
      });
    }
  };

  const metaChips = [
    { label: "Alert", value: alert.alertId },
    { label: "Pattern", value: alert.pattern },
    { label: "Status", value: alert.status.replace("_", " ") },
    { label: "Peak Risk", value: String(peakRisk) },
    { label: "Txns", value: String(dataset.transactions.length) },
  ];

  return (
    <div
      className="h-screen flex flex-col overflow-hidden p-3 gap-2"
      style={{ backgroundColor: REPLAY_THEME.bg }}
    >
      <motion.header
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="shrink-0 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2.5"
        style={cardStyle}
      >
        <div className="flex items-center gap-3 min-w-0">
          <Link href={`/alerts?alert=${encodeURIComponent(alertId)}`}>
            <button
              type="button"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] shrink-0"
              style={{
                border: `1px solid ${REPLAY_THEME.border}`,
                color: REPLAY_THEME.text,
                backgroundColor: REPLAY_THEME.surfaceAlt,
              }}
            >
              <ArrowLeft className="h-3 w-3" />
              Back
            </button>
          </Link>
          <div className="min-w-0 border-l pl-3" style={{ borderColor: REPLAY_THEME.borderMuted }}>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: REPLAY_THEME.accent }}>
              // Transaction Time Machine
            </p>
            <p className="text-[13px] font-black uppercase truncate" style={{ color: REPLAY_THEME.text }}>
              {alert.accountName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {metaChips.map(chip => (
            <div
              key={chip.label}
              className="px-2 py-1 hidden sm:block"
              style={{ border: `1px solid ${REPLAY_THEME.borderMuted}`, backgroundColor: REPLAY_THEME.surfaceAlt }}
            >
              <span className="text-[8px] font-bold uppercase tracking-wider mr-1.5" style={{ color: REPLAY_THEME.textDim }}>
                {chip.label}
              </span>
              <span className="text-[10px] font-semibold" style={{ color: REPLAY_THEME.text }}>
                {chip.value}
              </span>
            </div>
          ))}
          <HeatmapToggle enabled={engine.heatmapMode} onToggle={engine.toggleHeatmap} />
          <div
            className="flex items-center gap-1.5 px-2 py-1 text-[9px] font-bold uppercase tracking-wider"
            style={{
              border: `1px solid ${engine.isPlaying ? REPLAY_THEME.accent : REPLAY_THEME.borderMuted}`,
              color: engine.isPlaying ? REPLAY_THEME.accent : REPLAY_THEME.textMuted,
              backgroundColor: engine.isPlaying ? "rgba(163,230,53,0.08)" : "transparent",
            }}
          >
            <Radio className="h-3 w-3" />
            {engine.isPlaying ? "Live" : "Ready"}
          </div>
          <button
            type="button"
            onClick={handleRecordVideo}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.1em]"
            style={{
              backgroundColor: isRecording ? REPLAY_THEME.error : REPLAY_THEME.accent,
              color: REPLAY_THEME.border,
              border: `1px solid ${isRecording ? REPLAY_THEME.error : REPLAY_THEME.accent}`,
              transition: "all 0.2s"
            }}
          >
            {isRecording ? <Square className="h-3 w-3" fill="currentColor" /> : <Video className="h-3 w-3" />}
            {isRecording ? "Stop Recording" : "Record Video"}
          </button>
        </div>
      </motion.header>

      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-2">
        <div className="flex flex-col min-h-0 gap-2">
          <div
            className="flex-1 min-h-[200px] overflow-hidden"
            style={{ ...cardStyle, boxShadow: `3px 3px 0px ${REPLAY_THEME.border}`, padding: 0 }}
          >
            <ReplayGraph
              dataset={dataset}
              currentIndex={engine.currentIndex}
              heatmapMode={engine.heatmapMode}
              selectedNodeId={engine.selectedNodeId}
              activePatterns={engine.activePatterns}
              onNodeClick={engine.selectNode}
            />
          </div>
          <ReplayControls
            compact
            isPlaying={engine.isPlaying}
            currentIndex={engine.currentIndex}
            totalTransactions={engine.totalTransactions}
            speed={engine.speed}
            onPlay={engine.play}
            onPause={engine.pause}
            onStop={engine.stop}
            onPrevious={engine.previous}
            onNext={engine.next}
            onRewind={engine.rewind}
            onForward={engine.forward}
            onRestart={engine.restart}
            onSpeedChange={engine.setSpeed}
            onSeek={engine.seekToIndex}
          />
        </div>

        <div className="flex flex-col min-h-0 gap-2 lg:max-h-full">
          <div className="flex-[5] min-h-0">
            <TimelinePanel
              timeline={dataset.timeline}
              currentIndex={engine.currentIndex}
              onSeek={engine.seekToIndex}
            />
          </div>
          {/* AI Briefing Panel replaces the old AICommentaryPanel */}
          <div className="flex-[4] min-h-0">
            <AIBriefingPanel
              ref={aiBriefingRef}
              alert={alert}
              dataset={dataset}
              explain={explain}
            />
          </div>
          <div className="h-[130px] shrink-0 min-h-0 hidden lg:block">
            <AccountInspector
              dataset={dataset}
              snapshot={engine.selectedAccount}
              selectedNodeId={engine.selectedNodeId}
            />
          </div>
        </div>
      </div>

      <div className="shrink-0 flex flex-col sm:flex-row gap-2">
        <StatisticsPanel stats={engine.statistics} compact />
        <RiskScoreCard score={engine.riskScore} reasons={engine.riskReasons} compact />
      </div>
    </div>
  );
}
