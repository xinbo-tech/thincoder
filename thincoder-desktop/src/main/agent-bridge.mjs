/**
 * agent-bridge.mjs — 宿主装配桥的**回调桥**出档（批 8 §1.14 ③：宿主档触行数拉线，按在册预案拆分；
 * 档名实施舱定）。三面单源（原 `agent-host.mjs` 同名面逐字搬运）：① 活动名闭集 `ACTIVITY_EVENTS`；
 * ② 协议行解析 `parseEvToken`（正则 `EV_RE` + relay 前缀 `RELAY_HEAD_RE`）；③ 十一回调 ⇒ `ev:*` 出站
 * 通道映射 `createBridge`（R3a：回调十键 —— 增 `onUsage`，非独立通道 ⇒ 累入会话级令牌表；R3c：增 `onReasoning` ⇒ `ev:reasoning`，D19 推理块接线）。工具参数摘要 `summarizeArgs` 同行（回调桥与待决门 payload 共用一份口径 ——
 * `suspensions.mjs` 引用本档，不复制）。
 * **R3b（D20 · `docs/desktop/design/UI.md` §1 本批注项 2 / `docs/desktop/design/IPC.md` §1 `ev:subagent` 行）**：
 *  ① relay 分流——relay 前缀 token（`⟦ev⟧` / `[model]` 族）⇒ `ev:subagent`（映射**单源** = 核
 *     `@thincoder/render-core` `relayEventToSubPatch`；前缀剥除在核 ⇒ 渲染面零析 `role#id/`）；
 *  ② 前缀内容 chunk（text / think / 工具调用行 / 工具输出行）⇒ 子 agent 面消费（**不入对话流** —— KD-RC-6：
 *     内容零回显，不进流也不进块；工具名不作第二展示面——D20 块形无工具位）；
 *  ③ `reassertLive` = **存活投影挂点**（出生自愈：宿主 2s 拍体逐键调用，只发在飞实例）。
 * **R3c（D19 · `docs/desktop/design/IPC.md` §1 `ev:reasoning` 行）**：`onReasoning` ⇒ `ev:reasoning`（载荷
 * `{ key, text }`——与正文同形；续写判据 = 尾块 `kind === "reasoning"`，归约面 `renderer/events.mjs` 同源）。
 * 依赖面 = 注入（零宿主依赖 ⇒ 平 node 直测）：`post(channel, payload)` = 主进程出站面 ·
 * `askSingle` / `askBatch` / `askQuestion` = 三门挂起（表与 resolve 在 `suspensions.mjs`，本档只转口、不持表）·
 * `syncLiveOf(key, head)` = 核 sync registry 只读采样（X10 可中止事实——核不可算，须端供给）。
 */
import {
  createRelayScope, isRelayToken, queuedInfoOf, relayEventToSubPatch, relayPathOf,
} from "@thincoder/render-core/subblocks/relay.mjs"

/** 活动名闭集（SHELL.md §4 · IPC.md §1 桥面）：`⟦ev⟧` 出发的八名 —— 表外名（子代理中继）原样透传（形状同一）。 */
export const ACTIVITY_EVENTS = Object.freeze(["turn", "queued", "async", "settled", "stopped", "done", "cancelled", "approval"])

