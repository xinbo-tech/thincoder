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
 */

/** 可声明的端 = 既有端名（单源 = 端名声明 `session-slots.mjs`），统一小写。`core` 不在其中——
 *  它是「无人声明」的哨兵面，不是可声明的端。 */
const SURFACES = Object.freeze(["cli", "vscode", "desktop", "server"])

/** 进程级单值（初值 = 哨兵；见档头注）。 */
let identity = { surface: "core", version: "0.0.0" }

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

/** 装配面入口：复制渠道定制头 → **删任何大小写变体的 `user-agent` 键** → 写本产品值。
 *  消费形态 = 各 transport 的 header 对象内联展开：`{ ...withUserAgent(provider.headers), ...内置头 }`。 */
export function withUserAgent(headers = {}) {
  const out = {}
  for (const [key, value] of Object.entries(headers ?? {})) {
    if (key.toLowerCase() === "user-agent") continue
    out[key] = value
  }
  out["User-Agent"] = userAgent()
  return out
}
