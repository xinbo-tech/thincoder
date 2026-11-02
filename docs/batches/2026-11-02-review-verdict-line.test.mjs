/*
 * 2026-11-02-review-verdict-line.test.mjs — 本批单元验收（R1–R8；对应批档 §2「五、验收对照」）。
 *
 * 判据单源 = `thincoder-core/agent-tools/batch-skeleton.mjs` 的 `verdictGapOf` + 两条裁定锚；
 * 写入闸 = `thincoder-core/agent-tools/batch.mjs` 的 `appendBatchRecord`（段键 `n === 3`）；
 * 签发面映射 = `thincoder-core/agent-tools/design-token.mjs` 的 `verdictGateFailure`；
 * `§5` 门 = `thincoder-core/agent-tools/batch-closeout.mjs` 的 `assertSectionFiveGate`。
 *
 * 复跑（cwd = 仓根）：`node --test docs/batches/2026-11-02-review-verdict-line.test.mjs`
 * 本档随批档收口删除（单元用例零留存）。
 */
import { after, test } from "node:test"
import assert from "node:assert/strict"
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { batchTool } from "../../thincoder-core/agent-tools/batch.mjs"
import { verdictGateFailure } from "../../thincoder-core/agent-tools/design-token.mjs"
import { VERDICT_CHANGES_LINE, VERDICT_PASS_LINE, verdictGapOf } from "../../thincoder-core/agent-tools/batch-skeleton.mjs"
const { _setLedgerDirForTest, _resetLedgerDirForTest } = await import("../../thincoder-core/ledger.mjs")

const REPO = fileURLToPath(new URL("../../", import.meta.url))
const SCRATCH = join(REPO, ".thincoder/tmp")
const REC = "docs/batches/u.md"
const ledgerDir = mkdtempSync(join(SCRATCH, "verdict-line-ledger-"))
_setLedgerDirForTest(ledgerDir)
const fixtures = []
after(() => {
  _resetLedgerDirForTest()
  for (const p of fixtures) rmSync(p, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 })
  rmSync(ledgerDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 })
})

