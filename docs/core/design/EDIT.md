# edit 工具权威语义（EDIT）· 编辑工具板块

> 板块 = **编辑工具**；本档 = **edit 语义的权威源**（逐工具权威档之一 · 主编辑工具）。
> 地图与契约要点 = `docs/core/design/TOOLS.md` §6.6 · §8.2——本档不复制其内容（D2）。
> 共享底层（EOL 写回 / 失败候选 / U+FFFD）= `docs/core/design/EDIT-HELPERS.md`（**不在此重复**）。
> 双端：CLI `thincoder-core/tools/edit-diff.mjs` + `thincoder-core/tools/edit-batch.mjs` + `thincoder-core/tools/file.mjs`（`editTool` 壳 / schema）· VSC `thincoder-vscode/src/tools/file-edit.mjs`（同机制，各自实现）（VSC 自持镜像已删——W14 已迁核，现体同指核三档）。 （迁移期引文）
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
- **入参容器守卫（#325）**：`edits` 真值非数组（字符串 / 对象 / 数字等）或空数组 ⇒ 成形错误「edits must be a non-empty array of {path, old_string | line/startLine+endLine, new_string}」——空数组与真值非数组 = 同一错误面；假值 `edits`（`""` / `0` / `false` / `null`）视同缺席 ⇒ 单形态面（不触本守卫）。
- **条目守卫（#325）**：条目非对象（`null` / 字符串 / 数字 / 数组）⇒ 条目级成形错误「edits[i] must be an object of {path, old_string | line/startLine+endLine, new_string}」（i = 数组下标）。
- **守卫与文案单源（#325）**：两守卫（`assertEditsContainer` / `assertEditEntries`）+ 五文案（`EDITS_CONTAINER_ERROR` / `editsEntryError(i)` / `EDIT_ENTRY_NO_PATH` / `EDIT_ABORT_PREFIX` / `editEntryLabel(p)`）单源 = `thincoder-core/tools/edit-diff.mjs`。
- **调用点（#325）**：核 `edit-batch.mjs` 与 ACP 桥 `bridge.mjs` 一律引用调用——桥零字面副本（§6 入参守卫行 / §8 D-7）。
- **零裸抛（#325）**：`touchedPaths` 钩子（`execute` 前被多处消费）不抛——真值非数组容器 ⇒ 零触达（返 `[]`；假值视同缺席 ⇒ 顶层 `path` 分支）、非对象条目 ⇒ 按「缺 path」尽力提取（§8 D-6）。
- **桥面同口径（#325）**：ACP 桥 `editBatch` 与核同调用两守卫（同单源、同句）——`[null]` / 非对象条目 ⇒ 同文案含下标成形错误（经 `toolRouter` catch 渲染 `Error: <msg>` 工具结果——零裸 TypeError、零反向 RPC）。
- **非数组容器回落（#325）**：`edits` 非数组不入桥批量分支（`toolRouter` 判据 `Array.isArray`）——不可成单形态（或能力位缺失）⇒ 回落本地通道、与核同错误面（`execute` 真值判 ⇒ 容器错误）；携合法单形态参数 ⇒ 桥径单形态应用、核径容器错误（同一入参两通道归宿分歧——登记项，见 §8 D-8）。
- **行数上限**：old/new 各 ≤1000（超限报 edit region too large）。
- **not-found 引导**：错误含 `searched:` + grep 建议 + `similar lines (top 3, score)` 段（LCS 连续子串 / 阈值 0.5 / top3，单行亦覆盖；零候选省略——算法权威见 `docs/core/design/EDIT-HELPERS.md` §2 `findCandidates`）。
- **数据新鲜度**：`old_string` / 行号只来自最新 `read`——改前 re-read。

## 6. 实现单一权威（现状路径 · as-of 2026-09-15 实核）

