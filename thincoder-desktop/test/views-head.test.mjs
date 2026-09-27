/**
 * views-head.test.mjs — 会话头接线面 + 状态栏读数面用例（批档 §2.5 测试面「读数节点两态 + 会话头三 `select` 与回执刷行」）。
 *   U147 三 `select` 候选面（`headModel` / `headTree`）：选项集 = 候选 ∪ {现值}（缺于候选 ⇒ 追加 · 禁吞 · 空名 / 空 id 滤除）· 档位 = Auto（`""`）+ off（仅 `thinkOff` 真）+ 逐模型枚举（滤 `"none"`）· 候选面缺该模型 ⇒ 仅 Auto ∪ {现值} · 两态（handler 给 ⇒ 出口；缺 ⇒ `disabled` + 零 `onChange`）· 出口形 `(字段名, 值)`。
 *   U148 写路与回执刷行（`attachHead`）：载荷恰形 `{ key, patch }` · `provider` 变更同送 `model`（新 provider 首候选）· **零乐观写** · 回执 `meta` ⇒ 切片就位（挂载面订阅处即刷本行）· 失败 / 抛 / 形缺 ⇒ 回退 + 诊断 · 表外字段 / 无活动会话 / 窄桥缺位 ⇒ 零通道 + 回退。
 *   U149 候选面随动（`sync`）：两件取件序 · 同 provider 零重取 · 落地刷行恰一次 · 二次 `sync` 幂等 · 取件失败 ⇒ 空面 + 重试 · 显式 `state` 参消费（不读单例）。
 *   U150 状态栏读数两态（`statusModel` / `statusTree` / `mountStatus`）：数字 ∧ `> 0` ⇒ 节点在场 · `>= 80` ⇒ 警示 class · 未至 / 零 / 负数 / 非数 / 无活动键 ⇒ 零节点 · 节点序 = 读数 → 告警 · 告警码两向 · 落点（假 DOM）。
 * 用例号 = 自铸 `U147–U150`（既有号段无空位：本批末位 `U146` = `test/settings.test.mjs`；沿 `U138–U141` 自铸先例）。
 * 判据面 = 纯描述符（构树面）+ `test/fake-dom.mjs`（落点面 = 描述符 → 节点那段机检）；词面走宿主表注入缝（哨兵 ⇒ 断言即证「经 `t()` 消费」），`status.usage` 另给插值模板（钉「读数入词」）；诊断串非面向用户文案（不经 `t()`）故直读录面。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { initDict, t } from "../renderer/i18n.mjs"
import { initialState, store } from "../renderer/store.mjs"
import { headModel, headTree, mountHead, mountStatus, statusModel, statusTree } from "../renderer/views/chrome.mjs"
import { attachHead } from "../renderer/mount-head.mjs"
import { installFakeDom, selfCheck } from "./fake-dom.mjs"
import { bridge, sentinel, texts } from "./views-harness.mjs"

/** 夹具：词面哨兵缝（`status.usage` 带插值模板 ⇒ 词面 + 读数双钉）/ 诊断录面 / 单例置初态（接线档唯一消费 = 模块单例
 *  `store`：域内显式置态 + 用例尾复位）/ 候选面三形（全字段 · 无 `thinkOff` · 空 id 与空枚举）。 */
function useHeadSentinels(ctx) {
  const tpl = { "status.usage": "⟦status.usage:${percent}⟧" }
  initDict({ locale: "en", host: new Proxy({}, { get: (_, key) => tpl[String(key)] ?? sentinel(String(key)) }) })
  ctx.after(() => initDict({}))
}
const wordOf = (percent) => `⟦status.usage:${percent}⟧`
function captureErrors(ctx) {
  const lines = []
  const prior = console.error
  console.error = (...args) => lines.push(args)
  ctx.after(() => { console.error = prior })
  return lines
}
function resetStore(ctx) {
  store.set(initialState())
  ctx.after(() => store.set(initialState()))
}
const FACE = {
  providers: [{ name: "p1" }, { name: "p2" }, { name: "" }, "p3"],
  models: [{ id: "m1", effortEnum: ["none", "low", "high"], thinkOff: true }, { id: "m2", effortEnum: ["low"], thinkOff: false }, { id: "", effortEnum: [] }],
}
const treeOf = (meta, handlers = {}) => headTree(headModel({ tab: "b", meta }), handlers)
const selectOf = (tree, name) => tree.children.find((node) => node.props["data-field"] === name).children[0]
const valuesOf = (node) => node.children.map((option) => option.props.value)

