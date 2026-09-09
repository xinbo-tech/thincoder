# 快修批 2：MODEL-400 裁断项 + git pathspec（QUICKFIX-BATCH-2）

> 板块：provider 克隆防御 + git 工具面（双端）。权威源：MODEL-400-FIX（已交付）+ git.mjs。
> 状态：**设计待评审**——2026-09-09 落档（MODEL-400 交付裁断项 + git 工具缺陷勘察——根因齐）。需求：TODO MODEL-400 交付裁断项 + git 工具 commit pathspec 完善（用户裁批 2 快修落地）。

---

## 需求

- **总体目标**：两个小修——① MODEL-400 交付遗留裁断项（VSC byName 镜像 + F-2a 跨渠道语义）② git 工具 commit pathspec 支持（并行批混扫根治——commit --only 原子语义）。
- **功能性**：
  - F-1（MODEL-400 裁断 ①）VSC byName 克隆镜像：VSC 子代理 byName（裸渠道名）克隆路径补 model 重派生（对齐 CLI F-2c——models[0] ?? parent.model——现 F-1 断言兜住但补镜像更净）
  - F-2（MODEL-400 裁断 ②）F-2a 跨渠道语义修正：advisor cfg.provider=命中渠道但无 cfg.model 时——现用主 provider.model（发别家端点 = 403 险）→ 改用**命中渠道 models[0]**（别家渠道自己的候选首——比主 model 语义正确——跨渠道场景）
  - F-3（git pathspec）git 工具 commit 完善：path 参数给定 → `git commit --only <path> -m`（只提交列文件——忽略索引他批——并行批原子）——无 path → 保留现行为（add -A + commit——单代理语义）
  - **范围边界**：MODEL-400 主修已交付不重开——只补两裁断点；git 工具只改 commit 动作——add/其他动作不动。

## 设计（根因已勘察——照做勿自行解释）

### 1. F-1 VSC byName 镜像（对齐 CLI F-2c）
- VSC subagent.mjs:119-120 byName 克隆（resolveChildProvider 同族——VSC 子代理 provider 解析）——`{...渠道}` → `{...渠道, model: 渠道.models?.[0] ?? parent.provider.model}`（裸渠道名取候选首）
- 测试：VSC 裸渠道名 byName → models[0]（provider-model-guard.test.mjs 补）

### 2. F-2 F-2a 跨渠道语义（CLI run.mjs + VSC provider.mjs）
- 现：`cfg.model ? {...provider, model:cfg.model} : {...provider, model: provider.model ?? 主 provider.model}`——跨渠道（cfg.provider≠主渠道且无 cfg.model）→ 主 model 上别家端点
- 改：无 cfg.model 分支 → `{...provider, model: provider.model ?? 命中渠道.models?.[0]}`（**命中渠道候选首**——非主 provider model——渠道自己的模型发自己端点——跨渠道安全）
- 测试：跨渠道场景（cfg.provider=glm 无 cfg.model → glm.models[0] 非主 model）——同渠道不回归（主渠道无 cfg.model → 主渠道 models[0]）

### 3. F-3 git commit pathspec（src/tools/git.mjs:150-174）
- path 给定：`args.path.split(/\s+/)` → `runGitStrict(cwd, ["commit", "--only", ...paths, "-m", args.message])`（--only = 从工作树取列文件提交——忽略索引他批——原子）——不再先 add -A/不依赖索引
- 无 path：保留现行为（add -A → commit——单代理全量提交）
- 测试：commit --only 只提交列文件（索引有他批 pre-staged 也不混入）——path 多文件空格分隔——无 path 回归（add -A 全量）

## 受影响文件（双端）

| 文件 | 端 | 改动 |
|---|---|---|
| src/advisor/run.mjs | CLI | F-2 跨渠道 models[0] |
| src/agent-tools/subagent-async.mjs | CLI | （CLI F-2c 已交付——不动） |
| src/tools/git.mjs | CLI | F-3 commit --only |
| VSC subagent.mjs（byName 面） | VSC | F-1 镜像 |
| src/advisor/provider.mjs | VSC | F-2 镜像 |
| test/（provider-model-guard 补 + git commit pathspec） | 双端 | 新 |

## 用例表

| 用例 | 输入 | 预期输出 |
|---|---|---|
| F-1 VSC byName | 裸渠道名 subagent 克隆 | model = 渠道 models[0]——F-1 |
| F-2 跨渠道 | cfg.provider=glm 无 cfg.model | model = glm.models[0]（非主 provider model——自己端点安全）——F-2 |
| F-2 同渠道 | cfg.provider=主渠道无 cfg.model | model = 主渠道 models[0]——不回归——F-2 |
| F-3 commit --only | path 给定 + 索引有他批 staged | 只提交列文件——他批不混入——F-3 |
| F-3 无 path | 无 path | add -A 全量提交——保留行为——F-3 |

## 验收

- AC-1 VSC byName model 重派生（镜像 CLI F-2c——测试绿）
- AC-2 F-2a 跨渠道安全（命中渠道 models[0]——同渠道不回归——测试绿）
- AC-3 git commit --only（path 原子——他批不混入——测试绿）
- AC-4 双端 npm test 快层零回归
- 红线：MODEL-400 主修不重开；git 工具 add/其他动作零动

## 变更记录
- 2026-09-09：落档（MODEL-400 交付裁断项 ①VSC byName ②F-2a 跨渠道 + git.mjs:150-174 缺陷勘察——commit 无 path → add -A 全量暂存 + commit 无 pathspec 提交整个索引——双层混扫源——用户裁批 2 快修）。
