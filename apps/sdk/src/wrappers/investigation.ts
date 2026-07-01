import { WorkflowApi } from "../generated/src/apis/WorkflowApi";
import { getAuthenticatedConfig } from "../auth/interceptor";
import { validateRequiredString } from "../utils/validators";

/**
 * Assigns an alert to a specific investigator.
 *
 * @param alertId The alert identifier
 * @param assigneeId The investigator's user ID, or null to unassign
 */
export async function assignAlert(alertId: string, assigneeId: string | null): Promise<any> {
    const validAlertId = validateRequiredString(alertId, "alertId");
    const config = getAuthenticatedConfig();
    const api = new WorkflowApi(config);
    return await api.assignAlertApiV1AlertsAlertIdAssignPost({
        alertId: validAlertId,
        assignRequest: { assigneeId },
    });
}

/**
 * Draft a Suspicious Transaction Report (STR) for a flagged alert.
 *
 * @param alertId The alert identifier
 */
export async function draftStr(alertId: string): Promise<any> {
    const validAlertId = validateRequiredString(alertId, "alertId");
    const config = getAuthenticatedConfig();
    const api = new WorkflowApi(config);
    return await api.draftStrApiV1AlertsAlertIdDraftStrPost({
        alertId: validAlertId,
    });
}

/**
 * Approve a drafted Suspicious Transaction Report (STR).
 *
 * @param alertId The alert identifier
 */
export async function approveStr(alertId: string): Promise<any> {
    const validAlertId = validateRequiredString(alertId, "alertId");
    const config = getAuthenticatedConfig();
    const api = new WorkflowApi(config);
    return await api.approveStrApiV1AlertsAlertIdApproveStrPost({
        alertId: validAlertId,
    });
}

/**
 * Reject a drafted Suspicious Transaction Report (STR).
 *
 * @param alertId The alert identifier
 */
export async function rejectStr(alertId: string): Promise<any> {
    const validAlertId = validateRequiredString(alertId, "alertId");
    const config = getAuthenticatedConfig();
    const api = new WorkflowApi(config);
    return await api.rejectStrApiV1AlertsAlertIdRejectStrPost({
        alertId: validAlertId,
    });
}

/**
 * Retrieve the audit trail history of an alert.
 *
 * @param alertId The alert identifier
 */
export async function getAuditTrail(alertId: string): Promise<any> {
    const validAlertId = validateRequiredString(alertId, "alertId");
    const config = getAuthenticatedConfig();
    const api = new WorkflowApi(config);
    return await api.getAuditTrailApiV1AlertsAlertIdAuditGet({
        alertId: validAlertId,
    });
}
