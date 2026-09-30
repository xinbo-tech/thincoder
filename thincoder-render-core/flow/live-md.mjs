/**
 * live-md.mjs — 增量 md 重渲画件（核件 · 单源 = `docs/render-core/design/RENDER-CORE.md` §2 KD-RC-10）：
 *   ① `paintLiveMd(el, raw)` —— 分片画件（首绘 = 分片全绘；增帧 = 提交段追加 + 热区换代；幂等帧零写；
 *      非前缀扩展 ∕ 热区失连 ⇒ 复位全绘；异常 ⇒ `textContent = raw` 并复位）；冻结切点扫描 = `./live-scan.mjs`
 *      （`liveCut`）——本档只含渲染面；
 *   ② `liveInline(text)` —— 段内续写渲染器（inline 语境：经核 `mdInline` 组装 + `\n`→`<br>` 单换行步 ——
 *      与核 md 步 10 同位置施加；不另起第二份 inline 实现）。
 */
import { md, mdInline } from "../md.mjs"
import { liveCut, tailHeadEnd } from "./live-scan.mjs"
export { liveCut }

// ─── ③ 段内续写渲染器 ───────────────────────────────────────────────────────

/** 段内续写（inline 语境 · 含单换行 `\n`→`<br>` 步）：核 `mdInline` ∥ 全量换行步 —— 核 md 的步 10 在
 *  inline 趟之后施加（行内代码段内容已还原 ⇒ 其换行同变 `<br>`；围栏 ∕ 块级占位在步 11 还原 ⇒ 不受）。 */
export function liveInline(text) {
  const s = text == null ? "" : String(text)
  if (s === "") return ""
  return mdInline(s).replace(/\n/g, "<br>")
}

// ─── ② 分片画件 ────────────────────────────────────────────────────────────

/** 解析 HTML 片段为节点数组（宿主文档）；空串 ⇒ 空数组。 */
function htmlNodes(doc, html) {
  if (!doc || typeof doc.createElement !== "function" || html === "") return []
  const box = doc.createElement("div")
  box.innerHTML = html
  const out = []
  for (let node = box.firstChild; node; node = node.nextSibling) out.push(node)
  return out
}

/** 热区桶摘除（热区 = 开段内片段 ∕ 块级片段 两类桶）。 */
function dropHot(st) {
  for (const bucket of st.hot ?? []) for (const node of bucket.nodes) node?.remove?.()
  st.hot = []
}

/** 向桶集追加一段（建立新桶）。 */
function pushBucket(st, parent, nodes) {
  if (nodes.length === 0) return
  for (const node of nodes) parent.appendChild(node)
  st.hot.push({ parent, nodes })
}

/** 提交增量 [st.cut, res.cut)：**行内有效前缀**（首个段界⁄已定块级构造之前）入开段；界限之后块级 `md` 追加。
 *  块界径：前缀续段 + 段闭 + 界限后段（自段界 ∕ 块构造起 ⇒ 块级复合位，不做首段壳吸收）；
 *  段内径（`res.cut > res.blockStart`）：整段增量入开段（增量无段界 ∕ 无块级构造）。 */
function commitDelta(el, st, text, res) {
  const doc = el.ownerDocument
  const delta = text.slice(st.cut, res.cut)
  if (delta === "") return
  const head = res.cut > res.blockStart ? res.cut : Math.min(tailHeadEnd(text, st.cut), res.cut)
  if (head > st.cut) {
    if (!st.para) {
      st.para = doc.createElement("p")
      el.appendChild(st.para)
    }
    for (const node of htmlNodes(doc, liveInline(text.slice(st.cut, head)))) st.para.appendChild(node)
  }
  if (res.cut > res.blockStart) return
  if (st.para && st.para.childNodes.length === 0) st.para.remove()
  st.para = null // 段界 ∕ 块构造界 ⇒ 参考段落已闭
  const rest = text.slice(head, res.cut)
  if (rest !== "") {
    for (const node of htmlNodes(doc, md(rest))) el.appendChild(node)
  }
}

