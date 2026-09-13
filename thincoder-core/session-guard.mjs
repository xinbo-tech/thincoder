/**
 * session-guard.mjs — F2 轮转守卫（2026-08-31 会诊 F2 🔴；2026-09-08 DESIGN-TOKEN-
 * SETTLEMENT D1 自 session-slots.mjs 提取——session-slots 再越 500 行硬限，本守卫约 41
 * 行随迁，verbatim 零语义变）：saveSession 与 token-ttl persistEngTokens 共用同一份。
 * 写前校验磁盘槽文件是否本进程会话的现场——磁盘文件 sessionStart 与本进程会话不符
 * （另一进程/会话的现场）/版本更新/异 cwd → 先轮转 .bak 保留再写。检查按 mtime 缓存
 * （agent._slotMtime）：文件自上次检查/自写未变就跳过全量解析——每次保存都
 * readFileSync+JSON.parse 多 MB 会话 → O(n²) 退化。文件存在但不可读（损坏/半写）→
 * 改名 .corrupted 保留现场。返回轮转的 .bak 路径或 null。
 */

import { existsSync, readFileSync, renameSync, statSync } from "node:fs"
import { basename } from "node:path"
// §14.3.8①（修正轮 #1）：.bak 轮转对**非本会话活动绑定面**联动改名 sidecar（`{p}.d → {bak}.d`）。
import { RECORD_DIR_SUFFIX } from "./session-store.mjs"

/** 轮转时随迁记录存储（.bak 路径联动）——本会话活动绑定面跳过（防拔掉活动存储）。 */
function moveSidecar(src, dst, agent) {
  const dir = src + RECORD_DIR_SUFFIX
  if (agent?._recordStore?.dir === dir) return // 本会话活动绑定面——原地保留（§14.3.8①）
  try {
    if (existsSync(dir)) renameSync(dir, dst + RECORD_DIR_SUFFIX)
  } catch { /* 随迁失败不阻断轮转（现场原地保留——读侧身份核验兜底） */ }
}

export function guardForeignSlotFile(agent, p, slot) {
  try {
    if (!existsSync(p)) return null
    const st = statSync(p)
    if (st.mtimeMs === (agent._slotMtime ?? -1)) return null
    const disk = JSON.parse(readFileSync(p, "utf8"))
    // version>2 的新版文件无论 sessionStart 一律轮转（loadSlotFile 对 v3 返回 null 不动
    // 文件——若其 sessionStart 为 null，旧版首次保存会静默覆盖；轮转 .bak 保证新版文件
    // 保留）。磁盘文件 cwd 不匹配（异项目文件误落本路径）同样轮转——与 loadSlotFile/
    // legacy 读的"别人的文件不动"原则对齐。
    const diskIsNewer = typeof disk?.version === "number" && disk.version > 2
    const diskStart = disk?.sessionStart ?? null
    const myStart = agent._sessionStart ?? null
    const diskForeign = typeof disk?.cwd === "string" && disk.cwd.toLowerCase() !== agent.cwd.toLowerCase()
    if (diskIsNewer || diskForeign || (diskStart && diskStart !== myStart)) {
      const bak = `${p}.bak-${Date.now()}`
      renameSync(p, bak)
      moveSidecar(p, bak, agent)
      console.error(`[session] slot ${slot} holds ${diskIsNewer ? `a newer-version file (v${disk.version})` : diskForeign ? `a foreign-cwd file (${disk.cwd})` : `another session (start ${diskStart}, ours ${myStart})`} — preserved as ${basename(bak)}`)
      agent._slotMtime = st.mtimeMs
      return bak
    }
    agent._slotMtime = st.mtimeMs
    return null
  } catch {
    // 文件存在但不可读（损坏/半写）：改名 .corrupted 保留现场（2026-09-01 advisor 🔵——
    // 与自身 loadSlotFile 的 .corrupted 约定 + VS Code saveSessionToSlot 对齐；.bak 保留
    // 给 F2 轮转路径，损坏现场不再混入轮转后缀）。
    if (existsSync(p)) {
      try { renameSync(p, `${p}.corrupted`) } catch {}
    }
    return null
  }
}
