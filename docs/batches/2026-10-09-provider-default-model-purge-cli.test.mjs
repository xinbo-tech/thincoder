/**
 * 2026-10-09-provider-default-model-purge-cli.test.mjs — 批内件（CLI 舱；随批档存档；直接跑：node --test）。
 *
 * provider-default-model-purge 批（`docs/batches/2026-10-09-provider-default-model-purge.md`——台账 #1122）
 * CLI 舱（A2）腿——渠道单值模型（`providers[].model`）退场后 CLI 面的读数 ∥ 回落 ∥ 播种随正：
 *  - T1：渠行标签零 "(no default model)" ∥ 「渠道默认」词族零残留（CLI src/test 全域源扫描）。
 *  - T2：预设列表行零 model 拼接（源锁 + 添加流首屏实读）。
 *  - T3：向导产物（桩测）无渠道 `model` 键 ∥ 零 `defaultModel` 播种（显式选定才写）。
 *  - T4：探针入参三例（`provider:model` ∥ 多冒号 ∥ 非法）——语义单源 = 核 `parseModelRef`。
 *  - T5：/model L1 渠道行行为（渠道侧 `model` 字段不上屏 ∥ 会话槽模型随行 ∥ note = baseURL）。
 *  - T6：/config 默认模型子菜单渠行 = baseURL ∥ reloadConfig 零渠道侧 model 回落（源锁）。
 *  - T7：advisor 有效模型 = cfg.model ∥ 父解析模型（零渠道条目 `.model` 回落——M3③ 消费者行）。
 *  - T8：A2 机检第二半——两无（advisor 无 `cfg.model` ∧ 父 provider 无 model）⇒ 核
 *    `assertProviderModel` fail-fast 可读错误不变（解析 → 载荷前断言联动；守卫本体属核舱，本件代跑联动腿）。
 *
 * 桩测不碰真配置（向导桩 persistRaw 为内存 mutate）；探针网络面 = `127.0.0.1:1`（连接拒绝——即时失败，不阻断）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"

const CORE = new URL("../../thincoder-core/", import.meta.url).href
const CLI = new URL("../../thincoder-cli/", import.meta.url).href
const CLI_ROOT = fileURLToPath(new URL("../../thincoder-cli/", import.meta.url))

/** CLI src/test 全域 .mjs 文件表（递归；跳 dot 目录与 node_modules）。 */
function walkMjs(rootDir) {
  const out = []
  for (const ent of readdirSync(rootDir, { withFileTypes: true })) {
    if (ent.name === "node_modules" || ent.name.startsWith(".")) continue
    const p = join(rootDir, ent.name)
    if (ent.isDirectory()) out.push(...walkMjs(p))
    else if (ent.name.endsWith(".mjs")) out.push(p)
  }
  return out
}

const readCli = (rel) => readFileSync(join(CLI_ROOT, rel), "utf8")

// ═══ T1：渠行标签零 "(no default model)"（源扫描）═══

test("T1 渠行标签零 \"(no default model)\" ∥ 「渠道默认」词族零残留（CLI src/test 全域）", () => {
  const files = [...walkMjs(join(CLI_ROOT, "src")), ...walkMjs(join(CLI_ROOT, "test"))]
  assert.ok(files.length > 20, "扫描面应非空（防空扫）")
  for (const f of files) {
    const src = readFileSync(f, "utf8")
    assert.ok(!src.includes("(no default model)"), `${f}: \"(no default model)\" 零残留`)
    assert.ok(!src.includes("渠道默认"), `${f}: 「渠道默认」词族零残留`)
  }
})

// ═══ T2：预设列表行零 model 拼接 ═══

test("T2 预设列表行零 model 拼接（源锁 + 添加流首屏实读）", async () => {
  const adminSrc = readCli("src/tui/provider-admin.mjs")
  assert.ok(!adminSrc.includes("p.model"), "provider-admin：零 `p.model` 读（预设行零 model 拼接）")
  const { PROVIDER_PRESETS } = await import(CORE + "config.mjs")
  const { createProviderAdmin } = await import(CLI + "src/tui/provider-admin.mjs")
  let captured = null
  const admin = createProviderAdmin({
    agent: { providers: [] },
    showPicker: async (title, entries) => { captured = entries; return null }, // 首屏捕获后 Esc
    askQuestion: async () => null,
    pushLine: () => {},
    persistRaw: async () => {},
    maskKey: () => "••••",
    confirmDelete: async () => false,
    C: {},
    fmtContextK: (t) => `${Math.round(t / 1024)}K`,
  })
  await admin.addProviderFlow()
  assert.ok(Array.isArray(captured), "添加流首屏应打开 picker")
  const presetRows = captured.filter((e) => e.kind === "preset")
  assert.equal(presetRows.length, Object.keys(PROVIDER_PRESETS).length, "预设行 = 全表（agent.providers 空）")
  for (const row of presetRows) {
    const p = PROVIDER_PRESETS[row.name]
    assert.equal(row.text, `${row.name.padEnd(10)} ${p.desc ?? ""}`, `${row.name}: 行文本 = 名 + desc（零 model 拼接）`)
  }
})

