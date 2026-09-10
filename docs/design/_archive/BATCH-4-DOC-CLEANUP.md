> **变更史——正文冻结**（2026-09-10 文档重组批）：本档为一次实施批的过程记录或已被取代的旧权威档，
> 内容 as-of 交付时点，**不作为现状依据**。现状见 `docs/README.md` 地图指向的板块权威档。

# 批 4：异步残留 doc 候选 + 跨文档陈旧清理（BATCH-4-DOC-CLEANUP）

> 板块：文档面（双端——异步化残留候选 + 陈旧清理）。权威源：AGENT-LOOP §7.7.1（escalate/advisor 顶层一律异步——同步保留例外全移除）+ §11.2 R13 + 全异步化适配评估残留清单。
> 状态：**评审通过——已交付（CLI 2a22c1e + VSC f696369——clean——CLI 221/0 + VSC 262/0——ESCALATE 双端锚句 byte-final 核对 + WEBVIEW L175 同步——8 点分批收尾——L2 待链稳定）**——2026-09-09 落档

---

## 需求

- **总体目标**：文档面收尾——① ESCALATE 双端 async:false 残留句（与 §7.7.1"同步保留例外全移除"矛盾——全异步化评估残留清单文档面候选）② VSC WEBVIEW.md 陈旧句（INPUT-LOCK busy 门禁句——修订交付后需同步"只禁 send 不禁录入"）。
- **功能性**：
  - F-1（ESCALATE 双端 async:false 残留——评审 #1 真面）：
    - CLI ESCALATE.md **L99**（逐字旧句）"**`async: false` 保留同步旧路径**（向后兼容——既有同步语义零回归）。同步路径下："——与 §7.7.1 矛盾——修为"顶层一律异步（同 §7.7——§7.7.1：同步保留例外全移除——报告自动到）——`async:false` 仅机制参数（depth>0 子代理内同步——平台规则）"——逐字锚照抄 AGENT-LOOP §7.7.1（L668 escalate 句——byte-final——评审 #7 round2）
    - VSC ESCALATE.md **L105**（逐字旧句）"**`async:false` 保留同步旧路径**（向后兼容——既有同步语义零回归）。"——同修（VSC 档结构不同——锚句一致照抄）
    - 检查同段其余句（同步语义描述——若残留一并清——grep "同步旧路径/同步语义零回归" 双端零）
  - F-2（VSC WEBVIEW.md send.js 拦截句——评审 #1 真面——INPUT-LOCK 修订同步）：
    - WEBVIEW.md **L175**（逐字旧句）"由 host 排队（send.js `isRunning && !S._suspended` 才拦截）。Stop 只在 running 显"——INPUT-LOCK-BEHAVIOR-REVISED 交付后（只禁 send 不禁录入——readOnly 移除）→ L175 句修为"send 拦截保留（`isRunning`——Enter/发送按钮拒发——输入框不禁——可继续录入）"——以 INPUT-LOCK-BEHAVIOR-REVISED 设计档行为为准（该设计已批——行为定稿）
    - 其余 readOnly/busy 句 grep 核——凡描述旧"输入框禁用"的句同步修
  - **范围边界**：只修文档句不改机制；SESSION-FLOW-A/B/C.md（已实施独立机制档——标题 busy 窗口机制——非陈旧面——**不列**——评审 #1 纠正）；CLI SESSION.md（勘察零命中门禁旧句——**不列**——评审 #1 纠正）；陈旧面以"与已交付/已批行为矛盾"为准（不追求全面重写）；结构不重组。

## 设计（勘察落点——照做勿自行解释）

### 1. F-1 ESCALATE 双端（残留句——逐字枚举）
- CLI ESCALATE.md（177 实测）：L99 旧句删"`async: false` 保留同步旧路径（向后兼容——既有同步语义零回归）。同步路径下："→ 新句"顶层一律异步（同 §7.7——§7.7.1：同步保留例外全移除——报告自动到）。`async:false` 仅机制参数——depth>0 子代理内同步（平台规则）。"
  ——**逐字锚 = AGENT-LOOP §7.7.1 escalate 句（L668——byte-final——评审 #7 round2：新句首段与锚逐字一致（含
  §7.7.1：）——实现时以 AGENT-LOOP 原文为准照抄**——锚句 byte-final（评审 #6）
- VSC ESCALATE.md（165 实测）：L105 同款旧句删 → 同锚新句（VSC 档结构不同——检查 §2.3 async 现行机制段残余同步描述——grep "同步旧路径/同步语义零回归" 段清）
- 测试：grep 断言（双端——片段 "同步旧路径" + "同步语义零回归" 零残留——fail-when-present——AC-1——评审 #8 round2：全串模式不命中逐字引文——片段为准）

