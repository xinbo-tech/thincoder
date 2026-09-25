/**
 * test/toolcall.test.mjs — 工具调用探针自检（§11.11 结构级 + 行为级 · 零网络）。
 *
 * 覆盖：用例集 schema 与冻结副本两层逐字等值（AC-1）· 三变体差异面 + 能力位两态 + `payloadDigest` 确定性
 * （AC-2）· V1 枚举块点名名 ⊆ 载荷面 · `--dry-run` 全链路六形态与三轴 / 分母口径（AC-3）· 成本读数两腿
 * （AC-4）；报告对产物断言 / 落档面 / 成本闸住 `toolcall-report.test.mjs`。
 * 手动跑：`node --test "bench/test/*.test.mjs"`（不进 CI）。
 */

import assert from "node:assert/strict"
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { after, test } from "node:test"

import { builtinTools, readImageTool, toOpenAISchema } from "../../thincoder-core/tools/index.mjs"
import { CASES, V1_IMPACT, casesDigest, validateCases } from "../toolcall/cases.mjs"
import {
  OFF_PAYLOAD_TOOL_NAMES, SYSTEM_BASE, TOOL_PROBE_VERSION, V1_BLOCK_NAMES, V1_ENUM_BLOCKS, V1_PARAM_DESCRIPTIONS,
  routeHead,
} from "../toolcall/fixture.mjs"
import { argsOkOf, denominators, gradeRun } from "../toolcall/grade.mjs"
import { buildVariants, payloadDigest } from "../toolcall/variants.mjs"
import { main, runOne } from "../toolcall.mjs"
import { loadPrices, pricesPath } from "../lib/prices.mjs"
import { FROZEN_CASES, FROZEN_SYSTEM_BASE, FROZEN_TOOL_PROBE_VERSION, FROZEN_V1_ENUM_BLOCKS } from "./toolcall-fixtures.frozen.mjs"

const SANDBOX = mkdtempSync(join(tmpdir(), "toolcall-test-results-"))
process.env.BENCH_RESULTS_DIR = SANDBOX // 落档面走既有缝（不触 bench/results/）
after(() => rmSync(SANDBOX, { recursive: true, force: true }))

/** 进程内跑探针 CLI（捕获 stdout/stderr；返回退出码与输出）。 */
async function runCli(args) {
  const lines = []
  const [log, err] = [console.log, console.error]
  console.log = (...a) => lines.push(a.map(String).join(" "))
  console.error = (...a) => lines.push(a.map(String).join(" "))
  try { return { code: await main(args), out: lines.join("\n") } } finally { console.log = log; console.error = err }
}

const readJson = (name) => JSON.parse(readFileSync(join(SANDBOX, name), "utf8"))
/** 产物档名（**从盘面派生**——不写日期、不取时钟：`<日期>-<标签>.{md,json}` 的日期段由运行起点决定）。 */
const artifact = (label, ext) => readdirSync(SANDBOX).find((f) => f.includes(label) && f.endsWith(ext))
const artifactPath = (label, ext) => join(SANDBOX, artifact(label, ext))
const strip = (c) => ({ id: c.id, kind: c.kind, prompt: c.prompt, expect: c.expect })
const variantOf = (model, id) => buildVariants({ model }).find((v) => v.id === id)
const payloadNames = () => new Set([...builtinTools.map((t) => t.name), "read_image"])
const observedOf = (toolCalls, text = "") => ({ error: null, text, toolCalls, finishReason: "tool_calls", tokens: null, wallMs: 1 })

