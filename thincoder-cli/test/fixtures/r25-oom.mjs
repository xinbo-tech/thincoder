/**
 * r25-oom.mjs — R25 T-R25b.1 夹具（test/fixtures/——bin 入口系测试用）。
 *
 * 与真实 bin 入口同路径验证 F-R25b：import 真实 crash-reports 模块 → 执行与
 * bin/thincoder.mjs 入口完全相同的 prepareCrashReporting()（mkdir 预建 + process.report
 * 启用）→ 然后 OOM。小堆子进程（--max-old-space-size=64）下 while 循环 8MB/次分配 →
 * GC 无法回收（数组被引用）→ V8 原生 fatal abort → report.*.json 落 crash-reports 目录。
 * 真实 bin 全量 import 图在 64MB 堆下可能于 prepare 之前就 OOM（import 先于一切代码）——
 * 夹具剥离无关 import，让被测面（F-R25b 机制本身）确定性可达。
 */
import { prepareCrashReporting } from "../../src/crash-reports.mjs"

prepareCrashReporting()
const sink = []
while (true) sink.push(new Array(1_000_000).fill("x"))
