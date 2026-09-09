/**
 * settings.mjs — provider settings and key management
 * Backed by the shared ~/.thincoder/config.json (see src/config-io.mjs).
 * MCP server config stays in VS Code settings (extension-local concern).
 */

import {
  PRESETS, providerNames, isProviderConfigured, storeProviderKey, removeProviderKey,
  buildProvider, providerLabel, readProviders,
} from "./presets.mjs"
import {
  persistRaw, resolveProviders, loadMcpServers, addMcpServer, updateMcpServer, removeMcpServer,
  loadAgentSettings, loadRaw, normalizeProxy,
} from "../config-io.mjs"
import { addProviderEntry, removeProviderEntry } from "./provider-flows.mjs"
import { mcpConnectedNames } from "../mcp.mjs"
import { listModels } from "../provider.mjs"
import { specForModel } from "../specs.mjs"
import { loadModelPrefs, loadSlot } from "./session-io.mjs"

/**
 * Status snapshot for the settings panel. Shape consumed by webview/settings.js:
 * { providers: { name: { configured, masked, baseURL, model, isActive } }, custom, labels,
 *   presets: [{ name, desc, model }] (not yet added), activeProvider }.
 * Providers are dynamic (config.json providers[]), so labels travel with the payload.
 */
export function providerStatus() {
  const providers = readProviders()
  let activeProvider = ""
  try { ({ activeProvider } = resolveProviders()) } catch { /* config unreadable */ }
  const status = {}
  const labels = {}
  for (const name of providerNames()) {
    const configured = isProviderConfigured(name)
    const entry = providers[name] || {}
    status[name] = {
      configured, masked: configured ? "****" : "",
      baseURL: entry.baseURL, model: entry.model,
      isActive: name === activeProvider,
      proxy: entry.proxy === true, // per-provider proxy flag (row checkbox, preset/custom agnostic)
    }
    labels[name] = providerLabel(name)
  }
  // Presets not yet added — the panel's [+ Add] form offers these (CLI addProviderFlow parity)
  const existing = new Set(providerNames())
  const presets = Object.entries(PRESETS)
    .filter(([name]) => !existing.has(name))
    .map(([name, p]) => ({ name, desc: p.desc, model: p.model, baseURL: p.baseURL }))
  const custom = providers.custom && typeof providers.custom === "object" && !Array.isArray(providers.custom)
    ? { baseURL: providers.custom.baseURL || "", model: providers.custom.model || "", hasKey: isProviderConfigured("custom") }
    : null
  return { providers: status, custom, labels, presets, activeProvider }
}

// ─── Panel message handlers (pure persistence, error string or null) ───

export function handleAddProvider(payload) { return addProviderEntry(payload) }
export function handleRemoveProvider(name) { return removeProviderEntry(name) }

/** Set/clear a provider's per-provider proxy flag (false → delete the field, CLI injectProxy parity). */
export function handleSetProviderProxy(name, proxy) {
  persistRaw((raw) => {
    const entry = Array.isArray(raw.providers) ? raw.providers.find((p) => p?.name === name) : null
    if (!entry) return
    if (proxy === true) entry.proxy = true
    else delete entry.proxy
  })
  return null
}

/** Agent/Advisor settings snapshot for the panel (from shared config.json).
 *  `session` ({ cwd, slot }, optional): engineering + advisor.guard are SESSION-level
 *  (2026-08-29 refactor — slot authority, config.json is the CLI mirror). When given, the
 *  session slot's values override the config snapshot so the ENG/GUARD buttons show the
 *  live session state, not the global one; without it (no panel bound yet) config is shown. */
export function agentSettings(session) {
  const s = loadAgentSettings()
  // Slot read failure must not break the settings push — fall back to config.
  let slotData = null
  try { slotData = session ? loadSlot(session.cwd, session.slot) : null } catch { /* unreadable slot */ }
  return {
    maxTurns: s.maxTurns,
    subagentTurns: s.subagentTurns,
    subagentModel: s.subagentModel,
    subagentModels: s.subagentModels,
    compactThreshold: s.compactThreshold, // null = auto
    verifyGuard: s.verifyGuard,
    engineering: slotData?.engineering ?? s.engineering,
    consultTurns: s.consultTurns,
    consultTimeoutMs: s.consultTimeoutMs,
    // Guard chain: slot value when the session ever set it (explicit false ≠ unset — an
    // explicit session OFF must not fall through to a config ON, see eng-session.test.mjs),
    // then the config flag coerced to boolean.
    advisor: { ...(s.advisor ?? {}), guard: slotData?.advisor?.guard ?? (s.advisor?.guard === true) },
    consultModels: s.consultModels ?? [],
    poolLimits: s.poolLimits ?? { engCoder: 4, other: 4, advisor: 4 }, // §11.1/§11.2: async pool per-role-domain limits + advisor 评审池（面板并发池三域项——回退显 4/4/4）
    // Spec-derived effort enums — offline, always available; the webview's model list
    // (network probe) may not have arrived when the panel opens, and the effort dropdown
    // must not depend on that timing.
    effortEnums: Object.fromEntries(
      [...(s.consultModels ?? []).map((m) => m.model), s.advisor?.model]
        .filter(Boolean)
        .map((id) => [id, specForModel(id).reasoningEffortEnum || null])
        .filter(([, v]) => v)
    ),
  }
}

