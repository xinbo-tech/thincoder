/**
 * 2026-10-04-desktop-channel-tier-retire.test.mjs — 渠道档位退役批（桌面 · 台账 #902）批次本地单元件（随批留存归档）。
 * 名随批次档 · 住批次目录 · 不进仓套件；复跑 = 从仓库根 `thincoder/`：
 *   node --test docs/batches/2026-10-04-desktop-channel-tier-retire.test.mjs
 *
 * 腿（设计 §2「退役验证用例设计」+ U1 修正块腿 ⑥）：
 *   ① 控件零节点 ∥ 零导出面：`modelBody` = 当前读数 + 候选两段（零 `data-tier` ∥ 零 `select`）∧
 *      导出面不含 `tierFace` / `tierOptions` ∧ `settingsModel(…).model` 零 `tier` 键
 *   ② 写径拒收（KD-902-2）：`settingsAgent({ tier })` ⇒ `invalid-patch` ∧ 零写盘；
 *      `{ patch }` 正径照常 ∥ `{}` / `{ patch:null }` 读面照常
 *   ③ 行 `effort` 键消：`provider:list` 行键集不含 `effort`；`providers.mjs` 导出面不含 `effortOf`
 *   ④ 会话级零回归（定向）：`composer-sync` `effortOf` 三态 ∥ `settings.mjs` 逐模型投影元素形
 *      `{ id, effortEnum, thinkOff }`（结构机检）+ 核导入形（`thinkOffPath` 保留）∥
 *      `session:prefs` 键闭集含 `effort` + 失败径四档（bad-key ∥ invalid-patch ∥ model-required ∥ slot-missing）
 *   ⑤ 词键零残留：两语零 `settings.model.tier` / `effort.auto` / `effort.off` ∥ 两语键集相等 ∥
 *      键数按盘（`SETTINGS_DICT` 62 ∥ `HOST_DICT` 322——键数注同源）
 *   ⑥ U1 段名收正：两语 `settings.section.model` 精确等值 = zh「模型」∕ en「Model」∥ 注释面两树
 *      （`renderer/` + `src/`）零「模型与档位」∧ 零「Model & tier」
 * 纪律：只读面 ∥ 行为断言（真档取件 · config 走测试缝临时档）；真机走查归父侧。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdtempSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { pathToFileURL } from "node:url"

import "../../thincoder-desktop/test/rc-resolve.mjs" // `/rc/` 解析钩子（渲染档取件链同生产）

const ROOT = process.cwd()
if (!existsSync(join(ROOT, "thincoder-desktop"))) throw new Error(`从仓库根（thincoder/）运行（cwd = ${ROOT}）`)
const mod = (rel) => import(pathToFileURL(resolve(ROOT, rel)).href)
const text = (rel) => readFileSync(resolve(ROOT, rel), "utf8")
const tmpDir = (name) => mkdtempSync(join(tmpdir(), name))

const RENDERER = "thincoder-desktop/renderer"
const MAIN = "thincoder-desktop/src/main"
const sectionsView = await mod(`${RENDERER}/views/settings-sections.mjs`)
const settingsView = await mod(`${RENDERER}/views/settings.mjs`)
const composerSync = await mod(`${RENDERER}/composer-sync.mjs`)
const hostDict = (await mod(`${RENDERER}/i18n.mjs`)).HOST_DICT
const settingsDict = (await mod(`${RENDERER}/i18n-settings.mjs`)).SETTINGS_DICT
const providersMain = await mod(`${MAIN}/providers.mjs`)
const settingsMain = await mod(`${MAIN}/settings.mjs`)
const agentHost = await mod(`${MAIN}/agent-host.mjs`)
const cfgIo = await mod("thincoder-desktop/node_modules/@thincoder/core/config-io.mjs")

// config 测试缝（临时档 —— 生产路径零触；先例 = `2026-10-04-desktop-generic-editor-retire.test.mjs:171-173`）
const CFG_FILE = join(tmpDir("t902-cfg-"), "config.json")
writeFileSync(CFG_FILE, JSON.stringify({
  providers: [{ name: "p1", baseURL: "https://api.invalid/v1", model: "m1", apiKey: "k1" }],
  agent: { maxTurns: 3 },
}))
cfgIo._setConfigPathForTest(CFG_FILE)
test.after(() => cfgIo._resetConfigPathForTest())

/** 描述符树遍历（深度优先；`children` 数组下钻）。 */
function walk(tree, visit) {
  for (const node of Array.isArray(tree) ? tree : [tree]) {
    if (node === null || typeof node !== "object") continue
    visit(node)
    if (Array.isArray(node.children)) walk(node.children, visit)
  }
}

