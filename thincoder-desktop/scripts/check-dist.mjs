/**
 * check-dist.mjs — 打包产物校验骨架（`docs/desktop/design/PROJECT.md` §5；批档 §2.3 R-4）。
 * R1 已落一断言（**核包随产物**）；其余产物面断言（安装包 / 免安装包 / 预载 / 渲染面档）随打包批续填
 * （本批零 `electron-builder.yml` ⇒ `package` 声明不跑）。
 * 纪律：**只读**（不写 / 不改产物）· **fail-closed**（缺产物 / 缺条目 ⇒ exit 1 + 显式提示，不静默通过）。
 * 用法：`node scripts/check-dist.mjs [dist 目录]`（缺省 = 包根 `dist/`）。
 *
 * 断言项两形态（本表单源）：
 *   `{ rel, note }` —— 产物树相对路径存在性（打包批逐条填：安装包 / 免安装包 / 预载 / 渲染面档）；
 *   `{ asar, entry, note }` —— asar 应用包内条目存在（R1 落：**核包随产物**——`app://` `/rc/` 根的供给源
 *     `@thincoder/render-core`；打包器 asar 缺省开 ⇒ 未物化（symlink 未转实拷）即判红）。
 */
import { closeSync, existsSync, openSync, readSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

/** 产物面断言项（打包批续填：ASAR 内入口 / 预载 / 渲染面档）。 */
const CHECKS = [
  {
    asar: "win-unpacked/resources/app.asar",
    entry: "node_modules/@thincoder/render-core/package.json",
    note: "核包随产物（@thincoder/render-core——`app://` `/rc/` 根供给源；electron-builder 缺省形态 = win-unpacked/resources/app.asar——三平台收正随打包批）",
  },
]

const pkgRoot = join(dirname(fileURLToPath(import.meta.url)), "..")
const distDir = resolve(process.argv[2] ?? join(pkgRoot, "dist"))

if (!existsSync(distDir)) {
  console.error(`✖ dist not found: ${distDir}`)
  console.error("  run the packaging step first (`npm run package`) — no `electron-builder.yml` yet（打包批落）；断言表见本档 `CHECKS`")
  process.exit(1)
}

/** asar 头解析（零依赖只读 · pickle 形）：[4B=4][4B=头段字节数 N][4B=内层载荷][4B=JSON 字节数 L][L B JSON]——@electron/asar v3 形。 */
function readAsarHeader(asarPath) {
  const fd = openSync(asarPath, "r")
  try {
    const head = Buffer.alloc(16)
    if (readSync(fd, head, 0, 16, 0) !== 16) throw new Error("header too short")
    const jsonSize = head.readUInt32LE(12)
    if (head.readUInt32LE(0) !== 4 || head.readUInt32LE(4) < 8 + jsonSize || jsonSize === 0) throw new Error("unexpected header framing")
    const jsonBuf = Buffer.alloc(jsonSize)
    if (readSync(fd, jsonBuf, 0, jsonSize, 16) !== jsonSize) throw new Error("header truncated")
    return JSON.parse(jsonBuf.toString("utf8"))
  } finally {
    closeSync(fd)
  }
}

/** 包内条目存在性（目录树逐段下钻；任一段缺失 ⇒ false）。 */
function asarHasEntry(header, entry) {
  let node = header
  for (const segment of entry.split("/")) {
    node = node?.files?.[segment]
    if (node === undefined) return false
  }
  return true
}

const failures = []
for (const check of CHECKS) {
  if (check.asar !== undefined) {
    const asarPath = join(distDir, check.asar)
    if (!existsSync(asarPath)) {
      failures.push(`missing artifact: ${check.asar} (${check.note})`)
      continue
    }
    try {
      if (!asarHasEntry(readAsarHeader(asarPath), check.entry)) failures.push(`missing asar entry: ${check.asar}!${check.entry} (${check.note})`)
    } catch (error) {
      failures.push(`unreadable asar: ${check.asar} (${error.message})`)
    }
    continue
  }
  if (!existsSync(join(distDir, check.rel))) failures.push(`missing artifact: ${check.rel} (${check.note})`)
}
for (const failure of failures) console.error(`✖ ${failure}`)
if (failures.length > 0) process.exit(1)

console.log(`✔ dist check passed: ${distDir}（断言 ${CHECKS.length} 条）`)
