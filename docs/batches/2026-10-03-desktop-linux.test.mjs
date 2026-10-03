/**
 * 2026-10-03-desktop-linux.test.mjs — 批内件（桌面 Linux 产物批 · 台账 #847 · 实施轮）。
 * 判据表 = 批档 `docs/batches/2026-10-03-desktop-linux.md` §2；设计单源 = `docs/desktop/design/PACKAGING.md`
 * §1 **KD-73** ∥ §2.11（2.11.1–2.11.6）。
 *
 * 面（只测本批改动面 —— 平 node：二进制 ∥ 契约档 ∥ 纯谓词 ∥ 源扫，零 electron）：
 *   腿 ① 图标帧断言（`build/icon.png` ≡ `build/icon.ico` 第 4 帧字节切片 ∥ sha256——§2.11.2（c））；
 *   腿 ② yml linux/deb 契约（两目标 × x64 ∥ `linux.icon` ∥ `category` ∥ `syncDesktopName` ∥ `deb.publish: null`）
 *        + win ∥ 总闸零回归（§2.11.2（a））；
 *   腿 ③ package.json 三键（`homepage` ∥ `author` ∥ `desktopName`——用户定值逐字；§2.11.2（b））；
 *   腿 ④ `updaterMediumOk` 真值表（四象限）+ 未武装态点按零效果（deb 径）+ 装配面注入合项源扫（§2.11.4）；
 *   腿 ⑤ check-dist 分臂源扫（`runLinuxChecks` ∥ §2.11.3①–⑨ 各注 ∥ `process.platform` 分臂 ∥ 余平台非零出口
 *        「无断言臂」∥ win 臂零动；§2.11.3）。
 * 本件不进仓套件（批内件 · 随批留存）；跑法（仓根）：
 *   node --test docs/batches/2026-10-03-desktop-linux.test.mjs
 */
import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { createHash } from "node:crypto"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"

const ROOT = new URL("../../", import.meta.url) // 仓根 = 本档上两级（thincoder/）
const rel = (p) => fileURLToPath(new URL(p, ROOT))
const src = (p) => readFileSync(rel(p), "utf8")

const requireUpdater = createRequire(rel("thincoder-desktop/node_modules/electron-updater/package.json"))
let jsYaml
try {
  jsYaml = requireUpdater("js-yaml") // 解析走库自身解析链（传递依赖——非本仓声明面）
} catch (error) {
  // 可读失败（而非裸 MODULE_NOT_FOUND）：显式所需前置面（electron-updater 依赖链若变动 ⇒ 此处点名）
  throw new Error(`批内件需经 electron-updater 依赖链取 js-yaml（thincoder-desktop 安装面缺失？）：${error?.message ?? error}`)
}

const update = await import(new URL("thincoder-desktop/src/main/update.mjs", ROOT))

// ── 腿 ① 图标帧断言（§2.11.2（c）：PNG ≡ ICO 第 4 帧——零转换字节切片） ──────────

test("腿① 图标帧：icon.ico 四帧链 ∥ icon.png ≡ 第 4 帧（256×256 · offset 1279 · 2872 B）逐字节 ∥ sha256 定值", () => {
  const ico = readFileSync(rel("thincoder-desktop/build/icon.ico"))
  const png = readFileSync(rel("thincoder-desktop/build/icon.png"))
  assert.equal(ico.readUInt16LE(0), 0, "ICONDIR reserved = 0")
  assert.equal(ico.readUInt16LE(2), 1, "type = 1（ICO）")
  assert.equal(ico.readUInt16LE(4), 4, "帧数 = 4")
  // 四帧链自洽（16 ∥ 32 ∥ 48 ∥ 256——offset 递推至文件尾）
  const frames = []
  for (let i = 0; i < 4; i += 1) {
    const entry = 6 + i * 16
    frames.push({
      w: ico[entry] === 0 ? 256 : ico[entry],
      h: ico[entry + 1] === 0 ? 256 : ico[entry + 1],
      size: ico.readUInt32LE(entry + 8),
      offset: ico.readUInt32LE(entry + 12),
    })
  }
  assert.deepEqual(frames.map((f) => [f.w, f.h]), [[16, 16], [32, 32], [48, 48], [256, 256]], "四帧尺寸 = 16 ∥ 32 ∥ 48 ∥ 256")
  for (let i = 1; i < 4; i += 1) {
    assert.equal(frames[i].offset, frames[i - 1].offset + frames[i - 1].size, `第 ${i + 1} 帧 offset = 前帧尾（链自洽）`)
  }
  const last = frames[3]
  assert.equal(last.size, 2872, "第 4 帧 size = 2872")
  assert.equal(last.offset, 1279, "第 4 帧 offset = 1279")
  assert.equal(last.offset + last.size, ico.length, "第 4 帧尾 = ICO 文件尾")
  // PNG ≡ 切片（零转换——漂移检测）
  assert.equal(png.length, last.size, "icon.png 长 = 帧长（纯字节切片——无容器头）")
  assert.equal(Buffer.compare(png, ico.subarray(last.offset, last.offset + last.size)), 0, "逐字节相等（icon.png ≡ ICO 第 4 帧）")
  assert.equal(png.subarray(0, 8).toString("hex"), "89504e470d0a1a0a", "PNG 魔数")
  assert.equal(png.subarray(-8).toString("hex"), "49454e44ae426082", "IEND 尾")
  assert.equal(
    createHash("sha256").update(png).digest("hex"),
    "08fe76b9466cf60a440c4215e98bb2f9adf5d6f87e6eaffd9616affe8408b57d",
    "sha256 = 设计档定值（§2.11.2（c））",
  )
})

