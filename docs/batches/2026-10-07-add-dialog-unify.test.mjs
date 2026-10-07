/**
 * 2026-10-07-add-dialog-unify.test.mjs — 批内件（添加入口弹窗统一批 · 2026-10-07 · 台账 #1054）。
 *
 * 腿集（判据源 = `thincoder/docs/vsc/design/SETTINGS.md` §2.17 :555 ∥
 * `thincoder/docs/desktop/design/SETTINGS.md` §2.18 项 7；腿 ↔ 用例逐条对照在括号）：
 *   VSC 七腿（:555）：五路关 ∥ 开框重置 ∥ 单例 ∥ 拒因可见（name 空 ⇒ 零发 ∥ 不关框 ∥ 在编值保留）∥
 *     跨框互清（各弹窗只清自身两件）∥ 页脚零出站（`addProvider` = 本地面动作——零 `postMessage`）∥ 词面五新键两语
 *   桌面四腿（§2.18 项 7）：树面（两新组卡 ∥ 段体零表单 + 两入口钮 ∥ 焦点声明）∥ 出口面（入口 ⇒ `openSettingsModal`
 *     两值 ∥ 成功径 ⇒ `closeModal` ∥ 取消 ⇒ 关框）∥ 页脚（`addProvider` ⇒ `openSettings(ADD_MODAL_GROUP)`）∥
 *     词面（四新键两语在场）
 *   附加（同批设计件，随腿机检）：段态词恰一（§2.18 项 5）∥ `SCOPES`/`MODAL_READS` 十值随动（§2.18 项 6）∥
 *     会诊上限 5（§2.1 条目 B：入口 disabled ∥ 提交守卫）
 *
 * 跑法（自仓根 thincoder/）：`node --test docs/batches/2026-10-07-add-dialog-unify.test.mjs`
 * 纪律：零网络 ∥ 零第三方新增（happy-dom = `thincoder-vscode/` 仓内既有 devDep，实读在盘）；随批留存 ·
 * 不进仓套件（VSC `test/files.mjs` 清单 = 空 ∕ 桌面 `test/` 零涉）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, "..", "..")
if (!existsSync(join(ROOT, "thincoder-desktop"))) throw new Error(`须从仓库根（thincoder/）运行——解析根 = ${ROOT}`)
const read = (p) => readFileSync(join(ROOT, p), "utf8")
const src = (p) => read(p)
const mod = (p) => import(pathToFileURL(join(ROOT, p)).href)
const sleep = (ms) => new Promise((done) => setTimeout(done, ms))
const settle = async (rounds = 6) => { for (let i = 0; i < rounds; i += 1) await new Promise((done) => setImmediate(done)) }
const CJK = /[\u3000-\u303f\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff00-\uffef]/

// ─── 桌面读面（`/rc/` 解析钩子须先于渲染档取件 —— 沿批内件先例）────────────────────────────
await mod("thincoder-desktop/test/rc-resolve.mjs")
const deskI18n = await mod("thincoder-desktop/renderer/i18n.mjs")
deskI18n.initDict({ locale: "zh" })
const t = deskI18n.t
const deskSettings = await mod("thincoder-desktop/renderer/views/settings.mjs")
const deskStore = await mod("thincoder-desktop/renderer/store.mjs")
const deskMount = await mod("thincoder-desktop/renderer/mount-settings.mjs")
const deskMcpExits = await mod("thincoder-desktop/renderer/mount-settings-segments-mcp.mjs")
const deskModelExits = await mod("thincoder-desktop/renderer/mount-settings-segments-models.mjs")
const deskComposerWire = await mod("thincoder-desktop/renderer/composer-wire.mjs")

// ─── VSC 真 webview（happy-dom —— 仓内既有 devDep，实读在盘；沿批内件先例）──────────────────
const { GlobalRegistrator } = await import(pathToFileURL(join(ROOT, "thincoder-vscode/node_modules/@happy-dom/global-registrator/lib/index.js")).href)
GlobalRegistrator.register()
if (typeof Element.prototype.scrollIntoView !== "function") Element.prototype.scrollIntoView = function () {}
const vscI18n = await mod("thincoder-vscode/webview/i18n.js")
const vscState = await mod("thincoder-vscode/webview/settings-state.js")
const vscMcp = await mod("thincoder-vscode/webview/settings-mcp.js")
const vscMcpDialog = await mod("thincoder-vscode/webview/settings-mcp-dialog.js")
const vscConsultDialog = await mod("thincoder-vscode/webview/settings-consult-dialog.js")
const vscModels = await mod("thincoder-vscode/webview/settings-models.js")
const vscProviderDialog = await mod("thincoder-vscode/webview/settings-provider-dialog.js")

// ─── 桌面描述符树小工具（null 容错）──────────────────────────────────────────────────────
const dFind = (node, pred) => {
  if (node === null || typeof node !== "object") return null
  if (Array.isArray(node)) { for (const item of node) { const hit = dFind(item, pred); if (hit !== null) return hit } return null }
  if (pred(node)) return node
  return dFind(node.children ?? null, pred)
}
const dCollect = (node, pred, out = []) => {
  if (node === null || typeof node !== "object") return out
  if (Array.isArray(node)) { for (const item of node) dCollect(item, pred, out); return out }
  if (pred(node)) out.push(node)
  dCollect(node.children ?? null, pred, out)
  return out
}
const dByClass = (node, cls) => dFind(node, (n) => typeof n?.props?.class === "string" && n.props.class.split(" ").includes(cls))
const dByAction = (node, action) => dFind(node, (n) => n?.props?.["data-action"] === action)
const dButtons = (node) => dCollect(node, (n) => n?.tag === "button").map((b) => b.props["data-action"])

/** 桌面面态夹具（七段 + 两新组 —— 缺省 = ready 空面；覆盖经 `settings` 深一层拍）。 */
const deskState = (settings = {}) => ({
  locale: "zh", theme: "system", activeSession: null, sessionFlags: {},
  settings: {
    open: true, notice: null, modal: null, configured: true, defaultModel: null,
    wizard: { step: 1, dismissed: false, notice: null },
    providers: { state: "ready", presets: [], providers: [{ name: "p1" }], edit: null, probe: null, draft: null, keyDraft: null },
    verify: null,
    model: { state: "ready", provider: "p1", current: "p1:m1", models: [{ id: "m1" }] },
    agent: { state: "ready", fields: [] },
    mcp: { state: "ready", servers: [], details: {}, form: null },
    env: { state: "ready", proxy: { uri: "", web: true, model: false }, shell: { current: null, candidates: [] }, test: null },
    tools: { state: "ready", status: null, building: false, keys: null, edit: null },
    models: { state: "ready", consult: [], advisor: { provider: null, model: null }, picker: { provider: "", rows: [], model: null }, advisorPicker: { provider: "", rows: [], model: null } },
    ...settings,
  },
})
const DESK_HANDLERS = { onMcpAddOpen: () => {}, onConsultAddOpen: () => {}, onMcpCancel: () => {}, onConsultCancel: () => {}, onAddMcp: () => {}, onUpdateMcp: () => {}, onMcpKvAdd: () => {}, onMcpKvRemove: () => {}, onMcpFormType: () => {}, onConsultAdd: () => {}, onConsultPickProvider: () => {}, onConsultPickModel: () => {} }

