# 施工设计③——锚测试重写与存量迁移（PROMPT-SYSTEM-IMPL-TEST-MIGRATE）

> 归属：PROMPT-SYSTEM.md（已批准）施工设计——测试与存量迁移面。**依赖施工①（文本定稿）+②（装配
> 代码）交付后启动**（断言对象 = ①的新文件文本 + ②的装配行为）。状态：**待评审/待批准**。

---

## 1. 锚测试重写（test/prompts-async-guidance.test.mjs 165 行——重写）

### 1.1 现状

现断言对象：main.md/engineering.md/discipline.md/advisor-round1-3/advisor-design 七文件的锚句
（MAIN-DESIGN-ENHANCE A1-A4 + ASYNC-RESIDUE-FIX 删句 + 工程模式 prompt 断言）——**4 红存量**
（重排批 1/2 与旧锚错位——本批一并收敛）。

### 1.2 重写清单

| 断言组 | 旧对象 | 新对象 | 断言形态 |
|---|---|---|---|
| A1-A4 设计纪律锚 | engineering.md | persona-engineering.md（①③④人格部分）+ discipline-engineering.md（A2 方案对比——纪律部分） | 命令型保逐字 / 列举型子串（按 PROMPT-ATTENTION 阶段 D 分类） |
| 开关段 C1-C4 | engineering.md/main.md/system.md | persona-engineering.md（C1-C4 结构位）+ persona-normal.md（推进档位语义句） | 逐字锚 |
| ASYNC-RESIDUE 删句 | main.md/engineering.md | persona-normal/engineering（删句后形态——永不出现断言） | 负向断言 |
| 搜索工具条款 | discipline.md/engineering.md | discipline-normal/engineering（逐字一致双断言——D-P1 先例） | 双文件逐字一致 |
| **新增：装配矩阵断言** | 无 | assemblePrompt 七场景（施工②） | 文件名/顺序/槽完整性逐场景 |
| **新增：降级链断言** | 无 | 三款 §3.4 行为 | 槽缺失→警告；AGENTS 缺失→静默 |
| **新增：编写纪律巡检** | 无 | 14 新文件头部 slot 注释 / 表行 >200 零命中 / 前 20% 巡检词 | 机械扫 |

## 2. 存量迁移清单（双仓）

| 项 | 动作 |
|---|---|
| CLI cwd/METHODOLOGY.md（145 行） | 骨干已由施工①分拣定稿——本批执行：核无遗漏后**删除**；项目特有约定（如有）并入 AGENTS.md |
| VSC cwd/METHODOLOGY.md（142 行） | 同上 |
| src/prompts/methodology-template.md | 施工①已废——本批 grep 确认零引用（setup.mjs/cmd-eng.mjs 引用点施工②删） |
| "METHODOLOGY"概念引用清扫 | ENGINEERING-MODE.md / PROMPT-DECOUPLING.md / AGENTS.md 模块图 / 各设计档引用处——改指蓝图新结构（逐处过目，逐档列改点） |
| docs/TODO.md 技术组 | 本蓝图+三施工档条目核销登记 |
| README.md（地图） | 提示词系统行更新（施工设计三档按届时的处置标注——完成归档或保留） |

## 3. 受影响文件

| 文件 | 操作 | 现行数 | 增量 |
|---|---|---|---|
| test/prompts-async-guidance.test.mjs | 重写 | 165 | ~200 行区（七场景装配+降级+编写纪律巡检+锚句迁移） |
| 双仓 METHODOLOGY.md | 删除 | 145/142 | — |
| ENGINEERING-MODE.md / PROMPT-DECOUPLING.md / AGENTS.md（双端） | 修改 | 待实测 | 引用改写 |
| docs/TODO.md | 修改 | — | 核销登记 |

## 4. 用例表

| 用例 | 输入 | 预期 |
|---|---|---|
| 锚句迁移 | 新文件 grep A1-A4/开关段句族 | 逐字存在——断言绿 |
| 旧文件退役 | system/engineering/engineering-sub/main/discipline/methodology-template | 文件不存在+全仓零引用 |
| 存量迁移 | 双仓 METHODOLOGY.md | 已删；骨干入纪律层（施工①映射表核对） |
| 引用清扫 | grep "METHODOLOGY" 双仓文档 | 概念引用零残留（变更史叙述除外） |
| 快层 | npm test | 全绿（4 红存量随本批收敛归零） |

## 5. 验收

- AC-1 锚测试重写全绿（含存量 4 红归零）
- AC-2 旧七文件退役+零引用
- AC-3 双仓 METHODOLOGY.md 删除+骨干无遗漏（施工①映射表核对单）
- AC-4 概念引用清扫完成（变更史叙述豁免）
- AC-5 双端 npm test 快层全绿
- 红线：advisor 四件套内容不动；特殊模块语义不动；变更史档（批次记录）不篡改只加"已被取代"注

## 变更记录
- 2026-09-10：落档（施工③锚测试与存量迁移——依赖①②交付——存量 4 红在本批收敛归零）。
