/**
 * views-statusline.test.mjs — 状态行族用例（D17 / D22 · `docs/desktop/design/UI.md` §1 状态栏行 / §1「本批注（对齐重定位）」项 1 /
 * §1「本批注（状态栏对齐 · 屏面为准）」· `docs/desktop/design/PROJECT.md` §2 KD-25 / §6.1 D17 · D22 / §7 T-DSK33；用例号 = 自铸 **U154 起** —— U1–U153 已占用，续号自选）：
 *   U154 = 15 段表逐行判据（承载 **16 段**逐段节点 + 数据源；旁置 1 / 不适用 1 零节点 —— **零静默省略**；D22 段集 12 ⇒ 16）；
 *   U155 = 零节点面（未至 / 非正 / 缺片 ⇒ 逐段零节点 —— 禁假造 · KD-25；banner 四段负向锁 + `state` 两态 + `enter` 三态）；
 *   U156 = 挂载 / 出档 / 接线结构（单点重建 · 槽锚两向 · `STATUS_KEYS` 订阅面 · `chrome.mjs` 引调面）；
 *   U157 = 四项缺入站面端到端（`ev:activity` turn 槽 / 回合起刻 + `ev:usage` 载荷扩 `tokens` / `timers` ⇒ 归约 ⇒ 状态行节点）；
 *   U190 = 段 3 态机四支（桌面空闲唤醒 —— 挂起句 / 零节点 / 运行中 / 就绪 + 优先序 + N/M 取词链 + 交叠角落；单源 = `docs/desktop/design/UI.md` §1「本批注（对齐重定位）」项 1 表行 3）；
 *   U50 = 告警位面（原住 `test/views-chrome.test.mjs`，随状态行族拆档迁入 —— 面与判据不变，只换宿主档）。
 * 判据面 = 纯描述符（构树）+ `test/fake-dom.mjs`（落点那段机检）；词面走宿主哨兵缝（`initDict` host = 全键代理 —— 增键即入判据；
 * 插值模板钉「读数入词」）；零真 DOM。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { CORE_MESSAGES } from "@thincoder/core/i18n.mjs"
import { initDict, t } from "../renderer/i18n.mjs"
import { STATUS_KEYS, STATUS_SLOT, attachStatus } from "../renderer/mount-status.mjs"
import { initialState, store } from "../renderer/store.mjs"
import { reduce } from "../renderer/events.mjs"
import * as chrome from "../renderer/views/chrome.mjs"
import * as statusline from "../renderer/views/statusline.mjs"
import { STATUS_SEGMENTS, mountStatus, statusModel, statusTree } from "../renderer/views/statusline.mjs"
import { installFakeDom, selfCheck } from "./fake-dom.mjs"
import { installSeam, sentinel } from "./views-harness.mjs"

/** 词面模板缝：键面 + 插值读数双钉（未列键 ⇒ 哨兵 ⟦键⟧ —— 增键即入判据）。核域两键（`sub.running` / `status.turn`）
 *  经宿主表同拿模板（解析序 = 宿主 → 核投影；本缝同时替核投影面 —— 核键集单源 = `thincoder-core/i18n.mjs`）。 */
const TPL = Object.freeze({
  "status.attention.blocked": "⟦blocked⟧", "sub.running": "⟦busy⟧", "status.tool": "⟦tool:${name}⟧",
  "status.elapsed": "⟦elapsed:${seconds}⟧", "status.tasks": "⟦tasks:${done}/${total}⟧", "status.turn": "⟦turn:${n}/${m}⟧", // 核键占位名逐字（`thincoder-core/i18n.mjs` —— 缝与生产同构）
  "status.tokens": "⟦tokens:${up}/${down}⟧", "status.tokens.reasoning": "⟦reasoning:${tokens}⟧", "status.tokens.hit": "⟦hit:${percent}⟧",
  "status.usage": "⟦usage:${percent}⟧", "info.threshold": "⟦ledger⟧", "status.timer": "⟦timer:${count}⟧",
  "rail.session.untitled": "⟦untitled⟧", "status.queue.enter": "⟦queue-enter⟧", "status.queue.n": "⟦queue:${n}⟧",
  "status.ready": "⟦ready⟧", "status.enter.send": "⟦enter-send⟧",
  "susp.running": "⟦susp-run:${n}⟧", "susp.digesting": "⟦susp-digest:${n}⟧", "susp.winding": "⟦susp-winding⟧", // 桌面空闲唤醒批三键（段 3 支①）
  "status.banner.plan": "⟦plan⟧", "status.banner.auto": "⟦auto⟧", "status.banner.advisor": "⟦advisor⟧", "status.banner.eng": "⟦eng⟧",
  "tab.badge.approval": "⟦badge-approval⟧",
})
function useWords(ctx) {
  initDict({ locale: "en", host: new Proxy({}, { get: (_, key) => TPL[String(key)] ?? sentinel(String(key)) }) })
  ctx.after(() => initDict({}))
}

