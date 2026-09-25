/**
 * model-specs-bench.test.mjs — bench 名单面 14 档规格行补齐（批 `2026-09-24-bench-params-judge` ·
 * 设计 `docs/core/design/MODEL-SPECS.md` §13 · 用例 G-1..G-7——标题带 `[bench-specs]` 打标）。
 *
 * 拆分载体（§13.6 / §13.8）：主测试档（`model-specs.test.mjs`，477 行）500 硬限余量仅 23 行，
 * G-1..G-7 新增锚必越限（core-hygiene T-C14）⇒ 本批用例落本新档
 * （先例 `model-specs-mimo.test.mjs` / `model-specs-qwen36.test.mjs`）。断言面 = 行为面
 * （`specMatch` / `specForModel` 返回形状 + 显式字段值）+ **行注证据等级词**（G-3——行注即交付物本体）。
 * helpers 就地重定义、零 import 主测试档（主档无导出面——§13 实施约束）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { specForModel, specMatch } from "../model-specs.mjs"

/** §13.2 #1–#10：本批新建 10 行（`MiniMax-M2.7` = 前缀行——覆盖标准档与 `-highspeed`）。 */
const NEW_ROWS = [
  "glm-4.5-air",
  "qwen3.7-plus", "qwen3.5-27b",
  "kimi-k2.6", "kimi-k2.7-code", "kimi-k2.7-code-highspeed",
  "doubao-seed-2-1-pro-260915", "doubao-seed-2-1-turbo-260628", "doubao-seed-2-1-lite-260915",
  "MiniMax-M2.7",
]

/** §13.3 字段口径表（新建行逐字段登记值；`reasoningEffortEnum` / `multimodal` 不在此列——另有分态腿）。
 *  信息性字段（原以运行时合成针登记）已随清理批整体删除（`docs/core/design/MODEL-SPECS.md` §14.2 #11）
 *  ⇒ 本表去键（取值断言随字段一起撤出；其字面归零由主档 `model-specs.test.mjs` T-13 门作唯一权威）。 */
const FIELDS = {
  "glm-4.5-air": { context: 128_000, maxOutput: 32_000, thinking: true, thinkApi: "type", reasoningEcho: "optional", tempRange: [0, 1], noUsageStream: true },
  "qwen3.7-plus": { context: 1_000_000, maxOutput: 131_072, thinking: true, partialMode: true, thinkApi: "effort", tempRange: [0, 2] },
  "qwen3.5-27b": { context: 262_144, maxOutput: 65_536, thinking: true, partialMode: true, thinkApi: "effort", tempRange: [0, 2] },
  "kimi-k2.6": { context: 128_000, maxOutput: 32_000 },
  "kimi-k2.7-code": { context: 128_000, maxOutput: 32_000 },
  "kimi-k2.7-code-highspeed": { context: 128_000, maxOutput: 32_000 },
  "doubao-seed-2-1-pro-260915": { context: 256_000, maxOutput: 524_288, thinking: true, thinkApi: "effort" },
  "doubao-seed-2-1-turbo-260628": { context: 256_000, maxOutput: 524_288, thinking: true, thinkApi: "effort" },
  "doubao-seed-2-1-lite-260915": { context: 256_000, maxOutput: 524_288, thinking: true, thinkApi: "effort" },
  "MiniMax-M2.7": { context: 256_000, maxOutput: 128_000, thinking: true, noUsageStream: true },
}

/** §13.2 #4–#10 的「尺寸 / 枚举未取证」面（G-3 词面）。 */
const UNPROBED = ["glm-4.5-air", "kimi-k2.6", "kimi-k2.7-code", "kimi-k2.7-code-highspeed", "doubao-seed-2-1-pro-260915", "doubao-seed-2-1-turbo-260628", "doubao-seed-2-1-lite-260915", "MiniMax-M2.7"]

