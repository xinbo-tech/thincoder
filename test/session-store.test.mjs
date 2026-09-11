/**
 * session-store.test.mjs — TUI-OOM-ROOTCAUSE 批 组 1（A1/C1——SESSION.md §14）用例表 1:1。
 *
 * 覆盖 T-RS1–T-RS9 / T-RS12–T-RS14 + AC-RS9（恢复只读末段）；T-RS10/T-RS11 在
 * integration/session-resume.test.mjs 与既有族（模式 F 零回归）。
 * 形态：快层 unit——temp 目录注入（零真实 HOME 依赖）、零网络、零定时器。
 * 段读计数口径 = `_storeStats.segmentReads`（段文件内容读——AC-RS9 断言；末段在 bind
 * 扫描时读入并缓存，窗口读取不重复读同一段）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, mkdirSync, existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import {
  bindRecordStore, saveProjectedSlot, unlinkRecordStore, recordDirOf, slimForDisplay,
  RECORD_SEG_MESSAGES, RECORD_WINDOW_MESSAGES, _storeStats,
} from "../src/session-store.mjs"
import { pushReal } from "../src/context.mjs"
import { readHistoryTool } from "../src/agent-tools/read-history.mjs"
import { deleteSlot, newSession, slotPath, applySession } from "../src/session.mjs"
import { _setSessionsDirForTest, _resetSessionsDirForTest } from "../src/session-slots.mjs"
import { runSessionGc, COLD_CWD_RETENTION_MS } from "../src/session-gc.mjs"

const msg = (i) => ({ role: i % 2 ? "assistant" : "user", content: `m-${i}` })
const segLines = (store, n) =>
  readFileSync(join(store.dir, `seg-${String(n).padStart(6, "0")}.jsonl`), "utf8")
    .split("\n").filter((l) => l !== "").length
const contents = (arr) => arr.map((m) => m.content)

/** 隔离 temp 目录（每测一支；afterEach 清）。 */
function withDir(fn) {
  const dir = mkdtempSync(join(tmpdir(), "tc-store-"))
  try { return fn(dir) } finally { try { rmSync(dir, { recursive: true, force: true }) } catch { /* ignore */ } }
}

function mkAgent(dir, over = {}) {
  return { cwd: dir, _fullHistory: [], history: [], _sessionStart: null, ...over }
}

/** 空 store + n 条 pushReal（返回 {agent, store, slotFile}）。 */
function seed(dir, n, over = {}) {
  const slotFile = join(dir, "abc.json.1")
  const agent = mkAgent(dir, over)
  const store = bindRecordStore(agent, { slotFile, identity: over._sessionStart ?? null, baseHistory: [] })
  for (let i = 0; i < n; i++) pushReal(agent, msg(i))
  return { agent, store, slotFile }
}

test("T-RS1 追加与计数：空 store 追加 250 条 → 3 段（100/100/50）、tail(200) = 第 51–250 条", () => {
  withDir((dir) => {
    const { store } = seed(dir, 250)
    assert.equal(store.total(), 250)
    assert.equal(segLines(store, 1), RECORD_SEG_MESSAGES)
    assert.equal(segLines(store, 2), RECORD_SEG_MESSAGES)
    assert.equal(segLines(store, 3), 50)
    const tail = store.tail(RECORD_WINDOW_MESSAGES)
    assert.equal(tail.length, 200)
    assert.deepEqual(contents(tail), Array.from({ length: 200 }, (_, k) => `m-${50 + k}`))
  })
})

test("T-RS2 窗口驱逐：pushReal 300 条 → _fullHistory 恰 200（最新）；store.total()==300", () => {
  withDir((dir) => {
    const { agent, store } = seed(dir, 300)
    assert.equal(RECORD_WINDOW_MESSAGES, 200) // 常量单源（AC-RS2）
    assert.equal(agent._fullHistory.length, 200)
    assert.equal(agent._fullHistory[0].content, "m-100")
    assert.equal(agent._fullHistory.at(-1).content, "m-299")
    assert.equal(store.total(), 300)
  })
})

