/**
 * session-slots.mjs — 端壳：端名声明 + 本端记录（end marker）绑定转口 + 会话清单消费 + 历史页读面 /
 * 会话级偏好写面（桌面端）。
 *
 * 单源 = 核（`@thincoder/core/session-slots.mjs` / `session.mjs` / `session-slot-write.mjs`）：
 * 存储契约与算法全在核 —— 本档只有端身份面与绑定转口，**零算法副本**（读源判据 = 零文件系统
 * 直读 ∧ 零就地解析；先例 = `thincoder-vscode/src/extension/session-slots.mjs`）：
 *   ① 端名声明：`END = "desktop"` 经 `setSessionEnd(END)` 一次声明（核缺省取值 = 进程端名
 *      `sessionEnd()` —— CLI 进程零声明即得 `"cli"`）；
 *   ② 转口八项（判据分层 —— 端参绑定 6 / 同形转口 1 / 纯 re-export 1）：端参绑定 = `endMarkerPath` /
 *      `readEndMarker` / `writeEndMarker` / `resumeSlot` / `switchToSlot` / `deleteSlot` —— 一律
 *      `(…) => 核同名(…)` 形态、端参取本档 `END`（`resumeSlot` 走 `{ end: END }`、async；`switchToSlot` /
 *      `deleteSlot` 走末位端参、同步）；**同形转口** = `newSession`（核 marker 写**无端参** ⇒ 端名由本档
 *      声明覆盖，端层不传端参）；**纯 re-export** = `renameSlot`（端无关、不碰 marker）；
 *   ③ `sessionsDir()` 访问器（核未导出根目录 —— 由核 `sessionPath` 反推，随核 `configDir`
 *      与核沙箱缝自动随动，本档零副本）；
 *   ④ 历史页读面（本批增）：`pageHistory` —— 槽读转口核 `loadSlotFile`、窗口切分转口核 `historyWindow`
 *      （页尺 = 核常量 `HISTORY_PAGE_SIZE`；端层只做页游标注与元信息面 ⇒ 零算法副本）；
 *   ⑤ 会话级偏好写面（本批增）：`writeSlotPrefs` —— 核 `setSlotPrefs` 转口（键闭集 / 值归一 / 原子写皆
 *      在核）+ 回读 `loadSlotFile` 经 `slotMeta` 出串（回执 `meta` 与 `history:page` **同源同形**）；
 *   ⑥ 打开态播种面（桌面残余批 · D17）：`pageHistory` 首屏回执携 `seed` —— `tasks` = 槽数据直取、
 *      `usage` = 核 `sessionReading` 投影（读数算法全在核）；端层只做出参装配（`loadConfig()` →
 *      `providersList` / `provider`）与有效门（数字 ∧ `> 0`）⇒ 零算法副本（形态 / 在场 / 缺席降级单源 =
 *      `docs/desktop/design/IPC.md` §2「打开态播种注」）。
 *
 * 载入序不变量（批档 §2.4（a））：核 `newSlotData(cwd)` 的 `createdBy = sessionEnd()`
 * （`thincoder-core/session-slot-write.mjs:46`）⇒ 端名声明必须先于任何物化写。本档声明是模块级
 * 副作用（求值期一次）；凡经顶层静态 import 链抵达本档的进程都已完成声明（链 =
 * `main.mjs → ipc.mjs → projects.mjs → session-slots.mjs`）。
 * 端差注销：本端记录 = 本端单写者文件（`{manifest}.desktop`）——与 `.cli` / `.vscode` 互不触碰（NF1）。
 */
import { dirname } from "node:path"
// 本档体内使用（其余核名 = 纯转口，见下 `export … from`）。
import { sessionPath, setSessionEnd } from "@thincoder/core/session-slots.mjs"
import {
  endMarkerPath as coreEndMarkerPath, readEndMarker as coreReadEndMarker,
  writeEndMarker as coreWriteEndMarker, resumeSlot as coreResumeSlot,
} from "@thincoder/core/session-slots.mjs"
// 会话族核门（本批增 —— 三名皆在 `@thincoder/core/session.mjs` re-export：`:41` / `:52`；`renameSlot` 见下 re-export 面）。
// 打开态读数（桌面残余批 · §6.24）：同一 re-export 面 `:52`——端层只装配入参。
import {
  newSession as coreNewSession, switchToSlot as coreSwitchToSlot, deleteSlot as coreDeleteSlot,
  loadSlotFile, sessionReading,
} from "@thincoder/core/session.mjs"
// 装配面（打开态播种出参）：`providersList` / `provider` 两值由核 `loadConfig` 出（单源）。
import { loadConfig } from "@thincoder/core/config.mjs"
// 历史页读面（本批增）：窗口切分与页尺的**单源**在核。
import { HISTORY_PAGE_SIZE, historyWindow } from "@thincoder/core/history-window.mjs"
// 会话级偏好写面（本批增）：核写口转口 —— 本档零算法副本（只补回读投影）。
import { setSlotPrefs as coreSetSlotPrefs } from "@thincoder/core/session-slot-write.mjs"

