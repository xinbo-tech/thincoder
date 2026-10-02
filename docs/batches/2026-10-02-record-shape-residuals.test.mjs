/**
 * 2026-10-02-record-shape-residuals.test.mjs — 批内件（记录形残项批 · 台账 #794 ∥ #795 · 实施轮）。
 * 任务书 = `docs/batches/2026-10-02-record-shape-residuals.md` §2（§三.1 归一逐行表 ∥ §三.2 词面判据 ∥
 * §三.3 对位表 T1–T9）∥ §六 验证法（六腿）。
 * 六腿：
 *   L1 桌面归一·字段（平 node 直测）：`blockOfMessage` 喂 CLI/VSC/桌面三形记录 ⇒ meta 逐字段断言
 *      （key 补全 ∥ label/role/id 派生 ∥ frozen 恒真 ∥ status 词映射 ∥ 两时间戳互填 ∥ 未知键透传 ∥ 记录零写）。
 *   L2 桌面归一·成品形（happy-dom 直驱——沿 #790 批内件 V 舱先例）：记录 ⇒ `blockOfMessage` ⇒ 壳
 *      （`subagentNode`）+ 核件（`fillSubagentEcho`）⇒ `.sub-hdr` 文本 `[⏹ … stopped Ns]` 形 ∥
 *      `dataset.subid/subname/subrole` ∥ 负控 = 头文零 `undefined`。
 *   L3 CLI 重放：`synthSubTask` 三面断言 + `historyToLines` + `frozenSubSeg` 折叠头（本批扩词
 *      stopped/cancelled/terminated ⇒ `⏹` + `stopped`；done/error 负控逐字——error = 文本载）。
 *   L4 VSC 锁：`restoreRecordEls` 同形记录三停词——头面不变（零码改证明件）。
 *   L5 对位表驱动：§三.3 表逐行（写端样例 × 三读面——真产面：CLI `subagentRecord` ∥ VSC
 *      `applySubagentStatus` 归档出站 ∥ 桌面全模型形）——面类一致断言；T8/T9 形面（补前缀 + 派生）。
 *   L6 负控族：桌面自记（全模型）过链 ⇒ 逐值等变；缺 `status` ⇒ done 面；#790 字段 / rows 零动。
 * 跑法（仓根 `thincoder/`）：node --test docs/batches/2026-10-02-record-shape-residuals.test.mjs
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

// ─── 假 DOM bootstrap（桌面核件 + VSC 腿——沿 #790 批内件 V 舱先例）────────────────

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

// ─── 模块装载（桌面四件 ∥ VSC 四件 ∥ CLI 三件）────────────────────────────────

const [pageRead, chatSubagent, dom, subReduce, wi18n, lifecycle, startup, segments, wstate, wrestore, wactivity] = await Promise.all([
  mod("thincoder-desktop/renderer/page-read.mjs"), // 桌面归一落点（`blockOfMessage`）
  mod("thincoder-desktop/renderer/views/chat-subagent.mjs"), // 桌面回显链（壳 + 核件）
  mod("thincoder-desktop/renderer/dom.mjs"), // 描述符建树（壳）
  mod("thincoder-desktop/renderer/subagent-reduce.mjs"), // 桌面写面（自记真链——L6）
  mod("thincoder-vscode/webview/i18n.js"), // 核词面注入（shim —— 与核件消费同实例；哨兵值）
  mod("thincoder-cli/src/tui/lifecycle-records.mjs"), // CLI 读面（`synthSubTask`）
  mod("thincoder-cli/src/tui/startup.mjs"), // CLI 重放（`historyToLines` 记录分支）
  mod("thincoder-cli/src/tui/render-segments.mjs"), // CLI 折叠头（`frozenSubSeg`）
  mod("thincoder-vscode/webview/state.js"), // VSC ctx
  mod("thincoder-vscode/webview/record-restore.js"), // VSC 读面（`restoreRecordEls`）
  mod("thincoder-vscode/webview/activity.js"), // VSC 写面（真归档出站——L5 写端样例）
])
wi18n.setStrings({
  "sub.done": "DONE", "sub.async": "ASYNC", "sub.sync": "SYNC", "sub.stopped": "STOPPED",
  "sub.error": "ERROR", "sub.thinking": "THINK", "sub.queued": "QUEUED", "sub.waiting": "WAITING",
})
assert.equal(wi18n.t("sub.stopped"), "STOPPED", "词面注入生效（shim 与核件消费同实例——本件隐性前提）")

// ─── 三读面驱动器（唯一实现——L2–L5 共用）────────────────────────────────────

const wctx = wstate.ctx
const segState = { foldEnabled: true } // CLI 折叠段状态最小形（`frozenSubSeg` 只读 fold 面）
let vscIdx = 400 // 同位去重闸（`restoreRecordEls`）——逐调用 +1 ⇒ 零误跳过

/** 桌面读面：记录 ⇒ `blockOfMessage` ⇒ 壳（`subagentNode`）⇒ 核件（`fillSubagentEcho`）。 */
function deskRead(rec) {
  const [block] = pageRead.blockOfMessage(rec)
  const shell = dom.build(chatSubagent.subagentNode(block, "0"))
  chatSubagent.fillSubagentEcho(shell, block)
  const element = shell.querySelector(".advisor-block")
  return { head: element.querySelector(".sub-hdr")?.textContent ?? "", element, meta: block.meta }
}

