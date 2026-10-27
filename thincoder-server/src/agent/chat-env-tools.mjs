/**
 * chat-env-tools.mjs — 环境工具面六族八件（`agent/ADMIN-AGENT.md` §14.2/§14.3 ∥ KD-SV-113；admin-agent-awareness 批——台账 #1310；
 * 第八件 `read_history` = server-wake-face 批 · 修订轮——§16.1 ∥ KD-SV-131）：
 * 件 = `get_current_time` ∥ `process` ∥ `timer` ∥ `ls` ∥ `read` ∥ `grep` ∥ `bash` ∥ `read_history`——**核件原文复用**（实现 ∥ schema ∥ 描述
 * 三面同源；动载 `@thincoder/core/tools/*` + `@thincoder/core/agent-tools/*`——沿 `loadCoreChat` 先例）；本面只做 ① ctx 适配
 * ② 结果归一 ③ 限幅处置 ④ timer 挂表 ⑤ 投递汇落库 ⑥ 异步池宿主。**不收窄 schema**（端池参数运行期处置——§14.2）。
 *
 * ctx 适配（§14.2）：`{ cwd, signal, agent, depth: 0 }`——`cwd` = 相对路径基准（`ctx.cwd`——无围栏）∥
 * `signal` = 回合中止信号（透传 ⇒ bash 树杀）∥ `agent` = 会话垫片（`{ _pendingTimers, history, _recordStore }`——核 `timer` 工具直写
 * `_pendingTimers`；`history` = 核注入单点落点；`_recordStore` = 会话历史读面 `recordStoreOf`——§16.1 ∥ `depth: 0`。
 * **垫片即宿主**（§15.1 ∥ KD-SV-126——零自造池）：核 bash 异步径（见 `ctx.agent` ⇒ `launchBgTask`）的池/pending/唤醒栓逐字段落在垫片上
 * （`_bgTasks` ∥ `_pendingAsyncResults` ∥ `_asyncWaiters`——逐字段以核件读取面为准；`history` 数组 = carrier 回落）。
 * 结果归一（KD-SV-113）：`{ ok, subject, summary, output }`——`ok` = 调用完成（未抛错；命令非零退出 ⇒ `ok:true`，
 * 退出码在输出文本内 `(exit code N)`——**不解析**）；`output` = 核件文本原文（**模型可见形**——落库 ≤4000 字截断归会话面）；
 * `subject` = 主语原文（审计数据源——§14.4；`read_history` ⇒ 过滤摘要——§16.1）；`summary` = 人话单行。**模型可见形 = 文本原文（非 JSON 壳——KD-SV-113 被否栏）**。
 * 限幅（§14.3——`bash` 三件）：超时缺省 120_000 ms（核 `BASH_TIMEOUT_MS`；无上限——自造 600s 顶已按用户 2026-10-12 15:00 裁撤）
 * ∥ 输出三层（工具层 200K 字 ∥ 每流 2MB = 核件；落库 ≤4_000 字 = 会话面；帧/审计摘要 ≤300 字）∥ 工作目录 = `ctx.cwd`。
 * 端池参数（§14.2——`bash.async` 在册，§15.1）：`bash.async:true` ⇒ 核件异步径（回执即工具结果；帽 4 ∥ 池 ∥ 结算 ∥ 杀单点全在核）；
 * `process.kill` 的 `id` 靶 = 后台任务杀点（核 `killBgTask`——杀树 + 出池 + 墓碑）；`kill pid` 在册（与 bash 等价——含杀 server 自身进程的操作者自伤面，R62②披露）；
 * `read_history` 的 `path` 非空（文件路径 ∥ `cwd:<dir>` ∥ `all`）⇒ 工具级错误人话（本会话作用域——§16.1；缺省/空串 = 本会话）。
 * 投递汇（§15.1——timer 到期 ∥ 后台任务结算 ∥ 中止丢弃提醒）：进程内按会话挂垫片（零持久化——重启天然空，沿中止登记表先例）；
 * `deliverPending` = ① 出列（核`deliverExpiredTimers` 幂等）② 池在途结算逐件注入（核 `injectBgResult`——消费即墓碑）
 * ③ **汇面逐行落库**（`user` 行 + `data.kind="reminder"`——随历史进上下文，回放 ⇒ 模型后续回合仍可见；落库失败 ⇒ 该行留汇下次重试）。
 * 空闲自唤醒 = `chat-wake.mjs`（唤醒器；本档只出投递面与中止收尾）。
 */
import { appendMessage } from "./chat-store.mjs"

