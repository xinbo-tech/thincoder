/**
 * views-onboarding.test.mjs — T-DSK13 首启向导视图面用例（`docs/desktop/design/PROJECT.md:245` 指派面 =「三步形态
 * 与闸」）：① 闸两向 ∧ 一容器两树互斥 ∧ 退场清容器（`configured === false` ⇒ 向导占槽；闸未定 / 已配 ⇒ 向导不进；
 * 占槽期开设置面 ⇒ 闸优先）；② 三步走完（步 1 零输入保存走核 `provider:save` · 导航零写盘 · 目录出口正 / 负两路 · 收尾复读闸三臂 · 「完成」提前收尾路）；③ 步锚闭集
 * （步标三在场 + 当前标单点 · 退场锚逐字 `settings:close` · 尾控件两形 · 缺 handlers ⇒ disabled）+ 步 1
 * `settings:verify` 缺名自读现选两向（槽内预设现值 ⇒ 携名 / 现选缺 ⇒ 零发送 + 失败出词）。
 * 纪律：假 DOM 房屋样式（`selfCheck` 先行 —— 载体不自证即假绿源）+ 词面哨兵缝（树内文本判键面）；零 CJK 源面与
 * 词表键齐两面归 `test/views-chrome.test.mjs` U51 ⇒ 本档不重复实现同规则（单源）；夹具 = `test/views-harness.mjs`。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { t } from "../renderer/i18n.mjs"
import { STEPS, wizardModel, wizardTree } from "../renderer/views/onboarding.mjs"
import { patchSettings } from "../renderer/store.mjs"
import { clickOn, mountFace, nodes, stateOf, supplyFace, texts, useSentinels } from "./views-harness.mjs"

/** 闸未过档（`configured === false` + 步 / 退场旗显式落位）—— 每用例独立引用（零跨例污染）。 */
const gate = (over = {}) => stateOf({ configured: false, wizard: { step: 1, dismissed: false, notice: null }, ...over })
const anyHandlers = new Proxy({}, { get: () => () => {} })
const drain = () => new Promise((resolve) => setImmediate(resolve))
const actionsOf = (tree) => nodes(tree).filter((node) => node.props?.["data-action"] !== undefined)
const disabledOf = (tree) => actionsOf(tree).filter((node) => node.props.disabled === true).map((node) => node.props["data-action"]).sort()
/** 读通道全集（挂载面自持：四段读数 + 信息行两读 + 收尾闸）—— 写通道出集即红。 */
const READS = ["provider:list", "model:list", "settings:agent", "mcp:list", "ledger:read", "batch:status", "config:read"]
/** 空供给（零预设 / 零已配行 ⇒ 现选缺面）—— 闸面与「自读现选缺」向共用。 */
const emptyFace = (channel) => (channel === "provider:list"
  ? { ok: true, presets: [], providers: [], active: null }
  : { ok: true })

// ─── ① 闸两向 ∧ 一容器两树互斥 ∧ 退场清容器（T-DSK13）──────────────

test("T-DSK13: 闸两向 ∧ 一容器两树互斥 ∧ 退场清容器", async (ctx) => {
  const configured = await mountFace(ctx, emptyFace, { open: false, configured: true })
  assert.equal(configured.root.getAttribute("class"), "settings", "已配 ⇒ 设置树占槽")
  assert.equal(configured.root.getAttribute("data-onboarding"), null, "向导不进（`configured === true`）")
  assert.equal(configured.root.children.length, 0, "设置面未开 ⇒ 零子节点（退场 = 容器清空，非 `hidden`）")
  const unknown = await mountFace(ctx, emptyFace, { open: false, configured: null })
  assert.equal(unknown.root.getAttribute("class"), "settings", "闸未定（畸形档）⇒ 向导不进、设置面可进")
  assert.equal(unknown.root.children.length, 0, "闸未定 ⇒ 设置面未开，零子节点（退场 = 容器清空 —— 同一容器零残留）")
  const face = await mountFace(ctx, emptyFace, { open: false, configured: false })
  assert.equal(face.root.getAttribute("class"), "wizard", "未配 ⇒ 向导占槽（槽根单树 —— 互斥）")
  assert.equal(face.root.getAttribute("data-state"), "active", "占槽态 = `active`")
  assert.equal(face.root.querySelector("[data-section]"), null, "向导占槽期零设置段节点（两树互斥）")
  assert.equal(face.root.querySelector("[data-steps]").children.length, STEPS.length, "步标三在场（闭集）")
  clickOn(face.fake, face.info.querySelector('[data-action="settings:open"]'))
  await drain()
  assert.equal(face.root.getAttribute("class"), "wizard", "占槽期开设置面 ⇒ 闸优先（向导不让槽）")
  assert.equal(face.info.querySelector('[data-action="settings:open"]').getAttribute("aria-expanded"), "true", "开标志已落（信息行随动）")
  face.store.set(patchSettings(face.store.get(), { configured: true }))
  await drain()
  assert.equal(face.root.getAttribute("class"), "settings", "闸翻真 ⇒ 向导退场（订阅重绘）")
  assert.equal(face.root.querySelector("[data-steps]"), null, "退场 = 容器清空（步标零残留）")
  const back = await mountFace(ctx, emptyFace, { open: false, configured: false })
  clickOn(back.fake, back.root.querySelector('[data-action="settings:close"]'))
  await drain()
  assert.equal(back.store.get().settings.wizard.dismissed, true, "退场控件（锚名逐字 `settings:close`）⇒ 落退场旗")
  assert.equal(back.root.querySelector("[data-steps]"), null, "退场旗 ⇒ 容器清空")
  const cold = await mountFace(ctx, emptyFace, { open: false, configured: false })
  assert.equal(cold.root.getAttribute("data-state"), "active", "旗随会话走 ⇒ 新挂载（冷启动同义）重新过闸")
})