test("T-RS3 取页（含 ±1 页沿）：默认含 29–50 条 base=29；margin:0 精确 30–49（跨段正确）", () => {
  withDir((dir) => {
    const { store } = seed(dir, 250)
    const d = store.page(30, 50)
    assert.equal(d.base, 29)
    assert.deepEqual(contents(d.messages), Array.from({ length: 22 }, (_, k) => `m-${29 + k}`))
    const z = store.page(30, 50, { margin: 0 })
    assert.equal(z.base, 30)
    assert.deepEqual(contents(z.messages), Array.from({ length: 20 }, (_, k) => `m-${30 + k}`))
    // 跨段边界（seg1→seg2 的 idx 99|100）
    const cross = store.page(99, 101, { margin: 0 })
    assert.deepEqual(contents(cross.messages), ["m-99", "m-100"])
    // 页沿越界夹紧
    const head = store.page(0, 5)
    assert.equal(head.base, 0)
    assert.deepEqual(contents(head.messages), ["m-0", "m-1", "m-2", "m-3", "m-4", "m-5"])
    const tail = store.page(248, 250)
    assert.deepEqual(contents(tail.messages), ["m-247", "m-248", "m-249"])
  })
})

test("T-RS4 重建对账（JSON 更长）：sidecar 50 条 + baseHistory 120 → 目录重建、total=120", () => {
  withDir((dir) => {
    const { store, slotFile } = seed(dir, 50, { _sessionStart: "S1" })
    assert.equal(store.total(), 50)
    const base = Array.from({ length: 120 }, (_, i) => msg(i))
    const a2 = mkAgent(dir, { _sessionStart: "S1" })
    const s2 = bindRecordStore(a2, { slotFile, identity: "S1", baseHistory: base })
    assert.equal(s2.total(), 120)
    assert.equal(segLines(s2, 1), 100, "旧段被重建覆盖（50 行现场不再存在）")
    assert.equal(segLines(s2, 2), 20)
    assert.deepEqual(contents(s2.tail(3)), ["m-117", "m-118", "m-119"])
  })
})

test("T-RS5 对账（段更长）：sidecar 130 条 + baseHistory 120 → 不重建、total=130、窗口 = 段尾部", () => {
  withDir((dir) => {
    const { agent, store, slotFile } = seed(dir, 130, { _sessionStart: "S1" })
    const base = agent._fullHistory.slice(0, 120) // 崩溃前保存的 JSON 现场（前 120 条）
    const a2 = mkAgent(dir, { _sessionStart: "S1" })
    const s2 = bindRecordStore(a2, { slotFile, identity: "S1", baseHistory: base })
    assert.equal(s2.total(), 130)
    assert.deepEqual(contents(s2.tail(3)), ["m-127", "m-128", "m-129"])
    // 恢复不重建：段 1 仍为 100 行（未被覆写）
    assert.equal(segLines(s2, 1), 100)
    assert.equal(segLines(s2, 2), 30)
  })
})

test("T-RS6 半行容忍：末段尾行截断 → 读取忽略尾行、total 少 1、不抛", () => {
  withDir((dir) => {
    const { store, slotFile } = seed(dir, 105)
    const p = join(store.dir, "seg-000002.jsonl")
    const text = readFileSync(p, "utf8")
    // 砍掉末行的尾部（半写现场——无收尾换行）
    writeFileSync(p, text.replace(/\n$/, "").slice(0, -15))
    const a2 = mkAgent(dir)
    const s2 = bindRecordStore(a2, { slotFile, identity: null, baseHistory: [] })
    assert.equal(s2.total(), 104)
    assert.doesNotThrow(() => s2.tail(10))
    assert.deepEqual(contents(s2.tail(2)), ["m-102", "m-103"])
    // 代码评审 #1 回归：半行现场 → ①后续追加不粘连（先补行终止符）②保存投影仍为合法 JSON
    pushReal(a2, { role: "user", content: "after-half-line" })
    assert.equal(s2.total(), 105, "半行被终止 + 新记录独占一行")
    assert.deepEqual(contents(s2.tail(1)), ["after-half-line"])
    const proj = join(dir, "proj.json.1")
    saveProjectedSlot(a2, proj, { version: 2, sessionStart: null }, [])
    const disk = JSON.parse(readFileSync(proj, "utf8"))
    assert.equal(disk.history.length, 105, "投影剔除半行、保留全部完整行")
    assert.equal(disk.history.at(-1).content, "after-half-line")
  })
})

