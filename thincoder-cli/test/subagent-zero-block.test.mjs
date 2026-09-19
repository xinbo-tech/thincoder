/**
 * subagent-zero-block.test.mjs — 异步子代理「零块」修复（zero-block 批）用例表 1:1：
 * 设计权威 = `docs/cli/design/TUI.md` §6.8.3（用例 T-ZB1–T-ZB6 = §6.8.3.6；验收
 * AC-ZB1–AC-ZB7 = §6.8.3.7）；批次档 = `docs/batches/2026-09-17-subagent-zero-block.md` §2。
 * 正常 2（T-ZB1 存活复活 / T-ZB2 复活后活动流跟随）· 边界 2（T-ZB3 不存活维持丢弃 /
 * T-ZB4 清扫存活跳过）· 错误 2（T-ZB5 降级 / T-ZB6 禁静默留痕）。
 * 直驱零网络零定时器（routeSubToken / freezeSubTaskLines / freezeAllSubTasks /
 * refreshQueuedTokens——不建真实子代理、不起回合）；桩面同 queued-stop.test.mjs。
 * 事件断言 = `THINCODER_LOG_DIR` 隔离目录读档（async-discard.test.mjs 同款——
 * NODE_TEST_CONTEXT 写门）；条数取**增量**（不依赖用例执行次序）。
 */
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { routeSubToken, routeSubToolCall, computePanelBlocks } from "../src/tui/subagent-blocks.mjs"
import { freezeSubTaskLines, freezeAllSubTasks, livePoolHas } from "../src/tui/subagent-freeze.mjs"
import { refreshQueuedTokens } from "@thincoder/core/agent-tools/subagent-scheduler.mjs"

let _tmp
let _logDir

before(() => {
  _tmp = mkdtempSync(join(tmpdir(), "tc-zero-block-"))
  _logDir = join(_tmp, "logs")
  process.env.THINCODER_LOG_DIR = _logDir // 写门 override（NODE_TEST_CONTEXT 默认跳过写盘）
})

after(() => {
  delete process.env.THINCODER_LOG_DIR
  rmSync(_tmp, { recursive: true, force: true })
})

/** 事件条数（隔离目录——按目录内全部文件读，不假定单日文件名）。 */
function evCount(kind) {
  let names = []
  try { names = readdirSync(_logDir) } catch { return 0 }
  let n = 0
  for (const name of names) {
    for (const line of readFileSync(join(_logDir, name), "utf8").split("\n")) {
      if (!line.trim()) continue
      try { if (JSON.parse(line).ev === kind) n++ } catch { /* 半行（并发写）忽略 */ }
    }
  }
  return n
}

/** 最小 TUI state（路由 / 冻结 / 显账读取面）。 */
function mkState(over = {}) {
  return {
    lines: [], subTasks: {}, expandedBlocks: new Set(), foldEnabled: true,
    _frozenSubKeys: new Set(),
    ...over,
  }
}

/** 最小 agent（两池 = 存活判据读取面；不给 `_agent` 即降级面）。 */
function mkAgent(over = {}) {
  return { _asyncSubagents: new Map(), _asyncAdvisors: new Map(), ...over }
}

/** 池条目最小形（池键 = `String(id)`——写侧真实形态）。 */
function mkEntry(id, role, over = {}) {
  return { id: String(id), role, status: "running", done: false, cancelled: false, ...over }
}

const noop = () => {}

/** 账不飘独立复算（lineChars 同口径：行文本 + 载体 `_charCount`）。 */
const budgetSum = (state) => (state.lines ?? []).reduce(
  (n, l) => n + (typeof l.text === "string" ? l.text.length : 0) + (l._frozenSubTask?._charCount ?? 0), 0)

