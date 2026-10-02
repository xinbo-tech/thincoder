/**
 * 2026-10-02-desktop-release-stage2.test.mjs — 批内件（桌面发布·阶段二批 · 台账 #810 ∥ #826 · 实施轮）。
 * 判据表 = 批档 `docs/batches/2026-10-02-desktop-release-stage2.md` §2 ∥ 设计单源 = `docs/desktop/design/PACKAGING.md`
 * §1 **KD-71** ∥ §2.8（2.8.1–2.8.3）∥ §2.1；菜单半 = `docs/desktop/design/MENU.md` §1 **KD-65** ①/②/⑦ ∥ §3.5。
 *
 * 面（只测本批改动面 —— 平 node；策略面替身直测，菜单 ∥ 词面纯函数腿，契约 ∥ 站点脚本 ∥ 通道面源扫/实读）：
 *   腿 ① 状态机替身面（`src/main/update.mjs`——武装门 ∥ 显式落定 ∥ 延时自检一次/会话 ∥ 五态迁移 ∥ 通知一次/版本 ∥
 *        手动三果 ∥ 自动面 fail-soft 全静默 ∥ 菜单点按两径（确认 ⇒ `quitAndInstall(true, true)`）∥ 重入 busy ∥ 库未武装回转）；
 *   腿 ② 菜单映射（`src/main/app-menu.mjs`——帮助组首项 + sep；状态 ⇒ label ∥ enabled；缺 ∥ 表外 ⇒ idle）；
 *   腿 ③ 词键集（`src/main/menu-words.mjs`——键集 32 ⇒ 43（两语同集）∥ 更新面十一键 ∥ `{version}` 占位三句 ∥ en 回落）；
 *   腿 ④ yml publish 契约（`electron-builder.yml` generic ∥ `package.json` 依赖 `electron-updater ^6.8.9` + 在盘）；
 *   腿 ⑤ 站点脚本源扫（`thincoder.com/scripts/`——prune `downloads/` 豁免 ∥ `--side desktop` 臂 ∥ 上传小件键 ∥ 缓存契约）；
 *   腿 ⑥ 零新通道 + 装配面源扫（事件 24 ∥ 白名单 47 ∥ HANDLERS 闭合 ∥ 武装门装配 ∥ 通知落子）。
 * 本件不进仓套件（批内件 · 随批留存）；跑法（任意 cwd —— 路径按本档自身位置解析）：
 *   node --test docs/batches/2026-10-02-desktop-release-stage2.test.mjs
 */
import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"

const ROOT = new URL("../../", import.meta.url) // 仓根 = 本档上两级（thincoder/）
const rel = (p) => fileURLToPath(new URL(p, ROOT))
const src = (p) => readFileSync(rel(p), "utf8")

const update = await import(new URL("thincoder-desktop/src/main/update.mjs", ROOT))
const { menuTemplate } = await import(new URL("thincoder-desktop/src/main/app-menu.mjs", ROOT))
const { menuLabels } = await import(new URL("thincoder-desktop/src/main/menu-words.mjs", ROOT))

const requireUpdater = createRequire(rel("thincoder-desktop/node_modules/electron-updater/package.json"))
const jsYaml = requireUpdater("js-yaml") // 解析走库自身解析链（提升 ∥ 嵌套两态皆达——`js-yaml` = electron-updater 的传递依赖，非本仓声明面）
const requireSelf = createRequire(import.meta.url)
const preload = requireSelf(rel("thincoder-desktop/src/preload/preload.cjs"))

const flush = () => new Promise((resolve) => setImmediate(resolve))
/** 可控 promise（手动检查在途窗——事件先于结算注入）。 */
function deferred() {
  let resolve
  let reject
  const promise = new Promise((res, rej) => { resolve = res; reject = rej })
  return { promise, resolve, reject }
}

