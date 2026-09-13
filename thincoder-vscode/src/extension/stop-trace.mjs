/**
 * stop-trace.mjs — observable Stop/abort tracing.
 *
 * When the user presses Stop, every hop of the abort propagation logs a timestamped
 * entry to the "ThinCoder Stop Trace" output channel (Output panel) and to the
 * console. Measures click→turn-ended latency and shows which hop holds the turn.
 *
 * Enable: "thincoder.stopTrace": true in settings (default off — zero overhead).
 * The core logger is vscode-free so the agent loop (tests included) can import it;
 * the extension host wires the output channel via initStopTrace().
 */
const listeners = new Set()

let sink = null // extension-host output channel (optional)
let enabled = false

/** Extension host: create the output channel + live setting toggle. */
export function initStopTrace(context, vscode) {
  const channel = vscode.window.createOutputChannel("ThinCoder Stop Trace")
  context.subscriptions.push(channel)
  sink = (line) => channel.appendLine(line)
  enabled = vscode.workspace.getConfiguration("thincoder").get("stopTrace") === true
  context.subscriptions.push(vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration("thincoder.stopTrace")) {
      enabled = vscode.workspace.getConfiguration("thincoder").get("stopTrace") === true
    }
  }))
}

/** Tests / programmatic: subscribe to trace lines. */
export function onTrace(fn) { listeners.add(fn); return () => listeners.delete(fn) }

/** Enable/disable directly (tests). */
export function setTraceEnabled(v) { enabled = v }

/** Log one trace hop. `t0` (optional) = the click timestamp; latency is computed. */
export function traceStop(event, t0) {
  if (!enabled) return
  const now = Date.now()
  const latency = t0 ? ` (+${now - t0}ms since click)` : ""
  const line = `[stop-trace ${new Date(now).toISOString()}] ${event}${latency}`
  sink?.(line)
  console.warn(line)
  for (const fn of listeners) { try { fn(line) } catch { /* listener errors never break tracing */ } }
}
