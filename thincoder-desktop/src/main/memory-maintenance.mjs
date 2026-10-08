/**
 * memory-maintenance.mjs — 记忆维护启动拍转口（自愈轮 · MEMORY.md §6.14 面⑤-5 · 台账 #1096 · 2026-10-08）。
 *
 * **惰性转口**：核维护链（`thincoder-core/memory/maintain.mjs`）静态引 `node:sqlite`（经
 * `memory/sweep.mjs` ∥ `memory/schema.mjs`）——端壳静态闭包不得到达它（护栏契约 = VSC
 * `session-index-command.mjs:38-43` ∥ 本端 `session-slots.mjs:262-270` 索引拍转口同款）。
 * 不可得 ⇒ `false` + stderr 一行（维护 = 派生品：fail-soft，不成红、不假造）。
 *
 * 判据与算法全在核（本档零算法副本）；`options` 透传——`dbPath` 缺省由核侧现读
 * `config.memory.dbPath`（读抛 ∥ 缺位 ⇒ 拍零动作）；`onReport` = 端侧可见面缝
 * （桌面不注入 ⇒ 零行——端面板零改）。
 */
export async function scheduleMemoryMaintenance(options = {}) {
  try {
    const { scheduleMemoryMaintenance: coreSchedule } = await import("@thincoder/core/memory/maintain.mjs")
    return coreSchedule(options)
  } catch (error) {
    console.error("[memory-maintenance] maintenance pass unavailable:", error)
    return false
  }
}