// ── 腿 ② yml linux/deb 契约（§2.11.2（a））+ win ∥ 总闸零回归 ────────────────────

test("腿② yml 契约：linux 两目标 × x64 ∥ icon/category/syncDesktopName ∥ deb.publish null；win ∥ publish 面零回归", () => {
  const config = jsYaml.load(src("thincoder-desktop/electron-builder.yml"))
  assert.deepEqual(
    config.linux.target,
    [{ target: "AppImage", arch: ["x64"] }, { target: "deb", arch: ["x64"] }],
    "两目标 × x64（AppImage 列前——async 面先于非 async 面执行）",
  )
  assert.equal(config.linux.icon, "build/icon.png", "linux.icon 显式（Linux 拒 .ico——PNG 入库）")
  assert.equal(config.linux.category, "Development", "category = freedesktop 主类（消缺省 Utility 警告）")
  assert.equal(config.linux.syncDesktopName, true, "syncDesktopName（.desktop 名 ∥ StartupWMClass ∥ app_id 同源）")
  assert.deepEqual(config.deb, { publish: null }, "deb.publish = null（feed 分流键——官方「don't publish」形）")
  // win 面零回归
  assert.deepEqual(config.win.target, [{ target: "nsis", arch: ["x64"] }], "win.target 零动")
  assert.equal(config.win.icon, "build/icon.ico", "win.icon 零动")
  assert.deepEqual(config.publish, { provider: "generic", url: "https://thincoder.com/downloads/" }, "总闸 publish = generic 契约（已落笔——勿覆写）")
  assert.equal(config.artifactName, "ThinCoder-Setup-${version}.${ext}", "artifactName 承全局模板（零动）")
  assert.deepEqual(
    config.nsis,
    { oneClick: false, perMachine: false, allowToChangeInstallationDirectory: true, deleteAppDataOnUninstall: false },
    "nsis 四参零动",
  )
  // 结构面 ∥ 签名面零回归（审计 F4 补全——win 面全键采样）
  assert.equal(config.asar, true, "asar 缺省显式零动")
  assert.deepEqual(config.directories, { output: "dist" }, "产物落点零动")
  assert.deepEqual(config.files, ["src/**", "renderer/**", "package.json"], "files 白名单零动")
  assert.equal(config.win.signtoolOptions.sign, "scripts/win-sign.mjs", "签名 hook 零动")
  assert.deepEqual(config.win.signtoolOptions.signingHashAlgorithms, ["sha256"], "签名单算法零动")
  assert.equal(config.appId, "com.thincoder.desktop", "appId 零动")
  assert.equal(config.productName, "ThinCoder", "productName 零动")
})

// ── 腿 ③ package.json 三键（§2.11.2（b）——用户定值） ────────────────────────────

test("腿③ package.json 三键：homepage ∥ author ∥ desktopName（逐字）+ Maintainer 派生形", () => {
  const pkg = JSON.parse(src("thincoder-desktop/package.json"))
  assert.equal(pkg.homepage, "https://thincoder.com", "homepage = 用户定值（fpm 硬前置——deb Homepage 字段源）")
  assert.equal(pkg.author, "liwei <liwei@thincoder.com> (上海新舶)", "author = 用户定值（fpm 硬前置——author.email）")
  assert.equal(pkg.desktopName, "thincoder.desktop", "desktopName = 用户定值（窗口关联——与 linux.syncDesktopName 成对）")
  // Maintainer 派生（company 后缀不入派生）：liwei <liwei@thincoder.com>
  const email = /<(.+?)>/.exec(pkg.author)?.[1]
  const name = pkg.author.split(" <")[0]
  assert.equal(`${name} <${email}>`, "liwei <liwei@thincoder.com>", "deb Maintainer 派生形")
})

// ── 腿 ④ updaterMediumOk 真值表 + 未武装态点按零效果 + 装配注入源扫（§2.11.4） ──

