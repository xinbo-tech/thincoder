/**
 * store.test.mjs — E-4 用例（批档 §2.5 U28–U33 + 本批新增 U56 · `docs/desktop/design/SHELL.md` §3 / `RENDERER.md` §2–§3）：
 * 状态树（变更触发订阅 / 通知期入队）+ 数据面切片（窗口 / 回填卫兵 / 跟滚 / 标签）+ 词表面（解析序）+
 * 关闭确认面（判据单源 / 置键 / 直接关 / 清键 —— `docs/desktop/design/UI.md` §1 交互行）+ 三切片定形与纯动作
 * （批 7 U75 —— 兼消费面两读数 `requestCloseTab` / `headModel`：注册后零行为变化）。
 * 纯逻辑档：零 DOM / 零 IPC / 零文件系统（渲染面无副作用面判据）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import {
  appendBlock, beginBackfill, cancelCloseTab, closeTab, confirmCloseTab, createStore, deriveTabBadge,
  endBackfill, initialState, needsCloseConfirm, openTab, requestCloseTab, returnToBottom, setFollowing,
  togglePool, visibleWindow,
} from "../renderer/store.mjs"
import { headModel, headTree } from "../renderer/views/chrome.mjs"
import { FALLBACK_LOCALE, HOST_DICT, SUPPORTED_LOCALES, initDict, locale, normalizeLocale, t } from "../renderer/i18n.mjs"
import { SUPPORTED_LOCALES as CORE_LOCALES, projectDictionary, t as coreT } from "@thincoder/core/i18n.mjs"

// ─── U28 订阅契约（等值零通知 / 变更触发 / 通知期入队不递归）──────

test("U28: set 逐键比较 ∧ 变更才通知 ∧ 通知中再 set 入队不递归", () => {
  const s = createStore()
  const seen = []
  let calls = 0
  s.subscribe((state, keys) => {
    calls += 1
    seen.push({ keys: [...keys], count: state.count })
    if (calls === 1) s.set({ count: 99 }) // 通知中再 set ⇒ 入队
  })

  s.set({ count: 1 })
  assert.equal(calls, 2, "入队后补发恰一次（不递归）")
  assert.deepEqual(seen[0], { keys: ["count"], count: 1 }, "首轮：变更键 + 变更后的态")
  assert.deepEqual(seen[1], { keys: ["count"], count: 99 }, "次轮：末次值")
  assert.equal(s.get().count, 99, "终态 = 末次 set 值")

  s.set({ count: 99 })
  assert.equal(calls, 2, "等值 ⇒ 零通知（Object.is 逐键）")
  s.set({ a: 1, b: 2 })
  assert.equal(calls, 3, "多键补丁 = 一次通知")
  assert.deepEqual(seen[2].keys, ["a", "b"], "变更键序稳定（补丁序）")

  const off = s.subscribe(() => { throw new Error("已退订，不该被调") })
  off()
  s.set({ a: 3 })
  assert.equal(s.get().a, 3, "退订后状态照常推进（零通知）")
})

// ─── U29 窗口切片（visible 引用等值 ∧ hidden = 隐藏数）───────────

test("U29: visibleWindow = 尾 limit 块（引用等值）∧ hidden = 隐藏数", () => {
  const blocks = Array.from({ length: 7 }, (_, i) => ({ id: i }))
  const cut = visibleWindow(blocks, 3)
  assert.deepEqual(cut.visible.map((b) => b.id), [4, 5, 6], "尾 3 块")
  assert.equal(cut.visible[0], blocks[4], "引用等值（切片不复制块对象）")
  assert.equal(cut.hidden, 4, "隐藏块数 = 7 - 3")
  assert.equal(cut.visible.length + cut.hidden, blocks.length, "两块互斥且完备")

  const wide = visibleWindow(blocks, 200)
  assert.equal(wide.hidden, 0, "limit > 长度 ⇒ 全显")
  assert.equal(wide.visible.length, 7)
  assert.deepEqual(visibleWindow([], 3), { visible: [], hidden: 0 }, "空树")
  assert.equal(visibleWindow(blocks, 0).hidden, 7, "limit ≤ 0 ⇒ 全隐（防御）")
})

// ─── U30 回填卫兵（有更早页 ∧ 无在途）──────────────────────────

test("U30: beginBackfill 卫兵（无更早页 / 在途 ⇒ 原引用拒）+ endBackfill 收束", () => {
  const fresh = { ...initialState(), history: { hasOlder: false, inFlight: false, page: null } }
  assert.equal(beginBackfill(fresh, { page: 100 }), fresh, "无更早页 ⇒ 拒（原引用 ⇒ 零通知）")
  assert.equal(beginBackfill(fresh).history.inFlight, false, "缺省参同拒")

  const open = { ...initialState(), history: { hasOlder: true, inFlight: false, page: null } }
  const inFlight = beginBackfill(open, { page: 100 })
  assert.equal(inFlight.history.inFlight, true, "受理 ⇒ 置在途")
  assert.deepEqual(inFlight.history.page, 100, "页量记档")
  assert.notEqual(inFlight, open, "受理 ⇒ 新态")
  assert.equal(beginBackfill(inFlight, { page: 100 }), inFlight, "在途 ⇒ 拒（重入，原引用）")

  const done = endBackfill(inFlight)
  assert.deepEqual(done.history, { hasOlder: true, inFlight: false, page: 100 }, "收束：清在途、页量与更早页留档")
  assert.equal(endBackfill(done), done, "非在途 ⇒ 原引用")
  assert.equal(beginBackfill(done, { page: 50 }).history.page, 50, "有更早页 ⇒ 重试受理（末次受理页生效）")
})

// ─── U31 跟滚（块始终落树 ∧ 药丸计数）──────────────────────────

test("U31: 停跟 ⇒ pendingNew 累加（块照落）∧ 回底 ⇒ 复跟清零", () => {
  let state = initialState()
  state = appendBlock(state, { id: 1 })
  assert.equal(state.blocks.length, 1, "跟随时段：块落树")
  assert.equal(state.pendingNew, 0, "跟随 ⇒ 不计数")

  state = setFollowing(state, false)
  assert.equal(state.following, false, "停跟")
  const a = appendBlock(state, { id: 2 })
  const b = appendBlock(a, { id: 3 })
  assert.equal(b.following, false, "停跟期间 following 不变")
  assert.equal(b.pendingNew, 2, "停跟期间累计新块")
  assert.equal(b.blocks.length, 3, "块始终落树（停跟只影响呈现面）")

  const back = returnToBottom(b)
  assert.equal(back.following, true, "回底 ⇒ 复跟")
  assert.equal(back.pendingNew, 0, "药丸清零")
  assert.equal(back.blocks.length, 3, "回底不改数据面")
  assert.equal(returnToBottom(back), back, "已在底 ∧ 零药丸 ⇒ 原引用")
  assert.equal(setFollowing(back, true), back, "等值 ⇒ 原引用")
})

// ─── U32 标签切片（去重 / 邻位接管 / 状态位）────────────────────

test("U32: openTab 去重置活动 ∧ closeTab 邻位接管 ∧ deriveTabBadge 优先序", () => {
  let s = initialState()
  s = openTab(s, "a")
  s = openTab(s, "b")
  s = openTab(s, "a")
  assert.deepEqual(s.tabs, ["a", "b"], "同键去重（序不变）")
  assert.equal(s.activeTab, "a", "已存在 ⇒ 仅置活动")

  assert.equal(closeTab(s, "a").activeTab, "b", "关活动（首位）⇒ 右邻接管")
  const tail = openTab(openTab(initialState(), "a"), "b")
  assert.equal(closeTab(tail, "b").activeTab, "a", "关末位（活动）⇒ 左邻接管")
  const twin = openTab(openTab(tail, "c"), "b")
  assert.equal(closeTab(twin, "b").activeTab, "c", "关中间位（活动）⇒ 右邻接管")
  const one = openTab(initialState(), "a")
  const closed = closeTab(one, "a")
  assert.deepEqual(closed.tabs, [], "关唯一 ⇒ 空列表")
  assert.equal(closed.activeTab, null, "关唯一（活动）⇒ activeTab = null")
  assert.equal(closeTab(tail, "a").activeTab, "b", "关非活动 ⇒ 活动键不变")
  assert.equal(closeTab(tail, "zz"), tail, "键不在列表 ⇒ 原引用")

  assert.equal(deriveTabBadge(), "idle", "缺省空集 ⇒ 空闲")
  assert.equal(deriveTabBadge(["idle", "done"]), "done")
  assert.equal(deriveTabBadge(["done", "running", "idle"]), "running")
  assert.equal(deriveTabBadge(["running", "approval", "done"]), "approval", "待审批压过运行中")
  assert.equal(deriveTabBadge(["approval"]), "approval")
})

// ─── U56 关闭确认面（判据 / 置键 / 直接关 / 清键）─────────────────

test("U56: needsCloseConfirm 判据单源 ∧ requestCloseTab 置键 / 直接关 / 原引用 ∧ 确认与取消清键", () => {
  assert.equal(needsCloseConfirm(["approval"]), true, "待审批 ⇒ 需确认")
  assert.equal(needsCloseConfirm(["approval", "done"]), true, "码集含待审批 ⇒ 需确认（不看位标优先序）")
  assert.equal(needsCloseConfirm(["running"]), true, "运行中 ⇒ 需确认")
  assert.equal(needsCloseConfirm(["done", "idle"]), false, "完成 / 空闲 ⇒ 不需确认（直接关）")
  assert.equal(needsCloseConfirm([]), false, "空集 ⇒ 假（`S1`：位标源未落时 = 直接关）")
  assert.equal(needsCloseConfirm(undefined), false, "非数组 ⇒ 假（状态面缺省防御）")
  assert.equal(needsCloseConfirm("approval"), false, "串非码集 ⇒ 假（不猜测）")

  const base = openTab(openTab(initialState(), "a"), "b")
  assert.equal(base.activeTab, "b", "夹具：活动键 = b")

  const pending = requestCloseTab(base, "b", ["running"])
  assert.equal(pending.pendingClose, "b", "需确认 ⇒ 置待确认键 = 本键")
  assert.deepEqual(pending.tabs, ["a", "b"], "置键不动标签列表（确认面重挂触发）")
  assert.equal(pending.activeTab, "b", "置键不动活动键")
  assert.equal(requestCloseTab(pending, "b", ["approval"]), pending, "同键已待确认 ⇒ 原引用（无变化零通知）")

  const direct = requestCloseTab(base, "b", ["done"])
  assert.equal(direct.pendingClose, null, "不需确认 ⇒ 零待确认键")
  assert.deepEqual(direct.tabs, ["a"], "不需确认 ⇒ 直接关（守卫内化，调用面零分支）")
  assert.equal(direct.activeTab, "a", "直接关继承 closeTab 邻位接管律")
  assert.deepEqual(direct, closeTab(base, "b"), "直接关与 closeTab 等值（判据单源）")

  assert.equal(requestCloseTab(base, "zz", ["approval"]), base, "键不在列表 ⇒ 原引用（拒）")
  assert.equal(confirmCloseTab(base), base, "无待确认 ⇒ 确认键原引用")
  assert.equal(cancelCloseTab(base), base, "无待确认 ⇒ 取消键原引用")

  const confirmed = confirmCloseTab(pending)
  assert.equal(confirmed.pendingClose, null, "确认 ⇒ 清键")
  assert.deepEqual(confirmed.tabs, ["a"], "确认 ⇒ 关该键")
  assert.equal(confirmed.activeTab, "a", "确认关闭继承 closeTab 邻位接管律")

  const cancelled = cancelCloseTab(pending)
  assert.equal(cancelled.pendingClose, null, "取消 ⇒ 清键")
  assert.deepEqual(cancelled.tabs, ["a", "b"], "取消不动标签列表")
  assert.equal(cancelled.activeTab, "b", "取消不动活动键")
  assert.notEqual(cancelled, pending, "取消 = 新态（键确实变过）")
})

// ─── U28b 通知循环异常面（监听器抛错不堵死派发）──────────────────

test("U28b: 监听器抛错不吞其余监听器 ∧ 不堵死后续派发", () => {
  const s = createStore()
  let calls = 0
  s.subscribe(() => { throw new Error("boom") })
  s.subscribe(() => { calls += 1 })
  s.set({ locale: "zh" })
  assert.equal(calls, 1, "抛错监听器不影响同轮其余监听器")
  s.set({ locale: "en" })
  assert.equal(calls, 2, "抛错后仍派发（draining 复位 ⇒ 变更不入队滞留）")
})

// ─── U33 词表（解析序 + 语言归一）──────────────────────────────

test("U33: t 解析序（宿主 → 核投影 → 键名）∧ 语言归一 ⇒ en", () => {
  assert.deepEqual([...SUPPORTED_LOCALES], [...CORE_LOCALES], "语言值域 == 核 SUPPORTED_LOCALES（单源）")
  assert.deepEqual(Object.keys(HOST_DICT), [...SUPPORTED_LOCALES], "宿主表两语齐备（值域覆全）")
  assert.equal(Object.keys(HOST_DICT.en).length, Object.keys(HOST_DICT.zh).length, "两语宿主键集相等（⑥）")
  assert.ok(Object.isFrozen(HOST_DICT), "宿主表冻结（增键须改档 ⇒ 两语同增）")
  assert.equal(FALLBACK_LOCALE, "en")

  initDict({}) // 复位：核投影空 ∧ 宿主缺省表空
  assert.equal(t("nope"), "nope", "① 未初始化 / 缺键：回落键名，不抛、不空")

  const dict = { ...projectDictionary("zh"), greet: "你好 ${name}", plain: 3 }
  initDict({ locale: "zh", dict })
  assert.equal(locale(), "zh", "语言置位（归一后）")
  assert.equal(t("compress.start", { n: 3 }), coreT("compress.start", { n: 3 }, "zh"), "② 核投影带参渲染 == 核 t 输出（`${name}` 形 · 单源）")
  assert.equal(t("greet", { name: "世界" }), "你好 世界", "插值命中（`${name}`）")
  assert.equal(t("greet"), "你好 ${name}", "缺参 ⇒ 占位原样保留")
  assert.equal(t("greet", { other: 1 }), "你好 ${name}", "参不匹配 ⇒ 占位原样保留")
  assert.equal(t("plain"), "plain", "非串值 ⇒ 按缺键回落键名")
  assert.equal(t("missing"), "missing", "③ 缺键回落键名")
  initDict({ locale: "zh", dict: projectDictionary("zh"), host: { "compress.starting": "宿主键" } })
  assert.equal(t("compress.starting"), "宿主键", "④ 宿主键优先于核投影")
  assert.equal(t("missing"), "missing", "宿主表缺键 ⇒ 仍回落键名")

  assert.equal(initDict({ locale: "fr" }), "en", "⑤ 未知语言 ⇒ en")
  assert.equal(locale(), "en", "归一后读数")
  assert.equal(normalizeLocale(undefined), "en", "缺值 ⇒ en")
  assert.equal(normalizeLocale(7), "en", "非串 ⇒ en")
  assert.equal(normalizeLocale("zh"), "zh", "合法值原样")
  assert.equal(normalizeLocale("zh-CN"), "zh", "BCP-47 ⇒ 基语言（核同形 · `thincoder-core/i18n.mjs:79-80`）")
  assert.equal(normalizeLocale("  zh  "), "zh", "首尾空白裁掉（核同形）")
  assert.equal(initDict({ locale: "zh-CN" }), "zh", "BCP-47 置位 ⇒ 基语言（供受面与词面同归一）")
  assert.equal(locale(), "zh", "BCP-47 归一后读数")
  assert.equal(initDict({ locale: "  " }), "en", "全空白 ⇒ en")
  assert.equal(t("hello"), "hello", "置位清空核投影 ⇒ 回落键名（无线存）")
})

// ─── U75 三切片定形与纯动作（批 7 · 批档 §2.2（e））──────────────

test("U75: initialState 切片定形 ∧ pool 三族两读数 ∧ togglePool 三支 ∧ 注册后零行为变化", () => {
  const base = initialState()
  assert.deepEqual(Object.keys(base).sort(), [
    "activeSession", "activeTab", "blocks", "following", "history", "locale", "pendingClose", "pendingNew",
    "pool", "poolCollapsed", "project", "projectInfo", "sessionMeta", "sessions", "settings", "tabBadges", "tabs",
  ], "初态键集 = 定形锁（三切片 + settings / projectInfo 在册 —— 增 / 减键须同改本锁）")
  assert.deepEqual(base.pool, { running: 0, approval: 0, blocks: [], queue: [], approvals: [] }, "pool 形 = 两读数（折叠头）+ 三族 + 待决项数组（卡面与池面同一源）")
  assert.deepEqual(base.tabBadges, {}, "tabBadges 槽位在册（位标源随供给批）")
  assert.deepEqual(base.sessionMeta, {}, "sessionMeta 槽位在册（会话头字段源随供给批）")
  assert.deepEqual(base.poolCollapsed, {}, "poolCollapsed 槽位在册（折叠态按会话记忆）")

  const fresh = initialState()
  const hit = togglePool({ ...fresh, poolCollapsed: { "1": false, "2": true } }, "2")
  assert.equal(hit.poolCollapsed["2"], false, "命中（现值 true）⇒ 翻转")
  assert.equal(hit.poolCollapsed["1"], false, "未触及的会话键零改")
  assert.equal(togglePool({ ...fresh, poolCollapsed: { "1": false } }, "1").poolCollapsed["1"], true, "命中（现值 false）⇒ 翻回")
  assert.notEqual(hit.poolCollapsed, fresh.poolCollapsed, "命中 ⇒ 切片新对象（引用等值可作短路判据）")
  assert.deepEqual(fresh.poolCollapsed, {}, "纯动作：原态零改")

  const absent = togglePool(fresh, "1")
  assert.notEqual(absent, fresh, "缺键 ⇒ 新态（首击折叠可达 —— 非原引用）")
  assert.equal(absent.poolCollapsed["1"], true, "缺键 ⇒ 落 true（首击折叠，无需先写槽）")

  for (const bad of [7, undefined, null, ["1"]]) {
    assert.equal(togglePool(absent, bad), absent, `非串键 ⇒ 原引用（实 = ${JSON.stringify(bad) ?? "undefined"}）`)
  }

  // 注册后零行为变化（消费面两读数逐字复现 —— `app.mjs:183` / `chrome.mjs:56`）
  const pre = initialState()
  for (const key of ["tabBadges", "sessionMeta", "poolCollapsed"]) delete pre[key] // 注册前形（三切片缺位）
  const before = openTab(openTab(pre, "a"), "b")
  const after = openTab(openTab(base, "a"), "b")
  assert.deepEqual(after.tabs, before.tabs, "夹具：两态同标签")

  const beforeClose = requestCloseTab(before, "b", before.tabBadges?.["b"] ?? [])
  const afterClose = requestCloseTab(after, "b", after.tabBadges?.["b"] ?? [])
  assert.equal(afterClose.pendingClose, null, "位标源空 ⇒ 直接关（S1：零待确认）")
  assert.equal(afterClose.pendingClose, beforeClose.pendingClose, "关闭判据两态同果（零行为变化）")
  assert.deepEqual(afterClose.tabs, beforeClose.tabs, "关后标签表同值")
  assert.equal(afterClose.activeTab, beforeClose.activeTab, "邻位接管同值")

  const beforeHead = headTree(headModel({ tab: before.activeTab ?? null, meta: before.sessionMeta ?? null }))
  const afterHead = headTree(headModel({ tab: after.activeTab ?? null, meta: after.sessionMeta ?? null }))
  assert.equal(afterHead.props["data-meta"], "none", "会话头字段源空 ⇒ data-meta=none（不变）")
  assert.deepEqual(afterHead, beforeHead, "会话头树两态同形（零行为变化）")
})
