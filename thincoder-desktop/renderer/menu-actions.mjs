/**
 * menu-actions.mjs — 菜单动作分派（菜单体系批 · D36 · 台账 #811；决策单源 = `docs/desktop/design/PROJECT.md` §2 **KD-65**
 * ∥ 设置菜单升级批 · #817 **KD-67**）：`ev:menu` 六动作闭集 ⇒ 各既有单一实现（**注入缝** —— 本档零第二实现 ∥
 * 零 DOM ∥ 零 `/rc/` 取件 ⇒ 平 node 直测）。
 * 动作表（单源 = `docs/desktop/design/IPC.md` §1 `ev:menu` 行）：
 *   `newSession` ⇒ `createSession()`（`mount-sessions` 单一实现）∥ `openProject` ⇒ `openDir(path?)`（`app.mjs` 单一实现；
 *   最近项携 `path`，一般项缺省 ⇒ 原生选择框径）∥ `find` ⇒ `openSearch()`（核件搜索面 **幂等开径**，与核件 Ctrl+F
 *   键径双触发零害）∥ `theme` ⇒ `setTheme(value)`（设置面出口 ⇒ `theme.mjs` 单写者 + 切片写；表外值由单写者拒绝 ——
 *   零第二校验）∥ `help` ⇒ `printHelp()`（`mount-composer` face 打印口 —— `/help` 流内打印单实现）∥
 *   `openSettings(group?)` ⇒ **设置面临时双口**（注入面转接：缺组 ⇒ 现有设置页 ∥ 携组名 ⇒ 组弹窗 —— 对位
 *   `docs/desktop/design/SETTINGS.md` §1 **KD-68**；本档零第二实现）。
 * 纪律：表外 action ⇒ 零动作 + 记错（零静默 —— 载荷来自主进程，防御档）；出口缺 / 非函数 ⇒ 该动作记错 + 零动作；
 * 出口返 `false`（无动作可产 —— 如 `printHelp` 无活动会话径 ∥ 组弹窗拒（表外组 ∥ 向导占槽））⇒ 记错（零静默）。
 * 返回 `onMenu(ev)` = `events-subscribe.mjs` `onMenu` 窄口签形（纯信号、零切片写 —— 沿 `onConfig` 先例）。
 */

/** 分派器工厂（`deps` = 六出口注入：`createSession` ∥ `openDir` ∥ `openSearch` ∥ `setTheme` ∥ `printHelp` ∥ `openSettings`）。 */
export function createMenuActions(deps = {}) {
  const call = (action, fn, ...args) => {
    if (typeof fn !== "function") {
      console.error(`[renderer] menu action unavailable: ${action}`)
      return false
    }
    if (fn(...args) === false) console.error(`[renderer] menu action no-op: ${action}`)
    return true
  }
  return function onMenu(ev) {
    const action = ev?.action
    if (action === "newSession") return call(action, deps.createSession)
    if (action === "openProject") {
      const path = typeof ev.path === "string" && ev.path !== "" ? ev.path : undefined
      return call(action, deps.openDir, path)
    }
    if (action === "find") return call(action, deps.openSearch)
    if (action === "theme") return call(action, deps.setTheme, ev.value)
    if (action === "help") return call(action, deps.printHelp)
    if (action === "openSettings") {
      const group = typeof ev.value === "string" && ev.value !== "" ? ev.value : undefined
      return call(action, deps.openSettings, group)
    }
    console.error(`[renderer] menu action refused: ${String(action)}`)
    return false
  }
}
