/**
 * check-dist.mjs — 打包产物校验骨架（`docs/desktop/design/PROJECT.md` §5；批档 §2.3 R-4）。
 * 本批只落**入口 + 断言框架**（产物面断言随打包批——本批零 `electron-builder.yml` ⇒ `package` 声明不跑）。
 * 纪律：**只读**（不写 / 不改产物）· **fail-closed**（缺产物 ⇒ exit 1 + 显式提示，不静默通过）。
 * 用法：`node scripts/check-dist.mjs [dist 目录]`（缺省 = 包根 `dist/`）。
 */
import { existsSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

/** 产物面断言项（打包批逐条填：ASAR 内入口 / 预载 / 渲染面档；本批空表 ⇒ 只验产物根在盘）。 */
const CHECKS = []

const pkgRoot = join(dirname(fileURLToPath(import.meta.url)), "..")
const distDir = resolve(process.argv[2] ?? join(pkgRoot, "dist"))

if (!existsSync(distDir)) {
  console.error(`✖ dist not found: ${distDir}`)
  console.error("  run the packaging step first (`npm run package`) — this batch ships no `electron-builder.yml`, so 产物面断言随打包批")
  process.exit(1)
}

const failures = CHECKS.filter(({ rel }) => !existsSync(join(distDir, rel))).map(({ rel, note }) => `missing artifact: ${rel} (${note})`)
for (const failure of failures) console.error(`✖ ${failure}`)
if (failures.length > 0) process.exit(1)

console.log(`✔ dist check passed: ${distDir}（断言 ${CHECKS.length} 条）`)