// ─── VSC 面夹具（三闸复位 + 假宿主 + 体征 DOM）───────────────────────────────────────────
function vscReset({ consultAdd = false } = {}) {
  vscMcpDialog.closeMcpDialog()
  vscConsultDialog.closeConsultDialog()
  vscProviderDialog.closeAddProviderDialog()
  const posts = []
  window._vscode = { postMessage: (m) => posts.push(m) }
  window._mcpServers = []
  window._confirmSecretDelete = () => {}
  document.body.innerHTML = `<div id="mcp-list"></div><button id="mcp-add-btn"></button><div id="consult-rows"></div>` +
    (consultAdd ? `<button id="consult-add"></button>` : "")
  return posts
}

/** 会诊选型（真浮层径：开菜单 ⇒ provider 行 ⇒ 浮层模型行 ⇒ 点选回填）。 */
function pickConsult(provider, model) {
  vscState.SS.getModels = () => [{ provider, id: model, label: model }]
  document.getElementById("consult-pick-btn").click()
  const providerRow = document.querySelector(".mm-panel .mm-row")
  assert.ok(providerRow !== null, "模型菜单在场（provider 行）")
  providerRow.click()
  const modelRow = document.querySelector(".mm-flyout .mm-row")
  assert.ok(modelRow !== null, "浮层在场（模型行）")
  modelRow.click()
  assert.equal(document.getElementById("consult-provider-value").textContent, vscState.labelFor(provider), "点选回填 provider")
  assert.equal(document.getElementById("consult-model-value").textContent, model, "点选回填 model")
}

// ═══════════════════════════════════════════════════════════════════════════════════════
// A 腿（VSC —— 真 webview ∥ 源面）
// ═══════════════════════════════════════════════════════════════════════════════════════

test("A1 VSC 五路关（MCP 弹窗）：保存（通过才发 + 关）∥ 取消 ∥ 背板 ∥ 框内 Esc（stopPropagation）∥ closeSettings 同清（源扫）", () => {
  const posts = vscReset()
  vscMcp.bindMcpControls()
  // ① 保存（守卫通过才发 + 关）
  vscMcpDialog.openMcpDialog(null)
  document.getElementById("mcp-name").value = "srv"
  document.getElementById("mcp-command").value = "npx"
  posts.length = 0
  document.getElementById("mcp-save-btn").click()
  assert.ok(posts.some((m) => m.type === "saveMcpServer"), "保存 ⇒ 发消息（`saveMcpServer`）")
  assert.equal(document.getElementById("mcp-dialog"), null, "保存 ⇒ 关框")
  // ② 取消
  vscMcpDialog.openMcpDialog(null)
  document.getElementById("mcp-cancel-btn").click()
  assert.equal(document.getElementById("mcp-dialog"), null, "取消 ⇒ 关框")
  // ③ 背板
  vscMcpDialog.openMcpDialog(null)
  document.querySelector(".settings-dialog-backdrop").click()
  assert.equal(document.getElementById("mcp-dialog"), null, "背板 ⇒ 关框")
  // ④ 框内 Esc（stopPropagation —— 不连带触关面板分支）
  vscMcpDialog.openMcpDialog(null)
  let leaked = 0
  const spy = () => { leaked += 1 }
  document.body.addEventListener("keydown", spy)
  document.getElementById("mcp-name").dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }))
  document.body.removeEventListener("keydown", spy)
  assert.equal(document.getElementById("mcp-dialog"), null, "框内 Esc ⇒ 关框")
  assert.equal(leaked, 0, "Esc 冒泡被拦（不连带关设置面板）")
  // ⑤ closeSettings() 同清（源扫：三清同拍）
  const closeFn = src("thincoder-vscode/webview/settings.js").match(/function closeSettings\(\) \{[\s\S]*?\n\}/)[0]
  assert.ok(closeFn.includes("closeMcpDialog()"), "关面板 ⇒ closeMcpDialog")
  assert.ok(closeFn.includes("closeConsultDialog()"), "关面板 ⇒ closeConsultDialog")
  assert.ok(closeFn.includes("closeAddProviderDialog()"), "关面板 ⇒ closeAddProviderDialog（三清）")
  // 幂等（关后重关零抛）
  vscMcpDialog.closeMcpDialog()
})

