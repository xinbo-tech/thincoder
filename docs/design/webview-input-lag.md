# Webview 输入卡顿修复方案 > 状态：**全部已实施**（P0 止血 + 工具输出限长 + 流式降频 + 窗口化裁剪）
> 症状：使用时间越长，输入越卡，中文 IME 尤其明显；退出 VS Code 重进恢复。
> 依据：会诊共识（4 家一致）+ 代码走查（webview/chat.js、ui.js、md.js、highlight.js、autocomplete.js、chat.css、base.css） ## 1. 根因 **消息 DOM 无界增长 × 输入路径上的强制同步布局**，两者相乘。webview 因 `retainContextWhenHidden: true` 永生，只有退出 VS Code 才清，所以"重启就好"。 | 因素 | 说明 |
|---|---|
| **DOM 只增不减（主因）** | 消息/工具卡永远 `appendChild`，仅切会话时 `replaceChildren`。最大增长点是工具输出：`toolOutput` 把完整 bash/读文件输出（几十~几百 KB）塞进单个节点永不释放 |
| **输入路径强制 reflow** | `adjustInputHeight` 先写 `height:auto` 再读 `scrollHeight`（write→read），每键/每个汉字落定都强制全文档 reflow，代价随 DOM 变大 |
| **IME 最敏感** | 拼音组合/候选窗定位要同步布局焦点元素所在上下文，文档越大越慢 |
| **放大器** | 流式每帧 `md(currentRaw)` 全量重渲染 + 每帧 `scrollTop = scrollHeight` 强制布局；`#messages` 挂了 `aria-live="polite"`，每次变更重算无障碍树 |
| **排除** | 事件监听无累积（随节点走，非独立泄漏）；自研 tokenizer 非打字期开销 | ## 2. 修复（按性价比） ### 2.1 治本：消息列表窗口化裁剪 - `messagesEl` 顶层块超过阈值（~120 个）时，从顶部 `remove()` 最旧节点，置 `_hasOlder = true`；
- 复用已有的 `loadOlder` / `applyHistoryPage` 懒加载（prepend + `scrollTop` 补偿），向上滚动自动取回被裁掉的历史；
- DOM 有上界，一切布局代价有上界。 ### 2.2 砍最大增长点：工具输出限长入 DOM - `toolOutput` 追加超过 ~64KB 时停止拼接 DOM，显示 `…(输出过长已截断)`；
- 完整文本保留在 JS 变量，用户展开卡片时再注入 DOM。 ### 2.3 消输入路径强制 reflow - `adjustInputHeight` 缓存上次高度：`scrollHeight` 没变就跳过，避免每键都 `height:auto`→`px`；
- 或直接换 Chromium 123+ 的 `field-sizing: content`（webview 可用），删掉整个 auto/scrollHeight/height 技巧；
- 滚动定位：`scrollTop = Number.MAX_SAFE_INTEGER` 替代 `scrollTop = scrollHeight`（免读 layout）。 ### 2.4 CSS 隔离（一行止血） - `.message, .tool-call { content-visibility: auto; contain-intrinsic-size: auto 80px; }` 让视口外消息跳过 layout/paint；
- 去掉 `#messages` 的 `aria-live="polite"`，改用隐藏小 live-region 只播报最新一条；
- 修 grid 坑：`#chat-container` 的 `grid-template-rows: auto 1fr auto` → `auto minmax(0, 1fr) auto`。 ### 2.5 流式渲染降频 - 长回复（`currentRaw` > ~20KB）降为每 150ms 渲染一次（非每帧）；
- 代码块 fence 未闭合时按纯文本渲染，闭合后才 `highlight()`；
- reasoning 折叠（`details.open === false`）时跳过渲染。 ## 3. 分期 | 阶段 | 内容 | 状态 |
|---|---|---|
| **P0（止血）** | #2.3 去强制 reflow（adjustInputHeight 缓存跳过 + scrollTop=MAX_SAFE_INTEGER）+ #2.4 CSS 隔离（content-visibility + 去 aria-live + grid minmax） | ✅ 已做 |
| **P1（治本）** | #2.2 工具输出限长（capText 64KB，流式 + 完成态都截断） | ✅ 已做 |
| **P1（治本）** | #2.1 窗口化裁剪（顶层块超 150 删最旧；live 块本地 `_nextIdx` 续接 data-idx，`loadOlder` 可锚回） | ✅ 已做 |
| **P2（打磨）** | #2.5 流式降频（scheduleStreamRender 限 ≥50ms/次） | ✅ 已做 | ## 4. 验证 1. **归因 A/B**：长会话卡顿后，DevTools 控制台跑 `[...messages.children].slice(0,-30).forEach(e=>e.remove())` 再打字——立刻顺滑即证实 DOM 规模是根因；
2. **量化**：Performance 录一段中文输入，看每键 Recalculate Style / Layout 时长是否随使用时长单调增长；`document.querySelectorAll('#messages *').length`（卡顿时预期 >3 万）；
3. **修后回归**：节点数稳定在阈值内；IME 输入 Layout 回落到新开会话水平；上滚分页、Ctrl+F 搜索、滚动钉底、`finish()` flush 尾部完整性不回归。 ## 5. Ctrl+F 搜索白屏修复（2026-08-28） **用户报告**：长会话按 Ctrl+F 搜索输入时 webview 白屏。**根因（happy-dom 复现 10.7 万字符会话）**：`webview/search.js` 每次击键触发全量 `performSearch`——TreeWalker 全树扫描 + 逐文本节点 `replaceChild`/`normalize` + `scrollIntoView` 强制布局；高频词（"the"）单键实测 166ms 且爆出 4000 个 `<mark>` → 主线程阻塞数秒 → 渲染冻结呈白屏（非崩溃，停顿后恢复）。 **修复三件套**：
1. **input 150ms 防抖**——击键期零同步扫描（实测 4 键 1ms vs 原 4×166ms）
2. **mark 上限 500**——超限截断且不丢文本（剩余原样补回），计数显示 `N/500+`
3. **搜索不自动滚动**——`scrollIntoView` 仅 Enter/↑↓ 跳转时触发，去掉每次搜索的强制布局 **顺带修复**：`search.*` locale 键（placeholder/prev/next/close/noMatch）缺失导致 UI 显示裸键名。 **回归测试**：`test/search.test.mjs` 4 用例（防抖/上限/不滚动/i18n），已入 package.json test 清单；全量 731 绿。