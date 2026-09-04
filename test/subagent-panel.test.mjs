/**
 * subagent-panel.test.mjs — tests extracted per AGENT-LOOP.md §18.14 (test files split by domain).
 * Source(s): subagent.test.mjs.
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"


// ═══════════════════════════════════════════════════════════════════════════
// §19.6 subagent panel 检查工具（AGENT-LOOP.md §19.6——T-P1..P5 + N/E/A 展开）
// ═══════════════════════════════════════════════════════════════════════════

const noopRender = () => {}
const panelToolCtx = (agent, tokens) => ({
  agent, depth: 0,
  callbacks: tokens ? { onToken: (t) => tokens.push(t) } : {},
})


test("§19.6 T-P1: panel view 返回镜像——1 running + 1 awaitingDigest 已消化（状态准确 + digested 标注）", async () => {
  const mods = await import("../src/tui/subagent-blocks.mjs")
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const { routeSubToken } = mods
  const agent = { _pendingAsyncResults: [], _asyncSubagents: new Map() }
  const state = { subTasks: {}, lines: [], _frozenSubKeys: new Set(), _agent: agent }
  // 两面板块：explore#1 running（文本流中）+ eng-coder#9 settled（报告已被 digest 消费）
  routeSubToken(state, "explore#1/搜索中...", noopRender)
  routeSubToken(state, "eng-coder#9/hello", noopRender)
  routeSubToken(state, "eng-coder#9/⟦ev⟧settled\x1e0\x1e0\x1esettled\x1e", noopRender)
  assert.equal(agent._panelSnapshot.length, 2, "镜像 2 块")
  const view = JSON.parse(String(await subagentTool.execute({ action: "panel" }, panelToolCtx(agent))))
  assert.ok(!view.degraded, "有镜像 → 非降级")
  const runB = view.panel.find((b) => b.key === "explore#1")
  const digB = view.panel.find((b) => b.key === "eng-coder#9")
  assert.equal(runB.status, "running", "running 块状态准确")
  assert.equal(runB.role, "explore")
  assert.equal(typeof runB.elapsedSec, "number", "elapsedSec 读时算（round1 #4——不暴露 startedAt）")
  assert.equal(runB.startedAt, undefined, "startedAt 不出现在视图（读时算 elapsed）")
  assert.equal(digB.status, "awaitingDigest", "settled 驻留 → awaitingDigest 状态")
  assert.equal(digB.digested, true, "pending/池均无对应（报告已消化）→ digested:true——异常驻留标注（round1 #3）")
  // 对照（N 路径）：awaitingDigest 但 pending 仍有对应（报告未达模型）→ digested:false
  const agent2 = { _pendingAsyncResults: [{ id: 7, role: "explore", report: "r" }], _asyncSubagents: new Map() }
  const state2 = { subTasks: {}, lines: [], _frozenSubKeys: new Set(), _agent: agent2 }
  routeSubToken(state2, "explore#7/hello", noopRender)
  routeSubToken(state2, "explore#7/⟦ev⟧settled\x1e0\x1e0\x1esettled\x1e", noopRender)
  const view2 = JSON.parse(String(await subagentTool.execute({ action: "panel", view: true }, panelToolCtx(agent2))))
  const pendB = view2.panel.find((b) => b.key === "explore#7")
  assert.equal(pendB.status, "awaitingDigest")
  assert.equal(pendB.digested, false, "pending 有对应 → 非 digested（正常驻留——下轮 digest 自动回收）")
})



test("§19.6 T-P2: freeze 已消化驻留块 → done 冻结 token 发出 → mock TUI 回收（块冻结进流 + 镜像刷新）", async () => {
  const mods = await import("../src/tui/subagent-blocks.mjs")
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const { routeSubToken } = mods
  const agent = { _pendingAsyncResults: [], _asyncSubagents: new Map() }
  const state = { subTasks: {}, lines: [], _frozenSubKeys: new Set(), _agent: agent }
  // 面板 1 驻留块（已消化——pending/池均空）；settle 锚点后另有流内容（digest 文本已在其后——
  // 补发冻结应 splice 落 settle 锚点——digest 总览之前——§17.5.5 同口径）
  routeSubToken(state, "eng-coder#9/hello", noopRender)
  routeSubToken(state, "eng-coder#9/⟦ev⟧settled\x1e0\x1e0\x1esettled\x1e", noopRender)
  const anchor = state.subTasks["eng-coder#9"]._freezeAt
  state.lines.push({ text: "digest 总览: 要点", color: undefined })
  assert.ok(state.subTasks["eng-coder#9"], "驻留块在面板（用户仍见）")
  // freeze 门控通过 → done 哨兵字面 token 发出（settle 同机制格式）
  const tokens = []
  const r = JSON.parse(String(await subagentTool.execute({ action: "panel", freeze: "eng-coder#9" }, panelToolCtx(agent, tokens))))
  assert.equal(r.status, "frozen", "freeze 成功返回")
  assert.equal(r.key, "eng-coder#9")
  assert.deepEqual(tokens, ["eng-coder#9/⟦ev⟧done\x1e0\x1e0\x1edone\x1e"], "发出 key + '/' + done 哨兵字面 token（onToken——TUI routeSubToken 冻结回收）")
  // mock TUI 消费该 token → 块冻结回收（splice 落 settle 锚点——digest 总览之前）+ 镜像刷新
  assert.equal(routeSubToken(state, tokens[0], noopRender), true, "TUI routeSubToken 消费 done 冻结事件")
  assert.equal(state.subTasks["eng-coder#9"], undefined, "块从驻留面板移除")
  assert.ok(state._frozenSubKeys.has("eng-coder#9"), "tombstone 登记（晚到 token 不复活）")
  const carrierIdx = state.lines.findIndex((l) => l._frozenSubTask?.key === "eng-coder#9")
  const digestIdx = state.lines.findIndex((l) => String(l.text).includes("digest 总览"))
  assert.ok(carrierIdx >= 0 && carrierIdx < digestIdx, "冻结载体 splice 落 settle 锚点——digest 总览之前（round1 #2 落位规则）")
  assert.deepEqual(agent._panelSnapshot, [], "镜像刷新——块移出")
})



test("§19.6 T-P3: freeze pending 有对应的块 → 拒绝（不破坏消化顺序——报告未达模型）", async () => {
  const mods = await import("../src/tui/subagent-blocks.mjs")
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const { routeSubToken } = mods
  // pending 有对应（explore#7——报告未达模型）：拒绝——提前回收破坏消化顺序
  const agent = { _pendingAsyncResults: [{ id: 7, role: "explore", report: "r" }], _asyncSubagents: new Map() }
  const state = { subTasks: {}, lines: [], _frozenSubKeys: new Set(), _agent: agent }
  routeSubToken(state, "explore#7/hello", noopRender)
  routeSubToken(state, "explore#7/⟦ev⟧settled\x1e0\x1e0\x1esettled\x1e", noopRender)
  const tokens = []
  const r = JSON.parse(String(await subagentTool.execute({ action: "panel", freeze: "explore#7" }, panelToolCtx(agent, tokens))))
  assert.equal(r.status, "error", "门控拒绝")
  assert.ok(r.error.includes("still genuinely awaiting digestion"), `拒绝原因明确——got: ${r.error}`)
  assert.ok(r.error.includes("digestion order"), "错误含消化顺序语义")
  assert.deepEqual(tokens, [], "拒绝不发 token——块未动")
  assert.ok(state.subTasks["explore#7"], "块仍驻留（未破坏消化顺序）")
})



test("§19.6 T-P4: freeze running 块 / 不存在的 key / done 块 → 拒绝（错误信息明确）", async () => {
  const mods = await import("../src/tui/subagent-blocks.mjs")
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const { routeSubToken } = mods
  const agent = { _pendingAsyncResults: [], _asyncSubagents: new Map() }
  const state = { subTasks: {}, lines: [], _frozenSubKeys: new Set(), _agent: agent }
  // running 块 → 拒绝（settle 时自冻——不误冻）
  routeSubToken(state, "explore#1/搜索中...", noopRender)
  let r = JSON.parse(String(await subagentTool.execute({ action: "panel", freeze: "explore#1" }, panelToolCtx(agent))))
  assert.equal(r.status, "error")
  assert.ok(r.error.includes("running"), `running 拒绝原因——got: ${r.error}`)
  // 池有对应运行条目 → 拒绝（防御——非已消化驻留块）
  const agent2 = { _pendingAsyncResults: [], _asyncSubagents: new Map([[9, { id: 9, role: "eng-coder", status: "running" }]]) }
  const state2 = { subTasks: {}, lines: [], _frozenSubKeys: new Set(), _agent: agent2 }
  routeSubToken(state2, "eng-coder#9/hello", noopRender)
  routeSubToken(state2, "eng-coder#9/⟦ev⟧settled\x1e0\x1e0\x1esettled\x1e", noopRender)
  const r2 = JSON.parse(String(await subagentTool.execute({ action: "panel", freeze: "eng-coder#9" }, panelToolCtx(agent2))))
  assert.equal(r2.status, "error")
  assert.ok(r2.error.includes("live pool entry"), "池有对应 → 拒绝")
  // 不存在的 key → 拒绝（错误列出现有块——模型可自助修正）
  r = JSON.parse(String(await subagentTool.execute({ action: "panel", freeze: "explore#99" }, panelToolCtx(agent))))
  assert.equal(r.status, "error")
  assert.ok(r.error.includes("unknown panel block key"), `未知 key 拒绝——got: ${r.error}`)
  assert.ok(r.error.includes("explore#1(running)"), "错误含现有块清单")
  // done 块（done 但未冻结的瞬时态）→ 拒绝（非 awaitingDigest）
  const agent3 = { _pendingAsyncResults: [], _asyncSubagents: new Map() }
  const state3 = { subTasks: {}, lines: [], _frozenSubKeys: new Set(), _agent: agent3 }
  routeSubToken(state3, "coder#1/hello", noopRender)
  const { finishSubTaskKey } = mods
  finishSubTaskKey(state3, "coder#1", null)
  const r3 = JSON.parse(String(await subagentTool.execute({ action: "panel", freeze: "coder#1" }, panelToolCtx(agent3))))
  assert.equal(r3.status, "error")
  assert.ok(r3.error.includes("done"), `done 拒绝原因——got: ${r3.error}`)
})



test("§19.6 T-P5: headless（无镜像）→ view 降级池视图 + no panel 注——freeze 报不可用", async () => {
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  // view：无 _panelSnapshot（headless/VS Code/子代理上下文）→ 降级池视图（池 + pending 合成）
  const agent = {
    _asyncSubagents: new Map([
      ["1", { id: 1, role: "eng-coder", status: "running", startedAt: Date.now() - 5000 }],
      ["2", { id: 2, role: "explore", status: "queued", position: 1 }],
    ]),
    _asyncQueue: [{ id: 2, role: "explore", status: "queued", position: 1 }],
    _pendingAsyncResults: [{ id: 3, role: "coder", report: "r" }],
  }
  const view = JSON.parse(String(await subagentTool.execute({ action: "panel" }, panelToolCtx(agent))))
  assert.equal(view.degraded, true, "降级标注")
  assert.ok(view.note.includes("no panel"), "no panel 注（CLI-only 完整能力——AC-P4 声明面）")
  const runB = view.panel.find((b) => b.key === "eng-coder#1")
  assert.equal(runB.status, "running", "降级视图含池运行条目")
  assert.ok(runB.elapsedSec >= 4 && runB.elapsedSec <= 6, "池条目 elapsedSec 合成")
  const qB = view.panel.find((b) => b.key === "explore#2")
  assert.equal(qB.status, "queued", "排队条目含 position 信息")
  assert.equal(qB.position, 1)
  const pB = view.panel.find((b) => b.key === "coder#3")
  assert.equal(pB.status, "awaitingDigest", "pending 条目合成 awaitingDigest")
  // freeze：无镜像 → 不可用（明确报错）
  const fr = JSON.parse(String(await subagentTool.execute({ action: "panel", freeze: "eng-coder#1" }, panelToolCtx(agent))))
  assert.equal(fr.status, "error")
  assert.ok(fr.error.includes("no CLI TUI panel mirror"), `freeze 不可用原因——got: ${fr.error}`)
  // 无镜像 + 空池 → 空降级视图（非 undefined——JSON 形状稳定）
  const empty = JSON.parse(String(await subagentTool.execute({ action: "panel" }, panelToolCtx({ _asyncSubagents: new Map(), _pendingAsyncResults: [] }))))
  assert.equal(empty.degraded, true)
  assert.deepEqual(empty.panel, [])
})



test("§19.6 N/E 展开: freeze depth>0 拒绝 / view:false 无 freeze 报错 / 空面板镜像返回空数组 / 未知 action 报错列 panel", async () => {
  const mods = await import("../src/tui/subagent-blocks.mjs")
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const { routeSubToken } = mods
  // depth>0 freeze：子代理上下文无面板（同 cancel 深度门控）
  const agent = { _pendingAsyncResults: [], _asyncSubagents: new Map() }
  const state = { subTasks: {}, lines: [], _frozenSubKeys: new Set(), _agent: agent }
  routeSubToken(state, "explore#1/hello", noopRender)
  routeSubToken(state, "explore#1/⟦ev⟧settled\x1e0\x1e0\x1esettled\x1e", noopRender)
  const d = JSON.parse(String(await subagentTool.execute({ action: "panel", freeze: "explore#1" }, { agent, depth: 1, callbacks: {} })))
  assert.equal(d.status, "error")
  assert.ok(d.error.includes("depth 0"), "freeze 仅 depth-0")
  // view:false 且无 freeze → 双参互斥语义：无请求可执行——明确报错（不静默返回视图）
  const vf = JSON.parse(String(await subagentTool.execute({ action: "panel", view: false }, panelToolCtx(agent))))
  assert.equal(vf.status, "error")
  assert.ok(vf.error.includes("nothing to do"), `view:false 无 freeze 报错——got: ${vf.error}`)
  // 挂载但空面板 → 返回 []（区分"空面板"与"无镜像"——非降级）
  const agent2 = { _panelSnapshot: [], _pendingAsyncResults: [], _asyncSubagents: new Map() }
  const v2 = JSON.parse(String(await subagentTool.execute({ action: "panel" }, panelToolCtx(agent2))))
  assert.equal(v2.degraded, undefined, "空面板镜像非降级")
  assert.deepEqual(v2.panel, [])
  // freeze 门控通过但 ctx 无 token relay → 错误（镜像在但到不了 TUI）
  const nt = JSON.parse(String(await subagentTool.execute({ action: "panel", freeze: "explore#1" }, { agent, depth: 0, callbacks: {} })))
  assert.equal(nt.status, "error")
  assert.ok(nt.error.includes("token relay"), "无 relay → freeze 无法送达——报错")
  // 未知 action 错误信息列 panel
  await assert.rejects(subagentTool.execute({ action: "bogus" }, panelToolCtx(agent)), /panel/, "未知 action 错误列全部六动作")
})



test("§19.6 动作域: digest（手动档）内 panel view 放行（只读面）——freeze 按控制类放行（同 cancel）", async () => {
  const mods = await import("../src/tui/subagent-blocks.mjs")
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const { routeSubToken } = mods
  const agent = { config: { agent: {} }, _inAutoTurn: true, autoApprove: false, _pendingAsyncResults: [], _asyncSubagents: new Map() }
  const state = { subTasks: {}, lines: [], _frozenSubKeys: new Set(), _agent: agent }
  routeSubToken(state, "explore#1/hello", noopRender)
  // view（自省类——readonly）digest 内放行
  const view = JSON.parse(String(await subagentTool.execute({ action: "panel" }, { agent, depth: 0, callbacks: {} })))
  assert.equal(view.degraded, undefined, "view 执行到动作本身——未被 digest 门拒绝")
  assert.equal(view.panel[0].status, "running")
  // freeze（控制类——同 cancel 域）digest 内放行：门控拒绝到达动作本身（running——非 digest 门）
  routeSubToken(state, "explore#1/⟦ev⟧settled\x1e0\x1e0\x1esettled\x1e", noopRender)
  const tokens = []
  const fr = JSON.parse(String(await subagentTool.execute({ action: "panel", freeze: "explore#1" }, { agent, depth: 0, callbacks: { onToken: (t) => tokens.push(t) } })))
  assert.equal(fr.status, "frozen", "freeze 在 digest 内执行成功——控制类放行（19.5.3 动作域——D-S7 分类扩展）")
  assert.deepEqual(tokens, ["explore#1/⟦ev⟧done\x1e0\x1e0\x1edone\x1e"], "冻结 token 照常发出")
  // 对照：同 ctx 下 spawn 仍机械拒绝
  const sp = String(await subagentTool.execute({ task: "x", role: "coder", async: true }, { agent, depth: 0, callbacks: {} }))
  assert.ok(sp.includes("cannot spawn subagents from a manual auto-turn"), "digest 内 spawn 仍拒绝")
})



test("§19.6 门禁分类（round1 #5）: planMode 下 panel view（只读类）/freeze（控制类）放行；混合批审批 freeze/view 不入组", async () => {
  const { executeToolCalls } = await import("../src/agent/dispatch.mjs")
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const noopWrite = { name: "write", readonly: false, execute: async () => "wrote" }
  const tools = new Map([["subagent", subagentTool], ["write", noopWrite]])
  const cwd = mkdtempSync(join(tmpdir(), "cli-panel-gate-"))
  const mkAgent = (planMode) => ({
    cwd, config: { agent: {} }, planMode, autoApprove: false,
    _touchedFiles: [], _mutatedThisRun: false,
    _panelSnapshot: [{ key: "eng-coder#9", role: "eng-coder", status: "awaitingDigest", startedAt: Date.now() - 4000 }],
    _pendingAsyncResults: [], _asyncSubagents: new Map(),
  })
  try {
    // 批内 freeze 需要 token relay（dispatch callbacks.onToken——真实 TUI 恒有）
    const tokens = []
    const cbs = { onToken: (t) => tokens.push(t) }
    // planMode：panel view + panel freeze 均放行（view 只读——freeze 控制类豁免）
    const res = await executeToolCalls(mkAgent(true), tools, [
      { name: "subagent", arguments: JSON.stringify({ action: "panel" }) },
      { name: "subagent", arguments: JSON.stringify({ action: "panel", freeze: "eng-coder#9" }) },
      { name: "subagent", arguments: JSON.stringify({ action: "spawn", task: "x", role: "coder" }) },
    ], cbs, 0)
    assert.equal(res[0].ok, true, "planMode 下 panel view 放行（readonly 分类）")
    assert.ok(res[0].result.includes('"panel"'), "view 返回面板")
    assert.ok(res[0].result.includes("awaitingDigest"), "view 状态含 awaitingDigest")
    assert.equal(res[1].ok, true, "planMode 下 panel freeze 放行（控制类豁免）")
    assert.ok(res[1].result.includes('"frozen"'), "freeze 门控通过执行成功")
    assert.deepEqual(tokens, ["eng-coder#9/⟦ev⟧done\x1e0\x1e0\x1edone\x1e"], "freeze token 经 dispatch relay 发出")
    assert.equal(res[2].ok, false, "planMode 下 spawn 仍拒绝（对照）")
    assert.ok(res[2].result.includes("plan mode"))
    // 混合批次：panel view/freeze 不入审批组——批询问只含两个 write
    const asks = []
    const res2 = await executeToolCalls(mkAgent(false), tools, [
      { name: "subagent", arguments: JSON.stringify({ action: "panel" }) },
      { name: "subagent", arguments: JSON.stringify({ action: "panel", freeze: "eng-coder#9" }) },
      { name: "write", arguments: JSON.stringify({ path: "a.mjs", content: "1" }) },
      { name: "write", arguments: JSON.stringify({ path: "b.mjs", content: "2" }) },
    ], {
      onBatchPermissionRequest: async (req) => { asks.push(req); return "approveAll" },
      onToken: (t) => tokens.push(t),
    }, 0)
    assert.equal(asks.length, 1, "同批一次合并询问")
    assert.deepEqual(asks[0].tools.map((t) => t.name), ["write", "write"], "panel view/freeze 不入审批组（只读 + 控制类——按 action 分组）")
    assert.equal(res2.every((r) => r.ok), true, "approveAll 后全批执行")
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})
