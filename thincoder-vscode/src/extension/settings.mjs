/**
 * settings.mjs — provider settings and key management
 * Backed by the shared ~/.thincoder/config.json（W16：读面 = 核 `config-io.mjs`/`config.mjs` 单源；
 * provider 访问层 = `./presets.mjs`）。
 * MCP server config stays in VS Code settings (extension-local concern).
 */

import {
  PRESETS, providerNames, isProviderConfigured, storeProviderKey, removeProviderKey,
  providerLabel, readProviders, sanitizeConsultModels, warnConsultModelsFiltered,
} from "./presets.mjs"
import { loadRaw, resolveProviders, addProviderEntry, removeProviderEntry } from "@thincoder/core/config-io.mjs"
import { DEFAULTS, normalizeProxy } from "@thincoder/core/config.mjs"
import { loadMcpServers, addMcpServer, updateMcpServer, removeMcpServer } from "../config-mcp.mjs"
import { vscPersistRaw, saveAgentSettingsFromPanel, saveShellSettingsFromPanel } from "./settings-panel-write.mjs"
import { probeProviderAdmission } from "./provider-flows.mjs"
import { listModels, admissionOf } from "@thincoder/core/provider/list-models.mjs"
import { specForModel } from "../specs.mjs"
import { loadModelPrefs, loadSlot } from "./session-io.mjs"
import { existsSync } from "node:fs"
import { execFile } from "node:child_process"
import { _probeWindow, _probeBatch, _retryFailed } from "./provider-probe-window.mjs"

/** Agent settings merged view（W16：自 config-io 迁入——本端面板/运行读面）。默认值 = 核
 *  `DEFAULTS.agent`（单一来源）；compactThreshold 保持本端**显示口径**：null = auto
 *  （面板空串清除键 → 读取侧 null → 消费方 auto 推断）。consultModels = F-4 清洗后合法池
 *  （悬挂条目不进面板/运行态——一次性警告）。 */
export function loadAgentSettings() {
  const raw = loadRaw()
  const a = raw.agent
  const d = DEFAULTS.agent
  const { keep, dropped } = sanitizeConsultModels(
    a?.consultModels,
    (Array.isArray(raw.providers) ? raw.providers : []).map((p) => p?.name).filter(Boolean))
  warnConsultModelsFiltered(dropped)
  return {
    maxTurns: a?.maxTurns ?? d.maxTurns,
    subagentTurns: a?.subagentTurns ?? d.subagentTurns,
    subagentModel: a?.subagentModel ?? d.subagentModel,
    subagentModels: a?.subagentModels ?? d.subagentModels,
    compactThreshold: a?.compactThreshold ?? null, // null = auto（本端面板显示口径）
    verifyGuard: a?.verifyGuard ?? d.verifyGuard,
    autoThink: a?.autoThink ?? d.autoThink,
    engineering: a?.engineering ?? d.engineering,
    consultTurns: a?.consultTurns ?? d.consultTurns,
    consultTimeoutMs: a?.consultTimeoutMs ?? d.consultTimeoutMs,
    advisor: a?.advisor ?? d.advisor,
    consultModels: keep, // F-4：过滤后合法池（未知渠道条目不进面板/运行态）
    poolLimits: a?.poolLimits ?? d.poolLimits,
  }
}

// ─── Shell candidates（W16 自 config-io 迁入——面板消费面）─────────────────────
// F-W18（`SETTINGS.md` §2.11）：探测面 = **异步非阻塞**——`execFile` + `Promise.all`（并发）；
// 进程内 memo 保留（成功结果缓存：本进程生命周期内 shell 路径不热变化——同前语义）+ 在飞去重
// （同一时刻重复请求**共享同一批**探测——不叠发子进程）。同步 `spawnSync` 探测会在打开拍占住
// 宿主事件循环（UI 假死同源）——本函数**绝不抛出**（探测失败 = 该候选缺席）。
let _shellCandidatesCache = null
let _shellCandidatesInFlight = null

// 测试缝（§2.11 ②「注入式时序断言」——`_setProbeImplForTest` 同族）：伪探测替掉真实 `execFile`
// 探测（同步阻塞面模拟）；注入即清 memo / 在飞态（免旧批结果串味）；复位 = null。
let _detectImpl = null
export function _setShellDetectForTest(fn) {
  _detectImpl = fn
  _shellCandidatesCache = null
  _shellCandidatesInFlight = null
}

