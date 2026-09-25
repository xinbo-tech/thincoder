/**
 * model-specs-cleanup.test.mjs — 八条清理批规格面锚（批 `2026-09-25-model-specs-cleanup` ·
 * 设计 `docs/core/design/MODEL-SPECS.md` §14；用例 C-1..C-4）。
 *
 * 拆分载体（§14.6）：主档 `model-specs.test.mjs`（477 行 / 500 硬限余量 23）承载 AC-2 零字面门
 * （T-13:250-262 就地改形）与 AC-8 锚（F-3:451 = 131_072 ∧ FAMILY_BASELINE `glm-5.3` 128_000 冻结）
 * ——**均不在本档**（§14.7 载明）；AC-1 锚（C-1..C-4）落本新档，循 `-mimo` / `-qwen36` / `-bench`
 * 载体先例。断言面 = 行为面（`specMatch` / `specForModel` 返回形状 + 显式字段值）+ C-2 行注标级词
 * （行注即交付物本体——`-bench` 档 G-3 先例）。helpers 就地重定义、零 import 主测试档。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { specForModel, specMatch } from "../model-specs.mjs"

/** §1.7.1 父侧交付读数 = AC-1 基准面：`[context, maxOutput]`。未取到字段 = 零口径 ⇒ 行取兜底值
 *  （context 兜底 128_000 / maxOutput 兜底 32_000——与建行前生效值同值）。 */
const DELIVERED = {
  "gemini-3.1-pro":   [1_048_576, 65_536],  // 多源网络转述级（本机无该渠道）
  "claude-fable-5.1": [1_000_000, 128_000], // 多源网络转述级（本机无该渠道）
  "step-3.7-flash":   [262_144, 32_000],    // context = 转述级（渠道未激活）；maxOutput 未取到 ⇒ 兜底
  "qwen-flash":       [128_000, 32_768],    // maxOutput = 服务端直报；context 未取到 ⇒ 兜底
  "qwen-vl-max":      [128_000, 32_768],    // 同上（thinking 不支持 = 读数不落字段）
}

/** §14.2 #7-9 kimi 三名：`[context, maxOutput, 枚举有无]`。 */
const KIMI_ROWS = {
  "kimi-for-coding":           [1_048_576, 131_072, true],
  "kimi-for-coding-highspeed": [262_144,   131_072, false],
  "k3-256k":                   [262_144,   131_072, true],
}

/** 表行名提取（`["name", {` 形态；行注取自表字面量，取值仍走运行时查表——无散文锚）。 */
const SPEC_SOURCE = readFileSync(new URL("../model-specs.mjs", import.meta.url), "utf8")
const TABLE_ROW_NAMES = [...SPEC_SOURCE.matchAll(/^\s*\["([^"]+)",\s*\{/gm)].map((m) => m[1])

/** 行注提取：该行（或行组）上方紧邻的 `//` 注释块——行组共享注记时允许跳过中间的表行。 */
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
  assert.ok(note.length > 0, `${name} 行注在场（证据等级须落行注）`)
  return note.join("\n")
}

/** 静音查表（未知名会打 `warnUnknownModel` 一次——退化形状用例无需该噪声）。 */
function silent(fn) {
  const orig = console.warn
  console.warn = () => {}
  try { return fn() } finally { console.warn = orig }
}

test("[cleanup] C-1 五名命中专行（非兜底）：context / maxOutput = §1.7.1 交付读数逐字段", () => {
  for (const [name, [context, maxOutput]] of Object.entries(DELIVERED)) {
    const r = specMatch(name)
    assert.equal(r.matched, true, `${name} 命中专行（建行前 = DEFAULT_SPEC 兜底）`)
    assert.equal(r.spec.context, context, `${name}.context = 交付读数`)
    assert.equal(r.spec.maxOutput, maxOutput, `${name}.maxOutput = 交付读数`)
    assert.ok(TABLE_ROW_NAMES.includes(name), `表行名提取含 ${name}（防空扫正控）`)
  }
})

test("[cleanup] C-2 kimi 三名分行：尺寸逐值 + 枚举有无 + 行注标级 / 默认档记录", () => {
  for (const [name, [context, maxOutput, hasEnum]] of Object.entries(KIMI_ROWS)) {
    const spec = specForModel(name)
    assert.ok(TABLE_ROW_NAMES.includes(name), `表行名提取含 ${name}（防空扫正控）`)
    assert.equal(spec.context, context, `${name}.context = §1.4 活测`)
    assert.equal(spec.maxOutput, maxOutput, `${name}.maxOutput = 族沿用 k3 行`)
    assert.equal("reasoningEffortEnum" in spec, hasEnum, `${name} 枚举有无（highspeed = 活测无 effort 块）`)
    if (hasEnum) assert.deepEqual(spec.reasoningEffortEnum, ["low", "high", "max"], `${name} 枚举三值`)
  }
  // 无 effort 块行 = 零口径 ⇒ thinking 同不声明（§14.3：枚举/默认/机制位均不声明）
  assert.equal("thinking" in specForModel("kimi-for-coding-highspeed"), false, "highspeed thinking 不声明")
  // 行注标级面（§14.3 口径表）：族沿用点名来源行 + 默认档记录（生效面 = 端差表，VSC 侧 E-5 判据）
  const note = rowNote("kimi-for-coding")
  for (const w of ["族沿用 k3 行", "默认档 max（kimi-for-coding）", "high（k3-256k）"]) {
    assert.ok(note.includes(w), `行注含「${w}」（§14.3 标级 / 默认档记录）`)
  }
  assert.ok(rowNote("kimi-for-coding-highspeed").includes("无 effort 块"), "尺寸行注标「无 effort 块」")
})

test("[cleanup] C-3 近名三值分行（防合并）：k3 ≠ kimi-for-coding-highspeed ≠ kimi-k2.7-code-highspeed", () => {
  const CONTEXTS = { "k3": 1_000_000, "kimi-for-coding-highspeed": 262_144, "kimi-k2.7-code-highspeed": 128_000 }
  const objs = []
  for (const [name, context] of Object.entries(CONTEXTS)) {
    const r = specMatch(name)
    assert.equal(r.matched, true, `${name} 命中自身行`)
    assert.equal(r.spec.context, context, `${name}.context 分行值`)
    objs.push(r.spec)
  }
  assert.equal(new Set(objs).size, 3, "三行非同一对象（合并 ⇒ 红）")
})

test("[cleanup] C-4 未知名落 DEFAULT_SPEC（兜底语义零改）+ grok-4.7/4.8 泛前缀记证面", () => {
  const miss = silent(() => specMatch("zzz-not-a-registered-model-2026"))
  assert.equal(miss.matched, false, "未知名 = 兜底（matched:false）")
  assert.deepEqual(miss.spec, { context: 128_000, maxOutput: 32_000 }, "DEFAULT_SPEC 兜底值零改")
  // §1.7.1 实测裁定「相符」⇒ grok-4.7/4.8 维持泛前缀（记证零改）：仍命中 grok-4 行（非兜底）
  for (const n of ["grok-4.7", "grok-4.8"]) {
    const r = specMatch(n)
    assert.equal(r.matched, true, `${n} 命中 grok-4 泛前缀行（实测相符分支）`)
    assert.equal(r.spec.context, 500_000, `${n}.context = 实测 500_000（与泛前缀行相符）`)
    assert.equal(r.spec.maxOutput, 64_000, `${n}.maxOutput = 泛前缀行值（未取到 = 零口径，不改）`)
  }
})
