/**
 * disk-root-gate.mjs — 盘根启动门（fail-fast · 2026-10-08 · 台账 #1080 ∥ `docs/cli/design/CLI-ENTRY.md` §1）。
 *
 * **会话面**（无参默认 ∥ `tui` ∥ `chat` ∥ `acp`）于 cwd = 磁盘根时 ⇒ 一行提示 + 非零退出
 * （阻断盘根启动 ⇒ 全盘索引——N10 动机面）；**其余面一律放行**（判定式 = 会话集成员——信息维护面
 * `-v` ∥ `--help` ∥ `memory` ∥ `upgrade` ∥ `completion` ∥ `session *` 照常）；**无强开旗**。
 *
 * 判定 = `resolve(cwd)` 与路径根（`parse(p).root`）相等（win32 大小写归一；覆盖 `X:\` ∥ `/` ∥
 * UNC 共享根）。`platform` 入参供直测双道（先例 `nodeVersionError(version)`）；纯函数 ⇒
 * `null` ∥ 逐字一行文案。接线 = `bin/thincoder.mjs` argv 解析后 ∥ TUI 包装块前
 * （阻断 ⇒ 包装不发生；包装子进程复判幂等——cwd 同源）。
 */
import { win32, posix } from "node:path"

/** 会话面命令集（无参默认 = `command === undefined`——同 TUI 默认路径）。 */
export const SESSION_COMMANDS = new Set(["tui", "chat", "acp"])

/** 逐字定稿文案（含 em dash；输出流 = stderr、退出码 = `process.exit(1)`）。 */
export const DISK_ROOT_MESSAGE = "thincoder cannot start from a disk root — cd into a working directory and start again"

/**
 * 盘根判定：会话面 ∧ cwd 为路径根 ⇒ 文案；否则 `null`（放行）。
 * @param {{command?: string, cwd?: string, platform?: string}} [args]
 * @returns {string|null}
 */
export function diskRootGateError({ command, cwd, platform = process.platform } = {}) {
  if (command !== undefined && !SESSION_COMMANDS.has(command)) return null
  const p = platform === "win32" ? win32 : posix
  const resolved = p.resolve(String(cwd ?? ""))
  const root = p.parse(resolved).root
  const atRoot = platform === "win32"
    ? resolved.toLowerCase() === root.toLowerCase()
    : resolved === root
  return atRoot ? DISK_ROOT_MESSAGE : null
}
