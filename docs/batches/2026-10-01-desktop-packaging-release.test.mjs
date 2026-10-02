/**
 * 2026-10-01-desktop-packaging-release.test.mjs — 桌面打包发布批（阶段一）批内件。
 * 五面腿（随批留存 · 不进仓套件——复跑 `node --test docs/batches/2026-10-01-desktop-packaging-release.test.mjs`）：
 *   L1 物化规划（`scripts/materialize-deps.mjs` 纯函数 + 负控）
 *   L2 图标编码（`scripts/make-icon.mjs`——ICO 容器 ∥ PNG chunk ∥ 确定性 ∥ 负控）
 *   L3 check-dist 断言（fixture 树 + 负控缺件判红——子进程走真实 CLI，收 exit code）
 *   L4 签名 hook 纯函数（`scripts/win-sign.mjs`——探测 ∥ 载体二择 ∥ 命令构造；**不跑签名路径**）
 *   L5 配置契约（`electron-builder.yml` §5.1 逐值 + electron-builder scheme 真校验）
 *   （**2026-10-03 桌面发布·阶段二批 · 父侧随正·可 revert**：L3 fixture 补更新面两件〔latest.yml ∥ app-update.yml〕
 *    + 更新面负控一腿〔check-dist +4 断言 = `PACKAGING.md` §2.8.2〕∥ L5 `publish` 断言 ⇒ provider 契约。）
 * fixture 落 `.thincoder/tmp/`（跑完自清理）；单源 = `docs/desktop/design/PROJECT.md` §5 ∥ 批档 §2.3。
 */
