# 工作区约定：技能 · 规则 · 同伴 · 台账（WORKSPACE）· 核心统一子系统档

> 板块归属 = **核心统一**（phase 2——「一个核 + 两个薄壳」）；本档 = 该板块的**子系统设计档**。
> 工作流档 = `docs/core/design/CORE-UNIFICATION.md`（事实基线 / 核形态与消费契约 / 方案选型 / S0 方法 / 分段执行 S0a–S3 / 关键决策 / 验收回指 / 裁定 A1–A8 / 契约兼容策略 / 测试用例）——**本档不复制**。
> 需求层 = `docs/core/requirements/CORE-UNIFICATION.md`（F1–F13 / N1–N8）。
> **列定义**（裁决行各列含义）→ `CORE-UNIFICATION.md` §2.5；**须裁条目的分组口径与四要素提交形式** → 该档 §2.5.1。

## 1. 归属与范围（自本档行内容的路径归纳）

| 面 | CLI 档 | VSC 档 |
|---|---|---|
| 技能发现 | `thincoder-core/skills.mjs` | `thincoder-vscode/src/extension/skills.mjs` |
| 规则发现（面定义 = §2.3） | `thincoder-core/rules.mjs`（stream 规则 + `.cursor/rules` 读取面） | 读取 ∕ 分类 ∕ 匹配 ∕ JIT 面全入核，VSC 经核件直取 |
| 同伴实例 / 域 | `thincoder-core/peer-instances.mjs` · `thincoder-core/peer-domains.mjs` | `thincoder-vscode/src/extension/peer-instances.mjs` · `thincoder-vscode/src/extension/peer-domains.mjs` |
| 台账规则 / 路径约定 | 已迁核——经 `@thincoder/core/{ledger,conventions,escape}.mjs` 引用 | 已迁核——同引核单源 |
| 台账展示面 | `thincoder-cli/src/tui/ledger-surface.mjs` | 端壳缝——核机制 `@thincoder/core/ledger-surface.mjs` + 面板推送供值 |
| 端特有运维 / 交互面（粗粒度覆盖） | `thincoder-cli/src/{crash-reports,upgrade,completions,heap-watch,distill}.mjs` · `thincoder-cli/src/tui/{update-notice,mouse,fold-block}.mjs` | 无对位（VSC 走 webview / 宿主能力）——`tui/mouse.mjs` 承载评审 ⏹ 点击取消，VSC 对位 = webview 点击 |

## 2. 核模块裁决行

### 2.1 同路径对

| # | 相对路径 / 对位 | 面 | 相似度 · 逐字节 | 分类 | 目标 | 端差处置 | 前提校验 | 须用户裁 | 归属段 |
|---|---|---|---|---|---|---|---|---|---|
| 71 | `ledger.mjs` | 同路径 | 0.8595 · 异 | ② | 进核 | 融合：取一侧、逐字随迁（函数体逐行同构） | 分叉 ＝ `configDir` 取词与注释出处编号（VSC 引 `config-io.mjs`；CLI 引 PORTABILITY FR12）；前提 ＝ 无（纯组织） | — | S1（建核补齐） |
| 72 | `conventions.mjs` | 同路径 | 0.8242 · 异 | ② | 进核 | 融合：取一侧、逐字随迁 | 分叉 ＝ 头注释出处编号（CLI 引 PORTABILITY FR12/PO-10 / VSC 引 VP-10）；`classifyPath` 次序与 `loadConventions` 语义逐字等价 | — | S1（建核补齐） |
| 73 | `escape.mjs` | 同路径 | 0.7840 · 异 | ② | 进核 | 融合：取一侧（替换字符写法归一为 U+FFFD） | 分叉 ＝ 写法与注释（VSC 标 v5 / CLI parity）；算法逐字等价；前提 ＝ 无（纯写法） | — | S1（建核补齐） |

### 2.2 语义对位遍行（同职责但相对路径不同）