/** 更新器替身（事件发射 ∥ 调用记录 ∥ 检查结果可注入——`update.mjs` 注入缝直测；零 electron）。 */
function createUpdaterDouble({ checkImpl } = {}) {
  const handlers = new Map()
  const calls = []
  return {
    currentVersion: "0.10.1",
    autoDownload: null,
    autoInstallOnAppQuit: null,
    calls,
    on(event, handler) {
      if (!handlers.has(event)) handlers.set(event, [])
      handlers.get(event).push(handler)
    },
    emit(event, payload) { for (const handler of handlers.get(event) ?? []) handler(payload) },
    checkForUpdates() {
      calls.push("check")
      return (checkImpl ?? (() => Promise.resolve({ downloadPromise: null })))()
    },
    quitAndInstall(isSilent, isForceRunAfter) { calls.push(`quitAndInstall:${isSilent}:${isForceRunAfter}`) },
  }
}

/** 更新面替身装配（五缝 + 词表现读；定时器捕获——点火可控；对话框记录 + 确认可回）。 */
function createFaceHarness(updater, { enabled = true } = {}) {
  const log = []
  const notifications = []
  const dialogs = []
  const confirms = []
  const timers = []
  let refreshes = 0
  let confirmAnswer = false
  const face = update.createUpdateFace({
    enabled,
    updater,
    words: () => menuLabels("zh"),
    log: (line) => log.push(line),
    notify: (payload) => notifications.push(payload),
    menuRefresh: () => { refreshes += 1 },
    dialog: {
      confirmRestart: async (payload) => { confirms.push(payload); return confirmAnswer },
      result: async (payload) => { dialogs.push(payload) },
    },
    setTimer: (fn, ms) => { timers.push({ fn, ms }); return { unref() {} } },
  })
  return { face, log, notifications, dialogs, confirms, timers, refreshes: () => refreshes, setConfirmAnswer: (v) => { confirmAnswer = v } }
}

// ── 腿 ① 状态机替身面（§2.8.1） ────────────────────────────────────────────────

test("腿①-1 武装门 ∥ 显式落定 ∥ 延时自检：未武装零定时器零调用；武装 ⇒ 两旗显式 + 10s 点火一次/会话", async () => {
  const offUpdater = createUpdaterDouble()
  const off = createFaceHarness(offUpdater, { enabled: false })
  assert.equal(off.face.scheduleStartupCheck(), false, "未武装 ⇒ 不点")
  assert.equal(off.timers.length, 0, "未武装 ⇒ 零定时器")
  assert.deepEqual(await off.face.checkNow(), { ok: false, reason: "not-armed" })
  await off.face.menuClick()
  assert.deepEqual(offUpdater.calls, [], "未武装 ⇒ updater 零调用（双保险之第一道）")
  assert.equal(offUpdater.autoDownload, null, "未武装 ⇒ 零落定")
  assert.equal(offUpdater.autoInstallOnAppQuit, null)

  const onUpdater = createUpdaterDouble()
  const on = createFaceHarness(onUpdater)
  assert.equal(onUpdater.autoDownload, true, "静默下载显式落定")
  assert.equal(onUpdater.autoInstallOnAppQuit, true, "退出即安静安装显式落定")
  assert.equal(on.face.scheduleStartupCheck(), true)
  assert.equal(update.STARTUP_CHECK_DELAY_MS, 10_000)
  assert.deepEqual(on.timers.map((t) => t.ms), [10_000], "延时 10s（一次/会话）")
  assert.equal(on.face.scheduleStartupCheck(), false, "不重臂（会话期单次）")
  on.timers[0].fn()
  assert.equal(on.face.currentState(), "checking", "点火 ⇒ 检查发起")
  assert.deepEqual(onUpdater.calls, ["check"])
})

