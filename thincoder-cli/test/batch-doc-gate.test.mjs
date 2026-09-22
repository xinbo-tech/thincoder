/**
 * batch-doc-gate.test.mjs — 批次档 spawn 门禁（ENGINEERING-MODE.md §2.11-§2.12，CLI 第 1 批）。
 * 用例表 1:1 落地：
 *   T25  错误：eng-coder 无 batchDoc → throw（消息含纠正动作）
 *   T25b 错误：sync 路径（async:false）缺 batchDoc 同拒 + 带存在路径通过（校验在
 *        buildSpawnChild——双路覆盖 AC12）
 *   T26  错误：batchDoc 指向不存在路径 / 目录 → throw（消息含
 *        "(given path is not a readable file)" 后缀）
 *   T27  正常：batchDoc 存在 → 通过 + spawn 固块含 "Batch record (batchDoc): <abs>"
 *        （台账 #23 / §6.26：机制性指令改走 system 固块——`child._spawnSystemBlock`；
 *        `input` 只留任务书）
 *   T28  边界：非 eng-coder（explore）不带 batchDoc → 现行行为零变更
 *   T29  边界：eng-coder 审计受限变体（setup 装配）properties 不含 batchDoc（AC13）
 * 构造手法照两份先例：直驱 buildSpawnChild（test/subagent-scheduler.test.mjs「链路形态」节——
 * 原 subagent-id-counter.test.mjs 并档；扫① 2026-09-11）+
 * 最小 parent + 活 token 槽（test/design-token-settlement.test.mjs 的 liveTok 形态）；
 * T29 走真实 setup 装配（prepareRun——test/setup-reminders.test.mjs 的 mock agent 形态）。
 * 纯单元：零网络、零子代理启动（buildSpawnChild 只装配，不跑 child）。
 */
