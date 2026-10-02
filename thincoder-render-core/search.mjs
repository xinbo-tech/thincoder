/**
 * search.mjs — 会话内搜索（Ctrl+F，CLI 对位）——核化 VSC `webview/search.js`（165 行**整件上提**；
 * 批 `docs/batches/2026-09-28-desktop-feature-parity.md` §2.2 R6 ∕ §2.7 KD-T2「上提面四处」之四）。
 * **纯搬 + 转口零语义改**：逻辑逐字承源（2026-08-28 白屏修复三件套在内），唯二形变 = ① 模块级副作用
 * （DOM 查询 ∕ 事件注册）搬进工厂体 ② `ctx.messagesEl` ∕ `ctx.inputEl` 两指针改注入面 ∕ 文档级同字面 id。
 *
 * 源档头（2026-08-28 白屏修复——用户报告：长会话 Ctrl+F 输入时 webview 白屏）——根因三件套：
 * 1. 无防抖：每次击键全量 TreeWalker + 逐 mark 重建（10.7 万字符 × 高频词 happy-dom 实测
 *    166ms/键，真实浏览器再叠加 scrollIntoView 强制布局 → 主线程阻塞 → 渲染冻结呈白屏）
 * 2. 无高亮上限："the" 在 10 万字符中爆出 4000 个 <mark>，DOM 爆炸
 * 3. 每次搜索都 scrollIntoView（强制整页布局）
 * 修复：150ms 防抖 + 500 mark 上限（超限计数显示 "N/500+"）+ 搜索本身不滚动（仅跳转时滚动）
 *
 * 注入面（**唯一项** —— 与设计句「`root` 元素供面」一致）：
 *   `root`——扫描 ∕ 高亮容器（源 `ctx.messagesEl`）；VSC = `#messages`，桌面 = `[data-slot="flow"]`；必给。
 * 其余两触点在源档即**文档级同字面**（两端同字形 ⇒ 不入注入面）：
 *   · `#search-bar` 插入锚 = 源 `document.getElementById("toolbar")` 同字面（VSC 静态骨架 id；桌面
 *     输入区槽 id 由 `thincoder-desktop/renderer/mount-composer.mjs` 同字面赋——核件样式规则命中物）；
 *   · 关闭置焦 = 源 `ctx.inputEl.focus()` ⇒ 本档 `document.getElementById("input")`（VSC `webview/index.html`
 *     ∕ 桌面核件输入面板 `composer/panel.mjs:79` 同 id）。
 *
 * Ctrl+F 入口（源 `:159-165` 文档级 keydown）= **工厂内注册**：两端同件 ⇒ 键位单源、端侧零副本
 * （VSC 端壳「既有宿主键位」即本注册——键名 ∕ 三修饰键守卫 ∕ `preventDefault` 逐字不变）。
 * 取词 = 核 i18n（`./i18n.mjs` `t`）——源档 `./i18n.js` 即本模块的再出口（VSC 同实例，零改）；桌面供给面 =
 * `renderer/app.mjs` 单点注册 `setStringsSink(setStrings)`（键族 `search.*` 由宿主词表供给）。
 *
 * 返回面：`{ openSearch, closeSearch, performSearch, jumpSearch }`——端壳消费 = 桌面 `renderer/app.mjs:277` 捕获 + `:70` `openSearch` 分派（菜单批接线）∥ VSC 既有宿主键位注册（同件零副本）；
 * 探针 ∕ 后续程序化驱动可及（工厂化面，非源档新增语义）。
 */
import { t } from "./i18n.mjs"

/**
 * 建会话内搜索面（工厂：实例态 = 源档模块级五变量）。
 * @param {{ root: Element }} deps —— `root` = 扫描 ∕ 高亮容器（消息区）；缺 ⇒ 抛出（fail-loud）。
 */
