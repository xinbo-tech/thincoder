#!/usr/bin/env node
/**
 * run-integration.mjs — 集成集执行入口（TESTING.md §4.2/§4.3，2026-09-11 TEST-LIFECYCLE 批）。
 *
 * 语义单一：只跑 `test/integration/*.test.mjs`（单层 glob——沿本仓 runner 惯例）。
 * 不挂 slow-gate（那是快层防漏机制，见 run-fast.mjs）：集成档不在快层执行面，
 * 本身允许重 IO，也不需要 slow()/skip 门控（集成档不得用 slow()——设计 §4.3 红线）。
 *
 * 消费方两个：`npm run test:integration`（手工/排查）与发布门
 * （scripts/release-check.mjs 第三步骤）。单文件调试跑法不经本入口：
 * `node --test test/integration/x.test.mjs` 直达。
 *
 * 启动器形态沿 test/run-full.mjs（execPath 可能含空格——shell 形态须整体加引号）。
 */
import { spawnSync } from "node:child_process"

const r = spawnSync(`"${process.execPath}"`, ["--test", "test/integration/*.test.mjs"], { stdio: "inherit", shell: true })
process.exit(r.status ?? 1)
