/**
 * webview-input-enter.test.mjs — 第 28 批 B2（`docs/design/WEBVIEW.md` §9——F-F1~F-F3）：
 * VSC 输入面 Enter 语义——组合期归输入法（C-B2-1）/ @ 下拉与 send 协调（C-B2-2/C-B2-3）/
 * busy 排队受理（C-B2-6——busy-extend 批 2026-09-22：`running` 一律排队；原 C-B2-4 拒发面撤销；
 * 普通 / 会话在飞两态 = `busy-injection-vsc.test.mjs` T-V16-1 / T-V16-4a）。用例 1:1 = §9.6 T-B2-1~T-B2-7。
 *
 * 手法（§9.6）：setupWebview + installChatFixture（含 `#toolbar` 输入段骨架）+ 核件接线
 * （`input.js` = deps 构造 + 工厂装配——2026-09-28 上提批：本档原「动态 import 真 `input.js` +
 * 真 `initAutocomplete` 装配」改指核件同面：@ 下拉推送入口 = `autocomplete.js` 两导出）；
 * Enter 以 `new KeyboardEvent("keydown", { key:"Enter", isComposing })` 派发（已验证
 * isComposing 可控 + dispatchEvent 返回值即 !defaultPrevented）；消息面断言经 capturedPosts；
 * busy toast 只断言即时态（不等 2.6s 淡出——避免慢用例，计时器显式清掉）。
 */
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { setupWebview, installChatFixture } from "./helpers/webview-env.mjs"

let cleanupEnv
let capturedPosts
let W = null // happy-dom 先于 webview 模块 import（state.js 顶层读 DOM + acquireVsCodeApi）

before(async () => {
  const env = setupWebview()
  cleanupEnv = env.cleanup
  capturedPosts = env.capturedPosts
  installChatFixture() // 夹具含 `#toolbar` 输入段骨架（核件接线按同 id 退场重建）
  const state = await import("../webview/state.js")
  await import("../webview/input.js") // 接线（deps 构造 + 工厂装配——键位监听先于 @ 面）
  const ac = await import("../webview/autocomplete.js") // @ 面推送入口（核 `showAtDropdown` 同入口）
  W = {
    S: state.S,
    ctx: state.ctx,
    t: (await import("../webview/i18n.js")).t,
    toast: await import("../webview/toast.js"),
    setLoading: (await import("../webview/loading.js")).setLoading,
    ac: { showAtDropdown: ac.showAtDropdown, closeAtDropdown: ac.closeAtDropdown },
    atDropdown: document.getElementById("at-dropdown"), // 核件产物（静态占位已退场）
  }
})

after(() => {
  // panels.js 模块顶 2s interval + toast 2.6s 计时器——清掉（防 node --test 悬挂）
  try { window.dispatchEvent(new window.Event("unload")) } catch { /* happy-dom teardown edge */ }
  try { clearTimeout(W?.toast?.showToast?._t) } catch { /* no toast yet */ }
  cleanupEnv()
})

const inputEl = () => W.ctx.inputEl

/** Enter（组合态可注入）派发；返回 dispatchEvent 结果——false = defaultPrevented。 */
function pressKey(init) {
  return inputEl().dispatchEvent(new window.KeyboardEvent("keydown", { bubbles: true, cancelable: true, ...init }))
}
const postsSince = (mark) => capturedPosts.slice(mark)

/** 逐测冷启复位（同文件串行——模块状态共享，每测独立起点）。 */
function resetInput(value) {
  const { S, ctx, ac, atDropdown } = W
  pressKey({ key: "Escape" }) // 防御：清残留中断模态（非模态态零副作用）
  S._turnState = "idle"
  S._suspended = false
  S._busyQueuedPending = false // C-B2-6 细则① 镜像（初启态——队列分支守卫判据源）
  ctx.isRunning = false // 核 loading 标记活代理（写 ⇒ 核 setLoading）
  ac.closeAtDropdown()
  atDropdown.style.display = "none"
  inputEl().value = value
  inputEl().placeholder = ""
  inputEl().classList.remove("interrupt-mode") // 中断模态面（核内态——由核件键位面进出）
  const toastEl = document.getElementById("paste-toast")
  if (toastEl) { toastEl.classList.remove("visible"); toastEl.textContent = "" }
}

