/**
 * settings.mjs — 主侧设置族四通道：`config:write`（仅语言面）/ `model:list` /
 * `settings:agent`（agent 参数族读 + 写）——外加两道端侧单点：配置档存在性读数
 * `isConfigured()` 与密钥遮罩 `maskKey()`。
 *
 * 纪律（批档 §2.3/§2.5）：
 * - **写面唯一执行体** = 核 `writeConfigAtomic`（`thincoder-core/config-io.mjs:59`，
 *   内含 mtime 冲突护栏 → 回执 `{ ok:false, reason:"mtime-conflict" }` + `.bak-{ts}`）；
 *   端侧**零自写盘**（不 fs.writeFile）。
 * - **畸形档不吞**：核 `loadRaw` 抛 ⇒ 本档零 catch ⇒ invoke 拒绝直传（渲染面落 error 档）。
 * - **不复刻核算法**：值校验 / 类型表 / 敏感判据一律走核导出面
 *   （`isSensitiveKey` / `_checkKnownKeyValue`），端侧不另立白名单、不另立类型副本。
 * - `settings:agent` **不经 agent 工具**（主进程直读写配置——批档 §2.3 写面条款）。
 */
import { existsSync } from "node:fs"
import { loadConfig } from "@thincoder/core/config.mjs"
import { _configPath, resolveProviders, writeConfigAtomic } from "@thincoder/core/config-io.mjs"
import { SUPPORTED_LOCALES, normalizeLocale, projectDictionary } from "@thincoder/core/i18n.mjs"
import { channelUnavailableMessage, listModels } from "@thincoder/core/provider/list-models.mjs"
import { isSensitiveKey, _checkKnownKeyValue } from "@thincoder/core/agent-tools/settings.mjs"

/** 遮罩字面量（与核 `agent-tools/settings.mjs:19` `MASKED` 同形——核未导出，端侧自持）。 */
export const MASK = "••••（masked）"

/**
 * **端侧遮罩单点**：敏感键 ⇒ 遮罩字面量，否则原值直通。判据复用核**导出**的
 * `isSensitiveKey`（`thincoder-core/agent-tools/settings.mjs:22`——段名判据）；核 `MASKED`
 * 非导出 ⇒ 端侧自持同形字面量（不改核、不复刻判据）。
 * 通道载荷**只回遮罩后值**：`provider:list` 的 `maskedKey` 与 `settings:agent` 的 `fields`
 * 均经本函数出口（明文密钥零下发）。
 */
export function maskKey(path, value) {
  return isSensitiveKey(String(path)) ? MASK : value
}

/** 配置档存在性（**向导闸**读数）：`existsSync(_configPath())`——档在 = 已配。
 *  有意比 CLI `isConfigured`（`config.mjs:96`，另判 `defaultModel` 非空）**宽**：用户手编过
 *  配置即视为已配，向导不重放（批档 §2.10 项 3——勿与核口径统一）。 */
export function isConfigured() {
  return existsSync(_configPath())
}

/** 值类型标签（读面提示用——`array`/`null` 单列，其余 = `typeof`）。 */
function kindOf(value) {
  return Array.isArray(value) ? "array" : value === null ? "null" : typeof value
}

/** 叶子展平（点分路径 + 值；数组当叶子——不展开元素以免路径歧义）。 */
function flatten(obj, prefix = "", out = []) {
  for (const [k, v] of Object.entries(obj ?? {})) {
    const path = prefix ? `${prefix}.${k}` : k
    if (v !== null && typeof v === "object" && !Array.isArray(v)) flatten(v, path, out)
    else out.push({ path, value: v })
  }
  return out.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0))
}

/** 深度遮罩副本（数组元素逐下标成路径——`providers.0.apiKey` 段判命中 ⇒ 遮罩，**容器值也遮**：
 *  否则 `providers` 数组会整体明文下发）。 */
function maskDeep(prefix, value) {
  if (Array.isArray(value)) return value.map((v, i) => maskDeep(`${prefix}.${i}`, v))
  if (value !== null && typeof value === "object") {
    const out = {}
    for (const [k, v] of Object.entries(value)) out[k] = maskDeep(`${prefix}.${k}`, v)
    return out
  }
  return maskKey(prefix, value)
}

/** 读面字段表：`{ path, value, sensitive, kind }`——值一律经 `maskDeep` 出口（遮罩单点）。 */
function agentFields(config) {
  return flatten(maskDeep("", config)).map(({ path, value }) => ({
    path,
    value,
    sensitive: isSensitiveKey(path),
    kind: kindOf(value),
  }))
}

