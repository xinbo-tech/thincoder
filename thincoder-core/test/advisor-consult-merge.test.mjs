/**
 * advisor-consult-merge.test.mjs — 会诊/评审面并入组（E 类：评审实例载体 · 工具集恒在 ·
 * depth 校验 · 供应商字段归一 · 子运行额外工具面 · 未完成标记字面）。
 *
 * 手法：直驱核内导出（无网络 / 无 LLM —— 拒发与纯函数两面）；结构机检覆盖「本批模块
 * 代码面零端名」与「谓词单源」两条机械判据。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, relative } from "node:path"
import { fileURLToPath } from "node:url"

import { advisorIncompleteMarker } from "../advisor/compaction.mjs"
import { _advisorToolsFor } from "../advisor/loop.mjs"
import { injectProjectGuide } from "../advisor/project-context.mjs"
import { advisorRuns, effectiveAdvisorRound, resolveAdvisorLaunch } from "../agent-tools/advisor-async.mjs"
import { advisorTool } from "../agent-tools/advisor.mjs"
import { prepareRun } from "../agent/setup.mjs"
import { createAgent } from "../agent.mjs"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")

// ─── #110 评审实例载体（跨 run 容器）──────────────────────────────

test("#110 实例注册表载体吸收：载体在场 ⇒ 注册表落载体（不在父对象另建分叉）", () => {
  const carrier = new Map()
  const history = Object.assign([], { _advisorRuns: carrier })
  const agent = { cwd: process.cwd(), history }
  const r = resolveAdvisorLaunch(agent, "code")
  assert.ok(carrier.has(r.reviewId), "新实例落跨 run 载体")
  assert.equal("_advisorRuns" in agent, false, "不在父对象旁建第二份注册表")
  assert.equal(effectiveAdvisorRound(agent), 0, "读取面同看载体")
  carrier.get(r.reviewId).round = 3
  assert.equal(effectiveAdvisorRound(agent), 3, "轮次随记录走（读取面同源）")
})

test("#110 既有形态零变：字段挂父对象 ⇒ 父对象字段优先（载体旁置不夺权）", () => {
  const own = new Map()
  const carrier = new Map()
  const agent = { cwd: process.cwd(), _advisorRuns: own, history: Object.assign([], { _advisorRuns: carrier }) }
  const r = resolveAdvisorLaunch(agent, "code")
  assert.ok(own.has(r.reviewId), "父对象字段优先")
  assert.equal(carrier.size, 0, "载体未被写入")
  assert.equal(advisorRuns(agent), own)
})

test("#110 两形皆缺：注册表建在跨 run 载体上（无载体 ⇒ 父对象字段）", () => {
  const history = []
  const a = { cwd: process.cwd(), history }
  resolveAdvisorLaunch(a, "code")
  assert.ok(history._advisorRuns instanceof Map, "有 history ⇒ 建在载体上")
  const b = { cwd: process.cwd() }
  resolveAdvisorLaunch(b, "code")
  assert.ok(b._advisorRuns instanceof Map, "无载体 ⇒ 建在父对象字段（既有形态）")
})

// ─── #109 工具集：检索面恒在（与索引绑定解耦）────────────────────

test("#109 code_search 恒在：工具清单与索引绑定解耦（未绑定 ⇒ 执行面端中立降级）", async () => {
  const withoutIndex = _advisorToolsFor({}, "code")
  const withIndex = _advisorToolsFor({ memory: null }, "code")
  const names = [...withoutIndex.byName.keys()].sort()
  assert.deepEqual(names, ["code_search", "glob", "grep", "ls", "lsp", "read"], "只读集恒定（含检索面）")
  assert.deepEqual([...withIndex.byName.keys()].sort(), names, "绑定形态同集（清单不随绑定变）")
  assert.equal(await withoutIndex.byName.get("code_search").execute({ query: "x" }), "(code index not available in this session)")
  assert.deepEqual([...withoutIndex.byName.get("code_search").parameters.required], ["query"], "工具面同形（参数/描述不因降级而变）")
  // 批次档绑定只在 design + batchDoc 同时到位时追加（既有语义零变）
  assert.equal(_advisorToolsFor({}, "design", null).byName.has("batch_segment"), false)
  assert.equal(_advisorToolsFor({}, "code", "docs/batch.md").byName.has("batch_segment"), false)
})

// ─── #95 depth 显式校验（拒发行）────────────────────────────────

test("#95 depth 显式校验：depth>0 / 无 depth 上下文 + 显式 async:true ⇒ 拒发（判定表逐值保持）", async () => {
  const mkAgent = () => ({ cwd: process.cwd(), _advisorRefusals: new Set() })
  for (const depth of [1, undefined]) {
    const agent = mkAgent()
    const out = await advisorTool.execute({ type: "code", paths: ["a.mjs"], async: true }, { depth, agent, _toolCallId: 7 })
    assert.match(String(out), /^Advisor: async reviews are only available at depth 0/, `depth=${depth} ⇒ 拒发`)
    assert.deepEqual([...agent._advisorRefusals], [7], "拒发登记（未跑评审——不置 called）")
  }
})

// ─── #107 未完成标记：空响应字面单源自洽 ────────────────────────

test("#107 空响应标记字面：判定族前缀与产出面字面同源（块首行扫描命中 empty）", () => {
  assert.equal(advisorIncompleteMarker("Advisor: empty response — review was inconclusive"), "empty")
  assert.equal(advisorIncompleteMarker("blah\n\nAdvisor: review timeout after 600s.\nmore"), "timeout")
  assert.equal(advisorIncompleteMarker("all good, no findings"), null)
})

// ─── #105 供应商字段名归一（取模型窗口）────────────────────────

test("#105 供应商字段名归一：`provider` 与 `_provider` 两形产出逐字相同", (t) => {
  const dir = mkdtempSync(join(tmpdir(), "core-ctx-"))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  const guide = "G".repeat(200_000)
  writeFileSync(join(dir, "AGENTS.md"), guide)
  // provider.context 为 K 单位（×1024）——1000K 上下文 ⇒ 预算上限 = max(8192, 5%) = 51200
  const provider = { name: "p", model: "m", context: 1000 }

  const viaOwn = []
  injectProjectGuide({ cwd: dir, provider }, viaOwn)
  const viaCarrier = []
  injectProjectGuide({ cwd: dir, _provider: provider }, viaCarrier)

  assert.deepEqual(viaCarrier, viaOwn, "两形装配结果逐字相同")
  const text = viaOwn.join("\n")
  assert.ok(text.includes("(truncated at 51200 chars"), "预算取自 provider 窗口（字段名归一后仍生效）")
  const viaBoth = []
  injectProjectGuide({ cwd: dir, provider, _provider: { name: "p", model: "m", context: 1 } }, viaBoth)
  assert.deepEqual(viaBoth, viaOwn, "两形并存 ⇒ 本回合生效面（provider）优先")
})

// ─── #93 子运行「额外工具」注入面（含缺省零变）───────────────────

test("#93 extraTools 注入面：注入 ⇒ 工具入场；不传/空数组 ⇒ 与注入前同集（零变）", async () => {
  const mkAgent = () => {
    const a = createAgent({ provider: { name: "p", model: "m", apiKey: "k" }, cwd: process.cwd(), config: {}, role: "consult" })
    a.tools = []
    return a
  }
  const extra = { name: "main_history", description: "probe", parameters: { type: "object", properties: {} }, readonly: true, async execute() { return "ok" } }
  const withExtra = await prepareRun(mkAgent(), "hi", {}, { depth: 1, extraTools: [extra] })
  const without = await prepareRun(mkAgent(), "hi", {}, { depth: 1 })
  const empty = await prepareRun(mkAgent(), "hi", {}, { depth: 1, extraTools: [] })
  assert.ok(withExtra.tools.some((t) => t.name === "main_history"), "注入的工具入场")
  const before = without.tools.map((t) => t.name).join(",")
  assert.equal(empty.tools.map((t) => t.name).join(","), before, "空数组 = 缺省（零变）")
  const odd = await prepareRun(mkAgent(), "hi", {}, { depth: 1, extraTools: extra })
  assert.equal(odd.tools.map((t) => t.name).join(","), before, "非数组误传 ⇒ 当空态（不炸）")
  assert.equal(withExtra.tools.map((t) => t.name).join(","), "task,plan,timer,recent_changes,main_history", "注入面在既有集之后追加")
  assert.ok(withExtra.toolSchemas.some((s) => s.function.name === "main_history"), "schema 面同步注入")
})

// ─── 结构机检 ───────────────────────────────────────────────

/** 递归收集核内 .mjs（相对 ROOT，正斜杠）。 */
function walkRel(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walkRel(p, out)
    else if (name.endsWith(".mjs")) out.push(relative(ROOT, p).replace(/\\/g, "/"))
  }
  return out
}

