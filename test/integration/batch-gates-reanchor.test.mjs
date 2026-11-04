/**
 * batch-gates-reanchor.test.mjs — 集成用例 14-1 … 14-8（RTM CLI 端故事 14「评审过、收口清、重开回」）。
 *
 * 判据原文 = `test/RTM.md` 第 14 节；机制 = `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` §2.5 / §2.6 /
 * §2.6.1 / §2.7 / §2.11 / §2.13。**进入口 = 父侧工具面**（`batch` / `ledger` / `write`）——断言业务可观察结果
 * （拒 ∥ 写入、回执行、行状态、产品码可写性）。14-1 的第二支是 `§3` 写入闸（`R-G3`）：无裁定行的 `§3`
 * 在写的那一刻就拒，存量无裁定块仍由 `§5` 门报出来。
 *
 * 复跑（cwd = 仓根）：`node --test test/integration/batch-gates-reanchor.test.mjs`
 */
import { test, after } from "node:test"
import assert from "node:assert/strict"
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { batchTool } from "../../thincoder-core/agent-tools/batch.mjs"
import { ledgerTool } from "../../thincoder-core/ledger-tools.mjs"
import { executeToolCalls } from "../../thincoder-core/agent/dispatch.mjs"
import { writeTool } from "../../thincoder-core/tools/file.mjs"
const { _setLedgerDirForTest, _resetLedgerDirForTest, ledgerAdd, ledgerClose, ledgerQuery, ledgerUpdate } = await import("../../thincoder-core/ledger.mjs")

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..")
const SCRATCH = join(ROOT, ".thincoder/tmp")
const ledgerDir = mkdtempSync(join(SCRATCH, "gates-ledger-"))
_setLedgerDirForTest(ledgerDir)
const fixtures = []
after(() => {
  _resetLedgerDirForTest()
  for (const p of fixtures) rmSync(p, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 })
  rmSync(ledgerDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 })
})

