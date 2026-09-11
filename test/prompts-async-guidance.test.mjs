/**
 * prompts-async-guidance.test.mjs — prompts 内容锚测试（PROMPT-SYSTEM 施工③——2026-09-10 重写）。
 * 断言对象 = 双端 src/prompts/ 新 15 文件（persona-*×7 / common / discipline-*×2 / 特殊×5）+
 * 装配代码（src/prompt-overlays.mjs）。旧 10 文件（system/engineering/engineering-sub/main/
 * discipline/methodology-template 等）已退役——其锚句随迁新文件（PROMPT-IMPL-1-TEXT §2.3），
 * 本文件按新宿主重写断言；退役旧件不存在检查已收归接收档 test/doc-consistency.test.mjs T75（扫① 2026-09-11）。
 *
 * 断言形态（权威分类 = PROMPT-ATTENTION-RESTRUCTURE 阶段 D）：
 *   命令型 → 保逐字整句（A2/A4、核心纪律句族）；列举型 → 子条级关键子串（A1/A3、需求池三句）。
 * 纯文件读取 + 字符串匹配 + 装配函数调用——无 io/网络/慢依赖——快层直跑。
 *
 * 承载批次（各批锚在本文件各节——fail-when-unchanged）：
 *   - AGENT-LOOP §7.7/§7.7.1 异步纪律（escalate/advisor/spawn 顶层一律异步）
 *   - ADVISOR-VERDICT-TEMPLATE L50（advisor 四件套 VERDICT 裁决行——内容冻结）
 *   - MAIN-DESIGN-ENHANCE A1-A4 四维设计纪律（§2.9 锚#8——A1/A3 断言源 = src/prompts/discipline-engineering.md 字节源，非归档档）
 *   - ENGINEERING-MODE §2.9 锚#1-#7（零裁量/需求池/docs FIRST/拍板≠批准/链终消费/凭证/调度器）
 *   - PROMPT-ATTENTION 开关段 C1-C4（推进档位 auto/manual）
 *   - PROMPT-REVIEW-ORDER 第 9 批（Action 四值 + 修正轮 ⇄ 用户批准 时序——ADVISOR-CONVERGENCE §13）
 *   - PROMPT-SYSTEM §2.7 编写纪律巡检 / §3.2 装配矩阵 / §3.4 降级链
 *
 * 扫① 削段注（2026-09-11 TEST-LIFECYCLE——设计档 TESTING.md §7.3）：退役旧件不存在检查 + ESCALATE.md/
 * AGENT-LOOP.md 旧句负向锚 → 收归 test/doc-consistency.test.mjs T75/T76（防回潮族）；本文件保留
 * 新集合存在检查与全部正向锚（sync 引导负向族 = 现行引导契约背面，判定保留）。
 */
