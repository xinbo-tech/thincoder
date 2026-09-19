/**
 * agent/setup-tooltable.mjs — 工具表装配装饰面（2026-09-16 · 批 7 `docs/vsc/design/VSC-DEBT.md`
 * §3.3 档一：setup.mjs 654 > 500 硬限 ⇒ 结构拆分）。纯结构搬移（零语义改动）——段序与原文
 * 一致：① W9 batch_segment 记账缝注入 · ② W14 三缝接线（skill loader / eng mirror / verify
 * 诊断段）· ③ 池装配装饰与子代理面（`withPool` / `vscSubagentFace` / 终态回显族 /
 * `modeRoleField`）。缝 = re-export（KD-6）：`setup.mjs` 再导出既有导出名
 * （`vscSubagentFace` / `modeRoleField`）⇒ 消费档零改。
 * W8 契约②（`test/engine-floor-guard.test.mjs:129`——端壳静态闭包零 `node:sqlite`）：本档静态边
 * = setup.mjs 既有静态边之子集；核 `agent-tools/skill.mjs` / `eng.mjs` / `async-settle.mjs`
 * 三类面仍走**动态** import()（见 `wireAgentToolSeams` / `vscStatusTerminalEcho`）。
 */
import * as vscode from "vscode"
import { resolve } from "node:path"
import { configureBatchSegment } from "@thincoder/core/agent-tools/batch-segment.mjs" // 叶子（node:fs/node:path）——静态面安全
import { configureVerifyDiagnostics } from "@thincoder/core/agent-tools/verify.mjs" // 叶子面（闭包 4 档零 node:sqlite）——静态面安全
import { CONFIG_CONFLICT_HINT, conflictError } from "@thincoder/core/config-io.mjs"
import { loadSkills, readSkill } from "../extension/skills.mjs"
import { vscPersistRaw } from "../extension/settings-panel-write.mjs"
import { setSlotEngineering } from "../extension/session-slot-write.mjs"
import { loadConsultPool } from "../extension/presets.mjs"

// ─── W9（2026-09-15）：batch_segment 记账面注入（核缝 #84 —— `configureBatchSegment`）──────────
// VSC 特有增量随删旧迁入端壳（四步协议 ②）：核 `agent-tools/batch-segment.mjs` 的写入回调默认
// no-op；本端在装配层注册 = 写入成功即记绑定档绝对路径入 `agent._touchedFiles`（与删除前
// `src/agent-tools/batch-segment.mjs:184` 逐字同语义——Array.isArray 守卫 + includes 去重）——
// 冻结窗口 / 子代理合入记账（execute-tools 的 recordFileMutation 同一载体）行为不变。
configureBatchSegment({
  onWrite: (agent, abs) => {
    if (Array.isArray(agent._touchedFiles) && !agent._touchedFiles.includes(abs)) agent._touchedFiles.push(abs)
  },
})

// ─── W14（2026-09-15）：agent-tools 三缝端侧接线（#88 skill loader / #91 eng mirror / #96 verify 诊断段）──
// 端侧供值随删旧迁入装配层（同 W9 先例）：① `configureSkillLoader` —— 本端 loader 形态 = 同步
// 实现（`src/extension/skills.mjs`，D-CI3 与核 skills.mjs 同构语义）；② `configureEngMirror` ——
// 工程模式翻转后的双持久化镜像（槽权威 + config.json CLI 兼容镜像——迁自删除档
// `src/agent-tools/eng.mjs:92-105`，逐字同语义）；③ `configureVerifyDiagnostics` —— 编辑器诊断
// 段（advisory——迁自删除档 `src/agent-tools/verify.mjs:250-275`，逐字同语义）。
// skill / eng 两缝**动态**载入（核 `agent-tools/skill.mjs` / `eng.mjs` 静态链经核 agent 栈可达
// `node:sqlite`——W8 契约②机判；verify 闭包 4 档零 sqlite ⇒ 静态面安全）。

/** VSC 编辑器诊断段（#96 信息段——advisory，不进门禁；`codeFiles` = 本轮代码变更集，绝对路径）。
 *  逐档取 VS Code 语言服务诊断（Error/Warning 两类），每档前 15 条；零诊断且存在代码档 ⇒ 明示
 *  "none"。返回行数组（核缝契约 `section(ctx, codeFiles) → string[] | null`）。 */
