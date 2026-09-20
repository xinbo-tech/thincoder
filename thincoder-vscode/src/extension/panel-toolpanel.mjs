/**
 * panel-toolpanel.mjs — toolPanel postMessage payload builder（2026-09-05 module-split：
 * panel-chat.mjs 512 > 500 硬限——toolPanelPayload 独立纯函数迁入）。消费面：生产调用点
 * `panel-callbacks.mjs`（onToolPanel）；测试直取本模块（`status-line.test.mjs`）。
 */

/**
 * Build the `toolPanel` postMessage payload (pure — directly testable without a
 * webview; ARCHITECTURE.md「子agent/advisor 模型显示」交付评审 #1). String chunks
 * are the legacy text form; object chunks carry kind/text/round/model. All display
 * fields the chunk carries must ride along — the bridge must not silently drop
 * fields (NF1).
 */
export function toolPanelPayload(name, chunk) {
  const kind = typeof chunk === "string" ? "text" : (chunk?.kind ?? "text")
  const text = typeof chunk === "string" ? chunk : String(chunk?.text ?? "")
  // §19.5 D-M8: `sub`（嵌套子代理段标——runChild forward 附加，如 "explore#1"）随块
  // 透传——webview 在子代理块内渲染行首 dim 子标 span。白名单字段（NF1——不静默丢字段）。
  // §14 C-11①（活动区收口批）：增 `tool`/`cmd`（结构化工具名 + 参数摘要——无则不携）；渲染粒度对齐批
  // （2026-09-20）：增 `face`（内容 chunk 来源面——webview 行合并判据源，`WEBVIEW.md` §5.6）。
  return { type: "toolPanel", name, kind, text, round: chunk?.round, model: chunk?.model, sub: typeof chunk === "string" ? undefined : chunk?.sub,
    tool: typeof chunk === "string" ? undefined : chunk?.tool, cmd: typeof chunk === "string" ? undefined : chunk?.cmd,
    face: typeof chunk === "string" ? undefined : chunk?.face }
}