import { strict as assert } from "node:assert"
import { spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import { existsSync, mkdirSync, readFileSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from "node:fs"
import { createRequire } from "node:module"
import { dirname, join, resolve } from "node:path"
import test, { after } from "node:test"
import { fileURLToPath, pathToFileURL } from "node:url"
import { crc32 as zlibCrc32 } from "node:zlib"

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = resolve(HERE, "..", "..")
const DESKTOP = join(REPO, "thincoder-desktop")
const TMP = join(REPO, ".thincoder", "tmp", "2026-10-01-desktop-packaging-release.fixtures")

const load = (rel) => import(pathToFileURL(join(DESKTOP, rel)).href)
const materialize = await load("scripts/materialize-deps.mjs")
const icon = await load("scripts/make-icon.mjs")
const winSign = await load("scripts/win-sign.mjs")

const sourceVersion = JSON.parse(readFileSync(join(DESKTOP, "package.json"), "utf8")).version
const INSTALLER_NAME = `ThinCoder-Setup-${sourceVersion}.exe`

after(() => rmSync(TMP, { recursive: true, force: true }))

function freshDir(name) {
  const dir = join(TMP, name)
  rmSync(dir, { recursive: true, force: true })
  mkdirSync(dir, { recursive: true })
  return dir
}

// ── L1 物化规划 ──────────────────────────────────────────────────────────────

test("L1 物化 · 计划：两核包 ∥ 源 = 兄弟源树 ∥ 目标 = node_modules/@thincoder/<名>", () => {
  const plan = materialize.planMaterialize(DESKTOP)
  assert.deepEqual(plan.map((entry) => entry.name), ["@thincoder/core", "@thincoder/render-core"])
  assert.equal(plan[0].source, join(REPO, "thincoder-core"))
  assert.equal(plan[1].source, join(REPO, "thincoder-render-core"))
  assert.equal(plan[0].target, join(DESKTOP, "node_modules", "@thincoder", "core"))
  assert.equal(plan[1].target, join(DESKTOP, "node_modules", "@thincoder", "render-core"))
  assert.ok(plan.every((entry) => entry.sourceExists), "两核包源树在盘")
})

test("L1 物化 · 目标位四档分类 + 现盘两链可判（link（dev 链）∥ materialized（物化态））", () => {
  assert.equal(materialize.classifyTarget({ present: false }), "missing")
  assert.equal(materialize.classifyTarget({ present: true, isLink: true, isDirectory: false }), "link")
  assert.equal(materialize.classifyTarget({ present: true, isLink: false, isDirectory: true }), "materialized")
  assert.equal(materialize.classifyTarget({ present: true, isLink: false, isDirectory: false }), "foreign")
  for (const entry of materialize.planMaterialize(DESKTOP)) {
    const cls = materialize.classifyTarget(materialize.observeTarget(entry.target))
    assert.ok(["link", "materialized"].includes(cls), `现盘 ${entry.name} = ${cls}（应为 dev 链或物化真目录）`)
  }
})

test("L1 物化 · 排除面：test/** ∥ .thincoder/** 不入拷；prompts ∥ tool-docs 全量保留", () => {
  assert.deepEqual([...materialize.EXCLUDED_TOP].sort(), [".thincoder", "test"])
  assert.equal(materialize.isExcluded("test/run.mjs"), true)
  assert.equal(materialize.isExcluded(".thincoder/tmp/x.json"), true)
  assert.equal(materialize.isExcluded("prompts/persona-normal.md"), false)
  assert.equal(materialize.isExcluded("tool-docs/read.md"), false)
  assert.equal(materialize.isExcluded("agent/turn-loop.mjs"), false)
})

test("L1 物化 · 负控：落位自检四档判红 + 正路零 issue（真 junction 实证）", () => {
  const dir = freshDir("verify")
  // ① 缺位 ⇒ 判红
  const missing = { name: "@thincoder/core", target: join(dir, "missing") }
  assert.ok(materialize.verifyMaterialized(missing).some((issue) => issue.includes("落位缺位")))
  // ② 真目录但 package.json 缺位 ⇒ 判红
  const bare = { name: "@thincoder/core", target: join(dir, "bare") }
  mkdirSync(bare.target, { recursive: true })
  assert.ok(materialize.verifyMaterialized(bare).some((issue) => issue.includes("package.json 缺位")))
  // ③ 包名对账失败 ⇒ 判红
  const wrong = { name: "@thincoder/core", target: join(dir, "wrong") }
  mkdirSync(wrong.target, { recursive: true })
  writeFileSync(join(wrong.target, "package.json"), JSON.stringify({ name: "@thincoder/nope" }))
  assert.ok(materialize.verifyMaterialized(wrong).some((issue) => issue.includes("包名对账失败")))
  // ④ 真身是链（未物化）⇒ 判红；摘链不递归进链内（目标原封）
  const real = join(dir, "real")
  mkdirSync(real, { recursive: true })
  writeFileSync(join(real, "package.json"), JSON.stringify({ name: "@thincoder/core" }))
  const link = { name: "@thincoder/core", target: join(dir, "link") }
  symlinkSync(real, link.target, process.platform === "win32" ? "junction" : "dir")
  assert.equal(materialize.classifyTarget(materialize.observeTarget(link.target)), "link")
  assert.ok(materialize.verifyMaterialized(link).some((issue) => issue.includes("仍是链接")))
  unlinkSync(link.target)
  assert.ok(existsSync(join(real, "package.json")), "摘链不动目标内容")
  // ⑤ 正路：真身 + 包名逐字 ⇒ 零 issue
  assert.deepEqual(materialize.verifyMaterialized({ name: "@thincoder/core", target: real }), [])
})

test("L1 物化 · 往返腿（fixture 根——真 junction ⇒ 实拷 ∥ 排除面 ∥ 源树零损）", () => {
  const root = freshDir(join("roundtrip", "thincoder-desktop"))
  const sources = { "thincoder-core": "@thincoder/core", "thincoder-render-core": "@thincoder/render-core" }
  for (const [dir, name] of Object.entries(sources)) {
    const src = join(root, "..", dir)
    for (const sub of ["test", ".thincoder", "prompts"]) mkdirSync(join(src, sub), { recursive: true })
    writeFileSync(join(src, "package.json"), JSON.stringify({ name, version: "0.0.0" }))
    writeFileSync(join(src, "prompts", "a.md"), "keep\n")
    writeFileSync(join(src, "test", "t.mjs"), "excluded\n")
    writeFileSync(join(src, ".thincoder", "tmp.txt"), "excluded\n")
  }
  const target = join(root, "node_modules", "@thincoder", "core")
  mkdirSync(dirname(target), { recursive: true })
  symlinkSync(join(root, "..", "thincoder-core"), target, process.platform === "win32" ? "junction" : "dir")
  const result = materialize.materializeDeps(root, { log: () => {} })
  assert.equal(result.ok, true, JSON.stringify(result.entries.flatMap((entry) => entry.issues)))
  assert.equal(result.entries[0].action, "relinked", "链位 ⇒ 摘链 + 实拷")
  assert.equal(result.entries[1].action, "created", "缺位 ⇒ 新建")
  assert.equal(materialize.classifyTarget(materialize.observeTarget(target)), "materialized")
  assert.ok(existsSync(join(target, "prompts", "a.md")), "实拷内容在位")
  assert.ok(!existsSync(join(target, "test")), "test/** 不入拷")
  assert.ok(!existsSync(join(target, ".thincoder")), ".thincoder/** 不入拷")
  assert.ok(existsSync(join(root, "..", "thincoder-core", "test", "t.mjs")), "源树零损（摘链不递归进链内）")
  assert.ok(existsSync(join(root, "..", "thincoder-core", "prompts", "a.md")), "源树内容零损")
})

// ── L2 图标编码 ──────────────────────────────────────────────────────────────

test("L2 图标 · ICO 头 + 4 entries（16/32/48/256）+ 逐件 PNG（IHDR 尺寸 = 目录尺寸）", () => {
  const ico = icon.buildIcon()
  assert.equal(ico.subarray(0, 4).toString("hex"), "00000100", "ICONDIR（reserved=0 ∥ type=1）")
  assert.equal(ico.readUInt16LE(4), 4, "4 entries")
  const sizes = []
  for (let index = 0; index < 4; index++) {
    const at = 6 + 16 * index
    const width = ico.readUInt8(at)
    const height = ico.readUInt8(at + 1)
    sizes.push(width === 0 ? 256 : width)
    assert.equal(width, height, "方图（宽 = 高）")
    assert.equal(ico.readUInt16LE(at + 4), 1, "planes = 1")
    assert.equal(ico.readUInt16LE(at + 6), 32, "bitCount = 32")
    const length = ico.readUInt32LE(at + 8)
    const offset = ico.readUInt32LE(at + 12)
    assert.ok(offset + length <= ico.length, "目录偏移 ∥ 长度在档内")
    const png = ico.subarray(offset, offset + length)
    assert.equal(png.subarray(0, 8).toString("hex"), "89504e470d0a1a0a", "件 = PNG（Vista+ 形态）")
    assert.equal(png.readUInt32BE(16), sizes[index], "IHDR 宽 = 目录尺寸")
    assert.equal(png.readUInt32BE(20), sizes[index], "IHDR 高 = 目录尺寸")
  }
  assert.deepEqual(sizes, icon.SIZES)
})

test("L2 图标 · 确定性复跑字节一致 + PNG chunk 链（CRC 与 zlib 交叉校验）", () => {
  const first = icon.buildIcon()
  const second = icon.buildIcon()
  assert.ok(first.equals(second), "同入参恒同字节（复跑一致）")
  const png = icon.encodePng(icon.renderIcon(16), 16)
  let at = 8
  const types = []
  while (at < png.length) {
    const length = png.readUInt32BE(at)
    const type = png.subarray(at + 4, at + 8).toString("latin1")
    const payload = png.subarray(at + 8, at + 8 + length)
    const crc = png.readUInt32BE(at + 8 + length)
    types.push(type)
    assert.equal(icon.crc32(Buffer.concat([Buffer.from(type, "latin1"), payload])), crc, `${type} CRC（自实现）`)
    assert.equal(zlibCrc32(Buffer.concat([Buffer.from(type, "latin1"), payload])), crc, `${type} CRC（zlib 交叉）`)
    at += 12 + length
  }
  assert.equal(at, png.length, "chunk 链严丝合缝（无尾随字节）")
  assert.deepEqual(types, ["IHDR", "IDAT", "IEND"])
})

test("L2 图标 · 负控：截断档可判（末件越界）+ 品牌色 ∥ 圆角外透明抽样", () => {
  const ico = icon.buildIcon()
  const cut = ico.subarray(0, ico.length - 1)
  const lastAt = 6 + 16 * 3
  assert.ok(ico.readUInt32LE(lastAt + 12) + ico.readUInt32LE(lastAt + 8) > cut.length, "末件越界（截断可判）")
  const rgba = icon.renderIcon(64)
  const pixel = (x, y) => [...rgba.subarray((y * 64 + x) * 4, (y * 64 + x) * 4 + 4)]
  assert.equal(pixel(0, 0)[3], 0, "圆角外透明")
  assert.deepEqual(pixel(32, 3), [0x25, 0x63, 0xeb, 255], "近上边中点 = 品牌蓝（#2563eb）")
})

// ── L3 check-dist 断言（fixture 树 + 负控） ────────────────────────────────────

/** 伪造 asar（**真实形**——pickle 头 + JSON 目录 + 对齐填充 + 载荷；定标 = 2026-10-01 真产物 `app.asar` 实读：
 *  [4B=4][4B=头段字节数 N][4B=4+L+pad][4B=L][JSON][pad][载荷]；载荷起 = 8 + N，条目 offset 为**相对载荷起**位）。 */
function buildAsar(entries) {
  const root = { files: {} }
  const leaves = []
  for (const [rel, buf] of entries) {
    const segments = rel.split("/")
    let node = root
    for (const segment of segments.slice(0, -1)) {
      node.files[segment] ??= { files: {} }
      node = node.files[segment]
    }
    const leaf = { size: buf.length, offset: 0 }
    node.files[segments.at(-1)] = leaf
    leaves.push({ leaf, buf })
  }
  let json = JSON.stringify(root)
  for (let round = 0; round < 8; round++) {
    let offset = 0 // 相对载荷起
    for (const { leaf, buf } of leaves) {
      leaf.offset = offset
      offset += buf.length
    }
    const next = JSON.stringify(root)
    if (next === json) break
    json = next
  }
  const jsonBuf = Buffer.from(json, "utf8")
  const padJ = (4 - ((16 + jsonBuf.length) % 4)) % 4
  let expect = 0
  for (const { leaf, buf } of leaves) {
    assert.equal(leaf.offset, expect, "伪造 asar：偏移自洽（JSON 长度已收敛——相对载荷起）")
    expect += buf.length
  }
  const payload = Buffer.concat(leaves.map((entry) => entry.buf))
  const head = Buffer.alloc(16)
  head.writeUInt32LE(4, 0)
  head.writeUInt32LE(8 + jsonBuf.length + padJ, 4)
  head.writeUInt32LE(4 + jsonBuf.length + padJ, 8)
  head.writeUInt32LE(jsonBuf.length, 12)
  return Buffer.concat([head, jsonBuf, Buffer.alloc(padJ), payload])
}

/** 伪造最小 PE（PE32+：仅 DOS ∥ COFF ∥ 可选头数据目录[4] 有意义——证书表 Size 入参）。 */
function buildPe(certSize) {
  const buf = Buffer.alloc(1024)
  buf.writeUInt16LE(0x5a4d, 0)
  buf.writeUInt32LE(0x80, 0x3c)
  buf.writeUInt32LE(0x00004550, 0x80)
  buf.writeUInt16LE(0x20b, 0x80 + 24)
  buf.writeUInt32LE(certSize, 0x80 + 24 + 112 + 4 * 8 + 4)
  return buf
}

const ASAR_ENTRIES = () => [
  ["node_modules/@thincoder/core/package.json", readFileSync(join(REPO, "thincoder-core", "package.json"))],
  ["node_modules/@thincoder/render-core/package.json", readFileSync(join(REPO, "thincoder-render-core", "package.json"))],
  ["src/preload/preload.cjs", Buffer.from("// fixture\n")],
  ["renderer/index.html", Buffer.from("<!doctype html>\n")],
]

function buildDistFixture(name, { installer = true, certSize = 0, entries = ASAR_ENTRIES(), extras = [], updateFace = true } = {}) {
  const dir = freshDir(name)
  const resources = join(dir, "win-unpacked", "resources")
  mkdirSync(resources, { recursive: true })
  writeFileSync(join(resources, "app.asar"), buildAsar(entries))
  if (installer) {
    const installerBuf = buildPe(certSize)
    writeFileSync(join(dir, INSTALLER_NAME), installerBuf)
    if (updateFace) {
      // 更新面两件（check-dist +4 断言 · §2.8.2）：latest.yml（dist 根）+ app-update.yml（随包）；sha512 自实算同源。
      const sha = createHash("sha512").update(installerBuf).digest("base64")
      writeFileSync(join(dir, "latest.yml"), [
        `version: ${sourceVersion}`,
        "files:",
        `  - url: ${INSTALLER_NAME}`,
        `    sha512: ${sha}`,
        `    size: ${installerBuf.length}`,
        `path: ${INSTALLER_NAME}`,
        `sha512: ${sha}`,
        "releaseDate: '2026-10-01T00:00:00.000Z'",
        "",
      ].join("\n"))
      writeFileSync(join(resources, "app-update.yml"), [
        "provider: generic",
        "url: https://thincoder.com/downloads/",
        "updaterCacheDirName: thincoder-desktop-updater",
        "",
      ].join("\n"))
    }
  }
  for (const extra of extras) writeFileSync(join(dir, extra), buildPe(0))
  return dir
}

function runCheckDist(distDir) {
  return spawnSync(process.execPath, [join(DESKTOP, "scripts", "check-dist.mjs"), distDir], { encoding: "utf8" })
}

test("L3 check-dist · 正路径：全件齐 + 已签信息行（exit 0 · 不闸）", () => {
  const result = runCheckDist(buildDistFixture("dist-ok-signed", { certSize: 4096 }))
  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /dist check passed/)
  assert.match(result.stdout, /签名态：已签/)
  assert.doesNotMatch(result.stderr, /✖/)
})

test("L3 check-dist · 未签信息行不闸（exit 0）", () => {
  const result = runCheckDist(buildDistFixture("dist-ok-unsigned", { certSize: 0 }))
  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /签名态：未签/)
})

