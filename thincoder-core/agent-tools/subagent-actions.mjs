/**
 * subagent-actions.mjs — subagent 动作执行器（AGENT-LOOP-SUBAGENT.md §6.7——2026-09-05 自
 * subagent-async.mjs 拆分——Module Split Policy——纯迁移零行为变化）。
 * 内容：executeSendAction（SUBAGENT-OBSERVE-SEND——send 控制豁免注入）/ executeEscalateAction
 * （AGENT-LOOP-SUBAGENT.md §6.7 D-M4——飞刀——touchedFilesNote 随行）；status ∕ observe 两执行器与
 * 摘要助手族（touchedSummary/shortTouchedPath/statusFields）随 2026-09-28 三次拆分迁出（见下）。
 * AGENT-LOOP-SUBAGENT.md §6.7.5 check 删除后仅 cancel 动作执行器与共享 post-spawn 管线留在 subagent-async.mjs；
 * AGENT-LOOP-SUBAGENT.md §6.9 调度器 + 文件域组在 ./subagent-scheduler.mjs（describeBlockers 由此导入）。
 * 2026-09-08 二次拆分：AGENT-LOOP-SUBAGENT.md §6.7.2 面板段迁至 ./subagent-panel.mjs（601 > 500 硬限跨档——
 * 尾部 re-export executePanelAction 保 subagent.mjs 既有 import 面）+ ASYNC-RESULT-
 * CONTAINER.md D1 落地（池访问点改 getAsyncPool accessor）。
 * 2026-09-28 三次拆分（Module Split Policy——498/499 贴 500 硬限）：**查询面**（status ∕ observe
 * 两执行器 + 摘要助手族）迁至 ./subagent-actions-query.mjs（verbatim）；本档保留 send ∕ escalate
 * 执行器与 panel re-export，并 re-export 上述两执行器保 subagent.mjs 既有 import 面。
 */
import { isAbsolute, relative } from "node:path"
import { runAgent, createAgent, DEFAULT_SUBAGENT_TURNS, excludeSubagentTools } from "../agent.mjs"
import {
  runWithContinue, TURN_CAP_MARK, makeRelay, wrapChildCallbacks,
  ensureChildApiKey, clampEffort,
} from "../agent/spawn-child.mjs"
import { logEvent, errText } from "../log.mjs"
import { resolveChildProvider, mergeChildMutations } from "./subagent-async.mjs"
import { launchEscalateAsync } from "./escalate-async.mjs"
// TUI-OOM-ROOTCAUSE·AGENT-LOOP.md §6.15：子代理人读线窗口常量（单源——store 零依赖）。
import { RECORD_WINDOW_MESSAGES } from "../session-store.mjs"
// ASYNC-RESULT-CONTAINER.md D1：池 accessor（absorb 双池——advisor 独立池无队列）
import { getAsyncPool } from "./async-settle.mjs"
import { settleConsultCheckpoint, settleTurnCheckpoint, resumedSendResult } from "./checkpoint.mjs"

// ═══════════════════════════════════════════════════════════════════════════
// 查询面（status ∕ observe + 摘要助手族）：2026-09-28 拆分（Module Split Policy——498/499
// 贴 500 硬限跨档）迁至 ./subagent-actions-query.mjs（verbatim）；本面 re-export 两执行器
// 保 subagent.mjs 既有 import 面（subagent-panel 尾部 re-export 先例）。
// ═══════════════════════════════════════════════════════════════════════════
export { executeStatusAction, executeObserveAction } from "./subagent-actions-query.mjs"

/**
 * subagent action:"send"（D2——控制类豁免，同 cancel/panel-freeze——父回合内显式调用即
 * 授权）：按 id 向运行中异步子代理注入一条引导消息——push 进 entry._injected（仅 running
 * 异步可 send）；子回合边界经 consumeInjected 回调消费 → pushReal 成 user 回合进子历史
 * → 当作普通指令处理（注入不等同偏离豁免——子收敛/审计纪律不变）。settle/cancel/unknown
 * /queued → 明确错误。send→settle 竞态：入队后子未及下回合边界即 settle → 消息未投递
 * → settle 收尾附报告提示（不在此报错——send 返回时无法预知）。
 */
