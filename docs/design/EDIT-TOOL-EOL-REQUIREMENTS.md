# 编辑工具可靠性（行尾语义 + 候选提示 + 哈希健壮性）

> 状态：需求已澄清（2026-08-26，基于 agent 真实使用走查的痛点实证），设计定稿，待评审。
> 对应工程：`thincoder`（CLI，`src/tools/file.mjs` + `patch.mjs`）、`thincoder-vscode`（`src/tools/file.mjs` + `more-file.mjs`）。

## 1. 总体需求

修编辑工具（edit / apply_patch / hashline_edit / write）在 Windows 环境下的**行尾语义错乱**与**失败黑盒**——agent 在 CRLF 文件上频繁踩坑（`old_string not found`、写回混合行尾），被迫大量降级到 `execute`+node 旁路，削弱了"专用工具优先"的设计本意。

## 2. 背景与问题实证（走查记录，2026-08-25~26 thinworker S1 真机使用）

| # | 痛点 | 实证 |
|---|---|---|
| P1 | `edit`/`apply_patch` 在 CRLF 文件上匹配不稳 + **写回丢行尾**（CRLF 输入 → LF 输出） | 实验：纯 CRLF 文件经 edit 后变 3 CRLF + 3 裸 LF 混杂（CLI 版 edit 把 normalize 后的 LF 直接写回）；两端 apply_patch 均 `lines.join("\n")` 丢 CRLF |
| P2 | `old_string not found` 是黑盒 | 每次失败 agent 只能 `read` 对原文猜转义，无候选行提示 |
| P3 | `hashline_edit` 在**编码已损坏**文件上哈希全错 | PowerShell 写坏 UTF-8（双重编码 → U+FFFD）后，行哈希与实际内容不符，该工具完全不可用 |

**两端实现现状**（已核实，2026-08-26）：
- CLI `file.mjs`：edit 写回 `writeFile(abs, updated)`——normalizeEOL 后**不恢复**原行尾；失败仅给 searched 前缀提示。
- CLI `patch.mjs`：hunk 应用有 EOL 感知（`const eol = raw.includes("\r\n")`），但拼接 `lines.join("\n")`——**写回丢 CRLF**。
- VS Code `file.mjs`：edit 的**磁盘写回**已做 `fileEol` 检测 + 写回恢复（正确）；但**编辑器路径（doc 打开）的 range 编辑有偏移坐标系错位**——2026-08-28 发现，见 F5。
- VS Code `more-file.mjs`：apply_patch 有 EOL 感知（`op.text + cr`）但 `lines.join("\n")`——**同样丢 CRLF**。
- 两端 `write`：直接写参数字符串，无行尾语义（新建文件该用什么行尾无规则）。

## 3. 功能性需求（业务故事）

- **F1（行尾写回恢复）**：`edit` / `apply_patch` / **`hashline_edit`** 修改既有文件时，写回内容与**文件原行尾风格一致**（原 CRLF → CRLF 输出）——三个工具同写路径，必踩同款 bug；hashline_edit 一并纳入（评审 finding #2）。
- **F2（新建文件行尾）**：`write`/`apply_patch` 新建文件时，默认 LF；**同目录既有文件以 CRLF 为多数派时跟随 CRLF**（防仓库内行尾风格混杂）。**`write` 覆盖既有文件时同样遵循 F1**（原行尾恢复，评审 finding #3——"修改"与"新建"两条规则分清）。
- **F3（候选提示）**：`edit` 在 `old_string not found` 时，返回**相似度最高的 1–3 行**（行号 + 内容截断预览 + 相似度分），相似度低于阈值时不提示（防噪音）。
- **F4（编码损坏探测）**：`hashline_edit` 读入文件后若含 U+FFFD（替换符），在结果中警告"文件编码可能已损坏，hash 匹配可能不可靠，建议先修复编码"——不阻断操作，但明确提示。

## 4. 非功能性需求

