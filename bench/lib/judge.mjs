/**
 * lib/judge.mjs — 判官对（A / B 双判 · 分歧第三判仲裁）+ 机械 fail 复核（设计 §2.10 / §2.11）。
 *
 * 自成一档的理由（KD-12）：判官面 = 配置 / 网络 / 记账面，与 `grade.mjs` 的「纯函数 · 无网络」不变量分档；
 * 判官 / 复核共用一套调用与解析机制（提示模板各自版本化）。
 *
 * 契约（§2.10.1）：
 * - 输入 = 三段：题面（`judge.question` ?? `prompt`）· 判据条文（`judge.rubric` 逐字）· 该回合响应素材
 *   （`turns[judge.turn]`：模型文本 + 该回合工具调用事实——素材面最小化，不含对话前后文 / 图像）；
 * - 输出 = `{"verdict": "pass" | "fail", "reason": "…"}`；**严格解析**（trim 后以 `{` 起 · 整串 parse · 枚举必中）；
 * - fail-closed：解析失败 ⇒ 放大预算重试一次（×2 · 上限 8192）；两次不成 / 超时 / 传输面错误 ⇒ 该位 `error`（禁猜）；
 * - A / B **并行**发起；分歧 ⇒ C 仲裁 · 多数决；任何无多数路径 ⇒ 合成分 `error`（§2.10.4）。
 */

import { readFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { SUITE_VERSION } from "../cases/index.mjs"
import { usageTokens } from "./metrics.mjs"
import { head, isoLocal } from "./output.mjs"

const BENCH_DIR = dirname(dirname(fileURLToPath(import.meta.url)))

/** 提示模板版本（模板 / rubric 变化 ⇒ `SUITE_VERSION + 1`——§2.10.3 冻结绑定）。 */
export const JUDGE_PROMPT_VERSION = 1
export const REVIEW_PROMPT_VERSION = 1

/** 预算区间（§2.10.1：低于 1024 装载即拒——POC 教训②；放大预算重试上限 = 8192）。 */
export const MAX_TOKENS_MIN = 1024
export const MAX_TOKENS_MAX = 8192
const TIMEOUT_MIN = 5
const TIMEOUT_MAX = 120
const REASON_MAX = 300
const VERDICTS = ["pass", "fail"]
const REVIEW_VERDICTS = ["uphold", "overturn"]

/** 判官配置档路径（默认 `bench/judge.json`；BENCH_JUDGE = 测试夹具缝，§5.13 `judge.4–6/12`）。 */
export const judgeConfigPath = () => (process.env.BENCH_JUDGE ? resolve(process.env.BENCH_JUDGE) : join(BENCH_DIR, "judge.json"))

function slotAt(raw, at) {
  if (!raw || typeof raw !== "object") throw new Error(`judge.json：${at} 不是对象`)
  if (typeof raw.provider !== "string" || !raw.provider) throw new Error(`judge.json：${at}缺 provider`)
  if (typeof raw.model !== "string" || !raw.model) throw new Error(`judge.json：${at}缺 model`)
  if (!Number.isInteger(raw.maxTokens) || raw.maxTokens < MAX_TOKENS_MIN || raw.maxTokens > MAX_TOKENS_MAX) {
    throw new Error(`judge.json：${at}maxTokens 越界（须 ${MAX_TOKENS_MIN}–${MAX_TOKENS_MAX} 的整数，得 ${raw.maxTokens}）`)
  }
  if (!Number.isInteger(raw.timeoutSec) || raw.timeoutSec < TIMEOUT_MIN || raw.timeoutSec > TIMEOUT_MAX) {
    throw new Error(`judge.json：${at}timeoutSec 越界（须 ${TIMEOUT_MIN}–${TIMEOUT_MAX} 的整数，得 ${raw.timeoutSec}）`)
  }
  return { provider: raw.provider, model: raw.model, maxTokens: raw.maxTokens, timeoutSec: raw.timeoutSec }
}

/** 装载 `judge.json` + schema / 身份校验（fail-closed：任一项不合 ⇒ 装载即拒——§2.10.3）。 */
export function loadJudgeConfig(path = judgeConfigPath()) {
  let raw
  try {
    raw = JSON.parse(readFileSync(path, "utf8"))
  } catch (e) {
    throw new Error(`judge.json 不可读或非 JSON：${path}（${e.message}）`)
  }
  if (!raw || typeof raw !== "object") throw new Error("judge.json：顶层必须是对象")
  if (!Number.isInteger(raw.frozenAtSuiteVersion)) throw new Error("judge.json：缺 frozenAtSuiteVersion（整数；判官配置冻结于的套件版本）")
  if (!Array.isArray(raw.judges) || raw.judges.length !== 2) {
    throw new Error(`judge.json：judges 须为长度恰 2 的数组（判官对 A / B；得 ${Array.isArray(raw.judges) ? raw.judges.length : typeof raw.judges}）`)
  }
  const judges = raw.judges.map((j, i) => slotAt(j, `judges[${i}]（${i === 0 ? "A" : "B"} 位）`))
  if (raw.arbiter == null) throw new Error("judge.json：缺 arbiter（仲裁 C 位必备——「分歧无仲裁」跑法不存在）")
  const arbiter = slotAt(raw.arbiter, "arbiter（仲裁 C 位）")
  if (judges[0].model === judges[1].model) {
    throw new Error(`judge.json：判官对身份违约——A 与 B 同模型「${judges[0].model}」（同模型双判无冗余）`)
  }
  if (arbiter.model === judges[0].model || arbiter.model === judges[1].model) {
    throw new Error(`judge.json：仲裁员身份违约——arbiter 模型「${arbiter.model}」∈ {A, B}（同模型仲裁 = 复读票）`)
  }
  return { version: raw.version ?? 1, frozenAtSuiteVersion: raw.frozenAtSuiteVersion, judges, arbiter, note: raw.note ?? "" }
}

/** 运行面闸门（§2.10.3）：冻结绑定 + 逐位独立性（三槽）+ 同渠道明示。
 *  `providers` = 用户 config 条目（`--dry-run` 传夹具条目数组；缺省 ⇒ 跳过在 config 检查）；`tested` = 本次被测条目。
 *  返回 `{ slots, warnings }`——槽位定身份：`[0]` = A · `[1]` = B · `[2]` = 仲裁 C（文件不存 `id`）。 */
export function resolveJudgeSlots(cfg, { providers, tested, suiteVersion = SUITE_VERSION }) {
  if (cfg.frozenAtSuiteVersion !== suiteVersion) {
    throw new Error(`判官配置已换代：judge.json.frozenAtSuiteVersion = ${cfg.frozenAtSuiteVersion} ≠ SUITE_VERSION = ${suiteVersion} —— 确认 bump SUITE_VERSION 后同步本字段（判官模型 / 模板 / rubric 变化 = 判分口径换代）`)
  }
  const keys = new Set(tested.map((e) => `${e.provider}:${e.model}`))
  const vendors = new Set(tested.map((e) => e.provider))
  const warnings = []
  const slots = [["A", cfg.judges[0]], ["B", cfg.judges[1]], ["C", cfg.arbiter]].map(([id, s]) => {
    const key = `${s.provider}:${s.model}`
    const entry = (providers ?? []).find((p) => p.name === s.provider)
    if (providers && !entry) throw new Error(`判官 ${id} 位的 provider 不在用户 config（~/.thincoder/config.json）：${s.provider}`)
    if (keys.has(key)) {
      throw new Error(`判官独立性违约：判官 ${id} 位（${key}）∈ 本次被测集合 —— 判分器（含仲裁）不得判自己的输出；请换判官或从被测集移除该条目`)
    }
    const sameVendorAsTested = vendors.has(s.provider)
    if (sameVendorAsTested) warnings.push(`判官 ${id} 位（${key}）与被测条目同渠道（异模型）—— 已明示 sameVendorAsTested`)
    return { id, provider: s.provider, model: s.model, maxTokens: s.maxTokens, timeoutSec: s.timeoutSec, host: entry?.baseURL ? new URL(entry.baseURL).host : null, sameVendorAsTested }
  })
  return { slots, warnings }
}

const snap = (s) => ({
  provider: s.provider, model: s.model, host: s.host ?? null, temperature: 0,
  maxTokens: s.maxTokens, timeoutSec: s.timeoutSec, sameVendorAsTested: s.sameVendorAsTested === true,
})

/** 顶层 `judge` 块配置快照（§2.2-7 / §2.10.6；逐位账目与分歧计数由 prices.mjs 后置聚合——无判官面 run 也照写）。 */
export function judgeSnapshot(slots, cfg) {
  return {
    promptVersion: JUDGE_PROMPT_VERSION,
    frozenAtSuiteVersion: cfg.frozenAtSuiteVersion,
    judges: [snap(slots[0]), snap(slots[1])],
    arbiter: snap(slots[2]),
    judgeCalls: 0, costCny: null, agreements: 0, disagreements: 0, arbitrations: 0, unavailable: 0,
  }
}

/** 顶层 `review` 块初值（复核单判 · 沿 A 位——§2.11 判位数裁定；账目由 prices.mjs 后置聚合）。 */
export function reviewSnapshot() {
  return { promptVersion: REVIEW_PROMPT_VERSION, calls: 0, uphold: 0, overturn: 0, costCny: null }
}

/** 判官调用条目（§2.9-1 纪律）：克隆用户条目 + 覆写 `.model` / `maxTokens` / `temperature`（不落条目会静默失效）。 */
export function judgeProviderEntry(slot, providers, maxTokens = slot.maxTokens) {
  const base = (providers ?? []).find((p) => p.name === slot.provider) ?? { name: slot.provider, baseURL: "", apiKey: "" }
  return { ...base, model: slot.model, maxTokens, temperature: 0 }
}

/** 判官素材（回合精确 · §2.10.1）：该回合模型文本 + 该回合工具调用事实（`name(arguments)`——正文类判据的取材面）。
 *  父侧裁定 2026-09-24：工具事实与复核素材（§2.11）同形入素材（`tools.2` 的 body 判据只住工具调用参数）。
 *  不含对话前后文 / 图像（KD-22）；`null` = 该回合不存在（调用方按 fail-closed 处置）。 */
export function turnMaterial(turn) {
  if (!turn) return null
  const parts = [String(turn.text ?? "").trim() || "（本回合无文本输出）"]
  const calls = (turn.steps ?? []).flatMap((s) => s.toolCalls ?? [])
  if (calls.length > 0) {
    parts.push("", "本回合工具调用：", ...calls.map((c) => `- ${c?.name ?? "?"}(${String(c?.arguments ?? "").trim() || "{}"})`))
  }
  return parts.join("\n")
}

/** 复核素材观测（§2.11 输入）：逐回合模型文本 + 各回合工具调用事实（`name(arguments)`）。 */
export function reviewObservation(turns) {
  const out = []
  for (const [i, t] of (turns ?? []).entries()) {
    out.push(`回合 ${i + 1} 模型文本：${String(t?.text ?? "").trim() || "（无文本输出）"}`)
    const calls = (t?.steps ?? []).flatMap((s) => s.toolCalls ?? [])
    if (calls.length > 0) {
      out.push(`回合 ${i + 1} 工具调用：${calls.map((c) => `${c?.name ?? "?"}(${String(c?.arguments ?? "").trim() || "{}"})`).join("；")}`)
    }
  }
  return out.length > 0 ? out.join("\n") : "（无回合记录）"
}

const JUDGE_SYSTEM = "你是模型基准测试的判分员：依据给定判据条文裁决模型回答是否通过。只输出一个 JSON 对象，不要代码围栏，不要任何解释。"
const REVIEW_SYSTEM = "你是模型基准测试的复核员：机械判据把一次模型回答判为不通过（fail），请复核该判定是否成立。只输出一个 JSON 对象，不要代码围栏，不要任何解释。"

/** 判官 / 复核「题面段」解析（§2.6 单源）：`judge.question` ?? 用例 `prompt`（多轮题 = 声明式拼接后的 prompt）。 */
export function judgeQuestion(caseObj) {
  return caseObj?.judge?.question ?? caseObj?.prompt ?? ""
}

/** 判官提示构建（三段：题面 / 判据条文 / 该回合响应素材）。 */
export function buildJudgeMessages({ question, rubric, material }) {
  const user = [
    "## 题面", question, "",
    "## 判据条文", rubric, "",
    "## 模型回答", material, "",
    "请裁决该回答是否满足判据条文，并只输出一个 JSON 对象（verdict 只能是 \"pass\" 或 \"fail\"，reason 为一句话理由）：",
    "{\"verdict\": \"pass\", \"reason\": \"…\"}",
  ].join("\n")
  return [{ role: "system", content: JUDGE_SYSTEM }, { role: "user", content: user }]
}

/** 复核提示构建（§2.11 输入：题面 + 机械判据条文 + 机械失败断言 + 逐回合观测）。 */
export function buildReviewMessages({ question, mechRubric, mechDetail, observation }) {
  const user = [
    "## 题面", question, "",
    "## 机械判据条文", mechRubric, "",
    "## 机械失败断言", mechDetail, "",
    "## 模型回答观测", observation, "",
    "请复核该「不通过」判定是否成立（机械判据可能因题面-判据不一致 / 判据过严 / 解析边缘而误判），并只输出一个 JSON 对象：",
    "{\"verdict\": \"uphold\", \"reason\": \"…\"} 或 {\"verdict\": \"overturn\", \"reason\": \"…\"}",
  ].join("\n")
  return [{ role: "system", content: REVIEW_SYSTEM }, { role: "user", content: user }]
}

/** 严格解析（与严格 JSON 面同口径 · §2.10.1）：trim 后以 `{` 起 · 整串 parse · `verdict` 必在枚举内；多余键忽略。 */
export function parseReply(text, allowed) {
  const t = String(text ?? "").trim()
  if (!t) return { ok: false, error: "空输出" }
  if (!t.startsWith("{")) return { ok: false, error: `非整串 JSON（首字符「${t[0] ?? ""}」）` }
  let value
  try {
    value = JSON.parse(t)
  } catch (e) {
    return { ok: false, error: `整串 JSON.parse 失败：${head(e?.message, 80)}` }
  }
  if (!value || typeof value !== "object") return { ok: false, error: "顶层不是对象" }
  if (!allowed.includes(value.verdict)) return { ok: false, error: `verdict 不在枚举（${allowed.join(" | ")}），得 ${JSON.stringify(value.verdict)}` }
  return { ok: true, verdict: value.verdict, reason: head(typeof value.reason === "string" ? value.reason : "", REASON_MAX, true) }
}

const isVerdict = (v) => VERDICTS.includes(v)

function withTimeout(signal, timeoutSec) {
  const t = AbortSignal.timeout(timeoutSec * 1000)
  return signal ? AbortSignal.any([signal, t]) : t
}

/** 逐尝试账目（§2.2-8：不含成本——单价由 prices.mjs 按该位 `provider:model` 后置填充）。 */
function callRecord(res, { attempt, at, maxTokens }) {
  return {
    attempt,
    at,
    totalMs: typeof res?.totalMs === "number" ? res.totalMs : null,
    maxTokens,
    finishReason: res?.response?.finishReason ?? null,
    tokens: usageTokens(res?.response?.usage),
    costCny: null,
  }
}

/** 一位的调用 + 严格解析 + 放大预算重试一次（§2.10.1；传输面失败不重试——核已含 HTTP 级重试）。 */
export async function callSlot({ slot, messages, allowed = VERDICTS, transport, providers, signal }) {
  const calls = []
  let maxTokens = slot.maxTokens
  let failure = null
  for (let attempt = 1; attempt <= 2; attempt++) {
    const at = isoLocal()
    let res = null
    try {
      res = await transport.call({
        provider: judgeProviderEntry(slot, providers, maxTokens),
        messages,
        signal: withTimeout(signal, slot.timeoutSec),
        slot: slot.id,
      })
    } catch (e) {
      calls.push(callRecord(null, { attempt, at, maxTokens }))
      return { id: slot.id, verdict: "error", reason: `位级失败：${e?.name ?? "Error"}: ${head(e?.message ?? String(e), 160)}（传输面失败不重试）`, attempts: attempt, calls }
    }
    calls.push(callRecord(res, { attempt, at, maxTokens }))
    if (res?.response?.finishReason === "length") {
      failure = "输出被截断（finishReason=length）"
    } else {
      const parsed = parseReply(res?.response?.content, allowed)
      if (parsed.ok) return { id: slot.id, verdict: parsed.verdict, reason: parsed.reason, attempts: attempt, calls }
      failure = parsed.error
    }
    maxTokens = Math.min(MAX_TOKENS_MAX, maxTokens * 2)
  }
  return { id: slot.id, verdict: "error", reason: `位级失败（2 次不可解析）：${failure}`, attempts: calls.length, calls }
}

/** 判官对 + 分歧仲裁（§2.10.1 合成规则）：A / B 并行 ⇒ 分歧触发 C（依赖步）多数决 ⇒ 无多数 `error`。 */
export async function judgeWithPair({ decl, question, material, slots, transport, providers, signal }) {
  const turn = decl?.turn ?? null
  if (material == null) {
    return { verdict: "error", resolution: "none", turn, reason: `判官不可用（素材缺失）：回合 ${turn} 不存在（用例声明与实际回合数不符）`, judges: [] }
  }
  const messages = buildJudgeMessages({ question: question ?? decl?.question ?? "", rubric: decl?.rubric ?? "", material })
  const call = (slot) => callSlot({ slot, messages, transport, providers, signal })
  const [a, b] = await Promise.all([call(slots[0]), call(slots[1])])
  const judges = [a, b]
  if (!isVerdict(a.verdict) || !isVerdict(b.verdict)) {
    const why = judges.map((j) => (isVerdict(j.verdict) ? `${j.id} 位裁决 ${j.verdict}` : `${j.id} 位失败（${j.reason}）`)).join(" · ")
    return { verdict: "error", resolution: "none", turn, reason: head(`判官不可用（有效判不足）：${why}`, REASON_MAX, true), judges }
  }
  if (a.verdict === b.verdict) {
    return { verdict: a.verdict, resolution: "unanimous", turn, reason: a.reason, judges }
  }
  const c = await call(slots[2])
  judges.push(c)
  if (!isVerdict(c.verdict)) {
    const why = `A 位裁决 ${a.verdict} · B 位裁决 ${b.verdict} · C 位失败（${c.reason}）`
    return { verdict: "error", resolution: "none", turn, reason: head(`判官不可用（分歧未决）：${why}`, REASON_MAX, true), judges }
  }
  const passVotes = [a.verdict, b.verdict, c.verdict].filter((v) => v === "pass").length
  return { verdict: passVotes >= 2 ? "pass" : "fail", resolution: "arbitrated", turn, reason: c.reason, judges }
}

/** 复核触发判据（§2.11 冻结 · 单源）：`run.verdict === "fail"` ∧ 该 fail **非判官裁决** ∧ 用例有机械判据面。
 *  `error` / `skipped` 不触发；判官裁决的 fail 不叠加（禁判官叠判官）。 */
export function shouldReview(run, caseObj) {
  return run?.verdict === "fail" && run?.judge?.verdict !== "fail" && Boolean(caseObj?.mechRubric)
}

/** 机械 fail 复核（§2.11）：单判沿 A 位；`uphold` ⇒ fail 维持；`overturn` ⇒ 复核翻案（**不自动改判**）。 */
export async function reviewRun({ caseObj, turns, mechDetail, slots, transport, providers, signal }) {
  const messages = buildReviewMessages({
    question: judgeQuestion(caseObj),
    mechRubric: caseObj?.mechRubric ?? "",
    mechDetail: head(mechDetail, 200),
    observation: reviewObservation(turns),
  })
  const r = await callSlot({ slot: { ...slots[0], id: "review" }, messages, allowed: REVIEW_VERDICTS, transport, providers, signal })
  return { verdict: r.verdict, reason: r.reason, mechDetail: head(mechDetail, 200), attempts: r.attempts, calls: r.calls }
}
