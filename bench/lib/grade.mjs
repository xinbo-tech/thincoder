/**
 * lib/grade.mjs — 判分器族（设计 §2.6）：全部纯函数 · 无网络 · 确定性。
 *
 * 族成员：numEquals · vmRun（node:vm + 4000ms 超时 + 追加断言脚本）· strictJson（整串 parse）
 * · toolShape（name / JSON.parse(arguments || "{}") / 轮次）· textRules（汉字计数 / 段落数 / 句数 /
 * 首尾 / 次数 / 否定式「不含」/ 列举项计数）· keywordSet（闭词表命中）· colorMatch（颜色归一化词表）。
 * 判据的「正本」= 设计档 §5 各例「期望与判据」列；本档只提供实现原语，用例档逐例装配。
 */

import vm from "node:vm"

/** 统一判分结果形状（用例 grade 的返回契约：`{ pass, detail }`，detail ≤200 字符由结果构造面收口）。 */
export function ok(pass, detail) {
  return { pass: pass === true, detail: String(detail ?? "") }
}

export function escapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/** 响应摘要（判分 detail / 报告摘要共用）：压平空白 + 截断。 */
export function preview(text, max = 120) {
  const flat = String(text ?? "").replace(/\s+/g, " ").trim()
  return flat.length > max ? `${flat.slice(0, max)}…` : flat
}

/** 数字独立成词匹配：`(^|\D)N(\D|$)`（设计 §2.6；负号允许作为词首，数字内不得再连数字）。 */
export function numEquals(text, n) {
  const lit = escapeRegExp(String(n))
  return new RegExp(`(^|[^0-9])${lit}([^0-9]|$)`).test(String(text ?? ""))
}

// ── 代码题：node:vm 实跑 + 隐藏断言（AC-5：隐藏断言只住判分器，题面零泄漏） ──────────────

/** 代码块提取：末个围栏内容，无围栏则整段（设计 §2.6 vmRun）。 */
export function extractCode(text) {
  const raw = String(text ?? "")
  const fences = [...raw.matchAll(/```[^\n]*\n([\s\S]*?)```/g)]
  if (fences.length > 0) return fences[fences.length - 1][1].trim()
  return raw.trim()
}

/** vm 内断言前置件：__check / __eq / __throws（深比较走 JSON 序列化，跨 context 安全）。 */
const VM_PRELUDE = `
var __results = [];
function __check(label, fn) {
  try { fn(); __results.push({ label: label, ok: true }) }
  catch (e) { __results.push({ label: label, ok: false, err: String((e && e.message) || e).slice(0, 120) }) }
}
function __eq(got, want) {
  var g = JSON.stringify(got), w = JSON.stringify(want);
  if (g !== w) throw new Error("got " + g + ", want " + w);
}
function __throws(fn, name) {
  var threw = null;
  try { fn() } catch (e) { threw = e }
  if (!threw) throw new Error("did not throw " + name);
  var got = (threw && threw.name) || String(threw);
  if (got !== name) throw new Error("threw " + got + ", want " + name);
}
`

/** 实跑模型给的代码 + 追加断言脚本；超时 4000ms（设计 §2.6）。 */
export function vmRun(codeText, assertScript, { timeoutMs = 4000 } = {}) {
  const code = extractCode(codeText)
  if (!code) return ok(false, "无代码内容")
  const src = [code, VM_PRELUDE, assertScript, "JSON.stringify(__results)"].join("\n;\n")
  let out
  try {
    out = vm.runInNewContext(src, {}, { timeout: timeoutMs })
  } catch (e) {
    return ok(false, `执行失败：${e?.name ?? "Error"}: ${preview(e?.message, 120)}`)
  }
  let results
  try {
    results = JSON.parse(out)
  } catch {
    return ok(false, "断言结果不可解析（代码覆盖了断言通道）")
  }
  if (!Array.isArray(results) || results.length === 0) return ok(false, "断言未产生结果")
  const failed = results.filter((r) => !r.ok)
  if (failed.length === 0) return ok(true, `隐藏断言 ${results.length}/${results.length} 通过`)
  const first = failed[0]
  return ok(false, `隐藏断言 ${results.length - failed.length}/${results.length}：${first.label} —— ${preview(first.err, 90)}`)
}