test("腿①-2 五态迁移 ∥ 通知一次/版本：idle ⇒ checking ⇒ downloading ⇒ ready；重复 downloaded ⇒ 通知唯一", () => {
  assert.deepEqual([...update.UPDATE_STATES], ["idle", "checking", "downloading", "ready"])
  const updater = createUpdaterDouble()
  const h = createFaceHarness(updater)
  assert.equal(h.face.currentState(), "idle", "初始 = idle")
  h.face.scheduleStartupCheck()
  h.timers[0].fn()
  assert.equal(h.face.currentState(), "checking")
  updater.emit("update-available", { version: "0.11.0" })
  assert.equal(h.face.currentState(), "downloading")
  updater.emit("update-downloaded", { version: "0.11.0" })
  assert.equal(h.face.currentState(), "ready")
  updater.emit("update-downloaded", { version: "0.11.0" })
  assert.equal(h.notifications.length, 1, "通知一次/版本")
  assert.equal(h.notifications[0].title, menuLabels("zh").updateDialogTitle)
  assert.ok(h.notifications[0].body.includes("0.11.0"), "通知句携版本号（`{version}` 已替换）")
  assert.ok(h.refreshes() >= 3, "三次迁移 ⇒ 菜单重建随动")
})

test("腿①-3 自动面 fail-soft：not-available ∥ error ⇒ 全静默（零对话框）+ 状态回 idle + stderr 详情行", async () => {
  const updater = createUpdaterDouble()
  const h = createFaceHarness(updater)
  await h.face.checkNow() // 自动（manual 缺省）
  assert.equal(h.face.currentState(), "checking")
  updater.emit("update-not-available", { version: "0.10.1" })
  assert.equal(h.face.currentState(), "idle", "无更新 ⇒ 回转 idle")
  assert.equal(h.dialogs.length, 0, "自动面零对话框")

  await h.face.checkNow()
  updater.emit("error", new Error("offline"))
  await flush()
  assert.equal(h.face.currentState(), "idle", "失败复位（静默回转）")
  assert.equal(h.dialogs.length, 0, "自动面 fail-soft ⇒ 零弹框")
  assert.ok(h.log.some((line) => line.includes("offline")), "stderr 详情行在")
})

test("腿①-4 手动三果：available ⇒ 转下载态（零对话框）；not-available ⇒ 「已是最新版本（v0.10.1）」；error ⇒ 「检查更新失败」+ 一行原因", async () => {
  // 果①：available ⇒ 转下载态（静默续跑）
  {
    const d = deferred()
    const updater = createUpdaterDouble({ checkImpl: () => d.promise })
    const h = createFaceHarness(updater)
    const pending = h.face.menuClick()
    assert.equal(h.face.currentState(), "checking", "菜单点按 ⇒ 手动检查发起")
    updater.emit("update-available", { version: "0.11.0" })
    assert.equal(h.face.currentState(), "downloading", "转下载态")
    d.resolve({ downloadPromise: null })
    await pending
    await flush()
    assert.equal(h.dialogs.length, 0, "available ⇒ 零对话框")
  }
  // 果②：not-available ⇒ 已是最新
  {
    const d = deferred()
    const updater = createUpdaterDouble({ checkImpl: () => d.promise })
    const h = createFaceHarness(updater)
    const pending = h.face.menuClick()
    updater.emit("update-not-available", { version: "0.10.1" })
    d.resolve({ downloadPromise: null })
    await pending
    await flush()
    assert.equal(h.dialogs.length, 1)
    assert.equal(h.dialogs[0].kind, "up-to-date")
    assert.ok(h.dialogs[0].message.includes("0.10.1"), "携当前号（v0.10.1）")
    assert.equal(h.face.currentState(), "idle")
  }
  // 果③：error ⇒ 检查更新失败 + 一行原因（库径 = 先发 error 事件再重抛——恰一次对话框）
  {
    const d = deferred()
    const updater = createUpdaterDouble({ checkImpl: () => d.promise })
    const h = createFaceHarness(updater)
    const pending = h.face.menuClick()
    updater.emit("error", new Error("offline"))
    d.reject(new Error("offline"))
    await pending
    await flush()
    assert.equal(h.dialogs.length, 1, "事件已处置——拒绝不双报")
    assert.equal(h.dialogs[0].kind, "failed")
    assert.equal(h.dialogs[0].message, menuLabels("zh").updateFailed)
    assert.equal(h.dialogs[0].detail, "offline", "一行原因")
    assert.equal(h.face.currentState(), "idle", "状态回 idle（下次可重试）")
  }
})

