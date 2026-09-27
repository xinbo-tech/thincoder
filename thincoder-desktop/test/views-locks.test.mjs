/**
 * views-locks.test.mjs — E-2 零回归锁面用例（批档 §2.5 U52 · 原住 `test/views-chrome.test.mjs`）：
 * 测试清单两向自检（登记 ⇄ 在盘）/ 八档导出面锁 / 七槽接线结构面 / 会话族 · 对话流 · 审批出口 · 折叠接线结构面
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
  assert.deepEqual(Object.keys(chrome).sort(), ["headModel", "headTree", "mountHead", "mountStatus", "sessionMetaOf", "statusModel", "statusTree"], "chrome.mjs 导出面 = 会话头三段 + 供给取面单源一段 + 状态栏三段")
  assert.deepEqual(Object.keys(chat).sort(), ["chatModel", "chatTree", "mountChat", "settleFrame", "syncChrome"], "chat.mjs 导出面 = 三档 + 帧尾态刷 / 帧尾六步")
  assert.deepEqual(Object.keys(chatTool).sort(), [
    "DIFF_FILE_FLOOR", "DIFF_LINE_FLOOR", "STATUS_WORD", "changeTotals", "toggleExpanded", "toolCard", "toolChanges",
    "wire", "withKey",
  ], "chat-tool.mjs 导出面 = 工具卡构树 + 接线两态 + 折叠纯函数 + 核状态词表 / 改动摘要阈值与合计（本批增复用面 —— 审批卡同源消费）")
  assert.deepEqual(Object.keys(approval).sort(), [
    "approvalActions", "approvalExits", "approvalSummary", "approvalTitle", "approvalTree", "respondApproval", "verdictOfKey",
  ], "approval.mjs 导出面 = 卡面（两形构树 / 键位闭集 / 出口表 · 操作区 · 两标称）+ 出口动作（同一路）")
  assert.deepEqual(Object.keys(activity).sort(), ["mountPool", "poolModel", "poolTree"], "activity.mjs 导出面 = 池面三段（模型 → 构树 → 薄挂载）")

  const html = stripComments(readFileSync(new URL("../renderer/index.html", import.meta.url), "utf8"))
  const app = stripComments(readFileSync(new URL("../renderer/app.mjs", import.meta.url), "utf8"))
  const pool = stripComments(readFileSync(new URL("../renderer/mount-pool.mjs", import.meta.url), "utf8"))
  const settings = stripComments(readFileSync(new URL("../renderer/mount-settings.mjs", import.meta.url), "utf8"))
  const sessionActions = stripComments(readFileSync(new URL("../renderer/mount-sessions.mjs", import.meta.url), "utf8"))
  for (const slot of ["tabs", "session-head", "status", "flow"]) {
    assert.ok(html.includes(`data-slot="${slot}"`), `index.html 容器锚在位：${slot}`)
    assert.ok(app.includes(`[data-slot="${slot}"]`), `app.mjs 槽锚声明在位：${slot}`)
  }
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
  for (const key of ["pool", "poolCollapsed", "activeTab", "locale"]) {
    assert.ok(poolKeys.includes(`"${key}"`), `活动池订阅切片在位：${key}`)
  }
  assert.ok(pool.includes("POOL_SLOT"), "活动池容器锚常量在位：POOL_SLOT")
  for (const call of [
    "paintShell(state)", "mountTabbar(", "mountHead(", "mountStatus(", "mountChat(", "paintChat(state, changedKeys)",
    "attachScroll(", "attachEvents(", "paintPool(state)",
  ]) {
    assert.ok(app.includes(call), `接线调用在位：${call}（结构面 —— 端到端 = 冒烟）`)
  }
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
  // 审批出口 / 折叠接线结构面（批 7 落形 · 批 8 随迁 `mount-pool.mjs`：卡面与池面条目同一路 —— 三出口描述符单源）
  for (const wiring of [
    "onApprove, onTogglePool", "respondApproval(host, promptId, verdict)", "togglePool(defaultStore.get(), key)",
  ]) {
    assert.ok(pool.includes(wiring), `接线落点在位：${wiring}（审批出口同一路 / 折叠入状态树）`)
  }
})
