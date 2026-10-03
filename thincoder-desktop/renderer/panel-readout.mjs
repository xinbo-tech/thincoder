/**
 * panel-readout.mjs — 渲染面实况回读上报（子代理面板批 · 2026-10-04 · `docs/desktop/design/PANEL-READBACK.md` §2.1）。
 *
 * 推送点 = 渲染面帧出口（`renderer/app.mjs` `applyFrame` 尾 —— 五面分派之后，DOM 已落）：活动会话的
 * 子代理块按**签名**（判别六键 + 会话键）去重 ⇒ `invoke("panel:state", { key, blocks })`（渲染 → 主
 * 单向）。载荷块形 = **判别六键 + `role`/`id` 随行**：`{ key, status, frozen, awaitingDigest, region, dom }`
 * （判别面——签名去重与 trio 归判只读此六键）+ `role` ∥ `id`（随行——发射寻址与标注）。
 *
 * 判别面（与设计 §2.1 逐字同）：`status` = 核态机活态；`frozen` ∥ `awaitingDigest` = 归档闸两判据
 * （`subagent-reduce.mjs` `archiveIntoFlow`）逐字上报；`region` = `"activity"`（驻右列）∥ `"flow"`
 * （已入流——归档墓碑）；`dom` = `[data-subname="<key>"]` 元素在场（核件 `subblocks/block.mjs` 单点盖章
 * ——活动区块与流内回显块**同属性** ⇒ 单查询覆盖两区）。**流式 `rows` 变化不入签名**（内容面不属判别面
 * ——零逐 token 上报）；同签名零报；状态迁转 ∥ 出生 ∥ 归档 ∥ DOM 增减 ∥ 会话切换 ⇒ 一报。
 *
 * 纯函数 + 注入面（`queryDom` ∥ `invoke`——平 node 直测）；零 DOM 直取 / 零 `node:` / 零裸包
 * （渲染面静态闭包判据）。
 */

/** 缺省 DOM 查询（浏览器面——`[data-subname="<key>"]` 在场判据；平 node 无 `document` ⇒ 恒假，测试注入）。 */
function defaultQueryDom(key) {
  if (typeof document === "undefined") return false
  return document.querySelector(`[data-subname="${key}"]`) !== null
}

/** 快照构形（纯函数——活动会话块表 ⇒ 上报块表；`state.subBlocks[key]` 非数组 ⇒ 空表）。 */
export function snapshotPanelBlocks(state, key, queryDom = defaultQueryDom) {
  const list = state?.subBlocks?.[key]
  if (!Array.isArray(list)) return []
  return list.map((b) => ({
    key: b.key,
    role: b.role ?? null,
    id: b.id ?? null,
    status: b.status ?? null,
    frozen: b.frozen === true,
    awaitingDigest: b.awaitingDigest === true,
    region: b.region === "flow" ? "flow" : "activity",
    dom: queryDom(b.key) === true,
  }))
}

/** 签名（去重判据——会话键 + 逐块判别六键；字段序稳定 ⇒ 同签名零报、任一判别键变 ⇒ 一报）。 */
export function panelSignature(key, blocks) {
  return JSON.stringify([key, ...blocks.map((b) => [b.key, b.status, b.frozen, b.awaitingDigest, b.region, b.dom])])
}

/** 上报器工厂（注入面：`invoke(channel, payload)` = 窄桥 ∥ `queryDom(key)` = DOM 在场判据）。 */
export function createPanelReadout({ invoke = null, queryDom = defaultQueryDom } = {}) {
  let lastSignature = null
  return {
    /** 帧出口调用（幂等——同签名零报）：返回本拍是否上报（测试 ∕ 诊断读数面）。 */
    settle(state) {
      const key = typeof state?.activeSession === "string" && state.activeSession !== "" ? state.activeSession : null
      if (key === null) { lastSignature = null; return false }
      const blocks = snapshotPanelBlocks(state, key, queryDom)
      const signature = panelSignature(key, blocks)
      if (signature === lastSignature) return false
      lastSignature = signature
      if (typeof invoke !== "function") return false
      try {
        void Promise.resolve(invoke("panel:state", { key, blocks })).then(
          (receipt) => { if (receipt?.ok !== true) console.error(`[renderer] panel:state failed: ${receipt?.reason ?? "unknown"}`) },
          (error) => console.error("[renderer] panel:state rejected:", error))
      } catch (error) { console.error("[renderer] panel:state failed:", error) }
      return true
    },
  }
}
