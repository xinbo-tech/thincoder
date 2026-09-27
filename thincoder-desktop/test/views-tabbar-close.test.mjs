/**
 * views-tabbar-close.test.mjs — 标签条关闭面用例（批 A 自 `test/views-tabbar.test.mjs` 拆出 ·
 * `docs/desktop/design/UI.md` §1 标签条行 / 交互行 · `docs/desktop/design/PROJECT.md` §7 批 A 注）：两族 ——
 * ① **确认面族（U55）**：关闭确认面两态两键（命中项 `data-confirm="1"` + 子序 [标签, 取消, 确认]）/ 四禁靶
 * （`window.confirm` / `<dialog>` / 超时自动消 / `window.prompt`）；② **页随动族（U120 五例 · `docs/desktop/design/PROJECT.md`:277
 * T-DSK26）+ 删除出口同源（U121 · 批档 §2.4 ⑥ 第四点）**。用例号：U55 = 册内号；**U120 / U121 = 本档自铸**
 * （原册至 U119 · 披露入批次档 §5）。
 * 页随动族驱动面 = 接线档 `renderer/mount-sessions.mjs`（真 `requestClose` / `confirmClose` / `cancelClose` /
 * `activateSession` / `deleteSession` / `confirmDelete`）+ 窄桥替身（`test/views-harness.mjs` `bridge`）—— 该档**模块级**读
 * `globalThis.thincoder` ⇒ 装桥在前、动态 import 在后；判据 = store 切片（**引用等值**判零写）+ 中区模型（`chatModel` / `chatTree`）。
 * 纪律：两族皆**不触 DOM**（确认面族只读源 + 调纯函数 `tabbarModel` / `tabbarTree`；页随动族调接线面 —— 挂载 / 真点按归人工走查）；
 * 夹具 = `test/views-harness.mjs`（树遍历 / 全键暗哨 —— 同规则不重复实现；夹具 `walk` = **后序**（先子后父），
 * 与同族档 `test/views-tabbar.test.mjs` 的私有**前序**副本不同 —— 两式皆保 sibling 序，本档断言须序无关）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { bridge, nodes, sentinel, useSentinels } from "./views-harness.mjs"
import { tabbarModel, tabbarTree } from "../renderer/views/tabbar.mjs"
import { chatModel, chatTree } from "../renderer/views/chat.mjs"
import { initialState, store } from "../renderer/store.mjs"

/** 标签节点集（序 = 树序 = 标签序）。 */
const tabItems = (tree) => nodes(tree).filter((node) => node.props?.class === "tabbar-item")

/** 载荷行夹具（字段集 = 批档 §2.4（e））—— 只为命中断言取标题，字段集不完整无关。 */
const row = (slot, over = {}) => ({
  slot, title: `标题${slot}`, createdBy: "desktop", updatedAt: 1, messageCount: 0, isActive: false, ...over,
})

/** 剥注释（块 / 行 / HTML）—— 机检看声明点，注释面不假计（与 `test/views.test.mjs` 同式）。 */
function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^[ \t]*\/\/.*$/gm, "")
    .replace(/<!--[\s\S]*?-->/g, "")
}

// ─── U55 关闭确认面（两态 × 两键 · 批档 §2.12 第 8 条）──────────────

