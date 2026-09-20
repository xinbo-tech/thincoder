/**
 * model-specs.test.mjs — MODEL_SPECS 查表层核内行为面。四段：
 *  ① 上段（DEEPSEEK-QWENPLAN 批：qwen-plan 渠道名 `deepseek-v4.1-flash` 接入——R21 / N10 / N11 ·
 *     批次档 §2 AC A-1..A-4 / 用例 T-1..T-5）；
 *  ② 中段（2026-09-20-qwen-flash-specs 批：qwen3.7/3.8-flash 独立行 + omni/27b 新档 + `qwen`
 *     托底行删除——设计 `docs/core/design/MODEL-SPECS.md` §2.1–§2.4 · 用例 T-1…T-13；该段用例
 *     标题带 `[qwen]` 打标，与上段同号用例消歧）；
 *  ③ 后段（2026-09-20-channel-onboarding 批：TokenHub `hy3` 族三行 + 方舟 `doubao-seed-2-0-*`
 *     两行入登记面——设计 `docs/core/design/MODEL-SPECS.md` §9 · 用例 A-1…A-12；该段标题带
 *     `[onboard]` 打标。D-14 载荷面用例在 `provider-merge.test.mjs` B-1…B-6）；
 *  ④ 末段（2026-09-20-glm53-flashx-row 批：`glm-5.3-flashx` 独立规格行入登记面——设计
 *     `docs/core/design/MODEL-SPECS.md` §10 · 用例 F-1..F-5；该段标题带 `[flashx]` 打标）。
 *
 * 断言面 = 行为面：specForModel / specMatch 返回形状 + 显式字段值——无逐字子串散文锚
 * （唯一例外 = ③ A-4 与 ④ F-5 的行注证据等级词，行注即交付物本体，见各段段注）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { dirname, extname, join, relative, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { specForModel, specMatch, assistantToolCallMessage } from "../model-specs.mjs"

// qwen-plan 渠道名（token-plan GET /models 2026-09-15 实测）——字段逐字对齐 deepseek-flash 行
const CHANNEL = "deepseek-v4.1-flash"
const FLASH = "deepseek-flash"

/** Unknown-model lookup warns once (warnUnknownModel) — silence it so the fallback call keeps output clean. */
function silent(fn) {
  const orig = console.warn
  console.warn = () => {}
  try { return fn() } finally { console.warn = orig }
}

test("T-1/A-1 deepseek-v4.1-flash resolves per-field identical to deepseek-flash (1M ctx — no 128K fallback)", () => {
  const spec = specForModel(CHANNEL)
  assert.deepEqual(spec, specForModel(FLASH), "per-field deepEqual against the deepseek-flash row")
  assert.equal(spec.context, 1_000_000)
  assert.equal(spec.maxOutput, 384_000)
  assert.equal(spec.thinking, true)
  assert.equal(spec.prefixMode, true)
  assert.equal(spec.multimodal, true, "multimodal true — user ruling 04:01")
})

test("T-2/A-2 specMatch(channel) reports matched:true — unknown-model fallback not entered", () => {
  const r = specMatch(CHANNEL)
  assert.equal(r.matched, true)
  assert.deepEqual(r.spec, specForModel(FLASH))
})

test("T-3/A-3 the new row shadows nothing — retired names still hit their own rows", () => {
  for (const retired of ["deepseek-v4-flash", "deepseek-v4-flash-0731"]) {
    const spec = specForModel(retired)
    assert.equal(spec.context, 1_000_000, `${retired} keeps the retired row (1M)`)
    assert.equal(spec.multimodal, true, `${retired} keeps the retired row (multimodal)`)
  }
})

test("T-4/A-3 deepseek-v4-pro stays the conservative row (no multimodal)", () => {
  const pro = specForModel("deepseek-v4-pro")
  assert.equal(pro.context, 1_000_000)
  assert.equal(pro.multimodal, undefined)
})

test("T-5 unknown model still falls back to DEFAULT_SPEC with matched:false", () => {
  const model = "deepseek-no-such-model-x"
  const r = silent(() => specMatch(model))
  assert.equal(r.matched, false)
  assert.equal(r.spec.context, 128_000, "128K fallback unchanged")
  assert.equal(r.spec.maxOutput, 32_000)
  assert.equal(specForModel(model), r.spec, "specForModel shares the same fallback spec")
})

