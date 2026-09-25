/**
 * Shared test helper (extracted — LONG_REPORT appears in 3+ test files).
 */
export const LONG_REPORT = (tag) => `${tag} report ` + "x".repeat(220) // > MIN_REPORT_CHARS
