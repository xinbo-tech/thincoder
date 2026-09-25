/**
 * tool-gates.mjs — pre-stage gates + batch-permission scan（§18 C-11 拆分——2026-09-12）。
 * 自 execute-tools.mjs verbatim 迁出（506 > 500 硬限归位——零语义）：前置门禁
 * （planMode / 工程设计闸 / D5 冻结窗口）· L3 触达路径 helper · consume-design 谓词 ·
 * D-B1 同批权限合并扫描。execute-tools 单向 import 本档（无环）——`executeToolBatches`
 * 与 L3 记账面留原档；agentHasLiveEngSlot 仅本档内部消费（不导出）。
 */
import { resolve, relative } from "node:path"
import { FILE_MUTATORS } from "./run-helpers.mjs"
import { isCodePath, loadConventions } from "@thincoder/core/conventions.mjs"
import { validateDesignToken } from "@thincoder/core/agent-tools/design-token.mjs"
import { readSlotEngDesignTokens } from "../extension/session-slot-write.mjs"
// §9 D-24b：冻结窗口判据组装——W12（2026-09-15）原端侧 `advisor-async.mjs` 副本退役后
// 改指核 `advisor-settle.mjs`（同读池条目 `docAbs`/`launchSeq`/`_mutLog`）；M4（2026-09-17）
// 上移单点：消费核 `agent/write-gate.mjs` 的 `freezeWindowConflict`（被审文件集 = 声明
// 文档集 + 批次档的合流点）——与 CLI dispatch.mjs 同源镜像，端侧不再直连 settle 谓词。
import { freezeWindowConflict, batchRecordWriteConflict } from "@thincoder/core/agent/write-gate.mjs"
// #327（`docs/core/design/TOOLS.md` §6.17）：触达路径提取单源谓词——端侧同引核单源（零副本）。
import { toolTouchPaths } from "@thincoder/core/agent/helpers.mjs"

/** L3 触达路径（绝对）：整面走 #327 单源谓词（路径工具的动作感知随核单源——`docs/core/design/TOOLS.md`
 *  §6.17 裁定 5）。 */
export function l3TouchedPaths(tool, args, cwd) {
  return toolTouchPaths(tool, args).filter((p) => typeof p === "string" && p).map((p) => resolve(cwd, p))
}

/**
 * DESIGN-TOKEN-SETTLEMENT AC4 (2026-09-08): 父代理写门资格判据 = 权威台账"任一活槽存在"。
 * 先问内存 Map（本 run 水合 + 会话内 settle）；miss 回读 _engPersist 槽（与 spawn-gate D4
 * 同源 reconcile），把未过期格式有效 token reconcile 进内存并判定。单值镜像 _engDesignToken
 * 已退役（D5）——门禁不再读镜像。fail-closed：畸形/过期 token 不构成"活槽"（不授权产品代码写）。
 */
function agentHasLiveEngSlot(agent) {
  const m = agent._engDesignTokens
  if (m instanceof Map) {
    for (const t of m.values()) {
      if (typeof t === "string" && validateDesignToken(t)) return true
    }
  }
  const p = agent._engPersist
  if (!p?.cwd || !p?.slot) return false
  let obj = null
  try { obj = readSlotEngDesignTokens(p.cwd, p.slot)?.engDesignTokens ?? null } catch { obj = null }
  const live = (obj && typeof obj === "object")
    ? Object.entries(obj).filter(([, t]) => typeof t === "string" && validateDesignToken(t))
    : []
  if (live.length === 0) return false
  const merged = m instanceof Map ? m : new Map()
  for (const [id, tok] of live) merged.set(id, tok)
  agent._engDesignTokens = merged
  return true
}

/**
 * 前置门禁（planMode / 工程设计闸）——单点判定，批扫描与逐项执行共用（D-B1：
 * 被前置门禁拦下的工具不计入批询问）。返回 { blocked, content }。
 */
