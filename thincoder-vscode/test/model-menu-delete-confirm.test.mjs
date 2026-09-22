/**
 * model-menu-delete-confirm.test.mjs — F-W17（不可复得类删除二次确认）**入口 6** 机器验收。
 *
 * 判据权威 = `docs/vsc/design/SETTINGS.md` §2.10（入口册 #6「模型菜单 footer − Remove provider…」·
 * 「模型菜单入口」段 = 门位选型 c 案）；用例与先红读数单源 = 批档
 * `docs/batches/2026-09-19-vsc-model-menu-delete-confirm.md` §2.5（W17-31…W17-34）+ §2.2 D-M5。
 * 判据句 = 同一「不可复得」分类——删整条 provider 时其 `apiKey` 原文随条目一并消失
 * （写入 = `thincoder-core/config-io.mjs:201-208` · 整条 filter = `:262-277`）。
 *
 * 手法（跨面夹具 = 批档 §2.2 D-M5）：webview 半 = happy-dom 全量 id 夹具 + 真 `chat.js` 模块图
 * （确认门由 `initSettings()` 安装（chat.js 装配面）；`#model-btn` 绑定在 `model-picker.js` 模块顶）
 * ——点击 = 真 DOM `.click()`；host 半 = 捕获消息**逐条喂回**真宿主分发 `handlePanelMessage`
 * （先例 = `test/settings-empty-no-write.test.mjs:86-90`）+ 临时 config（`_setConfigPathForTest`
 * ——**绝不触碰真实 `~/.thincoder/`**）。**禁夹具手写载荷**：喂回的消息必来自真 webview 点击。
 * 宿主 UI 桩（`showQuickPick`）不是载荷夹具——它扮演「用户选定目标 / 取消」这一步
 * （真 QuickPick 面 = `src/extension/provider-flows.mjs:142-146`）。
 */
import { test, before, beforeEach, after } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { window as vscodeWindow } from "vscode"
import { setupWebview, installFullIndexFixture } from "./helpers/webview-env.mjs"
import { ChatPanel } from "../src/extension/chat-panel.mjs"
import { handlePanelMessage } from "../src/extension/panel-messages.mjs"
import { _setConfigPathForTest, loadRaw } from "@thincoder/core/config-io.mjs"

/** kimi 的 apiKey 原文 = 本门保护对象（删条即不可复得 ⇒ 必过一次显式确认）。 */
const API_KEY_TEXT = "sk-kimi-original-text"
/** 盘面基点：active（`defaultModel` 指名）不可删 ⇒ 宿主候选 = kimi（`provider-flows.mjs:137`）。 */
const CONFIG = {
  providers: [
    { name: "deepseek", model: "deepseek-chat" },
    { name: "kimi", model: "kimi-k2", apiKey: API_KEY_TEXT },
  ],
  defaultModel: "deepseek:deepseek-chat",
}

let _tmp
let cleanupEnv
let capturedPosts
let quickPickReply // 宿主 UI 桩返回值：{label} = 用户选定目标 / undefined = 取消（:146 `if (!sel) return`）

before(async () => {
  _tmp = mkdtempSync(join(tmpdir(), "tc-model-menu-confirm-"))
  _setConfigPathForTest(join(_tmp, "config.json"))
  const env = setupWebview()
  cleanupEnv = env.cleanup
  capturedPosts = env.capturedPosts
  installFullIndexFixture()
  await import("../webview/chat.js") // 真模块图：确认门安装（chat.js 装配面）+ toolbar/#model-btn 绑定 + 消息 case 唯一消费位（chat-messages.js）
  send({ type: "models", models: [{ id: "deepseek-chat", provider: "deepseek" }], prefs: {} }) // 设计 §2.5 驱动列：真 `models` 推送（菜单候选区就位；`prefs` 无命中 ⇒ 零回写 post）
  vscodeWindow.showQuickPick = async () => quickPickReply // 宿主 UI 桩（真 QuickPick 由扩展宿主供给——node 下无）
})

beforeEach(() => {
  // 弹框 / 遮罩 / 菜单 overlay 均为全局同名节点：跨用例残留会让「开框前单例清理」「菜单不复活」失真
  document.querySelectorAll(".auto-confirm, .auto-backdrop, .mm-overlay").forEach((el) => el.remove())
})

after(() => {
  try { window.dispatchEvent(new window.Event("unload")) } catch { /* happy-dom teardown edge */ }
  cleanupEnv()
  _setConfigPathForTest(null)
  rmSync(_tmp, { recursive: true, force: true })
})

const send = (data) => window.dispatchEvent(new window.MessageEvent("message", { data }))
const $ = (id) => document.getElementById(id)
const popovers = () => document.querySelectorAll(".auto-confirm")
const backdrops = () => document.querySelectorAll(".auto-backdrop")
const overlays = () => document.querySelectorAll(".mm-overlay")
const click = (el) => { assert.ok(el, "点击目标在位"); el.click() }
const cfgPath = () => join(_tmp, "config.json")
const writeConfig = () => writeFileSync(cfgPath(), JSON.stringify(CONFIG, null, 2) + "\n", "utf8")
const cfgText = () => readFileSync(cfgPath(), "utf8")

/** 宿主桩面板（先例 = `settings-empty-no-write.test.mjs:86-90`）：`_pushSettings` 覆写为记录——
 *  真推送族 `fullStatus` 会发起真实探针窗（`settings.mjs:380-392`），用例须零网络；删盘发生在
 *  refresh **之前** ⇒ 判据面（盘面 / 消息面）不受影响。 */
