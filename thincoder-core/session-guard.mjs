/**
 * session-guard.mjs — F2 轮转守卫（2026-08-31 会诊 F2 🔴；2026-09-08 DESIGN-TOKEN-
 * SETTLEMENT D1 自 session-slots.mjs 提取——session-slots 再越 500 行硬限，本守卫约 41
 * 行随迁，verbatim 零语义变）：saveSession 与 token-ttl persistEngTokens 共用同一份。
 * 写前校验磁盘槽文件是否本进程会话的现场——磁盘文件 sessionStart 与本进程会话不符
 * （另一进程/会话的现场）/版本更新/异 cwd → 先轮转 .bak 保留再写。检查按 mtime 缓存
 * （agent._slotMtime）：文件自上次检查/自写未变就跳过全量解析——每次保存都
 * readFileSync+JSON.parse 多 MB 会话 → O(n²) 退化。文件存在但不可读（损坏/半写）→
 * 改名 .corrupted 保留现场。返回轮转的 .bak 路径或 null。
 *
 * 创建端取值链（SLOT-END-PARAM 批 §6.20 判据句 4）：本守卫是全量解析盘面的唯一写前窗口
 * ⇒ 创建端**顺带解析**（副作用回写 `agent._slotCreatedBy`，供 saveSession 在守卫**之后**
 * 注入 fields——分支：文件不在盘 / 轮转 / 损坏改名 ⇒ `sessionEnd()`（本端将首物化这份文件）；
 * 解析通过未轮转 ⇒ `disk.createdBy ?? null`（透传盘上键；老槽无键 ⇒ null ⇒ 禁回填）；
 * mtime 命中 ⇒ 本函数未解析盘面 ⇒ 值不动）。
 */

import { existsSync, readFileSync, renameSync, statSync } from "node:fs"
import { basename } from "node:path"
// SESSION.md §6.12①（修正轮 #1）：.bak 轮转对**非本会话活动绑定面**联动改名 sidecar（`{p}.d → {bak}.d`）。
import { RECORD_DIR_SUFFIX } from "./session-store.mjs"
// 本进程端名（创建端取值链缺省值）——静态环：本档 ↔ session-slots.mjs（经 session.mjs，同
// 两档头注：函数体内运行时使用、求值期零顶层调用 ⇒ 环安全）。
import { sessionEnd } from "./session-slots.mjs"

/** 轮转时随迁记录存储（.bak 路径联动）——本会话活动绑定面跳过（防拔掉活动存储）。 */
function moveSidecar(src, dst, agent) {
  const dir = src + RECORD_DIR_SUFFIX
  if (agent?._recordStore?.dir === dir) return // 本会话活动绑定面——原地保留（SESSION.md §6.12①）
  try {
    if (existsSync(dir)) renameSync(dir, dst + RECORD_DIR_SUFFIX)
  } catch { /* 随迁失败不阻断轮转（现场原地保留——读侧身份核验兜底） */ }
}

export function guardForeignSlotFile(agent, p, slot) {
  try {
    if (!existsSync(p)) {
      agent._slotCreatedBy = sessionEnd() // 文件不在盘 ⇒ 本端即将首物化（= 创建端）
      return null
    }
    const st = statSync(p)
    if (st.mtimeMs === (agent._slotMtime ?? -1)) return null // mtime 命中：未解析盘面 ⇒ 值不动
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
      agent._slotCreatedBy = sessionEnd() // 轮转：现场已让位 ⇒ 本端将首物化新文件
      return bak
    }
    agent._slotMtime = st.mtimeMs
    agent._slotCreatedBy = disk?.createdBy ?? null // 解析通过：透传盘上键（无键 ⇒ null ⇒ 禁回填）
    return null
  } catch {
    // 文件存在但不可读（损坏/半写）：改名 .corrupted 保留现场（2026-09-01 advisor 🔵——
    // 与自身 loadSlotFile 的 .corrupted 约定 + VS Code saveSessionToSlot 对齐；.bak 保留
    // 给 F2 轮转路径，损坏现场不再混入轮转后缀）。
    if (existsSync(p)) {
      try { renameSync(p, `${p}.corrupted`) } catch {}
    }
    agent._slotCreatedBy = sessionEnd() // 损坏改名：现场已让位 ⇒ 本端将首物化新文件
    return null
  }
}