test("T-RS7 投影逐字节：history 数组内容与旧实现（slim 全量）逐条相等；version==2", () => {
  withDir((dir) => {
    const slotFile = join(dir, "abc.json.1")
    const agent = mkAgent(dir, { _sessionStart: "S1" })
    const store = bindRecordStore(agent, { slotFile, identity: "S1", baseHistory: [] })
    const msgs = [
      { role: "user", content: "hello" },
      { role: "assistant", content: null, tool_calls: [{ id: "c1", type: "function", function: { name: "read", arguments: "x".repeat(400) } }] },
      { role: "tool", tool_call_id: "c1", content: "y".repeat(900) },
      { role: "user", content: [{ type: "text", text: "pic" }, { type: "image_url", image_url: { url: "data:image/png;base64,AAAA" } }] },
      { role: "user", content: "transient-hidden", transient: true },
    ]
    for (const m of msgs) pushReal(agent, m)
    const fields = { version: 2, cwd: dir, title: "", activeProvider: "mock", activeModel: null, updatedAt: 1, tasks: [], planMode: false, autoApprove: false, engineering: false, goal: null, advisor: null, pendingReminders: [], sessionStart: "S1" }
    saveProjectedSlot(agent, slotFile, fields, agent.history)
    const disk = JSON.parse(readFileSync(slotFile, "utf8"))
    assert.equal(disk.version, 2)
    assert.equal(Array.isArray(disk.history), true)
    // 旧实现等价面：_fullHistory 过滤 transient/legacy → slimForDisplay
    const expected = agent._fullHistory.filter((m) => !m.transient).map(slimForDisplay)
    assert.equal(disk.history.length, expected.length)
    assert.deepEqual(disk.history, JSON.parse(JSON.stringify(expected)))
    assert.equal(disk.history.some((m) => m.content?.includes?.("transient-hidden")), false)
    // VSC 兼容面：contextHistory 字段保留
    assert.equal(Array.isArray(disk.contextHistory), true)
  })
})

test("T-RS8 流式检索：total=500、keyword 命中 3 条（含窗口外）——newest/oldest + limit 语义", () => {
  withDir((dir) => {
    const { agent } = seed(dir, 500)
    // 三条命中（idx 10 / 250 / 490——250/490 在内存窗口外）
    for (const i of [10, 250, 490]) {
      agent._fullHistory.push({ role: "user", content: `needle-${i}` })
      agent._recordStore.append({ role: "user", content: `needle-${i}` })
    }
    const all = JSON.parse(readHistoryTool.execute({ keyword: "needle" }, { agent }))
    assert.deepEqual(all.map((e) => e.content), ["needle-10", "needle-250", "needle-490"])
    const newest = JSON.parse(readHistoryTool.execute({ keyword: "needle", limit: 2 }, { agent }))
    assert.deepEqual(newest.map((e) => e.content), ["needle-250", "needle-490"])
    const oldest = JSON.parse(readHistoryTool.execute({ keyword: "needle", direction: "oldest", limit: 2 }, { agent }))
    assert.deepEqual(oldest.map((e) => e.content), ["needle-10", "needle-250"])
    // limit 默认 50 / 上限 200 语义不变（超出命中数即全量）
    const big = JSON.parse(readHistoryTool.execute({ keyword: "needle", limit: 999 }, { agent }))
    assert.equal(big.length, 3)
    // 未命中
    assert.deepEqual(JSON.parse(readHistoryTool.execute({ keyword: "absent" }, { agent })), [])
  })
})

