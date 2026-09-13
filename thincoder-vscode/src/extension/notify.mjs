/**
 * notify.mjs — native notification when a turn completes while the window is
 * unfocused (Copilot 1.105 parity). Focused window = no-op (never noise).
 */
import * as vscode from "vscode"
import { t } from "../i18n.mjs"

/** Fire a system notification for a completed turn when the window is unfocused. */
export function notifyCompletionIfUnfocused() {
  if (vscode.window.state?.focused) return
  Promise.resolve(vscode.window.showInformationMessage(t("notify.done"), t("notify.view")))
    .then((choice) => {
      if (choice === t("notify.view")) {
        vscode.commands.executeCommand("workbench.view.extension.thincoder")
      }
    })
    .catch(() => { /* notification failures are never fatal */ })
}
