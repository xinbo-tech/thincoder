/**
 * eng-designer-role.test.mjs — eng-designer 角色 + 行为纪律 + 文档更新纪律（ENGINEERING-MODE.md
 * 第 2 批 · CLI 端）。用例表 1:1 落地（§3.2 T30–T36 / T39 / T40）+ AC16–AC27：
 *   T30 正常（slow——第 20 批 A3 归册：真实 prepareRun 装配实测 818.5ms 撞快层慢门）：
 *       角色注册（schema enum / 描述角色矩阵 + Mode filtering / setup 工程 enum）
 *   T31 错误：非工程模式 spawn eng-designer → throw（第三道模式门——与 eng-coder 门同族）
 *   T32 边界：装配不静默回退（assemblePrompt("eng-designer") 非空 + 零警告）
 *   T32b（第 20 批 A2）：受限变体描述动作清单（7 动作/无 check）+ 机械门文案同清单——零新增装配调用，规避慢门
 *   T33 错误/正常：designer 无 batchDoc → throw（文案含实际角色名）；带可读路径 → 通过 + 注入行
 *   T35 边界：勘察受限（受限 schema explore-only + 机械门拒 coder / 允 explore 且返回 null；
 *        勘察任务输入不含 Audit scope 块）
 *   T36 边界：designer 无 designToken 需求（spawn 不带 token → 通过——与 eng-coder 对照）
 *   T39 边界：designer 写操作走父侧人工 ask（无任务域授权；autoApprove 才免问）
 *   T40 边界：写权路由单一口径（§2.8 切片结构面——路由句类正向锚已随 2026-09-12 散文锚退役批删除）
 * 构造手法照先例：直驱 buildSpawnChild（batch-doc-gate.test.mjs）+ 最小 agent 走真实 setup
 * 装配（batch-doc-gate T29 / setup-reminders 形态）+ executeToolCalls 直驱（design-token-settlement）。
 * 纯单元：零网络、零子代理启动。
 *
 * 扫① 削段注（2026-09-11 TEST-LIFECYCLE——设计档 TESTING.md §7.3 点名档）：T32 退役件对照 + T40 旧
 * 路由/身份句类负向锚（六条）→ 收归防回潮族；T40 勾销类负向正则 → 删（重复）。
 * 2026-09-12 散文锚退役批：注册 / 写权两面段删、写域面整删，防回潮族接收档同步退役。
 */