/** VSC 读面：记录 ⇒ `restoreRecordEls`（同位去重闸 ⇒ 逐调用 idx+1）。 */
function vscRead(rec) {
  const element = wrestore.restoreRecordEls(wctx, { ...rec, idx: (vscIdx += 1) }, undefined)[0]
  return { head: element.querySelector(".sub-hdr")?.textContent ?? "", element }
}

/** CLI 读面：记录 ⇒ `historyToLines` + `frozenSubSeg` 折叠头。 */
function cliRead(rec) {
  const lines = startup.historyToLines([rec], 0, 1)
  const carrier = lines.find((l) => l._frozenSubTask)
  const text = segments.frozenSubSeg(segState, carrier, lines.indexOf(carrier), 100, 30).map((r) => r.text).join("\n")
  return { synth: carrier._frozenSubTask, text }
}

/** 面类分类器（三读面——停止 ∥ 错误 ∥ done；`live` = 未归一活样式形 ⇒ 非归档面）。 */
const vscFace = (head) => {
  if (head.startsWith("[⏹") && head.includes("STOPPED")) return "stopped"
  if (head.startsWith("[⏹") && head.includes("ERROR")) return "error"
  if (head.startsWith("[✓")) return "done"
  return "live"
}
const deskFace = vscFace // 同一核件头词（`activity-view.mjs` `headerText`）
const cliFace = ({ synth, text }) => {
  if (text.includes("[⏹")) return "stopped"
  if (text.includes("[✓") && synth.lastError) return "error"
  if (text.includes("[✓")) return "done"
  return "live"
}

/** 写端样例（真驱动）：CLI = `subagentRecord` ∥ VSC = `applySubagentStatus` 归档出站 ∥ 桌面 = 全模型形。 */
const cliRec = (fields) => lifecycle.subagentRecord({
  key: "eng-coder#5", role: "eng-coder", model: "m1", started: 1000, doneAt: 4000, turn: 2, maxTurns: 100,
  blocks: [{ kind: "text", text: "行一" }], ...fields,
})
const vscT0 = Date.now() - 5000
function vscRec(id, status, extra = {}) {
  const n = wvPosts.length
  wactivity.applySubagentStatus({ role: "eng-coder", id, status: "started", pool: true, startedAt: vscT0 })
  wactivity.applySubagentStatus({ role: "eng-coder", id, status, ...extra })
  return wvPosts.slice(n).filter((m) => m.type === "recordAppend").map((m) => m.record)[0]
}
/** 桌面自记形（全模型 + rows——`subagent-reduce.mjs` `archiveIntoFlow` 归档快照同形）。 */
const deskRec = (status, extra = {}) => ({
  kind: "subagent",
  meta: {
    key: "sub:eng-coder#9", label: "eng-coder#9", role: "eng-coder", id: 9, model: "m1",
    startedAt: 1000, pool: false, syncLive: false, turn: 2, maxTurns: 100, status, stateWord: null,
    doneAt: 4000, frozen: true, error: null, note: null, queued: false, queueInfo: null,
    awaitingDigest: false, approval: null, ...extra,
  },
  rows: [{ kind: "text", text: "行一" }],
})

// ─── L1 · 桌面归一·字段（平 node 直测）──────────────────────────────────────

