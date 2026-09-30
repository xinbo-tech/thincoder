/**
 * 2026-09-30-vsc-cleanup-701.test.mjs — 批内件 #701（VSC 装配面并项目根 `.mcp.json`——对齐 CLI ∕ 桌面）。
 * 跑法（仓根 `thincoder/`）：`node --test docs/batches/2026-09-30-vsc-cleanup-701.test.mjs`
 * 不入仓套件 · 随批留存归档（组界 = #695 组 ∥ #701 组——批档 §2.7 行 13：超 300 即按组拆两档 ⇒ 本件 = #701 组）。
 *
 * 腿（判据语义 = 批档 §2.5；机制单源 = `docs/core/design/MCP.md` §6.4）：
 *   T1 含 ∕ 并入（项目单条目 ⇒ 装配连接集含之）· T2 同名优先（config 片连 ∕ 文件同名片零并入）
 *   T3 异名追加序（config 先 ∕ 文件后）· T4 数组形 ∕ 坏 JSON ∕ 无文件 ∕ 条目形 ⇒ 非致命（零中断、零并入）
 *   T5 非变异（config 对象 ∕ 盘面零增）· T6（负控）管理面列表不含文件源条目（`loadMcpServers` 零改锁）
 *   T7 `cwd` 空 ∕ 非串 ⇒ 零读零并入
 */
import test from "node:test"
import assert from "node:assert/strict"
import { registerHooks } from "node:module"
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

// 家目录重定向（安全网：核 configDir 于模组装载期取值——一切动态 import 之前覆盖）
const _home = mkdtempSync(join(tmpdir(), "vsc-cleanup-701-home-"))
process.env.HOME = _home
process.env.USERPROFILE = _home

const ROOT = fileURLToPath(new URL("../../", import.meta.url)) // 仓根（docs/batches 两层深）
const vsc = (rel) => pathToFileURL(join(ROOT, "thincoder-vscode", rel)).href
const core = (rel) => pathToFileURL(join(ROOT, "thincoder-core", rel)).href
const src = (rel) => readFileSync(join(ROOT, rel), "utf8")

// 单实例归一：生产解析经 `thincoder-vscode/node_modules/@thincoder/core` 符号链接（realpath 盘符
// 大小写与上方 file URL 不同 ⇒ Node 模块身份分裂双实例——测试缝 `_setConfigPathForTest` 只落其一）。
// 本 hook 把裸符归一为同一 file URL ⇒ 被链与测试共用同一实例（零行为差）。
const CORE_IO_URL = core("config-io.mjs")
registerHooks({
  resolve(specifier, context, next) {
    if (specifier === "@thincoder/core/config-io.mjs") return { url: CORE_IO_URL, shortCircuit: true }
    return next(specifier, context)
  },
})

const coreIo = await import(CORE_IO_URL)
const { loadMcpServers, assemblyMcpServers } = await import(vsc("src/config-mcp.mjs"))

const tmpDir = (p) => mkdtempSync(join(tmpdir(), p))
const tmpCfg = (seed) => {
  const dir = tmpDir("vsc-cleanup-701-cfg-")
  const cfg = join(dir, "config.json")
  writeFileSync(cfg, JSON.stringify(seed, null, 2) + "\n")
  return cfg
}
const writeMcpJson = (cwd, obj) => writeFileSync(join(cwd, ".mcp.json"), JSON.stringify(obj))

/** console.error 捕获（记录面断言 + 输出降噪；异常径恢复原函数）。 */
async function capturing(fn) {
  const orig = console.error
  const lines = []
  console.error = (...a) => lines.push(a.join(" "))
  try { return { result: await fn(), lines } } finally { console.error = orig }
}

test("T1 含 ∕ 并入：项目单条目 ⇒ 装配连接集含之（{name, ...server} 键名注入）", async () => {
  const cwd = tmpDir("mcp701-t1-")
  writeMcpJson(cwd, { mcpServers: { alpha: { command: "x", args: ["a"] } } })
  coreIo._setConfigPathForTest(tmpCfg({ mcp: { servers: [] } }))
  try {
    const list = await assemblyMcpServers(cwd)
    assert.deepEqual(list, [{ name: "alpha", command: "x", args: ["a"] }], "文件源条目并入（键名注入形）")
    assert.deepEqual(loadMcpServers(), [], "管理面读面（loadMcpServers）零受影")
  } finally { coreIo._resetConfigPathForTest() }
})

test("T2 同名优先：config `A` ∥ 文件 `A` ⇒ 连接集 = config 片（文件同名片零并入）", async () => {
  const cwd = tmpDir("mcp701-t2-")
  writeMcpJson(cwd, { mcpServers: { alpha: { command: "FILE" } } })
  coreIo._setConfigPathForTest(tmpCfg({ mcp: { servers: [{ name: "alpha", command: "CONFIG" }] } }))
  try {
    const list = await assemblyMcpServers(cwd)
    assert.deepEqual(list, [{ name: "alpha", command: "CONFIG" }], "仅 config 片在连接集（文件片零并入）")
  } finally { coreIo._resetConfigPathForTest() }
})

test("T3 异名追加序：config 先 ∕ 文件后（序列断言）", async () => {
  const cwd = tmpDir("mcp701-t3-")
  writeMcpJson(cwd, { mcpServers: { beta: { command: "B" } } })
  coreIo._setConfigPathForTest(tmpCfg({ mcp: { servers: [{ name: "alpha", command: "A" }] } }))
  try {
    const list = await assemblyMcpServers(cwd)
    assert.deepEqual(list, [{ name: "alpha", command: "A" }, { name: "beta", command: "B" }], "两片皆并 ∕ 序 = config 先")
  } finally { coreIo._resetConfigPathForTest() }
})

