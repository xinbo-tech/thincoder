/**
 * session-slot-write.mjs — 端壳：会话槽「元数据开关」写面 + 端侧 token 台账读写面（VS Code 端）。
 *
 * W11（CORE-UNIFICATION · VSC 接线 · 2026-09-15）：开关写面**单源 = 核**
 * `@thincoder/core/session-slot-write.mjs`——`newSlotData` / `setSlotAutoApprove` /
 * `setSlotPlanMode` / `setSlotEngineering` / `setSlotAdvisorGuard` / `mergeEngTokensForSave`
 * 全部转口（`engTokensMergeForSave` = 端侧既有消费名 → 核 `mergeEngTokensForSave`，D2/D6 合并
 * 规则单源）。写盘单点 = 核 `saveSlotData`（读-改-写 + F2 轮转判据 + manifest 摘要）。
 * 本档保留 = 端侧**槽型（cwd, slot）** token 台账三式：`setSlotEngDesignTokens` /
 * `readSlotEngDesignTokens` / `clearSlotEngDesignToken`——核 token 面（`@thincoder/core/token-ttl.mjs`）
 * 为 **agent 型**（`persistEngTokens(agent)` / `readEngTokensFromSlot(agent)` / `reconcileEngTokensFromSlot(agent)`），
 * `(cwd, slot)` 型无核对位件（见 §5 未决：核内补位候选）。
 */
import { existsSync } from "node:fs"
import { loadSlotFile } from "@thincoder/core/session.mjs"
import { saveSlotData, newSlotData } from "@thincoder/core/session-slot-write.mjs"
import { getSessionId, loadManifest, slotPath } from "./session-slots.mjs"

// 单源转口（核面——调用方 import 路径与名面不变）
export {
  newSlotData, setSlotAutoApprove, setSlotPlanMode, setSlotEngineering, setSlotAdvisorGuard,
} from "@thincoder/core/session-slot-write.mjs"
export { mergeEngTokensForSave as engTokensMergeForSave } from "@thincoder/core/session-slot-write.mjs"

/**
 * 读槽供开关 / token 写。返回已解析槽数据；当槽**尚无数据文件**但本进程已认领该槽
 * （认领先行、首保存落盘前）→ 返回全新默认记录（核 `loadSlotForWrite` 同语义——核内私有件、
 * 未导出）。其余失败（version>2 / 异 cwd / 损坏 / 未知槽）返回 null——保持「未识别的槽 ⇒
 * 写返回 false」的契约。
 */
function loadSlotForWrite(cwd, slot) {
  const data = loadSlotFile(cwd, slot)
  if (data || !slot) return data
  const m = loadManifest(cwd)
  if (m.slotSessions?.[slot] !== getSessionId()) return null
  if (existsSync(slotPath(cwd, slot))) return null // 文件已在但不可读 → 不覆盖
  return newSlotData(cwd)
}

/** DESIGN-TOKEN-SETTLEMENT（2026-09-08）：slot 文件的 engDesignTokens 多槽表 = 权威结算台账。
 *  - 写侧唯一权威写点：settle（advisor-async D1）——同步直写（去 fire-and-forget）——与 agentState
 *    往返同构（{designId: token} JSON 形态）。空/无参写 null（清键）。
 *  - 单值镜像 `engDesignToken`（持久化槽字段）已随 D5 退役——settle/agentState/consume/TTL 一律
 *    不再写镜像字段（AC3——运行时零镜像写）；setup 水合处保留唯一一次性迁移读。
 *  - 槽清理只经三触发（D2 评审 #3）：consume-design 显式清（clearSlotEngDesignToken）/
 *    /new 分配全新空槽（天然无账本）/TTL 过期清（setup restore 过滤后回写）。空态 agentState
 *    保存（saveLines）不触发清理（只防误清 settle 刚落盘的 token）。 */
export function setSlotEngDesignTokens(cwd, slot, tokensObj) {
  const data = loadSlotForWrite(cwd, slot)
  if (!data) return false
  const t = tokensObj && typeof tokensObj === "object" && Object.keys(tokensObj).length > 0 ? tokensObj : null
  if (t === null) delete data.engDesignTokens
  else data.engDesignTokens = t
  saveSlotData(cwd, slot, data)
  return true
}

/** 读槽权威结算台账（engDesignTokens 多槽表）。返回 { engDesignTokens? }（未过期判定由读侧
 *  setup / spawn-gate / write-gate 各自负责——I/O 层不过滤）或 null（槽不可读）。
 *  单值镜像 engDesignToken 字段已退役——此处不读（AC3——运行时零镜像读；唯一镜像迁移读在
 *  setup 水合处经 engState，不走本读取面）。D4/D5 门禁与 spawn-gate 的 miss 回读共用。 */
export function readSlotEngDesignTokens(cwd, slot) {
  try {
    const data = loadSlotFile(cwd, slot)
    if (!data) return null
    const out = {}
    if (data.engDesignTokens !== undefined) out.engDesignTokens = data.engDesignTokens
    return out
  } catch {
    return null
  }
}

/** D2 槽清理触发① consume-design 后清（2026-09-08）：从权威台账移除一个 designId 槽（或无
 *  designId 时清空整账本——单设计会话链终核销）。只动 engDesignTokens 字段——镜像字段已退役
 *  不清（D5）。返回是否移除（未命中/已清 = false——consume 幂等 no-op）。落盘 = 核 `saveSlotData`。 */
export function clearSlotEngDesignToken(cwd, slot, designId) {
  const data = loadSlotForWrite(cwd, slot)
  if (!data) return false
  const obj = data.engDesignTokens
  if (!obj || typeof obj !== "object") return false
  if (designId) {
    if (!(designId in obj)) return false // 未命中/已清 = 幂等 no-op
    delete obj[designId]
    if (Object.keys(obj).length === 0) delete data.engDesignTokens
  } else {
    delete data.engDesignTokens // 单设计会话整账本清
  }
  saveSlotData(cwd, slot, data)
  return true
}
