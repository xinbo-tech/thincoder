/**
 * dims.mjs — terminal dimension single source (2026-08-30).
 *
 * Windows ConPTY bug (user report: streaming output crammed into a left-hand
 * sliver on a 2K screen, restored to full width after mouse interaction):
 * process.stdout.columns/rows are UNSTABLE — GetConsoleScreenBufferInfo lags
 * behind the real window (ConPTY async update). Reads return falsy at startup
 * (the old ||80 fallback cramped the whole session) and flip between stale
 * and fresh values across calls (mouse layout reads saw 100/280 while the
 * render loop saw 80 — width jumping mid-session).
 *
 * Rule: sample-and-hold. Every consumer reads the CACHED dims here, NEVER
 * process.stdout.columns directly. A sane sample (cols ≥ 40) replaces the
 * cache; a falsy sample keeps the last good value — the initial ||80 fallback
 * only applies before the first sane sample arrives (typically the first
 * render frame, which refreshes immediately).
 */
export function makeDimsState(initial = {}) {
  let dims = {
    cols: Number(initial.cols) || 80,
    rows: Number(initial.rows) || 24,
  }
  let sawValid = false

  return {
    /** Cached dims (what every render path must use). */
    get: () => dims,
    /** Sample the terminal; keep the last good value on falsy/stale reads. */
    refresh: () => {
      const c = Number(process.stdout.columns)
      const r = Number(process.stdout.rows)
      if (c >= 40 && r >= 10) {
        dims = { cols: c, rows: r }
        sawValid = true
      }
      return dims
    },
    /** True once a real terminal size has been observed (diagnostics). */
    get sawValid() { return sawValid },
  }
}
