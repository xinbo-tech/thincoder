/**
 * 2026-10-04-composer-queue-gate-stick.test.mjs — 批内件（「排队守卫假满队（`_qLocal` 粘住）」修复批 · 台账 #911 · 实施轮）。
 * 判据表 = 批档 `docs/batches/2026-10-04-composer-queue-gate-stick.md` §2 + 修正块（效力序：修正块为准）；
 * 机制单源（收正后）= `docs/vsc/design/WEBVIEW-INPUT.md` §1 C-B2-6 细则① ∥ `docs/desktop/design/UI.md` §1 输入区行。
 *
 * 用例 ↔ 判据（T1–T5 · **先红后绿——红 = 影子态累计**）：
 *   T1（红→绿 · 假满队根径）：镜像恒 0 ∥ 忙态——9 轮「清框 → 提交」。红 = 第 9 轮被影子态误拒（toast ∥ 该轮零 post）；
 *       绿 = 9 轮全受理（`queuedUserMessage` 各恰 1 次；零 toast）。
 *   T2（绿锁 · 镜像 8 ⇒ 拒发）：零 post ∥ 文本保留 ∥ toast = 核 `t("input.slotFull")` 逐字。
 *   T3（绿锁 · 如实读）：宿主计数序列 0 ∕ 3 ∕ 7 受理 · 8 拒 · 回 0 再受理（同一面板——零累计）。
 *   T4（绿锁 · queue-full 回执可见面 · 桌面渲染链）：wire 收 `{ ok:false, reason:"queue-full" }`
 *       ⇒ `failure()` = `{ reason:"queue-full", kind:null }` ∥ `[data-notice="send-failed"]` 行落挂件锚（受理径清行——负控）。
 *   T5（绿锁 · 窄窗端到端腿 · 桌面渲染链）：同 tick 双提交（镜像恒 7——滞后窗显形）⇒ 端门连放两条
 *       ⇒ 通道桩第二条回 `queue-full` ⇒ 第二条落失败行（T4 同面）。
 *
 * 车具：happy-dom 真 DOM（`thincoder-vscode/node_modules/@happy-dom/global-registrator`——在盘 ∥ devDep 声明）
 *   + 通道桩（receipts 队列）∥ 核件面板直引（平路径）。T1 ∥ T2 ∥ T3 ∥ T5 必带 `turnState` provider
 *   （进队径判据 = `busyState() === "running"`——缺 ⇒ 直发径、「先红」负控失据）；T4 ∥ T5 走桌面渲染链真件
 *   （`composer-wire.mjs` ∥ `composer-sync.mjs`——沿 `/rc/` 解析钩子先例）。
 * 本件不进仓套件（批内件 · 随批留存）；复跑（cwd = 仓库根）：
 *   node --test docs/batches/2026-10-04-composer-queue-gate-stick.test.mjs
 */
import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { registerHooks } from "node:module"

const ROOT = fileURLToPath(new URL("../../", import.meta.url)) // 仓根 = 本档上两级（thincoder/）
const rel = (p) => resolve(ROOT, p)
const src = (p) => readFileSync(rel(p), "utf8")
const mod = (p) => import(pathToFileURL(rel(p)).href)

// 渲染档取核件：`/rc/` 解析钩子（沿 `2026-09-29-desktop-susp-queue.test.mjs` 先例——sync 传递闭包含 `/rc/` 取件）。
const rcRoot = resolve(ROOT, "thincoder-render-core")
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("/rc/")) return { url: pathToFileURL(resolve(rcRoot, specifier.slice(4))).href, shortCircuit: true }
    return nextResolve(specifier, context)
  },
})

// ─── happy-dom 真 DOM（实读在盘：`thincoder-vscode/node_modules/@happy-dom/**`；devDep 声明 = package.json:152）──
const { GlobalRegistrator } = await import(pathToFileURL(resolve(ROOT, "thincoder-vscode/node_modules/@happy-dom/global-registrator/lib/index.js")).href)
GlobalRegistrator.register()
if (typeof Element.prototype.scrollIntoView !== "function") Element.prototype.scrollIntoView = function () {} // happy-dom 缺项垫片（沿批内件先例）

// ─── 装配面：词表（注册单点 = 桌面 `app.mjs` 同式）/ 核件面板 / 写面 ∥ 随动派生面真件 ─────────────
const coreI18n = await mod("thincoder-render-core/i18n.mjs")
const hostI18n = await mod("thincoder-desktop/renderer/i18n.mjs")
hostI18n.setStringsSink(coreI18n.setStrings) // 核件取词注册面（面板经核 `t` 取词）
hostI18n.initDict({ locale: "zh" })
const { createComposerPanel } = await mod("thincoder-render-core/composer/panel.mjs")
const { showToast } = await mod("thincoder-render-core/toast.mjs")
const { createComposerWire } = await mod("thincoder-desktop/renderer/composer-wire.mjs")
const { createComposerSync } = await mod("thincoder-desktop/renderer/composer-sync.mjs")

