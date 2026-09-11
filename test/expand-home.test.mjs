/**
 * expand-home.test.mjs — 群 A 批 A2（VSC-MIRROR-SWEEP）。
 * 设计权威：`docs/design/SETTINGS.md` §2.7（契约 1–3 / 用例 T-MA2-1–5 / AC-MA2-1–2）。
 *
 * 覆盖：展开形态矩阵（前缀 / 裸 / 尾分隔 / 非分隔符 / 类型护栏）+ setup 读取点接线
 * （`shell` 字段单点归一；`agents.config.shell` 收到的一定是绝对路径；只读——磁盘原文不变）。
 */
import test from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs"
import { tmpdir, homedir } from "node:os"
import { join } from "node:path"
import { expandHome } from "../src/expand-home.mjs"
import { buildTopLevelAgent, hydrateRun } from "../src/agent/setup.mjs"
import { _setConfigPathForTest } from "../src/config-io.mjs"
import { _setSessionsDirForTest, _resetSessionsDirForTest } from "../src/extension/session-slots.mjs"

const HOME = join("/home", "u") // 形态断言用注入 home（不依赖真实主目录）

/** 目录清理（Windows 句柄释放滞后——rmSync 偶发 EPERM，短重试兜底；残余交 OS 回收）。 */
async function rmDir(dir) {
  for (let i = 0; i < 6; i++) {
    try { rmSync(dir, { recursive: true, force: true }); return } catch { await new Promise((r) => setTimeout(r, 150)) }
  }
}

// ─── T-MA2-1 正常：`~/…` 展开（AC-MA2-1）────────────────────────────────────────

test("T-MA2-1 `~/bin/bash` → join(home, 'bin/bash')（正斜杠余段）", () => {
  assert.equal(expandHome("~/bin/bash", HOME), join(HOME, "bin/bash"))
  assert.equal(expandHome("~\\bin\\bash", HOME), join(HOME, "bin/bash"), "反斜杠余段归一后同解")
})

// ─── T-MA2-2 边界：裸 `~` / 尾分隔（AC-MA2-1）───────────────────────────────────

test("T-MA2-2 `~` / `~/` / `~\\` → home 本体", () => {
  assert.equal(expandHome("~", HOME), HOME)
  assert.equal(expandHome("~/", HOME), HOME)
  assert.equal(expandHome("~\\", HOME), HOME)
})

// ─── T-MA2-3 边界：非分隔符 / 非前缀（AC-MA2-1）─────────────────────────────────

test("T-MA2-3 `~user/x` / `a/~/b` / `x~` → 原样（只认前缀，不猜用户）", () => {
  for (const v of ["~user/x", "a/~/b", "x~", "~foo"]) {
    assert.equal(expandHome(v, HOME), v, `${JSON.stringify(v)} 原样`)
  }
})

// ─── T-MA2-4 错误：类型护栏（AC-MA2-1）──────────────────────────────────────────

test("T-MA2-4 null / undefined / number / object / array / boolean → 原样透传", () => {
  for (const v of [null, undefined, 42, { p: "~/x" }, ["~/x"], true]) {
    assert.equal(expandHome(v, HOME), v, `${JSON.stringify(v) ?? String(v)} 原样`)
  }
})

// ─── T-MA2-5 接线：setup 读取点归一 + 只读（AC-MA2-2）───────────────────────────

test("T-MA2-5 setup 读取段：`shell: '~/x'` → agent.config.shell = join(homedir(), 'x')；null → null；磁盘原文保留", async () => {
  const dir = mkdtempSync(join(tmpdir(), "expand-home-"))
  const sessionsDir = mkdtempSync(join(tmpdir(), "expand-home-s-"))
  const cfgPath = join(dir, "config.json")
  _setConfigPathForTest(cfgPath)
  _setSessionsDirForTest(sessionsDir)
  const provider = { model: "deepseek-v4-pro" }
  const optsFor = () => ({
    provider, cwd: dir, input: "hi",
    opts: { fullHistory: [{ role: "user", content: "u1" }], engPersist: { cwd: dir, slot: 1 } },
    depth: 0, role: null, getAuto: () => false, restore: true,
  })
  try {
    writeFileSync(cfgPath, JSON.stringify({ shell: "~/x" }))
    const r1 = await hydrateRun(buildTopLevelAgent(), optsFor())
    assert.equal(r1.agent.config.shell, join(homedir(), "x"), "读取点归一（`~` 展开为主目录绝对路径）")
    assert.equal(JSON.parse(readFileSync(cfgPath, "utf8")).shell, "~/x", "只读归一——磁盘原文保留（不写回）")

    writeFileSync(cfgPath, JSON.stringify({ shell: null }))
    const r2 = await hydrateRun(buildTopLevelAgent(), optsFor())
    assert.equal(r2.agent.config.shell, null, "零值形态不变（null 仍 null）")

    writeFileSync(cfgPath, JSON.stringify({}))
    const r3 = await hydrateRun(buildTopLevelAgent(), optsFor())
    assert.equal(r3.agent.config.shell, null, "缺失 → null")
  } finally {
    _setConfigPathForTest(null)
    _resetSessionsDirForTest()
    await rmDir(dir)
    await rmDir(sessionsDir)
  }
})
