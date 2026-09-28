/**
 * host-floor.test.mjs — E-7 用例（PROJECT.md §2 KD-7；批档 §2.5 U1–U4 + U13 + U74 · 本批 §2.11 收正⑤/⑥ + U76/U77/U95）。
 * 覆盖：版本闸边界（24.0 · Node 主版本底线语义）/ 探针分支（Node 够而 `node:sqlite` 缺）/ 本机真探针过闸
 * （兼作环境契约：测试机即产品下限面）/ 启动序机检（下限自检调用点先于协议 / 窗口注册 · 失败走显式退出 · `main` 值锁 · 本档入册）/
 * 预载三面（主进程可读不抛 · 平 node 装配判红 · 主侧读取面 = `createRequire`）/
 * 通道配线两向（`CHANNELS` 二十九项 · `HANDLERS` 键集≡白名单集 · 三新处理体转口 · 未装配处理体 fail-loud 源面判红）/
 * 订阅面白名单（`EVENT_CHANNELS` 十六条 ∧ 冻结 · 表内订阅收单参载荷 · 表外 throw · 退订同引用幂等）/
 * 行数触发线（批 8 主进程侧 / 渲染侧新档 ≤ 300 · 批 9 新增六档〔用例模块〕≤ 300 · 在册例外两向〔越层档不入 `fresh` 清单〕· 宿主档源面零 `electron`）/
 * 退场复位回路（三薄挂载宿主属性面无残留 —— `docs/desktop/design/RENDERER.md` §1 退场口径 · 属性面）/
 * 宿主面接线两件（U200：「对齐第三批」台账行出站点 `session:resume` 成功径 + `file:open` 出口）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"
import { engineFloorMet, hostFloorMet, MIN_NODE, sqliteAvailable } from "../src/main/host-floor.mjs"
import { mountInfo } from "../renderer/views/info-row.mjs"
import { mountWizard } from "../renderer/views/onboarding.mjs"
import { mountSettings } from "../renderer/views/settings.mjs"
import { installFakeDom, selfCheck } from "./fake-dom.mjs"
import files from "./files.mjs"
import { stateOf } from "./views-harness.mjs"

/** 剥注释（块 / 行）：源码机检须看**调用点**——否则启动序注释里的 `registerAppScheme()` 字样会被当成挂点（本轮实测踩中）。 */
function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^[ \t]*\/\/.*$/gm, "")
}

// ─── U1 版本闸边界（FLOOR = 24.0）──────────────────────────────

test("U1: 宿主版本谓词边界（24.0）", () => {
  assert.equal(MIN_NODE, "24.0.0", "下限值 = 宿主 Node 主版本底线（单源）")
  assert.equal(hostFloorMet("24.0.0"), true)
  assert.equal(hostFloorMet("24.18.0"), true)
  assert.equal(hostFloorMet("25.0.0"), true)
  assert.equal(hostFloorMet("23.9.9"), false)
  assert.equal(hostFloorMet("20.18.1"), false)
  assert.equal(hostFloorMet("24"), true, "major-only 按 24.0 判——恰达过闸（下限 minor 归 0）")
  assert.equal(hostFloorMet("24.0.0-rc.1"), false, "预发布标记不解析——保守不过闸")
})

// ─── U2 探针分支：Node 够、node:sqlite 缺 ──────────────────────

test("U2: Node 够而 node:sqlite 缺 ⇒ 不过闸（探针分支）", async () => {
  const missing = await engineFloorMet({
    version: "24.18.0",
    loadSqlite: async () => { throw new Error("No such built-in module: node:sqlite") },
  })
  assert.equal(missing, false)
  assert.equal(await sqliteAvailable(async () => {}), true, "探针可载 = true（对照）")
  assert.equal(await engineFloorMet({ version: "24.18.0", loadSqlite: async () => {} }), true)
})

// ─── U3 本机真探针（环境契约：测试机即下限面）──────────────────

test("U3: 本机真探针过闸（实时环境读数）", async () => {
  assert.equal(hostFloorMet(process.versions.node), true, `本机 node ${process.versions.node} 须 ≥ ${MIN_NODE}`)
  assert.equal(await sqliteAvailable(), true, "本机 node:sqlite 可动态导入")
  assert.equal(await engineFloorMet({ version: process.versions.node }), true)
})