test("A2 VSC 开框重置（MCP 弹窗）：新增态表单空 ∥ 编辑态预填 + name 只读 ∥ 初始焦点两态", async () => {
  vscReset()
  vscMcp.bindMcpControls()
  // 新增态起手 + 关框后再开 ⇒ 重置
  vscMcpDialog.openMcpDialog(null)
  document.getElementById("mcp-name").value = "typed-name"
  document.getElementById("mcp-command").value = "typed-cmd"
  document.querySelector('[data-kv-add="env"]').click()
  assert.equal(document.querySelectorAll('[data-kv-row="env"]').length, 1, "加行在场（前置真）")
  vscMcpDialog.closeMcpDialog()
  vscMcpDialog.openMcpDialog(null)
  assert.equal(document.getElementById("mcp-name").value, "", "新增态 ⇒ name 空")
  assert.equal(document.getElementById("mcp-command").value, "", "新增态 ⇒ command 空")
  assert.equal(document.getElementById("mcp-type").value, "stdio", "type 回首项")
  assert.equal(document.querySelectorAll("[data-kv-row]").length, 0, "三组行集零行（零项 ⇒ 零行）")
  assert.equal(document.getElementById("mcp-status").textContent, "", "状态行清")
  await sleep(80)
  assert.equal(document.activeElement.id, "mcp-name", "初始焦点 = 首控件（新增态）")
  // 编辑态：预填 + name 只读 + 焦点 = type
  vscMcpDialog.closeMcpDialog()
  vscMcpDialog.openMcpDialog({ name: "srv", command: "npx", args: ["-y", "pkg"], env: { K: "v" } })
  assert.equal(document.getElementById("mcp-name").value, "srv", "编辑态预填 name")
  assert.equal(document.getElementById("mcp-name").readOnly, true, "编辑态 name 只读")
  assert.equal(document.getElementById("mcp-command").value, "npx", "编辑态预填字段")
  assert.equal(document.querySelectorAll('[data-kv-row="env"]').length, 1, "编辑态 kv 行预填")
  await sleep(80)
  assert.equal(document.activeElement.id, "mcp-type", "初始焦点 = type（编辑态）")
  vscMcpDialog.closeMcpDialog()
})

test("A3 VSC 单例：两弹窗已在框 ⇒ 零动作（同件不重建）", () => {
  vscReset()
  vscMcpDialog.openMcpDialog(null)
  const first = document.getElementById("mcp-dialog")
  vscMcpDialog.openMcpDialog({ name: "srv" })
  assert.equal(document.getElementById("mcp-dialog"), first, "MCP 框单例（二次开零动作）")
  assert.equal(document.querySelectorAll("#mcp-dialog").length, 1, "恰一框")
  vscMcpDialog.closeMcpDialog()
  vscConsultDialog.openConsultDialog()
  const consult = document.getElementById("consult-add-dialog")
  vscConsultDialog.openConsultDialog()
  assert.equal(document.getElementById("consult-add-dialog"), consult, "会诊框单例")
  assert.equal(document.querySelectorAll("#consult-add-dialog").length, 1)
  vscConsultDialog.closeConsultDialog()
})

test("A4 VSC 拒因可见（MCP）：name 空 ⇒ 零发 ∥ 不关框 ∥ 在编值保留 ∥ #mcp-status 显词", () => {
  const posts = vscReset()
  vscMcp.bindMcpControls()
  vscMcpDialog.openMcpDialog(null)
  document.getElementById("mcp-name").value = "   "
  document.getElementById("mcp-command").value = "typed-cmd"
  posts.length = 0
  document.getElementById("mcp-save-btn").click()
  assert.equal(posts.length, 0, "name 空 ⇒ 零发")
  assert.ok(document.getElementById("mcp-dialog") !== null, "不关框")
  assert.equal(document.getElementById("mcp-command").value, "typed-cmd", "在编值保留")
  assert.equal(document.getElementById("mcp-status").textContent, vscI18n.t("settings.mcp.nameRequired"), "拒因可见（词键在场）")
  assert.ok(src("thincoder-vscode/webview/settings-mcp-dialog.js").includes('t("settings.mcp.nameRequired")'), "词键消费点在册")
  vscMcpDialog.closeMcpDialog()
})

