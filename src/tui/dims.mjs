/**
 * dims.mjs — terminal dimension single source (2026-08-30).
 *
 * Windows ConPTY bug (user report: streaming output crammed into a left-hand
 * sliver on a 2K screen, restored to full width after mouse interaction):
 * process.stdout.columns/rows are UNSTABLE — GetConsoleScreenBufferInfo lags
 * behind the real window (ConPTY async update). Reads return falsy at startup
 * (the old ||80 fallback cramped the whole session) and flip between stale
 * and fresh values across calls.
 *
 * Rule: sample-and-hold with ASYMMETRIC acceptance (2026-08-30 consult).
 * Every consumer reads the CACHED dims here, NEVER process.stdout.columns
 * directly. Sampling happens only in event hooks (startup, delayed resample,
 * resize, agent-turn finally, idle watchdog) — never in the render path.
 *
 * Asymmetric acceptance: the failure mode is one-directional — ConPTY reports
 * a value SMALLER than reality (stale small buffer), never larger. So:
 *   - a LARGER sample is accepted immediately (real grow / recovery),
 *   - a SMALLER sample needs two consecutive confirmations before it is
 *     committed (real shrink), which absorbs the stale-shrink race.
 */
function defaultSample() {
  return {
    cols: Number(process.stdout.columns),
    rows: Number(process.stdout.rows),
  }
}

export function makeDimsState(initial = {}, sampleFn = defaultSample, onChange = null) {
  let dims = {
    cols: Number(initial.cols) || 80,
    rows: Number(initial.rows) || 24,
  }
  let sawValid = false
  // Pending shrink confirmation: first sighting of a smaller sample parks it
  // here; a second consecutive identical sighting commits it.
  let pendingShrink = null

  return {
    /** Cached dims (what every render path must use). */
    get: () => dims,
    /** True once a real terminal size has been observed (diagnostics / startup retry). */
    get sawValid() { return sawValid },
    /** Sample (event hooks only). See asymmetric-acceptance note above. */
    refresh: () => {
      const s = sampleFn()
      const c = Number(s.cols)
      const r = Number(s.rows)
      if (!(c >= 40 && r >= 10)) return dims // falsy/stale-unusable → keep last good
      sawValid = true
      if (c > dims.cols || r > dims.rows) {
        // Growth (incl. recovery from a stale-small cache): accept immediately.
        dims = { cols: c, rows: r }
        pendingShrink = null
        onChange?.(dims)
        return dims
      }
      if (c < dims.cols || r < dims.rows) {
        // Shrink: needs two consecutive identical sightings (ConPTY reports a
        // stale-small buffer during output activity; one sighting proves nothing).
        if (pendingShrink && pendingShrink.cols === c && pendingShrink.rows === r) {
          dims = { cols: c, rows: r }
          pendingShrink = null
          onChange?.(dims)
        } else {
          pendingShrink = { cols: c, rows: r }
        }
        return dims
      }
      pendingShrink = null
      return dims
    },
  }
}
