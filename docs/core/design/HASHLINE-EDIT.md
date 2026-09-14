# hashline_edit 工具权威语义（HASHLINE-EDIT）· 编辑工具板块

> 板块 = **编辑工具**；本档 = **hashline_edit 语义的权威源**（逐工具权威档之一）。
> 地图与契约要点 = `docs/core/design/TOOLS.md` §6.6 · §8.2——本档不复制其内容（D2）。
> 共享底层 = `docs/core/design/EDIT-HELPERS.md`（hash 域 / EOL 写回 / U+FFFD 常量——本档只指不述）。
> 双端：CLI `thincoder-core/tools/file.mjs`（`hashlineEditTool` · `hashLine`）· VSC `thincoder-vscode/src/tools/hashline-edit.mjs`（同机制，各自实现；另含 BOM 处理 / 编辑器路径）。
> 模型可见描述 = `thincoder-core/tool-docs/hashline_edit.md`（提示词面 / 产品代码）。
> 需求侧 = `docs/core/requirements/TOOLS.md`（工具系统板块；CLI 树无逐工具需求档）。
> 建档：2026-09-15（**B 式迁移轮 · 第 1 批**——`thincoder-cli/docs/design/HASHLINE-EDIT.md` 内容重建入基准层；旧档原地一字不改、留作参照历史）。

## 1. 定位

hashline_edit = **按内容哈希寻址编辑**（非字符串匹配）——**位置无关**（行号漂移免疫）：hash 标识行内容而非行号，行增删后 hash 仍指向原内容。

**唯一不可替代点（与 edit 的差异）**：按内容哈希寻址、位置无关——edit 的 `line: N` 需行号新鲜（漂移即错），hashline_edit 不依赖行号（改前 `read(hashes=true)` 取 hash，改后行移动 hash 仍匹配）。

**不是**：插入新行（→ insert_after）、内容定位（→ edit）、整文件重写（→ write）。

**定位判定**：**保留独立工具**（2026-09-08 用户裁定「先保留」）——唯一差异点 = 位置无关哈希寻址，写入两端描述。

## 2. 参数与 schema

- `path`（必须）——目标文件。
- `old_hashes`（必须）——待替换行的 SHA256 hash 数组（12-char hex）。单行 `[hash]`；连续块 `[hash1, hash2, ...]`（按序）。**只来自 `read(hashes=true)`**（数据新鲜度——改前 re-read）。
- `new_content`（必须）——替换文本（可多行）。**new_content 中不出现的旧行被删**；空 `new_content` = 删该块——**当前唯一的命名删行路径**（edit 的显式空串被拒）。

## 3. 语义

- **hash 算法**：`SHA256(line_content).slice(0, 12)`——与 `read(hashes=true)` 同算法（`thincoder-core/tools/file.mjs:376` `hashLine`）。位置无关：hash 标识内容而非行号。
- **匹配**：滑窗 hash 序列匹配（连续块按序）；歧义（多位置）→ 报错。
- **not-found**：错误含当前文件 hashes（可据此重试）+ 引导「for fresh hashes, re-read the file with hashes=true」。
- **U+FFFD 编码警告**：读入含 U+FFFD → 结果文本追加 `FFFD_WARNING`（不阻断——常量见 `docs/core/design/EDIT-HELPERS.md` §5）。
- **EOL 写回**：`detectFileEol(原文)` → `join(原行尾)`（`docs/core/design/EDIT-HELPERS.md` §4 F1）。
- **hash 域**：stripBom + normalizeEOL（CRLF 尾 `\r` 与 BOM 首行不造成哈希失配）。

## 4. 何时用（模型路由）

- 行号可能漂移（多次编辑后）/ 内容多空白 / 编码杂 → hashline_edit（hash 免疫漂移）；
- 删一块行（当前唯一命名删行路径——`new_content` 空）；
- 内容明确可给、行号新鲜 → edit（主工具）；加新行 → insert_after；整文件 → write。

## 5. 测试

