/**
 * 2026-10-05-attach-file-support.test.mjs — 批内件（「attach 文件支持（非图片档内联）」批 · 台账 #948 · 实施轮）。
 * 判据表 = 批档 `docs/batches/2026-10-05-attach-file-support.md` §2 + 修正块（效力序：修正块为准）；
 * 机制单源 = `docs/render-core/design/RENDER-CORE.md` §2 KD-RC-13 ∥ §5 条 6。
 *
 * 用例 ↔ 判据（T1–T15 + AC-7 词面对拍 · **先红后绿——红 = 机制面未落：断言直越机制面**）：
 *   T1（红→绿 · 受纳）：选 `.md`（`text/markdown`）⇒ 芯片 `📎 notes.md` 在场（红 = 零芯片静默丢）。
 *   T2（红→绿 · 直发内联）：档 + 文本 + Enter ⇒ `userMessage.text` = `行文\n\n[Attached file: notes.md]\n```md\n# 标题\n```` 逐字
 *       ∥ 回显同串 ∥ 芯片清 ∥ 零入 `images` 列。
 *   T3（红→绿 · 单档限）：256 001 B ⇒ toast `composer.attach.tooLarge` 逐字 ∥ 零芯片。
 *   T4（红→绿 · 二进制）：内容前 8000 B 含 NUL ⇒ toast `composer.attach.binary` ∥ 零芯片。
 *   T5（红→绿 · 档数限）：第 5 档 ⇒ toast `composer.attach.tooMany` ∥ 前 4 档在场 ∥ 第 5 档零入列（含同一 `change` 事件五档多选径）。
 *   T6（红→绿 · 合计限）：2×200 000 B 后第 3 档 ⇒ toast `composer.attach.totalLimit`（含同一事件 3×200 000 B 多选径）。
 *   T7（红→绿 · 类型不支持）：`.pdf` ⇒ toast `composer.attach.unsupported` 逐字 ∥ 零芯片。
 *   T8（红→绿 · 围栏安全 ∥ 转义）：内容含 3 连反引号 ⇒ 围栏 4（最长串 + 1）∥ 名含 `<` ⇒ 芯片字面（零注入）。
 *   T9（红→绿 · 队径）：`turnState: "running"` + 档 + Enter ⇒ `queuedUserMessage.text` 同 T2 内联 ∥ 回显同串。
 *   T10（绿锁 · 图片道零改）：raster png 照收（芯片 `📎 image 1`）∥ 非栅格 svg 照拒（`paste.unsupportedFormat` 原词）。
 *   T11（绿锁 · 空文本边界）：档在 ∥ 文本空 ∥ Enter ⇒ 零上行 ∥ 芯片面零动作（守现状）。
 *   T12（红→绿 · 选择器面机检）：`input.accept` = `["image/*","text/*",...TEXT_EXTS].join(",")` 逐字 ∥ `TEXT_EXTS` 79 项。
 *   T13（红→绿 · 扩展名支）：`file.type` 空串 + `notes.md` ⇒ 芯片在场（仅扩展名支即受纳）。
 *   T14（红→绿 · `text/*` 支）：无扩展名（`README`）+ `text/plain` ⇒ 芯片在场 ∥ 发送块 info string 省略（裸围栏）。
 *   T15（红→绿 · 读取失败）：`FileReader` `error` ∥ `abort` ⇒ toast `composer.attach.readFailed` ∥ 零芯片。
 *   AC-7（红→绿 · 词面对拍）：VSC `locales/{en,zh}` 键集相等 ∥ 六键值 = canon 逐字 ∥ `toolbar.attach` 两语收正
 *       ∥ 桌面第二档六键值逐字同 VSC ∥ 键数链（`VIEWS_DICT` 150 ∥ `HOST_DICT` 合并表 338）。
 *
 * 车具：happy-dom 真 DOM + `/rc/` 解析钩子 + 桌面词表注册，沿 `docs/batches/2026-10-04-composer-queue-gate-stick.test.mjs` 先例；
 *   file 注入 = `Object.defineProperty(input, "files", { value: [file] })` + `change` 派发；T15 腿 = `globalThis.FileReader` 注桩。
 * 本件不进仓套件（批内件 · 随批留存）；复跑（cwd = 仓库根）：
 *   node --test docs/batches/2026-10-05-attach-file-support.test.mjs
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

// 渲染档取核件：`/rc/` 解析钩子（沿 `2026-09-29-desktop-susp-queue.test.mjs` 先例）。
const rcRoot = resolve(ROOT, "thincoder-render-core")
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("/rc/")) return { url: pathToFileURL(resolve(rcRoot, specifier.slice(4))).href, shortCircuit: true }
    return nextResolve(specifier, context)
  },
})

// ─── happy-dom 真 DOM（实读在盘：`thincoder-vscode/node_modules/@happy-dom/**`）──
const { GlobalRegistrator } = await import(pathToFileURL(resolve(ROOT, "thincoder-vscode/node_modules/@happy-dom/global-registrator/lib/index.js")).href)
GlobalRegistrator.register()
if (typeof Element.prototype.scrollIntoView !== "function") Element.prototype.scrollIntoView = function () {} // happy-dom 缺项垫片（沿批内件先例）

// ─── 装配面：词表（注册单点 = 桌面 `app.mjs` 同式）∥ 核件面板 ∥ 附件面导出面 ─────────────
const coreI18n = await mod("thincoder-render-core/i18n.mjs")
const hostI18n = await mod("thincoder-desktop/renderer/i18n.mjs")
hostI18n.setStringsSink(coreI18n.setStrings) // 核件取词注册面（面板 ∥ 附件面经核 `t` 取词）
hostI18n.initDict({ locale: "zh" })
const { createComposerPanel } = await mod("thincoder-render-core/composer/panel.mjs")
const { showToast } = await mod("thincoder-render-core/toast.mjs")
const attachNs = await mod("thincoder-render-core/composer/attach.mjs")
const { VIEWS_DICT } = await mod("thincoder-desktop/renderer/i18n-views.mjs")
const TEXT_EXTS = Array.isArray(attachNs.TEXT_EXTS) ? attachNs.TEXT_EXTS : [] // 红态 = 未落 ⇒ []

const settle = (ms = 25) => new Promise((r) => setTimeout(r, ms))
const enter = (panel) => panel.inputEl.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }))
/** toast 读数（并清核 toast 2.6s 自动淡出定时器——防跑批时长绑墙钟；先例 = 排队批内件同式）。 */
const toastText = () => {
  clearTimeout(showToast._t)
  const el = document.body.querySelector("#paste-toast")
  return el === null ? null : el.textContent
}
const resetToast = () => { clearTimeout(showToast._t); document.body.querySelector("#paste-toast")?.remove() }

