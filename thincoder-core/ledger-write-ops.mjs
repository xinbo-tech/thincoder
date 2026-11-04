/**
 * ledger-write-ops.mjs — 台账逐行写核 + 两个批级写点的单源实现（2026-10-27 批拆出）。
 *
 * 为什么拆：`ledger-cmd.mjs` 收尾 455 行，本批要新增 `ledgerBindBatch`（建档 = 建台账行的单事务）与
 * `ledgerReclaimBatch`（重开回收）。两枚都落在 `ledger-cmd` 会把它推过 500 顾问线，而设计档 §3 的
 * 预算是「≈495 行」。本档承接**逐行写核**（迁移表判 → 核销机检 → executor / evidence 语义
 * → 写门 → UPDATE 的那一条链）与两个批级写点；`ledger-cmd.mjs` 反向 import 取用并 re-export，
 * 公共面（`ledger.mjs` 的导出面）逐字不变——先例 = `ledger-close-proof.mjs` / `ledger-tools.mjs`。
 *
 * 依赖单向：`ledger-db` → `ledger-close-proof` → 本档 → `ledger-cmd`（本档不 import 命令面，防环）。
 *
 * 三条硬口径（本档承载，来自设计档 `docs/core/design/BATCH-LEDGER-REVIEW-UNIFY.md`）：
 * ① **不直写 SQL 的落笔面**（§2.4）：建档事务的行写入走 `applyRowUpdateTx` 同一函数体——迁移表 /
 *    写门 / executor 语义一次都不重做；批级写点自己拼的 UPDATE 只覆盖「机器回收」那一类不查迁移表的写
 *    （同收口重锚口径）。
 * ② **落档先于指针写入**（§2.4）：`ledgerBindBatch` 在写指针之前回调 `writeRecord`——写门两形都判
 *    「解析出的档在盘」，先写指针后落档必被自己的门当场拒。
 * ③ **回收只回 `待核销`**（§2.13）：`已核销` 是终态，重开不回收、回执点名；其余状态一律不动。
 */
import { resolve } from "node:path"

import { ALLOWED_MIGRATIONS, nowIso, openLedger, PENDING_STATUSES, resolveLedgerRoot } from "./ledger-db.mjs"
import { resolveDeclaredRef } from "./declaration.mjs"
import { assertCloseOutProof, filePartOf, namesPointer } from "./ledger-close-proof.mjs"

/** 解析基准（设计档 §6.1 口径 2 同一子表达式——与台账库键同源）：`resolveLedgerRoot(cwd, boundary)?.root
 *  ?? resolve(cwd ?? ".")`。`boundary` = 会话锚（与 `openLedger` 同一枚上界——同一笔动作的判据不能两界）。 */
export function baseOf(cwd, boundary) {
  return resolveLedgerRoot(cwd, boundary)?.root ?? resolve(cwd ?? ".")
}

/** 路径同一性比较（win32 大小写不敏感——与 `batch-paths.mjs` / `design-slots.mjs` 同口径）。 */
const pathKey = (p) => {
  const s = String(p ?? "").replace(/\\/g, "/")
  return process.platform === "win32" ? s.toLowerCase() : s
}

// ─── 逐行写核（update / close / bind 共用；判序 = 设计档 §13.9 逐字未变）───────────────────────

/** executor 目标值计算（设计档 docs/core/design/LEDGER.md §3.1——判位在写核体内：迁移表判 → 本语义 → 写门 → UPDATE）。
 *  优先级 = patch 显式 > 自动语义（进边 = executorSessionId / 出边 = NULL）> 行现值兜底 > NULL。
 *  进边集：`待讨论 → 待设计`（批点火边）∥ `待设计 → 在途`（实施入边）∥ `待讨论 → 在途`（2026-10-27
 *  建档边——「需求已确认、当场开工」同样是一次进边，AC-M2-7「进入在途的迁移带 executor」在机器径上
 *  也得成立）。 */
