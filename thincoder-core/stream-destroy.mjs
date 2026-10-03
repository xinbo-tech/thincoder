/**
 * stream-destroy.mjs — response body 终止守卫（单一权威源——PROXY.md §2 ∥ §7 D-PX7）
 *
 * 无监听者瞬间的 `destroy(err)` 会 emit 未处理 'error' ⇒ uncaughtException ⇒ 整个进程被杀
 * （2026-09-22/23 三份 crash-report 签名 = `Response body timeout (idle)`，栈 = proxy.mjs
 * 看门狗；GitHub #16）。`destroyBody(body, err)` 在终止前先挂**永久** no-op `'error'`
 * 监听者——pipe 内部监听者触发即自摘后的重发同样被兜住；消费面语义零变（在场 ∥ 迟到
 * `for-await` 消费者仍收原错误；`stream.errored` 保留原错误对象）。
 *
 * 契约四则（PROXY.md §2）：
 * ① body 空 ∥ 非 destroy 形态（web `ReadableStream`）∥ 已 `destroyed` ⇒ 显式返回（no-op）；
 * ② 首次调用挂永久 no-op 'error' 监听者（一次性标记防重复挂）；
 * ③ 再 `destroy(err)`——原错误对象直传；
 * ④ 禁 `listenerCount('error') === 0` 预检（pipe 监听者使计数失真——触发即自摘后重发）。
 *
 * 零 import——proxy ∥ provider 消费点共用（无环）。
 */

/** 一次性标记（模块私有 Symbol——不占 body 公开面）。 */
const GUARDED = Symbol("thincoder.destroyBody.guarded")

/**
 * 终止 body，且未处理 'error' 不逃逸到进程（契约四则见档头）。
 * @param {import("node:stream").Stream} body — response body（PassThrough）；
 *   web `ReadableStream`（无 destroy）⇒ 显式 no-op
 * @param {Error} err — 原错误对象（直传 destroy）
 */
export function destroyBody(body, err) {
  if (!body || typeof body.destroy !== "function" || body.destroyed) return
  if (!body[GUARDED]) {
    body[GUARDED] = true
    body.on("error", () => {})
  }
  body.destroy(err)
}
