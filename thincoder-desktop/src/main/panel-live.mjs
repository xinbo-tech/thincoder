/**
 * panel-live.mjs — 桌面渲染面实况回读缓存（子代理面板批 · 2026-10-04 · `docs/desktop/design/PANEL-READBACK.md` §2.1）。
 *
 * 通道 `panel:state`（渲染 → 主单向状态报告；白名单末位 48）的接收半：渲染面帧出口按签名去重上报
 * `{ key, blocks }`（块形 = 判别六键 + `role`/`id` 随行；载荷形单源 = `PANEL-READBACK.md` §2.1）⇒
 * 本缓存落位（**后报覆前报**；到达即盖 `receivedAt` —— **单时钟权威**，渲染面时钟不做跨进程比较）；
 * 核 `panel` 工具经 `agent._panelReadout` 读面取值（`get(key)`）——视图面 `source:"renderer"` ∥
 * freeze 门控的桌面数据源。
 *
 * 形态沿 `theme:state`（渲染→主单向报告；主侧收面置缓存 —— `window.mjs` `setMenuTheme`；本档与处理体
 * 出站半同档）。零宿主依赖（零 electron —— 平 node 直测）；模块级单例 = 处理体（`ipc.mjs`）与装配面
 * （`agent-host.mjs`）共用同一份缓存（单源——禁第二副本）。
 */

/** 读数缓存工厂（测试 ∕ 多实例面）：`now` = 主侧时钟缝（缺省 `Date.now`）。 */
export function createPanelLive({ now = Date.now } = {}) {
  /** key → `{ blocks, receivedAt }`（后报覆前报——整对象替换 ⇒ 读面零拷贝安全）。 */
  const table = new Map()
  return {
    /** 落位一次上报：键 ∥ 块表形不合 ⇒ 拒（false——防御档；处理体已先验，本处兜底不抛）。 */
    report(key, blocks) {
      if (typeof key !== "string" || key === "" || !Array.isArray(blocks)) return false
      table.set(key, { blocks, receivedAt: now() })
      return true
    },
    /** 读面：未报 ∥ 坏键 ⇒ `null`；命中 ⇒ `{ blocks, receivedAt }`（缓存项原引用——后报整替换）。 */
    get(key) {
      if (key === undefined || key === null) return null
      return table.get(String(key)) ?? null
    },
    /** 缓存键数（诊断 ∕ 测试面）。 */
    size() { return table.size },
  }
}

/** 模块级单例（主进程单窗单实例 —— ipc 处理体 ∥ agent-host 装配面同源）。 */
export const panelLive = createPanelLive()
