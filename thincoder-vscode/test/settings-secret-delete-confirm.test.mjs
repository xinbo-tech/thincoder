/**
 * settings-secret-delete-confirm.test.mjs — F-W17（不可复得类删除二次确认）机器验收。
 *
 * 判据权威 = `docs/vsc/design/SETTINGS.md` §2.10（类判据 / 入口册 / 弹框契约 / 四条取消路径 /
 * 判据域边界）；用例与先红读数单源 = 批档 `docs/batches/2026-09-18-vsc-key-delete-confirm.md`
 * §2.4（W17-1…W17-13 / W17-18——密钥 / 嵌入 key 类）+ §2.5（AC-FW17-1…8）·
 * `docs/batches/2026-09-19-vsc-provider-delete-confirm.md` §2.4（W17-14 / W17-15 / W17-17 同号改判 +
 * W17-26…W17-30——provider 行扩域）+ §2.5（AC-FW17C-1…9）·
 * `docs/batches/2026-09-19-vsc-model-menu-delete-confirm.md` §2.5（W17-17 同号改判——判据域扩至 **9 档**：
 * 设置面档 ∪ `webview/model-picker.js`（入口 6 载体档）；W17-31…W17-34 = 入口 6 组，住
 * `test/model-menu-delete-confirm.test.mjs`）。
 * **MCP server 行组（W17-16 / W17-19…W17-25）已按拆分登记析出** = `test/settings-mcp-delete-confirm.test.mjs`
 * （触发 = 实现轮末实读 **505 行** ≥ 500——`SETTINGS.md` §3 拆分条 · 批档 §2.5 AC-FW17C-8）。
 *
 * 手法：happy-dom + 全量 id 夹具 + 真 `chat.js`（消息 case = 唯一消费位）+ 真 `settings.js`；
 * 驱动 = 真 DOM `.click()`。**行内属性绑定在夹具（happy-dom）下不可驱动**（设计轮实测：调用
 * `.click()` ⇒ posts +0）——密钥行两个控件因此经 `renderKeyRow` 单点改 `addEventListener`
 * （W17-18 = 该改造的动作面判据）；provider 行卡载体的行内 `onclick` 本批按同一实测改
 * `data-name` + 卡级装配位绑定（W17-14 = 该改造的动作面判据），编辑行取消重建位本已是
 * `addEventListener`（W17-15 真点击可驱动）。
 */
import { test, before, beforeEach, after } from "node:test"
import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
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
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
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
/** provider 行 −（`SETTINGS.md` §2.10 入口册 #4——2026-09-19 改判入本门；载体 = 卡 HTML `data-name`）。 */
const provDel = (name) => $(`prov-${name}`)?.querySelector(".del-key")
const provEntry = (extra = {}) => ({ configured: true, masked: "sk-…", model: "m1", ...extra })
/** provider 状态推（真消息路径）——打开拍前铺行 / 打开后在位重绘（值变 ⇒ 卡整卡重建）。 */
function pushProviders(providers) {
  send({ type: "providerStatus", keyOk: true, status: { providers, labels: {}, presets: [] } })
}

test("W17-1 正常（先红：点击即发）：密钥行 ✕ ⇒ 不立即发删除消息 ∧ 确认面在位", () => {
  openPanelWith({ websearchHasKey: true })
  const n = capturedPosts.length
  click(keyRowDel("row-websearch"))
  assert.deepEqual(capturedPosts.slice(n), [], "点击 ✕ 不得发任何删除消息（确认前零发值）")
  assert.equal(popovers().length, 1, "密钥类删除须过一次显式确认（弹框在位）")
  assert.equal(backdrops().length, 1, "遮罩同拍在位")
})

test("W17-2 正常（先红：无框可依）：✕ → 确认 ⇒ 恰 1 条 deleteWebsearchKey ∧ 弹框 + 遮罩移除", () => {
  openPanelWith({ websearchHasKey: true })
  const n = capturedPosts.length
  click(keyRowDel("row-websearch"))
  click(document.querySelector(".auto-confirm-yes"))
  assert.deepEqual(since(n, "deleteWebsearchKey"), [{ type: "deleteWebsearchKey" }], "确认后才发——恰 1 条")
  assert.equal(popovers().length, 0, "确认后弹框移除")
  assert.equal(backdrops().length, 0, "确认后遮罩移除")
})

