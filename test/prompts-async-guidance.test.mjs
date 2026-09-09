/**
 * prompts-async-guidance.test.mjs — AGENT-LOOP §7.7/§7.7.1（VSC 端）内容断言：
 * escalate/advisor/spawn 顶层一律异步——提示词与工具描述不引导 depth-0 async:false。
 * fail-when-unchanged 正向断言 + 反向断言（旧同步引导不复发）。
 * 纯文件读取 + 字符串匹配——无 io/网络——快层直跑。
 * 双端对拍：CLI test/prompts-async-guidance.test.mjs（各端独立断言自身文本；AC2 的
 * §14.2 断言在 CLI 侧——设计文档驻 CLI 仓）。
 * ADVISOR-VERDICT-TEMPLATE L50（2026-09-09）：本文件兼作 prompts 内容锚——4 档 advisor
 * prompt（round1/2/3 + design）单值 VERDICT 裁决行指令驻留断言（AC1/AC2）+ 旧 pass
 * 定义不复发（AC7）。AC4 双端 byte 同步以交付机械核为准（双端同锚驻留即对拍约定）。
 */
import { test } from "node:test"
import assert from "node:assert"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const __here = dirname(fileURLToPath(import.meta.url))
const read = (rel) => readFileSync(join(__here, "..", rel), "utf8")

// main.md escalate 段：从 escalate 工具 bullet 到下一个 bullet（- Terminology）
const vsMain = read("src/prompts/main.md")
const escSeg = vsMain.slice(vsMain.indexOf("- `subagent(action:'escalate', task)`"), vsMain.indexOf("- Terminology:"))

test("AC1/AC4 main.md escalate 段无 async:false 同步引导 + 纯异步正向陈述", () => {
  assert.doesNotMatch(escSeg, /wait for it synchronously/, "escalate 段: 同步句残留")
  assert.doesNotMatch(escSeg, /pass `?async: ?false`? when you must/, "escalate 段: sync 引导残留")
  assert.match(escSeg, /the report arrives automatically/, "escalate 段: 报告自动到（AC4 正向断言）")
  assert.match(escSeg, /never pass `?async: ?false`? at top level/, "escalate 段: 顶层禁 async:false 引导（与 spawn 段一致——AC1）")
})

test("AC3 subagent-spec 描述 Async spawn 段与 §7.5 锚句一致（双句逐字驻留）", () => {
  const desc = read("src/agent-tools/subagent-spec.mjs")
  // 锚句 2（§7.5 :258——顶层一律异步 + depth>0 平台 sync）
  assert.match(desc, /Top-level spawns are ALWAYS async — never pass `async:false` at depth-0 \(the report arrives automatically; if your next step needs it, end the turn and let the digest deliver it\)\. Inside subagents \(depth>0\) spawns are always synchronous \(platform rule\)\./, "Async spawn 段: 锚句 2 缺失")
  // 锚句 1（回合自然收尾——报告自动到）
  assert.match(desc, /After an async spawn the turn winds down normally — nothing expects you to wait for it/, "Async spawn 段: 锚句 1 缺失")
  // 旧引导不复发
  assert.doesNotMatch(desc, /Pass async:false only when you must handle the report synchronously/, "Async spawn 段: 旧同步引导残留")
  assert.doesNotMatch(desc, /use a synchronous spawn instead/, "Async spawn 段: 旧同步备选引导残留")
  assert.doesNotMatch(desc, /async:false is the only way to block/, "Async spawn 段: 旧同步理由残留")
})

test("subagent-spec 描述 escalate 段 + async 参数描述无同步引导", () => {
  const desc = read("src/agent-tools/subagent-spec.mjs")
  assert.doesNotMatch(desc, /pass `async:false` to wait for the report synchronously/, "escalate 段描述: sync 句残留")
  assert.doesNotMatch(desc, /when you must process the report before continuing/, "async 参数描述: sync 引导残留")
})

test("advisor 描述无 async:false 顶层同步引导（§7.7.1 advisor 面复核）", () => {
  const adv = read("src/agent-tools/advisor.mjs")
  assert.doesNotMatch(adv, /Pass async:false for a blocking review/, "advisor 参数描述: sync 引导残留")
})

test("engineering.md advisor 段无 async:false 同步句", () => {
  const eng = read("src/prompts/engineering.md")
  assert.doesNotMatch(eng, /Pass `async:false` only when you must block/, "engineering.md advisor 段: sync 句残留")
})

test("discipline.md escalate 行无 async:false 引导", () => {
  const disc = read("src/prompts/discipline.md")
  assert.doesNotMatch(disc, /async:false waits/, "discipline.md escalate 行: sync 引导残留")
})

