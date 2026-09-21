/**
 * workspace-guard.mjs — 无工作区守卫（2026-09-21 批 vsc-no-folder-guard）。
 *
 * 问题：无文件夹窗口里 `_cwd()`（panel-messages.mjs）静默回落 `process.cwd()`，而扩展宿主
 * 进程 cwd = VS Code 安装目录（快捷方式启动语义）⇒ 会话 / agent / 工具 / 索引全部锚在那儿，
 * VS Code 原地更新即清空（外部用户实证：丢过两次交付物）。用户 2026-09-21 裁定：无工作区
 * ⇒ **拒启 agent + 明确提示**（否「静默锚定」，亦否「自动搬家」——不替用户选落点）。
 *
 * 机制单源 = `docs/vsc/design/PROJECT-SWITCHER.md` §4.1。本档 = leaf（只 import `vscode`——
 * 无环）：判据 + 提示（逐字常量 + 去重）+ 状态推送三件。调用形：
 *   `if (blockOnNoWorkspace(panel)) return`     —— 守卫面 ②③④⑦⑧（被动：每次被挡动作各提示一次）
 *   `blockOnNoWorkspace(panel, { once: true })` —— 守卫面 ① / 恢复面转空向（主动：每空窗恰一次）
 */
import * as vscode from "vscode"

/** host 通知文本（**逐字**——英文硬编码随本端通知面现状；机制 = `PROJECT-SWITCHER.md` §4.1）。 */
export const NO_WORKSPACE_MESSAGE = "ThinCoder: no folder is open — the agent has no workspace to work in. Open a folder to start."
/** 通知按钮（**逐字**）+ 其动作：VS Code 内置命令，**无参** ⇒ 原生文件夹选择框。 */
export const OPEN_FOLDER_LABEL = "Open Folder"
export const OPEN_FOLDER_COMMAND = "vscode.openFolder"

/** 判据（**单源**）：工作区文件夹非空。守卫面 / 派生面一律经本函数——`src/extension/**` 里
 *  「文件夹非空」的算式只许住本档（结构锁 = `test/workspace-guard.test.mjs` 用例 13）。 */
export function hasWorkspaceFolder() {
  return (vscode.workspace.workspaceFolders?.length ?? 0) > 0
}

/** 提示（host 通知 + 一键动作）：用户可见面——不吞（非仅日志）。按钮回调 ⇒ 内置
 *  `vscode.openFolder`；提示面自身失败不阻断守卫（拒启语义仍成立）。 */
export function notifyNoWorkspace() {
  return Promise.resolve(vscode.window.showWarningMessage(NO_WORKSPACE_MESSAGE, OPEN_FOLDER_LABEL))
    .then((answer) => { if (answer === OPEN_FOLDER_LABEL) return vscode.commands.executeCommand(OPEN_FOLDER_COMMAND) })
    .catch(() => {})
}

/** 守卫态推送（host → webview）：消费 = `chat.js` case ⇒ `S._workspaceRequired`（占位符第三态）。 */
export function pushWorkspaceGuard(panel, active) {
  panel?._panel?.webview.postMessage({ type: "workspaceGuard", active: active === true })
}

/** 守卫释放（工作区转非空）：主动提示去重标志复位——下个空窗 ① 再提示一次。 */
export function releaseWorkspaceGuard(panel) {
  if (panel) panel._wsGuardNotified = false
}

/**
 * 守卫（守卫面 / 恢复面唯一入口）：无工作区 ⇒ 提示 + `true`（被挡）。
 * `once`（主动提示——① 面板启用 / 恢复面转空向）⇒ 每空窗**恰一次**（`panel._wsGuardNotified`
 * 去重；释放 = `releaseWorkspaceGuard`）；缺省（被动——被挡的用户动作）⇒ **每次都提示**。
 * 该标志同时是恢复面的「此前守卫」判据（非空窗永不置位；转非空 ⇒ 释放 + boot 放行）。
 */
export function blockOnNoWorkspace(panel, { once = false } = {}) {
  if (hasWorkspaceFolder()) return false
  if (!(once && panel?._wsGuardNotified === true)) {
    try { void notifyNoWorkspace() } catch { /* 提示面失败不阻断守卫（拒启语义仍成立） */ }
  }
  if (panel) panel._wsGuardNotified = true
  return true
}
