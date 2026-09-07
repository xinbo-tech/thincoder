# 编辑工具可靠性（行尾语义 + 候选提示 + 哈希健壮性）——需求

> 状态：**已实现**（CLI 与 VS Code 两端落地）。
> 对应工程：`thincoder`（CLI，`src/tools/file.mjs` + `patch.mjs`）、`thincoder-vscode`（`src/tools/file.mjs` + `more-file.mjs`）。设计细节/实现规范 = `EDIT-TOOL-EOL-DESIGN.md`；EOL 语义是编辑工具族权威（`TOOLS.md` §6 引用）。

## 1. 总体需求

修编辑工具（edit / apply_patch / hashline_edit / write）在 Windows 环境下的**行尾语义错乱**与**失败黑盒**——agent 在 CRLF 文件上频繁踩坑（`old_string not found`、写回混合行尾），被迫大量降级到 `execute`+node 旁路，削弱了"专用工具优先"的设计本意。

**背景实证**（已核实）：CRLF 文件经 edit/apply_patch 写回时丢行尾（normalize 后 join 写 LF 或写回混合）；`old_string not found` 无候选行提示（黑盒）；hashline_edit 在编码损坏文件上哈希全错（PowerShell 双重编码 → U+FFFD）。

## 2. 功能性需求

- **F1（行尾写回恢复）**：`edit` / `apply_patch` / **`hashline_edit`** 修改既有文件时，写回内容与**文件原行尾风格一致**（原 CRLF → CRLF 输出）——三个工具同写路径，必踩同款 bug。
- **F2（新建文件行尾）**：`write`/`apply_patch` 新建文件时，默认 LF；**同目录既有文件以 CRLF 为多数派时跟随 CRLF**（防仓库内行尾风格混杂）。**`write` 覆盖既有文件时同样遵循 F1**（原行尾恢复，"修改"与"新建"两条规则分清）。
- **F3（候选提示）**：`edit` 在 `old_string not found` 时，返回**相似度最高的 1–3 行**（行号 + 内容截断预览 + 相似度分），相似度低于阈值时不提示（防噪音）。
- **F4（编码损坏探测）**：`hashline_edit` 读入文件后若含 U+FFFD（替换符），在结果中警告"文件编码可能已损坏，hash 匹配可能不可靠，建议先修复编码"——不阻断操作，但明确提示。
- **F5（VS Code 编辑器路径 range 偏移坐标系错位）**：edit 在 VS Code 编辑器路径（doc 已打开）的 range 编辑，其定位偏移必须与 doc.positionAt 同坐标系——用 lfOffsetToRaw 把 LF 域偏移映射回 CRLF 原文偏移，再做 range 替换。含：
  - 非 replace_all：偏移映射（保留 range 编辑，否决整文档替换——undo 粒度/光标/折叠/大文件性能/并发冲突面）
  - replace_all：补 EOL 还原（不再静默丢 CRLF）
  - read(hashes=true)/hashline_edit 哈希域统一（stripBom + normalizeEOL，消除 CRLF 尾 \r 与 BOM 首行造成的哈希失配）
  - hashline_edit BOM 还原（磁盘写回带 BOM、编辑器分支不带，防双 BOM）
  - getOpenDoc win32 大小写不敏感（消除 split-brain）
  - insert_after normalizeEOL + 编辑器分支换行符按 fileEol（消除 $ 锚失配与混合 EOL 注入）

## 3. 非功能性需求

- **行为兼容**：LF 文件的行为不变（normalizeEOL 已是现状）；CRLF 文件的行为变化仅限写回行尾（diff 不再整行重写为 LF）。
- **性能**：相似度计算仅对失败路径触发，单文件（< 1MB）下候选计算 < 10ms 量级；不引入新依赖。
- **可测试性**：行尾语义/候选提示/编码探测均有单测（两端工程各自 tests 目录）。

## 4. 范围边界

- **做**：`edit` / `apply_patch` / `hashline_edit` / `write` 四个工具的行尾语义 + edit 候选提示 + hashline_edit 编码探测（两端各一份实现，行为对齐）。
- **不做**：bash 工具的 Windows 语义（PS 5.1 管道/`&&`/编码转义——独立大坑，另立项）；其他工具（read/write_image/grep 等）不动。
- **不改需求/不改接口签名**：工具参数不变（除可选新增），纯行为与提示改进。

## 5. 关键决策记录

| # | 决策 | 结论与理由 |
|---|---|---|
| D1 | 写回行尾 | **恢复文件原行尾风格**——normalizeEOL 用于匹配层（平台无关），写回时必须还原，否则 diff 整行重写、仓库行尾被污染。两端 apply_patch 的 `join("\n")` 是共同 bug 来源，统一改为按检测到的文件行尾 join。 |
| D2 | 新建文件行尾 | **默认 LF；同目录多数派为 CRLF 时跟随 CRLF**——新建没有"原行尾"可遵循，默认 Unix LF 是新文件惯例，但已存在的 CRLF 仓库里新文件应入乡随俗。实现：取目录下最多 20 个文件统计行尾多数派（目录空/无文件 → LF）。 |
| D3 | 候选提示算法 | **最长公共子串相似度（行级）**——对 old_string 与每行算 LCS 长度 / max(len)，取 top 3（阈值 ≥ 0.5）；Levenshtein 距离在行级太贵且对长 old_string 语义差。候选返回含行号+前 80 字符预览+相似度百分数。 |
| D4 | 编码探测 | **U+FFFD 存在即警告**——U+FFFD 是 UTF-8 解码失败的标准替换符，出现即说明文件不是干净 UTF-8。警告写进返回文本，不阻断。 |
| D5 | 两端一致性 | CLI 与 VS Code **同一套语义各自实现**（两端代码是平行分支非共享）——行为规则一致，代码各自落地，各写各的测试。VS Code 的 edit 行尾恢复已正确，只需补 apply_patch + 候选提示 + 探测；CLI 三处都补。 |

## 变更记录

- 2026-09-07：格式债清理——批量档案重写为当前态；F5 并入 §2（已实现）。
- 2026-08-28：F5（VS Code 编辑器路径 range 偏移坐标系错位，会诊 4 家一致确认）——落需求口径。
- 2026-08-25~26：需求澄清与实证（thinworker S1 真机使用走查）。
- 2026-08-26：设计定稿，两端落地实现。