test("U147: 会话头三 `select` 候选面（候选 ∪ {现值} / off 两向 / `none` 滤词 / 候选缺模型 / 两态 / 落点）", (ctx) => {
  useHeadSentinels(ctx)
  const picked = []
  const live = { candidates: () => FACE, onField: (name, value) => picked.push([name, value]) }
  // ① 候选面 → 选项集（∪ {现值} · 空名 / 空 id 滤除 · 现值在候选 ⇒ 零重复）
  const plain = treeOf({ provider: "p2", model: "m1", effort: "high" }, live)
  assert.deepEqual(valuesOf(selectOf(plain, "provider")), ["p1", "p2", "p3"], "provider 选项 = 候选名（空名滤除 · 序保）")
  assert.deepEqual(valuesOf(selectOf(plain, "model")), ["m1", "m2"], "model 选项 = 候选 id（空 id 滤除）")
  assert.deepEqual(valuesOf(selectOf(plain, "effort")), ["", "off", "low", "high"], "档位 = Auto + off + 枚举（`none` 滤词 · 现值不重复）")
  assert.deepEqual(texts(selectOf(plain, "effort")), [t("effort.auto"), t("effort.off"), "low", "high"], "两特值经 `t()` · 枚举成员原样")
  assert.equal(selectOf(plain, "provider").props["aria-label"], t("head.field.provider"), "控件名经 `t()` 消费")
  // ② 档位 off 两向：`thinkOff` 假 ⇒ off 缺席；现值 `off` 仍入列（禁吞）
  const noOff = treeOf({ provider: "p2", model: "m2", effort: "off" }, live)
  assert.deepEqual(valuesOf(selectOf(noOff, "effort")), ["", "low", "off"], "`thinkOff` 假 ⇒ 零 off · 现值追加（禁吞）")
  // ③ 候选面缺该模型 ⇒ 仅 Auto ∪ {现值}；现值缺于候选 ⇒ 三面皆追加
  const orphan = treeOf({ provider: "p9", model: "m9", effort: "high" }, live)
  assert.deepEqual(valuesOf(selectOf(orphan, "provider")), ["p1", "p2", "p3", "p9"], "provider 现值缺于候选 ⇒ 追加")
  assert.deepEqual(valuesOf(selectOf(orphan, "model")), ["m1", "m2", "m9"], "model 同判据（同投影 `modelIdOf`）")
  assert.deepEqual(valuesOf(selectOf(orphan, "effort")), ["", "high"], "候选面缺该模型 ⇒ 仅 Auto ∪ {现值}（零假造）")
  // ④ 候选面缺（无 `candidates`）⇒ 三面退「仅现值」
  const bare = treeOf({ provider: "p1", model: "m1", effort: "low" }, { onField: live.onField })
  assert.deepEqual(valuesOf(selectOf(bare, "provider")), ["p1"], "候选面缺 ⇒ provider 仅现值")
  assert.deepEqual(valuesOf(selectOf(bare, "model")), ["m1"], "候选面缺 ⇒ model 仅现值")
  assert.deepEqual(valuesOf(selectOf(bare, "effort")), ["", "low"], "候选面缺 ⇒ 档位面 = Auto ∪ {现值}")
  // ⑤ 两态：handler 缺 ⇒ 禁改（`disabled` + 零 `onChange`）；handler 给 ⇒ 出口（两态互斥）
  const frozen = treeOf({ provider: "p1", model: "m1", effort: "low" })
  for (const name of ["provider", "model", "effort"]) {
    assert.equal(selectOf(frozen, name).props.disabled, true, `${name} 无出口 ⇒ 禁改`)
    assert.equal(selectOf(frozen, name).props.onChange, undefined, `${name} 零 onChange`)
  }
  assert.equal(selectOf(plain, "provider").props.disabled, undefined, "有出口 ⇒ 零 disabled")
  // ⑥ 出口形 `(字段名, 值)`；`""`（Auto）/ 非串 ⇒ 出参 `null`；`target` / `currentTarget` 两径
  selectOf(plain, "provider").props.onChange({ target: { value: "p1" } })
  assert.deepEqual(picked.at(-1), ["provider", "p1"], "出口 = (字段名, 值)")
  selectOf(plain, "effort").props.onChange({ currentTarget: { value: "" } })
  assert.deepEqual(picked.at(-1), ["effort", null], "Auto ⇒ 出参 `null`（未设）· currentTarget 径")
  selectOf(plain, "effort").props.onChange({ target: { value: "low" } })
  assert.deepEqual(picked.at(-1), ["effort", "low"], "枚举成员直送")
  selectOf(plain, "model").props.onChange({ target: { value: 42 } })
  assert.deepEqual(picked.at(-1), ["model", null], "非串 ⇒ `null`（零透传）")
  // ⑦ 落点面（假 DOM）：三 `select` 实挂 · 选项值 / 位标 / 根锚落点
  assert.equal(selfCheck(), true, "假 DOM 载体自检")
  const fake = installFakeDom()
  try {
    const root = fake.element("div")
    root.setAttribute("data-slot", "head")
    mountHead(root, { activeTab: "b", sessionMeta: { b: { provider: "p2", model: "m1", effort: "high" } } }, live)
    const selectIn = (name) => root.querySelector(`[data-field="${name}"]`).children.find((node) => node.tag === "select")
    assert.deepEqual(selectIn("effort").children.map((node) => node.getAttribute("value")), ["", "off", "low", "high"], "选项值落点（序同描述符）")
    assert.equal(selectIn("effort").children.find((node) => node.attrs.has("selected")).getAttribute("value"), "high", "位标落点")
    assert.equal(root.querySelector("[data-meta]").getAttribute("data-meta"), "present", "根锚落点 = present")
    assert.equal(root.getAttribute("data-slot"), "head", "宿主槽位零改")
    assert.equal(mountHead(null, {}), null, "零宿主 ⇒ 早返 null（不抛）")
  } finally { fake.restore() }
})

