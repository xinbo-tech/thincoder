/**
 * 2026-10-03-advisor-convergence.test.mjs — advisor 收敛修批（实施轮 A · 代码面）批次本地单元件（随批留存归档）。
 * 名随批次档 · 住批次目录 · 不进仓套件；复跑 = 从仓库根 `thincoder/`：
 *   node --test docs/batches/2026-10-03-advisor-convergence.test.mjs
 * （导入按 `process.cwd()`（仓库根）相对解析。）
 *
 * 腿（T1–T6 / T11 / T13 = A 席代码面；T7–T10 / T12 = 提示词面，候 B 席落笔——可红并如实报）：
 *   T1  省略号 `…` 引文 ⇒ 非连续引文专类（不报 mismatch）    T2  非省略号 mismatch 照旧
 *   T3  ASCII `...` 同 T1 形                                  T4  逐字含 `...` 的连续引用 ⇒ 仍 matched（零误报）
 *   T5  精确连续引用 matched + 报告头行逐字（零回归）         T6  path traversal ∥ file unreadable 两旧类零改
 *   T7  轮 2 窗句（EN ⊗ CN）                                  T8  轮 3 接受句（EN ⊗ CN）
 *   T9  裁决句随动（轮 2 / 3 两档）                           T10 禁则四面 + 示例替形零残留
 *   T11 设计回显条件句（no unresolved 🔴）                    T12 收尾不悬置句（轮 2 / 3 两档）
 *   T13 归宿面结论块复核（零改）
 */
import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, readFileSync, mkdtempSync, mkdirSync, realpathSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { pathToFileURL } from "node:url"

const ROOT = process.cwd()
if (!existsSync(resolve(ROOT, "thincoder-core"))) throw new Error(`从仓库根（thincoder/）运行（cwd = ${ROOT}）`)
const mod = (rel) => import(pathToFileURL(resolve(ROOT, rel)).href)
const text = (rel) => readFileSync(resolve(ROOT, rel), "utf8")
/** 折行归一（多行措辞的在场断言不受 md 折行影响）。 */
const flat = (s) => s.replace(/\s+/g, " ")

// ── 夹具（T1–T6）：临时目录 + 单档；两侧 realpath 归一（Windows 短名/长名一致——围栏判定的前提）──
const BASE = realpathSync(mkdtempSync(join(tmpdir(), "advisor-convergence-")))
writeFileSync(join(BASE, "outside.mjs"), "outside the fence\n", "utf8")
mkdirSync(join(BASE, "root"))
const FENCE = realpathSync(join(BASE, "root"))
writeFileSync(join(FENCE, "fixture.mjs"), [
  "// advisor citations fixture — batch-local, regenerated per run",
  "export const advisorFixture = true",
  "const timeoutId = setTimeout(() => {",
  "  clearTimeout(timeoutId)",
  "}, 1000)",
  "const spread = (...args) => args.length",
].join("\n"), "utf8")

/** 以 FENCE 为 cwd 跑一次引文核验（单引文）。 */
const check = async (citation) => {
  const { verifyCitations } = await mod("thincoder-core/advisor/citations.mjs")
  return verifyCitations(`Finding: \`${citation}\` — quoted line follows.`, FENCE)
}

test("T1 省略号 `…` ⇒ 非连续引文专类（不报 mismatch）", async () => {
  const r = await check("fixture.mjs:3: const timeoutId = set…")
  assert.equal(r.total, 1)
  assert.equal(r.failed.length, 1)
  assert.match(r.failed[0].reason, /not a contiguous citation \(ellipsis\)/)
  assert.ok(r.failed[0].reason.includes("quote one contiguous excerpt"), "改法串在位")
  assert.ok(!r.failed[0].reason.includes("content mismatch"), "形状类与内容造假分列")
})

test("T2 非省略号 mismatch 照旧（旧类零改）", async () => {
  const r = await check("fixture.mjs:3: const timeoutId = setZzz")
  assert.equal(r.failed.length, 1)
  assert.equal(r.failed[0].reason, "content mismatch @ fixture.mjs")
})