const REC = "docs/batches/g.md"
const UUID = "22222222-2222-2222-2222-222222222222"
function makeProject(tag) {
  mkdirSync(SCRATCH, { recursive: true })
  const root = mkdtempSync(join(SCRATCH, `gt-${tag}-`))
  fixtures.push(root)
  writeFileSync(join(root, "PROJECT-MANIFEST.json"), JSON.stringify({ version: 1, docRoot: { batches: "docs/batches" } }, null, 2))
  mkdirSync(join(root, "docs/batches"), { recursive: true })
  mkdirSync(join(root, "thincoder-core"), { recursive: true })
  return root
}
const agentOf = (root, { designSlot = false } = {}) => {
  const agent = { cwd: root, config: { agent: { engineering: true } } }
  if (designSlot) { agent.planMode = false; agent.autoApprove = true; agent._engDesignTokens = new Map([["fx", `${UUID}:${Date.now() + 3600_000}`]]) }
  return agent
}
const ctx0 = (root) => ({ depth: 0, agent: agentOf(root) })
const parent = batchTool(null)
const rowsOf = (root) => ledgerQuery({ cwd: root, boundary: root })
const recOf = (root) => join(root, REC)
/** 建一档并填 §2 / §3 段体 / §4 / §6（§3 结论由各例处置）。 */
async function freshRecord(tag, { s3Body = true } = {}) {
  const root = makeProject(tag)
  await parent.execute({ action: "create", path: REC, topic: "g", source: "集成夹具" }, ctx0(root))
  let src = readFileSync(recOf(root), "utf8")
    .replace("## §2 批次任务与设计（eng-designer）", "## §2 批次任务与设计（eng-designer）\n\nbody")
    .replace(/## §4 用户批准（[^）]*）/, "## §4 用户批准（主 agent）\n\nbody")
    .replace("## §6 验证与收口（父代理）", "## §6 验证与收口（父代理）\n\nbody")
  if (s3Body) src = src.replace("## §3 设计评审（评审子代理）", "## §3 设计评审（评审子代理）\n\n轮次 1 的发现与结论。")
  writeFileSync(recOf(root), src)
  return root
}
const review = (root) => batchTool(REC, { review: true })
const writeToolMap = new Map([["write", writeTool]])
const runWrite = async (agent, rel, extra = {}) => {
  const [res] = await executeToolCalls(agent, writeToolMap, [{ name: "write", id: "1", arguments: JSON.stringify({ path: rel, content: "x\n", ...extra }) }], {}, 0)
  return res
}

test("14-1 无裁定行的 §3 写不进去（R-G3）；存量无裁定块仍拒 append §5（R-G2b）；补一块携 VERDICT: pass ⇒ 放行", async () => {
  const root = await freshRecord("14-1")
  const coder = batchTool(REC)
  const ctx = { depth: 1, agent: { ...agentOf(root, { designSlot: false }), _role: "eng-coder", _batchDoc: REC } }
  await assert.rejects(() => coder.execute({ action: "append", segment: "§5", text: "先写实现" }, ctx), (e) => /§5 append refused/.test(e.message))
  // ① 工具写一笔无裁定行的 §3 ⇒ 当场拒（R-G3）：字节零改、轮次号不消耗（块数不变）
  const before = readFileSync(recOf(root), "utf8")
  const blocksOf = (s) => s.split("\n").filter((l) => /^### 轮次 \d+（评审子代理）/.test(l)).length
  await assert.rejects(
    () => review(root).execute({ action: "append", segment: "§3", text: "方案可行，另附两条补记。" }, { agent: agentOf(root) }),
    (e) => /§3 append refused/.test(e.message)
      && e.message.includes("VERDICT: pass") && e.message.includes("VERDICT: changes-required")
      && /no round number was consumed/.test(e.message),
  )
  const afterRefusal = readFileSync(recOf(root), "utf8")
  assert.equal(afterRefusal, before, "拒写：档字节逐字节不变")
  assert.equal(blocksOf(afterRefusal), blocksOf(before), "拒写：轮次块数不变（N 未消耗）")
  // ② 存量无裁定块（夹具直写、不经工具）⇒ `append §5` 仍拒（R-G2b：门所依赖的那个块自己没说结论）
  writeFileSync(
    recOf(root),
    afterRefusal
      .replace("## §3 设计评审（评审子代理）\n\n轮次 1 的发现与结论。",
        "## §3 设计评审（评审子代理）\n**状态行**：评审通过\n\n### 轮次 1（评审子代理）\n\n存量块：只有散文，没有裁定行。"),
  )
  assert.match(readFileSync(recOf(root), "utf8"), /\*\*状态行\*\*：评审通过/, "夹具：状态词已过判据 1")
  await assert.rejects(
    () => coder.execute({ action: "append", segment: "§5", text: "先写实现" }, ctx),
    (e) => /last §3 round block carries no pass verdict/.test(e.message) && /块内裁定 = 无裁定行/.test(e.message),
  )
  // ③ 末块携 pass 裁定 ⇒ 两判据同过，写入
  await review(root).execute({ action: "append", segment: "§3", text: "结论：通过。\n\nVERDICT: pass" }, { agent: agentOf(root) })
  assert.match(await coder.execute({ action: "append", segment: "§5", text: "实现落地" }, ctx), /appended/)
})

test("14-2 §3 非 pass ⇒ close 拒，回执含 `§3 状态行 =`；§1 状态行字节不变", async () => {
  const root = await freshRecord("14-2")
  const before = readFileSync(recOf(root), "utf8").match(/\*\*状态行\*\*：.*/)[0]
  await assert.rejects(
    () => parent.execute({ action: "close", path: recOf(root) }, ctx0(root)),
    (e) => /§3 状态行 = （无状态行），须 = 评审通过/.test(e.message),
  )
  assert.equal(readFileSync(recOf(root), "utf8").match(/\*\*状态行\*\*：.*/)[0], before, "§1 状态行字节不变")
})

test("14-3 换会话（槽内无归属）核销合格行 ⇒ 通过（③ 判档面）", async () => {
  const root = makeProject("14-3")
  writeFileSync(join(root, "docs/batches/done.md"), "# 已收口批\n\n## §1 讨论（主 agent）\n**状态行**：已收口 2026-10-26\n\n## §3 设计评审（评审子代理）\n**状态行**：评审通过\n")
  const id = ledgerAdd({ cwd: root, row: { kind: "tech_todo", title: "合格行", task_book: "docs/batches/done.md", trigger: "归批" }, boundary: root })
  ledgerUpdate({ cwd: root, id, patch: { status: "待设计" }, boundary: root })
  ledgerUpdate({ cwd: root, id, patch: { status: "在途" }, boundary: root })
  ledgerUpdate({ cwd: root, id, patch: { status: "待核销" }, boundary: root })
  // 真 `ledger` 工具入口；ctx 里没有任何槽 / designId（= 换了一个会话）
  const out = JSON.parse(await ledgerTool.execute({ action: "close", id, status: "已核销" }, { depth: 0, agent: { cwd: root, config: { agent: { engineering: true } } } }))
  assert.deepEqual(out, { id, status: "已核销" })
  assert.equal(rowsOf(root).find((r) => r.id === id).status, "已核销")
})

test("14-4 收口含 1 在途 + 1 待讨论 ⇒ 分别 待核销 / 条件，回执两行", async () => {
  const root = await freshRecord("14-4")
  await review(root).execute({ action: "status", value: "评审通过" }, { agent: agentOf(root) })
  const idle = ledgerAdd({ cwd: root, row: { kind: "tech_todo", title: "没做完" }, boundary: root })
  ledgerUpdate({ cwd: root, id: idle, patch: { task_book: REC }, boundary: root })
  const msg = await parent.execute({ action: "close", path: recOf(root) }, ctx0(root))
  const work = rowsOf(root).find((r) => r.task_book === REC && r.id !== idle)
  assert.equal(work.status, "待核销", "本批在途行 → 待核销")
  assert.equal(rowsOf(root).find((r) => r.id === idle).trigger, "条件", "没动的行 → 条件")
  const lines = msg.split("\n").filter((l) => l.startsWith("[ledger reanchor]"))
  assert.equal(lines.length, 3, "两行分列 + 一行兜底点名")
  assert.match(lines[0], /本批在途行 → 待核销 1 行/)
  assert.match(lines[1], /本批未动行 → 条件 1 行/)
})

test("14-5 兜底点名：汇总行只点名，建议句各贴其行", async () => {
  const root = await freshRecord("14-5")
  await review(root).execute({ action: "status", value: "评审通过" }, { agent: agentOf(root) })
  const idle = ledgerAdd({ cwd: root, row: { kind: "tech_todo", title: "没做完" }, boundary: root })
  ledgerUpdate({ cwd: root, id: idle, patch: { task_book: REC }, boundary: root })
  const msg = await parent.execute({ action: "close", path: recOf(root) }, ctx0(root))
  const work = rowsOf(root).find((r) => r.task_book === REC && r.id !== idle)
  const summary = msg.split("\n").find((l) => l.includes("由重锚默认推进"))
  assert.match(summary, new RegExp(`本批 2 行由重锚默认推进，父侧未显式处置：#${work.id}, #${idle}$`), "汇总行只点名")
  assert.doesNotMatch(summary, /做完的|没做完的/, "汇总行不给建议")
  const lines = msg.split("\n").filter((l) => l.startsWith("[ledger reanchor]"))
  assert.match(lines[0], /本批在途行 → 待核销 1 行：.*—— 认领行只有两种终局：做完的 close 勾销（待核销 → 已核销），判定不做的 update → 已废弃 并写判据（认领即承诺，没有第三种）$/, "认领行的建议贴在第一行")
  assert.match(lines[1], /本批未动行 → 条件 1 行：.*—— 这些行不是本批的活（未认领却被绑在本档 = 点火违规）；已落 trigger = 条件 \+ 复启句，由下一批接手，本批不再处置$/, "未认领行的建议贴在第二行")
})

test("14-6 收口后重开 ⇒ 行回 在途、回执点名 1 行；产品码写分辨在号（带号照写 ∥ 不带号拒）", async () => {
  const root = await freshRecord("14-6")
  await review(root).execute({ action: "status", value: "评审通过" }, { agent: agentOf(root) })
  await parent.execute({ action: "close", path: recOf(root) }, ctx0(root))
  const work = rowsOf(root).find((r) => r.task_book === REC)
  assert.equal(work.status, "待核销")
  const msg = await parent.execute({ action: "status", path: recOf(root), segment: "§1", value: "进行中", note: "同一件事继续做" }, ctx0(root))
  assert.match(msg, /\[ledger reopen\] 本批待核销行 → 在途 1 行/)
  assert.equal(rowsOf(root).find((r) => r.id === work.id).status, "在途")
  // 新判据（笔-账绑定）：行回 `在途` 只说明可带的号存在；写盘还得把号报出来
  const agent = agentOf(root, { designSlot: true })
  const noNumber = await runWrite(agent, "thincoder-core/agent/w.mjs")
  assert.equal(noNumber.ok, false, "不带号写产品码 ⇒ 拒（有在途行不再自动放行）")
  assert.match(noNumber.result, /no ledger number on this call/)
  const numbered = await runWrite(agent, "thincoder-core/agent/w.mjs", { ledger: `#${work.id}` })
  assert.equal(numbered.ok, true, `带重开那条在途号 ⇒ 产品码写照写 — ${numbered.result}`)
})

test("14-7 核销后重开 ⇒ 行零改、逐 id 点名；两种重开并存 ⇒ 两行回执各一行", async () => {
  const root = await freshRecord("14-7")
  // 行 A：待核销（收口后重开回收）；行 B：已核销（终态不回收）
  const a = ledgerAdd({ cwd: root, row: { kind: "tech_todo", title: "待结账", task_book: REC }, boundary: root })
  const b = ledgerAdd({ cwd: root, row: { kind: "tech_todo", title: "结过账", task_book: REC }, boundary: root })
  for (const id of [a, b]) {
    ledgerUpdate({ cwd: root, id, patch: { status: "待设计" }, boundary: root })
    ledgerUpdate({ cwd: root, id, patch: { status: "在途" }, boundary: root })
    ledgerUpdate({ cwd: root, id, patch: { status: "待核销" }, boundary: root })
  }
  // 让档面过核销机检（§1 已收口 + §3 评审通过），再把 B 真核销
  await review(root).execute({ action: "status", value: "评审通过" }, { agent: agentOf(root) })
  await parent.execute({ action: "close", path: recOf(root) }, ctx0(root))
  ledgerClose({ cwd: root, id: b, status: "已核销", boundary: root, agent: {} })
  // A 在收口重锚时已被推进到 待核销；再放回 待核销（幂等）——两态并存后重开
  const msg = await parent.execute({ action: "status", path: recOf(root), segment: "§1", value: "进行中", note: "继续" }, ctx0(root))
  const lines = msg.split("\n").filter((l) => l.startsWith("[ledger reopen]"))
  assert.equal(lines.length, 2, "两行回执各一行")
  assert.match(lines[0], new RegExp(`本批待核销行 → 在途 2 行：#1 「g」；#${a} 「待结账」`))
  assert.match(lines[1], new RegExp(`本批已核销行不可回收 1 行：#${b} 「结过账」——已核销为终态`))
  assert.equal(rowsOf(root).find((r) => r.id === a).status, "在途")
  assert.equal(rowsOf(root).find((r) => r.id === b).status, "已核销", "已核销行零改")
})

test("14-8 §3 已 pass 后同批打回 ⇒ 状态行重置、§5 拒；补一块携 pass 裁定的轮次块后放行", async () => {
  const root = await freshRecord("14-8")
  const coder = batchTool(REC)
  const ctx = { depth: 1, agent: { ...agentOf(root), _role: "eng-coder", _batchDoc: REC } }
  // 第 1 轮：评审真写一轮 pass（工具盖戳 `### 轮次 1`）⇒ 状态行 = 评审通过
  await review(root).execute({ action: "append", segment: "§3", text: "首选方案可行。\n\nVERDICT: pass" }, { agent: agentOf(root) })
  await review(root).execute({ action: "status", value: "评审通过" }, { agent: agentOf(root) })
  // 第 2 轮：同一批判 changes-required ⇒ 工具同笔重置状态行 + 本轮块首留痕
  await review(root).execute({ action: "append", segment: "§3", text: "复核发现一处缺陷。\n\nVERDICT: changes-required" }, { agent: agentOf(root) })
  const src = readFileSync(recOf(root), "utf8")
  const s3 = src.slice(src.indexOf("## §3"), src.indexOf("## §4"))
  assert.match(s3, /\*\*状态行\*\*：进行中（第 2 轮打回）/, "档面：§3 状态行字节（不经解析）")
  assert.match(s3, /> 状态行重置：第 2 轮打回（changes-required）· 上一轮状态行 = 评审通过 → 进行中 · \d{4}-\d{2}-\d{2}/, "重置留痕在档")
  // §5 拒面 = 门打印的解析词（不是带括注的整串），§5 字节不变
  await assert.rejects(
    () => coder.execute({ action: "append", segment: "§5", text: "先写实现" }, ctx),
    (e) => /§3 状态行 = 进行中，须 = 评审通过/.test(e.message),
  )
  assert.equal(readFileSync(recOf(root), "utf8"), src, "§5 拒后档字节不变")
  // 评审再 pass：判据 2 要末块自己携 pass 裁定 ⇒ `status` 单写不足以开 `§5`（末块仍是携 changes-required 的那一块）
  await review(root).execute({ action: "status", value: "评审通过" }, { agent: agentOf(root) })
  await assert.rejects(
    () => coder.execute({ action: "append", segment: "§5", text: "实现落地" }, ctx),
    (e) => /last §3 round block carries no pass verdict/.test(e.message) && /块内裁定 = VERDICT: changes-required/.test(e.message),
  )
  // 再 pass = 追加一块携 `VERDICT: pass` 的轮次块（块落进 §3 即可）⇒ 放行
  await review(root).execute({ action: "append", segment: "§3", text: "缺陷已修，结论改为通过。\n\nVERDICT: pass" }, { agent: agentOf(root) })
  assert.match(await coder.execute({ action: "append", segment: "§5", text: "实现落地" }, ctx), /appended/)
})