// ─────────────────────────────────────────────────────────────────────────────
// ADVISOR-VERDICT-TEMPLATE L50（2026-09-09）：advisor 4 档单值裁决行指令驻留。
// 双端同锚驻留（对拍约定）——AC4 byte 同步以交付机械核为准。
// ─────────────────────────────────────────────────────────────────────────────
const r1 = read("src/prompts/advisor-round1.md")
const r2 = read("src/prompts/advisor-round2.md")
const r3 = read("src/prompts/advisor-round3.md")
const rd = read("src/prompts/advisor-design.md")
const TIERS = [["advisor-round1.md", r1], ["advisor-round2.md", r2], ["advisor-round3.md", r3], ["advisor-design.md", rd]]

test("AC1 各档含单值 VERDICT 裁决行指令（pass | changes-required 双值声明）", () => {
  for (const [name, f] of TIERS) {
    assert.ok(f.includes("`VERDICT: pass` or `VERDICT: changes-required`"), `${name}: 单值裁决行双值声明缺失`)
    assert.ok(f.includes("VERDICT: pass") && f.includes("VERDICT: changes-required"), `${name}: 裁决值缺一`)
  }
})

test("AC2 裁决后禁续（rounds: 尾部 Verdict Line 段+禁续句——design: 定制措辞仅允许 token 回显）", () => {
  for (const [name, f] of TIERS.slice(0, 3)) {
    assert.ok(f.includes("## Verdict Line"), `${name}: 尾部 Verdict Line 段缺失`)
    assert.ok(f.includes("no further negotiation once the verdict is out"), `${name}: 裁决后禁续句缺失`)
  }
  assert.ok(rd.includes("After the VERDICT line, the ONLY allowed content is the token echo"), "advisor-design.md: VERDICT 后仅 token 回显句缺失")
  assert.ok(rd.includes("the designId must be the LAST thing you output"), "advisor-design.md: designId 末字节句缺失")
  assert.ok(rd.includes("Copy BOTH values verbatim"), "advisor-design.md: token 逐字回声句缺失")
})

test("AC7 双轨消除——旧 pass 定义不复发（旧 prose 已改写并入裁决行）", () => {
  assert.doesNotMatch(r1, /findings do NOT block approval/, "round1: 旧 🟡 不阻断审批句残留")
  assert.doesNotMatch(r2, /do not block approval/, "round2: 旧 (🟡\/🔵 do not block approval) 句残留")
  assert.doesNotMatch(r3, /do not block approval/, "round3: 旧 (🟡\/🔵 do not block approval) 句残留")
  assert.doesNotMatch(rd, /findings do NOT block approval/, "advisor-design: 旧 🟡 不阻断审批句残留")
  assert.doesNotMatch(rd, /briefly state the design is approved/, "advisor-design: 旧 token 前散文许可句残留")
})

// ─────────────────────────────────────────────────────────────────────────────
// MAIN-DESIGN-ENHANCE（2026-09-09）：四维设计纪律句驻留（A1-A4 逐字锚——字节源 = 设计档
// MAIN-DESIGN-ENHANCE.md 逐字锚定文本——双端照抄——fail-when-unchanged——AC-1/AC-3）。
// ─────────────────────────────────────────────────────────────────────────────
const engDoc = read("src/prompts/engineering.md")
const A1_ANCHOR = "设计启动前先跑**勘察 checklist**：① `doc_search` 定位所属设计文档（查 docs/design/README.md 地图——已有则更新不新建）② 读既有实现与先例 ③ 核测试面（既有用例/测试文件）④ 核双端对位面（CLI/VSC 镜像）⑤ 广度勘察委派 explore 子代理（不重复已委派探索——主会话不重扫）。"
const A2_ANCHOR = "候选方案 ≥2 时，设计文档 MUST 含**方案选型对比**子节（候选/判据/取舍/否决理由表）；单一候选显式声明豁免（\"单方案——无对比\"）即可。"
const A3_ANCHOR = "提\"设计就绪待评审\"前先跑**评审前预检**：① 需求三层具体到可设计？② 受影响文件全清单 + 行数标注（R24a）？③ 验收标准逐条回指需求（每条可机器验证）？④ UI/交互决策全落档（无\"讨论过但没写\"）？⑤ 方案对比已做？——预检不过先修，不自发起评审（发起权仍在用户）。"
const A4_ANCHOR = "本会话验证过的好实践 → 落 METHODOLOGY 机制正文/反例档案（本端 METHODOLOGY.md）——不散落会话。"