test("T3 ASCII `...` 同 T1 形（形状类）", async () => {
  const r = await check("fixture.mjs:3: const timeoutId = set...")
  assert.equal(r.failed.length, 1)
  assert.match(r.failed[0].reason, /not a contiguous citation \(ellipsis\)/)
  assert.ok(!r.failed[0].reason.includes("content mismatch"))
})

test("T4 逐字含 `...` 的连续引用 ⇒ 仍 matched（零误报）", async () => {
  const r = await check("fixture.mjs:6: const spread = (...args) => args.length")
  assert.equal(r.total, 1)
  assert.equal(r.matched.length, 1)
  assert.equal(r.failed.length, 0)
})

test("T5 精确连续引用 matched + 报告头行逐字（零回归）", async () => {
  const { verifyCitations, appendCitationReport } = await mod("thincoder-core/advisor/citations.mjs")
  const src = "Finding: `fixture.mjs:3: timeoutId = setTimeout(() => {`"
  assert.equal(verifyCitations(src, FENCE).matched.length, 1)
  assert.ok(appendCitationReport(src, FENCE).includes("[host-verified] 1/1 citations match current file state."))
})

test("T6 path traversal ∥ file unreadable 两旧类零改", async () => {
  const trav = await check("../outside.mjs:1: outside the fence")
  assert.equal(trav.failed.length, 1)
  assert.equal(trav.failed[0].reason, "path traversal")
  const miss = await check("missing.mjs:1: nothing here")
  assert.equal(miss.failed.length, 1)
  assert.equal(miss.failed[0].reason, "file unreadable")
})

// ── 提示词面（T7–T10 / T12）——运行期 EN + 中文对位；红 = B 席未到位，如实报 ──
const EN_R1 = "thincoder-core/prompts/advisor-round1.md"
const EN_R2 = "thincoder-core/prompts/advisor-round2.md"
const EN_R3 = "thincoder-core/prompts/advisor-round3.md"
const EN_DS = "thincoder-core/prompts/advisor-design.md"
const CN_R1 = "docs/core/design/prompts/advisor-round1.md"
const CN_R2 = "docs/core/design/prompts/advisor-round2.md"
const CN_R3 = "docs/core/design/prompts/advisor-round3.md"
const CN_DS = "docs/core/design/prompts/advisor-design.md"

test("T7 提示词 · 轮 2 窗句（EN ⊗ CN）", () => {
  const en = flat(text(EN_R2))
  assert.ok(en.includes("every non-fix MUST carry a reason"), `${EN_R2} · 不修须携理由`)
  assert.ok(en.includes("last one where a reasoned non-fix can be pushed back"), `${EN_R2} · 最后一个可打回轮`)
  assert.ok(en.includes("Status `Accepted`"), `${EN_R2} · 状态词表行`)
  const cn = flat(text(CN_R2))
  assert.ok(cn.includes("每项不修必须携理由"), `${CN_R2} · 不修须携理由`)
  assert.ok(cn.includes("最后一个可打回"), `${CN_R2} · 最后一个可打回轮`)
  assert.ok(cn.includes("`Accepted`"), `${CN_R2} · 状态词表行`)
})

test("T8 提示词 · 轮 3 接受句（EN ⊗ CN）", () => {
  const en = flat(text(EN_R3))
  assert.ok(en.includes("ACCEPT them"), `${EN_R3} · 接受句`)
  assert.ok(en.includes("do not re-adjudicate"), `${EN_R3} · 不再评估理由`)
  assert.ok(en.includes("zero-reason"), `${EN_R3} · 零理由面`)
  const cn = flat(text(CN_R3))
  assert.ok(cn.includes("接受收口"), `${CN_R3} · 接受句`)
  assert.ok(cn.includes("不再评估理由成立性"), `${CN_R3} · 不再评估理由`)
  assert.ok(cn.includes("零理由"), `${CN_R3} · 零理由面`)
})

