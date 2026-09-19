/**
 * async-discard.mjs — 中止清池的「只清已死」收尾单点（批 4 CLI-ASYNC-DISCARD——CLI 侧对称；
 * 设计权威 = `docs/core/design/AGENT-LOOP-SUBAGENT.md` §6.20，需求 = `docs/core/requirements/AGENT-LOOP.md` §4.10）。
 *
 * 原作 = 两接线点中止分支的无差别清池（`thincoder-core/agent/run-stages.mjs` 回合尾中止 ·
 * `thincoder-cli/src/tui/suspension-drive.mjs` 挂起会话中止）——`_asyncSubagents.clear()` +
 * `_asyncAdvisors.clear()` + `_asyncQueue = []`：被清出的条目不留终态、无提醒、无事件 ⇒
 * 模型只能猜「后台报告到底到没到」。对侧基准 = `thincoder-vscode/src/agent-tools/async-discard.mjs`
 * （本批 VSC 零写入；同机制两实现 = D-AD7 已知重复登记，收敛另案）。
 *
 * 单不变量（§6.20.3）：**清池 ⟺ 该条目已死且其报告不可达**。
 * - 丢弃 ⟺ `entry.done !== true ∧ entry.cancelled !== true ∧ parentAborted(ctx, entry)`；
 * - 保留 ⟺ 其余——存活条目（controller 未中止——报告沿自动通道到达）/ done-in-pool（回合尾
 *   收集 / 挂起 sweep 消化）/ cancelled（settle cancelled 分支收尾）。
 *
 * 判据口径（D-AD6）：两接线点**均不传 `ctx`** ⇒ 实走 controller 支（`parentAborted(null, entry)`）
 * ——与对侧有效判据同判（对侧传入的 `ctx` 为死参）；`ctx` 保留为签名备用面（直调用例 / 对侧收敛）。
 * 「controller 已中止 = 条目真死」由 `bindChildController` 单点保证（`async-settle.mjs:88-98`
 * 双路：基信号已中止 ⇒ 立即 abort；未来中止 ⇒ 带活监听逐链传播；interrupt 不逐链）。
 *
 * 动作序（§6.20.3）：每条目 = 写 `discarded` 墓碑（**载体吸收单点** `writeTombstone`——父对象无
 * 自有 `_asyncTombstones` 而 `history` 有 ⇒ 借用同一 Map，不另建分叉）→ 出池 → 队列剔除（存活
 * 条目 `position` 重编号——与 cancel 出队 `subagent-async.mjs:190` 同式；ED-4 后 advisor 族
 * 同样剔除其独立队列 `_asyncAdvisorQueue`）→ 汇总；整批（有丢弃才发生）= **一次** `pushReal`
 * 模型可见提醒（user 角色——escapeXml 转义插值）+ **一条** `ev:discarded`（零丢弃 ⇒ 零注入、
 * 零事件）。
 *
 * 端差登记（D-AD8a/b）：注入走核 `pushReal`（机器线 + 人读线——对侧直 `history.push`）；转义只
 * 覆盖插值（对侧整条转义）——文案骨架无 XML 特殊字符 ⇒ 可观察输出等价。
 *
 * 模块图：单向 import 核单点 `async-settle.mjs`（`parentAborted` / `getAsyncPool` /
 * `writeTombstone`）+ `../context.mjs`（`pushReal`）/ `../agent/helpers.mjs`（`escapeXml`）/
 * `../log.mjs`——叶子向、无环。
 */
import { carrierField, getAsyncPool, parentAborted, writeTombstone } from "./async-settle.mjs"
import { pushReal } from "../context.mjs"
import { escapeXml } from "../agent/helpers.mjs"
import { logEvent } from "../log.mjs"

/** 提醒模板（verbatim 同源 = 对侧 `async-discard.mjs:37-44`；测试断关键子串，不逐行断）。 */
const subagentReminderText = (n, list) =>
  `[System reminder: ${n} background subagent(s) were discarded by the user's Stop — their reports will NOT arrive: ${list}. ` +
  "Partial changes from discarded children stay unmerged/unaudited; re-spawn if the work is still needed.]"

/** 评审族提醒模板（verbatim——advisor 池同构面；整批一次注入）。 */
const advisorReminderText = (n, list) =>
  `[System reminder: ${n} background advisor review(s) were discarded by the user's Stop — their reports will NOT arrive: ${list}.\n` +
  "No design token was issued for a discarded design review; launch the review again if it is still needed.]"

/** 列表词（wasStatus 数据源）：queued → "(was queued — never started)"；其余 "(was running)"。 */
const wasPhrase = (wasStatus) => (wasStatus === "queued" ? " (was queued — never started)" : " (was running)")

/** 丢弃判定（单点复用——零新谓词）：`parentAborted` 复用核守卫单点（interrupt 豁免内建）。 */
function discardable(entry, ctx) {
  return entry.done !== true && entry.cancelled !== true && parentAborted(ctx, entry)
}

/** 出池（键形单源：写侧 `Map.set(String(id))` ⇒ 读删一律 String 归一）。 */
function removeFromPool(map, id) {
  if (!map) return
  map.delete(String(id))
}

