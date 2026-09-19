# 工程模式 v2 · 模块设计（M7 checklist 废除）

> 模块划分权威源 = `docs/core/design/ENGINEERING-MODE-V2.md` §2.2（M7）
> 功能规格 = `docs/core/requirements/ENGINEERING-MODE-V2-SPEC-CHECKLIST-REMOVAL.md`
> 写权 = eng-designer（设计档唯一作者）· 建档 2026-09-17（模块设计轮 · 基础族）
> 状态 = 设计就绪待评审（评审发起权在用户）

## 1. 需求层

### 1.1 总体需求（问题陈述）

v1 同时存在**两套待办跟踪**——`.thincoder/checklist.md` 的 checklist 三态（pending / in_progress / done）与台账六态。两套并立是 v1 的重复：checklist 在核侧工具表挂载、在启动时被动注入上下文提醒、还带一套同步脚本与门禁族；台账才是 v2 的唯一待办权威源。本模块**废除 checklist**（工具 + 文件 + 同步脚本 + 上下文注入 + 门禁族），待办跟踪统一到台账六态——删一留一。

### 1.2 功能性需求（回指规格 ②功能点）

| # | 功能点 | 规格依据 |
|---|---|---|
| F1 | 删代码：`thincoder-core/tools/checklist.mjs`（300 行）+ `checklist-sync.mjs`（182 行） | ②.1 |
| F2 | 卸挂载（核 + VSC 两处工具表） | ②.2 |
| F3 | 移除上下文注入（核 `agent/setup.mjs:128-139` + VSC `context-injections.mjs`） | ②.3 |
| F4 | 删约定：`.thincoder/checklist.md` 约定废除 | ②.4 |
| F5 | 删门禁：`subagent-scheduler.mjs:38,56` 的 `checklist*` 前缀禁用族 | ②.5 |
| F6 | 死指针改指台账：`task.mjs:36` + `memory-tool.mjs:37`「use checklist」→ `/ledger` | ②.6 |
| F7 | 语义承接：checklist 三态由台账六态承接 | ②.7 |

### 1.3 非功能需求

| # | 维度 | 标准 |
|---|---|---|
| N1 | 零残留 | 全仓无对 checklist 的 import / 引用残留（`checklistTool` / `pendingItems` / `pushChecklist`）——grep 无匹配（AC-M7-2） |
| N2 | 零假阳 | 不触碰无关英文用词「checklist」（`verify.mjs` self-review checklist · `helpers.mjs` prose · `index-discover.mjs` 注释）——这些不是 checklist 工具族 |
| N3 | 可机判 | 验收 = 文件不存在 + grep 无匹配 + 映射表可查，无散文判据 |

### 1.4 范围边界（本模块不做）

- 不做台账（M2 承接）；不做历史 checklist 数据迁移（存量归项目归档）。
- **注入面纯移除，不承接**（D2 裁定 2026-09-17）：checklist 的「启动时注入待办提醒」是 v1 专属配套，v2 台账可见面 = 查询命令（`/ledger`）——agent 待办可见性改由**主动查台账**，不靠启动被动注入。
- 不删 `.thincoder/` 下其他文件（只管 checklist 一族）。

## 2. 设计层

### 2.1 方案与理由

需求已确认「删一留一」（台账留，checklist 删）——架构 §2.2 M7 + 规格 ① 已裁定方向，本模块只做删除接线的精确落点。

**核心方案（就机制本身说清为什么）**：

1. **工具与描述档成对删**：`checklist.mjs`（工具本体，含 `DESC("checklist")`）+ `tool-docs/checklist.md`（描述档）同删——描述档是工具的对外契约（`prompt-files.test.mjs:74` 断言 tool-docs 集合 == 全量工具描述集 25），只删工具留描述档 = 死描述档 + 计数断言漂移（D3 计数纪律）。故 `prompt-files.test.mjs` 的 `TOOL_DOCS` 枚举去「checklist」、计数 25→24。
2. **挂载 / 注入 / 门禁 / 死指针四类接线一并摘**：checklist 不是「死文件」（架构 :78 旧断已收正）——它在核/VSC 两处工具表挂载（`tools/index.mjs`）、核/VSC 两处上下文注入（`setup.mjs` / `context-injections.mjs`）、`subagent-scheduler.mjs` 的 `checklist*` 前缀禁用族、`task.mjs`/`memory-tool.mjs` 的「use checklist」提示词死指针。删除本体而留接线 = 悬空 import / 悬空提示词 = 违 N1。
3. **注入面纯移除（不承接）**：checklist 三态信息由台账六态承接，但「待办可见性」的机制**不承接**——v2 agent 待办 = 主动 `/ledger` 查询（M2 承接），不是启动被动注入。删注入块即删功能，不补等价物。
4. **死指针改指台账**：`task.mjs` / `memory-tool.mjs` 提示词里「use checklist」→「use `/ledger`」——这是提示词内容面（产品文本），但本模块只**记录改法**，落笔归 eng-coder（M7 实现轮）。

### 2.2 架构 / 接口 / 数据流契约

