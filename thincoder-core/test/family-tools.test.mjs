/**
 * family-tools.test.mjs — 家族矩阵单源机判断言（批次 `2026-09-15-vsc-tool-table-dup` §2.6 行 5）。
 *
 * 面 = 纯函数 `assembleFamilyTools`（`agent/family-tools.mjs`——家族矩阵自 `agent/setup.mjs`
 * 迁出的单源实现，CLI 与 VSC 同调）：**5 角色必备 fixture 名集**（depth-0 默认 / eng-designer /
 * eng-coder / coder / explore）× 矩阵单源 + consult 池门 + `decorate` 两面（缺省 = 核默认形态；
 * 注入 = 端差实例原样透传）。
 *
 * 「改核矩阵 ⇒ 红」的最早失败面：端侧断言（`thincoder-vscode/test/integration/
 * host-shape-spawn.test.mjs` T5）与本档同 fixture 口径——核内改一处矩阵本档先红。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { assembleFamilyTools } from "../agent/family-tools.mjs"
import { taskTool } from "../agent-tools/task.mjs"
import { handleCompletion } from "../agent/completion.mjs"

/** 名集读数（保持返回序——固定段 + 家族段序也是契约面）。 */
const names = (tools) => tools.map((t) => t.name)
const sorted = (tools) => names(tools).sort()

const BATCH = "docs/batches/2026-09-15-demo.md"
const FIXED = ["task", "plan", "timer"]

/** 必备 5 角色 fixture（期望名集**乱序比较**——序另有断言面）。 */
const ROLE_FIXTURES = [
  {
    label: "depth-0 默认（无 decorate ⇒ 核默认形态）",
    args: { depth: 0 },
    // context-tool 批（2026-09-21 · D-CC23/D-CC28）：depth-0 家族段 + `context`（子代理面不给）
    expect: ["task", "plan", "timer", "subagent", "skill", "goal", "eng", "verify", "recent_changes", "read_history", "context", "advisor", "batch", "ledger_add", "ledger_close", "ledger_update"],
  },
  {
    label: "eng-designer（depth>0）",
    args: { depth: 1, role: "eng-designer", batchDoc: BATCH },
    expect: ["task", "plan", "timer", "batch", "subagent", "notify_parent"],
  },
  {
    label: "eng-coder（depth>0）",
    args: { depth: 1, role: "eng-coder", batchDoc: BATCH },
    expect: ["task", "plan", "timer", "advisor", "verify", "batch", "subagent", "notify_parent"],
  },
  {
    label: "coder（depth>0）",
    args: { depth: 1, role: "coder" },
    expect: ["task", "plan", "timer", "verify", "advisor", "notify_parent"],
  },
  {
    label: "explore（depth>0——只读子代）",
    args: { depth: 1, role: "explore" },
    expect: ["task", "plan", "timer", "notify_parent"],
  },
  {
    label: "consult（depth>0——会诊子代）",
    args: { depth: 1, role: "consult" },
    expect: ["task", "plan", "timer", "recent_changes"],
  },
]

test("家族矩阵：5 角色必备 fixture + consult 名集逐名相等（乱序比较）", async () => {
  for (const f of ROLE_FIXTURES) {
    const got = sorted(await assembleFamilyTools(f.args))
    assert.deepEqual(got, [...f.expect].sort(), `角色面名集：${f.label}`)
  }
})

test("固定段序：task → plan → timer 恒为前 3 项；家族段随后（装配契约序）", async () => {
  for (const f of ROLE_FIXTURES) {
    const got = names(await assembleFamilyTools(f.args))
    assert.deepEqual(got.slice(0, 3), FIXED, `固定段序：${f.label}`)
    assert.equal(got.length, f.expect.length, `无缺无余：${f.label}`)
    assert.deepEqual([...new Set(got)], got, `段内不得重名：${f.label}`)
  }
})

