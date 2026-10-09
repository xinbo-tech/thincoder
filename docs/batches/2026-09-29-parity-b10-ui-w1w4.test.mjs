/**
 * b10-w1w4.test.mjs — parity-b10-ui 批 · W1 小件横扫 + W4 渲染面残余 批内件（最小面）。
 * 覆盖 = E1（探针目标收编）· I1–I6（i18n 值面 ∕ 键面）· S13（遮罩字面单源）· R1（首屏引导层三态）· R3 残余（复读面）。
 * 跑法：`node --test .thincoder/tmp/b10-w1w4.test.mjs`（cwd = 仓根）——W6 汇总并入
 * `docs/batches/2026-09-29-parity-b10-ui.test.mjs`（本件 = 暂存件，勿直接写批内目录）。
 * 判据面 = 批档 `docs/batches/2026-09-29-parity-b10-ui.md` §2.6 逐行「判据」列 + §2.12 用例表（T1 ∕ T11 ∕ T10 波面部分）。
 * 零第三方依赖（仅 node: 内建）；不读仓外件；不触盘（E1 ∕ R1 用临时目录 ∕ 假 DOM）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { createRequire } from "node:module"
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import "../../thincoder-desktop/test/rc-resolve.mjs" // `/rc/` 解析钩子（须先于 app.mjs 取件）

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..") // 仓根
const at = (p) => pathToFileURL(join(ROOT, p)).href
const read = (p) => readFileSync(join(ROOT, p), "utf8")
const deskReq = createRequire(join(ROOT, "thincoder-desktop/package.json"))
const vscReq = createRequire(join(ROOT, "thincoder-vscode/package.json"))
const coreAt = (p) => pathToFileURL(deskReq.resolve("@thincoder/core/" + p)).href
const NOW = 1_800_000_000_000

// ─── T1 · E1：探针目标（有效档位逐字段 ∕ 非串 key 不抛 ⇒ ""）─────────────────────

test("E1 判据：有效档位（串 key ∕ 缺 key ∕ proxy 两向）逐字段同值；非串 key 不抛 ⇒ \"\"", async () => {
  const coreIo = await import(coreAt("config-io.mjs"))
  const flows = await import(coreAt("provider-flows.mjs"))
  const dir = mkdtempSync(join(tmpdir(), "b10-e1-"))
  const cfg = join(dir, "config.json")
  writeFileSync(cfg, JSON.stringify({ proxy: { uri: "http://proxy.local:3128", model: true } }))
  coreIo._setConfigPathForTest(cfg)
  try {
    // ① 串 key（trim 归一）· 未开渠级代理 ⇒ proxyUri undefined
    assert.deepEqual(
      flows.probeTargetOf({ name: "a", baseURL: "https://a.example/v1", apiKey: " sk-1 ", format: "openai" }),
      { name: "a", baseURL: "https://a.example/v1", apiKey: "sk-1", format: "openai", proxyUri: undefined })
    // ② 缺 key ⇒ ""（探针照常构造——如实失败）
    assert.deepEqual(flows.probeTargetOf({ name: "b" }),
      { name: "b", baseURL: undefined, apiKey: "", format: undefined, proxyUri: undefined })
    // ③ proxy 正向：渠级 proxy:true ∧ 盘上 uri 在案 ⇒ 走代理（逐渠——model 键零影响）
    assert.equal(flows.probeTargetOf({ name: "c", apiKey: "k", proxy: true }).proxyUri, "http://proxy.local:3128")
    // ④ proxy 反向：渠级 proxy:false ⇒ 直连
    assert.equal(flows.probeTargetOf({ name: "d", apiKey: "k", proxy: false }).proxyUri, undefined)
    // ⑤ 非串 key：不再抛（KD-B10-4 行为微正）⇒ ""
    assert.equal(flows.probeTargetOf({ name: "e", apiKey: 123 }).apiKey, "")
    // ⑥ proxy.model:false 零影响（逐渠独立·去全局闸）：渠级 true ∧ uri 在案 ⇒ 仍走代理
    writeFileSync(cfg, JSON.stringify({ proxy: { uri: "http://proxy.local:3128", model: false } }))
    assert.equal(flows.probeTargetOf({ name: "f", apiKey: "k", proxy: true }).proxyUri, "http://proxy.local:3128")
  } finally {
    coreIo._resetConfigPathForTest()
  }
})

test("E1 结构：VSC 本地版已删（presets.mjs）· 唯一消费点改指核 probeTargetOf", async () => {
  const presets = await import(at("thincoder-vscode/src/extension/presets.mjs"))
  assert.equal("probeTargetFromEntry" in presets, false, "本地版已删（导出面零残留）")
  assert.equal(typeof presets.sanitizeConsultModels, "function", "同档余面不动")
  assert.ok(!read("thincoder-vscode/src/extension/presets.mjs").includes("probeTargetFromEntry"), "档头 ∕ 本体零残名")
  const write = read("thincoder-vscode/src/extension/settings-panel-write.mjs")
  assert.match(write, /import \{ probeTargetOf \} from "@thincoder\/core\/provider-flows\.mjs"/)
  assert.match(write, /probeChannelModels\(name, probeTargetOf\(entry\)\)/)
  assert.ok(!write.includes("probeTargetFromEntry"), "写面零本地版引用")
})

// ─── T2 · I1 ∕ I6：VSC locales 值面（三端 zh 逐字同 ∕ 补译）────────────────────

test("I1 判据：susp.* zh 三端逐字同（VSC 改 = CLI 措辞）；en 零变；桌面段渲染读数同", async () => {
  const vscZh = JSON.parse(read("thincoder-vscode/locales/zh.json"))
  const vscEn = JSON.parse(read("thincoder-vscode/locales/en.json"))
  const i18n = await import(at("thincoder-desktop/renderer/i18n.mjs"))
  const seg = await import(at("thincoder-desktop/renderer/views/statusline-segments.mjs"))
  assert.equal(vscZh["susp.running"], "后台 ${n} 子代理运行中")
  assert.equal(vscZh["susp.digesting"], "${n} 完成待消化")
  assert.equal(vscZh["susp.running"], i18n.HOST_DICT.zh["susp.running"], "VSC zh = 桌面 zh（逐字）")
  assert.equal(vscZh["susp.digesting"], i18n.HOST_DICT.zh["susp.digesting"], "VSC zh = 桌面 zh（逐字）")
  assert.equal(vscEn["susp.running"], "${n} background subagent(s) running", "en 零变")
  assert.equal(vscEn["susp.running"], i18n.HOST_DICT.en["susp.running"], "en 三端同（零变）")
  const cliSrc = read("thincoder-cli/src/tui/suspension-drive.mjs")
  assert.ok(cliSrc.includes("子代理运行中") && cliSrc.includes("完成待消化"), "CLI 措辞在盘（词面保形）")
  // 真机可见面读数（平 node 替代）：VSC 模板展开 ∥ 桌面段渲染 —— 逐字同
  i18n.initDict({ locale: "zh" })
  const deskText = seg.stateSegment([], { active: true, running: 2, queued: 0, pending: 0, done: 0 }, null)?.parts?.[0]?.text
  assert.equal(vscZh["susp.running"].replace("${n}", "2"), deskText, "挂起句读数：VSC(zh) = 桌面(zh)")
})

test("I6 判据：VSC zh 两键补译（零英文残留）；en 零变", () => {
  const vscZh = JSON.parse(read("thincoder-vscode/locales/zh.json"))
  const vscEn = JSON.parse(read("thincoder-vscode/locales/en.json"))
  assert.equal(vscZh["settings.mcp.headers"], "请求头")
  assert.equal(vscZh["settings.mcp.token"], "认证令牌（Bearer）")
  for (const key of ["settings.mcp.headers", "settings.mcp.token"]) {
    assert.ok(!/Headers|Auth/.test(vscZh[key]), `${key}: 零英文残留`)
  }
  assert.equal(vscEn["settings.mcp.headers"], "Headers", "en 零变")
  assert.equal(vscEn["settings.mcp.token"], "Auth token (Bearer)", "en 零变")
})

// ─── T3 · I2 ∕ I3 ∕ I4：桌面键面 ∕ 输出零变 ────────────────────────────────────

test("I2 判据：桌面零 status.elapsed 键（双字典零碰撞）· 输出零变", async () => {
  const i18n = await import(at("thincoder-desktop/renderer/i18n.mjs"))
  const seg = await import(at("thincoder-desktop/renderer/views/statusline-segments.mjs"))
  const vscZh = JSON.parse(read("thincoder-vscode/locales/zh.json"))
  const vscEn = JSON.parse(read("thincoder-vscode/locales/en.json"))
  for (const lang of ["en", "zh"]) assert.ok(!("status.elapsed" in i18n.HOST_DICT[lang]), `${lang}: 桌面零 status.elapsed（不与 VSC 标签键撞名）`)
  assert.equal(i18n.HOST_DICT.en["status.elapsedSeconds"], "${seconds}s")
  assert.equal(i18n.HOST_DICT.zh["status.elapsedSeconds"], "${seconds} 秒")
  assert.equal(vscEn["status.elapsed"], "Elapsed", "VSC 同名键 = 标签（另一语义——已消碰撞）")
  assert.equal(vscZh["status.elapsed"], "耗时")
  i18n.initDict({ locale: "en" })
  assert.equal(seg.elapsedSegment(["running"], { k: NOW }, "k", NOW + 26000).parts[0].text, "26s")
  i18n.initDict({ locale: "zh" })
  assert.equal(seg.elapsedSegment(["running"], { k: NOW }, "k", NOW + 26000).parts[0].text, "26 秒")
})

test("I3 判据：status.timer 值逐字同 VSC（⏰${n}）· 调用点传 {n} · 输出零变", async () => {
  const i18n = await import(at("thincoder-desktop/renderer/i18n.mjs"))
  const seg = await import(at("thincoder-desktop/renderer/views/statusline-segments.mjs"))
  const vscZh = JSON.parse(read("thincoder-vscode/locales/zh.json"))
  const vscEn = JSON.parse(read("thincoder-vscode/locales/en.json"))
  assert.equal(i18n.HOST_DICT.en["status.timer"], "⏰${n}")
  assert.equal(i18n.HOST_DICT.zh["status.timer"], "⏰${n}")
  assert.equal(i18n.HOST_DICT.en["status.timer"], vscEn["status.timer"], "值逐字同 VSC")
  assert.equal(i18n.HOST_DICT.zh["status.timer"], vscZh["status.timer"], "值逐字同 VSC")
  i18n.initDict({ locale: "en" })
  assert.equal(seg.timerSegment({ k: { count: 3 } }, "k").parts[0].text, "⏰3")
  assert.equal(seg.timerSegment({ k: { count: 3, expired: 1 } }, "k").warn, true, "邻位判据零变")
  assert.equal(seg.timerSegment({ k: { count: 0 } }, "k"), null, "零值 ⇒ 零节点（零变）")
})

test("I4 判据：composer.send.failed 档内唯一 owner（i18n-views.mjs）· 输出零变", async () => {
  const i18n = await import(at("thincoder-desktop/renderer/i18n.mjs"))
  assert.ok(!/"composer\.send\.failed"\s*:/.test(read("thincoder-desktop/renderer/i18n.mjs")), "主档零定义（字面块副本已删）")
  assert.equal((read("thincoder-desktop/renderer/i18n-views.mjs").match(/"composer\.send\.failed"\s*:/g) ?? []).length, 2, "owner = i18n-views.mjs（两语各一）")
  i18n.initDict({ locale: "en" })
  assert.equal(i18n.t("composer.send.failed", { reason: "boom" }), "Send failed (boom) — the text was kept")
  i18n.initDict({ locale: "zh" })
  assert.equal(i18n.t("composer.send.failed", { reason: "boom" }), "发送失败（boom）——文本已保留")
})

// ─── T4 · S13：遮罩字面单源 ──────────────────────────────────────────────────

test("S13 判据：核 MASKED 转 export ∕ 桌面取核（零自持字面）· VSC 值改 + import 核", async () => {
  const core = await import(coreAt("agent-tools/settings.mjs"))
  assert.equal(core.MASKED, "••••（masked）", "核字面导出在盘")
  assert.equal(typeof core.isSensitiveKey, "function", "判据面零变")
  const deskVals = await import(at("thincoder-desktop/src/main/settings-values.mjs"))
  assert.equal(deskVals.MASK, core.MASKED, "桌面遮罩 = 核字面（单源）")
  assert.ok(!read("thincoder-desktop/src/main/settings-values.mjs").includes("••••"), "桌面零自持字面")
  assert.equal(deskVals.maskKey("providers.0.apiKey", "sk-123"), core.MASKED, "遮罩面读数（桌面）= 核字面")
  assert.equal(deskVals.maskKey("providers.0.baseURL", "https://x"), "https://x", "非敏感直通")
  const vscSrc = read("thincoder-vscode/src/extension/settings.mjs")
  assert.match(vscSrc, /import \{ MASKED \} from "@thincoder\/core\/agent-tools\/settings\.mjs"/)
  assert.match(vscSrc, /masked: configured \? MASKED : ""/)
  assert.ok(!vscSrc.includes("****"), "VSC 零自持字面（****）")
})

// ─── T5 · R1：首屏引导层 DOM 三态 ────────────────────────────────────────────

test("R1 判据：冷启层在场 ∕ 置 ok 撤（零残留）∕ 置 error 错误面（可读原因）", async () => {
  const makeEl = () => {
    const node = {
      dataset: {}, style: {}, hidden: false, textContent: "", removed: false,
      setAttribute() {}, removeAttribute() {}, getAttribute() { return null },
      append() {}, appendChild() {}, remove() { node.removed = true }, removeChild() {},
      addEventListener() {}, removeEventListener() {},
      querySelector() { return null }, querySelectorAll() { return [] },
      classList: { add() {}, remove() {}, contains() { return false } },
      children: [], childNodes: [], firstChild: null, parentNode: null,
      focus() {}, blur() {}, setSelectionRange() {}, scrollTo() {},
    }
    return node
  }
  const dom = { gate: makeEl(), reason: makeEl(), listeners: {} }
  globalThis.document = {
    documentElement: makeEl(), body: makeEl(), head: makeEl(),
    addEventListener(type, fn) { (dom.listeners[type] ??= []).push(fn) },
    removeEventListener() {},
    querySelector() { return null }, querySelectorAll() { return [] },
    getElementById(id) { return id === "boot-gate" ? dom.gate : id === "boot-reason" ? dom.reason : null },
    createElement() { return makeEl() }, createTextNode() { return makeEl() }, createDocumentFragment() { return makeEl() },
  }
  globalThis.window = globalThis
  const realSetInterval = globalThis.setInterval
  const realClearInterval = globalThis.clearInterval
  globalThis.setInterval = () => 0 // 拍体生命周期桩（1s 拍不持活句柄——用例进程可自然退出）
  globalThis.clearInterval = () => {}
  try {
    globalThis.thincoder = { invoke: async () => ({}) }
    await import(at("thincoder-desktop/renderer/app.mjs"))
  } finally {
    globalThis.setInterval = realSetInterval
    globalThis.clearInterval = realClearInterval
  }
  const boot = dom.listeners["DOMContentLoaded"]?.[0]
  assert.equal(typeof boot, "function", "引导回调已注册")
  // ① 冷启（JS 未跑）：层在场（未撤）——静态骨架默认可见
  assert.equal(dom.gate.removed, false)
  assert.equal(globalThis.document.documentElement.dataset.boot, undefined)
  // ② error（形不符径）⇒ 错误面 + 可读原因
  await boot()
  assert.equal(globalThis.document.documentElement.dataset.boot, "error")
  assert.equal(dom.gate.dataset.state, "error")
  assert.equal(dom.reason.hidden, false)
  assert.match(dom.reason.textContent, /payload shape unexpected/)
  // ③ ok ⇒ 层撤（零残留）
  dom.gate = makeEl(); dom.reason = makeEl()
  globalThis.thincoder.invoke = async (channel) => (channel === "config:read" ? { config: {}, locale: "en", dict: {} } : {})
  await boot()
  assert.equal(globalThis.document.documentElement.dataset.boot, "ok")
  assert.equal(dom.gate.removed, true, "ok ⇒ 节点移除（零残留）")
  // ④ 拒绝径（catch）⇒ 错误面 + 原因 = error.message
  dom.gate = makeEl(); dom.reason = makeEl()
  globalThis.thincoder.invoke = async () => { throw new Error("boom-detail") }
  await boot()
  assert.equal(globalThis.document.documentElement.dataset.boot, "error")
  assert.equal(dom.reason.textContent, "boom-detail")
  assert.equal(dom.gate.removed, false, "error ⇒ 层在场")
})

test("R1 结构：index.html 静态层 + 样式规则在场（`data-boot` 写者零改）", () => {
  const html = read("thincoder-desktop/renderer/index.html")
  assert.match(html, /<html lang="en" data-boot="none">/)
  assert.match(html, /id="boot-gate"/)
  assert.match(html, /id="boot-reason"[^>]*hidden/)
  assert.match(read("thincoder-desktop/renderer/chrome.css"), /\.boot-gate \{ position: fixed; inset: 0;/)
  assert.match(read("thincoder-desktop/renderer/skin.css"), /\.boot-gate\[data-state="error"\] \.boot-spinner \{ display: none; \}/)
  assert.match(read("thincoder-desktop/renderer/dom.mjs"), /document\.documentElement\.dataset\.boot = value/, "引导位写者单点零改")
})

// ─── T6 · R3 残余：复读面（句 ∕ 导出行 ∕ 锁指针——判据面）────────────────────────

test("R3 残余 判据：rc 单源导出在盘 ∕ VSC 换接结构 ∕ 锁件换址（旧件退场）", async () => {
  const rc = await import(pathToFileURL(vscReq.resolve("@thincoder/render-core/subblocks/relay.mjs")).href)
  assert.equal(typeof rc.relaySubContentChunk, "function", "内容构形单源导出在盘")
  assert.equal(typeof rc.relayEventToSubPatch, "function", "事件映射单源导出在盘")
  const vscRelay = read("thincoder-vscode/src/extension/panel-subagent-relay.mjs")
  assert.match(vscRelay, /from "@thincoder\/render-core\/subblocks\/relay\.mjs"/, "VSC 取值自 rc 单源")
  assert.match(vscRelay, /relayEventToSubPatch\(text, relayScopeOf\(panel\)/, "事件面转口在盘")
  assert.match(vscRelay, /relaySubContentChunk\(face, a, b\)/, "内容面转口在盘")
  assert.ok(!existsSync(join(ROOT, "thincoder-vscode/test/render-core-relay-map.test.mjs")), "旧锁件已退场")
  assert.ok(existsSync(join(ROOT, "docs/batches/2026-09-29-parity-b7-minor.test.mjs")), "锁件换址 = B7 批内件")
})
