/**
 * settings-refill.test.mjs — F-W9（控件级回填）+ F-W11 回填半 机器验收。
 *
 * 判据权威 = `docs/vsc/design/SETTINGS.md` §2.8（控件级回填表——四点 / 跳过聚焦中的控件 /
 * 行级重绘）+ §2.9（Shell 回显全表达式）；批档 = `docs/batches/2026-09-18-vsc-settings-wiring.md`
 * §2.4 档 C（W9-1…W9-5 · AC-W2）。
 *
 * 手法：happy-dom + 全量 id 夹具 + 真 `chat.js`（消息 case = 唯一消费位）+ 真 `settings.js`
 * 打开路径；回填断言一律在**消息投递之后**（载荷按 wire 形态——消费位 `webview/chat.js:213-224`
 * / `:275-277`）——**不沿用** smoke-settings.mjs 的灌 SS 手法（建面前只把 SS 置于「快照未达」
 * 态，用以构成先红前提；不断言建面路径）。
 */
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { setupWebview, installFullIndexFixture } from "./helpers/webview-env.mjs"
import { SS } from "../webview/settings-state.js"
import { t } from "../webview/i18n.js"

let cleanupEnv
let capturedPosts

before(async () => {
  const env = setupWebview()
  cleanupEnv = env.cleanup
  capturedPosts = env.capturedPosts
  installFullIndexFixture()
  await import("../webview/chat.js") // 真模块图：工具栏 #settings-btn 绑定 + 消息 case 唯一消费位
})

after(() => {
  try { window.dispatchEvent(new window.Event("unload")) } catch { /* happy-dom teardown edge */ }
  cleanupEnv()
})

const send = (data) => window.dispatchEvent(new window.MessageEvent("message", { data }))
const $ = (id) => document.getElementById(id)
const since = (n, type) => capturedPosts.slice(n).filter((m) => m.type === type)
const rowStatus = (rowId) => $(rowId)?.querySelector(".key-status")?.textContent ?? null

/** 打开面板：点 #settings-btn（真 openSettings）→ 回一条 agentSettings（打开等待器触发拍 ⇒ 同步建面）。 */
function openPanel() {
  $("settings-btn").click()
  send({ type: "agentSettings", settings: {} })
  assert.equal($("settings-panel").style.display, "flex", "面板已打开（回填只作用于活面板）")
}

test("W9-1 代理回填（AC-W2）：proxySettings 到达 ⇒ #px-uri 屏值 = 快照真值（先红读数 = 空串）", () => {
  SS.proxySettings = null // 快照未达拍（建面 = 空渲染——先红前提）
  openPanel()
  assert.equal($("px-uri").value, "", "建面当时无快照 ⇒ 空渲染（先红读数）")
  send({ type: "proxySettings", settings: { uri: "http://127.0.0.1:7890", web: true, model: false } })
  assert.equal($("px-uri").value, "http://127.0.0.1:7890", "收到即刷活控件（不重建整卡）")
  assert.equal($("px-web").checked, true, "#px-web 同拍覆写")
})

test("W9-2 边界：shellCandidates（扁平载荷）⇒ #sh-select 选中匹配候选 + #sh-custom 空（先红读数 = 空串）", () => {
  SS.shellCandidates = null
  SS.shellValue = null
  openPanel()
  send({
    type: "shellCandidates",
    candidates: [{ name: "System default", value: null }, { name: "bash", value: "/bin/bash" }],
    current: "/bin/bash",
  })
  assert.equal($("sh-select").value, "/bin/bash", "匹配候选 ⇒ 回到该候选")
  assert.equal($("sh-custom").value, "", "匹配候选 ⇒ 自定义框清空（回显全表达式）")
  assert.deepEqual([...$("sh-select").options].map((o) => o.value), ["", "/bin/bash", "__custom__"], "选项表 = 候选表（`value || \"\"`）+ 自定义哨兵项")
})

test("W9-3 正常：websearchSettings 到达 ⇒ #row-websearch 整行重绘（状态词 **** + 删除钮）（先红读数 = — + 仅 Add 钮）", () => {
  SS.websearchSettings = {}
  openPanel()
  assert.equal(rowStatus("row-websearch"), "—", "建面当时无 key ⇒ —（先红读数）")
  assert.equal($("row-websearch").querySelector(".del-key"), null, "建面当时仅 Add 钮")
  send({ type: "websearchSettings", settings: { hasKey: true } })
  assert.equal(rowStatus("row-websearch"), "****", "状态词随快照翻真")
  assert.ok($("row-websearch").querySelector(".del-key"), "删除钮在位（hasKey 分支整行重绘）")
})

test("W9-4 正常：indexStatus 到达 ⇒ #row-embed 键行 + #index-status 读数（先红读数 = #row-embed 保持 —）", () => {
  SS.indexStatus = null
  openPanel()
  assert.equal(rowStatus("row-embed"), "—", "建面当时无快照 ⇒ —（先红读数）")
  send({ type: "indexStatus", status: { built: true, files: 3, chunks: 9, hasEmbedder: true }, hasEmbedder: true })
  assert.equal(rowStatus("row-embed"), "****", "D-W5：异步 indexStatus 晚于 agentSettings 到达也须刷 #row-embed（假阴性消除）")
  assert.ok($("row-embed").querySelector(".del-key"), "删除钮在位（hasEmbedder 分支整行重绘）")
  assert.equal($("index-status").textContent, t("settings.indexBuilt", { files: 3, chunks: 9 }), "索引读数 = 核库计数（既有面零回归；断言经 i18n 模板——不硬编文）")
})

test("W9-5 边界：聚焦中的控件不被推送拍平（U-S10）∧ 随后确改值 ⇒ 发屏值（旧值零回写）", () => {
  SS.proxySettings = null
  openPanel()
  const n = capturedPosts.length
  const uri = $("px-uri")
  send({ type: "proxySettings", settings: { uri: "http://baseline" } }) // 基线来源 = 真推送（不灌 SS）
  assert.equal(uri.value, "http://baseline", "回填写入 = 基线写入点")
  uri.value = "http://half-filled" // 用户半填
  uri.focus() // 聚焦中
  send({ type: "proxySettings", settings: { uri: "http://pushed-value" } })
  assert.equal(uri.value, "http://half-filled", "聚焦中屏值不被推送覆写（回填与用户输入互不覆盖）")
  uri.value = "http://final" // 用户确改值
  uri.dispatchEvent(new window.Event("change"))
  assert.deepEqual(since(n, "saveProxySettings"), [{ type: "saveProxySettings", settings: { uri: "http://final" } }], "发值 = 屏值（旧屏值零回写）")
})
