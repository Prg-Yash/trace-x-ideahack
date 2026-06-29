import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  computeStatistics,
  getRiskScoreAtIndex,
  getActivePatterns,
  getRiskReasons,
  getVisibleRiskEvents,
  getCurrentRiskEvent,
  computeAccountSnapshot,
  type PlaybackSpeed,
  type EvidenceSnapshotData,
  type ReplayStatistics,
  type RiskEvent,
  type AccountSnapshot,
  type ReplayDataset,
} from "@/data/replayData";

export type ReplayEngineState = {
  currentIndex: number;
  isPlaying: boolean;
  speed: PlaybackSpeed;
  heatmapMode: boolean;
  selectedNodeId: string | null;
  snapshots: EvidenceSnapshotData[];
  originAccountId: string;
  totalTransactions: number;
  riskScore: number;
  riskReasons: { label: string; delta: number }[];
  statistics: ReplayStatistics;
  activePatterns: string[];
  visibleRiskEvents: RiskEvent[];
  currentRiskEvent: RiskEvent | null;
  activeTransactionId: string | null;
  activeEdgeId: string | null;
  selectedAccount: AccountSnapshot | null;
};

export type ReplayEngineActions = {
  play: () => void;
  pause: () => void;
  stop: () => void;
  previous: () => void;
  next: () => void;
  rewind: () => void;
  forward: () => void;
  restart: () => void;
  seekToIndex: (index: number) => void;
  setSpeed: (speed: PlaybackSpeed) => void;
  toggleHeatmap: () => void;
  selectNode: (nodeId: string | null) => void;
  captureSnapshot: () => EvidenceSnapshotData;
};

const BASE_STEP_MS = 2200;

export function useReplayEngine(dataset: ReplayDataset): ReplayEngineState & ReplayEngineActions {
  const { transactions, originAccountId } = dataset;

  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeedState] = useState<PlaybackSpeed>(1);
  const [heatmapMode, setHeatmapMode] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(originAccountId);
  const [snapshots, setSnapshots] = useState<EvidenceSnapshotData[]>([]);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const indexRef = useRef(currentIndex);
  indexRef.current = currentIndex;

  useEffect(() => {
    setCurrentIndex(-1);
    setIsPlaying(false);
    setSelectedNodeId(originAccountId);
    setSnapshots([]);
    setHeatmapMode(false);
    setSpeedState(1);
  }, [dataset.alertId, originAccountId]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const seekToIndex = useCallback((index: number) => {
    const clamped = Math.max(-1, Math.min(transactions.length - 1, index));
    setCurrentIndex(clamped);
  }, [transactions.length]);

  const pause = useCallback(() => {
    setIsPlaying(false);
    clearTimer();
  }, [clearTimer]);

  const stop = useCallback(() => {
    pause();
    setCurrentIndex(-1);
    setSelectedNodeId(originAccountId);
  }, [pause, originAccountId]);

  const restart = useCallback(() => {
    pause();
    setCurrentIndex(-1);
    setSelectedNodeId(originAccountId);
    setIsPlaying(true);
  }, [pause, originAccountId]);

  const previous = useCallback(() => {
    pause();
    seekToIndex(currentIndex - 1);
  }, [pause, seekToIndex, currentIndex]);

  const next = useCallback(() => {
    pause();
    seekToIndex(currentIndex + 1);
  }, [pause, seekToIndex, currentIndex]);

  const rewind = useCallback(() => {
    pause();
    seekToIndex(Math.max(-1, currentIndex - 3));
  }, [pause, seekToIndex, currentIndex]);

  const forward = useCallback(() => {
    pause();
    seekToIndex(Math.min(transactions.length - 1, currentIndex + 3));
  }, [pause, seekToIndex, currentIndex, transactions.length]);

  const play = useCallback(() => {
    if (currentIndex >= transactions.length - 1) {
      setCurrentIndex(-1);
    }
    setIsPlaying(true);
  }, [currentIndex, transactions.length]);

  const setSpeed = useCallback((s: PlaybackSpeed) => setSpeedState(s), []);
  const toggleHeatmap = useCallback(() => setHeatmapMode(v => !v), []);
  const selectNode = useCallback((nodeId: string | null) => setSelectedNodeId(nodeId), []);

  useEffect(() => {
    if (!isPlaying) return;

    const scheduleNext = () => {
      const idx = indexRef.current;
      if (idx >= transactions.length - 1) {
        setIsPlaying(false);
        return;
      }

      const nextIdx = idx + 1;
      const prevTxn = idx >= 0 ? transactions[idx] : null;
      const nextTxn = transactions[nextIdx];
      let delay = BASE_STEP_MS / speed;

      if (prevTxn && nextTxn) {
        const gap = new Date(nextTxn.timestamp).getTime() - new Date(prevTxn.timestamp).getTime();
        delay = Math.min(Math.max(gap / 4, 600), 4000) / speed;
      }

      timerRef.current = setTimeout(() => {
        setCurrentIndex(nextIdx);
        const txn = transactions[nextIdx];
        if (txn) setSelectedNodeId(txn.to);
      }, delay);
    };

    scheduleNext();
    return clearTimer;
  }, [isPlaying, speed, currentIndex, clearTimer, transactions]);

  const riskScore = useMemo(() => getRiskScoreAtIndex(dataset, currentIndex), [dataset, currentIndex]);
  const statistics = useMemo(() => computeStatistics(dataset, currentIndex), [dataset, currentIndex]);
  const activePatterns = useMemo(() => getActivePatterns(dataset, currentIndex), [dataset, currentIndex]);
  const riskReasons = useMemo(() => getRiskReasons(dataset, currentIndex), [dataset, currentIndex]);
  const visibleRiskEvents = useMemo(() => getVisibleRiskEvents(dataset, currentIndex), [dataset, currentIndex]);
  const currentRiskEvent = useMemo(() => getCurrentRiskEvent(dataset, currentIndex), [dataset, currentIndex]);

  const activeTransactionId = currentIndex >= 0 ? transactions[currentIndex]?.id ?? null : null;
  const activeEdgeId = activeTransactionId;

  const selectedAccount = useMemo(() => {
    if (!selectedNodeId) return null;
    return computeAccountSnapshot(dataset, selectedNodeId, currentIndex);
  }, [dataset, selectedNodeId, currentIndex]);

  const captureSnapshot = useCallback((): EvidenceSnapshotData => {
    const snap: EvidenceSnapshotData = {
      id: `SNAP-${Date.now()}`,
      capturedAt: new Date().toISOString(),
      currentIndex,
      riskScore,
      visibleTransactionIds: transactions.slice(0, currentIndex + 1).map(t => t.id),
      commentary: visibleRiskEvents,
      activePatterns,
      statistics,
    };
    setSnapshots(prev => [snap, ...prev]);
    return snap;
  }, [currentIndex, riskScore, visibleRiskEvents, activePatterns, statistics, transactions]);

  return {
    currentIndex,
    isPlaying,
    speed,
    heatmapMode,
    selectedNodeId,
    snapshots,
    originAccountId,
    totalTransactions: transactions.length,
    riskScore,
    riskReasons,
    statistics,
    activePatterns,
    visibleRiskEvents,
    currentRiskEvent,
    activeTransactionId,
    activeEdgeId,
    selectedAccount,
    play,
    pause,
    stop,
    previous,
    next,
    rewind,
    forward,
    restart,
    seekToIndex,
    setSpeed,
    toggleHeatmap,
    selectNode,
    captureSnapshot,
  };
}