export function resolveExecutorTarget(row, to, patch, executorSessionId) {
  if ((row.status === "待讨论" && to === "待设计") || (row.status === "待设计" && to === "在途") || (row.status === "待讨论" && to === "在途")) {
    return patch.executor ?? executorSessionId ?? row.executor ?? null
  }
  if (row.status === "在途" && (to === "待核销" || to === "已废弃")) {
    return null // 出边自动语义压 patch——显式传 executor 也不复活
  }
  return patch.executor ?? row.executor ?? null
}

/** `evidence` 值计算（设计档 LEDGER.md §13.9——update / close 两函数同源一处落）：追加缺省（旧值非空 ⇒
 *  `旧 + "｜" + 新`——「｜」两侧零空格直接相接；旧空（`null` ∥ 空串 ∥ 全空白）⇒ 直写，零分隔符残留）；
 *  `evidenceReplace === true` 与值同传 ⇒ 整段替换（旧文零保留）；`evidence` 缺 / `null` ≡ 略去（零变）。
 *  拒面①（旗独传——无新文可算）判于本阶段；核内旗判只认 `=== true`（类型严判在工具层）。两值逐字落行
 *  （不裁 / 不判内容）。 */
export function evidenceValue(fnName, oldValue, evidence, evidenceReplace) {
  if (evidenceReplace === true && evidence == null) throw new Error(`${fnName}：evidenceReplace 须与 evidence 同传（缺新文）`)
  if (evidence == null) return oldValue
  const old = oldValue == null || String(oldValue).trim() === "" ? "" : String(oldValue)
  return evidenceReplace === true || old === "" ? evidence : `${old}｜${evidence}`
}

/** 拒面②（新值全空白——追加 ∥ 覆盖两径同判）判点（§13.9 判序）：update 与 close 两面皆随值计算同拍；
 *  `evidence` 未传（`null` / 略去）⇒ 不判。 */
export function assertEvidenceValue(fnName, evidence) {
  if (evidence != null && String(evidence).trim() === "") throw new Error(`${fnName}：evidence 为空（非空字符串）`)
}

/** 写门·指针点名（设计档 §6.1 两臂 · AC-M2-10 ∥ AC-M2-29）：判**本笔写入面**——两臂之外零判。
 *  臂①（点名非空）：结果行 `status ∈ {在途, 待核销}` ∨ 结果行 `trigger = 归批` ⇒ `task_book` 非空
 *  （缺 / 空串 / 全空白 ⇒ 拒「必填」）；**不判在盘**（列值事实，不随盘面翻转——DDL 咬合 CHECK 为该半幅防线）。
 *  臂②（本笔新指名）：本笔新写 `task_book`（非空值）∥ 本笔新写 `trigger = 归批` ⇒ 绑定指针非空 ∧ 文件部分
 *  可解析 ∧ 解析出的档**在盘**（判定单源 = `resolveDeclaredRef`，零二写）。
 *  **「档此刻在不在盘」不入臂①**：批档可随时整体清理 ⇒ 当结果行判据则合法账务被拒、而出路正是被拒字段
 *  （死锁）；存量指针失效只体现为读数 `taskBookOnDisk = false`（§7.1）。 */
export function assertTaskBookGate(cwd, fnName, face, boundary) {
  const { status, trigger, taskBook, wroteTaskBook, wroteBatchTrigger } = face
  if ((status === "在途" || status === "待核销" || trigger === "归批") && !namesPointer(taskBook)) {
    throw new Error(`${fnName}：task_book 必填（在途 / 待核销 / 归批 须携任务书指针）`)
  }
  if (!wroteTaskBook && !wroteBatchTrigger) return // 臂② 之外零判：旧指针所指档已清不阻任何此类写入
  const part = filePartOf(taskBook)
  if (!part) throw new Error(`${fnName}：task_book 不可解析（缺文件部分）：${taskBook}`)
  const base = baseOf(cwd, boundary) // §6.1 口径 2 同一子表达式（单源 = 本档 `baseOf`）
  const { ok, abs } = resolveDeclaredRef(base, part)
  if (!ok) throw new Error(`${fnName}：task_book 指向的档不存在：${taskBook}（解析 = ${abs}）`)
}

