/**
 * search.mjs — 会话内搜索端壳（R6 · 批 `docs/batches/2026-09-28-desktop-feature-parity.md` §2.2 R6 #4）。
 * 实现在核：`/rc/search.mjs`（`createSearch` —— **纯搬**自 VSC `webview/search.js`，零语义改；`/rc/` =
 * `app://` 第二根，沿渲染面既有取核形）。端壳三面：
 *  ① 核件直取（`/rc/search.mjs` —— 逻辑零副本）；
 *  ② 消息容器供面 = `[data-slot="flow"]`（对话流宿主 —— 扫描 ∕ 高亮容器，对位 VSC `#messages`）；
 *  ③ Ctrl+F 绑定随核件工厂一次注册（文档级 keydown —— 键位单源在核，端侧零副本）；
 *  ④ 披露缝 = `reveal: revealSegmentAt`（`views/chat-segment-reveal.mjs` —— 巨块隐藏段命中放窗；核缝缺省零变）。
 * 条插入锚 `#toolbar`（输入区槽 id —— `renderer/mount-composer.mjs` 赋）与关闭置焦 `#input`（核件输入
 * 面板 `composer/panel.mjs` 同 id）皆文档级 id ⇒ 不经本档（核件内直取）。
 * 样式 = 核件 `search.css`（`renderer/index.html` 链入 `/rc/search.css` —— **桌面 css 零新增**）。
 * 纪律：零 `node:` / 零裸包（渲染面静态闭包判据 —— `/rc/` 前缀白名单内）。
 */
import { createSearch } from "/rc/search.mjs"
import { revealSegmentAt } from "./views/chat-segment-reveal.mjs"

const FLOW_SLOT = '[data-slot="flow"]' // 对话流容器锚（字面同 `renderer/app.mjs` `FLOW_SLOT`）

/** 挂载搜索面（`renderer/app.mjs:288` 接线；返回核件工厂面 —— 端侧消费 = `app.mjs:74` `openSearch` 分派〔菜单动作面〕）。
 *  槽缺 ⇒ 记错一次 + `null`（零静默；沿 `renderer/mount-composer.mjs` 装配面同式）。 */
export function attachSearch() {
  const root = document.querySelector(FLOW_SLOT)
  if (root === null) {
    console.error(`[renderer] search root missing: ${FLOW_SLOT}`)
    return null
  }
  return createSearch({ root, reveal: revealSegmentAt })
}
