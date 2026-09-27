/**
 * lib.test.mjs — 核纯函数层：`lib` 族（tailTruncate / capText / MAX_TOOL_OUTPUT / fmtK / fmtTime /
 * patchLineType / toolFailureStatus / isToolFailure）。
 *
 * 来源 = `thincoder-vscode/webview/lib.js` 逐字搬迁（R1）；设计权威 =
 * `docs/render-core/design/RENDER-CORE.md` §3 行 20（核）/ §5（导出面）。
 * 判据锚 = 源档头注（F-W16 状态位三成员闭集 / 独立成行边界 / `(stopped)` 不入判据）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { tailTruncate, capText, MAX_TOOL_OUTPUT, fmtK, fmtTime, patchLineType, toolFailureStatus, isToolFailure } from "../lib.mjs"

test("tailTruncate：未超限原样 / 超限向前对齐行边界 / 无换行硬切", () => {
  assert.equal(tailTruncate("short", 2000), "short")
  assert.equal(tailTruncate("aaaa\nbbbb", 5), "bbbb", "换行后内容起切（向前对齐）")
  assert.equal(tailTruncate("hello world", 5), "world", "无换行 ⇒ 尾部硬切")
  assert.equal(tailTruncate(null), "", "falsy 入参 ⇒ 空串")
})

test("tailTruncate：仅尾换行边界（不切到空串）", () => {
  // start 后唯一换行 = 末字符 ⇒ 不得 slice 成 ""（源档 `snap + 1 < t.length` 判据）
  assert.equal(tailTruncate("aaaaa\n", 5), "aaaa\n")
})

test("capText：未超限原样 / 超限截头 + 提示 / 自定义提示", () => {
  assert.equal(capText("abc", 10), "abc")
  assert.equal(capText("abcdef", 3), "abc…(输出过长已截断)")
  assert.equal(capText("abcdef", 3, "…"), "abc…")
  assert.equal(capText(null, 3), "")
  assert.equal(MAX_TOOL_OUTPUT, 64 * 1024, "显示上限 = 64K（源档常量）")
})

test("fmtK：三档紧凑计数", () => {
  assert.equal(fmtK(0), "0")
  assert.equal(fmtK(999), "999")
  assert.equal(fmtK(1000), "1.0k")
  assert.equal(fmtK(1500), "1.5k")
  assert.equal(fmtK(9999), "10.0k")
  assert.equal(fmtK(10000), "10k")
  assert.equal(fmtK(12345), "12k")
})

test("fmtTime：HH:MM 零填充（本地时区构造/读取同源，跨时区确定）", () => {
  assert.equal(fmtTime(new Date(2026, 0, 1, 9, 5)), "09:05")
  assert.equal(fmtTime(new Date(2026, 0, 1, 23, 59)), "23:59")
  assert.equal(fmtTime(new Date(2026, 0, 1, 0, 0)), "00:00")
})

test("patchLineType：文件头中性 / +- 染色 / 三字符边界", () => {
  assert.equal(patchLineType("+++ b/x.mjs"), "same")
  assert.equal(patchLineType("--- a/x.mjs"), "same")
  assert.equal(patchLineType("+added"), "add")
  assert.equal(patchLineType("-removed"), "del")
  assert.equal(patchLineType(" context"), "same")
  assert.equal(patchLineType("+++x"), "add", "无空格 ⇒ 按内容行染色（非文件头）")
  assert.equal(patchLineType("---x"), "del", "同上")
  assert.equal(patchLineType(""), "same")
})

test("toolFailureStatus：三成员闭集（独立成行才触发 / exit 0 与非独立行不触发）", () => {
  assert.equal(toolFailureStatus("(exit code 1)"), "(exit code 1)")
  assert.equal(toolFailureStatus("(exit code 0)"), "")
  assert.equal(toolFailureStatus("(killed: timeout 400ms)"), "(killed: timeout 400ms)")
  assert.equal(toolFailureStatus("(spawn failed)"), "(spawn failed)")
  assert.equal(toolFailureStatus("ok\n(exit code 2)\nrest"), "(exit code 2)", "多行中的独立状态行")
  assert.equal(toolFailureStatus("inline (exit code 1) mention"), "", "非独立成行不触发")
  assert.equal(toolFailureStatus("(exit code 1) and more"), "", "行内带尾随文本不触发")
  assert.equal(toolFailureStatus("(stopped)"), "", "(stopped) 不在判据集内")
  assert.equal(toolFailureStatus(""), "")
  assert.equal(toolFailureStatus(null), "")
})

test("isToolFailure：Error 前缀（半/全角）∪ 状态位；正文提及不误报", () => {
  assert.equal(isToolFailure("Error: boom"), true)
  assert.equal(isToolFailure("Error：中文冒号"), true)
  assert.equal(isToolFailure("  Error: padded"), true, "trim 后判前缀")
  assert.equal(isToolFailure("(exit code 1)"), true)
  assert.equal(isToolFailure("(killed: user interrupted)"), true, "用户中断 ⇒ 同判失败")
  assert.equal(isToolFailure("text mentions Error: mid"), false, "非行首前缀不误报")
  assert.equal(isToolFailure("all good"), false)
  assert.equal(isToolFailure(""), false)
  assert.equal(isToolFailure(null), false)
})
