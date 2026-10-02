/**
 * events-wake.mjs — **宿主唤醒面三切片归约径**出档（R5 · 桌面功能对位批「先拆后改」：归约核心档
 * `renderer/events.mjs` 届盘 483 行，R5 增目标切片与态机两触发后触 500 硬限 ⇒ 该族先出档 —— 结构拆分
 * 零语义；口径 = `docs/desktop/design/PROJECT.md` §2 KD-T7「越层档一律先拆后改」）。
 * 三面（皆**宿主自产**，非回调映射 —— 单源 = `docs/desktop/design/IPC.md` §1 三行）：
 *   ① `onSusp`（`ev:susp` —— 挂起窗计数切片；空闲唤醒批）+ **R5（#522②）**：`active:false` 出窗帧兼走
 *      **退出兜底**（本键子 agent 块全体归档 —— `freezeAllSubBlocks` 直取；挂起窗内 live 块出窗即收口）
 *   ② `onDigest`（`ev:digest` —— 消化轮切片（**全轮累积**——`start` **追加本轮**（切片 = […旧轮, 本轮]；
 *      行**出即留**——零清理机器）∕ `cap`·`end` 就末轮更新；本批 2026-10-01 收正——用户 2026-10-01 07:54 ∥ 07:58）；
 *      空闲唤醒批）——轮记录 = `{ status, n, tier, from, msg }`（**零位置面**：位置 ∥ 编号 ∥ 轮序标随拆净 —— 本批 #765）
 *   ③ `onTimer`（`ev:timer` —— 到期触发切片；timer-wake 阶段 2）
 * 共件 `countOf`（三切片共用归一口径 —— 随迁，单一实现零副本）。
 * 依赖单向：本档 → `renderer/events-flags.mjs`（`sameRecord`）· `renderer/subagent-reduce.mjs`（退出兜底）；
 * 主档 `renderer/events.mjs` 反向引本档三件分派 —— **无环**。
 * 纪律：纯归约（零 DOM / 零 IPC ⇒ 平 node 直测）；文案零硬编码（本档不出词）。
 */
import { sameRecord } from "./events-flags.mjs"
import { freezeAllSubBlocks } from "./subagent-reduce.mjs"

/** 计数归一（`ev:susp` 四计数 / `ev:digest` `n` ∕ `ms` —— 非数 ⇒ 0，沿状态行 `numOf` 同判；零抛）。 */
function countOf(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0
}

/** `ev:susp`——挂起窗计数切片（按会话 `key` · 同键就地替换 · 首写自种）：载荷 = 核 `backgroundCounts` 直传
 *  四计数（`running` / `queued` / `pending` / `done`）+ `active`（进出两态 —— `active:false` 为退出唯一形态）
 *  + 出窗帧另携 `interrupted`（会话中止事实 —— #554①；转 `freezeAllSubBlocks` 消费 —— 本档零预读）。
 *  消费 = 状态行段 3 挂起句（`renderer/views/statusline.mjs`；`active:false` ⇒ 段回落两态词 —— **禁假造**）。
 *  同键同值 ⇒ **原引用**（零重绘）；`active` 只收严格真；四计数非数 ⇒ 归一 0（不落 `NaN` 入词面）。
 *  **R5（#522②）**：`active:false`（出窗帧）兼走**退出兜底** —— 本键子 agent 块全体归档
 *  （`freezeAllSubBlocks`；与切片写**两事不互匝** —— 同值帧亦须走兜底）。
 *  **本批 2026-10-01 · #765**：旧「收帧清边界」件随位置面设施拆净 —— 消化行 = 流内普通项（无边界可清；
 *  帧刷单轮对位，比对面 = `renderer/views/chat-digest-rows.mjs`）。 */
export function onSusp(state, ev, now) {
  const record = {
    active: ev.active === true,
    running: countOf(ev.running), queued: countOf(ev.queued), pending: countOf(ev.pending), done: countOf(ev.done),
  }
  const table = state.susp ?? {}
  const sliced = sameRecord(table[ev.key], record) ? state : { ...state, susp: { ...table, [ev.key]: record } }
  return ev.active === true ? sliced : freezeAllSubBlocks(sliced, ev, now)
}

