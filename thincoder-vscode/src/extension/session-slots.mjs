/**
 * session-slots.mjs — 端壳：端名声明 + 本端记录（end marker）绑定转口（VS Code 端）。
 *
 * W11（CORE-UNIFICATION · VSC 接线 · 2026-09-15）：slot / manifest / 路径 / 属主判定 / 认领面
 * **单源 = 核**（`@thincoder/core/session-slots.mjs` · `session-slots-manifest.mjs` ·
 * `session.mjs`——存储契约 version 1/2 不变：同一
 * `~/.thincoder/sessions/<sha1(cwd)>.json.{N,manifest}`，与 CLI 共文件；旧短哈希迁移面随核
 * `session-migrate` 在位）。
 *
 * SLOT-END-PARAM（2026-09-25 · `docs/core/design/SESSION.md` §6.20 · §6.15 端壳款①）：核 marker
 * 家族按端参数化后，本档原 marker 三式 / `usableSlot` / `resumeSlot` 算法副本**注销归核**
 * ——本档只剩端身份面 + 一行绑定转口：
 *   ① 端名声明：`END = "vscode"` 经 `setSessionEnd(END)` 一次声明（核缺省取值 = 进程端名
 *      `sessionEnd()`——CLI 进程零声明即得 `"cli"`）；
 *   ② 四项绑定转口：`endMarkerPath` / `readEndMarker` / `writeEndMarker` / `resumeSlot`——
 *      一律 `(cwd) => coreX(cwd, END)` 形态（零算法副本；`session-io.mjs` 四维护落点调用零改）；
 *   ③ `sessionsDir` 访问器（核未导出根目录访问器——由核 `sessionPath` 反推，保持单源：
 *      随核 `configDir` 与核 `_setSessionsDirForTest` 沙箱缝走，本档零副本）。
 *
 * 端差注销：消费核 `resumeSlot` 后本端获得核的 legacy 单文件兜底（原副本无此项——两端口径
 * 归一）。NF1 不动：本端记录 = 本端单写者文件（`{manifest}.vscode`）——`createdBy` 这类跨端
 * 事实不进 marker（§6.20 判据句 5）。
 * 探测面（F-MI7 · MULTI-INSTANCE-COLLAB §3.1）：算法副本归核后本档零自有探测、亦不再消费核
 * 探测束——端侧探测消费者 = `peer-instances.mjs` / `session-io.mjs`（`test/zero-sync-exec.test.mjs`
 * 域完整性对账随动收窄）。
 */
import { dirname } from "node:path"
// 本档体内使用（其余核名 = 纯转口，见下 `export … from`）。
import { sessionPath, setSessionEnd } from "@thincoder/core/session-slots.mjs"
import {
  endMarkerPath as coreEndMarkerPath, readEndMarker as coreReadEndMarker,
  writeEndMarker as coreWriteEndMarker, resumeSlot as coreResumeSlot,
} from "@thincoder/core/session-slots.mjs"

// 单源转口（核面——调用方 import 路径与名面不变）：路径 / manifest / 属主 / 认领 / 沙箱缝。
// （原端壳导出名 `writeFile` → 核名 `writeSessionFile`——原子写单点；0 外部消费方。）
export {
  getSessionId, normalizeCwd, sessionPath, slotPath, manifestPath, loadManifest, saveManifest,
  writeSessionFile, slotDigest, isProcessAlive, activeSlot, claimSlot, allocateFresh,
  _setSessionsDirForTest, _resetSessionsDirForTest,
} from "@thincoder/core/session-slots.mjs"
export { slotOccupancy } from "@thincoder/core/session.mjs"

/** 端常量：本端记录文件后缀——VS Code 写 .vscode、CLI 写 .cli，互不触碰（NF1：本端记录是
 *  本端单写者文件——不新增跨端共享可变字段）。 */
export const END = "vscode"

// 端名声明（§6.20 判据句 1）：本进程一次性声明端名——核 marker 家族与核写 marker 的入口
// (`newSession` / `saveSession` / `persistEngTokens`) 缺省取进程端名 ⇒ 不带显式端参的核调用
// 也落本端文件（不跨端互写）。核取值点全在函数体内（核档头注纪律）⇒ 顶层声明不引入环。
setSessionEnd(END)

/** 本端 sessions 根目录（核未导出根访问器——核 `sessionPath` 去掉 hash 文件名即根）。
 *  单源：核 `configDir` 变更与核 `_setSessionsDirForTest` 沙箱缝自动随动（本档零副本）。
 *  消费方 = `peer-domains.mjs`（peers 根 = 其父目录）。 */
export function sessionsDir() {
  return dirname(sessionPath(process.cwd()))
}

// ─── 本端记录（end marker——§6.20 判据句 2/3：端参绑定转口，端壳零副本）────────────

/** 本端记录路径：`{manifest}.{END}`（manifest 旁的独立小文件，非内嵌字段——NF1）。 */
export const endMarkerPath = (cwd) => coreEndMarkerPath(cwd, END)

/** 读本端记录 → `{ slot: <number|null>, updatedAt }` 或 null。三态语义单源 = 核（D-1）：
 *  文件缺失 = 从未记录 / 解析失败 = 按「缺失」降级（不 rename 不 unlink）/ `slot: null` =
 *  显式置空（绝不触发一次性继承）。 */
export const readEndMarker = (cwd) => coreReadEndMarker(cwd, END)

/** 写本端记录（原子 .tmp+rename——核 `writeSessionFile`）：slot = 目标槽号或 null（显式置空）。
 *  失败容忍（NF2，核内语义）：写失败按无记录路径降级——不抛错，不影响会话数据。 */
export const writeEndMarker = (cwd, slot) => coreWriteEndMarker(cwd, slot, END)

/** 恢复决策（D-2）——读**本端**记录，返回 `{ slot, data }`；判据 ①②③ 单源 = 核 `resumeSlot`。
 *  **async**（F-MI7：核入口一次异步束）——调用面 `await` 语义不变。 */
export const resumeSlot = (cwd) => coreResumeSlot(cwd, { end: END })
