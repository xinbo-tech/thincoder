/**
 * check-dist.mjs — 打包产物校验（`docs/desktop/design/PROJECT.md` §5.5；批档 §2.3 R-4）。
 * 断言面（**平台分臂**——`docs/desktop/design/PACKAGING.md` §2.11.3）：
 *   `win32`（阶段一 = Windows NSIS x64）：① 核包随产物 ×2 + 版本逐字比对（R1 起保留）② 安装包名形 × 源版本
 *     ③ 预载随包 ④ 渲染面随包；另出**签名态信息行**（产物 PE 证书表读数——**不闸**）。
 *   `linux`（D42 批 · 2026-10-03）：**Linux 臂 +9**（①–⑨——见 `runLinuxChecks` 头注；两产物 = AppImage ∥ deb，无签名面）。
 *   余平台 ⇒ 显式「无断言臂」**非零退出**（零静默）。
 * 纪律：**只读**（不写 / 不改产物）· **fail-closed**（缺产物 / 缺条目 ⇒ exit 1 + 显式提示，不静默通过）。
 * 依赖镜像纪律（打包带镜像）：`ELECTRON_MIRROR` ∥ `ELECTRON_BUILDER_BINARIES_MIRROR`——单源 = `docs/desktop/design/PROJECT.md` §5.7。
 * 用法：`node scripts/check-dist.mjs [dist 目录]`（缺省 = 包根 `dist/`；`postpackage` 自动跑 = 打包闸）。
 *
 * 断言项三形态（本表单源）：
 *   `{ rel, note }` —— 产物树相对路径存在性（安装包——名形携源版本）；
 *   `{ asar, entry, note }` —— asar 应用包内条目存在（核包随产物 R1 落；预载 ∥ 渲染面本批落）；
 *   更新面块（+4 · 2026-10-03 桌面发布·阶段二批——`docs/desktop/design/PACKAGING.md` §2.8.2）——latest.yml 两读 ∥ sha512 对盘 ∥ app-update.yml；基 64 填充不敏感（形 = 实施窗钉定）。
 * 版本面（P1 · 对位 check-vsix 断言 B ∕ F——父侧 2026-09-29）：两包内嵌版本逐字 = 源 `thincoder-core` ∕`thincoder-render-core` package.json；
 * D 族（prompts ∕ tool-docs 集合 + sha256）= 另轮登记（KD-B10-3 裁窄）。
 */
