/**
 * G-TEN SDK — Main Client Class
 *
 * The primary entry point for external developers integrating with the G-TEN platform.
 * Provides a clean, class-based interface that hides all HTTP, auth, and internal details.
 *
 * @example
 * ```ts
 * import { GTenSDK } from "@gten/sdk";
 *
 * const sdk = new GTenSDK({ apiKey: "...", clientId: "..." });
 * await sdk.authenticate();
 *
 * const alerts = await sdk.listAlerts();
 * const score = await sdk.getRiskScore("ACC001");
 * ```
 */

import { setBaseUrl } from "./auth/tokenStore";
import { authenticate as _authenticate, signOut as _signOut } from "./auth/authenticate";
import {
    analyzeTransaction as _analyzeTransaction,
    detectFraud as _detectFraud,
    generateCommentary as _generateCommentary,
    trackFunds as _trackFunds,
    getRiskScore as _getRiskScore,
} from "./wrappers/fraud";
import {
    getAlerts as _getAlerts,
    listAlerts as _listAlerts,
    getAlert as _getAlert,
    createAlert as _createAlert,
} from "./wrappers/alerts";
import { getStats as _getStats } from "./wrappers/analytics";
import { chat as _chat } from "./wrappers/copilot";

import type {
    GTenSDKConfig,
    AuthResult,
    NarrativeRequest,
    RiskScoreResult,
    TraceResult,
    AlertsResponse,
    Alert,
    StatsResponse,
} from "./types";

export class GTenSDK {
    private readonly config: GTenSDKConfig;

    /**
     * Create a new GTenSDK instance.
     *
     * @param config SDK configuration containing apiKey, clientId, and optional baseUrl
     */
    constructor(config: GTenSDKConfig) {
        this.config = config;
        if (config.baseUrl) {
            setBaseUrl(config.baseUrl);
        }
    }

    // ── Authentication ────────────────────────────────────────────────────────

    /**
     * Authenticate the SDK with the G-TEN platform.
     * Must be called once before using any other SDK method.
     * The access token is stored internally and automatically attached to all future requests.
     */
    async authenticate(): Promise<AuthResult> {
        return _authenticate({
            apiKey: this.config.apiKey,
            clientId: this.config.clientId,
            baseUrl: this.config.baseUrl,
        });
    }

    /**
     * Sign out and clear the stored access token.
     * After calling this, all protected methods will throw until `authenticate()` is called again.
     */
    signOut(): void {
        _signOut();
    }

    // ── Fraud Analysis ────────────────────────────────────────────────────────

    /**
     * Run a full fraud analysis on an account.
     * Executes the ML scoring pipeline and returns a comprehensive risk assessment.
     *
     * @param accountId The account identifier to analyze
     */
    async analyzeTransaction(accountId: string): Promise<RiskScoreResult> {
        return _analyzeTransaction(accountId);
    }

    /**
     * Get the risk score for a specific account.
     *
     * @param accountId The account identifier
     */
    async getRiskScore(accountId: string): Promise<RiskScoreResult> {
        return _getRiskScore(accountId);
    }

    /**
     * Run fraud detection on a specific account.
     * Detects patterns like layering, smurfing, dormancy, and KYC mismatch.
     *
     * @param accountId The account identifier
     */
    async detectFraud(accountId: string): Promise<RiskScoreResult> {
        return _detectFraud(accountId);
    }

    /**
     * Trace the flow of funds from/to a specific account.
     * Reveals layering chains, round-trip transfers, and connected entities.
     *
     * @param accountId The account identifier
     * @param hint Optional hint to focus tracing (e.g. "layering", "round_trip")
     */
    async trackFunds(accountId: string, hint?: string): Promise<TraceResult> {
        return _trackFunds(accountId, hint);
    }

    /**
     * Generate an AI-powered narrative commentary / investigation briefing.
     *
     * @param accountId The account identifier
     * @param request Optional parameters to focus the narrative
     */
    async generateCommentary(accountId: string, request?: NarrativeRequest): Promise<any> {
        return _generateCommentary(accountId, request);
    }

    // ── Alerts ─────────────────────────────────────────────────────────────────

    /**
     * Retrieve a paginated list of active alerts.
     *
     * @param limit Maximum number of alerts to return (default: 200)
     */
    async listAlerts(limit?: number): Promise<AlertsResponse> {
        return _listAlerts(limit);
    }

    /**
     * Retrieve a paginated list of active alerts.
     * Alias for `listAlerts()`.
     *
     * @param limit Maximum number of alerts to return (default: 200)
     */
    async getAlerts(limit?: number): Promise<AlertsResponse> {
        return _getAlerts(limit);
    }

    /**
     * Retrieve details for a specific alert by ID.
     *
     * @param alertId The alert identifier
     */
    async getAlert(alertId: string): Promise<Alert> {
        return _getAlert(alertId);
    }

    /**
     * Create a custom alert.
     *
     * @param payload Alert creation details
     */
    async createAlert(payload: any): Promise<any> {
        return _createAlert(payload);
    }

    // ── Analytics ──────────────────────────────────────────────────────────────

    /**
     * Retrieve platform-wide statistics and metrics.
     */
    async getStats(): Promise<StatsResponse> {
        return _getStats();
    }

    // ── Copilot ───────────────────────────────────────────────────────────────

    /**
     * Send a natural-language message to the G-TEN Copilot AI assistant.
     *
     * @param message The natural language query
     * @returns The AI-generated response text
     */
    async chat(message: string): Promise<string> {
        return _chat(message);
    }
}
