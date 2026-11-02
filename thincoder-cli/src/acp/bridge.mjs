/**
 * bridge.mjs — map runAgent callbacks to ACP session/update notifications
 * and reverse-RPC (M2: tools, permissions, fs routing).
 *
 * Wire shapes verified against the ACP schema v1 + kimi acp-adapter:
 * - agent text   → `agent_message_chunk`  { content: { type: "text", text } }
 * - thinking     → `agent_thought_chunk`  (same content shape)
 * - subagent ev  → `session_info_update` { _meta: { "thincoder.dev/subagent":
 *                  { role, id, state, progress?, detail? } } } (event token behind the relay
 *                  prefix — the text face stays stripped; §12 extension contract)
 * - tool start   → `tool_call`  { toolCallId, title, kind, status: "in_progress", rawInput, content }
 * - tool result  → `tool_call_update`  { toolCallId, status: "completed"|"failed", content } (REPLACE semantics)
 * - usage        → `usage_update` { used, size } (used = prompt + completion tokens;
 *                  size = the model's context window — providerSpec single source)
 * - permission   → reverse-RPC request `session/request_permission`
 *                  { sessionId, options, toolCall } → client responds with
 *                  { outcome: { outcome: "selected", optionId } | { outcome: "cancelled" } }
 * - fs routing   → reverse-RPC `fs/read_text_file` / `fs/write_text_file`
 *
 * toolCallId is generated per session (t1, t2, …) — thincoder's model-level
 * tool ids are not guaranteed unique across turns, ACP ids must be.
 *
 * End-of-turn is NOT a notification: `session/prompt` resolves with
 * `{ stopReason: "end_turn" }` (kimi session.ts parity).
 */
import { detectDanger, normalizeEOL, joinWithEol, resolveInCwd } from "@thincoder/core/tools/shared.mjs"
import { computeEditEntry, validateEditEntry, assertEditArgsExclusive, assertEditsContainer, assertEditEntries, hasLineParams, planEditEntries, applyPlannedEntries, deleteTarget, EDIT_ENTRY_NO_PATH, editEntryLabel } from "@thincoder/core/tools/edit-diff.mjs"
// 行号锚护栏（EDIT-HELPERS §7）：桥不经 writeThroughPath ⇒ 判据与记账都得在桥面接（§7.4）。
// 判据 / 拒文 = 核单源；记账 = 写缓冲成功后桥自 recordWrite，键 = resolveInCwd 后的绝对路径。
import { recordWrite, lineAnchorVerdict, lineAnchorRefusal } from "@thincoder/core/tools/write-path.mjs"
// 第 27 批 §12.3①/③：relay 前缀文法单一权威（模块直连——不自持正则副本）。
import { parseRelayPath } from "@thincoder/core/agent/relay-prefix.mjs"
// 批 1 CORE-DEFECT-FIXES B3：onWait 相位值域 + 文案单源（本面仅日志——PROVIDER.md §6.20）
import { waitStatusText } from "@thincoder/core/provider/wait-status.mjs"
// §2.1（ACP-PROTOCOL-COMPLIANCE）：usage_update.size = 模型上下文窗口单源（含 providers[].context 覆写）。
import { providerSpec } from "@thincoder/core/config.mjs"
// 2026-10-04 批（ACP 协议面补全）：事件 token 文法单源（形态判据 ∥ 逐事件投影——
// ACP-CLIENT.md §12.4）——剥离判据经本调用唯一决定，本档不再自持 ⟦ev⟧ 判据副本。
import { parseSubagentEvent } from "@thincoder/core/agent/subagent-event.mjs"

/** ACP ToolKind inference (schema v1 enum) — best-effort, clients render by kind. */
function inferToolKind(name) {
  const base = name.includes("/") ? name.split("/").pop() : name
  if (["write", "edit", "apply_patch", "insert_after", "hashline_edit"].includes(base)) return "edit"
  if (base === "delete") return "delete"
  if (base === "bash") return "execute"
  if (["read", "glob", "grep", "ls", "code_search", "doc_search", "repo_outline"].includes(base)) return "read"
  if (base === "fetch" || base === "websearch") return "fetch"
  return "other"
}