test("T-RS8b 长内容检索（delta 登记）：>500 字符尾段不命中；前段命中、N 按存储文本计", () => {
  withDir((dir) => {
    const { agent } = seed(dir, 3)
    const long = "x".repeat(900) + "NEEDLEFAR" + "y".repeat(1200)
    pushReal(agent, { role: "tool", tool_call_id: "c1", name: "read", content: long })
    pushReal(agent, { role: "tool", tool_call_id: "c2", name: "read", content: "NEEDLENEAR" + "z".repeat(1200) })
    // 900 字符处（>500）：存储文本截断 → 不命中（delta——原内存全量匹配会命中）
    const far = JSON.parse(readHistoryTool.execute({ keyword: "NEEDLEFAR" }, { agent }))
    assert.equal(far.length, 0)
    // 100 字符内：命中；省略数 N 按存储文本长度计（不反映原始丢弃量——delta 登记）
    const near = JSON.parse(readHistoryTool.execute({ keyword: "NEEDLENEAR" }, { agent }))
    assert.equal(near.length, 1)
    const stored = slimForDisplay({ role: "tool", content: "NEEDLENEAR" + "z".repeat(1200) }).content
    assert.match(near[0].content, /truncated: \d+ chars/)
    assert.equal(near[0].content, stored.slice(0, 500) + `\n… (truncated: ${stored.length - 500} chars — full text is in the session file)`)
  })
})

test("T-RS9 删除联动：deleteSlot 清 sidecar；session gc --confirm 清冷前缀后不存在", () => {
  const sessionsDir = mkdtempSync(join(tmpdir(), "tc-store-sess-"))
  const cwd = mkdtempSync(join(tmpdir(), "tc-store-proj-"))
  _setSessionsDirForTest(sessionsDir)
  try {
    // ① deleteSlot 联动
    const slot = newSession(cwd)
    const sf = slotPath(cwd, slot)
    const a1 = { cwd, _fullHistory: [], history: [], _sessionStart: "S1" }
    const s1 = bindRecordStore(a1, { slotFile: sf, identity: "S1", baseHistory: [] })
    pushReal(a1, msg(0))
    assert.equal(existsSync(recordDirOf(sf)), true)
    assert.equal(deleteSlot(cwd, slot), true)
    assert.equal(existsSync(recordDirOf(sf)), false, "删槽连带删除记录存储")

    // ② 冷前缀清理（now 注入使 manifest 判冷；aliveFn=false 无活主）
    const slot2 = newSession(cwd)
    const sf2 = slotPath(cwd, slot2)
    const a2 = { cwd, _fullHistory: [], history: [], _sessionStart: "S2" }
    bindRecordStore(a2, { slotFile: sf2, identity: "S2", baseHistory: [] })
    pushReal(a2, msg(1))
    assert.equal(existsSync(recordDirOf(sf2)), true)
    const out = []
    const code = runSessionGc(["gc", "--confirm", "--all"], {
      dir: sessionsDir, cwd, now: Date.now() + COLD_CWD_RETENTION_MS + 86_400_000,
      out: (s) => out.push(s), err: (s) => out.push(s), aliveFn: () => false,
    })
    assert.equal(code, 0)
    assert.equal(existsSync(recordDirOf(sf2)), false, "冷前缀清理连带删除记录存储")
  } finally {
    _resetSessionsDirForTest()
    try { rmSync(sessionsDir, { recursive: true, force: true }) } catch { /* ignore */ }
    try { rmSync(cwd, { recursive: true, force: true }) } catch { /* ignore */ }
  }
})

