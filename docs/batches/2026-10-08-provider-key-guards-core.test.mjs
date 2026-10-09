/**
 * 2026-10-08-provider-key-guards-core.test.mjs — 批内件（核舱：T-C1 ∥ T-C1b ∥ T-C2 ∥ T-G1–T-G3）。
 * 跑法（仓根 `thincoder/`）：`node --test docs/batches/2026-10-08-provider-key-guards-core.test.mjs`
 * 不入仓套件 · 随批留存归档（判据语义 = `docs/core/design/PROVIDER.md` §6.23 ∥ 批档 §2.4 用例面）。
 *
 * 腿：
 *   T-C1  #1062 单写原子——`onConfigSelfWrite` 逐拍快照 ⇒ 快照恰 1 ∧ 该拍盘面同含条目 + `apiKey`
 *         （旧实现两段写 ⇒ 快照 2 ∧ 首拍无钥——红）。
 *   T-C1b #1062 冲突支（核级真径注入）——假 `node:fs` 视图（唯 `config-io.mjs` 的 `statSync`——目标
 *         路径二阶读抬升 mtime）⇒ 真「写前重 stat ≠ t0」分支：返回 = `CONFIG_CONFLICT_HINT`（非 null）
 *         ∧ 快照 0 ∧ 盘面逐字节不变（条目 ∥ 钥俱不落）∧ `.bak` 现场 1。
 *   T-C2  #1062 键语义回归——`" sk "` ⇒ 落 trim 值；空 ∥ 全空白 ⇒ 无 `apiKey` 键。
 *   T-G1  #1063 缺钥守卫——四 format（openai ∥ anthropic ∥ google ∥ responses）无钥 + `globalThis.fetch`
 *         计数桩 ⇒ 拒且含 `API key missing for provider` ∧ fetch 数 0（守卫缺失 ⇒ fetch 被调——红）。
 *   T-G2  全空白钥同判（四 format）。
 *   T-G3  有钥负控——守卫放行 ⇒ fetch 被调。
 *
 * 节奏缝：`_rateHooks.sleep` 置零（`rate.mjs` 既定测试钩子——离线测试不真等退避；负控径重试退避
 * 全瞬间，守卫拒否径不触 sleep）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { registerHooks } from "node:module"
import { mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

// 家目录重定向（安全网：核 configDir 于模组装载期取值——一切动态 import 之前覆盖，防误写真实配置）
const _home = mkdtempSync(join(tmpdir(), "pk-guards-core-home-"))
process.env.HOME = _home
process.env.USERPROFILE = _home

const ROOT = fileURLToPath(new URL("../../", import.meta.url)) // 仓根（docs/batches 两层深）
const core = (rel) => pathToFileURL(join(ROOT, "thincoder-core", rel)).href
const CORE_IO = core("config-io.mjs")

// ─── 假 `node:fs` 视图（registerHooks 短接——唯 config-io.mjs 见之）────────────────
// T-C1b 注入：目标路径的 statSync 二阶读（t1 = 写前重 stat）抬升 mtime ⇒ 真冲突分支（非仿制返回值）。
globalThis.__pkStat = { target: null, n: 0 }
const FS_VIEW_URL = "data:text/javascript," + encodeURIComponent(`
import * as real from "node:fs"
export * from "node:fs"
export function statSync(p, ...rest) {
  const s = real.statSync(p, ...rest)
  const st = globalThis.__pkStat
  if (st && st.target !== null && String(p) === st.target) {
    st.n += 1
    if (st.n >= 2) return { ...s, mtimeMs: s.mtimeMs + 60000 }
  }
  return s
}
`)

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "node:fs" && String(context.parentURL ?? "").endsWith("/thincoder-core/config-io.mjs")) {
      return { url: FS_VIEW_URL, shortCircuit: true }
    }
    return nextResolve(specifier, context)
  },
})

const coreIo = await import(CORE_IO)
const { addProviderEntry, onConfigSelfWrite, _setConfigPathForTest, _resetConfigPathForTest, CONFIG_CONFLICT_HINT } = coreIo
const { chat } = await import(core("provider/core.mjs"))
const { _rateHooks } = await import(core("provider/rate.mjs"))
_rateHooks.sleep = async () => {} // 节奏缝（见档头）

const tmpCfg = (seed) => {
  const dir = mkdtempSync(join(tmpdir(), "pk-guards-core-"))
  const cfg = join(dir, "config.json")
  writeFileSync(cfg, JSON.stringify(seed, null, 2) + "\n")
  return { dir, cfg }
}
const custom = (name) => ({ name, baseURL: "http://127.0.0.1:9/v1", model: "m" })
const byName = (raw, name) => raw.providers.find((p) => p?.name === name)

// ─── T-C1：#1062 单写原子（成功径）───────────────────────────────────────────────

test("T-C1 #1062 单写原子：自写快照恰 1 ∧ 同拍盘面含条目 + apiKey", () => {
  const { cfg } = tmpCfg({ providers: [] })
  _setConfigPathForTest(cfg)
  try {
    const snaps = []
    const off = onConfigSelfWrite(() => snaps.push(readFileSync(cfg, "utf8")))
    const err = addProviderEntry({ custom: custom("alpha"), key: " sk-1 " })
    off()
    assert.equal(err, null, "成功 ⇒ 返回 null")
    assert.equal(snaps.length, 1, `单写：自写快照恰 1 拍（实读 ${snaps.length}）`)
    const entry = byName(JSON.parse(snaps[0]), "alpha")
    assert.ok(entry, "同拍盘面含条目")
    assert.equal(entry.apiKey, "sk-1", "同拍盘面含 trim 后 apiKey")
    const onDisk = byName(JSON.parse(readFileSync(cfg, "utf8")), "alpha")
    assert.equal(onDisk.apiKey, "sk-1", "终态盘面同值")
  } finally {
    _resetConfigPathForTest()
  }
})

// ─── T-C1b：#1062 冲突支（真径注入）──────────────────────────────────────────────

test("T-C1b #1062 冲突支：注入 ⇒ CONFIG_CONFLICT_HINT ∧ 快照 0 ∧ 盘面逐字节不变", () => {
  const seed = JSON.stringify({ providers: [custom("seed")] }, null, 2) + "\n"
  const { dir, cfg } = tmpCfg({ providers: [custom("seed")] })
  writeFileSync(cfg, seed)
  _setConfigPathForTest(cfg)
  try {
    globalThis.__pkStat = { target: cfg, n: 0 }
    const snaps = []
    const off = onConfigSelfWrite(() => snaps.push(readFileSync(cfg, "utf8")))
    const err = addProviderEntry({ custom: custom("beta"), key: "sk-b" })
    off()
    globalThis.__pkStat = { target: null, n: 0 }
    assert.equal(err, CONFIG_CONFLICT_HINT, "冲突 ⇒ 提示串（非 null）")
    assert.equal(snaps.length, 0, "冲突 ⇒ 零写盘（自写快照 0）")
    assert.equal(readFileSync(cfg, "utf8"), seed, "盘面逐字节不变（条目 ∥ 钥俱不落）")
    assert.equal(readdirSync(dir).filter((f) => f.startsWith("config.json.bak-")).length, 1, "冲突留现场 `.bak` 恰 1")
  } finally {
    globalThis.__pkStat = { target: null, n: 0 }
    _resetConfigPathForTest()
  }
})

// ─── T-C2：#1062 键语义回归 ──────────────────────────────────────────────────────

test("T-C2 #1062 键语义回归：' sk ' ⇒ trim；空 ∥ 全空白 ⇒ 无 apiKey 键", () => {
  const { cfg } = tmpCfg({})
  _setConfigPathForTest(cfg)
  try {
    assert.equal(addProviderEntry({ custom: custom("k1"), key: " sk " }), null)
    assert.equal(addProviderEntry({ custom: custom("k2"), key: "" }), null)
    assert.equal(addProviderEntry({ custom: custom("k3"), key: "   " }), null)
    const raw = JSON.parse(readFileSync(cfg, "utf8"))
    assert.equal(byName(raw, "k1").apiKey, "sk", "' sk ' ⇒ 落 trim 值")
    assert.ok(!Object.hasOwn(byName(raw, "k2"), "apiKey"), "空串 ⇒ 无 apiKey 键")
    assert.ok(!Object.hasOwn(byName(raw, "k3"), "apiKey"), "全空白 ⇒ 无 apiKey 键")
  } finally {
    _resetConfigPathForTest()
  }
})

// ─── T-G1 ∥ T-G2 ∥ T-G3：#1063 缺钥守卫（四 format）─────────────────────────────

const FORMATS = [
  { label: "openai", format: undefined },
  { label: "anthropic", format: "anthropic" },
  { label: "google", format: "google" },
  { label: "responses", format: "responses" },
]
const mkProvider = (fmt, apiKey) => ({
  name: "alpha", baseURL: "http://127.0.0.1:9/v1", model: "m",
  ...(fmt.format ? { format: fmt.format } : {}),
  ...(apiKey !== undefined ? { apiKey } : {}),
})

/** fetch 计数桩（本批三腿共用）：记录每次调用；拒联网。 */
function stubFetch() {
  const calls = []
  const orig = globalThis.fetch
  globalThis.fetch = async (...args) => { calls.push(args); throw new Error("stub-net") }
  return { calls, restore: () => { globalThis.fetch = orig } }
}

