/**
 * agent/write-gate.mjs — M4 写权门禁（评审目标解析 + D5 冻结窗口判据组装 + 写锁）。
 *
 * v2 唯一增量（模块设计 §2.1）：评审对象 / 被审文件路径来源改读 manifest `docRoot`
 * （去硬编码 `docs/`），token 门（`anyLiveDesignSlot`）与冻结窗口谓词本体继承 v1 零改
 * （KD-M4-3）——本档承载四个单点：
 *
 * 1. `resolveReviewTargetPaths(agent)` —— 评审目标解析单点：读 manifest `docRoot`
 *    产出评审对象 / 被审文件的绝对路径集合（目录级；子键值形态 = 串 | 多根数组）。
 *    判定本体（`REVIEW_ROOT_KEYS` 键集 + `resolveReviewRootsFor(dir)`——2026-10-02 收口 ·
 *    台账 #828 按用点形）自本档迁 `review-facts.mjs`（2026-10-04 · #921 · KD-2——本档同名
 *    再出口保既有 import 面）；缺 `docRoot` 键 → `readManifest`
 *    的 fillDefaults 已补默认（架构 §2.3 E2 便利 fallback 落点）；整档缺失 / 非法 JSON →
 *    `{ok:false}` → 回退 DEFAULT_MANIFEST.docRoot（本函数是壳门之下的便利层——E2 的
 *    「整档缺失」由壳面 requireManifest 按用点处置（判 + 报明 / 建档，**不抛**——
 *    启动侧恒不拒，KD-M1-25；**工程模式会话**口径——普通会话装配钩子零 manifest I/O，
 *    KD-M1-12）：CLI make-agent.mjs / VSC setup.mjs 同判）；读错（权限等）→ 上抛不伪装成缺失（manifest.mjs 契约）。
 *    M6 的 `advisor.mjs` design-review 分类分支消费本导出
 *    （KD-M6-1——同源不重复实现；落 dispatch.mjs 会让 advisor 反向 import 门禁簇成环）。
 * 2. `freezeWindowConflict(agent, absPaths)` —— D5 冻结窗口判据组装：被审文件集 =
 *    声明文档集（`inflightDesignReviewConflict` 同源 docAbs 分支）+ 批次档（`run.batchDoc`
 *    分支——评审绑定批档在途时，写批档同样致 stale）。dispatch.mjs
 *    只 import 消费，不再各自直连 `advisor-settle.mjs`。
 * 3. `batchRecordWriteConflict(agent, depth, absPaths)` —— 批次档写门判据组装（#309 ·
 *    `AGENT-LOOP-SUBAGENT.md` §6.29.1）：判据与拒绝文案同址（文案字面只出本档）。
 *    2026-09-29 收窄（台账 #545）：自身批次伴随件（非 `.md` · 同目录 · 词干族 = 三合取）放行——
 *    批次档本体 ∕ 他批伴随件 ∕ 异目录伴随件照拒；两端取用 = 核 `agent/dispatch.mjs` Phase 1（两端同径）。
 * 4. `ledgerBindWriteConflict(agent, depth, tool, toolName, args)` —— 写锁（第三道门 · 设计档 §2.3）：
 *    判据 = 「**本笔报的** `#N` 是目标所属项目台账里一条 `status = 在途` 的行」（笔-账绑定——用户
 *    2026-11-03 02:02 裁「甲 · 逐笔带号」）。判据函数 `ledgerRowAt` 住本档模块内（不导出）。
 *    2026-11-03 不分面批：文档面 / 项目状态档 / 产品面 / 产品测面读同一条判据；面在判据里退场。
 *    2026-11-03 笔-账绑定批：入口集扩到十二把（写盘七件 + `bash` ∥ `execute` + `git` + `manifest` ∥ `memory`），
 *    `git` 只对写型 action 要号（枚举可判，不猜命令字面），拒文成为唯一教学面（`ledger` 不进 `required`）。
 *    2026-11-03 项目声明面批：**判据点从会话锚换成调用方声明的项目**（决策 40 ∥ 41）——定位参数优先，
 *    `project` 补位；会话锚永不充当判据点（`no project on this call` ∥ `declared project is not a project`）。
 *    2026-11-04 ssh 传输面批：入口集扩到十三把（+ `ssh`——只有 `get` 往本地落盘，按 action 判要号：
 *    `connect` / `send` / `read` / `list` 不写项目内档，不得被本门问到）。
 *
 * 继承零改面（本档不碰）：token 门资格判据（anyLiveDesignSlot / validateDesignToken）、
 * 代码路径判定（conventions.mjs 单一权威分类——KD-M4-1 保留为代码路径判定用）。
 */
