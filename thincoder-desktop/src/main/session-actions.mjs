/**
 * session-actions.mjs — 会话族动作层（`docs/desktop/design/IPC.md` §2 会话族行 · 批档 §2.2（b））：
 * 五通道 + 回执信封 `{ ok, reason: null|string, cwd, slot }`（`slot` = 成功时槽号，否则 `null`）。
 * **零算法副本**：不预校验槽号、不做端层规整 —— 判据与算法单源 = 核（`thincoder-core/session-lifecycle.mjs` /
 * `session-slots.mjs` / `session-rename.mjs`）；本档只做两件端层**整形**（KD-b）：
 *   ① `no-project`（cwd 空 —— 核入口不判 cwd 面；`switch` / `delete` 无此档：cwd 空 ⇒ 核判 `slot-missing`）；
 *   ② `slot-missing`（核回 `null` / `false` 的统一档名；三因 = 非整数槽 / 清单无项 / 数据文件不可读）。
 * 核 `renameSlot` 的 reason 闭集（`invalid-slot|file-missing|parse-failure|mtime-conflict`）**直传**
 * （端层零第二词表）。意外抛**不吞** —— 直传 invoke 拒绝（fail-loud，沿 `config:read` 先例）。
 * 纯逻辑档（零 `electron` 导入 ⇒ 平 node 直测）；`cwd` 取**入参**而非主进程内存态（KD-a：可脱壳直测）。
 * 端参绑定 / 转口单源 = `./session-slots.mjs`（本档零核导入）。
 */
import {
  deleteSlot, newSession, renameSlot, resumeSlot, switchToSlot,
} from "./session-slots.mjs"

/** 成功信封：`slot` = 请求槽号（成功 ⇒ 核已判定其为清单内整数槽；取数 = 信封类型归一 —— 与 `sessions:list`
 *  行 `slot` 同型 ⇒ 渲染面标签键同源）。 */
function ok(cwd, slot) {
  return { ok: true, reason: null, cwd, slot }
}

/** 失败信封（`slot` 恒 `null` —— 失败无成立槽号）。 */
function fail(reason, cwd) {
  return { ok: false, reason, cwd, slot: null }
}

/** cwd 面判据（端层整形之一）：非串 / 空串 ⇒ `no-project`。 */
function blank(cwd) {
  return typeof cwd !== "string" || cwd === ""
}

/** `session:create`（无载荷）：成功 ⇒ 新槽号；cwd 空 ⇒ `no-project`（零写）。
 *  核 `newSession` **async**（入口一次异步束）—— 本函数 async。 */
export async function createSession(cwd) {
  if (blank(cwd)) return fail("no-project", null)
  return ok(cwd, await newSession(cwd))
}

/** `session:switch({ slot })`（同步）：核返回体非 `null` ⇒ 切换成立（清单指针 + 本端记录落点随核）；
 *  `null` ⇒ `slot-missing`。**零端层槽号预校验** —— 非整数槽同判（判据单源 = 核）。 */
export function switchSession(cwd, slot) {
  const data = switchToSlot(cwd, slot)
  return data === null || data === undefined ? fail("slot-missing", cwd) : ok(cwd, Number(slot))
}

/** `session:rename({ slot, title })`：成功判据 = 核 `ok === true`；否则核 reason **直传**（四值闭集）。
 *  `title` 直传核（端层零规整）；cwd 空 ⇒ `no-project`。 */
export function renameSession(cwd, slot, title) {
  if (blank(cwd)) return fail("no-project", null)
  const result = renameSlot(cwd, slot, title)
  if (result?.ok === true) return ok(cwd, Number(slot))
  return fail(result?.reason ?? null, cwd)
}

/** `session:delete({ slot })`：核 `true` ⇒ 删除成立（清单条目 / 槽文件 / 记录存储联动全在核）；`false` ⇒ `slot-missing`。 */
export function deleteSession(cwd, slot) {
  return deleteSlot(cwd, slot) === true ? ok(cwd, Number(slot)) : fail("slot-missing", cwd)
}

/** `session:resume`（无载荷）：恒 `ok` —— 核判据 ①②③ 恒落一个槽号（兜底 `allocateFresh`）；槽数据不随
 *  信封下发（渲染面读面单源 = `sessions:list`）。cwd 空 ⇒ `no-project`。核 `resumeSlot` **async** —— 本函数 async。 */
export async function resumeSession(cwd) {
  if (blank(cwd)) return fail("no-project", null)
  const { slot } = await resumeSlot(cwd)
  return ok(cwd, slot)
}
