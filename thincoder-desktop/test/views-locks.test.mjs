/**
 * views-locks.test.mjs — E-2 零回归锁面用例（批档 §2.5 U52 · 原住 `test/views-chrome.test.mjs`）：
 * 测试清单两向自检（登记 ⇄ 在盘）/ 八档导出面锁（R3a 增状态行两档）/ 七槽接线结构面 / 会话族 · 对话流 · 审批出口 · 折叠接线结构面
 * （会话族四动作锚宿主 = `renderer/mount-sessions.mjs` —— 批 A 拆档随迁）。
 * 拆档理由 = 档行预算（`docs/desktop/design/PROJECT.md` §4.1「300 行 = 主动拆分层」）——面不变、判据不变，只换宿主档；
 * 会话头 / 状态栏 / 全量词表键齐（U49–U51）留 `test/views-chrome.test.mjs`。
 * 纪律：本档只读源（`readFileSync` + `stripComments`）+ 动态 import 导出面 —— **不触 DOM**（挂载面走查随人工）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { existsSync, readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"

/** 剥注释（块 / 行 / HTML）：源码机检看**声明点**——注释行含同字样（不剥即假计）。 */
function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^[ \t]*\/\/.*$/gm, "")
    .replace(/<!--[\s\S]*?-->/g, "")
}

// ─── U52 零回归面 ─────────────────────────────────────────

