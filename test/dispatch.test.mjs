/**
 * dispatch.test.mjs — §16 approval 批确认 + 批量形态引导（AGENT-LOOP.md §16）。
 * T-B1 同批一次询问（approveAll）；T-B2 oneByOne 回退逐项 / deny 全批拒绝；
 * T-B3 edit/apply_patch 描述批量引导句；T-B5 回归（autoApprove 短路/单工具）；
 * T-B6 无 onBatchPermissionRequest handler 缺省回退逐项。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { executeToolCalls } from "../src/agent/dispatch.mjs"
import { editTool } from "../src/tools/file.mjs"
import { applyPatchTool } from "../src/tools/patch.mjs"
import { tmpdir } from "node:os"

/** Mock subagent-like tool（§7.2.3）：blocking execute 成功路径在 ctx 上留
 *  _subagentKey（真实 subagent.mjs 行为）——verify dispatch 把它作 onToolResult
 *  第 4 参传给 TUI。key 由参数 path 指定（并行两调用各带各的）。 */
function makeSubagentLikeTool(setKey = true, { throwErr = false } = {}) {
  const calls = []
  return {
    tool: {
      name: "subagent",
      readonly: false,
      parallel: true,
      parameters: { type: "object", properties: { path: { type: "string" } } },
      execute: async (args, ctx) => {
        calls.push(args)
        if (throwErr) throw new Error("child run failed")
        if (setKey) ctx._subagentKey = String(args.path)
        return `report for ${args.path}`
      },
    },
    calls,
  }
}

/** Mock non-readonly tool recording executions (write-like, no real fs). */
function makeWriteTool() {
  const calls = []
  return {
    tool: {
      name: "write",
      readonly: false,
      parameters: { type: "object", properties: { path: { type: "string" } } },
      execute: async (args) => { calls.push(args); return `wrote ${args.path}` },
    },
    calls,
  }
}

const threeWrites = () => [
  { id: "c1", name: "write", arguments: JSON.stringify({ path: "a.txt" }) },
  { id: "c2", name: "write", arguments: JSON.stringify({ path: "b.txt" }) },
  { id: "c3", name: "write", arguments: JSON.stringify({ path: "c.txt" }) },
]

function baseAgent(tool, extra = {}) {
  return {
    tools: [tool], cwd: process.cwd(), config: { agent: {} },
    planMode: false, autoApprove: false, _role: null,
    ...extra,
  }
}

test("§16 T-B1: 同批 3 非只读工具 → 一次批询问（onBatchPermissionRequest 调用一次）；approveAll 后逐个执行", async () => {
  const { tool, calls } = makeWriteTool()
  const toolByName = new Map([["write", tool]])
  const agent = baseAgent(tool)
  let batchAsked = 0
  let perItemAsked = 0
  const results = await executeToolCalls(agent, toolByName, threeWrites(), {
    onBatchPermissionRequest: (req) => {
      batchAsked++
      assert.equal(req.count, 3, "count = 批内工具数")
      assert.deepEqual(req.tools.map((t) => t.name), ["write", "write", "write"], "tools 按序含 name")
      assert.equal(req.tools[0].args.path, "a.txt", "tools 含 args")
      return "approveAll"
    },
    onPermissionRequest: async () => { perItemAsked++; return true },
  }, 0, undefined)
  assert.equal(batchAsked, 1, "一次合并询问（非 3 次）")
  assert.equal(perItemAsked, 0, "approveAll 后不再逐项询问")
  assert.deepEqual(results.map((r) => r.ok), [true, true, true], "批准后逐个执行")
  assert.deepEqual(calls.map((c) => c.path), ["a.txt", "b.txt", "c.txt"], "按调用顺序执行")
})

