/**
 * batchdoc-reuse-guard.test.mjs — 集成用例 20-1（RTM CLI 端故事 20「一本批档只服务一个并发 spawn」）。
 *
 * 判据原文 = `test/RTM.md` 第 20 节；机制 = `docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.58
 * （判据 §6.58.1 · 拒因文案 §6.58.2 · 集成行设计 §6.58.8）。
 * **进入口 = 父侧工具面**（`subagent` 走 `executeToolCalls` 的真门——不直调 `buildSpawnChild`）：
 * 本档要的是「派第二席这件事」的业务可观察结果（第二席被拒、拒文点名、池面不变）。
 *
 * 交互组件 = spawn 门（`buildSpawnChild`）⟷ 异步池在飞表（`getAsyncPool`）⟷ 第二席的返回。
 * 夹具 = 仓内 `.thincoder/tmp`（零落仓）+ 档尾 `after()` 统一清。
 * 复跑（cwd = 仓根）：`node --test test/integration/batchdoc-reuse-guard.test.mjs`
 */
import { test, after } from "node:test"
import assert from "node:assert/strict"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { executeToolCalls } from "../../thincoder-core/agent/dispatch.mjs"
import { subagentTool } from "../../thincoder-core/agent-tools/subagent.mjs"

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..")
const SCRATCH = join(ROOT, ".thincoder/tmp")
mkdirSync(SCRATCH, { recursive: true })
const fixtures = []
after(() => {
  for (const p of fixtures) rmSync(p, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 })
})

/** 夹具项目：声明 `docRoot.batches` + 一本真实在盘的批档。 */
function makeProject(tag) {
  const root = mkdtempSync(join(SCRATCH, `bg-${tag}-`))
  fixtures.push(root)
  mkdirSync(join(root, "docs/batches"), { recursive: true })
  writeFileSync(join(root, "PROJECT-MANIFEST.json"), JSON.stringify({ version: 1, docRoot: { batches: "docs/batches" } }, null, 2))
  const recordRel = "docs/batches/live.md"
  writeFileSync(join(root, recordRel), "# live\n\n## §2 批次任务与设计\n\n占位。\n")
  return { root, recordRel, recordAbs: join(root, recordRel) }
}

/** depth-0 工程模式父面；池 = 真池容器（`getAsyncPool(parent, "subagent")` 读它）。 */
const parentOf = (root, entries = []) => ({
  provider: { name: "guard-fixture", model: "guard-fixture" },
  tools: [],
  config: { agent: { engineering: true } },
  cwd: root,
  memory: null,
  autoApprove: true,
  planMode: false,
  _role: null,
  _touchedFiles: [],
  _subAgentCounter: 0,
  _asyncSubagents: new Map(entries.map((e) => [String(e.id), e])),
})

/** 第一席（在飞）的池条目——形状取 `subagent-run.mjs:66-99` 的条目字面量里本判据读的那几格。 */
const firstSeat = (abs) => ({
  id: 1, role: "eng-designer", status: "running", done: false, cancelled: false, _batchDoc: abs,
})

test("20-1 工程模式父侧并发派两席共一本批档 ⇒ 第二席被拒，点名档与占用者；池面不变", async () => {
  const { root, recordRel, recordAbs } = makeProject("20-1")
  const parent = parentOf(root, [firstSeat(recordAbs)])
  const firstSeatBefore = { ...parent._asyncSubagents.get("1") }

  // 第二席：父侧真派单入口（工具面）——同一本批档
  const [res] = await executeToolCalls(
    parent,
    new Map([["subagent", subagentTool]]),
    [{ name: "subagent", id: "call_20-1", arguments: JSON.stringify({ role: "eng-designer", round: "initial", batchDoc: recordRel }) }],
    {},
    0,
  )

  // ① 第二席被拒（业务可观察结果 = 派单没成立）
  assert.equal(res.ok, false, "第二席必须被拒，不是被接受")
  // ② 拒文点名本批档路径 + 占用者 `role#id` + 其 status
  assert.match(res.result, /batchDoc is already in flight — spawn refused/)
  assert.ok(res.result.includes(recordAbs), `拒文须点名本批档绝对路径：${recordAbs}`)
  assert.ok(res.result.includes("eng-designer#1"), "拒文须点名占用者 role#id")
  assert.match(res.result, /\(status: running\)/)
  // ③ 给可执行下一步：等其 settle ∥ cancel 它
  assert.ok(res.result.includes("wait for eng-designer#1 to settle, or cancel it"), "拒文须给可执行下一步")

  // ④ 档上只有一套写者：第二席没入池、没入队，第一席条目零改
  assert.deepEqual([...parent._asyncSubagents.keys()], ["1"], "池内仍只有第一席")
  assert.deepEqual(parent._asyncSubagents.get("1"), firstSeatBefore, "第一席条目不因第二席被拒而变")
  assert.equal((parent._asyncQueue ?? []).length, 0, "第二席不入队（拒绝，不排队）")
})
