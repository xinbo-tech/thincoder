/**
 * views-attach.test.mjs — 附件面用例（批 B ⑧ · 形态单源 = `docs/desktop/design/UI.md` §1 输入区行「批 B 注」项 2 ·
 * 载荷 / 上限 / 降级面 = `docs/desktop/design/IPC.md` §2「附件注」· 任务书 = `docs/batches/2026-09-27-desktop-chat-panel-b.md` §2.4 T-DSK30）：
 *   U138 采集面（`pasteImages` / `collectImages`）：非图内容零动作且不吞事件 · 图像项逐项原样（缺名不造串）·
 *     读失败 / 空读 ⇒ 弃项 + 一行诊断（零静默）· 环境缺 `FileReader` ⇒ 拒绝（零静默）；
 *   U139 构树面（`attachmentBar` / `degradedNotice` / `composerTree` 子序）：三件（缩略图 / 文件名 / 移除控件）·
 *     无名 ⇒ 零文件名字节点 · 空 / 非数组 ⇒ `null`（零节点）· 移除控件 id 携键两态 · 降级闭集两值 + 表外 ⇒ `null`;
 *   U140 出口面（`toImages` / `submitDraft`）：恰形 `{name,mime,dataURL}`（`id` = 端侧锚位，不出面）· 零附件 ⇒
 *     不落 `images` 键（批 A 恰形不变）· 非空 ⇒ 逐项随载荷 · `onReceipt` 只随直发（早返径零 IPC 零钩）；
 *   U141 接线面（`attachComposer` 平 node：`document` 缺 ⇒ `paintComposer` 回值 = 模型）：粘贴 ⇒ 条 ⇒ 并发粘贴
 *     读毕序入列（不互覆盖）⇒ 移除 ⇒ 直发携图 + 清条 + 降级记录 ⇒ 下次净发送替换（`degraded` 清）· 失败 / 忙态入队
 *     ⇒ 图保留（清条判据 = 直发 `ok` 真 —— 队条目形载不了附件）。
 * 用例号 = 自铸（`U138–U141`）：设计用例号归属表无本舱段（沿 A-3b `U120/U121` 先例）。
 * 复制面（`views/chat-copy.mjs`）归本批他舱 —— 本档只附件面。
 * 平 node 桩：`FileReader` 环境桩（本档**无注入面** —— 跑真默认径）；真粘贴 / 真剪贴板 / 真落盘 = 人工走查（T-DSK30）。
 * 词面零字面：`useSentinels` ⇒ 断言即证「文案经 `t()` 消费」；「键齐」（实表含键）归 `test/views-chrome.test.mjs` U51 扫描面。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { t } from "../renderer/i18n.mjs"
import { attachmentBar, collectImages, degradedCode, degradedNotice, pasteImages, toImages } from "../renderer/attach.mjs"
import { attachComposer, composerModel, composerTree, submitDraft } from "../renderer/mount-composer.mjs"
import { createStore, initialState } from "../renderer/store.mjs"
import { useSentinels } from "./views-harness.mjs"

// ─── 夹具 ──────────────────────────────────────────────────────────────

const KEY = "1"
/** 纯态缝：初态 + 活动会话（`initialState` 单源 —— 不手抄切片形）。 */
const blank = (over = {}) => ({ ...initialState(), activeSession: KEY, ...over })
/** 剪贴板项夹具（`kind: "file"` + `getAsFile()` —— 与真 `DataTransferItem` 同形）。 */
const fileItem = (type, name = "") => ({ kind: "file", getAsFile: () => ({ type, name }) })
/** 粘贴事件夹具（`clipboardData.items` —— 采集面唯一读径）。 */
const eventOf = (...items) => ({ clipboardData: { items } })
/** 异步径推进（读毕回调后到下一宏任务 —— `collectImages` 内 await 链与 `onPaste` / `onKeyDown` 的 `.then` 全落地）。 */
const flush = () => new Promise((resolve) => setImmediate(resolve))

