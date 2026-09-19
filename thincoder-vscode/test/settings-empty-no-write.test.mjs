/**
 * settings-empty-no-write.test.mjs — F-W10（空值不得静默清除既有配置 · 🔴 数据丢失）机器验收。
 *
 * 判据权威 = `docs/vsc/design/SETTINGS.md` §2.8（基线判据 + 逐字段载荷判据 + 「空/null ⇒ 删除」
 * 路径册）+ §2.9（Shell 写面）；批档 = `docs/batches/2026-09-18-vsc-settings-wiring.md` §2.4 档 B
 * （W10-1…W10-7 · AC-W3 / AC-W8）+ §2.6 反例面。
 *
 * 手法：webview 半 = happy-dom + 全量 id 夹具 + 真 `chat.js` / `settings.js`（**不沿用**
 * smoke-settings.mjs 灌 SS 手法——快照未达拍靠「不回批 + SS 置于未达态」构成）；
 * host 半 = 临时 config（`_setConfigPathForTest` 指 tmp 文件，**绝不触碰真实 ~/.thincoder/**）
 * + `Object.create(ChatPanel.prototype)` 桩（`_panel` 捕获 postMessage）。
 */
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { setupWebview, installFullIndexFixture } from "./helpers/webview-env.mjs"
import { SS } from "../webview/settings-state.js"
import { handlePanelMessage } from "../src/extension/panel-messages.mjs"
import { ChatPanel } from "../src/extension/chat-panel.mjs"
import { saveProxySettingsFromPanel } from "../src/extension/settings.mjs"
import { _setConfigPathForTest, loadRaw } from "@thincoder/core/config-io.mjs"

const PROXY_URI = "http://127.0.0.1:7890"

let _tmp
let cleanupEnv
let capturedPosts

before(async () => {
  _tmp = mkdtempSync(join(tmpdir(), "tc-settings-nowrite-"))
  _setConfigPathForTest(join(_tmp, "config.json"))
  const env = setupWebview()
  cleanupEnv = env.cleanup
  capturedPosts = env.capturedPosts
  installFullIndexFixture()
  await import("../webview/chat.js") // 真模块图：工具栏 #settings-btn 绑定 + 消息 case 唯一消费位
})

after(() => {
  try { window.dispatchEvent(new window.Event("unload")) } catch { /* happy-dom teardown edge */ }
  cleanupEnv()
  _setConfigPathForTest(null)
  rmSync(_tmp, { recursive: true, force: true })
})

const send = (data) => window.dispatchEvent(new window.MessageEvent("message", { data }))
const $ = (id) => document.getElementById(id)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const proxyPosts = (n) => capturedPosts.slice(n).filter((m) => m.type === "saveProxySettings")
const shellPosts = (n) => capturedPosts.slice(n).filter((m) => m.type === "saveShellSettings")
const change = (el) => el.dispatchEvent(new window.Event("change"))
const badgeVisible = () => $("agent-saved-badge").className.includes("visible")

/** 打开面板（点 #settings-btn → 真 openSettings）+ 回一条 agentSettings ⇒ 同步建面。 */
function openPanel() {
  $("settings-btn").click()
  send({ type: "agentSettings", settings: {} })
}

/** host 桩面板（真实原型方法——`_pushSettingsLight` 走真实现）。 */
function hostPanel(posted) {
  const panel = Object.create(ChatPanel.prototype)
  Object.assign(panel, {
    _panel: { webview: { postMessage: (m) => { posted.push(m); return Promise.resolve(true) } } },
    _agentSettingsSession: () => null,
  })
  return panel
}

const writeHostConfig = (raw) => writeFileSync(join(_tmp, "config.json"), JSON.stringify(raw, null, 2) + "\n", "utf8")

