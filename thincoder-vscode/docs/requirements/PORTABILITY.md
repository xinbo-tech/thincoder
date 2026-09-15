# 可移植性（PORTABILITY）— 需求

> 板块：可移植性——工程模式机制在**任意用户项目**上的可用性（不假定项目形如本产品自研仓）。需求层文档（`docs/requirements/`）。
> 定位：本仓机制实况登记——分类权威 `src/conventions.mjs`（227 行；W4 已迁核——现体 `thincoder-core/conventions.mjs`）；评审注入面 `src/advisor/project-context.mjs`（199 行）；部分承载 = `docs/design/PORTABILITY.md`（VSC 镜像面设计）。
> 对位注记：与对端同名需求档 `PORTABILITY（CLI 仓·需求）`（需求组 FR10–FR15）**语义同源、本端原文自持**；两实现面各自独立。
> 状态：**现行**。

## 1. 总体需求

本仓（VS Code 扩展面）承载与对端同一套工程模式机制。用户在**任意项目**（任意语言 / 目录布局 / 文档约定 / 有无 git）里使用时，
机制不得静默失效：

- 不得假定项目约定（文档布局 / 命名 / 构建 / 测试方式）；
- 凡需要项目约定处，由**项目自述 / 声明**提供；
- 缺失时**降级可见**——写进评审消息 / 工具反馈 / 索引提示，不得静默跳过。

范围边界：本档只承载本仓需求；对端 FR10–FR15 的正文住对端档（语义同源参照、不重述——D2 单一权威源）。

## 2. 功能性需求

| # | 需求 | 判定句（可机器验证——证据均为本仓实测） |
|---|---|---|
| F1 | 分类判据单一权威 | `src/conventions.mjs`（W4 已迁核——现体 `thincoder-core/conventions.mjs`）为唯一裁判实现（`classifyPath` `:76` / `isCodePath` `:85` / `isDocPath` `:91`）；全仓**零分散副本**（组件式 / 锚定式正则副本、`docs/` 前缀判据副本零命中——机判式见 `docs/design/PORTABILITY.md` AC-V01；该判据面已退场（整删——删除记录 = `TESTING.md` §8.1）） |
| F2 | 项目约定可声明 | 声明文件 = `.thincoder/conventions.json`（`src/conventions.mjs:34`；W4 已迁核——现体 `thincoder-core/conventions.mjs`）；`codePaths` 声明替换默认、`index.*Extensions` 追加入并集；损坏 / 类型错 → 回退默认 + 警告 + 不崩（`src/conventions.mjs:194-220`） |
| F3 | 嵌套布局不漏判 | 段匹配非锚定、大小写不敏感、`/` 与 `\` 通吃——`packages/foo/src/x.md` 判 code（分类优先级 = 代码段 > temp > 文档扩展名 > code） |
| F4 | 评审注入降级可见 | 降级句常量四句在位（`src/advisor/project-context.mjs:35` / `:39` / `:40` / `:41`）；缺 AGENTS.md / 地图 / 标准文档 / git 时各注入对应句、从不静默——`injectProjectGuide` `:91` · `injectDocumentMap` `:138` · `injectProjectStandards` `:176` · `messages.mjs:115` |
| F5 | 索引面可声明、未列入可见 | 扩展名表 + 声明并集（`src/index-discover.mjs:17` / `:24` / `:126` / `:135`）；构建返回 `unlistedExts`（`src/indexer.mjs:113`）+ 面板提示行（`src/extension/panel-index.mjs:171`） |
| F6 | 非 git 项目行为有定义 | 索引：无 git → 全量 walk + per-file mtime 回退（`src/indexer.mjs:185-186` / `:241`）；评审：`NO_GIT_NOTICE` 降级句、评审照常 |
| F7 | 门禁面同源 | 工程写门禁按声明分类判定（`src/agent/tool-gates.mjs:89-91`）——不以 `src/` 硬编码 / `docs/` 前缀放行 |
| F8 | 提示词面不假定本仓形态 | 提示词内指令性引用零本仓指涉（机判面 = `docs/design/PORTABILITY.md` AC-V07——「本产品自研仓 =」标注形态除外） |

## 3. 非功能性需求

| # | 维度 | 标准（含度量） |
|---|---|---|
| N1 | 零假阳 | 默认判据（`src` 为代码面）对既有项目行为与修复前一致——专项用例零误报 + 全量回归全绿 |
| N2 | 降级不崩溃 | 声明损坏 / 不可读 → 默认 + `console.warn` + `logEvent`（不抛）；注入缺失 → 降级句（不抛） |
| N3 | 全接线 | 消费点逐处换源（评审 / 门禁 / 索引 / 提示词四族）——「修一处漏三处」在用例面反证 |
| N4 | 测试面 | 专项用例三档在位且快层全绿：`test/portability-vsc-classification.test.mjs` · `test/portability-vsc-advisor-context.test.mjs` · `test/portability-vsc-index.test.mjs` |

## 4. 范围边界（不做）

- 不重述对端 FR10–FR15 正文（语义同源参照——`PORTABILITY（CLI 仓·需求）`）。
- 不做对端 `/eng` TUI 门禁的同位物（本端无该命令；差异已登记在案）。
- 不做文件系统沙箱 / 目录白名单（安全模型见本仓 `TOOLS.md`——信任模型 + 审批 + 快照）。
- 不建本仓自用 `.thincoder/conventions.json`（默认判据对本仓即正确——开项留父侧酌定）。

## 5. 变更记录

- 2026-09-12：建档（需求树逐档成套轮 B13 建档实施 C 轮——异层者建档；内容 = 既有机制实况登记，零新需求语义）。
