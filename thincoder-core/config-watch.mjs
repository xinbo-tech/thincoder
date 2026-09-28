/**
 * config-watch.mjs — config.json 外部写盘感知·**纯逻辑面**（R8 · 桌面功能对位批「上提」KD-T2——
 * 自 `thincoder-vscode/src/extension/config-watch.mjs:35-77` 逐字随迁：去抖 300ms ∕ stat 元组
 * （`mtimeMs:size`）比对 ∕ 自写抑制；原批 = 第 21 批 B5 · `docs/design/SETTINGS.md` §2.6）。
 *
 * `~/.thincoder/config.json` 为多端共享单文件：CLI（`/advisor`、`settings set`）或手工编辑写盘后，
 * 常开面板原本零感知（只在打开面板/保存时拉快照）。机制（零语义改）：
 *   宿主 fs 事件 →（端落子）`onEvent` → 去抖 → 元组比对 → 变化才 `onChange`（事件驱动零空转）。
 * 自写抑制：本端自身写盘同样改元组 ⇒ 裸推送会在用户编辑中被快照重建；写盘成功后核 `config-io`
 * `saveRaw` 同步回调 `onConfigSelfWrite`（`config-io.mjs:107`）⇒ `noteSelfWrite()` 把基线刷到当前
 * 元组 ⇒ 事件到达时元组已等于基线 ⇒ 零推送；外部写无回调 ⇒ 元组异于基线 ⇒ 推送。
 *
 * 平台面两注入（核内零宿主绑定）：① `attach`（fs 事件源工厂——端落子：VSC = `createFileSystemWatcher`、
 * 桌面 = `node:fs.watch`）② `setTimer` ∕ `clearTimer`（定时器；缺省 = 全局）。`tupleOf`（stat 探针）缺省 =
 * 本核 `statSync` 实现（两端宿主皆 Node）；`subscribeSelfWrite` 缺省 = 核自写订阅。
 * 降级（无 path ∕ `attach` 缺失 ∕ 构造抛错 ∕ 返回空）⇒ no-op 面（不阻断端激活——面板打开拉新的既有路径兜底）。
 * 装配序微差（对源件）：事件订阅随 `attach` 一次落（源件 = 构造 → 基线 → 订阅三事件）——订阅更早，
 * 不丢事件；基线仍于 `attach` 后取（同步段内零窗口）。零语义差。
 */
import { statSync } from "node:fs"
import { _configPath, onConfigSelfWrite } from "./config-io.mjs"

/** stat 元组（mtimeMs + size——同 tick 快写 mtime 可同，size 兜底）；缺失 ∕ 不可读 ⇒ null。 */
export function configTupleOf(path) {
  try {
    const s = statSync(path)
    return `${s.mtimeMs}:${s.size}`
  } catch { return null }
}

/**
 * 建配置监视面（纯逻辑）。
 * @param {{ configPath?: string, onChange?: () => void, debounceMs?: number,
 *   attach?: (arg: { path: string, onEvent: () => void }) => { dispose?: () => void } | null,
 *   tupleOf?: (path: string) => string | null,
 *   setTimer?: (fn: () => void, ms: number) => unknown, clearTimer?: (handle: unknown) => void,
 *   subscribeSelfWrite?: (fn: () => void) => (() => void) | void }} [opts]
 *   `configPath` 缺省 = 核 `_configPath()` 当前值（测试缝同源）；`attach` = 平台落子（fs 事件源）。
 * @returns {{ dispose: () => void, noteSelfWrite: () => void }} 降级时返回 no-op（不阻断激活）。
 */
export function createConfigWatch({
  configPath, onChange, debounceMs = 300, attach, tupleOf = configTupleOf,
  setTimer = setTimeout, clearTimer = clearTimeout, subscribeSelfWrite = onConfigSelfWrite,
} = {}) {
  const noop = { dispose() {}, noteSelfWrite() {} }
  const path = configPath || _configPath()
  if (!path) return noop
  if (typeof attach !== "function") return noop

  let baseline = null
  let timer = null
  /** 元组比对（去抖落点）：未变 → 零推送（隐藏 N5 判据保持）；变 ⇒ 基线刷新 + `onChange`（抛不炸宿主）。 */
  const check = () => {
    timer = null
    const now = tupleOf(path)
    if (now === baseline) return
    baseline = now // 比对后基线更新为当前元组
    try { onChange?.() } catch (e) { console.warn(`[config-watch] onChange failed: ${e.message}`) }
  }
  /** 去抖（同拍多事件合并——窗口内重排）。 */
  const schedule = () => {
    if (timer) clearTimer(timer)
    timer = setTimer(check, debounceMs)
  }

  let listener
  try { listener = attach({ path, onEvent: schedule }) } catch { return noop }
  if (!listener) return noop
  baseline = tupleOf(path)
  const noteSelfWrite = () => { baseline = tupleOf(path) }

  let unsubSelfWrite = null
  try { unsubSelfWrite = subscribeSelfWrite(noteSelfWrite) } catch { /* 订阅失败仅弱化自写抑制 */ }

  return {
    noteSelfWrite,
    dispose() {
      try { listener.dispose?.() } catch { /* already disposed */ }
      if (timer) { clearTimer(timer); timer = null }
      try { unsubSelfWrite?.() } catch { /* ignore */ }
    },
  }
}
