/**
 * setup-reminders.mjs — runtime user-reminder assembly, extracted from setup.mjs
 * (300-line advisory; 2026-08-29 thincoder#3 review #2).
 *
 * All builders here push "user"-role context messages onto the machine history line:
 *   - AUTO mode reminder constant (pushed by the agent loop head — D-CI6；permission 句已随本批退役)
 *   - transient per-run time grounding (must stay LAST, after the user input, so its
 *     second-precision content never shifts a provider prefix cache)
 *   - machine-only injections (editor context), transient, never into fullHistory —
 *     idempotent (a same-content re-delivery is skipped, D-CI5)
 *   - pasted-image pointer appended to the REAL user message (by reference — never
 *     history.at(-1), which is the transient time reminder pushed after the input)
 *
 * W15（2026-09-15 · `docs/batches/2026-09-15-vsc-core-wiring.md` §2 W15「核原语改指」）：
 * 本档保留**端特有面**（端身份行 envStateLine〔R4——`END = "vscode"` + env 行端生成〕·
 * 端侧 peer 感知 · 重启检测闸 · time 尾位推送 · pushGitContext 端壳包装），其余与核
 * 同源的原语一律**转口核单源**：
 *   - `@thincoder/core/agent/helpers.mjs`：`AUTO_REMINDER` · `ENG_{ON,OFF}_REMINDER` ·
 *     `injectEngineeringReminder` · `composeGitContext` · `collectGitContext` +
 *     失败冷却测试缝（原端侧同构副本随本单元退场——核注释同款「VSC 镜像」）·
 *     回合域文本基座两名 `AUTO_TURN_DIGEST_DOMAIN` + `UPSTREAM_TURN_DOMAIN`（§6.27.12.5 J——
 *     端侧零自持基座副本，消费点 = `./turn-domains.mjs` 组合单点）。
 *   - `@thincoder/core/agent/setup-reminders.mjs`：#113 并集面 `pushInjections` /
 *     `appendImagePointer`（核供注入纪律单点——内容由端采集/传入，核内零端名）；
 *     #28 情境行 `manifestStateLine` / `pushManifestStateReminder`（同档同源转口）。
 * 逐字/语义零差（核面 = 端侧原文上收）。
 */

import { peerInstances } from "../extension/peer-instances.mjs"
import { escapeXml } from "./run-helpers.mjs"

// ── 核单源转口（W15）──────────────────────────────────────
export {
  AUTO_REMINDER,
  ENG_ON_REMINDER,
  ENG_OFF_REMINDER,
  injectEngineeringReminder,
  composeGitContext,
  collectGitContext,
  _gitFailureCooldownForTests,
  _clearGitFailureCooldownForTests,
  AUTO_TURN_DIGEST_DOMAIN,
  UPSTREAM_TURN_DOMAIN,
} from "@thincoder/core/agent/helpers.mjs"
export { pushInjections, appendImagePointer, manifestStateLine, pushManifestStateReminder } from "@thincoder/core/agent/setup-reminders.mjs"
import { collectGitContext } from "@thincoder/core/agent/helpers.mjs" // pushGitContext 体内用

// ─── SESSION.md §11.1：统一 env-state transient reminder（2026-09-06 需求池
//     R5/R8/R9/R11 合并——核 setup-reminders.mjs 同构面；R4 端差：env 行端生成）─────────
// 每回合一行覆盖家族四项：env 身份（R8——§10 D-1 END 静态常量，不做 cmdline 判别）、
// 工程模式（R9）、活跃模型（R11）、重启感知（R5 resumed）。变更不专门注入——每回合
// 注入当前状态，下回合自然反映。git 不入 env-state 行（§11.1：不重复 clean|dirty
// 摘要）——由下方 pushGitContext 的富注入（branch/commits/uncommitted）承载。

/** env-state line builder — pure, unit-testable (VSC 端身份面, END="vscode"——W15 R4：
 *  核 `END` 参数化 = 核内笔登记；端侧自持端身份行)。
 *  §11.2（F1）：slot 字段入行——位置在 model 后 resumed 前（N3：无绑定 → 显式 null）。 */
export function envStateLine({ mode, model, slot, resumed }) {
  return `[System reminder: env: vscode, mode: ${mode}, model: ${model}, slot: ${slot}, resumed: ${resumed ? "yes" : "no"}.]`
}

