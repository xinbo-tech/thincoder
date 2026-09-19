# hashline_edit 工具权威语义（HASHLINE-EDIT）

> 板块：编辑工具。权威源：VSC `src/tools/hashline-edit.mjs`（W14 已迁核——现体 `thincoder-core/tools/file.mjs`）（hashlineEditTool——2026-09-08 自 file-edit.mjs 迁出，500 硬帽拆分；滑窗 hash 匹配/BOM 处理/编辑器路径；file-edit.mjs re-export）。本文档是 **hashline_edit 语义的权威源**——VSC `TOOLS.md` §9 只留地图（定位句 + 指针），不得复制本档正文。
> 双端：VSC（本文档）与 CLI（thincoder——同机制各自实现；**VSC 差异**：含 BOM 处理 + 编辑器路径分支）。
> 状态：**已实现**。定位判定（保留独立工具——2026-09-08 用户裁定"先保留"）：见 §4。

## 1. 定位

hashline_edit = **按内容哈希寻址编辑**（非字符串匹配）——**位置无关**（行号漂移免疫）：hash 标识行内容而非行号，行增删后 hash 仍指向原内容。

**唯一不可替代点（与 edit 的差异）**：按内容哈希寻址、位置无关——edit 的 `line: N` 需行号新鲜；hashline 不依赖行号（改前 read(hashes=true) 取 hash，改后行移动 hash 仍匹配）。

**不是**：插入新行（→ insert_after）、内容定位（→ edit）、整文件重写（→ write）。

## 2. 参数与 schema

hashlineEditTool（`hashline-edit.mjs`——2026-09-08 拆分，file-edit re-export）：

- `path`（必须）。
- `old_hashes`（必须）——待替换行 SHA256 hash 数组（12-char hex）。单行 `[hash]`；连续块按序。**只来自 read(hashes=true)**。
- `new_content`（必须）——替换文本（多行 ok）。**new_content 中无的旧行被删**（空 = 删该块——当前唯一命名删行路径；edit 空串被拒——VSC 行号形态例外见 EDIT.md §5）。

## 3. 语义

- **hash 算法**：SHA256(line_content).slice(0, 12)——与 read(hashes=true) 同算法。位置无关。
- **匹配**：滑窗 hash 序列匹配（连续块按序）；歧义 → 报错。
- **not-found**：错误含当前文件 hashes + 引导"re-read with hashes=true"。
- **U+FFFD 编码警告**：读入含 U+FFFD → 追加 FFFD_WARNING（不阻断——EDIT-HELPERS.md §4）。
- **hash 域统一**：stripBom + normalizeEOL（CRLF 尾 \r 与 BOM 首行不哈希失配——EDIT-HELPERS.md §5）。
- **BOM 还原（VSC 差异）**：磁盘写回带 BOM、编辑器分支不带（防双 BOM）。
- **EOL 写回**：detectFileEol(原文) → join(原行尾)（EDIT-HELPERS.md §3 F1）。

## 4. 何时用（模型路由）

- 行号可能漂移 / 内容多空白编码杂 → hashline（hash 免疫漂移）
- 删一块行（当前唯一命名删行路径——new_content 空）
- 内容明确可给、行号新鲜 → edit（主工具）；加新行 → insert_after

> 定位判定：**保留独立工具**（2026-09-08 用户裁定）——唯一差异点 = 位置无关哈希寻址，写入两端描述。阶段 2（EDIT-TOOLS-REVIEW.md）评估后路由段同步。

## 变更记录

- 2026-09-08：文档重组——hashline_edit 语义从 VSC TOOLS.md §9 + file-edit.mjs 内嵌描述并入本文档（每工具一档）。定位判定记录：保留独立（用户裁定）。
- 阶段 2 预告（EDIT-TOOLS-REVIEW.md）：hashline 定位重写（位置无关哈希寻址写入描述）+ 路由段同步。
