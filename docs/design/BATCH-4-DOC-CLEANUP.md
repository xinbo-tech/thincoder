# 批 4：异步残留 doc 候选 + 跨文档陈旧清理（BATCH-4-DOC-CLEANUP）

> 板块：文档面（双端——异步化残留候选 + 陈旧清理）。权威源：全异步化适配评估（残留清单——文档面候选分级）+ DOC-SWEEP 先例 + SESSION-FLOW/WEBVIEW 文档现状。
> 状态：**设计待评审**——2026-09-09 落档（勘察已齐——评估残留清单 + 文档陈旧面定位）。需求：TODO 异步残留 doc 候选（批 4）+ 跨文档陈旧清理（批 4——用户裁 8 点分批）。

---

## 需求

- **总体目标**：文档面收尾——① 异步化残留 doc 候选（评估清单分级出的文档级残留——async:false 旧句/过时注——双端）② 跨文档陈旧清理（已交付机制在文档的过时描述——SESSION-FLOW/WEBVIEW 等——统一对照机制现状修）。
- **功能性**：
  - F-1（ESCALATE.md async:false 残留）双端 ESCALATE.md 中 async 相关旧句——加 depth>0 指针（与 AGENT-LOOP 权威同步——现 ESCALATE.md 无 depth 维度）
  - F-2（文档陈旧清理——机制对照）SESSION-FLOW.md（CLI）/ WEBVIEW.md（VSC）中已变更机制的过时描述句——按机制现状修正（INPUT-LOCK busy 门禁句 / 排队句 / async 句——凡与已交付行为不符的句）
  - **范围边界**：只修文档句不改机制；陈旧面以"与已交付行为矛盾"为准（不追求全面重写——过时但描述现行为的面保留）；不做结构重组（DOC-SWEEP 已做）。

## 设计（勘察落点——照做勿自行解释）

### 1. F-1 ESCALATE.md 残留（双端）
- 现：ESCALATE.md（双端文档——escalate 飞刀机制）含 async 旧描述（async:false 顶层直跑/无 depth 维度——全异步化后与 AGENT-LOOP 权威不符）
- 改：加 depth 指针句——"escalate 顶层一律异步（AGENT-LOOP §11.2 R13——子代理内同步）——async:false 仅机制参数"——与 AGENT-LOOP 逐字锚同步（照抄权威句）
- 注：先 grep 各档实际残留句再改（不盲改——双端各档结构不同）

### 2. F-2 陈旧清理（CLI SESSION-FLOW + VSC WEBVIEW——机制对照）
- 方法：grep 已交付机制关键词（busy 门禁/排队/subagent async/单槽）→ 逐句对照机制现状 → 矛盾句修——两族：
  - SESSION-FLOW.md（CLI——主会话流程）：INPUT-LOCK busy 句（旧"排队"描述——现"吞提交单槽消化"）/ async 句
  - WEBVIEW.md（VSC——webview 面）：busy readOnly 句（INPUT-LOCK-BEHAVIOR-REVISED 已改不禁——交付后同步）/ 排队句
- 注：若 BATCH 交付顺序使机制句未落（INPUT-LOCK-BEHAVIOR 在途）——以设计档为准修（两设计已批——行为定稿）
- 测试：doc 断言（双端已有 prompts/doc 断言先例——加"过时句零残留"grep 断言——fail-when-present）

## 受影响文件（双端）

| 文件 | 端 | 现行数 | 预计净变 | 改动 |
|---|---|---|---|---|
| ESCALATE.md | CLI | ~150 | ≤+3 | F-1 depth 指针句 |
| ESCALATE.md（VSC 镜像——若 VSC 有该档） | VSC | ~150 | ≤+3 | F-1 镜像 |
| SESSION-FLOW.md | CLI | 大 | ≤+5 | F-2 陈旧句修（busy/排队句） |
| WEBVIEW.md | VSC | 大 | ≤+5 | F-2 陈旧句修（readOnly/排队句） |
| test/（doc 断言——grep 零残留） | 双端 | 既有 | +10 | F-1/F-2 |

## 用例表

| 用例 | 输入 | 预期输出 |
|---|---|---|
| F-1 CLI | ESCALATE.md async 残留句 | depth 指针句落——权威锚照抄——F-1 |
| F-1 VSC | 同上（若 VSC 有档） | 同——F-1 |
| F-2 SESSION-FLOW | busy 旧排队句 | 修为新语义（吞提交单槽）——矛盾句零——F-2 |
| F-2 WEBVIEW | readOnly 旧句 | 修为不禁（可录入只禁 send）——F-2 |
| 错误：无残留 | grep 零命中 | 断言绿——F-1/F-2 |

## 验收

- AC-1 ESCALATE.md depth 指针句（权威锚照抄——grep 断言）
- AC-2 SESSION-FLOW/WEBVIEW 矛盾句零残留（与已交付行为不符句全修——grep 断言）
- AC-3 只修文档句——机制零动（代码 diff 空）
- AC-4 双端 npm test 快层零回归
- 红线：机制零动；doc 结构不重组；矛盾判定以设计档（INPUT-LOCK-BEHAVIOR-REVISED 等已批）为准

## 变更记录
- 2026-09-09：落档（评估残留清单文档面候选——ESCALATE async:false 句无 depth 维度 + SESSION-FLOW/WEBVIEW 陈旧句——批 4 收尾——DOC-SWEEP 先例结构不动）。
