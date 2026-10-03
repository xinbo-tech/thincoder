/**
 * 2026-10-03-design-token-echo.test.mjs — design-token 回显链缺陷修批（#884）批次本地单元件（随批留存归档）。
 * 名随批次档 · 住批次目录 · 不进仓套件；复跑 = 从仓库根 `thincoder/`：
 *   node --test docs/batches/2026-10-03-design-token-echo.test.mjs
 * （导入按 `process.cwd()`（仓库根）相对解析。）
 *
 * 腿（T1–T10 —— 截断容忍 / 恒定标记 / 剥离单源 / 三径剥离 / 提示词加固；初态 = 实施前实读）：
 *   T1  截断回显 ⇒ 认 pass + M2 + 槽存全串 + 标记位置不变式      初红
 *   T2  全串回显零回归（零 M2；suffix 在位）                    初绿
 *   T3  非回显 ⇒ fail + M1 恒定（findings 保留）                初红
 *   T4  空文本零回显 ⇒ M1（非静默）                             初红
 *   T5  剥离单源三形（全串 / 前缀形 / 裸 uuid）                  初红（函数不存在）
 *   T6  异 token 回显 ⇒ fail + M1；异 uuid 文本零改动            初红（M1 断言）
 *   T7  未完成径零回归（既有标记在位；槽零写）                    初绿
 *   T8  提示词加固句（两形输出 ⊗ 两源 EN/CN 逐字）               初红
 *   T9  TTL / 全串匹配零回归                                   初绿
 *   T10 未完成 ∥ stale ∥ D1 落盘失败 三径残片剥净                初红（现只剥全串形）
 */
import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, readFileSync, mkdtempSync, writeFileSync, statSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { pathToFileURL } from "node:url"

const ROOT = process.cwd()
if (!existsSync(resolve(ROOT, "thincoder-core"))) throw new Error(`从仓库根（thincoder/）运行（cwd = ${ROOT}）`)
const mod = (rel) => import(pathToFileURL(resolve(ROOT, rel)).href)
const text = (rel) => readFileSync(resolve(ROOT, rel), "utf8")
/** 折行归一（多行措辞的在场断言不受 md 折行影响）。 */
const flat = (s) => s.replace(/\s+/g, " ")

// §5.1② 标记逐字核（EN 核串机器可 grep；CN 核串同断言）。
const M1_EN = "no valid token echo"
const M2_EN = "truncated echo"
const M2_CN = "回显被截断"

const UUID = "74140d27-5dd1-478f-9d07-877b6d2ee05f" // 本批 token 专属 uuid（起 2 事故实值形态）
const TOKEN = `${UUID}:4102444800000` // 2100-01-01——远未来（TTL 面不参与）
const OTHER_UUID = "0f9c2b1a-1a1a-4b2b-8c3c-1234567890ab" // 异 token uuid

const dt = await mod("thincoder-core/agent-tools/design-token.mjs")
const ads = await mod("thincoder-core/agent-tools/advisor-settle.mjs")

const mkAgent = () => ({ cwd: process.cwd(), _engDesignTokens: new Map(), _role: "main" })
const mkRun = () => ({ reviewId: "r1", reviewType: "design", designId: "design-1", round: 0, priorOutput: null, stale: false, open: true, docSetKey: "k" })
const tmpCwd = (tag) => mkdtempSync(join(tmpdir(), `dte-${tag}-`))

test("T1 截断回显（裸 uuid）⇒ 认 pass + M2 + 槽存全串 + 标记位置不变式", () => {
  const agent = mkAgent()
  const run = mkRun()
  const raw = `# Review\n\nLooks good — no 🔴.\n\n${UUID}`
  const settled = dt.settleDesignReview(agent, run, TOKEN, raw)
  assert.equal(settled.passed, true)
  assert.equal(agent._engDesignTokens.get("design-1"), TOKEN, "槽存储恒全串")
  assert.ok(settled.output.includes(M2_EN), "M2 EN 核")
  assert.ok(settled.output.includes(M2_CN), "M2 CN 核")
  assert.equal(run.open, false, "批准关实例")
  assert.ok(settled.output.endsWith(run.approvedSuffix), "suffix 恒居文末")
  const body = settled.output.slice(0, settled.output.indexOf(run.approvedSuffix))
  assert.ok(body.indexOf(M2_CN) >= 0 && body.indexOf(M2_CN) < body.length, "M2 居 suffix 前")
  assert.ok(!body.includes(UUID), "正文零截断残片")
  assert.ok(!body.includes("[DESIGN-TOKEN:"), "正文零方括号残片")
})

