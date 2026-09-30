/**
 * 2026-09-29-batch-mechanics.test.mjs — 批次本地单元件（batch-mechanics · #545 写门豁免自身批次伴随件 ·
 * 随批留存归档）。名随批次档 · 住批次目录（本刻暂存 `.thincoder/tmp/`——父侧收位）；不进仓套件；
 * 复跑 = 从仓库根 `thincoder/`：
 *   node --test docs/batches/2026-09-29-batch-mechanics.test.mjs
 *
 * 覆盖 = 批档 §2.6 AC-1..AC-4（判据直调 = `batchRecordWriteConflict`；AC-1 ∕ AC-2 另加 dispatch 端到端腿）：
 *   AC-1 伴随件放行 ×4 拍（命名族抽样：点式 ∕ 杠式；非穷举）·
 *   AC-2 他批 `.md` 拒（reason 串 + 文案逐字）·
 *   AC-3 拒面三拍（他批伴件（词干不符）· `<词干>-v2.md` · 异目录伴件）·
 *   AC-4 零变三面（depth 0 ∕ 无绑定 ∕ 基外；第四腿 `file_ops` = parity-b1 E2⑥ 在册承载——不在本门）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import { resolve } from "node:path"
import { pathToFileURL } from "node:url"

const ROOT = process.cwd()
if (!existsSync(resolve(ROOT, "thincoder-core"))) throw new Error(`须从仓库根（thincoder/）运行——cwd = ${ROOT}`)
const mod = (rel) => import(pathToFileURL(resolve(ROOT, rel)).href)
const { batchRecordWriteConflict } = await mod("thincoder-core/agent/write-gate.mjs")
const coreDispatch = await mod("thincoder-core/agent/dispatch.mjs")

const STEM = "2026-09-29-batch-mechanics" // 绑定档词干（= 批档基名剥 `.md`）
const BOUND = resolve(ROOT, `docs/batches/${STEM}.md`)
const inBatch = (name) => resolve(ROOT, "docs/batches", name)
const agentWith = (bound) => ({ cwd: ROOT, _batchDoc: bound })

test("AC-1 判据直调：自身批次伴随件放行 ×4 拍（命名族抽样——点式 ∕ 杠式；非穷举）", () => {
  const a = agentWith(BOUND)
  const names = [
    `${STEM}.test.mjs`, // 点式——批次本地单元件标准形
    `${STEM}-probe.mjs`, // 杠式——探针件
    `${STEM}-fixture.mjs`, // 杠式——夹具件
    `${STEM}-r2.test.mjs`, // 杠式 + 波次（`-<波次>.test.mjs`）
  ]
  for (const n of names) {
    assert.equal(batchRecordWriteConflict(a, 1, [inBatch(n)]), null, `放行：docs/batches/${n}`)
  }
})

test("AC-2 判据直调：他批 `.md` 照拒（命中形态 + 文案逐字）", () => {
  const other = inBatch("2026-09-29-other.md")
  const c = batchRecordWriteConflict(agentWith(BOUND), 1, [other])
  assert.ok(c, "他批 .md ⇒ 冲突（端面对应 = parity-b1 E2⑤）")
  assert.equal(c.bound, BOUND, "bound = 绑定档绝对路径")
  assert.equal(c.target, other, "target = 目标绝对路径")
  assert.equal(c.message,
    `write refused — cross-batch batch-record write: this child is bound to ${STEM}.md; 2026-09-29-other.md belongs to a different batch. Write only your own bound record and its companion files (the batch tool targets your bound record); the parent agent handles other batch records.`,
    "拒绝文案逐字（字面单源 = write-gate.mjs）")
})

test("AC-3 判据直调：拒面三拍（他批伴件（词干不符）· `<词干>-v2.md` · 异目录伴件）", () => {
  const a = agentWith(BOUND)
  const cases = [
    ["2026-09-29-other.test.mjs", "他批伴随件（词干不符）"],
    [`${STEM}-v2.md`, "近词干 .md（合取①——批次档本体永在门内）"],
    [`sub/${STEM}-probe.mjs`, "异目录伴随件（合取②）"],
  ]
  for (const [rel, why] of cases) {
    assert.ok(batchRecordWriteConflict(a, 1, [inBatch(rel)]), `拒：docs/batches/${rel}（${why}）`)
  }
})

test("AC-4 判据直调：零变三面（depth 0 ∕ 无 `_batchDoc` ∕ 基外文件）", () => {
  const other = inBatch("2026-09-29-other.md")
  assert.equal(batchRecordWriteConflict(agentWith(BOUND), 0, [other]), null, "depth 0（主 agent）不进本门")
  assert.equal(batchRecordWriteConflict({ cwd: ROOT }, 1, [other]), null, "无 `_batchDoc`（非工程绑定族）不进本门")
  assert.equal(batchRecordWriteConflict(agentWith(BOUND), 1, [resolve(ROOT, "thincoder-core/agent/write-gate.mjs")]), null, "基底外普通文件写不进本门")
})

test("AC-1 ∕ AC-2 端到端（dispatch Phase 1）：伴件写受理 ∥ 他批 `.md` 拒因 = `cross-batch record write`", async () => {
  const tool = (name) => ({ name, readonly: false, parallel: false, execute: async () => `ok:${name}` })
  const call = (name, args) => ({ id: `id-${name}`, name, arguments: JSON.stringify(args ?? {}) })
  const agent = {
    cwd: ROOT, planMode: false, autoApprove: false,
    _engTaskAuthorized: false, _touchedFiles: [], _mutationSeq: 0, _mutLog: [],
    _batchDoc: BOUND, config: { agent: { engineering: false } },
  }
  const run = (args) =>
    coreDispatch.executeToolCalls(
      agent, new Map([["write", tool("write")]]), [call("write", args)],
      { onPermissionRequest: async () => true }, 1,
    )
  const r1 = await run({ path: `docs/batches/${STEM}.test.mjs` })
  assert.ok(r1[0].ok === true, "AC-1 端到端：伴件写受理（写工具直行）")
  const r2 = await run({ path: "docs/batches/2026-09-29-other.md" })
  assert.equal(r2[0].denied ? r2[0].reason : null, "cross-batch record write", "AC-2 端到端：拒因串 = parity-b1 E2⑤ 同形")
})
