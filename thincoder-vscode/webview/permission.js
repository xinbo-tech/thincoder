/**
 * permission.js — 审批卡端壳（端协议壳）：卡面构树单源 = 核包 `cards/permission.mjs`（R2 换接
 * ——§3 行 28；卡体 HTML 串与转义闸为核内部实现面）；本档留端 = 出站绑 `vscode.postMessage`
 * + append 到 `#messages` + `scrollIntoView` + deny 聚焦（最安全默认）。
 */
import { vscode } from "./state.js"
import { renderApprovalCard, renderBatchApprovalCard } from "../node_modules/@thincoder/render-core/cards/permission.mjs"

/** 三出口载荷成形（发面机检 §13 形态④：局部箭头返回字面量）；载荷字段与旧内联式逐字同。 */
const openDiffMsg = (p) => ({ type: "openDiff", ...p })
const permissionReply = (p) => ({ type: "permissionResponse", ...p })
const batchReply = (p) => ({ type: "batchPermissionResponse", ...p })

/** 核 `deps.emit(type, payload)` ⇒ 端协议（判别式字面量须在发射位可提取——§13 发面机检）。 */
const emit = (type, payload) => {
  if (type === "openDiff") vscode.postMessage(openDiffMsg(payload))
  else if (type === "permissionResponse") vscode.postMessage(permissionReply(payload))
  else if (type === "batchPermissionResponse") vscode.postMessage(batchReply(payload))
}

/** 逐项审批卡（approve / approve-all / deny + apply_patch 预览 + 大 diff 原生查看器转口）。 */
export function showPermissionRequest(m) {
  const el = renderApprovalCard(m, { emit })
  document.getElementById("messages").appendChild(el)
  el.scrollIntoView({ behavior: "smooth" })
  // Focus the deny button (safest default)
  setTimeout(() => el.querySelector(".deny")?.focus(), 50)
}

/**
 * §16 D-B1 合并批审批卡：approve-all / one-by-one / deny 一卡覆盖整批（免逐项点击疲劳）；
 * 三按钮载荷同携 `promptId`（F-W13）。
 */
export function showBatchPermissionRequest(m) {
  const el = renderBatchApprovalCard(m, { emit })
  document.getElementById("messages").appendChild(el)
  el.scrollIntoView({ behavior: "smooth" })
  setTimeout(() => el.querySelector(".deny")?.focus(), 50)
}
