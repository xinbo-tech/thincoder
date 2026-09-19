# 工程模式 v2 · 模块设计（M3 批次档六段）

> 模块划分权威源 = `docs/core/design/ENGINEERING-MODE-V2.md` §2.2（M3）
> 功能规格 = `docs/core/requirements/ENGINEERING-MODE-V2-SPEC-BATCH-SEGMENT.md`
> 写权 = eng-designer（设计档唯一作者）· 建档 2026-09-17（模块设计轮 · 门禁与流程族）
> 状态 = 设计就绪待评审（评审发起权在用户）

## 1. 需求层

### 1.1 总体需求（问题陈述）

批次档（md）是**流程账**——一批一份、六段一段一作者。v1 已用 `batch-segment.mjs` 承载段写入纪律（段白名单 + append-only + 凭证剥除 + 轮次盖戳），该机制经多批实证可靠。v2 继承骨架，但引入两个新约束：

- **状态行 ↔ `manifest.activeBatch` 咬合**（v1 无 manifest——状态行与状态账无机械咬合，只能靠自觉）。
- **已收口档回改拒**（批次档生命周期要求整档冻结，v1 无机械拦截，回改已收口档无兜底——机械拦截只覆盖 `batch_segment` 通道；主 agent 对 §1/§4/§6 的普通文档写不经本工具，兜底 = 写纪律 + M8 机检红，见 §2.5）。

本模块把这两条落成机械门禁：**越段拒（继承）+ 冻结档拒写（新增——`batch_segment` 通道）+ 状态行咬合检红（新增）**。

### 1.2 功能性需求（回指规格 ②功能点）

| # | 功能点 | 规格依据 |
|---|---|---|
| F1 | 六段骨架（继承 v1 §1.12，段名按 v2 §5.3 收正） | ②.1 |
| F2 | `batch_segment` 段白名单——调用者身份定段号（designer→§2 · 评审→§3 · coder→§5），越段即拒 | ②.2 |
| F3 | append-only——段不重叠、不回改，既有字节不变 | ②.3 |
| F4 | 状态行 ↔ `manifest.activeBatch` 咬合 | ②.4 |
| F5 | 前情指针形态 `前情 = docs/batches/<旧档> §N（已收口 <日期>）` | ②.5 |

### 1.3 非功能需求

| # | 维度 | 标准 |
|---|---|---|
| N1 | fail-closed | 越段 / 冻结档回改 → 机械拒，无静默放行 |
| N2 | 可机判 | 状态行咬合判据句机检，禁散文判据 |
| N3 | 可迁移 | 批次档落点读 manifest `docRoot.batches`（去硬编码路径） |

### 1.4 范围边界（本模块不做）

- 不做评审本身（M6）；不做台账（M2）。
- 不做批次档模板定义（模板住需求档——单一权威源，本模块只做写入纪律）。
- 不做批边界判定（判定权归主 agent）。
- 不做前情指针形态拦截（F5 判据归属 = 主 agent §1 写纪律 + M8 锚检查——本模块段白名单不审段内容，见 §2.5）。

## 2. 设计层

### 2.1 方案与理由

继承 v1 `batch-segment` 工具本体（段白名单 `SEGMENT_BY_ROLE` + append-only `insertIntoSection` + 凭证剥除 `sanitizeText` 均已实证），只做**增量**——新增「状态行解析 + 咬合 + 冻结拒写」。v1 工具是唯一可继承的现状，另起炉灶（新写一套段写入工具）与「继承 v1 只微调」的架构裁定（§2.6 KD6 同源精神）冲突。

**增量四点**：

1. **状态行解析**（语法已定，fail-closed）：解析对象 = §1 段内 `**状态行**：` 前缀行（§1 边界 = 该行到下一 `## §` 标题；其他段内「状态行」字样不参与判定——T9）；关键字判定：含 `已收口` → 冻结、含 `进行中` → 放行（emoji / 括号装饰 / 日期后缀容忍——关键字命中即判，不要求整行形态）；缺失 / 两关键字皆不命中 → 拒（fail-closed：不可解析视为冻结——宁可误拒进行中档，不得放行回改已收口档）。
2. **冻结拒写**：`batchSegmentTool.execute` 写入前解析状态行，若 `已收口` / 不可解析 → throw（拒写；错误消息区分「已收口档不回改」/「状态行不可解析或缺失」）。
3. **咬合 helper**：导出 `batchStatusMatchesActiveBatch(agent, batchDoc)`——读 manifest `activeBatch` + 状态行，返回 `{ ok, reason }`；供 M8 机检引擎调用（「改其一 → 期望咬合检红」）。
4. **落点接线（N3）**：`resolveBatchDocPath(cwd, given)`（`batch-segment.mjs:58`）加双基底——先按 cwd 解析（v1 语义，既有调用形态零变），不可读时按 manifest `docRoot.batches` 复判（M1 缺键 → M1 默认值 fallback；注入缝 = `configureBatchSegment`，既有先例 `batch-segment.mjs:43`，缺省 no-op 保 v1 语义）；仍不可读 → throw（fail-closed 不变）。
   `batchSegmentTool.execute` 行内解析改复用 `resolveBatchDocPath`（门禁单源——AC-M3-1 拒面与落点接线同一函数）。

