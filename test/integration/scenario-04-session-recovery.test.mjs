/**
 * scenario-04-session-recovery.test.mjs — 集成场景 ④「会话恢复 / 中断续跑」VSC 实例。
 *
 * 设计权威：`docs/design/TESTING.md` §4 场景表（本端驱动面 = 槽位文件 + 恢复呈现面（首窗 /
 * 配对））；共享语义源 = CLI 侧 `docs/design/TESTING.md` §5.4（三态：正常 / 边界 / 错误）。
 * 业务语气：断言只写业务可观察结果（恢复出来的历史与计数 / 会话列表读数 / 落盘现场），
 * 不锁私有结构形状。
 *
 * 三态：
 *   正常 —— 写入一个多轮会话（真槽文件）→ 重新载入：历史完整、会话身份（sessionStart）
 *           保留、会话列表计数不重置（turnCount/messageCount）、首窗帧序列完整；
 *   边界 —— 中断半程落盘（主档损坏 + `.tmp` 完好）→ 恢复已知前缀；跨轮切断的历史
 *           （无结果 tool_call + 孤儿 tool）→ 帧配对不重复不崩；
 *   错误 —— 损坏 / 缺档 → 干净回退（不崩、旧现场轮转保留 .corrupted、缺失走建新会话）。
 */
