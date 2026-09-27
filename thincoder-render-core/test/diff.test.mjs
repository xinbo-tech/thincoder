/**
 * diff.test.mjs — 核纯函数层：行级 diff（`lineDiff` / `renderDiff`）。
 *
 * 来源 = `thincoder-vscode/webview/diff.js` 逐字搬迁（R1；唯一逐字性例外 = 引用行一条，
 * 见批档 §5——`escHtml` 由核内 `md.mjs` 的 `esc` 供给，函数体与 ui.js 原档逐字同构）。
 * 设计权威 = `docs/render-core/design/RENDER-CORE.md` §3 行 12（核）/ §4 行 10（桌面不消费）。
 * 预期值按源档算法逐行推演（前缀 → 后缀 → 中段贪心配对）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { lineDiff, renderDiff } from "../diff.mjs"

test("lineDiff：中段单删单增（same/del/add/same）", () => {
  assert.deepEqual(lineDiff("a\nb\nc", "a\nx\nc"), [
    { type: "same", text: "a" },
    { type: "del", text: "b" },
    { type: "add", text: "x" },
    { type: "same", text: "c" },
  ])
})

test("lineDiff：公共前缀与后缀保持 same", () => {
  assert.deepEqual(lineDiff("a\nb\nc\nd", "a\nB\nc\nd"), [
    { type: "same", text: "a" },
    { type: "del", text: "b" },
    { type: "add", text: "B" },
    { type: "same", text: "c" },
    { type: "same", text: "d" },
  ])
})

test("lineDiff：全同 ⇒ 全 same", () => {
  assert.deepEqual(lineDiff("a\nb", "a\nb"), [
    { type: "same", text: "a" },
    { type: "same", text: "b" },
  ])
})

test("lineDiff：空面边界（旧空 ⇒ 全 add / 新空 ⇒ 全 del / 双空 ⇒ 空表）", () => {
  assert.deepEqual(lineDiff("", "a"), [{ type: "add", text: "a" }])
  assert.deepEqual(lineDiff("a", ""), [{ type: "del", text: "a" }])
  assert.deepEqual(lineDiff("", ""), [])
})

test("renderDiff：三类行 HTML 形（diff-line / diff-prefix）", () => {
  const html = renderDiff([
    { type: "same", text: "a" },
    { type: "del", text: "b" },
    { type: "add", text: "c" },
  ])
  assert.equal(
    html,
    '<div class="diff-line diff-same"><span class="diff-prefix"> </span>a</div>' +
    '<div class="diff-line diff-del"><span class="diff-prefix">-</span>b</div>' +
    '<div class="diff-line diff-add"><span class="diff-prefix">+</span>c</div>',
  )
})

test("renderDiff：四字符转义（& < > \"）——esc 供给自核内 md.mjs", () => {
  assert.equal(
    renderDiff([{ type: "add", text: 'x <b> & "q"' }]),
    '<div class="diff-line diff-add"><span class="diff-prefix">+</span>x &lt;b&gt; &amp; &quot;q&quot;</div>',
  )
  assert.equal(
    renderDiff([{ type: "del", text: "</script><img src=x onerror=y>" }]),
    '<div class="diff-line diff-del"><span class="diff-prefix">-</span>&lt;/script&gt;&lt;img src=x onerror=y&gt;</div>',
    "注入样本 ⇒ 字面文本",
  )
})

test("renderDiff：空/缺省输入 ⇒ 占位行（单引号形态逐字保持）", () => {
  assert.equal(renderDiff([]), "<div class='diff-line diff-same'>…</div>")
  assert.equal(renderDiff(null), "<div class='diff-line diff-same'>…</div>")
  assert.equal(renderDiff(undefined), "<div class='diff-line diff-same'>…</div>")
})

test("renderDiff：空文本行保高（text || \" \" 兜底）", () => {
  assert.equal(
    renderDiff([{ type: "same", text: "" }]),
    '<div class="diff-line diff-same"><span class="diff-prefix"> </span> </div>',
  )
})
