# 主会话设计能力增强（MAIN-DESIGN-ENHANCE）

> 板块：工程模式提示词（双端——主会话即 designer——承接 designer 取消）。权威源：METHODOLOGY.md（结构）+ engineering.md（行为纪律——双端注入）。
> 状态：**设计待评审**——2026-09-09 落档（主会话增强勘察 explore 一手——四维缺口确认——载体明确：行为→engineering.md + 结构→METHODOLOGY + 锚→ENGINEERING-MODE §2.9 + 断言测试）。需求：TODO 主会话设计能力增强（四维——2026-09-09 用户裁 designer 取消——主会话即 designer）。

---

## 需求

- **总体目标**：eng 模式主会话即 designer——补强四维设计能力（① 评审前预检 ② 方案选型对比 ③ 勘察 checklist ④ 实践沉淀）——行为纪律入 engineering.md（双端）+ 结构定义入 METHODOLOGY（权威源 + 双端根注入副本）——无 designer 子代理（纯提示词/文档增强——无代码面）。
- **功能性**：
  - F-1 评审前预检 checklist（挂 flow step 3——design 评审触发前自检）
  - F-2 设计文档强制"方案选型对比"子节（候选 ≥2 才需对比——单方案声明豁免）
  - F-3 设计启动前勘察 checklist（doc_search → 文档地图定 owner → 既有实现/先例 → 测试面 → 双端对位）
  - F-4 实践沉淀方法论化入口句（好实践 → METHODOLOGY 机制正文/反例档案——不散落会话）
  - **范围边界**：无代码改动（纯提示词 + 文档）；不侵蚀"评审发起权在用户"（预检是准备非评审本身）；勘察 checklist 不与"委派纪律/不重复已委派探索"冲突。

## 设计（勘察骨架——照做勿自行解释）

### 载体落点
1. **行为纪律 → engineering.md（双端 src/prompts/engineering.md——逐字同构）**：四维执行条款——F-1 预检清单挂 Mandatory Flow step 3（"设计就绪待评审"步——present + remind 前自检：三层具体可设计？/ 受影响文件全且标注行数？/ 验收逐条回指？/ UI 决策全落档？/ 方案对比已做？）——F-2 方案对比模板子节要求——F-3 勘察 checklist 挂 step 1——F-4 沉淀入口句（好实践 → docs/design/METHODOLOGY.md——不散落）
2. **结构定义 → METHODOLOGY**：权威源 thincoder/docs/design/METHODOLOGY.md 新增节（三层模板细化 + 方案选型对比模板表 + 单一锚纪律）——同步 CLI 根 METHODOLOGY.md + VSC 根 METHODOLOGY.md（同源字节同步——先落 docs/design 再同步根）
3. **ENGINEERING-MODE.md §2.9 锚登记**：新纪律若含逐字锚句 → 登记 §2.9 锚清单（7→N——fail-when-unchanged 断言）
4. **测试**：双端 prompts-async-guidance 型断言（新纪律句驻留 + 双端逐字一致 fail-when-unchanged）——无代码测试

### 冲突点核对（设计内已防）
- F-3 勘察 checklist 与 "Delegation — Read a file yourself ONLY when about to edit" + "不重复已委派探索" —— checklist 是委派前信息收集纪律（doc_search/地图/先例定位——委派给 explore 的内容不在主会话重复读）
- F-1 预检与 "评审发起权在用户" —— 预检是评审前自检（确保设计就绪）非替代用户发起

## 受影响文件（双端——纯提示词 + 文档）

| 文件 | 端 | 改动 |
|---|---|---|
| src/prompts/engineering.md | CLI | 四维纪律句（逐字同构） |
| src/prompts/engineering.md | VSC | 同 |
| docs/design/METHODOLOGY.md | CLI | 结构定义新增节（权威源） |
| METHODOLOGY.md（根注入副本） | CLI/VSC | 同源同步 |
| docs/design/ENGINEERING-MODE.md | 双端 | §2.9 锚登记（如落锚） |
| test/（prompts-async-guidance 型） | 双端 | 断言新纪律句驻留 |

## 用例表

| 用例 | 输入 | 预期输出 |
|---|---|---|
| 预检触发 | 设计就绪待评审步 | 自检清单执行（5 项）——F-1 |
| 多方案设计 | 设计含 ≥2 候选 | 方案对比表（候选/判据/取舍/否决）——F-2 |
| 单方案设计 | 1 方案无对比 | 声明豁免——F-2 |
| 勘察启动 | 设计前 | doc_search→owner→先例→测试面 checklist——F-3 |
| 好实践出现 | 会话中有效实践 | 入口句引导落 METHODOLOGY——F-4 |
| 锚断言 | prompts 测试跑 | 双端纪律句逐字驻留 fail-when-unchanged |

## 验收

- AC-1 engineering.md 双端含四维纪律句（逐字一致——prompts-async-guidance 断言绿）
- AC-2 METHODOLOGY 权威源 + 双端根同步（新增节三处一致）
- AC-3 锚登记（若落锚——ENGINEERING-MODE §2.9 更新 + 断言）
- AC-4 预检/勘察不冲突委派纪律（措辞核对）
- AC-5 评审发起权在用户不受影响（无自动评审措辞）
- 红线：无代码改动（纯提示词/文档）——双端逐字同构

## 变更记录
- 2026-09-09：落档（勘察一手——四维缺口确认 + 载体落点 + 无 designer 历史提示词确认（现树/archive 均无——取消于实现前）+ 冲突点防设）。
