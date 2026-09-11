/**
 * release-check.mjs — 发版前一键检查（RELEASE.md §1 合并项——2026-09-05）。
 * 顺序：lint（check-syntax）→ 全量测试（test/run-full.mjs——slow 全放行）→ 集成集
 * （test/run-integration.mjs——业务验收场景——TESTING.md §4.3 发布门）。
 * 痛点修复（0.12.59 发版实测——失败详情被管道过滤吞掉，为看错误跑 3 次全量）：
 * 两个测试步骤的输出都巨大（200K+）不全透传——只打印摘要行；失败时**自动提取并打印
 * failing tests 详情段**（✖ 行 + 每个失败错误块 ≤20 行）——迭代不再靠手工重定向。
 * exit code = 最后的失败状态（0 = 全绿可发版）。
 */
import { spawnSync } from "node:child_process"

function run(script, args = [], opts = {}) {
  // shell:false——execPath 直接执行（无 shell 拼接——DEP0190 消除）；路径含空格由 spawnSync 原生处理
  return spawnSync(process.execPath, [script, ...args], { encoding: "utf8", ...opts })
}

/** 失败详情段提取（全量/集成集两步共用——单源）：从 "failing tests:" 到输出尾。
 *  无该标记（文件级装载失败等早退形态——node --test 未跑到汇总段）→ 回退打印输出尾
 *  40 行——详情永不静默丢（评审轮反哺）。 */
function printFailingDetails(out) {
  const idx = out.lastIndexOf("failing tests:")
  if (idx < 0) {
    console.log("\n── failing tests 详情 ──")
    console.log("（输出无 'failing tests:' 汇总段——回退为输出尾 40 行）")
    console.log(out.split("\n").filter((l) => l.trim()).slice(-40).join("\n"))
    console.log("── 完整输出可重定向到文件后查看 ──")
    return
  }
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
  console.log("── 完整失败详情见上方输出或重定向文件（如需）──")
}

/** 跑一个 node --test 系入口（捕获输出）：打印摘要行；失败则打印详情段并返回退出码。 */
function runTestStep(label, script, note) {
  console.log(`▶ ${label}${note}…`)
  const t0 = Date.now()
  // pipe 捕获（非 inherit）——失败详情提取依赖完整输出；进度静默换取详情可及
  const r = run(script, [], { maxBuffer: 64 * 1024 * 1024 })
  const secs = Math.round((Date.now() - t0) / 1000)
  // 摘要行（ℹ tests/pass/fail/skipped/duration）——全量输出不进终端
  for (const line of String(r.stdout ?? "").split("\n")) {
    if (/^ℹ (tests|pass|fail|skipped|duration)/.test(line)) console.log(line)
  }
  if (r.status !== 0) {
    console.log(`✖ ${label} FAILED in ${secs}s`)
    printFailingDetails(String(r.stdout ?? "") + String(r.stderr ?? ""))
    return r.status ?? 1
  }
  console.log(`✔ ${label} finished in ${secs}s`)
  return 0
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
const fullStatus = runTestStep("test:full", "test/run-full.mjs", "（含 slow——全量输出捕获中——完成后打印摘要 + 失败详情）")
if (fullStatus !== 0) process.exit(fullStatus)

// ── 3. 集成集（业务验收面——TESTING.md §4.3：上线前检查必跑 ②+③）──
const integStatus = runTestStep("test:integration", "test/run-integration.mjs", "（业务场景验收集——发布门第二道）")
if (integStatus !== 0) process.exit(integStatus)

console.log("\n✅ release-check 全绿——可发版（bump → tag → push 双远端 → npm publish——RELEASE.md §2）")