/** 源树文件遍历（除 `.thincoder` ∥ `node_modules` ∥ `dist*`——设计口径）。 */
function walkFiles(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && (entry.name === ".thincoder" || entry.name === "node_modules" || entry.name.startsWith("dist"))) continue
    const path = join(dir, entry.name)
    if (entry.isDirectory()) walkFiles(path, out)
    else out.push(path)
  }
  return out
}

// ─── 腿 ① · 控件零节点 ∥ 零导出面 ─────────────────────────────────────────────
const TIER_FIXTURE = { provider: "p1", model: "m1", current: "high", effortEnum: ["high", "low"], thinkOff: true }

test("腿①：控件零节点 ∥ 零导出面（`modelBody` 两段 · 导出面 · 面模型零 `tier` 键）", () => {
  const section = { state: "ready", provider: "p1", current: "p1:m1", models: [{ id: "m1", provider: "p1" }], tier: TIER_FIXTURE }
  const nodes = sectionsView.modelBody(section, {})
  let tierMarks = 0
  let selects = 0
  walk(nodes, (node) => {
    if (node.props?.["data-tier"] !== undefined) tierMarks += 1
    if (node.tag === "select") selects += 1
  })
  assert.equal(nodes.length, 2, "两段 = 当前读数 + 候选行（档位行零节点）")
  assert.equal(tierMarks, 0, "零 `data-tier` 节点（档位行退役——夹具携 tier 亦零节点）")
  assert.equal(selects, 0, "零 `select` 节点（档位控件退役）")
  assert.equal(Object.hasOwn(sectionsView, "tierFace"), false, "导出面不含 `tierFace`")
  assert.equal(Object.hasOwn(sectionsView, "tierOptions"), false, "导出面不含 `tierOptions`")
  const model = settingsView.settingsModel({ settings: { model: { state: "ready", provider: "p1", current: "p1:m1", models: [{ id: "m1", provider: "p1" }], tier: TIER_FIXTURE } } }).model
  assert.equal(Object.hasOwn(model, "tier"), false, "面模型 `model` 零 `tier` 键")
})

// ─── 腿 ② · 写径拒收（KD-902-2 顶层有效键闭集）───────────────────────────────
test("腿②：写径拒收 —— `{ tier }` ⇒ invalid-patch 零写 ∥ `{ patch }` 正径 ∥ 读面两向照常", () => {
  const evidence = () => ({ content: readFileSync(CFG_FILE, "utf8"), mtime: statSync(CFG_FILE).mtimeMs })
  settingsMain.settingsAgent({}) // 预热：载入期归一化（缩进 2 + 尾换行 ∥ 退役键迁移）先落，再取读后快照
  const before = evidence()
  const refused = settingsMain.settingsAgent({ tier: { provider: "p1", model: "m1", level: "auto" } })
  assert.equal(refused.ok, false, "退役档位意图载荷 ⇒ 拒收（非静默落读面）")
  assert.equal(refused.reason, "invalid-patch", "拒码 = `invalid-patch`")
  assert.deepEqual(evidence(), before, "拒收 ⇒ 零写盘（读后快照逐字 ∥ mtime 双证）")

  const stray = settingsMain.settingsAgent({ nope: 1 })
  assert.equal(stray.ok, false, "表外顶层有效键 ⇒ 拒收（闭集 `{ patch }`）")
  assert.equal(stray.reason, "invalid-patch", "表外有效键拒码 = `invalid-patch`")

  for (const [label, payload] of [["{}", {}], ["{ patch:null }", { patch: null }]]) {
    const receipt = settingsMain.settingsAgent(payload)
    assert.equal(receipt.ok, true, `${label} ⇒ 读面 ok:true`)
    assert.ok(Array.isArray(receipt.fields) && receipt.fields.length > 0, `${label} ⇒ 读面 fields 在场`)
  }
  const written = settingsMain.settingsAgent({ patch: { "agent.maxTurns": 7 } })
  assert.equal(written.ok, true, "`{ patch }` 正径 ⇒ ok")
  assert.equal(JSON.parse(readFileSync(CFG_FILE, "utf8")).agent.maxTurns, 7, "正径写盘落值")
})

// ─── 腿 ③ · 行 `effort` 键消 ────────────────────────────────────────────────
test("腿③：`provider:list` 行键集不含 `effort` ∥ `providers.mjs` 导出面不含 `effortOf`", () => {
  const receipt = providersMain.providerList()
  assert.equal(receipt.ok, true, "`provider:list` 回执 ok")
  assert.equal(receipt.providers.length, 1, "夹具渠一行")
  const row = receipt.providers[0]
  assert.equal(Object.hasOwn(row, "effort"), false, "行零 `effort` 键（档位现值投影退役）")
  for (const key of ["name", "shape", "hasKey", "maskedKey", "active", "proxy"]) assert.ok(Object.hasOwn(row, key), `行键 ${key} 在场`)
  assert.equal(Object.hasOwn(providersMain, "effortOf"), false, "`providers.mjs` 导出面不含 `effortOf`")
  assert.equal(Object.hasOwn(providersMain, "providerList"), true, "导出面 `providerList` 在位")
})