function vscodeDiagnosticsSection(ctx, codeFiles) {
  const key = (p) => (process.platform === "win32" ? p.toLowerCase() : p)
  const diagByFile = new Map()
  for (const [uri, diags] of vscode.languages.getDiagnostics()) {
    if (diags.length > 0) diagByFile.set(key(uri.fsPath.replace(/\\/g, "/")), diags)
  }
  const lines = []
  let advisoryDiag = 0
  for (const f of codeFiles) {
    const abs = resolve(ctx.cwd, f)
    const diags = diagByFile.get(key(abs.replace(/\\/g, "/")))
    if (!diags?.length) continue
    const errors = diags.filter((d) => d.severity === vscode.DiagnosticSeverity.Error)
    const warnings = diags.filter((d) => d.severity === vscode.DiagnosticSeverity.Warning)
    if (!errors.length && !warnings.length) continue
    advisoryDiag += errors.length + warnings.length
    lines.push(`\nEditor diagnostics (advisory — informational only, not a gate):`)
    lines.push(`── ${f} (${errors.length} errors, ${warnings.length} warnings) ──`)
    for (const d of [...errors, ...warnings].slice(0, 15)) {
      const sev = d.severity === vscode.DiagnosticSeverity.Error ? "E" : "W"
      const line = d.range.start.line + 1
      const col = d.range.start.character + 1
      lines.push(`  ${sev} ${line}:${col}  ${d.message}${d.source ? ` [${d.source}]` : ""}`)
    }
  }
  if (advisoryDiag === 0 && codeFiles.some((f) => /\.(m?js|cjs|ts|tsx|mts|cts|rs|go|py)$/i.test(f))) {
    lines.push("\nEditor diagnostics: none for the changed code files.")
  }
  return lines.length ? lines : null
}
configureVerifyDiagnostics({ section: vscodeDiagnosticsSection })

/** skill / eng 两缝动态接线（模块缓存 ⇒ 每 run 零成本；幂等——只接一次）。 */
let agentToolSeamsWired = false
export async function wireAgentToolSeams() {
  if (agentToolSeamsWired) return
  const { configureSkillLoader } = await import("@thincoder/core/agent-tools/skill.mjs")
  configureSkillLoader({ loadSkills, readSkill })
  const { configureEngMirror } = await import("@thincoder/core/agent-tools/eng.mjs")
  configureEngMirror({
    onToggle: (enabled, ctx) => {
      const agent = ctx?.agent
      try {
        const p = agent?._engPersist
        if (p) setSlotEngineering(p.cwd, p.slot, enabled)
      } catch { /* slot unwritable — config mirror still written */ }
      try {
        const r = vscPersistRaw((raw) => {
          raw.agent = raw.agent && typeof raw.agent === "object" ? raw.agent : {}
          raw.agent.engineering = enabled
        })
        // F5b：config 并发被改 → 放弃镜像写（槽权威仍持态）；提示串由核缝追加到结果尾
        return conflictError(r) ? `${CONFIG_CONFLICT_HINT} — config.json mirror not written (slot state still holds for this session).` : null
      } catch { return null /* config unreadable — in-memory state still holds for this run */ }
    },
  })
  // 旗标在两处 configure* 之后置位（评审修正）：载入中途 reject 时下一轮仍会补接，
  // 不留下「旗标已置、两缝未接」的静默降级态。
  agentToolSeamsWired = true
}

/**
 * Decorate a consult-related tool's description with the CURRENT configured candidate
 * pool (provider:model list). Without this the model cannot know which models a consult
 * start / subagent action:'escalate' call can pick from — it would hallucinate
 * provider:model names or never pass `model`. The tool table is assembled per-run from
 * loadRaw(), so the list stays fresh. Description-only: the tool object is cloned
 * shallowly, execute untouched. §19 (2026-09-03): applied to the depth-0 subagentTool
 * too — its escalate action picks from the same pool (the standalone escalate tool was
 * merged in as action:"escalate").
 */
export function withPool(tool) {
  // F-4 (IKCDMR)：运行时读面清洗（loadConsultPool——未知渠道条目过滤 + 一次性警告——
  // CLI loadConfig 同规则）——池描述只列合法候选（防模型照描述点名悬挂条目）。
  const models = loadConsultPool()
  const list = models.map((m) => `${m.provider}:${m.model}${m.effort ? ` (${m.effort})` : ""}`).join(", ")
  if (!list) return tool
  return {
    ...tool,
    description: tool.description + `\nCurrently configured consultants (pool for consult_start / subagent action:'escalate'): ${list}`,
  }
}

/**
 * W13（2026-09-15 · S2 · `docs/batches/2026-09-15-vsc-core-wiring.md` §2 W13）：VSC subagent
 * 工具面装饰（原 `src/agent-tools/subagent.mjs` 的端侧面随镜像删旧迁入本档——同一份装配面，
 * 不另立档；承 W14 `gitTool` 装饰先例）：
 *   ① `modeRoleField`（模式互斥 role enum + suffix）——原档 verbatim 迁入（核 `agent/setup.mjs`
 *      同族逻辑在核内装配面，未导出 ⇒ 端侧装配面自持该面至 W15 收敛）。
 *   ② #99（CORE-UNIFICATION §2.13.4 / AGENT-LOOP.md §19.6 AC-P4）：核登记册的工具面含 `panel`
 *      动作（CLI TUI 面板镜像），VSC 载荷面不存在 ⇒ **装配层剔除**（端侧过滤、零核改动）——
 *      action enum 去项 + 描述去 panel 段 + view/freeze 两参数（仅 panel 消费）移除。
 *   ③ 动作级分类（`isReadonlyAction` status/observe · `isControlAction` cancel/send）——端审批面
 *      （execute-tools 权限门/批分组 + tool-gates planMode 门）按谓词读；核 subagent 工具无该钩子
 *      （核内零端名/零端概念）⇒ 装饰面承载（逐字同删除档谓词）。
 *   ④ C-5 终态回显（AGENT-LOOP（VSC 仓）§12.3）：核 `status` 不读墓碑（未命中即 unknown），
 *      端契约要求 discarded/cancelled/consumed/failed 四态回显 ⇒ 装配面接管 `execute`（仅在核
 *      输出为 unknown-错误时查核墓碑单点 `tombstoneOf` 补回显——其余输出原样透传）。
 */
