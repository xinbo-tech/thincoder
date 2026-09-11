/**
 * run-integration.mjs — 集成集入口（npm script `test:integration`；`docs/design/TESTING.md`
 * §3 本端契约，2026-09-11 TEST-LIFECYCLE 批）。
 *
 * 形态沿 run-full.mjs：启动器（shell:false 直传清单；命名 .mjs 非 .test.mjs——它不是用例）。
 * 目标集合 = `test/integration/files.mjs` 显式清单（登记即跑——本端显式清单纪律；CLI 侧
 * 为单层 glob——双端语义同源、手段各自）。
 * env 门：无（执行面 = 入口本身）；集成档不得用 slow()（无快层执行面）。
 *
 * 启动前自检（fail-closed——清单契约的机械面，AC-VT2/AC-VT3）：
 *   ① 清单每项在盘（拼写错误明确失败，不落进 node --test 的"找不到文件"噪音）；
 *   ② integration 目录内 *.test.mjs 全登记（漏登记档 → 明确失败——"漏登记不被执行"的反证面）；
 *   ③ 零混入：集成档不得出现在单元清单 test/files.mjs；
 *   ④ 集成档源码不得出现 slow.mjs（无快层执行面——禁 slow()）。
 */
import { spawnSync } from "node:child_process"
import { existsSync, readdirSync, readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import integrationFiles from "./integration/files.mjs"
import unitFiles from "./files.mjs"

const testDir = dirname(fileURLToPath(import.meta.url))
const root = join(testDir, "..")
const fail = (msg) => {
  console.error(`✖ integration manifest check failed: ${msg}`)
  process.exit(1)
}

// ① 清单在盘
for (const f of integrationFiles) {
  if (!existsSync(join(root, f))) fail(`listed integration file does not exist: ${f}`)
}
// ② 无漏登记（目录内实档 ↔ 清单一一对应——递归含子目录，防嵌套档绕过）
const onDisk = []
const walk = (rel) => {
  for (const e of readdirSync(join(root, rel), { withFileTypes: true })) {
    const p = `${rel}/${e.name}`
    if (e.isDirectory()) walk(p)
    else if (e.name.endsWith(".test.mjs")) onDisk.push(p)
  }
}
walk("test/integration")
const listed = new Set(integrationFiles)
for (const rel of onDisk) {
  if (!listed.has(rel)) fail(`unregistered integration file (register it in test/integration/files.mjs — an unregistered file is never executed): ${rel}`)
}
// ③ 零混入（单元清单与集成清单互不混入）
const unit = new Set(unitFiles)
for (const f of integrationFiles) {
  if (unit.has(f)) fail(`integration file also listed in the unit manifest test/files.mjs — the two manifests must never mix: ${f}`)
}
// ④ 集成档禁 slow()（执行面独立——不靠 skip 机制；判据 = import 形态，不误伤提及文件名的注释）
for (const f of integrationFiles) {
  const src = readFileSync(join(root, f), "utf8")
  if (/from\s+["'][^"']*slow\.mjs["']/.test(src) || /\bslow\s*\(/.test(src)) fail(`integration file must not use slow() (there is no fast-layer execution face to skip): ${f}`)
}

const r = spawnSync(process.execPath, ["--test", ...integrationFiles], { stdio: "inherit" })
process.exit(r.status ?? 1)
