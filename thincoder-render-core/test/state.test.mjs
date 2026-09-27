/**
 * state.test.mjs — 核态机层：子代理块态机（`subblocks/state.mjs` 迁移面 + `subblocks/channel.mjs`
 * 判据族——出生/接管/冻结/归档 + 终态补桩表 + 回收吞守卫 + 会话退出兜底）。
 *
 * 来源 = `thincoder-vscode/webview/activity.js` 迁移判据（判定表 §3 行 4「拆」）；判据锚 =
 * §5.1.4 / §5.3 / §14 C-1–C-5 / C-7 / C-8 / X6 / X11 / #118（逐条对拍）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import {
  parseChannel, findBlockNames, terminalKindOf, terminalStubKind, stubAllowed,
} from "../subblocks/channel.mjs"
import { subBlocksReduce, subBlocksFreezeAll, ensureSubBlock } from "../subblocks/state.mjs"

const types = (r) => r.effects.map((e) => e.type)
const effectsOf = (r, type) => r.effects.filter((e) => e.type === type)

test("判据：parseChannel 四形态（family / consult 嵌模型 / 通用 / 非法）", () => {
  assert.deepEqual(parseChannel("sub:eng-coder#1"), { channel: "sub:eng-coder#1", label: "eng-coder#1", role: "eng-coder", id: 1, model: null })
  assert.deepEqual(parseChannel("sub:consult glm-5.2 #4"), { channel: "sub:consult glm-5.2 #4", label: "consult glm-5.2 #4", role: "consult", id: 4, model: "glm-5.2" })
  assert.deepEqual(parseChannel("sub:any-role#7"), { channel: "sub:any-role#7", label: "any-role#7", role: "any-role", id: 7, model: null })
  assert.equal(parseChannel("sub:#x").role, null)
  assert.equal(parseChannel("sub:space role#1").role, null, "通用段 `[\\w-]+` 拦空格——回读不一致由 stubAllowed 判")
})

test("判据：findBlockNames（consult 嵌模型键 / 查询绝不建块）", () => {
  const list = [{ key: "sub:eng-coder#1" }, { key: "sub:eng-coder#2" }, { key: "sub:coder#1" }]
  assert.deepEqual(findBlockNames(list, "eng-coder", 1, null, null), ["sub:eng-coder#1"])
  assert.deepEqual(findBlockNames(list, "consult", 4, "glm-5.2", 4), ["sub:consult glm-5.2 #4"], "consult：模型 + sessionId 组成键（不在 list 亦返回）")
  assert.deepEqual(findBlockNames(list, "nobody", 9, null, null), [])
})

test("判据：terminalKindOf / terminalStubKind / stubAllowed", () => {
  assert.equal(terminalKindOf("done"), "done")
  assert.equal(terminalKindOf("settled"), "done")
  assert.equal(terminalKindOf("cancelled"), "stopped")
  assert.equal(terminalKindOf("terminated"), "stopped")
  assert.equal(terminalKindOf("error"), "error")
  assert.equal(terminalKindOf("failed"), "error")
  assert.equal(terminalKindOf("answered"), "done")
  assert.equal(terminalKindOf("running"), null)
  assert.equal(terminalKindOf("queued"), null)

  assert.equal(terminalStubKind({ status: "done" }), "done")
  assert.equal(terminalStubKind({ status: "settled" }), "done")
  assert.equal(terminalStubKind({ status: "cancelled", was: "queued" }), null, "从未启动不冻结（表内不补行）")
  assert.equal(terminalStubKind({ status: "cancelled" }), "stopped")
  assert.equal(terminalStubKind({ status: "answered" }), null)
  assert.equal(terminalStubKind({ status: "running" }), null)

  assert.equal(stubAllowed({ role: "eng-coder", id: 3 }), true)
  assert.equal(stubAllowed({ role: "eng coder", id: 3 }), false, "角色段非法（回读不一致）")
  assert.equal(stubAllowed({ role: "eng-coder" }), false)
})

test("出生：queued ⇒ born + queueInfo；started ⇒ 翻 running（清排队项 + pool/syncLive/model 写点）", () => {
  const list = []
  const traces = []
  let r = subBlocksReduce(list, { status: "queued", role: "eng-coder", id: 1, kind: "slot", position: 2, waiting: null, reason: null }, { trace: (n, k) => traces.push(`${n}:${k}`) })
  assert.deepEqual(types(r), ["born", "refresh"])
  assert.deepEqual(traces, ["birth:sub:eng-coder#1"])
  assert.equal(list.length, 1)
  assert.deepEqual(list[0].queueInfo, { kind: "slot", position: 2, waiting: null, reason: null })
  assert.equal(list[0].status, "queued")
  assert.equal(list[0].queued, true)

  r = subBlocksReduce(list, { status: "started", role: "eng-coder", id: 1, pool: true, syncLive: false, model: "glm-5.3", startedAt: 12345 }, { trace: (n, k) => traces.push(`${n}:${k}`) })
  assert.deepEqual(types(r), ["refresh"], "重复出生面 ⇒ 复用（无 born）")
  assert.deepEqual(traces, ["birth:sub:eng-coder#1", "reassert-hit:sub:eng-coder#1"])
  assert.equal(list.length, 1)
  assert.equal(list[0].status, "running")
  assert.equal(list[0].pool, true)
  assert.equal(list[0].syncLive, false)
  assert.equal(list[0].model, "glm-5.3")
  assert.equal(list[0].startedAt, 12345)
  assert.equal(list[0].queued, false)
  assert.equal(list[0].queueInfo, null, "started 后清排队信息")
  assert.equal(list[0].stateWord, null)
})

test("turn 帧：写 turn/maxTurns；冻结 ⇒ drop-frozen；tombstone ⇒ drop-tombstone（禁静默）", () => {
  const list = []
  subBlocksReduce(list, { status: "started", role: "coder", id: 1, pool: true })
  let r = subBlocksReduce(list, { status: "turn", role: "coder", id: 1, turn: 3, maxTurns: 100 })
  assert.deepEqual(types(r), ["refresh"])
  assert.equal(list[0].turn, 3)
  assert.equal(list[0].maxTurns, 100)

  const traces = []
  list[0].frozen = true
  r = subBlocksReduce(list, { status: "turn", role: "coder", id: 1, turn: 4, maxTurns: 100 }, { trace: (n, k) => traces.push(`${n}:${k}`) })
  assert.deepEqual(types(r), [])
  assert.deepEqual(traces, ["drop-frozen:sub:coder#1"])

  traces.length = 0
  list[0].frozen = false
  list[0].connected = false
  r = subBlocksReduce(list, { status: "turn", role: "coder", id: 1, turn: 5, maxTurns: 100 }, { trace: (n, k) => traces.push(`${n}:${k}`) })
  assert.deepEqual(types(r), [])
  assert.deepEqual(traces, ["drop-tombstone:sub:coder#1"])
})

test("终态折叠：done ⇒ fold + archive（尾追）；settled ⇒ fold + awaiting（驻留）", () => {
  const a = []
  subBlocksReduce(a, { status: "started", role: "eng-coder", id: 1, pool: true })
  let r = subBlocksReduce(a, { status: "done", role: "eng-coder", id: 1 })
  assert.deepEqual(r.effects, [{ type: "fold", key: "sub:eng-coder#1", kind: "done" }, { type: "archive", key: "sub:eng-coder#1", atBoundary: false, clearAwaiting: false }])
  assert.equal(a[0].frozen, true)
  assert.equal(a[0].doneAt !== null, true)
  assert.equal(a[0].approval, null, "终态清审批态")

  const b = []
  subBlocksReduce(b, { status: "started", role: "eng-coder", id: 2, pool: true })
  r = subBlocksReduce(b, { status: "settled", role: "eng-coder", id: 2 })
  assert.deepEqual(types(r), ["fold", "awaiting"])
  assert.equal(b[0].awaitingDigest, true)

  // 消化回收（C-3①）：awaitingDigest 收 done ⇒ 边界前归档 + 清 awaiting
  r = subBlocksReduce(b, { status: "done", role: "eng-coder", id: 2 })
  assert.deepEqual(r.effects, [{ type: "archive", key: "sub:eng-coder#2", atBoundary: true, clearAwaiting: true }])
  assert.equal(b[0].awaitingDigest, false)

  // 冻结块收其它终态 ⇒ drop-frozen（丢弃 + 痕）
  const traces = []
  r = subBlocksReduce(b, { status: "settled", role: "eng-coder", id: 2 }, { trace: (n, k) => traces.push(`${n}:${k}`) })
  assert.deepEqual(types(r), [])
  assert.deepEqual(traces, ["drop-frozen:sub:eng-coder#2"])
})

test("终态 kind 全族：cancelled ⇒ stopped / error 携 error / terminated ⇒ stopped / failed ⇒ error", () => {
  const mk = (kindPatch) => {
    const list = []
    subBlocksReduce(list, { status: "started", role: "coder", id: 1, pool: true })
    const r = subBlocksReduce(list, { status: kindPatch.status, role: "coder", id: 1, ...kindPatch.extra })
    return { list, r }
  }
  assert.equal(effectsOf(mk({ status: "cancelled" }).r, "fold")[0].kind, "stopped")
  const err = mk({ status: "error", extra: { error: "boom" } })
  assert.equal(effectsOf(err.r, "fold")[0].kind, "error")
  assert.equal(err.list[0].error, "boom")
  assert.equal(mk({ status: "terminated" }).list[0].status, "cancelled")
  assert.equal(mk({ status: "failed" }).list[0].status, "error")
  assert.equal(mk({ status: "answered" }).list[0].status, "done")
})

test("新代接管：冻结块收出生事件 ⇒ takeover（同键顶替；旧 awaitingDigest 先归档 + 新块吞守卫）", () => {
  const list = []
  subBlocksReduce(list, { status: "started", role: "eng-coder", id: 1, pool: true })
  subBlocksReduce(list, { status: "settled", role: "eng-coder", id: 1 })
  assert.equal(list[0].awaitingDigest, true)
  const traces = []
  let r = subBlocksReduce(list, { status: "started", role: "eng-coder", id: 1, pool: true }, { trace: (n, k) => traces.push(`${n}:${k}`) })
  assert.deepEqual(types(r), ["archive", "takeover", "refresh"], "旧块先归档（clearAwaiting）后改绑")
  assert.deepEqual(traces, ["takeover:sub:eng-coder#1"])
  assert.equal(list.length, 1, "同键顶替——绝不同键两条")
  assert.equal(list[0].frozen, false)
  assert.equal(list[0].oldReclaimPending, true)

  // 回收吞守卫（C-5③）：该键首条 done 吞
  r = subBlocksReduce(list, { status: "done", role: "eng-coder", id: 1 })
  assert.deepEqual(types(r), [])
  assert.equal(list[0].oldReclaimPending, false)
  assert.equal(list[0].frozen, false, "吞守卫不动块")

  // 第二条 done 正常折叠
  r = subBlocksReduce(list, { status: "done", role: "eng-coder", id: 1 })
  assert.deepEqual(types(r), ["fold", "archive"])
})

test("queued 取消（was:\"queued\"）⇒ remove（不冻结——等待头移除）", () => {
  const list = []
  subBlocksReduce(list, { status: "queued", role: "eng-coder", id: 5, kind: "slot", position: 1 })
  const r = subBlocksReduce(list, { status: "cancelled", was: "queued", role: "eng-coder", id: 5 })
  assert.deepEqual(r.effects, [{ type: "remove", key: "sub:eng-coder#5" }])
  assert.equal(list.length, 0)
  assert.equal(list.find?.((b) => b.frozen), undefined)
  // 非 queued 的 cancelled ⇒ 正常折叠终态（stopped）
  const l2 = []
  subBlocksReduce(l2, { status: "started", role: "eng-coder", id: 6, pool: true })
  const r2 = subBlocksReduce(l2, { status: "cancelled", role: "eng-coder", id: 6 })
  assert.deepEqual(types(r2), ["fold", "archive"])
  assert.equal(l2[0].status, "cancelled")
})

test("终态补桩（§5.3 终态必现）：never-born done ⇒ born+fold+archive；表内不补行 / 非法角色不补", () => {
  const traces = []
  const list = []
  const r = subBlocksReduce(list, { status: "done", role: "eng-coder", id: 9 }, { trace: (n, k) => traces.push(`${n}:${k}`) })
  assert.deepEqual(types(r), ["born", "fold", "archive"])
  assert.deepEqual(traces, ["late-terminal-stub:sub:eng-coder#9"])
  assert.equal(list.length, 1)
  assert.equal(list[0].frozen, true)
  assert.equal(list[0].key, "sub:eng-coder#9")

  const l2 = []
  const traces2 = []
  assert.deepEqual(types(subBlocksReduce(l2, { status: "answered", role: "eng-coder", id: 9 }, { trace: (n, k) => traces2.push(`${n}:${k}`) })), [])
  assert.deepEqual(types(subBlocksReduce(l2, { status: "cancelled", was: "queued", role: "eng-coder", id: 9 }, { trace: (n, k) => traces2.push(`${n}:${k}`) })), [])
  assert.deepEqual(traces2, [], "表内不补行不补痕")

  const l3 = []
  const traces3 = []
  assert.deepEqual(types(subBlocksReduce(l3, { status: "done", role: "eng coder", id: 9 }, { trace: (n, k) => traces3.push(`${n}:${k}`) })), [])
  assert.deepEqual(traces3, ["drop-unknown-role:sub:eng coder#9"], "角色非法 ⇒ no-op + 痕")
  assert.deepEqual(types(subBlocksReduce(l3, { status: "done", id: 9 }, { trace: (n, k) => traces3.push(`${n}:${k}`) })), [])
  assert.equal(traces3[1], "drop-unknown-role:(unidentified)")

  // tombstone 终态防御：条目不可用 ⇒ 补桩顶替（同键不重复）
  const l4 = [{ key: "sub:coder#3", label: "coder#3", role: "coder", id: 3, status: "running", frozen: false, connected: false }]
  const r4 = subBlocksReduce(l4, { status: "error", role: "coder", id: 3, error: "x" }, {})
  assert.deepEqual(types(r4), ["born", "fold", "archive"])
  assert.equal(l4.length, 1, "顶替旧 tombstone 条目")
  assert.equal(l4[0].error, "x")
})

test("审批态（C-8）：写 ≤40 字符 / null 清态；冻结 / 无块不收", () => {
  const list = []
  subBlocksReduce(list, { status: "started", role: "coder", id: 2, pool: true })
  let r = subBlocksReduce(list, { status: "approval", role: "coder", id: 2, tool: "x".repeat(60) })
  assert.deepEqual(types(r), ["refresh"])
  assert.equal(list[0].approval.length, 40)
  subBlocksReduce(list, { status: "approval", role: "coder", id: 2, tool: null })
  assert.equal(list[0].approval, null)
  list[0].frozen = true
  r = subBlocksReduce(list, { status: "approval", role: "coder", id: 2, tool: "write" })
  assert.deepEqual(types(r), [])
  assert.equal(list[0].approval, null)
  r = subBlocksReduce(list, { status: "approval", role: "coder", id: 77, tool: "write" })
  assert.deepEqual(types(r), [], "无块 child 不因审批事件出生")
  assert.equal(list.length, 1)
})

test("会话退出兜底：interrupted 注记 + 驻区块归档；已冻结块不回头改写", () => {
  const live = { key: "sub:coder#1", frozen: false, note: null, awaitingDigest: false, region: "activity" }
  const awaiting = { key: "sub:coder#2", frozen: true, note: null, awaitingDigest: true, region: "activity" }
  const archived = { key: "sub:coder#3", frozen: true, note: null, awaitingDigest: false, region: "stream" }
  const list = [live, awaiting, archived]
  const r = subBlocksFreezeAll(list, { interrupted: true, regionOf: (b) => b.region })
  assert.deepEqual(r.effects, [
    { type: "fold", key: "sub:coder#1", kind: "done" },
    { type: "archive", key: "sub:coder#1", atBoundary: false, clearAwaiting: false },
    { type: "archive", key: "sub:coder#2", atBoundary: false, clearAwaiting: true },
  ])
  assert.equal(live.note, "interrupted")
  assert.equal(live.frozen, true)
  assert.equal(awaiting.note, null, "已冻结块不回头改写")
  assert.equal(awaiting.awaitingDigest, false)
  assert.equal(archived.region, "stream", "流内块零动作")
})

test("内容 chunk 出生闸 ensureSubBlock（ensureBlock 承）：无键 ⇒ born；frozen / 墓碑 ⇒ null；live ⇒ 复用", () => {
  const traces = []
  const list = []
  let r = ensureSubBlock(list, "sub:explore#2", { trace: (n, k) => traces.push(`${n}:${k}`) })
  assert.equal(r.block.key, "sub:explore#2")
  assert.deepEqual(types(r), ["born"])
  assert.deepEqual(traces, ["birth:sub:explore#2"])
  assert.equal(list.length, 1)
  assert.equal(list[0].status, "running")

  // live ⇒ 复用（零效果 / 零痕）
  r = ensureSubBlock(list, "sub:explore#2", { trace: (n, k) => traces.push(`${n}:${k}`) })
  assert.equal(r.block, list[0])
  assert.deepEqual(types(r), [])
  assert.deepEqual(traces, ["birth:sub:explore#2"])

  // 冻结 ⇒ null（幂等守卫——迟来内容绝不复活重建）
  subBlocksReduce(list, { status: "done", role: "explore", id: 2 })
  r = ensureSubBlock(list, "sub:explore#2")
  assert.equal(r.block, null)
  assert.deepEqual(types(r), [])
  assert.equal(list.length, 1)

  // 墓碑 ⇒ null
  const l2 = [{ key: "sub:coder#1", role: "coder", id: 1, frozen: false, connected: false }]
  assert.equal(ensureSubBlock(l2, "sub:coder#1").block, null)

  // consult 形态键（本闸唯一能建的嵌模型键）
  const l3 = []
  r = ensureSubBlock(l3, "sub:consult glm-5.2 #4")
  assert.equal(r.block.role, "consult")
  assert.equal(r.block.model, "glm-5.2")
  assert.equal(r.block.id, 4)

  // 判据异面对照：同一冻结键，reduce 出生面走**接管**（新代），本闸返 null
  const l4 = []
  ensureSubBlock(l4, "sub:plan#1")
  subBlocksReduce(l4, { status: "done", role: "plan", id: 1 })
  const rr = subBlocksReduce(l4, { status: "started", role: "plan", id: 1, pool: false })
  assert.deepEqual(types(rr), ["takeover", "refresh"])
  assert.equal(l4.length, 1)
  assert.equal(l4[0].frozen, false)
})

test("自然退出（非 interrupted）：零注记（不伪造）", () => {
  const live = { key: "sub:coder#1", frozen: false, note: null, region: "activity" }
  const r = subBlocksFreezeAll([live], { regionOf: (b) => b.region })
  assert.deepEqual(types(r), ["fold", "archive"])
  assert.equal(live.note, null)
})
