/**
 * batch-live-batch-lock.test.mjs — 集成用例 12-1 … 12-6（RTM CLI 端故事 12「无活批档不许改产品代码」）。
 *
 * 判据原文 = `test/RTM.md` 第 12 节；机制 = `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md` §2.2 / §2.3 /
 * §2.10 / §2.12。**进入口 = 父侧工具面**（`write` / `batch` 走 `executeToolCalls` 的 Phase 1 真门——不直调
 * `productCodeWriteConflict`）：本档要的是「写这件事」的业务可观察结果（拒 ∥ 写入、文件字节、回执原文）。
 *
 * 夹具 = 仓内 `.thincoder/tmp`（在 `declarationForTarget` 的会话界内）；台账库经 `_setLedgerDirForTest`
 * 导向临时目录（不碰真实用户数据目录）。正常写路径要过两道门：设计门（活设计槽）⇒ 写锁（活批档）——
 * 用例按 §2.3 两态表分别造态。
 * 复跑（cwd = 仓根）：`node --test test/integration/batch-live-batch-lock.test.mjs`
 */
import { test, after } from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { executeToolCalls } from "../../thincoder-core/agent/dispatch.mjs"
import { writeTool } from "../../thincoder-core/tools/file.mjs"
import { grepTool } from "../../thincoder-core/tools/search.mjs"
import { batchTool } from "../../thincoder-core/agent-tools/batch.mjs"
const { _setLedgerDirForTest, _resetLedgerDirForTest, ledgerKey, ledgerQuery } = await import("../../thincoder-core/ledger.mjs")

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..")
const SCRATCH = join(ROOT, ".thincoder/tmp")
const ledgerDir = mkdtempSync(join(SCRATCH, "lock-ledger-"))
_setLedgerDirForTest(ledgerDir)
const fixtures = []
after(() => {
  _resetLedgerDirForTest()
  for (const p of fixtures) rmSync(p, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 })
  rmSync(ledgerDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 })
})

const UUID = "11111111-1111-1111-1111-111111111111"
/** 夹具项目：`docRoot.batches` + 产品 / 工具 / 产物四类目录骨架。 */
function makeProject(tag) {
  mkdirSync(SCRATCH, { recursive: true })
  const root = mkdtempSync(join(SCRATCH, `lk-${tag}-`))
  fixtures.push(root)
  writeFileSync(join(root, "PROJECT-MANIFEST.json"), JSON.stringify({ version: 1, docRoot: { batches: "docs/batches" } }, null, 2))
  for (const d of ["docs/batches", "scripts", "thincoder-core/agent", "thincoder-vscode/test", "thincoder-cli/dist", "test/integration", "node_modules/pkg", "vendor", "dist"]) {
    mkdirSync(join(root, d), { recursive: true })
  }
  return root
}
/** depth-0 父侧 agent（`designSlot` = 造/不造活设计槽——§2.3 两态表的两态）。 */
function agentOf(root, { designSlot = true } = {}) {
  const agent = { cwd: root, planMode: false, autoApprove: true, config: { agent: { engineering: true } } }
  if (designSlot) agent._engDesignTokens = new Map([["fx1", `${UUID}:${Date.now() + 3600_000}`]])
  return agent
}
const toolMap = new Map([["write", writeTool]])
async function write(agent, path, content = "x\n") {
  const [res] = await executeToolCalls(agent, toolMap, [{ name: "write", id: "1", arguments: JSON.stringify({ path, content }) }], {}, 0)
  return res
}
const openBatch = (root, name, extra = {}) => batchTool(null).execute({ action: "create", path: `docs/batches/${name}.md`, topic: name, source: "集成夹具", ...extra }, { depth: 0, agent: agentOf(root) })

test("12-1 无活批档写产品码 ⇒ 拒（§2.3 串），文件零改", async () => {
  const root = makeProject("12-1")
  const target = join(root, "thincoder-core/agent/x.mjs")
  const res = await write(agentOf(root), target)
  assert.equal(res.ok, false)
  assert.match(res.result, /write refused — no live batch record: a product-code write needs a live batch/)
  assert.equal(existsSync(target), false, "文件零改")
})