// Panel persistence + shell candidates live in config-io.mjs (pure Node, testable
// outside the extension host) — re-exported here to keep the panel import surface.
export { saveAgentSettingsFromPanel, saveShellSettingsFromPanel, shellCandidates } from "../config-io.mjs"

/** Proxy settings snapshot for the panel (normalized { uri, web, model } | null). */
export function proxySettings() {
  const raw = loadRaw()
  return normalizeProxy(raw.proxy) ?? null
}

/** Web search (Tavily) snapshot for the panel: { provider, hasKey }. */
export function websearchSettings() {
  const ws = loadRaw().websearch ?? {}
  return { provider: ws.provider ?? "tavily", hasKey: !!ws.apiKey }
}

/** Persist the Tavily web-search API key (empty → clear). */
export function saveWebsearchKeyFromPanel(key) {
  persistRaw((raw) => {
    const ws = raw.websearch ?? {}
    ws.provider = "tavily"
    ws.apiKey = key?.trim() || ""
    if (!ws.apiKey) delete ws.apiKey
    raw.websearch = ws
  })
}

/** Remove the Tavily web-search API key. */
export function deleteWebsearchKeyFromPanel() {
  persistRaw((raw) => {
    const ws = raw.websearch ?? {}
    delete ws.apiKey
    raw.websearch = ws
  })
}

/**
 * Probe a provider's connection by listing its /models. Used by the Add-Provider
 * form: validates baseURL+key AND returns the model list so a custom provider's
 * model can be PICKED (not hand-typed). Returns { ok, models } or { ok:false, error }.
 */
export async function testProviderConnection({ baseURL, apiKey }) {
  const url = (baseURL || "").trim().replace(/\/+$/, "")
  if (!url) return { ok: false, error: "baseURL is required" }
  if (!/^https?:\/\//.test(url)) return { ok: false, error: "baseURL must start with http:// or https://" }
  // Route through the configured web proxy (same as websearch/fetch).
  const px = normalizeProxy(loadRaw().proxy)
  const proxyUri = px && px.web !== false ? px.uri : null
  try {
    const models = await listModels({ baseURL: url, apiKey: apiKey || "", model: "", proxyUri })
    return { ok: true, models }
  } catch (e) {
    return { ok: false, error: e.message || String(e) }
  }
}

/** Persist proxy settings from the panel. payload: { uri?, web?, model? } (uri '' = clear). */
export function saveProxySettingsFromPanel(payload) {
  persistRaw((raw) => {
    const current = normalizeProxy(raw.proxy) ?? { uri: "", web: true, model: false }
    const uri = payload.uri !== undefined ? payload.uri.trim() : current.uri
    if (!uri) { delete raw.proxy; return }
    raw.proxy = {
      uri,
      web: payload.web !== undefined ? !!payload.web : current.web,
      model: payload.model !== undefined ? !!payload.model : current.model,
    }
  })
}

/** Test the proxy connection from the extension host (webview cannot run Node code).
 *  Returns { ok, status } or { ok: false, error }. */
export async function testProxyConnection(uri) {
  const { proxyFetch } = await import("../proxy.mjs")
  const proxyUri = (uri || "").trim() || null
  // Validate the URI format up front so an empty/blank field isn't tested, and a
  // malformed URI gets a clear message instead of "Invalid URL" from deep inside.
  if (proxyUri) {
    let parsed
    try { parsed = new URL(proxyUri) } catch {
      return { ok: false, error: `Invalid proxy URI: "${proxyUri}" — expected http://host:port` }
    }
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return { ok: false, error: `Unsupported proxy protocol: "${parsed.protocol}" — use http:// or https://` }
    }
  }
  try {
    const res = await Promise.race([
      proxyFetch("https://www.gstatic.com/generate_204", { headers: { "User-Agent": "ThinCoder" } }, proxyUri),
      new Promise((_, rej) => setTimeout(() => rej(new Error("timeout after 5s")), 5000)),
    ])
    return res.ok ? { ok: true, status: res.status } : { ok: false, status: res.status }
  } catch (e) {
    return { ok: false, error: e.message }
  }
}