test("L1·桌面归一·字段：key 补全 ∥ label/role/id 派生 ∥ frozen 恒真 ∥ status 词映射 ∥ 时间戳互填 ∥ 未知键透传 ∥ 记录零写", () => {
  const metaOf = (rec) => pageRead.blockOfMessage(rec)[0].meta
  const rawMeta = { key: "eng-coder#7", role: "eng-coder", status: "stopped", startedAt: 1000, note: "停因", futureKey: "v1" }
  const rawSnap = structuredClone(rawMeta)
  const msg = { kind: "subagent", meta: rawMeta, rows: [{ kind: "text", text: "r" }] }
  const [blk] = pageRead.blockOfMessage(msg)
  assert.notEqual(blk.meta, rawMeta, "产物 = 读面新 meta 对象")
  assert.deepEqual(rawMeta, rawSnap, "记录零写（输入 meta 未被改）")
  assert.equal(blk.rows, msg.rows, "rows 原引用透传")
  assert.equal(blk.meta.key, "sub:eng-coder#7", "旧形 key ⇒ 补 `sub:` 前缀")
  assert.equal(blk.meta.label, "eng-coder#7", "label = parseChannel(key).label（头文载体）")
  assert.equal(blk.meta.role, "eng-coder", "role 派生")
  assert.equal(blk.meta.id, 7, "id 派生（dataset.subid 门）")
  assert.equal(blk.meta.frozen, true, "frozen 恒真（记录 = 归档快照）")
  assert.equal(blk.meta.status, "cancelled", "停止面 ⇒ cancelled")
  assert.equal(blk.meta.startedAt, 1000, "startedAt 有限数 ⇒ 原值")
  assert.equal(blk.meta.doneAt, 1000, "doneAt 缺 ⇒ startedAt（互填）")
  assert.equal(blk.meta.note, "停因", "已知注记透传")
  assert.equal(blk.meta.futureKey, "v1", "未知键原样透传")
  // 词面归一逐值（三面词集）
  for (const [status, want] of [["cancelled", "cancelled"], ["terminated", "cancelled"], ["error", "error"], ["failed", "error"], ["done", "done"], ["settled", "done"], ["answered", "done"], [undefined, "done"], ["weird", "done"]]) {
    assert.equal(metaOf({ kind: "subagent", meta: { key: "sub:a#1", status } }).status, want, `词面：${status} ⇒ ${want}`)
  }
  // 时间戳四态
  assert.deepEqual([metaOf({ kind: "subagent", meta: { key: "sub:a#1", startedAt: 5, doneAt: 9 } }).startedAt, metaOf({ kind: "subagent", meta: { key: "sub:a#1", startedAt: 5, doneAt: 9 } }).doneAt], [5, 9], "两在场 ⇒ 原值")
  assert.equal(metaOf({ kind: "subagent", meta: { key: "sub:a#1", doneAt: 9 } }).startedAt, 9, "startedAt 缺 ⇒ doneAt")
  assert.deepEqual([metaOf({ kind: "subagent", meta: { key: "sub:a#1" } }).startedAt, metaOf({ kind: "subagent", meta: { key: "sub:a#1" } }).doneAt], [0, 0], "两缺 ⇒ 0/0（冻结耗时稳定）")
  assert.equal(metaOf({ kind: "subagent" }).frozen, true, "meta 缺 ⇒ 归一面照立")
})

// ─── L2 · 桌面归一·成品形（happy-dom 直驱：壳 + 核件）────────────────────────

test("L2·桌面归一·成品形：CLI stopped / VSC cancelled 记录 ⇒ 冻结头 `[⏹ … stopped Ns]` ∥ dataset 三值 ∥ 头文零 undefined", () => {
  const cliStop = deskRead(cliRec({ stopped: true }))
  assert.equal(cliStop.element.dataset.subname, "sub:eng-coder#5", "dataset.subname = 规范键")
  assert.equal(cliStop.element.dataset.subrole, "eng-coder", "dataset.subrole 派生")
  assert.equal(cliStop.element.dataset.subid, "5", "dataset.subid 在场（核件门 model.id != null）")
  assert.ok(cliStop.head.startsWith("[⏹ eng-coder#5"), `CLI stopped ⇒ ⏹ 身份头（实读：${cliStop.head}）`)
  assert.ok(cliStop.head.includes("STOPPED 3s"), "冻结头 = stopped + 冻结耗时（doneAt-startedAt 定格，不走表）")
  assert.ok(cliStop.head.includes("SYNC"), "sync 模式词（pool:false）")
  assert.ok(!cliStop.head.includes("undefined"), "头文零 undefined")
  assert.ok(!cliStop.head.includes("THINK"), "冻结头不带活样式态词（思考中…退场）")
  const vscCancelled = deskRead({ kind: "subagent", meta: { key: "sub:plan#2", role: "plan", model: "m2", status: "cancelled", startedAt: 1000, doneAt: 6000, pool: true }, rows: [] })
  assert.ok(vscCancelled.head.startsWith("[⏹ plan#2"), `VSC cancelled ⇒ ⏹（实读：${vscCancelled.head}）`)
  assert.ok(vscCancelled.head.includes("STOPPED 5s"), "cancelled ⇒ 同一停止面")
  assert.equal(vscCancelled.element.dataset.subid, "2")
  assert.equal(vscCancelled.element.dataset.subrole, "plan")
  assert.ok(!vscCancelled.head.includes("undefined"), "头文零 undefined（他端共性缺位已归一）")
})

