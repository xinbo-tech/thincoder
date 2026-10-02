/**
 * update.mjs — 桌面自动更新**策略面**（KD-71 ∥ §2.8.1 —— `docs/desktop/design/PACKAGING.md` §1 ∥ §2.8.1；台账 #810 ·
 * 桌面发布·阶段二批）：五态状态机（§2.8.1 表——`idle` ∥ `checking` ∥ `downloading` ∥ `ready`；`idle` 兼初始 ∥
 * 无更新 ∥ 失败复位三入口）+ 启动自检（ready 后延时一次）+
 * 手动检查三果 + 安装两径（`autoInstallOnAppQuit` ∥ 菜单确认 ⇒ `quitAndInstall(true, true)`）。
 * **隔离形（禁令）= 策略面零 `electron` ∥ 零 `electron-updater` 顶层 import**：全经注入五缝 —— `updater`
 * （`autoUpdater` 实例）∥ `notify`（原生通知）∥ `menuRefresh`（菜单重建）∥ `dialog`（确认 ∥ 结果两态）∥ `log`
 * （stderr 详情行）——另 `words()` 词表现读注入（语言随动；值面 = `menu-words.mjs`）；装配住 `main.mjs`
 * （`createRequire` 取库 + electron 原语落子——先例 = `heap-watch.mjs` 注入缝形）。
 * **武装门（判据）**：装配面注入 `enabled` = `app.isPackaged ∧ 非 --smoke`——未武装 ⇒ 零定时器 ∥ 检查面零动作
 * （库自身 `isUpdaterActive()` 返回 false = 第二道保险）；`--smoke` 读数面零增字段。
 * **不打断会话（判据）**：检查 ∥ 下载全异步（事件驱动）——零模态框 ∥ 零窗口操作 ∥ 零会话面读写；下载期零 UI
 * （不接 `download-progress` 呈现——仅 stderr 详情行）。
 * **手动检查三果（§2.8.1）**：`update-available` ⇒ 转下载态（静默续跑）∥ `update-not-available` ⇒ 对话框
 * 「已是最新版本（v<当前号>）」∥ `error` ⇒ 对话框「检查更新失败」+ 一行原因（不自动重试）。
 * **失败面（自动面 · fail-soft）**：全静默——stderr 详情行 + 状态回 `idle`（零 nag ∥ 零自动重试 ∥ 零弹框）。
 * 提示重启两原生面：① 通知一次/版本（点击 ⇒ 聚焦主窗 = 装配面落子；**不直接安装**——安装入口唯一 = 菜单项）；
 * ② 菜单项状态机 label（状态迁移 ⇒ `menuRefresh()` 重建；状态映射消费 = `app-menu.mjs` 读 `currentState()`）。
 */

/** 状态闭集（序 = §2.8.1 状态机表；`idle` 行兼初始 ∥ 无更新 ∥ 失败复位三入口）。 */
export const UPDATE_STATES = Object.freeze(["idle", "checking", "downloading", "ready"])

/** 启动自检延时（`app.whenReady()` 后一次/会话——避开启动 I/O 峰值与首帧窗；§2.8.1）。 */
export const STARTUP_CHECK_DELAY_MS = 10_000

/** 状态 → 菜单词键（值面 = `menu-words.mjs`；消费 = `app-menu.mjs` 帮助组项 label）。 */
export const UPDATE_STATE_WORD_KEYS = Object.freeze({
  idle: "checkUpdate",
  checking: "checkingUpdate",
  downloading: "downloadingUpdate",
  ready: "restartUpdate",
})

/** 词句 `{version}` 占位替换（三句携占位——括注形各语言自持；version 非串 ⇒ 空串替换，防 "undefined" 面）。 */
function fillVersion(text, version) {
  if (typeof text !== "string") return ""
  return text.replace("{version}", typeof version === "string" ? version : "")
}