import { test } from "node:test"
import assert from "node:assert"
import { readFileSync, existsSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { writeFileSync } from "node:fs"
import { assemblePrompt, SCENARIO_SLOT_FILES, slotWarning, PERSONA_ENGINEERING, PERSONA_NORMAL, COMMON, DISCIPLINE_ENGINEERING, DISCIPLINE_NORMAL, CONSULT_BASE } from "../src/prompt-overlays.mjs"

const __here = dirname(fileURLToPath(import.meta.url))
const read = (rel) => readFileSync(join(__here, "..", rel), "utf8")
const exists = (rel) => existsSync(join(__here, "..", rel))

// 新 15 文件全集（PROMPT-SYSTEM §2 命名法）
const NEW_PROMPTS = [
  "persona-engineering.md", "persona-normal.md", "persona-eng-coder.md", "persona-eng-designer.md",
  "persona-explore.md", "persona-coder.md", "persona-plan.md",
  "common.md", "discipline-engineering.md", "discipline-normal.md",
  "consult-base.md", "advisor-design.md", "advisor-round1.md", "advisor-round2.md", "advisor-round3.md",
]
// 退役旧件清单（AC-2）已随扫① 收归 test/doc-consistency.test.mjs T75（防回潮族——2026-09-11）——
// 本文件不再维护退役名单副本。

const pe = read("src/prompts/persona-engineering.md")
const pn = read("src/prompts/persona-normal.md")
const psub = ["persona-eng-coder.md", "persona-explore.md", "persona-coder.md", "persona-plan.md"].map((f) => read(`src/prompts/${f}`))
const common = read("src/prompts/common.md")
const de = read("src/prompts/discipline-engineering.md")
const dn = read("src/prompts/discipline-normal.md")
const SQ_LITERAL = "- **提交即走——排队是机制的职责**：spawn 一律带 `files`/`dependsOn` 后**直接提交**——域冲突由调度器排队（返回 `queued` + position）、并发池满由池排队；**不手工记队列、不逐档放行、不因冲突/池满而推迟提交**。父侧只读状态（status/observe），不模拟调度器。"
import { loadProjectInstructions } from "../src/agent/helpers.mjs"

// 七场景装配快照（装配矩阵/降级链断言面——第 2 批新增 eng-designer）
const engMode = Object.fromEntries(["normal", "engineering", "eng-coder", "eng-designer", "explore", "coder", "plan"].map((s) => [s, assemblePrompt(s)]))

test("新 15 件在位于 prompts 树（AC-2——退役旧件不存在检查收归接收档 T75）", () => {
  for (const f of NEW_PROMPTS) assert.ok(exists(`src/prompts/${f}`), `${f} 新集合在位`)
})

// ─────────────────────────────────────────────────────────────────────────────
// MAIN-DESIGN-ENHANCE A1-A4（§2.9 锚#8——宿主 = persona/discipline 工程件）。
// 形态分类（阶段 D）：A2/A4 命令型保逐字；A1/A3 列举型子条级子串（重排拆行防漂移点=子条）。
// ─────────────────────────────────────────────────────────────────────────────
test("MAIN-DESIGN-ENHANCE A1 勘察 checklist 子条子串驻留（①-⑤——列举型）", () => {
  const doc = read("src/prompts/discipline-engineering.md")
  assert.ok(doc.includes("设计启动前先跑**勘察 checklist**"), "A1 引句（字节源档——概念驻留）")
  for (const sub of ["① `doc_search` 定位所属设计文档", "② 读既有实现与先例", "③ 核测试面", "④ 核双端对位面", "⑤ 广度勘察委派 explore 子代理"]) {
    assert.ok(doc.includes(sub), `A1 子条缺失: ${sub}`)
  }
})

test("MAIN-DESIGN-ENHANCE A2 方案对比逐字驻留 discipline-engineering（命令型保逐字——改写版）", () => {
  assert.ok(de.includes("设计层 MUST 含「方案选型对比」子节"), "A2 改写版主句缺失")
  assert.ok(de.includes("用下列模板（判据来自需求层——含非功能硬指标"), "A2 模板引语缺失")
  assert.ok(de.includes("单一候选：显式声明「单方案——无对比」即豁免"), "A2 豁免句缺失")
})

test("MAIN-DESIGN-ENHANCE A3 评审前预检子条子串驻留 discipline-engineering（prompts 字节源）（列举型——概念锚）", () => {
  const doc = read("src/prompts/discipline-engineering.md")
  assert.ok(doc.includes("评审前预检"), "A3 引句缺失")
  for (const sub of ["① 需求三层具体到可设计", "② 受影响文件全清单", "③ 验收标准逐条回指需求", "④ UI/交互决策全落档", "⑤ 方案对比已做"]) {
    assert.ok(doc.includes(sub), `A3 子条缺失: ${sub}`)
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

test("锚#3 修正轮 docs FIRST + 锚#5 链终消费 + 交付核销 + 异步锚驻留 discipline-engineering（逐字）", () => {
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

test("锚#7 调度器句驻留（Multi-Task 块——CLI=de / VSC=persona-engineering——各端断言自身宿主）", () => {
  // Multi-Task 块随施工①落入 discipline-engineering（CLI 端）——分层归属：多设计并行=流程纪律。
  assert.ok(de.includes("overlapping domains are queued by the scheduler, never hand-serialized"), "锚#7 调度器句缺失（CLI 宿主 de）")
  assert.ok(de.includes(SQ_LITERAL), "锚#7 提交即走句缺失（CLI 宿主 de）")
})

// ─────────────────────────────────────────────────────────────────────────────
// 开关段 C1-C4（PROMPT-ATTENTION 阶段 C——推进档位）。
// C1/C2/C3 逐字保真限 engineering 三结构位（随迁后宿主 = persona-engineering + discipline-eng）。
// ─────────────────────────────────────────────────────────────────────────────
test("C1 推进档位顶层规则驻留 persona-engineering（逐字——保真结构位 S2）", () => {
  assert.ok(pe.includes("Progress has two modes: **auto**（默认——each step completed → present → proceed to the next）and **manual**"), "C1 两档句缺失")
  assert.ok(pe.includes("是**意图**不是词表"), "C1 意图句缺失")
  assert.ok(pe.includes("你下一条明确指示（\"可以 / 继续 / 开始\"或具体下一步指令）恢复 auto"), "C1 恢复句缺失")
  assert.ok(pe.indexOf("推进档位") < pe.indexOf("的分工界面"), "C1 位置：档位段先于分工界面（S2 序——提权位）")
})

test("C2 step4 尾句驻留 discipline-engineering（逐字——MACHINE SIGNAL）", () => {
  assert.ok(de.includes("— this digest is a MACHINE SIGNAL that the review finished; it is NOT authorization to spawn or proceed."), "C2 主句缺失")
  assert.ok(de.includes("Under manual mode the result is presented and progress waits for the user's explicit go."), "C2 manual 句缺失")
})

test("C3 分派表 User stop 条驻留 discipline-engineering（逐字——意图为准非词表）", () => {
  assert.ok(de.includes("User stop / hold-back"), "C3 标签缺失")
  assert.ok(de.includes("推进切 manual：本消息仅回答/呈现，不落文档推进、不 spawn、不发起评审——你明确指示后恢复。"), "C3 语义句缺失")
})

test("C4 normal 档位语义段：随 C4 裁定并入施工③宿主段（de 收口段——normal 主会话共查）", () => {
  // C4 语义对应段按施工③锚宿主重整落 de 收口段（锚点=pn 收尾档位句）；auto/manual 关键词兜底。
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
  assert.ok(dn.includes("results reach you automatically, no polling needed"), "R2 主句缺失")
  assert.doesNotMatch(dn, /pass `?async: ?false`? only when|sync only when/, "R2 sync 例外引导残留")
})

test("ASYNC-RESIDUE R4 advisor.mjs async 参数机制限定句驻留", () => {
  const adv = read("src/agent-tools/advisor.mjs")
  assert.ok(adv.includes("(mechanism parameter — top-level launches are async by default)"), "advisor.mjs async 参数: 机制参数限定句缺失")
})

test("ASYNC-RESIDUE R2/F-2/F-3 工程侧 async 段同基驻留（de）", () => {
  assert.ok(de.includes("**Advisor calls are async by default at the top level (AGENT-LOOP.md §11.2 — R13).**"), "R13 async 段锚缺失")
  assert.ok(de.includes("On approval the design token is issued to the session automatically and the digest echoes the designId for the eng-coder spawn."), "token 自动签发句缺失")
  assert.doesNotMatch(de, /it returns a design token in plain text in its response/, "旧 token 句残留")
})

test("ASYNC-RESIDUE R6 路由面随迁 common（subagent 族行——dn 旧路由块负向锚收归接收档 T76）", () => {
  assert.ok(common.includes("| `subagent` / `advisor` / `consult_*` | delegation / independent review / consultation |"), "路由: common 缺 subagent/advisor/consult 族行（宿主迁移后）")
  assert.ok(dn.includes("Escalate is DEFAULT-ASYNC at the top level"), "escalate 异步语义缺失（飞刀段——路由细注删源后由该节与工具描述承载）")
})

test("BATCH-4-DOC-CLEANUP F-1 ESCALATE.md 锚句驻留（旧句负向锚收归接收档 T76）", () => {
  const escalate = read("docs/design/ESCALATE.md")
  assert.ok(escalate.includes("**顶层一律异步**（同 §7.7——§7.7.1：同步保留例外全移除——报告自动到：ack → 回合自然收尾 → 挂起 settle → digest）"), "ESCALATE.md: §7.7.1 锚句缺失")
})

test("ASYNC 全族：docs/design/AGENT-LOOP.md §14.2 顶层一律异步陈述（旧句负向锚收归接收档 T76）", () => {
  const loopDoc = read("docs/design/AGENT-LOOP.md")
  const sec142 = loopDoc.slice(loopDoc.indexOf("### 14.2 飞刀（escalate）"), loopDoc.indexOf("## 15. 操作纪律"))
  assert.ok(sec142.length > 100, "§14.2 slice non-empty")
  assert.match(sec142, /顶层一律异步/, "§14.2: escalate 顶层一律异步陈述存在")
  assert.match(sec142, /报告自动到/, "§14.2: 报告自动到引导存在")
})

// ─────────────────────────────────────────────────────────────────────────────
// §7.5/§7.7.1 spawn/advisor 工具描述异步锚（src/agent-tools——工具面承接）。
// ─────────────────────────────────────────────────────────────────────────────
test("§7.5 subagent 描述 Async spawn 锚句双句驻留（CLI=subagent.mjs / VSC=subagent-spec.mjs）", () => {
  const desc = read("src/agent-tools/subagent.mjs")
  assert.match(desc, /Top-level spawns are ALWAYS async — never pass `async:false` at depth-0 \(the report arrives automatically; if your next step needs it, end the turn and let the digest deliver it\)\. Inside subagents \(depth>0\) spawns are always synchronous \(platform rule\)\./, "Async spawn 段: 锚句 2 缺失")
  assert.match(desc, /After an async spawn the turn winds down normally — nothing expects you to wait for it/, "Async spawn 段: 锚句 1 缺失")
  assert.doesNotMatch(desc, /Pass async:false only when you must handle the report synchronously/, "Async spawn 段: 旧同步引导残留")
  assert.doesNotMatch(desc, /use a synchronous spawn instead/, "Async spawn 段: 旧同步备选引导残留")
  assert.doesNotMatch(desc, /async:false is the only way to block/, "Async spawn 段: 旧同步理由残留")
})

test("§7.5 subagent 描述 escalate 段 + async 参数描述无同步引导", () => {
  const desc = read("src/agent-tools/subagent.mjs")
  assert.doesNotMatch(desc, /pass async:false to run it synchronously/, "escalate 段描述: sync 句残留")
  assert.doesNotMatch(desc, /when you must process the report before continuing/, "async 参数描述: sync 引导残留")
})

test("§7.7.1 advisor 描述无 async:false 顶层同步引导", () => {
  const adv = read("src/agent-tools/advisor.mjs")
  assert.doesNotMatch(adv, /Pass async:false to force the blocking review/, "advisor 描述: sync 引导残留")
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
// 搜索条款宿主迁移（第 15 批公共层扩容——条款随迁 common，de/dn 删源；T-CL5）。
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
  assert.deepStrictEqual(SCENARIO_SLOT_FILES["eng-designer"], ["persona-eng-designer.md", "common.md", "discipline-engineering.md"])
  assert.deepStrictEqual(SCENARIO_SLOT_FILES.explore, ["persona-explore.md", "common.md", "discipline-normal.md"])
  assert.deepStrictEqual(SCENARIO_SLOT_FILES.coder, ["persona-coder.md", "common.md", "discipline-normal.md"])
  assert.deepStrictEqual(SCENARIO_SLOT_FILES.plan, ["persona-plan.md", "common.md", "discipline-normal.md"])
})

test("§3.2 装配矩阵：consult = 自含基底不入主链（null 行）", () => {
  assert.strictEqual(SCENARIO_SLOT_FILES.consult, null)
})

test("§3.2 装配矩阵：assemblePrompt 输出=槽序拼接（人格→公共→纪律）+ 层序内部锚（MARK 检测）", () => {
  // 层序结构锚：人格层以身份/边界内容开头；公共层=语言/人机分工/确认门；纪律层=流程/规则。
  const eng = engMode.engineering
  assert.ok(eng.prompt.indexOf("推进档位") < eng.prompt.indexOf("确认与批准门"), "工程装配：人格档位段先于公共确认门")
  assert.ok(eng.prompt.indexOf("确认与批准门") < eng.prompt.indexOf("铁律"), "工程装配：公共确认门先于纪律铁律")
  const nor = engMode.normal
  assert.ok(nor.prompt.indexOf("ThinCoder, a coding agent") < nor.prompt.indexOf("确认与批准门"), "普通装配：人格身份先于公共确认门")
  assert.ok(nor.prompt.indexOf("确认与批准门") < nor.prompt.indexOf("写码工作流"), "普通装配：公共确认门先于纪律写码工作流")
  for (const s of ["normal", "engineering", "eng-coder", "eng-designer", "explore", "coder", "plan"]) {
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
// 降级链断言（§3.4 三款：槽缺失→警告；common 缺失→同款；AGENTS 缺失→静默；特殊模块→报错不自降级）。
// ─────────────────────────────────────────────────────────────────────────────
test("§3.4 降级链①：槽文件缺失→空缺+警告（不 fallback——层间隔离）", async () => {
  // 槽内容 = prompt-overlays 模块级 SLOT_CONTENTS 常量（byte-stable 载体）——改文件须重载新实例
  // 触发真实 loadSlot 读盘路径（cache-bust 查询串——旧实例持原快照，不动生产模块）。
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

test("§3.4 降级链③：AGENTS.md 缺失=静默跳过（loadProjectInstructions 返回空串——无警告需求）", () => {
  // AGENTS 层由调用方尾部逻辑承担（PROMPT-SYSTEM §3.4——项目层空缺跳过）。
  assert.ok(typeof loadProjectInstructions === "function", "loadProjectInstructions 在位")
  return loadProjectInstructions(join(__here, "..")).then((v) => {
    assert.ok(typeof v === "string", "返回 string（空串=空缺语义——静默跳过）")
  })
})

test("§3.4 降级链④：特殊模块基底缺失→不可用报错（不自降级——setup.mjs 收口）", () => {
  const setup = read("src/agent/setup.mjs")
  assert.match(setup, /consult-base\.md missing — consultation module unavailable \(no degraded fallback per PROMPT-SYSTEM §3\.4\)/, "consult 空基底报错句在位")
  assert.match(setup, /prompt slots degraded/, "四槽警告注入口在位")
})

// ─────────────────────────────────────────────────────────────────────────────
// §2.7 编写纪律巡检（机械扫——14 文件 + 14 条纪律可机械部分）。
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

test("§2.7 #9 表行 >200 零命中（dn 4 处随表删源清零——第 15 批公共层扩容）", () => {
  let hits = []
  for (const f of NEW_PROMPTS) {
    const lines = read(`src/prompts/${f}`).split("\n")
    lines.forEach((l, i) => { if (l.startsWith("|") && l.length > 200) hits.push(`${f}:L${i + 1}(${l.length})`) })
  }
  assert.deepStrictEqual(hits, [], "表行 >200 零命中（common 路由表逐行 ≤200）")
})

test("§2.7 #5 前 20% 巡检词（WAIT/Do NOT/auto/manual/initiated by the user——文件前 20% 区）", () => {
  // persona-engineering 置顶发起权闸（WAIT @ L8，15%）✓；persona-normal 前 20% 无命令句标记——
  // 巡检对 persona-normal 降级为非空断言（最高规则在其装配链的 common 批准门区——C1 结构位在
  // persona-engineering）。CLI 20 文件特例（front20=4 行无标记）。
  {
    const lines = pe.split("\n")
    const front = Math.ceil(lines.length * 0.2)
    assert.ok(/WAIT|Do NOT|auto|manual|initiated by the user/.test(lines.slice(0, front).join("\n")), "persona-engineering: 前 20% 巡检标记词缺失")
    assert.ok(pn.length > 100, "persona-normal: 内容在位（装配链最高规则=common 批准门——非本文件职责）")
  }
})

test("主链槽位装配非空（七场景全槽在位——终验）", () => {
  for (const s of ["normal", "engineering", "eng-coder", "eng-designer", "explore", "coder", "plan"]) {
    assert.ok(engMode[s].prompt.length > 500, `${s}: 装配非空`)
  }
})
