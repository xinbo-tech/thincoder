/**
 * agent-bridge.mjs — 宿主装配桥的**回调桥**出档（批 8 §1.14 ③：宿主档触行数拉线，按在册预案拆分；
 * 档名实施舱定）。三面单源（原 `agent-host.mjs` 同名面逐字搬运）：① 活动名闭集 `ACTIVITY_EVENTS`；
 * ② 协议行解析 `parseEvToken`（正则 `EV_RE` + relay 前缀 `RELAY_HEAD_RE`）；③ 十一回调 ⇒ `ev:*` 出站
 * 通道映射 `createBridge`（R3a：回调十键 —— 增 `onUsage`，非独立通道 ⇒ 累入会话级令牌表；R3c：增 `onReasoning` ⇒ `ev:reasoning`，D19 推理块接线）。工具参数摘要 `summarizeArgs` 同行（回调桥与待决门 payload 共用一份口径 ——
 * `suspensions.mjs` 引用本档，不复制）。
 * **R3b（D20 · `docs/desktop/design/UI.md` §1 本批注项 2 / `docs/desktop/design/IPC.md` §1 `ev:subagent` 行）**：
 *  ① relay 分流——relay 前缀 token（`⟦ev⟧` / `[model]` 族）⇒ `ev:subagent`（映射**单源** = 核
 *     `@thincoder/render-core` `relayEventToSubPatch`；前缀剥除在核 ⇒ 渲染面零析 `role#id/`）；
 *  ② 前缀内容 chunk（text / think / 工具调用行 / 工具输出行）⇒ **内容面**（「对齐第二批」项 3 KD-RC-6 收正：
 *     内容回显 = 核件 tail-3 / 展开）——四面分流 ⇒ `ev:subchunk`（载荷 `{ role, id, kind, text, sub?, tool?, face?, cmd? }`
 *     —— 前缀剥除在本档 ⇒ 渲染面零析 `role#id/`；内容渲染单源 = 核件）；
 *  ③ `reassertLive` = **存活投影挂点**（出生自愈：宿主 2s 拍体逐键调用，只发在飞实例）。
 * **R3c（D19 · `docs/desktop/design/IPC.md` §1 `ev:reasoning` 行）**：`onReasoning` ⇒ `ev:reasoning`（载荷
 * `{ key, text }`——与正文同形；续写判据 = 尾块 `kind === "reasoning"`，归约面 `renderer/events.mjs` 同源）。
 * **对齐第三批（`docs/desktop/design/UI.md` §1 本批注 · `docs/desktop/design/IPC.md` §1 载荷五处增键）**：
 *  ① 工具失败判据 = 核 `isToolFailure` 单源（项 2）；② `onPermissionRequired` 四参缝 ⇒ 载荷 `owner` / `diff`
 *  （B1 / 相抵①）；③ `onSubagentApproval` ⇒ `ev:subagent { status: "approval" }`（B5）；④ `onTurnEnd` ⇒
 *  `ev:activity { event: "turnBreak" }`（A7）；⑤ advisor 轮次采样 ⇒ `ev:tool-call` `round` / `model`（A14）；
 *  ⑥ `ev:tool-result` 增 `links`（验存文件链接——相抵② · KD-39）。后三项各由注入面供料（见下 `createBridge`）。
 * **R3（#520 · `onDistilled` 蒸馏落位）**：回调桥增 `onDistilled`（核 `explore-distill.mjs:150` —— 蒸馏落地时点）
 *  ⇒ 经注入面 `persistDistilled(key)` **立即重落盘**（**非出站通道**；落盘动作在注入面 —— 桥零宿主依赖律不破；
 *  端侧装配 = `agent-host.mjs` ⇒ `session-io.mjs` `saveDistilledSlot`；CLI `tool-events.mjs:397` ∕ VSC
 *  `panel-callbacks.mjs:242` 同式）。
 * **R4（提示锚 + 状态面 · `docs/batches/2026-09-28-desktop-feature-parity.md` §2.4 R4）**：增四回调 ——
 *  `onWait`（核 `agent.mjs:285` 透传 provider 链 ⇒ `ev:statusText`；相位 → kind 映射 = 核单源
 *  `provider/wait-status.mjs` `waitStatusOf`，`warn` ∕ 未知相位 ⇒ 零载波）· `onCompressStart` ∕ `onCompress` ∕
 *  `onCompressFail`（核 `context.mjs:304` ∕ `agent/run-stages.mjs:89/:98/:106` ⇒ `ev:compress` 四态载荷
 *  ——起跑 ∕ 完成 ∕ 降级 ∕ 失败；形 = VSC `panel-callbacks.mjs:175-183` 同式，词面渲染归渲染面）。
 * **R5（子代理面 · 同批 §2.4 R5 —— `#521` ∕ B10）**：① `onToolResult` 检两锚（核 `child-marks.mjs` `TURN_CAP_MARK` ∕
 *  `STOPPED_MARK`）⇒ sync 子代理 `done` 补发 + 块头注记载荷（X6 判据，逐字同 CLI `tool-events.mjs:217` ∕
 *  VSC `panel-callbacks.mjs:102-103`；同点收口 `subKey` 消费 = sync 块冻结）；② 增 `goalOf` 采样注入面 ——
 *  goal 工具结果时点采样 ⇒ `ev:goal`（核 `agent.goal` 单源；值形对齐核卡渲染预期）。
 * 依赖面 = 注入（零宿主依赖 ⇒ 平 node 直测）：`post(channel, payload)` = 主进程出站面 ·
 * `askSingle` / `askBatch` / `askQuestion` = 三门挂起（表与 resolve 在 `suspensions.mjs`，本档只转口、不持表）·
 * `syncLiveOf(key, head)` = 核 sync registry 只读采样（X10 可中止事实——核不可算，须端供给）。
 */
