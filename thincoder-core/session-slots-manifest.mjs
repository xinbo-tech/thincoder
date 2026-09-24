/**
 * session-slots-manifest.mjs — 清单 / 认领 / 属主面（init-block 批 · F-MI7 拆分：
 * `session-slots.mjs` 探测束接线后实读 517 行，破 490 判定线并越 500 硬限 ⇒ 按
 * `CORE-UNIFICATION.md` §2.8.1 表第 3 行随批执行外提；各函数语义**原样**迁移）：
 * 摘要面（`extractSlotMeta` / `slotDigest`）· 清单读写（`loadManifest` / `saveManifest`）·
 * 属主面（`ownerPid` / `ownerPids` / `ownerStateOf` / `ownerArgs` / `cleanDeadOwners`）·
 * 认领面（`ensureActive` / `allocateFresh` / `claimSlot` / `activeSlot` / **认领释放集
 * `staleClaims`**——F-CR1 · SESSION-CLAIM 批：判据单源，`saveManifest` 落盘 + 各落点共用）。
 *
 * 静态环（与既有的 session.mjs ↔ session-slots.mjs 同形）：本档引 `session-slots.mjs` 的
 * 存储原语（`getSessionId` / `manifestPath` / `slotPath` / `writeSessionFile`），
 * `session-slots.mjs` 反向 re-export 本档导出保持既有 import 面——函数声明在实例化期已
 * 初始化、双方只在函数体内运行时使用（模块求值期零顶层调用 ⇒ 环安全；同 session-slots.mjs
 * 头注）。存储契约（路径 / 原子写 / 属主串格式）单源仍在 `session-slots.mjs`，本档零副本。
 *
 * 探测纪律（init-block 批 · F-MI7 / SESSION.md §6.2）：本档**零自有 exec、零逐 pid 探测**——
 * 只消费调用面传入的**探测束**（`bundle` = `probeOwnersSync` / `probeOwnersAsync` 输出）；
 * 属主三态（`ownerState`）判据单源 = `process-probe.mjs`。`unknown`（探测失败 / 缺行）⇒
 * 不认领 / 不判死 / 不删（方向不对称见 process-probe.mjs 头注 · D-MI10）。
 */

import { existsSync, readFileSync, renameSync } from "node:fs"
// 「真实用户消息」谓词单源（`history-window.mjs`——人读线窗口与槽摘要同判据）。
import { isRealUserMsg } from "./history-window.mjs"
// 探测束（判活）+ 属主三态判据 / 死主判定（本档零自有 exec——判据面与探测面分离）。
import { probeOwnersSync, ownerState, filterDeadOwners } from "./process-probe.mjs"
// 存储原语（路径 / 原子写 / 进程 sessionId）——静态环见头注。
import { getSessionId, manifestPath, slotPath, writeSessionFile } from "./session-slots.mjs"

/** Extract slot metadata from history (shared by slotDigest and loadSlotMeta) */
export function extractSlotMeta(history, activeProvider, updatedAt, title = "") {
  const userMsgs = history.filter(isRealUserMsg)
  const first = userMsgs[0]?.content ?? ""
  return {
    messageCount: history.length,
    turnCount: userMsgs.length,
    firstMessage: first.slice(0, 80),
    activeProvider: activeProvider ?? "",
    updatedAt: updatedAt ?? Date.now(),
    title,
  }
}

/** Extract preview summary from session data for manifest storage (with current timestamp)
 *  MODEL-MERGE-SESSION：摘要升级带 activeModel——listSlots 合成显 "p:m"（双端同规则）。 */
export function slotDigest(data) {
  const meta = extractSlotMeta(data.history ?? [], data.activeProvider, data.updatedAt, data.title ?? "")
  if (data.activeModel) meta.activeModel = data.activeModel
  return { ts: Date.now(), ...meta }
}

export function loadManifest(cwd) {
  try {
    const p = manifestPath(cwd)
    if (!existsSync(p)) return { slots: {}, sessionId: null }
    const m = JSON.parse(readFileSync(p, "utf8"))
    if (!m.slots) m.slots = {} // 2026-09-01 会诊 deepseek 🔵：损坏的 {} manifest 不再让调用方抛 TypeError
    if (!m.sessionId) m.sessionId = null
    return m
  } catch { return { slots: {}, sessionId: null } }
}