| 面 | 落点 | 实核 |
|---|---|---|
| 工具对象 / schema | `thincoder-core/tools/file.mjs:224`（`editTool`） | 导出在位 |
| diff 内核 / 判定序 | `thincoder-core/tools/edit-diff.mjs:88`（`applyPatchLines`）· `:280`（`computeEditEntry`） | 导出在位 |
| 校验 / 互斥 / 删行 | `thincoder-core/tools/edit-diff.mjs:141`（`assertEditArgsExclusive`）· `:170`（`validateEditEntry`）· `:67`（`deleteTarget`）· `:61`（`hasLineParams`）· `:75`（`splitLines`） | 导出在位 |
| 入参守卫（#325） | 单源 `thincoder-core/tools/edit-diff.mjs`（`assertEditsContainer` / `assertEditEntries` + 五文案——两通道共用）· 调用点 `thincoder-core/tools/edit-batch.mjs` / `thincoder-cli/src/acp/bridge.mjs` · `thincoder-core/tools/file.mjs:257`（`touchedPaths`——零抛、尽力提取） | 本批落（#325） |
| D1/D2 纯函数 | `thincoder-core/tools/edit-batch.mjs:128`（`normalizeEditLine`）· `:149`（`findFuzzyWindow`）· `:183`（`applyLineEdit`）· `:140`（`FUZZY_MATCH_NOTE`） | 导出在位（edit-diff 调用期导入——ESM 循环安全） |
| 三通道共用 | 本地单形态 / `edits` 批量 / ACP 桥 | 同内核 |
| 注册面 | `thincoder-core/tools/index.mjs:4` · `:21` | file 组 |
| 描述面（模型可见） | `thincoder-core/tool-docs/edit.md` | 在位（`DESC()` 加载） |
| VSC 对位实现 | `thincoder-vscode/src/tools/file-edit.mjs:78`（`edit`）· `edit-diff.mjs` · `edit-batch` 等价档（`edit-line-params.mjs` / `edit-fuzzy-match.mjs`）（W14 已迁核——上述自持档已删，现体 = 核 `thincoder-core/tools/{file.mjs, edit-diff.mjs, edit-batch.mjs}`） | 同机制 · 独立实现 （迁移期引文） |

**VSC 端差异（并入 · 批 8）**：① 描述机制——VSC 无 `DESC()` md 描述（`file-edit.mjs` editTool 对象内嵌 description——与 CLI `tool-docs/edit.md` 语义一致）；
② 编辑器路径——doc 已打开 → WorkspaceEdit range 替换（定位偏移与 `doc.positionAt` 同坐标系——`lfOffsetToRaw` 把 LF 域偏移映射回 CRLF 原文，见 `docs/core/design/EDIT-HELPERS.md` §6）；③ 测试面——VSC 侧 30 用例
（`thincoder-vscode/test/edit-tool-improvement.test.mjs`：删行形态 / 空串拒 / normalize 逐字同算法 / 批量混用行号+内容条目）。

**同类扫描（#325 · as-of 2026-09-25）**：「真值判断后点链」缺陷类——`thincoder-core/tools/**` 全扫仅 `file.mjs` 的 `touchedPaths` 一处（本批已卫）；其余工具触摸面（`read` / `insert_after` / `hashline_edit` 单参形态；`apply_patch` 有 try/catch 包裹）无一命中。**桥面**（`thincoder-cli/src/acp/bridge.mjs`）：`[null]` / 非对象条目同守卫同文案、跨档文案零副本（同批收——§5 / §8 D-7）。

## 7. 测试

`thincoder-cli/test/edit-tool-improvement.test.mjs`（**42 用例——38 快 + 4 slow**：删行形态全路径 / 显式空串拒含 `replace_all` / normalize 弯引号命中 + 单遍映射单元 / 防误匹配 / 批量删行 + 模糊端到端 / **#325 入参守卫 9 例**）。
**#325 守卫 9 例** = 核 5（真值非数组三态 `"[]"` / `{…}` / `42` + `[null]` / 非对象条目 ⇒ 成形错误、零裸抛）+ 桥 4（空数组 / `[null]` / 非对象条目经 `toolRouter` ⇒ `Error: <msg>`、零反向 RPC + 合法批量正向对照）。
VSC 侧同名档 `thincoder-vscode/test/edit-tool-improvement.test.mjs`（同引核面——守卫随核生效、端档零改）。

