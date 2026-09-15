# insert_after 工具权威语义（INSERT-AFTER）· 编辑工具板块

> 板块 = **编辑工具**；本档 = **insert_after 语义的权威源**（逐工具权威档之一）。
> 地图与契约要点 = `docs/core/design/TOOLS.md` §6.6 · §8.2——本档不复制其内容（D2）。
> 共享底层 = `docs/core/design/EDIT-HELPERS.md`（EOL 与候选 helper——本档只指不述）。
> 双端：CLI `thincoder-core/tools/file.mjs`（`insertAfterTool` + read-before-insert 护栏）· VSC `thincoder-vscode/src/tools/more-file.mjs`（同机制，各自实现；**无 dirty 机制**——见 §4 差异）（W14 已迁核——自持镜像已删，现体同指核 `thincoder-core/tools/file.mjs`；dirty 护栏随核单源生效）。
> 模型可见描述 = `thincoder-core/tool-docs/insert_after.md`（提示词面 / 产品代码）。
> 需求侧 = `docs/core/requirements/TOOLS.md`（工具系统板块；CLI 树无逐工具需求档）。
> 建档：2026-09-15（**B 式迁移轮 · 第 1 批**——`thincoder-cli/docs/design/INSERT-AFTER.md` 内容重建入基准层；旧档原地一字不改、留作参照历史）。

## 1. 定位

insert_after = **在已知行后插入新行**——纯插入（不改 / 不删现有内容）。比 edit 加新内容更安全：**不必编造上下文做精确匹配**（edit 加行要 `old_string` 含周围行；insert_after 只要行号 / 正则）。

**适用**：加新行——checklist 条目 / 文档行 / 标题 / 散文行 / 函数 / import / block。
**不是**：改 / 删现有内容（→ edit / hashline_edit）、整文件重写（→ write）。

## 2. 参数与 schema

- `path`（必须）——目标文件。
- `content`（必须）——要插入的文本（成为目标行后的新行）。
- 定位（二选一，都无则错）：
  - `after_line`（1-based 行号）——知道确切行号时首选（来自 `read`）；
  - `after_regex`——JS 正则找行；**必须恰匹配一行**（多匹配报错并列出匹配行号）。

**互斥 / 优先级**：`after_line` 与 `after_regex` 都给 → **`after_line` 赢**。语义等价 `lines.splice(targetLine, 0, content)`。

## 3. 精确判定（dirty 护栏——CLI）

insert_after 定位基于行号 / 正则；文件若在 `read` 之后被别的写工具改过，行号会漂移 → **静默错位**。护栏（CLI）：

- 写工具记账受影响区（`lastWrite = { type, startLine, shift }`）。
- `after_line` 在**未受影响区**（`<= startLine`）→ 允许；**受影响区内** → 拒绝（错误含 was modified since your last read）。
- `write` 全文重写 → 任何 `after_line` 拒绝。
- `read` 清 dirty + 更新快照。

## 4. EOL 与端差

- EOL：写回按原行尾（`docs/core/design/EDIT-HELPERS.md` §4 F1）；**新建路径不适用**（insert_after 不建文件）。
- VSC 端 `insert_after`：normalizeEOL + 编辑器分支换行符按 fileEol（消除 `$` 锚失配与混合 EOL 注入）——另见 VSC 侧档。
- **端差（结构性）**：VSC 端**无 dirty 机制**（read-before-insert 护栏不适用——行号漂移靠模型自觉 re-read）。

## 5. 何时用（模型路由）

加新行（checklist / 文档行 / 函数 / import）→ insert_after（首选——不必编造上下文）；改 / 删 → edit / hashline_edit；整文件 → write。

## 6. 机制面（B 式迁移并入——现状路径）

### 6.1 实现坐标（as-of 2026-09-15 实核）

| 面 | 落点 | 实核 |
|---|---|---|
| 工具对象 / 执行 | `thincoder-core/tools/file.mjs:280`（`insertAfterTool`） | 导出在位 |
| dirty 护栏判定 | `thincoder-core/tools/file.mjs:305`（`lastWriteOf(abs)`） | 调用点在受影响区判定内 |
| 记账面（dirty / lastWrite 容器） | `thincoder-core/tools/write-path.mjs:33`（`markDirty`）· `:35`（`isDirty`）· `:41`（`recordWrite`） | 由 `file.mjs:43` re-export |
| 拒绝文案 | `thincoder-core/tools/write-path.mjs:74`（`dirtyRefusalMessage`） | 导出在位 |
| 描述面（模型可见） | `thincoder-core/tool-docs/insert_after.md` | 在位（`DESC()` 加载） |
| VSC 对位实现 | `thincoder-vscode/src/tools/more-file.mjs:12`（`insert_after`）（W14 已迁核——自持镜像已删，现体 = 核 `thincoder-core/tools/file.mjs`） | 同名机制 · 独立实现 · 无 dirty 面（W14 后随核护栏） |

