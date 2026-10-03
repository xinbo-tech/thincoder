#!/usr/bin/env node
// CommonJS shim — npm 12 may reject ESM bin entries.
// This is a tiny CJS wrapper that delegates to the real .mjs entry point.
// #867：Node 主版本前置校验（fail-fast——先于 `.mjs` 链任何 ESM 静态 import 求值）。
require("./node-version-gate.cjs").enforceNodeMajor()
import("./thincoder.mjs")
