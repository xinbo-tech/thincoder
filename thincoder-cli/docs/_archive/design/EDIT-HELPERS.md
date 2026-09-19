# 编辑共享 helper 权威语义（EDIT-HELPERS）

> 板块：编辑工具（共享底层）。权威源：CLI `thincoder-core/tools/shared.mjs`（`detectFileEol` / `joinWithEol` / `majorityEol` / `findCandidates` / `FFFD_WARNING` 导出）
> + 消费方 `thincoder-core/tools/file.mjs` / `edit-batch.mjs` / `patch.mjs`。本文档是编辑工具族共享 helper 语义的权威源——`EDIT.md` / `HASHLINE-EDIT.md` / `APPLY-PATCH.md` / `WRITE.md` 指向此处，不得在别处复制（单一权威）。
> 双端：CLI（本文档）与 VSC（thincoder-vscode——helper 语义同，各自实现；VSC 另有 `lfOffsetToRaw`——VS Code 编辑器路径专属）。
> 状态：**已实现**（CLI 与 VS Code 两端落地）。历史需求/设计见文末「变更记录」。

## 1. 定位

编辑工具族（edit / apply_patch / hashline_edit / write）共用的行尾语义 + 失败候选 + 编码探测 helper——Windows 环境行尾错乱与失败黑盒的根治层。agent 在 CRLF 文件上频繁踩坑（`old_string not found`、写回混合行尾）→ 统一底层语义一次修好。

## 2. 共享 helper（语义权威）

```js
// detectFileEol(text) → "\r\n" | "\n"
// 首个换行符的类型：文件中第一个换行符是 "\r\n" 则整文件按 CRLF 恢复，
// 是 "\n"（裸）或无换行符按 LF
// joinWithEol(lines, text) → lines.join(detectFileEol(text))
// majorityEol(dirPath) → "\r\n" | "\n"
//   目录下 ≤20 个文件的多数派（每文件只读首 4KB 判首行换行符），空目录/平票 → "\n"
// findCandidates(lines, oldString, topN=3, threshold=0.5) → [{ line, preview, score }]
//   LCS 行级相似度；score = LCS(old_string, line).length / max(len)；≥ threshold 才进候选
```

## 3. 语义约束（helper 级）

- **detectFileEol**：不按 `\r\n` 计数（混合文件会误判），按**第一个换行符的类型**——文件首行末尾是 `\r\n` 则整文件按 CRLF 恢复（首行风格代表文件惯例）；无换行符按 LF。
- **findCandidates 阈值/预算**：score = LCS(old_string, line).length / max(len(old_string), len(line))，≥ 0.5 才进候选；top 3。参与 LCS 的 old_string 与行各截断到 500 字符再算分（防 minified 爆预算；预览本就截 80 字符）。
  - old_string 多行时**只对首行**找候选（输出前缀标 `old_string line 1:`——多行 old_string 的失败通常首行对不上，各报 top 3 噪音大）
  - **行数上限**：超过 5000 行只扫前 5000 行（失败路径单文件 <1MB 下 <10ms 的 NFR 兜底）
- **majorityEol 性能**：最多扫 20 个文件、每文件只读首 4KB 判首行换行符，目录内文件多也不慢；`write` 调用路径上的开销可忽略。

## 4. 行尾语义（消费方行为）

**写回恢复（F1）**：
```
edit / apply_patch / hashline_edit 改既有文件:
  readFile → normalizeEOL（匹配层——LF 域内操作） → 应用替换/hunk
    → 写回：detectFileEol(原文) → lines.join(原行尾)（F1）
```

**新建跟随目录（F2）**：
```
write / apply_patch 新建文件:
  → majorityEol(目录) → join(多数派行尾)（默认 LF；CRLF 多数派 → CRLF）
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

**行为兼容**：LF 文件行为不变（normalizeEOL 已是现状）；CRLF 文件行为变化仅限写回行尾。**性能**：相似度计算仅失败路径，单文件 <1MB <10ms；无新依赖。

## 5. 编码探测（F4）

hashline_edit 读入含 U+FFFD 时追加（不阻断）：

```text
⚠ file contains U+FFFD (replacement char) — encoding may be corrupted; hash-based addressing may be unreliable. Consider fixing the file encoding first.
```

U+FFFD 警告当前实现为 shared.mjs 的具名常量 `FFFD_WARNING`，由 hashline_edit 在结果文本（成功路径与 not-found 错误）末尾追加。

## 6. 实现单一权威

- CLI：`thincoder-core/tools/shared.mjs`（四 helper + FFFD_WARNING）——edit/apply_patch/hashline_edit/write 同写路径共用。
- VSC：helper 语义同——另有 `lfOffsetToRaw`（VS Code 编辑器路径 range 偏移——F5，VSC 专属，见 thincoder-vscode 侧档）。
- 消费点：edit（`file.mjs` edit 失败接 findCandidates / 写回 joinWithEol）、hashline_edit（写回 + U+FFFD 警告）、apply_patch（写回 + 新建 majorityEol）、write（覆盖按原行尾 F1、新建按 majorityEol F2）。

## 变更记录

- 2026-09-08：文档重组——helper 语义从 EDIT-TOOL-EOL-DESIGN.md + EDIT-TOOL-EOL-REQUIREMENTS.md 并入本文档（独立 helper 档——用户裁定 A：共享底层独立归属）。原档归档 `_archive/`。
- 2026-09-07：格式债清理——批量档案重写为当前态；F5 并入 §5（已实现）。
- 2026-08-25~26：需求澄清与实证 + 设计定稿，两端落地实现。
