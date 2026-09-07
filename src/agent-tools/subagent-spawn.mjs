/**
 * subagent-spawn.mjs — spawn 路径装配（2026-09-05 module-split：subagent.mjs 726
 * > 500 硬限——spawn 前置 helpers（summarizeEngTaskBook/effectiveSubagentModel/
 * resolveDesignSlot）+ §20 调度参数准入（prepareScheduling）+ child 装配
 * （buildSpawnChild）verbatim 迁入（仅闭包变量参数化），语义零变；executeAsyncSpawn
 * 另在 subagent-run.mjs。subagent.mjs execute 经本文件 import 调用。
 * 2026-09-07：executeConsumeDesignAction 消费执行器（token 链终消费制——与 spawn 侧
 * slot 族同域——ENGINEERING-MODE.md §2.6 F1——removeDesignTokenSlot 自 token-ttl.mjs）。
 */

import {
  createAgent,
  readonlyToolNames, escapeXml,
  EXPLORE_OVERLAY, CODER_OVERLAY, PLAN_OVERLAY, ENG_CODER_OVERLAY,
} from "../agent.mjs"
import { makeRelay, wrapChildCallbacks } from "../agent/spawn-child.mjs"
import { validateDesignToken } from "./advisor.mjs"
import { tokenExpired, removeDesignTokenSlot, reconcileEngTokensFromSlot, persistEngTokens } from "../token-ttl.mjs"
import { resolveChildProvider, buildChildRunOpts } from "./subagent-async.mjs"
import {
  normalizeFileList, describeBlockers, assertNoDepCycle, depInfo,
} from "./subagent-scheduler.mjs"

/**
 * §18.7 D-TS5 (A2): mechanically summarize the parent spawn task book for the
 * audit spawn — the three audit-relevant elements VERBATIM (design doc paths /
 * affected-file list / acceptance criteria); verbose context/background is
 * dropped (the auditor can read the design docs themselves — they stay
 * available outside this input). Independence preserved: the input is
 * _engTaskInput (mechanically kept by the parent spawn) — never the
 * eng-coder's self-report. Sections are located by header marker, prioritizing
 * header lines (structured task books: "## 文件清单 …") and falling back to
 * inline markers (flat one-line task books); a section runs to the next header
 * of the SAME OR HIGHER level ("## 文件清单" survives a "### 修改" sub-header).
 * Marker not found → the section is reported as missing (never fabricate).
 */