test("U52: 零回归面（清单两向 ∧ 导出面锁 ∧ 七槽接线结构 ∧ 会话族 / 对话流 / 审批出口接线结构）", async () => {
  const root = fileURLToPath(new URL("../", import.meta.url))
  const listed = (await import("../test/files.mjs")).default
  const onDisk = []
  const walkFiles = (rel) => {
    for (const entry of readdirSync(join(root, rel), { withFileTypes: true })) {
      const path = `${rel}/${entry.name}`
      if (entry.isDirectory()) walkFiles(path)
      else if (entry.name.endsWith(".test.mjs")) onDisk.push(path)
    }
  }
  walkFiles("test")
  assert.deepEqual([...listed].sort(), [...onDisk].sort(), "清单 ↔ 盘上两向自检（漏登记 = 永不执行）")
  for (const file of listed) assert.ok(existsSync(join(root, file)), `登记项在盘：${file}`)

  const store = await import("../renderer/store.mjs")
  const queue = await import("../renderer/queue.mjs")
  const pageRead = await import("../renderer/page-read.mjs")
  const subagentReduce = await import("../renderer/subagent-reduce.mjs")
  const events = await import("../renderer/events.mjs")
  const dom = await import("../renderer/dom.mjs")
  const sessions = await import("../renderer/views/sessions.mjs")
  const chrome = await import("../renderer/views/chrome.mjs")
  const statusline = await import("../renderer/views/statusline.mjs")
  const mountStatusFace = await import("../renderer/mount-status.mjs")
  const chat = await import("../renderer/views/chat.mjs")
  const chatChrome = await import("../renderer/views/chat-chrome.mjs")
  const chatTool = await import("../renderer/views/chat-tool.mjs")
  const approval = await import("../renderer/views/approval.mjs")
  const activity = await import("../renderer/views/activity.mjs")
  const settingsSections = await import("../renderer/views/settings-sections.mjs")
  const composer = await import("../renderer/mount-composer.mjs")
  const composerSend = await import("../renderer/composer-send.mjs")
  assert.deepEqual(Object.keys(store).sort(), [
    "appendBlock", "beginBackfill", "cancelCloseTab", "closeRailForm", "closeTab", "configuredFlag", "confirmCloseTab",
    "createStore", "deriveTabBadge", "dismissWizard", "endBackfill", "initialState",
    "needsCloseConfirm", "openRailForm", "openTab", "patchSettings", "requestCloseTab", "returnToBottom", "setAttachDegraded", "setFollowing", "setWizardStep",
    "store", "togglePool", "visibleWindow",
  ], "store.mjs 导出面锁（关闭确认四条 + `togglePool` 纯动作 + 设置族四条 + 左列换形态两条 + **`setAttachDegraded`（「回合中插入」批降级码切片写）**；排队镜面 `applyQueue` + `QUEUE_MAX` 住 `renderer/queue.mjs`）")
  assert.deepEqual(Object.keys(queue).sort(), ["QUEUE_MAX", "applyQueue"], "queue.mjs 导出面锁（「回合中插入」批：快照整置纯动作 + 满队常量（值同宿主队容量）—— 原三纯动作随本地队列退场）")
  assert.deepEqual(Object.keys(pageRead).sort(), ["applyPage", "blockOfMessage"], "page-read.mjs 导出面锁（拆分产出二：页读径两件 —— `applyFlags` 住归约核心档，两消费面同点）")
  assert.deepEqual(Object.keys(subagentReduce).sort(), ["liveCount", "onSubagent", "onSubchunk", "poolOf"], "subagent-reduce.mjs 导出面锁（拆分产出三：子 agent 面两分派支 + 池读数两助手）")
  assert.deepEqual(Object.keys(events).sort(), ["applyFlags", "clearApproval", "clearQuestion", "isTurnTail", "openSession", "reduce", "sameRecord"], "events.mjs 导出面锁（归约面六件 + 卡面 re-export 一件 —— 页读径 / 子 agent 径出档后名面不变）")
  assert.deepEqual(Object.keys(dom).sort(), ["build", "clear", "el", "on", "setBoot", "text"], "dom.mjs 导出面锁（本批零改动）")
  assert.deepEqual(Object.keys(sessions).sort(), ["BADGE_WORD", "mountRail", "mountTabbar", "railModel", "railTree", "tabbarModel", "tabbarTree"], "sessions.mjs 导出面 = 左列三段 + 标签条三段 + 位标词键表")
  assert.deepEqual(Object.keys(chrome).sort(), ["busyOf", "headModel", "headTree", "mountHead", "mountStatus", "sessionMetaOf", "statusModel", "statusTree"], "chrome.mjs 导出面 = 会话头三段 + 供给取面单源一段 + 状态行三段**再出口**（R3a 拆档：语义单源 = statusline.mjs）+ **`busyOf`**（「对齐第三批」P23 忙态判据单源 —— 构树与写路入口两处同取）")
  assert.deepEqual(Object.keys(statusline).sort(), ["STATUS_SEGMENTS", "mountStatus", "statusModel", "statusTree"], "statusline.mjs 导出面 = 状态行三段 + 承载段闭集（R3a 新档）")
  assert.deepEqual(Object.keys(mountStatusFace).sort(), ["STATUS_KEYS", "STATUS_SLOT", "attachStatus"], "mount-status.mjs 导出面 = 槽锚 + 订阅切片键面 + 装配面（R3a 新档）")
  assert.deepEqual(Object.keys(chat).sort(), ["chatModel", "chatTree", "mountChat", "retrySourceOf", "settleFrame"], "chat.mjs 导出面 = 三档 + 帧尾六步 + 重试源谓词（「对齐第三批」项 9 单源 —— 钮在场与出口同谓词；帧尾态刷面出档 `views/chat-chrome.mjs`）")
  assert.deepEqual(Object.keys(chatChrome).sort(), ["blockAnchor", "chromeProps", "digestGroupNode", "focusAutofocus", "ledgerGroupNode", "pillNode", "stoppedNode", "summaryNode", "syncChrome", "timerGroupNode"], "chat-chrome.mjs 导出面 = 帧尾态刷 + 五尾组构树 + 插点锚 + 真置焦（拆分产出 —— 单项；`timerGroupNode` = timer-wake 阶段 2 到期触发行组）")
  assert.deepEqual(Object.keys(chatTool).sort(), [
    "DIFF_FILE_FLOOR", "DIFF_LINE_FLOOR", "STATUS_WORD", "bindFileLinks", "changeTotals", "fileLinkOf", "linkifyResult", "segNode", "toggleExpanded", "toolCard", "toolChanges",
    "wire", "withKey",
  ], "chat-tool.mjs 导出面 = 工具卡构树 + 接线两态 + 折叠纯函数 + 核状态词表 / 改动摘要阈值与合计（本批增复用面 —— 审批卡同源消费；`segNode` = 文本段通则单源；**相抵② 三件** = 链接着装 `linkifyResult` / 命中 `fileLinkOf` / 委托 `bindFileLinks`）")
  assert.deepEqual(Object.keys(approval).sort(), [
    "approvalActions", "approvalExits", "approvalSummary", "approvalTitle", "approvalTree", "respondApproval", "verdictOfKey",
  ], "approval.mjs 导出面 = 卡面（两形构树 / 键位闭集 / 出口表 · 操作区 · 两标称）+ 出口动作（同一路）")
  assert.deepEqual(Object.keys(activity).sort(), ["mountPool", "poolModel", "poolTree"], "activity.mjs 导出面 = 右列三段（模型 → 构树 → 薄挂载 —— R3b 重写为子 agent 块面，面形不变）")
  assert.deepEqual(Object.keys(settingsSections).sort(), [
    "NAMED_FIELDS", "agentBody", "mcpBody", "modelBody", "modelChoicesTree", "modelHeadNode", "modelIdOf", "providersBody", "tierFace", "tierOptions",
  ], "settings-sections.mjs 导出面 = 四段体 + 模型段两导出面 + 档位两件 + **具名十键表 `NAMED_FIELDS`（「对齐第三批」P15 键集 / 词键 / 控型三面单源）**")
  assert.deepEqual(Object.keys(composer).sort(), [
    "COMPOSER_KEYS", "COMPOSER_SLOT", "attachComposer", "composerModel", "composerTree", "isComposing", "mountComposer",
  ], "mount-composer.mjs 导出面 = 挂载一族 + **`isComposing`**（「对齐第三批」P2 组字判据单源）；发送面三件已出档 `renderer/composer-send.mjs`（「回合中插入」批拆分产出）、**`flushTurnTail` 退场**（队列消费改宿主驱动）")
  assert.deepEqual(Object.keys(composerSend).sort(), ["ask", "submitDraft", "withUserBlock"], "composer-send.mjs 导出面锁（拆分产出：窄桥出站归一 + 提交判据 + 用户块写入）")

  const html = stripComments(readFileSync(new URL("../renderer/index.html", import.meta.url), "utf8"))
  const app = stripComments(readFileSync(new URL("../renderer/app.mjs", import.meta.url), "utf8"))
  // 「对齐第三批」相抵②：文件链接面**承载**（原 KD-RC-5「不承载」口径退场 —— D19 收正）—— 核 `linkifyPaths` 消费
  // **单点** = `views/chat-tool.mjs`（结果区链接着装）；余视图档零消费（单点锁 —— 双路着装破幂等面）。
  for (const name of ["chat-text.mjs", "chat.mjs", "chat-copy.mjs", "activity.mjs", "approval.mjs", "question.mjs", "plan.mjs"]) {
    const view = stripComments(readFileSync(new URL(`../renderer/views/${name}`, import.meta.url), "utf8"))
    assert.ok(!/linkifyPaths/.test(view), `核 linkifyPaths 消费单点（相抵②）：${name} 零消费`)
  }
  const chatToolSrc = stripComments(readFileSync(new URL("../renderer/views/chat-tool.mjs", import.meta.url), "utf8"))
  assert.ok(chatToolSrc.includes("linkifyPaths"), "着装面消费核 `linkifyPaths`（相抵② —— 单点 = `views/chat-tool.mjs`）")
  assert.ok(chatToolSrc.includes('"data-path"'), "着装面补 `data-path` 锚（断言锚 = `.file-link[data-path]`）")
  const pool = stripComments(readFileSync(new URL("../renderer/mount-pool.mjs", import.meta.url), "utf8"))
  const mountStatusSrc = stripComments(readFileSync(new URL("../renderer/mount-status.mjs", import.meta.url), "utf8"))
  assert.ok(mountStatusSrc.includes("mountStatus("), "状态行挂载调用在位：mount-status.mjs（单点重建一族）")
  const settings = stripComments(readFileSync(new URL("../renderer/mount-settings.mjs", import.meta.url), "utf8"))
  const sessionActions = stripComments(readFileSync(new URL("../renderer/mount-sessions.mjs", import.meta.url), "utf8"))
  for (const slot of ["tabs", "session-head", "flow"]) {
    assert.ok(html.includes(`data-slot="${slot}"`), `index.html 容器锚在位：${slot}`)
    assert.ok(app.includes(`[data-slot="${slot}"]`), `app.mjs 槽锚声明在位：${slot}`)
  }
  assert.ok(html.includes('data-slot="status"'), "index.html 容器锚在位：status")
  assert.ok(mountStatusFace.STATUS_SLOT === '[data-slot="status"]', "状态行槽锚声明在位：mount-status.mjs（R3a 出档 —— 单点重建一族迁离 app.mjs）")
  assert.ok(html.includes('data-slot="pool"'), "index.html 容器锚在位：pool")
  assert.ok(pool.includes('[data-slot="pool"]'), "池容器锚声明在位：mount-pool.mjs（批 8 出档 —— 池面一族迁离 app.mjs）")
  // 设置 / 信息行两槽（批 9 出档 `mount-settings.mjs` —— 一容器两树互斥 + 左列底行；声明面 = 两槽常量源）
  for (const [slot, constant] of [["settings", "SETTINGS_SLOT"], ["info", "INFO_SLOT"]]) {
    assert.ok(html.includes(`data-slot="${slot}"`), `index.html 容器锚在位：${slot}`)
    assert.ok(settings.includes(`${constant} = '[data-slot="${slot}"]'`), `槽锚声明在位：mount-settings.mjs ${constant}（批 9 出档）`)
  }
  const shellKeys = app.match(/const SHELL_KEYS = \[([^\]]*)\]/)?.[1] ?? ""
  for (const key of ["tabs", "activeTab", "sessions", "tabBadges", "sessionMeta", "locale", "pendingClose"]) {
    assert.ok(shellKeys.includes(`"${key}"`), `外壳订阅切片在位：${key}`)
  }
  const chatKeys = app.match(/const CHAT_KEYS = \[([^\]]*)\]/)?.[1] ?? ""
  for (const key of ["activeSession", "blocks", "history", "following", "pendingNew", "locale", "pool", "stopMark", "ledgerLines", "timerNotice"]) {
    assert.ok(chatKeys.includes(`"${key}"`), `对话流订阅切片在位：${key}`)
  }
  assert.ok(app.includes("FLOW_SLOT"), "对话流容器锚常量在位：FLOW_SLOT")
  const poolKeys = pool.match(/const POOL_KEYS = \[([^\]]*)\]/)?.[1] ?? ""
  for (const key of ["pool", "poolCollapsed", "activeTab", "activeSession", "subBlocks", "locale"]) {
    assert.ok(poolKeys.includes(`"${key}"`), `右列订阅切片在位：${key}`)
  }
  assert.ok(pool.includes("POOL_SLOT"), "右列容器锚常量在位：POOL_SLOT")
  // 状态行订阅切片（R3a 新族档）：D17 承载段数据源全集（段随切片走 —— 漏键 = 段永不刷新的静默口）
  const statusKeys = mountStatusFace.STATUS_KEYS
  for (const key of ["usage", "tasks", "turns", "turnStarts", "tokens", "timers", "projectInfo", "sessions", "pending", "blocks", "tabs", "activeTab", "tabBadges", "locale"]) {
    assert.ok(statusKeys.includes(key), `状态行订阅切片在位：${key}`)
  }
  for (const call of [
    "paintShell(state)", "mountTabbar(", "mountHead(", "mountChat(", "paintChat(state, changedKeys)",
    "attachScroll(", "attachEvents(", "paintPool(state)", "attachStatus()", "paintStatus(state)",
  ]) {
    assert.ok(app.includes(call), `接线调用在位：${call}（结构面 —— 端到端 = 冒烟）`)
  }
  assert.equal(app.includes("mountStatus("), false, "状态行挂载不落 app.mjs（R3a 出档 —— 单点重建归 mount-status.mjs）")
  // 会话族接线结构面（批档 §2.12 第 3 条：接线零用例覆盖 ⇒ 源面结构断言）：四动作 + 左列行动作 + 关闭尾宿主 = `mount-sessions.mjs`
  // （批 A 拆档 —— 整族迁离 `app.mjs`，判据随宿主 · 同批 8 / 批 9 两先例）；`pendingClose` 仍是外壳订阅切片位。
  for (const anchor of ["activateSession(", "requestCloseTab(", "confirmCloseTab(", "cancelCloseTab(", "openRailForm(", "closeRailForm(", "closeTab(", "closeTail("]) {
    assert.ok(sessionActions.includes(anchor), `会话族动作锚在位：${anchor}（宿主 = renderer/mount-sessions.mjs）`)
  }
  // 左列行动作 + 关闭尾（批 A ④/⑥ —— 同源结构断言：两通道载荷字面 = 与主侧 `src/main/ipc.mjs:118-119` 同面）。
  for (const literal of [
    'host.invoke("session:rename", { slot: slotOf(key), title: text })',
    'host.invoke("session:delete", { slot: slotOf(key) })',
  ]) {
    assert.ok(sessionActions.includes(literal), `通道载荷字面在位：${literal}（宿主 = renderer/mount-sessions.mjs）`)
  }
  assert.ok(app.includes("pendingClose"), "外壳订阅切片位在位：pendingClose（宿主 = renderer/app.mjs）")
  for (const wiring of [
    "onSession: activateSession", "onActivate: activateSession", "onClose: requestClose",
    "onConfirmClose: confirmClose", "onCancelClose: cancelClose",
    "onRename: renameSession", "onDelete: deleteSession", "onRenameCancel: cancelRailForm",
    "onDeleteCancel: cancelRailForm", "onRenameConfirm: confirmRenameText", "onDeleteConfirm: confirmDelete",
  ]) {
    assert.ok(app.includes(wiring), `接线落点在位：${wiring}（三路开标签同一路 / 关闭三出口 / 左列行十 handlers）`)
  }
  // 左列重挂切片（批 A ④）：`railForm` 在订阅切片内 —— 换形态改切片 ⇒ 树须重绘（挂载面纯读现态）
  const railKeys = app.match(/const RAIL_KEYS = \[([^\]]*)\]/)?.[1] ?? ""
  assert.ok(railKeys.includes('"railForm"'), "左列订阅切片在位：railForm（换形态切片 —— 行原位换形）")
  // 词面读数落接线面（视图档零 DOM）：改名读在形文本控件值 —— 选择符锚同面
  assert.ok(app.includes('[data-action="session:rename-input"]'), "词面读数落点在位：在形文本控件选择符（宿主 = renderer/app.mjs）")
  // 审批出口 / 折叠接线 / 停止出口结构面（批 7 落形 · 批 8 随迁 `mount-pool.mjs`：卡面与池面条目同一路 —— 三出口描述符单源；
  // R3b 增停止出口 —— `subagent:stop` 通道字面与薄壳调用形；「对齐第二批」项 3：⏹ 点击委托（核件钮无 `data-action`））
  for (const wiring of [
    "onApprove, onTogglePool", "respondApproval(host, promptId, verdict)", "togglePool(defaultStore.get(), key)",
    "bindSubagentStop(root, host)", 'host.invoke("subagent:stop", { key, id, ...(role ? { role } : {}) })',
  ]) {
    assert.ok(pool.includes(wiring), `接线落点在位：${wiring}（审批出口同一路 / 折叠入状态树 / 停止出口零乐观写）`)
  }
  // 「对齐第二批」项 6（A6 · 右列加宽一倍 · 值落点锁）：`--pool-w` 声明单源 = 36rem ∧ 两处引用皆 `var(--pool-w)`
  const stylesCss = stripComments(readFileSync(new URL("../renderer/styles.css", import.meta.url), "utf8"))
  assert.equal((stylesCss.match(/--pool-w\s*:/g) ?? []).length, 1, "`--pool-w` 声明恰一处（单源 —— 零第二处数值）")
  assert.ok(/--pool-w:\s*36rem;/.test(stylesCss), "`--pool-w` 值 = 36rem（项 6 —— 18rem ⇒ ×2）")
  assert.equal((stylesCss.match(/var\(--pool-w\)/g) ?? []).length, 2, "两处引用皆 `var(--pool-w)`（主栅格 + 窄断点行 —— 自动随动）")
  assert.equal(stylesCss.includes("18rem"), false, "零 18rem 残留（旧值不留痕）")
})