/** `FileReader` 环境桩（**真默认径** —— 生产面 `collectImages` 无注入面）：`readAsDataURL` 入闸，`settle` / `fail` 逐项回调。 */
function stubReader(ctx) {
  const pending = []
  class FakeReader {
    readAsDataURL(file) { pending.push({ reader: this, file }) }
  }
  const prior = globalThis.FileReader
  globalThis.FileReader = FakeReader
  ctx.after(() => { if (prior === undefined) delete globalThis.FileReader; else globalThis.FileReader = prior })
  return {
    pending,
    settle(entry, result) { entry.reader.result = result; entry.reader.onload() },
    fail(entry, error) { entry.reader.error = error; entry.reader.onerror() },
    disable() { globalThis.FileReader = undefined },
  }
}

/** `console.error` 录面（零静默判据 —— 诊断串非面向用户文案，不经 `t()`）。 */
function captureErrors(ctx) {
  const lines = []
  const prior = console.error
  console.error = (...args) => { lines.push(args) }
  ctx.after(() => { console.error = prior })
  return lines
}

const IMAGE = { id: "a1", name: "pic.png", mime: "image/png", dataURL: "data:image/png;base64,AAA" }
const inputOf = (tree) => tree.children.find((kid) => kid.tag === "textarea")

// ─── U138 采集面 ──────────────────────────────────────────────────────

test("U138: 采集面（非图零动作且不吞事件 / 逐项原样 / 两弃项各响一行 / 环境缺 FileReader 拒绝）", async (ctx) => {
  useSentinels(ctx)
  const errors = captureErrors(ctx)

  // ① 非图内容零动作（文本照粘贴 —— 采集面只读剪贴板，零 `preventDefault` 面）
  assert.deepEqual(pasteImages(eventOf({ kind: "string" }, fileItem("text/plain", "note.txt"))), [], "非文件项 / 非图 MIME ⇒ 零项")
  assert.deepEqual(pasteImages(undefined), [], "事件缺 ⇒ 零项（零抛）")
  assert.deepEqual(pasteImages({ clipboardData: { items: null } }), [], "项表缺 ⇒ 零项")
  assert.deepEqual(pasteImages(eventOf({ kind: "file", getAsFile: () => null })), [], "取档空 ⇒ 零项")

  // ② 图像项逐项原样（序同剪贴板 · 缺名 ⇒ 空串，不造名）
  const picked = pasteImages(eventOf(fileItem("image/png", "pic.png"), fileItem("image/jpeg")))
  assert.deepEqual(picked.map((item) => [item.mime, item.name]), [["image/png", "pic.png"], ["image/jpeg", ""]], "逐项原样（无名不造串）")

  // ③ 读失败 / 空读 ⇒ 弃项 + 一行诊断（零静默丢图）
  const reader = stubReader(ctx)
  const failed = collectImages(eventOf(fileItem("image/png", "bad.png")))
  reader.fail(reader.pending.at(-1), new Error("boom"))
  assert.deepEqual(await failed, [], "读失败 ⇒ 弃该项")
  assert.equal(errors.length, 1, "读失败 ⇒ 恰一行诊断")
  assert.equal(String(errors[0][0]), "[attach] paste: image read failed:", "错面前缀逐字")
  assert.ok(errors[0][1] instanceof Error, "原错随附（不吞）")

  errors.length = 0
  const empty = collectImages(eventOf(fileItem("image/png", "blank.png")))
  reader.settle(reader.pending.at(-1), "")
  assert.deepEqual(await empty, [], "空读 ⇒ 弃该项（零假图）")
  assert.equal(errors.length, 1, "空读 ⇒ 恰一行诊断")

  // ④ 读毕恰形（`{name,mime,dataURL}` —— 零 `id`：锚位归接线面）
  const ok = collectImages(eventOf(fileItem("image/png", "ok.png")))
  reader.settle(reader.pending.at(-1), "data:image/png;base64,OK")
  assert.deepEqual(await ok, [{ name: "ok.png", mime: "image/png", dataURL: "data:image/png;base64,OK" }], "读毕逐项恰形")

  // ⑤ 环境缺 `FileReader` ⇒ 拒绝（响亮弃项，零静默）
  errors.length = 0
  reader.disable()
  assert.deepEqual(await collectImages(eventOf(fileItem("image/png", "noapi.png"))), [], "无 `FileReader` ⇒ 零项")
  assert.equal(errors.length, 1, "无 `FileReader` ⇒ 恰一行诊断（零静默）")
})

// ─── U139 构树面 ──────────────────────────────────────────────────────

