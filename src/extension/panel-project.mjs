/**
 * panel-project.mjs — ChatPanel multi-root current-project switcher (split out of
 * chat-panel.mjs). Every function takes the ChatPanel instance as `panel`.
 */
import * as vscode from "vscode"
import { t } from "../i18n.mjs"
import { resumeSlot } from "./session-io.mjs"
import { _cwd, setProjectFolder } from "./panel-messages.mjs"
import { loadSession } from "./panel-session.mjs"
import { pushIndexStatus, maybePromptIndex } from "./panel-index.mjs"

  /** Snapshot for the webview's project button: { folders, current, multi, followActive }. */
export function projectInfo(_panel) {
    const folders = (vscode.workspace.workspaceFolders ?? []).map((f) => ({
      name: f.name, path: f.uri.fsPath,
    }))
    const follow = vscode.workspace.getConfiguration("thincoder.project").get("followActiveEditor", false)
    return { folders, current: _cwd(), multi: folders.length > 1, followActive: !!follow }
  }

export function pushProject(panel) {
    panel._panel?.webview.postMessage({ type: "project", ...panel._projectInfo() })
  }

  /** Apply a project switch (validated): rebind the slot and reload everything per-cwd. */
export async function applyProjectSwitch(panel, fsPath) {
    // C2（F-C2a）：守卫改谓词 turnBusy()——running 或 susp（含会话等待）一律拒绝
    //（旧 _turnActive 只挡回合——挂起会话期换项目会孤儿化后台池）。
    if (panel.turnBusy()) {
      vscode.window.showWarningMessage("ThinCoder: a task is running — stop it before switching projects.")
      return
    }
    const r = setProjectFolder(fsPath)
    if (!r.ok) {
      vscode.window.showErrorMessage(`ThinCoder: ${r.error}`)
      return
    }
    // §11 销毁点（AGENT-LOOP §11——2026-09-08）：换项目 → 会话级 agent 销毁（AC4——agent
    // 不跨 cwd 复用；onProjectChanged → loadSession 同款置 null——此处显式接线双保险）
    panel._agent = null
    await onProjectChanged(panel)
  }

  /** After the cwd changed: rebind to the new project's session and refresh per-cwd UI. */
export async function onProjectChanged(panel) {
    panel._slot = null
    const cwd = _cwd()
    // 2026-09-05 §10 D-2：认领点改 resumeSlot（本端记录/一次性继承/全新分配——与
    // panel-session 的 ensureSlot/status 同点）；全新项目 claim 先行，文件首保存落盘
    panel._slot = resumeSlot(cwd).slot
    pushProject(panel)
    loadSession(panel)   // clearMessages + new project's history + sessions + autoApprove/planMode
    pushIndexStatus(panel)
    maybePromptIndex(panel)
  }

  /** Native picker over the workspace roots (fixed options) + the follow-active toggle. */
export async function pickProject(panel) {
    const folders = vscode.workspace.workspaceFolders ?? []
    if (folders.length < 2) {
      vscode.window.showInformationMessage("Only one workspace folder is open.")
      return
    }
    const cfg = vscode.workspace.getConfiguration("thincoder.project")
    for (;;) {
      const followActive = !!cfg.get("followActiveEditor", false)
      const items = folders.map((f) => ({
        label: f.uri.fsPath === _cwd() ? `$(check) ${f.name}` : `$(folder) ${f.name}`,
        description: f.uri.fsPath,
        folder: f,
      }))
      items.push({
        label: (followActive ? "$(check) " : "") + t("project.followActive"),
        description: t("project.followActiveHint"),
        toggle: true,
      })
      const sel = await vscode.window.showQuickPick(items, {
        placeHolder: t("project.pickPlaceholder"),
        matchOnDescription: true,
      })
      if (!sel) return
      if (sel.toggle) {
        await cfg.update?.("followActiveEditor", !followActive, vscode.ConfigurationTarget?.Global)
        continue  // re-open the picker so the new toggle state is visible
      }
      if (sel.folder.uri.fsPath === _cwd()) return
      await applyProjectSwitch(panel, sel.folder.uri.fsPath)
      return
    }
  }
