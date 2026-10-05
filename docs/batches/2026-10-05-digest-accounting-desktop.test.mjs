/**
 * 2026-10-05-digest-accounting-desktop.test.mjs — 批内件（消化账务批 · 台账 #930 · 端面舱 #42 · 桌面腿）。
 * 任务书 = `docs/batches/2026-10-05-digest-accounting.md` §2 ∥ 判据单源 = 设计档
 * `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.31（尤其 §6.31.6 三端可见面）。
 * 用例 = T-DA11（桌面面）：`end` 帧 / 记录携 `unsettled`（非上行轮且 > 0 才携）⇒ 消化行组增残余行
 * （锚 `data-digest-residue`——词键 `digest.residue` 核字典直取）；`= 0` ⇒ 零行；复列承接（页读折叠携
 * `unsettled` ⇒ 重建行组同出）。断言只取行为 / 结构机检面（零散文锚）。
 * 面 = 本批改动面；平 node 直测 · 零网络 · 零 electron；`/rc/` 解析钩子机制同 `thincoder-desktop/test/rc-resolve.mjs`。
 * 跑法（仓根 `thincoder/`）：node --test docs/batches/2026-10-05-digest-accounting-desktop.test.mjs
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

const [faceMod, wake, rows, pageRead, i18n, i18nCore] = await Promise.all([
  mod("thincoder-desktop/src/main/turn-face.mjs"), // 边界帧 / 记录出点（`emitDigestEnd`）
  mod("thincoder-desktop/renderer/events-wake.mjs"), // `ev:digest` 归约（`onDigest`——归一 ∥ 直复用复列）
  mod("thincoder-desktop/renderer/views/chat-digest-rows.mjs"), // 行族构树（`digestRows`）
  mod("thincoder-desktop/renderer/page-read.mjs"), // 页读折叠（`applyPage`——复列承接）
  mod("thincoder-desktop/renderer/i18n.mjs"), // 词面投影（行文断言）
  mod("thincoder-core/i18n.mjs"), // 核字典投影（词面单源）
])
i18n.initDict({ locale: "zh", dict: i18nCore.projectDictionary("zh") })

/** turn-face 假面（帧 ∥ 记录两收集面——沿 `2026-10-01-desktop-pair-decisions` 先例）。 */
async function faceOf(over = {}) {
  const frames = []
  const records = []
  const agent = {
    title: "t", _slot: 1, history: [], _fullHistory: [], _historyWindow: 0,
    _recordStore: { append: (record) => records.push(record) },
    _pendingAsyncResults: over.pending ?? [],
  }
  const face = faceMod.createTurnFace({
    post: (ch, payload) => frames.push({ ch, payload }),
    run: () => Promise.resolve("done"),
    bridge: () => ({}),
    postUsage: () => {},
    flights: new Map(),
    turnGate: { stamp() {}, revoked: () => false },
  })
  await face.executeTurn("1", agent, "", over.opts ?? { autoTurn: true })
  return { frames, records, agent }
}
const endOf = (frames) => frames.filter((f) => f.ch === "ev:digest" && f.payload.status === "end")
const endRecordOf = (records) => records.find((r) => r.kind === "digest" && r.status === "end")

const ROW_MARKS = ["label", "count", "cap", "end", "residue"]
const typeOf = (row) => ROW_MARKS.find((n) => row.props?.[`data-digest-${n}`] != null) ?? null
const typesOf = (round) => rows.digestRows(round).map(typeOf)
const residueRowOf = (round) => rows.digestRows(round).find((row) => typeOf(row) === "residue")

const KEY = "1"
const pageState = (over = {}) => ({
  activeSession: KEY, blocks: [], digest: {}, stopMark: {}, timerNotice: {}, compress: {}, helpLines: {},
  sessionMeta: {}, following: false, pendingNew: 0, history: { hasOlder: false, inFlight: false }, ...over,
})
const receipt = (messages, over = {}) => ({ ok: true, messages, hasOlder: false, next: null, meta: {}, flags: null, queue: null, ...over })

test("DSK-1 · 帧 ∥ 记录（> 0）：非上行边界轮 `unsettled = 1` ⇒ `ev:digest end` 帧与记录同携（同值 `ms`）", async () => {
  const { frames, records } = await faceOf({ pending: [{ id: 5, role: "subagent", done: true, status: "done", report: "r", _daFailures: 1 }] })
  const ends = endOf(frames)
  assert.equal(ends.length, 1, "边界轮 `end` 帧恰一次")
  assert.equal(ends[0].payload.unsettled, 1, "帧携 `unsettled`（本轮未销账条数）")
  assert.equal(ends[0].payload.key, "1")
  const record = endRecordOf(records)
  assert.equal(record.unsettled, 1, "记录同携 `unsettled`（帧 ∥ 记录同源同点）")
  assert.equal(record.ms, ends[0].payload.ms, "`ms` 同值单算式（记录 ∥ 帧）")
})