/** 候选命令是否存在（异步探测：Windows `where` / POSIX `sh -c 'command -v'`；失败或超时 ⇒ false）。
 *  回调式 `execFile`（非阻塞）——`timeout` 到点由 execFile 杀进程后回调错误。 */
function commandExists(cmd) {
  return new Promise((resolve) => {
    if (_detectImpl) { resolve(_detectImpl(cmd)); return } // 注入的伪探测（可返回 Promise——异步面同形）
    const win = process.platform === "win32"
    try {
      // 'command -v' is a POSIX shell builtin; sh -c runs it (Windows uses `where`)
      execFile(win ? "where" : "sh", win ? [cmd] : ["-c", `command -v ${cmd}`], { timeout: 3000 }, (err, stdout) => {
        resolve(!err && String(stdout ?? "").trim().length > 0)
      })
    } catch { resolve(false) }
  })
}

/** Detect available shells for this platform ⇒ `Promise<候选[]>`（memo + 在飞去重）。
 *  Cached: shell availability does not change during a session — but the first probe must
 *  not block the host event loop（F-W18）。 */
export function shellCandidates() {
  if (_shellCandidatesCache !== null) return Promise.resolve(_shellCandidatesCache)
  if (_shellCandidatesInFlight) return _shellCandidatesInFlight // 在飞去重：同批共享
  const GIT_BASH_PATHS = [
    "C:\\Program Files\\Git\\bin\\bash.exe",
    "C:\\Program Files (x86)\\Git\\bin\\bash.exe",
    `${process.env.LOCALAPPDATA ?? ""}\\Programs\\Git\\bin\\bash.exe`,
  ]
  const candidates = []
  // System default always first
  candidates.push({ name: "System default", value: null, detect: () => true })
  if (process.platform === "win32") {
    candidates.push({ name: "PowerShell (pwsh)", value: "pwsh", detect: () => commandExists("pwsh") })
    candidates.push({ name: "Windows PowerShell (powershell)", value: "powershell", detect: () => commandExists("powershell") })
    const gb = GIT_BASH_PATHS.find((p) => existsSync(p))
    if (gb) candidates.push({ name: `Git Bash (${gb})`, value: gb, detect: () => true })
    candidates.push({ name: "WSL bash (wsl)", value: "wsl", detect: () => commandExists("wsl") })
  } else {
    for (const sh of ["bash", "zsh", "fish"]) {
      candidates.push({ name: sh, value: sh, detect: () => commandExists(sh) })
    }
  }
  const p = Promise.all(candidates.map(async (c) => ((await c.detect()) ? c : null)))
    .then((hits) => { _shellCandidatesCache = hits.filter(Boolean); return _shellCandidatesCache })
    .finally(() => { if (_shellCandidatesInFlight === p) _shellCandidatesInFlight = null })
  _shellCandidatesInFlight = p
  return p
}

