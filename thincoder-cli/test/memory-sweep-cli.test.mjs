/**
 * memory-sweep-cli.test.mjs — CLI 命令入口面（CLI-ENTRY.md §4——台账 #350 机检形；批 §2 用例
 * MS-1/2/3）：① 源码 token 机检（memory 分发 + sweep 分支 + SWEEP_USAGE + 三旗标）；② 三套补全
 * 输出横深机检（sweep 三旗标 + 顶层 `ledger`，bash 另锁发射字节形）；③ 解析面行为边界（错分支
 * 返 1 + usage——零触库）。
 * 全例 = 源码 / 输出 token 结构机检（禁散文锚——不读非测试文档）。
 * 子进程面沙箱纪律：假 HOME（`USERPROFILE` / `HOME` → temp ⇒ crash-reports 落 temp——入口无条件
 * `prepareCrashReporting()`）——**禁触真实 `~/.thincoder`**（先例 = `session-gc-cli.test.mjs` 沙箱段）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs"
import { spawnSync } from "node:child_process"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { memoryCommand } from "../src/cli/memory-command.mjs"

const CLI = join(fileURLToPath(new URL(".", import.meta.url)), "..")
const BIN = join(CLI, "bin", "thincoder.mjs")
const SWEEP_USAGE = "Usage: thincoder memory sweep [--origin <o>] [--dry-run|--confirm]"

const dirs = []
const tmpRoot = (p) => { const d = mkdtempSync(join(tmpdir(), p)); dirs.push(d); return d }
process.on("exit", () => { for (const d of dirs) { try { rmSync(d, { recursive: true, force: true }) } catch { /* ignore */ } } })

/** 沙箱 env：假 HOME（`homedir()` 读到 ⇒ `configDir` = `<home>/.thincoder`——先例同式）——零触真实 `~/.thincoder`。 */
function sandboxEnv() {
  const home = tmpRoot("tc-ms-cli-")
  return { ...process.env, USERPROFILE: home, HOME: home }
}

test("MS-1 源码 token 机检：memory 分发 + sweep 分支 + SWEEP_USAGE 行 + 三旗标（解析面）", () => {
  const bin = readFileSync(BIN, "utf8")
  const mem = readFileSync(join(CLI, "src", "cli", "memory-command.mjs"), "utf8")
  assert.match(bin, /case "memory": \{/, "memory 分发块在位")
  const parse = mem.match(/function parseSweepArgs\(rest\) \{[\s\S]*?\n\}/)
  assert.ok(parse, "parseSweepArgs 解析面在档")
  for (const token of ["--origin", "--dry-run", "--confirm"]) assert.ok(parse[0].includes(token), `旗标 token 在解析面：${token}`)
  assert.match(mem, /case "sweep": \{/, "sweep 分支在位")
  assert.ok(mem.includes(`const SWEEP_USAGE = "${SWEEP_USAGE}"`), "SWEEP_USAGE 行（逐字）")
})

test("MS-2 三套补全横深：sweep 三旗标 + 顶层 ledger（子进程实跑——假 HOME 沙箱）", () => {
  const env = sandboxEnv()
  const run = (shell) => {
    const r = spawnSync(process.execPath, [BIN, "completion", shell], { env, encoding: "utf8", timeout: 60_000 })
    assert.equal(r.status, 0, `${shell} 退出码 0`)
    return r.stdout
  }
  const bash = run("bash")
  for (const t of ["--origin=", "--dry-run", "--confirm"]) assert.ok(bash.includes(t), `bash sweep 旗标：${t}`)
  assert.ok(bash.includes(" session ledger -v --version -h --help"), "bash 顶层词 ledger（词表段）")
  // 发射字节形段（源档两反斜杠 → 发射单反斜杠；与同族行同形——锁改形漂移）
  assert.ok(bash.includes('\\$(compgen -W "--origin= --dry-run --confirm" -- "\\$cur"'), "bash 发射字节形段")
  const zsh = run("zsh")
  for (const t of ["--origin=", "--dry-run", "--confirm"]) assert.ok(zsh.includes(t), `zsh sweep 旗标：${t}`)
  assert.ok(zsh.includes("'ledger[Ledger variants: migrate / audit]'"), "zsh 顶层词 ledger（_values 入口行）")
  const fish = run("fish")
  for (const t of ["-l origin", "-l dry-run", "-l confirm"]) assert.ok(fish.includes(t), `fish sweep 旗标：${t}`)
  assert.ok(fish.includes("-a ledger"), "fish 顶层词 ledger（子命令入口行）")
})

test("MS-3 行为边界：解析错分支 ⇒ 返回 1 + SWEEP_USAGE（stderr 面）；零触库", async () => {
  const dbPath = join(tmpRoot("tc-ms-db-"), "index.db")
  const errs = []
  const orig = console.error
  console.error = (...a) => errs.push(a.join(" "))
  try {
    for (const args of [["sweep", "--dry-run", "--confirm"], ["sweep", "--bogus"], ["sweep", "--origin="]]) {
      errs.length = 0
      assert.equal(await memoryCommand({}, args, { dbPath }), 1, `拒：${JSON.stringify(args)}`)
      assert.ok(errs.includes(SWEEP_USAGE), `SWEEP_USAGE 逐字（stderr）：${JSON.stringify(args)}`)
    }
  } finally { console.error = orig }
  assert.ok(!existsSync(dbPath), "解析错分支零触库（注入 dbPath 未建）")
})
