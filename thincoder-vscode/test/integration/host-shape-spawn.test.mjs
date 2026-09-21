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
 *   T4 coder（行为）——真跑 sync spawn + 断言 A（工具名唯一性——本批 L1）；
 *   T5 eng-designer（行为 + 断言 A/B）——真跑（用户实测角色）+ 断言 A（工具名唯一）+
 *     断言 B（矩阵同源：5 角色 fixture——depth-0 默认 / eng-designer / eng-coder / coder / explore）。
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
import { settingsTool as coreSettingsTool } from "@thincoder/core/agent-tools/settings.mjs"
import { buildSpawnChild } from "@thincoder/core/agent-tools/subagent-spawn.mjs"
import { gateEngCoderSpawn } from "@thincoder/core/agent/spawn-child.mjs"
import { assembleFamilyTools } from "@thincoder/core/agent/family-tools.mjs"
import { buildTopLevelAgent, hydrateRun, vscSubagentFace } from "../../src/agent/setup.mjs"
import { loadConsultPool } from "../../src/extension/presets.mjs"
import { mockLLM, providerFor } from "./helpers/mock-llm.mjs"
import { ENG_TASK_BOOK_MIN } from "@thincoder/core/agent-tools/spawn-gates.mjs"

let work
let cfgDir
let llm
let provider

/** 子代理报告（mock 末步——≥ MIN_REPORT_CHARS 免续写扩写轮；scenario-02 同款重复句形态）。 */
const CHILD_REPORT =
  "Subagent report (mock): host-shape spawn verified — the child assembled against the production parent tool table.".repeat(4)

