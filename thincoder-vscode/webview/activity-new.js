/**
 * activity-new.js — 未钉底期新块出生计数钮（2026-09-19 出生可见性批——WEBVIEW.md §5.5 / D-W27）。
 *
 * 载体 = 区首 `.activity-new-btn`（`position: sticky; top: 0`——`base.css`）；文案 = locale 键
 * `sub.newBlocks`（zh `↓ ${n} 新块` / en `↓ ${n} new block(s)`——`${n}` 形态，逐字登记见
 * `WEBVIEW-PROTOCOL.md` §6.3）。
 *
 * 判据（§5.5 出生判据二向——调用点 = `activity.js` buildBlock）：钉底 ⇒ 照旧跟随
 * （`maybeScrollActivity`）；**未钉底 ⇒ 不改 `scrollTop`**（不夺用户阅读位——D-W2 语义保持）+
 * 本档计数 +1。`N = 0` ⇒ 钮不存在（空区仍 `:empty` 零高——D-W1 不回归）。
 * 清账三路：① 钮点击（回底 + 重 pin）② 任一「近底」判定成立（`scroll` 事件——只读 `ui.js`
 * 维护的 `ctx._pinActivity` 旗标，不重算几何）③ `resetActivity` 同清（`activity.js` 调用）。
 */
import { ctx } from "./state.js"
import { t } from "./i18n.js"

let _count = 0
let _wired = false

/** 出生点调用（未钉底分支）：计数 +1 + 建 / 更钮。 */
export function noteActivityBirth() {
  _count += 1
  render()
  wire()
}

/** 计数读数（测试 / 诊断面）。 */
export function activityNewCount() {
  return _count
}

/** 清账（回底 / 近底 / `resetActivity`）：N → 0 + 删钮。 */
export function clearActivityNew() {
  _count = 0
  button()?.remove()
}

function button() {
  return ctx.activityEl?.querySelector(".activity-new-btn") ?? null
}

function render() {
  if (!ctx.activityEl) return
  const btn = button()
  if (btn) {
    btn.textContent = t("sub.newBlocks", { n: _count })
    return
  }
  const el = document.createElement("button")
  el.type = "button"
  el.className = "activity-new-btn"
  el.textContent = t("sub.newBlocks", { n: _count })
  ctx.activityEl.insertBefore(el, ctx.activityEl.firstChild) // 区首（sticky——不随区滚动出屏）
}

/** 监听一次性接线（首次建钮即挂）：① 点击 ⇒ 回底 + 重 pin + 清账；② `scroll`（被动）⇒
 *  近底（`ui.js` 同事件已维护 `ctx._pinActivity`——本档只读该旗标）即清账。 */
function wire() {
  if (_wired || !ctx.activityEl) return
  _wired = true
  ctx.activityEl.addEventListener("click", (e) => {
    if (!e.target?.closest?.(".activity-new-btn")) return
    ctx.activityEl.scrollTop = Number.MAX_SAFE_INTEGER
    ctx._pinActivity = true
    clearActivityNew()
  })
  ctx.activityEl.addEventListener("scroll", () => {
    if (ctx._pinActivity === true) clearActivityNew()
  }, { passive: true })
}