// ─── L3 · CLI 重放（停止面三词 + done/error 负控）────────────────────────────

test("L3·CLI 重放：停止面三词 ⇒ ⏹+stopped（本批扩）∥ done/error 负控逐字（error = 文本载）", () => {
  const synth = (status, extra = {}) => lifecycle.synthSubTask({ meta: { key: "sub:eng-coder#5", role: "eng-coder", status, startedAt: 1000, doneAt: 2000, ...extra }, rows: [] })
  assert.equal(synth("stopped").stopped, true, "写面词 stopped 照收")
  assert.equal(synth("cancelled").stopped, true, "本批扩词：cancelled（VSC/桌面写词）")
  assert.equal(synth("terminated").stopped, true, "本批扩词：terminated")
  assert.equal(synth("done").stopped, false, "负控：done")
  assert.equal(synth("error", { error: "boom" }).stopped, false, "负控：error 不并停止面（文本载）")
  const rec = (status, extra = {}) => ({ kind: "subagent", ts: 1, meta: { key: "sub:eng-coder#5", role: "eng-coder", status, startedAt: 1000, doneAt: 2000, ...extra }, rows: [] })
  const stop = cliRead(rec("cancelled"))
  assert.ok(stop.text.includes("[⏹ eng-coder#5"), "cancelled ⇒ 折叠头 ⏹")
  assert.ok(stop.text.includes("· stopped 1s"), "折叠头 verb = stopped（冻结耗时同算式）")
  assert.ok(!stop.text.includes("· done"), "零 done 混出")
  const done = cliRead(rec("done"))
  assert.ok(done.text.includes("[✓ eng-coder#5") && done.text.includes("· done 1s"), "done 负控逐字")
  assert.ok(!done.text.includes("⏹"), "done 零 ⏹")
  const err = cliRead(rec("error", { error: "boom" }))
  assert.ok(err.text.includes("[✓ eng-coder#5") && err.text.includes("— boom"), "error = 文本载（✓ + — err——在册面差）")
  assert.ok(!err.text.includes("⏹"), "error 零 ⏹（不冒充停止面）")
})

// ─── L4 · VSC 锁（三停词同头面——零码改证明件）──────────────────────────────

test("L4·VSC 锁：`stopped` ∥ `cancelled` ∥ `terminated` ⇒ 同一 stopped 头面（零码改）∥ done/error 负控", () => {
  const head = (status, extra = {}) => vscRead({ kind: "subagent", meta: { key: "sub:eng-coder#5", role: "eng-coder", model: "m1", status, startedAt: 1000, doneAt: 4000, pool: true, ...extra }, rows: [] }).head
  const s1 = head("stopped")
  assert.deepEqual([head("cancelled"), head("terminated")], [s1, s1], "三停词 ⇒ 逐字同头面")
  assert.ok(s1.startsWith("[⏹ eng-coder#5") && s1.includes("STOPPED 3s"), `stopped 面（实读：${s1}）`)
  const d = head("done")
  assert.ok(d.startsWith("[✓ eng-coder#5") && d.includes("DONE"), "done 负控")
  const e = head("error", { error: "boom" })
  assert.ok(e.startsWith("[⏹ eng-coder#5") && e.includes("ERROR"), "error ⇒ ⏹ error 面")
  assert.ok(!e.includes("STOPPED"), "error 不并入停止面")
})

// ─── L5 · 对位表驱动（§三.3 T1–T9）─────────────────────────────────────────

