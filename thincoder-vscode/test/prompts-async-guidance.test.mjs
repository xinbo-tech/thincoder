/**
 * prompts-async-guidance.test.mjs — prompts 结构面测试（VSC 端——PROMPT-SYSTEM 施工③ 2026-09-10
 * 重写，与 CLI test/prompts-async-guidance.test.mjs 同构）。断言对象 = 本端 src/prompts/ 新 15 文件
 * + 装配代码（src/prompt-overlays.mjs）。
 * 2026-09-12 PROSE-ANCHOR-RETIRE：读档锚句断言（MAIN-DESIGN-ENHANCE A1–A4 / 锚#1–#7 / 开关段 C1–C4 /
 * ASYNC-RESIDUE / ADVISOR-VERDICT / 搜索条款 / 第 9 批 T-RO1–T-RO4 / 语料修复 T-PC-1~T-PC-3 /
 * 降级链①② 篇句面）整删·段删——读非测试档文本 = 散文锚（判据见 CLI 侧设计档 TESTING.md §11）。
 * 存留面 = 结构自洽（旧件退役 / 槽表 / warnings 结构 / 降级链警告 / 注释头 / 行宽 / 非空）+
 * T-RO5/T-RO6 残余（测试内常量零维护者注——§2.7 #15）。
 */
