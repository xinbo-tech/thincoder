/**
 * panel-project.mjs — ChatPanel multi-root current-project switcher (split out of
 * chat-panel.mjs). Every function takes the ChatPanel instance as `panel`.
 */
import * as vscode from "vscode"
import { t } from "../i18n.mjs"
import { resumeSlot } from "./session-io.mjs"
// F-CR4 跨 cwd 认领释放（台账 #168② · SESSION.md §6.15 / §6.16）：核薄函数（容忍逻辑全在核——
// 永不抛出 / 返回 boolean）；直引 manifest 档（与 `session-io.mjs` 的退出释放同源面）。
import { releaseClaimsAll } from "@thincoder/core/session-slots-manifest.mjs"
import { _cwd, setProjectFolder } from "./panel-messages.mjs"
import { loadSession } from "./panel-session.mjs"
import { ensureMemoryHandle } from "../embed-config.mjs"
import { pushIndexStatus, maybePromptIndex } from "./panel-index.mjs"
import { refreshLedger } from "./ledger-surface.mjs" // LEDGER-SURFACE（§2.30.3.5）

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

  /** F-CR4 跨 cwd 释放单点（台账 #168② · SESSION.md §6.15 ③ / §6.16）：换 cwd **之前**记旧 cwd、切换成功后
   *  调本函数——对**旧 cwd** manifest 补一次同语义释放（保留集 = 空：切换后该 cwd 内本进程已无活绑定）；
   *  同 cwd（未换）⇒ no-op。核薄函数 `releaseClaimsAll`：无 manifest / 无本进程认领 ⇒ 零写早退；失败
   *  容忍（永不抛出）。**三个切换落点共用本单点**（显式切换器 / 跟随活动编辑器 / 工作区兜底回落）
   *  ——防两处漂移；值条件删除（核 `staleClaims`）保证不碰他端进程认领。 */
export function releaseOldCwdClaims(oldCwd) {
    if (!oldCwd || oldCwd === _cwd()) return false
    return releaseClaimsAll(oldCwd)
  }

  /** Apply a project switch (validated): rebind the slot and reload everything per-cwd. */
export async function applyProjectSwitch(panel, fsPath) {
    // C2（F-C2a）：守卫改谓词 turnBusy()——running 或 susp（含会话等待）一律拒绝
    //（旧 _turnActive 只挡回合——挂起会话期换项目会孤儿化后台池）。
    if (panel.turnBusy()) {
      vscode.window.showWarningMessage("ThinCoder: a task is running — stop it before switching projects.")
      return
    }
    // F-CR4 跨 cwd 释放（台账 #168② · SESSION.md §6.16）：换 cwd 前先记旧 cwd——切换成功后对**旧 cwd**
    // manifest 补一次同语义释放（保留集 = 空：切换后该 cwd 内本进程已无活绑定）；不释放则旧 cwd
    // 认领残留至进程退出（旧行为）。§6.16 假定 + 复核条件：本端单绑定（WebviewViewProvider 单实例
    // 视图）；多窗口 / 多面板 = 他进程（值条件删除天然不碰他端认领）或本进程多面板（另案）。
    const oldCwd = _cwd()
    const r = setProjectFolder(fsPath)
    if (!r.ok) {
      vscode.window.showErrorMessage(`ThinCoder: ${r.error}`)
      return
    }
    // 释放落点：cwd 已翻、本端绑定已失效（下一行 _agent 置空 / onProjectChanged 重绑新 cwd）。
    releaseOldCwdClaims(oldCwd)
    // 销毁点（2026-09-08）：换项目 → 会话级 agent 销毁（AC4——agent
    // 不跨 cwd 复用；onProjectChanged → loadSession 同款置 null——此处显式接线双保险）
    panel._agent = null
    await onProjectChanged(panel)
  }

  /** After the cwd changed: rebind to the new project's session and refresh per-cwd UI. */
export async function onProjectChanged(panel) {
    panel._slot = null
    const cwd = _cwd()
    // 2026-09-05 §10 D-2：认领点改 resumeSlot（本端记录/一次性继承/全新分配——与
    // panel-session 的 ensureSlot/openSessionContent（B2——原 status 位置，2026-09-09）
    // 同点）；全新项目 claim 先行，文件首保存落盘
    // F-MI7：`resumeSlot` = async（核同名件同形）——本函数（绑定入口之一）awaited 认领
    // 后再钉槽；决策失败（无返回值）⇒ 保持置空（下次 ensureSlot 后台收敛重认领）。
    panel._slot = (await resumeSlot(cwd))?.slot ?? null
    pushProject(panel)
    loadSession(panel)   // clearMessages + new project's history + sessions + autoApprove/planMode
    // W8：核记忆面就绪（句柄创建——换项目后索引读数/构建入口同源可用）
    await ensureMemoryHandle()
    pushIndexStatus(panel)
    maybePromptIndex(panel)
    refreshLedger(panel, { emit: false }) // LEDGER-SURFACE：换项目即时刷新 item（不投递不记账）
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
