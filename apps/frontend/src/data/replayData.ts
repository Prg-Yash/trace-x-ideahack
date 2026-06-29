import accountsJson from "./accounts.json";
import transactionsJson from "./transactions.json";
import replayTimelineJson from "./replayTimeline.json";
import riskEventsJson from "./riskEvents.json";
import alertsJson from "./alerts.json";
import { getGraphById } from "./investigationData";
import type { InvestigationAlert } from "./investigationData";
import type { InvestigationGraph } from "./investigationData";
import { staticTransactions } from "./staticData";

export type ReplayAccount = {
  id: string;
  alertId: string;
  accountNumber: string;
  customerName: string;
  initialBalance: number;
  branch: string;
  customerType: string;
  dormancyDays: number;
  baseRiskScore: number;
  label: string;
};

export type ReplayTransaction = {
  id: string;
  alertId: string;
  from: string;
  to: string;
  amount: number;
  timestamp: string;
  branch: string;
  channel: string;
  riskIncrement: number;
  patternDetected: string | null;
  transactionType: string;
};

export type ReplayTimelineEntry = {
  id: string;
  alertId: string;
  transactionId: string;
  timestamp: string;
  fromLabel: string;
  toLabel: string;
  amount: number;
};

export type RiskEvent = {
  id: string;
  alertId: string;
  transactionId: string;
  timestamp: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  explanation: string;
  pattern: string;
  scoreDelta: number;
};

export type PlaybackSpeed = 0.5 | 1 | 2 | 4;

export type EvidenceSnapshotData = {
  id: string;
  capturedAt: string;
  currentIndex: number;
  riskScore: number;
  visibleTransactionIds: string[];
  commentary: RiskEvent[];
  activePatterns: string[];
  statistics: ReplayStatistics;
};

export type ReplayStatistics = {
  replayProgress: number;
  transactionsReplayed: number;
  accountsVisited: number;
  branchesVisited: number;
  channelsUsed: number;
  totalAmountMoved: number;
  currentHopCount: number;
  layerDepth: number;
  highestRiskScore: number;
};

export type AccountSnapshot = {
  account: ReplayAccount;
  balance: number;
  incoming: number;
  outgoing: number;
  connectedAccounts: string[];
  transactionCount: number;
  riskScore: number;
};

export type ReplayDataset = {
  alertId: string;
  transactions: ReplayTransaction[];
  accounts: ReplayAccount[];
  timeline: ReplayTimelineEntry[];
  riskEvents: RiskEvent[];
  originAccountId: string;
};

const allAccounts = accountsJson as ReplayAccount[];
const allTransactions = transactionsJson as ReplayTransaction[];
const allTimeline = replayTimelineJson as ReplayTimelineEntry[];
const allRiskEvents = riskEventsJson as RiskEvent[];
const allAlerts = alertsJson as InvestigationAlert[];

const datasetCache = new Map<string, ReplayDataset>();

function riskLevelToBaseScore(riskLevel: string): number {
  switch (riskLevel?.toUpperCase()) {
    case "CRITICAL": return 55;
    case "HIGH": return 35;
    case "MEDIUM": return 22;
    default: return 12;
  }
}

function transactionsFromGraph(alertId: string, graph: InvestigationGraph): ReplayTransaction[] {
  return graph.edges.map(edge => {
    const source = graph.nodes.find(n => n.id === edge.source);
    const target = graph.nodes.find(n => n.id === edge.target);
    return {
      id: edge.txnId || edge.id,
      alertId,
      from: source?.accountNumber ?? edge.source,
      to: target?.accountNumber ?? edge.target,
      amount: edge.amount,
      timestamp: edge.timestamp,
      branch: "Cross-Border",
      channel: edge.txnType ?? "Wire Transfer",
      riskIncrement: edge.flagged ? 14 : 6,
      patternDetected: edge.pattern ?? null,
      transactionType: edge.txnType ?? "Wire Transfer",
    };
  });
}

