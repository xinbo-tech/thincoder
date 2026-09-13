# activity.js 拆分（ACTIVITY-SPLIT）

> 板块：webview 前端（VSC——activity.js 579 行超 500 惯例拆分）。权威源：CLI subagent-blocks/freeze/panel 三文件拓扑（拆分参照）。
> 状态：**已交付核销**——2026-09-09（6d66dd5——三文件 287/229/94——hub re-export 外部零改动——verbatim 机械对拍字节一致——parity 162/15 零增零减——audit clean + advisor pass——consume 18d53f6e——VSC L2 链终跑）。需求：TODO activity.js 579 行拆分（B1 修正交付后——advisor 🔵——挂 TODO）。
>
> 行数带外注（评审 #1 接受——eng-coder 上报 §4-1）：AC-1 view 实测 229 raw > 设计 ~210±10 上沿 220（+9）——
> 合法下界 ≈227（头注释/imports/stopTicker/分段空行强制新增）——再压破坏 verbatim——接受带外——文档寄存器
> 如实记 287/229/94。

---

## 需求

- **总体目标**：activity.js 579 行（SESSION-ACTIVITY-REVISED 后净 +136）超 500 惯例——拆分为三文件终局（对齐 CLI subagent-blocks/freeze/panel 结构度）——纯 DAG 无环——外部消费方零改动（hub re-export）。
- **功能性**：
  - F-1 拆分 3 文件：activity.js（核心编排 ~290）+ activity-view.js（呈现叶 ~210 新）+ activity-freeze.js（冻结叶 ~85 新）
  - F-2 依赖方向：core→view→{state,i18n} 与 core→freeze→view→state——纯 DAG 无环（repo leaf 纪律）
  - F-3 外部消费方零改动（hub re-export——panels/chat/streaming/test 动态 import 路径不变——CLI subagent-blocks:23-24 同款）
  - F-4 verbatim 移动——函数体零改——仅 imports 调整——**唯一例外（评审 #1 显式标注）：resetActivity
    的 ticker 清理行提为 view 的 stopTicker 新函数（原内联 clearInterval/_tickDisabled/liveBlocks 清——
    拆后状态在 view——resetActivity 体改为单调用 stopTicker()）——stopTicker = 新代码非 verbatim 移**
  - **范围边界**：非本任务 = activity-flow.test.mjs 自身 ~590 行债（单列后续）+ applySubagentStatus 状态机逻辑改（不动——只搬家）+ freeze 逻辑改（不动）+ 新区命名/细拆待定项（设计定稿）。

## 设计（activity 拆分勘察骨架——候选 B——照做勿自行解释）

### 文件划分（verbatim 迁移——行号 = 现 activity.js 锚）

1. **activity.js（核心 + re-export 枢纽——579 → ~290）**保留：
   - 模块头重写（编排层叙述 + 指向子模块）
   - parse 族（parseChannel:50/blockNamesFor:63/rowFor:76——41 行）
   - ensureBlock（:252——41 行）
   - applySubagentStatus（:312——120 行状态机——queued/started/settled/terminal 全分支）
   - _settleSeq（:510）+ freezeSettledBlocks（:515——留核心理由：按 settled 行表驱动的策略——panels.js 直接消费——若随 freeze 出移则 freeze 需 import 核心成环）
   - resetActivity（:569——17 行——ticker 清经新 stopTicker 调）
   - re-export 块（~13 行——评审 #2 枚举：`export * from "./activity-view.js"`（含 FAMILY_ROLES——供核心
     import）+ 命名 `export { freezeBlock } from "./activity-freeze.js"`——liveBlocks 私有不导出——
     外部消费方实测仅用 applySubagentStatus/freezeSettledBlocks/resetActivity/ensureBlock/noteChunk/
     测试 7 符号——勘察核）
   - **导出**：applySubagentStatus/ensureBlock/resetActivity/freezeSettledBlocks/parseChannel/blockNamesFor 直接 + `export { freezeBlock } from "./activity-freeze.js"` + view 族 re-export
2. **activity-view.js（新区 ~210——live 呈现叶——镜像 CLI subagent-panel.mjs + fold-block 渲染面）**迁入：
   - FAMILY_ROLES（:37）
   - W/headerText/stateWord/tailLines/refreshBlock/updateStopButton（:87-220——~134 行）
   - updateAreaVisibility/pinActivityArea（:222-243——~22 行）
   - ticker 全族（_ticker/_tickDisabled/liveBlocks/ensureTicker/activityTick/setActivityTickDisabled + 新导出 stopTicker——~33 行）
   - noteChunk（:296——14 行——用 W.thinking——语义 chunk→状态词→refresh 本就是呈现操作）
   - 新文件头注释（单一权威在 view 头）
   - **依赖**：state.js + i18n.js——新 leaf——**导出**：refreshBlock/noteChunk/updateAreaVisibility/pinActivityArea/ensureTicker/stopTicker/activityTick/setActivityTickDisabled + FAMILY_ROLES（供核心）
