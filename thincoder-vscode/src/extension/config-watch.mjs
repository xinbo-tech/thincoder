/**
 * config-watch.mjs — VSC config.json 外部写盘感知（第 21 批 B5 · `docs/design/SETTINGS.md` §2.6；
 * **R8 · 桌面功能对位批：去抖 ∕ stat 元组比对 ∕ 自写抑制上提核件** —— 本档 = 平台落子壳：
 * VS Code 文件监视器 `createFileSystemWatcher`，其余全在核件 `@thincoder/core/config-watch.mjs`）。
 *
 * 契约不变（`extension.mjs:12/:128` 调用面零改）：`startConfigWatch({ onChange, debounceMs = 300, configPath })
 * → { dispose, noteSelfWrite }`；`configPath` 缺省 = config-io `_configPath()` 当前值（测试缝同源）；
 * 降级（宿主 API 缺失 ∕ 构造抛错 ∕ 监视器不可得）⇒ no-op（不阻断激活——面板打开拉新的既有路径兜底）。
 * 三事件（change ∕ create ∕ delete）同缝 `onEvent`（去抖 ∕ 比对 ∕ 自写抑制归核）。
 */
import * as vscode from "vscode"
import { basename, dirname } from "node:path"
import { createConfigWatch } from "@thincoder/core/config-watch.mjs"

/** 平台落子：`RelativePattern`（目录 + 基名）三事件订阅；返回 `{ dispose }`（核件 dispose 时序调用）。 */
export function startConfigWatch({ onChange, debounceMs = 300, configPath } = {}) {
  return createConfigWatch({
    onChange, debounceMs, configPath,
    attach: ({ path, onEvent }) => {
      let watcher
      try {
        watcher = vscode.workspace.createFileSystemWatcher(
          new vscode.RelativePattern(vscode.Uri.file(dirname(path)), basename(path)),
        )
      } catch { return null }
      if (!watcher) return null
      const subs = [watcher.onDidChange(onEvent), watcher.onDidCreate(onEvent), watcher.onDidDelete(onEvent)]
      return {
        dispose() {
          for (const s of subs) { try { s.dispose() } catch { /* already disposed */ } }
          try { watcher.dispose() } catch { /* ignore */ }
        },
      }
    },
  })
}
