/**
 * 2026-10-06-models-config.test.mjs — thincoder-server 批内单测件·纯函数/静态面（服务模型配置面批·AC-17 机检载体；
 * 名随批档 · 住 `docs/batches/` · 不入仓套件 · 随批留存）。
 * **拆档先例**（PROJECT.md 注⑧「越 500 硬线 ⇒ 沿注③拆档预案」）：全腿 = 本件 ＋ `2026-10-06-models-config-ui.test.mjs`
 * （运行面：真网关腿 ②④ ∥ 桩 DOM 腿 ⑦）——两件同入 `prepublishOnly`。
 * 运行（自 `thincoder/` 仓根）：`node --test docs/batches/2026-10-06-models-config.test.mjs`
 *
 * 射程（判据源 = `webui/WEBUI.md` §6 AC-17 ∥ AC-17（续）行 + 本批档 §2；腿 ↔ 轴对照在括号）：
 *   ① A 停用侧件 + 线形侧件（纯函数）：`modelsWithout` 减项 ∥ `draftFromSettings` 初值 ∥
 *      `settingsValueFromDraft` 全字段对象（含 `quotaTokens`——≥0 整数；空/清空 = 显式 `null` ∥ 非法 ⇒ `{invalid}`）
 *   ③ C 限流（纯函数/桩时钟）：rpm ∥ tpm ∥ 窗滚恢复 ∥ 空限值 = 零状态 ∥ `Retry-After` 秒
 *   ⑤ settings 线形（服务端件）：`mergeProviderSettings` 键级合并（值整对象替换 ∥ null 删键 ∥ 未出现键不动）∥
 *      `validateProviderSettings` 全子字段归一 ∥ 非法判据 ∥ 前端线形 × 合并 × 单源校验（部分字段保存 ⇒ 其余保留 ∥
 *      单字段清空 = 显式 `null` 不误伤）
 *   ⑥ D 快照：`specForDisplay` 前缀查表（大小写不敏感 ∥ 命名空间剥离）∥ 未知 ⇒ `null`（零兜底）∥
 *      漂移件（核 `model-specs.mjs` 只读对照——逐行三值同拍）
 *   ⑧ i18n：两表键集相等（除自称名族）∥ en 零 CJK ∥ 占位符一致 ∥ 本批新键在册 ∥ `configSkeleton` 退役 ∥
 *      E 注在册 ∥ `err.rate_limited` 入映射集（`mapError` 行为直测）
 *   ⑨ 静态面：档目 31 ∥ 32 ∥ 零外链 ∥ 键引用闭合 ∥ 新档静态直发（200 ∥ text/javascript）
 *   ⑩ 门禁清单：`prepublishOnly` 含本批两件 ∥ 清单目标在盘
 */
import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, readdirSync, readFileSync } from "node:fs"
import { createServer as createHttpServer } from "node:http"
import { join } from "node:path"
import { pathToFileURL } from "node:url"

const ROOT = process.cwd()
if (!existsSync(join(ROOT, "thincoder-server"))) throw new Error(`须从仓库根（thincoder/）运行——cwd = ${ROOT}`)
const PUBLIC_DIR = join(ROOT, "thincoder-server", "public")
const load = (name) => import(pathToFileURL(join(PUBLIC_DIR, name)).href)
const loadAt = (rel) => import(pathToFileURL(join(ROOT, rel)).href)

// 前端件（顶层零浏览器全局 ⇒ node 直 import 即形断言）
const [{ ZH }, { EN }, I18N, MODELS, SNAPSHOT] = await Promise.all([
  load("i18n-zh.mjs"), load("i18n-en.mjs"), load("i18n.mjs"), load("views-models.mjs"), load("model-specs-snapshot.mjs"),
])
// 服务端件（纯函数面）
const CONFIG = await loadAt("thincoder-server/src/ops/config.mjs")
const RL = await loadAt("thincoder-server/src/gateway/ratelimit.mjs")
const PROVIDER_ADMIN = await loadAt("thincoder-server/src/gateway/provider-admin.mjs")
const STATIC = await loadAt("thincoder-server/src/webui/static.mjs")
const CORE = await loadAt("thincoder-core/model-specs.mjs") // 只读对照（漂移件取数——非运行期依赖，KD-SV-2 运行期面零涉）
const PKG = JSON.parse(readFileSync(join(ROOT, "thincoder-server", "package.json"), "utf8"))

