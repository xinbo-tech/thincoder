/**
 * model-specs-qwen36.test.mjs — qwen3.6 系五名独立规格行（批 2026-09-20-qwen36-family-rows ·
 * 设计 `docs/core/design/MODEL-SPECS.md` §11 · 用例 Q-1..Q-6 · Q-8——标题带 `[qwen36]` 打标）。
 *
 * 拆分载体：主测试档（model-specs.test.mjs，468 行）append 将破 500 硬限（core-hygiene
 * T-C14，登记表只适用 300–500 段）⇒ 本批新档承载——主档零触碰、老段不迁移（§11.5）。
 * 断言面 = 行为面（specForModel / specMatch 返回形状 + 显式字段值）+ 行注证据等级词
 * （Q-6——行注即交付物本体，循 [flashx] F-5 / [onboard] A-4 先例）。helpers 就地重定义、
 * 零 import 主测试档（主档无导出面——§11.7-②）。D-10 信息性字段本批不设断言
 * （T-13 全仓测试面计数闸——本档全文不出现该字段字面，含注释）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { specForModel, specMatch } from "../model-specs.mjs"

// qwen3.6 系五名（批档 §1.2 · 五名同形——一套字段口径 × 五名独立行）
const FIVE = ["qwen3.6-flash", "qwen3.6-plus", "qwen3.6-max-preview", "qwen3.6-27b", "qwen3.6-35b-a3b"]

/** 服务端原文序（§11.3 / D-5）：六档止于 xhigh——3.6 系无 max（≠ 3.8 系七档）。 */
const EFFORT_6 = ["none", "minimal", "low", "medium", "high", "xhigh"]

/** 逐字段比对（键缺席 ⇒ undefined ≠ 登记值 ⇒ 红）。 */
function assertFields(name, fields) {
  const spec = specForModel(name)
  for (const [k, v] of Object.entries(fields)) {
    assert.deepEqual(spec[k], v, `${name}.${k} = §11.3 登记值`)
  }
  return spec
}

