/**
 * batch-record-write-gate.test.mjs — #309 批次档写门（`docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.29.1）：
 * 用例 T12（核：判据 + dispatch 接线）/ T13（正控）/ T14（豁免面）/ T16（门范围机检——两端源码）。
 * 夹具 = 临时工作区（`docs/batches/a.md` · `b.md`——默认基底形态）；判据面无网络 / 无真实仓库。
 */
import { test, after } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { batchRecordWriteConflict } from "../agent/write-gate.mjs"
import { executeToolCalls } from "../agent/dispatch.mjs"

const dirs = []
/** 临时工作区：`<tmp>/docs/batches/{a,b}.md`（默认基底 = `<项目根>/docs/batches`）。 */
function ws() {
  const d = mkdtempSync(join(tmpdir(), "brwg-"))
  dirs.push(d)
  mkdirSync(join(d, "docs", "batches"), { recursive: true })
  writeFileSync(join(d, "docs", "batches", "a.md"), "# A\n", "utf8")
  writeFileSync(join(d, "docs", "batches", "b.md"), "# B\n", "utf8")
  return d
}
after(() => { for (const d of dirs) rmSync(d, { recursive: true, force: true }) })

const A = (d) => join(d, "docs", "batches", "a.md")
const B = (d) => join(d, "docs", "batches", "b.md")
const boundAgent = (d, over = {}) => ({
  cwd: d, _batchDoc: A(d), config: { agent: {} }, planMode: false, autoApprove: false,
  _mutLog: [], _mutationSeq: 0, _touchedFiles: [], history: [], ...over,
})
const writeStub = (sink) => ({
  name: "write", readonly: false, touchedPaths: (a) => [a.path],
  execute: async () => { sink.n++; return "written" },
})
const runWrite = (agent, tool, path, depth = 1) =>
  executeToolCalls(agent, new Map([["write", tool]]), [{ name: "write", arguments: JSON.stringify({ path, content: "x" }), id: "c1" }], {}, depth, undefined)

test("T13 正常：写自己绑定的档 ⇒ 放行（null——不进本门；相对/绝对同判）", () => {
  const d = ws()
  const agent = boundAgent(d)
  assert.equal(batchRecordWriteConflict(agent, 1, [A(d)]), null)
  assert.equal(batchRecordWriteConflict(agent, 1, ["docs/batches/a.md"]), null)
  assert.equal(batchRecordWriteConflict(agent, 1, [`${d}/docs/batches/./a.md`]), null)
})

test("T12 判据（核）：绑定档 A 的子代理写 B ⇒ 命中（bound / target / 单源文案含两侧基名）", () => {
  const d = ws()
  const hit = batchRecordWriteConflict(boundAgent(d), 1, [B(d)])
  assert.ok(hit, "跨批写 ⇒ 命中")
  assert.equal(hit.bound, A(d))
  assert.equal(hit.target, B(d))
  assert.match(hit.message, /^write refused — cross-batch batch-record write: this child is bound to a\.md; b\.md is a different batch record\./)
  assert.match(hit.message, /the batch tool targets your bound record/)
})

test("T12 接线（核 dispatch Phase 1）：跨批写被拒 ∧ 零执行 ∧ 目标档零变更", async () => {
  const d = ws()
  const sink = { n: 0 }
  const res = await runWrite(boundAgent(d), writeStub(sink), B(d), 1)
  assert.equal(res[0].ok, false)
  assert.match(String(res[0].result), /^Error: write refused — cross-batch batch-record write/)
  assert.ok(String(res[0].result).includes("a.md") && String(res[0].result).includes("b.md"), "文案含两侧基名")
  assert.equal(sink.n, 0, "拒绝 ⇒ 工具零执行")
  assert.equal(readFileSync(B(d), "utf8"), "# B\n", "目标档内容零变更")
})