// ─── T-B2-1 正常（正控）：下拉关闭 + idle → Enter 发送 ───

test("T-B2-1 正控：idle + 下拉关闭 + 文本 → Enter 发 1 条 userMessage（text 匹配）+ 输入框清空", () => {
  resetInput("hello world")
  const mark = capturedPosts.length
  pressKey({ key: "Enter" })
  const userMsgs = postsSince(mark).filter((m) => m.type === "userMessage")
  assert.equal(userMsgs.length, 1, "恰 1 条 userMessage")
  assert.equal(userMsgs[0].text, "hello world")
  assert.equal(inputEl().value, "", "发送后输入框清空")
})

// ─── T-B2-2 边界：组合期不发送 + 不粘滞 ───

test("T-B2-2 组合守卫：isComposing Enter 零 userMessage/零 interrupt + 文本保留 → compositionend → 再 Enter 正常发送（不粘滞）", () => {
  resetInput("组合中文字")
  const mark = capturedPosts.length
  const notPrevented = pressKey({ key: "Enter", isComposing: true })
  assert.equal(notPrevented, true, "组合期 Enter 不 preventDefault（键归输入法）")
  assert.equal(postsSince(mark).filter((m) => m.type === "userMessage" || m.type === "interrupt").length, 0, "零 userMessage / 零 interrupt")
  assert.equal(inputEl().value, "组合中文字", "文本保留")

  inputEl().dispatchEvent(new window.Event("compositionend"))
  pressKey({ key: "Enter" })
  const userMsgs = postsSince(mark).filter((m) => m.type === "userMessage")
  assert.equal(userMsgs.length, 1, "组合结束 → 再 Enter 正常发送（守卫不粘滞）")
  assert.equal(userMsgs[0].text, "组合中文字")
})

// ─── T-B2-3 正常：@ 下拉打开 → Enter 只接受建议（保留 preventDefault）───

test("T-B2-3 @ 下拉协调：打开态 Enter 建议插入（@<path> 落地）+ 下拉关闭 + 零 userMessage + 保留 preventDefault", () => {
  resetInput("@src")
  inputEl().selectionStart = 4
  W.ac.showAtDropdown([{ path: "src/a.mjs", name: "a.mjs" }])
  assert.equal(W.atDropdown.style.display, "block", "预览：下拉已打开")
  const mark = capturedPosts.length
  const notPrevented = pressKey({ key: "Enter" })
  assert.equal(notPrevented, false, "让位保留 preventDefault（防 Enter 默认换行落入输入框）")
  assert.equal(postsSince(mark).filter((m) => m.type === "userMessage").length, 0, "零 userMessage（让位）")
  assert.equal(inputEl().value, "@src/a.mjs ", "建议插入落地（@<path> + 尾空格）")
  assert.equal(W.atDropdown.style.display, "none", "下拉关闭")
})

// ─── T-B2-4 边界：下拉关闭态 ≠ 打开（C-B2-3 硬化的现存分支）───

test("T-B2-4 判据硬化：下拉关闭态（display:none）⇒ Enter 正常发送（C-B2-3 判据 = display；「元素缺失」支随核化退役——下拉由核件自建恒在）", () => {
  resetInput("no dropdown here")
  W.ac.showAtDropdown([{ path: "src/a.mjs", name: "a.mjs" }])
  assert.equal(W.atDropdown.style.display, "block", "预览：下拉已打开")
  W.ac.closeAtDropdown()
  assert.equal(W.atDropdown.style.display, "none", "预览：下拉已关闭（display 判据）")
  const mark = capturedPosts.length
  pressKey({ key: "Enter" })
  const userMsgs = postsSince(mark).filter((m) => m.type === "userMessage")
  assert.equal(userMsgs.length, 1, "关闭态 → Enter 照常发送")
  assert.equal(userMsgs[0].text, "no dropdown here")
})

