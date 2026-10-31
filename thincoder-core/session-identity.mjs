/**
 * session-identity.mjs — 进程会话 id 单源（零 import 叶档）——PROVIDER.md §6.17「会话标识头」。
 *
 * 为什么单立一叶：请求装配面 `client-identity.mjs` 是零依赖叶子，而每个 transport 都 import 它；
 * 会话 id 又要「每次请求现取」。若从 `session-slots.mjs` 取，会把它的依赖链（config 读盘 ∥ 会话
 * 存储 ∥ 进程探测共 8 档）连带拉进每个 transport 的 import 图。故本体住本档，`session-slots.mjs`
 * 反向 re-export——既有 import 面零改。
 *
 * 语义：进程级惰性生成、零 IO、进程内稳定；形 `{pid}-{ts}-{rand6}`。它区分的是「哪一次进程会话」，
 * 不是「槽位里的哪一份对话」（按对话槽分桶属另批穿参改造）。
 */

let currentSessionId = null

/** Generate unique session ID for this process */
export function getSessionId() {
  if (!currentSessionId) {
    currentSessionId = `${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  }
  return currentSessionId
}
