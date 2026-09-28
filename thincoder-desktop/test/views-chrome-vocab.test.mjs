/**
 * views-chrome-vocab.test.mjs — E-2 全量词表键齐 ∧ 零硬编码用例（硬限拆档 · 原住 `test/views-chrome.test.mjs`，
 * 视图族留原档；档行预算 `docs/desktop/design/PROJECT.md` §4.1）：
 * 两语键集相等 ∧ 宿主键 / 核域状态词键全被树面消费（键齐 = 用量面）∧ aria-label 与树内文本全哨兵 ∧ 视图档源零 CJK。
 * 零 CJK 的枚举面 = `renderer/views/` 档集全量（构造性口径）——根下渲染档（如 `renderer/attach.mjs`）不在枚举内（机检结构缺口 · 已登记）。
 * 纪律：本档只读源 + 调纯函数（左列 / 标签条 / 会话头 / 状态栏 / 对话流 / 活动池 / 审批卡 / 提问卡 / 计划卡 / 设置 /
 * 首启向导 / 信息行 / 输入区 / 附件面构树）——**不触真 DOM**；树面判据分住各视图族档，本档只钉键齐链。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { attachmentBar, degradedNotice } from "../renderer/attach.mjs"
import { HOST_DICT, initDict } from "../renderer/i18n.mjs"
import { railModel, railTree, tabbarModel, tabbarTree } from "../renderer/views/sessions.mjs"
import { headModel, headTree, statusModel, statusTree } from "../renderer/views/chrome.mjs"
import { chatModel, chatTree } from "../renderer/views/chat.mjs"
import { poolModel, poolTree } from "../renderer/views/activity.mjs"
import { approvalTree } from "../renderer/views/approval.mjs"
import { questionTree } from "../renderer/views/question.mjs"
import { planTree } from "../renderer/views/plan.mjs"
import { FORMATS, REASON_WORD, settingsModel, settingsTree } from "../renderer/views/settings.mjs"
import { wizardModel, wizardTree } from "../renderer/views/onboarding.mjs"
import { infoModel, infoTree } from "../renderer/views/info-row.mjs"
import { composerModel, composerTree } from "../renderer/mount-composer.mjs"
import { QUEUE_MAX } from "../renderer/queue.mjs"

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

/** 核域状态词键（`thincoder-core/i18n.mjs:50-54` 五键 + `:67` 回合帧键 —— 消费面断言，非本端新键；R3a 增 `status.turn`；
 *  R3c 增 `status.thinking` —— 推理块摘要词；**桌面空闲唤醒批增三键** = 消化行族（`digest.*` 核字典经 `t()` 投影面直取 ——
 *  树面消费前三；`digest.done` / `digest.aborted` = 帧面终态句〔`end` 先更新后摘 —— 非树面消费〕）。 */
const CORE_WORD_KEYS = ["sub.queued", "sub.running", "sub.stopped", "sub.done", "sub.error", "status.turn", "status.thinking",
  "digest.turnLabel", "digest.turnLabelAsk", "digest.start"]
/** 核件复制钮两键（R3c：核 `flow/stream.mjs` `attachCopyButtons` 词键）—— 端供给面：值住核产出 DOM 面
 *  （树面零消费）⇒ 出树消费判据外列（消费面 = `test/views-chat-text.test.mjs` U173）。
 *  「对齐第二批」项 3 / 4 增十键（核 `subblocks/*` 四构件件 / `queued-mark` 两原语 / 端侧助手标签同字面 ——
 *  取值经**注册单点**（`renderer/app.mjs` `setStringsSink(setStrings)`；`initDict` 合并式经注册端出）注入核件，
 *  仍**非树面消费** ⇒ 同列外列；键面在册 = 下行键集锁）。 */
const EXTRA_WORD_KEYS = [
  "msg.copy", "msg.copied", "sub.async", "sub.sync", "sub.waiting", "sub.awaitingApproval",
  "sub.cancelQueueBtn", "sub.stopBtn", "sub.desc", "msg.user", "msg.assistant", "queued.pending",
]
/** 对话流宿主键（批 6 新增六键；批 B ⑧ 复制面 +2、追加轮引导面 +2 —— 复制面两键只走下方树清单消费面）。
 *  「对齐第三批」退场一键 = `chat.empty.hint`（欢迎条三行取代单行提示 —— 树面消费归零，键面随退）。 */
