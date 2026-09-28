/**
 * autocomplete.js — @ 补全面 ∕ 附件采集面接线（本档原 189 行拆两档搬核：
 *  `composer/atmenu.mjs`（@ 下拉 ∕ 150ms 防抖 ∕ 自增 seq ∕ 键盘导航 ∕ 接受插入）+ `composer/attach.mjs`
 *  （栅格门 ∕ 文档级 paste ∕ `#file-input` ∕ `#attach-btn` ∕ 芯片条）；`atComplete` 出站亦在核内）。
 *
 * 本档保留端侧推送入口面：宿主 `atResults` 消息 → 核 `showAtDropdown`（空 matches ⇒ 核内同判据关下拉）。
 */
import { pushComposer } from "./input.js"

/** 宿主 `atResults` 推送（消费面 = `chat-messages.js` `case "atResults"`）。 */
export function showAtDropdown(matches) { pushComposer({ type: "atResults", matches }) }

/** 关下拉（= 空建议面——核内 `matches.length === 0` 同判据分支）。 */
export function closeAtDropdown() { showAtDropdown([]) }
