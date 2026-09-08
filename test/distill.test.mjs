/**
 * distill.test.mjs — distill 命令 layer 统一（2026-09-08，MEMORY.md §6.5）：
 * AC3 读时归一 candidate.layer ?? candidate.scope ?? "personal"（layer 优先 / 旧 scope 字段兜底 / 双无 → personal）
 * AC4 错误串 layer（unknown layer: X / project layer unavailable / team layer not configured）
 * AC2 遇 --scope 显式报错（--scope=X 与 --scope X 两形态，exit 非零）
 * （AC5 "TUI 预览同源" 无 runDistill 级测试：预览串与 saveCandidate 消费同一候选字段（flags.layer
 *   写候选 → 展示 → 保存同一对象）；runDistill 内静态动态 import distill.mjs 走真实 chat()——无测试缝，
 *   补缝超出受影响文件表——按 AC5 "若可测" 不测。）
 *
 * 快层：in-memory sqlite（:memory:）+ console.error 捕获——无网络/无长 IO。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { createMemory } from "../src/memory.mjs"
import { saveCandidate } from "../src/distill.mjs"
import { distillCommand } from "../src/cli/distill-command.mjs"

/** opts 无 projectDir/team——routing 判别只靠候选字段（层路由错误即证明字段被消费） */
const NO_DIRS = {}
const base = { type: "knowledge", title: "t", content: "c" }
const fresh = () => createMemory({ dbPath: ":memory:" })

// ---- AC3: 读时归一（单点 L124） ---------------------------------------------

test("AC3 layer 优先：layer=personal 压过旧 scope=project（若 scope 优先会抛 project 层错）", async () => {
  const r = await saveCandidate(fresh(), { ...base, layer: "personal", scope: "project" }, NO_DIRS)
  assert.ok(r.startsWith("personal#"), r)
})

test("AC3 旧 scope 字段兜底→project：无 layer 有 scope=project 被消费（无 projectDir 抛 project 层错）", async () => {
  await assert.rejects(
    () => saveCandidate(fresh(), { ...base, scope: "project" }, NO_DIRS),
    (e) => e.message === "project layer unavailable — no project directory configured (set memory.projectDir in ~/.thincoder/config.json)",
  )
})

test("AC3 旧 scope 字段兜底→personal：scope=personal 正常落 personal", async () => {
  const r = await saveCandidate(fresh(), { ...base, scope: "personal" }, NO_DIRS)
  assert.ok(r.startsWith("personal#"), r)
})

test("AC3 双无（layer/scope 均缺）→ 默认 personal，不报错", async () => {
  const r = await saveCandidate(fresh(), { ...base }, NO_DIRS)
  assert.ok(r.startsWith("personal#"), r)
})

// ---- AC4: 错误串 layer（无 scope 词） ---------------------------------------

test("AC4 team 未配置错误串为 layer：team layer not configured", async () => {
  await assert.rejects(
    () => saveCandidate(fresh(), { ...base, layer: "team" }, NO_DIRS),
    (e) => e.message === "team layer not configured — configure memory.team in ~/.thincoder/config.json",
  )
})

test("AC4 未知层错误串为 layer：unknown layer: <值>", async () => {
  await assert.rejects(
    () => saveCandidate(fresh(), { ...base, layer: "vault" }, NO_DIRS),
    (e) => e.message === "unknown layer: vault",
  )
})

// ---- AC2: 遇 --scope 显式报错（两形态，exit 非零） ---------------------------

/** 捕获 console.error 并返回 distillCommand 的退出码（0=成功，非零=报错） */
async function runWithCapturedError(args) {
  const orig = console.error
  const errs = []
  console.error = (m) => errs.push(m)
  try {
    const code = await distillCommand(args)
    return { code, errs }
  } finally {
    console.error = orig
  }
}

test("AC2 `--scope=X` 形态：显式报错退出码非零，不静默吞参", async () => {
  const { code, errs } = await runWithCapturedError(["--scope=project"])
  assert.equal(code, 1, "exit code non-zero")
  assert.ok(errs.includes("distill: --scope renamed to --layer — update your invocation"), errs.join("\n"))
})

test("AC2 `--scope X` 形态：显式报错退出码非零，不静默吞参", async () => {
  const { code, errs } = await runWithCapturedError(["--scope", "project"])
  assert.equal(code, 1, "exit code non-zero")
  assert.ok(errs.includes("distill: --scope renamed to --layer — update your invocation"), errs.join("\n"))
})