/** 八件（§14.2 表——族序：时间 ∥ 进程 ∥ 提醒 ∥ 文件读取族 ∥ 命令 ∥ 会话）。 */
export const ENV_TOOL_NAMES = Object.freeze(["get_current_time", "process", "timer", "ls", "read", "grep", "bash", "read_history"])

/** 六族（§14.2 表逐行——断言/展示面；第八件 `read_history` = 第六族「会话」——修订轮 §16.1）。 */
export const ENV_TOOL_FAMILIES = Object.freeze([
  { family: "时间", tools: Object.freeze(["get_current_time"]) },
  { family: "进程", tools: Object.freeze(["process"]) },
  { family: "提醒", tools: Object.freeze(["timer"]) },
  { family: "文件读取族", tools: Object.freeze(["ls", "read", "grep"]) },
  { family: "命令", tools: Object.freeze(["bash"]) },
  { family: "会话", tools: Object.freeze(["read_history"]) },
])

/** 限幅取值（§14.3）：缺省 = 核 `BASH_TIMEOUT_MS`（`thincoder-core/tools/shared.mjs`——**镜像常量，核值变更须同拍**）∥ 无上限（自造 600s 顶已撤——用户 2026-10-12 15:00）。 */
export const ENV_BASH_TIMEOUT_DEFAULT_MS = 120_000

let coreToolsCache = null // 懒载缓存（真核八件 + 形转换 + 投递/中止两读面）
let coreToolsError = null // 装载失败缓存（零重试）
let coreDomainsCache = null // 唤醒轮域文本缓存（懒载——同上一档先例）
let warnedDegraded = false // 缺核警告旗（一进程一条）

/** 缺核退化警告（模块级旗——一进程一条；用法同 `gateway/reasoning-levels.mjs` 的 `noteDegraded`）。
 *  出 = 本条是否发出；`error` = 失败因（携进日志——免「真核 API 漂移」与「未装载」同为一条人话不可辨）。 */
export function noteEnvToolsDegraded(log = null, error = null) {
  if (warnedDegraded === true) return false
  warnedDegraded = true
  log?.warn?.("chat_env_tools_core_missing", {
    cause: error === null ? null : String(error?.message ?? error),
    message: "环境工具面不可用：@thincoder/core 未装载——环境族不注册（回合不阻断；生产镜像内核为声明依赖）",
  })
  return true
}

/**
 * 核件装载（动载——沿 `loadCoreChat` 先例；失败缓存零重试）：八件 + `toOpenAISchema`（形转换单源）+
 * 投递汇两读面（§15.1：`deliverExpiredTimers` ∥ `injectBgResult` ∥ `writeTombstone`）+ 中止收尾面（`discardAbortedBgTasks`）。
 * 缺核 ⇒ 抛（调用侧退化——环境族不注册；生产镜像内核为声明依赖，§14.5）。
 */
export async function loadCoreEnvTools() {
  if (coreToolsCache !== null) return coreToolsCache
  if (coreToolsError !== null) throw coreToolsError
  try {
    const [ops, timer, search, file, bash, shared, timers, readHistory, bashAsync, settle, discard] = await Promise.all([
      import("@thincoder/core/tools/ops.mjs"), // get_current_time ∥ process
      import("@thincoder/core/agent-tools/timer.mjs"), // timer
      import("@thincoder/core/tools/search.mjs"), // ls ∥ grep
      import("@thincoder/core/tools/file.mjs"), // read
      import("@thincoder/core/tools/bash.mjs"), // bash
      import("@thincoder/core/tools/shared.mjs"), // toOpenAISchema（schema 形单源）
      import("@thincoder/core/agent/timers.mjs"), // deliverExpiredTimers（投递汇①——timer 面出列幂等）
      import("@thincoder/core/agent-tools/read-history.mjs"), // read_history（第八件——§16.1）
      import("@thincoder/core/agent-tools/bash-async.mjs"), // injectBgResult（投递汇②——后台任务送达）
      import("@thincoder/core/agent-tools/async-settle.mjs"), // writeTombstone（异常件墓碑单点）
      import("@thincoder/core/agent-tools/async-discard.mjs"), // discardAbortedBgTasks（中止收尾——§15.1）
    ])
    coreToolsCache = Object.freeze({
      getCurrentTimeTool: ops.getCurrentTimeTool,
      processTool: ops.processTool,
      timerTool: timer.timerTool,
      lsTool: search.lsTool,
      readTool: file.readTool,
      grepTool: search.grepTool,
      bashTool: bash.bashTool,
      readHistoryTool: readHistory.readHistoryTool,
      toOpenAISchema: shared.toOpenAISchema,
      deliverExpiredTimers: timers.deliverExpiredTimers,
      injectBgResult: bashAsync.injectBgResult,
      writeTombstone: settle.writeTombstone,
      discardAbortedBgTasks: discard.discardAbortedBgTasks,
    })
    return coreToolsCache
  } catch (e) {
    coreToolsError = e
    throw e
  }
}