export function preGateBlocked(agent, { tool, toolName, args, depth }) {
  // Plan mode guard — AGENT-LOOP-SUBAGENT.md §6.7 round2 #2 (AGENT-LOOP.md): readonly classification is
  // ACTION-LEVEL. A tool may declare action-level readonly-ness (isReadonlyAction —
  // e.g. subagent action:'status'): those pass plan mode like readonly tools,
  // while the same tool's side-effecting actions (subagent spawn/escalate) stay denied.
  // AGENT-LOOP-SUBAGENT.md §6.7.2 D-M6 round2 #4: control actions (isControlAction — subagent action:'cancel')
  // are a separate exemption class: 只停不启（无新副作用）——planMode 放行（取消既有
  // 子代理——spawn 仍拒）、免权限审批、批审批分组不入组、手动档 digest 放行。
  // W9（2026-09-15）端差适配：plan 工具已换核实现（写 CLI 载体名 `agent.planMode`）——
  // 门禁同读两键（agent.mjs 工具批后回填 `_planMode`；两键同值——批内 plan{enter} 后的
  // 写操作即拦，不留同批窗口）。W11/W15 载体归一后收敛单键。
  if ((agent._planMode || agent.planMode) && tool && !tool.readonly && !(tool.isReadonlyAction?.(args) ?? false) && !(tool.isControlAction?.(args) ?? false)) {
    return { blocked: true, content: "Error: plan mode active" }
  }
  // Engineering coder hard gate: no file modification before the design review passed (CLI dispatch.mjs parity).
  // §18 C-1（child permission gate——2026-09-12 post-R1 语义）：本 design-token 门在权限阶段
  // **之前**运行且原样生效。eng-coder child 仍**不达**权限阶段——其 spawn 时授权
  // （engDesignReviewed + C-3 live autoApprove=true getter，subagent-run.mjs）整段跳过该
  // 阶段（T-E14 面不变）；写权 child（coder/eng-designer）手动档**抵达**该阶段并经父面板
  // 弹卡（child-permission.mjs）；非 eng-coder child 不再带恒真 autoApprove。
  if (agent._role === "eng-coder" && agent.config?.agent?.engineering
      && !agent._engDesignReviewed && FILE_MUTATORS.has(toolName)) {
    return { blocked: true, content: "Error: engineering design gate — call advisor with type='design' to review the design document before any file modification. If the review found issues, report them to the parent agent." }
  }
  // Engineering mode PARENT gate: no code-file writes before the design review passed.
  // Document/temp paths are exempt (writing the design document IS the design step);
  // every path inside a declared code segment (default: src — incl. src/prompts/*.md,
  // at ANY depth) is product code and needs a live design slot. The classifier is the
  // single authority (@thincoder/core/conventions.mjs) — the old anchored ^src/ regex here was the
  // copy that let a nested layout (packages/foo/src/x.md) slip through the gate.
  // AC4: 判定资格 = "任一活槽存在"（内存 Map / 权威槽回读）——单值镜像已退役（D5）。
  if (agent.config?.agent?.engineering && depth === 0 && FILE_MUTATORS.has(toolName)) {
    const paths = toolTouchPaths(tool, args)
    const conv = loadConventions(agent.cwd)
    // Unknown/missing paths (non-string) are treated as code — block conservatively.
    const touchesCode = paths.some((p) => typeof p !== "string" || isCodePath(p, conv))
    if (touchesCode && !agentHasLiveEngSlot(agent)) {
      // Undeclared project → point at the declaration file (降级可见契约).
      const convNote = conv.declared
        ? ""
        : ` — this path was classified as product code by the default conventions (code paths: ${conv.codePaths.join(", ")}); declare project conventions in .thincoder/conventions.json to adjust.`
      return { blocked: true, content: `Error: engineering design gate — Engineering mode: write the design document first（location per your project's document conventions）, then call advisor with type='design' to review it, and wait for user approval. Implementation is done by eng-coder subagents.${convNote}` }
    }
  }
  // E（F25/ADVISOR-GUARDS.md §5）：D5 冻结窗口写前拦截——设计评审在途（点火 → 结算）期间父侧对被审文件
  // 集的写入被拒（在途写使本轮结算 stale——pass 轮 token 白丢）；判据与 advisorStale 设计面
  // 同源（含 legacy 面）；位置 = 工程门后、权限阶段前（审批不得绕过冻结）。
  // B3 契约 1（群 B 批 E-扩 1——F31(a)）：键扩 file_ops；路径提取统一走 l3TouchedPaths
  // （整面转调单源谓词——file_ops 动作感知随核单源，见该 helper 注）。
  if (FILE_MUTATORS.has(toolName) || toolName === "file_ops") {
    let absPaths = []
    try { absPaths = l3TouchedPaths(tool, args ?? {}, agent.cwd) } catch { absPaths = [] }
    // #309 批次档写门（AGENT-LOOP-SUBAGENT.md §6.29.1——判据集 = FILE_MUTATORS；file_ops / 读类不在门内）
    if (FILE_MUTATORS.has(toolName)) {
      const crossBatch = batchRecordWriteConflict(agent, depth, absPaths)
      if (crossBatch) return { blocked: true, content: `Error: ${crossBatch.message}` }
    }
    const conflict = freezeWindowConflict(agent, absPaths)
    if (conflict) {
      return { blocked: true, content: `Error: write refused — design review #${conflict.id} is in flight over ${relative(agent.cwd, conflict.path)} (D5 freeze window). A write now would settle it stale — no token for a pass (the round is lost). Wait for the report, or cancel the review first (subagent action:'cancel' id:'${conflict.id}') and re-launch after the change.` }
    }
  }
  return { blocked: false }
}

