/**
 * 2026-09-29-structure-split-2.test.mjs — 结构次险族二轮（台账 #620 ∥ #651）批次本地件：结构不变量五面。
 * ⚠ 已退场（2026-10-10 · 本批定档——`docs/batches/2026-10-10-archived-tests-rebase.md` §2.1⑥）：本件**不再复跑 ∥ 红态不再受理**（断代失效——冻结面为 as-of 快照，活面自该批后持续演进；后续批改写见定档依据）。留档参考。
 * 设计 = 批档 `docs/batches/2026-09-29-structure-split-2.md` §2.4 ∥ §2.5 ∥ §2.8（面集）；实施 = 同批 §5（S1–S4 四舱）。
 * 腿集：
 *   A 行数上界（11 档实数；core ∥ desktop ≤300 · cli <400 移出线）
 *   B 迁出块逐字（6 新档 8 段 sha256 冻结比对——常量内嵌：自足，零 tmp 依赖）
 *   C 导出 identity（宿主再出口 ≡ 新档直引同引用 ∥ 11 档导出名集精确）
 *   D 零环源扫（新档不 import 宿主 ∥ manifest-schema 零 import ∥ manifest 两新档零互引 ∥ 宿主 → 新档单向）
 *   E 缝解析（pickers.mjs ∥ agent-host.mjs 零改面 + 装配级 smoke：createProviderAdmin 五名 ∥
 *     createModelPicker 五名 ∥ manifest 入口经再出口 ∥ createTurnInput 双名——不触流程语义）
 * 复跑（仓根）：node --test docs/batches/2026-09-29-structure-split-2.test.mjs
 * （本件自注册 `/rc/` 解析钩子〔= `thincoder-desktop/test/rc-resolve.mjs`——渲染档 chat-chrome 静态导入链所需〕，
 *  亦兼容前置 `node --import ./thincoder-desktop/test/rc-resolve.mjs --test <本件>`——两法等价。
 *  暂存期住 `.thincoder/tmp/` 同名件（收位 = 父侧）；根定位 = 上溯哨兵，两址皆可运行。）
 */
