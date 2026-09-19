# Function Spec · M6 评审凭证

> 模块划分权威源 = `docs/core/design/ENGINEERING-MODE-V2.md` §2.2（M6）

## ① 模块目标

**继承 v1 的评审与凭证机制**（已验证可靠，v2 不取消、不重写），唯一微调 = 评审对象清单来源改读 manifest `docRoot`——与「可迁移」对齐。

## ② 功能点

1. **（继承）设计评审签发凭证**：advisor 设计评审通过 → 签发 `designId:token`（`uuid:expiresAt`，TTL 7 天可配）→ 入槽文件（会话态）。
2. **（继承）链终消费**：交付核验 + 链收口后 `consume-design` 清槽——同 id 再 spawn 机械拒。
3. **（继承）轮次衰减 / 机械 cap / 会话隔离 / 失败护栏**（六 kind 不签发）。
4. **（微调，本模块唯一差异）评审对象来源 = manifest `docRoot`（声明面）**——不再硬编码本仓 `docs/` 路径。
5. **凭证不落文档**：token / designId 的**值**不写进设计档 / 变更记录 / 状态行；评审通过只记「review passed」。

## ③ 边界（不做什么）

- 不做写门（M4 读本模块槽）；不重写凭证机制本体；不做评审语义判据（advisor 职责）。
- 凭证是**运行时状态**，不是文档内容——不入档、不入 git。

## ④ 验收（逐条可机判）

| # | 判据 | 方式 |
|---|---|---|
| AC-M6-1 | 设计评审通过 → 签发 `designId:token`（TTL 可配） | 跑评审 → 查槽 |
| AC-M6-2 | 链终消费后同 id spawn → 机械拒 | consume 后再 spawn → 期望拒 |
| AC-M6-3 | 评审对象清单来源读 `docRoot`（非硬编码 `docs/`） | grep 硬编码 |
| AC-M6-4 | 凭证值不出现在任何文档 | grep token/designId 值 |
| AC-M6-5 | 六 kind 失败 → 不签发（护栏） | 构造失败结算 → 期望无 token |

## ⑤ 依赖

- **上游**：M1（`docRoot`）。
- **下游**：M4（token 门读活槽）。

## 需求依据

v2 §8.5（评审与凭证——继承 v1）· 架构设计 §2.3 E6 · KD5。