/** 承载 16 段满场夹具（逐段数据源齐给；`now` 注入 ⇒ 耗时段读数可算死；`sessionFlags` 四布尔全真 ⇒ banner 四段在场）。 */
const FACE = Object.freeze({
  tabs: ["1", "2"], activeTab: "1", badges: { "1": ["running", "approval"], "2": ["approval"] },
  usage: { "1": 85 }, sessions: [{ slot: 1, title: "会话甲" }],
  pending: { "1": [{ text: "队一", ts: 1 }, { text: "队二", ts: 2 }] }, // 段 14 源 = 本会话队（「对齐第二批」项 2）
  blocks: [{ kind: "user", id: "u1", text: "问" }, { kind: "tool", id: "t1", name: "Bash", status: "running" }],
  tasks: { "1": [{ status: "done" }, { status: "in_progress" }, { status: "done" }] },
  turns: { "1": { n: 2, max: 8 } }, turnStarts: { "1": 7000 }, now: 12500,
  tokens: { "1": { prompt: 1200, completion: 300, reasoningTokens: 40, cacheHit: 6, cacheMiss: 4 } },
  timers: { "1": { count: 3, expired: 1 } }, projectInfo: { thresholdReached: true },
  sessionFlags: { "1": { planMode: true, autoApprove: true, advisorGuard: true, engineering: true } },
})
/** 段节点（`data-seg` 码 ⇒ 节占位；缺 ⇒ `null`）。 */
const segOf = (tree, code) => tree.children.find((node) => node.props?.["data-seg"] === code) ?? null
const codesOf = (tree) => tree.children.map((node) => node.props?.["data-seg"]).filter((code) => code !== undefined)
const textOf = (node) => node.children.map((child) => (typeof child === "string" ? child : child.children?.[0])).filter((v) => v !== undefined)
/** 递归叶文本（词形锁用 —— 段内件面一并收）。 */
const textsOf = (node) => {
  const out = []
  const visit = (child) => {
    if (child === null || child === undefined) return
    if (typeof child === "object" && typeof child.tag === "string") {
      for (const kid of Array.isArray(child.children) ? child.children : [child.children]) visit(kid)
      return
    }
    out.push(String(child))
  }
  visit(node)
  return out
}

// ─── U154 15 段表逐行判据（承载 16 段在场 ∧ 逐段数据源 ∧ 旁置 / 不适用零节点）────────────

