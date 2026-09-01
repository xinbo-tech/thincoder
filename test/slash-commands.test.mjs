/**
 * slash-commands.mjs tests — dispatch, args passing, aliases, case-insensitivity, completions.
 * Handlers get a minimal mock ctx (same pattern as test/tui.test.mjs).
 */
import { test } from "node:test"
import { slow } from "./slow.mjs"
import assert from "node:assert/strict"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { readFileSync, writeFileSync, rmSync } from "node:fs"
import { createServer } from "node:http"

import { createSlashCommands, SLASH_COMMANDS, SLASH_ALIASES, HANDLERS } from "../src/tui/slash-commands.mjs"

/** Minimal ctx mock: records pushLine/pushLabel output, stubs pickers/config helpers. */
function mockCtx(overrides = {}) {
  const lines = []
  const agent = {
    provider: { model: "deepseek-chat", apiKey: "sk-test" },
    providers: [
      { name: "deepseek", model: "deepseek-chat" },
      { name: "kimi", model: "kimi-k3" },
    ],
    activeProvider: "deepseek",
    config: { mcp: { servers: [] } },
    goal: null,
    tools: [],
  }
  const state = { input: [], cursor: 0, foldEnabled: false, queue: [], completion: null }
  const ctx = {
    agent, state, lines,
    calls: {},
    pushLine: (text) => lines.push({ kind: "line", text }),
    pushLabel: (text) => lines.push({ kind: "label", text }),
    render: () => {},
    openPicker: undefined, // 回调式 API 已删除，保留键以捕获未迁移的调用
    // pickerResponse：测试预设"选中项"——entry 对象，或 (entries) => entry 函数；未设 = Esc 取消
    pickerResponse: null,
    showPicker: async (title, entries, opts) => {
      ctx.calls.showPicker = { title, entries, opts }
      ;(ctx.calls.pickers ??= []).push({ title, entries, opts })
      const r = ctx.pickerResponse
      ctx.pickerResponse = null
      return typeof r === "function" ? r(entries) : (r ?? null)
    },
    closePicker: () => {},
    askQuestion: async () => "",
    askPermission: async () => true,
    persistRaw: async (fn) => fn({}),
    syncProviderField: async (k, v) => { (ctx.calls.synced ??= []).push([k, v]) },
    maskKey: () => "***",
    openModelPicker: async () => { ctx.calls.modelPicker = true },
    selectModel: async (item) => { ctx.calls.selectModel = item },
    setProviderKey: async () => {},
    runDistill: async () => 0,
    exit: () => {},
    ...overrides,
  }
  return ctx
}

const texts = (ctx) => ctx.lines.map((l) => l.text).join("\n")

// ====================================================================
// registry sync
// ====================================================================

test("registry sync: every SLASH_COMMANDS entry has a handler and vice versa", () => {
  for (const c of SLASH_COMMANDS) {
    assert.equal(typeof HANDLERS[c.name], "function", `${c.name} missing handler`)
  }
  for (const name of Object.keys(HANDLERS)) {
    assert.ok(SLASH_COMMANDS.some((c) => c.name === name), `${name} handler not listed in SLASH_COMMANDS`)
  }
})

test("registry sync: aliases point at real commands", () => {
  for (const [alias, target] of Object.entries(SLASH_ALIASES)) {
    assert.equal(typeof HANDLERS[target], "function", `alias ${alias} → ${target} has no handler`)
  }
})

// ====================================================================
// handleSlash dispatch
// ====================================================================

test("handleSlash: unknown command prints error", async () => {
  const ctx = mockCtx()
  const { handleSlash } = createSlashCommands(ctx)
  await handleSlash("/nosuch")
  assert.match(texts(ctx), /Unknown command: \/nosuch/)
})