import { test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { _setSessionsDirForTest, _resetSessionsDirForTest, slotPath } from "../../src/extension/session-slots.mjs"
import { newSlotData } from "../../src/extension/session-slot-write.mjs"
import { loadSlot, saveSessionToSlot, listSlots, newSlot } from "../../src/extension/session-io.mjs"
import { historyWindow } from "../../src/extension/history-window.mjs"

const CWD = "/proj/integration-session-recovery"
let sessionsDir

beforeEach(() => {
  sessionsDir = mkdtempSync(join(tmpdir(), "tc-integ-rec-"))
  _setSessionsDirForTest(sessionsDir)
})
afterEach(() => {
  _resetSessionsDirForTest()
  rmSync(sessionsDir, { recursive: true, force: true })
})

/** 一轮问答消息（业务形状：user + assistant 文本帧）。 */
const turn = (i) => ([
  { role: "user", content: `问题 ${i}`, ts: 1000 + i * 10 },
  { role: "assistant", content: `回答 ${i}`, ts: 1000 + i * 10 + 1 },
])

test("④ 正常：会话写入 → 重新载入——历史完整、sessionStart 保留、列表计数不重置、首窗帧完整", () => {
  const data = newSlotData(CWD)
  data.sessionStart = "2026-09-11T00:00:00.000Z"
  data.history = [...turn(1), ...turn(2), ...turn(3)]
  data.contextHistory = [...data.history]
  saveSessionToSlot(CWD, 1, data)

  // 重新载入（新进程/重启语义——只经磁盘）
  const back = loadSlot(CWD, 1)
  assert.ok(back, "槽文件可重新载入")
  assert.equal(back.history.length, 6, "历史完整（3 轮问答逐条在）")
  assert.deepEqual(back.history.map((m) => m.content), data.history.map((m) => m.content), "顺序与内容逐条一致")
  assert.equal(back.sessionStart, "2026-09-11T00:00:00.000Z", "会话身份保留（不重置、不重打点）")

  // 会话列表读数（面板恢复时用户看到的计数）
  const slots = listSlots(CWD)
  const s1 = slots.find((s) => s.slot === 1)
  assert.ok(s1, "会话列表含该槽")
  assert.equal(s1.turnCount, 3, "轮数不重置")
  assert.equal(s1.messageCount, 6, "消息数不重置")
  assert.equal(s1.firstMessage, "问题 1", "首条用户消息可读")

  // 恢复呈现：首窗（末页）帧完整——每轮一条 user + 一条 assistant
  const win = historyWindow(back.history, null)
  assert.deepEqual(win.messages.map((m) => m.kind), ["user", "assistant", "user", "assistant", "user", "assistant"], "首窗帧序列完整")
  assert.equal(win.hasOlder, false, "单页内无更早页")
  assert.deepEqual(win.messages.filter((m) => m.kind === "user").map((m) => m.text), ["问题 1", "问题 2", "问题 3"], "用户消息文本与全局序（idx 单调）")
  assert.deepEqual(win.messages.filter((m) => m.kind === "assistant").map((m) => m.text), ["回答 1", "回答 2", "回答 3"])
})

test("④ 边界：中断半程落盘（主档损坏 + .tmp 完好）→ 恢复已知前缀；坏档轮转保留", () => {
  const p = slotPath(CWD, 1)
  // 中断现场：主档被截断（写一半），旁路 .tmp 是完整落盘（会话数据形状）
  const good = { ...newSlotData(CWD), sessionStart: "2026-09-11T01:00:00.000Z", history: [...turn(1), { role: "user", content: "半程问题" }] }
  writeFileSync(p, '{"version":2,"cwd":"' + CWD + '","history":[{"role":"user","content":"写一半', "utf8")
  writeFileSync(`${p}.tmp`, JSON.stringify(good), "utf8")

  const back = loadSlot(CWD, 1)
  assert.ok(back, "从 .tmp 恢复而非判空")
  assert.deepEqual(back.history.map((m) => m.content), ["问题 1", "回答 1", "半程问题"], "已知前缀完整保留")
  assert.ok(existsSync(`${p}.corrupted`), "损坏主档轮转保留（.corrupted——现场不丢）")
  assert.equal(loadSlot(CWD, 1).history.length, 3, "恢复后主档即为可用态（后续载入稳定）")
})

test("④ 边界：跨轮切断历史（无结果 tool_call + 孤儿 tool）→ 帧配对无重复、孤儿保底一次", () => {
  const history = [
    { role: "user", content: "做一件事", ts: 1 },
    // 被切断的助手帧：声明了 tool_call，但结果从未落线（进程中断）
    { role: "assistant", content: null, tool_calls: [{ id: "c1", type: "function", function: { name: "read", arguments: "{}" } }], ts: 2 },
    { role: "user", content: "继续", ts: 3 },
    { role: "assistant", content: "好了", ts: 4 },
    // 孤儿 tool（owner 已被压缩/丢失）——必须保底渲染一次，不重复
    { role: "tool", tool_call_id: "ghost", name: "read", content: "orphan output", ts: 5 },
  ]
  const win = historyWindow(history, null)
  const kinds = win.messages.map((m) => m.kind)
  assert.deepEqual(kinds, ["user", "assistant", "user", "assistant", "tool"], "逐条落帧：无结果调用随帧渲染、孤儿一次、零重复")
  const frame = win.messages[1]
  assert.equal(frame.tools.length, 1, "帧内工具卡 1 张")
  assert.equal(frame.tools[0].name, "read")
  assert.equal(frame.tools[0].result, null, "无结果调用 result 为 null（渲染为未完成卡）")
  assert.equal(win.messages[4].name, "read", "孤儿 tool 顶层保底")
  assert.equal(win.messages[4].text, "orphan output")
  assert.deepEqual(win.messages.map((m) => m.idx), [0, 1, 2, 3, 4], "全局 idx 不重编号（分页锚点稳定）")
})

test("④ 错误：损坏档 → 干净回退（判空 + 轮转 + 不崩）；缺档 → 建新会话可写可读", () => {
  const p = slotPath(CWD, 1)
  writeFileSync(p, "{ this is not json", "utf8")
  const broken = loadSlot(CWD, 1)
  assert.equal(broken, null, "损坏档判空（不抛出）")
  assert.ok(existsSync(`${p}.corrupted`), "损坏现场轮转保留")
  assert.equal(existsSync(p), false, "损坏主档已让位（不回写半个现场）")

  // 缺档回退：建新会话 → 立即可写可读（干净起点）
  const slot = newSlot(CWD)
  const fresh = loadSlot(CWD, slot)
  assert.ok(fresh, "新会话槽立即可读")
  assert.deepEqual(fresh.history, [], "新会话起点干净")
  assert.equal(fresh.version, 2)

  // 写保护：损坏文件不会被静默覆盖——保存先轮转（损坏现场不丢失）
  const p2 = slotPath(CWD, 2)
  writeFileSync(p2, "corrupt-again", "utf8")
  saveSessionToSlot(CWD, 2, { ...newSlotData(CWD), history: [...turn(9)] })
  assert.equal(readFileSync(`${p2}.corrupted`, "utf8"), "corrupt-again", "保存前轮转损坏档（原文保留在 .corrupted）")
  assert.equal(loadSlot(CWD, 2).history.length, 2, "新内容正常落盘")
})

test("④ 错误：新版文件（version > 2）→ 判空且不触碰（不动别人的文件）", () => {
  const p = slotPath(CWD, 3)
  const newer = { version: 3, cwd: CWD, history: [{ role: "user", content: "future" }] }
  writeFileSync(p, JSON.stringify(newer), "utf8")
  assert.equal(loadSlot(CWD, 3), null, "新版文件判空（本端读不懂就不读）")
  assert.equal(readFileSync(p, "utf8"), JSON.stringify(newer), "原文未被改写/轮转（安全姿势）")
})