/** 墓碑源真实路径：建块（含内容）→ `freezeSubTaskLines`（写墓碑 + 载体行入流）→ 出 subTasks。 */
function tombstoneVia(state, key, content = "seed line\n") {
  routeSubToken(state, `${key}/${content}`, noop)
  const sub = state.subTasks[key]
  assert.ok(sub, `夹具：${key} 块已建`)
  freezeSubTaskLines(state, sub)
  delete state.subTasks[key]
  return sub
}

/** T-ZB1 路径夹具：排队建块 → 墓碑 → 存活复活；`preRevive` 钩子插在墓碑与复活之间。 */
function revivedFixture(preRevive) {
  const state = mkState()
  const agent = mkAgent()
  state._agent = agent
  agent._asyncSubagents.set("2", mkEntry(2, "explore")) // 真实池键形 `set("2", entry)`
  routeSubToken(state, "explore#2/⟦ev⟧queued\x1eslot\x1e1\x1equeued\x1e", noop)
  routeSubToken(state, "explore#2/working\n", noop)
  freezeSubTaskLines(state, state.subTasks["explore#2"])
  delete state.subTasks["explore#2"]
  preRevive?.(state, agent)
  routeSubToken(state, "explore#2/⟦ev⟧async\x1e", noop)
  routeSubToken(state, "explore#2/[model]m", noop)
  return { state, agent }
}

// ─── 正常 1：存活复活（AC-ZB1）──────────────────────────────────────────────

test("T-ZB1 存活复活（正常）：墓碑命中 + 池内存活 → 摘墓碑 + 摘旧载体行 + async/[model] 落位", () => {
  const { state } = revivedFixture((s) => {
    s.subTasks["plan#4"] = { key: "plan#4", _freezeAt: 2 } // 摘除位之后（1 号位）的在途锚点
    s.subTasks["explore#9"] = { key: "explore#9", _freezeAt: 0 } // 摘除位之前（0 号位）——不动
  })
  // 墓碑面（复活前：真实墓碑路径已由夹具走完——此处复核复活后的终态）
  assert.ok(state.subTasks["explore#2"], "块已复活（subTasks[key] 存在）")
  assert.equal(state._frozenSubKeys.has("explore#2"), false, "墓碑已摘")
  assert.equal(state.subTasks["explore#2"].async, true, "⟦ev⟧async 落位（缺失 key 缓冲 → 建块应用）")
  assert.equal(state.subTasks["explore#2"].model, "m", "[model] 落位（AC-ZB4 的 [model] 面）")
  assert.equal(state.lines.filter((l) => l._frozenSubTask?.key === "explore#2").length, 0,
    "旧 `_frozenSubTask` 载体行已摘除（一 key 一载体）")
  assert.equal(state._linesChars, budgetSum(state), "账不飘（_linesChars === Σ lineChars 口径复算）")
  assert.equal(state._linesChars, 0, "负向出账已发生（旧载体行字符已出账——否则残账 > 0）")
  assert.equal(state.subTasks["plan#4"]._freezeAt, 1, "摘除位之后的在途锚点 −1")
  assert.equal(state.subTasks["explore#9"]._freezeAt, 0, "摘除位之前的锚点不动")
})

// ─── 正常 2：复活后活动流跟随（AC-ZB1）──────────────────────────────────────

test("T-ZB2 复活后活动流跟随（正常）：文本 / ⟦ev⟧turn / 工具 token 全入块 + 面板 1 块", () => {
  const { state } = revivedFixture()
  routeSubToken(state, "explore#2/more text\n", noop)
  routeSubToken(state, "explore#2/⟦ev⟧turn\x1e5\x1e10\x1eturn\x1e", noop)
  routeSubToolCall(state, "explore#2/read", { path: "a.mjs" }, noop)
  const sub = state.subTasks["explore#2"]
  assert.ok(sub.blocks.some((b) => b.text.includes("more text")), "文本片入块")
  assert.equal(sub.turn, 5, "⟦ev⟧turn 落位（turn 入块头）")
  assert.equal(sub.maxTurns, 10, "maxTurns 落位")
  assert.equal(sub.currentTool, "read", "工具 token 更新 currentTool")
  assert.ok(sub.blocks.some((b) => b.text.startsWith("❯ read")), "工具行入块")
  const panel = computePanelBlocks(state)
  assert.equal(panel.length, 1, "面板现算 1 块")
  assert.equal(panel[0].key, "explore#2", "面板块 = 复活块")
  assert.equal(panel[0].status, "running", "复活块以 running 入镜（非 done / queued）")
})

