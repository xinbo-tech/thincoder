import { ansi, C } from "./ansi.mjs"
import { upgradeFailureText } from "./update-notice.mjs"

/** /upgrade command: check for updates and optionally upgrade.
 *  ctx: { agent, pushLine, pushLabel, showPicker } */
export async function handleUpgradeCommand(ctx) {
  const { pushLine, pushLabel, showPicker, render } = ctx
  const { checkForUpdate } = await import("../upgrade.mjs")
  const { readFileSync } = await import("node:fs")

  const pkg = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8"))

  pushLabel(`❯ Upgrade`, ansi.bold + C.tool)
  pushLine(`Checking for updates...`, C.dim)
  const result = await checkForUpdate(pkg.version)
  if (!result) {
    pushLine(`Unable to query npm registry — check your network`, C.error)
    return
  }
  if (!result.newer) {
    pushLine(`✓ ThinCoder ${result.local} is already the latest.`, C.tool)
    return
  }
  pushLine(`thincoder ${result.latest} is available (current: ${result.local}).`, C.tool)
  const sel = await showPicker(`Update: ${result.local} → ${result.latest}`, [
    { type: "header", text: `New version: ${result.latest}` },
    { type: "item", text: "Upgrade now", action: "upgrade" },
    { type: "item", text: "Later", action: "later" },
  ])
  if (sel?.action !== "upgrade") return
  pushLabel(`❯ Upgrade`, ansi.bold + C.tool)
  pushLine(`Upgrading to ${result.latest}...`, C.tool)
  const { exec } = await import("node:child_process")
  const cp = exec("npm install -g thincoder@latest", { windowsHide: true })
  let stdout = ""
  let done = false
  cp.stdout?.on("data", (d) => { stdout += d })
  cp.stderr?.on("data", (d) => { stdout += d })
  // 2026-09-05（advisor 🟡#5/#7）：异步回调必须显式 render（pushLine 只写 lines 不绘制——
  // handleSlash 返回后的统一 render 先于 exec 完成，结论行要等下次输入才可见）；失败文案
  // 复用 upgradeFailureText（附 npm 输出尾 ≤3 行——与 update-notice 后台路径同诊断能力）
  cp.on("error", (e) => {
    if (done) return
    done = true
    pushLine(`✗ Upgrade failed (${e.message}). Run \`thincoder upgrade\` manually.`, C.error)
    render?.()
  })
  cp.on("close", (code) => {
    if (done) return
    done = true
    if (code === 0) {
      pushLine(`✓ Upgraded to ${result.latest}. Restart to apply.`, C.tool)
    } else {
      pushLine(upgradeFailureText(code, stdout), C.error)
    }
    render?.()
  })
}
