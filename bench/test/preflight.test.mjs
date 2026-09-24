/**
 * test/preflight.test.mjs — §5.13 `preflight.1`（枚举面 · fail-closed · 六项对齐腿）+ `run.mjs` 启动门拒跑腿
 * + `lib/params.mjs` 单源构造面（KD-32 / KD-34 · 台账 #264 / #266）。
 *
 * 判定单源 = `bench/lib/params.mjs`（**stub config + 真 spec 表** · 零网络）；实弹面（`--live`）不在测试射程
 * （需密钥 / 花钱——跑批前点名执行）。夹具与 CLI 驱动在 `test/fixtures.mjs`（沙箱结果目录）。
 * 手动跑：`node --test "bench/test/*.test.mjs"`（不进 CI —— AC-8）。
 */

import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { after, test } from "node:test"
import { buildProviderEntry, clampedTemperature, effortFace, enumerationPreflight } from "../lib/params.mjs"
import { runCli } from "./fixtures.mjs"

const tmpDirs = []
const tmpDir = () => {
  const d = mkdtempSync(join(tmpdir(), "bench-preflight-"))
  tmpDirs.push(d)
  return d
}
after(() => { for (const d of tmpDirs) rmSync(d, { recursive: true, force: true }) })

/** stub config（判定面只用 `name` / `format`——其余字段与兼容判定无关）。 */
const stubProviders = (...names) => names.map((name) => ({ name, baseURL: `https://${name}.example.com`, apiKey: "stub" }))
const entryOf = (over = {}) => ({ label: "fx", provider: "p", model: "deepseek-flash", dims: null, skipDims: null, note: "", ...over })