test("腿①-5 菜单点按：在途态 ⇒ 零动作；ready ⇒ 确认框（含 vN）⇒ quitAndInstall(true, true)；驳回 ∥ 确认框异常 ⇒ 零安装", async () => {
  // 在途（checking）⇒ 零动作（disabled 双保险）
  {
    const d = deferred()
    const updater = createUpdaterDouble({ checkImpl: () => d.promise })
    const h = createFaceHarness(updater)
    const pending = h.face.checkNow()
    await h.face.menuClick()
    assert.deepEqual(updater.calls, ["check"], "在途 ⇒ 菜单点按零动作")
    d.resolve({ downloadPromise: null })
    await pending
  }
  // ready ⇒ 确认 ⇒ 安静安装 + 装后重拉（位置参形）
  {
    const updater = createUpdaterDouble()
    const h = createFaceHarness(updater)
    await h.face.checkNow()
    updater.emit("update-available", { version: "0.11.0" })
    updater.emit("update-downloaded", { version: "0.11.0" })
    assert.equal(h.face.currentState(), "ready")
    h.setConfirmAnswer(true)
    await h.face.menuClick()
    assert.equal(h.confirms.length, 1, "确认框恰一次")
    assert.ok(h.confirms[0].message.includes("0.11.0"), "确认句携 vN")
    assert.equal(h.confirms[0].ok, menuLabels("zh").updateRestartOk)
    assert.equal(h.confirms[0].cancel, menuLabels("zh").updateRestartCancel)
    assert.ok(updater.calls.includes("quitAndInstall:true:true"), "quiet + forceRunAfter（true, true）")
  }
  // 驳回 ⇒ 零安装
  {
    const updater = createUpdaterDouble()
    const h = createFaceHarness(updater)
    await h.face.checkNow()
    updater.emit("update-downloaded", { version: "0.11.0" })
    h.setConfirmAnswer(false)
    await h.face.menuClick()
    assert.ok(!updater.calls.includes("quitAndInstall:true:true"), "驳回 ⇒ 零安装动作")
  }
  // 确认框异常 ⇒ fail-soft（零安装 ∥ 零抛）
  {
    const updater = createUpdaterDouble()
    const log = []
    const face = update.createUpdateFace({
      enabled: true,
      updater,
      words: () => menuLabels("zh"),
      log: (line) => log.push(line),
      dialog: { confirmRestart: async () => { throw new Error("dialog boom") } },
    })
    await face.checkNow()
    updater.emit("update-downloaded", { version: "0.11.0" })
    await face.menuClick()
    assert.ok(!updater.calls.includes("quitAndInstall:true:true"))
    assert.ok(log.some((line) => line.includes("dialog boom")), "对话框异常落 stderr（不静默）")
  }
})

test("腿①-6 重入 busy ∥ 库未武装（checkForUpdates 返 null）⇒ 静默回转 idle 零对话框", async () => {
  const d = deferred()
  const updater = createUpdaterDouble({ checkImpl: () => d.promise })
  const h = createFaceHarness(updater)
  const pending = h.face.checkNow()
  assert.deepEqual(await h.face.checkNow(), { ok: false, reason: "busy" })
  assert.deepEqual(await h.face.checkNow({ manual: true }), { ok: false, reason: "busy" }, "重入不换挡")
  assert.deepEqual(updater.calls, ["check"], "在途 ⇒ 单次调用（重入被挡）")
  d.resolve({ downloadPromise: null })
  await pending

  const nullUpdater = createUpdaterDouble({ checkImpl: () => Promise.resolve(null) })
  const h2 = createFaceHarness(nullUpdater)
  assert.deepEqual(await h2.face.checkNow(), { ok: false, reason: "inactive" })
  assert.equal(h2.face.currentState(), "idle", "库自身判定未武装 ⇒ 静默回转")
  assert.equal(h2.dialogs.length, 0)
  assert.ok(h2.log.some((line) => line.includes("not packaged")), "原因落 stderr")
})

// ── 腿 ② 菜单映射（§2.8.1 ∥ KD-65 ①） ─────────────────────────────────────────

