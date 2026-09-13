/**
 * session-resume.test.mjs — 集成场景 ④（TESTING.md §5.4——会话恢复 / 中断续跑）。
 *
 * 业务语义：进程被杀 / 会话文件损坏之后，用户重新打开同一个项目目录——累计的会话
 * 记录（帧数与帧内容、会话身份）必须还在，中断的回合要被干净接上，坏档要干净回退
 * 而不是崩溃。
 * 驱动 = 真会话文件（真 session 模块 + 隔离 sessions 目录；错误态另跑真子进程走
 * HOME 重定向）+ 真读写面（saveSession / resumeSlot / applySession）。
 */
import { test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync, readdirSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { createAgent } from "../../src/agent.mjs"
import { pushReal } from "../../src/context.mjs"
import { saveSession, resumeSlot, applySession, newSession, sessionDescriptor } from "../../src/session.mjs"
import { repairHistory } from "../../src/agent/helpers.mjs"
import { restoreLines, createLoadOlder } from "../../src/tui/startup.mjs"
import { _setSessionsDirForTest, _resetSessionsDirForTest, slotPath } from "../../src/session-slots.mjs"

const __here = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__here, "..", "..")

let sessionsDir
beforeEach(() => {
  sessionsDir = mkdtempSync(join(tmpdir(), "tc-int-sess-"))
  _setSessionsDirForTest(sessionsDir)
})
afterEach(() => {
  _resetSessionsDirForTest()
  try { rmSync(sessionsDir, { recursive: true, force: true }) } catch { /* ignore */ }
})

/** 一个已登录会话形态的最小 agent（真 session 读写面消费的字段）。 */
function mkAgent(cwd) {
  return createAgent({
    provider: { name: "mock", model: "mock-model", baseURL: "http://127.0.0.1:1/v1", apiKey: "k" },
    tools: [],
    config: { agent: { engineering: false } },
    cwd,
    memory: null,
    sessionStart: "2026-09-11T00:00:00.000Z",
  })
}

const relay = (agent, msg) => pushReal(agent, msg)

test("④ 正常：写入含计数的会话 → 重载 —— 计数不重置、历史完整", (t) => {
  const cwd = mkdtempSync(join(tmpdir(), "tc-int-sess-proj-"))
  t.after(() => { try { rmSync(cwd, { recursive: true, force: true }) } catch { /* ignore */ } })

  const agent = mkAgent(cwd)
  relay(agent, { role: "user", content: "first request" })
  relay(agent, { role: "assistant", content: "first answer" })
  relay(agent, { role: "user", content: "second request" })
  relay(agent, { role: "assistant", content: "second answer" })
  agent.tasks = [{ title: "ship it", status: "in_progress" }]
  const frameCount = agent._fullHistory.length
  assert.equal(frameCount, 4)

  saveSession(agent) // 真落盘（槽文件原子写）
  const disk = JSON.parse(readFileSync(slotPath(cwd, agent._slot), "utf8"))
  assert.equal(disk.history.length, frameCount, "读面数值：盘上帧数 = 本次会话帧数")

  // "kill → restart"：新进程从同一目录恢复
  const fresh = mkAgent(cwd)
  const { slot, data } = resumeSlot(cwd)
  assert.ok(data, "会话记录存在并被恢复")
  applySession(fresh, data)
  assert.equal(fresh.history.length, frameCount, "重载后帧数不重置")
  assert.deepEqual(
    fresh.history.map((m) => m.content),
    ["first request", "first answer", "second request", "second answer"],
    "历史完整——逐帧顺序与内容一致",
  )
  assert.equal(fresh._sessionStart, agent._sessionStart, "会话身份（sessionStart）随恢复保留")
  assert.deepEqual(fresh.tasks, [{ title: "ship it", status: "in_progress" }], "任务面板状态随恢复保留")
  assert.equal(slot, agent._slot, "恢复的是原会话槽")
})