export function saveManifest(cwd, m, deletions = null, opts = {}) {
  // 2026-08-31 会诊 kimi/deepseek 🟡：写前重读并按"条目级"合并——原实现把"读时快照"
  // 整对象写回，另一进程在窗口内对 slots/slotSessions/active 的变更被覆盖抹除（被抹
  // 认领的槽变"文件在、无属主"→ 第三方可认领 → 双属主 → F2 互旋）。无锁文件无法
  // 完全原子，重读合并把丢失更新窗口缩到最小；删除意图经 deletions 参数显式表达
  // （deleteSlot：{ slots: [n], slotSessions: [n] }）。
  // 2026-09-01 会诊 deepseek/kimi/glm 🟡：active 是单值——只有显式翻指针的调用方
  // （ensureActive 分支、newSession、switchToSlot、deleteSlot 删到 active 时）传
  // opts.setActive；其余调用方（saveSession/ACP 认领/死项清理）默认保留磁盘 fresh 的
  // active，否则毫秒窗口内会把并发方刚翻的 active 回滚（F1 防漂移的反向变体）。
  // F-CR1 认领释放（判据单源 · SESSION.md §6.2 / §6.16 落盘判据三条）：`opts.release` = 保留集
  // （落点槽 ∪ 本进程其余活绑定槽；被占落点 ⇒ 空集）。③ 内存认领表先移除残留条目（否则下方
  // 条目级合并会把它从内存复活回写）——先于 try（fresh 不可读时亦须生效）。
  if (opts.release) dropStaleClaims(m, opts.release)
  try {
    const fresh = JSON.parse(readFileSync(manifestPath(cwd), "utf8"))
    if (fresh && typeof fresh === "object" && fresh.slots && typeof fresh.slots === "object") {
      const merged = { ...fresh }
      if (opts.setActive) merged.active = m.active
      merged.slots = { ...fresh.slots, ...(m.slots ?? {}) }
      merged.slotSessions = { ...(fresh.slotSessions ?? {}), ...(m.slotSessions ?? {}) }
      if (m.sessionId) merged.sessionId = m.sessionId
      // ① 释放集按**本次 fresh 快照**取值（不得以陈旧内存 manifest 构 deletions）；② **值条件删除**
      // （仅当 fresh 属主仍为本进程——窗口内他人的新认领不在集内、不被误删）⇒ 并入本次 deletions。
      if (opts.release) {
        const released = staleClaims(fresh, opts.release)
        if (released.length > 0) {
          deletions = { ...(deletions ?? {}), slotSessions: [...(deletions?.slotSessions ?? []), ...released] }
        }
      }
      if (deletions) {
        for (const [section, keys] of Object.entries(deletions)) {
          for (const k of keys) delete merged[section]?.[k]
        }
      }
      m = merged
    }
  } catch {
    // 首次创建或 manifest 不可读：用传入对象。2026-09-01 advisor 🟡：解析失败时先改名
    // 保留现场（与 loadSlotFile 对 slot 文件的 .corrupted 原则一致）——否则覆盖后全部
    // 槽位元数据（digest/title/updatedAt）永久丢失，/session 列表变空。文件不存在时
    // rename 抛错被吞，无害。
    try { renameSync(manifestPath(cwd), `${manifestPath(cwd)}.corrupted`) } catch {}
  }
  m.sessionId = getSessionId()
  writeSessionFile(manifestPath(cwd), m)
}

/** 本进程**残留认领集**（F-CR1 释放谓词 —— **判据单源** · SESSION.md §6.2 / §6.16）：
 *  「释放 A ⟺ `slotSessions[A]` 为本进程 ∧ `A ∉ 保留集`」。`keep` = 保留集 = 落点槽 ∪ 本进程
 *  其余活绑定槽（单绑定落点 ⇒ `{落点槽}`；被占落点 ⇒ 空集）。返回槽号（**字符串键**形态）。 */
export function staleClaims(src, keep = []) {
  const keepSet = new Set((keep ?? []).filter((s) => s != null).map(Number))
  const mySessionId = getSessionId()
  return Object.entries(src?.slotSessions ?? {})
    .filter(([slot, owner]) => owner === mySessionId && !keepSet.has(Number(slot)))
    .map(([slot]) => slot)
}