test("U154: 15 段表逐行判据（承载 16 段序 = CLI 序 · 逐段读数 / 警示 / 锚 · 旁置 1 + 不适用 1 零节点）", (ctx) => {
  useWords(ctx)
  const tree = statusTree(statusModel(FACE))
  assert.deepEqual(codesOf(tree), STATUS_SEGMENTS, "段序 = CLI 序（承载 16 段全在场 —— 零静默省略；闭集 = `STATUS_SEGMENTS`）")
  assert.equal(STATUS_SEGMENTS.length, 16, "承载段计数 = 16（D22 计数锁）")
  for (const ghost of ["scroll", "keys"]) assert.ok(!STATUS_SEGMENTS.includes(ghost), `旁置 / 不适用段不入段闭集：${ghost}`)
  assert.equal(tree.props["data-alerts"], 1, "根锚 = 跨会话告警数（非活动键位标码 —— 非 16 段之一）")
  assert.equal(tree.children.at(-1).props["data-alert"], "approval", "告警位面居段后（既有面）")
  // 段 1 —— banner 四态（活值四布尔真 ⇒ 四段在场；序 = CLI banner 序；词面 = 代号字面词键）
  assert.deepEqual(["plan", "auto", "advisor", "eng"].map((code) => textOf(segOf(tree, code))),
    [["⟦plan⟧"], ["⟦auto⟧"], ["⟦advisor⟧"], ["⟦eng⟧"]], "段 1 banner 四段（词键 `status.banner.*` —— 代号字面）")
  // 段 2 / 3 —— 位标两码（审批 / 提问同码；忙态词 = 状态词闭枚举「运行中」，核 i18n 同源键）
  assert.deepEqual([segOf(tree, "attention").props.class, textOf(segOf(tree, "attention"))], ["status-seg status-seg-warn", ["⟦blocked⟧"]], "段 2 注意力提示（警示 class 在）")
  assert.deepEqual([segOf(tree, "state").props.class, textOf(segOf(tree, "state"))], ["status-seg", ["⟦busy⟧"]], "段 3 状态词 = 运行中（忙态 —— 核状态词键，词出闭枚举，不造词）")
  // 段 4 / 5 / 6 / 7 —— 块面 / 回合起刻 / 任务切片 / 回合槽
  assert.deepEqual(textOf(segOf(tree, "tool")), ["⟦tool:Bash⟧"], "段 4 当前工具 = 块面末位 running 工具名（零新通道）")
  assert.deepEqual(textOf(segOf(tree, "elapsed")), ["⟦elapsed:5⟧"], "段 5 耗时 = 现刻(12500) − 回合起刻(7000) = 5s")
  assert.deepEqual(textOf(segOf(tree, "tasks")), ["⟦tasks:2/3⟧"], "段 6 任务计数 = tasks[key]（与计划卡同源）")
  assert.deepEqual(textOf(segOf(tree, "turn")), ["⟦turn:2/8⟧"], "段 7 回合 N/M = 归约槽 turns[key]")
  // 段 8 —— 令牌三件（↑↓ / ✦ / hit%）
  const tokens = segOf(tree, "tokens")
  assert.deepEqual(tokens.children.map((child) => child.props["data-part"]), ["updown", "reasoning", "hit"], "段 8 令牌三件锚")
  assert.deepEqual(tokens.children.map((child) => child.children[0]), ["⟦tokens:1.2k/300⟧", "⟦reasoning:40⟧", "⟦hit:60⟧"], "三件读数（fmtK / 命中率端算一次）")
  // 段 9 / 11 / 12 —— 读数 / 台账超阈位 / 计时（三处警示 class 与锚）
  const context = segOf(tree, "context")
  assert.deepEqual([context.props.class, context.props["data-usage"], textOf(context)], ["status-usage status-usage-warn", "85", ["⟦usage:85⟧"]], "段 9 上下文 %（读数锚 + ≥ 80 警示）")
  assert.deepEqual([segOf(tree, "ledger").props.class, textOf(segOf(tree, "ledger"))], ["status-seg status-seg-warn", ["⟦ledger⟧"]], "段 11 台账 = 只承超阈警示位")
  assert.deepEqual([segOf(tree, "timer").props.class, textOf(segOf(tree, "timer"))], ["status-seg status-seg-warn", ["⟦timer:3⟧"]], "段 12 计时（到期未送达 ⇒ 警示）")
  // 段 13 / 14 —— 标题（与标签条 / 左列同源）· 输入提示（队 ≥ 1 ⇒ 条数句）
  assert.deepEqual(textOf(segOf(tree, "title")), ["会话甲"], "段 13 会话标题 = 活动会话行标题（数据面原样）")
  assert.deepEqual(textOf(segOf(tree, "enter")), ["⟦queue:2⟧"], "段 14 输入提示（本会话队 ≥ 1 ⇒ 条数句 —— 条数优先）")
  const head = chrome.headTree(chrome.headModel({ tab: "1", meta: { provider: "P", model: "M", engineering: "on", autoApprove: "off" } })) // 会话头回三值：供给仍携两撤键 ⇒ 不渲染
  assert.deepEqual(head.children.map((node) => node.props["data-field"]), ["provider", "model", "effort"], "旁置面收正：会话头 = 三值（撤 `engineering` / `autoApprove` 两显示位 —— 同一事实只住状态行一处）")
})

// ─── U155 零节点面（未至 / 非正 / 缺片 ⇒ 逐段零节点 —— 禁假造）────────────────────