import { existsSync } from "node:fs"
import { basename, dirname, join, resolve } from "node:path"
// advisor-settle 无上游依赖本簇（dispatch → write-gate → advisor-settle 单向）。normAbs
// 权威本体 = review-facts.mjs（第 33 批迁入），advisor-settle re-export；本档再 re-export
// （指针链非副本），M6 经本档一行 import 取齐。
import { inflightDesignReviewConflict, normAbs } from "../agent-tools/advisor-settle.mjs"
// 批次档路径单源（叶档——`BATCH-RECORD.md` §4.15）：批次档写门基底集取 `batchDocBases`。
import { batchDocBases } from "../agent-tools/batch-paths.mjs"
// 项目根推导 + manifest 读面（写锁判据 · 2026-11-03 笔-账绑定批）：判据按**调用方声明的项目**问该根台账（§2.3）。
// `MANIFEST_REL` = 「自身即带 manifest」那一支的判据（决策 41 的 (a) 支）。
import { MANIFEST_REL, readManifest, resolveProjectRoot } from "../manifest.mjs"
// 动作级只读谓词（`git` 写型 ∥ 只读的判法单源 = 既有 `readonlyActionOf`，决策 37——不新写一套分类）。
// 钩子优先 ∥ 核名面谓词回落：`git` 的名单落 `tools/git.mjs` 的 `isReadonlyAction`（单源，端覆写同笔删）。
import { readonlyActionOf } from "./dispatch-gates.mjs"
// 工具自报触达面单源谓词（写锁的路径集由判据函数自己算——§2.3；与门禁 / 变更记账同一枚谓词）。
import { toolTouchPaths } from "./helpers.mjs"
export { normAbs }
// 2026-10-04（工具路径基面根治批 · #921 · KD-2 同名再出口）：REVIEW_ROOT_KEYS +
// resolveReviewRootsFor 判定本体迁 `review-facts.mjs`（评审事实面——advisor-async 既有
// import 面零新模块边）；本档同名再出口（指针非副本——normAbs 同款先例）——既有 import 面
// （advisor.mjs / 测试）零改；本档消费点 `resolveReviewTargetPaths` 薄委托同名函数。
export { REVIEW_ROOT_KEYS, resolveReviewRootsFor } from "../agent-tools/review-facts.mjs"
import { resolveReviewRootsFor } from "../agent-tools/review-facts.mjs"

/**
 * 评审目标解析单点（M4 §2.1#1）：评审对象 / 被审文件的绝对路径集合（目录级）——
 * 判定本体（manifest `docRoot` 读面 / 缺档回退 / 读错上抛语义）2026-10-04 迁
 * `review-facts.mjs` 单源（KD-2——本档薄委托；详述见该档 resolveReviewRootsFor JSDoc）。
 * 缺 `docRoot` 键 → readManifest 已补默认；整档缺失 / 非法 →
 * `{ok:false}` → 回退 DEFAULT_MANIFEST.docRoot（便利层——E2 的「整档缺失」由壳面
 * requireManifest 按用点处置（判 + 报明 / 建档，**不抛**——启动侧恒不拒，KD-M1-25；**工程模式会话**口径——KD-M1-12），本函数不重复拦）；
 * 读错（权限等）→ 上抛 fail-closed。
 * @param {Object} agent
 * @returns {string[]} 评审目标目录的绝对路径（去重）
 */
export function resolveReviewTargetPaths(agent) {
  return resolveReviewRootsFor(agent?.cwd)
}

/**
 * D5 冻结窗口判据组装（M4 §2.1#2）：评审在途（点火 → 结算）期间父侧对被审文件集
 * （声明文档集 + 批次档）的写入 → 返回冲突 { id, path }；无冲突 → null。
 * 声明文档集分支 = `inflightDesignReviewConflict`（同 docAbs / 同 normAbs，仅 running
 * 未取消的设计条目）；批次档分支 = 同池条目 `run.batchDoc`（评审绑定批档在途时写批档
 * 同样致 stale——被审文件集合流点）。两分支同形返回，消费端拒绝文案零改。
 * @param {Object} agent
 * @param {string[]} absPaths — 本次写将触碰的路径（ABS——调用方 resolve(agent.cwd, p)）
 * @returns {{id: string, path: string}|null} 命中评审 id + 冲突路径（ABS），无冲突 null
 */
export function freezeWindowConflict(agent, absPaths) {
  const declared = inflightDesignReviewConflict(agent, absPaths)
  if (declared) return declared
  const pool = agent?._asyncAdvisors
  if (!(pool instanceof Map) || pool.size === 0) return null
  const wanted = (absPaths ?? [])
    .filter((p) => typeof p === "string" && p.length > 0)
    .map((p) => normAbs(p, agent?.cwd))
  if (wanted.length === 0) return null
  const wantedSet = new Set(wanted)
  for (const entry of pool.values()) {
    if (!entry || entry.reviewType !== "design") continue
    if (entry.status !== "running" || entry.cancelled || entry.done) continue
    const batchDoc = entry.run?.batchDoc
    if (typeof batchDoc !== "string" || batchDoc.length === 0) continue
    const batchAbs = normAbs(batchDoc, agent?.cwd)
    if (wantedSet.has(batchAbs)) return { id: String(entry.id), path: batchAbs }
  }
  return null
}

/** 批次档写门基底集**按 run 记忆化**（每 run 一次 manifest 读——§6.29.1；键 = agent 对象）。
 *  载体 = WeakMap（agent 回收即随 GC——无跨 run 残留）；cwd 变更即失效重读。
 *  **歧义锚**（多项目并存 · #828）⇒ 基底 = 候选项目基底**并集**（`batchDocBases` 解析单点——覆盖随之对齐）。 */
const batchGateBasesMemo = new WeakMap()

/** 比较键（绝对形态归一：`.` 段归位 + 分隔符归一 `/` + win32 大小写归一——§6.29.1 判据）。 */
const gateKey = (p) => {
  const s = resolve(String(p)).replace(/\\/g, "/")
  return process.platform === "win32" ? s.toLowerCase() : s
}