test("U139: 构树面（三件 / 无名不造串 / 空条零节点 / id 携键两态 / 降级两值 + 表外 null / 输入区子序）", (ctx) => {
  useSentinels(ctx)
  const removed = []
  const bar = attachmentBar([IMAGE], { onRemoveAttachment: (id) => removed.push(id) })
  assert.equal(bar.props.class, "composer-attachments", "条根类名（样式面既定类）")
  assert.equal(bar.props["data-attachments"], "", "条根锚在位（空串 = 存在性锚）")
  assert.equal(bar.children.length, 1, "逐项一条目")

  const item = bar.children[0]
  assert.deepEqual(item.children.map((kid) => kid.tag), ["img", "span", "button"], "子序 = [缩略图, 文件名, 移除控件]")
  assert.equal(item.children[0].props.src, IMAGE.dataURL, "缩略图 = 图面数据（dataURL 直传 · 渲染面零 fs）")
  assert.equal(item.children[1].children[0], "pic.png", "文件名原样（零加工）")
  const button = item.children[2]
  assert.equal(button.props["data-action"], "attach:remove", "移除出口锚逐字（UI.md §1 输入区行）")
  assert.equal(button.props["data-attachment-id"], "a1", "条目 id 携于锚（与暂存条目 id 同源）")
  assert.equal(button.props["aria-label"], t("composer.attach.remove"), "可及名 = 词键（零字面）")
  assert.equal(typeof button.props.onClick, "function", "移除接线在场")
  button.props.onClick()
  assert.deepEqual(removed, ["a1"], "点按 ⇒ 携本键回（`withKey` 闭包）")

  // 无名 ⇒ 零文件名字节点（不造假串）；句柄缺 ⇒ 零隐藏（锚恒在，控件 `disabled`）
  const unnamed = attachmentBar([{ id: "a2", name: "", mime: "image/png", dataURL: "data:image/png;base64,BBB" }])
  assert.deepEqual(unnamed.children[0].children.map((kid) => kid.tag), ["img", "button"], "无名 ⇒ 两件（零文件名字节点）")
  assert.equal(attachmentBar([IMAGE], {}).children[0].children[2].props.disabled, true, "移除句柄缺 ⇒ `disabled`（锚恒在）")

  // 空 ∥ 非数组 ⇒ `null`（零节点 —— 禁假造空位）
  assert.equal(attachmentBar([], {}), null, "空条 ⇒ null")
  assert.equal(attachmentBar(undefined), null, "缺 ⇒ null")
  assert.equal(attachmentBar("x"), null, "非数组 ⇒ null")

  // 降级提示行（闭集两值；表外 ∥ 缺 ⇒ `null`）
  const nonvision = degradedNotice("non-vision")
  assert.equal(nonvision.props["data-notice"], "attach-degraded", "提示行锚")
  assert.equal(nonvision.props["data-degraded"], "non-vision", "码字面住锚（两语同锚）")
  assert.equal(nonvision.children[0], t("composer.attach.nonvision"), "词面经 `t()`（闭集表单源）")
  assert.equal(degradedNotice("partial").children[0], t("composer.attach.partial"), "`partial` 同径")
  assert.equal(degradedNotice("other"), null, "表外码 ⇒ null（不猜、不造串）")
  assert.equal(degradedNotice(undefined), null, "缺 ⇒ null")
  assert.equal(degradedCode("non-vision"), "non-vision", "受理判据：闭集内 ⇒ 原码")
  assert.equal(degradedCode("other"), null, "受理判据：表外 ⇒ null")

  // 输入区子序（[满队?][降级?][条?]输入框[中断]）+ 粘贴接线两态
  const wired = { onKeyDown: () => {}, onPaste: () => {}, onRemoveAttachment: () => {} }
  const tree = composerTree(composerModel(blank({ pool: { ...initialState().pool } }), { attachments: [IMAGE], degraded: "partial" }), wired)
  assert.deepEqual(
    tree.children.map((kid) => kid.props["data-notice"] ?? kid.props.class),
    ["attach-degraded", "composer-attachments", "composer-input", "composer-interrupt"],
    "子序 = 降级 → 附件条 → 输入框 → 中断键",
  )
  assert.equal(typeof inputOf(tree).props.onPaste, "function", "粘贴接线落输入框（可用态）")
  const idle = composerTree(composerModel({ activeSession: null }, { attachments: [IMAGE] }), wired)
  assert.equal(inputOf(idle).props.disabled, true, "不可用 ⇒ disabled（未接线通则）")
  assert.equal(inputOf(idle).props.onPaste, undefined, "不可用 ⇒ 零粘贴接线")
  const plain = composerTree(composerModel(blank({ pool: { ...initialState().pool } })), wired)
  assert.deepEqual(plain.children.map((kid) => kid.tag), ["textarea", "button"], "零条零提示 ⇒ 两件（批 A 形不动）")
})