/** 从**内存**认领表移除本进程残留条目（判据③——与写盘同一时机；见 `saveManifest`）。 */
function dropStaleClaims(m, keep) {
  if (!m?.slotSessions) return
  for (const slot of staleClaims(m, keep)) delete m.slotSessions[slot]
}

/** 属主串 → pid（`"pid-ts-rand"`——`owner.split("-")[0]` 格式判据单源：session-slots ↔
 *  session-lifecycle 共用，防两处漂移）。不可解析 ⇒ NaN——判据层按 dead 处理
 *  （见 process-probe `ownerState`）。 */
export function ownerPid(owner) { return parseInt(owner.split("-")[0]) }

/** manifest 属主 pid 全量清单（**非本进程**——束入参：一次探测覆盖所有待判 pid；
 *  空清单 ⇒ 探测面零 exec 早退）。`exclude` 缺省 = 本进程 sessionId。 */
export function ownerPids(m, exclude = getSessionId()) {
  const pids = []
  for (const owner of Object.values(m.slotSessions ?? {})) {
    if (!owner || owner === exclude) continue
    const pid = ownerPid(owner)
    if (pid) pids.push(pid)
  }
  return pids
}

/** 束 → 属主三态（判据单源 = process-probe `ownerState`；束缺失 / 探测失败 ⇒ "unknown"——
 *  保守保留，**不得**当全死）。 */
export function ownerStateOf(owner, bundle) {
  const pid = ownerPid(owner)
  return ownerState(pid, { aliveSet: bundle?.aliveSet ?? null, cmds: bundle?.cmds ?? null })
}

/** 束 → `filterDeadOwners` 入参（清理面 API 保面——三态 `alive`：无束 / 失败 ⇒ undefined = 未知）。 */
function ownerArgs(owner, bundle) {
  const pid = ownerPid(owner)
  const aliveSet = bundle?.aliveSet ?? null
  return [pid, { alive: aliveSet ? aliveSet.has(pid) : undefined, cmdline: bundle?.cmds?.get?.(pid) }]
}

/** 死主条目清理（2026-08-31 会诊 F4 + 2026-09-01 会诊 deepseek/kimi 🔴 语义原样抽取——
 *  ensureActive/resumeSlot 共用）：删除 owner 进程已死的 slotSessions 条目。死主判定必须跑
 *  判据（不能以"文件缺失"短路——活进程在"认领 → 首次保存"窗口文件暂缺，误删会
 *  致双进程同槽），但**不自行探测**：判活 / 命令行来自调用面同一探测束（F-MI7——
 *  零逐 pid exec）。返回 deletions 计算函数（调用时按 m 当前状态过滤刚重新认领的槽——防删
 *  掉自己的新属主），无清理返回 null。删除须经 saveManifest 的 deletions 显式落盘——条目级
 *  合并会把磁盘死条目从 fresh 复活回写（N1 + 会诊 🔴）。
 *
 * 身份复核（批 1 · F-MI6 / D-MI11——判据单源 `filterDeadOwners`）：pid 活 + 命令行**明确
 *  可得且非本产品** ⇒ 同判可删（pid 复用即此场景）；探测失败 / 缺行 ⇒ 保守保留（D-MI10）。 */
export function cleanDeadOwners(m, bundle) {
  const mySessionId = getSessionId()
  const entries = Object.entries(m.slotSessions).filter(([, o]) => o && o !== mySessionId)
  const deadSlots = []
  for (const [slot, owner] of entries) {
    const [pid, args] = ownerArgs(owner, bundle)
    if (filterDeadOwners(pid, args)) {
      delete m.slotSessions[slot]
      deadSlots.push(slot)
    }
  }
  return deadSlots.length === 0 ? null : () => ({ slotSessions: deadSlots.filter((s) => m.slotSessions[s] !== mySessionId) })
}

/**
 * Claim a slot for this process and set it as active. Idempotent.
 * Preference order:
 *  1. The current active slot, if it is unowned / ours / its owner is dead — reuse it.
 *  2. Any slot that is unowned or owned by a dead process (reclaim).  → allocateFresh
 *  3. A brand-new slot when all are owned by live processes.          → allocateFresh
 * The owner is recorded in m.slotSessions so other processes (CLI ↔ VS Code) can
 * see which slots are taken and avoid them.
 *
 * F-MI7（同步例外收窄）：粘性早退（已拥有 active）**零探测**（无束、无 exec）；
 * 冷路径 = 一次有界同步束（`probeOwnersSync`）——清理 / 占用 / 空闲全部查表。
 */
