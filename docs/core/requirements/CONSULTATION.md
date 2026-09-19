# 评审 · 会诊 · 飞刀（CONSULTATION）· 核心统一子系统需求档

> 板块归属 = **核心统一**（phase 2——「一个核 + 两个薄壳」）；本档 = 该板块的**子系统需求档**（三层归属之需求层）。
> **工作流档**（需求层）= `docs/core/requirements/CORE-UNIFICATION.md` §1–§4 + §5 登记表（统一目标 / 边界原则 / 量级读数基线 / 范围边界）——本档**不复制**（D2 单一权威源）。
> **设计层** = `docs/core/design/CONSULTATION.md`（本子系统设计与测试）；工作流设计档 = `docs/core/design/CORE-UNIFICATION.md`。
> 建档：2026-09-13（**需求侧拆分轮**——用户 2026-09-13 明令「需求侧文档先拆」）。**不新增需求**：条文分**搬移 / 回填 / 派生**三类并逐条标来源；无现成表述者由设计裁决派生，标「**派生 · 非用户原话**」。
> 命名与层级 = **板块镜像**（`requirements/<板块>.md` ↔ `design/<板块>.md`，**同板块名**）——规则原文见 CLI 产品地图 `thincoder-cli/docs/README.md` §3.2；三层归属见同图 §3.1。
> **需求条目面**（§4 · 2026-09-14「B 轮并入」）：自 CLI 产品需求档并入的**既有需求条目正文**（编号承旧档）——**无新增需求**。

## 1. 总体定位

评审 · 会诊 · 飞刀 = advisor 主面（`advisor.mjs` + `src/advisor/*`）**+** 工具面（`advisor` · `consult` · `advisor-settle` · `review-streak` · `subagent-panel`）**+** 飞刀（升级到更强模型）。
VSC 侧对应面住 `thincoder-core/advisor.mjs` + `src/advisor/*`（拆 `provider.mjs` · `tools.mjs`）与 `agent-tools/subagent-escalate*`。
本板块对本子系统的要求 = 该面归一为**核内单一实现**（含评审止损护栏）。

> 面清单与逐面裁决（分类 / 端差处置 / 前提校验 / 归属段）→ `docs/core/design/CONSULTATION.md` §1–§2（不复制）。

## 2. 功能性需求

### 2.1 本子系统条目

- **【派生 · 非用户原话】** 评审 · 会诊 · 飞刀面归一为**核内单一实现**：advisor 提示词选择 / 跟进构建 / 会话装配取一侧；评审 provider 解析与工具集按核内结构归位；**评审止损护栏**（同一批设计文档连续失败达阈值即**拒发**并给失败尝试表）取 CLI 并在**两端生效**。
  源 = 设计档 `CONSULTATION.md` §2.1–§2.4 · §3.1 A24。

### 2.2 适用工作流条目（回指 · 不复制）

| 条目 | 适用于本子系统的哪一面 |
|---|---|
| F11 | 对称面**进核**的准入（评审 / 会诊面属「进核」集合） |
| F6 | 裁决**逐条落实**（止损护栏在 VSC 侧生效 = 裁决结果） |
| F12 | 凡改可观察行为者**逐条提交裁定**（本面命中 ①） |
| F3 | 核内实现**只从两侧提取**（来源可追溯） |
| F13 | 对外契约面（事件语义类）变更须登记 |

## 3. 非功能性需求

本子系统无独立非功能条目。适用工作流条目（回指）= **N1**（未涉面不得无故回归）· **N2**（建核段两产品零改动 · 可回退）· **N3**（核独立可验证）· **N5**（单一权威源）· **N8**（结构尺度）。

## 4. 需求条目（自 CLI 产品需求档并入 · 2026-09-14 · B 轮）

> **来源** = `thincoder-cli/docs/requirements/CONSULTATION.md`（28 行 · CLI 产品需求档——2026-09-10 自旧设计档抽取）。根层裁定后该档 = **迁移期参照历史**（只读 · 不维护）。
> **并入** = 需求条目正文（一句话 / 行为 / 范围边界）——**编号与文本承旧档**；**本板新增需求 0**（纯回填）。
> **不并** = 「来源：…」注 · 状态行（见 §5）。

### 4.1 一句话（为什么）

可配置多模型并行会诊，主 agent 收到全量意见 digest 后自行判断与验证。

### 4.2 行为