test("W17-3 正常（先红：点击即发）：嵌入 key ✕ → 确认 ⇒ 点击零发值 ∧ 确认后恰 1 条 deleteEmbedKey", () => {
  openPanelWith({ embedder: true })
  const n = capturedPosts.length
  click(keyRowDel("row-embed"))
  assert.deepEqual(capturedPosts.slice(n), [], "点击 ✕ 零发值")
  assert.equal(popovers().length, 1, "确认面在位")
  click(document.querySelector(".auto-confirm-yes"))
  assert.deepEqual(since(n, "deleteEmbedKey"), [{ type: "deleteEmbedKey" }], "确认后恰 1 条")
})

test("W17-4 正常/无 UI 载体入口（先红：调用即发）：window._delKey ⇒ 确认后才发 deleteProviderKey", () => {
  openPanel()
  const n = capturedPosts.length
  window._delKey("deepseek", document.createElement("button")) // 死 handler：所有密钥类删除路径同门
  assert.deepEqual(since(n, "deleteProviderKey"), [], "调用零发值")
  assert.equal(popovers().length, 1, "无 UI 载体的密钥 handler 同过确认门")
  click(document.querySelector(".auto-confirm-yes"))
  assert.deepEqual(since(n, "deleteProviderKey"), [{ type: "deleteProviderKey", name: "deepseek" }], "确认后恰 1 条（载荷逐字同既有）")
})

test("W17-5 取消：取消钮 ⇒ 零发值 ∧ 弹框/遮罩移除 ∧ 键行 outerHTML 逐字同点击前", () => {
  openPanelWith({ websearchHasKey: true })
  const before = $("row-websearch").outerHTML
  const n = capturedPosts.length
  click(keyRowDel("row-websearch"))
  click(document.querySelector(".auto-confirm-no"))
  assert.deepEqual(capturedPosts.slice(n), [], "取消 ⇒ 零发值（任何消息都不发）")
  assert.equal(popovers().length + backdrops().length, 0, "弹框与遮罩同清")
  assert.equal($("row-websearch").outerHTML, before, "行内状态复原 = 从未改变（取消路径不触碰键行 DOM）")
})

test("W17-6 取消：点遮罩 ⇒ 零发值 ∧ 弹框 + 遮罩移除 ∧ 键行 outerHTML 逐字同", () => {
  openPanelWith({ websearchHasKey: true })
  const before = $("row-websearch").outerHTML
  const n = capturedPosts.length
  click(keyRowDel("row-websearch"))
  click(document.querySelector(".auto-backdrop"))
  assert.deepEqual(capturedPosts.slice(n), [], "遮罩取消 ⇒ 零发值")
  assert.equal(popovers().length + backdrops().length, 0, "弹框与遮罩同清")
  assert.equal($("row-websearch").outerHTML, before, "行内状态复原 = 从未改变（取消路径不触碰键行 DOM）")
})

test("W17-7 取消：框内 Escape ⇒ 零发值 ∧ 弹框移除 ∧ 面板保持打开", () => {
  openPanelWith({ websearchHasKey: true })
  const before = $("row-websearch").outerHTML
  const n = capturedPosts.length
  click(keyRowDel("row-websearch"))
  const pop = document.querySelector(".auto-confirm")
  assert.ok(pop, "弹框在位")
  pop.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }))
  assert.deepEqual(capturedPosts.slice(n), [], "框内 Escape ⇒ 零发值")
  assert.equal(popovers().length, 0, "弹框移除")
  assert.equal($("settings-panel").style.display, "flex", "面板保持打开（框内拦截 stopPropagation——不连带关面板）")
  assert.equal($("row-websearch").outerHTML, before, "行内状态复原 = 从未改变（取消路径不触碰键行 DOM）")
})

test("W17-8 取消：关面板 ⇒ 零发值 ∧ 弹框 + 遮罩移除（closeSettings 同清）", () => {
  openPanelWith({ websearchHasKey: true })
  const before = $("row-websearch").outerHTML
  const n = capturedPosts.length
  click(keyRowDel("row-websearch"))
  assert.equal(popovers().length + backdrops().length, 2, "开框在位（先红读数 = 0——无框可依）")
  click($("settings-close"))
  assert.deepEqual(capturedPosts.slice(n), [], "关面板 ⇒ 零发值")
  assert.equal(popovers().length + backdrops().length, 0, "弹框与遮罩随面板关闭同清")
  assert.equal($("row-websearch").outerHTML, before, "行内状态复原 = 从未改变（取消路径不触碰键行 DOM）")
})