/**
 * 单行落笔·update（**单行形 ∥ 批量形 ∥ 建档形共函数**——设计档 §3.3「逐行语义单源」）：迁移表判 →
 * **核销机检**（目标 = `已核销` ⇒ `assertCloseOutProof`——2026-10-27 起 ③ = 档面 §3）→ executor / evidence 值计算
 * （含两拒面）→ 写门 → UPDATE（判序 = §13.9 逐字未变）。`to` = `patch.status ?? 行现态`——批量形纯字段
 * 补丁（不携 `status`）时 `to === row.status` ⇒ 迁移表不判、`status` 零写（§3.3）。
 * `resume_when` = 普通可空字段补丁（`patch.resume_when ?? 行值`——§3.4）。
 * **事务归属**：`tx = true` ⇒ 调用方已开事务（本函数不 BEGIN——嵌套 BEGIN 会当场抛）；缺省 ⇒ 自开
 * `BEGIN IMMEDIATE` 包一条 UPDATE（半途抛 ⇒ 行零改）。
 */
export function applyRowUpdateTx(db, cwd, row, patch, executorSessionId, boundary, proof = {}) {
  const to = patch.status ?? row.status
  if (to !== row.status && !(ALLOWED_MIGRATIONS[row.status] ?? []).includes(to)) {
    throw new Error(`ledgerUpdate：迁移 ${row.status} → ${to} 不在允许迁移表`)
  }
  // 核销机检（F-LX4）：目标值 = `已核销` ⇒ 写库前三件校验（批档在盘 ∥ §1 已收口 ∥ §3 = 评审通过）
  if (to === "已核销") assertCloseOutProof("ledgerUpdate", { base: proof.base ?? baseOf(cwd, boundary), row })
  const nextExecutor = resolveExecutorTarget(row, to, patch, executorSessionId)
  const nextEvidence = evidenceValue("ledgerUpdate", row.evidence, patch.evidence, patch.evidenceReplace)
  assertEvidenceValue("ledgerUpdate", patch.evidence)
  const nextTaskBook = patch.task_book ?? row.task_book
  assertTaskBookGate(cwd, "ledgerUpdate", {
    status: to,
    trigger: patch.trigger ?? row.trigger,
    taskBook: nextTaskBook,
    wroteTaskBook: namesPointer(patch.task_book),
    wroteBatchTrigger: patch.trigger === "归批",
  }, boundary) // → 写门 → UPDATE
  const now = nowIso()
  db.prepare(`UPDATE items SET status = ?, title = ?, board = ?, req_doc = ?, task_book = ?, evidence = ?, trigger = ?, resume_when = ?, executor = ?, updated_at = ? WHERE id = ?`)
    .run(to, patch.title ?? row.title, patch.board ?? row.board, patch.req_doc ?? row.req_doc, nextTaskBook, nextEvidence, patch.trigger ?? row.trigger, patch.resume_when ?? row.resume_when, nextExecutor, now, row.id)
  return { id: Number(row.id), status: to }
}

/**
 * 单行落笔·update（外层不持事务的调用面）：`tx` 缺省 ⇒ 自开事务包裹 `applyRowUpdateTx`；
 * `tx = true` ⇒ 直接透传（调用方自己的事务边界说了算——`ledgerUpdateBatch` / `ledgerBindBatch`）。
 */