/** 点分路径写入（核未导出该 helper——端侧小工具，语义同核 settings 工具：逐段下钻，缺段建对象）。 */
function setKeyPath(obj, path, value) {
  const segs = String(path).split(".")
  let cur = obj
  for (let i = 0; i < segs.length - 1; i++) {
    const seg = segs[i]
    if (cur[seg] === null || typeof cur[seg] !== "object") cur[seg] = {}
    cur = cur[seg]
  }
  cur[segs[segs.length - 1]] = value
}

/**
 * `config:write(payload)` ⇒ `{ ok, reason:null, locale, dict, configured }` ∥ `{ ok:false, reason }`。
 * 写面**仅** `locale`（键白名单一条；值域 = 核 `SUPPORTED_LOCALES` = `en`/`zh`——批档 §2.4）；
 * 未知键 / 非单键 / 非对象 ⇒ `invalid-key`，值域外 ⇒ `invalid-value`；写失败 ⇒ 核回执 reason 直传
 * （`mtime-conflict`）。
 * 成功**同回带**语言字典 + 配置档读数（免二跳第二轮 `config:read`、零新事件通道——§2.11 项 1）；
 * 字典 = 核 `projectDictionary(locale)`（**项目层**字典——宿主层键由渲染面 `HOST_DICT` 自持）。
 */
export function configWrite(payload) {
  const patch = payload?.patch
  const keys = patch && typeof patch === "object" && !Array.isArray(patch) ? Object.keys(patch) : []
  if (keys.length !== 1 || keys[0] !== "locale") return { ok: false, reason: "invalid-key" }
  const raw = patch.locale
  if (typeof raw !== "string" || !SUPPORTED_LOCALES.includes(raw)) return { ok: false, reason: "invalid-value" }
  const locale = normalizeLocale(raw)
  const w = writeConfigAtomic(_configPath(), (disk) => { disk.locale = locale })
  if (!w.ok) return { ok: false, reason: w.reason }
  return { ok: true, reason: null, locale, dict: projectDictionary(locale), configured: isConfigured() }
}

/**
 * `model:list(payload)` ⇒ `{ ok, models }` ∥ `{ ok:false, models:[], reason }`——`payload.provider`
 * = provider **名**；`models` = 核 `listModels(provider)`（`thincoder-core/provider/list-models.mjs:96`）。
 * 失败 reason = 核 `channelUnavailableMessage(e)`（`:109`——状态码 / 错误摘要的中文直传）；
 * 渠道不存在（无该 provider）⇒ 同面构造错误后直传（端侧零自写文案分支以外的话术）。
 */
export async function modelList(payload) {
  const name = String(payload?.provider ?? "").trim()
  const provider = resolveProviders().providers.find((p) => p.name === name)
  if (!provider) {
    return { ok: false, models: [], reason: channelUnavailableMessage(new Error(`provider not found: ${name}`)) }
  }
  try {
    return { ok: true, models: await listModels(provider) }
  } catch (e) {
    return { ok: false, models: [], reason: channelUnavailableMessage(e) }
  }
}

/**
 * `settings:agent(payload)`：读 `{}` ⇒ `{ ok, fields }`；写 `{ patch:{ "<点分路径>": value } }` ⇒
 * `{ ok, reason, fields }`（**写后回读**）。
 * 三档失败（§2.2 状态面②）：① 值校验拒绝 ⇒ 核 `_checkKnownKeyValue` 抛错 **零写盘**
 * （reason = 核错误串直传）；② mtime 冲突 ⇒ 核回执 `mtime-conflict`（`.bak-{ts}` 已留）；
 * ③ 路径形态非法 ⇒ `invalid-patch`。未知键**放行**（全量域 = 核语义——端侧不另立白名单）。
 */
export function settingsAgent(payload) {
  const config = loadConfig()
  const patch = payload?.patch
  if (patch === undefined || patch === null) return { ok: true, fields: agentFields(config) }
  const entries = typeof patch === "object" && !Array.isArray(patch) ? Object.entries(patch) : []
  if (!entries.length) return { ok: false, reason: "invalid-patch", fields: agentFields(config) }
  for (const [path, value] of entries) {
    try {
      _checkKnownKeyValue(path, value)
    } catch (e) {
      return { ok: false, reason: e?.message ?? String(e), fields: agentFields(config) }
    }
  }
  const w = writeConfigAtomic(_configPath(), (disk) => {
    for (const [path, value] of entries) setKeyPath(disk, path, value)
  })
  if (!w.ok) return { ok: false, reason: w.reason, fields: agentFields(loadConfig()) }
  return { ok: true, reason: null, fields: agentFields(loadConfig()) }
}
