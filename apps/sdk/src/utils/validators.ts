import { GTenValidationError } from "./errors";

/**
 * Validates that a string parameter is not null, undefined, or empty.
 * @internal
 */
export function validateRequiredString(value: any, fieldName: string): string {
    if (value === null || value === undefined || String(value).trim() === "") {
        throw new GTenValidationError(fieldName, "This field is required and cannot be empty.");
    }
    return String(value).trim();
}

/**
 * Validates that a number parameter is a positive integer.
 * @internal
 */
export function validatePositiveInteger(value: any, fieldName: string): number {
    const num = Number(value);
    if (isNaN(num) || !Number.isInteger(num) || num <= 0) {
        throw new GTenValidationError(fieldName, "Must be a positive integer.");
    }
    return num;
}
