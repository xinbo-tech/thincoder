/**
 * subagent-actions.mjs — subagent 动作执行器（§19/§19.5/§19.6——2026-09-05 自
 * subagent-async.mjs 拆分——Module Split Policy §20.9——纯迁移零行为变化）。
 * 内容：executeStatusAction（§19.5 D-M5——非阻塞池查询——touchedSummary/
 * shortTouchedPath/statusFields 摘要助手随行）/ executePanelAction（§19.6——面板镜像
 * view + 门控 freeze——panelFreezeGate/blockKeyIn 随行）/ executeEscalateAction（§19
 * D-M4——飞刀——touchedFilesNote 随行）。
 * check/cancel 动作执行器与共享 post-spawn 管线留在 subagent-async.mjs；
 * §20 调度器 + 文件域组在 ./subagent-scheduler.mjs（describeBlockers 由此导入）。
 */
import { isAbsolute, relative } from "node:path"
import { runAgent, createAgent, CODER_OVERLAY, DEFAULT_SUBAGENT_TURNS } from "../agent.mjs"
import {
  runWithContinue, TURN_CAP_MARK, makeRelay, wrapChildCallbacks,
  ensureChildApiKey, clampEffort,
} from "../agent/spawn-child.mjs"
import { logEvent, errText } from "../log.mjs"
import { describeBlockers, detectStall, STALL_NOTE } from "./subagent-scheduler.mjs"
import { resolveChildProvider, mergeChildMutations } from "./subagent-async.mjs"

/**
 * subagent action:"status" (§19 D-M2, new): NON-BLOCKING async-pool query —
 * returns immediately, never consumes a result and never touches the check read
 * counter (T-M10). Source of truth = the pool (_asyncSubagents): entries moved
 * to _pendingAsyncResults during a suspension (§17 D-S3 ② — injected at the next
 * run start) are no longer in the pool and are NOT counted as done-waiting.
 * - id given → { id, role, status, model?, elapsedSec?, turn?, maxTurns?,
 *   touchedFiles?/touchedMore?/touched? ... } for that entry; unknown id → error
 *   (same wording as check — T12 semantics)
 * - id omitted → { overview: { running: [{id, role, model, elapsedSec, turn,
 *   maxTurns, touchedFiles?/touched?}], queued: [{id, role, position, touched?}],
 *   done: [{id, role}] } } — live queue positions (index in _asyncQueue + 1).
 * §19.5.6: running 条目带 touched files 摘要（touchedFiles 前 5 + touchedMore 超出
 * 计数——相对查询方 cwd；0 改动 → touched 占位）；queued 条目带 touched 占位
 * "—（未启动）"；done/error/取消条目无 touched 字段（round3 #9）。
 * A settled-but-unconsumed entry (settled during a NORMAL turn) reports done
 * with a "not yet consumed" note — check still retrieves it afterwards.
 */
/** §19.5 D-M5 decision-field assembly (F9): running entries report
 *  {id, role, model, elapsedSec, turn, maxTurns} — the data needed to decide
 *  WHO to cancel. Model is recorded at spawn (childProvider), startedAt at
 *  ACTUAL start (queued waits don't count), turn/maxTurns mirrored from the
 *  child's ⟦ev⟧turn events at the callbacks-wrap layer (subagent.mjs tracker).
 *  elapsedSec computed at call time from startedAt. */
/** §19.5.6 D-SF2/N-SF1 摘要形态：status 调用时实时读 entry.childAgent._touchedFiles
 *  （绝对路径——per-run 记账——§18.12）→ 相对查询方 cwd；cwd 之外保留绝对形态 +
 *  "../" 前缀；>80 字符截尾（不超行）；前 5 个 + 独立截断字段 touchedMore（超出
 *  计数——不混入数组——消费方按类型区分）。占位：running 0 改动 → "—（尚无改动）"
 *  （T-SF2a）；queued 未启动 → "—（未启动）"（T-SF2b）；done/error/取消条目不含
 *  本摘要（round3 #9 明示——本批只做 running/queued）。 */
