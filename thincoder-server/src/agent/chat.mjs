/**
 * chat.mjs — 聊天式驱动（`agent/ADMIN-AGENT.md` §11 ∥ KD-SV-88/89；admin-agent-chat 批——台账 #1254）：
 * 会话装配（系统简报 + 历史重放）∥ 回合环（预算 ∥ 工具循环）∥ 帧流编解码（`turn`/`delta`/`usage`/`call`/`result`/`end`）
 * ∥ 逐条落库（库两表——v14）∥ 终态收尾（成功 ∥ 模型错误 ∥ 预算超限 ∥ 空回合 ∥ 手动中止）∥ 重启收尾（`running` ⇒ `idle` + notice）。
 *
 * 回合语义（§11）：用户发一条 ⇒ 环跑到**自然结束**（模型无工具调用 = 成功——终态判据本档自持；
 * 预算常量/模型出口装配与 `run.mjs` **同源复用**——`DEFAULT_MAX_CALLS`/`DEFAULT_MAX_DURATION_MS`/`loadCoreChat`）。终止五形：
 * ① 自然结束（`succeeded`）∥ ② 预算超限 `budget` ∥ ③ 模型出口抛错 `model_error` ∥ ④ 空回合 `empty_turn` ∥ ⑤ 手动中止 `aborted`（KD-SV-107）——②③④⑤ ⇒ notice 行 + `chat_stop` 审计 + `end` 帧 `failed`。
 * 中止面（KD-SV-107——chat-shell-align 批）：**进程内登记表**（`Set<chatId>`——`requestChatAbort` ∥ `isChatAbortRequested` ∥ `clearChatAbort`；零持久化，
 * 重启天然空）+ **双通道生效**：① `AbortSignal` 透传模型出口（在途调用当即中断）∥ ② 环内检查点（每模型调用前 ∥ 每工具调用前）。
 * 帧面读数（KD-SV-106——§11.3）：`{ type: "turn", n }`（每次模型调用前）∥ `{ type: "usage", … }`（每次模型调用后、有源才发）∥ `end` 增 `durationMs`/`calls`（可字段）；**零落库**（帧面 = 视图面）。
 * 图片面（KD-SV-109）：`images`（dataURL 串列——两门已过）⇒ user 行 `data_json.imageParts`（parts 数组素形 ∥ 回放 `content` 数组）；详情响应仅 `imageCount`。
 * 档位面（KD-SV-110——console-reasoning-levels 批）：起跑读行（与 `model` 同点）⇒ 出口装配：行值 ∈ 当刻模型核枚举
 * （别名解上游真名后）⇒ provider 配置携 `reasoningEffort`；**未设 ∥ 表外 ∥ 缺核 ⇒ 零字段**（默认静默——与今日同形；档位不阻断回合）。
 * ②③ 下已生成文本 ⇒ `assistant` 行如实落库（部分文本——回放逐字一致；与 notice 行各自一行）；零文本 ⇒ 零 `assistant` 行。
 * 库面（会话 ∥ 消息序两表读写 + 行形展平 + 两条库面常量 + `parseJson`）= `chat-store.mjs`（admin-agent-awareness 批拆档：本档越 §6 预案触发线 650 ⇒
 * 机械搬运 + 重导出，行为零改；依赖方向单源 = `chat.mjs` → `chat-store.mjs`）。
 * 环境感知（KD-SV-112——admin-agent-awareness 批）：每回合三活体行（时空 ∥ 所在/身份 ∥ 所管现况——`chat-env.mjs` 造；块级降级）+ timer 到期行
 * **尾插**于历史与本轮之后（瞬态不落库——值随实况）；第四块「能力与边界」= 简报静态段 `CHAT_LIMITS_BLOCK` + 活体面 `tools.schemas`。
 * 环境工具面（KD-SV-113——`chat-env-tools.mjs`）：核件六族八件原文复用（含 `read_history`——§16.1；ctx 适配 ∥ 结果归一 `{ ok, subject, summary, output }` ∥ `bash` 限幅三件）；
 * MCP 面（server-mcp 批——`mcp/face.mjs`）：解裁（`TRIMMED_FACES` 去 `mcp`）＋ 逐回合读清单 ⇒ 核建连 ⇒ 工具并入（文本面同族——结果 = 核件文本原文；失败冷却 ∥ 重名防御 ∥ 缺核不挂载）；
 * MCP 管面（server-mcp-admin-tools 批——`mcp/admin-tools.mjs`）：**第九件工具 `mcp`**（五动词 list/add/update/remove/probe——复用 `store.mjs`/`face.mjs` 零第二实现；写动作 `mcp_event` ＋ `chat_call` 两行；§12.2）；
 * 工具动作审计（KD-SV-114）：`chat_call` detail 扩 `subject`（命令原文/路径——≤2000 字，与 `call` 同链掩蔽）∥ `truncated`（结果可见形截断位）。
 * 唤醒与投递（§15.1 ∥ KD-SV-125/126——server-wake-face 批）：**投递汇**（`deliverPending`——到期 timer ∥ 后台任务结算 ⇒ 落库
 * `user` 行 + `data.kind="reminder"`）在每回合起跑投递（唤醒轮 = `runChatWakeTurn`——与用户回合同环同面、无路由无帧面）；
 * 空闲自唤醒 = `chat-wake.mjs`（会话键面闩 ＋ 结算钩子 ＋ 三链尾再武装）；`bash.async` 走核池（垫片即宿主）；
 * 非 interrupt 中止 ⇒ 回合尾 `discardAbortedChatTasks`（杀树 + 丢弃提醒入汇 + 墓碑）。
 * 出口改道（§16.2/§16.3——修订轮；凭据主体 2026-10-13 收正——谁用谁）：模型出口 = **本进程网关链 loopback**（`<selfBase>/v1` + **本回合发送者**（登录成员）的 `admin-agent` sk 明文——
 * 鉴权/派发/准入/记账全链逐字复用）；`read_history` 记录面 = `pad._recordStore`（`chat-store.mjs` `recordStoreOf`——本会话作用域）。
 * 与核取核形（§17 ∥ KD-SV-137——server-core-unification 批）：**A1** 工具轮回灌形 = 核件构造（`assistantTurnOf`——回声族携
 * `reasoning_content`〔缺值 ⇒ `""`〕；签名 `extraContent` 落库-回放逐值）∥ **A2** 历史修复（`repairTurnHistory`——回合装配期施用）∥
 * **A3** 上下文压缩（`compactTurnHistory`——阈值触发 ⇒ 标记行落库 `data.kind="compaction"`；回放以标记行代覆盖段）；
 * 三面缺核 ⇒ 退中性（回合不阻断）；回放面（含压缩标记解析）= `chat-store.mjs`。
 *
 * 口径：**执行不依赖连接**（断连照跑到终态——落库单源；`emit` 写失败即吞，回合不受影响）；消息逐条增量落库（KD-SV-89）；
 * 审计 = `agent_event`（`chat_call` 逐调用 ∥ `chat_stop` 异常收尾——KD-SV-91；`chat_start` 归 `chat-routes.mjs`）；
 * 秘密零入库（工具入参 `apiKey` 等敏感键 ⇒ 摘要掩蔽后入帧/入库/入审计）；工具结果 = 模型可见形（截断 ≤4000 字——回放逐字一致）。
 * 注入缝（§11——单元测试档依托）：模型出口 ∥ 工具面 = **模块级 setter + 参数覆盖**（默认 `null` ⇒ 回落真件，生产行为不变）。
 */