/** 唤醒轮域文本装载（§15.1——文案单源 = 核 `agent/helpers.mjs`；`coreDomains` = 注入口）。 */
export async function loadCoreTurnDomains({ coreDomains = null } = {}) {
  if (coreDomains !== null) return coreDomains
  coreDomainsCache ??= await import("@thincoder/core/agent/helpers.mjs")
  return coreDomainsCache
}

/**
 * 环境工具面装配（§14.2）：`coreTools` = 核件注入口（单元测试档走仓内直引真件；缺省 ⇒ 动载）。
 * 出 = `{ names, schemas, invoke }`——`invoke(name, args, ctx)` 不抛（未知件 ∥ 参数不合 ∥ 核件抛错 ⇒ `{ ok:false, … }`）。
 */
export async function createEnvTools({ coreTools = null } = {}) {
  const core = coreTools ?? (await loadCoreEnvTools())
  const toolOf = {
    get_current_time: core.getCurrentTimeTool,
    process: core.processTool,
    timer: core.timerTool,
    ls: core.lsTool,
    read: core.readTool,
    grep: core.grepTool,
    bash: core.bashTool,
    read_history: core.readHistoryTool,
  }
  const missing = ENV_TOOL_NAMES.filter((name) => !toolOf[name])
  if (missing.length > 0) throw new Error(`环境工具面缺件：${missing.join(" ∥ ")}（核件装载不完整）`)
  if (typeof core.toOpenAISchema !== "function") throw new Error("环境工具面缺件：toOpenAISchema（schema 形转换单源）")
  const schemas = ENV_TOOL_NAMES.map((name) => core.toOpenAISchema(toolOf[name]))

  /** 工具调用入口（不抛——见档头；`ok` = 调用完成，非命令退出码语义）。 */
  async function invoke(name, args = {}, ctx = {}) {
    const tool = toolOf[name]
    if (!tool) {
      const message = `未知环境工具：${String(name)}（${ENV_TOOL_NAMES.join(" ∥ ")}）`
      return { ok: false, subject: "", summary: message, message }
    }
    const params = args !== null && typeof args === "object" && !Array.isArray(args) ? args : {}
    const subject = subjectOf(name, params)
    const refused = refuseEndpointParams(name, params, subject) // 端池参数处置（§14.2/§16.1）
    if (refused !== null) return refused
    try {
      const output = await tool.execute(params, {
        cwd: ctx.cwd,
        signal: ctx.signal,
        agent: ctx.agent ?? null,
        depth: 0,
      })
      const text = typeof output === "string" ? output : JSON.stringify(output ?? null)
      return { ok: true, subject, summary: summaryOf(name, subject, text), output: text }
    } catch (e) {
      const message = e?.message ?? String(e)
      return { ok: false, subject, summary: message, message } // 工具级错误回灌（回合不停）
    }
  }

  /** 判类维（KD-SV-225——环境族 = 核工具 `readonly` 旗逐字：`true` = 读类零弹 ∥ `false`/缺旗 = 写类弹卡）。 */
  function readonlyOf(name) {
    return toolOf[name]?.readonly === true
  }

  return { names: ENV_TOOL_NAMES, schemas, readonlyOf, invoke }
}

/** 端池参数处置（§14.2/§16.1）：`read_history.path` 拒（本会话作用域）∥ `bash` 超时取值校验（仅拒非有限值/小于 1——无上限）；过 ⇒ `null`。 */
function refuseEndpointParams(name, params, subject) {
  if (name !== "bash" && name !== "read_history") return null
  const refusal = (message) => ({ ok: false, subject, summary: message, message })
  if (name === "read_history") {
    // 跨会话各族（文件路径 ∥ `cwd:<dir>` ∥ `all`）在服务面无物（一会话 = 一行 `agent_chats`）⇒ 运行期拒（零 schema 收窄——§16.1）
    const path = params.path
    if (path !== undefined && path !== null && String(path).trim() !== "") {
      return refusal(`read_history 的 path 不可用：${String(path)}（本面作用域 = 本会话——去掉 path 按本会话查询）`)
    }
    return null
  }
  const timeout = params.timeout
  if (timeout !== undefined && timeout !== null && timeout !== "") {
    const value = Number(timeout)
    // 无上限（用户 2026-10-12 15:00 裁撤自造 600s 顶——核件本无上限，跑飞可由 process 杀）：
    // 仅拒非法取值（零静默钳制）；上界 = Node 计时器量程——逾 2^31−1 ms 会被归 1 ms 立即触发（实测），
    // 显式拒之，免「荒谬值 ⇒ 秒杀」的静默错行为（非策略顶：24.8 天以内任意值悉收）。
    if (!Number.isFinite(value) || value < 1 || value > 2_147_483_647) {
      return refusal(`bash timeout 非法：${String(timeout)}（须为 ≥1 且 ≤2147483647 的毫秒数；缺省 ${ENV_BASH_TIMEOUT_DEFAULT_MS} ms）`)
    }
  }
  return null
}

