/**
 * zero-write-watch.mjs — 零落笔看门狗叶（批 subagent-zero-write-watchdog · 台账 #934）。
 * 设计权威 = `docs/core/design/AGENT-LOOP-UPSTREAM.md` §6.32；需求 = `docs/core/requirements/AGENT-LOOP.md` §4.16。
 *
 * 两族（§6.32.2）：子代理族 = eng-coder / eng-designer **连续** N 轮零文件写（采集点邻单点 =
 * `agent/turn-loop.mjs` 轮顶——streak 更新与越阈判定同点）；评审族 = 异步评审 **连续** N 轮零评审
 * 文本产出（`advisor/loop.mjs` 循环局部计数 + 可选钩子 `seams.onStallRound`）。
 *
 * 送达 = 复用 §6.27 上行通道（`pushChildUpstream`——note 类：同队列同消费点、零唤醒、零新容器）；
 * **只推提醒**——不自动杀 / 不自动转向 / 不代父侧动作（§6.32.10-1）。
 * 防轰炸 = 闩 + 写后重臂（子代理族：`_zeroWriteAlerted`；评审族：单次运行闩——§6.32.3）。
 * 文案单源 = 本档两族文本函数（§6.32.4 逐字——父侧定稿；`from` + 轮数为唯一变量）。
 * 零依赖叶：静态 import 只取 `parent-channel.mjs` 的 `pushChildUpstream`（不引池 / 端面 / 循环）。
 */
import { pushChildUpstream } from "./parent-channel.mjs"

/** 阈值单源（连续轮数——两族共用；§6.32.2 阈值固定 50，不做配置键）。 */
export const ZERO_WRITE_ALERT_ROUNDS = 50

/** 子代理族触面（用户点名三角色中的两位——有文件写面；explore / plan / consult / 普通 coder / depth-0 不设）。 */
const WATCH_ROLES = new Set(["eng-coder", "eng-designer"])

/** 子代理族文案（§6.32.4 逐字——父侧定稿；`from` = `_upstream.label`，形 `role#id`）。 */
export function zeroWriteAlertText(from, rounds) {
  return `[zero-write watchdog] ${from}: ${rounds} consecutive rounds with no file write — take a look (subagent action:'status' for the live view).`
}

/** 评审族文案（§6.32.4 逐字——父侧定稿；`from` = `advisor#<entry id>`）。 */
export function advisorAlertText(from, rounds) {
  return `[zero-write watchdog] ${from}: ${rounds} consecutive rounds with no review output — take a look (subagent action:'status' / 'cancel').`
}

/**
 * 子代理族判定 + 推送（§6.32.6）——门 = `_role` ∈ 触面 ∧ `_upstream.parent` 在场 ∧
 * `_zeroWriteStreak` **为整数** ≥ 阈值（缺字段 / 非整数 ⇒ 不判——不冒充 `0`）∧ 未闩；
 * 命中 ⇒ `pushChildUpstream({parent, from: _upstream.label, kind: "note", message})` + 置闩。
 * **恒零抛**（兜底捕获兑现——自动源无模型可报错；失败面静默跳过）。
 * @param {object} child 子 agent（eng-coder / eng-designer 形态；`_upstream` 由 spawn 站点装配）。
 * @returns {boolean} 是否命中推送（测试面）。
 */
export function maybeZeroWriteAlert(child) {
  try {
    if (!WATCH_ROLES.has(child?._role)) return false
    const upstream = child._upstream
    if (!upstream?.parent) return false
    const streak = child._zeroWriteStreak
    if (!Number.isInteger(streak) || streak < ZERO_WRITE_ALERT_ROUNDS) return false
    if (child._zeroWriteAlerted) return false
    pushChildUpstream({
      parent: upstream.parent,
      from: upstream.label,
      kind: "note",
      message: zeroWriteAlertText(upstream.label, streak),
    })
    child._zeroWriteAlerted = true
    return true
  } catch {
    return false // 恒零抛兑现（§6.32.6——失败面静默跳过）
  }
}

/**
 * 评审族推送（组合文案 + push——呼点 = 评审环路钩子 `seams.onStallRound`，单次运行至多一次）。
 * **恒零抛**（实现面兜底捕获兑现——抛错不得上抛为评审 failed 面；§6.32.6）。
 * @param {object} parent 父 agent（接收方——`pushChildUpstream` 载体吸收同款）。
 * @param {string} from 来源标签（`advisor#<entry id>`）。
 * @param {number} rounds 连续无产出轮数。
 * @returns {boolean} 是否推送成功（测试面）。
 */
export function pushAdvisorAlert(parent, from, rounds) {
  try {
    pushChildUpstream({ parent, from, kind: "note", message: advisorAlertText(from, rounds) })
    return true
  } catch {
    return false
  }
}
