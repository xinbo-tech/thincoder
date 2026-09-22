/**
 * eng-designer-role.test.mjs — eng-designer 角色 VSC 落地（ENGINEERING-MODE.md §2.15 D /
 * VSC 端镜像批（2026-09-11 · 第 5 批）八处 · FR23 F2；用例 T57/T57b/T57c/T58 + 运行期三关）。
 *
 * 发现 #1 的教训：枚举/装配层落完**不等于角色能 spawn**——运行期有 fail-closed 白名单与三道门。
 * 本档断言下沉到运行期：
 *   ① 白名单放行 + 未知角色文案点名新角色；② 模式门第三门（非工程模式拒 designer）；
 *   ③ 子代 spawn 门（designer 勘察 = explore-only）；④ 装配分支（batch 在、advisor 不在、
 *   `agent._batchDoc` 落到工具）；⑤ 角色 enum 含 designer；⑥ 场景表两行 + 人格槽位；
 *   ⑦ webview 四处枚举；⑨ 勘察通道行为（explore 允 / 其它拒、勘察任务不含 Audit scope 块）。
 * 测试缝 `ctx.runAgent` 驱动真实 execute 的放行面（零网络）。
 */
import { test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

// W13（2026-09-15）：工具面/门族 = 核单源（原 `src/agent-tools/subagent.mjs` 镜像删旧）——
// `subagentTool` = 核工具（装配面经 `vscSubagentFace`，本档测白名单/模式门原文层）；
// `modeRoleField` = 端装配面（W13 迁入 `src/agent/setup.mjs`）；门族 `gateEngCoderSpawn` = 核
// `@thincoder/core/agent/spawn-child.mjs`。放行面原经端工具 `ctx.runAgent` 缝偷渡——该缝不存在
// 于核工具 ⇒ 放行例改驱核装配面 `buildSpawnChild`（真门序 + 真绑定；零网络）。
import { subagentTool as coreSubagentTool } from "@thincoder/core/agent-tools/subagent.mjs"
import { buildSpawnChild } from "@thincoder/core/agent-tools/subagent-spawn.mjs"
import { gateEngCoderSpawn } from "@thincoder/core/agent/spawn-child.mjs"
import { modeRoleField, setupAgentRun } from "../src/agent/setup.mjs"
import { SCENARIO_SLOT_FILES, assemblePrompt } from "@thincoder/core/prompt-overlays.mjs"
import { ENG_TASK_BOOK_MIN } from "@thincoder/core/agent-tools/spawn-gates.mjs"
import { setupWebview, installChatFixture } from "./helpers/webview-env.mjs"

const REPO = resolve(fileURLToPath(import.meta.url), "..", "..")
const read = (rel) => readFileSync(join(REPO, rel), "utf8")

let cwd
let wv
beforeEach(() => {
  cwd = mkdtempSync(join(tmpdir(), "eng-designer-"))
  wv = setupWebview()
  installChatFixture()
})
afterEach(() => {
  wv?.cleanup?.()
  rmSync(cwd, { recursive: true, force: true })
})

const provider = { name: "probe", model: "gpt-4o", apiKey: "k" }
const batchFile = () => {
  mkdirSync(join(cwd, "docs", "batches"), { recursive: true })
  const abs = join(cwd, "docs", "batches", "b.md")
  writeFileSync(abs, "# 批次\n\n## §1 讨论\n\n**状态行**：🔄 进行中（夹具）\n\n## §2 批次任务\n\n## §3 设计评审\n\n## §4 用户批准\n\n## §5 实施记录\n\n## §6 验证与收口\n")
  return abs
}
const parentAgent = ({ engineering = true, role = null, depth = 0 } = {}) => ({
  config: { agent: { engineering } }, cwd, _role: role, _depth: depth,
  _asyncSubagents: new Map(), _asyncAdvisors: new Map(), _subAgentCounter: 0, _engDesignTokens: new Map(),
  tools: [], provider: { name: "probe", model: "gpt-4o", apiKey: "k" },
})
/** 核工具 ctx（抛错型用例——白名单/模式门/子代门均在装配前抛，零网络）。 */
const execCtx = (parent, extra = {}) => ({
  agent: parent, cwd, depth: parent._depth, callbacks: {}, getAuto: () => false, ...extra,
})
/** 装配放行探针（W13：原端工具 ctx.runAgent 缝退役——直驱核 buildSpawnChild 真门序）。 */
function buildProbe(parent, args, role) {
  const attempt = gateEngCoderSpawn(parent, parent._depth, role, args.async === true)
  return buildSpawnChild(parent, execCtx(parent), args, role, args.async === true, [], [], attempt)
}

// ── T57 运行期三关 + 装配 ───────────────────────────────────────────────────
// W13：放行例改驱核装配面（母题不变：白名单/模式门/子代门全过 → 真装配；零网络）。
test("T57 正常：工程模式 spawn eng-designer 放行（白名单 + 模式门 + 子代门 → 装配）", async () => {
  const abs = batchFile()
  const parent = parentAgent()
  const built = buildProbe(parent, { task: ENG_TASK_BOOK_MIN, round: "initial", role: "eng-designer", batchDoc: "docs/batches/b.md", async: false }, "eng-designer")
  assert.equal(built.child._batchDoc, abs, "装配通过 → 绑定落到 child（行前门全过）")
  assert.ok(!parent._engAuditSpawns, "designer 勘察不占审计预算（gate 返回 null——不计审计尝试）")
})

test("T57 错误：未知角色文案点名新角色（漏改则报错信息说谎）", async () => {
  const parent = parentAgent()
  await assert.rejects(
    () => coreSubagentTool.execute({ task: "x", role: "eng-architect", async: false }, execCtx(parent)),
    (e) => /Valid roles: explore, plan, coder, eng-coder, eng-designer/.test(e.message),
    "白名单错误文案列举含 eng-designer",
  )
})

test("T57 边界：角色 enum（工程模式含 designer / 普通模式不含）", () => {
  const eng = [...modeRoleField(true).role.enum].sort()
  const normal = [...modeRoleField(false).role.enum].sort()
  assert.deepEqual(eng, ["eng-coder", "eng-designer", "explore"], "工程模式 enum = F5 集（集合相等——集外值即红）")
  assert.deepEqual(normal, ["coder", "explore", "plan"], "普通模式 enum = 正常模式集（同法锁集）")
  assert.ok(!modeRoleField(false).role.enum.includes("eng-designer"), "普通模式 enum 不含（模式互斥）")
  assert.match(modeRoleField(true).suffix, /eng-designer/, "suffix 指向新角色（模型可见引导）")
})

test("T57 正常：装配分支——batch 在、advisor 不在、绑定落到工具（VSC 端镜像批（2026-09-11 · 第 5 批）④/⑨）", async () => {
  const abs = batchFile()
  const run = await setupAgentRun({
    provider, cwd, input: "task", depth: 1, role: "eng-designer", getAuto: () => false,
    opts: { engineering: true, engState: { enabled: true }, batchDoc: abs },
  })
  assert.equal(run.agent._batchDoc, abs, "spawn 绑定 → agent._batchDoc")
  assert.ok(run.toolByName.has("batch"), "designer 挂 batch（§2 写通道）")
  assert.ok(!run.toolByName.has("advisor"), "designer 不挂 advisor（设计师不发起评审）")
  assert.ok(run.toolByName.has("subagent"), "勘察通道工具在（explore-only 受限变体）")
  // 挂载的工具真能写进绑定的档（绑定不是摆设）
  await run.toolByName.get("batch").execute({ action: "append", segment: "§2", text: "### 本批任务" }, { agent: run.agent, cwd })
  assert.ok(readFileSync(abs, "utf8").includes("### 本批任务"), "designer 工具写 §2 落到绑定档")
  // 受限变体的 schema 面：explore-only + 无 async/batchDoc（delete 清单）；action 显式
  // spawn-only（核版形态——VSC 旧 engChildSubagentTool 的 delete-action 微差随死支删除消解，
  // VSC-TOOL-TABLE-DUP §2.10.6）
  const props = run.toolByName.get("subagent").parameters.properties
  assert.deepEqual(props.role.enum, ["explore"], "勘察通道 role 仅 explore")
  assert.deepEqual(props.action.enum, ["spawn"], "受限变体 action 仅 spawn（核版形态——机械门在 execute 层）")
  assert.ok(!("async" in props) && !("batchDoc" in props) && !("round" in props), "受限变体 delete 清单（含 batchDoc/round——勘察通道 F2 豁免）")
})

test("T57 零回归：eng-coder 装配面不变（advisor/verify 在，batch 仍挂）", async () => {
  const abs = batchFile()
  const run = await setupAgentRun({
    provider, cwd, input: "task", depth: 1, role: "eng-coder", getAuto: () => false,
    opts: { engineering: true, engState: { enabled: true }, batchDoc: abs },
  })
  for (const t of ["advisor", "verify", "batch", "subagent"]) assert.ok(run.toolByName.has(t), `eng-coder 工具：${t}`)
  assert.equal(run.agent._batchDoc, abs, "eng-coder 绑定同形")
})

test("T57 边界：场景表（不静默回退）+ 人格槽位 + 纪律槽", () => {
  assert.deepEqual(SCENARIO_SLOT_FILES["eng-designer"], ["persona-eng-designer.md", "common.md", "discipline-engineering.md"], "designer 场景已登记（槽序 persona→common→discipline）")
  const { prompt, warnings } = assemblePrompt("eng-designer")
  assert.ok(prompt.length > 0, "prompt 非空")
  // 人格槽文件由提示词面（面②）交付——落地前唯一允许的警告 = 该槽文件缺失（不误报其他槽）
  assert.ok(
    warnings.length === 0 || (warnings.length === 1 && warnings[0].includes("persona-eng-designer.md")),
    `warnings 只可能是人格槽缺失：${JSON.stringify(warnings)}`,
  )
})

// ── T57b 模式门 + 子代门 ────────────────────────────────────────────────────
test("T57b 错误：①非工程模式 spawn designer 拒（文案含角色名，不与既有模式门文案撞车）", async () => {
  const parent = parentAgent({ engineering: false })
  const err = await coreSubagentTool.execute({ task: "写设计档", role: "eng-designer", batchDoc: "docs/batches/b.md", async: false }, execCtx(parent))
    .then(() => null, (e) => e)
  assert.match(err.message, /Engineering mode is not active/, "同族前缀（与 eng-coder 门同族）")
  assert.match(err.message, /role='eng-designer'/, "点名实际角色（不误导）")
  assert.notEqual(err.message, "Engineering mode: use role='eng-coder' for implementation tasks.", "不撞 generic 模式门文案")
  assert.ok(!parent._asyncSubagents.size, "拒在装配/入池之前")
})

test("T57b 错误：②designer 子代 spawn 非 explore 拒（受限通道 explore-only）", async () => {
  const parent = parentAgent({ role: "eng-designer", depth: 1 })
  for (const role of ["plan", "eng-coder", "coder"]) {
    const err = await coreSubagentTool.execute({ task: "x", role, async: false }, execCtx(parent)).then(() => null, (e) => e)
    assert.match(err.message, /may only spawn role='explore'/, `${role} → 拒`)
    assert.match(err.message, /eng-designer subagents/, "文案点名父角色（designer 不被误导为审计语义）")
  }
  assert.ok(!parent._asyncSubagents.size, "三个非法子代均未入池")
})

// ── T57c 勘察通道行为 ──────────────────────────────────────────────────────
test("T57c 正常：designer 内 spawn explore 允（勘察报告拿到）且不含 Audit scope 块", async () => {
  const parent = parentAgent({ role: "eng-designer", depth: 1 })
  const built = buildProbe(parent, { task: "勘察现状", role: "explore", async: false }, "explore")
  assert.ok(built.child, "designer 勘察装配放行")
  assert.ok(!built.input.includes("Audit scope"), "勘察任务不注入审计范围块（设计师勘察 ≠ 审计）")
  assert.equal(built.child._spawnSystemBlock, undefined, "勘察零固块——连固块字段也不含（防改后空转，台账 #23）")
  assert.equal(gateEngCoderSpawn(parent, 1, "explore", false), null, "勘察路径返回 null（非审计——不计数）")
})

test("T57c 错误：designer 内 spawn eng-coder/plan 拒（受限变体只暴露 explore）", () => {
  const parent = parentAgent({ role: "eng-designer", depth: 1 })
  for (const role of ["eng-coder", "plan", "coder"]) {
    assert.throws(() => gateEngCoderSpawn(parent, 1, role, false), /may only spawn role='explore'/, `${role} 拒`)
  }
  assert.throws(() => gateEngCoderSpawn(parent, 1, "explore", true), /sync-only/, "async 勘察拒（子代同步）")
  assert.equal(parent._engAuditSpawns, undefined, "勘察不计审计预算")
  assert.equal(gateEngCoderSpawn(parent, 0, "plan", false), null, "非子代理上下文不加限制（主 agent 面零变更）")
})

// ── T58 webview 四处枚举（2026-09-11 扫① 改挂行为面）───────────────────────
// 原 5 条源码 regex 锚删——settings 面改断言渲染产物（角色卡槽位 id，settings-models.mountModelMenus
// 挂载的同 id 槽位）+ 活动面改断言频道建块（role 入族行为）——契约留在行为面，不锁源码形态。
test("T58 行为面：eng-designer 在面板/活动面真实可达（角色卡槽位 + 频道建块）", async () => {
  // ① settings 面：角色卡渲染 eng-designer 子模型槽
  const { agentCardHtml } = await import("../webview/settings-agent.js")
  const { SS } = await import("../webview/settings-state.js")
  SS.agentSettings = {}
  const html = agentCardHtml()
  assert.match(html, /id="submodel-slot-eng-designer"/, "角色卡渲染 eng-designer 槽位（UI 面真实可达）")
  // ② 活动面：eng-designer 频道消息建块（webview 频道 regex 行为）
  const state = await import("../webview/state.js")
  const activity = await import("../webview/activity.js")
  state.ctx.messagesEl.replaceChildren()
  state.S._subBlocks.clear()
  activity.applySubagentStatus({ type: "subagent", status: "started", role: "eng-designer", id: 5, pool: true, model: "m" })
  assert.ok(state.S._subBlocks.get("sub:eng-designer#5"), "eng-designer 频道建块（role 入族——频道 regex 行为）")
})
