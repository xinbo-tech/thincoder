/**
 * credentials.mjs — 每工作区凭据（sandbox/SANDBOX.md §7 ∥ KD-SV-70）：工作区 key = `api_keys` 行
 * （名 `sandbox:<工作区名>`——归属负责人；明文存 `sandbox_workspaces.key_plain`——盒重建再注入，披露 D2）。
 * 签发/轮换/吊销复用 accounts key 面（`issueKey`/`revokeKey`——零新校验面；**不判 20 上限**——沿 CLI/登录先例）；
 * 轮换 = 吊销旧 + 签发新 + **拆容器重建**（卷保留——重建入队归 routes；旧 key 重建前即失效 ⇒ 401）。
 */
import { issueKey, revokeKey } from "../accounts/keys.mjs"

/** 工作区 key 名前缀（§7「名 `sandbox:<ws>`」）。 */
export const WORKSPACE_KEY_PREFIX = "sandbox:"

/** key 名（工作区名 ⇒ `sandbox:<名>`；名长在上游按 `WORKSPACE_NAME_MAX` 封顶——key 名 ≤ 40 字符）。 */
export function workspaceKeyName(workspaceName) {
  return `${WORKSPACE_KEY_PREFIX}${String(workspaceName).trim()}`
}

/** 签发（工作区创建径）：`{ id, plain, hint, name }`——明文由调用方落 `key_plain`（一次性面）。 */
export function issueWorkspaceKey(db, { ownerMemberId, workspaceName, now = Date.now() } = {}) {
  return issueKey(db, ownerMemberId, { name: workspaceKeyName(workspaceName), now })
}

/** 轮换（§7）：吊销旧 key + 签发新；返回新 key（容器重建由调用方入队——卷保留）。 */
export function rotateWorkspaceKey(db, workspace, { now = Date.now() } = {}) {
  revokeKey(db, workspace.key_id, { now })
  return issueWorkspaceKey(db, { ownerMemberId: workspace.owner_member_id, workspaceName: workspace.name, now })
}

/** 吊销（工作区销毁径——§7）；幂等（已吊销 ⇒ false）。 */
export function revokeWorkspaceKey(db, workspace, { now = Date.now() } = {}) {
  return revokeKey(db, workspace.key_id, { now })
}
