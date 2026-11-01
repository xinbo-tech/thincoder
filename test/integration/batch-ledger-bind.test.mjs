/**
 * batch-ledger-bind.test.mjs — 集成用例 13-1 … 13-3（RTM CLI 端故事 13「建批档就有台账」）。
 *
 * 判据原文 = `test/RTM.md` 第 13 节；机制 = `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` §2.4。
 * **进入口 = 父侧 `batch` 工具**（create 的真实调用面）——断言的是**终态**（档在盘 + 行在途 + 档头真实 #N），
 * 事务内步序不进判据（§2.4 末条）。
 *
 * 复跑（cwd = 仓根）：`node --test test/integration/batch-ledger-bind.test.mjs`
 */
import { test, after } from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { batchTool } from "../../thincoder-core/agent-tools/batch.mjs"
const { _setLedgerDirForTest, _resetLedgerDirForTest, ledgerAdd, ledgerQuery } = await import("../../thincoder-core/ledger.mjs")

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..")
const SCRATCH = join(ROOT, ".thincoder/tmp")
const ledgerDir = mkdtempSync(join(SCRATCH, "bind-ledger-"))
_setLedgerDirForTest(ledgerDir)
const fixtures = []
after(() => {
  _resetLedgerDirForTest()
  for (const p of fixtures) rmSync(p, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 })
  rmSync(ledgerDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 })
})

function makeProject(tag) {
  mkdirSync(SCRATCH, { recursive: true })
  const root = mkdtempSync(join(SCRATCH, `bind-${tag}-`))
  fixtures.push(root)
  writeFileSync(join(root, "PROJECT-MANIFEST.json"), JSON.stringify({ version: 1, docRoot: { batches: "docs/batches" } }, null, 2))
  mkdirSync(join(root, "docs/batches"), { recursive: true })
  return root
}
const ctxOf = (root) => ({ depth: 0, agent: { cwd: root, config: { agent: { engineering: true } } } })
/** 收口用 ctx：`engineering: false` ⇒ 零设计凭证段（本例只断言理由引文行）。 */
const closeCtxOf = (root) => ({ depth: 0, agent: { cwd: root, config: { agent: { engineering: false } } } })
/** 补齐收口链（§2 / §3 / §4 / §6 各有内容 + §3 状态行 = 评审通过）—— 13-4 要跑真收口。 */
function fillChain(root, rel) {
  const abs = join(root, rel)
  const out = []
  for (const line of readFileSync(abs, "utf8").split("\n")) {
    const m = /^## §(\d)/.exec(line)
    if (!m) { out.push(line); continue }
    out.push(line, "", `集成夹具内容（§${m[1]}）。`, "")
    if (m[1] === "3") out.push("**状态行**：评审通过", "")
  }
  writeFileSync(abs, out.join("\n"))
}
const tool = batchTool(null)
const rowsOf = (root) => ledgerQuery({ cwd: root, boundary: root })
const headerOf = (root, rel) => readFileSync(join(root, rel), "utf8").split("\n").find((l) => l.startsWith("> 台账"))

