import { FraudApi } from "../generated/src/apis/FraudApi";
import { getAuthenticatedConfig } from "../auth/interceptor";
import { validateRequiredString } from "../utils/validators";

/**
 * Fetch pre-generated fraud alerts from the G-TEN platform.
 *
 * @param limit Optional maximum number of alerts to fetch (default: 200)
 * @param branchCode Optional branch code to filter alerts by
 */
export async function getAlerts(limit?: number, branchCode?: string): Promise<any> {
    const config = getAuthenticatedConfig();
    const api = new FraudApi(config);
    return await api.getAlertsQuickApiV1AlertsQuickGet({
        limit,
        branchCode,
    });
}

/**
 * Get detailed information for a specific alert.
 *
 * @param alertId The unique identifier of the alert
 */
export async function getAlertDetails(alertId: string): Promise<any> {
    const validAlertId = validateRequiredString(alertId, "alertId");
    const config = getAuthenticatedConfig();
    const api = new FraudApi(config);
    return await api.getAlertDetailsApiV1AlertsAlertIdGet({
        alertId: validAlertId,
    });
}

/**
 * Update the investigation status of a specific alert.
 *
 * @param alertId The unique identifier of the alert
 * @param status The new status (e.g., "investigating", "under_review", "closed")
 */
export async function updateAlertStatus(alertId: string, status: string): Promise<any> {
    const validAlertId = validateRequiredString(alertId, "alertId");
    const validStatus = validateRequiredString(status, "status");
    const config = getAuthenticatedConfig();
    const api = new FraudApi(config);
    return await api.updateAlertStatusApiV1AlertsAlertIdStatusPatch({
        alertId: validAlertId,
        alertStatusUpdate: { status: validStatus },
    });
}

/**
 * Get the live transaction alert feed.
 *
 * @param limit Optional maximum number of items to fetch (default: 30)
 */
export async function getLiveFeed(limit?: number): Promise<any> {
    const config = getAuthenticatedConfig();
    const api = new FraudApi(config);
    return await api.getLiveFeedApiV1FeedGet({
        limit,
    });
}
