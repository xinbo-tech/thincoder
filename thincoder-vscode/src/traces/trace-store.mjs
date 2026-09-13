/**
 * trace-store.mjs — VSC 完整轨迹存档同构（docs/design/TRACE-STORE-VSC.md——CLI
 * AGENT-LOOP.md §18.6 D-TR1..TR8 权威规格镜像——语义照抄不照抄路径；CLI 参照实现
 * thincoder-cli/src/traces/trace-store.mjs）。
 *
 * 完整请求-响应轨迹落盘：每次 chat() 调用一个 JSONL 文件到
 * ~/.thincoder/traces/YYYY-MM-DD/<sessionKey>-<seq>.jsonl（与 CLI 同根目录——
 * cwd 归一/日期/命名算法两端一致——双端轨迹可合并分析）。采集点唯一 = provider.mjs
 * chat() 导出出口（所有模型调用——主回合/消化轮/compact/distill/advisor/子代理——
 * 都经该函数）——续写/重试在出口已合并（reasoning 全量）。
 *
 * 纪律（与 log.mjs 同源惯例 + CLI trace-store 逐条镜像）：
 * - 真 fire-and-forget（D-TR3——模型调用路径零额外阻塞）：seq 同步预留（原子号位），
 *   写盘异步（node:fs/promises——不 await）；落盘失败静默降级（不抛错、不阻塞
 *   chat() 返回）。recordChatTrace 返回落盘 promise——仅供测试/显式消费方 await。
 * - 测试隔离：node --test 进程（NODE_TEST_CONTEXT）默认不写盘——防测试事件污染真实
 *   轨迹目录（VSC 测试套件同样跑真实 agent 管线）；显式设置 THINCODER_TRACES_DIR
 *   强制写入该目录（trace-store.test.mjs 用它隔离临时目录——与 log.mjs 的
 *   THINCODER_LOG_DIR 同惯例、与 CLI 的 THINCODER_TRACES_DIR 同名同义）。
 * - 脱敏（D-TR2）：复用 log.mjs redactSecret（字段名黑名单 + SECRET_FORM 形态扫描）
 *   ——对 messages/content/reasoning/toolCalls/error 全字段递归应用；不发明新遮蔽模式。
 * - 容量有界（N-TR1）：单条轨迹一个文件，大小不限（不截断、不脱漏行）；目录按日
 *   组织（YYYY-MM-DD——本地时区——与 CLI 同实现）；seq = 当日目录内最大已有 seq + 1
 *   （跨会话/进程重启不覆写既有旧轨迹——进程内预留表 + 磁盘 max 兜底，同 CLI）。
 * - 清理（D-TR10——评审 #4 per-write 触发）：每次 recordChatTrace 写盘成功后顺带
 *   prune（删除 mtime 超过 config.traces.retentionHours 的 .jsonl + 空日期目录——
 *   同 CLI cleanupTraces 逻辑）。VSC 是长驻 extension host、无启动事件——per-write
 *   触发最简；prune 与写盘同在 fire-and-forget 异步体内（永不阻塞 chat() 返回；
 *   禁用路径连写盘都不发生——F6 零开销）。成本注：启用态每次落盘做一次全根扫描
 *   （异步——opt-in 路径——设计评审 #4 接受）。
 * - isContinuation（D-TR1）：续写/重试链标记——true = 该调用是续写链的一环
 *   （provider.mjs 续写递归传 logCtx.isContinuation——CLI core.mjs 同款）；新调用
 *   false。记录不输出 round 字段（全设计无 round 定义——不发明无来源字段）。
 * - 开关（D-TR6）：logCtx.traces === false → 不落盘（调用点读取 config.traces.enabled
 *   ——loadTracesSettings——默认 off——2026-09-05 发布隐私裁定；VSC 与 CLI 同默认，
 *   共享 config.json 不双端漂移）。禁用路径零写盘零报错（F6）。
 */
import { readdirSync, existsSync } from "node:fs"
import { appendFile, mkdir, readdir, stat, unlink, rmdir } from "node:fs/promises"
import { join } from "node:path"
import { createHash } from "node:crypto"
import { configDir, loadTracesSettings } from "../config-io.mjs"
import { redactSecret, errText, classifyErr } from "../log.mjs"

/** 轨迹根目录：THINCODER_TRACES_DIR（测试隔离/override——同 THINCODER_LOG_DIR
 *  惯例）> ~/.thincoder/traces（configDir——D-TR3——与 CLI 同根：双端同目录同格式）。 */
export function tracesRoot() {
  return process.env.THINCODER_TRACES_DIR ?? join(configDir, "traces")
}

