/**
 * 2026-10-04-desktop-generic-editor-retire.test.mjs — 泛化编辑器退役批（#635① 全消 + ②⑤ 保留登记）批次本地单元件（随批留存归档）。
 * 名随批次档 · 住批次目录 · 不进仓套件；复跑 = 从仓库根 `thincoder/`：
 *   node --test docs/batches/2026-10-04-desktop-generic-editor-retire.test.mjs
 *
 * 腿（设计 §2「退役验证用例设计」）：
 *   ① 兜底行零节点（行为）：`agentBody` 两向夹具 ⇒ 恒 = 具名 18 行集 ∧ 零 `data-field` ∧ 零保存钮
 *   ② 符号 ∥ 锚零残留（源扫）：renderer 树（除 dist/.thincoder）六符零命中（含注面）＋ 导出面 ∥ 出口键集
 *   ③ 词键零残留：`SETTINGS_DICT` 两语零两键 ∥ 键集相等；`settings.reason.slotAuthority` 防御面词在位
 *   ④ 具名面零回归（定向）：18 键落屏 ∥ `applyNamedField` 单键直发（回执 ⇒ `fields` 就地刷新）∥
 *      `toggleGuard` 槽写 ∥ `settingsAgent` 现盘语义（修正 3 钉盘 = `src/main/settings.mjs:319-333`）
 *   ⑤ 样式零残留：`settings.css` 零两死类 ∥ D37 余则 ∥ `.settings-submit` 保留
 * 纪律：只读面 ∥ 行为断言（真档取件）；真机走查归父侧。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { pathToFileURL } from "node:url"

import "../../thincoder-desktop/test/rc-resolve.mjs" // `/rc/` 解析钩子（渲染档取件链同生产）

const ROOT = process.cwd()
if (!existsSync(join(ROOT, "thincoder-desktop"))) throw new Error(`从仓库根（thincoder/）运行（cwd = ${ROOT}）`)
const mod = (rel) => import(pathToFileURL(resolve(ROOT, rel)).href)
const text = (rel) => readFileSync(resolve(ROOT, rel), "utf8")
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const RENDERER = "thincoder-desktop/renderer"
const agentView = await mod(`${RENDERER}/views/settings-agent.mjs`)
const agentExits = await mod(`${RENDERER}/mount-settings-segments-agent.mjs`)
const settingsDict = (await mod(`${RENDERER}/i18n-settings.mjs`)).SETTINGS_DICT
const viewsDict = (await mod(`${RENDERER}/i18n-views.mjs`)).VIEWS_DICT
const cfgIo = await mod("thincoder-desktop/node_modules/@thincoder/core/config-io.mjs")
const settingsMain = await mod("thincoder-desktop/src/main/settings.mjs")

const NAMED_PATHS = agentView.NAMED_FIELDS.map((entry) => entry.path)

/** 描述符树遍历（深度优先；`children` 数组下钻）。 */
function walk(tree, visit) {
  for (const node of Array.isArray(tree) ? tree : [tree]) {
    if (node === null || typeof node !== "object") continue
    visit(node)
    if (Array.isArray(node.children)) walk(node.children, visit)
  }
}

/** 源树文件遍历（除 `dist*` ∥ `.thincoder` ∥ `node_modules`——设计口径）。 */
function walkFiles(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && (entry.name === ".thincoder" || entry.name === "node_modules" || entry.name.startsWith("dist"))) continue
    const path = join(dir, entry.name)
    if (entry.isDirectory()) walkFiles(path, out)
    else out.push(path)
  }
  return out
}

/** 段体输出形（`agentBody` 树 → 三面清单）。 */
function shapeOf(tree) {
  const out = { fieldRows: 0, buttons: 0, namedPaths: [], actions: [] }
  walk(tree, (node) => {
    if (node.props?.["data-field"] !== undefined) out.fieldRows += 1
    if (node.tag === "button") out.buttons += 1
    if (node.props?.["data-field-name"] !== undefined) out.namedPaths.push(node.props["data-field-name"])
    if (node.props?.["data-action"] !== undefined) out.actions.push(node.props["data-action"])
  })
  return out
}

// ─── 腿 ① · 兜底行零节点（行为）─────────────────────────────────────────────
const OUT_OF_TABLE = [
  { path: "agent.goalTurns", value: 12, sensitive: false, kind: "number", slotAuthority: false },
  { path: "agent.engineering", value: "off", sensitive: false, kind: "string", slotAuthority: true },
  { path: "locale", value: "zh", sensitive: false, kind: "string", slotAuthority: false },
  { path: "mcp.servers", value: [], sensitive: false, kind: "array", slotAuthority: false },
]

test("腿①：兜底行零节点 —— 两向夹具同形（具名 18 行 ∧ 零 data-field ∧ 零保存钮）", () => {
  for (const [label, fixture] of [["含表外键", OUT_OF_TABLE], ["无表外键", []]]) {
    const shape = shapeOf(agentView.agentBody({ state: "ready", fields: fixture }, {}))
    assert.equal(shape.fieldRows, 0, `${label}：零 data-field 节点（兜底行族退役）`)
    assert.equal(shape.buttons, 0, `${label}：零按钮节点（保存键随退役）`)
    assert.deepEqual(shape.namedPaths, NAMED_PATHS, `${label}：落屏 = 具名 18 键（同序同集）`)
    assert.equal(shape.actions.includes("settings:saveAgent"), false, `${label}：零保存钮锚`)
  }
})

