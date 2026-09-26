/**
 * providers.test.mjs — 渠道族用例（用例号 U103–U107 · `docs/desktop/design/PROJECT.md` §7 T-DSK7/8/10
 * + 批档 §2.3 密钥纪律）：`provider:list` 预设投影 / 形判 / 遮罩零明文 · `provider:save` 两形往返 +
 * `active` 同批写 `defaultModel` + 核错误串直传 + 校验失败零写盘 · `provider:remove` 激活保护 + 级联清理 ·
 * `provider:verify` 真探（假 HTTP）三败因分档 + 落账优先于现算 · 畸形档两面两式（端侧零 catch / 核串返回）。
 * 纪律：沙箱逐用例 `mkdtemp` + `_setConfigPathForTest`；探针缝 `_setProbeImplForTest` /
 * `_resetAdmissionForTest` 用例后复位；本档 import 面 = `../src/main/providers.mjs` + 核读数面。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { createServer } from "node:http"
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { PROVIDER_PRESETS, presetToEntry } from "@thincoder/core/config-presets.mjs"
import { _resetConfigPathForTest, _setConfigPathForTest } from "@thincoder/core/config-io.mjs"
import {
  _resetAdmissionForTest, _setProbeImplForTest, admissionOf, recordAdmission,
} from "@thincoder/core/provider/list-models.mjs"
import { MASK } from "../src/main/settings.mjs"
import { providerList, providerRemove, providerSave, providerVerify } from "../src/main/providers.mjs"

/** 沙箱：tmp 目录 + 配置档 + 路径缝注入；返回读数面。 */
function sandbox(t, initial = {}) {
  const dir = mkdtempSync(join(tmpdir(), "desktop-providers-"))
  const configPath = join(dir, "config.json")
  writeFileSync(configPath, JSON.stringify(initial, null, 2) + "\n", "utf8")
  _setConfigPathForTest(configPath)
  t.after(() => { _resetConfigPathForTest(); rmSync(dir, { recursive: true, force: true }) })
  return {
    text: () => readFileSync(configPath, "utf8"),
    raw: () => JSON.parse(readFileSync(configPath, "utf8")),
  }
}

/** 假模型伺服（零新文件）：`/v1/models` 回 200，`/bad/...` 回 500。 */
function fakeModels(t) {
  const server = createServer((req, res) => {
    const bad = req.url.startsWith("/bad")
    res.writeHead(bad ? 500 : 200, { "content-type": bad ? "text/plain" : "application/json" })
    res.end(bad ? "boom" : JSON.stringify({ data: [{ id: "m-b" }, { id: "m-a" }] }))
  })
  return new Promise((done) => server.listen(0, "127.0.0.1", () => {
    t.after(() => { server.closeAllConnections?.(); server.close() })
    done(`http://127.0.0.1:${server.address().port}`)
  }))
}

// ─── U103 provider:list（预设投影 / 形判 / 遮罩 / 空表）────────────────