### 2.2 架构 / 接口 / 数据流契约

```text
写入路径（继承 + 增量）：
  batch_segment(args) ─► allowedSegment(agent)   [段白名单，越段拒——F2]
                      ─► 状态行解析         [新增：已收口 / 不可解析 → 拒——AC-M3-4]
                      ─► sanitizeText(凭证剥除)   [继承]
                      ─► insertIntoSection        [append-only——F3]
                      ─► writeFileSync           [既有字节不变]
咬合路径（新增，只读，供 M8 调）：
  batchStatusMatchesActiveBatch(agent, batchDoc)
     = 解析状态行「进行中/已收口」 + 读 manifest.activeBatch
     ─► 一致 → { ok: true }；不一致 → { ok: false, reason }
```

**接口（导出面变化）**：

- 继承：`batchSegmentTool` · `batchDocForReview` · `configureBatchSegment` / `resetBatchSegment`（`batch-segment.mjs:43-47`）。修改：`resolveBatchDocPath`（`batch-segment.mjs:58`）——加 manifest `docRoot.batches` 双基底（§2.1#4）；新增 import 消费 `manifest.mjs`（M1 产物，零改）。
- 新增：`readBatchStatusLine(src)`（内部）+ `batchStatusMatchesActiveBatch(agent, batchDoc)`（导出，供 M8）。

### 2.3 受影响文件全清单（当前行数 + 预计增量）

| 文件 | 当前行数 | 变更类型 | 预计增量 | 编辑点（函数级） |
|---|---|---|---|---|
| `thincoder-core/agent-tools/batch-segment.mjs` | 220 | 修改 | +35 ~ +50 | `SEGMENT_BY_ROLE`（26 行，已含 designer/coder，无需改）· `resolveBatchDocPath`（58 行）加 `docRoot.batches` 双基底 · 新增 `readBatchStatusLine` + `batchStatusMatchesActiveBatch` · `batchSegmentTool.execute`（175 行）行内解析改复用 + 冻结拒写分支 |
| `thincoder-core/manifest.mjs` | 0（M1 新建） | **零改**（import 消费） | — | 无编辑点（M1 批产物） |
| `thincoder-cli/` | — | **零改** | — | 核内工具，端经 `@thincoder/core` import 装配，无端侧镜像 |
| `thincoder-vscode/` | — | **零改** | — | 同上 |

### 2.4 关键决策记录

| # | 决策 | 理由 |
|---|---|---|
| KD-M3-1 | 冻结拒写落 `batchSegmentTool.execute`（写入前解析状态行） | 单点拦截，sync/async 两条路径都经过 execute；不靠 M8 事后报红（事后报红已写入、不可逆） |
| KD-M3-2 | 咬合判定 = 只读 helper，供 M8 调用，不内嵌到写入路径 | 「改其一 → 期望咬合检红」是机检概念；把判定做成纯函数，M8 引擎复用，避免在写入工具里做读 manifest 的副作用 |
| KD-M3-3 | 状态行两态 = `进行中` / `已收口 <日期>`；判定只凭关键字（`已收口` / `进行中`），日期不参与判定 | 沿用批次档 §1 现状形态（`**状态行**：🔄 进行中（…）`），「已收口 <日期>」为收口动作（§6）落笔的收口态；解析语法见 §2.1#1——emoji / 括号 / 日期容忍，形态收口归 M8 侧 |

### 2.5 与既有纪律冲突核对