- **行为兼容**：LF 文件的行为不变（normalizeEOL 已是现状）；CRLF 文件的行为变化仅限写回行尾（diff 不再整行重写为 LF）。
- **性能**：相似度计算仅对失败路径触发，单文件（< 1MB）下候选计算 < 10ms 量级；不引入新依赖。
- **可测试性**：行尾语义/候选提示/编码探测均有单测（两端工程各自 tests 目录）。

## 5. 范围边界

- **做**：`edit` / `apply_patch` / `hashline_edit` / `write` 四个工具的行尾语义 + edit 候选提示 + hashline_edit 编码探测（两端各一份实现，行为对齐）。
- **不做**：bash 工具的 Windows 语义（PS 5.1 管道/`&&`/编码转义——独立大坑，另立项）；其他工具（read/write_image/grep 等）不动。
- **不改需求/不改接口签名**：工具参数不变（除可选新增），纯行为与提示改进。

## 6. 关键决策记录

| # | 决策 | 结论与理由 |
|---|---|---|
| D1 | 写回行尾 | **恢复文件原行尾风格**（2026-08-26 用户确认方向）——normalizeEOL 用于匹配层（平台无关），写回时必须还原，否则 diff 整行重写、仓库行尾被污染。两端 apply_patch 的 `join("\n")` 是共同 bug 来源，统一改为按检测到的文件行尾 join。 |
| D2 | 新建文件行尾 | **默认 LF；同目录多数派为 CRLF 时跟随 CRLF**（用户确认方向）——新建没有"原行尾"可遵循，默认 Unix LF 是新文件惯例，但已存在的 CRLF 仓库里新文件应入乡随俗，避免同一目录内 LF/CRLF 混杂。实现：取目录下最多 20 个文件统计行尾多数派（目录空/无文件 → LF）。 |
| D3 | 候选提示算法 | **最长公共子串相似度（行级）**——对 old_string 与每行算 LCS 长度 / max(len)，取 top 3（阈值 ≥ 0.5）；Levenshtein 距离在行级太贵且对长 old_string 语义差，LCS 更贴"相似一行"的直觉。候选返回含行号+前 80 字符预览+相似度百分数。 |
| D4 | 编码探测 | **U+FFFD 存在即警告**（用户确认）——U+FFFD 是 UTF-8 解码失败的标准替换符，出现即说明文件不是干净 UTF-8（被别的编码写过或双重编码过）。警告写进返回文本（`⚠ file contains U+FFFD — encoding may be corrupted`），不阻断。 |
| D5 | 两端一致性 | CLI 与 VS Code **同一套语义各自实现**（两端代码是平行分支非共享）——行为规则一致，代码各自落地，各写各的测试。VS Code 的 edit 行尾恢复已正确，只需补 apply_patch + 候选提示 + 探测；CLI 三处都补。 |

## 变更段 F5：VS Code 编辑器路径 range 偏移坐标系错位（2026-08-28）

> 会诊 4 家一致确认。设计细节见 EDIT-TOOL-EOL-DESIGN.md §7，本处只落需求口径。

**F5**：edit 在 VS Code 编辑器路径（doc 已打开）的 range 编辑，其定位偏移必须与 doc.positionAt 同坐标系——用 lfOffsetToRaw 把 LF 域偏移映射回 CRLF 原文偏移，再做 range 替换。含：
- 非 replace_all：偏移映射（保留 range 编辑，否决整文档替换——undo 粒度/光标/折叠/大文件性能/并发冲突面）；
- replace_all：补 EOL 还原（不再静默丢 CRLF）；
- read(hashes=true)/hashline_edit 哈希域统一（stripBom + normalizeEOL，消除 CRLF 尾 \r 与 BOM 首行造成的哈希失配）；
- hashline_edit BOM 还原（磁盘写回带 BOM、编辑器分支不带，防双 BOM）；
- getOpenDoc win32 大小写不敏感（消除 split-brain）；
- insert_after normalizeEOL + 编辑器分支换行符按 fileEol（消除 $ 锚失配与混合 EOL 注入）。
