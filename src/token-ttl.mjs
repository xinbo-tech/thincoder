/**
 * token-ttl.mjs — design-token TTL 语义 + 槽位清理（R16——2026-09-06）。
 *
 * 共享目标（D-R16b）：过期判定语义在此定义一次，validateDesignToken
 * （advisor-async.mjs）、恢复过滤（session.mjs applySession）、开模式清理
 * （agent-tools/eng.mjs + tui/cmd-eng.mjs ON 路径）、spawn 门禁过期拒删槽
 * （subagent-spawn.mjs）共引——本模块零依赖，session ← advisor 的导入方向
 * 经此无环。
 *
 * token 格式 = `uuid:expiresAt`（无签名流程凭证——HMAC 防伪层已删——见
 * ENGINEERING-MODE.md 2026-09-06 段）。过期判定只对**格式合法**的 token 判
 * 过期：格式/畸形串不在此清理（恢复时读回由门禁格式拒、门禁拒时也不删槽——
 * 防误删有效槽——F-R16b ①③）。
 */

const DESIGN_TOKEN_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** 格式校验 + 数值过期时刻：格式合法 → expiresAt 数值；格式/畸形 → null
 *  （与 validateDesignToken 的 fail-closed 判定同源——单一权威）。 */
export function tokenExpiryMs(token) {
  if (!token || typeof token !== "string") return null
  const parts = token.split(":")
  if (parts.length !== 2) return null
  const [uuid, expiresAt] = parts
  if (!DESIGN_TOKEN_UUID_RE.test(uuid)) return null
  if (!/^\d+$/.test(expiresAt)) return null
  const expiry = parseInt(expiresAt, 10)
  if (isNaN(expiry)) return null
  return expiry
}

/** 过期判定——仅格式合法的 token 可判过期（畸形 → false，由门禁格式拒）。 */
export function tokenExpired(token, now = Date.now()) {
  const expiry = tokenExpiryMs(token)
  return expiry !== null && now > expiry
}

/** 删一个 designId 槽 + 单槽镜像同步（R16 D-R16c ③——spawn 门禁过期拒的清理面）。
 *  条件由调用方保证（槽在位且槽值 === token 且已过期）：Map 无该 id / 值不符 →
 *  不删（防误删有效槽）；designId 缺省（单槽省略 designId 路径）→ 按 token 扫删。
 *  镜像恰为该 token → 同步清（null——过期凭证不得继续开父侧门）。返回是否删了槽。 */
export function removeDesignTokenSlot(agent, designId, token) {
  const map = agent?._engDesignTokens
  let slotRemoved = false
  if (map instanceof Map && token) {
    if (designId) {
      if (map.get(designId) === token) {
        map.delete(designId)
        slotRemoved = true
      }
    } else {
      for (const [id, t] of map) {
        if (t === token) {
          map.delete(id)
          slotRemoved = true
          break
        }
      }
    }
  }
  if (token && agent?._engDesignToken === token) agent._engDesignToken = null
  return slotRemoved
}

/** 遍历删过期槽（R16 F-R16b ②——eng enter / cmd-eng ON 真转换路径）：Map 只留
 *  有效 token；镜像同步规则同 removeDesignTokenSlot。无 Map 的 legacy 会话（旧文件
 *  无 engDesignTokens 字段——单值镜像）若镜像已过期同样清。返回清理个数。 */
export function purgeExpiredDesignTokens(agent) {
  const map = agent?._engDesignTokens
  let cleared = 0
  if (map instanceof Map) {
    for (const [id, t] of [...map]) {
      if (typeof t === "string" && tokenExpired(t)) {
        map.delete(id)
        if (agent._engDesignToken === t) agent._engDesignToken = null
        cleared++
      }
    }
    return cleared
  }
  const mirror = agent?._engDesignToken
  if (typeof mirror === "string" && tokenExpired(mirror)) {
    agent._engDesignToken = null
    cleared++
  }
  return cleared
}

// ── 会话槽序列化/恢复面（session.mjs saveSession/applySession 的 token 字段——
//    2026-09-06 R16：slot 持久化 = 跨重启/跨模式恢复的有意载体） ──

/** saveSession 数据面：token 两字段的序列化形态。多槽 Map → {designId: token}
 *  （JSON-safe）；空/缺 Map → undefined → JSON.stringify 丢 key——清过的会话写
 *  NO field，不从上次 save 复活槽。 */
export function engTokenSlotFields(agent) {
  return {
    engDesignToken: agent._engDesignToken ?? null,
    engDesignTokens: agent._engDesignTokens instanceof Map && agent._engDesignTokens.size > 0
      ? Object.fromEntries(agent._engDesignTokens)
      : undefined,
  }
}

/** applySession 恢复面（F-R16b ①——恢复 TTL 过滤）：EXPIRED token 不读回（丢弃——
 *  下次 save 自然清字段，清盘闭环）；格式/畸形串读回（门禁拒——不主动删——恢复不
 *  得销毁它无法判定的槽数据）。legacy 无字段槽 → 恢复零 Map（fresh state）。 */
export function restoreEngTokens(agent, data) {
  const storedMirror = data.engDesignToken
  agent._engDesignToken = typeof storedMirror === "string" && tokenExpired(storedMirror)
    ? null
    : (storedMirror ?? null)
  if (data.engDesignTokens && typeof data.engDesignTokens === "object" && !Array.isArray(data.engDesignTokens)) {
    const valid = Object.entries(data.engDesignTokens).filter(([, t]) => !(typeof t === "string" && tokenExpired(t)))
    agent._engDesignTokens = new Map(valid)
  } else {
    delete agent._engDesignTokens
  }
}
