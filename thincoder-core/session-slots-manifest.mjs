/**
 * session-slots-manifest.mjs — 清单 / 认领 / 属主面（init-block 批 · F-MI7 拆分：
 * `session-slots.mjs` 探测束接线后实读 517 行，破 490 判定线并越 500 硬限 ⇒ 按
 * `CORE-UNIFICATION.md` §2.8.1 子表原行 3（已随 2026-10-08 批清账）随批执行外提；各函数语义**原样**迁移）：
 * 摘要面（`extractSlotMeta` / `slotDigest`）· 清单读写（`loadManifest` / `saveManifest`）·
 * 属主面（`ownerPid` / `ownerPids` / `ownerStateOf` / `ownerArgs` / `cleanDeadOwners`）·
 * 认领面（`ensureActive` / `allocateFresh` / `claimSlot` / `activeSlot` / **认领释放集
 * `staleClaims`**——F-CR1 · SESSION-CLAIM 批：判据单源，`saveManifest` 落盘 + 各落点共用；
 * **属主 ∕ 认领两族已随 2026-09-28 拆分迁出 `session-slot-claims.mjs`——见下**）。
 *
 * LEDGER-RELIABILITY 批（2026-09-28 · SESSION.md §6.25）：补摘要谓词 `healNeeded` + 落点 A 顺手补写
 * `healDigest` / `slotMtime`（判据句 3）· 账本面写安全（判据句 5）· 账本健康出口 `ledgerHealth`（判据句 4）。
 *
 * 2026-09-28 拆分批（R3——本档 421 > 300）：**认领面族**（`staleClaims` ∕ owner 三件 ∕
 * `cleanDeadOwners` ∕ `ensureActive` ∕ `allocateFresh` ∕ `claimSlot` ∕ `_releaseStats` ∕
 * `releaseClaimsAll` ∕ `activeSlot`）外提 `./session-slot-claims.mjs`（verbatim——台账 #484
 * 顺延项落形）；本档保留摘要 / 清单读写 / 属主健康面，并 re-export 该档导出保既有 import 面
 * （消费档路径与名面不动）。新增静态环：本档 ↔ `session-slot-claims.mjs`（`loadManifest` ∕
 * `saveManifest` ↔ 认领面族——环安全同下）。
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
import { existsSync, readFileSync, renameSync, statSync } from "node:fs"
// 「真实用户消息」谓词单源（`history-window.mjs`——人读线窗口与槽摘要同判据）。
import { isRealUserMsg } from "./history-window.mjs"
// 存储原语（路径 / 原子写 / 进程 sessionId）——静态环见头注。
import { getSessionId, manifestPath, slotPath, writeSessionFile } from "./session-slots.mjs"
// 认领面（2026-09-28 拆分外提——见头注）：本档 import `staleClaims` 供 dropStaleClaims 取用，
// 并在下方 re-export 全族保既有 import 面。
import { staleClaims } from "./session-slot-claims.mjs"

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
 *  MODEL-MERGE-SESSION：摘要升级带 activeModel——listSlots 合成显 "p:m"（双端同规则）。
 *  SLOT-END-PARAM 批（SESSION.md §6.20 判据句 4 读面）：创建端**有值才带**（老槽无键 ⇒
 *  键缺席 = 未知——禁回填、禁以占用端冒充）。
 *  #503：`ts` 经打点单源 `digestTs(mtimeMs)`——`mtimeMs`（可选）= 该档保存面**写后**取的 mtime
 *  （地板）；缺省 / 不可得 ⇒ 裸墙钟回溯（旧调用点零改）。 */
export function slotDigest(data, mtimeMs) {
  const meta = extractSlotMeta(data.history ?? [], data.activeProvider, data.updatedAt, data.title ?? "")
  if (data.activeModel) meta.activeModel = data.activeModel
  if (data.createdBy) meta.createdBy = data.createdBy
  return { ts: digestTs(mtimeMs), ...meta }
}

const isNum = (v) => typeof v === "number" && Number.isFinite(v)

/** 摘要 `ts` 打点（**单源** · #503 地板）：`max(墙钟, mtimeMs)`；`mtimeMs` 不可得（缺省 / 非数）⇒
 *  裸墙钟回溯。沿先例 `session-slot-verify.mjs:99`（回写面地板）：**平台文件时间戳可领先
 *  `Date.now()` 数 ms**——无地板则保存面刚写的摘要会被 `needsVerify`（`ts < mtime`）判「陈旧」
 *  一次（有界自纠，非数据面）；地板后 `ts ≥ mtime` 恒成立（同一 stat 值即比较对象）。 */
