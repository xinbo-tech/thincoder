# edit 工具权威语义（EDIT）· 编辑工具板块

> 板块 = **编辑工具**；本档 = **edit 语义的权威源**（逐工具权威档之一 · 主编辑工具）。
> 地图与契约要点 = `docs/core/design/TOOLS.md` §6.6 · §8.2——本档不复制其内容（D2）。
> 共享底层（EOL 写回 / 失败候选 / U+FFFD）= `docs/core/design/EDIT-HELPERS.md`（**不在此重复**）。
> 双端：CLI `thincoder-core/tools/edit-diff.mjs` + `thincoder-core/tools/edit-batch.mjs` + `thincoder-core/tools/file.mjs`（`editTool` 壳 / schema）· VSC `thincoder-vscode/src/tools/file-edit.mjs`（同机制，各自实现）。
> 模型可见描述 = `thincoder-core/tool-docs/edit.md`（提示词面 / 产品代码——与语义须同改，见 §2 末）。
> 需求侧 = `docs/core/requirements/TOOLS.md`（工具系统板块；CLI 树无逐工具需求档）。
> 建档：2026-09-15（**B 式迁移轮 · 第 1 批**——`thincoder-cli/docs/design/EDIT.md` 内容重建入基准层；旧档原地一字不改、留作参照历史）。

## 1. 定位

edit = **按精确区域替换 / 删除文件内容**——主编辑工具。定位两形态（互斥）+ 三级匹配 + 判定序 4 分支（§4）+ **删行形态**（行号 + 省略 `new_string`——§5 矩阵）。适用面：知道要改 / 删哪一行或哪一段、或能给出当前内容。

**不是**：插入新行（→ insert_after）、按内容哈希行定位（→ hashline_edit）、整块 diff 多文件（→ apply_patch）、整文件重写（→ write）。（路由在模型可见描述的 Routing 段。）

## 2. 参数与 schema

- `path`（必须）——目标文件。
- **形态二选一**：
  - **行号形态（D1）**：`line: N`（单行，1-based）／ `startLine: N, endLine: M`（行范围，1-based 闭区间）——替换该行 / 范围为 `new_string`，**不需 `old_string`**；
  - **内容形态**：`old_string`（必须）——变化区当前内容；`new_string`——该区期望结果。
- `new_string`——内容形态必须；行号形态**可省略（= 删行 / 删范围）**；**显式空串 `""` 两形态皆拒**（§5 矩阵）。
- `replace_all`——字面替换每处（内容形态 only；行号形态不适用）。
- `edits`（数组批量）——`[{path?, old_string?, new_string?, line?, startLine?, endLine?, replace_all?}]`（条目同顶层形态语义——行号条目省略 `new_string` = 删）；互斥：`edits` 与顶层 `old_string`/`new_string`/`line`/`startLine`/`endLine`。

**两处维护点**：`thincoder-core/tool-docs/edit.md` 是模型可见文本（运行时经 `DESC()` 加载为 description）——与本文档语义一致，改语义须同改。

## 3. 匹配档位（D2——内容形态）

`old_string` 匹配三级档序（宽容——模型差异容忍）：

1. **逐字**——精确字符串匹配。
2. **唯一空白差异窗口**——逐字 occurrences=0 时按行 `trim()` 等价的唯一窗口自动应用（附 note）；多窗口歧义仍 not-found（不猜）。
3. **模糊匹配**——唯一窗口：行级 normalize（统一基准 = 去首尾空白 + 去行尾空格／tab→2 空格／`'`·`‘’`·`“”`·反引号单遍映射到 `"`（无顺序依赖）／无行内折叠）后逐行相等比例 **≥90%** 即匹配（附 `fuzzy matched` note 明示）；多窗口歧义 / 不足阈值仍 not-found 报错（不猜）。

## 4. 判定序（内容形态）

替换后做行级 diff 判定（在 normalize(LF) 域做行级 LCS）：