export function applyRowUpdate(db, cwd, row, patch, executorSessionId, boundary, proof = {}, tx = false) {
  if (tx) return applyRowUpdateTx(db, cwd, row, patch, executorSessionId, boundary, proof)
  db.exec("BEGIN IMMEDIATE")
  try {
    const out = applyRowUpdateTx(db, cwd, row, patch, executorSessionId, boundary, proof)
    db.exec("COMMIT")
    return out
  } catch (e) {
    try { db.exec("ROLLBACK") } catch { /* 事务未开 / 已结 */ }
    throw e
  }
}

/** 核销拒文的出路句（设计档 §3 三行表逐字）：同一件事实（核销只自 `待核销` 出）、出路按现态分支——
 *  对 `在途` 说「先 update 到 在途 认领」是让人重做一步已做过的事。归档态那支不是新分支：改前同一输入
 *  也走首判并拒（旧判据本就不含归档态），行为零改，只把这句兜底话换准。 */
function closeExitSentence(status) {
  if (status === "在途") return "先 update 到 待核销（做完才结账），再 close 勾销"
  if (status === "已核销" || status === "已废弃") return `该行已归档（${status}），不在核销面`
  return "先 update 到 在途 认领，再 update 到 待核销，最后 close 勾销"
}

/** 单行落笔·close（**单行形 ∥ 批量形共函数**——设计档 §3.3「逐行语义单源」）：源态判（**核销只有一条边**——
 *  `待核销 → 已核销`；其余现态一律拒，拒文点名现态 + 该现态的出路句）→ **核销机检**（`已核销` ⇒ `assertCloseOutProof`）→ 值计算
 *  （拒面① 旗独传判于此）→ 拒面② → UPDATE。旧的 `待讨论 / 待设计 → 已核销` 捷径边已删（2026-11-02）：
 *  那条边跳过的不是权限，是四个状态各自代表的事实（没设计、没认领、没验证的行不得显示为已结账）。
 *  撤回（任意态 → 已废弃——含在途直撤）同步 `executor = NULL`（LEDGER.md §3.1 ④）；核销（`待核销 → 已核销`）
 *  `executor` 零触碰（非在途出边）。调用方恒已开事务（`ledgerClose` / `ledgerCloseBatch`）。 */
export function applyRowClose(db, row, status, evidence, evidenceReplace, proof = {}) {
  if (status === "已核销" && row.status !== "待核销") throw new Error(`ledgerClose：核销仅限 待核销（现态 ${row.status}）：${closeExitSentence(row.status)}`)
  // 核销机检（F-LX4）：判序 = 源态判之后、值计算之前
  if (status === "已核销") assertCloseOutProof("ledgerClose", { base: proof.base, row })
  const nextEvidence = evidenceValue("ledgerClose", row.evidence, evidence, evidenceReplace)
  assertEvidenceValue("ledgerClose", evidence) // 判序：拒面②（新值空白）→ UPDATE
  const now = nowIso()
  db.prepare("UPDATE items SET status = ?, closed_at = ?, updated_at = ?, executor = ?, evidence = ? WHERE id = ?").run(status, now, now, status === "已废弃" ? null : row.executor, nextEvidence, row.id)
  return { id: Number(row.id), status }
}

// ─── 批级写点（建档绑定 · 重开回收；与收口重锚同形对称）────────────────────────────────

/** `batch` 入参自身门（设计档 §3.3 · fail-closed）：值自身须**可解析**（含非空文件部分）∧ 解析后批档
 *  **在盘** ⇒ 否则拒（零写）。判的是**本笔指名**的那一笔——与 §6.1 臂② 同一律、不同字段。
 *  @returns {string} 批档绝对路径（解析基准 = `base`） */
export function assertBatchArg(fnName, base, batch) {
  const part = filePartOf(batch)
  const hit = part === "" ? { ok: false, abs: "" } : resolveDeclaredRef(base, part)
  if (!hit.ok) throw new Error(`${fnName}：batch 不可解析或不在盘（${batch}）`)
  return hit.abs
}

