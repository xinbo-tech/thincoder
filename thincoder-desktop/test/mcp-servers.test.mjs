/**
 * mcp-servers.test.mjs — MCP 三通道用例（用例号 U108–U110 · `docs/desktop/design/PROJECT.md` §7 T-DSK10
 * + 批档 §2.4）：`mcp:list` 三键形 + 两形 + 缺形回落 + 摘要不含密钥 · `mcp:save` 先探活后落盘
 * （探不通零写盘）+ 随动接入三支 · `mcp:remove` 幂等 + 摘除 + 随动撤具（他服务器工具保留）。
 * 纪律：沙箱逐用例 `mkdtemp` + `_setConfigPathForTest`；假 MCP 伺服 = tmp 内 stdio 脚本（零新文件，
 * 真握手 = initialize + tools/list 换行分帧）——探活/接入均走核真链路，不用测试缝。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { _resetConfigPathForTest, _setConfigPathForTest } from "@thincoder/core/config-io.mjs"
import { _sessions } from "@thincoder/core/mcp.mjs"
import { mcpList, mcpRemove, mcpSave } from "../src/main/mcp-servers.mjs"

/** 假 MCP stdio 伺服源码：`argv[2]` = 逗号分隔工具名（空 ⇒ 零工具）；换行分帧应答。 */
const FAKE_SERVER = `
let buf = ""
const names = (process.argv[2] ?? "").split(",").filter(Boolean)
const reply = (id, result) => process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id, result }) + "\\n")
process.stdin.on("data", (d) => {
  buf += d
  const lines = buf.split("\\n")
  buf = lines.pop() ?? ""
  for (const line of lines) {
    if (!line.trim()) continue
    const msg = JSON.parse(line)
    if (msg.method === "initialize") reply(msg.id, { protocolVersion: "2024-11-05", capabilities: { tools: {} }, serverInfo: { name: "fake-mcp", version: "1.0.0" } })
    else if (msg.method === "tools/list") reply(msg.id, { tools: names.map((n) => ({ name: n, description: "tool " + n, inputSchema: { type: "object", properties: {} } })) })
  }
})
`
/** 假死伺服：stderr 留痕后退出（探活用——pending 解 `Connection closed | stderr: …`）。 */
const DEAD_SERVER = `console.error("boom-stderr")\nsetTimeout(() => process.exit(3), 50)\n`

/** 沙箱：tmp 目录 + 配置档 + 假伺服脚本 + 路径缝注入；返回读数面与 stdio 条目工厂。 */
function sandbox(t, initial = {}) {
  const dir = mkdtempSync(join(tmpdir(), "desktop-mcp-"))
  const configPath = join(dir, "config.json")
  writeFileSync(configPath, JSON.stringify(initial, null, 2) + "\n", "utf8")
  const serverPath = join(dir, "fake-mcp-server.mjs")
  writeFileSync(serverPath, FAKE_SERVER, "utf8")
  const deadPath = join(dir, "dead-mcp-server.mjs")
  writeFileSync(deadPath, DEAD_SERVER, "utf8")
  _setConfigPathForTest(configPath)
  t.after(() => {
    // 会话收尾：随动接入留下的真子进程会吊住事件循环（node --test 不退出）——逐会话关停。
    // 走核导出缝 `_sessions`（`mcp.mjs:42`）而非 `closeAllMcp(agent)`：后者只扫 `agent.tools`，
    // 未随动上具的会话（U109 `noTools` 支落的 `svc3`）会漏关 ⇒ 子进程残留；闭失败静默同核自身收尾（`mcp.mjs:280`）。
    for (const s of _sessions.values()) { try { s.closed = true; s.state.transport?.close() } catch { /* ignore */ } }
    _sessions.clear()
  })
  t.after(() => { _resetConfigPathForTest(); rmSync(dir, { recursive: true, force: true }) })
  return {
    /** stdio 条目（command 形）——真进程、真握手。 */
    entry: (tools) => ({ command: process.execPath, args: [serverPath, tools] }),
    dead: { command: process.execPath, args: [deadPath] },
    text: () => readFileSync(configPath, "utf8"),
    raw: () => JSON.parse(readFileSync(configPath, "utf8")),
  }
}

// ─── U108 mcp:list（三键形 / 两形 / 缺形回落 / 密钥零下发）──────────────

test("U108: mcp:list —— 三键形 + url/command 两形 + 缺形回落 + 摘要不含密钥", (t) => {
  sandbox(t, {
    mcp: {
      servers: [
        { name: "svc", command: "npx", args: ["-y", "svc-pkg"], env: { K: "v" }, headers: { authorization: "Bearer h-secret" }, token: "t0p-secret" },
        { name: "web", url: "https://mcp.invalid/sse" },
        { name: "ws", wsUrl: "wss://mcp.invalid/ws" },
        { name: "both", url: "https://u.invalid/sse", command: "npx" },
        { name: "bare" },
        null,
        "junk",
      ],
    },
  })
  const r = mcpList()
  assert.equal(r.ok, true)
  assert.deepEqual(Object.keys(r).sort(), ["ok", "servers"], "回执键闭集")
  for (const s of r.servers) assert.deepEqual(Object.keys(s).sort(), ["kind", "name", "summary"], "逐条三键形")
  const byName = Object.fromEntries(r.servers.map((s) => [s.name, s]))
  assert.deepEqual(Object.keys(byName).sort(), ["bare", "both", "svc", "web", "ws"], "非对象行（null/串）过滤")
  assert.equal(byName.svc.kind, "command")
  assert.equal(byName.svc.summary, "npx -y svc-pkg", "命令形摘要 = command + args 拼接")
  assert.equal(byName.web.kind, "url", "url ⇒ url 形")
  assert.equal(byName.ws.kind, "url", "wsUrl 同判 url 形")
  assert.equal(byName.web.summary, "https://mcp.invalid/sse", "url 形摘要 = 端点")
  assert.equal(byName.both.kind, "url", "两形并存 ⇒ url 优先（序判）")
  assert.equal(byName.bare.kind, "command", "形皆缺 ⇒ 回落 command")
  assert.equal(byName.bare.summary, "", "缺形摘要 = 空串（不抛）")
  const wire = JSON.stringify(r.servers)
  for (const secret of ["t0p-secret", "h-secret", "Bearer"]) assert.equal(wire.includes(secret), false, `摘要不含密钥「${secret}」`)
})

