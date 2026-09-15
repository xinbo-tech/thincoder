/**
 * scenario-07-config-routing.test.mjs — 集成场景 ⑦「配置装载与 provider 选路」VSC 实例。
 *
 * 设计权威：`docs/design/TESTING.md` §4 场景表（本端驱动面 = 本端配置装载 + 软失败面
 * （`config-softfail` 先例））；共享语义源 = CLI 侧 `docs/design/TESTING.md` §5.7。
 *
 * 三态：
 *   正常 —— 真实 config.json（两个渠道，默认指向其一）→ 解析选路 → 真实请求打到**选中**
 *           渠道的本地 mock（model/baseURL 与配置一致——不拿错 key 不跑错端点）；
 *   边界 —— 指定不存在的渠道名 → 明确报错（列出可用渠道）——不静默落第一个；
 *   错误 —— 坏配置（JSON 损坏 / 空渠道）→ 软失败（读面返回空、不崩），错误文案可读可行动。
 */
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { _setConfigPathForTest, resolveProviders, providerFromConfig, loadRaw, providerNamesInConfig, resolveDefaultModel } from "../../src/config-io.mjs"
import { chat } from "@thincoder/core/provider/core.mjs"
import { mockLLM } from "./helpers/mock-llm.mjs"

let dir
let cfgPath

before(() => {
  dir = mkdtempSync(join(tmpdir(), "tc-integ-config-"))
  cfgPath = join(dir, "config.json")
  _setConfigPathForTest(cfgPath)
})
after(() => {
  _setConfigPathForTest(null)
  rmSync(dir, { recursive: true, force: true })
})

const writeConfig = (obj) => writeFileSync(cfgPath, JSON.stringify(obj, null, 2) + "\n", "utf8")

test("⑦ 正常：真实配置选路——请求打到选中渠道的本地 mock（model/baseURL 匹配）", async () => {
  const llmA = await mockLLM([{ content: "A 渠道答复" }])
  const llmB = await mockLLM([{ content: "B 渠道答复" }])
  try {
    writeConfig({
      defaultModel: "渠道B:model-b",
      providers: [
        { name: "渠道A", baseURL: llmA.baseURL, model: "model-a", apiKey: "key-a" },
        { name: "渠道B", baseURL: llmB.baseURL, model: "model-b", apiKey: "key-b" },
      ],
    })
    const { providers, activeProvider } = resolveProviders()
    assert.equal(activeProvider, "渠道B", "默认渠道 = defaultModel 指名的渠道")
    assert.deepEqual(providers.map((p) => p.name), ["渠道A", "渠道B"], "渠道清单完整")
    assert.equal(resolveDefaultModel(providers[1], loadRaw()), "model-b", "默认模型 = 复合串右段")

    const p = providerFromConfig("渠道B")
    assert.equal(p.model, "model-b")
    assert.equal(p.apiKey, "key-b", "取到的是本渠道的 key（不串渠道）")

    const r = await chat(p, { messages: [{ role: "user", content: "hi" }] })
    assert.equal(r.content, "B 渠道答复", "答复来自选中渠道")
    assert.equal(llmB.calls, 1, "选中渠道收到请求")
    assert.equal(llmA.calls, 0, "未选中渠道零请求（不跑错端点）")
    assert.equal(llmB.requests[0].body.model, "model-b", "线上 model = 解析后的默认模型")
  } finally {
    await llmA.close()
    await llmB.close()
  }
})

test("⑦ 边界：指定不存在的渠道名 → 明确报错并列出可用渠道（不静默落第一个）", () => {
  writeConfig({
    defaultModel: "渠道A:model-a",
    providers: [
      { name: "渠道A", baseURL: "http://127.0.0.1:1", model: "model-a", apiKey: "key-a" },
      { name: "渠道B", baseURL: "http://127.0.0.1:2", model: "model-b", apiKey: "key-b" },
    ],
  })
  assert.throws(
    () => providerFromConfig("拼错的渠道"),
    (e) => /not in providers list/.test(e.message) && /渠道A, 渠道B/.test(e.message),
    "报错含可用渠道清单（防拿错 key——错名不静默回退第一个渠道）",
  )
})

test("⑦ 错误：坏配置（JSON 损坏）→ 可读可行动的错误；读面软失败返回空（不崩）", () => {
  writeFileSync(cfgPath, "{ 这不是 JSON", "utf8")
  assert.throws(() => loadRaw(), (e) => /not valid JSON, check or delete it/.test(e.message) && e.message.includes(cfgPath), "损坏配置报可读文案（含文件路径与处置建议）")
  assert.deepEqual(providerNamesInConfig(), [], "读面软失败：渠道名清空（不崩——面板可引导重配）")
})

test("⑦ 错误：空渠道配置 → 软失败（解析返回空 + 无 provider 可构建，不崩溃）", () => {
  writeConfig({ providers: [] })
  const { providers, activeProvider } = resolveProviders()
  assert.deepEqual(providers, [], "空渠道清单（软失败——不是崩溃）")
  assert.equal(activeProvider, "", "无默认渠道")
  assert.equal(providerFromConfig(), null, "无渠道可构建 → null（面板据此引导配置）")
  assert.deepEqual(providerNamesInConfig(), [], "渠道名读面为空")
})