export function executeSendAction(args, ctx) {
  if ((ctx.depth ?? 0) > 0) {
    return JSON.stringify({ status: "error", error: "send is only available at depth 0 — a child agent has no async pool of its own" })
  }
  const agent = ctx.agent
  const id = args?.id
  if (id === undefined || id === null || String(id) === "") {
    return JSON.stringify({ status: "error", error: "send requires the id of the running async subagent to direct (from the async spawn return) — omitting it means an unspecified target" })
  }
  const message = args?.message
  if (typeof message !== "string" || !message.trim()) {
    return JSON.stringify({ status: "error", error: "send requires the message to inject — the direction the running subagent should treat as an ordinary user instruction at its next turn boundary" })
  }
  const key = String(id)
  const entry = getAsyncPool(agent, "subagent")?.get(key)
  if (!entry) {
    if (getAsyncPool(agent, "advisor")?.has(key)) {
      return JSON.stringify({ status: "error", error: `id ${key} is an async ADVISOR review — send is for async subagents; you cannot inject direction into a running review — track it with action:'status' (role:"advisor") or wait for its report to arrive automatically` })
    }
    if (settleConsultCheckpoint(agent, key, message)) return resumedSendResult(key, "consult") // 检查点兑现 ②（会诊会话）
    return JSON.stringify({ status: "error", error: `unknown async subagent id: ${key}` })
  }
  if (entry.done || entry.cancelled) {
    return JSON.stringify({ status: "error", error: `async subagent #${key} has ${entry.cancelled ? "been cancelled" : "already settled"} — nothing to send (you cannot inject into a finished subagent; re-spawn with the direction instead)` })
  }
  if (entry.status !== "running") {
    return JSON.stringify({ status: "error", error: `async subagent #${key} is ${entry.status} (not running) — send only targets a RUNNING async subagent; a queued one has not started its turn loop yet` })
  }
  entry._injected ??= []
  entry._injected.push(String(message).trim())
  if (settleTurnCheckpoint(entry)) return resumedSendResult(key, entry.role ?? "subagent") // 检查点兑现 ①（池条目）
  return JSON.stringify({
    id: key,
    status: "delivered",
    queued: entry._injected.length,
    note: `message queued for ${entry.role}#${key} — consumed as an ordinary user instruction at its next turn boundary (after its current tool finishes — non-interrupting). If it settles first, its report carries an "undelivered" note.`,
  })
}

// ═══════════════════════════════════════════════════════════════════════════
// subagent panel 检查工具（AGENT-LOOP-SUBAGENT.md §6.7.2——F-P1..P3/D-P1..P4）
// ═══════════════════════════════════════════════════════════════════════════
// 2026-09-08 拆分（Module Split Policy——601 > 500 硬限跨档）：AGENT-LOOP-SUBAGENT.md §6.7.2 面板段迁至
// ./subagent-panel.mjs（executePanelAction/panelFreezeGate/blockKeyIn——verbatim +
// ASYNC-RESULT-CONTAINER D1/D2 落地）；本面保留 re-export 保 subagent.mjs 既有
// import 面（subagent-async 尾部 re-export 先例）。
export { executePanelAction } from "./subagent-panel.mjs"

/**
 * subagent action:"escalate"（AGENT-LOOP-SUBAGENT.md §6.7 D-M4——退役 escalate 工具语义原样，ESCALATE.md；
 * ESCALATE.md §5 D-R17b——R17：缺省 async——后台飞刀 + settle 三分类 digest——async:false 保
 * 同步旧路径）。飞刀——交给 consultModels 池里更强模型（WRITE + 术后报告）。约束全
 * 保留：depth-0 only / 工程模式拒 / consultModels 空拒 / relay 前缀 `escalate#N/`
 * （与既有前缀同名——TUI 路由零改动）/ mutations merge 回父（async 路径在 settle 分类）。
 */