// ─── ② 三步走完（T-DSK13）─────────────────────────────────────

test("T-DSK13: 三步走完（步 1 零输入保存走核 · 导航零写盘 · 目录出口正 / 负两路 · 收尾复读闸三臂 · 「完成」提前收尾路）", async (ctx) => {
  const base = supplyFace().answer
  const withGate = (receipt) => (channel, payload) => (channel === "config:read" ? receipt : base(channel, payload))
  const face = await mountFace(ctx, withGate({ ok: true, configured: true }), { open: false, configured: false })
  const stepNow = () => face.root.getAttribute("data-step")
  const stepOn = async (which = face) => { clickOn(which.fake, which.root.querySelector('[data-action="wizard:next"]')); await drain() }
  assert.equal(stepNow(), "1", "闸未过 ⇒ 步入步 1")
  assert.equal(face.root.querySelector('[data-action="settings:verify"]').getAttribute("data-name"), null, "步 1 校验控件缺名（提交端自读现选）")
  assert.notEqual(face.root.querySelector('[data-action="settings:addPreset"]'), null, "步 1 保存控件在场（写盘唯一路）")
  clickOn(face.fake, face.root.querySelector('[data-action="settings:addPreset"]'))
  await drain()
  assert.deepEqual(face.host.call("provider:save").at(-1), ["provider:save", { name: "openai", shape: "preset", preset: "openai", active: true }], "步 1 保存走核（向导侧接线 —— 同 `submitChannel` 单源；`activeDefault` ⇒ 首渠道落采用）")
  await stepOn()
  assert.equal(stepNow(), "2", "步 1 → 2（零输入）")
  assert.notEqual(face.root.querySelector('[data-model="m1"]'), null, "步入步 2 ⇒ 候选面随动（复用导出面）")
  assert.equal(face.root.querySelector('[data-action="settings:verify"]'), null, "步 2 零步 1 控件（步体闭集）")
  await stepOn()
  assert.equal(stepNow(), "3", "步 2 → 3（零输入）")
  assert.equal(face.root.querySelector('[data-action="wizard:next"]'), null, "步 3 零「下一步」（尾控件两形）")
  const pick = face.root.querySelector('[data-action="wizard:pickDir"]')
  assert.equal(pick.getAttribute("disabled"), null, "目录出口在场（链缺归提交端判 ⇒ 非死控）")
  clickOn(face.fake, pick)
  await drain()
  assert.equal(face.host.call("project:open").length, 0, "装配面链缺 ⇒ 零 IPC（不假造对话框）")
  assert.equal(face.root.querySelector("[data-notice]").textContent, t("settings.reason.invalidShape"), "失败可见（表内码出词）")
  clickOn(face.fake, face.root.querySelector('[data-action="wizard:finish"]'))
  await drain()
  assert.equal(face.store.get().settings.configured, true, "收尾 = 复读闸（`config:read`）⇒ 落槽")
  assert.equal(face.store.get().settings.wizard.dismissed, false, "已配 ⇒ 不退场旗（真收尾）")
  assert.equal(face.root.querySelector("[data-steps]"), null, "收尾 ⇒ 向导退场（容器清空）")
  const sent = [...new Set(face.host.calls.map(([name]) => name))]
  assert.deepEqual(sent.filter((name) => !READS.includes(name)), ["provider:save"], "写通道恰步 1 保存一条（导航零写盘）")
  const shortcut = await mountFace(ctx, withGate({ ok: true, configured: true }), { open: false, configured: false })
  clickOn(shortcut.fake, shortcut.root.querySelector('[data-action="wizard:finish"]'))
  await drain()
  assert.equal(shortcut.store.get().settings.configured, true, "「完成」恒在场 ⇒ 步 1 提前收尾路")
  const still = await mountFace(ctx, withGate({ ok: true, configured: false }), { open: false, configured: false })
  clickOn(still.fake, still.root.querySelector('[data-action="wizard:finish"]'))
  await drain()
  assert.equal(still.store.get().settings.configured, false, "读成功但仍未配 ⇒ 落读数（不假配）")
  assert.equal(still.store.get().settings.wizard.dismissed, true, "仍未配 ⇒ 退场旗")
  assert.equal(still.root.querySelector("[data-steps]"), null, "退场旗 ⇒ 容器清空")
  const held = await mountFace(ctx, withGate({ ok: false, reason: "unavailable" }), { open: false, configured: false })
  clickOn(held.fake, held.root.querySelector('[data-action="wizard:finish"]'))
  await drain()
  assert.equal(held.store.get().settings.wizard.dismissed, true, "仍未配 ⇒ 退场旗（会话内幂等）")
  assert.equal(held.store.get().settings.wizard.notice, "unavailable", "失败串留面（核错误串直传）")
  assert.equal(held.root.querySelector("[data-steps]"), null, "退场旗 ⇒ 容器清空")
  // 目录出口正路（装配面链注入 —— 置于末段：挂载面按全局 `document` 取槽 ⇒ 多面共存时只有末次挂载面在场）。
  let picked = 0
  const linked = await mountFace(ctx, withGate({ ok: true, configured: true }), { open: false, configured: false }, { onProjectOpened: () => { picked += 1 } })
  const readsBefore = linked.host.call("ledger:read").length
  await stepOn(linked)
  await stepOn(linked)
  clickOn(linked.fake, linked.root.querySelector('[data-action="wizard:pickDir"]'))
  await drain()
  assert.equal(picked, 1, "装配面链在场 ⇒ 目录出口走注入链（步 3 正路 —— 三步可交付）")
  assert.equal(linked.host.call("ledger:read").length, readsBefore + 1, "链回带 ⇒ 信息行两读随动（`refreshInfo`）")
  assert.equal(linked.root.querySelector("[data-notice]"), null, "成功面零失败串（清位 ⇒ 零残留）")
})

