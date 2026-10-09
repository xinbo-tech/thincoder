/**
 * provider-flows.mjs — provider 加 ∕ 删 ∕ 密钥三流程 + 渠道准入探针判据（核件 —— 「桌面处理流 · VSC 对齐」
 * 批 R8 上提产物；2026-09-28）。
 *
 * 上提源 = VSC `thincoder-vscode/src/extension/provider-flows.mjs`（`addProviderFlow:60` ∕
 * `removeProviderFlow:129` ∕ `setKeyFlow:153` ∕ `probeProviderAdmission:32`）——**纯搬 + 转口，零语义改**
 * （三流程步序 ∕ 字段校验 ∕ 拒因 ∕ 探针语义逐字）；VSC 自持副本已随本批（parity-b4）迁移改指本档（双写窗口关闭——本档 = 桌面 ∕ VSC 消费单源）。
 *
 * 转口（宿主面 ⇒ 注入缝；本档零宿主依赖、零 `vscode` 引用）：
 *  - **UI 壳**（VSC = `vscode.window.showQuickPick ∕ showInputBox ∕ showErrorMessage ∕ showWarningMessage ∕
 *    showInformationMessage`）⇒ `ui = { pick, input, error, warn, info }`；
 *  - **网络探针**（VSC = `probeChannelModels(name, probeTargetFromEntry(entry))`——目标构造随迁 = `probeTargetOf`）
 *    ⇒ `deps.probe(name, target)`（缺省 = 核真探 `probeChannelModels`；测试 ∕ 端侧可注入。**缝契约** = 同
 *    `probeChannelModels` 形：`{ ok:true, models }` ∕ `{ ok:false, error }`，**并自落账** `recordAdmission`
 *    ——未落账 ⇒ 失败分档回落 `classifyProbeFailure` 现算）；
 *  - **宿主忙证据覆盖**（VSC = `loop-sampler.mjs` `overrideAdmissionIfHostBusy`，F-W19）⇒
 *    `deps.hostBusyOverride`（缺省 null = 无宿主证据 —— 核零宿主事件循环观测）。
 * 持久化面 = 核 `config-io.mjs`（`addProviderEntry` ∕ `removeProviderEntry` ∕ `setProviderKey` ∕
 * `resolveProviders`）——本档零副本。
 *
 * M9 语义定死：**准入永不阻断写** —— 探针只出读数 ∕ 失败消息（消息本体逐字长句），绝不抛出 ∕
 * 绝不回滚已完成的保存；失败不缓存（下次配置动作重探）。
 *
 * 消费面：桌面 `thincoder-desktop/src/main/providers.mjs`（四通道壳——判据面：`FORMATS` ∕
 * `customFieldsError` ∕ `probeAdmission`；端侧 reason 词法不动）；三流程本体 = 桌面 ∕ VSC（已随本批迁移改指）消费，CLI 待迁。
 */
import { PROVIDER_PRESETS } from "./config-presets.mjs"
import { normalizeProxy } from "./config.mjs"
import { addProviderEntry, loadRaw, removeProviderEntry, resolveProviders, setProviderKey } from "./config-io.mjs"
import { admissionOf, channelUnavailableMessage, classifyProbeFailure, probeChannelModels } from "./provider/list-models.mjs"

/** 自定形协议域（闭集三协议 —— VSC 同档 `FORMATS` 逐字；端侧形判 ∕ 表单选项集同值域）。 */
export const FORMATS = Object.freeze(["openai", "anthropic", "google"])

/** UI 壳缝校验（缺 ∕ 形违 ⇒ 抛 —— fail-loud：宿主未接线不得静默扮成零动作）。 */
function requireUi(ui) {
  if (!ui || typeof ui.pick !== "function" || typeof ui.input !== "function"
    || typeof ui.error !== "function" || typeof ui.warn !== "function" || typeof ui.info !== "function") {
    throw new TypeError("provider-flows: ui seam missing — inject { pick, input, error, warn, info }")
  }
  return ui
}

/**
 * 自定形渠道名校验（VSC `addProviderFlow` 名称步 `validateInput` 逐字）：空 ⇒ `Name is required`；
 * 已配 ∕ 撞预设名 ⇒ `Name already in use`；合法 ⇒ `null`。
 * `existing` = 已配渠道名集（VSC 同源 = `resolveProviders().providers` 名集；缺省空集）。
 */
export function providerNameError(name, existing = new Set()) {
  const n = String(name ?? "").trim()
  if (!n) return "Name is required"
  if (existing.has(n) || PROVIDER_PRESETS[n]) return "Name already in use"
  return null
}

