/**
 * settings.test.mjs — 设置族用例（用例号 U98–U108 · `docs/desktop/design/PROJECT.md` §7 T-DSK7/8/10
 * + 批档 §2.6 判据行 D6 / D7 / A2）：`config:write` 键白名单 + 值域 + 回执键 + 他键保留 + 首写建档 /
 * `model:list` 真探（假 HTTP：200 / 非 2xx / 查无渠道）+ 逐模型档位投影（元素形 `{ id, effortEnum,
 * thinkOff }` 三键逐项）/ `settings:agent` 读面字段形 + 遮罩单点 +
 * 明文零下发 / 写面校验拒绝零写盘 + 写后回读 + 未知键放行 / 档位意图级写径（三径落形 + 写后投影
 * 恒等 + 两拒零写）/ A2 源面机检 + 畸形档不吞（三面两式）。
 * 纪律：沙箱逐用例 `mkdtemp` + `_setConfigPathForTest` 指临时档（不碰真实用户目录），用例后复位；
 * mtime 冲突不可由外部触发（`writeConfigAtomic` 门控 = 进程内 stat→read→stat）⇒ 本档不测该档。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { createServer } from "node:http"
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { loadConfig } from "@thincoder/core/config.mjs"
import { _resetConfigPathForTest, _setConfigPathForTest } from "@thincoder/core/config-io.mjs"
import { projectDictionary } from "@thincoder/core/i18n.mjs"
import { specForModel } from "@thincoder/core/model-specs.mjs"
import { channelUnavailableMessage } from "@thincoder/core/provider/list-models.mjs"
import { thinkOffPath, thinkOffShape } from "@thincoder/core/think-off.mjs"
import { MASK, configWrite, isConfigured, modelList, settingsAgent } from "../src/main/settings.mjs"
import { providerList } from "../src/main/providers.mjs"

const here = (p) => fileURLToPath(new URL(p, import.meta.url))

/** 渠道夹具（含明文密钥——遮罩 / 零下发用例的取证面）。 */
const KIMI = { name: "kimi", baseURL: "https://api.example.invalid/v1", model: "kimi-k2.6", apiKey: "sk-secret-xyz" }

/** 沙箱：tmp 目录 + 配置档（`initial` 非 null ⇒ 预置盘面）+ 路径缝注入；返回读数面。 */
function sandbox(t, initial = null) {
  const dir = mkdtempSync(join(tmpdir(), "desktop-settings-"))
  const configPath = join(dir, "config.json")
  if (initial !== null) writeFileSync(configPath, JSON.stringify(initial, null, 2) + "\n", "utf8")
  _setConfigPathForTest(configPath)
  t.after(() => { _resetConfigPathForTest(); rmSync(dir, { recursive: true, force: true }) })
  return {
    configPath,
    text: () => readFileSync(configPath, "utf8"),
    raw: () => JSON.parse(readFileSync(configPath, "utf8")),
  }
}

/** 假模型伺服（零新文件）：路由 `/v1/models` 回 openai 形，`/bad/...` 回 500。 */
function fakeModels(t, seen) {
  const server = createServer((req, res) => {
    seen.push({ url: req.url, auth: req.headers.authorization })
    if (req.url.startsWith("/bad")) {
      res.writeHead(500, { "content-type": "text/plain" })
      res.end("boom")
      return
    }
    res.writeHead(200, { "content-type": "application/json" })
    // 真名三行（三档判据：`thinkAlwaysOn` / effort 族无 `none` / effort 族含 `none`）+ 未登记两名 + 非串两项
    res.end(JSON.stringify({ data: [{ id: "m-b" }, { id: "glm-5.3" }, { id: "m-a" }, { id: "qwen3.7-flash" }, { id: "kimi-k3" }, { id: 7 }, {}] }))
  })
  return new Promise((done) => server.listen(0, "127.0.0.1", () => {
    t.after(() => { server.closeAllConnections?.(); server.close() })
    done(`http://127.0.0.1:${server.address().port}`)
  }))
}