test("AC-1：用例集 schema（14 例 / id 唯一 / 字段在场 / 期望名 ∈ 载荷面 / 5 对偶 3 边界）+ 冻结副本两层逐字等值 + 版本单源", () => {
  assert.deepEqual(validateCases(), { cases: 14 })
  assert.equal(new Set(CASES.map((c) => c.id)).size, 14, "id 唯一")
  const face = payloadNames()
  for (const c of CASES) {
    assert.equal(typeof c.prompt === "string" && c.prompt.length > 0, true, `${c.id} 题面在场`)
    assert.equal(c.expect !== null && typeof c.expect === "object", true, `${c.id} expect 在场`)
    assert.equal(c.expect.name === null || face.has(c.expect.name), true, `${c.id} 期望工具名 ∈ 载荷面`)
    assert.equal(c.expect.name === null ? c.expect.argsOk === null : Array.isArray(c.expect.argsOk), true, `${c.id} 谓词形态`)
  }
  assert.equal(CASES.filter((c) => c.kind === "pair").length, 10, "5 对偶 × 2")
  assert.equal(CASES.filter((c) => c.kind === "boundary").length, 3, "3 边界")
  assert.equal(CASES.filter((c) => c.kind === "normal").length, 1, "1 常规")
  assert.equal(V1_IMPACT.length, 14, "V1 影响面逐例在档")
  // 影响面取值机检（§11.4 定义面：home / steer / —）——同式住 `validateCases`（`home` ⇔ 期望工具被枚举）
  const impactOf = (impact) => V1_IMPACT.filter((r) => r.impact === impact).length
  assert.deepEqual([impactOf("home"), impactOf("steer"), impactOf("—")], [9, 3, 2], "影响面分布（home 9 · steer 3 · — 2）")
  const enumNames = new Set(Object.keys(V1_ENUM_BLOCKS))
  for (const row of V1_IMPACT) {
    const c = CASES.find((x) => x.id === row.caseId)
    if (row.impact === "home") assert.equal(enumNames.has(c.expect.name), true, `${row.caseId}：home ⇒ 期望工具被枚举`)
    if (row.impact === "steer") assert.equal(enumNames.has(c.expect.name), false, `${row.caseId}：steer ⇒ 期望工具未被枚举`)
  }
  // 两层机检（运行面副本 ↔ 冻结副本逐字等值）
  assert.equal(TOOL_PROBE_VERSION, FROZEN_TOOL_PROBE_VERSION, "版本两层等值")
  assert.equal(Number.isInteger(TOOL_PROBE_VERSION) && TOOL_PROBE_VERSION >= 1, true)
  assert.equal(SYSTEM_BASE, FROZEN_SYSTEM_BASE, "SYSTEM_BASE 两层等值")
  assert.deepEqual(V1_ENUM_BLOCKS, FROZEN_V1_ENUM_BLOCKS, "V1 枚举块两层等值")
  assert.deepEqual(CASES.map(strip), FROZEN_CASES.map(strip), "用例集两层等值")
  assert.equal(FROZEN_CASES.length, 14)
  // 版本单源：`TOOL_PROBE_VERSION` 的定义处恰一处（= fixture.mjs）
  const files = [
    "../toolcall.mjs", "../toolcall/fixture.mjs", "../toolcall/cases.mjs", "../toolcall/variants.mjs",
    "../toolcall/grade.mjs", "../toolcall/report.mjs", "./toolcall-fixtures.frozen.mjs",
  ]
  const defs = files.filter((f) => /export const TOOL_PROBE_VERSION\b/.test(readFileSync(fileURLToPath(new URL(f, import.meta.url)), "utf8")))
  assert.deepEqual(defs, ["../toolcall/fixture.mjs"], "版本轴单源 = fixture.mjs")
})

test("AC-2：V0 = 实面逐字 · V1 − V0 差集恰好（5 档枚举块 + 7 项嵌套参数描述）· V2 参数面逐字节等值", () => {
  const model = "mimo-v2.6-flash"
  const v0 = variantOf(model, "V0").tools
  assert.deepEqual(v0.slice(0, builtinTools.length), builtinTools.map(toOpenAISchema), "V0 静态表 23 档逐档等值")
  assert.deepEqual(v0[builtinTools.length], toOpenAISchema(readImageTool), "能力位 read_image 在场（视觉档）")
  const v1 = variantOf(model, "V1").tools
  const v2 = variantOf(model, "V2").tools
  const descDiff = []
  const paramDiff = []
  for (const [i, a] of v0.entries()) {
    const b = v1[i].function
    if (a.function.description !== b.description) {
      descDiff.push(a.function.name)
      assert.equal(b.description, `${V1_ENUM_BLOCKS[a.function.name]}\n\n${a.function.description}`, `${a.function.name}：V1 描述 = 枚举块 + V0 文本逐字`)
    }
    if (JSON.stringify(a.function.parameters) !== JSON.stringify(b.parameters)) paramDiff.push(a.function.name)
  }
  assert.deepEqual(descDiff, ["read", "edit", "bash", "grep", "git"], "V1 描述差集 = 恰 5 档枚举块档（多一处即红）")
  assert.deepEqual(paramDiff, ["edit"], "V1 参数面差集 = 恰 edit 档")
  const props = v1.find((t) => t.function.name === "edit").function.parameters.properties.edits.items.properties
  const added = Object.keys(props).filter((k) => props[k].description !== undefined).sort()
  assert.deepEqual(added, Object.keys(V1_PARAM_DESCRIPTIONS).sort(), "edit.edits[].* 恰 7 项描述补齐")
  for (const [i, a] of v0.entries()) {
    assert.equal(JSON.stringify(a.function.parameters), JSON.stringify(v2[i].function.parameters), `${a.function.name}：V2 参数面逐字节等值`)
    assert.equal(v2[i].function.description, routeHead(a.function.description), `${a.function.name}：V2 描述 = 取句规则`)
  }
  assert.equal(v2.every((t) => !t.function.description.endsWith("\n")), true, "V2 描述不含换行（首行截取）")
  // V2 取句规则三态（确定性）
  assert.equal(routeHead("短句第一行。\n第二行"), "短句第一行。", "≤120 字符 ⇒ 首行原样")
  assert.equal(routeHead(`${"甲".repeat(50)}。${"乙".repeat(100)}`), "甲".repeat(50), ">120 ⇒ 首个句末符之前片段（≤120）")
  assert.equal(routeHead("乙".repeat(130)), `${"乙".repeat(120)}…`, "仍 >120 ⇒ 硬截 120 + …")
  assert.equal(routeHead("丙".repeat(300) + "。尾部"), `${"丙".repeat(120)}…`, "句末符在 120 之外 ⇒ 仍硬截")
})

