/**
 * session-io.mjs — 会话槽 I/O 出档（批 8 §1.14 ①②：装配取槽 / 回合尾落盘；档名实施舱定）。
 * 单源 = 核（`@thincoder/core/session.mjs`）：读 = `loadSlotFile` · 应用 = `applySession` · 写 = `saveSession`。
 * 本档零算法副本，只做端层三件事：
 *   ① 槽缺 ⇒ `false`（新建形：不动装配出的代理 —— 首次会话无槽文件是正常态）；
 *   ② **装载后重钉 `agent._slot`**：核 `applySession` 按切换语义清 `_slot`（`session-lifecycle.mjs:132`
 *      「粘性缓存清空」），而回合尾 `saveSession` 取槽走 `agent._slot ??= activeSlot(cwd)` ——
 *      `activeSlot` = manifest 的**共享**活动指针（`ensureActive` 认领写），故不重钉则多标签 / 跨端切槽后
 *      本键回合落错槽（active = 最后一次 switch 的槽）。本键槽号由 `slotOfKey(key)` 已知 ⇒ 装载即钉回；
 *   ③ 落盘**不抛**（`saveAgentSlot` 自吞 + stderr 一行）：回合已跑完，写盘失败不得把回合掀成 error 面
 *      （CLI 先例 = `agent-turn.mjs:326-331` 回合 finally 尾部 `try { saveSession(agent) } catch {}`）。
 *
 * 取 `loadSlotFile` 而非 `resumeSlot`（对 §1.14 ① 字面的实现层替换 —— 见批档 §5）：后者取「活动槽」
 * 并含认领写 / end-marker 写 / 会话 GC 调度（`session-lifecycle.mjs:43-46`）——桌面端槽号 = `/session:<n>`
 * 键，本键槽号已知，装载不得另起认领竞争。
 * 副作用两面（核既有语义，非本档新增）：`applySession` 绑定记录存储时可能**物化 `.d/` 段**
 * （`session-store.mjs:73-76` 计数对账路径）；sidecar 身份不符 ⇒ `_quarantine()` 改名 `.stale-<ms>`。
 */
import { applySession, loadSlotFile, saveSession } from "@thincoder/core/session.mjs"

/** 装载本键槽到装配出的代理：槽缺 ⇒ false（新建形）；命中 ⇒ 应用槽值 + 钉回本键槽号 ⇒ true。 */
export function loadAgentSlot(agent, cwd, slot) {
  const data = loadSlotFile(cwd, slot)
  if (!data) return false
  applySession(agent, data, { slot })
  agent._slot = slot // ② 重钉（applySession 已清空 —— 见档头）
  return true
}

/** 回合尾落盘（三路 done / stopped / error 同序调用 —— 先落盘再出终局事件）。 */
export function saveAgentSlot(agent) {
  try {
    saveSession(agent)
  } catch (err) {
    console.error(`[agent-host] session save failed: ${err?.message ?? err}`)
  }
}
