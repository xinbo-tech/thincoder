/*
 * batch-edit-spec-section.test.mjs — 集成用例 7-10（RTM CLI 端故事 7「收口只判本批改过的档」；
 * 回指 = 设计档 §4.19「规范段就地改」∥ §4.8 BR-77 · BR-78 ∥ 台账 `#1990`）。
 *
 * 业务入口 = 真 `batch` 工具的设计席 `edit` 通道（`batchTool(batchDoc)` + eng-designer 身份）——
 * 不直调内部区间函数。它答的业务问题：**在飞批档 §2 上一条已作废的判据，能就地换掉吗**
 * （本批起因 = `docs/batches/2026-11-02-review-requires-batch.md` §2 验收表留着已作废判据，
 * 实施席照表落笔会把已删的分支原样写回来）。
 *
 * 断言只看业务可观察结果：§2 里那一行被换掉、其余行逐字节不变；锚不唯一 ⇒ 拒，且档字节一字不动。
 * 复跑（cwd = 仓根）：`node --test test/integration/batch-edit-spec-section.test.mjs`
 */
import { after, test } from "node:test"
import assert from "node:assert/strict"
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { batchTool } from "../../thincoder-core/agent-tools/batch.mjs"
import { batchSkeleton } from "../../thincoder-core/agent-tools/batch-skeleton.mjs"

const BATCH_REL = "docs/batches/fixture.md"
const OBSOLETE = "A11 四档六处旧说法清零（本行已裁定作废——旧说法已不存在）"
const REPLACEMENT = "A11 判据已并入 §2.3（单源 = design §4.4）"

const projects = []
after(() => {
  for (const p of projects) rmSync(p, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 })
})

/** 在飞批档夹具：项目声明 + 骨架原形批档 + 一段带「已作废判据」的 §2 段体。 */
function fixture(tag) {
  const root = mkdtempSync(join(tmpdir(), `bess-${tag}-`))
  projects.push(root)
  writeFileSync(join(root, "PROJECT-MANIFEST.json"), JSON.stringify({ version: 1, docRoot: { batches: "docs/batches" } }, null, 2))
  mkdirSync(join(root, "docs/batches"), { recursive: true })
  const record = batchSkeleton({ date: "2026-11-02", topic: "fixture", source: "集成夹具", prev: "无（独立批）", ledger: "#1990", board: "core" })
    .replace("<§2 模板占位：本批条目（覆盖） / 设计档落点 / 机制设计 / 受影响文件与测试覆盖 / 验收对照 / 关键决策 / 上抛项>",
      `验收 A10：四档六处旧说法清零。\n${OBSOLETE}\n验收 A12：收口对账两半跑过。`)
  writeFileSync(join(root, BATCH_REL), record)
  // eng-designer：写 §2 的唯一身份（工程模式）——目标档 = spawn 绑定，无路径参数
  const agent = { cwd: root, _role: "eng-designer", _batchDoc: BATCH_REL, config: { agent: { engineering: true } } }
  return { root, ctx: { depth: 1, agent } }
}

const readRecord = (root) => readFileSync(join(root, BATCH_REL), "utf8")

test("7-10 正常 · 设计席把 §2 里一行已作废的判据就地换掉 ⇒ 该行被换、其余行逐字节不变", async () => {
  const { root, ctx } = fixture("ok")
  const before = readRecord(root)
  assert.ok(before.includes(OBSOLETE), "前置：作废判据那一行在 §2 段体里")

  const receipt = await batchTool(BATCH_REL).execute(
    { action: "edit", segment: "§2", oldText: OBSOLETE, newText: REPLACEMENT },
    ctx,
  )
  const after = readRecord(root)

  // ① 回执：点名替换字符数 + 机检门已判（§4.19 回执形 ∥ 门挂在 edit 面）
  assert.match(receipt, /^batch: edited §2 of the batch record — replaced \d+ characters with \d+\./, `回执形 — ${receipt}`)
  assert.match(receipt, /\[doc-check gate\] DOC-CHECK GATE: PASS/, `门回执 — ${receipt}`)

  // ② 业务结果：那一行没了、新行在、其余行逐字节不变（旧行不残留 → 不留「两种读法」）
  assert.equal(after.includes(OBSOLETE), false, "作废判据退场（整行删掉，不留「以本节为准」指针）")
  assert.ok(after.includes(REPLACEMENT), "新判据落位")
  const b = before.split("\n")
  const a = after.split("\n")
  assert.equal(a.length, b.length, "行数不变")
  const changed = b.map((line, i) => (line === a[i] ? null : i)).filter((i) => i !== null)
  assert.deepEqual(changed.length, 1, `只有目标行变，其余行逐字节不变（变动行 = ${changed.map((i) => i + 1)}）`)
  assert.equal(a[changed[0]], REPLACEMENT)
})

test("7-10 错误 · 同一句在 §2 段体出现两处 ⇒ 锚不唯一，拒且档字节一字不动", async () => {
  const { root, ctx } = fixture("dup")
  const withDup = readRecord(root).replace(`验收 A12：收口对账两半跑过。`, `验收 A12：收口对账两半跑过。\n${OBSOLETE}`)
  writeFileSync(join(root, BATCH_REL), withDup)
  const before = readRecord(root)

  let message = null
  try {
    await batchTool(BATCH_REL).execute({ action: "edit", segment: "§2", oldText: OBSOLETE, newText: REPLACEMENT }, ctx)
  } catch (e) {
    message = e.message
  }
  assert.ok(message, "锚不唯一必须当场拒（放行会连另一处一起删）")
  assert.match(message, /not unique — it matches 2 places inside §2 \(lines \d+, \d+\)/, `拒串点名命中行号 — ${message}`)
  assert.equal(readRecord(root), before, "零字节落盘：档与调用前逐字相同")
})