import {
  createRelayScope, isRelayToken, queuedInfoOf, relayEventToSubPatch, relayPathOf,
} from "@thincoder/render-core/subblocks/relay.mjs"
// 工具失败判据（「对齐第三批」项 2 —— 核单源；半 / 全角 `Error[:：]` 头 ∪ 独立成行状态位）。
import { isToolFailure } from "@thincoder/render-core/lib.mjs"
// 等待相位 → `ev:statusText` kind 映射（R4 —— 核单源 `provider/wait-status.mjs`：`gate` ∕ `retry` ∕ `overloaded` ∕
// `quota` 四相 ⇒ kind；`warn` ∕ 未知相位 ⇒ `null` 不显示——本端零相位枚举 ∕ 零自铸词）。
import { waitStatusOf } from "@thincoder/core/provider/wait-status.mjs"
// 子 agent 报告文本锚点（R5 · #521 —— 核零依赖叶**单源**：`TURN_CAP_MARK` ∕ `STOPPED_MARK`；块头注记判据）。
import { STOPPED_MARK, TURN_CAP_MARK } from "@thincoder/core/agent/child-marks.mjs"

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

/** sync 子代理完成注记（R5 · #521 —— X6 注记判据，**逐字同** CLI `tool-events.mjs:217` ∕ VSC `panel-callbacks.mjs:102-103`）：
 *  `TURN_CAP_MARK` ⇒ `turn cap reached — work may be partial`；`STOPPED_MARK` ⇒ `stopped by user — work may be partial`；
 *  否则 `null`（零注记 —— **不伪造**）。锚常量 = 核单源（`child-marks.mjs`），禁字面复制；注记的块头渲染
 *  （尾接 ` — <note>` ∕ 归一拍平 ≤140）归核件 `subblocks/activity-view.mjs` 直出（端零文案自铸）。 */
