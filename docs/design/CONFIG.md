# 配置系统（CONFIG）· 核心统一子系统档

> 板块归属 = **核心统一**（phase 2——「一个核 + 两个薄壳」）；本档 = 该板块的**子系统设计档**。
> 工作流档 = `docs/design/CORE-UNIFICATION.md`（事实基线 / 核形态与消费契约 / 方案选型 / S0 方法 / 分段执行 S0a–S3 / 关键决策 / 受影响文件总表 / 验收回指 / 裁定 A1–A8 / 契约兼容策略 / 测试用例）——**本档不复制**。
> 需求层 = `docs/requirements/CORE-UNIFICATION.md`（F1–F13 / N1–N8）。
> 建档：2026-09-13（**文档拆分轮**——自 `CORE-UNIFICATION.md` §2.5 / §2.5.1 / §2.12.1 / §2.12.2 **逐节搬入，只搬不改语义**；行号沿用原裁定表编号）。
> **列定义**（裁决行各列含义）→ `CORE-UNIFICATION.md` §2.5；**须裁条目的分组口径与四要素提交形式** → 该档 §2.5.1。

## 1. 归属与范围（自本档行内容的路径归纳）

| 面 | CLI 档 | VSC 档 |
|---|---|---|
| 装载器 / 默认值 | `thincoder-cli/src/config.mjs` | `thincoder-vscode/src/config-io.mjs` |
| 迁移 | `src/config-migrate.mjs` | `src/config-migrate.mjs` |
| 分段配置 | （内联于 `config.mjs`） | `src/config-presets.mjs` · `config-consult.mjs` · `config-mcp.mjs` · `embed-config.mjs` |
| 写盘面 / 面板 | `src/cli/`（TUI 侧） | `src/extension/settings-panel-write.mjs` · `extension/settings.mjs` · `config-watch.mjs` · `migrate-settings.mjs` |
| settings 工具 | `src/agent-tools/settings.mjs` | 同名（同路径对） |
| 路径展开 | `src/expand-home.mjs` | 同名（同路径对） |
| 代理 | `src/proxy.mjs` | 同名（同路径对） |
| 供应商增删 / 密钥 / 激活 | `src/cli/setup-wizard.mjs` · `src/tui/model-picker.mjs` | `src/extension/settings.mjs` · `provider-flows.mjs` · `presets.mjs` |

**共同基线**：两端**同一文件同一格式**——`~/.thincoder/config.json`（严格 `JSON.parse`，无 JSONC）。

## 2. 核模块裁决行（自 `CORE-UNIFICATION.md` §2.5 搬入 · 逐字）

### 2.1 同路径对（原 §2.5（三）行集）

| # | 相对路径 / 对位 | 面 | 相似度 · 逐字节 | 分类 | 目标 | 端差处置 | 前提校验 | 须用户裁 | 归属段 |
|---|---|---|---|---|---|---|---|---|---|
| 74 | `proxy.mjs` | 同路径 | 0.7570 · 异 | ② | 进核 | 融合：取 CLI（abort 来源标注）+ VSC 的坏代理串友好报错并入 | 分叉 ＝ 错误形态（VSC 包 try/catch 报「Invalid proxy URI」`src/proxy.mjs:189,236` / CLI 抛原生）；配置格式与双开关语义同 | — | S1（建核补齐） |
| 77 | `expand-home.mjs` | 同路径 | 0.2308 · 异 | ② | 进核 | 融合：取一侧、逐字随迁 | 分叉 ＝ 仅注释出处（CLI 引记忆子系统规范档的 §9.3a / VSC 引本端设置档的 §2.7） | — | S1（建核补齐） |
| 79 | `config-migrate.mjs` | 同路径 | 0.0802 · 异 | ② | 进核 | 融合：取并集——核内保留 VSC 的 VS Code 旧设置 / 密钥库迁移遍（`src/config-migrate.mjs:112-184`） | 分叉 ＝ VSC 多一条老用户升级通道（VSC 独有迁移遍，不迁即丢密钥）；模型字段迁移两端同规则（CLI `src/config-migrate.mjs:20-63`） | — | S1（建核补齐） |
| 80 | `config.mjs` | 同路径 | 0.0471 · 异 | ③ | 进核（**同名不同物**：对位 = CLI `config.mjs` ↔ VSC `config-io.mjs`；VSC 的 `config.mjs` 实为模型规格表 ↔ CLI `model-specs.mjs`） | 以 CLI 为准（装载器）+ VSC 的 `$schema` 注入与配置监视面按端注入；默认值 / 校验覆盖面取 CLI 全量表 | 分叉 ＝ 组织结构（VSC 拆 8 档）+ 两处差异（`$schema` 注入 VSC `src/config-io.mjs:108`；VSC 校验表只覆盖 agent/traces `src/agent-tools/settings.mjs:43`）；前提（同一 `~/.thincoder/config.json`、同一 v2 架构）仍成立 | **①②** | S1（建核补齐） |
| 87 | `agent-tools/settings.mjs` | 同路径 | 0.5546 · 异 | ③ | 进核 | 以 CLI 为准（类型表由全量 DEFAULTS 派生 `src/agent-tools/settings.mjs:58`） | 分叉 ＝ 校验覆盖面（VSC 只派生 agent/traces `:43,61` ⇒ `websearch` / `mcp` / `memory` / `embedding` / `shell` 错类型可静默写入两端共享的 `config.json`）；前提（同一 config.json）仍成立 | **①②** | S1（建核补齐） |