// ─── U4 启动序机检（删挂点 / 乱序 / 抛栈即红）───────────────────

test("U4: 下限自检调用点先于协议 / 窗口注册 + 失败不抛 + main 值锁 + 本档入册", () => {
  assert.ok(files.includes("test/host-floor.test.mjs"), "本档已登记 test/files.mjs（未登记 = 不跑）")
  const source = readFileSync(new URL("../src/main/main.mjs", import.meta.url), "utf8")
  const code = stripComments(source)
  const floorAt = code.indexOf("hostFloorMet(process.versions.node")
  assert.ok(floorAt > -1, "下限自检调用点在位（挂点缺失 ⇒ 运行期核验失效）")
  for (const later of ["registerAppScheme(", "serveAppProtocol(", "createWindow("]) {
    const at = code.indexOf(later)
    assert.ok(at > -1, `${later} 在位`)
    assert.ok(floorAt < at, `下限自检先于 ${later}（实 ${floorAt} vs ${at}）`)
  }
  const branch = code.slice(floorAt, code.indexOf("\n\n", floorAt))
  assert.ok(!/\bthrow\b/.test(branch), "失败分支不抛栈")
  assert.ok(branch.includes("report(") && code.includes("app.exit("), "失败分支走显式退出面（report ⇒ app.exit）")
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"))
  assert.equal(pkg.main, "src/main/main.mjs", "main 值锁")
})

// ─── U13 预载档三面 ────────────────────────────────────────────

test("U13: 预载档主进程可读不抛 / 平 node 装配判红 / 主侧读取面 = createRequire", () => {
  const preloadPath = fileURLToPath(new URL("../src/preload/preload.cjs", import.meta.url))
  const preload = createRequire(import.meta.url)(preloadPath) // ① 主进程侧读取：不触 electron ⇒ 不抛
  assert.deepEqual(
    [...preload.CHANNELS],
    [
      "config:read", "project:open", "project:recent", "sessions:list",
      "session:create", "session:switch", "session:rename", "session:delete", "session:resume",
      "approval:respond", "history:page", "msg:send", "msg:interrupt",
      "provider:list", "provider:save", "provider:remove", "provider:verify",
      "model:list", "settings:agent", "mcp:list", "mcp:save", "mcp:remove",
      "config:write", "ledger:read", "batch:status", "question:respond", "session:prefs", "subagent:stop", "file:open",
    ],
    "白名单二十九项定序（「对齐第三批」增 `file:open` —— 末位）",
  )
  assert.ok(Object.isFrozen(preload.CHANNELS), "CHANNELS 冻结（运行期不可改）")

  // ② 平 node 且守卫被满足（有 window）⇒ 装配尝试 ⇒ require("electron") 失败 ⇒ 非零退出、错面提 electron
  const code = `globalThis.window = {}; require(${JSON.stringify(preloadPath)})`
  const child = spawnSync(process.execPath, ["-e", code], { encoding: "utf8" })
  assert.notEqual(child.status, 0, "平 node 满足守卫即判红（不静默降级）")
  const face = `${child.stderr}${child.stdout}`
  assert.match(face, /exposeInMainWorld|electron/i, `错面须指向装配面（实 = ${face.slice(0, 160)}）`)

  // ③ 主侧白名单单源：经 createRequire 读取面（不拷副本）
  const ipcSrc = readFileSync(new URL("../src/main/ipc.mjs", import.meta.url), "utf8")
  assert.ok(ipcSrc.includes("createRequire"), "主侧经 createRequire 读预载白名单")
})

// ─── U74 通道配线两向（批 7 + 本批 §2.11 ⑥ 随动）─────────────