function syncNoteOf(result) {
  const text = String(result ?? "")
  if (text.includes(TURN_CAP_MARK)) return "turn cap reached — work may be partial"
  if (text.includes(STOPPED_MARK)) return "stopped by user — work may be partial"
  return null
}

/** goal 面投影（R5 · B10 —— 逐字同 VSC `agent.mjs:409-411`：`active` 原样 ∕ `complete ⇒ done` ∕ 余（`blocked`）原样；
 *  goal 缺席（取消 ∕ 未设）⇒ `{ status: "cancelled" }`）。核 `agent.goal` = 唯一写者（goal 工具）⇒ 单源；
 *  值形对齐核卡渲染预期（`cards/panel.mjs` `renderGoalPanel` 读 `{ status, objective, criteria }`）。 */
function goalInfoOf(goal) {
  if (!goal) return { status: "cancelled" }
  return {
    status: goal.status === "active" ? "active" : goal.status === "complete" ? "done" : goal.status,
    objective: goal.objective,
    criteria: goal.criteria,
  }
}

/** relay 前缀内容 chunk 四面分流（「对齐第二批」项 3 —— 构造面同形 = 扩展端先例
 *  `thincoder-vscode/src/extension/panel-subagent-relay.mjs:172-191`）：relay 前缀（含嵌套链）⇒ `ev:subchunk`
 *  载荷（**前缀剥除在本档** ⇒ 渲染面零析 `role#id/`）；无前缀 ⇒ `null`（调用面原样转发）。
 *  面随载荷（`face` —— 四面 text / think / toolCall / toolOutput）；工具面两形携结构化 `tool`（relay 前缀 rest 逐字）
 *  与 `cmd`（仅 `toolCall` 且有 `command`）；嵌套链折 `sub`（`/` 连接 —— D-M8 子标）。 */
function subChunkOf(face, a, b) {
  const path = relayPathOf(String(a ?? ""))
  if (path === null) return null
  const hash = path.head.indexOf("#")
  const identity = { role: path.head.slice(0, hash), id: Number(path.head.slice(hash + 1)) }
  const sub = path.inner.length > 0 ? { sub: path.inner.join("/") } : {}
  if (face === "toolCall") {
    const argsJson = JSON.stringify(b) || ""
    return {
      ...identity, kind: "tool", text: `${path.rest} ${argsJson.slice(0, 120)}`, ...sub, tool: path.rest, face,
      ...(typeof b?.command === "string" ? { cmd: b.command } : {}),
    }
  }
  if (face === "toolOutput") {
    return { ...identity, kind: "tool", text: typeof b === "string" ? b : String(b?.text ?? ""), ...sub, tool: path.rest, face }
  }
  return { ...identity, kind: face === "think" ? "think" : "text", text: path.rest, ...sub, face }
}

/** 十一回调桥（`⟦ev⟧` 协议行 ⇒ `ev:activity` / relay 族 ⇒ `ev:subagent` / 前缀内容 chunk ⇒ `ev:subchunk`；
 *  非协议 ⇒ `ev:token` 文本面；推理 chunk ⇒ `ev:reasoning`）——十键为 `ev:*` 出站映射，第十一键 `onUsage` 非通道（见下）；
 *  **R4 增四回调**（`onWait` ⇒ `ev:statusText`；`onCompressStart` ∕ `onCompress` ∕ `onCompressFail` ⇒ `ev:compress`——见档头 R4 注）；
 *  `reassertLive` = 存活投影挂点（宿主拍体调用面）：
 *  `createBridge({post, askSingle, askBatch, askQuestion, tokensOf, syncLiveOf, now, advisorOf, extractLinks})` ⇒ `bridge(key)`。每帧 `key` 前置并入
 *  （帧 payload 自带同名键时后者胜 —— 形状同原实现）。
 *  **对齐第三批两注入面（皆可缺省 —— 缺 ⇒ 该项零载波，零连带）**：`advisorOf(key)` = advisor 轮次只读采样
 *  （宿主 `agent-host.mjs` 供 `_advisorRound` / `provider.model`；返回 `null` ⇒ 不携两键）；
 *  `extractLinks(text)` = 验存文件链接（宿主 `file-links.mjs` 供 —— 盘上存在闸 + 去重 + 封顶；缺 ⇒ 零链接键）·
 *  `persistDistilled(key)` = 蒸馏落位（R3 · #520 —— `onDistilled` 时点按本键重落盘；缺 ⇒ 零动作）·
 *  `goalOf(key)` = 目标面**只读采样**（R5 · B10 —— 宿主 `agents.get(key)?.goal ?? null` 供；**不可判（agent 缺席）⇒ `undefined`**
 *  ⇒ 零载波；`null` = goal 缺席（取消）——两义不可合）。
 *  relay 面 per-键 scope（`pendingAsync` / `queued` 缓存——核 `createRelayScope`；**多会话互不串味**：
 *  各键 `role#id` 可同名，缓存不得跨键共享）。 */
