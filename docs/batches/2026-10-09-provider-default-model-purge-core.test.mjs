/**
 * 2026-10-09-provider-default-model-purge-core.test.mjs — 批内件（provider 默认模型清除批 · 核侧 · 台账 #1122）。
 * 名随批次档 · 不进仓套件 · 随批留存（终位 = `docs/batches/`）。复跑（仓库根 `thincoder/`）：
 *   node --test docs/batches/2026-10-09-provider-default-model-purge-core.test.mjs
 *
 * 覆盖 = 批档 §2.1 A1 ∥ A2 核侧面（+ 父侧裁定件①②③ ∥ #20 路由件④⑤）：
 *  A1 归一「一律删」——含 `model` 档经 `loadConfig` ∥ `resolveProviders` ⇒ 条目无 `model` 键；
 *     预设表 25 键逐条 `"model" in p === false`；`presetToEntry` 产物无 `model` 键；
 *  A2 `resolveChildProvider`——首冒号分割（`a:b:c` ⇒ provider=`a` ∥ model=`b:c`，不截断）；
 *     裸渠名 ⇒ 拒（文案逐字）；空 mname ⇒ 拒；null ∥ 空串 ∥ `default` 分支保留；裸模型名换型保留；
 *  件①（父侧裁——config-io ∥ provider-flows）——custom 添加不携 model（必填判 ∥ 落键双退）；
 *     `customFieldsError` 两拒因；`addProviderFlow` 自定径零 model 问句、预设 detail = `baseURL`；
 *  件②∥③（父侧裁）——`vision-reader` 判源退场 ⇒ 恒 `null`（零 `p.model` 读）；`config-migrate` ② 段
 *     `model`/`models` 一律删（① 段 active*→defaultModel 零动、幂等）；`model-ref` ②档退场（§6.19——
 *     不回退渠道单值 ∥ `models[0]`）；
 *  件④∥⑤（#20 域外路由）——`assertProviderModel` 拒因随 R3 收正（零退场字段指引）；
 *     `resolveAdvisorProvider` 模型面 = 父解析单档（渠级死读退场）；
 *  残留收口（fix 轮——三核修）：`migrateCore` 孤儿重建门 = baseURL 单判 ∥ 重建零 `model` 键；
 *     `findProvider` 兜底对象零 `model` 键；`sessionReading` 模型面走现行链（槽模型 → dm 属渠段 → null）+ 端装配入参锁。
 * 纪律：配置缝隔离（`_setConfigPathForTest` 临时目录，随后清理）；零实网（准入探 stub）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { pathToFileURL } from "node:url"

const ROOT = process.cwd()
if (!existsSync(join(ROOT, "thincoder-core"))) throw new Error(`须从仓库根（thincoder/）运行——cwd = ${ROOT}`)
const mod = (rel) => import(pathToFileURL(resolve(ROOT, rel)).href)

const configIo = await mod("thincoder-core/config-io.mjs")
const config = await mod("thincoder-core/config.mjs")
const presets = await mod("thincoder-core/config-presets.mjs")
const subAsync = await mod("thincoder-core/agent-tools/subagent-async.mjs")
const flows = await mod("thincoder-core/provider-flows.mjs")
const modelRef = await mod("thincoder-core/model-ref.mjs")
const errors = await mod("thincoder-core/provider/errors.mjs")
const advRun = await mod("thincoder-core/advisor/run.mjs")
const migrate = await mod("thincoder-core/config-migrate.mjs")
const tokenWindow = await mod("thincoder-core/token-window.mjs")
const slife = await mod("thincoder-core/session-lifecycle.mjs")

/** 裸渠名拒文案（设计 §6.16 M3——逐字，不带 markdown 反引号）。 */
const BARE_CHANNEL_MSG = "渠道无默认模型，请用 provider:model"

/** 配置缝夹具：临时目录 + 写 raw 档；回调内断言，结算后复位 + 清理。
 *  **必须 `await`**——async 回调要等结算（防窗口漏出：finally 先跑会把后续配置动作放回真实路径）。 */