function touchedSummary(entry, cwd) {
  if (entry.status !== "running") return { touched: "—（未启动）" }
  const files = entry.childAgent?._touchedFiles ?? []
  if (files.length === 0) return { touched: "—（尚无改动）" }
  const shown = files.slice(0, 5).map((f) => shortTouchedPath(f, cwd))
  const out = { touchedFiles: shown }
  if (files.length > 5) out.touchedMore = files.length - 5
  return out
}

/** N-SF1 单路径显示形态：cwd 内 → 相对路径；cwd 外 → "../" + 绝对路径；>80 截尾。 */
function shortTouchedPath(f, cwd) {
  let p = f
  if (cwd) {
    const rel = relative(cwd, f)
    p = rel && !rel.startsWith("..") && !isAbsolute(rel) ? rel : `../${f}`
  }
  return p.length > 80 ? `${p.slice(0, 79)}…` : p
}

function statusFields(entry, cwd) {
  const base = { id: String(entry.id), role: entry.role }
  if (entry.status === "running") {
    base.model = entry.model ?? null
    base.elapsedSec = entry.startedAt ? Math.max(0, Math.floor((Date.now() - entry.startedAt) / 1000)) : 0
    base.turn = entry.turn ?? 0
    base.maxTurns = entry.maxTurns ?? 0
    // §19.5.6：touched files 摘要（T-SF1..4——新字段追加——既有字段零破坏）
    Object.assign(base, touchedSummary(entry, cwd))
  } else if (entry.status === "queued") {
    // §19.5.6 T-SF2b：未启动——确定性占位（不崩；无对象可读）
    base.touched = "—（未启动）"
  }
  return base
}

export function executeStatusAction(args, ctx) {
  const agent = ctx.agent
  const map = agent._asyncSubagents ?? new Map()
  const queue = agent._asyncQueue ?? []
  const queuedPosition = (id) => {
    const i = queue.findIndex((e) => String(e.id) === id)
    return i >= 0 ? i + 1 : undefined
  }
  const { id } = args ?? {}
  if (id !== undefined && id !== null && String(id) !== "") {
    const key = String(id)
    const entry = map.get(key)
    if (!entry) {
      return JSON.stringify({ id: key, status: "error", error: `unknown async subagent id: ${key}` })
    }
    const target = statusFields(entry, agent.cwd)
    if (entry.status === "running") return JSON.stringify({ ...target, status: "running" })
    if (entry.status === "queued") {
      // §20 F-SD4/D-SD3b：waiting 语义对模型可见——排队原因（冲突对象/依赖对象）随
      // status 返回；纯槽满等位（kind slot）无 waiting 字段（position 已足够）。
      const blk = describeBlockers(agent, entry)
      const out = { ...target, status: "queued", position: queuedPosition(key) ?? entry.position }
      if (blk.kind !== "slot") {
        out.waiting = blk.kind === "depc" ? "dependency-cancelled" : "waiting-deps"
        out.reason = blk.detail
      }
      // §21.1 P-SL2（D-SL2）：停滞机械标记——池停滞时本任务所在闭环阻塞链随 status
      // 返回（F-SL2——status 视图可显示停滞——模型可见——零正常路径字段变化）。
      const stall = detectStall(agent)
      if (stall) {
        const chain = stall.chains.find((c) => c.task === entry)?.text
        if (chain) out.stall = { chain, note: STALL_NOTE }
      }
      return JSON.stringify(out)
    }
    // done = settled during this turn and not yet consumed — check still retrieves it
    // (§17.5: at a driven turn end it stays pooled → the suspension digest consumes it).
    target.status = "done"
    target.done = true
    if (entry.error) target.error = entry.error
    target.note = "settled, not yet consumed — retrieve via check or the suspension digest injects it"
    return JSON.stringify(target)
  }
  const overview = { running: [], queued: [], done: [] }
  for (const entry of map.values()) {
    if (entry.status === "running") overview.running.push(statusFields(entry, agent.cwd))
    else if (entry.status === "queued") {
      // §20：queued 条目补 waiting/reason（F-SD4——依赖/冲突原因模型可见）；
      // §19.5.6 T-SF2b：未启动占位（确定性——不崩）。
      const blk = describeBlockers(agent, entry)
      const row = statusFields(entry, agent.cwd)
      row.position = queuedPosition(String(entry.id)) ?? entry.position
      if (blk.kind !== "slot") {
        row.waiting = blk.kind === "depc" ? "dependency-cancelled" : "waiting-deps"
        row.reason = blk.detail
      }
      overview.queued.push(row)
    }
    else if (entry.done) overview.done.push({ id: String(entry.id), role: entry.role })
  }
  // §21.1 P-SL2（D-SL2）：停滞机械标记——overview 级标注（可显示停滞——F-SL2）——
  // 链文本随视图返回（逐条——每 queued 条目一行——闭环可破环引导同挂）。
  const stall = detectStall(agent)
  if (stall) {
    overview.stall = {
      chains: stall.chains.map((c) => c.text),
      note: STALL_NOTE,
    }
  }
  return JSON.stringify({ overview })
}