/**
 * 自定形必填字段校验（VSC `addProviderFlow` 自定径输入步步序 = baseURL → format；
 * name 步单列见 `providerNameError`。2026-10-09 清除批：model 步退场——渠道不携模型）。
 * 两拒因串 = 核持久化面**同条件串**逐字（`config-io.mjs`
 * `addProviderEntry`）——VSC 该两步为静默中止位（无消息可搬）⇒ 取同条件核串，保「同条件同词」。
 * `format` 缺省 = `"openai"`（沿端侧形判同式）。
 * @returns {string|null} 首个失败字段的拒因串；全过 ⇒ `null`
 */
export function customFieldsError(fields) {
  const baseURL = String(fields?.baseURL ?? "").trim()
  if (!baseURL) return "Base URL is required"
  const format = fields?.format ?? "openai"
  if (!FORMATS.includes(format)) return `Unknown API format: ${format} (expected ${FORMATS.join("/")})`
  return null
}

/**
 * M9 探针目标构造（上提源 = VSC `provider-flows.mjs:38` 的实参面 `presets.mjs` `probeTargetFromEntry`——
 * 逐条随迁）：渠道条目 ⇒ `listModels` 可消费的探针目标。代理链与 chat 请求同规则（per-provider `proxy: true`
 * ∧ `proxy.uri` 在案 ⇒ 探针也走该代理；无全局闸——2026-10-08 批落）；apiKey 归一（trim；缺 ⇒ 空串——探针会
 * 如实失败 ⇒ 渠道标「不可用」——准入判据 M8）。`headers` 字段面（#1048①）：仅 plain-object 才携；缺 ∥ 非法 ⇒
 * 零键（同 apiKey 归一律）——来源面 = 盘上条目 ∥ 表单；消费点 = `list-models` 各 format 分支请求头展开。
 */
export function probeTargetOf(entry) {
  const raw = loadRaw()
  const proxyCfg = normalizeProxy(raw.proxy)
  const proxyUri = entry?.proxy === true && proxyCfg?.uri ? proxyCfg.uri : undefined
  return {
    name: entry?.name,
    baseURL: entry?.baseURL,
    apiKey: typeof entry?.apiKey === "string" ? entry.apiKey.trim() : "",
    format: entry?.format,
    proxyUri,
    ...(entry?.headers && typeof entry.headers === "object" && !Array.isArray(entry.headers) ? { headers: entry.headers } : {}),
  }
}

/**
 * 探针 + 失败分档（已解析条目的低层面 —— 端侧「读账优先 ∕ 未落账回落现算」单源：
 * `failure` ∈ { timeout, malformed, hostBusy }，分类本体住核 `classifyProbeFailure`；网络探针经 `deps.probe`
 * 注入，缺省 = 核真探；**探针目标由本档 `probeTargetOf` 构造**（同 VSC 源实参）。**绝不抛出**（探针族语义）。
 * @returns {{ok:true, models:string[]} | {ok:false, failure:string, error:string}}
 */
export async function probeAdmission(name, provider, deps = {}) {
  const probe = typeof deps.probe === "function" ? deps.probe : probeChannelModels
  const r = await probe(name, probeTargetOf(provider))
  if (r?.ok) return { ok: true, models: r.models ?? [] }
  const error = r?.error
  const failure = admissionOf(name)?.failure ?? classifyProbeFailure({ message: error })
  return { ok: false, failure, error }
}

/** M9 渠道准入探（配置写入面）：对目标渠道探一次 `GET /models`。
 *  探通 → 渠道可用（探得候选可直接用）；探不通 → 记录失败展示态（providerStatus 行 `不可用` + 失败消息本体）
 *  并返回失败消息供调用方提示。**绝不抛出、绝不阻断任何写**；失败不缓存——下次配置动作重探。 */
export async function probeProviderAdmission(name, deps = {}) {
  if (!name) return { ok: false, error: "provider name is required" }
  try {
    const { providers } = resolveProviders()
    const entry = providers.find((p) => p.name === name)
    if (!entry) return { ok: false, error: `Unknown provider "${name}"` }
    const r = await probeAdmission(name, entry, deps)
    // F-W19：核分类只知超时 ∕ 畸形；宿主忙 = 端侧证据 ⇒ 覆盖落账分类为 `hostBusy`
    // （`reason` 逐字不动；返回面零扩张）——宿主证据经注入缝给（核零宿主事件循环观测）。
    if (!r.ok && typeof deps.hostBusyOverride === "function") deps.hostBusyOverride(name, r.error)
    return r.ok ? { ok: true, models: r.models } : { ok: false, error: r.error }
  } catch (e) {
    return { ok: false, error: channelUnavailableMessage(e) }
  }
}

