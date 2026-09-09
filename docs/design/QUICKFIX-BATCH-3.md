# 批 1：工具/代码面四小修（QUICKFIX-BATCH-3）

> 板块：跨面快修（CLI+VSC——工具缺陷镜像 + 注释债 + 代码洁）。权威源：QUICKFIX-2（CLI F-3 git commit --only 先例）+ POOL-CONFIG（§24→§11 锚迁移）+ RESIZE 交付建议。
> 状态：**设计待评审**——2026-09-09 落档（10 条评估分批——批 1 = 核实通过三小修——L255 实证（L204-207 granular add + 整索引）+ L216 实证（L133 §24 D-24b）+ L260（L20/L84 字面量三源核过）——**L250②/L190/L268 未亲核——撤出批 1 待补勘察**）。需求：TODO L255 + L216 + L260（用户裁推进——评估后核实过的才入批）。

---

## 需求

- **总体目标**：三小修打包——① VSC git commit pathspec 镜像（CLI F-3 已修——VSC 同款缺陷实证）② §24→§11
  旧锚双端注释清理（锚迁移残留——实证）③ CLEANUP_REST 常量收拢（RESIZE 恢复序列三源字面量）。
- **功能性**：
  - F-1（VSC git commit 镜像——L255）VSC src/tools/git.mjs（392 现）commit case（L200-207）——CLI F-3 同款镜像：path 给定 → `commit --only -m msg -- <paths>`（原子——不再先 add 全量暂存——整索引提交缺陷同 CLI 旧版）——空/空白 path 明确错误——无 path 保留 add -A 现行为——与 CLI 逐字锚语义一致
  - F-2（§24→§11 旧锚清理——L216）双端 src + docs 注释/文本中 §24 旧锚残留 → §11 新锚（POOL-CONFIG 已迁移——注释未跟随）——grep §24 全仓清理——机械替换——清理后 grep §24 零残留（排除历史文档/CHANGELOG 记史）
  - F-3（CLEANUP_REST 常量——L260）CLI tui-lifecycle 恢复序列三源（writeCleanupSequence 字面量 + createExitCleanup 余部 + 测试第三份）→ **CLEANUP_REST 常量单源**（tui-lifecycle 导出——cleanup 余部与测试共用——writeCleanupSequence 引用拼接）——消除漂移面
  - **范围边界**：VSC git 只镜像 commit case（add/其他动作零动）；§24 清理只动注释/文档文本（代码逻辑零动
    ——锚是注释引用）；CLEANUP_REST 只收拢字面量（序列内容零变——测试字节锁保持）。

## 设计（先例/勘察落点——照做勿自行解释）

### 1. F-1 VSC git commit 镜像（thincoder-vscode/src/tools/git.mjs——392 现）
- commit case（L200-207——现 `runGitStrict(ctx.cwd, ["commit", "-m", args.message])` 整索引形态）——照 CLI QUICKFIX-2 F-3 逐字镜像：
  - path 给定：`args.path.trim().split(/\s+/)` → `runGitStrict(cwd, ["commit", "--only", ...paths, "-m", args.message])`（不再先 add——他批 staged 不混入）
  - 空/空白 path（trim 后空）→ 明确错误
  - 无 path → 现行为保留（add -A → commit）
- 注：VSC git.mjs 执行结构可能与 CLI 有差（ctx.cwd/描述层）——语义照 CLI——结构跟本文件

### 2. F-2 §24→§11 旧锚清理（双端）
- CLI src/ + VSC src/——grep `§24`（advisor/agent 族——勘察 CLI 8+ 处——双端数十处）——替换为 §11（POOL-CONFIG 锚迁移——§24 旧章号已并 §11）——**逐处核上下文**（§24 引用是否确指旧锚——非盲目替换——引用的是旧章则换——记史/历史文档不换）
- 测试：grep §24 断言零残留（双端 src——fail-when-present）

### 3. F-3 CLEANUP_REST 常量（CLI tui-lifecycle.mjs——87 现）
- 三源现状：writeCleanupSequence（L20——clearScreen+mouseOff+…+wrapOn 全串）+ createExitCleanup 余部
  （L84——clearScreen+bracketedPasteOff+…+wrapOn——mouseOff 已单写）+ 测试字节锁
  （tui-exit-cleanup.test.mjs 断言）
- 改（评审前设计裁定——CLEANUP_REST = 除 mouseOff 外的尾部共享段 bracketedPasteOff…wrapOn）：
  - writeCleanupSequence（崩溃路径整包——不改序）= `ansi.clearScreen + ansi.mouseOff + CLEANUP_REST`
  - createExitCleanup 余部（mouseOff 已单写先行）= `ansi.clearScreen + CLEANUP_REST`
  - 测试断言引常量——实现时按实际段结构定（工程选择——**保证序列字节不变——现测试绿=零回归**）
- 测试：字节不变断言保持（现测试绿=零回归）


## 受影响文件（双端）

| 文件 | 端 | 现行数 | 预计净变 | 改动 |
|---|---|---|---|---|
| src/tools/git.mjs | VSC | 392 | ≤+8 | F-1 commit --only 镜像 |
| src/（§24 残留行——advisor/agent 族） | 双端 | — | 各 -N | F-2 注释替换 |
| test/（§24 零残留断言） | 双端 | 既有 | +5 | F-2 |
| src/tui/tui-lifecycle.mjs | CLI | 87 | ≤+4 | F-3 CLEANUP_REST |
| test/tui-exit-cleanup.test.mjs | CLI | 96 | ±2 | F-3 常量断言 |

## 用例表

| 用例 | 输入 | 预期输出 |
|---|---|---|
| F-1 path 给定 | commit + path | --only 原子——他批 staged 不混入——F-1 |
| F-1 空 path | 空白 path | 明确错误——F-1 |
| F-1 无 path | 无 path | add -A 保留——F-1 |
| F-2 替换 | §24 旧锚注释 | §11——grep 零残留——F-2 |
| F-3 常量 | cleanup 余部 + 测试 | 单源 CLEANUP_REST——字节不变——F-3 |

## 验收

- AC-1 VSC git commit --only（path 原子——空 path 错误——无 path 回归——测试绿）
- AC-2 §24 旧锚双端零残留（grep——fail-when-present——记史文档除外）
- AC-3 CLEANUP_REST 单源（cleanup 余部/测试共用——序列字节不变——测试绿）
- AC-4 双端 npm test 快层零回归
- 红线：VSC git 只 commit case；§24 只注释文本；CLEANUP_REST 序列字节零变；历史文档/CHANGELOG 记史不换

## 变更记录
- 2026-09-09：落档（10 条评估分批——批 1 三小修：L255 VSC git commit 镜像（CLI F-3 先例——实证 L204-207 granular
  add + 整索引）+ L216 §24 旧锚（实证 CLI src/advisor/messages.mjs:133 §24 D-24b）+ L260 CLEANUP_REST
  （tui-lifecycle L20/L84 三源字面量核过）——**L250② maxTurns / L190 UI / L268 digest 扩面未亲核——撤出批 1
  待补勘察后重新评估**——L183 已勾销（ACTIVITY-SPLIT 头注实证三文件终局）——L197 过时（AGENTS.md 已重写
  干净版无地图段——清扫无对象关）——L180 无痛点不推）。
