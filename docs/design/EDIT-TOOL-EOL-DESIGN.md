# 编辑工具可靠性（行尾语义 + 候选提示 + 哈希健壮性）——设计

> 对应需求：`EDIT-TOOL-EOL-REQUIREMENTS.md`（F1–F4）。关键决策 D1–D5 见需求文档，本文件只落设计细节。

## 1. 方案总览

四个改动点，各自独立、可分批落地（建议顺序 ①②③④）：

| # | 改动 | 落点（CLI / VS Code） | 一句话方案 |
|---|---|---|---|
| ① | edit 写回恢复原行尾 | CLI `file.mjs` / VS Code 已有（核对保持） | 匹配层 normalizeEOL 后，写回前检测原文件行尾（**首个换行符的类型**：首行末尾是 `\r\n` 则整文件按 CRLF 恢复，无换行符按 LF——唯一规则），按原行尾 join |
| ② | apply_patch 写回恢复原行尾 | CLI `patch.mjs` / VS Code `more-file.mjs` | 同①的检测逻辑下沉为共享 helper，`lines.join(detectedEol)` |
| ③ | edit 候选提示 | 两端 `file.mjs` | `old_string not found` 时按 LCS 行级相似度给 top 3 候选 |
| ④ | hashline_edit 编码探测 | 两端 `file.mjs`（VS Code 对应位置） | 读入后含 U+FFFD 则返回文本追加警告 |

**共享 helper（两端各写一份）**：
```js
// detectFileEol(text) → "\r\n" | "\n"
//   首个换行符的类型：文件中第一个换行符是 "\r\n" 则整文件按 CRLF 恢复，是 "\n"（裸）或无换行符按 LF
// joinWithEol(lines, text) → lines.join(detectFileEol(text))
// majorityEol(dirPath) → "\r\n" | "\n"（目录下 ≤20 个文件的多数派，空目录 → "\n"）
// findCandidates(lines, oldString, topN=3, threshold=0.5) → [{ line, preview, score }]（LCS 行级相似度）
```

## 2. 架构 / 数据流

```
edit / apply_patch:
  readFile → normalizeEOL（匹配层，现状）
    → 应用替换/hunk（LF 域内操作）
    → 写回：detectFileEol(原文) 检测原行尾 → lines.join(原行尾)（F1/②）
  新建（write / apply_patch --- /dev/null）:
    → majorityEol(目录) → join(多数派行尾)（F2/③）

edit 失败路径:
  old_string not found → findCandidates(全文行, old_string) → top 3 附行号+预览+分数（F3/③）

hashline_edit:
  readFile → normalizeEOL → 含 \uFFFD? → 返回文本追加编码警告（F4/④）
```

**行为矩阵**：

| 场景 | 现行为 | 改后 |
|---|---|---|
| CRLF 文件 edit | 写回全 LF（行尾被转） | 写回 CRLF（diff 只含改动行） |
| LF 文件 edit | 写回 LF（不变） | 不变 |
| CRLF 文件 apply_patch | 写回 LF（行尾被转） | 写回 CRLF |
| 新建文件（CRLF 目录） | 写 LF（与目录风格冲突） | 跟随目录多数派 CRLF |
| 新建文件（LF 目录/空目录） | LF | 不变 |
| old_string 找不到 | 仅报错+前缀 | 报错 + top 3 相似行提示 |
| hashline_edit 遇 U+FFFD | 静默（哈希可能错） | 追加编码警告 |

## 3. 受影响文件清单

**CLI（`thincoder`）**：
- `src/tools/shared.mjs` — 加 `detectFileEol` / `joinWithEol` / `majorityEol` / `findCandidates` 导出
- `src/tools/file.mjs` — edit 写回按原行尾（`joinWithEol`）；edit 失败接 `findCandidates`；write 新建按 `majorityEol`；hashline_edit 加 U+FFFD 警告
- `src/tools/patch.mjs` — apply_patch 写回 `lines.join(joinWithEol(原文))`；新建文件按 `majorityEol`
- `test/`（对应测试文件）— 行尾语义/候选/探测用例

