/**
 * G-TEN SDK — Request Interceptor
 *
 * Injects the Bearer token into every authenticated request.
 * This module is PRIVATE and never exported from the public SDK interface.
 */

import { getToken, getBaseUrl } from "./tokenStore";
import { GTenAuthError, GTenApiError, GTenNetworkError } from "../utils/errors";

// Use global fetch (available in modern Node.js 18+ and all browsers)
const _fetch: typeof globalThis.fetch = typeof globalThis !== "undefined" && globalThis.fetch
    ? globalThis.fetch.bind(globalThis)
    : (undefined as any);

/**
 * An internal fetch wrapper that automatically appends the Bearer token
 * and handles common HTTP errors with developer-friendly messages.
 *
 * @internal
 */
export async function sdkFetch<T = any>(endpoint: string, options: any = {}): Promise<T> {
    const token = getToken();
    if (!token && !options.public) {
        throw new GTenAuthError("SDK is not authenticated. Call sdk.authenticate() before using protected APIs.");
    }

    if (!_fetch) {
        throw new GTenNetworkError(
            "No fetch implementation found. Ensure you are running in a modern browser or Node.js 18+.",
        );
    }

    const baseUrl = getBaseUrl();
    const url = `${baseUrl}${endpoint}`;

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...options.headers,
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    // Extract only the standard fetch options (method, headers, body) to avoid
    // passing custom properties like `public` to the fetch API
    const fetchOptions: RequestInit = {
        method: options.method || "GET",
        headers,
    };
    if (options.body) {
        fetchOptions.body = options.body;
    }

    let response: Response;
    try {
        response = await _fetch(url, fetchOptions);
    } catch (err: any) {
        // Network-level failures: DNS, connection refused, timeout, etc.
        throw new GTenNetworkError(
            `Failed to connect to G-TEN API at ${baseUrl}. Please check your network connection and baseUrl configuration.`,
            err,
        );
    }

    if (!response.ok) {
        let errorDetail: string;
        try {
            const errorData = await response.json();
            errorDetail = typeof errorData === "object" && errorData.detail
                ? String(errorData.detail)
                : JSON.stringify(errorData);
        } catch {
            errorDetail = await response.text();
        }

        // Map common status codes to friendlier messages
        if (response.status === 401) {
            throw new GTenAuthError(`Authentication failed: ${errorDetail}`);
        }

        throw new GTenApiError(response.status, errorDetail);
    }

    return await response.json() as T;
}
