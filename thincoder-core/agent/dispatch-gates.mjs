/**
 * agent/dispatch-gates.mjs — dispatch 门面谓词与记账（2026-09-28 拆分批 · R3——自
 * `agent/dispatch.mjs`（498/499 贴 500 硬限）外提：动作级分类四谓词（readonly ∕ control ∕
 * consume-design ∕ escalate）+ 工具错误落盘 `logToolError` + 执行即刻 mutation 记账
 * `noteExecutedMutation`；**逐字迁移**、零行为改）。
 * `executeToolCalls` 仍住 `dispatch.mjs`（对外缝零改——签名与调用点零改）；单条执行体住
 * `./dispatch-run.mjs`（其 import 本档的 `logToolError` ∕ `noteExecutedMutation`）——本档
 * 零回引，为两者之叶。ERRORS_DIR = ~/.thincoder/tool-errors。
 */
import { writeFileSync, mkdirSync, existsSync } from "node:fs"
import { join, resolve } from "node:path"
import { homedir } from "node:os"
import { toolTouchPaths } from "./helpers.mjs"
// fix A（2026-09-07）：FILE_MUTATORS 的 mutation-seq 记账从
// 批后提交（record-results noteMutations）移到执行成功即刻——唯一记账点（取代批后段
// + agent.mjs 中断分支记账——不双计）——同消息 [写 + async advisor launch] 时 launch 前
// 完成的写在 launchSeq 之前落地 → settle 不再误判 stale（fix A 症状根因）。
import { noteMutations } from "../agent-tools/advisor-async.mjs"

const ERRORS_DIR = join(homedir(), ".thincoder", "tool-errors")

/**
 * Persist a tool error to ~/.thincoder/tool-errors/YYYY-MM-DD/HHmmss-toolName.log
 * Only called for actual execution failures and malformed invocations.
 * Skipped for intentional denials (plan mode, user reject).
 */
export function logToolError(toolName, args, error) {
  try {
    const now = new Date()
    const ymd = now.toISOString().slice(0, 10)
    const ts = now.toISOString().replace(/:/g, "").replace(/\..+/, "").replace("T", "-")
    const dir = join(ERRORS_DIR, ymd)
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    const file = join(dir, `${ts}-${toolName.replace(/[/\\]/g, "_")}.log`)
    const entry = [
      `time: ${now.toISOString()}`,
      `tool: ${toolName}`,
      `args: ${JSON.stringify(args, null, 2).slice(0, 2000)}${JSON.stringify(args, null, 2).length > 2000 ? "… (truncated)" : ""}`,
      `error: ${error?.message ?? String(error)}`,
      error?.stack ? `stack:\n${error.stack}` : "",
    ].filter(Boolean).join("\n") + "\n"
    writeFileSync(file, entry, "utf8")
  } catch {
    // Log failure itself must not crash the agent
  }
}

/**
 * action-level classification (AGENT-LOOP-SUBAGENT.md §6.7 D-M1): the merged subagent
 * tool expresses spawn (side effect) and status (read-only query) through
 * its `action` parameter — the tool-level readonly flag can no longer express both.
 * dispatch Phase-1/Phase-2 classifies per action: status behaves as readonly
 * (planMode pass / no permission ask / batchable), spawn keeps its non-readonly
 * gates, escalate runs non-readonly AND serially (the retired escalate tool had no
 * parallel flag — zero behavior change under the merged surface).
 * AGENT-LOOP-SUBAGENT.md §6.7.2 cancel (19.5.2b round2 #4): CONTROL-class exemption — cancel only
 * stops, never starts. isSubagentControlAction feeds the SAME two gate sites as
 * readonly (planMode pass / no permission ask — never joins a batch approval
 * group / no handler → not denied — digest 内 cancel 放行).
 * AGENT-LOOP-SUBAGENT.md §6.7.2 panel (round1 #5): view 面归只读类（同 status——planMode 放行、免
 * 审批、可批并行）；freeze 面归控制类（同 cancel——planMode 放行、免权限审批、
 * 批审批不入组、digest 内放行）。freeze 存在（非空 key）即控制类——否则只读类。
 */
