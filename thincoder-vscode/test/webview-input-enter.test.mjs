/**
 * webview-input-enter.test.mjs — 第 28 批 B2（`docs/design/WEBVIEW.md` §9——F-F1~F-F3）：
 * VSC 输入面 Enter 语义——组合期归输入法（C-B2-1）/ @ 下拉与 send 协调（C-B2-2/C-B2-3）/
 * busy 拒发可见提示（C-B2-4——收窄后仅存面 = 挂起会话内 busy；普通回合 busy 排队面 =
 * `busy-injection-vsc.test.mjs` T-V16-1）。用例 1:1 = §9.6 T-B2-1~T-B2-7。
 *
 * 手法（§9.6）：setupWebview + installChatFixture + 本档自备补充元素（#at-dropdown /
 * #paste-bar / #paste-badge / #file-input / #attach-btn——共享 fixture 零改）+ 动态 import
 * `input.js`（副作用注册——先于 initAutocomplete，注册次序 = §9.2 契约）与真 `initAutocomplete`
 * 装配；Enter 以 `new KeyboardEvent("keydown", { key:"Enter", isComposing })` 派发（已验证
 * isComposing 可控 + dispatchEvent 返回值即 !defaultPrevented）；消息面断言经 capturedPosts；
 * busy toast 只断言即时态（不等 2.6s 淡出——快层慢门，计时器显式清掉）。
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
  installChatFixture()
  // 本档自备补充元素（共享 fixture 零改）：真下拉 + send() 清理面（paste-bar/badge）+
  // initAutocomplete 真装配所需（file-input/attach-btn）。
  document.body.insertAdjacentHTML("beforeend", `
    <div id="at-dropdown" style="display:none"></div>
    <div id="paste-bar" style="display:none"></div>
    <div id="paste-badge"></div>
    <input id="file-input" type="file">
    <button id="attach-btn"></button>
  `)
  const state = await import("../webview/state.js")
  await import("../webview/input.js") // 副作用注册（先注册 → 先运行——协调契约前提）
  const { initAutocomplete } = await import("../webview/autocomplete.js")
  const atDropdown = document.getElementById("at-dropdown")
  W = {
    S: state.S,
    ctx: state.ctx,
    t: (await import("../webview/i18n.js")).t,
    toast: await import("../webview/toast.js"),
    setLoading: (await import("../webview/loading.js")).setLoading,
    ac: initAutocomplete({
      inputEl: state.ctx.inputEl,
      atDropdown,
      vscode: state.vscode,
      pastedImages: state.ctx._pastedImages,
    }),
    atDropdown,
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
  ctx.isRunning = false
  ctx._interruptMode = false
  ac.closeAtDropdown()
  atDropdown.style.display = "none"
  inputEl().value = value
  inputEl().placeholder = ""
  inputEl().classList.remove("interrupt-mode")
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

// ─── T-B2-4 边界：下拉元素缺失 ≠ 打开（C-B2-3 硬化）───

test("T-B2-4 判据硬化：同 T-B2-3 但 #at-dropdown 元素移除后 Enter → 正常发送（缺失 ≠ 打开；修前恒判打开 → 永不发送）", () => {
  resetInput("no dropdown here")
  W.ac.showAtDropdown([{ path: "src/a.mjs", name: "a.mjs" }])
  const el = W.atDropdown
  el.remove()
  // 注（代码评审 #2——合成尾态登记）：元素移除但 _atActive 仍置位——input.js 先行发送后，
  // autocomplete 侧仍会走 stale 引用插入路径（生产不可达：webview/index.html:31 常驻该元素）；
  // 本用例只断言发送面（C-B2-3 判据），不锁该合成尾态。
  const mark = capturedPosts.length
  try {
    pressKey({ key: "Enter" })
    const userMsgs = postsSince(mark).filter((m) => m.type === "userMessage")
    assert.equal(userMsgs.length, 1, "元素缺失 → Enter 照常发送")
    assert.equal(userMsgs[0].text, "no dropdown here")
  } finally {
    document.body.appendChild(el) // 还原（后续用例共享该元素）
    W.ac.closeAtDropdown()
  }
})

// ─── T-B2-5 正常：busy 拒发可见提示（C-B2-4——收窄后仅存面）───

test("T-B2-5 busy 拒发（收窄后仅存面 = 挂起会话内 busy：`running ∧ _suspended`——C-B2-6）：零 userMessage/零 queuedUserMessage + 文本保留 + 占位符 = busy 串（既有锁）+ #paste-toast 可见且文案 = busy 串", () => {
  resetInput("busy 期文本")
  W.S._turnState = "running"
  W.S._suspended = true // 挂起会话内 busy（digest / 会话内用户回合）——收窄后仅存拒发面
  const mark = capturedPosts.length
  pressKey({ key: "Enter" })
  assert.equal(postsSince(mark).filter((m) => m.type === "userMessage").length, 0, "零 userMessage（拒发）")
  assert.equal(postsSince(mark).filter((m) => m.type === "queuedUserMessage").length, 0, "零 queuedUserMessage（非普通回合 busy 面）")
  assert.equal(inputEl().value, "busy 期文本", "文本保留不吞")
  assert.equal(inputEl().placeholder, W.t("input.busyPlaceholder"), "占位符 = busy 串（既有锁零伤）")
  const toastEl = document.getElementById("paste-toast")
  assert.ok(toastEl, "#paste-toast 已懒建")
  assert.ok(toastEl.classList.contains("paste-toast"), "class 复用既有 CSS（controls.css:49-65——零 CSS 改动）")
  assert.ok(toastEl.classList.contains("visible"), "toast 即时可见（.visible）")
  assert.equal(toastEl.textContent, W.t("input.busyPlaceholder"), "toast 文案 = busy 串（零新增 locale 键）")
  clearTimeout(W.toast.showToast._t) // 2.6s 自动隐去计时器——本测只断言即时态（§9.6 注）
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

test("T-B2-7 中断模态：Ctrl+I 进入 → 组合 Enter 零 interrupt（模态未退出）→ 非组合 Enter 发出 interrupt", () => {
  resetInput("注入文本")
  W.ctx.isRunning = true
  pressKey({ key: "i", ctrlKey: true })
  assert.equal(W.ctx._interruptMode, true, "Ctrl+I（running）→ 中断模态")
  const mark = capturedPosts.length
  pressKey({ key: "Enter", isComposing: true })
  assert.equal(postsSince(mark).filter((m) => m.type === "interrupt").length, 0, "组合期零 interrupt")
  assert.equal(W.ctx._interruptMode, true, "组合 Enter 被吞——模态未退出")
  assert.equal(inputEl().value, "注入文本", "文本保留")

  pressKey({ key: "Enter" })
  const interrupts = postsSince(mark).filter((m) => m.type === "interrupt")
  assert.equal(interrupts.length, 1, "非组合 Enter → interrupt 发出（中断通道零回归）")
  assert.equal(interrupts[0].message, "注入文本")
  assert.equal(W.ctx._interruptMode, false, "模态退出")
})
