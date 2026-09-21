/**
 * tools/process-tree.mjs — 平台感知树杀单源（自 `execute.mjs` 抽出——TOOLS.md §6.14 落位表行 2）。
 * 抽出理由 = **断环**：`shared → git-run → execute → shared` 会 TDZ（`execute.mjs:29` 在模块求值期
 * 调 `DESC`（`const`））⇒ 树杀须住两不依赖档。行为逐字同（win32 `taskkill /T /F` · POSIX 组杀 + 直杀兜底）。
 * `execute.mjs` 保持再导出面（`test/tool-seams.test.mjs:26` 消费）。
 */
import { execFileSync } from "node:child_process"

/** Platform-aware process tree kill — mirror of system.mjs/verify.mjs killProcessTree.
 *  Timeout/abort must reach grandchildren: a script that spawned children keeps the
 *  pipes open otherwise — "close" never fires and the tool stalls until the 3s kick
 *  while the orphan keeps running (2026-09-05 advisor 🟡#4). */
export function killProcessTree(child) {
  if (process.platform === "win32") {
    try { execFileSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore" }) } catch {}
  } else {
    try { process.kill(-child.pid, "SIGKILL") } catch {}
    try { child.kill("SIGKILL") } catch {}
  }
}
