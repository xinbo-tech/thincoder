// 评审面两缺口批（台账 #928 ∥ #945）· 批内单元测试件（§2.4 验收 + §2.8 修正块）——名随批次档 · 住批次目录 · 不进仓套件。
// 跑法：仓根（thincoder/）`node --test docs/batches/2026-10-05-review-face-gaps.test.mjs`
// 腿：R1–R3 ∥ R6 引文装饰剥离（先红后绿——红 = matched 0）∥ G1 素引文控制 ∥ N1–N3 负控（零放宽）
//   ∥ R4 ∥ R5 documents 锚祖先链底座（先红后绿——红 = invalid）∥ G2 锚相对形控制 ∥ N4 ∥ N5 负控（fail-closed 不减）。
// R6 = §2.8④ 推定红（引号外语义省略形）——先红实跑坐实（红面 = 非连续引文类）。
import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync, realpathSync } from "node:fs"
import { join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { verifyCitations } from "../../thincoder-core/advisor/citations.mjs"
import { resolveReviewDocPaths } from "../../thincoder-core/agent-tools/review-facts.mjs"

const ROOT = realpathSync(fileURLToPath(new URL("../../", import.meta.url))) // 仓根（thincoder——realpath 归一，围栏判定前提）
const CONTAINER = resolve(ROOT, "..") // 容器根（thincoder 的父目录——R4/R5 锚祖先链面）
const norm = (p) => p.replace(/[\\/]/g, "/")

// ── #928 夹具（现读行同取法：readFileSync().split("\n")[n-1]，与 citations.mjs 同源）────────────────
const LEDGER_REL = "docs/core/design/LEDGER.md"
const BATCH_REL = "docs/batches/2026-10-05-review-face-gaps.md"
const lineOf = (rel, n) => readFileSync(join(ROOT, rel), "utf8").split("\n")[n - 1]
/** LEDGER :568 行首段（剥至首个反引号——捕获正则 [^`\n] 同形，反引号不入夹具串）。 */
const SUB568 = lineOf(LEDGER_REL, 568).split("`")[0]
/** §2.8③ 钉锚子串（批档 :46——实施轮实读核行号；子串恒定）。 */
const SUB46 = "候选有效下限 = **2 字符**"
const cite = (rel, n, content) => `Finding: \`${rel}:${n}: ${content}\` — quoted line follows.`
const check = (rel, n, content) => verifyCitations(cite(rel, n, content), ROOT)

test("R1 包裹引号引文（LEDGER :568 行首段）⇒ matched（装饰剥离候选集）", () => {
  const r = check(LEDGER_REL, 568, `"${SUB568}"`)
  assert.equal(r.total, 1)
  assert.equal(r.matched.length, 1, `matched=${r.matched.length} failed=${JSON.stringify(r.failed)}`)
  assert.equal(r.failed.length, 0)
})

test("R2 未提交档批档 :46 包裹引号引文 ⇒ matched（工作树直读——零 git 面）", () => {
  const r = check(BATCH_REL, 46, `"${SUB46}"`)
  assert.equal(r.matched.length, 1, `matched=${r.matched.length} failed=${JSON.stringify(r.failed)}`)
  assert.equal(r.failed.length, 0)
})

test("R3 包裹引号 ＋ 尾注记复合形 ⇒ matched（首对引号内层文本）", () => {
  const r = check(LEDGER_REL, 568, `"${SUB568}" — trailing note`)
  assert.equal(r.matched.length, 1, `matched=${r.matched.length} failed=${JSON.stringify(r.failed)}`)
  assert.equal(r.failed.length, 0)
})

test("R6 引号外语义省略形 ⇒ matched（候选命中先于省略号分类——§2.8④）", () => {
  const r = check(LEDGER_REL, 568, `"${SUB568}" — annotation with an ellipsis…`)
  assert.equal(r.matched.length, 1, `matched=${r.matched.length} failed=${JSON.stringify(r.failed)}`)
  assert.equal(r.failed.length, 0)
})

test("G1 素引文（控制）⇒ matched（零回归）", () => {
  const r = check(LEDGER_REL, 568, SUB568)
  assert.equal(r.total, 1)
  assert.equal(r.matched.length, 1)
  assert.equal(r.failed.length, 0)
})

test("N1 伪造引文（负控）⇒ content mismatch（零放宽）", () => {
  const r = check(LEDGER_REL, 568, "fabricated citation content not present on this line zzq")
  assert.equal(r.matched.length, 0)
  assert.equal(r.failed.length, 1)
  assert.equal(r.failed[0].reason, `content mismatch @ ${LEDGER_REL}`)
})

test("N2 省略号形（候选全未中——负控）⇒ 非连续引文类（零改）", () => {
  const r = check(LEDGER_REL, 568, "**入参形态（分派后——缝钉死）**：…（缩略）")
  assert.equal(r.matched.length, 0)
  assert.equal(r.failed.length, 1)
  assert.match(r.failed[0].reason, /not a contiguous citation \(ellipsis\)/)
  assert.ok(r.failed[0].reason.includes("quote one contiguous excerpt"), "改法串在位")
})

test("N3 不可读路径（负控）⇒ file unreadable（零改）", () => {
  const r = check("docs/core/design/no-such-file-928.mjs", 1, "whatever content")
  assert.equal(r.matched.length, 0)
  assert.equal(r.failed.length, 1)
  assert.equal(r.failed[0].reason, "file unreadable")
})

// ── #945 夹具（真结构直调——设计轮探针同形：子仓锚 + 容器相对形）──────────────────────────────
test("R4 子仓锚（thincoder.com）＋ 容器相对形 ⇒ resolved（腿③底座并 cwd 祖先链）", () => {
  const anchor = join(CONTAINER, "thincoder.com")
  const doc = "thincoder.com/docs/requirements/PROJECT.md"
  const { resolved, invalid } = resolveReviewDocPaths([doc], anchor)
  assert.equal(invalid.length, 0, `invalid=${JSON.stringify(invalid)}`)
  assert.equal(norm(resolved.get(doc)), norm(join(CONTAINER, "thincoder.com", "docs", "requirements", "PROJECT.md")))
})

test("R5 子仓锚（thincoder）＋ 容器相对形 ⇒ resolved（腿③底座并 cwd 祖先链）", () => {
  const doc = "thincoder/docs/core/design/LEDGER.md"
  const { resolved, invalid } = resolveReviewDocPaths([doc], ROOT)
  assert.equal(invalid.length, 0, `invalid=${JSON.stringify(invalid)}`)
  assert.equal(norm(resolved.get(doc)), norm(join(ROOT, "docs", "core", "design", "LEDGER.md")))
})

test("G2 锚相对形（控制）⇒ resolved（零回归）", () => {
  const doc = "docs/core/design/LEDGER.md"
  const { resolved, invalid } = resolveReviewDocPaths([doc], ROOT)
  assert.equal(invalid.length, 0)
  assert.equal(norm(resolved.get(doc)), norm(join(ROOT, doc)))
})

test("N4 nonsense/foo.md（负控）⇒ invalid（零放宽）", () => {
  const { resolved, invalid } = resolveReviewDocPaths(["nonsense/foo.md"], ROOT)
  assert.equal(resolved.size, 0)
  assert.equal(invalid.length, 1)
})

test("N5 未声明面 docs/server/requirements/PROJECT.md（负控）⇒ invalid（声明面权威——fail-closed 不减）", () => {
  const doc = "docs/server/requirements/PROJECT.md"
  const { resolved, invalid } = resolveReviewDocPaths([doc], ROOT)
  assert.equal(resolved.size, 0)
  assert.equal(invalid.length, 1)
})
