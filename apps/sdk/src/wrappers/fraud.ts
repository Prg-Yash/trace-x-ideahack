import { sdkFetch } from "../auth/interceptor";
import { validateRequiredString } from "../utils/validators";
import { RiskScoreResult, TraceResult, NarrativeRequest } from "../types";

/**
 * Analyze a transaction/account for fraud risk.
 * Runs the full ML scoring pipeline and returns a comprehensive risk assessment.
 *
 * @param accountId The account identifier to analyze
 * @returns Full risk score result including detections, combined score, and risk level
 */
export async function analyzeTransaction(accountId: string): Promise<RiskScoreResult> {
    const validAccountId = validateRequiredString(accountId, "accountId");
    return await sdkFetch<RiskScoreResult>(`/sdk/v1/analyze-transaction?account_id=${validAccountId}`, {
        method: "POST",
    });
}

/**
 * Get the risk score for a specific account.
 * Alias for `analyzeTransaction` — provided for semantic clarity.
 *
 * @param accountId The account identifier
 * @returns Risk score result
 */
export async function getRiskScore(accountId: string): Promise<RiskScoreResult> {
    return analyzeTransaction(accountId);
}

/**
 * Run fraud detection on a specific account.
 * Executes ML-based pattern detection (layering, smurfing, dormancy, KYC mismatch).
 *
 * @param accountId The account identifier
 * @returns Detection results with flagged patterns and confidence scores
 */
export async function detectFraud(accountId: string): Promise<RiskScoreResult> {
    const validAccountId = validateRequiredString(accountId, "accountId");
    return await sdkFetch<RiskScoreResult>(`/sdk/v1/detect-fraud?account_id=${validAccountId}`, {
        method: "POST",
    });
}

/**
 * Generate an AI-powered narrative commentary / investigation briefing for an account.
 *
 * @param accountId The account identifier
 * @param request Optional narrative generation parameters (focused pattern, SHAP features, etc.)
 * @returns Generated narrative text and supporting evidence
 */
export async function generateCommentary(accountId: string, request: NarrativeRequest = {}): Promise<any> {
    const validAccountId = validateRequiredString(accountId, "accountId");
    return await sdkFetch(`/sdk/v1/generate-commentary?account_id=${validAccountId}`, {
        method: "POST",
        body: JSON.stringify(request),
    });
}

/**
 * Trace the flow of funds from/to a specific account.
 * Reveals layering chains, round-trip transfers, and connected entities.
 *
 * @param accountId The account identifier
 * @param hint Optional hint to focus tracing (e.g. "layering", "round_trip")
 * @returns Trace result including detected chains and amounts
 */
export async function trackFunds(accountId: string, hint?: string): Promise<TraceResult> {
    const validAccountId = validateRequiredString(accountId, "accountId");
    let url = `/sdk/v1/track-funds?account_id=${validAccountId}`;
    if (hint) {
        url += `&hint=${encodeURIComponent(hint)}`;
    }
    return await sdkFetch<TraceResult>(url, {
        method: "GET",
    });
}

/**
 * @deprecated Use `analyzeTransaction()` or `getRiskScore()` instead.
 */
export async function getScore(accountId: string): Promise<RiskScoreResult> {
    return analyzeTransaction(accountId);
}