3. **activity-freeze.js（新区 ~85——冻结/落流域——镜像 CLI subagent-freeze.mjs）**迁入：
   - freezeInsertPoint（:439——11 行）+ freezeBlock（:462——21 行）+ appendPreview（:486——22 行）
   - PREVIEW_LINES/PREVIEW_LINE_CHARS consts（:40-42）
   - **依赖**：state.js（ctx.messagesEl）+ view.js（refreshBlock/updateAreaVisibility/ensureTicker）——**不依赖核心**——**导出**：freezeBlock（freezeInsertPoint/appendPreview 私有）

### 依赖图（无环）
```
core (activity.js) ──→ activity-view.js ──→ state.js / i18n.js
        └──────────→ activity-freeze.js ──→ activity-view.js ──→ state.js
                                     └─────────────→ state.js（评审 #4——ctx.messagesEl 直依赖）
```

### 拆分机械步骤（Module Split Policy）
① write-first verbatim 迁 view/freeze 段 → ② 函数体零改仅 imports（view 增 state/i18n——freeze 增 view 引用——核心删迁移段 + 两 import + re-export）→ ③ 环检查（core 依赖 view/freeze——view/freeze 不依赖 core）→ ④ node --check + activity-flow.test.mjs + 全量——断言数 parity（verbatim 移动——断言零增零减）

### 连带更新（实施时）
- WEBVIEW.md §3 文件结构（activity.js "leaf" 描述 → 编排层 + 新两文件登记）
- AGENTS.md 模块图（同 leaf 声明同步）
- SESSION-ACTIVITY-REVISED.md 状态行（"579 行拆分挂 TODO" → 勾销 + 变更记录）
- ARCHITECTURE.md 拆分治理轮注记（循 2026-09-05 拆分轮格式）

### 待定项（设计定稿）
① 新区命名 activity-view.js vs activity-live.js/activity-render.js（**定：activity-view.js**——view 族清晰）② freezeSettledBlocks 留核心（**定：留**——防环）③ 模块头注释每文件自带 + 单一权威在 view/freeze 头

## 受影响文件（VSC 单仓）

| 文件 | 改动 | 行数 |
|---|---|---|
| webview/activity.js | 核心保留 + re-export 枢纽 | 579 现（−289±10 → ~290——评审 #1 实测） |
| webview/activity-view.js | 新建——呈现叶 | 新 ~210 |
| webview/activity-freeze.js | 新建——冻结叶 | 新 ~85 |
| docs/design/WEBVIEW.md §3 | 文件结构更新 | doc |
| AGENTS.md 模块图 | leaf 声明同步 | doc |
| docs/design/SESSION-ACTIVITY-REVISED.md 状态行 | 拆分勾销 + 变更记录 | doc |
| docs/design/ARCHITECTURE.md | 拆分轮注记 | doc |

## 验收

- AC-1 三文件拆分（activity ~290 / activity-view ~210 / activity-freeze ~85——实测 ±10 内）
- AC-2 依赖无环（core→view/freeze——view/freeze 不依赖 core——node 加载绿）
- AC-3 外部消费方零改动（panels/chat/streaming import 路径不变——test 动态 import activity.js 不变——hub re-export 全符号可达）
- AC-4 verbatim 移动（git diff 函数体零改——仅 imports/头注释——**唯一例外：resetActivity ticker 清理 →
  stopTicker() 调用——评审 #1 显式标注**——activity-flow.test.mjs 断言数 parity——零增零减——**基线数
  实现期开工时记录（评审 #3）**）
- AC-5 测试绿（activity-flow 15 组 + 既有——VSC npm test 快层——断言计数与拆分前相等）
- AC 红线：行为零改（纯重构——无逻辑变更——无消息协议动）

## 变更记录
- 2026-09-09：activity 拆分落档（勘察一手——逐段分类 579 行 + 依赖图 + 候选对比——候选 B 三文件终局推荐——hub re-export 保外部零改动——freezeSettledBlocks 留核心防环——activity-flow.test 自身 ~590 债单列）。