1. **分支 0（就地替换）**：old 恰单行 ∧ new 恰单行 ∧ 全文唯一匹配 ∧ new 非空 → 就地整行替换（行数不变）。
2. **零重叠**（old 每行都不在 new）：**替换即删**（D3——breaking：old 行整体删除、new 取而代之；原「插入保留旧行」语义废止；新增行改用 insert_after）。
3. **一般 LCS diff**：公共行保留（LCS 序）、old 独有删、new 独有插。
4. **平凡**：new 与 old 行级全等 → 原样替换（no-op 成功）。

**行号形态**（不经判定序）：定位行 / 范围 → 直接替换为 `new_string`（行数 = 范围行数 → new 行数）；**省略 `new_string` = 删行**（行数 → 0），返回 `Deleted line N of <path>` ／ `Deleted lines N-M of <path>` + diff。越界 / 互斥见 §5。

## 5. 约束

- **空串 vs 省略矩阵（D-8.1 裁定）**：
  - 内容形态空 `new_string` = **显式错误**（提示须带保留上下文行；单行替换永不成删除——防删除保护先于分支 0；含 `replace_all` 空串——守卫先于 replace_all 分支）；
  - 行号形态**省略 `new_string`** = 删行 / 删范围（有界意图——删哪行是显式声明）；
  - 行号形态**显式空串 `""`** = 显式错误（防误删——提示「省略 new_string 以删行」）；
  - **批量 `edits` 条目**同顶层（条目含行号 + 省略 `new_string` = 删行；内容条目空串拒）。
- **互斥**：行号形态与 `old_string`；`line` 与 `startLine`/`endLine`；`edits` 与顶层形态——均显式报错。
- **行号校验**：`line`/`startLine`/`endLine` 正整数；`startLine ≤ endLine`；`endLine ≤ 文件行数`（越界报错）；删行形态同校验。
- **`replace_all`**：每处 old→new **字面替换**（不做插入 / 分支 0）；多匹配无 `replace_all` → occurrences 错误。
- **`edits` 数组**：同文件多条**串行累积**、跨 path 并行、**全判后原子写**（任一失败全不写）；条目内同样二选一（`old_string` 或行号）；顶层 `path` = 无自带 path 条目的默认，条目自带 path 优先。
- **行数上限**：old/new 各 ≤1000（超限报 edit region too large）。
- **not-found 引导**：错误含 `searched:` + grep 建议 + `similar lines (top 3, score)` 段（LCS 连续子串 / 阈值 0.5 / top3，单行亦覆盖；零候选省略——算法权威见 `docs/core/design/EDIT-HELPERS.md` §2 `findCandidates`）。
- **数据新鲜度**：`old_string` / 行号只来自最新 `read`——改前 re-read。

## 6. 实现单一权威（现状路径 · as-of 2026-09-15 实核）

| 面 | 落点 | 实核 |
|---|---|---|
| 工具对象 / schema | `thincoder-core/tools/file.mjs:224`（`editTool`） | 导出在位 |
| diff 内核 / 判定序 | `thincoder-core/tools/edit-diff.mjs:76`（`applyPatchLines`）· `:253`（`computeEditEntry`） | 导出在位 |
| 校验 / 互斥 / 删行 | `thincoder-core/tools/edit-diff.mjs:129`（`assertEditArgsExclusive`）· `:143`（`validateEditEntry`）· `:55`（`deleteTarget`）· `:49`（`hasLineParams`）· `:63`（`splitLines`） | 导出在位 |
| D1/D2 纯函数 | `thincoder-core/tools/edit-batch.mjs:129`（`normalizeEditLine`）· `:150`（`findFuzzyWindow`）· `:184`（`applyLineEdit`）· `:141`（`FUZZY_MATCH_NOTE`） | 导出在位（edit-diff 调用期导入——ESM 循环安全） |
| 三通道共用 | 本地单形态 / `edits` 批量 / ACP 桥 | 同内核 |
| 注册面 | `thincoder-core/tools/index.mjs:4` · `:21` | file 组 |
| 描述面（模型可见） | `thincoder-core/tool-docs/edit.md` | 在位（`DESC()` 加载） |
| VSC 对位实现 | `thincoder-vscode/src/tools/file-edit.mjs:78`（`edit`）· `edit-diff.mjs` · `edit-batch` 等价档（`edit-line-params.mjs` / `edit-fuzzy-match.mjs`） | 同机制 · 独立实现 |