test("handleSlash: case-insensitive matching (/HELP, alias /H)", async () => {
  const ctx = mockCtx()
  const { handleSlash } = createSlashCommands(ctx)
  await handleSlash("/HELP")
  assert.match(texts(ctx), /Help/)
  assert.ok(!/Unknown command/.test(texts(ctx)))
  ctx.lines.length = 0
  await handleSlash("/H")
  assert.match(texts(ctx), /Help/)
})

test("handleSlash: /fold on|off args take effect, bare /fold toggles", async () => {
  const ctx = mockCtx()
  const { handleSlash } = createSlashCommands(ctx)
  await handleSlash("/fold on")
  assert.equal(ctx.state.foldEnabled, true)
  await handleSlash("/fold off")
  assert.equal(ctx.state.foldEnabled, false)
  await handleSlash("/fold")
  assert.equal(ctx.state.foldEnabled, true)
  // uppercase args also work
  await handleSlash("/FOLD OFF")
  assert.equal(ctx.state.foldEnabled, false)
})

test("handleSlash: /model <provider> switches via selectModel; unknown provider errors; bare /model opens picker", async () => {
  const ctx = mockCtx()
  const { handleSlash } = createSlashCommands(ctx)
  await handleSlash("/model kimi")
  assert.deepEqual(ctx.calls.selectModel, { provider: "kimi", model: "kimi-k3" })
  await handleSlash("/model nosuch")
  assert.match(texts(ctx), /Unknown provider: nosuch/)
  await handleSlash("/model")
  assert.equal(ctx.calls.modelPicker, true)
})

test("handleSlash: alias /m <provider> resolves to /model with args", async () => {
  const ctx = mockCtx()
  const { handleSlash } = createSlashCommands(ctx)
  await handleSlash("/m kimi")
  assert.deepEqual(ctx.calls.selectModel, { provider: "kimi", model: "kimi-k3" })
})

test("handleSlash: /think effort <level> validates against current model enum", async () => {
  const ctx = mockCtx()
  const { handleSlash } = createSlashCommands(ctx)
  // deepseek enum is ["high", "max"]
  await handleSlash("/think effort max")
  assert.equal(ctx.agent.provider.reasoningEffort, "max")
  assert.deepEqual(ctx.calls.synced, [["reasoningEffort", "max"]])
  // invalid level → explicit hint, state unchanged
  await handleSlash("/think effort low")
  assert.match(texts(ctx), /Usage: \/think effort <high\|max>/)
  assert.equal(ctx.agent.provider.reasoningEffort, "max")
})

test("handleSlash: /think on|off toggles thinking field", async () => {
  const ctx = mockCtx()
  const { handleSlash } = createSlashCommands(ctx)
  await handleSlash("/think off")
  assert.deepEqual(ctx.agent.provider.thinking, { type: "disabled" })
  await handleSlash("/think on")
  assert.deepEqual(ctx.agent.provider.thinking, { type: "enabled" })
})

test("handleSlash: /think with unknown arg prints usage", async () => {
  const ctx = mockCtx()
  const { handleSlash } = createSlashCommands(ctx)
  await handleSlash("/think bogus")
  assert.match(texts(ctx), /Usage: \/think/)
})

test("handleSlash: /goal set/cancel/view work via args (exercises C import — P0 regression)", async () => {
  const ctx = mockCtx()
  const { handleSlash } = createSlashCommands(ctx)
  await handleSlash("/goal set refactor auth module; no regressions")
  assert.equal(ctx.agent.goal.objective, "refactor auth module")
  assert.equal(ctx.agent.goal.criteria, "no regressions")
  await handleSlash("/goal view")
  assert.match(texts(ctx), /Goal: refactor auth module/)
  await handleSlash("/goal cancel")
  assert.equal(ctx.agent.goal, null)
  await handleSlash("/goal view")
  assert.match(texts(ctx), /No goal set/)
})

test("handleSlash: /goal set without text prints usage", async () => {
  const ctx = mockCtx()
  const { handleSlash } = createSlashCommands(ctx)
  await handleSlash("/goal set")
  assert.match(texts(ctx), /Usage: \/goal set/)
})

