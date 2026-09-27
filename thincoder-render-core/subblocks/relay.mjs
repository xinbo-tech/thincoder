/**
 * relay.mjs — relay 事件 token → 子代理状态 patch（**映射单源**——设计 §5「状态机族」）。
 * 先例 = `thincoder-vscode/src/extension/panel-subagent-relay.mjs:101-147`（逐字搬迁：
 * 识别 → 剥除 → 映射 / pending 集 / queued 缓存 / 终态词全表；R2 后 VSC 该档经本件取值）。
 * 两端共用：VSC 扩展侧（绑 postMessage）/ 桌面主进程（绑 invoke）。**本档零 DOM 零宿主**——
 * Node 侧可直 import（`@thincoder/render-core/subblocks/relay.mjs`）。
 *
 * token → patch 全表 = 设计 §5（逐行实现；含 `⟦ev⟧stopped` ⇒ `cancelled` 与闭集零
 * `stopped` / `error` 产值两条裁定）。状态值闭集 = `started` / `queued` / `turn` / `done` /
 * `settled` / `cancelled`。
 *
 * 零依赖移植：relay 前缀文法（`role#id/`）权威 = `thincoder-core/agent/relay-prefix.mjs`；
 * 核包零依赖约束下不可 import 首方包 ⇒ 逐字移植（**漂移登记**：文法变更须同步本件）。
 * 端注入面：`deps = { syncLiveOf?, now?, onStripped? }`——`syncLiveOf` = 端 registry 只读采样
 * （X10 sync 可中止事实——核不可算）；`onStripped` = 嵌套剥除留痕（先例 `logEvent("ev:substrip")`）。
 */

/** `role#id/` prefix router — hyphen included since the eng-coder fix (2026-08-21).
 *  （逐字承 `thincoder-core/agent/relay-prefix.mjs:10`） */
export const RELAY_PREFIX_RE = /^([\w-]+)#(\d+)\//

/** 嵌套 relay 前缀通用解析（循环解析任意深度——逐字承 `relay-prefix.mjs:16-32`）：
 *  `eng-coder#2/explore#1/read` → { head（块路由）, inner[], label（inner 链）, rest }。
 *  单层 = inner[]/label ""；无前缀 → null。 */
export function relayPathOf(text) {
  const segments = []
  let rest = String(text)
  for (;;) {
    const m = rest.match(RELAY_PREFIX_RE)
    if (!m) break
    segments.push(`${m[1]}#${m[2]}`)
    rest = rest.slice(m[0].length)
  }
  if (segments.length === 0) return null
  return {
    head: segments[0],
    inner: segments.slice(1),
    label: segments.slice(1).join("/"),
    rest,
  }
}

/** per-scope relay 状态（端持有——VSC 每面板一件 / 桌面每宿主一件；多面板互不串味）。
 *  `pendingAsync`：`⟦ev⟧async` 已见、待 `[model]` 出生；`queued`：queued 四项缓存。 */
export function createRelayScope() {
  return { pendingAsync: new Set(), queued: new Map() }
}

/** queued 缓存读点（#118 R1/R2——重生投影载荷**同形单源**：`suspension.mjs` `reassertLiveChildren`
 *  的 queued 行四项取自本缓存）。未消费过该键的 queued token ⇒ null（降级态）。 */
export function queuedInfoOf(scope, key) {
  return scope?.queued?.get(key) ?? null
}

/** 快筛：本面形态（含 `⟦ev⟧` / `[model]` 字面 ∧ relay 前缀）——调用方消费判据（先例 `:85-87` 两判据同形）。 */
export function isRelayToken(token) {
  const text = String(token ?? "")
  if (!text.includes("⟦ev⟧") && !text.includes("[model]")) return false
  return relayPathOf(text) !== null
}

/**
 * 事件 token → webview / 宿主状态 patch（映射表见设计 §5 全表）。返回 `null` 双义：
 * 「已消费、无 patch」（`⟦ev⟧async` 只入 pending / 表外 `⟦ev⟧` 消费不泄漏 / 嵌套剥除不路由 /
 * 非协议行）与「非本面」——调用方以 `isRelayToken` 区分（其真 ∧ 本件 null ⇒ 已消费无载荷，
 * 不得原样转发）。
 *
 * `scope` = `createRelayScope()` 实例（端持有——**必给**：缺 scope 时 pending / queued 缓存不生效，
 * 池标记与排队头会静默降级 ⇒ 本件 fail-closed 直接报错，不静默退化）。
 * `deps = { syncLiveOf?, now?, onStripped? }`。
 */