// ─── D-CC22（#109）：活体推入面回声恒带 —— 构造单点规则面（批档 §2.4 A-C1）────────

const TC = [{ id: "call_1", name: "read", arguments: '{"path":"a.txt"}' }]
const extractToolCall = (msg) => msg.tool_calls[0]

test("T-6/A-C1 required 族：工具轮消息恒带 reasoning_content —— 缺值 ⇒ 空串在场", () => {
  const spec = specForModel(FLASH)
  assert.equal(spec.reasoningEcho, "required", "判据前提：deepseek 族回声策略 = required")
  const empty = assistantToolCallMessage({ content: null, toolCalls: TC, reasoning: "" }, spec)
  assert.equal("reasoning_content" in empty, true, "空 reasoning ⇒ 键在场（字段不省略）")
  assert.equal(empty.reasoning_content, "")
  const missing = assistantToolCallMessage({ content: null, toolCalls: TC }, spec)
  assert.equal("reasoning_content" in missing, true, "缺 reasoning ⇒ 同样在场")
  assert.equal(missing.reasoning_content, "")
  const valued = assistantToolCallMessage({ content: "text", toolCalls: TC, reasoning: "rc" }, spec)
  assert.equal(valued.reasoning_content, "rc", "有值 ⇒ 逐字回传（零回归）")
  assert.equal(valued.role, "assistant")
  assert.equal(valued.content, "text")
  assert.deepEqual(extractToolCall(valued), { id: "call_1", type: "function", function: { name: "read", arguments: '{"path":"a.txt"}' } }, "tool_calls 形状逐字不变")
})

test("T-7/A-C1 optional / 未声明族：键恒不存在（有值 / 无值两情形）", () => {
  for (const model of ["glm-5.3", "no-such-model-xyz"]) {
    const spec = silent(() => specForModel(model))
    for (const reasoning of ["rc", "", undefined]) {
      const msg = assistantToolCallMessage({ content: null, toolCalls: TC, reasoning }, spec)
      assert.equal("reasoning_content" in msg, false, `${model} / reasoning=${String(reasoning)} ⇒ 键不存在`)
    }
  }
})

// ─── 批 2026-09-20-qwen-flash-specs（设计 `docs/core/design/MODEL-SPECS.md` §2.1–§2.4 · §6 T-1…T-13）───
// 用例编号与上段（DEEPSEEK-QWENPLAN 批）同号不同批 ⇒ 本段标题一律带 `[qwen]` 打标消歧。

const FLASH_37 = "qwen3.7-flash"
const FLASH_38 = "qwen3.8-flash"
const OMNI_38 = "qwen3.8-omni-flash"
const QWEN_27B = "qwen3.8-27b"

/** 服务端原文序（§2.2 / D-5）：六档 = 3.7-flash；七档 = 3.8-flash / omni-flash / 27b（末位 `max`）。 */
const EFFORT_6 = ["none", "minimal", "low", "medium", "high", "xhigh"]
const EFFORT_7 = [...EFFORT_6, "max"]

/** §2.2 字段口径表：四新档共有字段面（`context` / `reasoningEffortEnum` 另有行差，逐用例传入）。
 *  D-10 信息性字段不列在此——本批不对其取值断言（§6 T-13 ②）。 */
const QWEN_FIELDS = {
  maxOutput: 131_072,
  thinking: true,
  partialMode: true,
  multimodal: true,
  thinkApi: "effort",
  tempRange: [0, 2],
}

/** 逐字段比对（键缺席 ⇒ undefined ≠ 登记值 ⇒ 红）。 */
function assertFields(name, fields) {
  const spec = specForModel(name)
  for (const [k, v] of Object.entries(fields)) {
    assert.deepEqual(spec[k], v, `${name}.${k} = §2.2 登记值`)
  }
  return spec
}

test("[qwen] T-1/A-1 两 flash 档各得独立行：字段口径逐项在场 + specMatch 命中真行（非默认兜底）", () => {
  for (const [name, enumVals] of [[FLASH_37, EFFORT_6], [FLASH_38, EFFORT_7]]) {
    assertFields(name, { context: 1_000_000, ...QWEN_FIELDS, reasoningEffortEnum: enumVals })
    assert.equal(specMatch(name).matched, true, `${name} 命中独立行（托底行已删仍不落默认面）`)
  }
})