/** File 构造（`type` 缺省 ⇒ 空串——T13 腿用）。 */
const F = (content, name, type) => (type === undefined ? new File([content], name) : new File([content], name, { type }))

/** 面板车具（核件面板 ∥ 真 DOM；`queue` = 宿主镜像 provider 桩；回显 ∥ 上行双录）。 */
function bootPanel({ queue, turnState = () => "idle" } = {}) {
  const root = document.createElement("div")
  document.body.append(root)
  const posts = []
  const echoes = []
  const panel = createComposerPanel({
    root,
    post: (type, payload) => { posts.push({ type, payload }) },
    state: { turnState, queue, models: () => [], flags: () => ({}), workspaceRequired: () => false },
    hooks: { onUserEcho: (text) => { echoes.push(text); return null } },
  })
  return { panel, root, posts, echoes }
}

const fileInputOf = (root) => root.querySelector("#file-input")
const badgeOf = (root) => root.querySelector("#paste-badge")
/** 注入 + `change` 派发 + 读档落定（`FileReader` 两段 `setTimeout` ⇒ 异步结算）。 */
async function addFiles(root, ...files) {
  const input = fileInputOf(root)
  Object.defineProperty(input, "files", { value: files, configurable: true })
  input.dispatchEvent(new Event("change", { bubbles: true }))
  await settle()
}

