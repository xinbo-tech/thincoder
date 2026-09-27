/**
 * views-chrome.test.mjs — E-2 中区外壳用例（会话头 / 状态行出档 / 输入区构树与挂载接线面）：
 * 会话头（字段序单源 · 薄挂载供给面）/ 状态行出档与段表（R3a U158；告警位与 12 段判据面随状态行族迁 `test/views-statusline.test.mjs`——U50 同迁）/
 * 组字门（批 A §1.16㈢ · U126）。全量词表键齐 ∧ 零硬编码（U51）住 `test/views-chrome-vocab.test.mjs`（硬限拆档：原 537 行
 * 越 `docs/desktop/design/PROJECT.md` §4.1 的 500 行硬限 ⇒ 词表族分出——面不变、判据不变，只换宿主档（同笔唯 U51 零 CJK 名单补 `chat-copy.mjs`：15 ⇒ 16）。
 * 零回归面（清单两向 ∧ 导出面锁 ∧ 七槽接线结构面）住 `test/views-locks.test.mjs`；左列面留 `test/views.test.mjs`（U39–U44 + U53）。
 * 纪律：本档只读源 + 调纯函数（`headModel` / `headTree` / `mountHead` / `sessionMetaOf` / `STATUS_SEGMENTS` /
 * `composerModel` / `composerTree` / `attachComposer` / `flushTurnTail`（平 node：`document` 缺 ⇒ 薄挂载早返径））——**不触真 DOM**
 * （会话头挂载落点一段走假 DOM `test/fake-dom.mjs`；真机走查随人工）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { initDict, t } from "../renderer/i18n.mjs"
import { headModel, headTree, mountHead, sessionMetaOf } from "../renderer/views/chrome.mjs"
import { STATUS_SEGMENTS } from "../renderer/views/statusline.mjs"
import { attachComposer, COMPOSER_SLOT, composerModel, composerTree, flushTurnTail, submitDraft } from "../renderer/mount-composer.mjs"
import { QUEUE_MAX } from "../renderer/store.mjs"
import { chatModel, chatTree } from "../renderer/views/chat.mjs"
import { installFakeDom, selfCheck } from "./fake-dom.mjs"

// ─── U49 会话头（中区外壳 · 字段序单源）──────────────────────

test("U49: 会话头（data-meta 两态 ∧ 字段序 = 槽序 ∧ 只落非空串 ∧ 根 data-tab ∧ 三值 `select` 控形）", () => {
  const bare = headTree(headModel({ tab: null, meta: null }))
  assert.equal(bare.props["data-meta"], "none", "零字段 ⇒ data-meta=none（供给未落 = 常态）")
  assert.equal("data-tab" in bare.props, false, "无活动标签 ⇒ 零 data-tab（不造空键）")
  assert.deepEqual(bare.children, [], "零字段 ⇒ 零节点（禁假数据 —— 值面随 T-DSK7）")

  const meta = { autoApprove: "off", effort: "high", model: "M", provider: "P", engineering: "on" }
  const full = headTree(headModel({ tab: "b", meta }))
  assert.equal(full.props["data-meta"], "present", "有字段 ⇒ data-meta=present")
  assert.equal(full.props["data-tab"], "b", "根 data-tab = 活动标签键")
  assert.deepEqual(
    full.children.map((node) => node.props["data-field"]),
    ["provider", "model", "effort", "engineering", "autoApprove"],
    "字段序 = 槽序（供给键序为逆序 ⇒ 不随供给）",
  )
  // 就地可改三值（UI.md §1 批 B 注项 1）：控形 = `select`（零 handler ⇒ 未接线通则 = disabled）；候选面缺 ⇒ 选项仅现值（禁假造）
  const pickFields = ["provider", "model", "effort"]
  const picks = full.children.slice(0, 3).map((node) => node.children[0])
  assert.deepEqual(picks.map((node) => node.tag), ["select", "select", "select"], "三值控形 = 原生 `select`")
  assert.deepEqual(picks.map((node) => node.props.class), ["head-pick", "head-pick", "head-pick"], "控件类名 = `head-pick`（三值同形）")
  assert.deepEqual(picks.map((node) => node.props["aria-label"]), pickFields.map((name) => t(`head.field.${name}`)), "隐蔽标签 = 词表键（逐字段锚名）")
  assert.deepEqual(picks.map((node) => node.props.disabled), [true, true, true], "零 handler ⇒ 三控件 disabled（未接线通则）")
  assert.deepEqual(
    picks.map((node) => node.children.filter((option) => option.props.selected === true).map((option) => option.props.value)),
    [["P"], ["M"], ["high"]],
    "现选值 = 供给串逐字（落 `selected` 项）",
  )
  assert.deepEqual(
    picks.map((node) => node.children.map((option) => option.props.value)),
    [["P"], ["M"], ["", "high"]],
    "选项集 = 候选 ∪ {现值}（禁吞）；档位面候选缺 ⇒ Auto（空串）+ 现值",
  )
  assert.deepEqual(full.children.slice(3).map((node) => node.children[0]), ["on", "off"], "工程模式 / AUTO 两位不在本项 ⇒ 文本原样（数据面非词表）")

  const partial = headTree(headModel({ tab: "b", meta: { provider: "P", effort: "", autoApprove: 3 } }))
  assert.deepEqual(partial.children.map((node) => node.props["data-field"]), ["provider"], "空串 / 非串 ⇒ 零节点（只落给到的非空串）")
  assert.equal(partial.props["data-meta"], "present", "部分供给 ⇒ present（闸 = 至少一字段）")
})

// ─── U49b 会话头薄挂载（供给取面 = 本行 · 落点面走假 DOM）──────────────────

test("U49b: 会话头薄挂载（供给面 = `sessionMeta[activeTab]` —— 整表非一份供给 · 落点实读）", () => {
  // ① 取面单源（两处同用：本档 `mountHead` + `renderer/mount-head.mjs` —— 头面供给取面不出二源）
  const table = { a: { model: "M-a" }, b: { provider: "P", model: "M" } }
  assert.deepEqual(sessionMetaOf({ activeTab: "b", sessionMeta: table }), { provider: "P", model: "M" }, "取本行供给（表 + 活动键）")
  assert.equal(sessionMetaOf({ activeTab: "c", sessionMeta: table }), null, "本键缺 ⇒ null")
  assert.equal(sessionMetaOf({ activeTab: null, sessionMeta: table }), null, "无活动标签 ⇒ null")
  assert.equal(sessionMetaOf({ activeTab: "a" }), null, "表缺 ⇒ null")
  assert.equal(sessionMetaOf({ activeTab: "a", sessionMeta: null }), null, "表置 null ⇒ null")
  assert.equal(sessionMetaOf(), null, "空参 ⇒ null（零抛）")
  assert.deepEqual(headModel({ tab: "b", meta: table }).fields, [], "对照臂：整表当一份供给 ⇒ 零字段（旧径 = 头恒 data-meta=none）")

  // ② 落点（假 DOM）：本行两字段控件落点 ∧ 宿主槽位零改 ∧ 零宿主早返径
  assert.equal(selfCheck(), true, "假 DOM 载体自检（选择器闭集 / 锚缺抛 / 写计三档 —— 载体自身不静默失效）")
  const fake = installFakeDom()
  try {
    const root = fake.element("div")
    root.setAttribute("data-slot", "session-head")
    const model = mountHead(root, { activeTab: "b", sessionMeta: table })
    assert.deepEqual(model.fields.map((field) => field.name), ["provider", "model", "effort"], "字段面 = 本行供给（非整表）—— 有 `model` ⇒ 档位面恒在（Auto）")
    assert.equal(root.getAttribute("data-slot"), "session-head", "宿主 data-slot 保留（槽位零改）")
    assert.deepEqual(
      [root.querySelector('[data-field="provider"]'), root.querySelector('[data-field="model"]')].map((node) => node?.children[0]?.tag),
      ["select", "select"],
      "本行两字段控件落点（假 DOM 实读 —— 数据面读数）",
    )
    assert.equal(root.querySelector('[data-field="effort"]')?.children[0]?.tag, "select", "档位面恒在（有 `model` ⇒ Auto 默认，与 U49 判据同源）")
    assert.equal(mountHead(null, { activeTab: "b", sessionMeta: table }), null, "零宿主 ⇒ 早返 null（不抛）")
  } finally {
    fake.restore()
  }
})

// ─── U158 状态行出档与段表（R3a · T-DSK33 原址补例）────────────

test("U158: 状态行出档面（槽锚两向 · 单点重建不落 app.mjs · 承载 12 段表）", () => {
  const html = readFileSync(new URL("../renderer/index.html", import.meta.url), "utf8")
  const app = readFileSync(new URL("../renderer/app.mjs", import.meta.url), "utf8")
  const mount = readFileSync(new URL("../renderer/mount-status.mjs", import.meta.url), "utf8")
  assert.ok(html.includes('data-slot="status"'), "骨架容器锚在位（窗口级底行 —— UI.md §1 状态栏行）")
  assert.ok(mount.includes('STATUS_SLOT = \'[data-slot="status"]\''), "槽锚常量与骨架属性同值（两向锁 —— 状态行族出档）")
  assert.ok(app.includes("attachStatus()") && app.includes("paintStatus(state)"), "接线 = 出档装配 + 订阅派发（`STATUS_KEYS` 面）")
  assert.equal(app.includes("mountStatus("), false, "状态行挂载不落 app.mjs（单点重建归状态行族档）")
  assert.equal(STATUS_SEGMENTS.length, 12, "承载 12 段（D17 计数 —— 旁置 2 / 不适用 1 与逐段判据住 `test/views-statusline.test.mjs`）")
})
// ─── U118 输入区构树与两态锚（批 A · T-DSK22 / T-DSK23）──────────────

test("U118: 输入区构树（两态锚 / 满队提示行 / 键位接线两态 ∧ 零乐观写）", () => {
  const wired = { onKeyDown: () => {}, onInterrupt: () => {} }
  const ready = composerTree(composerModel({ activeSession: "1", pool: { queue: [] } }), wired)
  assert.equal(ready.props.class, "composer", "根 = 输入区容器（宿主槽内）")
  assert.equal(ready.props["data-state"], "ready", "有活动会话 ⇒ 可用态（两态锚）")
  assert.equal(ready.children.length, 2, "可用态子序 = [输入框, 中断键]（非满队 ⇒ 提示行零节点）")
  const [input, stop] = ready.children
  assert.equal(input.tag, "textarea", "输入面 = 多行输入（Enter 发送 / Shift+Enter 换行）")
  assert.equal(input.props["data-input"], "text", "输入框标在位（复填 / 焦点还原判据同源）")
  assert.equal(input.props["aria-label"], t("composer.input"), "输入框词面 = 词表键（隐蔽标签）")
  assert.equal(typeof input.props.onKeyDown, "function", "可用态 ⇒ 键位接线在位")
  assert.equal(input.props.disabled, undefined, "可用态 ⇒ 输入框零 disabled")
  assert.equal(stop.props["data-action"], "msg:interrupt", "中断出口 = 通道动作字")
  assert.equal(typeof stop.props.onClick, "function", "可用态 ⇒ 中断键接线（零乐观写：出口只发通道）")
  assert.equal(stop.children[0], t("composer.interrupt"), "中断控件可见词 = 词表键")

  const idle = composerTree(composerModel({ activeSession: null, pool: { queue: [] } }), wired)
  assert.equal(idle.props["data-state"], "none", "无活动会话 ⇒ 两态锚 none（锚恒在）")
  assert.equal(idle.children.length, 2, "两态子序同形（控件零隐藏）")
  assert.equal(idle.children[0].props.disabled, true, "无会话 ⇒ 输入框 disabled（可用闸）")
  assert.equal(idle.children[0].props.onKeyDown, undefined, "无会话 ⇒ 零键位接线")
  assert.equal(idle.children[1].props.disabled, true, "无会话 ⇒ 中断键 disabled（`wire` 缺句柄径——零隐藏）")
  assert.equal(idle.children[1].props.onClick, undefined, "无会话 ⇒ 零中断接线（零 IPC）")
  assert.equal(composerTree(composerModel({ activeSession: "1" }), {}).children[0].props.disabled, true, "接线面句柄缺 ⇒ 输入框 disabled（未接线通则）")

  const queued = Array.from({ length: QUEUE_MAX }, () => ({ title: "队列一", status: "queued" }))
  assert.equal(composerModel({ activeSession: "1", pool: { queue: queued } }).full, true, "满队 ⇒ 派生读数真（队退回上限下 ⇒ 自动退场 · 零本地提示态）")
  const full = composerTree(composerModel({ activeSession: "1", pool: { queue: queued } }), wired)
  assert.equal(full.children.length, 3, "满队 ⇒ 提示行 + 两控件（子序 = [提示行, 输入框, 中断键]）")
  assert.equal(full.children[0].props["data-notice"], "queue-full", "提示行锚 = 满队")
  assert.equal(full.children[0].children[0], t("composer.queue.full"), "提示词出自词表键（T-DSK23）")

  // 末条复制控件（批 B ④ · 本舱增）：带 `assistant` 块 ⇒ 控件居尾（[输入框, 中断键, 复制]）；取文源 = 末 `assistant` 块
  const blocks = [{ kind: "assistant", id: "a1", text: "正文-a1" }]
  const copying = composerTree(composerModel({ activeSession: "1", blocks, pool: { queue: [] } }), { ...wired, writeText: () => {} })
  assert.deepEqual(copying.children.map((node) => node.tag), ["textarea", "button", "button"], "末条复制控件居尾（子序 = [输入框, 中断键, 复制]）")
  const copy = copying.children[2]
  assert.equal(copy.props["data-action"], "chat:last", "控件机读锚 = `chat:last`（窄刷选择器同源）")
  assert.equal(copy.props["aria-label"], t("chat.action.copyLast"), "可及名 = 词表键")
  assert.equal(typeof copy.props.onClick, "function", "`writeText` 给 ⇒ 落 `onClick`")
  assert.equal("disabled" in copy.props, false, "`writeText` 给 ⇒ 不落 `disabled`")
  assert.equal(copying.children[0].props.disabled, undefined, "复制控件不与输入框抢 disabled 判据（两态各自成对）")
  const noWriter = composerTree(composerModel({ activeSession: "1", blocks, pool: { queue: [] } }), wired)
  assert.equal(noWriter.children[2].props.disabled, true, "缺 `writeText` ⇒ `disabled`（诚实非死控）")
  assert.equal(
    composerTree(composerModel({ activeSession: "1", pool: { queue: [] } }), wired).children.length,
    2,
    "无 `assistant` 块 ⇒ 零复制控件（禁假造）",
  )
  assert.equal(
    composerTree(composerModel({ activeSession: "1", blocks: [{ kind: "assistant", id: "a1", text: "" }], pool: { queue: [] } }), wired).children.length,
    2,
    "块文本空 ⇒ 同零控件（取文面 = 空 ⇒ 无物可拷）",
  )
})

// ─── U119 输入区挂载/接线面（批 A · §1.3 判据②「DOM 槽 + handlers 接线」两半）─────────────

test("U119: 挂载/接线面（attach 零抛 · 句柄表形 · 槽锚两向与落点 · flush 在飞卫兵）", async () => {
  const state = () => ({ activeSession: "1", pool: { queue: [{ title: "第一条", status: "queued" }] }, blocks: [] })
  const store = { get: state, set: () => {}, subscribe: () => () => {} }

  // ① 挂载径零抛 + 接线面句柄表在位（平 node：`document` 缺 ⇒ 薄挂载早返径）
  const attached = attachComposer({ invoke: async () => ({ ok: true }) }, { store })
  for (const name of ["onInput", "onKeyDown", "onInterrupt"]) {
    assert.equal(typeof attached.handlers?.[name], "function", `接线面句柄表含 ${name}`)
  }
  assert.deepEqual(attached.keys, ["activeSession", "pool", "locale", "blocks"], "重绘触发切片面（批 B ⑧ +`blocks`：末条复制控件取文源）")
  attached.detach()

  // ② 槽锚两向（骨架属性 ↔ 常量声明同值）+ 落点（`.session` 内 · 对话流之后）
  const html = readFileSync(new URL("../renderer/index.html", import.meta.url), "utf8")
  assert.equal(COMPOSER_SLOT, '[data-slot="composer"]', "常量与骨架属性同值（两向锁）")
  const flowAt = html.indexOf('data-slot="flow"')
  const composerAt = html.indexOf('data-slot="composer"')
  assert.ok(flowAt >= 0, "index.html 承载对话流容器锚（序断言的对照臂 —— 缺则序断言真空）")
  assert.ok(composerAt >= 0, "index.html 承载输入区容器锚")
  assert.ok(flowAt < composerAt, "落点 = 对话流之后（UI.md §1 输入区行）")

  // ③ flush 在飞卫兵（交叠刻本刻零动作 —— 余者待下一回合尾；防同条双发 / 连摘两条）
  let release = null
  const host = { invoke: () => new Promise((resolve) => { release = resolve }) }
  const inFlight = flushTurnTail({ store, host })
  assert.equal(await flushTurnTail({ store, host }), false, "交叠刻零动作（一次一条）")
  release({ ok: true })
  assert.equal(await inFlight, true, "在飞者照常发出")
})

// ─── U126 输入区组字门（批 A · §1.16㈢ 第 1 项 · IME 小修；判据单源 = `docs/desktop/design/UI.md` §1 交互行）──

test("U126: 组字期 Enter 零发送 / 零 preventDefault / 草稿保留 → 组字结束再 Enter 照常发送（不粘滞）", async () => {
  const calls = []
  const host = { invoke: async (channel, payload) => { calls.push({ channel, payload }); return { ok: true } } }
  const store = { get: () => ({ activeSession: "1", pool: { queue: [] }, blocks: [] }), set: () => {}, subscribe: () => () => {} }
  const attached = attachComposer(host, { store })
  const flush = () => new Promise((resolve) => setImmediate(resolve))
  /** 假 Enter（**不带 `target`** ⇒ 走草稿回退径 —— 兼作草稿保留的旁证：末发文本 = 组字期键入原文）。
   *  平 node（零 DOM）⇒ 组字期以事件标志模拟；本档实现无组字状态机（判据 = 事件标志）⇒「不粘滞」由零持久态保证。 */
  const press = (over = {}) => {
    const event = { key: "Enter", preventDefault: () => { event.prevented = true }, ...over }
    attached.handlers.onKeyDown(event)
    return event
  }

  attached.handlers.onInput({ target: { value: "组合中文字" } })

  // ① 组字期 Enter（标准形 `isComposing`）⇒ 零发送 ∧ 零 preventDefault（键归输入法）
  const composing = press({ isComposing: true })
  await flush()
  assert.equal(calls.length, 0, "组字期 Enter 零 IPC（零 `msg:send`）")
  assert.equal(composing.prevented, undefined, "组字期 Enter 不 preventDefault")

  // ② 兜底臂（老 WebView 不置 `isComposing` —— 只给 `keyCode 229`）⇒ 同径零动作
  const legacy = press({ keyCode: 229 })
  await flush()
  assert.equal(calls.length, 0, "`keyCode 229` 兜底臂同零 IPC（一条谓词两臂同径）")
  assert.equal(legacy.prevented, undefined, "`keyCode 229` 亦不 preventDefault")

  // ③ 组字期 Shift+Enter（换行键）⇒ 零动作 · 零吞键（与常态换行同 —— 零 IPC）。本臂钉的是「不吞键」不变式，
  //    **不带门的判别力**（Shift+Enter 两态下都不发送）——门的判别力由 ① ② 承载。
  const composingShift = press({ isComposing: true, shiftKey: true })
  await flush()
  assert.equal(calls.length, 0, "组字期 Shift+Enter 零动作")
  assert.equal(composingShift.prevented, undefined, "组字期 Shift+Enter 不 preventDefault")

  // ④ 组字结束 ⇒ Enter 照常发送（不粘滞）· 以组字期草稿原文发出（组字期零动作不吞文本）
  const after = press()
  await flush()
  assert.equal(after.prevented, true, "组字结束（`isComposing` 假）⇒ Enter 照常拦下（发送径）")
  assert.deepEqual(calls, [{ channel: "msg:send", payload: { key: "1", text: "组合中文字" } }], "恰一发 ∧ 文本 = 组字期键入原文")
  attached.detach()
})