// ═══ T3：向导产物（桩测）无渠道 model 键 ═══

test("T3 向导产物（桩测）无渠道 `model` 键 ∥ 零 `defaultModel` 播种", async () => {
  const { createWizard } = await import(CLI + "src/tui/wizard.mjs")
  const persisted = []
  let pickerOpened = false
  const state = { wizard: null, picker: null }
  const ctx = {
    agent: { providers: [], config: {} },
    state,
    pushLine: () => {},
    pushLabel: () => {},
    render: () => {},
    persistRaw: async (mutate) => { const raw = { providers: [] }; mutate(raw); persisted.push(JSON.parse(JSON.stringify(raw))) }, // 快照 = 落盘序列化（探针后的内存标 `_unavailable` 不属盘面）
    showPicker: async () => ({ name: "no" }), // 「走 proxy」问句缺省 = No
    openModelPicker: async () => { pickerOpened = true },
  }
  const wizard = createWizard(ctx)
  state.wizard = { fields: { name: "tc-wiz", baseURL: "http://127.0.0.1:1/v1", key: "sk-test", format: "anthropic" } }
  await wizard.finishWizard()

  assert.equal(persisted.length, 1, "恰一次落盘（provider upsert；无 embedkey ⇒ 无第二次）")
  const raw = persisted[0]
  assert.equal(raw.providers.length, 1)
  const rec = raw.providers[0]
  assert.deepEqual(rec, { name: "tc-wiz", baseURL: "http://127.0.0.1:1/v1", apiKey: "sk-test", format: "anthropic" },
    "渠道条目 = name/baseURL/apiKey + 预设扩展字段（逐键）——无 `model`")
  assert.ok(!("model" in rec), "渠道条目零 `model` 键（零播种）")
  assert.ok(!("defaultModel" in raw), "`defaultModel` 零播种——仅显式选定写（picker carryover）")
  assert.ok(!("activeProvider" in raw) && !("activeModel" in raw), "legacy 顶层键清除（语义零改）")
  assert.equal(pickerOpened, true, "落盘后进模型选择面（显式选定路径）")
})

// ═══ T4：探针入参三例 ═══

test("T4 探针入参三例：`provider:model` ∥ 多冒号 ∥ 非法（语义单源 = 核 parseModelRef）", async () => {
  const smokeSrc = readCli("test/smoke-qwen-thinking.mjs")
  assert.ok(!smokeSrc.includes("prov.model"), "探针选路零 `providers[].model` 读（入参显式 provider:model）")
  const { parseSmokeTarget } = await import(CLI + "test/smoke-qwen-thinking.mjs")
  const providers = [{ name: "bailian" }, { name: "ollama" }]

  // ① 正常：provider:model
  const ok1 = await parseSmokeTarget("bailian:qwen3.7-flash", providers)
  assert.equal(ok1.ok, true, "显式 provider:model 放行")
  assert.equal(ok1.provider.name, "bailian")
  assert.equal(ok1.model, "qwen3.7-flash")

  // ② 多冒号：首冒号分割（模型段可含冒号）
  const ok2 = await parseSmokeTarget("ollama:llama3:70b", providers)
  assert.equal(ok2.ok, true, "多冒号首分割放行")
  assert.equal(ok2.model, "llama3:70b")

  // ③ 非法：空串 ∥ 裸值 ∥ 空模型段 ∥ 空 provider 段 ∥ 未知 provider
  for (const bad of ["", "   ", "bailian", "bailian:", ":qwen3.7-flash", "nope:qwen3.7-flash"]) {
    const r = await parseSmokeTarget(bad, providers)
    assert.equal(r.ok, false, `非法入参 "${bad}" 应拒`)
    assert.equal(typeof r.reason, "string", `非法入参 "${bad}" 应携可读 reason`)
  }
})

// ═══ T5：/model L1 渠道行行为 ═══