test("W17-9 边界（误点连点）：连点 ✕ 两次 ⇒ 单例（恒 1）∧ 双击第二击不得误确认", () => {
  openPanelWith({ websearchHasKey: true })
  const n = capturedPosts.length
  const del = keyRowDel("row-websearch")
  click(del)
  click(del) // 键行未变（弹框挂 document.body）⇒ 第二击只重开，不开第二个框
  assert.equal(popovers().length, 1, "单例：跨连开只剩一个框")
  const yes = document.querySelector(".auto-confirm-yes")
  yes.dispatchEvent(new window.MouseEvent("click", { detail: 2, bubbles: true })) // 双击第二击
  assert.deepEqual(capturedPosts.slice(n), [], "双击第二击不得误确认（连点护栏）")
  assert.equal(popovers().length, 1, "护栏命中 ⇒ 弹框仍在（未被确认、也未被关闭）")
})

test("W17-10 边界（跨入口单例）：websearch ✕ → embed ✕ → 确认 ⇒ 只发最后一次开框的入口", () => {
  openPanelWith({ websearchHasKey: true, embedder: true })
  const n = capturedPosts.length
  click(keyRowDel("row-websearch"))
  click(keyRowDel("row-embed"))
  assert.equal(popovers().length, 1, "单例：跨入口连开只剩一个框")
  assert.deepEqual(capturedPosts.slice(n), [], "开框零发值")
  click(document.querySelector(".auto-confirm-yes"))
  assert.deepEqual(capturedPosts.slice(n), [{ type: "deleteEmbedKey" }], "动作只对应最后一次开框（websearch 那条零出现）")
})

test("W17-11 边界（弹框在位时整行重绘）：载荷闭包——重绘不改删除目标、不吞确认", () => {
  openPanelWith({ websearchHasKey: true })
  const n = capturedPosts.length
  click(keyRowDel("row-websearch"))
  send({ type: "websearchSettings", settings: { hasKey: true } }) // 键行整行重绘（弹框挂 body ⇒ 不受影响）
  assert.equal(popovers().length, 1, "弹框在位态不被行重绘打断")
  click(document.querySelector(".auto-confirm-yes"))
  assert.deepEqual(since(n, "deleteWebsearchKey"), [{ type: "deleteWebsearchKey" }], "确认动作 = 开框时捕获的闭包（重绘后仍发原载荷目标）")
})

test("W17-12 键盘：开框 ⇒ 焦点落「取消」（安全默认）", async () => {
  openPanelWith({ websearchHasKey: true })
  click(keyRowDel("row-websearch"))
  const no = document.querySelector(".auto-confirm-no")
  assert.ok(no, "弹框在位")
  await waitFor(() => document.activeElement === no) // 时机 = 条件（焦点定时器落地）——非固定 sleep
  assert.equal(document.activeElement, no, "焦点落取消钮（与既有两处弹框同规）")
})

test("W17-13 i18n 双源：弹框正文 = settings.secretDeleteConfirm 的 zh / en 逐字（≠ 键名）", () => {
  const zh = JSON.parse(readFileSync(join(LOCALES_DIR, "zh.json"), "utf8"))
  const en = JSON.parse(readFileSync(join(LOCALES_DIR, "en.json"), "utf8"))
  assert.equal(typeof zh["settings.secretDeleteConfirm"], "string", "zh 键在册（先红读数 = undefined）")
  assert.equal(typeof en["settings.secretDeleteConfirm"], "string", "en 键在册（先红读数 = undefined）")
  openPanelWith({ websearchHasKey: true })
  for (const [locale, strings] of [["zh", zh], ["en", en]]) {
    setStrings(strings)
    click(keyRowDel("row-websearch"))
    const text = document.querySelector(".auto-confirm-text")?.textContent
    assert.equal(text, strings["settings.secretDeleteConfirm"], `${locale}：弹框正文 = 该 locale 的键值（双源在册）`)
    assert.notEqual(text, "settings.secretDeleteConfirm", `${locale}：缺键回退返回键名 ⇒ 不得通过`)
    click(document.querySelector(".auto-confirm-no"))
  }
})

