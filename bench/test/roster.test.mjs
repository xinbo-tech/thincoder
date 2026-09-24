/**
 * test/roster.test.mjs — 数据面用例（§5.13 `roster.1–3` / `temperature.1`）。
 * 数据档 schema 两测自 `suite.test.mjs` 迁入（越线降载——`suite.test.mjs` 264 行 + 本批新腿 ⇒ 按既有降载先例迁出）；
 * `roster.1` = 名单全量 29 档 + 逐名解析；`roster.2` = `temperature` 字段 schema（含既有 fail-closed 体例）；
 * `roster.3` = 价格键对齐（无孤儿 + 已录价档 `matchPrice` 命中自身键）；`temperature.1` = 温度透传（dry-run）。
 * 夹具与 CLI 驱动在 `test/fixtures.mjs`；手动跑：`node --test "bench/test/*.test.mjs"`（不进 CI）。
 */

import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { after, test } from "node:test"
import { loadRoster, selectEntries } from "../lib/roster.mjs"
import { loadPrices, matchPrice } from "../lib/prices.mjs"
import { loadJudgeConfig } from "../lib/judge.mjs"
import { findFile, readJson, runCli } from "./fixtures.mjs"

const BENCH_DIR = dirname(dirname(fileURLToPath(import.meta.url)))
const ROSTER_PATH = join(BENCH_DIR, "models.json")
const PRICES_PATH = join(BENCH_DIR, "prices.json")
const keyOf = (m) => `${m.provider}:${m.model}`
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

/** 临时 roster 目录（档内统一收尾——`after` 清理；体例同 `fixtures.mjs`）。 */
const tmpDirs = []
const tmpDir = () => {
  const d = mkdtempSync(join(tmpdir(), "bench-roster-"))
  tmpDirs.push(d)
  return d
}
after(() => { for (const d of tmpDirs) rmSync(d, { recursive: true, force: true }) })

/** 本批新增 23 档（§2.3 逐档映射表——label 清单；在册 29 = 现役 6 条 + 新增 23 条）。 */
const ADDED_LABELS = [
  "deepseek-v4-pro", "glm-5.3", "glm-5.3-flashx", "glm-4.5-air",
  "qwen3.8-max", "qwen3.6-plus", "qwen3.6-flash", "qwen3.7-max", "qwen3.7-plus", "qwen3.7-flash",
  "qwen3.8-27b", "qwen3.6-27b", "qwen3.5-27b",
  "kimi-k3", "kimi-k2.6", "kimi-k2.7-code", "kimi-k2.7-code-highspeed",
  "minimax-m3", "minimax-m2.7-highspeed", "hy3",
  "doubao-seed-2-1-pro-260915", "doubao-seed-2-1-turbo-260628", "doubao-seed-2-1-lite-260915",
]

/** 温度例外档（探针实测拒 `temperature: 0` 的四档——KD-31 准入依据；其余档恒缺省 0）。 */
const TEMP_EXCEPTION_LABELS = ["kimi-k3", "kimi-k2.6", "kimi-k2.7-code", "kimi-k2.7-code-highspeed"]

test("roster.1：名单全量 29 档 + 逐名解析（label 与 provider:model 复合引用；大小写异形键）", () => {
  const roster = loadRoster(ROSTER_PATH)
  assert.equal(roster.models.length, 29, "受测名单 = 29 档（现役 6 + 本批新增 23）")
  const labels = roster.models.map((m) => m.label)
  assert.deepEqual(ADDED_LABELS.filter((l) => !labels.includes(l)), [], "本批新增档缺条目")
  for (const m of roster.models) {
    assert.equal(selectEntries(roster, m.label)[0], m, `label 逐名解析失败：${m.label}`)
    assert.equal(selectEntries(roster, keyOf(m))[0], m, `复合引用解析失败：${keyOf(m)}`)
  }
  assert.equal(selectEntries(roster, "minimax:MiniMax-M3")[0].label, "minimax-m3", "model 字面 ≠ label 的档须可按复合引用解析")
  assert.throws(() => selectEntries(roster, "no-such-model"), /未知模型/)
})

test("roster.2：temperature 字段 schema（0–2 有限数字；非法 ⇒ 装载即拒）+ 例外档白名单（数据面）", () => {
  const dir = tmpDir()
  const write = (name, obj) => {
    const p = join(dir, name)
    writeFileSync(p, JSON.stringify(obj), "utf8")
    return p
  }
  const one = (over) => ({ models: [{ label: "ok", provider: "p", model: "m", ...over }] })
  assert.equal(loadRoster(write("t1.json", one({ temperature: 1 }))).models[0].temperature, 1, "例外档 1 合法")
  assert.equal(loadRoster(write("t0.json", one({ temperature: 0 }))).models[0].temperature, 0, "显式 0 合法")
  assert.equal("temperature" in loadRoster(write("tn.json", one({}))).models[0], false, "缺省 ⇒ 不设字段（缺省语义 = 0）")
  assert.equal(loadRoster(write("tnull.json", one({ temperature: null }))).models[0].temperature ?? 0, 0, "显式 null 视为缺省（体例同 dims / skipDims）")
  assert.throws(() => loadRoster(write("t2.json", one({ temperature: "1" }))), /temperature 非法/, "字符串 ⇒ 装载即拒")
  assert.throws(() => loadRoster(write("t3.json", one({ temperature: 3 }))), /temperature 非法/, "越上界（> 2）⇒ 装载即拒")
  assert.throws(() => loadRoster(write("t4.json", one({ temperature: -0.5 }))), /temperature 非法/, "越下界（< 0）⇒ 装载即拒")
  // 既有无温度档 fail-closed 体例（自 suite.test.mjs 迁入）
  assert.throws(() => loadRoster(write("a.json", { models: [{ label: "bad label", provider: "p", model: "m" }] })), /label 非法/)
  assert.throws(() => loadRoster(write("b.json", { models: [{ label: "ok", model: "m" }] })), /provider 缺失/)
  assert.throws(() => loadRoster(write("c.json", { models: [{ label: "ok", provider: "p", model: "m", dims: ["nope"] }] })), /未知维度/)
  assert.throws(() => loadRoster(write("d.json", { models: [] })), /非空数组/)
  // 数据面：例外只对该四档开放（其余档缺省 ⇒ 无例外——仅「API 拒收 0」的档显式开）
  const exceptions = loadRoster(ROSTER_PATH).models.filter((m) => m.temperature != null)
  assert.deepEqual(exceptions.map((m) => m.label).sort(), [...TEMP_EXCEPTION_LABELS].sort(), "温度例外档白名单 = kimi 四档")
  for (const m of exceptions) assert.equal(m.temperature, 1, `${m.label} 例外取值 = 1（探针实测值）`)
})

