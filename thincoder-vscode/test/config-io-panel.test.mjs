/**
 * config-io-panel.test.mjs — MODEL-MERGE-SESSION VSC 面板写面 + 槽播种（AC-4 VSC 面——
 * 内容字节断言——非 mtime）+ defaultModel 面板项写通道（settings-panel-write）。
 * 覆盖：saveAgentSettingsFromPanel 白名单键（含新 defaultModel 顶层键——写 raw.defaultModel /
 * 空串删除——agent.* 合并语义不变）；selectModel 消息 = 写当前会话槽（saveLines 通道带
 * activeModel）——config 文件内容字节不变；会话文件双字段落盘（CLI 恢复同形）。
 */
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { _setConfigPathForTest, loadRaw } from "@thincoder/core/config-io.mjs"
import { saveAgentSettingsFromPanel, VSC_CONFIG_SCHEMA } from "../src/extension/settings-panel-write.mjs"
import { _setProbeImplForTest } from "@thincoder/core/provider/list-models.mjs"
import { _setSessionsDirForTest, _resetSessionsDirForTest, slotPath } from "../src/extension/session-io.mjs"
import { handlePanelMessage } from "../src/extension/panel-messages.mjs"
import { addMcpServer, removeMcpServer, loadMcpServers } from "../src/config-mcp.mjs"

let dir
let cfgPath
let sessionsDir

before(() => {
  dir = mkdtempSync(join(tmpdir(), "tc-panel-"))
  sessionsDir = join(dir, "sessions")
  mkdirSync(sessionsDir, { recursive: true })
  cfgPath = join(dir, "config.json")
  writeFileSync(cfgPath, JSON.stringify({
    defaultModel: "deepseek:deepseek-v4-pro",
    providers: [
      { name: "deepseek", baseURL: "https://api.deepseek.com", model: "deepseek-v4-pro", apiKey: "k1" },
      { name: "kimi", baseURL: "https://x", model: "kimi-k3", apiKey: "k2" },
    ],
  }, null, 2) + "\n", "utf8")
  _setConfigPathForTest(cfgPath)
  _setSessionsDirForTest(sessionsDir)
  // M9：defaultModel 面板写会 fire-and-forget 探一次 /models——本文件断言的是**写面**，
  // 探针以测试缝替身屏蔽（绝不碰网络——真探针面在 provider-admission.test.mjs）
  _setProbeImplForTest(async () => ({ ok: true, models: [] }))
})

after(() => {
  _setConfigPathForTest(null)
  _resetSessionsDirForTest()
  try { rmSync(dir, { recursive: true, force: true }) } catch { /* ignore */ }
})

test("白名单：defaultModel 面板键写 raw.defaultModel（顶层——非 agent.*）——空串/非串删除", () => {
  saveAgentSettingsFromPanel({ defaultModel: "kimi:kimi-k3", maxTurns: 99 })
  const raw = loadRaw()
  assert.equal(raw.defaultModel, "kimi:kimi-k3")
  assert.equal(raw.agent.maxTurns, 99, "agent.* 合并语义不变")
  // W16：面板写盘 = 本端写盘通道——`$schema` 指针在场（CORE-UNIFICATION §2.13.3 `opts.schema` 缝注入断言）
  assert.equal(raw.$schema, VSC_CONFIG_SCHEMA, "面板写盘注入 $schema 指针")
  // 清空（'' = 显式删除）
  saveAgentSettingsFromPanel({ defaultModel: "" })
  assert.equal("defaultModel" in loadRaw(), false)
  // 回写初始值（后续用例依赖）
  saveAgentSettingsFromPanel({ defaultModel: "deepseek:deepseek-v4-pro", maxTurns: undefined })
  assert.equal(loadRaw().defaultModel, "deepseek:deepseek-v4-pro")
})

test("AC-4 VSC：selectModel 消息 = 写当前会话槽——config 内容字节不变（快照对比）", async () => {
  const slot = 1
  const before = readFileSync(cfgPath, "utf8")
  const prefs = {}
  const saved = []
  const panel = {
    _context: { workspaceState: { get: () => prefs, update: (k, v) => { prefs[k] = v } } },
    _loadModelPrefs: () => (prefs.modelPrefs ??= {}),
    _ensureSlot: () => slot,
    _saveLines: (fh, ch, extra, s) => { saved.push({ fh, ch, extra, s }) },
    _pushSessions: () => {},
    _panel: { webview: { postMessage: () => Promise.resolve(true) } },
  }
  await handlePanelMessage(panel, { type: "selectModel", model: "kimi-k3", provider: "kimi" })
  assert.equal(saved.length, 1)
  assert.deepEqual(saved[0].extra, { activeProvider: "kimi", activeModel: "kimi-k3" }, "槽播种——saveLines 通道带 activeModel")
  assert.equal(prefs.modelPrefs.model, "kimi-k3", "workspaceState prefs 保留 UI 态")
  assert.equal(prefs.modelPrefs.provider, "kimi")
  assert.equal(readFileSync(cfgPath, "utf8"), before, "config 内容字节不变——选择不再写 config 全局（selectProviderModel 退役）")
  // 会话文件双字段落盘（真实 saveLines → saveSessionToSlot——CLI 恢复同形）
  const { saveLines } = await import("../src/extension/panel-session.mjs")
  const panel2 = {
    ...panel,
    _loadModelPrefs: () => ({}),
    _ensureSlot: () => slot,
    // 绑定语义：_saveLines(fh, ch, extra, slotOverride) → saveLines(panel, ...)
    _saveLines: (fh, ch, extra, s) => saveLines(panel2, fh, ch, extra, s),
  }
  // 面板真实通道：直接经 panel-session saveLines（slotOverride 显式）——existing 往返保全
  await handlePanelMessage(panel2, { type: "selectModel", model: "deepseek-v4-flash", provider: "deepseek" })
  const slotFile = slotPath(process.cwd(), slot)
  assert.equal(existsSync(slotFile), true)
  const data = JSON.parse(readFileSync(slotFile, "utf8"))
  assert.equal(data.activeProvider, "deepseek")
  assert.equal(data.activeModel, "deepseek-v4-flash")
  assert.deepEqual(Array.isArray(data.history) ? data.history : [], [], "空会话——无历史")
  // 摘要 digest 带模型（p:m 显示面数据）
  const { loadManifest } = await import("../src/extension/session-io.mjs")
  const m = loadManifest(process.cwd())
  assert.equal(m.slots[slot].activeProvider, "deepseek")
  assert.equal(m.slots[slot].activeModel, "deepseek-v4-flash")
  assert.equal(readFileSync(cfgPath, "utf8"), before, "再次确认 config 零写")
})

test("W16 回归（审计 🔴）：MCP 删条目走端壳写盘通道——可达 + config.json 更新 + $schema 保留", () => {
  assert.equal(addMcpServer("ctx7", { command: "npx", args: ["-y", "ctx7"] }), null)
  assert.equal(loadMcpServers().some((s) => s.name === "ctx7"), true, "写入后条目在场")
  assert.equal(removeMcpServer("ctx7"), null, "removeMcpServer 成功返回 null（不得 ReferenceError）")
  assert.equal(loadMcpServers().some((s) => s.name === "ctx7"), false, "条目已移除（盘面）")
  assert.equal(removeMcpServer("ctx7"), 'No MCP server named "ctx7"', "未知名 → 错误串（不抛）")
  assert.equal(loadRaw().$schema, VSC_CONFIG_SCHEMA, "MCP 写面同样注入/保留 $schema 指针")
})