test("AC-2：read_image 能力位两态 + payloadDigest 确定性（V0 载荷同源单点构造 ⇒ 复算等值）", () => {
  const vision = buildVariants({ model: "mimo-v2.6-flash" })[0] // 视觉档
  const blind = buildVariants({ model: "no-such-model-xyz" })[0] // 未探档 ⇒ 保守默认（无 multimodal）
  assert.equal(vision.tools.map((t) => t.function.name).includes("read_image"), true, "视觉档载 read_image")
  assert.equal(blind.tools.map((t) => t.function.name).includes("read_image"), false, "非视觉档不载 read_image")
  assert.equal(vision.tools.length, builtinTools.length + 1, "能力位不入静态表计数")
  assert.equal(blind.tools.length, builtinTools.length)
  const key = "mimo:mimo-v2.6-flash"
  const a = payloadDigest([{ key, variant: vision }])
  assert.equal(a, payloadDigest([{ key, variant: buildVariants({ model: "mimo-v2.6-flash" })[0] }]), "同源复算等值")
  assert.match(a, /^sha256:[0-9a-f]{16}$/, "摘要形态（体例同 promptsDigest）")
  assert.notEqual(a, payloadDigest([{ key, variant: blind }]), "载荷面不同 ⇒ 摘要不同")
  assert.match(casesDigest(), /^sha256:[0-9a-f]{16}$/)
  assert.equal(casesDigest(), casesDigest(), "夹具锚复算等值")
})

test("AC-2：V1 枚举块点名工具名 ⊆ 载荷面（5 块逐名对读——载荷外工具名零命中）", () => {
  const face = payloadNames()
  const blocks = Object.keys(V1_ENUM_BLOCKS)
  assert.deepEqual(Object.keys(V1_BLOCK_NAMES), blocks, "点名表与块集同构")
  for (const tool of blocks) {
    const block = V1_ENUM_BLOCKS[tool]
    for (const name of V1_BLOCK_NAMES[tool]) {
      assert.equal(face.has(name), true, `块「${tool}」点名「${name}」∉ 载荷面`)
      assert.equal(block.includes(name), true, `块「${tool}」声明的点名名「${name}」不在块文本内`)
    }
    for (const off of OFF_PAYLOAD_TOOL_NAMES) {
      assert.equal(block.includes(off), false, `块「${tool}」命中载荷外工具名「${off}」`)
    }
  }
})

