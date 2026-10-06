/**
 * ratelimit.mjs — 模型限流（per-model RPM/TPM——KD-SV-35；gateway/API.md §2.1 ∥ §6）。
 *
 * 检查点 = 派发命中后、转发前；窗口 = 进程内存 60s 定窗（重启归零——软状态）；
 * 通过 ⇒ 计次 +1（`check`）；token 于用量到达计入（`record`——失败/断开计次不计 token）；
 * 超限 ⇒ 429 `rate_limited` + `Retry-After`（秒——距窗尾；调用方 = `routes.mjs` 装配）。
 * 纯函数形态 + 时钟可注入（`now`）⇒ 可直测（「注时钟滚窗 ⇒ 放行」腿）；嵌入面零涉。
 */

/** 定窗长（60s——gateway/API.md §2.1）。 */
export const RATE_LIMIT_WINDOW_MS = 60000

/** 定窗序号（`ts` 所属窗——滚窗判据）。 */
export function windowIndexOf(ts, windowMs = RATE_LIMIT_WINDOW_MS) {
  return Math.floor(ts / windowMs)
}

/** `Retry-After` 秒（距窗尾——≥1：不足 1 秒也报 1；沿 `too_many_attempts` 先例）。 */
export function retryAfterSeconds(ts, index, windowMs = RATE_LIMIT_WINDOW_MS) {
  const windowEnd = (index + 1) * windowMs
  return Math.max(1, Math.ceil((windowEnd - ts) / 1000))
}

/** 建限流器（进程内存单实例——`routes.mjs` 注册期建；测试面可注 `windowMs`/`now`）。 */
export function createRateLimiter({ windowMs = RATE_LIMIT_WINDOW_MS, now = Date.now } = {}) {
  const buckets = new Map() // `provider/model` → `{ index, count, tokens }`（滚窗即重置——定窗非滑窗；不主动回收——键 = 曾见 provider/model 对，量级 = 模型数，有界）

  /** 取当前窗桶（窗号不符 ⇒ 重置——`buckets` 键 = `provider/model` 复合键，provider 名无 `/` 不歧义）。 */
  const bucketFor = (key, index) => {
    let bucket = buckets.get(key)
    if (!bucket || bucket.index !== index) {
      bucket = { index, count: 0, tokens: 0 }
      buckets.set(key, bucket)
    }
    return bucket
  }

  return {
    /**
     * 准入（检查点 = 派发命中后、转发前）：`rpm`/`tpm` 空（null/缺省）⇒ 不限
     * （`{ limited: false, tracked: false }`——零状态零计次）；超限 ⇒ `{ limited: true, dimension, limit, retryAfterS }`
     * （拒绝不计次）；通过 ⇒ 计次 +1 并返回 `{ limited: false, tracked: true }`（tracked ⇒ 用量到达时 `record`）。
     */
    check(providerName, model, { rpm = null, tpm = null } = {}) {
      const rpmLimit = Number.isInteger(rpm) && rpm > 0 ? rpm : null
      const tpmLimit = Number.isInteger(tpm) && tpm > 0 ? tpm : null
      if (rpmLimit === null && tpmLimit === null) return { limited: false, tracked: false }
      const ts = now()
      const index = windowIndexOf(ts, windowMs)
      const bucket = bucketFor(`${providerName}/${model}`, index)
      const verdict = (dimension, limit) => ({ limited: true, dimension, limit, retryAfterS: retryAfterSeconds(ts, index, windowMs) })
      if (rpmLimit !== null && bucket.count >= rpmLimit) return verdict("rpm", rpmLimit) // 每分钟请求数超限
      if (tpmLimit !== null && bucket.tokens >= tpmLimit) return verdict("tpm", tpmLimit) // 每分钟 token 数超限
      bucket.count += 1
      return { limited: false, tracked: true }
    },
    /** 用量到达计入（token 累计到「到达时刻」所在窗——滚窗即新桶）；无效值 ⇒ no-op（失败/断开不计 token）。 */
    record(providerName, model, tokens) {
      if (!Number.isFinite(tokens) || tokens <= 0) return
      const index = windowIndexOf(now(), windowMs)
      bucketFor(`${providerName}/${model}`, index).tokens += tokens
    },
  }
}