```text
废除前：启动 ─► 核 setup.mjs 注入 checklist 提醒 ─► agent.history（transient）
         └─ checklist.mjs 挂载核工具表 + VSC 工具表
         └─ checklist-sync.mjs 同步 .thincoder/checklist.md
废除后：启动 ─► 无 checklist 注入；agent 待办可见性 = 主动 /ledger 查询（M2）
         └─ 工具表无 checklistTool；.thincoder/checklist.md 约定废弃
```

**无新增接口**——本模块是纯删除 + 指针改指，不新增模块、不新增导出。

### 2.3 受影响文件全清单（当前行数 + 预计增量）

| 文件 | 当前行数 | 变更类型 | 预计增量 | 编辑点（函数级） |
|---|---|---|---|---|
| `thincoder-core/tools/checklist.mjs` | 300 | 删除 | −300 | 整档（`checklistTool` + `DESC("checklist")` + `pendingItems`） |
| `thincoder-core/tools/checklist-sync.mjs` | 182 | 删除 | −182 | 整档（同步写机） |
| `thincoder-core/tool-docs/checklist.md` | 14 | 删除 | −14 | 整档（checklist 工具描述） |
| `thincoder-core/tools/index.mjs` | 74 | 修改 | −3 | import `checklistTool`（:11）· `builtinTools` 条目（:25）· re-export（:35） |
| `thincoder-core/agent/setup.mjs` | 247 | 修改 | −13 | 注入块（:126-139：动态 import `pendingItems` :130 · reminder :135 · suppress catch :139） |
| `thincoder-core/agent-tools/task.mjs` | 88 | 修改 | ±0 | 提示词死指针「use checklist」（:36）→「use `/ledger`」 |
| `thincoder-core/agent-tools/subagent-scheduler.mjs` | 430 | 修改 | −2 | 注释（:38，去「checklist.md 精确 + checklist* 前缀家族」）+ 代码（:56，去 `base.startsWith("checklist")`） |
| `thincoder-core/tools/write-path.mjs` | 192 | 修改 | −1 | 头注（:9-10，去「`tools/checklist-sync.mjs` = 已登记豁免」） |
| `thincoder-vscode/src/tools/index.mjs` | 188 | 修改 | −3 | import（:20）· re-export（:165）· `builtinTools`（:175） |
| `thincoder-vscode/src/agent/context-injections.mjs` | 231 | 修改 | −14 | 头注序列（:7，去「#7 checklist」）· import（:21）· `pushChecklist`（:177-187）· 调用（:205）· `_deps.pendingItems`（:217） |
| `thincoder-vscode/src/memory-tool.mjs` | 94 | 修改 | ±0 | 提示词死指针「use checklist」（:37）→「use `/ledger`」 |
| `thincoder-vscode/src/agent/setup.mjs` | 449 | 修改 | ±0 | 编排注记（:399，「记忆召回 → checklist」序列去 checklist） |
| `thincoder-core/test/prompt-files.test.mjs` | 188 | 修改 | ±0 | `TOOL_DOCS` 去「checklist」（:45）· 计数注记 25→24（:41）· 用例名 25→24（:74） |
| `thincoder-core/test/tool-registry.test.mjs` | 106 | 修改 | ±0 | `SHARED_FACE` 去「checklist」（:29） |
| `thincoder-core/test/write-path.test.mjs` | 301 | 修改 | −6 | 头注（:8-9）· 用例名（:263）· `EXEMPT` 去 checklist-sync 条目（:264-273） |
| `thincoder-vscode/test/context-parity.test.mjs` | 365 | 修改 | −12 | `pendingItems` 夹具（:84）· `iCheck` 断言（:104）· `seq` 去「checklist」（:108）· 内容断言（:123）· 其余块断言（:197）· 异常夹具（:354）· 抑制断言表（:358） |
| `thincoder-vscode/test/tool-descriptions.test.mjs` | 74 | 修改 | ±0 | `MIGRATED` 去「checklist」（:34）· `CORE_WIRING_FILES` 去「checklist.mjs」（:43） |

（`thincoder-cli` 经 `grep` 复核**零引用**——两端接线表「CLI 零改」成立，无端侧 checklist 装配面。）

### 2.4 关键决策记录

| # | 决策 | 理由 |
|---|---|---|
| KD-M7-1 | 描述档 `tool-docs/checklist.md` 随工具成对删 | 描述档是工具契约；留档删工具 = 死描述档 + `prompt-files.test.mjs` 计数漂移（D3） |
| KD-M7-2 | 注入面纯移除、不承接 | D2 裁定 2026-09-17：待办可见性由 `/ledger` 主动查询承接（M2），不靠启动被动注入 |
| KD-M7-3 | `checklist*` 前缀禁用族整体删（不保留 `todo.md`/`changelog.md` 精确匹配外） | 规格 ②.5：保护对象已废；`todo.md`/`changelog.md` 精确匹配仍有效（仍是产品进程档），只删 checklist 前缀分支 |
| KD-M7-4 | `write-path.mjs` 头注 + `write-path.test.mjs` 豁免条目随删 | `checklist-sync.mjs` 是「已登记豁免」的登记对象；删除后豁免条目悬空，`assert.deepEqual(hits, EXEMPT.keys())` 会红——必须同删 |