function memoizedBatchBases(agent, cwd) {
  const memo = agent && typeof agent === "object" ? batchGateBasesMemo.get(agent) : null
  if (memo && memo.cwd === cwd) return memo.bases
  const bases = batchDocBases(cwd)
  if (agent && typeof agent === "object") batchGateBasesMemo.set(agent, { cwd, bases })
  return bases
}

/** 目标是否落基底根内（按路径段——win32 大小写归一；同 `batch-paths.mjs` 越基底判据口径）。 */
function underBase(targetKey, baseAbs, cwd) {
  const root = gateKey(normAbs(baseAbs, cwd))
  return targetKey === root || targetKey.startsWith(root.endsWith("/") ? root : root + "/")
}

/** 自身批次伴随件判据（三合取——`AGENT-LOOP-SUBAGENT.md` §6.29.1 · 2026-09-29 收窄 · 台账 #545）：
 *  ① 目标非 `.md`（批次档本体永在门内——含近词干 `<词干>-v2.md`；`.md` 判定大小写不敏感 = fail-closed 侧）；
 *  ② 目标与绑定档同目录；③ 目标基名以 `<词干>.` 或 `<词干>-` 打头（词干 = 绑定档基名剥 `.md`）。
 *  入参 = 比较键（gateKey 归一后——win32 大小写归一同覆盖 ②③ 的字面比较）。
 *  @returns {boolean} 三合取全中 = true（放行面）；余者 false（照拒） */
function isOwnBatchCompanion(targetKey, boundKey) {
  const targetBase = basename(targetKey)
  if (targetBase.toLowerCase().endsWith(".md")) return false // ① 批次档本体（任何 `.md`）永在门内
  if (dirname(targetKey) !== dirname(boundKey)) return false // ② 同目录（按比较键）
  const boundBase = basename(boundKey)
  const stem = boundBase.toLowerCase().endsWith(".md") ? boundBase.slice(0, -3) : boundBase
  return targetBase.startsWith(stem + ".") || targetBase.startsWith(stem + "-") // ③ 词干族（`.` ∕ `-` 前缀）
}

/**
 * 批次档写门判据（#309 · `docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.29.1——containment；
 * 2026-09-29 收窄 · 台账 #545）：
 * 携绑定的子代理（`depth > 0` ∧ `agent._batchDoc` 在场——工程角色 ∥ 普通面 coder，`BATCH-RECORD.md` §4.16）对**批次档文件**的写 ⇒ 目标 ≠ 绑定档
 * **且非绑定批次的伴随件**（见 `isOwnBatchCompanion`）⇒ 冲突（fail-closed；写自己绑定的档 ∥
 * 自身批次伴随件 = 正常面放行）。比较键 = 绝对路径 + win32 大小写归一。
 * 界面：depth 0（主 agent——跨档处置是父侧职责）· 无 `_batchDoc`（未携绑定族——普通面 coder 亦入绑定面）· 主基底外的
 * 普通文件写 —— 三种形态均不进本门（返回 null，行为零变）。判据集由调用方限定 = `FILE_MUTATORS`
 * （`file_ops` / 读类不在门内——§6.29.1 边界）。
 * 拒绝文案**单源 = 本档**（两端直取 `message`——零字面副本）。
 * 恒零抛（形照 `freezeWindowConflict` 先例——全判据带形态守卫）。
 * @param {Object} agent — 子代理 agent（读 `_batchDoc` / `cwd`）
 * @param {number} depth — 执行深度（> 0 = 子代理）
 * @param {string[]} absPaths — 本次写将触碰的绝对路径集（调用方已 resolve）
 * @returns {{bound: string, target: string, message: string}|null} 命中 = 冲突信息 / 否则 null
 */
export function batchRecordWriteConflict(agent, depth, absPaths) {
  if (!(depth > 0)) return null
  const bound = agent?._batchDoc
  if (typeof bound !== "string" || bound.length === 0) return null
  const wanted = (absPaths ?? []).filter((p) => typeof p === "string" && p.length > 0)
  if (wanted.length === 0) return null
  const cwd = agent.cwd
  const bases = memoizedBatchBases(agent, cwd)
  const boundAbs = normAbs(bound, cwd)
  const boundKey = gateKey(boundAbs)
  for (const p of wanted) {
    const target = normAbs(p, cwd)
    const targetKey = gateKey(target)
    if (targetKey === boundKey) continue // 写自己绑定的档 = 正常面
    if (!bases.some((b) => underBase(targetKey, b, cwd))) continue // 非批次档文件（含缺 manifest 的基底外盘面）
    if (isOwnBatchCompanion(targetKey, boundKey)) continue // 自身批次伴随件 = 放行面（三合取——见判据）
    return {
      bound: boundAbs,
      target,
      message: `write refused — cross-batch batch-record write: this child is bound to ${basename(boundAbs)}; ${basename(target)} belongs to a different batch. Write only your own bound record and its companion files (the batch tool targets your bound record); the parent agent handles other batch records.`,
    }
  }
  return null
}

// ─── 写锁（第三道门 · 2026-11-03 笔-账绑定批 · 设计档 §2.3）───────────────────────────

