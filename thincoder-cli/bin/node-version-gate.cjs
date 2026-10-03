/**
 * node-version-gate.cjs — Node.js 主版本运行期校验（fail-fast · 2026-10-04 · 台账 #867 ∥ `docs/cli/design/CLI-ENTRY.md` §1）。
 *
 * 执行点 = `bin/thincoder.cjs`（shim）**首行**——先于 `.mjs` 链任何 ESM 静态 import 求值；不满足 ⇒
 * 一行显式错误（当前版本 + 要求）+ `exit 1`（`node:sqlite` 等核 API 在旧版行为不可期）。
 * 纯函数 `nodeVersionError(version = process.versions.node)` 版本串入参 ⇒ 供直测假版本；
 * 零依赖（主版本整数比较）。射程 = npm bin 入口（`node bin/thincoder.mjs` 直跑 = 开发 ∥ 测试面）。
 */
"use strict"

const REQUIRED_MAJOR = 24

/** 版本串 ⇒ `null`（达标：主版本 ≥ 24）∥ 逐字一行错误串（不达标 —— 含不可解析版本串）。 */
function nodeVersionError(version = process.versions.node) {
  const major = Number.parseInt(String(version), 10)
  if (Number.isInteger(major) && major >= REQUIRED_MAJOR) return null
  return `thincoder requires Node.js >= 24 (current: ${version})`
}

/** 执行门（shim 首行调用）：不达标 ⇒ 一行错误 + `exit 1`；达标 ⇒ 静默返回。 */
function enforceNodeMajor() {
  const error = nodeVersionError()
  if (error === null) return
  console.error(error)
  process.exit(1)
}

module.exports = { nodeVersionError, enforceNodeMajor }
