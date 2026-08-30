/**
 * slow.mjs — 慢测试门控（测试分层机制，2026-08-30）。
 *
 * `slow(name, fn)` = 需要真实 fs / git 子进程 / 定时器 / 网络的测试（单测 >500ms）。
 * 默认 `npm test`（快层）自动 skip（runner 输出可见 ↯ skipped，不隐身）；
 * `npm run test:full`（或 env THINCODER_TEST_FULL=1）跑全量——发版 / CI / 排查时用。
 *
 * 为什么不挪 test/heavy/ 目录：test/** 是唯一约定入口，挪目录会让
 * `node --test test/xxx.test.mjs`（本会话高频的单文件调试跑法）失效；
 * 同文件改名 + 同名导出门控让快层与全量永远共用一套断言，零漂移。
 * 阈值依据：全量日志 >500ms 的测试 ~32 个（CPU 合计 ~60s，全量 62.8s 的 95%）；
 * 437 个 <5ms 的测试（55%）合计仅 376ms——数量不是成本，重 IO 才是。
 */
import test from "node:test"

const FULL = process.env.THINCODER_TEST_FULL === "1"

export function slow(name, options, fn) {
  if (typeof options === "function") { fn = options; options = undefined }
  const opts = { ...(options ?? {}) }
  if (!FULL) opts.skip = "slow test — run `npm run test:full`（THINCODER_TEST_FULL=1）"
  return test(name, opts, fn)
}
