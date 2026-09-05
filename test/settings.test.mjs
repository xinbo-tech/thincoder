/**
 * settings.test.mjs — SETTINGS-TOOL.md T-S1 系（2026-09-05 立项 · 用户三项裁定）。
 * 配置隔离：settingsTool({ configPath: tmp })——写盘落 tmp 文件；agent.config 由测试构造
 * （模拟 loadConfig 产物——含 agent/traces 节）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { settingsTool } from "../src/agent-tools/settings.mjs"

function setup() {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-settings-"))
  const cfgPath = join(dir, "config.json")
  // 模拟 loadConfig 产物（含默认值与用户节）
  const config = {
    $schema: "https://example.com/thincoder.schema.json",
    providers: [{ name: "deepseek", model: "deepseek-v4-pro", apiKey: "sk-real-secret" }],
    activeProvider: "deepseek",
    agent: { maxTurns: 200, verifyGuard: false },
    traces: { enabled: true, retentionHours: 24 },
  }
  writeFileSync(cfgPath, JSON.stringify({ agent: { maxTurns: 200 } }, null, 2) + "\n", "utf8") // 磁盘最小化
  const tool = settingsTool({ configPath: cfgPath })
  const ctx = () => ({ agent: { config: JSON.parse(JSON.stringify(config)) } }) // 每用例新 agent.config
  return { tool, cfgPath, dir, ctx }
}

test("T-S1.1: list——全键展平 + 类型标注 + 敏感键遮罩", async () => {
  const { tool, ctx, dir } = setup()
  try {
    const r = await tool.execute({ action: "list" }, ctx())
    assert.ok(r.includes("agent.maxTurns = 200 (number)"), r)
    assert.ok(r.includes("traces.enabled = true (boolean)"), r)
    assert.ok(r.includes("activeProvider = deepseek (string)"), r)
    assert.ok(r.includes("providers.0.model = deepseek-v4-pro (string)"), r)
    assert.ok(r.includes("providers.0.apiKey = ••••（masked） (string)"), "敏感键遮罩: " + r)
    assert.ok(!r.includes("sk-real-secret"), "明文绝不出现")
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

test("T-S1.2: get 单键", async () => {
  const { tool, ctx, dir } = setup()
  try {
    const r = await tool.execute({ action: "get", key: "agent.maxTurns" }, ctx())
    assert.equal(r, "agent.maxTurns = 200 (number)")
    const sensitive = await tool.execute({ action: "get", key: "providers.0.apiKey" }, ctx())
    assert.ok(sensitive.includes(MASK()), "敏感 get 遮罩")
    assert.ok(!sensitive.includes("sk-real-secret"))
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

test("T-S1.3: get 不存在键——报错含父键提示", async () => {
  const { tool, ctx, dir } = setup()
  try {
    await assert.rejects(
      () => tool.execute({ action: "get", key: "agent.nonexistent" }, ctx()),
      /no such key "agent\.nonexistent".*父键 agent 存在/,
    )
    await assert.rejects(
      () => tool.execute({ action: "get", key: "ghost" }, ctx()),
      /no such key "ghost".*顶层可用键见 settings list/,
    )
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

test("T-S1.4: set——热应用（内存）+ 写盘（文件）", async () => {
  const { tool, cfgPath, ctx, dir } = setup()
  try {
    const c = ctx()
    const r = await tool.execute({ action: "set", key: "agent.maxTurns", value: "500" }, c)
    assert.ok(r.includes("agent.maxTurns = 500 (number)"), r)
    assert.ok(r.includes("hot-applied"), r)
    assert.equal(c.agent.config.agent.maxTurns, 500, "内存热应用")
    // 同会话 get 见新值（AC-S1.4）
    const g = await tool.execute({ action: "get", key: "agent.maxTurns" }, c)
    assert.equal(g, "agent.maxTurns = 500 (number)")
    // 写盘断言（文件只含被设键 + 既有磁盘键——默认不固化）
    const disk = JSON.parse(readFileSync(cfgPath, "utf8"))
    assert.equal(disk.agent.maxTurns, 500, "磁盘已写")
    assert.equal(disk.agent.verifyGuard, undefined, "默认不固化（未设键不落盘）")
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

test("T-S1.5: set 类型校验——已知键类型不符拒绝（文件与内存均不变）", async () => {
  const { tool, cfgPath, ctx, dir } = setup()
  try {
    const c = ctx()
    await assert.rejects(
      () => tool.execute({ action: "set", key: "agent.maxTurns", value: "abc" }, c),
      /"agent\.maxTurns" expects number/,
    )
    assert.equal(c.agent.config.agent.maxTurns, 200, "内存未变")
    assert.equal(JSON.parse(readFileSync(cfgPath, "utf8")).agent.maxTurns, 200, "磁盘未变")
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

test("T-S1.6: set 字符串 \"true\" → JSON 解析为 boolean", async () => {
  const { tool, cfgPath, ctx, dir } = setup()
  try {
    const c = ctx()
    const r = await tool.execute({ action: "set", key: "traces.enabled", value: "false" }, c)
    assert.ok(r.includes("traces.enabled = false (boolean)"), r)
    assert.equal(c.agent.config.traces.enabled, false)
    assert.equal(JSON.parse(readFileSync(cfgPath, "utf8")).traces.enabled, false)
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

test("T-S1.7: set 敏感键——真实写入 + 回显遮罩（明文零泄漏）", async () => {
  const { tool, cfgPath, ctx, dir } = setup()
  try {
    const c = ctx()
    const r = await tool.execute({ action: "set", key: "providers.0.apiKey", value: "sk-leak-check-123" }, c)
    assert.ok(r.includes(MASK()), "回显遮罩: " + r)
    assert.ok(!r.includes("sk-leak-check-123"), "明文不出现在返回值")
    assert.equal(c.agent.config.providers[0].apiKey, "sk-leak-check-123", "内存真实写入")
    assert.equal(JSON.parse(readFileSync(cfgPath, "utf8")).providers[0].apiKey, "sk-leak-check-123", "磁盘真实写入")
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

test("T-S1.8: set 未知键（已知节内任意嵌套）→ 原样写入", async () => {
  const { tool, cfgPath, ctx, dir } = setup()
  try {
    const c = ctx()
    await tool.execute({ action: "set", key: "agent.customFlag", value: "true" }, c)
    assert.equal(c.agent.config.agent.customFlag, true, "JSON 解析")
    assert.equal(JSON.parse(readFileSync(cfgPath, "utf8")).agent.customFlag, true)
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

test("T-S1.9: set 对象/数组值（JSON.parse 路径）", async () => {
  const { tool, cfgPath, ctx, dir } = setup()
  try {
    const c = ctx()
    const objR = await tool.execute({ action: "set", key: "agent.customObj", value: '{"a":1}' }, c)
    assert.ok(objR.includes("(object)"), objR)
    assert.deepEqual(c.agent.config.agent.customObj, { a: 1 })
    const arrR = await tool.execute({ action: "set", key: "agent.customList", value: "[1,2]" }, c)
    assert.ok(arrR.includes("(array)"), arrR)
    assert.deepEqual(c.agent.config.agent.customList, [1, 2])
    assert.ok(JSON.parse(readFileSync(cfgPath, "utf8")).agent.customList.length === 2, "磁盘数组")
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

test("T-S1.10: 坏 action / 缺 key / config.json 不可解析拒写", async () => {
  const { tool, ctx, dir } = setup()
  try {
    await assert.rejects(() => tool.execute({ action: "delete" }, ctx()), /action must be one of list\/get\/set/)
    await assert.rejects(() => tool.execute({ action: "set", key: "agent.maxTurns" }, ctx()), /key and value are required/)
    // 损坏磁盘 config → 拒写（不静默覆盖）
    const bad = mkdtempSync(join(tmpdir(), "thincoder-settings-bad-"))
    try {
      writeFileSync(join(bad, "config.json"), "{broken", "utf8")
      const t2 = settingsTool({ configPath: join(bad, "config.json") })
      await assert.rejects(() => t2.execute({ action: "set", key: "agent.maxTurns", value: "9" }, ctx()), /not parseable/)
    } finally { rmSync(bad, { recursive: true, force: true }) }
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

function MASK() { return "••••（masked）" }

test("T-S1.11: dispatch 动作门禁 — settings list/get 只读（免询问 + planMode 放行）；set 侧效门", async () => {
  const { executeToolCalls } = await import("../src/agent/dispatch.mjs")
  const { tool, ctx, dir } = setup()
  try {
    const toolByName = new Map([["settings", tool]])
    const liveCfg = () => ctx().agent.config // 模拟 agent.config（含 maxTurns/traces）
    const base = () => ({ tools: [tool], cwd: process.cwd(), config: liveCfg(), planMode: false, autoApprove: false, _role: null, _touchedFiles: [] })
    const call = (args) => ({ id: "c1", name: "settings", arguments: JSON.stringify(args) })
    const asks = []
    const ask = async (name, args) => { asks.push([name, args]); return true }

    // list/get：手动档不询问、直接执行
    for (const action of ["list", "get"]) {
      asks.length = 0
      const args = action === "get" ? { action, key: "agent.maxTurns" } : { action }
      const r = await executeToolCalls(base(), toolByName, [call(args)], { onPermissionRequest: ask }, 0, undefined)
      assert.equal(r[0].ok, true, `${action} 直接执行`)
      assert.equal(asks.length, 0, `${action} 只读——无权限询问`)
    }
    // set：询问后才执行
    asks.length = 0
    const rSet = await executeToolCalls(base(), toolByName, [call({ action: "set", key: "agent.maxTurns", value: "300" })], { onPermissionRequest: ask }, 0, undefined)
    assert.equal(asks.length, 1, "set 维持侧效确认门")
    assert.equal(rSet[0].ok, true)
    // 用户拒绝 → deny
    const rDeny = await executeToolCalls(base(), toolByName, [call({ action: "set", key: "agent.maxTurns", value: "300" })], { onPermissionRequest: async () => false }, 0, undefined)
    assert.equal(rDeny[0].ok, false)
    // planMode：list/get 放行；set 拒绝
    const plan = { onPermissionRequest: ask }
    const rPlanGet = await executeToolCalls({ ...base(), planMode: true }, toolByName, [call({ action: "get", key: "agent.maxTurns" })], plan, 0, undefined)
    assert.equal(rPlanGet[0].ok, true, "planMode 下 get 放行")
    const rPlanSet = await executeToolCalls({ ...base(), planMode: true }, toolByName, [call({ action: "set", key: "agent.maxTurns", value: "300" })], plan, 0, undefined)
    assert.equal(rPlanSet[0].ok, false)
    assert.ok(String(rPlanSet[0].result).includes("plan mode"), "planMode 下 set 拒绝")
  } finally { rmSync(dir, { recursive: true, force: true }) }
})