test("13-1 不传 ledger 建一档 ⇒ 台账 +1 行 在途 · task_book = 该档 · 档头写真实 #N", async () => {
  const root = makeProject("13-1")
  assert.equal(rowsOf(root).length, 0)
  await tool.execute({ action: "create", path: "docs/batches/t.md", topic: "t", source: "集成夹具" }, ctxOf(root))
  const rows = rowsOf(root)
  assert.equal(rows.length, 1)
  assert.equal(rows[0].status, "在途")
  assert.equal(rows[0].task_book, "docs/batches/t.md")
  assert.equal(rows[0].trigger, "归批")
  assert.match(headerOf(root, "docs/batches/t.md"), new RegExp(`^> 台账 = #${rows[0].id}（`))
  assert.doesNotMatch(headerOf(root, "docs/batches/t.md"), /#<编号>/, "没有占位残留")
})

test("13-2 传 待讨论 号 ⇒ 该行 在途 + 指针回填（不新建行）", async () => {
  const root = makeProject("13-2")
  const id = ledgerAdd({ cwd: root, row: { kind: "tech_todo", title: "已排的活" }, boundary: root })
  await tool.execute({ action: "create", path: "docs/batches/u.md", topic: "u", source: "集成夹具", ledger: `#${id}` }, ctxOf(root))
  const rows = rowsOf(root)
  assert.equal(rows.length, 1)
  assert.equal(rows[0].id, id)
  assert.equal(rows[0].status, "在途")
  assert.equal(rows[0].task_book, "docs/batches/u.md")
})

test("13-3 传 已核销 号 ⇒ 拒，档零落盘、行零改", async () => {
  const root = makeProject("13-3")
  // 造一条已核销行（档面：§1 已收口 + §3 评审通过 ⇒ 机检过）
  writeFileSync(join(root, "docs/batches/old.md"), "# 老批\n\n## §1 讨论（主 agent）\n**状态行**：已收口 2026-10-26\n\n## §3 设计评审（评审子代理）\n**状态行**：评审通过\n")
  const id = ledgerAdd({ cwd: root, row: { kind: "tech_todo", title: "老账", task_book: "docs/batches/old.md", trigger: "归批" }, boundary: root })
  const { ledgerUpdate, ledgerClose } = await import("../../thincoder-core/ledger.mjs")
  ledgerUpdate({ cwd: root, id, patch: { status: "待设计" }, boundary: root })
  ledgerUpdate({ cwd: root, id, patch: { status: "在途" }, boundary: root })
  ledgerUpdate({ cwd: root, id, patch: { status: "待核销" }, boundary: root })
  ledgerClose({ cwd: root, id, status: "已核销", boundary: root, agent: {} })
  const before = rowsOf(root).find((r) => r.id === id)
  await assert.rejects(
    () => tool.execute({ action: "create", path: "docs/batches/new.md", topic: "new", source: "集成夹具", ledger: `#${id}` }, ctxOf(root)),
    (e) => /is 已核销 — an archived row cannot carry a new batch record/.test(e.message),
  )
  assert.equal(existsSync(join(root, "docs/batches/new.md")), false, "档零落盘")
  assert.deepEqual(rowsOf(root).find((r) => r.id === id), before, "行零改")
})

test("13-4 同面有未决行：省略 ledger ⇒ 拒并列该行（零写）；携 newDebt ⇒ 档落盘 + 理由入 evidence", async () => {
  const root = makeProject("13-4")
  const id = ledgerAdd({ cwd: root, row: { kind: "tech_todo", title: "池里的旧欠条", board: "core" }, boundary: root })
  const before = rowsOf(root)
  await assert.rejects(
    () => tool.execute({ action: "create", path: "docs/batches/v.md", topic: "v", source: "集成夹具", board: "core" }, ctxOf(root)),
    (e) => {
      assert.match(e.message, /^batch: 1 unsettled row\(s\) already exist on this face/)
      assert.ok(e.message.includes(`  #${id} 待讨论 池里的旧欠条`), "拒文列该行")
      return true
    },
  )
  assert.equal(existsSync(join(root, "docs/batches/v.md")), false, "批档零落盘")
  assert.deepEqual(rowsOf(root), before, "台账零行写入")
  await tool.execute({ action: "create", path: "docs/batches/v.md", topic: "v", source: "集成夹具", board: "core", newDebt: "这是另一件事" }, ctxOf(root))
  const created = rowsOf(root).find((r) => r.task_book === "docs/batches/v.md")
  assert.equal(created.evidence, "新事理由：这是另一件事", "理由入新行 evidence")
  assert.equal(created.status, "在途")
  // 理由读面：本批收口回执引一行（设计档 LEDGER.md §6.3「理由的读面与时点」）
  fillChain(root, "docs/batches/v.md")
  const receipt = await tool.execute({ action: "close", path: "docs/batches/v.md" }, closeCtxOf(root))
  assert.ok(receipt.includes(`  新事理由（#${created.id}）：这是另一件事`), "本批收口回执引该理由一行")
})