## 7. 测试

`thincoder-cli/test/edit-tool-improvement.test.mjs`（**33 用例——29 快 + 4 slow**：删行形态全路径 / 显式空串拒含 `replace_all` / normalize 弯引号命中 + 单遍映射单元 / 防误匹配 / 批量删行 + 模糊端到端）；VSC 侧同名档 `thincoder-vscode/test/edit-tool-improvement.test.mjs`。

## 8. 并入的关键决策记录（含否决备选）

| # | 决策 | 理由 / 否决备选 |
|---|---|---|
| D-1 | **行号形态**（`line:` / `startLine–endLine`）与内容形态并存 | 行号形态免除「编造上下文」；否决「仅内容形态」（多轮编辑后必然要重读全文） |
| D-2 | 三级匹配**宽容档序**（逐字 → 空白窗口 → 模糊 ≥90%） | 模型生成的 `old_string` 常带空白 / 缩进 / 引号差异；一律 not-found 会逼模型重头重写 |
| D-3 | **零重叠 ⇒ 替换即删**（breaking） | 「插入保留旧行」使简单替换产生双份内容（实害）；否决保留旧语义（新增行有 insert_after 正路） |
| D-4 | 显式空串 = **错误**、省略 = 删行 | 空串是手滑最可能形态（防误删）；省略是有界显式意图 |
| D-5 | `edits` 数组**全判后原子写** | 半应用批量 = 不自洽工作树 |

## 9. 不并项与历史沿革

### 9.1 历史沿革（(d) 类——**不并**）

> 来源档 `thincoder-cli/docs/design/EDIT.md`（CLI 产品档）——**原地保留作参照历史**（保留 ≠ 维护）。下列内容不并入本档：

| 旧档位置 | 内容 | 何故不并 |
|---|---|---|
| 旧档状态行 | 时点状态行（含 D1–D3 落地日期） | 批次语境——现行态已入 §1–§6 |
| 旧档「变更记录」节 + §7 之上游离的实施条目 | 阶段 2 落地流水 | 历史叙述——本档自有变更记录 |
| 旧档括注的 `TOOLS.md` §6.1 节号与 `_archive/EDIT-TOOL-IMPROVEMENT.md` | 旧节号 / 已归档设计档 | 现行地图节号 = `TOOLS.md` §6.6；归档档归 CLI 树 `_archive/`（参照历史） |
| 旧档 §3 中的 `8.2` / `§8` 类旧编号 | 旧结构编号 | 现行编号以本档节号为准（迁移轮统一） |

### 9.2 不并项登记（跨板块 / 一次性材料——**不并**，逐项登记）

| 旧档面 | 内容 | 何故不并（去向 / 触发） |
|---|---|---|
| 旧档「阶段 2 预告（EDIT-TOOLS-REVIEW.md）」相关注记 | 批次评估/预告 | 一次性批次材料；机制已落（§3–§5）——评估档归 CLI 树 `_archive/` |
| 描述面正文（Routing / 反模式） | 模型可见文本 | **提示词面 = 产品代码**——落点 `thincoder-core/tool-docs/edit.md` |

## 10. 体量与拆分规划（R24a）

**实测行数**：本档 **116 行**（根层新建 · as-of 2026-09-15 实核）——**低于 300 行软线，无需拆分规划**。

## 变更记录

- 2026-09-15（**B 式迁移轮 · 第 1 批**）：建档——`thincoder-cli/docs/design/EDIT.md` 内容重建入基准层（旧档一字未改、原地作参照历史）；旧结构编号统一为本文档节号；坐标改写为现状路径（`thincoder-core/tools/{edit-diff,edit-batch,file}.mjs` · VSC `file-edit.mjs`）；批次材料 / 状态行 / 变更流水不并（§9）。