import { recordAudit } from "../accounts/audit.mjs"
import { agentKeyOf } from "../accounts/keys.mjs"
import { findMemberById } from "../accounts/members.mjs"
import { HttpError } from "../gateway/errors.mjs"
import { levelsOf, noteDegraded } from "../gateway/reasoning-levels.mjs"
import { createMcpAdminTools } from "../mcp/admin-tools.mjs"
import { createMcpToolFace, noteMcpDegraded } from "../mcp/face.mjs"
import { createChatAskHost, settleChatAsks } from "./chat-asks.mjs"
import { assistantTurnOf, COMPACTION_KIND, compactTurnHistory, repairTurnHistory, specOfRef } from "./chat-compact.mjs"
import { buildEnvLines, CHAT_LIMITS_BLOCK } from "./chat-env.mjs"
import { createEnvTools, deliverPending, discardAbortedChatTasks, loadCoreTurnDomains, noteEnvToolsDegraded, timerPadOf } from "./chat-env-tools.mjs"
import { createChatTools } from "./chat-tools.mjs"
import { appendMessage, chatRowOr404, imagePartsOf, listMessages, recordStoreOf, replayEntriesOf } from "./chat-store.mjs"
import { armChatWake, installSettleHook } from "./chat-wake.mjs"
import { DEFAULT_MAX_CALLS, DEFAULT_MAX_DURATION_MS, loadCoreChat } from "./run.mjs"
import { maskSecrets } from "./tools.mjs"

// ── 库面重导出（拆档轮 2026-10-12——实现 = `chat-store.mjs`；既有导入方面零改）────────────────────
export {
  appendMessage,
  chatRowOr404,
  chatView,
  createChat,
  getChatDetail,
  imagePartsOf,
  listChats,
  listMessages,
  messageView,
  replayMessages,
  CHAT_EXCERPT_MAX,
  CHAT_ROLES,
} from "./chat-store.mjs"

/** 会话状态（库 CHECK 两值——v14 段）。 */
export const CHAT_STATUSES = Object.freeze(["idle", "running"])
/** notice `data.reason` 枚举（**五值**——重启收尾 ∥ 预算超限 ∥ 模型错误 ∥ 空回合 ∥ 手动中止；末位 = chat-shell-align 批 KD-SV-107）。 */
export const CHAT_NOTICE_REASONS = Object.freeze(["restart", "budget", "model_error", "empty_turn", "aborted"])

/** 工具结果落库上限（模型可见形——KD-SV-89/§11「≤4000 字：回放逐字一致」）。 */
export const CHAT_TOOL_CONTENT_MAX = 4000
/** `call` 帧 `args` 摘要上限（字符串；掩蔽后截断——§11/`gateway/API.md` §2.8）。 */
export const CHAT_CALL_ARGS_MAX = 500
/** `result` 帧摘要上限（掩蔽后——同上）。 */
export const CHAT_RESULT_SUMMARY_MAX = 300
/** 审计 `subject` 上限（命令原文/路径——≤2000 字，逾限截断并注记；KD-SV-114）。 */
export const CHAT_SUBJECT_MAX = 2000

/** 系统简报基础段（§11——管理面用途句 + 行动纪律句；提示词级，非机制门）。 */
const CHAT_SYSTEM_BASE = [
  "你是 ThinCoder server 的管理面 agent（聊天式驱动）。用途 = 运维/管理：机队（节点/容器）∥ 成员与 provider 管理 ∥ 审查排障——非开发用途。",
  "你可以调用管理面工具（members ∥ providers ∥ models ∥ usage ∥ audit ∥ runners ∥ docker ∥ exec ∥ mcp）直接读写 server 管理面；工具结果 = `{ ok, … }`（`ok:false` 时看 message 自行纠正或改路线）。",
  "",
  "# 行动纪律",
  "- 先查后动：先取读数（list ∥ summary ∥ 详情），再动作；不确定 ⇒ 问用户。",
  "- 结果用逐句人话；读数引用工具返回的原值。",
  "- 破坏性动作（删节点 ∥ 吊销凭据 ∥ 重置密码 ∥ 删 provider ∥ 停模型）先说明将做什么、再执行。",
  "- 主机凭据（SSH）：请用户在「主机凭据」弹窗（沙盒页节点行 ∥ 对话页会话条钮）里录入——**不要请用户把凭据发在聊天里**。",
  "- 报错说清停在哪一步与原因；不臆测、不编造读数。",
].join("\n")

/** 系统简报 = 基础段 + **第四块「能力与边界」**（§14.1 ④——`CHAT_LIMITS_BLOCK` 静态段；活体面 = 当回合 `tools.schemas`）。 */
export const CHAT_SYSTEM_BRIEF = `${CHAT_SYSTEM_BASE}\n\n${CHAT_LIMITS_BLOCK}`

/** 回合终态文案（②③④——人话；`content` 面；notice 行同落）。 */
export function noticeTextOf(reason, detail = null) {
  if (reason === "restart") return "server 重启——本轮中断（如实收尾）"
  if (reason === "budget") return detail ?? "预算超限——本轮已停"
  if (reason === "model_error") return detail ? `模型调用失败：${detail}` : "模型调用失败——本轮中断"
  if (reason === "empty_turn") return "模型空回合（无文本无工具调用）——本轮无输出"
  if (reason === "aborted") return "已手动中止——本轮已停"
  return String(detail ?? reason)
}

// ── 回合中止登记表（§11.2③/KD-SV-107——进程内，零持久化：重启天然空）────────────────────

/** 已登记中止的会话 id 集（检查点读面；路由 `…/abort` = 写面）。 */
const abortRequests = new Set()
/** 在途回合的信号触发口（`chatId ⇒ AbortController`——在途模型调用当即中断；随回合 `finally` 删）。 */
const abortSignals = new Map()

/** 登记中止（路由面）：置集 + 触发在途信号（无在途 ⇒ 只置集——下一检查点即收尾）。 */
export function requestChatAbort(id) {
  const key = Number(id)
  abortRequests.add(key)
  abortSignals.get(key)?.abort()
  settleChatAsks(key) // 在决 ask 同拍拒值（KD-SV-227 兜底三径之二——回合环下一检查点收「aborted」）
}

/** 中止是否已登记（环内两检查点读面）。 */
export function isChatAbortRequested(id) {
  return abortRequests.has(Number(id))
}

/** 清登记（回合收尾 `finally` 单点——登记表随回合生命周期，零残留）。 */
export function clearChatAbort(id) {
  const key = Number(id)
  abortRequests.delete(key)
  abortSignals.delete(key)
}

