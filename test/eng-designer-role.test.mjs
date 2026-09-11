/**
 * eng-designer-role.test.mjs — eng-designer 角色 + 行为纪律 + 文档更新纪律（ENGINEERING-MODE.md
 * 第 2 批 · CLI 端）。用例表 1:1 落地（§3.2 T30–T36 / T39 / T40）+ AC16–AC27：
 *   T30 正常（slow——第 20 批 A3 归册：真实 prepareRun 装配实测 818.5ms 撞快层慢门）：
 *       角色注册五处（schema enum / ROLES 白名单 + 错误文案 / 描述角色矩阵 + Mode filtering
 *       / setup 工程 enum / tool-args 显示 case）
 *   T31 错误：非工程模式 spawn eng-designer → throw（第三道模式门——与 eng-coder 门同族）
 *   T32 边界：装配不静默回退（assemblePrompt("eng-designer") 非空 ≠ CONSULT_BASE + 槽序 + 零警告）
 *        + 接线断言（designer 子代理实选场景 = "eng-designer"——setup 内层选择器）；T32b 含第 20 批 A2：
 *        受限变体描述动作清单（7 动作/无 check）+ 机械门文案同清单——零新增装配调用，规避慢门
 *   T33 错误/正常：designer 无 batchDoc → throw（文案含实际角色名）；带可读路径 → 通过 + 注入行
 *   T34 边界：写域 = 提示词级（双源 persona 明写写域；dispatch.mjs 无新增写域判定）
 *   T35 边界：勘察受限（受限 schema explore-only + 机械门拒 coder / 允 explore 且返回 null；
 *        勘察任务输入不含 Audit scope 块）
 *   T36 边界：designer 无 designToken 需求（spawn 不带 token → 通过——与 eng-coder 对照）
 *   T39 边界：designer 写操作走父侧人工 ask（无任务域授权；autoApprove 才免问）
 *   T40 边界：写权路由单一口径（六面均指向 eng-designer——正向锚；旧路由/身份句类负向锚已收归接收档）
 * 构造手法照先例：直驱 buildSpawnChild（batch-doc-gate.test.mjs）+ 最小 agent 走真实 setup
 * 装配（batch-doc-gate T29 / setup-reminders 形态）+ executeToolCalls 直驱（design-token-settlement）。
 * 纯单元：零网络、零子代理启动。
 *
 * 扫① 削段注（2026-09-11 TEST-LIFECYCLE——设计档 TESTING.md §7.3 点名档）：T32 退役件对照 + T40 旧
 * 路由/身份句类负向锚（六条）→ 收归 test/doc-consistency.test.mjs T75/T76（防回潮族）；T40 勾销类
 * 负向正则 → 删（重复：正向锚已锁「勾销落批次档 §6 / 不进设计档」）。正向锚全保留。
 */
import { test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { slow } from "./slow.mjs"

import { subagentTool } from "../src/agent-tools/subagent.mjs"
import { buildSpawnChild } from "../src/agent-tools/subagent-spawn.mjs"
import { gateEngCoderSpawn } from "../src/agent/spawn-child.mjs"
import { prepareRun } from "../src/agent/setup.mjs"
import { executeToolCalls } from "../src/agent/dispatch.mjs"
import { assemblePrompt, SCENARIO_SLOT_FILES, CONSULT_BASE } from "../src/prompt-overlays.mjs"

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
  // ② ROLES 白名单 + 错误文案（execute 内闭包——源码面断言）
  const src = read("src/agent-tools/subagent.mjs")
  assert.match(src, /const ROLES = new Set\(\["explore", "plan", "coder", "eng-coder", "eng-designer"\]\)/, "ROLES 白名单含 eng-designer")
  assert.match(src, /Valid roles: explore, plan, coder, eng-coder, eng-designer \(exact spelling\)\./, "错误文案含 eng-designer")
  // ③ 描述角色矩阵 + Mode filtering 句
  assert.match(subagentTool.description, /- eng-designer — engineering-mode design writer \(available only in engineering mode\)/, "描述角色矩阵行缺失")
  assert.match(subagentTool.description, /Mode filtering: normal mode exposes explore\/plan\/coder; engineering mode exposes explore\/plan\/eng-designer\/eng-coder\./, "Mode filtering 句缺失")
  // ④ setup 工程模式 enum（真实装配——depth 0）
  const { toolByName } = await prepareRun(setupAgent(undefined), "task", {}, { depth: 0 })
  assert.deepEqual(toolByName.get("subagent").parameters.properties.role.enum, ["explore", "plan", "eng-designer", "eng-coder"], "工程模式 enum 五处之一")
  // ⑤ tool-args 显示 case
  assert.match(read("src/tui/tool-args.mjs"), /case "eng-designer": \{/, "tool-args 显示 case 缺失")
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
  assert.notEqual(a.prompt, CONSULT_BASE, "不是 CONSULT_BASE 静默回退")
  assert.deepEqual(a.warnings, [], "全槽在位零警告（漏登记 SLOT_CONTENTS 即警告）")
  assert.ok(a.prompt.indexOf("写稿面唯一作者") < a.prompt.indexOf("Programming is collaborative labor"), "槽序：人格先于公共")
  assert.ok(a.prompt.indexOf("Programming is collaborative labor") < a.prompt.indexOf("铁律"), "槽序：公共先于纪律")
  // 扫①：退役提示词文件对照锚 → 收归 test/doc-consistency.test.mjs T75（防回潮族）
})