/**
 * Status snapshot for the settings panel. Shape consumed by webview/settings.js:
 * { providers: { name: { configured, masked, baseURL, model, isActive, proxy,
 *                       available?, unavailableReason? } }, custom, labels,
 *   presets: [{ name, desc, model }] (not yet added), activeProvider }.
 * MODEL-SELECTION：每渠道行显**单值默认模型** `model`（候选清单字段已退场——候选面 =
 * 运行期 `/models` 拉取，见 fullStatus）；activeProvider = resolveProviders 的 defaultModel
 * 渠道/首渠道回退。`available:false` = M9 配置阶段探针判定该渠道不可用（unavailableReason
 * = 失败消息本体逐字长句；UI 行内标 `不可用`）。
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
    const admission = admissionOf(name)
    status[name] = {
      configured, masked: configured ? "****" : "",
      baseURL: entry.baseURL,
      model: typeof entry.model === "string" ? entry.model : "",
      isActive: name === activeProvider,
      proxy: entry.proxy === true, // per-provider proxy flag (row checkbox, preset/custom agnostic)
      ...(admission ? { available: admission.ok === true } : {}),
      // F-W19（`SETTINGS.md` §2.12 / `PROVIDER.md` §6.16 M8/M9 补）：失败分类随行下发——
      // `hostBusy` = 宿主忙证据（非渠道故障——展示面分档 `宿主繁忙`，不渲渠道故障 hint）；
      // `timeout` / `malformed` = 渠道故障（展示面 `不可用` + hint 逐字长句）。
      ...(admission && admission.ok === false ? { unavailableReason: admission.reason, failure: admission.failure } : {}),
    }
    labels[name] = providerLabel(name)
  }
  // Presets not yet added — the panel's [+ Add] form offers these (CLI addProviderFlow parity)
  const existing = new Set(providerNames())
  const presets = Object.entries(PRESETS)
    .filter(([name]) => !existing.has(name))
    .map(([name, p]) => ({ name, desc: p.desc, model: typeof p.model === "string" ? p.model : "", baseURL: p.baseURL }))
  const custom = providers.custom && typeof providers.custom === "object" && !Array.isArray(providers.custom)
    ? { baseURL: providers.custom.baseURL || "", model: typeof providers.custom.model === "string" ? providers.custom.model : "", hasKey: isProviderConfigured("custom") }
    : null
  return { providers: status, custom, labels, presets, activeProvider }
}

// ─── Panel message handlers (pure persistence, error string or null) ───

export function handleAddProvider(payload) { return addProviderEntry(payload) }
export function handleRemoveProvider(name) { return removeProviderEntry(name) }

/** Set/clear a provider's per-provider proxy flag (false → delete the field, CLI injectProxy parity). */
export function handleSetProviderProxy(name, proxy) {
  vscPersistRaw((raw) => {
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
    // MODEL-MERGE-SESSION：defaultModel 顶层键（新会话起点）——面板「默认模型」项读写
    defaultModel: loadRaw().defaultModel ?? null,
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

// Panel persistence lives in settings-panel-write.mjs (pure Node, testable outside the
// extension host) — re-exported here to keep the panel import surface.
export { saveAgentSettingsFromPanel, saveShellSettingsFromPanel }

/** Proxy settings snapshot for the panel (normalized { uri, web, model } | null). */
export function proxySettings() {
  const raw = loadRaw()
  return normalizeProxy(raw.proxy) ?? null
}

/** Web search (Tavily) snapshot for the panel: { hasKey }. */
export function websearchSettings() {
  const ws = loadRaw().websearch ?? {}
  return { hasKey: !!ws.apiKey }
}

/** Persist the Tavily web-search API key (empty → clear). */
export function saveWebsearchKeyFromPanel(key) {
  vscPersistRaw((raw) => {
    const ws = raw.websearch ?? {}
    ws.apiKey = key?.trim() || ""
    if (!ws.apiKey) delete ws.apiKey
    raw.websearch = ws
  })
}

/** Remove the Tavily web-search API key. */
export function deleteWebsearchKeyFromPanel() {
  vscPersistRaw((raw) => {
    const ws = raw.websearch ?? {}
    delete ws.apiKey
    raw.websearch = ws
  })
}

/**
 * Probe a provider's connection by listing its /models. Used by the Add-Provider
 * form: validates baseURL+key AND returns the model list so a custom provider's
 * model can be PICKED (not hand-typed). Returns { ok, models } or { ok:false, error }.
 * `format`（openai/anthropic/google）随表单下发——M1 三格式分派（缺省 = openai）。
 */
export async function testProviderConnection({ baseURL, apiKey, format }) {
  const url = (baseURL || "").trim().replace(/\/+$/, "")
  if (!url) return { ok: false, error: "baseURL is required" }
  if (!/^https?:\/\//.test(url)) return { ok: false, error: "baseURL must start with http:// or https://" }
  // Route through the configured web proxy (same as websearch/fetch).
  const px = normalizeProxy(loadRaw().proxy)
  const proxyUri = px && px.web !== false ? px.uri : null
  try {
    const models = await listModels({ baseURL: url, apiKey: apiKey || "", model: "", format, proxyUri })
    return { ok: true, models }
  } catch (e) {
    return { ok: false, error: e.message || String(e) }
  }
}

/** Persist proxy settings from the panel. payload: { uri?, web?, model? } (uri '' = clear). */
export function saveProxySettingsFromPanel(payload) {
  vscPersistRaw((raw) => {
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
  const { proxyFetch } = await import("@thincoder/core/proxy.mjs")
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

/** Store a provider API key (settings provider command face — writes go through the panel write channel). */
export async function saveProviderKey(name, key) {
  // storeProviderKey performs the same !key || !key.trim() guard — delegate only.
  await storeProviderKey(name, key)
  // M9：设 API key = 配置写入面——探一次 GET /models（探不通 → 标不可用 + 不入候选；
  // 不阻断保存——key 已落盘）。探针失败不缓存——下次配置动作重探。
  await probeProviderAdmission(name)
}

export async function deleteProviderKey(name) {
  await removeProviderKey(name)
  // A bare "custom" entry with no baseURL/model is useless — drop it entirely
  if (name === "custom") {
    vscPersistRaw((raw) => {
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

export function pushStatus(panel) {
  const s = providerStatus()
  const anyKey = Object.values(s.providers).some((p) => p.configured)
  panel?.webview.postMessage({ type: "providerStatus", keyOk: anyKey, status: s })
}

// MODEL-MERGE-SESSION：最近一次 models 载荷缓存（loadSession 复用既有 "models" 消息把
// 会话槽复合同步给 webview 下拉——F-4 恢复 UI 面——避免空表清下拉；extension 进程内缓存）
let _lastModelsPayload = []
export function lastModelsPayload() { return _lastModelsPayload }

// 渠道准入探针窗口族（F-W19 · §2.12）已外提 `provider-probe-window.mjs`（N-P3 体量拆分）——
// `fullStatus` 经 `_probeWindow` / `_probeBatch` / `_retryFailed` 驱动之；对外缝由本档 re-export。
export { endProbeWindow, _resetProbeWindowsForTest, _setProbeRetryDelayForTest } from "./provider-probe-window.mjs"

/**
 * Full status push: sync snapshot + **运行期模型清单拉取**（MODEL-SELECTION M2/R6——候选面唯一
 * 来源 = `GET /models`，无静态兜底）。每个已配置渠道探一次：
 * - 探通 → 候选行 = 拉取结果（直接可选；渠道默认单值仅在槽位/会话回退面使用）；
 * - 探不通 → 该渠道**不可选**（无候选、无 fallback 候选行）+ 失败消息本体随载荷下发
 *   （M8 逐字长句——准入判据）；结果入准入展示态（providerStatus 行 `不可用` / `宿主繁忙`）。
 * 注：本拉取 = 候选面机制本身（R6），非 M9 新增探测点；失败不阻断任何流。
 * F-W19（§2.12）：失败子集在**同窗口**内有界重探（≤ 2 拍 + 宿主忙让位——`_retryFailed`），
 * 成功拍走同一 `flush` ⇒ 准入翻转随载荷生效（② / ③）。
 */
export async function fullStatus(panel, workspaceState, pushSessionsFn, prefsOverride = null) {
  pushStatus(panel)
  const s = providerStatus()
  const anyKey = Object.values(s.providers).some((p) => p.configured)
  if (!anyKey) return

  const w = _probeWindow(panel)
  const names = providerNames().filter((n) => s.providers[n]?.configured)
  /** 载荷装配 + 投递（首拍与重试成功拍共用——§2.12 ②）。 */
  const flush = () => {
    const allModels = names.flatMap((n) => w.models.get(n) ?? [])
    const unavailable = names.flatMap((n) => (w.diag.has(n) ? [w.diag.get(n)] : []))
    _lastModelsPayload = allModels
    // MODEL-SELECTION：models push 的 prefs = 会话槽复合优先（调用侧 status() 经
    // prefsOverride 传入——打开/切换后下拉跟随本会话）；无槽复合（新会话）→ 文件夹级
    // workspaceState prefs 兜底（最近使用——/new 沿用当前语义）
    const prefs = prefsOverride ?? loadModelPrefs(workspaceState)
    pushStatus(panel) // 准入展示态已更新（M9）——状态行重推（webview 按变更重渲染）
    // `unavailable` = 拉取失败渠道的诊断载荷（{ provider, reason }[]）——UI 面失败原因经
    // providerStatus 行（`不可用` / `宿主繁忙` + .prov-hint 渲染失败消息本体）；本字段供测试与排障
    // （provider-admission.test.mjs T24 断言原因随载荷下发）。
    panel?.webview.postMessage({ type: "models", models: allModels, prefs, ...(unavailable.length ? { unavailable } : {}) })
    pushSessionsFn?.()
  }
  await _probeBatch(w, names)
  flush()
  // 有界重试链 fire-and-forget（打开拍不得被子秒级重试拖住）；链内全兜底，绝不向外抛。
  _retryFailed(w, flush).catch(() => { /* unreachable: 链内探针 / 等待均已兜底 */ })
}