before(async () => {
  work = mkdtempSync(join(tmpdir(), "tc-host-shape-"))
  mkdirSync(join(work, ".git"), { recursive: true }) // 项目根判据（.git 仓根——2026-09-17）
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
  // Windows 临时区句柄滞后（并行档位下的瞬时空占——2026-09-16 实施轮实测间歇 EPERM，见该批 §5）：
  // 重试 + 兜底——teardown 抖动不得把测试变红；残留仅落在 OS 临时区。
  for (const d of [work, cfgDir]) {
    try { rmSync(d, { recursive: true, force: true, maxRetries: 10, retryDelay: 50 }) } catch { /* OS temp — best effort */ }
  }
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

const BATCH = "docs/batches/2026-09-15-demo.md"

/** 断言 A（L1——工具名唯一性，§2.5）：mock 收到的本用例**新增**请求，`body.tools` 名数组无重名。
 *  起点 = spawn 前的 `llm.calls`（父级 hydrateRun 不触达 provider）；重名即真 provider 逐字
 *  400 `Tool names must be unique.`——本批缺陷本体的机械复现面。 */
function assertToolNamesUnique(llm, from) {
  const fresh = llm.requests.slice(from)
  assert.ok(fresh.length > 0, "断言范围非空：spawn 已触达 provider（零请求 ⇒ 断言无意义）")
  for (const r of fresh) {
    const names = (r.body?.tools ?? []).map((t) => t?.function?.name)
    const dup = [...new Set(names.filter((n, i) => names.indexOf(n) !== i))]
    assert.deepEqual(dup, [], `provider 请求工具名唯一（实测重名集 = ${JSON.stringify(dup)} ⇒ provider 逐字 400 Tool names must be unique.）`)
  }
}

/** 断言 B (a) 读数（§2.5）：家族段名集 = 全表（`toolByName`）− 基础集（`agent.tools`——L1 后 = baseSet）。 */
function familyNames(run) {
  const base = new Set(run.agent.tools.map((t) => t.name))
  return [...run.toolByName.keys()].filter((n) => !base.has(n)).sort()
}

/** 断言 B fixture (c)——必备 5 角色期望名集（§2.5）：depth-0 例 = 改前基线实读（⓪，落 §5）+ 端差
 *  settings；4 子角色 = 核矩阵语义（§2.3A——家族段名集，不含基础集）+ `notify_parent`
 *  （SUBAGENT-UPSTREAM-CHANNEL：核 depth>0 段装配——端侧同调核单源，随核矩阵增名同步）。
 * ENG-PLAN-EXCLUSION（FR31 ① / AC12 = T10）：工程模式两行删 `plan`（固定段裁剪——
 * `assembleFamilyTools` 按 `engineering` 取 `[task, timer]`）+ 新增 `explore-eng`（工程模式
 * explore：VSC 旁路面形状——视觉渠道子代理携 `engState.enabled:true`）。
 * context-tool 批（2026-09-21 · D-CC23 / D-CC28）：depth-0 家族段 + `context`（核单源装配）；
 * 子代理面**不给**（裁决 D——结构不可达）⇒ 5 子角色行零改。 */
const FAMILY_FIXTURE = {
  "depth-0": ["advisor", "batch", "context", "eng", "goal", "ledger_add", "ledger_close", "ledger_update", "plan", "read_history", "recent_changes", "settings", "skill", "subagent", "task", "timer", "verify"],
  "eng-designer": ["batch", "notify_parent", "subagent", "task", "timer"],
  "eng-coder": ["advisor", "batch", "notify_parent", "subagent", "task", "timer", "verify"],
  coder: ["advisor", "notify_parent", "plan", "task", "timer", "verify"],
  explore: ["notify_parent", "plan", "task", "timer"],
  "explore-eng": ["notify_parent", "task", "timer"],
}

/** 生产装配形状逐角色（`hydrateRun` = 生产入口 `setupAgentRun` 同函数；depth/role 同生产调用）。 */
function hostShape({ depth, role, engineering = false }) {
  return hydrateRun(buildTopLevelAgent(), {
    provider, cwd: work, input: "host-shape matrix", depth, role,
    getAuto: () => false,
    opts: { ...(engineering ? { engState: { enabled: true } } : {}), batchDoc: BATCH },
  })
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
    { task: ENG_TASK_BOOK_MIN, round: "initial", role: "eng-designer", batchDoc: "docs/batches/2026-09-15-demo.md", async: false },
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
  assertToolNamesUnique(llm, calls0) // 断言 A（L1）——非只读分支子代真跑的工具名唯一性
})

test("T5 eng-designer（行为——用户实测角色）：真跑 + 断言 A（工具名唯一）+ 断言 B（矩阵同源，5 角色）", async () => {
  // ── 断言 A：真跑（用户报错路径——工程模式 spawn eng-designer）──
  const parent = await hostParent({ engineering: true })
  const calls0 = llm.calls
  const report = await subagentTool.execute(
    { task: ENG_TASK_BOOK_MIN, round: "initial", role: "eng-designer", batchDoc: BATCH, async: false },
    spawnCtx(parent),
  )
  assert.ok(llm.calls > calls0, "真子运行触达 mock provider（llm.calls ≥ 1）")
  assert.match(String(report), /host-shape spawn verified/, "子代报告返回（修复前：重名 ⇒ provider 逐字 400 Tool names must be unique.）")
  assertToolNamesUnique(llm, calls0)

  // ── 断言 B：(a) VSC 生产装配家族名集 ≡ (c) 5 角色 fixture ──
  const depth0 = await hostShape({ depth: 0, role: null })
  // R2（context-tool 批 2026-09-21 §2.3 AC7）：双端 +1 —— 生产表含 `context`（唯一来源 = 核家族段）∧ 表内名唯一 ∧ 宿主工具已名 `ide`
  const names0 = [...depth0.toolByName.keys()]
  assert.deepEqual(names0, [...new Set(names0)], "生产表名唯一（重名 ⇒ provider 逐字 400 Tool names must be unique.）")
  assert.ok(depth0.toolByName.has("context") && depth0.toolByName.get("ide") != null, "表含 `context`（家族段）∧ 宿主工具名 = `ide`")
  assert.deepEqual(familyNames(depth0), [...FAMILY_FIXTURE["depth-0"]].sort(), "(a)≡(c) depth-0 默认（携改前基线锚）")
  const childCases = [
    ["eng-designer", "eng-designer", true], ["eng-coder", "eng-coder", true],
    ["coder", "coder", false], ["explore", "explore", false],
    // T10 旁路面（FR31 ①）：工程模式 explore——同 `engState.enabled:true` 驱动（视觉渠道子代理形状）
    ["explore-eng", "explore", true],
  ]
  for (const [label, role, engineering] of childCases) {
    const run = await hostShape({ depth: 1, role, engineering })
    assert.deepEqual(familyNames(run), [...FAMILY_FIXTURE[label]].sort(), `(a)≡(c) ${label}`)
  }
  // ── 断言 B：(a) ≡ (b) 直接调用核单源（同参 + 端差装饰）——防「VSC 绕过核函数」──
  // 同参口径 = 生产面取值源同款（consultModels = 端侧 loadConsultPool()；batchDoc = 本用例 BATCH）。
  const direct = await assembleFamilyTools({
    depth: 0, role: null, consultModels: loadConsultPool(), batchDoc: BATCH,
    decorate: { subagent: vscSubagentFace(subagentTool), settings: coreSettingsTool() },
  })
  assert.deepEqual(direct.map((t) => t.name).sort(), familyNames(depth0), "(a)≡(b) 生产装配 ≡ 核单源直调（同参）")
})
