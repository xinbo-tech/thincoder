# 批 1：工具/代码面四小修（QUICKFIX-BATCH-3）

> 板块：跨面快修（CLI+VSC——工具缺陷镜像 + 注释债 + 代码洁）。权威源：QUICKFIX-BATCH-2（CLI F-3 git commit --only 处置）+ POOL-CONFIG-UNIFIED（§24→§11.1/§11.2 映射权威——F-7）+ RESIZE-MOUSE-LEAK-FIX 交付建议 + IMAGE-DOWNGRADE-VISION 跟进项。
> 状态：**设计待评审（重发定稿版）**——2026-09-09 落档（10 条评估分批——批 1 = **四小修**——L255（VSC git
>   L204-207 granular add + 整索引实证）+ L216（**CLI src 29 处 + VSC src 39 处 = 68 处实证**——远超初勘 8+）
>   + L260（tui-lifecycle L20/L84 字面量三源核过）+ L250②（image-handler L77 maxTurns 10 固定实证——8+ 图
>   超载面成立）——首评对象漂移未签 token——9 findings 全修正后重发）。需求：TODO L255 + L216 + L260 + L250②
>   （用户裁推进——实证过的才入批）。

---

## 需求

- **总体目标**：四小修打包——① VSC git commit pathspec 镜像（CLI F-3 已修——VSC 同款缺陷实证）② §24→§11
  旧锚双端注释清理（锚迁移残留——实证 68 处）③ CLEANUP_REST 常量收拢（恢复序列三源字面量）④ image-handler
  maxTurns 伸缩（大贴图落 fallback 面——实证）。
- **功能性**：
  - F-1（VSC git commit 镜像——L255）VSC src/tools/git.mjs（392 现）commit case（L200-207——实证：
    granular add 后整索引 commit——同 CLI 旧版缺陷）——镜像 CLI F-3 交付形态：path 给定 →
    `commit --only -m msg -- <paths>`（`--` 分隔——原子——不再先 add——他批 staged 不混入）——
    空/空白 path 明确错误——无 path 保留 add -A 现行为
  - F-2（§24→§11 旧锚清理——L216）双端 src 注释 §24 旧锚残留（实证 CLI 29 处 19 文件 + VSC 39 处 13 文件）
    → 新锚——**映射权威 = POOL-CONFIG-UNIFIED F-7（§24→§11.1/§11.2 现行节号粒度——非裸 §11——R13/R14 类
    引用落 §11.1/§11.2——D-24x 决策锚按其现行家）**——逐处核上下文——清理后 grep §24 src 零残留
    （记史/历史文档不换）
  - F-3（CLEANUP_REST 常量——L260）CLI tui-lifecycle 恢复序列三源（writeCleanupSequence 字面量 L20 +
    createExitCleanup 余部 L84 + 测试第三份）→ **CLEANUP_REST 常量单源**（tui-lifecycle 导出——cleanup 余部与
    测试共用——writeCleanupSequence 引用拼接）——消除漂移面
  - F-4（maxTurns 伸缩——L250②）VSC image-handler runVisionReader（L77 实证 maxTurns 10 固定——L76 task =
    paths 每图一行——8+ 图时 10 turns 不够）——**纯函数导出（评审 #6 seam）：`visionMaxTurns(n) = 2 + n*2`**
    ——调用点 `maxTurns: visionMaxTurns(paths.length)`——1 图 4 / 5 图 12
  - **范围边界**：VSC git 只镜像 commit case（add/其他动作零动）；§24 清理只动注释文本（代码逻辑零动——锚是
    注释引用）；CLEANUP_REST 只收拢字面量（序列内容零变——测试字节锁保持）；F-4 只改 maxTurns 计算（超时/
    fallback 逻辑零动）；历史文档/CHANGELOG 记史不换。

## 设计（实证 / 勘察实证——照做勿自行解释）

### 1. F-1 VSC git commit 镜像（thincoder-vscode/src/tools/git.mjs——392 现）
- commit case（L200-207——实证现形态：path 给定 granular `add -- <paths>`（L204-205）+ 整索引
  `commit -m`（L207）——同 CLI 旧版缺陷）
- 改（评审 #2——向量逐字对齐 CLI 交付码 src/tools/git.mjs:161）：
  - path 给定：`args.path.trim().split(/\s+/)` → `runGitStrict(cwd, ["commit", "--only", "-m", args.message, "--", ...paths])`
    ——`--` 分隔（防 dash 开头 path）——不再先 add——他批 staged 不混入——原子
  - 空/空白 path（trim 后空）→ 明确错误
  - 无 path → 现行为保留（add -A → commit）
