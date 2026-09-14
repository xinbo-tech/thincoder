# settings 工具（SETTINGS-TOOL）· 需求

> 板块 = **`settings` 工具**（agent 可调的配置面）。
> 本档 = 该机制的**需求层权威**（F-ST1–F-ST6 / N-ST1–N-ST4 判定句）。
> 设计侧 = `docs/core/design/SETTINGS-TOOL.md`（**本板块设计权威**——2026-09-15 CLI 尾部真批新建）· `docs/core/design/TOOLS.md`（工具面总体——本档不复制，D2）；配置面总体 = `docs/core/design/CONFIG.md`。
> 建档：2026-09-15（**B 式迁移轮 · VSC 批 4**——`thincoder-vscode/docs/requirements/SETTINGS-TOOL.md` 内容重建入基准层；
> 旧档原地一字不改、留作参照历史）。CLI 侧同名需求档（`thincoder-cli/docs/requirements/SETTINGS-TOOL.md`）**已并入（2026-09-15 · CLI 尾部真批）**——
> 缺口（值解析去引号裁定 / 热应用语义细节 / 无静默集合相等判据 / 持久性边界 / CLI 边界族）已并入 §2–§4；(d) 类入 §5.1。
> 实测口径 = **as-of 2026-09-15 实核**（仓根 = `thincoder/`）。

## 1. 总体定位

agent 需要在不打断会话的前提下查看 / 修改运行配置（模型、轮次、压缩阈值、顾问、轨迹等）。
`settings` 工具把该面收成**受形状护栏的读写通道**：写盘 = 两端共享的 `config.json`，热应用 = 当前会话的 live 配置；
写入前做已知键校验与敏感键遮蔽，避免 agent 写出结构不符 / 泄漏凭据的内容。

## 2. 功能性需求

| # | 需求 | 判定句（可机器验证） |
|---|---|---|
| **F-ST1** | 只读动作面 | 列表 / 取值类动作为只读——主 agent 面可调（与记忆工具同分类），不需写权限（注册面 `thincoder-vscode/src/agent/setup.mjs`） |
| **F-ST2** | 写动作 = 写共享配置 | 设值类动作写共享配置（`thincoder-vscode/src/config-io.mjs`）+ 热应用到 live 配置（`thincoder-vscode/src/agent-tools/settings.mjs`）；**热应用语义**：回合边界读取的键（maxTurns / autoThink 等）下回合生效、会话内持续读取的键即时、重启不丢（写盘） |
| **F-ST7** | 值解析两端统一（**用户裁定 ① 去引号**——2026-09-11） | `JSON.parse` 成功且为顶层标量 / 对象 / 数组 → 解析结果；**解析成功但结果为字符串 → 解析值（去引号）**；parse 失败 → 字符串字面——两端同一语义；不可消费形态两端同拒、磁盘零变化 |
| **F-ST3** | 已知键校验 | 非空叶子由默认值表（agent / traces 默认集）**派生**——按规范全路径寻址，不手写镜像键表 |
| **F-ST4** | 形状护栏 | 不可消费形态明确拒绝（不落盘、不热应用）；空叶子与跨面 / 同族键走显式形状表；**无静默判据**（F-S1.8）：对每个受约束键断言「接受集 == 应用侧可消费集 ∧ 拒绝集 == 应用侧不可消费集」（表驱动集合相等，判据取自应用侧读取器本体——`thincoder-core/config.mjs:277` · `thincoder-cli/src/cli/make-agent.mjs:150` · `thincoder-core/agent-tools/subagent-spawn.mjs:92` · `thincoder-core/tools/bash.mjs:131` · `thincoder-core/model-ref.mjs:25-36` 形态面），被拒值的写入尝试不改变磁盘与内存 |
| **F-ST5** | 敏感键遮蔽 | 键段判定命中（密钥类键段名）⇒ 值遮蔽展示——读面不泄漏凭据 |
| **F-ST6** | 并发写冲突可见 | 目标文件被并发改过 ⇒ 拒绝本次写并返回同型冲突提示（不静默覆盖） |

## 3. 非功能性需求

| # | 维度 | 标准 |
|---|---|---|
| **N-ST1** | 防漂移 | 形状表与默认值表同源；新增键 ⇒ 护栏同步（漂移由用例锁） |
| **N-ST2** | 成功即生效 | 写盘成功 ⇒ 该配置对当前会话后续运行立即生效（无重启要求） |
| **N-ST3** | 零凭据落输出 | 工具输出永不含明文凭据（敏感键段一律遮蔽） |
| **N-ST4** | 可测试 | 工具形状、空叶子、跨面键、描述句由用例逐条断言；登记入测试清单 |
| **N-ST5** | 零 npm 依赖 | `settings` 实现只 import `node:*` 与仓内模块（`thincoder-core/config.mjs`——DEFAULTS / writeConfigAtomic / configPath）——与 config.mjs 同界 |
| **N-ST6** | 描述纪律 | 工具描述写清：set = 持久配置变更；敏感值永不明文回显；热应用语义（回合边界）；`/config` 是用户等效手动面；类型校验口径（含 null 默认值键按真实消费形态） |

## 4. 范围边界（不做）

- 不做凭据管理通道（密钥仍由用户 / 配置面维护——工具只在读面遮蔽）。
- ~~不做配置项自由添加（已知键之外一律拒绝）~~——**收正（2026-09-15 CLI 尾部真批）**：该句与双端实装相反——未知键 = **原样写入**
  （全量域：已知节内任意嵌套允许；证据 = `thincoder-core/agent-tools/settings.mjs:128` · `thincoder-vscode/src/agent-tools/settings.mjs:135`
  与双端工具描述「Unknown keys under a known section are stored as given」）。
