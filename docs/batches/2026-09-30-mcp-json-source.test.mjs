/**
 * 2026-09-30-mcp-json-source.test.mjs — 桌面 MCP 装配补 `.mcp.json` 项目文件源批（#691）批次本地对拍锁。
 *
 * 运行（仓根）：node --test docs/batches/2026-09-30-mcp-json-source.test.mjs
 *
 * 腿（设计 §2.5 AC-691-1..9；真机腿 = 父侧 D16 义务，不在本件）：
 *   1 正常·含（文件源并入 + 工具落 _mcpName）· 2 正常·不含（无文件 ∕ cwd=null ⇒ 恒等 + 零调用）
 *   3 优先级（config 同名优先）· 4 合并序（config 先 ∕ 文件源后）· 5 非变异（不回写 config）
 *   6 数组形 mcpServers（跳过 + 记录）· 7 条目形（null ∕ 嵌套数组跳过）· 8 坏 JSON（零警告）· 9 连接抛（警告不抛）
 *
 * 批次本地单测件：名随批次档、住批次目录、不进仓套件（复跑 = 上行命令）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { pathToFileURL } from "node:url"

const root = process.cwd()
const at = (rel) => pathToFileURL(join(root, rel)).href
const tmp = (p) => mkdtempSync(join(tmpdir(), p))
const { assembleFor } = await import(at("thincoder-desktop/src/main/agent-assemble.mjs"))

/** 假 deps（核装配缺省八缝 + MCP 连接器注入缝 —— 沿 #673 批 L8 同形；平 node 直测，零 electron）。 */
function harness(config, connect) {
  const baseTools = [{ name: "read" }]
  const agent = { provider: config.provider, config }
  const deps = {
    loadConfig: () => config,
    createMemory: () => ({}),
    createAgent: ({ tools }) => { agent.tools = tools; return agent },
    assembleBuiltinTools: async () => baseTools,
    discoverRules: () => [],
    syncDir: async () => {},
    team: () => null,
    author: () => "fake-author",
    injectProxy: () => {},
  }
  if (connect) deps.connectMcpServer = connect
  return { deps, agent, baseTools }
}

const cfg = (extra = {}) => ({
  provider: { name: "p1", model: "m1", baseURL: "https://api.invalid/v1" },
  providersList: [{ name: "p1" }],
  memory: { dbPath: "fake.db", projectDir: null, team: null },
  agent: { streamRules: [] },
  ...extra,
})

/** 假连接器：记录逐次调用 ∕ 出一件 `_mcpName` 工具（成功形态）。 */
function recorder() {
  const calls = []
  const connect = async (srv) => { calls.push(srv); return [{ name: `${srv.name}_t`, _mcpName: srv.name }] }
  return { calls, connect }
}

/** console.error 捕获（记录面断言 + 输出降噪；异常径恢复原函数）。 */
async function capturing(fn) {
  const orig = console.error
  const lines = []
  console.error = (...a) => lines.push(a.join(" "))
  try { return { result: await fn(), lines } } finally { console.error = orig }
}

const writeMcpJson = (cwd, obj) => writeFileSync(join(cwd, ".mcp.json"), JSON.stringify(obj))

test("AC-691-1 文件源并入：连接调用 { name, ...server }（键名注入）+ 工具落 agent.tools", async () => {
  const cwd = tmp("mcp691-1-")
  writeMcpJson(cwd, { mcpServers: { alpha: { command: "x" } } })
  const rec = recorder()
  const h = harness(cfg(), rec.connect)
  const out = await assembleFor({ cwd, slot: 1, deps: h.deps })
  assert.deepEqual(rec.calls, [{ name: "alpha", command: "x" }], "假连接器逐字收 { name, ...server }")
  assert.equal(out.tools.length, h.baseTools.length + 1, "并入一件（baseTools + alpha_t）")
  assert.equal(out.tools.some((t) => t._mcpName === "alpha"), true, "其工具落 agent.tools（_mcpName 在场）")
  assert.deepEqual(out._mcpWarnings, [], "成功 ⇒ 零警告")
})

test("AC-691-2 无文件 ∕ cwd = null：零并入（工具恒等 + 假连接器零调用）", async () => {
  const recA = recorder()
  const a = harness(cfg(), recA.connect)
  const outA = await assembleFor({ cwd: tmp("mcp691-2a-"), slot: 1, deps: a.deps })
  assert.equal(outA.tools, a.baseTools, "无文件 ⇒ 工具恒等")
  assert.equal(recA.calls.length, 0, "假连接器零调用")
  const recB = recorder()
  const b = harness(cfg(), recB.connect)
  const outB = await assembleFor({ cwd: null, slot: 1, deps: b.deps })
  assert.equal(outB.tools, b.baseTools, "cwd = null ⇒ 工具恒等")
  assert.equal(recB.calls.length, 0, "cwd = null ⇒ 零调用（零读）")
})

