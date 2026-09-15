/**
 * engine-floor-guard.test.mjs — W8 前置笔（引擎下限护栏 · A8 裁定 2026-09-15）。
 * 任务书 = `docs/batches/2026-09-15-vsc-core-wiring.md` §2 W8「门 1（引擎下限）」：
 * 值 = `engines.vscode ^1.104.0`；运行期核验 = `activate()` 首步自检（Node 版本 ≥ 22.13
 * 且 `node:sqlite` 可导入）；不满足 ⇒ `showErrorMessage` 明确提示 + 停用记忆面、不崩（不抛）。
 *
 * 覆盖：版本闸边界（22.13）/ 探针分支（Node 够而 sqlite 缺——Electron #47706 形态）/
 * 低于下限 → 提示恰一次（含所需下限 + 实探测版本）+ 记忆面停用 + 不抛 / 本机真探针过闸
 * （兼作环境契约：测试机即产品下限面——dev 机须满足 22.13+）/ 接线机检（`activate()`
 * 护栏挂点先于 locale/面板 + `engines.vscode` 下限值锁 + 本档入册）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { fileURLToPath, pathToFileURL } from "node:url"
import { window as vscodeWindow } from "vscode"
import files from "./files.mjs"
import { nodeFloorMet, engineFloorMet, applyEngineFloorGuard, isMemoryFaceEnabled } from "../extension.mjs"

/** 提示捕获（mock `window` 是共享对象——临时换 showErrorMessage，finally 还原）。 */
async function withMessageSpy(fn) {
  const calls = []
  const orig = vscodeWindow.showErrorMessage
  vscodeWindow.showErrorMessage = async (msg) => { calls.push(msg) }
  try {
    return { result: await fn(), calls }
  } finally {
    vscodeWindow.showErrorMessage = orig
  }
}

// ─── 版本闸边界（22.13）─────────────────────────────────────────

test("engine floor: Node >= 22.13 boundary", () => {
  assert.equal(nodeFloorMet("22.13.0"), true)
  assert.equal(nodeFloorMet("22.13.1"), true)
  assert.equal(nodeFloorMet("23.4.0"), true)
  assert.equal(nodeFloorMet("24.19.0"), true)
  assert.equal(nodeFloorMet("22.12.9"), false)
  assert.equal(nodeFloorMet("20.18.1"), false)
  assert.equal(nodeFloorMet("22"), false, "major-only 版本按 22.0 判——保守不过闸")
})

// ─── 探针分支：Node 够、node:sqlite 缺（Electron #47706 形态）───

test("engine floor: node:sqlite missing → below floor despite Node >= 22.13", async () => {
  const missing = await engineFloorMet({
    version: "22.18.0",
    loadSqlite: async () => { throw new Error("No such built-in module: node:sqlite") },
  })
  assert.equal(missing, false)
  const present = await engineFloorMet({ version: "22.18.0", loadSqlite: async () => {} })
  assert.equal(present, true, "探针可导入 = 过闸（对照）")
})

// ─── 低于下限：提示 + 记忆面停用 + 不抛 ─────────────────────────

test("engine floor: below floor → one clear notice + memory face off, activation survives", async () => {
  try {
    const { result, calls } = await withMessageSpy(() => applyEngineFloorGuard({ version: "20.18.1" }))
    assert.equal(result, false)
    assert.equal(isMemoryFaceEnabled(), false)
    assert.equal(calls.length, 1, "提示恰一次")
    assert.match(calls[0], /1\.104/)
    assert.match(calls[0], /22\.13/)
    assert.match(calls[0], /20\.18\.1/, "提示携实测版本")
  } finally {
    const ok = await applyEngineFloorGuard() // 还原：本机过闸
    assert.equal(ok, true)
    assert.equal(isMemoryFaceEnabled(), true)
  }
})

// ─── 本机通过路径（真版本 + 真 node:sqlite 探针）─────────────────

test("engine floor: this host passes (real node:sqlite probe)", async () => {
  const ok = await applyEngineFloorGuard()
  assert.equal(ok, true)
  assert.equal(isMemoryFaceEnabled(), true)
})

// ─── 接线机检：护栏挂点 + 下限值锁 + 本档入册（删挂点/降值即红）───

test("engine floor wiring: activate() runs the guard first + engines.vscode pinned + file registered", () => {
  assert.ok(files.includes("test/engine-floor-guard.test.mjs"), "本档已登记 test/files.mjs（未登记 = 不跑）")
  const extSrc = readFileSync(new URL("../extension.mjs", import.meta.url), "utf8")
  const body = extSrc.slice(extSrc.indexOf("export async function activate("))
  const guardAt = body.indexOf("await applyEngineFloorGuard()")
  assert.ok(guardAt > -1, "activate() 首步调用护栏（挂点缺失 ⇒ 引擎下限运行期核验失效）")
  assert.ok(guardAt < body.indexOf("initLocale("), "护栏先于 initLocale（首步）")
  assert.ok(guardAt < body.indexOf("new ChatPanel("), "护栏先于面板构建（首步）")
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"))
  assert.equal(pkg.engines.vscode, "^1.104.0", "引擎下限值 = 用户裁定 ^1.104.0")
})