function accountsFromGraph(alertId: string, graph: InvestigationGraph): ReplayAccount[] {
  return graph.nodes.map((node, index) => ({
    id: node.accountNumber,
    alertId,
    accountNumber: node.accountNumber,
    customerName: node.label,
    initialBalance: node.balance || 0,
    branch: "Investigation Network",
    customerType: node.accountType,
    dormancyDays: node.accountType?.toLowerCase().includes("dormant") ? 365 : 0,
    baseRiskScore: riskLevelToBaseScore(node.riskLevel),
    label: String.fromCharCode(65 + (index % 26)),
  }));
}

function normalizeJsonTransactions(alertId: string): ReplayTransaction[] {
  const idToNumber = new Map(
    allAccounts.filter(a => a.alertId === alertId).map(a => [a.id, a.accountNumber]),
  );
  return allTransactions
    .filter(t => t.alertId === alertId)
    .map(t => ({
      ...t,
      from: idToNumber.get(t.from) ?? t.from,
      to: idToNumber.get(t.to) ?? t.to,
    }));
}

function transactionsFromStatic(alertId: string, alertNumericId: number): ReplayTransaction[] {
  return staticTransactions
    .filter(t => t.alertId === alertNumericId)
    .map(t => ({
      id: t.txnId,
      alertId,
      from: t.fromAccount,
      to: t.toAccount,
      amount: t.amount,
      timestamp: t.timestamp,
      branch: t.channel,
      channel: t.channel,
      riskIncrement: t.flagged ? 12 : 5,
      patternDetected: t.flagReason,
      transactionType: t.txnType,
    }));
}

function mergeAccounts(alertId: string, ...groups: ReplayAccount[][]): ReplayAccount[] {
  const map = new Map<string, ReplayAccount>();
  groups.flat().forEach(acct => {
    if (acct.alertId === alertId || !acct.alertId) {
      map.set(acct.id, { ...acct, id: acct.accountNumber ?? acct.id, alertId });
    }
  });
  return Array.from(map.values());
}

function mergeTransactions(...groups: ReplayTransaction[][]): ReplayTransaction[] {
  const map = new Map<string, ReplayTransaction>();
  groups.flat().forEach(txn => map.set(txn.id, txn));
  return Array.from(map.values()).sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );
}

function buildTimelineForTransactions(
  alertId: string,
  transactions: ReplayTransaction[],
  accounts: ReplayAccount[],
): ReplayTimelineEntry[] {
  const existing = allTimeline.filter(t => t.alertId === alertId);
  const existingIds = new Set(existing.map(t => t.transactionId));

  const built = transactions.map((txn, index) => {
    if (existingIds.has(txn.id)) {
      return existing.find(e => e.transactionId === txn.id)!;
    }
    const fromAcct = accounts.find(a => a.id === txn.from);
    const toAcct = accounts.find(a => a.id === txn.to);
    return {
      id: `TL-auto-${alertId}-${index}`,
      alertId,
      transactionId: txn.id,
      timestamp: txn.timestamp,
      fromLabel: fromAcct ? `${fromAcct.customerName} (${fromAcct.label})` : txn.from,
      toLabel: toAcct ? `${toAcct.customerName} (${toAcct.label})` : txn.to,
      amount: txn.amount,
    };
  });

  return built.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );
}

function buildRiskEventsForTransactions(
  alertId: string,
  transactions: ReplayTransaction[],
): RiskEvent[] {
  const existing = allRiskEvents.filter(e => e.alertId === alertId);
  const existingIds = new Set(existing.map(e => e.transactionId));

  const built = transactions.map((txn, index) => {
    if (existingIds.has(txn.id)) {
      return existing.find(e => e.transactionId === txn.id)!;
    }
    const level =
      txn.riskIncrement >= 20 ? "CRITICAL"
        : txn.riskIncrement >= 14 ? "HIGH"
          : txn.riskIncrement >= 8 ? "MEDIUM"
            : "LOW";
    return {
      id: `RE-auto-${alertId}-${index}`,
      alertId,
      transactionId: txn.id,
      timestamp: txn.timestamp,
      riskLevel: level as RiskEvent["riskLevel"],
      explanation: `${txn.patternDetected ?? "Suspicious activity"} detected between ${txn.from} and ${txn.to}.`,
      pattern: txn.patternDetected ?? "Suspicious Transfer",
      scoreDelta: txn.riskIncrement,
    };
  });

  return built;
}

