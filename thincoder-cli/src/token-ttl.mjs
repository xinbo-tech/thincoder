/**
 * token-ttl.mjs — design-token TTL 语义 + 槽位清理 + 会话槽权威台账 I/O（R16——2026-09-06；
 * DESIGN-TOKEN-SETTLEMENT D1-D3——2026-09-08）。
 *
 * 共享目标（D-R16b）：过期判定语义在此定义一次，validateDesignToken
 * （agent-tools/design-token.mjs）、恢复过滤（session.mjs applySession）、开模式清理
 * （agent-tools/eng.mjs + tui/cmd-eng.mjs ON 路径）、spawn 门禁过期拒删槽
 * （subagent-spawn.mjs）共引。
 *
 * token 格式 = `uuid:expiresAt`（无签名流程凭证——HMAC 防伪层已删——见
 * ENGINEERING-MODE.md 2026-09-06 段）。过期判定只对**格式合法**的 token 判
 * 过期：格式/畸形串不在此清理（恢复时读回由门禁格式拒、门禁拒时也不删槽——
 * 防误删有效槽——F-R16b ①③）。
 *
 * DESIGN-TOKEN-SETTLEMENT（2026-09-08）：
 * - **D1**：persistEngTokens = settle 当场落盘的可复用函数（engTokenSlotFields 序列化 +
 *   session 安全写/轮转——guardForeignSlotFile 与 saveSession 共用同一份守卫）。
 * - **D2/D3**：readEngTokensFromSlot / reconcileEngTokensFromSlot = 门禁 miss 回读权威
 *   槽（spawn 门 D2 与 dispatch 写门 D3 同源 reconcile）。
 * - **D3**：**单值镜像 `_engDesignToken` 退役**——AC3 零写 + 仅一次性迁移读。本模块
 *   不再写镜像（engTokenSlotFields 只产多槽表）；restoreEngTokens 是唯一迁移读点（旧
 *   slot 残留 engDesignToken → 迁入 Map，此后不写不读镜像）。
 *
 * 依赖方向：本模块只 import 底层槽 I/O（session-slots.mjs 原语 + session-guard.mjs 轮转
 * 守卫）——session.mjs 同时 import 本模块（engTokenSlotFields/restoreEngTokens），形成
 * 静态环，与既有的 session ↔ session-slots 环同构（函数声明实例化期已初始化、只函数体
 * 内运行时使用——环安全）。
 */

import { existsSync, readFileSync, statSync } from "node:fs"
import {
  slotPath, writeSessionFile, activeSlot, loadManifest, saveManifest, slotDigest,
  writeEndMarker,
} from "@thincoder/core/session-slots.mjs"
// F2 轮转守卫自 2026-09-08 迁至 session-guard.mjs（session-slots 再越 500 行硬限拆分）
import { guardForeignSlotFile } from "@thincoder/core/session-guard.mjs"

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

/** 删一个 designId 槽（R16 D-R16c ③——spawn 门禁过期拒的清理面）。
 *  条件由调用方保证（槽在位且槽值 === token 且已过期）：Map 无该 id / 值不符 →
 *  不删（防误删有效槽）；designId 缺省（单槽省略 designId 路径）→ 按 token 扫删。
 *  DESIGN-TOKEN-SETTLEMENT D3（2026-09-08）：单值镜像已退役——不再同步清镜像。
 *  返回是否删了槽。 */
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
  return slotRemoved
}

/** 遍历删过期槽（R16 F-R16b ②——eng enter / cmd-eng ON 真转换路径）：Map 只留
 *  有效 token。DESIGN-TOKEN-SETTLEMENT D3（2026-09-08）：单值镜像已退役——无
 *  legacy 镜像分支。返回清理个数。 */
export function purgeExpiredDesignTokens(agent) {
  const map = agent?._engDesignTokens
  let cleared = 0
  if (map instanceof Map) {
    for (const [id, t] of [...map]) {
      if (typeof t === "string" && tokenExpired(t)) {
        map.delete(id)
        cleared++
      }
    }
  }
  return cleared
}

// ── 会话槽序列化/恢复面（session.mjs saveSession/applySession 的 token 字段——
//    2026-09-06 R16：slot 持久化 = 跨重启/跨模式恢复的有意载体） ──

/** saveSession 数据面：token 的序列化形态。多槽 Map → {designId: token}
 *  （JSON-safe）；空/缺 Map → undefined → JSON.stringify 丢 key——清过的会话写
 *  NO field，不从上次 save 复活槽。
 *  DESIGN-TOKEN-SETTLEMENT D3（2026-09-08）：单值镜像 `engDesignToken` 退役——
 *  saveSession 不再写镜像字段（AC3 零写）；只产多槽表 engDesignTokens。 */
