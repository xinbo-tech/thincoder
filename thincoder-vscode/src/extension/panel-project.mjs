/**
 * panel-project.mjs — ChatPanel multi-root current-project switcher (split out of
 * chat-panel.mjs). Every function takes the ChatPanel instance as `panel`.
 */
import * as vscode from "vscode"
import { t } from "../i18n.mjs"
import { resumeSlot, loadProjectFolder, saveProjectFolder } from "./session-io.mjs"
// F-CR4 跨 cwd 认领释放（台账 #168② · SESSION.md §6.15 / §6.16）：核薄函数（容忍逻辑全在核——
// 永不抛出 / 返回 boolean）；直引 manifest 档（与 `session-io.mjs` 的退出释放同源面）。
import { releaseClaimsAll } from "@thincoder/core/session-slots-manifest.mjs"
import { _cwd, setProjectFolder, hasProjectOverride } from "./panel-messages.mjs"
import { loadSession } from "./panel-session.mjs"
import { ensureMemoryHandle } from "../embed-config.mjs"
import { pushIndexStatus, maybePromptIndex } from "./panel-index.mjs"
import { refreshLedger } from "./ledger-surface.mjs" // LEDGER-SURFACE：台账 item 刷新

  /** Snapshot for the webview's project button: { folders, current, multi, followActive, chosen }. */
export function projectInfo(_panel) {
    const folders = (vscode.workspace.workspaceFolders ?? []).map((f) => ({
      name: f.name, path: f.uri.fsPath,
    }))
    const follow = vscode.workspace.getConfiguration("thincoder.project").get("followActiveEditor", false)
    // #1101㈠ (a)（2026-10-10 vsc-consistency 批）：未选定态可见化判据——「没选过不猜」面
    // （webview 按钮标记读本字段；单根面按钮隐藏，本字段不消费）。
    return { folders, current: _cwd(), multi: folders.length > 1, followActive: !!follow, chosen: hasProjectOverride() }
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

  /** 锚记忆写点（#1101㈠ (b)——2026-10-10 vsc-consistency 批 · `PROJECT-SWITCHER.md` §3.1）：
   *  成功切换后记「最后所在」（workspaceState 键 `thincoder.projectFolder`）——显式切换器
   *  （picker 径 + `setProject`-fsPath 径）∥ 跟随自动切换（chat-panel）两路同点同义。
   *  **记录 = 最后一次成功切换的锚——非活锚**：工作区兜底回落径（chat-panel 第三支路）
   *  改活锚而不写本记录（两义分立）。 */
export function rememberProjectFolder(panel, fsPath) {
    saveProjectFolder(panel?._context?.workspaceState, fsPath)
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
    // #1101㈠ (b)：锚记忆写点之一——「一切成功切换后」（本点覆盖两径）；拒径（busy ∥ 非成员）
    // 在上方已 return ⇒ 零写。
    rememberProjectFolder(panel, fsPath)
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
    refreshLedger(panel) // LEDGER-SURFACE：换项目即时刷新 item
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

  /** 「已弹过」标记读写（宽容——同 `loadProjectFolder`/`saveProjectFolder` 先例；标记 = 每工作区
   *  恰一次的有效载荷，结果无关——ESC ∥ 选中 ∥ 取消同判「已弹」）。 */
const PICK_OFFERED_KEY = "thincoder.projectPickOffered"
function pickOffered(workspaceState) {
    try { return workspaceState.get(PICK_OFFERED_KEY) === true } catch { return false }
  }
function markPickOffered(workspaceState) {
    try { workspaceState.update(PICK_OFFERED_KEY, true) } catch {}
  }

  /** 锚记忆恢复点（#1101㈠ (b)——2026-10-10 vsc-consistency 批 · `PROJECT-SWITCHER.md` §3.1）：
   *  调用点 = `ChatPanel` 构造内 · 订阅块之前（先于一切 `_cwd()` 消费）。
   *  条件 = 多根 ∧ 无活 override ∧ 记录 ∈ folders；**单根 ∥ 无工作区 = 不读不写**（先于读早退）。
   *  恢复动作 = `setProjectFolder(记录)` 单点（成员校验在内：失效记录 ⇒ `{ok:false}`——零抛
   *  零写零动作）；`_cwd()` 全链随动（会话槽 / 索引 / `@` 补全 / agent 工具目录同源）。
   *  @returns {boolean} 真 = 本次恢复生效（测试直驱面）。 */
export function restoreProjectFolder(panel) {
    const folders = vscode.workspace.workspaceFolders ?? []
    if (folders.length < 2) return false
    if (hasProjectOverride()) return false
    const saved = loadProjectFolder(panel?._context?.workspaceState)
    if (!saved) return false
    return setProjectFolder(saved).ok === true
  }

  /** 首开弹拍（#1101㈠ (a)——「多根首启让用户选一次」）：调用点 = `resolveWebviewView`（面板首开拍）。
   *  门四 = 多根 ∧ `!hasProjectOverride()` ∧ 未弹过（`thincoder.projectPickOffered`）∧ 空闲
   *  （`!turnBusy()`）。命中 ⇒ 写弹过标记（**弹即写——ESC 后不再主动弹**）→ 复用 `pickProject`
   *  （零新选择器）；余 ⇒ 零动作。频度 = 每工作区**恰一次**（标记住 workspaceState，跨窗口存活）。
   *  @returns {Promise<boolean>} 真 = 本次弹拍发生（测试直驱面）。 */
export async function maybeOfferProjectPick(panel) {
    const folders = vscode.workspace.workspaceFolders ?? []
    if (folders.length < 2) return false
    if (hasProjectOverride()) return false
    if (panel.turnBusy()) return false
    const ws = panel?._context?.workspaceState
    if (pickOffered(ws)) return false
    markPickOffered(ws)
    await pickProject(panel)
    return true
  }
