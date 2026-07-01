import { sdkFetch } from "../auth/interceptor";
import { validateRequiredString } from "../utils/validators";
import { AlertsResponse, Alert } from "../types";

/**
 * Retrieve a paginated list of active alerts from the system.
 *
 * @param limit Maximum number of alerts to return (default: 200)
 * @returns Paginated alerts response containing total count and alert array
 */
export async function getAlerts(limit: number = 200): Promise<AlertsResponse> {
    return await sdkFetch<AlertsResponse>(`/sdk/v1/alerts?limit=${limit}`, {
        method: "GET",
    });
}

/**
 * Alias for `getAlerts` with a more descriptive name.
 *
 * @param limit Maximum number of alerts to return (default: 200)
 * @returns Paginated alerts response
 */
export async function listAlerts(limit: number = 200): Promise<AlertsResponse> {
    return getAlerts(limit);
}

/**
 * Retrieve details for a specific alert by ID.
 *
 * @param alertId The alert identifier (e.g. "ALT-ACC001-LAYERING")
 * @returns Alert details including evidence and audit data
 */
export async function getAlert(alertId: string): Promise<Alert> {
    const validAlertId = validateRequiredString(alertId, "alertId");
    return await sdkFetch<Alert>(`/sdk/v1/alerts/${encodeURIComponent(validAlertId)}`, {
        method: "GET",
    });
}

/**
 * Create a custom alert (placeholder for future SDK backend extension).
 *
 * @param payload Alert creation details
 * @returns Created alert data
 */
export async function createAlert(payload: any): Promise<any> {
    return await sdkFetch(`/sdk/v1/alerts`, {
        method: "POST",
        body: JSON.stringify(payload),
    });
}