test("A5 VSC 跨框互清：各弹窗只清自身两件（关 mcp 不伤 provider ∥ 关 provider 不伤 mcp）", () => {
  vscReset()
  vscProviderDialog.installProviderDialogHandlers()
  // 关 mcp ⇒ provider 框在场
  vscProviderDialog.openAddProviderDialog()
  vscMcpDialog.openMcpDialog(null)
  assert.ok(document.getElementById("prov-add-dialog") !== null && document.getElementById("mcp-dialog") !== null, "两框同开（前置真）")
  vscMcpDialog.closeMcpDialog()
  assert.equal(document.getElementById("mcp-dialog"), null, "关 mcp ⇒ 本框清")
  assert.ok(document.getElementById("prov-add-dialog") !== null, "关 mcp 不伤 provider 框（只清自身两件）")
  // 关 provider ⇒ mcp 框在场
  vscConsultDialog.openConsultDialog()
  assert.ok(document.getElementById("consult-add-dialog") !== null, "会诊框同开")
  vscProviderDialog.closeAddProviderDialog()
  assert.equal(document.getElementById("prov-add-dialog"), null, "关 provider ⇒ 本框清")
  assert.ok(document.getElementById("consult-add-dialog") !== null, "关 provider 不伤会诊框")
  vscMcpDialog.openMcpDialog(null)
  vscProviderDialog.openAddProviderDialog()
  vscProviderDialog.closeAddProviderDialog()
  assert.ok(document.getElementById("mcp-dialog") !== null, "关 provider 不伤 mcp 框")
  assert.ok(document.getElementById("consult-add-dialog") !== null, "关 provider 不伤会诊框")
  vscMcpDialog.closeMcpDialog()
  vscConsultDialog.closeConsultDialog()
  // 源扫：关框各清自身两件（零类全扫 —— #1054 收窄）
  for (const file of ["settings-mcp-dialog.js", "settings-consult-dialog.js", "settings-provider-dialog.js"]) {
    const text = src(`thincoder-vscode/webview/${file}`)
    assert.equal(/querySelectorAll\(\s*["']\.settings-dialog/.test(text), false, `${file}：零类全扫残留（收窄为自身定点清）`)
    assert.match(text, /_els\?\.card\?\.remove\(\)|_els\.card\.remove\(\)/, `${file}：卡件定点清`)
  }
})

test("A6 VSC 会诊弹窗：提交（追加行 + 保存链 + 关框）∥ 取消 ∥ 背板 ∥ Esc ∥ 开框重置 ∥ 上限 5 双判据", () => {
  vscReset({ consultAdd: true })
  const rows = document.getElementById("consult-rows")
  let changed = 0
  rows.addEventListener("consult-rows-changed", () => { changed += 1 })
  // 开框重置：先开一次并点选自留值，关后再开 ⇒ 两显示值回 `—`
  vscConsultDialog.openConsultDialog()
  pickConsult("deepseek", "m1")
  vscConsultDialog.closeConsultDialog()
  vscConsultDialog.openConsultDialog()
  assert.equal(document.getElementById("consult-provider-value").textContent, "—", "开框重置 provider")
  assert.equal(document.getElementById("consult-model-value").textContent, "—", "开框重置 model")
  // 提交（通过才追加 + 关）
  pickConsult("deepseek", "m1")
  document.getElementById("consult-save-btn").click()
  assert.equal(rows.querySelectorAll(".consult-row").length, 1, "提交 ⇒ 追加完整行（provider + model）")
  assert.equal(rows.querySelector(".consult-row").dataset.provider, "deepseek", "行落 provider")
  assert.equal(rows.querySelector(".consult-row").dataset.model, "m1", "行落 model")
  assert.ok(changed >= 1, "派 `consult-rows-changed`（既有保存链）")
  assert.equal(document.getElementById("consult-add-dialog"), null, "提交 ⇒ 关框")
  // 取消 ∥ 背板 ∥ Esc
  vscConsultDialog.openConsultDialog()
  document.getElementById("consult-cancel-btn").click()
  assert.equal(document.getElementById("consult-add-dialog"), null, "取消 ⇒ 关框")
  vscConsultDialog.openConsultDialog()
  document.querySelector(".settings-dialog-backdrop").click()
  assert.equal(document.getElementById("consult-add-dialog"), null, "背板 ⇒ 关框")
  vscConsultDialog.openConsultDialog()
  let leaked = 0
  const spy = () => { leaked += 1 }
  document.body.addEventListener("keydown", spy)
  document.getElementById("consult-pick-btn").dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }))
  document.body.removeEventListener("keydown", spy)
  assert.equal(document.getElementById("consult-add-dialog"), null, "框内 Esc ⇒ 关框")
  assert.equal(leaked, 0, "Esc 冒泡被拦")
  // 上限 5：入口钮 disabled（行集随刷）+ 提交守卫零发送
  rows.innerHTML = Array.from({ length: 5 }, () => `<div class="consult-row"></div>`).join("")
  vscModels.bindConsultRows()
  assert.equal(document.getElementById("consult-add").disabled, true, "行满 5 ⇒ 入口 disabled")
  rows.querySelector(".consult-row").remove()
  rows.dispatchEvent(new window.Event("consult-rows-changed", { bubbles: true }))
  assert.equal(document.getElementById("consult-add").disabled, false, "行集随刷（删除 ⇒ 恢复）")
  rows.innerHTML = Array.from({ length: 5 }, () => `<div class="consult-row"></div>`).join("")
  rows.dispatchEvent(new window.Event("consult-rows-changed", { bubbles: true }))
  vscConsultDialog.openConsultDialog()
  pickConsult("deepseek", "m1")
  document.getElementById("consult-save-btn").click()
  assert.equal(rows.querySelectorAll(".consult-row").length, 5, "满 5 ⇒ 零追加（提交守卫同判据）")
  assert.ok(document.getElementById("consult-add-dialog") !== null, "守卫拒 ⇒ 留框")
  vscConsultDialog.closeConsultDialog()
})