// ─── 边界 3：不存活维持丢弃（AC-ZB2）────────────────────────────────────────

test("T-ZB3 不存活维持丢弃（边界）：池外真终态 / done-in-pool / cancelled —— 迟到 chunk 不复活幽灵块", () => {
  // ① 池外真终态（条目已出池——报告已被收集）
  const s1 = mkState({ _agent: mkAgent() })
  tombstoneVia(s1, "explore#7")
  routeSubToken(s1, "explore#7/late chunk", noop)
  assert.equal(s1._frozenSubKeys.has("explore#7"), true, "① 墓碑仍在（丢弃不摘墓碑）")
  assert.equal(s1.subTasks["explore#7"], undefined, "① 维持丢弃（不建幽灵块）")
  // ② 池内 done-in-pool（settle 后未收集——留池 `done === true`）
  const a2 = mkAgent()
  a2._asyncSubagents.set("7", mkEntry(7, "explore", { status: "done", done: true }))
  const s2 = mkState({ _agent: a2 })
  tombstoneVia(s2, "explore#7")
  routeSubToken(s2, "explore#7/late chunk", noop)
  assert.equal(s2._frozenSubKeys.has("explore#7"), true, "② done-in-pool 不误判为存活")
  assert.equal(s2.subTasks["explore#7"], undefined, "② 维持丢弃")
  // ③ 池内 cancelled（取消——报告不可达）
  const a3 = mkAgent()
  a3._asyncSubagents.set("7", mkEntry(7, "explore", { cancelled: true }))
  const s3 = mkState({ _agent: a3 })
  tombstoneVia(s3, "explore#7")
  routeSubToken(s3, "explore#7/late chunk", noop)
  assert.equal(s3._frozenSubKeys.has("explore#7"), true, "③ cancelled 不判存活")
  assert.equal(s3.subTasks["explore#7"], undefined, "③ 维持丢弃")
  // ④ key 映射面（§6.8.3.3 写死规则）：池内 id 命中但 role 不同 ⇒ false；正形 ⇒ true；
  //    非池键（compress#N 等，§6.8.3.8 复活可达面）与畸形键形同判 false
  const a4 = mkAgent()
  a4._asyncSubagents.set("3", mkEntry(3, "explore"))
  assert.equal(livePoolHas(mkState({ _agent: a4 }), "coder#3"), false, "④ role 不匹配判 false（不误复活他块）")
  assert.equal(livePoolHas(mkState({ _agent: a4 }), "explore#3"), true, "④ 正形判 true（对照）")
  assert.equal(livePoolHas(mkState({ _agent: a4 }), "compress#3"), false, "④ 非池键（compress#N）判 false")
  assert.equal(livePoolHas(mkState({ _agent: a4 }), "no-hash-key"), false, "④ 无 `#` 形态判 false（不做畸形键字节匹配）")
})

// ─── 边界 4：清扫存活跳过（AC-ZB3）──────────────────────────────────────────