/** 写门（测试隔离）：test runner 进程（NODE_TEST_CONTEXT）默认跳过——除显式
 *  THINCODER_TRACES_DIR override（trace-store.test.mjs 隔离临时目录）。 */
function writeEnabled() {
  if (process.env.NODE_TEST_CONTEXT && !process.env.THINCODER_TRACES_DIR) return false
  return true
}

/** cwd 归一（session-slots.mjs 同语义——Windows 盘符大写——VSC 内复制惯例同
 *  checkpoint.mjs——不 import extension 链避免把 vscode 依赖带进 provider 核心）：
 *  与 CLI 同算法（CLI session-slots normalizeCwd）——双端同工作区同 hash。 */
export function normalizeTraceCwd(cwd) {
  return String(cwd ?? "").replace(/^([a-z]):/, (_, d) => d.toUpperCase() + ":")
}

/** sessionKey = sha1(normalizeCwd(cwd))[:12]（D-TR3——与 CLI traceSessionKey 同算法
 *  同长度——双端同工作区落同文件前缀）。 */
export function traceSessionKey(cwd) {
  return createHash("sha1").update(normalizeTraceCwd(cwd)).digest("hex").slice(0, 12)
}

/** 本地时区日期字符串 YYYY-MM-DD（D-TR3——本地日期才是用户视角的"今天"；
 *  CLI 同实现——toISOString()=UTC 会落前一日目录）。recordChatTrace 与测试读取
 *  helpers 共用同一实现——不双写。 */