// ═══════════════════════════════════════════════════════════════════════════
// §19.6 subagent panel 检查工具（AGENT-LOOP.md §19.6——F-P1..P3/D-P1..P4）
// ═══════════════════════════════════════════════════════════════════════════

/** 面板块 key（role#N）在池（Map——条目值）/pending（数组）中的归属判定。 */
function blockKeyIn(container, key) {
  const entries = container instanceof Map ? [...container.values()] : (container ?? [])
  return entries.some((e) => `${e.role}#${e.id}` === key)
}

/**
 * §19.6 D-P3 冻结门控（安全）：仅允许冻结 awaitingDigest 且池（_asyncSubagents）
 * 无对应运行条目 + pending（_pendingAsyncResults）无对应条目的块（= 已消化驻留块
 * ——报告已入模型上下文——pending 已消费——状态滞后——补发冻结不破坏任何顺序）。
 * - pending 仍有对应（报告未达模型）→ 拒绝（提前回收破坏消化顺序——T-P3）
 * - 不存在的 key / 仍 running / done 的块 → 拒绝（T-P4——running 块 settle 时自冻）
 * - 无镜像 → 拒绝（headless/VS Code——freeze 不可用——T-P5）
 * 错误信息明确（模型可解释 + 自助修正）。返回 { ok:true } 或 { err }。
 */
function panelFreezeGate(agent, key) {
  const snap = agent._panelSnapshot
  if (!Array.isArray(snap)) {
    return { err: "panel unavailable — no CLI TUI panel mirror in this session (headless / VS Code / subagent contexts — freeze unavailable; panel is CLI-TUI-only, AC-P4)" }
  }
  const block = snap.find((b) => b.key === key)
  if (!block) {
    const live = snap.map((b) => `${b.key}(${b.status})`).join(", ")
    return { err: `unknown panel block key: ${key} — the live panel holds: ${live || "(no blocks)"}` }
  }
  if (block.status !== "awaitingDigest") {
    if (block.status === "done") {
      return { err: `block ${key} is already done — nothing to freeze; it was (or is about to be) reclaimed into the conversation by the freeze sweep at the turn end / settle (only digested-stuck awaitingDigest blocks need a manual freeze)` }
    }
    if (block.status === "running") {
      return { err: `block ${key} is still running — freeze only reclaims awaitingDigest blocks whose report is already digested; a running block freezes on its own settle (or stop it with action:'cancel' if it is a background async child)` }
    }
    return { err: `block ${key} is in state ${block.status} — freeze only reclaims awaitingDigest blocks whose report is already digested` }
  }
  if (blockKeyIn(agent._asyncSubagents, key)) {
    return { err: `block ${key} still has a live pool entry — it is NOT a digested-stuck block (freeze refused; status action shows the pool)` }
  }
  if (blockKeyIn(agent._pendingAsyncResults, key)) {
    return { err: `block ${key} is still genuinely awaiting digestion — its report is still in _pendingAsyncResults and has NOT reached the model yet; freezing now would break the digestion order (wait for the digest run, which reclaims it automatically — §17.5.5)` }
  }
  return { ok: true }
}