test("L3 check-dist · 负控：安装包缺件判红 + 明示（exit 1 · fail-closed）", () => {
  const result = runCheckDist(buildDistFixture("dist-no-installer", { installer: false }))
  assert.equal(result.status, 1)
  assert.match(result.stderr, /missing artifact: ThinCoder-Setup-/)
  assert.match(result.stderr, /安装包/)
})

test("L3 check-dist · 负控：渲染面 asar 条目缺 ⇒ 判红（exit 1）", () => {
  const entries = ASAR_ENTRIES().filter(([rel]) => rel !== "renderer/index.html")
  const result = runCheckDist(buildDistFixture("dist-no-renderer", { entries }))
  assert.equal(result.status, 1)
  assert.match(result.stderr, /missing asar entry: .*renderer\/index\.html/)
})

test("L3 check-dist · 负控：旧构建残留（版本不匹配）判红（exit 1）", () => {
  const result = runCheckDist(buildDistFixture("dist-stale", { extras: ["ThinCoder-Setup-0.0.1.exe"] }))
  assert.equal(result.status, 1)
  assert.match(result.stderr, /版本不匹配：dist 含 ThinCoder-Setup-0\.0\.1\.exe/)
})

test("L3 check-dist · 负控：更新面缺件（latest.yml ∥ app-update.yml 无）判红（exit 1 · fail-closed——§2.8.2）", () => {
  const result = runCheckDist(buildDistFixture("dist-no-update-face", { updateFace: false }))
  assert.equal(result.status, 1)
  assert.match(result.stderr, /missing artifact: latest\.yml/)
  assert.match(result.stderr, /missing artifact: .*app-update\.yml/)
})