// ─── T1（红→绿 · 受纳）────────────────────────────────────────────────────
test("T1（红→绿 · 受纳）：选 notes.md（text/markdown）⇒ 芯片 `📎 notes.md` 在场", async () => {
  resetToast()
  const { root } = bootPanel()
  await addFiles(root, F("# 标题\n正文", "notes.md", "text/markdown"))
  console.log(`[读数] T1：badge=${JSON.stringify(badgeOf(root).textContent)}`)
  assert.match(badgeOf(root).textContent, /📎 notes\.md/, "芯片 = 📎 notes.md（红 = 零芯片静默丢）")
  assert.equal(toastText(), null, "受理径零 toast")
})

// ─── T2（红→绿 · 直发内联）───────────────────────────────────────────────
test("T2（红→绿 · 直发内联）：档 + 文本 + Enter ⇒ userMessage.text 逐字 ∥ 回显同串 ∥ 芯片清", async () => {
  resetToast()
  const { panel, root, posts, echoes } = bootPanel()
  await addFiles(root, F("# 标题", "notes.md", "text/markdown"))
  panel.inputEl.value = "行文"
  enter(panel)
  const expect = "行文\n\n[Attached file: notes.md]\n```md\n# 标题\n```"
  console.log(`[读数] T2：text=${JSON.stringify(posts[0]?.payload?.text)}`)
  assert.equal(posts.length, 1, "恰一条上行")
  assert.equal(posts[0].type, "userMessage", "直发径 = userMessage")
  assert.equal(posts[0].payload.text, expect, "内联逐字（头行 + fenced 段）")
  assert.equal(echoes.length, 1, "回显恰一次")
  assert.equal(echoes[0], expect, "回显 = 内联后整串（K3 三面同串）")
  assert.equal(badgeOf(root).textContent, "", "发送 ⇒ 芯片清")
  assert.equal(posts[0].payload.images.length, 0, "文本档不入 images 列")
})

// ─── T3（红→绿 · 单档限）─────────────────────────────────────────────────
test("T3（红→绿 · 单档限）：256 001 B ⇒ toast tooLarge 逐字 ∥ 零芯片", async () => {
  resetToast()
  const { root } = bootPanel()
  await addFiles(root, F("x".repeat(256001), "big.txt", "text/plain"))
  const word = coreI18n.t("composer.attach.tooLarge", { name: "big.txt" })
  console.log(`[读数] T3：toast=${JSON.stringify(toastText())}`)
  assert.notEqual(word, "composer.attach.tooLarge", "键须在册（回落键名 = 缺键——断言不得恒真）")
  assert.equal(toastText(), word, "toast = t(tooLarge, {name}) 逐字")
  assert.equal(badgeOf(root).textContent, "", "零芯片")
})

// ─── T4（红→绿 · 二进制）─────────────────────────────────────────────────
test("T4（红→绿 · 二进制）：前 8000 B 含 NUL ⇒ toast binary 逐字 ∥ 零芯片", async () => {
  resetToast()
  const { root } = bootPanel()
  await addFiles(root, F("abc\u0000def", "blob.txt", "text/plain"))
  const word = coreI18n.t("composer.attach.binary", { name: "blob.txt" })
  assert.notEqual(word, "composer.attach.binary", "键须在册")
  assert.equal(toastText(), word, "toast = t(binary, {name}) 逐字")
  assert.equal(badgeOf(root).textContent, "", "零芯片")
})