// ── 注入缝（§11——模块级；默认 null ⇒ 回落真件）───────────────────────────────
let injectedChat = null
let injectedTools = null

/** 模块级注入（单元测试档：假模型出口 ∥ 假工具面）；README = 默认 null（生产行为不变）。 */
export function setChatTestDeps({ chat = null, tools = null } = {}) {
  injectedChat = chat
  injectedTools = tools
}

/** 当前注入面（诊断/收尾复位用）。 */
export function getChatTestDeps() {
  return { chat: injectedChat, tools: injectedTools }
}

// ── 在途门（`running` ⇒ 400 人话——单文单源：路由预检 ∥ 置位两处同用）────────

/** 在途门报文（§11/E40——单文单源）。 */
export const CHAT_BUSY_MESSAGE = "本会话正在执行——等它结束"

/** 在途门 + 置在途（**同步段**——检查与置位无 await 间点，单写者下无竞态）：`running` ⇒ 400 人话。 */
export function claimChatTurn(db, id, { now = Date.now } = {}) {
  const row = chatRowOr404(db, id)
  assertChatIdle(row)
  db.prepare("UPDATE agent_chats SET status = 'running', updated_at = ? WHERE id = ?").run(new Date(now()).toISOString(), row.id)
  return db.prepare("SELECT * FROM agent_chats WHERE id = ?").get(row.id)
}

/** 在途门只读预检（报文与置位同一个——路由按 §2.8 行序先检在途再校模型）。 */
export function assertChatIdle(row) {
  if (row.status === "running") throw new HttpError("invalid_request_error", CHAT_BUSY_MESSAGE)
  return row
}

/** 收尾（回合终结 ⇒ `idle`；`updated_at` 随动）。 */
export function settleChatIdle(db, id, { now = Date.now } = {}) {
  db.prepare("UPDATE agent_chats SET status = 'idle', updated_at = ? WHERE id = ?").run(new Date(now()).toISOString(), Number(id))
}

/**
 * 重启收尾（§11 ∥ KD-SV-86——装配期执行，无端点）：在途 `running` ⇒ `idle` + notice 行（`restart`）+ `chat_stop` 审计；
 * 已落库消息零动。出 = 收尾会话数。
 */
export function resumeRunningChats(db, { now = Date.now } = {}) {
  const rows = db.prepare("SELECT * FROM agent_chats WHERE status = 'running' ORDER BY id").all()
  for (const row of rows) {
    settleChatIdle(db, row.id, { now })
    appendMessage(db, row.id, { role: "notice", content: noticeTextOf("restart"), data: { reason: "restart" }, now })
    recordAudit(db, {
      type: "agent_event",
      actor: actorNameOf(db, row.created_by),
      actorId: row.created_by ?? null,
      target: `chat:${row.id}`,
      detail: { kind: "chat_stop", chatId: row.id, reason: "restart", summary: noticeTextOf("restart") },
      ts: now(),
    })
  }
  return rows.length
}

/** 行为人名快照（会话发起 admin——`agent_event` actor 口径 = 名快照 ∥ 缺 ⇒ "admin"）。 */
function actorNameOf(db, memberId) {
  if (memberId === null || memberId === undefined) return "admin"
  return findMemberById(db, Number(memberId))?.name ?? "admin"
}

// ── 重放与编解码 ─────────────────────────────────────────────────────────────

/** 历史重放 = `chat-store.mjs`（§11/§17.3——本档经顶部重导出；条目形 `replayEntriesOf` 供 A3 覆盖映射——见 `runChatTurn` 装配段）。 */

/** 回合内工具调用归一（核 `{ id, name, arguments }` ∥ OpenAI `{ id, function:{ name, arguments } }` 两形——核协议口径；
 *  `extra_content`（思考签名——§17.3 A1）在场 ⇒ 携 `extraContent`（落库/回放形）。 */
export function normalizeToolCalls(toolCalls = []) {
  return (Array.isArray(toolCalls) ? toolCalls : []).map((call, index) => ({
    id: call?.id || `call_${index + 1}`,
    name: call?.name ?? call?.function?.name ?? "",
    arguments: typeof call?.arguments === "string" ? call.arguments : typeof call?.function?.arguments === "string" ? call.function.arguments : "{}",
    ...(call?.extra_content === undefined || call?.extra_content === null ? {} : { extraContent: call.extra_content }),
  }))
}

/** 工具入参解析（非 JSON 对象 ⇒ null——调用侧落工具级错误，回合不停）。 */
export function parseToolArgs(text) {
  try {
    const value = JSON.parse(text === "" ? "{}" : text)
    return value !== null && typeof value === "object" && !Array.isArray(value) ? value : null
  } catch {
    return null
  }
}

/** 敏感键名（入参摘要掩蔽——秘密零入帧/库/审计；provider 密钥面 ⟮apiKey⟯ 为主）。 */
const SENSITIVE_KEYS = Object.freeze(["apikey", "secret", "password", "sudosecret", "token", "authorization", "newpassword", "oldpassword"])

/** 入参掩蔽（深拷——敏感键值 ⇒ `"***"`；键名大小写无关）。 */
export function maskArgs(value) {
  if (Array.isArray(value)) return value.map((item) => maskArgs(item))
  if (value === null || typeof value !== "object") return value
  const out = {}
  for (const [key, item] of Object.entries(value)) {
    out[key] = SENSITIVE_KEYS.includes(String(key).toLowerCase()) ? "***" : maskArgs(item)
  }
  return out
}

// ── 截断口径（上限含注记——总长不越设计上限：`args` ≤500 ∥ 摘要 ≤300 ∥ 工具结果 ≤4000）────────

/** 尾注截断（`max` = 含注记总长上限——设计句「截断 ≤N 字」字面成立）。 */
export function capText(text, max, note = "…（截断）") {
  const value = typeof text === "string" ? text : text === null || text === undefined ? "" : String(text)
  if (value.length <= max) return value
  const room = Math.max(0, max - note.length)
  return `${value.slice(0, room)}${note}`
}

/** 工具结果落库截断（模型可见形——KD-SV-89/§11「≤4000 字：回放逐字一致」）。 */
export function capToolContent(text) {
  const value = typeof text === "string" ? text : text === null || text === undefined ? "" : String(text)
  return capText(value, CHAT_TOOL_CONTENT_MAX, `…（截断——实长 ${value.length}）`)
}

/** `call` 帧 `args` = **字符串**摘要（JSON 序列化 ⇒ 掩蔽后截断 ≤500 字——恒为字符串，非对象；§11）。 */
export function argsTextOf(rawArguments) {
  const parsed = parseToolArgs(rawArguments)
  const source = parsed === null ? String(rawArguments ?? "") : JSON.stringify(maskArgs(parsed))
  return capText(maskSecrets(source, []), CHAT_CALL_ARGS_MAX)
}

