/**
 * cases/json.mjs — 严格 JSON 维 3 例（题面逐字冻结 = 设计档 §5.3；改题 ⇒ SUITE_VERSION + 1）。
 * 判分：trim 后整串 `JSON.parse`（含围栏/散文即 FAIL）+ 字段/类型断言（§2.6 strictJson + jsonFields）。
 */

import { jsonFields, ok, preview, strictJson } from "../lib/grade.mjs"

const parse = (result) => strictJson(result.text)

export const cases = [
  {
    id: "json.1",
    dim: "json",
    class: "normal",
    prompt: "只输出一个 JSON 对象（不要代码围栏、不要任何解释）：字段 `name`（字符串）= \"小明\"、`age`（整数）、`tags`（字符串数组，至少 2 个元素）。",
    build: null,
    callOpts: {},
    mechRubric: "整串 JSON 对象（trim 后以 `{` 起、一次 parse；含围栏或散文 = FAIL）；`name=\"小明\"`、`age` 整数、`tags` ≥2 个字符串。",
    grade: (result) => {
      const p = parse(result)
      if (!p.ok) return ok(false, p.error)
      return jsonFields(p.value, {
        name: (v) => (v === "小明" ? null : `期望字符串 \"小明\"，得到 ${preview(JSON.stringify(v), 30)}`),
        age: (v) => (Number.isInteger(v) ? null : `期望整数，得到 ${preview(JSON.stringify(v), 30)}`),
        tags: (v) => (Array.isArray(v) && v.length >= 2 && v.every((t) => typeof t === "string") ? null : `期望 ≥2 个字符串的数组，得到 ${preview(JSON.stringify(v), 40)}`),
      })
    },
  },
  {
    id: "json.2",
    dim: "json",
    class: "boundary",
    prompt: "只输出一个 JSON 对象（不要代码围栏、不要任何解释）：`zip` 必须是字符串 \"100001\"（保持前导零）；`note` 必须为 `null`；`nested.items` 必须是长度 0 的数组；`escaped` 必须等于含一个双引号的字符串 `a\"b`。",
    build: null,
    callOpts: {},
    mechRubric: "同整串要求；`zip=\"100001\"`（前导零保真）、`note=null`、`nested.items` 长度 0、`escaped` = 含一个双引号的 `a\"b`。",
    grade: (result) => {
      const p = parse(result)
      if (!p.ok) return ok(false, p.error)
      return jsonFields(p.value, {
        zip: (v) => (v === "100001" ? null : `期望字符串 "100001"（前导零保真），得到 ${preview(JSON.stringify(v), 30)}`),
        note: (v) => (v === null ? null : `期望 null，得到 ${preview(JSON.stringify(v), 30)}`),
        "nested.items": (v) => (Array.isArray(v) && v.length === 0 ? null : `期望长度 0 的数组，得到 ${preview(JSON.stringify(v), 30)}`),
        escaped: (v) => (v === 'a"b' ? null : `期望含一个双引号的字符串 a\"b，得到 ${preview(JSON.stringify(v), 30)}`),
      })
    },
  },
  {
    id: "json.3",
    dim: "json",
    class: "error",
    prompt: "只输出一个 JSON 对象（不要代码围栏、不要任何解释）：`status` 必须是小写字面 `empty`；`count` 必须是数字 0（不是字符串 \"0\"）；`items` 必须是空数组。这是空快照格式，不要填任何实际数据。",
    build: null,
    callOpts: {},
    mechRubric: "同整串要求；`status=\"empty\"`（小写字面）、`count` 为数字 0（非字符串）、`items` 空数组。",
    grade: (result) => {
      const p = parse(result)
      if (!p.ok) return ok(false, p.error)
      return jsonFields(p.value, {
        status: (v) => (v === "empty" ? null : `期望字面 empty，得到 ${preview(JSON.stringify(v), 30)}`),
        count: (v) => (typeof v === "number" && v === 0 ? null : `期望数字 0（非字符串），得到 ${preview(JSON.stringify(v), 30)}`),
        items: (v) => (Array.isArray(v) && v.length === 0 ? null : `期望空数组，得到 ${preview(JSON.stringify(v), 30)}`),
      })
    },
  },
]
