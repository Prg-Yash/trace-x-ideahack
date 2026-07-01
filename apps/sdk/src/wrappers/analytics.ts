import { BranchesApi } from "../generated/src/apis/BranchesApi";
import { FraudApi } from "../generated/src/apis/FraudApi";
import { getAuthenticatedConfig } from "../auth/interceptor";
import { validateRequiredString } from "../utils/validators";

/**
 * Retrieve aggregated G-TEN platform statistics.
 *
 * @param branchCode Optional branch code filter
 */
export async function getStats(branchCode?: string): Promise<any> {
    const config = getAuthenticatedConfig();
    const api = new FraudApi(config);
    return await api.getStatsApiV1StatsGet({
        branchCode,
    });
}

/**
 * Retrieve branch-channel risk analytics.
 */
export async function getBranchAnalytics(): Promise<any> {
    const config = getAuthenticatedConfig();
    const api = new FraudApi(config);
    return await api.getBranchChannelAnalyticsApiV1AnalyticsBranchChannelGet();
}

/**
 * Get a list of all bank branches.
 */
export async function getBranches(): Promise<any> {
    const config = getAuthenticatedConfig();
    const api = new BranchesApi(config);
    return await api.getBranchesApiV1BranchesGet();
}

/**
 * Register a new bank branch in G-TEN.
 *
 * @param branchCode The unique code representing the branch (e.g. SBIN0000001)
 * @param name The human-readable name of the branch
 * @param city Optional city location of the branch
 */
export async function createBranch(branchCode: string, name: string, city?: string): Promise<any> {
    const validCode = validateRequiredString(branchCode, "branchCode");
    const validName = validateRequiredString(name, "name");
    const config = getAuthenticatedConfig();
    const api = new BranchesApi(config);
    return await api.createBranchApiV1BranchesPost({
        branchCreate: {
            branchCode: validCode,
            name: validName,
            city: city || null,
        },
    });
}