test("U74: 白名单二十九项 ∧ 既有十三项序锁定（第 10 项 = approval:respond）∧ HANDLERS ≡ CHANNELS 两向 ∧ 未装配处理体 fail-loud", () => {
  const preload = createRequire(import.meta.url)(fileURLToPath(new URL("../src/preload/preload.cjs", import.meta.url)))
  const channels = [...preload.CHANNELS]
  assert.equal(channels.length, 29, "白名单 = 二十九项（既有十三项 + 设置族十二 + 作答响应 + 会话级偏好写面 + 子 agent 停止出口 + 文件链接打开）")
  assert.equal(channels[9], "approval:respond", "既有十三项序锁定 —— 第 10 项 = 审批出口（新增段追加其后，不动既有段）")
  assert.deepEqual(channels.slice(10, 13), ["history:page", "msg:send", "msg:interrupt"], "第 11–13 项 = 历史页 + 回合驱动二项（批 7 段）")
  assert.deepEqual(
    channels.slice(13),
    [
      "provider:list", "provider:save", "provider:remove", "provider:verify",
      "model:list", "settings:agent", "mcp:list", "mcp:save", "mcp:remove",
      "config:write", "ledger:read", "batch:status", "question:respond", "session:prefs", "subagent:stop", "file:open",
    ],
    "第 14–29 项 = 新增十六项（作答响应 + 会话级偏好写面 + 子 agent 停止出口 + 文件链接打开居末位 —— 序同预载档头注定序）",
  )

  const ipc = stripComments(readFileSync(new URL("../src/main/ipc.mjs", import.meta.url), "utf8"))
  const block = ipc.match(/const HANDLERS = Object\.freeze\(\{([\s\S]*?)\n\}\)/)
  assert.ok(block, "HANDLERS 表在册（源面判据 —— 处理体注册表未导出）")
  const handled = [...block[1].matchAll(/"([^"]+)":/g)].map((hit) => hit[1])
  assert.equal(new Set(handled).size, handled.length, "HANDLERS 无重键（重键 = 静默覆盖处理体）")
  assert.deepEqual([...handled].sort(), [...channels].sort(), "HANDLERS 键集 ≡ CHANNELS 集（两向：多一 / 少一皆判红）")

  const body = ipc.match(/function approvalRespond\([^)]*\)\s*\{([\s\S]*?)\n\}/)
  assert.ok(body, "approvalRespond 处理体在册（审批出口定名点）")
  assert.match(body[1], /\bthrow\b/, "未装配 ⇒ throw（fail-loud 直传拒绝 —— 不吞）")
  assert.ok(!/reason/.test(body[1]), "未装配处理体零 `reason` 码字面（不造第二 reason 语义）")
  assert.ok(!/ok\s*:\s*true/.test(body[1]), "未装配处理体零 `{ ok: true }` 字面（不造假成功）")
})

// ─── U76 出站订阅面白名单（批档 §2.11 收正②/③ · IPC.md §1 十六行）─────

