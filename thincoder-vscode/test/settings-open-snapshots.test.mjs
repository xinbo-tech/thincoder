/**
 * settings-open-snapshots.test.mjs — F-W8（设置面快照打开必达）机器验收。
 *
 * 判据权威 = `docs/vsc/design/SETTINGS.md` §2.8（打开拍必达——回批固定序 / 末位 = agentSettings）
 * + `docs/vsc/design/WEBVIEW-PROTOCOL.md` §12 方向口径（打开拍回批）；批档 = `docs/batches/
 * 2026-09-18-vsc-settings-wiring.md` §2.4 档 A（W8-1 / W8-2 / W8-3 · AC-W1）。
 *
 * 手法（批档 §2.4 夹具约定——**不沿用** smoke-settings.mjs 的灌 SS 手法）：host 侧 = 临时 config
 * （`_setConfigPathForTest` 指 tmp 文件）+ `Object.create(ChatPanel.prototype)` 桩（`_panel` 捕获
 * postMessage、`_agentSettingsSession = () => null`——真实 push 实现，非桩自证）；webview 侧 =
 * happy-dom + 全量 id 夹具 + 真 `chat.js` / `settings.js`（真 `openSettings` 打开路径）。
 * **绝不触碰真实 `~/.thincoder/`**。
 */
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { setupWebview, installFullIndexFixture } from "./helpers/webview-env.mjs"
import { handlePanelMessage } from "../src/extension/panel-messages.mjs"
import { _setShellDetectForTest } from "../src/extension/settings.mjs"
import { ChatPanel } from "../src/extension/chat-panel.mjs"
import { applyEngineFloorGuard } from "../extension.mjs"
import { _resetMemoryHandleForTest, ensureMemoryHandle } from "../src/embed-config.mjs"
import { _setConfigPathForTest } from "@thincoder/core/config-io.mjs"

const PROXY_URI = "http://127.0.0.1:7890"

let _tmp
let cleanupEnv

before(async () => {
  _tmp = mkdtempSync(join(tmpdir(), "tc-settings-open-"))
  writeFileSync(
    join(_tmp, "config.json"),
    JSON.stringify({ proxy: { uri: PROXY_URI, web: true, model: false } }),
    "utf8",
  )
  _setConfigPathForTest(join(_tmp, "config.json"))
  // 记忆面（真宿主路径的 `pushIndexStatus` 读面）：临时 config ⇒ `memoryDbPath` = tmp/memory.db
  // ——绝不触碰真实 `~/.thincoder/`；索引计数 = 本项目 origin 的 0 行 ⇒ status 非空（built:false）
  await applyEngineFloorGuard()
  await ensureMemoryHandle()
  const env = setupWebview()
  cleanupEnv = env.cleanup
  installFullIndexFixture() // 真 chat.js 顶层 init 读全量 index.html id
  await import("../webview/chat.js") // 真模块图：工具栏 #settings-btn 绑定 + 消息 case 唯一消费位
})

after(() => {
  try { window.dispatchEvent(new window.Event("unload")) } catch { /* happy-dom teardown edge */ }
  cleanupEnv()
  _resetMemoryHandleForTest()
  _setConfigPathForTest(null)
  try { rmSync(_tmp, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 }) } catch { /* Windows handle lag */ }
})

/** 桩面板：真实原型方法（`_pushIndexStatus` / `_pushSettingsLight` 走真实现）+ postMessage 捕获。 */
function hostPanel() {
  const posted = []
  const panel = Object.create(ChatPanel.prototype)
  Object.assign(panel, {
    _panel: { webview: { postMessage: (m) => { posted.push(m); return Promise.resolve(true) } } },
    _agentSettingsSession: () => null,
  })
  return { panel, posted }
}

const send = (data) => window.dispatchEvent(new window.MessageEvent("message", { data }))
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const $ = (id) => document.getElementById(id)

