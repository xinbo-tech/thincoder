/**
 * list-models.mjs — GET /models dispatched by provider.format (PROVIDER.md §16.2 M1).
 *
 * Split out of provider.mjs (2026-09-10 MODEL-SELECTION：原实现只有 openai 形状——
 * claude/gemini 用它必 401/404）。三分支：
 *   openai（缺省/未知 format）  `GET {baseURL}/models` + `Authorization: Bearer`
 *   anthropic                 `GET {baseURL}/models?limit=1000` + `x-api-key` / `anthropic-version`
 *                             （`has_more` → 以 `after_id` 翻页跟随）
 *   google                    `GET {baseURL}/models?key=…&pageSize=1000`
 *                             （`models[].name` 剥 `models/` 前缀；`nextPageToken` 翻页跟随）
 * `baseURL` 自带版本段（与 chat 各 transport 同基：claude 预设 `…/v1`、gemini 预设 `…/v1beta`）。
 *
 * 契约（§16.3）：返回模型 ID 数组（本端排序——UI 确定性）；HTTP 非 2xx / 网络失败 /
 * 非 JSON 响应**抛出**（调用方决定降级）。超时 15s（整体 + header + body idle——逐页各自
 * 计时）；翻页上限 10 页（防死循环；任一分页失败整体抛出，不部分返回——清单权威语义不容
 * 静默截断）。候选**不做对话能力过滤**（embedding 等一并返回——决策 §16.6 #14）。
 *
 * 渠道准入展示态（§16.2 M8/M9）也收敛在本文件：probeChannelModels 探一次并记录结果，
 * admissionOf 供 providerStatus 读取展示（`不可用` + 失败消息）；探针失败不阻断任何配置写，
 * 也不作任何阻断缓存——下次配置动作重探（失败不缓存）。
 */
import { proxyFetch } from "../proxy.mjs"

const MODELS_TIMEOUT_MS = 15_000
const MAX_PAGES = 10
export const ANTHROPIC_VERSION = "2023-06-01"

/** M8 渠道准入失败消息（逐字长句 = 消息本体；状态标签 `不可用` 在 UI 层——分工见 §16.2 M8）。
 *  {状态} = HTTP 状态或网络错误摘要。 */
export function channelUnavailableMessage(error) {
  const status = Number.isInteger(error?.status) ? String(error.status) : String(error?.message || error)
  return `该渠道不提供模型列表（GET /models ${status}）——无法选择模型，请改用其他渠道`
}

/** List available model IDs from the provider's /models endpoint（按 format 分派）。 */
export async function listModels(provider, { signal } = {}) {
  const base = String(provider?.baseURL ?? "").replace(/\/+$/, "")
  if (!base) throw new Error("GET /models failed: baseURL is missing")
  const format = provider?.format || "openai"
  const ids = format === "anthropic" ? await fetchAnthropicModels(provider, base, signal)
    : format === "google" ? await fetchGoogleModels(provider, base, signal)
      : await fetchOpenAIModels(provider, base, signal) // 未知/缺省 → openai（与 chat 分派缺省一致）
  return ids.filter((id) => typeof id === "string" && id).sort()
}

/** 单页请求：15s 整体超时 + header/body idle 15s（代理路径同值——§16.2 M1）。 */
async function fetchJSON(url, headers, provider, signal) {
  const ctrl = new AbortController()
  let timedOut = false
  const timer = setTimeout(() => { timedOut = true; ctrl.abort() }, MODELS_TIMEOUT_MS)
  const onAbort = () => ctrl.abort()
  if (signal) {
    if (signal.aborted) { clearTimeout(timer); throw new DOMException("Aborted", "AbortError") }
    signal.addEventListener("abort", onAbort, { once: true })
  }
  try {
    const response = await proxyFetch(url, {
      headers,
      signal: ctrl.signal,
      _headerTimeoutMs: MODELS_TIMEOUT_MS,
      _bodyIdleMs: MODELS_TIMEOUT_MS,
    }, provider.proxyUri)
    if (!response.ok) {
      const text = await response.text().catch(() => "")
      const e = new Error(`GET /models failed ${response.status}: ${text.slice(0, 200)}`)
      e.status = response.status
      throw e
    }
    const rawText = await response.text().catch(() => "")
    try {
      return JSON.parse(rawText)
    } catch {
      // 网关/代理返回 HTML 等非 JSON——拉不到清单（M8 判据：该渠道不可用）
      throw new Error("GET /models failed: non-JSON response")
    }
  } catch (e) {
    if (e?.name === "AbortError" && timedOut) throw new Error("GET /models failed: timeout after 15s")
    throw e
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener("abort", onAbort)
  }
}

