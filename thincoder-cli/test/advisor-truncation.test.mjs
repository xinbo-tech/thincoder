/**
 * advisor-truncation.test.mjs — advisor 工具结果截断双端化（DUAL-END-TRUNCATION F-2——
 * DUAL-END-TRUNCATION.md，2026-09-09）：超限结果 头行(~60%) + 中段省略注 +
 * 尾行(余预算 ~40%)——保头上下文（评审目标/标准）+ 保尾结论（裁决不被切）——offset 续读
 * 提示在。实现单源在核包（`@thincoder/core/advisor/truncate.mjs`——2026-09-14-S2 族 1 迁入，
 * 原「双端各自同名镜像且 byte-identical」形态随之退役）；纯函数直驱
 * （truncate.mjs——run.mjs 工具回填调用同函数，行为一致）。
 *
 * AC-2 用例：超 64K 结果头尾保 / 头部上下文尾部结论可见 / offset 提示在 / K=0 无假截断
 * （≤ cap 结果原样透传——截断分支根本不产生注）。参数实测：ADVISOR_HEAD_RATIO = 0.6、
 * 尾预留 NOTE_RESERVE_CHARS = 200。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { truncateAdvisorResult, ADVISOR_HEAD_RATIO } from "@thincoder/core/advisor/truncate.mjs"

const MAX_RESULT_CHARS = 64 * 1024 // run.mjs MAX_RESULT_CHARS parity（消息回填上限不动——红线）

/** n 行、每行 86 字符、带唯一标记的行集（"L0000-" + 80 x）——行级预算可精确推演。 */
function bigResult(n) {
  return Array.from({ length: n }, (_, i) => `L${String(i).padStart(4, "0")}-` + "x".repeat(80)).join("\n")
}

// AC-2 — 超 64K 结果：头部上下文（评审目标行）+ 尾部结论（末行）都可见 + 中段省略注（K=50）
test("AC-2: 超 64K 结果头尾保——头上下文可见 + 省略注在 + 尾结论可见", () => {
  const text = bigResult(800) // 800 × 86 + 799 换行 = 69599 chars > 65536
  const out = truncateAdvisorResult(text, MAX_RESULT_CHARS)
  // 预算推演（行级 len+1 = 87）：头 60% → 451 行（39237）；尾 = 65536 − 39237 − 200 → 299 行；中段 = 50
  assert.ok(out.startsWith("L0000-"), "头部上下文第一行在")
  assert.ok(out.includes("L0450-"), "头段末行在")
  assert.ok(out.includes("… (truncated: 50 more lines, 69599 chars total)"), "中段省略注在（K=50——无假截断）")
  assert.ok(out.includes("L0501-"), "尾段第一行在（真实尾行内容）")
  assert.ok(out.includes("L0799-"), "尾部结论行（末行）在")
  assert.ok(!out.includes("L0475-"), "中段行不出现")
  assert.ok(out.indexOf("L0501-") > out.indexOf("… (truncated:"), "注在头尾之间")
  assert.ok(out.endsWith("To see more content, use: read(path, offset=452, limit=200)"), "offset 续读提示在（头后 452 行续中段）")
  assert.ok(out.length <= MAX_RESULT_CHARS, "头+注+尾 ≤ 64K 上限")
})

// AC-2 — 头部上下文（评审目标/标准）与尾部结论（裁决/Token）语义行内容直证（>64K 真超限）
test("AC-2: 头部上下文与尾部结论可见（语义内容——超限真实裁决不被切）", () => {
  const criteria = "Review criteria: every acceptance criterion from the design must be verified."
  const scope = "Scope: files listed in the affected-files table only."
  const verdict = "VERDICT: clean — no unfixed findings."
  const tokenEcho = "Token echo: e7aa5d71."
  const pad = Array.from({ length: 900 }, (_, i) => `x`.repeat(80) + String(i).padStart(4, "0"))
  const text = [criteria, scope, ...pad, verdict, tokenEcho].join("\n") // 904 行 ≈ 78K > 64K
  const out = truncateAdvisorResult(text, MAX_RESULT_CHARS)
  assert.ok(out.startsWith(criteria), "头部评审标准可见")
  assert.ok(out.includes(scope), "头部 scope 行可见")
  assert.match(out, /… \(truncated: \d+ more lines, \d+ chars total\)/, "中段省略注在")
  assert.ok(out.includes(verdict), "尾部结论（VERDICT）可见——保尾")
  assert.ok(out.includes(tokenEcho), "尾部 Token 回显可见——保尾")
  assert.ok(out.includes("To see more content, use: read(path, offset="), "offset 续读提示在")
})

// AC-2 — 头占比定稿值（双端锁步锚——ADVISOR_HEAD_RATIO ≈ 0.6）
test("AC-2: ADVISOR_HEAD_RATIO 定稿 0.6", () => {
  assert.equal(ADVISOR_HEAD_RATIO, 0.6)
})

// AC-2 — 小预算确定性推演（maxChars=1000——头 12 行 / 尾 4 行 / 中段 14 行 / offset=13）
test("AC-2: 预算推演确定性——头/尾/中段/offset 精确", () => {
  const ys = "y".repeat(46)
  const text = Array.from({ length: 30 }, (_, i) => String(i).padStart(3, "0") + ys).join("\n")
  // 每行 49 字符（len+1 = 50）：头 600 → 12 行；尾 = 1000 − 600 − 200 → 4 行；中段 = 14；total = 1499
  const out = truncateAdvisorResult(text, 1000)
  assert.ok(out.startsWith("000" + ys), "头第一行在")
  assert.ok(out.includes("011" + ys), "头末行（行 11）在")
  assert.ok(out.includes("… (truncated: 14 more lines, 1499 chars total)"), "省略注精确（K=14）")
  assert.ok(!out.includes("018" + ys), "中段行（行 18）不出现")
  assert.ok(out.includes("026" + ys) && out.includes("029" + ys), "尾行在")
  assert.ok(out.endsWith("To see more content, use: read(path, offset=13, limit=200)"), "offset=13（头 12 行续）")
})

// AC-2 — K=0 无假截断：≤ cap 结果原样透传（截断分支不进入——无注无改动）
test("AC-2: K=0 无假截断——≤cap 结果原样透传", () => {
  const text = Array.from({ length: 700 }, (_, i) => `line ${i} ` + "z".repeat(60)).join("\n") // ~48K < 64K
  assert.equal(truncateAdvisorResult(text, MAX_RESULT_CHARS), text)
})

// 边沿——单行超限（行级完整性：整行不可半切——与旧实现同语义：无法装入的行不出现，
// 只报省略注 + 续读提示——不谎报具体内容）
test("边沿: 单行超限——只报省略注与续读提示（行级完整）", () => {
  const text = "z".repeat(70_000)
  const out = truncateAdvisorResult(text, MAX_RESULT_CHARS)
  assert.ok(out.includes("… (truncated: 1 more lines, 70000 chars total)"), "K=1（唯一整行放不进预算）")
  assert.ok(out.includes("read(path, offset=1, limit=200)"), "offset=1 续读提示在")
})