/**
 * §19.6 subagent action:"panel"（D-P2——readonly 视图面 + 门控干预面——单动作双参，
 * freeze 优先）：
 * - view（缺省——返回镜像区块列表）：agent._panelSnapshot = TUI 面板镜像（块级
 *   状态变更点由 subagent-blocks syncPanelSnapshot 同步刷新——与用户所见一致——
 *   index.mjs 装配 state._agent）。awaitingDigest 条目**读时交叉**
 *   _pendingAsyncResults/_asyncSubagents 标注 digested（round1 #3——digested:true
 *   = 报告已消化但块仍驻留——异常块——freeze 候选；模型可定位解释 UI 怪相）。
 * - freeze:key（D-P3 门控通过 → 发 key + "/" + ⟦ev⟧done 哨兵字面 token——
 *   onToken——TUI routeSubToken 冻结回收——落位复用 sub._freezeAt settle 锚点
 *   splice，无锚点尾推兜底——§17.5.5 同口径——round1 #2）。
 * 无镜像（headless/VS Code——D-P2 round1 #1：webview 无 state.subTasks 对应物——
 * 7.2.3.2 #8 先例）→ view 恒降级池视图（_asyncSubagents + _pendingAsyncResults
 * 合成）+ no panel 注；freeze 报不可用。CLI-only 完整能力（AC-P4）。
 */
export function executePanelAction(args, ctx) {
  const agent = ctx.agent
  const freezeKey = (args?.freeze !== undefined && args?.freeze !== null && String(args.freeze) !== "")
    ? String(args.freeze)
    : null
  // ── freeze 面（优先——D-P2 单动作双参互斥）──
  if (freezeKey) {
    if ((ctx.depth ?? 0) > 0) {
      return JSON.stringify({ status: "error", error: "panel freeze is only available at depth 0 — a child agent has no panel of its own (AGENT-LOOP.md §19.6 D-P2)" })
    }
    const gate = panelFreezeGate(agent, freezeKey)
    if (gate.err) return JSON.stringify({ status: "error", error: gate.err })
    if (!ctx.callbacks?.onToken) {
      return JSON.stringify({ status: "error", error: `panel mirror present but no token relay in this context — the freeze of ${freezeKey} cannot reach the TUI` })
    }
    // 门控通过 → 发 done 冻结事件（settle 同机制字面格式——TUI routeSubToken done
    // 分支冻结回收——落位 _freezeAt settle 锚点 splice；无锚点（旧会话残留）时
    // freezeSubTaskLines 尾推兜底——注明两种落位，模型不被误导（advisor 🟡1）。
    ctx.callbacks.onToken(`${freezeKey}/⟦ev⟧done\x1e0\x1e0\x1edone\x1e`)
    return JSON.stringify({
      key: freezeKey,
      status: "frozen",
      note: "done freeze event issued — the TUI reclaimed the block into the conversation (spliced at its settle anchor when one is recorded, else appended at the current stream end — §17.5.5 same-rule position)",
    })
  }
  // ── view 面（缺省——readonly）──
  // 双参互斥（D-P2）：freeze 优先；显式 view:false 且无 freeze = 无请求可执行——报错。
  if (args?.view === false) {
    return JSON.stringify({ status: "error", error: "panel has nothing to do — view:false with no freeze key; pass freeze:'role#N' to reclaim a digested-stuck block, or omit view (defaults to true)" })
  }
  const snap = agent._panelSnapshot
  if (!Array.isArray(snap)) {
    // F-P3 降级：无镜像（headless/VS Code/子代理上下文——CLI TUI-only 完整能力）→
    // 池视图（_asyncSubagents 运行/排队条目 + _pendingAsyncResults 待消化条目）
    const blocks = []
    const queue = agent._asyncQueue ?? []
    for (const e of [...(agent._asyncSubagents?.values() ?? [])]) {
      const b = { key: `${e.role}#${e.id}`, role: e.role }
      if (e.status === "running") {
        b.status = "running"
        b.elapsedSec = e.startedAt ? Math.max(0, Math.floor((Date.now() - e.startedAt) / 1000)) : 0
      } else if (e.status === "queued") {
        b.status = "queued"
        const qi = queue.indexOf(e)
        b.position = qi >= 0 ? qi + 1 : (e.position ?? null)
      } else {
        b.status = "done" // 回合内 settle 未取——status action 可查/check 可取回
      }
      blocks.push(b)
    }
    for (const e of agent._pendingAsyncResults ?? []) {
      blocks.push({ key: `${e.role}#${e.id}`, role: e.role, status: "awaitingDigest", note: "report pending — injected at the next run start (§17)" })
    }
    return JSON.stringify({
      degraded: true,
      note: "no panel — this session has no CLI TUI panel mirror (headless / VS Code / subagent context — panel view is CLI-TUI-only, AC-P4); pool-derived view below; action:'status' shows the full pool",
      panel: blocks,
    })
  }
  const panel = snap.map((b) => {
    const out = { key: b.key, role: b.role, status: b.status }
    if (b.status === "running") {
      out.elapsedSec = b.startedAt ? Math.max(0, Math.floor((Date.now() - b.startedAt) / 1000)) : 0
    } else if (b.status === "awaitingDigest") {
      // 读时交叉（round1 #3）：pending/池均无对应 = 报告已消化（注入即从两者移除）——
      // 块驻留 = 状态滞后——digested:true（freeze 候选——模型可定位异常块）。
      out.digested = !blockKeyIn(agent._pendingAsyncResults, b.key) && !blockKeyIn(agent._asyncSubagents, b.key)
    }
    return out
  })
  return JSON.stringify({ panel })
}