// ─── T5（红→绿 · 档数限）─────────────────────────────────────────────────
test("T5（红→绿 · 档数限）：第 5 档 ⇒ toast tooMany ∥ 前 4 档在场 ∥ 第 5 档零入列", async () => {
  resetToast()
  const { root } = bootPanel()
  await addFiles(root,
    F("a", "f1.txt", "text/plain"), F("b", "f2.txt", "text/plain"),
    F("c", "f3.txt", "text/plain"), F("d", "f4.txt", "text/plain"))
  assert.equal(badgeOf(root).querySelectorAll(".paste-chip").length, 4, "前 4 档入列（芯片 4）")
  resetToast()
  await addFiles(root, F("e", "f5.txt", "text/plain"))
  const word = coreI18n.t("composer.attach.tooMany", { name: "f5.txt" })
  console.log(`[读数] T5：toast=${JSON.stringify(toastText())}`)
  assert.notEqual(word, "composer.attach.tooMany", "键须在册")
  assert.equal(toastText(), word, "toast = t(tooMany, {name}) 逐字")
  assert.equal(badgeOf(root).querySelectorAll(".paste-chip").length, 4, "第 5 档零入列")
  // 多选径（同一 `change` 事件五档——判据读面含在飞档：第 5 档出声拒 ∥ 恰 4 档入列）
  resetToast()
  const { root: rootB } = bootPanel()
  await addFiles(rootB,
    F("a", "m1.txt", "text/plain"), F("b", "m2.txt", "text/plain"), F("c", "m3.txt", "text/plain"),
    F("d", "m4.txt", "text/plain"), F("e", "m5.txt", "text/plain"))
  console.log(`[读数] T5（同一事件五档）：toast=${JSON.stringify(toastText())}`)
  assert.equal(toastText(), coreI18n.t("composer.attach.tooMany", { name: "m5.txt" }), "同一事件 5 档 ⇒ 第 5 档出声拒（在飞档计入）")
  assert.equal(badgeOf(rootB).querySelectorAll(".paste-chip").length, 4, "同一事件 5 档 ⇒ 恰 4 档入列")
})

// ─── T6（红→绿 · 合计限）─────────────────────────────────────────────────
test("T6（红→绿 · 合计限）：2×200 000 B 后第 3 档 ⇒ toast totalLimit 逐字", async () => {
  resetToast()
  const { root } = bootPanel()
  const big = (name) => F("a".repeat(200000), name, "text/plain")
  await addFiles(root, big("g1.txt"), big("g2.txt"))
  assert.equal(badgeOf(root).querySelectorAll(".paste-chip").length, 2, "2×200 000 B 受理（合计 400 000 ≤ 512 000）")
  resetToast()
  await addFiles(root, big("g3.txt"))
  const word = coreI18n.t("composer.attach.totalLimit", { name: "g3.txt" })
  console.log(`[读数] T6：toast=${JSON.stringify(toastText())}`)
  assert.notEqual(word, "composer.attach.totalLimit", "键须在册")
  assert.equal(toastText(), word, "toast = t(totalLimit, {name}) 逐字")
  assert.equal(badgeOf(root).querySelectorAll(".paste-chip").length, 2, "第 3 档零入列")
  // 多选径（同一 `change` 事件 3×200 000 B——合计读面含在飞档：第 3 档出声拒 ∥ 恰 2 档入列）
  resetToast()
  const { root: rootB } = bootPanel()
  await addFiles(rootB, big("h1.txt"), big("h2.txt"), big("h3.txt"))
  console.log(`[读数] T6（同一事件 3×200 000 B）：toast=${JSON.stringify(toastText())}`)
  assert.equal(toastText(), coreI18n.t("composer.attach.totalLimit", { name: "h3.txt" }), "同一事件 3×200 000 B ⇒ 第 3 档出声拒（合计含在飞档）")
  assert.equal(badgeOf(rootB).querySelectorAll(".paste-chip").length, 2, "同一事件 3×200 000 B ⇒ 恰 2 档入列")
})