test("AC-691-3 优先级：config 同名优先（文件源同名片零调用）", async () => {
  const cwd = tmp("mcp691-3-")
  writeMcpJson(cwd, { mcpServers: { alpha: { command: "B" } } })
  const rec = recorder()
  const h = harness(cfg({ mcp: { servers: [{ name: "alpha", command: "A" }] } }), rec.connect)
  await assembleFor({ cwd, slot: 1, deps: h.deps })
  assert.deepEqual(rec.calls, [{ name: "alpha", command: "A" }], "仅 config 条目 A 被连（B 零调用）")
})

test("AC-691-4 合并序：config 先 ∕ 文件源后（序列断言）", async () => {
  const cwd = tmp("mcp691-4-")
  writeMcpJson(cwd, { mcpServers: { beta: { command: "B" } } })
  const rec = recorder()
  const h = harness(cfg({ mcp: { servers: [{ name: "alpha", command: "A" }] } }), rec.connect)
  await assembleFor({ cwd, slot: 1, deps: h.deps })
  assert.deepEqual(rec.calls, [{ name: "alpha", command: "A" }, { name: "beta", command: "B" }], "两片皆连 + 序 = config 先")
})

test("AC-691-5 非变异：不回写 config.mcp.servers", async () => {
  const cwd = tmp("mcp691-5a-")
  writeMcpJson(cwd, { mcpServers: { alpha: { command: "x" } } })
  const confA = cfg() // 形 ①（同 AC-691-1）：config 零 `mcp` 键
  await assembleFor({ cwd, slot: 1, deps: harness(confA, recorder().connect).deps })
  assert.equal("mcp" in confA, false, "零回写新键")
  const cwd2 = tmp("mcp691-5b-")
  writeMcpJson(cwd2, { mcpServers: { beta: { command: "B" } } })
  const confB = cfg({ mcp: { servers: [{ name: "alpha", command: "A" }] } })
  await assembleFor({ cwd: cwd2, slot: 1, deps: harness(confB, recorder().connect).deps })
  assert.deepEqual(confB.mcp.servers, [{ name: "alpha", command: "A" }], "既有数组逐字保持（beta 零 push）")
})

test("AC-691-6 数组形 mcpServers：跳过 + 记录（非致命）", async () => {
  const cwd = tmp("mcp691-6-")
  writeMcpJson(cwd, { mcpServers: [{ name: "arr0", command: "x" }] })
  const rec = recorder()
  const h = harness(cfg(), rec.connect)
  const { result: out, lines } = await capturing(() => assembleFor({ cwd, slot: 1, deps: h.deps }))
  assert.equal(out.tools, h.baseTools, "装配完成 + 零并入（恒等）")
  assert.equal(rec.calls.length, 0, "零该片调用")
  assert.equal(lines.some((l) => l.includes("must be a plain object")), true, "记录面在场（CLI 同文本）")
  assert.deepEqual(out._mcpWarnings, [], "非致命——`_mcpWarnings` 零增")
})

test("AC-691-7 条目形：null ∕ 嵌套数组跳过；合法项照并", async () => {
  const cwd = tmp("mcp691-7-")
  writeMcpJson(cwd, { mcpServers: { badNull: null, badArr: ["x"], good: { command: "y" } } })
  const rec = recorder()
  const h = harness(cfg(), rec.connect)
  const out = await assembleFor({ cwd, slot: 1, deps: h.deps })
  assert.deepEqual(rec.calls, [{ name: "good", command: "y" }], "非法项跳过 + 合法项照并")
  assert.equal(out.tools.some((t) => t._mcpName === "good"), true, "合法项工具落位")
})

test("AC-691-8 坏 JSON：非致命（恒等 + `_mcpWarnings` 零增）", async () => {
  const cwd = tmp("mcp691-8-")
  writeFileSync(join(cwd, ".mcp.json"), "{ not-json")
  const rec = recorder()
  const h = harness(cfg(), rec.connect)
  const { result: out, lines } = await capturing(() => assembleFor({ cwd, slot: 1, deps: h.deps }))
  assert.equal(out.tools, h.baseTools, "装配完成 + 工具恒等")
  assert.equal(rec.calls.length, 0, "零调用")
  assert.equal(lines.some((l) => l.includes("Failed to read .mcp.json")), true, "记录面 `[mcp] Failed to read .mcp.json: …`")
  assert.deepEqual(out._mcpWarnings, [], "`_mcpWarnings` 零增（CLI 同判——仅 console.error）")
})

test("AC-691-9 文件源连接抛：`_mcpWarnings` +1 且不抛", async () => {
  const cwd = tmp("mcp691-9-")
  writeMcpJson(cwd, { mcpServers: { flaky: { command: "x" } } })
  const calls = []
  const connect = async (srv) => { calls.push(srv); throw new Error("boom") }
  const h = harness(cfg(), connect)
  const { result: out } = await capturing(() => assembleFor({ cwd, slot: 1, deps: h.deps })) // 不抛 ⇒ 到此处
  assert.deepEqual(calls, [{ name: "flaky", command: "x" }], "文件源条目已被调用")
  assert.equal(out._mcpWarnings.length, 1, "`_mcpWarnings` +1")
  assert.match(out._mcpWarnings[0], /^MCP server "flaky" failed to connect: boom$/, "警告逐字（沿现形）")
  assert.equal(out.tools, h.baseTools, "零并入 ⇒ 原数组原样")
})
