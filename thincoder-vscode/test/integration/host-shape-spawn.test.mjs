/**
 * host-shape-spawn.test.mjs — 生产宿主形状 spawn 回归（批次 `2026-09-15-vsc-agent-tools-spawn-fix` §2.2）。
 *
 * 缺陷本体：VSC 宿主 agent 工厂从未提供 `agent.tools`（W13 换核后核 spawn 读 `parent.tools`）
 * ⇒ 子代理装配即崩（`agent.tools is not iterable`）。本档驱动面 = **生产宿主形状**：
 * `hydrateRun(buildTopLevelAgent(), …)` 产物作父对象——**零手写 tools 字段**（修复行移除即红 =
 * 测试有效性机判面；原夹具 `tools: []` 手工补丁已被根因证明是遮蔽源——§1.4）。
 *
 * 用例（两条崩点分支各面）：
 *   T1 explore（结构）——只读过滤分支（修复前更早一步崩：`readonlyToolNames` → `filter`）；
 *   T2 coder（结构）——非只读分支直传（同一引用）；
 *   T3 eng-designer（结构）——工程装配 + batchDoc 绑定（用户实测角色同支）；
 *   T4 coder（行为）——真跑 sync spawn（用户报错路径：非只读分支子代装配展开 `[...agent.tools]`）。
 * 门族调用形态 = `gateEngCoderSpawn` + `buildSpawnChild`（真门序 + 真装配，零网络——
 * 承 `test/eng-designer-role.test.mjs` buildProbe 先例）。
 */
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { _setConfigPathForTest } from "@thincoder/core/config.mjs"
import { subagentTool } from "@thincoder/core/agent-tools/subagent.mjs"
import { buildSpawnChild } from "@thincoder/core/agent-tools/subagent-spawn.mjs"
import { gateEngCoderSpawn } from "@thincoder/core/agent/spawn-child.mjs"
import { buildTopLevelAgent, hydrateRun } from "../../src/agent/setup.mjs"
import { mockLLM, providerFor } from "./helpers/mock-llm.mjs"

let work
let cfgDir
let llm
let provider

/** 子代理报告（mock 末步——≥ MIN_REPORT_CHARS 免续写扩写轮；scenario-02 同款重复句形态）。 */
const CHILD_REPORT =
  "Subagent report (mock): host-shape spawn verified — the child assembled against the production parent tool table.".repeat(4)

before(async () => {
  work = mkdtempSync(join(tmpdir(), "tc-host-shape-"))
  cfgDir = mkdtempSync(join(tmpdir(), "tc-host-shape-cfg-"))
  const cfgPath = join(cfgDir, "config.json")
  writeFileSync(cfgPath, JSON.stringify({ providers: [] }) + "\n", "utf8")
  _setConfigPathForTest(cfgPath)
  // batchDoc 门要求可读路径（真文件）
  mkdirSync(join(work, "docs", "batches"), { recursive: true })
  writeFileSync(join(work, "docs", "batches", "2026-09-15-demo.md"), "# 批次档\n\n## §1 讨论\n\n## §2 批次任务\n", "utf8")
  llm = await mockLLM([{ content: CHILD_REPORT }])
  provider = providerFor(llm)
})
after(async () => {
  _setConfigPathForTest(null)
  await llm?.close()
  rmSync(work, { recursive: true, force: true })
  rmSync(cfgDir, { recursive: true, force: true })
})

/** 生产宿主形状父对象：`hydrateRun(buildTopLevelAgent(), …)` 产物 + 调用期载体照搬。
 *  载体两处 = 生产面同款（非修复面——测试无法驱全 runAgent）：① `agent.provider`
 *  （agent.mjs 调用期回填同款——核 `resolveChildProvider` / `resolveAdvisorProvider` 读
 *  `parent.provider`）；② async 池两字段（原 scenario-02 夹具同款载体行）。零手写 `tools`。 */
async function hostParent({ engineering = false } = {}) {
  const run = await hydrateRun(buildTopLevelAgent(), {
    provider, cwd: work, input: "parent turn (production host shape)", depth: 0, role: null,
    getAuto: () => false,
    opts: engineering ? { engState: { enabled: true } } : {},
  })
  const agent = run.agent
  agent.provider = provider
  agent._asyncSubagents = new Map()
  agent._asyncQueue = []
  return agent
}

/** spawn 缝（scenario-02 同款 ctx 形态——真核 spawn 链）。 */
const spawnCtx = (agent) => ({
  agent, cwd: work, depth: 0,
  callbacks: { onSubagent: () => {}, onToolPanel: () => {} },
  getAuto: () => false,
})

/** 装配探针：真门序（`gateEngCoderSpawn`——depth-0 恒 null、不加限制）+ 真装配（`buildSpawnChild`）。 */
function buildProbe(parent, args, role) {
  const attempt = gateEngCoderSpawn(parent, parent._depth, role, args.async === true)
  return buildSpawnChild(parent, spawnCtx(parent), args, role, args.async === true, [], [], attempt)
}

test("T1 explore（结构）：生产形状父表非空；只读过滤分支产出独立数组", async () => {
  const parent = await hostParent()
  assert.ok(
    Array.isArray(parent.tools) && parent.tools.length > 0,
    "生产宿主形状父对象持有非空工具表（hydrateRun 每轮绑定 agent.tools——修复点本体）",
  )
  const built = buildProbe(parent, { task: "勘察现状", role: "explore", async: false }, "explore")
  assert.ok(Array.isArray(built.child.tools) && built.child.tools.length > 0, "explore 子代工具表非空（过滤后仍持只读面）")
  assert.notEqual(built.child.tools, parent.tools, "只读过滤生效——子代表为新数组（非父表直传）")
})

test("T2 coder（结构）：非只读分支直传父表（同一引用）", async () => {
  const parent = await hostParent()
  const built = buildProbe(parent, { task: "实现小功能", role: "coder", async: false }, "coder")
  assert.ok(Array.isArray(built.child.tools) && built.child.tools.length > 0, "coder 子代工具表非空")
  assert.equal(built.child.tools, parent.tools, "非只读分支 = 父表直传（同一引用）")
})

test("T3 eng-designer（结构——用户实测角色同支）：工程装配 + batchDoc 绑定", async () => {
  const parent = await hostParent({ engineering: true })
  assert.equal(parent.config.agent.engineering, true, "工程模式父（engState 水合落 config）")
  const built = buildProbe(
    parent,
    { task: "写批次 §2", role: "eng-designer", batchDoc: "docs/batches/2026-09-15-demo.md", async: false },
    "eng-designer",
  )
  assert.ok(Array.isArray(built.child.tools) && built.child.tools.length > 0, "eng-designer 子代工具表非空")
  assert.equal(built.child._batchDoc, join(work, "docs", "batches", "2026-09-15-demo.md"), "批次档绑定 = 绝对路径（装配已过门）")
})

test("T4 coder（行为——用户报错路径）：真跑 sync spawn 正常返回报告", async () => {
  const parent = await hostParent()
  const calls0 = llm.calls
  // 修复前：非只读分支 = 父表直传 → 子代装配展开 `[...agent.tools]` 崩（用户所见逐字报错）
  const report = await subagentTool.execute({ task: "实现小功能", role: "coder", async: false }, spawnCtx(parent))
  assert.ok(llm.calls > calls0, "真子运行触达 mock provider（llm.calls ≥ 1）")
  assert.match(String(report), /host-shape spawn verified/, "子代报告返回（修复前：spawn 抛 agent.tools is not iterable）")
})