function makeProject(tag) {
  mkdirSync(SCRATCH, { recursive: true })
  const root = mkdtempSync(join(SCRATCH, `rvl-${tag}-`))
  fixtures.push(root)
  writeFileSync(join(root, "PROJECT-MANIFEST.json"), JSON.stringify({ version: 1, docRoot: { batches: "docs/batches" } }, null, 2))
  mkdirSync(join(root, "docs/batches"), { recursive: true })
  return root
}
const agentOf = (root) => ({ cwd: root, config: { agent: { engineering: true } } })
const ctx0 = (root) => ({ depth: 0, agent: agentOf(root) })
const parent = batchTool(null)
const review = (root) => batchTool(REC, { review: true })
const recOf = (root) => join(root, REC)
const readRec = (root) => readFileSync(recOf(root), "utf8")
const blocksOf = (src) => src.split("\n").filter((l) => /^### 轮次 \d+（评审子代理）/.test(l)).length
const s3Of = (src) => src.slice(src.indexOf("## §3"), src.indexOf("## §4"))

/** 建一档并填 §2 / §3 段体 / §4 / §6（§3 状态行与轮次块由各例处置）。 */
async function freshRecord(tag) {
  const root = makeProject(tag)
  await parent.execute({ action: "create", path: REC, topic: "u", source: "本批单测夹具" }, ctx0(root))
  const src = readRec(root)
    .replace("## §2 批次任务与设计（eng-designer）", "## §2 批次任务与设计（eng-designer）\n\nbody")
    .replace(/## §4 用户批准（[^）]*）/, "## §4 用户批准（主 agent）\n\nbody")
    .replace("## §6 验证与收口（父代理）", "## §6 验证与收口（父代理）\n\nbody")
    .replace("## §3 设计评审（评审子代理）", "## §3 设计评审（评审子代理）\n\n轮次 1 的发现与结论。")
  writeFileSync(recOf(root), src)
  return root
}
/** 把 §3 段级状态行预置成 `评审通过`（打回那笔「写前 = pass」的前置）。 */
async function withS3Passed(tag) {
  const root = await freshRecord(tag)
  await review(root).execute({ action: "status", value: "评审通过" }, { agent: agentOf(root) })
  assert.match(s3Of(readRec(root)), /\*\*状态行\*\*：评审通过/, `夹具 ${tag}：§3 写前 = 评审通过`)
  return root
}
/** 段键 `n === 5` 的实现席（`§5` 门要 eng-coder 身份 + 绑定）。 */
const coderCtx = (root) => ({ depth: 1, agent: { ...agentOf(root), _role: "eng-coder", _batchDoc: REC } })

// ────────────────────────────── R1 / R6 · 写时拒与拒文自明

test("R1 无裁定行的 §3 ⇒ 拒写（§3 append refused），档字节逐字节不变、轮次块数不变", async () => {
  const root = await freshRecord("r1")
  const before = readRec(root)
  await assert.rejects(
    () => review(root).execute({ action: "append", segment: "§3", text: "方案可行，另附两条补记。" }, { agent: agentOf(root) }),
    (e) => /§3 append refused/.test(e.message),
  )
  const after = readRec(root)
  assert.equal(after, before, "零字节落盘")
  assert.equal(blocksOf(after), blocksOf(before), "轮次号未消耗（块数不变）")
})

test("R6 拒文自明：两选一逐字形 ∥ 混形反例 ∥ 不消耗轮次号三句都在", async () => {
  const root = await freshRecord("r6")
  let msg = ""
  await assert.rejects(
    () => review(root).execute({ action: "append", segment: "§3", text: "无裁定的一笔。" }, { agent: agentOf(root) }),
    (e) => { msg = e.message; return true },
  )
  assert.ok(msg.includes("VERDICT: pass"), "给出第一选")
  assert.ok(msg.includes("VERDICT: changes-required"), "给出第二选")
  assert.match(msg, /no round number was consumed/, "点明轮次号不消耗")
  assert.ok(msg.includes("`**结论** = VERDICT: pass`"), "带混形反例")
})

// ────────────────────────────── R2 / R8 · 合法形放行与尾句号同判

test("R2 五个合法形各写入一笔、块数各 +1；打回两笔（写前 = 评审通过）同笔重置状态行", async () => {
  const passForms = ["VERDICT: pass", "结论：通过", "结论：通过。"]
  for (const [i, text] of passForms.entries()) {
    const root = await freshRecord(`r2p${i}`)
    const before = blocksOf(readRec(root))
    await review(root).execute({ action: "append", segment: "§3", text: `核过。\n\n${text}` }, { agent: agentOf(root) })
    const src = readRec(root)
    assert.equal(blocksOf(src), before + 1, `${text}：块数 +1`)
    assert.match(s3Of(src), /\*\*状态行\*\*：评审通过/, `${text}：置位成 评审通过`)
  }
  const changeForms = ["VERDICT: changes-required", "结论：不通过。"]
  for (const [i, text] of changeForms.entries()) {
    const root = await withS3Passed(`r2c${i}`)
    const before = blocksOf(readRec(root))
    await review(root).execute({ action: "append", segment: "§3", text: `复核发现一处缺陷。\n\n${text}` }, { agent: agentOf(root) })
    const src = readRec(root)
    assert.equal(blocksOf(src), before + 1, `${text}：块数 +1（判打回的一笔照写）`)
    assert.match(s3Of(src), /\*\*状态行\*\*：进行中（第 1 轮打回）/, `${text}：同笔重置状态行`)
  }
})

test("R8 两锚中文分支尾句号同判（四格）∥ 旁证两格皆不命中", () => {
  const cells = [
    ["结论：通过。", VERDICT_PASS_LINE, "pass"],
    ["VERDICT: 通过。", VERDICT_PASS_LINE, "pass"],
    ["结论：不通过。", VERDICT_CHANGES_LINE, "changes"],
    ["VERDICT: 不通过。", VERDICT_CHANGES_LINE, "changes"],
  ]
  for (const [input, anchor, side] of cells) assert.equal(anchor.test(input), true, `${input} 命中 ${side} 锚`)
  assert.equal(VERDICT_PASS_LINE.test("**结论** = VERDICT: pass"), false, "混合形仍不命中")
  assert.equal(VERDICT_PASS_LINE.test("结论：未通过。"), false, "未通过 不命中 pass 锚")
  assert.equal(VERDICT_CHANGES_LINE.test("我们未通过。"), false, "句中提及不命中打回锚")
  assert.equal(VERDICT_PASS_LINE.test("VERDICT: pass。"), false, "英文形不接受尾句号（与改前一致）")
})

test("R8 连带：verdictGapOf 四格与签发面映射（同携仍走 changes-required，对外词汇零改）", () => {
  assert.equal(verdictGapOf("结论：通过。"), null)
  assert.equal(verdictGapOf("方案可行，另附两条补记。"), "无裁定行")
  assert.equal(verdictGapOf("VERDICT: changes-required"), "VERDICT: changes-required")
  assert.equal(verdictGapOf("结论：通过。\n\nVERDICT: changes-required"), "两者同携")
  assert.equal(verdictGapOf(null), "无裁定行", "无文本即无裁定（fail-closed）")
  assert.equal(verdictGateFailure("结论：通过。"), null, "尾句号形此后也签得出凭证")
  assert.equal(verdictGateFailure("VERDICT: pass"), null)
  assert.equal(verdictGateFailure("无裁定"), "no-pass-line")
  assert.equal(verdictGateFailure("VERDICT: changes-required"), "changes-required")
  assert.equal(verdictGateFailure("VERDICT: pass\nVERDICT: changes-required"), "changes-required", "同携保住盘上行为")
})

// ────────────────────────────── R3 / R4 · 混形与两者同携

test("R3 混形（`**结论** = VERDICT: pass`，非独立整行）⇒ 拒，字节零改", async () => {
  const root = await freshRecord("r3")
  const before = readRec(root)
  await assert.rejects(
    () => review(root).execute({ action: "append", segment: "§3", text: "**结论** = VERDICT: pass" }, { agent: agentOf(root) }),
    (e) => /§3 append refused/.test(e.message),
  )
  assert.equal(readRec(root), before, "零字节落盘")
})

test("R4 一笔同携 pass 与打回两行 ⇒ 拒，拒文含 两者同携", async () => {
  const root = await freshRecord("r4")
  const before = readRec(root)
  await assert.rejects(
    () => review(root).execute({ action: "append", segment: "§3", text: "结论：通过。\n\nVERDICT: changes-required" }, { agent: agentOf(root) }),
    (e) => /§3 append refused/.test(e.message) && e.message.includes("两者同携"),
  )
  assert.equal(readRec(root), before, "零字节落盘")
})

// ────────────────────────────── R5 · 判据单源

test("R5 锚与组合序各只一份：`export const VERDICT_PASS_LINE` 全仓 1 命中；签发面零 `.test` 自写", () => {
  const SKIP = new Set(["node_modules", "dist", "build", "coverage", ".turbo", ".git"])
  const files = []
  const visit = (p) => {
    for (const e of readdirSync(p, { withFileTypes: true })) {
      if (SKIP.has(e.name)) continue
      const child = join(p, e.name)
      if (e.isDirectory()) visit(child)
      else if (e.name.endsWith(".mjs")) files.push(child)
    }
  }
  visit(join(REPO, "thincoder-core"))
  const exportHits = files.filter((f) => /export const VERDICT_PASS_LINE/.test(readFileSync(f, "utf8")))
  assert.equal(exportHits.length, 1, `锚只此一份：${exportHits.join(", ")}`)
  const issuing = readFileSync(join(REPO, "thincoder-core/agent-tools/design-token.mjs"), "utf8")
  assert.equal(/VERDICT_CHANGES_LINE\.test|VERDICT_PASS_LINE\.test/.test(issuing), false, "签发面不自写组合序")
})

test("R5 取证形：同携正文在两道上给出同一格（§3 闸 ∥ §5 门括注）", async () => {
  const SAME = "结论：通过。\n\nVERDICT: changes-required"
  const a = await freshRecord("r5a")
  let fromSection3 = ""
  await assert.rejects(
    () => review(a).execute({ action: "append", segment: "§3", text: SAME }, { agent: agentOf(a) }),
    (e) => { fromSection3 = e.message; return true },
  )
  assert.ok(fromSection3.includes("两者同携"), "§3 闸拒文载该格")
  // 同一正文写成 §3 末块（夹具直写、不经工具——存量块的形），§3 状态行 = 评审通过 ⇒ 走到 §5 门判据 2
  const b = await freshRecord("r5b")
  writeFileSync(recOf(b), readRec(b).replace(
    "## §3 设计评审（评审子代理）\n\n轮次 1 的发现与结论。",
    "## §3 设计评审（评审子代理）\n**状态行**：评审通过\n\n### 轮次 1（评审子代理）\n\n" + SAME.split("\n\n").join("\n"),
  ))
  let fromSection5 = ""
  await assert.rejects(
    () => batchTool(REC).execute({ action: "append", segment: "§5", text: "先写实现" }, coderCtx(b)),
    (e) => { fromSection5 = e.message; return true },
  )
  assert.match(fromSection5, /块内裁定 = 两者同携/, "§5 门括注同值（两处同读一个函数）")
})

// ────────────────────────────── R7 · 三笔既有写入不受本闸影响

test("R7 eng-designer §2 ∥ eng-coder §5 ∥ depth-0 §1 三笔写入照写（段键闸只管 §3）", async () => {
  const root = await freshRecord("r7")
  await parent.execute(
    { action: "append", segment: "§1", text: "> 不适用：§3 —— 本笔单测不跑设计评审（普通模式口径）" },
    ctx0(root),
  )
  const designer = { depth: 1, agent: { ...agentOf(root), _role: "eng-designer", _batchDoc: REC } }
  assert.match(await batchTool(REC).execute({ action: "append", segment: "§2", text: "定稿一段。" }, designer), /appended/)
  assert.match(await batchTool(REC).execute({ action: "append", segment: "§5", text: "实现落地。" }, coderCtx(root)), /appended/)
  assert.equal(blocksOf(readRec(root)), 0, "这三笔都不落轮次块")
})