/** 写门入口集（设计档 §2.3）：判据 = 「凡能把字节落到项目内的工具」。十三把 = 写盘七件 +
 *  三把命令工具 + 两把结构化 action 工具（`manifest` ∥ `memory` 按各自的枚举判——决策 39）+ `ssh`
 *  （只有 `get` 落盘，按 action 判）。
 *  `settings`（写 `~/.thincoder/config.json`）∥ `browser`（自有 profile 与截图目录）不写项目内档 ⇒ 不进。
 *  `ledger` ∥ `batch` 也不进——挂行与开档不经过写面，「没号就挂不了账」的锁死因此不存在。 */
const LEDGER_ENTRY_TOOLS = new Set([
  "write", "edit", "insert_after", "apply_patch", "delete", "hashline_edit", "file_ops",
  "bash", "execute", "git", "manifest", "memory", "ssh",
])
/** 结构化 action 工具的写型枚举（按值判，不解析内容——决策 37 ∥ 39 同法）。 */
const MANIFEST_WRITE_ACTIONS = new Set(["init", "write"])
/** `memory` 里**能落 project 层档**的写型 action：`put` 按 `layer`、`delete` 按 `layer` ∥ id 前缀。
 *  `clear` 只对 personal 开放（该 action 自己拒 shared 层）∥ `maintain` 无 `layer` 参数（库级维护——MEMORY.md §6.6.1）
 *  ⇒ 两者都落不到 `<项目>/.thincoder/memory/**`，故不进枚举（枚举只收真能落项目内档的值——空的覆盖项比没有更坏）。 */
const MEMORY_WRITE_ACTIONS = new Set(["put", "delete"])
/** `memory` 的落盘目标按层分：只有 `project` 层写 `<项目>/.thincoder/memory/**`（`personal` ∥ `team` 落用户数据目录）。 */
const MEMORY_PROJECT_LAYER = "project"
/** 单条删除的层由 id 前缀定（`layer` 可省——`thincoder-core/memory/memory-tool.mjs` 的 `execDeleteSingle`
 *  逐字「layer is OPTIONAL … else the id prefix routes the delete」）⇒ 前缀与 `layer` 同判：
 *  只看 `layer` 会漏掉「不带 layer、按 `project:` 前缀删 project 层档」这条写项目内字节的路。 */
const MEMORY_PROJECT_UID_PREFIX = "project:"
/** 在途行的状态词（台账六态之一）：只有它携带写权。 */
const IN_FLIGHT_STATUS = "在途"

/** 拒文（逐字 = 设计档 §2.3——机检可断言）：一条基串 + 按情形选的 `<case>` + 用法句 + 本项目在途清单 + 挂号两步。
 *  `ledger` ∥ `project` 都不进 `required`（决策 35 ∥ 42）⇒ 模型不知道有这两个参数，第一次撞的就是这条拒文，
 *  它是这条设计唯一的教学面（决策 38）：缺什么 / 要带什么（**两个输入一次点出**）/ 当下有哪些号可带，缺一不可。 */
const LEDGER_PARAM_SENTENCE = 'Pass project:<the project root that carries PROJECT-MANIFEST.json> and ledger:"#N" on this call — engineering mode binds every write to a project and to the in-flight ledger row it serves; a call that names neither is refused.'
const LEDGER_HANG_STEPS = 'If none is in flight, hang one first — neither step is a write: ① ledger({action:"add", title, kind, cwd:<project root>}) hangs the row; ② batch({action:"create", ledger:"#N", topic, source}) opens the record over it (row → 在途).'
/** 清单上限（设计档 §2.3）：在途行多时逐条列全会把教学面变成台账导出。 */
const LEDGER_LIST_LIMIT = 10

const CASE_NO_NUMBER = "no ledger number on this call"
const CASE_NO_PROJECT = "no project on this call"
/** 无项目时清单位的三种取值（见 `ledgerNoProjectRefusal`）：缺声明 ∥ 声明无效 ∥ 写盘目标不在任何项目里。
 *  三种各用自己的一句：一句里两个结论会让读拒文的人分不清该改哪一边。 */
const LIST_UNKNOWN_NO_PROJECT = "unknown — no project on this call"
const LIST_UNKNOWN_NOT_A_PROJECT = "unknown — the declared project is not a project"
const LIST_UNKNOWN_TARGET_NOT_A_PROJECT = "unknown — no project owns this write's target"
const CASE_UNREADABLE = "no ledger can be read for this project"
const caseNotRowNumber = (raw) => `ledger number ${JSON.stringify(String(raw))} is not a row number — pass "#N" or "N"`
const caseNoSuchRow = (no) => `row #${no} does not exist in this project's ledger`
const caseNotInFlight = (no, status) => `row #${no} is ${JSON.stringify(String(status))} — only a ${IN_FLIGHT_STATUS} row carries writes`
/** 声明无效（设计档 §2.3 拒文表逐字：`declared project is not a project (no PROJECT-MANIFEST.json at this path or
 *  within the session anchor): "<path>"`）—— 声明与写盘目标两种申报形共用这一句：两者都没在每个被搜过的位置
 *  找到 manifest（写盘目标沿祖先链搜得更远，那句括注仍然为真）。 */
const caseNotAProject = (p) => `declared project is not a project (no PROJECT-MANIFEST.json at this path or within the session anchor): ${JSON.stringify(String(p))}`

