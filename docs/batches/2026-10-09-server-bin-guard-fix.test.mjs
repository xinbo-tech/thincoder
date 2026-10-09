/**
 * 2026-10-09-server-bin-guard-fix.test.mjs — 批次本地单测件（#1113 · bin 入口 guard 修复——`argv[1]` realpath 判据；随批留存归档）。
 * 名随批次档 · 住批次目录 · 不进仓套件；复跑（任意 cwd 可跑——仓根经 import.meta.url 定位）：
 *   node --test docs/batches/2026-10-09-server-bin-guard-fix.test.mjs
 *
 * 腿 = 批档 §2.5 红绿表（红基线 = 修复前实跑读数 ∥ 绿 = 修复后复跑读数——批档 §5 实施记录）：
 *   T1 文件符号链接（npm 全局装 POSIX 垫片形）：`node <link>`（无 `--config`）⇒ 退 1 + stdout 含 `startup_failed`；
 *   T2 目录连接（junction——win32 无特权互补形）：`node <junc>/bin/thincoder-server.mjs` ⇒ 同读数；
 *   T3 非回归：`node <真身路径>`（无 `--config`）⇒ 同读数（既有行为零变）；
 *   T4 导入语义：import 该模块（非主入口）⇒ `run` 不自动执行、导出在场；
 *   T5 不可解析 ⇒ 显式失败：伪 `argv[1]`（不存在路径）+ 动态导入 ⇒ 非静默（退非 0 + 报错可见）；
 *   守卫：单腿不可建 ⇒ 显式 skip「能力前提缺失」；两腿俱不可建 ⇒ 测试失败（fail-closed）。
 */
import test, { after } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, realpathSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from "node:fs"
import { spawnSync } from "node:child_process"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const ROOT = fileURLToPath(new URL("../../", import.meta.url)) // 仓根（thincoder/）
const BIN = join(ROOT, "thincoder-server", "bin", "thincoder-server.mjs")
const SRV = join(ROOT, "thincoder-server")

const out = (label, value) => console.log(`[读数] ${label}: ${value}`)
/** 跑 node 子进程（同解释器 = process.execPath；超时护栏——挂起 ⇒ status null 显式可见）。 */
const runNode = (args) => spawnSync(process.execPath, args, { encoding: "utf8", timeout: 30000 })
const tail = (s) => JSON.stringify(String(s ?? "").trim().slice(0, 200))

/* ── 建链（能力前提：win32 免特权形 = junction；文件符号链接需开发者模式/权限） ────────────── */

const box = realpathSync(mkdtempSync(join(tmpdir(), "sbg-bin-guard-")))
const T1_LINK = join(box, "thincoder-server") // 生产垫片形：无扩展名符号链接（npm 全局装 POSIX bin）
const T2_LINK = join(box, "srv-junc")         // 目录连接形
let T1_OK = false
let T2_OK = false
try { symlinkSync(BIN, T1_LINK, "file"); T1_OK = true } catch { /* 能力前提缺失——腿内 skip */ }
try { symlinkSync(SRV, T2_LINK, "junction"); T2_OK = true } catch { /* 能力前提缺失——腿内 skip */ }
after(() => {
  for (const p of [T1_LINK, T2_LINK]) { try { unlinkSync(p) } catch { /* 未建/已清 */ } }
  try { rmSync(box, { recursive: true, force: true }) } catch { /* 临时域残件不影响判据 */ }
})

test("守卫 建链能力：两腿俱不可建 ⇒ 失败（fail-closed）", () => {
  assert.ok(T1_OK || T2_OK, "两腿俱不可建——能力前提缺失（文件符号链接 ∥ 目录连接均不可用）")
  out("守卫", `文件符号链接可建 = ${T1_OK} · 目录连接可建 = ${T2_OK}`)
})

