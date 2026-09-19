/**
 * settings-mcp-delete-confirm.test.mjs — F-W17 MCP server 行组（入口册 #5）机器验收。
 *
 * **组边界 = `SETTINGS.md` §3 用例档拆分条**：MCP 组（W17-16 / W17-19…W17-25）自
 * `settings-secret-delete-confirm.test.mjs` 析出——触发 = provider 行批实现轮末实读 **505 行**
 * ≥ 500（500 硬限无豁免）；两档夹具经 `test/helpers/webview-env.mjs` 共享，本档自持
 * `before` / `beforeEach` / 驱动助手（零跨档 import）。
 *
 * 判据权威 = `docs/vsc/design/SETTINGS.md` §2.10（类判据 / 入口册 / 弹框契约 / 四条取消路径 /
 * 判据域边界）；用例与先红读数单源 = 批档 `docs/batches/2026-09-18-vsc-mcp-delete-confirm.md`
 * §2.4（W17-16 / W17-17 同号改判 + W17-19…W17-25——MCP server 行扩域）+ §2.5（AC-FW17B-1…8）
 * ——本档承载该批的 **W17-16 / W17-19…W17-25**（W17-17 结构对账跨入口同域，随判据域留在主档）。
 *
 * 手法（同主档）：happy-dom + 全量 id 夹具 + 真 `chat.js`（消息 case = 唯一消费位）+ 真
 * `settings.js`；驱动 = 真 DOM `.click()`（MCP 行钮本为 `addEventListener` ⇒ 夹具下可驱动）。
 */
import { test, before, beforeEach, after } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { setupWebview, installFullIndexFixture } from "./helpers/webview-env.mjs"
import { setStrings } from "../webview/i18n.js"

const WEBVIEW_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "webview")
const LOCALES_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "locales")

let cleanupEnv
let capturedPosts

before(async () => {
  const env = setupWebview()
  cleanupEnv = env.cleanup
  capturedPosts = env.capturedPosts
  installFullIndexFixture()
  await import("../webview/chat.js") // 真模块图：工具栏 #settings-btn 绑定 + 消息 case 唯一消费位
})

beforeEach(() => {
  // 弹框单例是全局同名的：跨用例残留会让「开框前清理」的判据失真 ⇒ 每例先清干净
  document.querySelectorAll(".auto-confirm, .auto-backdrop").forEach((el) => el.remove())
})

after(() => {
  try { window.dispatchEvent(new window.Event("unload")) } catch { /* happy-dom teardown edge */ }
  cleanupEnv()
})

const send = (data) => window.dispatchEvent(new window.MessageEvent("message", { data }))
const $ = (id) => document.getElementById(id)
const popovers = () => document.querySelectorAll(".auto-confirm")
const backdrops = () => document.querySelectorAll(".auto-backdrop")
const since = (n, type) => capturedPosts.slice(n).filter((m) => m.type === type)
const click = (el) => { assert.ok(el, "点击目标在位"); el.click() }

/** 快照预置（真消息路径——打开拍回批序里 websearchSettings / indexStatus 先于 agentSettings）。 */
function pushSnapshots({ websearchHasKey = false, embedder = false } = {}) {
  send({ type: "websearchSettings", settings: { hasKey: websearchHasKey } })
  send({ type: "indexStatus", status: { built: false, files: 0, chunks: 0, hasEmbedder: embedder } })
}

/** 打开面板（真 openSettings）：点 #settings-btn → 回一条 agentSettings（打开等待器触发拍）。 */
function openPanel() {
  $("settings-btn").click()
  send({ type: "agentSettings", settings: {} })
  assert.equal($("settings-panel").style.display, "flex", "面板已打开（确认面只在活面板上）")
}

function openPanelWith(opts) {
  pushSnapshots(opts)
  openPanel()
}

const keyRowDel = (id) => $(id).querySelector(".del-key")
/** MCP server 行 ✕（`renderMcpList` 生成位——`SETTINGS.md` §2.10 入口册 #5；已改判入本门）。 */
const mcpDel = (i = 0) => document.querySelectorAll(".mcp-del-btn")[i]
const mcpSrv = (name) => ({ name, desc: "stdio: npx", connected: true, toolCount: 2, config: { command: "npx" } })

test("W17-16 正常（改判 · 先红：点击即发）：MCP server 行 ✕ ⇒ 不立即发删除消息 ∧ 确认面在位", () => {
  openPanel()
  send({ type: "mcpStatus", servers: [mcpSrv("srv1")] })
  const n = capturedPosts.length
  click(mcpDel())
  assert.deepEqual(capturedPosts.slice(n), [], "点击 ✕ 不得发任何删除消息（确认前零发值——不可复得类）")
  assert.equal(popovers().length, 1, "确认面在位（stdio 条目无 token 亦须确认——归类按条目整体，不分叉）")
  assert.equal(backdrops().length, 1, "遮罩同拍在位")
  // R5 锚（结构面——改判只落绑定位）：✕ 的生成位（类名 / data-name / 钮字面）逐字未动
  const src = readFileSync(join(WEBVIEW_DIR, "settings-tools.js"), "utf8")
  assert.ok(src.includes('<button class="key-btn del-key mcp-del-btn" data-name="${escHtml(s.name)}">✕</button>'), "MCP ✕ 生成位逐字未动（R5）")
})

test("W17-19 正常（改判 · 先红：无框可依）：MCP ✕ → 确认 ⇒ 恰 1 条 deleteMcpServer ∧ 弹框 + 遮罩移除", () => {
  openPanel()
  send({ type: "mcpStatus", servers: [mcpSrv("srv1")] })
  const n = capturedPosts.length
  click(mcpDel())
  click(document.querySelector(".auto-confirm-yes"))
  assert.deepEqual(since(n, "deleteMcpServer"), [{ type: "deleteMcpServer", name: "srv1" }], "确认后才发——恰 1 条（载荷逐字同既有）")
  assert.equal(popovers().length, 0, "确认后弹框移除")
  assert.equal(backdrops().length, 0, "确认后遮罩移除")
})

