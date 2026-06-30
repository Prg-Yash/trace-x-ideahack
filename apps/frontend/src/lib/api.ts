/**
 * api.ts — Trace-X unified API client
 * All backend calls go through this module.
 * Base URL pulled from Vite env VITE_API_URL (fallback: localhost:8000)
 */

const rawUrl = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "");
export const BASE = rawUrl
  ? (rawUrl.endsWith("/api/v1") ? rawUrl : `${rawUrl}/api/v1`)
  : "http://127.0.0.1:8000/api/v1";

// ── generic fetch wrapper ────────────────────────────────────────────────────
async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = sessionStorage.getItem("trace-x-token");

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${path}`, {
    headers: {
      ...headers,
      ...(init?.headers ?? {}),
    },
    ...init,
  });
  if (!res.ok) {
    if (res.status === 401) {
      // Optional: automatically redirect to login or clear token if it expires
      // For now, let the AuthContext handle this if /me fails
    }
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
  // Postgres-enriched metadata (added by /score endpoint)
  account_type?: string;
  branch_name?: string;
  branch_code?: string;
  volume_30d?: number;
  txn_count_30d?: number;
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
  customer_name?: string;
  risk_level: string;
  flagged_for: string[];
  score: number;
  total_amount?: number;
  alert_id?: string;
  status?: string;
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
  timestamps?: string[];
  channels?: string[];
  confidence?: number;
  error?: string;
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
  branch_name?: string;
  branch_code?: string;
  customer_name?: string;
  pan_number?: string;
  dob?: string;
  address?: string;
  current_balance?: number;
  is_fraud?: boolean;
  risk_category?: string;
  pattern_type?: string | null;
  opened_on?: string;
  avg_monthly_volume?: number;
  volume_30d?: number;
  txn_count_30d?: number;
  declared_annual_income?: number;
};

export type InvestigationNote = {
  id: number;
  account_id: string;
  author: string;
  content: string;
  created_at: string;
};

export type BranchRisk = {
  branch_code: string;
  branch_name: string;
  region: string;
  total_accounts: number;
  flagged_accounts: number;
  flagged_volume: number;
  risk_score: number;
  dominant_pattern: string;
  channel_breakdown: Record<string, number>;
};

export type ChannelRisk = {
  channel: string;
  total_volume: number;
  flagged_volume: number;
  flagged_txns: number;
  risk_percentage: number;
  top_pattern: string;
  avg_txn_size: number;
};

export type MatrixItem = {
  pattern: string;
  CASH: number;
  UPI: number;
  NEFT: number;
  WIRE: number;
  SWIFT: number;
  CRYPTO: number;
  primary_abuse: string;
};

export type BranchChannelAnalytics = {
  generated_at: string;
  branches: BranchRisk[];
  channels: ChannelRisk[];
  matrix: MatrixItem[];
};

// ── API calls ────────────────────────────────────────────────────────────────

/** Dashboard KPIs */
export const fetchStats = (branchCode?: string) => {
  const qs = branchCode ? `?branch_code=${encodeURIComponent(branchCode)}` : "";
  return apiFetch<SystemStats>(`/stats${qs}`);
};

export const fetchBranchChannelAnalytics = () => apiFetch<BranchChannelAnalytics>("/analytics/branch-channel");

/** Live transaction feed */
export const fetchFeed = () => apiFetch<FeedResponse>("/feed");

/** Quick pre-computed alerts from Neo4j (instant) */
export const fetchAlertsQuick = (limit = 200, branchCode?: string) => {
  const qs = branchCode ? `&branch_code=${encodeURIComponent(branchCode)}` : "";
  return apiFetch<AlertsResponse>(`/alerts/quick?limit=${limit}${qs}`);
};

/** Full ML-scored alerts (slower, scores every candidate) */
export const fetchAlerts = (limit = 50) =>
  apiFetch<AlertsResponse>(`/alerts?limit=${limit}`);

/** Admin investigator management */
export const fetchInvestigators = () =>
  apiFetch<{ id: string; username: string; full_name: string; role: string }[]>("/auth/users/investigators");

export const createInvestigator = (data: any) =>
  apiFetch<{ id: string; username: string; full_name: string; role: string }>("/auth/users", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const updateInvestigatorPassword = (userId: string, newPassword: string) =>
  apiFetch<{ message: string }>(`/auth/users/${userId}/password`, {
    method: "PATCH",
    body: JSON.stringify({ new_password: newPassword }),
  });

export const deleteInvestigator = (userId: string) =>
  apiFetch<{ message: string }>(`/auth/users/${userId}`, {
    method: "DELETE",
  });

export const fetchBranches = () =>
  apiFetch<{ id: number; branch_code: string; name: string; city: string; created_at: string }[]>("/branches");

export const createBranch = (data: any) =>
  apiFetch<{ id: number; branch_code: string; name: string; city: string }>("/branches", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const updateBranch = (branchId: number, data: any) =>
  apiFetch<{ id: number; branch_code: string; name: string; city: string }>(`/branches/${branchId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });

export const deleteBranch = (branchId: number) =>
  apiFetch<{ message: string }>(`/branches/${branchId}`, {
    method: "DELETE",
  });

/** Risk score for a single account */
export const fetchScore = (accountId: string) =>
  apiFetch<ScoreResult>(`/score/${encodeURIComponent(accountId)}`);

/** Graph trace for an account */
export const fetchTrace = (accountId: string, hint = "") => {
  const qs = hint ? `?hint=${encodeURIComponent(hint)}` : "";
  return apiFetch<TraceResult>(`/trace/${encodeURIComponent(accountId)}${qs}`);
};

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
export const fetchAccounts = (limit = 300, branchCode?: string) => {
  const qs = branchCode ? `&branch_code=${encodeURIComponent(branchCode)}` : "";
  return apiFetch<AccountRecord[]>(`/accounts?limit=${limit}${qs}`);
};

/** Investigation notes */
export const fetchAccountNotes = (accountId: string) =>
  apiFetch<InvestigationNote[]>(`/accounts/${encodeURIComponent(accountId)}/notes`);

export const addAccountNote = (accountId: string, content: string, author = "FINnet Investigator") =>
  apiFetch<InvestigationNote>(`/accounts/${encodeURIComponent(accountId)}/notes`, {
    method: "POST",
    body: JSON.stringify({ author, content }),
  });

/** Workflow Endpoints */
export const assignAlert = (alertId: string, data?: { assignee_id: string }) =>
  apiFetch<{ message: string, status: string }>(`/alerts/${encodeURIComponent(alertId)}/assign`, {
    method: "POST",
    body: data ? JSON.stringify(data) : undefined
  });

export const draftStr = (alertId: string) =>
  apiFetch<{ message: string, status: string }>(`/alerts/${encodeURIComponent(alertId)}/draft-str`, { method: "POST" });

export const approveStr = (alertId: string) =>
  apiFetch<{ message: string, status: string }>(`/alerts/${encodeURIComponent(alertId)}/approve-str`, { method: "POST" });

export const rejectStr = (alertId: string) =>
  apiFetch<{ message: string, status: string }>(`/alerts/${encodeURIComponent(alertId)}/reject-str`, { method: "POST" });

export const fetchAuditTrail = (alertId: string) =>
  apiFetch<{ audit_log: any[] }>(`/alerts/${encodeURIComponent(alertId)}/audit`);

/** Chatbot Graph-RAG Endpoint */
export type ChatHistoryTurn = { role: "user" | "ai"; content: string };

export const sendChatMessage = (message: string, history: ChatHistoryTurn[] = []) =>
  apiFetch<{ response: string }>("/chat", {
    method: "POST",
    body: JSON.stringify({ message, history }),
  });