// ─── T7（红→绿 · 类型不支持）─────────────────────────────────────────────
test("T7（红→绿 · 类型不支持）：选 doc.pdf ⇒ toast unsupported 逐字 ∥ 零芯片", async () => {
  resetToast()
  const { root } = bootPanel()
  await addFiles(root, F("%PDF-1.4", "doc.pdf", "application/pdf"))
  const word = coreI18n.t("composer.attach.unsupported", { name: "doc.pdf" })
  console.log(`[读数] T7：toast=${JSON.stringify(toastText())}`)
  assert.notEqual(word, "composer.attach.unsupported", "键须在册")
  assert.equal(toastText(), word, "toast = t(unsupported, {name}) 逐字")
  assert.equal(badgeOf(root).textContent, "", "零芯片")
})

// ─── T8（红→绿 · 围栏安全 ∥ 转义）────────────────────────────────────────
test("T8（红→绿 · 围栏安全 ∥ 转义）：内容含 ``` ⇒ 围栏 4 ∥ 名含 `<` ⇒ 芯片字面（零注入）", async () => {
  resetToast()
  const { panel, root, posts } = bootPanel()
  await addFiles(root, F("前 ``` 后", "a<b>.md", "text/markdown"))
  const badge = badgeOf(root)
  console.log(`[读数] T8：chipHTML=${JSON.stringify(badge.innerHTML)}`)
  assert.equal(badge.querySelector("b"), null, "零注入（名中 `<` 不成元素）")
  assert.ok(badge.innerHTML.includes("a&lt;b&gt;.md"), "转义形态在场（&lt; &gt;）")
  panel.inputEl.value = "看"
  enter(panel)
  const F4 = "`".repeat(4) // 围栏 = 内容最长反引号串（3）+ 1
  const expect = "看\n\n[Attached file: a<b>.md]\n" + F4 + "md\n前 ``` 后\n" + F4
  assert.equal(posts[0].payload.text, expect, "围栏长 = 最长串 + 1（4）逐字")
})

// ─── T9（红→绿 · 队径）───────────────────────────────────────────────────
test("T9（红→绿 · 队径）：忙态 + 档 + Enter ⇒ queuedUserMessage.text 同 T2 内联 ∥ 回显同串", async () => {
  resetToast()
  const { panel, root, posts, echoes } = bootPanel({ queue: () => ({ count: 0 }), turnState: () => "running" })
  await addFiles(root, F("# 标题", "notes.md", "text/markdown"))
  panel.inputEl.value = "排队文"
  enter(panel)
  const expect = "排队文\n\n[Attached file: notes.md]\n```md\n# 标题\n```"
  console.log(`[读数] T9：text=${JSON.stringify(posts[0]?.payload?.text)}`)
  assert.equal(posts.length, 1, "恰一条上行")
  assert.equal(posts[0].type, "queuedUserMessage", "忙态径 = queuedUserMessage")
  assert.equal(posts[0].payload.text, expect, "队径同判（内联逐字）")
  assert.equal(echoes[0], expect, "回显同串")
  assert.equal(badgeOf(root).textContent, "", "芯片清")
})

// ─── T10（绿锁 · 图片道零改）─────────────────────────────────────────────
test("T10（绿锁 · 图片道零改）：raster png 照收 ∥ 非栅格 svg 照拒（原键原值）", async () => {
  resetToast()
  const { root } = bootPanel()
  await addFiles(root, new File([new Uint8Array([137, 80, 78, 71])], "pic.png", { type: "image/png" }))
  const badge = badgeOf(root)
  console.log(`[读数] T10：chip=${JSON.stringify(badge.textContent)}`)
  assert.match(badge.textContent, /📎 image 1/, "图芯片文本锁不动（📎 image N）")
  assert.equal(badge.textContent.includes("pic.png"), false, "图芯片不显示文件名（零语义改）")
  assert.equal(toastText(), null, "raster 受理径零 toast")
  resetToast()
  await addFiles(root, F("<svg/>", "icon.svg", "image/svg+xml"))
  const word = coreI18n.t("paste.unsupportedFormat", { type: "image/svg+xml" })
  assert.notEqual(word, "paste.unsupportedFormat", "复用键须在册")
  assert.equal(toastText(), word, "非栅格照拒 = paste.unsupportedFormat 逐字")
})