export async function executeEscalateAction(args, ctx) {
  const parent = ctx.agent
  if ((ctx.depth ?? 0) > 0) return "Error: escalate is only available at depth 0 (an escalate's work cannot be delegated again)"
  if (parent?.config?.agent?.engineering) {
    return "Error: engineering mode is ON — escalate is unavailable (it spawns a coder sub-agent, which engineering mode forbids). Use subagent with role='eng-coder' and a designToken from advisor(type='design') instead."
  }
  const pool = parent?.config?.agent?.consultModels ?? []
  if (pool.length === 0) return "Error: no escalate candidates — configure at least one consult model (agent.consultModels)"

  const { task, model } = args ?? {}
  // task 机械必填（多动作 schema 的 required 只是建议——缺 task 会以晦涩 child-run 错浮现）
  if (typeof task !== "string" || !task.trim()) {
    return "Error: escalate requires a task — the task description with goal, constraints, entry files and acceptance criteria"
  }
  const label = (m) => `${m.provider}:${m.model}`
  const wanted = typeof model === "string" ? model.replace(/\s+\([^)]*\)\s*$/, "").trim() : model
  const pick = wanted ? pool.find((m) => label(m) === wanted) : pool[0]
  if (!pick) {
    return `Error: "${model}" is not a consult candidate. Available: ${pool.map(label).join(", ")}`
  }

  let provider
  try {
    provider = resolveChildProvider(parent, `${pick.provider}:${pick.model}`)
  } catch (e) {
    return `Error: ${e.message}`
  }
  if (!ensureChildApiKey(provider)) {
    return `Error: provider "${pick.provider}" has no API key — set it in config.json before flying it in`
  }
  let effortNote = ""
  if (pick.effort && !clampEffort(provider, pick.model, pick.effort)) {
    // enum 外 effort 丢弃（preset 默认也可能对 override model 是 enum 外值）
    effortNote = ` (effort "${pick.effort}" unsupported by ${pick.model}, dropped)`
  }

  const tag = label(pick)

  // ESCALATE.md §5 D-R17b (R17 — 决策点 ③): escalate 缺省 async — the launch returns an ack
  // {id, role:"escalate", status:"running"|"queued"} and the flight runs in the
  // background (shared other pool; settle 三分类 → pending 单容器 digest——
  // ASYNC-RESULT-CONTAINER.md D2)。
  // `async: false` keeps the legacy synchronous flight below (backward compat).
  if (args?.async !== false) {
    return launchEscalateAsync(parent, ctx, { task: String(task), provider, tag, effortNote })
  }

  const relayPrefix = makeRelay(parent, "escalate", ctx.callbacks?.onToken, provider.model ?? tag)

  // 无墙钟 watchdog——turn cap 即成本预算（2026-08-16 rationale：固定墙钟会误杀正常慢速
  // 手术；挂起防护 = FETCH_TIMEOUT_MS + 父 signal 直传）

  // 不自建 onToken（consult P2）：wrapChildCallbacks 已承担前缀 relay + D7 哨兵剥除，
  // runWithContinue 拥有 capture（stripEventTokensForCapture）——手写副本会双剥+双缓冲
  const childCallbacks = wrapChildCallbacks(relayPrefix, ctx.callbacks ?? {})

  // try 外声明：catch 也能在部分失败时 merge mutations
  let child = null
  let escErr = null // LOGGING outcome（string 形态返回 vs 异常——见下方事件点）
  const escId = relayPrefix.slice(0, -1)
  let escT0 = Date.now()
  try {
    // 全写路径（role "coder"）：权限经父 onPermissionRequest，mutations merge 回父
    // G3（施工②）：overlay 摘除——coder 人格槽由 assemblePrompt 场景表承载（G3 映射）。
    child = createAgent({
      provider,
      tools: excludeSubagentTools(parent.tools), // TOOLS.md §6.16：子代面按面排除（行内改——本档 Δ±0）
      config: parent.config,
      cwd: parent.cwd,
      memory: parent.memory,
      role: "coder",
    })
    child._historyWindow = RECORD_WINDOW_MESSAGES // TUI-OOM-ROOTCAUSE·AGENT-LOOP.md §6.15：子代理人读线窗口（四处创建点同置）
    child._logId = escId // LOGGING：子内事件归属（escalate#N）
    // SUBAGENT-UPSTREAM-CHANNEL（§6.27.4 W2——escalate **sync**：单向；工具返回注走同步形）。
    child._upstream = { parent, label: escId, sync: true }
    escT0 = Date.now()
    logEvent("child:spawn", { role: "escalate", id: escId, kind: "escalate" })
    const runner = ctx.runAgent ?? runAgent
    const runOpts = {
      depth: 1,
      maxTurns: parent.config?.agent?.subagentTurns ?? DEFAULT_SUBAGENT_TURNS, // review #7: constant, not literal (single source with subagent)
      signal: ctx.signal ?? null,
      // §2.5 #78 并入：escalate 子代理输出流式（VSC subagent-escalate 同款豁免）。
      streamOutput: true,
    }
    // Continue 经 runWithContinue（docs/cli/design/TUI.md §6.8 D3，主会话同等 y/n 面板）：resume:true 不重注入
    // task 文本（setup 跳 input）且保留 child history + mutation 记账，刷新 turn 预算；
    // 无权限 handler（headless）或拒绝 → 部分工作返回；continue 次数无限（每轮可拒）。
    // 残环批（2026-09-16）：飞刀询问名同规包装（`escalate#<id>/<tool>`——端侧键形解析的
    // 输入契约；原裸工具名直通无归属）；无权限通道 ⇒ 退化 false（`Promise.resolve(false)`——
    // 与 async 路 guard 同语义，T-A4n）。
    const askPermission = (n, a) => (ctx.onPermissionRequest ? ctx.onPermissionRequest(`${escId}/${n}`, a) : Promise.resolve(false))
    const report = await runWithContinue(
      async (childAgent, input, cbs, opts) => {
        // Merge mid-run mutations even when the run throws — the outer catch keeps
        // handling createAgent failures; AbortError still propagates (user Stop).
        try {
          return await runner(childAgent, input, cbs, opts)
        } catch (e) {
          mergeChildMutations(parent, childAgent)
          throw e
        }
      },
      child, task, { ...childCallbacks, onPermissionRequest: parent.autoApprove ? async () => true : askPermission },
      runOpts,
      {
        // sync escalate has NO permQueue——async 飞行权限走 _permQueue（escalate-async.mjs）: prompts go straight to the user (T-L spec).
        askContinue: (e) => (ctx.onPermissionRequest
          ? ctx.onPermissionRequest("continue", { turns: e.turn, agent: escId })
          : Promise.resolve(false)),
        onDeclined: (e, output) => `escalate (${tag}) ${TURN_CAP_MARK} (${e.turn} turns) — work may be partial; review recent_changes before deciding next steps.\nPartial output: ${output.slice(0, 2000)}`,
      },
    ).catch((e) => {
      // 非 ContinueError 运行失败：错误文本 + partial 输出（mutations 已在 runner 包装层 merge）
      if (ctx.signal?.aborted || e?.name === "AbortError") throw e
      escErr = { err: e?.message ?? String(e) } // LOGGING：错误路径（返回形态——不抛）
      return `escalate (${tag}) error: ${e?.message ?? String(e)}\nPartial output: ${(child._capturedOutput ?? "").slice(0, 2000)}`
    })
    // Escalate mutations are the parent's mutations: verify/advisor guards must see them
    mergeChildMutations(parent, child)
    if (escErr) logEvent("child:error", { role: "escalate", id: escId, ms: Date.now() - escT0, err: errText(escErr.err, 200) })
    else logEvent("child:done", { role: "escalate", id: escId, ms: Date.now() - escT0, kind: String(report).includes(TURN_CAP_MARK) ? "partial" : "ok" })
    // docs/cli/design/TUI.md §6.8（round1 #2）：escalate 与 spawn 同享 ctx._subagentKey——同步完成精确冻
    // （relayPrefix 去尾 = `escalate#N`）。仅成功路径（escErr = 运行中途失败——不设
    // key——TUI 回落 escalate 角色启发式：escalate 串行 + 角色限定，天然精确——legacy
    // 行为不变——错误路径不触发冻结 round1 #1）。
    if (!escErr) ctx._subagentKey = escId
    return `escalate (${tag})${effortNote} post-op report:\n${report || (child._capturedOutput ?? "").slice(0, 4000)}${touchedFilesNote(child, parent.cwd)}`
  } catch (e) {
    // 仅 createAgent 失败/continue 询问抛出才到这（运行失败已在上面 catch 处理）
    if (child) {
      mergeChildMutations(parent, child)
      if (!escErr && !(ctx.signal?.aborted) && e?.name !== "AbortError") {
        logEvent("child:error", { role: "escalate", id: escId, ms: Date.now() - escT0, err: errText(e, 200) })
      }
    }
    if (ctx.signal?.aborted || e?.name === "AbortError") throw e
    return `escalate (${tag}) error: ${e?.message ?? String(e)}`
  }
}

/** Relative touched-file list appended to every escalate return (child paths are absolute). */
function touchedFilesNote(child, cwd) {
  const touched = child?._touchedFiles ?? []
  if (touched.length === 0) return ""
  const shown = touched.map((f) => {
    const r = relative(cwd ?? process.cwd(), f)
    return r && !r.startsWith("..") && !isAbsolute(r) ? r : f
  })
  return `\nTouched files: ${shown.join(", ")}`
}