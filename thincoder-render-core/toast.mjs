/**
 * toast.js — transient hint (shared): lazily creates #paste-toast (.paste-toast —
 * controls.css:49-65), auto-fades after 2.6s (single static timer field, same as
 * the original). Extracted verbatim from autocomplete.js's private showToast
 * (第 28 批 B2 §9.2 C-B2-4——busy 拒发与图片拒绝共用同一机制，防两份实现漂移).
 * id/class 维持 `paste-toast`（零 CSS 触碰——D-B2-6 命名债登记）。
 */

/** Transient hint (auto-fades; zero layout dependency). */
export function showToast(text) {
  let el = document.getElementById("paste-toast")
  if (!el) {
    el = document.createElement("div")
    el.id = "paste-toast"
    el.className = "paste-toast"
    document.body.appendChild(el)
  }
  el.textContent = text
  el.classList.add("visible")
  clearTimeout(showToast._t)
  showToast._t = setTimeout(() => el.classList.remove("visible"), 2600)
}