test("W10-1 边界（先红）：快照未达 + 未编辑控件 change ⇒ 零发值 + 徽标零亮（先红读数 = 1 条旧屏值 + 徽标 visible）", async () => {
  writeHostConfig({ proxy: { uri: PROXY_URI, web: true, model: false } }) // 盘面基点（宿主半）
  const cfgBefore = readFileSync(join(_tmp, "config.json"), "utf8")
  SS.proxySettings = null // 快照未达（不灌 SS —— 未达态由「不回批」构成）
  const n = capturedPosts.length
  $("settings-body").innerHTML = ""
  $("settings-btn").click() // 打开但不回批 ⇒ 250ms 超时回落建面
  await sleep(320)
  const web = $("px-web")
  assert.equal(web.checked, true, "快照缺席 ⇒ 复选框渲染默认（先红读数现场：这正是旧路径的静默写回源）")
  change(web) // blur / Enter 未改值 = 未编辑的 change
  const posts = proxyPosts(n)
  // 端到端（§2.6 ①②）：真 webview 的 post 逐条喂回真宿主分发（真载荷——非桩自证）⇒ 盘面逐字节比对
  const posted = []
  const panel = hostPanel(posted)
  for (const m of posts) await handlePanelMessage(panel, m)
  assert.equal(readFileSync(join(_tmp, "config.json"), "utf8"), cfgBefore, "config.json 逐字节不变（零写盘 = 数据安全机判）")
  assert.equal("proxy" in loadRaw(), true, "raw.proxy 键在场（零删除）")
  assert.deepEqual(
    { posts, badge: badgeVisible() },
    { posts: [], badge: false },
    "未编辑控件零发值（零写盘：无 post 即宿主零删除）∧ 徽标零亮（UI 不得反给「已保存」）",
  )
})

test("W10-2 正常：回批后改值 + change ⇒ 逐字段载荷（仅 {uri} —— 防默认值物化）", () => {
  SS.proxySettings = null
  const n = capturedPosts.length
  openPanel()
  send({ type: "proxySettings", settings: { uri: PROXY_URI, web: true, model: false } }) // 回填写入 ⇒ 基线 = 真值
  const uri = $("px-uri")
  uri.value = "http://new"
  change(uri)
  const posts = proxyPosts(n)
  assert.equal(posts.length, 1, "恰一次发值")
  assert.deepEqual(Object.keys(posts[0].settings), ["uri"], "载荷只含本次被编辑字段（web/model 零携带）")
  assert.deepEqual(posts[0], { type: "saveProxySettings", settings: { uri: "http://new" } })
})

test("W10-3 正常：显式清空 ⇒ payload 恰 {uri:\"\"} ⇒ 宿主删 proxy 键（路径册 #1——显式动作才删）", () => {
  SS.proxySettings = null
  const n = capturedPosts.length
  openPanel()
  send({ type: "proxySettings", settings: { uri: PROXY_URI, web: true, model: false } })
  const uri = $("px-uri")
  uri.value = "" // 显式清空（用户动作）
  change(uri)
  const posts = proxyPosts(n)
  assert.deepEqual(posts, [{ type: "saveProxySettings", settings: { uri: "" } }], "发出 = 显式清空（唯一删除触发）")
  // 宿主半：同一载荷 ⇒ 键消失（既有删除语义零改）
  writeHostConfig({ proxy: { uri: PROXY_URI, web: true, model: false } })
  saveProxySettingsFromPanel(posts[0].settings)
  assert.equal(loadRaw().proxy, undefined, "空 uri ⇒ delete raw.proxy（显式动作才落到删除）")
})

test("W10-4 错误/反例：同值 change 连发 ⇒ 恰 1 次 post（幂等门）∧ 部分载荷 {web:false} ⇒ 磁盘 uri 保留", () => {
  SS.proxySettings = null
  const n = capturedPosts.length
  openPanel()
  send({ type: "proxySettings", settings: { uri: PROXY_URI, web: true, model: false } })
  const uri = $("px-uri")
  uri.value = "http://new"
  change(uri)
  change(uri) // 同值连发（发值后基线 ← 本次屏值）
  assert.equal(proxyPosts(n).length, 1, "同值 change 连发 = 幂等门（恰 1 次 post）")
  // 宿主半：部分载荷（无 uri 键）⇒ 磁盘 uri 保留（§2.8 判据②的安全网）
  writeHostConfig({ proxy: { uri: PROXY_URI, web: true, model: false } })
  saveProxySettingsFromPanel({ web: false })
  const px = loadRaw().proxy
  assert.equal(px.uri, PROXY_URI, "uri 缺席 ⇒ 保留磁盘 uri")
  assert.equal(px.web, false, "web 被本次载荷改写")
  assert.equal(px.model, false, "model 缺席 ⇒ 保留磁盘值")
})

