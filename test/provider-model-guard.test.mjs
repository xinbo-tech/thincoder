/**
 * provider-model-guard.test.mjs — MODEL-400-FIX（docs/design/MODEL-400-FIX.md——评审采纳版）
 * F-1 请求体断言 + F-2 克隆现场 model 重派生（VSC 面——CLI test/provider-model-guard 镜像）。
 *
 * 根因：MODEL-MERGE 删渠道 model 字段（渠道只带 models[] 候选）——`{...渠道}` 裸克隆不
 * 重派生 .model → model 键缺失 → JSON.stringify 丢 undefined 键 → 无 model 请求 → serde 400
 * （digest/advisor 无 echo 走克隆链落空；主会话 per-message echo 正常）。
 *
 * 覆盖（用例表 + 验收 AC-1/AC-2）：
 * - F-1 provider.model undefined/null/空串 → buildRequest 可读 throw（ProviderError——带
 *   provider 名 + 修复线索）——不发病体（guard 在 body 组装前——不 mock fetch）
 * - F-2b resolveAdvisorProvider：cfg.provider 命中但无 cfg.model → model = 主 provider 的
 *   model（渠道自带 .model 优先）；cfg.model 显式 → override 不变
 * - F-2d saveLines 槽装配面（panel-session.mjs 镜像——CLI applySession `||` 语义）：extra 带
 *   activeModel="" 不把空串钉进槽（回退 existing——槽 model 恒有值/恒缺失）；null/缺席保留
 *   槽值（不回归）；真实模型照常替换
 */
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { _setConfigPathForTest } from "../src/config-io.mjs"
import { _setSessionsDirForTest, _resetSessionsDirForTest, slotPath } from "../src/extension/session-io.mjs"

let dir
let cfgPath
let sessionsDir

before(() => {
  dir = mkdtempSync(join(tmpdir(), "tc-m400-"))
  sessionsDir = join(dir, "sessions")
  mkdirSync(sessionsDir, { recursive: true })
  cfgPath = join(dir, "config.json")
  writeFileSync(cfgPath, JSON.stringify({
    defaultModel: "deepseek:deepseek-v4-pro",
    providers: [
      { name: "deepseek", baseURL: "https://api.deepseek.com", models: ["deepseek-v4-pro", "deepseek-v4-flash"], apiKey: "k1" },
      { name: "kimi", baseURL: "https://x", models: ["kimi-k3"], apiKey: "k2" },
    ],
  }, null, 2) + "\n", "utf8")
  _setConfigPathForTest(cfgPath)
  _setSessionsDirForTest(sessionsDir)
})

after(() => {
  _setConfigPathForTest(null)
  _resetSessionsDirForTest()
  try { rmSync(dir, { recursive: true, force: true }) } catch { /* ignore */ }
})

// ─── F-1 请求体断言（AC-1）───

const { buildRequest } = await import("../src/provider/transports/openai.mjs")

const F1_RE = /provider "deepseek": model is undefined — provider cloned without model re-derivation \(MODEL-MERGE schema: channels carry models\[\] not model\)/

function runProvider(model) {
  return { name: "deepseek", baseURL: "https://api.deepseek.com/v1", apiKey: "k-test", model }
}

test("F-1 model undefined → 可读 throw（带 provider 名 + 修复线索）——不发病体", () => {
  assert.throws(() => buildRequest(runProvider(undefined), [{ role: "user", content: "hi" }]), F1_RE)
})

test("F-1 model null → 同 throw（另一类 serde 错防住）", () => {
  assert.throws(() => buildRequest(runProvider(null), [{ role: "user", content: "hi" }]), F1_RE)
})

test("F-1 model 空串 → 同 throw（falsy 全拦）", () => {
  assert.throws(() => buildRequest(runProvider(""), [{ role: "user", content: "hi" }]), F1_RE)
})