test("L3 check-dist · 负控：dist 缺位判红（exit 1 · 明示）", () => {
  const result = runCheckDist(join(TMP, "dist-absent"))
  assert.equal(result.status, 1)
  assert.match(result.stderr, /dist not found/)
})

// ── L5 配置契约（electron-builder.yml——§5.1 逐值 + electron-builder 真 scheme 校验） ─

const requireDesktop = createRequire(join(DESKTOP, "package.json"))
const yaml = requireDesktop("js-yaml")
const { validateSchema } = requireDesktop("app-builder-lib/out/util/config/schemaValidator.js")
const builderScheme = requireDesktop("app-builder-lib/scheme.json")
const builderConfig = yaml.load(readFileSync(join(DESKTOP, "electron-builder.yml"), "utf8"))

test("L5 配置 · §5.1 逐值照抄（appId ∥ productName ∥ nsis x64 ∥ icon ∥ sign hook ∥ files 白名单 ∥ NSIS 四参）", () => {
  assert.equal(builderConfig.appId, "com.thincoder.desktop")
  assert.equal(builderConfig.productName, "ThinCoder")
  assert.deepEqual(builderConfig.directories, { output: "dist" })
  assert.deepEqual(builderConfig.files, ["src/**", "renderer/**", "package.json"])
  assert.equal(builderConfig.asar, true)
  assert.deepEqual(builderConfig.win.target, [{ target: "nsis", arch: ["x64"] }])
  assert.equal(builderConfig.win.icon, "build/icon.ico")
  assert.equal(builderConfig.win.signtoolOptions.sign, "scripts/win-sign.mjs")
  assert.ok(existsSync(join(DESKTOP, builderConfig.win.signtoolOptions.sign)), "hook 档在包根相对位（resolveFunction 解析基数 = cwd = 包根）")
  assert.deepEqual(builderConfig.win.signtoolOptions.signingHashAlgorithms, ["sha256"], "单算法显式（v26 缺省 = sha1 + sha256 ⇒ hook 每文件被调两轮）——§5.1")
  assert.deepEqual(builderConfig.publish, { provider: "generic", url: "https://thincoder.com/downloads/" }, "provider 契约（generic——桌面发布·阶段二批 §2.1；构建生成 latest.yml ∥ app-update.yml，上传恒走站点小件 §2.8.3）")
  assert.equal(builderConfig.nsis.oneClick, false)
  assert.equal(builderConfig.nsis.perMachine, false)
  assert.equal(builderConfig.nsis.allowToChangeInstallationDirectory, true)
  assert.equal(builderConfig.nsis.deleteAppDataOnUninstall, false)
  assert.equal(builderConfig.artifactName, "ThinCoder-Setup-${version}.${ext}")
})