test("U76: EVENT_CHANNELS 十六条 ∧ 冻结 · 表内订阅收单参载荷 · 表外 throw · 退订同引用幂等", () => {
  const preload = createRequire(import.meta.url)(fileURLToPath(new URL("../src/preload/preload.cjs", import.meta.url)))
  const names = [...preload.EVENT_CHANNELS]
  assert.equal(names.length, 16, "恰十六条 —— 回调映射十一通道 + 宿主自产五条（`ev:usage` / `ev:error` / `ev:susp` / `ev:digest` / `ev:ledger`）")
  assert.deepEqual(names, [
    "ev:token", "ev:reasoning", "ev:activity", "ev:subagent", "ev:subchunk", "ev:tool-call", "ev:tool-output", "ev:tool-result",
    "ev:approval", "ev:question", "ev:task", "ev:susp", "ev:digest", "ev:usage", "ev:error", "ev:ledger",
  ], "出站白名单 = 十六条 `ev:*`（序 = 桥面表 —— 宿主自产新通道 `ev:ledger` 随 `ev:error` 后，同 `IPC.md` §1 行序）")
  // 「对齐第三批」收正（代码评审轮 1 发现 1）：渲染面订阅表须与桥面白名单**同集** —— 缺订阅 = 归约面死支（宿主出站 /
  //   归约写者 / 消费面三处齐而订阅缺 ⇒ 特性不可达）；本臂 = 该类的机制守卫（源面机读，两向）
  const subscribe = readFileSync(new URL("../renderer/events-subscribe.mjs", import.meta.url), "utf8")
  const rendererChannels = (subscribe.match(/const CHANNELS = \[([^\]]*)\]/)?.[1] ?? "")
    .match(/"[^"]+"/g)?.map((literal) => literal.slice(1, -1)) ?? []
  assert.deepEqual(rendererChannels, names, "渲染面订阅表 ≡ 桥面 `EVENT_CHANNELS`（序同表 —— 两向同集，缺一 / 多一皆判红）")

  assert.ok(Object.isFrozen(preload.EVENT_CHANNELS), "EVENT_CHANNELS 冻结（运行期不可改）")

  const calls = []
  const live = new Set()
  const on = preload.makeOn({
    on: (name, listener) => { calls.push(["on", name, listener]); live.add(listener) },
    removeListener: (name, listener) => { calls.push(["off", name, listener]); live.delete(listener) },
  })
  const seen = []
  const off = on("ev:token", (...args) => seen.push(args))
  assert.equal(calls.length, 1, "表内名 ⇒ 恰一次订阅（零额外副作用）")
  assert.equal(calls[0][1], "ev:token", "订阅名原样（白名单名面直传）")
  calls[0][2]({ sender: "webContents" }, { key: "3", text: "hi" }) // 注入面实发 (event, payload)
  assert.deepEqual(seen, [[{ key: "3", text: "hi" }]], "回调只收 payload 单参（`event` 不外泄）")
  assert.equal(live.size, 1, "订阅在册（退订面有物可销）")
  assert.throws(() => on("ev:bogus", () => {}), /event channel not allowed: ev:bogus/, "表外名 ⇒ throw（不入 IPC · 零静默返回）")
  assert.equal(calls.length, 1, "表外名零副作用（未订阅）")
  off()
  assert.deepEqual([calls.at(-1)[0], calls.at(-1)[1]], ["off", "ev:token"], "退订 ⇒ removeListener（同名）")
  assert.equal(calls.at(-1)[2], calls[0][2], "退订收同一 listener 引用（核 removeListener 幂等前提）")
  off()
  assert.equal(live.size, 0, "二次退订零抛 ∧ 零订阅残留（幂等）")
})

// ─── U77 本批三新通道接线面（批档 §2.11 ④/⑤/⑥）──────────────────