test("W10-5 边界：Shell 三格——select System default ⇒ {value:\"\"} · custom 清空 ⇒ 零发值 + 就地回显 · custom 非空 ⇒ 发原值", () => {
  SS.shellCandidates = null
  SS.shellValue = null
  const n = capturedPosts.length
  openPanel()
  send({
    type: "shellCandidates",
    candidates: [{ name: "System default", value: null }, { name: "bash", value: "/bin/bash" }],
    current: "/opt/mysh", // 无匹配候选 ⇒ 自定义态（回显全表达式）
  })
  const sel = $("sh-select")
  const cus = $("sh-custom")
  assert.equal(sel.value, "__custom__", "无匹配 ⇒ 哨兵选中")
  assert.equal(cus.value, "/opt/mysh", "无匹配 ⇒ 自定义框 = 快照值")
  // ① 选 System default（屏值 ""）⇒ 发 {value:""}（路径册 #2：显式重置 ⇒ 宿主删键）
  sel.value = ""
  change(sel)
  assert.deepEqual(shellPosts(n), [{ type: "saveShellSettings", value: "" }], "System default = 显式重置（唯一删键触发）")
  // ② 自定义路径清空 ⇒ 零发值 + 就地回显（路径册 #3：空 = 未完成输入）
  cus.value = ""
  change(cus)
  assert.equal(shellPosts(n).length, 1, "空自定义路径零发值（未完成输入不是写意图）")
  assert.equal(cus.value, "/opt/mysh", "就地回显 = 回显全表达式（无匹配 ⇒ 自定义 + 值）")
  assert.equal(sel.value, "__custom__", "选择器随同式回显")
  // ③ 非空 ⇒ 发原值
  cus.value = "/usr/bin/zsh"
  change(cus)
  assert.deepEqual(
    shellPosts(n).map((m) => m.value),
    ["", "/usr/bin/zsh"],
    "非空自定义路径 ⇒ 发屏值",
  )
})

test("W10-6 边界（先红）：聚焦中被跳过的回填 ⇒ 基线冻结于现屏值；随后未改值 change ⇒ 零发值 + 徽标零亮（先红读数 = 1 条旧屏值 + 徽标 visible）", async () => {
  writeHostConfig({ proxy: { uri: PROXY_URI, web: true, model: false } }) // 盘面基点（宿主半）
  const cfgBefore = readFileSync(join(_tmp, "config.json"), "utf8")
  SS.proxySettings = null
  const n = capturedPosts.length
  openPanel()
  const uri = $("px-uri")
  uri.focus() // 聚焦中（回填跳过 ⇒ 基线冻结于现屏值 ""）
  send({ type: "proxySettings", settings: { uri: "http://new" } })
  assert.equal(uri.value, "", "聚焦中不被推送拍平（回填跳过）")
  change(uri) // 未改值的 change（blur/Enter 未编辑）
  const posts = proxyPosts(n)
  // 端到端（§2.6 ①②——同 W10-1 口径）：旧屏值零回写 ⇒ 盘面逐字节不变
  const panel = hostPanel([])
  for (const m of posts) await handlePanelMessage(panel, m)
  assert.equal(readFileSync(join(_tmp, "config.json"), "utf8"), cfgBefore, "config.json 逐字节不变（旧屏值零回写 ⇒ 零写盘）")
  assert.deepEqual(
    { posts, badge: badgeVisible() },
    { posts: [], badge: false },
    "旧屏值零回写（基线冻结 ⇒ 判别格：未改值侧）∧ 徽标零亮",
  )
})

test("W10-7 覆盖（N-W8 点名符号）：handleSetProviderProxy 两向写盘 + 未命中零变更", async () => {
  const posted = []
  const panel = hostPanel(posted)
  writeHostConfig({ providers: [{ name: "p1" }] })
  await handlePanelMessage(panel, { type: "setProviderProxy", name: "p1", proxy: true })
  assert.equal(loadRaw().providers[0].proxy, true, "勾选 ⇒ provider.proxy = true（写盘）")
  await handlePanelMessage(panel, { type: "setProviderProxy", name: "p1", proxy: false })
  assert.equal("proxy" in loadRaw().providers[0], false, "取消勾选 ⇒ 删字段（CLI injectProxy parity）")
  const before = readFileSync(join(_tmp, "config.json"), "utf8")
  await handlePanelMessage(panel, { type: "setProviderProxy", name: "nope", proxy: true })
  const after = readFileSync(join(_tmp, "config.json"), "utf8")
  assert.equal(after, before, "未命中条目 ⇒ 内容零变更（写面重写但盘面逐字节同）")
  assert.ok(posted.some((m) => m.type === "providerStatus"), "写后轻量快照重推（面板行刷新）")
})
