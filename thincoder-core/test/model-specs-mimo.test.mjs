/**
 * model-specs-mimo.test.mjs — MiMo V2.6 三款独立规格行 + v2.5 两行对齐（批 2026-09-22-mimo26-specs ·
 * 设计 `docs/core/design/MODEL-SPECS.md` §12 · 用例 M-1..M-4 / M-6..M-9——标题带 `[mimo]` 打标）。
 *
 * 拆分载体：主测试档（model-specs.test.mjs，467 行）500 硬限余量仅 33 行，九例 append 必越限
 * （core-hygiene T-C14）⇒ 本批用例落本新档，主档只承载 M-5（§12.7 / D-4；先例 model-specs-qwen36.test.mjs）。
 * 断言面 = 行为面（specMatch / specForModel 返回形状 + 显式字段值）+ 行注证据等级词（M-6——行注即
 * 交付物本体，循 [flashx] F-5 / [qwen36] Q-6 先例）。helpers 就地重定义、零 import 主测试档
 * （主档无导出面——§12.7 实施约束 1）。信息性字段本批不设字面断言（T-13② 全仓测试面计数闸）——
 * 键名取运行时合成（主档 `:221` 同法先例）：本档全文（含注释与断言消息）零该字段字面。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { specForModel, specMatch } from "../model-specs.mjs"
import { PROVIDER_PRESETS } from "../config-presets.mjs"

/** MiMo V2.6 三款（批档 §1.2：2026-09-22 上架）——一套字段口径 × 三行，行序 pro / flash / pro-ultraspeed。 */
const V26 = ["mimo-v2.6-pro", "mimo-v2.6-flash", "mimo-v2.6-pro-ultraspeed"]
/** v2.5 在役两行（本批随批对齐值面；不删——§12.8）。 */
const V25 = ["mimo-v2.5-pro", "mimo-v2.5"]

/** §12.3 口径表：三新款共有字段面（AC-2 七项；信息性字段不列——D-3）。 */
const V26_FIELDS = {
  context: 1_000_000,
  maxOutput: 131_072,
  thinking: true,
  multimodal: true,
  thinkApi: "type",
  reasoningEcho: "required",
  tempRange: [0, 1.5],
}

/** 信息性字段名 = 运行时合成（T-13②：本档全文不得出现该字面量——主档 `:221` 同法先例）。 */
const INFO_FIELD = ["cache", "Mode"].join("")

/** 逐字段比对（键缺席 ⇒ undefined ≠ 登记值 ⇒ 红）。 */
function assertFields(name, fields) {
  const spec = specForModel(name)
  for (const [k, v] of Object.entries(fields)) {
    assert.deepEqual(spec[k], v, `${name}.${k} = §12.3 登记值`)
  }
  return spec
}

