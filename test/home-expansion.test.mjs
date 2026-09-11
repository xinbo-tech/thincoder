/**
 * home-expansion.test.mjs — 第 29 批 HOME-EXPANSION（设计 MEMORY.md §9）：
 * T-H1–T-H6 展开器形态表 / T-H7–T-H10 loadConfig 单点归一 / T-H11–T-H12 projectDir 消费侧基准解析 /
 * T-H13 team.dir / T-H14 伪 HOME 端到端（slow）/ T-H15 README 对齐。
 * 快层零网络、零真实 home 写入（home 全部注入 / tmp 目录）。
 */
import { test, after } from "node:test"
import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { homedir, tmpdir } from "node:os"
import { isAbsolute, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { slow } from "./slow.mjs"
import { expandHome } from "../src/expand-home.mjs"
import { configDir, loadConfig, _setConfigPathForTest, _resetConfigPathForTest } from "../src/config.mjs"
import { teamConfig } from "../src/cli/make-agent.mjs"
import { createMemory, memoryTools } from "../src/memory.mjs"

const ROOT = fileURLToPath(new URL("..", import.meta.url))
const HOME = homedir() // 仅作字符串断言基准——本档零真实 home 写入

const tmpDirs = []
const tmp = (prefix) => { const d = mkdtempSync(join(tmpdir(), prefix)); tmpDirs.push(d); return d }
after(() => { for (const d of tmpDirs) rmSync(d, { recursive: true, force: true }) })

/** loadConfig 夹具：tmp config.json + _setConfigPathForTest（同 test/config-merge.test.mjs 缝）。 */
function withConfig(content, fn) {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-home-cfg-"))
  const p = join(dir, "config.json")
  writeFileSync(p, JSON.stringify(content, null, 2) + "\n", "utf8")
  try {
    _setConfigPathForTest(p)
    return fn(p)
  } finally {
    _resetConfigPathForTest()
    rmSync(dir, { recursive: true, force: true })
  }
}

// ── T-H1–T-H6：展开器形态表（F11 / AC-H2） ───────────────────────────────────

test("T-H1 正常：裸 ~ → home", () => {
  assert.equal(expandHome("~", HOME), HOME)
})

test("T-H2 正常：~/a/b → join(home, a/b)", () => {
  assert.equal(expandHome("~/a/b", HOME), join(HOME, "a/b"))
})

test("T-H3 边界：~\\a\\b → 余段分隔符归一（跨平台同式）", () => {
  assert.equal(expandHome("~\\a\\b", HOME), join(HOME, "a/b"))
})

test("T-H4 边界：尾分隔符 ~/ · ~\\ → home（join 归一）", () => {
  assert.equal(expandHome("~/", HOME), HOME)
  assert.equal(expandHome("~\\", HOME), HOME)
})

test("T-H5 边界：~user / 串中 ~ / ~~ → 原样（仅前缀形态）", () => {
  for (const v of ["~user/x", "~abc", "a/~/b", "~~"]) {
    assert.equal(expandHome(v, HOME), v, `${v} 原样透传`)
  }
})

test("T-H6 错误（类型）：非字符串 → 原样且不抛（team.dir 未设 = undefined 透传）", () => {
  for (const v of [null, undefined, 42, {}, ""]) {
    assert.equal(expandHome(v, HOME), v, `${String(v)} 原样透传`)
  }
})

// ── T-H7–T-H10：loadConfig 单点归一（F10 / N9） ──────────────────────────────

test("T-H7 正常：四字段全 ~ 夹具 → loadConfig 全部展开（AC-H1）", () => {
  withConfig({
    memory: { dbPath: "~/data/memory.db", projectDir: "~/pdata", team: { repo: "r:1", dir: "~/teams/t" } },
    shell: "~/bin/bash",
  }, () => {
    const c = loadConfig()
    assert.equal(c.memory.dbPath, join(HOME, "data/memory.db"))
    assert.equal(c.memory.projectDir, join(HOME, "pdata"))
    assert.equal(c.memory.team.dir, join(HOME, "teams/t"))
    assert.equal(c.shell, join(HOME, "bin/bash"))
    for (const v of [c.memory.dbPath, c.memory.projectDir, c.memory.team.dir, c.shell]) {
      assert.equal(v.startsWith("~"), false, `${v} 无 ~ 前缀`)
    }
  })
})

test("T-H8 正常（零变）：空夹具 → 默认值逐字（N7）", () => {
  withConfig({}, () => {
    const c = loadConfig()
    assert.equal(c.memory.dbPath, join(configDir, "memory.db"))
    assert.equal(c.memory.projectDir, ".thincoder/memory")
    assert.equal(c.shell, null)
    assert.equal(c.memory.team, null)
  })
})

test("T-H9 边界：team 无 dir / 非对象 → 不抛；无 dir 键不注入（零键面变化）", () => {
  withConfig({ memory: { dbPath: "~/x.db", team: { repo: "r:1" } } }, () => {
    const c = loadConfig()
    assert.equal("dir" in c.memory.team, false, "无 dir 不补键")
    assert.equal(c.memory.dbPath, join(HOME, "x.db"), "其余字段照展")
  })
  withConfig({ memory: { team: "abc", projectDir: "~/p" } }, () => {
    const c = loadConfig()
    assert.equal(c.memory.team, "abc", "非对象 team 原样")
    assert.equal(c.memory.projectDir, join(HOME, "p"))
  })
})

test("T-H10 正常：只读归一——读配置前后磁盘字节相等（AC-H8 / N9）", () => {
  withConfig({ memory: { dbPath: "~/.thincoder/memory.db", projectDir: "~/p" }, shell: "~/bin/bash" }, (p) => {
    const before = readFileSync(p)
    loadConfig()
    assert.deepEqual(readFileSync(p), before, "config.json 字节零改")
  })
})

// ── T-H11–T-H13：projectDir 消费语义 / team.dir（F12） ───────────────────────

test("T-H11 正常：绝对 projectDir 消费面原样使用（AC-H3 前半）", async () => {
  const base = tmp("thincoder-home-abs-")
  const abs = join(base, "projAbs")
  const mem = createMemory({ dbPath: ":memory:" })
  try {
    const tool = memoryTools(mem, { cwd: base, projectDir: abs, author: "tester" }).find((t) => t.name === "memory")
    const out = await tool.execute({ action: "put", layer: "project", type: "knowledge", title: "abs-dir", content: "absolute projectDir lands under the dir itself" })
    assert.ok(out.startsWith(`Saved to project memory (id=project:${abs}:`), out)
    const files = readdirSync(abs)
    assert.equal(files.length, 1, "文件落 <绝对 tmp> 下")
    assert.ok(existsSync(join(abs, files[0])))
    assert.equal(existsSync(join(base, abs)), false, "join(cwd, <绝对 tmp>) 形态路径不存在")
  } finally { mem.db.close() }
})

test("T-H12 正常（零变）：相对 projectDir 逐字保持 join(cwd, p)（AC-H3 后半 / N7）", async () => {
  const base = tmp("thincoder-home-rel-")
  const mem = createMemory({ dbPath: ":memory:" })
  try {
    const tool = memoryTools(mem, { cwd: base, projectDir: "projA", author: "tester" }).find((t) => t.name === "memory")
    const out = await tool.execute({ action: "put", layer: "project", type: "knowledge", title: "rel-dir", content: "relative projectDir keeps project-root semantics" })
    const dir = join(base, "projA")
    assert.ok(out.startsWith(`Saved to project memory (id=project:${dir}:`), out)
    assert.equal(readdirSync(dir).length, 1, "目录 === join(cwd, projA)")
  } finally { mem.db.close() }
})

test("T-H13 边界：team.dir ~ 展开经 teamConfig 绝对原样（AC-H1 / F12）", () => {
  withConfig({ memory: { team: { repo: "r:1", dir: "~/t" } } }, () => {
    const tc = teamConfig(loadConfig())
    assert.equal(tc.dir, join(HOME, "t"), "绝对原样，无 cwd 前缀")
  })
})

// ── T-H14：伪 HOME 端到端（slow——真实 fs 写 + 子进程） ──────────────────────

slow("T-H14 端到端：伪 HOME 子进程——DB 落 HOME 下 ∧ <cwd>/~ 不存在（AC-H4 / F13）", () => {
  const fakeHome = tmp("thincoder-home-e2e-home-")
  const cwd = tmp("thincoder-home-e2e-cwd-")
  mkdirSync(join(fakeHome, ".thincoder"), { recursive: true })
  writeFileSync(join(fakeHome, ".thincoder", "config.json"), JSON.stringify({
    memory: { dbPath: "~/data/memory.db", projectDir: "~/pdata" },
  }), "utf8")
  const modUrl = (rel) => JSON.stringify(pathToFileURL(join(ROOT, rel)).href)
  const script = [
    `import { loadConfig } from ${modUrl("src/config.mjs")}`,
    `import { createMemory } from ${modUrl("src/memory.mjs")}`,
    `const c = loadConfig()`,
    `createMemory({ dbPath: c.memory.dbPath })`,
    `console.log(JSON.stringify({ dbPath: c.memory.dbPath, projectDir: c.memory.projectDir }))`,
  ].join("\n")
  const r = spawnSync(process.execPath, ["--input-type=module", "-e", script], {
    cwd, env: { ...process.env, HOME: fakeHome, USERPROFILE: fakeHome }, encoding: "utf8", timeout: 60_000,
  })
  assert.equal(r.status, 0, r.stderr)
  const seen = JSON.parse(r.stdout.trim().split("\n").pop())
  assert.equal(seen.dbPath, join(fakeHome, "data", "memory.db"), "dbPath 展开为伪 HOME 下绝对路径")
  assert.equal(seen.projectDir, join(fakeHome, "pdata"))
  assert.equal(seen.dbPath.startsWith("~"), false, "stdout 无 ~ 前缀")
  assert.equal(seen.projectDir.startsWith("~"), false, "stdout 无 ~ 前缀")
  assert.ok(existsSync(join(fakeHome, "data", "memory.db")), "DB 落伪 HOME 下")
  assert.equal(existsSync(join(cwd, "~")), false, "<cwd>/~ 不存在")
})

// ── T-H15：静态面（README 示例值展开） ───────────────────────────────────────

test("T-H15 静态：README L1–L4 逐字命中 + 示例值展开可用（AC-H5 / F14）", () => {
  const readme = readFileSync(join(ROOT, "README.md"), "utf8")
  const m = /"dbPath"\s*:\s*"([^"]+)"/.exec(readme)
  assert.ok(m, "README 含 dbPath 示例值")
  const expanded = expandHome(m[1], HOME)
  assert.equal(isAbsolute(expanded), true, "示例值展开后为绝对路径")
  assert.equal(expanded.startsWith("~"), false, "无 ~ 前缀")
  assert.equal(expanded, join(HOME, ".thincoder/memory.db"))
})
