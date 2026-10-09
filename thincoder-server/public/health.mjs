/**
 * health.mjs — 控制台健康轮询（webui/WEBUI.md §2.3⑤——结构轮自 `app.mjs` 逐字外拆）：`HEALTH_POLL_MS`（30s）∥ 三态文案键 ∥
 * `healthSnapshot` ∥ `onHealth` 视图订阅 ∥ 侧栏灯直更 ∥ `pollHealth` ∥ 启停 ∥ 订阅清零口（`clearHealthListeners`——
 * 原 `route()`/`logout()` 直写 `healthListeners = []` 之收口——行为不变）。三落点共用：侧栏灯（直更）∥ 系统页块 ∥
 * 总览卡（后两者经 `ctx.onHealth` 订阅——路由切换清空）。
 */
import { t } from "./i18n.mjs"

// ── 健康轮询（§2.3⑤——灯 ∥ 系统页块 ∥ 总览卡三落点共用）──────────────────────

/** 轮询周期（30s——§2.3⑤；登录后启动，登出停止）。 */
export const HEALTH_POLL_MS = 30000
/** 状态 ⇒ 文案键（三态——绿/黄/红）。 */
const HEALTH_LABEL_KEYS = { ok: "health.ok", degraded: "health.degraded", down: "health.down" }

let healthTimer = null, healthListeners = []
let healthState = { status: null, body: null, checkedAt: null }

/** 健康快照（视图渲染取用——文案按当前语言即时计算；未知态 = 「—」中性保留）。 */
export function healthSnapshot() {
  const { status, body, checkedAt } = healthState
  return { status, body, checkedAt, label: status === null ? "—" : t(HEALTH_LABEL_KEYS[status]) }
}

/** 视图订阅（路由切换清空——route() 重渲前重置）：每次轮询回调一次（视图用 `ctx.health()` 取快照重渲）。 */
export function onHealth(listener) { healthListeners.push(listener) }

/** 侧栏灯直更（元素 id = `nav-health`——无整页重渲；侧栏重渲后由 route() 回填最近状态）。 */
export function renderHealthLight() {
  const el = document.getElementById("nav-health")
  if (!el) return
  el.className = healthState.status === null ? "health" : `health ${healthState.status}`
  el.textContent = healthState.status === null ? "" : healthSnapshot().label
}

/** 轮询一次：`/healthz` 直读（公开端点——503 也携状态体；不经 `api()` 封装）；失败 ⇒ 红（服务不可达）。 */
async function pollHealth() {
  let body = null
  try {
    const response = await fetch("/healthz")
    try { body = await response.json() } catch { body = null }
  } catch { /* 请求失败 ⇒ down（灯变红——失败静默不 flash 刷屏） */ }
  const status = body?.status === "ok" ? "ok" : body?.status === "degraded" ? "degraded" : "down"
  healthState = { status, body, checkedAt: Date.now() }
  renderHealthLight()
  for (const listener of healthListeners) listener()
}

export function startHealthPolling() {
  if (healthTimer !== null) return
  pollHealth() // 立即一次
  healthTimer = setInterval(() => pollHealth(), HEALTH_POLL_MS)
}

export function stopHealthPolling() {
  if (healthTimer !== null) { clearInterval(healthTimer); healthTimer = null }
}

/** 订阅清零（路由切换 ∥ 登出——旧订阅退场；原 `route()`/`logout()` 直写 `healthListeners = []` 之收口——行为不变）。 */
export function clearHealthListeners() {
  healthListeners = []
}
