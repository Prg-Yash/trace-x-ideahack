/**
 * PII Data Masking Utility
 * Ensures sensitive customer identifiers (Account Numbers, PAN, Aadhaar, Names)
 * are properly masked in display views while preserving raw IDs for API requests and Graph Analytics.
 */

export function maskAccountNumber(accId: string | undefined | null): string {
  if (!accId) return "XXXX-XXXX-0000";
  const clean = String(accId).trim();
  if (clean.startsWith("XXXX-XXXX-")) return clean;
  if (clean.length <= 4) return `XXXX-XXXX-${clean}`;
  return `XXXX-XXXX-${clean.slice(-4)}`;
}

export function maskCustomerName(name: string | undefined | null): string {
  if (!name) return "Anonymous Customer";
  const clean = String(name).trim().replace(/\s*\(\d+\)$/, "");
  if (!clean) return "Anonymous Customer";
  
  // If already masked or initials, keep or ensure format
  const parts = clean.split(/\s+/);
  if (parts.length === 1) {
    if (parts[0].length <= 2) return parts[0] + "*";
    return parts[0][0] + "*".repeat(Math.min(6, parts[0].length - 1));
  }
  // Industry Standard: First Name + Last Initial masked
  const first = parts[0];
  const maskedFirst = first.length <= 2 ? first[0] + "*" : first[0] + "*".repeat(Math.min(6, first.length - 1));
  const initials = parts.slice(1).map(p => p[0].toUpperCase() + ".");
  return `${maskedFirst} ${initials.join(" ")}`;
}

export function maskPAN(pan: string | undefined | null): string {
  if (!pan) return "A*****506F";
  const clean = String(pan).trim();
  if (clean.length <= 4) return "******" + clean;
  return clean[0] + "*".repeat(Math.max(4, clean.length - 4)) + clean.slice(-3);
}