test("W8-1 打开拍回批序（AC-W1）：getAgentSettings ⇒ indexStatus → providerStatus · proxySettings · websearchSettings · shellCandidates → agentSettings（末位）", async () => {
  const { panel, posted } = hostPanel()
  await handlePanelMessage(panel, { type: "getAgentSettings" })
  assert.deepEqual(
    posted.map((m) => m.type),
    ["indexStatus", "providerStatus", "proxySettings", "websearchSettings", "shellCandidates", "agentSettings"],
    "回批固定序——三条快照（索引 / 代理 / 检索）随打开拍必达",
  )
  assert.equal(posted.at(-1).type, "agentSettings", "末位 = 打开等待器唯一触发拍（建面时快照已在位）")
  assert.deepEqual(posted.find((m) => m.type === "proxySettings").settings, { uri: PROXY_URI, web: true, model: false }, "代理快照 = 磁盘真值")
})

test("W8-2 建面即真值（AC-W1）：批逐条投递 ⇒ 代理控件 / 索引行建面真值（快照未达 ⇒ 空渲染）", async () => {
  const { panel, posted } = hostPanel()
  await handlePanelMessage(panel, { type: "getAgentSettings" })
  $("settings-btn").click() // 真 openSettings：发 getAgentSettings + 挂打开等待器
  for (const m of posted) send(m) // 宿主回批逐条投递（末位 agentSettings 触发 buildSettings）
  assert.equal($("px-uri").value, PROXY_URI, "建面 #px-uri = 快照真值（先红读数 = 空串——快照未达）")
  assert.equal($("px-web").checked, true, "#px-web 与快照一致（非渲染默认值）")
  assert.notEqual($("index-status").textContent, "—", "索引行已被快照驱动（temp 库 0 行 ⇒ 读数 = 未建索引；先红读数 = —）")
})

test("W8-3 边界：不回批（250ms 超时回落）⇒ 建面完成 + 零抛错（锁既有回落不回归）", async () => {
  $("settings-body").innerHTML = ""
  $("settings-btn").click()
  await sleep(320)
  assert.ok($("settings-body").innerHTML.length > 0, "丢失/未答的回批不得让面板停在不渲染态（0.0 保底）")
})

// ─── F-W18（`SETTINGS.md` §2.11）：shell 候选拉取异步化——静默判据取值方式 ①② ────────────────