- 描述层同步（评审 #3——模型经工具描述发现新能力——commit path 句加 "--only 原子——多 path 空格分隔"——
  CLI git.md 契约同口径）
- 测试（评审 #3——VSC 无 git 测试面——新文件）：test/git-commit-pathspec.test.mjs（新 ≤80——镜像 CLI 矩阵：
  --only 原子（他批 pre-staged 不混入）/ 多文件空格分隔 / 空 path 错误 / 无 path 回归 add -A）+ files.mjs
  登记（CLI 在案 a4f1255）

### 2. F-2 §24→§11 旧锚清理（双端——实证 68 处）
- 实测面（评审 #4 具名族）：CLI src 29 处（thincoder-core/advisor/messages.mjs:133、thincoder-core/advisor/run.mjs:15/418、`thincoder-core/advisor.mjs:269`、
  agent/completion.mjs:123、agent/dispatch.mjs:355、agent/record-results.mjs:99、agent/run-stages.mjs:166、
  thincoder-core/agent-tools/eng.mjs:37/55、thincoder-core/agent-tools/escalate-async.mjs:154、subagent-actions.mjs:107、subagent-run.mjs:39/55/83、
  subagent-scheduler.mjs:341/346、subagent.mjs:130/378、agent.mjs:69/70、tui/cmd-eng.mjs:51、mouse.mjs:202、
  `src/tui/subagent-panel.mjs:112`、suspension-drive.mjs:25/30/77/133、test/advisor-description.test.mjs:18（已退场——TEST-LIFECYCLE））+ VSC src
  39 处（advisor/main.mjs:94/105/111/123/163/213/260、thincoder-core/advisor/messages.mjs:50/78/88、thincoder-core/advisor/run.mjs:340/362/419、
  `src/agent/execute-tools.mjs:19`（VSC 仓）/249/410/428、run-stages.mjs:96/110/265、setup.mjs:216/238、thincoder-core/agent-tools/advisor.mjs:
  23/91/177/187/191/221、subagent-async.mjs:304/470、`src/agent-tools/subagent-escalate-async.mjs:4`（VSC 仓）、`src/agent-tools/subagent-escalate.mjs:16`（VSC 仓）、
  agent.mjs:24/110、`src/extension/panel-messages.mjs:230`（VSC 仓）、`src/extension/suspension.mjs:27`（VSC 仓；余行同））
- 逐处替换 + 逐处核上下文（§24 引用确指旧章才换——记史/历史文档不换）——映射粒度照 POOL-CONFIG-UNIFIED
  F-7（评审 #5——§11.1/§11.2——非裸 §11）
- 测试：test/prompts-async-guidance.test.mjs 或同族 doc 断言宿主（评审 #4 具名）——grep §24 双端 src 零残留
  （fail-when-present——scope = src——AC-2 措辞同步）

### 3. F-3 CLEANUP_REST 常量（CLI tui-lifecycle.mjs——87 现）
- 三源现状：writeCleanupSequence（L20——clearScreen+mouseOff+bracketedPasteOff+…+wrapOn 全串）+
  createExitCleanup 余部（L84——clearScreen+bracketedPasteOff+…+wrapOn——mouseOff 已单写先行）+ 测试字节锁
- 改：`export const CLEANUP_REST = ansi.bracketedPasteOff + ansi.keyboardPop + ansi.modifyOtherKeysOff +
  ansi.mainBuffer + ansi.showCursor + ansi.reset + ansi.wrapOn`（除 mouseOff 外的尾部共享段——评审 #8 注：
  常量内部 token 序不再被测试独立锁——依赖 ansi.mjs token 定义——实现时保证现测试绿的字节不变）
  - writeCleanupSequence（崩溃路径整包——不改序）= `ansi.clearScreen + ansi.mouseOff + CLEANUP_REST`
  - createExitCleanup 余部 = `ansi.clearScreen + CLEANUP_REST`
  - 测试断言引常量（tui-exit-cleanup.test.mjs）
- 测试：字节不变（现测试绿=零回归——一次验证 + ansi.mjs token 源锁）

### 4. F-4 maxTurns 伸缩（VSC image-handler.mjs——81 现）
- L77 实证：runVisionReader maxTurns 10 固定——L76 task = paths 每图一行任务——8+ 图时 10 turns 不够
  （每图 ≥1 read_image 回合 + 结果回合）