async function withTmpConfig(raw, fn) {
  const dir = mkdtempSync(join(tmpdir(), "purge-core-"))
  const cfg = join(dir, "config.json")
  configIo._setConfigPathForTest(cfg)
  try {
    if (raw !== undefined) writeFileSync(cfg, JSON.stringify(raw))
    return await fn(cfg)
  } finally {
    configIo._resetConfigPathForTest()
    rmSync(dir, { recursive: true, force: true })
  }
}

/** resolveChildProvider 父面夹具（b 渠仍携遗留 `model` 键——供「不回落」负控）。 */
const parentFixture = () => ({
  provider: { name: "p0", baseURL: "https://p0.example.com/v1", apiKey: "kp0", model: "m0" },
  config: {
    providersList: [
      { name: "a", baseURL: "https://a.example.com/v1", apiKey: " ka " },
      { name: "b", baseURL: "https://b.example.com/v1", apiKey: "kb", model: "legacy-b" },
    ],
  },
})

test("A1 归一「一律删」：含 `model` 档（串 ∥ 空串 ∥ 非串）载入 ⇒ 条目无 `model` 键（两实现）", async () => {
  const raw = {
    providers: [
      { name: "a", baseURL: "https://a.example.com/v1", apiKey: "k1", model: "legacy-a" },
      { name: "b", baseURL: "https://b.example.com/v1", apiKey: "k2", model: "" },
      { name: "c", baseURL: "https://c.example.com/v1", apiKey: "k3", model: 42 },
    ],
  }
  await withTmpConfig(raw, (cfg) => {
    // 实现一：loadConfig（运行时装配面）
    const merged = config.loadConfig()
    assert.equal(merged.providers.length, 3)
    for (const p of merged.providers) assert.equal("model" in p, false, `loadConfig：${p.name} 无 model 键`)
    assert.equal(merged.provider.model, null, "模型面无渠道级回落（null = 明示未设置）")
    // 迁移写回盘面（M7 v2——② 段一律删）：载入即清，盘上条目同无 `model` 键
    const onDisk = JSON.parse(readFileSync(cfg, "utf8"))
    for (const p of onDisk.providers) assert.equal("model" in p, false, `写回盘面：${p.name} 无 model 键`)
    // 实现二：resolveProviders（VSC/桌面读面）
    const { providers } = configIo.resolveProviders()
    for (const p of providers) assert.equal("model" in p, false, `resolveProviders：${p.name} 无 model 键`)
  })
})

test("A1 预设表：25 键逐条 `\"model\" in p === false`；presetToEntry 产物无 `model` 键", () => {
  const names = Object.keys(presets.PROVIDER_PRESETS)
  assert.equal(names.length, 25, "全表 25 条")
  for (const name of names) {
    assert.equal("model" in presets.PROVIDER_PRESETS[name], false, `预置 ${name} 无 model 键`)
    const entry = presets.presetToEntry(name)
    assert.equal(entry.name, name)
    assert.equal("model" in entry, false, `presetToEntry ${name} 无 model 键`)
  }
  assert.equal(presets.presetToEntry("__no_such_preset__"), null, "未知名零回归")
})

test("A2 首冒号分割：`a:b:c` ⇒ provider=`a` ∧ model=`b:c`（多冒号不截断）+ key trim", () => {
  const parent = parentFixture()
  const multi = subAsync.resolveChildProvider(parent, "a:b:c")
  assert.equal(multi.name, "a")
  assert.equal(multi.model, "b:c", "多冒号模型名完整保留")
  assert.equal(multi.apiKey, "ka", "key trim 保留")
  assert.deepEqual(
    subAsync.resolveChildProvider(parent, "a:x"),
    { name: "a", baseURL: "https://a.example.com/v1", apiKey: "ka", model: "x" },
    "单冒号同径",
  )
})

test("A2 裸渠名一律拒：文案逐字（遗留渠道级 model 在场亦不回落）", () => {
  const parent = parentFixture()
  for (const bare of ["a", "b"]) {
    assert.throws(() => subAsync.resolveChildProvider(parent, bare), (e) => {
      assert.equal(e.constructor.name, "Error")
      assert.equal(e.message, BARE_CHANNEL_MSG, `裸渠名 ${bare} 文案逐字`)
      return true
    })
  }
})