test("U103: provider:list —— 核预设投影（21 条三字段）+ 形判 + 遮罩 + 空表 active 串", (t) => {
  sandbox(t, {
    defaultModel: "local:m-a",
    providers: [
      { name: "kimi", baseURL: "https://api.moonshot.cn/v1", model: "kimi-k3", apiKey: "sk-kimi-secret" },
      { name: "local", baseURL: "http://127.0.0.1:9/v1/", model: "m-a" },
      { name: "nomodel", baseURL: "https://x.invalid/v1", model: "" },
    ],
  })
  const r = providerList()
  assert.equal(r.ok, true)
  assert.deepEqual(Object.keys(r).sort(), ["active", "ok", "presets", "providers"], "回执键闭集")
  assert.deepEqual(
    r.presets,
    Object.entries(PROVIDER_PRESETS).map(([name, p]) => ({ name, baseURL: p.baseURL, model: p.model })),
    "presets = 核表投影（零第二份表）",
  )
  assert.equal(r.presets.length, 21, "21 条预设（核表条数）")
  for (const p of r.presets) assert.deepEqual(Object.keys(p).sort(), ["baseURL", "model", "name"], "逐条三字段（展示名 desc 不转发）")

  assert.equal(r.active, "local", "active 单源 = defaultModel 的 provider 段")
  const byName = Object.fromEntries(r.providers.map((p) => [p.name, p]))
  assert.equal(byName.kimi.shape, "preset", "名在核预设表 ⇒ preset 形")
  assert.equal(byName.local.shape, "custom", "表外名 ⇒ custom 形")
  assert.equal(byName.local.baseURL, "http://127.0.0.1:9/v1", "baseURL 取核归一后值（去尾斜线）")
  assert.equal(byName.local.active, true, "命中行 active 与顶层双读一致")
  assert.equal(byName.kimi.active, false)
  assert.equal("model" in byName.nomodel, false, "空 model 键缺席（非空串占位）")
  assert.deepEqual([byName.kimi.hasKey, byName.local.hasKey, byName.nomodel.hasKey], [true, false, false])
  assert.equal(byName.kimi.maskedKey, MASK, "持密钥行只回遮罩字面量")
  assert.equal(byName.local.maskedKey, null, "无密钥行 maskedKey = null")
  assert.equal(JSON.stringify(r).includes("sk-kimi-secret"), false, "明文零下发")

  sandbox(t, { providers: [] })
  const empty = providerList()
  assert.deepEqual(empty.providers, [], "空表零行")
  assert.equal(empty.active, "", "空表 active = 核 activeProvider 空串（`?? null` 不触发）")
  assert.equal(empty.presets.length, 21, "预设面与盘面无关（空表仍供选）")
})

// ─── U104 provider:save 预设形（往返 / 激活写 / 拒面）────────────────

test("U104: provider:save 预设形 —— 预设展开落盘 + 激活追加 defaultModel + 拒面零写盘", (t) => {
  const { text, raw } = sandbox(t, {})
  assert.deepEqual(providerSave({ name: "kimi", shape: "preset", key: "sk-new", active: true }), { ok: true, reason: null })
  assert.deepEqual(
    raw(),
    { providers: [{ ...presetToEntry("kimi"), apiKey: "sk-new" }], defaultModel: "kimi:kimi-k3" },
    "预设条目 = 核 presetToEntry 落盘（端侧零表）+ key 同批 + active 追加 `<name>:<model>`",
  )
  const p1 = providerList()
  assert.equal(p1.providers[0].shape, "preset", "落盘后读面形判仍 preset")

  const before = text()
  const rejects = [
    [{ name: "kimi", shape: "preset" }, `Provider "kimi" already exists`, "重名（核串直传）"],
    [{ name: "nope", shape: "preset" }, "Unknown preset: nope", "未知预设名（核串直传）"],
    [{ name: "kimi", shape: "custom", baseURL: "https://y.invalid/v1", model: "m" }, `Name "kimi" is already in use`, "自定形撞核预设名"],
    [{ name: "x", shape: "weird" }, "invalid-shape", "形不在两形"],
    [{ shape: "preset" }, "invalid-shape", "缺名"],
    [{ name: "x", shape: "custom", baseURL: "https://y.invalid/v1" }, "invalid-shape", "自定形缺 model"],
    [{ name: "x", shape: "custom", baseURL: "https://y.invalid/v1", model: "m", format: "cohere" }, "invalid-shape", "协议出三协议"],
  ]
  for (const [payload, reason, why] of rejects) {
    assert.deepEqual(providerSave(payload), { ok: false, reason }, `拒绝面：${why}`)
  }
  assert.equal(text(), before, "拒面零写盘（字节级不变）")
})

// ─── U105 provider:save 自定形（往返 / 协议域 / 端侧先拒）──────────────

