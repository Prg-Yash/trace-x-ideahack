/**
 * G-TEN SDK — Error Classes
 *
 * Provides clean, typed error classes for SDK consumers.
 * These are exported from the public SDK interface.
 */

/**
 * Thrown when a protected SDK function is called before `authenticate()`.
 */
export class GTenAuthError extends Error {
    constructor(message: string = "SDK is not authenticated. Call authenticate() before using protected APIs.") {
        super(message);
        this.name = "GTenAuthError";
    }
}

/**
 * Thrown when the G-TEN API returns a non-2xx response.
 */
export class GTenApiError extends Error {
    public readonly statusCode: number;
    public readonly detail: string;

    constructor(statusCode: number, detail: string) {
        super(`G-TEN API Error [${statusCode}]: ${detail}`);
        this.name = "GTenApiError";
        this.statusCode = statusCode;
        this.detail = detail;
    }
}

/**
 * Thrown when SDK input validation fails.
 */
export class GTenValidationError extends Error {
    constructor(field: string, message: string) {
        super(`Validation error on "${field}": ${message}`);
        this.name = "GTenValidationError";
    }
}

/**
 * Thrown when a network-level error occurs (DNS failure, timeout, connection refused, etc.).
 */
export class GTenNetworkError extends Error {
    public readonly cause: Error | undefined;

    constructor(message: string = "A network error occurred while connecting to the G-TEN API.", cause?: Error) {
        super(message);
        this.name = "GTenNetworkError";
        this.cause = cause;
    }
}
