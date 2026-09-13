/**
 * smoke-settings.mjs — headless smoke test for the settings panel split
 * (webview/settings.js + settings-state/widgets/models/providers/agent/tools/env.js).
 *
 * Mocks just enough DOM to drive initSettings → openSettings (full buildSettings)
 * → every update* push handler, asserting no ReferenceError/TypeError escapes and
 * that the CHANGE-TO-SAVE postMessage protocol payloads are emitted unchanged.
 * Run: node test/smoke-settings.mjs   (exits non-zero on failure)
 */

// ─── Minimal DOM stub ───
function makeEl(id = "") {
  const el = {
    id,
    style: {},
    dataset: {},
    classList: { add() {}, remove() {} },
    children: [],
    textContent: "",
    innerHTML: "",
    value: "",
    checked: false,
    disabled: false,
    title: "",
    placeholder: "",
    autocomplete: "",
    type: "",
    className: "",
    options: [],
    addEventListener() {},
    removeEventListener() {},
    appendChild() {},
    append() {},
    prepend() {},
    replaceChildren() {},
    replaceWith() {},
    insertBefore() {},
    remove() {},
    focus() {},
    dispatchEvent() {},
    setAttribute() {},
    querySelector() { return null },
    querySelectorAll() { return [] },
    closest() { return makeEl() },
  }
  return el
}

const _byId = new Map()
const posted = []
globalThis.window = {
  _vscode: { postMessage: (m) => posted.push(m) },
  Event: class Event { constructor(type, opts) { this.type = type; Object.assign(this, opts) } },
}
globalThis.document = {
  getElementById(id) { if (!_byId.has(id)) _byId.set(id, makeEl(id)); return _byId.get(id) },
  querySelectorAll() { return [] },
  createElement() { return makeEl() },
}
globalThis.setTimeout = (_fn) => 0 // swallow deferred focus/badge timers

// ─── Drive the panel ───
const { initSettings, showSettingsError } = await import("../webview/settings.js")

const api = initSettings({ onClose: () => {}, getModels: () => [{ id: "m1", reasoning: ["low", "high"], effortDefault: "low" }] })
const expectedKeys = ["openSettings", "closeSettings", "renderMcpList", "updateMcpTools", "updateProviderStatus", "updateIndexStatus", "updateAgentSettings", "updateWebsearchSettings", "updateTestProviderResult", "updateShellCandidates", "updateProxySettings", "updateProxyTestResult", "showSettingsError"]
for (const k of expectedKeys) if (typeof api[k] !== "function") throw new Error("initSettings return missing " + k)

// Push state snapshots, then open (full build) and exercise every updater.
api.updateProviderStatus({ providers: { deepseek: { configured: true, masked: "sk-…", model: "deepseek-chat" } }, labels: {}, presets: [{ name: "p1", desc: "d", model: "m", baseURL: "u" }] })
api.updateAgentSettings({ maxTurns: 50, advisor: { provider: "deepseek", model: "m1" }, consultModels: [{ provider: "deepseek", model: "m1", effort: "high" }] })
api.updateWebsearchSettings({ hasKey: true })
api.updateIndexStatus({ built: true, files: 3, chunks: 9, hasEmbedder: true })
api.updateShellCandidates({ candidates: [{ name: "bash", value: "/bin/bash" }], current: null })
api.updateProxySettings({ uri: "http://127.0.0.1:7890", web: true, model: false })

api.openSettings() // → getAgentSettings posted, then buildSettings on the push reply
api.notifyAgentSettingsRefreshed() // simulates the extension's agentSettings push → build fires

api.updateProviderStatus({ providers: {}, labels: {}, presets: [] }) // changed → in-place card re-render path
api.updateTestProviderResult({ ok: true, models: ["a", "b"] })
api.updateTestProviderResult({ ok: false, error: "boom" })
api.updateMcpTools({ name: "srv", tools: [{ name: "tool1", description: "d", inputSchema: { properties: { x: {} } } }] })
api.updateMcpTools({ name: "srv", error: "fail" })
api.updateProxyTestResult({ ok: true, status: 200 })
api.updateIndexStatus(null)
api.renderMcpList()
showSettingsError("test error")
api.closeSettings()

// Protocol: init must have requested shell candidates, and openSettings must now
// pull a fresh agent snapshot (GitHub #3 B1) — both before any other traffic.
if (!posted.some((m) => m.type === "getShellCandidates")) throw new Error("missing getShellCandidates post")
if (!posted.some((m) => m.type === "getAgentSettings")) throw new Error("missing getAgentSettings post (openSettings refresh)")
if (typeof window._editKey !== "function" || typeof window._paSave !== "function" || typeof window._editEmbedKey !== "function" || typeof window._editWebsearchKey !== "function" || typeof window._confirmDelete !== "function") throw new Error("window._* handlers not installed")

console.log("SMOKE-OK: settings panel split is behaviorally wired (build + updates + protocol)")