test("MAIN-DESIGN-ENHANCE A1-A4 四维纪律句驻留 engineering.md（AC-1/AC-3——逐字 fail-when-unchanged）", () => {
  assert.ok(engDoc.includes(A1_ANCHOR), "A1 勘察 checklist 句缺失（step 1——需求澄清后/设计前交界）")
  assert.ok(engDoc.includes(A2_ANCHOR), "A2 方案对比句缺失（step 2——设计文档要求）")
  assert.ok(engDoc.includes(A3_ANCHOR), "A3 评审前预检句缺失（step 3——Remind readiness 动作前）")
  assert.ok(engDoc.includes(A4_ANCHOR), "A4 实践沉淀句缺失（Docs capture the conversation 条尾）")
})

// ─────────────────────────────────────────────────────────────────────────────
// ASYNC-RESIDUE-FIX（2026-09-09）：异步化残留 6 处修复（VSC 端断言面）——main.md:8 sync
// 例外通道句清除（F-1）+ main.md:13 重复句合一（F-5）+ advisor async 机制参数限定句驻留
// （F-4——本端已含——防回归）+ engineering.md step 4 旧 token 句删除 + async 段同基驻留
// （F-2/F-3——字节源 = 本端 L16 删旧句后——CLI 照抄同基）。fail-when-unchanged。
// ─────────────────────────────────────────────────────────────────────────────
const mainL8 = vsMain.split("\n")[7]
const mainL13 = vsMain.split("\n")[12]

test("ASYNC-RESIDUE-FIX F-1 main.md:8 sync 例外通道句清除 + 新引导句驻留（fail-when-unchanged）", () => {
  assert.ok(mainL8.includes("if your next step depends on the report, end the turn and let it arrive (or declare dependsOn)"), "main.md:8: F-1 新句缺失")
  assert.doesNotMatch(mainL8, /sync only when the next step depends on this output and nothing else can proceed/, "main.md:8: sync 例外通道句残留")
})

test("ASYNC-RESIDUE-FIX F-5 main.md:13 重复句合一（results reach you automatically 恰一现）+ 无 sync 例外", () => {
  assert.strictEqual((mainL13.match(/results reach you automatically/g) || []).length, 1, "main.md:13: 重复句未合一")
  assert.doesNotMatch(mainL13, /pass `?async: ?false`? only when|sync only when/, "main.md:13: sync 例外引导残留")
})

test("ASYNC-RESIDUE-FIX F-4 advisor.mjs async 参数机制限定句驻留（防回归）", () => {
  const advF4 = read("src/agent-tools/advisor.mjs")
  assert.ok(advF4.includes("(mechanism parameter — top-level launches are async by default)"), "advisor.mjs async 参数: 机制参数限定句缺失")
})

test("ASYNC-RESIDUE-FIX F-2/F-3 engineering.md step 4 旧 token 句删除 + async 段同基驻留（字节源端）", () => {
  const step4 = engDoc.split("\n")[15]
  assert.ok(step4.includes("**Advisor calls are async by default at the top level (AGENT-LOOP.md §11.2 — R13).**"), "step 4: async 段锚缺失")
  assert.ok(step4.includes("On approval the design token is issued to the session automatically and the digest echoes the designId for the eng-coder spawn."), "step 4: token 自动签发句缺失")
  assert.doesNotMatch(step4, /it returns a design token in plain text in its response/, "step 4: 旧 token 句残留")
})

test("BATCH-4-DOC-CLEANUP F-1 ESCALATE.md async:false 残留句零 + 锚句驻留（同步旧路径/同步语义零回归——fail-when-present）", () => {
  const escalate = read("docs/design/ESCALATE.md")
  assert.doesNotMatch(escalate, /同步旧路径/, "ESCALATE.md: 同步旧路径残留（§2.3 async 段/变更记录）")
  assert.doesNotMatch(escalate, /同步语义零回归/, "ESCALATE.md: 同步语义零回归残留")
  assert.ok(escalate.includes("**顶层一律异步**（同 §7.7——§7.7.1：同步保留例外全移除——报告自动到：ack → 回合自然收尾 → 挂起 settle → digest）"), "ESCALATE.md: §7.7.1 锚句缺失（byte-final 照抄 AGENT-LOOP §14.2）")
})

test("BATCH-4-DOC-CLEANUP F-2 WEBVIEW.md 输入锁旧句零残留（readOnly 锁/由 host 排队——fail-when-present）", () => {
  const webview = read("docs/design/WEBVIEW.md")
  assert.doesNotMatch(webview, /readOnly 锁/, "WEBVIEW.md: readOnly 锁旧句残留（INPUT-LOCK-BEHAVIOR-REVISED 后应零）")
  assert.doesNotMatch(webview, /由 host 排队/, "WEBVIEW.md: send.js 拦截旧句残留（digest 中 Enter 由 host 排队——已修为 send 拦截保留）")
})