// 表字面量扫描（Q-5 / Q-6 用——名字与行注取自表源码，取值仍走运行时查表，无散文锚）。
const SPEC_SOURCE = readFileSync(new URL("../model-specs.mjs", import.meta.url), "utf8")
const TABLE_ROW_NAMES = [...SPEC_SOURCE.matchAll(/^\s*\["([^"]+)",\s*\{/gm)].map((m) => m[1])

/** 行注提取：表字面量中该行上方紧邻的 `//` 注释块（证据等级词在此——§11.2 行注形态）。 */
function rowNote(name) {
  const lines = SPEC_SOURCE.split("\n")
  const at = lines.findIndex((l) => l.trimStart().startsWith(`["${name}",`))
  assert.ok(at > 0, `表内存在 ${name} 行（防空扫）`)
  const note = []
  for (let i = at - 1; i >= 0 && lines[i].trimStart().startsWith("//"); i--) note.unshift(lines[i])
  assert.ok(note.length > 0, `${name} 行注在场（AC-2：证据等级须逐条落行注）`)
  return note.join("\n")
}

test("[qwen36] Q-1 五名独立行命中：matched + maxOutput 65_536（≠131_072 即非蹭 3.7/3.8 行）+ 行独立", () => {
  for (const name of FIVE) {
    const r = specMatch(name)
    assert.equal(r.matched, true, `${name} 命中独立行（非前缀兜底非默认面）`)
    assert.equal(r.spec.maxOutput, 65_536, `${name} maxOutput = 校验级 65_536`)
  }
  const specs = FIVE.map((n) => specForModel(n))
  for (let i = 0; i < specs.length; i++) {
    for (let j = i + 1; j < specs.length; j++) {
      assert.notEqual(specs[i], specs[j], `${FIVE[i]} 与 ${FIVE[j]} 非同一对象（行独立——A-3 形状）`)
    }
  }
})

test("[qwen36] Q-2 全字段 deepEqual = 运行时推导 { ...qwen3.7-flash 行, maxOutput: 65_536 }（五名同形单推导式；3.7 行漂移自动跟随）", () => {
  for (const name of FIVE) {
    assert.deepEqual(
      specForModel(name),
      { ...specForModel("qwen3.7-flash"), maxOutput: 65_536 },
      `${name} 全字段 = 3.7-flash 族形 + 校验级 maxOutput（键集差/值差任一即红）`,
    )
  }
})

test("[qwen36] Q-3 枚举形状锚：六档服务端原文序（首项 none——D-5 禁重排）+ 无 max + ≠ 3.8-max 行枚举", () => {
  for (const name of FIVE) {
    const e = specForModel(name).reasoningEffortEnum
    assert.deepEqual(e, EFFORT_6, `${name} 枚举 = 服务端原文六档`)
    assert.equal(e[0], "none", `${name} 首项 = none`)
    assert.equal(e.includes("max"), false, `${name} 六档无 max（3.6 系 ≠ 3.8 系七档）`)
  }
  assert.notDeepEqual(
    specForModel("qwen3.6-max-preview").reasoningEffortEnum,
    specForModel("qwen3.8-max").reasoningEffortEnum,
    "同带 max 字样的跨版本行不同值集（防抄错源）",
  )
})

test("[qwen36] Q-4 既有 qwen 族 6 行零回归 + 五新名不遮蔽任何表行（A-11 形状）", () => {
  // 期望对象 = 行为面字段逐字面；D-10 信息性字段不入列（本批不对其取值断言——T-13 闸安全）。
  const BASELINE = [
    ["qwen3.7-max", { context: 1_000_000, maxOutput: 131_072, thinking: true, partialMode: true, multimodal: undefined, thinkApi: "effort", reasoningEffortEnum: ["xhigh", "high"], tempRange: [0, 2] }],
    ["qwen3.7-flash", { context: 1_000_000, maxOutput: 131_072, thinking: true, partialMode: true, multimodal: true, thinkApi: "effort", reasoningEffortEnum: EFFORT_6, tempRange: [0, 2] }],
    ["qwen3.8-flash", { context: 1_000_000, maxOutput: 131_072, thinking: true, partialMode: true, multimodal: true, thinkApi: "effort", reasoningEffortEnum: [...EFFORT_6, "max"], tempRange: [0, 2] }],
    ["qwen3.8-max", { context: 1_000_000, maxOutput: 131_072, thinking: true, partialMode: true, multimodal: true, thinkApi: "effort", reasoningEffortEnum: ["xhigh", "medium", "low"], tempRange: [0, 2] }],
    ["qwen3.8-omni-flash", { context: 1_000_000, maxOutput: 131_072, thinking: true, partialMode: true, multimodal: true, thinkApi: "effort", reasoningEffortEnum: [...EFFORT_6, "max"], tempRange: [0, 2] }],
    ["qwen3.8-27b", { context: 262_144, maxOutput: 131_072, thinking: true, partialMode: true, multimodal: true, thinkApi: "effort", reasoningEffortEnum: [...EFFORT_6, "max"], tempRange: [0, 2] }],
  ]
  for (const [name, fields] of BASELINE) assertFields(name, fields)
  for (const n of FIVE) {
    for (const base of TABLE_ROW_NAMES) {
      if (FIVE.includes(base)) continue
      assert.equal(base.startsWith(n), false, `${base} 不被 ${n} 前缀遮蔽`)
    }
  }
})

test("[qwen36] Q-5 表行名扫描含五名（防空扫正控）", () => {
  assert.ok(TABLE_ROW_NAMES.length >= 40, `扫描须命中全表（防正则空扫）：实命中 ${TABLE_ROW_NAMES.length} 行`)
  for (const name of FIVE) assert.ok(TABLE_ROW_NAMES.includes(name), `${name} 行字面在场`)
})

test("[qwen36] Q-6 行注证据等级词：五名各含「校验级」「官方口径」「族沿用」；35b-a3b 另含「MoE」", () => {
  for (const name of FIVE) {
    const note = rowNote(name)
    for (const word of ["校验级", "官方口径", "族沿用"]) {
      assert.ok(note.includes(word), `${name} 行注含「${word}」（AC-2）`)
    }
  }
  assert.ok(rowNote("qwen3.6-35b-a3b").includes("MoE"), "35b-a3b 行注含「MoE」（开放项② = 行注承载）")
})

// ─── Q-8 错误面：枚举入册后 max 由「透传吃服务端 400」变「本地抛错」（§11.7 · provider/core.mjs 组体前门）───

const BAILIAN = "https://dashscope.aliyuncs.com/compatible-mode/v1"

/** fetch 桩：捕获出站请求体 + 回最小 SSE 流（形态同 provider-merge.test.mjs stubSSE）。 */
function stubSSE(content = "ok") {
  const calls = []
  const saved = globalThis.fetch
  globalThis.fetch = async (_url, opts) => {
    calls.push(JSON.parse(opts.body))
    const sse = `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\ndata: [DONE]\n\n`
    return { ok: true, status: 200, headers: { get: () => "text/event-stream" }, body: [new TextEncoder().encode(sse)] }
  }
  return { calls, restore: () => { globalThis.fetch = saved } }
}

test("[qwen36] Q-8 effort 越界门：qwen3.6-flash + max ⇒ 本地抛错（六档清单）+ 零出站 + xhigh 过门", async () => {
  const { chat } = await import("../provider/core.mjs")
  const stub = stubSSE()
  try {
    const provider = { name: "qwen", model: "qwen3.6-flash", baseURL: BAILIAN, apiKey: "k", reasoningEffort: "max" }
    await assert.rejects(
      chat(provider, { messages: [{ role: "user", content: "hi" }] }),
      /reasoning_effort "max" not supported by model "qwen3\.6-flash"/,
      "枚举外取值 ⇒ 本地抛错（早于网络）",
    )
    await assert.rejects(chat(provider, { messages: [{ role: "user", content: "hi" }] }), (e) => {
      assert.match(e.message, /valid values: none, minimal, low, medium, high, xhigh$/, "报错列出服务端原文序六档（可自查）")
      return true
    }, "越界错误面稳定（重复调用同形）")
    assert.equal(stub.calls.length, 0, "门在 fetch 之前：零出站请求")
    // 正控（区分力）：同模型 + 枚举内取值 ⇒ 过门，出站体带 reasoning_effort
    const result = await chat({ ...provider, reasoningEffort: "xhigh" }, { messages: [{ role: "user", content: "hi" }] })
    assert.equal(result.content, "ok", "枚举内取值 ⇒ 走完整路径（桩 SSE 回包）")
    assert.equal(stub.calls.length, 1, "恰一次出站")
    assert.equal(stub.calls[0].reasoning_effort, "xhigh", "正控按枚举内档位组装出站体")
    assert.equal(stub.calls[0].model, "qwen3.6-flash")
  } finally { stub.restore() }
})