for (const fmt of FORMATS) {
  test(`T-G1 #1063 ${fmt.label}：无钥 ⇒ 拒含 API key missing for provider ∧ fetch 0`, async () => {
    const { calls, restore } = stubFetch()
    try {
      await assert.rejects(
        chat(mkProvider(fmt), { messages: [{ role: "user", content: "hi" }] }),
        (e) => e.message.includes("API key missing for provider") && e.message.includes('"alpha"'),
        "可读错误（前缀 + 渠道名）",
      )
      assert.equal(calls.length, 0, `零请求（fetch 调用数 ${calls.length}）`)
    } finally { restore() }
  })
}

for (const fmt of FORMATS) {
  test(`T-G2 #1063 ${fmt.label}：全空白钥同判 ⇒ 拒 ∧ fetch 0`, async () => {
    const { calls, restore } = stubFetch()
    try {
      await assert.rejects(
        chat(mkProvider(fmt, "   "), { messages: [{ role: "user", content: "hi" }] }),
        (e) => e.message.includes("API key missing for provider"),
        "全空白钥同判",
      )
      assert.equal(calls.length, 0, `零请求（fetch 调用数 ${calls.length}）`)
    } finally { restore() }
  })
}

for (const fmt of FORMATS) {
  test(`T-G3 #1063 ${fmt.label}：有钥负控 ⇒ 守卫放行 fetch 被调`, async () => {
    const { calls, restore } = stubFetch()
    try {
      await assert.rejects(
        chat(mkProvider(fmt, "sk-live"), { messages: [{ role: "user", content: "hi" }] }),
        (e) => !e.message.includes("API key missing for provider"),
        "非守卫拒否（网络栈拒否）",
      )
      assert.ok(calls.length >= 1, `守卫放行 ⇒ fetch 被调（实读 ${calls.length}）`)
    } finally { restore() }
  })
}