const settle = (ms = 20) => new Promise((r) => setTimeout(r, ms))
const enter = (panel) => panel.inputEl.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }))
/** toast 读数（并清核 toast 2.6s 自动淡出定时器——防跑批时长绑墙钟；先例 = slash 批内件同式）。 */
const toastText = () => {
  clearTimeout(showToast._t)
  const el = document.body.querySelector("#paste-toast")
  return el === null ? null : el.textContent
}
const resetToast = () => { clearTimeout(showToast._t); document.body.querySelector("#paste-toast")?.remove() }

/** 面板车具（核件面板 ∥ 真 DOM；`queue` = 宿主镜像 provider 桩——恒值 ∥ 可变序列皆可）。 */
function bootPanel({ queue, turnState = () => "running", post: postOut } = {}) {
  const root = document.createElement("div")
  document.body.append(root)
  const posts = []
  const panel = createComposerPanel({
    root,
    post: (type, payload) => { posts.push({ type, payload }); postOut?.(type, payload) },
    state: { turnState, queue, models: () => [], flags: () => ({}), workspaceRequired: () => false },
    hooks: {},
  })
  return { panel, posts }
}

/** 桌面渲染链车具（wire ∥ sync——同 `mount-composer.mjs` 生产序；store = 单状态树形补丁合并桩）。 */
function bootDesktopChain({ receipts = [] } = {}) {
  const key = "k1"
  let state = { activeSession: key, blocks: [], pending: { [key]: [] }, providerState: null, attachDegraded: {}, tabBadges: {}, susp: {}, sessionMeta: {}, sessionFlags: {} }
  const store = { get: () => state, set: (next) => { state = { ...state, ...next }; return state } }
  const anchor = document.createElement("div")
  document.body.append(anchor)
  const calls = []
  const call = async (channel, payload) => { calls.push({ channel, payload }); return receipts.shift() ?? { ok: true, queued: true } }
  let sync = null
  const wire = createComposerWire({
    store, activeKey: () => state.activeSession, call, push: () => {}, panelOf: () => null,
    repaint: () => sync?.paintNotices(), onLoadingReset: () => {},
    suspIdleOf: (s, k) => s?.susp?.[k]?.active === true && !(s?.tabBadges?.[k] ?? []).includes("running"),
    toImages: (list) => list, degradedCode: () => null, effortOf: () => "auto",
    withUserBlock: (s, k, block) => (s?.activeSession !== k ? s : { ...s, blocks: [...s.blocks, block] }),
    setAttachDegraded: (s, k, code) => ({ ...s, attachDegraded: { ...s.attachDegraded, [k]: code ?? null } }),
    applyFlags: (s) => s, openSettings: () => {},
  })
  sync = createComposerSync({
    store, activeKey: () => state.activeSession, call, push: () => {}, pushSubs: [], wire,
    panelOf: () => null, noticesOf: () => anchor, retryDelayMs: 0, delay: () => Promise.resolve(),
  })
  return { wire, calls, anchor, state: () => state }
}

// ─── T1（红→绿 · 假满队根径）──────────────────────────────────────────────
test("T1（红→绿 · 假满队根径）：镜像恒 0 ∥ 忙态——9 轮「清框 → 提交」全受理（红 = 影子态累计：第 9 轮拒 + toast）", () => {
  resetToast()
  const { panel, posts } = bootPanel({ queue: () => ({ count: 0 }) })
  const rounds = []
  for (let i = 1; i <= 9; i++) {
    panel.inputEl.value = `第 ${i} 条`
    const before = posts.length
    enter(panel)
    rounds.push({ i, accepted: posts.length === before + 1, kept: panel.inputEl.value !== "" })
  }
  console.log(`[读数] T1：${rounds.map((r) => (r.accepted ? "受" : "拒")).join("")} · posts=${posts.length} · toast=${JSON.stringify(toastText())}`)
  for (const r of rounds) assert.equal(r.accepted, true, `第 ${r.i} 轮应受理（红 = 影子态累计——第 9 轮误拒）`)
  assert.equal(posts.length, 9, "9 轮全受理（post 各恰 1 次）")
  assert.deepEqual([...new Set(posts.map((p) => p.type))], ["queuedUserMessage"], "出泡径 = queuedUserMessage")
  assert.equal(rounds.every((r) => !r.kept), true, "受理径清框")
  assert.equal(toastText(), null, "零 toast（绿锁）")
})