- **D5 冻结窗口（M4）与「已收口档回改拒」的关系**：D5 拦截「评审在途」窗口内的写入（M4 职责），本模块拦「已收口（冻结）后」的回改（M3 职责）——两者是**不同窗口**（在途 vs 已收口），不重叠、不互相替代。本档记录以消歧，不实现 D5。
- **状态行与 manifest 咬合**：manifest 属 M1 产物，本模块只读 `activeBatch`，不写 manifest——写权矩阵（D1）不变。
- **F5 前情指针形态的判据归属**：本模块不机械拦截指针形态（段白名单不审段内容）；判据归属 = 主 agent 写 §1 时的 D4 指针纪律（形态 `文档:节`）+ M8 锚检查（指针可解析）——零编辑点。
- **AC-M3-4「机检红」腿的落点**：✅ 已裁（主 agent 2026-09-17）——**spec 收窄**：M8 不扩「已收口档回改」检面（需快照/哈希历史，过度工程）。AC-M3-4 的「机检红」腿指 D5「评审在途」窗口机检（M8 AC-7 已覆盖）；已收口档回改由写纪律 + 冻结语义兑底（拒腿 = 本模块 `batch_segment` 通道）。

## 3. 测试层

### 3.1 验收标准（逐条回指规格 AC）

| # | 验收标准 | 回指规格 | 可机判 |
|---|---|---|---|
| AC-1 | `batch_segment` 越段 → 拒（角色段白名单） | AC-M3-1 | ✅ 以 designer 写 §5 → 期望 throw |
| AC-2 | 六段齐 + 状态行存在 | AC-M3-2 | ✅ 读档结构断言六段标题 + 状态行 |
| AC-3 | 状态行 ↔ `manifest.activeBatch` 一致（改其一 → 咬合检红） | AC-M3-3 | ✅ 调用 `batchStatusMatchesActiveBatch` → `ok:false` |
| AC-4 | 已收口档被回改 → 拒（`batch_segment` 通道） | AC-M3-4 | ✅ 状态行置「已收口」后写 → 期望 throw（「机检红」腿 = D5 评审在途窗口，M8 AC-7；已收口回改由写纪律兑底——已裁 2026-09-17） |

### 3.2 用例表（正常 / 边界 / 错误）

| # | 场景 | 输入 | 预期输出 |
|---|---|---|---|
| T1 | 正常：designer 写 §2 | `segment:"§2"` + 文本 | 追加成功，既有字节不变 |
| T2 | 正常：评审写 §3 | `segment:"§3"` + 发现表 | 追加成功 + 工具盖 `### 轮次 N（评审子代理）` |
| T3 | 正常：coder 写 §5 | `segment:"§5"` | 追加成功 |
| T4 | 边界：凭证行剥除 | 文本含 `designId: …` | 该子串剥除，剥空整行丢弃 |
| T5 | 边界：超 20000 字符 | `text.length > 20000` | throw（引导分段） |
| T6 | 错误：越段 | designer 写 `segment:"§5"` | throw「§5 不是你可写的段」 |
| T7 | 错误：冻结档回改 | 状态行 =「已收口 …」后写 | throw「已收口档不回改」 |
| T8 | 错误：咬合不一致 | `activeBatch` 指向 A，A 状态行 =「已收口」 | `batchStatusMatchesActiveBatch` → `{ ok:false }` |
| T9 | 边界：§2 内容含「状态行」字样 | 写入文本含「状态行」字面，§1 状态行 =「进行中」 | 冻结判定只读 §1 的 `**状态行**：` 行——§2 字样不影响判定（放行，不误拒） |
| T10 | 错误：状态行缺失 / 不可解析 | 档无 `**状态行**：` 行，或两关键字皆不命中 | throw「状态行不可解析或缺失」（fail-closed——视为冻结） |

## 4. 变更记录

- 2026-09-17（模块设计轮 · 门禁与流程族 · eng-designer）：建档——M3 批次档六段模块设计；继承 v1 段白名单 + append-only，新增状态行↔activeBatch 咬合 + 冻结档拒写；验收逐条回指 AC-M3-1..4。
- 2026-09-17（修正轮 · 清理与机检族 · eng-designer）：§2.1 去「方案选型对比」纪律残留——豁免声明改为直接陈述方案与理由（纪律已废：需求档 §6.2「不强制列候选对比」）；方案内容不变。
- 2026-09-17（修正轮 · 门禁与流程族评审修正 · eng-designer）：设计评审修正轮——#1 F5 判据归属登记（§1.4/§2.5）· #2 N3 接线（`resolveBatchDocPath` 双基底 + 文件表）· #3 状态行解析语法（关键字判定 + fail-closed + T10）· #4 冻结拒写收窄为 `batch_segment` 通道（M8 机检红腿缺口上报）· #17 T9 补测；三方条目不变。
