/**
 * subagent-scheduler.test.mjs — 文件域归一化边界（CODE-HARDENING-BATCH §2.7，2026-09-08）：
 * normalizeFileList 尾随空格目录声明（"test/ "、"test\ "）→ throw 目录声明错误（fail-closed）。
 * 纯单元（无 io——目录检测分支用字符串形态，不触真实 fs）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { resolve } from "node:path"
import { normalizeFileList } from "../src/agent-tools/subagent-scheduler.mjs"

test("2.7 尾随空格目录声明（\"test/ \"）被识别为目录声明 throw", () => {
  assert.throws(() => normalizeFileList(["test/ "], "C:/w"), /directory declarations are not supported/)
  assert.throws(() => normalizeFileList(["a/b/ "], "C:/w"), /directory declarations are not supported/)
})

test("2.7 尾随空格反斜杠目录声明（\"test\\ \"）同拒（win32 形态）", () => {
  assert.throws(() => normalizeFileList(["test\\ "], "C:/w"), /directory declarations are not supported/)
})

test("2.7 无尾随空格不受影响：文件级路径归一化通过，纯目录形态照旧拒", () => {
  assert.throws(() => normalizeFileList(["test/"], "C:/w"), /directory declarations are not supported/)
  assert.deepEqual(normalizeFileList(["src/a.mjs"], "C:/w"), [resolve("C:/w", "src/a.mjs")])
})