const CHAT_WORD_KEYS = [
  "chat.pill.new", "chat.pill.bottom", "chat.summary.older", "chat.tool.changes", "chat.tool.duration",
  "chat.guide.noProject", "chat.guide.noSession",
]
/** 活动池宿主键（R3b：族标 `pool.family.blocks` ⇒ `pool.family.subagents`；「对齐第二批」项 3：`pool.stop` 退场
 *  —— 自建五段行块面退场 ⇒ ⏹ 词归核件 `sub.stopBtn` —— 共七键）。 */
const POOL_WORD_KEYS = [
  "pool.title", "pool.family.approvals", "pool.family.subagents", "pool.family.queue",
  "pool.collapse", "pool.expand", "pool.empty.hint",
]
/** 审批卡宿主键（本批新增七键 —— 两形三出口 + 批形计数）。 */
const APPROVAL_WORD_KEYS = [
  "approval.once", "approval.always", "approval.reject",
  "approval.batch.approveAll", "approval.batch.deny", "approval.batch.oneByOne", "approval.batch.count",
]

/** 提问卡宿主键（批 A 新增三键 —— 文本控件 aria-label + 提交 / 取消键）。 */
const QUESTION_WORD_KEYS = ["question.input", "question.answer", "question.cancel"]

/** 对话流帧态夹具（U51 消费面 —— 树面判据住 `test/views-chat.test.mjs`）：只给构树消费的键。 */
const chatState = (over = {}) => ({
  activeSession: "s1", blocks: [], history: { hasOlder: false, inFlight: false, page: null },
  following: true, pendingNew: 0, locale: "en", ...over,
})

/** 「对齐第三批」新增词族（视图面词族第二档 = `renderer/i18n-views.mjs`）：已到位 ⇒ 计入键齐 + 全消费
 *  （消费面 = 对话流 / 输入区 / 审批面 / 设置面具名十键 —— 下方树入量同笔补齐）。 */
const ALIGN3_WORD_KEYS = [
  "tool.interrupted", "error.retry", "welcome.heading", "welcome.text", "welcome.textConfigured", "welcome.shortcuts",
  "composer.send.failed", "paste.unsupportedFormat", "approval.diff.large",
  "settings.agent.maxTurns", "settings.agent.subagentTurns", "settings.agent.poolLimits.engCoder",
  "settings.agent.poolLimits.other", "settings.agent.poolLimits.advisor", "settings.agent.compactThreshold",
  "settings.agent.verifyGuard", "settings.agent.consultTurns", "settings.agent.consultTimeoutMs", "settings.agent.advisorEffort",
]

/** 活动池 / 审批卡帧态夹具（U51 消费面 —— 树面判据住 `views-activity` / `views-approval` 两档）。
 *  R3b：池切片摘 `blocks`（工具行）⇒ 子 agent 块表 `subBlocks`（按会话键分槽）。 */
const poolState = (over = {}) => ({
  activeSession: "s1", activeTab: "1", poolCollapsed: {}, subBlocks: {},
  pool: { running: 0, approval: 0, queue: [], approvals: [] }, ...over,
})
/** 子 agent 块夹具（R3b 消费面 —— 块头四段 + 状态词 + 停止钮词）。 */
const subBlock = (over = {}) => ({
  key: "sub:eng-coder#1", role: "eng-coder", id: 1, model: "m-block", startedAt: 1000, doneAt: null,
  turn: 2, maxTurns: 4, status: "running", pool: true, syncLive: false, queued: false, frozen: false, ...over,
})
const approvalSingle = {
  promptId: "p1", shape: "single", tool: "Bash", argsSummary: "npm test",
  changes: { items: [{ path: "a.mjs", insertions: 12, deletions: 5 }] },
}
const approvalBatch = { promptId: "p2", shape: "batch", batch: { count: 3, tools: ["Bash", "Read"] } }
const chatBlock = (kind, id, over = {}) => ({ kind, id, text: `正文-${id}`, ...over })
const chatTool = (id, status, over = {}) => ({ kind: "tool", id, name: "Bash", argsSummary: "npm test", status, ...over })
/** 五态工具卡 + 三文本块 + 错误横幅块（消费面：五状态词 / 改动摘要 / 耗时 / 结果区 + R3c 推理块 +「对齐第三批」
 *  中止词 `interrupted` / 错误横幅重试键 / 摘要段两例）。 */