test("[qwen] T-2/A-3 两 flash 档枚举不等：3.8 比 3.7 多且仅多 max（7 vs 6）", () => {
  const e37 = specForModel(FLASH_37).reasoningEffortEnum
  const e38 = specForModel(FLASH_38).reasoningEffortEnum
  assert.equal(e37.includes("max"), false, "3.7-flash 无 max（T-8 反向门的前提）")
  assert.deepEqual(e38, [...e37, "max"], "3.8 = 3.7 原文序 + 末位 max（仅多一个成员）")
  assert.notDeepEqual(e37, e38, "两档枚举不等")
})

test("[qwen] T-3/A-9 托底行已删：qwen / qwen-flash 均落 DEFAULT_SPEC（matched:false）", () => {
  for (const name of ["qwen", "qwen-flash"]) {
    const r = silent(() => specMatch(name))
    assert.equal(r.matched, false, `${name} 不再命中泛前缀托底行`)
    assert.equal(r.spec.context, 128_000, `${name} 退化形状 = 128K`)
    assert.equal(r.spec.maxOutput, 32_000, `${name} 退化形状 = 32K`)
    assert.equal(r.spec.multimodal, undefined, `${name} 退化形状 = 无视觉`)
  }
})

test("[qwen] T-4/A-14 借旧托底名的退化形状已知：qwen3.7-plus ⇒ 128K / 无视觉 / 无枚举", () => {
  const spec = silent(() => specForModel("qwen3.7-plus"))
  assert.equal(spec.context, 128_000, "1M → 128K（§2.4 第 5 行认账）")
  assert.equal(spec.multimodal, undefined, "视觉能力消失（读图路径摘除）")
  assert.equal(spec.reasoningEffortEnum, undefined, "思考档位缺失（选择面空）")
})

test("[qwen] T-5/A-15 退役名查表：preview 名前缀遮蔽命中同一对象；qwen-max 落默认面", () => {
  const max = specForModel("qwen3.8-max")
  assert.equal(specForModel("qwen3.8-max-preview"), max, "qwen3.8-max-preview ≡ qwen3.8-max（同一对象，不退化）")
  assert.deepEqual(max.reasoningEffortEnum, ["xhigh", "medium", "low"], "遮蔽目标行枚举零改（D-5 不按强度重排）")
  assert.equal(silent(() => specForModel("qwen-max")).context, 128_000, "qwen-max 退役后落默认面（§2.4 第 1 行认账）")
})

test("[qwen] T-6/A-12 两新档独立行：7 档枚举含 max + 131_072 输出 + 图像受理 + 实测级 thinking", () => {
  assertFields(OMNI_38, { context: 1_000_000, ...QWEN_FIELDS, reasoningEffortEnum: EFFORT_7 })
  assertFields(QWEN_27B, { context: 262_144, ...QWEN_FIELDS, reasoningEffortEnum: EFFORT_7 })
})