/** 主语原文（审计数据源——§14.4）：命令原文 ∥ 路径 ∥ 正则；余件取紧凑主事词；`get_current_time` 无主事词 ⇒ 空。 */
export function subjectOf(name, args = {}) {
  const text = (value) => (typeof value === "string" ? value : value === null || value === undefined ? "" : String(value))
  if (name === "bash") return text(args.command)
  if (name === "read") return text(args.path ?? args.filePath)
  if (name === "ls") return text(args.path ?? ".")
  if (name === "grep") return text(args.pattern)
  if (name === "process") {
    const action = text(args.action ?? "list")
    if (action === "kill") {
      if (args.pid !== undefined && args.pid !== null && args.pid !== "") return `kill pid ${text(args.pid)}`
      if (args.id !== undefined && args.id !== null && args.id !== "") return `kill id ${text(args.id)}`
      return "kill"
    }
    return args.name !== undefined && args.name !== null && args.name !== "" ? `list ${text(args.name)}` : "list"
  }
  if (name === "timer") {
    // 逐式主语（工具解算序：cancel → list → at → every → daily → 缺省一次性）；一次性式（含缺省 ∥ `message` 缀）逐字零变。
    const message = typeof args.message === "string" && args.message !== "" ? ` ${args.message}` : ""
    const present = (value) => value !== undefined && value !== null
    if (present(args.cancel)) return `cancel ${text(args.cancel)}`
    if (args.list === true) return "list"
    if (present(args.at)) return `at ${text(args.at)}${message}`
    if (present(args.every)) {
      const every = Number(args.every)
      return `every ${Number.isFinite(every) ? `${every}s` : text(args.every)}${message}`
    }
    if (present(args.daily)) return `daily ${text(args.daily)}${message}`
    const seconds = args.seconds === undefined || args.seconds === null ? 180 : Number(args.seconds)
    return `set ${Number.isFinite(seconds) ? seconds : text(args.seconds)}s${message}`
  }
  if (name === "read_history") {
    // 过滤摘要（§16.1——审计 subject）：逐项、缺项不列（`role=… keyword=… tool=… since=… until=… limit=… direction=…`）
    const parts = []
    for (const key of ["role", "keyword", "tool", "since", "until", "limit", "direction"]) {
      const value = args[key]
      if (value !== undefined && value !== null && value !== "") parts.push(`${key}=${text(value)}`)
    }
    return parts.join(" ")
  }
  return "" // get_current_time（无主事词）
}

/** 人话单行摘要（§14.2）：bash ⇒ 核件结果末行状态行；get_current_time/timer ⇒ 核件返回首行；余 = 工具名 + 主语。 */
export function summaryOf(name, subject = "", text = "") {
  const value = typeof text === "string" ? text : ""
  if (name === "bash") return statusLineOf(value)
  if (name === "get_current_time" || name === "timer") return value.split("\n").find((line) => line.trim() !== "") ?? ""
  return subject === "" ? name : `${name} ${subject}`
}

/** 状态行（核件 bash 结果末行形 `(exit code N)` ∥ `(killed: …)`；无 ⇒ 末非空行）。 */
function statusLineOf(text) {
  const lines = text.split("\n").map((line) => line.trim()).filter((line) => line !== "")
  for (let i = lines.length - 1; i >= 0; i--) {
    if (/^\(.*\)$/.test(lines[i])) return lines[i]
  }
  return lines.at(-1) ?? ""
}

// ── 会话垫片与投递汇（§15.1——进程内垫片 ∥ 出列 ∥ 落库；空闲唤醒器 = `chat-wake.mjs`）──────────────

/** 会话垫片表（进程内——零持久化：重启天然空；沿中止登记表先例）。 */
const timerPads = new Map()

