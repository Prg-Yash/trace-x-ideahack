import { FraudApi } from "../generated/src/apis/FraudApi";
import { NarrativeRequest } from "../generated/src/models/NarrativeRequest";
import { getAuthenticatedConfig } from "../auth/interceptor";
import { validateRequiredString } from "../utils/validators";

/**
 * Get the risk score of a given account.
 *
 * @param accountId The account identifier
 */
export async function getScore(accountId: string): Promise<any> {
    const validAccountId = validateRequiredString(accountId, "accountId");
    const config = getAuthenticatedConfig();
    const api = new FraudApi(config);
    return await api.getScoreApiV1ScoreAccountIdGet({
        accountId: validAccountId,
    });
}

/**
 * Get the full fraud explanation for an account.
 *
 * @param accountId The account identifier
 */
export async function getFullExplanation(accountId: string): Promise<any> {
    const validAccountId = validateRequiredString(accountId, "accountId");
    const config = getAuthenticatedConfig();
    const api = new FraudApi(config);
    return await api.getFullExplanationApiV1ExplainAccountIdGet({
        accountId: validAccountId,
    });
}

/**
 * Get the dormant account explanation.
 *
 * @param accountId The account identifier
 */
export async function getDormantExplanation(accountId: string): Promise<any> {
    const validAccountId = validateRequiredString(accountId, "accountId");
    const config = getAuthenticatedConfig();
    const api = new FraudApi(config);
    return await api.getDormantExplanationApiV1ExplainAccountIdDormantGet({
        accountId: validAccountId,
    });
}

/**
 * Get the smurfing/layering pattern explanation.
 *
 * @param accountId The account identifier
 */
export async function getSmurfingExplanation(accountId: string): Promise<any> {
    const validAccountId = validateRequiredString(accountId, "accountId");
    const config = getAuthenticatedConfig();
    const api = new FraudApi(config);
    return await api.getSmurfingExplanationApiV1ExplainAccountIdSmurfingGet({
        accountId: validAccountId,
    });
}

/**
 * Get the KYC mismatch pattern explanation.
 *
 * @param accountId The account identifier
 */
export async function getKycExplanation(accountId: string): Promise<any> {
    const validAccountId = validateRequiredString(accountId, "accountId");
    const config = getAuthenticatedConfig();
    const api = new FraudApi(config);
    return await api.getKycExplanationApiV1ExplainAccountIdKycGet({
        accountId: validAccountId,
    });
}

/**
 * Get the KYC details mismatch explanation.
 *
 * @param accountId The account identifier
 */
export async function getKycMismatchExplanation(accountId: string): Promise<any> {
    const validAccountId = validateRequiredString(accountId, "accountId");
    const config = getAuthenticatedConfig();
    const api = new FraudApi(config);
    return await api.getKycMismatchExplanationApiV1ExplainKycMismatchAccountIdGet({
        accountId: validAccountId,
    });
}

/**
 * Generate narrative report details for an account.
 *
 * @param accountId The account identifier
 * @param request The narrative generation request parameters
 */
export async function getNarrative(accountId: string, request: NarrativeRequest): Promise<any> {
    const validAccountId = validateRequiredString(accountId, "accountId");
    const config = getAuthenticatedConfig();
    const api = new FraudApi(config);
    return await api.getNarrativeApiV1NarrativeAccountIdPost({
        accountId: validAccountId,
        narrativeRequest: request,
    });
}

/**
 * Retrieve the summary report for a given account.
 *
 * @param accountId The account identifier
 */
export async function getReport(accountId: string): Promise<any> {
    const validAccountId = validateRequiredString(accountId, "accountId");
    const config = getAuthenticatedConfig();
    const api = new FraudApi(config);
    return await api.getReportApiV1ReportAccountIdGet({
        accountId: validAccountId,
    });
}

/**
 * Trace funds flow from/to a specific account.
 *
 * @param accountId The account identifier
 * @param hint Optional search hint
 */
export async function getTrace(accountId: string, hint?: string): Promise<any> {
    const validAccountId = validateRequiredString(accountId, "accountId");
    const config = getAuthenticatedConfig();
    const api = new FraudApi(config);
    return await api.getTraceApiV1TraceAccountIdGet({
        accountId: validAccountId,
        hint,
    });
}