test("T9 提示词 · 裁决句随动（轮 2 / 3 两档）", () => {
  for (const rel of [EN_R2, EN_R3]) {
    const en = flat(text(rel))
    assert.ok(en.includes("or accepted (a reasoned non-fix"), `${rel} · EN 裁决句（accepted）`)
    assert.ok(en.includes("zero-reason non-fix — silence or evasion is never accepted"), `${rel} · EN 零理由项永不接受`)
  }
  for (const rel of [CN_R2, CN_R3]) {
    const cn = flat(text(rel))
    assert.ok(cn.includes("携理由不修"), `${rel} · CN 裁决句（accepted）`)
    assert.ok(cn.includes("沉默/回避永不接受"), `${rel} · CN 零理由项永不接受`)
  }
})

test("T10 提示词 · 禁则 + 示例替形（四面 EN + 四面 CN + convergence.mjs）", () => {
  for (const rel of [EN_R1, EN_R2, EN_R3, EN_DS]) {
    assert.ok(flat(text(rel)).includes("Never abbreviate a quote with an ellipsis"), `${rel} · 禁则句`)
  }
  for (const rel of [CN_R1, CN_R2, CN_R3, CN_DS]) {
    assert.ok(flat(text(rel)).includes("引证内禁用省略号"), `${rel} · CN 禁则句`)
  }
  const scan = [EN_R1, EN_R2, EN_R3, EN_DS, CN_R1, CN_R2, CN_R3, CN_DS, "thincoder-core/advisor/convergence.mjs"]
  for (const rel of scan) assert.ok(!text(rel).includes("setTimeout(...)"), `${rel} · 省略号示例零残留`)
  assert.ok(text("thincoder-core/advisor/convergence.mjs").includes("setTimeout(() => {"), "convergence.mjs 示例已替为连续引用形")
})

test("T11 设计回显条件句（no unresolved 🔴 + does not block；无 finds NO 🔴）", async () => {
  const { buildDesignApprovalBlock } = await mod("thincoder-core/advisor/messages.mjs")
  const both = buildDesignApprovalBlock("t", "d")
  assert.ok(both.includes("no unresolved 🔴"), "回显条件句随动（designId 形态）")
  assert.ok(both.includes("does not block"), "尾行定义句（accepted 不阻断）")
  assert.ok(!both.includes("finds NO 🔴"), "旧条件句零残留")
  const tokenOnly = buildDesignApprovalBlock("t", null)
  assert.ok(tokenOnly.includes("no unresolved 🔴") && !tokenOnly.includes("finds NO 🔴"), "降级形态（无 designId）同随动")
})

test("T12 收尾不悬置句（轮 2 / 3 两档）", () => {
  for (const rel of [EN_R2, EN_R3]) {
    assert.ok(flat(text(rel)).includes("never drop an item silently"), `${rel} · 不悬置句`)
  }
  for (const rel of [CN_R2, CN_R3]) {
    assert.ok(flat(text(rel)).includes("不得静默丢条目"), `${rel} · CN 不悬置句`)
  }
})

test("T13 归宿 · 结论块（零改复核）", async () => {
  const { settlementCriterion, buildSettlementConclusion } = await mod("thincoder-core/advisor/notice.mjs")
  assert.equal(settlementCriterion({ hasResult: false }), "no_report")
  assert.equal(settlementCriterion({ incomplete: "timeout" }), "timeout")
  assert.equal(settlementCriterion({ incomplete: "interrupted" }), null)
  const block = buildSettlementConclusion({ type: "code", scope: "x.mjs", round: 2, criterion: "timeout", body: null })
  assert.ok(block.includes("[type=code · scope=x.mjs · round=2/uncapped · criterion=timeout]"), "标识行")
  assert.ok(block.includes("Options: 1. proceed as-is"), "选项行")
})
