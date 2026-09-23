import { C } from "./ansi.mjs"
import { QUEUED_MAX_ITEMS } from "./queued-merge.mjs"

/** busy 门禁（2026-09-22 structure-debt §2.1 分族 4 · #226）：processing（含 digest）期
 *  Enter 队列受理（容量 QUEUED_MAX_ITEMS）+ 吞面四（模态 / 斜杠 / 空 / 队满）+ 满队提示 +
 *  挂起面唤醒，Tab 恒吞；块体自 key-handler.mjs createKeyHandler 逐字搬移（仅去缩进；函数体自持原块入口判定）。
 *  路由 = 分派器 createKeyHandler（守卫 = busy 块内返回条件：tab / 无 meta 的 Enter、回车）。 */
export function handleBusyEnter(str, key, state, ctx) {
  const { pushLine, render } = ctx
  if (state.processing) {
    // busy 门禁（INPUT-LOCK C'——2026-09-09 + F16 busy 队列受理——2026-09-21 · busy-extend
    // 扩面 2026-09-22 · queue-visible 多槽 + 容量 8——2026-09-24）：processing（含 digest——单一
    // 判据）输入不禁——打字照常回显；Enter 提交 = 入队（放行判据五条 = TUI-INPUT-BOX.md §4.1：
    // 非模态 · 非斜杠 · 非空 · 未满队 ⇒ 清框入 pendingInput——步边界 pickup / 回合尾 drain /
    // 挂起 driver 送达；挂起两态不再是吞面）；
    // 吞面四 = 模态 / 斜杠 / 空 / 队满（吞 + 提示，文本保留；斜杠同禁发——白名单已删）；
    // 多行换行（meta/enter——编辑）照常放行；Tab 仍吞。**第 31 批**：↑↓ 分流见下方三规则块。
    if (key.name === "tab") return
    if ((key.name === "return" && !key.meta) || (str === "\r" && !key.meta)) {
      const text = state.input.join("").trim()
      if (!text) return // 条件 4：空 Enter 静默（既有）
      state.pendingInput ??= []
      // 条件 2/3 不满足（模态 / 斜杠——模态分派在前，此处按判据表如实守卫）→ 吞 + busy 提示
      if (text.startsWith("/") || state.permission || state.question) {
        pushLine(`[主会话处理中 —— 消息未发送（回合结束后请重按 Enter）]`, C.warn)
        render(); return
      }
      // 条件 5：满队（第 9 条）= 拒绝 + 提示 + 文本保留（容量 8——多槽裁定连带；与挂起态满队分支同构）
      if (state.pendingInput.length >= QUEUED_MAX_ITEMS) {
        pushLine(`[主会话处理中 —— 已排队 ${QUEUED_MAX_ITEMS} 条消息，请等其处理完成后再发送]`, C.warn)
        render(); return
      }
      // 入队（判据全满足）：清框 + history 收录 + 草稿复位 + 队列填充（§4.1 执行序）
      state.input = []; state.cursor = 0
      state.history.push(text)
      state.historyIndex = -1
      state._draft = null
      state.pendingInput.push(text)
      // F4「新提交消息 → 恢复跟随」（§7.5 跟随——排队提交同列；与 turn-face.mjs submit 同款两行）
      state.scroll = 0
      state._followTail = true
      // 挂起面入队同款唤醒（§4.1）——busy 期该槽恒 null ⇒ 零动作；普通 busy 面零唤醒
      if (state.suspended || state._suspPending) state._suspWake?.()
      render(); return
    }
  }
}
