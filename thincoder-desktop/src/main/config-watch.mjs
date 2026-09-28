/**
 * config-watch.mjs — 桌面 config.json 外部写盘感知（R8 · 桌面功能对位批 —— C3「config 写盘感知」：
 * 台账 #530 缺项表 C3；上提单源 = 核 `@thincoder/core/config-watch.mjs`）。
 *
 * 本档 = 平台落子壳（去抖 ∕ stat 元组比对 ∕ 自写抑制全在核件）：
 *   ① fs 事件源 = `node:fs.watch`（**监视目录**——档首建 ∕ 删除 ∕ 改名亦可见；事件名过滤到目标档；
 *      目录不可得（如 `~/.thincoder` 未建）⇒ 构造抛 ⇒ 核件降级 no-op——不阻断启动）；
 *      `persistent: false` —— 监视不拴事件循环（退出不因它滞留；与核 `startLedgerSurface` 的 `unref` 同向）。
 *   ② 定时器 = 核件缺省（全局；自证 ∕ 用例可注入 `setTimer` ∕ `clearTimer`）。
 * 生命周期随窗口：`main.mjs` 就绪后起（返回句柄存局部），窗口 `closed` ⇒ `dispose()`。
 * 消费面 = `ev:config`（宿主自产推送——渲染面设置面复读；`main.mjs` 装配处接）。
 * 零 electron 依赖（平 node 直测——`node:fs.watch` 与核件皆然）。
 */
import { watch as fsWatch } from "node:fs"
import { basename, dirname } from "node:path"
import { createConfigWatch } from "@thincoder/core/config-watch.mjs"

/**
 * 起桌面 config 监视。
 * @param {{ onChange?: () => void, debounceMs?: number, configPath?: string,
 *   setTimer?: Function, clearTimer?: Function }} [opts]
 *   `configPath` 缺省 = 核 `_configPath()` 当前值；`onChange` = 外部写盘（去抖后、元组真变）回调。
 * @returns {{ dispose: () => void, noteSelfWrite: () => void }} 降级 ⇒ no-op 面（核件同口径）。
 */
export function startConfigWatch({ onChange, debounceMs = 300, configPath, setTimer, clearTimer } = {}) {
  return createConfigWatch({
    onChange, debounceMs, configPath,
    ...(typeof setTimer === "function" ? { setTimer } : {}),
    ...(typeof clearTimer === "function" ? { clearTimer } : {}),
    attach: ({ path, onEvent }) => {
      const name = basename(path)
      // 目录监视粒度 ⇒ 过滤到目标档；平台不给名（null / undefined）⇒ 放行（核件元组比对兜底零假阳）。
      const hit = (filename) => filename === null || filename === undefined || String(filename) === name
      let watcher
      try {
        watcher = fsWatch(dirname(path), { persistent: false }, (_event, filename) => { if (hit(filename)) onEvent() })
      } catch { return null }
      return { dispose() { try { watcher.close() } catch { /* 已关 ∕ 已失效 */ } } }
    },
  })
}
