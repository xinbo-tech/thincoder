/**
 * dims.mjs — terminal dimension single source (2026-08-30; simplified 2026-08-31).
 *
 * One dimension source for every render/interaction path. Consumers read the
 * CACHED dims via get() — never process.stdout.columns/rows directly.
 * Sampling happens in event hooks only (startup seed, resize) — never in the
 * render path (guard test enforces this).
 *
 * Terminal semantics (2026-08-31 simplification): the earlier ConPTY unstable-
 * size hypothesis (sample-and-hold, asymmetric acceptance, double-confirm
 * shrink with settle windows, idle watchdog) was built on a misdiagnosis —
 * the real 2026-08-30 narrow-streaming bug was missing `cols` args at
 * fold-block call sites (component default 80), and a resize event is a
 * genuine dimension change on any terminal. The double-confirm rule even
 * broke window drag-to-shrink (a drag ends with ONE final resize event).
 * Remaining defense kept: sane-gate (cols>=40, rows>=10) drops falsy/unusable
 * reads (headless / no TTY), and any sane sample — larger OR smaller — is
 * accepted immediately. A later real resize corrects the cache naturally.
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
  return {
    /** Cached dims (what every render path must use). */
    get: () => dims,
    /** Sample (event hooks only: startup seed, resize). Falsy/unusable → keep last good. */
    refresh: () => {
      const s = sampleFn()
      const c = Number(s.cols)
      const r = Number(s.rows)
      if (!(c >= 40 && r >= 10)) return dims // falsy/stale-unusable → keep last good
      if (c === dims.cols && r === dims.rows) return dims
      dims = { cols: c, rows: r }
      onChange?.(dims)
      return dims
    },
  }
}