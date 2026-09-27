/**
 * render-core-components.test.mjs — 核**构件层（DOM）**用例宿主（消费端套件——设计
 * `docs/render-core/design/RENDER-CORE.md` §6：「DOM 构件层用例宿主 = 消费端套件（非核包）：
 * VSC = `thincoder-vscode/test/**`（happy-dom devDep 既有）」；核包自身零 devDep，不引 happy-dom）。
 *
 * 对象 = R2 换接的**核构件件**（`flow/*` · `cards/*` · `subblocks/*` · `toast.mjs`）——平 node
 * 直测面（纯函数 / 态机）在核包 `test/**`；本档只测 DOM 输出面（结构 / 类名 / data 面 / 出站
 * 载荷 / 事件接线）与两端共用的注入面（`deps.emit` / `deps.t` / `deps.now`）。
 * 路径形 = 消费端接入形（各 shim 同款：`node_modules/@thincoder/render-core/...`）。
 */
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import { setupWebview } from "./helpers/webview-env.mjs"

let cleanupEnv
let t

before(async () => {
  const env = setupWebview()
  cleanupEnv = env.cleanup
  t = (await import("../webview/i18n.js")).t
})

after(() => {
  try { window.dispatchEvent(new window.Event("unload")) } catch { /* happy-dom teardown edge */ }
  cleanupEnv()
})

const core = (p) => import(`../node_modules/@thincoder/render-core/${p}`)

// ─── flow/block.mjs：块容器 / 用户气泡 / 恢复帧 / 错误横幅 ────────────────

test("RC-B1 `renderBlock`：空助手块（idx 锚 + 单回合标签一次）；无 label 形零 label", async () => {
  const { renderBlock } = await core("flow/block.mjs")
  const withLabel = renderBlock({ idx: 7, withLabel: true })
  assert.equal(withLabel.className, "message assistant", "类名承现行名（KD-RC-7）")
  assert.equal(withLabel.dataset.idx, "7", "窗口裁剪锚 = data-idx")
  assert.equal(withLabel.querySelector(".msg-label").textContent, `❯ ${t("msg.assistant")}:`, "标签行字面 = locale 键")
  const bare = renderBlock({ idx: 8 })
  assert.equal(bare.querySelector(".msg-label"), null, "无 label 形零标签行")
})

test("RC-B2 `buildUserMessage`：raw/ts/idx 数据面 + 转义闸（原始文本入 mdInline 单点）", async () => {
  const { buildUserMessage } = await core("flow/block.mjs")
  const el = buildUserMessage("<img src=x onerror=alert(1)> a.mjs", 1700000000000, 3)
  assert.equal(el.className, "message user")
  assert.equal(el.dataset.raw, "<img src=x onerror=alert(1)> a.mjs", "标记面锚定源 = 原文逐字")
  assert.equal(el.dataset.ts, "1700000000000", "清标重建标签行用")
  assert.equal(el.dataset.idx, "3")
  assert.equal(el.querySelector("img"), null, "转义闸：注入样本零节点（字面文本）")
  assert.ok(el.querySelector(".bubble").textContent.includes("<img src=x onerror=alert(1)> a.mjs"), "原始文本逐字可见")
  const noTs = buildUserMessage("hi", undefined, undefined)
  assert.equal(noTs.dataset.ts, undefined, "无 ts 不落 ts 面（不假显示）")
  assert.equal(noTs.dataset.idx, undefined, "无 idx 不落 idx 面")
})

test("RC-B3 `buildAssistantRestore`：label（turnStart）→ reasoning → 正文 → 嵌套完成卡（卡不携 data-idx）", async () => {
  const { buildAssistantRestore } = await core("flow/block.mjs")
  const el = buildAssistantRestore({
    idx: 12, turnStart: true, reasoning: "思考 **要点**", text: "答句",
    tools: [{ id: "t1", name: "read", args: '{"path":"a.mjs"}', result: "[stdout]:\nok" }],
  })
  assert.equal(el.dataset.idx, "12", "帧锚只外层消息")
  assert.equal(el.querySelector(".msg-label").textContent, `❯ ${t("msg.assistant")}:`)
  assert.ok(el.querySelector("details.reasoning-block[open]"), "推理块（open）")
  assert.ok(el.querySelector(".bubble.content").textContent.includes("答句"))
  const card = el.querySelector(".tool-call")
  assert.ok(card, "嵌套完成卡在场")
  assert.equal(card.dataset.toolId, "t1")
  assert.equal(card.dataset.idx, undefined, "卡不携 data-idx（分页锚只外层）")
  assert.equal(buildAssistantRestore({ text: "" }).querySelector(".bubble.content"), null, "空正文不建 bubble")
})

