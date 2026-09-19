# 工程模式 v2 · 模块设计（M6 评审凭证）

> 模块划分权威源 = `docs/core/design/ENGINEERING-MODE-V2.md` §2.2（M6）
> 功能规格 = `docs/core/requirements/ENGINEERING-MODE-V2-SPEC-REVIEW-CREDENTIAL.md`
> 写权 = eng-designer（设计档唯一作者）· 建档 2026-09-17（模块设计轮 · 门禁与流程族）
> 状态 = 设计就绪待评审（评审发起权在用户）

## 1. 需求层

### 1.1 总体需求（问题陈述）

评审通过 ≠ 授权落地——通过只发「凭证」（designId + token），实现方拿凭证解锁写码；链收口后**同 designId 再 spawn = 机械拒**（链终消费）。v1 已完整实现这套凭证生命周期（签发 → TTL → 消费 → 移除），v2 **继承 v1 零改**，唯一变更 = **评审对象来源改读 manifest `docRoot`**（去硬编码 `docs/`）。

### 1.2 功能性需求（回指规格 ②功能点）

| # | 功能点 | 规格依据 |
|---|---|---|
| F1 | 评审通过 → 签发 designToken（继承 v1） | ②.1 |
| F2 | 链终消费制：`consume-design` 消费后，同 designId 再 spawn → 机械拒 | ②.2 |
| F3 | 评审对象来源读 manifest `docRoot`（去硬编码） | ②.3 |
| F4 | 凭证值不落文档：token / designId **值**永不落档（只记 `review passed`） | ②.4 |
| F5 | 六 kind 不签发：非全绿（含 🔴）→ 不签发 token | ②.5 |

### 1.3 非功能需求

| # | 维度 | 标准 |
|---|---|---|
| N1 | fail-closed | 非全绿 / 链终消费后 → 机械拒签发 / 拒 spawn |
| N2 | 可迁移 | 评审对象读 `docRoot`，不硬编码本仓 `docs/` |
| N3 | 凭证即运行时状态 | token / designId 值只存槽（slot），不进文档、变更记录、状态行（架构 §2.6 KD5 / 铁律 #6） |

### 1.4 范围边界（本模块不做）

- 不做评审判据本身（advisor 内部——继承）。
- 不做凭证格式改造（`uuid:expiresAt` 继承 v1，不重设 HMAC/签名层——已随 2026-09-06 裁定退役）。

## 2. 设计层

### 2.1 方案与理由

继承 v1 评审凭证生命周期零改（架构 §2.6 KD6），唯一微调 = **评审对象来源读 `docRoot`**。不重写签发 / TTL / 消费 / 移除任一环节。

**唯一增量（F3）**：`advisorTool.execute` 的 design-review 分支（`advisor.mjs:117-124`）当前用 `loadConventions(agent.cwd)` + `isDocPath(doc, conv)` 判定评审文档。改为读 manifest `docRoot` 产出的「文档根集合」，评审对象 / 被审文档路径从声明面解析——
   与 M4 的 `resolveReviewTargetPaths` **同源（单一权威源，不重复实现）**，该导出落点 = `thincoder-core/agent/write-gate.mjs`（M4 修正轮拆出新档，见 M4 §2.1#1）。
   M6 import 该新档，**不 import `dispatch.mjs`**（簇间回边，环风险）。

### 2.2 架构 / 接口 / 数据流契约

```text
advisor(type=design, documents=[...])
  ├─ 评审对象来源（F3，微调）：manifest.docRoot → 判定 documents 合法，替代 isDocPath 硬编码分类
  ├─ 评审执行（继承）：runAdvisorReview / launchAsyncAdvisor
  ├─ 全绿 → 签发（F1，继承）：generateDesignToken + settleDesignReview → designId+token
  ├─ 非全绿 → 不签发（F5，继承）：🔴 未收敛 → 无 token
  └─ 凭证剥除（F4，继承）：CRED_RE / sanitizeText —— token/designId 值永不落文档
consume-design(designId)（F2，继承）：resolveDesignSlot → removeDesignTokenSlot → 同 id 再 spawn = 机械拒
```

**接口（核心）**：

- 继承（不改签名）：`advisorTool`（`advisor.mjs:29`）· `validateDesignToken`（`design-token.mjs:53`，经 `advisor.mjs:27` re-export）· `generateDesignToken`（`design-token.mjs:44`）· `effectiveTokenTtlMs`（`design-token.mjs:37`，7 天 TTL）· `settleDesignReview`（`design-token.mjs:82`）。
- 继承（续）：`anyLiveDesignSlot`（`token-ttl.mjs:211`）· `removeDesignTokenSlot`（`token-ttl.mjs:65`）· `reconcileEngTokensFromSlot`（`token-ttl.mjs:187`）。
- 微调点：`advisor.mjs:117-124`（design-review 文档分类分支）改读 `docRoot`——import `resolveReviewTargetPaths`（`agent/write-gate.mjs`，M4 产物）替代 `loadConventions`/`isDocPath` 分类；新增 import 一行（`advisor.mjs:10-12` import 区）。

### 2.3 受影响文件全清单（当前行数 + 预计增量）

