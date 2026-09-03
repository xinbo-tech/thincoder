/**
 * update-notice.mjs — 后台升级提示（2026-09-03 D-S1c 自 index.mjs 拆出）：
 * upgradeFailureText / pendingNoticeReady（纯函数，index.mjs re-export——tui.test
 * 动态 import 面零改动）+ createUpdateNotice 装配（升级提示 picker + 启动检查）。
 * index.mjs 只保留装配调用（showPicker 闭包在此经 ctx 注入）。
 */
import { ansi, C } from "./ansi.mjs"

/** 升级失败提示文案：附 npm 输出尾部（最多 3 行），方便定位失败原因。 */
export function upgradeFailureText(code, output) {
  const tail = (output ?? "").trimEnd().split("\n").slice(-3).join("\n")
  return `✗ Upgrade failed (exit ${code}). Run \`thincoder upgrade\` manually.${tail ? `\n${tail}` : ""}`
}

/** 后台更新提示可弹出的条件：无任何交互弹层（picker/permission/question）激活。 */
export function pendingNoticeReady(state) {
  return Boolean(state.pendingNotice && !state.picker && !state.permission && !state.question)
}

/**
 * 升级提示 + 启动检查装配。ctx: { state, showPicker, pushLine, pushLabel, render }
 * 返回 { showUpdateNotice, checkUpdates }——checkUpdates 非阻塞（网络错误静默跳过）；
 * 有 picker 打开时提示挂到 state.pendingNotice，picker 全部关闭后由 doRender 弹出。
 */
export function createUpdateNotice(ctx) {
  const { state, showPicker, pushLine, pushLabel, render } = ctx

  const showUpdateNotice = async (result) => {
    const sel = await showPicker(`Update available: ${result.local} → ${result.latest}`, [
      { type: "header", text: `thincoder ${result.latest} is available (current: ${result.local})` },
      { type: "item", text: "Upgrade now", action: "upgrade" },
      { type: "item", text: "Later", action: "later" },
    ])
    if (sel?.action !== "upgrade") return
    pushLabel(`❯ Upgrade`, ansi.bold + C.tool)
    pushLine(`Upgrading to ${result.latest}...`, C.tool)
    const { exec } = await import("node:child_process")
    const cp = exec("npm install -g thincoder@latest", { windowsHide: true })
    let stdout = ""
    cp.stdout?.on("data", (d) => { stdout += d })
    cp.stderr?.on("data", (d) => { stdout += d })
    cp.on("close", (code) => {
      if (code === 0) {
        pushLine(`✓ Upgraded to ${result.latest}. Restart to apply.`, C.tool)
      } else {
        pushLine(upgradeFailureText(code, stdout), C.error)
      }
      render()
    })
  }

  const checkUpdates = async () => {
    try {
      const { readFileSync } = await import("node:fs")
      const pkg = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8"))
      const { checkForUpdate } = await import("../upgrade.mjs")
      const result = await checkForUpdate(pkg.version)
      if (result?.newer) {
        // Defer: if wizard is still active, just show a dim line
        if (state.wizard) {
          pushLine(`Tip: thincoder ${result.latest} is available (run /upgrade later or restart)`, C.dim)
          render()
        } else {
          state.pendingNotice = result
          render()
        }
      }
    } catch { /* network error or timeout — silently skip */ }
  }

  return { showUpdateNotice, checkUpdates }
}
