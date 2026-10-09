/**
 * 2026-10-04-opencode-go-preset.test.mjs — 批内件（OpenCode Go 预设接入批 · 台账 #906）。
 * 名随批次档 · 不进仓套件 · 随批留存（终位 = `docs/batches/`）。复跑（仓库根 `thincoder/`）：
 *   node --test docs/batches/2026-10-04-opencode-go-preset.test.mjs
 *
 * 覆盖 = 批档 §2.4 用例表 G-1..G-6：
 *  G-1 ∕ G-2 两键行形（OpenAI ∕ anthropic 侧——表行 deepEqual + `presetToEntry` 剥 desc）；
 *  G-3 护栏（全表 25 条逐条无 `model` 键——2026-10-09 清除批：渠道单值模型退场 · 对齐 MODEL-SPECS P-3）；
 *  G-4 零改不变量（计数 25 + 键序冻结 + 既有 22 条逐条 deepEqual——批档 §2.4 抽样面扩为全量）；
 *  G-5 字段面白名单（两新键字段集 ⊆ 三端拷贝面七字段——防端侧静默丢）；
 *  G-6 行为（配置缝 `_setConfigPathForTest` 隔离 + stub fetch：`addProviderEntry` 条目形 ∕ `listModels`
 *      两腿头形 ∕ anthropic 侧 `max_tokens` 实发 65536）。
 * 2026-10-09 清除批随正：全表（含两新键）去 `model` 键；G-3 断言改「逐条无 `model` 键」；G-6 条目形两
 * 字段 ∥ anthropic 侧 chat 显式给模型。
 * 纪律：零实网（`globalThis.fetch` 全拦截）；配置缝隔离（临时目录，随后清理）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { pathToFileURL } from "node:url"

const ROOT = process.cwd()
if (!existsSync(join(ROOT, "thincoder-core"))) throw new Error(`须从仓库根（thincoder/）运行——cwd = ${ROOT}`)
const mod = (rel) => import(pathToFileURL(resolve(ROOT, rel)).href)

const presets = await mod("thincoder-core/config-presets.mjs")
const configIo = await mod("thincoder-core/config-io.mjs")
const core = await mod("thincoder-core/provider/core.mjs")
const listModels = await mod("thincoder-core/provider/list-models.mjs")

/** 两新键行形逐字（源 = 批档 §2.2-①；2026-10-09 清除批：零 `model`）。 */
const NEW = {
  "opencode-go": {
    baseURL: "https://opencode.ai/zen/go/v1",
    desc: "OpenCode Go subscription (sk- key from opencode.ai/zen; OpenAI-compatible models — MiniMax/Qwen via opencode-go-anthropic)",
  },
  "opencode-go-anthropic": {
    baseURL: "https://opencode.ai/zen/go/v1",
    format: "anthropic",
    maxTokens: 65536,
    desc: "OpenCode Go — Anthropic Messages side (same sk- key as opencode-go; MiniMax/Qwen models)",
  },
}