test("U55: 关闭确认面（命中 ⇒ 标签项 data-confirm ∧ 子序 [标签, 取消, 确认] ∧ 未命中 ⇒ 常态关闭控件）", (ctx) => {
  useSentinels(ctx)
  const input = { tabs: ["a", "b"], activeTab: "b", rows: [row(1), row(2)], pendingClose: "b" }
  const tree = tabbarTree(tabbarModel(input))
  const [other, hit] = tabItems(tree)
  assert.equal(hit.props["data-confirm"], "1", "命中键 ⇒ 标签项 data-confirm=1（机读锚）")
  assert.equal(other.props["data-confirm"], undefined, "未命中键 ⇒ 无 data-confirm")
  assert.deepEqual(nodes(hit).filter((node) => node.props.tabindex === "-1"), [], "确认态例外：命中项三控免 -1（决策面须键盘可达）")
  assert.equal(nodes(other).filter((node) => node.props.tabindex === "-1").length, 2, "未命中非活动键两控件收序照旧（确认面不改标签语义）")
  assert.ok(nodes(tree).every((node) => !("inert" in node.props)), "全树零 inert（只收 Tab 序 —— KD-15）")

  const hitControls = nodes(hit).filter((node) => node.tag === "button")
  assert.deepEqual(hitControls.map((node) => node.props["data-action"]), ["tab:activate", "tab:close-cancel", "tab:close-confirm"], "命中项控制序 = [标签, 取消, 确认]")
  assert.deepEqual(hitControls.slice(1).map((node) => node.props.class), ["tabbar-cancel", "tabbar-confirm"], "两键 class 锚")
  assert.deepEqual(hitControls.slice(1).map((node) => node.children), [[sentinel("tab.action.close.cancel")], [sentinel("tab.action.close.confirm")]], "两键词面 = 文本按钮（词键值 —— 零字形）")
  assert.ok(hitControls.slice(1).every((node) => node.props["aria-label"] === undefined), "文本按钮不走 aria-label（词面即文案）")
  assert.ok(hitControls.every((node) => node.props.disabled === true), "未接线 ⇒ 三控全 disabled")
  assert.equal(nodes(tree).filter((node) => node.props?.["data-action"] === "tab:close").length, 1, "命中项关闭控件原位退出（全树关闭控件恰 1 = 未命中项）")

  // 例外判别例（非活动 ∧ 确认态）：活动命中项在**无**该例外实现下同样零 `-1` ⇒ 上面命中项那条断言不判别；
  // KD-15 例外的功能面只在此态（非活动命中项的标签控件须保自然序 ⇒ 决策面键盘可达）。
  const rest = { tabs: ["a", "b", "c"], activeTab: "b", rows: [row(1), row(2), row(3)], pendingClose: "a" }
  const [confirmItem, activeItem, plainItem] = tabItems(tabbarTree(tabbarModel(rest)))
  assert.equal(confirmItem.props["data-confirm"], "1", "非活动命中键 ⇒ 确认面（本组 = 判别例）")
  assert.deepEqual(nodes(confirmItem).filter((node) => node.props.tabindex === "-1"), [], "例外支路：非活动 ∧ 确认态 ⇒ 标签控件免 -1")
  assert.deepEqual(
    nodes(confirmItem).filter((node) => node.tag === "button").map((node) => node.props["data-action"]),
    ["tab:activate", "tab:close-cancel", "tab:close-confirm"],
    "非活动命中项控制序同形（关闭控件原位退出）",
  )
  assert.equal(nodes(plainItem).filter((node) => node.props.tabindex === "-1").length, 2, "另一非活动项（非确认态）两控件收序照旧")
  assert.equal(nodes(activeItem).filter((node) => node.props.tabindex === "-1").length, 0, "活动项零 -1（活动面照常可达）")

  const plain = tabbarTree(tabbarModel({ ...input, pendingClose: null }))
  assert.deepEqual(
    tabItems(plain).flatMap((node) => nodes(node).filter((kid) => kid.tag === "button").map((kid) => kid.props["data-action"])),
    ["tab:activate", "tab:close", "tab:activate", "tab:close"],
    "未命中态 ⇒ 零确认键（两态互斥）",
  )
  const stray = tabbarTree(tabbarModel({ ...input, pendingClose: "9" }))
  assert.equal(nodes(stray).some((node) => node.props["data-confirm"] !== undefined), false, "待确认键不在标签集 ⇒ 零确认面（只比在册键）")

  const seen = []
  const wired = tabbarTree(tabbarModel(input), {
    onActivate: (key) => seen.push(`activate:${key}`),
    onClose: (key) => seen.push(`close:${key}`),
    onCancelClose: () => seen.push("cancel"),
    onConfirmClose: () => seen.push("confirm"),
    onNew: () => seen.push("new"),
  })
  const wiredControls = nodes(wired).filter((node) => node.tag === "button")
  assert.deepEqual(
    wiredControls.map((node) => node.props["data-action"]),
    ["tab:activate", "tab:close", "tab:activate", "tab:close-cancel", "tab:close-confirm", "session:create"],
    "接线态控制序（命中项两键取代关闭控件）",
  )
  assert.ok(wiredControls.every((node) => node.props.disabled === undefined), "接线 ⇒ 无 disabled")
  wiredControls[2].props.onClick() // 命中项标签控件（键 b）
  wiredControls[3].props.onClick() // 取消
  wiredControls[4].props.onClick() // 确认
  assert.deepEqual(seen, ["activate:b", "cancel", "confirm"], "两键回代无键（判据单源 = store pendingClose）· 标签控件回代本键")

  const view = stripComments(readFileSync(new URL("../renderer/views/tabbar.mjs", import.meta.url), "utf8"))
  for (const banned of [/\bwindow\.confirm\b/, /<dialog/i, /\bsetTimeout\b/, /\bwindow\.prompt\b/]) {
    assert.ok(!banned.test(view), `确认面四禁之一落空（字形面由 U48 字面量扫描承载 —— 见同族档 views-tabbar.test.mjs）：${banned}`)
  }
})

