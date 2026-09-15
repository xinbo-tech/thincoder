/**
 * async-discard.mjs — 中止清池的「只清已死」收尾单点（第 35 批 §12 建——群 B 批 B1 扩
 * advisor 池同构面，AGENT-LOOP.md（VSC 仓）§15）。
 *
 * 原作 = run-stages.mjs 中止分支的 `asyncMap.clear()` 全清（§12.1 ②③）：会话子代持
 * **会话 signal**（F-6 后 Stop 只停当前轮 controller——async-settle.mjs buildChildSignal
 * 单点），轮级中止时存活子代被静默清出池 = 孤儿（其 settle 的 removeFromAsyncPools 作用
 * 于已空 Map——报告静默丢失）。§15 复议（群 B 批 B1）：advisor 池（`_asyncAdvisors`——
 * run-stages 中止分支原 `advMap.clear()`）与子代理同款前提（评审条目 controller 经
 * buildChildSignal 链到会话 signal）⇒ 同构缺口同修。
 *
 * 单不变量（§12.2c 选定 c3）：**清池 ⟺ 该条目已死且其报告不可达**。
 * - 丢弃 ⟺ entry.done !== true ∧ entry.cancelled !== true ∧ parentAborted(entry) === true
 *   （parentAborted 复用 async-settle.mjs 既有单点守卫——零新谓词；advisor 条目无
 *   entry.signal 字段——谓词天然走 controller 支）；
 * - 保留 ⟺ 其余——存活条目（会话 signal 未中止；报告沿自动通道到达）/ done-in-pool
 *   （回合尾收集 / 挂起 sweep 消化）/ cancelled（settle cancelled 分支收尾）。
 *
 * 每条目动作序（§12.3 C-2 / §15.3 C-10b）：写终态记录（discarded 墓碑——跨 run 终态单
 * 账本）→ 出池（removeFromAsyncPools）→ 汇总 → 整批**一次**注入提醒（C-4 / C-10c 模板
 * ——escapeXml 后 user-role 注入）+ 一条 `ev:discarded` 日志（有丢弃才记——零丢弃零噪音）。
 *
 * 双导出 + 私有共享核（§15.2 选定候选 1）：`discardAbortedPool`（subagent 面签名/文案零变
 * ——T-D3/T-D4 断言零回归）+ `discardAbortedAdvisors`（C-10 新面）；判定/出池/墓碑/汇总
 * 单核承载（D2——实现单核无重复）。
 *
 * 模块图：单向 import 核 `@thincoder/core/agent-tools/async-settle.mjs`（parentAborted 守卫单点 /
 * getAsyncPool 池 accessor / writeTombstoneTo 墓碑写点——W13（2026-09-15）：原端侧
 * `async-settle.mjs`+`subagent-scheduler.mjs` 镜像删旧，改指核单源）+ ../agent/run-helpers.mjs
 * （escapeXml）/ @thincoder/core/log.mjs——叶子向、无环。
 */
import { getAsyncPool, parentAborted, writeTombstoneTo } from "@thincoder/core/agent-tools/async-settle.mjs"
import { escapeXml } from "../agent/run-helpers.mjs"
import { logEvent } from "@thincoder/core/log.mjs"

/** C-4 提醒模板（verbatim——单条文本、词间单空格；测试断关键子串，不逐字断行）。 */
const subagentReminderText = (n, list) =>
  `[System reminder: ${n} background subagent(s) were discarded by the user's Stop — their reports will NOT arrive: ${list}. ` +
  "Partial changes from discarded children stay unmerged/unaudited; re-spawn if the work is still needed.]"

/** C-10c 提醒模板（verbatim——advisor 池同构面；整批一次注入）。 */
const advisorReminderText = (n, list) =>
  `[System reminder: ${n} background advisor review(s) were discarded by the user's Stop — their reports will NOT arrive: ${list}.\n` +
  "No design token was issued for a discarded design review; launch the review again if it is still needed.]"

/** C-4 列表词（wasStatus 数据源）：queued → "(was queued — never started)"；其余 "(was running)"。 */
const wasPhrase = (wasStatus) => (wasStatus === "queued" ? " (was queued — never started)" : " (was running)")