| 文件 | 当前行数 | 变更类型 | 预计增量 | 编辑点（函数级） |
|---|---|---|---|---|
| `thincoder-core/agent-tools/advisor.mjs` | 274 | 修改（微调） | +8 ~ +15 | `advisorTool.execute` design-review 分支（117-124 行）——评审对象来源改读 `docRoot`；import 区（10-12 行）增 `write-gate.mjs` 一行 |
| `thincoder-core/agent/write-gate.mjs` | 0（M4 新建） | **零改**（import 消费） | — | 无编辑点（M4 批产物） |
| `thincoder-core/token-ttl.mjs` | 286 | **零改**（继承） | — | 凭证生命周期 / TTL / 消费全继承，无编辑点 |
| `thincoder-core/agent-tools/design-token.mjs` | 118 | **零改**（继承） | — | 签发 / 校验 / TTL 全继承，无编辑点 |
| `thincoder-cli/` | — | **零改** | — | 端经核单源 import |
| `thincoder-vscode/` | — | **零改** | — | 同上 |

### 2.4 关键决策记录

| # | 决策 | 理由 |
|---|---|---|
| KD-M6-1 | 评审对象来源读 `docRoot`，复用 M4 的 `resolveReviewTargetPaths`（同源，不重复实现） | D2 单一权威源——「评审目标解析」只在一处详述（M4 的 `write-gate.mjs` 新档），M6 消费同源导出；落 `dispatch.mjs` 会引入 `advisor.mjs` → `dispatch.mjs` 簇间回边（`dispatch.mjs:19` 已入 advisor 簇）——新档无上游依赖，双向消费零回边 |
| KD-M6-2 | 凭证生命周期零改（签发/TTL/消费/移除全继承） | 架构 §2.6 KD6「继承 v1 零改，仅评审对象来源改读 docRoot」 |
| KD-M6-3 | 凭证值永不落文档（只记 `review passed`） | 架构 §2.6 KD5 + 铁律 #6；`sanitizeText`/`CRED_RE` 机械剥除已实证 |

### 2.5 与既有纪律冲突核对

- **`validateDesignToken` 双源（观察项，不修）**：`design-token.mjs:53` 有真实实现，`advisor.mjs:27` re-export 自 `advisor-async.mjs`，VSC `tool-gates.mjs` import 自 `design-token.mjs`。两处实现是否存在漂移未经核验——**M6 继承 v1 零改，不改此面**，作为观察项上报（见交付报告）。
- **架构行数 vs `wc` 实测**：✅ 已一致——架构 §2.2 已收正 `advisor.mjs` 274 行（父侧收正 2026-09-17），与本档实测一致，观察项作废。

## 3. 测试层

### 3.1 验收标准（逐条回指规格 AC）

| # | 验收标准 | 回指规格 | 可机判 |
|---|---|---|---|
| AC-1 | 评审通过 → 签发 token | AC-M6-1 | ✅ 全绿 → 签发 + 槽登记 |
| AC-2 | 链终消费后同 designId 再 spawn → 拒 | AC-M6-2 | ✅ consume 后 spawn → 期望拒 |
| AC-3 | 评审对象 / 被审文件路径读 `docRoot`（非硬编码 `docs/`） | AC-M6-3 | ✅ grep 硬编码路径 → 零命中 |
| AC-4 | token / designId 值不落文档（只记 `review passed`） | AC-M6-4 | ✅ 写档断言凭证值零命中 |
| AC-5 | 六 kind 非全绿（含 🔴）→ 不签发 token | AC-M6-5 | ✅ 构造非全绿 → 无 token |

### 3.2 用例表（正常 / 边界 / 错误）

| # | 场景 | 输入 | 预期输出 |
|---|---|---|---|
| T1 | 正常：全绿评审通过 | 六 kind 全绿 | 签发 token + 槽登记 |
| T2 | 正常：chain 收口消费 | consume-design(designId) | 槽移除，幂等（重复消费 no-op） |
| T3 | 边界：凭证值剥除 | 文本含 token 值 | token 值剥除，只记 `review passed` |
| T4 | 边界：TTL 7 天 | token 过期 | validateDesignToken → expired |
| T5 | 错误：链终消费后 spawn | consume 后同 designId spawn | 机械拒（designId not found） |
| T6 | 错误：非全绿（含 🔴） | 🔴 未收敛 | 不签发 token |
| T7 | 错误：评审文档非文档路径 | documents 含非 doc 路径 | 拒（文档分类按 docRoot 判） |

## 4. 变更记录

- 2026-09-17（模块设计轮 · 门禁与流程族 · eng-designer）：建档——M6 评审凭证模块设计；继承 v1 凭证生命周期零改，唯一微调 = 评审对象来源读 manifest `docRoot`（复用 M4 同源导出）；验收逐条回指 AC-M6-1..5。
- 2026-09-17（修正轮 · 清理与机检族 · eng-designer）：§2.1 去「方案选型对比」纪律残留——豁免声明改为直接陈述方案与理由（纪律已废：需求档 §6.2「不强制列候选对比」）；方案内容不变。
- 2026-09-17（修正轮 · 门禁与流程族评审修正 · eng-designer）：设计评审修正轮——#7 同步 M6 复用落点（`resolveReviewTargetPaths` 落 M4 新档 `write-gate.mjs`，M6 import 该新档、不 import `dispatch.mjs`）；三方条目不变。
