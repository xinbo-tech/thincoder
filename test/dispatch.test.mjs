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