### 2.2 语义对位遍行（原 §2.5（四）行集——同职责但相对路径不同）

| # | 对位（CLI ↔ VSC） | 分类 | 端差处置 | 前提校验 | 须用户裁 | 归属段 |
|---|---|---|---|---|---|---|
| 128 | `src/config.mjs`（装载器 + DEFAULTS）↔ `src/config-io.mjs` | ② | 融合：以 CLI 装载器为准 + `$schema` 注入按端差注入 | 分叉 ＝ 拆分（VSC 拆 8 档）；同一 `~/.thincoder/config.json`、同一 v2 架构 ⇒ 前提成立；**承 §2.5 #80** | —（承 #80） | S1（建核补齐） |
| 129 | `src/config.mjs`（`PROVIDER_PRESETS`）↔ `src/config-presets.mjs` | ② | 融合：取一侧（逐条同值） | 分叉 ＝ 拆档；VSC 头注自述「mirrors CLI PROVIDER_PRESETS…双端逐条同值」（`:2,7`）⇒ 前提成立 | — | S1（建核补齐） |
| 130 | `src/config.mjs`（consult / mcp / embedding 三段）↔ `src/config-consult.mjs` · `config-mcp.mjs` · `embed-config.mjs` | ② | 融合：核内单一 DEFAULTS + 三段的端侧消费面按端注入 | 分叉 ＝ 拆档；三段均以同一 `config.json` 为源（VSC `config-consult.mjs:8` 自述「镜像 CLI config.mjs 同规则」）⇒ 前提成立 | — | S1（建核补齐） |
| 131 | `src/config.mjs`（写盘面）↔ `src/extension/settings-panel-write.mjs` · `extension/settings.mjs` | ② | 融合：核内单一读写 + 面板写面按端注入；**MCP 配置留 VS Code 设置** ＝ 端特有段 | 分叉 ＝ 写入口（VSC 设置面板 / CLI TUI）；写盘产物同一 `config.json`（VSC `thincoder-vscode/src/extension/settings.mjs:2` 自述「Backed by the shared ~/.thincoder/config.json」）⇒ 前提成立 | — | S1（建核补齐） |
| 132 | （CLI 无监视面）↔ `src/extension/config-watch.mjs` · `extension/migrate-settings.mjs` | ④ | 端特有段：配置监视（宿主 `workspace` 事件）+ VS Code 旧设置 / 密钥库迁移 | 结构性不对称 = **依赖壳能力**（宿主文件监视 / `SecretStorage`）——CLI 无对应宿主面（B17）；依据是「**只在单侧存在**」，**非**「差异」（A9） | — | S1（建核补齐） |
| 177 | `src/cli/setup-wizard.mjs` + `src/tui/model-picker.mjs` ↔ `src/extension/settings.mjs` + `provider-flows.mjs` + `presets.mjs` | ② | 融合：provider 增删 / 密钥 / 激活的**纯持久化函数**取一侧 + UI 壳按端注入 | 分叉 ＝ UI 壳（QuickPick / TUI picker）+ 目录；持久化语义两端同（`config.json` `providers[]` + 单值 `model`——VSC `provider-flows.mjs:10` 自述「identical to the CLI」）⇒ 前提成立 | — | S1（建核补齐） |

## 3. 须用户裁条目（自 `CORE-UNIFICATION.md` §2.5.1 搬入 · 逐字）

### 3.1 甲组（真选择）