const stripComments = (src) =>
  src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1")

test("结构机检①：本批模块代码面零端名（注释剥除后——契约 5 机械面）", () => {
  const BATCH_MODULES = [
    "history-window.mjs", "session-slot-write.mjs", "session-slots.mjs", "session.mjs", "session-gc.mjs",
    "agent/setup.mjs", "agent.mjs", "agent-tools/advisor.mjs", "agent-tools/advisor-async.mjs",
    "advisor/loop.mjs", "advisor/project-context.mjs",
  ]
  const END_NAME = /(?:vscode|vs\s*code|thincoder-cli|thincoder-vscode)/i
  const hits = BATCH_MODULES.filter((rel) => END_NAME.test(stripComments(readFileSync(join(ROOT, rel), "utf8"))))
  assert.deepEqual(hits, [], `本批模块代码面出现端名：${hits.join(", ")}`)
})

test("结构机检②：真实用户消息谓词单源（核内恰一处定义）", () => {
  const defs = walkRel(ROOT).filter((rel) => /(?:^|\s)function\s+isRealUserMsg\s*\(/.test(stripComments(readFileSync(join(ROOT, rel), "utf8"))))
  assert.deepEqual(defs, ["history-window.mjs"], `isRealUserMsg 定义点须恰一处：${defs.join(", ")}`)
})

test("结构机检③：会话 GC 手动执行面 = 端差段（核内零消费方——壳侧接线）", () => {
  const refs = walkRel(ROOT)
    .filter((rel) => rel !== "session-gc.mjs" && !rel.startsWith("test/"))
    .filter((rel) => /\brunSessionGc\b/.test(stripComments(readFileSync(join(ROOT, rel), "utf8"))))
  assert.deepEqual(refs, [], `手动执行面不应有核内消费方：${refs.join(", ")}`)
})
