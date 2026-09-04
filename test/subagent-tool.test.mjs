/**
 * subagent-tool.test.mjs — tests extracted per AGENT-LOOP.md §18.14 (test files split by domain).
 * Source(s): subagent.test.mjs.
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"



test("§19 T-M12: 描述/提示词内容引导——action/status/check 阻塞（内容断言——§18.11 起镜像锚在设计文档逐字定稿——两端各自照抄）", async () => {
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const d = subagentTool.description
  for (const probe of ["action:'check'", "action:'status'", "action:'escalate'", "BLOCKS until the target finishes", "NON-BLOCKING", "consumes nothing"]) {
    assert.ok(d.includes(probe), `subagent 描述缺 "${probe}"`)
  }
  // §19.6 NF-P（round1 #8）：六动作描述预算——panel 面引导（view 视图 + freeze 门控 + 降级注）
  for (const probe of ["action:'panel'", "digested:true", "awaitingDigest", "digestion order", "no panel"]) {
    assert.ok(d.includes(probe), `§19.6 subagent 描述缺 "${probe}"（六动作预算）`)
  }
  const actionDesc = subagentTool.parameters.properties.action.description
  assert.ok(actionDesc.includes("BLOCKS until the target finishes"), "action 参数描述含 check 阻塞警告")
  assert.ok(actionDesc.includes("panel"), "action 参数描述含 panel（§19.6）")
  // 提示词同步面（main.md/engineering.md/discipline.md——退役工具名已换 action 语义）
  const PROMPTS = new URL("../src/prompts/", import.meta.url)
  const mainMd = readFileSync(new URL("main.md", PROMPTS), "utf8")
  const engMd = readFileSync(new URL("engineering.md", PROMPTS), "utf8")
  const discMd = readFileSync(new URL("discipline.md", PROMPTS), "utf8")
  assert.ok(mainMd.includes("action:'check'") && mainMd.includes("action:'status'") && mainMd.includes("action:'escalate'"), "T-M12: main.md 动作面引用（check/status/escalate）")
  assert.ok(mainMd.includes("peek at progress without blocking via `action:'status'`"), "T-M12: main.md 引导查进度用 status")
  assert.ok(engMd.includes("`escalate` is unavailable in engineering mode") && engMd.includes("action:'escalate'"), "T-M12: engineering.md escalate 不可用 + 动作名")
  assert.ok(discMd.includes("action: spawn / check / status / escalate"), "T-M12: discipline.md 工具表四动作")
  assert.ok(!mainMd.includes("subagent_check"), "T-M12: main.md 无 subagent_check 名残留")
  assert.ok(!discMd.includes("| `escalate` |"), "T-M12: discipline.md 无独立 escalate 工具行")
})



test("§19.5.5 T-CL1: cancel 动作描述含核实纪律锚——last resort + verify alarming signals（fail-when-unchanged——AGENT-LOOP §19.5.5 D-CL1）", async () => {
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const d = subagentTool.description
  assert.ok(d.includes("Cancel is a last resort: verify alarming signals with reliable checks (git/node — not guesses) first"), "T-CL1: 最后手段 + 核实优先（可靠检查——非猜测）")
  assert.ok(d.includes("prefer scoped recovery (restore a single affected file) over killing the child"), "T-CL1: 最小干预——scoped recovery 优先于杀子代理")
  assert.ok(d.includes("a running child's in-flight work dies with it, partial changes stay unmerged and unaudited"), "T-CL1: §18 交付代价——in-flight 随杀而逝、partial 永不合并")
})



test("§19 T-M17: action 门控——planMode status/check/cancel 放行 vs spawn/escalate 拒绝；混合批次批审批按 action 分组", async () => {
  const { executeToolCalls } = await import("../src/agent/dispatch.mjs")
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const noopWrite = { name: "write", readonly: false, execute: async () => "wrote" }
  const tools = new Map([["subagent", subagentTool], ["write", noopWrite]])
  const cwd = mkdtempSync(join(tmpdir(), "cli-m17-"))
  const mkAgent = (planMode) => ({ cwd, config: { agent: {} }, planMode, autoApprove: false, _touchedFiles: [], _mutatedThisRun: false })
  try {
    // planMode：status/check/cancel（控制类）放行；spawn/escalate 非只读拒绝
    const res = await executeToolCalls(mkAgent(true), tools, [
      { name: "subagent", arguments: JSON.stringify({ action: "status" }) },
      { name: "subagent", arguments: JSON.stringify({ action: "check", n: 1 }) },
      { name: "subagent", arguments: JSON.stringify({ action: "cancel", id: "999" }) },
      { name: "subagent", arguments: JSON.stringify({ task: "x", role: "coder" }) }, // spawn（缺省 action）
      { name: "subagent", arguments: JSON.stringify({ action: "escalate", task: "x" }) },
    ], {}, 0)
    assert.equal(res[0].ok, true, "T-M17: planMode 下 status 放行")
    assert.ok(res[0].result.includes('"overview"'), "T-M17: status 返回概览")
    assert.equal(res[1].ok, true, "T-M17: planMode 下 check 放行")
    assert.ok(res[1].result.includes('"done"'), "T-M17: 空池 check 返回 done:true")
    assert.equal(res[2].ok, true, "T-M17: planMode 下 cancel 放行（控制类豁免——只停不启）")
    assert.ok(res[2].result.includes('"error"'), "T-M17: cancel 已执行（unknown id——证明未被 planMode 门拒）")
    assert.equal(res[3].ok, false)
    assert.ok(res[3].result.includes("plan mode"), "T-M17: planMode 下 spawn（缺省 action）拒绝")
    assert.equal(res[4].ok, false)
    assert.ok(res[4].result.includes("plan mode"), "T-M17: planMode 下 escalate 拒绝")
    // 混合 action 批次：check/status/cancel 不入审批组——批询问只含 write（§19 D-M1 + §19.5）
    const asks = []
    const res2 = await executeToolCalls(mkAgent(false), tools, [
      { name: "subagent", arguments: JSON.stringify({ action: "status" }) },
      { name: "subagent", arguments: JSON.stringify({ action: "cancel", id: "999" }) },
      { name: "write", arguments: JSON.stringify({ path: "a.mjs", content: "1" }) },
      { name: "write", arguments: JSON.stringify({ path: "b.mjs", content: "2" }) },
    ], {
      onBatchPermissionRequest: async (req) => { asks.push(req); return "approveAll" },
    }, 0)
    assert.equal(asks.length, 1, "T-M17: 同批一次合并询问")
    assert.deepEqual(asks[0].tools.map((t) => t.name), ["write", "write"], "T-M17: status/cancel 不入审批组（按 action 分组）")
    assert.equal(asks[0].count, 2)
    assert.equal(res2.every((r) => r.ok), true, "T-M17: approveAll 后全批执行（cancel 无 handler 也执行——控制类豁免）")
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})



test("§19 受限变体 action 门控——eng-coder 子代理内 escalate/check/status/cancel/panel 工具层拒绝（T-E4/E5 的 action 维度镜像）", async () => {
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const ctx = { agent: { _role: "eng-coder", config: { agent: {} } }, depth: 1 }
  for (const action of ["escalate", "check", "status", "cancel", "panel"]) {
    await assert.rejects(
      subagentTool.execute({ action, task: "x" }, ctx),
      /only action:'spawn'/,
      `eng-coder 受限变体内 action=${action} 必须工具层拒绝`,
    )
  }
  // spawn 路径仍走既有 role 门（gateEngCoderSpawn——explore-only）
  await assert.rejects(
    subagentTool.execute({ action: "spawn", task: "x", role: "coder" }, ctx),
    /may only spawn role='explore'/,
    "受限变体内 spawn 非 explore role 仍拒绝",
  )
})



test("§19.5 19.5.2b: digest（手动档）内 cancel 放行——控制类动作域（D-S7 分类）", async () => {
  const parent = { config: { agent: {} }, _inAutoTurn: true, autoApprove: false, _asyncSubagents: new Map() }
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const r = JSON.parse(String(await subagentTool.execute({ action: "cancel", id: "7" }, { agent: parent, depth: 0, callbacks: {} })))
  assert.equal(r.status, "error", "执行到动作本身（空池 unknown id）——未被 digest 门拒绝")
  assert.equal(r.error, "unknown async subagent id: 7")
  // 对照：同 ctx 下 spawn 仍机械拒绝（digest 禁 spawn 不受影响）
  const sp = String(await subagentTool.execute({ task: "x", role: "coder", async: true }, { agent: parent, depth: 0, callbacks: {} }))
  assert.ok(sp.includes("cannot spawn subagents from a manual auto-turn"), "digest 内 spawn 仍拒绝（控制类 vs 推进类分界）")
})



test("§20.8 T-F1.5 (cli): subagent files 参数描述含文件级锚句（fail-when-unchanged——目录声明不支持——不绕过冲突检测）", async () => {
  const { subagentTool } = await import("../src/agent-tools/subagent.mjs")
  const d = subagentTool.parameters.properties.files.description
  assert.ok(
    d.includes("files must be file-level paths (one per file you will modify). Directory declarations are NOT supported — they bypass the conflict detector and are rejected with an error."),
    `T-F1.5: files 描述缺 §20.8 锚句——actual: ${d.slice(0, 160)}`
  )
})
