# insert_after 工具权威语义（INSERT-AFTER）· 编辑工具板块

> 板块 = **编辑工具**；本档 = **insert_after 语义的权威源**（逐工具权威档之一）。
> 地图与契约要点 = `docs/core/design/TOOLS.md` §6.6 · §8.2——本档不复制其内容（D2）。
> 共享底层 = `docs/core/design/EDIT-HELPERS.md`（EOL 与候选 helper——本档只指不述）。
> 双端：CLI `thincoder-core/tools/file.mjs`（`insertAfterTool` + read-before-insert 护栏）· VSC `thincoder-vscode/src/tools/more-file.mjs`（同机制，各自实现；**无 dirty 机制**——见 §4 差异；现体同指核 `thincoder-core/tools/file.mjs`；dirty 护栏随核单源生效）。
> 模型可见描述 = `thincoder-core/tool-docs/insert_after.md`（提示词面 / 产品代码）。
> 需求侧 = `docs/core/requirements/TOOLS.md`（工具系统板块；CLI 树无逐工具需求档）。

## 1. 定位

insert_after = **在已知行后插入新行**——纯插入（不改 / 不删现有内容）。比 edit 加新内容更安全：**不必编造上下文做精确匹配**（edit 加行要 `old_string` 含周围行；insert_after 只要行号 / 正则）。

**适用**：加新行——清单条目 / 文档行 / 标题 / 散文行 / 函数 / import / block。
**不是**：改 / 删现有内容（→ edit / hashline_edit）、整文件重写（→ write）。

## 2. 参数与 schema

- `path`（必须）——目标文件。
- `content`（必须）——要插入的文本（成为目标行后的新行）。
- 定位（二选一，都无则错）：
  - `after_line`（1-based 行号）——知道确切行号时首选（来自 `read`）；
  - `after_regex`——JS 正则找行；**必须恰匹配一行**（多匹配报错并列出匹配行号）。

**互斥 / 优先级**：`after_line` 与 `after_regex` 都给 → **`after_line` 赢**。语义等价 `lines.splice(targetLine, 0, content)`。

## 3. 精确判定（行号锚护栏——CLI）

insert_after 定位基于行号 / 正则；文件若在 `read` 之后被别的写工具改过，行号会漂移 → **静默错位**，回执仍写成一次成功。

**判据单源**：这条护栏也是 `edit` 行号形的判据，权威 = `docs/core/design/EDIT-HELPERS.md` §7——判定表（六行，含 `isDirty` ∧ 陈旧快照）、拒文、批量帧均不在此重述（D2）。

- 写工具记账受影响区（`lastWrite = { type, startLine, shift }`）；`read` 清写入快照（`thincoder-core/tools/file.mjs` 的 `readTool.execute` 调 `clearLastWrite`）。
- 无行号目标（`after_regex` 形）只判第 1 / 2 / 6 行——第 3–5 行判的是模型给的行号，正则形没有（`docs/core/design/EDIT-HELPERS.md` §7.1）。
- 本工具的边界 = `after_line <= startLine`；`edit` 行号形严一格（`endLine < startLine`）——理由是插入不读写目标行，替换读写目标行。
- 拒文由 `thincoder-core/tools/write-path.mjs` 一处构造，与 `edit` 同句（英文，四要素含两条下一步：重 `read`，或改走位置无关寻址）。

## 4. EOL 与端差

- EOL：写回按原行尾（`docs/core/design/EDIT-HELPERS.md` §4 F1）；**新建路径不适用**（insert_after 不建文件）。
- VSC 端 `insert_after`：normalizeEOL + 编辑器分支换行符按 fileEol（消除 `$` 锚失配与混合 EOL 注入）——另见 VSC 侧档。
- **端差（结构性）**：VSC 端**无独立 dirty 机制**——其 `insert_after` 现体指核 `thincoder-core/tools/file.mjs`，行号锚护栏随核单源生效。

## 5. 何时用（模型路由）

加新行（清单条目 / 文档行 / 函数 / import）→ insert_after（首选——不必编造上下文）；改 / 删 → edit / hashline_edit；整文件 → write。

## 6. 机制面

### 6.1 实现坐标

| 面 | 落点 | 实核 |
|---|---|---|
| 工具对象 / 执行 | `thincoder-core/tools/file.mjs` 的 `insertAfterTool` | 导出在位 |
| 行号锚护栏判定 / 拒文 | `thincoder-core/tools/write-path.mjs` 的具名导出 `lineAnchorVerdict`（六行判据）· `lineAnchorRefusal`（四要素拒文）——判据与拒文单源 | `thincoder-core/tools/file.mjs` 的 `insertAfterTool.execute` 只调用，不各写 |
| 记账面（dirty / lastWrite 容器） | `thincoder-core/tools/write-path.mjs` 的 `lastWrites` / `dirtyPaths` 容器与 `markDirty` · `isDirty` · `recordWrite` | 由 `file.mjs` 的 re-export 面转出 |
| 拒文（dirty 面） | `thincoder-core/tools/write-path.mjs` 的 `dirtyRefusalMessage` | 导出在位 |
| 拒文（行号漂移面） | `thincoder-core/tools/write-path.mjs` 的 `lineAnchorRefusal`（与 `dirtyRefusalMessage` 同处） | edit / insert_after 同句 |
| 描述面（模型可见） | `thincoder-core/tool-docs/insert_after.md` | 在位（`DESC()` 加载） |
| VSC 对位实现 | `thincoder-vscode/src/tools/more-file.mjs` 的 `insert_after`（现体 = 核 `thincoder-core/tools/file.mjs`） | 同名机制 · 无自有 dirty 面（随核护栏） |

### 6.2 记账面归位

记账面独立成档（`thincoder-core/tools/write-path.mjs`，由 `file.mjs` 的 re-export 面转出）——跨工具（write / insert_after / 编辑族）共用。

### 6.3 VSC 端差异

VSC 端 `thincoder-vscode/src/tools/more-file.mjs` 的 `insert_after`；现体 = 核 `thincoder-core/tools/file.mjs`，行号锚护栏随核单源生效（无独立记账面）。

编辑器分支：doc 已打开 → 换行符按 fileEol（normalizeEOL + 消除 `$` 锚失配与混合 EOL 注入——`docs/core/design/EDIT-HELPERS.md` §6），经写路径缝承接。

无 `DESC()` md 描述（内嵌）；行尾写回与 CLI 同（F1——`docs/core/design/EDIT-HELPERS.md` §4）。

## 7. 并入的关键决策记录

| # | 决策 | 理由 |
|---|---|---|
| D-I1 | read-before-insert **dirty 护栏**（受影响区拒绝） | 行号漂移的静默错位比报错昂贵得多 |
| D-I2 | `after_line` 与 `after_regex` **互斥且 line 优先** | 两者皆给时以更精确者（行号）为准 |
| D-I3 | `after_regex` **必须恰匹配一行** | 多匹配即定位不唯一——报错并列出候选优于任选其一 |
| D-I4 | 行号锚判据与 `edit` **单源**（`EDIT-HELPERS.md` §7），拒文同句 | 同一份漂移两处各判必然分叉，模型学到的是「换一条路就过」 |
