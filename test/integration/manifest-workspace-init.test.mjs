/**
 * manifest-workspace-init.test.mjs —— 集成用例 9-1（RTM CLI 端故事 9「项目根解析：工作区锚不就地建档」；
 * 判据 = `docs/core/design/MANIFEST.md` AC-22 ∥ AC-27 ∥ T51 · 设计 = `docs/core/design/LEDGER.md`
 * §3.8「多根工作区锚（batch 面）」）。
 *
 * 业务入口 = 真 `manifest` 工具（`agent-tools/manifest.mjs`）的 `init` 动作；驱动 = 工具直调
 * （工具面无进程信号，判据只留工具可观测两项）：① 抛面文案；② 盘面零建档。
 * 夹具 = tmp 目录（根无 `PROJECT-MANIFEST.json`、下辖 1 个裸仓——`.git` 无档）＝项目梯④（裸仓级）。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdirSync, mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"

import { manifestTool } from "../../thincoder-core/agent-tools/manifest.mjs"

test('9-1 多根工作区锚（下辖 1 个裸仓）+ manifest init ⇒ 报明 + 零建档', { timeout: 60_000 }, async (t) => {
  const box = mkdtempSync(join(tmpdir(), "tc-int-ws-init-"))
  t.after(() => rmSync(box, { recursive: true, force: true }))
  mkdirSync(join(box, "bare", ".git"), { recursive: true }) // 裸仓 = 有 .git、无项目档
  const candidate = resolve(join(box, "bare"))

  await assert.rejects(
    () => manifestTool.execute({ action: "init", target: box }, { agent: { cwd: box } }),
    (err) => {
      const msg = String(err?.message ?? err)
      assert.match(msg, /^manifest init: refused/, `拒绝形（统一前缀），实际：${msg}`)
      assert.match(msg, /is a workspace holding/, `文案含 workspace 态（报明事实），实际：${msg}`)
      assert.ok(msg.includes(candidate), `下辖候选全列，实际：${msg}`)
      assert.match(msg, /explicitly via target/, `显式 target 指引（可执行下一步），实际：${msg}`)
      return true
    },
  )
  assert.equal(existsSync(join(box, "PROJECT-MANIFEST.json")), false, "锚目录下零 PROJECT-MANIFEST.json 新建")
  assert.equal(existsSync(join(candidate, "PROJECT-MANIFEST.json")), false, "裸仓档零变（不向裸仓取根建档）")
})