### 2. F-2 WEBVIEW.md 陈旧句（INPUT-LOCK 修订同步——评审 #1 真面）
- VSC WEBVIEW.md（344 实测）L175：send.js 拦截句修为新行为（INPUT-LOCK-BEHAVIOR-REVISED 已批——行为定稿：send 禁保留——输入不禁）——全档 grep busy/readOnly/排队句——凡与"只禁 send 不禁录入"矛盾的句修——非矛盾句（busy-state 机制面）保留
- 时序（评审 #5 coordination）：INPUT-LOCK-BEHAVIOR-REVISED 实现中（id=13）——本批 F-2 紧随其后执行（或同批——若 id=13 先交付按实现同步——若未交付按设计档行为修——以设计为准）
- 测试：grep 断言（"readOnly 锁" 旧句零残留 + "由 host 排队" L175 特征零残留——WEBVIEW 面——AC-2——评审 #8 round2）

## 受影响文件（双端——评审 #1 纠正版）

| 文件 | 端 | 现行数（实测） | 预计净变 | 改动 |
|---|---|---|---|---|
| docs/design/ESCALATE.md | CLI | 177 | ≤+2/−2 | F-1 L99 残留句修（锚照抄） |
| docs/design/ESCALATE.md | VSC | 165 | ≤+2/−2 | F-1 L105 残留句修（锚照抄） |
| docs/design/WEBVIEW.md | VSC | 344 | ≤+3 | F-2 L175 send.js 句同步（INPUT-LOCK 修订） |
| test/prompts-async-guidance.test.mjs（F-1 grep 断言） | 双端 | 既有 | +5 | AC-1 零残留 |
| test/webview-turnstate.test.mjs 或 webview 面测试（F-2） | VSC | 既有 | +5 | AC-2 旧句零残留 |
| ~~SESSION-FLOW-A/B/C.md / SESSION.md~~（评审 #1 纠正——非陈旧面——不列） | — | — | — | — |

## 用例表

| 用例 | 输入 | 预期输出 |
|---|---|---|
| F-1 CLI | ESCALATE.md L99 旧句 | 删 + 锚新句——grep 零残留——F-1 |
| F-1 VSC | ESCALATE.md L105 旧句 | 同——F-1 |
| F-2 WEBVIEW | L175 send.js 拦截旧句 | 修（send 禁保留——输入不禁）——F-2 |
| F-2 readOnly 面 | 全档 grep 旧锁句 | 矛盾句零——非矛盾 busy-state 句保留——F-2 |
| 错误：零残留 | grep "同步旧路径/同步语义零回归/readOnly 锁" | 断言绿——F-1/F-2 |

## 验收

- AC-1 ESCALATE 双端 async:false 残留句零（grep 片段 "同步旧路径" + "同步语义零回归"——评审 #8 round2：全串模式因反引号/空格不命中两端逐字引文——片段为准——零命中 fail-when-present）
- AC-2 WEBVIEW.md 与 INPUT-LOCK-BEHAVIOR-REVISED 行为一致（send 禁保留——无"输入框禁用/readOnly 锁"旧句 + **L175 特征片段 "由 host 排队" 零残留（评审 #8 round2——L175 头条编辑守卫）**——grep 断言）
- AC-3 **机制/产品代码零动**（src 逻辑 diff 空——测试断言文件除外——评审 #3 措辞修正）
- AC-4 双端 npm test 快层零回归
- AC-5 锚句与 AGENT-LOOP §7.7.1 L668 **byte-final 逐字一致**（评审 #7 round2——非语义锚——双端照抄同源）
- 红线：机制零动；SESSION-FLOW-A/B/C + SESSION.md 零动（评审 #1——非陈旧面）；doc 结构不重组；锚句 byte-final 以 AGENT-LOOP §7.7.1 为准

## 变更记录
- 2026-09-09 **交付偏差记录**：F-2 测试宿主偏离设计点名——webview-turnstate.test.mjs 被并行 INPUT-LOCK
  （id=13）占用——断言置入双端已点名的 prompts-async-guidance.test.mjs（doc 断言同族）——父侧已确认可接受
  （受影响表该行由父侧更新为实测宿主）。
- 2026-09-09：落档（初版——SESSION-FLOW.md 归属误标——评审 #1 🔴 纠正：SESSION-FLOW-A/B/C 在 VSC 仓为已实施机制档、CLI SESSION.md 勘察零命中——真面 = ESCALATE 双端 async:false 残留句（L99/L105——与 §7.7.1 矛盾）+ WEBVIEW.md L175 send.js 句——重写受影响表——句子逐字枚举 + AC-3 措辞 + 行数实测 + 锚句 byte-final——round 2 待评）。
- 2026-09-09：round 2 修正（评审 #2 changes-required——#7 锚句统一含 §7.7.1：+ AC-5 byte-final 措辞 + #8 AC 片段模式 + L175 特征）——round 3 待评）。
- 2026-09-09：round 3 修正（评审 #3 pass——#8 残留：:28/:33 测试行对齐片段措辞——评审通过——待实现）。