// ─── U98 config:write（白名单 / 值域 / 盘面 / 首写建档）──────────────

test("U98: config:write —— 键白名单 + 值域 + 失败零写盘 + 两语往返 + 他键保留 + 首写建档", (t) => {
  const { text, raw } = sandbox(t, { defaultModel: "kimi:kimi-k2.6", providers: [KIMI], locale: "en" })
  const before = text()
  const rejects = [
    [{ patch: { locale: "fr" } }, "invalid-value", "值域外（核 SUPPORTED_LOCALES = en/zh）"],
    [{ patch: { theme: "dark" } }, "invalid-key", "表外键"],
    [{ patch: { locale: "zh", theme: "dark" } }, "invalid-key", "非单键（白名单仅一条）"],
    [{ patch: "zh" }, "invalid-key", "patch 非对象"],
    [{}, "invalid-key", "缺 patch"],
  ]
  for (const [payload, reason, why] of rejects) {
    assert.deepEqual(configWrite(payload), { ok: false, reason }, `拒绝面：${why} ⇒ ${reason}`)
  }
  assert.equal(text(), before, "失败面零写盘（字节级不变——校验先于唯一写盘执行体）")

  const zh = configWrite({ patch: { locale: "zh" } })
  assert.deepEqual(Object.keys(zh).sort(), ["configured", "dict", "locale", "ok", "reason"], "成功回执键闭集（成功面 reason 在册——家族惯例）")
  assert.equal(zh.reason, null, "成功面 reason 显式为 null（与 provider:save / settings:agent 写面同形）")
  assert.equal(zh.locale, "zh")
  assert.equal(zh.configured, true, "configured = 配置档存在性读数")
  assert.deepEqual(zh.dict, projectDictionary("zh"), "dict = 核 projectDictionary(locale)（零副本）")
  assert.notDeepEqual(zh.dict, projectDictionary("en"), "两语字典不同 ⇒ 切换确有生效（非恒定返回值）")
  assert.deepEqual(raw(), { defaultModel: "kimi:kimi-k2.6", providers: [KIMI], locale: "zh" }, "盘面：只动 locale，他键保留")
  assert.equal(loadConfig().locale, "zh", "「重启仍在」读数 = 盘（新一次核读同值）")
  assert.equal(configWrite({ patch: { locale: "en" } }).locale, "en", "两语各往返（回切）")

  const fresh = sandbox(t, null)
  assert.equal(isConfigured(), false, "档缺失 ⇒ 未配（向导闸读数面）")
  const created = configWrite({ patch: { locale: "zh" } })
  assert.equal(created.ok, true)
  assert.equal(created.configured, true, "写入即建新档 ⇒ 翻转")
  assert.deepEqual(fresh.raw(), { locale: "zh" }, "新建档 = 仅本次写键（从零起，不固化默认值）")
})

// ─── U99 model:list（真探核链路 / 三类失败）─────────────────────────