const chatBlocks = [
  chatBlock("user", "u1"),
  chatBlock("assistant", "a1"),
  { kind: "reasoning", id: "r1", text: "想-r1" },
  chatTool("t1", "done", { durationMs: 1500, changes: { items: [{ path: "a.mjs", insertions: 12, deletions: 5 }] } }),
  chatTool("t2", "queued"),
  chatTool("t3", "running"),
  chatTool("t4", "stopped"),
  chatTool("t5", "error", { durationMs: 2400, result: "boom" }),
  chatTool("t6", "interrupted", { durationMs: 800 }),
  { kind: "error", id: "e1", text: "崩", techInfo: "stack: line" },
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
  // 档位行可解面（U51 消费面 = `settings.model.tier` / `effort.off`）：`defaultModel` 两段可解 + 渠道行携 `effort` 现值 + 模型候选携 `effortEnum` / `thinkOff`。
  defaultModel: "p1:m1",
  providers: {
    state: "ready", presets: [{ name: "openai" }],
    providers: [
      { name: "p1", model: "m1", effort: "high", hasKey: true, maskedKey: "sk-x", active: true },
      { name: "p2", model: null, hasKey: false, active: false },
    ],
  },
  verify: { kind: "ok", count: 2 },
  model: {
    state: "ready", provider: "p1", current: "p1:m1",
    models: [{ id: "m1", effortEnum: ["low", "high"], thinkOff: true }, { id: "m2", effortEnum: [], thinkOff: false }],
  },
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

// ─── U51 词表键齐 ∧ 零硬编码（全量）────────────────────────

test("U51: 词表键齐 ∧ 零硬编码（两语宿主键键集相等 ∧ 全量与 aria-label 全哨兵 ∧ 二十三视图档零 CJK）", (ctx) => {
  const dictKeys = Object.keys(HOST_DICT.en)
  // 键数 = 量面锁（**不写死**：数值以盘上实读为准，非设计值 —— 家族链逐舱累进，增键须同改本行与下行链面）。
  assert.equal(
    dictKeys.length, 17 + 4 + 9 + 7 + 7 + 3 + 49 + 10 + 9 + 6 + 3 + 2 + 1 + 16 + 2 + 10 + 3 + 19,
    "宿主键数 = 177（左列 17 + 标签条 4 + 对话流 9 + 活动池 7 + 审批卡 7 + 提问卡 3 + 设置 49 + 首启向导 10 + 信息行 9 + 输入区 6 + 会话头 3 + 档位 2 + 状态栏 1 + 状态行 16 + 核件复制钮 2 + 核件子 agent 词键与说话人 / 待发送 10 + 桌面空闲唤醒批 `susp.*` 3 + **「对齐第三批」视图面词族第二档 19**）；退场两键 不计入（「对齐第二批」`pool.stop` · 「对齐第三批」`chat.empty.hint`）",
  )
  const keys = dictKeys
  assert.deepEqual([...Object.keys(HOST_DICT.zh)].sort(), [...dictKeys].sort(), "两语键集相等（增键两语同增）")
  for (const key of ["tab.badge.approval", "tab.action.close", "tab.action.close.cancel", "tab.action.close.confirm"]) {
    assert.ok(keys.includes(key), `词表含标签条键 ${key}`)
  }
  for (const key of CHAT_WORD_KEYS) assert.ok(keys.includes(key), `词表含对话流键 ${key}`)
  for (const key of POOL_WORD_KEYS) assert.ok(keys.includes(key), `词表含活动池键 ${key}`)
  for (const key of APPROVAL_WORD_KEYS) assert.ok(keys.includes(key), `词表含审批卡键 ${key}`)
  for (const key of QUESTION_WORD_KEYS) assert.ok(keys.includes(key), `词表含提问卡键 ${key}`)
  for (const key of ALIGN3_WORD_KEYS) assert.ok(keys.includes(key), `词表含「对齐第三批」词族键 ${key}`)

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
    // 左列换形两面（批 A ④）：取消键 / 确认键只在形面在场 ⇒ 两形各一树（确认键词面 = 本条动作词 —— 同键入判据）
    railTree(railModel({ projectCwd: "C:\\proj", recent: [], rows: [row(2), row(3)] }), {}, { key: "2", mode: "rename" }),
    railTree(railModel({ projectCwd: "C:\\proj", recent: [], rows: [row(2), row(3)] }), {}, { key: "2", mode: "delete" }),
    // 账本警示行（账本可靠批 · 桌面微轮 / 修正轮）：注记在场（`scene = true` ⇒ 条件附句）⇒ `rail.ledger.notice` +
    // `rail.ledger.notice.scene` 两键消费面（构树 / 文案两向判据住 `test/views.test.mjs` U181）
    railTree(railModel({ projectCwd: "C:\\proj", recent: [], rows: [row(2)], ledger: { refused: 1, reason: "readback-failed", scene: true } })),
    tabbarTree(tabbarModel({
      tabs: ["1", "2", "3"], activeTab: "1", rows: [row(2, { title: "" })], badges: { 2: ["running"], 3: ["done"] },
    })),
    // 关闭确认面（本批增）：命中键 ⇒ 两文本键消费面（词面非 aria-label ⇒ 走 texts 面收）
    tabbarTree(tabbarModel({
      tabs: ["1", "2"], activeTab: "1", rows: [row(2, { title: "" })], pendingClose: "2",
    })),
    headTree(headModel({ tab: "1", meta: { provider: "P", model: "M" } })),
    // 状态栏读数面（批 B ⑤ 键）：活动键读数 ⇒ 读数节点在场 ⇒ `status.usage` 消费面（题面经 `t()` 参数插值，读数 = `data-usage` 属性面）
    statusTree(statusModel({ tabs: ["1", "2"], activeTab: "1", badges: { 2: ["approval"] }, usage: { "1": 60 } })),
    // 对话流树入量（本批增）：三态 / 五态工具卡 / 摘要块 / 药丸两态 ⇒ 六宿主键 + 五核状态词消费面；
    // 追加轮增引导面两码（无项目 / 无会话）⇒ `chat.guide.*` 两键消费面（树面判据住 `test/views-chat-guide.test.mjs`）；
    // 「对齐第三批」：`no-message` 帧 ⇔ 欢迎条三行（该项增词键消费面；文案二值两树各取一）
    chatTree(chatModel(chatState())),
    chatTree(chatModel(chatState({ settings: { configured: true } }))),
    chatTree(chatModel(chatState({ blocks: chatBlocks }))),
    chatTree(chatModel(chatState({ blocks: [chatBlocks[0], chatBlocks[1]] }), 1)),
    chatTree(chatModel(chatState({ blocks: [chatBlocks[0]], following: false, pendingNew: 3 }))),
    chatTree(chatModel(chatState({ blocks: [chatBlocks[0]], following: false }))),
    chatTree(chatModel(chatState({ activeSession: null }))),
    chatTree(chatModel(chatState({ activeSession: null, project: { cwd: "C:\\proj" } }))),
    // 活动池树入量（本批增）：三态 + 折叠态 ⇒ 池面八键消费面（读数文本 = 数据面数字串；R3b：块面 + 停止钮）
    poolTree(poolModel(poolState({ pool: { running: 12, approval: 5, queue: [], approvals: [] } }))),
    poolTree(poolModel(poolState({ poolCollapsed: { "1": true } }))),
    poolTree(poolModel(poolState({
      subBlocks: { s1: [subBlock()] },
      pool: {
        running: 12, approval: 5,
        queue: [{ title: "队列一", status: "queued" }], approvals: [approvalSingle, approvalBatch],
      },
    }))),
    poolTree(poolModel(poolState({ activeSession: null }))),
    // 审批卡树入量（本批增）：两形 ⇒ 审批七键消费面（三出口词 × 两形 + 批形计数）；
    // 「对齐第三批」相抵①：超阈 diff 树 ⇒ `approval.diff.large` 消费面（头行字面 = 工具名 —— 数据串）
    approvalTree(approvalSingle),
    approvalTree(approvalBatch),
    approvalTree({
      promptId: "p3", shape: "single", tool: "apply_patch", argsSummary: "a.mjs",
      diff: { patch: ["@@ -1 +1 @@", ...Array.from({ length: 24 }, (_, i) => `+line${i}`)].join("\n") },
    }),
    // 提问卡 / 计划卡树入量（本批增）：给答项 + 作答区 ⇒ 提问三键消费面（aria-label + 两键）；事项行状态词 ⇒ 核域三键消费面
    questionTree({ promptId: "q1", question: "走哪条路？", options: ["甲", "乙"] }),
    planTree([{ title: "第一步", status: "pending" }, { title: "第二步", status: "in_progress" }, { title: "第三步", status: "done" }]),
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
    // 输入区树入量（本批增）：两态 + 满队 ⇒ 输入区三键消费面（树形判据 = U118）
    composerTree(composerModel({ activeSession: "1", pending: {} }), { onKeyDown: () => {}, onInterrupt: () => {} }),
    composerTree(composerModel({ activeSession: null, pending: {} }), {}),
    // 「对齐第三批」两提示面（项 22 / 26）⇒ 两新键消费面（未配 / 未到位时两树同构，键齐两向同除）
    composerTree(composerModel({ activeSession: "1", pending: {} }, { unsupported: "image/svg+xml", failed: "provider-invalid" }), { onKeyDown: () => {} }),
    composerTree(composerModel({
      activeSession: "1",
      pending: { "1": Array.from({ length: QUEUE_MAX }, () => ({ text: "队列一", ts: 1 })) },
    }), { onKeyDown: () => {} }),
    // 附件面 / 末条复制面树入量（批 B ⑧ · 本舱增）：附件条（缩略图 + 文件名 + 移除控件）+ 降级提示行两值 ⇒ 附件三键消费面；
    // 末 `assistant` 块有文本 ⇒ 输入区尾控件在场 ⇒ `chat.action.copyLast` 消费面（零 handler 面 ⇒ 控件 `disabled` 仍在场）
    attachmentBar([{ id: "a1", name: "pic.png", mime: "image/png", dataURL: "data:image/png;base64,AAA" }], { onRemoveAttachment: () => {} }),
    degradedNotice("non-vision"),
    degradedNotice("partial"),
    composerTree(composerModel({ activeSession: "1", pending: {}, blocks: [{ kind: "assistant", text: "正文-a1" }] }), {}),
    // 状态行读数入量（批 B · 项 3）：活动键读数 > 0 ⇒ 读数节点（`status.usage` 消费面）
    statusTree(statusModel({ tabs: ["1", "2"], activeTab: "1", badges: { 2: ["running"] }, usage: { 1: 62 } })),
    statusTree(statusModel({ tabs: ["1", "2"], activeTab: "1", badges: { "1": ["running", "approval"] }, usage: { "1": 85 }, sessions: [row(1, { title: "" })], pending: {}, blocks: [chatTool("t1", "running")], tasks: { "1": [{ status: "done" }, { status: "pending" }] }, turns: { "1": { n: 2, max: 8 } }, turnStarts: { "1": 1 }, now: 5000, tokens: { "1": { prompt: 1200, completion: 300, reasoningTokens: 40, cacheHit: 6, cacheMiss: 4 } }, timers: { "1": { count: 2, expired: 1 } }, projectInfo: { thresholdReached: true } })), // 状态行（承载 16 段）：满场一树 —— 十二个段词键消费面（段判据住 `test/views-statusline.test.mjs`）
    statusTree(statusModel({ tabs: ["1"], activeTab: "1", badges: { "1": ["running"] }, pending: { "1": [{ text: "队列一", ts: 1 }] } })), // 段 14 源 = 本会话队（「对齐第二批」项 2 —— 右列队列族不再承载）
    // D22 状态行段集 16（banner 四段 + 静息两段）：模式位四布尔全真 ⇒ banner 四段在场 + 静息词 / 输入提示静息态 —— 本批六新键消费面
    statusTree(statusModel({ tabs: ["1"], activeTab: "1", sessionFlags: { "1": { planMode: true, autoApprove: true, advisorGuard: true, engineering: true } } })),
    // 部分模式位（单键真 · 余缺）：banner 四段逐码在场（非全量面 —— 与上行对拍）
    statusTree(statusModel({ tabs: ["1"], activeTab: "1", badges: { "1": ["running", "approval"] }, sessionFlags: { "1": { engineering: true } } })),
    // 挂起句三键消费面（桌面空闲唤醒批 —— 段 3 支①三支各一树：N > 0 / N = 0 ∧ M > 0 / 双零；
    //   三键取词链互斥 —— 合成式（「 · 」分隔）不入本清单，逐支覆盖即键齐）
    statusTree(statusModel({ tabs: ["1"], activeTab: "1", susp: { "1": { active: true, running: 2, queued: 1 } } })),
    statusTree(statusModel({ tabs: ["1"], activeTab: "1", susp: { "1": { active: true, pending: 1 } } })),
    statusTree(statusModel({ tabs: ["1"], activeTab: "1", susp: { "1": { active: true } } })),
    // 消化行族消费面（桌面空闲唤醒批 —— 流内非块节点组两档）：起跑通用档 + ask 档（`digest.turnLabelAsk`）
    chatTree(chatModel(chatState({ blocks: [chatBlocks[0]], digest: { s1: { status: "start", n: 1 } } }))),
    chatTree(chatModel(chatState({ blocks: [chatBlocks[0]], digest: { s1: { status: "start", n: 0, tier: "ask", from: "coder#2", msg: "要不要改？" } } }))),
  ]
  const data = new Set([
    "C:\\r1", "C:\\proj", "标题2", "标题3", "P", "M", "Read", "队列一", "0",
    "正文-u1", "正文-a1", "Bash", "npm test", "a.mjs", "12", "5", "boom", "apply_patch",
    // 「对齐第三批」两字面：工具卡摘要段（项 1 —— `→ ` + 核 `formatToolSummary` 直取；核字面非词键）+ 错误横幅
    // `summary` 字面（项 9 —— 核 `flow/block.mjs:138` 同字面；核 / VSC 两源无此词键）+ `techInfo` 原文逐字
    "→ Bash: boom", "Details", "stack: line",
    // 提问卡 / 计划卡面数据串（题干 / 给答项 / 事项标题 —— 非哨兵文本）
    "走哪条路？", "甲", "乙", "第一步", "第二步", "第三步",
    // 设置 / 向导 / 信息行面数据串（非哨兵文本 —— 表单选项 / 渠道行 / 字段值 / 服务摘要 / 遮罩值）
    ...FORMATS, "openai", "p1", "p2", "m1", "m2", "p1:m1", "sk-x",
    "agent.maxTurns", "agent.key", "••", "fs", "npx fs", "web", "https://x",
    // 档位面数据串（非哨兵文本 —— 渠道行 `effort` 现值 + 逐模型档位枚举）
    "low", "high",
    // 附件面数据串（非哨兵文本 —— 粘贴文件名）
    "pic.png",
    // 子 agent 块面数据串（非哨兵文本 —— 角色 / 型号）
    "eng-coder", "m-block",
    // 账本注记合成分隔符（`scene = true` 树入量 —— 按当前 locale 直取；本档注入 locale = en ⇒ 「; 」）
    "; ",
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
  const expected = keys.filter((key) => !EXTRA_WORD_KEYS.includes(key))
  assert.deepEqual([...used].sort(), [...expected, ...CORE_WORD_KEYS].sort(), "宿主键（树消费面）+ 核状态键全被消费（键齐 = 用量面；核件词键十二 = 挂载面消费，出本判 —— 对齐第三批 19 键全数入树）")

  for (const name of [
    "sessions.mjs", "tabbar.mjs", "chrome.mjs", "chat.mjs", "chat-stream.mjs", "chat-scroll.mjs", "chat-tool.mjs", "chat-copy.mjs",
    "chat-cards.mjs", "chat-text.mjs", "chat-guide.mjs", "chat-pending.mjs", "chat-subagent.mjs", "statusline.mjs", "statusline-banner.mjs",
    "approval.mjs", "activity.mjs",
    "settings.mjs", "settings-sections.mjs", "onboarding.mjs", "info-row.mjs",
    "question.mjs", "plan.mjs",
  ]) {
    const view = stripComments(readFileSync(new URL(`../renderer/views/${name}`, import.meta.url), "utf8"))
    assert.ok(!/\p{Script=Han}/u.test(view), `视图档源零 CJK（面向用户文案全经 t()）：${name}`)
  }
})