/** Per-turn env-state push (depth-0 runs — the line describes the MAIN agent's
 *  host/mode/model/slot identity). slot = 粘性当前会话槽（opts.engPersist.slot——
 *  §11.2 N2/N3——无绑定显式 null，不读 manifest active 共享指针）。resumed 由调用方
 *  传入 agent 级 _resumedPending 消费结果（§11.2 评审 #7——按会话跟踪；模块级
 *  restartDetectionDone 闸保留为 process restarted 句专用——见 setup.mjs）。
 *  Degrades safely: provider.model missing → "unknown". */
export function pushEnvStateReminder(history, { engineering, provider, slot, resumed }) {
  const mode = engineering ? "eng" : "normal"
  const model = provider?.model ?? "unknown"
  history.push({ role: "user", content: envStateLine({ mode, model, slot, resumed }), transient: true })
}

// R10 L1（MULTI-INSTANCE-COLLAB.md §3.1——VS Code 镜像）：同伴实例感知注入。
// peerInstances = 端侧 **SWR 快照读**（新鲜度判据单源 = TTL `PEER_PROBE_TTL_MS`——端面
// 不复刻核的 mtime 判据，§3.1）：新鲜 ⇒ 直返 / 过期 ⇒ 返旧 + 后台刷新 / 无快照 ⇒
// 空集 + 后台刷新 ⇒ 每回合调用面（本函数）**零同步 exec**。探测失败 / 无 manifest
// 按无同伴降级（不注入）——注入绝不打断回合。
// 文案（**逐字契约 · 双端一致** = 设计 `MULTI-INSTANCE-COLLAB.md` §3.2「注入文案」条）：
// "本目录另有 N 个活跃 thincoder（{end} pid={pid}；无 end 则 pid={pid}；同伴间以「、」
// 连接）——文件操作注意避让"——与核 `agent/setup-reminders.mjs:162` 的 `who` 构造逐字同形。

/** 注入当前 cwd 的同伴实例提醒（env-state 之后、time reminder 之前调用——setup.mjs
 *  装配；有同伴才注入；transient）。返回是否注入（测试断言用）。 */
export function pushPeerReminder(history, cwd) {
  try {
    const peers = peerInstances(cwd).filter((p) => !p.self)
    if (peers.length === 0) return false
    const who = peers.map((p) => (p.end ? `${p.end} pid=${p.pid}` : `pid=${p.pid}`)).join("、")
    history.push({
      role: "user",
      content: `[System reminder: 本目录另有 ${peers.length} 个活跃 thincoder（${who}）——文件操作注意避让]`,
      transient: true,
    })
    return true
  } catch {
    return false // 感知失败按无同伴降级——不阻塞回合
  }
}

// R5 重启检测：process restarted 句的进程级一次性闸（SESSION.md §11.2 评审 #7——N6 双信号
// 分离：本闸保留为"真进程重启"句专用——extension host 重启后模块级重置；进程内切槽/换槽
// 不重置 → 切槽不误报进程重启）。resumed:yes 已改 agent 级 _resumedPending（setup.mjs
// hydrateRun——restore:true 工厂路径 + fullHistory 非空时武装——每次会话恢复一次）。
// 新会话首回合 fullHistory 为空 → 句不发，且检测随即关闸，后续回合（history 已非空）
// 不误判。
let restartDetectionDone = false

/** Test seam — restores first-turn restart detection (production never calls this). */
export function _resetRestartDetectionForTests() { restartDetectionDone = false }

/** Returns true exactly once: the first top-level user turn whose session was
 *  restored from disk (fullHistory arrives non-empty). All other turns return false. */
export function detectRestoredSession({ depth, resume, autoTurn, fullHistory }) {
  if (restartDetectionDone || depth !== 0 || resume || autoTurn) return false
  restartDetectionDone = true
  return (fullHistory?.length ?? 0) > 0
}

/** Git context push (CLI setup.mjs parity) — transient, depth-0 user turns only.
 *  async（collectGitContext 异步化——调用方 await——注入相对序不变——F-4）。采集/冷却 =
 *  核单源（W15 转口——失败冷却 30s / maxBuffer 1 MiB / 三形态 compose 均随核档）。 */
export async function pushGitContext(history, cwd) {
  const gitCtx = await collectGitContext(cwd)
  if (gitCtx) {
    history.push({ role: "user", content: `[System reminder: git context:\n${escapeXml(gitCtx)}]`, transient: true })
  }
}

/** Per-run time grounding — transient, pushed LAST (after the user input) so its
 *  second-precision content never shifts a provider prefix cache. */
export function pushTimeReminder(history) {
  history.push({
    role: "user",
    content: `[System reminder: current time is ${new Date().toLocaleString("sv-SE")} (local; timezone ${Intl.DateTimeFormat().resolvedOptions().timeZone}).]`,
    transient: true,
  })
}