test("A2 空 mname 一律拒（`a:`——旧渠道级 model 回落已删）；未知渠名仍明确报错", () => {
  const parent = parentFixture()
  assert.throws(() => subAsync.resolveChildProvider(parent, "a:"), (e) => {
    assert.match(e.message, /model part is empty/, "可读错误（空模型段）")
    return true
  })
  assert.throws(() => subAsync.resolveChildProvider(parent, "nope:x"), /unknown provider "nope"/)
})

test("A2 保留分支：null ∥ undefined ∥ 空串 ∥ `default`（大小写不敏感）⇒ 不覆盖；裸模型名换型保留", () => {
  const parent = parentFixture()
  const base = { ...parent.provider }
  for (const arg of [null, undefined, "", "default", "DEFAULT"]) {
    assert.deepEqual(subAsync.resolveChildProvider(parent, arg), base, `arg=${String(arg)} 不覆盖`)
  }
  assert.deepEqual(
    subAsync.resolveChildProvider(parent, "some-model"),
    { ...parent.provider, model: "some-model" },
    "裸模型名 = 换型保父渠道（渠道级 model 零参与）",
  )
})

test("件① config-io：custom 添加不携 model（必填判 ∥ 落键双退——R3）", async () => {
  await withTmpConfig({}, () => {
    assert.equal(configIo.addProviderEntry({ custom: { name: "c1", baseURL: "https://c1.example.com/v1/" } }), null, "无 model 亦受理")
    const c1 = configIo.resolveProviders().providers.find((p) => p.name === "c1")
    assert.deepEqual(c1, { name: "c1", baseURL: "https://c1.example.com/v1" }, "两字段落条（尾斜杠已裁）")
    assert.equal("model" in c1, false, "零 model 键")
  })
})

test("件① provider-flows：customFieldsError 两拒因（baseURL ∥ format——model 步退场）", () => {
  assert.equal(flows.customFieldsError({ baseURL: "https://x.example.com/v1" }), null, "无 model 亦过")
  assert.equal(flows.customFieldsError({}), "Base URL is required")
  assert.equal(flows.customFieldsError({ baseURL: "u", format: "bogus" }), "Unknown API format: bogus (expected openai/anthropic/google)")
})

test("件① addProviderFlow 自定径：零 model 问句 ∥ 落条无 model ∥ 预设 detail = baseURL ∥ 准入探恰一次", async () => {
  await withTmpConfig({}, async (cfg) => {
    const inputs = [], picks = [], errors = [], probes = []
    let pickN = 0, refreshed = 0
    const ui = {
      pick: async (items) => {
        picks.push(items)
        pickN += 1
        return pickN === 1 ? items.find((i) => i.kind === "custom") : { label: "openai" }
      },
      input: async (opts) => {
        inputs.push(opts.prompt)
        if (opts.prompt === "Provider name") return "c2"
        if (opts.prompt.startsWith("Base URL")) return "https://c2.example.com/v1"
        return "" // key 步：跳过
      },
      error: (m) => errors.push(m), warn: () => {}, info: () => {},
    }
    const deps = { probe: async (name, target) => { probes.push({ name, target }); return { ok: true, models: [] } } }
    await flows.addProviderFlow(ui, () => { refreshed += 1 }, deps)

    assert.deepEqual(errors, [], "零错误")
    assert.equal(inputs.length, 3, "恰三问：名称 ∥ baseURL ∥ key")
    assert.equal(inputs.some((p) => /Model/i.test(p)), false, "零 model 问句")
    assert.equal(refreshed, 1, "刷新一次")
    const ds = picks[0].find((i) => i.label === "deepseek")
    assert.equal(ds.detail, "https://api.deepseek.com", "预设 detail = baseURL")
    const c2 = configIo.resolveProviders().providers.find((p) => p.name === "c2")
    assert.deepEqual(c2, { name: "c2", baseURL: "https://c2.example.com/v1" }, "落条两字段（零 model）")
    assert.equal(probes.length, 1, "准入探恰一次")
    // 缝内落条护栏：写径确实落在临时档（防「窗口漏出 ⇒ 写真实配置」复发）
    const onTmp = JSON.parse(readFileSync(cfg, "utf8"))
    assert.ok(onTmp.providers?.some((p) => p.name === "c2"), "落条在缝内临时档")
  })
})