/** 落库/回放 `args` = **掩蔽原文**（JSON 有效——不截断；`≤500` 摘要只落帧/审计面）。
 *  2026-10-14 缺陷修（轻通道轮）：截断残 JSON 回放撞严校验上游（dashscope code 系）400——落库面须保 JSON 有效；
 *  存量坏行由回放面兜底（`chat-store.mjs` `replayArgsOf`——非 JSON ⇒ `"{}"`）。
 *  非对象根（数组/标量）∥ 非法 JSON ⇒ `"{}"`——评审 #122 收正（键掩蔽对非对象根不生效且全文留存的掩蔽缺口；执行面同判该入参为错）。 */
export function argsFullOf(rawArguments) {
  const parsed = parseToolArgs(rawArguments)
  if (parsed === null) return "{}"
  return maskSecrets(JSON.stringify(maskArgs(parsed)), [])
}

/** 敏感值集（本轮工具入参中的敏感键值——下游文本一并掩蔽；沿 `maskSecrets(text, secrets)` 口径）。 */
export function secretValuesOf(value, out = []) {
  if (Array.isArray(value)) {
    for (const item of value) secretValuesOf(item, out)
    return out
  }
  if (value === null || typeof value !== "object") return out
  for (const [key, item] of Object.entries(value)) {
    if (SENSITIVE_KEYS.includes(String(key).toLowerCase())) {
      if (typeof item === "string" && item.length >= 4) out.push(item) // 短值不掩（会误伤普通文本——沿 maskSecrets 门）
      continue
    }
    secretValuesOf(item, out)
  }
  return out
}

/** 工具结果摘要（`result` 帧 ∥ tool 行 `data.summary`——掩蔽后截断 ≤300 字）。 */
export function summaryOfResult(result, secrets = []) {
  const base = typeof result?.summary === "string" && result.summary !== "" ? result.summary : typeof result?.message === "string" ? result.message : JSON.stringify(result ?? null)
  return capSummary(base, secrets)
}

/** 摘要口径（掩蔽 + 截断 ≤300 字——`result` 帧 ∥ tool 行 ∥ notice/`chat_stop` 三面同源）。 */
export function capSummary(text, secrets = []) {
  const raw = typeof text === "string" ? text : text === null || text === undefined ? "" : String(text)
  return capText(maskSecrets(raw, secrets), CHAT_RESULT_SUMMARY_MAX)
}

/** 审计 `subject` 口径（KD-SV-114——主语原文 ≤2000 字含注记；**与 `call` 同链过会话面掩蔽**——「原文」非免掩蔽）。 */
export function capSubject(subject, secrets = []) {
  return capText(maskSecrets(subject ?? "", secrets), CHAT_SUBJECT_MAX)
}

/** 环境工具结果 → 模型可见文本（核件 `output` 文本原文——**非 JSON 壳**，KD-SV-113 被否栏；错误 ⇒ 人话 message）。 */
export function envToolText(result) {
  if (typeof result?.output === "string") return result.output
  if (typeof result?.message === "string") return result.message
  return ""
}

/** 工具面合并（§14.2——管理面八件 ∪ 文本面族（环境六族八件 ∥ MCP 面 ∥ 管面 `mcp`——server-mcp ∥ server-mcp-admin-tools 批））：名/schema 并集；
 *  `invoke(name, args, ctx)` 按名路由（**两族同携 ctx**——管理族 `models.test` 消费 `ctx.signal`，§12.1②；MCP 面 `ctx.signal` 透传核件）。
 *  重名防御在面内完成（MCP 面合并前扫描静态两面 ∪ 既往件名集——`mcp/face.mjs` 命名面），此处零去重。 */
function mergeToolFaces(base, extras) {
  const faces = extras.filter((face) => face !== null && face !== undefined && face.names.length > 0)
  if (faces.length === 0) return base
  const route = new Map()
  const names = [...base.names]
  const schemas = [...base.schemas]
  for (const face of faces) {
    for (const name of face.names) route.set(name, face)
    names.push(...face.names)
    schemas.push(...face.schemas)
  }
  return {
    names,
    schemas,
    readonlyOf: (name, args) => (route.get(name) ?? base).readonlyOf?.(name, args) !== false, // 判类缝（KD-SV-225——缺席面 ⇒ 读类）
    invoke: (name, args, ctx) => {
      const face = route.get(name)
      return face ? face.invoke(name, args, ctx) : base.invoke(name, args, ctx) // 管理族同携 `ctx`（§12.1②——`models.test` 消费 `ctx.signal`；承 model-test-tool 批 §5 语义）
    },
  }
}

/** 聊天面工具面装配（§14.2）：管理面九件（八件 ＋ 管面 `mcp`——§12.2）+ 环境六族八件（动载核件——沿 `loadCoreChat` 先例）+ **MCP 面**（server-mcp 批——逐回合读清单 ⇒ 核建连 ⇒ 并入，§2.2）。
 *  缺核 ⇒ 环境族不注册 + 一条警告（回合不阻断——模型出口同源缺核时回合走 `model_error` 收尾）；MCP 面同判（缺核/装配失败 ⇒ 不挂载 + 一条警告）。
 *  模型测试缝（§12.1②）：`loopbackFor` = 出口描述子取件（同源 = `chatProviderOf`——sk = 本回合发送者；谁用谁）∥
 *  `deps.modelTestFetch`（缺省 = 真 `fetch`）＝探针传输假件缝 ∥ `now` = 回合时钟（`models.test` 读数逐值断言面）∥
 *  MCP 面缝： `deps.mcpConnectImpl`/`mcpProbeImpl`/`mcpCloseImpl`（`mcp/face.mjs`——缺省 null = 生产零变）∥ 管面缝：`deps.mcpProbeImpl`/`mcpRemoveImpl`（`mcp/admin-tools.mjs`——同键）。 */
async function buildChatToolFace({ db, deps, log, actor = "admin", actorId = null, senderId = null, now = Date.now }) {
  const chatTools = createChatTools({
    db,
    runtime: deps.runtime ?? null,
    config: deps.config ?? {},
    env: deps.env ?? process.env,
    fetchImpl: deps.fetchImpl ?? fetch,
    ...(deps.requestImpl ? { requestImpl: deps.requestImpl } : {}), // `node:https` 假件缝（连接面 TLS 档——增补 #2；缺省 null）
    ...(deps.discoverFetchImpl ? { discoverFetchImpl: deps.discoverFetchImpl } : {}),
    guard: deps.guard ?? null,
    log,
    actor,
    actorId,
    ...(deps.execImpl ? { execImpl: deps.execImpl } : {}), // SSH 替身注入口（单元测试档——生产缺省 = 真 spawn）
    loopbackFor: (ref) => chatProviderOf({ db, ref, env: deps.env ?? process.env, log, senderId, selfBaseUrl: deps.selfBaseUrl ?? null }),
    ...(deps.modelTestFetch ? { modelTestFetch: deps.modelTestFetch } : {}),
    now,
  })
  let envTools = null
  try {
    envTools = await createEnvTools({ coreTools: deps.coreTools ?? null })
  } catch (e) {
    noteEnvToolsDegraded(log, e) // 环境族不注册（回合不阻断）
  }
  // MCP 管面工具（server-mcp-admin-tools 批——第九件 `mcp`：执行器 `mcp/admin-tools.mjs`，复用 `store.mjs`/`face.mjs`；§12.2）
  const mcpAdmin = createMcpAdminTools({ db, deps, log, actor, actorId, now })
  // MCP 面（server-mcp 批——解裁 ＋ 挂载，§2.2）：缺核/装配失败 ⇒ 不挂载 + 一条警告（回合不阻断）；
  // 重名防御基线 = 静态两面名集（管理 ∥ 环境）+ 管面名（`mcp`——§12.2①）——相撞件由 `mcp/face.mjs` 拒下并记日志。
  let mcpFace = null
  try {
    mcpFace = await createMcpToolFace({ db, deps, log, now, reservedNames: [...chatTools.names, ...(envTools?.names ?? []), ...mcpAdmin.names] })
  } catch (e) {
    noteMcpDegraded(log, e)
  }
  return { tools: mergeToolFaces(chatTools, [envTools, mcpFace, mcpAdmin]), envTools, mcpFace, mcpAdmin }
}