test("AC-3/AC-6：--dry-run 全链路（夹具六形态 + 三轴 / 分母口径 + tool.13 零调用腿 + 空响应 error 腿）——零网络", async () => {
  const orig = globalThis.fetch
  let calls = 0
  globalThis.fetch = () => { calls++; throw new Error("network disabled by test") }
  let r
  const label = `toolcall-test-${process.pid}`
  try {
    r = await runCli(["--dry-run", "--models", "mimo-v2.6-flash", "--n", "3", "--label", label])
  } finally { globalThis.fetch = orig }
  assert.equal(r.code, 0, r.out)
  assert.equal(calls, 0, "dry-run 全链路零网络")
  assert.match(r.out, /\| mimo-v2.6-flash \| V0 \| 42 \|/, "摘要表逐模型 × 变体")
  const data = readJson(artifact(label, ".json"))
  const v0 = data.models[0].variants.find((v) => v.id === "V0")
  const flat = v0.cases.flatMap((c) => c.runs)
  const has = (f, why) => assert.equal(flat.some(f), true, `夹具六形态缺「${why}」`)
  has((x) => x.hit === true && x.legal === true && x.semOk === true, "命中")
  has((x) => x.hit === false && x.legal === true && x.semOk === false, "误选近邻")
  has((x) => x.called === false && x.terminal === "completed", "无调用")
  has((x) => (x.toolNames?.length ?? 0) > 1, "多调用")
  has((x) => x.parseOk === false, "arguments 非 JSON")
  has((x) => x.hit === true && x.legal === false && x.schemaErrors.some((e) => e.includes("缺 required")), "schema 违规·缺 required")
  has((x) => x.schemaErrors.some((e) => e.includes("enum")), "schema 违规·enum 越界")
  // tool.13 零调用腿（§11.6）：轴① true · 轴② / ③ null · noCall 计数
  const t13 = v0.cases.find((c) => c.caseId === "tool.13").runs
  assert.equal(t13.length, 3)
  for (const x of t13) {
    assert.equal(x.called, false)
    assert.equal(x.hit, true, "期望无调用 ⇒ 零调用为命中")
    assert.equal(x.legal, null)
    assert.equal(x.semOk, null)
  }
  assert.equal(v0.axis.noCall, 3)
  // 分母口径：轴① 分母 = 有效 run 数；轴②③ 分母 = n − 期望无调用 run 数
  const d = denominators(flat)
  assert.equal(v0.axis.n, flat.filter((x) => x.terminal !== "error" && x.terminal !== "skipped").length, "n = 有效 run")
  assert.equal(d.axis1, 42, "14 例 × n=3")
  assert.equal(d.axis23, 42 - 3, "null 例（tool.13）不入轴②③ 分母")
  assert.equal(v0.axis.perfect <= d.axis23, true, "perfect 不入 null 例")
  assert.equal(v0.cases.filter((c) => c.runs.length !== 3).length, 0, "逐格 run 数 = n")
  // 误答调用 ⇒ 轴① false（grade 级直测——零调用纪律例被误答的场景）
  const t13Case = CASES.find((c) => c.id === "tool.13")
  const wrong = gradeRun({
    caseObj: t13Case, payload: v0.payload.tools, n: 1,
    observed: observedOf([{ name: "get_current_time", arguments: "{}" }]),
  })
  assert.equal(wrong.called, true)
  assert.equal(wrong.hit, false, "零调用例被误答 ⇒ 轴① false")
  assert.equal(wrong.legal, null)
  assert.equal(wrong.semOk, null)
  // 空响应 / 接口错 ⇒ error（无判定素材：三轴 null · 不入分母）——含假接口错腿（transport 抛错）
  const t1 = CASES.find((c) => c.id === "tool.1")
  const empty = gradeRun({ caseObj: t1, payload: v0.payload.tools, n: 1, observed: observedOf([]) })
  assert.equal(empty.terminal, "error", "空响应 ⇒ error")
  assert.equal(empty.hit, null)
  const prices = loadPrices(pricesPath())
  const { run } = await runOne({
    caseObj: t1, payload: v0.payload.tools, providerEntry: { name: "fixture", model: "mimo-v2.6-flash" },
    transport: { call: async () => { throw new Error("夹具：接口错") } },
    timeoutMs: 1000, prices, priceEntry: null, n: 1,
  })
  assert.equal(run.terminal, "error", "接口错 ⇒ error（逐 run 记 · 不杀全批）")
  assert.equal(run.hit, null)
  assert.equal(run.metrics.tokens, null)
  assert.equal(run.metrics.cost, null)
  // 判定面 = 首条工具调用（多调用仍以首调判 hit）
  const multi = gradeRun({
    caseObj: CASES.find((c) => c.id === "tool.6"), payload: v0.payload.tools, n: 1,
    observed: observedOf([
      { name: "git", arguments: JSON.stringify({ action: "status" }) },
      { name: "read", arguments: JSON.stringify({ path: "docs/a.txt" }) },
    ]),
  })
  assert.equal(multi.hit, true)
  assert.equal(multi.legal, true)
  assert.equal(multi.toolNames.length, 2)
})