test("T-RS12 身份核验（陈旧/孤儿拒绝）：不采纳、改名 .stale-*、旧内容零进入", () => {
  withDir((dir) => {
    const slotFile = join(dir, "abc.json.1")
    const a1 = mkAgent(dir, { _sessionStart: "S1" })
    bindRecordStore(a1, { slotFile, identity: "S1", baseHistory: [msg(0), msg(1)] })
    assert.equal(readdirSync(dir).some((n) => n.includes(".stale-")), false)

    // 现场身份 S2（≠ S1）→ 陈旧 sidecar 拒采纳 + 改名保留 + 按现场重建
    const base = Array.from({ length: 5 }, (_, i) => msg(i))
    const a2 = mkAgent(dir, { _sessionStart: "S2" })
    const s2 = bindRecordStore(a2, { slotFile, identity: "S2", baseHistory: base })
    assert.equal(s2.total(), 5, "total = JSON 条数（旧内容零进入）")
    assert.deepEqual(contents(s2.tail(10)), ["m-0", "m-1", "m-2", "m-3", "m-4"])
    assert.equal(readdirSync(dir).filter((n) => n.includes(".stale-")).length, 1)

    // 一侧非空一侧为空（现场 null）→ 同样拒采纳
    const slotFile2 = join(dir, "def.json.1")
    const b1 = mkAgent(dir, { _sessionStart: "S1" })
    bindRecordStore(b1, { slotFile: slotFile2, identity: "S1", baseHistory: [msg(0)] })
    const b2 = mkAgent(dir, { _sessionStart: null })
    const s3 = bindRecordStore(b2, { slotFile: slotFile2, identity: null, baseHistory: [] })
    assert.equal(s3.total(), 0)
    assert.equal(readdirSync(dir).filter((n) => n.includes(".stale-")).length, 2)
    // 内审 #1 回归：隔离后空 base（不重物化）——新建 sidecar 写的是**现场**身份（非旧身份）
    b2._sessionStart = "S2"
    pushReal(b2, msg(9))
    const meta3 = JSON.parse(readFileSync(join(s3.dir, "meta.json"), "utf8"))
    assert.equal(meta3.identity, "S2", "新建 sidecar 身份 = 现场身份（旧身份不残留）")
    // 再 bind（现场 S2）→ 采纳（不二次隔离——身份已固化正确）
    const b3 = mkAgent(dir, { _sessionStart: "S2" })
    const s4 = bindRecordStore(b3, { slotFile: slotFile2, identity: "S2", baseHistory: [msg(9)] })
    assert.equal(s4.total(), 1)
    assert.equal(readdirSync(dir).filter((n) => n.includes(".stale-")).length, 2, "无二次隔离")
  })
})

test("T-RS13 身份固化：全新 sidecar + 首次保存 → meta.identity 补写；再 bind 采纳对账", () => {
  withDir((dir) => {
    const slotFile = join(dir, "abc.json.1")
    const agent = mkAgent(dir) // _sessionStart = null（/new 后未播种）
    const store = bindRecordStore(agent, { slotFile, identity: null, baseHistory: [] })
    pushReal(agent, msg(0))
    agent._sessionStart = "S1" // 首跑播种
    saveProjectedSlot(agent, slotFile, { version: 2, sessionStart: "S1" }, [])
    const meta = JSON.parse(readFileSync(join(store.dir, "meta.json"), "utf8"))
    assert.equal(meta.identity, "S1")
    assert.equal(meta.v, 1)
    assert.equal(meta.segSize, RECORD_SEG_MESSAGES)
    // 再 bind（现场 S1）→ 采纳对账（段≥JSON 语义不变——不产 .stale-）
    const a2 = mkAgent(dir, { _sessionStart: "S1" })
    const s2 = bindRecordStore(a2, { slotFile, identity: "S1", baseHistory: [msg(0)] })
    assert.equal(s2.total(), 1)
    assert.equal(readdirSync(dir).filter((n) => n.includes(".stale-")).length, 0)
  })
})