**VS Code（`thincoder-vscode`）**：
- `src/tools/shared.mjs` — 同 CLI 的四个 helper（各自实现）
- `src/tools/file.mjs` — edit 已做行尾恢复（**核对不改**）；加 `findCandidates` 候选提示；write 新建按 `majorityEol`；hashline_edit 加 U+FFFD 警告
- `src/tools/more-file.mjs` — apply_patch 写回 `lines.join(joinWithEol(原文))`（替代 `join("\n")`）；新建按 `majorityEol`
- `test/`（对应测试文件）

## 4. 关键实现要点

1. **detectFileEol 的判定**：不按 `\r\n` 计数（混合文件会误判），按**第一个换行符的类型**——文件首行末尾是 `\r\n` 则整文件按 CRLF 恢复（首行风格代表文件惯例）；无换行符按 LF。
2. **majorityEol 的性能**：最多扫 20 个文件、每文件只读首 4KB 判首行换行符，目录内文件多也不慢；`write` 调用路径上的开销可忽略。
3. **findCandidates 的阈值**：score = LCS(old_string, line).length / max(len(old_string), len(line))，≥ 0.5 才进候选；top 3。**防 minified 爆预算**（评审 finding #4）：参与 LCS 的 old_string 与行各截断到 500 字符再算分（预览本就截 80 字符，截断不影响提示质量）。old_string 多行时**只对首行**找候选（输出前缀标 `old_string line 1:`——多行 old_string 的失败通常首行对不上，各报 top 3 噪音大，评审 finding #6 定）。
4. **U+FFFD 警告**：normalizeEOL 之后、`lines.split` 之前一次性扫描 `\uFFFD` 存在性，存在则返回文本末尾追加 `⚠ file contains U+FFFD (replacement char) — encoding may be corrupted; hash-based addressing may be unreliable. Consider fixing the file encoding first.` 不抛错不阻断。
5. **VS Code 的 edit 编辑器路径**（open doc）：`applyEditorEdit`/`applyEditorRangeEdit` 走 WorkspaceEdit，行尾由编辑器托管——该路径本就不涉及写回行尾问题，**不动**；仅 disk 直写路径补。

## 5. 测试契约（两端各自补）

| 用例 | 输入 | 预期 |
|---|---|---|
| CRLF edit | 纯 CRLF 文件 + old_string（LF 形态） | 成功替换；写回全部 CRLF，无裸 LF |
| LF edit | 纯 LF 文件 | 写回 LF（回归） |
| CRLF apply_patch | 纯 CRLF 文件 + diff | 写回全部 CRLF |
| 新建文件（CRLF 目录） | 目录下已有 CRLF 文件 + write/apply_patch 新建 | 新文件为 CRLF |
| 新建文件（LF 目录/空目录） | 同上 | 新文件为 LF |
| edit 失败候选 | old_string 与实际某行差几个字符 | 返回含该行的行号+预览+相似度（≥0.5） |
| edit 失败无候选 | old_string 与全文任一行相似度 <0.5 | 仅报错，无候选（防噪音） |
| 混合行尾（边界） | 首行 LF、后续含 CRLF 的文件 + edit | 按**首行 LF** 恢复（首个换行符规则——混合文件跟随首行风格），后续 CRLF 行保留原样（normalize 后写回按首行风格） |
| 多行 old_string 失败（边界） | old_string 跨 3 行，首行对不上 | 候选标注 `old_string line 1:` + top 3（只针对首行） |
| hashline_edit U+FFFD | 文件含替换符 | 结果文本含编码警告，操作仍执行 |
| hashline_edit 干净文件 | 正常 UTF-8 | 无警告（回归） |

## 6. 被否决的备选方案

| 方案 | 否决理由 |
|---|---|
| 全局统一强制 LF（git autocrlf 处理） | 用户仓库大量 CRLF 源码，强制 LF 会让每次 edit 产生整文件 diff，且与本机其他工具（VS/记事本）打开混乱 |
| 候选提示用 Levenshtein | 行级太贵且对长 old_string 语义差（LCS 更贴"哪一行最接近"的直觉） |
| 编码探测阻断操作 | U+FFFD 不一定代表内容错（可能是合法的多语言文件），阻断过激；警告足够 |