/** Permission options surfaced to the client (kimi canonical ids, order load-bearing). */
const PERMISSION_OPTIONS = [
  { optionId: "approve_once", name: "Approve once", kind: "allow_once" },
  { optionId: "approve_always", name: "Approve for this session", kind: "allow_always" },
  { optionId: "reject", name: "Reject", kind: "reject_once" },
]

/** Map a client permission response to a boolean (unknown → reject, safety-first). */
function permissionToBoolean(response) {
  const outcome = response?.outcome
  if (!outcome || outcome.outcome === "cancelled") return false
  if (outcome.optionId === "approve_once" || outcome.optionId === "approve" || outcome.optionId === "approve_always" || outcome.optionId === "approve_for_session") return true
  return false
}

/** §12.2（ACP-CLIENT.md）：`_meta` 扩展键——命名空间防保留键碰撞（对外契约逐字）。 */
const SUBAGENT_META_KEY = "thincoder.dev/subagent"

/** 事件 token → `_meta["thincoder.dev/subagent"]` 载荷（§12.2 形状冻结——无值键缺席：
 *  progress/detail 键只在有值时在场；`state` = 事件名原文，形态域开集）。
 *  role/id = relay 前缀**最内段**（嵌套 `explore#1/eng-coder#2/…` ⇒ `eng-coder`/2——
 *  段形 `role#id` 由 parseRelayPath 保证）。 */
function subagentMetaPayload(path, ev) {
  const inner = path.inner.length > 0 ? path.inner[path.inner.length - 1] : path.head
  const [role, id] = inner.split("#")
  const meta = { role, id: Number(id), state: ev.name }
  if (ev.progress) meta.progress = ev.progress
  if (ev.detail) meta.detail = ev.detail
  return meta
}

/**
 * Build the runAgent callbacks for an ACP session.
 * @param {{ sessionId: string, agent?: object, notify: (m, p) => void, request: (m, p, o?) => Promise<any>, log?: (s) => void,
 *           clientCaps?: { fs?: { readTextFile?: boolean, writeTextFile?: boolean } },
 *           onSecretInput?: Function }} deps
 *   `agent` = 会话的活引用（§2.4——`set_config_option` 切模型后 `usage_update.size` 随动；
 *   不得在构造期固化数值）；`clientCaps` = the §3.4 snapshot (taken at `session/new`); capabilities omitted by the
 *   client are UNSUPPORTED ⇒ the fs reverse-RPC face stays local (§11.4 — never 30s 干等)；
 *   `onSecretInput` = 凭据窗注入缝（SSH-SESSION 批 §6.22 ⑧——无 UI 通道由装配侧给拒件；缺省零注入）。
 */