test("handleSlash: /mcp list works; unknown subcommand prints usage (no 'url' subcommand)", async () => {
  const ctx = mockCtx()
  const { handleSlash } = createSlashCommands(ctx)
  await handleSlash("/mcp list")
  assert.match(texts(ctx), /MCP Servers/)
  await handleSlash("/mcp url http://x")
  assert.match(texts(ctx), /Usage: \/mcp/)
})

test("handleSlash: /mcp remove <name> validates server name", async () => {
  const ctx = mockCtx()
  const { handleSlash } = createSlashCommands(ctx)
  await handleSlash("/mcp remove ghost")
  assert.match(texts(ctx), /no server named "ghost"/)
})

test("handleSlash: /config with unknown arg prints usage", async () => {
  const ctx = mockCtx()
  const { handleSlash } = createSlashCommands(ctx)
  await handleSlash("/config bogus")
  assert.match(texts(ctx), /Usage: \/config/)
})

// ====================================================================
// completions
// ====================================================================

test("completions: command names, case-insensitive prefix", () => {
  const ctx = mockCtx()
  const { completions } = createSlashCommands(ctx)
  assert.deepEqual(completions("/he"), ["/help"])
  assert.deepEqual(completions("/HE"), ["/help"])
  assert.equal(completions("/").length, SLASH_COMMANDS.length)
  assert.deepEqual(completions("hello"), [])
})

test("completions: /model offers provider names", () => {
  const ctx = mockCtx()
  const { completions } = createSlashCommands(ctx)
  assert.deepEqual(completions("/model "), ["/model deepseek", "/model kimi"])
})

test("completions: alias /m gets /model arg completion", () => {
  const ctx = mockCtx()
  const { completions } = createSlashCommands(ctx)
  assert.deepEqual(completions("/m "), ["/m deepseek", "/m kimi"])
})

test("completions: /think effort enum comes from current model spec", () => {
  const ctx = mockCtx()
  const { completions } = createSlashCommands(ctx)
  // deepseek-chat → ["high", "max"]
  assert.deepEqual(completions("/think "), ["/think on", "/think off", "/think effort"])
  assert.deepEqual(completions("/think effort "), ["/think effort high", "/think effort max"])
  // glm-5 has a wider enum
  ctx.agent.provider.model = "glm-5"
  const glm = completions("/think effort ")
  assert.ok(glm.includes("/think effort xhigh"))
  assert.ok(glm.includes("/think effort minimal"))
})

test("completions: /mcp subcommands match implementation (http/ws/stdio, no url)", () => {
  const ctx = mockCtx()
  const { completions } = createSlashCommands(ctx)
  const subs = completions("/mcp ")
  assert.ok(subs.includes("/mcp http"))
  assert.ok(subs.includes("/mcp ws"))
  assert.ok(subs.includes("/mcp stdio"))
  assert.ok(subs.includes("/mcp list"))
  assert.ok(!subs.some((s) => s === "/mcp url"), "url is not a real transport")
})

test("completions: /goal and /config subcommands", () => {
  const ctx = mockCtx()
  const { completions } = createSlashCommands(ctx)
  assert.deepEqual(completions("/goal "), ["/goal set", "/goal cancel"])
  // /config 直参只实现 embedkey（set 会把用户导向报错，不提供）
  assert.deepEqual(completions("/config "), ["/config embedkey"])
})

test("completions: /mcp 提供 ai 子命令；remove/connect 服务器名匹配大小写不敏感", () => {
  const ctx = mockCtx()
  ctx.agent.config.mcp.servers.push({ name: "fs", command: "npx" })
  const { completions } = createSlashCommands(ctx)
  assert.ok(completions("/mcp ").includes("/mcp ai"))
  assert.deepEqual(completions("/mcp remove "), ["/mcp remove fs"])
  assert.deepEqual(completions("/mcp connect "), ["/mcp connect fs"])
  // 子命令已小写化，大写 REMOVE 同样给出服务器名
  assert.deepEqual(completions("/mcp REMOVE "), ["/mcp REMOVE fs"])
})