// ─── U152 可见面修复本批锁（#457 输入区五类规则 ∧ #461 开项目链复读序）──────────

test("U152: 输入区样式与开项目链（#457 五类 + 两附属行在 `chat.css` 有规则 ∧ #461 复读步在 `refreshRail()` 之后）", () => {
  const root = fileURLToPath(new URL("../", import.meta.url))
  const css = stripComments(readFileSync(join(root, "renderer/chat.css"), "utf8"))
  /** 规则在场判据 = 类名以**选择器位**起头（行首 ∨ 逗号后）∧ 尾随 `,` ∨ `{` —— 值面 / 别类名后缀（`.composer-input`）不算。 */
  const hasRule = (name) => new RegExp(`(?:^|,)\\s*\\${name}\\s*(?:,|\\{)`, "m").test(css)
  for (const name of [".composer", ".composer-input", ".composer-interrupt", ".chat-copy-block", ".chat-copy-last"]) {
    assert.ok(hasRule(name), `chat.css 含 ${name} 规则（#457 五类 —— 零规则 = 空默认按钮形态）`)
  }
  for (const name of [".composer-notice", ".composer-attachments"]) {
    assert.ok(hasRule(name), `chat.css 含 ${name} 规则（两附属行）`)
    assert.ok(new RegExp(`${name}\\s*(?:,[^{]*)?\\{[^}]*flex:\\s*1 1 100%`, "s").test(css), `${name} = 整行（flex: 1 1 100%）`)
  }
  assert.ok(/\.composer-input[^{]*\{[^}]*flex:\s*1\s*;/s.test(css), "输入框 `flex: 1`（撑满中区余宽）")
  assert.ok(/\.composer-input[^{]*\{[^}]*min-width:\s*0/s.test(css), "输入框 `min-width: 0`（窄窗可缩 —— 不撑破栅格）")
  assert.ok(/\.chat-copy-block::before[^{]*\{[^}]*content/s.test(css), "复制面字形住 CSS `content`（视图档零字形字面）")

  // R3c：核类名映射档（`renderer/core.css`）—— 三族面规则在场 + 摘要尾缀字形住样式档
  const coreCss = stripComments(readFileSync(join(root, "renderer/core.css"), "utf8"))
  const hasCoreRule = (name) => new RegExp(`(?:^|,)\\s*\\${name}\\s*(?:,|\\{)`, "m").test(coreCss)
  for (const name of [".code-block", ".code-lang", ".code-copy-btn", ".reasoning-block", ".reasoning-content"]) {
    assert.ok(hasCoreRule(name), `core.css 含 ${name} 规则（核产出面 —— 零规则 = 核件裸形态）`)
  }
  assert.ok(/\.reasoning-summary::after[^{]*\{[^}]*content/s.test(coreCss), "推理摘要尾缀住样式档（字形面 —— 视图档零字形字面）")
  assert.ok(/\.code-copy-btn[^{]*\{[^}]*position:\s*absolute/s.test(coreCss), "复制钮绝对定位（不入文档流高度 —— 帧尾补偿算式零扰）")

  const app = stripComments(readFileSync(join(root, "renderer/app.mjs"), "utf8"))
  const railAt = app.indexOf("await refreshRail()")
  const infoAt = app.indexOf("await settingsFace.refreshInfo()")
  assert.ok(app.includes("const settingsFace = attachSettings("), "设置面句柄捕获在位（`openDir` 复读口来源）")
  assert.ok(railAt >= 0 && infoAt > railAt, "#461 复读步在 `refreshRail()` 之后（**调用行形**锚定 —— 注释已剥 ∧ 只认 `await` 调用形）")
})

// ─── U174 D21 值落点锁（内容面 21 面 · 会话面板面 9 面 —— 值表单源 = 核档 §5 / `docs/desktop/design/UI.md` §1 项 2）──

test("U174: D21 值落点锁（core.css 高亮 9 规则 ∧ 关键值 · styles.css 新增变量 17 × 亮暗两套 ∧ 会话行九面值）", () => {
  const root = fileURLToPath(new URL("../", import.meta.url))
  const core = stripComments(readFileSync(join(root, "renderer/core.css"), "utf8"))
  const coreHas = (pattern) => new RegExp(pattern, "s").test(core)

  // 面 10：语法高亮 9 规则在场 ∧ 类 → 变量映射（桌面此前零 `tk-*` 规则 ⇒ 高亮全同色 = 本批首要缺口）
  for (const [suffix, variable] of [["keyword", "kw"], ["string", "str"], ["comment", "cmt"], ["number", "num"], ["type", "type"], ["property", "prop"], ["atrule", "atrule"]]) {
    assert.ok(coreHas(`\\.tk-${suffix}\\s*\\{[^}]*var\\(--syn-${variable}\\)`), `.tk-${suffix} ⇒ var(--syn-${variable})（面 10 —— 零规则 = 高亮不可见）`)
  }
  assert.ok(coreHas("\\.tk-class\\s*\\{[^}]*var\\(--syn-type\\)"), "`.tk-class` ⇒ `--syn-type`（复用）")
  assert.ok(coreHas("\\.tk-id\\s*\\{[^}]*var\\(--syn-atrule\\)"), "`.tk-id` ⇒ `--syn-atrule`（复用）")
  assert.ok(coreHas("\\.tk-comment\\s*\\{[^}]*font-style:\\s*italic"), "`.tk-comment` 斜体（VSC 同表）")

  // 内容面关键值（逐面抽样 —— 值源 = 核档 §5 映射表 21 面）
  assert.ok(coreHas("\\.block-text,\\s*\\.reasoning-content\\s*\\{[^}]*font-family:\\s*var\\(--mono\\)"), "面 1：两容器字族 = var(--mono)")
  assert.ok(coreHas("\\.block-text,\\s*\\.reasoning-content\\s*\\{[^}]*line-height:\\s*1\\.55"), "面 1：正文行高 1.55")
  assert.ok(coreHas("\\.block-text p,\\s*\\.reasoning-content p\\s*\\{[^}]*margin:\\s*0 0 6px"), "面 2：段落 0 0 6px")
  assert.ok(coreHas("blockquote\\s*\\{[^}]*background:\\s*var\\(--hover-bg-strong\\)"), "面 5：引用底 = var(--hover-bg-strong)")
  assert.ok(coreHas("\\.block-text code,\\s*\\.reasoning-content code\\s*\\{[^}]*background:\\s*var\\(--hover-bg-strong\\)"), "面 6：行内码底 = var(--hover-bg-strong)")
  assert.ok(coreHas("\\.code-block\\s*\\{[^}]*border-radius:\\s*6px"), "面 7：代码块壳圆角 6px")
  assert.ok(coreHas("\\.code-block\\s*\\{[^}]*background:\\s*var\\(--overlay\\)"), "面 7：代码块壳底 = var(--overlay)")
  assert.ok(coreHas("\\.code-lang\\s*\\{[^}]*font-size:\\s*10px"), "面 8：语言条 10px")
  assert.ok(coreHas("\\.code-block code\\s*\\{[^}]*font-size:\\s*0\\.88em"), "面 9：代码体 0.88em")
  assert.ok(coreHas("th\\s*\\{[^}]*background:\\s*var\\(--hover-bg-strong\\)"), "面 12：表头底 = var(--hover-bg-strong)")
  assert.ok(coreHas("\\.reasoning-summary\\s*\\{[^}]*opacity:\\s*0\\.5"), "面 18：推理摘要 opacity 0.5")
  assert.ok(coreHas("\\.reasoning-content\\s*\\{[^}]*font-size:\\s*12px"), "面 19：推理内容区 12px")
  assert.ok(coreHas("\\.reasoning-content\\s*\\{[^}]*padding:\\s*6px 0 0"), "面 19：内边距 6px 0 0（水平不搬 = 盒层单层律）")
  assert.ok(coreHas("\\.reasoning-content h1,\\s*\\.reasoning-content h2,\\s*\\.reasoning-content h3\\s*\\{[^}]*margin:\\s*8px 0 4px"), "面 20：推理内标题 8px 0 4px")
  assert.ok(coreHas("\\.reasoning-content ul, \\.reasoning-content ol\\s*\\{[^}]*padding-left:\\s*18px"), "面 20：推理内列表 padding-left 18px")
  assert.ok(coreHas("\\.code-copy-btn\\s*\\{[^}]*opacity:\\s*0\\.4"), "面 21：复制钮静息 opacity 0.4")
  assert.ok(coreHas("\\.code-copy-btn\\.copied\\s*\\{[^}]*var\\(--green\\)"), "面 21：`.copied` 着色 = var(--green)")

  // 会话面板面（值源 = `docs/desktop/design/UI.md` §1 项 2 —— 落点 = 左列段）
  const styles = stripComments(readFileSync(join(root, "renderer/styles.css"), "utf8"))
  const stylesHas = (pattern) => new RegExp(pattern, "s").test(styles)
  assert.ok(stylesHas("\\.rail-row\\s*\\{[^}]*padding:\\s*8px 10px"), "面板面 1：行容器 8px 10px")
  assert.ok(stylesHas("\\.rail-row\\s*\\{[^}]*border-bottom:\\s*1px solid var\\(--line\\)"), "面板面 1：行底分隔线")
  assert.ok(stylesHas("\\.rail-item:last-child > \\.rail-row\\s*\\{[^}]*border-bottom:\\s*none"), "面板面 1：末行无线")
  assert.ok(stylesHas("\\.rail-row:not\\(:disabled\\):hover\\s*\\{[^}]*background:\\s*var\\(--hover-bg\\)"), "面板面 2：行 hover 底色 = var(--hover-bg)")
  assert.ok(stylesHas("\\.rail-item > \\.rail-row\\[data-active=\"1\"\\]\\s*\\{[^}]*background:\\s*color-mix\\(in srgb, var\\(--accent\\) 10%, transparent\\)"), "面板面 3：活动行底色 = 强调色 10% 混同")
  assert.ok(stylesHas("\\.rail-row\\[data-active=\"1\"\\] \\.rail-row-title\\s*\\{[^}]*color:\\s*var\\(--accent\\)"), "面板面 3：活动行标题 = var(--accent)")
  assert.ok(stylesHas("\\.rail-row-title\\s*\\{[^}]*font-size:\\s*13px"), "面板面 4：行标题 13px")
  assert.ok(stylesHas("\\.rail-row-title\\s*\\{[^}]*font-weight:\\s*500"), "面板面 4：行标题 500")
  assert.ok(stylesHas("\\.rail-row-meta\\s*\\{[^}]*color:\\s*var\\(--fg\\)"), "面板面 5：元数据 var(--fg)")
  assert.ok(stylesHas("\\.rail-row-meta\\s*\\{[^}]*font-size:\\s*11px"), "面板面 5：元数据 11px")
  assert.ok(stylesHas("\\.rail-row-meta\\s*\\{[^}]*opacity:\\s*0\\.4"), "面板面 5：元数据 opacity 0.4")
  assert.ok(stylesHas("\\.rail-rename,\\s*\\.rail-delete\\s*\\{[^}]*width:\\s*22px"), "面板面 6：两钮 22px 方")
  assert.ok(stylesHas("\\.rail-rename,\\s*\\.rail-delete\\s*\\{[^}]*border-radius:\\s*4px"), "面板面 6：两钮 4px 圆角")
  assert.ok(stylesHas("\\.rail-rename,\\s*\\.rail-delete\\s*\\{[^}]*opacity:\\s*0"), "面板面 6：静息隐没 opacity 0")
  assert.ok(stylesHas("\\.rail-item:hover \\.rail-rename,\\s*\\.rail-item:hover \\.rail-delete\\s*\\{[^}]*opacity:\\s*0\\.5"), "面板面 6：行 hover 半显 0.5（臂锚 `.rail-item` —— 两钮为行兄弟）")
  assert.ok(stylesHas("\\.rail-rename:not\\(:disabled\\):hover\\s*\\{[^}]*background:\\s*var\\(--hover-bg-strong\\)"), "面板面 6：改名 hover 底 = var(--hover-bg-strong)")
  assert.ok(stylesHas("\\.rail-rename:not\\(:disabled\\):hover\\s*\\{[^}]*color:\\s*var\\(--accent\\)"), "面板面 6：改名 hover 色 = var(--accent)")
  assert.ok(stylesHas("\\.rail-delete:not\\(:disabled\\):hover\\s*\\{[^}]*background:\\s*var\\(--diff-del-bg\\)"), "面板面 6：删除 hover 底 = var(--diff-del-bg)")
  assert.ok(stylesHas("\\.rail-delete:not\\(:disabled\\):hover\\s*\\{[^}]*color:\\s*var\\(--error-fg\\)"), "面板面 6：删除 hover 色 = var(--error-fg)")
  assert.ok(stylesHas("\\.rail-rename:focus-visible,\\s*\\.rail-delete:focus-visible\\s*\\{[^}]*opacity:\\s*1"), "面板面 6：本端 focus 臂（键盘可达）")
  assert.ok(stylesHas("\\.rail-delete::before\\s*\\{\\s*content:\\s*\"✕\""), "面板面 7：删除字形 ✕")
  assert.ok(stylesHas("\\.rail-row:focus-visible\\s*\\{[^}]*outline:\\s*2px solid var\\(--accent\\)"), "面板面 9：行聚焦 outline 2px solid var(--accent)（VSC 同三值 · 父侧裁定）")
  assert.ok(stylesHas("\\.rail-row:focus-visible\\s*\\{[^}]*outline-offset:\\s*-2px"), "面板面 9：行聚焦 outline-offset -2px")
  assert.ok(stylesHas("\\.rail-row:focus-visible\\s*\\{[^}]*background:\\s*var\\(--hover-bg-strong\\)"), "面板面 9：行聚焦底 = var(--hover-bg-strong)")

  // 主题表：新增变量 14 × 亮暗两套（值源 = VSC webview 实值 · 单源 = 本档）
  const lightVars = styles.match(/:root\s*\{([^}]*)\}/s)?.[1] ?? ""
  const darkVars = styles.match(/prefers-color-scheme: dark\)\s*\{\s*:root\s*\{([^}]*)\}/s)?.[1] ?? ""
  assert.ok(lightVars !== "" && darkVars !== "", "两模式变量块在场（`:root` 亮 / 暗媒体查询同名块）")
  const NEW_VARS = {
    "--mono": ["ui-monospace, SFMono-Regular, Menlo, Consolas, monospace", "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"],
    "--hover-bg": ["rgba(0,0,0,0.06)", "rgba(255,255,255,0.08)"],
    "--hover-bg-strong": ["rgba(0,0,0,0.12)", "rgba(255,255,255,0.16)"],
    "--overlay": ["rgba(0,0,0,0.08)", "rgba(0,0,0,0.3)"],
    "--green": ["#1a8a4a", "#4ec9b0"],
    "--syn-kw": ["#0000ff", "#569cd6"],
    "--syn-str": ["#a31515", "#ce9178"],
    "--syn-cmt": ["#008000", "#6a9955"],
    "--syn-num": ["#098658", "#b5cea8"],
    "--syn-type": ["#267f99", "#4ec9b0"],
    "--syn-prop": ["#795e26", "#9cdcfe"],
    "--syn-atrule": ["#af00db", "#d7ba7d"],
    "--diff-del-bg": ["rgba(201,37,37,0.12)", "rgba(244,71,71,0.14)"],
    "--error-fg": ["#f44747", "#f44747"],
    // 「对齐第三批」相抵①：diff 预览三新变量（值源 = VSC `webview/base.css:35-38` 暗色块 / `:58-61` 亮色块 —— 4 变量族的余三）
    "--diff-add-bg": ["rgba(16,137,62,0.12)", "rgba(34,187,51,0.14)"],
    "--diff-add-fg": ["#0d6b30", "#a5d6a7"],
    "--diff-del-fg": ["#b91a1a", "#ef9a9a"],
  }
  assert.equal(Object.keys(NEW_VARS).length, 17, "新增变量合计 17（内容面 12 + 会话面板面 2 + 「对齐第三批」diff 三 —— D3 计数）")
  for (const [name, [light, dark]] of Object.entries(NEW_VARS)) {
    assert.ok(lightVars.includes(`${name}: ${light};`), `亮模式 ${name} = ${light}`)
    assert.ok(darkVars.includes(`${name}: ${dark};`), `暗模式 ${name} = ${dark}`)
  }
})

// ─── U182 D24 值落点锁（外壳视觉降噪 · 台账 #493 —— 值表单源 = `docs/desktop/design/UI.md` §1 本批注（外壳视觉降噪 · D24））──

test("U182: D24 值落点锁（静息描边归零四族 ∧ 交互态四值族 ∧ 滚动条 4 规则 ∧ 设置面映射 ∧ 保留面两值列负向锁 ∧ 零新变量）", () => {
  const root = fileURLToPath(new URL("../", import.meta.url))
  const css = {
    styles: stripComments(readFileSync(join(root, "renderer/styles.css"), "utf8")),
    chat: stripComments(readFileSync(join(root, "renderer/chat.css"), "utf8")),
    pool: stripComments(readFileSync(join(root, "renderer/pool.css"), "utf8")),
    settings: stripComments(readFileSync(join(root, "renderer/settings.css"), "utf8")),
  }
  /** 值落点判据（`s` = 跨行 · `[^}]*` = 单规则体内 · `[^{]*` = 选择器组余部）。 */
  const has = (name, pattern) => new RegExp(pattern, "s").test(css[name])

  // ① 静息描边归零（四族 · 保位 `1px solid transparent` —— UI.md 本批注项 1 / 项 3 / 项 4）
  for (const [name, pattern, label] of [
    ["styles", String.raw`\.rail,\s*\.session,\s*\.pool,\s*\.status\s*\{[^}]*border:\s*1px solid transparent`, "容器族 4：四卡描边归零（保位 —— 零几何位移）"],
    ["styles", String.raw`\.rail-head\s*\{[^}]*border-bottom:\s*1px solid transparent`, "骨架线：`.rail-head` 底线归零"],
    ["styles", String.raw`\.session-head\s*\{[^}]*border-bottom:\s*1px solid transparent`, "骨架线：`.session-head` 底线归零"],
    ["styles", String.raw`\.tabbar\s*\{[^}]*border-bottom:\s*1px solid transparent`, "骨架线：`.tabbar` 底线归零"],
    ["chat", String.raw`\.composer\s*\{[^}]*border-top:\s*1px solid transparent`, "骨架线：`.composer` 顶线归零"],
    ["styles", String.raw`\.head-field\s*\{[^}]*border:\s*1px solid transparent`, "控件族 11：`.head-field` 描边归零"],
    ["chat", String.raw`\.chat-backfill\s*\{[^}]*border:\s*1px solid transparent`, "控件族 11：`.chat-backfill` 描边归零"],
    ["chat", String.raw`\.chat-pill\s*\{[^}]*border:\s*1px solid transparent`, "控件族 11：`.chat-pill` 描边归零"],
    ["pool", String.raw`\.pool-toggle\s*\{[^}]*border:\s*1px solid transparent`, "控件族 11：`.pool-toggle` 描边归零"],
    ["styles", String.raw`\.rail-cancel,\s*\.rail-confirm\s*\{[^}]*border:\s*1px solid transparent`, "控件族 11：`.rail-cancel` / `.rail-confirm` 描边归零"],
    ["styles", String.raw`\.tabbar-cancel,\s*\.tabbar-confirm\s*\{[^}]*border:\s*1px solid transparent`, "控件族 11：`.tabbar-cancel` / `.tabbar-confirm` 描边归零"],
    ["chat", String.raw`\.composer-interrupt,\s*\.chat-copy-block,\s*\.chat-copy-last\s*\{[^}]*border:\s*1px solid transparent`, "控件族 11：输入区三控件描边归零"],
    ["pool", String.raw`\.pool-item\s*\{[^}]*border:\s*1px solid transparent`, "池条目：描边归零"],
    ["pool", String.raw`\.pool-item\s*\{[^}]*background:\s*var\(--bg\)`, "池条目：底 = `var(--bg)`（下沉井底）"],
    ["styles", String.raw`\.tabbar-item\[data-active="1"\]\s*\{[^}]*border-color:\s*transparent[^}]*background:\s*color-mix\(in srgb, var\(--accent\) 14%, transparent\)`, "标签活动态：accent 14% 底 + 描边态归零"],
    ["styles", String.raw`\.tabbar-item\[data-active="1"\] \.tabbar-title\s*\{[^}]*color:\s*var\(--accent\)`, "标签活动态：题字 = `var(--accent)`"],
  ]) assert.ok(has(name, pattern), label)

  // ② 交互态四值族（hover / 按下 / 聚焦 —— 本注定形；`.chat-pill` 实色支两例外随列）
  for (const [name, pattern, label] of [
    ["styles", String.raw`\.rail-cancel:not\(:disabled\):hover,\s*\.rail-confirm:not\(:disabled\):hover\s*\{[^}]*background:\s*var\(--hover-bg\)`, "hover：左列两键 = `--hover-bg`"],
    ["styles", String.raw`\.rail-control:not\(:disabled\):hover\s*\{[^}]*background:\s*var\(--hover-bg\)`, "hover：`.rail-control` = `--hover-bg`（同面收齐）"],
    ["styles", String.raw`\.tabbar-tab:not\(:disabled\):hover,\s*\.tabbar-close:not\(:disabled\):hover,\s*\.tabbar-new:not\(:disabled\):hover,\s*\.tabbar-cancel:not\(:disabled\):hover,\s*\.tabbar-confirm:not\(:disabled\):hover\s*\{[^}]*background:\s*var\(--hover-bg\)`, "hover：标签条五控成员齐（同面收齐）= `--hover-bg`"],
    ["chat", String.raw`\.chat-backfill:not\(:disabled\):hover\s*\{[^}]*background:\s*var\(--hover-bg\)`, "hover：`.chat-backfill` = `--hover-bg`"],
    ["chat", String.raw`\.composer-interrupt:not\(:disabled\):hover,\s*\.chat-copy-block:not\(:disabled\):hover,\s*\.chat-copy-last:not\(:disabled\):hover\s*\{[^}]*background:\s*var\(--hover-bg\)`, "hover：输入区三控件成员齐 = `--hover-bg`"],
    ["pool", String.raw`\.pool-toggle:not\(:disabled\):hover\s*\{[^}]*background:\s*var\(--hover-bg\)`, "hover：`.pool-toggle` = `--hover-bg`"],
    ["chat", String.raw`\.chat-pill:not\(:disabled\):hover\s*\{[^}]*background:\s*var\(--bg\)`, "hover：`.chat-pill` = `var(--bg)`（实色支例外）"],
    ["settings", String.raw`\.settings-lang:not\(:disabled\):hover,\s*\.settings-close:not\(:disabled\):hover,\s*\.settings-submit:not\(:disabled\):hover,\s*\.wizard-dismiss:not\(:disabled\):hover,\s*\.wizard-submit:not\(:disabled\):hover,\s*\.info-entry:not\(:disabled\):hover\s*\{[^}]*background:\s*var\(--hover-bg\)`, "hover：设置面次级 6 成员齐 = `--hover-bg`"],
    ["styles", String.raw`\.rail-cancel:not\(:disabled\):active,\s*\.rail-confirm:not\(:disabled\):active,\s*\.tabbar-cancel:not\(:disabled\):active,\s*\.tabbar-confirm:not\(:disabled\):active\s*\{[^}]*background:\s*var\(--hover-bg-strong\)`, "按下：左列两键 + 标签条两键（4 成员齐）= `--hover-bg-strong`"],
    ["chat", String.raw`\.chat-backfill:not\(:disabled\):active,\s*\.composer-interrupt:not\(:disabled\):active,\s*\.chat-copy-block:not\(:disabled\):active,\s*\.chat-copy-last:not\(:disabled\):active\s*\{[^}]*background:\s*var\(--hover-bg-strong\)`, "按下：输入区四控成员齐 = `--hover-bg-strong`"],
    ["pool", String.raw`\.pool-toggle:not\(:disabled\):active\s*\{[^}]*background:\s*var\(--hover-bg-strong\)`, "按下：`.pool-toggle` = `--hover-bg-strong`"],
    ["settings", String.raw`\.settings-lang:not\(:disabled\):active,\s*\.settings-close:not\(:disabled\):active,\s*\.settings-submit:not\(:disabled\):active,\s*\.wizard-dismiss:not\(:disabled\):active,\s*\.wizard-submit:not\(:disabled\):active,\s*\.info-entry:not\(:disabled\):active\s*\{[^}]*background:\s*var\(--hover-bg-strong\)`, "按下：设置面次级 6 成员齐 = `--hover-bg-strong`"],
    ["styles", String.raw`\.head-field:not\(:disabled\):active\s*\{[^}]*background:\s*var\(--hover-bg-strong\)`, "按下：chip 特例 = `--hover-bg-strong`"],
    ["chat", String.raw`\.chat-pill:not\(:disabled\):active\s*\{[^}]*background:\s*var\(--bg\)`, "按下：`.chat-pill` 沿 hover（实色支无第二档）"],
    ["styles", String.raw`\.rail-cancel:focus-visible,\s*\.rail-confirm:focus-visible,\s*\.tabbar-cancel:focus-visible,\s*\.tabbar-confirm:focus-visible\s*\{[^}]*outline:\s*2px solid var\(--accent\)[^}]*outline-offset:\s*-2px[^}]*background:\s*var\(--hover-bg-strong\)`, "聚焦：标签条 / 左列四键成员齐三值（`--hover-bg-strong` 第三值在）"],
    ["styles", String.raw`\.head-field:focus-within\s*\{[^}]*outline:\s*2px solid var\(--accent\)[^}]*outline-offset:\s*-2px[^}]*background:\s*var\(--hover-bg-strong\)`, "聚焦：chip 特例三值落 `.head-field`（`:focus-within`）"],
    ["chat", String.raw`\.chat-backfill:focus-visible,\s*\.composer-interrupt:focus-visible,\s*\.chat-copy-block:focus-visible,\s*\.chat-copy-last:focus-visible\s*\{[^}]*outline:\s*2px solid var\(--accent\)[^}]*outline-offset:\s*-2px[^}]*background:\s*var\(--hover-bg-strong\)`, "聚焦：输入区四控成员齐三值"],
    ["pool", String.raw`\.pool-toggle:focus-visible\s*\{[^}]*outline:\s*2px solid var\(--accent\)[^}]*outline-offset:\s*-2px[^}]*background:\s*var\(--hover-bg-strong\)`, "聚焦：`.pool-toggle` 三值"],
    ["settings", String.raw`\.settings-lang:focus-visible,\s*\.settings-close:focus-visible,\s*\.settings-submit:focus-visible,\s*\.wizard-dismiss:focus-visible,\s*\.wizard-submit:focus-visible,\s*\.info-entry:focus-visible\s*\{[^}]*outline:\s*2px solid var\(--accent\)[^}]*outline-offset:\s*-2px[^}]*background:\s*var\(--hover-bg-strong\)`, "聚焦：设置面次级 6 成员齐三值"],
    ["chat", String.raw`\.chat-pill:focus-visible\s*\{[^}]*outline:\s*2px solid var\(--accent\)`, "聚焦：`.chat-pill` outline 两值在"],
  ]) assert.ok(has(name, pattern), label)
  assert.ok(!/\.chat-pill:focus-visible\s*\{[^}]*background:/.test(css.chat), "聚焦：`.chat-pill` 底不随落（实色支负向锁）")

  // ③ 滚动条皮肤 4 规则（全局 · 零变量 —— UI.md 本批注项 4）
  for (const [pattern, label] of [
    [String.raw`::-webkit-scrollbar\s*\{[^}]*width:\s*10px[^}]*height:\s*10px`, "滚动条 1/4：10px（纵 / 横）"],
    [String.raw`::-webkit-scrollbar-track,\s*::-webkit-scrollbar-corner\s*\{[^}]*background:\s*transparent`, "滚动条 2/4：轨 / 角透明"],
    [String.raw`::-webkit-scrollbar-thumb\s*\{[^}]*color-mix\(in srgb, var\(--fg\) 22%, transparent\)[^}]*border:\s*2px solid transparent[^}]*border-radius:\s*6px[^}]*background-clip:\s*padding-box`, "滚动条 3/4：thumb = `--fg` 22% + 2px 透明边 + 圆角 6px + clip padding-box"],
    [String.raw`::-webkit-scrollbar-thumb:hover\s*\{[^}]*color-mix\(in srgb, var\(--fg\) 35%, transparent\)`, "滚动条 4/4：thumb hover ⇒ 35%"],
  ]) assert.ok(has("styles", pattern), label)

  // ④ 设置面映射（9 面 = 6 改 + 3 保留 —— UI.md 本批注项 5）
  for (const [pattern, label] of [
    [String.raw`\.settings-head,\s*\.wizard-head\s*\{[^}]*border-bottom:\s*1px solid transparent`, "设置面：面头线归零"],
    [String.raw`\.settings-row\s*\{[^}]*border:\s*1px solid transparent[^}]*background:\s*var\(--bg-raised\)`, "设置面：行框归零 + 升底 `--bg-raised`"],
    [String.raw`\.settings-form\s*\{[^}]*border:\s*1px solid transparent[^}]*background:\s*var\(--bg-raised\)`, "设置面：表单框归零 + 升底 `--bg-raised`"],
    [String.raw`\.settings-notice,\s*\.wizard-notice\s*\{[^}]*border:\s*1px solid transparent`, "设置面：警示面框归零（语义随 `--accent` 字色）"],
    [String.raw`\.settings-row\[data-active\],\s*\.settings-row\[data-current\]\s*\{[^}]*background:\s*color-mix\(in srgb, var\(--accent\) 14%, var\(--bg-raised\)\)`, "设置面：活动 / 当前行 = accent 14% 混 `--bg-raised`（描边态归零）"],
    [String.raw`\.settings-lang,\s*\.settings-close,\s*\.settings-submit,\s*\.wizard-dismiss,\s*\.wizard-submit,\s*\.wizard-next,\s*\.wizard-finish,\s*\.info-entry\s*\{[^}]*border:\s*1px solid transparent`, "设置面：控件形基规则描边归零（次级 6 生效）"],
    [String.raw`\.wizard-next,\s*\.wizard-finish\s*\{[^}]*border-color:\s*var\(--accent\)`, "设置面：强调 2 键保留 accent 框"],
    [String.raw`\.settings-field\s*\{[^}]*border:\s*1px solid var\(--line\)`, "设置面保留：`.settings-field` 细边零动"],
    [String.raw`\.settings-mark\s*\{[^}]*border:\s*1px solid var\(--accent\)`, "设置面保留：`.settings-mark` 强调标零动"],
  ]) assert.ok(has("settings", pattern), label)

  // ⑤ 保留面负向锁（两值列 · 仍 1px 描边未被归零 —— UI.md 本批注项 7）
  for (const [name, pattern, label] of [
    ["chat", String.raw`\.approval-card\s*\{[^}]*border:\s*1px solid var\(--accent\)`, "保留面（accent）：`.approval-card` 语义强调框在"],
    ["chat", String.raw`\.question-card\s*\{[^}]*border-color:\s*var\(--accent\)`, "保留面（accent）：`.question-card` 语义强调框在"],
    ["styles", String.raw`\.rail-rename-input\s*\{[^}]*border:\s*1px solid var\(--accent\)`, "保留面（accent）：`.rail-rename-input` 输入面细边在"],
    ["chat", String.raw`\.composer-input\s*\{[^}]*border:\s*1px solid var\(--line\)`, "保留面（`--line`）：`.composer-input` 输入面细边在"],
    ["chat", String.raw`\.block\s*\{[^}]*border:\s*1px solid var\(--line\)`, "保留面（`--line`）：`.block` 消息块壳在"],
    ["chat", String.raw`\.question-card,\s*\.plan-card\s*\{[^}]*border:\s*1px solid var\(--line\)`, "保留面（`--line`）：`.plan-card` 常态边在"],
    ["styles", String.raw`\.rail-row\s*\{[^}]*border-bottom:\s*1px solid var\(--line\)`, "保留面（`--line`）：`.rail-row` 行分隔线在"],
  ]) assert.ok(has(name, pattern), label)

  // ⑥ 零新变量（本批零新变量 —— 计数 = 盘面实读；沿「对齐第三批」diff 三变量 × 两套落位后之态）
  const lightVars = css.styles.match(/:root\s*\{([^}]*)\}/s)?.[1] ?? ""
  const darkVars = css.styles.match(/prefers-color-scheme: dark\)\s*\{\s*:root\s*\{([^}]*)\}/s)?.[1] ?? ""
  const countVars = (block) => (block.match(/--[\w-]+\s*:/g) ?? []).length
  assert.equal(countVars(lightVars), 30, "亮模式变量计数 = 30（27 —— D24 后之态 + 「对齐第三批」diff 三）")
  assert.equal(countVars(darkVars), 24, "暗模式变量计数 = 24（21 + 同三）")
})
