import { useMemo } from "react";
import { useAlertsQuick, useExplain, useScore, useTrace } from "@/hooks/useApi";
import type { ReplayDataset } from "@/data/replayData";
import {
  buildReplayDatasetFromTrace,
  parseAlertRoute,
  urlPatternToTraceHint,
  type LiveAlertMeta,
} from "@/lib/replayFromTrace";

export function useLiveReplayDataset(alertId: string) {
  const { accountId, pattern: urlPattern } = parseAlertRoute(decodeURIComponent(alertId));
  const hint = urlPatternToTraceHint(urlPattern);

  const { data: alertsData } = useAlertsQuick(200);
  const { data: trace, loading: traceLoading, error: traceError } = useTrace(accountId, hint);
  const { data: score, loading: scoreLoading } = useScore(accountId);
  const { data: explain, loading: explainLoading } = useExplain(accountId);

  const alertMeta = useMemo((): LiveAlertMeta | null => {
    if (!alertId || !accountId) return null;

    const live = alertsData?.alerts?.find(
      a => a.account_id === accountId
        || alertId.includes(a.account_id),
    );

    return {
      alertId,
      accountId,
      accountName: live?.account_id || accountId,
      accountNumber: accountId,
      pattern: urlPattern || live?.flagged_for?.[0] || trace?.fraud_type || "FRAUD",
      severity: live?.risk_level || "HIGH",
      status: "OPEN",
      amount: live?.total_amount ?? (trace?.amounts || []).reduce((a, b) => a + b, 0),
      description: live?.flagged_for?.length
        ? `Fraud pattern detected: ${live.flagged_for.join(", ")}`
        : trace?.fraud_type
          ? `Live trace: ${trace.fraud_type}`
          : null,
    };
  }, [alertId, accountId, alertsData, urlPattern, trace]);

  const dataset = useMemo((): ReplayDataset | null => {
    if (!alertMeta || !trace || trace.chain?.length < 2) return null;
    return buildReplayDatasetFromTrace(alertMeta, trace, score, explain);
  }, [alertMeta, trace, score, explain]);

  const loading = traceLoading || scoreLoading || explainLoading;
  const hasTrace = Boolean(trace?.chain && trace.chain.length > 1);

  return {
    alertMeta,
    dataset,
    trace,
    score,
    explain,
    loading,
    hasTrace,
    error: traceError,
    accountId,
  };
}
