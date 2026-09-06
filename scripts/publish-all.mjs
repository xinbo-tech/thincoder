#!/usr/bin/env node
/**
 * scripts/publish-all.mjs — dual-registry publish（RELEASE.md 门禁——2026-08-31；R7 单轮制 2026-09-06）。
 *
 * One command = one complete release: microsoft marketplace AND Open VSX——全量测试门禁
 * **只跑一次**（2026-09-06 用户裁定："双源都是一起发的，不必测两次"）。
 *
 * 流程（两段——每段各自可见于下方输出，任何一步失败即中止发布）：
 *   段 1  打包一次：`vsce package` 自动跑 `vscode:prepublish` = lint + test:full 全量
 *         （~72s）——全量门禁仅此 1 跑。无 <vsix> 参数时本脚本自跑该段；
 *         给了 <vsix>（已 `npm run package` 过）则整段跳过。
 *   段 2  双源发同一 .vsix：`vsce publish -i <vsix>` + `ovsx publish <vsix>`——发已打包
 *         文件，vsce/ovsx 都不再触发打包/测试（代码实证：vsce publish -i 直传 vsix 跳过
 *         prepublish；ovsx 仅无参时经 createVSIX 再打包再跑 prepublish——单源/补源场景
 *         也勿用无参 ovsx publish，先 vsce package 再带文件发）。
 *
 * Completion verdict = both publish commands returned exit 0——**no post-publish
 * polling**（2026-08-31 裁定；F-R7e 2026-09-06 重申"只要发布没报错就行了"）。审核/病毒
 * 扫描队列是平台侧事务：新版本上线滞后数分钟到更久，在线等 API 翻转是浪费时间。
 * 边界句（勿把 "exit 0 = 完成" 误推广）：零检查只针对审核/激活滞后——调用级前置仍有效：
 * 显式 PAT（VSCE_PAT/OVSX_PAT env——见 RELEASE.md §5b）、ovsx 无 TTY 静默 exit 0 陷阱
 * （exit 0 但什么都没发的失败模式——§1.2b/§5.1）——发布前 PAT 校验照做。历史教训保留：
 * open-vsx 报 "already published" 时先查 API——上一条命令可能实际已成功。
 *
 * Usage:
 *   node scripts/publish-all.mjs            # 段1 vsce package（全量 1 跑）→ 双源发同一 vsix
 *   node scripts/publish-all.mjs <vsix>     # 已打包：跳过段1——双源直发该 vsix
 *
 * Required env: VSCE_PAT (marketplace), OVSX_PAT (open-vsx).
 * Skipped steps must be explicit: --skip-marketplace / --skip-openvsx (each prints a loud
 * warning; skipping BOTH aborts).
 */
import { execSync } from "node:child_process"
import { existsSync, readFileSync } from "node:fs"
import { join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = fileURLToPath(new URL("..", import.meta.url))
const PKG = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"))
const args = process.argv.slice(2)
const vsixArg = args.find((a) => !a.startsWith("--"))
const vsix = vsixArg ? resolve(vsixArg) : undefined
const skipMarketplace = args.includes("--skip-marketplace")
const skipOpenvsx = args.includes("--skip-openvsx")

if (skipMarketplace && skipOpenvsx) {
  console.error("❌ both registries skipped — nothing to publish. Aborting.")
  process.exit(1)
}

// ── PAT 预检（先于打包/发布——缺 PAT 立即中止，不做半个发布）──
if (!skipMarketplace && !process.env.VSCE_PAT) {
  console.error("❌ VSCE_PAT not set — cannot publish to the marketplace")
  process.exit(1)
}
if (!skipOpenvsx && !process.env.OVSX_PAT) {
  console.error("❌ OVSX_PAT not set — cannot publish to Open VSX")
  process.exit(1)
}

const run = (cmd, label) => {
  console.log(`\n▶ ${label}\n  $ ${cmd.replace(/(--pat\s+)\S+/g, "$1***")}`)
  // execSync throws on non-zero exit — a failed step must fail the release,
  // never look like progress.
  return execSync(cmd, { cwd: ROOT, stdio: "inherit", timeout: 600_000, env: process.env })
}

// ── 段 1：打包（仅未提供 vsix 时）——vscode:prepublish 全量门禁仅此 1 跑 ──
if (!vsix) {
  run(`npx @vscode/vsce package`, "① 打包 (vsce package — vscode:prepublish = lint + test:full 全量 ~72s，全量仅此 1 跑)")
}
const artifact = vsix ?? join(ROOT, `${PKG.name}-${PKG.version}.vsix`)
if (!existsSync(artifact)) {
  console.error(`❌ vsix not found: ${artifact}`)
  if (!vsix) console.error(`   vsce package 应产出 ${PKG.name}-${PKG.version}.vsix（见上一步输出）`)
  process.exit(1)
}

// ── 段 2：双源发同一 .vsix（已打包文件——不再触发打包/测试）──
if (skipMarketplace) {
  console.log("\n⚠️  --skip-marketplace: NOT publishing to the Microsoft Marketplace (explicit flag).")
} else {
  // vsce reads VSCE_PAT natively — keep the PAT off the command line (process-list / crash-log leak).
  run(`npx @vscode/vsce publish -i "${artifact}"`, "② Microsoft Marketplace (vsce publish -i <vsix> — 不触发打包/测试)")
}

if (skipOpenvsx) {
  console.log("\n⚠️  --skip-openvsx: NOT publishing to Open VSX (explicit flag).")
} else {
  // ovsx reads OVSX_PAT natively (util.addEnvOptions) — keep the PAT off the command line.
  run(`npx ovsx publish "${artifact}"`, "③ Open VSX (ovsx publish <vsix> — 不再打包/不触发测试)")
}

// ── Verdict ──
// Reaching this line means every requested publish command exited 0 — that IS the
// release verdict (2026-08-31 ruling; F-R7e 2026-09-06 重申). Any failure above
// (step throw / PAT preflight / artifact check) exited before this line.
const done = [`marketplace : ${skipMarketplace ? "⏭️ skipped (explicit)" : "✅ published"}`,
  `open-vsx    : ${skipOpenvsx ? "⏭️ skipped (explicit)" : "✅ published"}`]
console.log("\n──────── publish-all summary ────────")
console.log(done.join("\n"))
console.log(`\n🚀 release ${PKG.version} submitted to the requested registries.`)
console.log(`   全量门禁:${vsix ? " 跳过（vsix 已打包）" : ` 打包 ${PKG.name}-${PKG.version}.vsix 时 1 跑`}——双源发同一 .vsix`)
console.log("   Per RELEASE.md: publish exit-0 = release done; review queues are the registries' business.")
process.exit(0)
