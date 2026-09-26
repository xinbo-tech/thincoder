/**
 * slot-sandbox.mjs — 会话槽用例沙箱（共享助手 · 非 `.test.mjs` ⇒ 不入 `test/files.mjs` 清单）。
 * 缝 = 核 `_setSessionsDirForTest`（sessions 根指向 tmp —— `session-slots.mjs:81`）⇒ **零触真实用户目录**；
 * 端壳同名 re-export（`src/main/session-slots.mjs:44`）与本档直取的核路径同址（同一绑定）。
 * 两形：给 `t`（`t.after` 自动清理）· 不给（模块级一次 —— 调用方自行 `cleanup()`）。
 * `cwd` = tmp 下真目录（供物化 / 记录存储落盘面用 —— 槽路径只按 cwd 哈希取值）。
 */
import { mkdirSync, mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { _resetSessionsDirForTest, _setSessionsDirForTest } from "@thincoder/core/session-slots.mjs"

/** 起沙箱：返回 `{ dir, cwd, cleanup }`；`t.after` 在场 ⇒ 自动注册清理。 */
export function useSlotSandbox(t, tag = "proj") {
  const dir = mkdtempSync(join(tmpdir(), "tc-desktop-slot-"))
  const cwd = join(dir, tag)
  mkdirSync(cwd, { recursive: true })
  _setSessionsDirForTest(dir)
  const cleanup = () => {
    _resetSessionsDirForTest()
    rmSync(dir, { recursive: true, force: true })
  }
  if (typeof t?.after === "function") t.after(cleanup)
  return { dir, cwd, cleanup }
}
