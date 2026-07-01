// ──────────────────────────────────────────────────────────────────────────────
// G-TEN SDK — Type Definitions
// ──────────────────────────────────────────────────────────────────────────────

/** Configuration options for initializing the GTenSDK. */
export interface GTenSDKConfig {
    /** The API key issued to the external client. */
    apiKey: string;
    /** The unique client identifier. */
    clientId: string;
    /** Optional base URL of the G-TEN API (defaults to http://localhost:8000). */
    baseUrl?: string;
}

/** @deprecated Use GTenSDKConfig instead. */
export interface AuthCredentials {
    apiKey: string;
    clientId: string;
    baseUrl?: string;
}

/** Result returned after a successful authentication. */
export interface AuthResult {
    username: string;
    role: string;
    authenticated: boolean;
}

/** Narrative / commentary generation request parameters. */
export interface NarrativeRequest {
    focused_pattern?: string;
    all_patterns?: string[];
    shap_features?: string[];
}

/** Response shape from the stats endpoint. */
export interface StatsResponse {
    total_accounts: number;
    total_transactions: number;
    total_flagged: number;
    critical_count: number;
    dormant_count: number;
    fraud_volume_30d: number;
    accounts_scanned: number;
}

/** An individual alert in the system. */
export interface Alert {
    alert_id: string;
    account_id: string;
    customer_name: string;
    masked_account_number: string;
    branch_name: string;
    branch_code: string;
    risk_level: string;
    flagged_for: string[];
    score: number;
    total_amount: number | null;
    status: string;
    assigned_to: string | null;
    assignee_id: string | null;
    created_at: string;
    detections: Record<string, { detected: boolean; confidence: number }>;
}

/** Paginated alerts response. */
export interface AlertsResponse {
    total: number;
    alerts: Alert[];
}

/** Risk score analysis result for a single account. */
export interface RiskScoreResult {
    account_id: string;
    is_flagged: boolean;
    risk_level: string;
    combined_score: number;
    flagged_for: string[];
    detections: Record<string, { detected: boolean; confidence?: number; error?: string }>;
    [key: string]: any;
}

/** Fund-tracing result. */
export interface TraceResult {
    detected: boolean;
    fraud_type: string;
    chain: any[];
    amounts: number[];
    [key: string]: any;
}
