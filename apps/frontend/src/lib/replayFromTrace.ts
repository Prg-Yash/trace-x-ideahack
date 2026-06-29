import type { ExplainResult, ScoreResult, TraceResult } from "@/lib/api";
import type {
  ReplayAccount,
  ReplayDataset,
  ReplayTimelineEntry,
  ReplayTransaction,
  RiskEvent,
} from "@/data/replayData";

export type LiveAlertMeta = {
  alertId: string;
  accountId: string;
  accountName: string;
  accountNumber: string;
  pattern: string;
  severity: string;
  status: string;
  amount: number;
  description?: string | null;
};

/** Map URL pattern segment to API trace hint */
export function urlPatternToTraceHint(pattern: string | null): string {
  if (!pattern) return "";
  const p = pattern.toLowerCase();
  if (p.includes("layer")) return "layering";
  if (p.includes("round")) return "round_trip";
  return "";
}

/** Parse `/graph/:alertId` and `/transaction-time-machine/:alertId` routes */
export function parseAlertRoute(alertId: string): { accountId: string; pattern: string | null } {
  if (!alertId) return { accountId: "", pattern: null };
  if (alertId.startsWith("ALT-")) {
    const parts = alertId.split("-");
    return {
      accountId: parts[1] || alertId,
      pattern: parts.slice(2).join("_").toUpperCase() || null,
    };
  }
  return { accountId: alertId, pattern: null };
}

function isConvergentPattern(fraudType: string, urlPattern: string | null): boolean {
  const ft = fraudType.toUpperCase();
  const up = urlPattern?.toUpperCase() || "";
  return ["SMURFING", "DORMANT", "DORMANT_ACTIVATION"].includes(ft)
    || ["SMURFING", "DORMANT"].includes(up);
}

function riskLevelFromScore(score: number): RiskEvent["riskLevel"] {
  if (score >= 80) return "CRITICAL";
  if (score >= 60) return "HIGH";
  if (score >= 35) return "MEDIUM";
  return "LOW";
}

export function buildTransactionsFromTrace(
  alertId: string,
  trace: TraceResult,
  urlPattern: string | null,
): ReplayTransaction[] {
  let chain = trace.chain?.length && trace.chain.length > 1 ? [...trace.chain] : [];
  if (chain.length < 2) return [];

  const amounts = trace.amounts || [];
  const timestamps = trace.timestamps || [];
  const channels = trace.channels || [];
  const fraudType = trace.fraud_type?.toUpperCase() || urlPattern || "FRAUD";
  const convergent = isConvergentPattern(fraudType, urlPattern);

  const txns: ReplayTransaction[] = [];

  for (let i = 0; i < chain.length - 1; i++) {
    let from = chain[i];
    let to = chain[i + 1];
    if (convergent) {
      from = chain[i + 1];
      to = chain[0];
    }
    txns.push({
      id: `TXN-LIVE-${i}-${from}-${to}`,
      alertId,
      from,
      to,
      amount: amounts[i] || 0,
      timestamp: timestamps[i] || new Date(Date.now() + i * 120_000).toISOString(),
      branch: "Live Network",
      channel: channels[i] || "SWIFT",
      riskIncrement: Math.min(20, 6 + i * 3),
      patternDetected: fraudType.replace(/_/g, " "),
      transactionType: channels[i] || "Transfer",
    });
  }

  if (
    (fraudType.includes("ROUND") || urlPattern?.includes("ROUND"))
    && chain.length >= 2
    && chain[chain.length - 1] !== chain[0]
  ) {
    const lastIdx = chain.length - 1;
    txns.push({
      id: `TXN-LIVE-loop-${chain[lastIdx]}-${chain[0]}`,
      alertId,
      from: chain[lastIdx],
      to: chain[0],
      amount: amounts[lastIdx] ?? amounts[lastIdx - 1] ?? 0,
      timestamp: timestamps[lastIdx] || new Date(Date.now() + lastIdx * 120_000).toISOString(),
      branch: "Live Network",
      channel: channels[lastIdx] || "WIRE",
      riskIncrement: 22,
      patternDetected: "Round Tripping",
      transactionType: channels[lastIdx] || "Wire Transfer",
    });
  }

  return txns.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );
}