/** 自环基址（§16.2——管理会话出口 = 本进程网关链 loopback）：入参 = `server.address()` 原形（对象）∥ 基址串（注入口）；
 *  通配 `0.0.0.0` ⇒ 拨 `127.0.0.1` ∥ `::` ⇒ `::1` ∥ 具名地址原样（IPv6 加方括号）；不经 nginx。不可解/缺位 ⇒ `null`。 */
export function selfBaseOf(address) {
  if (address === null || address === undefined) return null
  if (typeof address === "string") {
    const trimmed = address.replace(/\/+$/, "")
    return trimmed === "" ? null : trimmed
  }
  const host = address.address === "0.0.0.0" ? "127.0.0.1" : address.address === "::" ? "::1" : address.address
  if (typeof host !== "string" || host === "" || !Number.isInteger(address.port)) return null
  return `http://${host.includes(":") ? `[${host}]` : host}:${address.port}`
}

/** 出口 provider 装配（§16.2/§17.3——loopback 描述子；两消费面同经此点：模型出口 `buildChatExit` ∥ 压缩垫片）：配置 =
 *  `<selfBase>/v1` ＋ **本回合发送者**（登录成员）的 `admin-agent` sk 明文（§16.3——逐请求查库 ⇒ 吊销即断；谁用谁——2026-10-13 16:39 裁）＋ 会话行 `model`（**对外标识**——
 *  与会话创建面/四端客户端同形）＋ 档位（KD-SV-110——`reasoning` ∈ 当刻模型核枚举〔别名解上游真名后〕⇒ 携 `reasoningEffort`；
 *  未设 ∥ 表外 ∥ 缺核 ⇒ 零字段）。**本地 registry 复检保留**（缺模型 ⇒ 会话可建面的既有判据不变）。
 *  失败面（§16.2）：sk 缺位（未登录/已吊销）∥ 自环基址缺位 ⇒ 抛（人话——含「重新登录控制台」）。
 *  出 = `{ provider, upstream }`（`upstream` = 上游真名——规格 ∥ 枚举取值键）。 */
export async function chatProviderOf({ db, ref, reasoning = null, env = process.env, log = null, senderId = null, selfBaseUrl = null } = {}) {
  const { createProviderRegistry, listProviderEntries } = await import("../gateway/providers.mjs")
  const registry = createProviderRegistry(listProviderEntries(db), { env })
  const hit = registry.dispatch(ref)
  if (hit.miss) throw new Error(`模型不可用：${String(ref)}（注册表未命中——建会话时已校验，此处为复检）`)
  const sk = agentKeyOf(db, senderId) // 管理面 sk（§16.3——登录 ensure 产物；主体 = 本回合发送者——谁用谁（用户 2026-10-13 16:39 裁）；缺位 ⇒ 人话）
  if (sk === null) throw new Error("管理会话模型凭据缺位（admin-agent sk 未在册或已吊销）——请重新登录控制台")
  const base = selfBaseOf(typeof selfBaseUrl === "function" ? selfBaseUrl() : selfBaseUrl)
  if (base === null) throw new Error("管理会话模型出口不可用：自环基址缺位（server 监听地址未就绪）")
  let reasoningEffort = null
  if (typeof reasoning === "string" && reasoning !== "") {
    try {
      if ((await levelsOf(hit.model)).includes(reasoning)) reasoningEffort = reasoning
    } catch (e) {
      noteDegraded(log, "chat_assembly", e) // 缺核 ⇒ 零字段（档位面退中性——回合不阻断；真因入日志）
    }
  }
  return {
    provider: {
      baseURL: `${base}/v1`, // 网关链 loopback（不经 nginx——KD-SV-129）
      apiKey: sk.plain, // 管理面 sk 明文（服务端即消费方——§16.3）
      model: ref, // 对外标识（模型 = 会话行外标）
      name: hit.provider.name, // 日志面（provider 名）
      ...(reasoningEffort === null ? {} : { reasoningEffort }), // 未设 ∥ 表外 ⇒ 零字段（口径②）
    },
    upstream: hit.model, // 上游真名（规格 ∥ 档位枚举取值键）
  }
}

/** 模型出口装配（§16.2 ∥ KD-SV-129——管理会话 = 本进程网关链的**进程内客户端**）：出口配置 = 出口 provider（`chatProviderOf`
 *  ——鉴权/派发/准入三件/转发/记账全链逐字复用，零第二份）；`.provider` 随出口携带（§17.3 A3——压缩垫片同源）。
 *  网关侧拒 ⇒ 网关错误形即本出口错误（同径收尾——五终态零新形）。`chatImpl` = 核 `chat` 注入口（单元测试档；生产缺省 = 动载）。 */
export async function buildChatExit({ db, ref, reasoning = null, chatImpl = null, env = process.env, log = null, senderId = null, selfBaseUrl = null } = {}) {
  const { provider } = await chatProviderOf({ db, ref, reasoning, env, log, senderId, selfBaseUrl })
  const chat = chatImpl ?? (await loadCoreChat())
  const exit = async ({ messages, tools, onToken, signal }) => // `signal` 透传核（回合中止——KD-SV-107；缺 ⇒ 核不挂取消链）
    chat(provider, { messages, tools, onToken, signal })
  exit.provider = provider // 压缩垫片 provider（§17.3 A3.2——同一出口描述子）
  return exit
}

/** `usage` 帧成形（§11.3——核 `chat()` 返回的 usage 形 ⇒ 帧面短键；入参缺 ∥ 非对象 ⇒ `null` = 无源零帧；单键缺/非数 ⇒ 0）。 */
export function usageFrameOf(usage) {
  if (usage === null || typeof usage !== "object") return null
  const num = (value) => (typeof value === "number" && Number.isFinite(value) ? value : 0)
  return {
    type: "usage",
    prompt: num(usage.prompt_tokens),
    completion: num(usage.completion_tokens),
    cacheHit: num(usage.prompt_cache_hit_tokens),
    cacheMiss: num(usage.prompt_cache_miss_tokens),
  }
}

