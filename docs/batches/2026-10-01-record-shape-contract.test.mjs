/**
 * 2026-10-01-record-shape-contract.test.mjs — 批内件（记录形跨端契约勘定批 · 台账 #790 · 实施轮）。
 * 任务书 = `docs/batches/2026-10-01-record-shape-contract.md` §2（修正块 `:132-146` 覆盖面）∥ §八 验证法。
 * 六腿：
 *   L1 CLI 产：`subagentRecord` 三态字段在场性/值（async ⇒ `pool:true` ∥ sync ⇒ `pool:false` ∥ 排队 ⇒
 *      `queued:true` 且 `pool` 缺位）+ key 写面归一（`sub:<role>#<id>`）。
 *   L2 CLI 读重放：合成件回填 ⇒ 折叠头文案三态（waiting ∥ async ∥ sync）+ 行文取值同源（本地无前缀形）+
 *      旧记录（无新字段）回退负控（回退 = 改前显示——恒 sync）。
 *   L3 VSC 产：归档快照携 `pool` true/false + `queued`（真 webview 归档派生点 ⇒ `recordAppend` 捕获）。
 *   L4 VSC 读重放：合成件回填 ⇒ 头模式词三态（async ∥ sync ∥ 缺省无段）+ 回退负控。
 *   L5 key 跨读双向：新形 ∥ 存量旧形 ∥ `compress#N` 边角（写形归一 `sub:compress#N`；跨端读形同值；
 *      compress 非族员 ⇒ 读面中性）。
 *   L6 桌面合规锁：桌面产面现行为携 `pool`/`queued`（零代码改证明件——真归约驱动）。
 * 跑法（仓根 `thincoder/`）：node --test docs/batches/2026-10-01-record-shape-contract.test.mjs
 * 本件不入仓套件（批内件 · 随批留存）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { pathToFileURL } from "node:url"
import "../../thincoder-desktop/test/rc-resolve.mjs" // `/rc/` 解析钩子（须先于桌面模块取件注册）

const ROOT = process.cwd()
if (!readFileSync(resolve(ROOT, "thincoder-core/context.mjs"), "utf8")) throw new Error(`从仓库根（thincoder/）运行（cwd = ${ROOT}）`)
const mod = (rel) => import(pathToFileURL(resolve(ROOT, rel)).href)

// ─── 假 DOM bootstrap（VSC 腿——沿 #726 批内件 V 舱先例：happy-dom 注册 + vscode API 桩）──────

const { GlobalRegistrator } = await import(pathToFileURL(resolve(ROOT, "thincoder-vscode/node_modules/@happy-dom/global-registrator/lib/index.js")).href)
GlobalRegistrator.register()
if (typeof Element.prototype.scrollIntoView !== "function") Element.prototype.scrollIntoView = function () {} // happy-dom 面缺项垫片
document.body.innerHTML = `
  <div id="chat-container">
    <div id="messages"></div>
    <div id="subagent-activity"></div>
    <div id="toolbar"><div id="status-line"></div><div id="input-row"><textarea id="input"></textarea></div></div>
    <div id="model-dropdown"></div><div id="reasoning-dropdown"></div><div id="session-dropdown"></div>
    <button id="session-selector"></button><span id="session-title"></span>
  </div>`
const wvPosts = []
globalThis.acquireVsCodeApi = () => ({ postMessage: (m) => wvPosts.push(m), getState: () => ({}), setState: () => {} })

// ─── 模块装载（CLI 三件 ∥ VSC 四件 ∥ 桌面一件）──

const [lifecycle, startup, segments, wstate, wi18n, wactivity, wrestore, subReduce] = await Promise.all([
  mod("thincoder-cli/src/tui/lifecycle-records.mjs"), // CLI 产/读（记录形构建 ∥ 合成件）
  mod("thincoder-cli/src/tui/startup.mjs"), // CLI 读重放（historyToLines 记录分支）
  mod("thincoder-cli/src/tui/render-segments.mjs"), // CLI 折叠头渲染（frozenSubSeg）
  mod("thincoder-vscode/webview/state.js"), // webview ctx
  mod("thincoder-vscode/webview/i18n.js"), // 词面注入（setStrings——哨兵值）
  mod("thincoder-vscode/webview/activity.js"), // VSC 产（归档派生点出站）
  mod("thincoder-vscode/webview/record-restore.js"), // VSC 读（重建合成件）
  mod("thincoder-desktop/renderer/subagent-reduce.mjs"), // 桌面产（合规锁）
])

/** VSC 注入字典（哨兵值——词键 = 断言对象；host 注入契约同形）。 */
wi18n.setStrings({ "sub.done": "DONE", "sub.async": "ASYNC", "sub.sync": "SYNC", "sub.stopped": "STOPPED", "sub.thinking": "THINK" })