test("A7 VSC 页脚零出站：OUT 表 = 本地面动作（裸调用）∥ 直开门行为（零 postMessage）∥ 宿主净删", () => {
  const inputSrc = src("thincoder-vscode/webview/input.js")
  const entry = inputSrc.split("\n").find((line) => line.includes("addProvider: ()"))
  assert.ok(entry !== undefined, "OUT 表 addProvider 条在场")
  assert.ok(entry.includes("window._openAddProviderDialog()"), "本地面动作（直开弹窗）")
  assert.equal(entry.includes("postMessage"), false, "零出站（该条不 postMessage）")
  assert.equal(entry.includes("?."), false, "裸调用（不取防御式回退）")
  const posts = vscReset()
  vscProviderDialog.installProviderDialogHandlers()
  posts.length = 0
  window._openAddProviderDialog()
  assert.ok(document.getElementById("prov-add-dialog") !== null, "页脚动作 ⇒ 直开添加弹窗在场")
  assert.equal(posts.length, 0, "零出站（零 postMessage）")
  vscProviderDialog.closeAddProviderDialog()
  // 宿主净删：无载荷支退场 ∥ addProviderFlow 包装净删
  const hostSrc = src("thincoder-vscode/src/extension/panel-messages-settings.mjs")
  assert.equal(hostSrc.includes("addProviderFlow"), false, "宿主无 addProviderFlow 引用")
  assert.equal(hostSrc.includes("showQuickPick"), false, "零 QuickPick 增流程残留")
  const flowsSrc = src("thincoder-vscode/src/extension/provider-flows.mjs")
  assert.equal(/export function addProviderFlow/.test(flowsSrc), false, "宿主包装净删（核件仍持 —— CLI 走核）")
})

test("A8 VSC 词面：五新键两语在场（非空 ∥ en 零 CJK）∥ 消费点在册", () => {
  const en = JSON.parse(src("thincoder-vscode/locales/en.json"))
  const zh = JSON.parse(src("thincoder-vscode/locales/zh.json"))
  const KEYS = ["settings.mcp.addTitle", "settings.mcp.editTitle", "settings.mcp.nameRequired", "settings.consultAddTitle", "settings.consultProvider"]
  for (const key of KEYS) {
    for (const [label, dict] of [["en", en], ["zh", zh]]) {
      assert.ok(typeof dict[key] === "string" && dict[key].trim() !== "", `${label} 缺键：${key}`)
    }
    assert.ok(!CJK.test(en[key]), `en 含 CJK：${key}`)
  }
  const mcpDlg = src("thincoder-vscode/webview/settings-mcp-dialog.js")
  for (const key of ["settings.mcp.addTitle", "settings.mcp.editTitle", "settings.mcp.nameRequired"]) assert.ok(mcpDlg.includes(`"${key}"`), `MCP 弹窗消费点缺位：${key}`)
  const consultDlg = src("thincoder-vscode/webview/settings-consult-dialog.js")
  for (const key of ["settings.consultAddTitle", "settings.consultProvider"]) assert.ok(consultDlg.includes(`"${key}"`), `会诊弹窗消费点缺位：${key}`)
})

// ═══════════════════════════════════════════════════════════════════════════════════════
// B 腿（桌面 —— 描述符树 ∥ 出口族 ∥ 真装配）
// ═══════════════════════════════════════════════════════════════════════════════════════