// ─── U140 出口面 ──────────────────────────────────────────────────────

test("U140: 出口面（恰形无 id / 零附件不落键 / 非空逐项 / 早返径零 IPC 零钩 / 钩随直发）", async (ctx) => {
  useSentinels(ctx)
  assert.deepEqual(toImages([IMAGE]), [{ name: "pic.png", mime: "image/png", dataURL: "data:image/png;base64,AAA" }], "恰形逐项（`id` 不出面）")
  assert.deepEqual(toImages(undefined), [], "缺 ⇒ 零项")
  assert.deepEqual(toImages([{ id: "a2", name: "x" }]), [], "无图面数据 ⇒ 弃项（零假图）")

  const calls = []
  let reply = { ok: true }
  const host = { invoke: (channel, payload) => { calls.push([channel, payload]); return Promise.resolve(reply) } }
  const store = createStore(blank())
  const seen = []
  const hooked = { store, host, onReceipt: (receipt) => seen.push(receipt) }

  assert.equal(await submitDraft(hooked, "正文", []), "sent", "空白附件数组 ⇒ 直发 `sent`")
  assert.deepEqual(calls[0], ["msg:send", { key: KEY, text: "正文" }], "零附件 ⇒ **不落 `images` 键**（批 A 恰形不变）")
  assert.equal(await submitDraft(hooked, "带图", toImages([IMAGE])), "sent", "非空 ⇒ 携图直发")
  assert.deepEqual(calls[1], ["msg:send", { key: KEY, text: "带图", images: [{ name: "pic.png", mime: "image/png", dataURL: "data:image/png;base64,AAA" }] }], "逐项随载荷（恰形）")
  assert.deepEqual(seen, [{ ok: true }, { ok: true }], "回执钩随直发（恰两次）")

  seen.length = 0
  assert.equal(await submitDraft(hooked, "  ", []), "empty", "空白串 ⇒ `empty`（零动作）")
  assert.equal(await submitDraft({ ...hooked, store: createStore(blank({ activeSession: null })) }, "正文", []), "no-session", "无活动会话 ⇒ `no-session`（零动作）")
  assert.equal(calls.length, 2, "两早返径 ⇒ 零 IPC")
  assert.deepEqual(seen, [], "两早返径 ⇒ 零回执钩")

  reply = { ok: false, reason: "boom" }
  const errors = captureErrors(ctx)
  assert.equal(await submitDraft(hooked, "失败", []), "kept", "回执非 ok ⇒ `kept`")
  assert.equal(errors.length, 1, "失败 ⇒ 一行诊断（零静默）")
  assert.deepEqual(seen, [{ ok: false, reason: "boom" }], "失败回执照递钩（降级面同径受理）")
})

// ─── U141 接线面（平 node）────────────────────────────────────────────

