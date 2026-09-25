/**
 * queue-payload-binding.test.mjs — #309 条目自携 + 串扰回归锁 + 观测留痕
 * （`docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.29.2 / §6.29.4 · 台账 #309）：
 * T10 条目自携（同域两条目 ⇒ 逐条 `_batchDoc` / `_taskSeal` = spawn 入参、互不相等）
 * T11 启动序（先入者先启动——既有判据零回归）· T15 观测留痕两态（`child:batchdoc-ref`）。
 * 纯单元：池内预置同域 running 阻断条目 ⇒ 两条目一律 queued（不触发真实子代理 runAgent——零网络）。
 */
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"

import { buildSpawnChild } from "@thincoder/core/agent-tools/subagent-spawn.mjs"
import { executeAsyncSpawn } from "@thincoder/core/agent-tools/subagent-run.mjs"
import { maybeRefillAsync } from "@thincoder/core/agent-tools/subagent-scheduler.mjs"
import { ENG_TASK_BOOK_MIN } from "@thincoder/core/agent-tools/spawn-gates.mjs"

let ws = null
let logDir = null
before(() => {
  ws = mkdtempSync(join(tmpdir(), "qpb-"))
  mkdirSync(join(ws, "docs", "batches"), { recursive: true })
  writeFileSync(join(ws, "docs", "batches", "a.md"), "# A\n", "utf8")
  writeFileSync(join(ws, "docs", "batches", "b.md"), "# B\n", "utf8")
})
after(() => {
  if (ws) rmSync(ws, { recursive: true, force: true })
  if (logDir) rmSync(logDir, { recursive: true, force: true })
})

const REC = (n) => join(ws, "docs", "batches", `${n}.md`)
const FILES = () => [resolve(ws, "src/x.mjs")]
/** #309 留痕摘要形（12 hex sha256——与实现同算法；断言 = spawn 入参一致）。 */
const seal = (s) => createHash("sha256").update(String(s)).digest("hex").slice(0, 12)

/** 池内 1 条同域 running（文件域阻断）⇒ 后续同域 spawn 一律 queued（零异步残留）。 */
function parentWithBlocker() {
  return {
    cwd: ws, provider: { name: "p", model: "m" }, config: { agent: {} },
    tools: [{ name: "read", readonly: true }], planMode: false, autoApprove: false,
    _mutLog: [], _mutationSeq: 0,
    _asyncSubagents: new Map([["1", { id: 1, role: "explore", status: "running", _pool: "other", _files: FILES() }]]),
  }
}

/** 真实 spawn 链路（装配 → async 入池）：eng-designer = 工程绑定族（child._batchDoc 在场）。 */
function spawn(p, { batchDoc, task, files = FILES() }) {
  const args = { batchDoc, round: "initial", task }
  const built = buildSpawnChild(p, { agent: p }, args, "eng-designer", true, files, [], null)
  const ack = JSON.parse(executeAsyncSpawn(p, {}, "eng-designer", args, built.child, built.input, built.childOpts, built.childRunOpts, built.relayPrefix, built.childProvider, files, []))
  return { built, ack, entry: p._asyncSubagents.get(ack.id) }
}

test("T10 条目自携：同域两条目逐条携自身 payload（互不相等——零跨条目文本）", () => {
  const p = parentWithBlocker()
  const t1 = `${ENG_TASK_BOOK_MIN}\n（甲批任务书——本批独有文本）`
  const t2 = `${ENG_TASK_BOOK_MIN}\n（乙批任务书——另有内容）`
  const s1 = spawn(p, { batchDoc: REC("a"), task: t1 })
  const s2 = spawn(p, { batchDoc: REC("b"), task: t2 })
  assert.equal(s1.ack.status, "queued", "同域冲突 ⇒ 入队（不启动）")
  assert.equal(s2.ack.status, "queued")
  assert.equal(s1.entry._batchDoc, REC("a"))
  assert.equal(s2.entry._batchDoc, REC("b"))
  assert.equal(s1.entry._taskSeal, seal(s1.built.input), "自携摘要 = 该条 spawn 入参")
  assert.equal(s2.entry._taskSeal, seal(s2.built.input))
  assert.equal(s1.entry._taskSeal, seal(t1))
  assert.equal(s2.entry._taskSeal, seal(t2))
  assert.notEqual(s1.entry._batchDoc, s2.entry._batchDoc, "两条目绑定档互不相等")
  assert.notEqual(s1.entry._taskSeal, s2.entry._taskSeal, "两条目任务书零交叉")
})

test("T11 启动序（零回归）：先入者先启动；先入者终态后后入者补位", () => {
  const p = parentWithBlocker()
  const s1 = spawn(p, { batchDoc: REC("a"), task: `${ENG_TASK_BOOK_MIN}\n（甲）` })
  const s2 = spawn(p, { batchDoc: REC("b"), task: `${ENG_TASK_BOOK_MIN}\n（乙）` })
  assert.deepEqual(p._asyncQueue.map((e) => e.id), [s1.entry.id, s2.entry.id], "队列序 = spawn 序")
  p._asyncSubagents.get("1")._files = [] // 阻断者让开（同文件域释放）
  const started = []
  s1.entry.start = () => started.push(s1.entry.id)
  s2.entry.start = () => started.push(s2.entry.id)
  maybeRefillAsync(p)
  assert.deepEqual(started, [s1.entry.id], "先入者先启动；后入者等先入者（既有判据零回归）")
  s1.entry.status = "done"
  s1.entry.done = true // 先入者 settle（出队 → 腾位）
  maybeRefillAsync(p)
  assert.deepEqual(started, [s1.entry.id, s2.entry.id], "先入者完成后后入者补位")
})

test("T15 观测留痕两态：提他批存在档 ⇒ 一条 child:batchdoc-ref；只提绑定档 ⇒ 零事件（两态均放行）", () => {
  logDir = mkdtempSync(join(tmpdir(), "qpb-log-"))
  process.env.THINCODER_LOG_DIR = logDir
  try {
    // 态①：任务书提「他批存在档」两形（相对 + 盘符绝对——同一档 ⇒ 去重后仍恰一条）
    const p1 = parentWithBlocker()
    const s1 = spawn(p1, { batchDoc: REC("a"), task: `${ENG_TASK_BOOK_MIN}\n参考 docs/batches/b.md 的 §1（他批证据引用）；或 ${REC("b")}（绝对形态）。` })
    assert.equal(s1.ack.status, "queued", "spawn 照常放行（观测不阻断）")
    // 态②：只提绑定档 / 无路径型 .md 字面（裸名 AGENTS.md）⇒ 零事件
    const p2 = parentWithBlocker()
    const s2 = spawn(p2, { batchDoc: REC("a"), task: `${ENG_TASK_BOOK_MIN}\n本档 docs/batches/a.md；裸名形态 AGENTS.md 不取。` })
    assert.equal(s2.ack.status, "queued", "spawn 照常放行（零事件态同样不阻断）")
    const hits = readdirSync(logDir)
      .flatMap((f) => readFileSync(join(logDir, f), "utf8").split(/\r?\n/))
      .filter((l) => l.includes('"child:batchdoc-ref"'))
    assert.equal(hits.length, 1, `留痕恰一条（态①一条 / 态②零条）；实测：\n${hits.join("\n")}`)
    const ev = JSON.parse(hits[0])
    assert.equal(ev.role, "eng-designer")
    assert.equal(ev.batchDocBase, "a.md", "绑定档侧基名")
    assert.equal(ev.refBase, "b.md", "引用档侧基名")
  } finally {
    delete process.env.THINCODER_LOG_DIR
  }
})