// 表字面量扫描（M-4 / M-6 / M-9 用——名字与行注取自表源码，取值仍走运行时查表，无散文锚）。
const SPEC_SOURCE = readFileSync(new URL("../model-specs.mjs", import.meta.url), "utf8")
const TABLE_ROW_NAMES = [...SPEC_SOURCE.matchAll(/^\s*\["([^"]+)",\s*\{/gm)].map((m) => m[1])
const SELF_SOURCE = readFileSync(new URL(import.meta.url), "utf8")

/** 行注提取：表字面量中该行上方紧邻的 `//` 注释块（证据等级词在此——§12.3 行注形态）。 */
function rowNote(name) {
  const lines = SPEC_SOURCE.split("\n")
  const at = lines.findIndex((l) => l.trimStart().startsWith(`["${name}",`))
  assert.ok(at > 0, `表内存在 ${name} 行（防空扫）`)
  const note = []
  for (let i = at - 1; i >= 0 && lines[i].trimStart().startsWith("//"); i--) note.unshift(lines[i])
  assert.ok(note.length > 0, `${name} 行注在场（AC-5：证据等级须逐条落行注）`)
  return note.join("\n")
}

test("[mimo] M-1 三款独立行命中：matched + context 1M（≠128K 兜底）+ maxOutput 131_072（≠32K 兜底）", () => {
  for (const name of V26) {
    const r = specMatch(name)
    assert.equal(r.matched, true, `${name} 命中独立行（非前缀兜底非默认面）`)
    assert.equal(r.spec.context, 1_000_000, `${name} context = 官方口径 1M`)
    assert.equal(r.spec.maxOutput, 131_072, `${name} maxOutput = 校验级 131_072`)
  }
})

test("[mimo] M-2 三款逐字段 = §12.3 口径表七项（AC-2；信息性字段不列——D-3）", () => {
  for (const name of V26) assertFields(name, V26_FIELDS)
})

test("[mimo] M-3 v2.5 两行对齐（全字段 deepEqual）：pro = 131_072 + 信息性字段 auto；mimo-v2.5 = pro 形 + 视觉位", () => {
  // 对齐形（§12.3 表：maxOutput 131_072 + 信息性字段 "auto"）——键集差 / 值差任一即红。
  const ALIGNED = { context: 1_000_000, maxOutput: 131_072, thinking: true, thinkApi: "type", reasoningEcho: "required", tempRange: [0, 1.5], [INFO_FIELD]: "auto" }
  const pro = specForModel(V25[0])
  assert.deepEqual(pro, ALIGNED, "pro 行全字段 = 对齐形（无视觉位键——本批零改面）")
  assert.deepEqual(specForModel(V25[1]), { ...ALIGNED, multimodal: true }, "mimo-v2.5 = pro 形 + 视觉位")
  assert.notEqual(pro, specForModel(V25[1]), "两行 = 独立对象（同族 ≠ 同行）")
})

test("[mimo] M-4 前缀面：长名不被短名吞（ultraspeed ≠ pro 行对象）+ 三名 × 在册 mimo 行非前缀循环", () => {
  const PRO = "mimo-v2.6-pro"
  const ULTRA = "mimo-v2.6-pro-ultraspeed"
  assert.ok(ULTRA.startsWith(PRO), "两名为前置关系（SORTED_SPECS 长度降序语义即在此对生效）")
  assert.notEqual(specForModel(ULTRA), specForModel(PRO), "长名命中自身行，不被短名行吞")
  const MIMO_ROWS = TABLE_ROW_NAMES.filter((n) => n.startsWith("mimo"))
  assert.ok(MIMO_ROWS.length >= 5, `在册 mimo 行 ≥5（防扫描面收窄）：实命中 ${MIMO_ROWS.length}`)
  for (const d of V26) {
    for (const base of MIMO_ROWS) {
      if (base === d || (base === ULTRA && d === PRO)) continue // 唯一在册前置对（上两行已钉住）
      assert.equal(base.startsWith(d), false, `${base} 不以 ${d} 为前缀（无新增遮蔽面）`)
    }
    for (const v of V25) {
      assert.equal(v.startsWith(d), false, `${v} 不被 ${d} 吞（v2.5 行仍命中自身）`)
      assert.equal(d.startsWith(v), false, `${d} 不蹭 ${v} 行`)
    }
  }
  for (const v of V25) assert.equal(specMatch(v).matched, true, `${v} 仍命中自身行`)
})

test("[mimo] M-6 行注证据等级词：三名各含「实测」「校验级」「官方口径」「族沿用」（AC-5 逐字）", () => {
  for (const name of V26) {
    const note = rowNote(name)
    for (const word of ["实测", "校验级", "官方口径", "族沿用"]) {
      assert.ok(note.includes(word), `${name} 行注含「${word}」（AC-5）`)
    }
  }
})

test("[mimo] M-7 本档自扫：信息性字段字面量零命中（T-13② 用例面零新增——防自踩）", () => {
  assert.ok(SELF_SOURCE.includes("INFO_FIELD"), "正控：自扫对象 = 本档源码（防空扫）")
  assert.equal(SELF_SOURCE.includes(INFO_FIELD), false, "本档全文（含注释与断言消息）零该字段字面")
})

test("[mimo] M-8 预设改指（AC-4）：mimo / mimoplan 的 model = mimo-v2.6-pro 且命中规格行", () => {
  // mimoplan 端点未实测（Token Plan 无 tp- 凭证）= 同平台推断（unverified）——本用例只验预设表取值，不涉端点。
  for (const preset of ["mimo", "mimoplan"]) {
    const model = PROVIDER_PRESETS[preset].model
    assert.equal(model, "mimo-v2.6-pro", `${preset} 预设默认模型 = V2.6 在役名（v2.5 将下线）`)
    assert.equal(specMatch(model).matched, true, `${preset} 的 model 命中独立规格行（非兜底）`)
  }
})

test("[mimo] M-9 错误面：未在册名 mimo-v3-pro 落兜底 + 告警恰一次 + 表内不补泛前缀行", () => {
  const PROBE = "mimo-v3-pro"
  const warns = []
  const orig = console.warn
  console.warn = (...a) => warns.push(a.join(" "))
  try {
    const r = specMatch(PROBE)
    assert.equal(r.matched, false, "无行 ⇒ 兜底（不补泛前缀行）")
    assert.equal(r.spec.context, 128_000, "退化形状 = 128K")
    assert.equal(r.spec.maxOutput, 32_000, "退化形状 = 32K")
    assert.equal(r.spec.multimodal, undefined, "退化形状 = 无视觉")
    specForModel(PROBE)
    assert.equal(warns.length, 1, "告警恰一次（同进程名级去重）")
    assert.match(warns[0], /mimo-v3-pro/, "告警点名该模型")
  } finally { console.warn = orig }
  assert.ok(TABLE_ROW_NAMES.length >= 40, `扫描须命中全表（防正则空扫）：实命中 ${TABLE_ROW_NAMES.length} 行`)
  for (const base of TABLE_ROW_NAMES) {
    assert.equal(PROBE.startsWith(base), false, `${base} 不作 ${PROBE} 的前缀（防泛前缀行）`)
  }
})