test("RC-B4 `renderErrorBanner`：错误文本 + Details + `retry` 唯一出站经 deps.emit", async () => {
  const { renderErrorBanner } = await core("flow/block.mjs")
  const sent = []
  const err = renderErrorBanner("坏了 <b>", "stack…", { emit: (type, payload) => sent.push([type, payload]) })
  assert.equal(err.className, "error-banner")
  assert.equal(err.querySelector(".error-text").textContent, "坏了 <b>", "转义闸（注入样本入文本节点）")
  assert.ok(err.querySelector("details.error-details pre").textContent.includes("stack…"))
  err.querySelector(".error-retry-btn").dispatchEvent(new window.MouseEvent("click", { bubbles: true }))
  assert.deepEqual(sent, [["retry", {}]], "出站载荷逐字（VSC 端绑 postMessage / 桌面绑 invoke）")
  const noTech = renderErrorBanner("x", null, {})
  assert.equal(noTech.querySelector(".error-details"), null, "无技术信息不出 Details")
})

// ─── flow/tool-card.mjs：活卡三面 + linkify ──────────────────────────

test("RC-T1 `renderToolCard` + `finishToolCard`：建卡面 / 结算（耗时 + 摘要 + 成功折叠）；错误面展开 + 红字", async () => {
  const { renderToolCard, finishToolCard } = await core("flow/tool-card.mjs")
  let now = 1000
  const { el, ref } = renderToolCard({ name: "read", args: '{"path":"a.mjs"}', id: "c1", now: () => now })
  assert.equal(el.className, "tool-call")
  assert.equal(el.dataset.toolId, "c1", "id 优先 / 无 id 回落 name")
  assert.equal(el.dataset.startTime, "1000", "起刻单点取（now 可注入 = 测试缝）")
  assert.equal(ref.done, false, "未结算")
  assert.equal(el.querySelector(".tool-call-status").textContent, t("tool.running"))
  assert.equal(el.querySelector(".tool-call-body").textContent, t("tool.initial"))
  assert.equal(el.querySelector(".tool-call-header").getAttribute("aria-expanded"), "false")
  // 成功结算：折叠 + 绿字 + 摘要 + 耗时
  now = 1400
  finishToolCard(ref, "read", "[stdout]:\nok\n\n(exit code 0)", [], false, { now: () => now })
  assert.equal(ref.done, true, "结算唯一写点")
  assert.ok(el.querySelector(".tool-call-status").textContent.startsWith(t("tool.done")), "成功态词")
  assert.ok(el.querySelector(".tool-call-status").textContent.includes("400ms"), "耗时 = now - startTime")
  assert.equal(el.querySelector(".tool-call-status").style.color, "#4ec9b0", "成功绿")
  assert.equal(el.querySelector(".tool-call-body").classList.contains("open"), false, "成功自动折叠")
  assert.equal(el.querySelector(".tool-call-header").getAttribute("aria-expanded"), "false")
  // 错误结算：展开 + 红字 + 截断标记
  const bad = renderToolCard({ name: "bash", args: "{}", id: "c2" })
  finishToolCard(bad.ref, "bash", "[stderr]:\nboom\n\n(exit code 1)", [], true, {})
  assert.equal(bad.el.querySelector(".tool-call-body").classList.contains("open"), true, "错误保持展开")
  assert.equal(bad.el.querySelector(".tool-call-status").style.color, "#f14c4c", "失败红")
  assert.ok(bad.el.querySelector(".tool-call-summary").textContent.includes(t("tool.truncated")), "旗标驱动截断标记")
})

test("RC-T2 `renderToolHistory` 与 `linkifyPaths`：历史折叠卡 + 文件链接 span（data-path/line）", async () => {
  const { renderToolHistory, linkifyPaths } = await core("flow/tool-card.mjs")
  const card = renderToolHistory("read", "10 lines", 42)
  assert.equal(card.dataset.toolId, "hist-42")
  assert.equal(card.dataset.idx, "42", "lazy-load 分页锚")
  assert.ok(card.querySelector(".tool-call-summary").textContent.includes("→"), "摘要行在场")
  const body = document.createElement("div")
  body.textContent = "see src/a.mjs:12 and src/a.mjs again"
  linkifyPaths(body, [{ raw: "src/a.mjs", path: "src/a.mjs", line: 12 }])
  const links = [...body.querySelectorAll("span.file-link")]
  assert.ok(links.length >= 1, "链接 span 在场（文本节点级包裹）")
  assert.equal(links[0].dataset.path, "src/a.mjs")
  assert.equal(links[0].dataset.line, "12")
  assert.equal(links[0].getAttribute("role"), "link")
  linkifyPaths(body, []) // 缺省早退（无 links ⇒ 零动作）
})

