/**
 * session-flags.mjs — 模式位四写面出档（`session:flags` —— R1 输入面板移植 · 桌面宿主面；拆分评审结论 =
 * 批档 §2.7 `agent-host.mjs` 行：新增两面零入档 —— 本档持「核 `setSlot*` 四写 + 活代理重施 + `flagsOf` 回执
 * + ENG×PLAN 互斥」，主档只留 import + 装配 ∕ 暴露两行）。
 *
 * 语义（单源 = `docs/desktop/design/IPC.md` §2 该行 · 批档 §2.5）：载荷 `{ key, patch }` —— `patch` 四键闭集
 * `planMode` ∕ `autoApprove` ∕ `advisorGuard` ∕ `engineering`（逐项**严格布尔**；非对象 ∕ 空 patch ∕ 表外键
 * ∕ 非布尔值 ⇒ 整 patch 拒）。
 * 写面 = **核单点**（`@thincoder/core/session-slot-write.mjs` `setSlot*` 四写：键闭集 / 读-改-写 / 轮转 /
 * manifest 摘要皆在核）——本档只做三件端层事：
 *   ① 判据两档（`bad-key` ∕ `invalid-patch`）—— 判序沿 `setPrefs`：键 → 载荷 → cwd 源；
 *   ② **ENG×PLAN 互斥口径**（照 VSC `panel-messages-settings.mjs:169-179` 逐字）：`engineering: true` ⇒
 *      **先清 plan**（槽 `planMode=false` —— 清在工程位写槽**之前**）⇒ 槽 `{engineering:true, planMode:true}`
 *      半状态不可落（同 patch 双 ON ⇒ 工程位胜 —— 清位在工程位写点前执行）；关方向（`engineering:false`）
 *      零连带（VSC `if (on)` 同判）；
 *   ③ 活代理重施（`loadAgentSlot` —— 活动会话内存即生效；未装配 ⇒ 只写盘、不隐式装配 —— 沿 `setPrefs`）。
 * 回执（单源 = 批档 §2.5）：成功径携 `flagsOf` **活值**（沿 `approval:respond` 成功径叠加先例
 * `agent-host.mjs:323-329`）；agent 不在场 ⇒ **键缺席**（禁假造 —— 页读供面槽投影兜底）；失败径
 * `{ ok:false, reason }` + **零写**（判据档未触盘；槽写档 = 核写未发生 —— 槽值不变）。
 * 出站：成功径 ∧ 活值在场 ⇒ `ev:flags { key, flags }`（**写回执后** —— 批档 §2.5「新事件」行；渲染面归约 =
 * `sessionFlags` 切片，订阅面入册 = 批档 §2.7 `renderer/events-subscribe.mjs` 行）。
 * 重施失败口径（列明 —— 批档 §2.8 R1-3 ②）：槽写先于重施（加载即读新槽）⇒ 该抛回执 `apply-failed` **不携
 * `flags`**（活值未在内存生效 ⇒ 禁假造）；「零写」= 活代理内存面零写（槽写已发生且为权威面，不造回滚写）。
 * 端差（列明）：VSC 分四消息各写槽、槽写失败静默吞（`try {} catch {}`）；本档 = 单通道四键 patch +
 * **fail-loud 回执**（写未发生 ⇒ reason，不假成功）。
 * 零宿主依赖：deps 注入（`agents` / `projects` / `post` / `flagsOf`）⇒ 平 node 直测。
 */
import {
  setSlotAdvisorGuard, setSlotAutoApprove, setSlotEngineering, setSlotPlanMode,
} from "@thincoder/core/session-slot-write.mjs"
import { loadAgentSlot } from "./session-io.mjs"
import { slotOfKey } from "./session-slots.mjs"

/** `patch` 键闭集（四模式位 —— 与 `flagsOf` 四布尔同名；**序 = 本列**：`engineering` 居末 ⇒ 互斥清位
 *  （`engineering === true` 前的 `setSlotPlanMode(false)`）恒晚于同 patch 的 `planMode` 写点。 */