// ─── 页随动族夹具（接线档 = `renderer/mount-sessions.mjs`；窄桥 = 共享夹具 `bridge`）──────────────────

/** 页读闸（`history:page` 受控未决 —— 构造「在飞」与「关后迟到」两况；落定 = `settle`）。 */
const gates = []

/** 可翻面回执（删除出口两态：`ok` ∥ `ok:false`）。 */
const replies = { delete: { ok: true } }

/** 窄桥替身：页读挂起（门控）· 会话路回执原值回代（键面一致）· 左列两读面空行集。 */
const host = bridge((channel, payload) => {
  if (channel === "history:page") return new Promise((resolve) => gates.push({ key: payload?.key, resolve }))
  if (channel === "project:recent") return { cwd: null, recent: [] }
  if (channel === "sessions:list") return { rows: [] }
  if (channel === "session:delete") return replies.delete
  return { ok: true, slot: Number(payload?.slot ?? 1) }
})
globalThis.thincoder = host // **先装桥后 import**：接线档模块级读本键（本档 = 该档唯一消费者）

/** 接线档实例（模块级 `globalThis.thincoder` 已被上行桥桩捕获 ⇒ 单例常驻）。 */
const rail = () => import("../renderer/mount-sessions.mjs")

/** 冲微任务：接线面链全为已决 promise ⇒ 一次 `setImmediate` 排空。 */
const flush = () => new Promise((resolve) => setImmediate(resolve))

/** 逐例复位（store 回初态 + 门 / 调用录清空 + 删除回执正面）—— 例内多臂复用（未落定页读随之作废）。 */
const reset = (over = {}) => {
  store.set(initialState())
  gates.length = 0
  host.calls.length = 0
  replies.delete = { ok: true }
  if (Object.keys(over).length > 0) store.set(over)
}

/** 落定某键的在飞页读（回执形 = `{ ok, messages, hasOlder, next, meta }` · `meta` 入 `sessionMeta`）。 */
const settle = (key, meta = {}) => {
  for (const gate of gates.filter((entry) => entry.key === key)) {
    gate.resolve({ ok: true, messages: [{ kind: "user", text: `页${key}` }], hasOlder: false, next: null, meta })
  }
}

/** 块夹具（`views/chat.mjs` 五型闭集之 `user` —— 只为「关前块零残留」的文本判据）。 */
const block = (text) => ({ kind: "user", text })

/** 屏面块的文本读数（序 = 块序）。 */
const shown = (state) => state.blocks.map((piece) => piece.text)

// ─── U120 页随动五例（T-DSK26 · `docs/desktop/design/PROJECT.md`:277）─────────────────

