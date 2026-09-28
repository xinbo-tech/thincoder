/**
 * dom.mjs — 渲染面 DOM 工具最小面（`docs/desktop/design/SHELL.md` §1 · `docs/desktop/design/RENDERER.md` §1）：
 * 建节点 / 文本 / 清空 / 事件 + 引导位置位。零框架零构建（`docs/desktop/design/PROJECT.md` §2 KD-4）——
 * 只用浏览器原生能力，零 `node:` / 零 `@thincoder/core`（批 1 E-6 静态闭包判据）。
 */

/** 建节点：`props` 供属性 / 事件（`on*`）· `html` 供**核 Markdown 呈现面**（R3c · D19）· `children` 供文本或子节点。
 *  `html` = **唯一 HTML 注入点**：值 = 核 `md` 产出（全量转义闸在核 —— KD-RC-4）；非串 / 空串 ⇒ 不注入（零写）。 */
export function el(tag, props = {}, children = []) {
  const node = document.createElement(tag)
  for (const [key, value] of Object.entries(props)) {
    if (key === "html") {
      if (typeof value === "string" && value !== "") node.innerHTML = value
      continue
    }
    if (key.startsWith("on") && typeof value === "function") node.addEventListener(key.slice(2).toLowerCase(), value)
    else if (value === true) node.setAttribute(key, "")
    else if (value !== false && value != null) node.setAttribute(key, String(value))
  }
    return fill(node, children)
}

/** 描述符建树（**唯一 DOM 构造点** —— `docs/desktop/design/RENDERER.md` §1.1）：`{ tag, props, children }` 递归；
 *  `children` 内裸串 = 文本节点、`null` / `undefined` = 空位跳过、带 `tag` 的对象 = 子描述符；`props.html` =
 *  核 Markdown 呈现面（见 `el` —— 本档为唯一注入点）。入参面与 `el()` 同形 ⇒ 视图档只产描述符（零 DOM），DOM 落点只在本档两函数。*/
export function build(node) {
  const list = node.children == null ? [] : node.children
  return el(node.tag, node.props ?? {}, (Array.isArray(list) ? list : [list]).map(expand))
}

/** 文本：置 `textContent`（不解析 HTML）。 */
export function text(target, value) {
  target.textContent = String(value ?? "")
  return target
}

/** 清空：摘除全部子节点。 */
export function clear(target) {
  target.replaceChildren()
  return target
}

/** 事件：绑一条监听并回返回绑节点（解绑 = 传同一函数引用给 `removeEventListener`）。 */
export function on(target, type, listener) {
  target.addEventListener(type, listener)
  return target
}

/** 引导位置位（机器读面 = `documentElement.dataset.boot`；值域 `ok | error`）——主进程经 `executeJavaScript` 读回。 */
export function setBoot(value) {
  document.documentElement.dataset.boot = value
  return value
}

/** 子项展开：描述符 ⇒ 递归建节点；其余（裸串 / 真节点 / `null`）原样交 `fill`。 */
function expand(child) {
  if (child !== null && typeof child === "object" && typeof child.tag === "string") return build(child)
  return child
}

/** 子节点装配（数组 ⇒ 逐个；文本 / 节点 ⇒ 单个）。 */
function fill(node, children) {
  const list = Array.isArray(children) ? children : [children]
  for (const child of list) {
    if (child == null) continue
    node.append(child instanceof Node ? child : String(child))
  }
  return node
}