export function localDateStr(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

/** Test hooks（_rateHooks 同惯例——rate.mjs：测试可替换 now——注入本地日 ≠ UTC 日的
 *  时刻验证分日；生产永远走真实时钟）。 */
export const _traceHooks = {
  now: () => new Date(),
}

/** 当日轨迹目录（D-TR3：traces/YYYY-MM-DD——分日组织——N-TR1）。 */
export function tracesDirFor(dateStr) {
  return join(tracesRoot(), dateStr)
}

// 进程内 seq 预留表：同步预留（原子——异步写盘在途时并发调用不撞号）；键 = 目录。
// 跨进程/重启由磁盘 max 兜底（同键无预留时磁盘值即事实）。CLI 同实现。
const _reservedSeq = new Map()

/** seq = max(当日目录最大已有 seq, 进程内已预留) + 1（D-TR3——跨会话/进程重启
 *  不覆写——同步预留 = 异步写盘启动前的原子号位分配）。CLI 同实现。 */
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

/** 开关（D-TR6）：logCtx.traces === false → 不落盘（调用点传 config.traces.enabled
 *  ——loadTracesSettings——与 CLI 同语义：调用点读取并透传，关=不落盘必须全覆盖——
 *  不在出口静默越过开关）。 */
export function tracesEnabled(logCtx) {
  return logCtx?.traces !== false
}

/** 递归脱敏（D-TR2）：对 messages/content/reasoning/toolCalls/error 全字段应用——
 *  字段名命中黑名单 → [REDACTED]（redactSecret）；字符串内容命中密钥形态 → 截断到
 *  形态前 + [redacted]。数组/对象递归（消息 content 可为 parts 数组、toolCalls 嵌套）。 */
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
 * 收集一次 chat 调用轨迹（D-TR1 字段集）——fire-and-forget（D-TR3）。
 * 由 provider.mjs chat() 导出出口调用（唯一采集点——N-TR2）；签名零参数膨胀——
 * 数据全部来自调用方已传入的 opts（logCtx 元数据——D-TR4）+ provider + result/error。
 *
 * @param {Object} provider chat() 的 provider 参数（provider/model 字段来源）
 * @param {Object} opts chat() 原始 opts —— messages（输入）与 logCtx（元数据：
 *   role/depth/kind/session/cwd/stage/turn/traces/isContinuation——调用点增补，D-TR4）
 * @param {Object|null} result chatImpl 返回值（成功路径——content/reasoning/
 *   toolCalls/usage/finishReason——出口汇总：续写/重试后全量）
 * @param {Error|null} error chat() 抛出的错误（失败路径——D-TR5：error（errText
 *   截断 + 类别）+ finishReason:null——失败轨迹恰是分析纠结点最有效的材料）
 */
export function recordChatTrace(provider, opts = {}, result = null, error = null) {
  if (!writeEnabled()) return
  const logCtx = opts.logCtx ?? {}
  if (!tracesEnabled(logCtx)) return
  // cwd/session 经 logCtx 增补（调用点传 agent.cwd / agent._sessionStart——D-TR3 的
  // cwdHash/命名与 D-TR1 的 session 字段所需）。VSC 采集点全部显式传 cwd（extension
  // host 的 process.cwd() ≠ 工作区——轨迹归属错误）；下方 process.cwd() 仅为防御性
  // 兜底（未来新增调用点漏传时的最坏方向——与 CLI 镜像语义一致）。
  // 同步段整体 try/catch（code review 定稿——D-TR3/F6 零影响不变量）：记录构建含
  // redactValue 递归深拷贝 + nextTraceSeq 同步预留——病态 messages（循环引用等）下
  // 可能同步抛错——绝不污染 chat() 返回路径（错误路径会把真实 LLM 错误换成轨迹错误、
  // 成功路径会把成功返回变失败）——任何异常 = 本条轨迹静默放弃（返回 undefined——
  // 与禁用路径同语义）。
  let cwd, dateStr, seq, sessionKey, record
  try {
    cwd = logCtx.cwd ?? process.cwd()
    // D-TR3：分日按本地时区（_traceHooks.now——注入点）；ts 与 dateStr 同源（同一
    // 时刻）——记录时间戳与目录日不撕裂。
    const now = _traceHooks.now()
    dateStr = localDateStr(now)
    seq = nextTraceSeq(dateStr)
    sessionKey = traceSessionKey(cwd)
    record = {
      ts: now.toISOString(),
      session: logCtx.session ?? null,
      cwdHash: createHash("sha1").update(normalizeTraceCwd(cwd)).digest("hex"),
      role: logCtx.role ?? null,
      depth: logCtx.depth ?? null,
      turn: logCtx.turn ?? null,
      provider: provider?.name ?? provider?.model ?? "unknown",
      model: provider?.model ?? "",
      stage: logCtx.stage ?? null,
      kind: logCtx.kind ?? null,
      // D-TR1：续写/重试链标记——true = 该调用是续写链的一环（provider.mjs 续写
      // 递归传出 isContinuation:true——CLI core.mjs 同款）；新调用缺省 false——
      // round 字段无来源不输出。
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
  } catch {
    return // 同步段异常 → 本条轨迹静默放弃（fire-and-forget 零影响语义）
  }
  // 真 fire-and-forget（D-TR3——模型调用路径零额外阻塞）：seq 已在上面同步预留
  // （原子号位——写盘在途并发不撞号）；写盘异步（不 await——chat() 出口立即返回）。
  // 返回值 = 落盘 promise（测试 await 用；chat() 不消费——fire-and-forget 语义）。
  // 清理（D-TR10——评审 #4）：写盘成功后顺带 prune——retentionHours 实时读 config
  // （loadTracesSettings——与 enabled 开关同源——config.traces 可配）。
  return (async () => {
    try {
      const dir = tracesDirFor(dateStr)
      await mkdir(dir, { recursive: true }) // D-TR3：写前建目录
      await appendFile(join(dir, `${sessionKey}-${seq}.jsonl`), JSON.stringify(record) + "\n", "utf8")
      let retentionHours = 24
      try { retentionHours = loadTracesSettings().retentionHours } catch { /* 默认 24h */ }
      await cleanupTraces({ dir: tracesRoot(), retentionHours })
    } catch {
      // D-TR3/F6：落盘/prune 失败静默降级——不抛错、不阻塞 chat() 返回
    }
  })()
}

/**
 * D-TR10：清理——删除 traces 根下 mtime 超过保留期的轨迹文件（保留期 =
 * config.traces.retentionHours，默认 24h）；删空的日期目录（YYYY-MM-DD）。目录里
 * 非 .jsonl 文件不碰。CLI cleanupTraces 同实现（VSC 无启动事件——由 recordChatTrace
 * per-write 触发——评审 #4——与写盘同在 fire-and-forget 体内）。返回删除文件数。
 * 保留期边界：mtime 严格小于 cutoff 才删——恰好等于/晚于 cutoff 的文件保留（期内留）。
 */
export async function cleanupTraces({ dir = tracesRoot(), retentionHours = 24 } = {}) {
  const cutoff = Date.now() - retentionHours * 3_600_000
  let days
  try { days = await readdir(dir) } catch { return 0 } // 目录不存在/不可读 → 无事可做
  let removed = 0
  for (const day of days) {
    const dayDir = join(dir, day)
    try { if (!(await stat(dayDir)).isDirectory()) continue } catch { continue }
    let names
    try { names = await readdir(dayDir) } catch { continue }
    for (const n of names) {
      if (!n.endsWith(".jsonl")) continue
      try {
        if ((await stat(join(dayDir, n))).mtimeMs < cutoff) { await unlink(join(dayDir, n)); removed++ }
      } catch { /* 单个文件失败不影响其余 */ }
    }
    try { if ((await readdir(dayDir)).length === 0) await rmdir(dayDir) } catch {}
  }
  return removed
}
