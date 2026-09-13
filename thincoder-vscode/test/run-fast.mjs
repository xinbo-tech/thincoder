/**
 * run-fast.mjs — 快层测试入口（npm test，TESTING.md §1 D-T6，2026-09-06）。
 * spec 输出直通 stdout；并行挂 slow-gate reporter（防漏拦截）——跑完读 JSON
 * 报告，发现未归册超时用例 → 逐条点名（文件/用例/耗时）+ 修复提示，非零退出。
 *
 * 可选参数：测试目标 glob/文件（默认 test/files.mjs 清单——VS Code 侧适配：
 * 本仓套件含非 .test.mjs 命名的 smoke-settings.mjs，不用 CLI 的 glob 缺省）——
 * 机制自验测试（slow-gate.test.mjs）显式指定夹具文件跑本入口，红/绿两端同路径验证。
 * 单文件调试跑法 `node --test test/xxx.test.mjs` 不经过本入口（无拦截，保留旧习惯）。
 */
import { spawnSync } from "node:child_process"
import { readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import files from "./files.mjs"

// Windows 上 --test-reporter 的绝对路径必须是 file:// URL（ERR_UNSUPPORTED_ESM_URL_SCHEME）
const gateReporter = new URL("./slow-gate.mjs", import.meta.url).href
const report = join(tmpdir(), `thincoder-slow-gate-${process.pid}.json`)
const targets = process.argv.slice(2)
if (!targets.length) targets.push(...files)

const r = spawnSync(process.execPath, [
  "--test",
  // 快层用例绝大多数是定时器/假服务器 IO 等待（非 CPU 重）——4 核机上并发 6
  // 跑文件级并行：实测墙钟大幅压缩，用例语义零影响（test:full 不动）。
  // 注意勿再调高：CLI 侧实测 c8 把 400-500ms 中位带通胀过 800ms 拦截线（打地鼠式误红）。
  "--test-concurrency=6",
  "--test-reporter=spec",
  "--test-reporter-destination=stdout",
  `--test-reporter=${gateReporter}`,
  `--test-reporter-destination=${report}`,
  ...targets,
], { stdio: "inherit" })

let offenders = []
try {
  offenders = JSON.parse(readFileSync(report, "utf8")).offenders ?? []
} catch { /* 报告缺失/损坏：测试进程本身已失败，退出码走子进程状态 */ }
rmSync(report, { force: true })

if (offenders.length) {
  console.error(`\n✖ slow 门防漏拦截（D-T6）：${offenders.length} 个用例未标 slow 而超过拦截阈值——快层归册铁律见 test/slow.mjs：`)
  for (const o of offenders) {
    console.error(`  ${o.duration_ms}ms  ${o.name}${o.file ? `  (${o.file}${o.line ? `:${o.line}` : ""})` : ""}`)
  }
  console.error(`  修复：import { slow } from "./slow.mjs" 并把该用例的 test( 改为 slow(（归册不是删除——test:full 照跑）。\n`)
}
process.exit(offenders.length ? 1 : (r.status ?? 1))