test("B1 桌面树面：两新组卡（标题逐态 ∥ 焦点声明）∥ 段体零表单 + 两入口钮（满 5 禁用）∥ 段态词恰一", () => {
  const { settingsModalTree, MCP_FORM_MODAL_GROUP, CONSULT_ADD_MODAL_GROUP } = deskSettings
  assert.equal(MCP_FORM_MODAL_GROUP, "mcpForm")
  assert.equal(CONSULT_ADD_MODAL_GROUP, "consultAdd")
  // ① MCP 弹窗：新增态卡（标题 ∥ 焦点声明 ∥ body 态锚 ∥ 钮集 = 提交 + 取消）
  const addTree = settingsModalTree(deskState(), MCP_FORM_MODAL_GROUP, DESK_HANDLERS)
  assert.equal(addTree.card.props["aria-label"], t("settings.mcp.addTitle"), "新增态标题 = settings.mcp.addTitle")
  assert.equal(dFind(addTree.card, (n) => n?.props?.class === "settings-title").children[0], t("settings.mcp.addTitle"))
  assert.equal(addTree.card.props["data-initial-focus"], "field", "焦点声明（初始焦点 = 首控件）")
  const addBody = dByClass(addTree.card, "settings-modal-body")
  assert.equal(addBody.props["data-state"], "ready", "body 段态锚 = mcp 面态")
  const addForm = dFind(addBody, (n) => n?.props?.["data-form"] === "mcp")
  assert.equal(addForm.props["data-mcp-form"], "add", "新增态骨")
  assert.deepEqual(dButtons(addForm).slice(-2), ["settings:addMcp", "settings:mcpCancel"], "钮集 = 提交 + 取消（新增态补钮；行集加钮另计）")
  // ② 编辑态：标题逐态 ∥ 预填 + name 只读 ∥ 钮集 = 更新 + 取消
  const editTree = settingsModalTree(deskState({ mcp: { state: "ready", servers: [{ name: "s1", config: { command: "npx" } }], details: {}, form: { editing: "s1", type: "stdio" } } }), MCP_FORM_MODAL_GROUP, DESK_HANDLERS)
  assert.equal(editTree.card.props["aria-label"], t("settings.mcp.editTitle"), "编辑态标题 = settings.mcp.editTitle")
  const editForm = dFind(dByClass(editTree.card, "settings-modal-body"), (n) => n?.props?.["data-form"] === "mcp")
  assert.equal(editForm.props["data-mcp-form"], "edit")
  assert.deepEqual(dButtons(editForm).slice(-2), ["settings:updateMcp", "settings:mcpCancel"], "钮集 = 更新 + 取消")
  assert.equal(dFind(editForm, (n) => n?.props?.id === "mcp-name").props.value, "s1", "编辑态预填（名 = 不变量）")
  assert.equal(dFind(editForm, (n) => n?.props?.id === "mcp-name").props.readOnly, true, "编辑态 name 只读")
  // ③ 会诊弹窗：标题 ∥ 焦点声明 ∥ 钮集 ∥ 提交守卫（两值齐才可用）
  const consultTree = settingsModalTree(deskState(), CONSULT_ADD_MODAL_GROUP, DESK_HANDLERS)
  assert.equal(consultTree.card.props["aria-label"], t("settings.consultAddTitle"), "标题 = settings.consultAddTitle")
  assert.equal(consultTree.card.props["data-initial-focus"], "field", "焦点声明")
  const consultForm = dFind(dByClass(consultTree.card, "settings-modal-body"), (n) => n?.props?.["data-form"] === "consult")
  assert.deepEqual(dButtons(consultForm), ["settings:consultAdd", "settings:consultCancel"], "钮集 = 提交 + 取消")
  assert.equal(dByAction(consultForm, "settings:consultAdd").props.disabled, true, "两值不齐 ⇒ 提交 disabled（守卫）")
  const pickedTree = settingsModalTree(deskState({ models: { state: "ready", consult: [], advisor: { provider: null, model: null }, picker: { provider: "p1", rows: [{ id: "m1" }], model: "m1" }, advisorPicker: { provider: "", rows: [], model: null } } }), CONSULT_ADD_MODAL_GROUP, DESK_HANDLERS)
  const pickedForm = dFind(dByClass(pickedTree.card, "settings-modal-body"), (n) => n?.props?.["data-form"] === "consult")
  assert.equal(typeof dByAction(pickedForm, "settings:consultAdd").props.onClick, "function", "两值齐 ⇒ 提交活件")
  // ④ 段体零表单 + 两入口钮（MCP 入口恒在场；会诊入口满 5 禁用）
  const mcpTree = settingsModalTree(deskState(), "mcp", DESK_HANDLERS)
  assert.equal(dFind(mcpTree.card, (n) => n?.props?.["data-form"] !== undefined), null, "MCP 段体零表单")
  assert.equal(typeof dByAction(mcpTree.card, "settings:mcpAddOpen").props.onClick, "function", "MCP 入口钮活件（新键 settings.mcpAdd）")
  const modelsTree = settingsModalTree(deskState(), "models", DESK_HANDLERS)
  assert.equal(dFind(modelsTree.card, (n) => n?.props?.["data-form"] !== undefined), null, "models 段体零表单（原内联增行表单退场）")
  assert.equal(typeof dByAction(modelsTree.card, "settings:consultAddOpen").props.onClick, "function", "会诊入口钮活件")
  const fullTree = settingsModalTree(deskState({ models: { state: "ready", consult: [1, 2, 3, 4, 5].map((i) => ({ provider: "p1", model: `m${i}` })), advisor: { provider: null, model: null }, picker: { provider: "", rows: [], model: null }, advisorPicker: { provider: "", rows: [], model: null } } }), "models", DESK_HANDLERS)
  assert.equal(dByAction(fullTree.card, "settings:consultAddOpen").props.disabled, true, "行满 5 ⇒ 入口 disabled")
  // ⑤ 段态词恰一（§2.18 项 5 收正）：loading 面单节点（非表单支零叠渲）
  const envLoading = settingsModalTree(deskState({ env: { state: "loading", proxy: { uri: "", web: true, model: false }, shell: { current: null, candidates: [] }, test: null } }), "env", {})
  assert.equal(dCollect(dByClass(envLoading.card, "settings-modal-body"), (n) => n?.props?.["data-state-word"] !== undefined).length, 1, "段态词恰一")
})