test("U141: 接线面（粘贴 ⇒ 条 ⇒ 并发读毕序入列 ⇒ 移除 ⇒ 直发清条 + 降级 ⇒ 下次净发送 ⇒ 失败 / 忙态留图）", async (ctx) => {
  useSentinels(ctx)
  const errors = captureErrors(ctx)
  const reader = stubReader(ctx)
  const store = createStore(blank())
  const calls = []
  let reply = { ok: true }
  const host = { invoke: (channel, payload) => { calls.push([channel, payload]); return Promise.resolve(reply) } }
  const attached = attachComposer(host, { store })
  ctx.after(() => attached.detach())
  const paste = (...items) => attached.handlers.onPaste(eventOf(...items))
  const type = (value) => attached.handlers.onInput({ target: { value } })
  const enter = (value) => attached.handlers.onKeyDown({ key: "Enter", shiftKey: false, target: { value }, preventDefault: () => {} })
  const model = () => attached.paintComposer()

  // ① 粘贴两图（一次事件两项 —— 逐项读毕才入列）
  paste(fileItem("image/png", "a.png"), fileItem("image/jpeg", "b.jpg"))
  reader.settle(reader.pending.at(-1), "data:image/png;base64,AAA")
  await flush()
  reader.settle(reader.pending.at(-1), "data:image/jpeg;base64,BBB")
  await flush()
  assert.deepEqual(model().attachments.map((entry) => [entry.id, entry.name]), [["a1", "a.png"], ["a2", "b.jpg"]], "两条入列（id 递增 · 序同剪贴板）")

  // ② 并发粘贴（两次事件读毕交错 ⇒ 读毕序入列 ∧ 零覆盖）
  paste(fileItem("image/png", "c.png"))
  paste(fileItem("image/png", "d.png"))
  const c = reader.pending.at(-2)
  const d = reader.pending.at(-1)
  reader.settle(d, "data:image/png;base64,DDD")
  await flush()
  reader.settle(c, "data:image/png;base64,CCC")
  await flush()
  assert.deepEqual(model().attachments.map((entry) => entry.name), ["a.png", "b.jpg", "d.png", "c.png"], "两条皆在（读毕序入列 · 不互覆盖）")

  // ③ 移除（锚键 ⇒ 过滤；树锚 `data-attachment-id` 与条目 `id` 同源）
  attached.handlers.onRemoveAttachment("a1")
  assert.deepEqual(model().attachments.map((entry) => entry.name), ["b.jpg", "d.png", "c.png"], "移除 ⇒ 恰该条退场")

  // ④ 直发携图（回执 `degraded` ⇒ 清条 + 降级记录）
  reply = { ok: true, degraded: "non-vision" }
  type("带图")
  enter("带图")
  await flush()
  assert.equal(calls.length, 1, "直发恰一次")
  assert.equal(calls[0][0], "msg:send", "通道逐字")
  assert.deepEqual(calls[0][1].key, KEY, "载荷键 = 活动会话")
  assert.deepEqual(calls[0][1].images.map((image) => [image.name, Object.keys(image).sort().join(",")]), [["b.jpg", "dataURL,mime,name"], ["d.png", "dataURL,mime,name"], ["c.png", "dataURL,mime,name"]], "逐项恰形（`id` 不出面）")
  assert.deepEqual(model().attachments, [], "直发 `ok` 真 ⇒ 清条")
  assert.equal(model().degraded, "non-vision", "回执降级码入态（提示行由树面出）")

  // ⑤ 下次净发送 ⇒ 降级态替换（`degraded` 清）∧ 零附件不落 `images` 键
  reply = { ok: true }
  type("无图")
  enter("无图")
  await flush()
  assert.deepEqual(calls[1][1], { key: KEY, text: "无图" }, "净发送恰形（无 `images` 键）")
  assert.equal(model().degraded, null, "下次回执无降级码 ⇒ 清态（零残留）")

  // ⑥ 失败径 ⇒ 图与文本皆保留（宁留不丢）
  paste(fileItem("image/png", "keep.png"))
  reader.settle(reader.pending.at(-1), "data:image/png;base64,KEEP")
  await flush()
  reply = { ok: false, reason: "boom" }
  type("失败")
  enter("失败")
  await flush()
  assert.deepEqual(model().attachments.map((entry) => entry.name), ["keep.png"], "失败 ⇒ 图保留")
  assert.equal(model().text, "失败", "失败 ⇒ 文本保留")
  assert.equal(errors.some((args) => String(args[0]).includes("msg:send failed")), true, "失败 ⇒ 诊断在场（零静默）")

  // ⑦ 忙态 ⇒ 入队（队条目形载不了附件 ⇒ 图保留 —— 清条判据 = 直发 `ok` 真）
  store.set({ tabBadges: { [KEY]: ["running"] } })
  enter("失败")
  await flush()
  assert.deepEqual(store.get().pool.queue.map((entry) => [entry.title, entry.status]), [["失败", "queued"]], "忙态 ⇒ 入队恰一条（`{title,status}` 形）")
  assert.equal(calls.length, 3, "忙态 ⇒ 零增 IPC（队列出口归回合尾）")
  assert.deepEqual(model().attachments.map((entry) => entry.name), ["keep.png"], "入队 ⇒ 图保留（队条目形载不了附件）")
  assert.equal(model().text, "", "入队 ⇒ 文本转队即清输入")
})
