/**
 * Shared test helper (extracted per AGENT-LOOP.md §18.14 D-T1.6 — waitFor appears in 4+ split test files).
 */
export const waitFor = async (fn, timeoutMs = 5000) => {
  const t0 = Date.now()
  while (!fn()) {
    if (Date.now() - t0 > timeoutMs) throw new Error("waitFor timeout")
    await new Promise((r) => setTimeout(r, 10))
  }
}