test("L5 配置 · 产物名同式（yml ⇒ 代入源版本 = check-dist 断言名）+ scheme 校验过（v26.15.3 真验证器）", () => {
  const name = builderConfig.artifactName.replace("${version}", sourceVersion).replace("${ext}", "exe")
  assert.equal(name, INSTALLER_NAME, "artifactName 代入源版本 ⇒ check-dist 期望名")
  assert.doesNotThrow(() => validateSchema(builderScheme, builderConfig), "electron-builder scheme 校验")
})

// ── L4 签名 hook 纯函数（不跑签名路径——证书事务 = 构建窗） ─────────────────────

test("L4 签名 · 具名导出 sign（electron-builder 契约）+ 探测命令含指纹 ∥ 两证书库", () => {
  assert.equal(typeof winSign.sign, "function", "hook = 具名导出 sign（resolveFunction name='sign'）")
  const probe = winSign.probeCommand()
  assert.equal(probe.command, "powershell.exe")
  assert.ok(probe.script.includes(winSign.CERT_THUMBPRINT))
  assert.ok(probe.script.includes("Cert:\\CurrentUser\\My"))
  assert.ok(probe.script.includes("Cert:\\LocalMachine\\My"))
})

test("L4 签名 · 探测输出解析：在位（大小写折叠）∥ `MISSING` ∥ 空 ∥ null", () => {
  assert.equal(winSign.parseProbeOutput(winSign.CERT_THUMBPRINT), true)
  assert.equal(winSign.parseProbeOutput(winSign.CERT_THUMBPRINT.toLowerCase()), true)
  assert.equal(winSign.parseProbeOutput("MISSING"), false)
  assert.equal(winSign.parseProbeOutput(""), false)
  assert.equal(winSign.parseProbeOutput(null), false)
})