/**
 * subagent action:"escalate"（§19 D-M4——退役 escalate 工具语义原样，ESCALATE.md）：
 * 飞刀——交给 consultModels 池里更强模型（WRITE + 术后报告）。约束全保留：depth-0
 * only / 工程模式拒 / consultModels 空拒 / relay 前缀 `escalate#N/`（与既有前缀同名
 * ——TUI 路由零改动）/ 无 permQueue（continue 直达用户）/ mutations merge 回父。
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
    child = createAgent({
      provider,
      tools: parent.tools,
      config: parent.config,
      cwd: parent.cwd,
      memory: parent.memory,
      overlay: CODER_OVERLAY,
      role: "coder",
    })
    child._logId = escId // LOGGING：子内事件归属（escalate#N）
    escT0 = Date.now()
    logEvent("child:spawn", { role: "escalate", id: escId, kind: "escalate" })
    const runner = ctx.runAgent ?? runAgent
    const runOpts = {
      depth: 1,
      maxTurns: parent.config?.agent?.subagentTurns ?? DEFAULT_SUBAGENT_TURNS, // review #7: constant, not literal (single source with subagent)
      signal: ctx.signal ?? null,
    }
    // Continue 经 runWithContinue（§7.2 D3，主会话同等 y/n 面板）：resume:true 不重注入
    // task 文本（setup 跳 input）且保留 child history + mutation 记账，刷新 turn 预算；
    // 无权限 handler（headless）或拒绝 → 部分工作返回；continue 次数无限（每轮可拒）。
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
      child, task, { ...childCallbacks, onPermissionRequest: parent.autoApprove ? async () => true : (ctx.onPermissionRequest ?? null) },
      runOpts,
      {
        // escalate has NO permQueue: prompts go straight to the user (T-L spec).
        askContinue: (e) => (ctx.onPermissionRequest
          ? ctx.onPermissionRequest("continue", { turns: e.turn, agent: tag })
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
    // §7.2.3（round1 #2）：escalate 与 spawn 同享 ctx._subagentKey——同步完成精确冻
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