test("B2 桌面出口面 · 入口 ⇒ openSettingsModal 两值（真装配 ∥ SCOPES 十值 ∥ 读取链）", async () => {
  const calls = []
  const host = { invoke: async (channel, payload) => { calls.push([channel, payload ?? null]); return { ok: true, servers: [], fields: [], models: null } } }
  const store = deskStore.createStore()
  const face = deskMount.attachSettings(host, { store })
  try {
    await settle()
    calls.length = 0 // 初读刷净（装配面 `loadProviders` 链）
    assert.equal(face.openSettingsModal("mcpForm"), true, "mcpForm ∈ SCOPES（闭集在案）")
    assert.equal(store.get().settings.modal, "mcpForm", "切片写 = mcpForm")
    await settle()
    assert.deepEqual(calls.map(([channel]) => channel), ["mcp:list"], "mcpForm 读取链 = loadMcp")
    calls.length = 0
    assert.equal(face.openSettingsModal("consultAdd"), true, "consultAdd ∈ SCOPES")
    assert.equal(store.get().settings.modal, "consultAdd", "切片写 = consultAdd")
    await settle()
    assert.deepEqual(calls.map(([channel]) => channel), ["settings:agent"], "consultAdd 读取链 = loadAgent")
    // 入口钮 ⇒ 两值（段族 handler 直测）
    const opened = []
    const deps = { store, ask: async () => ({ ok: true }), setSettings: () => {}, report: () => {}, clearReport: () => {}, reads: {}, openModal: (group) => { opened.push(group); return true }, closeModal: () => {} }
    deskMcpExits.createMcpExits(deps).handlers.onMcpAddOpen()
    deskModelExits.createModelsExits(deps).handlers.onConsultAddOpen()
    assert.deepEqual(opened, ["mcpForm", "consultAdd"], "两入口 ⇒ openSettingsModal 两值")
    // 源面：SCOPES 十值 ∥ MODAL_READS +2 行
    const mountSrc = src("thincoder-desktop/renderer/mount-settings.mjs")
    assert.match(mountSrc, /const SCOPES = Object\.freeze\(\[\.\.\.SECTIONS\.map\(\(section\) => section\.name\), ADD_MODAL_GROUP, MCP_FORM_MODAL_GROUP, CONSULT_ADD_MODAL_GROUP\]\)/, "SCOPES = 段名序 + 三组名（十值）")
    assert.match(mountSrc, /\[MCP_FORM_MODAL_GROUP\]: "loadMcp"/, "MODAL_READS：mcpForm ⇒ loadMcp")
    assert.match(mountSrc, /\[CONSULT_ADD_MODAL_GROUP\]: "loadAgent"/, "MODAL_READS：consultAdd ⇒ loadAgent")
  } finally {
    face.closeSettingsModal()
    face.detach()
  }
})

