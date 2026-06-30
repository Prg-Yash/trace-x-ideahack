/**
 * G-TEN SDK — Authentication
 *
 * Provides the one-time `authenticate()` function.
 * After calling this, all subsequent SDK calls are automatically authenticated.
 * This module is the ONLY auth surface exported from the SDK.
 */

import { AuthApi } from "../generated/src/apis/AuthApi";
import { Configuration } from "../generated/src/runtime";
import { setToken, setBaseUrl, clearToken, getBaseUrl } from "./tokenStore";
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
 * await authenticate({ username: "admin", password: "password" });
 * ```
 */
export async function authenticate(credentials: AuthCredentials): Promise<AuthResult> {
    if (credentials.baseUrl) {
        setBaseUrl(credentials.baseUrl);
    }

    const config = new Configuration({ basePath: getBaseUrl() });
    const authApi = new AuthApi(config);

    const response = await authApi.loginForAccessTokenApiV1AuthLoginPost({
        username: credentials.username,
        password: credentials.password,
    });

    // Store the token internally — the caller never sees or manages it
    setToken(response.accessToken);

    return {
        username: (response.user as Record<string, string>)?.["username"] ?? credentials.username,
        role: (response.user as Record<string, string>)?.["role"] ?? "unknown",
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
