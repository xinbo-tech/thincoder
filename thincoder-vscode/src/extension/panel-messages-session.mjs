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
import { switchToSlot, setSlotTitle, slotOccupancy } from "./session-io.mjs"
import { _cwd } from "./panel-messages.mjs"

/** 迁出自 `panel-messages.mjs` 的 case "newSession"。 */
export function handleNewSession(panel) {
  // §17: session switch during a suspension session would orphan the background pool
  // (its lines/pool belong to the current session). Stop the session first.
  if (panel._susp?.active) { vscode.window.showWarningMessage("ThinCoder: background subagents are still running — stop them before starting a new session."); return }
  panel._newSession()
}

/** 迁出自 `panel-messages.mjs` 的 case "switchSession"。 */
export async function handleSwitchSession(panel, msg) {
  // 会话切换竞态守卫（GitHub #2/#5，2026-08-28）：运行中禁止切换——此前只改 _slot 指针
  // 不 abort，旧 turn 的 stream/complete/标题会灌进新会话视图（"思考串台"）、内容落错槽
  // （"写错会话文件"）。与 applyProjectSwitch（panel-project.mjs）的运行中拒绝同模式。
  // C2（F-C2a）：守卫改谓词 turnBusy()——running 或 susp（含 digest 间等待）一律拒绝
  // （旧 _turnActive || _susp?.active 双读合一）。
  if (panel.turnBusy()) {
    vscode.window.showWarningMessage("ThinCoder: a task is running — stop it before switching sessions.")
    return
  }
  // 交付评审 🔵#5：manifest 漂移（槽不存在）时 switchToSlot 返回 null 且不切指针——
  // 此时不得把面板绑到幻影槽（否则渲染出空会话）。
  const target = switchToSlot(_cwd(), msg.slot)  // persists the shared active pointer for CLI interop
  if (target == null) return
  // 2026-09-01 advisor round2 🟡：目标槽被另一活进程（CLI/另一实例）占用时不得钉槽——
  // 面板 _slot 粘性会绕过 activeSlot 的认领决策，双方写同一槽静默互覆盖。占用 →
  // 不钉（_slot = null）+ 提示；**不认领、不写解析缓存 / 本端记录**（session-io.mjs:182-185
  // 仅未占才写穿——P3/P4）。随后 _loadSession() 经 ensureSlot 读解析缓存绑回**本端原槽**
  // （SESSION.md §6.15 P3）——非"新建空会话"：面板留在自身会话，文案同此语义。
  const occ = slotOccupancy(_cwd(), msg.slot)
  if (occ.occupied) {
    vscode.window.showWarningMessage(`ThinCoder: session ${msg.slot} is being used by another live process — staying on this panel's current session.`)
    panel._slot = null
  } else {
    panel._slot = msg.slot          // bind this panel to the chosen slot
  }
  await panel._loadSession()
}

/** 迁出自 `panel-messages.mjs` 的 case "deleteSession"。 */
export async function handleDeleteSession(panel, msg) {
  if (panel._susp?.active) { vscode.window.showWarningMessage("ThinCoder: background subagents are still running — stop them before deleting a session."); return }
  await panel._deleteSession(msg.slot)
}

/** 迁出自 `panel-messages.mjs` 的 case "renameSession"。 */
export async function handleRenameSession(panel, msg) {
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
