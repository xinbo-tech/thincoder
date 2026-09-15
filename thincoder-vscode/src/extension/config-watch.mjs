/**
 * config-watch.mjs — 外部 config.json 写盘感知（第 21 批 B5——`docs/design/SETTINGS.md` §2.6）。
 *
 * `~/.thincoder/config.json` 为双端共享单文件：CLI（`/advisor`、`settings set`）或手工编辑
 * 写盘后，面板常开时原本零感知（只在打开面板/保存时拉快照）。本模块 = 宿主文件系统事件
 * （`createFileSystemWatcher`）→ 去抖 → stat 元组（mtimeMs + size）比对 → 变化才 `onChange`，
 * 事件驱动零空转（否决轮询/焦点触发/手动刷新——选型见设计档）。
 *
 * 自写抑制：扩展自身写盘同样改元组 ⇒ 裸推送会在用户编辑中被快照重建。写盘成功后
 * config-io `saveRaw` 同步回调 → `noteSelfWrite()` 把基线刷到当前元组 ⇒ 事件到达时元组
 * 已等于基线 ⇒ 零推送；外部写无回调 ⇒ 元组异于基线 ⇒ 推送。
 *
 * 纯装配——不含业务（业务 = `onChange` 回调，装配在 `extension.mjs`）。
 */
import * as vscode from "vscode"
import { basename, dirname } from "node:path"
import { statSync } from "node:fs"
import { _configPath, onConfigSelfWrite } from "@thincoder/core/config-io.mjs"

/** stat 元组（mtimeMs + size——同 tick 快写 mtime 可同，size 兜底）；缺失/不可读 → null。 */
function tupleOf(path) {
  try {
    const s = statSync(path)
    return `${s.mtimeMs}:${s.size}`
  } catch { return null }
}

/**
 * Watch the shared config file for external writes.
 * @param {{ onChange?: () => void, debounceMs?: number, configPath?: string }} opts
 *   `configPath` 缺省 = config-io `_configPath()` 当前值（测试缝同源）。
 * @returns {{ dispose: () => void, noteSelfWrite: () => void }} 降级（宿主 API 缺失/构造抛错）
 *   时返回 no-op（不阻断激活——面板打开拉新的既有路径兜底）。
 */
export function startConfigWatch({ onChange, debounceMs = 300, configPath } = {}) {
  const noop = { dispose() {}, noteSelfWrite() {} }
  const path = configPath || _configPath()
  if (!path) return noop

  let watcher
  try {
    watcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(vscode.Uri.file(dirname(path)), basename(path)),
    )
  } catch { return noop }
  if (!watcher) return noop

  let baseline = tupleOf(path)
  const noteSelfWrite = () => { baseline = tupleOf(path) }

  let timer = null
  const check = () => {
    timer = null
    const now = tupleOf(path)
    if (now === baseline) return // 元组未变 → 零推送（隐藏 N5 判据保持）
    baseline = now // 比对后基线更新为当前元组
    try { onChange?.() } catch (e) { console.warn(`[config-watch] onChange failed: ${e.message}`) }
  }
  const schedule = () => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(check, debounceMs)
  }

  const subs = [watcher.onDidChange(schedule), watcher.onDidCreate(schedule), watcher.onDidDelete(schedule)]
  let unsubSelfWrite = null
  try { unsubSelfWrite = onConfigSelfWrite(noteSelfWrite) } catch { /* 订阅失败仅弱化自写抑制 */ }

  return {
    noteSelfWrite,
    dispose() {
      for (const s of subs) { try { s.dispose() } catch { /* already disposed */ } }
      if (timer) { clearTimeout(timer); timer = null }
      try { unsubSelfWrite?.() } catch { /* ignore */ }
      try { watcher.dispose() } catch { /* ignore */ }
    },
  }
}