const wctx = wstate.ctx // VSC ctx（messagesEl 已按 body 骨架取件）
const segState = { foldEnabled: true } // CLI 折叠段状态最小形（frozenSubSeg 只读 fold 面）
const segRows = (lines, i) => segments.frozenSubSeg(segState, lines[i], i, 100, 30).map((r) => r.text).join("\n")
const carrierIdx = (lines, k) => lines.findIndex((l) => l._frozenSubTask?.key === k)

// ─── L1 · CLI 产（三态字段在场性/值 + key 写面归一）──────────────────────────

test("L1·CLI 产：async ⇒ pool:true ∥ sync ⇒ pool:false ∥ 排队 ⇒ queued:true 且 pool 缺位；key 写面归一", () => {
  const asyncRec = lifecycle.subagentRecord({ key: "eng-coder#1", role: "eng-coder", async: true, started: 1, doneAt: 2, blocks: [] })
  assert.equal(asyncRec.meta.pool, true, "async ⇒ pool:true（显式两写）")
  assert.equal("queued" in asyncRec.meta, false, "非排队 ⇒ queued 缺省（不写）")
  assert.equal(asyncRec.meta.key, "sub:eng-coder#1", "key 写面归一（规范形 sub:<role>#<id>）")

  const syncRec = lifecycle.subagentRecord({ key: "eng-coder#2", role: "eng-coder", started: 1, doneAt: 2, blocks: [] })
  assert.equal(syncRec.meta.pool, false, "sync ⇒ pool:false（在场性判据 = pool != null）")
  assert.equal("queued" in syncRec.meta, false)

  const queuedRec = lifecycle.subagentRecord({ key: "eng-coder#3", role: "eng-coder", queued: { kind: "slot", position: 2 }, blocks: [] })
  assert.equal(queuedRec.meta.queued, true, "排队（未启动）⇒ queued:true")
  assert.equal("pool" in queuedRec.meta, false, "排队 ⇒ pool 不写（未启动——未知）")

  const prefixed = lifecycle.subagentRecord({ key: "sub:plan#2", role: "plan", async: true, started: 1, doneAt: 2, blocks: [] })
  assert.equal(prefixed.meta.key, "sub:plan#2", "已规范形原样（零双前缀）")
})

// ─── L2 · CLI 读重放（折叠头三态 + 行文同源 + 旧记录回退负控）────────────────

test("L2·CLI 读重放：折叠头 waiting/async/sync 三态 ∥ 行文取值同源（本地无前缀形）∥ 旧记录回退负控", () => {
  const H = [
    { kind: "subagent", ts: 1, meta: { key: "sub:eng-coder#1", role: "eng-coder", status: "done", pool: true, startedAt: 1000, doneAt: 2500 }, rows: [{ kind: "text", text: "行一" }] },
    { kind: "subagent", ts: 2, meta: { key: "sub:eng-coder#2", role: "eng-coder", status: "done", pool: false, startedAt: 1000, doneAt: 2500 }, rows: [] },
    { kind: "subagent", ts: 3, meta: { key: "sub:eng-coder#3", role: "eng-coder", status: "done", queued: true, startedAt: 1000, doneAt: 2500 }, rows: [] },
    { kind: "subagent", ts: 4, meta: { key: "eng-coder#4", role: "eng-coder", status: "done", startedAt: 1000, doneAt: 2500 }, rows: [] },
  ]
  const lines = startup.historyToLines(H, 0, H.length)
  assert.equal(lines.filter((l) => l._frozenSubTask).length, 4, "四条记录 ⇒ 四冻结载体行")
  const carrier = (k) => lines[carrierIdx(lines, k)]
  assert.equal(carrier("eng-coder#1").text, "subagent activity: eng-coder#1", "行文取值同源（合成件 key——本地无前缀形）")
  const head = (k) => segRows(lines, carrierIdx(lines, k))
  assert.ok(head("eng-coder#1").includes(" · async"), "async 折叠头（pool:true）")
  assert.ok(head("eng-coder#2").includes(" · sync"), "sync 折叠头（pool:false）")
  assert.ok(head("eng-coder#3").includes(" · waiting"), "排队折叠头（queued:true）")
  assert.ok(head("eng-coder#4").includes(" · sync"), "旧记录回退负控（无新字段 ⇒ 与改前逐字等价——恒 sync）")
  assert.deepEqual([carrier("eng-coder#1")._frozenSubTask.async, carrier("eng-coder#1")._frozenSubTask.queued], [true, false])
  assert.deepEqual([carrier("eng-coder#3")._frozenSubTask.async, carrier("eng-coder#3")._frozenSubTask.queued], [false, true])
  assert.deepEqual([carrier("eng-coder#4")._frozenSubTask.async, carrier("eng-coder#4")._frozenSubTask.queued], [false, false], "旧记录 ⇒ 两事实缺省（回退）")
})