function ensureActive(cwd, m) {
  const mySessionId = getSessionId()
  if (!m.slotSessions) m.slotSessions = {}

  // Already own the active slot — nothing to do. 粘性早退：**零探测**（死项清理交给
  // 非粘性路径——resumeSlot 每次进程入口的异步束 / 冷路径同步束都会清并落盘）。
  if (m.active && m.slotSessions[m.active] === mySessionId) return

  // 冷路径：入口一次有界同步束（每 exec ≤ SYNC_PROBE_MS）覆盖全量属主 pid。
  const bundle = probeOwnersSync(ownerPids(m))
  const deadParam = cleanDeadOwners(m, bundle)

  const isFree = (slot) => {
    const owner = m.slotSessions[slot]
    if (!owner || owner === mySessionId) return true
    // 未知（探测失败 / 缺行）⇒ 不认为是空闲（不认领——D-MI10）
    return ownerStateOf(owner, bundle) === "dead"
  }

  // 1. Prefer the current active slot if we can take it (preserves "resume where you left off").
  if (m.active && m.slots[m.active] && isFree(m.active)) {
    m.slotSessions[m.active] = mySessionId
    saveManifest(cwd, m, deadParam?.() ?? null, { setActive: true })
    return
  }

  // 2/3. 分支 2/3 已抽取为 allocateFresh（2026-09-05 §6.10 D-2——resumeSlot 全新分配复用）。
  allocateFresh(cwd, m, deadParam, bundle)
}

/**
 * Allocate a slot with ensureActive 分支 2/3 语义（2026-09-05 §6.10 D-2 抽取——resumeSlot
 * 步骤③"其余一切 → 全新分配"复用；与 newSession 选号语义对齐）：
 *  2. Reclaim a manifest slot whose FILE does not exist (never held a session)；
 *  3. A brand-new slot when none is free / all numbers are taken.
 * 记录所有权 + active 指针（setActive）并落盘。返回分配的槽号。
 * F-MI7：占用 / 空闲判据全部查**调用面束**（`bundle`——零自有探测）；缺省 null ⇒
 * 全部属主按 unknown 论（只可能取全新号——保守，不认领陌生人）。
 */
export function allocateFresh(cwd, m, deadParam = null, bundle = null) {
  const mySessionId = getSessionId()
  if (!m.slotSessions) m.slotSessions = {}
  const isFree = (slot) => {
    const owner = m.slotSessions[slot]
    if (!owner || owner === mySessionId) return true
    return ownerStateOf(owner, bundle) === "dead" // 未知 ⇒ 非空闲（不认领——D-MI10）
  }

  // 2. Reclaim a slot whose FILE does not exist (never held a session). 2026-08-31 会诊 F4：
  //    原实现认领"编号最小的空闲 slot"——死主的旧 slot 文件仍在，新进程会 resume 进
  //    陌生会话（"会话乱了"实锤）且退出时覆盖它。只有文件缺失的空 slot 才允许回收。
  const allSlots = Object.keys(m.slots).filter((n) => /^\d+$/.test(n)).map(Number).sort((a, b) => a - b)
  for (const slot of allSlots) {
    if (isFree(slot) && !existsSync(slotPath(cwd, slot))) {
      m.active = slot
      m.slotSessions[slot] = mySessionId
      saveManifest(cwd, m, deadParam?.() ?? null, { setActive: true })
      return slot
    }
  }

  // 3. All slots owned by live processes — allocate a new one (no limit).
  // 2026-08-31 advisor round2 🟡：新号从 max+1 起逐号跳过"已被活进程认领但尚未落盘"
  // 的号（认领→首次保存窗口：slotSessions 有条目、m.slots 无条目、文件不存在——
  // 仅凭 m.slots/existsSync 查不到 → 双进程认领同一号 → 同槽双写/互旋）。
  // 2026-09-01 会诊 kimi 🟡：同时跳过文件仍存在的号（与 newSession 对齐）——manifest
  // 条目丢失/损坏时 max+1 会撞上孤儿槽文件 → F2 把真会话轮转成不可见的 .bak。
  // 另：allSlots 已升序，取 max 用 allSlots[allSlots.length-1]（数万槽位时 Math.max
  // spread 有 RangeError 风险）。
  const liveClaimed = (n) => {
    const owner = m.slotSessions?.[n]
    if (!owner || owner === mySessionId) return false
    return ownerStateOf(owner, bundle) !== "dead" // 活 / 未知 ⇒ 视为已占（跳号——保守）
  }
  let newSlot = allSlots.length > 0 ? allSlots[allSlots.length - 1] + 1 : 1
  while (liveClaimed(newSlot) || existsSync(slotPath(cwd, newSlot))) newSlot++
  m.active = newSlot
  m.slotSessions[newSlot] = mySessionId
  saveManifest(cwd, m, deadParam?.() ?? null, { setActive: true })
  return newSlot
}

