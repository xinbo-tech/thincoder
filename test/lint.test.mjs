/**
 * lint.test.mjs — 零依赖 lint 基建测试（TOOLS.md §10.2）。
 *
 * T-L1  check-syntax 全量默认集通过（slow：207 个 node --check 子进程）
 * T-L3  无 eslint 引用残留（package.json / scripts/ / src/**，评审 round2 #1 扩范围）
 * T-L4  check-syntax 失败路径：坏文件 → 非零退出 + 错误文件出现在清单
 */
import { test } from "node:test"
import { slow } from "./slow.mjs"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync, readFileSync, readdirSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")
const SCRIPT = join(ROOT, "scripts", "check-syntax.mjs")

test("T-L3: 无 eslint 引用残留（package.json + scripts/ + src/**，评审 round2 #1 扩范围）", () => {
  const pkg = readFileSync(join(ROOT, "package.json"), "utf8")
  assert.ok(!/eslint/i.test(pkg), "package.json 无 eslint（devDeps + lint script 已清除）")
  const lock = readFileSync(join(ROOT, "package-lock.json"), "utf8")
  assert.ok(!/eslint/i.test(lock), "package-lock.json 无 eslint（审计补盲：lock 与 package.json 脱同步会让 npm ci 仍装 eslint）")
  for (const f of readdirSync(join(ROOT, "scripts")).filter((x) => x.endsWith(".mjs"))) {
    const text = readFileSync(join(ROOT, "scripts", f), "utf8")
    assert.ok(!/eslint/i.test(text), `scripts/${f} 无 eslint 引用`)
  }
  // src/** 全量扫描（评审 round2 #1：从 package.json/scripts 扩至 src）
  const hits = []
  const walk = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (e.name.startsWith(".") || e.name === "node_modules") continue
      const p = join(dir, e.name)
      if (e.isDirectory()) walk(p)
      else if (/\.(?:mjs|md)$/.test(e.name)) {
        if (p.endsWith("lint.test.mjs")) continue // 豁免自身——测试名含 "eslint 引用残留" 字样
        const text = readFileSync(p, "utf8")
        if (/eslint/i.test(text)) hits.push(p)
      }
    }
  }
  walk(join(ROOT, "src"))
  walk(join(ROOT, "test"))
  assert.deepEqual(hits, [], "src/** + test/** 无 eslint 引用残留")
})

test("T-L4: check-syntax 失败路径——坏文件非零退出 + 错误文件出现在清单", async () => {
  const dir = mkdtempSync(join(tmpdir(), "thincoder-lint-"))
  try {
    const good = join(dir, "good.mjs")
    const bad = join(dir, "bad.mjs")
    writeFileSync(good, "const x = 1\n")
    writeFileSync(bad, "const x = \n") // 故意写坏
    const { spawnSync } = await import("node:child_process")
    // 好文件：退出 0
    const ok = spawnSync(process.execPath, [SCRIPT, good], { encoding: "utf8" })
    assert.equal(ok.status, 0, ok.stderr || ok.stdout)
    assert.match(ok.stdout, /1 file\(s\) OK/)
    // 坏文件：非零退出 + 错误文件出现在清单
    const fail = spawnSync(process.execPath, [SCRIPT, good, bad], { encoding: "utf8" })
    assert.notEqual(fail.status, 0, "坏文件必须非零退出")
    assert.match(fail.stderr, /failed node --check/)
    assert.match(fail.stderr, /bad\.mjs/, "错误文件出现在清单")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

slow("T-L1: check-syntax 全量默认集通过（node --check 全语法 0 报错）", async () => {
  const { spawnSync } = await import("node:child_process")
  const r = spawnSync(process.execPath, [SCRIPT], { encoding: "utf8", cwd: ROOT })
  assert.equal(r.status, 0, r.stderr || r.stdout)
  assert.match(r.stdout, /file\(s\) OK/)
})
