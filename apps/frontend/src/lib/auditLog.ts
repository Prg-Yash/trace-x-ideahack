export type AlertStatus = "NEW" | "UNDER_INVESTIGATION" | "PENDING_APPROVAL" | "FILED";

export interface AuditEntry {
  action: string;
  actor: string;
  timestamp: string;
}

export interface LocalAlertState {
  assignedTo: string | null;
  status: AlertStatus;
  auditLog: AuditEntry[];
}

// In-memory store
const alertStateStore = new Map<string, LocalAlertState>();

// We need a simple event target to trigger re-renders in components when the store changes.
const storeEvents = new EventTarget();

export const getAlertState = (alertId: string): LocalAlertState => {
  if (!alertStateStore.has(alertId)) {
    alertStateStore.set(alertId, {
      assignedTo: null,
      status: "NEW",
      auditLog: []
    });
  }
  return alertStateStore.get(alertId)!;
};

export const assignAlert = (alertId: string, actor: string, assignedTo: string) => {
  const state = getAlertState(alertId);
  state.assignedTo = assignedTo;
  state.status = "UNDER_INVESTIGATION";
  state.auditLog.push({
    action: `Assigned to ${assignedTo}`,
    actor,
    timestamp: new Date().toISOString()
  });
  storeEvents.dispatchEvent(new CustomEvent("change", { detail: { alertId } }));
};

export const draftSTR = (alertId: string, actor: string) => {
  const state = getAlertState(alertId);
  state.status = "PENDING_APPROVAL";
  state.auditLog.push({
    action: `STR Drafted - Pending Principal Officer Sign-off`,
    actor,
    timestamp: new Date().toISOString()
  });
  storeEvents.dispatchEvent(new CustomEvent("change", { detail: { alertId } }));
};

export const subscribeToAlert = (alertId: string, callback: () => void) => {
  const handler = (e: Event) => {
    const customEvent = e as CustomEvent;
    if (customEvent.detail?.alertId === alertId) {
      callback();
    }
  };
  storeEvents.addEventListener("change", handler);
  return () => storeEvents.removeEventListener("change", handler);
};

export const subscribeToAll = (callback: () => void) => {
  const handler = () => callback();
  storeEvents.addEventListener("change", handler);
  return () => storeEvents.removeEventListener("change", handler);
};
