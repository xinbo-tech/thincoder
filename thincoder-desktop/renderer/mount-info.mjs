/**
 * mount-info.mjs — 项目级读数族（「桌面处理流 · VSC 对齐」批 R8 · 自 `renderer/mount-settings.mjs` 拆出；
 * 会话模型轮 R13：信息行视图随左列裁撤退场 —— 本档只留两读数复读（`ledger:read` + `batch:status`），
 * 读面消费 = 状态行台账超阈段（`renderer/views/statusline.mjs` `ledgerSegment`）。
 *
 * 语义锚（`docs/desktop/design/IPC.md` §2 项目级读数族注）：一读失败**不遮蔽**另一读（分键落 —— 失败串落
 * `projectInfo.notice`）；缺省 cwd = 当前项目；复读两径 = 装配时一次 ∕ 开项目成功链（`renderer/app.mjs` `openDir`）。
 * 接线沿 `mount-onboarding.mjs` 注入先例：`createInfoFace(deps)` —— `deps = { ask, store }`。
 * 纪律：零 `node:` / 零裸包 · 逐通道回执形单源 = IPC.md §2。
 */

/** 失败串归一：回执 `reason` 非空串 ⇒ 直传（核错误串 ∕ 表内码）；缺 ⇒ 端侧形判码（零静默 —— 调用面另记错）。 */
const reasonOf = (receipt) => (typeof receipt?.reason === "string" && receipt.reason !== "" ? receipt.reason : "invalid-shape")

/** 项目级读数接线族（`deps = { ask, store }`）；返回 `{ refreshInfo }`。 */
export function createInfoFace(deps = {}) {
  const { ask, store } = deps

  /** 项目级两读数（`ledger:read` + `batch:status`，缺省 cwd = 当前项目）：一读失败**不遮蔽**另一读（分键落 ——
   *  失败串落 `projectInfo.notice`，非设置面失败面：读数族自有失败键）。 */
  async function refreshInfo() {
    const [ledger, batch] = await Promise.all([ask("ledger:read"), ask("batch:status")])
    const next = { counts: null, thresholdReached: null, phase: null, notice: null }
    if (ledger.ok === true) {
      next.counts = ledger.counts ?? null
      next.thresholdReached = typeof ledger.thresholdReached === "boolean" ? ledger.thresholdReached : null
    } else {
      console.error(`[renderer] ledger:read failed: ${reasonOf(ledger)}`)
      next.notice = reasonOf(ledger)
    }
    if (batch.ok === true) next.phase = typeof batch.phase === "string" ? batch.phase : null
    else {
      console.error(`[renderer] batch:status failed: ${reasonOf(batch)}`)
      if (next.notice === null) next.notice = reasonOf(batch)
    }
    store.set({ projectInfo: next })
  }

  return { refreshInfo }
}