test("12-2 文档面 .md 与仓根 scripts/*.mjs ⇒ 照写（同一会话、无活批档）", async () => {
  const root = makeProject("12-2")
  const agent = agentOf(root, { designSlot: false }) // 连设计槽都不给：这两类面两道门都不拦
  const doc = join(root, "docs/notes.md")
  const script = join(root, "scripts/tool.mjs")
  assert.equal((await write(agent, doc, "# note\n")).ok, true)
  assert.equal((await write(agent, script, "export {}\n")).ok, true)
  assert.equal(readFileSync(doc, "utf8"), "# note\n")
  assert.equal(readFileSync(script, "utf8"), "export {}\n")
})

test("12-3 两个活批档并存 ⇒ 产品码照写（锁只问存在否）", async () => {
  const root = makeProject("12-3")
  await openBatch(root, "a")
  // 第二本 = 同面（无板面）已有未决行 ⇒ 按开批同面判要么接手、要么声明新事——本例刻意要两本并存
  await openBatch(root, "b", { newDebt: "并存两批的夹具：第二本与第一本各自独立" })
  assert.equal(ledgerQuery({ cwd: root, boundary: root }).filter((r) => r.status === "在途").length, 2)
  const agent = agentOf(root)
  const target = join(root, "thincoder-core/agent/y.mjs")
  assert.equal((await write(agent, target)).ok, true)
  assert.equal(existsSync(target), true)
})

test("12-4 台账库不可读 ⇒ 拒，拒文带原始错误", async () => {
  const root = makeProject("12-4")
  mkdirSync(join(ledgerDir, `${ledgerKey(root)}.db`), { recursive: true }) // 库位是目录 ⇒ 打不开
  const res = await write(agentOf(root), join(root, "thincoder-core/agent/z.mjs"))
  assert.equal(res.ok, false)
  assert.match(res.result, /no live batch record/)
  assert.match(res.result, /ledger unreadable — 台账库打开失败/)
})

test("12-5 产品测试面拦 · 产物目录与仓根集成测试放行（BUILD_ARTIFACTS / 工具面）", async () => {
  const root = makeProject("12-5")
  const agent = agentOf(root, { designSlot: true })
  const testFile = join(root, "thincoder-vscode/test/x.test.mjs")
  const res = await write(agent, testFile)
  assert.equal(res.ok, false)
  assert.match(res.result, /a product test file needs a live batch too/)
  assert.equal(existsSync(testFile), false)
  for (const rel of ["node_modules/pkg/x.mjs", "thincoder-cli/dist/out.mjs", "test/integration/x.test.mjs"]) {
    assert.equal((await write(agent, join(root, rel))).ok, true, rel)
  }
})

test("12-6 搜索 / 索引面接名单单源：vendor · node_modules · dist 内的文件不再命中", async () => {
  const root = makeProject("12-6")
  const marker = "NEEDLE_MARKER_X9"
  writeFileSync(join(root, "vendor/needle.mjs"), `// ${marker}\n`)
  writeFileSync(join(root, "node_modules/pkg/needle.mjs"), `// ${marker}\n`)
  writeFileSync(join(root, "dist/needle.mjs"), `// ${marker}\n`)
  const ctx = { agent: { cwd: root }, cwd: root }
  const pruned = await grepTool.execute({ pattern: marker, path: root }, ctx)
  assert.equal(pruned, "(no matches)", "名单合并后 vendor / node_modules / dist 都被剪")
  writeFileSync(join(root, "visible.txt"), `${marker}\n`) // 对照面：普通文件照常可搜
  const hit = await grepTool.execute({ pattern: marker, path: root }, ctx)
  assert.match(hit, /visible\.txt/)
  assert.doesNotMatch(hit, /needle\.mjs/)
})
