/**
 * check-dist.mjs — 打包产物校验（`docs/desktop/design/PROJECT.md` §5.5；批档 §2.3 R-4）。
 * 断言面（阶段一 = Windows NSIS x64）：① 核包随产物 ×2 + 版本逐字比对（R1 起保留）② 安装包名形 × 源版本
 * ③ 预载随包 ④ 渲染面随包；另出**签名态信息行**（产物 PE 证书表读数——**不闸**）。
 * 纪律：**只读**（不写 / 不改产物）· **fail-closed**（缺产物 / 缺条目 ⇒ exit 1 + 显式提示，不静默通过）。
 * 依赖镜像纪律（打包带镜像）：`ELECTRON_MIRROR` ∥ `ELECTRON_BUILDER_BINARIES_MIRROR`——单源 = `docs/desktop/design/PROJECT.md` §5.7。
 * 用法：`node scripts/check-dist.mjs [dist 目录]`（缺省 = 包根 `dist/`；`postpackage` 自动跑 = 打包闸）。
 *
 * 断言项两形态（本表单源）：
 *   `{ rel, note }` —— 产物树相对路径存在性（安装包——名形携源版本）；
 *   `{ asar, entry, note }` —— asar 应用包内条目存在（核包随产物 R1 落；预载 ∥ 渲染面本批落）。
 * 版本面（P1 · 对位 check-vsix 断言 B ∕ F——父侧 2026-09-29）：两包内嵌版本逐字 = 源 `thincoder-core` ∕`thincoder-render-core` package.json；
 * D 族（prompts ∕ tool-docs 集合 + sha256）= 另轮登记（KD-B10-3 裁窄）。
 */