test("U105: provider:save 自定形 —— 协议三支落盘差异 + 端侧形判先于核 + 端化读数", (t) => {
  const { text, raw } = sandbox(t, {})
  assert.deepEqual(providerSave({ name: "myapi", shape: "custom", baseURL: "https://my.invalid/v1/", model: "m-x", key: "sk-c", format: "anthropic" }), { ok: true, reason: null })
  assert.deepEqual(providerSave({ name: "plain", shape: "custom", baseURL: "https://p.invalid/v1", model: "m-p" }), { ok: true, reason: null })
  assert.deepEqual(
    providerSave({ name: "gem", shape: "custom", baseURL: "https://g.invalid/v1beta", model: "gemini-2.0-flash", format: "google" }),
    { ok: true, reason: null },
    "三协议第三支（google）正向往返（另两支 = 上臂 anthropic / 缺省 openai）",
  )
  const disk = raw().providers
  assert.deepEqual(
    disk[0],
    { name: "myapi", baseURL: "https://my.invalid/v1", model: "m-x", format: "anthropic", apiKey: "sk-c" },
    "自定形落盘 = 归一 baseURL + 非 openai 才带 format + key",
  )
  assert.equal("format" in disk[1], false, "openai 协议 = 缺省（不落键）")
  assert.equal(disk[2].format, "google", "google 协议落盘（非 openai 才带 format——三协议域全覆盖）")

  const before = text()
  for (const payload of [
    { name: "  ", shape: "custom", baseURL: "https://z.invalid/v1", model: "m" },
    { name: "z", shape: "custom", baseURL: "   ", model: "m" },
    { name: "z", shape: "custom", baseURL: "https://z.invalid/v1", model: "" },
  ]) {
    assert.deepEqual(providerSave(payload), { ok: false, reason: "invalid-shape" }, "端侧形判先于核变更子（空名/空 URL/空 model）")
  }
  assert.equal(text(), before, "端侧先拒 ⇒ 零写盘")

  const r = providerList()
  const myapi = r.providers.find((p) => p.name === "myapi")
  assert.deepEqual(
    { shape: myapi.shape, baseURL: myapi.baseURL, model: myapi.model, hasKey: myapi.hasKey, maskedKey: myapi.maskedKey },
    { shape: "custom", baseURL: "https://my.invalid/v1", model: "m-x", hasKey: true, maskedKey: MASK },
    "写后读面往返（含遮罩）",
  )
})

// ─── U106 provider:remove（激活保护 / 级联 / 幂等名判）─────────────────

test("U106: provider:remove —— 未知名 / 激活保护 + 级联清理悬挂引用", (t) => {
  const { text, raw } = sandbox(t, {
    defaultModel: "local:m-a",
    providers: [
      { name: "kimi", baseURL: "https://api.moonshot.cn/v1", model: "kimi-k3" },
      { name: "local", baseURL: "http://127.0.0.1:9/v1", model: "m-a" },
      { name: "gone", baseURL: "https://g.invalid/v1", model: "m-g", apiKey: "sk-gone" },
    ],
    agent: {
      consultModels: [{ provider: "gone", model: "m-g" }, { provider: "local", model: "m-a" }],
      subagentModels: { coder: "gone:m-g", reviewer: "local:m-a" },
      advisor: { provider: "gone" },
    },
  })
  assert.deepEqual(providerRemove({ name: "nope" }), { ok: false, reason: `No provider named "nope"` }, "未知名 ⇒ 核串直传")
  assert.deepEqual(providerRemove({}), { ok: false, reason: "invalid-shape" }, "空名端侧先拒")
  const protectedWrite = text()
  assert.deepEqual(
    providerRemove({ name: "local" }),
    { ok: false, reason: "The active provider cannot be removed — switch active first" },
    "激活渠道保护（核串直传——active 单源 = defaultModel 段）",
  )
  assert.equal(text(), protectedWrite, "受保护 ⇒ 零写盘")

  assert.deepEqual(providerRemove({ name: "gone" }), { ok: true, reason: null })
  const after = raw()
  assert.deepEqual(after.providers.map((p) => p.name), ["kimi", "local"], "条目撤除（密钥随条目落删）")
  assert.deepEqual(after.agent.consultModels, [{ provider: "local", model: "m-a" }], "级联：consultModels 只清同名项")
  assert.deepEqual(after.agent.subagentModels, { reviewer: "local:m-a" }, "级联：subagentModels 只清 `gone:` 前缀项")
  assert.deepEqual(after.agent.advisor, {}, "级联：advisor.provider 悬挂清除（键删）")
  assert.equal(JSON.stringify(after).includes("sk-gone"), false, "被删渠道密钥零残留")
})