test("④ 边界：中断半程落盘 → 恢复 —— 已知前缀保留、无重复帧、孤儿被干净接上", (t) => {
  const cwd = mkdtempSync(join(tmpdir(), "tc-int-sess-proj-"))
  t.after(() => { try { rmSync(cwd, { recursive: true, force: true }) } catch { /* ignore */ } })

  const agent = mkAgent(cwd)
  relay(agent, { role: "user", content: "do the thing" })
  relay(agent, { role: "assistant", content: null, tool_calls: [{ id: "call_done", type: "function", function: { name: "read", arguments: "{}" } }] })
  relay(agent, { role: "tool", tool_call_id: "call_done", content: "file body" })
  relay(agent, { role: "user", content: "carry on" })
  // 中断点：模型已发起第二个工具调用，结果尚未落盘（半程）
  relay(agent, { role: "assistant", content: null, tool_calls: [{ id: "call_cut", type: "function", function: { name: "edit", arguments: "{}" } }] })
  saveSession(agent)

  const fresh = mkAgent(cwd)
  const { data } = resumeSlot(cwd)
  const savedFrames = data.history
  applySession(fresh, data)
  assert.equal(fresh.history.length, 5, "已落盘的 5 帧全在（已知前缀保留）")
  assert.deepEqual(fresh.history.slice(0, 5).map((m) => m.content), savedFrames.slice(0, 5).map((m) => m.content), "前缀逐帧一致")
  assert.equal(fresh.history.filter((m) => m.content === "file body").length, 1, "已配对帧不重复")

  // 续跑起点：真恢复路径 repairHistory 把中断的工具调用干净接上（恰好一个占位结果）
  const repaired = repairHistory(fresh.history)
  const cutResults = repaired.filter((m) => m.role === "tool" && m.tool_call_id === "call_cut")
  assert.equal(cutResults.length, 1, "中断调用恰好补一个结果（无孤儿、无重复）")
  assert.match(cutResults[0].content, /interrupted/i, "占位结果为明确的会话中断语义")
  assert.equal(repaired.length, 6, "修复只补缺口，不增帧")

  // 续跑后再次落盘 → 重载：帧数与内容稳定（resume→save 往返无重复帧）
  fresh.history = repaired
  fresh._fullHistory = repaired
  saveSession(fresh)
  const second = mkAgent(cwd)
  applySession(second, resumeSlot(cwd).data)
  assert.equal(second.history.length, 6, "往返后帧数稳定")
  assert.equal(second.history.filter((m) => m.tool_call_id === "call_cut").length, 1, "往返后无重复帧")
})

test("④ 错误：损坏会话档 → 真子进程恢复 —— 干净回退 + 退出码正常", (t) => {
  const fakeHome = mkdtempSync(join(tmpdir(), "tc-int-sess-home-"))
  const cwd = mkdtempSync(join(tmpdir(), "tc-int-sess-bad-"))
  t.after(() => {
    try { rmSync(fakeHome, { recursive: true, force: true }) } catch { /* ignore */ }
    try { rmSync(cwd, { recursive: true, force: true }) } catch { /* ignore */ }
  })

  const url = (rel) => JSON.stringify(pathToFileURL(join(ROOT, rel)).href)
  const script = [
    `import { existsSync, writeFileSync } from "node:fs"`,
    `import { slotPath, newSession, resumeSlot } from ${url("src/session.mjs")}`,
    `const cwd = process.cwd()`,
    `const n = newSession(cwd)`,                                    // 一个真实会话槽
    `writeFileSync(slotPath(cwd, n), "{ this is not valid json")`,  // 坏档（半截 JSON）
    `const { slot, data } = resumeSlot(cwd)`,                       // 恢复 = 干净回退
    `console.log(JSON.stringify({ slot, hasData: data !== null, preserved: existsSync(slotPath(cwd, n) + ".corrupted") }))`,
  ].join("\n")
  const r = spawnSync(process.execPath, ["--input-type=module", "-e", script], {
    cwd, env: { ...process.env, HOME: fakeHome, USERPROFILE: fakeHome }, encoding: "utf8", timeout: 60_000,
  })
  assert.equal(r.status, 0, `坏档恢复不崩溃（stderr: ${r.stderr}）`)
  const seen = JSON.parse(r.stdout.trim().split("\n").pop())
  assert.equal(seen.hasData, false, "读不出内容 → 全新会话起步（data=null，不崩不抛）")
  assert.equal(typeof seen.slot, "number", "回退时给到一个可用槽位")
  assert.equal(seen.preserved, true, "坏档现场保留（.corrupted）——不静默丢弃")

  // 回退后仍可正常写入新会话（干净回退 = 可继续用）
  const cwd2 = mkdtempSync(join(tmpdir(), "tc-int-sess-ok-"))
  t.after(() => { try { rmSync(cwd2, { recursive: true, force: true }) } catch { /* ignore */ } })
  const fresh = mkAgent(cwd2)
  relay(fresh, { role: "user", content: "after recovery" })
  saveSession(fresh)
  assert.ok(readdirSync(sessionsDir).length > 0, "回退后的会话照常落盘")
})