test("T2 全串回显零回归（零 M2；suffix 在位；槽全串）", () => {
  const agent = mkAgent()
  const run = mkRun()
  const raw = `# Review\n\nLooks good.\n\n[DESIGN-TOKEN:${TOKEN}]`
  const settled = dt.settleDesignReview(agent, run, TOKEN, raw)
  assert.equal(settled.passed, true)
  assert.equal(agent._engDesignTokens.get("design-1"), TOKEN)
  assert.ok(!settled.output.includes(M2_EN) && !settled.output.includes(M2_CN), "全串形零 M2")
  assert.ok(settled.output.endsWith(run.approvedSuffix), "suffix 在位")
  assert.ok(settled.output.includes("Looks good."), "正文保留")
})

test("T3 非回显 ⇒ fail + M1 恒定（findings 保留；槽零写）", () => {
  const agent = mkAgent()
  const run = mkRun()
  const raw = "# Review\n\nThe design needs work.\n\nFinding: the acceptance section is vague."
  const settled = dt.settleDesignReview(agent, run, TOKEN, raw)
  assert.equal(settled.passed, false)
  assert.ok(settled.output.includes(M1_EN), "M1 EN 核（恒定——非仅空文本）")
  assert.ok(settled.output.includes("未回显有效 token"), "M1 CN 核")
  assert.ok(settled.output.includes("Finding: the acceptance section is vague."), "findings 保留")
  assert.equal(agent._engDesignTokens.size, 0, "槽零写")
  assert.equal(run.open, true, "实例保持")
})

test("T4 空文本零回显 ⇒ M1（非静默）", () => {
  const agent = mkAgent()
  const settled = dt.settleDesignReview(agent, mkRun(), TOKEN, "")
  assert.equal(settled.passed, false)
  assert.ok(settled.output.includes(M1_EN), "空文本同出 M1")
  assert.equal(agent._engDesignTokens.size, 0)
})

test("T5 剥离单源三形（全串 / 前缀形 / 裸 uuid）", () => {
  assert.equal(typeof dt.stripDesignTokenEcho, "function", "stripDesignTokenEcho 在导出面")
  const cases = [
    `alpha [DESIGN-TOKEN:${TOKEN}] omega`, // 全串形
    `alpha [DESIGN-TOKEN:${UUID}] omega`, // 截断形（uuid 之后缺失）
    `alpha [DESIGN-TOKEN:${UUID}:999] omega`, // 截断形（uuid 之后不符）
    `alpha ${UUID} omega`, // 裸 uuid
  ]
  for (const input of cases) {
    const out = dt.stripDesignTokenEcho(input, TOKEN)
    assert.ok(!out.includes(UUID), `零 uuid 残留：${input}`)
    assert.ok(!out.includes("[DESIGN-TOKEN:"), `零 [DESIGN-TOKEN: 残留：${input}`)
    assert.ok(out.includes("alpha") && out.includes("omega"), `无关文字保留：${input}`)
  }
})

test("T6 异 token 回显 ⇒ fail + M1；异 uuid 文本零改动；空 uuid 畸形串 fail-closed", () => {
  const agent = mkAgent()
  const run = mkRun()
  const raw = `# Review\n\n[DESIGN-TOKEN:${OTHER_UUID}:123] still wrong`
  const settled = dt.settleDesignReview(agent, run, TOKEN, raw)
  assert.equal(settled.passed, false)
  assert.ok(settled.output.includes(M1_EN), "M1 在位")
  assert.ok(settled.output.includes(`[DESIGN-TOKEN:${OTHER_UUID}:123]`), "异 uuid 文本零改动")
  assert.equal(agent._engDesignTokens.size, 0)
  // 空 uuid 畸形 token：不得误认截断形（裸 uuid 判定取非空值——fail-closed）
  const malformed = dt.settleDesignReview(mkAgent(), mkRun(), ":123", "plain review body")
  assert.equal(malformed.passed, false)
})

test("T7 未完成径零回归（既有标记在位；槽零写）", () => {
  const agent = mkAgent()
  const run = mkRun()
  const raw = `partial review [DESIGN-TOKEN:${TOKEN}]`
  const settled = dt.settleDesignReview(agent, run, TOKEN, raw, { incomplete: "timeout" })
  assert.equal(settled.passed, false)
  assert.ok(settled.output.includes("评审未完成——token 未签发"), "既有未完成标记在位")
  assert.equal(agent._engDesignTokens.size, 0, "槽零写")
  assert.equal(run.open, true)
})

