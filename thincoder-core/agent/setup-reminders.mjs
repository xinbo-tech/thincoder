/**
 * agent/setup-reminders.mjs — per-turn transient reminders
 * (SESSION.md §6.11 — 2026-09-06 需求池 R5/R8/R9/R11 合并设计; R10 L1 peer 注入同文件).
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
 * Manifest state rides it too (#28 — `docs/core/design/MANIFEST.md` §2.6):
 * pushManifestStateReminder carries the project phase as a self-healing single live line.
 * #34 adds the per-turn value refresh (mtime-gated re-read — §2.6 ③b / KD-M1-17..M1-19):
 * the line always carries the CURRENT on-disk phase, not the assembly-time snapshot.
 *
 * #113（S1 续轮第二批——VSC 侧并入 ④ 段）：`pushInjections`（机器行专用注入——编辑器上下文
 * 等端侧采集内容；同文去重）与 `appendImagePointer`（粘贴图指引——非多模态模型可见报错）
 * 两档并入——内容由端采集 / 传入（核内零端名），核供注入纪律单点。
 */
import { statSync } from "node:fs"
import { END } from "../session-slots.mjs"
import { peerInstances } from "../peer-instances.mjs"
import { specForModel } from "../config.mjs"
import { manifestFilePath, readManifest } from "../manifest.mjs"

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

/** 情境行前缀——本行族识别符（摘旧行 / 会话重建认领同用；行形逐字见 manifestStateLine）。 */
const MANIFEST_LINE_PREFIX = "[System reminder: project state: "

/** phase → discipline 标签映射（判据单源 = 需求 v2 §9.1）；未知值不在表内 → 无标签。 */
const MANIFEST_DISCIPLINE = Object.freeze({ "initial-dev": "light", production: "strict" })

/** 情境行构造 — pure, unit-testable（模块契约 `docs/core/design/MANIFEST.md` §2.6，与
 *  envStateLine 同族）。行形逐字（**单字段**——2026-09-17 裁撤批后）：
 *  `[System reminder: project state: phase: <值> (discipline: <light|strict>).]`
 *  未知 phase → 只出值、不编判据（无标签）。 */
export function manifestStateLine({ phase }) {
  const discipline = MANIFEST_DISCIPLINE[phase]
  return `${MANIFEST_LINE_PREFIX}phase: ${phase}${discipline ? ` (discipline: ${discipline})` : ""}.]`
}

/**
 * ③b 取值前置步（#34——`docs/core/design/MANIFEST.md` §2.6 条 3 · KD-M1-17–M1-19）：数据档
 * mtime 门控重读——盘上 mtime ≠ `agent._manifestMtime`（含缓存未设 = 首次观测）⇒ `readManifest`
 * 重读并采纳（`agent.manifest` ← 新值 + 缓存 ← 观测值）；mtime 未变 ⇒ 零重读。
 * **失败保守**：`agent.cwd` 缺失 / stat 失败 / 读抛错 / 读回非法 ⇒ 不更新、不清零、不抛——
 * 沿用上次已知好值，缓存不推进（⇒ 下回合重试，自愈）。路径 = `manifestFilePath(agent.cwd)`
 * （项目根解析与读点同源——KD-M1-18，非「锚目录 + 档名」）；缓存载体 = `agent._manifestMtime`
 * （per-agent——KD-M1-19，同族先例 `agent._slotMtime`）。本步失败只降级注入面（运行期），
 * 与 E2 启动门槛（会话起点）两分——见 §2.5「运行期失败退化 vs 启动门槛」。
 * @param {object} agent 主 agent（`agent.cwd` / `agent.manifest`）
 */
function refreshManifest(agent) {
  if (!agent.cwd) return // 无锚 ⇒ 跳过本步（零 I/O，沿用内存值——§2.6 条 3 边界）
  let mtimeMs
  try {
    mtimeMs = statSync(manifestFilePath(agent.cwd)).mtimeMs
  } catch {
    return // stat 失败（档删 / 不可读）⇒ 保守（不更新、不清零、不抛；缓存不推进）
  }
  if (agent._manifestMtime === mtimeMs) return // 未变 ⇒ 零重读（每回合仅一次路径解析 + 一次 statSync）
  let m
  try {
    m = readManifest(agent.cwd)
  } catch {
    return // 读抛错（权限 / 目录等）⇒ 保守（同上）
  }
  if (!m.ok) return // 读回非法 / 缺失 ⇒ 保守（沿用旧值）
  agent.manifest = m.manifest
  agent._manifestMtime = mtimeMs
}

/**
 * 情境行注入（#28——`docs/core/design/MANIFEST.md` §2.6 模块契约）：manifest 的
 * `phase` 逐回合进模型上下文（判据序 ①–⑥ + 取值前置步 ③b = §2.6 表；#34 起值变由盘面驱动）。**自愈单活体**——
 * 同文活体在 → 幂等（零历史变更）；值变 → 就地摘旧行 + 落新行（保 `history` 数组引用）；
 * 压缩 / 会话重建吞行 → 下一回合重推（不落 system 槽——架构 E5.1 #5，`context.mjs`
 * 压缩面零触碰）。`transient:true` ⇒ 不进人读线（`_fullHistory`）。
 * @param {object} agent 主 agent（`agent.manifest` / `agent.history` / `agent.cwd`——③b 取值）
 * @param {{depth?: number}} [opts] 注入深度（仅 depth-0）
 * @returns {boolean} 是否落新行（测试断言用）
 */