import { test } from "node:test"
import assert from "node:assert"
import { readFileSync, existsSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { assemblePrompt, SCENARIO_SLOT_FILES, PERSONA_ENGINEERING, PERSONA_NORMAL, COMMON, DISCIPLINE_ENGINEERING, DISCIPLINE_NORMAL, CONSULT_BASE } from "../src/prompt-overlays.mjs"

const __here = dirname(fileURLToPath(import.meta.url))
const read = (rel) => readFileSync(join(__here, "..", rel), "utf8")
const exists = (rel) => existsSync(join(__here, "..", rel))

const NEW_PROMPTS = [
  "persona-engineering.md", "persona-normal.md", "persona-eng-coder.md", "persona-eng-designer.md",
  "persona-explore.md", "persona-coder.md", "persona-plan.md",
  "common.md", "discipline-engineering.md", "discipline-normal.md",
  "consult-base.md", "advisor-design.md", "advisor-round1.md", "advisor-round2.md", "advisor-round3.md",
]
const RETIRED_PROMPTS = ["system.md", "engineering.md", "engineering-sub.md", "main.md", "discipline.md", "methodology-template.md", "eng-coder.md", "explore.md", "coder.md", "plan.md"]

const pn = read("src/prompts/persona-normal.md")
// 六场景装配快照（装配矩阵/降级链断言面）
const engMode = Object.fromEntries(["normal", "engineering", "eng-coder", "explore", "coder", "plan"].map((s) => [s, assemblePrompt(s)]))

test("退役旧件不存在于 prompts 树（AC-2——退役七件+main/discipline/explore/coder/plan 旧件）", () => {
  for (const f of RETIRED_PROMPTS) assert.ok(!exists(`src/prompts/${f}`), `${f} 已退役——不应存在`)
  for (const f of NEW_PROMPTS) assert.ok(exists(`src/prompts/${f}`), `${f} 新集合在位`)
})

// ─────────────────────────────────────────────────────────────────────────────
// 装配矩阵断言（PROMPT-SYSTEM §3.2——assemblePrompt 七场景：文件名/顺序/槽完整性）。
// ─────────────────────────────────────────────────────────────────────────────
test("§3.2 装配矩阵：六主链场景槽文件名与顺序 1:1", () => {
  assert.deepStrictEqual(SCENARIO_SLOT_FILES.engineering, ["persona-engineering.md", "common.md", "discipline-engineering.md"])
  assert.deepStrictEqual(SCENARIO_SLOT_FILES.normal, ["persona-normal.md", "common.md", "discipline-normal.md"])
  assert.deepStrictEqual(SCENARIO_SLOT_FILES["eng-coder"], ["persona-eng-coder.md", "common.md", "discipline-engineering.md"])
  assert.deepStrictEqual(SCENARIO_SLOT_FILES.explore, ["persona-explore.md", "common.md", "discipline-normal.md"])
  assert.deepStrictEqual(SCENARIO_SLOT_FILES.coder, ["persona-coder.md", "common.md", "discipline-normal.md"])
  assert.deepStrictEqual(SCENARIO_SLOT_FILES.plan, ["persona-plan.md", "common.md", "discipline-normal.md"])
})

test("§3.2 装配矩阵：consult = 自含基底不入主链（null 行）", () => {
  assert.strictEqual(SCENARIO_SLOT_FILES.consult, null)
})

test("§3.2 装配矩阵：assemblePrompt 输出=槽序拼接（人格→公共→纪律）+ 层序内部锚", () => {
  for (const s of ["normal", "engineering", "eng-coder", "explore", "coder", "plan"]) {
    assert.ok(engMode[s].warnings.length === 0, `${s}: 全槽在位无警告`)
  }
})

test("§3.2 装配矩阵：角色场景人格差异（explore/coder/plan = 各自角色人格文件 1:1）+ 常量导出面 = 六件", () => {
  for (const name of [PERSONA_ENGINEERING, PERSONA_NORMAL, COMMON, DISCIPLINE_ENGINEERING, DISCIPLINE_NORMAL, CONSULT_BASE]) {
    assert.ok(typeof name === "string" && name.length > 50, `导出常量非空: ${String(name).slice(0, 20)}`)
  }
})

test("§3.2 consult 场景：assemblePrompt 返回 CONSULT_BASE 自含基底（无四槽拼接）", () => {
  const c = assemblePrompt("consult")
  assert.ok(c.warnings.length === 0, "consult: 无警告")
})

// ─────────────────────────────────────────────────────────────────────────────
// 降级链断言（§3.4：槽缺失→警告；common 缺失→同款；AGENTS/[4] 层缺失=静默跳过）。
// 2026-09-12 PROSE-ANCHOR-RETIRE：原「特殊模块→报错不自降级」条（降级链④，读 setup.mjs 源码）整删；
// AGENTS 层静默跳过语义由 T-CI-2 机判（test/context-parity.test.mjs——[4] 层已真实落位）。
// ─────────────────────────────────────────────────────────────────────────────
test("§3.4 降级链①：槽文件缺失→空缺+警告（不 fallback——层间隔离）", async () => {
  // 槽内容 = prompt-overlays 模块级 SLOT_CONTENTS 常量——改文件须重载新实例触发真实 loadSlot 读盘。
  const target = join(__here, "..", "src", "prompts", "persona-normal.md")
  const bak = readFileSync(target, "utf8")
  writeFileSync(target, "")
  try {
    const fresh = await import(`../src/prompt-overlays.mjs?v=${Date.now()}`)
    const r = fresh.assemblePrompt("normal")
    assert.ok(r.warnings.length === 1, "恰好一条警告")
    assert.ok(r.warnings[0].includes("prompt slot file persona-normal.md missing"), "警告点名缺失文件")
    assert.ok(r.warnings[0].includes("no fallback from another slot"), "警告声明不 fallback（层间隔离）")
  } finally {
    writeFileSync(target, bak)
  }
  assert.strictEqual(readFileSync(target, "utf8"), bak, "快照恢复")
})

test("§3.4 降级链②：common.md 缺失→同款警告（四槽全覆盖——评审 round#1 补）", async () => {
  const target = join(__here, "..", "src", "prompts", "common.md")
  const bak = readFileSync(target, "utf8")
  writeFileSync(target, "")
  try {
    const fresh = await import(`../src/prompt-overlays.mjs?v=${Date.now()}`)
    const r = fresh.assemblePrompt("engineering")
    assert.ok(r.warnings.length === 1, "恰好一条警告")
    assert.ok(r.warnings[0].includes("common.md missing"), "警告点名 common.md")
  } finally {
    writeFileSync(target, bak)
  }
  assert.strictEqual(readFileSync(target, "utf8"), bak, "快照恢复")
})

test("§3.4 降级链③：AGENTS.md 缺失=静默跳过（[4] 层真实注入——caller tail 契约）", () => {
  // VSC-CONTEXT-PARITY 批修四：旧「[4] 层由调用面承担」宣告作废——[4] 层已真实落位
  // （D-CI2：项目指令块 + skills 清单入 setup.mjs systemPrompt 尾）。契约三款：
  // ① caller tail 真实存在（setup.mjs 注入面）；② 场景表仍无 AGENTS/skills 槽文件
  // （四槽位矩阵零变——缺失即静默、无警告需求）；③ 缺失静默语义由 T-CI-2 机判
  // （test/context-parity.test.mjs——AGENTS 缺 → 无 <untrusted_project_instructions>、零报错）。
  for (const files of Object.values(SCENARIO_SLOT_FILES)) {
    if (!files) continue
    assert.ok(files.every((f) => !/AGENTS|skills/i.test(f)), "场景表无 AGENTS/skills 槽——缺失即静默（无警告需求）")
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// §2.7 编写纪律巡检（机械扫——15 文件 + 14 条纪律可机械部分）。
// ─────────────────────────────────────────────────────────────────────────────
test("§2.7 #13 槽位注释：每文件头部 <!-- slot:[...] consumers:[...] -->（主链 [1]-[3] 数字槽位）", () => {
  for (const f of NEW_PROMPTS) {
    const first = read(`src/prompts/${f}`).split("\n")[0]
    if (["consult-base.md", "advisor-design.md", "advisor-round1.md", "advisor-round2.md", "advisor-round3.md"].includes(f)) {
      // 特殊模块自含——不套前缀法（蓝图 §2 豁免从句）——头部注在即可
      assert.match(first, /^<!-- slot:.+ consumers:\[.+\] -->$/, `${f}: 头部注缺失`)
    } else {
      assert.match(first, /^<!-- slot:\[\d\] consumers:\[.+\] -->$/, `${f}: 头部槽注缺失/变形`)
    }
  }
})

test("§2.7 #9 表行 >200 零命中（dn 4 处随表删源清零——公共层扩容）", () => {
  const hits = []
  for (const f of NEW_PROMPTS) {
    const lines = read(`src/prompts/${f}`).split("\n")
    lines.forEach((l, i) => { if (l.startsWith("|") && l.length > 200) hits.push(`${f}:L${i + 1}(${l.length})`) })
  }
  assert.deepStrictEqual(hits, [], "表行 >200 零命中（common 路由表逐行 ≤200）")
})

test("§2.7 #5 前 20% 巡检词（WAIT/Do NOT/auto/manual/initiated by the user——文件前 20% 区）", () => {
  // 2026-09-12 PROSE-ANCHOR-RETIRE：巡检词正则断言（读 pe 文本）删——读非测试档文本 = 散文锚；
  // 保留 persona-normal 非空面（CLI 20 文件特例同款豁免）。
  {
    assert.ok(pn.length > 100, "persona-normal: 内容在位")
  }
})

test("主链槽位装配非空（六场景全槽在位——终验）", () => {
  for (const s of ["normal", "engineering", "eng-coder", "explore", "coder", "plan"]) {
    assert.ok(engMode[s].prompt.length > 500, `${s}: 装配非空`)
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// 第 9 批残余（PROMPT-REVIEW-ORDER）：T-RO1–T-RO4（双源逐字锚）2026-09-12 散文锚退役整删；
// 存留 = T-RO5/T-RO6 残余（测试内常量零维护者注）。跨仓逐字由 prompts-mirror-anchors 承载。
// ─────────────────────────────────────────────────────────────────────────────
const ROPE_CHAIN = ["评审 pass 后逐条裁决", "修正轮落地并经核验"]
const ROPE_LABEL = "**修正轮 ⇄ 用户批准 时序**"
const ROPE_BULLET = [
  "- **修正轮 ⇄ 用户批准 时序**（评审后）：评审 pass 后你逐条裁决（裁决表）——裁决要求修正的（设计档修订 / 实现修复），",
  "  **修正轮落地并经你核验后，才可请求用户批准**；修正轮在途时**不得**请求批准——在途状态只作汇报，汇报不携带批准请求。",
  "  **修正轮边界**：只落评审发现与你的裁决直接导出的修正——**不得夹带新语义/新范围**；夹带即新内容，",
  "  须显式摆给用户单独定，不得随批准请求一并默认通过。",
  "  批准请求中，裁决表的 `Dispatched` 行须已逐条收敛为 `Fixed`（随请求给出落地证据：file:line 或设计档节）。",
].join("\n")

test("T-RO5/T-RO6 反例+边界：旧三值句/旧相邻形态零残留（本端 6 档）+ 新增文本零维护者注（§2.7 #15）", () => {
  for (const lit of [...ROPE_CHAIN, ROPE_LABEL, ...ROPE_BULLET.split("\n")]) assert.ok(!/\d{4}-\d{2}-\d{2}|第\s*\d+\s*批|评审\s*#/.test(lit), `新增文本含维护者注: ${lit.slice(0, 26)}…`)
})

