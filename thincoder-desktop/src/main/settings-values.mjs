/**
 * settings-values.mjs — 设置族**值面 ∕ 遮罩族**（R7 · 桌面功能对位批 · 批档 §2 R7 #4；先拆后改：
 * 自 `src/main/settings.mjs` 拆出 `MASK` … `deepEqual` —— 300 行层拆分，**零语义变化**）。
 *
 * 面：遮罩单点（`MASK` ∕ `maskKey` —— 判据 = 核**导出** `isSensitiveKey`，明文零下发）· 配置档存在性
 * （`isConfigured` = `existsSync(_configPath())`）· 叶展平 / 深遮罩 / 字段表（`kindOf` ∕ `flatten` ∕
 * `maskDeep` ∕ `agentFields`）· 点分路径写（`setKeyPath`）· 深比较（`deepEqual` —— 档位判据用）。
 * 单一 owner = 本档；`settings.mjs` ∕ `providers.mjs` 经原 import 面取（settings.mjs 同名 re-export，
 * 导出面零改）。
 * 纪律：零自写盘（写面唯一执行体 = 核 `writeConfigAtomic`）；核未导出的 helper 才端侧自持
 * （`MASK` 同形字面 ∕ `setKeyPath` ∕ `deepEqual`），判据面一律取核导出。
 */
import { existsSync } from "node:fs"
import { _configPath } from "@thincoder/core/config-io.mjs"
import { isSensitiveKey } from "@thincoder/core/agent-tools/settings.mjs"

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
export function agentFields(config) {
  return flatten(maskDeep("", config)).map(({ path, value }) => ({
    path,
    value,
    sensitive: isSensitiveKey(path),
    kind: kindOf(value),
  }))
}

/** 点分路径写入（核未导出该 helper——端侧小工具，语义同核 settings 工具：逐段下钻，缺段建对象）。 */
export function setKeyPath(obj, path, value) {
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