test("U148: 写路与回执刷行（provider 同送 model / 零乐观写 / 回执 meta ⇒ 切片就位 / 三径回退 + 诊断）", async (ctx) => {
  useHeadSentinels(ctx)
  const errors = captureErrors(ctx)
  resetStore(ctx)
  const KEY = "b"
  const pending = []
  let mode = "ok"
  const host = bridge((channel, payload) => {
    if (channel === "provider:list") return { ok: true, providers: [{ name: "p1" }, { name: "p2" }] }
    if (channel === "model:list") {
      if (payload?.provider === "p3") return { ok: true, models: [] }
      return { ok: true, models: [{ id: "m1", effortEnum: ["low"], thinkOff: false }, { id: "m2", effortEnum: [], thinkOff: false }] }
    }
    if (channel !== "session:prefs") return { ok: true }
    if (mode === "inFlight") return new Promise((resolve) => pending.push(resolve))
    if (mode === "fail") return { ok: false, reason: "busy" }
    if (mode === "nometa") return { ok: true }
    if (mode === "throw") throw new Error("boom")
    return { ok: true, meta: { provider: "p1", model: "m2", effort: "low" } }
  })
  const repaints = []
  const head = attachHead({ host, onRepaint: () => repaints.push(host.calls.length) })
  const writes = () => host.call("session:prefs").length
  store.set({ activeTab: KEY, sessionMeta: {} })
  // ① 未取 ⇒ 空候选面（控件退「仅现值」—— 禁假造）
  assert.deepEqual(head.candidates(), { providers: [], models: [] }, "候选面初值 = 空面（未取不假造）")
  // ② `model` 直送：载荷恰形（活动键 + 单字段 patch）；回执 `meta` ⇒ 切片就位 ⇒ 订阅组随动；成功径零自刷
  const seen = []
  ctx.after(store.subscribe((state, changedKeys) => seen.push(changedKeys)))
  await head.onField("model", "m2")
  assert.deepEqual(host.call("session:prefs").at(-1), ["session:prefs", { key: KEY, patch: { model: "m2" } }], "载荷 = 活动键 + 单字段 patch")
  assert.deepEqual(store.get().sessionMeta[KEY], { provider: "p1", model: "m2", effort: "low" }, "回执 `meta` ⇒ 外壳切片就位")
  assert.deepEqual(seen.at(-1), ["sessionMeta"], "切片随动 ⇒ 订阅组就位（挂载面订阅处即刷本行）")
  assert.equal(repaints.length, 0, "成功径零自刷（零双刷）")
  // ③ 零乐观写：在飞期 store 不动（控件值恒读现态 ⇒ 失败径即回退）
  mode = "inFlight"
  const inFlight = head.onField("model", "m1")
  await new Promise((resolve) => setImmediate(resolve))
  assert.equal(store.get().sessionMeta[KEY].model, "m2", "在飞期零乐观写（仍持回执前值）")
  pending.shift()({ ok: true, meta: { provider: "p1", model: "m1", effort: "low" } })
  await inFlight
  assert.equal(store.get().sessionMeta[KEY].model, "m1", "回执落地才换值")
  // ④ `provider` 变更 ⇒ 同送 `model` = 新 provider 首候选（核拒 `model-required` 零写）；候选按新 provider 重取
  mode = "ok"
  await head.onField("provider", "p2")
  assert.deepEqual(host.call("session:prefs").at(-1), ["session:prefs", { key: KEY, patch: { provider: "p2", model: "m1" } }], "provider 变更同送 model = 首候选")
  assert.deepEqual(host.call("model:list").at(-1), ["model:list", { provider: "p2" }], "候选按新 provider 重取（写值同投影）")
  assert.deepEqual(head.candidates().models.map((row) => row.id), ["m1", "m2"], "候选面随写路入缓存")
  // ⑤ 候选面零模型 ⇒ 零 `session:prefs`（半形载荷必遭核拒）+ 回退 + 诊断 + 空面入缓存
  const w5 = writes()
  await head.onField("provider", "p3")
  assert.equal(writes(), w5, "候选面零模型 ⇒ 零写")
  assert.deepEqual(head.candidates().models, [], "空候选面入缓存（零假候选 —— 不冒充已取）")
  assert.equal(repaints.length, 1, "零写径 ⇒ 回退刷行一次")
  assert.ok(errors.some((line) => String(line.join(" ")).includes("no model candidate")), "零静默：诊断一行")
  // ⑥ 失败三径一律回退 + 记错 · 零落切片：`ok` 假 / 抛 两径（+ 形缺回执）
  for (const [bad, expect] of [["fail", "session:prefs failed: busy"], ["throw", "session:prefs rejected"]]) {
    mode = bad
    const held = store.get().sessionMeta[KEY]
    const shots = repaints.length
    const marks = errors.length
    await head.onField("model", "m2")
    assert.equal(store.get().sessionMeta[KEY], held, `${bad} 径零乐观写（控件值恒退回归执前值）`)
    assert.equal(repaints.length, shots + 1, `${bad} 径 ⇒ 回退刷行一次`)
    assert.ok(errors.slice(marks).some((line) => String(line.join(" ")).includes(expect)), `${bad} 径诊断 = ${expect}`)
  }
  mode = "nometa"
  const held = store.get().sessionMeta[KEY]
  const marks6 = errors.length
  await head.onField("model", "m2")
  const lines = errors.slice(marks6).map((line) => String(line.join(" ")))
  assert.equal(store.get().sessionMeta[KEY], held, "形缺回执不落切片（仍持回执前值）")
  assert.ok(lines.some((line) => line.includes("session:prefs failed: invalid-shape")), "形缺 ⇒ 按失败面记错")
  assert.ok(lines.some((line) => line.includes("success receipt without meta")), "`ok` 真而形缺 ⇒ 明示形不合法（不冒充成功）")
  // ⑦ 表外字段 / 无活动会话 ⇒ 零通道 + 回退 + 诊断（零静默）
  const w7 = writes()
  const marks7 = errors.length
  const shots7 = repaints.length
  await head.onField("engineering", "on")
  assert.equal(writes(), w7, "表外字段 ⇒ 零通道（闭集外零动作）")
  assert.equal(repaints.length, shots7 + 1, "零发径 ⇒ 回退刷行一次")
  assert.ok(errors.slice(marks7).some((line) => String(line.join(" ")).includes("unknown field: engineering")), "诊断携字段名")
  store.set({ activeTab: null })
  await head.onField("model", "m1")
  assert.equal(writes(), w7, "无活动会话 ⇒ 零通道（`key` 缺不落通道）")
  // ⑧ 窄桥缺位：零抛 + 恰一行诊断（零二次日志）· 候选面仍空
  store.set({ activeTab: KEY })
  const noBridge = attachHead({})
  assert.deepEqual(noBridge.candidates(), { providers: [], models: [] }, "零桥 ⇒ 空候选面（零抛）")
  const marks8 = errors.length
  await noBridge.onField("model", "m1")
  assert.equal(errors.length, marks8 + 1, "窄桥缺位恰一行诊断")
  assert.ok(String(errors.at(-1).join(" ")).includes("preload bridge missing"), "诊断明示桥缺位")
  await noBridge.sync()
  assert.equal(errors.length, marks8 + 3, "`sync` 两通道各一行诊断（provider 面 + 模型面）")
})

