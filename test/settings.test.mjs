/**
 * settings.test.mjs — VS Code mirror of SETTINGS-TOOL.md T-S1 核心用例（2026-09-05）。
 * Config isolation: _setConfigPathForTest(tmp)（config-io 测试注入——与 CLI 同隔离法）。
 */
import { test, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { settingsTool } from "../src/agent-tools/settings.mjs"
import { _setConfigPathForTest } from "../src/config-io.mjs"

let dir
let cfgPath
function setupAgentConfig() {
  return {
    providers: [{ name: "deepseek", model: "deepseek-v4-pro", apiKey: "sk-vsc-secret" }],
    agent: { maxTurns: 200, verifyGuard: false },
    traces: { enabled: true, retentionHours: 24 },
  }
}

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "tc-vsc-settings-"))
  cfgPath = join(dir, "config.json")
  writeFileSync(cfgPath, JSON.stringify({ agent: { maxTurns: 200 } }, null, 2) + "\n", "utf8")
  _setConfigPathForTest(cfgPath)
})
afterEach(() => {
  _setConfigPathForTest(null)
  rmSync(dir, { recursive: true, force: true })
})

test("T-S1.1v: list——展平 + 敏感遮罩（明文零泄漏）", async () => {
  const c = { agent: { config: setupAgentConfig() } }
  const r = await settingsTool.execute({ action: "list" }, c)
  assert.ok(r.includes("agent.maxTurns = 200 (number)"), r)
  assert.ok(r.includes("providers.0.apiKey = ••••（masked） (string)"), "敏感遮罩: " + r)
  assert.ok(!r.includes("sk-vsc-secret"), "明文绝不出现")
})

test("T-S1.2v: get 单键 + 敏感遮罩", async () => {
  const c = { agent: { config: setupAgentConfig() } }
  assert.equal(await settingsTool.execute({ action: "get", key: "agent.maxTurns" }, c), "agent.maxTurns = 200 (number)")
  const s = await settingsTool.execute({ action: "get", key: "providers.0.apiKey" }, c)
  assert.ok(s.includes("••••（masked）") && !s.includes("sk-vsc-secret"), s)
})

test("T-S1.4v: set——热应用 + 写盘（共享 config.json 最小写）", async () => {
  const c = { agent: { config: setupAgentConfig() } }
  const r = await settingsTool.execute({ action: "set", key: "agent.maxTurns", value: "500" }, c)
  assert.ok(r.includes("hot-applied"), r)
  assert.equal(c.agent.config.agent.maxTurns, 500, "内存热应用")
  const disk = JSON.parse(readFileSync(cfgPath, "utf8"))
  assert.equal(disk.agent.maxTurns, 500, "磁盘已写")
  assert.equal(disk.agent.verifyGuard, undefined, "默认不固化")
})

test("T-S1.5v: set 类型校验（mini 表）——拒绝且双态不变", async () => {
  const c = { agent: { config: setupAgentConfig() } }
  await assert.rejects(
    () => settingsTool.execute({ action: "set", key: "traces.enabled", value: "yes" }, c),
    /"traces\.enabled" expects boolean/,
  )
  assert.equal(c.agent.config.traces.enabled, true, "内存未变")
  assert.equal((JSON.parse(readFileSync(cfgPath, "utf8")).traces ?? {}).enabled, undefined, "磁盘未变")
})

test("T-S1.7v: set 敏感键——真实写入 + 回显遮罩", async () => {
  const c = { agent: { config: setupAgentConfig() } }
  const r = await settingsTool.execute({ action: "set", key: "providers.0.apiKey", value: "sk-leak-456" }, c)
  assert.ok(r.includes("••••（masked）") && !r.includes("sk-leak-456"), r)
  assert.equal(c.agent.config.providers[0].apiKey, "sk-leak-456")
  assert.equal(JSON.parse(readFileSync(cfgPath, "utf8")).providers[0].apiKey, "sk-leak-456")
})

test("T-S1.11v: isReadonlyAction——list/get 只读、set 侧效", () => {
  assert.equal(settingsTool.isReadonlyAction({ action: "list" }), true)
  assert.equal(settingsTool.isReadonlyAction({ action: "get", key: "x" }), true)
  assert.equal(settingsTool.isReadonlyAction({ action: "set", key: "x", value: "1" }), false)
  assert.equal(settingsTool.isReadonlyAction({}), false)
})