async function fetchOpenAIModels(provider, base, signal) {
  const data = await fetchJSON(`${base}/models`, { Authorization: `Bearer ${provider.apiKey ?? ""}` }, provider, signal)
  const items = Array.isArray(data?.data) ? data.data : []
  return items.map((m) => m?.id)
}

async function fetchAnthropicModels(provider, base, signal) {
  const ids = []
  let after = ""
  for (let page = 0; page < MAX_PAGES; page++) {
    const url = `${base}/models?limit=1000${after ? `&after_id=${encodeURIComponent(after)}` : ""}`
    const data = await fetchJSON(url, {
      "x-api-key": provider.apiKey ?? "",
      "anthropic-version": ANTHROPIC_VERSION,
    }, provider, signal)
    const items = Array.isArray(data?.data) ? data.data : []
    for (const m of items) if (typeof m?.id === "string" && m.id) ids.push(m.id)
    if (!data?.has_more) break
    // 翻页游标：`last_id` 优先，缺失时取本页末项 id（防御性——字段缺失即停，防死循环）
    const cursor = typeof data?.last_id === "string" && data.last_id
      ? data.last_id
      : (typeof items[items.length - 1]?.id === "string" ? items[items.length - 1].id : "")
    if (!cursor) break
    after = cursor
  }
  return ids
}

async function fetchGoogleModels(provider, base, signal) {
  const ids = []
  let token = ""
  for (let page = 0; page < MAX_PAGES; page++) {
    const url = `${base}/models?key=${encodeURIComponent(provider.apiKey ?? "")}&pageSize=1000${token ? `&pageToken=${encodeURIComponent(token)}` : ""}`
    const data = await fetchJSON(url, {}, provider, signal)
    const items = Array.isArray(data?.models) ? data.models : []
    for (const m of items) if (typeof m?.name === "string" && m.name) ids.push(m.name.replace(/^models\//, ""))
    const next = typeof data?.nextPageToken === "string" && data.nextPageToken ? data.nextPageToken : ""
    if (!next) break
    token = next
  }
  return ids
}

// ─── 渠道准入展示态 + 探针（M9——配置写入面探测；运行期零额外探测点）───────────────
// 记录 = 「最近一次探测的展示结果」，不是阻断缓存：任何配置动作/面板候选拉取都会重探，
// 失败也绝不阻止重探（失败不缓存语义）。
const _admission = new Map() // name → { ok: true } | { ok: false, reason }

/** 记录一次渠道准入探测结果。 */
export function recordAdmission(name, result) {
  if (name) _admission.set(name, result)
}

/** 读取渠道准入展示态（未探过 → null）。 */
export function admissionOf(name) {
  return _admission.get(name) ?? null
}

// 测试缝（先例 rate.mjs `_rateHooks`）：探针实现可注入——缺省 = 真探。
let _probeImpl = null
export function _setProbeImplForTest(fn) { _probeImpl = fn }
export function _resetAdmissionForTest() { _admission.clear(); _probeImpl = null }

/** M9 配置阶段准入探针：对目标渠道探一次 GET /models 并记录结果。
 *  探通 → 渠道可用（探得候选可直接用）；探不通 → 记录失败 + 返回失败消息。
 *  **绝不抛出**（不阻断任何配置写）；失败不缓存——下次配置动作重探。 */
export async function probeChannelModels(name, provider) {
  if (_probeImpl) return _probeImpl(name, provider)
  try {
    const models = await listModels(provider)
    recordAdmission(name, { ok: true })
    return { ok: true, models }
  } catch (e) {
    const error = channelUnavailableMessage(e)
    recordAdmission(name, { ok: false, reason: error })
    return { ok: false, error }
  }
}
