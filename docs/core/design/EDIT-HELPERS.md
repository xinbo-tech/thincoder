# 编辑共享 helper 权威语义（EDIT-HELPERS）· 编辑工具板块

> 板块 = **编辑工具（共享底层）**；本档 = 编辑工具族共享 helper 语义的**唯一权威**（`docs/core/design/EDIT.md` / `HASHLINE-EDIT.md` / `APPLY-PATCH.md` / `WRITE.md` 指向此处，不得在别处复制）。
> 地图与契约要点 = `docs/core/design/TOOLS.md` §6.6（末段「共享 helper 权威 = 编辑辅助面」/ §8.2——旧指针未给档名，本档即其落点）。
> 双端：CLI `thincoder-core/tools/shared.mjs` · VSC `thincoder-vscode/src/tools/shared.mjs`（helper 语义同，各自实现；VSC 另有编辑器路径专属面——§6）。
> 需求侧 = `docs/core/requirements/TOOLS.md`（工具系统板块；CLI 树无逐工具需求档）。
> 建档：2026-09-15（**B 式迁移轮 · 第 1 批**——`thincoder-cli/docs/design/EDIT-HELPERS.md` 内容重建入基准层；旧档原地一字不改、留作参照历史）。

## 1. 定位

编辑工具族（edit / apply_patch / hashline_edit / write）共用的**行尾语义 + 失败候选 + 编码探测** helper——Windows 环境行尾错乱与失败黑盒的根治层。模型在 CRLF 文件上频繁踩坑（`old_string not found` / 写回混合行尾）⇒ 统一底层语义一次修好。

## 2. 共享 helper（语义权威）

```js
detectFileEol(text) → "\r\n" | "\n"
  // 首个换行符的类型：文件中第一个换行符是 "\r\n" 则整文件按 CRLF 恢复；是 "\n"（裸）或无换行符按 LF
joinWithEol(lines, text) → lines.join(detectFileEol(text))
majorityEol(dirPath) → "\r\n" | "\n"
  // 目录下 ≤20 个文件的多数派（每文件只读首 4KB 判首行换行符）；空目录/平票 → "\n"
findCandidates(lines, oldString, topN=3, threshold=0.5) → [{ line, preview, score }]
  // LCS 行级相似度；score = LCS(old_string, line).length / max(len)；≥ threshold 才进候选
```

**坐标（as-of 2026-09-15 实核）**：`thincoder-core/tools/shared.mjs:67`（`detectFileEol`）· `:73`（`joinWithEol`）· `:82`（`majorityEol`）· `:142`（`findCandidates`）· `:162`（`FFFD_WARNING`）。

## 3. 语义约束（helper 级）

- **detectFileEol**：不按 `\r\n` 计数（混合文件会误判），按**第一个换行符的类型**——文件首行末尾是 `\r\n` 则整文件按 CRLF 恢复（首行风格代表文件惯例）；无换行符按 LF。
- **findCandidates 阈值 / 预算**：`score = LCS(old_string, line).length / max(len(old_string), len(line))`，≥0.5 才进候选；top 3。参与 LCS 的 `old_string` 与行**各截断到 500 字符**再算分（防 minified 爆预算；预览本就截 80 字符）。
  - `old_string` 多行时**只对首行**找候选（输出前缀标 `old_string line 1:`——多行 `old_string` 的失败通常首行对不上，各报 top 3 噪音大）；
  - **行数上限**：超过 5000 行只扫前 5000 行（失败路径单文件 <1MB 下 <10ms 的 NFR 兜底）。
- **majorityEol 性能**：最多扫 20 个文件、每文件只读首 4KB 判首行换行符——目录内文件多也不慢；`write` 调用路径上的开销可忽略。

## 4. 行尾语义（消费方现行行为）

**写回恢复（F1）**：

```text
edit / apply_patch / hashline_edit 改既有文件:
  readFile → normalizeEOL（匹配层——LF 域内操作） → 应用替换/hunk
    → 写回：detectFileEol(原文) → lines.join(原行尾)（F1）
```

**新建跟随目录（F2）**：

```text
write / apply_patch 新建文件:
  → majorityEol(目录) → join(多数派行尾)（默认 LF；CRLF 多数派 → CRLF）
```

**行为兼容与性能**：LF 文件行为不变（normalizeEOL 已是现状）；CRLF 文件的变化仅限**写回行尾**（不再被转成 LF）。相似度计算仅走失败路径——单文件 <1MB 时 <10ms；无新依赖。

## 5. 编码探测（F4）

hashline_edit 读入含 U+FFFD 时追加（**不阻断**）：

```text
⚠ file contains U+FFFD (replacement char) — encoding may be corrupted; hash-based addressing may be unreliable. Consider fixing the file encoding first.
```

实现 = `shared.mjs` 具名常量 `FFFD_WARNING`（`thincoder-core/tools/shared.mjs:162`），由 hashline_edit 在结果文本（成功路径与 not-found 错误）末尾追加。

## 6. 实现单一权威与端差

