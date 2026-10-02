/**
 * 2026-09-30-defect-fixes-cli.test.mjs — 缺陷修复批（#704）CLI 面批内单测件（MS-2 锁定形新载体）。
 * 名随批次档 · 住批次目录 · 不进仓套件；复跑（仓根）= `node --test docs/batches/2026-09-30-defect-fixes-cli.test.mjs`。
 * 判据面 = 批档 §2 条 2 + `docs/cli/design/CLI-ENTRY.md` §3（发射契约）∥ §4（MS-2）。载体收正：
 * 原宿主 `thincoder-cli/test/memory-sweep-cli.test.mjs` 随测试树全清重置退场 ⇒ 本件承接（回迁 = 重建轮）。
 *   锁面：① MS-2 核（三套各含 sweep 三旗标 token + 顶层 `ledger`；子进程驱动 + 沙箱 env）；
 *   ② bash 发射字节形逐字（直写形 —— 零反斜杠）；③ zsh 分派行直写形；④ fish 旗标 token；
 *   ⑤ 旧形零残留（bash ∥ zsh 发射面零 `\$`）+ JS 插值险位 `${…}` 保留。
 * 真壳腿 = 环境依赖（bash = Git Bash 在盘由实施轮实跑：`-n` 语法 + source 冒烟；zsh ∕ fish 本机不可得
 * ⇒ 静态字节锁 + §5 披露「真壳未跑」）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { mkdtempSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

const ROOT = process.cwd()
const ENTRY = join("thincoder-cli", "bin", "thincoder.mjs")
// 沙箱 env（CLI-ENTRY.md §3 测试沙箱纪律：入口无条件 prepareCrashReporting ⇒ 禁触真实 ~/.thincoder）
const SANDBOX_HOME = mkdtempSync(join(tmpdir(), "dx704-home-"))
const ENV = { ...process.env, HOME: SANDBOX_HOME, USERPROFILE: SANDBOX_HOME }

function emit(shell) {
  const r = spawnSync(process.execPath, [ENTRY, "completion", shell], { cwd: ROOT, env: ENV, encoding: "utf8" })
  assert.equal(r.status, 0, `completion ${shell} 退出 0（stderr：${r.stderr || "—"}）`)
  assert.ok(r.stdout.length > 0, `completion ${shell} 有发射`)
  return r.stdout
}

const bash = emit("bash")
const zsh = emit("zsh")
const fish = emit("fish")

test("MS-2·三套横深：各含 sweep 三旗标 token（fish 形 = `-l <名>`）∧ 顶层 `ledger`", () => {
  for (const [sh, out, lits] of [
    ["bash", bash, ["--origin=", "--dry-run", "--confirm", "ledger"]],
    ["zsh", zsh, ["--origin=[", "--dry-run[", "--confirm[", "ledger"]],
    ["fish", fish, ["-l origin", "-l dry-run", "-l confirm", "ledger"]],
  ]) {
    for (const lit of lits) assert.ok(out.includes(lit), `${sh} 输出须含 ${lit}`)
  }
  // ledger 族（#677 I8 已对齐）——migrate ∕ audit 双命令面对齐（机检不弱于原 MS-2 射程）
  for (const [sh, out, lits] of [
    ["bash", bash, ["migrate audit", "--from", "--root"]],
    ["zsh", zsh, ["migrate", "audit", "--from:", "--root:"]],
    ["fish", fish, ["migrate audit", "-l from", "-l root"]],
  ]) {
    for (const lit of lits) assert.ok(out.includes(lit), `${sh} ledger 面须含 ${lit}`)
  }
})

test("bash 发射字节形逐字：源档形 ≡ 发射形（直写 —— 零反斜杠）", () => {
  const row = (wordList) => `COMPREPLY=( $(compgen -W "${wordList}" -- "$cur") )`
  for (const wordList of [
    "--auto",
    "list search put remove sweep",
    "--type=rule --type=knowledge --type=decision --type=pattern",
    "--type= --title= --content= --tags=",
    "--origin= --dry-run --confirm",
    "migrate audit",
    "--dry-run --confirm --from",
    "--root",
    "--yes --layer=",
    "bash zsh fish",
    "tui chat acp memory sync reindex distill upgrade completion session ledger -v --version -h --help",
  ]) {
    assert.ok(bash.includes(row(wordList)), `bash 行逐字（直写形）：${wordList}`)
  }
  assert.equal(bash.split('case "$prev" in').length - 1, 2, "分派行 `case \"$prev\" in` 恰两处（memory ∥ ledger）")
  // JS 插值险位（CLI-ENTRY.md §3 例外）：须发射字面 `${…}` 的段在源档保留 `\${` ⇒ 发射面含 `${`
  assert.ok(bash.includes('cur="${COMP_WORDS[COMP_CWORD]}"'), "险位 `${COMP_WORDS[COMP_CWORD]}` 发射保留")
  assert.ok(bash.includes('case "${COMP_WORDS[1]}" in'), "险位 `${COMP_WORDS[1]}` 发射保留")
  assert.ok(bash.includes("complete -F _thincoder thincoder"), "注册行在")
})

test("zsh 分派行直写形：`case \"$state\" in` ∥ `case \"$words[…]\" in`（双引号内直写 `$`）", () => {
  assert.ok(zsh.includes('case "$state" in'), "zsh 一级分派行直写形")
  assert.ok(zsh.includes('case "$words[1]" in'), "zsh 二级分派行（words[1]）直写形")
  assert.equal(zsh.split('case "$words[2]" in').length - 1, 2, "zsh 三级分派行（words[2]）恰两处（memory ∥ ledger）")
  assert.ok(zsh.includes("ledger) case \"$words[2]\" in"), "zsh ledger 分支家族同形")
})

test("旧形零残留：bash ∥ zsh 发射面零 `\\$`（旧转义形逐族零命中）", () => {
  assert.equal(bash.includes("\\$"), false, "bash 发射零 `\\$`")
  assert.equal(zsh.includes("\\$"), false, "zsh 发射零 `\\$`")
  for (const legacy of ["\\$(compgen", '\\$cur"', "\\$prev", "\\$state", "\\$words"]) {
    assert.equal(bash.includes(legacy), false, `bash 旧形零命中：${legacy}`)
    assert.equal(zsh.includes(legacy), false, `zsh 旧形零命中：${legacy}`)
  }
})

test("fish 侧零改锁定（旗标 token 形 ∥ 子命令行逐字）", () => {
  assert.ok(fish.includes("__fish_seen_subcommand_from ledger' -a 'migrate audit'"), "fish 子命令行")
  assert.ok(fish.includes("-n '__fish_seen_subcommand_from memory' -a sweep  -d 'Sweep dead origins'"), "fish memory sweep 行")
  assert.ok(fish.includes("-n '__fish_seen_subcommand_from memory; and __fish_seen_subcommand_from sweep' -l origin"), "fish sweep origin 旗标（直写形）")
})