### 6.2 记账面归位（迁入后收正）

旧档把 dirty 容器记在工具档本体坐标上；现状 = 记账面独立成档（`thincoder-core/tools/write-path.mjs`，`file.mjs:43` re-export）——跨工具（write / insert_after / 编辑族）共用。

### 6.3 VSC 端差异（并入 · 批 8）

VSC 端 `thincoder-vscode/src/tools/more-file.mjs:12`（`insert_after`；W14 已迁核——自持镜像已删，现体 = 核 `thincoder-core/tools/file.mjs`）——① **无 dirty 护栏**（结构性端差——行号漂移靠模型自觉 re-read，见 §4）；② **编辑器分支**：doc 已打开 → 换行符按 fileEol
（normalizeEOL + 消除 `$` 锚失配与混合 EOL 注入——`docs/core/design/EDIT-HELPERS.md` §6）；③ 无 `DESC()` md 描述（内嵌）；行尾写回与 CLI 同（F1——`EDIT-HELPERS.md` §4）。
（W14 已迁核——自持镜像已删，现体 = 核 `thincoder-core/tools/file.mjs`；上述①③端差随迁核退场，②经写路径缝承接）

## 7. 并入的关键决策记录（含否决备选）

| # | 决策 | 理由 / 否决备选 |
|---|---|---|
| D-I1 | read-before-insert **dirty 护栏**（受影响区拒绝） | 行号漂移的静默错位比报错昂贵得多；否决「靠模型自觉 re-read」（无强制面） |
| D-I2 | `after_line` 与 `after_regex` **互斥且 line 优先** | 两者皆给时以更精确者（行号）为准；否决「报错要求二选一」（同一意图不该被判错） |
| D-I3 | `after_regex` **必须恰匹配一行** | 多匹配即定位不唯一——报错并列出候选优于任选其一 |

## 8. 不并项与历史沿革

### 8.1 历史沿革（(d) 类——**不并**）

> 来源档 `thincoder-cli/docs/design/INSERT-AFTER.md`（CLI 产品档）——**原地保留作参照历史**（保留 ≠ 维护）。下列内容不并入本档：

| 旧档位置 | 内容 | 何故不并 |
|---|---|---|
| 旧档状态行 | 时点状态行 | 批次语境——现行态已入 §1–§5 |
| 旧档「变更记录」节（2026-09-08 文档重组） | 文档重组流水 | 历史叙述——本档自有变更记录 |
| 旧档括注的 `TOOLS.md` §6.2 节号 · `file.mjs` 旧行号区间 | 旧节号 / 迁移前坐标（CLI `src/tools/**` 时代） | 现行地图节号 = `TOOLS.md` §6.6；现状坐标见 §6.1 |

### 8.2 不并项登记（跨板块 / 一次性材料——**不并**，逐项登记）

| 旧档面 | 内容 | 何故不并（去向 / 触发） |
|---|---|---|
| 描述面正文 | 模型可见文本 | **提示词面 = 产品代码**——落点 `thincoder-core/tool-docs/insert_after.md` |
| VSC 侧 dirty 相关叙述 | 端差细节 | **已并入（2026-09-15 批 8）**——§6.3 + §4（结构性端差登记）；VSC 源档留参照历史 |

## 9. 体量与拆分规划（R24a）

**实测行数**：本档 **103 行**（根层 · as-of 2026-09-15 批 8 实测）——**低于 300 行软线，无需拆分规划**。

## 变更记录

- 2026-09-15（**B 式迁移轮 · 第 1 批**）：建档——`thincoder-cli/docs/design/INSERT-AFTER.md` 内容重建入基准层（旧档一字未改、原地作参照历史）；dirty 记账面坐标按现状收正（`write-path.mjs`）；批次材料 / 状态行 / 变更流水不并（§8）。
- 2026-09-15（**B 式迁移轮 · VSC 第 8 批 · 并入 · eng-designer**）：§6 增 **6.3 VSC 端差异**（无 dirty 护栏 / 编辑器分支 / 内嵌描述）；§8.2「触发 = VSC 轮」行销项。
- 2026-09-15（**S2 W14 落地 · eng-coder**——承 `docs/batches/2026-09-15-vsc-core-wiring.md` §2 W14）：双端行 + §6.1「VSC 对位实现」行 + §6.3 补迁核注（VSC 自持档已删——现体 = 核 `thincoder-core/tools/file.mjs`；dirty 护栏随核单源生效）；机制条文零改。