- **持久性边界**（文档级）：可写键限 **loadConfig 保留域**（顶层已知节内）——节外任意键写盘后下次启动被合并逻辑丢弃。
- 不引入第二份配置存储（写面 = 共享配置文件单一权威）。
- 不改 `DEFAULTS` / `AGENT_DEFAULTS` 键集与语义；不改读取侧（`config.mjs` / `make-agent.mjs` / `bash.mjs` / `subagent-async.mjs`）。
- 不改其它写面：`/config` · `/shell` · `/submodel` TUI、VSC 面板写面、`persistRaw` / `writeConfigAtomic` 写链。
- 不校验渠道 / 模型 / 可执行文件存在性、角色名合法性（形状层止步——设计侧 D-ST9）；数组默认值键（`consultModels` / `streamRules` / `mcp.servers` / `providers`）维持既有豁免。
- 不改任何用户配置文件内容（改用户值是运维动作）。

## 5. 不并项与历史沿革

### 5.1 历史沿革（(d) 类——**不并**）

> 来源档 `thincoder-vscode/docs/requirements/SETTINGS-TOOL.md`（VSC 产品需求档）——**原地保留作参照历史**（保留 ≠ 维护）。下列内容不并入本档：

| 旧档位置 | 内容 | 何故不并 |
|---|---|---|
| 旧档头注「定位」（实现 `src/agent-tools/settings.mjs`（261 行）· 注册面 · 写盘面 · 部分承载 = `docs/design/TOOLS.md` §5） | 时点行数注与迁移前路径 | 时点坐标——现行坐标入各 F 判定句 |
| 旧档「跨端：与 CLI 仓同名需求档语义同源（同源形状表）」注 | 跨仓对位句 | 语义同源已由正文承载——不另立对位节 |
| 旧档变更记录（2026-09-12 建档行） | 建档流水 | 本档自有变更记录 |

> **CLI 侧来源档** `thincoder-cli/docs/requirements/SETTINGS-TOOL.md`（2026-09-15 CLI 尾部真批对账并入）——原地保留作参照历史。下列内容不并入本档：

| 旧档位置 | 内容 | 何故不并 |
|---|---|---|
| 旧档头注（状态行「已实现 + 第 8 批 / 第 13 批在途」+ 来源注 + §1 回填注「2026-09-10 抽取时 §1 遗漏——补回模板结构」） | 时点状态 / 批次语境 | 批次语境——现行态已入 §1–§4（批次均已收口落地） |
| 旧档 N-S1.3「settings.mjs 只 import node:fs/path」 | **陈旧口径** | 第 8 批后实装 import `../config.mjs`（DEFAULTS / writeConfigAtomic / configPath——`:12` 实核）——按现状收正为 N-ST5 |
| 旧档 F-S1.7 的「VSC 端对位（第 12 批 W2 裁定）」块（VSC 仓测试编号 T-S2.36/T-S2.37 + VSC TOOLS 档指针） | 跨仓用例编号引例 | 跨仓指针（P3 自持纪律）——不并；对位语义已由 F-ST4 / N-ST1 承载 |
| 旧档变更记录（无——该档未带变更记录节） | —— | —— |

### 5.2 不并项登记（跨板块 / 一次性材料——**不并**，逐项登记）

| 旧档面 | 内容 | 何故不并（去向 / 触发） |
|---|---|---|
| 旧档「部分承载 = `docs/design/TOOLS.md` §5」指针 | 跨档承载句 | 归 `docs/core/design/TOOLS.md`（本档只留设计侧指针） |
| 「机制在位无档补建」建档批注 | 建档批序 | 一次性材料——归批次档 |
| CLI 侧同名需求档未迁面 | CLI 产品需求正文 | **已并入（2026-09-15 CLI 尾部真批）**——缺口入 §2–§4，(d) 类入 §5.1；**§4 错误边界行已按双端实装收正**（详见变更记录） |

## 6. 体量与拆分规划（R24a）

**实测行数**：本档 **约 90 行**（as-of 2026-09-15 CLI 尾部真批并入后实核）——**低于 300 行软线，无需拆分规划**。

## 变更记录

- 2026-09-15（**CLI 尾部真批 · 并入既有 · eng-designer**）：`thincoder-cli/docs/requirements/SETTINGS-TOOL.md` 逐节对账并入——
  **缺口**：F-ST7（值解析去引号裁定）· F-ST2 热应用语义细节 · F-ST4 无静默集合相等判据 · N-ST5 / N-ST6 · CLI 边界族（§4）· 持久性边界（F-S1.6 入 §4）；
  **收正**：§4「已知键之外一律拒绝」与双端实装相反（未知键原样通过——`thincoder-core/agent-tools/settings.mjs:128` / VSC 同型 `:135` + 双端描述句）⇒ 按现状收正；
  (d) 类（状态行 / N-S1.3 陈旧口径 / VSC 跨仓引例）入 §5.1。档头补设计侧指针（本批新建 `docs/core/design/SETTINGS-TOOL.md`）。旧档原地一字不改。
- 2026-09-15（**B 式迁移轮 · VSC 批 4**）：建档——`thincoder-vscode/docs/requirements/SETTINGS-TOOL.md` 内容重建入基准层
  （旧档一字未改、原地作参照历史）；判定句坐标按现状实核改写（`thincoder-vscode/src/{agent-tools/settings,agent/setup,config-io}.mjs`）；
  敏感键判定按判据句书写（不列字面键段名，避与实现词表分叉）。
