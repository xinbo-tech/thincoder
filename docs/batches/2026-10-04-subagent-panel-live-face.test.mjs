/**
 * 2026-10-04-subagent-panel-live-face.test.mjs — 批内件（子代理面板 · 实况回读与归还补口批 · 实施轮 · 台账 #891 ∥ #892）。
 * 用例清单（21 条）= 批档 `docs/batches/2026-10-04-subagent-panel-live-face.md` §2 ∥ 设计档
 * `docs/desktop/design/PANEL-READBACK.md` §6：
 *   T-A1..A11 归还（核 `suspension.mjs` 回收恒达窗 + 残差注入返回面 ∥ 桌面挂起驱动 reemitDone 计数面）；
 *   T-B1..B5 回读（渲染面快照构形/签名去重 ∥ 主侧读数缓存 ∥ 工具读源链 source:renderer ∥ 降级回落）；
 *   T-C1..C5 回收阀（桌面 freeze 门控/发射字面 ∥ relay 桥出站 ∥ 渲染归档 + record ∥ CLI 回归锚）。
 * 面 = 本批改动面；平 node 直测 · 零网络 · 零 electron；`/rc/` 解析钩子机制同 `thincoder-desktop/test/rc-resolve.mjs`。
 * 跑法（任意 cwd —— 路径按本档自身位置解析）：node --test docs/batches/2026-10-04-subagent-panel-live-face.test.mjs
 */
import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { createRequire, registerHooks } from "node:module"
import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const ROOT = new URL("../../", import.meta.url) // 仓根 = 本档上两级（thincoder/）
const rel = (p) => fileURLToPath(new URL(p, ROOT))
const src = (p) => readFileSync(rel(p), "utf8")
const load = (p) => import(new URL(p, ROOT).href)
const require = createRequire(rel("thincoder-desktop/package.json"))

// `/rc/` 解析钩子（渲染档 import 的核件面 —— 测试与生产走同一份核件；先于一切动态 import 注册）。
const CORE_ROOT = dirname(require.resolve("@thincoder/render-core/package.json"))
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("/rc/")) return { url: pathToFileURL(join(CORE_ROOT, specifier.slice(4))).href, shortCircuit: true }
    return nextResolve(specifier, context)
  },
})

const sleep = (ms) => new Promise((done) => setTimeout(done, ms))
const abortErr = () => Object.assign(new Error("turn aborted"), { name: "AbortError" })
async function waitFor(predicate, timeoutMs = 1500) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) { if (predicate()) return true; await sleep(5) }
  return predicate()
}
/** 核挂起载体夹具（两池 + pending 单容器 + 会话池 —— 字段面 = `suspension.mjs` 档头契约）。 */
function baseCarrier(pending = []) {
  return { _pendingAsyncResults: pending, _asyncSubagents: new Map(), _asyncAdvisors: new Map(), _consultSessions: new Map(), _suspended: false }
}
const nonEmpty = (list) => list.filter((r) => r.length > 0)

// ─── T-A 归还（核 suspension.mjs 恒达窗 + 残差注入返回面 ∥ 桌面驱动）────────────────────────

test("T-A1 归还·正常：用户轮消费 2 条目 ⇒ reclaim(consumed) 恰 2（done ×2 · 回归锚）", async () => {
  const { startSuspension } = await load("thincoder-core/agent/suspension.mjs")
  const e1 = { role: "explore", id: 1 }, e2 = { role: "explore", id: 2 }
  const carrier = baseCarrier([e1, e2])
  const turns = []; const reclaims = []
  const h = startSuspension({
    carrier, inputQueue: ["go"],
    runTurn: async (text) => { turns.push(text); carrier._pendingAsyncResults.splice(0) }, // 起跑注入（D-S3 消费）
    hooks: { reclaim: (consumed) => reclaims.push(consumed) },
  })
  const res = await h.done
  assert.equal(res.reason, "idle")
  assert.deepEqual(turns, ["go"])
  assert.deepEqual(nonEmpty(reclaims), [[e1, e2]], "reclaim(consumed) 恰 2 条（同一批 · 既有行为）")
})