test("U99: model:list —— 真调核 listModels（假 HTTP 200）+ 逐模型档位投影 + 非 2xx 状态入串 + 查无渠道", async (t) => {
  const seen = []
  const base = await fakeModels(t, seen)
  sandbox(t, {
    providers: [
      { name: "local", baseURL: `${base}/v1`, model: "m-a", apiKey: "sk-local", format: "openai" },
      { name: "bad", baseURL: `${base}/bad`, model: "m-a", apiKey: "sk-bad", format: "openai" },
    ],
  })
  const ok = await modelList({ provider: "local" })
  assert.deepEqual(
    ok,
    {
      ok: true,
      models: [
        { id: "glm-5.3", effortEnum: ["low", "high", "max"], thinkOff: false }, // thinkAlwaysOn ⇒ off 不可达
        { id: "kimi-k3", effortEnum: ["low", "high", "max"], thinkOff: false }, // effort 族枚举无 "none" ⇒ 不可达
        { id: "m-a", effortEnum: [], thinkOff: true }, // 未登记 ⇒ 空候选面（零渲染）；默认规格非 effort 族 ⇒ 可达
        { id: "m-b", effortEnum: [], thinkOff: true },
        { id: "qwen3.7-flash", effortEnum: ["none", "minimal", "low", "medium", "high", "xhigh"], thinkOff: true }, // 枚举含 "none" ⇒ 可达
      ],
    },
    "候选集 = 核 listModels 逐模型档位投影（id 排序 + 非串项丢弃 + 两判据单源 = 核 specForModel / thinkOffPath）",
  )
  for (const model of ok.models) {
    assert.deepEqual(Object.keys(model).sort(), ["effortEnum", "id", "thinkOff"], "元素形三键闭集（回执形两向：逐项在场）")
  }
  assert.deepEqual(seen, [{ url: "/v1/models", auth: "Bearer sk-local" }], "真调核链路：GET <baseURL>/models + Bearer 密钥")

  const bad = await modelList({ provider: "bad" })
  assert.equal(bad.ok, false)
  assert.deepEqual(bad.models, [], "失败面 models 空数组（键面稳定）")
  assert.equal(bad.reason, channelUnavailableMessage({ status: 500, message: "boom" }), "非 2xx 状态入串（文案 = 核函数）")
  assert.ok(bad.reason.includes("GET /models 500"), `状态码真入串（实 = ${bad.reason}）`)

  for (const payload of [{ provider: "nope" }, {}]) {
    const miss = await modelList(payload)
    const want = channelUnavailableMessage(new Error(`provider not found: ${payload.provider ?? ""}`))
    assert.deepEqual(miss, { ok: false, models: [], reason: want }, "查无渠道（含空名）：同面构造错误后核文案直传")
  }
})

// ─── U100 settings:agent 读面（字段形 / 遮罩单点 / 零明文下发）────────

test("U100: settings:agent 读面 —— 四键字段形 + path 升序 + 数组当叶子 + 遮罩 + 明文零下发", (t) => {
  sandbox(t, {
    locale: "zh",
    agent: { maxTurns: 12 },
    websearch: { apiKey: "tvly-secret-abc" },
    providers: [KIMI],
    mcp: { servers: [{ name: "svc", command: "npx", args: ["-y", "svc"], token: "t0p-secret", headers: { authorization: "Bearer h-secret" } }] },
  })
  const r = settingsAgent({})
  assert.deepEqual(Object.keys(r).sort(), ["fields", "ok"], "读面回执键闭集")
  assert.equal(r.ok, true)
  const fields = r.fields
  for (const f of fields) assert.deepEqual(Object.keys(f).sort(), ["kind", "path", "sensitive", "value"], "字段形四键")
  const paths = fields.map((f) => f.path)
  assert.deepEqual(paths, [...paths].sort(), "path 升序（展平序稳定 ⇒ 面板零抖动）")

  const at = (p) => fields.find((f) => f.path === p)
  assert.deepEqual(at("agent.maxTurns"), { path: "agent.maxTurns", value: 12, sensitive: false, kind: "number" }, "非敏感叶子：原值直通")
  assert.deepEqual(at("locale"), { path: "locale", value: "zh", sensitive: false, kind: "string" }, "端无关偏好键在册")
  assert.equal(at("memory.team").kind, "null", "null 单列一档（与 typeof 口径同）")
  assert.equal(at("websearch.apiKey").sensitive, true, "敏感判据 = 核 isSensitiveKey（段级）")
  assert.equal(at("websearch.apiKey").value, MASK, "敏感叶子 = 遮罩字面量")

  const providers = at("providers")
  assert.equal(providers.kind, "array", "数组当叶子（不展开元素——免路径歧义）")
  assert.equal(providers.value[0].name, "kimi", "容器内非敏感值原样")
  assert.equal(providers.value[0].apiKey, MASK, "容器值也遮（`providers.<i>.apiKey` 段判命中）")
  const servers = at("mcp.servers")
  assert.equal(servers.kind, "array")
  assert.equal(servers.value[0].token, MASK, "数组内 token 遮罩")
  assert.equal(servers.value[0].headers.authorization, MASK, "嵌套 headers 族整族遮罩")

  const wire = JSON.stringify(fields)
  for (const secret of ["sk-secret-xyz", "tvly-secret-abc", "t0p-secret", "h-secret"]) {
    assert.equal(wire.includes(secret), false, `明文「${secret}」零下发（载荷只回遮罩后值）`)
  }
})