test("T14 边界：depth 0 / 无 _batchDoc / 基底外文件 / 空与非字符串路径集 ⇒ 零变（null）", () => {
  const d = ws()
  assert.equal(batchRecordWriteConflict(boundAgent(d), 0, [B(d)]), null, "depth 0（主 agent）不受门约束")
  assert.equal(batchRecordWriteConflict({ cwd: d }, 1, [B(d)]), null, "无 _batchDoc（非工程绑定族）")
  assert.equal(batchRecordWriteConflict(boundAgent(d), 1, [join(d, "src", "x.mjs")]), null, "基底外普通写")
  assert.equal(batchRecordWriteConflict(boundAgent(d), 1, []), null)
  assert.equal(batchRecordWriteConflict(boundAgent(d), 1, [null, 42]), null)
})

test("T14 接线：depth 0 写他批档 ⇒ 不入门（拒因非跨批写门）", async () => {
  const d = ws()
  const sink = { n: 0 }
  const res = await runWrite(boundAgent(d), writeStub(sink), B(d), 0)
  assert.ok(!/cross-batch/.test(String(res[0].result)), `depth 0 不入本门；实测：${res[0].result}`)
})

test("T12 边界（win32）：比较键大小写归一——大小写形态不误判 / 不误放", () => {
  if (process.platform !== "win32") return
  const d = ws()
  assert.ok(batchRecordWriteConflict({ cwd: d, _batchDoc: A(d).toUpperCase() }, 1, [B(d)]), "大小写差异的他批写仍命中")
  assert.equal(batchRecordWriteConflict({ cwd: d, _batchDoc: A(d).toUpperCase() }, 1, [A(d)]), null, "同一档的大小写差异不误判")
})

// ─────────────────────────────────────────────────────────────────────────────
// T16 门范围机检（两端源码扫描）：门调用点须落在 `FILE_MUTATORS.has(...)` 守卫块内
// （判据集 = FILE_MUTATORS——file_ops / 读类不在门内）；每端调用点恰一处。
// ─────────────────────────────────────────────────────────────────────────────

/** 自调用行沿缩进向上收集包围块开括号行（结构机检——先例 = 同批 AC-1 读源码断言）。 */
function enclosingOpeners(lines, callIdx) {
  const indentOf = (l) => l.match(/^ */)[0].length
  const out = []
  let cur = indentOf(lines[callIdx])
  for (let i = callIdx - 1; i >= 0 && cur > 0; i--) {
    const line = lines[i]
    if (!line.trim()) continue
    const ind = indentOf(line)
    if (ind >= cur) continue
    if (!line.trimEnd().endsWith("{")) break
    out.push(line.trim())
    cur = ind
  }
  return out
}

test("T16 门范围机检：两端调用点被 FILE_MUTATORS 守卫包夹（file_ops / 读类不在门内）", () => {
  const here = dirname(fileURLToPath(import.meta.url))
  const ends = [
    join(here, "..", "agent", "dispatch.mjs"),
    join(here, "..", "..", "thincoder-vscode", "src", "agent", "tool-gates.mjs"),
  ]
  for (const f of ends) {
    const lines = readFileSync(f, "utf8").split(/\r?\n/)
    const callIdx = lines.map((l, i) => (l.includes("batchRecordWriteConflict(") ? i : -1)).filter((i) => i >= 0)
    assert.equal(callIdx.length, 1, `${f}: 门调用点恰一处（实测 ${callIdx.length}）`)
    const chain = enclosingOpeners(lines, callIdx[0])
    assert.ok(chain.length > 0, `${f}: 门调用点须在块内`)
    assert.match(chain[0], /FILE_MUTATORS\.has\(/, `${f}: 门判据集须为 FILE_MUTATORS；实测包围链首项：${chain[0]}`)
    assert.ok(!chain[0].includes("||"), `${f}: 门判据集不含 file_ops 等并集（file_ops / 读类不在门内）：${chain[0]}`)
  }
})
