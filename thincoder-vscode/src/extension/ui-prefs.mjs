/**
 * ui-prefs.mjs — 视图偏好推送（`uiPrefs` 消息 · 协议 §3.2 行 23 · 台账 #875；消费 = webview
 * `ui-prefs.js` `applyUiPrefs`）。三键读面 = VS Code 设置 `thincoder.ui.autoFollow` ∥
 * `thincoder.ui.activityMaxHeight` ∥ `thincoder.ui.activityTailLines`（contributes 声明缺省——
 * `package.json`）；载荷三字段同名。推送两面：① webviewReady 握手（Reload 冷启重同步——
 * 调用点 = `panel-messages.mjs` `webviewReady` case）② `onDidChangeConfiguration`（活变更——
 * 先例 `stop-trace.mjs`）。`vscode` 句柄入参（同先例——核件可测）。
 */

/** 读三键 → 推 `uiPrefs`（幂等；面板未在 ⇒ 零动作）。 */
export function pushUiPrefs(panel, vscode) {
  const cfg = vscode.workspace.getConfiguration("thincoder.ui")
  panel?._panel?.webview.postMessage({
    type: "uiPrefs",
    autoFollow: cfg.get("autoFollow"),
    activityMaxHeight: cfg.get("activityMaxHeight"),
    activityTailLines: cfg.get("activityTailLines"),
  })
}

/** 面板接线（`resolveWebviewView` 调用）：`thincoder.ui.*` 变更 ⇒ 重推（先例 = `stop-trace.mjs`）。 */
export function initUiPrefs(panel, context, vscode) {
  context.subscriptions.push(vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration("thincoder.ui")) pushUiPrefs(panel, vscode)
  }))
}