/**
 * §2.6 token 链终消费制（2026-09-07——评审 #7d dispatch 分类——CLI dispatch.mjs 同构）：
 * consume-design = 非只读控制动作——planMode 拒绝（不入 readonly/control 豁免——
 * 与其他非只读动作同门）、免权限审批、不入批审批分组（无文件写——控制类直行）。
 * 与 cancel 的不同：cancel 是控制类豁免（planMode 放行），consume-design 按设计
 * planMode 拒绝——故不并入 isControlAction 钩子，单独谓词只接权限豁免位（批扫描 +
 * 逐项询问两处）。
 */
export function isSubagentConsumeDesignAction(toolName, args) {
  return toolName === "subagent" && args?.action === "consume-design"
}

/**
 * D-B1 同批权限合并询问：扫描同一 response.toolCalls 中所有通过前置门禁、到达权限
 * 询问阶段的非只读工具（深度 0 + 手动模式 + 有 onPermissionRequired），≥2 个时一次询问
 * （onBatchPermissionRequest）→ "approveAll"（本批放行）/ "oneByOne"（回退逐项）/
 * "deny"（全批拒绝、无二次询问）。无 handler 或不足 2 个 → 返回 null（逐项通道原样）。
 * autoApprove 短路不变（getAuto 实时读取——扫描时已开则不聚合）。
 */
export async function collectBatchPermission(agent, { response, toolByName, getAuto, callbacks, depth }) {
  if (getAuto() || depth !== 0 || !callbacks.onPermissionRequired || !callbacks.onBatchPermissionRequest) return null
  const list = []
  for (const tc of response.toolCalls) {
    const tool = toolByName.get(tc.name)
    let args
    try { args = JSON.parse(tc.arguments || "{}") } catch { continue } // JSON 解析失败已被逐项路径拦下
    const pre = preGateBlocked(agent, { tool, toolName: tc.name, args, depth })
    if (pre.blocked) continue // 前置门禁拦下的不计入批询问（评审 #7）
    const actionReadonly = tool?.isReadonlyAction?.(args) ?? false
    // AGENT-LOOP-SUBAGENT.md §6.7.2 D-M6 round2 #4: cancel 类控制动作不入批审批组（免询问——只停不启）；
    // consume-design 同款免审直行（§2.6——无文件写）
    const controlAction = tool?.isControlAction?.(args) ?? false
    if (!tool || tool.readonly || actionReadonly || controlAction || isSubagentConsumeDesignAction(tc.name, args)) continue
    list.push({ id: tc.id, name: tc.name, args })
  }
  if (list.length < 2) return null
  const choice = await callbacks.onBatchPermissionRequest({
    tools: list.map(({ name, args }) => ({ name, args })),
    count: list.length,
  })
  if (choice === "deny") return { denied: new Set(list.map((x) => x.id)), approved: null }
  if (choice === "approveAll") return { denied: null, approved: new Set(list.map((x) => x.id)) }
  return null // oneByOne / 其他 → 既有逐项通道
}