function summarizeEngTaskBook(taskInput) {
  if (!taskInput) return "(unavailable)"
  const SECTIONS = [
    { name: "Design docs involved", markers: [/Docs? involved/i, /涉及文档/] },
    { name: "Affected-file list", markers: [/Files? (?:list|to (?:modify|change)|modified)/i, /受影响文件/, /文件清单/, /涉及文件/] },
    { name: "Acceptance criteria", markers: [/Acceptance(?: criteria)?/i, /验收标准/] },
  ]
  const lines = taskInput.split("\n")
  const headerLevel = (l) => {
    const m = l.match(/^\s*(#{1,6})\s/)
    return m ? m[1].length : 0
  }
  const headerIdx = lines.map((l, i) => (headerLevel(l) > 0 ? i : -1)).filter((i) => i >= 0)
  const boundsFor = (from, level) => {
    for (const j of headerIdx) {
      if (j > from && (level === 0 || headerLevel(lines[j]) <= level)) return j
    }
    return lines.length
  }
  const out = []
  for (const { name, markers } of SECTIONS) {
    let from = -1
    let level = 0
    for (const i of headerIdx) {
      if (markers.some((m) => m.test(lines[i]))) { from = i; level = headerLevel(lines[i]); break }
    }
    if (from === -1) {
      for (let i = 0; i < lines.length; i++) {
        if (markers.some((m) => m.test(lines[i]))) { from = i; level = 0; break }
      }
    }
    if (from === -1) { out.push(`${name}: (not found in the parent task book)`); continue }
    const body = lines.slice(from, boundsFor(from, level)).join("\n").trim()
    out.push(body || `${name}: (empty section)`)
  }
  return out.join("\n\n")
}

/**
 * Effective subagent model override for a role (CLI parity shared with VS Code):
 * priority — subagent tool `model` arg > config.agent.subagentModels[role] > config.agent.subagentModel > null (inherit parent).
 * The literal "default" (case-insensitive) means "no tool-arg override → run the
 * chain" — same as omitting the parameter (2026-09-05 user ruling).
 */
export function effectiveSubagentModel(parent, role, modelArg) {
  // "default" alias (2026-09-05 user ruling — ARCHITECTURE.md 子 agent 模型指定):
  // the literal "default", matched case-insensitively, explicitly declares "no
  // override at the tool-arg level → run the default priority chain" (type-level
  // subagentModels[role] → global subagentModel → null = inherit parent). It is
  // equivalent to omitting the parameter / passing ""/null/undefined (which fall
  // through below). Any other value still overrides.
  if (modelArg && String(modelArg).toLowerCase() !== "default") return modelArg
  const cfg = parent.config?.agent ?? {}
  return cfg.subagentModels?.[role] ?? cfg.subagentModel ?? null
}

/**
 * Resolve the design-token slot for an eng-coder spawn (2026-09-01 multi-design, FR3):
 * - designId given → exact slot lookup (no match = explicit error, never a fuzzy guess)
 * - designId omitted → exactly ONE slot must exist (single-design compatibility); with
 *   multiple slots we refuse rather than pick one (T16: never silently aim the wrong design)
 * Returns { token } on success; throws with a parent-actionable message otherwise.
 * R16 (2026-09-06): the slot Map is the authority; the format/TTL check itself stays in
 * validateDesignToken (2026-09-06: HMAC 防伪层已删——token 为无签名流程凭证——见
 * ENGINEERING-MODE.md 2026-09-06 段）。
 * DESIGN-TOKEN-SETTLEMENT D2（2026-09-08）：内存 Map miss（指定 designId 不在 / 空 Map）
 * 时回读槽文件权威台账 reconcile + 判定（reconcileEngTokensFromSlot——与 dispatch 写门
 * D3 同源）——覆盖"进程重启后槽有但 Map 未及回填/缓存与槽不一致"（槽文件 = 权威台账）。
 * TTL 过滤保留（reconcile 只并入未过期项）。单值镜像 `_engDesignToken` 已随 D3 退役——
 * 本门禁不再读镜像（AC3 零命中）。
 */
export function resolveDesignSlot(parent, designIdArg) {
  let slots = parent._engDesignTokens
  const hasSlots = slots instanceof Map && slots.size > 0
  // D2：内存 miss（指定 designId 不在 或 空 Map）→ 权威槽回读 reconcile + 判定
  if (designIdArg ? !(hasSlots && slots.has(designIdArg)) : !hasSlots) {
    const rec = reconcileEngTokensFromSlot(parent)
    if (rec && rec !== slots) slots = rec
  }
  // F2d (§29.1): both refusal branches carry the HELD id list — after a
  // persistence restore the parent has no digest to look the id up in; the error
  // list is the only discovery path (ids are not credentials — the token is).
  const size = slots instanceof Map ? slots.size : 0
  const heldIds = size > 0 ? [...slots.keys()].join(", ") : "(none)"
  if (designIdArg) {
    if (!(slots instanceof Map) || !slots.has(designIdArg)) {
      throw new Error(`designId not found — no approved design review holds this id. Run advisor with type='design' again and pass the designId echoed with the token. (session holds ${size} approved design slot(s); held design ids: ${heldIds})`)
    }
    return { token: slots.get(designIdArg) }
  }
  if (size > 1) {
    throw new Error(`Multiple approved designs in this session (${size}) — pass the designId parameter (echoed with each token) to choose which design this eng-coder spawn belongs to. Held design ids: ${heldIds}`)
  }
  if (size === 1) return { token: [...slots.values()][0] }
  throw new Error("Invalid or missing design token — run advisor with type='design' first and pass the returned token as designToken.")
}

/**
 * consume-design 动作执行器（2026-09-07 token 链终消费制——ENGINEERING-MODE.md §2.6 F1）：
 * 父侧验收核销时显式调用——读槽值 → removeDesignTokenSlot（token-ttl.mjs——移除该
 * designId 槽）→ 消费后同 designId 再 spawn = resolveDesignSlot not found 机械拒。调用
 * 形态定死（评审 #3）：参数 designId（单设计会话可省略——FR3 spawn 同款语义）；未知
 * designId 与重复消费同款 no-op 提示（幂等——不报错）。DESIGN-TOKEN-SETTLEMENT D3
 * （2026-09-08）：单值镜像 `_engDesignToken` 已退役——无镜像兼容值清/兜底读（AC3）。
 * consume 落盘对称（2026-09-08 D1 段 + AC7）：删内存槽后当场 persistEngTokens 同步
 * 落盘删除（旧台账不留盘——防 D2 门禁 miss 回读复活已消费 token）；落盘失败回滚
 * 内存槽 + 抛错（不留半消费态，可重试——D1 评审 #1 同款失败语义）。
 * dispatch 分类（评审 #7d）：非只读控制动作——depth-0 + 工程模式
 * 限定（受限变体门在 subagent.mjs 分流处；本器自持工程模式门）——planMode 拒绝
 * （dispatch 不豁免）——不入批审批分组（dispatch 免审直行——无文件写）。
 */
export function executeConsumeDesignAction(args, ctx) {
  const parent = ctx.agent
  if (!parent?.config?.agent?.engineering) {
    throw new Error("Engineering mode is not active — consume-design applies only to engineering-mode design tokens (spawn 同门).")
  }
  const designId = args?.designId ? String(args.designId) : undefined
  const slots = parent?._engDesignTokens
  const hasSlots = slots instanceof Map && slots.size > 0
  // 多槽缺 designId → 拒（spawn 同款语义——不误消费任一槽）
  if (!designId && hasSlots && slots.size > 1) {
    throw new Error(`consume-design: Multiple approved designs in this session (${slots.size}) — pass the designId parameter (echoed with each token) to choose which design to close out.`)
  }
  // 读槽值：给定 designId → 精确槽（未知/已消费 → undefined）；缺省 → 唯一槽
  let token = null
  if (designId && hasSlots) token = slots.get(designId) ?? null
  else if (!designId && hasSlots) token = [...slots.values()][0]
  // 未知 designId / 已消费 / 无任何槽 → 幂等 no-op 提示（不报错——评审 #3 定死）
  if (!token) {
    return `consume-design: no live slot${designId ? ` for designId ${designId}` : ""} (already consumed or never issued) — idempotent no-op, nothing changed.`
  }
  // consume 落盘对称（DESIGN-TOKEN-SETTLEMENT D1 段 + AC7——交付 🔴 复活洞修复）：
  // 删内存槽后当场同步落盘删除（D1 同款 persistEngTokens——空 Map → 槽文件
  // engDesignTokens 字段删除，旧台账不留盘）。否则消费→回合尾 saveSession 窗口内
  // spawn 门禁 miss 回读（D2）会从盘上复活已消费 token。
  const slotId = designId ?? [...slots.keys()][0]
  removeDesignTokenSlot(parent, designId, token)
  try {
    persistEngTokens(parent)
  } catch (e) {
    // 落盘失败 → 回滚内存槽 + 抛错（不留半消费态——盘上仍有旧台账时消费不得报
    // 成功；可重试——D1 评审 #1 settle 同款失败语义）
    if (slotId) parent._engDesignTokens.set(slotId, token)
    throw new Error(`consume-design: the slot was removed in memory but could NOT be durably deleted from the slot file (${e.message}) — the slot is restored in memory; retry consume-design.`)
  }
  return `design slot consumed — designId ${designId ?? "(single-design session)"} is closed out; a further eng-coder spawn for this design is mechanically rejected, and any new work (including deviation fixes) requires a fresh advisor(type='design') review and token.`
}

// ── §20 spawn 调度参数准入（AGENT-LOOP.md §20 D-SD1/D-SD3 + 20.4 round2 #5/#7）──
// files/dependsOn 声明即契约（v1：不做任务书文本自动解析——不可靠）。缺省（两者皆
// 缺）= 既有语义零改动（不参与冲突检测/无校验——legacy spawn 零开销直通）。
// 校验序：参数形态 → 依赖 unknown id（非 consumed 墓碑——T-SD10）→ 依赖环可达
// （T-SD5——防御断言：自然流程不可达）→ 等待态判定。判定结果：wait/depc 阻塞 →
// async 入 queued 等位（spawn 返回带 reason——D-SD3b）；**sync spawn（async:false）
// 命中阻塞 → 明确错误——不队列化 sync——sync 语义零变更（round2 #7——T-SD13）**。
/** §20 准入（参数化提取——2026-09-05 module-split）：返回归一化 { files, dependsOn }。
 *  filesRaw 目录声明 fail-closed（检测器 throw → 错误即工具结果 JSON）。 */
export function prepareScheduling(parent, filesRaw, dependsRaw, wantAsync) {
  const files = []
  if (filesRaw !== undefined && filesRaw !== null) {
    try {
      files.push(...normalizeFileList(filesRaw, parent.cwd))
    } catch (e) {
      return { files: [], dependsOn: [], errorJson: JSON.stringify({ status: "error", error: e.message }) }
    }
  }
  if (filesRaw !== undefined && filesRaw !== null && !Array.isArray(filesRaw)) {
    throw new Error("subagent files must be an array of file paths (the write domain this task declares)")
  }
  const dependsOn = []
  if (dependsRaw !== undefined && dependsRaw !== null) {
    if (!Array.isArray(dependsRaw)) throw new Error("subagent dependsOn must be an array of async subagent ids (from prior spawn returns)")
    for (const d of dependsRaw) {
      if (typeof d !== "string" && typeof d !== "number") {
        throw new Error(`subagent dependsOn entries must be async subagent ids — got ${JSON.stringify(d)}`)
      }
      dependsOn.push(String(d))
    }
  }
  if (files.length > 0 || dependsOn.length > 0) {
    for (const d of dependsOn) {
      if (depInfo(parent, d).state === "unknown") {
        throw new Error(`subagent dependsOn: unknown async subagent id: ${d} — dependsOn references ids from prior async spawn returns; an id already consumed (auto-delivered to the model) counts as satisfied, anything else is a mistake (AGENT-LOOP.md §20 D-SD5)`)
      }
    }
    assertNoDepCycle(parent, dependsOn)
    const block = describeBlockers(parent, { _files: files, _dependsOn: dependsOn })
    if (!wantAsync && block.kind !== "slot") {
      throw new Error(`sync spawn (async:false) cannot queue behind a scheduling conflict: ${block.detail} — pass async:true to queue the task (the scheduler starts it when the blockers clear), or wait for them to finish first (AGENT-LOOP.md §20 round2 #7)`)
    }
  }
  return { files, dependsOn, errorJson: null }
}

/**
 * §20 准入通过后的 child 装配（2026-09-05 module-split——自 execute 参数化提取，
 * 原 318-488 段 verbatim——语义零变）。副作用保留：relay 计数器/子代理 _logId/
 * makeRelay 注册/_engTaskInput 携带全部在此发生。返回阻塞/异步两路径共用的
 * { child, input, childOpts, childRunOpts, relayPrefix, childProvider }。
 */
export function buildSpawnChild(parent, ctx, args, role, wantAsync, files, dependsOn, engAuditAttempt) {
  // Provider/model override: tool `model` arg > subagentModels[role] > subagentModel > parent provider
  const childProvider = resolveChildProvider(parent, effectiveSubagentModel(parent, role, args.model))

  // eng-coder token gate: the design review must have passed and the caller must
  // present the exact token advisor issued — otherwise the child is not authorized to code.
  // 2026-09-01: multi-design slots — the token is located by designId (exact slot,
  // single-slot fallthrough); token validation itself is unchanged (2026-09-06:
  // HMAC removed — validateDesignToken now checks format + TTL only).
  let issuedToken
  if (role === "eng-coder") {
    issuedToken = resolveDesignSlot(parent, args.designId).token
    // R16 D-R16c ③ — spawn-gate cleanup: only an EXPIRY rejection removes the slot
    // (the caller passed the slot's own token and it is past TTL — 长跑不重启也清);
    // mismatch / format rejections never delete — the slot's own token may still be
    // valid and a caller error must not destroy it (T-R16d). 单值镜像已退役（D3）——
    // 无镜像同步清。
    const expiredReject = !!issuedToken && args.designToken === issuedToken && tokenExpired(issuedToken)
    if (!issuedToken || args.designToken !== issuedToken || !validateDesignToken(args.designToken)) {
      if (expiredReject) removeDesignTokenSlot(parent, args.designId, issuedToken)
      throw new Error("Invalid or missing design token — run advisor with type='design' first and pass the returned token as designToken.")
    }
  }

  // Filter tool set by role: explore/plan are read-only (plan is a planning agent, its deliverable is the plan itself)
  let tools
  if (role === "explore" || role === "plan") {
    const allowed = readonlyToolNames(parent.tools)
    tools = parent.tools.filter((t) => allowed.has(t.name))
  } else {
    tools = parent.tools
  }

  // Select prompt overlay by role
  let overlay = ""
  if (role === "explore") overlay = EXPLORE_OVERLAY
  else if (role === "coder") overlay = CODER_OVERLAY
  else if (role === "plan") overlay = PLAN_OVERLAY
  else if (role === "eng-coder") overlay = ENG_CODER_OVERLAY

  // explore/plan: force read-only permission; coder/default: AUTO passes through directly,
  // manual mode queues permission requests for the parent agent's approval UI (human in the loop, child agent is no longer silently rejected)
  let childPermission
  if (role === "explore" || role === "plan") {
    childPermission = async () => false
  } else if (parent.autoApprove) {
    childPermission = async () => true
  } else {
    childPermission = async (name, toolArgs) => {
      if (!ctx.onPermissionRequest) return false
      const ask = () => ctx.onPermissionRequest(`${role ?? "sub"}/${name}`, toolArgs)
      // Queue parallel child agent permission requests to avoid two popups simultaneously overwriting each other (lesson from question tool)
      parent._permQueue = (parent._permQueue ?? Promise.resolve()).then(ask, ask)
      return parent._permQueue
    }
  }

  // eng-coder: force engineering=true on child config so setup.mjs applies engineering prompt
  const childConfig = role === "eng-coder"
    ? { ...parent.config, agent: { ...parent.config.agent, engineering: true } }
    : parent.config

  const child = createAgent({
    provider: childProvider,
    tools,
    config: childConfig,
    cwd: parent.cwd,
    memory: parent.memory,
    overlay,
    role,
  })

  // Token-verified design review → child is authorized to modify files without re-reviewing
  if (role === "eng-coder") child._engDesignReviewed = true
  // §18 D-E3 task-domain authorization: approved design + spawn task = authorization.
  // The child's OWN tools skip ONLY the onPermissionRequest ask (autoApprove
  // equivalent — dispatch.mjs permission stage); every other gate (JSON parse /
  // unknown tool / planMode / design-token) still applies (T-E14). Non-eng-coder
  // children keep the manual per-write parent approval (human in the loop).
  if (role === "eng-coder") child._engTaskAuthorized = true
  // designId rides the child bookkeeping: the delivery report carries the designId
  // so the divergence-audit fix round re-spawns with the SAME slot (2026-09-01 FR3).
  // DESIGN-TOKEN-SETTLEMENT D3 (2026-09-08): the single-value `_engDesignToken` mirror
  // is retired — no mirror copy on the child (nothing reads it; the slot ledger + the
  // spawn-time token validation are the only authorities).
  if (role === "eng-coder" && issuedToken) {
    child._engDesignId = args.designId ?? null
  }

  // §18.5 子代理零 git（D-AG1——2026-09-04 用户裁定）：explore/plan 一律不注入
  // git 上下文——子代理证据链 = 任务书 ∪ 磁盘当前状态（read/glob/grep）∪（审计时）
  // _touchedFiles，无一项来自 git；注入的全工作区脏状态快照与任务域无关，会误导
  // 审计/探索（"status 里这个文件算不算超清单？"）。注入分支整体删除（B 方案
  // git 只读变体亦随裁定废弃——D-AG5）。顶层主 agent 注入保留（§3 prepareRun——
  // setup.mjs depth===0——D-AG7 范围边界）。
  let input = args.context ? `Context:\n${args.context}\n\nTask:\n${args.task}` : args.task
  // §18 D-E2 ③ (round4 #4, T-E13/T-E15): an eng-coder audit spawn's task book is
  // the eng-coder's OWN spawn task — mechanically kept as _engTaskInput by the
  // parent spawn and injected as the D-TS5 A2 mechanical summary (design docs /
  // affected-file list / acceptance criteria verbatim, verbose context dropped)
  // — ∪ the mechanically tracked _touchedFiles — NEVER the eng-coder's
  // self-written list: a self-report could omit exactly the out-of-scope file
  // the audit must catch.
  if (engAuditAttempt !== null) {
    const touched = (ctx.agent._touchedFiles ?? []).map((f) => `- ${f}`).join("\n") || "- (none yet)"
    input += `\n\n[Audit scope — mechanical context, independent of the eng-coder's self-report:]\n` +
      // §18.7 D-TS4 A1：审计指令模板（四类偏差 + 范围限制 + 校验清单格式）——审计语义
      // 不再靠模型自悟；范围限制是 §18.5 D-AG3 声明（下方 Zero-git scope authority）
      // 的同源一句指注，不重复声明。
      `[Audit instructions — mechanical template (AGENT-LOOP.md §18.7 D-TS4 A1):]\n` +
      `You are auditing an eng-coder delivery against its approved design — audit for EXACTLY these four deviation categories:\n` +
      `- PARTIAL: an acceptance criterion implemented partially or not at all;\n` +
      `- SILENT-SIMPLIFICATION: a "simpler approximation" of a specified behavior substituted for the spec;\n` +
      `- DOC-DRIFT: code changed without the owning design-doc section (module map / affected-files table) updated in the same delivery;\n` +
      `- OUT-OF-LIST: changes outside the approved file list.\n` +
      `Audit scope = _touchedFiles above UNION the files confirmed by the parent task book (single source — the Zero-git scope authority note below, AGENT-LOOP.md §18.5 D-AG3; NOT a second copy): ` +
      `workspace changes not listed there are unrelated to this delivery and are NOT grounds for an out-of-list finding.\n` +
      `Scope discipline (F-TS6 A1): read ONLY the audited files and the design-doc sections relevant to this delivery — do NOT re-read whole documents.\n` +
      `Every deviation item MUST be fieldized: file:line + design reference (doc path + section/AC id) + severity + evidence (quoted code or doc text).\n` +
      // §18.7 D-TS5 A2：任务书从全量 verbatim 改机械摘要块（三要素逐字——排除冗长上下文）。
      `[Parent spawn task book — mechanical summary (AGENT-LOOP.md §18.7 D-TS5 A2): design docs + affected-file list + acceptance criteria verbatim; verbose context/background dropped — the design docs are still available for reading outside this input:]\n` +
      `${summarizeEngTaskBook(ctx.agent._engTaskInput)}\n` +
      `Files actually touched by the eng-coder (mechanical union — audit these against the file list):\n${touched}\n` +
      // §18.5 D-AG3（2026-09-04）：审计零 git 范围权威声明——本审计任务零 git（不注入
      // git 上下文——§18.5 全角色零 git）；_touchedFiles 为审计范围；工作区未列于
      // _touchedFiles 的改动与本任务无关，不作超清单依据（VS Code auditTaskBook 同款措辞）。
      "Zero-git scope authority (AGENT-LOOP.md §18.5 D-AG3): this audit task receives NO git context — nothing is injected. " +
      "The evidence base is the design documents, the current disk state (read/glob/grep), and the _touchedFiles list above. " +
      "Workspace changes NOT listed in _touchedFiles are unrelated to this delivery — they are NOT grounds for an out-of-file-list finding." +
      // §18.13 D-A1.2：审计预算句——A1 指令模板 + A2 摘要块之后、A3 报告模板之前（定序——评审 #7）。
      // 逐字设计锚（D-A1.2 代码块）：只读该读的——10 轮机械预算——超时报 PROBLEM 下结论。
      // 前导 \n 与 A3 同款块分隔约定（上一句 Zero-git 句末无换行——不触碰既有句）。
      `\n[Audit budget — mechanical]: read ONLY the touched files listed above and the design-doc sections the parent task book names (affected-files table, acceptance criteria, status line). Do NOT read whole documents. Budget = 10 tool rounds max — if you cannot conclude within it, report PROBLEM (inconclusive) rather than continuing to explore.\n` +
      // §18.7 D-TS6 A3：审计输出报告格式模板（三态——字段化行——不让模型自由发挥）。
      `\n[Audit report format — mechanical template (AGENT-LOOP.md §18.7 D-TS6 A3):]\n` +
      `Report EXACTLY one of three states:\n` +
      `- CLEAN — no deviation across the four categories: reply the line "Four deviation categories: none found." (四类偏差均未发现);\n` +
      `- DEVIATIONS — one row per deviation, every row fieldized: | category | file:line | design reference | severity | evidence |;\n` +
      `- PROBLEM — the audit itself could not run / inconclusive: state what blocked it.\n`
  }
  // The child's own task input rides the child object: an eng-coder's audit
  // spawns reuse it as the task-book SOURCE — injected as the D-TS5 A2
  // mechanical summary, not verbatim (see above).
  if (role === "eng-coder") child._engTaskInput = input

  // Relay content/reasoning/tool/output to the parent TUI via the unified spawn-child
  // pipeline (AGENT-LOOP.md §7.2 D3). Prefix includes a unique id: parallel child agents
  // with the same role stay independent and don't overwrite each other.
  // Format: role#id/  →  onToken("coder#2/writing..."), onToolCall("coder#2/read", args)
  // Async id allocation (AGENT-LOOP.md §15 D-A1): reserve the relay counter at
  // spawn time — the returned id must be stable while the item sits in the queue.
  // The [model] token (TUI block creation) is DEFERRED to actual start so queued
  // children don't paint an empty panel block ("queued 态不显示").
  let relayPrefix
  if (wantAsync) {
    parent._subAgentCounter = (parent._subAgentCounter ?? 0) + 1
    relayPrefix = `${role}#${parent._subAgentCounter}/`
  } else {
    relayPrefix = makeRelay(parent, role ?? "sub", ctx.callbacks?.onToken, childProvider.model ?? "")
  }
  // LOGGING（LOGGING.md）：子代理内部事件（子内 llm:*/tool:*）以 childId 归属——
  // agent._logId 随 runAgent 的 logCtx 透出（主文件单文件全记、按 childId grep）。
  child._logId = relayPrefix.slice(0, -1)
  const childOpts = {
    onPermissionRequest: childPermission,
    ...wrapChildCallbacks(relayPrefix, ctx.callbacks),
  }
  const childRunOpts = buildChildRunOpts(ctx)
  return { child, input, childOpts, childRunOpts, relayPrefix, childProvider }
}
