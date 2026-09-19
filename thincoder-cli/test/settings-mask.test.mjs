/**
 * settings-mask.test.mjs — SETTINGS-TOOL 脱敏键集扩面（台账 #53 · 2026-09-18）CLI 面用例。
 * 用例 T-S4.1–T-S4.6（设计档 §2.4——敏感判定谓词 = 两句取或：词表句扩
 * authorization/auth/cookie/credential + 开口键族句 headers/env 整族遮罩）。
 * 判据 = 夹具键集逐键：敏感族全遮 ∧ 非敏感键不误遮 ∧ 敏感键哨兵逐键零出现；
 * 夹具值除 `mcp.servers.0.name` = `srv`（T-S4.2 字面期望）外一律哨兵串（真值不入仓）。
 * 测试缝（双缝并用——设计档 §2.6）：写侧 = `settingsTool({ configPath })`；读侧 = config.mjs
 * `_setConfigPathForTest`——两缝必须指向同一临时文件，否则读写落到真实用户配置。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { DEFAULTS, _setConfigPathForTest, _resetConfigPathForTest } from "@thincoder/core/config.mjs"
import { settingsTool } from "@thincoder/core/agent-tools/settings.mjs"

const MASKED = "••••（masked）"

/** 夹具：敏感族 14 键（headers 族 5 · env 族 2 · 词表回归 3 · 本轮扩面 4）+ 非敏感对照。 */
const fixture = () => ({
  mcp: {
    servers: [{
      name: "srv", url: "SENTINEL-21", command: "SENTINEL-22", args: ["SENTINEL-23"],
      headers: { Authorization: "Bearer SENTINEL-01", Cookie: "sid=SENTINEL-02", "X-Custom-Trace": "SENTINEL-03", Accept: "SENTINEL-04" },
      env: { PLAIN_VAR: "SENTINEL-05", GITHUB_TOKEN: "SENTINEL-06" },
      token: "SENTINEL-07",
    }],
  },
  providers: [{ name: "SENTINEL-24", baseURL: "SENTINEL-25", model: "SENTINEL-26", apiKey: "SENTINEL-08", headers: { "X-Custom": "SENTINEL-09" } }],
  websearch: { apiKey: "SENTINEL-10" },
  demo: { auth: "SENTINEL-11", authorization: "SENTINEL-12", cookie: "SENTINEL-13", credential: "SENTINEL-14" },
})

/** 敏感 14 键 → 哨兵值（逐键遮罩 ∧ 逐键零出现）。 */
const SENSITIVE = [
  ["mcp.servers.0.headers.Authorization", "Bearer SENTINEL-01"],
  ["mcp.servers.0.headers.Cookie", "sid=SENTINEL-02"],
  ["mcp.servers.0.headers.X-Custom-Trace", "SENTINEL-03"],
  ["mcp.servers.0.headers.Accept", "SENTINEL-04"],
  ["providers.0.headers.X-Custom", "SENTINEL-09"],
  ["mcp.servers.0.env.PLAIN_VAR", "SENTINEL-05"],
  ["mcp.servers.0.env.GITHUB_TOKEN", "SENTINEL-06"],
  ["mcp.servers.0.token", "SENTINEL-07"],
  ["providers.0.apiKey", "SENTINEL-08"],
  ["websearch.apiKey", "SENTINEL-10"],
  ["demo.auth", "SENTINEL-11"],
  ["demo.authorization", "SENTINEL-12"],
  ["demo.cookie", "SENTINEL-13"],
  ["demo.credential", "SENTINEL-14"],
]

/** 非敏感对照 → 原值（T-S4.1「不误遮」格）。 */
const PLAIN = [
  ["mcp.servers.0.name", "srv"], ["mcp.servers.0.url", "SENTINEL-21"],
  ["mcp.servers.0.command", "SENTINEL-22"], ["mcp.servers.0.args.0", "SENTINEL-23"],
  ["providers.0.name", "SENTINEL-24"], ["providers.0.baseURL", "SENTINEL-25"], ["providers.0.model", "SENTINEL-26"],
]

function tmpCfg(content = {}) {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-settings-mask-"))
  const p = join(dir, "config.json")
  writeFileSync(p, JSON.stringify(content, null, 2) + "\n", "utf8")
  return { dir, p }
}

/** 双缝并用：写侧 settingsTool({ configPath }) + 读侧 _setConfigPathForTest——同一临时文件。 */
async function withCfg(content, fn) {
  const t = tmpCfg(content)
  _setConfigPathForTest(t.p)
  try { return await fn(t) } finally { _resetConfigPathForTest(); rmSync(t.dir, { recursive: true, force: true }) }
}

const ctxOf = (config = {}) => ({ agent: { config } })