遇到疑难杂症（反复失败、卡住、无头绪）时，让多个**不同模型**并行分析同一问题。工具只负责**编排与收集**，判定权完整归主 agent——它逐个读取先返回的回复，用已有的工具（bash / verify / read / 推理）自己判断、自己验证。

- **两个工具**：`consult_start`（非阻塞发起）→ `consult_stop`（取消仍在跑的会诊——不产生 digest）。`consult_check` 已退役（R17）——**digest 自动注入是唯一消费通道**。
- **会诊子 agent 只读**，`main_history` 按需拉取主会话失败轨迹。
- **生命周期跨 turn**：consultation sessions 是跨回合后台工作——回合尾不再清理——仅 Ctrl+C / 会话中止时 abort（与 async 子代理同规则）。
- **候选池**：`agent.consultModels`（`{ provider, model, effort? }`，≤5），缺省空 = 未启用。

### 4.3 范围边界（不做）

工具内置自动验证、模型间交叉通信、会诊子 agent 改文件、部分 settle 提前注入（**全 settle 才入 digest 流**）。

### 4.4 VSC 端条目（并入 · 2026-09-15 批 8 · 自 `thincoder-vscode/docs/requirements/CONSULTATION.md`）

语义同源——VSC 档 F-S1–F-S6 / N-S1–N-S4 与 §4.1 / §4.2 逐条同义（不重并）；**VSC 独有条目**：

- **F-S7 面板可见性**：每 consultant 一条活动块（`sub:consult` 事件）+ 回复预览（≤8KB）随 answered 事件带出；冻结入流同 subagent / escalate / advisor——呈现接线 = `docs/vsc/design/WEBVIEW.md` §14（设计侧并入 · 批 7 §6.5）。
- **N-S1 预算**：`consultTurns` 默认 40 + 墙钟看门狗 `consultTimeoutMs` 600000ms（10min）——坐标（实核）＝ `thincoder-vscode/src/config-io.mjs:321-322`；判定权仍归主 agent（会诊 = 建议非门禁）。

端差 = 呈现面（面板活动块 + 回复预览 vs TUI）+ 配置入口（Settings 面板 vs `/config`）。坐标（实核）＝ `thincoder-vscode/src/agent-tools/consult.mjs` · `config-consult.mjs`。
**测试缺口（发现即报）**：VSC `test/` 对 `_consultSessions` / `runConsultChild` 直引零命中——既有间接回归 = `test/config-softfail.test.mjs` · `activity-flow.test.mjs` · `agent-lifecycle-singleton.test.mjs`。

## 5. 不并项与历史沿革（B 轮 · 2026-09-14）

| 旧档节 | 内容 | 何故不并 |
|---|---|---|
| 「来源：2026-09-10 自 `../design/CONSULTATION.md` 抽取」注 | 拆分来源指针 | 时点材料——需求已归位到本档 |
| 「状态：已实现」行 | 状态标记 | 时点状态——归批次档 / 台账 |
| 「本档为需求权威；设计+测试见来源档」指句 | 指向旧设计档的关系注 | 设计面关系由本档首部互指行承载（`docs/core/design/CONSULTATION.md`） |
| VSC 仓档（`requirements/CONSULTATION.md`）的「变更记录」与对位档头 | 一次性材料 + 历史流水 | VSC 独有条目 / 端差面已并 §4.4（2026-09-15 批 8）；批次档承载 |

## 变更记录

- 2026-09-13：建档——自 `docs/core/requirements/CORE-UNIFICATION.md` 拆分（来源：§2 F11 / F6 / F12 回指）+ 设计档 `CONSULTATION.md`（§2.1–§2.4 · §3.1 A24 派生）；**无新增需求**。
- 2026-09-14（**B 轮并入 · 第 3 批**）：新增 §4 **需求条目**（一句话 / 行为 / 范围边界——自 `thincoder-cli/docs/requirements/CONSULTATION.md` 逐节比对后并入需求正文；**编号与文本承旧档**）+ §5 **不并项与历史沿革**；**本档新增需求 0**（纯回填）；首部加需求条目面指针一行。
- 2026-09-15（**B 式迁移轮 · VSC 第 8 批 · 并入 · eng-designer**）：新增 §4.4 **VSC 端条目**（F-S7 面板可见性 / N-S1 预算 + 端差登记——自 `thincoder-vscode/docs/requirements/CONSULTATION.md` 并入；语义同源不重并）；§5 登记 VSC 档批次材料；**本档新增需求 0**（纯回填）。