test("T-A2 归还·正常：消化轮消费 1 条 ⇒ 发射 ≥1（起跑窗 ×1 + reclaim 兜底）；归档/记录恰一次", async () => {
  const { createSuspensionDrive } = await load("thincoder-desktop/src/main/suspension-drive.mjs")
  const entry = { role: "advisor", id: 27, startedAt: Date.now() }
  const agent = { ...baseCarrier([entry]), history: [], _fullHistory: [] }
  const posts = []
  const drive = createSuspensionDrive({
    post: (channel, payload) => posts.push({ channel, payload }),
    runTurn: async (_key, a) => { a._pendingAsyncResults.splice(0) }, // 起跑注入面（消费）
  })
  assert.equal(drive.start("1", agent), true)
  await waitFor(() => posts.some((p) => p.channel === "ev:susp" && p.payload.active === false))
  const done = posts.filter((p) => p.channel === "ev:subagent" && p.payload.status === "done" && p.payload.id === 27)
  assert.equal(done.length, 2, "双发面：起跑窗 done ×1 + reclaim 兜底 ×1（发射层不去重）")
  // 归档/记录恰一次（幂等住归档层）——两份 done 帧逐条入渲染归约：
  const records = []
  globalThis.thincoder = { invoke: (channel, payload) => { records.push({ channel, payload }); return Promise.resolve({ ok: true }) } }
  try {
    const { onSubagent } = await load("thincoder-desktop/renderer/subagent-reduce.mjs")
    let state = { activeSession: "1", subBlocks: {}, blocks: [], following: true, pendingNew: 0, pool: {}, history: {} }
    state = onSubagent(state, { key: "1", status: "started", role: "advisor", id: 27, pool: true }, 500)
    state = onSubagent(state, { key: "1", status: "settled", role: "advisor", id: 27 }, 1000)
    for (const frame of done) state = onSubagent(state, frame.payload, 2000)
    assert.equal(records.length, 1, "归档/记录恰一次")
    assert.equal(records[0].channel, "record:append")
    assert.equal(records[0].payload.record.meta.status, "done")
  } finally { delete globalThis.thincoder }
})

test("T-A3 归还·边界：消化轮吸收中途 AbortError（Abort-continue）⇒ reclaim 仍达（修前红）；循环重入", async () => {
  const { startSuspension } = await load("thincoder-core/agent/suspension.mjs")
  const e = { role: "explore", id: 3 }
  const carrier = baseCarrier([e])
  const queue = []
  const turns = []; const reclaims = []; const digests = []
  const h = startSuspension({
    carrier, inputQueue: queue,
    hooks: { reclaim: (c) => reclaims.push(c), onDigest: (phase) => digests.push(phase) },
    runTurn: async (text) => {
      turns.push(text)
      if (turns.length === 1) { carrier._pendingAsyncResults.splice(0); queue.push("re-entry"); throw abortErr() }
    },
  })
  const res = await h.done
  assert.equal(res.reason, "idle")
  assert.deepEqual(nonEmpty(reclaims), [[e]], "Abort-continue ⇒ reclaim 仍达（修前：零调用）")
  assert.deepEqual(digests, ["start", "end"], "中止径补 onDigest end（既有语义序保持）")
  assert.equal(turns.length, 2, "循环重入（第二回合取走重入输入）")
})

test("T-A4 归还·错误：用户轮 runTurn 抛非 abort 错 ⇒ reclaim 已发（finally 序 · 修前红）；异常续抛", async () => {
  const { startSuspension } = await load("thincoder-core/agent/suspension.mjs")
  const e = { role: "explore", id: 4 }
  const carrier = baseCarrier([e])
  const reclaims = []
  const h = startSuspension({
    carrier, inputQueue: ["go"], hooks: { reclaim: (c) => reclaims.push(c) },
    runTurn: async () => { carrier._pendingAsyncResults.splice(0); throw new Error("boom") },
  })
  await assert.rejects(h.done, /boom/, "异常续抛（fail-loud）")
  assert.deepEqual(nonEmpty(reclaims), [[e]], "异常径 reclaim 已发（修前：零调用）")
})

test("T-A5 归还·错误：timer 轮 runTurn 抛错 ⇒ reclaim 已发（修前红）；异常续抛", async () => {
  const { startSuspension } = await load("thincoder-core/agent/suspension.mjs")
  const e = { role: "explore", id: 5 }
  const carrier = baseCarrier([])
  carrier._asyncSubagents.set("R", { role: "explore", id: 90, status: "running" }) // 池 live ⇒ 进等待
  const reclaims = []; const turns = []
  let parked = false
  const h = startSuspension({
    carrier, hooks: { reclaim: (c) => reclaims.push(c) },
    timerFace: { deadline: () => Date.now() + 1000, deliver: () => true },
    // 等待窗内落槽一条（settle 竞态面）——timer 兑现前到达 ⇒ 本 timer 轮起跑快照含它。
    timer: (fn) => { if (!parked) { parked = true; carrier._pendingAsyncResults.push(e) } queueMicrotask(fn); return null },
    runTurn: async (_text, opts) => { turns.push(opts); carrier._pendingAsyncResults.splice(0); throw new Error("timer-boom") },
  })
  await assert.rejects(h.done, /timer-boom/)
  assert.equal(turns.length, 1)
  assert.deepEqual(turns[0], { autoTurn: true, timerTurn: true })
  assert.deepEqual(nonEmpty(reclaims), [[e]], "timer 轮异常径 reclaim 已发（修前：零调用）")
})

