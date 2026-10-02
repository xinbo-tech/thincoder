/**
 * 2026-10-01-batch-file-mount-normalize.test.mjs — 批次本地单元件（#788 批内件挂载面归一 · 随批留存归档）。
 * 名随批次档 · 住批次目录 · 不进仓套件；复跑 = 从仓库根 `thincoder/`：
 *   node --test docs/batches/2026-10-01-batch-file-mount-normalize.test.mjs
 *
 * 腿 = 批档 §2.9（最小化设计）：
 *   L1 源面锁——拆后 17 件逐档正锚（junction 取件串 ∥ `/rc/i18n.mjs`）在位 ∧ 旧直路负锚缺席；
 *   L2 双拼写实跑——抽样三档 × 2 拼写（`d:` ∥ `D:`）双双 exit 0（灵敏度先证 = §2.2 两件修前 `d:` 红基线在册）；
 *   L3 隔离面——session-title 复跑前后实 sessions 根族清单差集空（修前逃逸写 4 族 = 灵敏度先证）；
 *   L4 规范在档锁——TESTING.md §2.2 ∥ canon 先例（b1:117）指针在位。
 * 触发面全件覆盖 = AC-6（全件 `d:` 复跑——读数登记与归因 = 批档 §5/§6；本件 = 抽样锚）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { existsSync, readdirSync, readFileSync } from "node:fs"
import { spawnSync } from "node:child_process"
import { join } from "node:path"

const ROOT = process.cwd()
if (!existsSync(join(ROOT, "thincoder-core"))) throw new Error(`须从仓库根（thincoder/）运行——cwd = ${ROOT}`)
const B = (name) => join(ROOT, "docs", "batches", name)
const read = (name) => readFileSync(B(name), "utf8")

// ─── L1 源面锁（拆后 17 件：逐档正锚 ∥ 负锚）────────────────────────────────────

const L1 = [
  ["2026-09-29-parity-b1-vsc-core.test.mjs",
    ["thincoder-vscode/node_modules/@thincoder/core/session-slots.mjs", "thincoder-vscode/node_modules/@thincoder/core/agent/helpers.mjs", "thincoder-vscode/node_modules/@thincoder/core/agent/suspension.mjs"],
    ['mod("thincoder-core/session-slots.mjs")', 'mod("thincoder-core/agent/helpers.mjs")', 'mod("thincoder-core/agent/suspension.mjs")']],
  ["2026-09-29-parity-b1-vsc-core-susp.test.mjs", [], ['mod("thincoder-core/session-slots.mjs")']],
  ["2026-09-29-parity-b1-vsc-core-loop.test.mjs",
    ["thincoder-vscode/node_modules/@thincoder/core/agent/helpers.mjs"], ['mod("thincoder-core/agent/helpers.mjs")']],
  ["2026-09-29-parity-b1-vsc-core-host.test.mjs",
    ["thincoder-vscode/node_modules/@thincoder/core/agent/helpers.mjs"], ['pathToFileURL(resolve(ROOT, "thincoder-core/agent/helpers.mjs"))']],
  ["2026-09-29-parity-b4-vsc-small.test.mjs",
    ["thincoder-desktop/node_modules/@thincoder/core/config-io.mjs", 'canon("thincoder-desktop/'], ['mod("thincoder-core/config-io.mjs")']],
  ["2026-09-30-vsc-paste-cleanup.test.mjs",
    ["thincoder-vscode/node_modules/@thincoder/core/agent/helpers.mjs"], ['mod("thincoder-core/agent/helpers.mjs")']],
  ["2026-09-29-missing-face-family.test.mjs",
    ["../../thincoder-desktop/node_modules/@thincoder/core/agent.mjs"], ['from "../../thincoder-core/agent.mjs"']],
  ["2026-09-29-model-menu-parity.test.mjs",
    ["thincoder-desktop/node_modules/@thincoder/core/config-io.mjs"], ['mod("thincoder-core/config-io.mjs")']],
  ["2026-09-29-vsc-carryover-settings.test.mjs",
    ["../../thincoder-vscode/node_modules/@thincoder/core/config-io.mjs"], ['"../../thincoder-core/config-io.mjs"']],
  ["2026-09-30-vsc-residuals.test.mjs",
    ['join(ROOT, "thincoder-vscode", "node_modules", "@thincoder", "core", rel)'], ['join(ROOT, "thincoder-core", rel)']],
  ["2026-09-29-hatch-clearance-2.test.mjs",
    ["thincoder-desktop/node_modules/@thincoder/core/provider/list-models.mjs"], ['at("thincoder-core/provider/list-models.mjs")']],
  ["2026-09-30-crossline-clearance-vsc.test.mjs",
    ['join(ROOT, "thincoder-vscode", "node_modules", "@thincoder", "core", rel)'], ['join(ROOT, "thincoder-core", rel)']],
  ["2026-09-28-desktop-session-title.test.mjs",
    ["../../thincoder-desktop/node_modules/@thincoder/core/context.mjs"], ['from "../../thincoder-core/context.mjs"']],
  ["2026-09-29-desktop-susp-queue.test.mjs",
    ["thincoder-desktop/node_modules/@thincoder/core/session-slots.mjs"], ['mod("thincoder-core/session-slots.mjs")']],
  ["2026-09-29-desktop-window-queue-parity.test.mjs",
    ["thincoder-desktop/node_modules/@thincoder/core/session-slots.mjs"], ['mod("thincoder-core/session-slots.mjs")']],
  ["2026-09-29-parity-b8-ipc.test.mjs",
    ['join(root, "thincoder-desktop", "node_modules", "@thincoder", "core", rel)'], ['join(root, "thincoder-core", rel)']],
  ["2026-09-29-desktop-carryover-c2.test.mjs",
    ['import("/rc/i18n.mjs")'], ['"../../thincoder-render-core/i18n.mjs"']],
]

test("L1 源面锁：拆后 17 件逐档正锚在位 ∥ 旧直路负锚缺席", () => {
  for (const [file, pos, neg] of L1) {
    const src = read(file)
    for (const p of pos) assert.ok(src.includes(p), `${file} 正锚缺席：${p}`)
    for (const n of neg) assert.ok(!src.includes(n), `${file} 旧直路负锚在场：${n}`)
  }
})

// ─── L2 双拼写实跑（抽样三档 × 2——灵敏度 = §2.2 两件修前 `d:` 红基线在册）────────

test("L2 双拼写实跑：paste-cleanup ∥ session-title ∥ b4 双态 exit 0", () => {
  const files = [
    "2026-09-30-vsc-paste-cleanup.test.mjs",
    "2026-09-28-desktop-session-title.test.mjs",
    "2026-09-29-parity-b4-vsc-small.test.mjs",
  ]
  for (const cwd of ["d:\\teamcode\\thincoder", "D:\\teamcode\\thincoder"]) {
    for (const f of files) {
      const r = spawnSync(process.execPath, ["--test", join("docs", "batches", f)], { cwd, encoding: "utf8", timeout: 180000 })
      assert.equal(r.status, 0, `${cwd} × ${f} exit=${r.status}\n${(r.stdout || "").slice(-800)}\n${(r.stderr || "").slice(-400)}`)
    }
  }
})

// ─── L3 隔离面（写面档复跑前后实 sessions 根族清单差集 —— 修前逃逸写 4 族 = 灵敏度先证）──

test("L3 隔离面：session-title 复跑前后实 sessions 根族差集空", () => {
  const SESS = join(process.env.USERPROFILE ?? process.env.HOME ?? "", ".thincoder", "sessions")
  assert.ok(existsSync(SESS), `sessions 根缺席：${SESS}`)
  const fams = () => new Set(readdirSync(SESS).map((n) => n.split(".")[0]).filter((p) => /^[0-9a-f]{40}$/.test(p)))
  const before = fams()
  const r = spawnSync(process.execPath, ["--test", join("docs", "batches", "2026-09-28-desktop-session-title.test.mjs")], { cwd: ROOT, encoding: "utf8", timeout: 180000 })
  assert.equal(r.status, 0, `session-title 复跑非零：\n${(r.stdout || "").slice(-800)}`)
  const after = fams()
  const added = [...after].filter((p) => !before.has(p))
  assert.deepEqual(added, [], `复跑新增族：${added.join(", ")}`)
})

// ─── L4 规范在档锁 ────────────────────────────────────────────────────────────

test("L4 规范在档：TESTING.md §2.2 批内件挂载面规范 ∥ b1:117 先例在册", () => {
  const t = readFileSync(join(ROOT, "docs", "core", "design", "TESTING.md"), "utf8")
  assert.ok(t.includes("批内件挂载面规范"), "§2.2 标题缺席")
  assert.ok(t.includes("docs/batches/2026-09-29-parity-b1-vsc-core.test.mjs:117"), "canon 先例指针缺席")
})
