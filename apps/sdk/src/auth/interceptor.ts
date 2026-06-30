/**
 * G-TEN SDK — Request Interceptor
 *
 * Injects the Bearer token into every authenticated request.
 * This module is PRIVATE and never exported from the public SDK interface.
 */

import { getToken, getBaseUrl } from "./tokenStore";
import { GTenAuthError } from "../utils/errors";
import { Configuration } from "../generated/src/runtime";

/**
 * Returns a configured `Configuration` object with the Bearer token injected.
 * Throws if the SDK has not been authenticated yet.
 * @internal
 */
export function getAuthenticatedConfig(): Configuration {
    const token = getToken();
    if (!token) {
        throw new GTenAuthError(
            "SDK is not authenticated. Call authenticate() before using protected APIs."
        );
    }

    const baseUrl = getBaseUrl();

    return new Configuration({
        basePath: baseUrl,
        accessToken: async () => `Bearer ${token}`,
    });
}

/**
 * Returns a Configuration object without authentication (for public endpoints).
 * @internal
 */
export function getPublicConfig(): Configuration {
    return new Configuration({
        basePath: getBaseUrl(),
    });
}