export function isSubagentReadonlyAction(toolName, args) {
  // §6 memory 工具面重构（MEMORY.md §6 D-M5）：memory search/list 是只读动作——与
  // subagent status 同分类（planMode 放行/免审批——Phase-2 批并行只认工具级
  // readonly/parallel，memory 无 parallel → 按非只读串行，见 MEMORY.md §6.4 实现注）。
  // 动作级判定——不能按工具名（同一 memory 工具的 put/delete/clear 保持侧效门）。
  if (toolName === "memory") {
    const action = args?.action
    return action === "search" || action === "list"
  }
  // SETTINGS-TOOL.md（2026-09-05）：settings list/get 是只读动作（memory search/list 同分类——
  // planMode 放行/免审批）；set 保持侧效门。
  if (toolName === "settings") {
    const action = args?.action
    return action === "list" || action === "get"
  }
  // manifest read 只读格（`MANIFEST.md` §2.10 · 台账 #1098——settings list/get 同分类；init / write 保持侧效门）
  if (toolName === "manifest") {
    const action = args?.action
    return action === "read"
  }
  // #9（TOOLS.md §6.19）：process 动作分级——list 保持只读分类（planMode 放行/免审批/可批并行）；
  // kill 是破坏性动作（审批门 + planMode 拒）。
  if (toolName === "process") return args?.action !== "kill"
  if (toolName !== "subagent" || !args || typeof args !== "object") return false
  const action = args.action
  // AGENT-LOOP-SUBAGENT.md §6.7.5: check 动作已删除——只读面仅剩 status（planMode 放行/免权限审批/可批并行）
  if (action === "status") return true
  // SUBAGENT-OBSERVE-SEND：observe = readonly 查询（同 status——digest/planMode 放行）
  if (action === "observe") return true
  // AGENT-LOOP-SUBAGENT.md §6.7.2 panel view 面（freeze 缺省/空 = 视图请求——readonly；非空 freeze 归控制类）
  if (action === "panel" && (args.freeze === undefined || args.freeze === null || String(args.freeze) === "")) return true
  // DESIGN-TOKEN-SETTLEMENT.md §10 F-SL1（2026-10-07 批 ledger-tool）：design-slots = 只读清点
  // （同 status / observe——planMode 放行 / 免审批 / digest 放行；工程模式父侧门在执行器内）。
  if (action === "design-slots") return true
  return false
}
export function isSubagentControlAction(toolName, args) {
  if (toolName !== "subagent") return false
  if (args?.action === "cancel") return true
  // SUBAGENT-OBSERVE-SEND：send = 控制类豁免（同 cancel——父回合内显式调用即授权——
  // 写子输入队列属父对子轻量引导，非产品代码写——免审批、planMode 放行、digest 内放行）
  if (args?.action === "send") return true
  // AGENT-LOOP-SUBAGENT.md §6.7.2 panel freeze 面（D-P3 门控在 executor——只读/控制分类在此）
  if (args?.action === "panel" && args.freeze !== undefined && args.freeze !== null && String(args.freeze) !== "") return true
  return false
}
/**
 * §2.6 token 链终消费制（2026-09-07——评审 #7d dispatch 分类）：consume-design =
 * 非只读控制动作——planMode 拒绝（不入 readonly/control 豁免——与其他非只读动作同门）、
 * 免权限审批、不入批审批分组（无文件写——控制类直行——只停既有状态不起新副作用）。
 * 与 cancel 的不同：cancel 是控制类豁免（planMode 放行），consume-design 按设计
 * planMode 拒绝——故不并入 isSubagentControlAction，单独谓词只接权限豁免位。
 */
export function isSubagentConsumeDesignAction(toolName, args) {
  return toolName === "subagent" && args?.action === "consume-design"
}
export function isSubagentEscalateAction(toolName, args) {
  return toolName === "subagent" && args?.action === "escalate"
}

/** E1（parity-b1 §2.5——动作谓词采纳）：工具面动作谓词钩子**优先**、缺省回落核名面谓词（`??` 同式）。
 *  端壳装饰体携钩子（`gitTool.isReadonlyAction` ∕ `memoryTool.isReadonlyAction` ∕ 子代 `vscSubagentFace`
 *  的 `isReadonlyAction/isControlAction`）——取核 dispatch 后其动作级分类（planMode 放行 ∕ 免审批）
 *  由此保形；核内工具零钩子 ⇒ CLI ∕ desktop 逐字零变（`undefined ?? 核谓词`）。
 *  两谓词 = 上列两门禁位（planMode ∕ 权限短路）的公共输入（同址同用，防两处漂移）。 */
export function readonlyActionOf(tool, toolName, args) {
  return tool?.isReadonlyAction?.(args) ?? isSubagentReadonlyAction(toolName, args)
}
export function controlActionOf(tool, toolName, args) {
  return tool?.isControlAction?.(args) ?? isSubagentControlAction(toolName, args)
}

/**
 * fix A — 唯一记账点：FILE_MUTATORS 工具执行成功即刻记 mutation seq（abs 路径）。
 * 取代 record-results 批后段 + agent.mjs 中断分支的 noteMutations（不双计——中断+同批
 * launch 场景 seq 单计，T-A1i）。调用时机 = 写执行成功（非 Error 前缀
 * 结果——recordPeerWrites 同款门）；routed（M2 ACP 客户端执行）成功同样记账。
 */
export function noteExecutedMutation(agent, tool, args) {
  // #327（TOOLS.md §6.17）：单源谓词恒数组 · 恒零抛——原 try/catch 外壳退休。
  const abs = toolTouchPaths(tool, args)
    .filter((p) => typeof p === "string" && p)
    .map((p) => resolve(agent.cwd, p))
  if (abs.length > 0) noteMutations(agent, abs)
}