/** 协议行：`⟦ev⟧<名>` ∥ `⟦ev⟧<名>\x1e<字段原样>`（字段原样 = `\x1e` 分隔串，不拆分）。 */
const EV_RE = /^⟦ev⟧([^\x1e]+)(?:\x1e([\s\S]*))?$/
/** relay 前缀（核子代理中继形如 `advisor#7/`）——仅字母数字与 `.#-/` ⇒ 先剥再严格匹配（防把普通文本当协议）。 */
const RELAY_HEAD_RE = /^[A-Za-z0-9_.#\-/]*$/

/** 单条 token 的协议解析：非协议 ⇒ null；relay 前缀先剥再解析（核 `agent-tools/subagent-run.mjs` 同族 token）。 */
export function parseEvToken(text) {
  const raw = String(text)
  const at = raw.indexOf("⟦ev⟧")
  if (at < 0) return null
  if (at > 0 && !RELAY_HEAD_RE.test(raw.slice(0, at))) return null
  const hit = EV_RE.exec(raw.slice(at))
  return hit ? { event: hit[1], fields: hit[2] ?? null } : null
}

/** 工具参数摘要（展示面自持小函数 —— 形仿卡片头口径，不引他端模块）：单行 · 按工具挑关键字段 · 截断。 */
export function summarizeArgs(name, args) {
  if (!args || typeof args !== "object") return ""
  const a = args
  const one = (v) => String(v ?? "").replace(/\s+/g, " ").trim()
  const cut = (s, n = 60) => (s.length > n ? `${s.slice(0, n)}…` : s)
  switch (name) {
    case "bash": case "cmd-shell":
      return cut(one(a.command) + (a.workdir ? `  (in ${one(a.workdir)})` : ""))
    case "read": case "write": case "edit": case "hashline_edit": case "insert_after": case "apply_patch":
      return cut(a.path ? `"${one(a.path)}"` : one(a.filePath))
    case "grep": case "glob": case "code_search": case "doc_search":
      return cut(`/${one(a.pattern ?? a.query)}/${a.path ? ` in "${one(a.path)}"` : ""}`)
    case "ls": return cut(a.path ? one(a.path) : ".")
    case "question": return cut(one(a.question))
    case "subagent": case "advisor": return cut(one(a.task || a.action || a.type))
    default:
      try { return cut(JSON.stringify(a), 80) } catch { return "" }
  }
}

/** 十一回调桥（`⟦ev⟧` 协议行 ⇒ `ev:activity` / relay 族 ⇒ `ev:subagent`；非协议 ⇒ `ev:token` 文本面；
 *  推理 chunk ⇒ `ev:reasoning`）——十键为 `ev:*` 出站映射，第十一键 `onUsage` 非通道（见下）；
 *  `reassertLive` = 存活投影挂点（宿主拍体调用面）：
 *  `createBridge({post, askSingle, askBatch, askQuestion, tokensOf, syncLiveOf, now})` ⇒ `bridge(key)`。每帧 `key` 前置并入
 *  （帧 payload 自带同名键时后者胜 —— 形状同原实现）。
 *  relay 面 per-键 scope（`pendingAsync` / `queued` 缓存——核 `createRelayScope`；**多会话互不串味**：
 *  各键 `role#id` 可同名，缓存不得跨键共享）。 */
export function createBridge({ post, askSingle, askBatch, askQuestion, tokensOf, syncLiveOf, now }) {
  const scopes = new Map() // 会话键 → relay scope（懒建 · 随键存活）
  const scopeOf = (key) => {
    if (!scopes.has(key)) scopes.set(key, createRelayScope())
    return scopes.get(key)
  }
  /** 桥面句柄（每键一份回调面）；scope 回收出口见尾。 */
  const bridge = (key) => {
    const at = (channel, payload) => post(channel, { key, ...payload })
    const scope = scopeOf(key)
    /** 子 agent 状态 patch 出站（relay 分流与存活投影两路共用单点）。 */
    const sub = (patch) => { at("ev:subagent", patch); return true }
    return {
      onToken: (text) => {
        // ① relay 分流（KD-RC-6）：relay 前缀 token 一律本面消费——映射单源 = 核 `relayEventToSubPatch`
        //（`⟦ev⟧async` 只入 pending / 嵌套剥除 / 表外 ⟦ev⟧ / 非协议行 ⇒ patch `null` ⇒ 消费不泄漏）。
        if (isRelayToken(text)) {
          const patch = relayEventToSubPatch(text, scope, {
            syncLiveOf: typeof syncLiveOf === "function" ? (head) => syncLiveOf(key, head) === true : undefined,
            now,
          })
          if (patch) sub(patch)
          return true
        }
        // ② 前缀内容 chunk（无 ⟦ev⟧ / [model] 字面 ⇒ 非事件面）：子 agent 面消费——**不入对话流**
        //（零内容回显；前缀字面不得泄漏入主流 —— KD-RC-6 修漏面）。
        if (relayPathOf(text) !== null) return true
        const ev = parseEvToken(text)
        // 判别写死（IPC.md:31）：`fields` 键在场 = 内联形（零回合尾、不作回合起）——无分隔则值为 `null`。
        return ev
          ? at("ev:activity", { event: ev.event, fields: ev.fields })
          : at("ev:token", { text })
      },
      /** 存活投影挂点（**出生自愈** —— 宿主 2s 拍体调用面；单源 = `docs/render-core/design/RENDER-CORE.md` §5
       *  「存活投影变体」）：枚举本 agent 的在飞池条目 ⇒ 逐条 `[model]` 形 / queued 形 `ev:subagent`（只发在飞
       *  两态 —— 终态出表 ⇒ 零再断言不复活）。**`syncLive` 硬编码 false**（投影只枚举池条目〔async〕⇒ 恒假）；
       *  queued 四字段取自本键 relay 缓存（`queuedInfoOf` —— 与 live 中继面**同形**；缓存缺省 ⇒ 只携 `position`）。
       *  载体口径同核 `carrierField`（agent 字段 ∥ `agent.history` 字段——VSC 形 pending 挂 history）。返回本拍投递条数。 */
      reassertLive: (agent) => {
        let count = 0
        for (const field of ["_asyncSubagents", "_asyncAdvisors"]) {
          const own = agent?.[field]
          const carrier = own instanceof Map ? own : agent?.history?.[field]
          if (!(carrier instanceof Map)) continue
          for (const entry of carrier.values()) {
            if (entry?.role == null || entry?.id == null) continue
            if (entry.status === "running") {
              sub({ status: "started", role: entry.role, id: entry.id, pool: true, model: entry.model ?? null, startedAt: entry.startedAt, syncLive: false })
              count += 1
            } else if (entry.status === "queued") {
              const info = queuedInfoOf(scope, `${entry.role}#${entry.id}`)
              sub({
                status: "queued", role: entry.role, id: entry.id,
                position: info ? (info.position ?? null) : (entry.position ?? null),
                ...(info ? { waiting: info.waiting, reason: info.reason, kind: info.kind } : {}),
              })
              count += 1
            }
          }
        }
        return count
      },
      // 推理块增量（R3c · 核 `callbacks.onReasoning(text)` —— `thincoder-core/agent.mjs:273` ⇒ `ev:reasoning`；
      // 与正文同形（`docs/desktop/design/IPC.md` §1 该行）；续写判据归归约面（尾块 `kind === "reasoning"`）。
      // **relay 前缀分流**（**与 `onToken` 同律 —— KD-RC-6**）：子代理 / advisor 的 think chunk 带 `role#id/` 前缀
      // （核 `agent/spawn-child.mjs:152-153` · `agent-tools/advisor-async.mjs:275` —— 且核对 `onReasoning` **无**流式门）
      // ⇒ 子 agent 面消费（内容零回显 —— D20 块面无内容位；前缀字面不得泄漏入主流）。
      onReasoning: (text) => (relayPathOf(String(text)) !== null ? true : at("ev:reasoning", { text })),
      onAgentTurn: (n, max) => at("ev:activity", { event: "turn", n, max }),
      onToolCall: (name, args, id) => (relayPathOf(String(name)) !== null
        ? true // 子 agent 工具调用行 ⇒ 子 agent 面消费（不进对话流 —— KD-RC-6）
        : at("ev:tool-call", { id, name, argsSummary: summarizeArgs(name, args) })),
      onToolOutput: (name, chunk, id) => (relayPathOf(String(name)) !== null
        ? true // 子 agent 工具输出行 ⇒ 子 agent 面消费（同上；不带前缀者才入流）
        : at("ev:tool-output", { id, chunk })),
      onToolResult: (name, result, id, subKey) =>
        at("ev:tool-result", { id, ok: !String(result).startsWith("Error:"), result, ...(subKey ? { subKey } : {}) }),
      onPermissionRequest: (name, args) => askSingle(key, name, args),
      onBatchPermissionRequest: (req) => askBatch(key, req),
      // 作答门（`question` 工具 ⇒ 用户真作答）：转口 `askQuestion` ⇒ 返**悬起 Promise**（出站与结算住
      // `suspensions.mjs` —— 桥零文案）；工具结果 = 作答串 ∥ 取消串（`QUESTION_CANCELLED`）。
      onQuestion: (question, options) => askQuestion(key, question, options),
      onTaskUpdate: (items) => at("ev:task", { items }),
      // 用量回调（R3a · 核 `callbacks.onUsage(response.usage)` —— `thincoder-core/agent.mjs:353`）：**非独立通道** ——
      // 逐次响应累入本键会话级令牌表（`tokensOf(key)` 注入；表缺 ⇒ 零动作），随宿主回合尾 `ev:usage` 载荷出
      // （`docs/desktop/design/IPC.md` §1 `ev:usage` 行「载荷扩」）。
      onUsage: (usage) => accumulateTokens(tokensOf?.(key), usage),
    }
  }
  /** scope 回收（宿主 `dispose` 面 —— R3b：会话删除 / 装配实例清除时调用；防同键重开继承陈旧 pending / queued 缓存）。 */
  bridge.dropScope = (key) => { scopes.delete(key) }
  return bridge
}

/** 令牌累计（**纯函数** —— 表原地累加并回原表；CLI 同源映射 = `thincoder-cli/src/tui/tool-events.mjs:400-405`）：
 *  五键 = `prompt` / `completion` / `reasoningTokens` / `cacheHit` / `cacheMiss`；`tally` 非载体 ⇒ 原样返回（零抛）。 */
export function accumulateTokens(tally, usage) {
  if (tally === null || typeof tally !== "object") return tally
  const num = (value) => (typeof value === "number" && Number.isFinite(value) ? value : 0)
  tally.prompt += num(usage?.prompt_tokens)
  tally.completion += num(usage?.completion_tokens)
  tally.reasoningTokens += num(usage?.completion_tokens_details?.reasoning_tokens)
  tally.cacheHit += num(usage?.prompt_cache_hit_tokens)
  tally.cacheMiss += num(usage?.prompt_cache_miss_tokens)
  return tally
}
