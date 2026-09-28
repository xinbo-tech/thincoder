/**
 * model-menu.js — 模型菜单接线（逻辑单源 = 核 `composer/model-menu.mjs`；本档原 272 行全件搬核）。
 *
 * 菜单实现（overlay ∕ 定位 ∕ flyout ∕ 过滤 ∕ `mm-*` 样式）住核件模块级单例；本档留 **re-export shim**
 * ——消费面三处消费不断（上提批 `2026-09-28-desktop-input-vsc-align.md` §2.3 ∕ §2.4 P7）：
 *  ① 输入面板（`input.js` 接线 → 核工厂 `createModelMenu`——与独立导出共用同一份实现）；
 *  ② 设置族两档（`settings-models.js:6` ∕ `settings-providers.js:9`——槽位 ∕ 默认模型菜单）；
 *  ③ `chat.js` Escape 面（全局关闭）。
 */
export { openModelMenu, closeModelMenu } from "../node_modules/@thincoder/render-core/composer/model-menu.mjs"