test("T-S4.1 正常（核心）：list 夹具逐键——敏感族全遮 ∧ 非敏感原值 ∧ 敏感键哨兵零出现", async () => {
  await withCfg({}, async (t) => {
    const out = await settingsTool({ configPath: t.p }).execute({ action: "list" }, ctxOf(fixture()))
    for (const [path, sentinel] of SENSITIVE) {
      assert.ok(out.includes(`${path} = ${MASKED} (string)`), `${path} 应遮罩`)
      assert.ok(!out.includes(sentinel), `${path} 哨兵零出现`)
    }
    for (const [path, value] of PLAIN) assert.ok(out.includes(`${path} = ${value} (string)`), `${path} 应原值渲染`)
  })
})

test("T-S4.2 正常：get 敏感父对象 / 敏感叶子 / 非敏感叶子三形态（先红：现态父对象行 [object Object]）", async () => {
  await withCfg({}, async (t) => {
    const tool = settingsTool({ configPath: t.p })
    const ctx = ctxOf(fixture())
    assert.equal(await tool.execute({ action: "get", key: "mcp.servers.0.headers" }, ctx), `mcp.servers.0.headers = ${MASKED} (object)`)
    assert.equal(await tool.execute({ action: "get", key: "mcp.servers.0.headers.Authorization" }, ctx), `mcp.servers.0.headers.Authorization = ${MASKED} (string)`)
    assert.equal(await tool.execute({ action: "get", key: "mcp.servers.0.name" }, ctx), "mcp.servers.0.name = srv (string)")
  })
})

test("T-S4.3 边界（set 面）：set 敏感头键哨兵——回显遮罩 + 零哨兵 ∧ 磁盘真值（可写性零改）", async () => {
  await withCfg({ mcp: { servers: [{ headers: {} }] } }, async (t) => {
    const ctx = ctxOf({ mcp: { servers: [{ headers: {} }] } })
    const sentinel = "Bearer SENTINEL-SET"
    const out = await settingsTool({ configPath: t.p }).execute({ action: "set", key: "mcp.servers.0.headers.Authorization", value: sentinel }, ctx)
    assert.equal(out, `settings set: mcp.servers.0.headers.Authorization = ${MASKED} (string) — stored（值不回显）`)
    assert.ok(!out.includes(sentinel), "回显零哨兵")
    assert.equal(JSON.parse(readFileSync(t.p, "utf8")).mcp.servers[0].headers.Authorization, sentinel, "磁盘值 = 真值（写面零改）")
  })
})

test("T-S4.4 错误：set websearch.apiKey 形状违规——判据可见 ∧ 值位 masked ∧ 零明文 ∧ 零变化", async () => {
  await withCfg({}, async (t) => {
    const ctx = ctxOf({})
    const before = readFileSync(t.p, "utf8"), mem = JSON.stringify(ctx.agent.config)
    await assert.rejects(
      settingsTool({ configPath: t.p }).execute({ action: "set", key: "websearch.apiKey", value: '{"k":"SENTINEL-BAD"}' }, ctx),
      (e) => /expects string/.test(e.message) && e.message.includes(MASKED) && !e.message.includes("SENTINEL-BAD"),
    )
    assert.equal(readFileSync(t.p, "utf8"), before, "磁盘零变化")
    assert.equal(JSON.stringify(ctx.agent.config), mem, "内存零变化")
  })
})

test("T-S4.5 边界（不误遮·防漂移）：DEFAULTS 全叶子——除 websearch.apiKey 外零 masked", async () => {
  await withCfg({}, async (t) => {
    const config = structuredClone(DEFAULTS)
    config.mcp = { servers: [{ name: "srv2", url: "u", command: "c", args: ["a"] }] }
    config.providers = [{ name: "p2", baseURL: "b", model: "m2" }]
    const out = await settingsTool({ configPath: t.p }).execute({ action: "list" }, ctxOf(config))
    const masked = out.split("\n").filter((l) => l.includes(MASKED))
    assert.deepEqual(masked, [`websearch.apiKey = ${MASKED} (string)`], "仅 websearch.apiKey 命中谓词（新默认键落敏感族即发声）")
  })
})

test("T-S4.6 文案（结构机判）：description 敏感键句逐字断言（词表 + 族语义——先例 T-S2.24）", () => {
  const SENTENCE = "SENSITIVE keys (path segment matching apiKey/key/token/secret/password/authorization/auth/cookie/credential, or any key under a headers/env segment) are NEVER echoed in plaintext — list/get/set replies show ••••（masked）; setting a sensitive key is allowed and stored, but never echoed back."
  assert.ok(settingsTool().description.includes(SENTENCE), "新句整句逐字出现")
})