/** 当下在途行清单（决策 38 的第三件）：`#N, #M …`；无 ⇒ `none`；超上限折 `… +K more`。 */
function ledgerInFlightList(rows) {
  const nums = (Array.isArray(rows) ? rows : [])
    .filter((r) => r?.status === IN_FLIGHT_STATUS)
    .map((r) => `#${r.id}`)
  if (nums.length === 0) return "none"
  if (nums.length <= LEDGER_LIST_LIMIT) return nums.join(", ")
  return `${nums.slice(0, LEDGER_LIST_LIMIT).join(", ")}, … +${nums.length - LEDGER_LIST_LIMIT} more`
}

/** 拒文组装（可读台账形）：基串 + `<case>` + 用法句 + 在途清单 + 挂号两步。
 *  清单按「**本项目的**账」说（判据点换成声明后，号只在那一个项目的账上成立）。 */
function ledgerRefusal(caseText, rows) {
  return `write refused — ledger row not bound: ${caseText}. ${LEDGER_PARAM_SENTENCE} In-flight rows in this project's ledger right now: ${ledgerInFlightList(rows)}. ${LEDGER_HANG_STEPS}`
}

/** 拒文组装（无项目形）：没有可判的项目就没有「本项目的账」可问——清单位写 `unknown` 并点名哪一种无效，
 *  **不写 `none`**（那会把「不知道判哪个项目」说成「本项目一条在途行都没有」，模型会照它去挂号而忘了声明项目）。
 *  两种无效的项目各用自己的清单句：声明缺失 ≠ 声明了个不是项目的东西，一句里两个结论会让读拒文的人分不清。
 *  用法句仍把两个输入一起点出（R33：三件在每一支都在位）。 */
function ledgerNoProjectRefusal(caseText, listText) {
  return `write refused — ledger row not bound: ${caseText}. ${LEDGER_PARAM_SENTENCE} In-flight rows in this project's ledger right now: ${listText}. ${LEDGER_HANG_STEPS}`
}

/** 拒文组装（台账读不到形）：基串 + `<case>` + 用法句 + 挂号两步，另起一行带原始错误；
 *  **不列在途清单**——读不到就没有清单，写个 `none` 是把「读不到」说成「一条都没有」。 */
function ledgerUnreadableRefusal(caseText, error) {
  return `write refused — ledger row not bound: ${caseText}. ${LEDGER_PARAM_SENTENCE} ${LEDGER_HANG_STEPS}\n(ledger unreadable — ${error})`
}

/** 台账号解析（`#` 可省——`"#2016"` 与 `"2016"` 同判，设计档 §2.3）：三种结果
 *  `{ case: "missing" }`（未传 / 空串 / 全空白）· `{ case: "form", raw }`（剥前导 `#` 后非纯数字）· `{ no }`。 */
function parseLedgerNo(raw) {
  if (raw === undefined || raw === null) return { case: "missing" }
  const text = String(raw).trim()
  if (text === "") return { case: "missing" }
  const m = /^#?(\d+)$/.exec(text)
  if (!m) return { case: "form", raw: text }
  return { no: Number(m[1]) }
}

/** 该根台账的行集（判据的第二个输入）。两种「根」不是一回事（§2.3 的钉子）：根**不在**（声明无效）
 *  由调用方在取根那一步拒（`declared project is not a project`）；manifest **在而不可用**（读不动 / 坏 JSON）
 *  与库开不了 ⇒ 返回 `error`，一律落拒——判的是「是不是项目」，不是「项目好不好用」。 */
async function ledgerRowsOf(root) {
  try {
    const man = readManifest(root)
    if (!man?.ok) {
      const detail = (man?.errors ?? []).filter((s) => typeof s === "string" && s).join("；")
      return { rows: [], error: detail || String(man?.reason ?? "manifest unusable") }
    }
  } catch (e) {
    return { rows: [], error: String(e?.message ?? e) }
  }
  try {
    // W8 契约②：node:sqlite 链只经动态 import 进入（勿升静态）。
    // `boundary` 必传、传的就是刚算出的那个根：`openLedger` 首行即 `resolve(boundary)`，
    // 缺省直接抛 ⇒ 每一笔写都被判成「台账读不到」（§2.3 读法）。
    const { ledgerQuery } = await import("../ledger.mjs")
    const rows = ledgerQuery({ cwd: root, boundary: root })
    return { rows: Array.isArray(rows) ? rows : [], error: null }
  } catch (e) {
    return { rows: [], error: String(e?.message ?? e) } // fail-closed：读不到不等于放行
  }
}

/**
 * 判据函数（**模块内，不导出**——唯一消费方是本门的判据本体；导出去就是下一个零消费符号）：
 * 已算出的项目根 → 该根台账的行集 → 按 `id` 找本笔报的那一行（设计档 §2.3「读法」）。
 *
 * **判据点不再是「目标自身推根」**（2026-11-03 项目声明面批 · 决策 40）：项目由调用方声明，本函数只负责
 * 「拿一个已成立的项目根 + 一个号」这一半；「根从哪来」由 `ledgerGateTargets` + `resolveDeclaredRoot` 回答。
 * 判据点不存在（不在任何项目里）现在由调用方落 `declared project is not a project`，不再是「门不管」。
 *
 * **不为门新增按 id 的列过滤**（§2.3）：`ledgerQuery` 现有过滤键只有 `status` / `kind` / `board` /
 * `trigger` / `task_book`，行集取全量后按 `id` 找——同一笔写的多根按 `root` 缓存，一次写只读一遍账。
 *
 * @param {string} root — 已成立的判据点（项目根绝对路径）
 * @param {number|null} ledgerNo — 本笔报的行号（缺号 / 非行号形时传 null）
 * @param {Map<string, object>|null} [cache] — 同一笔写的根 → 行集（多目标同项目时只问一次台账）
 * @returns {Promise<{row: object|null, rows: object[], error: string|null}>}
 *   `row` = 找到的那一行（查不到 ⇒ null）；`error` = 读不到时的原始错误（fail-closed 拒文点名它）
 */
