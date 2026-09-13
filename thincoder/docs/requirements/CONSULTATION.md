# CONSULTATION — 需求

> 板块：会诊（多模型并行分析同一问题）。需求层文档（docs/requirements/）。
> 状态：已实现。
> 来源：2026-09-10 自 `../design/CONSULTATION.md` 抽取（需求层拆分批）——本档为需求权威；设计+测试见来源档。

## 1. 需求

**一句话**：可配置多模型并行会诊，主 agent 收到全量意见 digest 后自行判断与验证。

### 行为

遇到疑难杂症（反复失败、卡住、无头绪）时，让多个**不同模型**并行分析同一问题。
工具只负责**编排与收集**，判定权完整归主 agent——它逐个读取先返回的回复，用已有的
工具（bash / verify / read / 推理）自己判断、自己验证。

- **两个工具**：`consult_start`（非阻塞发起）→ `consult_stop`（取消仍在跑的会诊——不产生 digest）。
  `consult_check` 已退役（R17）——**digest 自动注入是唯一消费通道**。
- **会诊子 agent 只读**，`main_history` 按需拉取主会话失败轨迹。
- **生命周期跨 turn**：consultation sessions 是跨回合后台工作——回合尾不再清理——
  仅 Ctrl+C / 会话中止时 abort（与 async 子代理同规则）。
- **候选池**：`agent.consultModels`（`{ provider, model, effort? }`，≤5），缺省空 = 未启用。

### 范围边界（不做）

工具内置自动验证、模型间交叉通信、会诊子 agent 改文件、部分 settle 提前注入
（**全 settle 才入 digest 流**）。