test("roster.3：价格键对齐（无孤儿 + 已录价档 matchPrice 命中自身键——防大小写 / 错拼）", () => {
  const roster = loadRoster(ROSTER_PATH)
  const prices = loadPrices(PRICES_PATH)
  const cfg = loadJudgeConfig(join(BENCH_DIR, "judge.json"))
  const judgeKeys = [cfg.judges[0], cfg.judges[1], cfg.arbiter].map(keyOf)
  const keys = [...roster.models.map(keyOf), ...judgeKeys]
  const hit = (pattern, k) => {
    if (pattern === k) return true
    if (!pattern.includes("*")) return false
    return new RegExp(`^${pattern.split("*").map(esc).join(".*")}$`).test(k)
  }
  // ① 无孤儿（既有判据）：每条价格至少命中一个在册条目 **或** 任一位判官键
  const orphans = prices.entries.filter((e) => !keys.some((k) => hit(e.match, k))).map((e) => e.match)
  assert.deepEqual(orphans, [], `以下价格条目命不中在册模型或判官键（孤儿数据）：${orphans.join(", ")}`)
  // ② 键命中自身（本批新增腿）：大小写不敏感可命中的键，matchPrice 必须真命中（大小写 / 错拼守卫）
  for (const k of keys) {
    const intended = prices.entries.filter((e) => new RegExp(`^${e.match.split("*").map(esc).join(".*")}$`, "i").test(k))
    if (intended.length === 0) continue
    const [provider, ...rest] = k.split(":")
    const got = matchPrice(prices, provider, rest.join(":"))
    assert.ok(got, `价格键「${k}」存在可命中条目（${intended.map((e) => e.match).join(", ")}），但 matchPrice 未命中——键字面须与名单一致`)
    const exact = intended.find((e) => !e.match.includes("*") && e.match.toLowerCase() === k.toLowerCase())
    if (exact) assert.equal(got.match.toLowerCase(), exact.match.toLowerCase(), `「${k}」须命中自身键条目（大小写 / 错拼）`)
  }
})

test("temperature.1：温度透传（dry-run 全链路）——例外档实际取值 1 · 缺省档 0，零网络", async () => {
  const orig = globalThis.fetch
  let calls = 0
  globalThis.fetch = () => { calls++; throw new Error("network disabled by test") }
  let exc, def
  try {
    exc = await runCli(["--dry-run", "--models", "kimi-k3", "--dims", "reasoning", "--label", `roster-temp-exc-${process.pid}`])
    def = await runCli(["--dry-run", "--models", "deepseek-flash", "--dims", "reasoning", "--label", `roster-temp-def-${process.pid}`])
  } finally { globalThis.fetch = orig }
  assert.equal(exc.code, 0, exc.out)
  assert.equal(def.code, 0, def.out)
  assert.equal(readJson(findFile(`-roster-temp-exc-${process.pid}.json`)).models[0].temperature, 1, "例外档实际取值入档 = 1")
  assert.equal(readJson(findFile(`-roster-temp-def-${process.pid}.json`)).models[0].temperature, 0, "缺省档实际取值入档 = 0")
  assert.equal(calls, 0, "dry-run 全链路零网络（夹具判官 / 复核亦不触网）")
})

test("models.json：schema 通过；条目可解析；label 文件名安全", () => {
  const roster = loadRoster(ROSTER_PATH)
  assert.ok(roster.models.length >= 1)
  for (const m of roster.models) {
    assert.match(m.label, /^[A-Za-z0-9][A-Za-z0-9._-]*$/)
    assert.ok(m.provider.length > 0 && m.model.length > 0)
  }
  const one = selectEntries(roster, roster.models[0].label)
  assert.equal(one.length, 1)
  const byKey = selectEntries(roster, keyOf(roster.models[0]))
  assert.equal(byKey[0].label, roster.models[0].label)
  assert.throws(() => selectEntries(roster, "no-such-model"), /未知模型/)
})

test("prices.json：schema 通过；每条可回溯（asOf + source）；单位 = 元/百万 token", () => {
  const prices = loadPrices(PRICES_PATH)
  assert.equal(prices.currency, "CNY")
  assert.equal(prices.unit, "元 / 百万 token")
  assert.ok(prices.entries.length >= 1)
  for (const e of prices.entries) {
    assert.match(e.match, /^[^:]+:.+$/, `match 须为 provider:model 形态：${e.match}`)
    assert.equal(typeof e.input, "number")
    assert.equal(typeof e.output, "number")
    assert.ok((e.source ?? prices.source).length > 0, `${e.match} 缺 source`)
    assert.match(e.asOf ?? prices.asOf, /^\d{4}-\d{2}-\d{2}$/, `${e.match} 缺 asOf`)
  }
})