// ─── 腿 ② · 符号 ∥ 锚零残留（源扫）──────────────────────────────────────────
const SCAN_TOKENS = ["settings:saveAgent", "onSaveAgent", "agentFieldNode", "agentPatch", "rowValue", "currentFields"]

test("腿②：符号 ∥ 锚零残留（renderer 树源扫）+ 导出面 ∥ 出口键集", () => {
  const hits = []
  for (const file of walkFiles(resolve(ROOT, RENDERER))) {
    const src = readFileSync(file, "utf8")
    for (const token of SCAN_TOKENS) if (src.includes(token)) hits.push(`${file} :: ${token}`)
  }
  assert.deepEqual(hits, [], "六符零命中（注面同去）")
  assert.deepEqual(Object.keys(agentView).sort(), ["NAMED_FIELDS", "agentBody"], "views/settings-agent.mjs 导出面 = 恰两件")
  const { handlers } = agentExits.createAgentExits({})
  assert.deepEqual(Object.keys(handlers).sort(), ["onNamedField", "onToggleGuard"], "createAgentExits handlers 键集 = 恰两件")
})

// ─── 腿 ③ · 词键零残留 ──────────────────────────────────────────────────────
test("腿③：词键零残留 —— 两语零两键 ∥ 键集相等 ∥ slotAuthority 防御面词在位", () => {
  const { en, zh } = settingsDict
  for (const key of ["settings.agent.save", "settings.agent.readonly"]) {
    assert.equal(Object.hasOwn(en, key), false, `en 零 ${key}`)
    assert.equal(Object.hasOwn(zh, key), false, `zh 零 ${key}`)
  }
  assert.deepEqual(Object.keys(en).sort(), Object.keys(zh).sort(), "两语键集相等")
  assert.equal(typeof viewsDict.en["settings.reason.slotAuthority"], "string", "en slotAuthority 词在位（拒码词表消费）")
  assert.equal(typeof viewsDict.zh["settings.reason.slotAuthority"], "string", "zh slotAuthority 词在位（拒码词表消费）")
})

// ─── 腿 ④ · 具名面零回归（定向）─────────────────────────────────────────────
test("腿④-A：具名面 18 键落屏（全字段夹具同形）", () => {
  const fieldOf = (entry) => ({
    path: entry.path,
    value: entry.kind === "number" ? 5 : entry.kind === "boolean" || entry.kind === "guard" ? true : entry.kind === "model" ? "p:m" : "none",
    sensitive: false,
    kind: entry.kind === "model" || entry.kind === "effort" ? "string" : entry.kind === "guard" ? "boolean" : entry.kind,
    slotAuthority: entry.path === "agent.advisor.guard",
  })
  const shape = shapeOf(agentView.agentBody({ state: "ready", fields: agentView.NAMED_FIELDS.map(fieldOf) }, {}))
  assert.equal(agentView.NAMED_FIELDS.length, 18, "具名表 = 18 键")
  assert.deepEqual(shape.namedPaths, NAMED_PATHS, "18 键全落屏（字段在场同形）")
  assert.equal(shape.fieldRows, 0)
})

test("腿④-B：applyNamedField 单键直发（回执 ⇒ fields 就地刷新）+ 空选显式清除", async () => {
  const fields = [{ path: "agent.maxTurns", value: 7, sensitive: false, kind: "number", slotAuthority: false }]
  const sent = []
  const patched = []
  const { handlers } = agentExits.createAgentExits({
    ask: async (channel, payload) => { sent.push([channel, payload]); return { ok: true, reason: null, fields } },
    store: { get: () => ({ settings: { agent: { fields: [] } } }), set: () => {} },
    setSettings: (patch) => patched.push(patch),
    report: (...args) => { throw new Error(`失败面不应被调：${JSON.stringify(args)}`) },
    clearReport: () => {},
    paintSettings: () => {},
  })
  await handlers.onNamedField(agentView.NAMED_FIELDS.find((entry) => entry.path === "agent.maxTurns"), { target: { value: "7" } })
  await sleep(0)
  assert.deepEqual(sent[0], ["settings:agent", { patch: { "agent.maxTurns": 7 } }], "单键 patch 直发（P14 数值加工）")
  assert.deepEqual(patched[0], { agent: { state: "ready", fields } }, "回执 ⇒ fields 就地刷新（核已回读）")
  const modelEntry = agentView.NAMED_FIELDS.find((entry) => entry.kind === "model")
  await handlers.onNamedField(modelEntry, { target: { value: "" } })
  await sleep(0)
  assert.deepEqual(sent[1], ["settings:agent", { patch: { [modelEntry.path]: null } }], "空选 ⇒ null（显式清除）")
})

