/**
 * settings.mjs — 主侧设置族四通道：`config:write`（仅语言面）/ `model:list`（逐模型档位投影）/
 * `settings:agent`（agent 参数族读 + 写 + 档位意图级写）——外加两道端侧单点：配置档存在性读数
 * `isConfigured()` 与密钥遮罩 `maskKey()`；另出 `deepEqual` 供档位投影复用（同判据单点）。
 *
 * 纪律（批档 §2.3/§2.5）：
 * - **写面唯一执行体** = 核 `writeConfigAtomic`（`thincoder-core/config-io.mjs:59`，
 *   内含 mtime 冲突护栏 → 回执 `{ ok:false, reason:"mtime-conflict" }` + `.bak-{ts}`）；
 *   端侧**零自写盘**（不 fs.writeFile）。
 * - **畸形档不吞**：核 `loadRaw` 抛 ⇒ 本档零 catch ⇒ invoke 拒绝直传（渲染面落 error 档）。
 * - **不复刻核算法**：值校验 / 类型表 / 敏感判据一律走核导出面
 *   （`isSensitiveKey` / `_checkKnownKeyValue`），端侧不另立白名单、不另立类型副本。
 * - `settings:agent` **不经 agent 工具**（主进程直读写配置——批档 §2.3 写面条款）。
 * - **端侧零族别自判**（`docs/desktop/design/PROJECT.md` §2 KD-18）：`model:list` 逐项
 *   `{ id, effortEnum, thinkOff }` 两判据直取核**导出面**（`specForModel` / `thinkOffPath`）——
 *   端侧零解析模型名、零族别表副本。
 * - **档位写径（批 B · ⑥）**：意图级载荷 `{ tier: { provider, model, level } }` ⇒ 先清不相容记号、
 *   再按档落形（`auto` 删两键 / `off` 落 `thinkOffShape(spec)` + 删 `reasoningEffort` / member 仅当
 *   `thinking` deep-equal `thinkOffShape(spec)` 时删 + 置 level）；写面 = 渠道条目级默认两键；
 *   两拒码（`bad-level` / `unknown-provider`）皆**零写**——判据与拒码序单源 =
 *   `docs/desktop/design/IPC.md` §2「档位控件注」。
 */
import { existsSync } from "node:fs"
import { loadConfig } from "@thincoder/core/config.mjs"
import { _configPath, resolveProviders, writeConfigAtomic } from "@thincoder/core/config-io.mjs"
import { SUPPORTED_LOCALES, normalizeLocale, projectDictionary } from "@thincoder/core/i18n.mjs"
import { channelUnavailableMessage, listModels } from "@thincoder/core/provider/list-models.mjs"
import { specForModel } from "@thincoder/core/model-specs.mjs"
import { thinkOffPath, thinkOffShape } from "@thincoder/core/think-off.mjs"
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
 *  有意比 CLI `isConfigured`（更严）**宽**：用户手编过
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

/** 深比较（档位判据用）：`thinkOffShape` 产出的小值域字面量（`null` / `{ type:"disabled" }`）
 *  与渠道条目现存记号逐值比——键序无关、容器逐层下钻。核未导出同名 helper ⇒ 端侧小工具
 *  （判据本体仍单源 = 核 `thinkOffShape`；不另立 off 形副本）。 */