// ─── T11（绿锁 · 空文本边界）─────────────────────────────────────────────
test("T11（绿锁 · 空文本边界）：档在 ∥ 文本空 ∥ Enter ⇒ 零上行 ∥ 芯片面零动作", async () => {
  resetToast()
  const { panel, root, posts } = bootPanel()
  await addFiles(root, F("x", "notes.md", "text/markdown"))
  const before = badgeOf(root).textContent // 红态 = ""（档未受纳）∥ 绿态 = `📎 notes.md✕`
  panel.inputEl.value = ""
  enter(panel)
  console.log(`[读数] T11：before=${JSON.stringify(before)} · posts=${posts.length}`)
  assert.deepEqual(posts, [], "零上行（!text ⇒ 拒——守现状）")
  assert.equal(badgeOf(root).textContent, before, "芯片面零动作（前后同读——绿态 = 档保留）")
})

// ─── T12（红→绿 · 选择器面机检）──────────────────────────────────────────
test("T12（红→绿 · 选择器面机检）：accept = 同源派生逐字 ∥ TEXT_EXTS 79 项", () => {
  const { root } = bootPanel()
  const accept = fileInputOf(root).accept
  console.log(`[读数] T12：accept=${JSON.stringify(accept.slice(0, 60))}… len=${accept.length} · TEXT_EXTS=${TEXT_EXTS.length}`)
  const items = accept === "" ? [] : accept.split(",")
  assert.ok(items.includes("image/*"), "accept 含 image/*（栅格道零改）")
  assert.ok(items.includes("text/*"), "accept 含 text/*（`text/*` 支）")
  for (const ext of [".md", ".py", ".json"]) assert.ok(items.includes(ext), `accept 含 ${ext}（TEXT_EXTS 抽样）`)
  assert.equal(TEXT_EXTS.length, 79, "TEXT_EXTS = 79 项（设计计数锁——D3）")
  assert.equal(accept, ["image/*", "text/*", ...TEXT_EXTS].join(","), "accept = [image/*, text/*, ...TEXT_EXTS] 逐字（同源派生）")
})

// ─── T13（红→绿 · 扩展名支）──────────────────────────────────────────────
test("T13（红→绿 · 扩展名支）：file.type 空串 + notes.md ⇒ 芯片在场", async () => {
  resetToast()
  const { root } = bootPanel()
  const f = F("正文", "notes.md") // 无 type 选项 ⇒ 空串
  assert.equal(f.type, "", "前置：type 空串")
  await addFiles(root, f)
  assert.match(badgeOf(root).textContent, /📎 notes\.md/, "仅扩展名支即受纳（红 = 静默丢）")
})

// ─── T14（红→绿 · text/* 支 ∥ info string 省略）──────────────────────────
test("T14（红→绿 · text/* 支）：无扩展名 README + text/plain ⇒ 芯片在场 ∥ 发送块裸围栏", async () => {
  resetToast()
  const { panel, root, posts } = bootPanel()
  await addFiles(root, F("hello", "README", "text/plain"))
  assert.match(badgeOf(root).textContent, /📎 README/, "芯片在场（text/* 支）")
  panel.inputEl.value = "见附件"
  enter(panel)
  const expect = "见附件\n\n[Attached file: README]\n```\nhello\n```"
  console.log(`[读数] T14：text=${JSON.stringify(posts[0]?.payload?.text)}`)
  assert.equal(posts[0].payload.text, expect, "无扩展名 ⇒ info string 省略（裸围栏）")
})

