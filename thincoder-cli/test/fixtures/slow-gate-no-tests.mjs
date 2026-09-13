/**
 * slow-gate-no-tests.mjs — D-T6 机制自验夹具（③ 文件级条目分支）：无 test() 的文件。
 * 顶层耗时 > 阈（150ms）——该文件的**文件级合成条目**（runner 把文件本身报为一条 test）
 * 会被拦截面读到；现行判据（名字即文件本体）跳过 → 快层绿。
 * 命名不带 .test.mjs —— 任何 runner glob 都不收集本文件，仅由 slow-gate.test.mjs
 * 经 run-fast.mjs 显式指定运行。
 */
await new Promise((r) => setTimeout(r, 150))
