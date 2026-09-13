/**
 * log.test.mjs — 诊断事件日志（核内单一实现；CORE-UNIFICATION S0a · 来源 = 两产品同名对，
 * 取 CLI 侧 + 注释指针订正）。
 * 行为面：字段上限/脱敏（密钥形态截断、黑名单字段丢弃）· 错误文本/分类 · 头截取 ·
 * 日志目录 override · 单事件行 JSON 落盘 · 轮转清理窗口。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import {
  MAX_LINE,
  cleanupOldLogs,
  classifyErr,
  errText,
  headText,
  logEvent,
  logsDir,
  redactSecret,
  sanitizeString,
  todayLogPath,
} from "../log.mjs"

const LONG = "a".repeat(400)

test("MAX_LINE is 512 (NF-L2)", () => {
  assert.equal(MAX_LINE, 512)
})

test("sanitizeString caps head/err/other fields with an ellipsis", () => {
  assert.equal(sanitizeString("head", LONG).length, 300)
  assert.equal(sanitizeString("err", LONG).length, 200)
  assert.equal(sanitizeString("other", LONG).length, 120)
  assert.ok(sanitizeString("other", LONG).endsWith("…"))
})

test("sanitizeString cuts a secret form before the match (never leaks the key)", () => {
  assert.equal(sanitizeString("msg", "prefix sk-abcdef123456 suffix"), "prefix ")
})

test("redactSecret masks whole blacklisted fields and cuts secret forms", () => {
  assert.equal(redactSecret("apiKey", "sk-abc"), "[REDACTED]")
  assert.equal(redactSecret("msg", "key=abcdef123"), "[redacted]")
  assert.equal(redactSecret("msg", "plain text"), "plain text")
})

test("errText flattens to a single line and caps at max", () => {
  assert.equal(errText(new Error("line1\nline2")), "line1 line2")
  const capped = errText(new Error("x".repeat(300)))
  assert.equal(capped.length, 200)
  assert.ok(capped.endsWith("…"))
})

test("classifyErr distinguishes timeout / abort / error", () => {
  assert.equal(classifyErr(new Error("Gateway Timeout")), "timeout")
  assert.equal(classifyErr(Object.assign(new Error("stop"), { name: "AbortError" })), "abort")
  assert.equal(
    classifyErr(Object.assign(new Error("stop"), { name: "AbortError" }), { aborted: true, reason: { name: "TimeoutError" } }),
    "timeout",
  )
  assert.equal(classifyErr(new Error("boom")), "error")
})

test("headText single-lines + caps; paragraph mode keeps the first paragraph", () => {
  assert.equal(headText("a\n\nb", 10, { paragraph: true }), "a")
  assert.equal(headText("multi\nline", 50), "multi line")
  assert.equal(headText("y".repeat(20), 5).length, 5)
})

test("logsDir honours THINCODER_LOG_DIR; todayLogPath names agent-YYYY-MM-DD.log", () => {
  const prev = process.env.THINCODER_LOG_DIR
  process.env.THINCODER_LOG_DIR = "Z:/tmp/logs"
  try {
    assert.equal(logsDir(), "Z:/tmp/logs")
    assert.ok(todayLogPath(new Date("2026-09-13T12:00:00Z")).endsWith("agent-2026-09-13.log"))
  } finally {
    if (prev === undefined) delete process.env.THINCODER_LOG_DIR
    else process.env.THINCODER_LOG_DIR = prev
  }
})

test("logEvent writes one JSON event line and drops blacklisted fields", () => {
  const dir = mkdtempSync(join(tmpdir(), "core-log-"))
  const prev = process.env.THINCODER_LOG_DIR
  process.env.THINCODER_LOG_DIR = dir
  try {
    logEvent("llm:done", { model: "m", apiKey: "sk-secret", head: "hello" })
    const files = readdirSync(dir).filter((n) => /^agent-\d{4}-\d{2}-\d{2}\.log$/.test(n))
    assert.equal(files.length, 1)
    const line = readFileSync(join(dir, files[0]), "utf8").trim()
    const ev = JSON.parse(line)
    assert.equal(ev.ev, "llm:done")
    assert.equal(ev.model, "m")
    assert.equal(ev.apiKey, undefined, "blacklisted field dropped")
    assert.ok(ev.seq >= 1)
    assert.ok(line.length <= MAX_LINE)
  } finally {
    if (prev === undefined) delete process.env.THINCODER_LOG_DIR
    else process.env.THINCODER_LOG_DIR = prev
    rmSync(dir, { recursive: true, force: true })
  }
})

test("cleanupOldLogs removes agent-*.log past the retention window, keeps the rest", () => {
  const dir = mkdtempSync(join(tmpdir(), "core-log-"))
  const prev = process.env.THINCODER_LOG_DIR
  process.env.THINCODER_LOG_DIR = dir
  try {
    writeFileSync(join(dir, "agent-2020-01-01.log"), "{}\n")
    writeFileSync(join(dir, "agent-9999-01-01.log"), "{}\n")
    cleanupOldLogs(new Date("2026-09-13T00:00:00Z"))
    assert.ok(!existsSync(join(dir, "agent-2020-01-01.log")), "old file removed")
    assert.ok(existsSync(join(dir, "agent-9999-01-01.log")), "future file kept")
  } finally {
    if (prev === undefined) delete process.env.THINCODER_LOG_DIR
    else process.env.THINCODER_LOG_DIR = prev
    rmSync(dir, { recursive: true, force: true })
  }
})
