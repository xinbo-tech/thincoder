/**
 * client-identity.mjs — 客户端标识单源（产品名 ∥ 端类型 ∥ 版本）——PROVIDER.md §6.17
 *   「客户端标识头（`User-Agent`）」。
 *
 * 核件**不猜自己在哪个端**：不读 `process.argv` ∥ 环境变量 ∥ 任何 `package.json`。四端（cli ∥ vscode ∥
 * desktop ∥ server）各在进程内 `setClientIdentity` 一次（前三端 = 启动期求值；server = 核装载成功处——
 * 无核即无模型请求）；无人声明 ⇒ 哨兵 `core/0.0.0`（真实端版本恒不等于 `0.0.0`——四端进程内出现即声明漏了）。
 *
 * `withUserAgent` 是全部装配点的唯一入口：**先删任何大小写变体的 `user-agent` 键**，再写本产品值——
 * 渠道配置 `providers[].headers` 因此盖不掉它（`fetch` 的 `Headers` 对大小写变体同名键是合并语义，
 * 只靠「后写覆盖」会得 `evil, ThinCoder/…` 双值）。
 *
 * 同一入口也是定制头值位模板 `${sessionId}` 的解析单源（PROVIDER.md §6.17「会话标识头」）：
 * **每次请求现取** `getSessionId()`，值不冻结进 provider 对象；只有声明该模板的渠道才发对应的头。
 */

import { getSessionId } from "./session-identity.mjs"

/** 可声明的端 = 既有端名（单源 = 端名声明 `session-slots.mjs`），统一小写。`core` 不在其中——
 *  它是「无人声明」的哨兵面，不是可声明的端。 */
const SURFACES = Object.freeze(["cli", "vscode", "desktop", "server"])

/** 进程级单值（初值 = 哨兵；见档头注）。 */
let identity = { surface: "core", version: "0.0.0" }

/** 会话标识头的值位变量（PROVIDER.md §6.17）：定制头值里的 `${sessionId}` 于每次请求装配时替换为
 *  本进程会话 id。只认这一个固定串——别的 `${…}` 不是变量，不加变量词表。 */
const SESSION_REF = "${sessionId}"

/** 声明本进程的客户端标识（端壳在进程启动期一次）。两个入参都在声明点校验——场景 = 端接线笔误
 *  （surface 写错字面 / 漏传 version），抛在启动期求值处，不进生产请求（落哨兵或 `undefined`
 *  会把笔误永久藏成「编程调用」与「版本未知」）。 */
export function setClientIdentity({ surface, version } = {}) {
  if (!SURFACES.includes(surface)) {
    throw new Error(`setClientIdentity: unknown surface "${surface}" — expected one of: ${SURFACES.join(" | ")}`)
  }
  if (typeof version !== "string" || version.trim() === "") {
    throw new Error(`setClientIdentity: missing version for surface "${surface}" — expected the end's package.json version string`)
  }
  identity = { surface, version }
}

/** 当前标识（副本——调用方零共享可变态）。 */
export function clientIdentity() {
  return { ...identity }
}

/** 产品标识头值：`ThinCoder/<surface>/<version>`（三段固定——首段按产品名精确匹配即可聚合）。 */
export function userAgent() {
  return `ThinCoder/${identity.surface}/${identity.version}`
}

/** 值位模板解析（单串精确替换）：整值与内嵌同解、可多处。"${sessionId}" 之外的 `${…}` 按构造原样
 *  出站——不做变量识别，故没有「识别失败」这一支、也没有兜底路径（写法笔误出站就是该字面）。
 *  非字符串值原样通过（同 `env-ref.mjs:29` 的类型门；配置链路经装载面净化只到字符串值，该门只兜
 *  直接调本函数的面：单测 ∥ 编程调用）。 */
function resolveSessionRefs(value) {
  return typeof value === "string" ? value.replaceAll(SESSION_REF, getSessionId()) : value
}

/** 装配面入口：① 解析值位模板 `${sessionId}` → ② **删任何大小写变体的 `user-agent` 键** →
 *  ③ 写本产品值。消费形态 = 各 transport 的 header 对象内联展开：
 *  `{ ...withUserAgent(provider.headers), ...内置头 }`。 */
export function withUserAgent(headers = {}) {
  const out = {}
  for (const [key, value] of Object.entries(headers ?? {})) out[key] = resolveSessionRefs(value)
  for (const key of Object.keys(out)) if (key.toLowerCase() === "user-agent") delete out[key]
  out["User-Agent"] = userAgent()
  return out
}
