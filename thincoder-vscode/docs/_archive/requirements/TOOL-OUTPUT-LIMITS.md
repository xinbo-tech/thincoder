# 工具输出长度限制调整 — 需求（VS Code 扩展）

> 归位注记：本档自 `docs/design/TOOL-OUTPUT-LIMITS-REQUIREMENTS.md` 归位入 `docs/requirements/`（文档体系各仓自持批 LEDGER-SELF-CONTAINED——纯需求档去 `-REQUIREMENTS` 后缀；对应 `-TUNING.md` 留 `docs/design/` 作设计档）。
> 板块：工具输出的超长**落盘阈值与显示层**（已实现专题，当前生效——本对文档是该机制的现行权威源）。
> 关联：`TOOL-OUTPUT-LIMITS-TUNING.md`（设计）、`README.md`（文档地图）。
> 状态：**已实现**（2026-08-24 首版 + 2026-09-04 预览保头保尾修订；marketplace / Open VSX 0.1.49 发布）。
> 跨端：CLI（thincoder）有同语义独立文档且**有独立 offload 实现**（`src/agent/helpers.mjs`（CLI 仓），已同改）；阈值/preview/advisor 截断/显示层两端各仓库独立实现——**须两端同步（lockstep）**，单边改动会造成行为漂移（评审 #1，2026-08-24）。

## 总体目标

把工具输出"超长落盘"的阈值从 16K 放大到 64K（65536 字符），落盘时的内联 preview 采用**保头保尾**构成，并让显示层全链路对齐 64K——减少大输出（尤其 advisor 评审、读大文件、grep 大仓库）被过早落盘/截断的频率，让模型与用户在合理范围内**直接看到含尾部**（结果/统计/错误）的内容，不必读回全文或重跑。

## 功能需求

- **FR1 · 64K 阈值**：作为用户，工具输出 ≤65536 字符**不落盘**、直接进上下文；>65536 才落盘并返回 preview + 文件路径。
  - 验收语义：`offloadToolResult` 阈值 65536——≤65536 原样返回，>65536 落盘。
- **FR2 · 预览保头保尾**：作为用户，超长（>64K）工具输出的内联 preview **含尾部**——模型/用户不读回全文、不重跑。
  - 验收语义：preview 构成 = **头 16K + 中间省略注 + 尾（预算余量）**，总长 ≤ 65536（预算：tail = 65536 − head − noteLen；两端均经 UTF-16 安全切片防代理对切开）。旧 preview 为 2K 纯头（`TOOL_RESULT_PREVIEW`）——已随 2026-09-04 双端修订删除。
- **FR3 · advisor 同宽（头尾双保）**：作为用户，advisor 评审循环里读到的工具结果放宽到 64K，评审不会被低阈值截断误判；超限结果**头尾双保**——尾部结论/裁决不被切。
  - 验收语义：advisor `MAX_RESULT_CHARS` = 65536；截断 = 头行 ~60% + 中段省略注 + 尾行余预算（2026-09-09 双端化——`truncateAdvisorResult`——评审尾部结论可见 + offset 续读提示在）。
- **FR4 · 实时面板同宽**：作为用户，面板上实时看到的工具结果与上下文一致到 64K。
  - 验收语义：panel `onToolResult` 发 webview 前 `slice(0, 65536)`。
- **FR5 · 历史页工具卡同宽**：作为用户，回看历史时工具卡内容与上下文一致到 64K。
  - 验收语义：`sendHistoryPage` 工具卡 `slice(0, 65536)`。
- **FR6 · 失败路径同口径**：落盘失败回退同用双端切片（头 + 省略注 + 尾，无路径提示），标注原文总长 + 落盘失败原因，不残留纯头截断。
- **FR7 · 行为兼容**：作为用户，落盘机制、文件路径指引、写时自清理、webview DOM 上限全部保留，仅阈值与 preview 构成变化。
  - 验收语义：落盘格式/清理/提示语路径格式不变；`webview/lib.js` `MAX_TOOL_OUTPUT = 64*1024` 已达标不动。
- **FR8 · read 读回双端（C 方案——2026-09-09 实现）**：作为用户，read 大文件/offload 产物返回头+尾——文件尾端结论直接可见，不再因看尾部读回大文件再炸。
  - 验收语义：补 default 2000 上限（`MAX_READ_LINES`——CLI parity）与窗口截断 total 尾注；窗口截断且文件 > 2000 行 → 头（请求窗口）+ `…(truncated: K lines in middle, use offset to continue)` + 真实尾 500 行；≤ 2000 行文件任何窗口旧路径零变化；重叠不重复 / K=0 无假省略注 / hashes 照常（`test/read-dual-end.test.mjs`——CLI 镜像）。

## 非功能标准

- **N1 一致性**：全链路同一阈值 `64 * 1024 = 65536`，不引入第二套"64K"。
- **N2 两端一致**：CLI 与 VS Code 扩展同一阈值、同一 preview 构成、同一 advisor 截断、同一实时显示上限。
- **N3 可测试**：阈值边界、preview 双端构成、advisor 截断、实时显示、历史页均有测试。
- **N4 可维护**：常量语义注释同步；不改动落盘保留期（`TMP_RETENTION_MS`）、写时自清理、失败回退、webview DOM 截断（`capText`）逻辑。
- **N5 零破坏**：阈值 64K / 落盘全文 / 清理 / 提示语路径格式不变。

## 变更记录

- 2026-08-24：首版（16K→64K 落盘阈值 + preview 2K→64K + advisor 12K→64K）。marketplace / Open VSX 0.1.49。
- 2026-09-04：预览保头保尾修订——preview 从"头 64K"改为"头 16K + 省略注 + 尾（预算余量）"，失败回退同用双端切片（详情见 TUNING.md）。
- 2026-09-08：文档重写为人类可读当前态（批 V3b）——合并双端修订为现行正文，折叠实现流水并更新模块落点。
- 2026-09-09：双端语义增补（DUAL-END-TRUNCATION）——FR3 advisor 截断头尾双保（评审尾
  结论不被切——60/40 + 省略注 + offset 提示）+ FR8 read 双端 C 方案（头 N + 注 + 尾 M——
  判别锚/形态/边沿见 `docs/design/TOOL-OUTPUT-LIMITS-TUNING.md` §2.9——CLI 同构锁步）。
