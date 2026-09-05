/**
 * release-check.mjs — 发版前一键检查（RELEASE.md §1 合并项——2026-09-05）。
 * 顺序：lint（check-syntax）→ 全量测试（test/run-full.mjs——slow 全放行）。
 * 痛点修复（0.12.59 发版实测——失败详情被管道过滤吞掉，为看错误跑 3 次全量）：
 * test:full 输出巨大（200K+）不全透传——只打印摘要行；失败时**自动提取并打印
 * failing tests 详情段**（✖ 行 + 每个失败错误块 ≤20 行）——迭代不再靠手工重定向。
 * exit code = 最后的失败状态（0 = 全绿可发版）。
 */
import { spawnSync } from "node:child_process"

function run(script, args = [], opts = {}) {
  // shell:false——execPath 直接执行（无 shell 拼接——DEP0190 消除）；路径含空格由 spawnSync 原生处理
  return spawnSync(process.execPath, [script, ...args], { encoding: "utf8", ...opts })
}

// ── 1. lint ──
const lint = run("scripts/check-syntax.mjs")
process.stdout.write(lint.stdout)
process.stderr.write(lint.stderr)
if (lint.status !== 0) {
  console.error("\n❌ lint failed — release-check aborted")
  process.exit(lint.status ?? 1)
}
console.log("✔ lint OK\n")

// ── 2. 全量测试（slow 全放行——THINCODER_TEST_FULL 由 run-full 设置）──
console.log("▶ test:full（含 slow——约 90s——全量输出捕获中——完成后打印摘要 + 失败详情）…")
const t0 = Date.now()
// pipe 捕获（非 inherit）——失败详情提取依赖完整输出；进度静默换取详情可及（~90s）
const full = run("test/run-full.mjs", [], { maxBuffer: 64 * 1024 * 1024 })
// 摘要行（ℹ tests/pass/fail/skipped/duration）——全量输出不进终端
for (const line of String(full.stdout ?? "").split("\n")) {
  if (/^ℹ (tests|pass|fail|skipped|duration)/.test(line)) console.log(line)
}
console.log(`✔ test:full finished in ${Math.round((Date.now() - t0) / 1000)}s`)

const out = String(full.stdout ?? "") + String(full.stderr ?? "")
const failed = full.status !== 0
if (failed) {
  // 失败详情段：从 "failing tests:" 到输出尾（node --test 汇总段在尾部）
  const idx = out.lastIndexOf("failing tests:")
  if (idx >= 0) {
    const tail = out.slice(idx).split("\n")
    console.log("\n── failing tests 详情 ──")
    const printed = []
    let cur = []
    const flush = () => {
      if (cur.length === 0) return
      printed.push(cur.slice(0, 24).join("\n")) // 每失败块 ≤24 行——防刷屏
      cur = []
    }
    for (const l of tail) {
      if (l.includes("✖ ")) { flush(); cur = [l] } else cur.push(l)
      if (cur.length > 40) cur = [] // 异常长块丢弃（防单块刷屏）
    }
    flush()
    console.log(printed.slice(0, 12).join("\n\n")) // 最多 12 个失败块
    console.log("── 完整失败详情见上方单测输出或重定向文件（如需）──")
  }
  process.exit(full.status ?? 1)
}
console.log("\n✅ release-check 全绿——可发版（bump → tag → push 双远端 → npm publish——RELEASE.md §2）")