/** 队列剔除（D-AD4——接线点原 `agent._asyncQueue = []` 行由本模块接管）：剔除已丢弃 id，存活
 *  条目 `position` 按 `1..n` 重编号（面板 / status 的 queue position 与队列内容保持一致）。
 *  ED-4（2026-09-16）：queueKey 参数化——subagent 族 `_asyncQueue`、advisor 族
 *  `_asyncAdvisorQueue`（评审池有排队语义后同面剔除）。 */
function pruneQueue(parent, ids, queueKey) {
  const queue = carrierField(parent, queueKey) // #43-①：第四读面同式吸收（载体形队列）
  if (!Array.isArray(queue) || queue.length === 0) return
  for (let i = queue.length - 1; i >= 0; i--) {
    if (ids.has(String(queue[i]?.id))) queue.splice(i, 1)
  }
  for (let i = 0; i < queue.length; i++) queue[i].position = i + 1
}

/**
 * 私有共享核（族差异经 spec 注入：池键 / 摘要 / 列表词 / 文案 / 角色名 / 队列剔除面）。
 * @returns {{discarded: object[], kept: number}} discarded = 丢弃条目摘要（族形态）；kept = 判定后仍在池数。
 */
function discardRole(parent, spec, ctx) {
  const map = getAsyncPool(parent, spec.pool)
  const out = { discarded: [], kept: 0 }
  if (!map || map.size === 0) return out
  const ids = new Set()
  for (const entry of [...map.values()]) {
    if (!discardable(entry, ctx)) continue
    out.discarded.push(spec.describe(entry))
    ids.add(String(entry.id))
    writeTombstone(parent, entry.id, "discarded", spec.roleOf(entry))
    removeFromPool(map, entry.id)
  }
  out.kept = map.size
  if (out.discarded.length === 0) return out // 零丢弃 = 零噪音（零注入 / 零事件）
  spec.pruneQueue?.(parent, ids)
  const list = out.discarded.map(spec.listPhrase).join(", ")
  pushReal(parent, { role: "user", content: spec.reminder(out.discarded.length, escapeXml(list)) })
  logEvent("ev:discarded", { n: out.discarded.length, ids: out.discarded.map((d) => `${d.role}#${d.id}`).join(", ") })
  return out
}

/** subagent 族 spec（对侧 `:90-96` 同形；队列剔除 = 本族 `_asyncQueue`——queueKey 参数化面）。 */
const SUBAGENT_SPEC = {
  pool: "subagent",
  describe: (entry) => ({ id: entry.id, role: entry.role, wasStatus: entry.status === "queued" ? "queued" : "running" }),
  roleOf: (entry) => entry.role,
  listPhrase: (d) => `${d.role}#${d.id}${wasPhrase(d.wasStatus)}`,
  reminder: subagentReminderText,
  pruneQueue: (parent, ids) => pruneQueue(parent, ids, "_asyncQueue"),
}

/** 评审族 spec（对侧 `:99-105` 同形；ED-4 后含排队面：wasStatus 读条目 status——queued →
 *  "(was queued — never started)"；队列剔除 = 评审独立队列 `_asyncAdvisorQueue`）。 */
const ADVISOR_SPEC = {
  pool: "advisor",
  describe: (entry) => ({ id: entry.id, role: "advisor", reviewType: entry.reviewType, wasStatus: entry.status === "queued" ? "queued" : "running" }),
  roleOf: () => "advisor",
  listPhrase: (d) => `${d.role}#${d.id} (${d.reviewType})${wasPhrase(d.wasStatus)}`,
  reminder: advisorReminderText,
  pruneQueue: (parent, ids) => pruneQueue(parent, ids, "_asyncAdvisorQueue"),
}

/**
 * 中止收尾（F1–F3）：只清已死子代理条目——写 `discarded` 墓碑 + 出池 + 队列剔除 + 整批一次提醒。
 * @param parent agent 形态（载体双形经 `getAsyncPool` / `writeTombstone` 吸收）
 * @param ctx 判据 ctx（**接线点不传**——controller 支，D-AD6；仅直调用例使用）
 * @returns {{discarded: Array<{id, role, wasStatus: "running"|"queued"}>, kept: number}}
 *   discarded = 丢弃条目摘要；kept = 判定后仍在池的条目数。
 */
export function discardAbortedPool(parent, ctx = null) {
  return discardRole(parent, SUBAGENT_SPEC, ctx)
}

/**
 * 中止收尾（F3——评审池同构面）：只清已死评审条目——写 `discarded` 墓碑（role "advisor"）+
 * 出池 + 整批一次提醒；done-in-pool（已完成待收集）与存活评审留池。
 * @param parent agent 形态
 * @param ctx 判据 ctx（接线点不传——同上）
 * @returns {{discarded: Array<{id, role: "advisor", reviewType, wasStatus: "running"|"queued"}>, kept: number}}
 */
export function discardAbortedAdvisors(parent, ctx = null) {
  return discardRole(parent, ADVISOR_SPEC, ctx)
}
