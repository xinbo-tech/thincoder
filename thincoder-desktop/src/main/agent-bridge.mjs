/**
 * agent-bridge.mjs — 宿主装配桥的**回调桥**出档（批 8 §1.14 ③：宿主档触行数拉线，按在册预案拆分；
 * 档名实施舱定）。三面单源（原 `agent-host.mjs` 同名面逐字搬运）：① 活动名闭集 `ACTIVITY_EVENTS`；
 * ② 协议行解析 `parseEvToken`（正则 `EV_RE` + relay 前缀 `RELAY_HEAD_RE`）；③ 九回调 ⇒ `ev:*` 出站
 * 通道映射 `createBridge`。工具参数摘要 `summarizeArgs` 同行（回调桥与待决门 payload 共用一份口径 ——
 * `suspensions.mjs` 引用本档，不复制）。
 * 依赖面 = 注入（零宿主依赖 ⇒ 平 node 直测）：`post(channel, payload)` = 主进程出站面 ·
 * `askSingle` / `askBatch` / `askQuestion` = 三门挂起（表与 resolve 在 `suspensions.mjs`，本档只转口、不持表）。
 */

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

/** 九回调桥（`⟦ev⟧` 协议行 ⇒ `ev:activity`；非协议 ⇒ `ev:token` 文本面）：
 *  `createBridge({post, askSingle, askBatch, askQuestion})` ⇒ `bridge(key)`。每帧 `key` 前置并入
 *  （帧 payload 自带同名键时后者胜 —— 形状同原实现）。 */
export function createBridge({ post, askSingle, askBatch, askQuestion }) {
  return function bridge(key) {
    const at = (channel, payload) => post(channel, { key, ...payload })
    return {
      onToken: (text) => {
        const ev = parseEvToken(text)
        // 判别写死（IPC.md:31）：`fields` 键在场 = 内联形（零回合尾、不作回合起）——无分隔则值为 `null`。
        return ev
          ? at("ev:activity", { event: ev.event, fields: ev.fields })
          : at("ev:token", { text })
      },
      onAgentTurn: (n, max) => at("ev:activity", { event: "turn", n, max }),
      onToolCall: (name, args, id) => at("ev:tool-call", { id, name, argsSummary: summarizeArgs(name, args) }),
      onToolOutput: (name, chunk, id) => at("ev:tool-output", { id, chunk }),
      onToolResult: (name, result, id, subKey) =>
        at("ev:tool-result", { id, ok: !String(result).startsWith("Error:"), result, ...(subKey ? { subKey } : {}) }),
      onPermissionRequest: (name, args) => askSingle(key, name, args),
      onBatchPermissionRequest: (req) => askBatch(key, req),
      // 作答门（`question` 工具 ⇒ 用户真作答）：转口 `askQuestion` ⇒ 返**悬起 Promise**（出站与结算住
      // `suspensions.mjs` —— 桥零文案）；工具结果 = 作答串 ∥ 取消串（`QUESTION_CANCELLED`）。
      onQuestion: (question, options) => askQuestion(key, question, options),
      onTaskUpdate: (items) => at("ev:task", { items }),
    }
  }
}