## 8. 并入的关键决策记录（含否决备选）

| # | 决策 | 理由 / 否决备选 |
|---|---|---|
| D-1 | **行号形态**（`line:` / `startLine–endLine`）与内容形态并存 | 行号形态免除「编造上下文」；否决「仅内容形态」（多轮编辑后必然要重读全文） |
| D-2 | 三级匹配**宽容档序**（逐字 → 空白窗口 → 模糊 ≥90%） | 模型生成的 `old_string` 常带空白 / 缩进 / 引号差异；一律 not-found 会逼模型重头重写 |
| D-3 | **零重叠 ⇒ 替换即删**（breaking） | 「插入保留旧行」使简单替换产生双份内容（实害）；否决保留旧语义（新增行有 insert_after 正路） |
| D-4 | 显式空串 = **错误**、省略 = 删行 | 空串是手滑最可能形态（防误删）；省略是有界显式意图 |
| D-5 | `edits` 数组**全判后原子写** | 半应用批量 = 不自洽工作树 |
| D-6 | 入参守卫落 **`touchedPaths` 零抛 + 执行阶段单源成形错误**（#325） | 钩子消费点 10 处（核 6 · VSC 4）未守卫者过半（try/catch 兜底仅 4 处）——钩子内抛错（即便成形文案）会从首个未守卫点逸出（实测 = VSC L3 前置查询 `thincoder-vscode/src/agent/execute-tools.mjs:188`→`Promise.all` 批级拒绝、裸 TypeError 直达用户）；零抛 ⇒ 拒绝统一落 `applyEditBatch`（与空数组同点同文）。否决：钩子内抛同文案（第二抛点、逸出不可控） |
| D-7 | 跨档单源 = **`thincoder-core/tools/edit-diff.mjs`**（#325 · 桥面同批收）：两守卫 + 五文案，核 `edit-batch.mjs` 与 ACP 桥 `bridge.mjs` 同调用、桥零副本 | 两侧已共同导入 `edit-diff` 校验词汇（`assertEditArgsExclusive` / `validateEditEntry` 等先例）——单源住共用导入面，条件与文案同时锁死；否决：常量导自 `edit-batch.mjs`（桥依赖本地实现模块、条件可分叉）；否决：桥自持副本（D2 双源） |
| D-8 | 非数组容器的通道归宿分歧 = **登记不触**（#325）：桥判据 `Array.isArray`（批量 → 单形态 → 回落本地）vs 核 `execute` 真值判——`edits` 真值非数组且携合法单形态参数时，桥径单形态应用、核径容器错误（同一入参两通道不同归宿） | 触发未实证；收口涉桥路由判据改动 = 扩面（父侧裁定不扩面）——登记承载 = `docs/batches/2026-09-25-edit-arg-guard.md` §2.8 项 4① · 台账 #327 项 ③；桥/核的批量守卫与文案已同源（D-7） |

## 9. 不并项与历史沿革

### 9.1 历史沿革（(d) 类——**不并**）

> 来源档 `thincoder-cli/docs/design/EDIT.md`（CLI 产品档）——**原地保留作参照历史**（保留 ≠ 维护）。下列内容不并入本档：

| 旧档位置 | 内容 | 何故不并 |
|---|---|---|
| 旧档状态行 | 时点状态行（含 D1–D3 落地日期） | 批次语境——现行态已入 §1–§6 |
| 旧档「变更记录」节 + §7 之上游离的实施条目 | 阶段 2 落地流水 | 历史叙述——本档自有变更记录 |
| 旧档括注的 `TOOLS.md` §6.1 节号与 `thincoder-cli/docs/design/_archive/EDIT-TOOL-IMPROVEMENT.md` | 旧节号 / 已归档设计档 | 现行地图节号 = `TOOLS.md` §6.6；归档档归 CLI 树 `_archive/`（参照历史） |
| 旧档 §3 中的 `8.2` / `§8` 类旧编号 | 旧结构编号 | 现行编号以本档节号为准（迁移轮统一） |