export function pushManifestStateReminder(agent, { depth = 0 } = {}) {
  if (depth !== 0) return false // ① 仅 depth-0（子代理读任务书——架构 §2.4 M5 零 manifest 读面）
  if (agent.config?.agent?.engineering !== true) return false // ② 模式门：仅工程模式
  if (!agent.manifest) return false // ③ 无 manifest（normal 路径 / 装配缺失）→ 零注入
  refreshManifest(agent) // ③b 取值前置步（#34）：mtime 门控重读——行构造须取刷新后的值
  const history = agent.history
  const line = manifestStateLine({ phase: agent.manifest.phase })
  // ④ 同文 user 行已在（活体）→ 幂等——零历史变更（同文口径 = pushInjections 的 history.some）
  if (history.some((m) => m.content === line)) return false
  // ⑤ 值已变 → 就地 splice 摘旧行（`role === "user"` 全匹配），保 history 数组引用。会话重建后
  //    `_manifestLine` 不随历史回来 → 先按行族前缀从 history 认领现存活体（否则旧行残留 +
  //    新行入列 = 双活体，违 §2.6 定案「单活体」）。
  let old = agent._manifestLine
  if (!old) {
    for (const m of history) {
      if (typeof m?.content === "string" && m.content.startsWith(MANIFEST_LINE_PREFIX)) old = m.content
    }
  }
  if (old && old !== line) {
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i]?.role === "user" && history[i].content === old) history.splice(i, 1)
    }
  }
  history.push({ role: "user", content: line, transient: true }) // ⑥ 落新行 + 记活体
  agent._manifestLine = line
  return true
}

/**
 * R10 L1 peer reminder（MULTI-INSTANCE-COLLAB §2a.4 D-L1a——仿 pushEnvStateReminder
 * 形态：depth-0、transient:true——注入纪律同 env-state）。有同伴（非 self > 0）才注入
 * ——无同伴零开销（peerInstances 惰性 mtime/TTL 缓存保证：命中零 exec）。任何
 * 感知失败静默跳过（注入绝不打断回合）。文案（设计逐字）："本目录另有 N 个活跃
 * thincoder（{end} pid={pid}…）——文件操作注意避让"。
 *
 * **async**（TUI 假死批 2026-09-18）：读面已异步化（探测 `execFile` promise）；装配点
 * `prepareRun` 本就 async ⇒ `await pushPeerReminder(agent)`——**注入时序与文案零变**
 * （env-state 后、time reminder 前）。
 */
export async function pushPeerReminder(agent) {
  let peers
  try {
    peers = (await peerInstances(agent.cwd)).filter((p) => !p.self)
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

/**
 * 机器行专用注入单点（#113 VSC 侧并入——编辑器上下文等端侧采集内容）：`injections` =
 * 单条或数组，每条 `{ content }`。纪律与 CLI parity：只进机器行（transient——持久化层
 * 可丢；不进人读记录——自动上下文不得污染人读历史）；**同文去重**（幂等注入——history
 * 已有等文消息则跳过）。非法条目静默跳过（注入绝不打断回合）。内容由**端装配**采集并
 * 传入（核内零端名——④ 段）。
 */
export function pushInjections(history, injections) {
  const list = Array.isArray(injections) ? injections : (injections ? [injections] : [])
  for (const inj of list) {
    if (!inj || typeof inj.content !== "string") continue
    if (history.some((m) => m.content === inj.content)) continue
    history.push({ role: "user", content: inj.content, transient: true })
  }
}

/**
 * 粘贴图指引（#113 VSC 侧并入——贴图指引按端注入）：`images` = 绝对路径列表（端侧保存
 * 的粘贴图档）。把指引追加到**真实用户消息**尾部（content 保持字符串形态——不用旧
 * image_url parts 数组），模型经 `read_image` 查看（其多模态路径注入图像 part）。非多模态
 * 模型 ⇒ **抛错**（可见错误，绝不静默丢图）。depth>0 / 无图 / 消息缺失 ⇒ no-op。
 */
export function appendImagePointer(userMsg, images, providerModel, { depth } = {}) {
  if (depth !== 0 || !userMsg || !Array.isArray(images) || images.length === 0) return
  const spec = specForModel(providerModel)
  if (!spec.multimodal) {
    throw new Error("This model does not support pasted images. Switch to a vision-capable model (Kimi K3, Qwen, GLM, etc.) or attach the image as a file and let the model read it.")
  }
  userMsg.content += `\n\n[Attached images: ${images.join(" | ")}] — use the read_image tool to view them before answering.`
}
