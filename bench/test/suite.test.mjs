/**
 * test/suite.test.mjs — 题集注册表自检（id 唯一 / 类覆盖 / 隐藏用例 3–5）+ 双数据档 schema。
 * 手动跑：`node --test bench/test/*.test.mjs`（不进 CI —— AC-8）。
 */

import assert from "node:assert/strict"
import { mkdtempSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { test } from "node:test"
import {
  AXES, CAPABILITY_SELECTOR, CASES, DIMENSIONS, DIM_LABELS, MANUAL, MANUAL_DIM, SUITE_VERSION, casesForDims,
} from "../cases/index.mjs"
import { CODE_ASSERTS } from "../cases/code.mjs"
import { loadRoster, selectEntries } from "../lib/roster.mjs"
import { loadPrices } from "../lib/prices.mjs"

const BENCH_DIR = dirname(dirname(fileURLToPath(import.meta.url)))
const counts = (list, key) => list.reduce((acc, x) => ({ ...acc, [x[key]]: (acc[x[key]] ?? 0) + 1 }), {})

test("SUITE_VERSION = 单源整数（KD-2）", () => {
  assert.equal(Number.isInteger(SUITE_VERSION), true)
  assert.ok(SUITE_VERSION >= 1)
})

test("用例 id 全局唯一、与维度一致；8 自动维齐；共 25 例", () => {
  assert.equal(CASES.length, 25, "设计 §1.4：自动判分 25 例")
  const ids = CASES.map((c) => c.id)
  assert.equal(new Set(ids).size, ids.length, "id 必须唯一")
  for (const c of CASES) {
    assert.equal(c.id.split(".")[0], c.dim, `${c.id} 的 id 前缀应等于维度`)
    assert.ok(DIMENSIONS.includes(c.dim), `未知维度 ${c.dim}`)
  }
  assert.deepEqual([...new Set(CASES.map((c) => c.dim))].sort(), [...DIMENSIONS].sort(), "每个自动维都要有用例")
  assert.equal(DIMENSIONS.length, 8)
  assert.equal(AXES.length, 2)
  assert.equal(CAPABILITY_SELECTOR, "capability")
  assert.equal(DIM_LABELS[MANUAL_DIM] !== undefined, true)
})

test("类覆盖：每维 正常/边界/错误 各 ≥1（tool 维 2/1/1，§1.4）", () => {
  const expected = {
    reasoning: { normal: 1, boundary: 1, error: 1 },
    code: { normal: 1, boundary: 1, error: 1 },
    json: { normal: 1, boundary: 1, error: 1 },
    tools: { normal: 2, boundary: 1, error: 1 },
    instructions: { normal: 1, boundary: 1, error: 1 },
    multiturn: { normal: 1, boundary: 1, error: 1 },
    longctx: { normal: 1, boundary: 1, error: 1 },
    vision: { normal: 1, boundary: 1, error: 1 },
  }
  for (const dim of DIMENSIONS) {
    const got = counts(CASES.filter((c) => c.dim === dim), "class")
    assert.deepEqual(got, expected[dim], `${dim} 的类覆盖不符`)
  }
})

test("用例对象字段（§2.6 冻结）：prompt / callOpts / grade 齐；build 可选", () => {
  for (const c of CASES) {
    assert.equal(typeof c.prompt, "string")
    assert.ok(c.prompt.length > 0, `${c.id} 题面为空`)
    assert.equal(typeof c.grade, "function", `${c.id} 缺判分函数`)
    assert.equal(typeof c.callOpts, "object")
    assert.ok(c.build === null || c.build === undefined || typeof c.build === "function")
    assert.ok(["normal", "boundary", "error"].includes(c.class))
  }
})

test("隐藏用例纪律（AC-5 / KD-3）：code 三例各 3–5 条隐藏断言，题面零泄漏", () => {
  for (const id of ["code.1", "code.2", "code.3"]) {
    const n = (CODE_ASSERTS[id].match(/__check\(/g) ?? []).length
    assert.ok(n >= 3 && n <= 5, `${id} 隐藏断言 ${n} 条（须 3–5）`)
    const caseObj = CASES.find((c) => c.id === id)
    assert.ok(!caseObj.prompt.includes("__check"), `${id} 题面泄漏隐藏断言`)
    assert.ok(!caseObj.prompt.includes("隐藏"), `${id} 题面提及隐藏用例`)
  }
})

test("人工 lane：3 条、无判分函数（AC-6 结构判据）、不入能力矩阵", () => {
  assert.equal(MANUAL.length, 3)
  for (const m of MANUAL) {
    assert.equal(typeof m.promptId, "string")
    assert.equal(typeof m.prompt, "string")
    assert.equal("grade" in m, false, "人工 lane 不得携带判分函数")
  }
  assert.equal(DIMENSIONS.includes(MANUAL_DIM), false, "manual 不是自动维度（`capability` 不含它）")
  assert.equal(casesForDims(new Set(DIMENSIONS)).length, CASES.length)
})

test("题面逐字冻结（抽检三例：改题须 SUITE_VERSION + 1）", () => {
  const prompt = (id) => CASES.find((c) => c.id === id).prompt
  assert.equal(prompt("reasoning.1"), "不使用计算器，计算 7^123 的个位数。只回答一个数字。")
  assert.equal(prompt("tools.3"), "请回答：一年有几个月？")
  assert.equal(prompt("longctx.3").includes("只回答数字"), true)
  assert.equal(MANUAL.find((m) => m.promptId === "manual.1").prompt, "最近怎么样？")
})

test("models.json：schema 通过；条目可解析；label 文件名安全", () => {
  const roster = loadRoster(join(BENCH_DIR, "models.json"))
  assert.ok(roster.models.length >= 1)
  for (const m of roster.models) {
    assert.match(m.label, /^[A-Za-z0-9][A-Za-z0-9._-]*$/)
    assert.ok(m.provider.length > 0 && m.model.length > 0)
  }
  const one = selectEntries(roster, roster.models[0].label)
  assert.equal(one.length, 1)
  const byKey = selectEntries(roster, `${roster.models[0].provider}:${roster.models[0].model}`)
  assert.equal(byKey[0].label, roster.models[0].label)
  assert.throws(() => selectEntries(roster, "no-such-model"), /未知模型/)
})

test("models.json：schema fail-closed（label 非法 / provider 缺失 / 未知维度 ⇒ 装载即拒）", () => {
  const dir = mkdtempSync(join(tmpdir(), "bench-roster-"))
  const write = (name, obj) => {
    const p = join(dir, name)
    writeFileSync(p, JSON.stringify(obj), "utf8")
    return p
  }
  assert.throws(() => loadRoster(write("a.json", { models: [{ label: "bad label", provider: "p", model: "m" }] })), /label 非法/)
  assert.throws(() => loadRoster(write("b.json", { models: [{ label: "ok", model: "m" }] })), /provider 缺失/)
  assert.throws(() => loadRoster(write("c.json", { models: [{ label: "ok", provider: "p", model: "m", dims: ["nope"] }] })), /未知维度/)
  assert.throws(() => loadRoster(write("d.json", { models: [] })), /非空数组/)
})

test("prices.json：schema 通过；每条可回溯（asOf + source）；单位 = 元/百万 token", () => {
  const prices = loadPrices(join(BENCH_DIR, "prices.json"))
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

test("dry-run 夹具覆盖：25 例 + 3 人工条各有一段固定响应脚本（防题集增例后静默耗尽）", async () => {
  const { FIXTURE } = await import("../run.mjs")
  const missing = CASES.filter((c) => !Array.isArray(FIXTURE[c.id]) || FIXTURE[c.id].length === 0).map((c) => c.id)
  assert.deepEqual(missing, [], `以下用例缺 dry-run 夹具：${missing.join(", ")}`)
  for (const m of MANUAL) {
    assert.ok(Array.isArray(FIXTURE.manual?.[m.promptId]) && FIXTURE.manual[m.promptId].length > 0, `${m.promptId} 缺夹具`)
  }
})

test("prices.json：无孤儿条目（每条价格至少命中一个在册条目——对齐键 provider:model）", () => {
  const roster = loadRoster(join(BENCH_DIR, "models.json"))
  const prices = loadPrices(join(BENCH_DIR, "prices.json"))
  const key = (m) => `${m.provider}:${m.model}`
  const hit = (pattern, k) => {
    if (pattern === k) return true
    if (!pattern.includes("*")) return false
    return new RegExp(`^${pattern.split("*").map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join(".*")}$`).test(k)
  }
  const orphans = prices.entries.filter((e) => !roster.models.some((m) => hit(e.match, key(m)))).map((e) => e.match)
  assert.deepEqual(orphans, [], `以下价格条目命不中任何在册模型（孤儿数据）：${orphans.join(", ")}`)
})
