/**
 * G-TEN SDK — Internal Token Store
 *
 * Holds the JWT access token in-memory for the current session.
 * This module is PRIVATE and never exported from the public SDK interface.
 * The token is never written to disk, localStorage, or any persistent medium.
 */

let _accessToken: string | null = null;
let _baseUrl: string = "http://localhost:8000";

/** @internal */
export function setToken(token: string): void {
    _accessToken = token;
}

/** @internal */
export function getToken(): string | null {
    return _accessToken;
}

/** @internal */
export function clearToken(): void {
    _accessToken = null;
}

/** @internal */
export function setBaseUrl(url: string): void {
    _baseUrl = url;
}

/** @internal */
export function getBaseUrl(): string {
    return _baseUrl;
}
