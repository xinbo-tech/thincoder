/**
 * peer-instances.mjs — R10 多实例协作感知面（`MULTI-INSTANCE-COLLAB.md` §3）——VSC 端 = 核单源转口。
 *
 * 单源 = `@thincoder/core/peer-instances.mjs`：读面 `peerInstances(cwd)`（**async**——manifest
 * mtime ∨ TTL 惰性缓存 + 探针族单源）与 L2 只读工具 `peerInstancesTool`（schema description
 * 逐字锚）逐名转口。端自持 SWR 同步壳 ∕ 异步对偶 ∕ 端探针缝名随取核**退役**（端差消解 =
 * §3.1「端同步读形非结构性约束 ⇒ 端差默认＝消」；消费面 `setup-reminders.mjs` 的 peer 提醒
 * 改 `await` 核读面——与核 `prepareRun` 同形）。
 *
 * 预热面保形（`panel-session.mjs` resolve 慢段调用）：取核后 = **核缓存预热**——先起一次核读面
 * 落缓存（mtime ∨ TTL），首个回合读面命中（零探测）；失败静默（只读面降级由核读面自理）。
 */
import { peerInstances as corePeerInstances } from "@thincoder/core/peer-instances.mjs"

export { peerInstances, peerInstancesTool } from "@thincoder/core/peer-instances.mjs"

/** 预热（不阻塞、不抛——面板打开慢段调用；`panel-session.mjs` 调用点零改）。 */
export function prewarmPeerInstances(cwd) {
  void corePeerInstances(cwd).catch(() => {})
}