/** M9：探一次并在失败时界面明示失败消息（消息本体逐字长句）——不阻断已完成的保存。 */
async function reportAdmission(name, ui, deps) {
  const probe = await probeProviderAdmission(name, deps)
  if (!probe.ok) ui.warn(probe.error)
  return probe
}

// ─── Three interactive flows (host UI shell injected) ───

/** Add a provider interactively: pick an unused preset or configure custom manually. */
export async function addProviderFlow(ui, refresh, deps = {}) {
  const host = requireUi(ui)
  let providers
  try {
    ({ providers } = resolveProviders())
  } catch (e) {
    host.error(e.message)
    return
  }
  const existing = new Set(providers.map((p) => p.name))

  const items = Object.entries(PROVIDER_PRESETS)
    .filter(([name]) => !existing.has(name))
    .map(([name, p]) => ({ label: name, description: p.desc, detail: p.baseURL ?? "", kind: "preset", name }))
  items.push({ label: "Custom (manual config)", description: "enter baseURL/format", kind: "custom" })

  const sel = await host.pick(items, {
    placeHolder: "Add provider — select a preset",
    matchOnDescription: true, matchOnDetail: true,
  })
  if (!sel) return

  if (sel.kind === "custom") {
    const name = (await host.input({
      prompt: "Provider name",
      validateInput: (v) => providerNameError(v, existing),
    }))?.trim()
    if (!name) return
    const baseURL = (await host.input({
      prompt: `Base URL for ${name}`,
      placeHolder: "https://api.example.com/v1",
    }))?.trim()
    if (!baseURL) return
    const format = await host.pick(
      FORMATS.map((f) => ({ label: f, description: f === "openai" ? "(default)" : f === "anthropic" ? "Messages API" : "streamGenerateContent" })),
      { placeHolder: "API format" },
    )
    if (!format) return
    const err = addProviderEntry({ custom: { name, baseURL, format: format.label } })
    if (err) { host.error(err); return }
    const key = await host.input({ prompt: `API key for ${name} (leave empty to skip)`, password: true })
    if (key?.trim()) {
      const kerr = setProviderKey(name, key.trim())
      if (kerr) { host.error(kerr); return } // F5b：config 并发被改——放弃 + 提示重试
    }
    await refresh?.()
    await reportAdmission(name, host, deps) // M9：加渠道的配置写入面——探一次 /models（失败标不可用，不阻断保存）
    return
  }

  // Preset: entry auto-filled from PROVIDER_PRESETS, then ask for a key
  const err = addProviderEntry({ preset: sel.name })
  if (err) { host.error(err); return }
  const key = await host.input({ prompt: `API key for ${sel.name} (leave empty to skip)`, password: true })
  if (key?.trim()) {
    const kerr = setProviderKey(sel.name, key.trim())
    if (kerr) { host.error(kerr); return } // F5b：冲突放弃提示重试
  }
  await refresh?.()
  await reportAdmission(sel.name, host, deps) // M9：同上
}

/** Remove a provider interactively (active one is not listed, CLI parity). */
export async function removeProviderFlow(ui, refresh) {
  const host = requireUi(ui)
  let providers, activeProvider
  try {
    ({ providers, activeProvider } = resolveProviders())
  } catch (e) {
    host.error(e.message)
    return
  }
  const candidates = providers.filter((p) => p.name !== activeProvider)
  if (candidates.length === 0) {
    host.info("No removable providers — the active provider is kept.")
    return
  }
  const sel = await host.pick(
    candidates.map((p) => ({ label: p.name, description: p.baseURL ?? "" })),
    { placeHolder: "Remove provider" },
  )
  if (!sel) return
  const err = removeProviderEntry(sel.label)
  if (err) host.error(err)
  else await refresh?.()
}

/** Set / replace an API key for a configured provider. */
export async function setKeyFlow(ui, refresh, deps = {}) {
  const host = requireUi(ui)
  let providers
  try {
    ({ providers } = resolveProviders())
  } catch (e) {
    host.error(e.message)
    return
  }
  if (providers.length === 0) return
  const sel = await host.pick(
    providers.map((p) => ({ label: p.name, description: p.apiKey ? "(has key)" : "(no key)" })),
    { placeHolder: "Set API key for provider" },
  )
  if (!sel) return
  const key = await host.input({ prompt: `API key for ${sel.label}`, password: true })
  if (key?.trim()) {
    const kerr = setProviderKey(sel.label, key.trim())
    if (kerr) { host.error(kerr); return } // F5b：config 并发被改——放弃 + 提示重试
    await refresh?.()
  }
  await reportAdmission(sel.label, host, deps) // M9：设 API key 的配置写入面——探一次 /models（失败标不可用，不阻断保存）
}
