/**
 * trace-store.mjs — §18.6 完整轨迹存档（AGENT-LOOP.md §18.6 D-TR1..TR8 权威规格）。
 *
 * 完整请求-响应轨迹落盘：每次 chat() 调用一个 JSONL 文件到
 * ~/.thincoder/traces/YYYY-MM-DD/<sessionKey>-<seq>.jsonl。采集点唯一 = core.mjs
 * chat() 导出出口（所有模型调用——主回合/消化轮/compress/distill/advisor/子代理/
 * auto-think/consult——都经该函数）——续写/重试在出口已合并（reasoning 全量）。
 *
 * 纪律（与 log.mjs 同源惯例）：
 * - 真 fire-and-forget（F-TR3——模型调用路径零额外阻塞）：seq 同步预留（原子号位），
 *   写盘异步（node:fs/promises——不 await）；落盘失败静默降级（不抛错、不阻塞
 *   chat() 返回）。recordChatTrace 返回落盘 promise——仅供测试/显式消费方 await。
 * - 测试隔离：node --test 进程（NODE_TEST_CONTEXT）默认不写盘——防测试事件污染真实
 *   轨迹目录（既有测试跑真实 agent 管线会产生数百次 chat 调用）；显式设置
 *   THINCODER_TRACES_DIR 强制写入该目录（traces.test.mjs 用它隔离临时目录——
 *   与 log.mjs 的 THINCODER_LOG_DIR 同惯例）。
 * - 脱敏（D-TR2）：复用 log.mjs 字段名黑名单（apikey/designtoken/password/secret/
 *   token/authorization/proxyuri/proxy）+ SECRET_FORM 形态扫描（redactSecret）——对
 *   messages/content/reasoning/toolCalls/error 全字段递归应用；不发明新遮蔽模式。
 * - 容量有界（N-TR1）：单条轨迹一个文件，大小不限（"成本不是问题"——不截断、不
 *   脱漏行）；目录按日组织（YYYY-MM-DD），可按日/会话过滤；不自动清理（D-TR8——
 *   清理机制记 docs/TODO.md 技术组）。
 * - seq = 当日目录内最大已有 seq + 1（D-TR3——跨会话/进程重启不覆写既有旧轨迹——
 *   18.6.1 评审 #3）。
 * - 日期分日按本地时区（D-TR3——2026-09-04 fix round1：初版 toISOString()=UTC——
 *   本地 00:00-08:00 的调用会落进前一日目录——改本地日期字符串 YYYY-MM-DD——T-TR12）。
 * - isContinuation（D-TR1——2026-09-04 fix round1）：续写/重试链标记——true = 该调用
 *   是续写链的一环（core.mjs 续写递归传出 logCtx.isContinuation）；新调用 false。
 *   记录不输出 round 字段（全设计无 round 定义——删——不发明无来源字段）。
 */
import { readdirSync, existsSync } from "node:fs"
import { appendFile, mkdir } from "node:fs/promises"
import { join } from "node:path"
import { createHash } from "node:crypto"
import { configDir } from "../config.mjs"
import { redactSecret, errText, classifyErr } from "../log.mjs"
import { normalizeCwd } from "../session-slots.mjs"

/** 轨迹根目录：THINCODER_TRACES_DIR（测试隔离/override——同 THINCODER_LOG_DIR
 *  惯例）> ~/.thincoder/traces（configDir——D-TR3——与 sessions/ 同域）。 */
export function tracesRoot() {
  return process.env.THINCODER_TRACES_DIR ?? join(configDir, "traces")
}

/** 写门（测试隔离）：test runner 进程（NODE_TEST_CONTEXT）默认跳过——除显式
 *  THINCODER_TRACES_DIR override（traces.test.mjs 隔离临时目录）。 */
function writeEnabled() {
  if (process.env.NODE_TEST_CONTEXT && !process.env.THINCODER_TRACES_DIR) return false
  return true
}