test("§16 T-B2: oneByOne → 回退既有逐项通道（签名不变）；deny → 全批拒绝、无二次询问", async () => {
  // oneByOne: 逐项 onPermissionRequest(name, args) —— 签名不变
  const { tool, calls } = makeWriteTool()
  const toolByName = new Map([["write", tool]])
  const asks = []
  const r1 = await executeToolCalls(baseAgent(tool), toolByName, threeWrites(), {
    onBatchPermissionRequest: () => "oneByOne",
    onPermissionRequest: async (name, args) => { asks.push([name, args.path]); return true },
  }, 0, undefined)
  assert.deepEqual(asks, [["write", "a.txt"], ["write", "b.txt"], ["write", "c.txt"]], "回退逐项通道（同批 N 个 N 次既有询问）")
  assert.equal(r1.filter((x) => x.ok).length, 3, "逐项批准后全部执行")
  assert.deepEqual(calls.map((c) => c.path), ["a.txt", "b.txt", "c.txt"])
  // deny: 全批拒绝、无二次询问
  let asks2 = 0
  const r2 = await executeToolCalls(baseAgent(tool), toolByName, threeWrites(), {
    onBatchPermissionRequest: () => "deny",
    onPermissionRequest: async () => { asks2++; return true },
  }, 0, undefined)
  assert.equal(r2.filter((x) => x.ok).length, 0, "全批拒绝")
  assert.ok(r2.every((x) => x.result.includes("permission denied")), "拒绝原因回显")
  assert.equal(asks2, 0, "deny 后无二次询问")
  assert.equal(calls.length, 3, "deny 批未执行任何工具")
})

test("§16 T-B5: 回归——autoApprove 短路不变 + 单工具不触发批询问", async () => {
  const { tool } = makeWriteTool()
  const toolByName = new Map([["write", tool]])
  let asked = 0
  // autoApprove: 同批也跳过（短路不变）
  const r1 = await executeToolCalls(baseAgent(tool, { autoApprove: true }), toolByName, threeWrites(), {
    onBatchPermissionRequest: () => { asked++; return "approveAll" },
    onPermissionRequest: async () => { asked++; return true },
  }, 0, undefined)
  assert.equal(asked, 0, "autoApprove 短路：批/逐项都不询问")
  assert.equal(r1.filter((x) => x.ok).length, 3)
  // 单工具: 走既有逐项通道，不触发批询问
  const r2 = await executeToolCalls(baseAgent(tool), toolByName, [threeWrites()[0]], {
    onBatchPermissionRequest: () => { asked++; return "approveAll" },
    onPermissionRequest: async () => true,
  }, 0, undefined)
  assert.equal(asked, 0, "单工具不触发批询问")
  assert.equal(r2.filter((x) => x.ok).length, 1)
})

test("§16 T-B6: 无 onBatchPermissionRequest handler → 自动回退逐项通道（不误伤不悬挂）", async () => {
  const { tool } = makeWriteTool()
  const toolByName = new Map([["write", tool]])
  const asks = []
  const r = await executeToolCalls(baseAgent(tool), toolByName, threeWrites(), {
    onPermissionRequest: async (name) => { asks.push(name); return true },
  }, 0, undefined)
  assert.deepEqual(asks, ["write", "write", "write"], "缺省回退：N 次既有逐项询问")
  assert.equal(r.filter((x) => x.ok).length, 3, "不误伤：全部批准执行")
})

test("§16 T-B3: edit/apply_patch 描述含批量引导语义句", () => {
  const d = editTool.description
  assert.ok(d.includes("edits` array"), "edit 描述提及 edits 数组批量形态")
  assert.ok(d.includes("atomic"), "edit 描述含原子语义")
  assert.ok(d.includes("MULTIPLE files"), "edit 描述含多文件同批语义")
  const editsParam = editTool.parameters.properties.edits.description
  assert.ok(editsParam.includes("prefer one batched call over N single edits"), "edits 参数含批量引导句")
  assert.ok(editsParam.includes("same file"), "edits 参数含同文件多处修改引导")
  const p = applyPatchTool.description
  assert.ok(p.includes("MULTIPLE new files"), "apply_patch 描述含新建多文件语义")
  assert.ok(p.includes("/dev/null"), "apply_patch 描述含 --- /dev/null 新建形态")
  assert.ok(p.includes("whole-file"), "apply_patch 描述含整文件替换语义")
})