/** 批 → 行集（选行**单源** · 设计档 §3.3）：`task_book` 文件部分经 `resolveDeclaredRef` 解析为与批档
 *  **同一绝对路径**的行（任意状态、含归档态）。判据 = 解析同址而非串等值（同批档三种指针写法并存——
 *  无后缀 / `§2` / `§1.5（括注）`，串等值会漏行）。 */
export function resolveBatchRows(db, base, abs) {
  return db.prepare("SELECT * FROM items ORDER BY id").all()
    .filter((r) => { const part = filePartOf(r.task_book); return part !== "" && resolveDeclaredRef(base, part).abs === abs })
}

/** 建档绑定拒文（逐字 = 设计档 §2.4；三形各一条）。 */
const bindMissingError = (n) => `batch: ledger entry #${n} does not exist in this project's ledger — pass an existing number, or omit ledger and let create open a new row. Nothing was written.`
const bindArchivedError = (n, status) => `batch: ledger entry #${n} is ${status} — an archived row cannot carry a new batch record (open a new row instead). Nothing was written.`
const bindOwnedError = (n, path) => `batch: ledger entry #${n} is 在途 and its task_book points at ${path} — another batch owns it; a record may take over a row only when its task_book points at this record. Nothing was written.`
const bindSettledError = (n) => `batch: ledger entry #${n} is 待核销 — a row already settled to 待核销 cannot carry a new batch record (reopen the record that owns it with batch status, or open a new row instead). Nothing was written.`

// ─── 开批同面判（设计档 §6.3 · AC-M2-37；判点 = 写形开户之前）──────────────────────────

/** 新事理由的 `evidence` 前缀（单源 = 设计档 §6.3「参数面」；写入侧造前缀、收口侧按同一字面取文——
 *  读面对 = `thincoder-core/agent-tools/batch-closeout.mjs` 的 `newDebtReasonOf`，两处同一字面、
 *  不进公共导出面）。 */
const NEW_DEBT_EVIDENCE_PREFIX = "新事理由："
/** 候选逐行上限（§6.3「上限」——超出改出计数句；一眼读完才叫「见该接哪行」）。 */
const SAME_FACE_LIST_LIMIT = 10

/** 面归一等（§6.3「面 = 本笔 `board`」）：缺省 / 空串 / 全空白 ⇒ `null` = **无板面**（`board IS NULL`）。 */
const faceOf = (board) => {
  const v = board == null ? "" : String(board).trim()
  return v === "" ? null : v
}

/** 同行是否在本面（**等值口径同 §7.1 `board` 过滤——零新口径**）：无板面 = `board IS NULL`（严格 NULL，
 *  不是「空白串也算无板面」）；有板面 = 与行值严格相等（SQL `board = ?` 的同一判等）。 */
const onSameFace = (rowBoard, face) => (face === null ? rowBoard == null : rowBoard === face)

/** 同携拒文（逐字 = 设计档 §6.3 第二段围栏；`newDebt` 与 `ledger` 语义互斥）。 */
const newDebtAndLedgerError = () => `batch: newDebt and ledger are mutually exclusive — take over a debt already in the pool with ledger:"#N"; declare a new debt with newDebt:"<reason>". Both together is ambiguous. Nothing was written.`

/**
 * 同面拒文（逐字 = 设计档 §6.3 第一段围栏）：首行点名面与未决数 + 逐行候选（`id` 升序、至多 10 行）+
 * 截断时的计数句与自取命令 + 收尾 `Nothing was written.`。无板面 ⇒ 面名 `no board`，自取句不带
 * `board` 参数（无板面没有板名可填；不带过滤的查询回全池，余数仍准）。
 * @param {string|null} face — 面（`null` = 无板面）
 * @param {{id:number, status:string, title:string}[]} candidates — 本面未决行（`id` 升序）
 */
