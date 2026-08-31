/**
 * session-safety.test.mjs — 2026-08-31 会诊（deepseek/kimi/glm 三家）缺陷修复回归：
 *  F1 slot 粘性（saveSession 缓存 agent._slot，不随 manifest active 漂移）
 *  F2 覆盖防护（目标 slot 属于另一会话时先轮转 .bak；结构不匹配保留 .unreadable）
 *  F3 resetSessionState 清全量会话态（/new 不再把旧人类线/标题泄漏进新 slot）
 *  F4 ensureActive 不劫持有文件的旧 slot（只回收文件缺失的空 slot）
 *  F6 v1 老文件（无 contextHistory）回退播种机器线时剥离截断的 tool_calls.arguments
 *  第二轮会诊（kimi/deepseek）追加：switchToSlot 活主不劫持、manifest 条目级合并、
 *  newSession 选号查文件、v3 文件轮转、contextHistory 空数组兜底。
 *
 * 注意：真实 sessions 目录已积累数万文件（F4 缺陷的现场），任何全量 readdirSync 都会
 * 卡数十秒——测试一律按已知路径读写，绝不枚举目录。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, existsSync, unlinkSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import {
  saveSession, loadSession, applySession, activeSlot, resetSessionState,
  switchToSlot, sessionPath, slotOccupancy, newSession, loadSlotFile,
} from "../src/session.mjs"
import { pushReal } from "../src/context.mjs"

/** Minimal agent shape needed by session.mjs. */
function makeAgent(cwd, history = [], extra = {}) {
  const agent = {
    cwd,
    history: [],
    _fullHistory: [],
    tasks: [],
    planMode: false,
    autoApprove: false,
    config: {},
    providers: [],
    title: "",
    _sessionStart: null,
    ...extra,
  }
  for (const m of history) pushReal(agent, m)
  return agent
}

/** Remove every file this cwd's session may have created (known paths only — no directory scan). */
function cleanup(cwd) {
  const base = sessionPath(cwd)
  for (const s of ["", ".manifest", ".1", ".2", ".3", ".4", ".5", ".6", ".tmp", ".corrupted", ".unreadable"]) {
    try { unlinkSync(base + s) } catch {}
  }
}

const manifestOf = (cwd) => sessionPath(cwd) + ".manifest"
const slotFile = (cwd, n) => sessionPath(cwd) + "." + n