test("T-A6 归还·边界：自然退出残差 1 条 ⇒ injectResidual + reclaim(离容集) 恰 1（修前红）；freezeAll 不重发", async () => {
  const { startSuspension } = await load("thincoder-core/agent/suspension.mjs")
  const e = { role: "explore", id: 6 }
  const carrier = baseCarrier([])
  const injected = []; const reclaims = []; const freezeEmits = []
  const h = startSuspension({
    carrier, inputQueue: ["go"],
    injectResidual: async (entry) => { injected.push(entry) },
    hooks: {
      reclaim: (c) => reclaims.push(c),
      // freezeAll 发射面桩（桌面 `resident()` 同式：两池 + pending 单容器）——实测其可见集：
      freezeAll: () => {
        for (const map of [carrier._asyncSubagents, carrier._asyncAdvisors]) for (const x of map.values()) freezeEmits.push(x)
        freezeEmits.push(...(carrier._pendingAsyncResults ?? []))
      },
    },
    // 回合中途落槽（极端竞态残项）后抛出 ⇒ 退出清场残差非空（idle 直注入面）：
    runTurn: async () => { carrier._pendingAsyncResults.push(e); throw new Error("exit-race") },
  })
  await assert.rejects(h.done, /exit-race/)
  assert.deepEqual(injected, [e], "残差注入（注入成功）")
  assert.deepEqual(nonEmpty(reclaims), [[e]], "reclaim(离容集) 恰 1（修前：零发射）")
  assert.deepEqual(freezeEmits, [], "freezeAll 不重发（离容集已不在容器 ∕ 池）")
})

test("T-A7 归还·边界：会话中止清空 2 条 ⇒ freezeAll 用中止前快照（含 2 条）；快照外零重发", async () => {
  const { createSuspensionDrive } = await load("thincoder-desktop/src/main/suspension-drive.mjs")
  const poolEntry = { role: "explore", id: 90, status: "running", startedAt: Date.now() }
  const e1 = { role: "eng-coder", id: 21 }, e2 = { role: "eng-coder", id: 22 }
  const carrier = baseCarrier([])
  carrier._asyncSubagents.set("R", poolEntry)
  carrier.history = []; carrier._fullHistory = []
  const posts = []
  const drive = createSuspensionDrive({ post: (channel, payload) => posts.push({ channel, payload }), runTurn: async () => {} })
  assert.equal(drive.start("1", carrier), true)
  await sleep(10) // 进入等待（池 live）
  carrier._pendingAsyncResults.push(e1, e2) // 等待窗内落槽（无唤醒 ⇒ 循环仍驻等待）
  assert.equal(drive.abort("1"), true)
  await waitFor(() => posts.some((p) => p.channel === "ev:susp" && p.payload.active === false))
  const done = posts.filter((p) => p.channel === "ev:subagent" && p.payload.status === "done")
  assert.deepEqual(done.map((p) => p.payload.id).sort((a, b) => a - b), [21, 22, 90], "中止前快照逐条补发（两条 pending + 池条目）")
  assert.equal(done.length, 3, "快照外零重发")
  assert.equal(carrier._pendingAsyncResults.length, 0, "中止清空（冻结走快照非读后态）")
})