test("L5·对位表：T1–T7 逐行（写端样例 × 三读面）面类一致 ∥ T8/T9 形面 ∥ T3/T5 CLI 面差在册", () => {
  const rows = [
    ["T1", cliRec({}), "done"], // CLI · done
    ["T2", cliRec({ stopped: true }), "stopped"], // CLI · stopped（本批桌面【修】）
    ["T3", cliRec({ lastError: "boom" }), "error"], // CLI · error（+文本）
    ["T4", vscRec(11, "cancelled"), "stopped"], // VSC · cancelled（本批 CLI/桌面【修】）
    ["T5", vscRec(12, "error", { error: "boom" }), "error"], // VSC · error（+文本）
    ["T6", vscRec(13, "done"), "done"], // VSC · done
    ["T7a", deskRec("cancelled"), "stopped"], // 桌面 · cancelled（自记：归一逐值等变）
    ["T7b", deskRec("error", { error: "boom" }), "error"], // 桌面 · error
    ["T7c", deskRec("done"), "done"], // 桌面 · done
  ]
  for (const [id, rec, face] of rows) {
    assert.equal(deskFace(deskRead(rec).head), face, `${id} 桌面读面类`)
    assert.equal(vscFace(vscRead(rec).head), face, `${id} VSC 读面类`)
    assert.equal(cliFace(cliRead(rec)), face, `${id} CLI 读面类`)
  }
  // 唯一在册面差（T3/T5——CLI error 呈现 = 文本载）：✓ + `— <text>`（U2 上抛在册，逐字）
  const cliErr = cliRead(cliRec({ lastError: "boom" }))
  assert.ok(cliErr.text.includes("✓") && cliErr.text.includes("— boom"), "CLI error 文本载（在册面差）")
  // T8/T9 形面：旧形 key（无前缀）∥ 他端共性缺位（label ∥ id ∥ frozen）⇒ 桌面【修】补前缀 + 派生；CLI/VSC 既容纳
  const old = { kind: "subagent", meta: { key: "plan#4", role: "plan" }, rows: [] }
  const d = deskRead(old)
  assert.deepEqual([d.meta.key, d.meta.label, d.meta.id, d.meta.frozen], ["sub:plan#4", "plan#4", 4, true], "T8/T9 桌面：补前缀 + label/id 派生 + frozen 恒真")
  assert.equal(d.element.dataset.subid, "4", "T9：dataset.subid 在场")
  assert.ok(!d.head.includes("undefined"), "T9：头文零 undefined")
  assert.equal(cliRead(old).synth.key, "plan#4", "T8 CLI：旧形既容纳（显示无前缀形）")
  assert.equal(vscRead(old).element.dataset.subname, "sub:plan#4", "T8 VSC：既容纳（补前缀再解析）")
})

// ─── L6 · 负控族（桌面自记等变 + 缺 status 回退 + 记录形零动）────────────────

test("L6·负控族：桌面自记（全模型）过链逐值等变 ∥ 缺 status ⇒ done 面 ∥ #790 字段/rows 零动", () => {
  const captured = []
  const prevBridge = globalThis.thincoder
  globalThis.thincoder = { invoke: (channel, payload) => { captured.push({ channel, payload }) } }
  let rec
  try {
    const st1 = subReduce.onSubagent({ subBlocks: {}, activeSession: null }, { key: "sub:eng-coder#9", status: "started", role: "eng-coder", id: 9, pool: false, model: "m1", startedAt: 1000 }, 1000)
    subReduce.onSubagent(st1, { key: "sub:eng-coder#9", status: "done", role: "eng-coder", id: 9 }, 4000)
    assert.equal(captured.length, 1, "归档派生点恰一出站")
    rec = captured[0].payload.record
  } finally {
    if (prevBridge === undefined) delete globalThis.thincoder
    else globalThis.thincoder = prevBridge
  }
  const [blk] = pageRead.blockOfMessage(rec)
  assert.deepEqual(blk.meta, rec.meta, "桌面自记过归一 ⇒ 逐值等变（负控）")
  assert.equal(blk.rows, rec.rows, "rows 原引用（零动）")
  assert.equal(rec.meta.pool, false, "#790 字段（pool）记录形在野（写面零改）")
  assert.equal(blk.meta.pool, false, "#790 字段过归一原样透传")
  assert.equal(blk.meta.queued, false, "queued 同规")
  const d = deskRead(rec)
  assert.ok(d.head.startsWith("[✓ eng-coder#9") && d.head.includes("DONE 3s"), `自记 ⇒ 冻结 done 头（实读：${d.head}）`)
  // 缺 status ⇒ done 面（回退登记——未知/缺省词并入 done）
  const fb = deskRead({ kind: "subagent", meta: { key: "sub:plan#9", role: "plan", startedAt: 1, doneAt: 2 }, rows: [] })
  assert.ok(fb.head.startsWith("[✓ plan#9") && fb.head.includes("DONE"), "缺 status ⇒ done 面")
  assert.ok(!fb.head.includes("undefined"), "回退面头文零 undefined")
})