test("T5 L1 渠道行：渠道侧 `model` 字段不上屏 ∥ 会话槽模型随行 ∥ note = baseURL", async () => {
  const { createModelPicker } = await import(CLI + "src/tui/model-picker.mjs")
  const makeCtx = (agent) => {
    const box = { captured: null }
    const ctx = {
      agent,
      state: { picker: null, pickerStack: [] },
      pushLine: () => {},
      persistRaw: async () => {},
      askQuestion: async () => null,
      maskKey: () => "••••",
      showPicker: async (title, entries) => { box.captured = entries; return null },
      closePicker: () => {},
      renderPickerLines: () => {},
      confirmDelete: async () => false,
      ansi: { bold: "", dim: "", reset: "" },
      C: {},
    }
    return { ctx, box }
  }

  // ① 非会话渠道携遗留 `model` 字段：不上屏；note = baseURL
  const a = makeCtx({ providers: [{ name: "deepseek", baseURL: "https://api.deepseek.com", apiKey: "sk", model: "deepseek-chat" }], activeProvider: "", activeModel: null })
  await createModelPicker(a.ctx).openModelPicker()
  const row1 = a.box.captured.find((e) => e.provider === "deepseek")
  assert.ok(row1, "L1 应含渠道行")
  assert.ok(!row1.text.includes("deepseek-chat"), "渠道侧 `model` 字段不上屏（单值退场）")
  assert.equal(row1.note, "https://api.deepseek.com", "显示回退 = note 的 baseURL")

  // ② 会话渠道带会话槽模型：随行显示（会话值是合法模型面）
  const b = makeCtx({ providers: [{ name: "deepseek", baseURL: "https://api.deepseek.com", apiKey: "sk" }], activeProvider: "deepseek", activeModel: "deepseek-v4-pro" })
  await createModelPicker(b.ctx).openModelPicker()
  const row2 = b.box.captured.find((e) => e.provider === "deepseek")
  assert.ok(row2.text.includes("deepseek-v4-pro"), "会话槽模型随行显示")
})

// ═══ T6：/config 默认模型子菜单渠行 + reloadConfig 回落（源锁）═══

test("T6 /config 渠行 = baseURL ∥ reloadConfig 零渠道侧 model 回落", () => {
  const src = readCli("src/tui/cmd-config.mjs")
  assert.ok(src.includes("${p.name.padEnd(10)} ${p.baseURL}"), "默认模型子菜单渠行显示回退 = baseURL")
  assert.ok(!src.includes("keep.model"), "reloadConfig 零渠道侧 model 回落（槽 → defaultModel 属渠段 → 明示未设置）")
})

// ═══ T7：advisor 有效模型零渠道条目回落（M3③ 消费者行）═══

test("T7 advisor 有效模型 = cfg.model ∥ 父解析模型（零渠道条目 `.model` 回落）", () => {
  const src = readCli("src/tui/cmd-advisor.mjs")
  assert.ok(!src.includes("providerForDefaults.model"), "有效模型零渠条目 `.model` 回落（父解析模型单档——M3③）")
  assert.ok(!src.includes("p.model"), "advisor 模型菜单零渠道 `p.model` 读（候选 = 运行期拉取清单）")
  assert.equal((src.match(/cfg\.model \|\| agent\.provider/g) ?? []).length, 3,
    "有效模型同式 ×3（状态行 ×2 ∥ getEffectiveModel）——渠道侧零回落")
})

// ═══ T8：两无 ⇒ assertProviderModel fail-fast 不变（A2 机检第二半）═══

test("T8 两无（advisor 无 cfg.model ∧ 父 provider 无 model）⇒ fail-fast 可读错误", async () => {
  const { resolveAdvisorProvider } = await import(CORE + "advisor/run.mjs")
  const { assertProviderModel } = await import(CORE + "provider/errors.mjs")
  const { chat } = await import(CORE + "provider/index.mjs")
  // 两无：渠道条目零 model（清除批退场）∧ 父 provider 零 model（未选定态）
  const agent = {
    provider: { baseURL: "http://127.0.0.1:1/v1", apiKey: "sk-test" },
    providers: [{ name: "chan", baseURL: "http://127.0.0.1:1/v1", apiKey: "sk-test" }],
    config: { advisor: { provider: "chan" } },
  }
  const resolved = resolveAdvisorProvider(agent)
  assert.equal(resolved.model, undefined, "两无 ⇒ 解析产物零 model（渠道侧零回落）")
  assert.throws(() => assertProviderModel(resolved), /model is undefined/, "守卫本体：可读错误")
  // 消费链：真调用 chat 亦在载荷组装前 fail-fast（断言先于发包——零网络）
  await assert.rejects(() => chat(resolved, { messages: [{ role: "user", content: "ping" }] }, {}), /model is undefined/)
})