export function engTokenSlotFields(agent) {
  return {
    engDesignTokens: agent._engDesignTokens instanceof Map && agent._engDesignTokens.size > 0
      ? Object.fromEntries(agent._engDesignTokens)
      : undefined,
  }
}

/** applySession 恢复面（F-R16b ①——恢复 TTL 过滤）：EXPIRED token 不读回（丢弃——
 *  下次 save 自然清字段，清盘闭环）；格式/畸形串读回（门禁拒——不主动删——恢复不
 *  得销毁它无法判定的槽数据）。
 *  DESIGN-TOKEN-SETTLEMENT D3（2026-09-08）：单值镜像 `_engDesignToken` 退役——
 *  本函数是**唯一镜像迁移读点**（AC3）：旧 slot 文件可能残留 engDesignToken 单值
 *  （D3 前 saveSession 写的 legacy 字段）。当多槽表缺失/为空（Map 空）且残留镜像为
 *  **格式合法且未过期** token 时 → 一次性迁入 Map（标 legacy——以 token 自身 uuid
 *  为 designId——确定性、可复现、不依赖曾回显的原 designId）。此后该字段随下次
 *  saveSession/persistEngTokens（不再写镜像）自然从槽文件消失，本函数不再读到
 *  残留——一次性语义。镜像若已过期/畸形 → 不迁移（drop——与 Map 过期项同处理，
 *  清盘闭环）。永不写 agent._engDesignToken。 */
export function restoreEngTokens(agent, data) {
  const map = new Map()
  if (data.engDesignTokens && typeof data.engDesignTokens === "object" && !Array.isArray(data.engDesignTokens)) {
    for (const [id, t] of Object.entries(data.engDesignTokens)) {
      if (!(typeof t === "string" && tokenExpired(t))) map.set(id, t)
    }
  }
  // legacy 单值镜像一次性迁移读（唯一镜像读点——AC3）：Map 空且残留为格式合法未过期 token
  if (map.size === 0) {
    const storedMirror = data.engDesignToken
    if (typeof storedMirror === "string" && tokenExpiryMs(storedMirror) !== null && !tokenExpired(storedMirror)) {
      map.set(storedMirror.split(":")[0], storedMirror)
    }
  }
  if (map.size > 0) agent._engDesignTokens = map
  else delete agent._engDesignTokens
}

// ── 会话槽权威台账 I/O（DESIGN-TOKEN-SETTLEMENT D1/D2/D3——槽文件 = 权威结算台账） ──

/** 当前会话槽号（读侧——无认领副作用）：粘性 _slot 优先；未钉槽时读 manifest active
 *  （loadManifest 只读——不在门禁路径触发认领写）。无槽 → null。 */
function currentSlotNoReadOnly(agent) {
  const slot = agent?._slot
  if (Number.isInteger(slot)) return slot
  const active = loadManifest(agent?.cwd)?.active
  return Number.isInteger(active) ? active : null
}

/** 读当前会话槽文件的权威台账（engDesignTokens 多槽表——不做 TTL 过滤，判定由调用方）。
 *  门禁侧轻读：JSON.parse 只读不改文件（.tmp 回退/改名等 loadSlotFile 副作用不引入）。
 *  单值镜像 engDesignToken 字段已退役——此处不读（AC3——运行时零镜像读；唯一镜像
 *  迁移读在 restoreEngTokens）。返回 {designId: token} 对象或 null（无槽/无文件/不可读）。 */
export function readEngTokensFromSlot(agent) {
  try {
    const slot = currentSlotNoReadOnly(agent)
    if (slot == null) return null
    const p = slotPath(agent.cwd, slot)
    if (!existsSync(p)) return null
    const data = JSON.parse(readFileSync(p, "utf8"))
    return (data && typeof data === "object" && !Array.isArray(data.engDesignTokens)
      && data.engDesignTokens && typeof data.engDesignTokens === "object")
      ? data.engDesignTokens
      : null
  } catch { return null }
}

/** 内存 miss 时从权威槽 reconcile（D2 spawn 门 + D3 dispatch 写门同源）：把槽文件中
 *  **未过期**项并进内存 Map（TTL 过滤保留——expired 不并入，fail-closed；格式/畸形串
 *  与 restoreEngTokens 同语义读回——门禁格式拒）；槽无活项 → 内存原样。返回判定用 Map。 */
export function reconcileEngTokensFromSlot(agent) {
  const slots = agent?._engDesignTokens
  const obj = readEngTokensFromSlot(agent)
  if (!obj) return slots instanceof Map ? slots : new Map()
  const live = new Map()
  for (const [id, t] of Object.entries(obj)) {
    if (typeof t === "string" && !tokenExpired(t)) live.set(id, t)
  }
  if (live.size === 0) return slots instanceof Map ? slots : new Map()
  const merged = slots instanceof Map ? slots : new Map()
  for (const [id, t] of live) merged.set(id, t)
  agent._engDesignTokens = merged
  return merged
}