test("T10 固定段模式裁剪（FR31 ① / AC12 + F10）：工程模式固定段 = [timer]（plan / task 不入表——深度无分支）；普通面含 plan + task（回归）", async () => {
  // 工程面 depth-0：plan / task 缺失 + 固定段序契约（timer 居首——装配契约序保持）
  const eng0 = names(await assembleFamilyTools({ depth: 0, engineering: true }))
  assert.ok(!eng0.includes("plan"), "depth-0 工程面不含 plan（模型不可见——KD8 卸载而非注册+报错）")
  assert.ok(!eng0.includes("task"), "depth-0 工程面不含 task（F10——机械停用，同 KD8 卸载）")
  assert.deepEqual(eng0.slice(0, 1), ["timer"], "工程固定段 = [timer]（序契约）")
  assert.ok(eng0.includes("subagent") && eng0.includes("eng"), "家族段不受裁剪影响（只裁固定段的 plan / task）")
  // 全深度（KD11）：工程角色子代理面同裁——`subagent-spawn.mjs:341-344` 工程角色强制位
  // `engineering: true` ⇒ 子代装配即以本参数调用本函数（未决项 1 复核面）
  for (const role of ["eng-coder", "eng-designer", "explore"]) {
    const got = names(await assembleFamilyTools({ depth: 1, role, engineering: true, batchDoc: BATCH }))
    assert.ok(!got.includes("plan"), `工程子代理面不含 plan（role=${role}——全深度）`)
    assert.ok(!got.includes("task"), `工程子代理面不含 task（role=${role}——全深度 · F10）`)
    assert.deepEqual(got.slice(0, 1), ["timer"], `工程子代理固定段序（role=${role}）`)
  }
  // 普通面回归（FR31 边界 / F10 边界：普通模式零改）——固定段逐字不变
  const normal0 = names(await assembleFamilyTools({ depth: 0 }))
  assert.ok(normal0.includes("plan") && normal0.includes("task"), "普通 depth-0 面含 plan + task")
  assert.deepEqual(normal0.slice(0, 3), FIXED, "普通固定段逐字不变（task → plan → timer）")
  const normalChild = names(await assembleFamilyTools({ depth: 1, role: "explore" }))
  assert.ok(normalChild.includes("plan") && normalChild.includes("task"), "普通 depth>0 面含 plan + task（深度不参与判据）")
  // T10 输入面第四格：`{depth:1, role:"plan"}`（普通模式 plan 角色）——名集仍含 plan（非工程 ⇒ 不裁）
  const planChild = names(await assembleFamilyTools({ depth: 1, role: "plan" }))
  assert.ok(planChild.includes("plan"), "普通 plan 子代理面含 plan（T10 列明输入面）")
})

// ═══ F10 task 工程模式机械停用（双层门——装配面在 T10，本块 = execute 门 / 催更门）═══════

test("F10-3/F10-4 装配两态：工程 depth-0 与 eng 子代理面零 `task`；非工程两态逐字含（既有名集回归）", async () => {
  const eng0 = names(await assembleFamilyTools({ depth: 0, engineering: true }))
  assert.ok(!eng0.includes("task"), "depth-0 工程面零 task")
  for (const role of ["eng-designer", "eng-coder"]) {
    const got = names(await assembleFamilyTools({ depth: 1, role, engineering: true, batchDoc: BATCH }))
    assert.ok(!got.includes("task"), `eng 子代理面零 task（role=${role}）`)
  }
  const plane0 = names(await assembleFamilyTools({ depth: 0, engineering: false }))
  assert.ok(plane0.includes("task"), "depth-0 非工程面含 task（普通段逐字零变）")
  const planeChild = names(await assembleFamilyTools({ depth: 1, role: "eng-coder", batchDoc: BATCH }))
  assert.ok(planeChild.includes("task"), "非工程 eng-coder 面含 task（既有名集零变）")
})

test("F10-1 工程模式拒（零副作用）：task.execute 返回拒句含 engineering + 批次档/台账指引；列表与预算零变", async () => {
  const agent = { config: { agent: { engineering: true } }, tasks: [{ title: "旧条目", status: "pending" }] }
  const snapshot = JSON.parse(JSON.stringify(agent.tasks))
  const out = String(await taskTool.execute({ items: [{ title: "新条目", status: "in_progress" }] }, { agent, depth: 0 }))
  assert.match(out, /engineering mode is ON/, "拒句含 engineering（先例形态 = escalate）")
  assert.match(out, /batch record/, "拒句指引追踪权威面（批次档）")
  assert.match(out, /ledger/, "拒句指引追踪权威面（台账）")
  assert.deepEqual(agent.tasks, snapshot, "零副作用：列表不变（拒门先于 alias 归一 / 归零 / 回调）")
  assert.equal(agent._taskPushbacks, undefined, "零副作用：预算字段未被归零")
})

test("F10-2 普通模式零变：task.execute 照常成功（Task list updated）；无 engineering 位同判", async () => {
  for (const cfg of [{ agent: {} }, { agent: { engineering: false } }, undefined]) {
    const agent = { config: cfg, tasks: [], history: [], _fullHistory: [] }
    const out = String(await taskTool.execute({ items: [{ title: "普通任务", status: "pending" }] }, { agent, depth: 0 }))
    assert.match(out, /Task list updated/, `普通模式成功回执（既有语义——cfg=${JSON.stringify(cfg)}）`)
    assert.equal(agent.tasks.length, 1, "普通模式列表照常落位")
    assert.equal(agent._taskPushbacks, 0, "普通模式预算归零照常（F10 零变面）")
  }
})

test("F10-5 催更门排除：工程模式不发 pending-task 催更（零提醒注入）；普通模式对照仍发", () => {
  const mk = (engineering) => ({
    config: { agent: engineering ? { engineering: true } : {} },
    tasks: [{ title: "pending-1", status: "pending" }], history: [], _fullHistory: [],
  })
  const eng = mk(true)
  const r1 = handleCompletion(eng, { content: "done for now" }, 0, 1, 0, false, 0, {})
  assert.equal(r1.action, "done", "工程模式不推回（被拒工具的指针不发——死胡同提醒防线）")
  assert.deepEqual(eng.history.filter((m) => m.role === "user"), [], "零提醒注入（user 行不发——assistant 行照常落地）")
  // 对照（反证非空转）：同桩普通模式 ⇒ 催更照发
  const normal = mk(false)
  const r2 = handleCompletion(normal, { content: "done for now" }, 0, 1, 0, false, 0, {})
  assert.equal(r2.action, "continue", "普通模式依旧推回（门本体零改）")
  assert.equal(normal._taskPushbacks, 1, "预算照常消耗")
  assert.ok(normal.history.some((m) => m.role === "user" && /pending tasks/.test(String(m.content))), "普通模式提醒句在位")
})