/** 会话垫片（`{ _pendingTimers, history }`——核 `timer` 工具直写 `_pendingTimers`；`history` = 核注入单点落点；
 *  bash 异步径的池/pending/唤醒栓由核件就地落面——垫片即宿主，§15.1）。 */
export function timerPadOf(chatId) {
  const key = Number(chatId)
  let pad = timerPads.get(key)
  if (!pad) {
    pad = { _pendingTimers: [], history: [] }
    timerPads.set(key, pad)
  }
  return pad
}

/** 在途 timer 条数（诊断/断言——零副作用）。 */
export function pendingTimerCount(chatId) {
  return timerPadOf(chatId)._pendingTimers.length
}

/** 核件面缺失检查（fail-loud——缺件 ⇒ 显式错误，不静默降级；沿 `createEnvTools` 缺件先例）。 */
function requireCoreFace(core, names, faceName) {
  const missing = names.filter((name) => typeof core?.[name] !== "function")
  if (missing.length > 0) throw new Error(`${faceName}缺件：${missing.join(" ∥ ")}（核件装载不完整）`)
}

/**
 * 回合边界投递（§15.1——投递汇）：
 * ① timer 面出列（核 `deliverExpiredTimers`——幂等、零在途早退）；
 * ② 池在途结算逐件注入（核 `injectBgResult`——消费即墓碑；异常 role ⇒ 出列 + 墓碑 + 一条警告，防死循环）；
 * ③ 汇面逐行**落库**（`user` 行 + `data.kind="reminder"`——送达行入会话记录；落库失败 ⇒ 该行留汇、下次重试，零静默丢）。
 * 出 = 本次落库行数（零件 ⇒ 0）。
 */
export async function deliverPending(chatId, { db = null, now = Date.now, log = null, coreTools = null } = {}) {
  if (!db) throw new Error("deliverPending：缺少 db（投递落库面）")
  const core = coreTools ?? (await loadCoreEnvTools())
  requireCoreFace(core, ["deliverExpiredTimers", "injectBgResult", "writeTombstone"], "投递汇")
  const pad = timerPadOf(chatId)
  core.deliverExpiredTimers(pad, { now: now() }) // ① timer 面（出列幂等——绝不重复投递）
  const pending = Array.isArray(pad._pendingAsyncResults) ? pad._pendingAsyncResults : []
  for (const entry of [...pending]) { // ② 池在途结算（核件消费即墓碑）
    const index = pending.indexOf(entry)
    if (index >= 0) pending.splice(index, 1)
    if (entry?.role !== "bg") {
      core.writeTombstone(pad, entry?.id, "consumed", entry?.role ?? "bg") // 异常件出列 + 墓碑（防死循环）
      log?.warn?.("chat_delivery_unknown_entry", { chatId: Number(chatId), role: entry?.role ?? null })
      continue
    }
    await core.injectBgResult(pad, entry)
  }
  let delivered = 0
  while (Array.isArray(pad.history) && pad.history.length > 0) { // ③ 汇面逐行落库（送达行入会话记录）
    const row = pad.history[0]
    try {
      appendMessage(db, chatId, { role: "user", content: String(row?.content ?? ""), data: { kind: "reminder" }, now })
    } catch (e) {
      log?.warn?.("chat_reminder_persist_failed", { chatId: Number(chatId), message: e?.message ?? String(e) })
      break // 该行留汇、下次重试（零静默丢）
    }
    pad.history.shift()
    delivered += 1
  }
  return delivered
}

/**
 * 中止收尾（§15.1 中止面——回合尾调用）：池条目控制器已中止（非 interrupt 全停）⇒ 杀树 + 丢弃提醒入汇 + 墓碑
 * （核 `discardAbortedBgTasks`——判据内建；interrupt 豁免沿核件）；提醒行由下一回合边界/唤醒面落库（本函数只入汇——零直接落库）。
 * 缺核 ⇒ 零动作 + 一条警告（回合尾不抛；无核时池本就无从建立）。
 */
export async function discardAbortedChatTasks(chatId, { log = null, coreTools = null } = {}) {
  try {
    const core = coreTools ?? (await loadCoreEnvTools())
    requireCoreFace(core, ["discardAbortedBgTasks"], "中止收尾")
    return core.discardAbortedBgTasks(timerPadOf(chatId))
  } catch (e) {
    log?.warn?.("chat_discard_failed", { chatId: Number(chatId), message: e?.message ?? String(e) })
    return { discarded: [], kept: 0 }
  }
}