import assert from "node:assert/strict"
import { test } from "node:test"
import { createHash } from "node:crypto"
import { existsSync, readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const here = dirname(fileURLToPath(import.meta.url))
const findRoot = (start) => {
  let d = start
  for (let i = 0; i < 8; i++) {
    if (["thincoder-cli", "thincoder-core", "thincoder-desktop"].every((p) => existsSync(join(d, p, "package.json")))) return d
    d = dirname(d)
  }
  throw new Error(`repo root not found above ${start}`)
}
const root = findRoot(here)
const rel = (p) => join(root, p)
const contentLines = (text) => {
  const parts = text.split("\n")
  if (parts.length && parts[parts.length - 1] === "") parts.pop()
  return parts
}
const lines = (p) => contentLines(readFileSync(rel(p), "utf8"))
const src = (p) => readFileSync(rel(p), "utf8")
const sha256 = (s) => createHash("sha256").update(s, "utf8").digest("hex")
const out = (label, value) => console.log(`[读数] ${label}: ${value}`)
const short = (p) => p.split("/").pop()

const MP = "thincoder-cli/src/tui/model-picker.mjs"
const PA = "thincoder-cli/src/tui/provider-admin.mjs"
const PICKERS = "thincoder-cli/src/tui/pickers.mjs"
const RESP = "thincoder-core/provider/responses.mjs"
const REQ = "thincoder-core/provider/responses-request.mjs"
const MAN = "thincoder-core/manifest.mjs"
const SCHEMA = "thincoder-core/manifest-schema.mjs"
const DISC = "thincoder-core/manifest-discovery.mjs"
const CHROME = "thincoder-desktop/renderer/views/chat-chrome.mjs"
const DIGEST = "thincoder-desktop/renderer/views/chat-digest.mjs"
const DRIVER = "thincoder-desktop/src/main/turn-driver.mjs"
const INPUT = "thincoder-desktop/src/main/turn-input.mjs"
const HOST = "thincoder-desktop/src/main/agent-host.mjs"

// ─── A 行数上界（11 档实数） ────────────────────────────────────────────────

const LINE_BUDGET = [
  [MP, 316, 399], [PA, 213, 399], // cli 移出线 <400（整数上界 399）
  [RESP, 273, 300], [REQ, 237, 300], [MAN, 249, 300], [SCHEMA, 155, 300], [DISC, 119, 300],
  [CHROME, 213, 300], [DIGEST, 133, 300], [DRIVER, 252, 300], [INPUT, 120, 300],
]

test("A 行数上界：11 档实数断言（core ∥ desktop ≤300 · cli <400）", () => {
  const read = {}
  for (const [f, exact, bound] of LINE_BUDGET) {
    const n = lines(f).length
    read[short(f)] = n
    assert.equal(n, exact, `${f} 实数 = ${n}（冻结 ${exact}）`)
    assert.ok(n <= bound, `${f} = ${n} 应 ≤ ${bound}`)
  }
  out("A 行数", Object.entries(read).map(([f, n]) => `${f} ${n}`).join(" · "))
})

// ─── B 迁出块逐字（sha256 冻结——自足常量） ────────────────────────────────

const SEGMENTS = [
  { f: PA, a: 23, b: 185, n: 163, sha: "80919db624c957f78857f58f21d269125b418c4b3a9ed564176aaa4e322b8f68", note: "渠道管理四流（block1）" },
  { f: PA, a: 190, b: 213, n: 24, sha: "7397381a5a33bf75c6b8da9dfc498c26b0605ec5f1eb205b712f749384272e96", note: "cascadeRemoveProvider（block2）" },
  { f: REQ, a: 14, b: 237, n: 224, sha: "5c224d27b099285b4adfd7ae52f2d4938e62e65da8aaa35fdb89a1ad28f371fb", note: "请求构造面全量" },
  { f: SCHEMA, a: 13, b: 24, n: 12, sha: "203e6a85247667d7acd2864eb4a85f4a727441f213989b117067c6c4e6438719", note: "isValidDocRootValue" },
  { f: SCHEMA, a: 26, b: 155, n: 130, sha: "f9a3901bbd468a60e20fa7bac98fa05183d4718a7a4b15d4b9d7b6a5cf60be2a", note: "默认 ∕ 校验族" },
  { f: DISC, a: 15, b: 119, n: 105, sha: "8c56ed661cab0ab33eefae59ebbbffa3f40a7a3e079c8d66130d356fb9289b9d", note: "发现 ∕ 归属族" },
  { f: DIGEST, a: 12, b: 133, n: 122, sha: "eb7dc2929fb51ba6e9f6a0c086f3d5927ab38726100ac83d25a0637453b29c4f", note: "digest 三段时间" },
  { f: INPUT, a: 17, b: 117, n: 101, sha: "c7b13a9e4b7afecfe10013a6842aff4093b91e278f6a92a3be5863f3a5467b66", note: "msg 双通道族" },
]

test("B 迁出块逐字：8 段 sha256 冻结比对（6 新档 · 零 tmp 依赖）", () => {
  const cache = new Map()
  for (const s of SEGMENTS) {
    if (!cache.has(s.f)) cache.set(s.f, lines(s.f))
    const seg = cache.get(s.f).slice(s.a - 1, s.b)
    assert.equal(seg.length, s.n, `${short(s.f)}:${s.a}-${s.b} 段长 = ${seg.length}（冻结 ${s.n}）——${s.note}`)
    assert.equal(sha256(seg.join("\n")), s.sha, `${short(s.f)}:${s.a}-${s.b} sha256 逐字（冻结比对）——${s.note}`)
  }
  out("B 迁出块", `${SEGMENTS.length} 段全等：${SEGMENTS.map((s) => `${short(s.f)}:${s.a}-${s.b}(${s.n})`).join(" · ")}`)
})

// ─── C 导出 identity（再出口 ≡ 直引同引用 ∥ 名集精确） ─────────────────────

const EXPORT_SETS = {
  [MP]: ["cascadeRemoveProvider", "createModelPicker"],
  [PA]: ["cascadeRemoveProvider", "createProviderAdmin"],
  [RESP]: ["buildBody", "builtinToolsFor", "chat", "isChainInvalidError", "isStoreRequiredHost", "parseStream"],
  [REQ]: ["buildBody", "builtinToolsFor", "isStoreRequiredHost", "normalizeUsage"],
  [MAN]: ["DEFAULT_MANIFEST", "MANIFEST_REL", "MANIFEST_SCHEMA", "_resetProjectRootForTest", "_setProjectRootForTest", "discoverProjects", "discoverRepos", "docRootBase", "docRootPaths", "initManifest", "isValidDocRootValue", "manifestFilePath", "owningProject", "projectRootView", "projectView", "readManifest", "requireManifest", "resolveEngineeringManifest", "resolveProjectRoot", "validateManifest", "writeManifest"],
  [SCHEMA]: ["DEFAULT_MANIFEST", "MANIFEST_SCHEMA", "fillDefaults", "isValidDocRootValue", "validateManifest"],
  [DISC]: ["MANIFEST_REL", "_resetProjectRootForTest", "_setProjectRootForTest", "discoverProjects", "discoverRepos", "owningProject", "projectRootView", "resolveProjectRoot"],
  [CHROME]: ["blockAnchor", "chromeProps", "digestGroupNode", "digestPresent", "focusAutofocus", "ledgerGroupNode", "pillNode", "stoppedNode", "summaryNode", "syncChrome", "timerGroupNode"],
  [DIGEST]: ["digestAnchorOf", "digestGroupNode", "digestPresent", "syncDigest"],
  [DRIVER]: ["createTurnDriver"],
  [INPUT]: ["createTurnInput"],
}

const SEAM_IDENTITY = [
  [MP, PA, ["cascadeRemoveProvider"]],
  [RESP, REQ, ["buildBody", "isStoreRequiredHost", "builtinToolsFor"]],
  [MAN, DISC, ["MANIFEST_REL", "discoverProjects", "discoverRepos", "owningProject", "projectRootView", "resolveProjectRoot", "_setProjectRootForTest", "_resetProjectRootForTest"]],
  [MAN, SCHEMA, ["DEFAULT_MANIFEST", "MANIFEST_SCHEMA", "isValidDocRootValue", "validateManifest"]],
  [CHROME, DIGEST, ["digestGroupNode", "digestPresent"]],
]

test("C 导出 identity：宿主再出口 ≡ 新档直引同引用 ∥ 11 档导出名集精确", async () => {
  await import(pathToFileURL(rel("thincoder-desktop/test/rc-resolve.mjs")).href) // `/rc/` 钩子（chat-chrome → chat-tool 静态导入链所需）
  const files = [MP, PA, RESP, REQ, MAN, SCHEMA, DISC, CHROME, DIGEST, DRIVER, INPUT]
  const loaded = await Promise.all(files.map((p) => import(pathToFileURL(rel(p)).href)))
  const mods = new Map(files.map((p, i) => [p, loaded[i]]))
  for (const [f, m] of mods) assert.deepEqual(Object.keys(m).sort(), [...EXPORT_SETS[f]].sort(), `${f} 导出名集精确（冻结集）`)
  let seams = 0
  for (const [host, fresh, names] of SEAM_IDENTITY) {
    for (const n of names) {
      assert.equal(mods.get(host)[n], mods.get(fresh)[n], `identity（同引用）：${short(host)}.${n} === ${short(fresh)}.${n}`)
      seams++
    }
  }
  out("C", `11 档名集精确 ✓ · 5 缝 ${seams} 名同引用 ✓`)
})

// ─── D 零环源扫（新档不 import 宿主 ∥ schema 零 import ∥ 两新档零互引） ─────

const importSpecifiers = (s) => {
  const specs = []
  for (const m of s.matchAll(/^\s*(?:import|export)\s[^\n]*?from\s+["']([^"']+)["']/gm)) specs.push(m[1]) // 单行 static（import ∕ export-from）
  for (const m of s.matchAll(/^\s*import\s+["']([^"']+)["']/gm)) specs.push(m[1]) // 副作用型 import "x"
  for (const m of s.matchAll(/\bimport\s*\(\s*["']([^"']+)["']\s*\)/g)) specs.push(m[1]) // 动态 import("x")
  return specs
}
// 零环收严扫描：任意引号包裹的 `.mjs` 串（容多行 import ∥ 变量持串后 import(p)）——防格式改写致假绿
const quotedMjs = (s) => [...s.matchAll(/["']([^"'\n]*\.mjs)["']/g)].map((m) => m[1])

test("D 零环源扫：新档不 import 宿主 ∥ schema 零 import ∥ manifest 两新档零互引", () => {
  const NEW_FILES = [PA, REQ, SCHEMA, DISC, DIGEST, INPUT]
  const HOSTS = [MP, RESP, MAN, CHROME, DRIVER]
  for (const f of NEW_FILES) {
    const specs = quotedMjs(src(f)) // 收严扫：引号 .mjs 串——多行 ∥ 动态 ∥ 变量持串形态全收
    for (const h of HOSTS) {
      assert.ok(!specs.includes(`./${short(h)}`) && !specs.some((s2) => s2.endsWith(`/${short(h)}`)), `${short(f)} 不 import 宿主 ${short(h)}（quoted-.mjs 收严扫）`)
    }
  }
  const schemaSpecs = importSpecifiers(src(SCHEMA))
  assert.equal(schemaSpecs.length, 0, `manifest-schema.mjs 零 import（静态+动态实读 ${schemaSpecs.length}）`)
  assert.equal(quotedMjs(src(SCHEMA)).length, 0, `manifest-schema.mjs 零引号 .mjs 串（收严扫）`)
  assert.ok(!quotedMjs(src(DISC)).includes("./manifest-schema.mjs"), "discovery 不引 schema（两新档零互引）")
  assert.ok(!schemaSpecs.includes("./manifest-discovery.mjs"), "schema 不引 discovery（两新档零互引）")
  const DIRECTION = [
    [MP, "./provider-admin.mjs"], [RESP, "./responses-request.mjs"],
    [MAN, "./manifest-schema.mjs"], [MAN, "./manifest-discovery.mjs"],
    [CHROME, "./chat-digest.mjs"], [DRIVER, "./turn-input.mjs"],
  ]
  for (const [host, spec] of DIRECTION) assert.ok(importSpecifiers(src(host)).includes(spec), `${short(host)} → ${spec}（宿主 → 新档单向）`)
  out("D", `6 新档 × 5 宿主零引（收严扫）✓ · schema 零 import ✓ · 零互引 ✓ · 单向 6 边 ✓`)
})

// ─── E 缝解析（零改面 ∥ 装配级 smoke） ─────────────────────────────────────

test("E 缝解析：pickers.mjs ∥ agent-host.mjs 零改面 + 装配级 smoke", async () => {
  const pickers = src(PICKERS)
  assert.ok(pickers.includes('import { createModelPicker } from "./model-picker.mjs"'), "pickers.mjs import 面零改（指宿主）")
  assert.ok(pickers.includes("const modelPicker = createModelPicker({"), "pickers.mjs 装配面零改")
  assert.ok(pickers.includes("return { showPicker, closePicker, popPicker, renderPickerLines, confirmDelete, ...modelPicker }"), "pickers.mjs 返回面零改（消费名展开）")
  const host = src(HOST)
  assert.ok(host.includes('import { createTurnDriver } from "./turn-driver.mjs"'), "agent-host.mjs import 面零改")
  assert.ok(host.includes("const turnDriver = createTurnDriver({"), "agent-host.mjs 装配调用零改")
  assert.ok(host.includes("...turnDriver,"), "agent-host.mjs 展平面零改")

  const { createProviderAdmin } = await import(pathToFileURL(rel(PA)).href)
  const admin = createProviderAdmin({
    agent: {}, showPicker: async () => null, askQuestion: async () => null, pushLine() {}, persistRaw() {},
    maskKey: (k) => k, confirmDelete: async () => false, C: {}, fmtContextK: String, defaultModelLabel: () => "",
  })
  assert.deepEqual(Object.keys(admin).sort(), ["addProviderFlow", "removeProviderFlow", "setContextFlow", "setKeyFlow", "setProviderKey"], "createProviderAdmin 五名可解析")
  for (const n of Object.keys(admin)) assert.equal(typeof admin[n], "function", `createProviderAdmin().${n} 为函数`)

  const { createModelPicker } = await import(pathToFileURL(rel(MP)).href)
  const picker = createModelPicker({
    agent: {}, state: {}, render() {}, ansi: {}, C: {}, pushLine() {}, persistRaw() {}, askQuestion: async () => null,
    maskKey: (k) => k, showPicker: async () => null, closePicker() {}, renderPickerLines() {}, confirmDelete: async () => false,
  })
  assert.deepEqual(Object.keys(picker).sort(), ["openModelPicker", "pickModelForSlot", "selectModel", "setContextFlow", "setProviderKey"], "createModelPicker 返回面五名可解析")

  const manifest = await import(pathToFileURL(rel(MAN)).href)
  for (const n of ["readManifest", "requireManifest", "resolveEngineeringManifest", "writeManifest", "initManifest", "projectView", "docRootBase", "docRootPaths", "manifestFilePath"]) {
    assert.equal(typeof manifest[n], "function", `manifest 入口经再出口可解析：${n}`)
  }

  const { createTurnInput } = await import(pathToFileURL(rel(INPUT)).href)
  const face = createTurnInput({
    post() {}, ensure: async () => null, flights: new Map(), queued: {}, chain: {}, suspension: {}, drive() {},
    projects: {}, denyGates() {}, capPending: new Map(), capQueued: new Map(),
  })
  assert.deepEqual(Object.keys(face).sort(), ["interrupt", "send"], "createTurnInput 返回面 { send, interrupt }")
  for (const n of Object.keys(face)) assert.equal(typeof face[n], "function", `createTurnInput().${n} 为函数`)

  out("E", "pickers ∥ agent-host 零改面 ✓ · admin 五名 ✓ · picker 五名 ✓ · manifest 入口 9 名 ✓ · input 双名 ✓")
})
