/**
 * turn-across-segments.test.mjs — TURN-ACROSS-SEGMENTS（设计档 docs/design/
 * TURN-CAP-CONTINUE.md §19.1-19.8）用例表 1:1：T1-T8。
 * T1-T4 编号帧向量（段 1 首/末轮 · 续跑段首轮 · 第 3 段中段）· T5 不变式扫描（限可达域）·
 * T6-T7 消费面解析（turn/approval 同帧——显示面零改动）· T8 源码锚（段内帽零改动 ·
 * 编号帧唯一权威 · 复位点唯一）。
 * AC 映射：AC1←T1-T5 · AC2←T6/T8 · AC3←T8 · AC4←T7/T8 · AC5←T6 · AC6←T8。
 * 用例面声明（设计 §19.6）：接缝式（无 runAgent 直驱先例）——纯函数缝 + TUI routing 缝 +
 * 源码锚缝；全量回归缝 = `npm test` / `node test/run-full.mjs`（验收命令，见 T8 注释）。
 * 扫① 削段注（2026-09-11 TEST-LIFECYCLE——设计档 TESTING.md §7.3 点名档）：T8 删 2 条负向旧形锚
 * （状态行旧取值面 / 旧载荷字面面——新型由 T6/T7 行为覆盖）；余 7 条接线/契约锚保留（CLI 无
 * VSC 的 T9/T10 行为档——无行为覆盖的接线锚不照搬 VSC 全删）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { turnFrame } from "../src/agent/helpers.mjs"
import { routeSubToken } from "../src/tui/subagent-blocks.mjs"
import { renderSubagentPanel } from "../src/tui/subagent-panel.mjs"

const agentSrc = readFileSync(new URL("../src/agent.mjs", import.meta.url), "utf8")
const dispatchSrc = readFileSync(new URL("../src/agent/dispatch.mjs", import.meta.url), "utf8")
const noop = () => {}
const plain = (s) => String(s).replace(/\x1b\[[0-9;]*m/g, "")

/** 最小 TUI state（routing/面板读取面——同 subagent-tail-merge.test.mjs 夹具）。 */
const mkState = () => ({ lines: [], subTasks: {}, expandedBlocks: new Set(), foldEnabled: true, _frozenSubKeys: new Set() })

/** needle 是否位于 header 块（首对花括号）范围内——源码锚断言用。 */
function insideBlock(src, header, needle) {
  const start = src.indexOf(header)
  if (start < 0) return false
  const open = src.indexOf("{", start)
  let depth = 0
  for (let i = open; i < src.length; i++) {
    if (src[i] === "{") depth++
    else if (src[i] === "}") {
      depth--
      if (depth === 0) {
        const at = src.indexOf(needle, open)
        return at > open && at < i
      }
    }
  }
  return false
}

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

// ─── T8：源码锚（错误 / 回归——段内帽零改动 + 编号权威唯一）──────────────────

test("T8 源码锚（错误/回归）：段内帽零改动 + 编号帧唯一权威 + 复位点唯一（全量回归 = npm test 缝）", () => {
  // 段内帽判定零改动（N6/AC6）：循环条件与抛点原样（turn = 99 < 100 继续跑；turn = 100 出循环）
  assert.ok(agentSrc.includes("for (let turn = 0; turn < maxTurns; turn++)"), "段内帽循环条件零改动")
  assert.ok(agentSrc.includes("throw new ContinueError(maxTurns)"), "ContinueError(maxTurns) 抛点零改动（段预算载荷）")
  // 编号帧赋值（AC2 装配面——fail-when-unchanged）：循环内调用 turnFrame
  const loopStart = agentSrc.indexOf("for (let turn = 0; turn < maxTurns; turn++)")
  assert.ok(agentSrc.indexOf("turnFrame(", loopStart) > loopStart, "循环内编号帧赋值（turnFrame 调用）")
  // 发射行（AC2）：取 agent 级编号字段 + 4 段 + phase 形态驻留
  assert.ok(
    agentSrc.includes("⟦ev⟧turn\\x1e${agent._currentTurn}\\x1e${agent._maxTurns}\\x1ellm\\x1e"),
    "⟦ev⟧turn 发射行读帧值（4 段 + phase=llm 形态驻留）",
  )
  // 复位点（AC3）：全档唯一，且位于 if (!resume) 块内
  assert.equal((agentSrc.match(/_turnSeq = 0/g) ?? []).length, 1, "全档唯一复位点")
  assert.ok(insideBlock(agentSrc, "if (!resume) {", "_turnSeq = 0"), "复位位于 !resume 块内")
  // approval 行（AC4——零改动且读同对字段；T7 同帧的生成侧源）
  assert.ok(
    dispatchSrc.includes("⟦ev⟧approval\\x1e${agent._currentTurn ?? 0}\\x1e${agent._maxTurns ?? 0}\\x1eapproval\\x1e"),
    "approval 发射行读同对字段（同帧源）",
  )
})