test("L4 签名 · 载体二择序：主 PowerShell ∥ 备 signtool ∥ 皆不可得 ⇒ 跳过（null）", () => {
  assert.equal(winSign.chooseCarrier({ powershellAvailable: true, signtoolAvailable: false }), "powershell")
  assert.equal(winSign.chooseCarrier({ powershellAvailable: true, signtoolAvailable: true }), "powershell")
  assert.equal(winSign.chooseCarrier({ powershellAvailable: false, signtoolAvailable: true }), "signtool")
  assert.equal(winSign.chooseCarrier({ powershellAvailable: false, signtoolAvailable: false }), null)
})

test("L4 签名 · 命令构造两载体（指纹 + 文件 + RFC3161 取时端点）+ 载体② 定位序", () => {
  const file = "D:\\build\\win-unpacked\\ThinCoder.exe"
  const psScript = winSign.buildPowerShellSign({ file }).script
  assert.ok(psScript.includes("Set-AuthenticodeSignature"))
  assert.ok(psScript.includes(" -HashAlgorithm SHA256"))
  assert.ok(psScript.includes(winSign.CERT_THUMBPRINT))
  assert.ok(psScript.includes(winSign.RFC3161_URL))
  assert.ok(psScript.includes(file))
  const signtool = winSign.buildSigntoolSign({ file })
  assert.deepEqual(signtool.args, ["sign", "/sha1", winSign.CERT_THUMBPRINT, "/fd", "sha256", "/tr", winSign.RFC3161_URL, "/td", "sha256", file])
  assert.match(winSign.RFC3161_URL, /^http:\/\/timestamp\.globalsign\.com\/tsa\//)
  assert.equal(winSign.pickSigntool({ whereOutput: "C:\\sdk\\signtool.exe\r\n", kitsMatches: ["C:\\kits\\signtool.exe"] }), "C:\\sdk\\signtool.exe")
  assert.equal(winSign.pickSigntool({ whereOutput: "", kitsMatches: ["C:\\kits\\signtool.exe"] }), "C:\\kits\\signtool.exe")
  assert.equal(winSign.pickSigntool({ whereOutput: "", kitsMatches: [] }), null)
})