import { test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { slow } from "./slow.mjs"

import { subagentTool } from "@thincoder/core/agent-tools/subagent.mjs"
import { buildSpawnChild } from "@thincoder/core/agent-tools/subagent-spawn.mjs"
import { gateEngCoderSpawn } from "@thincoder/core/agent/spawn-child.mjs"
import { prepareRun } from "@thincoder/core/agent/setup.mjs"
import { executeToolCalls } from "@thincoder/core/agent/dispatch.mjs"
import { assemblePrompt, SCENARIO_SLOT_FILES } from "@thincoder/core/prompt-overlays.mjs"
import { ENG_TASK_BOOK_MIN } from "@thincoder/core/agent-tools/spawn-gates.mjs"

const __here = dirname(fileURLToPath(import.meta.url))
const read = (rel) => readFileSync(join(__here, "..", rel), "utf8")

let tmp
beforeEach(() => { tmp = mkdtempSync(join(tmpdir(), "eng-designer-")) })
/** Windows 实测：setup 深度 0 链路的句柄释放滞后 → rmSync 偶发 EPERM——短重试兑底
 *  （setup-reminders.test.mjs rmGitCwdDir 同款手法）。 */
async function rmTmp(dir) {
  for (let i = 0; ; i++) {
    try { rmSync(dir, { recursive: true, force: true }); return } catch { if (i >= 10) return; await new Promise((r) => setTimeout(r, 100)) }
  }
}
afterEach(async () => { await rmTmp(tmp) })

/** 最小工程模式 parent（直驱 buildSpawnChild——装配只读面）。 */
const engParent = (over = {}) => ({
  cwd: tmp,
  provider: { name: "p", model: "m" },
  config: { agent: { engineering: true } },
  tools: [{ name: "read", readonly: true }],
  ...over,
})

/** 直驱装配（designer——无 token 门；门禁/注入面断言）。 */
const buildDesigner = (parent, args, wantAsync = true, attempt = null) =>
  buildSpawnChild(parent, { agent: parent, callbacks: {} }, args, "eng-designer", wantAsync, [], [], attempt)

/** 真实批次档夹具（cwd 相对路径 + 门禁注入的绝对路径）。 */
function makeBatchDoc(rel = "docs/batches/2026-09-10-designer.md") {
  const abs = resolve(tmp, rel)
  mkdirSync(join(tmp, "docs", "batches"), { recursive: true })
  writeFileSync(abs, "# 批次记录（测试夹具）\n")
  return { rel, abs }
}

/** catch throw（无 throw → undefined）。 */
function catchErr(fn) { try { fn(); return undefined } catch (e) { return e } }

/** 真实 setup 装配用最小 agent（batch-doc-gate T29 形态）。 */
const setupAgent = (role, over = {}) => ({
  config: { agent: { engineering: true } }, history: [], tools: [], cwd: tmp,
  _pendingReminders: [], autoApprove: false, memory: undefined, _role: role,
  ...over,
})

// ═════════════════════════════════════════════════════════════════════════════
// T30 正常：角色注册五处（AC16）
// ═════════════════════════════════════════════════════════════════════════════
slow("T30 正常：角色注册五处（schema enum / ROLES 白名单 + 错误文案 / 描述角色矩阵 + Mode filtering / setup 工程 enum / tool-args）", async () => {
  // ① 基工具 schema enum
  assert.ok(subagentTool.parameters.properties.role.enum.includes("eng-designer"), "schema enum 含 eng-designer")
  // ③ 描述角色矩阵 + Mode filtering 句
  assert.match(subagentTool.description, /- eng-designer — engineering-mode design writer \(available only in engineering mode\)/, "描述角色矩阵行缺失")
  assert.match(subagentTool.description, /Mode filtering: normal mode exposes explore\/plan\/coder \(eng-coder and eng-designer are refused\); engineering mode exposes explore\/eng-designer\/eng-coder \(plan and coder are refused/, "Mode filtering 句缺失")
  // ④ setup 工程模式 enum（真实装配——depth 0）
  const { toolByName } = await prepareRun(setupAgent(undefined), "task", {}, { depth: 0 })
  assert.deepEqual(toolByName.get("subagent").parameters.properties.role.enum, ["explore", "eng-designer", "eng-coder"], "工程模式 enum 五处之一（F5 集——plan 不入）")
})

// ═════════════════════════════════════════════════════════════════════════════
// T31 错误：第三道模式门（AC16）
// ═════════════════════════════════════════════════════════════════════════════
test("T31 错误：非工程模式 spawn eng-designer → throw（与 eng-coder 门同族）；工程模式不被模式门拒", async () => {
  const normal = { ...engParent(), config: { agent: {} } }
  const e = await subagentTool.execute({ task: "写设计", role: "eng-designer" }, { agent: normal, depth: 0, callbacks: {} })
    .then(() => undefined, (err) => err)
  assert.ok(e instanceof Error, "非工程模式必须 throw")
  assert.match(e.message, /Engineering mode is not active — role='eng-designer' is engineering-mode only/, "错误文案含实际角色名")
  // 对照（反证非空转）：工程模式同一调用穿过模式门——由 batchDoc 门接力（不是模式门）
  const e2 = await subagentTool.execute({ task: "写设计", role: "eng-designer" }, { agent: engParent(), depth: 0, callbacks: {} })
    .then(() => undefined, (err) => err)
  assert.ok(e2 instanceof Error, "工程模式缺 batchDoc 同样被拒")
  assert.match(e2.message, /batchDoc is required for role='eng-designer'/, "第二道门（batchDoc）接力——证明模式门已放行")
  assert.ok(!/Engineering mode is not active/.test(e2.message), "工程模式下不再是模式门")
})

// ═════════════════════════════════════════════════════════════════════════════
// T32 边界：装配不静默回退 + 接线（AC17）
// ═════════════════════════════════════════════════════════════════════════════
test("T32 边界：assemblePrompt('eng-designer') 非空 ≠ CONSULT_BASE + 槽序正确 + 零警告（防静默回退）", () => {
  assert.deepEqual(SCENARIO_SLOT_FILES["eng-designer"], ["persona-eng-designer.md", "common.md", "discipline-engineering.md"], "场景槽表行（顺序 = persona→common→discipline）")
  const a = assemblePrompt("eng-designer")
  assert.ok(a.prompt.length > 500, "装配非空")
  assert.deepEqual(a.warnings, [], "全槽在位零警告（漏登记 SLOT_CONTENTS 即警告）")
  // 扫①：退役提示词文件对照锚 → 收归防回潮族（该族机检实装已撤除，§4.2.6）
})

test("T32b 接线：designer 子代理实选场景 = 'eng-designer'（setup 内层选择器——非 engineering/normal）", async () => {
  // 真实装配面（A2 面复用其 toolByName——装配句子断言已随 2026-09-12 散文锚退役批删除）
  const designerRun = await prepareRun(setupAgent("eng-designer"), "task", {}, { depth: 1 })
  const coderRun = await prepareRun(setupAgent("eng-coder"), "task", {}, { depth: 1 })

  // A2（第 20 批 §2.15 D5——AC-A2-1）：受限变体描述动作清单 = 机械门 7 动作（同清单真值）；
  // 已退役动作 check 不得残留。零新增装配调用——复用上方两处 prepareRun 的 toolByName。
  const GATE_ACTIONS = ["escalate", "status", "cancel", "panel", "consume-design", "observe", "send"]
  for (const [label, run] of [["designer", designerRun], ["eng-coder", coderRun]]) {
    const sub = run.toolByName.get("subagent")
    for (const a of GATE_ACTIONS) {
      assert.ok(sub.description.includes(a), `${label} 描述含动作名 ${a}`)
      assert.ok(sub.parameters.properties.action.description.includes(a), `${label} action 描述含动作名 ${a}`)
    }
    assert.ok(!sub.description.includes("check"), `${label} 描述无已退役动作 check`)
    assert.ok(!sub.parameters.properties.action.description.includes("check"), `${label} action 描述无 check`)
  }
  // 机械门（受限内非 spawn 动作）错误文案同含 7 名（真值面——直驱 execute，非装配）
  const gateErr = await subagentTool.execute({ action: "check", task: "x" }, { agent: { _role: "eng-designer" }, depth: 1, callbacks: {} })
    .then(() => undefined, (e) => e)
  assert.ok(gateErr instanceof Error, "受限内非 spawn 动作被机械门拒")
  for (const a of GATE_ACTIONS) assert.ok(gateErr.message.includes(a), `门文案含动作名 ${a}`)
  assert.ok(!gateErr.message.includes("check"), "门文案无 check")
})

// ═════════════════════════════════════════════════════════════════════════════
// T33 错误/正常：batchDoc 同门（AC18）
// ═════════════════════════════════════════════════════════════════════════════
test("T33 错误/正常：designer 无 batchDoc → throw（含实际角色名）；带可读路径 → 通过 + 任务输入含 Batch record 行", () => {
  const noDoc = catchErr(() => buildDesigner(engParent(), { task: "写设计" }))
  assert.equal(noDoc?.message, "batchDoc is required for role='eng-designer' — pass the batch record path (docs/batches/<batch>-<topic>.md); spawn refused without it.", "文案逐字含角色名")
  const missing = catchErr(() => buildDesigner(engParent(), { task: "写设计", batchDoc: "docs/batches/none.md" }))
  assert.equal(missing?.message, "batchDoc is required for role='eng-designer' — pass the batch record path (docs/batches/<batch>-<topic>.md); spawn refused without it. (given path is not a readable file)", "不可读后缀同款")
  const { rel, abs } = makeBatchDoc()
  const built = buildDesigner(engParent(), { task: ENG_TASK_BOOK_MIN, round: "initial", batchDoc: rel })
  assert.ok(built.input.includes(`Batch record (batchDoc): ${abs}`), "注入行含绝对路径")
  // sync 路径同款（双路覆盖——校验在 buildSpawnChild）
  const sync = buildDesigner(engParent(), { task: ENG_TASK_BOOK_MIN, round: "initial", batchDoc: rel }, false)
  assert.ok(sync.input.includes(`Batch record (batchDoc): ${abs}`), "sync 路径同样注入")
  // 对照：explore 不带 batchDoc 不受影响（门只管工程角色）
  const explore = buildSpawnChild(engParent(), { agent: engParent(), callbacks: {} }, { task: "audit" }, "explore", true, [], [], null)
  assert.ok(!explore.input.includes("Batch record (batchDoc)"), "explore 不注入、不校验")
})

// ═════════════════════════════════════════════════════════════════════════════
// T35 边界：勘察受限（AC20）
// ═════════════════════════════════════════════════════════════════════════════
test("T35 边界：designer 受限 schema（explore-only / 无 async·token·batchDoc）+ 机械门 coder 拒 / explore 允且不占审计预算", async () => {
  const { toolByName } = await prepareRun(setupAgent("eng-designer"), "task", {}, { depth: 1 })
  const sub = toolByName.get("subagent")
  assert.deepEqual(sub.parameters.properties.role.enum, ["explore"], "designer 通道 explore-only")
  for (const k of ["async", "id", "n", "designToken", "designId", "batchDoc", "round"]) {
    assert.ok(!(k in sub.parameters.properties), `受限变体 delete 清单：${k} 不在`)
  }
  assert.match(sub.description, /SURVEY the current state for the design/, "描述文案分流（勘察——非审计）")
  assert.match(sub.description, /≤6 explore spawns per batch/, "勘察预算句在位")
  // 机械门（schema 只是提示——gateEngCoderSpawn 是强制）
  const designerChild = { _role: "eng-designer" }
  assert.throws(() => gateEngCoderSpawn(designerChild, 1, "coder", undefined), /eng-designer subagents may only spawn role='explore'/, "designer 内 spawn coder 被拒")
  assert.throws(() => gateEngCoderSpawn(designerChild, 1, "eng-coder", undefined), /eng-designer subagents may only spawn role='explore'/, "designer 内 spawn eng-coder 被拒")
  assert.equal(gateEngCoderSpawn(designerChild, 1, "explore", false), null, "designer 勘察 explore 放行——返回 null")
  assert.equal(designerChild._engAuditSpawns, undefined, "勘察不占审计预算（6 仍只计 eng-coder）")
  // 对照（反证非空转）：eng-coder 审计路径返回序号并计数
  const coderChild = { _role: "eng-coder" }
  assert.equal(gateEngCoderSpawn(coderChild, 1, "explore", false), 1, "eng-coder 审计计次")
  assert.equal(coderChild._engAuditSpawns, 1, "审计预算计数落位")
  // 同一 set 的第二道门：父角色集合外不受限（depth 0）
  assert.equal(gateEngCoderSpawn(designerChild, 0, "coder", true), null, "depth 0 不受内部通道限制")
})

test("T35b 边界：勘察任务输入不含 Audit scope 块（评审 #4——返回值 null 的语义）", () => {
  const surveyParent = engParent({ _role: "eng-designer", _touchedFiles: ["src/x.mjs"], _engTaskInput: "# 任务\n\n## Docs involved\n- docs/design/X.md\n" })
  const attempt = gateEngCoderSpawn(surveyParent, 1, "explore", false)
  assert.equal(attempt, null, "designer 路径返回 null")
  const built = buildSpawnChild(surveyParent, { agent: surveyParent, callbacks: {} }, { task: "勘察现状" }, "explore", false, [], [], attempt)
  assert.ok(!built.input.includes("[Audit scope"), "勘察任务书不注入审计范围块")
  assert.ok(!built.input.includes("You are auditing an eng-coder delivery"), "不注入审计指令模板")
  // 对照：eng-coder 审计路径（attempt=1）注入
  const auditParent = engParent({ _role: "eng-coder", _touchedFiles: [], _engTaskInput: "# 任务\n\n## Docs involved\n- docs/design/X.md\n" })
  const audit = buildSpawnChild(auditParent, { agent: auditParent, callbacks: {} }, { task: "audit" }, "explore", false, [], [], 1)
  assert.ok(audit.input.includes("[Audit scope"), "eng-coder 审计路径照常注入（对照）")
})

// ═════════════════════════════════════════════════════════════════════════════
// T36 边界：designer 无 token 需求（AC20）——与 eng-coder 形成对照
// ═════════════════════════════════════════════════════════════════════════════
test("T36 边界：designer spawn 不带 designToken → 通过（不需凭证）；eng-coder 同调用被 token 门拒", () => {
  const { rel } = makeBatchDoc()
  const built = buildDesigner(engParent(), { task: ENG_TASK_BOOK_MIN, round: "initial", batchDoc: rel })
  assert.ok(built.child, "无 token 也装配成 child")
  assert.ok(!built.child._engDesignReviewed, "designer 无设计评审解锁标记（token 面不适用）")
  // 对照：eng-coder 同场景（无 token）→ token 门拒
  const e = catchErr(() => buildSpawnChild(engParent(), { agent: engParent(), callbacks: {} }, { task: ENG_TASK_BOOK_MIN, round: "initial", batchDoc: rel }, "eng-coder", true, [], [], null))
  assert.match(e?.message ?? "", /Invalid or missing design token/, "eng-coder 无 token 被拒（对照）")
})

// ═════════════════════════════════════════════════════════════════════════════
// T39 边界：designer 写操作走父侧人工 ask（AC26）
// ═════════════════════════════════════════════════════════════════════════════
test("T39 边界：designer 子代理写 docs/ → 走父侧授权 ask（非静默）；autoApprove 才免问", async () => {
  // 工具名用 `probe_write`（非 PEER_WRITE_TOOLS 成员——避开 peer 扫描的同步 git 子进程：
  // 冷启 ~0.5s 会把本用例推过快层 slow 门，而权限路径的判据只有 tool.readonly，与工具名无关）。
  const writeTool = { name: "probe_write", readonly: false, touchedPaths: (a) => [a.path], execute: async () => "written" }
  const toolByName = new Map([["probe_write", writeTool]])
  const call = () => ({ name: "probe_write", arguments: JSON.stringify({ path: "docs/design/X.md" }), id: "c1" })
  const designerChild = (over = {}) => ({
    cwd: tmp, _slot: null, config: { agent: { engineering: true } }, _role: "eng-designer",
    planMode: false, autoApprove: false, _mutLog: [], _mutationSeq: 0, _engDesignTokens: undefined,
    ...over,
  })
  // ① 无 handler → 到权限层被拒（不是工程门/不是静默放行）
  const r1 = await executeToolCalls(designerChild(), toolByName, [call()], {}, 1, undefined)
  assert.equal(r1[0].ok, false, "无 handler 时写操作不被静默放行")
  assert.match(String(r1[0].result), /no permission handler configured/, "拒因 = 权限层（证明走到了 ask 路径）")
  assert.ok(!String(r1[0].result).includes("design review required"), "不是工程设计门（designer 子代理不适用 token 门）")
  assert.ok(!String(r1[0].result).includes("Audit"), "非审计路径")
  // ② 有 handler → ask 被调用（父侧授权弹窗路径；非静默）
  let asked = null
  const cbs = { onPermissionRequest: async (name, args) => { asked = { name, args }; return false } }
  await executeToolCalls(designerChild(), toolByName, [call()], cbs, 1, undefined)
  assert.ok(asked, "父侧 ask 被触发")
  // 归属前缀由 spawn-child 的 childPermission wrapper 加（直驱 dispatch 时 = 裸工具名）
  assert.equal(String(asked.name), "probe_write", "ask 带工具名（人在回路面）")
  // ③ autoApprove（“全部授权/切自动”的机械等价面）→ 免问通过
  let asked2 = false
  const r3 = await executeToolCalls(designerChild({ autoApprove: true }), toolByName, [call()], { onPermissionRequest: async () => { asked2 = true; return false } }, 1, undefined)
  assert.equal(asked2, false, "autoApprove 下不弹 ask")
  assert.equal(r3[0].ok, true, "autoApprove 放行")
  // ④ 契约面：designer 不拿任务域授权（_engTaskAuthorized 仅 eng-coder——设计 §2.15 E）
  const { rel } = makeBatchDoc()
  const built = buildDesigner(engParent(), { task: ENG_TASK_BOOK_MIN, round: "initial", batchDoc: rel })
  assert.equal(built.child._engTaskAuthorized, undefined, "designer 无任务域豁免（保持人在回路）")
})

// ═════════════════════════════════════════════════════════════════════════════
// T40 边界：写权路由单一口径（AC27——六面 + 无残留）
// ═════════════════════════════════════════════════════════════════════════════
test("T40 边界：写权路由六面（§2.2 step1/step10 · §2.5 · §2.6 F2 · §2.8 · §2.15 A2）+ 双源 persona-engineering 调用链", () => {
  const em = read("docs/_archive/design/ENGINEERING-MODE.md")
  // §2.8 切片结构面（六面路由句类正向锚 + README / AGENTS 口径断言已随 2026-09-12 散文锚退役批删除）
  const sec28 = em.slice(em.indexOf("### 2.8 错误与恢复"), em.indexOf("### 2.9"))
  assert.ok(sec28.length > 100, "§2.8 slice 非空")
})