export function relayEventToSubPatch(token, scope, deps = {}) {
  if (!scope) throw new Error("relayEventToSubPatch(token, scope, deps): scope required — use createRelayScope() (per-scope async-pending / queued-cache state)")
  const path = relayPathOf(token)
  if (!path) return null
  const hash = path.head.indexOf("#")
  const role = path.head.slice(0, hash)
  const id = Number(path.head.slice(hash + 1))
  const rest = path.rest
  // 判据射程（先例评审 #1 收窄）= 嵌套 ∧ `rest` 起于 `⟦ev⟧`／`[model]`：含字面形态的内层 text
  // chunk 不在射程（仍走内容面）。剥除不路由——防外层块头污染；留痕经 `deps.onStripped`。
  const nested = path.inner.length > 0
  if (nested && (rest.startsWith("⟦ev⟧") || rest.startsWith("[model]"))) {
    deps.onStripped?.({
      ch: `sub:${path.inner.at(-1)}`,
      outer: path.head,
      kind: rest.startsWith("[model]") ? "model" : rest.slice(4).split("\x1e")[0],
    })
    return null // 剥除不路由
  }
  if (rest.startsWith("⟦ev⟧async")) {
    scope.pendingAsync.add(path.head)
    return null // [model] 随行补发 started
  }
  if (rest.startsWith("[model]")) {
    const pool = scope.pendingAsync.delete(path.head) === true
    scope.queued.delete(path.head) // #118 R1：已启动 ⇒ 排队信息作废
    // X10：sync 出生面事实（pool=false 且 registry 命中 ⇒ `syncLive:true`）——async 块恒 false。
    return {
      status: "started",
      role,
      id,
      pool,
      model: rest.slice("[model]".length) || null,
      startedAt: (deps.now ?? Date.now)(),
      syncLive: !pool && deps.syncLiveOf?.(path.head) === true,
    }
  }
  if (rest.startsWith("⟦ev⟧queued")) {
    // 载荷：⟦ev⟧queued \x1e kind \x1e position \x1e queued \x1e detail（subagent-scheduler 发射面）
    const parts = rest.split("\x1e")
    const kind = parts[1]
    const detail = parts.slice(4).join("\x1e")
    const info = {
      kind: kind ?? null,
      position: Number(parts[2]) || null,
      waiting: kind === "slot" ? null : (kind === "depc" ? "dependency-cancelled" : "waiting-deps"),
      reason: kind === "slot" ? null : (detail || null),
    }
    scope.queued.set(path.head, info)
    return { status: "queued", role, id, ...info }
  }
  if (rest.startsWith("⟦ev⟧cancelled")) {
    // 核仅在 queued 取消路径发（出队即终态）
    scope.queued.delete(path.head) // #118 R1：出队即终态（cancelled(was:"queued")——头移除）
    return { status: "cancelled", was: "queued", role, id }
  }
  // #118 R1：终态分支同删缓存键（后世代的 queued 事件会重写缓存，陈旧项不得滞留）。
  // X6 收口（#134 ②）：`⟦ev⟧stopped` 第 4 位 = 恒定字面原因词 `stopped` ⇒ 与冻结头 verb 重复
  // ⇒ **零注记**（不传 `note`）；注记面（done 停因 / interrupted）零影响。
  if (rest.startsWith("⟦ev⟧stopped")) { scope.queued.delete(path.head); return { status: "cancelled", role, id } }
  if (rest.startsWith("⟦ev⟧settled")) { scope.queued.delete(path.head); return { status: "settled", role, id } }
  if (rest.startsWith("⟦ev⟧done")) { scope.queued.delete(path.head); return { status: "done", role, id } }
  if (rest.startsWith("⟦ev⟧turn")) {
    const parts = rest.split("\x1e")
    return { status: "turn", role, id, turn: Number(parts[1]) || 0, maxTurns: Number(parts[2]) || 0 }
  }
  if (rest.startsWith("⟦ev⟧")) return null // 其余核事件（approval 等——端另有通道）：消费不泄漏
  return null
}