/** 表行名提取：`["name", {` 形态（T-7 全表扫描用——名字取自表字面量，取值仍走运行时查表，无散文锚）。 */
const SPEC_SOURCE = readFileSync(new URL("../model-specs.mjs", import.meta.url), "utf8")
const TABLE_ROW_NAMES = [...SPEC_SOURCE.matchAll(/^\s*\["([^"]+)",\s*\{/gm)].map((m) => m[1])

test("[qwen] T-7/§2.7 模态位语义单一：全表无 modalities 键，multimodal 仅 true / undefined", () => {
  assert.ok(TABLE_ROW_NAMES.length >= 40, `扫描须命中全表（防正则空扫）：实命中 ${TABLE_ROW_NAMES.length} 行`)
  for (const name of TABLE_ROW_NAMES) {
    const spec = specForModel(name)
    assert.equal("modalities" in spec, false, `${name} 不登记 modalities 键（音/视频 = 行注承载，§2.7）`)
    assert.ok(spec.multimodal === true || spec.multimodal === undefined, `${name}.multimodal 仅 true / undefined`)
  }
})

/** §1.3 既有族基线（每族一代表名 × 行为面字段）。D-10 信息性字段不入列（T-13 ②）。 */
const FAMILY_BASELINE = [
  ["deepseek-flash", { context: 1_000_000, maxOutput: 384_000, thinking: true, prefixMode: true, thinkApi: "type", reasoningEcho: "required", reasoningEffortEnum: ["low", "high", "max"], tempRange: [0, 2], multimodal: true }],
  ["kimi-k3", { context: 1_000_000, maxOutput: 131_072, thinking: true, partialMode: true, multimodal: true, thinkApi: "effort", reasoningEcho: "required", reasoningEffortEnum: ["low", "high", "max"] }],
  ["glm-5.3", { context: 1_000_000, maxOutput: 128_000, thinking: true, thinkApi: "type", reasoningEcho: "optional", reasoningEffortEnum: ["low", "high", "max"], tempRange: [0, 1], noUsageStream: true }],
  ["gpt-4o", { context: 128_000, maxOutput: 16_000, thinking: false, multimodal: true }],
  ["MiniMax-M3", { context: 1_000_000, maxOutput: 128_000, thinking: true, multimodal: true, thinkApi: "type", thinkEnabledValue: "adaptive", tempRange: [0, 2], noUsageStream: true }],
  ["mimo-v2.5", { context: 1_000_000, maxOutput: 128_000, thinking: true, multimodal: true, thinkApi: "type", reasoningEcho: "required", tempRange: [0, 1.5] }],
]

test("[qwen] T-11/§1.3 既有族零回归：六族代表名字段逐项不变（防误删误改行）", () => {
  for (const [name, fields] of FAMILY_BASELINE) assertFields(name, fields)
})

test("[qwen] T-12/D-5 枚举登记形状锚：首项恒 none；末位按服务端原文序（3.7-flash xhigh，其余 max）", () => {
  for (const name of [FLASH_37, FLASH_38, OMNI_38, QWEN_27B]) {
    assert.equal(specForModel(name).reasoningEffortEnum[0], "none", `${name} 首项 = none（禁按强度重排）`)
  }
  assert.equal(specForModel(FLASH_37).reasoningEffortEnum.at(-1), "xhigh", "3.7-flash 末位 = xhigh（无 max）")
  for (const name of [FLASH_38, OMNI_38, QWEN_27B]) {
    assert.equal(specForModel(name).reasoningEffortEnum.at(-1), "max", `${name} 末位 = max`)
  }
  assert.deepEqual(specForModel("qwen3.8-max").reasoningEffortEnum, ["xhigh", "medium", "low"], "既有 max 行枚举零改（D-5 不重排）")
})

// ─── T-13：信息性字段零判据消费（§4 D-10）────────────────────────────────────
// 针由拼接构造——本档正文与注释不出现该字面量，否则自扫用例把自己算作命中（自证）。
const INFO_FIELD = ["cache", "Mode"].join("")
const HERE = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(HERE, "..", "..") // thincoder/（三包同仓根）
const SCAN_EXT = new Set([".mjs", ".js", ".cjs", ".ts", ".json"])
const SKIP_DIRS = new Set(["node_modules", ".git", "docs", "_archive", "dist", "build", "out", "coverage", ".turbo", ".vscode-test", ".thincoder"])

/** 全仓扫针 ⇒ { prod, tests }（每项 = [仓库相对路径 / 正斜杠, 该档出现次数]；`tests` = 路径含
 *  `.../test/...` 段者）。计数用于用例面**逐档冻结**——基线档内多出一处断言即计数上涨 ⇒ 红。 */
function scanFieldHits(needle) {
  const prod = []
  const tests = []
  const walk = (dir) => {
    for (const ent of readdirSync(dir, { withFileTypes: true })) {
      const abs = join(dir, ent.name)
      if (ent.isDirectory()) {
        if (!SKIP_DIRS.has(ent.name)) walk(abs)
        continue
      }
      if (!SCAN_EXT.has(extname(ent.name))) continue
      const count = readFileSync(abs, "utf8").split(needle).length - 1
      if (!count) continue
      const rel = relative(REPO_ROOT, abs).split("\\").join("/")
      ;(rel.includes("/test/") ? tests : prod).push([rel, count])
    }
  }
  walk(REPO_ROOT)
  return { prod, tests }
}

test("[qwen] T-13/D-10 信息性字段零判据消费：生产码命中 ⊆ 表自身 + 端差拷贝；用例面零新增", () => {
  const { prod, tests } = scanFieldHits(INFO_FIELD)
  // ① 生产码：允许面 = 规格表中枢 + VSC 端差拷贝（设计 §6 T-13 ①）——其余任何位置 ⇒ 红
  assert.ok(prod.some(([rel]) => rel === "thincoder-core/model-specs.mjs"), `表中枢须命中（防空扫）：${JSON.stringify(prod)}`)
  assert.equal(SPEC_SOURCE.includes(INFO_FIELD), true, "登记面实据：表中枢含该键")
  const allowedProd = ["thincoder-core/model-specs.mjs", "thincoder-vscode/src/specs.mjs"]
  assert.deepEqual(prod.filter(([rel]) => !allowedProd.includes(rel)), [], "生产码零判据消费点（新增命中 ⇒ 出现消费者，须回 D-10 重裁）")
  // ② 用例面：零新增取值断言（T-13 ②）——基线 = 批前既有命中**逐档计数**；被本批改写的
  //    image-downgrade.test.mjs 也在基线内，其新增段多出一处断言即计数 1→2 ⇒ 红（档级名单会漏掉这一形态）
  const BASELINE_TESTS = { "thincoder-cli/test/model-ref.test.mjs": 1, "thincoder-vscode/test/image-downgrade.test.mjs": 1 }
  assert.deepEqual(tests.filter(([rel, n]) => BASELINE_TESTS[rel] !== n), [], `用例面零新增取值断言（基线逐档计数）：${JSON.stringify(tests)}`)
  assert.equal(tests.some(([rel]) => rel === "thincoder-core/test/model-specs.test.mjs"), false, "本档上段旧取值断言已删（§6 删除行账）")
})

// ─── 批 2026-09-20-channel-onboarding（设计 `docs/core/design/MODEL-SPECS.md` §9 · 用例 A-1..A-12）───
// TokenHub（hy3 族三行）+ 火山方舟（doubao-seed-2-0 两行）入登记面。断言面 = 行为面（查表返回形状 +
// 显式字段值）；唯一文本锚 = A-4 行注证据等级词（AC-2 要求等级落行注，行注即交付物本体）。
const HY3 = "hy3"
const HY3_PREVIEW = "hy3-preview"
const HY4_PREVIEW = "hy4-preview"
const SEED_CODE = "doubao-seed-2-0-code-preview-260215"
const SEED_LITE = "doubao-seed-2-0-lite-260428"
/** 两族同值集的七值序（服务端原文序 · 首项 none——D-5 禁按强度重排）。 */
const EFFORT_7_CH = ["none", "minimal", "low", "medium", "high", "xhigh", "max"]

/** 行注提取：表字面量中该行**上方紧邻**的 `//` 注释块（证据等级词在此，值仍走运行时查表）。 */
function rowNote(name) {
  const lines = SPEC_SOURCE.split("\n")
  const at = lines.findIndex((l) => l.trimStart().startsWith(`["${name}",`))
  assert.ok(at > 0, `表内存在 ${name} 行（防空扫）`)
  const note = []
  for (let i = at - 1; i >= 0 && lines[i].trimStart().startsWith("//"); i--) note.unshift(lines[i])
  assert.ok(note.length > 0, `${name} 行注在场（AC-2：证据等级须逐条落行注）`)
  return note.join("\n")
}

test("[onboard] A-1 hy3 独立行：thinking + effort 七值受理集 + 尺寸两级（视觉不声明）", () => {
  assert.equal(specMatch(HY3).matched, true, "命中独立行（非兜底）")
  assertFields(HY3, { context: 256_000, maxOutput: 128_000, thinking: true, thinkApi: "effort", reasoningEffortEnum: EFFORT_7_CH })
  assert.equal(specForModel(HY3).multimodal, undefined, "视觉 = 不声明（实测无视觉：纯红图答 Unknown）")
  assert.equal(specForModel(HY3).reasoningEcho, undefined, "reasoningEcho 不声明（optional 即现状默认，字节等价）")
})

test("[onboard] A-2 seed-code 独立行：七档真校验集 + 视觉 + 131_072 输出", () => {
  assert.equal(specMatch(SEED_CODE).matched, true, "命中独立行（非兜底）")
  assertFields(SEED_CODE, { context: 256_000, maxOutput: 131_072, thinking: true, thinkApi: "effort", reasoningEffortEnum: EFFORT_7_CH, multimodal: true })
})

test("[onboard] A-3 seed-lite 与 A-2 字段同值但自成一行（同族全针，非别名）", () => {
  assert.equal(specMatch(SEED_LITE).matched, true, "命中独立行（非兜底）")
  assertFields(SEED_LITE, { context: 256_000, maxOutput: 131_072, thinking: true, thinkApi: "effort", reasoningEffortEnum: EFFORT_7_CH, multimodal: true })
  assert.notEqual(specForModel(SEED_LITE), specForModel(SEED_CODE), "两档 = 两条独立行对象（同值集 ≠ 同行）")
})

test("[onboard] A-4 未证字段行注证据等级词逐字在场（参考实配 / 网络口径 / 官方 / 受理级 / 同族沿用）", () => {
  const required = [
    [HY3, ["参考实配", "网络口径", "受理级"]],
    [HY3_PREVIEW, ["未探针", "参考实配", "网络口径"]],
    [HY4_PREVIEW, ["未探针", "同族沿用", "参考实配"]],
    [SEED_CODE, ["官方口径", "实测", "真校验"]],
    [SEED_LITE, ["官方口径", "实测"]],
  ]
  for (const [name, words] of required) {
    const note = rowNote(name)
    for (const w of words) assert.ok(note.includes(w), `${name} 行注含「${w}」（AC-2 证据等级面）`)
  }
})

test("[onboard] A-5 两 preview = 仅尺寸行：能力位全不声明（不跨名沿用——D-11）", () => {
  for (const name of [HY3_PREVIEW, HY4_PREVIEW]) {
    assert.equal(specMatch(name).matched, true, `${name} 命中独立行`)
    const spec = specForModel(name)
    assert.deepEqual(Object.keys(spec).sort(), ["context", "maxOutput"], `${name} 仅尺寸行（无能力位）`)
    assert.equal(spec.thinking, undefined, `${name}.thinking 不声明`)
    assert.equal(spec.thinkApi, undefined, `${name}.thinkApi 不声明（VSC 档位空 = 已认账代价）`)
    assert.equal(spec.multimodal, undefined, `${name}.multimodal 不声明`)
  }
})

test("[onboard] A-6 deepseek 族零回归：v4-flash 仍命中同名行（type 面 + 384 000）", () => {
  assertFields("deepseek-v4-flash", { context: 1_000_000, maxOutput: 384_000, thinkApi: "type", prefixMode: true, reasoningEffortEnum: ["low", "high", "max"] })
})

test("[onboard] A-7 glm-5.3 仍命中既有行（无渠道限定行——D-12）", () => {
  const r = specMatch("glm-5.3")
  assert.equal(r.matched, true, "命中既有行")
  assertFields("glm-5.3", { maxOutput: 128_000, noUsageStream: true, tempRange: [0, 1] })
  // D-12 结构面：`<渠道>/<模型名>` 必须解析到裸名**同一行对象**——查表先按前缀命中、未中再剥
  // namespace 重试（`model-specs.mjs:160-169`）⇒ 一旦新增按渠道分叉的限定行，限定形态即偏离裸名
  // 行 ⇒ 本处红。（范围 = 本批两渠道 + 四种转售价 + 两族新行；既有 `kimi/kimi-k3` 别名行为
  // 历史文档锛，不在本批判定面。）
  for (const bare of ["glm-5.3", "kimi-k3", "deepseek-v4-flash", "MiniMax-M3", HY3, SEED_CODE]) {
    const ref = specForModel(bare)
    for (const ch of ["tokenhub", "volcengine"]) {
      assert.equal(specForModel(`${ch}/${bare}`), ref, `${ch}/${bare} ≡ ${bare}（渠道限定行不得分叉取值）`)
    }
  }
})

test("[onboard] A-8 kimi-k3 命中既有行且 partialMode 原样（转售通道未验 = 认账不改行）", () => {
  assert.equal(specMatch("kimi-k3").matched, true, "命中既有行")
  assertFields("kimi-k3", { maxOutput: 131_072, partialMode: true, thinkApi: "effort", reasoningEffortEnum: ["low", "high", "max"] })
})

test("[onboard] A-9 未在册名落默认面 + 告警一次（不补托底行——D-12）", () => {
  const warns = []
  const orig = console.warn
  console.warn = (...a) => warns.push(a.join(" "))
  try {
    const r = specMatch("deepseek-v3.1")
    assert.equal(r.matched, false, "无行 ⇒ 兜底")
    assert.equal(r.spec.context, 128_000, "退化形状 = 128K")
    assert.equal(r.spec.maxOutput, 32_000, "退化形状 = 32K")
    specForModel("deepseek-v3.1")
    assert.equal(warns.length, 1, "告警恰一次（同进程名级去重）")
    assert.match(warns[0], /deepseek-v3\.1/, "告警点名该模型")
  } finally { console.warn = orig }
  assert.equal(TABLE_ROW_NAMES.includes("deepseek-v3.1"), false, "不补托底行")
})

/** §9.5 方舟 schema 剥除层的复访条件：自有工具 schema 一旦用上这些关键字，兼容层须回裁。 */
const TOOL_SCHEMA_KEYWORDS = ["minLength", "maxLength", "minItems", "maxItems", "minContains", "maxContains"]

test("[onboard] A-10 方舟兼容层复访护栏：tools/ 内六关键字命中 0（§9.5 判据②）", () => {
  const hits = []
  let scanned = 0
  const walkTools = (dir) => {
    for (const ent of readdirSync(dir, { withFileTypes: true })) {
      const abs = join(dir, ent.name)
      if (ent.isDirectory()) { walkTools(abs); continue }
      if (!ent.name.endsWith(".mjs")) continue
      scanned += 1
      const src = readFileSync(abs, "utf8")
      for (const kw of TOOL_SCHEMA_KEYWORDS) if (src.includes(kw)) hits.push(`${relative(REPO_ROOT, abs)}: ${kw}`)
    }
  }
  walkTools(join(REPO_ROOT, "thincoder-core", "tools"))
  assert.ok(scanned >= 15, `扫描须覆盖 tools/ 全部档（防扫描面收窄 / 路径漂移空扫）：实扫 ${scanned} 档`)
  assert.deepEqual(TOOL_SCHEMA_KEYWORDS.filter((kw) => '{"minLength":1}'.includes(kw)), ["minLength"], "正控：命中判据本身有区分力（针入即报）")
  assert.deepEqual(hits, [], "关键字入自有 schema ⇒ 兼容层复访条件成立（须回 §9.5 重裁）")
})

test("[onboard] A-11 既有族零回归 + 五新行不遮蔽任何基线名（SORTED_SPECS 降序面）", () => {
  for (const [name, fields] of FAMILY_BASELINE) assertFields(name, fields)
  assertFields(FLASH_37, { context: 1_000_000, ...QWEN_FIELDS, reasoningEffortEnum: EFFORT_6 })
  assertFields(FLASH_38, { context: 1_000_000, ...QWEN_FIELDS, reasoningEffortEnum: EFFORT_7 })
  for (const n of [HY3, HY3_PREVIEW, HY4_PREVIEW, SEED_CODE, SEED_LITE]) {
    for (const [base] of FAMILY_BASELINE) assert.equal(base.startsWith(n), false, `${base} 不被 ${n} 前缀遮蔽`)
  }
})

test("[onboard] A-12 两族枚举各自七值且行独立（受理级 ≠ 校验级，互不污染）", () => {
  const hy3Spec = specForModel(HY3)
  assert.deepEqual(hy3Spec.reasoningEffortEnum, EFFORT_7_CH, "hy3 = 七值受理集")
  assert.deepEqual(specForModel(SEED_CODE).reasoningEffortEnum, EFFORT_7_CH, "seed-code = 七值真校验集（同值集）")
  assert.notEqual(hy3Spec.reasoningEffortEnum, specForModel(SEED_CODE).reasoningEffortEnum, "两族数组非同一实例（行独立）")
  const saved = hy3Spec.reasoningEffortEnum
  assert.equal(specForModel(HY3), hy3Spec, "返回体 = 表行活对象（非逐调用拷贝 ⇒ 下方「改一行不动另一行」判据有区分力）")
  try {
    hy3Spec.reasoningEffortEnum = ["none"]
    assert.deepEqual(specForModel(HY3).reasoningEffortEnum, ["none"], "改写回读可见（同一对象）")
    assert.deepEqual(specForModel(SEED_CODE).reasoningEffortEnum, EFFORT_7_CH, "改 hy3 行 ⇒ seed 行不受影响")
    assert.deepEqual(specForModel(SEED_LITE).reasoningEffortEnum, EFFORT_7_CH, "seed-lite 行亦独立")
  } finally {
    hy3Spec.reasoningEffortEnum = saved
  }
  assert.deepEqual(specForModel(HY3).reasoningEffortEnum, EFFORT_7_CH, "还原（防泄漏至后续用例）")
})

// ─── 批 2026-09-20-glm53-flashx-row（设计 `docs/core/design/MODEL-SPECS.md` §10 · 用例 F-1..F-5）───
// `glm-5.3-flashx` 独立规格行入登记面（不再蹭 `glm-5.3-flash` 前缀行）。断言面 = 行为面
// （查表返回形状 + 显式字段值）；文本锚仅 F-5 行注证据等级词（AC-2——行注即交付物本体，
// 循上段 A-4 先例）。「族沿用」字段的期望值 = 实读 flash 行现行键集/值逐字（§10.3 推导规则）。
const FLASHX = "glm-5.3-flashx"
const GLM_FLASH = "glm-5.3-flash"

test("[flashx] F-1 独立行命中：specMatch matched 且 maxOutput 131_072（≠ flash 行 128_000，排序面同证）", () => {
  const r = specMatch(FLASHX)
  assert.equal(r.matched, true, "命中独立行（非前缀兜底蹭 flash 行）")
  assert.equal(r.spec.maxOutput, 131_072, "maxOutput = 校验级实测 131_072（≠ 128_000）")
  assert.equal(r.spec.context, 1_000_000, "context = 族口径 1M（非 128K 兜底）")
  assert.notEqual(specForModel(FLASHX), specForModel(GLM_FLASH), "与 flash 行非同一对象（独立行）")
})

test("[flashx] F-2 全字段 deepEqual：实测/校验级字段显式 + 族沿用字段 = flash 行运行时实读（§10.3 推导规则）", () => {
  const spec = specForModel(FLASHX)
  // 实测 / 校验级字段（批档 §1.2 / §10.3 口径表）：
  assert.equal(spec.thinking, true, "thinking = 实测（disabled → 400；裸请求默认开）")
  assert.equal(spec.multimodal, true, "multimodal = 实测（8×8 纯红 PNG → 答「红色」）")
  assert.equal(spec.maxOutput, 131_072, "maxOutput = 校验级（400「max_tokens…[1,131072]」）")
  assert.deepEqual(spec.reasoningEffortEnum, ["low", "high", "max"], "枚举 = 校验级（400 原文点名 low/high/max）")
  // 族沿用字段 = flash 行**运行时实读**逐字（§10.3:762-765 推导规则——不照抄设计档字面清单，
  // 未声明键不进期望对象），仅 maxOutput 换校验级值 ⇒ 全字段 deepEqual（键集差 / 值差任一即红）：
  assert.deepEqual(spec, { ...specForModel(GLM_FLASH), maxOutput: 131_072 }, "全字段 deepEqual（实测/校验级 + 族沿用逐字）")
})

test("[flashx] F-3 glm 族回归零变化：glm-5.3 / glm-5.3-flash 逐字段不变（AC-3 · FAMILY_BASELINE 形状先例）", () => {
  // FAMILY_BASELINE 形状（§10.7 F-3 判据自引）：行为面字段逐项断言，D-10 信息性字段不入列；
  // flashx 对 flash 的信息性字段一致性由 F-2 运行时推导承载。
  assertFields("glm-5.3", FAMILY_BASELINE.find(([n]) => n === "glm-5.3")[1])
  assertFields(GLM_FLASH, {
    context: 1_000_000, maxOutput: 128_000, thinking: true, multimodal: true, thinkApi: "type",
    reasoningEcho: "optional", reasoningEffortEnum: ["low", "high", "max"], tempRange: [0, 1], noUsageStream: true,
  })
})

test("[flashx] F-4 表行在场：TABLE_ROW_NAMES 含 glm-5.3-flashx（防空扫）", () => {
  assert.ok(TABLE_ROW_NAMES.includes(FLASHX), "表行名提取须含新行（正则空扫防护同 [qwen] T-7）")
})

test("[flashx] F-5 行注证据词：实测 / 校验级 / 族沿用逐字在场 + 始终思考 no-op 句（AC-2 承载面）", () => {
  const note = rowNote(FLASHX)
  for (const w of ["实测", "校验级", "族沿用"]) {
    assert.ok(note.includes(w), `行注含「${w}」（AC-2 证据等级词）`)
  }
  assert.ok(note.includes("始终思考"), "行注含「始终思考」（§10.3 行注规格）")
  assert.ok(note.includes("no-op") && note.includes("服务端无关闭路径"), "行注含 off = UI 侧 no-op / 服务端无关闭路径句（§10.3 行注规格）")
})