export function digestTs(mtimeMs) {
  return isNum(mtimeMs) ? Math.max(Date.now(), mtimeMs) : Date.now()
}

/** 摘要补写谓词（§6.25 判据句 3 · **单源**）：缺失 ∨ 陈旧（`ts < mtime`）⇒ 补写；新鲜 ⇒ 不写（幂等）。 */
export function healNeeded(entry, mtime) {
  if (!entry || typeof entry !== "object") return true
  if (!isNum(entry.ts)) return true
  return isNum(mtime) ? entry.ts < mtime : false
}

/** 落点 A 顺手补写（§6.25 判据句 3 · 打开 / 切槽）：数据**已在手** ⇒ 置入调用方 manifest 对象，随其
 *  既有那次 `saveManifest` 落盘（**零额外槽文件读 + 零额外写**）；`mtime` 不可得 ⇒ 不妄断陈旧。
 *  `ts` 携同一 `mtime` 地板（#503——否则 mtime 领先墙钟时刚补写的条目又判陈旧）。 */
export function healDigest(m, slot, data, mtime) {
  if (!data || typeof data !== "object") return false
  if (!healNeeded(m.slots?.[slot], mtime)) return false
  m.slots ??= {}
  m.slots[slot] = slotDigest(data, mtime)
  return true
}

