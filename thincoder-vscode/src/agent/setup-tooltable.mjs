/**
 * agent/setup-tooltable.mjs — 装配层缝接线面（2026-09-16 · 批 7 `docs/vsc/design/VSC-DEBT.md`
 * §3.3 档一：setup.mjs 654 > 500 硬限 ⇒ 结构拆分）。纯结构搬移（零语义改动）——段序与原文
 * 一致：① W9 batch 记账缝注入 · ② W14 三缝接线（skill loader / eng mirror / verify
 * 诊断段）。
 * 2026-09-21（`docs/core/design/MANIFEST.md` §2.3 行 16 / 29 拆入面）：`setup.mjs` 装配段
 * （家族段装配 / MCP 连接 / 基础集 · 全表 · `toolByName` · `toolSchemas`）纯结构搬移迁入——
 * 新导出 `buildToolTable`（段内四条动态 import 原样动态——W8 契约②）；2026-09-29（#365 按同档
 * 拆分注 行 29 落形）：装配段 + 池装配装饰与子代理面（`buildToolTable` / `withPool` /
 * `vscSubagentFace` / 终态回显族 / `modeRoleField`）再拆出邻档 `tool-table.mjs`——缝 = re-export
 * （KD-6）：`setup.mjs` 继续自本档取四名 ⇒ 消费档零改。
 * W8 契约②（`test/engine-floor-guard.test.mjs:129`——端壳静态闭包零 `node:sqlite`）：本档静态边
 * = setup.mjs 既有静态边之子集；核 `agent-tools/skill.mjs` / `eng.mjs` 两类面仍走**动态** import()
 * （见 `wireAgentToolSeams`）；`vscStatusTerminalEcho` 同法（住 `tool-table.mjs`）。
 */
import * as vscode from "vscode"
import { resolve } from "node:path"
import { configureBatchSegment } from "@thincoder/core/agent-tools/batch-segment.mjs" // 叶子（node:fs/node:path）——静态面安全
import { configureVerifyDiagnostics } from "@thincoder/core/agent-tools/verify.mjs" // 叶子面（闭包 4 档零 node:sqlite）——静态面安全
import { loadSkills, readSkill } from "../extension/skills.mjs"
import { setSlotEngineering } from "../extension/session-slot-write.mjs"

// ─── W9（2026-09-15）：batch 记账面注入（核缝 #84 —— `configureBatchSegment`）──────────
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
// 工程模式翻转后的槽写（**会话槽唯一权威**，无 config.json 镜像；迁自删除档
// `src/agent-tools/eng.mjs:92-105`）；③ `configureVerifyDiagnostics` —— 编辑器诊断
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
      } catch { /* slot unwritable — the slot is the only persistence face (no config mirror) */ }
    },
  })
  // 旗标在两处 configure* 之后置位（评审修正）：载入中途 reject 时下一轮仍会补接，
  // 不留下「旗标已置、两缝未接」的静默降级态。
  agentToolSeamsWired = true
}

// 缝（KD-6）：工具表装配装饰面出档 `tool-table.mjs`（2026-09-29 · #365 拆分落形——`docs/core/design/MANIFEST.md`
// §2.3 拆分注 行 29：行 16 拆入的工具表段再拆出邻档，纯结构搬移零语义）——既有导出名本合同档再导出
// ⇒ 消费档（`setup.mjs`）零改。
export { buildToolTable, modeRoleField, vscSubagentFace, withPool } from "./tool-table.mjs"