test("T-A8 归还·正常：宿主桩（reemitDone 计数面）⇒ done 帧 ≥1；归档/record 恰一次（重复补发不增档）", async () => {
  const { createSuspensionDrive } = await load("thincoder-desktop/src/main/suspension-drive.mjs")
  const entry = { role: "advisor", id: 41, startedAt: Date.now() }
  const agent = { ...baseCarrier([entry]), history: [], _fullHistory: [] }
  const posts = []
  const drive = createSuspensionDrive({
    post: (channel, payload) => posts.push({ channel, payload }),
    runTurn: async (_key, a) => { a._pendingAsyncResults.splice(0) },
  })
  drive.start("1", agent)
  await waitFor(() => posts.some((p) => p.channel === "ev:susp" && p.payload.active === false))
  const done = posts.filter((p) => p.channel === "ev:subagent" && p.payload.status === "done")
  assert.ok(done.length >= 1, "发射面 done 帧 ≥1")
  const records = []
  globalThis.thincoder = { invoke: (channel, payload) => { records.push(payload); return Promise.resolve({ ok: true }) } }
  try {
    const { onSubagent } = await load("thincoder-desktop/renderer/subagent-reduce.mjs")
    let state = { activeSession: "1", subBlocks: {}, blocks: [], following: true, pendingNew: 0, pool: {}, history: {} }
    state = onSubagent(state, { key: "1", status: "started", role: "advisor", id: 41, pool: true }, 500)
    state = onSubagent(state, { key: "1", status: "settled", role: "advisor", id: 41 }, 1000)
    for (const frame of done) state = onSubagent(state, frame.payload, 2000) // 全部补发帧逐条入归约
    state = onSubagent(state, { key: "1", status: "done", role: "advisor", id: 41 }, 3000) // 额外重复补发一枚
    assert.equal(records.length, 1, "归档/记录恰一次（幂等住归档/记录层）")
    assert.equal(state.blocks.filter((b) => b.kind === "subagent").length, 1, "流内归档块恰一枚")
    assert.equal(state.subBlocks["1"].find((b) => b.key === "sub:advisor#41").region, "flow", "墓碑（region:flow）")
  } finally { delete globalThis.thincoder }
})

test("T-A9 归还·边界：timer 轮吸收中途 AbortError（timer 支 Abort-continue）⇒ reclaim 仍达（修前红）；循环重入", async () => {
  const { startSuspension } = await load("thincoder-core/agent/suspension.mjs")
  const e = { role: "explore", id: 9 }
  const carrier = baseCarrier([])
  carrier._asyncSubagents.set("R", { role: "explore", id: 91, status: "running" })
  const reclaims = []; const turns = []; const digests = []
  let parked = false
  const h = startSuspension({
    carrier,
    hooks: { reclaim: (c) => reclaims.push(c), onDigest: (p) => digests.push(p) },
    timerFace: { deadline: () => Date.now() + 1000, deliver: () => true },
    timer: (fn) => { if (!parked) { parked = true; carrier._pendingAsyncResults.push(e) } queueMicrotask(fn); return null },
    runTurn: async (_text, opts) => {
      turns.push(opts)
      if (turns.length === 1) { carrier._pendingAsyncResults.splice(0); throw abortErr() }
      carrier._asyncSubagents.clear() // 二轮后池空 ⇒ 循环自然退出（测试收束）
    },
  })
  const res = await h.done
  assert.equal(res.reason, "idle")
  assert.deepEqual(nonEmpty(reclaims), [[e]], "timer 支 Abort-continue ⇒ reclaim 仍达（修前：零调用）")
  assert.equal(turns.length, 2, "循环重入（timer 轮再开）")
  assert.ok(turns.every((o) => o.timerTurn === true))
  assert.deepEqual(digests, [], "timer 轮不发 digest 边界（现序保持）")
})

test("T-A10 归还·错误：消化轮 runTurn 抛非 abort 错（消化支异常窗）⇒ reclaim 已发（修前红）；异常续抛", async () => {
  const { startSuspension } = await load("thincoder-core/agent/suspension.mjs")
  const e = { role: "explore", id: 10 }
  const carrier = baseCarrier([e])
  const reclaims = []
  const h = startSuspension({
    carrier, hooks: { reclaim: (c) => reclaims.push(c) },
    runTurn: async () => { carrier._pendingAsyncResults.splice(0); throw new Error("digest-boom") },
  })
  await assert.rejects(h.done, /digest-boom/)
  assert.deepEqual(nonEmpty(reclaims), [[e]], "恒达窗 ⇒ reclaim 已发（修前：零调用）")
})

