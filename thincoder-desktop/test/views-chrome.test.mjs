/**
 * views-chrome.test.mjs — E-2 中区外壳用例（批档 §2.5 U49–U51 拆档 · 原住 `test/views.test.mjs`）：
 * 会话头（字段序单源）/ 状态栏告警位 / 全量词表键齐（含对话流 / 活动池 / 审批卡 / 设置 / 首启向导 / 信息行树入量）+ 零硬编码。
 * 零回归面（清单两向 ∧ 导出面锁 ∧ 七槽接线结构面）本批拆出，住 `test/views-locks.test.mjs`（档行预算，
 * `docs/desktop/design/PROJECT.md` §4.1）——面不变、判据不变，只换宿主档；左列面留 `test/views.test.mjs`（U39–U44 + U53）。
 * 纪律：本档只读源 + 调纯函数（`headModel` / `headTree` / `statusModel` / `statusTree` / `railModel` / `railTree` /
 * `tabbarModel` / `tabbarTree` / `chatModel` / `chatTree` / `poolModel` / `poolTree` / `approvalTree` / `settingsModel` /
 * `settingsTree` / `wizardModel` / `wizardTree` / `infoModel` / `infoTree`）——**不触 DOM**（挂载面走查随人工）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { HOST_DICT, initDict } from "../renderer/i18n.mjs"
import { railModel, railTree, tabbarModel, tabbarTree } from "../renderer/views/sessions.mjs"
import { headModel, headTree, statusModel, statusTree } from "../renderer/views/chrome.mjs"
import { chatModel, chatTree } from "../renderer/views/chat.mjs"
import { poolModel, poolTree } from "../renderer/views/activity.mjs"
import { approvalTree } from "../renderer/views/approval.mjs"
import { FORMATS, REASON_WORD, settingsModel, settingsTree } from "../renderer/views/settings.mjs"
import { wizardModel, wizardTree } from "../renderer/views/onboarding.mjs"
import { infoModel, infoTree } from "../renderer/views/info-row.mjs"

/** 树遍历（深度优先 · 保序）：节点集 / 叶文本集共用 —— `asText` 切换收集面（`null` 空位不入）。 */
function walk(tree, asText) {
  const out = []
  const visit = (child) => {
    if (child === null || child === undefined) return
    if (typeof child === "object" && typeof child.tag === "string") {
      if (!asText) out.push(child)
      for (const kid of Array.isArray(child.children) ? child.children : [child.children]) visit(kid)
      return
    }
    if (asText) out.push(String(child))
  }
  visit(tree)
  return out
}

const nodes = (tree) => walk(tree, false)
const texts = (tree) => walk(tree, true)

/** 剥注释（块 / 行 / HTML）：源码机检看**声明点**——注释行含同字样（不剥即假计）。 */
function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^[ \t]*\/\/.*$/gm, "")
    .replace(/<!--[\s\S]*?-->/g, "")
}

/** 载荷行夹具（字段集 = 批档 §2.4（e））。 */
const row = (slot, over = {}) => ({
  slot, title: `标题${slot}`, createdBy: "desktop", updatedAt: 1, messageCount: 0, isActive: false, ...over,
})

/** 核域状态词键（`thincoder-core/i18n.mjs:50-54` 五键 —— 消费面断言，非本端新键）。 */
const CORE_WORD_KEYS = ["sub.queued", "sub.running", "sub.stopped", "sub.done", "sub.error"]
/** 对话流宿主键（批 6 新增六键 · 全键数 101 = 左列 10 + 标签条 4 + 对话流 6 + 活动池 7 + 审批卡 7 + 设置 48 + 首启向导 10 + 信息行 9）。 */
const CHAT_WORD_KEYS = ["chat.empty.hint", "chat.pill.new", "chat.pill.bottom", "chat.summary.older", "chat.tool.changes", "chat.tool.duration"]
/** 活动池宿主键（本批新增七键 —— 三族标 + 两读数标题字 + 折叠控件两态 + 空态）。 */
const POOL_WORD_KEYS = [
  "pool.title", "pool.family.approvals", "pool.family.blocks", "pool.family.queue",
  "pool.collapse", "pool.expand", "pool.empty.hint",
]
/** 审批卡宿主键（本批新增七键 —— 两形三出口 + 批形计数）。 */
const APPROVAL_WORD_KEYS = [
  "approval.once", "approval.always", "approval.reject",
  "approval.batch.approveAll", "approval.batch.deny", "approval.batch.oneByOne", "approval.batch.count",
]