/** CJK 机检类（Han ∥ CJK 标点 ∥ 全角形——「—」「…」等中性标点不在内）。 */
const CJK = /[\u3000-\u303f\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff00-\uffef]/
/** 自称名族（仅 zh 表载体——切换器固定取 zh 表）。 */
const SELF_NAMES = ["lang.zh", "lang.en"]
/** 本批新键（§2.2 键族——两表逐键同步；净 ≈+26 = 新增 27 ∥ 退役 1）。 */
const NEW_KEYS = [
  "admin.models.status", "admin.models.open", "admin.models.disable", "admin.models.disableHint",
  "admin.models.disableConfirm", "admin.models.disabled",
  "admin.models.rateTitle", "admin.models.rpm", "admin.models.tpm", "admin.models.rateHint",
  "admin.models.metaTitle", "admin.models.context", "admin.models.maxOutput", "admin.models.multimodal",
  "admin.models.notCollected", "admin.models.metaHint", "admin.models.note",
  "admin.models.weightTitle", "admin.models.costIn", "admin.models.costOut", "admin.models.weightHint",
  "admin.models.weightNote", "admin.models.saved", "admin.models.invalidNumber",
  "admin.models.rulePositive", "admin.models.ruleNonNegative", "err.rate_limited",
]
/** 退役键（骨架占位随字段落地删净——§2.2；两表皆不得在册）。 */
const RETIRED_KEYS = ["admin.models.configSkeleton"]
const placeholders = (text) => [...String(text).matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort().join(",")
const fill = (text, params) => text.replace(/\{(\w+)\}/g, (match, name) => (name in params ? String(params[name]) : match))

// ── ① 纯函数（A 停用侧件 ∥ 线形侧件）────────────────────────────────────────

test("① 纯函数：`modelsWithout` 减项 ∥ `draftFromSettings` 初值 ∥ `settingsValueFromDraft` 全字段对象（空/清空 = 显式 null）", () => {
  // A 停用 = models 减项（余序保持 ∥ 未知名 ∥ 空表零变）
  assert.deepEqual(MODELS.modelsWithout(["a", "b", "c"], "b"), ["a", "c"])
  assert.deepEqual(MODELS.modelsWithout(["a"], "a"), [])
  assert.deepEqual(MODELS.modelsWithout(["a"], "nope"), ["a"])
  assert.deepEqual(MODELS.modelsWithout(null, "a"), [])
  // 草稿初值 = GET 行 settings 该键值（部分字段编辑不丢其余字段）；未设 ⇒ 空串
  assert.deepEqual(MODELS.draftFromSettings({ m1: { rpm: 5, tpm: null, costIn: 0.25, costOut: 0, note: "hi", quotaTokens: 500 } }, "m1"),
    { rpm: "5", tpm: "", costIn: "0.25", costOut: "0", quotaTokens: "500", note: "hi" })
  assert.deepEqual(MODELS.draftFromSettings({}, "m1"), { rpm: "", tpm: "", costIn: "", costOut: "", quotaTokens: "", note: "" })
  assert.deepEqual(MODELS.draftFromSettings(undefined, "m1"), { rpm: "", tpm: "", costIn: "", costOut: "", quotaTokens: "", note: "" })
  // 值对象 = 全子字段在册（空 ⇒ 显式 null）；数值归一（trim ∥ 数值化）；说明 trim ∥ 空 ⇒ null
  const empty = MODELS.settingsValueFromDraft({})
  assert.deepEqual(empty.value, { rpm: null, tpm: null, costIn: null, costOut: null, quotaTokens: null, note: null })
  assert.deepEqual(Object.keys(empty.value).sort(), ["costIn", "costOut", "note", "quotaTokens", "rpm", "tpm"])
  assert.deepEqual(MODELS.settingsValueFromDraft({ rpm: " 5 ", tpm: "100", costIn: "0.25", costOut: "0", quotaTokens: "1000", note: " hi " }).value,
    { rpm: 5, tpm: 100, costIn: 0.25, costOut: 0, quotaTokens: 1000, note: "hi" })
  // 非法 ⇒ { invalid: { field, ruleKey } }（就地提示——不提交；服务端复核为准）
  const cases = [["rpm", "0", "rulePositive"], ["rpm", "1.5", "rulePositive"], ["rpm", "abc", "rulePositive"], ["rpm", "-1", "rulePositive"], ["tpm", "0", "rulePositive"],
    ["costIn", "-1", "ruleNonNegative"], ["costIn", "x", "ruleNonNegative"], ["costOut", "-0.5", "ruleNonNegative"],
    ["quotaTokens", "-1", "ruleNonNegativeInt"], ["quotaTokens", "1.5", "ruleNonNegativeInt"], ["quotaTokens", "abc", "ruleNonNegativeInt"]]
  for (const [field, raw, rule] of cases) {
    assert.deepEqual(MODELS.settingsValueFromDraft({ [field]: raw }).invalid, { field, ruleKey: `admin.models.${rule}` }, `${field}=${raw}`)
  }
})

// ── ③ C 限流（纯函数/桩时钟）─────────────────────────────────────────────────

test("③ C 限流：rpm ∥ tpm ∥ 窗滚恢复（定窗 60s）∥ 空限值 = 零状态 ∥ `Retry-After` 秒（≥1）", () => {
  let ts = 1_800_000_000_000
  const limiter = RL.createRateLimiter({ windowMs: RL.RATE_LIMIT_WINDOW_MS, now: () => ts })
  assert.equal(RL.RATE_LIMIT_WINDOW_MS, 60000)
  // rpm：通过 ⇒ 计次；满 ⇒ 拒（拒不计次）
  assert.deepEqual(limiter.check("p", "m", { rpm: 1 }), { limited: false, tracked: true })
  const denied = limiter.check("p", "m", { rpm: 1 })
  assert.deepEqual([denied.limited, denied.dimension, denied.limit], [true, "rpm", 1])
  assert.equal(denied.retryAfterS, RL.retryAfterSeconds(ts, RL.windowIndexOf(ts)))
  assert.ok(Number.isInteger(denied.retryAfterS) && denied.retryAfterS >= 1 && denied.retryAfterS <= 60, `retryAfterS=${denied.retryAfterS}`)
  // 键隔离：另模型 ∥ 另 provider 不受限
  assert.deepEqual([limiter.check("p", "m2", { rpm: 1 }).limited, limiter.check("p2", "m", { rpm: 1 }).limited], [false, false])
  // 窗滚（定窗）：+60s ⇒ 新窗新桶 ⇒ 放行
  ts += RL.RATE_LIMIT_WINDOW_MS
  assert.deepEqual(limiter.check("p", "m", { rpm: 1 }), { limited: false, tracked: true })
  // tpm：token 于到达计入（record）；达限 ⇒ 拒
  const tpm = RL.createRateLimiter({ windowMs: RL.RATE_LIMIT_WINDOW_MS, now: () => ts })
  assert.deepEqual(tpm.check("p", "m", { tpm: 100 }), { limited: false, tracked: true })
  tpm.record("p", "m", 60)
  assert.equal(tpm.check("p", "m", { tpm: 100 }).limited, false) // 60 < 100 ⇒ 再计次
  tpm.record("p", "m", 40) // 60 + 40 = 100 ⇒ 达限
  const tpmDenied = tpm.check("p", "m", { tpm: 100 })
  assert.deepEqual([tpmDenied.limited, tpmDenied.dimension, tpmDenied.limit], [true, "tpm", 100])
  tpm.record("p", "m", null) // 失败/断开（无效值）⇒ no-op 不计
  ts += RL.RATE_LIMIT_WINDOW_MS
  assert.equal(tpm.check("p", "m", { tpm: 100 }).limited, false, "窗滚 ⇒ token 计数归零")
  // 空限值 = 零状态（零计次——不建桶）
  const idle = RL.createRateLimiter({ windowMs: RL.RATE_LIMIT_WINDOW_MS, now: () => ts })
  assert.deepEqual([idle.check("p", "m", {}), idle.check("p", "m", { rpm: null, tpm: null })], [{ limited: false, tracked: false }, { limited: false, tracked: false }])
})

// ── ⑤ settings 线形（服务端件——键级合并 ∥ 全子字段归一 ∥ 非法判据）──────────

test("⑤ settings 线形：`mergeProviderSettings` 键级合并（值整对象替换 ∥ null 删键 ∥ 未出现键不动——含 `quotaTokens`）∥ 全子字段归一 ∥ 非法判据", () => {
  const merge = PROVIDER_ADMIN.mergeProviderSettings
  const current = { m1: { rpm: 5, tpm: 100, costIn: 0.1, costOut: 0.2, note: "keep", quotaTokens: 500 }, m2: { rpm: 1, tpm: null, costIn: null, costOut: null, note: null, quotaTokens: null } }
  // 未出现键 = 不动（字段缺省 ⇒ 现值原样）
  assert.deepEqual(merge(current, undefined), current)
  // 出现的键 = 整对象替换；同请求其余键不动
  const replaced = merge(current, { m1: { rpm: 9, tpm: null, costIn: null, costOut: null, note: null, quotaTokens: null } })
  assert.deepEqual(replaced, { ...current, m1: { rpm: 9, tpm: null, costIn: null, costOut: null, note: null, quotaTokens: null } })
  // 值 null ⇒ 删键（同请求其余键不动）
  assert.deepEqual(merge(current, { m1: null }), { m2: current.m2 })
  // 非法形 ⇒ 抛（映射层；转 400 归调用方）
  for (const bad of [null, [], "x", 1]) assert.throws(() => merge(current, bad), /settings 须为对象/, String(bad))
  // 全子字段归一（未设 ⇒ 显式 null）；非法判据（未知子字段 ∥ 非正整数 ∥ 负/非数 ∥ quotaTokens 非 ≥0 整数 ∥ note 超 200）
  assert.deepEqual(CONFIG.validateProviderSettings({ m: { rpm: 5 } }), { m: { rpm: 5, tpm: null, costIn: null, costOut: null, note: null, quotaTokens: null } })
  assert.deepEqual(CONFIG.validateProviderSettings(undefined), {})
  for (const bad of [
    { m: null }, { m: [1] }, { m: { rpm: 0 } }, { m: { rpm: 1.5 } }, { m: { tpm: -1 } }, { m: { costIn: -0.1 } },
    { m: { costOut: "1" } }, { m: { quotaTokens: -1 } }, { m: { quotaTokens: 1.5 } }, { m: { quotaTokens: "1" } },
    { m: { note: "x".repeat(201) } }, { m: { bogus: 1 } }, { m: { note: 5 } },
  ]) assert.throws(() => CONFIG.validateProviderSettings(bad), /m/, JSON.stringify(bad))
  // 前端线形 × 服务端合并 × 单源校验（部分字段保存 ⇒ 其余字段保留 ∥ 单字段清空 = 显式 null 不误伤）
  const draft = MODELS.draftFromSettings(current, "m1")
  assert.deepEqual(draft, { rpm: "5", tpm: "100", costIn: "0.1", costOut: "0.2", quotaTokens: "500", note: "keep" })
  draft.rpm = "9" // 部分字段编辑
  const edited = MODELS.settingsValueFromDraft(draft)
  assert.deepEqual(edited.value, { rpm: 9, tpm: 100, costIn: 0.1, costOut: 0.2, quotaTokens: 500, note: "keep" })
  assert.deepEqual(CONFIG.validateProviderSettings(merge(current, { m1: edited.value })).m1, edited.value, "部分字段保存 ⇒ 其余字段保留")
  const cleared = MODELS.settingsValueFromDraft({ ...draft, tpm: "" })
  assert.deepEqual(cleared.value, { rpm: 9, tpm: null, costIn: 0.1, costOut: 0.2, quotaTokens: 500, note: "keep" })
  assert.deepEqual(CONFIG.validateProviderSettings(merge(current, { m1: cleared.value })).m1, cleared.value, "单字段清空 = 显式 null 不误伤")
})

// ── ⑥ D 快照（前缀查表 ∥ 未知零兜底 ∥ 漂移件）───────────────────────────────

test("⑥ D 快照：`specForDisplay` 前缀查表（大小写不敏感 ∥ 命名空间剥离）∥ 未知 ⇒ `null`（零兜底）∥ 漂移件（核表只读对照）", () => {
  // 前缀查表（最长前缀优先）
  assert.deepEqual(SNAPSHOT.specForDisplay("deepseek-flash"), { context: 1_000_000, maxOutput: 384_000, multimodal: true })
  assert.deepEqual(SNAPSHOT.specForDisplay("DeepSeek-Flash"), { context: 1_000_000, maxOutput: 384_000, multimodal: true }, "大小写不敏感")
  assert.deepEqual(SNAPSHOT.specForDisplay("k3-256k-x"), { context: 262_144, maxOutput: 131_072, multimodal: true }, "最长前缀优先（k3-256k 压 k3）")
  assert.deepEqual(SNAPSHOT.specForDisplay("hy3-preview"), { context: 256_000, maxOutput: 128_000 }, "未声明 multimodal ⇒ 位缺省")
  assert.deepEqual(SNAPSHOT.specForDisplay("zhipu/glm-5.3"), { context: 1_000_000, maxOutput: 128_000 }, "厂商命名空间剥离")
  // 未知 ⇒ null（零兜底——不套 DEFAULT_SPEC 128K/32K）
  assert.deepEqual([SNAPSHOT.specForDisplay("bge-m3"), SNAPSHOT.specForDisplay("no-such-model"), SNAPSHOT.specForDisplay(""), SNAPSHOT.specForDisplay(null)], [null, null, null, null])
  assert.notDeepEqual(SNAPSHOT.specForDisplay("no-such-model"), { context: 128_000, maxOutput: 32_000 })
  // 漂移件（核表只读对照——KD-SV-17 先例）：快照行 ⊆ 核表行 ∧ 行数同拍 ∧ 逐行三值同拍
  const coreSource = readFileSync(join(ROOT, "thincoder-core", "model-specs.mjs"), "utf8")
  const coreRows = [...coreSource.matchAll(/^\s*\["([^"]+)",\s*\{/gm)].map((match) => match[1])
  const snapshotRows = [...readFileSync(join(PUBLIC_DIR, "model-specs-snapshot.mjs"), "utf8").matchAll(/^\s*\["([^"]+)",/gm)].map((match) => match[1])
  assert.ok(snapshotRows.length >= 70, `快照行数不足：${snapshotRows.length}`)
  assert.deepEqual(snapshotRows, coreRows, "行集/行序漂移（核表更新 ⇒ 快照 ∥ 本件同改）")
  for (const name of snapshotRows) {
    const hit = CORE.specMatch(name)
    const spec = SNAPSHOT.specForDisplay(name)
    assert.equal(hit.matched, true, name)
    assert.deepEqual([spec.context, spec.maxOutput, spec.multimodal === true], [hit.spec.context, hit.spec.maxOutput, hit.spec.multimodal === true], name)
  }
})

// ── ⑧ i18n（两表 ∥ 新键/退役键 ∥ E 注 ∥ 映射集）─────────────────────────────

test("⑧ i18n：两表基键集相等 ∥ en 零 CJK ∥ 占位符一致 ∥ 新键在册 ∥ `configSkeleton` 退役 ∥ E 注在册 ∥ `err.rate_limited` 入映射集", () => {
  const zhKeys = Object.keys(ZH)
  const enKeys = Object.keys(EN)
  const enBase = enKeys.filter((key) => !key.endsWith(".one")) // `.one` 变体族 = 仅 en 表载体（KD-SV-44）
  for (const key of zhKeys.filter((key) => !SELF_NAMES.includes(key))) assert.ok(key in EN, `en 表缺键：${key}`)
  for (const key of enKeys) assert.ok(!CJK.test(EN[key]), `en 表含 CJK：${key}`)
  for (const key of enBase) {
    assert.ok(key in ZH, `en 表多出键：${key}`)
    assert.equal(placeholders(ZH[key]), placeholders(EN[key]), `占位符不一致：${key}`)
  }
  assert.equal(zhKeys.length - SELF_NAMES.length, enBase.length)
  assert.equal(NEW_KEYS.length, 27)
  for (const key of NEW_KEYS) assert.ok(key in ZH && key in EN, `本批新键缺位：${key}`)
  for (const key of RETIRED_KEYS) assert.ok(!(key in ZH) && !(key in EN), `退役键未删：${key}`)
  // E 注在册（显式圈界——内部估算参考 ∥ 非计费）
  assert.ok(ZH["admin.models.weightNote"].includes("内部估算参考") && ZH["admin.models.weightNote"].includes("非计费"), "E 注在册")
  // `err.rate_limited` 入映射集（行为直测：429 码 ⇒ 映射文案——`Retry-After` 秒注入；服务端原文不落文案）
  const mapped = I18N.mapError({ code: "rate_limited", message: "raw server message", retryAfter: 40 })
  assert.equal(mapped, fill(ZH["err.rate_limited"], { seconds: 40 }))
  assert.equal(mapped.includes("raw server message"), false)
  // 未知码 ⇒ 原文兜底（零遗漏——行为不破）
  assert.equal(I18N.mapError({ code: "brand_new_code", message: "raw" }), "raw")
})

// ── ⑨ 静态面（档目 31 ∥ 32 ∥ 零外链 ∥ 键引用闭合 ∥ 直发）────────────────────

test("⑨ 静态面：档目 31 ∥ 32 ∥ 零外链 ∥ 键引用闭合 ∥ 新档静态直发（200 ∥ text/javascript）", async () => {
  const names = readdirSync(PUBLIC_DIR).sort()
  assert.deepEqual([names.length, names.filter((name) => name !== "favicon.png").length], [32, 31], "全目录 32 ∥ UI 代码档 31（2026-10-10 沙盒运行面批 +1）")
  assert.deepEqual(names, [
    "app.mjs", "dom.mjs", "favicon.png", "health.mjs", "i18n-en-admin.mjs", "i18n-en-me.mjs", "i18n-en-shell.mjs", "i18n-en-system.mjs", "i18n-en.mjs", "i18n-zh-admin.mjs",
    "i18n-zh-me.mjs", "i18n-zh-shell.mjs", "i18n-zh-system.mjs", "i18n-zh.mjs", "i18n.mjs", "index.html", "modal.mjs", "model-specs-snapshot.mjs", "nav.mjs", "style.css",
    "views-admin.mjs", "views-audit.mjs", "views-auth.mjs", "views-me.mjs", "views-models.mjs", "views-overview.mjs", "views-providers-modals.mjs", "views-providers.mjs", "views-sandbox.mjs", "views-system-config.mjs", "views-system.mjs", "views-usage.mjs",
  ])
  for (const name of names) {
    const text = readFileSync(join(PUBLIC_DIR, name), "utf8")
    assert.deepEqual([/https?:\/\//.test(text), /@import/.test(text)], [false, false], `${name} 含外部引用（内网不达——KD-SV-9）`)
  }
  // 键引用闭合：`t("…")` 字面量 ⊆ 表键（全档扫面）∥ 两新档裸键字面量 ⊆ 表键
  const refs = []
  for (const name of names.filter((name) => name.endsWith(".mjs") && !name.startsWith("i18n-zh") && !name.startsWith("i18n-en"))) {
    const src = readFileSync(join(PUBLIC_DIR, name), "utf8")
    for (const match of src.matchAll(/\bt\(\s*"([^"]+)"\s*[,)]/g)) refs.push([name, match[1]])
    for (const match of src.matchAll(/\bt\(\s*'([^']+)'\s*[,)]/g)) refs.push([name, match[1]])
  }
  assert.ok(refs.length >= 200, `键引用过少（扫描失效？）：${refs.length}`)
  for (const [name, key] of refs) assert.ok(key in ZH && key in EN, `${name} 引用悬空键：${key}`)
  for (const name of ["views-models.mjs", "model-specs-snapshot.mjs"]) {
    const src = readFileSync(join(PUBLIC_DIR, name), "utf8")
    for (const match of src.matchAll(/["']([a-z][a-zA-Z0-9]*(?:\.[a-zA-Z0-9]+)+)["']/g)) {
      assert.ok(match[1] in ZH && match[1] in EN, `${name} 裸键字面量悬空：${match[1]}`)
    }
  }
  // 静态直发（200 ∥ text/javascript ∥ 字节 = 磁盘——真 static.mjs 句柄）
  const site = STATIC.createStaticSite()
  const server = createHttpServer((req, res) => {
    if (!site.serve(req, res, new URL(req.url, "http://localhost").pathname)) { res.writeHead(404); res.end() }
  })
  await new Promise((done) => server.listen(0, "127.0.0.1", done))
  try {
    const { port } = server.address()
    for (const name of ["model-specs-snapshot.mjs", "views-models.mjs"]) {
      const response = await fetch(`http://127.0.0.1:${port}/${name}`)
      assert.deepEqual([response.status, (await response.text()) === readFileSync(join(PUBLIC_DIR, name), "utf8")], [200, true], name)
      assert.match(response.headers.get("content-type"), /text\/javascript/, name)
    }
  } finally {
    server.closeAllConnections?.()
    await new Promise((done) => server.close(done))
  }
})

// ── ⑩ 门禁清单（`prepublishOnly` 含本批两件 ∥ 清单在盘）──────────────────────

test("⑩ 门禁清单：`prepublishOnly` 含本批两件 ∥ 清单目标在盘", () => {
  const batchFiles = PKG.scripts.prepublishOnly.match(/docs\/batches\/[^\s"]+/g) ?? []
  for (const file of ["docs/batches/2026-10-06-models-config.test.mjs", "docs/batches/2026-10-06-models-config-ui.test.mjs"]) {
    assert.ok(batchFiles.includes(file), `本批件应入列：${file}（现 ${batchFiles.length} 件）`)
  }
  for (const file of batchFiles) assert.ok(existsSync(join(ROOT, file)), `清单目标缺档：${file}`)
})
