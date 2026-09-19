/**
 * compaction-echo.test.mjs（VSC 面）— 批 8 ENGINE-DEBT ED-1 同形名用例：恢复面回声归并
 * 端调用点机器验收。设计权威：`docs/core/design/CONTEXT-COMPACTION.md` §6.10 #8 / D-CC19；
 * 批次档 `docs/batches/2026-09-16-engine-debt.md` ED-1。
 *
 * 覆盖判据（VSC 面）：判据 1（病态恢复后零违例——activeLines 调用点）· 判据 3（健康线
 * 零回归）· 判据 4（链式/边界）· 判据 5（会话档零改写——归并纯内存面）。
 *
 * 手法：真槽落盘（saveSessionToSlot → 核 saveSlotData 读-改-写单点）+ activeLines 真读盘
 * （loadSlotFile）——全链路与 async-visibility.test.mjs 同骨架；环境隔离指向 tmp。
 */
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { activeLines } from "../src/extension/panel-session.mjs"
import { newSlot, saveSessionToSlot, slotPath, _setSessionsDirForTest, _resetSessionsDirForTest } from "../src/extension/session-io.mjs"
import { _setConfigPathForTest } from "@thincoder/core/config.mjs"
import { _cwd } from "../src/extension/panel-messages.mjs"
import files from "./files.mjs"

let _tmp

before(async () => {
  _tmp = mkdtempSync(join(tmpdir(), "tc-echo-vsc-"))
  _setConfigPathForTest(join(_tmp, "config.json"))
  _setSessionsDirForTest(join(_tmp, "sessions"))
  await newSlot(_cwd()) // fixture 槽 1（确定性——activeLines 的 slotOverride 用）
})

after(() => {
  _setConfigPathForTest(null)
  _resetSessionsDirForTest()
  try { rmSync(_tmp, { recursive: true, force: true }) } catch { /* ignore */ }
})

/** D-CC18 违例检测器（同源形状）：无 reasoning_content 的 assistant 紧邻 assistant。 */
function violations(h) {
  return h.filter((m, i) => i + 1 < h.length
    && m.role === "assistant" && !m.reasoning_content
    && h[i + 1].role === "assistant")
}

/** 病态机读线夹具：user + 占位 assistant（无 rc）+ 真 assistant（rc + tool_calls）+ tool。 */
function machine() {
  return [
    { role: "user", content: "hello", ts: 1 },
    { role: "assistant", content: "Understood. I'll continue from these notes.", ts: 2 },
    {
      role: "assistant", content: "answer body", reasoning_content: "rc-3", ts: 3,
      tool_calls: [{ id: "call_m2", type: "function", function: { name: "grep", arguments: "{}" } }],
    },
    { role: "tool", tool_call_id: "call_m2", name: "grep", content: "result", ts: 4 },
  ]
}

/** 落盘 + activeLines 真读回。 */
function persisted(machineLine, humanLine = null) {
  saveSessionToSlot(_cwd(), 1, {
    version: 2, cwd: _cwd(), title: "t", activeProvider: "",
    history: humanLine ?? machineLine, contextHistory: machineLine, tasks: [], planMode: false,
  })
  return activeLines({}, 1) // slotOverride 直绑——panel 只需占位（ensureSlot 不触发）
}

test("T-V1 判据 1（VSC 面）：病态机读线落盘 → activeLines 恢复零违例 + 文本空行相接 + 字段原样", () => {
  const m = machine()
  assert.equal(violations(m).length, 1, "落盘夹具自带病态对（正控）")
  const lines = persisted(m)
  assert.deepEqual(violations(lines.contextHistory), [], "恢复后零违例形态")
  assert.equal(lines.contextHistory.length, m.length - 1, "前条移除、其余原位")
  assert.equal(lines.contextHistory[1].content, `${m[1].content}\n\nanswer body`, "文本以空行相接")
  assert.equal(lines.contextHistory[1].reasoning_content, "rc-3")
  assert.equal(lines.contextHistory[1].tool_calls[0].id, "call_m2", "tool_calls 原样保留")
  assert.equal(lines.contextHistory[1].ts, 3, "保留后条原 ts")
})

test("T-V2 判据 3（VSC 面）：健康机读线恢复逐元素 JSON 相等（零回归）", () => {
  const healthy = [
    { role: "user", content: "q", ts: 1 },
    { role: "assistant", content: "a", reasoning_content: "r", ts: 2 },
  ]
  const lines = persisted(healthy)
  assert.equal(lines.contextHistory.length, healthy.length)
  for (let i = 0; i < healthy.length; i++) {
    assert.equal(JSON.stringify(lines.contextHistory[i]), JSON.stringify(healthy[i]), `元素 ${i} 逐字相等`)
  }
})

test("T-V3 判据 4（VSC 面）：链式三连一次跑完 + 人读线不参与归并", () => {
  const chain = [
    { role: "user", content: "q", ts: 1 },
    { role: "assistant", content: "A", ts: 2 },
    { role: "assistant", content: "B", ts: 3 },
    { role: "assistant", content: "C", reasoning_content: "rcC", ts: 4 },
  ]
  const lines = persisted(chain)
  assert.equal(lines.contextHistory.length, 2, "链式归并至不动点")
  assert.equal(lines.contextHistory[1].content, "A\n\nB\n\nC")
  assert.equal(lines.contextHistory[1].reasoning_content, "rcC", "保留链尾字段")
  assert.equal(lines.contextHistory[1].ts, 4, "保留链尾原 ts")
  // 人读线是展示面——不参与归并（设计 §6.10 #8 只扫 contextHistory）
  assert.equal(lines.fullHistory.length, chain.length, "人读线形状零改（逐条原样）")
})

test("T-V4 判据 5：会话档零改写——activeLines 后磁盘 contextHistory 仍是原病态数组", () => {
  const m = machine()
  persisted(m)
  const disk = JSON.parse(readFileSync(slotPath(_cwd(), 1), "utf8"))
  assert.equal(violations(disk.contextHistory).length, 1, "磁盘原样保留病态形态（归并纯内存面）")
  assert.deepEqual(disk.contextHistory, m, "磁盘机读线逐字同落盘输入")
})

test("机检：本档已登记 test/files.mjs（接线硬项）", () => {
  assert.ok(files.includes("test/compaction-echo.test.mjs"), "本档在册（清单为显式列表）")
})
