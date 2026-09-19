/**
 * eng tool: enter/exit engineering mode.
 * In engineering mode the agent follows design-before-code methodology.
 * Toggled here at session level (in-memory flag; the session slot is the sole authority —
 * saveSession round-trips it at turn end; /eng writes the slot directly). The old ctx
 * state-persist hook was removed 2026-09-08 (ENG-SESSION-PROVIDER-CLEANUP D1.2): no
 * provider existed and its legacy payload keys were never read by applySession.
 * R16 (2026-09-06): design tokens are session-level flow credentials — mode toggles
 * do NOT clear them (ON→OFF keeps, OFF→ON does not require a fresh review); only TTL
 * expiry cleans tokens, at three points: restore filtering (session.mjs applySession) /
 * eng enter expired cleanup (below + cmd-eng ON) / spawn-gate expired rejection
 * (subagent-spawn.mjs). See docs/design/ENG-TOKEN-BINDING-TUNING.md §5/§5.1 (F-R16).
 * #41（2026-09-18）：enter 分支改「先判后翻」——判据 = 入口决策树单源
 * `resolveEngineeringManifest`（docs/core/design/MANIFEST.md §2.8 F2 / KD-M1-20/21）；
 * 拒翻 ⇒ 返回原因串 + **零副作用**（模式保持 OFF）。OFF 方向与幂等 enter 零改。
 */
import { ENG_ON_REMINDER, ENG_OFF_REMINDER } from "../agent.mjs"
import { purgeExpiredDesignTokens } from "../token-ttl.mjs"
import { resolveEngineeringManifest } from "../manifest.mjs"

// ─── 持久化镜像 / 面板提示注入缝（#91——「写盘镜像 / 面板提示按端注入」，形态参 §2.13.5 注入缝）──
/**
 * 工程模式切换通知注入位（**缺省不覆盖** = no-op——CLI 语义（只进会话），零行为变；端装配层
 * 可覆盖为本端镜像写盘 / 面板提示）。核内零端名分支（契约 5——本档只认 `onToggle` 函数名）。
 * 契约：`onToggle(enabled, ctx) → string | null | undefined | Promise<同>`——非空字符串 =
 * 追加到结果文案尾（如镜像写入碰撞提示）；其余值 = 无提示。调用时机 = 状态翻转后（观察新态）。
 */
let injectedMirror = null
export function configureEngMirror(impl) {
  injectedMirror = impl && typeof impl.onToggle === "function" ? impl : null
}
/** 撤销注入（测试与端装配生命周期用——缺省态 = 无镜像 / 无面板提示）。 */
export function resetEngMirror() { injectedMirror = null }

/** 镜像通知串（缺省空串；仅非空字符串追加）。 */
async function mirrorNotice(enabled, ctx) {
  const out = await injectedMirror?.onToggle(enabled, ctx)
  return typeof out === "string" && out.length > 0 ? ` ${out}` : ""
}

export const engTool = {
  name: "eng",
  description:
    "Enter or exit engineering mode. In engineering mode, follow design-before-code: write a design document, run advisor design review, get user approval, then implement via eng-coder subagents. " +
    "Returns the mode state — 'Engineering mode activated/exited' (an already-active state is acknowledged).",
  parameters: {
    type: "object",
    properties: {
      action: { type: "string", enum: ["enter", "exit"], description: "Enter or exit engineering mode" },
    },
    required: ["action"],
  },
  readonly: true,
  async execute(args, ctx) {
    ctx.agent.config.agent ??= {}
    if (args.action === "exit") {
      ctx.agent.config.agent.engineering = false
      // R16 (F-R16a): OFF 不清 token——有效 token 跨模式存活（设计评审过的产物不因
      // 开关重复烧）。过期清理跑在另外三处（恢复过滤 / 开模式 / spawn 门禁拒）。
      ctx.agent._advisorRound = 0          // reset convergence budget
      ctx.agent._advisorRuns = new Map()   // §11.2 D-24b: per-review instances die with the mode (fresh cycles)
      ctx.agent._touchedFiles = []         // clear mutation tracking
      ctx.agent._lastEngState = false
      ctx.agent._pendingReminders = ctx.agent._pendingReminders ?? []
      ctx.agent._pendingReminders.push(ENG_OFF_REMINDER)
      return "Engineering mode exited. Standard discipline now applies. You may edit files directly." + await mirrorNotice(false, ctx)
    }
    if (args.action === "enter") {
      // Idempotent enter (v2 2026-08-25): already in engineering mode → pure no-op
      // (cleanup only runs on a real off→on transition — T-R16c precondition: first
      // exit/OFF, then enter; an already-on enter must not touch tokens at all).
      if (ctx.agent.config.agent.engineering) {
        return "Engineering mode already active. Existing design tokens stay valid."
      }
      // #41 先判后翻（MANIFEST.md §2.8 F2 / KD-M1-21）：判据 = 入口决策树**单源**
      // （resolveEngineeringManifest——KD-M1-20），判据通过才写态。拒翻 ⇒ 返回原因串 +
      // **零副作用**（不清 token / 不重置 _advisorRuns / 不入列 ENG_ON_REMINDER /
      // 不动 _lastEngState / 不触镜像缝）；准 ⇒ 缺档格就地建档（writer:'main'）+
      // agent.manifest ← 结果（翻转面唯一赋值点——相位行当回合起活，§2.8 F2 放行行）。
      const r = resolveEngineeringManifest(ctx.agent.cwd ?? ctx.cwd ?? process.cwd(), { writer: "main" })
      if (!r.ok) {
        return `Error: cannot enter engineering mode — ${r.message} (mode unchanged)`
      }
      ctx.agent.manifest = r.manifest
      ctx.agent.config.agent.engineering = true
      // R16 (F-R16b ②): off→on 不重评——只清过期 token（用户裁定"打开工程模式时
      // 应该清理"），有效 token 原样保留——遍历 Map 删过期，返回文案含清理个数。
      const cleared = purgeExpiredDesignTokens(ctx.agent)
      ctx.agent._advisorRuns = new Map() // §11.2 D-24b: per-review instances die with the mode (fresh cycles)
      ctx.agent._lastEngState = true
      ctx.agent._pendingReminders = ctx.agent._pendingReminders ?? []
      ctx.agent._pendingReminders.push(ENG_ON_REMINDER)
      let msg = "Engineering mode activated. Design-before-code enforced: write a design document first (location per your project's document conventions), run advisor with type='design', get user approval, then implement via eng-coder subagents."
      if (cleared > 0) {
        msg += ` Cleared ${cleared} expired design token${cleared === 1 ? "" : "s"} — 清 ${cleared} 个过期 token，有效 token 保留（TTL 内不重评）。`
      }
      msg += await mirrorNotice(true, ctx)
      return msg
    }
    return "Invalid action: expected 'enter' or 'exit'"
  },
}