// ── T-RS10（TUI-OOM-ROOTCAUSE 组 1——SESSION.md §14.6）：恢复→翻页→检索→保存 往返 ──
test("④ 正常（T-RS10）：磁盘为准 + 内存窗口——尾窗/total、翻页页沿、窗口外检索、保存不缩", async (t) => {
  const cwd = mkdtempSync(join(tmpdir(), "tc-int-sess-win-"))
  t.after(() => { try { rmSync(cwd, { recursive: true, force: true }) } catch { /* ignore */ } })
  const agent = mkAgent(cwd)
  // 100 回合 × 3 消息（user / assistant+tool_call / tool）——页沿会落在回合中段
  const TURNS = 100
  for (let k = 0; k < TURNS; k++) {
    relay(agent, { role: "user", content: `turn-${k}` })
    relay(agent, { role: "assistant", content: null, tool_calls: [{ id: `call_${k}`, type: "function", function: { name: "read", arguments: JSON.stringify({ path: `f${k}` }) } }] })
    relay(agent, { role: "tool", tool_call_id: `call_${k}`, content: `result-${k}` })
  }
  const TOTAL = TURNS * 3
  assert.equal(agent._fullHistory.length, TOTAL)
  saveSession(agent)
  assert.equal(JSON.parse(readFileSync(slotPath(cwd, agent._slot), "utf8")).history.length, TOTAL, "保存：JSON history 全量")
  assert.equal(agent._recordStore.total(), TOTAL, "保存：sidecar total 不缩")

  // 恢复（真槽文件 → applySession 钉槽 → 绑定）
  const { slot, data } = resumeSlot(cwd)
  const first = mkAgent(cwd)
  applySession(first, data, { slot })
  assert.equal(first._fullHistory.length, 200, "恢复：人读线 = 尾窗 200")
  assert.equal(first._recordStore.total(), TOTAL)
  const desc = sessionDescriptor(first, data)
  assert.equal(desc.total, TOTAL, "描述符 total = 绝对总条数（标签口径）")

  // TUI 恢复（最小 state——真 restoreLines/loadOlder）
  const state = {
    lines: [], expandedBlocks: new Set(), _foldScroll: new Map(), foldEnabled: true,
    streaming: "", reasoning: "", search: null, tokens: {}, scroll: 0,
    dims: { get: () => ({ cols: 80, rows: 24 }) },
  }
  restoreLines(state, desc)
  assert.equal(state._historyTotal, TOTAL)
  assert.equal(state._historyLoaded, 200)
  assert.equal(state._hasOlder, true)
  assert.equal(state.lines.filter((l) => l.text === "❯ ThinCoder:").length >= 1, true)

  const loadOlder = createLoadOlder({ agent: first, state, render: () => {} })
  let guard = 0
  const addedFor = (fn = loadOlder) => {
    const before = new Set(state.lines)
    fn()
    return state.lines.filter((l) => !before.has(l))
  }
  const summarize = (added) => ({
    labels: added.filter((l) => l.text === "❯ ThinCoder:").length,
    userLabels: added.filter((l) => l.text === "❯ You:").length,
    tools: added.filter((l) => l._toolBlock).map((l) => l._toolBlock.result !== null),
  })

  // 对照组：模式 F（未绑定——全量数组）同页序列 = 零回归基准（页沿行为逐页一致）
  const fb = mkAgent(cwd)
  applySession(fb, data) // 无 slot → 模式 F
  assert.equal(fb._recordStore, null)
  const stateF = {
    lines: [], expandedBlocks: new Set(), _foldScroll: new Map(), foldEnabled: true,
    streaming: "", reasoning: "", search: null, tokens: {}, scroll: 0,
    dims: { get: () => ({ cols: 80, rows: 24 }) },
  }
  restoreLines(stateF, { history: data.history, total: data.history.length, base: 0 })
  const loadOlderF = createLoadOlder({ agent: fb, state: stateF, render: () => {} })
  const addedForF = () => {
    const before = new Set(stateF.lines)
    loadOlderF()
    return stateF.lines.filter((l) => !before.has(l))
  }

  const pages = 10
  for (let p = 0; p < pages; p++) {
    const a = addedFor()
    const b = addedForF()
    assert.deepEqual(summarize(a), summarize(b), `页 ${p + 1}：绑定态与模式 F（全量基准）页沿行为逐项一致`)
    if (p === 1) {
      // 页 2 [60,80)：页末 = assistant+tool_call（其 tool 结果在页外）——±1 页沿保配对
      assert.equal(a.some((l) => l._toolBlock && l._toolBlock.result !== null), true, "页末工具结果配对不破（+1 页沿）")
    }
  }
  while (state._hasOlder && guard < 30) { loadOlder(); guard++ }
  while (stateF._hasOlder && guard < 30) { loadOlderF(); guard++ }
  assert.equal(state._historyLoaded, TOTAL, "翻页到底 = 全量可见")
  assert.equal(state._hasOlder, false)
  assert.equal(stateF._historyLoaded, TOTAL, "对照态同步到底（同锚点区间）")
  assert.equal(Number.isFinite(state.scroll), true) // 锚定滚动补偿不破（值域合理）
  assert.equal(state.scroll > 0, true, "跨页滚动补偿已生效（页插入后锚定平移）")

  // 本会话检索：内存窗口外命中（存储流式）
  const { readHistoryTool } = await import("../../src/agent-tools/read-history.mjs")
  const hits = JSON.parse(readHistoryTool.execute({ keyword: "result-77" }, { agent: first }))
  assert.equal(hits.length, 1, "窗口外（早期工具结果）keyword 可命中")
  assert.equal(hits[0].content, "result-77")
  const far = JSON.parse(readHistoryTool.execute({ keyword: "turn-39", role: "user" }, { agent: first }))
  assert.equal(far.length, 1, "窗口外早期 user 消息可命中")

  // 再保存：JSON 全量保持、sidecar 不缩（窗口 ≠ 记录）
  pushReal(first, { role: "user", content: "post-restore" })
  saveSession(first)
  const disk2 = JSON.parse(readFileSync(slotPath(cwd, first._slot), "utf8"))
  assert.equal(disk2.history.length, TOTAL + 1, "保存后 JSON history 仍为全量")
  assert.equal(first._recordStore.total(), TOTAL + 1)
})