export function buildAcpCallbacks({ sessionId, agent, notify, request, log = () => {}, clientCaps = {}, onSecretInput = null }) {
  const update = (sessionUpdate, extra = {}) =>
    notify("session/update", { sessionId, update: { sessionUpdate, ...extra } })
  // §11.4 fs 能力位（默认 false——文档「MUST treat all capabilities omitted … as UNSUPPORTED」）；
  // 判据同构 = kimi server.ts。edit 桥需读回 + 写回 ⇒ 两位皆真才路由。
  const canReadFile = clientCaps?.fs?.readTextFile === true
  const canWriteFile = clientCaps?.fs?.writeTextFile === true
  let toolSeq = 0
  // D15.8（TOOLS.md §15.1）：tool id FIFO 队列——并行同名工具按 call 序配对（dispatch B1
  // 已测：并行结果回调顺序 = call 顺序——T-TS8/T-TS9）。取代旧 Map 按名覆盖（后写覆盖先写
  // → tool_call_update 与 tool_call id 错配）。条目 { name, id, toolId }——toolId = 模型级
  // toolCall.id（dispatch 在 onToolCall/onToolResult 均传第 3 参——同一 item 恒相同）。
  // 拒绝/中断路径：dispatch 在 onToolCall 之前拒绝（被拒工具从未入队——无孤儿可滞）；
  // 中断/异常路径（onToolResult 永不回调——dispatch.mjs catch 分支——T-F5 契约）留下的
  // 孤儿靠 onToolCall 的「同名同 toolId 先弹出」隔离（见 onToolCall）——模型级 id 跨轮
  // 可重复（sse.mjs 每轮从 call_0 重置）——弹出保证精确配对恒命中最新条目。
  const toolQueue = [] // FIFO of pending { name, id, toolId }

  const toolCallId = () => `t${++toolSeq}`
  /** D15.8：peek 同名最早项 id——权限面板展示用——不消费（result 仍要与自己的条目配对）。 */
  const peekToolId = (name) => {
    for (const e of toolQueue) if (e.name === name) return e.id
    return null
  }
  /** D15.8：消费——①模型级 toolId 精确配对（中断孤儿隔离）②无 id/未命中 → 名称 FIFO 回退
   *  （B1 保序）③均未命中 → null（调用方回退新 id——防御）。 */
  const takeToolId = (name, toolId) => {
    if (toolId != null) {
      const i = toolQueue.findIndex((e) => e.name === name && e.toolId === toolId)
      if (i >= 0) return toolQueue.splice(i, 1)[0].id
    }
    for (let i = 0; i < toolQueue.length; i++) {
      if (toolQueue[i].name === name) return toolQueue.splice(i, 1)[0].id
    }
    return null
  }

  const contentBlock = (text) => ({ type: "content", content: { type: "text", text } })
  const pathOf = (args) => {
    const p = args?.path ?? args?.filePath
    return typeof p === "string" && p ? p : null
  }

  // §15.1（TOOLS.md）D15.7 委派：edit 判定/应用单一权威 = 本地 computeEditEntry
  // （edit-diff.mjs——校验→判定序→应用：行级 LCS、零重叠→替换即删、replace_all 字面替换全部）。
  // 桥只留「读 IDE 缓冲 → computeEditEntry → 写回 IDE 缓冲」——错误文本经抛错原样透传
  // ——与本地通道逐字一致（NF15.6b / AC15.10：not found / occurrences / 空 old / 空 new）。

  // 不变量（§11.7-2）：**任何** fs/* 反向 RPC 发出前必过客户端能力位——守卫住在本函数内
  // （防御面：路由分支先判，守卫兜底，漏判不发静默超时）。
  const readBuffer = async (p) => {
    if (!canReadFile) throw new Error("client does not advertise fs.readTextFile")
    try {
      const read = await request("fs/read_text_file", { sessionId, path: p }, { timeoutMs: 30000 })
      return read?.text ?? read?.content ?? ""
    } catch (e) {
      throw new Error(`fs/read_text_file failed: ${e.message}`)
    }
  }
  const writeBuffer = async (p, content) => {
    if (!canWriteFile) throw new Error("client does not advertise fs.writeTextFile")
    try {
      await request("fs/write_text_file", { sessionId, path: p, content }, { timeoutMs: 30000 })
    } catch (e) {
      throw new Error(`fs/write_text_file failed: ${e.message}`)
    }
  }
  /** 记账键（§7.4）：与核同一键 = `resolveInCwd` 后的绝对路径——键不一致则核与桥各记一条、
   *  互相看不见，护栏对另一条通道等于零。 */
  const absOf = (p) => resolveInCwd({ cwd: agent?.cwd ?? process.cwd() }, p)
  /** 单形态：读 IDE 缓冲 → 行号锚护栏判定 → computeEditEntry（rich——无 abortPrefix——同本地
   *  runSingleEdit）→ 写回 → 记账。EOL 权威（F1）：判定/应用在 normalizeEOL 后的 LF 域；写回
   *  joinWithEol 按原文首换行恢复（LF 域判定——CRLF 域写回——与本地 edit 工具同判同恢复）。 */
  const editSingle = async (p, args) => {
    const raw = await readBuffer(p)
    const content = normalizeEOL(raw)
    const abs = absOf(p)
    // 行号锚护栏（§7.4）：行号形才需判——内容形态是位置无关寻址，没有可漂移的锚。
    // 形态校验先于护栏（与核 runSingleEdit 同序）：缺 endLine / 与 old_string 互斥报自己的句。
    if (hasLineParams(args)) {
      validateEditEntry(args, { rich: true })
      const startLine = args.line ?? args.startLine
      const endLine = args.line ?? args.endLine
      if (lineAnchorVerdict(abs, startLine, endLine)) throw new Error(lineAnchorRefusal(abs, startLine, endLine))
    }
    const out = computeEditEntry(content, args, { path: p, absPath: abs })
    await writeBuffer(p, joinWithEol(normalizeEOL(out.updated).split("\n"), raw))
    // 缓冲写回**成功之后**记账（快照对同一坐标系有效——缓冲与盘面可能不同步，行号语义跟的是缓冲）
    recordWrite(abs, { type: "edit", startLine: out.editStartLine, shift: out.lineShift })
    // 逐条回执（§7.4「单形态删行不经桥」）：单形态经桥恒为确认形——路由门要求单形态的
    // `new_string` 是字符串，而删行只在**省略**它时成立 ⇒ 单形态删行走不到这里（落本地通道，
    // 回执 = 核面 `Deleted line N of <path>`），桥面的删行回执只来自 `edits` 数组形态（editBatch）。
    // 不留删行分支：为没出现过的输入加分支 = 加一条没人走的路，且它会让下一个读这里的人
    // 以为单形态删行走 IDE 缓冲（实测不走）；放宽路由门是行为变更，没人要求过。
    return `OK: edited ${p} via IDE (${out.occurrences} occurrence(s))${out.note ? ` — ${out.note}` : ""}`
  }
  /** 数组形态（D15.7）：守卫与文案单源 = 本地 edit-diff（assertEditsContainer / assertEditEntries /
   *  validateEditEntry——EDIT.md §8 D-7：核 edit-batch 与桥同调用、桥零字面副本）→
   *  读全部涉及文件缓冲（按绝对路径去重——一次读）→ 用批前快照判一次 → **帧调同一对纯函数**
   *  （planEditEntries / applyPlannedEntries，R1–R4；不另写组循环）→ 全部通过 → 逐文件写回
   *  一次并同记账（判失败 → 零写；写失败 → 同本地 edit-batch 既有原子语义）。 */
  /** ACP batch-edit 通道——与 EDIT.md:#796 汇总行体系**无关**。
   * 桥面 `prepared.map(...).join("\\n")` 自持逐条文字行，不经 `applyEditBatch`/`diffLines`/offload；
   * 距 64K offload 阈值远 + 不含 diff 结构 ⇒ 不在 offload 盲区范围。**判定：非 #796 射程（#908）**。
   */
  const editBatch = async (args) => {
    const edits = args.edits
    assertEditsContainer(edits)
    assertEditArgsExclusive(args)
    assertEditEntries(edits)
    const groups = new Map() // abs → { abs, path, raw, content, edits, origIdx }
    for (let i = 0; i < edits.length; i++) {
      const e = edits[i]
      // 2026-09-05 用户裁定（CLI parity——本地 edit-batch 同句）：条目自带 path 优先；
      // 缺省回退顶层 path（pathOf——path/filePath 别名同单形态）
      const p = e.path || pathOf(args) // 同核 edit-batch 的兜底判（`||` 而非 `??`——空串也回落顶层）
      if (!p) throw new Error(EDIT_ENTRY_NO_PATH)
      validateEditEntry(e, { label: editEntryLabel(p), rich: false })
      const abs = absOf(p)
      let g = groups.get(abs)
      if (!g) {
        g = { abs, path: p, raw: "", content: "", edits: [], origIdx: [] }
        groups.set(abs, g)
      }
      g.edits.push(e)
      g.origIdx.push(i) // 条目在 `edits` 数组里的原始下标——回显按它回位（§7.3）
    }
    for (const g of groups.values()) {
      g.raw = await readBuffer(g.path)
      g.content = normalizeEOL(g.raw)
    }
    // 判定点（§7.3 同核）：组循环之前用**批前快照**判一次——命中即抛、零写
    for (const g of groups.values()) {
      for (const e of g.edits) {
        if (!hasLineParams(e)) continue
        const startLine = e.line ?? e.startLine
        const endLine = e.line ?? e.endLine
        if (lineAnchorVerdict(g.abs, startLine, endLine)) throw new Error(lineAnchorRefusal(g.abs, startLine, endLine))
      }
    }
    // 帧单源：调 §7.3 的同一对零 IO 纯函数——桥只做「读缓冲 → 应用计划 → 写缓冲」。
    // 回显按调用序 = 按条目的**原始下标**回填（§7.3）：跨文件交错的批若按文件分组去排会排成
    // A、A、B——模型按位置对号入座，顺序一变它会把结果贴到错的那一笔上。
    const prepared = new Array(edits.length)
    for (const g of groups.values()) {
      const plan = planEditEntries(g.edits, g.path)
      if (plan.rejection) throw new Error(plan.rejection)
      const applied = applyPlannedEntries(g.content, g.edits, plan.order, { path: g.path })
      g.content = applied.content
      g.netShift = applied.results.reduce((n, r) => n + r.lineShift, 0)
      // results 按组内调用序；g.origIdx 给出它在这一组里的下标对应的原始下标
      applied.results.forEach((r, k) => { prepared[g.origIdx[k]] = { g, ...r } })
    }
    for (const g of groups.values()) {
      await writeBuffer(g.path, joinWithEol(normalizeEOL(g.content).split("\n"), g.raw))
      // 写缓冲成功后记账：合并快照 startLine = 组内最小、shift = 组内净漂移（同核批量语义）
      const startLine = Math.min(...prepared.filter((p) => p.g === g).map((p) => p.editStartLine))
      recordWrite(g.abs, { type: "edit", startLine, shift: g.netShift })
    }
    // 逐条回执同单形态（§7.4）：删行条目写 `Deleted <line N|lines N-M> of <path> via IDE`，
    // 行号段取同一 `deleteTarget`；替换条目保持确认形。核面的 diff / `context (L…-L…)` /
    // 批末汇总行桥面不写（那三样读盘面内容或起外部进程，缓冲与盘面可能不同步）。
    return prepared
      .map((o) => (o.deleted
        ? `Deleted ${deleteTarget(o)} of ${o.g.path} via IDE`
        : `OK: edited ${o.g.path} via IDE (${o.occurrences} occurrence(s))${o.note ? ` — ${o.note}` : ""}`))
      .join("\n")
  }

  const callbacks = {
    onToken: (text) => {
      // 第 27 批 §12.3③ 行 1（R-A2.1）：relay 前缀（role#id/——任意嵌套深度）零进显示面——
      // 先剥前缀取 payload，信号判定与正文发送都作用在 payload 上。
      const path = parseRelayPath(text)
      const payload = path ? path.rest : text
      // Strip the subagent `[model]` metadata token ([model]<name>) — it's a
      // TUI/webview display signal, not conversation content, and must not reach ACP clients.
      if (/^\[model\]/.test(payload)) return
      // D7 + 批 1 B2/D13（ACP-CLIENT.md §7.2）：剥离判据 = **形态**（`⟦ev⟧<小写名>` + RS
      // 终止符同现）——枚举是漏项发生器（`queued` / `cancelled` 发射点在位而白名单未跟 ⇒
      // 随 agent_message_chunk 泄漏给客户端）。终止符约束 load-bearing：放宽为无终止符形态
      // 会吞真实正文（先例教训见 src/tui/render.mjs）。
      // 判据单源 = 核模块 `subagent-event.mjs`（2026-10-04 批统一——桥内联式退役，剥离语义
      // 零改）：`parseSubagentEvent` 非空 ⇒ 剥；§12 结构化发射 = 同一调用取投影载荷。
      const ev = parseSubagentEvent(payload)
      if (ev) {
        // §12.1 发射规则：relay 前缀在场 ⇒ **增量**一条 `session_info_update`（文本面剥离
        // 照旧——零 `agent_message_chunk`）；无前缀 ⇒ 仅剥离零发射（防御面）。
        if (path) update("session_info_update", { _meta: { [SUBAGENT_META_KEY]: subagentMetaPayload(path, ev) } })
        return
      }
      if (!payload) return // D6：剥后空载荷不发通知（防噪声空 chunk）
      update("agent_message_chunk", { content: { type: "text", text: payload } })
    },
    onReasoning: (text) => {
      // 第 27 批 §12.3③ 行 2：同 onToken 取 payload；空载荷不发（D6）。
      const path = parseRelayPath(text)
      const payload = path ? path.rest : text
      if (!payload) return
      update("agent_thought_chunk", { content: { type: "text", text: payload } })
    },
    // §2.1（ACP-PROTOCOL-COMPLIANCE）：`UsageUpdate.required = ["used","size"]`——
    // used = 本轮 prompt + completion（量级近似「当前在上下文中的 token」）；size = 模型上下文
    // 窗口（`providerSpec` 单源——含 providers[].context 覆写；未知模型 128_000 兜底）。
    // agent 为活引用：切模型后 size 随动（不得构造期固化）。
    onUsage: (usage) => update("usage_update", {
      used: (usage?.prompt_tokens ?? 0) + (usage?.completion_tokens ?? 0),
      size: providerSpec(agent?.provider).context,
    }),
    onWait: (ev) => {
      const s = waitStatusText(ev)
      if (s) log(`[rate-limit] ${s}`)
    },
    onCompress: () => log("[context] auto-compacted"),

    onToolCall: (name, args, toolId) => {
      const id = toolCallId()
      // 第 27 批 §12.3③ 行 3：显示面剥前缀（title / kind）；配对键 toolQueue 存原样 name（D3）。
      const path = parseRelayPath(name)
      const shown = path ? path.rest : name
      // D15.8（advisor 🔴#1 修复）：模型级 id 每轮重置（sse.mjs finalizeToolCalls 内
      // seq=0——call_0 call_1… 跨轮/跨消息可重复——设计自注「跨 turn 不保证唯一」）。
      // 因此 push 前若队列已有同名同 toolId 条目，它必是结果永不回调的陈旧孤儿
      // （dispatch 失败/中断路径不调 onToolResult——T-F5 契约）——先弹出再入队——
      // 精确配对恒命中最新——"下个同名结果永不配到旧项"（设计目标，无需动 dispatch）。
      if (toolId != null) {
        for (let i = toolQueue.length - 1; i >= 0; i--) {
          if (toolQueue[i].name === name && toolQueue[i].toolId === toolId) toolQueue.splice(i, 1)
        }
      }
      toolQueue.push({ name, id, toolId: toolId ?? null })
      update("tool_call", {
        toolCallId: id,
        title: shown,
        kind: inferToolKind(shown),
        status: "in_progress",
        rawInput: args ?? {},
        content: [contentBlock(JSON.stringify(args ?? {}))],
      })
    },

    onToolResult: (name, result, toolId) => {
      const id = takeToolId(name, toolId) ?? toolCallId()
      update("tool_call_update", {
        toolCallId: id,
        status: "completed",
        content: [contentBlock(String(result ?? ""))],
      })
    },

    /**
     * Permission gate (dispatch.mjs onPermissionRequest): reverse-RPC to the
     * client. Any transport failure → reject (safety-first, kimi parity).
     */
    onPermissionRequest: async (name, args) => {
      // 第 27 批 §12.3③ 行 4：显示面（请求文本 + toolCall.title）剥前缀；
      // 危险基名判定与 peekToolId 照旧（配对键 = 原样名——D3）。
      const path = parseRelayPath(name)
      const shown = path ? path.rest : name
      // 危险命令标注(只提示不拦截):kimi 同款模式,帮助编辑器端用户审批
      const base = shown.includes("/") ? shown.split("/").pop() : shown
      const danger = base === "bash" ? detectDanger(args?.command ?? "") : undefined
      const content = [contentBlock(`Requesting approval to run ${shown}`)]
      if (danger) content.push(contentBlock(`⚠️ Dangerous: ${danger}`))
      content.push(contentBlock(JSON.stringify(args ?? {})))
      const toolCall = {
        toolCallId: peekToolId(name) ?? toolCallId(), // D15.8：peek 不消费（原样名键）——result 仍要与自己的条目配对
        title: shown,
        content,
      }
      try {
        const response = await request("session/request_permission", {
          sessionId,
          options: PERMISSION_OPTIONS,
          toolCall,
        }, { timeoutMs: 300000 }) // user deliberation can take a while; 5 min
        return permissionToBoolean(response)
      } catch (e) {
        log(`[acp] request_permission failed; rejecting: ${e.message}`)
        return false
      }
    },

    /**
     * SSH 凭据窗（SSH-SESSION 批 · TOOLS.md §6.22 ⑧——无 UI 场合）：注入侧给拒件（可读句 + 指引——
     * 不挂起、不静默；装配 = `acp.mjs` `refuseSecretInput`）；缺省零注入 ⇒ 核工具自身抛句
     * （同 `question.mjs` 无 UI 例）。
     */
    ...(onSecretInput ? { onSecretInput: (payload) => onSecretInput(payload) } : {}),

    /**
     * fs reverse-RPC router (dispatch.mjs toolRouter, M2) — 能力位 + 工具形态双判（§11.4）：
     * - write            → fs/write_text_file (full content, no read-back) — 需 clientCaps.fs.writeTextFile
     * - edit              → fs/read_text_file → 行号锚护栏 → computeEditEntry（本地权威——单/数组形态）→ fs/write_text_file
     *                      （§15.1 D15.7 委派——双通道同语义；数组=原子批量——帧 R1–R4 同核，写回成功后同记账）
     *                      — 需 readTextFile ∧ writeTextFile（读回是 edit 桥的必要前提）
     * - apply_patch       → local (unified-diff application is not routed in M2)
     * - delete, reads     → local
     * 未宣告 ⇒ `{ handled: false }` 回落本地（零反向 RPC、零超时等待）。
     */
    toolRouter: async (name, args) => {
      const base = name.includes("/") ? name.split("/").pop() : name
      const path = pathOf(args)
      if (base === "write" && path && canWriteFile) {
        if (typeof args?.content !== "string") {
          return { handled: true, result: `Error: write content must be a string (got ${typeof args?.content})` }
        }
        const content = args.content
        try {
          await request("fs/write_text_file", { sessionId, path, content }, { timeoutMs: 30000 })
          // 全文重写也是「我们写的」——与核 writeTool 同型记账（§7.1 第 3 行：之后任何行号形拒）。
          // 不记这一格，同一份漂移就成了「本地拒、IDE 缓冲放」。
          recordWrite(absOf(path), { type: "write", startLine: 1, shift: 0 })
          return { handled: true, result: `OK: wrote ${path} via IDE` }
        } catch (e) {
          return { handled: true, result: `Error: fs/write_text_file failed: ${e.message}` }
        }
      }
      // 2026-09-08 D1：单形态按行号改（path + line/startLine/endLine + new_string——无
      // old_string）同样走 IDE 缓冲通道（hasLineParams 判定）——否则回落本地写盘会与
      // IDE 缓冲脱敏；editSingle → computeEditEntry 行号语义自动继承。
      // #327（TOOLS.md §6.17 裁定 3）：路由判据**归一**——`edits` 真值判（与核 execute 同判据）：
      // 真值 ⇒ 批量分支（共享容器守卫、同一错误面）；假值 ⇒ 单形态面——「桥径单形态应用」分支消除。
      const hasEdits = Boolean(args?.edits)
      if (base === "edit" && canReadFile && canWriteFile && (hasEdits || (path && typeof args?.new_string === "string" && (typeof args?.old_string === "string" || hasLineParams(args))))) {
        try {
          const text = hasEdits ? await editBatch(args) : await editSingle(path, args)
          return { handled: true, result: text }
        } catch (e) {
          return { handled: true, result: `Error: ${e.message}` }
        }
      }
      return { handled: false } // read-only tools, delete, apply_patch stay local
    },
  }
  return callbacks
}