test("U155: 零节点面（16 段逐段：未至 / 非正 / 缺片 ⇒ 该段零节点 —— banner 负向锁 / `state` 两态 / `enter` 三态同钉）", (ctx) => {
  useWords(ctx)
  const blank = statusModel({ tabs: ["1"], activeTab: "1" })
  assert.deepEqual(codesOf(statusTree(blank)), ["state", "enter"], "全缺片 ⇒ 仅两恒在场段（就绪 / 输入提示静息态 —— 不造空段）")
  assert.deepEqual(statusTree(statusModel({ activeTab: null, badges: { "1": ["running", "approval"] }, usage: { "1": 90 } })).children, [], "无活动键 ⇒ 零段零告警（段面 = 活动会话面）")
  const face = (over) => statusModel({ ...FACE, ...over })
  const has = (over, code) => segOf(statusTree(face(over)), code) !== null
  const bannerCodes = ["plan", "auto", "advisor", "eng"]
  const flagCodes = (slice) => codesOf(statusTree(face({ sessionFlags: { "1": slice } }))).filter((code) => bannerCodes.includes(code))
  // 段 1（banner 四段 · 负向锁）：严格真 ⇒ 该段在场；假 / 缺 / 非严格真 ⇒ 零节点（逐码）
  for (const [slice, why] of [[{}, "空切片"], [undefined, "切片缺"], [null, "非载体"], ["yes", "非对象"],
    [{ planMode: false, autoApprove: false, advisorGuard: false, engineering: false }, "四假"],
    [{ planMode: "yes", autoApprove: 1, advisorGuard: {}, engineering: "on" }, "非布尔真值"]]) {
    assert.deepEqual(flagCodes(slice), [], `banner 四段零节点：${why}`)
  }
  assert.deepEqual([["planMode", "plan"], ["autoApprove", "auto"], ["advisorGuard", "advisor"], ["engineering", "eng"]].map(([key, code]) => [code, flagCodes({ [key]: true })]),
    [["plan", ["plan"]], ["auto", ["auto"]], ["advisor", ["advisor"]], ["eng", ["eng"]]], "banner 单键真 ⇒ 该段独在（逐码）")
  // 段 2 / 3：位标两码各自缺席 ⇒ 各自零节点（互不冒名）；两态词两态各钉
  assert.deepEqual([has({ badges: {} }, "attention"), has({ badges: { "1": ["running"] } }, "attention")], [false, false], "段 2 零节点：零位标 / 无 approval 码")
  assert.deepEqual([has({ badges: {} }, "state"), textOf(segOf(statusTree(face({ badges: {} })), "state"))], [true, ["⟦ready⟧"]], "段 3 静（位标集 ∩ {`running`, `approval`} = ∅）⇒ 就绪（词键 `status.ready`）")
  assert.deepEqual(textOf(segOf(statusTree(face({ badges: { "1": ["running"] } })), "state")), ["⟦busy⟧"], "段 3 忙（位标含 `running`）⇒ 运行中")
  assert.equal(has({ badges: { "1": ["approval"] } }, "state"), false, "段 3 审批在挂而回合非忙 ⇒ 零节点（两态词皆不命中 —— 同刻 CLI 状态文本让位模态提示）")
  // 段 4：非 running / 无名 / 非工具块 ⇒ 零节点
  for (const [blocks, why] of [
    [[{ kind: "tool", id: "t1", name: "Bash", status: "done" }], "已收束"],
    [[{ kind: "tool", id: "t1", name: "Bash", status: "error" }], "错误态"],
    [[{ kind: "tool", id: "t1", name: "", status: "running" }], "无名块"],
    [[{ kind: "user", id: "u1", text: "x" }], "非工具块"],
  ]) assert.equal(has({ blocks }, "tool"), false, `段 4 零节点：${why}`)
  // 段 5：忙态 ∧ 起刻有效两条同时成立才在场
  assert.deepEqual(
    [has({ turnStarts: {} }, "elapsed"), has({ turnStarts: { "1": NaN } }, "elapsed"), has({ badges: {}, turnStarts: { "1": 7000 } }, "elapsed")],
    [false, false, false], "段 5 零节点：起刻未至 / 非数 / 非忙态",
  )
  // 段 6 / 7：空列表 / 非数组 / 两值非正整数 ⇒ 零节点
  assert.deepEqual([has({ tasks: { "1": [] } }, "tasks"), has({ tasks: { "1": null } }, "tasks")], [false, false], "段 6 零节点：空列表 / 非载体")
  for (const bad of [{ "1": { n: 0, max: 8 } }, { "1": { n: 2, max: 0 } }, { "1": { n: "2", max: 8 } }, { "1": null }]) {
    assert.equal(has({ turns: bad }, "turn"), false, `段 7 零节点：${JSON.stringify(bad)}`)
  }
  // 段 8：prompt 非正 / 非数 ⇒ 整段零节点；两附加件各自非正 ⇒ 各自缺席（件级判据）
  for (const bad of [{ prompt: 0 }, { prompt: -3 }, { prompt: "1200" }, {}]) {
    assert.equal(has({ tokens: { "1": { ...bad, completion: 1, cacheHit: 1, cacheMiss: 1, reasoningTokens: 1 } } }, "tokens"), false, `段 8 零节点：${JSON.stringify(bad)}`)
  }
  const lean = segOf(statusTree(face({ tokens: { "1": { prompt: 500, completion: 0, reasoningTokens: 0, cacheHit: 0, cacheMiss: 0 } } })), "tokens")
  assert.deepEqual(lean.children.map((child) => child.props["data-part"]), ["updown"], "段 8 件级零节点：✦ / hit 两件非正 ⇒ 各自缺席（整段仍在）")
  // 段 9：未至 / 零 / 负 / 非数 ⇒ 零节点
  for (const bad of [{ "1": 0 }, { "1": -1 }, { "1": "60" }, {}]) {
    assert.equal(has({ usage: bad }, "context"), false, `段 9 零节点：${JSON.stringify(bad)}`)
  }
  // 段 11 / 12：严格真判据；计时非正 / 非数 ⇒ 零节点
  assert.deepEqual([has({ projectInfo: null }, "ledger"), has({ projectInfo: { thresholdReached: false } }, "ledger"), has({ projectInfo: { thresholdReached: "true" } }, "ledger")], [false, false, false], "段 11 零节点：非严格真（禁假造）")
  for (const bad of [{ "1": { count: 0, expired: 0 } }, { "1": { count: -1 } }, { "1": { count: "3" } }, { "1": null }]) {
    assert.equal(has({ timers: bad }, "timer"), false, `段 12 零节点：${JSON.stringify(bad)}`)
  }
  assert.equal(segOf(statusTree(face({ timers: { "1": { count: 1, expired: 0 } } })), "timer").props.class, "status-seg", "段 12 未到期 ⇒ 常态 class（无警示）")
  // 段 13：无行 ⇒ 零节点；行标题空 ⇒ 词表缺省词（与标签条 / 左列同投影）；他键行不算命中
  assert.deepEqual([has({ sessions: [] }, "title"), has({ sessions: [{ slot: "9", title: "别家" }] }, "title")], [false, false], "段 13 零节点：无本键行")
  assert.deepEqual(textOf(segOf(statusTree(face({ sessions: [{ slot: "1", title: "" }] })), "title")), ["⟦untitled⟧"], "段 13：标题空 ⇒ 词表缺省词（同源同投影）")
  // 段 14（enter 三态）：静 ⇒ `Enter: send`（恒在场）；忙 ∧ 队空 ⇒ 排队句；有队 ⇒ 条数句（条数优先；源 = 本会话队）
  assert.deepEqual(textOf(segOf(statusTree(face({ badges: {}, pending: {} })), "enter")), ["⟦enter-send⟧"], "段 14 静息（非忙 ∧ 队空）⇒ `Enter: send`（打开态可亮面）")
  assert.deepEqual(textOf(segOf(statusTree(face({ pending: {} })), "enter")), ["⟦queue-enter⟧"], "段 14 忙态 + 队空 ⇒ Enter 排队句")
  assert.deepEqual([false, true].map((busy) => textOf(segOf(statusTree(face({ badges: busy ? FACE.badges : {}, pending: { "1": [{ text: "x", ts: 1 }] } })), "enter"))),
    [["⟦queue:1⟧"], ["⟦queue:1⟧"]], "段 14 有队（非忙 / 忙两态同）⇒ 条数句（队不隐、优先于排队句）")
  assert.deepEqual(textOf(segOf(statusTree(face({ badges: {}, pending: { "2": [{ text: "他键", ts: 1 }] } })), "enter")), ["⟦enter-send⟧"], "段 14 源 = **本**会话键（他键队面零扰）")
})