// ─── T15（红→绿 · 读取失败）──────────────────────────────────────────────
test("T15（红→绿 · 读取失败）：FileReader error ∥ abort ⇒ toast readFailed 逐字 ∥ 零芯片", async () => {
  resetToast()
  const RealFileReader = globalThis.FileReader
  const stub = (eventName) => {
    globalThis.FileReader = class { readAsArrayBuffer() { setTimeout(() => this["on" + eventName]?.(new Event(eventName)), 0) } }
  }
  try {
    for (const ev of ["error", "abort"]) {
      stub(ev)
      const { root } = bootPanel()
      await addFiles(root, F("x", "notes.md", "text/markdown"))
      const word = coreI18n.t("composer.attach.readFailed", { name: "notes.md" })
      console.log(`[读数] T15(${ev})：toast=${JSON.stringify(toastText())}`)
      assert.notEqual(word, "composer.attach.readFailed", "键须在册")
      assert.equal(toastText(), word, `读失败（${ev}）⇒ 出声拒`)
      assert.equal(badgeOf(root).textContent, "", `读失败（${ev}）⇒ 零芯片`)
      resetToast()
    }
  } finally {
    globalThis.FileReader = RealFileReader
  }
})

// ─── AC-7（红→绿 · 词面对拍——设计 §2.7 AC-7 检查面 = 批内件）────────────
test("AC-7（红→绿 · 词面对拍）：键集相等 ∥ 六键 canon 逐字 ∥ toolbar.attach 收正 ∥ 桌面第二档同 VSC", () => {
  const CANON = {
    "composer.attach.tooLarge": { en: "File too large (max 256 KB): ${name}", zh: "文件过大（上限 256 KB）：${name}" },
    "composer.attach.tooMany": { en: "Too many text attachments (max 4): ${name}", zh: "文本附件过多（每回合最多 4 个）：${name}" },
    "composer.attach.totalLimit": { en: "Attachment total exceeds 512 KB for this turn: ${name}", zh: "本回合附件合计超过 512 KB：${name}" },
    "composer.attach.binary": { en: "Not a text file (binary content): ${name}", zh: "非文本文件（二进制内容）：${name}" },
    "composer.attach.unsupported": { en: "Unsupported file type: ${name}", zh: "不支持的文件类型：${name}" },
    "composer.attach.readFailed": { en: "Could not read file: ${name}", zh: "无法读取文件：${name}" },
  }
  const enVsc = JSON.parse(src("thincoder-vscode/locales/en.json"))
  const zhVsc = JSON.parse(src("thincoder-vscode/locales/zh.json"))
  assert.deepEqual(Object.keys(enVsc).sort(), Object.keys(zhVsc).sort(), "VSC 两语键集相等（+6 同拍）")
  for (const [key, v] of Object.entries(CANON)) {
    assert.equal(enVsc[key], v.en, `VSC en canon 逐字：${key}`)
    assert.equal(zhVsc[key], v.zh, `VSC zh canon 逐字：${key}`)
    assert.equal(VIEWS_DICT.en[key], v.en, `桌面第二档 en 逐字同 VSC：${key}`)
    assert.equal(VIEWS_DICT.zh[key], v.zh, `桌面第二档 zh 逐字同 VSC：${key}`)
  }
  assert.equal(enVsc["toolbar.attach"], "Attach file", "en toolbar.attach 收正")
  assert.equal(zhVsc["toolbar.attach"], "添加文件", "zh toolbar.attach 收正")
  assert.equal(Object.keys(VIEWS_DICT.en).length, 150, "VIEWS_DICT en = 150（键数链 + B1 随正）")
  assert.equal(Object.keys(VIEWS_DICT.zh).length, 150, "VIEWS_DICT zh = 150")
  assert.equal(Object.keys(hostI18n.HOST_DICT.en).length, 338, "HOST_DICT 合并表 en = 338")
  assert.equal(Object.keys(hostI18n.HOST_DICT.zh).length, 338, "HOST_DICT 合并表 zh = 338")
})