test("T4 数组形 ∕ 坏 JSON ∕ 无文件 ∕ 条目形 ⇒ 非致命（零中断、零并入）", async () => {
  // 数组形 mcpServers：跳过 + 记录（CLI 同文本）
  const cwdA = tmpDir("mcp701-t4a-")
  writeMcpJson(cwdA, { mcpServers: [{ name: "arr0", command: "x" }] })
  coreIo._setConfigPathForTest(tmpCfg({ mcp: { servers: [] } }))
  try {
    const { result: listA, lines: linesA } = await capturing(() => assemblyMcpServers(cwdA))
    assert.deepEqual(listA, [], "数组形 ⇒ 零并入")
    assert.equal(linesA.some((l) => l.includes("must be a plain object")), true, "记录面在场（CLI 同文本）")
    // 坏 JSON：非致命
    const cwdB = tmpDir("mcp701-t4b-")
    writeFileSync(join(cwdB, ".mcp.json"), "{ not-json")
    const { result: listB, lines: linesB } = await capturing(() => assemblyMcpServers(cwdB))
    assert.deepEqual(listB, [], "坏 JSON ⇒ 零并入（不抛）")
    assert.equal(linesB.some((l) => l.includes("Failed to read .mcp.json")), true, "记录面 `[mcp] Failed to read .mcp.json: …`")
    // 无文件：零并入（零记录）
    const cwdC = tmpDir("mcp701-t4c-")
    const { result: listC, lines: linesC } = await capturing(() => assemblyMcpServers(cwdC))
    assert.deepEqual(listC, [], "无文件 ⇒ 零并入")
    assert.equal(linesC.length, 0, "无文件 ⇒ 零记录（零读零效果）")
    // 条目形：null ∕ 嵌套数组跳过；合法项照并
    const cwdD = tmpDir("mcp701-t4d-")
    writeMcpJson(cwdD, { mcpServers: { badNull: null, badArr: ["x"], good: { command: "y" } } })
    const listD = await assemblyMcpServers(cwdD)
    assert.deepEqual(listD, [{ name: "good", command: "y" }], "非法条目跳过 + 合法项照并")
  } finally { coreIo._resetConfigPathForTest() }
})

test("T5 非变异：装配不回写 config（盘面逐字节 ∕ 对象零增）", async () => {
  const cwd = tmpDir("mcp701-t5-")
  writeMcpJson(cwd, { mcpServers: { beta: { command: "B" } } })
  const cfg = tmpCfg({ mcp: { servers: [{ name: "alpha", command: "A" }] } })
  coreIo._setConfigPathForTest(cfg)
  try {
    const before = readFileSync(cfg, "utf8")
    await assemblyMcpServers(cwd)
    assert.equal(readFileSync(cfg, "utf8"), before, "盘面逐字节零增（零回写）")
    assert.deepEqual(loadMcpServers(), [{ name: "alpha", command: "A" }], "config 对象零增（beta 零 push）")
  } finally { coreIo._resetConfigPathForTest() }
})

test("T6 负控：管理面列表不含文件源条目（`loadMcpServers` 零改锁 + 供给点单入口）", async () => {
  const cwd = tmpDir("mcp701-t6-")
  writeMcpJson(cwd, { mcpServers: { alpha: { command: "x" } } })
  coreIo._setConfigPathForTest(tmpCfg({ mcp: { servers: [] } }))
  try {
    await assemblyMcpServers(cwd)
    assert.deepEqual(loadMcpServers(), [], "管理面列表（config 单源）不含文件源条目")
  } finally { coreIo._resetConfigPathForTest() }
  // 源锁：管理面（panel-mcp ∕ settings）零引装配件；供给点单入口 = panel-turn-loop 的 ro 载荷
  assert.equal(src("thincoder-vscode/src/extension/panel-mcp.mjs").includes("assemblyMcpServers"), false, "panel-mcp.mjs 零引")
  assert.equal(src("thincoder-vscode/src/extension/settings.mjs").includes("assemblyMcpServers"), false, "settings.mjs 零引")
  assert.match(src("thincoder-vscode/src/extension/settings.mjs"), /export function getMcpServers\(\) \{\s*return loadMcpServers\(\)/, "管理面读面零改锁")
  assert.match(src("thincoder-vscode/src/extension/panel-turn-loop.mjs"), /mcpServers: await assemblyMcpServers\(cwd\)/, "供给点 = ro 载荷（单入口）")
})

test("T7 `cwd` 空 ∕ 非串 ⇒ 零读零并入", async () => {
  const cwd = tmpDir("mcp701-t7-")
  writeMcpJson(cwd, { mcpServers: { beta: { command: "B" } } })
  coreIo._setConfigPathForTest(tmpCfg({ mcp: { servers: [{ name: "alpha", command: "A" }] } }))
  try {
    for (const bad of ["", null, undefined, 42, { cwd }]) {
      const { result, lines } = await capturing(() => assemblyMcpServers(bad))
      assert.deepEqual(result, [{ name: "alpha", command: "A" }], `cwd=${String(bad)} ⇒ 恒等（零并入）`)
      assert.equal(lines.length, 0, `cwd=${String(bad)} ⇒ 零读（零记录面）`)
    }
    const ok = await assemblyMcpServers(cwd)
    assert.deepEqual(ok, [{ name: "alpha", command: "A" }, { name: "beta", command: "B" }], "正控：合法 cwd ⇒ 文件片并入（证明零并入非环境性）")
  } finally { coreIo._resetConfigPathForTest() }
})