// ─── cards/*：审批 / 提问 / 面板 ──────────────────────────────────

test("RC-C1 `renderApprovalCard`：三出口载荷（approve / approve-all / deny）+ openDiff 转口 + owner 行", async () => {
  const { renderApprovalCard } = await core("cards/permission.mjs")
  const sent = []
  const bigDiff = { patch: Array.from({ length: 30 }, (_, i) => `+line ${i}`).join("\n") }
  const el = renderApprovalCard({ tool: "write", args: "{}", promptId: 7, owner: "coder#1", diff: bigDiff }, { emit: (type, payload) => sent.push([type, payload]) })
  assert.equal(el.className, "permission-prompt")
  assert.equal(el.dataset.promptId, "7", "host 按 id 路由 / 释放清扫")
  assert.equal(el.getAttribute("role"), "alert")
  assert.ok(el.querySelector(".perm-owner").textContent.includes("coder#1"), "owner 非空 ⇒ `<owner> · <tool>` 形")
  el.querySelector(".view-diff").dispatchEvent(new window.MouseEvent("click", { bubbles: true }))
  assert.deepEqual(sent.at(-1)[0], "openDiff", "大 diff ⇒ 原生查看器转口")
  el.querySelector(".approve").dispatchEvent(new window.MouseEvent("click", { bubbles: true }))
  assert.deepEqual(sent.at(-1), ["permissionResponse", { approved: true, promptId: 7 }], "approve 载荷（携 promptId）")
  assert.equal(el.isConnected, false, "作答即自移除")
  const el2 = renderApprovalCard({ tool: "bash", args: "x", promptId: 9 }, { emit: (type, payload) => sent.push([type, payload]) })
  el2.querySelector(".approve-all").dispatchEvent(new window.MouseEvent("click", { bubbles: true }))
  assert.deepEqual(sent.at(-1), ["permissionResponse", { approved: "approveAll", promptId: 9 }])
  const el3 = renderApprovalCard({ tool: "bash", args: "" }, { emit: (type, payload) => sent.push([type, payload]) })
  el3.querySelector(".deny").dispatchEvent(new window.MouseEvent("click", { bubbles: true }))
  assert.deepEqual(sent.at(-1), ["permissionResponse", { approved: false }], "deny 载荷（无 promptId 不带键）")
})

test("RC-C2 `renderBatchApprovalCard`：三 choice + 同族 promptId（同移除选择器）", async () => {
  const { renderBatchApprovalCard } = await core("cards/permission.mjs")
  const sent = []
  const el = renderBatchApprovalCard({ count: 3, tools: [{ name: "read" }, { name: "write" }], promptId: 5 }, { emit: (type, payload) => sent.push([type, payload]) })
  assert.equal(el.dataset.promptId, "5")
  assert.ok(el.querySelector(".permission-prompt-text").textContent.includes("3"), "批量文案携 count")
  for (const [sel, choice] of [[".approve-all", "approveAll"], [".one-by-one", "oneByOne"], [".deny", "deny"]]) {
    const card = renderBatchApprovalCard({ count: 1, tools: [{ name: "read" }], promptId: 6 }, { emit: (type, payload) => sent.push([type, payload]) })
    card.querySelector(sel).dispatchEvent(new window.MouseEvent("click", { bubbles: true }))
    assert.deepEqual(sent.at(-1), ["batchPermissionResponse", { choice, promptId: 6 }], `${sel} 载荷`)
  }
})