function sameFaceRefusal(face, candidates) {
  const shown = candidates.slice(0, SAME_FACE_LIST_LIMIT)
  const rest = candidates.length - shown.length
  const lines = [
    `batch: ${candidates.length} unsettled row(s) already exist on this face — create refuses to open a new ledger row silently (face = ${face ?? "no board"}). Either take one over with ledger:"#<id>", or declare a genuinely new debt with newDebt:"<one line: why it is not one of these>". Candidates:`,
    ...shown.map((r) => `  #${r.id} ${r.status} ${r.title}`),
  ]
  if (rest > 0) {
    lines.push(face === null
      ? `… ${rest} more not listed — read the rest with the ledger tool (action query).`
      : `… ${rest} more not listed — read the rest with the ledger tool (action query, board:"${face}").`)
  }
  lines.push("Nothing was written.")
  return lines.join("\n")
}

/**
 * 同面取集（设计档 §6.3「候选行集与次序」）：`ledgerQuery` 取全行、核内按面与状态筛——零新 SQL、
 * 零新导出。取集走**读形**开户（`ledgerQuery` 内部 `openLedger(readOnly)` ⇒ `create` 缺省假、库档不在
 * 即返空集），故此步不建库档。`ledger-cmd` 反向 import 本档（防环）⇒ 此处动态 import。
 * @returns {Promise<{n:number, m:number, candidates:object[]}>} 本面未决数 ∥ 他面未决数（读数）∥ 候选
 */
async function sameFaceScan({ cwd, boundary, face }) {
  const { ledgerQuery } = await import("./ledger-cmd.mjs")
  const pending = ledgerQuery({ cwd, boundary }).filter((r) => PENDING_STATUSES.includes(r.status))
  const mine = pending.filter((r) => onSameFace(r.board, face))
  // 排序即判据（§6.3）：`id` 升序 = 最老欠条优先（与 §3.7 出口面 `aged` 同轴）——候选表读作「从上往下先看」
  mine.sort((a, b) => Number(a.id) - Number(b.id))
  return { n: mine.length, m: pending.length - mine.length, candidates: mine }
}

/**
 * 建档 = 建台账行（设计档 §2.4——单事务在台账侧，档写在事务窗口内，**落档先于指针写入**）：
 *   `BEGIN IMMEDIATE` → （新建）INSERT 一行 `待讨论`（无指针；`trigger` 不填——`trigger=归批` 与
 *   `task_book` 同在下一步一笔写，否则臂① 会把无指针的行当场拒）→ `writeRecord(#N)` 写批档 →
 *   `applyRowUpdateTx` 迁 `在途` + 写 `task_book`（过写门）→ `COMMIT`。接管路径同一条道理：`#N` 已知 →
 *   `writeRecord` → `applyRowUpdateTx` → `COMMIT`。
 *
 * 崩在窗口内（行已 INSERT ∥ 已改、`COMMIT` 未执行、档已落盘）：SQLite 回滚事务 ⇒ 行回原态；档留在盘上而
 * 台账里没有它的行（写锁只问「这个项目里有没有 `在途` 行」，不读指针——设计档 §2.3）。清理只删**本笔所建**的档（`created` 由调用方按返回值判断——`wx` 撞已有
 * 同名档时抛 EEXIST，无条件 unlink 会删掉别人的档）。
 *
 * **开批同面判**（设计档 §6.3 · AC-M2-37）：省略 `ledger` ∧ 同面（本笔 `board`；未给 ⇒ `board IS NULL`）
 * 存在未决四态行 ⇒ 必须显式声明 `newDebt:"<一句理由>"`，否则**在写形开户之前**拒（逐行列候选）。
 * 因此「零写 = 二件」（无行写入 ∥ 无批档写入）是结构挣来的，不靠判后回滚；判前取集走读形开户，不建库档。
 * 理由落本笔新开行的 `evidence`（前缀 `新事理由：`）；`ledger:"#N"` 在场 ⇒ 本节零判（接手路径零回归）。
 * @param {{cwd:string, ledgerNo:number|null, newDebt:string|null, targetAbs:string, taskBook:string, title:string,
 *   kind:string, board:string|null, boundary?:string, executorSessionId?:string|null, agent?:object}} o
 *   `newDebt` = 非空字符串（为什么这不是候选里那几条）；空串 ∥ 全空白 ⇒ 按未给判；与 `ledger` 同携 ⇒ 拒。
 * @param {(id:number)=>void} writeRecord — 写批档（`wx` 独占创建；真实行号已可得）
 * @returns {Promise<{id:number, created:boolean, tookOver:"new"|"discussed"|"designed"|"live",
 *   sameFace:{face:string|null, n:number, m:number, declared:string|null}|null}>} `sameFace` = 同面判读数
 *   （`null` = 接手路径）；`n` = 本面未决数 · `m` = 他面未决数（读数，不拦）· `declared` = 声明的新事理由
 */