test("③ config-migrate：② 段一律删（`model` ∥ `models`）∥ 幂等；① 段 active* → defaultModel 零动", () => {
  const raw = {
    providers: [
      { name: "a", baseURL: "https://a.example.com/v1", model: "m-a" },
      { name: "b", baseURL: "https://b.example.com/v1", models: ["m1", "m2"] },
    ],
  }
  assert.equal(config.migrateLegacyModelFields(raw), true, "有老字段 ⇒ changed")
  assert.equal("model" in raw.providers[0], false, "model 键清")
  assert.equal("models" in raw.providers[1], false, "models 键清")
  assert.equal(config.migrateLegacyModelFields(raw), false, "幂等——无老字段零改")

  const raw2 = { providers: [{ name: "k", model: "m-k" }], activeProvider: "k", activeModel: "m-legacy" }
  assert.equal(config.migrateLegacyModelFields(raw2), true)
  assert.equal(raw2.defaultModel, "k:m-legacy", "① 段：active* → defaultModel（本批零动）")
  assert.equal("activeProvider" in raw2, false)
  assert.equal("activeModel" in raw2, false)
  assert.equal("model" in raw2.providers[0], false, "② 段同拍清")
})

test("② vision-reader：`findVisionChannel` 判源退场 ⇒ 恒 `null`（零 `p.model` 读）；`runVisionReader` 走 F-IDG-2 出口", async () => {
  const vision = await mod("thincoder-core/vision-reader.mjs")
  assert.equal(typeof vision.findVisionChannel, "function", "函数与签名保留")
  assert.equal(vision.findVisionChannel([{ name: "v", model: "gpt-4o" }], "v"), null, "模型在场亦恒 null（判源退场）")
  assert.equal(vision.findVisionChannel([], ""), null)
  const src = readFileSync(join(ROOT, "thincoder-core/vision-reader.mjs"), "utf8")
  assert.equal(/p\??\.model\b/.test(src), false, "零 `p.model` 读（R3）")
  await withTmpConfig({ providers: [{ name: "v", baseURL: "https://v.example.com/v1", apiKey: "k", model: "gpt-4o" }] }, async () => {
    const r = await vision.runVisionReader({ paths: ["x.png"], providerName: "v", cwd: ROOT, parentAgent: {}, signal: undefined })
    assert.equal(r, null, "无视觉渠道 ⇒ null（可读报错径交消费侧——不静默丢图）")
  })
})

test("model-ref 随正（§6.19 模型面）：②档退场——不回退渠道单值；plan 消费点自洽", () => {
  const a = { name: "a", baseURL: "https://a.example.com/v1", apiKey: "k", model: "legacy-a" }
  assert.equal(modelRef.resolveChannelModel(a, "a:m1"), "m1", "① defaultModel 属本渠 ⇒ 模型段")
  assert.equal(modelRef.resolveChannelModel(a, "b:m2"), null, "他渠 ⇒ null（不回退渠道单值）")
  assert.equal(modelRef.resolveChannelModel(a, "a:"), null, "空模型段 ⇒ null（不回退渠道单值）")
  assert.equal(modelRef.resolveChannelModel(a, null), null, "无 defaultModel ⇒ null")
  const p1 = modelRef.resolveProviderPlan({ providers: [a], defaultModel: null })
  assert.equal(p1.model, null, "plan：无 defaultModel ⇒ model=null（渠道单值零参与）")
  assert.equal(p1.provider.model, null)
  assert.equal(modelRef.resolveProviderPlan({ providers: [a], defaultModel: "a:m1" }).model, "m1", "plan：defaultModel 属入选渠道 ⇒ 其模型段")
  const b = { name: "b", baseURL: "https://b.example.com/v1", apiKey: "kb" }
  const p3 = modelRef.resolveProviderPlan({ providers: [a, b], defaultModel: "b:m2", slot: { provider: "a", model: null } })
  assert.equal(p3.source, "slot")
  assert.equal(p3.model, null, "槽无模型 ∧ defaultModel 属他渠 ⇒ null（不回退渠道单值）")
})

