/**
 * projects.mjs — 项目面（`docs/desktop/design/IPC.md` §2）：当前项目（主进程内存态）+ 最近目录（核槽面回读）。
 *
 * 纯逻辑档（零 `electron` 导入 ⇒ 平 node 可测 · 批档 §2.6 D-2）：picker 以 `pick` 回调注入
 * （`ipc.mjs` 注入原生 `dialog`；测试注入假函数）。
 * 零新存储（`docs/desktop/design/PROJECT.md:45` KD-9）：最近目录 = `sessionsDir()` 的族事实回读 ——
 * 不建列表文件、不加配置字段。族判据/分组/最新 mtime 单源 = 核纯函数 `groupSessionEntries`
 * （`thincoder-core/session-stale.mjs:56`；`:46` 的族正则为该档模块内常量，不可 import）。
 * 载入序不变量（批档 §2.4（a））：本档顶层静态 import 端壳 ⇒ 端名 `"desktop"` 先于任何物化写声明。
 * 读数面 = **同步扫描**（`readdirSync` / `statSync` / `readFileSync` 主进程内联、不异步化）：与核同类
 * 扫面（异步 · `thincoder-core/session-stale.mjs:5-6` D-SE34）取向不同，族量级大时阻塞主进程 —— 记于批档 §5。
 */
import { readdirSync, readFileSync, statSync } from "node:fs"
import { basename, join } from "node:path"
import { groupSessionEntries } from "@thincoder/core/session-stale.mjs"
import { newSlotData, sessionPath, sessionsDir, writeSessionFile } from "./session-slots.mjs"

/** 最近列表上限（`docs/desktop/design/IPC.md:50`：前 10）。 */
export const RECENT_LIMIT = 10

/** 当前项目（主进程内存态 —— 唯一持有点；不落盘）。 */
let current = null

/** 当前项目路径（未打开过 ⇒ null）。 */
export function currentCwd() { return current }

/** 目录快照（仅文件；`mtimeMs` 供族排序，取不到记 0 —— 名仍在 ⇒ 族仍可见）。 */
function snapshot() {
  const dir = sessionsDir()
  let dirents
  try { dirents = readdirSync(dir, { withFileTypes: true }) } catch { return { dir, entries: [] } }
  const entries = dirents.filter((d) => d.isFile()).map((d) => {
    try { return { name: d.name, mtimeMs: statSync(join(dir, d.name)).mtimeMs } }
    catch { return { name: d.name, mtimeMs: 0 } }
  })
  return { dir, entries }
}

/** 族前缀 = 核 `sessionPath` 的文件名（本档零哈希副本 —— 与核单源）。 */
const familyPrefix = (cwd) => basename(sessionPath(cwd))

/** 取族（分组结果按前缀查 —— 零族名正则副本；无族 ⇒ null）。 */
function groupOf(groups, prefix) {
  for (const group of groups.values()) if (group.prefix === prefix) return group
  return null
}

/** 候选数据文件：裸 `{hash}.json` 优先，否则最小槽号；无数据文件 ⇒ null（确定性候选序）。 */
function candidateOf(group, prefix) {
  if (group === null) return null
  if (group.dataFiles.includes(prefix)) return prefix
  let best = null
  let bestSlot = Infinity
  for (const name of group.dataFiles) {
    const match = /^\.(\d+)$/.exec(name.slice(prefix.length))
    if (match === null) continue
    const slot = Number(match[1])
    if (slot < bestSlot) { bestSlot = slot; best = name }
  }
  return best
}

/** 数据文件 → `cwd`（不可读 ∥ 无 `cwd` 字段 ⇒ null —— 调用方**整族跳过**：
 *  候选级终止，不降级到更大槽号、不换候选、不猜测、不抛）。 */
function readCwd(dir, name) {
  try {
    const data = JSON.parse(readFileSync(join(dir, name), "utf8"))
    const cwd = data?.cwd
    return typeof cwd === "string" && cwd !== "" ? cwd : null
  } catch { return null }
}

/** 最近目录：族最新 mtime 降序前 `RECENT_LIMIT`。纯盘面读数（零内存依赖 —— 重启面同读数）。 */
export function recentDirs() {
  const { dir, entries } = snapshot()
  const groups = groupSessionEntries(entries)
  const found = []
  for (const group of groups.values()) {
    const name = candidateOf(group, group.prefix)
    if (name === null) continue
    const cwd = readCwd(dir, name)
    if (cwd === null) continue
    found.push({ cwd, mtimeMs: group.newestMtimeMs, hash: group.hash })
  }
  // 同级按族哈希升序 —— 定序（同 mtime 族间读数稳定：两次调用等值）。
  found.sort((a, b) => (b.mtimeMs - a.mtimeMs) || (a.hash < b.hash ? -1 : a.hash > b.hash ? 1 : 0))
  return found.slice(0, RECENT_LIMIT).map(({ cwd, mtimeMs }) => ({ cwd, mtimeMs }))
}

/** 目录谓词（不存在 / 非目录 / 不可读 ⇒ false —— fail-soft 判据面）。 */
function isDirectory(cwd) {
  if (typeof cwd !== "string" || cwd === "") return false
  try { return statSync(cwd).isDirectory() } catch { return false }
}

/** 选择器调用（无 `pick` ⇒ null；picker 抛错按取消降级 —— D-6：本批无异常消费面）。 */
async function pickCwd(pick) {
  if (typeof pick !== "function") return null
  try { return await pick() } catch { return null }
}

/** 物化（`docs/desktop/design/IPC.md:47` 裸路径 `sessionPath(cwd)`）：族内有任一数据文件
 *  ⇒ 命中、零写；无 ⇒ 核 `writeSessionFile` + `newSlotData` 落空槽数据文件。**不认领**槽
 *  （不写 `slotSessions` / 不建 manifest / 不动 active —— 认领属 `newSlot` / `resumeSlot` 职责）。 */
function materialize(cwd) {
  const { entries } = snapshot()
  const group = groupOf(groupSessionEntries(entries), familyPrefix(cwd))
  if (group !== null && group.dataFiles.length > 0) return
  writeSessionFile(sessionPath(cwd), newSlotData(cwd))
}

/** 打开项目 → `{ cwd, recent }`；`path` 给定时直接采用，缺省走 `await pick()`。
 *  取消 / 路径无效 ⇒ fail-soft：当前项目不变 + 盘面零改动。 */
export async function openProject({ path, pick } = {}) {
  const chosen = typeof path === "string" && path !== "" ? path : await pickCwd(pick)
  if (!isDirectory(chosen)) return { cwd: current, recent: recentDirs() }
  current = chosen
  materialize(chosen)
  return { cwd: current, recent: recentDirs() }
}
