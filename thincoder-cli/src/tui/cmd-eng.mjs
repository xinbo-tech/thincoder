/** /eng command: toggle engineering mode.
 *  No retired-concept prerequisites (FR11 收正口径 — `docs/core/requirements/PORTABILITY.md:62`):
 *  no methodology file, no docs tree. The **repo-root anchor（git）= E2 既有入口前提**：
 *  非锚 cwd 上 ON = fail-closed 拒翻 + 明示原因、模式保持 OFF（#41 —
 *  `docs/core/design/MANIFEST.md` §2.8 F2/F3；判定面 = 入口决策树单源）。
 *  ctx: { agent, pushLine, pushLabel } */
import { readFileSync, writeFileSync, mkdirSync, renameSync, unlinkSync } from "node:fs"
import { dirname } from "node:path"
import { ansi, C } from "./ansi.mjs"
import { activeSlot, slotPath } from "@thincoder/core/session.mjs"
import { purgeExpiredDesignTokens } from "@thincoder/core/token-ttl.mjs"
import { resolveEngineeringManifest } from "@thincoder/core/manifest.mjs"

import { ENG_OFF_REMINDER } from "@thincoder/core/agent.mjs"

/** Atomic slot write (same shape as session.mjs writeSessionFile — kept local to avoid a
 *  private-import; cmd-advisor's guard toggle shares this helper). */
export function writeSessionFile(p, data) {
  mkdirSync(dirname(p), { recursive: true })
  const tmp = `${p}.tmp`
  writeFileSync(tmp, JSON.stringify(data), "utf8")
  try {
    renameSync(tmp, p)
  } catch {
    try { unlinkSync(p) } catch {}
    try { renameSync(tmp, p) } catch { writeFileSync(p, readFileSync(tmp, "utf8"), "utf8") }
  }
}

export async function handleEngCommand(ctx) {
  const { agent, pushLine, pushLabel } = ctx
  agent.config.agent ??= {}

  // No retired-concept prerequisite check (FR11 收正口径；退场原因见档头注)。ON 方向的门
  // = 入口决策树（下方）；OFF 方向恒放行（F2 表 OFF 行——零 manifest I/O）。
  //
  // #41 先判后翻（MANIFEST.md §2.8 F2/F3 · KD-M1-21）：**ON 方向**先走入口决策树单源
  // （resolveEngineeringManifest——KD-M1-20），判据通过才写态；OFF 方向零改（F2 表 OFF 行）。
  // 拒 ⇒ warn 行 + **零标签**（标签 = 成功回显——拒时零标签防假成功）+ 零副作用
  // （模式未翻 / token 未清 / `_advisorRuns` 未重置 / 提醒未入列 / 槽未写）。
  // 准 ⇒ 缺档格就地建档（writer:'main'）+ `agent.manifest` ← 结果（相位行当回合起活）。
  if (!agent.config.agent.engineering) {
    const r = resolveEngineeringManifest(agent.cwd ?? process.cwd(), { writer: "main" })
    if (!r.ok) {
      pushLine(`Engineering mode not enabled — ${r.message} (mode unchanged)`, C.warn)
      return
    }
    agent.manifest = r.manifest
  }
  agent.config.agent.engineering = !agent.config.agent.engineering
  // §11.2 D-24b: per-review instances die with the mode (fresh convergence cycles
  // on the next toggle).
  agent._advisorRuns = new Map()
  if (!agent.config.agent.engineering) {
    // R16 (2026-09-06 F-R16a): OFF 不清 token——有效 token 跨模式存活（仅 TTL 过期
    // 在三清理时机删：恢复过滤 / 开模式清过期 / spawn 门禁拒时删槽）。
    // OFF must reach the model too (2026-08-25): /auto pushes a reminder on toggle — the
    // mode flip is invisible to the agent otherwise. (ON needs none here: the injector
    // in agent.mjs already announces ON transitions on the next turn.)
    agent._pendingReminders = agent._pendingReminders ?? []
    agent._pendingReminders.push(ENG_OFF_REMINDER)
  }
  // 开工程模式（真实 OFF→ON 转换）→ 清过期 token（有效保留——用户裁定"打开工程
  // 模式时应该清理"——F-R16b ②——与 eng tool enter 同语义）。
  const clearedExpired = agent.config.agent.engineering ? purgeExpiredDesignTokens(agent) : 0
  await persistEngineering(agent)
  pushLabel("❯ Eng", ansi.bold + C.tool)
  pushLine(`Engineering mode: ${agent.config.agent.engineering ? "ON" : "OFF"} (session)`, C.tool)
  if (agent.config.agent.engineering) {
    pushLine(`  → design-before-code enforced (design review + user approval before code)`, C.dim)
    if (clearedExpired > 0) {
      pushLine(`  → cleared ${clearedExpired} expired design token${clearedExpired === 1 ? "" : "s"}; valid tokens from prior reviews stay usable`, C.dim)
    }
  }
}

/**
 * Slot-only persistence (2026-09-08 — ENG-SESSION-PROVIDER-CLEANUP D1.1): the flipped flag
 * goes into the CURRENT session slot only — the slot is the sole authority (shared with
 * VS Code, per-session; config.json is just the initial default, no mirror write).
 * The in-memory agent.config.agent.engineering (already flipped) stays the live authority for
 * this process; saveSession also round-trips it on every turn-end write.
 */
async function persistEngineering(agent) {
  const slot = activeSlot(agent.cwd)
  try {
    const p = slotPath(agent.cwd, slot)
    const data = JSON.parse(readFileSync(p, "utf8"))
    if (data && typeof data === "object" && Array.isArray(data.history)) {
      data.engineering = agent.config.agent.engineering
      writeSessionFile(p, data)
    }
  } catch { /* slot missing/unreadable — in-memory flag already flipped; saveSession persists at turn end */ }
}