// ─── U101 settings:agent 写面（校验拒绝零写盘 / 回读 / 未知键放行）────

test("U101: settings:agent 写面 —— 校验拒绝零写盘 + 非法 patch 形 + 写后回读 + 未知键放行", (t) => {
  const { text, raw } = sandbox(t, { agent: { maxTurns: 12 }, defaultModel: "kimi:kimi-k2.6" })
  const before = text()
  const rejects = [
    [{ shell: 7 }, "shell", "non-empty string", "null 叶子形状表：类型错"],
    [{ "agent.subagentModel": "" }, "agent.subagentModel", "non-empty string", "空串拒（形状表）"],
    [{ "agent.maxTurns": "many" }, "agent.maxTurns", "number", "非 null 叶子类型表：类型错"],
    [{ "memory.team": {} }, "memory.team", "non-empty", "形状表：缺 repo"],
  ]
  for (const [patch, key, want, why] of rejects) {
    const r = settingsAgent({ patch })
    assert.equal(r.ok, false, `拒绝面（${why}）`)
    assert.equal(Object.keys(r).sort().join(), "fields,ok,reason", "拒绝面键闭集（面板不空转——仍回字段读数）")
    assert.ok(r.reason.includes(key) && r.reason.includes(want), `拒因 = 核串直传（实 = ${r.reason}）`)
    assert.ok(r.fields.length > 0, "拒绝面字段读数非空")
  }
  assert.equal(text(), before, "四次拒绝零写盘（字节级不变）")

  for (const patch of [{}, [], "x", 7]) {
    const r = settingsAgent({ patch })
    assert.equal(r.reason, "invalid-patch", `非法 patch 形（${JSON.stringify(patch)}）⇒ invalid-patch`)
    assert.equal(r.ok, false)
  }
  assert.deepEqual(Object.keys(settingsAgent({ patch: null })).sort(), ["fields", "ok"], "patch = null ⇒ 读面（非写面空 patch）")

  const w = settingsAgent({ patch: { "agent.maxTurns": 7, "ui.unknownFlag": true } })
  assert.deepEqual(Object.keys(w).sort(), ["fields", "ok", "reason"], "写面回执三键")
  assert.deepEqual({ ok: w.ok, reason: w.reason }, { ok: true, reason: null }, "成功面 reason 显式为 null")
  const at = (p) => w.fields.find((f) => f.path === p)
  assert.equal(at("agent.maxTurns").value, 7, "写后回读同值（D6 点分路径往返）")
  assert.equal(at("ui.unknownFlag").value, true, "未知键放行（全量域 = 核语义，端侧不另立白名单）")
  assert.deepEqual(raw(), { agent: { maxTurns: 7 }, defaultModel: "kimi:kimi-k2.6", ui: { unknownFlag: true } }, "盘面：下钻建对象 + 他键保留")
})

// ─── U102 A2 写面唯一执行体（源面机检）+ 畸形档不吞 ──────────────────

test("U102: A2 写面唯一执行体（源面机检）+ 畸形档不吞（读面 throw / 写面拒写）", (t) => {
  for (const file of ["settings.mjs", "providers.mjs", "mcp-servers.mjs"]) {
    const src = readFileSync(here(`../src/main/${file}`), "utf8")
    assert.equal(/writeFileSync/.test(src), false, `${file}：端侧零自写盘（不 fs.writeFile）`)
    assert.ok(src.includes("writeConfigAtomic"), `${file}：写面只经核唯一执行体`)
  }

  const { configPath, text } = sandbox(t, null)
  writeFileSync(configPath, "{ not json", "utf8")
  assert.throws(() => settingsAgent({}), /not valid JSON/, "读面：核 loadRaw 抛 ⇒ 本档零 catch 直传")
  assert.throws(() => configWrite({ patch: { locale: "zh" } }), /refusing to overwrite/, "写面：核拒写畸形档（绝不静默覆盖）")
  assert.equal(text(), "{ not json", "畸形档零改写（字节级不变）")
})