function ensureAccountsForTransactions(
  alertId: string,
  accounts: ReplayAccount[],
  transactions: ReplayTransaction[],
): ReplayAccount[] {
  const map = new Map(accounts.map(a => [a.id, a]));
  let counter = accounts.length;

  for (const txn of transactions) {
    for (const acctId of [txn.from, txn.to]) {
      if (!map.has(acctId)) {
        map.set(acctId, {
          id: acctId,
          alertId,
          accountNumber: acctId,
          customerName: acctId,
          initialBalance: 100000,
          branch: "Unknown",
          customerType: "Corporate",
          dormancyDays: 0,
          baseRiskScore: 20,
          label: String.fromCharCode(65 + (counter % 26)),
        });
        counter++;
      }
    }
  }

  return Array.from(map.values());
}

export function getReplayDataset(alertId: string): ReplayDataset | null {
  if (datasetCache.has(alertId)) return datasetCache.get(alertId)!;

  const alert = getAlertByAlertId(alertId);
  if (!alert) return null;

  const graph = getGraphById(alert.graphId);
  const graphTxns = graph ? transactionsFromGraph(alertId, graph) : [];
  const jsonTxns = normalizeJsonTransactions(alertId);
  const staticTxns = transactionsFromStatic(alertId, alert.id);

  const transactions = mergeTransactions(graphTxns, staticTxns, jsonTxns);
  if (!transactions.length) return null;

  const graphAccounts = graph ? accountsFromGraph(alertId, graph) : [];
  const jsonAccounts = allAccounts
    .filter(a => a.alertId === alertId)
    .map(a => ({ ...a, id: a.accountNumber ?? a.id }));

  let accounts = mergeAccounts(alertId, graphAccounts, jsonAccounts);
  accounts = ensureAccountsForTransactions(alertId, accounts, transactions);

  const originAccountId =
    alert.accountNumber ||
    graph?.nodes.find(n => String(n.id) === String(alert.accountId))?.accountNumber ||
    transactions[0].from;

  const timeline = buildTimelineForTransactions(alertId, transactions, accounts);
  const riskEvents = buildRiskEventsForTransactions(alertId, transactions);

  const dataset: ReplayDataset = {
    alertId,
    transactions,
    accounts,
    timeline,
    riskEvents,
    originAccountId,
  };

  datasetCache.set(alertId, dataset);
  return dataset;
}

export function alertHasReplayData(alertId: string): boolean {
  const alert = getAlertByAlertId(alertId);
  if (!alert) return false;
  if (allTransactions.some(t => t.alertId === alertId)) return true;
  if (staticTransactions.some(t => t.alertId === alert.id)) return true;
  const graph = getGraphById(alert.graphId);
  return Boolean(graph?.edges.length);
}

export function getAlertIdsWithReplay(): string[] {
  return [...new Set(allTransactions.map(t => t.alertId))];
}

export function getAlertByAlertId(alertId: string): InvestigationAlert | undefined {
  return allAlerts.find(a => a.alertId === alertId);
}

export function getAccountById(dataset: ReplayDataset, id: string): ReplayAccount | undefined {
  return dataset.accounts.find(a => a.id === id);
}