export function createSearch(deps = {}) {
  const { root } = deps
  if (!root) throw new Error("createSearch: deps.root（扫描 ∕ 高亮容器）必给")

  let _searchMatches = []  // live mark.search-hit elements
  let _searchIndex = 0
  let _debounceTimer = null // 修复 1：input 防抖 timer
  let _markLimit = 500      // 修复 2：单次搜索高亮节点上限
  let _marked = 0           // 本次搜索已插入的 mark 数
  let _truncated = false    // 达上限截断标志（计数显示 "+"）

  function clearSearchHighlights() {
    for (const mark of root.querySelectorAll("mark.search-hit")) {
      const parent = mark.parentNode
      parent.replaceChild(document.createTextNode(mark.textContent), mark)
      parent.normalize() // merge adjacent text nodes back
    }
    _searchMatches = []
  }

  function highlightTextNode(node, q) {
    if (_truncated) return // 预算已耗尽，剩余节点不再处理
    const text = node.nodeValue
    const lower = text.toLowerCase()
    const frag = document.createDocumentFragment()
    let i = 0
    let idx
    while ((idx = lower.indexOf(q, i)) !== -1) {
      if (idx > i) frag.appendChild(document.createTextNode(text.slice(i, idx)))
      if (_marked >= _markLimit) {
        _truncated = true
        frag.appendChild(document.createTextNode(text.slice(idx))) // 剩余文本原样补回，不丢字符
        break
      }
      const mark = document.createElement("mark")
      mark.className = "search-hit"
      mark.textContent = text.slice(idx, idx + q.length)
      frag.appendChild(mark)
      _marked++
      i = idx + q.length
    }
    if (i < text.length && !_truncated) frag.appendChild(document.createTextNode(text.slice(i)))
    node.parentNode.replaceChild(frag, node)
  }

  function performSearch(query) {
    clearSearchHighlights()
    _marked = 0
    _truncated = false
    if (!query) { updateSearchCount(); return }
    const q = query.toLowerCase()
    const NF = window.NodeFilter
    const walker = document.createTreeWalker(root, NF.SHOW_TEXT, {
      acceptNode: (node) => {
        if (node.parentElement?.closest("#search-bar")) return NF.FILTER_REJECT
        return node.nodeValue.toLowerCase().includes(q) ? NF.FILTER_ACCEPT : NF.FILTER_REJECT
      },
    })
    const nodes = []
    let n
    while ((n = walker.nextNode())) nodes.push(n)
    for (const node of nodes) {
      highlightTextNode(node, q)
      if (_truncated) break
    }
    _searchMatches = [...root.querySelectorAll("mark.search-hit")]
    _searchIndex = _searchMatches.length ? Math.min(_searchIndex, _searchMatches.length - 1) : 0
    updateSearchCount()
    if (_searchMatches.length) showCurrentMatch(false) // 修复 3：搜索本身不滚动布局
  }

  /** 修复 3：scrollIntoView（强制布局）只在用户跳转时发生；搜索自跑仅更新 current class。 */
  function showCurrentMatch(scroll = false) {
    _searchMatches.forEach((m, i) => m.classList.toggle("current", i === _searchIndex))
    if (scroll) _searchMatches[_searchIndex]?.scrollIntoView({ block: "center" })
  }

  function updateSearchCount() {
    const el = document.getElementById("search-count")
    if (!el) return
    el.textContent = _searchMatches.length
      ? `${_searchIndex + 1}/${_searchMatches.length}${_truncated ? "+" : ""}`
      : t("search.noMatch")
  }

  function jumpSearch(dir) {
    if (!_searchMatches.length) return
    _searchIndex = (_searchIndex + dir + _searchMatches.length) % _searchMatches.length
    showCurrentMatch(true)
    updateSearchCount()
  }

  function ensureSearchBar() {
    let bar = document.getElementById("search-bar")
    if (bar) return bar
    bar = document.createElement("div")
    bar.id = "search-bar"
    bar.style.display = "none"
    bar.innerHTML =
      `<input id="search-input" type="text" placeholder="${t("search.placeholder")}" aria-label="${t("search.placeholder")}">` +
      `<span id="search-count" role="status" aria-live="polite"></span>` +
      `<button id="search-prev" title="${t("search.prev")}" aria-label="${t("search.prev")}">↑</button>` +
      `<button id="search-next" title="${t("search.next")}" aria-label="${t("search.next")}">↓</button>` +
      `<button id="search-close" title="${t("search.close")}" aria-label="${t("search.close")}">✕</button>`
    const toolbar = document.getElementById("toolbar")
    toolbar.parentNode.insertBefore(bar, toolbar)
    const input = bar.querySelector("#search-input")
    // 修复 1：150ms 防抖——击键期不搜，停顿后才全量扫描（长会话下每键一次全量高亮重建 + 强制布局是白屏主因）
    input.addEventListener("input", () => {
      clearTimeout(_debounceTimer)
      _debounceTimer = setTimeout(() => performSearch(input.value.trim()), 150)
    })
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault()
        flushSearch(input) // 跳转前同步反映最新输入（防抖 pending 时高亮尚未渲染）
        jumpSearch(e.shiftKey ? -1 : 1)
      }
      else if (e.key === "Escape") closeSearch()
      else if (e.key === "ArrowDown") { e.preventDefault(); flushSearch(input); jumpSearch(1) }
      else if (e.key === "ArrowUp") { e.preventDefault(); flushSearch(input); jumpSearch(-1) }
    })
    bar.querySelector("#search-next").addEventListener("click", () => jumpSearch(1))
    bar.querySelector("#search-prev").addEventListener("click", () => jumpSearch(-1))
    bar.querySelector("#search-close").addEventListener("click", closeSearch)
    return bar
  }

  /** Flush any pending debounce and run the search synchronously for the current input. */
  function flushSearch(inputEl) {
    clearTimeout(_debounceTimer)
    performSearch(inputEl.value.trim())
  }

  function openSearch() {
    const bar = ensureSearchBar()
    bar.style.display = "flex"
    bar.querySelector("#search-input").focus()
  }

  function closeSearch() {
    clearTimeout(_debounceTimer) // 防幽灵执行：关闭后 150ms 内不得再触发搜索
    const bar = document.getElementById("search-bar")
    if (bar) bar.style.display = "none"
    clearSearchHighlights()
    document.getElementById("input")?.focus() // 源 `ctx.inputEl.focus()`（两端 `#input` 同字面；缺 id ⇒ 零动作）
  }

  // Ctrl+F opens in-conversation search (webview's native find does nothing here) —— 源 `:159-165` 逐字。
  document.addEventListener("keydown", (e) => {
    if (e.key === "f" && e.ctrlKey && !e.altKey && !e.metaKey && !e.shiftKey) {
      e.preventDefault()
      openSearch()
    }
  })

  return { openSearch, closeSearch, performSearch, jumpSearch }
}
