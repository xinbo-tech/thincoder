/**
 * turn-across-segments.test.mjs — TURN-ACROSS-SEGMENTS（设计档 docs/design/
 * TURN-CAP-CONTINUE.md §19.1-19.8）用例表 1:1：T1-T7。
 * T1-T4 编号帧向量（段 1 首/末轮 · 续跑段首轮 · 第 3 段中段）· T5 不变式扫描（限可达域）·
 * T6-T7 消费面解析（turn/approval 同帧——显示面零改动）。
 * AC 映射：AC1←T1-T5 · AC2←T6 · AC4←T7 · AC5←T6（AC3 / AC6 原由源码锚用例覆盖——已随
 * 2026-09-12 散文锚退役批退役，行为面由 T1-T7 承载）。
 * 用例面声明（设计 §19.6）：接缝式（无 runAgent 直驱先例）——纯函数缝 + TUI routing 缝；
 * 全量回归缝 = `npm test` / `node test/run-full.mjs`（验收命令）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { turnFrame } from "../src/agent/helpers.mjs"
import { routeSubToken } from "../src/tui/subagent-blocks.mjs"
import { renderSubagentPanel } from "../src/tui/subagent-panel.mjs"

const noop = () => {}
const plain = (s) => String(s).replace(/\x1b\[[0-9;]*m/g, "")

/** 最小 TUI state（routing/面板读取面——同 subagent-tail-merge.test.mjs 夹具）。 */
const mkState = () => ({ lines: [], subTasks: {}, expandedBlocks: new Set(), foldEnabled: true, _frozenSubKeys: new Set() })

// ─── T1-T4：编号帧向量（正常 / 边界）────────────────────────────────────────

test("T1 段 1 首轮（正常）：turnFrame(1, 0, 100) → {turn: 1, maxTurns: 100}", () => {
  assert.deepEqual(turnFrame(1, 0, 100), { turn: 1, maxTurns: 100 })
})

test("T2 段 1 末轮（正常）：turnFrame(100, 99, 100) → {turn: 100, maxTurns: 100}", () => {
  assert.deepEqual(turnFrame(100, 99, 100), { turn: 100, maxTurns: 100 })
})

test("T3 续跑段首轮（边界——缺陷点）：turnFrame(101, 0, 100) → {turn: 101, maxTurns: 200}——不回到 1", () => {
  const f = turnFrame(101, 0, 100)
  assert.deepEqual(f, { turn: 101, maxTurns: 200 })
  assert.notEqual(f.turn, 1, "续跑段首轮编号不重置")
})

test("T4 第 3 段中段（边界）：turnFrame(238, 37, 100) → {turn: 238, maxTurns: 300}", () => {
  assert.deepEqual(turnFrame(238, 37, 100), { turn: 238, maxTurns: 300 })
})

// ─── T5：不变式扫描（边界——限可达域）───────────────────────────────────────

test("T5 不变式扫描（边界）：限可达域内恒 turn ≥ 1 · turn ≤ maxTurns · maxTurns = 段前累计 + 段预算", () => {
  for (const seq of [1, 100, 101, 250]) {
    for (const max of [40, 100]) {
      for (let turn = 0; turn < max; turn++) {
        // 可达域：段内 turn ∈ [0, max)；该轮累计序数 seq ≥ turn + 1（段前累计 ≥ 0）
        if (seq < turn + 1) continue
        const f = turnFrame(seq, turn, max)
        const at = `seq=${seq} turn=${turn} max=${max}`
        assert.ok(f.turn >= 1, `${at}: turn ≥ 1`)
        assert.ok(f.turn <= f.maxTurns, `${at}: turn ≤ maxTurns（不越累计预算）`)
        assert.equal(f.maxTurns, seq - turn - 1 + max, `${at}: 差额项 = 段前累计`)
      }
    }
  }
})

// ─── T6：显示面零改动（正常——消费点机械证明）────────────────────────────────

test("T6 显示面零改动（正常）：注入 ⟦ev⟧turn 101/200 → 块 turn=101/maxTurns=200；面板头含 turn 101/200", () => {
  const state = mkState()
  routeSubToken(state, "explore#9/⟦ev⟧turn\x1e101\x1e200\x1ellm\x1e", noop)
  const sub = state.subTasks["explore#9"]
  assert.equal(sub.turn, 101, "块 turn = 累计值（解析点零改动）")
  assert.equal(sub.maxTurns, 200, "块 maxTurns = 累计值")
  assert.equal(sub.approval, null, "turn 事件清审批态（既有语义）")
  const panel = plain(renderSubagentPanel(state, 100, 40).map((r) => r.text).join("\n"))
  assert.ok(panel.includes("turn 101/200"), "面板头逐字渲染累计编号")
})

// ─── T7：approval 同帧（正常——D-19b）────────────────────────────────────────

test("T7 approval 同帧（正常）：approval 载荷与 turn 帧同值 → 块编号不回落段内值", () => {
  const state = mkState()
  routeSubToken(state, "eng-coder#7/⟦ev⟧turn\x1e101\x1e200\x1ellm\x1e", noop)
  routeSubToken(state, "eng-coder#7/⟦ev⟧approval\x1e101\x1e200\x1eapproval\x1eread", noop)
  const sub = state.subTasks["eng-coder#7"]
  assert.equal(sub.turn, 101, "approval 后编号保持累计值（dispatch 读同一对字段——同帧）")
  assert.equal(sub.maxTurns, 200, "maxTurns 同帧")
  assert.equal(sub.approval, "read", "等待审批态同帧置位")
})