// 单源转口（核面 —— 调用方 import 路径与名面不变）：路径 / manifest / 写 / 摘要 / 认领 / 沙箱缝。
export {
  sessionPath, slotPath, manifestPath, loadManifest, saveManifest, writeSessionFile, slotDigest,
  activeSlot, claimSlot, allocateFresh, _setSessionsDirForTest, _resetSessionsDirForTest,
} from "@thincoder/core/session-slots.mjs"
// 会话清单消费（`createdBy` 有值才带 —— 核投影口径；`docs/desktop/design/UI.md:38,40`）+ 槽重命名纯 re-export。
export { listSlots, slotOccupancy, renameSlot } from "@thincoder/core/session.mjs"
export { newSlotData } from "@thincoder/core/session-slot-write.mjs"

/** 端常量：本端记录文件后缀 —— 桌面端写 `.desktop`（NF1：本端记录是本端单写者文件）。 */
export const END = "desktop"

/** 端名声明（§6.20 判据句 1）：一次、模块求值期 —— 核 marker 家族与物化入口缺省取之。 */
setSessionEnd(END)

/** 本端 sessions 根目录（核未导出根访问器 —— 核 `sessionPath` 去掉 hash 文件名即根）。
 *  单源：核 `configDir` 变更与核 `_setSessionsDirForTest` 沙箱缝自动随动（本档零副本）。 */
export function sessionsDir() {
  return dirname(sessionPath(process.cwd()))
}

// ─── 本端记录（end marker —— §6.20 判据句 2/3：端参绑定转口，端壳零副本）────────────

/** 本端记录路径：`{manifest}.desktop`（manifest 旁的独立小文件，非内嵌字段 —— NF1）。 */
export const endMarkerPath = (cwd) => coreEndMarkerPath(cwd, END)

/** 读本端记录 → `{ slot: <number|null>, updatedAt }` 或 null。三态语义单源 = 核：
 *  缺失 = 从未记录 / 解析失败 = 按缺失降级 / `slot: null` = 显式置空（绝不触发一次性继承）。 */
export const readEndMarker = (cwd) => coreReadEndMarker(cwd, END)

/** 写本端记录（原子 .tmp+rename —— 核 `writeSessionFile`）：`slot = null` = 显式置空；
 *  失败按无记录降级（NF2，核内语义）—— 不抛、不影响会话数据。 */
export const writeEndMarker = (cwd, slot) => coreWriteEndMarker(cwd, slot, END)

/** 恢复决策：读**本端**记录 → `{ slot, data }`；判据 ①②③ 单源 = 核 `resumeSlot`（恒落一个槽号——
 *  兜底 `allocateFresh`）。**async**（核入口一次异步束）—— 调用面须 `await`。 */
export const resumeSlot = (cwd) => coreResumeSlot(cwd, { end: END })

/** 新建会话（同形转口）：核 `newSession` 的 marker 写（核 `session-lifecycle.mjs:245`）**无端参** ⇒ 端名由
 *  本档声明（`:41`）覆盖 —— 端层不传端参。**async**（核入口一次异步束）；返回 = 新槽号。 */
export const newSession = (cwd) => coreNewSession(cwd)

/** 槽切换（端参绑定）：核 `switchToSlot` 的 marker 写（核 `session-lifecycle.mjs:306`）走末位端参 ⇒ 绑 `END`。
 *  同步；返回体 = 槽数据 ∥ `null`（非整数槽 / 清单无项 / 数据文件不可读 —— 核 `:291-293` 三因同档）。 */
export const switchToSlot = (cwd, slot) => coreSwitchToSlot(cwd, slot, { end: END })

/** 槽删除（端参绑定）：核 `deleteSlot`（核 `session-slots.mjs:225`）→ bool；`:239` 读本端记录命中即显式
 *  置空（写端参）⇒ 端层绑 `END`（NF1：本端记录 = 本端单写者文件）。 */
export const deleteSlot = (cwd, slot) => coreDeleteSlot(cwd, slot, { end: END })

// ─── 历史页读面（本批增 —— `docs/desktop/design/IPC.md`:52 / §2 会话族）──────────────

/** 会话键 → 槽号（`String(slot)` —— 十条 `ev:*` 通道与 `msg:*` / `history:page` / `session:prefs` 同键面）：十进制串才认；
 *  坏键 ⇒ null（调用面转 `{ok:false,reason:"bad-key"}`）。**单源**：`agent-host.mjs` 引本导出。 */
export function slotOfKey(key) {
  const raw = typeof key === "string" ? key.trim() : ""
  return /^\d+$/.test(raw) ? Number(raw) : null
}