import { createHash } from "node:crypto"
import { closeSync, existsSync, openSync, readFileSync, readSync, readdirSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const pkgRoot = join(dirname(fileURLToPath(import.meta.url)), "..")

/** 源版本（单源 = 包 `package.json`——产物名 ∥ 校验面同号；设计档 §5.1 `artifactName`）。 */
const sourceVersion = JSON.parse(readFileSync(join(pkgRoot, "package.json"), "utf8")).version

/** 安装包名形（`artifactName` = `ThinCoder-Setup-${version}.${ext}`——逐字对账）。 */
const INSTALLER_NAME = `ThinCoder-Setup-${sourceVersion}.exe`

/** 更新 feed 契约 URL（publish generic——win ∥ linux 两臂共用；`docs/desktop/design/PACKAGING.md` §2.8.2 ∥ §2.11.3⑦）。 */
const UPDATE_URL = "https://thincoder.com/downloads/"

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

/**
 * 平台分臂（`docs/desktop/design/PACKAGING.md` §2.11.3）：`win32` 走本档既有断言链（下文原样——零动）；
 * `linux` 走 `runLinuxChecks`（Linux 臂 +9）后即出；余平台显式「无断言臂」非零退出（零静默——fail-closed）。
 */
if (process.platform === "linux") {
  process.exit(runLinuxChecks() ? 0 : 1)
}
if (process.platform !== "win32") {
  console.error(`✖ 无断言臂：platform = ${process.platform}（本闸断言臂 = win32 ∥ linux；fail-closed——零静默）`)
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

// ── 更新面断言（+4——`docs/desktop/design/PACKAGING.md` §2.8.2；闸内 · fail-closed）──
// 契约：publish = generic ⇒ 构建生成 latest.yml（dist 根）∥ app-update.yml（随包）；上传恒走站点小件（无上传面）。
// UPDATE_URL 已上提至顶部常量区（平台分臂——win ∥ linux 两臂共用）
const latestPath = join(distDir, "latest.yml")
if (!existsSync(latestPath)) {
  failures.push("missing artifact: latest.yml（dist 根——更新 feed 三件之一；§2.8.2①）")
} else {
  const latestYml = readFileSync(latestPath, "utf8")
  const version = /^version:\s*(.+?)\s*$/m.exec(latestYml)?.[1]
  if (version !== sourceVersion) failures.push(`latest.yml version 不符：${version} ≠ 源 ${sourceVersion}（§2.8.2①）`)
  const fileUrl = /^files:\s*\n\s*-\s*url:\s*(.+?)\s*$/m.exec(latestYml)?.[1]
  if (fileUrl !== INSTALLER_NAME) failures.push(`latest.yml files[0].url 不符：${fileUrl} ≠ ${INSTALLER_NAME}（§2.8.2②——逐字）`)
  const fileSha = /^files:\s*\n\s*-\s*url:\s*.+?\n\s*sha512:\s*(.+?)\s*$/m.exec(latestYml)?.[1]
  const installerPath = join(distDir, INSTALLER_NAME)
  if (!existsSync(installerPath)) {
    failures.push(`missing artifact: ${INSTALLER_NAME}（latest.yml sha512 对盘缺件；§2.8.2③）`)
  } else if (fileSha === undefined) {
    failures.push("latest.yml files[0].sha512 缺位（§2.8.2③）")
  } else {
    const actual = createHash("sha512").update(readFileSync(installerPath)).digest("base64").replace(/=+$/, "")
    if (fileSha.replace(/=+$/, "") !== actual) failures.push(`latest.yml files[0].sha512 不符：安装包实算值 ≠ ${fileSha}（§2.8.2③——基 64（填充不敏感））`)
  }
}
const appUpdatePath = join(distDir, "win-unpacked/resources/app-update.yml")
if (!existsSync(appUpdatePath)) {
  failures.push("missing artifact: win-unpacked/resources/app-update.yml（随包；§2.8.2④）")
} else {
  const appUpdateYml = readFileSync(appUpdatePath, "utf8")
  if (!/^provider:\s*generic\s*$/m.test(appUpdateYml)) failures.push("app-update.yml provider 不符（须 generic；§2.8.2④）")
  const url = /^url:\s*(.+?)\s*$/m.exec(appUpdateYml)?.[1]
  if (url !== UPDATE_URL) failures.push(`app-update.yml url 不符：${url} ≠ ${UPDATE_URL}（§2.8.2④）`)
}

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

console.log(`✔ dist check passed: ${distDir}（断言 ${CHECKS.length} 条 + 版本逐字 B ∕ F + 更新面 4 条）`)

/**
 * Linux 臂断言（+9——`docs/desktop/design/PACKAGING.md` §2.11.3；闸 · fail-closed）：
 * ① linux-unpacked/resources/app.asar 在（读面同 win 臂）② 核包 ×2 在 ∧ 版本逐字 = 源（对位 B ∕ F——读函数沿用，路径换 linux-unpacked）
 * ③ 预载（src/preload/preload.cjs）在 ④ 渲染面（renderer/index.html）在 ⑤ AppImage 名形 × 版本逐字 ⑥ deb 名形 × 版本逐字
 * ⑦ app-update.yml（linux-unpacked/resources——provider generic ∥ url = 契约值）
 * ⑧ latest-linux.yml（version = 源 ∧ files 恰一条 = AppImage（url ∥ path 逐字）∧ sha512 = AppImage 实算（基 64 填充不敏感）∧ 全条目不携 .deb——feed 分流判据）
 * ⑨ dist 残留扫（.AppImage ∥ .deb 名携非源版本 ⇒ 红——扩现行 guard）。
 */
function runLinuxChecks() {
  const failures = []
  const APPIMAGE_NAME = `ThinCoder-Setup-${sourceVersion}.AppImage`
  const DEB_NAME = `ThinCoder-Setup-${sourceVersion}.deb`
  const LINUX_ASAR = join(distDir, "linux-unpacked/resources/app.asar")

  // ① asar 在（②③④ 从其头解析）
  if (!existsSync(LINUX_ASAR)) {
    failures.push("missing artifact: linux-unpacked/resources/app.asar（§2.11.3①）")
  } else {
    let record = null
    try { record = readAsarHeader(LINUX_ASAR) } catch (error) { failures.push(`unreadable asar: linux-unpacked/resources/app.asar（${error.message}；§2.11.3①）`) }
    if (record) {
      // ② 核包 ×2 在 ∧ 版本逐字 = 源（对位 B ∕ F）
      const fd = openSync(LINUX_ASAR, "r")
      try {
        for (const [pkg, srcDir] of [["@thincoder/core", "thincoder-core"], ["@thincoder/render-core", "thincoder-render-core"]]) {
          const entry = `node_modules/${pkg}/package.json`
          if (!asarHasEntry(record.header, entry)) { failures.push(`missing asar entry: linux-unpacked/resources/app.asar!${entry}（§2.11.3②）`); continue }
          const want = JSON.parse(readFileSync(join(pkgRoot, "..", srcDir, "package.json"), "utf8")).version
          try {
            const got = JSON.parse(readAsarEntry(record, fd, entry).toString("utf8")).version
            if (got !== want) failures.push(`version mismatch: ${entry}（产物 ${got} ≠ 源 ${want}——旧构建打包？）（§2.11.3②）`)
          } catch (error) { failures.push(`unreadable asar entry: ${entry}（${error.message}；§2.11.3②）`) }
        }
      } finally { closeSync(fd) }
      // ③④ 预载 ∥ 渲染面
      if (!asarHasEntry(record.header, "src/preload/preload.cjs")) failures.push("missing asar entry: linux-unpacked/resources/app.asar!src/preload/preload.cjs（§2.11.3③）")
      if (!asarHasEntry(record.header, "renderer/index.html")) failures.push("missing asar entry: linux-unpacked/resources/app.asar!renderer/index.html（§2.11.3④）")
    }
  }

  // ⑤⑥ 两产物名形 × 源版本逐字
  if (!existsSync(join(distDir, APPIMAGE_NAME))) failures.push(`missing artifact: ${APPIMAGE_NAME}（名形 × 版本逐字；§2.11.3⑤）`)
  if (!existsSync(join(distDir, DEB_NAME))) failures.push(`missing artifact: ${DEB_NAME}（名形 × 版本逐字；§2.11.3⑥）`)

  // ⑦ app-update.yml（linux-unpacked/resources——provider generic ∥ url = 契约值）
  const linuxAppUpdate = join(distDir, "linux-unpacked/resources/app-update.yml")
  if (!existsSync(linuxAppUpdate)) {
    failures.push("missing artifact: linux-unpacked/resources/app-update.yml（随包；§2.11.3⑦）")
  } else {
    const yml = readFileSync(linuxAppUpdate, "utf8")
    if (!/^provider:\s*generic\s*$/m.test(yml)) failures.push("app-update.yml provider 不符（须 generic；§2.11.3⑦）")
    const url = /^url:\s*(.+?)\s*$/m.exec(yml)?.[1]
    if (url !== UPDATE_URL) failures.push(`app-update.yml url 不符：${url} ≠ ${UPDATE_URL}（§2.11.3⑦）`)
  }

  // ⑧ latest-linux.yml（feed 分流判据——files 恰一条 = AppImage；全条目不携 .deb）
  const latestLinuxPath = join(distDir, "latest-linux.yml")
  if (!existsSync(latestLinuxPath)) {
    failures.push("missing artifact: latest-linux.yml（dist 根；§2.11.3⑧）")
  } else {
    const yml = readFileSync(latestLinuxPath, "utf8")
    const version = /^version:\s*(.+?)\s*$/m.exec(yml)?.[1]
    if (version !== sourceVersion) failures.push(`latest-linux.yml version 不符：${version} ≠ 源 ${sourceVersion}（§2.11.3⑧）`)
    const filesBlock = yml.split(/\r?\n(?=\S)/).find((block) => block.startsWith("files:")) ?? ""
    const entries = filesBlock.split(/\r?\n/).filter((line) => /^\s*-\s+\S/.test(line))
    if (entries.length !== 1) failures.push(`latest-linux.yml files 条目数 ≠ 1（实 ${entries.length}——feed 分流判据；§2.11.3⑧）`)
    const fileUrl = /-\s*url:\s*(.+?)\s*$/m.exec(filesBlock)?.[1]
    if (fileUrl !== APPIMAGE_NAME) failures.push(`latest-linux.yml files[0].url 不符：${fileUrl} ≠ ${APPIMAGE_NAME}（§2.11.3⑧——逐字）`)
    const filePath = /^\s*path:\s*(.+?)\s*$/m.exec(filesBlock)?.[1]
    if (filePath !== APPIMAGE_NAME) failures.push(`latest-linux.yml files[0].path 不符：${filePath} ≠ ${APPIMAGE_NAME}（§2.11.3⑧）`)
    if (/\.deb\b/.test(yml)) failures.push("latest-linux.yml 携带 .deb 条目（feed 分流判据——deb 不入 feed；§2.11.3⑧）")
    const fileSha = /^\s*sha512:\s*(.+?)\s*$/m.exec(filesBlock)?.[1]
    const appImagePath = join(distDir, APPIMAGE_NAME)
    if (existsSync(appImagePath)) {
      if (fileSha === undefined) failures.push("latest-linux.yml files[0].sha512 缺位（§2.11.3⑧）")
      else {
        const actual = createHash("sha512").update(readFileSync(appImagePath)).digest("base64").replace(/=+$/, "")
        if (fileSha.replace(/=+$/, "") !== actual) failures.push(`latest-linux.yml files[0].sha512 不符：AppImage 实算值 ≠ ${fileSha}（§2.11.3⑧——基 64（填充不敏感））`)
      }
    }
  }

  // ⑨ dist 残留扫（.AppImage ∥ .deb 名携非源版本 ⇒ 红——扩现行 guard）
  try {
    for (const name of readdirSync(distDir)) {
      const match = /^ThinCoder-Setup-(.+)\.(AppImage|deb)$/i.exec(name)
      if (match && match[1] !== sourceVersion) failures.push(`版本不匹配：dist 含 ${name}（源版本 ${sourceVersion}）——旧构建残留，清 dist 重跑 package（§2.11.3⑨）`)
    }
  } catch { /* dist 不可列——上方断言已逐条报 */ }

  for (const failure of failures) console.error(`✖ ${failure}`)
  if (failures.length > 0) return false
  console.log(`✔ dist check passed: ${distDir}（Linux 臂断言 9 条）`)
  return true
}