test("T32b 接线：designer 子代理实选场景 = 'eng-designer'（setup 内层选择器——非 engineering/normal）", async () => {
  // 真实装配面：systemPrompt 即场景槽拼接结果（内层选择器误映射 → 拿到主会话人格 = 静默错配）
  const designerRun = await prepareRun(setupAgent("eng-designer"), "task", {}, { depth: 1 })
  assert.ok(designerRun.systemPrompt.includes("写稿面唯一作者"), "designer 场景人格进 system prompt")
  assert.ok(!designerRun.systemPrompt.includes("产品经理 + 流程编排者"), "不是 engineering 场景（主会话人格）")
  assert.ok(!designerRun.systemPrompt.includes("ThinCoder, a coding agent"), "不是 normal 场景")
  assert.ok(designerRun.systemPrompt.includes("铁律"), "工程纪律槽在位（engineering=true 装配）")
  assert.ok(!designerRun.systemPrompt.includes("prompt slot file"), "无缺槽警告（防静默回退）")
  // 对照（反证非空转）：eng-coder 子代理走自己的场景（同一装配点）
  const coderRun = await prepareRun(setupAgent("eng-coder"), "task", {}, { depth: 1 })
  assert.ok(coderRun.systemPrompt.includes("被授权的实现者"), "eng-coder 场景人格（对照）")
  assert.ok(!coderRun.systemPrompt.includes("写稿面唯一作者"), "两场景不串")

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
  const built = buildDesigner(engParent(), { task: "写设计", batchDoc: rel })
  assert.ok(built.input.includes(`Batch record (batchDoc): ${abs}`), "注入行含绝对路径")
  // sync 路径同款（双路覆盖——校验在 buildSpawnChild）
  const sync = buildDesigner(engParent(), { task: "写设计", batchDoc: rel }, false)
  assert.ok(sync.input.includes(`Batch record (batchDoc): ${abs}`), "sync 路径同样注入")
  // 对照：explore 不带 batchDoc 不受影响（门只管工程角色）
  const explore = buildSpawnChild(engParent(), { agent: engParent(), callbacks: {} }, { task: "audit" }, "explore", true, [], [], null)
  assert.ok(!explore.input.includes("Batch record (batchDoc)"), "explore 不注入、不校验")
})