// ====================================================================
// P0 regressions: cmd-upgrade (ansi/C from ctx) / cmd-goal (missing C import)
// ====================================================================

slow("cmd-upgrade: runs without TypeError (ansi/C imported, not from ctx)", async () => {
  const { handleUpgradeCommand } = await import("../src/tui/cmd-upgrade.mjs")
  const ctx = mockCtx()
  // checkForUpdate hits the npm registry with a 5s timeout and swallows errors —
  // offline it prints "Unable to query", online "already latest" or opens the picker.
  await handleUpgradeCommand(ctx)
  assert.match(texts(ctx), /Upgrade/)
  assert.match(texts(ctx), /Checking for updates/)
})

test("cmd-goal: module imports cleanly and picker path works without args", async () => {
  const { handleGoalCommand } = await import("../src/tui/cmd-goal.mjs")
  const ctx = mockCtx()
  await handleGoalCommand(ctx, [])
  assert.equal(ctx.calls.showPicker.title, "Goal")
})

test("cmd-goal: picker 路径 set 成功后有 Goal set 反馈（与直参口径一致）", async () => {
  const ctx = mockCtx()
  ctx.pickerResponse = (entries) => entries.find((e) => e.action === "set")
  const { handleSlash } = createSlashCommands({ ...ctx, askQuestion: async () => "ship v2; no regressions" })
  await handleSlash("/goal")
  assert.equal(ctx.agent.goal.objective, "ship v2")
  assert.match(texts(ctx), /Goal set: ship v2/, "picker 路径也输出 Goal set 反馈")
})

// ====================================================================
// picker 选中路径（showPicker mock 返回指定 entry）+ 直参回归
// ====================================================================

test("cmd-undo: 选中条目后 splice 掉该条及所有更新条目", async () => {
  const ctx = mockCtx()
  ctx.agent.cwd = "/nonexistent-undo-test"
  ctx.agent._undoStack = [
    { tool: "write", path: "a.txt", backup: null, timestamp: Date.now() },
    { tool: "write", path: "b.txt", backup: null, timestamp: Date.now() },
    { tool: "write", path: "c.txt", backup: null, timestamp: Date.now() },
  ]
  ctx.pickerResponse = (entries) => entries.find((e) => e.type === "item" && e.idx === 1)
  const { handleSlash } = createSlashCommands(ctx)
  await handleSlash("/undo")
  assert.equal(ctx.agent._undoStack.length, 1, "idx=1 及更新的条目被移除")
  assert.match(texts(ctx), /Reverted: write b\.txt/)
})

test("handleSlash: /new 选 yes 确认后清空会话", async () => {
  const { mkdtempSync } = await import("node:fs")
  const { tmpdir } = await import("node:os")
  const { join } = await import("node:path")
  const { sessionPath } = await import("../src/session.mjs")
  const ctx = mockCtx()
  // newSession 写入槽位文件，用临时 cwd 并在结束后清理
  ctx.agent.cwd = mkdtempSync(join(tmpdir(), "thincoder-new-test-"))
  ctx.agent.history = [{ role: "user", content: "hi" }]
  ctx.pickerResponse = (entries) => entries.find((e) => e.action === "yes")
  const { handleSlash } = createSlashCommands(ctx)
  try {
    await handleSlash("/new")
    assert.equal(ctx.agent.history.length, 0, "history 被清空")
    assert.match(texts(ctx), /New session started/)
  } finally {
    const { rmSync } = await import("node:fs")
    const sp = sessionPath(ctx.agent.cwd)
    try { rmSync(sp, { force: true }) } catch {}
    try { rmSync(sp + ".manifest", { force: true }) } catch {}
    for (let i = 1; i <= 5; i++) {
      try { rmSync(sp + "." + i, { force: true }) } catch {}
    }
    rmSync(ctx.agent.cwd, { recursive: true, force: true })
  }
})