// ─── U190 段 3 态机四支（桌面空闲唤醒 —— 单源 = `docs/desktop/design/UI.md` §1「本批注（对齐重定位）」项 1 表行 3）──

test("U190: 段 3 态机四支（优先序 ①挂起句 > ②零节点 > ③运行中 > ④就绪 · N/M 取词链 · 交叠角落 · active 严格真门）", (ctx) => {
  useWords(ctx)
  const treeOf = (over) => statusTree(statusModel({ tabs: ["1"], activeTab: "1", ...over }))
  const text1 = (over) => { const seg = segOf(treeOf(over), "state"); return seg === null ? null : textOf(seg)[0] }
  const susp = (counts) => ({ susp: { "1": { active: true, running: 0, queued: 0, pending: 0, done: 0, ...counts } } })
  // ① 挂起句支（N = `running + queued` · M = `pending + done`；取词链 = 三键条件组装）
  assert.equal(text1(susp({ running: 2, queued: 1 })), "⟦susp-run:3⟧", "① N > 0 ∧ M = 0 ⇒ susp.running（N = running + queued = 3）")
  assert.equal(text1(susp({ running: 2, queued: 1, pending: 1, done: 1 })), "⟦susp-run:3⟧ · ⟦susp-digest:2⟧", "① N > 0 ∧ M > 0 ⇒ 主体句 + 附句（M = pending + done = 2）")
  assert.equal(text1(susp({ pending: 1 })), "⟦susp-digest:1⟧", "① N = 0 ∧ M > 0 ⇒ 单附句（无主体句）")
  assert.equal(text1(susp({})), "⟦susp-winding⟧", "① N = 0 ∧ M = 0 ⇒ winding（零计数轮 —— 窗在场照出）")
  assert.equal(segOf(treeOf(susp({ running: 1 })), "state").props.class, "status-seg", "① 段 class = 常态（非警示段）")
  // ② 零节点支 / ③ 运行中 / ④ 就绪（两态词 = 既有两态 —— 无窗时回落）
  assert.equal(text1({ badges: { "1": ["approval"] } }), null, "② approval 在挂 ∧ 回合非忙 ⇒ 段零节点（承载 = 注意力 chip）")
  assert.equal(text1({ badges: { "1": ["running", "approval"] } }), "⟦busy⟧", "③ 忙 ⇒ 运行中（② 门 = ¬running ⇒ 审批同挂不夺段）")
  assert.equal(text1({}), "⟦ready⟧", "④ 其余 ⇒ 就绪")
  // 支①的严格真门（`active` 缺 / 非布尔 ⇒ 禁假造回落两态词）+ 交叠角落 + 他键零扰
  assert.equal(text1({ susp: { "1": { running: 9 } } }), "⟦ready⟧", "`active` 缺 ⇒ 不落①（回落两态词 —— 禁假造）")
  assert.equal(text1(susp({ active: "yes" })), "⟦ready⟧", "`active` 非严格真（非布尔真值）⇒ 不落①")
  assert.equal(text1({ susp: { "1": { active: true, running: 1 }, "2": { active: true, running: 9 } } }), "⟦susp-run:1⟧", "源 = 本会话键（他键窗零扰）")
  assert.equal(text1({ badges: { "1": ["approval"] }, ...susp({ pending: 1 }) }), "⟦susp-digest:1⟧", "交叠角落（approval ∧ ¬running ∧ 挂起窗在场）⇒ 取①（chip 照常承载审批 —— 两事实不同面）")
  assert.equal(text1({ badges: { "1": ["running"] }, ...susp({ pending: 1 }) }), "⟦susp-digest:1⟧", "① 段与③ 交叠 ⇒ 取①（窗在场 ⇒ 挂起句夺段于运行中词）")
  // 四计数非数 ⇒ `numOf` 归一 0（不落 `NaN` 入词面 —— 沿归约面同判）
  assert.equal(text1(susp({ running: NaN, pending: "1" })), "⟦susp-winding⟧", "非数计数 ⇒ 归一 0（零 N / 零 M ⇒ winding）")
})