export async function ledgerBindBatch({ cwd, ledgerNo = null, newDebt = null, targetAbs, taskBook, title, kind = "tech_todo", board = null, boundary, executorSessionId = null, agent = {} }, writeRecord) {
  const face = faceOf(board)
  const newDebtReason = typeof newDebt === "string" && newDebt.trim() !== "" ? newDebt.trim() : null // 空串 ∥ 全空白 ⇒ 按未给判
  if (ledgerNo != null && newDebtReason) throw new Error(newDebtAndLedgerError()) // 语义互斥：`ledger` 在场即接手，不是新事
  // 开批同面判（§6.3）：判点 = 写形开户之前；`ledger` 在场 ⇒ 本节零判（接手路径零回归）
  const scan = ledgerNo == null ? await sameFaceScan({ cwd, boundary, face }) : null
  if (scan && scan.n > 0 && !newDebtReason) throw new Error(sameFaceRefusal(face, scan.candidates))
  const sameFace = scan ? { face, n: scan.n, m: scan.m, declared: newDebtReason } : null
  const db = openLedger(cwd, { create: true, boundary })
  try {
    const base = baseOf(cwd, boundary)
    db.exec("BEGIN IMMEDIATE")
    try {
      let row = null
      let id = null
      let created = false
      if (ledgerNo == null) {
        // 步 2：先落一行不带指针的 `待讨论`（`在途` 被 DDL 咬合 CHECK 强制非空指针）+ `trigger` 不填；
        // 声明新事者同拍带理由入 `evidence`（步 4 的值计算在 `patch.evidence` 缺省时保留行现值）
        const now = nowIso()
        const r = db.prepare(`INSERT INTO items (kind, status, title, board, evidence, created_at, updated_at) VALUES (?, '待讨论', ?, ?, ?, ?, ?)`)
          .run(kind, title, board, newDebtReason ? `${NEW_DEBT_EVIDENCE_PREFIX}${newDebtReason}` : null, now, now)
        id = Number(r.lastInsertRowid)
        created = true
        row = db.prepare("SELECT * FROM items WHERE id = ?").get(id)
      } else {
        id = Number(ledgerNo)
        row = db.prepare("SELECT * FROM items WHERE id = ?").get(id)
        if (!row) throw new Error(bindMissingError(id))
        if (row.status === "已核销" || row.status === "已废弃") throw new Error(bindArchivedError(id, row.status))
        if (row.status === "待核销") throw new Error(bindSettledError(id))
        if (row.status === "在途") {
          const part = filePartOf(row.task_book)
          const hit = part === "" ? { ok: false, abs: "" } : resolveDeclaredRef(base, part)
          if (!hit.ok || pathKey(hit.abs) !== pathKey(targetAbs)) throw new Error(bindOwnedError(id, row.task_book))
          // 接管（不动状态、零台账写）：档可能已不在盘（残留态）——照写一次 `wx`，撞已有档时由调用方报
          writeRecord(id)
          db.exec("COMMIT")
          return { id, created: false, tookOver: "live", sameFace }
        }
      }
      // 步 3：落档——必须先于步 4（写门两形都判「解析出的档在盘」）
      writeRecord(id)
      // 步 4：行写入走同一函数体（迁移表 → 机检 → executor → 写门 → UPDATE），不直写 SQL
      applyRowUpdateTx(db, cwd, row, { status: "在途", task_book: taskBook, trigger: "归批" }, executorSessionId, boundary, { base, agent })
      db.exec("COMMIT")
      return { id, created, tookOver: created ? "new" : row.status === "待设计" ? "designed" : "discussed", sameFace }
    } catch (e) {
      try { db.exec("ROLLBACK") } catch { /* 事务未开 / 已结 */ }
      throw e
    }
  } finally { db.close() }
}