test("腿④-C：toggleGuard 槽写（session:flags 径 · 写入值 ∥ 回执 flags 落切片）", async () => {
  const sent = []
  const sets = []
  const state = { activeSession: "k1", sessionFlags: { k1: { planMode: true, autoApprove: false, advisorGuard: false, engineering: false } } }
  const { handlers } = agentExits.createAgentExits({
    ask: async (channel, payload) => { sent.push([channel, payload]); return { ok: true, flags: { planMode: true, autoApprove: false, advisorGuard: true, engineering: false } } },
    store: { get: () => state, set: (next) => sets.push(next) },
    setSettings: () => {}, report: () => {}, clearReport: () => {}, paintSettings: () => {},
  })
  await handlers.onToggleGuard({ target: { checked: true } })
  await sleep(0)
  assert.deepEqual(sent, [["session:flags", { key: "k1", patch: { advisorGuard: true } }]], "槽面写径（通用保存不经）")
  assert.equal(sets.length, 1, "回执 ⇒ 切片一次落地")
  assert.deepEqual(sets[0].sessionFlags.k1, { planMode: true, autoApprove: false, advisorGuard: true, engineering: false }, "flags 切片写（四布尔）")
})

test("腿④-D：settingsAgent 现盘语义（修正 3 钉盘 = `src/main/settings.mjs:319-333`）", () => {
  const file = join(mkdtempSync(join(tmpdir(), "g635-cfg-")), "config.json")
  writeFileSync(file, JSON.stringify({ agent: { maxTurns: 3 } }))
  cfgIo._setConfigPathForTest(file)

  const expectInvalid = (payload, label) => {
    const receipt = settingsMain.settingsAgent(payload)
    assert.equal(receipt.ok, false, label)
    assert.equal(receipt.reason, "invalid-patch", label)
  }
  expectInvalid({ patch: { "agent.maxTurns": 5 }, tier: { provider: "p", model: "m", level: "auto" } }, "两有效键同在 ⇒ invalid-patch（:325）")
  expectInvalid({ patch: "x" }, "patch 非对象 ⇒ invalid-patch（:328-329）")
  expectInvalid({ patch: [] }, "patch 数组 ⇒ invalid-patch（:328-329）")
  expectInvalid({ patch: {} }, "patch 零条目 ⇒ invalid-patch（:328-329）")

  for (const [label, payload] of [["{}", {}], ["{patch:null}", { patch: null }], ["表外顶层键", { nope: 1 }]]) {
    const receipt = settingsMain.settingsAgent(payload)
    assert.equal(receipt.ok, true, `${label} ⇒ 读面 ok:true（:321-322 只取两键——零拒）`)
    assert.ok(Array.isArray(receipt.fields) && receipt.fields.length > 0, `${label} ⇒ 读面 fields 在场`)
  }

  const before = readFileSync(file, "utf8")
  const refused = settingsMain.settingsAgent({ patch: { "agent.engineering": true } })
  assert.equal(refused.ok, false, "slot 权威键拒写")
  assert.equal(refused.reason, "slot-authority", "拒码保留（:331-332 —— 防御面）")
  assert.equal(readFileSync(file, "utf8"), before, "拒写 ⇒ 零写盘")

  const written = settingsMain.settingsAgent({ patch: { "agent.maxTurns": 7 } })
  assert.equal(written.ok, true, "具名键单键写 ⇒ ok")
  assert.equal(written.fields.find((field) => field.path === "agent.maxTurns")?.value, 7, "写后回读 ⇒ fields 就地反映")
  assert.equal(JSON.parse(readFileSync(file, "utf8")).agent.maxTurns, 7, "写盘落值")
})

// ─── 腿 ⑤ · 样式零残留 ──────────────────────────────────────────────────────
const DEAD_CLASSES = [".settings-field-readonly", ".settings-readonly-hint"]

test("腿⑤：样式零残留 —— 两死类零命中 ∥ D37 余则 ∥ `.settings-submit` 保留", () => {
  const css = text(`${RENDERER}/settings.css`)
  for (const dead of DEAD_CLASSES) {
    assert.equal(css.includes(dead), false, `settings.css 零 ${dead} 规则`)
    for (const file of walkFiles(resolve(ROOT, RENDERER))) {
      assert.equal(readFileSync(file, "utf8").includes(dead), false, `${file} 零 ${dead}`)
    }
  }
  assert.match(css, /\.settings-row\s*\{[^}]*flex-wrap: nowrap/, "行族断行恒定（D37 余则）")
  assert.match(css, /\.settings-row\s*\{[^}]*border: 1px solid var\(--line\)/, "卡界 1px 描边在盘")
  assert.match(css, /\.settings-row\s*\{[^}]*border-radius: 6px/, "卡界圆角在盘")
  assert.match(css, /input\.settings-field\[type="checkbox"\]\s*\{[^}]*appearance: none/, "拨杆基规则在盘")
  assert.match(css, /\.settings-mcp-detail \.settings-row-value\s*\{[^}]*white-space: normal[^}]*overflow-wrap: anywhere/, "MCP 展开面全显豁免在盘")
  assert.match(css, /\.settings-submit\s*\{\s*align-self: flex-start;\s*\}/, "`.settings-submit` 保留（他钮共用）")
})