test("件④（#20 路由）：`assertProviderModel` 拒因随 R3 收正——零退场字段指引", () => {
  assert.doesNotThrow(() => errors.assertProviderModel({ name: "p", model: "m" }))
  assert.throws(() => errors.assertProviderModel({ name: "p", baseURL: "https://p.example.com/v1" }), (e) => {
    assert.equal(e.name, "ProviderError")
    assert.ok(e.message.includes('provider "p"'), "携 provider 名")
    assert.equal(e.message.includes("providers[].model"), false, "零退场字段指引（R3）")
    assert.ok(e.message.includes("default model (provider:model)"), "新指引 = 模型身份唯二")
    return true
  })
})

test("件⑤（#20 路由）：`resolveAdvisorProvider` 模型面 = 父解析单档（渠级死读退场）", () => {
  const agent = {
    config: { advisor: { provider: "p1" }, providersList: [{ name: "p1", baseURL: "https://p1.example.com/v1", apiKey: "k", model: "legacy-chan" }] },
    providers: [],
    provider: { name: "main", baseURL: "https://main.example.com/v1", apiKey: "km", model: "m-parent" },
  }
  assert.equal(advRun.resolveAdvisorProvider(agent).model, "m-parent", "无 cfg.model ⇒ 父解析单档（渠级 legacy-chan 零参与）")
  assert.equal(advRun.resolveAdvisorProvider(agent).name, "p1", "渠道身份仍按 cfg.provider")
  const agent2 = { ...agent, config: { ...agent.config, advisor: { provider: "p1", model: "m-adv" } } }
  assert.equal(advRun.resolveAdvisorProvider(agent2).model, "m-adv", "cfg.model 优先")
})

// ─── 残留收口（fix 轮——三核修）─────────────────────────────────────────────

test("残留收口①：`migrateCore` 孤儿重建——门只认 baseURL（model 零读）∥ 重建条目零 `model` 键", async () => {
  /** 注入面跑一次 migrateCore（legacySettings 携 key ⇒ 第二遍 applyKey 触发；`saveRaw` 捕获写回）。 */
  const run = async (legacySettings, secretMap = {}) => {
    const raw = { providers: [] }
    const saved = []
    const deps = {
      secrets: { get: async (k) => secretMap[k] ?? null, delete: async () => {} },
      flags: { get: async () => false, set: async () => {} },
      legacySettings,
      clearLegacySettings: async () => {},
      loadRaw: () => raw,
      saveRaw: (r) => { saved.push(r); return { ok: true } },
      conflictError: (r) => r?.ok === false,
      presets: presets.PROVIDER_PRESETS,
      presetToEntry: presets.presetToEntry,
    }
    await migrate.migrateCore(deps)
    return { raw, saved }
  }

  // ① 携 model 的遗留条目：重建条目零 model 键（零读零落）+ context 随行保留
  {
    const { raw, saved } = await run({ customx: { baseURL: "https://cx.example/v1", model: "legacy-m", key: "sk-x", context: 128 } })
    const entry = raw.providers.find((p) => p.name === "customx")
    assert.deepEqual(entry, { name: "customx", baseURL: "https://cx.example/v1", context: 128, apiKey: "sk-x" }, "重建 = name/baseURL/context/apiKey")
    assert.equal("model" in entry, false, "零 model 键（R3 字面）")
    assert.equal(saved.length, 1, "saveRaw 恰一次")
  }
  // ② 门放宽：携 baseURL ∧ 无 model 的遗留条目 ⇒ 亦重建（原门 `!meta?.model` 会跳过）
  {
    const { raw } = await run({ customy: { baseURL: "https://cy.example/v1", key: "sk-y" } })
    assert.deepEqual(raw.providers.find((p) => p.name === "customy"), { name: "customy", baseURL: "https://cy.example/v1", apiKey: "sk-y" }, "门只认 baseURL ⇒ 无 model 亦可重建")
  }
  // ③ 门底线保留：无 baseURL ⇒ 仍跳过（无从重建）
  {
    const { raw } = await run({ customz: { key: "sk-z" } })
    assert.equal(raw.providers.length, 0, "无 baseURL ⇒ 零重建")
  }
  // ④ 预设径零回归：deepseek 密钥 ⇒ presetToEntry 产物 + apiKey（零 model 键）
  {
    const { raw } = await run({}, { "thincoder.provider.deepseek": "sk-ds" })
    const entry = raw.providers.find((p) => p.name === "deepseek")
    assert.equal(entry?.baseURL, "https://api.deepseek.com", "预设径照常重建")
    assert.equal(entry?.apiKey, "sk-ds", "密钥落条")
    assert.equal("model" in entry, false, "预设产物零 model 键")
  }
  // 零读字面：档内无 `meta.model` 读
  const src = readFileSync(join(ROOT, "thincoder-core/config-migrate.mjs"), "utf8")
  assert.equal(/meta\s*\??\.\s*model/.test(src), false, "零 `meta.model` 读（R3 字面）")
})