### 9.2 不并项登记（跨板块 / 一次性材料——**不并**，逐项登记）

| 旧档面 | 内容 | 何故不并（去向 / 触发） |
|---|---|---|
| 旧档「阶段 2 预告（EDIT-TOOLS-REVIEW.md）」相关注记 | 批次评估/预告 | 一次性批次材料；机制已落（§3–§5）——评估档归 CLI 树 `_archive/` |
| 描述面正文（Routing / 反模式） | 模型可见文本 | **提示词面 = 产品代码**——落点 `thincoder-core/tool-docs/edit.md` |
| VSC 档（`thincoder-vscode/docs/design/EDIT.md`）的批次材料（选型 / 用例表 / AC 表 / 变更记录） | 一次性材料 + 历史流水 | VSC 差异面已并 §6（VSC 端差异块）；批次档承载（D2） |

## 变更记录

- 2026-09-15（**B 式迁移轮 · 第 1 批**）：建档——`thincoder-cli/docs/design/EDIT.md` 内容重建入基准层（旧档一字未改、原地作参照历史）；旧结构编号统一为本文档节号；坐标改写为现状路径（`thincoder-core/tools/{edit-diff,edit-batch,file}.mjs` · VSC `file-edit.mjs`）；批次材料 / 状态行 / 变更流水不并（§9）。
- 2026-09-15（**B 式迁移轮 · VSC 第 8 批 · 并入 · eng-designer**）：§6 增 **VSC 端差异块**（内嵌描述机制 / WorkspaceEdit 编辑器路径 / 30 用例）；§8.2 登记 VSC 源档批次材料；坐标实核。
- 2026-09-15（**S2 W14 落地 · eng-coder**——承 `docs/batches/2026-09-15-vsc-core-wiring.md` §2 W14）：双端行 + §6「VSC 对位实现」行补迁核注（VSC 自持档已删——现体 = 核 `thincoder-core/tools/{file.mjs, edit-diff.mjs, edit-batch.mjs}`）；§6 末行补 `lfOffsetToRaw` 退场注（现体 = 核全文写路径）；机制条文零改。
- 2026-09-25（**#325 批 · 设计轮 · eng-designer**——承 `docs/batches/2026-09-25-edit-arg-guard.md` §2）：§5 增「入参容器守卫 / 条目守卫」（非数组容器与 `[null]` / 非对象条目 ⇒ 成形错误、零裸抛）；§6 增「入参守卫」行 + 同类扫描结论；§7 测试面纳入守卫 5 例（33 → 38）；§8 增 D-6（守卫落点与否决备选）。
- 2026-09-25（**#325 批 · fix 轮 · eng-designer**——承 `docs/batches/2026-09-25-edit-arg-guard.md` §2 修正块）：桥面同批收——§5 增守卫/文案单源条（两守卫 + 五文案单源 = `edit-diff.mjs`，核・桥同调用）；§6 入参守卫行 + 同类扫描补桥面；§7 桥面 4 例（38 → 42）；§8 增 D-7；桥内四处文案副本改引用。
- 2026-09-25（**#325 批 · 评审轮 1 落地（fix 轮 2）· eng-designer**——承 `docs/batches/2026-09-25-edit-arg-guard.md` §2 修正块轮 2）：§5 三处收正（容器守卫补「真值」限定 + 假值归宿；零裸抛条同限定；非数组回落条限定适用范围——不可成单形态 ⇒ 回落本地、同错误面；携合法单形态 ⇒ 两通道归宿分歧，回指 §8 D-8）；§7 核 5 例写「真值」样本；§8 增 D-8（分歧登记）。机制语义零改。
- 2026-09-25（**#325 批 · 实现后坐标重锚 · 父侧直接执行 · 机械修正 · 可 revert**——承批档 §5.6-3）：§6 坐标表重锚 11 处（`edit-diff.mjs` ×7 = 76/253/129/143/55/49/63 → 88/280/141/170/67/61/75；`edit-batch.mjs` ×4 = 129/150/184/141 → 128/149/183/140——实现插入所致）；`file.mjs:257` 与「入参守卫」行正确，零改。