/**
 * 更新面（策略面句柄）：`currentState()` ∥ `scheduleStartupCheck()` ∥ `checkNow({ manual })` ∥ `menuClick()`。
 * `enabled` = 武装门（装配面判据注入）；五缝 + `words()` 词表现读注入；`delayMs` ∥ `setTimer` 可注入
 * （平 node 直测——先例 = `heap-watch.mjs` 定时器注入）。全部对外出口**不抛**（fail-soft——更新面失败不影响应用）。
 * @param {{ enabled?: boolean, updater?: object, words?: () => object, notify?: Function, menuRefresh?: Function,
 *           dialog?: { confirmRestart?: Function, result?: Function }, log?: Function, delayMs?: number,
 *           setTimer?: Function }} deps
 */
export function createUpdateFace({
  enabled = false,
  updater = null,
  words = () => ({}),
  notify = () => {},
  menuRefresh = () => {},
  dialog = {},
  log = () => {},
  delayMs = STARTUP_CHECK_DELAY_MS,
  setTimer = setTimeout,
} = {}) {
  const armed = enabled === true && updater != null
  let state = "idle"
  let manualCheck = false // 本次检查来源：手动 ⇒ 结果对话框；自动 ⇒ 全静默（fail-soft）
  let notifiedVersion = null // 通知一次/版本守卫
  let readyVersion = null // 就绪版本（update-downloaded 载荷；确认句消费）
  let startupHandle = null

  const currentWords = () => {
    try { return words() ?? {} } catch (error) {
      log(`[update] words readback failed: ${error?.message ?? error}`)
      return {}
    }
  }
  const currentVersionText = () => (updater?.currentVersion == null ? "" : String(updater.currentVersion))
  const setState = (next) => {
    if (state === next) return
    state = next
    try { menuRefresh() } catch (error) { log(`[update] menu refresh failed: ${error?.message ?? error}`) }
  }
  /** 对话框安全调用（fail-soft——对话框失败不落入未处理拒绝，零应用影响）。 */
  const safeDialog = (run) => {
    void Promise.resolve().then(run).catch((error) => log(`[update] dialog failed: ${error?.message ?? error}`))
  }

  const handleAvailable = (info) => {
    manualCheck = false // 手动三果之一：转下载态（静默续跑）——该次检查不再出对话框
    setState("downloading")
    log(`[update] update available (v${info?.version ?? "?"}) — downloading silently`)
  }
  const handleDownloaded = (info) => {
    const version = String(info?.version ?? "")
    if (version !== "") readyVersion = version
    setState("ready")
    log(`[update] update downloaded (v${version || "?"}) — restart to install`)
    if (notifiedVersion === version) return // 通知一次/版本
    notifiedVersion = version
    const w = currentWords()
    try {
      notify({ title: w.updateDialogTitle, body: fillVersion(w.updateNotice, version) }) // 点击 ⇒ 聚焦主窗（装配面 reveal 落子）
    } catch (error) { log(`[update] notification failed: ${error?.message ?? error}`) }
  }
  const handleNotAvailable = (info) => {
    const manual = manualCheck
    manualCheck = false
    setState("idle")
    log(`[update] no update available (latest: v${info?.version ?? "?"})`)
    if (!manual) return // 自动面全静默（fail-soft）
    const w = currentWords()
    safeDialog(() => dialog.result?.({
      kind: "up-to-date", title: w.updateDialogTitle,
      message: fillVersion(w.updateUpToDate, currentVersionText() || String(info?.version ?? "")),
    }))
  }
  const handleError = (error) => {
    const manual = manualCheck
    manualCheck = false
    setState("idle") // 失败复位（静默回转——下次启动即自动重试面）
    const reason = String(error?.message ?? error)
    log(`[update] check failed: ${reason}`)
    if (!manual) return // 自动面全静默：stderr 详情行 + 状态回 idle（零 nag ∥ 零弹框）
    const w = currentWords()
    safeDialog(() => dialog.result?.({ kind: "failed", title: w.updateDialogTitle, message: w.updateFailed, detail: reason }))
  }

  if (armed) {
    // 显式落定（缺省同值——免漂移）：静默下载 + 退出即安静安装（§2.8.1 静默下载 ∥ 安装时机①）
    try {
      updater.autoDownload = true
      updater.autoInstallOnAppQuit = true
    } catch (error) { log(`[update] updater flags failed: ${error?.message ?? error}`) }
    for (const [event, handler] of [
      ["update-available", handleAvailable],
      ["update-downloaded", handleDownloaded],
      ["update-not-available", handleNotAvailable],
      ["error", handleError],
    ]) {
      try { updater.on(event, handler) } catch (error) { log(`[update] listener attach failed (${event}): ${error?.message ?? error}`) }
    }
  }

  /** 检查（自动 ∥ 手动同径）：自动面全静默、手动面三果对话框；`checking` ∥ `downloading` ∥ `ready` 重入 ⇒ busy。 */
  async function checkNow({ manual = false } = {}) {
    if (!armed) {
      log("[update] check skipped — updater not armed (dev / --smoke)")
      return { ok: false, reason: "not-armed" }
    }
    if (state !== "idle") return { ok: false, reason: "busy" }
    manualCheck = manual
    setState("checking")
    log(`[update] checking for updates (${manual ? "manual" : "startup"})`)
    try {
      const result = await updater.checkForUpdates()
      if (result === null) { // 库自身判定未武装（isUpdaterActive = false——第二道保险）⇒ 静默回转
        manualCheck = false
        setState("idle")
        log("[update] check skipped by library (application not packaged)")
        return { ok: false, reason: "inactive" }
      }
      void result?.downloadPromise?.catch?.(() => {}) // 下载失败承载 = `error` 事件；此处兜底防未处理拒绝
      return { ok: true }
    } catch (error) {
      if (state === "checking") handleError(error) // 常规径 = 库先发 `error` 事件再重抛（事件已处置）；此兜底防 checking 悬挂
      return { ok: false, reason: "error" }
    }
  }

  /** 菜单点按（帮助组唯一入口）：`idle` ⇒ 手动检查 ∥ `ready` ⇒ 确认框 ⇒ `quitAndInstall(true, true)`；余态零动作。 */
  async function menuClick() {
    try {
      if (!armed) {
        log("[update] menu action ignored — updater not armed (dev / --smoke)")
        return
      }
      if (state === "checking" || state === "downloading") return // disabled 双保险（库内重入返在途 promise）
      if (state === "ready") {
        const w = currentWords()
        let go = false
        try {
          go = (await dialog.confirmRestart?.({
            title: w.updateDialogTitle,
            message: fillVersion(w.updateRestartConfirm, readyVersion ?? currentVersionText()),
            ok: w.updateRestartOk,
            cancel: w.updateRestartCancel,
          })) === true
        } catch (error) { log(`[update] confirm dialog failed: ${error?.message ?? error}`) }
        if (!go) { log("[update] restart declined"); return } // 驳回 ∥ 对话框失败 ⇒ 零动作（安装入口不冒进）
        log(`[update] quitAndInstall(true, true) — v${readyVersion ?? "?"}`)
        updater.quitAndInstall(true, true) // 安静安装 + 装后重拉（v6.8.9 源读：isSilent ⇒ /S ∥ isForceRunAfter ⇒ --force-run）
        return
      }
      await checkNow({ manual: true })
    } catch (error) {
      log(`[update] menu action failed: ${error?.message ?? error}`) // 菜单回调无拒绝面兜底——此处不抛
    }
  }

  /** 启动自检点火（装配面 ready 后调用）：延时一次/会话；未武装 ⇒ 零定时器（零重入：已点火再调 ⇒ false）。 */
  function scheduleStartupCheck() {
    if (!armed) {
      log("[update] startup check not scheduled — updater not armed (dev / --smoke)")
      return false
    }
    if (startupHandle !== null) return false
    startupHandle = setTimer(() => {
      startupHandle = null
      void checkNow({ manual: false })
    }, delayMs)
    startupHandle?.unref?.()
    return true
  }

  return Object.freeze({
    currentState: () => state,
    scheduleStartupCheck,
    checkNow,
    menuClick,
  })
}