用例住编辑工具族测试面（hash 匹配 / 歧义 / not-found 引导 / U+FFFD 警告）——逐档用例表归 **TESTING 板**（本层该档尚缺 = 后续迁移批项，见迁移台账 `docs/core/design/DOC-MIGRATION.md`）。

## 6. 机制面（B 式迁移并入——现状路径）

### 6.1 实现坐标（as-of 2026-09-15 实核）

| 面 | 落点 | 实核 |
|---|---|---|
| 工具对象 / 执行 | `thincoder-core/tools/file.mjs:380`（`hashlineEditTool`） | 导出在位 |
| hash 计算 | `thincoder-core/tools/file.mjs:376`（`hashLine`） | 导出在位 |
| U+FFFD 常量 | `thincoder-core/tools/shared.mjs:162`（`FFFD_WARNING`） | 导出在位（逐字与 `EDIT-HELPERS.md` §5 同） |
| 描述面（模型可见） | `thincoder-core/tool-docs/hashline_edit.md` | 在位（`DESC()` 加载） |
| VSC 对位实现 | `thincoder-vscode/src/tools/hashline-edit.mjs` | 同名机制 · 独立实现 |

### 6.2 与 edit 的差异化定位（现行口径）

D1–D3（edit 自获 `line:` 与模糊匹配）后，hashline_edit 的差异面收窄为**位置无关哈希寻址**一项——该差异点即其保留理由（§1 末）；路由段两端描述同此口径。

## 7. 并入的关键决策记录（含否决备选）

| # | 决策 | 理由 / 否决备选 |
|---|---|---|
| D-H1 | **保留独立工具**（不并入 edit） | 唯一差异点（位置无关 hash 寻址）在长会话多轮编辑下不可由行号形态替代；否决「并入 edit」（丢掉漂移免疫） |
| D-H2 | hash 域做 **stripBom + normalizeEOL** | 否则 BOM / CRLF 尾字符使「同一行」哈希失配——假 not-found |
| D-H3 | U+FFFD → **警告不阻断** | 编码损坏时仍给模型一次尝试机会；阻断会令损坏文件整体不可编辑 |

## 8. 不并项与历史沿革

### 8.1 历史沿革（(d) 类——**不并**）

> 来源档 `thincoder-cli/docs/design/HASHLINE-EDIT.md`（CLI 产品档）——**原地保留作参照历史**（保留 ≠ 维护）。下列内容不并入本档：

| 旧档位置 | 内容 | 何故不并 |
|---|---|---|
| 旧档状态行 | 时点状态行（含定位判定注） | 批次语境——现行态已入 §1 末与 §6.2 |
| 旧档「阶段 2 预告（EDIT-TOOLS-REVIEW.md）」注 | 旧结构（单节时代）的预告与已废档名 | 现行形态已落（§4 路由 + §6.2 差异口径）；被引档名属旧结构 |
| 旧档「变更记录」节（2026-09-08 文档重组） | 文档重组流水 | 历史叙述——本档自有变更记录 |
| 旧档括注的 `TOOLS.md` §6.3 节号 | 旧节号 | 现行地图节号 = `TOOLS.md` §6.6 |

### 8.2 不并项登记（跨板块 / 一次性材料——**不并**，逐项登记）

| 旧档面 | 内容 | 何故不并（去向 / 触发） |
|---|---|---|
| 描述面正文（参数说明 / 反模式） | 模型可见文本 | **提示词面 = 产品代码**——落点 `thincoder-core/tool-docs/hashline_edit.md` |
| 旧档「阶段 2」所引 `EDIT-TOOLS-REVIEW.md` | 批次评估档 | 一次性批次材料——已归档 CLI 树 `_archive/`（参照历史） |

## 9. 体量与拆分规划（R24a）

**实测行数**：本档 **96 行**（根层新建 · as-of 2026-09-15 实核）——**低于 300 行软线，无需拆分规划**。

## 变更记录

- 2026-09-15（**B 式迁移轮 · 第 1 批**）：建档——`thincoder-cli/docs/design/HASHLINE-EDIT.md` 内容重建入基准层（旧档一字未改、原地作参照历史）；坐标改写为现状路径；批次材料 / 状态行 / 变更流水不并（§8）。