function buildAccountsFromTrace(
  alertId: string,
  chain: string[],
  targetAccountId: string,
  score: ScoreResult | null,
  amounts: number[],
): ReplayAccount[] {
  const unique = Array.from(new Set(chain));
  return unique.map((acc, index) => {
    const isTarget = acc === targetAccountId;
    const riskScore = isTarget && score
      ? Math.round(score.combined_score * 100)
      : Math.max(25, 70 - index * 12);
    return {
      id: acc,
      alertId,
      accountNumber: acc,
      customerName: isTarget
        ? (score?.account_type ? `Target · ${acc}` : acc)
        : `Hop ${index} · ${acc}`,
      initialBalance: isTarget
        ? (score?.volume_30d || amounts[0] || 100_000)
        : (amounts[index] || amounts[index - 1] || 50_000),
      branch: isTarget ? (score?.branch_name || "Live Network") : "Linked Node",
      customerType: isTarget ? (score?.account_type || "Account") : "Linked Account",
      dormancyDays: 0,
      baseRiskScore: Math.min(90, riskScore),
      label: String.fromCharCode(65 + (index % 26)),
    };
  });
}

function buildTimeline(
  alertId: string,
  transactions: ReplayTransaction[],
  accounts: ReplayAccount[],
): ReplayTimelineEntry[] {
  return transactions.map((txn, index) => {
    const fromAcct = accounts.find(a => a.id === txn.from);
    const toAcct = accounts.find(a => a.id === txn.to);
    return {
      id: `TL-LIVE-${index}`,
      alertId,
      transactionId: txn.id,
      timestamp: txn.timestamp,
      fromLabel: fromAcct ? `${fromAcct.customerName} (${fromAcct.label})` : txn.from,
      toLabel: toAcct ? `${toAcct.customerName} (${toAcct.label})` : txn.to,
      amount: txn.amount,
    };
  });
}

function buildRiskEvents(
  alertId: string,
  transactions: ReplayTransaction[],
  explain: ExplainResult | null,
  score: ScoreResult | null,
): RiskEvent[] {
  const summary =
    explain?.top_risk_factors?.[0]?.label
    || explain?.by_fraud_type?.smurfing?.explanation_summary
    || explain?.by_fraud_type?.dormant?.explanation_summary
    || score?.flagged_for?.join(", ")
    || "Suspicious fund movement detected";

  return transactions.map((txn, index) => {
    const cumulative = transactions
      .slice(0, index + 1)
      .reduce((sum, t) => sum + t.riskIncrement, 0);
    const base = score ? Math.round(score.combined_score * 100) : 30;
    return {
      id: `RE-LIVE-${index}`,
      alertId,
      transactionId: txn.id,
      timestamp: txn.timestamp,
      riskLevel: riskLevelFromScore(base + cumulative),
      explanation: index === 0
        ? summary
        : `Hop ${index + 1}: ${txn.patternDetected ?? "Transfer"} — ₹${txn.amount.toLocaleString("en-IN")} moved from ${txn.from} to ${txn.to}.`,
      pattern: txn.patternDetected ?? "Transfer",
      scoreDelta: txn.riskIncrement,
    };
  });
}

export function buildReplayDatasetFromTrace(
  meta: LiveAlertMeta,
  trace: TraceResult,
  score: ScoreResult | null,
  explain: ExplainResult | null,
): ReplayDataset | null {
  const { pattern: urlPattern } = parseAlertRoute(meta.alertId);
  const transactions = buildTransactionsFromTrace(meta.alertId, trace, urlPattern);
  if (!transactions.length) return null;

  const chain = trace.chain?.length ? trace.chain : [meta.accountId];
  const accounts = buildAccountsFromTrace(
    meta.alertId,
    chain,
    meta.accountId,
    score,
    trace.amounts || [],
  );

  return {
    alertId: meta.alertId,
    transactions,
    accounts,
    timeline: buildTimeline(meta.alertId, transactions, accounts),
    riskEvents: buildRiskEvents(meta.alertId, transactions, explain, score),
    originAccountId: meta.accountId,
  };
}

export function getPeakRiskFromScore(score: ScoreResult | null, transactionCount: number): number {
  if (!score) return Math.min(100, 30 + transactionCount * 8);
  return Math.min(100, Math.round(score.combined_score * 100) + transactionCount * 5);
}