/**
 * 跑一个回合（§11——调用前须 `claimChatTurn` 置在途）：`content` = 本轮用户消息 ∥ `images` = 图片 dataURL 串列（空 = 纯文本轮；
 * 两门归路由面）∥ `emit` = 帧出口（`{ type, … }` 对象；断连写失败不反噬回合）∥ `deps` = 注入面（`chat` ∥ `tools` ∥ `runtime` ∥ `config` ∥ `env` ∥ `fetchImpl` ∥ `guard` ∥ `budget`
 * ∥ `cwd`（环境工具面相对路径基准）∥ `coreTools`（核件注入口——环境族真件/替身）∥ `chatImpl`（核 `chat` 注入口）∥ `selfBaseUrl`（自环基址取数——§16.2）
 * ∥ `coreSpecs`/`coreHelpers`/`coreCompact`（§17.3 A1/A2/A3 核件注入口）∥ `compactProvider`（压缩垫片 provider 注入口）
 * ∥ `mcpConnectImpl`/`mcpProbeImpl`/`mcpCloseImpl`（MCP 面替身缝——`mcp/face.mjs`）∥ `mcpRemoveImpl`（管面关会话缝——`mcp/admin-tools.mjs`；缺省 null = 生产零变））
 * ∥ `wake` = 唤醒轮面（非空 ⇒ **无本轮用户消息** ＋ 域文本瞬态尾插——§15.1；用户轮传 `null`）。
 * 出 = `{ status, reason, calls, durationMs }`。落库/审计全在本函数内（执行不依赖连接——单源）；中止登记表随 `finally` 清。
 */
