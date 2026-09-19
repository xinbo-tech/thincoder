/**
 * tool-summary-spawn-form.test.mjs — CLI 摘要面 spawn 失败形态用例（CL-1）。
 *
 * 设计权威：`docs/vsc/design/WEBVIEW.md` §4.3（CLI 对位：spawn 形态两端同读 · 摘要一处）；
 * 批次档 `docs/batches/2026-09-18-tool-failure-spawn-form.md` §2.4（CL-1）。
 *
 * CL-1：核 bash 真产形（spawn 失败）⇒ `formatToolSummary("bash", …)` = `"bash: (spawn failed)"`。
 * 端侧零改（`src/tui/tool-summaries.mjs` 认「末条非包装行」——状态位本体即末条）。
 * 输入取自真产者直跑（真子进程）——禁夹具手写形态串。
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { bashTool } from "@thincoder/core/tools/bash.mjs"
import { formatToolSummary } from "../src/tui/tool-summaries.mjs"

/** 不存在的 cwd ⇒ 核产者 spawn ENOENT。 */
const NO_SUCH_DIR = join(tmpdir(), "thincoder-cli-tool-summary-spawn-no-such-dir")

test("CL-1 CLI 摘要（先红·真产者）：核 spawn 真产形 ⇒ bash: (spawn failed)", async () => {
  const result = await bashTool.execute({ command: "echo hi" }, { cwd: NO_SUCH_DIR })
  assert.equal(formatToolSummary("bash", result), "bash: (spawn failed)", `产形: ${JSON.stringify(result)}`)
})