test("T-A11 归还·错误：残差 2 条第 2 条注入抛错 ⇒ 前缀 1 条注入；reclaim(离容全量 2) 恰一；首错重抛", async () => {
  const { startSuspension } = await load("thincoder-core/agent/suspension.mjs")
  const e1 = { role: "explore", id: 11 }, e2 = { role: "explore", id: 12 }
  const carrier = baseCarrier([])
  const injected = []; const reclaims = []
  const h = startSuspension({
    carrier, inputQueue: ["go"],
    injectResidual: async (entry) => { if (entry === e2) throw new Error("inject-boom"); injected.push(entry) },
    hooks: { reclaim: (c) => reclaims.push(c) },
    runTurn: async () => { carrier._pendingAsyncResults.push(e1, e2); throw new Error("user-boom") },
  })
  await assert.rejects(h.done, /inject-boom/, "首错重抛（fail-loud）")
  assert.deepEqual(injected, [e1], "前缀 = 1 条已注入")
  assert.deepEqual(nonEmpty(reclaims), [[e1, e2]], "补发面 = 离容全量（不缩水 · 修前：零 reclaim ∥ 零补发）")
})

// ─── T-B 回读（渲染面快照 ∥ 主侧缓存 ∥ 工具读源链）────────────────────────────────────────

test("T-B1 回读·正常：快照判别六键 + role/id 随行；region ∥ dom 判别正确", async () => {
  const { snapshotPanelBlocks } = await load("thincoder-desktop/renderer/panel-readout.mjs")
  const state = { activeSession: "7", subBlocks: { "7": [
    { key: "sub:advisor#27", role: "advisor", id: 27, status: "running" },
    { key: "sub:eng-coder#36", role: "eng-coder", id: 36, status: "done", frozen: true, awaitingDigest: true },
    { key: "sub:eng-designer#40", role: "eng-designer", id: 40, status: "done", frozen: true, region: "flow" },
  ] } }
  const dom = new Set(["sub:advisor#27", "sub:eng-designer#40"])
  assert.deepEqual(snapshotPanelBlocks(state, "7", (k) => dom.has(k)), [
    { key: "sub:advisor#27", role: "advisor", id: 27, status: "running", frozen: false, awaitingDigest: false, region: "activity", dom: true },
    { key: "sub:eng-coder#36", role: "eng-coder", id: 36, status: "done", frozen: true, awaitingDigest: true, region: "activity", dom: false },
    { key: "sub:eng-designer#40", role: "eng-designer", id: 40, status: "done", frozen: true, awaitingDigest: false, region: "flow", dom: true },
  ])
})

test("T-B2 回读·边界：同签名二次 settle 零二次上报；status 翻转 ⇒ 一报（去重语义）", async () => {
  const { createPanelReadout } = await load("thincoder-desktop/renderer/panel-readout.mjs")
  const calls = []
  const readout = createPanelReadout({
    invoke: (channel, payload) => { calls.push({ channel, payload }); return Promise.resolve({ ok: true }) },
    queryDom: () => true,
  })
  const mk = (status, extra = {}) => ({ activeSession: "7", subBlocks: { "7": [{ key: "sub:advisor#27", role: "advisor", id: 27, status, ...extra }] } })
  assert.equal(readout.settle(mk("running")), true); assert.equal(calls.length, 1)
  assert.equal(readout.settle(mk("running")), false); assert.equal(calls.length, 1, "同签名零二次上报")
  assert.equal(readout.settle(mk("done", { frozen: true, awaitingDigest: true })), true); assert.equal(calls.length, 2, "状态翻转 ⇒ 一报")
  assert.equal(calls[1].channel, "panel:state")
  assert.equal(calls[1].payload.key, "7")
  assert.equal(calls[1].payload.blocks[0].awaitingDigest, true, "最新快照随行")
  assert.equal(readout.settle({ activeSession: "8", subBlocks: { "8": [] } }), true); assert.equal(calls.length, 3, "会话切换 ⇒ 一报")
})