test("U120: 页随动五例（关活动 ⇒ 邻位页 ∕ 关唯一 ⇒ 关页 none 零节点 ∕ 关非活动 ⇒ 零动作 ∕ 待确认按取消 ⇒ 零动作 ∕ 关后迟到回执零写）", async (ctx) => {
  useSentinels(ctx)
  const mod = await rail()

  // ① 关活动（另有邻位）⇒ 邻位接管 + 屏面转邻位页（关前块零残留）
  reset({ tabs: ["1", "2"], activeTab: "1", activeSession: "1", blocks: [block("页1")] })
  mod.requestClose("1")
  await flush()
  assert.deepEqual(host.call("session:switch"), [["session:switch", { slot: 2 }]], "关活动 ⇒ 补页走激活同一路（`session:switch` 邻位键）")
  assert.equal(store.get().activeSession, "2", "activeSession = 邻位（屏面转邻位页）")
  settle("2")
  await flush()
  assert.deepEqual(store.get().tabs, ["2"], "邻位接管（优先右邻 —— store `closeTab` 律）")
  assert.equal(store.get().activeTab, "2", "活动标签 = 邻位键")
  assert.deepEqual(shown(store.get()), ["页2"], "屏面 = 邻位页（关前会话块零残留）")

  // ② 关唯一 ⇒ 关页：中区 `none` 零节点（既有空态复用）· 零 IPC
  reset({ tabs: ["1"], activeTab: "1", activeSession: "1", blocks: [block("页1")] })
  const only = store.get()
  mod.requestClose("1")
  await flush()
  const closed = store.get()
  assert.deepEqual(closed.tabs, [], "关唯一 ⇒ 标签集空")
  assert.equal(closed.activeTab, null, "关唯一 ⇒ activeTab = null")
  assert.equal(closed.activeSession, null, "关唯一 ⇒ 关页（`openSession(state, null)`）")
  assert.deepEqual(host.calls, [], "关唯一 ⇒ 零 IPC（不发 `session:switch`）")
  assert.equal(closed.blocks, only.blocks, "关页不清块（页数据随 `history:page` 回执整置 —— 既有契约）")
  const tree = chatTree(chatModel(closed))
  assert.equal(tree.props["data-state"], "none", "中区态 = none")
  assert.equal(tree.props["data-blocks"], 0, "none ⇒ 零块（不新造空态视觉）")
  assert.deepEqual(tree.children, [], "中区 none 态零节点")

  // ③ 关非活动 ⇒ 两键皆不动 · 零 IPC
  reset({ tabs: ["1", "2"], activeTab: "2", activeSession: "2", blocks: [block("页2")] })
  const rest = store.get()
  mod.requestClose("1")
  await flush()
  const kept = store.get()
  assert.deepEqual(kept.tabs, ["2"], "关非活动 ⇒ 标签集只减本键")
  assert.equal(kept.activeTab, "2", "关非活动 ⇒ activeTab 不动")
  assert.equal(kept.activeSession, "2", "关非活动 ⇒ activeSession 不动")
  assert.equal(kept.blocks, rest.blocks, "关非活动 ⇒ 页不动（引用等值）")
  assert.equal(kept.history, rest.history, "关非活动 ⇒ 历史切片不动")
  assert.deepEqual(host.calls, [], "关非活动 ⇒ 零 IPC")

  // ④ 待确认态按取消 ⇒ 零动作（页不动）—— 两段：置待确认键 · 取消
  reset({ tabs: ["1", "2"], activeTab: "1", activeSession: "1", blocks: [block("页1")], tabBadges: { "1": ["running"] } })
  const pending = store.get()
  mod.requestClose("1")
  assert.equal(store.get().pendingClose, "1", "位标码集命中 ⇒ 置待确认键（不直接关）")
  assert.equal(store.get().blocks, pending.blocks, "置待确认 ⇒ 页零动")
  assert.deepEqual(host.calls, [], "置待确认 ⇒ 零 IPC")
  mod.cancelClose()
  await flush()
  const after = store.get()
  assert.equal(after.pendingClose, null, "取消 ⇒ 清待确认键")
  assert.deepEqual(after.tabs, ["1", "2"], "取消 ⇒ 标签集不动")
  assert.equal(after.activeTab, "1", "取消 ⇒ activeTab 不动")
  assert.equal(after.activeSession, "1", "取消 ⇒ activeSession 不动")
  assert.equal(after.blocks, pending.blocks, "取消 ⇒ 页零动作")
  assert.deepEqual(host.calls, [], "取消 ⇒ 零动作（零 IPC）")

  // ⑤ 已关会话迟到的回执（关后到达）⇒ 零写 —— 页切片与 `tabs` 零动
  reset({ tabs: ["1", "2"], activeTab: "1", activeSession: "1", blocks: [block("页1")] })
  await mod.activateSession("1") // 本键首屏页读在飞（闸未开）
  assert.deepEqual(gates.map((gate) => gate.key), ["1"], "在飞页读 = 本键（关时在途）")
  store.set({ tabBadges: { "1": ["done"] } }) // 在飞期位标落本键（关闭零位标清理）
  mod.requestClose("1")
  await flush()
  settle("2")
  await flush()
  const live = store.get()
  assert.deepEqual(shown(live), ["页2"], "关后屏面 = 邻位页")
  settle("1", { model: "m-late" }) // **迟到回执**（关后到达）
  await flush()
  const late = store.get()
  assert.deepEqual(late.tabs, ["2"], "⑤ 迟到回执 ⇒ `tabs` 零动")
  assert.deepEqual(shown(late), ["页2"], "⑤ 页切片零动（早返径：键 ≠ `activeSession`）")
  assert.equal(late.blocks, live.blocks, "⑤ 页切片引用零动")
  assert.equal(late.history, live.history, "⑤ 历史切片零动")
  assert.equal(late.activeSession, "2", "⑤ 活动键零动")
  assert.deepEqual(late.sessionMeta["1"], { model: "m-late" }, "既有登记观察（非本条判据）：`sessionMeta` 仍写已关键")
  assert.deepEqual(late.tabBadges["1"], ["done"], "既有登记观察（非本条判据）：关闭零位标清理 ⇒ 已关键位标留场")

  // ⑤b 对照臂 · 同形回执在「键 = `activeSession`」时**必写**（证 ⑤ 零写非哑断言 —— 同闸 / 同落定路径）
  reset({ tabs: ["1"], activeTab: "1", activeSession: "1" })
  const control = store.get()
  await mod.activateSession("1")
  settle("1", { model: "m-live" })
  await flush()
  assert.deepEqual(shown(store.get()), ["页1"], "对照：键 = activeSession ⇒ 回执写入页切片")
  assert.deepEqual(store.get().sessionMeta["1"], { model: "m-live" }, "对照：同形 `meta` 落 `sessionMeta` 本键")
  assert.notEqual(store.get().history, control.history, "对照：历史切片已换形（回执真落 —— 非早返径）")

  // ⑥ 表外臂 · 拒收 ⇒ 零动作（同律边界 —— `closeTail` 判据 = `activeTab` 前后差）
  reset({ tabs: ["1"], activeTab: "1", activeSession: "1", blocks: [block("页1")] })
  mod.requestClose("9")
  await flush()
  assert.deepEqual(store.get().tabs, ["1"], "表外键 ⇒ 拒收（标签集不动 —— store 原引用）")
  assert.equal(store.get().activeTab, "1", "拒收 ⇒ activeTab 不动")
  assert.equal(store.get().activeSession, "1", "拒收 ⇒ 页不动")
  assert.deepEqual(host.calls, [], "拒收 ⇒ 零 IPC")

  // ⑦ 附加臂 · 确认径 = 同尾（五例未单列 —— 本档补 · 披露入批次档 §5）
  reset({ tabs: ["1", "2"], activeTab: "1", activeSession: "1", blocks: [block("页1")], tabBadges: { "1": ["approval"] } })
  mod.requestClose("1")
  assert.equal(store.get().pendingClose, "1", "命中 ⇒ 待确认面")
  mod.confirmClose()
  await flush()
  settle("2")
  await flush()
  const confirmed = store.get()
  assert.equal(confirmed.pendingClose, null, "确认 ⇒ 清待确认键")
  assert.deepEqual(confirmed.tabs, ["2"], "确认 ⇒ 关本键")
  assert.equal(confirmed.activeTab, "2", "确认 ⇒ 邻位接管")
  assert.equal(confirmed.activeSession, "2", "确认径 ⇒ 页随动同尾")
  assert.deepEqual(shown(confirmed), ["页2"], "确认径屏面 = 邻位页（关前块零残留）")
})

