/**
 * panel-messages-session.mjs — 会话族消息 handler（自 panel-messages.mjs 拆出——VSC-DEBT D-3/KD-6）。
 *
 * 迁出段（设计 §3.3 档二逐名）：`newSession` / `switchSession` / `deleteSession` / `renameSession` /
 * `setProject` / `loadOlder` 六个 case 的 handler 体——逐字搬迁（既有注释一并随迁），仅 switch
 * 结构件适配：case 包裹大括号去除 · 中途 `break` → `return` · 尾 `break` 去除（分发续行由
 * `panel-messages.mjs` 分发表各 case 的 `break` 保持）。
 *
 * 缝保持：`panel-messages.mjs` 分发表仍按同名 case 标签分发——case 标签与既有导出名零改
 * （7 个 src 消费档 + 10 个 test 消费档 import 面零改）。
 *
 * B2 环 import（同 `panel-messages ↔ panel-session` 先例）：`panel-messages.mjs` import 本档；
 * 本档反向 import `_cwd`——`_cwd` 仅在本档 handler 体内解引用（延迟解引用）——两模块均无顶层
 * 跨环读取——环安全。
 */
import * as vscode from "vscode"
import { t } from "../i18n.mjs"
import { SLOT_OCCUPIED, switchToSlot, setSlotTitle, slotOccupancy } from "./session-io.mjs"
import { _cwd } from "./panel-messages.mjs"
// 无工作区守卫（2026-09-21 批 · `PROJECT-SWITCHER.md` §4.1）：⑦ 会话族五 handler（leaf——无环）
import { blockOnNoWorkspace } from "./workspace-guard.mjs"

/** 迁出自 `panel-messages.mjs` 的 case "newSession"。 */
export function handleNewSession(panel) {
  // ⑦ 无工作区守卫：槽写面（新建 = 分配新槽）
  if (blockOnNoWorkspace(panel)) return
  // §17: session switch during a suspension session would orphan the background pool
  // (its lines/pool belong to the current session). Stop the session first.
  if (panel._susp?.active) { vscode.window.showWarningMessage("ThinCoder: background subagents are still running — stop them before starting a new session."); return }
  panel._newSession()
}

/** 迁出自 `panel-messages.mjs` 的 case "switchSession"。 */
export async function handleSwitchSession(panel, msg) {
  // ⑦ 无工作区守卫：槽写面（切换 = 改共享 active 指针 / 端标记 / 认领集）
  if (blockOnNoWorkspace(panel)) return
  // 会话切换竞态守卫（GitHub #2/#5，2026-08-28）：运行中禁止切换——此前只改 _slot 指针
  // 不 abort，旧 turn 的 stream/complete/标题会灌进新会话视图（"思考串台"）、内容落错槽
  // （"写错会话文件"）。与 applyProjectSwitch（panel-project.mjs）的运行中拒绝同模式。
  // C2（F-C2a）：守卫改谓词 turnBusy()——running 或 susp（含 digest 间等待）一律拒绝
  // （旧 _turnActive || _susp?.active 双读合一）。
  if (panel.turnBusy()) {
    vscode.window.showWarningMessage("ThinCoder: a task is running — stop it before switching sessions.")
    return
  }
  // F-CR2 判据前置（2026-09-21 · SESSION.md §6.15 / §6.16）：先 `slotOccupancy`（纯读判据）判占用——
  // 受占 ⇒ **拒绝路径不进入 `switchToSlot`**：共享 active 指针 / 端标记 / 认领集 / 解析缓存
  // **四不动**；不钉槽（`_slot = null`）+ 提示 → `_loadSession()` 经缓存重绑**本端原槽**。
  // 旧序 = 先调 `switchToSlot` 再判占 ⇒ 被拒切换仍把共享指针翻到目标槽（缺陷乙）。占用判定
  // 单源 = 核 `slotOccupancy`（未知 ⇒ 保守按占用——D-MI10）。
  const occ = slotOccupancy(_cwd(), msg.slot)
  if (occ.occupied) {
    vscode.window.showWarningMessage(`ThinCoder: session ${msg.slot} is being used by another live process — staying on this panel's current session.`)
    panel._slot = null
    await panel._loadSession()
    return
  }
  // 交付评审 🔵#5：manifest 漂移（槽不存在）时 switchToSlot 返回 null 且不切指针——
  // 此时不得把面板绑到幻影槽（否则渲染出空会话）。
  const target = switchToSlot(_cwd(), msg.slot)  // persists the shared active pointer for CLI interop
  // F-CR2 第二判（台账 #171 · 2026-09-22 · SESSION.md §6.15 / §6.16）：前置判据与函数内判据之间的
  // TOCTOU 窗内撞占 ⇒ 收到可区分信号——**保持 `_slot` 现值**（不钉他端活槽；四不动不适用——本路
  // 未进入写入面）+ 提示 + `_loadSession()` 重绑本端原槽。与前置判据路载荷分述：前置路 = `_slot = null`
  // + 缓存重绑；本路 = **保持现值**。
  if (target === SLOT_OCCUPIED) {
    vscode.window.showWarningMessage(`ThinCoder: session ${msg.slot} is being used by another live process — staying on this panel's current session.`)
    await panel._loadSession()
    return
  }
  if (target == null) return
  panel._slot = msg.slot          // bind this panel to the chosen slot
  await panel._loadSession()
}