// ─── U109 mcp:save（先探活后落盘 / 零写盘 / 随动三支）──────────────────

test("U109: mcp:save —— 探活先行 + 落盘 + 随动接入三支 + 探不通零写盘", async (t) => {
  const { entry, dead, text, raw } = sandbox(t)
  const first = await mcpSave({ name: "svc", config: entry("echo,ping") }, {})
  assert.deepEqual(first, { ok: true, tools: 2 }, "无宿主面 ⇒ tools = 核探活读数（真握手 tools/list）")
  assert.deepEqual(raw(), { mcp: { servers: [{ ...entry("echo,ping"), name: "svc" }] } }, "落盘 = 原样条目 + name")

  const before = text()
  const failed = await mcpSave({ name: "dead", config: dead }, {})
  assert.equal(failed.ok, false)
  assert.equal(failed.reason, "probe-failed", "探不通 ⇒ 拒面（核错误串作 detail）")
  assert.match(failed.detail, /Connection closed \| stderr: boom-stderr/, `detail = 核串直传（实 = ${failed.detail}）`)
  assert.equal(text(), before, "探不通零写盘（字节级不变，条目未落）")

  const shapeBefore = text()
  for (const payload of [{ config: entry("a") }, { name: "x" }, { name: "x", config: [] }, { name: "x", config: { env: {} } }]) {
    assert.deepEqual(await mcpSave(payload, {}), { ok: false, reason: "invalid-shape" }, "形判：缺名 / 缺 config / 非对象 / 形皆缺")
  }
  assert.equal(text(), shapeBefore, "形判拒面零写盘")

  const agent = { tools: [] }
  const ctx = { listAgents: () => [agent] }
  assert.deepEqual(await mcpSave({ name: "svc2", config: entry("echo,ping") }, ctx), { ok: true, tools: 2 }, "有宿主面 ⇒ tools = 补入数")
  assert.deepEqual(agent.tools.map((x) => x.name), ["svc2_echo", "svc2_ping"], "工具名 = `<服务器名>_<工具名>`（核 buildTools）")
  assert.deepEqual(agent.tools.map((x) => x._mcpName), ["svc2", "svc2"], "随动工具带 `_mcpName`（撤具判据）")
  assert.deepEqual(await mcpSave({ name: "svc2", config: entry("echo,ping") }, ctx), { ok: true, tools: 0 }, "已持同名工具 ⇒ 不重复追加（补入 0）")
  assert.equal(agent.tools.length, 2, "二回零增长")
  const noTools = { listAgents: () => [{ tools: "nope" }] }
  assert.deepEqual(await mcpSave({ name: "svc3", config: entry("echo,ping") }, noTools), { ok: true, tools: 0 }, "宿主无 tools 数组 ⇒ 跳过（补入 0）")
  assert.equal(raw().mcp.servers.map((s) => s.name).join(), "svc,svc2,svc3", "三支各自落盘（探活通过即写）")
})

// ─── U110 mcp:remove（幂等 / 摘除 / 随动撤具）─────────────────────────

test("U110: mcp:remove —— 幂等摘除 + 随动撤具（他服务器工具保留）+ 畸形档两面", async (t) => {
  const { entry, raw } = sandbox(t)
  const foreign = { name: "other_tool", _mcpName: "other" }
  const agent = { tools: [foreign] }
  const ctx = { listAgents: () => [agent] }
  await mcpSave({ name: "svc", config: entry("echo,ping") }, ctx)
  assert.equal(agent.tools.length, 3, "落盘后随动补入 2 具（+1 他服务器工具）")

  assert.deepEqual(mcpRemove({ name: "svc" }, ctx), { ok: true }, "摘除成功回执（无 reason 键）")
  assert.deepEqual(agent.tools, [foreign], "撤具只摘同名（他服务器工具保留）+ 数组重赋")
  assert.deepEqual(raw().mcp.servers, [], "盘面摘除（条目清空）")
  assert.deepEqual(mcpRemove({ name: "svc" }, ctx), { ok: true }, "幂等：名不存在 = 无操作成功")
  assert.deepEqual(raw().mcp.servers, [], "二回盘面零变")
  assert.deepEqual(mcpRemove({}, ctx), { ok: false, reason: "invalid-shape" }, "空名端侧先拒")
  assert.deepEqual(mcpRemove({ name: "svc" }), { ok: true }, "无宿主面：随动空操作，盘面照摘")

  const dir = mkdtempSync(join(tmpdir(), "desktop-mcp-bad-"))
  const badPath = join(dir, "config.json")
  writeFileSync(badPath, "{ not json", "utf8")
  _setConfigPathForTest(badPath)
  t.after(() => { _resetConfigPathForTest(); rmSync(dir, { recursive: true, force: true }) })
  assert.throws(() => mcpList(), /not valid JSON/, "读面：核 loadConfig 抛 ⇒ 本档零 catch 直传")
  assert.throws(() => mcpRemove({ name: "svc" }), /not parseable/, "写面：核写面拒改畸形档（抛直传）")
  assert.equal(readFileSync(badPath, "utf8"), "{ not json", "畸形档零改写（字节级不变）")
})