/** 会话元信息（回执面）：五键**只落非空串**（UI.md §1 会话头行「字段值由**供给面出串**」——消费面
 *  `views/chrome.mjs:8-9` 判据 = 非串 / 空串 ⇒ 零节点）⇒ 两布尔槽在此出词（`ON` / `OFF`，词形同核
 *  `cmd-eng.mjs:72` / `cmd-auto.mjs:9`）；键缺（老槽）⇒ 零节点（不猜形）。
 *  `effort` 值只由本槽字段出串（会话级写面记录 —— 未设 ⇒ 零节点，**不回落**配置面：PROJECT.md T-DSK28）。 */
function slotMeta(data) {
  const meta = {}
  const str = (v) => (typeof v === "string" && v.trim() ? v : null)
  const put = (k, v) => {
    if (v !== null && v !== undefined) meta[k] = v
  }
  put("provider", str(data.activeProvider))
  put("model", str(data.activeModel))
  put("effort", str(data.effort))
  const flag = (v) => (typeof v === "boolean" ? (v ? "ON" : "OFF") : null)
  put("engineering", flag(data.engineering))
  put("autoApprove", flag(data.autoApprove))
  return meta
}

/** 打开态播种面（`history:page` 回执 `seed` —— 形态 / 在场 / 缺席降级单源 = `docs/desktop/design/IPC.md`
 *  §2「打开态播种注」）：`tasks` = 槽数据直取（非数组 ⇒ `[]`——沿核水合口径 `data.tasks ?? []`）；
 *  `usage` = 核 `sessionReading` 打开态读数（有效门 = 数字 ∧ `> 0`——否则键缺席，沿 `ev:usage` 同门）；
 *  配置不可读 / 读数计算抛 ⇒ `usage` 键缺席 + `console.error`（零静默；读面保持 fail-soft）。 */
function openingSeed(data) {
  const seed = { tasks: Array.isArray(data.tasks) ? data.tasks : [] }
  try {
    const config = loadConfig()
    const percent = sessionReading(data, { providers: config.providersList, fallback: config.provider })
    if (typeof percent === "number" && percent > 0) seed.usage = percent
  } catch (error) {
    console.error("[session-slots] opening reading unavailable:", error)
  }
  return seed
}

/** `history:page(payload)` 读面：载荷 `{ key, before }` ⇒ `{ ok:true, messages, hasOlder, next, meta, seed? }`；
 *  坏键 / 槽缺（含坏档、异项目档 —— 核 `loadSlotFile` 三因同出口回 null）⇒ `{ ok:false, reason }`
 *  （码 = `bad-key` / `slot-missing`，单源 `docs/desktop/design/IPC.md`:52；**不抛** —— 读面 fail-soft）。
 *  窗口切分 = 核 `historyWindow`（页尺缺省 = 核常量）；`next` = 更旧一页的 `before`（`hasOlder === false ⇒ null`）。
 *  `seed` = 打开态播种面：**仅首屏读**（`before == null`）在场——回填读不携（防回填以盘上旧值覆盖活切片）。 */
export function pageHistory(cwd, payload) {
  const slot = slotOfKey(payload?.key)
  if (slot === null) return { ok: false, reason: "bad-key" }
  const data = loadSlotFile(cwd, slot)
  if (!data) return { ok: false, reason: "slot-missing" }
  const history = Array.isArray(data.history) ? data.history : []
  const before = payload?.before ?? null
  const { messages, hasOlder } = historyWindow(history, before)
  const total = history.length
  const end = before == null ? total : Math.max(0, Math.min(before, total))
  const next = hasOlder ? Math.max(0, end - HISTORY_PAGE_SIZE) : null
  const receipt = { ok: true, messages, hasOlder, next, meta: slotMeta(data) }
  if (before == null) receipt.seed = openingSeed(data)
  return receipt
}

// ─── 会话级偏好写面（本批增 —— T-DSK28 · `docs/desktop/design/IPC.md` §2「会话级偏好注」项 2/4/7）──────────

/** `writeSlotPrefs(cwd, slot, patch)` ⇒ `{ ok:true, meta }` ∥ `{ ok:false }`（**写入未发生** —— 理由分档在
 *  动作层 `agent-host.mjs` `setPrefs`）：写盘单源 = 核 `setSlotPrefs`（键闭集 / 值归一 / 原子写皆在核）；
 *  回读 = 同档 `loadSlotFile` ⇒ `meta` 与 `history:page` **同源同形**（同一 `slotMeta` 投影 —— 两通道口径
 *  不分叉）。失败径**无 `meta` 键**（IPC.md §2「会话级偏好注」项 7）；回读失败（写已发生而档不可读）⇒ 直抛
 *  （矛盾态 fail-loud，不吞）。 */
export function writeSlotPrefs(cwd, slot, patch) {
  if (!coreSetSlotPrefs(cwd, slot, patch)) return { ok: false }
  const data = loadSlotFile(cwd, slot)
  // 写已发生而档不可读 = 矛盾态 ⇒ fail-loud（**显式判** —— 不倚仗 `slotMeta(null)` 的解引用抛）
  if (!data) throw new Error(`[session-slots] slot unreadable after prefs write: ${slot}`)
  return { ok: true, meta: slotMeta(data) }
}