test("W17-14 正常（卡载体 · 先红：夹具点不到行内 handler）：provider 行 − ⇒ 不立即发删除消息 ∧ 确认面在位", () => {
  pushProviders({ p1: provEntry() })
  openPanel()
  const del = provDel("p1")
  assert.ok(del, "provider 行 − 钮在位（卡 HTML 生成位）")
  const n = capturedPosts.length
  click(del) // 真点击：载体 = `data-name` + 卡级装配位 `addEventListener`
  assert.deepEqual(capturedPosts.slice(n), [], "点击 − 不得发任何删除消息（确认前零发值）")
  assert.equal(popovers().length, 1, "provider 行 − 须过一次显式确认（弹框在位）")
  assert.equal(backdrops().length, 1, "遮罩同拍在位")
  // 结构半条：载体 = `data-name` 承载 ∧ 行内 `onclick` 退场（绑定迁卡级装配位——两建面路径共同单点）
  const cardSrc = readFileSync(join(WEBVIEW_DIR, "settings-providers.js"), "utf8")
  assert.ok(cardSrc.includes('class="key-btn del-key" data-name="${escHtml(name)}"'), "provider 行 − 的载体 = data-name（本批改判）")
  assert.ok(!cardSrc.includes('onclick="window._removeProvider('), "行内 onclick 承载已退场")
})

test("W17-15 正常（编辑行取消重建位 · 先红：点击即发）：重建行的 − ⇒ 不立即发删除消息 ∧ 确认面在位", () => {
  pushProviders({ p1: provEntry() })
  openPanel()
  window._editKey("p1") // 进编辑态（[Change] 仍是行内 onclick——见 W17-14 结构面；夹具下直驱 handler）
  const row = $("rowline-p1")
  assert.ok(row.querySelector("input"), "编辑态输入框在位")
  click([...row.querySelectorAll(".key-btn")].at(-1)) // [Cancel] ⇒ onCancel 重建静止行（重建的 − = addEventListener 自绑）
  const n = capturedPosts.length
  click(row.querySelector("button.del-key")) // 真点击（该载体本就可驱动 ⇒ 真红）
  assert.deepEqual(capturedPosts.slice(n), [], "重建位的 − 点击零发值（两载体汇入同一门）")
  assert.equal(popovers().length, 1, "确认面在位")
})

test("W17-17 结构对账（fail-closed · 域扩改判）：域 9 档删除入口集（delete* ∪ remove*）↔ 入口册 5 名逐名对齐", () => {
  // 判据域 = 设置面档 `webview/settings*.js`（实读 8 档）∪ **显式名单** `webview/model-picker.js`
  // （入口 6 载体档——2026-09-19 模型菜单批扩域；扫描式 = 正则 ∪ 显式名单）⇒ 9 档，域外档一律不入集。
  const files = [...readdirSync(WEBVIEW_DIR).filter((f) => /^settings.*\.js$/.test(f)), "model-picker.js"].sort()
  assert.ok(files.length >= 6, `扫描域 = 设置面档 webview/settings*.js ∪ 显式名单 model-picker.js（实读 ${files.length} 档）`)
  const emitted = new Set()
  const gateSpans = []
  const plainSpans = []
  const domainSrc = []
  for (const f of files) {
    const src = readFileSync(join(WEBVIEW_DIR, f), "utf8")
    domainSrc.push(src)
    for (const m of emitsIn(src)) emitted.add(m)
    gateSpans.push(...callArgSpans(src, "_confirmSecretDelete("))
    plainSpans.push(...callArgSpans(src, "_confirmDelete("))
  }
  // 入口册 5 名 = 不可复得类全数（`SETTINGS.md` §2.10 判据域边界）——provider 行 −（removeProvider）
  // provider 行批改判入集（删整条时 apiKey 原文随条目消失）；入口 6（模型菜单 footer）本批新增 =
  // 同消息**第二载体**（域内 `removeProvider` **2 处**——`settings-providers.js:68` + `model-picker.js:25`；
  // D3 计数映射 = 入口册 6 行 ↔ 判别名 5 个）。两语族合并扫描（delete* ∪ remove*）⇒ 新增
  // 删除入口（任一族）未登记即红 + 点名（fail-closed，不依赖单一命名族）。
  const ENTRIES = ["deleteEmbedKey", "deleteMcpServer", "deleteProviderKey", "deleteWebsearchKey", "removeProvider"]
  assert.deepEqual(
    [...emitted].sort(),
    [...ENTRIES].sort(),
    `域内删除发射集（delete* ∪ remove*）须与入口册 5 名逐名同（未登记的新判别式 ⇒ 红 + 点名；实读 ${JSON.stringify([...emitted].sort())}）`,
  )
  for (const name of ENTRIES) {
    const total = emitsIn(domainSrc.join("\n")).filter((n) => n === name).length
    const gated = gateSpans.reduce((acc, s) => acc + emitsIn(s).filter((n) => n === name).length, 0)
    assert.equal(gated, total, `${name}：每处发射都须落在 _confirmSecretDelete 实参括号内（实读 ${gated}/${total}）`)
  }
  // 直通门：实参内零删除发射 ∧ 调用点收敛为 0（可重填类空域——`SETTINGS.md` §2.10「本批后态」）
  assert.deepEqual(emitsIn(plainSpans.join("\n")), [], "_confirmDelete 实参内的删除发射 = 0（域内无一走直通）")
  const plainCalls = domainSrc.reduce((acc, src) => acc + (src.split("_confirmDelete(").length - 1), 0)
  assert.equal(plainCalls, 0, `_confirmDelete 调用点收敛为 0——设置面删除入口唯一通道 = 确认门（实读 ${plainCalls}）`)
  // 域外正控：`deleteSession` 确实存在（域边界 = 声明式收窄，非「不存在」）但不入集
  assert.ok(emitsIn(readFileSync(join(WEBVIEW_DIR, "session-bar.js"), "utf8")).includes("deleteSession"), "域外档确有 delete* 发射")
  assert.ok(!emitted.has("deleteSession"), "域外 deleteSession（webview/session-bar.js——非本判据域）不入集")
})

