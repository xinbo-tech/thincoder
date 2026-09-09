# 施工设计②——装配代码改造（PROMPT-SYSTEM-IMPL-CODE）

> 归属：PROMPT-SYSTEM.md（已批准）施工设计——装配代码面。与施工①（文本迁移）并行、互不阻塞；
> 施工③依赖①②交付。状态：**待评审/待批准**。

---

## 1. 改造点（CLI setup.mjs 390 行 / VSC setup.mjs 同构）

### 1.1 CLI（src/agent/setup.mjs + agent.mjs）

| 改造点 | 现状 | 目标 |
|---|---|---|
| G1 常量装载 | agent.mjs L36-38 SYSTEM_PROMPT/DISCIPLINE_RULES/MAIN_OVERLAY | 换七件：PERSONA_ENGINEERING/PERSONA_NORMAL/COMMON/DISCIPLINE_ENGINEERING/DISCIPLINE_NORMAL/CONSULT_BASE（+顾问系不变）；agent.mjs L113 prepareRun 传参同步 |
| G2 主装配分支 | L322-336（consult/工程/普通三分支） | 四槽位装配函数 `assemblePrompt({scenario})`：人格→common→纪律→(AGENTS+skills 由既有尾部逻辑承担)——每槽缺失跳过+警告（蓝图 §3.4） |
| G3 子代理分支 | L320/L363 needsDiscipline | 子代理 scenario 映射：eng-coder=人格 eng-coder+纪律 engineering；explore/coder/plan=各人格+纪律 normal；consult=CONSULT_BASE 不变 |
| G4 buildEngineeringPrompt | L40-74（读 engineering.md/engineering-sub.md+METHODOLOGY+D-M1/D-M2） | **删除**（被四槽位装配取代）；METHODOLOGY 读取/D-M1/D-M2 警告/template 携带整段删 |
| G5 METHODOLOGY/AGENTS | L376 loadProjectInstructions（AGENTS）保留 | 不动；METHODOLEY 读取点删 |
| G6 eng-coder 强制工程 | subagent-spawn.mjs L305 childConfig engineering=true | 语义保留（scenario=eng-coder 即工程纪律）——实现形式随 G3 |

### 1.2 VSC（setup.mjs L317-334 + run-helpers.mjs loadEngineeringPrompt L43-63）

同构改造：loadEngineeringPrompt 删除、runAgent 分支换 assemblePrompt 同构实现、agent.mjs 常量装载同步。端特有差异（如有）按多实现面纪律原地上报。

## 2. 设计决策

- **D1 单装配函数**：assemblePrompt(scenario) 取代散落 if/else——场景→槽位文件映射表驱动（表 = 蓝图 §3.2 矩阵的字面实现），新增场景只加表行
- **D2 警告通道**：槽缺失警告走既有 setup 警告通道（history 注入）——不新增机制
- **D3 字节稳定**：同场景每 run 拼装结果字节确定（provider prefix cache 前提）——槽文件内容固定、顺序固定
- **D4 前缀缓存考量**：人格层在前意味着不同模式前缀不同——可接受（模式切换低频）；公共层位置固定不漂移

## 3. 受影响文件（代码——需行数标注）

| 文件 | 现行数 | 增量 | 改动 |
|---|---|---|---|
| src/agent/setup.mjs | 390 | -60 区 | G2-G5：三分支→assemblePrompt；buildEngineeringPrompt/D-M1/D-M2 删 |
| src/agent.mjs | 146 行区 | ±8 | G1 常量换七件+传参 |
| src/agent-tools/subagent-spawn.mjs | 431 | ±5 | G6 scenario 语义 |
| VSC setup.mjs | 待实测 | 同构 | 同 CLI |
| VSC run-helpers.mjs | 待实测 | -25 区 | loadEngineeringPrompt 删 |
| VSC agent.mjs（对应装载点） | 待实测 | 同构 | 同 CLI |
| test/prompts-async-guidance.test.mjs | 165 | 重写 | 施工③范围——本批锚测试面 |

（setup.mjs 390→~330：不跨档；VSC 待实测行数进施工③核。）

## 4. 用例表

| 用例 | 输入 | 预期 |
|---|---|---|
| 工程/普通/eng-coder/explore/coder/plan/consult 七场景 | 各 spawn/回合 | system prompt 按矩阵逐槽拼装（文件名/顺序断言） |
| 槽缺失 | 人格或纪律或 common 文件删 | 跳过+警告；其余槽正常 |
| AGENTS 缺失 | 项目无 AGENTS.md | 静默跳过（无警告） |
| consult | 会诊 spawn | consult-base.md 单独基底（无四槽） |
| 字节稳定 | 同场景两次 run | system prompt 字节一致 |

## 5. 验收

- AC-1 七场景装配断言全绿（蓝图 §3.2 矩阵 1:1）
- AC-2 降级链三款行为断言（蓝图 §3.4）
- AC-3 buildEngineeringPrompt/engineering-sub/D-M1/D-M2 全仓零引用
- AC-4 双端快层零回归（③锚测试同步后）
- 红线：consult/advisor 特殊模块语义不动；toolSchemas 生成逻辑不动；超出本表文件停下报告

## 变更记录
- 2026-09-10：落档（施工②装配代码——与施工①并行——D1 表驱动装配为核心决策）。