// ─── U121 删除出口同源（批档 §2.4 ⑥ 第四点 · 用例号本档自铸 —— 披露入批次档 §5）──────────────

test("U121: 删除出口同源（回执 `ok` ⇒ `closeTab` 本键 + 同尾页随动 ∕ `ok:false` ⇒ 零动作 —— 防死标签）", async (ctx) => {
  useSentinels(ctx)
  const mod = await rail()

  // ① 删活动键（有邻位）⇒ 关标签 + 邻位页随动
  reset({ tabs: ["1", "2"], activeTab: "1", activeSession: "1", blocks: [block("页1")], railForm: { key: "1", mode: "delete" } })
  await mod.confirmDelete("1")
  await flush()
  assert.deepEqual(host.call("session:delete"), [["session:delete", { slot: 1 }]], "出站载荷 = 槽号域（键串回代）")
  assert.deepEqual(store.get().tabs, ["2"], "`ok` ⇒ 键面 `closeTab(本键)`")
  assert.equal(store.get().activeTab, "2", "邻位接管（同源 = store `closeTab`）")
  assert.equal(store.get().railForm, null, "`ok` ⇒ 清换形态")
  settle("2")
  await flush()
  assert.equal(store.get().activeSession, "2", "页随动同尾（补页走激活同一路）")
  assert.deepEqual(shown(store.get()), ["页2"], "屏面 = 邻位页（关前块零残留）")

  // ② 回执 `ok:false`（核拒）⇒ 零动作
  reset({ tabs: ["1"], activeTab: "1", activeSession: "1", blocks: [block("页1")], railForm: { key: "1", mode: "delete" } })
  replies.delete = { ok: false, reason: "bad-key" }
  const refused = store.get()
  await mod.confirmDelete("1")
  await flush()
  assert.deepEqual(store.get().tabs, ["1"], "核拒 ⇒ 标签留场（防死标签：不造已删键开页）")
  assert.equal(store.get().activeTab, "1", "核拒 ⇒ activeTab 不动")
  assert.equal(store.get().activeSession, "1", "核拒 ⇒ 页不动")
  assert.equal(store.get().blocks, refused.blocks, "核拒 ⇒ 块切片不动")
  assert.deepEqual(store.get().railForm, { key: "1", mode: "delete" }, "核拒 ⇒ 形态留场（零动作可见面 —— 与改名失败同律）")
  assert.deepEqual(host.call("session:switch"), [], "核拒 ⇒ 零关闭尾（不发邻位切换）")

  // ③ 删唯一键 ⇒ 关页（同尾 `null` 支）
  reset({ tabs: ["1"], activeTab: "1", activeSession: "1", blocks: [block("页1")] })
  await mod.confirmDelete("1")
  await flush()
  assert.deepEqual(host.call("session:delete"), [["session:delete", { slot: 1 }]], "出站载荷 = 槽号域")
  assert.deepEqual(store.get().tabs, [], "删唯一 ⇒ 标签集空")
  assert.equal(store.get().activeTab, null, "删唯一 ⇒ activeTab = null")
  assert.equal(store.get().activeSession, null, "删唯一 ⇒ 关页（同尾 `null` 支）")
  assert.deepEqual(host.call("session:switch"), [], "关页不发 `session:switch`")
})