| # | 条目（路径 / 对位） | 命中 | 左端行为（CLI） | 右端行为（VSC） | 建议归一形态 | 影响面 | 裁定状态 |
|---|---|---|---|---|---|---|---|
| A4 | `config.mjs`（席位 #80；**同名不同物**——对位 = CLI `config.mjs` ↔ VSC `config-io.mjs`） | ①② | 装载器 + 全量 DEFAULTS（agent / memory / shell / embedding / mcp / websearch / traces）；写盘不注入 `$schema` | 装载器在 `config-io.mjs`（同址同格式）；写盘**注入 `$schema`**（`src/config-io.mjs:108`）；本端 `config.mjs` 实为模型规格表 | 以 CLI 为准（装载器）+ 端差注入（`$schema` 是否注入 · 配置监视面） | ① 配置文件里会 / 不会多一个 `$schema` 键（仅 VSC 写盘时）；② 键名与默认值口径统一 ⇒ 旧键保留为读入别名（兼容） | **已裁（2026-09-13）· 按建议** |
| A5 | `agent-tools/settings.mjs`（#87） | ①② | 类型表由**全量** DEFAULTS 派生（`src/agent-tools/settings.mjs:58`）⇒ 错类型被拒 | 类型表只派生 agent / traces（`:43,61`）⇒ `websearch` / `mcp` / `memory` / `embedding` / `shell` 的错类型**静默写进两端共享的 `config.json`** | 以 CLI 为准（全量类型校验） | ① VSC 里写错类型会被拒绝（原来会静默落盘，且 CLI 下次读该值会异常）；② 共享 `config.json` 的写入可靠性 | **已裁（2026-09-13）· 按建议** |

## 4. 对外契约影响（自 `CORE-UNIFICATION.md` §2.12.2 搬入 · 逐字；契约类模板见该档 §2.12.1）

> **契约类形态（模板）** → `CORE-UNIFICATION.md` §2.12.1「**配置格式**」行（单一权威源——本档不复制；该表 = 逐类兼容形态模板）。

### 4.1 处置表行（原 §2.12.2）

| # | 条目（契约点） | 类 | 归一变更 | 兼容形态（§2.12.1 模板） | 落地物（档:行 / 用例名 / CHANGELOG 条目） | 裁定状态 |
|---|---|---|---|---|---|---|
| 1 | `~/.thincoder/config.json` 键面与默认值（含 CLI-only `agent.goalTurns` / `agent.streamRules`；`agent.compactThreshold` 默认值分叉） | 配置 | 两面 → 核内单一 DEFAULTS | 旧键可读（迁移幂等 + 写回带 `.bak-{ts}`）· CHANGELOG | 两产品 `CHANGELOG.md` + `thincoder-cli/README.md` 键面 + 旧配置读入用例（S2 落） | 已裁（2026-09-13）· 按建议（§2.5.1 A4） |
| 2 | `$schema` 注入与否（VSC 写盘注入 / CLI 不注入） | 配置 | 取一侧 + 登记 | 登记 + README 键面同步 | 同第 1 行 + 配置读写用例 | 已裁（2026-09-13）· 按建议（§2.5.1 A4） |
| 3 | `settings` 工具的类型校验面（错类型是否拒写） | 输出（工具回话） | VSC 由「静默落盘」→「拒绕并报错」（同 CLI） | 登记 + CHANGELOG（工具行为条目） | `SETTINGS-TOOL.md` 同步 + VSC 用例 | 已裁（2026-09-13）· 按建议（§2.5.1 A5） |
| 4 | `agent.engineering` 的写盘范围（VSC 双写共享 `config.json`） | 配置 | 取 CLI（只进会话） | 旧行为撤回 ⇒ CHANGELOG + 登记 | `SESSION.md` / `ENGINEERING-MODE.md` 同步 | 已裁（2026-09-13）· 按建议（§2.5.1 A6） |

## 5. 受影响文件（该子系统）

指针（不复制）→ `CORE-UNIFICATION.md` §2.8 下列行：**产品运行期（S2 改）** · **对外契约兼容面（S0 登记 / S2 落地）**。
**核内落点行数（R24a · S1 落地收正）** → §2.8.1「核内逐档行数与拆分计划」（本子系统面：`thincoder-core/config.mjs`（带拆分计划）· `thincoder-core/config-io.mjs` · `thincoder-core/config-presets.mjs`）。

## 变更记录

- 2026-09-13：建档——自 `docs/design/CORE-UNIFICATION.md` 拆出（§2.5 #74 / #77 / #79 / #80 / #87 / #128–#132 / #177 · §2.5.1 A4 / A5 · §2.12.1「配置格式」类 · §2.12.2 第 1–4 行）；**语义零改**，行号沿用原编号。
- 2026-09-14（S1 收口轮）：§5 补**核内落点行数**指针（`config.mjs` · `config-io.mjs` · `config-presets.mjs`——§2.8 新增小节）。
