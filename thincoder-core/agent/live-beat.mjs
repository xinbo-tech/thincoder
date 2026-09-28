/**
 * agent/live-beat.mjs — 存活投影心跳（拍间隔 ∕ 单拍 ∕ 起 ∕ 停 —— 幂等 · 清点）——「桌面处理流 · VSC 对齐」批 R6 上提产物。
 *
 * 上提源 = VSC `thincoder-vscode/src/extension/panel-messages.mjs:45`（`LIVE_HEARTBEAT_MS = 2000`）
 * `:50`（单拍 `liveHeartbeatBeat`）`:62-75`（起 ∕ 停 `startLiveHeartbeat` ∕ `stopLiveHeartbeat`）；
 * 桌面先例 = `thincoder-desktop/src/main/subagent-face.mjs`（拍体逐键清点）。**纯搬 + 转口，零语义改**：
 * 拍间隔 ∕ 单拍 ∕ 起停 ∕ 幂等 ∕ 清点入核。两处 VSC 端面判据**随拍体留端**（非本档语义）：
 * 「未就绪不拍」前置（`panel._wvReady`）与拍日志（`ev:subreassert`）。
 *
 * 拍体（`beat` 注入）= 各端存活再断言本体：VSC = `reassertLiveChildren(panel)`（`thincoder-vscode/src/
 * extension/suspension.mjs:148` 投影面）；桌面 = 逐键 `bridge(key).reassertLive(agent)`（只发在飞实例）。
 * 回值 = 本拍投递条数（**清点**读数 —— 拍体自清点，本档原样透传）。
 * **`setInterval` ∕ `unref` 转注入缝**：`timer(fn, ms) ⇒ handle` ∕ `clear(handle)` 由调用方注入
 * （缺省 = 平台 `setInterval` ∕ `clearInterval`；句柄 `unref` = 可选面 —— 在场即调，不阻进程退出）。
 * 消费面 = 桌面 `thincoder-desktop/src/main/subagent-face.mjs`；VSC 自持副本迁移留后（双写窗口在册）。
 */

/** 拍间隔（毫秒）——单源（VSC 同值 `panel-messages.mjs:45`）：起拍即按此周期。 */
export const LIVE_HEARTBEAT_MS = 2000

/**
 * 起 ∕ 停 ∕ 单拍（幂等）：
 *  - `beat()` = 单拍直驱（回值 = 本拍投递条数 —— 测试直驱面 ∕ 手动补拍）；
 *  - `start()` = 起拍（**单拍幂等**：已起 ⇒ 返既有句柄、零重起）；回值 = 定时器句柄；
 *  - `stop()` = 停拍（未起 ⇒ 零动作）；停后 `start()` 可再起（新句柄 —— 起 ∕ 停两向）。
 * `timer` ∕ `clear` = 定时器注入缝（缺省 = 平台全局；假钟注入 ⇒ 平 node 直测）。`beat` 缺 ∕ 非函数 ⇒ 抛
 * （fail-loud —— 拍体未接线不得静默空转成「零投拍」）。
 */
export function createLiveBeat({ beat, timer = (fn, ms) => setInterval(fn, ms), clear = (handle) => clearInterval(handle) } = {}) {
  if (typeof beat !== "function") {
    throw new TypeError("createLiveBeat: beat seam missing — inject the beat function (the projection must not silently idle)")
  }
  let handle = null
  return {
    beat,
    start() {
      if (handle !== null) return handle
      handle = timer(beat, LIVE_HEARTBEAT_MS)
      handle?.unref?.() // 不阻进程退出（句柄可选面）
      return handle
    },
    stop() {
      if (handle === null) return
      clear(handle)
      handle = null
    },
  }
}