/** 认领指定槽为本进程所有并置为 active（2026-09-05 §6.10 D-2 resumeSlot 认领路径——调用方
 *  已按"属主 空/死/本进程"判据校验可用性；幂等）。manifest active 保留为共享指针（D-6：
 *  旧版端/ACP 恢复依据 + 无记录端一次性继承源 + 列表回退高亮——不再作本端恢复第一依据）。
 *  deadParam 在写入所有权之后求值（防 deletions 删掉本调用刚认领的槽——ensureActive
 *  deadParam 同型过滤）。
 *  F-CR1（2026-09-21 · SESSION-CLAIM 批）：认领落点释放本进程残留认领（保留集 = {认领槽}——
 *  §6.2 公式代入）；本函数 = 启动恢复 / 本端恢复落点（核 `resumeSlot` 与 VSC 端壳
 *  `resumeSlot` 共用），落盘判据（fresh 快照 / 值条件删除 / 内存移除）见 `saveManifest`。 */
export function claimSlot(cwd, slot, m = loadManifest(cwd), deadParam = null) {
  m.slotSessions ??= {}
  m.slotSessions[slot] = getSessionId()
  m.active = slot // 认领即翻共享指针（setActive 写 m.active——不更新则落快照旧值）
  saveManifest(cwd, m, deadParam?.() ?? null, { setActive: true, release: [slot] })
}

/** 观测计数（测试缝——`_storeStats` / `_staleHooks` 同惯例）：`releaseClaimsAll` 调用计数。
 *  端壳「工作区转空 ⇒ 旧 cwd 释放恰一次」类断言以此为桩计数（生产零消费）。 */
export const _releaseStats = { calls: 0 }

/** 退出全释放（EXIT-CLAIM-RELEASE 批 · F-XR1 · SESSION.md §6.18 D-SE41）：优雅退出前释放
 *  本进程**全部**槽认领（保留集空——`staleClaims` 释放谓词单源）；落盘判据 = `saveManifest`
 *  `opts.release` 三条自动继承（fresh 同次快照取释放集 / 值条件删除——他人窗口内新认领不误删 /
 *  内存认领表同步移除）。**零触碰 marker 面**（F-XR2 路标保留——下次启动经 `usableSlot`
 *  无属主短路零探测直达恢复）；崩溃路径不经此（信号无 JS 钩子——F-XR3）。
 *  早退面：磁盘无 manifest ⇒ `existsSync` 单条目早退**零写**（不造盘面）；本进程无认领 ⇒
 *  零写返回 false。失败容忍（F-XR1「退出恒达」）：整体 try/catch **永不抛出**，返回 boolean
 *  （true = 有释放且落盘成功；false = 早退 / 失败——断言面）；写失败盘面 = 认领残留 →
 *  恢复走既有探测面（现状形态，数据零险）。 */
export function releaseClaimsAll(cwd) {
  _releaseStats.calls += 1
  try {
    if (!existsSync(manifestPath(cwd))) return false // 无 manifest ⇒ 零写（不造盘面）
    const m = loadManifest(cwd)
    if (staleClaims(m, []).length === 0) return false // 无本进程认领 ⇒ 零写（免白刷共享 sessionId）
    saveManifest(cwd, m, null, { release: [] }) // 保留集空 = 全释放；不 setActive（active 共享指针不动）
    return true
  } catch { return false } // F-XR1：退出恒达（写失败 = 认领残留 → 恢复走探测面）
}

/** Return the active slot number for this process, claiming one if necessary */
export function activeSlot(cwd) {
  const m = loadManifest(cwd)
  ensureActive(cwd, m)
  return m.active
}
