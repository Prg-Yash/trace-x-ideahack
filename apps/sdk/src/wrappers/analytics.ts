import { sdkFetch } from "../auth/interceptor";
import { StatsResponse } from "../types";

/**
 * Retrieve platform-wide statistics and metrics.
 * Includes account counts, transaction volumes, flagged entities, and fraud volumes.
 *
 * @returns Platform statistics
 */
export async function getStats(): Promise<StatsResponse> {
    return await sdkFetch<StatsResponse>(`/sdk/v1/stats`, {
        method: "GET",
    });
}