export function vscSubagentFace(tool) {
  const { view, freeze, ...props } = tool.parameters.properties
  const actionProp = props.action
  return {
    ...tool,
    description: tool.description.split("\n").filter((l) => !l.startsWith("- action:'panel'")).join("\n"),
    parameters: {
      ...tool.parameters,
      properties: {
        ...props,
        action: {
          ...actionProp,
          enum: (actionProp.enum ?? []).filter((a) => a !== "panel"),
          description: actionProp.description.replace(/panel \(view the live subagent panel \/ freeze a digested-stuck block — §19\.6\), /, ""),
        },
      },
    },
    async execute(args, ctx) {
      return vscStatusTerminalEcho(args, ctx, await tool.execute(args, ctx))
    },
    isReadonlyAction(args) {
      const action = args?.action
      return action === "status" || action === "observe"
    },
    isControlAction(args) {
      const action = args?.action
      return action === "cancel" || action === "send"
    },
  }
}

/** C-5 终态回显表（墓碑 status → 返回 status + note；未列值不入表——不虚构语义）。
 *  文案 = 删除前端侧同表逐字（§12.3 C-5 四态：discarded/cancelled/consumed→done/failed）。 */
const VSC_TERMINAL_ECHO = {
  discarded: { status: "discarded", note: "discarded by the user's Stop — its report will NOT arrive (partial changes stay unmerged/unaudited; re-spawn if the work is still needed)" },
  cancelled: { status: "cancelled", note: "cancelled — its report will NOT arrive (its work was stopped; partial changes stay unmerged/unaudited)" },
  consumed: { status: "done", note: "delivered — the report was injected into the session" },
  failed: { status: "failed", note: "settled with an error — the error report was injected; nothing is pending" },
}

// W13 ④ C-5 终态回显读面（核墓碑单点）——**动态** import：核 `async-settle.mjs` 静态链可达
// `node:sqlite`（scheduler→subagent-async→核 agent 栈——W8 契约②机判），静态引入会破端壳静态闭包；
// 读点 = `vscStatusTerminalEcho`。

/** C-5 终态回显（两池未命中 → 查墓碑；无记录/未列墓碑值照旧 unknown）。核 `status` 单查
 *  未命中返回 unknown-错误串——本函数仅接管该形态（`status` + 带 id + 输出含 unknown）。 */
async function vscStatusTerminalEcho(args, ctx, out) {
  if (args?.action !== "status") return out
  const id = args?.id
  if (id === undefined || id === null || String(id) === "") return out
  if (typeof out !== "string" || !out.includes("unknown async subagent id")) return out
  const { tombstoneOf } = await import("@thincoder/core/agent-tools/async-settle.mjs") // 动态（W8 契约②）
  const t = tombstoneOf(ctx?.agent, id)
  const echo = t ? VSC_TERMINAL_ECHO[t.status] : null
  if (!echo) return out
  return JSON.stringify({ id, role: t.role, status: echo.status, note: echo.note })
}

/**
 * Mode-dependent subagent role schema field (原 `src/agent-tools/subagent.mjs` verbatim 迁入
 * ——W13；CLI setup.mjs parity）。The role enum is mutually exclusive per mode: normal mode
 * advertises "coder", engineering mode advertises "eng-coder". The schema filter is the FIRST
 * line of defense — the model never sees the disabled role as legal; the runtime throws in
 * execute() stay as the hard gate. Returns { role, suffix }: `role` replaces
 * parameters.properties.role wholesale; `suffix` appends to the tool-level description
 * ("" in normal mode).
 */
export function modeRoleField(engineering) {
  return engineering
    ? {
        role: {
          type: "string",
          enum: ["explore", "eng-designer", "eng-coder"],
          description: "The sub-agent role — see the tool description for the role capability matrix. Exact spelling required.",
        },
        suffix: "In engineering mode, use role='eng-coder' for implementation (coder is disabled) and role='eng-designer' for design writing.",
      }
    : {
        role: {
          type: "string",
          enum: ["explore", "plan", "coder"],
          description: "The sub-agent role — see the tool description for the role capability matrix. Exact spelling required.",
        },
        suffix: "",
      }
}