export async function runChatTurn({ db, chatId, content, images = [], emit = null, deps = {}, now = Date.now, log = null, wake = null, senderId = null } = {}) {
  const chat = chatRowOr404(db, chatId)
  const budget = { maxCalls: deps.budget?.maxCalls ?? DEFAULT_MAX_CALLS, maxDurationMs: deps.budget?.maxDurationMs ?? DEFAULT_MAX_DURATION_MS }
  const emitFrame = (frame) => {
    try {
      emit?.(frame)
    } catch (e) {
      log?.warn("chat_stream_write_failed", { chatId: chat.id, message: e?.message ?? String(e) }) // 断连照跑（落库单源）
    }
  }
  const actor = actorNameOf(db, chat.created_by)
  const auditChatCall = ({ tool, call, subject = null, resultCode, truncated = false, summary }) =>
    recordAudit(db, {
      type: "agent_event",
      actor,
      actorId: chat.created_by ?? null,
      target: `chat:${chat.id}`,
      detail: { kind: "chat_call", chatId: chat.id, tool, call, subject, resultCode, truncated, summary },
      ts: now(),
    })
  const auditChatStop = (reason, summary) =>
    recordAudit(db, {
      type: "agent_event",
      actor,
      actorId: chat.created_by ?? null,
      target: `chat:${chat.id}`,
      detail: { kind: "chat_stop", chatId: chat.id, reason, summary },
      ts: now(),
    })

  let askHost = null // 审批 ask 宿主（§11.5——回合环装配面开、`finally` 关）
  try {
    if (wake === null) {
      appendMessage(db, chat.id, { role: "user", content, data: imagePartsOf(images), now }) // 逐条增量落库（本轮消息先落——断连亦留痕；图片轮携 parts 形）
    }
    // 投递汇（§15.1——回合边界兜底：到期 timer ∥ 后台任务结算 ⇒ 落库 `user` 行 + `kind="reminder"`，随历史进上下文）
    try {
      await deliverPending(chat.id, { db, now, log, coreTools: deps.coreTools ?? null })
    } catch (e) {
      log?.warn("chat_delivery_failed", { chatId: chat.id, message: e?.message ?? String(e) }) // 件留汇面——下一回合边界/唤醒面兜底重试（零静默丢）
    }
    // 历史装配（§17.3）：回放条目（A3 标记感知——覆盖区间以标记行代；`seq`/`covers` 供压缩覆盖映射）⇒ A2 修复（核 `repairHistory`；缺核 ⇒ 原样）
    const entries = replayEntriesOf(listMessages(db, chat.id))
    const history = await repairTurnHistory(entries.map((entry) => entry.message), { coreHelpers: deps.coreHelpers ?? null, log })
    // 唤醒轮域文本（§15.1——核常量单源；**瞬态尾插不落库**——沿 §14.1 口径）∥ 环境块（§14.1/KD-SV-112——三活体行尾插；
    // **瞬态不落库**）：先收集，压缩后统一入装配（§17.3 A3——压缩面只见历史段）
    const wakeLine = wake === null ? null : { role: "user", content: wake.domain }
    const envLines = buildEnvLines({ db, model: chat.model, reasoning: chat.reasoning ?? null, cwd: deps.cwd, now, env: deps.env ?? process.env })
      .map((line) => ({ role: "user", content: line }))
    // 工具面（§14.2）：注入面（deps.tools ∥ 模块级）优先；否则 = 管理面九件 + 环境六族八件 + MCP 面合并。
    const injectedFace = deps.tools ?? injectedTools ?? null
    const face = injectedFace === null ? await buildChatToolFace({ db, deps, log, actor, actorId: chat.created_by ?? null, senderId: senderId ?? chat.created_by ?? null, now }) : { tools: injectedFace, envTools: null, mcpFace: null }
    const tools = face.tools
    // 文本面名集（环境族 ∪ MCP 面——模型可见形 = 核件文本原文，非 JSON 壳；KD-SV-113 ∥ §2.2）
    const textNames = new Set([...(face.envTools?.names ?? []), ...(face.mcpFace?.names ?? [])])

    const started = now()
    let calls = 0
    const turnSecrets = [] // 本轮已见敏感值（工具入参）——下游文本（结果/摘要/notice）一并掩蔽

    /** 异常收尾（②③④——notice 行 + `chat_stop` 审计 + `end` 帧 `failed`）：部分文本 ⇒ `assistant` 行如实落库。 */
    const closeFailed = (reason, detail, partialText = "") => {
      if (typeof partialText === "string" && partialText.trim() !== "") {
        appendMessage(db, chat.id, { role: "assistant", content: partialText, now })
      }
      const text = capSummary(noticeTextOf(reason, detail), turnSecrets) // 摘要口径（≤300 字 + 掩蔽）——notice 行 ∥ `chat_stop` 审计 ∥ `end` 帧三面同源
      appendMessage(db, chat.id, { role: "notice", content: text, data: { reason }, now })
      auditChatStop(reason, text)
      const durationMs = now() - started
      emitFrame({ type: "end", status: "failed", reason: text, durationMs, calls }) // 帧面读数（§11.3——可字段）
      return { status: "failed", reason: text, calls, durationMs }
    }

    // 中止信号（KD-SV-107——在途调用当即中断之口）：登记 ⇒ 路由 `…/abort` 即触发；`finally` 清登记。
    const controller = new AbortController()
    abortSignals.set(chat.id, controller)
    // 环境工具面 ctx（§14.2/§16.1/§15.1）：`cwd` = 相对路径基准（无围栏）∥ `signal` = 中止信号透传（bash 树杀同源）∥ `agent` = 会话垫片
    // （timer ∥ 历史读面 ∥ 异步池宿主）∥ `depth: 0`；结算钩子装配（§15.1 ②——池结算尾唤醒面，幂等同形覆写）。
    const pad = timerPadOf(chat.id)
    pad._recordStore = recordStoreOf(db, chat.id) // 本会话历史读面（`read_history` 记录面——§16.1）
    installSettleHook({ chatId: chat.id, db, deps, now, log, senderId })
    const envCtx = { cwd: deps.cwd, signal: controller.signal, agent: pad, depth: 0 }

    // 模型出口装配（§16.2）：注册表缺位/引用缺位/凭据缺位/基址缺位 ⇒ 按「模型错误」收尾（五终态不外溢第三形）
    let modelExit
    try {
      modelExit = deps.chat ?? injectedChat ?? (await buildChatExit({
        db,
        ref: chat.model,
        reasoning: chat.reasoning ?? null,
        env: deps.env ?? process.env,
        log,
        senderId: senderId ?? chat.created_by ?? null, // 凭据主体 = 发送者（谁用谁）；唤醒轮随最近发送者（上下文缺位 ⇒ 主人兜底）
        selfBaseUrl: deps.selfBaseUrl ?? null,
        chatImpl: deps.chatImpl ?? null,
      }))
    } catch (e) {
      return closeFailed("model_error", e?.message ?? String(e), "")
    }

    // A1 规格（§17.3）：上游真名（别名反查——§11.4 解析单源）⇒ 核规格；缺核 ∥ 缺名 ⇒ `null`（自建形回落——回合不阻断）
    const assistantSpec = await specOfRef({ db, ref: chat.model, coreSpecs: deps.coreSpecs ?? null, log })
    // A3 压缩（§17.3——回合起跑段：本轮消息与投递落库后、模型调用前）：阈值触发 ⇒ 标记行落库（覆盖区间以标记行代——回放面解析）
    const compacted = await compactTurnHistory({
      entries,
      history,
      provider: deps.compactProvider ?? modelExit.provider ?? null, // loopback 描述子（缺位 ⇒ 跳过压缩）
      systemPrompt: CHAT_SYSTEM_BRIEF,
      tools: tools.schemas,
      signal: controller.signal,
      cwd: deps.cwd,
      coreCompact: deps.coreCompact ?? null,
      pad,
      chatId: chat.id,
      log,
    })
    if (compacted.covers !== null) {
      appendMessage(db, chat.id, { role: "user", content: compacted.note, data: { kind: COMPACTION_KIND, covers: compacted.covers }, now })
    }
    // 本轮消息装配（系统简报 + 压缩后历史 + 唤醒域文本 + 环境块——§11/§14.1/§17.3）
    const messages = [{ role: "system", content: CHAT_SYSTEM_BRIEF }, ...compacted.history]
    if (wakeLine !== null) messages.push(wakeLine)
    for (const line of envLines) messages.push(line)
    askHost = createChatAskHost({ db, chatId: chat.id, emit: emitFrame, stream: emit, hasStream: typeof emit === "function", autoApprove: chat.auto_approve === 1, tools, parseArgs: parseToolArgs, argsOf: argsTextOf, isAborted: () => isChatAbortRequested(chat.id), auditCall: auditChatCall, textNames, now, log })

    let modelCalls = 0
    for (;;) {
      const elapsed = now() - started
      if (elapsed > budget.maxDurationMs) {
        return closeFailed("budget", `预算超限（时长 ${Math.round(elapsed / 1000)}s > 上限 ${Math.round(budget.maxDurationMs / 1000)}s）——停`)
      }
      if (calls >= budget.maxCalls) {
        return closeFailed("budget", `预算超限（工具调用 ${calls} ≥ 上限 ${budget.maxCalls} 次）——停`)
      }
      if (isChatAbortRequested(chat.id)) return closeFailed("aborted", null, "") // 检查点①（模型调用前）
      let turn
      let streamed = ""
      modelCalls += 1
      emitFrame({ type: "turn", n: modelCalls }) // 帧面读数（§11.3——每次模型调用前）
      try {
        turn = await modelExit({
          messages,
          tools: tools.schemas,
          signal: controller.signal,
          onToken: (token) => {
            if (typeof token !== "string" || token === "") return
            streamed += token
            emitFrame({ type: "delta", text: token })
          },
        })
      } catch (e) {
        // 中止 ⇒ 第五终态（`AbortError` 与模型错误同形 ⇒ 判决读登记表）
        if (isChatAbortRequested(chat.id)) return closeFailed("aborted", null, streamed)
        return closeFailed("model_error", e?.message ?? String(e), streamed)
      }
      const usageFrame = usageFrameOf(turn?.usage)
      if (usageFrame !== null) emitFrame(usageFrame) // 每次模型调用后（有源才发）
      const text = typeof turn?.content === "string" && turn.content !== "" ? turn.content : streamed // 已生成文本优先（流式增量兜底——如实落库）
      const toolCalls = normalizeToolCalls(turn?.toolCalls)
      if (toolCalls.length === 0) {
        if (text.trim() === "") return closeFailed("empty_turn", null, "")
        appendMessage(db, chat.id, { role: "assistant", content: text, now })
        messages.push({ role: "assistant", content: text })
        const durationMs = now() - started
        emitFrame({ type: "end", status: "succeeded", durationMs, calls }) // 帧面读数（§11.3）
        return { status: "succeeded", reason: null, calls, durationMs }
      }
      // 有工具调用：assistant 行 + 回灌形（§17.3 A1——核件构造；回声族携 `reasoning_content`；签名在场才带；落库 ⇔ 回放逐值）
      const pending = toolCalls.map((call) => ({ ...call, args: argsFullOf(call.arguments) })) // 落库/回放 = 掩蔽原文（JSON 有效——2026-10-14 缺陷修；帧/审计摘要面另取 `argsTextOf`）
      await askHost.preflight(pending) // 写类门挡（单件 ∥ 批——同批次 >1 写类恰一卡；§11.5）
      const assistantTurn = await assistantTurnOf({
        text,
        toolCalls: pending.map((call) => ({ id: call.id, name: call.name, arguments: call.args, extraContent: call.extraContent })),
        reasoning: turn?.reasoning,
        spec: assistantSpec,
        coreSpecs: deps.coreSpecs ?? null,
        log,
      })
      appendMessage(db, chat.id, { role: "assistant", content: text, data: assistantTurn.data, now })
      messages.push(assistantTurn.message)
      for (let index = 0; index < pending.length; index++) {
        const call = pending[index]
        const overBudget = calls >= budget.maxCalls || now() - started > budget.maxDurationMs
        if (overBudget) {
          // 预算在调用途中触发：未执行调用逐条落「未执行」结果（消息序一致——回放不缺 tool 行）
          for (const rest of pending.slice(index)) {
            const unrun = { ok: false, message: "预算超限——未执行（回合已停）" }
            const unrunText = JSON.stringify(unrun)
            appendMessage(db, chat.id, { role: "tool", content: unrunText, data: { toolCallId: rest.id, name: rest.name, ok: false, summary: unrun.message }, now })
            messages.push({ role: "tool", tool_call_id: rest.id, content: unrunText })
          }
          const detail = calls >= budget.maxCalls
            ? `预算超限（工具调用 ${calls} ≥ 上限 ${budget.maxCalls} 次）——停`
            : `预算超限（时长 ${Math.round((now() - started) / 1000)}s > 上限 ${Math.round(budget.maxDurationMs / 1000)}s）——停`
          return closeFailed("budget", detail, "")
        }
        if (isChatAbortRequested(chat.id)) { askHost.rejectRest(pending.slice(index)); return closeFailed("aborted", null, "") } // 检查点②（工具调用前）——在决拒行/审计随中止径落（B83）
        const admission = await askHost.admit(call) // 逐调用放行判（`oneByOne` 在此依序弹卡；拒 ⇒ 不执行——B82）
        calls += 1
        emitFrame({ type: "call", id: call.id, name: call.name, args: argsTextOf(call.arguments) }) // 帧面 = 摘要 ≤500（§11.3——落库面已改全文）
        const args = parseToolArgs(call.arguments)
        const secrets = args === null ? [] : secretValuesOf(args)
        turnSecrets.push(...secrets)
        const rejected = admission.allow === false ? { ok: false, message: admission.message } : null // 拒执行形（工具行/`result` 帧/`chat_call` 三面同值）
        const result = rejected ?? (args === null ? { ok: false, message: "工具入参非 JSON 对象" } : await tools.invoke(call.name, args, envCtx))
        const summary = summaryOfResult(result, secrets)
        emitFrame({ type: "result", id: call.id, ok: result?.ok === true, summary })
        // 模型可见形：文本面族（环境 ∥ MCP）= 核件文本原文（`output`——非 JSON 壳，KD-SV-113 被否栏）；管理族 = 结构化结果（既有形零变）
        const rawText = textNames.has(call.name) ? envToolText(result) : JSON.stringify(result ?? null)
        const resultText = maskSecrets(rawText, secrets)
        const truncated = resultText.length > CHAT_TOOL_CONTENT_MAX // 结果可见形截断位（KD-SV-114——审计 `truncated`）
        const trimmed = capToolContent(resultText) // 模型可见形（≤4000 字含注记——回放逐字一致）
        appendMessage(db, chat.id, { role: "tool", content: trimmed, data: { toolCallId: call.id, name: call.name, ok: result?.ok === true, summary, args: argsTextOf(call.arguments) }, now }) // data.args = 帧同点同值（展示单源——回读卡参数不再恒空）
        messages.push({ role: "tool", tool_call_id: call.id, content: trimmed })
        const rawSubject = typeof result?.subject === "string" ? result.subject : "" // §12 exec 行 ∥ §14.4：**结果携 `subject` ⇒ 用之**（管理族零携 ⇒ 零变；env 族同值）
        auditChatCall({
          tool: call.name,
          call: capText(maskSecrets(call.args, secrets), CHAT_CALL_ARGS_MAX),
          subject: rawSubject !== "" ? capSubject(rawSubject, secrets) : textNames.has(call.name) ? "" : null,
          resultCode: Number.isInteger(result?.exitCode) ? result.exitCode : result?.ok === true ? 0 : -1, // exec 携退出码（N80：resultCode = exitCode）
          truncated,
          summary,
        }) // 逐调用一行（读动作同落——KD-SV-91；详情扩字段——KD-SV-114）
      }
    }
  } finally {
    askHost?.close() // 审批 ask 宿主收尾（未决全拒——KD-SV-227 兜底三径之一）
    // 中止面（§15.1——非 interrupt 全停：池条目控制器已中止 ⇒ 杀树 + 丢弃提醒入汇 + 墓碑；判据内建于核件）
    await discardAbortedChatTasks(chat.id, { log, coreTools: deps.coreTools ?? null })
    clearChatAbort(chat.id) // 登记表随回合生命周期（单源——零残留）
    settleChatIdle(db, chat.id, { now })
  }
}