/** 既有 22 条逐字冻结快照（as-of 2026-10-04——G-4 零改不变量；键序 = 核表声明序；零 `model`）。 */
const OLD = {
  deepseek: { baseURL: "https://api.deepseek.com", thinking: { type: "enabled" }, reasoningEffort: "max", maxTokens: 384_000, desc: "DeepSeek" },
  kimi: { baseURL: "https://api.moonshot.cn/v1", thinking: null, reasoningEffort: "max", maxTokens: 131072, desc: "Kimi / Moonshot" },
  "kimi-code": { baseURL: "https://api.kimi.com/coding/v1", thinking: null, reasoningEffort: "max", maxTokens: 131072, desc: "Kimi For Coding (platform.kimi.com — sk-kimi- keys; NOT interchangeable with Moonshot)" },
  glm: { baseURL: "https://open.bigmodel.cn/api/paas/v4", thinking: { type: "enabled" }, reasoningEffort: "max", maxTokens: 128000, desc: "Zhipu GLM" },
  "glm-code": { baseURL: "https://open.bigmodel.cn/api/coding/paas/v4", thinking: { type: "enabled" }, reasoningEffort: "max", maxTokens: 128000, desc: "Zhipu GLM Coding Plan (coding endpoint — same key as GLM; server-forced thinking)" },
  qwen: { baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1", reasoningEffort: "high", maxTokens: 131072, desc: "Qwen / Alibaba" },
  qwenplan: { baseURL: "https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1", reasoningEffort: "high", maxTokens: 131072, desc: "Qwen Token Plan (百炼套餐)" },
  mimo: { baseURL: "https://api.xiaomimimo.com/v1", thinking: { type: "enabled" }, maxTokens: 131072, desc: "MiMo (Xiaomi)" },
  mimoplan: { baseURL: "https://token-plan-cn.xiaomimimo.com/v1", thinking: { type: "enabled" }, maxTokens: 131072, desc: "MiMo Token Plan (小米套餐 — tp- keys; 与按量付费 sk- 密钥不通用)" },
  minimax: { baseURL: "https://api.minimaxi.com/v1", thinking: { type: "adaptive" }, maxTokens: 128000, chatPath: "/text/chatcompletion_v2", desc: "MiniMax" },
  openai: { baseURL: "https://api.openai.com/v1", desc: "OpenAI" },
  claude: { baseURL: "https://api.anthropic.com/v1", format: "anthropic", maxTokens: 8192, desc: "Claude (Anthropic)" },
  gemini: { baseURL: "https://generativelanguage.googleapis.com/v1beta", format: "google", maxTokens: 8192, desc: "Gemini (Google)" },
  grok: { baseURL: "https://api.x.ai/v1", maxTokens: 64_000, desc: "Grok (xAI)" },
  mistral: { baseURL: "https://api.mistral.ai/v1", maxTokens: 32_000, desc: "Mistral" },
  volcengine: { baseURL: "https://ark.cn-beijing.volces.com/api/v3", maxTokens: 131072, desc: "Volcengine Ark (豆包)" },
  hunyuan: { baseURL: "https://api.hunyuan.cloud.tencent.com/v1", maxTokens: 32_000, desc: "Hunyuan (腾讯混元)" },
  tokenhub: { baseURL: "https://tokenhub.tencentmaas.com/v1", desc: "Tencent TokenHub (腾讯混元网关)" },
  huawei: { baseURL: "https://api.modelarts-maas.com/openai/v1", desc: "Huawei Cloud ModelArts Studio (华为云 MaaS)" },
  siliconflow: { baseURL: "https://api.siliconflow.cn/v1", maxTokens: 32_000, desc: "SiliconFlow (硅基流动)" },
  openrouter: { baseURL: "https://openrouter.ai/api/v1", maxTokens: 32_000, desc: "OpenRouter" },
  groq: { baseURL: "https://api.groq.com/openai/v1", maxTokens: 32_000, desc: "Groq" },
}

test("G-1 行形（OpenAI 侧）：表行逐字（零 model 键）+ presetToEntry 两字段（desc 剥离 · 零 format）", () => {
  assert.deepEqual(presets.PROVIDER_PRESETS["opencode-go"], NEW["opencode-go"], "行形 = baseURL ∕ desc 逐字")
  assert.deepEqual(presets.presetToEntry("opencode-go"), {
    name: "opencode-go",
    baseURL: "https://opencode.ai/zen/go/v1",
  }, "条目 = 两字段（零 desc ∕ format ∕ model）")
})

test("G-2 行形（anthropic 侧）：含 format:anthropic ∕ maxTokens:65536；presetToEntry 保两键", () => {
  assert.deepEqual(presets.PROVIDER_PRESETS["opencode-go-anthropic"], NEW["opencode-go-anthropic"], "行形 = 四字段逐字（零 model）")
  assert.deepEqual(presets.presetToEntry("opencode-go-anthropic"), {
    name: "opencode-go-anthropic",
    baseURL: "https://opencode.ai/zen/go/v1",
    format: "anthropic",
    maxTokens: 65536,
  }, "条目保 format ∕ maxTokens（desc 剥离）")
})

test("G-3 护栏：全表 25 条逐条无 `model` 键（2026-10-09 清除批——渠道单值模型退场 · 对齐 MODEL-SPECS P-3）", () => {
  for (const [name, p] of Object.entries(presets.PROVIDER_PRESETS)) {
    assert.equal("model" in p, false, `${name} 无 model 键`)
  }
})

test("G-4 零改不变量：计数 = 25（gemini-openai 插 gemini 后 + 两新键进尾）+ 既有 22 条逐条 deepEqual", () => {
  const names = Object.keys(presets.PROVIDER_PRESETS)
  assert.equal(names.length, 25, "计数 = 既有 22 + gemini-openai + 新增 2")
  const expected = [...Object.keys(OLD), "opencode-go", "opencode-go-anthropic"]
  expected.splice(expected.indexOf("gemini") + 1, 0, "gemini-openai")
  assert.deepEqual(names, expected, "键序 = 旧 22 序（+ gemini-openai 插 gemini 后）+ 两新键进尾")
  for (const [name, expect] of Object.entries(OLD)) {
    assert.deepEqual(presets.PROVIDER_PRESETS[name], expect, `既有 ${name} 零改`)
  }
})

test("G-5 字段面白名单：两新键字段集 ⊆ 三端拷贝面七字段（防端侧静默丢）", () => {
  const FIELDS = new Set(["baseURL", "desc", "format", "thinking", "reasoningEffort", "maxTokens", "chatPath"])
  for (const name of ["opencode-go", "opencode-go-anthropic"]) {
    const row = presets.PROVIDER_PRESETS[name]
    assert.ok(row, `${name} 在场`)
    const outside = Object.keys(row).filter((key) => !FIELDS.has(key))
    assert.deepEqual(outside, [], `${name} 零表外字段（端侧拷贝面会静默丢）：${outside.join(", ")}`)
  }
})

test("G-6 行为：配置缝条目形 + stub fetch（listModels 两腿头形 ∕ anthropic 侧 max_tokens 实发 65536）", async () => {
  const dir = mkdtempSync(join(tmpdir(), "ocg-preset-"))
  const cfg = join(dir, "config.json")
  const realFetch = globalThis.fetch
  const seen = []
  globalThis.fetch = async (url, init) => {
    seen.push({ url: String(url), headers: init?.headers ?? {}, body: init?.body ?? null })
    if (String(url).includes("/messages")) {
      return new Response(
        'event: message_start\ndata: {"type":"message_start","message":{"usage":{"input_tokens":1,"output_tokens":0}}}\n\n' +
        'event: content_block_delta\ndata: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"hi"}}\n\n' +
        'event: message_stop\ndata: {"type":"message_stop"}\n\n',
        { status: 200, headers: { "content-type": "text/event-stream" } },
      )
    }
    return new Response(JSON.stringify({ data: [{ id: "stub-b" }, { id: "stub-a" }] }), { status: 200, headers: { "content-type": "application/json" } })
  }
  configIo._setConfigPathForTest(cfg)
  try {
    // 配置缝：两条目落盘 ⇒ resolveProviders 条目形（desc 剥离；anthropic 侧含 format ∕ maxTokens；零 model）
    assert.equal(configIo.addProviderEntry({ preset: "opencode-go" }), null)
    assert.equal(configIo.addProviderEntry({ preset: "opencode-go-anthropic" }), null)
    const { providers } = configIo.resolveProviders()
    assert.deepEqual(providers[0], { name: "opencode-go", baseURL: "https://opencode.ai/zen/go/v1" }, "OpenAI 侧 = 两字段拷贝（零 model）")
    assert.deepEqual(providers[1], { name: "opencode-go-anthropic", baseURL: "https://opencode.ai/zen/go/v1", format: "anthropic", maxTokens: 65536 }, "anthropic 侧拷贝含 format ∕ maxTokens")
    // listModels 两腿（stub fetch）：OpenAI 侧 → GET /models + Bearer；anthropic 侧 → GET /models?limit=1000 + x-api-key
    assert.deepEqual(await listModels.listModels({ ...providers[0], apiKey: "sk-stub" }), ["stub-a", "stub-b"], "本端排序")
    assert.equal(seen[0].url, "https://opencode.ai/zen/go/v1/models")
    assert.equal(seen[0].headers.Authorization, "Bearer sk-stub", "OpenAI 侧 Bearer 头")
    assert.deepEqual(await listModels.listModels({ ...providers[1], apiKey: "sk-stub" }), ["stub-a", "stub-b"])
    assert.equal(seen[1].url, "https://opencode.ai/zen/go/v1/models?limit=1000")
    assert.equal(seen[1].headers["x-api-key"], "sk-stub", "anthropic 侧 x-api-key 头")
    // anthropic chat：max_tokens 实发 65536（不设即落规格行值 131072——§2.2-② 字段语义差）；渠道条目不携
    // 模型 ⇒ 模型显式给（2026-10-09 清除批）
    const res = await core.chat({ ...providers[1], apiKey: "sk-stub", model: "qwen3.7-max" }, { messages: [{ role: "user", content: "hi" }] })
    assert.equal(res.content, "hi")
    const sent = JSON.parse(seen[2].body)
    assert.equal(seen[2].url, "https://opencode.ai/zen/go/v1/messages")
    assert.equal(sent.model, "qwen3.7-max")
    assert.equal(sent.max_tokens, 65536, "max_tokens 实发 = 渠道口径 65536")
    assert.equal(seen.length, 3, "恰三取数（零重试 ∕ 零额外网络）")
  } finally {
    globalThis.fetch = realFetch
    configIo._resetConfigPathForTest()
    rmSync(dir, { recursive: true, force: true })
  }
})
