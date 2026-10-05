/**
 * 2026-10-05-review-gate-gaps.test.mjs — 评审闸缺口批（#940 · 裁定闸 / VERDICT 机械闸）批次本地单元件（随批留存归档）。
 * 名随批次档 · 住批次目录 · 不进仓套件；复跑 = 从仓库根 `thincoder/`：
 *   node --test docs/batches/2026-10-05-review-gate-gaps.test.mjs
 * （导入按 `process.cwd()`（仓库根）相对解析。）
 *
 * 腿（A–H —— 批档 §2.5；初态 = 实施前实读——红绿对）：
 *   A（主红腿——对侧实撞复现）changes-required + 回显（全串 ∥ 截断变体）⇒ 拒签 + 标记 + 残片零残留   初红
 *   B  缺裁定行 + 回显 ⇒ 拒签（reason: no-pass-line）∥ 槽零写                                   初红
 *   C  并现（pass 行 + changes 行 + 回显）⇒ 拒签（changes 优先——机器序）                          初红
 *   D  #884 回归：pass + 截断回显 ⇒ 照旧签发（槽存全串 ∥ M2 居 suffix 前 ∥ suffix 居文末）           初绿
 *   E  #884 回归：pass + 全串回显 ⇒ 照旧签发（零 M2 ∥ suffix 在位）                               初绿
 *   F  零回归：非回显 ⇒ M1 照旧 ∥ 未完成径不达闸、既有标记照旧                                    初绿
 *   G  判据纯函数 verdictGateFailure 直连（六值 + 非串守卫）                                      初红（函数不存在）
 *   H  提示面：buildDesignApprovalBlock 两形均载逐字新句（echo 与 🟡 段之间）                      初红（句缺失）
 */
import test from "node:test"
import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import { resolve } from "node:path"
import { pathToFileURL } from "node:url"

const ROOT = process.cwd()
if (!existsSync(resolve(ROOT, "thincoder-core"))) throw new Error(`从仓库根（thincoder/）运行（cwd = ${ROOT}）`)
const mod = (rel) => import(pathToFileURL(resolve(ROOT, rel)).href)

const UUID = "9c8b7a65-4321-4fed-8abc-0123456789ab" // 本批 token 专属 uuid（形态照 #884 件）
const TOKEN = `${UUID}:4102444800000` // 2100-01-01——远未来（TTL 面不参与）

const dt = await mod("thincoder-core/agent-tools/design-token.mjs")
const { buildDesignApprovalBlock } = await mod("thincoder-core/advisor/messages.mjs")

const mkAgent = () => ({ cwd: process.cwd(), _engDesignTokens: new Map(), _role: "main" })
const mkRun = () => ({ reviewId: "r1", reviewType: "design", designId: "design-1", round: 0, priorOutput: null, stale: false, open: true, docSetKey: "k" })

// §5.2 拒签标记逐字核（CN ∥ EN 核串）+ M1/M2 既有标记核串。
const GATE_CN = "裁定非通过——token 未签发"
const GATE_EN = "review verdict is not pass"
const M1_EN = "no valid token echo"
const M2_EN = "truncated echo"

