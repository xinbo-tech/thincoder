/**
 * prompt-files.test.mjs — 核内单一提示词解析面（CORE-UNIFICATION D-C13 · S0a 建 · S1 补齐）。
 * 行为面：核包提示词面档名集合（S1 全量）· 缺档语义按调用方保留（契约 9）·
 * 用户已裁两条融合的落地（#44 取「the document」· #47 标题并集 + 跨端注入位）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import {
  PROMPTS_DIR,
  TOOL_DOCS_DIR,
  applyPromptInjections,
  configurePromptInjections,
  loadAdvisorPrompt,
  loadConsultBase,
  loadSlot,
  loadToolDoc,
  resetPromptInjections,
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
  assert.ok(s.includes("in-child advisor code review, {{inject:agent-loop-ptr-engineering-delivery}})"))
  // 契约 10：核档不得把某一端的指针形态写死
  assert.ok(!s.includes("本端交付协议节 = §8"))
})

// ─── §2.13.7⑥ 锚名集合与指针族（核内可机判——S2 落位）────────────────────────────

/** 核内全部注入锚（`{{inject:<name>}}`——合法文法面）逐名扫出。 */
function scanAnchorNames() {
  const names = []
  for (const dir of [PROMPTS_DIR, TOOL_DOCS_DIR]) {
    for (const f of readdirSync(dir)) {
      const text = readFileSync(join(dir, f), "utf8")
      for (const m of text.matchAll(/\{\{inject:([a-z0-9-]+)\}\}/g)) names.push(m[1])
    }
  }
  return names
}

test("§2.13.7⑥ 锚名去重集合 = 13 · 旧名单锚零命中 · agent-loop-ptr-* 恰 5 名 / 5 处", () => {
  const names = scanAnchorNames()
  assert.equal(new Set(names).size, 13, "锚名去重集合 = 13")
  assert.equal(names.filter((n) => n === "agent-loop-pointer").length, 0, "旧名 agent-loop-pointer 零命中")
  const ptr = names.filter((n) => n.startsWith("agent-loop-ptr-"))
  assert.equal(ptr.length, 5, "agent-loop-ptr-* 恰 5 处")
  assert.deepEqual([...new Set(ptr)].sort(), [
    "agent-loop-ptr-async-note",
    "agent-loop-ptr-async-spawn",
    "agent-loop-ptr-eng-coder-delivery",
    "agent-loop-ptr-engineering-delivery",
    "agent-loop-ptr-escalate",
  ], "agent-loop-ptr-* 恰 5 名")
})

// ─── U2 核内笔（§2.6.3（六））：advisor 加载面走核内单一解析面（结构机检·fail-closed）──

test("U2 核内笔：advisor.mjs 零私持加载器 / 四常量经 loadAdvisorPrompt（契约 8 / D-C13）", () => {
  const src = readFileSync(new URL("../advisor.mjs", import.meta.url), "utf8")
  assert.ok(!src.includes("function loadPrompt"), "私持 loadPrompt 已删")
  assert.ok(!src.includes("__dirname"), "自持路径运算已删（调用方不做路径运算——契约 8）")
  assert.ok(!/readFileSync\s*\(/.test(src), "无自持 readFileSync")
  const uses = (src.match(/loadAdvisorPrompt\(/g) ?? []).length
  assert.ok(uses >= 4, `四常量改经 loadAdvisorPrompt（实际命中 ${uses}）`)
})

// ─── U0 锚替换原语（CORE-UNIFICATION §2.13.8「核内缝」——三态 + 单遍 + 多余键）──────────

test("U0 原语·未配置 ⇒ 恒等（现行行为零变——零替换）", () => {
  resetPromptInjections()
  const text = "docs/{{inject:doc-map-path}}README.md — 未配置时原样过"
  assert.equal(applyPromptInjections(text), text)
  assert.equal(applyPromptInjections(""), "")
})

test("U0 原语·已配置 · 锚命中 ⇒ 表值替换（含空串 = 显式「本端为空」）", () => {
  try {
    configurePromptInjections({ "doc-map-path": "zh/", "finish-slot": "" })
    assert.equal(applyPromptInjections("docs/{{inject:doc-map-path}}README.md"), "docs/zh/README.md")
    assert.equal(applyPromptInjections("A\n{{inject:finish-slot}}\nB"), "A\n\nB", "空串值 = 删锚、不留字面")
  } finally { resetPromptInjections() }
})

test("U0 原语·已配置 · 缺键 ⇒ 抛错（fail-loud——消息含锚名）", () => {
  try {
    configurePromptInjections({ "doc-map-path": "zh/" })
    assert.throws(() => applyPromptInjections("x {{inject:no-such-anchor}} y"), /no-such-anchor/)
  } finally { resetPromptInjections() }
})

test("U0 原语·单遍替换（替换值不再展开）· 表值逐字落（不解释 $ 序列）· 多余键 no-op · configure(null) 撤销", () => {
  try {
    configurePromptInjections({ a: "{{inject:b}}", b: "B", money: "$& $1 $' literal", "unused-key": "never-read" })
    assert.equal(applyPromptInjections("{{inject:a}}"), "{{inject:b}}", "单遍：替换值含锚字面时不二次展开")
    assert.equal(applyPromptInjections("{{inject:money}}"), "$& $1 $' literal", "表值逐字替换（非回调式 replace 会曲解 $ 序列）")
    assert.equal(applyPromptInjections("no anchors here"), "no anchors here", "多余键不校验（no-op）")
    configurePromptInjections(null)
    assert.equal(applyPromptInjections("{{inject:a}}"), "{{inject:a}}", "撤销 ⇒ 回未配置态（恒等）")
  } finally { resetPromptInjections() }
})
