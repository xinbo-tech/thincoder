# hashline_edit 工具权威语义（HASHLINE-EDIT）

> 板块：编辑工具。权威源：CLI `src/tools/file.mjs`（hashlineEditTool :368-449——滑窗 hash 匹配/歧义报错/U+FFFD 警告/hash 域）。本文档是 **hashline_edit 语义的权威源**——`TOOLS.md` §6.3 只留地图（定位句 + 指针），不得复制本档正文。
> 双端：CLI（本文档）与 VSC（thincoder-vscode——同机制各自实现，另含 BOM 处理/编辑器路径）。
> 状态：**已实现**。定位判定（保留独立工具——2026-09-08 用户裁定"先保留"）：见 §5。

## 1. 定位

hashline_edit = **按内容哈希寻址编辑**（非字符串匹配）——**位置无关**（行号漂移免疫）：hash 标识行内容而非行号，行增删后 hash 仍指向原内容。

**唯一不可替代点（与 edit 的差异）**：**按内容哈希寻址、位置无关**——edit 的 `line: N` 需行号新鲜（行号漂移即错），hashline_edit 不依赖行号（改前 read(hashes=true) 取 hash，改后行移动 hash 仍匹配）。

**不是**：插入新行（→ insert_after）、内容定位（→ edit）、整文件重写（→ write）。

## 2. 参数与 schema

hashlineEditTool（`file.mjs`）：

- `path`（必须）。
- `old_hashes`（必须）——待替换行的 SHA256 hash 数组（12-char hex）。单行 `[hash]`；连续块 `[hash1, hash2, ...]`（按序）。**只来自 read(hashes=true)**（数据新鲜度——改前 re-read）。
- `new_content`（必须）——替换文本（多行 ok）。**new_content 中无的旧行被删**（空 = 删该块——**当前唯一的命名删行路径**；edit 空串被拒）。

## 3. 语义

- **hash 算法**：SHA256(line_content).slice(0, 12)——与 read(hashes=true) 同算法（`hashLine` :364-366）。位置无关：hash 标识内容非行号（行增删后仍指向原内容）。
- **匹配**：滑窗 hash 序列匹配（连续块按序）；歧义（多位置）→ 报错。
- **not-found**：错误含当前文件 hashes（可据此重试）+ 引导"for fresh hashes, re-read the file with hashes=true"。
- **U+FFFD 编码警告**：读入含 U+FFFD → 结果文本追加 `FFFD_WARNING`（不阻断——算法见 EDIT-HELPERS.md §5）。
- **EOL 写回**：detectFileEol(原文) → join(原行尾)（EDIT-HELPERS.md §4 F1）。
- **hash 域**：stripBom + normalizeEOL（CRLF 尾 \r 与 BOM 首行不造成哈希失配）。

## 4. 何时用（模型路由）

- **行号可能漂移**（多次编辑后）/ 内容多空白/编码杂 → hashline（hash 免疫漂移）
- **删一块行**（当前唯一命名删行路径——new_content 空）
- 内容明确可给、行号新鲜 → edit（主工具）；加新行 → insert_after

> 注：hashline 与 edit 的差异化定位在 D1-D3 后被削弱（edit 自己已能 `line:` 改 + 模糊匹配）——阶段 2（EDIT-TOOLS-REVIEW.md）评估后路由段同步。定位判定：**保留独立工具**（2026-09-08 用户裁定）——唯一差异点 = 位置无关哈希寻址，写入两端描述。

## 5. 测试

hashline 相关用例在既有 file 工具测试（hash 匹配/歧义/not-found 引导）。

## 变更记录

- 2026-09-08：文档重组——hashline_edit 语义从 TOOLS §6.3 + hashline_edit.md 描述并入本文档（每工具一档）。定位判定记录：保留独立（用户裁定）。
- 阶段 2 预告（EDIT-TOOLS-REVIEW.md）：hashline 定位重写（位置无关哈希寻址写入描述）+ 路由段同步。