test("T8 提示词加固句（两形输出 ⊗ 两源 EN/CN 逐字）", async () => {
  const { buildDesignApprovalBlock } = await mod("thincoder-core/advisor/messages.mjs")
  const TAIL_BOTH = "Copy BOTH values verbatim — every character, including the colon and the digits after the uuid inside the token brackets; a shortened echo is flagged as truncated."
  const TAIL_TOKEN_ONLY = "Copy it verbatim — every character, including the colon and the digits after the uuid; a shortened echo is flagged as truncated."
  assert.ok(buildDesignApprovalBlock("tok", "did").includes(TAIL_BOTH), "designId 在场形句尾逐字")
  assert.ok(buildDesignApprovalBlock("tok", null).includes(TAIL_TOKEN_ONLY), "token-only 降级形句尾逐字")
  assert.ok(flat(text("thincoder-core/prompts/advisor-design.md")).includes(`${TAIL_BOTH} The designId must be the LAST thing you output.`), "EN 源句内加固逐字")
  assert.ok(
    flat(text("docs/core/design/prompts/advisor-design.md")).includes("两个值逐字复制——每个字符都在内，包括冒号与 token 方括号内 uuid 之后的数字位；截断回显会被标记。designId 必须是你输出的**最后**一样东西。"),
    "CN 源句内加固逐字（同文口径）",
  )
})

test("T9 TTL / 全串匹配零回归", () => {
  assert.equal(dt.validateDesignToken(TOKEN), true, "未来 token 有效")
  assert.equal(dt.validateDesignToken(`${UUID}:${Date.now() - 1000}`), false, "过期 token 无效")
  assert.equal(dt.makeDesignTokenRegex(TOKEN).test(`x [DESIGN-TOKEN:${TOKEN}] y`), true, "全串匹配在位")
  assert.equal(dt.makeDesignTokenRegex(TOKEN).test(`x [DESIGN-TOKEN:${UUID}] y`), false, "全串 regex 不认截断形（零改）")
})

test("T10-① 未完成径：截断残片剥净（单源三形）；未完成标记在位", () => {
  const agent = mkAgent()
  const settled = dt.settleDesignReview(agent, mkRun(), TOKEN, `partial [DESIGN-TOKEN:${UUID}]`, { incomplete: "timeout" })
  assert.ok(!settled.output.includes(UUID) && !settled.output.includes("[DESIGN-TOKEN:"), "残片零残留")
  assert.ok(settled.output.includes("评审未完成——token 未签发"), "未完成标记在位")
})

test("T10-② stale 径：截断残片剥净；陈旧标记在位", () => {
  const cwd = tmpCwd("stale")
  const docAbs = [join(cwd, "doc.md")]
  const agent = { cwd, _engDesignTokens: new Map(), _mutLog: [{ seq: 9, paths: docAbs }] }
  const entry = {
    id: 1, role: "advisor", reviewType: "design", cancelled: false,
    run: mkRun(), designToken: TOKEN, launchSeq: 1, docAbs,
    report: `# Review\n\nok\n\n[DESIGN-TOKEN:${UUID}]`,
  }
  const settled = ads.settleAdvisorRun(agent, entry)
  assert.equal(settled.stale, true, "陈旧判定成立")
  assert.ok(settled.report.includes("评审目标已变更——token 未签发"), "陈旧标记在位")
  assert.ok(!settled.report.includes(UUID) && !settled.report.includes("[DESIGN-TOKEN:"), "残片零残留")
})

test("T10-③ D1 落盘失败径：截断残片剥净；D1 标记在位（槽回滚）", async () => {
  const { _setSessionsDirForTest, _resetSessionsDirForTest, slotPath } = await mod("thincoder-core/session-slots.mjs")
  const sessionsTmp = tmpCwd("sessions")
  _setSessionsDirForTest(sessionsTmp)
  try {
    const cwd = tmpCwd("d1")
    // 注入链（批档 :197 注记实核）：_slotMtime 缓存命中 ⇒ 守卫跳过解析 ⇒ 槽文件复读抛 ⇒ durable=false。
    const agent = { cwd, _slot: 1, _engDesignTokens: new Map() }
    const p = slotPath(cwd, 1)
    writeFileSync(p, "{ corrupted — not json", "utf8")
    agent._slotMtime = { p, mtimeMs: statSync(p).mtimeMs }
    const entry = {
      id: 2, role: "advisor", reviewType: "design", cancelled: false,
      run: mkRun(), designToken: TOKEN, launchSeq: 0,
      report: `# Review\n\nok\n\n[DESIGN-TOKEN:${UUID}]`,
    }
    const settled = ads.settleAdvisorRun(agent, entry)
    assert.equal(settled.passed, false, "落盘失败 ⇒ 结算未成立")
    assert.ok(settled.report.includes("D1:"), "D1 标记在位（注入链成立）")
    assert.ok(settled.report.includes("persist failed") || settled.report.includes("could NOT be durably written"), "D1 通知逐字面")
    assert.ok(!settled.report.includes(UUID) && !settled.report.includes("[DESIGN-TOKEN:"), "残片零残留")
    assert.ok(!agent._engDesignTokens.has("design-1"), "槽回滚（无半结算态）")
  } finally {
    _resetSessionsDirForTest()
  }
})
