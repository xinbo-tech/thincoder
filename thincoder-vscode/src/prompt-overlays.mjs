/**
 * prompt-overlays.mjs — prompt slot constants + the scenario→slot assembly (PROMPT-SYSTEM
 * 施工② G1+G2, 2026-09-10). Slot constants are loaded ONCE (byte-stable, module scope);
 * assemblePrompt composes them per PROMPT-SYSTEM.md §3.2 装配矩阵 (D1 内联表——设计锚).
 * VSC mirror of thincoder-cli/src/prompt-overlays.mjs (多实现面纪律——语义同源、原文自持).
 *
 * Slot model (PROMPT-SYSTEM.md §1/§2): persona → common → discipline → [4] other
 * (AGENTS/skills ride the existing tail logic). explore/coder/plan reuse PERSONA_NORMAL
 * as their persona slot (蓝图 §3.1 同槽位复用——变体差异归人格层覆写; design D1 G1 note).
 */

import { readFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))

function loadSlot(name) {
  try { return readFileSync(join(__dirname, "prompts", name), "utf8") } catch { return "" }
}

// ── G1 槽位内容表（文件名 → 内容常量）──
const SLOT_CONTENTS = {
  "persona-engineering.md": loadSlot("persona-engineering.md"),
  "persona-normal.md": loadSlot("persona-normal.md"),
  "persona-eng-coder.md": loadSlot("persona-eng-coder.md"),
  "persona-eng-designer.md": loadSlot("persona-eng-designer.md"),
  "persona-explore.md": loadSlot("persona-explore.md"),
  "persona-coder.md": loadSlot("persona-coder.md"),
  "persona-plan.md": loadSlot("persona-plan.md"),
  "common.md": loadSlot("common.md"),
  "discipline-engineering.md": loadSlot("discipline-engineering.md"),
  "discipline-normal.md": loadSlot("discipline-normal.md"),
}

// ── G1 六件导出（评审 #1 计数口径：人格 2 + 公共 1 + 纪律 2 + consult 自含基底；
//    persona-{role} 三件由 SLOT_CONTENTS 承载、不设独立常量导出——装配表唯一消费面）──
export const PERSONA_ENGINEERING = SLOT_CONTENTS["persona-engineering.md"]
export const PERSONA_NORMAL = SLOT_CONTENTS["persona-normal.md"]
export const COMMON = SLOT_CONTENTS["common.md"]
export const DISCIPLINE_ENGINEERING = SLOT_CONTENTS["discipline-engineering.md"]
export const DISCIPLINE_NORMAL = SLOT_CONTENTS["discipline-normal.md"]
export const CONSULT_BASE = loadSlot("consult-base.md")

// ── D1 场景→槽位文件表（PROMPT-SYSTEM.md §3.2 装配矩阵内联——①②并行契约锚：
//    槽文件路径字符串以本表为唯一权威——设计 §1.1 红线。explore/coder/plan 行 =
//    persona-{role}（蓝图 §3.2 1:1——施工①已落地三份角色人格文件；advisor round1
//    修正：此前误按 G1 括注映射 persona-normal 使三文件永不被消费）。──
export const SCENARIO_SLOT_FILES = {
  engineering: ["persona-engineering.md", "common.md", "discipline-engineering.md"],
  normal: ["persona-normal.md", "common.md", "discipline-normal.md"],
  "eng-coder": ["persona-eng-coder.md", "common.md", "discipline-engineering.md"],
  "eng-designer": ["persona-eng-designer.md", "common.md", "discipline-engineering.md"],
  explore: ["persona-explore.md", "common.md", "discipline-normal.md"],
  coder: ["persona-coder.md", "common.md", "discipline-normal.md"],
  plan: ["persona-plan.md", "common.md", "discipline-normal.md"],
  consult: null, // §3.3 特殊模块——consult-base.md 自含基底，不入主装配链（CONSULT_BASE 直出）
}

// ── D2 警告文案（走既有 setup 警告通道 = history 注入——不新增机制；common 同款）──
export function slotWarning(fileName) {
  return `[System reminder: prompt slot file ${fileName} missing — this slot is SKIPPED, no fallback from another slot (层间隔离). Prompt content may be degraded; check the prompts directory.]`
}

/**
 * G2: the single prompt-assembly function — table-driven (D1), fixed order
 * persona → common → discipline (§3.1 四槽位固定序；[4] AGENTS/skills 由既有尾部
 * 逻辑承担). A missing slot file is SKIPPED with a prominent warning (蓝图 §3.4 降级链);
 * AGENTS.md missing = silent skip in the caller's existing tail logic. Byte-stable
 * per scenario (D3): fixed slot contents + fixed order — no timestamps here.
 */
export function assemblePrompt(scenario) {
  const files = SCENARIO_SLOT_FILES[scenario]
  if (!files) return { prompt: CONSULT_BASE, warnings: [] }
  const parts = []
  const warnings = []
  for (const file of files) {
    const content = SLOT_CONTENTS[file]
    if (content) parts.push(content)
    else warnings.push(slotWarning(file))
  }
  return { prompt: parts.join("\n\n"), warnings }
}
