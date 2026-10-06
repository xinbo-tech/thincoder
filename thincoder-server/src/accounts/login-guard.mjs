/**
 * login-guard.mjs — 登录防爆破（accounts/ACCOUNTS.md §2 ∥ KD-SV-21）：双维失败计数（用户名 ∥ IP） ∥
 * 锁定/解锁 ∥ 清计四口 ∥ IP 口径（`trustProxy`）。
 *
 * 进程内存（零表零写——重启清零，在案口径）；窗 = 锁 = 15 分钟（固定窗——锁期内重试不延长）；
 * 阈值 = 用户名 5 ∥ IP 20（常量导出——批内件用）；锁触发 ⇒ `login_throttled` 一行（密钥面零涉）
 * + `onLock` 回调（审计 `login_locked` 写入——装配接线 = 入口建守卫处，ACCOUNTS §2.1）。
 * 桶过期惰性清理（读写路径顺扫——无独立清扫面）；时钟可注入（批内件替身——缺省 `Date.now`）。
 */
export const USERNAME_THRESHOLD = 5 // 用户名维阈值（连续失败 ≥5 ⇒ 锁）
export const IP_THRESHOLD = 20 // IP 维阈值（失败 ≥20 ⇒ 锁；反代聚合面）
export const WINDOW_MS = 15 * 60 * 1000 // 失败计数窗（15 分钟）
export const LOCK_MS = 15 * 60 * 1000 // 锁定期（15 分钟——固定窗）

/** 客户端 IP 口径（ACCOUNTS §2）：缺省 = 连接对端地址；`trustProxy: true` ⇒ 读 `X-Real-IP` 头
 *  （前提 = 端口仅反代可达——伪造面归部署侧，`ops/OPS.md` §5.6）；头缺位 ⇒ 回退对端地址。 */
export function clientIp(req, { trustProxy = false } = {}) {
  if (trustProxy) {
    const header = req?.headers?.["x-real-ip"]
    const value = Array.isArray(header) ? header[0] : header
    if (typeof value === "string" && value.trim() !== "") return value.trim()
  }
  return req?.socket?.remoteAddress ?? ""
}

/**
 * 建登录守卫（口面 = `check` ∥ `recordFailure` ∥ `recordSuccess` ∥ `clearUsername`——ACCOUNTS §2）。
 * 桶形 = `{ count, windowStart, lockedUntil }`（每维一映射：用户名 ∥ IP）；`log` 缺省 null（批内件直测不落日志）。
 * `onLock(info)` 缺省 null：置锁处调用一次（同 `login_throttled` 日志点），`info = { username, ip, dimension, retryAfterS }`
 *  ——审计行写入经此回调（`login_locked`；装配接线 = 入口建守卫处——§2.1）。
 * 注：覆盖 `windowMs`/`lockMs` 请成对同取（窗 = 锁——单独缩小 `lockMs` 会使锁尽后计数仍留、单次新失败即再锁）。
 */
export function createLoginGuard({
  now = Date.now,
  log = null,
  onLock = null,
  usernameThreshold = USERNAME_THRESHOLD,
  ipThreshold = IP_THRESHOLD,
  windowMs = WINDOW_MS,
  lockMs = LOCK_MS,
} = {}) {
  const usernameBuckets = new Map()
  const ipBuckets = new Map()

  /** 过期判据（可删）：锁已过 且 计数窗已滑出（窗 = 锁 ⇒ 锁尽即过期——解锁与清计同拍）。 */
  const expired = (bucket, at) => bucket.lockedUntil <= at && at - bucket.windowStart >= windowMs

  /** 惰性清理：读写路径顺扫（过期桶即删——无独立清扫面）。 */
  function sweep(at) {
    for (const map of [usernameBuckets, ipBuckets]) {
      for (const [key, bucket] of map) if (expired(bucket, at)) map.delete(key)
    }
  }

  /** 取桶（无 ⇒ 新建——windowStart 起计）；锁期内只读（不延长）；窗口滑出 ⇒ 计数重置。 */
  function touch(map, key, at) {
    let bucket = map.get(key)
    if (!bucket) {
      bucket = { count: 0, windowStart: at, lockedUntil: 0 }
      map.set(key, bucket)
      return bucket
    }
    if (bucket.lockedUntil > at) return bucket
    if (at - bucket.windowStart >= windowMs) {
      bucket.count = 0
      bucket.windowStart = at
      bucket.lockedUntil = 0
    }
    return bucket
  }

  /** 记一次失败（单维）：≥阈值 ⇒ 置锁 + `login_throttled` 日志；锁期内不重复置锁（固定窗不延长）。 */
  function fail(map, key, at, threshold, dimension, { username, ip }) {
    if (!key) return
    const bucket = touch(map, key, at)
    if (bucket.lockedUntil > at) return
    bucket.count += 1
    if (bucket.count < threshold) return
    bucket.lockedUntil = at + lockMs
    const retryAfterS = Math.ceil(lockMs / 1000)
    log?.warn("login_throttled", { username, ip, dimension, retryAfterS })
    onLock?.({ username, ip, dimension, retryAfterS }) // 审计 `login_locked`（置锁处一次——§2.1；固定窗不重复触发）
  }

  /** 锁检查（两维同文案面——只回判据，文案归路由）：任一维中锁 ⇒ `{ locked, retryAfterS, dimension }`。 */
  function check({ username = "", ip = "" } = {}) {
    const at = now()
    sweep(at)
    const hit = (key, map, dimension) => {
      const bucket = key ? map.get(key) : null
      return bucket && bucket.lockedUntil > at ? { dimension, until: bucket.lockedUntil } : null
    }
    const locked = [hit(username, usernameBuckets, "username"), hit(ip, ipBuckets, "ip")].filter(Boolean)
    if (locked.length === 0) return { locked: false, retryAfterS: 0, dimension: null }
    const worst = locked.reduce((a, b) => (b.until > a.until ? b : a)) // 两维皆锁 ⇒ 取剩余更长者（都须等到）
    return { locked: true, retryAfterS: Math.ceil((worst.until - at) / 1000), dimension: worst.dimension }
  }

  /** 记一次失败（两维同记——提交值维 + 对端 IP 维）。 */
  function recordFailure({ username = "", ip = "" } = {}) {
    const at = now()
    sweep(at)
    fail(usernameBuckets, username, at, usernameThreshold, "username", { username, ip })
    fail(ipBuckets, ip, at, ipThreshold, "ip", { username, ip })
  }

  /** 清该用户名维（登录成功 ∥ 自助改密 ∥ admin 重置——ACCOUNTS §2 清计路径）。 */
  function clearUsername(username) {
    sweep(now())
    if (username) usernameBuckets.delete(username)
  }

  /** 登录成功 ⇒ 清该用户名 + 该 IP（两维同清——ACCOUNTS §2）。 */
  function recordSuccess({ username = "", ip = "" } = {}) {
    sweep(now())
    if (username) usernameBuckets.delete(username)
    if (ip) ipBuckets.delete(ip)
  }

  return { check, recordFailure, recordSuccess, clearUsername }
}

/** 进程内缺省实例（路由装配缺省用——login ∥ 重置两面共用同一实例，免传即同拍；
 *  同一进程内多装配共享之（测试请显式注入自有实例）；日志面缺省关——入口接线传带 `log` 的实例）。 */
export const defaultLoginGuard = createLoginGuard()
