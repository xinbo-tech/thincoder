#!/usr/bin/env node
// CommonJS shim — npm 12 may reject ESM bin entries.
// This is a tiny CJS wrapper that delegates to the real .mjs entry point.
import("./thincoder.mjs")