export function createBridge({ post, askSingle, askBatch, askQuestion, tokensOf, syncLiveOf, now, advisorOf, extractLinks, persistDistilled, goalOf }) {
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
    /** 子 agent 内容 chunk 出站（四面分流单点 —— `subChunkOf` 构形）。 */
    const chunkOut = (payload) => { at("ev:subchunk", payload); return true }
    return {
      onToken: (text) => {
        // ① relay 分流：relay 前缀 token 一律本面消费——映射单源 = 核 `relayEventToSubPatch`
        //（`⟦ev⟧async` 只入 pending / 嵌套剥除 / 表外 ⟦ev⟧ / 非协议行 ⇒ patch `null` ⇒ 消费不泄漏）。
        if (isRelayToken(text)) {
          const patch = relayEventToSubPatch(text, scope, {
            syncLiveOf: typeof syncLiveOf === "function" ? (head) => syncLiveOf(key, head) === true : undefined,
            now,
          })
          if (patch) sub(patch)
          return true
        }
        // ② 前缀内容 chunk（无 ⟦ev⟧ / [model] 字面 ⇒ 非事件面）：relay 前缀 ⇒ `ev:subchunk` 的 text 面
        //（「对齐第二批」项 3 收正：内容回显 = 核件 tail-3 / 展开；前缀字面不得泄漏入主流）。
        const piece = subChunkOf("text", text)
        if (piece !== null) return chunkOut(piece)
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
      // **relay 前缀分流**（**与 `onToken` 同律**）：子代理 / advisor 的 think chunk 带 `role#id/` 前缀
      // （核 `agent/spawn-child.mjs:152-153` · `agent-tools/advisor-async.mjs:275` —— 且核对 `onReasoning` **无**流式门）
      // ⇒ `ev:subchunk` 的 think 面（「对齐第二批」项 3 收正：内容回显 = 核件 tail-3 / 展开）。
      onReasoning: (text) => {
        const piece = subChunkOf("think", text)
        return piece !== null ? chunkOut(piece) : at("ev:reasoning", { text })
      },
      onAgentTurn: (n, max) => at("ev:activity", { event: "turn", n, max }),
      onToolCall: (name, args, id) => {
        // 子 agent 工具调用行 ⇒ `ev:subchunk` 工具面（face = toolCall）；不带前缀者才入流。
        const piece = subChunkOf("toolCall", name, args)
        if (piece !== null) return chunkOut(piece)
        // advisor 轮次标签载波（「对齐第三批」项 14 —— 仅 `advisor` 名；值 = 宿主只读采样面，端侧零构造，缺 ⇒ 零键）。
        const extra = name === "advisor" && typeof advisorOf === "function" ? advisorOf(key) : null
        return at("ev:tool-call", { id, name, argsSummary: summarizeArgs(name, args), ...(extra ?? {}) })
      },
      onToolOutput: (name, text, id) => {
        // 子 agent 工具输出行 ⇒ `ev:subchunk` 工具面（face = toolOutput）。
        const piece = subChunkOf("toolOutput", name, text)
        return piece !== null ? chunkOut(piece) : at("ev:tool-output", { id, chunk: text })
      },
      // 收尾：`ok` = 核 `isToolFailure` 判据单源（「对齐第三批」项 2 收正 —— 半 / 全角 `Error[:：]` 头与独立成行
      // 状态位；`docs/desktop/design/IPC.md` §1 `ev:tool-result` 行）；`links` = 验存文件链接（相抵② · KD-39 ——
      // 宿主计算：路径 token + 盘上存在闸 + 去重 + 封顶；空 / 缺 ⇒ 零键）。
      onToolResult: (name, result, id, subKey) => {
        const links = typeof extractLinks === "function" ? extractLinks(result) : null
        const out = at("ev:tool-result", {
          id, ok: !isToolFailure(result), result,
          ...(Array.isArray(links) && links.length > 0 ? { links } : {}),
          ...(subKey ? { subKey } : {}),
        })
        // R5 · #521（X6 注记）：`subKey`（核 `dispatch-run.mjs:137` 第 4 参 —— 仅 sync 成功 / 折叠径设置）
        // 在场 ⇒ 本键 `done` 补发 —— sync 块冻结（VSC `settleSyncSubagent` ∕ CLI `finishSubTaskKey` 同款）
        // + 两锚命中才携注记（`note` 入块级活态载体 `meta.note` —— 核态机直收，禁假造）。已冻结块
        // （例：`⟦ev⟧stopped` 先到）⇒ 核「已冻丢注记」判据照旧（VSC ∕ CLI 同面登记）。
        if (subKey) {
          const path = relayPathOf(`${String(subKey)}/`)
          const hash = path === null ? -1 : path.head.indexOf("#")
          const subId = hash > 0 ? Number(path.head.slice(hash + 1)) : NaN
          if (Number.isFinite(subId)) {
            const note = syncNoteOf(result)
            sub({ status: "done", role: path.head.slice(0, hash), id: subId, ...(note === null ? {} : { note }) })
          }
        }
        // R5 · B10（目标面）：**goal 工具结果时点采样**（核 `agent.goal` 单源 —— 唯一写者 = goal 工具）；
        // 错误结果 = 零状态变更 ⇒ 不出站（禁假造「cancelled」）；`goalOf` 缺注入 ∥ 不可判（agent 缺席）⇒ 零载波。
        if (name === "goal" && typeof goalOf === "function" && !isToolFailure(result)) {
          const goal = goalOf(key)
          if (goal !== undefined) at("ev:goal", goalInfoOf(goal))
        }
        return out
      },
      onPermissionRequest: (name, args) => askSingle(key, name, args),
      onBatchPermissionRequest: (req) => askBatch(key, req),
      // 子代理写权门（核 `makeChildPermission` 四参缝 —— 「对齐第三批」B1 / 相抵① · `IPC.md` §1 `ev:approval` 行）：
      // `diffInfo`（核原样两形 `{patch}` ∥ `{old,new,path}`）与 `opts.owner.label`（归属串）随载荷出站（缺 ⇒ 键缺席）；
      // 深度 0 无此回调（`onPermissionRequest` 走两参径）⇒ 两键缺席 = 既有形（零回归）。
      onPermissionRequired: (name, args, diffInfo, opts) =>
        askSingle(key, name, args, { owner: opts?.owner?.label ?? null, diff: diffInfo ?? null }),
      // 子代理审批态（核 `child-permission.mjs:40-44` ⇒ 「对齐第三批」B5）：`tool` = 待审批工具名，`null` = 清态；
      // 归约面据此出 ⏸ + `sub.awaitingApproval`（块面词 = 核件 `refreshBlock` 直出 —— 端侧零词面）。
      onSubagentApproval: (info) => {
        const { id, role } = info ?? {}
        if (id == null || role == null) return false
        return sub({ status: "approval", role, id, model: info?.model ?? null, tool: info?.tool ?? null })
      },
      // 子回合边界（核 `onTurnEnd(agent, turn)` ⇒ `ev:activity { event: "turnBreak" }` —— 「对齐第三批」A7 ·
      // `IPC.md` §1 该通道「四形」）：**无 `fields`**（内联形判别键不得在场 —— 判别写死见同段）；非回合尾。
      onTurnEnd: () => at("ev:activity", { event: "turnBreak" }),
      // 作答门（`question` 工具 ⇒ 用户真作答）：转口 `askQuestion` ⇒ 返**悬起 Promise**（出站与结算住
      // `suspensions.mjs` —— 桥零文案）；工具结果 = 作答串 ∥ 取消串（`QUESTION_CANCELLED`）。
      onQuestion: (question, options) => askQuestion(key, question, options),
      onTaskUpdate: (items) => at("ev:task", { items }),
      // 蒸馏落位（R3 · #520 —— 核 `explore-distill.mjs:150`）：机器行已被压缩版替换 ⇒ 注入面按本键立即
      // 重落盘（落盘动作经端侧装配 —— 桥零宿主依赖律不破；缺注入 ⇒ 零动作，不假造落盘）。
      onDistilled: () => { if (typeof persistDistilled === "function") persistDistilled(key) },
      // 用量回调（R3a · 核 `callbacks.onUsage(response.usage)` —— `thincoder-core/agent.mjs:353`）：**非独立通道** ——
      // 逐次响应累入本键会话级令牌表（`tokensOf(key)` 注入；表缺 ⇒ 零动作），随宿主回合尾 `ev:usage` 载荷出
      // （`docs/desktop/design/IPC.md` §1 `ev:usage` 行「载荷扩」）。
      onUsage: (usage) => accumulateTokens(tokensOf?.(key), usage),
      // 等待相位（R4 —— 核 `callbacks.onWait`（`agent.mjs:285` 透传 provider 链）⇒ `ev:statusText`）：映射 = 核单源
      // `waitStatusOf`（→ `{ kind, seconds }` ∕ `{ kind, message }`）；`null`（`warn` ∕ 未知相位）⇒ **零载波**
      //（禁假造——本端零相位枚举 ∕ 零自铸词；文案取词归渲染面 `status.*` 核字典投影）。
      onWait: (info) => {
        const payload = waitStatusOf(info)
        return payload === null ? false : at("ev:statusText", payload)
      },
      // 压缩生命周期四态（R4 —— 核 `context.mjs:304` ∕ `agent/run-stages.mjs:89/:98/:106`）⇒ `ev:compress`：
      // 形 = VSC `panel-callbacks.mjs:175-183` 同式（缺值携 `null`——渲染面 `?` 兜底）；词面归渲染面（核字典 `compress.*`）。
      onCompressStart: (info) => at("ev:compress", { status: "start", messages: info?.messages ?? null }),
      onCompress: (info) => at("ev:compress", {
        status: info?.mode === "fallback" ? "fallback" : "done",
        tokensFreed: info?.tokensFreed ?? null,
        elapsedMs: info?.elapsedMs ?? null,
        tailMessages: info?.tailMessages ?? null,
      }),
      onCompressFail: (err) => at("ev:compress", { status: "failed", error: err?.message ?? String(err ?? "unknown error") }),
      // 注：本对象为**回调桥**（核 `runAgent` 消费面）——键集与 `docs/desktop/design/SHELL.md` §4 回调表同源；
      // 「对齐第三批」三接缝（`onPermissionRequired` / `onSubagentApproval` / `onTurnEnd`）皆并入既有通道，非新通道。
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