/** 迁出自 `panel-messages.mjs` 的 case "deleteSession"。 */
export async function handleDeleteSession(panel, msg) {
  // ⑦ 无工作区守卫：槽写面（删除 = 删文件 + 改激活指针）
  if (blockOnNoWorkspace(panel)) return
  if (panel._susp?.active) { vscode.window.showWarningMessage("ThinCoder: background subagents are still running — stop them before deleting a session."); return }
  await panel._deleteSession(msg.slot)
}

/** 迁出自 `panel-messages.mjs` 的 case "renameSession"。 */
export async function handleRenameSession(panel, msg) {
  // ⑦ 无工作区守卫：槽写面（改名）——先于输入框（不改名不弹框）
  if (blockOnNoWorkspace(panel)) return
  // Manual rename: prefill the current title; empty input = cancel (keep old title).
  const title = await vscode.window.showInputBox({
    prompt: t("session.renamePrompt"),
    value: msg.currentTitle || "",
    placeHolder: t("session.renamePlaceholder"),
    validateInput: (v) => (v.length > 60 ? t("session.renameTooLong") : null),
  })
  if (!title || !title.trim()) return
  const r = setSlotTitle(_cwd(), msg.slot, title.trim())
  if (!r.ok) vscode.window.showWarningMessage(`ThinCoder: session rename failed (${r.reason})`) // §12 F3：标题写失败可见
  panel._pushSessions()
}

/** 迁出自 `panel-messages.mjs` 的 case "setProject"。 */
export async function handleSetProject(panel, msg) {
  // ⑦ 无工作区守卫：项目切换（多根面）——无文件夹窗口里无可切
  if (blockOnNoWorkspace(panel)) return
  // §17: project switch mid-suspension would yank cwd out from under the session —
  // the suspension lines/slot belongs to the old project's session store.
  if (panel._susp?.active) { vscode.window.showWarningMessage("ThinCoder: background subagents are still running — stop them before switching projects."); return }
  // Current-project switcher (multi-root): with fsPath → switch directly;
  // without → show the native folder picker.
  if (msg.fsPath) await panel._applyProjectSwitch(msg.fsPath)
  else await panel._pickProject()
}

/** 迁出自 `panel-messages.mjs` 的 case "loadOlder"（历史分页入口——回复消息 `historyPage` 由面板内部产出）。 */
export function handleLoadOlder(panel, msg) { panel._loadOlder(msg.before) }
