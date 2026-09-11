/**
 * batch-doc-gate.test.mjs — batchDoc spawn 门（ENGINEERING-MODE.md §2.22.3 第 5 批 VSC 镜像 ·
 * FR23 F1；用例 T54/T55/T55b/T56）。锁三件：
 *   ① **两路各一个调用点**——阻塞路（subagent.mjs execute）与异步路
 *      （subagent-async.mjs spawnAsyncSubagent 入池前）都过门；
 *   ② **角色域**——门只对 {eng-coder, eng-designer} 生效；explore/plan/coder 零变更。
 * 2026-09-12 PROSE-ANCHOR-RETIRE：原「校验逻辑单份」静态面（读 src 文本）整删——散文锚（判据见 CLI 侧设计档 TESTING.md §11）；
 * 两路调用行为由 T54/T55/T56 放行与拒绝面对拍覆盖。
 * 放行面以测试缝 `ctx.runAgent`（escalate-async 同形先例）驱动真实 execute：断言 run 边界上的
 * 注入——任务文本含 `Batch record (batchDoc): <abs>` 行 + `opts.batchDoc`（setup 据此落
 * `agent._batchDoc`，装配面在 eng-designer-role.test.mjs 断言）。零网络、零真实 LLM。
 */
import { test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { randomUUID } from "node:crypto"
import { subagentTool } from "../src/agent-tools/subagent.mjs"

let cwd
beforeEach(() => { cwd = mkdtempSync(join(tmpdir(), "batchdoc-gate-")); stop.length = 0 })
afterEach(() => { rmSync(cwd, { recursive: true, force: true }) })

/** 批次档夹具（六段骨架——门只判「参数在 + 路径可读」，不校验内容）。 */
function writeBatchDoc(rel = "docs/batches/2026-09-11-b.md") {
  const abs = join(cwd, rel)
  mkdirSync(dirname(abs), { recursive: true })
  writeFileSync(abs, "# 批次档\n\n## §1 讨论\n\n## §2 批次任务\n\n## §3 设计评审\n\n## §4 用户批准\n\n## §5 实施记录\n\n## §6 验证与收口\n")
  return abs
}

/** 生产 runAgent 的替身（测试缝）：记录 run 边界（任务文本 + opts），不发网络。 */
const stop = []
function parentAgent({ engineering = true, role = null } = {}) {
  return {
    config: { agent: { engineering } },
    cwd,
    _role: role,
    _asyncSubagents: new Map(),
    _asyncAdvisors: new Map(),
    _subIdCounter: 0,
    _engDesignTokens: new Map(),
  }
}
function ctxFor(parent, extra = {}) {
  return {
    agent: parent, cwd, depth: 0,
    callbacks: { onSubagent: () => {}, onToolPanel: () => {} },
    getAuto: () => false,
    runAgent: async (provider, cwdArg, input, callbacks, signal, flag, opts) => {
      stop.push({ input, batchDoc: opts?.batchDoc ?? null })
      return "Subagent report (stub)"
    },
    ...extra,
  }
}
const flush = () => new Promise((r) => setTimeout(r, 30))

test("T54 正常：阻塞路放行——注入任务文本行 + opts.batchDoc（→ setup 的 agent._batchDoc）", async () => {
  writeBatchDoc()
  const parent = parentAgent()
  await subagentTool.execute(
    { task: "写设计档", role: "eng-designer", batchDoc: "docs/batches/2026-09-11-b.md", async: false },
    ctxFor(parent),
  )
  const abs = resolve(cwd, "docs/batches/2026-09-11-b.md")
  assert.equal(stop.length, 1, "阻塞路 runAgent 恰被调用一次")
  assert.ok(stop[0].input.includes(`Batch record (batchDoc): ${abs}`), "任务文本含注入行（CLI 第 1 批形态——无变体退路）")
  assert.equal(stop[0].batchDoc, abs, "绑定随 run opts 下发（setup 落 agent._batchDoc）")
})

test("T54 正常：异步路放行——同注入形态 + 条目绑定 entry._batchDoc", async () => {
  writeBatchDoc()
  const parent = parentAgent()
  const ack = JSON.parse(await subagentTool.execute(
    { task: "写设计档", role: "eng-designer", batchDoc: "docs/batches/2026-09-11-b.md", async: true },
    ctxFor(parent),
  ))
  await flush()
  const abs = resolve(cwd, "docs/batches/2026-09-11-b.md")
  assert.equal(ack.status, "running", "异步路入池立即启动")
  assert.equal(stop.length, 1, "异步条目经同一 runChild 包装落到 runAgent")
  assert.ok(stop[0].input.includes(`Batch record (batchDoc): ${abs}`), "异步路任务文本同形注入")
  assert.equal(stop[0].batchDoc, abs, "异步路绑定同形下发")
  assert.equal(parent._asyncSubagents.get(ack.id)?._batchDoc, abs, "池条目录得绑定（实例键——非单值会话态）")
})

test("T54 正常：eng-coder 同样过门（角色域含两角色）", async () => {
  writeBatchDoc()
  const token = `${randomUUID()}:${Date.now() + 86400000}`
  const parent = parentAgent()
  parent._engDesignTokens.set("d1", token)
  await subagentTool.execute(
    { task: "实现", role: "eng-coder", batchDoc: "docs/batches/2026-09-11-b.md", designToken: token, designId: "d1", async: false },
    ctxFor(parent),
  )
  const abs = resolve(cwd, "docs/batches/2026-09-11-b.md")
  assert.equal(stop[0].batchDoc, abs, "eng-coder 绑定同形")
})

test("T55 错误：缺参——两路均拒（不得只拒一路）", async () => {
  const parent = parentAgent()
  await assert.rejects(
    () => subagentTool.execute({ task: "写设计档", role: "eng-designer", async: false }, ctxFor(parent)),
    /batchDoc is required/,
    "阻塞路缺参拒",
  )
  await assert.rejects(
    () => subagentTool.execute({ task: "写设计档", role: "eng-designer", async: true }, ctxFor(parent)),
    /batchDoc is required/,
    "异步路缺参拒",
  )
  assert.equal(stop.length, 0, "两路均未进 runAgent（拒在装配之前）")
  assert.equal(parent._asyncSubagents.size, 0, "异步路拒在入池之前")
})

test("T55b 边界：非目标角色零变更（explore/plan/coder 不带 batchDoc 照常 spawn）", async () => {
  const cases = [
    { role: "explore", engineering: true },
    { role: "plan", engineering: true },
    { role: "coder", engineering: false },
  ]
  for (const c of cases) {
    const parent = parentAgent({ engineering: c.engineering })
    await subagentTool.execute({ task: "看看现状", role: c.role, async: false }, ctxFor(parent))
    const last = stop.at(-1)
    assert.ok(!last.input.includes("Batch record (batchDoc):"), `${c.role} 不被注入批次档行（带 batchDoc 才注入）`)
    assert.equal(last.batchDoc, null, `${c.role} 无绑定（零变更）`)
  }
  assert.equal(stop.length, cases.length, "三例均放行")
})

test("T56 错误：不可读——两路均拒（消息含路径与原因）", async () => {
  const parent = parentAgent()
  await assert.rejects(
    () => subagentTool.execute({ task: "写设计档", role: "eng-designer", batchDoc: "docs/batches/none.md", async: false }, ctxFor(parent)),
    (e) => /not a readable file/.test(e.message) && e.message.includes("docs/batches/none.md"),
    "阻塞路不可读拒（含路径）",
  )
  await assert.rejects(
    () => subagentTool.execute({ task: "写设计档", role: "eng-designer", batchDoc: "docs/batches/none.md", async: true }, ctxFor(parent)),
    /not a readable file/,
    "异步路不可读拒",
  )
  assert.equal(parent._asyncSubagents.size, 0, "不可读拒在入池之前")
})

test("T56 边界：指向目录（非文件）同判不可读", async () => {
  mkdirSync(join(cwd, "docs", "batches"), { recursive: true })
  const parent = parentAgent()
  await assert.rejects(
    () => subagentTool.execute({ task: "写设计档", role: "eng-designer", batchDoc: "docs/batches", async: false }, ctxFor(parent)),
    /not a readable file/,
  )
})

test("T54 边界：schema 含 batchDoc 属性 / 受限变体 delete 清单含之", () => {
  assert.ok(subagentTool.parameters.properties.batchDoc, "spawn schema 暴露 batchDoc（否则参数无处传入）")
})