/** 表行名提取（`["name", {` 形态；行注 / 行名取自表字面量，取值仍走运行时查表——无散文锚）。 */
const SPEC_SOURCE = readFileSync(new URL("../model-specs.mjs", import.meta.url), "utf8")
const TABLE_ROW_NAMES = [...SPEC_SOURCE.matchAll(/^\s*\["([^"]+)",\s*\{/gm)].map((m) => m[1])

/** 行注提取：该行（或行组）上方紧邻的 `//` 注释块——行组共享注记时允许跳过中间的表行（§13.3 三行同形组）。 */
function rowNote(name) {
  const lines = SPEC_SOURCE.split("\n")
  const at = lines.findIndex((l) => l.trimStart().startsWith(`["${name}",`))
  assert.ok(at > 0, `表内存在 ${name} 行（防空扫）`)
  const note = []
  for (let i = at - 1; i >= 0; i--) {
    const l = lines[i]
    if (l.trimStart().startsWith("//")) note.unshift(l)
    else if (/^\s*\["/.test(l)) continue
    else break
  }
  assert.ok(note.length > 0, `${name} 行注在场（§13.3：证据等级须落行注）`)
  return note.join("\n")
}

/** 静音查表（未知名会打 `warnUnknownModel` 一次——本档测退化形状时无需该噪声）。 */
function silent(fn) {
  const orig = console.warn
  console.warn = () => {}
  try { return fn() } finally { console.warn = orig }
}

test("[bench-specs] G-1 十个新建名逐名命中独立行（非兜底）+ 表行名提取含全 10 名", () => {
  for (const name of NEW_ROWS) assert.equal(specMatch(name).matched, true, `${name} 命中独立行（非兜底）`)
  assert.equal(specMatch("MiniMax-M2.7-highspeed").matched, true, "前缀行覆盖 bench 名单实际字面（-highspeed）")
  const missing = NEW_ROWS.filter((n) => !TABLE_ROW_NAMES.includes(n))
  assert.deepEqual(missing, [], `表行名提取缺：${missing.join(", ")}`)
  assert.ok(TABLE_ROW_NAMES.length >= 50, `扫描须命中全表（防正则空扫）：实命中 ${TABLE_ROW_NAMES.length} 行`)
})

test("[bench-specs] G-2 逐名关键字段 = §13.3 口径表；doubao 三行枚举七值 + maxOutput 524_288", () => {
  for (const [name, fields] of Object.entries(FIELDS)) {
    const spec = specForModel(name)
    for (const [k, v] of Object.entries(fields)) assert.deepEqual(spec[k], v, `${name}.${k} = §13.3 登记值`)
  }
  // 视觉面：新建 10 行一律 **不声明**（未探不声明——T-7 语义单一）
  for (const name of NEW_ROWS) assert.equal(specForModel(name).multimodal, undefined, `${name} 不声明 multimodal（未探）`)
  // 枚举面分态：doubao 三行 = 七值（受理级）；其余新建行不声明
  const SEVEN = ["none", "minimal", "low", "medium", "high", "xhigh", "max"]
  for (const name of NEW_ROWS.filter((n) => n.startsWith("doubao"))) {
    assert.deepEqual(specForModel(name).reasoningEffortEnum, SEVEN, `${name} 枚举 = 七值（受理级）`)
  }
  for (const name of NEW_ROWS.filter((n) => !n.startsWith("doubao") && !n.startsWith("kimi"))) {
    assert.equal(specForModel(name).reasoningEffortEnum, undefined, `${name} 枚举不声明（未探 / 无生效面）`)
  }
  for (const name of ["kimi-k2.6", "kimi-k2.7-code", "kimi-k2.7-code-highspeed"]) {
    assert.equal(specForModel(name).reasoningEffortEnum, undefined, `${name} 枚举不声明（未探）`)
  }
})

test("[bench-specs] G-3 行注证据等级：未探 / 未取证字面 + 按 §13.3 在位（实测 / 官方口径 / 族沿用 / 受理级 / 校验级）", () => {
  for (const name of UNPROBED) {
    const note = rowNote(name)
    assert.ok(note.includes("未探") || note.includes("未取证"), `${name} 行注含「未探 / 未取证」字面`)
  }
  const WORDS = {
    "glm-4.5-air": ["实测", "族沿用"],
    "qwen3.7-plus": ["官方口径", "族沿用"],
    "qwen3.5-27b": ["官方口径", "族沿用"],
    "kimi-k2.6": ["校验级", "未取证"],
    "kimi-k2.7-code": ["校验级", "未取证"],
    "kimi-k2.7-code-highspeed": ["校验级", "未取证"],
    "doubao-seed-2-1-pro-260915": ["实测", "受理级", "上限未证"],
    "doubao-seed-2-1-turbo-260628": ["实测", "受理级"],
    "doubao-seed-2-1-lite-260915": ["实测", "受理级"],
    "MiniMax-M2.7": ["实测", "族沿用", "未找到"],
  }
  for (const [name, words] of Object.entries(WORDS)) {
    const note = rowNote(name)
    for (const w of words) assert.ok(note.includes(w), `${name} 行注含「${w}」`)
  }
})

test("[bench-specs] G-4 KD-31 例外档不变量：kimi 三行 `tempRange === undefined`（入档值 = 实发值）", () => {
  for (const name of ["kimi-k2.6", "kimi-k2.7-code", "kimi-k2.7-code-highspeed"]) {
    assert.equal(specForModel(name).tempRange, undefined, `${name} 不得声明 tempRange（核裁剪 ⇒ 入档值 ≠ 实发值）`)
  }
})

test("[bench-specs] G-5 退化锚改指 + 建行命中：qwen3.7-plus 走自身行；仍在兜底的名字保留退化形状", () => {
  assert.equal(specMatch("qwen3.7-plus").matched, true, "建行命中（原退化样本——§13.8 G-5）")
  assert.equal(specForModel("qwen3.7-plus").context, 1_000_000, "context = 官方口径 1M（≠ 128K 兜底）")
  const fallback = silent(() => specForModel("qwen3.5-flash"))
  assert.equal(fallback.context, 128_000, "仍在兜底的名字 ⇒ 退化形状 128K（T-4/A-14 改指样本）")
  assert.equal(fallback.maxOutput, 32_000, "退化形状 = 32K")
  assert.equal(fallback.multimodal, undefined, "退化形状 = 无视觉")
  assert.equal(fallback.reasoningEffortEnum, undefined, "退化形状 = 无枚举")
})

test("[bench-specs] G-6 视觉声明分态：实测无视觉两档（拒图像 / 不识图）+ 未探两档（不声明 + 行注标级）", () => {
  for (const name of ["qwen3.7-max", "hy3"]) {
    assert.equal(specForModel(name).multimodal, undefined, `${name} 不声明 multimodal（T-7 语义单一）`)
    const note = rowNote(name)
    assert.ok(note.includes("拒图像") || note.includes("不识图"), `${name} 行注含实测理由（拒图像 / 不识图）`)
  }
  for (const name of ["deepseek-v4-pro", "glm-5.3"]) {
    assert.equal(specForModel(name).multimodal, undefined, `${name} 不声明（视觉面未探——补探登记 §13.4）`)
    assert.ok(rowNote(name).includes("未探"), `${name} 行注含「未探」`)
  }
})

/** §1.3 既有族基线（每族一代表名 × 行为面字段）——与主档 `[qwen] T-11` 同清单（防误删误改行）。 */
const FAMILY_BASELINE = [
  ["deepseek-flash", { context: 1_000_000, maxOutput: 384_000, thinking: true, prefixMode: true, thinkApi: "type", reasoningEcho: "required", reasoningEffortEnum: ["low", "high", "max"], tempRange: [0, 2], multimodal: true }],
  ["kimi-k3", { context: 1_000_000, maxOutput: 131_072, thinking: true, partialMode: true, multimodal: true, thinkApi: "effort", reasoningEcho: "required", reasoningEffortEnum: ["low", "high", "max"] }],
  ["glm-5.3", { context: 1_000_000, maxOutput: 128_000, thinking: true, thinkApi: "type", reasoningEcho: "optional", reasoningEffortEnum: ["low", "high", "max"], tempRange: [0, 1], noUsageStream: true }],
  ["gpt-4o", { context: 128_000, maxOutput: 16_000, thinking: false, multimodal: true }],
  ["MiniMax-M3", { context: 1_000_000, maxOutput: 128_000, thinking: true, multimodal: true, thinkApi: "type", thinkEnabledValue: "adaptive", tempRange: [0, 2], noUsageStream: true }],
  ["mimo-v2.5", { context: 1_000_000, maxOutput: 131_072, thinking: true, multimodal: true, thinkApi: "type", reasoningEcho: "required", tempRange: [0, 1.5] }],
]

test("[bench-specs] G-7 既有族零回归：六族代表名字段逐项不变（防误删误改行）", () => {
  for (const [name, fields] of FAMILY_BASELINE) {
    const spec = specForModel(name)
    for (const [k, v] of Object.entries(fields)) assert.deepEqual(spec[k], v, `${name}.${k} 零改`)
  }
})