// ─── U156 挂载 / 出档 / 接线结构面 ────────────────────────────────────────

test("U156: 挂载 / 出档 / 接线（单点重建 · 槽锚两向 · `STATUS_KEYS` 覆盖在册切片 · `chrome.mjs` 引调面 · 假 DOM 落点）", (ctx) => {
  useWords(ctx)
  // ① 引调面（拆档纪律：消费面名面零改 —— `chrome.mjs` 同名再出口 = 状态行族档同一函数引用）
  assert.deepEqual(
    [chrome.statusModel === statusline.statusModel, chrome.statusTree === statusline.statusTree, chrome.mountStatus === statusline.mountStatus],
    [true, true, true], "chrome.mjs 三面再出口 = 族档同一引用（语义单源）",
  )
  // ② 槽锚两向（骨架属性 ↔ 常量声明）+ 订阅切片键面 ⊆ initialState 键集
  const html = readFileSync(new URL("../renderer/index.html", import.meta.url), "utf8")
  assert.equal(STATUS_SLOT, '[data-slot="status"]', "槽锚常量与骨架属性同值（两向锁 —— 状态行族出档）")
  assert.ok(html.includes('data-slot="status"'), "骨架承载容器锚（窗口级底行 —— UI.md §1 状态栏行）")
  const base = initialState()
  const seeded = [...Object.keys(base), "tasks", "sessionFlags", "susp"] // `tasks`（同 `questions`）/ `sessionFlags` = 归约面 / 页读面首写自种切片 —— 不在初态键集，属在册切片面；`susp` = `ev:susp` 归约面首写自种（桌面空闲唤醒批）
  assert.deepEqual(STATUS_KEYS.filter((key) => !seeded.includes(key)), [], "订阅切片键面全在册（拼错键 ⇒ 永不重绘的静默口已闭）")
  for (const key of ["usage", "tasks", "turns", "turnStarts", "tokens", "timers", "projectInfo", "pending", "blocks", "sessionFlags", "susp"]) {
    assert.ok(STATUS_KEYS.includes(key), `状态行订阅切片在位：${key}`)
  }
  // ③ 单点重建（假 DOM）：重挂清容器 ⇒ 零残留；零宿主 ⇒ 早返 null
  assert.equal(selfCheck(), true, "假 DOM 载体自检")
  const fake = installFakeDom()
  try {
    const root = fake.element("footer")
    root.setAttribute("data-slot", "status")
    const model = mountStatus(root, { ...base, tabs: ["1"], activeTab: "1", tabBadges: { "1": ["running"] }, usage: { "1": 42 }, tokens: { "1": { prompt: 9, completion: 0, reasoningTokens: 0, cacheHit: 0, cacheMiss: 0 } }, sessionFlags: { "1": { engineering: true } } })
    assert.deepEqual(model.segments.map((segment) => segment.code), ["eng", "state", "tokens", "context", "enter"], "落点模型 = 段集（模式位切片 → banner 段；忙态空队 ⇒ 排队句在场）")
    assert.ok(root.querySelector('[data-seg="context"]') !== null, "读数段落点实挂")
    assert.equal(root.querySelector('[data-usage="42"]').textContent, "⟦usage:42⟧", "段文本 = 词表值（读数入词）")
    assert.equal(root.querySelector('[data-seg="tokens"]').children[0].getAttribute("data-part"), "updown", "段内件锚落点（令牌三件）")
    assert.equal(root.getAttribute("data-slot"), "status", "宿主槽位零改")
    const writes = fake.mark()
    mountStatus(root, { ...base, tabs: ["1"], activeTab: null })
    assert.deepEqual(root.querySelectorAll("[data-seg]"), [], "重挂（零段态：无活动键）⇒ 旧段零残留（单点重建）")
    assert.ok(fake.delta(writes).structural > 0, "重挂确走清 + 建（零写 = 假重挂）")
    assert.equal(mountStatus(null, base), null, "零宿主 ⇒ 早返 null（不抛）")
    // ④ 出档装配面（`attachStatus` 注入 store + 槽缝）：派发面 = 槽内实挂
    const seam = installSeam(fake)
    const slot = seam.slot("status", "footer")
    const { paintStatus } = attachStatus({ store: { get: () => ({ ...base, tabs: ["1"], activeTab: "1", usage: { "1": 7 } }) } })
    paintStatus()
    assert.equal(slot.querySelector("[data-usage]").getAttribute("data-usage"), "7", "`paintStatus` = 槽内单点重建（app.mjs 订阅派发面）")
  } finally { fake.restore() }
})