test("B3 桌面出口面 · 成功径 ⇒ closeModal ∥ 取消 ⇒ 关框（两段族）", async () => {
  const realFormData = globalThis.FormData
  const fields = { name: "srv", type: "stdio", command: "npx", args: "" }
  globalThis.FormData = class { get(k) { return fields[k] ?? null } getAll() { return [] } }
  try {
    // ① mcpForm：新增 ∥ 编辑两成功径 + 取消
    const sent = []
    const closed = []
    let state = { settings: { mcp: { servers: [], details: {}, form: null }, modal: "mcpForm" } }
    const exits = deskMcpExits.createMcpExits({
      ask: async (channel, payload) => { sent.push([channel, payload]); return { ok: true } },
      store: { get: () => state },
      setSettings: (patch) => { state = { ...state, settings: { ...state.settings, ...patch } } },
      report: () => {}, clearReport: () => {}, reads: { loadMcp: async () => {} },
      formOf: () => ({ getAttribute: () => null }), invalidateDrafts: () => {},
      openModal: () => true, closeModal: () => closed.push("close"),
    })
    await exits.handlers.onAddMcp({})
    await settle()
    assert.deepEqual(sent, [["mcp:save", { name: "srv", config: { command: "npx", args: [] } }]], "新增成功 ⇒ mcp:save 载荷")
    assert.deepEqual(closed, ["close"], "成功径 ⇒ closeModal（弹窗在场才关）")
    assert.equal(state.settings.mcp.form, null, "切片复位（form 清）")
    await exits.handlers.onUpdateMcp({})
    await settle()
    assert.deepEqual(sent[1], ["mcp:update", { name: "srv", config: { command: "npx", args: [] } }], "编辑成功 ⇒ mcp:update")
    assert.deepEqual(closed, ["close", "close"])
    exits.handlers.onMcpCancel()
    assert.deepEqual(closed, ["close", "close", "close"], "取消 ⇒ 关框")
    // ② consultAdd：提交（追加行 + 保存链 + 关框）∥ 取消 ∥ 守卫两判
    const sent2 = []
    const closed2 = []
    let state2 = { settings: { models: { consult: [], picker: { provider: "p1", rows: [{ id: "m1" }], model: "m1" } }, modal: "consultAdd" } }
    const exits2 = deskModelExits.createModelsExits({
      ask: async (channel, payload) => { sent2.push([channel, payload]); return { ok: true } },
      store: { get: () => state2 },
      setSettings: (patch) => { state2 = { ...state2, settings: { ...state2.settings, ...patch } } },
      report: () => {}, clearReport: () => {}, reads: { loadAgent: async () => {} },
      openModal: () => true, closeModal: () => closed2.push("close"),
    })
    await exits2.handlers.onConsultAdd()
    await settle()
    assert.deepEqual(sent2, [["settings:agent", { patch: { "agent.consultModels": [{ provider: "p1", model: "m1", effort: null }] } }]], "提交 ⇒ 追加行 + 保存链")
    assert.deepEqual(closed2, ["close"], "提交成功 ⇒ 关框")
    assert.deepEqual(state2.settings.models.picker, { provider: "", rows: [], model: null }, "picker 复位随关")
    exits2.handlers.onConsultCancel()
    assert.deepEqual(closed2, ["close", "close"], "取消 ⇒ 关框")
    state2 = { settings: { models: { consult: [], picker: { provider: "", rows: [], model: null } }, modal: "consultAdd" } }
    await exits2.handlers.onConsultAdd()
    await settle()
    assert.equal(sent2.length, 1, "两值不齐 ⇒ 零发送（提交守卫）")
    state2 = { settings: { models: { consult: [1, 2, 3, 4, 5].map((i) => ({ provider: "p1", model: `m${i}`, effort: null })), picker: { provider: "p1", rows: [{ id: "m1" }], model: "m1" } }, modal: "consultAdd" } }
    await exits2.handlers.onConsultAdd()
    await settle()
    assert.equal(sent2.length, 1, "满 5 ⇒ 零发送（提交守卫）")
  } finally {
    globalThis.FormData = realFormData
  }
})

test("B4 桌面页脚 · addProvider ⇒ openSettings(ADD_MODAL_GROUP)（行为 + 源面）", () => {
  const { ADD_MODAL_GROUP } = deskSettings
  assert.equal(ADD_MODAL_GROUP, "providerAdd", "组名单源 = 视图档导出")
  const opened = []
  const wire = deskComposerWire.createComposerWire({ activeKey: () => "k1", openSettings: (group) => opened.push(group) })
  wire.post("addProvider", {})
  assert.deepEqual(opened, [ADD_MODAL_GROUP], "添加出口 ⇒ 携组名（直开添加弹窗）")
  wire.post("removeProvider", {})
  assert.deepEqual(opened, [ADD_MODAL_GROUP, undefined], "删渠道 ⇒ 既有页面（缺组）")
  // 源面：composer-wire 单源引用 ∥ app.mjs 双口 ∥ mount-composer 两 dep 转口
  const wireSrc = src("thincoder-desktop/renderer/composer-wire.mjs")
  assert.match(wireSrc, /case "addProvider": return void openSettings\?\.\(ADD_MODAL_GROUP\)/, "映射 = 组名单源直开")
  assert.match(wireSrc, /import \{ ADD_MODAL_GROUP \} from "\.\/views\/settings\.mjs"/, "组名单源引 = 视图档")
  const appSrc = src("thincoder-desktop/renderer/app.mjs")
  assert.match(appSrc, /typeof group === "string" && group !== "" \? settingsFace\.openSettingsModal\(group\) : settingsFace\.openSettings\(\)/, "appa.mjs 双口（缺组 ⇒ 页 ∥ 携组 ⇒ 组弹窗）")
  const mountSrc = src("thincoder-desktop/renderer/mount-composer.mjs")
  assert.equal((mountSrc.match(/openSettings: \(group\) => openSettings\?\.\(group\)/g) ?? []).length, 2, "两 dep 转口携组名")
})

test("B5 桌面词面：四新键两语在场 ∥ 三共享键值 = VSC 同值", async () => {
  const { SETTINGS_DICT } = await mod("thincoder-desktop/renderer/i18n-settings.mjs")
  const { VIEWS_DICT } = await mod("thincoder-desktop/renderer/i18n-views.mjs")
  const vscEn = JSON.parse(src("thincoder-vscode/locales/en.json"))
  const vscZh = JSON.parse(src("thincoder-vscode/locales/zh.json"))
  const KEYS = [["settings.mcpAdd", SETTINGS_DICT], ["settings.mcp.addTitle", SETTINGS_DICT], ["settings.mcp.editTitle", SETTINGS_DICT], ["settings.consultAddTitle", VIEWS_DICT]]
  for (const [key, dict] of KEYS) {
    for (const locale of ["en", "zh"]) {
      assert.ok(typeof dict[locale]?.[key] === "string" && dict[locale][key].trim() !== "", `桌面 ${locale} 缺键：${key}`)
    }
    assert.equal(dict.en[key], vscEn[key], `跨端同值（en）：${key}`)
    assert.equal(dict.zh[key], vscZh[key], `跨端同值（zh）：${key}`)
  }
})
