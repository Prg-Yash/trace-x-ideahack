// ──────────────────────────────────────────────────────────────────────────────
// G-TEN SDK — Public API
// ──────────────────────────────────────────────────────────────────────────────

// The recommended entry point — class-based SDK client
export { GTenSDK } from "./client";

// Standalone functional APIs (for backward compatibility)
export { authenticate, signOut } from "./auth/authenticate";

// Wrapper functions (can be used standalone after calling authenticate())
export * from "./wrappers/alerts";
export * from "./wrappers/fraud";
export * from "./wrappers/analytics";
export * from "./wrappers/copilot";

// Error classes
export {
    GTenAuthError,
    GTenApiError,
    GTenValidationError,
    GTenNetworkError,
} from "./utils/errors";

// Type definitions
export * from "./types";