test("A（主红腿）changes-required + 回显（全串 ∥ 截断变体）⇒ 拒签 + 标记 + 残片零残留", () => {
  const agent = mkAgent()
  const run = mkRun()
  const raw = `# Review\n\n🔴 2 — must fix.\n\nVERDICT: changes-required\n\n[DESIGN-TOKEN:${TOKEN}]`
  const settled = dt.settleDesignReview(agent, run, TOKEN, raw)
  assert.equal(settled.passed, false, "changes-required 回执 ⇒ 不得签发（对侧实撞复现）")
  assert.equal(agent._engDesignTokens.size, 0, "槽零写")
  assert.equal(run.open, true, "实例保持（run.open 不动）")
  assert.ok(settled.output.includes(GATE_CN) && settled.output.includes(GATE_EN), "拒签标记 CN/EN 核")
  assert.ok(settled.output.includes("reason: changes-required"), "reason 面")
  assert.ok(settled.output.includes("the echoed token was stripped"), "标记尾句逐字")
  assert.ok(!settled.output.includes(UUID) && !settled.output.includes("[DESIGN-TOKEN:"), "回显残片零残留")

  const agent2 = mkAgent()
  const run2 = mkRun()
  const raw2 = `# Review\n\n🔴 1 — must fix.\n\nVERDICT: changes-required\n\n${UUID}`
  const settled2 = dt.settleDesignReview(agent2, run2, TOKEN, raw2)
  assert.equal(settled2.passed, false, "截断变体同拒签")
  assert.equal(agent2._engDesignTokens.size, 0, "槽零写（截断变体）")
  assert.equal(run2.open, true, "实例保持（截断变体）")
  assert.ok(settled2.output.includes("reason: changes-required"), "reason 面（截断变体）")
  assert.ok(!settled2.output.includes(UUID), "截断形 uuid 残片零残留")
})

test("B 缺裁定行 + 回显 ⇒ 拒签（reason: no-pass-line）∥ 槽零写", () => {
  const agent = mkAgent()
  const run = mkRun()
  const raw = `# Review\n\nLooks good.\n\n[DESIGN-TOKEN:${TOKEN}]`
  const settled = dt.settleDesignReview(agent, run, TOKEN, raw)
  assert.equal(settled.passed, false, "缺行 = 不合规回执 ⇒ 不得铸（fail-closed）")
  assert.ok(settled.output.includes("reason: no-pass-line"), "reason 面")
  assert.ok(settled.output.includes(GATE_CN) && settled.output.includes(GATE_EN), "标记在位")
  assert.equal(agent._engDesignTokens.size, 0, "槽零写")
  assert.equal(run.open, true, "实例保持")
})

test("C 并现（pass 行 + changes 行 + 回显）⇒ 拒签（changes 优先——机器序）", () => {
  const agent = mkAgent()
  const run = mkRun()
  const raw = `# Review\n\nVERDICT: pass\n\nWait — re-reading: one 🔴 remains.\n\nVERDICT: changes-required\n\n[DESIGN-TOKEN:${TOKEN}]`
  const settled = dt.settleDesignReview(agent, run, TOKEN, raw)
  assert.equal(settled.passed, false, "并现 ⇒ 拒签（fail-closed 方向）")
  assert.ok(settled.output.includes("reason: changes-required"), "changes 优先")
  assert.ok(!settled.output.includes("reason: no-pass-line"), "零 no-pass-line 误标")
  assert.equal(agent._engDesignTokens.size, 0, "槽零写")
})

test("D #884 回归：pass + 截断回显 ⇒ 照旧签发（槽存全串 ∥ M2 居 suffix 前 ∥ suffix 居文末）", () => {
  const agent = mkAgent()
  const run = mkRun()
  const raw = `# Review\n\nLooks good — no 🔴.\n\nVERDICT: pass\n\n${UUID}`
  const settled = dt.settleDesignReview(agent, run, TOKEN, raw)
  assert.equal(settled.passed, true, "pass 裁定 ⇒ 照旧签发")
  assert.equal(agent._engDesignTokens.get("design-1"), TOKEN, "槽存储恒全串")
  assert.ok(settled.output.includes(M2_EN) && settled.output.includes("回显被截断"), "M2 在位")
  assert.equal(run.open, false, "批准关实例")
  assert.ok(settled.output.endsWith(run.approvedSuffix), "suffix 恒居文末")
  const body = settled.output.slice(0, settled.output.indexOf(run.approvedSuffix))
  assert.ok(body.includes("回显被截断") && !body.includes(UUID), "M2 居 suffix 前 ∥ 正文零残片")
})

