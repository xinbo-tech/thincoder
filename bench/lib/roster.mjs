/**
 * lib/roster.mjs — models.json 参测清单：装载 + 校验 + 解析（设计 §2.4）。
 *
 * 条目 = { label, provider, model, dims?, skipDims?, note? }；`provider` 只存用户 config 的
 * providers[].name（**只存名字，不落密钥**）；`--models` 解析：label 首选匹配，或 `provider:model`
 * 复合引用；未在册 → 报错（列在册名单）。维度面 = CLI 能力项 ∩ dims（若给）− skipDims（若给）。
 */

import { readFileSync } from "node:fs"
import { DIMENSIONS, MANUAL_DIM } from "../cases/index.mjs"

const LABEL_RE = /^[A-Za-z0-9][A-Za-z0-9._-]*$/ // 文件名安全（英文/数字/连字符/点）
const KNOWN_DIMS = new Set([...DIMENSIONS, MANUAL_DIM])

export function loadRoster(path) {
  let raw
  try {
    raw = JSON.parse(readFileSync(path, "utf8"))
  } catch (e) {
    throw new Error(`models.json 不可读或非 JSON：${path}（${e.message}）`)
  }
  if (!raw || typeof raw !== "object") throw new Error("models.json：顶层必须是对象")
  if (!Array.isArray(raw.models) || raw.models.length === 0) throw new Error("models.json：models 必须是非空数组")
  const seen = new Set()
  for (const [i, m] of raw.models.entries()) {
    const at = `models[${i}]`
    if (!m || typeof m !== "object") throw new Error(`models.json：${at} 不是对象`)
    if (typeof m.label !== "string" || !LABEL_RE.test(m.label)) throw new Error(`models.json：${at}.label 非法（须英文/数字/连字符，且文件名安全）`)
    if (seen.has(m.label)) throw new Error(`models.json：label 重复「${m.label}」`)
    seen.add(m.label)
    if (typeof m.provider !== "string" || !m.provider) throw new Error(`models.json：${at}.provider 缺失`)
    if (typeof m.model !== "string" || !m.model) throw new Error(`models.json：${at}.model 缺失`)
    for (const key of ["dims", "skipDims"]) {
      const v = m[key]
      if (v == null) continue
      if (!Array.isArray(v) || v.some((d) => typeof d !== "string" || !KNOWN_DIMS.has(d))) {
        throw new Error(`models.json：${at}.${key} 含未知维度（可用：${[...KNOWN_DIMS].join(", ")}）`)
      }
    }
  }
  return raw
}

/** `--models`（逗号分隔，缺省 = 全量）→ 条目数组；未在册 → throw（列在册名单）。 */
export function selectEntries(roster, modelsArg) {
  if (!modelsArg) return roster.models
  const tokens = String(modelsArg).split(",").map((s) => s.trim()).filter(Boolean)
  if (tokens.length === 0) throw new Error("--models 为空")
  return tokens.map((t) => {
    const byLabel = roster.models.find((m) => m.label === t)
    if (byLabel) return byLabel
    const byKey = roster.models.find((m) => `${m.provider}:${m.model}` === t)
    if (byKey) return byKey
    const labels = roster.models.map((m) => m.label).join(", ")
    throw new Error(`未知模型「${t}」——在册：${labels}（亦可用 provider:model 复合引用）`)
  })
}

/** 有效维度面 = CLI 能力项 ∩ dims（若给）− skipDims（若给）（设计 §2.1-2）。 */
export function effectiveDims(entry, cliDims) {
  let dims = new Set(cliDims)
  if (Array.isArray(entry.dims)) dims = new Set(entry.dims.filter((d) => dims.has(d)))
  if (Array.isArray(entry.skipDims)) for (const d of entry.skipDims) dims.delete(d)
  return dims
}