test("腿② 菜单映射：帮助组首项 + sep（状态 ⇒ label ∥ enabled；缺 ∥ 表外 ⇒ idle；点按 ⇒ host(\"update\")）", () => {
  const words = menuLabels("zh")
  const hosts = []
  const menu = (state) => menuTemplate({
    words,
    update: state === null ? null : { state },
    onNative: (action) => hosts.push(action),
  })
  const cases = [
    ["idle", "检查更新…", true],
    ["checking", "正在检查更新…", false],
    ["downloading", "正在下载更新…", false],
    ["ready", "重启以安装更新", true],
  ]
  for (const [state, label, enabled] of cases) {
    const help = menu(state)[4].submenu
    assert.equal(help[0].label, label, `${state} ⇒ label`)
    assert.equal(help[0].enabled, enabled, `${state} ⇒ enabled`)
    assert.equal(help[1].type, "separator", "首项 + sep")
  }
  assert.equal(menu(null)[4].submenu[0].label, "检查更新…", "缺注入 ⇒ 回 idle（帮助组项恒在场）")
  assert.equal(menu("bogus")[4].submenu[0].label, "检查更新…", "表外状态 ⇒ 回 idle")
  menu("idle")[4].submenu[0].click()
  assert.deepEqual(hosts, ["update"], "点按 ⇒ host(\"update\")（不经通道）")
  assert.deepEqual(menu("idle").map((group) => group.label), ["文件", "编辑", "视图", "设置", "帮助"], "五组序零动")
  const help = menu("ready")[4].submenu
  assert.equal(help[2].label, "命令与快捷键…", "原两项零改")
  assert.equal(help[3].label, "关于 ThinCoder…")
})

// ── 腿 ③ 词键集（§2.8.1 词面） ────────────────────────────────────────────────

test("腿③ 词键集 32 ⇒ 43（两语同集）∥ 更新面十一键 ∥ `{version}` 占位三句 ∥ en 回落", () => {
  const zh = menuLabels("zh")
  const en = menuLabels("en")
  assert.equal(Object.keys(zh).length, 43, "键集 = 43")
  assert.deepEqual(Object.keys(zh).sort(), Object.keys(en).sort(), "两语同集")
  const UPDATE_KEYS = [
    "checkUpdate", "checkingUpdate", "downloadingUpdate", "restartUpdate",
    "updateDialogTitle", "updateNotice", "updateUpToDate", "updateFailed",
    "updateRestartConfirm", "updateRestartOk", "updateRestartCancel",
  ]
  assert.equal(UPDATE_KEYS.length, 11, "菜单四 + 对话框/通知七")
  for (const key of UPDATE_KEYS) {
    assert.equal(typeof zh[key], "string", `zh 缺键：${key}`)
    assert.equal(typeof en[key], "string", `en 缺键：${key}`)
  }
  assert.equal(zh.checkUpdate, "检查更新…")
  assert.equal(zh.restartUpdate, "重启以安装更新")
  assert.equal(zh.updateRestartOk, "重启安装")
  assert.equal(zh.updateRestartCancel, "取消")
  for (const key of ["updateNotice", "updateUpToDate", "updateRestartConfirm"]) {
    assert.ok(zh[key].includes("{version}") && en[key].includes("{version}"), `占位缺：${key}`)
  }
  assert.equal(menuLabels("xx-YY"), en, "未知语言 ⇒ en 回落（同引用）")
})

// ── 腿 ④ yml publish 契约（§2.1 ∥ §2.8.2） ────────────────────────────────────

test("腿④ yml publish 契约：generic provider ∥ url（channel 缺省）+ 依赖 electron-updater ^6.8.9 在 dependencies 且在盘", () => {
  const config = jsYaml.load(src("thincoder-desktop/electron-builder.yml"))
  assert.deepEqual(config.publish, { provider: "generic", url: "https://thincoder.com/downloads/" }, "publish = generic 契约（provider ∥ url；channel 缺省）")
  const pkg = JSON.parse(src("thincoder-desktop/package.json"))
  assert.equal(pkg.dependencies["electron-updater"], "^6.8.9", "首个第三方运行依赖入 dependencies")
  const updaterPkg = JSON.parse(src("thincoder-desktop/node_modules/electron-updater/package.json"))
  assert.equal(updaterPkg.version, "6.8.9", "安装版本 = 6.8.9（源读基线）")
})