// ─── §7.2.3 sync spawn 完成精确冻结——dispatch 层（方案 e：runOne 读 ctx._subagentKey
// 作 onToolResult 第 4 参；错误/拒绝路径不触发 onToolResult——T-F5）─────────────

test("§7.2.3: runOne 把 ctx._subagentKey 作为 onToolResult 第 4 参传给 TUI（subKey——undefined 兼容既有签名）", async () => {
  const { tool } = makeSubagentLikeTool()
  const toolByName = new Map([["subagent", tool]])
  const results4th = []
  const r = await executeToolCalls(baseAgent(tool), toolByName, [{ id: "c1", name: "subagent", arguments: JSON.stringify({ path: "explore#7" }) }], {
    onPermissionRequest: async () => true,
    onToolResult: (name, result, toolId, subKey) => results4th.push([name, toolId, subKey]),
  }, 0, undefined)
  assert.equal(r[0].ok, true)
  assert.deepEqual(results4th, [["subagent", "c1", "explore#7"]], "第 4 参 = execute ctx 上的 _subagentKey")
})

test("§7.2.3: 并行 2 sync spawn（批并行）各自独立 ctx——乱序完成各带自己的 subKey（无误串）", async () => {
  const { tool } = makeSubagentLikeTool()
  const toolByName = new Map([["subagent", tool]])
  const results4th = []
  await executeToolCalls(baseAgent(tool), toolByName, [
    { id: "c1", name: "subagent", arguments: JSON.stringify({ path: "explore#1" }) },
    { id: "c2", name: "subagent", arguments: JSON.stringify({ path: "explore#2" }) },
  ], {
    onPermissionRequest: async () => true,
    onToolResult: (name, result, toolId, subKey) => results4th.push([toolId, subKey]),
  }, 0, undefined)
  assert.deepEqual(results4th.sort(), [["c1", "explore#1"], ["c2", "explore#2"]], "各 runOne 独立 ctx——key 各自归属")
})

test("§7.2.3: 普通工具（不设 _subagentKey）→ 第 4 参 undefined（既有签名兼容）", async () => {
  const { tool } = makeSubagentLikeTool(false)
  const toolByName = new Map([["subagent", tool]])
  const results4th = []
  const r = await executeToolCalls(baseAgent(tool), toolByName, [{ id: "c1", name: "subagent", arguments: JSON.stringify({ path: "x" }) }], {
    onPermissionRequest: async () => true,
    onToolResult: (name, result, toolId, subKey) => results4th.push(subKey),
  }, 0, undefined)
  assert.equal(r[0].ok, true)
  assert.deepEqual(results4th, [undefined], "undefined 第 4 参（TUI 落启发式兜底）")
})

test("§7.2.3 T-F5（dispatch 层）: execute 抛错 → 不调 onToolResult（错误结果直接回模型——不触发任何冻结）", async () => {
  const { tool } = makeSubagentLikeTool(true, { throwErr: true })
  const toolByName = new Map([["subagent", tool]])
  let onResultCalls = 0
  const r = await executeToolCalls(baseAgent(tool), toolByName, [{ id: "c1", name: "subagent", arguments: JSON.stringify({ path: "explore#1" }) }], {
    onPermissionRequest: async () => true,
    onToolResult: () => { onResultCalls++ },
  }, 0, undefined)
  assert.equal(r[0].ok, false, "错误结果形态（模型可见——Error 文本）")
  assert.ok(String(r[0].result).includes("child run failed"))
  assert.equal(onResultCalls, 0, "抛错路径不调 onToolResult——TUI 不触发 finishSubTask/启发式（T-F5 不误冻）")
})