test("preflight.1：枚举面六项对齐腿（① 全合法 / ② provider 缺 / ③ spec 未命中 / ④ effort 越枚举 + 豁免变体 / ⑤ 温度对账报警 / ⑥ 无腿明示）+ 判官三槽同受检", () => {
  const providers = stubProviders("p")
  const slots = [
    { id: "A", provider: "p", model: "deepseek-flash" },
    { id: "B", provider: "p", model: "glm-5.3" },
    { id: "C", provider: "p", model: "deepseek-v4-pro" },
  ]
  // ① 对照腿：provider 在 config · spec 命中（真 spec 表）· effort ∈ 枚举（若有） ⇒ 零阻断
  const ok = enumerationPreflight({ entries: [entryOf({ label: "ds", model: "deepseek-flash", reasoningEffort: "high" })], slots, providers })
  assert.deepEqual(ok.blockers, [], `① 全合法 ⇒ 零阻断（实得：${ok.blockers.join("；")}）`)
  // ⑥ thinking 面（项⑥）= **不设判定**（明示无腿）：逐行打印 thinkApi 供目检，不进任何判定集
  assert.ok(ok.lines.some((l) => l.startsWith("信息") && l.includes("thinkApi") && l.includes("不设判定")), "⑥ thinking 面明示不设判定（打印 thinkApi）")
  assert.equal(ok.warnings.length, 0, "⑥ thinking 面零报警")
  // ② provider 缺（项①）⇒ 阻断 + 逐条点名
  const r1 = enumerationPreflight({ entries: [entryOf({ label: "no-provider", provider: "nope" })], providers })
  assert.equal(r1.blockers.length, 1)
  assert.match(r1.blockers[0], /模型 no-provider：provider「nope」不在用户 config/)
  // ③ spec 未命中（项②）⇒ 阻断（真 spec 表：未在册名 ⇒ 兜底 128K / 32K——尺寸静默低估面）
  const r2 = enumerationPreflight({ entries: [entryOf({ label: "unknown", model: "no-such-model-x" })], providers })
  assert.equal(r2.blockers.length, 1)
  assert.match(r2.blockers[0], /模型 unknown：spec 未命中「no-such-model-x」/)
  // ④ effort ∉ 枚举（项③）⇒ 阻断（deepseek-flash 枚举 = [low, high, max]；#264 类结构性防复发）
  const r3 = enumerationPreflight({ entries: [entryOf({ label: "bad-effort", model: "deepseek-flash", reasoningEffort: "medium" })], providers })
  assert.equal(r3.blockers.length, 1)
  assert.match(r3.blockers[0], /reasoningEffort「medium」∉ 该档枚举 \[low, high, max\]/)
  // ⑤ 豁免变体（项⑤ · 新腿）：路由形态名（`model` 含 `/`）⇒ ③ 判定跳过 · 零阻断 + 豁免行在位
  const r4 = enumerationPreflight({ entries: [entryOf({ label: "router", model: "kimi/kimi-k3", reasoningEffort: "medium" })], providers })
  assert.deepEqual(r4.blockers, [], "⑤ 路由形态名 ⇒ effort 不启送 ⇒ 判定跳过")
  assert.ok(r4.lines.some((l) => l.startsWith("豁免") && l.includes("model 含 /")), "⑤ 豁免行在位（记录面按未发送处置）")
  // ⑤ format 豁免（`format ∈ {anthropic, google}` ⇒ 不启送）：glm-5.3 枚举 [low, high, max] 下的「medium」本应阻断
  const googleCfg = [{ name: "p", baseURL: "https://p.example.com", apiKey: "stub", format: "google" }]
  const r5 = enumerationPreflight({ entries: [entryOf({ label: "override", model: "glm-5.3", reasoningEffort: "medium" })], providers: googleCfg })
  assert.deepEqual(r5.blockers, [], "⑤ format = google ⇒ 判定跳过（零阻断）")
  assert.ok(r5.lines.some((l) => l.startsWith("豁免") && l.includes("format = google")), "⑤ format 豁免行在位")
  const r5b = enumerationPreflight({ entries: [entryOf({ label: "override", model: "glm-5.3", reasoningEffort: "medium" })], providers })
  assert.equal(r5b.blockers.length, 1, "⑤ 反例控制：无豁免面 ⇒ 同一条目 ④ 照常阻断")
  // ⑤ 温度裁剪对账（项④）⇒ **报警**（不入阻断集）——glm-5.3 tempRange [0, 1]：档位 1.5 裁剪为 1
  const r6 = enumerationPreflight({ entries: [entryOf({ label: "hot", model: "glm-5.3", temperature: 1.5 })], providers })
  assert.deepEqual(r6.blockers, [], "⑤ 报警不入阻断集（对阻断集反例控制）")
  assert.equal(r6.warnings.length, 1)
  assert.match(r6.warnings[0], /temperature 1\.5 经 tempRange \[0,1\] 裁剪 ⇒ 实发 1/)
  // 判官三槽同受检（防换槽自身参数错——§2.10.3）：槽位 entry effort 面 + 槽位 provider 缺
  const judgeProviders = [{ name: "jp", baseURL: "https://jp.example.com", apiKey: "stub", reasoningEffort: "medium" }]
  const r7 = enumerationPreflight({ slots: [{ id: "B", provider: "jp", model: "glm-5.3" }], providers: judgeProviders })
  assert.equal(r7.blockers.length, 1)
  assert.match(r7.blockers[0], /判官 B 位：reasoningEffort「medium」∉ 该档枚举/)
  const r8 = enumerationPreflight({ slots: [{ id: "A", provider: "missing", model: "glm-5.3" }], providers: judgeProviders })
  assert.match(r8.blockers[0], /判官 A 位：provider「missing」不在用户 config/)
})