// ─── W8 接线契约机判（§2 W8——引擎护栏接线契约①/②）────────────────

/** 静态 import 闭包：{ files, builtins, unresolved }。只走静态 import/export-from 边
 *  （动态 `import()` 不入闭包——与运行时加载语义一致）；注释先剥离。 */
function staticClosure(entryPath) {
  const files = new Set()
  const builtins = new Set()
  const unresolved = new Set()
  const queue = [entryPath]
  const re = /(?:^|[\s;])(?:import|export)\s+(?!\()([^;"'`]{0,400}?)\bfrom\s*["']([^"']+)["']|(?:^|[\s;])import\s*["']([^"']+)["']/g
  while (queue.length) {
    const file = queue.pop()
    if (files.has(file)) continue
    let src
    try { src = readFileSync(file, "utf8") } catch { continue }
    files.add(file)
    const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^[ \t]*\/\/.*$/gm, "")
    let m
    while ((m = re.exec(code))) {
      const spec = m[2] ?? m[3]
      if (!spec) continue
      if (spec.startsWith("node:")) { builtins.add(spec); continue }
      try {
        queue.push(spec.startsWith(".")
          ? fileURLToPath(new URL(spec, pathToFileURL(file)))
          : createRequire(file).resolve(spec))
      } catch { unresolved.add(spec) }
    }
  }
  return { files, builtins, unresolved }
}

test("W8 contract②: extension.mjs static closure never reaches node:sqlite + lazy-import face pinned", () => {
  const entry = fileURLToPath(new URL("../extension.mjs", import.meta.url))
  const { files, builtins, unresolved } = staticClosure(entry)
  // 非空证明（闭包真走了）：入口 + 句柄档 + 工具装配面均在；无法解析的裸包 = 仅外部面
  const has = (suffix) => [...files].some((f) => f.replaceAll("\\", "/").endsWith(suffix))
  assert.ok(has("extension.mjs"), "入口在闭包内")
  assert.ok(has("thincoder-vscode/src/embed-config.mjs"), "句柄档（embed-config）在闭包内（正控）")
  assert.ok(has("thincoder-vscode/src/tools/index.mjs"), "工具装配面在闭包内（正控：memoryTool 求值面）")
  assert.ok(files.size > 30, `闭包非平凡（实 ${files.size} 档）`)
  assert.deepEqual([...unresolved], [], "闭包内零不可解析裸包（vscode / @thincoder/core 均可达）")
  // 契约②本体：端壳静态链不得到达 node:sqlite（否则低宿主模块加载期硬失败、护栏静默失效）
  assert.ok(!builtins.has("node:sqlite"), `端壳静态链到达 node:sqlite（实 ${[...builtins].join(", ")}）`)
  // 反证（防假绿）：动态载入目标（核记忆面）自身静态链**是**可达 node:sqlite 的——
  // 把动态 import 改成静态，上一条即红。
  const coreMemory = createRequire(entry).resolve("@thincoder/core/memory.mjs")
  const core = staticClosure(coreMemory)
  assert.ok(core.builtins.has("node:sqlite"), "核记忆面静态链可达 node:sqlite（动态载入必要性反证）")
  // 载入形态 = 动态 import（embed-config 内）+ 旗标接线（extension.mjs 注入）+ 创建点在装配面
  const embedSrc = readFileSync(new URL("../src/embed-config.mjs", import.meta.url), "utf8")
  assert.ok(/await import\("@thincoder\/core\/memory\.mjs"\)/.test(embedSrc), "核记忆面经动态 import() 载入（embed-config）")
  assert.ok(/if \(!_faceGate\?\.\(\)\)/.test(embedSrc) || /memoryFaceEnabled\(\)/.test(embedSrc), "造记忆面前读护栏旗标")
  const extSrc = readFileSync(new URL("../extension.mjs", import.meta.url), "utf8")
  assert.ok(extSrc.includes("setMemoryFaceGate(isMemoryFaceEnabled)"), "入口把 isMemoryFaceEnabled 接入句柄模块（旗标消费接线）")
  const chatSrc = readFileSync(new URL("../src/extension/panel-chat.mjs", import.meta.url), "utf8")
  const site = chatSrc.slice(chatSrc.indexOf("ensurePanelAgent(panel, turnSlot)"))
  assert.ok(site.indexOf("ensurePanelAgent(panel, turnSlot)") >= 0 && site.includes("ensureMemoryHandle()"), "句柄创建点在 ensurePanelAgent 同址（装配面）")
})