test("§7.2.3 T-F5（dispatch 层）: Phase-1 拒绝（planMode 非只读 / 用户拒绝）→ 不调 onToolResult", async () => {
  const { tool } = makeSubagentLikeTool()
  const toolByName = new Map([["subagent", tool]])
  // planMode：非只读工具被拒（spawn 无 readonly-action 豁免）
  let onResultCalls = 0
  const r1 = await executeToolCalls(baseAgent(tool, { planMode: true }), toolByName, [{ id: "c1", name: "subagent", arguments: JSON.stringify({ path: "x" }) }], {
    onToolResult: () => { onResultCalls++ },
  }, 0, undefined)
  assert.equal(r1[0].ok, false)
  assert.ok(String(r1[0].result).includes("plan mode"))
  assert.equal(onResultCalls, 0, "planMode 拒绝不调 onToolResult")
  // 用户拒绝（手动模式非只读 → permission 询问返回 false）
  let onResultCalls2 = 0
  const r2 = await executeToolCalls(baseAgent(tool), toolByName, [{ id: "c2", name: "subagent", arguments: JSON.stringify({ path: "x" }) }], {
    onPermissionRequest: async () => false,
    onToolResult: () => { onResultCalls2++ },
  }, 0, undefined)
  assert.equal(r2[0].ok, false)
  assert.ok(String(r2[0].result).includes("permission denied"))
  assert.equal(onResultCalls2, 0, "用户拒绝不调 onToolResult（Phase-1 拒绝走错误块——round1 #1）")
})




// ────────────────────────────────────────
// dispatch: engineering parent gate (design before code)
// ────────────────────────────────────────

function gateMakeWriteTool() {
  return {
    name: "write", readonly: false,
    touchedPaths: (args) => [args.path],
    async execute(args) { return `wrote ${args.path}` },
  }
}


test("dispatch: engineering parent gate blocks code writes before design review", async () => {
  const agent = {
    cwd: tmpdir(),
    config: { agent: { engineering: true } },
    planMode: false, autoApprove: true,
    _role: undefined, // parent
    _engDesignToken: null,
  }
  const results = await executeToolCalls(agent, new Map([["write", gateMakeWriteTool()]]), [
    { name: "write", arguments: JSON.stringify({ path: "src/app.mjs", content: "x" }) },
  ], {}, 0)
  assert.equal(results[0].ok, false)
  assert.ok(results[0].result.includes("design review required"), results[0].result)
  assert.ok(results[0].result.includes("docs/"), "hint points at the design doc")
})



test("dispatch: engineering parent gate allows design docs in docs/", async () => {
  const agent = {
    cwd: tmpdir(),
    config: { agent: { engineering: true } },
    planMode: false, autoApprove: true,
    _role: undefined,
    _engDesignToken: null,
  }
  const results = await executeToolCalls(agent, new Map([["write", gateMakeWriteTool()]]), [
    { name: "write", arguments: JSON.stringify({ path: "docs/design/PLAN.md", content: "# design" }) },
  ], {}, 0)
  assert.equal(results[0].ok, true, results[0].result)
})



test("dispatch: engineering parent gate allows root-level doc files (METHODOLOGY.md)", async () => {
  const agent = {
    cwd: tmpdir(),
    config: { agent: { engineering: true } },
    planMode: false, autoApprove: true,
    _role: undefined,
    _engDesignToken: null,
  }
  const results = await executeToolCalls(agent, new Map([["write", gateMakeWriteTool()]]), [
    { name: "write", arguments: JSON.stringify({ path: "METHODOLOGY.md", content: "# methodology" }) },
  ], {}, 0)
  assert.equal(results[0].ok, true, results[0].result)
})