test("RC-C3 `renderQuestionCard`：选项列 + 自由文本 + 取消（answer null）+ onAnswered", async () => {
  const { renderQuestionCard } = await core("cards/question.mjs")
  const sent = []
  const answered = []
  const mk = () => renderQuestionCard({ question: "选哪个？", options: ["甲", "乙"], promptId: 4 },
    { emit: (type, payload) => sent.push([type, payload]), onAnswered: (v) => answered.push(v) })
  const el = mk()
  assert.equal(el.className, "question-card")
  assert.equal(el.dataset.promptId, "4")
  assert.equal(el.querySelectorAll(".question-options .question-option").length, 2, "选项各占一行")
  el.querySelectorAll(".question-option")[1].dispatchEvent(new window.MouseEvent("click", { bubbles: true }))
  assert.deepEqual(sent.at(-1), ["questionResponse", { answer: "乙", promptId: 4 }], "选项作答载荷")
  assert.deepEqual(answered, ["乙"], "onAnswered 回焦口")
  // 自由文本：Enter 提交（空文本零动作）
  const el2 = mk()
  const input = el2.querySelector(".question-input")
  input.value = "  "
  input.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Enter", bubbles: true }))
  assert.equal(sent.length, 1, "空文本零上报")
  input.value = "自答"
  input.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Enter", bubbles: true }))
  assert.deepEqual(sent.at(-1), ["questionResponse", { answer: "自答", promptId: 4 }])
  // 取消 ⇒ answer null
  const el3 = mk()
  el3.querySelector(".deny").dispatchEvent(new window.MouseEvent("click", { bubbles: true }))
  assert.deepEqual(sent.at(-1), ["questionResponse", { answer: null, promptId: 4 }], "取消 = answer null")
  // 无 options ⇒ 零选项容器（纯自由文本）
  assert.equal(renderQuestionCard({ question: "x" }, {}).querySelector(".question-options"), null, "无选项不建容器")
})

test("RC-C4 面板构件：显隐判据（纯函数）+ 体片段输出（panel-desc 在场 / 不显示时 el=null）", async () => {
  const { renderTaskPanel, renderGoalPanel, taskPanelVisible, goalPanelVisible } = await core("cards/panel.mjs")
  assert.equal(taskPanelVisible({ items: [] }, false), false, "无 items ⇒ 不显示")
  assert.equal(taskPanelVisible({ items: [{ status: "done" }] }, false), false, "全完成且未显示 ⇒ 不新示")
  assert.equal(taskPanelVisible({ items: [{ status: "done" }] }, true), true, "全完成且已显示 ⇒ 照常重渲")
  assert.equal(goalPanelVisible(null), false)
  assert.equal(goalPanelVisible({ objective: "x" }), true)
  const task = renderTaskPanel({ items: [{ title: "步一", status: "in_progress" }, { title: "步二", status: "pending" }], total: 2 }, {})
  assert.equal(task.visible, true)
  assert.ok(task.el.querySelector(".panel-desc"), "体片段含说明句（DOM 构件——端 replaceChildren）")
  assert.equal(task.el.querySelectorAll(".task-item").length, 2, "逐条 item")
  assert.ok(task.el.textContent.includes(t("task.in_progress")), "in_progress 走 locale 词")
  const hidden = renderTaskPanel({ items: [] }, {})
  assert.deepEqual(hidden, { el: null, visible: false }, "不显示 ⇒ el=null（端只隐藏、不擦既有内容）")
  const goal = renderGoalPanel({ objective: "目标", criteria: "标准", status: "active" }, {})
  assert.ok(goal.el.querySelector(".goal-status-badge.active"), "状态徽标类名逐字承源档")
})

// ─── flow/{reasoning,stream,ledger-line}.mjs + subblocks/block.mjs ────────────

test("RC-S1 `renderReasoning`：details.reasoning-block[open] + 内容区 md 渲染（无 text ⇒ 空内容区）", async () => {
  const { renderReasoning } = await core("flow/reasoning.mjs")
  const { el, content } = renderReasoning({ text: "**要点**" })
  assert.equal(el.className, "reasoning-block")
  assert.equal(el.open, true)
  assert.equal(el.querySelector("summary").textContent, `${t("status.thinking")}...`)
  assert.equal(content.className, "reasoning-content")
  assert.ok(content.querySelector("strong"), "md 渲染（live 流式面由重渲器逐帧写入）")
  assert.equal(renderReasoning({}).content.childNodes.length, 0, "无 text ⇒ 空内容区")
})