/** sessionKey = sha1(normalizeCwd(cwd))[:12]（D-TR3——与 session-slots sessionPath
 *  同算法同 cwd 归一——两端 hash 一致）。 */
export function traceSessionKey(cwd) {
  return createHash("sha1").update(normalizeCwd(cwd)).digest("hex").slice(0, 12)
}

/** 本地时区日期字符串 YYYY-MM-DD（D-TR3——2026-09-04 fix round1：初版
 *  toISOString()=UTC 日期——本地 00:00-08:00 落前一日目录；本地日期才是用户视角的
 *  "今天"——T-TR12）。recordChatTrace 与测试读取 helpers 共用同一实现——不双写。 */
export function localDateStr(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

/** Test hooks（_rateHooks 同惯例——rate.mjs：测试可替换 now——T-TR12 注入本地日 ≠
 *  UTC 日的时刻验证分日；生产永远走真实时钟）。 */
export const _traceHooks = {
  now: () => new Date(),
}

/** 当日轨迹目录（D-TR3：traces/YYYY-MM-DD——分日组织——N-TR1）。 */
export function tracesDirFor(dateStr) {
  return join(tracesRoot(), dateStr)
}

// 进程内 seq 预留表：同步预留（原子——异步写盘在途时并发调用不撞号）；键 = 目录。
// 跨进程/重启由磁盘 max 兜底（同键无预留时磁盘值即事实——T-TR10）。
const _reservedSeq = new Map()

/** seq = max(当日目录最大已有 seq, 进程内已预留) + 1（D-TR3——跨会话/进程重启
 *  不覆写——T-TR8/T-TR10；同步预留 = 异步写盘启动前的原子号位分配）。 */
export function nextTraceSeq(dateStr) {
  const dir = tracesDirFor(dateStr)
  let max = 0
  if (existsSync(dir)) {
    let names
    try {
      names = readdirSync(dir)
    } catch {
      // 目录不可读——按预留表续号（不静默撞号）
      max = _reservedSeq.get(dir) ?? 0
      _reservedSeq.set(dir, max + 1)
      return max + 1
    }
    for (const name of names) {
      const m = name.match(/-(\d+)\.jsonl$/)
      if (m) max = Math.max(max, Number(m[1]))
    }
  }
  const seq = Math.max(max, _reservedSeq.get(dir) ?? 0) + 1
  _reservedSeq.set(dir, seq)
  return seq
}

/** 开关（D-TR6）：traces.enabled 缺省 on（默认全采集）；logCtx.traces === false
 *  显式关闭（调用点读取 agent.config.traces.enabled——D-TR6）。 */
export function tracesEnabled(logCtx) {
  return logCtx?.traces !== false
}

/** 递归脱敏（D-TR2）：对 messages/content/reasoning/toolCalls/error 全字段应用——
 *  字段名命中黑名单 → 遮蔽；字符串内容命中密钥形态（sk-/Bearer/-key=）→ 截断到
 *  形态前 + 标记。数组/对象递归（消息 content 可为 parts 数组、toolCalls 嵌套）。 */
function redactValue(fieldKey, value) {
  if (typeof value === "string") return redactSecret(fieldKey, value)
  if (Array.isArray(value)) return value.map((v) => redactValue(fieldKey, v))
  if (value && typeof value === "object") {
    const out = {}
    for (const [k, v] of Object.entries(value)) out[k] = redactValue(k, v)
    return out
  }
  return value
}

/**
 * 收集一次 chat 调用轨迹（D-TR1 字段集）——fire-and-forget（F-TR3）。
 * 由 core.mjs chat() 导出出口调用（唯一采集点——N-TR2）；签名零参数膨胀——
 * 数据全部来自调用方已传入的 opts（logCtx 元数据——D-TR4）+ provider + result/error。
 *
 * @param {Object} provider chat() 的 provider 参数（provider/model 字段来源）
 * @param {Object} opts chat() 原始 opts —— messages（输入）与 logCtx（元数据：
 *   role/depth/kind/session/cwd/stage/turn/traces——调用点增补，D-TR4）
 * @param {Object|null} result chatImpl 返回值（成功路径——content/reasoning/
 *   toolCalls/usage/finishReason；N-TR3：出口汇总——续写/重试后全量）
 * @param {Error|null} error chat() 抛出的错误（失败路径——D-TR5：error（errText
 *   截断 + 类别）+ finishReason:null——失败轨迹恰是分析纠结点最有效的材料）
 */
export function recordChatTrace(provider, opts = {}, result = null, error = null) {
  if (!writeEnabled()) return
  const logCtx = opts.logCtx ?? {}
  if (!tracesEnabled(logCtx)) return
  // cwd/session 经 logCtx 增补（调用点传 agent.cwd / agent._sessionStart——
  // D-TR3 的 cwdHash/命名与 D-TR1 的 session 字段所需）；无 agent 作用域的调用点
  // 回退 process.cwd()——CLI 会话即工作区。该类点开关状态：distill 已含
  // traces 开关（D-TR6 fix round1）；auto-think 已闭环（D-TS12——chat 调用点
  // logCtx 全字段补传：traces/session/cwd/role/depth/kind——无残留点）。
  const cwd = logCtx.cwd ?? process.cwd()
  // D-TR3（fix round1）：分日按本地时区（_traceHooks.now——T-TR12 注入点）；
  // ts 与 dateStr 同源（同一时刻）——记录时间戳与目录日不撕裂。
  const now = _traceHooks.now()
  const dateStr = localDateStr(now)
  const seq = nextTraceSeq(dateStr)
  const sessionKey = traceSessionKey(cwd)
  const record = {
    ts: now.toISOString(),
    session: logCtx.session ?? null,
    cwdHash: createHash("sha1").update(normalizeCwd(cwd)).digest("hex"),
    role: logCtx.role ?? null,
    depth: logCtx.depth ?? null,
    turn: logCtx.turn ?? null,
    provider: provider?.name ?? provider?.model ?? "unknown",
    model: provider?.model ?? "",
    stage: logCtx.stage ?? null,
    kind: logCtx.kind ?? null,
    // D-TR1（fix round1）：续写/重试链标记——true = 该调用是续写链的一环
    // （core.mjs 续写递归传出）；新调用缺省 false——round 字段已删（无来源）。
    isContinuation: logCtx.isContinuation === true,
    messages: redactValue("messages", opts.messages ?? []),
    content: redactValue("content", result?.content ?? null),
    reasoning: redactValue("reasoning", result?.reasoning ?? null),
    toolCalls: redactValue("toolCalls", result?.toolCalls ?? null),
    usage: result?.usage ?? null,
    finishReason: result?.finishReason ?? null,
  }
  if (error != null) {
    // D-TR5：错误路径轨迹——error（errText 截断 + 类别）+ finishReason:null
    record.error = {
      err: redactValue("err", errText(error, 500)),
      kind: classifyErr(error, opts.signal),
    }
  }
  // 真 fire-and-forget（F-TR3——模型调用路径零额外阻塞）：seq 已在上面同步预留
  // （原子号位——写盘在途并发不撞号）；写盘异步（不 await——chat() 出口立即返回）。
  // 返回值 = 落盘 promise（测试 await 用；chat() 不消费——fire-and-forget 语义）。
  return (async () => {
    try {
      const dir = tracesDirFor(dateStr)
      await mkdir(dir, { recursive: true }) // D-TR3：写前建目录（与 sessions/tool-results 同惯例）
      await appendFile(join(dir, `${sessionKey}-${seq}.jsonl`), JSON.stringify(record) + "\n", "utf8")
    } catch {
      // F-TR3：落盘失败静默降级——不抛错、不阻塞 chat() 返回
    }
  })()
}