// ── 严格 JSON（§5.3：整串 parse；含围栏/散文即 FAIL） ─────────────────────────────

/** 整串 parse：trim 后必须以 `{` 开头并一次 parse 成功。 */
export function strictJson(text) {
  const t = String(text ?? "").trim()
  if (!t.startsWith("{")) return { ok: false, error: "不是以 { 开头的整串 JSON（含围栏或散文？）" }
  try {
    return { ok: true, value: JSON.parse(t) }
  } catch (e) {
    return { ok: false, error: `整串 JSON.parse 失败：${preview(e?.message, 100)}` }
  }
}

/** 字段断言（json.x 三例共用）：spec = { 路径: 判定函数 }，判定函数返回 null=通过 或 失败说明。 */
export function jsonFields(value, spec) {
  const fails = []
  for (const [path, check] of Object.entries(spec)) {
    const segs = path.split(".")
    let cur = value
    for (const s of segs) cur = cur == null ? undefined : cur[s]
    const why = check(cur)
    if (why) fails.push(`${path}: ${why}`)
  }
  return fails.length === 0 ? ok(true, "字段断言全过") : ok(false, fails.join("；"))
}

// ── 工具调用结构断言（§5.4） ────────────────────────────────────────────────────

/** toolCalls 结构检查：count（精确条数）/ everyName（全部同名）/ names（名称集合）/ argsParse（arguments 可 JSON.parse）。 */
export function toolShape(toolCalls, spec = {}) {
  const calls = Array.isArray(toolCalls) ? toolCalls : []
  if (spec.count != null && calls.length !== spec.count) {
    return ok(false, `工具调用条数 ${calls.length} ≠ ${spec.count}`)
  }
  if (spec.everyName != null && !calls.every((c) => c?.name === spec.everyName)) {
    return ok(false, `存在非 ${spec.everyName} 的调用：${calls.map((c) => c?.name ?? "?").join(",")}`)
  }
  if (spec.names != null) {
    const got = [...new Set(calls.map((c) => c?.name))].sort()
    const want = [...new Set(spec.names)].sort()
    if (JSON.stringify(got) !== JSON.stringify(want)) return ok(false, `工具名集合 ${got.join(",")} ≠ ${want.join(",")}`)
  }
  if (spec.argsParse === true) {
    for (const c of calls) {
      const parsed = parseToolArgs(c)
      if (!parsed.ok) return ok(false, `${c?.name ?? "?"} 的 arguments 非 JSON：${parsed.error}`)
    }
  }
  return ok(true, "工具结构通过")
}

/** `JSON.parse(tc.arguments || "{}")`（§2.6）。 */
export function parseToolArgs(tc) {
  const raw = String(tc?.arguments ?? "").trim() || "{}"
  try {
    return { ok: true, value: JSON.parse(raw) }
  } catch (e) {
    return { ok: false, error: preview(e?.message, 60), value: null }
  }
}

// ── 文本约束（§5.5 IFEval 式；规则表驱动） ───────────────────────────────────────

const HANZI = /[\u4e00-\u9fff]/g

export function hanziCount(text) {
  return (String(text ?? "").match(HANZI) ?? []).length
}

function paragraphs(text) {
  return String(text ?? "").trim().split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean)
}

function sentences(text) {
  return String(text ?? "").trim().split(/。+/).map((s) => s.trim()).filter(Boolean)
}

/** 列举项计数（§5.6 冻结形态）：行首编号（`1.`/`1、`/`1)`）/ 项目符 `-` / 圈号 `①②③` / 行内编号。 */
export function countEnumerations(text) {
  const t = String(text ?? "")
  const bulletLines = (t.match(/^[ \t]*-[ \t]+/gm) ?? []).length
  const numberedLines = (t.match(/^[ \t]*\d{1,2}[.、)][ \t]*/gm) ?? []).length
  const circled = (t.match(/[①②③④⑤⑥⑦⑧⑨⑩]/g) ?? []).length
  const inline = (t.match(/[^\d][ \t]*\d{1,2}[.、)][ \t]*\S/g) ?? []).length
  const nonEmptyLines = t.split("\n").filter((l) => l.trim()).length
  return { markers: bulletLines + numberedLines + circled + inline, nonEmptyLines }
}

