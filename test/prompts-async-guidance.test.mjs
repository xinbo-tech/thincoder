/**
 * prompts-async-guidance.test.mjs — prompts 内容锚测试（VSC 端——PROMPT-SYSTEM 施工③ 2026-09-10
 * 重写，与 CLI test/prompts-async-guidance.test.mjs 同构）。断言对象 = 本端 src/prompts/ 新 15 文件
 * （persona-*×6 / common / discipline-*×2 / 特殊×5）+ 装配代码（src/prompt-overlays.mjs）。
 * 旧 10 文件（system/engineering/engineering-sub/main/discipline/methodology-template 等）已退役——
 * 锚句随迁新文件（PROMPT-IMPL-1-TEXT §2.3），本文件按新宿主重写断言；退役态零残留也在此对账
 * （红线：变更史档叙述豁免）。各端独立断言自身文本（多实现面纪律——不做 byte 硬一致）。
 *
 * 断言形态（权威分类 = PROMPT-ATTENTION-RESTRUCTURE 阶段 D）：
 *   命令型 → 保逐字整句（A2/A4、核心纪律句族）；列举型 → 子条级关键子串（A1/A3、需求池三句）。
 * 承载批次（各批锚在本文件各节——fail-when-unchanged）：
 *   - AGENT-LOOP §7.7/§7.7.1 异步纪律 / ADVISOR-VERDICT-TEMPLATE L50 / MAIN-DESIGN-ENHANCE A1-A4
 *   - ENGINEERING-MODE §2.9 锚#1-#7 / PROMPT-ATTENTION 开关段 C1-C4
 *   - PROMPT-REVIEW-ORDER 第 9 批（Action 四值 + 修正轮 ⇄ 用户批准 时序——ADVISOR-CONVERGENCE §13）
 *   - PROMPT-SYSTEM §2.7 编写纪律巡检 / §3.2 装配矩阵 / §3.4 降级链
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

const pe = read("src/prompts/persona-engineering.md")
const pn = read("src/prompts/persona-normal.md")
const de = read("src/prompts/discipline-engineering.md")
const dn = read("src/prompts/discipline-normal.md")
const common = read("src/prompts/common.md")
const SQ_LITERAL = "- **提交即走——排队是机制的职责**：spawn 一律带 `files`/`dependsOn` 后**直接提交**——域冲突由调度器排队（返回 `queued` + position）、并发池满由池排队；**不手工记队列、不逐档放行、不因冲突/池满而推迟提交**。父侧只读状态（status/observe），不模拟调度器。"
// 六场景装配快照（装配矩阵/降级链断言面）
const engMode = Object.fromEntries(["normal", "engineering", "eng-coder", "explore", "coder", "plan"].map((s) => [s, assemblePrompt(s)]))

test("退役旧件不存在于 prompts 树（AC-2——退役七件+main/discipline/explore/coder/plan 旧件）", () => {
  for (const f of RETIRED_PROMPTS) assert.ok(!exists(`src/prompts/${f}`), `${f} 已退役——不应存在`)
  for (const f of NEW_PROMPTS) assert.ok(exists(`src/prompts/${f}`), `${f} 新集合在位`)
})

// ─────────────────────────────────────────────────────────────────────────────
// MAIN-DESIGN-ENHANCE A1-A4（§2.9 锚#8——字节源档在 CLI 仓 docs/design/；本端 = prompts 驻留断言）。
// 形态分类（阶段 D）：A2/A4 命令型保逐字；A1/A3 列举型子条级子串。
// ─────────────────────────────────────────────────────────────────────────────
test("MAIN-DESIGN-ENHANCE A1 勘察 checklist 引句+子条子串驻留（①-⑤——列举型）", () => {
  assert.ok(de.includes("设计启动前先跑**勘察 checklist**"), "A1 引句缺失")
  for (const sub of ["① `doc_search` 定位所属设计文档", "② 读既有实现与先例", "③ 核测试面", "④ 核双端对位面", "⑤ 广度勘察委派 explore 子代理"]) {
    assert.ok(de.includes(sub), `A1 子条缺失: ${sub}`)
  }
})

test("MAIN-DESIGN-ENHANCE A2 方案对比逐字驻留 discipline-engineering（命令型保逐字——改写版）", () => {
  assert.ok(de.includes("设计层 MUST 含「方案选型对比」子节"), "A2 改写版主句缺失")
  assert.ok(de.includes("用下列模板（判据来自需求层——含非功能硬指标"), "A2 模板引语缺失")
  assert.ok(de.includes("单一候选：显式声明「单方案——无对比」即豁免"), "A2 豁免句缺失")
})

test("MAIN-DESIGN-ENHANCE A3 评审前预检引句+子条子串驻留（列举型）", () => {
  assert.ok(de.includes("评审前预检"), "A3 引句缺失")
  for (const sub of ["① 需求三层具体到可设计", "② 受影响文件全清单", "③ 验收标准逐条回指需求", "④ UI/交互决策全落档", "⑤ 方案对比已做"]) {
    assert.ok(de.includes(sub), `A3 子条缺失: ${sub}`)
  }
})

test("MAIN-DESIGN-ENHANCE A4 实践沉淀逐字驻留 discipline-engineering（命令型——METHODOLOGY 退役改写版）", () => {
  assert.ok(de.includes("好实践 → 落入板块设计文档/反例档案"), "A4 改写版句缺失")
  assert.ok(de.includes("决策当天落档"), "A4 配套句缺失")
})

// ─────────────────────────────────────────────────────────────────────────────
// ENGINEERING-MODE §2.9 逐字锚 #1-#7（锚句字节源 = prompts 落地文本本身——随迁后 = 新宿主）。
// ─────────────────────────────────────────────────────────────────────────────
test("锚#1 零裁量句驻留 discipline-engineering（逐字 fail-when-unchanged）", () => {
  assert.ok(de.includes("Task sizing is NOT your call"), "锚#1 首句缺失")
  assert.ok(de.includes(`"The task is too small / it is just a tweak" is never a reason to skip or compress a step`), "锚#1 引用句缺失")
  assert.ok(de.includes("the answer is always the full flow"), "锚#1 收束句缺失")
})

test("锚#2 需求池三句驻留 discipline-engineering（关键子串——原子串形态）", () => {
  assert.ok(de.includes("Requirement Pool」group first; design does not start until the user says start this batch (or marks the point urgent — fast lane)."), "池句 1（Pool routing）缺失")
  assert.ok(de.includes("same board ≥2 or pool-wide ≥3 requirement points: remind once that batch design can start"), "池句 2（Threshold reminder）缺失")
  assert.ok(de.includes("single-point full flow (design → review → implementation — no step cut)."), "池句 3（Fast lane）缺失")
})

test("锚#3 修正轮 docs FIRST + 锚#5 链终消费 + 异步锚驻留 discipline-engineering（逐字）", () => {
  assert.ok(de.includes("Fix rounds reuse the same designToken — but docs FIRST"), "锚#3 docs FIRST 句缺失")
  assert.ok(de.includes("**Chain-terminal token consumption**: after the delivery is verified and the chain closes out, call `subagent` with `action:'consume-design'` for this designId"), "锚#5 链终消费句缺失")
  assert.ok(de.includes("**Advisor calls are async by default at the top level (AGENT-LOOP.md §11.2 — R13).**"), "R13 async 锚缺失")
  assert.ok(de.includes("On approval the design token is issued to the session automatically"), "token 自动签发句缺失")
})

test("锚#4 拍板 ≠ 设计批准 + 指针句驻留 discipline-engineering（逐字——核心纪律句族）", () => {
  assert.ok(de.includes("A user ruling on design CONTENT (form/shape/option choice) is requirements confirmation — NOT design approval."), "锚#4 主句缺失")
  assert.ok(de.includes("Approving a form (\"B\", \"可以\") never shortcuts past review."), "锚#4 批准门句缺失")
  assert.ok(de.includes("Only the explicit sign-off after the advisor review unlocks eng-coder."), "锚#4 解锁句缺失")
  assert.ok(de.includes("A user ruling on design form/shape/option choice is NOT this sign-off —"), "锚#4 指针句缺失")
})

test("锚#6 凭证不落文档驻留 discipline-engineering（逐字）", () => {
  assert.ok(de.includes("**Credential values stay out of documents**: never write token or designId VALUES into design docs, change records, or status lines"), "锚#6 主句缺失")
  assert.ok(de.includes("No values, no placeholders."), "锚#6 收束句缺失")
})

test("锚#7 调度器句驻留（Multi-Task 块——CLI=de / VSC=de——各端断言自身宿主）", () => {
  // 并行节去重（VSC-CONTEXT-PARITY 批 E-3）：单宿主 = discipline-engineering.md（与 CLI 同）——
  // persona-engineering.md 副本已删除（pe 零残留由本档 T-PC-3 断言）。
  assert.ok(de.includes("overlapping domains are queued by the scheduler, never hand-serialized"), "锚#7 调度器句缺失（宿主 discipline-engineering）")
  assert.ok(de.includes(SQ_LITERAL), "锚#7 提交即走句缺失（宿主 discipline-engineering）")
})

// ─────────────────────────────────────────────────────────────────────────────
// 开关段 C1-C4（PROMPT-ATTENTION 阶段 C——推进档位）。
// ─────────────────────────────────────────────────────────────────────────────
test("C1 推进档位顶层规则驻留 persona-engineering（逐字——保真结构位 S2）", () => {
  assert.ok(pe.includes("Progress has two modes: **auto**（默认——each step completed → present → proceed to the next）and **manual**"), "C1 两档句缺失")
  assert.ok(pe.includes("是**意图**不是词表"), "C1 意图句缺失")
  assert.ok(pe.includes("你下一条明确指示（\"可以 / 继续 / 开始\"或具体下一步指令）恢复 auto"), "C1 恢复句缺失")
  assert.ok(pe.indexOf("推进档位") < pe.indexOf("与 eng-coder 的分工界面"), "C1 位置：档位段先于分工界面（S2 序——提权位）")
})

test("C2 step4 尾句驻留 discipline-engineering（逐字——MACHINE SIGNAL）", () => {
  assert.ok(de.includes("— this digest is a MACHINE SIGNAL that the review finished; it is NOT authorization to spawn or proceed."), "C2 主句缺失")
  assert.ok(de.includes("Under manual mode the result is presented and progress waits for the user's explicit go."), "C2 manual 句缺失")
})

test("C3 分派表 User stop 条驻留 discipline-engineering（逐字——意图为准非词表）", () => {
  assert.ok(de.includes("User stop / hold-back"), "C3 标签缺失")
  assert.ok(de.includes("推进切 manual：本消息仅回答/呈现，不落文档推进、不 spawn、不发起评审——你明确指示后恢复。"), "C3 语义句缺失")
})

test("C4 normal 档位语义段：随 C4 裁定并入施工③宿主段（de 收口段）", () => {
  assert.ok(de.includes("0. User ruling pending — the result is presented and progress waits for the user's explicit go."), "C4 对应段（等待句）缺失")
  assert.ok(de.includes("1. Proceed — the user has explicitly approved this step"), "C4 对应段（放行句）缺失")
  assert.ok(de.includes("WAIT"), "C4: WAIT 档位词缺失")
})

// ─────────────────────────────────────────────────────────────────────────────
// ASYNC-RESIDUE-FIX 6 处（async:false 引导清零——随迁后断言宿主=新纪律层）。
// ─────────────────────────────────────────────────────────────────────────────
test("ASYNC-RESIDUE R1 escalation 段无 async:false 同步引导 + 新引导句驻留（dn）", () => {
  assert.doesNotMatch(dn, /sync only when the next step depends on this output and nothing else can proceed/, "escalate 段: sync 例外通道句残留")
  assert.ok(dn.includes("if your next step depends on the report, end the turn and let it arrive (or declare dependsOn)"), "R1 新句缺失")
})

test("ASYNC-RESIDUE R2 重复句合一 + 无 sync 例外（dn）", () => {
  assert.ok(dn.includes("results reach you automatically (no polling needed)"), "R2 主句缺失")
  assert.doesNotMatch(dn, /pass `?async: ?false`? only when|sync only when/, "R2 sync 例外引导残留")
})

test("ASYNC-RESIDUE R4 advisor.mjs async 参数机制限定句驻留", () => {
  const adv = read("src/agent-tools/advisor.mjs")
  assert.ok(adv.includes("(mechanism parameter — top-level launches are async by default)"), "advisor.mjs async 参数: 机制参数限定句缺失")
})

test("ASYNC-RESIDUE F-2/F-3 工程侧 async 段同基驻留（de）", () => {
  assert.ok(de.includes("**Advisor calls are async by default at the top level (AGENT-LOOP.md §11.2 — R13).**"), "R13 async 段锚缺失")
  assert.ok(de.includes("On approval the design token is issued to the session automatically and the digest echoes the designId for the eng-coder spawn."), "token 自动签发句缺失")
  assert.doesNotMatch(de, /it returns a design token in plain text in its response/, "旧 token 句残留")
})

test("ASYNC-RESIDUE R6 路由面随迁 common（subagent 族行）+ dn 旧路由块零残留（公共层扩容重定向）", () => {
  assert.ok(common.includes("| `subagent` / `advisor` / `consult_*` | delegation / independent review / consultation |"), "路由: common 缺 subagent/advisor/consult 族行（宿主迁移后）")
  assert.ok(dn.includes("it runs in the BACKGROUND by default (like an async spawn)"), "escalate 异步语义缺失（飞刀段——路由细注删源后由该节与工具描述承载）")
  assert.ok(!dn.includes("Tool routing"), "dn: 旧路由块残留（双源重复）")
})

test("BATCH-4-DOC-CLEANUP F-1 ESCALATE.md async:false 残留句零 + 锚句驻留", () => {
  const escalate = read("docs/design/ESCALATE.md")
  assert.doesNotMatch(escalate, /同步旧路径/, "ESCALATE.md: 同步旧路径残留")
  assert.doesNotMatch(escalate, /同步语义零回归/, "ESCALATE.md: 同步语义零回归残留")
  assert.ok(escalate.includes("**顶层一律异步**（同 §7.7——§7.7.1：同步保留例外全移除——报告自动到：ack → 回合自然收尾 → 挂起 settle → digest）"), "ESCALATE.md: §7.7.1 锚句缺失")
})

test("BATCH-4-DOC-CLEANUP F-2 WEBVIEW.md 输入锁旧句零残留（readOnly 锁/由 host 排队——fail-when-present）", () => {
  const webview = read("docs/design/WEBVIEW.md")
  assert.doesNotMatch(webview, /readOnly 锁/, "WEBVIEW.md: readOnly 锁旧句残留")
  assert.doesNotMatch(webview, /由 host 排队/, "WEBVIEW.md: send.js 拦截旧句残留")
})

test("§7.5 subagent-spec 描述 Async spawn 锚句双句驻留（VSC 载体 = subagent-spec.mjs）", () => {
  const desc = read("src/agent-tools/subagent-spec.mjs")
  assert.match(desc, /Top-level spawns are ALWAYS async — never pass `async:false` at depth-0 \(the report arrives automatically; if your next step needs it, end the turn and let the digest deliver it\)\. Inside subagents \(depth>0\) spawns are always synchronous \(platform rule\)\./, "Async spawn 段: 锚句 2 缺失")
  assert.match(desc, /After an async spawn the turn winds down normally — nothing expects you to wait for it/, "Async spawn 段: 锚句 1 缺失")
  assert.doesNotMatch(desc, /Pass async:false only when you must handle the report synchronously/, "Async spawn 段: 旧同步引导残留")
  assert.doesNotMatch(desc, /use a synchronous spawn instead/, "Async spawn 段: 旧同步备选引导残留")
  assert.doesNotMatch(desc, /async:false is the only way to block/, "Async spawn 段: 旧同步理由残留")
})

test("§7.5 subagent-spec 描述 escalate 段 + async 参数描述无同步引导", () => {
  const desc = read("src/agent-tools/subagent-spec.mjs")
  assert.doesNotMatch(desc, /pass `async:false` to wait for the report synchronously/, "escalate 段描述: sync 句残留")
  assert.doesNotMatch(desc, /when you must process the report before continuing/, "async 参数描述: sync 引导残留")
})

test("§7.7.1 advisor 描述无 async:false 顶层同步引导", () => {
  const adv = read("src/agent-tools/advisor.mjs")
  assert.doesNotMatch(adv, /Pass async:false for a blocking review/, "advisor 描述: sync 引导残留")
})

// ─────────────────────────────────────────────────────────────────────────────
// ADVISOR-VERDICT-TEMPLATE L50：advisor 四件套 VERDICT 裁决行驻留（内容冻结——施工红线）。
// ─────────────────────────────────────────────────────────────────────────────
const r1 = read("src/prompts/advisor-round1.md")
const r2 = read("src/prompts/advisor-round2.md")
const r3 = read("src/prompts/advisor-round3.md")
const rd = read("src/prompts/advisor-design.md")
const TIERS = [["advisor-round1.md", r1], ["advisor-round2.md", r2], ["advisor-round3.md", r3], ["advisor-design.md", rd]]

test("advisor AC1 各档含单值 VERDICT 裁决行指令（pass | changes-required 双值声明）", () => {
  for (const [name, f] of TIERS) {
    assert.ok(f.includes("`VERDICT: pass` or `VERDICT: changes-required`"), `${name}: 单值裁决行双值声明缺失`)
    assert.ok(f.includes("VERDICT: pass") && f.includes("VERDICT: changes-required"), `${name}: 裁决值缺一`)
  }
})

test("advisor AC2 裁决后禁续（rounds: 尾部 Verdict Line 段——design: token 回显定制措辞）", () => {
  for (const [name, f] of TIERS.slice(0, 3)) {
    assert.ok(f.includes("## Verdict Line"), `${name}: 尾部 Verdict Line 段缺失`)
    assert.ok(f.includes("no further negotiation once the verdict is out"), `${name}: 裁决后禁续句缺失`)
  }
  assert.ok(rd.includes("After the VERDICT line, the ONLY allowed content is the token echo"), "advisor-design.md: VERDICT 后仅 token 回显句缺失")
  assert.ok(rd.includes("the designId must be the LAST thing you output"), "advisor-design.md: designId 末字节句缺失")
  assert.ok(rd.includes("Copy BOTH values verbatim"), "advisor-design.md: token 逐字回声句缺失")
})

test("advisor AC7 双轨消除——旧 pass 定义不复发", () => {
  assert.doesNotMatch(r1, /findings do NOT block approval/, "round1: 旧 🟡 不阻断审批句残留")
  assert.doesNotMatch(r2, /do not block approval/, "round2: 旧不阻断审批句残留")
  assert.doesNotMatch(r3, /do not block approval/, "round3: 旧不阻断审批句残留")
  assert.doesNotMatch(rd, /findings do NOT block approval/, "advisor-design: 旧 🟡 不阻断审批句残留")
  assert.doesNotMatch(rd, /briefly state the design is approved/, "advisor-design: 旧 token 前散文许可句残留")
})

// ─────────────────────────────────────────────────────────────────────────────
// 搜索条款宿主迁移（公共层扩容——条款随迁 common，de/dn 删源；T-CL5）。
// ─────────────────────────────────────────────────────────────────────────────
test("搜索条款宿主迁移：3 字面驻留 common + de/dn 零命中（重定向 + 反证非空转）", () => {
  // 各端条款行文案自持（多实现面纪律——不做 byte 硬一致）——语义关键词逐宿主驻留断言。
  const CLAUSES = [
    "**`websearch` returns junk/unrelated results twice in a row → switch immediately**",
    "MCP search tools (`*_web_search*` / `*_search_prime` etc.) are PRIMARY for technical verification and general search",
    "`websearch` (Bing) is ONLY the fallback",
  ]
  for (const c of CLAUSES) {
    assert.ok(common.includes(c), `common: 条款缺失: ${c.slice(0, 40)}`)
    for (const [name, f] of [["discipline-engineering", de], ["discipline-normal", dn]]) assert.ok(!f.includes(c), `${name}: 旧宿主残留: ${c.slice(0, 40)}`)
  }
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
  const eng = engMode.engineering
  assert.ok(eng.prompt.indexOf("推进档位") < eng.prompt.indexOf("确认与批准门"), "工程装配：人格档位段先于公共确认门")
  assert.ok(eng.prompt.indexOf("确认与批准门") < eng.prompt.indexOf("铁律"), "工程装配：公共确认门先于纪律铁律")
  const nor = engMode.normal
  assert.ok(nor.prompt.indexOf("ThinCoder, a coding agent") < nor.prompt.indexOf("确认与批准门"), "普通装配：人格身份先于公共确认门")
  assert.ok(nor.prompt.indexOf("确认与批准门") < nor.prompt.indexOf("写码工作流"), "普通装配：公共确认门先于纪律写码工作流")
  for (const s of ["normal", "engineering", "eng-coder", "explore", "coder", "plan"]) {
    assert.ok(engMode[s].warnings.length === 0, `${s}: 全槽在位无警告`)
  }
})

test("§3.2 装配矩阵：角色场景人格差异（explore/coder/plan = 各自角色人格文件 1:1）+ 常量导出面 = 六件", () => {
  for (const role of ["explore", "coder", "plan"]) {
    const rolePersona = read(`src/prompts/persona-${role}.md`)
    assert.ok(engMode[role].prompt.includes(rolePersona.split("\n")[2] ?? rolePersona), `${role}: 装配含角色人格内容`)
    assert.ok(!engMode[role].prompt.includes("slot:[1] consumers:[main session·normal mode"), `${role}: 未复用 persona-normal（1:1 行）`)
  }
  for (const name of [PERSONA_ENGINEERING, PERSONA_NORMAL, COMMON, DISCIPLINE_ENGINEERING, DISCIPLINE_NORMAL, CONSULT_BASE]) {
    assert.ok(typeof name === "string" && name.length > 50, `导出常量非空: ${String(name).slice(0, 20)}`)
  }
})

test("§3.2 consult 场景：assemblePrompt 返回 CONSULT_BASE 自含基底（无四槽拼接）", () => {
  const c = assemblePrompt("consult")
  assert.strictEqual(c.prompt, CONSULT_BASE, "consult 输出 = CONSULT_BASE 原文")
  assert.ok(c.warnings.length === 0, "consult: 无警告")
})

// ─────────────────────────────────────────────────────────────────────────────
// 降级链断言（§3.4 三款：槽缺失→警告；common 缺失→同款；特殊模块→报错不自降级）。
// AGENTS 层：本端 setup 无 loadProjectInstructions 注入体（端差异——[4] 层静默跳过由
// prompt-overlays 注释契约承载）——静默跳过语义由 source 断言（不 import extension 面）。
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
    assert.ok(!r.prompt.includes("ThinCoder, a coding agent"), "人格槽空缺（不 fallback 其他槽文本）")
    assert.ok(r.prompt.includes("Programming is collaborative labor"), "common 槽仍正常")
    assert.ok(r.prompt.includes("写码工作流"), "纪律槽仍正常")
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
    assert.ok(r.prompt.includes("ENGINEERING MODE"), "人格槽仍正常")
    assert.ok(r.prompt.includes("铁律"), "纪律槽仍正常")
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
  const setup = read("src/agent/setup.mjs")
  assert.ok(setup.includes("Project instructions (follow these as project conventions):"), "[4] 项目指令块注入缺失")
  assert.ok(setup.includes("<untrusted_project_instructions>"), "[4] 项目指令块锚缺失")
  assert.ok(setup.includes("formatSkillListing"), "[4] skills 清单尾块注入缺失")
  for (const files of Object.values(SCENARIO_SLOT_FILES)) {
    if (!files) continue
    assert.ok(files.every((f) => !/AGENTS|skills/i.test(f)), "场景表无 AGENTS/skills 槽——缺失即静默（无警告需求）")
  }
})

test("§3.4 降级链④：特殊模块基底缺失→不可用报错（不自降级——setup.mjs 收口）", () => {
  const setup = read("src/agent/setup.mjs")
  assert.match(setup, /consult-base\.md missing — consultation module unavailable \(no degraded fallback per PROMPT-SYSTEM §3\.4\)/, "consult 空基底报错句在位")
  assert.match(setup, /slotWarnings/, "四槽警告注入口在位")
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
  // persona-engineering 置顶发起权闸 ✓；persona-normal 最高规则在其装配链的 common 批准门区——
  // 巡检降级为非空断言（CLI 20 文件特例同款豁免）。
  {
    const lines = pe.split("\n")
    const front = Math.ceil(lines.length * 0.2)
    assert.ok(/WAIT|Do NOT|auto|manual|initiated by the user/.test(lines.slice(0, front).join("\n")), "persona-engineering: 前 20% 巡检标记词缺失")
    assert.ok(pn.length > 100, "persona-normal: 内容在位")
  }
})

test("主链槽位装配非空（六场景全槽在位——终验）", () => {
  for (const s of ["normal", "engineering", "eng-coder", "explore", "coder", "plan"]) {
    assert.ok(engMode[s].prompt.length > 500, `${s}: 装配非空`)
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// 第 9 批锚（PROMPT-REVIEW-ORDER——ADVISOR-CONVERGENCE 对位节 = 本仓设计档 §12）：
// Action 四值 + 修正轮 ⇄ 用户批准 时序。口径 = T-RO1–T-RO6：**本端 src + 中文镜像两侧**
// （跨仓逐字由 prompts-mirror-anchors 面⑥ 承载——多实现面纪律，各端独立断言自身文本）。
// ─────────────────────────────────────────────────────────────────────────────
const peZh = read("docs/design/prompts/persona-engineering.md")
const deZh = read("docs/design/prompts/discipline-engineering.md")
const dnZh = read("docs/design/prompts/discipline-normal.md")
const ROPE_CHAIN = ["评审 pass 后逐条裁决", "修正轮落地并经核验"]
const ROPE_LABEL = "**修正轮 ⇄ 用户批准 时序**"
const ROPE_BULLET = [
  "- **修正轮 ⇄ 用户批准 时序**（评审后）：评审 pass 后你逐条裁决（裁决表）——裁决要求修正的（设计档修订 / 实现修复），",
  "  **修正轮落地并经你核验后，才可请求用户批准**；修正轮在途时**不得**请求批准——在途状态只作汇报，汇报不携带批准请求。",
  "  **修正轮边界**：只落评审发现与你的裁决直接导出的修正——**不得夹带新语义/新范围**；夹带即新内容，",
  "  须显式摆给用户单独定，不得随批准请求一并默认通过。",
  "  批准请求中，裁决表的 `Dispatched` 行须已逐条收敛为 `Fixed`（随请求给出落地证据：file:line 或设计档节）。",
].join("\n")
const PE_PAIR = [["src（英文落地）", pe], ["docs/design/prompts（中文镜像）", peZh]]
const DE_PAIR = [["src（英文落地）", de], ["docs/design/prompts（中文镜像）", deZh]]
const DN_PAIR = [["src（英文落地）", dn], ["docs/design/prompts（中文镜像）", dnZh]]

test("T-RO1 正常：链行节点双源均在位（评审后裁决 / 修正轮落地核验——节点序先于用户批准）", () => {
  for (const [name, doc] of PE_PAIR) for (const lit of ROPE_CHAIN) assert.ok(doc.includes(lit), `${name}: 链行节点缺失: ${lit}`)
  assert.ok(pe.indexOf(ROPE_CHAIN[0]) < pe.indexOf("user approval") && peZh.indexOf(ROPE_CHAIN[0]) < peZh.indexOf("→ 用户批准"), "节点序漂移（应插在提醒评审与用户批准之间）")
})

test("T-RO2/T-RO3 正常/边界：Action 四值 + 计数词同改（de×2 + dn×2 双源——词序 Fixed→Dispatched→Not an issue→Deferred）", () => {
  for (const [name, doc] of [...DE_PAIR, ...DN_PAIR]) {
    const want = name.startsWith("src") ? "exactly four values" : "恰好四选一"
    assert.ok(doc.includes("Dispatched") && doc.includes(want), `${name}: 四值/${want} 缺失——计数词未同改`)
    const o = ["`Fixed`", "`Dispatched`", "`Not an issue`", "`Deferred`"].map((v) => doc.indexOf(v))
    assert.ok(o[0] < o[1] && o[1] < o[2] && o[2] < o[3], `${name}: 词序漂移`)
  }
})

test("T-RO4 正常：时序 bullet 双源逐字全文 + 要素 + 位序（裁决表块末行后、轮次衰减前）", () => {
  for (const [name, doc] of DE_PAIR) {
    assert.ok(doc.includes(ROPE_BULLET), `${name}: 时序 bullet 逐字全文缺失`)
    for (const el of ["**不得**请求批准", "**不得夹带新语义/新范围**", "`Dispatched` 行须已逐条收敛为 `Fixed`"]) assert.ok(doc.includes(el), `${name}: bullet 要素缺失: ${el}`)
    assert.ok(doc.indexOf(ROPE_LABEL) < doc.indexOf("轮次衰减"), `${name}: 位序漂移（应早于轮次衰减）`)
  }
  assert.ok(de.indexOf("surface any unresolved 🔴 to the user.") < de.indexOf(ROPE_LABEL) && deZh.indexOf("未解决的 🔴 必须向用户呈现。") < deZh.indexOf(ROPE_LABEL), "bullet 应紧随裁决表块末行")
})

test("T-RO5/T-RO6 反例+边界：旧三值句/旧相邻形态零残留（本端 6 档）+ 新增文本零维护者注（§2.7 #15）", () => {
  for (const [name, doc] of [...PE_PAIR, ...DE_PAIR, ...DN_PAIR]) assert.ok(!doc.includes("恰好三选一") && !doc.includes("exactly three values"), `${name}: 旧三值句残留`)
  for (const [name, doc] of PE_PAIR) {
    assert.ok(!doc.includes("（发起权在用户）→ 用户批准") && !doc.includes("(initiation stays with the user) → user approval"), `${name}: 旧相邻形态残留（防“追加两版”）`)
  }
  for (const lit of [...ROPE_CHAIN, ROPE_LABEL, ...ROPE_BULLET.split("\n")]) assert.ok(!/\d{4}-\d{2}-\d{2}|第\s*\d+\s*批|评审\s*#/.test(lit), `新增文本含维护者注: ${lit.slice(0, 26)}…`)
})

// ─────────────────────────────────────────────────────────────────────────────
// 语料修复（VSC-CONTEXT-PARITY 批 R3——E-1a~f / E-2 / E-3 落位机判：T-PC-1~T-PC-3）。
// 权威 = VSC 设计档 VSC-PROMPTS「语料修复」节（逐字表）；本端断言自身文本（多实现面纪律）。
// ─────────────────────────────────────────────────────────────────────────────
const DN_RESTORED_HEADINGS = [
  "### 文档先行",
  "### UI & interface design (from discipline.md)",
  "### 查重与意图（先定对再定小）",
  "### 代码结构判据 — plan the layering while writing, not after (2026-09-05 methodology: comprehension-cost layering)",
  "### Edit & write discipline (2026-09-05 — memory-wipe lessons — the rules below used to live only in agent memory and vanished when memory was cleared; prompts cover everyone, memory covers one machine)",
  "### Review discipline (standard mode only — engineering mode has its own review timing rules)",
]

test("T-PC-1 语料修复（修一）：两缺节 + 4 压平标题独占行；两合并行已拆（E-1a~f）", () => {
  for (const h of DN_RESTORED_HEADINGS) {
    assert.ok(dn.split("\n").includes(h), `标题未恢复为独占行: ${h}`)
  }
  // 缺节正文本体（来源①/② 关键子串——正文按字符串键控回填）
  assert.ok(dn.includes("**Document ownership — find the doc that owns the topic before writing.**"), "文档先行节：ownership bullet 缺失")
  assert.ok(dn.includes("check the `docs/design/README.md` document map"), "文档先行节：地图路径替换缺失")
  assert.ok(dn.includes("Describe each mechanism in detail in exactly ONE place (the authoritative source); other documents reference it, never copy it."), "文档先行节：单一权威源句缺失")
  assert.ok(dn.includes("- **Check existing code.** Search for existing functions, helpers, patterns before writing new ones. Duplicates are technical debt."), "查重与意图节：Check existing code 缺失")
  assert.ok(dn.includes("- **Decide what's right before deciding what's smallest.**"), "查重与意图节：先定对再定小缺失")
  assert.ok(dn.includes(`"Smallest change" is not a goal; if you're about to choose something because it's a smaller change, you skipped "right" — go back and do it correctly.`), "查重与意图节：收束句缺失")
  // E-1e：合并行①拆 3 行（第 2 行无 bullet 前缀——CLI :99-101 同构）
  assert.ok(dn.includes(
    "- **After each advisor review, reply with a response table** — exact header `| # | Action | Detail |` (the runtime extracts this header; keep it verbatim). One row per issue; `#` = the advisor's issue number (`Orig#` on rounds 2+).\n" +
    "`Action` is one of exactly four values: `Fixed` (you edited the code — landed), `Dispatched` (fix round in flight — not yet landed), `Not an issue` (technical rebuttal with evidence), `Deferred` (admitted, not fixed now — with a reason).\n" +
    "- `Detail` = what changed and where (file:line), or your evidence/reason."
  ), "E-1e：合并行未拆为 3 行")
  // E-1f：合并行②拆 2 行
  assert.ok(dn.includes(
    "  complete the split inside ONE task (no two-batch intermediate states).\n" +
    "  Assertion-count parity binds splits only — inventory cleanup rounds delete per an explicit itemized list (count delta = list)."
  ), "E-1f：合并行未拆为 2 行")
  // 压平残留零命中（标题不再并进正文行）
  for (const residual of ["theories. UI & interface design:", "承诺点。 Code structure — plan the layering", "(file caps are fallbacks, not goals). Edit & write discipline", "timing rules):"]) {
    assert.ok(!dn.includes(residual), `压平残留: ${residual}`)
  }
})

test("T-PC-2 语料修复（修一边界）：编辑点结果行 ≤300 字符（标题不并进正文行）", () => {
  const lines = dn.split("\n")
  const keys = [
    "### UI & interface design (from discipline.md)",
    "### 代码结构判据 — plan the layering while writing, not after",
    "### Edit & write discipline (2026-09-05",
    "### Review discipline (standard mode only",
    "- **用户约定执行纪律（2026-08-31，两次违约教训）**",
    "- Comments ride their decisions —",
    "- **After each advisor review, reply with a response table**",
    "`Action` is one of exactly four values:",
    "- `Detail` = what changed and where",
    "  complete the split inside ONE task (no two-batch intermediate states).",
    "  Assertion-count parity binds splits only —",
  ]
  for (const k of keys) {
    const hits = lines.filter((l) => l.includes(k))
    assert.equal(hits.length, 1, `编辑点行定位失败（应恰 1 行）: ${k.slice(0, 40)}`)
    assert.ok(hits[0].length <= 300, `编辑点行 >300 字符（标题仍并进正文行?）：${hits[0].length}`)
  }
})

test("T-PC-3 语料修复（修二）：E-2 三子句 + E-3 cancel 行迁入 de；pe 并行节零残留", () => {
  for (const s of [
    "   - 设计 = 对需求的检验——设计写不出来的地方，就是需求没说清的地方（回问，不自己补）。",
    "   - **需求缺口停报链**：勘察发现需求说不通 / 与实现冲突 / 归属不明 → **停下打回主 agent**，不自行选一种解释往下写。",
    "   - **写权**：设计档与需求档由 eng-designer 写作（含修订）；主 agent 记批次档、核验设计稿、发起评审。",
  ]) assert.ok(de.includes(s), `E-2 子句缺失: ${s.slice(0, 24)}…`)
  assert.ok(de.includes("Cancelling a running eng-coder is a last resort — its in-flight delivery dies unmerged and unaudited; verify the alarm with reliable checks and prefer scoped recovery first."), "E-3 cancel 行未迁入 de（单宿主）")
  for (const s of ["Multi-Task", "Parallelize aggressively", "Cancelling a running eng-coder"]) {
    assert.ok(!pe.includes(s), `E-3 去重未竟：persona-engineering.md 残留「${s}」`)
  }
})