test("U149: 候选面随动（两件取件序 / 同 provider 零重取 / 落地刷行一次 / 失败 ⇒ 空面 + 重试）", async (ctx) => {
  useHeadSentinels(ctx)
  const errors = captureErrors(ctx)
  resetStore(ctx)
  const host = bridge((channel, payload) => {
    if (channel === "provider:list") return { ok: true, providers: [{ name: "p1" }, { name: "p2" }] }
    if (channel === "model:list") return { ok: true, models: [{ id: `m@${payload?.provider}` }] }
    return { ok: true }
  })
  const repaints = []
  const head = attachHead({ host, onRepaint: () => repaints.push(host.calls.length) })
  const channels = () => host.calls.map(([channel]) => channel)
  store.set({ activeTab: "b", sessionMeta: { b: { provider: "p1", model: "m1" } } })
  // ① 首刷：两件取件（provider 面 → 模型面 —— 模型候选依赖 provider）· 候选后到 ⇒ 落地恰一次刷行
  await head.sync()
  assert.deepEqual(channels(), ["provider:list", "model:list"], "取件序 = provider 面 → 模型面")
  assert.deepEqual(host.call("model:list")[0], ["model:list", { provider: "p1" }], "模型候选按活动 provider 取")
  assert.equal(repaints.length, 1, "落地恰一次刷行（两件合并 —— 零双刷）")
  assert.deepEqual(head.candidates().providers.map((row) => row.name), ["p1", "p2"], "候选入缓存（构树期同步可读）")
  // ② 二次 `sync` 幂等：两件皆在 ⇒ 零请求零刷行
  await head.sync()
  assert.equal(host.calls.length, 2, "同 provider 零重取（缓存复用）")
  assert.equal(repaints.length, 1, "零变更 ⇒ 零刷行（幂等）")
  // ③ provider 变 ⇒ 只重取模型面（provider 面在缓存）+ 落地刷行一次
  store.set({ sessionMeta: { b: { provider: "p2", model: "m2" } } })
  await head.sync()
  assert.deepEqual(channels().slice(2), ["model:list"], "provider 变 ⇒ 只重取模型面")
  assert.deepEqual(host.call("model:list").at(-1), ["model:list", { provider: "p2" }], "按新 provider 重取")
  assert.equal(repaints.length, 2, "变更 ⇒ 刷行一次")
  // ④ 无 provider 读数 ⇒ 模型面零请求；⑤ 显式 `state` 参驱动（不读单例）
  store.set({ sessionMeta: { b: { model: "m1" } } })
  await head.sync()
  assert.equal(host.calls.length, 3, "provider 读数缺 ⇒ 模型面零请求")
  assert.equal(repaints.length, 2, "零变更 ⇒ 零刷行")
  await head.sync({ activeTab: "z", sessionMeta: { z: { provider: "p7" } } })
  assert.deepEqual(host.calls.slice(3), [["model:list", { provider: "p7" }]], "显式 `state` 参消费（provider 面在缓存）")
  assert.equal(repaints.length, 3, "变更 ⇒ 刷行一次")
  // ⑥ 取件失败 ⇒ 空候选面（零假候选）+ 落地刷行 + 下轮重试（失败不留假面缓存）
  const failing = bridge(() => ({ ok: false, reason: "offline" }))
  const shots = []
  const retry = attachHead({ host: failing, onRepaint: () => shots.push(1) })
  await retry.sync()
  assert.deepEqual(retry.candidates(), { providers: [], models: [] }, "取件失败 ⇒ 空面（零假候选）")
  assert.equal(shots.length, 1, "空面落地 ⇒ 刷行一次（控件退「仅现值」）")
  await retry.sync()
  assert.equal(failing.call("provider:list").length, 2, "空面 ⇒ 下轮重试")
  assert.ok(errors.some((line) => String(line.join(" ")).includes("provider:list failed: offline")), "零静默：诊断一行")
  // ⑦ 无活动标签 ⇒ 首刷只取 provider 面（模型候选零请求）
  const fresh = attachHead({ host, onRepaint: () => {} })
  store.set({ activeTab: null, sessionMeta: {} })
  await fresh.sync()
  assert.deepEqual(host.calls.slice(4), [["provider:list"]], "无活动标签 ⇒ 只取 provider 面")
})

