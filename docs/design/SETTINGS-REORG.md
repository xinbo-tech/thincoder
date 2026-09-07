# 配置界面重组 — 设计（会诊产物） > 状态：**已实施**（2026-08-15，commit 8c87fdf；0.1.20 随版发布）。来源：2026-08-15 三模型会诊（DeepSeek V4 Pro + Kimi K3 到场；GLM 因端点余额 429 缺席）。
> 前置：五个活性 bug 已修（b0d3a57：Shell 死卡、proxy 全局绑定、light push 洗 shell、✕ 误伤 Advisor、proxy 勾选回退）。 --- ## 1. 背景与判定依据 会诊两家的独立分析在同一个根因上收敛：**设置面板有三份状态**（DOM 控件 / settings.js 模块级变量 / config.json 磁盘），对齐点只有 buildSettings，而 buildSettings 的触发时机曾散乱——所有"回声压制/影子合并/DOM 反读"都是给状态漂移打的补丁。现状已收敛为"面板只在打开时重建"，本方案在其上做**结构与交互的归并**，不再引入新机制。 ## 2. 信息架构：7 卡 → 5 卡 | 新卡 | 内容 | 来源 |
|---|---|---|
| **Providers** | provider 行（dot/label/masked/model·baseURL/proxy 勾选/Key/−）+ Add 表单 | 原卡不动 |
| **Agent** | maxTurns、subagentTurns、compactThreshold、verifyGuard + subagent 模型 ×5（modelMenu + ✕） | 原 Agent 卡拆出：运行参数 + 分工模型 |
| **Consult & Advisor** | 会诊行（modelMenu + effort + ✕、+ 添加）+ Advisor（enabled/guard + modelMenu + effort） | 原 Agent 卡拆出：同为"第二双眼睛"，共享 effort 语义 |
| **Tools & Services** | MCP（列表+表单）+ Web Search key + Semantic Index（key + Build） | 外部能力接入合并：三个"单 key/单功能"卡不再各自占位 |
| **Environment** | Proxy（URI/web/model/Test）+ Shell | 低频环境项沉底合并 | （会诊分歧点：DS 建议 6 卡（Provider/MCP 独立、Keys 合并）；Kimi 建议 5 卡。**取 5 卡**——MCP 已是"外部服务"语义，与 key 管理同属接入层；卡片越少，找东西的路径越短。） 卡片顺序 = 上表顺序（高频 → 低频）。 ## 3. 交互一致性原则（定死，写进文档即生效） - **P1 保存范式按控件类型**：多字段表单（Add provider / Add MCP）= 显式 Save/Cancel；单控件（checkbox/select/modelMenu/数字输入）= change-to-save。**禁止**给 text input 绑 input 事件即时保存（半截值落盘教训）；change（blur/Enter）触发即可。
- **P2 一个动作一个组件**：`modelSlot`（modelMenu 触发 + ✕）替换现有三份实现；`keyRow`（label/status/Edit/Save/Cancel/✕）替换三份 key 行；`buildEffortSelect` 一处。全部 addEventListener，删除 `window._xxx` inline onclick（顺带消掉 escHtml 字符串拼接的注入面）。
- **P3 重建纪律**：buildSettings 只在 openSettings 调用。key 行取消 = 行内还原，不全量重建。`readConsultRowsFromDom` 的 DOM 抢救逻辑随之删除（配置重新成为唯一渲染数据源）。
- **P4 一个"已保存"反馈**：保留卡级 saved-badge 一种；删 flashSaved（含打在 proxy Test 按钮上的错误用法）。
- **P5 删除交互**：可逆删除（provider/MCP/key 都能重加）单击即删；不可逆才弹确认。删 `_confirmDelete` 的 2.5s 两段定时。
- **P6 绑定禁止 `|| document` 兜底**：按控件 ID 显式绑定；查不到就 throw（面板 HTML 是本文件生成的，查不到即 bug）。
- **P7 推送纪律**：扩展端 push 只更新 webview 影子状态，永不重建已打开的面板；light push 必须是**完整快照**（providerStatus + shellCandidates.current 已修）。 ## 4. 机制删留 | 删 | 留 |
|---|---|
| `flashSaved` 逐按钮 ✓ 闪烁 | 卡级 saved-badge（唯一反馈形态） |
| `_confirmDelete` 2.5s 两段确认 | change-to-save + 影子合并 |
| `|| document` 绑定兜底 | 推送不重建面板 |
| 三份 modelSlot/keyRow/effort 实现 | modelMenu overlay（纯事件驱动，反过度工程样本） |
| `readConsultRowsFromDom` DOM 抢救（P3 落地后） | effort 默认档预选 + 显式落盘 |
| settings.js `PROVIDER_LABELS`（与 model-menu 的 PROVIDER_SHORT、扩展推送 labels 三源漂移——统一由扩展推送 labels 为准） | Add-provider 连接探测（testProvider） |
| 714 行类调试日志（已删，防复发写进评审清单） | MCP 显式保存表单 | ## 5. 落地顺序（每步独立可验） 1. **组件归并**：modelSlot/keyRow/buildEffortSelect 三组件抽出来，替换三份重复实现；删 window._xxx inline 绑定（P2）
2. **卡片重组**：5 卡重排（纯 HTML 模板移动 + i18n section key 调整，双语同步）
3. **P3/P4/P5**：行内还原取消、saved-badge 统一、删除交互简化
4. 全程 `npm test` + 手动过一遍：加删 provider、改 key、MCP 增删重连、会诊行增删+effort、Advisor 选模型、proxy Test、shell 切换、索引 Build ## 6. 验收标准 1. 面板内**不存在**任何原生 provider/model 双下拉；Subagent/Consult/Advisor 三处点开是同一个 modelMenu
2. 任意保存后反馈样式只有一种
3. 删 provider/MCP 无两段确认
4. 面板开着时任何推送到达，正在编辑的内容不丢
5. `grep -c "flashSaved\|_confirmDelete\|readConsultRowsFromDom" webview/settings.js` = 0