/** 对话流帧态夹具（U51 消费面 —— 树面判据住 `test/views-chat.test.mjs`）：只给构树消费的键。 */
const chatState = (over = {}) => ({
  activeSession: "s1", blocks: [], history: { hasOlder: false, inFlight: false, page: null },
  following: true, pendingNew: 0, locale: "en", ...over,
})

/** 活动池 / 审批卡帧态夹具（U51 消费面 —— 树面判据住 `views-activity` / `views-approval` 两档）。 */
const poolState = (over = {}) => ({
  activeSession: "s1", activeTab: "1", poolCollapsed: {},
  pool: { running: 0, approval: 0, blocks: [], queue: [], approvals: [] }, ...over,
})
const approvalSingle = {
  promptId: "p1", shape: "single", tool: "Bash", argsSummary: "npm test",
  changes: { items: [{ path: "a.mjs", insertions: 12, deletions: 5 }] },
}
const approvalBatch = { promptId: "p2", shape: "batch", batch: { count: 3, tools: ["Bash", "Read"] } }
const chatBlock = (kind, id, over = {}) => ({ kind, id, text: `正文-${id}`, ...over })
const chatTool = (id, status, over = {}) => ({ kind: "tool", id, name: "Bash", argsSummary: "npm test", status, ...over })
/** 五态工具卡 + 两文本块（消费面：五状态词 / 改动摘要 / 耗时 / 结果区）。 */
const chatBlocks = [
  chatBlock("user", "u1"),
  chatBlock("assistant", "a1"),
  chatTool("t1", "done", { durationMs: 1500, changes: { items: [{ path: "a.mjs", insertions: 12, deletions: 5 }] } }),
  chatTool("t2", "queued"),
  chatTool("t3", "running"),
  chatTool("t4", "stopped"),
  chatTool("t5", "error", { durationMs: 2400, result: "boom" }),
]

/** 设置面帧态夹具（U51 消费面 —— 段面 / 表单 / 通道判据住 `test/views-settings.test.mjs`）：只给构树消费的键。 */
const settingsFace = (over = {}) => ({
  locale: "en",
  settings: {
    open: true, notice: null, verify: null, wizard: null,
    providers: { state: "none" }, model: { state: "none" }, agent: { state: "none" }, mcp: { state: "none" },
    ...over,
  },
})

/** 设置面全就绪帧（只取键面）：四段 ready ⇒ 行面 / 两形表单 / 字段与候选 / 服务摘要齐出。 */
const settingsReady = settingsFace({
  providers: {
    state: "ready", presets: [{ name: "openai" }],
    providers: [{ name: "p1", model: "m1", hasKey: true, maskedKey: "sk-x", active: true }, { name: "p2", model: null, hasKey: false, active: false }],
  },
  verify: { kind: "ok", count: 2 },
  model: { state: "ready", provider: "p1", current: "p1:m1", models: ["m1", "m2"] },
  agent: {
    state: "ready",
    fields: [{ path: "agent.maxTurns", kind: "number", value: 12 }, { path: "agent.key", kind: "string", value: "••", sensitive: true }],
  },
  mcp: {
    state: "ready",
    servers: [{ name: "fs", kind: "command", summary: "npx fs" }, { name: "web", kind: "url", summary: "https://x" }],
  },
})