/** 热区渲染（换代）：开段前缀入段 ∕ 边界后块级 md（自段界 ∕ 块构造起 ⇒ 块级复合位）；语境 = inline 时开段续开。 */
function renderHot(el, st, text, res) {
  const doc = el.ownerDocument
  const tail = text.slice(res.cut)
  if (tail === "") {
    if (!res.inline && st.para) {
      if (st.para.childNodes.length === 0) st.para.remove()
      st.para = null
    }
    return
  }
  const boundary = tailHeadEnd(text, res.cut)
  const pre = text.slice(res.cut, boundary)
  const post = text.slice(boundary)
  if (res.inline && pre !== "") {
    if (!st.para) {
      st.para = doc.createElement("p")
      el.appendChild(st.para)
    }
    pushBucket(st, st.para, htmlNodes(doc, liveInline(pre)))
    if (post === "") return // 开段续开（无边界后段）
    st.para = null // 边界后段 ⇒ 开段已关（段元素留存）
  } else {
    if (st.para && st.para.childNodes.length === 0) st.para.remove()
    st.para = null
  }
  if (post !== "") pushBucket(st, el, htmlNodes(doc, md(post)))
}

/** 热区 ∕ 开段锚存续自检（外部覆写 ⇒ 复位）：开段段元素须仍居根内；热区桶节点须仍居桶父内。 */
function hotAlive(el, st) {
  if (st.para && st.para.parentNode !== el) return false
  for (const bucket of st.hot ?? []) {
    for (const node of bucket.nodes) if (node.parentNode !== bucket.parent) return false
  }
  return true
}

/** 全量分片重绘（首绘 ∕ 复位径）：head（完整块）+ 开段（若有）+ 热区（前缀 ∕ 边界后段）三段。 */
function rebuild(el, text) {
  const doc = el.ownerDocument
  const res = liveCut(text, 0)
  const paraFlag = res.cut > res.blockStart
  const head = text.slice(0, res.blockStart)
  const openText = text.slice(res.blockStart, res.cut)
  const hotText = text.slice(res.cut)
  while (el.firstChild) el.removeChild(el.firstChild)
  let para = null
  const hot = []
  const push = (parent, nodes) => {
    for (const node of nodes) parent.appendChild(node)
    if (nodes.length > 0) hot.push({ parent, nodes })
  }
  for (const node of htmlNodes(doc, md(head))) el.appendChild(node)
  if (paraFlag) {
    para = doc.createElement("p")
    el.appendChild(para)
    for (const node of htmlNodes(doc, liveInline(openText))) para.appendChild(node)
  }
  let paraOpen = res.inline && paraFlag
  if (res.inline) {
    const boundary = tailHeadEnd(text, res.cut)
    const pre = text.slice(res.cut, boundary)
    const post = text.slice(boundary)
    if (!para) {
      para = doc.createElement("p")
      el.appendChild(para)
      paraOpen = true
    }
    push(para, htmlNodes(doc, liveInline(pre)))
    if (post !== "") {
      paraOpen = false
      push(el, htmlNodes(doc, md(post)))
    }
  } else {
    if (para && para.childNodes.length === 0) para.remove()
    para = null
    push(el, htmlNodes(doc, md(hotText)))
  }
  el._liveMd = {
    raw: text,
    cut: res.cut,
    para: paraOpen ? para : null,
    hot,
  }
}

/** 画件：文本面增量重渲（首绘 = 分片全绘；增帧 = 提交段追加 + 热区换代；幂等帧零写）。 */
export function paintLiveMd(el, raw) {
  if (!el) return
  const text = raw == null ? "" : String(raw)
  try {
    const st = el._liveMd
    if (st && st.raw === text) return // 幂等帧零写
    if (!st || !text.startsWith(st.raw)) return rebuild(el, text)
    if (!hotAlive(el, st)) return rebuild(el, text)
    const res = liveCut(text, st.cut)
    if (res.cut < st.cut) return rebuild(el, text)
    dropHot(st)
    commitDelta(el, st, text, res)
    renderHot(el, st, text, res)
    st.raw = text
    st.cut = res.cut
  } catch (error) {
    el.textContent = text
    el._liveMd = null
  }
}
