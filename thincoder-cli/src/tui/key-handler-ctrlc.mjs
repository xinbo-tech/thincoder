import { C } from "./ansi.mjs"
// F-XR1 退出释放（EXIT-CLAIM-RELEASE · SESSION.md §6.18 D-SE41）：核薄函数——退出恒达
// （永不抛出，失败返回 false）；零触碰 marker 面（F-XR2 路标保留）。
import { releaseClaimsAll } from "@thincoder/core/session-slots-manifest.mjs"

/** Ctrl+C 族（2026-09-22 structure-debt §2.1 分族 1 · #226）：picker 取消 / 武装窗口全停 /
 *  挂起态两级中止 / 回合 interrupt / 空闲退出武装五分支——块体自 key-handler.mjs
 *  createKeyHandler 逐字搬移（仅去缩进；函数体自持原块入口判定）。
 *  路由 = 分派器 createKeyHandler（守卫 = 同一条原块入口条件）。 */
export function handleCtrlCFamily(str, key, ctx) {
  const { agent, state, render, popPicker, pushLine, cleanup } = ctx
  if (key.ctrl && key.name === "c") {
    // picker 打开时 Ctrl+C = 取消当前 picker（等同 Esc），不杀进程
    if (state.picker) {
      popPicker(null)
      return
    }
    // AGENT-LOOP-ASYNC-POOL.md §6.8（2026-09-03）：武装窗口内第二次 Ctrl+C = 显式全停（D-C4 /abort 语义）。
    // 在状态路由前检查（picker 取消分支例外——picker 打开时 Ctrl+C 语义 = 取消
    // picker，武装让位；场景极窄——3s 窗口内需另有 picker 被打开）——两次按下之间
    // 状态会迁移（首按停回合 → 释放窗口/挂起会话启动），武装必须跨态桥接：只查挂起
    // 分支会让非挂起 processing 首按后的二按落入空闲退出分支（三按误退出应用）。
    if (state.suspAbortArmed) {
      if (ctx.suspArmTimer) clearTimeout(ctx.suspArmTimer)
      state.suspAbortArmed = false
      // 无可停目标（无 processing 回合 / 无会话 abort 集合 / 未挂起）时不吞键：
      // 首按停的是普通回合（无后台池）——二按落回下方空闲退出分支（exitArmed 双
      // 确认），不打印误导性的 "[Aborting background subagents…]"（advisor round1
      // 🟡——停回合后连按退出的第二次按下被空转吞掉 → 退出从 3 按变 4 按）。
      const hasStopTarget = (state.processing && state.controller) ||
        (agent._sessionAbortAll?.length ?? 0) > 0 ||
        (agent._sessionAbort != null && !agent._sessionAbort.signal.aborted) ||
        state.suspended
      if (hasStopTarget) {
        // 当前回合平 abort（无 interrupt——命中 agent.mjs 回合收尾清池分支——全停）
        // §20.3 站点 #11（第 24 批）：整批 / 会话级停 = stop（reason 载荷）
        if (state.processing && state.controller) state.controller.abort({ abortTrigger: "stop", abortDetail: "session-stop" })
        // 会话 abort 集合 = 链条内全部 controller（含 Ctrl+I/ContinueError 重建的旧
        // controller——children 不逃逸，round1 偏差 #3）。挂起态才标记 _suspAborted +
        // 唤醒 driver（driver 收尾清池）——非挂起语境置位会粘滞阻塞未来挂起会话重入
        // （round2 偏差 #1 语义）。
        for (const c of agent._sessionAbortAll ?? (agent._sessionAbort ? [agent._sessionAbort] : [])) c?.abort({ abortTrigger: "stop", abortDetail: "session-stop" })
        if (state.suspended) {
          state._suspAborted = true
          state._suspWake?.()
        }
        pushLine("[Aborting background subagents…]", C.warn)
        render()
        return
      }
      // 无目标可停 → 落空继续到下方分支（processing 已停 → 空闲态 exitArmed 双确认）
    }
    if (state.suspended) {
      // AGENT-LOOP-ASYNC-POOL.md §6.8 D-S9 + round2 偏差 #4（2026-09-02）+ AGENT-LOOP-ASYNC-POOL.md §6.8 修订（2026-09-03）：挂起态
      // Ctrl+C = 武装窗口两级中止——一次按键直接清池中止全部后台子代理的误触代价高
      // （digest 刷屏时用户可能只想停住当前回合）；仿空闲态退出武装语义（同下方空闲态
      // exitArmed 双确认分支）。AGENT-LOOP-ASYNC-POOL.md §6.8 修订 ①：中止当前回合的 abort 带 interrupt
      // （无 message）——此前平 abort 命中 agent.mjs 回合收尾清池分支（aborted &&
      // !reason.interrupt → 无条件 _asyncSubagents.clear()），一次首按即误杀全部后台
      // 子代理（2026-09-03 用户两次实测——提示"再按才杀"与实际"一次就全杀"不符）；
      // interrupt 排除清池分支——会话与后台保留（agent-turn 区分：无 message 停回合
      // 不续跑）：
      //   ① 未武装 + 有回合在跑（digest 消化/会话内回合）：仅中止当前回合
      //      （controller.abort({ interrupt: true })）——会话继续、后台子代理不受
      //      影响，回挂起等待；
      //   ② 未武装 + 纯挂起等待：仅提示不清池；
      //   ③ 3s 武装窗口内再次 Ctrl+C：彻底中止——上方统一块（二按语义不变）。
      if (state.processing && state.controller) {
        state.controller.abort({ interrupt: true }) // ① 仅中止当前回合（digest/会话内回合），不碰后台池
        pushLine("[stopped current turn — press Ctrl+C again within 3s to abort all background subagents]", C.warn)
      } else {
        const bgActive = [...(agent._asyncSubagents?.values() ?? [])].filter((e) => e.status === "running").length + (agent._asyncQueue?.length ?? 0)
        pushLine(`[abort] Press Ctrl+C again within 3s to abort all background subagents (${bgActive} running)`, C.warn)
      }
      state.suspAbortArmed = true
      if (ctx.suspArmTimer) clearTimeout(ctx.suspArmTimer)
      ctx.suspArmTimer = setTimeout(() => { state.suspAbortArmed = false }, ctx.exitArmDelay ?? 3000)
      ctx.suspArmTimer.unref?.()
      render()
      return
    }
    if (state.processing && state.controller) {
      // AGENT-LOOP-ASYNC-POOL.md §6.8 D-C1（2026-09-03 紧急修复——processing 态曾无武装窗口，第一按直接平
      // abort() → 命中 agent.mjs 回合收尾清池分支 → 一次 Ctrl+C 误杀全部后台子代理，
      // 用户两次实测被坑）：首按 = interrupt 语义（无 message——停当前回合不续跑——
      // interrupt 排除 agent.mjs 清池分支——后台池保留——agent-turn 区分不重建续跑）
      // + 武装 3s（复用 suspArmTimer/exitArmDelay——与挂起态同构——过期自动复位）；
      // 窗口内再按 = 上方统一块全停（平 abort → agent.mjs 清池）。
      state.controller.abort({ interrupt: true })
      pushLine("[stopped current turn — press Ctrl+C again within 3s to abort all background subagents]", C.warn)
      state.suspAbortArmed = true
      if (ctx.suspArmTimer) clearTimeout(ctx.suspArmTimer)
      ctx.suspArmTimer = setTimeout(() => { state.suspAbortArmed = false }, ctx.exitArmDelay ?? 3000)
      ctx.suspArmTimer.unref?.()
      render()
      return
    }
    // 防误触：空闲态第一次 Ctrl+C 仅提示并武装，窗口内再按才真正退出
    if (!state.exitArmed) {
      state.exitArmed = true
      if (ctx.exitArmTimer) clearTimeout(ctx.exitArmTimer)
      ctx.exitArmTimer = setTimeout(() => { state.exitArmed = false }, ctx.exitArmDelay ?? 3000)
      ctx.exitArmTimer.unref?.()
      pushLine("[exit] Press Ctrl+C again within 3s to exit", C.warn)
      render()
      return
    }
    if (ctx.exitArmTimer) clearTimeout(ctx.exitArmTimer)
    cleanup()
    // F-XR1 退出释放（EXIT-CLAIM-RELEASE · SESSION.md §6.18）：先于定时器注册同步完成
    // （D-SE42——100ms 窗零竞态）；退出前保存已完成 ⇒ 释放 = 收口前最后一步。
    releaseClaimsAll(process.cwd())
    // 延迟退出可注入（测试传大值并清理定时器，避免定时器在 mock 恢复后调到真 process.exit）
    ctx.exitTimer = setTimeout(() => process.exit(0), ctx.exitDelay ?? 100)
    ctx.exitTimer.unref?.()
    return // review #5 fix: exiting — don't fall through to later branches
  }
}