/** 重开回收回执的三种行（设计档 §2.13）。 */
const reclaimResult = (batch, { reclaimed = [], unreclaimable = [], failed = null } = {}) => ({ batch, reclaimed, unreclaimable, failed })

/**
 * 重开回收（设计档 §2.13——收口的反面）：批档重开（`§1` 从 `已收口` 回 `进行中`）时，本批 `待核销` 行
 * 回到 `在途`（行回工作位，活继续在这一行上——`§2.2` 三合取当场成立）；`已核销` 不动（终态，行上挂着
 * 结账证据），入 `unreclaimable` 由回执点名；其余状态一律不动、不点名。
 *
 * 与 `ledgerReanchorBatch` 同形对称：同一行集 `resolveBatchRows`（行集判据单源）、`BEGIN IMMEDIATE`
 * 单事务、失败 `ROLLBACK` 零行改、**不抛**（返回形 `failed`）。
 * `trigger` / `resume_when` / `evidence` / `updated_at` **零触**（机器回收不是人工推进，行龄读数照旧）；
 * `executor` = 本会话 `sessionId`（行回工作位、干活的就是重开会话——AC-M2-7 在机器径上也成立）。
 * @returns {{batch:string, reclaimed:{id:number,status:string,title:string}[], unreclaimable:{id:number,status:string,title:string}[], failed:string|null}}
 */
export function ledgerReclaimBatch({ cwd, batch, boundary, executorSessionId = null } = {}) {
  const derived = cwd == null ? null : resolveLedgerRoot(cwd, boundary)
  if (!derived) return reclaimResult(batch, { failed: "批档所属项目根不可推导" })
  const base = derived.root
  let db
  try { db = openLedger(base, { boundary }) } catch (e) { return reclaimResult(batch, { failed: String(e?.message ?? e) }) } // 库不可开 ⇒ 零写报因
  if (!db) return reclaimResult(batch) // 库不在 ⇒ 零行可回收
  try {
    let abs
    try { abs = assertBatchArg("ledgerReclaimBatch", base, batch) } catch (e) { return reclaimResult(batch, { failed: String(e?.message ?? e) }) }
    try {
      db.exec("BEGIN IMMEDIATE")
      const reclaimed = [], unreclaimable = []
      for (const row of resolveBatchRows(db, base, abs)) {
        const face = { id: Number(row.id), status: row.status, title: row.title }
        if (row.status === "已核销") { unreclaimable.push(face); continue }
        if (row.status !== "待核销") continue // 其余（条件 / 待讨论 / 待设计 / 已废弃 / 在途）不动、不点名
        db.prepare("UPDATE items SET status = ?, executor = ? WHERE id = ?").run("在途", executorSessionId, row.id)
        reclaimed.push(face)
      }
      db.exec("COMMIT")
      return reclaimResult(batch, { reclaimed, unreclaimable })
    } catch (e) {
      try { db.exec("ROLLBACK") } catch { /* 事务未开 / 已结 */ }
      return reclaimResult(batch, { failed: String(e?.message ?? e) })
    }
  } finally { db.close() }
}
