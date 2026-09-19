/**
 * session-rename.mjs — 槽位重命名（标题写路径）。2026-09-06 自 session-slots.mjs 拆出：
 * §6.12 标题写契约（boolean → { ok, reason }）使 session-slots.mjs 超 500 行硬限
 *（§6.12 模块与实现约束——超 500 行硬限即拆文件，renameSlot 一并拆出）。
 * 原语（slotPath/manifest 读写）自 session-slots.mjs import；session.mjs re-export
 * renameSlot 保持既有调用点（cmd-session.mjs / 测试经 session.mjs）不变。
 */

import { readFileSync, existsSync, statSync } from "node:fs"
import { slotPath, loadManifest, saveManifest, slotDigest, writeSessionFile } from "./session-slots.mjs"

/** Rename a slot: update the slot file's title + the manifest metadata (shared with VS Code).
 *  2026-09-01 会诊 glm 🟡：写回前按 mtime 门控重读——原实现读全量→改 title→整文件写回，
 *  窗口内并发方的最新保存会被旧数据覆盖（丢消息）；mtime 变了即放弃本次重命名。
 *  2026-09-06 §6.12 标题写契约：契约 boolean → { ok, reason? }（file-missing/parse-failure/mtime-conflict/invalid-slot，F3 失败可见）；_stat = mtime-conflict 测试缝（默认 statSync）。 */
export function renameSlot(cwd, slot, title, _stat = statSync) {
  const n = Number(slot)
  if (!Number.isInteger(n) || n < 1) return { ok: false, reason: "invalid-slot" }
  const p = slotPath(cwd, n)
  if (!existsSync(p)) return { ok: false, reason: "file-missing" }
  let data
  try {
    data = JSON.parse(readFileSync(p, "utf8"))
  } catch {
    return { ok: false, reason: "parse-failure" }
  }
  const t0 = _stat(p).mtimeMs
  data.title = title
  // 读与写之间文件被并发方改过 → 放弃（保留并发内容，重命名下次重试）
  if (_stat(p).mtimeMs !== t0) return { ok: false, reason: "mtime-conflict" }
  writeSessionFile(p, data)
  const m = loadManifest(cwd)
  if (m.slots[n]) {
    m.slots[n] = slotDigest(data)
    saveManifest(cwd, m)
  }
  return { ok: true }
}