// ─── U157 四项缺入站面端到端（turn 槽 / 回合起刻 + `ev:usage` 载荷扩）──────────────

test("U157: 端到端（turn 槽 / 起刻 + `tokens` / `timers` 载荷扩 ⇒ 归约 ⇒ 状态行节点；缺省清槽 / 同值原引用）", (ctx) => {
  useWords(ctx)
  const KEY = "1"
  const blank = { ...initialState(), activeSession: KEY }
  const turn = reduce(blank, { channel: "ev:activity", key: KEY, event: "turn", n: 3, max: 12 }, 1000)
  assert.deepEqual(turn.turns[KEY], { n: 3, max: 12 }, "回合槽（段 7 源）：`n` / `max` 落槽 —— 有意取代旧「不落」态")
  assert.equal(turn.turnStarts[KEY], 1000, "回合起刻（段 5 源）：turn 首帧现刻")
  assert.equal(reduce(turn, { channel: "ev:activity", key: KEY, event: "turn", n: 3, max: 12 }, 2500), turn, "同帧重复（同 n/max ∧ 位标已在）⇒ 原引用（零通知）")
  const tokens = { prompt: 500, completion: 20, reasoningTokens: 0, cacheHit: 1, cacheMiss: 3 }
  const usage = reduce(turn, { channel: "ev:usage", key: KEY, percent: 64, tokens, timers: { count: 2, expired: 1 } })
  assert.deepEqual([usage.usage[KEY], usage.tokens[KEY], usage.timers[KEY]], [64, tokens, { count: 2, expired: 1 }], "载荷扩三面同笔落槽（占用 / 令牌 / 计时）")
  const faced = (state, now) => statusTree(statusModel({
    tabs: [KEY], activeTab: KEY, badges: state.tabBadges, usage: state.usage, tasks: state.tasks, turns: state.turns,
    turnStarts: state.turnStarts, tokens: state.tokens, timers: state.timers, blocks: state.blocks, pool: state.pool, sessions: [{ slot: KEY, title: "S" }], now,
  }))
  const tree = faced(usage, 6000)
  assert.deepEqual(codesOf(tree), ["state", "elapsed", "turn", "tokens", "context", "timer", "title", "enter"], "归约 → 状态行端到端（八段在场 · 序 = CLI 序）")
  assert.deepEqual([textOf(segOf(tree, "elapsed")), textOf(segOf(tree, "turn")), textOf(segOf(tree, "tokens")), textOf(segOf(tree, "timer"))],
    [["⟦elapsed:5⟧"], ["⟦turn:3/12⟧"], ["⟦tokens:500/20⟧", "⟦hit:25⟧"], ["⟦timer:2⟧"]], "四源段读数（起刻差 / 回合槽 / 令牌两件 / 计时）")
  // 缺省两键 ⇒ 清槽（载荷缺省 ⇒ 零节点，禁假造）；同值三槽 ⇒ 原引用（零重绘）
  const cleared = reduce(usage, { channel: "ev:usage", key: KEY, percent: 64, timers: { count: 0, expired: 0 } })
  assert.notEqual(cleared, usage, "缺 `tokens` 键 ⇒ 清槽（状态更新）")
  assert.deepEqual([cleared.tokens[KEY], cleared.timers[KEY]], [undefined, { count: 0, expired: 0 }], "令牌槽清空 / 计时落零值（显示面「非正 ⇒ 零节点」）")
  assert.deepEqual(codesOf(faced(cleared, 6000)), ["state", "elapsed", "turn", "context", "title", "enter"], "清槽后令牌 / 计时段零节点（禁假造）")
  assert.equal(reduce(cleared, { channel: "ev:usage", key: KEY, percent: 64, timers: { count: 0, expired: 0 } }), cleared, "三槽同值 ⇒ 原引用（同值重发零重绘）")
  assert.equal(reduce(usage, { channel: "ev:usage", key: KEY, percent: 0, tokens }), usage, "有效读数门不变：未至 / 非正 ⇒ 原引用（连载荷扩两键一并不落）")
})