- **CLI**：`thincoder-core/tools/shared.mjs`（四 helper + `FFFD_WARNING`）——edit / apply_patch / hashline_edit / write 同写路径共用。
- **VSC**：helper 语义同、各自实现；另有 `lfOffsetToRaw`（VS Code 编辑器路径 range 偏移——**端专属**，见 VSC 树档）。
- **消费点**：edit（失败接 `findCandidates` / 写回 `joinWithEol`）· hashline_edit（写回 + U+FFFD 警告）· apply_patch（写回 + 新建 `majorityEol`）· write（覆盖按原行尾 F1、新建按 `majorityEol` F2）。

**VSC 端差异（并入 · 批 8 · 编辑器路径面）**——VSC 端 `thincoder-vscode/src/tools/shared.mjs` 另有编辑器路径专属 helper `lfOffsetToRaw`
（CLI 无此路径——坐标系 = LF 域偏移 → CRLF 原文偏移）：非 replace_all 走 range 编辑偏移映射（保留 undo 粒度 / 光标 / 折叠 / 大文件性能——否决整文档替换）·
replace_all 补 EOL 还原（不静默丢 CRLF）· hash 域统一（stripBom + normalizeEOL——CRLF 尾 `\r` / BOM 首行不哈希失配）· hashline_edit BOM 还原（磁盘写回带 BOM、编辑器分支不带——防双 BOM）·
getOpenDoc win32 盘符大小写归一（消除 split-brain）· insert_after 编辑器分支换行符按 fileEol（消除 `$` 锚失配与混合 EOL 注入）。消费点 = `{file-edit,hashline-edit,more-file}.mjs`。
本仓检出 EOL 约定（`.gitattributes` = `* text=auto eol=lf`）与 CLI 仓逐字节同源（各端自持）。

## 7. 并入的关键决策记录（含否决备选）

| # | 决策 | 理由 / 否决备选 |
|---|---|---|
| D-H1 | **共享底层独立成档**（helper 不上收到各工具档） | 四工具同写路径——重复描述必然漂移；否决「各工具档自述 EOL 规则」 |
| D-H2 | `detectFileEol` 用**首个换行符**判据（非计数） | 混合行尾文件按计数判会翻车；首行风格即文件惯例 |
| D-H3 | 失败候选**截断 500 字符 + 5000 行预算** | minified 单行文件的 LCS 会爆预算；否决无预算（失败路径拖慢交互） |
| D-H4 | U+FFFD **警告不阻断** | 编码损坏时仍给模型一次尝试机会；阻断会让损坏文件整体不可编辑 |

## 8. 不并项与历史沿革

### 8.1 历史沿革（(d) 类——**不并**）

> 来源档 `thincoder-cli/docs/design/EDIT-HELPERS.md`（CLI 产品档）——**原地保留作参照历史**（保留 ≠ 维护）。下列内容不并入本档：

| 旧档位置 | 内容 | 何故不并 |
|---|---|---|
| 旧档「现行为 → 改后」对照矩阵（含「CRLF 文件 edit 写回全 LF」等左列） | 修复前的旧行为对照 | 左列 = **已废现状**（旧结构）；现行行为已入 §4 |
| 旧档状态行 | 时点状态行 | 批次语境——现行态已入 §1–§6 |
| 旧档「变更记录」节（2026-08-25~09-08 三条） | 需求澄清 / 落地流水 | 历史叙述——本档自有变更记录 |
| 旧档括注的 `_archive/EDIT-TOOL-EOL-DESIGN.md` / `-REQUIREMENTS.md` | 已归档设计 / 需求档 | 归档档归 CLI 树 `_archive/`（参照历史） |

### 8.2 不并项登记（跨板块 / 一次性材料——**不并**，逐项登记）

| 旧档面 | 内容 | 何故不并（去向 / 触发） |
|---|---|---|
| VSC 编辑器路径专属面（`lfOffsetToRaw` 细节） | 端专属机制 | **已并入（2026-09-15 批 8）**——§6 VSC 端差异块（六条编辑器路径差异逐条登记）；VSC 源档留参照历史 |
| VSC 档 §5 之外的批次材料 / 变更记录 | 一次性材料 + 历史流水 | 批次档承载（D2） |
| 工具描述文本 | 模型可见文本 | **提示词面 = 产品代码**——落点 `thincoder-core/tool-docs/*.md` |

## 9. 体量与拆分规划（R24a）

**实测行数**：本档 **114 行**（根层 · as-of 2026-09-15 批 8 实测）——**低于 300 行软线，无需拆分规划**。

## 变更记录

- 2026-09-15（**B 式迁移轮 · 第 1 批**）：建档——`thincoder-cli/docs/design/EDIT-HELPERS.md` 内容重建入基准层（旧档一字未改、原地作参照历史）；「现行为 → 改后」对照矩阵（左列已废）移入 §8.1 历史沿革；坐标改写为现状路径；批次材料 / 状态行 / 变更流水不并（§8）。
- 2026-09-15（**B 式迁移轮 · VSC 第 8 批 · 并入 · eng-designer**）：§6 增 **VSC 端差异块**（`lfOffsetToRaw` 六条编辑器路径差异 + `.gitattributes` 检出 EOL 约定）；§8.2「触发 = VSC 轮」行销项。