// ─── ③ 步锚闭集 ∧ 缺名自读现选两向（T-DSK13）──────────────────────

test("T-DSK13: 步锚闭集（步标 / 退场锚 / 尾控件）∧ `settings:verify` 缺名自读现选两向", async (ctx) => {
  useSentinels(ctx)
  const at = (step) => wizardTree(wizardModel(gate({ wizard: { step, dismissed: false, notice: null } })), anyHandlers)
  for (const step of [1, 2, 3]) {
    const tree = at(step)
    const [head, steps, body, notice, foot] = tree.children
    assert.equal(tree.props["data-step"], String(step), "步号锚随现步")
    assert.deepEqual(steps.children.map((mark) => mark.props["data-step-mark"]), STEPS.map((s) => s.n), "步标三在场（序固定 —— 描述符面数字，落 DOM 才成串）")
    assert.deepEqual(steps.children.filter((mark) => mark.props["data-current"] !== undefined).map((mark) => mark.props["data-step-mark"]), [step], "当前标单点")
    assert.deepEqual(steps.children.map((mark) => mark.children.join("")), STEPS.map((s) => t(s.word)), "步词 = 词表键（单源）")
    assert.equal(head.children[1].props["data-action"], "settings:close", "退场锚名逐字（锚集合闭集）")
    assert.equal(head.children[1].props["aria-label"], t("wizard.dismiss"), "退场控件零字形（词面 = 键）")
    assert.equal(notice, null, "无失败串 ⇒ 零节点")
    assert.equal(foot.children.at(-1).props["data-action"], "wizard:finish", "「完成」恒在场（提前收尾路）")
    assert.equal(foot.children.some((node) => node?.props?.["data-action"] === "wizard:next"), step < 3, "「下一步」步 1 / 2 有 · 步 3 无")
    assert.equal(body.children.some((node) => node?.props?.["data-action"] === "settings:verify"), step === 1, "校验控件只在步 1")
    assert.equal(body.children.some((node) => node?.props?.["data-form"] !== undefined), step === 1, "表单只在步 1（零输入可走完）")
    assert.equal(body.children.some((node) => node?.props?.["data-action"] === "wizard:pickDir"), step === 3, "目录出口只在步 3")
    assert.deepEqual(disabledOf(tree), [], "全出口在场 ⇒ 零 disabled")
  }
  const bare = wizardTree(wizardModel(gate()), {})
  assert.deepEqual(disabledOf(bare), ["settings:addPreset", "settings:close", "settings:verify", "wizard:finish", "wizard:next"], "缺 handlers ⇒ 全出口 disabled（非死控）")
  assert.equal(texts(bare).includes(t("wizard.title")), true, "标题 = 词表键（零字形字面）")
  const face = await mountFace(ctx, supplyFace().answer, { open: false, configured: false })
  clickOn(face.fake, face.root.querySelector('[data-action="settings:verify"]'))
  await drain()
  assert.deepEqual(face.host.call("provider:verify").at(-1), ["provider:verify", { name: "openai" }], "缺名 ⇒ 自读槽内预设现值携名")
  assert.deepEqual(face.store.get().settings.verify, { kind: "ok", count: 2, reason: null }, "读数落段（向导占槽期交 `settings.verify`）")
  const empty = await mountFace(ctx, emptyFace, { open: false, configured: false })
  clickOn(empty.fake, empty.root.querySelector('[data-action="settings:verify"]'))
  await drain()
  assert.equal(empty.host.call("provider:verify").length, 0, "现选缺 ⇒ 零发送（零乐观校验）")
  assert.equal(empty.root.querySelector("[data-notice]").textContent, t("settings.reason.invalidShape"), "失败可见（表内码出词）")
})