test("DSK-2 · 零未销账（= 0）⇒ 键缺席（零噪音）", async () => {
  const { frames, records } = await faceOf({ pending: [{ id: 5, role: "subagent", done: true, status: "done", report: "r" }] })
  const ends = endOf(frames)
  assert.equal(ends.length, 1)
  assert.ok(!("unsettled" in ends[0].payload), "帧零增键（= 0 ⇒ 不携）")
  assert.ok(!("unsettled" in endRecordOf(records)), "记录零增键")
})

test("DSK-3 · 非上行轮门：上行唤醒轮同态 ⇒ 帧 ∥ 记录均不带 `unsettled`", async () => {
  const { frames, records } = await faceOf({
    pending: [{ id: 5, role: "subagent", done: true, status: "done", report: "r", _daFailures: 1 }],
    opts: { autoTurn: true, upstreamTurn: true },
  })
  const ends = endOf(frames)
  assert.equal(ends.length, 1, "上行轮属边界（帧照出）")
  assert.ok(!("unsettled" in ends[0].payload), "非上行轮门：上行轮不携（虽判据 = 1）")
  assert.ok(!("unsettled" in endRecordOf(records)), "记录同门")
})

test("DSK-4 · 归约归一（`onDigest`）：end 帧 `unsettled` 落轮记录；缺省 ⇒ 0（直复用复列同源）", () => {
  let state = wake.onDigest({ digest: {} }, { key: KEY, status: "start", n: 2, tier: null })
  state = wake.onDigest(state, { key: KEY, status: "end", ok: true, ms: 900, unsettled: 2 })
  assert.equal(state.digest[KEY][0].unsettled, 2, "轮记录携 `unsettled`（归一）")
  let zero = wake.onDigest({ digest: {} }, { key: KEY, status: "start", n: 2, tier: null })
  zero = wake.onDigest(zero, { key: KEY, status: "end", ok: true, ms: 900 })
  assert.equal(zero.digest[KEY][0].unsettled, 0, "缺省 ⇒ 归一 0（残余行零产判据同源）")
})

test("DSK-5 · 行组（`digestRows`）：`end` 且携 `unsettled > 0` ⇒ 终态行之后再落残余行（锚 `data-digest-residue`）；`= 0` ⇒ 零行", () => {
  const round = { status: "end", n: 2, tier: null, from: null, msg: null, ok: true, ms: 900, unsettled: 2 }
  assert.deepEqual(typesOf(round), ["label", "count", "end", "residue"], "行序 = 起跑 ∥ 计数 ∥ 终态 ∥ 残余")
  const residue = residueRowOf(round)
  assert.equal(residue.props["data-digest-residue"], "", "锚 `data-digest-residue`（行族闭集）")
  assert.equal(residue.props.class, "chat-digest digest-status", "行形 = status 族盒行")
  assert.equal(residue.children[0], i18n.t("digest.residue", { n: 2 }), "行文 = 核字典 `digest.residue` 直取")
  assert.deepEqual(typesOf({ ...round, unsettled: 0 }), ["label", "count", "end"], "= 0 ⇒ 零行（零噪音）")
  assert.deepEqual(typesOf({ ...round, unsettled: undefined }), ["label", "count", "end"], "缺省同判（跨批旧记录零回归）")
  assert.deepEqual(typesOf({ ...round, n: 0 }), ["label"], "`n = 0` 守句保持（零终态行——残余行随终态行同门）")
})

test("DSK-6 · 复列承接（`applyPage` 折叠）：兜 `unsettled` 记录 ⇒ 折出轮与重建行组同出残余行；无键 ⇒ 零行", () => {
  const s = pageRead.applyPage(pageState(), receipt([
    { kind: "digest", status: "start", n: 2, tier: null, idx: 10 },
    { kind: "digest", status: "end", ok: true, ms: 900, unsettled: 2, idx: 12 },
  ]), { key: KEY, before: null })
  const round = s.digest[KEY][0]
  assert.equal(round.unsettled, 2, "折叠轮携 `unsettled`（复列承接）")
  assert.equal(round.at, 10, "位次锚保持（起跑记录 idx）")
  assert.deepEqual(typesOf(round), ["label", "count", "end", "residue"], "重建行组同出残余行（与 live 同构形件）")

  const s0 = pageRead.applyPage(pageState(), receipt([
    { kind: "digest", status: "start", n: 2, tier: null, idx: 20 },
    { kind: "digest", status: "end", ok: true, ms: 900, idx: 22 },
  ]), { key: KEY, before: null })
  assert.deepEqual(typesOf(s0.digest[KEY][0]), ["label", "count", "end"], "无键记录 ⇒ 零行（跨批旧记录零回归）")
})