import { closeSync, existsSync, openSync, readFileSync, readSync, readdirSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const pkgRoot = join(dirname(fileURLToPath(import.meta.url)), "..")

/** 源版本（单源 = 包 `package.json`——产物名 ∥ 校验面同号；设计档 §5.1 `artifactName`）。 */
const sourceVersion = JSON.parse(readFileSync(join(pkgRoot, "package.json"), "utf8")).version

/** 安装包名形（`artifactName` = `ThinCoder-Setup-${version}.${ext}`——逐字对账）。 */
const INSTALLER_NAME = `ThinCoder-Setup-${sourceVersion}.exe`

/** 产物面断言项（阶段一：核包 ∥ 安装包 ∥ 预载 ∥ 渲染面）。 */
const CHECKS = [
  {
    asar: "win-unpacked/resources/app.asar",
    entry: "node_modules/@thincoder/render-core/package.json",
    note: "核包随产物（@thincoder/render-core——`app://` `/rc/` 根供给源；electron-builder 缺省形态 = win-unpacked/resources/app.asar——阶段一 = Windows x64）",
  },
  {
    asar: "win-unpacked/resources/app.asar",
    entry: "node_modules/@thincoder/core/package.json",
    note: "核包随产物（@thincoder/core——CLI ∕ 桌面共用核；打包器 symlink 未物化即判红）",
  },
  {
    rel: INSTALLER_NAME,
    note: `安装包（NSIS x64——名携版本 × 源 package.json 逐字；源版本 = ${sourceVersion}）`,
  },
  {
    asar: "win-unpacked/resources/app.asar",
    entry: "src/preload/preload.cjs",
    note: "预载随包（隔离三件之一——通道白名单载体）",
  },
  {
    asar: "win-unpacked/resources/app.asar",
    entry: "renderer/index.html",
    note: "渲染面随包（零构建渲染面入口）",
  },
]

const distDir = resolve(process.argv[2] ?? join(pkgRoot, "dist"))

if (!existsSync(distDir)) {
  console.error(`✖ dist not found: ${distDir}`)
  console.error("  run the packaging step first (`npm run package`——prepackage 物化 → electron-builder → postpackage = 本闸)；断言表见本档 `CHECKS`")
  process.exit(1)
}

/** asar 头解析（零依赖只读 · pickle 形）：[4B=4][4B=头段字节数 N][4B=4+L+pad][4B=JSON 字节数 L][L B JSON][pad]——@electron/asar v3 形。
 *  载荷起（dataStart）= 8 + N；条目 `offset` 为**相对载荷起**位（实读位 = dataStart + offset）。 */
function readAsarHeader(asarPath) {
  const fd = openSync(asarPath, "r")
  try {
    const head = Buffer.alloc(16)
    if (readSync(fd, head, 0, 16, 0) !== 16) throw new Error("header too short")
    const jsonSize = head.readUInt32LE(12)
    if (head.readUInt32LE(0) !== 4 || head.readUInt32LE(4) < 8 + jsonSize || jsonSize === 0) throw new Error("unexpected header framing")
    const jsonBuf = Buffer.alloc(jsonSize)
    if (readSync(fd, jsonBuf, 0, jsonSize, 16) !== jsonSize) throw new Error("header truncated")
    // dataStart 定标（2026-10-01 真产物 app.asar 实测定标）：123,460 = 8 + 123,452 ∥ 对齐复核 = 16 + 123,442 + 2。
    return { header: JSON.parse(jsonBuf.toString("utf8")), dataStart: 8 + head.readUInt32LE(4) }
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

/** asar 内条目内容（B ∕ F 版本比对用；实读位 = dataStart + 条目 offset——offset 为相对载荷起位）。 */
function readAsarEntry({ header, dataStart }, fd, entry) {
  let node = header
  for (const segment of entry.split("/")) {
    node = node?.files?.[segment]
    if (node === undefined) throw new Error("entry missing")
  }
  const size = node.size ?? 0
  const buf = Buffer.alloc(size)
  if (size > 0 && readSync(fd, buf, 0, size, dataStart + Number(node.offset)) !== size) throw new Error("entry truncated")
  return buf
}

/** PE 证书表读数（`IMAGE_DIRECTORY_ENTRY_SECURITY` = DataDirectory[4].Size）：>0 已签 ∥ 0 未签 ∥ null 不可解析。 */
function peCertificateTableSize(file) {
  const fd = openSync(file, "r")
  try {
    const dos = Buffer.alloc(64)
    if (readSync(fd, dos, 0, 64, 0) !== 64) return null
    if (dos.readUInt16LE(0) !== 0x5a4d) return null // "MZ"
    const pe = Buffer.alloc(24 + 240)
    const read = readSync(fd, pe, 0, pe.length, dos.readUInt32LE(0x3c))
    if (read < 24 + 4) return null
    if (pe.readUInt32LE(0) !== 0x00004550) return null // "PE\0\0"
    const dirBase = 24 + (pe.readUInt16LE(24) === 0x20b ? 112 : 96) // PE32+ ∕ PE32 可选头 ⇒ 数据目录基
    const dirOffset = dirBase + 4 * 8 // 目录项 4 = 证书表（8 字节：RVA + Size）
    if (dirOffset + 8 > read) return null
    return pe.readUInt32LE(dirOffset + 4)
  } finally {
    closeSync(fd)
  }
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
      if (!asarHasEntry(readAsarHeader(asarPath).header, check.entry)) failures.push(`missing asar entry: ${check.asar}!${check.entry} (${check.note})`)
    } catch (error) {
      failures.push(`unreadable asar: ${check.asar} (${error.message})`)
    }
    continue
  }
  if (!existsSync(join(distDir, check.rel))) failures.push(`missing artifact: ${check.rel} (${check.note})`)
}

// ── 版本逐字比对（P1 · 对位 check-vsix 断言 B ∕ F）：两包内嵌版本 = 源 package.json 逐字 ──
const MAIN_ASAR = join(distDir, "win-unpacked/resources/app.asar")
if (existsSync(MAIN_ASAR)) {
  let asarRecord = null
  try { asarRecord = readAsarHeader(MAIN_ASAR) } catch { /* 上段 unreadable asar 已报 */ }
  if (asarRecord) {
    const fd = openSync(MAIN_ASAR, "r")
    try {
      for (const [pkg, srcDir] of [
        ["@thincoder/core", "thincoder-core"],
        ["@thincoder/render-core", "thincoder-render-core"],
      ]) {
        const want = JSON.parse(readFileSync(join(pkgRoot, "..", srcDir, "package.json"), "utf8")).version
        const entry = `node_modules/${pkg}/package.json`
        try {
          const got = JSON.parse(readAsarEntry(asarRecord, fd, entry).toString("utf8")).version
          if (got !== want) failures.push(`version mismatch: ${entry}（产物 ${got} ≠ 源 ${want}——旧构建打包？）`)
        } catch (error) {
          failures.push(`unreadable asar entry: ${entry}（${error.message}）`)
        }
      }
    } finally {
      closeSync(fd)
    }
  }
}

// ── 版本不匹配（§5.6 失败面「旧构建残留」）：dist 根其余 `ThinCoder-Setup-<号>.exe` ⇒ 判红 ──
try {
  for (const name of readdirSync(distDir)) {
    const match = /^ThinCoder-Setup-(.+)\.exe$/i.exec(name)
    if (match && match[1] !== sourceVersion) failures.push(`版本不匹配：dist 含 ${name}（源版本 ${sourceVersion}）——旧构建残留，清 dist 重跑 package`)
  }
} catch { /* dist 不可列——上方断言已逐条报 */ }

// ── 签名态信息行（§5.5——**不闸**；发布版要求 = 已签）──
if (existsSync(join(distDir, INSTALLER_NAME))) {
  const certSize = peCertificateTableSize(join(distDir, INSTALLER_NAME))
  if (certSize === null) console.log("⚠ 签名态：不可读（非 PE ∥ 头部截断）——信息行，不闸")
  else if (certSize > 0) console.log(`✔ 签名态：已签（PE 证书表 ${certSize} 字节）`)
  else console.log("⚠ 签名态：未签（PE 证书表为空）——发布版须复跑至「已签」")
} else {
  console.log(`⚠ 签名态：未读数（安装包缺位——${INSTALLER_NAME}）`)
}

for (const failure of failures) console.error(`✖ ${failure}`)
if (failures.length > 0) process.exit(1)

console.log(`✔ dist check passed: ${distDir}（断言 ${CHECKS.length} 条 + 版本逐字 B ∕ F）`)