test("dispatch: engineering parent gate blocks src/prompts/*.md (product code) before design review", async () => {
  const agent = {
    cwd: tmpdir(),
    config: { agent: { engineering: true } },
    planMode: false, autoApprove: true,
    _role: undefined,
    _engDesignToken: null,
  }
  const results = await executeToolCalls(agent, new Map([["write", gateMakeWriteTool()]]), [
    { name: "write", arguments: JSON.stringify({ path: "src/prompts/x.md", content: "# prompt" }) },
  ], {}, 0)
  assert.equal(results[0].ok, false)
  assert.ok(results[0].result.includes("design review required"), results[0].result)
  assert.ok(results[0].result.includes("docs/"), "hint points at the design doc")
})



test("dispatch: engineering parent gate lifts after design review passed", async () => {
  const agent = {
    cwd: tmpdir(),
    config: { agent: { engineering: true } },
    planMode: false, autoApprove: true,
    _role: undefined,
    _engDesignToken: "tok-123", // design review approved
  }
  const results = await executeToolCalls(agent, new Map([["write", gateMakeWriteTool()]]), [
    { name: "write", arguments: JSON.stringify({ path: "src/app.mjs", content: "x" }) },
  ], {}, 0)
  assert.equal(results[0].ok, true, results[0].result)
})



test("dispatch: eng-coder without design review is blocked from writing", async () => {
  const agent = {
    cwd: tmpdir(),
    config: { agent: { engineering: true } },
    planMode: false, autoApprove: true,
    _role: "eng-coder",
    _engDesignReviewed: false,
    _engDesignToken: null,
  }
  const results = await executeToolCalls(agent, new Map([["write", gateMakeWriteTool()]]), [
    { name: "write", arguments: JSON.stringify({ path: "src/app.mjs", content: "x" }) },
  ], {}, 0)
  assert.equal(results[0].ok, false)
  assert.ok(results[0].result.includes("design review required"), results[0].result)
})



test("dispatch: normal mode has no design gate", async () => {
  const agent = {
    cwd: tmpdir(),
    config: { agent: { engineering: false } },
    planMode: false, autoApprove: true,
    _role: undefined,
    _engDesignToken: null,
  }
  const results = await executeToolCalls(agent, new Map([["write", gateMakeWriteTool()]]), [
    { name: "write", arguments: JSON.stringify({ path: "src/app.mjs", content: "x" }) },
  ], {}, 0)
  assert.equal(results[0].ok, true, results[0].result)
})



test("dispatch: engineering parent gate treats missing/unknown path as code (conservative block)", async () => {
  const agent = {
    cwd: tmpdir(),
    config: { agent: { engineering: true } },
    planMode: false, autoApprove: true,
    _role: undefined,
    _engDesignToken: null,
  }
  // 工具无 touchedPaths 且参数缺 path → paths = [undefined] → 未知路径按代码保守拦截
  const noPathTool = {
    name: "write", readonly: false,
    async execute(args) { return `wrote ${JSON.stringify(args)}` },
  }
  const results = await executeToolCalls(agent, new Map([["write", noPathTool]]), [
    { name: "write", arguments: JSON.stringify({ content: "x" }) },
  ], {}, 0)
  assert.equal(results[0].ok, false)
  assert.ok(results[0].result.includes("design review required"), results[0].result)
})



test("dispatch: normal mode has no design gate", async () => {
  const agent = {
    cwd: tmpdir(),
    config: { agent: { engineering: false } },
    planMode: false, autoApprove: true,
    _role: undefined,
    _engDesignToken: null,
  }
  const results = await executeToolCalls(agent, new Map([["write", gateMakeWriteTool()]]), [
    { name: "write", arguments: JSON.stringify({ path: "src/app.mjs", content: "x" }) },
  ], {}, 0)
  assert.equal(results[0].ok, true, results[0].result)
})



