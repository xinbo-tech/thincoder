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
  const dom = await import("../renderer/dom.mjs")
  const sessions = await import("../renderer/views/sessions.mjs")
  const chrome = await import("../renderer/views/chrome.mjs")
  const statusline = await import("../renderer/views/statusline.mjs")
  const mountStatusFace = await import("../renderer/mount-status.mjs")
  const chat = await import("../renderer/views/chat.mjs")
  const chatTool = await import("../renderer/views/chat-tool.mjs")
  const approval = await import("../renderer/views/approval.mjs")
  const activity = await import("../renderer/views/activity.mjs")
  assert.deepEqual(Object.keys(store).sort(), [
    "QUEUE_MAX", "appendBlock", "beginBackfill", "cancelCloseTab", "closeRailForm", "closeTab", "configuredFlag", "confirmCloseTab",
    "createStore", "dequeue", "deriveTabBadge", "dismissWizard", "drainQueue", "endBackfill", "enqueue", "initialState",
    "needsCloseConfirm", "openRailForm", "openTab", "patchSettings", "requestCloseTab", "returnToBottom", "setFollowing", "setWizardStep",
    "store", "togglePool", "visibleWindow",
  ], "store.mjs 导出面锁（关闭确认四条 + `togglePool` 纯动作 + 设置族四条：`configuredFlag` / `dismissWizard` / `patchSettings` / `setWizardStep` + 左列换形态两条：`openRailForm` / `closeRailForm`）")
  assert.deepEqual(Object.keys(dom).sort(), ["build", "clear", "el", "on", "setBoot", "text"], "dom.mjs 导出面锁（本批零改动）")
  assert.deepEqual(Object.keys(sessions).sort(), ["BADGE_WORD", "mountRail", "mountTabbar", "railModel", "railTree", "tabbarModel", "tabbarTree"], "sessions.mjs 导出面 = 左列三段 + 标签条三段 + 位标词键表")
  assert.deepEqual(Object.keys(chrome).sort(), ["headModel", "headTree", "mountHead", "mountStatus", "sessionMetaOf", "statusModel", "statusTree"], "chrome.mjs 导出面 = 会话头三段 + 供给取面单源一段 + 状态行三段**再出口**（R3a 拆档：语义单源 = statusline.mjs）")
  assert.deepEqual(Object.keys(statusline).sort(), ["STATUS_SEGMENTS", "mountStatus", "statusModel", "statusTree"], "statusline.mjs 导出面 = 状态行三段 + 承载段闭集（R3a 新档）")
  assert.deepEqual(Object.keys(mountStatusFace).sort(), ["STATUS_KEYS", "STATUS_SLOT", "attachStatus"], "mount-status.mjs 导出面 = 槽锚 + 订阅切片键面 + 装配面（R3a 新档）")
  assert.deepEqual(Object.keys(chat).sort(), ["chatModel", "chatTree", "mountChat", "settleFrame", "syncChrome"], "chat.mjs 导出面 = 三档 + 帧尾态刷 / 帧尾六步")
  assert.deepEqual(Object.keys(chatTool).sort(), [
    "DIFF_FILE_FLOOR", "DIFF_LINE_FLOOR", "STATUS_WORD", "changeTotals", "segNode", "toggleExpanded", "toolCard", "toolChanges",
    "wire", "withKey",
  ], "chat-tool.mjs 导出面 = 工具卡构树 + 接线两态 + 折叠纯函数 + 核状态词表 / 改动摘要阈值与合计（本批增复用面 —— 审批卡同源消费；`segNode` = 文本段通则单源 —— 四处行内多段面同表消费）")
  assert.deepEqual(Object.keys(approval).sort(), [
    "approvalActions", "approvalExits", "approvalSummary", "approvalTitle", "approvalTree", "respondApproval", "verdictOfKey",
  ], "approval.mjs 导出面 = 卡面（两形构树 / 键位闭集 / 出口表 · 操作区 · 两标称）+ 出口动作（同一路）")
  assert.deepEqual(Object.keys(activity).sort(), ["mountPool", "poolModel", "poolTree"], "activity.mjs 导出面 = 右列三段（模型 → 构树 → 薄挂载 —— R3b 重写为子 agent 块面，面形不变）")

  const html = stripComments(readFileSync(new URL("../renderer/index.html", import.meta.url), "utf8"))
  const app = stripComments(readFileSync(new URL("../renderer/app.mjs", import.meta.url), "utf8"))
  // KD-RC-5（R3c）：文件链接面**不承载** —— 核 `linkifyPaths` 在渲染面无消费（视角面 = 桌面不落假控件）
  for (const name of ["chat-text.mjs", "chat.mjs", "chat-copy.mjs", "chat-tool.mjs", "activity.mjs", "approval.mjs", "question.mjs", "plan.mjs"]) {
    const view = stripComments(readFileSync(new URL(`../renderer/views/${name}`, import.meta.url), "utf8"))
    assert.ok(!/linkifyPaths/.test(view), `渲染面无核 linkifyPaths 消费（KD-RC-5）：${name}`)
  }
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
  for (const key of ["activeSession", "blocks", "history", "following", "pendingNew", "locale", "pool"]) {
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
  for (const key of ["usage", "tasks", "turns", "turnStarts", "tokens", "timers", "projectInfo", "sessions", "pool", "blocks", "tabs", "activeTab", "tabBadges", "locale"]) {
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
  // R3b 增停止出口 —— `subagent:stop` 通道字面与薄壳调用形）
  for (const wiring of [
    "onApprove, onTogglePool", "respondApproval(host, promptId, verdict)", "togglePool(defaultStore.get(), key)",
    "onStopSubagent", 'host.invoke("subagent:stop", { key, id, ...(role ? { role } : {}) })',
  ]) {
    assert.ok(pool.includes(wiring), `接线落点在位：${wiring}（审批出口同一路 / 折叠入状态树 / 停止出口零乐观写）`)
  }
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