import { test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { randomUUID } from "node:crypto"

import { buildSpawnChild } from "@thincoder/core/agent-tools/subagent-spawn.mjs"
import { subagentTool } from "@thincoder/core/agent-tools/subagent.mjs"
import { prepareRun } from "@thincoder/core/agent/setup.mjs"
import { ENG_TASK_BOOK_MIN } from "@thincoder/core/agent-tools/spawn-gates.mjs"

const DESIGN_ID = "did-batch-doc"
const liveTok = () => `${randomUUID()}:${Date.now() + 3600e3}`
/** 门禁拒绝消息逐字（设计 §2.12 + §2.15 D1——文案参数化带实际角色名）。 */
const baseMsg = (role) => `batchDoc is required for role='${role}' — pass the batch record path (docs/batches/<batch>-<topic>.md); spawn refused without it.`
const BASE_MSG = baseMsg("eng-coder")

let tmp
beforeEach(() => { tmp = mkdtempSync(join(tmpdir(), "batch-doc-")) })
afterEach(() => { rmSync(tmp, { recursive: true, force: true }) })

/** 最小 parent（eng-coder 带活 token 槽——token 门必须放行，batchDoc 门才是唯一变因）。 */
function engSpawnArgs() {
  const token = liveTok()
  const parent = {
    cwd: tmp,
    provider: { name: "p", model: "m" },
    config: { agent: { engineering: true } },
    tools: [{ name: "read", readonly: true }],
    _engDesignTokens: new Map([[DESIGN_ID, token]]),
  }
  return { parent, args: { task: ENG_TASK_BOOK_MIN, round: "initial", designId: DESIGN_ID, designToken: token } }
}

/** 直驱装配（role=eng-coder——门禁命中即 throw，不返回）。 */
const buildEng = (parent, args, wantAsync = true) =>
  buildSpawnChild(parent, { agent: parent }, args, "eng-coder", wantAsync, [], [], null)

/** 捕获 throw 的错误（无 throw → null——调用方断言必须 throw）。 */
function catchErr(fn) {
  try { fn(); return null } catch (e) { return e }
}

/** 建真实批次档文件；返回 cwd 相对路径 + 门禁应注入的绝对路径。 */
function makeBatchDoc(rel = "docs/batches/2026-09-10-eng.md") {
  const abs = resolve(tmp, rel)
  mkdirSync(join(tmp, "docs", "batches"), { recursive: true })
  writeFileSync(abs, "# 批次记录（测试夹具）\n")
  return { rel, abs }
}

test("T25 错误：eng-coder 无 batchDoc → throw（消息含纠正动作 + 早于 token 门）", () => {
  const { parent, args } = engSpawnArgs()
  const e = catchErr(() => buildEng(parent, args))
  assert.ok(e instanceof Error, "无 batchDoc → 必须 throw")
  assert.equal(e.message, BASE_MSG, "消息逐字（含纠正动作）")
  assert.equal(parent._engDesignTokens.size, 1, "拒绝时槽原样（未因拒绝被误动）")
  // 定序断言（设计 §2.12「token 门之前」）：过期 token + 缺 batchDoc → 仍报 batchDoc 错，
  // 且该过期槽未被 token 门的过期清理删掉——顺序颠倒时 token 门会先清槽并报 token 错
  // （subagent-spawn.mjs 过期拒分支）。
  const expiredTok = `${randomUUID()}:${Date.now() - 3600e3}`
  const expired = { ...parent, _engDesignTokens: new Map([[DESIGN_ID, expiredTok]]) }
  const e2 = catchErr(() => buildEng(expired, { task: "t", designId: DESIGN_ID, designToken: expiredTok }))
  assert.equal(e2?.message, BASE_MSG, "过期 token 场景仍报 batchDoc 错——门禁先于 token 门")
  assert.equal(expired._engDesignTokens.size, 1, "过期槽未被清理（token 门未先行）")
  // 反证（上一条断言非空转）：过期 token + **有效** batchDoc → 走到 token 门，过期槽被清
  const { rel } = makeBatchDoc()
  const expired2 = { ...parent, _engDesignTokens: new Map([[DESIGN_ID, expiredTok]]) }
  const e3 = catchErr(() => buildEng(expired2, { ...args, batchDoc: rel, designToken: expiredTok }))
  assert.match(e3?.message ?? "", /Invalid or missing design token/, "门禁放行后 token 门照常拒过期 token")
  assert.equal(expired2._engDesignTokens.size, 0, "token 门的过期清理确实删槽——定序断言非空转")
})

test("T25b 错误/正常：sync 路径（async:false）同受门禁 + 带存在路径通过（双路覆盖）", () => {
  const { parent, args } = engSpawnArgs()
  const e = catchErr(() => buildEng(parent, args, false))
  assert.equal(e?.message, BASE_MSG, "sync 路径缺 batchDoc 同拒（校验在 buildSpawnChild）")
  const { rel, abs } = makeBatchDoc()
  const built = buildEng(parent, { ...args, batchDoc: rel }, false)
  assert.ok(built.child._spawnSystemBlock.includes(`Batch record (batchDoc): ${abs}`), "sync 成功路径同样注入批次档行（固块字段）")
  assert.ok(!built.input.includes("Batch record (batchDoc)"), "input 侧反转：纯任务书（不含固块）")
})

test("T26 错误：batchDoc 指向不存在路径 / 目录 → throw（含不可读后缀）", () => {
  const { parent, args } = engSpawnArgs()
  const missing = catchErr(() => buildEng(parent, { ...args, batchDoc: "docs/batches/none.md" }))
  assert.equal(missing?.message, BASE_MSG + " (given path is not a readable file)")
  // 路径存在但不是文件（目录）→ 同拒（判据 = 存在**且为文件**）
  const dir = catchErr(() => buildEng(parent, { ...args, batchDoc: "." }))
  assert.equal(dir?.message, BASE_MSG + " (given path is not a readable file)")
})

test("T27 正常：batchDoc 存在 → 通过 + spawn 固块含 Batch record 行（含 `\\` 归一）", () => {
  const { rel, abs } = makeBatchDoc()
  const { parent, args } = engSpawnArgs()
  const built = buildEng(parent, { ...args, batchDoc: rel })
  assert.equal(built.child._engDesignReviewed, true, "token 门照常放行（门禁不误伤既有链）")
  assert.ok(built.child._spawnSystemBlock.includes(`Batch record (batchDoc): ${abs}`), "spawn 固块含批次档绝对路径（台账 #23）")
  assert.ok(!built.input.includes("Batch record (batchDoc)"), "input 不含固块（D23-6）")
  assert.equal(built.child._engTaskInput, built.input, "_engTaskInput 同源携带 = 纯任务书（不含固块——审计任务书来源）")
  // 反斜杠变体（路径语义照 `files` 先例——`\` 归一为 `/`）
  const slashVariant = buildEng(parent, { ...args, batchDoc: rel.replaceAll("/", "\\") })
  assert.ok(slashVariant.child._spawnSystemBlock.includes(`Batch record (batchDoc): ${abs}`), "`\\` 分隔符同判")
  // 任务书段匹配（D23-6 语义下固块不在任务书内）：审计形态装配一次——三要素仍逐段命中。
  const taskBook = "# 任务\n\n## Docs involved\n- docs/design/X.md\n\n## 文件清单\n- src/a.mjs\n\n## 验收标准\n- AC1\n"
  const auditParent = {
    cwd: tmp, provider: { name: "p", model: "m" }, config: { agent: {} },
    tools: [{ name: "read", readonly: true }],
  }
  const auditCtx = { agent: { _touchedFiles: [], _engTaskInput: taskBook } }
  const audit = buildSpawnChild(auditParent, auditCtx, { task: "audit" }, "explore", true, [], [], 1)
  assert.ok(audit.child._spawnSystemBlock.includes(`Batch record (batchDoc): ${abs}`) === false, "审计子代理不携批次档行（非工程角色）")
  for (const marker of ["Docs involved", "文件清单", "验收标准"]) {
    assert.ok(audit.child._spawnSystemBlock.includes(marker), `审计固块段匹配保住：${marker}`)
  }
  assert.doesNotMatch(audit.child._spawnSystemBlock, /not found in the parent task book/, "三要素无缺失（审计摘要逐段命中）")
})

test("T28 边界：explore spawn 不带 batchDoc → 现行行为零变更", () => {
  const parent = {
    cwd: tmp,
    provider: { name: "p", model: "m" },
    config: { agent: {} },
    tools: [{ name: "read", readonly: true }],
  }
  const built = buildSpawnChild(parent, { agent: parent }, { task: "audit" }, "explore", true, [], [], null)
  assert.ok(!built.input.includes("Batch record (batchDoc)"), "非 eng-coder 不注入批次档行")
  assert.equal(built.child._spawnSystemBlock, undefined, "非工程角色零固块（台账 #23）")
  // 显式传了 batchDoc（且路径不存在）的 explore 同样不被门禁拦（门只管 eng-coder）
  const withArg = buildSpawnChild(parent, { agent: parent }, { task: "audit", batchDoc: "docs/batches/none.md" }, "explore", true, [], [], null)
  assert.ok(!withArg.input.includes("Batch record (batchDoc)"), "explore 不注入、不校验")
  assert.equal(withArg.child._spawnSystemBlock, undefined, "explore 零固块（不因参数在场而绑）")
})

test("T29 边界：eng-coder 审计受限变体 properties 不含 batchDoc（AC13）", async () => {
  const agent = {
    config: { agent: { engineering: true } }, history: [], tools: [], cwd: tmp,
    _pendingReminders: [], autoApprove: false, memory: undefined, _role: "eng-coder",
  }
  const { toolByName } = await prepareRun(agent, "task", {}, { depth: 1 })
  const audit = toolByName.get("subagent")
  assert.ok(audit, "eng-coder 审计通道 subagent 工具在位")
  assert.ok(!("batchDoc" in audit.parameters.properties), "审计受限变体无 batchDoc")
  assert.ok(!("designToken" in audit.parameters.properties), "既有 delete 清单仍在（designToken）")
  // 对照断言（防空转）：完整 subagent 工具面仍带 batchDoc
  assert.ok("batchDoc" in subagentTool.parameters.properties, "基工具面含 batchDoc")
  assert.ok(subagentTool.parameters.properties.batchDoc.description.includes("REQUIRED for role='eng-coder'"), "schema 描述含 REQUIRED 声明（eng-coder）")
  assert.ok(subagentTool.parameters.properties.batchDoc.description.includes("role='eng-designer'"), "schema 描述扩为角色集合（eng-designer）")
})

// ── 第 2 批（§2.15 D1）：门扩角色集合——eng-designer 同门（不带 → throw；带可读路径 → 通过）──
test("T33b 错误/正常：eng-designer 同受 batchDoc 门禁（文案含实际角色名——不带角色名不误导）", () => {
  const parent = {
    cwd: tmp,
    provider: { name: "p", model: "m" },
    config: { agent: { engineering: true } },
    tools: [{ name: "read", readonly: true }],
  }
  const buildDesigner = (args, wantAsync = true) =>
    buildSpawnChild(parent, { agent: parent, callbacks: {} }, args, "eng-designer", wantAsync, [], [], null)
  // 不带 → throw（消息点名 eng-designer——非 eng-coder）
  const e = catchErr(() => buildDesigner({ task: "写设计" }))
  assert.equal(e?.message, baseMsg("eng-designer"), "designer 门禁文案带实际角色名")
  assert.notEqual(e?.message, BASE_MSG, "不得复述 eng-coder 文案（不误导）")
  // 带不存在路径 → 同款不可读后缀
  const missing = catchErr(() => buildDesigner({ task: "写设计", batchDoc: "docs/batches/none.md" }))
  assert.equal(missing?.message, baseMsg("eng-designer") + " (given path is not a readable file)")
  // 带可读路径 → 通过 + 任务输入含 Batch record 行 + sync 路径同款（双路覆盖）
  const { rel, abs } = makeBatchDoc("docs/batches/2026-09-10-designer.md")
  const built = buildDesigner({ task: ENG_TASK_BOOK_MIN, round: "initial", batchDoc: rel }, false)
  assert.ok(built.child._spawnSystemBlock.includes(`Batch record (batchDoc): ${abs}`), "spawn 固块含批次档绝对路径（designer 同享）")
  assert.ok(!built.input.includes("Batch record (batchDoc)"), "designer 任务输入 = 纯任务书")
  assert.ok(!built.child._engDesignReviewed, "designer 不走 token 面（无 token 需求——§1.5 #4）")
  assert.equal(built.child._engTaskAuthorized, undefined, "designer 无任务域授权（写操作仍走人工 ask——§2.15 E）")
})