test("handleSlash: /advisor 菜单无 Advisor ON/OFF toggle，guard 项写 guard 字段", async () => {
  const ctx = mockCtx()
  let sawEntries = null
  ctx.pickerResponse = (entries) => {
    sawEntries = entries
    return entries.find((e) => e.action === "guard")
  }
  const { handleSlash } = createSlashCommands(ctx)
  await handleSlash("/advisor")
  assert.equal(sawEntries.some((e) => e.action === "toggle"), false, "Advisor ON/OFF toggle 项已移除（评审恒启用）")
  assert.equal(ctx.agent.config.advisor.guard, true, "guard 字段被写入")
  assert.equal(ctx.agent.config.advisor.enabled, undefined, "enabled 字段不再写入（已废弃）")
})

test("handleSlash: autoThink 开启时 /think on|effort 直参被拒绝且不写入手动值", async () => {
  const ctx = mockCtx()
  ctx.agent.config.agent = { autoThink: true }
  const { handleSlash } = createSlashCommands(ctx)
  await handleSlash("/think on")
  assert.match(texts(ctx), /Auto-think is ON/)
  assert.equal(ctx.agent.provider.thinking, undefined, "未写入手动 thinking")
  await handleSlash("/think effort max")
  assert.equal(ctx.agent.provider.reasoningEffort, undefined, "未写入手动 effort")
  // 关掉 autoThink 后直参恢复可用
  ctx.agent.config.agent.autoThink = false
  await handleSlash("/think effort max")
  assert.equal(ctx.agent.provider.reasoningEffort, "max")
})

test("handleSlash: /goal cancel 无 goal 时提示 No goal set", async () => {
  const ctx = mockCtx()
  const { handleSlash } = createSlashCommands(ctx)
  await handleSlash("/goal cancel")
  assert.match(texts(ctx), /No goal set/)
  assert.ok(!/Goal cancelled/.test(texts(ctx)))
  // 有 goal 时才是 Goal cancelled
  await handleSlash("/goal set something")
  await handleSlash("/goal cancel")
  assert.match(texts(ctx), /Goal cancelled/)
})

test("handleSlash: /mcp remove 不带 name 直接进服务器选择 picker（不落主菜单）", async () => {
  const ctx = mockCtx()
  ctx.agent.config.mcp.servers.push({ name: "fs", command: "npx" })
  const titles = []
  const { handleSlash } = createSlashCommands({
    ...ctx,
    persistRaw: async (fn) => fn({ mcp: { servers: [] } }),
    showPicker: async (title, entries) => {
      titles.push(title)
      return entries.find((e) => e.type === "item") // 选中 fs → removeServer
    },
  })
  await handleSlash("/mcp remove")
  assert.deepEqual(titles, ["Remove MCP Server"], "只弹选择 picker，不经过主菜单")
  assert.equal(ctx.agent.config.mcp.servers.length, 0)
  assert.match(texts(ctx), /fs removed/)
})

test("handleSlash: /mcp remove 无服务器时提示且不开 picker", async () => {
  const ctx = mockCtx()
  let pickerCalled = false
  const { handleSlash } = createSlashCommands({
    ...ctx,
    showPicker: async () => { pickerCalled = true; return null },
  })
  await handleSlash("/mcp remove")
  assert.equal(pickerCalled, false)
  assert.match(texts(ctx), /no MCP server configured/)
})

