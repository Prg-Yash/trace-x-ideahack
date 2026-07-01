/**
 * G-TEN SDK — Authentication
 *
 * Provides the one-time `authenticate()` function.
 * After calling this, all subsequent SDK calls are automatically authenticated.
 * This module is the ONLY auth surface exported from the SDK.
 */

import { setToken, setBaseUrl, clearToken, getBaseUrl } from "./tokenStore";
import { sdkFetch } from "./interceptor";
import { AuthCredentials, AuthResult } from "../types";

/**
 * Authenticates the SDK against the G-TEN platform.
 *
 * Call this once before using any protected SDK function.
 * The access token is stored internally and automatically attached
 * to all subsequent requests — you never need to manage it manually.
 *
 * @example
 * ```ts
 * await authenticate({ apiKey: "key", clientId: "id" });
 * ```
 */
export async function authenticate(credentials: { apiKey: string, clientId: string, baseUrl?: string }): Promise<AuthResult> {
    if (credentials.baseUrl) {
        setBaseUrl(credentials.baseUrl);
    }

    const response = await sdkFetch<{ access_token: string }>("/sdk/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({
            apiKey: credentials.apiKey,
            clientId: credentials.clientId
        }),
        public: true // Do not require existing token
    });

    // Store the token internally — the caller never sees or manages it
    setToken(response.access_token);

    return {
        username: credentials.clientId,
        role: "sdk_client",
        authenticated: true,
    };
}

/**
 * Signs out and clears the stored access token.
 * After calling this, protected API calls will throw an auth error.
 */
export function signOut(): void {
    clearToken();
}