test("T1 文件符号链接（npm 垫片形）：退 1 + stdout 含 `startup_failed`（现码红：退 0 零输出）", (t) => {
  if (!T1_OK) return t.skip("能力前提缺失——文件符号链接不可建")
  const r = runNode([T1_LINK])
  out("T1", `status=${r.status} · stdout=${tail(r.stdout)} · stderr=${tail(r.stderr)}`)
  assert.equal(r.status, 1, "退 1 = 真执行（静默退 0 = 缺陷形态——`run` 从未执行）")
  assert.ok(String(r.stdout).includes("startup_failed"), "stdout 含 `startup_failed`")
})

test("T2 目录连接（junction）：同读数（现码红：退 0 零输出）", (t) => {
  if (!T2_OK) return t.skip("能力前提缺失——目录连接不可建")
  const r = runNode([join(T2_LINK, "bin", "thincoder-server.mjs")])
  out("T2", `status=${r.status} · stdout=${tail(r.stdout)} · stderr=${tail(r.stderr)}`)
  assert.equal(r.status, 1, "退 1 = 真执行（静默退 0 = 缺陷形态）")
  assert.ok(String(r.stdout).includes("startup_failed"), "stdout 含 `startup_failed`")
})

test("T3 非回归：`node <真身路径>` ⇒ 同读数（零变）", () => {
  const r = runNode([BIN])
  out("T3", `status=${r.status} · stdout=${tail(r.stdout)} · stderr=${tail(r.stderr)}`)
  assert.equal(r.status, 1, "退 1")
  assert.ok(String(r.stdout).includes("startup_failed"), "stdout 含 `startup_failed`")
  assert.ok(String(r.stdout).includes("缺少 --config"), "缺 `--config` 显式报错在案")
})

test("T4 导入语义：非主入口 import ⇒ `run` 不自动执行 + 导出在场", async () => {
  const m = await import(pathToFileURL(BIN).href) // 本进程 argv[1] = 本件（存在、非 bin）⇒ 判据假
  assert.equal(typeof m.run, "function", "导出 `run`")
  assert.equal(typeof m.parseArgs, "function", "导出 `parseArgs`")
  assert.equal(typeof m.closeApp, "function", "导出 `closeApp`")
  assert.equal(typeof m.USAGE, "string", "导出 `USAGE`")
  const drv = join(box, "t4-driver.mjs")
  writeFileSync(drv, [
    'import { pathToFileURL } from "node:url"',
    `const m = await import(${JSON.stringify(pathToFileURL(BIN).href)})`,
    'console.log(JSON.stringify({ run: typeof m.run, USAGE: typeof m.USAGE, exitCode: process.exitCode ?? null }))',
    "",
  ].join("\n"))
  const r = runNode([drv])
  out("T4", `status=${r.status} · stdout=${tail(r.stdout)} · stderr=${tail(r.stderr)}`)
  assert.equal(r.status, 0, "导入零副作用（退 0）")
  assert.ok(!String(r.stdout).includes("startup_failed"), "`run` 不自动执行（无 `startup_failed`）")
  const j = JSON.parse(String(r.stdout).trim())
  assert.equal(j.run, "function", "子进程侧导出在场")
  assert.equal(j.exitCode, null, "未走启动路径（`exitCode` 未置）")
})

test("T5 不可解析 ⇒ 显式失败：伪 `argv[1]`（不存在路径）+ 动态导入 ⇒ 非静默", (t) => {
  const drv = join(box, "t5-driver.mjs")
  try {
    writeFileSync(drv, [
      'import { pathToFileURL } from "node:url"',
      `process.argv[1] = ${JSON.stringify(join(box, "definitely-missing", "nope.mjs"))}`,
      `await import(${JSON.stringify(pathToFileURL(BIN).href)})`,
      "",
    ].join("\n"))
  } catch {
    return t.skip("能力前提缺失——构造不可达")
  }
  const r = runNode([drv])
  out("T5", `status=${r.status} · stdout=${tail(r.stdout)} · stderr=${tail(r.stderr)}`)
  assert.notEqual(r.status, 0, "静默退 0 = 缺陷形态（不可解析被吞）")
  assert.ok(String(r.stderr).includes("ENOENT"), "报错可见（显式，不静默）")
})