test("E #884 回归：pass + 全串回显 ⇒ 照旧签发（零 M2 ∥ suffix 在位）", () => {
  const agent = mkAgent()
  const run = mkRun()
  const raw = `# Review\n\nLooks good.\n\nVERDICT: pass\n\n[DESIGN-TOKEN:${TOKEN}]`
  const settled = dt.settleDesignReview(agent, run, TOKEN, raw)
  assert.equal(settled.passed, true, "pass + 全串回显 ⇒ 照旧签发")
  assert.equal(agent._engDesignTokens.get("design-1"), TOKEN, "槽存全串")
  assert.ok(!settled.output.includes(M2_EN) && !settled.output.includes("回显被截断"), "全串形零 M2")
  assert.ok(settled.output.endsWith(run.approvedSuffix), "suffix 在位")
  assert.ok(settled.output.includes("Looks good."), "正文保留")
})

test("F 零回归：非回显 ⇒ M1 照旧；未完成径不达闸、既有标记照旧", () => {
  const agent = mkAgent()
  const run = mkRun()
  const raw = "# Review\n\nThe design needs work.\n\nFinding: vague acceptance section."
  const settled = dt.settleDesignReview(agent, run, TOKEN, raw)
  assert.equal(settled.passed, false)
  assert.ok(settled.output.includes(M1_EN) && settled.output.includes("未回显有效 token"), "M1 恒定标记照旧")
  assert.ok(!settled.output.includes(GATE_EN), "非回显径不达裁定闸（零闸标记）")
  assert.equal(agent._engDesignTokens.size, 0, "槽零写")
  assert.equal(run.open, true, "实例保持")

  const agent2 = mkAgent()
  const run2 = mkRun()
  const raw2 = `# Review\n\npartial review\n\nVERDICT: pass\n\n[DESIGN-TOKEN:${TOKEN}]`
  const settled2 = dt.settleDesignReview(agent2, run2, TOKEN, raw2, { incomplete: "timeout" })
  assert.equal(settled2.passed, false)
  assert.ok(settled2.output.includes("评审未完成——token 未签发"), "未完成标记照旧")
  assert.ok(!settled2.output.includes(GATE_EN), "未完成径不达裁定闸（零闸标记）")
  assert.equal(agent2._engDesignTokens.size, 0, "槽零写（未完成径）")
  assert.equal(run2.open, true, "实例保持（未完成径）")
})

test("G 判据纯函数 verdictGateFailure 直连（六值 + 非串守卫）", () => {
  const f = dt.verdictGateFailure
  assert.equal(typeof f, "function", "verdictGateFailure 在导出面")
  assert.equal(f("VERDICT: pass"), null, "pass-only ⇒ 过闸")
  assert.equal(f("VERDICT: changes-required"), "changes-required", "changes-only ⇒ 拒")
  assert.equal(f("VERDICT: pass\n\nVERDICT: changes-required"), "changes-required", "并现 ⇒ changes 优先")
  assert.equal(f("no verdict line at all"), "no-pass-line", "缺行 ⇒ 拒")
  assert.equal(f("VERDICT: PASS"), "no-pass-line", "大小写反例（逐字面——PASS 不折叠）")
  assert.equal(f("**VERDICT: pass**"), null, "强调符容忍形 ⇒ 过闸")
  assert.equal(f(null), "no-pass-line", "非串守卫 ⇒ 拒（fail-closed）")
})

test("H 提示面：buildDesignApprovalBlock 两形均载逐字新句（echo 与 🟡 段之间）", () => {
  const SENTENCE = "The verdict line is checked mechanically: without a `VERDICT: pass` line, or with a `VERDICT: changes-required` line, no token is issued even when the token is echoed."
  const forms = [["designId 在场形", buildDesignApprovalBlock("tok", "did")], ["token-only 降级形", buildDesignApprovalBlock("tok", null)]]
  for (const [label, out] of forms) {
    assert.ok(out.includes(SENTENCE), `${label} · 逐字新句`)
    const i = out.indexOf(SENTENCE)
    assert.ok(i > out.indexOf("## Approval Signal") && i < out.indexOf("🟡"), `${label} · 位置（echo 与 🟡 段之间）`)
  }
})