test("dispatch: aborted signal propagates tool errors (user interrupt is not swallowed)", async () => {
  const agent = { planMode: false, config: {}, history: [], _touchedFiles: [], cwd: tmpdir(), _role: null }
  const bombTool = {
    name: "bomb",
    readonly: true,
    async execute() { throw new DOMException("Aborted", "AbortError") },
  }
  const ctrl = new AbortController()
  ctrl.abort()
  // When the user aborted (Ctrl+C), a tool error inside the batch must REJECT
  // executeToolCalls — swallowing it into a tool result would let the agent
  // loop continue while the user asked to stop.
  await assert.rejects(
    executeToolCalls(agent, new Map([["bomb", bombTool]]), [{ name: "bomb", arguments: "{}" }], {}, 0, ctrl.signal),
    /Aborted/,
  )
})



test("dispatch: plain tool error is returned as a result even when signal is live", async () => {
  const agent = { planMode: false, config: {}, history: [], _touchedFiles: [], cwd: tmpdir(), _role: null }
  const failTool = {
    name: "fail",
    readonly: true,
    async execute() { throw new Error("disk full") },
  }
  const ctrl = new AbortController()
  const results = await executeToolCalls(agent, new Map([["fail", failTool]]), [{ name: "fail", arguments: "{}" }], {}, 0, ctrl.signal)
  assert.equal(results[0].ok, false)
  assert.ok(results[0].result.includes("disk full"), "normal tool errors stay as model-visible results")
})



test("dispatch: 工具执行期间的 console.log/console.error 回显到结果（2026-08-31 工具顺手度）", async () => {
  const agent = { planMode: false, config: {}, history: [], _touchedFiles: [], cwd: tmpdir(), _role: null }
  const noisyTool = {
    name: "noisy",
    readonly: true,
    async execute() {
      console.log("probe line 1")
      console.error("warn line 2")
      return "ok result"
    },
  }
  const ctrl = new AbortController()
  const results = await executeToolCalls(agent, new Map([["noisy", noisyTool]]), [{ name: "noisy", arguments: "{}" }], {}, 0, ctrl.signal)
  assert.equal(results[0].ok, true)
  assert.ok(results[0].result.includes("ok result"), "原结果保留")
  assert.ok(results[0].result.includes("[console during noisy]"), "console 回显头")
  assert.ok(results[0].result.includes("probe line 1"), "console.log 捕获")
  assert.ok(results[0].result.includes("[err] warn line 2"), "console.error 捕获")
})



test("dispatch: 工具抛错前的 console 输出也回显（异常路径——调试场景最有价值）", async () => {
  const agent = { planMode: false, config: {}, history: [], _touchedFiles: [], cwd: tmpdir(), _role: null }
  const failNoisyTool = {
    name: "failnoisy",
    readonly: true,
    async execute() {
      console.log("probe before crash")
      throw new Error("boom")
    },
  }
  const ctrl = new AbortController()
  const results = await executeToolCalls(agent, new Map([["failnoisy", failNoisyTool]]), [{ name: "failnoisy", arguments: "{}" }], {}, 0, ctrl.signal)
  assert.equal(results[0].ok, false)
  assert.ok(results[0].result.includes("boom"), "错误消息保留")
  assert.ok(results[0].result.includes("probe before crash"), "异常前 console 回显")
})



test("dispatch: 无 console 输出的工具结果不变（不拦截时不影响）", async () => {
  const agent = { planMode: false, config: {}, history: [], _touchedFiles: [], cwd: tmpdir(), _role: null }
  const quietTool = {
    name: "quiet",
    readonly: true,
    async execute() { return "quiet result" },
  }
  const ctrl = new AbortController()
  const results = await executeToolCalls(agent, new Map([["quiet", quietTool]]), [{ name: "quiet", arguments: "{}" }], {}, 0, ctrl.signal)
  assert.equal(results[0].ok, true)
  assert.equal(results[0].result, "quiet result", "无 console → 结果原样（无附加段）")
})

