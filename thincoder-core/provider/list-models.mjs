/**
 * list-models.mjs — provider 模型清单拉取（GET /models，按 provider.format 分派——PROVIDER.md §16 M1）。
 *
 * 2026-09-10 自 core.mjs 迁出（原实现仅 OpenAI 形状）+ 扩 anthropic / google 两分支：
 * - openai（缺省/未知 format——与 chat 分派缺省一致）：`GET {baseURL}/models` + Bearer；解析 `data[].id`
 * - anthropic：`GET {baseURL}/models?limit=1000` + `x-api-key` / `anthropic-version`；`has_more` 时以
 *   `last_id` 作 `after_id` 翻页跟随（≤10 页——防死循环）
 * - google：`GET {baseURL}/models?key=…&pageSize=1000`；剥 `models/` 前缀；`nextPageToken` 翻页跟随（≤10 页）
 *
 * URL 组合 = `{baseURL}` + 相对路径，与 chat 各 transport 同构——baseURL 自带版本段
 * （claude 预设 `…/v1` → `…/v1/models`；gemini 预设 `…/v1beta` → `…/v1beta/models`）。
 * 超时制度沿用原实现（整体 15s + header 15s + body idle 15s；翻页时逐页各自计时；调用方可传
 * `signal` 短路）。HTTP 非 2xx / 网络失败**抛出**（调用方决定降级——与现实现同）；
 * 解析保持防御性（字段缺失即跳过该项）。候选不过滤非对话模型（embedding 等——§16.6 #14）。
 */
import { proxyFetch } from "../proxy.mjs"

const LIST_TIMEOUT_MS = 15_000
/** 翻页上限（cursor loop 防死循环——任一分页失败即整体抛出，不部分返回）。 */
const MAX_PAGES = 10
const ANTHROPIC_VERSION = "2023-06-01"

/** 单页 GET + JSON 解析（非 2xx → throw；非 JSON 响应 → throw——§2.5 #115 并入 VSC 明确报错）。 */
async function fetchJson(provider, url, headers, signal) {
  const opts = {
    headers,
    signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(LIST_TIMEOUT_MS)]) : AbortSignal.timeout(LIST_TIMEOUT_MS),
    _headerTimeoutMs: LIST_TIMEOUT_MS,
    _bodyIdleMs: LIST_TIMEOUT_MS,
  }
  const response = await (provider.proxyUri ? proxyFetch(url, opts, provider.proxyUri) : fetch(url, opts))
  if (!response.ok) {
    const text = await response.text().catch(() => "")
    const e = new Error(`GET /models failed ${response.status}: ${text.slice(0, 200)}`)
    e.status = response.status // 展示面可判「不可用」
    throw e
  }
  const rawText = await response.text().catch(() => "")
  try {
    return JSON.parse(rawText)
  } catch {
    // 网关/代理返回 HTML 等非 JSON——拉不到清单（明确报错，不静默空清单）
    throw new Error("GET /models failed: non-JSON response")
  }
}

/** 防御性收集：字段缺失/非字符串项跳过。 */
function collect(rows, pick) {
  if (!Array.isArray(rows)) return []
  const out = []
  for (const row of rows) {
    const v = pick(row)
    if (typeof v === "string" && v) out.push(v)
  }
  return out
}

async function listOpenai(provider, signal) {
  const url = `${provider.baseURL}/models`
  const data = await fetchJson(provider, url, { ...(provider.headers ?? {}), Authorization: `Bearer ${provider.apiKey ?? ""}` }, signal)
  return collect(data?.data, (m) => m?.id)
}

async function listAnthropic(provider, signal) {
  const headers = { ...(provider.headers ?? {}), "x-api-key": provider.apiKey ?? "", "anthropic-version": ANTHROPIC_VERSION }
  const base = `${provider.baseURL}/models?limit=1000`
  const out = []
  let afterId = null
  for (let page = 0; page < MAX_PAGES; page++) {
    const url = afterId ? `${base}&after_id=${encodeURIComponent(afterId)}` : base
    const data = await fetchJson(provider, url, headers, signal)
    out.push(...collect(data?.data, (m) => m?.id))
    if (!data?.has_more) return out
    afterId = typeof data?.last_id === "string" && data.last_id ? data.last_id : null
    if (!afterId) return out // has_more 但无游标——无法继续，避免死循环
  }
  return out
}