// ─── U153 用户块出泡（#458 · KD-23：受理即出 / 键门零写 / 失败零块）────────────

test("U153: 用户块出泡两径（受理即出 ∧ 键门零写 ∧ 失败零块 —— 尾块形 / 引用不变 / 树面随动）", async () => {
  const ok = () => ({ ok: true })
  const face = (answer) => {
    let state = { activeSession: "1", pool: { queue: [{ title: "队首", status: "queued" }] }, blocks: [] }
    return { get: () => state, set: (next) => { state = next }, subscribe: () => () => {}, host: { invoke: (c, p) => Promise.resolve(answer(c, p)) } }
  }
  /** 树面 `user` 块节点（`div.block[data-block-kind="user"]`）：① / ③ 两判据共用。 */
  const usersOf = (blocks) => chatTree(chatModel({ activeSession: "1", blocks })).children.filter((node) => node.props?.["data-block-kind"] === "user")
  // ① 直发受理（`ok` 真 ∧ 键 = 活动会话）⇒ 尾块 = 用户块恰一枚（文本逐字）+ 树面 `data-blocks` +1
  const direct = face(ok)
  assert.equal(await submitDraft({ store: direct, host: direct.host }, "文本 A"), "sent", "受理 ⇒ sent")
  assert.deepEqual(direct.get().blocks, [{ kind: "user", text: "文本 A" }], "尾块 = { kind: 'user', text } 恰一枚（与回放块同形 —— 无 id / 无 status）")
  assert.equal(chatTree(chatModel({ activeSession: "1", blocks: direct.get().blocks })).props["data-blocks"], 1, "树面 data-blocks = 块数（恰 +1）")
  assert.deepEqual([usersOf(direct.get().blocks).length, usersOf(direct.get().blocks)[0].children[0].props["data-raw"]], [1, "文本 A"], "树面 = user 块在场 ∧ 文本逐字（R3c：原文住文本面 `data-raw` 锚 —— 渲染面经核 md）")
  // ② 键门：在飞期切走（本键 ≠ 现刻活动会话）⇒ 零写 · `blocks` 引用不变（该条由页读整置）
  const held = []
  let activeSession = "1"
  let gated = null
  const gateHost = { invoke: async () => { activeSession = "2"; return { ok: true } } }
  const gateStore = { get: () => ({ activeSession, pool: { queue: [] }, blocks: held }), set: (next) => { gated = next }, subscribe: () => () => {} }
  assert.equal(await submitDraft({ store: gateStore, host: gateHost }, "文本 B"), "sent", "受理属实（键门只拦块面写）")
  assert.equal(gated.blocks, held, "键 ≠ 活动会话 ⇒ 零写（`blocks` 引用不变）")
  // ③ 失败两径（回执假 / 抛）⇒ 零乐观块 + 树面零块（T-DSK32 ⑩「零假回合」单元同判据）
  const failed = face(() => ({ ok: false, reason: "provider-invalid" }))
  const thrown = face(() => { throw new Error("boom") })
  const kept = [failed.get().blocks, thrown.get().blocks]
  assert.equal(await submitDraft({ store: failed, host: failed.host }, "文本 C"), "kept", "回执假 ⇒ kept")
  assert.equal(await submitDraft({ store: thrown, host: thrown.host }, "文本 D"), "kept", "抛 ⇒ kept")
  assert.deepEqual([failed.get().blocks, thrown.get().blocks], kept, "两径皆零乐观块（引用不变）")
  assert.equal(usersOf(failed.get().blocks).length, 0, "失败径 ⇒ 树面零块（零假回合）")
  // ④ 回合尾 flush 同源（取文源 = 队首标题逐字）：受理 ⇒ 出队 + 用户块入流 ∥ 失败 ⇒ 留队 + 零块
  const flushed = face(ok)
  assert.equal(await flushTurnTail({ store: flushed, host: flushed.host }), true, "受理 ⇒ 发出")
  assert.deepEqual([flushed.get().blocks, flushed.get().pool.queue], [[{ kind: "user", text: "队首" }], []], "同源用户块（文本逐字）∧ 受理 ⇒ 出队（先发后出队）")
  const flushHeld = face(() => ({ ok: false, reason: "busy" }))
  assert.equal(await flushTurnTail({ store: flushHeld, host: flushHeld.host }), false, "回执假 ⇒ 零动作")
  assert.deepEqual([flushHeld.get().blocks.length, flushHeld.get().pool.queue.length], [0, 1], "失败 ⇒ 零块 ∧ 留队（原形不动）")
})