/** 首启向导帧态夹具（U51 消费面 —— 闸 / 步面判据住 `test/views-onboarding.test.mjs`）：`configured` 假 ⇒ 向导占槽。 */
const wizardFace = (step, over = {}) => settingsFace({
  configured: false, wizard: { step, dismissed: false, notice: null },
  providers: { state: "ready", presets: [{ name: "openai" }], providers: [] },
  model: { state: "ready", provider: "p1", current: "p1:m1", models: ["m1", "m2"] },
  ...over,
})

/** 项目级信息行帧态夹具（U51 消费面 —— 两读走核判据住 `test/views-settings.test.mjs`）：只给构树消费的键。 */
const infoFace = (over = {}) => ({
  projectInfo: { counts: null, phase: null, thresholdReached: false, notice: null, ...over },
})

// ─── U49 会话头（中区外壳 · 字段序单源）──────────────────────

test("U49: 会话头（data-meta 两态 ∧ 字段序 = 槽序 ∧ 只落非空串 ∧ 根 data-tab）", () => {
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
  assert.deepEqual(full.children.map((node) => node.children[0]), ["P", "M", "high", "on", "off"], "文本 = 供给串原样（数据面非词表）")

  const partial = headTree(headModel({ tab: "b", meta: { provider: "P", effort: "", autoApprove: 3 } }))
  assert.deepEqual(partial.children.map((node) => node.props["data-field"]), ["provider"], "空串 / 非串 ⇒ 零节点（只落给到的非空串）")
  assert.equal(partial.props["data-meta"], "present", "部分供给 ⇒ present（闸 = 至少一字段）")
})

// ─── U50 状态栏告警位 ───────────────────────────────────────

test("U50: 状态栏告警位（非活动标签的待审批 / 运行中 ∧ 序 = 标签序 ∧ 零告警零节点）", (ctx) => {
  const sentinel = (key) => `⟦${key}⟧`
  initDict({
    locale: "en",
    host: Object.fromEntries(["tab.badge.approval"].map((key) => [key, sentinel(key)])),
    dict: Object.fromEntries(["sub.running", "sub.done"].map((key) => [key, sentinel(key)])),
  })
  ctx.after(() => initDict({}))

  const one = statusTree(statusModel({ tabs: ["a", "b"], activeTab: "a", badges: { a: ["approval"], b: ["running"] } }))
  assert.equal(one.props["data-alerts"], 1, "data-alerts = 告警数")
  assert.deepEqual(one.children.map((node) => node.props["data-alert"]), ["running"], "活动标签的待审批不入状态栏（活动态由标签位承载）")
  assert.deepEqual(one.children.map((node) => node.props["data-tab"]), ["b"], "告警携带标签键（随动面）")
  assert.deepEqual(one.children.map((node) => node.children[0]), [sentinel("sub.running")], "告警文本 = BADGE_WORD[码] 词表值")

  const two = statusTree(statusModel({
    tabs: ["a", "b", "c", "d"], activeTab: "a", badges: { b: ["approval"], c: ["running"], d: ["done"] },
  }))
  assert.equal(two.props["data-alerts"], 2, "N ≥ 2 例（4 标签 · b / c 两告警）")
  assert.deepEqual(two.children.map((node) => node.props["data-alert"]), ["approval", "running"], "告警序 = 标签序")
  assert.deepEqual(two.children.map((node) => node.props["data-tab"]), ["b", "c"], "标签键随告警同序")
  assert.deepEqual(two.children.map((node) => node.children[0]), [sentinel("tab.badge.approval"), sentinel("sub.running")], "两告警文本 = 各自词表值（待审批 · 运行中）")

  const quiet = statusTree(statusModel({ tabs: ["a", "d"], activeTab: "a", badges: { d: ["done"] } }))
  assert.equal(quiet.props["data-alerts"], 0, "done 不入告警码集（零告警）")
  assert.deepEqual(quiet.children, [], "零告警 ⇒ 零节点（不造占位）")
})

// ─── U51 词表键齐 ∧ 零硬编码（全量）────────────────────────

