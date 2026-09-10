/**
 * model-catalog.mjs — 会话级模型清单 helper（PROVIDER.md §16.2 M2/M9——2026-09-10 MODEL-SELECTION）。
 *
 * 清单唯一权威 = provider 运行期拉取（`GET /models`——provider/list-models.mjs 按 format 分派）。
 * 本模块提供：
 * - `getProviderModels(providerConfig)`：拉取 + **会话级缓存**（TTL 60s；失败不缓存——下次重试）；
 * - `probeChannelModels(providerConfig)`：配置阶段准入探（M9——探通入缓存候选直接可用 / 探不通返回
 *   明示文案；调用方决定标注与「不入可选来源」——绝不阻断保存）；
 * - `modelListFailureText(error)`：M8 失败消息本体（逐字长句——界面明示的唯一断言对象）；
 * - `dedupeModels` / `modelSeries`：显示归并（自 model-picker.mjs 迁入——会话面与槽位面共用）。
 *
 * 缓存时钟可注入（`_catalogHooks.now`——先例 rate.mjs `_rateHooks`）：测试假时钟确定性断言 T6 不依赖壁钟。
 */
import { listModels } from "../provider/list-models.mjs"

/** 会话级缓存 TTL（§16.4 a2：连续操作不重复付网络；60s 新鲜窗口）。 */
const CACHE_TTL_MS = 60_000

/** 测试钩子（先例 `rate.mjs` `_rateHooks`）：时钟可注入——T6 假时钟断言。 */
export const _catalogHooks = { now: () => Date.now() }

/** 会话内缓存：key = name + baseURL（同渠道不同端点各自成条）；value = { models, at }。 */
const _cache = new Map()

/** 测试缝：清空会话缓存（跨用例隔离——生产无调用点）。 */
export function _clearModelCatalogCache() { _cache.clear() }

function cacheKey(providerConfig) {
  return `${providerConfig?.name ?? ""}\u0000${providerConfig?.baseURL ?? ""}`
}

/**
 * 拉取渠道模型清单（会话缓存 TTL 60s）。命中缓存（TTL 内）直接返回，否则走 M1 拉取；
 * **失败不缓存**（下次调用重试——失败态由调用方降级展示）。抛错契约与 listModels 一致。
 */
export async function getProviderModels(providerConfig, { signal } = {}) {
  const key = cacheKey(providerConfig)
  const hit = _cache.get(key)
  if (hit && _catalogHooks.now() - hit.at < CACHE_TTL_MS) return hit.models
  const models = await listModels(providerConfig, { signal })
  _cache.set(key, { models, at: _catalogHooks.now() })
  return models
}

/** M8 失败消息本体（逐字长句——状态 = HTTP 状态码或网络错误摘要；无绕过指引）。
 *  分工：消息本体 = 本长句；状态标签 = `不可用`（列表行内短标）。 */
export function modelListFailureText(error) {
  const status = /GET \/models failed (\d+)/.exec(error?.message ?? "")?.[1]
    ?? String(error?.message ?? error)
  return `该渠道不提供模型列表（GET /models ${status}）——无法选择模型，请改用其他渠道`
}

/**
 * M9 配置阶段准入探：对目标渠道探一次 `GET /models`（复用 M1 + 既有超时；探通入会话缓存——
 * 该流内候选直接可用）。返回 `{ ok:true, list }` | `{ ok:false, message }`——**不抛错**
 * （探不通不是异常：调用方标注不可用 + 明示原因，配置流不阻断）。
 */
export async function probeChannelModels(providerConfig) {
  try {
    return { ok: true, list: await getProviderModels(providerConfig) }
  } catch (error) {
    return { ok: false, message: modelListFailureText(error) }
  }
}

/** Strip known version/date suffixes to get the "series" name of a model.
 *  e.g. "qwen-max-latest" → "qwen-max", "qwen-max-2024-09-19" → "qwen-max" */
export function modelSeries(name) {
  return name
    .replace(/-latest$/, "")
    .replace(/-\d{4}-\d{2}-\d{2}$/, "") // date suffix like -2024-09-19
    .replace(/-\d{8}$/, "")              // date suffix like -20240919
}

/** Dedupe model list: group by series, keep shortest name per group. */
export function dedupeModels(models) {
  const groups = new Map()
  for (const m of models) {
    const series = modelSeries(m)
    const existing = groups.get(series)
    if (!existing || m.length < existing.length) groups.set(series, m)
  }
  return [...groups.values()].sort()
}