/** 是否存在任一活槽（DESIGN-TOKEN-SETTLEMENT D3——dispatch 写门判定"任一活槽存在"；
 *  AC4）。先问内存 Map（当前进程活缓存）；miss 回读权威槽文件 reconcile（与 spawn 门
 *  D2 同源）。判定 fail-closed：格式合法且未过期才算活槽（畸形/过期不构成活槽——不
 *  授权产品代码写）。 */
export function anyLiveDesignSlot(agent) {
  const live = (m) => {
    for (const t of m.values()) {
      if (typeof t === "string" && tokenExpiryMs(t) !== null && !tokenExpired(t)) return true
    }
    return false
  }
  const m = agent?._engDesignTokens
  if (m instanceof Map && live(m)) return true
  const rec = reconcileEngTokensFromSlot(agent)
  return rec instanceof Map && live(rec)
}

/**
 * D1（DESIGN-TOKEN-SETTLEMENT，2026-09-08）：settle 当场同步落盘——把当前内存多槽
 * Map 写入会话槽文件的权威台账，消除 settle→回合尾 saveSession 间的重启丢 token 窗口。
 * 复用 engTokenSlotFields 序列化 + session 安全写/轮转（guardForeignSlotFile =
 * saveSession 同一份守卫——勿裸写文件）。槽文件缺失（本会话首次落盘）→ 写最小全新
 * 记录（字段形状同 saveSession——loadSlotFile 可读）；既有文件 → 读-改-写（只动 token
 * 字段，历史等其他字段原样保留）。写失败（writeSessionFile/parse 抛错）→ 抛出/返回
 * false——调用方（settle）失败即 settle 失败（token 不注册、可重评——评审 #1 语义）。
 */
export function persistEngTokens(agent) {
  const claimedNow = agent._slot == null
  const slot = agent._slot ??= activeSlot(agent.cwd)
  if (claimedNow) writeEndMarker(agent.cwd, slot)
  const p = slotPath(agent.cwd, slot)
  guardForeignSlotFile(agent, p, slot)
  let data = null
  if (existsSync(p)) {
    data = JSON.parse(readFileSync(p, "utf8"))
  } else {
    // 全新槽（claim 先行、首保存落盘前）——最小记录（VSC newSlotData 同构——字段形状
    // 同 saveSession 数据面，loadSlotFile 校验可读；历史留空——本会话首保存尚未发生，
    // 此前历史本就未落盘，token 台账先行落盘不制造任何额外损失）。
    data = {
      version: 2,
      cwd: agent.cwd,
      title: agent.title ?? "",
      activeProvider: agent.activeProvider ?? agent.provider?.name,
      // MODEL-MERGE-SESSION 恒非空形态：随 saveSession 同款回落链（无渠道仍容忍 null）
      activeModel: agent.activeModel ?? agent.provider?.model ?? null,
      history: [],
      contextHistory: [],
      tasks: agent.tasks ?? [],
      planMode: agent.planMode ?? false,
      autoApprove: agent.autoApprove ?? false,
      engineering: agent.config?.agent?.engineering ?? false,
      goal: agent.goal ?? null,
      advisor: agent.config?.advisor ?? null,
      pendingReminders: agent._pendingReminders ?? [],
      sessionStart: agent._sessionStart ?? null,
    }
  }
  const fields = engTokenSlotFields(agent)
  if (fields.engDesignTokens !== undefined) data.engDesignTokens = fields.engDesignTokens
  else delete data.engDesignTokens
  // 单值镜像字段永不复写（D3 零写）——残留 engDesignToken 随本次写一并清（更快退役，
  // 杜绝 stale 镜像 + 空 Map 组合在下次 restore 二次迁移复活死 token 的边角）。
  delete data.engDesignToken
  data.updatedAt = Date.now()
  writeSessionFile(p, data)
  // 记录我们刚写的 mtime——下次保存/守卫跳过重复解析（saveSession 同款）
  try { agent._slotMtime = statSync(p).mtimeMs } catch {}
  // Update slot metadata in manifest（saveSession 同款尾——非致命：数据已安全，
  // metadata 下次 listSlots 惰性恢复）
  try {
    const m = loadManifest(agent.cwd)
    m.slots[slot] = slotDigest(data)
    saveManifest(agent.cwd, m)
  } catch (e) {
    console.error(`[session] manifest metadata update failed for slot ${slot}: ${e.message}`)
  }
  return true
}