async function ledgerRowAt(root, ledgerNo, cache = null) {
  let base = cache instanceof Map ? cache.get(root) : null
  if (!base) {
    base = await ledgerRowsOf(root)
    if (cache instanceof Map) cache.set(root, base)
  }
  if (base.error) return { row: null, rows: [], error: base.error }
  const row = ledgerNo === null ? null : base.rows.find((r) => Number(r?.id) === ledgerNo) ?? null
  return { row, rows: base.rows, error: null }
}

/** 声明项目的取根（设计档 §2.3「两个分支的落法」/ §5 R31）——**界 = 相关性判据，不是单向的「不许越界」**：
 *  (b) 支 = 既有单源 `resolveLedgerRoot(声明, agent.cwd)`：起点在会话锚之内 ⇒ 沿祖先链上溯到最近带 manifest 的目录；
 *  (b) 取不到再走 (a) 支 = 声明路径**自身即带 manifest**且会话锚在它之下 ⇒ 根 = 声明路径（`basis = self`，不上溯）。
 *  **为什么 (a) 支要门自己判一次**：`resolveLedgerRoot` 的上溯界就是会话锚，起点落在界之上时它取不到根；
 *  而「会话 cwd 在项目子目录」正是项目指南记录的启动形（`cd thincoder/thincoder-cli && node bin/thincoder.cjs`）——
 *  不认这一支，那种会话里 `bash` ∥ `memory` 声明根也被拒、声明子目录也被拒 = 无解。
 *  两支都取不到（不存在 ∥ 平级目录 ∥ 不含锚的更远祖先 ∥ 界内上溯无 manifest）⇒ null（拒，点名该路径）。
 *  **会话锚在这两支里都不是「判哪个项目」的答案**（决策 41）：它只用来定界与判相关性。
 * @param {string} declared — 调用方给的项目声明（绝对 ∥ 相对；相对按会话 cwd 解析）
 * @param {string} cwd — 会话锚
 * @returns {Promise<{root: string, basis: "self"|"ancestor"}|null>} */
async function resolveDeclaredRoot(declared, cwd) {
  const start = resolve(cwd, String(declared))
  // 声明路径不存在 ⇒ 拒（§5 R31 四态第一态）：不加这一行，`owningProject` 会从一条不存在的路径上溯，
  // 把拼错的声明归到会话自己那个项目上——那正是本批要关掉的「会话锚当判据点」（决策 41）。
  if (!existsSync(start)) return null
  // W8 契约②：node:sqlite 链只经动态 import 进入（`resolveLedgerRoot` 与 `ledgerQuery` 同住该链；模块已缓存）。
  const { resolveLedgerRoot } = await import("../ledger.mjs")
  const owned = resolveLedgerRoot(start, cwd)
  if (owned) return { root: owned.root, basis: owned.basis }
  if (existsSync(join(start, MANIFEST_REL)) && underKey(start, cwd)) return { root: start, basis: "self" }
  return null
}

/** `child` 是否等于 `root` 或在其子树内（比较键 = `gateKey`：绝对化 + `/` 归一 + win32 大小写归一）。 */
function underKey(root, child) {
  const r = gateKey(root)
  const c = gateKey(child)
  return c === r || c.startsWith(r.endsWith("/") ? r : r + "/")
}

/** 本笔的判据点（设计档 §2.3「判据点怎么来」· 决策 40）：**只有两个来源，都来自调用方**——
 *  ① 该工具自带的定位参数：写盘七件的目标路径（`toolTouchPaths`）· `execute.workdir` · `git.path` ∥ `workdir`
 *  （`path` 相对 `workdir`——`thincoder-core/tools/git.mjs` 的 `resolveBaseDir` 同源；设计档要求「`toolTouchPaths`
 *  再补 `path` ∥ `workdir`」，而 `git` 无 `touchedPaths` 钩子 ⇒ `toolTouchPaths` 的回落形正是 `[args.path]`，
 *  不用它是因为它按会话 cwd 归一，而 `git` 的 `path` 相对 `workdir`）· `manifest.target`；
 *  ② 新参数 `project`（项目根绝对路径，纯声明）。**定位参数优先**，`project` 只在定位参数缺位时被读。
 *  **会话锚永不充当判据点**（决策 41）：`bash` ∥ `memory` 没有定位参数，缺 `project` 即拒；
 *  `execute` ∥ `git` ∥ `manifest` 缺定位参数时同样不回落到 cwd。
 *  三种结果：`{ paths }`（按路径所属项目判）· `{ declared }`（按声明取根）· `{ none: true }`（无判据点 ⇒ 拒）；
 *  写盘工具连路径都没有 ⇒ null（工具自己拒，本门不问）。 */