/** Persist agent settings from the panel — implemented in config-io.mjs (pure Node, testable). */
export async function saveProviderKey(name, key) {
  // storeProviderKey performs the same !key || !key.trim() guard — delegate only.
  await storeProviderKey(name, key)
}

/** Save a custom provider entry (provider named "custom" in config.json). */
export async function saveCustomProvider({ key, baseURL, model }) {
  const url = (baseURL || "").trim().replace(/\/+$/, "")
  const mdl = (model || "").trim()
  const k = (key || "").trim() // trimmed FIRST — a whitespace-only key must not land as an empty apiKey
  persistRaw((raw) => {
    raw.providers = Array.isArray(raw.providers) ? raw.providers : []
    let entry = raw.providers.find((p) => p?.name === "custom")
    if (k) {
      if (!entry) { entry = { name: "custom" }; raw.providers.push(entry) }
      entry.apiKey = k
      if (url) entry.baseURL = url
      if (mdl) entry.model = mdl
    } else if ((url || mdl) && entry) {
      // No key but url/model given → update the existing entry in place (a
      // future per-field UI must not silently drop baseURL/model updates).
      if (url) entry.baseURL = url
      if (mdl) entry.model = mdl
    } else if (!url && !mdl && entry) {
      // All fields empty → user cleared everything: drop the entry
      raw.providers = raw.providers.filter((p) => p?.name !== "custom")
    }
  })
}

export async function deleteProviderKey(name) {
  await removeProviderKey(name)
  // A bare "custom" entry with no baseURL/model is useless — drop it entirely
  if (name === "custom") {
    persistRaw((raw) => {
      const entry = Array.isArray(raw.providers) ? raw.providers.find((p) => p?.name === "custom") : null
      if (entry && !entry.baseURL && !entry.model && !entry.apiKey) {
        raw.providers = raw.providers.filter((p) => p?.name !== "custom")
      }
    })
  }
}

export function getMcpServers() {
  return loadMcpServers()
}

/** Add an MCP server (duplicate → update). Returns error string or null.
 *  F5/MCP.md §4：面板 [Edit] 复用同一表单——已存在即原位更新（CLI /mcp edit parity，
 *  保持数组序 + token 字段落盘）。 */
export function saveMcpServer(name, config) {
  const err = addMcpServer(name, config)
  if (err === null) return null
  return updateMcpServer(name, config)
}

export function deleteMcpServer(name) {
  return removeMcpServer(name)
}

/** Connected-server names for status display (●/○ + tool counts). */
export function connectedMcpServers() {
  return mcpConnectedNames()
}

export function pushStatus(panel) {
  const s = providerStatus()
  const anyKey = Object.values(s.providers).some((p) => p.configured)
  panel?.webview.postMessage({ type: "providerStatus", keyOk: anyKey, status: s })
}

export async function fullStatus(panel, workspaceState, pushSessionsFn) {
  pushStatus(panel)
  const s = providerStatus()
  const anyKey = Object.values(s.providers).some((p) => p.configured)
  if (!anyKey) return

  const results = await Promise.allSettled(
    providerNames().filter((n) => s.providers[n]?.configured).map(async (name) => {
      const prov = await buildProvider(name)
      if (!prov) return { name, models: [] }
      try {
        const ids = await listModels(prov)
        const presetModel = PRESETS[name]?.model || prov.model
        const list = ids.length > 0 ? ids : [presetModel]
        return { name, models: list.map((id) => {
          const spec = specForModel(id)
          const r = spec.reasoningEffortEnum || (spec.thinking ? ["enabled"] : [])
          return { id, label: id, provider: name, group: providerLabel(name), reasoning: r, effortDefault: spec.reasoningEffortDefault || null }
        })}
      } catch {
        const m = PRESETS[name]?.model || prov.model
        const spec = specForModel(m)
        const r = spec.reasoningEffortEnum || (spec.thinking ? ["enabled"] : [])
        return { name, models: [{ id: m, label: m, provider: name, group: providerLabel(name), reasoning: r, effortDefault: spec.reasoningEffortDefault || null }] }
      }
    })
  )
  const allModels = results.flatMap((r) => r.status === "fulfilled" ? r.value.models : [])
  panel?.webview.postMessage({ type: "models", models: allModels, prefs: loadModelPrefs(workspaceState) })
  pushSessionsFn?.()
}
