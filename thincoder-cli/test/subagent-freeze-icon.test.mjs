/**
 * subagent-freeze-icon.test.mjs — M5（2026-09-20 端差·显示面消差批 批 3）用例：
 * CLI 冻结子代理头图标三态互斥（缺陷本体 = 冻结头 `[✓ … · stopped]` 图标—动词相抵）。
 * 面判定：CLI 呈现面缺 `⏹` ⇒ 反向对齐 VSC（`thincoder-vscode/webview/activity-view.js:46-49`
 * cancelled → `⏹` + stopped）；§2.10.5(#5) 裁定 = `render-segments.mjs` 单点
 * （`subagent-panel.mjs` 零改——该头无 verb 面、无互斥形态）。
 * 手法：纯函数缝——直驱 render-segments.mjs `frozenSubSeg`（冻结段入口，无 TTY / 无渲染循环）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { frozenSubSeg } from "../src/tui/render-segments.mjs"

const plain = (s) => String(s).replace(/\x1b\[[0-9;]*m/g, "")

/** 冻结头读取面（state 最小 = 该段签名读面：foldEnabled / expandedBlocks / _foldScroll）。 */
function frozenHeader(sub) {
  const state = { lines: [], subTasks: {}, expandedBlocks: new Set(), foldEnabled: true }
  const rows = frozenSubSeg(state, { _frozenSubTask: sub }, 0, 120, 40)
  return plain(rows.map((r) => r.text).join("\n"))
}

/** 冻结块夹具（字段面 = subagent-blocks.mjs:104 条目 + subagent-freeze.mjs:212-225 冻结写面）。 */
const frozenSub = (over = {}) => ({
  key: "eng-coder#2", role: "eng-coder", model: "glm-5.3", async: true,
  started: Date.now() - 12_000, doneAt: Date.now(), done: true, stopped: false,
  approval: null, maxTurns: 0, lastError: null, blocks: [],
  ...over,
})

test("M5 三态互斥：stopped ⇒ `⏹` + stopped（禁 `✓`）；done ⇒ `✓` + done；approval ⇒ `⏸` 优先", () => {
  const stopped = frozenHeader(frozenSub({ stopped: true }))
  assert.ok(stopped.includes("⏹"), `stopped 头含 ⏹（实读：${stopped}）`)
  assert.ok(/\[⏹ eng-coder#2[^\]]*· stopped \d+s\]/.test(stopped), `stopped 头形 = [⏹ key … · stopped Ns]（实读：${stopped}）`)
  assert.ok(!stopped.includes("✓"), "stopped 头不得含 ✓（图标—动词相抵 = 本项缺陷本体）")

  const done = frozenHeader(frozenSub())
  assert.ok(/\[✓ eng-coder#2[^\]]*· done \d+s\]/.test(done), `done 头形 = [✓ key … · done Ns]（实读：${done}）`)
  assert.ok(!done.includes("⏹"), "done 头不得含 ⏹（三态互斥反向）")

  const approval = frozenHeader(frozenSub({ approval: "bash", stopped: true }))
  assert.ok(approval.includes("⏸"), `approval 优先于 stopped（实读：${approval}）`)
  assert.ok(!approval.includes("⏹"), "approval 态不显 ⏹（⏸ 独占）")
})

test("M5 边界：stopped + lastError 注记同帧 → `⏹` 与注记并存（errPart 面零改）；waiting/queued 注记面零改", () => {
  const noted = frozenHeader(frozenSub({ stopped: true, lastError: "stopped by user — work may be partial" }))
  assert.ok(noted.includes("⏹"), "⏹ 在位（注记同帧不夺图标）")
  assert.ok(noted.includes("— stopped by user — work may be partial"), "注记面（errPart）零改")
  const queued = frozenHeader(frozenSub({ queued: true, stopped: true }))
  assert.ok(queued.includes("· waiting"), "queued 冻结块 waiting 注记面零改")
  assert.ok(queued.includes("⏹"), "queued + stopped 同帧仍显 ⏹")
})

test("M5 段缓存签名零回归：同 sub 二次读同输出（stopped 旗标在冻结前已定——无 stale 路径）", () => {
  const state = { lines: [], subTasks: {}, expandedBlocks: new Set(), foldEnabled: true }
  const line = { _frozenSubTask: frozenSub({ stopped: true }) }
  const first = plain(frozenSubSeg(state, line, 0, 120, 40).map((r) => r.text).join("\n"))
  const second = plain(frozenSubSeg(state, line, 0, 120, 40).map((r) => r.text).join("\n"))
  assert.equal(second, first, "段缓存命中路径与首读同形")
  assert.ok(second.includes("⏹"), "缓存命中不回落 ✓")
})