/** `ev:digest`——消化轮切片（按会话 `key` · **全轮累积**——`start` **追加本轮**（切片 = […旧轮, 本轮]；行**出即留**
 *  ——零清理机器；本批 2026-10-01 收正 = 用户 07:54 直斥（「多此一举的自我感动」）∥ 07:58 转写失真认账）：
 *  `cap`（#541 —— 撞帽边界帧）**就末轮**记撞帽事实
 *  （`cap: { mode, turns }` —— 保起跑 `n`）；`end` **就末轮**更新（保留起跑 `n` —— 终态句 `digest.done` 需 n；
 *  `ok` 缺省 ⇒ 真，沿宿主 `ok !== false` 判据；并末轮 ⇒ 撞帽事实跨 `end` 存续）；**记录面全量照留**
 *  （人读线 `digest` 记录 —— 显示 ∥ 记录两面同在档）。
 *  轮记录 = `{ status, n, tier, from, msg }`（本批 2026-10-01 · #765 精收：**零位置面**——位置 ∥ 编号 ∥ 身份标
 *  随拆净）；行族出生 ∥ 终态追加（零就地换文 ∥ 零摘除）归帧面 `renderer/views/chat-digest-rows.mjs`
 *  （自然形收正批 · 2026-10-01）。
 *  表外 `status` ⇒ 零写；**无轮**（`cap` ∕ `end` 而轮集空）⇒ **零写**（防守档——**可达面 = 起跑帧未及**（轮在飞时渲染面新接入——
 *  其后 `cap` ∥ `end` 帧零写）；渲染面自该轮起跑帧在连 ⇒ 不可达——归属规则（活流侧优先）保运行期未结轮跨首屏存续；
 *  VSC 死游标零动作只系 `end`）；同值 ⇒ 原引用（`cap` 支例外 —— 对象载荷按引用判不等 ⇒ 重投产新 state；该帧每轮恰一发，零重绘影响）。
 *  消费 = 流内消化行族 `[data-digest]`（`renderer/views/chat-digest-rows.mjs`）。**留档批 · #719**：本归约体
 *  **直复用于复列**（`renderer/page-read.mjs` 记录折叠 —— 记录形 = 事件形；折出轮 = **全量**（未结轮照现——
 *  消化重放口径批 · 2026-10-01）——单一实现零副本）。 */
export function onDigest(state, ev) {
  const table = state.digest ?? {}
  const rounds = Array.isArray(table[ev.key]) ? table[ev.key] : []
  if (ev.status === "start") {
    const round = {
      status: "start", n: countOf(ev.n),
      tier: ev.tier === "ask" ? "ask" : null,
      from: typeof ev.from === "string" ? ev.from : null,
      msg: typeof ev.msg === "string" ? ev.msg : null,
    }
    // 全轮累积（本批 2026-10-01 收正 · 台账 #768）：`start` **追加本轮** —— 切片 = [...旧轮, 本轮]（行出即留）；
    // 记录面零动（轮事件三型全量逐条入人读线记录 —— 单源 = `docs/desktop/design/RENDERER.md` §1.1 归约面条）。
    return { ...state, digest: { ...table, [ev.key]: [...rounds, round] } }
  }
  if (ev.status !== "cap" && ev.status !== "end") return state
  const prev = rounds[rounds.length - 1]
  if (prev === undefined) return state // 无轮 ⇒ 零写（防守档——可达面 = 起跑帧未及；自该轮起跑帧在连 ⇒ 不可达）
  let record = null
  if (ev.status === "cap") {
    // 撞帽事实（渲染面 cap 行 —— 对位 VSC `chat-status.js:97-105`）：`mode` 归一（表外 ⇒ `auto` —— 两分支
    // 逐字镜像）；`turns` 非数 ⇒ `null`（词面 `?` 兜底归渲染面）。
    record = {
      ...prev, status: prev.status === "end" ? "end" : "cap", // 终态守卫：已 `end` 轮不被 cap 帧回退（cap 事实照落）
      cap: {
        mode: ev.mode === "stop" ? "stop" : "auto",
        turns: typeof ev.turns === "number" && Number.isFinite(ev.turns) ? ev.turns : null,
      },
    }
  } else record = { ...prev, status: "end", ok: ev.ok !== false, ms: countOf(ev.ms) }
  if (sameRecord(prev, record)) return state
  return { ...state, digest: { ...table, [ev.key]: [...rounds.slice(0, -1), record] } }
}

/** `ev:timer`——到期触发切片（按会话 `key` 分槽 · 同键就地替换——**最近一次交付**；行文 = 交付原文）：
 *  消费 = 流内触发行组 `[data-timer]`（构树 ∕ 帧尾同刷住 `renderer/views/chat-chrome.mjs`）；生命期 = **运行期痕**
 *  （非落盘件 —— 首屏页读整置即失；同 `[data-stopped]` 族）；`text` 非非空串 ⇒ **零写**（禁假造空行）。
 *  显示裁（≤3 行 + `…`）= 渲染面单点（`timerGroupNode`）；单源 = `docs/core/design/AGENT-LOOP-ASYNC-POOL.md` §6.30.11。 */
export function onTimer(state, ev) {
  if (typeof ev.text !== "string" || ev.text === "") return state
  const table = state.timerNotice ?? {}
  const record = { text: ev.text }
  if (sameRecord(table[ev.key], record)) return state
  return { ...state, timerNotice: { ...table, [ev.key]: record } }
}