test("W8-4（F-W18 ②）注入延迟伪探测：打开拍序零变 + 相邻两拍 < 2s + Promise.all 并发 + memo/在飞去重", async () => {
  // 注入 800ms 伪探测（同步阻塞面模拟）：顺序 await 3 候选 = 2.4s ⇒ 相邻拍 ≥ 2s 红线；
  // `Promise.all` 并发 ⇒ 单轮 ≈ 800ms。注入真值投影：wsl 未命中（载荷须反映本次注入）。
  let seen = []
  let inFlight = 0
  let maxInFlight = 0
  const fakeDetect = async (cmd) => {
    seen.push(cmd)
    inFlight += 1
    maxInFlight = Math.max(maxInFlight, inFlight)
    await sleep(800)
    inFlight -= 1
    return cmd !== "wsl"
  }
  _setShellDetectForTest(fakeDetect)
  const posted = []
  const panel = Object.create(ChatPanel.prototype)
  Object.assign(panel, {
    _panel: { webview: { postMessage: (m) => { posted.push({ type: m.type, at: Date.now(), msg: m }); return Promise.resolve(true) } } },
    _agentSettingsSession: () => null,
  })
  try {
    const t0 = Date.now()
    await handlePanelMessage(panel, { type: "getAgentSettings" })
    assert.deepEqual(
      posted.map((p) => p.type),
      ["indexStatus", "providerStatus", "proxySettings", "websearchSettings", "shellCandidates", "agentSettings"],
      "推送序契约零改（异步化后原序保持——§2.11 逐序断言即验收面）",
    )
    assert.ok(posted[0].at - t0 < 2000, `首拍 < 2s（实测 ${posted[0].at - t0}ms）`)
    for (let i = 1; i < posted.length; i += 1) {
      const gap = posted[i].at - posted[i - 1].at
      assert.ok(gap < 2000, `相邻两拍 < 2s：${posted[i - 1].type} → ${posted[i].type}（实测 ${gap}ms；顺序 await 则 ≥ 2s）`)
    }
    const perBatch = seen.length
    assert.ok(perBatch >= 2, `注入生效：伪探测被调用（${perBatch} 次）`)
    assert.ok(maxInFlight >= 2, `Promise.all 并发候选探测（同刻在飞峰值 ${maxInFlight}——顺序 await 恒 1）`)
    const cands = posted.find((p) => p.type === "shellCandidates").msg.candidates.map((c) => c.value)
    assert.ok(cands.includes("pwsh"), "命中面反映注入真值（win32 首候选 pwsh ∈ 载荷）")
    assert.ok(!cands.includes("wsl"), "注入未命中项（wsl）不入载荷——载荷确由本次注入驱动")
    // memo 保留（§2.11）：请求拍零重探（进程生命周期内一次探测）
    await handlePanelMessage(panel, { type: "getShellCandidates" })
    assert.equal(seen.length, perBatch, "memo 保留：请求拍不再探")
    // 在飞去重（§2.11）：并发请求共享同一批（不叠发探测）
    _setShellDetectForTest(fakeDetect) // 清 memo ⇒ 下一批真探
    seen = []
    maxInFlight = 0
    const beforeLen = posted.length
    await Promise.all([
      handlePanelMessage(panel, { type: "getShellCandidates" }),
      handlePanelMessage(panel, { type: "getShellCandidates" }),
    ])
    assert.equal(seen.length, perBatch, `在飞去重：两并发请求共享同一批（实测 ${seen.length} ≠ 单批 ${perBatch} ⇒ 叠发）`)
    assert.equal(posted.length, beforeLen + 2, "两请求各恰一拍回（消息面零丢）")
  } finally {
    _setShellDetectForTest(null)
  }
})

test("W8-5（F-W18 ①）静态扫描：探测链零同步形态（调用形态判据）+ 扫描域完整性 fail-closed", () => {
  const chain = ["src/extension/settings.mjs", "src/extension/chat-panel.mjs", "src/extension/panel-messages-settings.mjs"]
  const syncCall = /\b(spawnSync|execSync)\s*\(/ // 调用形态——注释里出现名字不算
  for (const rel of chain) {
    const src = readFileSync(new URL(`../${rel}`, import.meta.url), "utf8")
    assert.ok(!syncCall.test(src), `${rel}：探测链零同步形态（F-W18 判据①）`)
  }
  const settingsSrc = readFileSync(new URL("../src/extension/settings.mjs", import.meta.url), "utf8")
  assert.ok(settingsSrc.includes("execFile("), "正控：异步形态（execFile 回调式）在位")
  // 域完整性（fail-closed）：`src/**` + `extension.mjs` 中引用 shellCandidates 的文件恰为上述链
  const refs = []
  const walk = (rel) => {
    for (const e of readdirSync(new URL(`../${rel}`, import.meta.url), { withFileTypes: true })) {
      const p = `${rel}/${e.name}`
      if (e.isDirectory()) walk(p)
      else if (e.name.endsWith(".mjs")) refs.push(p)
    }
  }
  walk("src")
  refs.push("extension.mjs")
  const hit = refs.filter((rel) => readFileSync(new URL(`../${rel}`, import.meta.url), "utf8").includes("shellCandidates")).sort()
  assert.deepEqual(hit, [...chain].sort(), "新引用者 ⇒ 本断言失败 ⇒ 静态扫描域须同扩（调用链 = 扫描域）")
})
