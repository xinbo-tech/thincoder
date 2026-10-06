/**
 * system.mjs — 系统面（gateway/API.md §2.3 ∥ KD-SV-23/24——首版完备化①③）：`/healthz` 探活 ∥ `/api/system` 版本/更新状态。
 *
 * `/healthz` = 无鉴权只读探针（零凭据可直调；`SELECT 1` 一探；db 故障 ⇒ 503 `degraded`；`Cache-Control: no-store`；
 * **不走统一错误信封**——探活响应自含状态）；仅注册 GET（HEAD ∥ POST ⇒ 404——探针面单一）。
 * `/api/system` = 会话门（两角色）：`{ version, update: { mode, lastCheckAt, latest } }`——更新状态经访问器惰性取
 * （路由注册先于更新器创建——入口注入；未就位 ⇒ 全 `null` 形）。
 * 注入口径（批内件替身）：`probeDb`（探活失败注入） ∥ `uptimeS` ∥ `getUpdateStatus` ∥ `version` 走可覆盖参数 + 缺省。
 */
import { requireSession } from "../accounts/session.mjs"
import { readPackageVersion } from "../ops/update.mjs"
import { sendJson } from "./errors.mjs"

/** db 探活缺省实现：`SELECT 1` 一探（抛 ⇒ 503；注入替身 = 传 `probeDb`）。 */
function probeDefault(db) {
  db.prepare("SELECT 1").get()
}

/** 更新状态缺省（未就位形——见模块头）：`{ mode, lastCheckAt, latest }`。 */
const NO_UPDATE_STATUS = Object.freeze({ mode: null, lastCheckAt: null, latest: null })

/**
 * 注册系统面两行（§2.3；G1 注册行制——分派先于静态兜底，与 `/v1` ∥ `/api` 族互不重叠）。
 * `version` 缺省 = 运行树版本（同 `ready` 行——`ops/OPS.md` §5.4(g)）。
 */
export function registerSystemRoutes(routes, {
  db,
  version = readPackageVersion(),
  uptimeS = () => Math.floor(process.uptime()),
  getUpdateStatus = () => null,
  probeDb = probeDefault,
} = {}) {
  if (!db) throw new Error("registerSystemRoutes：缺少 db（openDatabase 产物）")

  routes.add("GET", "/healthz", (req, res) => {
    let ok = true
    try {
      probeDb(db)
    } catch {
      ok = false // db 探活失败 ⇒ 503 degraded（同形——status ∥ db 两字段同拍）
    }
    res.setHeader("Cache-Control", "no-store")
    sendJson(res, ok ? 200 : 503, {
      status: ok ? "ok" : "degraded",
      version,
      uptime: uptimeS(),
      db: ok ? "ok" : "error",
    })
  })

  routes.add("GET", "/api/system", (req, res) => {
    requireSession(db, req) // 无 ∥ 过期会话 ⇒ 401 `unauthorized`（同族口径）
    sendJson(res, 200, { version, update: getUpdateStatus() ?? NO_UPDATE_STATUS })
  })
}