test("残留收口②：`findProvider` 兜底对象零 `model` 键（空表 + 空名）", () => {
  const fb = config.findProvider([], "")
  assert.deepEqual(fb, { name: "default", baseURL: "" }, "兜底 = name/baseURL 两字段")
  assert.equal("model" in fb, false, "零 model 键")
  const first = { name: "p", baseURL: "https://p.example.com/v1" }
  assert.equal(config.findProvider([first], ""), first, "非空表 ⇒ 首渠（零改）")
})

test("残留收口③：`sessionReading` 模型面走现行链（槽模型 → `defaultModel` 属渠段 → `null`）∥ 端装配入参锁", () => {
  const history = [{ role: "user", content: "u".repeat(20000) }, { role: "assistant", content: "a".repeat(20000) }]
  const p = { name: "p", baseURL: "https://p.example.com/v1", apiKey: "k" }
  const fallback = { name: "f", baseURL: "https://f.example.com/v1", apiKey: "kf", model: "f-model" }
  const at = (model) => tokenWindow.historyPercent(history, { ...p, model })
  const v4 = at("deepseek-v4-pro") // ctx 1M
  assert.notEqual(v4, at(null), "夹具判别力（v4-pro 1M ≠ 缺省 128K）")
  // ② defaultModel 属本渠 ⇒ 其模型段
  assert.equal(slife.sessionReading({ activeProvider: "p", activeModel: null, history }, { providers: [p], fallback, defaultModel: "p:deepseek-v4-pro" }), v4, "② dm 属本渠 ⇒ 其模型段")
  // 两档皆无 ⇒ null（不回退渠道单值）
  assert.equal(slife.sessionReading({ activeProvider: "p", activeModel: null, history }, { providers: [p], fallback, defaultModel: "q:x" }), at(null), "他渠 dm ⇒ null")
  assert.equal(slife.sessionReading({ activeProvider: "p", activeModel: null, history }, { providers: [p], fallback, defaultModel: null }), at(null), "无 dm ⇒ null")
  // ① 槽模型优先；非串 ∕ 空串 = 未登记 ⇒ 落链（#638 归一保留）
  assert.equal(slife.sessionReading({ activeProvider: "p", activeModel: "deepseek-v4-pro", history }, { providers: [p], fallback, defaultModel: "p:glm-4.6" }), v4, "槽模型优先于 dm")
  assert.equal(slife.sessionReading({ activeProvider: "p", activeModel: 42, history }, { providers: [p], fallback, defaultModel: "p:deepseek-v4-pro" }), v4, "非串 ⇒ 落链")
  // 未命中 ⇒ fallback（支 ② 零改）；数据面非对象 ⇒ 0（零抛）
  assert.equal(slife.sessionReading({ activeProvider: "ghost", history }, { providers: [p], fallback: { ...fallback, model: "deepseek-v4-pro" }, defaultModel: null }), v4, "未命中 ⇒ fallback")
  assert.equal(slife.sessionReading(null, {}), 0, "数据面非对象 ⇒ 0")
  // 源面：零 `entry.model` 读（R3 字面）+ 端装配面供链入参（防「入参缺席 ⇒ 链死」）
  const slSrc = readFileSync(join(ROOT, "thincoder-core/session-lifecycle.mjs"), "utf8")
  assert.equal(/entry\.model/.test(slSrc), false, "零 `entry.model` 读（R3 字面）")
  const slotsSrc = readFileSync(join(ROOT, "thincoder-desktop/src/main/session-slots.mjs"), "utf8")
  assert.ok(slotsSrc.includes("sessionReading(data, { providers: config.providersList, fallback: config.provider, defaultModel: config.defaultModel })"), "桌面 openingSeed 入参 = providers ∥ fallback ∥ defaultModel")
})