test("F1: saveSession caches agent._slot — later saves ignore a moved manifest active pointer", () => {
  const cwd = mkdtempSync(join(tmpdir(), "sess-f1-"))
  try {
    const agent = makeAgent(cwd, [{ role: "user", content: "hi" }])
    saveSession(agent)
    assert.ok(agent._slot, "slot is cached on the agent after first save")
    const firstSlot = agent._slot
    const firstData = JSON.parse(readFileSync(slotFile(cwd, firstSlot), "utf8"))
    const t0 = firstData.updatedAt

    // 并发方把 manifest active 指针翻到别的 slot（模拟另一个 CLI/VS Code 写入）
    const m = JSON.parse(readFileSync(manifestOf(cwd), "utf8"))
    m.active = 999
    writeFileSync(manifestOf(cwd), JSON.stringify(m))

    pushReal(agent, { role: "user", content: "more" })
    saveSession(agent)
    assert.equal(agent._slot, firstSlot, "cached slot is sticky")
    assert.ok(existsSync(slotFile(cwd, firstSlot)), "session still written to the ORIGINAL slot")
    assert.ok(!existsSync(slotFile(cwd, 999)), "phantom slot never created")
    const after = JSON.parse(readFileSync(slotFile(cwd, firstSlot), "utf8"))
    assert.ok(after.updatedAt >= t0, "original slot file updated")
    assert.equal(after.history.length, 2, "human line has both messages (slim stores them)")
  } finally {
    cleanup(cwd)
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("F1b: applySession resets _slot — after switchToSlot, saves go to the NEW slot (advisor round1 🔴 regression)", () => {
  const cwd = mkdtempSync(join(tmpdir(), "sess-f1b-"))
  try {
    // 会话 A 写入 slot 1，_slot 缓存为 1
    const agentA = makeAgent(cwd, [{ role: "user", content: "session A" }], { _sessionStart: "2026-08-01T00:00:00.000Z" })
    saveSession(agentA)
    assert.equal(agentA._slot, 1)

    // 会话 B 写入 slot 2
    const agentB = makeAgent(cwd, [{ role: "user", content: "session B" }], { _sessionStart: "2026-08-02T00:00:00.000Z" })
    agentB._slot = 2
    saveSession(agentB)

    // 用户从 slot 1 切到 slot 2（/session 路径：switchToSlot + applySession）
    const data = switchToSlot(cwd, 2)
    assert.ok(data, "switch to slot 2 loads its data")
    applySession(agentA, data)
    assert.equal(agentA._slot, null, "applySession clears the stale cached slot")

    // 切换后继续对话并保存 → 必须写 slot 2，slot 1 不被轮转/污染
    pushReal(agentA, { role: "user", content: "post-switch message" })
    const rotated = saveSession(agentA)
    assert.equal(rotated, null, "no rotation on the switched session")
    assert.equal(agentA._slot, 2, "next save re-claims the manifest-active slot (the switched one)")
    const slot2 = JSON.parse(readFileSync(slotFile(cwd, 2), "utf8"))
    assert.ok(slot2.history.some((m) => m.content === "post-switch message"), "post-switch message lands in slot 2")
    const slot1 = JSON.parse(readFileSync(slotFile(cwd, 1), "utf8"))
    assert.equal(slot1.history[0].content, "session A", "slot 1 untouched")
  } finally {
    cleanup(cwd)
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("F1c: switchToSlot to a live-occupied slot returns data WITHOUT hijacking (会诊 deepseek 🔴)", () => {
  const cwd = mkdtempSync(join(tmpdir(), "sess-f1c-"))
  try {
    const writer = makeAgent(cwd, [{ role: "user", content: "session B" }], { _sessionStart: "2026-08-02T00:00:00.000Z" })
    writer._slot = 2
    saveSession(writer)
    // 目标槽被"另一活进程"（当前测试进程的 PID）占用
    const m = JSON.parse(readFileSync(manifestOf(cwd), "utf8"))
    m.slotSessions ??= {}
    m.slotSessions[2] = `${process.pid}-foreign`
    m.active = 1
    writeFileSync(manifestOf(cwd), JSON.stringify(m))

    const data = switchToSlot(cwd, 2)
    assert.ok(data, "switch reads the target slot data")
    assert.equal(data.history[0].content, "session B")
    const after = JSON.parse(readFileSync(manifestOf(cwd), "utf8"))
    assert.equal(after.active, 2, "active pointer stays on the user-chosen slot (no hijack to a new empty slot)")
    assert.equal(after.slotSessions[2], `${process.pid}-foreign`, "foreign ownership NOT stolen")
    const occ = slotOccupancy(cwd, 2)
    assert.equal(occ.occupied, true, "slotOccupancy reports the live owner")
  } finally {
    cleanup(cwd)
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("F2: saveSession preserves a foreign session file via .bak rotation before overwriting", () => {
  const cwd = mkdtempSync(join(tmpdir(), "sess-f2-"))
  try {
    // 磁盘 slot 1 已有旧会话（sessionStart 属于另一个会话）
    const legacy = makeAgent(cwd, [{ role: "user", content: "old session" }])
    legacy._sessionStart = "2026-08-01T00:00:00.000Z"
    saveSession(legacy)
    const slot1 = legacy._slot

    // 捕获 saveSession 的轮转 .bak 路径（返回值透出；不枚举目录）
    // 新进程（从未加载该文件，_sessionStart=null）被钉到同一 slot → 写前必须轮转
    const fresh = makeAgent(cwd, [{ role: "user", content: "brand new" }], { _sessionStart: null })
    fresh._slot = slot1
    const bakPath = saveSession(fresh)
    assert.ok(bakPath && bakPath.includes(`.${slot1}.bak-`), "rotation rename happened when overwriting a foreign session")
    const saved = JSON.parse(readFileSync(bakPath, "utf8"))
    assert.equal(saved.history[0].content, "old session", ".bak holds the foreign session intact")
    const now = JSON.parse(readFileSync(slotFile(cwd, slot1), "utf8"))
    assert.equal(now.history[0].content, "brand new", "new session written over the slot")
    try { unlinkSync(bakPath) } catch {}
  } finally {
    cleanup(cwd)
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("F1d: newSession skips a slot number live-claimed but not yet saved (advisor round2 🟡)", () => {
  const cwd = mkdtempSync(join(tmpdir(), "sess-f1d-"))
  try {
    const holder = makeAgent(cwd, [{ role: "user", content: "x" }])
    saveSession(holder)
    // 模拟另一进程已认领 slot 2（slotSessions 有条目、slots 无条目、文件不存在）
    const m = JSON.parse(readFileSync(manifestOf(cwd), "utf8"))
    m.slotSessions[2] = `${process.pid}-foreign`
    writeFileSync(manifestOf(cwd), JSON.stringify(m))
    assert.ok(!existsSync(slotFile(cwd, 2)), "slot 2 file absent (claim window)")

    const slot = newSession(cwd)
    assert.notEqual(slot, 2, "must not reuse a slot live-claimed by another process (double-writer)")
    assert.ok(!existsSync(slotFile(cwd, 2)), "foreign claimed slot file still absent")
  } finally {
    cleanup(cwd)
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("F4d: loadSession leaves a cwd-mismatched legacy file untouched (advisor round2 🟡)", () => {
  const cwd = mkdtempSync(join(tmpdir(), "sess-f4d-"))
  try {
    // active 槽不存在（loadSession 会先认领无文件槽再走 legacy 兜底）
    const legacy = sessionPath(cwd)
    writeFileSync(legacy, JSON.stringify({
      version: 2, cwd: "D:\\other-project", title: "foreign",
      history: [{ role: "user", content: "a" }],
    }))
    const result = loadSession(cwd)
    assert.equal(result, null, "foreign legacy file not loaded")
    assert.ok(existsSync(legacy), "foreign legacy file NOT renamed (与 loadSlotFile 的'别人的文件不动'一致)")
  } finally {
    cleanup(cwd)
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("F5a: dead-owner cleanup persists on the CLAIM path (会诊 deepseek/kimi 🔴 — N1 只修了早退路径)", () => {
  const cwd = mkdtempSync(join(tmpdir(), "sess-f5a-"))
  try {
    // slot 1：有文件 + 条目，属主是死 PID；slot 9：无文件，属主也是死 PID
    const holder = makeAgent(cwd, [{ role: "user", content: "x" }])
    saveSession(holder)
    const m = JSON.parse(readFileSync(manifestOf(cwd), "utf8"))
    m.slotSessions[1] = "99999999-dead" // 不存在的 PID → 死主
    m.slotSessions[9] = "99999998-dead"
    writeFileSync(manifestOf(cwd), JSON.stringify(m))

    // 分支 1：active=1 空闲（死主）→ 认领 + 死项清理落盘
    const claimed = activeSlot(cwd)
    assert.equal(claimed, 1, "claims the active slot whose owner is dead")
    const after = JSON.parse(readFileSync(manifestOf(cwd), "utf8"))
    assert.ok(after.slotSessions[1]?.startsWith(`${process.pid}-`), "slot 1 re-claimed by us — dead owner OVERWRITTEN, not resurrected by the merge")
    assert.equal(after.slotSessions[9], undefined, "dead owner entry for slot 9 deleted on disk (N1 regression: 分支路径也要传 deletions)")
  } finally {
    cleanup(cwd)
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("F5b: saveSession does NOT roll back a concurrent active pointer change (会诊三家 🟡)", () => {
  const cwd = mkdtempSync(join(tmpdir(), "sess-f5b-"))
  try {
    const agent = makeAgent(cwd, [{ role: "user", content: "hi" }])
    saveSession(agent)
    assert.equal(agent._slot, 1)
    // 并发方（另一进程）把 active 翻到 slot 2
    const m = JSON.parse(readFileSync(manifestOf(cwd), "utf8"))
    m.active = 2
    writeFileSync(manifestOf(cwd), JSON.stringify(m))

    // 我方再保存（只改 slots digest，无意改 active）→ active 必须保持 2
    pushReal(agent, { role: "user", content: "more" })
    saveSession(agent)
    const after = JSON.parse(readFileSync(manifestOf(cwd), "utf8"))
    assert.equal(after.active, 2, "active pointer not rolled back to our stale snapshot (F1 反向变体)")
  } finally {
    cleanup(cwd)
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("F5c: slotOccupancy excludes the SAME-process owner (advisor 🟡 — /session 重选当前槽不误报)", () => {
  const cwd = mkdtempSync(join(tmpdir(), "sess-f5c-"))
  try {
    const agent = makeAgent(cwd, [{ role: "user", content: "hi" }])
    saveSession(agent)
    const occ = slotOccupancy(cwd, agent._slot)
    assert.equal(occ.occupied, false, "our own slot is not 'another live process'")
    // 跨进程（不同 sessionId、活 PID）仍是占用
    const m = JSON.parse(readFileSync(manifestOf(cwd), "utf8"))
    m.slotSessions[agent._slot] = `${process.pid}-foreign`
    writeFileSync(manifestOf(cwd), JSON.stringify(m))
    const occ2 = slotOccupancy(cwd, agent._slot)
    assert.equal(occ2.occupied, true, "foreign live owner still reported")
  } finally {
    cleanup(cwd)
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("F5d: newSession reclaims a dead-owner file-less slot number (advisor 🔵 — 与 ensureActive 分支2 对齐)", () => {
  const cwd = mkdtempSync(join(tmpdir(), "sess-f5d-"))
  try {
    const holder = makeAgent(cwd, [{ role: "user", content: "x" }])
    saveSession(holder) // 占用 slot 1
    // 死主空槽 2：m.slots 有条目、slotSessions 死 PID、无文件
    const m = JSON.parse(readFileSync(manifestOf(cwd), "utf8"))
    m.slots[2] = { ts: 1 }
    m.slotSessions[2] = "99999997-dead"
    writeFileSync(manifestOf(cwd), JSON.stringify(m))
    assert.ok(!existsSync(slotFile(cwd, 2)), "slot 2 file absent")

    const slot = newSession(cwd)
    assert.equal(slot, 2, "dead-owner file-less slot number reclaimed (修复前：m.slots 有条目即跳过 → 3)")
    const after = JSON.parse(readFileSync(manifestOf(cwd), "utf8"))
    assert.ok(after.slotSessions[2]?.startsWith(`${process.pid}-`), "slot 2 re-claimed by us (dead owner overwritten)")
  } finally {
    cleanup(cwd)
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("F5f: newSession persists dead-owner cleanup via deletions (会诊 deepseek/glm 🟡 — 修复前合并复活，磁盘死条目永不消失)", () => {
  const cwd = mkdtempSync(join(tmpdir(), "sess-f5f-"))
  try {
    const holder = makeAgent(cwd, [{ role: "user", content: "x" }])
    saveSession(holder) // 占用 slot 1
    // 死主槽 2（有文件，不被回收）+ 死主槽 3（无文件）
    const m = JSON.parse(readFileSync(manifestOf(cwd), "utf8"))
    m.slots[2] = { ts: 1 }
    m.slotSessions[2] = "99999998-dead"
    m.slots[3] = { ts: 1 }
    m.slotSessions[3] = "99999997-dead"
    writeFileSync(manifestOf(cwd), JSON.stringify(m))
    writeFileSync(slotFile(cwd, 2), JSON.stringify({ version: 2, cwd, history: [] }))

    const slot = newSession(cwd)
    const after = JSON.parse(readFileSync(manifestOf(cwd), "utf8"))
    assert.equal(after.slotSessions[2], undefined, "dead owner persisted-deleted (合并复活 bug 修复)")
    assert.ok(after.slots[2], "file-existing dead slot entry kept (F4: 不碰有文件的槽)")
    // slot 3 无文件 → 被回收复用为新属主（deletions 过滤掉刚认领的槽，防删自己的认领）
    assert.equal(slot, 3, "dead file-less slot number reclaimed")
    assert.ok(after.slotSessions[3]?.startsWith(`${process.pid}-`), "slot 3 re-claimed by us")
  } finally {
    cleanup(cwd)
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("F5g: loadManifest tolerates a bare {} manifest (会诊 deepseek 🔵 — 修复前 newSession 抛 TypeError)", () => {
  const cwd = mkdtempSync(join(tmpdir(), "sess-f5g-"))
  try {
    writeFileSync(manifestOf(cwd), "{}")
    const slot = newSession(cwd) // 修复前: m.slots[slot] = ... 在 undefined 上抛
    assert.equal(slot, 1, "newSession works with an empty manifest")
    const after = JSON.parse(readFileSync(manifestOf(cwd), "utf8"))
    assert.ok(after.slots[1], "slots initialized")
  } finally {
    cleanup(cwd)
    rmSync(cwd, { recursive: true, force: true })
  }
})


test("F5e: loadSlotFile recovers an orphan .tmp when the main file is missing (advisor 🔵)", () => {
  const cwd = mkdtempSync(join(tmpdir(), "sess-f5e-"))
  try {
    // rename 前崩溃的现场：主文件缺失，只有 .tmp（含更新数据）
    writeFileSync(`${slotFile(cwd, 1)}.tmp`, JSON.stringify({
      version: 2, cwd, title: "orphan", sessionStart: "2026-08-01T00:00:00.000Z",
      history: [{ role: "user", content: "tmp data" }],
    }))
    const data = loadSlotFile(cwd, 1)
    assert.ok(data, "orphan .tmp recovered")
    assert.equal(data.title, "orphan")
    assert.equal(data.history[0].content, "tmp data")
    assert.ok(existsSync(slotFile(cwd, 1)), ".tmp promoted to main file")
  } finally {
    cleanup(cwd)
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("F2: normal resume (applySession) does NOT rotate — sessionStart matches", () => {
  const cwd = mkdtempSync(join(tmpdir(), "sess-f2b-"))
  try {
    const writer = makeAgent(cwd, [{ role: "user", content: "hello" }])
    writer._sessionStart = "2026-08-10T00:00:00.000Z"
    saveSession(writer)
    const slot = writer._slot

    const data = loadSession(cwd)
    const reader = makeAgent(cwd, [], {})
    applySession(reader, data)
    assert.equal(reader._sessionStart, "2026-08-10T00:00:00.000Z")
    pushReal(reader, { role: "user", content: "resumed question" })
    const rotated = saveSession(reader)
    assert.equal(rotated, null, "no rotation on a consistent resume")
    const saved = JSON.parse(readFileSync(slotFile(cwd, slot), "utf8"))
    assert.ok(saved.history.some((m) => m.content === "resumed question"), "resumed session appended normally")
  } finally {
    cleanup(cwd)
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("F2c: saveManifest merges entry-level — concurrent changes are not lost (会诊 kimi/deepseek 🟡)", () => {
  const cwd = mkdtempSync(join(tmpdir(), "sess-f2c-"))
  try {
    const agent = makeAgent(cwd, [{ role: "user", content: "hi" }])
    saveSession(agent)
    // 模拟另一进程在"我方读 manifest 之后"新增的条目
    const m = JSON.parse(readFileSync(manifestOf(cwd), "utf8"))
    m.slots[7] = { ts: 1, title: "foreign" }
    m.slotSessions[7] = "99999-foreign"
    writeFileSync(manifestOf(cwd), JSON.stringify(m))

    // 我方再保存（saveSession 尾段 loadManifest→改 slots→saveManifest 条目级合并）
    pushReal(agent, { role: "user", content: "more" })
    saveSession(agent)
    const after = JSON.parse(readFileSync(manifestOf(cwd), "utf8"))
    assert.equal(after.slots[7].title, "foreign", "foreign slot entry survives merge")
    assert.equal(after.slotSessions[7], "99999-foreign", "foreign ownership survives merge")
    assert.ok(after.slots[agent._slot], "own slot entry still present")
  } finally {
    cleanup(cwd)
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("F3: resetSessionState clears every session-scoped field (/new 泄漏回归)", () => {
  const agent = makeAgent("cwd-x", [], {
    _fullHistory: [{ role: "user", content: "leak" }],
    title: "old title",
    _sessionStart: "2026-08-01T00:00:00.000Z",
    _engDesignToken: "tok",
    _runStartHistoryLen: 7,
    _lastPromptTokens: 123,
    _usageAtLen: 5,
    _compressFailures: 2,
    _verifyRetries: 1,
    _verifyPassed: false,
    goal: { objective: "x" },
    _pendingReminders: [{ at: 1 }],
    _slot: 3,
    _osReminderInjected: true,
    _restartReminderInjected: true,
    _lastEngState: true,
  })
  pushReal(agent, { role: "user", content: "hi" })
  agent.planMode = true
  resetSessionState(agent)
  assert.deepEqual(agent.history, [])
  assert.deepEqual(agent._fullHistory, [])
  assert.equal(agent.title, "")
  assert.equal(agent._sessionStart, null)
  assert.equal(agent._engDesignToken, null)
  assert.equal(agent._runStartHistoryLen, 0)
  assert.equal(agent._lastPromptTokens, null)
  assert.equal(agent._usageAtLen, null)
  assert.equal(agent._compressFailures, 0)
  assert.equal(agent._verifyRetries, 0)
  assert.equal(agent._verifyPassed, undefined)
  assert.deepEqual(agent.tasks, [])
  assert.equal(agent.planMode, false)
  assert.equal(agent.goal, null)
  assert.deepEqual(agent._pendingReminders, [])
  assert.equal(agent._slot, null, "sticky slot cleared too (advisor round2 🔵)")
  assert.equal(agent._osReminderInjected, false, "OS reminder flag cleared (/new 后新会话重新注入，会诊 glm 🟡)")
  assert.equal(agent._restartReminderInjected, false, "restart reminder flag cleared")
  assert.equal(agent._lastEngState, false, "eng state flag cleared")
})

test("F3b: newSession skips slot numbers whose FILE exists but manifest entry is gone (会诊 deepseek 🟡)", () => {
  const cwd = mkdtempSync(join(tmpdir(), "sess-f3b-"))
  try {
    const holder = makeAgent(cwd, [{ role: "user", content: "x" }])
    saveSession(holder)
    // 删除 manifest 的 slot 1 条目但保留文件（模拟丢失更新后的状态）
    const m = JSON.parse(readFileSync(manifestOf(cwd), "utf8"))
    delete m.slots[1]
    writeFileSync(manifestOf(cwd), JSON.stringify(m))
    assert.ok(existsSync(slotFile(cwd, 1)), "slot 1 file exists on disk")

    const slot = newSession(cwd)
    assert.notEqual(slot, 1, "must not reuse a number whose file still exists (would overwrite a real session)")
    const untouched = JSON.parse(readFileSync(slotFile(cwd, 1), "utf8"))
    assert.ok(untouched.history.length > 0, "slot 1 file untouched")
  } finally {
    cleanup(cwd)
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("F3c: saveSession rotates a newer-version file (v3) to .bak regardless of sessionStart (会诊 deepseek 🟡)", () => {
  const cwd = mkdtempSync(join(tmpdir(), "sess-f3c-"))
  try {
    const p = slotFile(cwd, 1)
    writeFileSync(p, JSON.stringify({ version: 3, cwd, title: "v3", history: [{ role: "user", content: "future" }], sessionStart: null }))
    const fresh = makeAgent(cwd, [{ role: "user", content: "old cli" }], { _sessionStart: null })
    fresh._slot = 1
    const bak = saveSession(fresh)
    assert.ok(bak && bak.includes(".bak-"), "v3 file rotated to .bak (not silently overwritten)")
    const saved = JSON.parse(readFileSync(bak, "utf8"))
    assert.equal(saved.version, 3, ".bak preserves the newer-version file")
    try { unlinkSync(bak) } catch {}
  } finally {
    cleanup(cwd)
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("F4: ensureActive never hijacks a slot that holds a session file", () => {
  const cwd = mkdtempSync(join(tmpdir(), "sess-f4-"))
  try {
    // 构造：slot 1 被"活进程"占用（当前测试进程的 PID），slot 2 有旧会话文件
    const holder = makeAgent(cwd, [{ role: "user", content: "occupied" }])
    saveSession(holder) // 写入 slot 1（当前进程认领）
    // 把 slot 1 的所有权改成"另一个活进程"（同 PID 不同 sessionId）——确保分支 1 不成立
    const m = JSON.parse(readFileSync(manifestOf(cwd), "utf8"))
    m.slotSessions[m.active] = `${process.pid}-foreign`
    // slot 2 放一个旧会话文件（模拟死主旧会话）
    const legacy = makeAgent(cwd, [{ role: "user", content: "old slot 2" }], { _sessionStart: "2026-07-01T00:00:00.000Z" })
    legacy._slot = 2
    saveSession(legacy)
    // 重新加载 manifest（上面 saveSession 可能又写过），钉住所有权
    const m2 = JSON.parse(readFileSync(manifestOf(cwd), "utf8"))
    m2.slotSessions[1] = `${process.pid}-foreign`
    m2.active = 1
    writeFileSync(manifestOf(cwd), JSON.stringify(m2))

    // 新进程视角的 activeSlot：不得劫持 slot 2（有文件），也不得用 slot 1（活进程占用）
    // → 应分配新号（3）
    const claimed = activeSlot(cwd)
    assert.notEqual(claimed, 2, "must not hijack a slot that holds a session file")
    const after = JSON.parse(readFileSync(slotFile(cwd, 2), "utf8"))
    assert.equal(after.history[0].content, "old slot 2", "slot 2 file untouched")
  } finally {
    cleanup(cwd)
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("F4: ensureActive DOES reclaim a slot whose file is missing (never held a session)", () => {
  const cwd = mkdtempSync(join(tmpdir(), "sess-f4b-"))
  try {
    const holder = makeAgent(cwd, [{ role: "user", content: "hi" }])
    saveSession(holder)
    const m = JSON.parse(readFileSync(manifestOf(cwd), "utf8"))
    // active slot 被活进程占用；制造一个"有条目但文件已删"的空 slot
    m.slotSessions[m.active] = `${process.pid}-foreign`
    m.slots[2] = { ts: Date.now() }
    writeFileSync(manifestOf(cwd), JSON.stringify(m))
    // slot 2 文件不存在（从未有会话）
    if (existsSync(slotFile(cwd, 2))) unlinkSync(slotFile(cwd, 2))

    const claimed = activeSlot(cwd)
    assert.equal(claimed, 2, "reclaims the empty (file-less) slot instead of allocating a new number")
  } finally {
    cleanup(cwd)
    rmSync(cwd, { recursive: true, force: true })
  }
})

test("F4c: applySession treats empty contextHistory as absent — falls back to full history (会诊 deepseek 🟡)", () => {
  const data = {
    version: 2,
    cwd: "x",
    title: "",
    history: [{ role: "user", content: "a" }, { role: "assistant", content: "b" }],
    contextHistory: [],
  }
  const agent = makeAgent("x", [], {})
  applySession(agent, data)
  assert.equal(agent.history.length, 2, "machine line seeded from full history when contextHistory is an empty array")
  assert.equal(agent.history[0].content, "a")
})

test("F6: v1 legacy fallback strips truncated tool_calls arguments before seeding the machine line", () => {
  const cwd = mkdtempSync(join(tmpdir(), "sess-f6-"))
  try {
    const data = {
      version: 1,
      cwd,
      title: "",
      updatedAt: Date.now(),
      sessionStart: "2026-08-01T00:00:00.000Z",
      // 无 contextHistory → 走 legacy fallback；人类线是 slimForDisplay 截断过的：
      // arguments 以 U+2026 结尾 = 被 300 字符硬切（可能劈断 \\uXXXX → 400 毒载荷）
      history: [
        { role: "user", content: "please" },
        {
          role: "assistant",
          content: "sure",
          tool_calls: [
            { id: "c1", type: "function", function: { name: "grep", arguments: '{"pattern":"\\u12' + "…" } },
            { id: "c2", type: "function", function: { name: "read", arguments: '{"path":"ok"}' } },
          ],
        },
      ],
    }
    const agent = makeAgent(cwd, [], {})
    applySession(agent, data)
    const resumed = agent.history.find((m) => m.role === "assistant")
    assert.equal(resumed.tool_calls[0].function.arguments, "{}", "truncated arguments replaced with legal empty object")
    assert.equal(resumed.tool_calls[1].function.arguments, '{"path":"ok"}', "complete arguments untouched")
  } finally {
    cleanup(cwd)
    rmSync(cwd, { recursive: true, force: true })
  }
})