function hostPanel() {
  const posted = []
  const pushCalls = []
  const panel = Object.create(ChatPanel.prototype)
  Object.assign(panel, {
    _panel: { webview: { postMessage: (m) => { posted.push(m); return Promise.resolve(true) } } },
    _pushSettings: () => { pushCalls.push(1) },
  })
  return { panel, posted, pushCalls }
}

/** 真路径点「− Remove provider…」：真 `#model-btn` 点击开菜单（渲染位 `model-menu.js:128-134` 零改）
 *  ⇒ 点 footer 行。返回新增消息起点（不含确认——确认由各用例显式驱动）。 */
function clickFooterRemove() {
  const n = capturedPosts.length
  click($("model-btn"))
  const rows = [...document.querySelectorAll(".mm-row.mm-manage")]
  const row = rows.find((el) => el.textContent.includes("Remove provider"))
  assert.ok(row, `footer 行「− Remove provider…」在位（实读 ${JSON.stringify(rows.map((r) => r.textContent))}）`)
  click(row)
  return n
}

/** 「真路径产出的删除消息」（禁夹具手写载荷）：门在位 ⇒ 过确认那一步；先红态 ⇒ 行本身即发值。
 *  **两态同取真 webview 点击的产物**——W17-34 是恒绿锚（宿主既有早退零改），不押门在位。 */
function confirmIfGateInPlace() {
  document.querySelector(".auto-confirm-yes")?.click()
}

test("W17-31 正常（先红：点击即发）：footer 行 ⇒ 零发值 ∧ 确认面在位 ∧ 菜单已关（overlay = 0）", () => {
  writeConfig()
  const n = clickFooterRemove()
  assert.deepEqual(capturedPosts.slice(n), [], "点击 footer 行不得发任何删除消息（确认前零发值——门在 post 之前）")
  assert.equal(popovers().length, 1, "模型菜单入口须过一次显式确认（弹框在位）")
  assert.equal(backdrops().length, 1, "遮罩同拍在位")
  assert.equal(overlays().length, 0, "菜单在开框前已关（model-menu.js:132 closeModelMenu）⇒ 弹框无遮挡")
})

test("W17-32 正常（先红：无框可依 + 选定即删）：确认 ⇒ 恰 1 条无 name 消息 ∧ 端到端删盘 + apiKey 原文消失", async () => {
  writeConfig()
  const cfgBefore = cfgText()
  const n = clickFooterRemove()
  click(document.querySelector(".auto-confirm-yes"))
  assert.deepEqual(capturedPosts.slice(n), [{ type: "removeProvider" }], "确认后恰 1 条（消息名 / 载荷逐字同既有——无 name ⇒ 宿主 QuickPick 选目标）")
  assert.equal(popovers().length + backdrops().length, 0, "确认后弹框与遮罩同清")
  // 端到端：真 webview 产出的载荷逐条喂回真宿主分发（禁夹具手写载荷）
  const { panel, posted, pushCalls } = hostPanel()
  quickPickReply = { label: "kimi" } // 宿主 UI 桩 = 用户在 QuickPick 里选定目标
  for (const m of capturedPosts.slice(n)) await handlePanelMessage(panel, m)
  assert.equal(pushCalls.length, 1, "删后刷新恰 1 次（refresh = _pushSettings）")
  assert.deepEqual(loadRaw().providers.map((p) => p.name), ["deepseek"], "盘面 providers 只剩 active（kimi 条目已删）")
  assert.equal(cfgText().includes(API_KEY_TEXT), false, "apiKey 原文随条目一并消失（不可复得——本门的存在理由）")
  assert.notEqual(cfgText(), cfgBefore, "盘面确已改写（删除落盘）")
  assert.deepEqual(posted.filter((m) => m.type === "providerError"), [], "成功路径零错误推送")
})

test("W17-33 取消（路径 #1 取消钮）：零发值 ∧ 框 / 幕移除 ∧ 菜单不复活 ∧ config.json 逐字节不变", () => {
  writeConfig()
  const cfgBefore = cfgText()
  const n = clickFooterRemove()
  click(document.querySelector(".auto-confirm-no"))
  assert.deepEqual(capturedPosts.slice(n), [], "取消 ⇒ 零发值（任何消息都不发——宿主零调用）")
  assert.equal(popovers().length + backdrops().length, 0, "弹框与遮罩同清")
  assert.equal(overlays().length, 0, "菜单不复活（入口专属形态：菜单在开框前已关 ⇒ 无行内状态可复原）")
  assert.equal(cfgText(), cfgBefore, "config.json 逐字节不变（取消 ⇒ 零删除 ∧ 零消息副作用）")
})

test("W17-34 边界（恒绿锚）：宿主侧选定取消 ⇒ 零删除 ∧ 盘面逐字节不变 ∧ 零 providerError", async () => {
  writeConfig()
  const cfgBefore = cfgText()
  const n = clickFooterRemove()
  confirmIfGateInPlace()
  const posts = capturedPosts.slice(n)
  assert.deepEqual(posts.map((m) => m.type), ["removeProvider"], "真路径恰产出 1 条删除消息（真 webview 点击的产物——非夹具手写）")
  const { panel, posted } = hostPanel()
  quickPickReply = undefined // 用户在目标选定步取消（provider-flows.mjs:146 `if (!sel) return` 零改）
  for (const m of posts) await handlePanelMessage(panel, m)
  assert.equal(cfgText(), cfgBefore, "config.json 逐字节不变（选定取消 ⇒ 零删除——宿主既有早退）")
  assert.deepEqual(loadRaw().providers.map((p) => p.name), ["deepseek", "kimi"], "两条条目俱在（kimi 的 apiKey 原文同在原处）")
  assert.deepEqual(posted.filter((m) => m.type === "providerError"), [], "零 providerError 推送")
})