// ─── T2（绿锁 · 镜像 8 ⇒ 拒发）────────────────────────────────────────────
test("T2（绿锁 · 镜像 8 ⇒ 拒发）：零 post ∥ 文本保留 ∥ toast = 核 t('input.slotFull') 逐字", () => {
  resetToast()
  const { panel, posts } = bootPanel({ queue: () => ({ count: 8 }) })
  panel.inputEl.value = "满队这条"
  enter(panel)
  assert.deepEqual(posts, [], "满队 ⇒ 零上行")
  assert.equal(panel.inputEl.value, "满队这条", "文本保留（不清框）")
  const word = coreI18n.t("input.slotFull")
  assert.notEqual(word, "input.slotFull", "键须在册（回落键名 = 缺键——断言不得恒真）")
  assert.equal(toastText(), word, "toast = 核 t(input.slotFull) 逐字")
})

// ─── T3（绿锁 · 如实读）──────────────────────────────────────────────────
test("T3（绿锁 · 宿主计数如实读）：序列 0 ∕ 3 ∕ 7 受理 · 8 拒 · 回 0 再受理（同一面板——零累计）", () => {
  resetToast()
  let count = 0
  const { panel, posts } = bootPanel({ queue: () => ({ count }) })
  const submit = (n, text) => { count = n; panel.inputEl.value = text; const before = posts.length; enter(panel); return posts.length - before }
  assert.equal(submit(0, "a"), 1, "0 ⇒ 受理")
  assert.equal(submit(3, "b"), 1, "3 ⇒ 受理（读 3——非累计值）")
  assert.equal(submit(7, "c"), 1, "7 ⇒ 受理")
  assert.equal(submit(8, "d"), 0, "8 ⇒ 拒")
  assert.equal(panel.inputEl.value, "d", "拒径文本保留")
  assert.equal(toastText(), coreI18n.t("input.slotFull"), "拒 = 满队 toast")
  assert.equal(submit(0, "e"), 1, "回 0 ⇒ 再受理（即读即用——队消即开门）")
  assert.equal(posts.length, 4, "恰四受理（零累计 ∥ 零粘住）")
})

// ─── T4（绿锁 · queue-full 回执可见面 · 桌面渲染链）────────────────────────
test("T4（绿锁 · queue-full 回执可见面）：wire 收 queue-full ⇒ failure() = {reason,kind:null} ∥ 失败行落锚（受理径清行）", async () => {
  const { wire, calls, anchor } = bootDesktopChain({ receipts: [{ ok: false, reason: "queue-full" }, { ok: true, queued: true }] })
  await wire.post("queuedUserMessage", { text: "甲" })
  await settle()
  assert.equal(calls.length, 1, "上行恰一次（msg:send）")
  assert.deepEqual(wire.failure(), { reason: "queue-full", kind: null }, "行源在场（失败行源 = 回执写）")
  const row = anchor.querySelector('[data-notice="send-failed"]')
  assert.notEqual(row, null, "渲染形落锚：失败行在场")
  assert.equal(row.textContent, hostI18n.t("composer.send.failed", { reason: "queue-full" }), "行文逐字（词 = composer.send.failed）")
  assert.match(src("thincoder-desktop/renderer/composer-sync.mjs"), /"data-notice": "send-failed"/, "渲染形源面锁（行形单源 = composer-sync failedNotice）")
  await wire.post("queuedUserMessage", { text: "乙" })
  await settle()
  assert.equal(wire.failure(), null, "受理径清失败行源")
  assert.equal(anchor.querySelector('[data-notice="send-failed"]'), null, "受理径行退场（负控）")
})

// ─── T5（绿锁 · 窄窗端到端腿 · 桌面渲染链）─────────────────────────────────
test("T5（绿锁 · 窄窗端到端腿）：同 tick 双提交（镜像恒 7）⇒ 端门连放两条 ⇒ 宿主拒第二条 ⇒ 失败行", async () => {
  const { wire, calls, anchor } = bootDesktopChain({ receipts: [{ ok: true, queued: true }, { ok: false, reason: "queue-full" }] })
  const { panel, posts } = bootPanel({ queue: () => ({ count: 7 }), post: (type, payload) => wire.post(type, payload) })
  panel.inputEl.value = "第一条"
  enter(panel)
  panel.inputEl.value = "第二条"
  enter(panel)
  assert.deepEqual(posts.map((p) => p.type), ["queuedUserMessage", "queuedUserMessage"], "端门连放两条（镜像滞后窗——如实读 7）")
  assert.equal(panel.inputEl.value, "", "两条均清框（端门连放）")
  await settle()
  assert.equal(calls.length, 2, "两条皆上行（post 接 wire sendQueued）")
  assert.deepEqual(wire.failure(), { reason: "queue-full", kind: null }, "宿主权威兜底：第二条 queue-full")
  assert.notEqual(anchor.querySelector('[data-notice="send-failed"]'), null, "第二条落 [data-notice=send-failed] 行（T4 同面）")
})