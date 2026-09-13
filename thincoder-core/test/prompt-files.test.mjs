/**
 * prompt-files.test.mjs — 核内单一提示词解析面（CORE-UNIFICATION D-C13 · S0a 建 · S1 补齐）。
 * 行为面：核包提示词面档名集合（S1 全量）· 缺档语义按调用方保留（契约 9）·
 * 用户已裁两条融合的落地（#44 取「the document」· #47 标题并集 + 跨端注入位）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { readdirSync } from "node:fs"
import {
  PROMPTS_DIR,
  TOOL_DOCS_DIR,
  loadAdvisorPrompt,
  loadConsultBase,
  loadSlot,
  loadToolDoc,
} from "../prompt-files.mjs"

/** S1 核内槽位提示词（15）= 全量（S0a 席位 12 + S1 补齐 3）。 */
const SLOT_PROMPTS = [
  "advisor-design.md",
  "advisor-round1.md",
  "advisor-round2.md",
  "advisor-round3.md",
  "common.md",
  "consult-base.md",
  "discipline-engineering.md",
  "discipline-normal.md",
  "persona-coder.md",
  "persona-eng-coder.md",
  "persona-eng-designer.md",
  "persona-engineering.md",
  "persona-explore.md",
  "persona-normal.md",
  "persona-plan.md",
]

/** S1 核内工具描述（25）= 全量（S0a 席位 20 + S1 补齐 5）。 */
const TOOL_DOCS = [
  "apply_patch",
  "bash",
  "checklist",
  "delete",
  "edit",
  "execute",
  "fetch",
  "file_ops",
  "get_current_time",
  "git",
  "glob",
  "grep",
  "hashline_edit",
  "insert_after",
  "lint",
  "ls",
  "lsp",
  "process",
  "question",
  "read",
  "read_image",
  "tree",
  "wait_for",
  "websearch",
  "write",
]

test("core prompts/ holds exactly the full slot set (15)", () => {
  assert.deepEqual(readdirSync(PROMPTS_DIR).sort(), [...SLOT_PROMPTS].sort())
})

test("core tool-docs/ holds exactly the full tool-description set (25)", () => {
  assert.deepEqual(readdirSync(TOOL_DOCS_DIR).sort(), TOOL_DOCS.map((n) => `${n}.md`).sort())
})

test("slot loader is silent on a missing file (contract 9: 静默空串)", () => {
  assert.equal(loadSlot("no-such-slot.md"), "")
})

test("advisor loader throws on a missing file (contract 9: 抛错)", () => {
  assert.throws(() => loadAdvisorPrompt("no-such-advisor.md"), /missing from the installation/)
})

test("tool-doc loader throws on a missing file (contract 9: 抛错)", () => {
  assert.throws(() => loadToolDoc("no-such-tool"))
})

test("present files load their content", () => {
  assert.ok(loadSlot("common.md").length > 0)
  assert.ok(loadAdvisorPrompt("advisor-round1.md").length > 0)
  assert.ok(loadToolDoc("read").length > 0)
})

test("consult base loads through the slot chain", () => {
  assert.ok(loadConsultBase().length > 0)
})

test("user ruling #44 — advisor-design keeps the general wording 'the document'", () => {
  const s = loadAdvisorPrompt("advisor-design.md")
  assert.ok(s.includes("the document that already owns its topic"))
  assert.ok(!s.includes("the design document that already owns its topic"))
})

test("user ruling #47 — persona-engineering carries the union title + the cross-end injection slot", () => {
  const s = loadSlot("persona-engineering.md")
  assert.ok(s.includes("## 与 eng-designer / eng-coder 的分工界面（设计写作面归 eng-designer）"))
  assert.ok(s.includes("AGENT-LOOP{{inject:agent-loop-pointer}}"))
  // 契约 10：核档不得把某一端的指针形态写死
  assert.ok(!s.includes("本端交付协议节 = §8"))
})