test("AC-3/AC-4：三轴判据逐例面（谓词求值 / 载荷外名 ⇒ offPayload / 缺 usage ⇒ 成本 null + warning）+ payload 静态读数确定性", async () => {
  const model = "mimo-v2.6-flash"
  const v0 = variantOf(model, "V0")
  const v1 = variantOf(model, "V1")
  const v2 = variantOf(model, "V2")
  for (const v of [v0, v1, v2]) {
    assert.equal(JSON.stringify(v.tools), JSON.stringify(variantOf(model, v.id).tools), "静态读数同源复算等值")
    assert.equal(v.chars, JSON.stringify(v.tools).length)
    assert.equal(v.bytes, Buffer.byteLength(JSON.stringify(v.tools), "utf8"))
    assert.equal(v.descriptionChars, v.tools.reduce((s, t) => s + t.function.description.length, 0))
  }
  assert.equal(v1.descriptionChars > v0.descriptionChars, true, "V1 枚举块 ⇒ 描述面膨胀")
  assert.equal(v2.descriptionChars < v0.descriptionChars, true, "V2 路由句 ⇒ 描述面压缩")
  // 谓词求值器：命中 / 缺键 / 类型不符 / 空对象
  const t1 = CASES.find((c) => c.id === "tool.1")
  assert.equal(argsOkOf(t1.expect.argsOk, { path: "docs/a.txt", offset: 10, limit: 5 }), true)
  assert.equal(argsOkOf(t1.expect.argsOk, { path: "docs/a.txt", offset: 10, limit: 6 }), false)
  assert.equal(argsOkOf(CASES.find((c) => c.id === "tool.14").expect.argsOk, {}), true)
  assert.equal(argsOkOf(CASES.find((c) => c.id === "tool.14").expect.argsOk, { extra: 1 }), false)
  assert.equal(argsOkOf(CASES.find((c) => c.id === "tool.8").expect.argsOk, { path: "docs/notes.txt", line: 40 }), true, "new_string 缺席 = 删除信号")
  assert.equal(argsOkOf(CASES.find((c) => c.id === "tool.8").expect.argsOk, { path: "docs/notes.txt", line: 40, new_string: "" }), false)
  // 载荷外工具名 ⇒ legal false + offPayload 单列
  const off = gradeRun({ caseObj: t1, payload: v0.tools, n: 1, observed: observedOf([{ name: "code_search", arguments: "{}" }]) })
  assert.equal(off.legal, false)
  assert.equal(off.hit, false)
  assert.equal(off.schemaErrors.some((e) => e.startsWith("载荷外工具名")), true)
  // 缺 usage ⇒ tokens / cost null + warning（`--dry-run` 链路上有该形态：tool.12 第 1 次重复）
  const noUsage = gradeRun({ caseObj: CASES.find((c) => c.id === "tool.12"), payload: v0.tools, n: 1, observed: { error: null, text: "", toolCalls: [{ name: "grep", arguments: "{}" }], finishReason: "tool_calls", tokens: null, wallMs: 1 } })
  assert.equal(noUsage.metrics.tokens, null)
  assert.equal(noUsage.metrics.cost, null)
  assert.equal(noUsage.legal, false, "缺 required（grep.pattern）仍判 schema 违规")
  const usageLabel = `toolcall-usage-${process.pid}`
  const r = await runCli(["--dry-run", "--models", "mimo-v2.6-flash", "--n", "1", "--variants", "V0", "--cases", "tool.12", "--label", usageLabel])
  assert.equal(r.code, 0, r.out)
  const data = readJson(artifact(usageLabel, ".json"))
  const run0 = data.models[0].variants[0].cases[0].runs[0]
  assert.equal(run0.metrics.tokens, null)
  assert.equal(run0.metrics.cost, null)
  assert.equal(data.warnings.some((w) => w.includes("usage 缺失")), true, "缺 usage ⇒ warning（不静默）")
  // 实测腿：报告成本列 / Δ vs V0 在场且可用
  const md = readFileSync(artifactPath(usageLabel, ".md"), "utf8")
  assert.match(md, /prompt tokens 中位/, "报告含 tokens 中位列（AC-4）")
  assert.match(md, /Δ vs V0/, "报告含 Δ vs V0 列（AC-4）")
  assert.match(md, /\| V0 \|/, "成本读数表含变体行")
})