test("lib/params.mjs 单源构造面：四字段覆写 + 透传 / 两处皆无键不落 + effortFace 两态与未发送语义 + 温度裁剪单源", () => {
  const base = { name: "p", baseURL: "https://p.example.com", apiKey: "stub", reasoningEffort: "high" }
  const e1 = buildProviderEntry(base, { model: "m", maxTokens: 4096, temperature: 0, reasoningEffort: "medium" })
  assert.equal(`${e1.model}|${e1.maxTokens}|${e1.temperature}|${e1.reasoningEffort}`, "m|4096|0|medium", "四字段覆写（§2.9-1）")
  assert.equal(e1.baseURL, base.baseURL, "其余字段保持用户原值")
  assert.equal(buildProviderEntry(base, { model: "m", maxTokens: 4096, temperature: 0 }).reasoningEffort, "high", "档位缺省 ⇒ 沿 config 原值（键不覆写）")
  assert.equal("reasoningEffort" in buildProviderEntry({ name: "p" }, { model: "m", maxTokens: 4096, temperature: 0 }), false, "两处皆无 ⇒ 键不落条目（核不发该字段）")
  assert.deepEqual(effortFace({ model: "deepseek-flash", reasoningEffort: "high" }, null), { value: "high", from: "models.json" }, "档位覆写 ⇒ from = models.json")
  assert.deepEqual(effortFace({ model: "deepseek-flash" }, { reasoningEffort: "high" }), { value: "high", from: "config" }, "沿 config 原值 ⇒ from = config")
  assert.equal(effortFace({ model: "deepseek-flash" }, null), null, "两处皆无 ⇒ 未发送（两键不写——§2.2-13）")
  assert.equal(effortFace({ model: "kimi/kimi-k3", reasoningEffort: "high" }, null), null, "路由豁免 ⇒ 未发送")
  assert.equal(effortFace({ model: "deepseek-flash", reasoningEffort: "high" }, { format: "anthropic" }), null, "format 豁免 ⇒ 未发送")
  assert.equal(clampedTemperature({ tempRange: [0, 1] }, 1.5), 1, "裁剪对账（与核同式——`provider/core.mjs:187-190`）")
  assert.equal(clampedTemperature({}, 1.5), 1.5, "无 tempRange ⇒ 原值（不裁剪）")
})

test("run.mjs 启动门：枚举面零阻断 ⇒ 照跑 exit 0；有阻断（判官槽位 spec 未命中）⇒ 拒跑 exit 1 + 逐条点名 + 零网络", async () => {
  const orig = globalThis.fetch
  let calls = 0
  globalThis.fetch = () => { calls++; throw new Error("network disabled by test") }
  try {
    // 对照腿：真数据（真 roster + 真 judge.json + 真 spec 表）⇒ 枚举面零阻断 ⇒ dry-run 全链路照跑
    const okRun = await runCli(["--dry-run", "--models", "mimo-v2.6-flash", "--dims", "reasoning", "--label", `pf-ok-${process.pid}`])
    assert.equal(okRun.code, 0, okRun.out)
    assert.equal(calls, 0, "对照腿零网络")
    // 阻断腿：stub judge.json 槽位模型未在册（spec 未命中 = 项②）⇒ 启动门拒跑
    const bad = join(tmpDir(), "judge-unknown-slot.json")
    writeFileSync(bad, JSON.stringify({
      version: 1,
      frozenAtSuiteVersion: 6,
      judges: [
        { provider: "deepseek", model: "no-such-judge-model", maxTokens: 2048, timeoutSec: 30 },
        { provider: "deepseek", model: "deepseek-v4-pro", maxTokens: 2048, timeoutSec: 30 },
      ],
      arbiter: { provider: "deepseek", model: "deepseek-flash", maxTokens: 2048, timeoutSec: 30 },
    }), "utf8")
    process.env.BENCH_JUDGE = bad
    const blocked = await runCli(["--dry-run", "--models", "mimo-v2.6-flash", "--dims", "reasoning", "--label", `pf-blocked-${process.pid}`])
    assert.equal(blocked.code, 1, blocked.out)
    assert.ok(blocked.out.includes("跑前预检：枚举面阻断 1 条"), `启动门拒跑（实得：${blocked.out}）`)
    assert.ok(blocked.out.includes("判官 A 位：spec 未命中「no-such-judge-model」"), "阻断逐条点名（预检面点名、非泛化报错）")
    assert.equal(calls, 0, "枚举面零网络（拒跑前不触网、拒跑后亦不触网）")
  } finally {
    globalThis.fetch = orig
    delete process.env.BENCH_JUDGE
  }
})