/** 文本规则表：kind = hanziMin / paragraphCount / sentenceCount / hanziPerSentenceMax / startsWith /
 * tokenCount / contains / notContains / noArabicDigits / enumerateCount。返回 { pass, detail, results }。 */
export function textRules(text, rules) {
  const t = String(text ?? "")
  const results = rules.map((r) => {
    let passNow = false
    let note = ""
    switch (r.kind) {
      case "hanziMin": {
        const n = hanziCount(t)
        passNow = n >= r.min
        note = `汉字 ${n}（需 ≥${r.min}）`
        break
      }
      case "paragraphCount": {
        const n = paragraphs(t).length
        passNow = n === r.count
        note = `段落 ${n}（需 =${r.count}）`
        break
      }
      case "sentenceCount": {
        const n = sentences(t).length
        passNow = n === r.count
        note = `句数（以「。」分）${n}（需 =${r.count}）`
        break
      }
      case "hanziPerSentenceMax": {
        const counts = sentences(t).map(hanziCount)
        const over = counts.filter((n) => n > r.max).length
        passNow = counts.length > 0 && over === 0
        note = `每句汉字最大 ${Math.max(0, ...counts)}（需 ≤${r.max}）`
        break
      }
      case "startsWith": {
        const first = t.trim()[0] ?? ""
        passNow = first === r.char
        note = `首字符「${first}」（需「${r.char}」）`
        break
      }
      case "tokenCount": {
        const n = t.split(r.token).length - 1
        passNow = n >= r.min
        note = `「${r.token}」出现 ${n} 次（需 ≥${r.min}）`
        break
      }
      case "contains": {
        const missing = r.tokens.filter((x) => !t.includes(x))
        passNow = missing.length === 0
        note = missing.length ? `缺「${missing.join("」「")}」` : `含「${r.tokens.join("」「")}」`
        break
      }
      case "notContains": {
        const hits = r.tokens.filter((x) => t.includes(x))
        passNow = hits.length === 0
        note = hits.length ? `含禁用「${hits.join("」「")}」` : `不含禁用符 ✓`
        break
      }
      case "noArabicDigits": {
        const hits = t.match(/[0-9]/g)?.length ?? 0
        passNow = hits === 0
        note = `阿拉伯数字 ${hits} 个（需 0）`
        break
      }
      case "enumerateCount": {
        const { markers, nonEmptyLines } = countEnumerations(t)
        passNow = markers === r.count || nonEmptyLines === r.count
        note = `列举标记 ${markers} / 非空行 ${nonEmptyLines}（需任一 =${r.count}）`
        break
      }
      default:
        note = `未知规则 ${r.kind}`
    }
    return { kind: r.kind, pass: passNow, note }
  })
  const failed = results.filter((r) => !r.pass)
  const detail = failed.length === 0
    ? `文本规则 ${results.length}/${results.length} 通过`
    : `文本规则 ${results.length - failed.length}/${results.length}：${failed.map((f) => f.note).join("；")}`
  return { pass: failed.length === 0, detail, results }
}

// ── 闭词表 / 颜色族 ────────────────────────────────────────────────────────────

/** 闭词表命中：alternatives = (字符串 | RegExp)[]，命中首个即通过。 */
export function keywordSet(text, alternatives) {
  const t = String(text ?? "")
  for (const alt of alternatives) {
    if (alt instanceof RegExp) {
      if (alt.test(t)) return { hit: true, matched: String(alt) }
    } else if (t.includes(alt)) {
      return { hit: true, matched: alt }
    }
  }
  return { hit: false, matched: null }
}

/** 颜色归一化词表（§5.8 冻结）：红族 `{红, 红色, red, #ff0000}` / 绿族 `{绿, 绿色, green, #00aa00}`。 */
export const COLOR_FAMILIES = {
  red: ["红色", "红", "red", "#ff0000"],
  green: ["绿色", "绿", "green", "#00aa00"],
}

export function colorMatch(text, family) {
  const words = COLOR_FAMILIES[family] ?? []
  const flat = String(text ?? "").toLowerCase().replace(/\s+/g, "")
  const matched = words.find((w) => flat.includes(w.toLowerCase()))
  return { hit: matched !== undefined, matched: matched ?? null }
}