test("RC-S2 `createStreamRenderer`：一帧一渲 + ≥50ms 节流跳帧重排 + flush 同步尾帧 + 子块跟滚脏集", async () => {
  const { createStreamRenderer, STREAM_RENDER_MIN_MS } = await core("flow/stream.mjs")
  const frames = []
  let now = 0
  let tokenRaw = "a"
  const scrolls = []
  const r = createStreamRenderer({
    raf: (cb) => frames.push(cb),
    now: () => now,
    token: () => ({ el: bubble, raw: tokenRaw }),
    subScroll: (blocks) => scrolls.push(blocks.length),
  })
  const bubble = document.createElement("div")
  r.markToken()
  r.markToken()
  assert.equal(frames.length, 1, "帧间多次置脏只排一帧")
  now = 1000
  frames.shift()()
  assert.ok(bubble.innerHTML.includes("a"), "帧内渲染到目标")
  // 节流窗内：跳帧 + 继续排队（尾 chunk 不丢）
  tokenRaw = "ab"
  r.markToken()
  now = 1000 + STREAM_RENDER_MIN_MS - 1
  frames.shift()()
  assert.equal(frames.length, 1, "距上次渲染 <50ms ⇒ 跳过一次并重排")
  now = 1000 + STREAM_RENDER_MIN_MS
  frames.shift()()
  assert.ok(bubble.innerHTML.includes("ab"), "重排帧补渲（脏位未清）")
  // flush：同步渲，无需帧
  tokenRaw = "abc"
  r.markToken()
  r.flush()
  assert.ok(bubble.innerHTML.includes("abc"), "flush 同步尾帧（回合尾兜底）")
  assert.equal(frames.length, 1, "脏位已清 ⇒ 帧内零重渲（flush 后帧仍排队但无脏）")
  frames.shift()()
  r.markSubScroll({})
  r.markSubScroll({})
  now += 100
  frames.shift()()
  assert.deepEqual(scrolls, [2], "子代理块跟滚脏集去重后逐批应用")
})

test("RC-S3 `attachCopyButtons`：幂等挂钮 + 点击写剪贴板（2.6s 复位计时器隔离）", async () => {
  const { attachCopyButtons } = await core("flow/stream.mjs")
  const container = document.createElement("div")
  container.innerHTML = '<pre class="code-block"><code>let a = 1</code></pre>'
  const copied = []
  const realClipboard = Object.getOwnPropertyDescriptor(window.navigator, "clipboard")
  Object.defineProperty(window.navigator, "clipboard", { value: { writeText: async (s) => copied.push(s) }, configurable: true })
  const realST = globalThis.setTimeout
  globalThis.setTimeout = (fn, ms) => realST(() => {}, 5) // 复位计时器隔离（不等 2s）
  try {
    attachCopyButtons(container)
    attachCopyButtons(container)
    const btns = container.querySelectorAll(".code-copy-btn")
    assert.equal(btns.length, 1, "已挂者跳过（幂等）")
    assert.equal(btns[0].textContent, t("msg.copy"))
    btns[0].dispatchEvent(new window.MouseEvent("click", { bubbles: true }))
    await new Promise((r) => realST(r, 5))
    assert.deepEqual(copied, ["let a = 1"], "复制面 = code 文本")
    assert.equal(btns[0].textContent, t("msg.copied"), "点击后词面 = msg.copied")
    assert.ok(btns[0].classList.contains("copied"))
    assert.equal(attachCopyButtons(null), undefined, "null 容器零抛错")
  } finally {
    globalThis.setTimeout = realST
    if (realClipboard) Object.defineProperty(window.navigator, "clipboard", realClipboard)
    else delete window.navigator.clipboard
  }
})

test("RC-S4 `renderLedgerLine` + `renderSubBlock`：台账行类名/文本 + 子代理块结构（data 面 + `_subMeta` + 首刷）", async () => {
  const { renderLedgerLine } = await core("flow/ledger-line.mjs")
  assert.equal(renderLedgerLine({ text: "L1" }).className, "ledger-line")
  assert.equal(renderLedgerLine({ text: "L1" }).textContent, "L1")
  assert.equal(renderLedgerLine({ text: "L2", warn: true }).className, "ledger-line warn", "warn 档类名逐字")
  assert.equal(renderLedgerLine({}).textContent, "", "缺 text 回落空串")
  const { renderSubBlock } = await core("subblocks/block.mjs")
  const model = { key: "sub:explore#7", label: "explore#7", role: "explore", id: 7, status: "running", startedAt: Date.now(), pool: true, maxTurns: 0, turn: null, awaitingDigest: false, frozen: false, queued: false, approval: null, syncLive: false, note: null }
  const block = renderSubBlock(model)
  assert.ok(block.classList.contains("advisor-block") && block.classList.contains("sub-block") && block.classList.contains("sub-live"), "块容器类名三面")
  assert.equal(block.dataset.subname, "sub:explore#7")
  assert.equal(block.dataset.subrole, "explore")
  assert.equal(block.dataset.subid, "7")
  assert.equal(block._subMeta, model, "块持模型本体（态机 list 元素——同一引用）")
  assert.equal(block.open, true)
  assert.ok(block.querySelector(".sub-hdr").textContent.includes("explore#7"), "首刷头词在位")
  assert.equal(renderSubBlock({ key: "sub:x#1", label: "x#1", role: null, id: null }).dataset.subid, undefined, "id 缺省不落 data-subid")
})