function ledgerGateTargets(agent, toolName, tool, args) {
  const cwd = resolve(agent?.cwd ?? ".")
  const asAbs = (p) => (typeof p === "string" && p.trim() ? resolve(cwd, p) : null)
  const declared = typeof args?.project === "string" && args.project.trim() ? args.project.trim() : null
  const onlyDeclared = () => (declared ? { declared } : { none: true })
  if (toolName === "bash" || toolName === "memory") return onlyDeclared()
  if (toolName === "execute") {
    const wd = asAbs(args?.workdir)
    return wd ? { paths: [wd] } : onlyDeclared()
  }
  if (toolName === "git") {
    const wd = asAbs(args?.workdir)
    const p = typeof args?.path === "string" && args.path.trim() ? resolve(wd ?? cwd, args.path) : null
    if (p) return { paths: wd ? [p, wd] : [p] } // 两个都在 ⇒ 两个项目都要带号（§2.3「一笔写跨两个项目」）
    return wd ? { paths: [wd] } : onlyDeclared()
  }
  if (toolName === "manifest") {
    const t = asAbs(args?.target)
    return t ? { paths: [t] } : onlyDeclared()
  }
  const paths = toolTouchPaths(tool, args)
    .filter((p) => typeof p === "string" && p.trim())
    .map((p) => resolve(cwd, p))
  return paths.length === 0 ? null : { paths }
}

/** 本笔是否需要号（工具自己的枚举判写型——不解析命令字面，决策 36 的禁令不碰）：
 *  `git` 只对写型 action 要号（只读名单 = 核钩子，决策 37）；`manifest` 的 `init` ∥ `write` 都要号——
 *  `init` 的豁免是条件形（决策 43：目标沿祖先链取不到项目根时在取根步跳过本门），不是摘出要号集；
 *  `memory` 只对落 project 层档的写型 action 要号（`layer:"project"` ∥ 单条删除的 `project:` 前缀——
 *  后者不带 `layer` 也能删 project 层档，只看 `layer` 就漏了那条路）；`ssh` 只对 `get` 要号（`put` 写的是
 *  远端主机，其余动作不写项目内档——缺此分支则整个会话面都要号，把会话面整条打死）。 */
function ledgerGateApplies(toolName, tool, args) {
  if (toolName === "git") return !readonlyActionOf(tool, "git", args)
  if (toolName === "manifest") return MANIFEST_WRITE_ACTIONS.has(String(args?.action ?? ""))
  if (toolName === "memory") return memoryTargetsProjectLayer(args)
  if (toolName === "ssh") return String(args?.action ?? "") === "get"
  return true
}

/** `memory` 这一笔是否落 project 层：`layer:"project"`，或单条删除的 id 前缀 = `project:`（`layer` 省略时
 *  工具按前缀路由到 project 层）。两个输入都是工具自己的枚举 ∥ 约定，不解析笔记内容（决策 36 的禁令不碰）。
 *  显式给了别的层 ⇒ 不过本门（工具自己按该层处置——前缀不符它会拒）。 */
function memoryTargetsProjectLayer(args) {
  const action = String(args?.action ?? "")
  if (!MEMORY_WRITE_ACTIONS.has(action)) return false
  const layer = String(args?.layer ?? "").trim()
  if (layer === MEMORY_PROJECT_LAYER) return true
  if (layer !== "") return false
  const id = args?.id
  return typeof id === "string" && id.startsWith(MEMORY_PROJECT_UID_PREFIX)
}

/** 判序第三步：按号找行、判 `status`（号四情形——缺 ∥ 非行号形 ∥ 不在盘 ∥ 非在途）。
 *  `at.error` 非空 = 该根台账读不到 ⇒ 拒（真业务门：读不到不等于放行）。 */
function ledgerRowRefusal(parsed, at) {
  if (at.error) return ledgerUnreadableRefusal(CASE_UNREADABLE, at.error)
  if (parsed.case === "missing") return ledgerRefusal(CASE_NO_NUMBER, at.rows)
  if (parsed.case === "form") return ledgerRefusal(caseNotRowNumber(parsed.raw), at.rows)
  if (!at.row) return ledgerRefusal(caseNoSuchRow(parsed.no), at.rows)
  if (at.row.status !== IN_FLIGHT_STATUS) return ledgerRefusal(caseNotInFlight(parsed.no, at.row.status), at.rows)
  return null
}

