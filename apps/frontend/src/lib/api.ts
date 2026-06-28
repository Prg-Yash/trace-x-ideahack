/**
 * api.ts — Trace-X unified API client
 * All backend calls go through this module.
 * Base URL pulled from Vite env VITE_API_URL (fallback: localhost:8000)
 */

const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://127.0.0.1:8000/api/v1";

// ── generic fetch wrapper ────────────────────────────────────────────────────
async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

// ── Types matching the FastAPI response shapes ───────────────────────────────

export type SystemStats = {
  total_accounts: number;
  total_transactions: number;
  total_flagged: number;
  critical_count: number;
  fraud_volume_30d: number;
  accounts_scanned: number;
  dormant_count?: number;
};

export type Detection = {
  detected: boolean;
  confidence?: number;
  fraud_type: string;
  error?: string;
  severity?: string;
  mismatch_ratio?: number;
  expected_monthly?: number;
  actual_monthly?: number;
  kyc_tier?: number;
  dormancy_days?: number;
  volume_30d?: number;
  status?: string;
};

export type ScoreResult = {
  account_id: string;
  is_flagged: boolean;
  risk_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  combined_score: number;
  flagged_for: string[];
  detections: {
    smurfing?: Detection;
    dormant?: Detection;
    kyc_mismatch?: Detection;
    layering?: Detection;
    round_trip?: Detection;
  };
};

export type AlertItem = {
  account_id: string;
  risk_level: string;
  flagged_for: string[];
  score: number;
  total_amount?: number;
  detections: Record<string, { detected: boolean; confidence: number }>;
};

export type AlertsResponse = {
  total: number;
  alerts: AlertItem[];
};

export type TraceResult = {
  detected: boolean;
  fraud_type: string;
  chain: string[];
  amounts: number[];
};

export type ShapFactor = {
  feature: string;
  label: string;
  shap_value: number;
  feature_value: number | string;
  direction: "RISK" | "SAFE";
  fraud_type?: string;
};

export type ExplainModel = {
  account_id: string;
  fraud_type: string;
  model: string;
  fraud_probability?: number;
  is_anomaly?: boolean;
  anomaly_score?: number;
  base_value: number;
  top_factors: ShapFactor[];
  explanation_summary: string;
  error?: string;
};

export type ExplainResult = {
  account_id: string;
  generated_at: string;
  models_used: string[];
  top_risk_factors: ShapFactor[];
  by_fraud_type: {
    smurfing: ExplainModel;
    kyc_mismatch: ExplainModel;
    dormant: ExplainModel;
  };
};

export type FeedTransaction = {
  txn_id: string;
  sender_id: string;
  receiver_id: string;
  amount: number;
  channel: string;
  txn_ts: string;
  status: string;
};

export type FeedResponse = {
  transactions: FeedTransaction[];
};

export type AccountRecord = {
  account_id: string;
  entity_id?: string;
  account_type?: string;
  kyc_tier?: number;
  status?: string;
  branch_code?: string;
  current_balance?: number;
  is_fraud?: boolean;
  risk_category?: string;
  pattern_type?: string | null;
};

// ── API calls ────────────────────────────────────────────────────────────────

/** Dashboard KPIs */
export const fetchStats = () => apiFetch<SystemStats>("/stats");

/** Live transaction feed */
export const fetchFeed = () => apiFetch<FeedResponse>("/feed");

/** Quick pre-computed alerts from Neo4j (instant) */
export const fetchAlertsQuick = (limit = 200) =>
  apiFetch<AlertsResponse>(`/alerts/quick?limit=${limit}`);

/** Full ML-scored alerts (slower, scores every candidate) */
export const fetchAlerts = (limit = 50) =>
  apiFetch<AlertsResponse>(`/alerts?limit=${limit}`);

/** Risk score for a single account */
export const fetchScore = (accountId: string) =>
  apiFetch<ScoreResult>(`/score/${encodeURIComponent(accountId)}`);

/** Graph trace for layering / round-trip */
export const fetchTrace = (accountId: string) =>
  apiFetch<TraceResult>(`/trace/${encodeURIComponent(accountId)}`);

/** Full SHAP/XAI explanation package (all models) */
export const fetchExplain = (accountId: string) =>
  apiFetch<ExplainResult>(`/explain/${encodeURIComponent(accountId)}`);

/** Per-model SHAP explanations */
export const fetchExplainSmurfing = (accountId: string) =>
  apiFetch<ExplainModel>(`/explain/${encodeURIComponent(accountId)}/smurfing`);

export const fetchExplainKyc = (accountId: string) =>
  apiFetch<ExplainModel>(`/explain/${encodeURIComponent(accountId)}/kyc`);

export const fetchExplainDormant = (accountId: string) =>
  apiFetch<ExplainModel>(`/explain/${encodeURIComponent(accountId)}/dormant`);

/** Evidence/report package */
export const fetchEvidencePackage = (accountId: string) =>
  apiFetch<any>(`/report/${encodeURIComponent(accountId)}`);

/** List accounts */
export const fetchAccounts = (limit = 100) =>
  apiFetch<AccountRecord[]>(`/accounts?limit=${limit}`);
