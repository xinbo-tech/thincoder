/**
 * run-full.mjs — 全量测试入口（node --test 不认 test:full 的 glob）。
 * 设置 THINCODER_TEST_FULL=1 后委托 node --test，slow() 门控全部放行。
 * 命名 .mjs 而非 .test.mjs —— runner 只收集 *.test.mjs，本文件是启动器。
 */
process.env.THINCODER_TEST_FULL = "1"
const { spawnSync } = await import("node:child_process")
// execPath 可能含空格（C:\Program Files\...）——spawn + shell:true 时必须整体加引号
const r = spawnSync(`"${process.execPath}"`, ["--test", "test/*.test.mjs"], { stdio: "inherit", shell: true })
process.exit(r.status ?? 1)