### 2.5 与既有纪律冲突核对

- **架构 :78/:93 旧断已收正（见批次档 §4）**：架构原断「checklist 已死文件 / VSC 零改」为错——本模块受影响文件清单以规格 ② 为准（核 5 + VSC 4 + 删除 3 + 测试 5 = 17 档）。
- **拆分审视注记（R24a 咨询级）**：触改的 >300 行档（`subagent-scheduler.mjs` 430 · VSC `setup.mjs` 449 · `context-parity.test.mjs` 365 · `write-path.test.mjs` 301）增量均 ≤0、无层界跨越——主动拆分审视结论：本轮不动。
- **提示词死指针改指 = 产品文本面**：`task.mjs:36` / `memory-tool.mjs:37` 的「use checklist」→「use `/ledger`」是产品提示词内容面——内容权归主 agent、落笔归 eng-coder（本模块只记录改法，不代笔）。
- **无关英文用词不触碰**（规格 ③）：`verify.mjs` self-review checklist · `helpers.mjs` prose · `index-discover.mjs` 注释——这些是普通英文词「checklist」，非 checklist 工具族，保留。

## 3. 测试层

### 3.1 验收标准（逐条回指规格 AC）

| # | 验收标准 | 回指规格 | 可机判 |
|---|---|---|---|
| AC-1 | `checklist.mjs` / `checklist-sync.mjs` 已删 | AC-M7-1 | ✅ 文件不存在 |
| AC-2 | 全仓无对 checklist 的 import / 引用残留（`checklistTool` / `pendingItems` / `pushChecklist`）——代码面，排除 docs/ 与批次档 | AC-M7-2 | ✅ grep 无匹配 |
| AC-3 | 核 + VSC 两处工具表均无 `checklistTool` | AC-M7-3 | ✅ 检查 `tools/index.mjs`（核 / VSC） |
| AC-4 | 上下文注入移除（核 `setup.mjs` + VSC `context-injections.mjs` 无 checklist 注入）——代码面 | AC-M7-4 | ✅ grep 无匹配 |
| AC-5 | `checklist*` 前缀禁用族已删 | AC-M7-5 | ✅ `subagent-scheduler.mjs` 无 `checklist` 前缀判断 |
| AC-6 | 死指针改指台账（`task.mjs` / `memory-tool.mjs` 无「use checklist」）——代码面 | AC-M7-6 | ✅ grep 无匹配 |
| AC-7 | 待办三态可由台账六态表达：pending → 待讨论/待设计 · in_progress → 在途 · done → 已核销（**验证随 M2 落地**） | AC-M7-7 | ✅ 映射表可查 |

### 3.2 用例表（正常 / 边界 / 错误）

| # | 场景 | 输入 | 预期输出 |
|---|---|---|---|
| T1 | 正常：删本体 | 删 `checklist.mjs` + `checklist-sync.mjs` + `tool-docs/checklist.md` | 文件不存在（AC-1） |
| T2 | 正常：卸挂载 | 读核/VSC `tools/index.mjs` | `checklistTool` 无 import / 无 builtinTools 条目 / 无 re-export（AC-3） |
| T3 | 正常：移除注入 | 读核 `setup.mjs` + VSC `context-injections.mjs` | 无 `pendingItems` / `pushChecklist` / checklist 提醒（AC-4） |
| T4 | 正常：死指针改指 | 读 `task.mjs` + `memory-tool.mjs` | 无「use checklist」，有「use `/ledger`」（AC-6） |
| T5 | 边界：门禁只删 checklist 分支 | 读 `subagent-scheduler.mjs` | `todo.md`/`changelog.md` 精确匹配保留，`checklist` 前缀判断删除（AC-5） |
| T6 | 边界：描述档计数 | `prompt-files.test.mjs` 断言 tool-docs 集合 | 集合 == 24 档（去 checklist），计数注记与用例名同步 24 |
| T7 | 错误：残留检测 | `grep -rn checklist` 全仓 | 只命中无关英文用词（verify.mjs / helpers.mjs / index-discover.mjs），无工具族残留（AC-2） |

## 4. 变更记录

- 2026-09-17（模块设计轮 · 基础族 · eng-designer）：建档——M7 checklist 废除模块设计；工具 + 描述档 + 同步脚本 + 挂载（核/VSC）+ 注入（核/VSC）+ 门禁族 + 死指针四类接线完整受影响清单（核 5 + VSC 4 + 删除 3 + 测试 5 = 17 档 = 18 档）；注入面纯移除不承接；死指针改指 `/ledger`；验收逐条回指 AC-M7-1..7。
- 2026-09-17（修正轮 · 清理与机检族 · eng-designer）：§2.1 去「方案选型对比」纪律残留——豁免声明改为直接陈述方案与理由（纪律已废：需求档 §6.2「不强制列候选对比」）；方案内容不变。