export function formatINR(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function computeBalancesUpToIndex(dataset: ReplayDataset, index: number): Map<string, number> {
  const balances = new Map<string, number>();
  dataset.accounts.forEach(a => balances.set(a.id, a.initialBalance));

  for (let i = 0; i <= index && i < dataset.transactions.length; i++) {
    const txn = dataset.transactions[i];
    balances.set(txn.from, (balances.get(txn.from) ?? 0) - txn.amount);
    balances.set(txn.to, (balances.get(txn.to) ?? 0) + txn.amount);
  }
  return balances;
}

export function computeAccountSnapshot(
  dataset: ReplayDataset,
  accountId: string,
  index: number,
): AccountSnapshot | null {
  const account = getAccountById(dataset, accountId);
  if (!account) return null;

  const balances = computeBalancesUpToIndex(dataset, index);
  let incoming = 0;
  let outgoing = 0;
  let transactionCount = 0;
  const connected = new Set<string>();

  for (let i = 0; i <= index && i < dataset.transactions.length; i++) {
    const txn = dataset.transactions[i];
    if (txn.from === accountId) {
      outgoing += txn.amount;
      transactionCount++;
      connected.add(txn.to);
    }
    if (txn.to === accountId) {
      incoming += txn.amount;
      transactionCount++;
      connected.add(txn.from);
    }
  }

  let riskScore = account.baseRiskScore;
  for (let i = 0; i <= index && i < dataset.transactions.length; i++) {
    const txn = dataset.transactions[i];
    if (txn.from === accountId || txn.to === accountId) {
      riskScore += txn.riskIncrement;
    }
  }

  return {
    account,
    balance: balances.get(accountId) ?? account.initialBalance,
    incoming,
    outgoing,
    connectedAccounts: Array.from(connected),
    transactionCount,
    riskScore: Math.min(100, riskScore),
  };
}

export function computeStatistics(dataset: ReplayDataset, index: number): ReplayStatistics {
  const visible = dataset.transactions.slice(0, index + 1);
  const accounts = new Set<string>();
  const branches = new Set<string>();
  const channels = new Set<string>();
  let totalAmount = 0;
  const originBase = getAccountById(dataset, dataset.originAccountId)?.baseRiskScore ?? 0;
  let highestRisk = originBase;
  let runningRisk = originBase;

  visible.forEach(txn => {
    accounts.add(txn.from);
    accounts.add(txn.to);
    branches.add(txn.branch);
    channels.add(txn.channel);
    totalAmount += txn.amount;
    runningRisk += txn.riskIncrement;
    highestRisk = Math.max(highestRisk, runningRisk);
  });

  return {
    replayProgress: dataset.transactions.length
      ? Math.round(((index + 1) / dataset.transactions.length) * 100)
      : 0,
    transactionsReplayed: visible.length,
    accountsVisited: accounts.size,
    branchesVisited: branches.size,
    channelsUsed: channels.size,
    totalAmountMoved: totalAmount,
    currentHopCount: visible.length,
    layerDepth: visible.length,
    highestRiskScore: Math.min(100, highestRisk),
  };
}

export function getRiskScoreAtIndex(dataset: ReplayDataset, index: number): number {
  let score = getAccountById(dataset, dataset.originAccountId)?.baseRiskScore ?? 0;
  for (let i = 0; i <= index && i < dataset.transactions.length; i++) {
    score += dataset.transactions[i].riskIncrement;
  }
  return Math.min(100, score);
}

export function getActivePatterns(dataset: ReplayDataset, index: number): string[] {
  const patterns = new Set<string>();
  for (let i = 0; i <= index && i < dataset.transactions.length; i++) {
    const p = dataset.transactions[i].patternDetected;
    if (p) patterns.add(p);
  }
  return Array.from(patterns);
}

export function getRiskReasons(dataset: ReplayDataset, index: number): { label: string; delta: number }[] {
  const reasons: { label: string; delta: number }[] = [];
  for (let i = 0; i <= index && i < dataset.transactions.length; i++) {
    const txn = dataset.transactions[i];
    if (txn.patternDetected) {
      reasons.push({ label: txn.patternDetected, delta: txn.riskIncrement });
    }
  }
  return reasons.slice(-6);
}

export function getVisibleRiskEvents(dataset: ReplayDataset, index: number): RiskEvent[] {
  if (index < 0) return [];
  return dataset.riskEvents.filter(e => {
    const txnIndex = dataset.transactions.findIndex(t => t.id === e.transactionId);
    return txnIndex <= index;
  });
}

export function getCurrentRiskEvent(dataset: ReplayDataset, index: number): RiskEvent | null {
  if (index < 0) return null;
  const txnId = dataset.transactions[index]?.id;
  return dataset.riskEvents.find(e => e.transactionId === txnId) ?? null;
}

export function getHeatmapColor(riskScore: number): string {
  if (riskScore >= 80) return "#EF4444";
  if (riskScore >= 60) return "#F97316";
  if (riskScore >= 35) return "#EAB308";
  return "#10B981";
}

export function getAlertPeakRiskScore(alertId: string): number {
  const dataset = getReplayDataset(alertId);
  if (!dataset) return 0;
  return getRiskScoreAtIndex(dataset, dataset.transactions.length - 1);
}