test("T-ZB4 清扫存活跳过（边界）：存活块留驻；池外已终块与池内 done-in-pool 照旧冻结", () => {
  const state = mkState()
  const agent = mkAgent()
  state._agent = agent
  agent._asyncSubagents.set("3", mkEntry(3, "explore")) // ① 池内存活
  routeSubToken(state, "explore#3/live line\n", noop)
  routeSubToken(state, "coder#9/finished line\n", noop) // ② 池外已终
  agent._asyncSubagents.set("11", mkEntry(11, "eng-coder", { status: "done", done: true })) // ③ done-in-pool
  routeSubToken(state, "eng-coder#11/settled line\n", noop)
  freezeAllSubTasks(state)
  assert.ok(state.subTasks["explore#3"], "① 存活块保留在 subTasks（未出）")
  assert.equal(state.subTasks["explore#3"].done, false, "① 存活块未置 done")
  assert.equal(state._frozenSubKeys.has("explore#3"), false, "① 存活块未写墓碑")
  assert.equal(state.subTasks["coder#9"], undefined, "② 池外已终块照旧冻结出 subTasks")
  assert.equal(state.subTasks["eng-coder#11"], undefined, "③ done-in-pool 照旧冻结出 subTasks")
  const frozen = state.lines.filter((l) => l._frozenSubTask).map((l) => l._frozenSubTask.key).sort()
  assert.deepEqual(frozen, ["coder#9", "eng-coder#11"], "两终态块进流（存活块不进流）")
  assert.equal(state._frozenSubKeys.has("coder#9"), true, "② 墓碑已写")
  assert.equal(state._frozenSubKeys.has("eng-coder#11"), true, "③ 墓碑已写")
})

// ─── 错误 5：降级面（AC-ZB5）───────────────────────────────────────────────

test("T-ZB5 降级（错误）：无 state._agent ⇒ 墓碑命中维持丢弃（与批前逐字等价——零回归）", () => {
  const state = mkState() // headless / 夹具形——无 _agent
  tombstoneVia(state, "explore#8")
  assert.equal(livePoolHas(state, "explore#8"), false, "无 _agent ⇒ 无存活信息 ⇒ false")
  assert.equal(livePoolHas(mkState({ _agent: {} }), "explore#8"), false, "无池 ⇒ false（instanceof Map 守卫）")
  routeSubToken(state, "explore#8/late chunk", noop)
  assert.equal(state._frozenSubKeys.has("explore#8"), true, "墓碑仍在")
  assert.equal(state.subTasks["explore#8"], undefined, "维持丢弃（迟到 chunk 丢弃语义不回归）")
})

// ─── 错误 6：禁静默留痕（AC-ZB6）───────────────────────────────────────────

test("T-ZB6 禁静默留痕（错误）：复活分支 + relay 异常各留一条可观测痕", () => {
  // ① 复活分支：每次复活记一条（无去重状态）——两轮墓碑/复活 ⇒ 两条
  const base = evCount("ev:subagent-block-revived")
  const { state } = revivedFixture()
  assert.equal(evCount("ev:subagent-block-revived"), base + 1, "首次复活记一条")
  freezeSubTaskLines(state, state.subTasks["explore#2"]) // 再墓碑（同 key——复活后可再命中）
  delete state.subTasks["explore#2"]
  routeSubToken(state, "explore#2/again\n", noop) // 迟到 chunk → 墓碑命中 → 存活复活
  assert.ok(state.subTasks["explore#2"], "第二次复活建块")
  assert.equal(evCount("ev:subagent-block-revived"), base + 2, "每次复活记一条（无去重状态）")
  // ② relay 异常：池状态不被破坏（现状）+ 留痕一条（新）
  const queued = { id: "5", role: "explore", relayPrefix: "explore#5/", status: "queued", position: 1, _dependsOn: [], _files: [] }
  const parent = { cwd: process.cwd(), _asyncSubagents: new Map(), _asyncQueue: [queued] }
  const paintBase = evCount("ev:queued-paint-failed")
  assert.doesNotThrow(() => refreshQueuedTokens(parent, () => { throw new Error("relay down") }),
    "relay 异常不外抛（池状态不被破坏）")
  assert.equal(parent._asyncQueue.length, 1, "队列条目未被动")
  assert.equal(evCount("ev:queued-paint-failed"), paintBase + 1, "relay 异常记一条")
})