test("T-B3 回读·正常：缓存 report/get ∥ 后报覆前报 ∥ 缺键；通道面闭合（末位 51 · 表行 = 白名单 · 四处接线）", async () => {
  const { createPanelLive } = await load("thincoder-desktop/src/main/panel-live.mjs")
  let clock = 1000
  const live = createPanelLive({ now: () => clock })
  assert.equal(live.get("1"), null, "缺键 ⇒ null")
  const b1 = [{ key: "sub:advisor#27" }]
  live.report("1", b1)
  assert.deepEqual(live.get("1"), { blocks: b1, receivedAt: 1000 })
  clock = 1500
  const b2 = [{ key: "sub:eng-coder#36" }]
  live.report("1", b2)
  assert.deepEqual(live.get("1"), { blocks: b2, receivedAt: 1500 }, "后报覆前报")
  assert.equal(live.get("2"), null)
  // 通道面闭合：白名单末位 51 ∥ HANDLERS 表行 = 白名单集 ∥ 四处接线在场（源读取）
  const preload = require(rel("thincoder-desktop/src/preload/preload.cjs"))
  assert.equal(preload.CHANNELS.length, 51)
  assert.equal(preload.CHANNELS.at(-1), "team:logout")
  const registry = src("thincoder-desktop/src/main/ipc-registry.mjs")
  const table = (registry.match(/const HANDLERS = Object\.freeze\(\{[\s\S]*?\n\}\)/) ?? [""])[0]
  const rows = [...table.matchAll(/"([^"]+)":/g)].map((m) => m[1])
  assert.deepEqual([...rows].sort(), [...preload.CHANNELS].sort(), "表行集 = 白名单集（闭合）")
  assert.match(src("thincoder-desktop/src/main/ipc.mjs"), /function panelState\b/)
  assert.match(src("thincoder-desktop/src/main/agent-host.mjs"), /agent\._panelReadout = /)
  assert.match(src("thincoder-desktop/renderer/app.mjs"), /panelReadout\.settle\(/)
})

test("T-B4 回读·正常：ctx.readout 有值 ⇒ source:renderer + digested 交叉；CLI 面（readout 无 ∧ state 有）逐字不变", async () => {
  const { executePanelAction } = await load("thincoder-core/agent-tools/subagent-panel.mjs")
  const receivedAt = Date.now() - 250
  const agent = {
    _pendingAsyncResults: [{ role: "advisor", id: 27 }],
    _asyncSubagents: new Map(), _asyncAdvisors: new Map(),
    _consultSessions: new Map([["s1", { stopped: false, childIds: ["7"], pending: 1 }]]),
  }
  const ctx = { agent, readout: () => ({ receivedAt, blocks: [
    { key: "sub:advisor#27", role: "advisor", id: 27, status: "done", frozen: true, awaitingDigest: true, region: "activity", dom: true },
    { key: "sub:eng-coder#36", role: "eng-coder", id: 36, status: "done", frozen: true, awaitingDigest: true, region: "activity", dom: false },
    { key: "sub:consult#7", role: "consult", id: 7, status: "done", frozen: true, awaitingDigest: true, region: "activity", dom: true },
  ] }) }
  const out = JSON.parse(executePanelAction({}, ctx))
  assert.equal(out.source, "renderer")
  assert.equal(out.asOf, receivedAt)
  assert.ok(out.ageMs >= 250)
  assert.deepEqual(out.panel.map((b) => [b.key, b.role, b.id, b.digested]), [
    ["sub:advisor#27", "advisor", 27, false], // pending 命中 ⇒ 未消化
    ["sub:eng-coder#36", "eng-coder", 36, true], // 池 ∕ pending 皆无 ⇒ 已消化
    ["sub:consult#7", "consult", 7, false], // 会话在跑（childIds 携 7）⇒ 未消化
  ])
  assert.deepEqual([out.panel[0].frozen, out.panel[0].awaitingDigest, out.panel[0].region, out.panel[0].dom], [true, true, "activity", true], "判别键随行")
  // CLI 面（零 readout）：逐字既有形（无 source 键）
  const cliAgent = { _pendingAsyncResults: [], _asyncSubagents: new Map(), _asyncAdvisors: new Map() }
  const cliState = { subTasks: { "advisor#27": { key: "advisor#27", role: "advisor", done: true, awaitingDigest: true, started: 1 } } }
  assert.deepEqual(JSON.parse(executePanelAction({}, { agent: cliAgent, state: cliState })),
    { panel: [{ key: "advisor#27", role: "advisor", status: "awaitingDigest", digested: true }] })
})

test("T-B5 回读·错误：readout 返 null ⇒ 降级链回落（state → 池视图）+ 注在——零崩", async () => {
  const { executePanelAction } = await load("thincoder-core/agent-tools/subagent-panel.mjs")
  const cliAgent = { _pendingAsyncResults: [], _asyncSubagents: new Map(), _asyncAdvisors: new Map() }
  const state = { subTasks: { "explore#3": { key: "explore#3", role: "explore", done: false, started: Date.now() - 5000 } } }
  const viaState = JSON.parse(executePanelAction({}, { agent: cliAgent, state, readout: () => null }))
  assert.equal("source" in viaState, false, "有 state ⇒ CLI 现算（无 source 键）")
  assert.equal(viaState.panel[0].status, "running")
  assert.ok(viaState.panel[0].elapsedSec >= 5, "elapsedSec 仍在（既有形）")
  const poolAgent = {
    _pendingAsyncResults: [{ role: "escalate", id: 5 }],
    _asyncSubagents: new Map([["x", { role: "explore", id: 2, status: "running", startedAt: Date.now() - 3000 }]]),
    _asyncAdvisors: new Map(), _asyncQueue: [],
  }
  const degraded = JSON.parse(executePanelAction({}, { agent: poolAgent, state: undefined, readout: () => null }))
  assert.equal(degraded.degraded, true)
  assert.match(degraded.note, /no panel/)
  assert.deepEqual(degraded.panel.map((b) => [b.key, b.status]), [["explore#2", "running"], ["escalate#5", "awaitingDigest"]])
})

// ─── T-C 回收阀（桌面 freeze 门控/发射 ∥ relay 桥 ∥ 渲染归档 ∥ CLI 回归）─────────────────────

test("T-C1 回收阀·正常：awaitingDigest 块 + freeze sub:advisor#27 ⇒ 门控过；onToken 恰字面（规范化键）", async () => {
  const { executePanelAction } = await load("thincoder-core/agent-tools/subagent-panel.mjs")
  const tokens = []
  const agent = { _pendingAsyncResults: [], _asyncSubagents: new Map(), _asyncAdvisors: new Map() }
  const ctx = { agent, callbacks: { onToken: (t) => tokens.push(t) }, readout: () => ({ receivedAt: Date.now(), blocks: [
    { key: "sub:advisor#27", role: "advisor", id: 27, status: "done", frozen: true, awaitingDigest: true, region: "activity", dom: true },
  ] }) }
  const out = JSON.parse(executePanelAction({ freeze: "sub:advisor#27" }, ctx))
  assert.equal(out.status, "frozen")
  assert.equal(out.key, "advisor#27", "回执 = 规范化键（发射同键）")
  assert.deepEqual(tokens, ["advisor#27/⟦ev⟧done\x1e0\x1e0\x1edone\x1e"])
})

test("T-C2 回收阀·错误：running ∥ pending 命中 ∥ 未知键 ∥ region:flow——四拒", async () => {
  const { executePanelAction } = await load("thincoder-core/agent-tools/subagent-panel.mjs")
  const blocks = [
    { key: "sub:advisor#27", role: "advisor", id: 27, status: "running", frozen: false, awaitingDigest: false, region: "activity", dom: true },
    { key: "sub:eng-coder#36", role: "eng-coder", id: 36, status: "done", frozen: true, awaitingDigest: true, region: "activity", dom: true },
    { key: "sub:eng-designer#40", role: "eng-designer", id: 40, status: "done", frozen: true, awaitingDigest: false, region: "flow", dom: true },
  ]
  const agent = { _pendingAsyncResults: [{ role: "eng-coder", id: 36 }], _asyncSubagents: new Map(), _asyncAdvisors: new Map() }
  const ctx = { agent, callbacks: { onToken: () => assert.fail("零发射面") }, readout: () => ({ receivedAt: Date.now(), blocks }) }
  const err = (key) => { const out = JSON.parse(executePanelAction({ freeze: key }, ctx)); assert.equal(out.status, "error"); return out.error }
  assert.match(err("sub:advisor#27"), /still running/)
  assert.match(err("sub:eng-coder#36"), /genuinely awaiting digestion/)
  const unknown = err("nope#1")
  assert.match(unknown, /unknown panel block key: nope#1/)
  assert.match(unknown, /sub:advisor#27\(running\)/, "live 列表在场（桌面块源）")
  assert.match(err("sub:eng-designer#40"), /already in the conversation flow/)
})

test("T-C3 回收阀·正常：桥 onToken(字面) ⇒ ev:subagent {status:done} 出站（relay 表命中）", async () => {
  const { createBridge } = await load("thincoder-desktop/src/main/agent-bridge.mjs")
  const posts = []
  const bridge = createBridge({ post: (channel, payload) => posts.push({ channel, payload }), tokensOf: () => ({}) })
  const consumed = bridge("7").onToken("advisor#27/⟦ev⟧done\x1e0\x1e0\x1edone\x1e")
  assert.equal(consumed, true)
  assert.deepEqual(posts, [{ channel: "ev:subagent", payload: { key: "7", status: "done", role: "advisor", id: 27 } }])
})

test("T-C4 回收阀·正常：渲染 reduce——awaitingDigest 块收 done ⇒ archive 效果 + 流内块 + record:append", async () => {
  const { subBlocksReduce } = await load("thincoder-render-core/subblocks/state.mjs")
  const list = []
  subBlocksReduce(list, { status: "started", role: "advisor", id: 27 }, { now: () => 500 }) // 出生（存活闸）
  const r1 = subBlocksReduce(list, { status: "settled", role: "advisor", id: 27 }, { now: () => 1000 })
  const block = list.find((b) => b.key === "sub:advisor#27")
  assert.equal(block.awaitingDigest, true, "settled ⇒ 驻留待消化（归档闸未过）")
  assert.ok(r1.effects.some((e) => e.type === "awaiting"))
  const r2 = subBlocksReduce(list, { status: "done", role: "advisor", id: 27 }, { now: () => 2000 })
  assert.ok(r2.effects.some((e) => e.type === "archive" && e.key === "sub:advisor#27" && e.atBoundary === true && e.clearAwaiting === true), "done 收 ⇒ 归档效果")
  const records = []
  globalThis.thincoder = { invoke: (channel, payload) => { records.push(payload); return Promise.resolve({ ok: true }) } }
  try {
    const { onSubagent } = await load("thincoder-desktop/renderer/subagent-reduce.mjs")
    let state = { activeSession: "1", subBlocks: {}, blocks: [], following: true, pendingNew: 0, pool: {}, history: {} }
    state = onSubagent(state, { key: "1", status: "started", role: "advisor", id: 27, pool: true }, 500)
    state = onSubagent(state, { key: "1", status: "settled", role: "advisor", id: 27 }, 1000)
    state = onSubagent(state, { key: "1", status: "done", role: "advisor", id: 27 }, 2000)
    assert.equal(records.length, 1)
    assert.equal(records[0].key, "1")
    assert.equal(records[0].record.kind, "subagent")
    assert.equal(records[0].record.meta.key, "sub:advisor#27")
    assert.equal(records[0].record.meta.status, "done")
    assert.ok(Array.isArray(records[0].record.rows))
    assert.equal(state.blocks.filter((b) => b.kind === "subagent").length, 1, "流内归档块恰一枚（meta.status = done）")
  } finally { delete globalThis.thincoder }
})

test("T-C5 回收阀·边界：CLI 径 freeze（ctx.state）逐字原行为；唯一有意差 = 键两写法接受", async () => {
  const { executePanelAction } = await load("thincoder-core/agent-tools/subagent-panel.mjs")
  const state = { subTasks: {
    "advisor#27": { key: "advisor#27", role: "advisor", done: true, awaitingDigest: true },
    "explore#3": { key: "explore#3", role: "explore", done: false, started: Date.now() },
    "eng-coder#36": { key: "eng-coder#36", role: "eng-coder", done: true, awaitingDigest: false },
  } }
  const agent = { _pendingAsyncResults: [], _asyncSubagents: new Map(), _asyncAdvisors: new Map() }
  const tokens = []
  const ctx = { agent, state, callbacks: { onToken: (t) => tokens.push(t) } }
  const ok = JSON.parse(executePanelAction({ freeze: "advisor#27" }, ctx))
  assert.equal(ok.status, "frozen")
  assert.equal(ok.key, "advisor#27")
  assert.deepEqual(tokens, ["advisor#27/⟦ev⟧done\x1e0\x1e0\x1edone\x1e"], "既有字面逐字")
  // 有意放宽（两端同宽）：`sub:` 前缀写法接受（修前：unknown-key）
  const widened = JSON.parse(executePanelAction({ freeze: "sub:advisor#27" }, ctx))
  assert.equal(widened.status, "frozen")
  assert.deepEqual(tokens[1], "advisor#27/⟦ev⟧done\x1e0\x1e0\x1edone\x1e", "发射 = 规范化键（relay 文法不吃 `:`）")
  // 既有拒因逐字（三档 + pending 挂）
  const err = (key, agentOverride = agent) => {
    const out = JSON.parse(executePanelAction({ freeze: key }, { ...ctx, agent: agentOverride }))
    assert.equal(out.status, "error")
    return out.error
  }
  assert.match(err("explore#3"), /block explore#3 is still running — freeze only reclaims awaitingDigest blocks/)
  assert.match(err("eng-coder#36"), /block eng-coder#36 is already done — nothing to freeze;/)
  assert.match(err("nope#9"), /unknown panel block key: nope#9 — the live panel holds: /)
  assert.match(err("advisor#27", { ...agent, _pendingAsyncResults: [{ role: "advisor", id: 27 }] }), /still genuinely awaiting digestion/)
})