/** C-1 / C-10a 丢弃判定（单点复用）。
 *  W13：守卫改指核 `parentAborted(ctx, entry)` 单点（核签名 ctx 先行）。语义注意（代码评审 🔵 收正）：
 *  核建条目**无 `signal` 字段**（`subagent-run.mjs` / `advisor-async.mjs` 仅 `controller`）⇒ 传入的
 *  `{ signal: entry.signal }` 实为死参，实际判据 = controller 支（`entry.controller.signal.aborted`）——
 *  与基信号同链（核 `bindChildController` 带活 abort 监听）⇒ 与「父已中止」同判，行为等价；
 *  controller 支同核。 */
const discardable = (entry) =>
  entry.done !== true && entry.cancelled !== true && parentAborted({ signal: entry.signal }, entry)

/** 池条目出池（settle/cancel 同款删除语义——W13 键形单源：核与端写侧均 `Map.set(String(id))`
 *  ⇒ 读删一律 String 归一，数字键面随镜像删旧退役——双形兼容 = 两形状共存的掩盖面，不保留）。 */
function removeFromPool(map, id) {
  if (!map) return
  map.delete(String(id))
}

/**
 * 私有共享核（C-10——双池同构面单核）：判定 → 墓碑 → 出池 → 汇总 → 整批一次提醒 +
 * 一条 ev:discarded。族差异（池键 / 摘要 / 列表词 / 文案 / 角色名）经 spec 注入。
 * @returns {{discarded: object[], kept: number}} discarded = 丢弃条目摘要（族形态）；kept = 判定后仍在池数。
 */
function discardRole(parent, spec) {
  const map = getAsyncPool(parent, spec.pool)
  const out = { discarded: [], kept: 0 }
  if (!map || map.size === 0) return out
  for (const entry of [...map.values()]) {
    if (!discardable(entry)) continue
    out.discarded.push(spec.describe(entry))
    writeTombstoneTo(parent.history ?? parent, entry.id, "discarded", spec.roleOf(entry))
    removeFromPool(map, entry.id)
  }
  out.kept = map.size
  if (out.discarded.length > 0) {
    const list = out.discarded.map(spec.listPhrase).join(", ")
    if (parent?.history) parent.history.push({ role: "user", content: escapeXml(spec.reminder(out.discarded.length, list)) })
    logEvent("ev:discarded", { n: out.discarded.length, ids: out.discarded.map((d) => `${d.role}#${d.id}`).join(", ") })
  }
  return out
}

/** subagent 族 spec（§12 C-1~C-4——返形/文案逐字零变）。 */
const SUBAGENT_SPEC = {
  pool: "subagent",
  describe: (entry) => ({ id: entry.id, role: entry.role, wasStatus: entry.status === "queued" ? "queued" : "running" }),
  roleOf: (entry) => entry.role,
  listPhrase: (d) => `${d.role}#${d.id}${wasPhrase(d.wasStatus)}`,
  reminder: subagentReminderText,
}

/** advisor 族 spec（C-10——池无排队语义，超限即拒：wasStatus 恒 running；列表带评审类型）。 */
const ADVISOR_SPEC = {
  pool: "advisor",
  describe: (entry) => ({ id: entry.id, role: "advisor", reviewType: entry.reviewType, wasStatus: "running" }),
  roleOf: () => "advisor",
  listPhrase: (d) => `${d.role}#${d.id} (${d.reviewType}) (was running)`,
  reminder: advisorReminderText,
}

/**
 * 中止收尾（C-1~C-4）：只清已死子代理条目——写 discarded 终态墓碑 + 出池 + 整批一次提醒。
 * @param parent agent 形态（双载体同 removeFromAsyncPools：`parent.history ?? parent`）
 * @returns {{discarded: Array<{id:number, role:string, wasStatus:"running"|"queued"}>, kept:number}}
 *   discarded = 丢弃条目摘要（wasStatus ∈ running|queued）；kept = 判定后仍在池的条目数。
 */
export function discardAbortedPool(parent) {
  return discardRole(parent, SUBAGENT_SPEC)
}

/**
 * 中止收尾（C-10——advisor 池同构面）：只清已死评审条目——写 discarded 终态墓碑（role
 * "advisor"——`subagent status <id>` 回显）+ 出池 + 整批一次 C-10c 提醒；done-in-pool
 * （已完成待收集的报告）与存活评审留池。
 * @param parent agent 形态
 * @returns {{discarded: Array<{id:number, role:"advisor", reviewType:string, wasStatus:"running"}>, kept:number}}
 */
export function discardAbortedAdvisors(parent) {
  return discardRole(parent, ADVISOR_SPEC)
}