test("W17-18 边界（重绘后绑定在位）：[Change] 可编辑 ∧ ✕ 出确认（不直发）", async () => {
  openPanelWith({ websearchHasKey: true })
  send({ type: "websearchSettings", settings: { hasKey: true } }) // 推送触发整行重绘（绑定须随渲染重建）
  const n = capturedPosts.length
  click($("row-websearch").querySelector(".key-btn:not(.del-key)")) // [Change]
  assert.ok($("row-websearch").querySelector("input"), "[Change] ⇒ 行内 input 在位（绑定不丢）")
  await waitFor(() => document.activeElement === $("row-websearch").querySelector("input")) // 等 keyRowEdit 的 focus 定时器落地
  const editBtns = [...$("row-websearch").querySelectorAll(".key-btn")]
  click(editBtns.at(-1)) // [Cancel] ⇒ onCancel 重建（同点重绘 + 重绑）
  assert.equal($("row-websearch").querySelector("input"), null, "取消 ⇒ 回键行静止态")
  click(keyRowDel("row-websearch"))
  assert.deepEqual(capturedPosts.slice(n), [], "✕ ⇒ 不直发（弹框路径）")
  assert.equal(popovers().length, 1, "重绘后绑定在位：确认面可开")
})

// ─── provider 行组（入口册 #4 · 2026-09-19 改判入本门——批档 2026-09-19-vsc-provider-delete-confirm.md §2.4）───

test("W17-26 正常（先红：无框可依）：卡行 − → 确认 ⇒ 恰 1 条 removeProvider{name:p1} ∧ 弹框 + 遮罩移除", () => {
  pushProviders({ p1: provEntry() })
  openPanel()
  const n = capturedPosts.length
  click(provDel("p1"))
  click(document.querySelector(".auto-confirm-yes"))
  assert.deepEqual(since(n, "removeProvider"), [{ type: "removeProvider", name: "p1" }], "确认后才发——恰 1 条（消息名 / 载荷逐字同既有）")
  assert.equal(popovers().length, 0, "确认后弹框移除")
  assert.equal(backdrops().length, 0, "确认后遮罩移除")
})