// ─── 腿 ④ · 会话级零回归（定向）──────────────────────────────────────────────
test("腿④-A：`composer-sync` `effortOf` 三态照旧（写向映射 = 会话级族）", () => {
  assert.equal(composerSync.effortOf("none"), "off", "核关思考档 ⇒ off")
  assert.equal(composerSync.effortOf(""), "auto", "核中性档 ⇒ auto")
  assert.equal(composerSync.effortOf("high"), "high", "枚举成员原样")
})

test("腿④-B：`settings.mjs` 逐模型投影元素形 `{ id, effortEnum, thinkOff }` + `thinkOffPath` 保留（结构机检）", () => {
  const src = text(`${MAIN}/settings.mjs`)
  assert.match(src, /return \{ id, effortEnum: spec\.reasoningEffortEnum \?\? \[\], thinkOff: thinkOffPath\(spec\) \}/, "`model:list` / `model:catalog` 投影三键形在位")
  assert.match(src, /import \{ thinkOffPath, applyAdvisorEffort \} from "@thincoder\/core\/think-off\.mjs"/, "导入形只去 `thinkOffShape`（`thinkOffPath` 保留）")
})

test("腿④-C：`session:prefs` 键闭集含 `effort` + 失败径四档（真宿主 · 零装配）", () => {
  const host = agentHost.createAgentHost({
    emit: () => {},
    projects: { currentCwd: () => null },
    assemble: async () => { throw new Error("assemble must not run in setPrefs path") },
    run: async () => {},
  })
  const badKey = host.setPrefs("x", { effort: "off" })
  assert.deepEqual([badKey.ok, badKey.reason], [false, "bad-key"], "坏键 ⇒ `bad-key`")
  const strayKey = host.setPrefs("1", { nope: 1 })
  assert.deepEqual([strayKey.ok, strayKey.reason], [false, "invalid-patch"], "表外偏好键 ⇒ `invalid-patch`")
  const modelRequired = host.setPrefs("1", { provider: "p1" })
  assert.deepEqual([modelRequired.ok, modelRequired.reason], [false, "model-required"], "只送 provider ⇒ `model-required`")
  const effortPassed = host.setPrefs("1", { effort: "off" })
  assert.deepEqual([effortPassed.ok, effortPassed.reason], [false, "slot-missing"], "`effort` 过形判（键闭集含之）⇒ 止步无 cwd（`slot-missing`）")
})

// ─── 腿 ⑤ · 词键零残留 ──────────────────────────────────────────────────────
test("腿⑤：词键零残留 —— 两语零三键 ∥ 键集相等 ∥ 键数按盘（62 ∥ 322）", () => {
  for (const key of ["settings.model.tier", "effort.auto", "effort.off"]) {
    for (const lang of ["en", "zh"]) assert.equal(Object.hasOwn(hostDict[lang], key), false, `${lang} 零 ${key}`)
  }
  assert.equal(Object.hasOwn(settingsDict.en, "settings.model.tier"), false, "`SETTINGS_DICT` en 零 `settings.model.tier`")
  assert.equal(Object.hasOwn(settingsDict.zh, "settings.model.tier"), false, "`SETTINGS_DICT` zh 零 `settings.model.tier`")
  assert.deepEqual(Object.keys(hostDict.en).sort(), Object.keys(hostDict.zh).sort(), "两语键集相等")
  assert.deepEqual(Object.keys(settingsDict.en).sort(), Object.keys(settingsDict.zh).sort(), "第四档两语键集相等")
  assert.equal(Object.keys(settingsDict.en).length, 62, "`SETTINGS_DICT` = 62 键（键数注同源）")
  assert.equal(Object.keys(hostDict.en).length, 322, "`HOST_DICT` 合并表 = 322 键（键数链同源）")
})

// ─── 腿 ⑥ · U1 段名收正（词面 ∥ 注释面）──────────────────────────────────────
test("腿⑥：段名两语精确等值（Model ∕ 模型）∥ 注释面两树零旧名残字", () => {
  assert.equal(hostDict.en["settings.section.model"], "Model", "en 段名 = 「Model」（「tier」残字由此排除）")
  assert.equal(hostDict.zh["settings.section.model"], "模型", "zh 段名 = 「模型」（「档位」残字由此排除）")
  const hits = []
  for (const dir of [RENDERER, "thincoder-desktop/src"]) {
    for (const file of walkFiles(resolve(ROOT, dir))) {
      const src = readFileSync(file, "utf8")
      if (src.includes("模型与档位")) hits.push(`${file} :: 模型与档位`)
      if (src.includes("Model & tier")) hits.push(`${file} :: Model & tier`)
    }
  }
  assert.deepEqual(hits, [], "注释面两树零旧名残字（值面 / 注释面同扫）")
})