// ─── U161 核域词形单源锁（复用核键段 = 生产模板实填 —— 参数名不对即判红）──────────────

test("U161: 核域词形锁（`CORE_MESSAGES` 真模板渲染 ⇒ 零残留 `${…}`；两复用键实填读数）", (ctx) => {
  initDict({ locale: "en", dict: Object.fromEntries(Object.entries(CORE_MESSAGES).map(([key, entry]) => [key, entry.en])) })
  ctx.after(() => initDict({}))
  const tree = statusTree(statusModel(FACE))
  for (const segment of tree.children) {
    for (const text of textsOf(segment)) {
      assert.ok(!/\$\{\w+\}/.test(text), `段词零残留占位（复用核键 ⇒ 参数名须与核模板逐字对应 —— 实 ${text}）`)
    }
  }
  assert.deepEqual([textOf(segOf(tree, "state")), textOf(segOf(tree, "turn"))], [["running"], ["turn 2/8"]],
    "核键两面实填（`sub.running` / `status.turn` —— 词形单源 = `thincoder-core/i18n.mjs`）")
})


// ─── U50 告警位面（随状态行族拆档迁入 —— 面与判据不变）────────────────────────────

test("U50: 状态栏告警位（非活动标签的待审批 / 运行中 ∧ 序 = 标签序 ∧ 零告警零节点）", (ctx) => {
  const sentinelOf = (key) => `⟦${key}⟧`
  initDict({
    locale: "en",
    host: Object.fromEntries(["tab.badge.approval"].map((key) => [key, sentinelOf(key)])),
    dict: Object.fromEntries(["sub.running", "sub.done"].map((key) => [key, sentinelOf(key)])),
  })
  ctx.after(() => initDict({}))

  const alertsOf = (tree) => tree.children.filter((node) => node.props?.["data-alert"] !== undefined)
  const one = statusTree(statusModel({ tabs: ["a", "b"], activeTab: "a", badges: { a: ["approval"], b: ["running"] } }))
  assert.equal(one.props["data-alerts"], 1, "data-alerts = 告警数")
  assert.deepEqual(alertsOf(one).map((node) => node.props["data-alert"]), ["running"], "活动标签的待审批不入状态行（活动态由标签位承载）")
  assert.deepEqual(alertsOf(one).map((node) => node.props["data-tab"]), ["b"], "告警携带标签键（随动面）")
  assert.deepEqual(alertsOf(one).map((node) => node.children[0]), [sentinelOf("sub.running")], "告警文本 = BADGE_WORD[码] 词表值")

  const two = statusTree(statusModel({
    tabs: ["a", "b", "c", "d"], activeTab: "a", badges: { b: ["approval"], c: ["running"], d: ["done"] },
  }))
  assert.equal(two.props["data-alerts"], 2, "N ≥ 2 例（4 标签 · b / c 两告警）")
  assert.deepEqual(alertsOf(two).map((node) => node.props["data-alert"]), ["approval", "running"], "告警序 = 标签序")
  assert.deepEqual(alertsOf(two).map((node) => node.props["data-tab"]), ["b", "c"], "标签键随告警同序")
  assert.deepEqual(alertsOf(two).map((node) => node.children[0]), [sentinelOf("tab.badge.approval"), sentinelOf("sub.running")], "两告警文本 = 各自词表值（待审批 · 运行中）")

  const quiet = statusTree(statusModel({ tabs: ["a", "d"], activeTab: "a", badges: { d: ["done"] } }))
  assert.equal(quiet.props["data-alerts"], 0, "done 不入告警码集（零告警）")
  assert.deepEqual(alertsOf(quiet), [], "零告警 ⇒ 零告警节点（不造占位；段面 = 两恒在场静息段）")
})