/**
 * 写锁判据组装（**第三道门**——与跨批档写 / D5 冻结窗并列挂 `dispatch.mjs` Phase 1）：
 * 辖内任何写盘 ∥ 跑命令 ∧ 本笔**同时给出项目与号**而号不是该项目台账里的 `在途` 行 ⇒ 冲突；否则 null。
 *
 * **判据只有一条，零上位条件**（§2.3）：不判批档状态、不判指针互指。多一个合取项，就会在某个真实场景
 * 变成「机制走不通」的证据，接着被用来把整套机制废掉。
 *
 * **为什么是笔-账绑定**：写盘工具的参数原本只有路径与内容，门只能问「这个仓有没有在途行」——一条在途行
 * 于是放行该根下任何一笔写，它拦不住「有账但在做别的事」。判据换成「这笔写替哪条账服务」，门才第一次
 * 看得见写者报的是哪条账（决策 34；形状 = 用户 2026-11-03 02:02 裁的「甲 · 逐笔带号」——轮内绑定会把
 * 几件异步在做的事压成一条账）。
 *
 * **`bash` ∥ `execute` 与写盘工具同一判据**（决策 36）：命令行内容无法可靠静态分类（`node -e` /
 * `npm run <脚本>` / 参数拼接都能落盘），按字面分类本身就是第二个洞。代价 = 工程模式下父侧任何
 * `bash` ∥ `execute` 都要有在途行（含 `npm test` / `git status`），正路 = 先挂行再干活。
 *
 * **面不参与放行**：文档面、项目状态档、产品代码面、产品测试面读同一条判据。
 * 挂门范围（工程模式 ∧ `depth = 0`）说的是「谁被这条门问到」，不是判据的合取项。
 *
 * **判据点 = 调用方声明的项目**（2026-11-03 项目声明面批 · 决策 40）：会话锚可以是容器根 / 工作区根，
 * 拿它当判据点时那种形态下本门永不设防（实机：2026-11-03 02:53 重启后 `bash` 不带号照放行）。
 * 现在只有两个来源、都来自调用方：① 工具自带的定位参数；② `project`（项目根绝对路径）。
 * **会话锚永不充当判据点**（决策 41）：声明缺位 ⇒ `no project on this call`；声明无关键或取不到根 ⇒
 * `declared project is not a project`——没有「推不出 ⇒ 门不管」那条臂。
 *
 * 与既有「工程模式父侧门」（同 Phase 1 的设计门，非读取路径按面判拒）是**两件事**：前门问「设计做没做」，
 * 本锁问「这笔写替哪条在途行服务」。所以并列、不替换。
 *
 * **业务门语义**：台账读不到（库不可开 / 根推得出而 manifest 不可用）⇒ **拒**，拒文另起
 * `(ledger unreadable — <原错>)` 一行——读不到不等于放行。
 * **只在工程模式生效**（开关 = `agent.config?.agent?.engineering`，与设计门同一枚）；普通模式按
 * `docs/core/requirements/NORMAL-MODE.md` 的「纪律自持」不动。
 *
 * @param {Object} agent — 会话 agent（读 `config.agent.engineering` / `cwd`）
 * @param {number} depth — 执行深度（只在 depth 0 生效；子代理走既有 token 门，本门不核它）
 * @param {Object} tool — 工具对象（`toolTouchPaths` 的钩子源 ∥ `readonlyActionOf` 的动作谓词钩子源）
 * @param {string} toolName — 工具名（= `toolCall.name`；决定入口集与各工具的判法）
 * @param {Object} args — 本次调用入参（判据点、`args.project` ∥ `args.ledger` 都由本函数自己取）
 * @returns {Promise<{target: string, message: string}|null>} 命中 = 拒文 + 首个被拒目标；否则 null
 */
export async function ledgerBindWriteConflict(agent, depth, tool, toolName, args) {
  if (!agent?.config?.agent?.engineering) return null // 普通模式零改（纪律自持）
  if (!(depth === 0)) return null // 子代理走既有 token 门
  const name = String(toolName ?? tool?.name ?? "")
  if (!LEDGER_ENTRY_TOOLS.has(name)) return null // 入口集之外 ⇒ 本门不问
  if (!ledgerGateApplies(name, tool, args)) return null // 只读 action ∥ 不写项目内档的枚举值 ⇒ 不要号
  const claim = ledgerGateTargets(agent, name, tool, args)
  if (!claim) return null // 没有可判的目标（写盘工具缺 path 由工具自己拒）
  const parsed = parseLedgerNo(args?.ledger)
  const cwd = resolve(agent?.cwd ?? ".")

  // ① 判序第一步：解析项目声明（缺 ⇒ `no project on this call`）——判据点不存在时，号对不对无从谈起。
  if (claim.none) return { target: cwd, message: ledgerNoProjectRefusal(CASE_NO_PROJECT, LIST_UNKNOWN_NO_PROJECT) }

  const cache = new Map()
  if (claim.declared !== undefined) {
    // ② 声明形式：界 = 相关性判据（(b) 支上溯 ∥ (a) 支自身带 manifest）；两支都取不到 ⇒ 拒。
    const resolved = await resolveDeclaredRoot(claim.declared, cwd)
    if (!resolved) {
      return { target: claim.declared, message: ledgerNoProjectRefusal(caseNotAProject(claim.declared), LIST_UNKNOWN_NOT_A_PROJECT) }
    }
    const at = await ledgerRowAt(resolved.root, parsed.no ?? null, cache)
    const message = ledgerRowRefusal(parsed, at)
    return message ? { target: resolved.root, message } : null
  }

  // ③ 定位参数形式：每个目标按自己的祖先链取根（一笔写跨两个项目 ⇒ 号要在每个项目的账上各查到）。
  // `init` 的取根豁免（决策 43 · 条件形）：目标沿祖先链取不到项目根 ⇒ 不进本门（无账可问）；
  // 取得到根（含既有项目内的子目录自举）⇒ 照判要号，目标自身已有 manifest 时门过后由工具自身拒。
  for (const p of claim.paths) {
    const root = resolveProjectRoot(p)
    if (!root) {
      if (String(args?.action ?? "") === "init") return null
      return { target: p, message: ledgerNoProjectRefusal(caseNotAProject(p), LIST_UNKNOWN_TARGET_NOT_A_PROJECT) }
    }
    const at = await ledgerRowAt(root, parsed.no ?? null, cache)
    const message = ledgerRowRefusal(parsed, at)
    if (message) return { target: p, message }
  }
  return null
}