test("F-1 有 model 不拦——body 照常带 model 键", () => {
  const req = buildRequest(runProvider("deepseek-v4-flash"), [{ role: "user", content: "hi" }])
  assert.equal(JSON.parse(req.body).model, "deepseek-v4-flash")
})

// ─── F-2 克隆现场 model 重派生（AC-2）───

// F-2b advisor：cfg.provider 命中渠道（新 schema——models[] 无 model）但无 cfg.model
const MAIN = { name: "deepseek", baseURL: "https://api.deepseek.com", model: "deepseek-v4-flash", apiKey: "k-main" }

test("F-2b advisor 无 cfg.model → provider.model = 主 provider 的 model（渠道克隆重派生——model 键不缺失）", async () => {
  const { resolveAdvisorProvider } = await import("../src/advisor/provider.mjs")
  const r = resolveAdvisorProvider({ _provider: MAIN, config: { advisor: { provider: "kimi" } } })
  assert.equal(r.name, "kimi", "渠道命中")
  assert.equal(r.baseURL, "https://x", "端点=advisor 渠道——model 重派生不换端点")
  assert.equal(r.model, MAIN.model, "model = 主 provider 的 model")
})

test("F-2b cfg.model 显式 → override 不变（model: cfg.model 分支零回归）", async () => {
  const { resolveAdvisorProvider } = await import("../src/advisor/provider.mjs")
  const r = resolveAdvisorProvider({ _provider: MAIN, config: { advisor: { provider: "kimi", model: "kimi-k3" } } })
  assert.equal(r.model, "kimi-k3")
})

test("F-2b 无 cfg.provider → 主 provider 原样（含 model——fallback 分支零回归）", async () => {
  const { resolveAdvisorProvider } = await import("../src/advisor/provider.mjs")
  const r = resolveAdvisorProvider({ _provider: MAIN, config: { advisor: {} } })
  assert.equal(r.model, MAIN.model)
})

// F-2d panel-session saveLines 槽装配镜像（CLI applySession `||` 语义）——每测试独立 slot
// （消除声明序耦合——单跑/乱序各自成立）
const panelAt = (slot) => ({ _ensureSlot: () => slot })

test("F-2d extra activeModel='' 不钉空串——回退 existing（槽 model 恒有值/恒缺失）", async () => {
  const { saveLines } = await import("../src/extension/panel-session.mjs")
  const panel = panelAt(2)
  saveLines(panel, [{ role: "user", type: "user", content: "a" }], [], { activeProvider: "deepseek", activeModel: "deepseek-v4-flash" }, 2)
  saveLines(panel, [], [], { activeProvider: "deepseek", activeModel: "" }, 2)
  const data = JSON.parse(readFileSync(slotPath(process.cwd(), 2), "utf8"))
  assert.equal(data.activeModel, "deepseek-v4-flash", "空串视为缺失——不清既有槽 model")
})

test("F-2d null/缺席 extra 保留槽值（??→|| 语义零回归——slotStamp null 不落链）", async () => {
  const { saveLines } = await import("../src/extension/panel-session.mjs")
  const panel = panelAt(3)
  saveLines(panel, [], [], { activeProvider: "deepseek", activeModel: "deepseek-v4-flash" }, 3)
  saveLines(panel, [], [], { activeProvider: "deepseek", activeModel: null }, 3)
  saveLines(panel, [], [], { activeProvider: "deepseek" }, 3)
  const data = JSON.parse(readFileSync(slotPath(process.cwd(), 3), "utf8"))
  assert.equal(data.activeModel, "deepseek-v4-flash")
})

test("F-2d 真实模型照常替换（新选择写槽不回归）", async () => {
  const { saveLines } = await import("../src/extension/panel-session.mjs")
  const panel = panelAt(4)
  saveLines(panel, [], [], { activeProvider: "deepseek", activeModel: "deepseek-v4-pro" }, 4)
  const data = JSON.parse(readFileSync(slotPath(process.cwd(), 4), "utf8"))
  assert.equal(data.activeModel, "deepseek-v4-pro")
})
