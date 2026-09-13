/**
 * Shared test helper (extracted per AGENT-LOOP.md §18.14 D-T1.6 — LONG_REPORT appears in 3+ test files).
 */
export const LONG_REPORT = (tag) => `${tag} report ` + "x".repeat(220) // > MIN_REPORT_CHARS
