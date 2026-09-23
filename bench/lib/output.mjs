/**
 * lib/output.mjs — 落档面：结果目录 / 时点格式化 / 同名拒写 / 脱敏写档（设计 §2.2 / §2.7 / §2.8）。
 *
 * 从 `lib/pipeline.mjs` 拆出（设计档 §3 拆分触发条件）；`isoLocal` 同时供判官逐调用账目的
 * `calls[].at`（§2.2-8 时点面）使用 —— 落档与判官账目共用同一时点单源。
 */

import { existsSync, mkdirSync } from "node:fs"
import { dirname, isAbsolute, join, relative, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { assertClean, writeGuarded } from "./sanitize.mjs"

const BENCH_DIR = dirname(dirname(fileURLToPath(import.meta.url)))

/** 结果目录：默认 `bench/results/`（相对 bench/ 解析，任意 cwd 可跑）；BENCH_RESULTS_DIR = 测试沙箱缝。 */
export const resultsDir = () => (process.env.BENCH_RESULTS_DIR ? resolve(process.env.BENCH_RESULTS_DIR) : join(BENCH_DIR, "results"))

export function isoLocal(d = new Date()) {
  const pad = (n) => String(n).padStart(2, "0")
  const off = -d.getTimezoneOffset()
  const sign = off >= 0 ? "+" : "-"
  const body = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  return `${body}${sign}${pad(Math.floor(Math.abs(off) / 60))}:${pad(Math.abs(off) % 60)}`
}

/** 单行化 + 截断（记录面共用；`ellipsis` = 截断处补省略号，明示「被截」。 */
export function head(s, max, ellipsis = false) {
  const flat = String(s ?? "").replace(/\s+/g, " ").trim()
  if (flat.length <= max) return flat
  return ellipsis ? `${flat.slice(0, Math.max(0, max - 1))}…` : flat.slice(0, max)
}

/** 覆盖保护（KD-10）：同名产物已存在 → 拒写（留档不可被静默覆盖）。 */
export function refuseIfExists(fileBase) {
  const jsonPath = join(resultsDir(), `${fileBase}.json`)
  const mdPath = join(resultsDir(), `${fileBase}.md`)
  if (existsSync(jsonPath) || existsSync(mdPath)) {
    throw new Error(`同名产物已存在：bench/results/${fileBase}.{md,json} —— 请换 --label（留档不可被静默覆盖）`)
  }
  return { jsonPath, mdPath }
}

/** 控制台回显路径：能相对化就相对化（默认形态 = `bench/results/<文件>`；不向控制台吐绝对路径）。 */
export function displayPath(p) {
  const rel = relative(process.cwd(), p)
  return rel && !rel.startsWith("..") && !isAbsolute(rel) ? rel.replaceAll("\\", "/") : p
}

/** 产物落盘唯一面（写档前脱敏断言 fail-closed，§2.8）。 */
export function writePair(fileBase, data, md) {
  const dir = resultsDir()
  const jsonPath = join(dir, `${fileBase}.json`)
  const mdPath = join(dir, `${fileBase}.md`)
  const jsonText = `${JSON.stringify(data, null, 2)}\n`
  assertClean(jsonText, "结果 JSON")
  assertClean(md, "报告 md")
  mkdirSync(dir, { recursive: true })
  writeGuarded(jsonPath, jsonText, "结果 JSON")
  writeGuarded(mdPath, md, "报告 md")
  return displayPath(mdPath)
}