test("W17-27 取消（provider 入口 · 路径 #1 取消钮）：零发值 ∧ 弹框/遮罩移除 ∧ 行 outerHTML 逐字同点击前", () => {
  pushProviders({ p1: provEntry() })
  openPanel()
  const before = $("prov-p1").outerHTML
  const n = capturedPosts.length
  click(provDel("p1"))
  click(document.querySelector(".auto-confirm-no"))
  assert.deepEqual(capturedPosts.slice(n), [], "取消 ⇒ 零发值（任何消息都不发）")
  assert.equal(popovers().length + backdrops().length, 0, "弹框与遮罩同清")
  assert.equal($("prov-p1").outerHTML, before, "行内状态复原 = 从未改变（取消路径不触碰卡行 DOM）")
})

test("W17-28 取消（provider 入口 · 路径 #4 关面板）：零发值 ∧ 弹框 + 遮罩移除（closeSettings 同清）", () => {
  pushProviders({ p1: provEntry() })
  openPanel()
  const n = capturedPosts.length
  click(provDel("p1"))
  assert.equal(popovers().length + backdrops().length, 2, "开框在位（先红读数 = 0——无框可依）")
  click($("settings-close"))
  assert.deepEqual(capturedPosts.slice(n), [], "关面板 ⇒ 零发值")
  assert.equal(popovers().length + backdrops().length, 0, "弹框与遮罩随面板关闭同清（provider 入口同清路径）")
})

test("W17-29 边界（弹框在位时卡重绘）：重绘不改删除目标、不吞确认", () => {
  pushProviders({ p1: provEntry() })
  openPanel()
  const rowBefore = $("prov-p1")
  const n = capturedPosts.length
  click(provDel("p1"))
  pushProviders({ p1: provEntry({ model: "m2" }) }) // 值变 ⇒ renderProvidersCard 走 outerHTML 整卡重建
  assert.notEqual($("prov-p1"), rowBefore, "卡重绘确已发生（旧行节点被替换）")
  assert.equal(popovers().length, 1, "弹框在位态不被卡重绘打断")
  click(document.querySelector(".auto-confirm-yes"))
  assert.deepEqual(since(n, "removeProvider"), [{ type: "removeProvider", name: "p1" }], "确认后仍发原载荷目标（重绘不改删除目标）——本例不判闭包形态（形态由代码面复核守）")
})

test("W17-30 边界（多行取目标）：点第 2 行 − → 确认 ⇒ 恰 1 条 removeProvider{name:p2} ∧ 零 p1", () => {
  pushProviders({ p1: provEntry(), p2: provEntry() })
  openPanel()
  const n = capturedPosts.length
  assert.equal(document.querySelectorAll("#prov-list .del-key").length, 2, "两行两钮在位")
  click(provDel("p2"))
  click(document.querySelector(".auto-confirm-yes"))
  assert.deepEqual(since(n, "removeProvider"), [{ type: "removeProvider", name: "p2" }], "载荷取点击钮的 data-name（不取首行）")
  assert.equal(since(n, "removeProvider").filter((m) => m.name === "p1").length, 0, "p1 零出现")
})

/** 扫出 src 中全部 `delete*` ∪ `remove*` 消息判别式字面量（引号三态不限 + 属性顺序不限——不认书写
 *  形态的识别即 fail-closed 漏洞：漏计的判别式不会被点名）。扫描对象 = **原始源码文本**（注释 /
 *  字符串体一并计入 ⇒ 注释里出现该字面量会假红，遮蔽面由评审判——`SETTINGS.md` §2.10 三层范围限制）。 */
function emitsIn(src) {
  return [...src.matchAll(/type\s*:\s*['"`]((?:delete|remove)[A-Za-z0-9_]*)['"`]/g)].map((m) => m[1])
}

/** 条件轮询（替代固定 sleep——不靠定时器拍子余量）。 */
async function waitFor(cond, ms = 500) {
  const t0 = Date.now()
  while (Date.now() - t0 < ms) {
    if (cond()) return true
    await sleep(10)
  }
  return cond()
}

/** 提取 src 中每处 `opener`（形如 `foo(`）调用的实参区间——原文括号配对（字符串 / 注释体不剥离，
 *  够本结构对账用）。 */
function callArgSpans(src, opener) {
  const out = []
  for (let i = src.indexOf(opener); i !== -1; i = src.indexOf(opener, i + opener.length)) {
    let depth = 1
    let j = i + opener.length
    while (j < src.length && depth > 0) {
      if (src[j] === "(") depth += 1
      else if (src[j] === ")") depth -= 1
      j += 1
    }
    out.push(src.slice(i + opener.length, j - 1))
  }
  return out
}
