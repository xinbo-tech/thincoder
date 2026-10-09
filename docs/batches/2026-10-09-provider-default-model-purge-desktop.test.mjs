/**
 * 2026-10-09-provider-default-model-purge-desktop.test.mjs — 批内单测件（舱3 桌面 · A3 ∥ A4）。
 * 归档件（`docs/batches/` —— 不进 `test/` 树、不被仓级 runner 收集）；变更实施者自跑件。
 * 运行：`cd thincoder && node --test docs/batches/2026-10-09-provider-default-model-purge-desktop.test.mjs`
 *
 * 判据单源 = 批档 §2.1 A3/A4 ∥ `docs/desktop/design/IPC.md` §2（注 8①）∥ `docs/desktop/design/SETTINGS.md`
 * （§2.2 项 1 ∥ 项 2 ∥ §2.16 项 4）∥ `docs/desktop/design/COMPOSER.md` §2（fallback 两字面）。
 * 口径：
 *   - T1/T2/T3/T4/T6/T7 = 源码判据（视图族静态闭包含 `/rc/*` 浏览器专属导入 ⇒ 平 node 不可装载 ⇒ 扫描面断言）；
 *   - T5 = 行为桩测（`mount-settings-reads.mjs` 零导入 ⇒ 平 node 直接装载，注入 ask ∕ store 桩）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync, readdirSync, statSync } from "node:fs"
import { dirname, join, relative } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = join(HERE, "..", "..")
const DESKTOP = join(REPO, "thincoder-desktop")
const SKIP_DIRS = new Set(["node_modules", "dist", "dist-r3", "dist-r4", "build", "release", ".thincoder", ".git"])

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) walk(join(dir, entry.name), out)
    } else if (entry.isFile() && entry.name.endsWith(".mjs")) {
      out.push(join(dir, entry.name))
    }
  }
  return out
}

const FILES = [...walk(join(DESKTOP, "src")), ...walk(join(DESKTOP, "renderer"))]
const rel = (p) => relative(REPO, p).replace(/\\/g, "/")
const read = (p) => readFileSync(p, "utf8")
const find = (suffix) => FILES.filter((p) => rel(p).endsWith(suffix))
const scanAll = (re) => FILES.flatMap((p) => [...read(p).matchAll(re)].map((m) => `${rel(p)}:${m.index}`))

// ─── T1 A3：`backfillDefaultModel` 零引用（首跑补写支退场）────────────────────────────────
test("T1 A3：`backfillDefaultModel` 零引用（首跑补写支退场）", () => {
  const hits = scanAll(/backfillDefaultModel/g)
  assert.deepEqual(hits, [], `backfillDefaultModel 仍有引用：${hits.join(", ")}`)
})

// ─── T2 A3：`defaultModel` 写点 = 2（视图出口 ∥ 会话选定写回）──────────────────────────────
test("T2 A3：`defaultModel` 配置写点恰 2（视图出口 ∥ 会话选定写回）", () => {
  const mainWrites = scanAll(/disk\.defaultModel\s*=(?!=)/g) // 主侧配置写入（writeConfigAtomic 回调盘对象；`===` 排除）
  const rendererWrites = scanAll(/ask\(\s*"settings:agent",\s*\{\s*patch:\s*\{\s*defaultModel/g) // 渲染面出站写
  const points = [
    ...mainWrites.map((x) => `main:${x}`),
    ...rendererWrites.map((x) => `renderer:${x}`),
  ]
  assert.equal(points.length, 2, `写点计数 ≠ 2：\n${points.join("\n")}`)
  assert.equal(mainWrites.length, 1, "主侧配置写点应恰 1（会话选定写回）")
  assert.equal(rendererWrites.length, 1, "渲染面出站写点应恰 1（视图出口 useModel）")
  assert.ok(mainWrites[0].startsWith("thincoder-desktop/src/main/settings.mjs"), "主侧写点应住 settings.mjs（carryoverDefaultModel）")
})

// ─── T3 A4：渠道表单零 `name="model"` 控件 ∥ `datalist` 退场 ──────────────────────────────
test("T3 A4：渠道表单零 model 输入件 ∥ 零 datalist（校验钮在场）", () => {
  const controls = read(find("renderer/views/settings-controls.mjs")[0])
  assert.equal(/fieldPair\(\s*"model"/.test(controls), false, "model 输入件仍在（fieldPair(\"model\")）")
  assert.equal(/name:\s*"model"/.test(controls), false, "表单件仍携 name: \"model\"")
  assert.equal(/tag:\s*"datalist"|MODEL_CANDIDATE_LIST_ID|candidateListNode/.test(controls), false, "datalist 候选面构件仍在")
  assert.equal(/modelCandidates/.test(controls), false, "候选面入参仍在")
  assert.equal(/settings\.providers\.modelLabel/.test(controls), false, "移除件词键仍被表单消费")
  // 正控：渠道校验行（钮 + 状态行锚）仍在
  assert.ok(/data-fetch-models/.test(controls), "渠道校验行锚 `data-fetch-models` 缺席")
  assert.ok(/settings\.fetchModels/.test(controls), "渠道校验钮词键缺席")
  // 预设两段：标签 / 信息行收为 `name — desc` ∥ `baseURL`
  assert.equal(/preset\?\.model|preset\.model/.test(controls), false, "预设面仍读 model 键")
  assert.equal(/settings\.providers\.activeToggle/.test(controls), false, "复选词键仍被表单消费（fix 轮：激活渠复选退场）")
})

// ─── T4 A4：渠道行 sub 段零 model（`baseURL` 单段）────────────────────────────────────────
test("T4 A4：渠道行 sub 段零 model（`baseURL` 单段）", () => {
  const section = read(find("renderer/views/settings-sections-providers.mjs")[0])
  assert.equal(/row\?\.model|row\.model/.test(section), false, "sub 段仍读行 `model`")
  assert.ok(/row\?\.baseURL|row\.baseURL/.test(section), "sub 段应读行 `baseURL`")
  const fn = section.match(/function subLineWord\(row\) \{[\s\S]*?\n\}/)
  assert.ok(fn !== null, "`subLineWord` 缺席")
  assert.equal(/model/.test(fn[0]), false, "`subLineWord` 仍读 model")
  assert.equal(/join\(/.test(fn[0]), false, "`subLineWord` 仍为多段拼串")
  assert.ok(/baseURL/.test(fn[0]), "`subLineWord` 应读 `baseURL`")
  // 添加弹窗体不再向表单传候选（`modelCandidates` 退场）
  assert.equal(/modelCandidates/.test(section), false, "`providerAddBody` 仍传 `modelCandidates`")
})

// ─── T5 A4：两读数由 `defaultModel` 复合串直读（桩测：复合串 ⇒ 两读数）────────────────────
test("T5 A4：激活渠道 ∥ 当前模型两读数 = 回执 `defaultModel` 复合串直读", async () => {
  const { createReads } = await import(pathToFileURL(join(DESKTOP, "renderer/mount-settings-reads.mjs")).href)

  const drive = async (receipt) => {
    let state = { settings: {} }
    const calls = []
    const reads = createReads({
      ask: async (channel, payload) => {
        calls.push({ channel, payload })
        if (channel === "provider:list") return receipt
        return { ok: true, models: [] }
      },
      store: { get: () => state },
      setSettings: (patch) => { state = { ...state, settings: { ...state.settings, ...patch } } },
      report: () => {},
    })
    await reads.loadProviders()
    return { settings: state.settings, calls }
  }

  const rows = [{ name: "alpha", shape: "custom", baseURL: "https://api.example", hasKey: true, maskedKey: "••••", active: true, proxy: false }]

  // 正控：复合串在场 ⇒ 渠道 = 段前、当前 = 全串；候选面按该渠取数（`model:list`）
  const hit = await drive({ ok: true, active: "alpha", defaultModel: "alpha:m1", providers: rows, presets: [] })
  assert.equal(hit.settings.model.provider, "alpha")
  assert.equal(hit.settings.model.current, "alpha:m1")
  assert.equal(hit.settings.defaultModel, "alpha:m1", "存储切片 `defaultModel` 应同源落值")
  assert.ok(hit.calls.some((c) => c.channel === "model:list" && c.payload?.provider === "alpha"), "候选面应按复合串渠段取数")

  // 缺档：`defaultModel` 缺（即便 `active` 有值）⇒ 两读数 `null` ⇒ 全渠扇出（#842 缺 defaultModel 态）
  const missing = await drive({ ok: true, active: "alpha", defaultModel: null, providers: rows, presets: [] })
  assert.equal(missing.settings.model.provider, null)
  assert.equal(missing.settings.model.current, null)
  assert.equal(missing.settings.defaultModel, null)
  assert.ok(missing.calls.some((c) => c.channel === "model:catalog"), "缺 composite ⇒ 应走全渠扇出 `model:catalog`")

  // 畸形：无冒号 / 冒号段空 ⇒ 两读数 `null`（未知不造串）
  for (const bad of ["alpha", "alpha:", ":m1"]) {
    const malformed = await drive({ ok: true, active: "alpha", defaultModel: bad, providers: rows, presets: [] })
    assert.equal(malformed.settings.model.provider, null, `畸形串 ${JSON.stringify(bad)} ⇒ provider 应 null`)
    assert.equal(malformed.settings.model.current, null, `畸形串 ${JSON.stringify(bad)} ⇒ current 应 null`)
  }
})

// ─── T6 A4：fallback 两字面（逐字 ∥ 按载荷 `model` 在场分）───────────────────────────────
test("T6 A4：fallback 行两字面逐字 ∥ 路由按载荷 `model` 在场分", async () => {
  const { VIEWS_DICT } = await import(pathToFileURL(join(DESKTOP, "renderer/i18n-views.mjs")).href)
  const zh = VIEWS_DICT.zh
  const en = VIEWS_DICT.en
  // 现字面（在场）—— 逐字不动
  assert.equal(zh["composer.send.noDefaultModelFallback"], "默认模型未设置或无效 — 正在使用可用渠道")
  assert.equal(en["composer.send.noDefaultModelFallback"], "Default model missing or invalid — using an available channel")
  // 未设置变体（缺档）—— 澄清半句「— 渠道可用、模型未定」逐字（设计字面 = COMPOSER.md §2）
  assert.equal(zh["composer.send.noDefaultModelFallbackUnset"], "默认模型未设置 — 渠道可用、模型未定")
  assert.equal(en["composer.send.noDefaultModelFallbackUnset"], "Default model missing — channel available, model not chosen")
  assert.ok(zh["composer.send.noDefaultModelFallbackUnset"].includes("— 渠道可用、模型未定"), "缺档字面须含设计澄清半句")
  // 路由：`face.model` 在场分（两键皆被消费）
  const sync = read(find("renderer/composer-sync.mjs")[0])
  assert.ok(/face\.model/.test(sync), "路由判据 `face.model` 缺席")
  assert.ok(/composer\.send\.noDefaultModelFallback"/.test(sync), "现字面键未被消费")
  assert.ok(/composer\.send\.noDefaultModelFallbackUnset/.test(sync), "缺档字面键未被消费")
  assert.equal(/data-notice": "provider-fallback"/.test(sync), true, "行锚 `data-notice=\"provider-fallback\"` 缺席")
})

// ─── T7 A3：`provider:list` 回执（行去 `model` ∥ 增 `defaultModel`）∥ `provider:save` 载荷收窄 ──
test("T7 A3：`provider:list` 行去 model ∥ 顶层增 defaultModel；`provider:save` 载荷去 model/active", () => {
  const main = read(find("src/main/providers.mjs")[0])
  // 回执：行不再携 `model`；顶层增 `defaultModel`（读数直读载荷载体）
  assert.equal(/typeof p\.model === "string"/.test(main), false, "行面仍携 `model` 键")
  assert.ok(/defaultModel: typeof defaultModel === "string"/.test(main), "回执顶层 `defaultModel` 键缺席")
  assert.ok(/const defaultModel = loadConfig\(\)\?\.defaultModel/.test(main), "`defaultModel` 应取 `loadConfig` 单源")
  // 写口：`model` ∥ `active` 参与缺省补写全退
  assert.equal(/payload\?\.active/.test(main), false, "`provider:save` 仍读 `active` 参")
  assert.equal(/payload\?\.model|model: String\(payload\?\.model/.test(main), false, "`provider:save` 仍读 `model` 参")
  assert.ok(/customFieldsError\(\{ baseURL, format \}\)/.test(main), "自定形必填步序应去 model（baseURL → format）")
  // 预设面投影去 `model`
  assert.equal(/model: preset\.model/.test(main), false, "`presetChoices` 仍转发 `model`")
})

// ─── T8 清除批 fix 轮：向导步 1 `active` 复选退场（件 ∥ 参 ∥ 词键全舱零残留）──────────────────
test("T8 fix 轮：`active` 复选 ∥ 其条件参 ∥ 词键全舱零残留（注释亦零字面 ∥ 向导表单仍在——零误删）", async () => {
  // 全树零引用（沿 T1 `backfillDefaultModel` 同法——参 ∥ 件 ∥ 注释一并不留字面）
  const hits = scanAll(/activeDefault/g)
  assert.deepEqual(hits, [], `activeDefault 仍有引用：${hits.join(", ")}`)
  const controls = read(find("renderer/views/settings-controls.mjs")[0])
  assert.equal(/for:\s*"active"|id:\s*"active"|name:\s*"active"/.test(controls), false, "active 复选节点签名（for ∥ id ∥ name）仍在件")
  // 词键随件净删（无消费者——`SETTINGS.md` §2.16 项 9「无消费者，随实现净删」）
  const { SETTINGS_DICT } = await import(pathToFileURL(join(DESKTOP, "renderer/i18n-settings.mjs")).href)
  for (const locale of ["en", "zh"]) {
    assert.equal("settings.providers.activeToggle" in SETTINGS_DICT[locale], false, `词键未净删（${locale}）`)
  }
  // 正控：向导步 1 表单仍在（仅复选 ∥ 参退场——零误删）
  const onboarding = read(find("renderer/views/onboarding.mjs")[0])
  assert.ok(/channelFormTree\(/.test(onboarding), "向导步 1 表单构建点缺席（误删）")
  assert.ok(/submitKey: "wizard\.save"/.test(onboarding), "向导步 1 提交词键缺席（误删）")
})