// ─── L3 · VSC 产（快照携 pool true/false + queued）───────────────────────────

test("L3·VSC 产：归档快照携 `pool`（true/false 显式两写）∥ 排队冻结 ⇒ `queued:true`", () => {
  const emitted = () => wvPosts.filter((m) => m.type === "recordAppend").map((m) => m.record)
  const t0 = Date.now() - 5000
  let n = emitted().length

  wactivity.applySubagentStatus({ role: "eng-coder", id: 7, status: "started", pool: true, startedAt: t0 })
  wactivity.applySubagentStatus({ role: "eng-coder", id: 7, status: "done" })
  let recs = emitted()
  assert.equal(recs.length, n + 1, "归档派生点恰一发（幂等守卫内）")
  assert.equal(recs[n].meta.pool, true, "async ⇒ 快照 pool:true")
  assert.equal("queued" in recs[n].meta, false, "非排队 ⇒ queued 缺省")

  n = recs.length
  wactivity.applySubagentStatus({ role: "eng-coder", id: 8, status: "started", startedAt: t0 })
  wactivity.applySubagentStatus({ role: "eng-coder", id: 8, status: "done" })
  recs = emitted()
  assert.equal(recs.length, n + 1, "第二块恰一发")
  assert.equal(recs[n].meta.pool, false, "sync ⇒ 快照 pool:false（缺省会藏段 ⇒ 显式两写）")

  n = recs.length
  wactivity.applySubagentStatus({ role: "eng-coder", id: 9, status: "queued", kind: "slot", position: 2 })
  wactivity.freezeLiveBlocks() // 会话退出兜底（本端排队冻结面现无产者——前向一致写入驱动径）
  recs = emitted()
  assert.equal(recs.length, n + 1, "排队块冻结 ⇒ 恰一发")
  assert.equal(recs[n].meta.queued, true, "排队冻结 ⇒ 快照 queued:true")
  assert.equal("pool" in recs[n].meta, false, "排队 ⇒ pool 不写（未启动——未知）")
})

// ─── L4 · VSC 读重放（头模式词三态 + 回退负控）──────────────────────────────

test("L4·VSC 读重放：头模式词段 async ∥ sync ∥ 缺省无段（旧记录回退负控）", () => {
  const mk = (idx, meta) => {
    const els = wrestore.restoreRecordEls(wctx, { kind: "subagent", idx, meta, rows: [] }, undefined)
    assert.equal(els.length, 1, "subagent 记录 ⇒ 恰一元素")
    return els[0]
  }
  const headOf = (el) => el.querySelector(".sub-hdr").textContent
  assert.ok(headOf(mk(101, { key: "sub:eng-coder#1", role: "eng-coder", status: "done", pool: true, startedAt: 1000, doneAt: 2500 })).includes(" · ASYNC"), "pool:true ⇒ 「· async」段在场")
  assert.ok(headOf(mk(102, { key: "sub:eng-coder#2", role: "eng-coder", status: "done", pool: false, startedAt: 1000, doneAt: 2500 })).includes(" · SYNC"), "pool:false ⇒ 「· sync」段")
  const lt = headOf(mk(103, { key: "sub:eng-coder#3", role: "eng-coder", status: "done", startedAt: 1000, doneAt: 2500 }))
  assert.ok(!lt.includes("ASYNC") && !lt.includes("SYNC"), "旧记录（无新字段）⇒ 无模式词段（回退负控）")
  assert.ok(lt.includes("eng-coder#3"), "身份头在场（label 回填）")
  const qt = headOf(mk(104, { key: "sub:eng-coder#4", role: "eng-coder", status: "done", queued: true, startedAt: 1000, doneAt: 2500 }))
  assert.ok(!qt.includes("ASYNC") && !qt.includes("SYNC"), "queued 记录（pool 未知）⇒ 无模式词段")
})