test("U150: 状态栏读数两态（在读 / `>= 80` 警示 / 未至 ⇒ 零节点 / 节点序 / 落点）", (ctx) => {
  useHeadSentinels(ctx)
  const read = (usage, activeTab = "1") => statusTree(statusModel({ tabs: ["1", "2"], activeTab, badges: {}, usage }))
  const usageNode = (tree) => tree.children.find((node) => node.props["data-usage"] !== undefined) ?? null
  // ① 读数在读：`data-usage` = 读数串 · 常态 class · 文本 = `t("status.usage", { percent })`（读数入词）
  const mid = read({ "1": 60 })
  assert.equal(mid.props["data-alerts"], 0, "零告警 ⇒ 根锚数 0")
  assert.equal(mid.children.length, 1, "读数节点独子在位（读数缺 ⇒ 零子）")
  assert.equal(usageNode(mid).props["data-usage"], "60", "`data-usage` = 读数串")
  assert.equal(usageNode(mid).props.class, "status-usage", "`< 80` ⇒ 常态 class")
  assert.deepEqual(usageNode(mid).children, [wordOf(60)], "读数文本 = `t(\"status.usage\", { percent })`（键 + 读数双钉）")
  // ② 阈值两向（严格小于不警示）
  assert.equal(usageNode(read({ "1": 79 })).props.class, "status-usage", "79 ⇒ 常态")
  assert.equal(usageNode(read({ "1": 80 })).props.class, "status-usage status-usage-warn", "80 ⇒ 警示 class")
  // ③ 未至 / 零 / 负数 / 非数 / 非载体 / 无活动键 / 读数键 ≠ 活动键 ⇒ 零节点（禁假造）
  for (const [usage, why] of [[{}, "未至"], [{ "1": 0 }, "零"], [{ "1": -3 }, "负数"], [{ "1": "60" }, "串形"], [{ "1": null }, "空值"], [{ "1": NaN }, "NaN"], [null, "非载体"]]) {
    assert.equal(usageNode(read(usage)), null, `${why} ⇒ 零读数节点`)
  }
  assert.equal(usageNode(read({ "1": 99 }, null)), null, "无活动键 ⇒ 零节点")
  assert.equal(usageNode(read({ "2": 99 })), null, "读数键 ≠ 活动键 ⇒ 零节点（取活动键切片）")
  // ④ 节点序 = 读数 → 告警；告警码两向（`approval` / `running` 入列 · `done` / 空闲 / 活动标签本位 ⇒ 零节点）
  const alertsOf = (badges) => statusTree(statusModel({ tabs: ["1", "2"], activeTab: "1", badges, usage: { "1": 85 } })).children.map((node) => node.props["data-usage"] ?? node.props["data-alert"])
  assert.deepEqual(alertsOf({ "2": ["running"] }), ["85", "running"], "节点序 = 读数 → 告警")
  assert.deepEqual(alertsOf({ "2": ["approval"] }), ["85", "approval"], "`approval` 入列（词与标签位同源）")
  assert.deepEqual(alertsOf({ "2": ["done"] }), ["85"], "`done` 非告警码 ⇒ 零节点")
  assert.deepEqual(alertsOf({ "2": [] }), ["85"], "空集 ⇒ 空闲 ⇒ 零节点")
  assert.deepEqual(alertsOf({ "1": ["running"] }), ["85"], "活动标签本位 ⇒ 零告警（不自告警）")
  // ⑤ 落点面（假 DOM）：读数 / 告警 / 根锚实挂 + 重挂零残留
  assert.equal(selfCheck(), true, "假 DOM 载体自检")
  const fake = installFakeDom()
  try {
    const root = fake.element("div")
    mountStatus(root, { tabs: ["1", "2"], activeTab: "1", tabBadges: { "2": ["running"] }, usage: { "1": 82 } })
    const usage = root.querySelector('[data-usage="82"]')
    assert.ok(usage !== null, "读数节点落点实挂（描述符 → 节点）")
    assert.equal(usage.getAttribute("class"), "status-usage status-usage-warn", "警示 class 落点（`>= 80`）")
    assert.equal(usage.textContent, wordOf(82), "落点文本 = 词表值（读数入词）")
    const alert = root.querySelector('[data-alert="running"]')
    assert.equal(alert.getAttribute("data-tab"), "2", "告警节点落点携标签键")
    assert.equal(alert.textContent, t("sub.running"), "告警文本 = 位标词键值（与标签位同源同词）")
    assert.equal(root.querySelector("[data-alerts]").getAttribute("data-alerts"), "1", "根锚落点 = 告警数")
    mountStatus(root, { tabs: ["1"], activeTab: "1", tabBadges: {}, usage: {} })
    assert.equal(root.querySelector("[data-usage]"), null, "重挂（读数缺）⇒ 零读数节点（零残留）")
    assert.equal(root.querySelector("[data-alerts]").getAttribute("data-alerts"), "0", "根锚数随模型走（零告警）")
    assert.equal(mountStatus(null, {}), null, "零宿主 ⇒ 早返 null（不抛）")
  } finally { fake.restore() }
})
