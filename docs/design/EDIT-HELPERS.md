# 编辑共享 helper 权威语义（EDIT-HELPERS）

> 板块：编辑工具（共享底层）。权威源：VSC `src/tools/shared.mjs`（`detectFileEol` / `joinWithEol` / `majorityEol` / `findCandidates` / `FFFD_WARNING`）+ 消费方 `src/tools/file-edit.mjs` / `more-file.mjs` + **`lfOffsetToRaw`（VSC 编辑器路径专属——CRLF 原文偏移映射）**。本文档是 **编辑工具族共享 helper 语义的权威源**——`EDIT.md` / `HASHLINE-EDIT.md` / `APPLY-PATCH.md` / `WRITE.md` 指向此处，不得在别处复制（单一权威）。
> 双端：VSC（本文档）与 CLI（thincoder——helper 语义同，各自实现；**VSC 独有差异**：编辑器路径（doc 已打开）的 range 偏移坐标系映射 `lfOffsetToRaw`——CLI 无此路径）。
> 状态：**已实现**。历史需求/设计见文末「变更记录」。

## 1. 定位

编辑工具族（edit / apply_patch / hashline_edit / write）共用的行尾语义 + 失败候选 + 编码探测 helper——Windows 环境行尾错乱与失败黑盒的根治层。

## 2. 共享 helper（语义权威——同 CLI）

```js
// detectFileEol(text) → "\r\n" | "\n"
// joinWithEol(lines, text) → lines.join(detectFileEol(text))
// majorityEol(dirPath) → "\r\n" | "\n"
// findCandidates(lines, oldString, topN=3, threshold=0.5) → [{ line, preview, score }]
```

语义约束（detectFileEol 按首换行符 / findCandidates 阈值预算 / majorityEol 性能）——与 CLI `EDIT-HELPERS.md` §2-§3 同（同机制各自实现；本文档不复制 CLI 正文——镜像锚逐字部分在两端描述）。

## 3. 行尾语义（消费方行为——同 CLI）

**写回恢复（F1）**：edit/apply_patch/hashline_edit 改既有文件 → detectFileEol(原文) → join(原行尾)。
**新建跟随目录（F2）**：write/apply_patch 新建 → majorityEol(目录)。
**行为矩阵 / 行为兼容 / 性能**——与 CLI EDIT-HELPERS.md §4 同。

## 4. 编码探测（F4）

U+FFFD 警告（FFFD_WARNING）——hashline_edit 读入含 U+FFFD 追加（不阻断）。文案同 CLI。

## 5. VS Code 编辑器路径差异（F5——VSC 专属）

edit 在编辑器路径（doc 已打开）的 range 编辑，其定位偏移必须与 doc.positionAt 同坐标系——**`lfOffsetToRaw`** 把 LF 域偏移映射回 CRLF 原文偏移，再做 range 替换：

- 非 replace_all：偏移映射（保留 range 编辑——undo 粒度/光标/折叠/大文件性能/并发冲突面；否决整文档替换）。
- replace_all：补 EOL 还原（不再静默丢 CRLF）。
- read(hashes=true)/hashline_edit 哈希域统一（stripBom + normalizeEOL——消除 CRLF 尾 \r 与 BOM 首行哈希失配）。
- hashline_edit BOM 还原（磁盘写回带 BOM、编辑器分支不带——防双 BOM）。
- getOpenDoc win32 大小写不敏感（消除 split-brain）。
- insert_after normalizeEOL + 编辑器分支换行符按 fileEol（消除 $ 锚失配与混合 EOL 注入）。

## 6. 实现单一权威

- VSC：`src/tools/shared.mjs`（四 helper + FFFD_WARNING + lfOffsetToRaw）——edit/hashline_edit/apply_patch/write 同写路径共用 + 编辑器路径偏移。
- 消费点：edit（file-edit.mjs——写回 + 失败候选 + 编辑器 range）、hashline_edit（写回 + U+FFFD + BOM）、apply_patch（写回 + 新建）、write（覆盖按原行尾/新建 majorityEol）、insert_after（编辑器分支换行符）。

## 变更记录

- 2026-09-08：文档重组——VSC helper 语义从注释指针（原指 CLI EDIT-TOOL-EOL-DESIGN.md——跨仓悬空）独立成档（本文档——用户裁定 A：共享底层独立归属）。VSC 现有关档 `_archive/`。
- 2026-09-07：格式债清理——F5 并入 §5（已实现）。
- 2026-08-25~26：需求澄清与实证 + 设计定稿，两端落地实现（F5 2026-08-28 并入）。