// ─── T-B2-5 正常：busy 排队受理（busy-extend 批 2026-09-22——C-B2-6 一律排队）───

test("T-B2-5 busy 排队（原「拒发 + toast」面随本批撤销）：`running ∧ _suspended` Enter ⇒ 本地气泡 + queuedUserMessage + 清框 ∧ 零 toast ∧ 零 userMessage", () => {
  resetInput("busy 期文本")
  W.S._turnState = "running"
  W.S._suspended = true // 挂起会话内 busy（digest / 会话内用户回合）——同判据排队面
  const bubbles = document.querySelectorAll(".message.user").length
  const mark = capturedPosts.length
  pressKey({ key: "Enter" })
  const posts = postsSince(mark)
  const queued = posts.filter((m) => m.type === "queuedUserMessage")
  assert.equal(queued.length, 1, "恰 1 条 queuedUserMessage 上行（host 侧入会话单槽）")
  assert.equal(queued[0].text, "busy 期文本", "文本随消息上传")
  assert.equal(posts.filter((m) => m.type === "userMessage").length, 0, "零 userMessage（不经正常发送面）")
  assert.equal(document.querySelectorAll(".message.user").length, bubbles + 1, "本地气泡先行上屏（送达时即 user 回声面）")
  assert.equal(inputEl().value, "", "输入框清空（消息已受理——用户视为已发送）")
  const toastEl = document.getElementById("paste-toast")
  assert.ok(!toastEl?.classList.contains("visible"), "零 toast（受理非拒发——不静默拒亦不误报拒）")
  clearTimeout(W.toast.showToast._t) // 防御：残留计时器（若实现回退到拒发面）
})

// ─── T-B2-6 边界：双守卫（下拉打开 + 组合期）───

test("T-B2-6 双守卫：下拉打开 + 组合期 Enter → 零 userMessage + 建议未插入（文本原样）+ 下拉保持打开", () => {
  resetInput("@src")
  inputEl().selectionStart = 4
  W.ac.showAtDropdown([{ path: "src/a.mjs", name: "a.mjs" }])
  const mark = capturedPosts.length
  const notPrevented = pressKey({ key: "Enter", isComposing: true })
  assert.equal(notPrevented, true, "组合期两守卫均不 preventDefault（键归输入法）")
  assert.equal(postsSince(mark).filter((m) => m.type === "userMessage").length, 0, "零 userMessage")
  assert.equal(inputEl().value, "@src", "建议未插入（文本原样）")
  assert.equal(W.atDropdown.style.display, "block", "下拉保持打开")
})

// ─── T-B2-7 边界：中断模态组合守卫（中断通道零回归）───

test("T-B2-7 中断模态（核内态经类名观测）：Ctrl+I 进入 → 组合 Enter 零 interrupt（模态未退出）→ 非组合 Enter 发出 interrupt", () => {
  resetInput("注入文本")
  W.ctx.isRunning = true
  pressKey({ key: "i", ctrlKey: true })
  assert.equal(inputEl().classList.contains("interrupt-mode"), true, "Ctrl+I（running）→ 中断模态")
  const mark = capturedPosts.length
  pressKey({ key: "Enter", isComposing: true })
  assert.equal(postsSince(mark).filter((m) => m.type === "interrupt").length, 0, "组合期零 interrupt")
  assert.equal(inputEl().classList.contains("interrupt-mode"), true, "组合 Enter 被吞——模态未退出")
  assert.equal(inputEl().value, "注入文本", "文本保留")

  pressKey({ key: "Enter" })
  const interrupts = postsSince(mark).filter((m) => m.type === "interrupt")
  assert.equal(interrupts.length, 1, "非组合 Enter → interrupt 发出（中断通道零回归）")
  assert.equal(interrupts[0].message, "注入文本")
  assert.equal(inputEl().classList.contains("interrupt-mode"), false, "模态退出")
})