test("U77: 二十九项含三新行 ∧ 两向 ≡ ∧ 三新处理体转口 ∧ 零假成功 / 零 reason 字面", () => {
  const preload = createRequire(import.meta.url)(fileURLToPath(new URL("../src/preload/preload.cjs", import.meta.url)))
  const channels = [...preload.CHANNELS]
  const ipc = stripComments(readFileSync(new URL("../src/main/ipc.mjs", import.meta.url), "utf8"))
  const block = ipc.match(/const HANDLERS = Object\.freeze\(\{([\s\S]*?)\n\}\)/)
  assert.ok(block, "HANDLERS 表在册")
  const handled = [...block[1].matchAll(/"([^"]+)":/g)].map((hit) => hit[1])
  for (const name of ["history:page", "msg:send", "msg:interrupt"]) {
    assert.ok(channels.includes(name), `${name} 在预载白名单内（§2.11 ⑤ 序末三）`)
    assert.ok(handled.includes(name), `${name} 在 HANDLERS 表内`)
  }
  assert.deepEqual([...handled].sort(), [...channels].sort(), "两向 ≡（多一 / 少一皆判红）")

  const body = (name) => {
    const hit = ipc.match(new RegExp(`function ${name}\\([^)]*\\)\\s*\\{([\\s\\S]*?)\\}`))
    assert.ok(hit, `${name} 处理体在册（三新处理体皆单行体）`)
    return hit[1]
  }
  assert.match(body("msgSend"), /requireAgentHost\(\)\.send\(/, "`msg:send` 转口宿主回合驱动")
  assert.match(body("msgInterrupt"), /requireAgentHost\(\)\.interrupt\(/, "`msg:interrupt` 转口宿主中断")
  assert.match(body("historyPage"), /pageHistory\(currentCwd\(\), payload\)/, "`history:page` 转口读面（cwd = 主进程当前项目）")
  assert.match(body("historyPage"), /agentHost\.flagsOf\(payload\?\.key\)/, "`history:page` 叠加活值模式位（状态栏对齐批 —— 合并口径：agent 在场 ⇒ 活值覆盖槽投影兜底）")
  for (const name of ["msgSend", "msgInterrupt", "historyPage"]) {
    assert.ok(!/ok\s*:\s*true/.test(body(name)), `${name} 处理体零 \`{ ok: true }\` 字面（不造假成功）`)
    assert.ok(!/reason/.test(body(name)), `${name} 处理体零 \`reason\` 码字面（语义单源在动作 / 读面）`)
  }
})

// ─── U200 「对齐第三批」宿主面接线（台账出站点 / 文件打开出口 / 注入面单点）──────────

test("U200: 台账行出站接线 ⊕ `file:open` 出口（源面判据 —— 两处带 electron 不可平驱，故锁接线形）", () => {
  const ipc = stripComments(readFileSync(new URL("../src/main/ipc.mjs", import.meta.url), "utf8"))
  assert.match(ipc, /export function setLedgerEmit\(post\)/, "台账出站面注入点（`main.mjs` 启动序 —— 与 `setAgentHost` 同点）")
  const resume = ipc.match(/function sessionResume\(\)\s*\{([\s\S]*?)\n\}/)
  assert.ok(resume, "`session:resume` 处理体在册")
  assert.match(resume[1], /receipt\?\.ok === true/, "成功判据（失败径零出站）")
  assert.match(resume[1], /void pushLedgerLines\(\{ cwd: receipt\.cwd, key: String\(receipt\.slot\)/, "挂台账行出站（键 = 槽号串 —— 会话键天然在手 · 非 `project:open` 支）")
  const open = ipc.match(/async function fileOpen\(payload\)\s*\{([\s\S]*?)\n\}/)
  assert.ok(open, "`file:open` 处理体在册")
  assert.match(open[1], /shell\.openPath\(path\)/, "出口 = `shell.openPath`（系统默认程序 —— 零外部查看器）")
  assert.match(open[1], /bad-path/, "非串 / 空串载荷 ⇒ `bad-path`（零抛）")
  const main = stripComments(readFileSync(new URL("../src/main/main.mjs", import.meta.url), "utf8"))
  assert.match(main, /setLedgerEmit\(emit\)/, "`main.mjs` 注入同一点（webContents 出站面单点 —— 宿主 emit 与台账行同源）")
})


// ─── 退场复位回路（`docs/desktop/design/RENDERER.md` §1 退场口径 · 属性面 —— 批 9 码面池）─────

test("退场复位回路：三薄挂载宿主属性面无残留（换树 / 退场形两路 · 骨架属性零动）", () => {
  assert.equal(selfCheck(), true, "假 DOM 载体自检（选择器闭集 / 锚缺抛 / 写计三档）")
  const fake = installFakeDom()
  try {
    const handlers = new Proxy({}, { get: () => () => {} })
    const names = (node) => [...node.getAttributeNames()].sort()
    const wizard = stateOf({ open: false, configured: false })
    const slot = fake.element("section")
    slot.setAttribute("data-slot", "settings") // 挂载前基线 = 骨架属性（宿主已有面）
    // ① 换树（一容器两树互斥 = 生产拓扑）：向导占槽 ⇒ 设置树接管 —— 离职树所加属性零残留
    mountWizard(slot, wizard, handlers)
    assert.deepEqual(names(slot), ["class", "data-onboarding", "data-slot", "data-state", "data-step"], "向导占槽：宿主 = 骨架 ∪ 现树声明")
    mountSettings(slot, stateOf({ open: true }), handlers)
    assert.deepEqual(names(slot), ["class", "data-settings", "data-slot", "data-state"], "换树 ⇒ `data-onboarding` / `data-step` 摘除（只增不减 ⇒ 判据不达）")
    assert.equal(slot.getAttribute("class"), "settings", "接任树声明落宿主（`class` 就地改值）")
    // ② 反向换树 + 退场形（退场 = 容器清空 —— 零子节点树接管）
    mountWizard(slot, wizard, handlers)
    assert.deepEqual(names(slot), ["class", "data-onboarding", "data-slot", "data-state", "data-step"], "反向换树 ⇒ `data-settings` 摘除")
    mountSettings(slot, stateOf({ open: false, configured: true }), handlers)
    assert.deepEqual(names(slot), ["class", "data-settings", "data-slot", "data-state"], "退场：关态标留存（现树声明，非残留）")
    assert.equal(slot.getAttribute("data-state"), "closed", "关态字落宿主（退场形自带面）")
    assert.equal(slot.childNodes.length, 0, "退场 = 容器清空（非 `hidden`）")
    assert.equal(slot.getAttribute("data-slot"), "settings", "骨架属性自始不动")
    // ③ 信息行（另一挂载 · 另一槽）：态字随行改值 ∧ 三挂载共用一张复位表（跨面接管零残留）
    const info = fake.element("aside")
    info.setAttribute("data-slot", "info")
    const withInfo = (slice) => stateOf({}, { projectInfo: slice })
    mountInfo(info, withInfo({ counts: { pool: 3, tech: 1, aged: 0 }, phase: "production", thresholdReached: true }), handlers)
    assert.deepEqual(names(info), ["class", "data-info", "data-slot", "data-state"], "信息行：宿主 = 骨架 ∪ 现树声明")
    assert.equal(info.getAttribute("data-state"), "ready", "行态字落宿主（读数在手 ⇒ `ready`）")
    mountInfo(info, withInfo({ counts: null, phase: null, notice: "boom" }), handlers)
    assert.equal(info.getAttribute("data-state"), "error", "态字就地改值（重挂零残留）")
    mountWizard(info, wizard, handlers)
    assert.deepEqual(names(info), ["class", "data-onboarding", "data-slot", "data-state", "data-step"], "跨面接管 ⇒ `data-info` 摘除（复位表 = 三挂载共用单源）")
  } finally { fake.restore() }
})

// ─── U95 行数触发线与形态面（批档 §2.4 U95；四条一并落本档）───────────

test("U95: fresh 新档 ≤ 300 行（越层档走例外面）∧ `app.mjs` 拆后 ≤ 300 ∧ 宿主档源面零 electron", () => {
  // 行数口径 = 内容行数（文末换行不计 —— 同 `docs/desktop/design/PROJECT.md` §4.1 回填口径）。
  const rows = (rel) => readFileSync(new URL(`../${rel}`, import.meta.url), "utf8").replace(/\n$/, "").split("\n").length
  const fresh = [
    // 主进程侧（8a）
    "src/main/agent-host.mjs", "src/main/agent-bridge.mjs", "src/main/suspensions.mjs", "src/main/session-io.mjs",
    "test/history-page.test.mjs", "test/session-io.test.mjs", "test/slot-sandbox.mjs",
    // 渲染侧（8b —— 本批三新档 + 其测试档；行数臂由 8a 落）
    "renderer/events-subscribe.mjs", "renderer/mount-pool.mjs",
    "test/events-page.test.mjs",
    // 批 9 六档（用例模块 —— 清单一律文件级读数；越层档不入本清单，走下表例外面）
    //   其余新档行数面（主进程侧四源档 / `settings.css`）= §4.1 值列表（父侧臂清单随动项；本清单补入 = 六用例档）。
    "test/settings.test.mjs", "test/providers.test.mjs", "test/mcp-servers.test.mjs", "test/project-info.test.mjs",
    "test/views-onboarding.test.mjs",
    // 批 B ⑧ 附件面（本舱）：渲染侧新档一行（码面池随动 —— §2.5:154「批 B 新档两档」之渲染半）
    //   + 主进程半一行（`8a` 舱新档 —— 设计未立档，源 §1.12 #93 立舱 ⇒ 越声明见 §5）；用例档登记走 `test/files.mjs`。
    "src/main/attachments.mjs", "renderer/attach.mjs",
    // 批 B 复制面新档（本舱）：渲染侧一行（机检随动 —— 新增码面档一律入 ≤300 臂读数）
    "renderer/views/chat-copy.mjs",
    // 批 B 会话头面（本舱）：接线档一行（`renderer/mount-head.mjs`，未入设计档清单 ⇒ 越声明见 §5）；用例档越 300 => 下行例外面登记（「对齐第三批」U213 例入档）
    "renderer/mount-head.mjs",
    // 批 B 引导面新档（本舱 · 追加轮）：渲染侧一行（`renderer/views/chat-guide.mjs`）+ 其用例档一行（同前例）
    "renderer/views/chat-guide.mjs", "test/views-chat-guide.test.mjs",
    // R3a 状态行族两档（本舱）：`renderer/views/statusline.mjs`（自 chrome.mjs 拆出）+ `renderer/mount-status.mjs` + 用例档一行；D22 再拆 banner 段组出 `renderer/views/statusline-banner.mjs`（模式四位段构树 + 活值判定单源）
     "renderer/views/statusline.mjs", "renderer/mount-status.mjs", "renderer/views/statusline-banner.mjs",
    // R3b / D22 宿主拆档出档（本舱）：`src/main/subagent-face.mjs`（R3b：停止出口 + 存活投影起 / 停 / 清点）+ `src/main/agent-assemble.mjs`（D22 状态栏对齐批：装配面出档 —— `agent-host.mjs` 300 ⇒ 拆分落形）
    "src/main/subagent-face.mjs", "src/main/agent-assemble.mjs",
    // R3b 用例三档（本舱）：桥面 relay 分流 + 存活投影 / 宿主停止出口 + 拍体 / `ev:subagent` 归约面
    "test/agent-bridge-subagent.test.mjs", "test/agent-host-subagent.test.mjs", "test/events-subagent.test.mjs",
     // R3c 视图新档（本舱）：`chat-text.mjs`（核文本面）+ `chat-cards.mjs`（卡面态刷拆档 —— 在册预案「卡构树拆出」落形）+ 用例两档（同入 ≤300 臂）
     "renderer/views/chat-text.mjs", "renderer/views/chat-cards.mjs", "test/views-chat-text.test.mjs", "test/views-rail-actions.test.mjs",
     // 「对齐第二批」拆分产出三档（本舱 —— 新增码面档一律入 ≤300 臂读数）：页读径 / 排队消息面 / 子 agent 归约径
     "renderer/page-read.mjs", "renderer/queue.mjs", "renderer/subagent-reduce.mjs",
     // 「对齐第二批」功能新档两件（同臂）：流内待发送气泡组 / 流内归档子 agent 块
     "renderer/views/chat-pending.mjs", "renderer/views/chat-subagent.mjs",
     // 「桌面空闲唤醒」主面（本舱 —— 新增码面档一律入 ≤300 臂读数）：驱动胶水（消费核件 `startSuspension`）/
     //   提示面策略（失焦门 + 两档）/ 单回合执行面（触 300 行顾问线，在册预案「回合执行面再出档」落形）+ 驱动族用例档
     "src/main/suspension-drive.mjs", "src/main/notify.mjs", "src/main/turn-face.mjs", "test/agent-host-suspension.test.mjs",
    // 「对齐第三批」小修族（本舱 —— 新增码面 / 拆分产出档一律入 ≤300 臂读数）：
    //   2s 拍档（首个渲染面定时器 —— `setInterval` + 清点封装）+ 帧尾态刷拆分产出（`chat.mjs` 越 300 在册 ⇒ 在册预案本批执行）+ 拍用例档
    "renderer/heartbeat.mjs", "renderer/views/chat-chrome.mjs", "test/heartbeat.test.mjs",
    // 「对齐第三批」外围舱（本舱）：视图面词族第二档（`renderer/i18n-views.mjs` —— 在册拆分预案「新增词族出第二档」本批执行）
    //   + 用例拆出档（`test/views-settings-agent.test.mjs` —— 宿主档在册例外（≤ 500）⇒ 按在册预案本批执行拆分）
    "renderer/i18n-views.mjs", "test/views-settings-agent.test.mjs",
  ]
  for (const rel of fresh) {
    const n = rows(rel)
    assert.ok(n <= 300, `${rel} ≤ 300 行（触发线：贴层即拆；实 ${n}）`)
  }
  // 在册例外（越层档**逐一登记** —— 不混进 ≤300 臂 / 不入 `fresh` 清单）：两向判据 = 真越层（>300 ⇒ 例外不得
  // 静默变常档）∧ 未触硬限（≤500）；消解窗口 = 该档下次被触碰的批（登记面 = `docs/desktop/design/PROJECT.md` §4.1）。
  //   `test/views-settings.test.mjs`（本舱 ⑧ 档位控件例入档 ⇒ 越 300）：§4.1 在册拆分预案 = 用例面拆出（档名实施批定）·
  //   `test/agent-host.test.mjs`（状态栏对齐批 `respond` 回执叠加两向例入档 ⇒ 越 300）：拆分预案 = 门面用例拆出（档名实施批定 —— 装配假面 harness 共享，拆待配套 harness 档）；登记面滞后 = 批次档 §5 已登记。
  //   `test/views-statusline.test.mjs`（「桌面空闲唤醒」批 段 3 态机四支例入档 ⇒ 越 300，300 顶格档）：拆分预案 = 态机用例面拆出（档名实施批定）；登记面滞后 = 批次档 §5 已登记。
  //   `test/views-chat.test.mjs`（「桌面空闲唤醒」批 U194 消化行组例入档 ⇒ 越 300——本批开工实读 311 已越线，入档续增）：拆分预案 = 用例面拆出（档名实施批定 —— `views-chat-text` / `views-chat-frame` 拆出先例同因）；登记面滞后 = 批次档 §5 已登记。
  //   `test/views-head.test.mjs`（「对齐第三批」小型族 U213 忙态写门例入档 ⇒ 越 300——原 300 贴线）：拆分预案 =
  //   用例面拆出（档名实施批定）；阻塞面 = 夹具三件（`useHeadSentinels` / `captureErrors` / `resetStore`）现为档内局部面，
  //   拆档须同步外提共享档（先例 = `test/views-harness.mjs`）⇒ 随拆档一并落；登记面 = 批次档 §5。
  for (const { rel, limit } of [{ rel: "renderer/mount-settings.mjs", limit: 500 }, { rel: "renderer/events.mjs", limit: 500 }, { rel: "test/views-settings.test.mjs", limit: 500 }, { rel: "test/views-head.test.mjs", limit: 500 }, { rel: "test/agent-host.test.mjs", limit: 500 }, { rel: "test/views-statusline.test.mjs", limit: 500 }, { rel: "test/views-chat.test.mjs", limit: 500 }]) {
    const n = rows(rel)
    assert.ok(n > 300, `${rel} 仍在册例外面（实 ${n} —— 回落 ≤300 须撤销例外登记）`)
    assert.ok(n <= limit, `${rel} ≤ ${limit} 硬限（实 ${n} —— 距硬限余 ${limit - n} 行）`)
    assert.ok(!fresh.includes(rel), `${rel} 不入 \`fresh\` 清单（越层档 = 例外面，非 ≤300 臂）`)
  }
  // 判据 = 行数规则线本身（「无文件 >300 行」· **含线上** —— 恰 300 合规 · 非余量口径）：接线族已在 `mount-*.mjs` 出档。
  assert.ok(rows("renderer/app.mjs") <= 300, `renderer/app.mjs 拆后 ≤ 300（实 ${rows("renderer/app.mjs")}）`)
  // 宿主档源面零 `electron`（脱壳直测前提 —— 「桌面空闲唤醒」批量档同判据：策略面 ∕ 驱动面 ∕ 执行面皆零宿主依赖）。
  for (const rel of ["src/main/agent-host.mjs", "src/main/turn-face.mjs", "src/main/suspension-drive.mjs", "src/main/notify.mjs"]) {
    assert.ok(!/electron/i.test(readFileSync(new URL(`../${rel}`, import.meta.url), "utf8")), `${rel} 源面零 \`electron\`（脱壳直测前提）`)
  }
  // 渲染 import 面（零 `node:` / 零裸包）= U5 单源：其闭包自 `renderer/app.mjs` 递归走边、本批三渲染新档
  // 已入 U5 正控（`test/guard-closure.test.mjs`）⇒ 本臂不重复实现同规则（双份走边 = 漂移源）。
})
