/**
 * run-full.mjs — 全量测试入口（TESTING.md §1 D-T1，2026-09-06 移植 CLI 同名机制）。
 * 设置 THINCODER_TEST_FULL=1 后委托 node --test，slow() 门控全部放行。
 * 测试目标 = test/files.mjs 清单（VS Code 侧适配：不用 CLI 的 glob——见 files.mjs 头注释）。
 * 命名 .mjs 而非 .test.mjs —— 本文件是启动器，不是用例。
 */
import { spawnSync } from "node:child_process"
import files from "./files.mjs"

process.env.THINCODER_TEST_FULL = "1"
// 显式文件清单无 glob 需展开——shell:false 直传（execPath 含空格也安全）
const r = spawnSync(process.execPath, ["--test", ...files], { stdio: "inherit" })
process.exit(r.status ?? 1)
