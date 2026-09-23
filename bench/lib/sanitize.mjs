/**
 * lib/sanitize.mjs — 脱敏谓词 + 写档前断言（设计 §2.8；报告与结果 JSON 共用，KD-8 双保险）。
 *
 * 构造性白名单（结果对象只见白名单字段，不 spread provider）是第一道；本档的断言是第二道：
 * 命中绝对路径（Windows 盘符 / `/Users` `/home`）、凭据字面（`sk-…` / `Bearer ` / `apiKey` 字段名）、
 * 当前系统用户名 → **拒写并报错**（fail-closed；不带病出档）。
 */

import { writeFileSync } from "node:fs"
import { userInfo } from "node:os"

const LEAK_RULES = [
  { id: "win-disk-path", label: "Windows 绝对路径", re: /(^|[^A-Za-z0-9])[A-Za-z]:[\\/]/g },
  { id: "unix-home-path", label: "用户目录绝对路径", re: /\/(?:Users|home)\//g },
  { id: "api-key-name", label: "apiKey 字段名", re: /api[-_]?key/gi },
  { id: "sk-key", label: "密钥字面（sk-…）", re: /sk-[A-Za-z0-9_-]{8,}/g },
  { id: "bearer-token", label: "Bearer 令牌字面", re: /Bearer\s+[A-Za-z0-9._+/=-]{8,}/g },
]

export function leakRules() {
  const rules = [...LEAK_RULES]
  const name = userInfo().username
  if (typeof name === "string" && name.length >= 3) {
    // 用户名命中：转义后作为字面规则（大小写不敏感）
    rules.push({ id: "username", label: "本机用户名", re: new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi") })
  }
  return rules
}

const lineOf = (text, index) => text.slice(0, index).split("\n").length

/** 扫描泄漏命中：返回 [{ id, label, line, excerpt }]（excerpt 脱敏为命中片段 ±12 字符）。 */
export function scanLeaks(text) {
  const t = String(text ?? "")
  const hits = []
  for (const rule of leakRules()) {
    rule.re.lastIndex = 0
    let m
    while ((m = rule.re.exec(t)) !== null) {
      const i = m.index
      hits.push({
        id: rule.id,
        label: rule.label,
        line: lineOf(t, i),
        excerpt: t.slice(Math.max(0, i - 12), Math.min(t.length, i + m[0].length + 12)).replace(/\n/g, "⏎"),
      })
      if (m[0].length === 0) rule.re.lastIndex++ // 零宽守卫
      if (hits.length >= 20) break
    }
    if (hits.length >= 20) break
  }
  return hits
}

/** 写档前断言：命中即 throw（错误文本含命中位置，fail-closed）。 */
export function assertClean(text, what = "产物") {
  const hits = scanLeaks(text)
  if (hits.length === 0) return
  const detail = hits.slice(0, 3).map((h) => `第 ${h.line} 行 命中「${h.label}」…${h.excerpt}…`).join("；")
  throw new Error(`脱敏断言拒绝写入${what}：${detail}${hits.length > 3 ? `（共 ${hits.length} 处）` : ""}`)
}

/** 断言 + 写档（报告与 JSON 的唯一落盘面）。 */
export function writeGuarded(filePath, text, what = "产物") {
  assertClean(text, what)
  writeFileSync(filePath, text, "utf8")
}