// ── 腿 ⑤ 站点脚本源扫（§2.8.3 ∥ §2.9.7——站点仓 = 父侧轮；源在 ⇒ 绿） ──────────

test("腿⑤ 站点脚本源扫：prune `downloads/` 豁免 ∥ gen-changelog `--side desktop` ∥ 上传小件键 ∥ 缓存契约", () => {
  const site = (name) => readFileSync(fileURLToPath(new URL(`../../../thincoder.com/scripts/${name}`, import.meta.url)), "utf8")
  const deployOss = site("deploy-oss.mjs")
  assert.match(deployOss, /!k\.startsWith\("downloads\/"\)/, "prune 面 downloads/ 前缀豁免（误删 ⇒ 更新链断）")
  const genChangelog = site("gen-changelog.mjs")
  assert.match(genChangelog, /--side desktop/, "desktop 臂用法在册")
  assert.match(genChangelog, /side === 'desktop'/, "desktop 分支在册")
  assert.match(genChangelog, /'--desktop'/, "输入路径可覆盖")
  assert.match(genChangelog, /side === 'desktop' \? '0\.10\.1'/, "since 缺省 = 0.10.1")
  const gaps = (genChangelog.match(/const GAPS = \{[\s\S]*?\n\};/) ?? [""])[0]
  assert.ok(gaps.includes("cli:"), "GAPS.cli 在位")
  assert.ok(!gaps.includes("desktop"), "GAPS.desktop = 无（零缺段）")
  const upload = site("upload-download.mjs")
  assert.match(upload, /const PREFIX = "downloads\/"/, "键 = downloads/ 前缀 + 文件名")
  assert.match(upload, /no-cache/, "yml ⇒ no-cache")
  assert.match(upload, /max-age=86400/, "exe ∥ blockmap ⇒ max-age=86400")
  assert.match(upload, /DRY_RUN/, "DRY_RUN 预览（零凭证可跑）")
})

// ── 腿 ⑥ 零新通道 + 装配面源扫（验收：零新 IPC——更新面全主进程） ──────────────

test("腿⑥ 零新通道 ∥ 装配面源扫：事件 24 ∥ 白名单 47 ∥ HANDLERS 闭合 ∥ 武装门装配 ∥ 通知落子", () => {
  assert.equal(preload.EVENT_CHANNELS.length, 24, "事件通道 24 零动")
  assert.equal(preload.CHANNELS.length, 47, "请求白名单 47 零动")
  assert.equal(new Set(preload.EVENT_CHANNELS).size, 24)
  assert.equal(new Set(preload.CHANNELS).size, 47)
  const registry = src("thincoder-desktop/src/main/ipc-registry.mjs")
  const table = (registry.match(/const HANDLERS = Object\.freeze\(\{[\s\S]*?\n\}\)/) ?? [""])[0]
  const rows = [...table.matchAll(/"([^"]+)":/g)].map((match) => match[1])
  assert.deepEqual([...rows].sort(), [...preload.CHANNELS].sort(), "注册表闭包（表行集 = 白名单集）")

  const main = src("thincoder-desktop/src/main/main.mjs")
  assert.match(main, /enabled: app\.isPackaged && !SMOKE/, "武装门装配（isPackaged ∧ 非 --smoke）")
  assert.match(main, /toast\.on\("click", /, "通知落子（点击 ⇒ 聚焦主窗——reveal；不直接安装）")
  assert.match(main, /scheduleStartupCheck\(\)/, "延时自检点火在装配面")
  const window_ = src("thincoder-desktop/src/main/window.mjs")
  assert.match(window_, /export function setUpdateFace\(face\)/, "更新面转口在册")
  assert.match(window_, /updateFace\.menuClick\(\)/, "onNative(\"update\") 落子")
})