/** 槽文件 mtime（`healDigest` 新鲜度判据入参——读失败 ⇒ `null` = 不可得）。 */
export function slotMtime(cwd, slot) {
  try { return statSync(slotPath(cwd, slot)).mtimeMs } catch { return null }
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

/** 可信合并基座判据（§6.23 判据句 1 · ②）：顶层非 null 非数组对象 ∧（`slots` / `slotSessions`
 *  缺席或为对象）。**假值（null / `0` / `""` / `false`）按缺席归一**——判据线单源 = `loadManifest`
 *  的 `!m.slots → {}`（同向：空基座可合并、不拒写；展开后自然落 `{}`）；真值非对象（`42` / `"x"`）
 *  与数组 ⇒ 不可信。形态非法 ⇒ 不写盘（判据句 2(c)）。 */
function isTrustedBase(fresh) {
  if (!fresh || typeof fresh !== "object" || Array.isArray(fresh)) return false
  const mapField = (v) => !v || (typeof v === "object" && !Array.isArray(v))
  return mapField(fresh.slots) && mapField(fresh.slotSessions)
}

/** (b)(c) 现场保全：原字节改名 `{manifest 路径}.corrupted`（与槽文件面同形）——同名已存在 ⇒
 *  覆盖（单槽位 · last-wins）；改名失败被吞、**不阻断拒写**（§6.23 判据句 2）。返回值为**改名目标
 *  路径**（拒写 loud 行的 `preserved=` 即取此）——非存在性保证：改名失败面 = `.corrupted` 缺席自证。 */
function preserveScene(p) {
  const dst = `${p}.corrupted`
  try { renameSync(p, dst) } catch {}
  return dst
}

/** 账本健康计数（§6.25 判据句 4——**本进程累计**）：拒写（§6.23）+ 写后读回失败次数与最近一条。 */
const ledgerRefusals = { refused: 0, lastReason: null, lastPath: null, lastAt: null }
const noteRefusal = (reason, p) => Object.assign(ledgerRefusals, { refused: ledgerRefusals.refused + 1, lastReason: reason, lastPath: p, lastAt: Date.now() })

/** 账本健康出口（§6.25 判据句 4 · **判据单源**）：`refused` = 本进程累计（§6.23 拒写 + 判据句 5 读回
 *  失败）+ `lastReason` ∈ 四类（read-failed / parse-failed / shape-invalid / readback-failed）；`scene` =
 *  该 cwd 的 `{manifest}.corrupted` 在盘（损坏现场——随 30 天 GC / 手工清除而止）。 */
export function ledgerHealth(cwd) {
  let scene = false
  try { scene = existsSync(`${manifestPath(cwd)}.corrupted`) } catch { /* cwd 不可解析 ⇒ 无现场 */ }
  return { ...ledgerRefusals, scene }
}

/** 拒写（§6.23 判据句 2/3）：不调 `writeSessionFile`（本次调用对盘面零字节写），stderr 一行 loud，返回 `false`。 */
function refuseManifestWrite(p, reason, preserved = null) {
  noteRefusal(reason, p)
  console.error(`[session] saveManifest: write refused (reason=${reason}) path=${p}${preserved ? ` preserved=${preserved}` : ""}`)
  return false
}

/** 写后钩子缝（§6.25 判据句 5：写后 / 读回前注入；生产零消费）：`fn({ path, tmp })`。 */
let manifestWriteHook = null
export function _setManifestWriteHookForTest(fn) { manifestWriteHook = fn }

/** 账本面写（两路共用 · D-SE65）：独占临时名 + **写后结构读回**（判据单源 = `isTrustedBase`）；不过 ⇒
 *  loud 一行 + 现场改名 `.corrupted`（解封下一写）+ `false`。**非逐字节相等**（并发合法后写会假红——明裁）。 */
function writeManifestBase(p, m) {
  const tmp = writeSessionFile(p, m, { tmpUnique: true })
  manifestWriteHook?.({ path: p, tmp })
  let trusted = false
  try { trusted = isTrustedBase(JSON.parse(readFileSync(p, "utf8"))) } catch { trusted = false }
  if (trusted) return true
  noteRefusal("readback-failed", p)
  console.error(`[session] saveManifest: readback-failed path=${p} preserved=${preserveScene(p)}`)
  return false
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
  // MANIFEST-WRITE-GUARD 批（2026-09-28 · SESSION.md §6.23 判据句 1–3 / D-SE59）：写前分类——只有
  // 「① 合法创建（ENOENT）」与「② 可信合并基座」两路通向 writeSessionFile；文件在盘而基座不可信
  // （读失败 / 解析失败 / 形态非法）⇒ **拒绝写**（不整档替换——#476 实证：读不可信窗口内一次保存把
  // manifest 永久缩水且零告警）。拒写 = stderr 一行 + 返回 false（唯一消费点 = releaseClaimsAll 透传；
  // 其余调用点忽略返回值——零行为变化）；拒写不回滚调用方内存态（认领等内存变更归调用方所有，
  // 下一次保存重试——与 F-XR1 同向的失败容忍形态）。
  const p = manifestPath(cwd)
  let fresh
  try {
    fresh = JSON.parse(readFileSync(p, "utf8"))
  } catch (err) {
    // ① 合法创建：路径不存在（首建）⇒ 以调用方对象建新档（现行为保留）
    if (err?.code === "ENOENT") {
      m.sessionId = getSessionId()
      return writeManifestBase(p, m)
    }
    // (a) 读失败（非 ENOENT：EISDIR / EPERM / EBUSY 等）⇒ 拒写 · 不改名（读不到 ≠ 损坏——现场
    // 原样保留；该窗口正是 #476 缩水损伤的成因窗口）
    if (!(err instanceof SyntaxError)) return refuseManifestWrite(p, "read-failed")
    // (b) 解析失败 ⇒ 拒写 · 保底改名 .corrupted（现场保全 + 解封下一写——原路径不重建）
    return refuseManifestWrite(p, "parse-failed", preserveScene(p))
  }
  // (c) 形态非法（顶层非 null 非数组对象 / `slots` 非对象 / `slotSessions` 非对象）⇒ 同 (b)
  if (!isTrustedBase(fresh)) return refuseManifestWrite(p, "shape-invalid", preserveScene(p))
  // ② 可信合并基座：读-合并-写（条目级合并 / deletions / setActive / opts.release 四判据零改）
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
  m.sessionId = getSessionId()
  return writeManifestBase(p, m)
}

/** 从**内存**认领表移除本进程残留条目（判据③——与写盘同一时机；见 `saveManifest`）。 */
function dropStaleClaims(m, keep) {
  if (!m?.slotSessions) return
  for (const slot of staleClaims(m, keep)) delete m.slotSessions[slot]
}

// ========== 认领面（2026-09-28 拆分外提至 ./session-slot-claims.mjs——见头注）==========
// 认领面族（staleClaims / ownerPid / ownerPids / ownerStateOf / cleanDeadOwners / ensureActive /
// allocateFresh / claimSlot / _releaseStats / releaseClaimsAll / activeSlot）语义原样迁至
// `session-slot-claims.mjs`；本档上方 import 取用（dropStaleClaims）、re-export 保既有 import 面。
export {
  staleClaims, ownerPid, ownerPids, ownerStateOf, cleanDeadOwners,
  allocateFresh, claimSlot, _releaseStats, releaseClaimsAll, activeSlot,
} from "./session-slot-claims.mjs"
