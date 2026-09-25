/**
 * toolcall/grade.mjs — 三轴判定与分母口径（设计 §11.6 冻结）+ 轻量 schema 校验 + 聚合块。
 *
 * 校验射程 = `type` / `required` / `enum` / `items` / `minimum` / `maximum`（§11.1 实读全集——本面校验器射程）；
 * 轴① 选择命中（判定面 = 首条工具调用）· 轴② schema 合法（`called` ∧ **全部调用**；载荷外工具名 ⇒ `false`
 * + `offPayload` 单列）· 轴③ 参数语义正确（`hit` ∧ 逐例谓词）；`expect.name === null` 的例 ⇒ 轴② / 轴③ `null`；
 * 分母：`n` = 有效 run（`terminal ∉ {error, skipped}`）· 轴②③ 分母 = `n − Σ(期望无调用的 run)`。
 * 纯函数 · 零网络（`--dry-run` 与真实跑批共用本档判定面）。
 */

import { head } from "../lib/output.mjs"

/** 终态域（§11.3-6）= `completed` / `error` / `skipped`：单发即终；接口错 / 空响应 ⇒ `error`；成本闸截断 ⇒ `skipped`（未执行——不入分母）。 */

/** `textHead` 截断口径（§11.6 冻结）：响应文本头 ≤300 字符（单行化——沿 §7-5 摘要纪律）；`args` 不截断。 */
export const TEXT_HEAD_MAX = 300

/** 载荷外工具名的 `schemaErrors` 前缀（生产者 / 消费端共用常量——`offPayload` 计数的单点判据）。 */
export const OFF_PAYLOAD_PREFIX = "载荷外工具名"

/** `arguments` 解析（产品面同式：空白 / 空串 ≡ 空对象——`bench/lib/tools.mjs` 同约定）；须为 JSON **对象**。 */
export function parseArguments(raw) {
  const text = String(raw ?? "").trim()
  let value
  try {
    value = JSON.parse(text === "" ? "{}" : text)
  } catch {
    return { ok: false, value: null }
  }
  if (value === null || typeof value !== "object" || Array.isArray(value)) return { ok: false, value: null }
  return { ok: true, value }
}

const typeOk = (value, type) => {
  switch (type) {
    case "string": return typeof value === "string"
    case "number": return typeof value === "number" && Number.isFinite(value)
    case "integer": return typeof value === "number" && Number.isInteger(value)
    case "boolean": return typeof value === "boolean"
    case "array": return Array.isArray(value)
    case "object": return value !== null && typeof value === "object" && !Array.isArray(value)
    default: return true
  }
}

/** 轻量 schema 校验（射程见头注；返回错误清单——空即合法）。 */
export function validateArgs(value, schema, at = "args") {
  const errors = []
  const walk = (v, node, path) => {
    if (!node || typeof node !== "object") return
    if (typeof node.type === "string" && !typeOk(v, node.type)) {
      errors.push(`${path}：类型不符（期望 ${node.type}）`)
      return
    }
    if (Array.isArray(node.enum) && !node.enum.includes(v)) errors.push(`${path}：∉ enum [${node.enum.join(", ")}]`)
    if (typeof node.minimum === "number" && typeof v === "number" && v < node.minimum) errors.push(`${path}：< minimum ${node.minimum}`)
    if (typeof node.maximum === "number" && typeof v === "number" && v > node.maximum) errors.push(`${path}：> maximum ${node.maximum}`)
    if (node.type === "array" && node.items) {
      for (const [i, item] of v.entries()) walk(item, node.items, `${path}[${i}]`)
    }
    if (node.type === "object") {
      for (const req of node.required ?? []) {
        if (!(req in v)) errors.push(`${path}.${req}：缺 required`)
      }
      for (const [key, sub] of Object.entries(node.properties ?? {})) {
        if (key in v) walk(v[key], sub, `${path}.${key}`)
      }
    }
  }
  walk(value, schema, at)
  return errors
}

/** 逐例参数谓词求值（声明式数据 → 布尔；`grade.mjs` = 求值器单源）。 */
export function argsOkOf(clauses, args) {
  if (!Array.isArray(clauses)) return false
  if (args === null || typeof args !== "object" || Array.isArray(args)) return false
  return clauses.every((c) => {
    switch (c.k) {
      case "eq": return args[c.key] === c.value
      case "absent": return !(c.key in args)
      case "notTrue": return args[c.key] === undefined || args[c.key] === false
      case "string": return typeof args[c.key] === "string"
      case "re": return new RegExp(c.src).test(String(args[c.key] ?? ""))
      case "includes": return String(args[c.key] ?? "").includes(c.value)
      case "linesEq": {
        const lines = String(args[c.key] ?? "").split(/\r?\n/).map((s) => s.trim()).filter(Boolean)
        return lines.length === c.value.length && lines.every((s, i) => s === c.value[i])
      }
      case "empty": return Object.keys(args).length === 0
      default: throw new Error(`未知谓词原语「${c.k}」`)
    }
  })
}