export function deepEqual(a, b) {
  if (a === b) return true
  if (a === null || b === null || typeof a !== "object" || typeof b !== "object") return false
  if (Array.isArray(a) !== Array.isArray(b)) return false
  const ka = Object.keys(a)
  if (ka.length !== Object.keys(b).length) return false
  return ka.every((k) => Object.prototype.hasOwnProperty.call(b, k) && deepEqual(a[k], b[k]))
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
 * 逐模型档位投影（`docs/desktop/design/PROJECT.md` §2 KD-18 端侧零族别自判）：`{ id, effortEnum,
 * thinkOff }` 三键闭集逐项——两判据单源 = 核 `specForModel(id).reasoningEffortEnum`
 * （`thincoder-core/model-specs.mjs:287`）与 `thinkOffPath(spec)`（`thincoder-core/think-off.mjs:22`）。
 * 未声明枚举 ⇒ `[]`（键恒在，渲染面免守卫——先例 = VSC 空枚举零渲染）；未登记模型 ⇒ 空枚举 +
 * 默认规格判据（核 `DEFAULT_SPEC` 非 effort 族 ⇒ off 可达）。
 */
const modelEntry = (id) => {
  const spec = specForModel(id)
  return { id, effortEnum: spec.reasoningEffortEnum ?? [], thinkOff: thinkOffPath(spec) }
}

/**
 * `model:list(payload)` ⇒ `{ ok, models }` ∥ `{ ok:false, models:[], reason }`——`payload.provider`
 * = provider **名**；`models` = 核 `listModels(provider)`（`thincoder-core/provider/list-models.mjs:96`）
 * 逐项经 `modelEntry` 投影为 `{ id, effortEnum, thinkOff }`（候选面 = 元素形；渲染面零自判）。
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
    return { ok: true, models: (await listModels(provider)).map((id) => modelEntry(id)) }
  } catch (e) {
    return { ok: false, models: [], reason: channelUnavailableMessage(e) }
  }
}
/** 写内新鲜读发现渠道条目已消失（跨进程改档微窗口）的**本档私记号**——外层捕 ⇒ `unknown-provider`
 *  回执（零写）；拒码闭集不因该窗口泄入核 / 端错误串。 */
const VANISHED = Symbol("vanished-provider")


/**
 * 档位写径（批 B · ⑥——`docs/desktop/design/IPC.md` §2「档位控件注」逐步落地）。
 * 拒码序 = **形态 → provider 存在 → level 合法**（三拒皆**零写**）：
 * - 形态：`tier` 非对象 / `model` 非非空串 / `level` 缺 ⇒ `invalid-patch`（载荷非三成员形）；
 * - provider 存在：名不在配置（含缺 / 空名——皆无对应条目）⇒ `unknown-provider`；
 * - level：`"auto"` 恒可；`"off"` 与 `"none"` 同径（`"none"` 不作独立档——语义由 `"off"` 承载）
 *   须 `thinkOffPath(spec)` 真；其余须 ∈ `specForModel(model).reasoningEffortEnum` ⇒ 表外（含非串 / 空串）
 *   ⇒ `bad-level`。
 * spec 单源 = 核 `specForModel(model)`；off 形单源 = 核 `thinkOffShape(spec)`（端侧零族别副本——KD-18）。
 * 写面 = 该渠道条目级默认两键（`thinking` / `reasoningEffort`：先清不相容记号，再按档落形）。
 */
function tierAgent(config, tier) {
  const bad = (reason) => ({ ok: false, reason, fields: agentFields(config) })
  if (tier === null || typeof tier !== "object" || Array.isArray(tier)) return bad("invalid-patch")
  const model = typeof tier.model === "string" ? tier.model.trim() : ""
  if (!model || tier.level === undefined || tier.level === null) return bad("invalid-patch")
  const provider = typeof tier.provider === "string" ? tier.provider.trim() : ""
  if (!resolveProviders().providers.some((p) => p.name === provider)) return bad("unknown-provider")
  const spec = specForModel(model)
  const level = tier.level
  const offish = level === "off" || level === "none"
  const member = typeof level === "string" && !offish && (spec.reasoningEffortEnum ?? []).includes(level)
  if (level !== "auto" && !offish && !member) return bad("bad-level")
  if (offish && !thinkOffPath(spec)) return bad("bad-level")
  const mutate = (disk) => {
    const entry = (Array.isArray(disk.providers) ? disk.providers : []).find((p) => p && p.name === provider)
    if (!entry) throw VANISHED
    if (offish) {
      entry.thinking = thinkOffShape(spec)
      delete entry.reasoningEffort
    } else if (level === "auto") {
      delete entry.thinking
      delete entry.reasoningEffort
    } else {
      if (deepEqual(entry.thinking, thinkOffShape(spec))) delete entry.thinking
      entry.reasoningEffort = level
    }
  }
  let w
  try {
    w = writeConfigAtomic(_configPath(), mutate)
  } catch (error) {
    // 写前检查与写内新鲜读之间的微窗口（跨进程改档）：条目消失 ⇒ 同上拒码，**零写**；其余错一律重抛不吞。
    if (error === VANISHED) return bad("unknown-provider")
    throw error
  }
  if (!w.ok) return { ok: false, reason: w.reason, fields: agentFields(loadConfig()) }
  return { ok: true, reason: null, fields: agentFields(loadConfig()) }
}

/**
 * `settings:agent(payload)`：读 `{}` ⇒ `{ ok, fields }`；写 `{ patch:{ "<点分路径>": value } }` ∥
 * `{ tier:{ provider, model, level } }`（**二择一**——档位为意图级载荷）⇒ `{ ok, reason, fields }`
 * （**写后回读**）。
 * 三档失败（§2.2 状态面②）：① 值校验拒绝 ⇒ 核 `_checkKnownKeyValue` 抛错 **零写盘**
 * （reason = 核错误串直传）；② mtime 冲突 ⇒ 核回执 `mtime-conflict`（`.bak-{ts}` 已留）；
 * ③ 路径形态非法 ⇒ `invalid-patch`。未知键**放行**（全量域 = 核语义——端侧不另立白名单）。
 * 二择一判定：有效键 = 非 `undefined`/`null`（故 `{}` / `{ patch:null }` 仍为读面）；两有效键同在 ⇒
 * `invalid-patch` ∥ 两皆无 ⇒ 读面；`{ tier }` 径另二拒见 `tierAgent`。
 */
export function settingsAgent(payload) {
  const config = loadConfig()
  const patch = payload?.patch
  const tier = payload?.tier
  const hasPatch = patch !== undefined && patch !== null
  const hasTier = tier !== undefined && tier !== null
  if (hasPatch && hasTier) return { ok: false, reason: "invalid-patch", fields: agentFields(config) }
  if (hasTier) return tierAgent(config, tier)
  if (!hasPatch) return { ok: true, fields: agentFields(config) }
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
