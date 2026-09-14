/**
 * agent/setup-reminders.mjs — per-turn transient reminders
 * (SESSION.md §11.1 — 2026-09-06 需求池 R5/R8/R9/R11 合并设计; R10 L1 peer 注入同文件).
 *
 * One unified transient user reminder per turn covers the whole self-awareness
 * family: env identity (R8 — §10 D-1 END 常量先例：静态常量，不做 cmdline 判别),
 * engineering mode (R9), active model (R11), session slot (F1), restart awareness
 * (R5 resumed). §11.2（2026-09-08）：resumed 按会话跟踪——恢复事件由 session.mjs
 * applySession 武装（agent._envResumed——载入历史非空 = 恢复）；进程重启句独立走
 * agent._processRestartPending（bin 启动 resume 路径设）——双信号互不绑门（N6）。
 * Change awareness needs no dedicated injection — every turn carries the
 * CURRENT state, so a mode/model flip shows up in the next turn's line.
 * git is NOT a field here (§11.1: CLI 不重复注入 clean|dirty 摘要) — the rich
 * git-context injection (branch/commits/uncommitted — helpers.mjs
 * collectGitContext, wired in setup.mjs) carries it.
 * Peer awareness (R10 L1) rides the same per-turn transient channel:
 * pushPeerReminder injects the live co-cwd instance list when present.
 */
import { END } from "@thincoder/core/session-slots.mjs"
import { peerInstances } from "@thincoder/core/peer-instances.mjs"

/** env-state line builder — pure, unit-testable.
 *  §11.2（F1）：slot 字段入行——位置在 model 后 resumed 前（N3：无绑定 → 显式 null——
 *  不读 manifest active 共享指针——粘性 _slot 才是"本 agent 之槽"）。 */
export function envStateLine({ mode, model, slot, resumed }) {
  return `[System reminder: env: ${END}, mode: ${mode}, model: ${model}, slot: ${slot}, resumed: ${resumed ? "yes" : "no"}.]`
}

/**
 * Push the per-turn env-state reminder (setup.mjs calls it for depth-0 runs —
 * the line describes the MAIN agent's host/mode/model/slot identity). resumed=yes
 * exactly once per session restore: applySession (session.mjs) arms
 * agent._envResumed when restored history is non-empty; consumed here so every
 * later turn reads resumed=no（§11.2 F2——每次恢复一次；/new 与空历史槽切换不武装——
 * F3 伪触发消除）。slot = 粘性 agent._slot（§11.2 N2/N3——无绑定显式 null）。
 * Degrades safely: activeModel null → provider.model → "unknown" (T-E12);
 * a missing config/history never throws (T-E13).
 */
export function pushEnvStateReminder(agent) {
  const mode = agent.config?.agent?.engineering ? "eng" : "normal"
  const model = agent.activeModel ?? agent.provider?.model ?? "unknown"
  const slot = agent._slot ?? null
  const resumed = agent._envResumed === true
  agent._envResumed = false
  agent.history.push({ role: "user", content: envStateLine({ mode, model, slot, resumed }), transient: true })
}

/**
 * R10 L1 peer reminder（MULTI-INSTANCE-COLLAB §2a.4 D-L1a——仿 pushEnvStateReminder
 * 形态：depth-0、transient:true——注入纪律同 env-state）。有同伴（非 self > 0）才注入
 * ——无同伴零开销（peerInstances 惰性 mtime 缓存保证：manifest 未变零 exec）。任何
 * 感知失败静默跳过（注入绝不打断回合）。文案（设计逐字）："本目录另有 N 个活跃
 * thincoder（{end} pid={pid}…）——文件操作注意避让"。
 */
export function pushPeerReminder(agent) {
  let peers
  try {
    peers = peerInstances(agent.cwd).filter((p) => !p.self)
  } catch {
    return // 感知失败降级——不注入
  }
  if (peers.length === 0) return
  const who = peers.map((p) => (p.end ? `${p.end} pid=${p.pid}` : `pid=${p.pid}`)).join("、")
  agent.history.push({
    role: "user",
    content: `[System reminder: 本目录另有 ${peers.length} 个活跃 thincoder（${who}）——文件操作注意避让]`,
    transient: true,
  })
}