| # | 对位（CLI ↔ VSC） | 分类 | 端差处置 | 前提校验 | 须用户裁 | 归属段 |
|---|---|---|---|---|---|---|
| 170 | `thincoder-core/skills.mjs` ↔ `thincoder-vscode/src/extension/skills.mjs` | ② | 融合：取一侧（发现规则两端同构：扁平 + `SKILL.md` / 排序 / 项目层优先）+ fs 面（同步 / 异步）按端注入 | 分叉 ＝ 目录 + loader 形态（VSC 头注自述「同构语义…语义同源、实现自持」`:3-5`）⇒ 前提成立 ⇒ **已收编：VSC 档 = 核单源转口（`loadSkillsSync` ∕ `readSkillSync` ∕ `formatSkillListing` 三名单源——消费面零改）** | — | S1（建核补齐） |
| 171 | `thincoder-core/rules.mjs` ↔ `thincoder-vscode/src/extension/rules.mjs`（已删） | ② | **已消解**：读取面并入核（核 = stream + `.cursor/rules`）；VSC 经核件直取 | 分叉 ＝ 目录归属 ⇒ 以上提消解（非「取一侧」） | — | 已落（核 **261** · VSC 两档 **0**） |
| 172 | `src/peer-instances.mjs` ↔ `thincoder-vscode/src/extension/peer-instances.mjs` | ② | 融合：取一侧 + 端判别面按端注入 | 分叉 ＝ 目录 + 端标记判别（VSC 头注自述「VS Code 镜像」`:2`）⇒ 前提成立 | — | S1（建核补齐） |
| 173 | `src/peer-domains.mjs` ↔ `thincoder-vscode/src/extension/peer-domains.mjs` | ② | 融合：取一侧 | 分叉 ＝ 目录（VSC 头注自述「VS Code 镜像」`:3`）⇒ 前提成立 | — | S1（建核补齐） |
| 174 | `thincoder-cli/src/tui/ledger-surface.mjs` ↔ `thincoder-vscode/src/extension/ledger-surface.mjs` | ② | 融合：取一侧 + 渲染面按端注入 | 分叉 ＝ 目录（CLI 住 `tui/` / VSC 住 `extension/`）；台账规则两端逐字同（`ledger.mjs` 同路径 #71）⇒ 前提成立 | — | S1（建核补齐） |

### 2.3 规则发现面（**权威定义**）

**一线程一语义**（消「同名不同物」——承 U1 裁定选项②）：

- **stream 规则** —— 目录 `.thincoder/rules/*.md`；frontmatter `pattern` / `action`（`abort` | `warn`）/ `repeat`。
  语义 = 模型输出流上按 `pattern` 触发：`abort` ⇒ 中断 + 注入规则消息 + 同上下文重入；`warn` ⇒ 回合后去重注入提醒。
  发现 = 核 `thincoder-core/rules.mjs` `discoverRules`；**两端生效**——装配期各自并入 `agent.streamRules`（CLI `thincoder-cli/src/cli/make-agent.mjs` ∥ VSC `thincoder-vscode/src/agent/setup.mjs`）。
- **作用域规则（三端同面）** —— 目录 `.cursor/rules/*.md` / `*.mdc`；frontmatter `globs` / `alwaysApply` / `description`。
  读取 = 核 `thincoder-core/rules.mjs`（`matchesGlob` ∕ `simpleGlobMatch` 入核单源）；**三分类 = 按序判定（互斥）**：
  ① `alwaysApply: true` ⇒ **常驻集**（**先判**——`globs` 同在不改分类）；② 有 `globs` ⇒ **作用域集** = 命中路径的工具派发前置提醒（会话级去重）；

  ③ 无 `globs` 且无 `description` ⇒ **常驻集**；④ 仅 `description`（Cursor 的 agent-requested 语义）⇒ **不注入**（本端无该机制——登记 · 边界）。
  常驻集落点 = [4] 层尾块；desk ∕ CLI 端同得该目录两面（尾块 + 作用域 JIT——核单源取得）。
- **消费单源** = 核 provider `chat()`（`streamRules` + `firedPatterns`）——两端同引；abort / warn 两分支同式。

## 3. 须用户裁条目

**本子系统无 §2.5.1 行**（各行差异仅组织面 / 目录归属 / 注释出处，端差以注入承载）。

## 4. 对外契约影响

**本子系统无 §2.12.2 处置表行**。
