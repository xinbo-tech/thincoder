# DESIGN-TOKEN-SETTLEMENT — 需求

> 板块：设计评审凭证结算（settle 当场落盘 / 门禁读权威 / 废旧镜像）。需求层文档（docs/requirements/）。
> 状态：已实现。
> 来源：2026-09-10 自 `../design/DESIGN-TOKEN-SETTLEMENT.md` 抽取（需求层拆分批）——本档为需求权威；设计+测试见来源档。

## 2. 需求（用户裁定 2026-09-08）

- **R1**：async 设计评审 settle 的 token/designId 可靠结算——消除重启序列化窗口，进程重启 resume 后 spawn eng-coder 不再丢。
- **R2**：**废旧单值镜像** `_engDesignToken`（用户选 B）——dispatch 写门判断资格改问权威槽"任一活槽存在"。
- **R3**：**双端一起做**——与 VSC 同机制语义高度一致（settle 即落盘权威台账）。
- **R4**：**不落文档约束保持**——token/designId VALUES 只进槽文件。