async function listGoogle(provider, signal) {
  const headers = { ...(provider.headers ?? {}) }
  const base = `${provider.baseURL}/models?key=${encodeURIComponent(provider.apiKey ?? "")}&pageSize=1000`
  const out = []
  let pageToken = null
  for (let page = 0; page < MAX_PAGES; page++) {
    const url = pageToken ? `${base}&pageToken=${encodeURIComponent(pageToken)}` : base
    const data = await fetchJson(provider, url, headers, signal)
    out.push(...collect(data?.models, (m) => (typeof m?.name === "string" ? m.name.replace(/^models\//, "") : null)))
    if (typeof data?.nextPageToken !== "string" || !data.nextPageToken) return out
    pageToken = data.nextPageToken
  }
  return out
}

/** List available model IDs from the provider's /models endpoint (format 分派——M1)。 */
export async function listModels(provider, { signal } = {}) {
  const base = String(provider?.baseURL ?? "").replace(/\/+$/, "")
  if (!base) throw new Error("GET /models failed: baseURL is missing") // §2.5 #115 并入（VSC 明确报错）
  const format = provider?.format
  const ids = format === "anthropic" ? await listAnthropic(provider, signal)
    : format === "google" ? await listGoogle(provider, signal)
      : await listOpenai(provider, signal)
  // §2.5 #115 并入（VSC 排序）：返回前本端排序——UI 确定性。
  return ids.filter((id) => typeof id === "string" && id).sort()
}

/** 渠道准入失败消息（§2.5 #115 / VSC M8 并入——逐字长句 = 消息本体；状态标签由 UI 层组合）。
 *  {状态} = HTTP 状态或网络错误摘要。 */
export function channelUnavailableMessage(error) {
  const status = Number.isInteger(error?.status) ? String(error.status) : String(error?.message || error)
  return `该渠道不提供模型列表（GET /models ${status}）——无法选择模型，请改用其他渠道`
}

// ─── 渠道准入展示态 + 探针（§2.5 #115 / VSC M9 并入）─────────────────────────
// 记录 = 「最近一次探测的展示结果」，不是阻断缓存：任何配置动作/面板候选拉取都会重探，
// 失败也绝不阻止重探（失败不缓存语义）。
// F-W19（`PROVIDER.md` §6.16 M8/M9 补）：落账形态 = 成功 `{ ok: true, ts }` /
// 失败 `{ ok: false, reason, failure, ts }`——`failure` ∈ { timeout, malformed, hostBusy }。
const _admission = new Map() // name → { ok: true, ts } | { ok: false, reason, failure, ts }

/** 探针失败分类（核侧两档——`PROVIDER.md` §6.16 M8/M9 补）：
 *  `timeout` = 超时族（`AbortSignal.timeout` 的 TimeoutError / 代理读侧 abort `trigger"timeout"` /
 *  消息含 timeout / AbortError）；其余（HTTP 非 2xx / 载荷畸形 / 连接类）一律 `malformed`。
 *  `hostBusy` 不由核判（核零宿主事件循环观测）——端侧采样器以证据覆盖（`SETTINGS.md` §2.12）。 */
export function classifyProbeFailure(error) {
  if (error?.name === "TimeoutError" || error?.name === "AbortError") return "timeout"
  if (error?.abortInfo?.trigger === "timeout") return "timeout"
  return /timeout/i.test(String(error?.message ?? "")) ? "timeout" : "malformed"
}

/** 记录一次渠道准入探测结果（统一盖落账时间 `ts`——调用方显式给定则尊重：测试缝注入）。 */
export function recordAdmission(name, result) {
  if (!name) return
  const rec = { ...(result ?? {}) }
  if (!Number.isFinite(rec.ts)) rec.ts = Date.now()
  _admission.set(name, rec)
}

/** 读取渠道准入展示态（未探过 → null）。 */
export function admissionOf(name) {
  return _admission.get(name) ?? null
}

// 测试缝（先例 rate.mjs `_rateHooks`）：探针实现可注入——缺省 = 真探。
let _probeImpl = null
export function _setProbeImplForTest(fn) { _probeImpl = fn }
export function _resetAdmissionForTest() { _admission.clear(); _probeImpl = null }

/** 配置阶段准入探针：对目标渠道探一次 GET /models 并记录结果。
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
    recordAdmission(name, { ok: false, reason: error, failure: classifyProbeFailure(e) })
    return { ok: false, error }
  }
}
