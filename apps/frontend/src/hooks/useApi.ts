/**
 * useApi.ts — reusable data-fetching hooks for Trace-X API
 * All hooks return { data, loading, error, refetch }
 */
import { useState, useEffect, useCallback, useRef } from "react";
import {
  fetchStats, fetchAlertsQuick, fetchFeed,
  fetchScore, fetchTrace, fetchExplain, fetchEvidencePackage, fetchAccounts, fetchAccountNotes, fetchBranchChannelAnalytics,
  type SystemStats, type AlertsResponse, type FeedResponse,
  type ScoreResult, type TraceResult, type ExplainResult, type AccountRecord, type InvestigationNote, type BranchChannelAnalytics,
} from "@/lib/api";

// ── Generic fetcher hook ─────────────────────────────────────────────────────
function useQuery<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = [],
  options?: { skip?: boolean; refetchInterval?: number }
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!options?.skip);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const load = useCallback(async () => {
    if (options?.skip) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetcher();
      if (mountedRef.current) setData(res);
    } catch (e: unknown) {
      if (mountedRef.current)
        setError(e instanceof Error ? e.message : String(e));
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    mountedRef.current = true;
    load();
    let interval: ReturnType<typeof setInterval> | undefined;
    if (options?.refetchInterval) {
      interval = setInterval(load, options.refetchInterval);
    }
    return () => {
      mountedRef.current = false;
      if (interval) clearInterval(interval);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

  return { data, loading, error, refetch: load };
}

// ── Concrete hooks ───────────────────────────────────────────────────────────

/** System-wide KPI stats – auto-refreshes every 30s */
export function useStats() {
  return useQuery<SystemStats>(fetchStats, [], { refetchInterval: 30_000 });
}

export function useBranchChannelAnalytics() {
  return useQuery<BranchChannelAnalytics>(fetchBranchChannelAnalytics, [], { refetchInterval: 60_000 });
}

/** Pre-computed quick alerts from Neo4j */
export function useAlertsQuick(limit = 200) {
  return useQuery<AlertsResponse>(
    () => fetchAlertsQuick(limit),
    [limit],
    { refetchInterval: 60_000 }
  );
}

/** Live transaction feed */
export function useFeed() {
  return useQuery<FeedResponse>(fetchFeed, [], { refetchInterval: 15_000 });
}

/** Risk score for a single account (on demand) */
export function useScore(accountId: string | null) {
  return useQuery<ScoreResult>(
    () => fetchScore(accountId!),
    [accountId],
    { skip: !accountId }
  );
}

/** Graph trace for an account */
export function useTrace(accountId: string | null) {
  return useQuery<TraceResult>(
    () => fetchTrace(accountId!),
    [accountId],
    { skip: !accountId }
  );
}

/** Full SHAP/XAI explanation (runs all 3 models concurrently on backend) */
export function useExplain(accountId: string | null) {
  return useQuery<ExplainResult>(
    () => fetchExplain(accountId!),
    [accountId],
    { skip: !accountId }
  );
}

/** Evidence report / FIU data for an account */
export function useReport(accountId: string | null) {
  return useQuery<any>(
    () => fetchEvidencePackage(accountId!),
    [accountId],
    { skip: !accountId }
  );
}

/** List accounts */
export function useAccounts(limit = 300) {
  return useQuery<AccountRecord[]>(
    () => fetchAccounts(limit),
    [limit],
    { refetchInterval: 60_000 }
  );
}

/** Investigation notes for an account */
export function useAccountNotes(accountId: string | null) {
  return useQuery<InvestigationNote[]>(
    () => fetchAccountNotes(accountId!),
    [accountId],
    { skip: !accountId, refetchInterval: 10_000 }
  );
}