test("W17-20 取消（MCP 入口 · 路径 #1 取消钮）：零发值 ∧ 弹框/遮罩移除 ∧ MCP 行 outerHTML 逐字同点击前", () => {
  openPanel()
  send({ type: "mcpStatus", servers: [mcpSrv("srv1")] })
  const before = document.querySelector("#mcp-list .key-row").outerHTML
  const n = capturedPosts.length
  click(mcpDel())
  click(document.querySelector(".auto-confirm-no"))
  assert.deepEqual(capturedPosts.slice(n), [], "取消 ⇒ 零发值（任何消息都不发）")
  assert.equal(popovers().length + backdrops().length, 0, "弹框与遮罩同清")
  assert.equal(document.querySelector("#mcp-list .key-row").outerHTML, before, "行内状态复原 = 从未改变（取消路径不触碰 MCP 行 DOM）")
})

test("W17-21 取消（MCP 入口 · 路径 #4 关面板）：零发值 ∧ 弹框 + 遮罩移除（closeSettings 同清）", () => {
  openPanel()
  send({ type: "mcpStatus", servers: [mcpSrv("srv1")] })
  const n = capturedPosts.length
  click(mcpDel())
  assert.equal(popovers().length + backdrops().length, 2, "开框在位")
  click($("settings-close"))
  assert.deepEqual(capturedPosts.slice(n), [], "关面板 ⇒ 零发值")
  assert.equal(popovers().length + backdrops().length, 0, "弹框与遮罩随面板关闭同清（MCP 入口同清路径）")
})

test("W17-22 边界（跨入口单例）：MCP ✕ → websearch ✕ → 确认 ⇒ 只发最后一次开框的入口", () => {
  openPanelWith({ websearchHasKey: true })
  send({ type: "mcpStatus", servers: [mcpSrv("srv1")] })
  const n = capturedPosts.length
  click(mcpDel())
  click(keyRowDel("row-websearch"))
  assert.equal(popovers().length, 1, "单例：跨入口连开只剩一个框")
  assert.deepEqual(capturedPosts.slice(n), [], "开框零发值")
  click(document.querySelector(".auto-confirm-yes"))
  assert.deepEqual(since(n, "deleteWebsearchKey"), [{ type: "deleteWebsearchKey" }], "动作只对应最后一次开框的入口")
  assert.deepEqual(since(n, "deleteMcpServer"), [], "MCP 入口未被确认 ⇒ 零 deleteMcpServer（动作不属早先的框）")
})

test("W17-23 边界（弹框在位时整表重绘）：重绘不改删除目标、不吞确认", () => {
  openPanel()
  send({ type: "mcpStatus", servers: [mcpSrv("srv1")] })
  const rowBefore = document.querySelector("#mcp-list .key-row")
  const n = capturedPosts.length
  click(mcpDel())
  send({ type: "mcpStatus", servers: [mcpSrv("srv1")] }) // renderMcpList 整表重绘（弹框挂 body ⇒ 不受影响）
  assert.notEqual(document.querySelector("#mcp-list .key-row"), rowBefore, "整表重绘确已发生（旧行节点被替换）")
  assert.equal(popovers().length, 1, "弹框在位态不被整表重绘打断")
  click(document.querySelector(".auto-confirm-yes"))
  assert.deepEqual(since(n, "deleteMcpServer"), [{ type: "deleteMcpServer", name: "srv1" }], "确认后仍发原载荷目标（重绘不改删除目标）——本例不判闭包形态（形态由代码面复核守）")
})

test("W17-24 i18n 双源（MCP 入口）：弹框正文 = settings.secretDeleteConfirm 的 zh / en 逐字（≠ 键名）", () => {
  const zh = JSON.parse(readFileSync(join(LOCALES_DIR, "zh.json"), "utf8"))
  const en = JSON.parse(readFileSync(join(LOCALES_DIR, "en.json"), "utf8"))
  assert.equal(typeof zh["settings.secretDeleteConfirm"], "string", "zh 键在册")
  assert.equal(typeof en["settings.secretDeleteConfirm"], "string", "en 键在册")
  openPanel()
  send({ type: "mcpStatus", servers: [mcpSrv("srv1")] })
  for (const [locale, strings] of [["zh", zh], ["en", en]]) {
    setStrings(strings)
    click(mcpDel())
    const text = document.querySelector(".auto-confirm-text")?.textContent
    assert.equal(text, strings["settings.secretDeleteConfirm"], `${locale}：MCP 入口弹框正文 = 该 locale 的键值（双源在册）`)
    assert.notEqual(text, "settings.secretDeleteConfirm", `${locale}：缺键回退返回键名 ⇒ 不得通过`)
    click(document.querySelector(".auto-confirm-no"))
  }
})

test("W17-25 边界（多行列表取目标）：点第 2 行 ✕ → 确认 ⇒ 恰 1 条 deleteMcpServer{name:srv2} ∧ 零 srv1", () => {
  openPanel()
  send({ type: "mcpStatus", servers: [mcpSrv("srv1"), mcpSrv("srv2")] })
  const n = capturedPosts.length
  assert.equal(document.querySelectorAll(".mcp-del-btn").length, 2, "两行两钮在位")
  click(mcpDel(1))
  click(document.querySelector(".auto-confirm-yes"))
  assert.deepEqual(since(n, "deleteMcpServer"), [{ type: "deleteMcpServer", name: "srv2" }], "载荷取点击钮的 data-name（不取首行）")
})