/** `runCase` 返回 → 判定面观测（`maxRounds = 1` ⇒ `calls[0]` / `turns[0]` 即唯一一次调用）。 */
export function pickObserved(result) {
  const call = result?.calls?.[0] ?? null
  const turn = result?.turns?.[0] ?? null
  return {
    error: result?.error ?? null,
    text: String(turn?.text ?? ""),
    toolCalls: turn?.toolCalls ?? [],
    finishReason: call?.finishReason ?? null,
    tokens: call?.tokens ?? null,
    wallMs: typeof call?.totalMs === "number" ? call.totalMs : null,
  }
}

/** 成本闸截断的 run（未执行 ⇒ `terminal` = `skipped`、其余字段一律 null；入 `runs[]`——截断可见）。 */
export function skippedRun(n) {
  return {
    n, terminal: "skipped", called: null, firstTool: null, toolNames: null, args: null, parseOk: null, schemaErrors: [],
    hit: null, legal: null, semOk: null, finishReason: null, textHead: null,
    metrics: { wallMs: null, tokens: null, cost: null },
  }
}

/** 单 run 判定（§11.6 字段 === 返回值键集）；`cost` 由编排面按 `prices.json` 单点回填。 */
export function gradeRun({ caseObj, payload, observed, n }) {
  const expect = caseObj.expect
  const byName = new Map(payload.map((t) => [t.function.name, t.function.parameters]))
  const calls = observed.toolCalls ?? []
  const called = calls.length > 0
  const names = calls.map((t) => (typeof t?.name === "string" ? t.name : null))
  const firstTool = called ? names[0] : null
  const parsed = calls.map((t) => parseArguments(t?.arguments))
  const emptyResponse = !called && observed.text.trim() === ""
  const schemaErrors = []
  if (called) {
    for (const [i, name] of names.entries()) {
      if (!byName.has(name)) {
        schemaErrors.push(`${OFF_PAYLOAD_PREFIX}：${name ?? "(空名)"}`)
        continue
      }
      if (!parsed[i].ok) {
        schemaErrors.push(`${name}：arguments 非 JSON 对象`)
        continue
      }
      schemaErrors.push(...validateArgs(parsed[i].value, byName.get(name), name))
    }
  }
  const errored = observed.error !== null || emptyResponse
  // 接口错 / 空响应 ⇒ 无判定素材：三轴记 `null`（如实——不估；`error` run 不入分母，§11.6）；
  // 有响应的无调用 run 逐轴按轴表判（期望无调用者轴① `true`、期望有调用者轴① `false`）。
  const hit = errored ? null : expect.name === null ? !called : called && firstTool === expect.name
  const legal = errored || expect.name === null ? null : called && schemaErrors.length === 0
  const semOk = errored || expect.name === null ? null : hit && argsOkOf(expect.argsOk, parsed[0]?.value ?? null)
  return {
    n,
    terminal: errored ? "error" : "completed",
    called, firstTool, toolNames: called ? names : [], args: called ? parsed[0].value : null,
    parseOk: called ? parsed.every((p) => p.ok) : null,
    schemaErrors, hit, legal, semOk,
    finishReason: observed.finishReason,
    textHead: head(observed.text, TEXT_HEAD_MAX),
    metrics: { wallMs: observed.wallMs, tokens: observed.tokens, cost: null },
  }
}

/** 载荷外工具名判据（`offPayload` 单列计数——与生产者共用前缀常量）。 */
export function hasOffPayload(run) {
  return (run.schemaErrors ?? []).some((e) => String(e).startsWith(OFF_PAYLOAD_PREFIX))
}

/** 有效 run（`terminal ∉ {error, skipped}`）= 轴① 分母；轴②③ 分母再扣「期望无调用」的 run（其轴值为 `null`）。 */
export function denominators(runs) {
  const live = runs.filter((r) => r.terminal !== "error" && r.terminal !== "skipped")
  return { axis1: live.length, axis23: live.filter((r) => r.legal !== null).length }
}

/** 聚合块（§11.6 冻结键集；`perfect` = `legal ∧ semOk` 为真的 run 计数——null 例不入分子与分母）。 */
export function aggregateBlock(runs) {
  const count = (f) => runs.filter(f).length
  const fresh = (r) => r.terminal !== "error" && r.terminal !== "skipped"
  return {
    n: count(fresh),
    hit: count((r) => r.hit === true),
    legal: count((r) => r.legal === true),
    semOk: count((r) => r.semOk === true),
    perfect: count((r) => r.legal === true && r.semOk === true),
    noCall: count((r) => r.terminal === "completed" && r.called === false),
    multiCall: count((r) => (r.toolNames?.length ?? 0) > 1),
    parseFail: count((r) => r.parseOk === false),
    offPayload: count(hasOffPayload),
    error: count((r) => r.terminal === "error"),
    skipped: count((r) => r.terminal === "skipped"),
  }
}