// ─── U107 provider:verify（真探 / 三败因分档）+ U107b 畸形档两面 ────────

test("U107: provider:verify —— 真探通路 + 分档落账（含落账优先于现算）", async (t) => {
  t.after(() => _resetAdmissionForTest())
  const base = await fakeModels(t)
  sandbox(t, {
    defaultModel: "local:m-a",
    providers: [
      { name: "local", baseURL: `${base}/v1`, model: "m-a", apiKey: "sk-local", format: "openai" },
      { name: "bad", baseURL: `${base}/bad`, model: "m-a", apiKey: "sk-bad", format: "openai" },
    ],
  })
  for (const payload of [{ name: "nope" }, {}]) {
    assert.deepEqual(await providerVerify(payload), { ok: false, reason: "unavailable" }, "查无渠道（含空名）⇒ 端侧判定")
  }
  assert.deepEqual(await providerVerify({ name: "local" }), { ok: true, models: ["m-a", "m-b"] }, "真探通路 ⇒ 候选集")
  assert.equal(admissionOf("local")?.ok, true, "探通经核 `probeChannelModels` 落账（非端侧现算）")

  assert.deepEqual(await providerVerify({ name: "bad" }), { ok: false, reason: "malformed" }, "非 2xx ⇒ 分档 malformed")
  const recorded = admissionOf("bad")
  assert.equal(recorded?.failure, "malformed", "落账分档 = 核 classifyProbeFailure")
  assert.match(recorded.reason, /GET \/models 500/, "落账文案带状态码（核 `channelUnavailableMessage`）")

  _setProbeImplForTest(async () => ({ ok: false, error: "boom (timeout)" }))
  assert.deepEqual(await providerVerify({ name: "local" }), { ok: false, reason: "timeout" }, "缝注入未落账 ⇒ 回落同函数现算（timeout 分档）")
  _setProbeImplForTest(async (name) => {
    recordAdmission(name, { ok: false, failure: "malformed", reason: "x" })
    return { ok: false, error: "boom (timeout)" }
  })
  assert.deepEqual(await providerVerify({ name: "local" }), { ok: false, reason: "malformed" }, "已落账 ⇒ 读账优先于错误串现算")
})

test("U107b: provider 族畸形档 —— 读面零 catch 直传 / 写面核串返回 + 零改写", async (t) => {
  const dir = mkdtempSync(join(tmpdir(), "desktop-providers-"))
  const configPath = join(dir, "config.json")
  writeFileSync(configPath, "{ not json", "utf8")
  _setConfigPathForTest(configPath)
  t.after(() => { _resetConfigPathForTest(); rmSync(dir, { recursive: true, force: true }) })

  assert.throws(() => providerList(), /not valid JSON/, "读面：核 loadRaw 抛 ⇒ 本档零 catch 直传")
  for (const [fn, payload, why] of [
    [providerSave, { name: "kimi", shape: "preset" }, "save"],
    [providerRemove, { name: "kimi" }, "remove"],
  ]) {
    const r = fn(payload)
    assert.equal(r.ok, false, `${why}：核 catch 错误 ⇒ 回执不抛`)
    assert.match(r.reason, /not valid JSON/, `${why}：reason = 核错误串（不吞、不换文案）`)
  }
  await assert.rejects(() => providerVerify({ name: "kimi" }), /not valid JSON/, "探面：读面同步抛 ⇒ invoke 拒绝直传")
  assert.equal(readFileSync(configPath, "utf8"), "{ not json", "畸形档零改写（字节级不变）")
})