/**
 * Replay a stored human-line history as session/update notifications (session/load).
 * role → event mapping (design §4.5):
 *   user      → user_message_chunk
 *   assistant → agent_message_chunk (no tool_calls) | tool_call cards (with tool_calls)
 *   tool      → tool_call_update following its assistant message
 * Machine-only lines ([System reminder:/[User interrupt:, transient) are never stored
 * in the human line (saveSession filters them), so nothing to skip here.
 */
export function replayHistory({ sessionId, notify, history, log = () => {} }) {
  const update = (sessionUpdate, extra = {}) =>
    notify("session/update", { sessionId, update: { sessionUpdate, ...extra } })
  // Shared content extraction: string → single text block; array → text blocks
  // (images skipped with a log). textOf derives from the same source.
  const contentBlocks = (m) => {
    const items = []
    if (typeof m?.content === "string") items.push({ type: "text", text: m.content })
    else if (Array.isArray(m?.content)) {
      for (const b of m.content) {
        if (typeof b === "string") items.push({ type: "text", text: b })
        else if (b?.type === "text") items.push({ type: "text", text: b.text })
        else if (b?.type === "image") log(`[acp] replay: image block skipped (${sessionId})`)
      }
    }
    return items
  }
  const textOf = (m) => contentBlocks(m).map((b) => b.text).join("\n")

  let pendingToolCalls = [] // { id, title, kind } of the current assistant tool_calls batch
  let toolSeq = 0
  for (const m of history ?? []) {
    if (m?.role === "user") {
      pendingToolCalls = []
      for (const b of contentBlocks(m)) update("user_message_chunk", { content: b })
    } else if (m?.role === "assistant") {
      const calls = Array.isArray(m.tool_calls) && m.tool_calls.length > 0 ? m.tool_calls : null
      if (calls) {
        // One tool_call notification PER tool in the batch — clients correlate
        // later tool_call_updates by toolCallId; an orphan update would be ignored.
        pendingToolCalls = calls.map((tc, i) => {
          const id = `t${++toolSeq}`
          // 第 27 批 §12.3③ 行 5（防御面——T18）：历史工具名带前缀 → 剥；无前缀 → 零变化。
          const raw = tc?.name ?? "tool"
          const path = parseRelayPath(raw)
          const title = path ? path.rest : raw
          update("tool_call", {
            toolCallId: id,
            title,
            kind: inferToolKind(title),
            status: "in_progress",
            content: contentBlocks(m).map((b) => ({ type: "content", content: b })),
          })
          return { id, title }
        })
      } else {
        const items = contentBlocks(m)
        for (const b of items) update("agent_message_chunk", { content: b })
        pendingToolCalls = []
      }
    } else if (m?.role === "tool" && pendingToolCalls.length > 0) {
      const call = pendingToolCalls.shift()
      update("tool_call_update", {
        toolCallId: call.id,
        status: "completed",
        content: [{ type: "content", content: { type: "text", text: textOf(m).slice(0, 2000) } }],
      })
    }
  }
}
