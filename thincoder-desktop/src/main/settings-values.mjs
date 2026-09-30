/**
 * settings-values.mjs — 设置族**值面 ∕ 遮罩族**（R7 · 桌面功能对位批 · 批档 §2 R7 #4；先拆后改：
 * 自 `src/main/settings.mjs` 拆出 `MASK` … `deepEqual` —— 300 行层拆分，**零语义变化**）。
 *
 * 面：遮罩单点（`MASK` = 核 `MASKED` ∕ `maskKey` —— 判据 = 核**导出** `isSensitiveKey`，明文零下发）· 配置档存在性
 * （`isConfigured` = `existsSync(_configPath())`）· 叶展平 / 深遮罩 / 字段表（`kindOf` ∕ `flatten` ∕
 * `maskDeep` ∕ `agentFields`）· **slot 权威键单源**（`SLOT_AUTHORITY_PATHS` —— S14a 随迁：读面经 `agentFields` 第五键
 * `slotAuthority` 标注 ∕ 写面拒码取用）· 点分路径写（`setKeyPath`）· 深比较（`deepEqual` —— 档位判据用）。
 * 单一 owner = 本档；`settings.mjs` ∕ `providers.mjs` 经原 import 面取（settings.mjs 同名 re-export，
 * 导出面零改）。
 * 纪律：零自写盘（写面唯一执行体 = 核 `writeConfigAtomic`）；核未导出的 helper 才端侧自持
 * （`setKeyPath` ∕ `deepEqual`——遮罩字面已收编核 `MASKED`），判据面一律取核导出。
 */
import { existsSync } from "node:fs"
import { _configPath } from "@thincoder/core/config-io.mjs"
import { MASKED, isSensitiveKey } from "@thincoder/core/agent-tools/settings.mjs"

/** 遮罩字面量（**单源** = 核 `MASKED`——B10 S13 收编：核导出 ∕ 端侧零自持副本）。 */
export const MASK = MASKED

/**
 * **端侧遮罩单点**：敏感键 ⇒ 遮罩字面量，否则原值直通。判据复用核**导出**的
 * `isSensitiveKey`（`thincoder-core/agent-tools/settings.mjs:22`——段名判据）；遮罩字面同取核
 * `MASKED`（B10 S13 转 export——端侧零副本）。
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

/** **S14a（自 `settings.mjs` 随迁 —— 单源随迁：主进程 ∕ 渲染面同此一份）**：slot 权威键（会话槽面键 ——
 *  唯一写面 = `session:flags` 模式位槽写）：通用保存不可达
 *  （VSC 侧同裁 = `agent.engineering` 白名单删项 ∕ `agent.advisor.guard` 非 payload 字段）；拒码 `slot-authority`。
 *  读面标注径 = `agentFields` 第五键（渲染面据此收窄为只读行 —— #617-CH；写面拒位住 `settings.mjs`）。 */
export const SLOT_AUTHORITY_PATHS = Object.freeze(["agent.advisor.guard", "agent.engineering"])

/** 读面字段表：`{ path, value, sensitive, kind, slotAuthority }`——值一律经 `maskDeep` 出口（遮罩单点）；
 *  `slotAuthority` = 会话槽权威键族标注（读面权威位 —— 渲染面呈只读行，不入提交 patch）。 */
export function agentFields(config) {
  return flatten(maskDeep("", config)).map(({ path, value }) => ({
    path,
    value,
    sensitive: isSensitiveKey(path),
    kind: kindOf(value),
    slotAuthority: SLOT_AUTHORITY_PATHS.includes(path),
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

/** 点分路径删键（**显式清除**面 —— 沿核 `_checkKnownKeyValue`「null = 显式清除」语义：patch 值为 null ⇒ 删键；
 *  B10 W3 · S10 ∕ S11 写链落点；缺段 ⇒ 无操作；父段空对象残留不清理——读面按缺键同判）。 */
export function deleteKeyPath(obj, path) {
  const segs = String(path).split(".")
  let cur = obj
  for (let i = 0; i < segs.length - 1; i++) {
    if (cur === null || typeof cur !== "object") return
    cur = cur[segs[i]]
  }
  if (cur !== null && typeof cur === "object") delete cur[segs[segs.length - 1]]
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