test("U51: 词表键齐 ∧ 零硬编码（两语 101 键键集相等 ∧ 全量与 aria-label 全哨兵 ∧ 十二视图档零 CJK）", (ctx) => {
  const keys = Object.keys(HOST_DICT.en)
  assert.equal(keys.length, 101, "宿主键数 = 101（左列 10 + 标签条 4 + 对话流 6 + 活动池 7 + 审批卡 7 + 设置 48 + 首启向导 10 + 信息行 9）")
  assert.deepEqual([...keys].sort(), [...Object.keys(HOST_DICT.zh)].sort(), "两语键集相等（增键两语同增）")
  for (const key of ["tab.badge.approval", "tab.action.close", "tab.action.close.cancel", "tab.action.close.confirm"]) {
    assert.ok(keys.includes(key), `词表含标签条键 ${key}`)
  }
  for (const key of CHAT_WORD_KEYS) assert.ok(keys.includes(key), `词表含对话流键 ${key}`)
  for (const key of POOL_WORD_KEYS) assert.ok(keys.includes(key), `词表含活动池键 ${key}`)
  for (const key of APPROVAL_WORD_KEYS) assert.ok(keys.includes(key), `词表含审批卡键 ${key}`)

  const sentinel = (key) => `⟦${key}⟧`
  initDict({
    locale: "en",
    host: Object.fromEntries(keys.map((key) => [key, sentinel(key)])),
    dict: Object.fromEntries(CORE_WORD_KEYS.map((key) => [key, sentinel(key)])),
  })
  ctx.after(() => initDict({}))
  const trees = [
    railTree(railModel({ projectCwd: null, recent: [{ cwd: "C:\\r1" }], rows: [] })),
    railTree(railModel({ projectCwd: "C:\\proj", recent: [], rows: [] })),
    railTree(railModel({
      projectCwd: "C:\\proj", recent: [],
      rows: [row(1, { title: "", createdBy: "cli" }), row(2, { createdBy: "vscode" }), row(3, { createdBy: "desktop" })],
    })),
    tabbarTree(tabbarModel({
      tabs: ["1", "2", "3"], activeTab: "1", rows: [row(2, { title: "" })], badges: { 2: ["running"], 3: ["done"] },
    })),
    // 关闭确认面（本批增）：命中键 ⇒ 两文本键消费面（词面非 aria-label ⇒ 走 texts 面收）
    tabbarTree(tabbarModel({
      tabs: ["1", "2"], activeTab: "1", rows: [row(2, { title: "" })], pendingClose: "2",
    })),
    headTree(headModel({ tab: "1", meta: { provider: "P", model: "M" } })),
    statusTree(statusModel({ tabs: ["1", "2"], activeTab: "1", badges: { 2: ["approval"] } })),
    // 对话流树入量（本批增）：三态 / 五态工具卡 / 摘要块 / 药丸两态 ⇒ 六宿主键 + 五核状态词消费面
    chatTree(chatModel(chatState())),
    chatTree(chatModel(chatState({ blocks: chatBlocks }))),
    chatTree(chatModel(chatState({ blocks: [chatBlocks[0], chatBlocks[1]] }), 1)),
    chatTree(chatModel(chatState({ blocks: [chatBlocks[0]], following: false, pendingNew: 3 }))),
    chatTree(chatModel(chatState({ blocks: [chatBlocks[0]], following: false }))),
    // 活动池树入量（本批增）：三态 + 折叠态 ⇒ 池面七键消费面（读数文本 = 数据面数字串）
    poolTree(poolModel(poolState({ pool: { running: 12, approval: 5, blocks: [], queue: [], approvals: [] } }))),
    poolTree(poolModel(poolState({ poolCollapsed: { "1": true } }))),
    poolTree(poolModel(poolState({
      pool: {
        running: 12, approval: 5, blocks: [{ tool: "Bash", status: "running" }],
        queue: [{ title: "队列一", status: "queued" }], approvals: [approvalSingle, approvalBatch],
      },
    }))),
    poolTree(poolModel(poolState({ activeSession: null }))),
    // 审批卡树入量（本批增）：两形 ⇒ 审批七键消费面（三出口词 × 两形 + 批形计数）
    approvalTree(approvalSingle),
    approvalTree(approvalBatch),
    // 设置面树入量（本批增）：四段三态 / 面头语面两向 / 零候选空态 / 校验失败码 / 服务两形摘要
    settingsTree(settingsModel(settingsReady)),
    settingsTree(settingsModel({ ...settingsFace({ providers: { state: "loading" } }), locale: "zh" })),
    settingsTree(settingsModel(settingsFace({}))),
    settingsTree(settingsModel(settingsFace({ verify: { kind: "fail", reason: "probe-failed" } }))),
    settingsTree(settingsModel(settingsFace({ model: { state: "ready", provider: "p1", current: null, models: [] } }))),
    // 失败码表全键入量（表 = `REASON_WORD` ⇒ 增码即入判据 —— 零硬清单）
    ...Object.keys(REASON_WORD).map((code) => settingsTree(settingsModel(settingsFace({ notice: { scope: "panel", reason: code } })))),
    // 首启向导树入量（本批增）：三步各一树（闸假 ⇒ 向导占槽）⇒ 向导十键消费面
    wizardTree(wizardModel(wizardFace(1))),
    wizardTree(wizardModel(wizardFace(2))),
    wizardTree(wizardModel(wizardFace(3))),
    // 项目级信息行树入量（本批增）：两读数 + 相位 + 门槛三臂 ⇒ 信息行九键消费面
    infoTree(infoModel(infoFace({ counts: { pool: 12, tech: 5, aged: 0 }, thresholdReached: true, phase: "initial-dev" }))),
    infoTree(infoModel(infoFace({ counts: { pool: 12, tech: 5, aged: 0 }, phase: "production" }))),
    infoTree(infoModel(infoFace())),
  ]
  const data = new Set([
    "C:\\r1", "C:\\proj", "标题2", "标题3", "P", "M", "Read", "队列一", "0",
    "正文-u1", "正文-a1", "Bash", "npm test", "a.mjs", "12", "5", "boom",
    // 设置 / 向导 / 信息行面数据串（非哨兵文本 —— 表单选项 / 渠道行 / 字段值 / 服务摘要 / 遮罩值）
    ...FORMATS, "openai", "p1", "p2", "m1", "m2", "p1:m1", "sk-x",
    "agent.maxTurns", "agent.key", "••", "fs", "npx fs", "web", "https://x",
  ])
  const used = new Set()
  for (const tree of trees) {
    for (const node of nodes(tree)) {
      const label = node.props?.["aria-label"]
      if (label === undefined) continue
      assert.ok(label.startsWith("⟦") && label.endsWith("⟧"), `aria-label 须为词表键值（实 = ${label}）`)
      used.add(label.slice(1, -1))
    }
    for (const text of texts(tree)) {
      if (text.startsWith("⟦") && text.endsWith("⟧")) { used.add(text.slice(1, -1)); continue }
      assert.ok(data.has(text), `树内文本须为词表键值或数据串（实 = ${text}）`)
    }
  }
  assert.deepEqual([...used].sort(), [...keys, ...CORE_WORD_KEYS].sort(), "101 宿主键 + 5 核状态键全被消费（键齐 = 用量面）")

  for (const name of [
    "sessions.mjs", "chrome.mjs", "chat.mjs", "chat-stream.mjs", "chat-scroll.mjs", "chat-tool.mjs",
    "approval.mjs", "activity.mjs",
    "settings.mjs", "settings-sections.mjs", "onboarding.mjs", "info-row.mjs",
  ]) {
    const view = stripComments(readFileSync(new URL(`../renderer/views/${name}`, import.meta.url), "utf8"))
    assert.ok(!/\p{Script=Han}/u.test(view), `视图档源零 CJK（面向用户文案全经 t()）：${name}`)
  }
})