/**
 * 跑一个唤醒回合（§15.1/§16.2——与用户回合**同环同面**，零第二套环）：无路由、无帧面（`emit = null`——控制台页不订阅；
 * 落库单源，用户下次读取即见）。起跑 = `claimChatTurn`（撞忙/会话行缺 ⇒ `{ status: "skipped" }`——不抛不炸）；
 * **投递先于装配**（`deliverPending` ⇒ 行随历史进上下文——零二次注入）；交付 0 件 ⇒ 早退 `skipped`（零空转消费）；
 * 域文本 = 核常量（`source` 分派：`timer` ⇒ `TIMER_TURN_DOMAIN` ∥ `settle` ⇒ `AUTO_TURN_DIGEST_DOMAIN`）瞬态尾插（不落库）；
 * 尾 = 再武装（§15.1 三链尾②——**不再消化**：零交付/落库失败面由下一回合边界/结算钩子兜底，防自旋）。
 * 出 = `{ status, reason, calls?, durationMs?, delivered }`。
 */
export async function runChatWakeTurn({ db, chatId, source = "timer", deps = {}, now = Date.now, log = null, senderId = null } = {}) {
  try {
    claimChatTurn(db, chatId, { now })
  } catch (e) {
    return { status: "skipped", reason: "busy", delivered: 0 } // 撞忙 ∥ 会话行缺位（E56——零动作不炸进程）
  }
  try {
    let delivered = 0
    try {
      delivered = await deliverPending(chatId, { db, now, log, coreTools: deps.coreTools ?? null })
    } catch (e) {
      log?.warn("chat_wake_delivery_failed", { chatId: Number(chatId), message: e?.message ?? String(e) })
    }
    if (delivered <= 0) {
      settleChatIdle(db, chatId, { now })
      return { status: "skipped", reason: "no_delivery", delivered: 0 }
    }
    let domains
    try {
      domains = await loadCoreTurnDomains({ coreDomains: deps.coreDomains ?? null })
    } catch (e) {
      noteEnvToolsDegraded(log, e) // 缺核 ⇒ 域文本不可得（不空转开轮；生产镜像内核为声明依赖）
      settleChatIdle(db, chatId, { now })
      return { status: "skipped", reason: "no_domain", delivered }
    }
    const domain = source === "settle" ? domains.AUTO_TURN_DIGEST_DOMAIN : domains.TIMER_TURN_DOMAIN
    const result = await runChatTurn({ db, chatId, content: "", emit: null, deps, now, log, wake: { source, domain }, senderId })
    return { ...result, delivered }
  } finally {
    try {
      await armChatWake({ chatId, db, deps, now, log, senderId })
    } catch (e) {
      log?.warn("chat_wake_arm_failed", { chatId: Number(chatId), message: e?.message ?? String(e) })
    }
  }
}
