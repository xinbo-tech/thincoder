/**
 * notify.mjs — 完成提示面**宿主包装**（策略零副本 —— parity-b4 W1）：策略（失焦门 ∕ 词键 ∕ 语言取值 ∕
 * title 携 ∕ reveal 载荷）全取核 `@thincoder/core/notify-policy.mjs`；本档只承宿主 API 面。
 * 语言面 = `localeOf` 缝携 `vscode.env.language`（`normalizeLocale` 归一 `zh-CN → zh`）；点击 = 打开
 * thincoder 视图（宿主能力面——批档 §2.1① 登记）。
 */
import * as vscode from "vscode"
import { createNotifier } from "@thincoder/core/notify-policy.mjs"
import { t } from "../i18n.mjs"

/** 装配宿主包装（`panel` = 装配点身份——策略面零消费）：返回核单档 `turnDone`。 */
export function createVscNotify(panel) {
  return createNotifier({
    localeOf: () => vscode.env.language,
    focused: () => vscode.window.state?.focused === true,
    reveal: () => vscode.commands.executeCommand("workbench.view.extension.thincoder"),
    notify: (payload) => {
      Promise.resolve(vscode.window.showInformationMessage(payload.body, ...(payload.reveal ? [t("notify.view")] : [])))
        .then((choice) => { if (choice === t("notify.view")) void payload.reveal?.() })
        .catch(() => { /* notification failures are never fatal */ })
    },
  })
}
