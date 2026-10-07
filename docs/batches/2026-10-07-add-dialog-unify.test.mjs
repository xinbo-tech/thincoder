/**
 * 2026-10-07-add-dialog-unify.test.mjs — 批内件（添加入口弹窗统一批 · 2026-10-07 · 台账 #1054）**VSC 半**。
 *
 * 腿集（判据源 = `thincoder/docs/vsc/design/SETTINGS.md` §2.17 :555；腿 ↔ 用例逐条对照在括号）：
 *   VSC 七腿（:555）：五路关 ∥ 开框重置 ∥ 单例 ∥ 拒因可见（name 空 ⇒ 零发 ∥ 不关框 ∥ 在编值保留）∥
 *     跨框互清（各弹窗只清自身两件）∥ 页脚零出站（`addProvider` = 本地面动作——零 `postMessage`）∥ 词面五新键两语
 *   附加（同批设计件，随腿机检）：会诊弹窗（提交追加行 + 保存链 + 关框 ∥ 取消 ∥ 上限 5 守卫）∥ 词面消费点在册（A6 ∥ A8）
 *   桌面四腿（`thincoder/docs/desktop/design/SETTINGS.md` §2.18 项 7）住同批姊妹件
 *     `docs/batches/2026-10-07-add-dialog-unify-desktop.test.mjs`（500 行硬限二分 —— 两档腿集合并 = 原单档腿集，零删腿）。
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

// ─── `/rc/` 解析钩子（须先于仿真 webview 取件 —— 沿批内件先例）───────────────────────────────
await mod("thincoder-desktop/test/rc-resolve.mjs")

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