test("腿④ 门真值表：linux×无APPIMAGE=false ∥ linux×有APPIMAGE=true ∥ win32×任意=true（四象限）；未武装点按零效果；装配注入合项在册", async () => {
  assert.equal(typeof update.updaterMediumOk, "function", "纯谓词导出在册")
  assert.equal(update.updaterMediumOk({ platform: "linux", appImageEnv: null }), false, "linux × 无 APPIMAGE ⇒ 不武装（deb ∥ 未打包运行）")
  assert.equal(update.updaterMediumOk({ platform: "linux", appImageEnv: undefined }), false, "linux × 缺键（undefined——process.env 缺键实形）⇒ 不武装")
  assert.equal(update.updaterMediumOk({ platform: "linux", appImageEnv: "/tmp/ThinCoder-Setup-0.10.2.AppImage" }), true, "linux × 有 APPIMAGE ⇒ 武装（AppImage 运行径）")
  assert.equal(update.updaterMediumOk({ platform: "win32", appImageEnv: null }), true, "win32 × 无 ⇒ 武装")
  assert.equal(update.updaterMediumOk({ platform: "win32", appImageEnv: "/tmp/x.AppImage" }), true, "win32 × 有 ⇒ 武装（win32 恒真）")
  // 未武装态（deb 径实形——enabled=false）：点按零效果（silent return + stderr 一行——无代码改动，行为核对）
  const logLines = []
  const face = update.createUpdateFace({ enabled: false, log: (line) => logLines.push(line) })
  assert.equal(face.currentState(), "idle", "初始 idle")
  await face.menuClick()
  assert.equal(face.currentState(), "idle", "未武装 ⇒ 状态零动（零自检 ∥ 零网络 ∥ 零状态机）")
  assert.ok(logLines.some((line) => line.includes("not armed")), "点按 = silent return + stderr 一行（fail-soft 同款）")
  // 装配面源扫（注入合项——§2.11.4）
  const main = src("thincoder-desktop/src/main/main.mjs")
  assert.match(main, /enabled: app\.isPackaged && !SMOKE && updaterMediumOk\(/, "武装门三合项 = isPackaged ∧ 非 --smoke ∧ 介质合项")
  assert.match(main, /updaterMediumOk\(\{ platform: process\.platform, appImageEnv: process\.env\.APPIMAGE \}\)/, "注入实参形 = { platform: process.platform, appImageEnv: process.env.APPIMAGE }")
})

// ── 腿 ⑤ check-dist 分臂源扫（§2.11.3——断言对象 = 现档 `scripts/check-dist.mjs`） ──

test("腿⑤ check-dist 分臂源扫：runLinuxChecks ∥ §2.11.3①–⑨ 各注 ∥ process.platform 分臂 ∥ 余平台非零出口「无断言臂」∥ win 臂零动", () => {
  const checkDist = src("thincoder-desktop/scripts/check-dist.mjs")
  // 分臂与出口
  assert.match(checkDist, /if \(process\.platform === "linux"\) \{/, "linux 分臂在册")
  assert.match(checkDist, /process\.exit\(runLinuxChecks\(\) \? 0 : 1\)/, "linux 臂：结果驱动 0/1 出口")
  assert.match(checkDist, /if \(process\.platform !== "win32"\) \{/, "余平台分臂在册")
  assert.match(checkDist, /无断言臂：platform = \$\{process\.platform\}/, "余平台明示「无断言臂」")
  assert.match(checkDist, /fail-closed——零静默[\s\S]{0,200}process\.exit\(1\)/, "余平台非零退出（零静默——fail-closed）")
  // Linux 臂函数 ∥ 头注 ∥ 断言注 ①–⑨
  assert.match(checkDist, /function runLinuxChecks\(\)/, "runLinuxChecks 定义在册")
  assert.match(checkDist, /Linux 臂 \+9/, "头注：Linux 臂 +9 在册")
  for (const marker of ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨"]) {
    assert.ok(checkDist.includes(`§2.11.3${marker}`), `断言注在册：§2.11.3${marker}`)
  }
  // Linux 臂关键断言面（名形 × 源版本 ∥ feed 分流 ∥ 残留扫）
  assert.match(checkDist, /ThinCoder-Setup-\$\{sourceVersion\}\.AppImage/, "AppImage 名形 × 源版本（⑤）")
  assert.match(checkDist, /ThinCoder-Setup-\$\{sourceVersion\}\.deb/, "deb 名形 × 源版本（⑥）")
  assert.match(checkDist, /latest-linux\.yml/, "latest-linux.yml 读面（⑧）")
  assert.match(checkDist, /files 条目数 ≠ 1/, "feed 分流判据：files 恰一条（⑧）")
  assert.match(checkDist, /携带 \.deb 条目/, "feed 分流判据：全条目不携 .deb（⑧）")
  // win 臂零动（同名形 ∥ 更新面读面 ∥ 签名态读数）
  assert.match(checkDist, /ThinCoder-Setup-\$\{sourceVersion\}\.exe/, "win 臂安装包名形零动")
  assert.match(checkDist, /win-unpacked\/resources\/app-update\.yml/, "win 臂 app-update.yml 读面零动")
  assert.match(checkDist, /peCertificateTableSize/, "win 臂签名态读数零动")
})