test("T-RS14 降级：失败不抛 + _degraded + 段内容冻结；追赶成功清标记；持续失败 → meta.degraded → bind 重建", () => {
  withDir((dir) => {
    // ① 注入 append 失败（段路径被目录占位——跨平台稳定失败）：失败即停 + 追赶恢复
    const slotFile = join(dir, "x.json.1")
    const a1 = mkAgent(dir, { _sessionStart: "S1" })
    const s1 = bindRecordStore(a1, { slotFile, identity: "S1", baseHistory: [] })
    mkdirSync(join(s1.dir, "seg-000001.jsonl"), { recursive: true })
    assert.doesNotThrow(() => pushReal(a1, msg(0)))
    assert.equal(s1.degraded, true)
    assert.equal(s1.total(), 0)
    pushReal(a1, msg(1)) // 停写（负断言：段无新行）
    assert.equal(s1.total(), 0)
    assert.equal(s1.memTotal, 2)
    assert.equal(readdirSync(s1.dir).filter((n) => /^seg-\d+\.jsonl$/.test(n) && n !== "seg-000001.jsonl").length, 0)
    rmSync(join(s1.dir, "seg-000001.jsonl"), { recursive: true, force: true })
    assert.equal(s1.catchUp(), true, "窗口内缺口 → 追赶重试成功")
    assert.equal(s1.degraded, false)
    assert.equal(s1.total(), 2)
    assert.equal(_storeStats.catchUpRetries >= 1, true)

    // ② 持续失败 → meta.degraded + 投影照 store 前缀；bind 见标记 → 以 JSON 为准重建（清标记）
    const slotFile2 = join(dir, "y.json.1")
    const a2 = mkAgent(dir, { _sessionStart: "S2" })
    const s2 = bindRecordStore(a2, { slotFile: slotFile2, identity: "S2", baseHistory: [] })
    mkdirSync(join(s2.dir, "seg-000001.jsonl"), { recursive: true })
    pushReal(a2, msg(0))
    pushReal(a2, msg(1))
    saveProjectedSlot(a2, slotFile2, { version: 2, sessionStart: "S2" }, [])
    const meta2 = JSON.parse(readFileSync(join(s2.dir, "meta.json"), "utf8"))
    assert.equal(meta2.degraded, true)
    const disk2 = JSON.parse(readFileSync(slotFile2, "utf8"))
    assert.equal(disk2.history.length, 0, "投影照 store 前缀")
    rmSync(join(s2.dir, "seg-000001.jsonl"), { recursive: true, force: true })
    const a3 = mkAgent(dir, { _sessionStart: "S2" })
    const s3 = bindRecordStore(a3, { slotFile: slotFile2, identity: "S2", baseHistory: [msg(7)] })
    assert.equal(s3.total(), 1, "以 JSON 为准重建")
    const meta3 = JSON.parse(readFileSync(join(s3.dir, "meta.json"), "utf8"))
    assert.equal(meta3.degraded, undefined, "降级标记清除")
  })
})

test("AC-RS9 恢复只读末段：bind + tail 段读次数 ≤ 2（300 条满段夹具——不因会话长大全量物化）", () => {
  withDir((dir) => {
    const slotFile = join(dir, "abc.json.1")
    const base = Array.from({ length: 300 }, (_, i) => msg(i))
    const a1 = mkAgent(dir)
    const s1 = bindRecordStore(a1, { slotFile, identity: null, baseHistory: base })
    assert.equal(s1.total(), 300)
    _storeStats.segmentReads = 0
    const a2 = mkAgent(dir)
    const s2 = bindRecordStore(a2, { slotFile, identity: null, baseHistory: base })
    const win = s2.tail(RECORD_WINDOW_MESSAGES)
    assert.equal(win.length, 200)
    assert.deepEqual(contents(win.slice(0, 2)), ["m-100", "m-101"])
    assert.ok(_storeStats.segmentReads <= 2, `段读次数 ${_storeStats.segmentReads} ≤ 2`)
  })
})

test("T-RS11 未绑定模式 F：pushReal 全量数组（无驱逐、无 sidecar 写入）；applySession 无 slot → 解绑", () => {
  withDir((dir) => {
    const slotFile = join(dir, "abc.json.1")
    const agent = mkAgent(dir) // 无 store（模式 F——thincoder chat / 测试路径）
    for (let i = 0; i < 300; i++) pushReal(agent, msg(i))
    assert.equal(agent._fullHistory.length, 300, "未绑定不驱逐（既有全量行为）")
    assert.equal(agent._recordStore, undefined)
    assert.equal(existsSync(recordDirOf(slotFile)), false, "负断言：无 sidecar 写入")
    // applySession 无 slot（占用分支/测试）→ 模式 F：人读线全量、无 store
    const a2 = mkAgent(dir)
    const data = { version: 2, history: Array.from({ length: 250 }, (_, i) => msg(i)), contextHistory: [], sessionStart: "S1" }
    applySession(a2, data)
    assert.equal(a2._recordStore, null)
    assert.equal(a2._fullHistory.length, 250)
    assert.equal(a2._historyWindow, null)
  })
})

test("unlinkRecordStore：目录不存在/失败均静默（尽力面）", () => {
  withDir((dir) => {
    const sf = join(dir, "none.json.1")
    assert.doesNotThrow(() => unlinkRecordStore(sf))
    assert.equal(existsSync(recordDirOf(sf)), false)
  })
})
