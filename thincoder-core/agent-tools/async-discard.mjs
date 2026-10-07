/**
 * async-discard.mjs — 中止清池的「只清已死」收尾单点（批 4 CLI-ASYNC-DISCARD——CLI 侧对称；
 * 设计权威 = `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.20，需求 = `docs/core/requirements/AGENT-LOOP.md` §4.10）。
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
 * #9 后台 bash 任务族（三族同面并入——D9-7 收尾档②）：bg 条目的「已死」不由 controller 杀达
 * ——其控制器链只作**判据**（杀 ⟺ 控制器已中止），杀树动作经本收尾面 `spec.dispose` 钩子落
 * `bash-async.mjs` 杀单点（`killBgTree`）；回合中断（Ctrl+I）经 `bindChildController`
 * interrupt 豁免不中止控制器 ⇒ 本面零动作（F2 同款豁免——池保留）。
 * 批 browser-async-fix（2026-10-07）：browser 后台动作族同面并入（`BROWSER_SPEC`——dispose = 条目
 * 控制器 abort ⇒ 动作展开 / 排队丢队；**不杀浏览器**）。
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
// #9（后台 bash 任务族——收尾档②）：杀单点（树杀）经 `bash-async.mjs` 落面。
import { killBgTree } from "./bash-async.mjs"

/** 提醒模板（verbatim 同源 = 对侧 `async-discard.mjs:37-44`；测试断关键子串，不逐行断）。 */
const subagentReminderText = (n, list) =>
  `[System reminder: ${n} background subagent(s) were discarded by the user's Stop — their reports will NOT arrive: ${list}. ` +
  "Partial changes from discarded children stay unmerged/unaudited; re-spawn if the work is still needed.]"

/** 评审族提醒模板（verbatim——advisor 池同构面；整批一次注入）。 */
const advisorReminderText = (n, list) =>
  `[System reminder: ${n} background advisor review(s) were discarded by the user's Stop — their reports will NOT arrive: ${list}.\n` +
  "No design token was issued for a discarded design review; launch the review again if it is still needed.]"

/** #9 后台 bash 任务族提醒模板（同族形态——报告不可达的可视化：进程已杀，全量 log 仍在盘上）。 */
const bgReminderText = (n, list) =>
  `[System reminder: ${n} background bash task(s) were killed by the user's Stop — their processes are gone and no digest will arrive: ${list}. ` +
  "Full output logs remain on disk (paths were given in the start ack).]"

/** browser 后台动作族提醒模板（同族形态——取消无摘要：终止凭据 = 墓碑 + 杀点确认；浏览器本体不杀）。 */
const browserReminderText = (n, list) =>
  `[System reminder: ${n} background browser task(s) were cancelled by the user's Stop — no digest will arrive: ${list}. ` +
  "The browser session itself was not killed (run `close` to reset it).]"

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
    spec.dispose?.(entry) // 族特有处置（#9 bg：杀树——判据成立即条目真死；其余族无此钩子）
    writeTombstone(parent, entry.id, "discarded", spec.roleOf(entry))
    removeFromPool(map, entry.id)
  }
  out.kept = map.size
  if (out.discarded.length === 0) return out // 零丢弃 = 零噪音（零注入 / 零事件）
  spec.pruneQueue?.(parent, ids)
  const list = out.discarded.map(spec.listPhrase).join(", ")
  // 注入面（#94 载体两形吸收）：agent 形（run-stages ∕ 挂起中止接线点——`parent.history` 在）走
  // `pushReal`（机器 + 人读双线）；**history 数组本体形**（VSC 挂起载体——池挂数组）无注入目标 ⇒
  // 跳过（与对侧 VSC copy 的 `parent?.history` 守卫同判；§6.20.1「carrier 形无注入目标」先例）
  // ——墓碑与 `ev:discarded` 照发，仅模型可见提醒缺席（数组形无人读线可达面）。
  if (parent?.history) pushReal(parent, { role: "user", content: spec.reminder(out.discarded.length, escapeXml(list)) })
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

/** #9 后台 bash 任务族 spec（收尾档②）：dispose = 杀树（杀单点 `killBgTree`）+ 标记 discarded
 *  （settle 面据此不注入——报告不可达）；无队列面（超限 = 起跑显式拒，无排队语义）。 */
const BG_SPEC = {
  pool: "bg",
  describe: (entry) => ({ id: entry.id, role: "bg", command: entry.command }),
  roleOf: () => "bg",
  listPhrase: (d) => `bash#${d.id} (\`${d.command}\`)`,
  reminder: bgReminderText,
  dispose: (entry) => {
    entry.discarded = true
    killBgTree(entry)
  },
}

/** browser 后台动作族 spec（批 browser-async-fix——收尾档同面）：dispose = 中止在飞（条目控制器
 *  abort ⇒ running 动作展开 / queued 丢队从未运行）+ 标记 discarded（settle 面据此不注入——摘要不可达）；
 *  无队列面（帽 = 起跑显式拒）。**不杀浏览器**（会话重置是独立动作 `close`）。 */
const BROWSER_SPEC = {
  pool: "browser",
  describe: (entry) => ({ id: entry.id, role: "browser", action: entry.action }),
  roleOf: () => "browser",
  listPhrase: (d) => `browser#${d.id} (${d.action})`,
  reminder: browserReminderText,
  dispose: (entry) => {
    entry.discarded = true
    entry.controller?.abort?.({ abortTrigger: "discard" })
  },
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

/**
 * 中止收尾（#9 后台 bash 任务族——收尾档②）：只清已死条目——逐条**杀树**（判据成立 ⟺ 条目
 * 控制器已中止；杀单点经 `killBgTree`）+ `discarded` 墓碑 + 出池 + 整批一次提醒；回合中断
 * （Ctrl+I）不中止控制器 ⇒ 本面零动作（池保留——F2 同款豁免）。
 * @param parent agent 形态
 * @param ctx 判据 ctx（接线点不传——controller 支，同上）
 * @returns {{discarded: Array<{id, role: "bg", command}>, kept: number}}
 */
export function discardAbortedBgTasks(parent, ctx = null) {
  return discardRole(parent, BG_SPEC, ctx)
}

/**
 * 中止收尾（browser 后台动作族——同面并入）：只清已死条目——逐条中止在飞（running ⇒ 动作展开；
 * queued ⇒ 丢队从未运行）+ `discarded` 墓碑 + 出池 + 整批一次提醒；回合中断（Ctrl+I）不中止控制器
 * ⇒ 本面零动作（池保留——与 bg 同豁免）。
 * @param parent agent 形态
 * @param ctx 判据 ctx（接线点不传——controller 支，同上）
 * @returns {{discarded: Array<{id, role: "browser", action}>, kept: number}}
 */
export function discardAbortedBrowserTasks(parent, ctx = null) {
  return discardRole(parent, BROWSER_SPEC, ctx)
}