// ─── U146 settings:agent 档位意图级写径（三径 / 投影恒等 / 两拒零写）───

test("U146: settings:agent 档位写径 —— 三径落形 + 写后投影恒等 + 两拒零写 + 形拒", (t) => {
  const { text, raw } = sandbox(t, {
    defaultModel: "eff:qwen3.7-flash",
    providers: [
      // 双记号（档位串 + type 族残留）⇒ auto 径「两键皆清」可证；活动行 = 本条
      { name: "eff", baseURL: "https://a.invalid/v1", model: "qwen3.7-flash", apiKey: "sk-eff", thinking: { type: "disabled" }, reasoningEffort: "high" },
      { name: "type", baseURL: "https://b.invalid/v1", model: "zz-unknown" },
      { name: "forced", baseURL: "https://c.invalid/v1", model: "glm-5.3" },
      // 非 off 形残记（自定开值族式）：member 径的 deep-equal 门可证（非「见 thinking 即删」）
      { name: "custom", baseURL: "https://d.invalid/v1", model: "qwen3.7-flash", thinking: { type: "enabled" } },
    ],
  })
  const row = (name) => providerList().providers.find((p) => p.name === name)
  const at = (i) => raw().providers[i]
  const readback = (receipt, i) => receipt.fields.find((f) => f.path === "providers").value[i]

  // 前提（判据单源 = 核导出面——测试与实现同源，不硬编码族别）
  assert.deepEqual([thinkOffPath(specForModel("qwen3.7-flash")), thinkOffPath(specForModel("glm-5.3"))], [true, false], "前提：含 `none` 族 off 可达 · 强制族 off 无有效路径")
  assert.deepEqual([thinkOffShape(specForModel("qwen3.7-flash")), thinkOffShape(specForModel("zz-unknown"))], [null, { type: "disabled" }], "前提：effort 族 off 形 = `null` · 未登记模型 ⇒ type 族默认形")
  assert.deepEqual([row("eff").effort, row("type").effort], ["high", "auto"], "现值投影：`reasoningEffort` 串优先（双记号在场取串）· 无记号 ⇒ auto")

  const text0 = text()
  const rejects = [
    [{ tier: {} }, "invalid-patch", "三成员皆缺（非三成员形）"], [{ tier: 7 }, "invalid-patch", "tier 非对象"],
    [{ tier: { provider: "eff", model: "qwen3.7-flash" } }, "invalid-patch", "level 缺"], [{ tier: { provider: "eff", level: "auto" } }, "invalid-patch", "model 缺"],
    [{ tier: { provider: "ghost", model: "qwen3.7-flash", level: "auto" } }, "unknown-provider", "名不在配置"], [{ tier: { model: "qwen3.7-flash", level: "auto" } }, "unknown-provider", "provider 缺 ⇒ 空名无对应条目"],
    [{ tier: { provider: "eff", model: "qwen3.7-flash", level: "ultra" } }, "bad-level", "表外 member"], [{ tier: { provider: "type", model: "zz-unknown", level: "high" } }, "bad-level", "无枚举模型 ⇒ 任一 member 表外"],
    [{ tier: { provider: "forced", model: "glm-5.3", level: "off" } }, "bad-level", "强制族：off 无有效路径"], [{ tier: { provider: "forced", model: "glm-5.3", level: "none" } }, "bad-level", "`none` 与 `off` 同径（同受 thinkOffPath 门）"],
    [{ tier: { provider: "eff", model: "qwen3.7-flash", level: 42 } }, "bad-level", "level 非串"], [{ tier: { provider: "eff", model: "qwen3.7-flash", level: "" } }, "bad-level", "level 空串"],
    [{ patch: { "agent.maxTurns": 3 }, tier: { provider: "eff", model: "qwen3.7-flash", level: "auto" } }, "invalid-patch", "两有效键同在（二择一）"],
  ]
  for (const [payload, reason, why] of rejects) {
    const r = settingsAgent(payload)
    assert.deepEqual({ ok: r.ok, reason: r.reason }, { ok: false, reason }, `拒绝面：${why} ⇒ ${reason}`)
    assert.deepEqual([Object.keys(r).sort().join(), r.fields.length > 0], ["fields,ok,reason", true], "拒绝面键闭集 + 字段读数非空（面板不空转）")
  }
  assert.equal(text(), text0, "十三拒零写盘（字节级不变）")
  assert.deepEqual(settingsAgent({ patch: null, tier: null }), settingsAgent({}), "两键皆 null ⇒ 读面（二择一判据 = 非 undefined/null）")

  // 三径落形表（秩序 = 写序 · 逐行改写同一盘面 ⇒ 每行期望含前案落形）：键面 + 两记号落形 + 写后回读 + 投影恒等
  const cases = [
    ["① auto 径：两键皆删（先清不相容记号）", 0, { provider: "eff", model: "qwen3.7-flash", level: "auto" }, ["apiKey", "baseURL", "model", "name"], undefined, undefined, "auto"],
    ["② off 径（type 族）：落形 = 核 thinkOffShape", 1, { provider: "type", model: "zz-unknown", level: "off" }, ["baseURL", "model", "name", "thinking"], { type: "disabled" }, undefined, "off"],
    ["② off 径（effort 族）：off 形 = `null`（载荷层据此补发 reasoning_effort:none）", 0, { provider: "eff", model: "qwen3.7-flash", level: "off" }, ["apiKey", "baseURL", "model", "name", "thinking"], null, undefined, "off"],
    ["③ member 径：off 形残记（null）被清 + 置 level", 0, { provider: "eff", model: "qwen3.7-flash", level: "medium" }, ["apiKey", "baseURL", "model", "name", "reasoningEffort"], undefined, "medium", "medium"],
    ["③ member 径：非 off 形残记保留（deep-equal 门）· 非活动行取自身绑定", 3, { provider: "custom", model: "qwen3.7-flash", level: "low" }, ["baseURL", "model", "name", "reasoningEffort", "thinking"], { type: "enabled" }, "low", "low"],
    ["④ `none` 归 off 径（不作独立档）", 0, { provider: "eff", model: "qwen3.7-flash", level: "none" }, ["apiKey", "baseURL", "model", "name", "thinking"], null, undefined, "off"],
  ]
  for (const [why, i, want, keys, thinking, effort, projected] of cases) {
    const r = settingsAgent({ tier: want })
    assert.deepEqual({ ok: r.ok, reason: r.reason }, { ok: true, reason: null }, `${why}：受理（成功面 reason 显式 null）`)
    const entry = at(i)
    assert.deepEqual(Object.keys(entry).sort(), keys, `${why}：落盘键面`)
    assert.deepEqual(entry.thinking, thinking, `${why}：thinking 落形`)
    assert.equal(entry.reasoningEffort, effort, `${why}：reasoningEffort 落形`)
    assert.equal(row(want.provider).effort, projected, `${why}：写后投影恒等（provider:list 行 effort 读回）`)
    assert.deepEqual(readback(r, i).thinking, thinking, `${why}：写后回读同值（D6 —— 回执 fields 已是盘上新值）`)
  }
  assert.equal(at(2).reasoningEffort, undefined, "写面 = 条目级局部（余行零改）")
  assert.deepEqual(at(2), { name: "forced", baseURL: "https://c.invalid/v1", model: "glm-5.3" })
  assert.equal(raw().defaultModel, "eff:qwen3.7-flash", "档位写径不动 defaultModel（写面 = 渠道条目级默认两键）")
})