const FLAG_KEYS = Object.freeze(["planMode", "autoApprove", "advisorGuard", "engineering"])

/** 逐键写口（核单点转口 —— 端层零算法副本）。 */
const FLAG_WRITERS = Object.freeze({
  planMode: setSlotPlanMode,
  autoApprove: setSlotAutoApprove,
  advisorGuard: setSlotAdvisorGuard,
  engineering: setSlotEngineering,
})

/** 载荷形判据（纯函数、不抛）：非对象 / 数组 / 零键 / 表外键 / 非布尔值 ⇒ `invalid-patch`；通过 ⇒ `null`。
 *  值面取**严格布尔**（批档 §2.8 R1-3 ①）—— 与读面 `flagsOf` 的 `=== true` 负向锁分家：写面拒含糊值。 */
function patchFailure(patch) {
  if (!patch || typeof patch !== "object" || Array.isArray(patch)) return "invalid-patch"
  const keys = Object.keys(patch)
  if (keys.length === 0 || keys.some((key) => !FLAG_KEYS.includes(key))) return "invalid-patch"
  if (keys.some((key) => typeof patch[key] !== "boolean")) return "invalid-patch"
  return null
}

/** 造模式位写面：deps 注入（本档零全局）——返回 `{ setFlags }`。 */
export function createSessionFlags({ agents, projects, post, flagsOf } = {}) {
  /** 失败回执统一形（零 `flags` 键 —— 调用面按 `ok` 判，禁乐观写）。 */
  const fail = (reason) => ({ ok: false, reason })

  /** `setFlags(key, patch)` ⇒ `{ ok:true, flags? }` ∥ `{ ok:false, reason }`（reason 闭集 = `bad-key` ∕
   *  `invalid-patch` ∕ `slot-missing` ∕ `apply-failed`）。判序 = 键 → 载荷 → cwd 源 → 逐键写 → 重施 → 回执。 */
  function setFlags(key, patch) {
    const slot = slotOfKey(key)
    if (slot === null) return fail("bad-key")
    const bad = patchFailure(patch)
    if (bad !== null) return fail(bad) // 零写（未触盘）
    const cwd = projects?.currentCwd()
    if (typeof cwd !== "string" || cwd === "") return fail("slot-missing") // 零写（未触盘）

    for (const field of FLAG_KEYS) {
      if (!(field in patch)) continue
      // ENG×PLAN 互斥（VSC 逐字：ON 先清 plan —— 清在工程位写槽之前；同 patch 双 ON ⇒ 工程位胜）
      if (field === "engineering" && patch.engineering === true && !setSlotPlanMode(cwd, slot, false)) return fail("slot-missing")
      if (!FLAG_WRITERS[field](cwd, slot, patch[field])) return fail("slot-missing") // 核写未发生（槽不可读）
    }

    // 活代理重施（写后加载 —— 活动会话内存即生效；未装配 ⇒ 只写盘。矛盾态 ∕ 重施抛 ⇒ 回执零 `flags`）
    const agent = agents?.get(String(key))
    if (agent) {
      try {
        if (!loadAgentSlot(agent, cwd, slot)) return fail("slot-missing") // 写后不可读 = 矛盾态（不假成功）
      } catch (error) {
        console.error(`[session-flags] re-apply failed for session ${slot}: ${error?.message ?? error}`)
        return fail("apply-failed")
      }
    }

    const flags = typeof flagsOf === "function" ? flagsOf(String(key)) : null
    if (flags === null) return { ok: true } // 活值不在场 ⇒ 键缺席（禁假造 —— 页读供面槽投影兜底）
    post("ev:flags", { key: String(key), flags }) // 写回执后出站（批档 §2.5 新事件行）
    return { ok: true, flags }
  }

  return { setFlags }
}