// ─── L5 · key 跨读双向（新形 ∥ 存量旧形 ∥ compress#N 边角）──────────────────

test("L5·key 跨读双向：写形归一 ∥ VSC 读容旧形 ∥ compress 边角（跨端读形同值；非族员读面中性）", () => {
  // CLI 写面（含 compress 边角）
  assert.equal(lifecycle.subagentRecord({ key: "compress#1", role: "compress", started: 1, doneAt: 2, blocks: [] }).meta.key, "sub:compress#1", "compress 边角写形归一")
  assert.equal(lifecycle.subagentRecord({ key: "eng-coder#3", role: "eng-coder", async: true, started: 1, doneAt: 2, blocks: [] }).meta.key, "sub:eng-coder#3")
  // CLI 读面（他端规范形 / 存量旧形 ⇒ 显示本地无前缀形）
  assert.equal(lifecycle.synthSubTask({ meta: { key: "sub:eng-coder#3", role: "eng-coder" } }).key, "eng-coder#3", "规范形 ⇒ 剥离前缀")
  assert.equal(lifecycle.synthSubTask({ meta: { key: "compress#1", role: "compress" } }).key, "compress#1", "旧形 ⇒ 原样容读")
  // VSC 读面
  const mk = (idx, meta) => wrestore.restoreRecordEls(wctx, { kind: "subagent", idx, meta, rows: [] }, undefined)[0]
  const ids = (el) => ({ name: el.dataset.subname, role: el.dataset.subrole, id: el.dataset.subid })
  assert.deepEqual(ids(mk(201, { key: "sub:eng-coder#3", role: "eng-coder", status: "done", pool: true, startedAt: 1, doneAt: 2 })), { name: "sub:eng-coder#3", role: "eng-coder", id: "3" }, "规范形 ⇒ parseChannel role/id 在场")
  assert.deepEqual(ids(mk(202, { key: "eng-coder#4", role: "eng-coder", status: "done", startedAt: 1, doneAt: 2 })), { name: "sub:eng-coder#4", role: "eng-coder", id: "4" }, "存量旧形 ⇒ 补前缀再解析（容读同判）")
  const comp = mk(203, { key: "sub:compress#1", role: "compress", status: "done", startedAt: 1, doneAt: 2 })
  assert.deepEqual(ids(comp), { name: "sub:compress#1", role: "compress", id: "1" }, "compress 跨端读形同值")
  assert.ok(!comp.querySelector(".sub-hdr").textContent.includes("SYNC"), "compress 非族员 ⇒ 读面中性（零模式词）")
})

// ─── L6 · 桌面合规锁（产面现行为携字段——零代码改证明件）────────────────────

test("L6·桌面合规锁：真归约 ⇒ 归档记录 meta 携 `pool`/`queued`（桌面零改）", () => {
  const captured = []
  const prevBridge = globalThis.thincoder
  globalThis.thincoder = { invoke: (channel, payload) => { captured.push({ channel, payload }) } }
  try {
    const st1 = subReduce.onSubagent({ subBlocks: {}, activeSession: null }, { key: "sub:eng-coder#1", status: "started", role: "eng-coder", id: 1, pool: true }, 1000)
    subReduce.onSubagent(st1, { key: "sub:eng-coder#1", status: "done", role: "eng-coder", id: 1 }, 4000)
    assert.equal(captured.length, 1, "归档派生点恰一出站")
    assert.equal(captured[0].channel, "record:append")
    const rec = captured[0].payload.record
    assert.equal(rec.kind, "subagent")
    assert.equal(rec.meta.pool, true, "桌面记录已在野携 pool（零代码改证明件）")
    assert.equal(rec.meta.queued, false, "同携 queued")
    assert.equal(rec.meta.key, "sub:eng-coder#1", "key 已规范形（桌面零改）")
  } finally {
    if (prevBridge === undefined) delete globalThis.thincoder
    else globalThis.thincoder = prevBridge
  }
})