- 改（评审 #6 seam——纯函数导出可测）：`export function visionMaxTurns(pathCount) { return 2 + pathCount * 2 }`
  ——调用点 `maxTurns: visionMaxTurns(paths.length)`——1 图 4 / 5 图 12
- 测试：visionMaxTurns 纯函数断言（1 → 4 / 5 → 12——边界 0 → 2）——image-downgrade.test.mjs

## 受影响文件（双端）

| 文件 | 端 | 现行数 | 预计净变 | 改动 |
|---|---|---|---|---|
| src/tools/git.mjs | VSC | 392 | ≤+8 | F-1 commit --only 镜像 + 描述层同步 |
| test/git-commit-pathspec.test.mjs（评审 #3 新） | VSC | 新 | 新 ≤80 | F-1 原子/空 path/无 path 回归 + files.mjs 登记 |
| test/files.mjs（VSC 仓） | VSC | 既有 | +1 | F-1 测试登记 |
| src/（§24 残留族——CLI 29 处 19 文件 + VSC 39 处 13 文件——评审 #2 round2 数值校正） | 双端 | — | 各 -N | F-2 逐处替换 |
| test/advisor-description.test.mjs（评审 #2 round2 补行——枚举含 :18——替换目标；已退场：TEST-LIFECYCLE） | CLI | 既有 | ±1 | F-2 替换 |
| test/prompts-async-guidance.test.mjs（评审 #4 具名宿主） | 双端 | 既有 | +5 | F-2 §24 零残留断言 |
| src/tui/tui-lifecycle.mjs | CLI | 87 | ≤+4 | F-3 CLEANUP_REST |
| test/tui-exit-cleanup.test.mjs | CLI | 96 | ±2 | F-3 常量断言 |
| src/extension/image-handler.mjs（VSC 仓） | VSC | 81 | +3 | F-4 visionMaxTurns 导出 + 调用点 |
| test/image-downgrade.test.mjs（VSC 仓） | VSC | 120 | +5 | F-4 纯函数断言 |

## 用例表

| 用例 | 输入 | 预期输出 |
|---|---|---|
| F-1 path 给定 | commit + path | --only 原子（-- 分隔）——他批 staged 不混入——F-1 |
| F-1 空 path | 空白 path | 明确错误——F-1 |
| F-1 无 path | 无 path | add -A 保留——F-1 |
| F-2 替换 | §24 旧锚注释（68 处） | 新锚（F-7 粒度）——src grep 零残留——F-2 |
| F-3 常量 | cleanup 余部 + 测试 | 单源 CLEANUP_REST——字节不变——F-3 |
| F-4 伸缩 | visionMaxTurns(5) | 12——F-4 |
| F-4 边界 | visionMaxTurns(0) | 2——F-4 |

## 验收

- AC-1 VSC git commit --only（path 原子——空 path 错误——无 path 回归——测试绿）
- AC-2 §24 旧锚双端 src 零残留（grep——fail-when-present——scope = src——记史文档除外）
- AC-3 CLEANUP_REST 单源（cleanup 余部/测试共用——序列字节不变——测试绿）
- AC-4 visionMaxTurns 伸缩（1 → 4 / 5 → 12 / 0 → 2——测试）
- AC-5 双端 npm test 快层零回归
- 红线：VSC git 只 commit case；§24 只注释文本；CLEANUP_REST 序列字节零变；F-4 只 maxTurns 计算；历史文档/CHANGELOG 记史不换

## 变更记录
- 2026-09-09：评审 #2 round2 通过（token 已签发——9 findings 全 Fixed——新 2 🔵 已修：文件数 16/18 → 19/13
  校正 + test/advisor-description.test.mjs（已退场：TEST-LIFECYCLE）补受影响行——定稿版待实现）。
- 2026-09-09：落档（10 条评估分批——批 1 四小修——L255 VSC git commit 镜像（实证 L204-207）+ L216 §24 旧锚
  （**实证 68 处**——映射权威 POOL-CONFIG-UNIFIED F-7 §11.1/§11.2）+ L260 CLEANUP_REST（L20/L84 核过）+
  L250② maxTurns（L77 实证——visionMaxTurns 纯函数）——L183 已勾销（ACTIVITY-SPLIT 实证三文件终局）——L197
  过时（AGENTS.md 已重写——清扫无对象）——L180 无痛点不推——L190① picker note bug 实证（pickers L71 item
  不渲 note——L142 死数据）待入批 3——首评对象漂移未签 token——9 findings 修正重发）。