test("A1 上行通道（SUBAGENT-UPSTREAM-CHANNEL §6.27.10）：notify_parent 仅 depth>0 且非 consult 装配", async () => {
  const fallback = sorted(await assembleFamilyTools({ depth: 1, role: "sub" }))
  assert.deepEqual(fallback, ["task", "plan", "timer", "notify_parent"].sort(), "未列名 depth>0 role（兜底段）亦装配")
  const plan = sorted(await assembleFamilyTools({ depth: 1, role: "plan" }))
  assert.ok(plan.includes("notify_parent"), "plan（兜底段）含")
  const bare = sorted(await assembleFamilyTools({ depth: 0 }))
  assert.ok(!bare.includes("notify_parent"), "depth-0 主 agent 面不含（与用户的通道 = 普通回复 / question）")
  const eng = sorted(await assembleFamilyTools({ depth: 0, engineering: true }))
  assert.ok(!eng.includes("notify_parent"), "depth-0 工程模式面不含")
  const consult = sorted(await assembleFamilyTools({ depth: 1, role: "consult" }))
  assert.ok(!consult.includes("notify_parent"), "consult 段不装配（父发起的一次性会诊——角色语义边界）")
})

test("consult 池门：空池不注册；有池注册两件 + consult_start 描述携当前候选", async () => {
  const empty = names(await assembleFamilyTools({ depth: 1, role: "consult", consultModels: [] }))
  assert.ok(!empty.includes("consult_start") && !empty.includes("consult_stop"), "空池 ⇒ consult 家族零注册")

  const pool = [{ provider: "p1", model: "m1" }, { provider: "p2", model: "m2", effort: "high" }]
  const withPoolTools = await assembleFamilyTools({ depth: 0, consultModels: pool })
  const got = names(withPoolTools)
  assert.ok(got.includes("consult_start") && got.includes("consult_stop"), "有池 ⇒ consult 家族注册（两件）")
  const start = withPoolTools.find((t) => t.name === "consult_start")
  assert.match(start.description, /p1:m1/, "consult_start 描述列出当前候选（provider:model）")
  assert.match(start.description, /p2:m2 \(high\)/, "effort 后缀随池条目呈现")
})

test("decorate 缺省面 = 核默认形态：subagent role enum 随模式互斥（depth-0）", async () => {
  const normal = await assembleFamilyTools({ depth: 0, engineering: false })
  const normalSub = normal.find((t) => t.name === "subagent")
  assert.deepEqual(normalSub.parameters.properties.role.enum, ["explore", "plan", "coder"], "normal 模式 role enum")

  const eng = await assembleFamilyTools({ depth: 0, engineering: true })
  const engSub = eng.find((t) => t.name === "subagent")
  assert.deepEqual(engSub.parameters.properties.role.enum, ["explore", "eng-designer", "eng-coder"], "工程模式 role enum（F5 集——plan 不入）")

  const scheme = normal.find((t) => t.name === "subagent").parameters.properties.role
  assert.equal(scheme.type, "string", "role 参数形状不变（schema 面）")
  assert.ok(normal.every((t) => typeof t.name === "string"), "家族段全项带 name（装配面契约）")
})

test("decorate 注入面：端差实例原样透传（身份相等）+ settings 末位追加", async () => {
  const decorateSub = { name: "subagent", marker: "vsc-face" }
  const decorateStart = { name: "consult_start", marker: "vsc-pool" }
  const decorateStop = { name: "consult_stop", marker: "vsc-stop" }
  const decorateSettings = { name: "settings", marker: "vsc-end" }
  const got = await assembleFamilyTools({
    depth: 0,
    consultModels: [{ provider: "p1", model: "m1" }],
    decorate: { subagent: decorateSub, consultStart: decorateStart, consultStop: decorateStop, settings: decorateSettings },
  })
  assert.equal(got.find((t) => t.name === "subagent"), decorateSub, "subagent 装饰实例原样透传（同一引用）")
  assert.equal(got.find((t) => t.name === "consult_start"), decorateStart, "consultStart 装饰实例原样透传")
  assert.equal(got.find((t) => t.name === "consult_stop"), decorateStop, "consultStop 装饰实例原样透传")
  assert.equal(got.at(-1), decorateSettings, "settings 端差追加于家族段末位")
  // 缺省面：不传 decorate 时 settings 不出现（核默认 = settings 住基础集，非家族段）
  const bare = names(await assembleFamilyTools({ depth: 0 }))
  assert.ok(!bare.includes("settings"), "无 decorate ⇒ 家族段不含 settings")
  assert.ok(!bare.includes("consult_start"), "空池 ⇒ 家族段不含 consult 工具")
})
