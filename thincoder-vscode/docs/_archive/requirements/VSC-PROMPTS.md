# VSC 提示词（VSC-PROMPTS）— 需求

> 板块：提示词系统（VSC 端）——槽位化装配 / 双源 / 降级链 / 端特有段。需求层文档（`docs/requirements/`）。
> 定位：本仓提示词面的**需求层登记**——装配层 `thincoder-core/prompt-overlays.mjs`（W2 已迁核——现体核内单点；79 行）+ `src/agent/setup.mjs`（464 行）；文本面双源各 15 档（核包落地 / 本端中文镜像）；设计 = `docs/design/VSC-PROMPTS.md`（309 行）。
> 对位注记：**异名对位**——对端档名 = `PROMPT-SYSTEM（CLI 仓·需求）`（分层模型 / 命名法 / 装配矩阵 / 编写纪律的机制权威）；本端档名 = `VSC-PROMPTS`（取本端权威档名）。
> 语义同源、各端原文自持（多实现面纪律——不做逐字一致、不建跨端同步依赖）。
> 状态：**现行**（槽位化已落——旧件退役）。

## 1. 总体需求

提示词是产品行为的承载面。主会话（工程 / 普通两模式）与各子代理角色的行为由**槽位化提示词分层装配**：
人格层 → 公共层 → 纪律层（固定序），再由项目层（AGENTS.md）与 skills 动态追加。
装配必须表驱动、降级可见（缺槽警告、不静默）、双源可控（中文权威 / 英文落地）。

## 2. 功能性需求

| # | 需求 | 判定句（可机器验证——证据均为本仓实测） |
|---|---|---|
| F1 | 四槽位分层模型 | 槽位 = [1] 人格层（「你是谁」）→ [2] 公共层（两模式共用协作基础，恒第二位）→ [3] 纪律层（「怎么干活」）；[4] 项目层动态（AGENTS.md + skills 尾块）。判定句：装配函数按槽表输出固定序（见 F2） |
| F2 | 场景 → 槽位装配矩阵（表驱动） | `SCENARIO_SLOT_FILES`（`thincoder-core/prompt-overlays.mjs:40-49`——W2 已迁核，现体核内单点）逐场景链：engineering / normal / eng-coder / eng-designer / explore / coder / plan + consult（自含——不入主链）；`assemblePrompt`（`:67`）按表拼接 |
| F3 | 降级链（缺槽可见、层间隔离） | 槽文件缺失 → 该槽跳过 + 醒目警告（`slotWarning`——`thincoder-core/prompt-overlays.mjs:52-54`——W2 已迁核，现体核内单点；depth-0 注入 history——`src/agent/setup.mjs:377-378`）；**不 fallback 其他槽**；AGENTS.md 缺失 = 项目层静默跳过（既定语义） |
| F4 | 双源（中文权威 / 英文落地） | `docs/design/prompts/` 15 档（权威源——设计 / 内容维护位）× 英文落地 15 档（W2 已迁核——现体 = 核包 `prompts/`）；变更流 = 改中文模板 → 内容把关 → 译英回填；落地质量 = 内容把关 + 设计评审（散文锚已退役） |
| F5 | 特殊模块自含 | `consult-base.md`（自含基底——consult 场景直出）；`advisor-design.md` / `advisor-round{1,2,3}.md`（`src/advisor/main.mjs` 独立注入——setup 不拼装）；缺失 → 模块不可用报错（不自降级） |
| F6 | 端特有段保留 | R14 池规则段（原 `src/prompts/discipline-engineering.md` 尾部节——W2 已迁核并入注入值：现体 = `src/prompt-injections.mjs` 的 `discipline-engineering-vsc-r14-pools`；per-role-domain 池上限语义；本端独有）；面特有段各端原地保留、不并入他端、不建跨端同步依赖 |
| F7 | 装配可测 | 装配矩阵 / 降级链 / 双源断言面：`test/prompts-mirror-anchors.test.mjs` · `test/prompts-async-guidance.test.mjs` · `test/context-parity.test.mjs`（[4] 层注入面）——快层全绿 |

## 3. 非功能性需求

| # | 维度 | 标准（含度量） |
|---|---|---|
| N1 | 内容归属判定 | 新增 / 修改提示词内容先判槽位归属再写（模式 / 角色身份 → 人格层；协作基础（语言 / 确认门 / 合同纪律）→ 公共层；怎么干活（流程 / 规则 / 工具观）→ 纪律层；仅项目相关 → 项目层）；冲突判定：人格层 > 公共层 |
| N2 | 条文通用化 | 提示词条文不得绑死本产品两端 / 本仓具体形态（术语入条文须带通用化表述）；零维护者注（无日期 / 批号 / 评审号） |
| N3 | 装配稳定 | 每场景装配输出逐字节稳定（固定槽内容 + 固定序——无时间戳）；同场景重跑输出全等 |
| N4 | 文档面可读 | `docs/design/prompts/` 各档行宽 ≤300 字符单行（机检 `node scripts/check-doc-width.mjs` 零超宽） |

## 4. 范围边界（不做）

- 不重述对端蓝图正文（机制权威 = `PROMPT-SYSTEM（CLI 仓·需求）`；本档只承载本端需求与落点）。
- 不做逐字一致 / 不建跨端同步依赖 / 不建跨仓锚断言（多实现面纪律）。
- 不改装配矩阵语义与降级链语义（改动走批次流程）。
- 不承载条文正文（工具路由表 / 推进档位等条文住相应档；本档只登记需求面）。

## 5. 变更记录

- 2026-09-12：建档（需求树逐档成套轮 B13 建档实施 C 轮——异层者建档 + **异名对位**（对端 `PROMPT-SYSTEM`）；内容 = 既有机制实况登记，零新需求语义）。