// ═════════════════════════════════════════════════════════════════════════════
// T34 边界：写域 = 提示词级（AC19）
// ═════════════════════════════════════════════════════════════════════════════
test("T34 边界：persona 双源明写写域（docs/ 扣除 docs/design/prompts/）+ dispatch.mjs 无新增写域判定", () => {
  for (const f of ["src/prompts/persona-eng-designer.md", "docs/design/prompts/persona-eng-designer.md"]) {
    const t = read(f)
    assert.ok(t.includes("docs/design/prompts/"), `${f}: 写域扣除面在位`)
    assert.ok(t.includes("docs/"), `${f}: 写域基底在位`)
    assert.match(t, /写域|write domain/i, `${f}: 写域声明缺失`)
    assert.match(t, /src\/\*\*/, `${f}: 写域边界（src 不碰）缺失`)
  }
  // 机械层零变更（用户裁定：不需要机械门禁）——dispatch 无 designer 判定
  const dispatch = read("src/agent/dispatch.mjs")
  assert.ok(!dispatch.includes("eng-designer"), "dispatch.mjs 无新增写域判定（机械层零变更）")
  assert.match(dispatch, /if \(agent\._role === "eng-coder" && agent\.config\?\.agent\?\.engineering/, "既有 eng-coder 门保持原样（零回归对照）")
  assert.match(dispatch, /if \(agent\.config\?\.agent\?\.engineering && depth === 0/, "父侧设计门保持原样（零回归对照）")
})

// ═════════════════════════════════════════════════════════════════════════════
// T35 边界：勘察受限（AC20）
// ═════════════════════════════════════════════════════════════════════════════
test("T35 边界：designer 受限 schema（explore-only / 无 async·token·batchDoc）+ 机械门 coder 拒 / explore 允且不占审计预算", async () => {
  const { toolByName } = await prepareRun(setupAgent("eng-designer"), "task", {}, { depth: 1 })
  const sub = toolByName.get("subagent")
  assert.deepEqual(sub.parameters.properties.role.enum, ["explore"], "designer 通道 explore-only")
  for (const k of ["async", "id", "n", "designToken", "designId", "batchDoc"]) {
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
  const built = buildDesigner(engParent(), { task: "写设计", batchDoc: rel })
  assert.ok(built.child, "无 token 也装配成 child")
  assert.ok(!built.child._engDesignReviewed, "designer 无设计评审解锁标记（token 面不适用）")
  // 对照：eng-coder 同场景（无 token）→ token 门拒
  const e = catchErr(() => buildSpawnChild(engParent(), { agent: engParent(), callbacks: {} }, { task: "实现", batchDoc: rel }, "eng-coder", true, [], [], null))
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
  const built = buildDesigner(engParent(), { task: "写设计", batchDoc: rel })
  assert.equal(built.child._engTaskAuthorized, undefined, "designer 无任务域豁免（保持人在回路）")
})

// ═════════════════════════════════════════════════════════════════════════════
// T40 边界：写权路由单一口径（AC27——六面 + 无残留）
// ═════════════════════════════════════════════════════════════════════════════
test("T40 边界：写权路由六面（§2.2 step1/step10 · §2.5 · §2.6 F2 · §2.8 · §2.15 A2）+ 双源 persona-engineering 调用链", () => {
  const em = read("docs/design/ENGINEERING-MODE.md")
  // §2.2 step 1（设计档写权路由）
  assert.match(em, /写设计档 `docs\/design\/`（三层：需求\/设计\/测试；按业务板块组织）——\*\*本批起路由 eng-designer\*\*/, "step1 路由句缺失")
  // §2.2 step 10（勾销 → 批次档 §6，不进设计档）
  assert.match(em, /验收勾销落批次档 §6/, "step10 勾销归属句缺失")
  assert.match(em, /勾销不进设计档/, "step10「不进设计档」句缺失")
  // §2.5（设计评审修订 → designer）
  assert.match(em, /修订落档经 eng-designer/, "§2.5 路由句缺失")
  // §2.6 F2（修正轮 docs FIRST 落档 → designer）
  assert.match(em, /落档动作经 eng-designer/, "§2.6 F2 路由句缺失")
  // §2.8（实现中设计变更 → designer）
  assert.match(em, /转 eng-designer 更新设计档（写稿权唯一/, "§2.8 路由句缺失")
  // §2.15 A2（写权矩阵本体）
  assert.match(em, /### 2\.15 eng-designer 角色/, "§2.15 本体缺失")
  assert.match(em, /\*\*A2\. 调用链与写权路由/, "A2 写权表缺失")
  // §2.8 活路线正句（旧路由/勾销两负向锚已收归接收档 T76；正则式勾销负向锚删除：重复——本行上方
  // step10 正向锚已锁「勾销落批次档 §6 / 不进设计档」；扫① 2026-09-11）
  const sec28 = em.slice(em.indexOf("### 2.8 错误与恢复"), em.indexOf("### 2.9"))
  assert.ok(sec28.length > 100, "§2.8 slice 非空")
  assert.match(sec28, /转 eng-designer 更新设计档/, "§2.8 目标态路由句缺失")
  // persona-engineering 双源：调用链段（批次档 → spawn eng-designer（带 files）→ 核验 → 提醒评审 →
  // 评审 pass 后逐条裁决 →（如需修正）修正轮落地并经核验 → 批准——第 9 批 PROMPT-REVIEW-ORDER 节点）
  for (const f of ["src/prompts/persona-engineering.md", "docs/design/prompts/persona-engineering.md"]) {
    const t = read(f)
    assert.match(t, /调用链/, `${f}: 调用链段标题缺失`)
    assert.match(t, /spawn eng-designer/, `${f}: spawn eng-designer 指令缺失`)
    assert.match(t, /batchDoc=/, `${f}: batchDoc 参数示例缺失`)
    assert.match(t, /files=\[\.\.\.\]/, `${f}: files 声明示例缺失`)
    assert.ok(t.includes("评审 pass 后逐条裁决"), `${f}: 链行「评审 pass 后逐条裁决」节点缺失`)
    assert.ok(t.includes("修正轮落地并经核验"), `${f}: 链行「修正轮落地并经核验」节点缺失`)
    // 身份句类负向锚（三条）→ 收归接收档 T76（扫① 2026-09-11）
  }
  // docs/README.md 作者口径一致（RF-3a/3b——第 16 批落笔：过期限定行断言反转为零命中）
  const rd = read("docs/README.md")
  assert.match(rd, /eng-designer 产物/, "README §1 目录行作者口径缺失")
  assert.match(rd, /\| 需求层 \|[^\n|]*\|[^\n|]*\| eng-designer \|/, "README §3.1 作者表 designer 行（去过渡限定）缺失")
  // AGENTS.md 需求基线口径（RF-3c——同批落笔；旧归属句负向锚 → 收归接收档 T76，扫① 2026-09-11）
  const ag = read("AGENTS.md")
  assert.ok(ag.includes("均 **eng-designer 产物**"), "AGENTS.md 需求基线口径句缺失")
})