test("cmd-mcp: 原本无 mcp 配置时 Add server 后回主菜单计数更新（快照过期回归；§5 新菜单形态）", async () => {
  const { handleMcpCommand } = await import("../src/tui/cmd-mcp.mjs")
  const { removeMcpTools } = await import("../src/mcp.mjs")
  // D-Q1（2026-09-02）：探活 ✗ 无保存通道——add 要完成必须 probe ✓；旧死端口 +
  // save-anyway "y" 流程已废除，改用真实 POST-only server（探活 + 连接均成功）
  const server = createServer((req, res) => {
    if (req.method === "GET") {
      res.writeHead(405, { "Content-Type": "application/json" })
      res.end(JSON.stringify({ error: "Method Not Allowed" }))
      return
    }
    let body = ""
    req.on("data", (d) => (body += d))
    req.on("end", () => {
      const msg = JSON.parse(body)
      const result = msg.method === "initialize"
        ? { protocolVersion: "2024-11-05", capabilities: {}, serverInfo: { name: "t", version: "1" } }
        : msg.method === "tools/list" ? { tools: [] } : {}
      res.writeHead(200, { "Content-Type": "application/json" })
      res.end(JSON.stringify({ jsonrpc: "2.0", id: msg.id, result }))
    })
  })
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const ctx = mockCtx()
  ctx.agent.config = {} // 原本无 mcp 配置 —— 旧代码 ?? [] 拿到游离数组
  ctx.configPath = join(tmpdir(), `thincoder-slashmcp-${process.pid}-${Date.now()}.json`) // reloadMcpFromDisk 注入
  writeFileSync(ctx.configPath, JSON.stringify({}))
  const questions = ["s1", `http://127.0.0.1:${server.address().port}/mcp`, ""] // name / url / token 空（无确认问句——D-Q1）
  const menus = []
  const formRounds = []
  try {
    await handleMcpCommand({
      ...ctx,
      askQuestion: async () => questions.shift() ?? "",
      showPicker: async (title, entries) => {
        if (title === "MCP") {
          menus.push(entries)
          // 第一轮选 Add server；第二轮 Esc 退出
          return menus.length === 1 ? entries.find((e) => e.action === "add") : null
        }
        if (title === "MCP Transport") return entries.find((e) => e.action === "http")
        if (title.startsWith("Add MCP")) {
          formRounds.push(entries)
          const seq = ["field:name", "field:url", "field:token", "save"]
          return entries.find((e) => e.action === seq[Math.min(formRounds.length - 1, 3)]) ?? entries.find((e) => e.action === "save")
        }
        return null
      },
      persistRaw: async (mutate) => {
        const raw = JSON.parse(readFileSync(ctx.configPath, "utf8"))
        mutate(raw)
        writeFileSync(ctx.configPath, JSON.stringify(raw))
      },
    }, [])
    assert.equal(menus.length, 2, "add 完成后回到主菜单")
    assert.ok(
      menus[1].some((e) => e.type === "header" && /1 MCP server configured/.test(e.text)),
      "第二轮主菜单计数为 1（reloadMcpFromDisk 幂等——自写配置不标 ⚠）",
    )
    assert.match(texts(ctx), /\[mcp\] Connecting s1/, "探活 ✓ 直接保存 → add 走连接（D-Q1）")
  } finally {
    removeMcpTools(ctx.agent, "s1")
    rmSync(ctx.configPath, { force: true })
    server.close()
  }
})

test("handleSlash: handler exception is contained into an error line — TUI must not lock up (IKBNUI)", async () => {
  const lines = []
  const ctx = {
    agent: {}, state: {}, memory: {},
    pushLine: (t) => lines.push(t), render: () => {},
    showPicker: () => Promise.resolve(null), closePicker: () => {},
    exit: () => {}, openModelPicker: () => {}, persistRaw: async () => {}, syncProviderField: async () => {},
  }
  const { handleSlash } = createSlashCommands(ctx)
  // /think with an empty agent (no provider) makes the handler throw — the exception must be
  // caught as an error line, not propagated up into the submit path (which would freeze the TUI).
  await handleSlash("/think")
  assert.ok(lines.some((l) => l.startsWith("[error]")), `expected a [error] line, got: ${JSON.stringify(lines)}`)
})