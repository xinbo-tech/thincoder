/**
 * session-io.mjs — 会话槽 I/O 出档（批 8 §1.14 ①②：装配取槽 / 回合尾落盘；档名实施舱定）。
 * 单源 = 核（`@thincoder/core/session.mjs`）：读 = `loadSlotFile` · 应用 = `applySession` · 写 = `saveSession`。
 * 本档零算法副本，只做端层四件事：
 *   ① 槽缺 ⇒ `false`（新建形：不动装配出的代理 —— 首次会话无槽文件是正常态）；
 *   ② **装载后重钉 `agent._slot`**：核 `applySession` 按切换语义清 `_slot`（`session-lifecycle.mjs:132`
 *      「粘性缓存清空」），而回合尾 `saveSession` 取槽走 `agent._slot ??= activeSlot(cwd)` ——
 *      `activeSlot` = manifest 的**共享**活动指针（`ensureActive` 认领写），故不重钉则切会话 / 跨端切槽后
 *      本键回合落错槽（active = 最后一次 switch 的槽）。本键槽号由 `slotOfKey(key)` 已知 ⇒ 装载即钉回；
 *   ③ 落盘**不抛**（`saveAgentSlot` 自吞 + stderr 一行）：回合已跑完，写盘失败不得把回合掀成 error 面
 *      （CLI 先例 = `agent-turn.mjs:326-331` 回合 finally 尾部 `try { saveSession(agent) } catch {}`）；
 *   ④ **记录追加**（消化面留档批 · #719）：`appendRecord(agent, record)` —— 人读线记录（`digest` ∥ `subagent`
 *      两族）入档薄壳，复用核 `pushReal`（零算法副本）；静默纪律同 ③（追加失败不掀回合）。
 *
 * 取 `loadSlotFile` 而非 `resumeSlot`（对 §1.14 ① 字面的实现层替换 —— 见批档 §5）：后者取「活动槽」
 * 并含认领写 / end-marker 写 / 会话 GC 调度（`session-lifecycle.mjs:43-46`）——桌面端槽号 = 会话键
 * （`String(slot)`），本键槽号已知，装载不得另起认领竞争。
 * 副作用两面（核既有语义，非本档新增）：`applySession` 绑定记录存储时可能**物化 `.d/` 段**
 * （`session-store.mjs:73-76` 计数对账路径）；sidecar 身份不符 ⇒ `_quarantine()` 改名 `.stale-<ms>`。
 */
import { applySession, loadSlotFile, saveSession } from "@thincoder/core/session.mjs"
// 记录追加面复用件（留档批 · #719 —— 人读线单点；本档零算法副本）。
import { pushReal } from "@thincoder/core/context.mjs"

/** 装载本键槽到装配出的代理：槽缺 ⇒ false（新建形）；命中 ⇒ 应用槽值 + 钉回本键槽号 ⇒ true。 */
export function loadAgentSlot(agent, cwd, slot) {
  const data = loadSlotFile(cwd, slot)
  if (!data) return false
  applySession(agent, data, { slot })
  agent._slot = slot // ② 重钉（applySession 已清空 —— 见档头）
  return true
}

/** 回合尾落盘（三路 done / stopped / error 同序调用 —— 先落盘再出终局事件）。`label` = 日志标签（默认 `session`；
 *  R3 蒸馏落位同经本函数 —— 单一「落盘不抛」实现，零第二副本）。
 *  **`prefsSeedOnly`（2026-10-04 解锁批 · R2）**：回合关联落盘**不携会话级三键**（槽在场值赢 ∥ 缺 ⇒ 记忆值
 *  播种——防回合起跑快照覆写忙期新选定；语义单源 = 核 `session.mjs` `saveSession` 注）。 */
export function saveAgentSlot(agent, label = "session") {
  try {
    saveSession(agent, { prefsSeedOnly: true })
  } catch (err) {
    console.error(`[agent-host] ${label} save failed: ${err?.message ?? err}`)
  }
}

/** 蒸馏落位（R3 · #520 —— `callbacks.onDistilled` 时点：机器行已被压缩版替换，回合尾 `saveSession` 持的是
 *  压缩前快照 ⇒ **立即重落盘**，盘面不留未压缩版；CLI 先例 `thincoder-cli/src/tui/tool-events.mjs:397-399` ∕
 *  VSC 先例 `thincoder-vscode/src/extension/panel-callbacks.mjs:242-246`）。静默纪律同 `saveAgentSlot`
 *  （N3 —— 回合已返回，写盘失败不得浮面；实现 = 同函数 + `distilled` 标签，零副本）∥ 落盘语义同携
 *  `prefsSeedOnly`（2026-10-04 解锁批——蒸馏落盘同不携三键 · R2）。 */
export function saveDistilledSlot(agent) {
  saveAgentSlot(agent, "distilled session")
}

/** 在飞选定**施加顺延**（2026-10-04 解锁批 · R3）：`setPrefs` 在飞支记位 ⇒ 本函数封位 + `loadAgentSlot`
 *  重载（回合尾落盘后调用——槽三键已由 `prefsSeedOnly` 保全 ⇒ 内存=盘，取忙期选定新值）；无位 ⇒ 零动作；
 *  位住 agent 对象 ⇒ 中止径随弃（零独立清理面）。 */
export function applyPendingPrefs(agent) {
  if (agent?._pendingPrefsApply !== true) return false
  agent._pendingPrefsApply = false // 封位（先封——重载失败不得留位复发）
  return loadAgentSlot(agent, agent.cwd, agent._slot)
}

/** 留档记录追加（消化面留档批 · #719 —— 形 ∕ 在场 ∕ 判据单源 = `docs/desktop/design/RENDERER.md`
 *  §1.1「留档记录」条）：人读线记录（`digest` ∥ `subagent` 两族）入档薄壳 —— **复用核 `pushReal`**
 *  （零算法副本：`ts` 打点 ∕ 记录存储追加 ∕ 尾窗驱逐三面同源），载体形**人读线半提取**：
 *  `_fullHistory` ∥ `_recordStore` ∥ `_historyWindow` 直通，`history`（机器线）以一次性弃数组承接
 *  ⇒ **记录不入 `agent.history`**（`contextHistory` 零新增 —— 不喂模型）。静默纪律同 `saveAgentSlot`
 *  （记录追加失败不掀回合 —— 回合已跑完）。 */
export function appendRecord(agent, record) {
  try {
    if (!Array.isArray(agent._fullHistory)) agent._fullHistory = []
    pushReal({ _fullHistory: agent._fullHistory, _recordStore: agent._recordStore, _historyWindow: agent._historyWindow, history: [] }, record)
  } catch (err) {
    console.error(`[agent-host] record append failed: ${err?.message ?? err}`)
  }
}
