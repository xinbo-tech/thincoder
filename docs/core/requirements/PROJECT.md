# 产品定性（PROJECT）· 需求

> 板块 = **产品定性**——ThinCoder 产品族的定位与跨产品共享契约（两独立产品 / 共享配置与会话 / Provider 契约）。
> 本档 = 产品级定性面的**需求层权威**（决策表 + 共享契约——承旧 VSC 档 `PROJECT.md` 的产品级定性面）。
> VSC 专有面（界面 / 入口 / 审批 / webview 形态 / 会话流时序）= `docs/vsc/requirements/PROJECT.md`（本批同 split——切分规则见 §5.2）。
> CLI 侧同名档（`thincoder-cli/docs/requirements/PROJECT.md`——产品定性更完整）**未迁**；其迁入时与本档对账合并（触发 = CLI 迁移轮）。
> 建档：2026-09-15（**B 式迁移轮 · VSC 批 5**——`thincoder-vscode/docs/requirements/PROJECT.md` 拆分重建：产品级定性面 ⇒ 本档；
> 旧档原地一字不改、留作参照历史）。

## 1. 总体定位

ThinCoder 产品族 = **两个独立产品**（终端 CLI + VS Code 扩展）——同级独立、用户只装哪一个都行；
共享设计理念、提示词体系，以及**会话数据与配置数据**（两端读写同一份磁盘文件，可无缝接续同一会话、同一组 provider）。

## 2. 产品族定性决策

| 项 | 决策 | 备注 |
|---|---|---|
| 语言 | 纯 JavaScript（`.mjs`） | 无 TypeScript，无构建步骤，ESM 原生 |
| 依赖 | 零 npm 运行时依赖 | 仅 `node:` 标准库 + 各端宿主 API（VSC 端宿主 = VS Code Extension API——见 `docs/vsc/requirements/PROJECT.md`） |
| 产品关系 | 同级独立产品 | 互不依赖；同时装则共享配置与会话，切换无感 |

## 3. 跨产品共享契约

| # | 契约 | 内容 |
|---|---|---|
| **C1** | 配置共享 | 两端读写 `~/.thincoder/config.json`（`providers[]` + `activeProvider`）；`apiKey` 缺省回退环境变量；旧 VS Code settings 一次性迁移后停用 |
| **C2** | 会话共享 | `~/.thincoder/sessions/`（完整 sha1(cwd) + 槽位）——两端互读，可无缝接续同一会话 |
| **C3** | Provider 预设权威 | preset 表以 CLI `thincoder-cli/src/config.mjs` 的 `PROVIDER_PRESETS` 为唯一权威（当前全集 20 个，含 `kimi-code` / `glm-code` / `mimo` / `mimoplan` / `claude`（format: anthropic）/ `gemini`（format: google））——各端不再各自硬编码（避免漂移） |
| **C4** | custom 三协议 | 手动输入 name / baseURL / model，并选 API format：`openai`（默认）/ `anthropic` / `google`，写入 `provider.format`；三协议均有 transport |
| **C5** | 模型选择两级结构 | provider → 模型 两级 + add / remove / key 管理项（对齐 CLI `openModelPicker → openModelListForProvider`）；各端按各自界面形态实现（VSC 端形态见 `docs/vsc/requirements/PROJECT.md`） |
| **C6** | 添加 / 删除 provider 流程 | 对齐 CLI `addProviderFlow` / `removeProviderFlow` / `setKeyFlow`：添加 = 选 preset（过滤已添加）→ 自动填 baseURL / model → 输入 API key（custom 走 C4 手动流程）；删除 = 列出非 active 的 provider；key 管理 = 单独入口 |
| **C7** | 多 Provider 默认选择 | 自动选第一个有 key 的 provider（用户配 key 本身就是选择行为；配了多个按列表顺序取第一个） |
| **C8** | API Key 存储 | Key 落 `~/.thincoder/config.json` 明文，与 CLI 共享同一份配置（决策动因：两端共享配置 > 密钥链隔离）；旧版 SecretStorage 仅用于一次性迁移，迁移后清除 |
| **C9** | 与 CLI 记忆互通 | **暂不处理**——VSC 文件式记忆（`.thincoder/memory/` markdown + frontmatter）与 CLI 条目格式兼容；自动互通 / 合并检索未做，决策保留 |

## 4. 与 thincoder CLI 的关系

```
thincoder CLI                          thincoder-vscode
├── 终端 TUI（裸 ANSI）               ├── VS Code 侧面板（Webview）
├── 3 层记忆 + MCP                    ├── 文件式记忆 + MCP
└── npm i -g thincoder                └── VS Code Marketplace
两端共享（同一磁盘位置，互相读写）
├── ~/.thincoder/config.json 配置（providers + activeProvider）
└── ~/.thincoder/sessions/ 会话（完整 sha1(cwd) + 槽位）
```

同级独立产品。用户只装哪一个都行；同时装则共享配置与会话，切换无感。

## 5. 不并项与历史沿革

### 5.1 历史沿革（(d) 类——**不并**）

> 来源档 `thincoder-vscode/docs/requirements/PROJECT.md`——**原地保留作参照历史**（保留 ≠ 维护）。下列内容不并入本档：

| 旧档位置 | 内容 | 何故不并 |
|---|---|---|
| 旧档头注「归位注记」（自旧树设计层的 REQUIREMENTS 档归位——原档已不存在；原 v1 功能范围节拆出至 `FEATURES（VSC 侧）`） | 旧树内归位史 | 旧树批次语境——本档即基准层权威登记 |
| 旧档「待决策」节头注（「原列各议题均已标记决策态」） | 决策过程注记 | 决策态已全部落定——结论入 §2–§3，过程注记不并 |
| 旧档「独立产品，不依赖 thincoder CLI。零外部依赖（npm + 文件系统）」散行 | 定性重述 | 已并入本档 §2（同一事实只详述一处——D2） |

### 5.2 不并项登记（拆分去向——逐项登记）

**切分规则（本批裁定——承批次任务书）**：跨产品契约（与 CLI 共享磁盘文件 / 协议 / 行为对齐）⇒ 本档（core）；仅本端实现 / 界面 / 宿主面 ⇒ `docs/vsc/requirements/PROJECT.md`。

| 旧档面 | 内容 | 去向 |
|---|---|---|
| 「已确定的决策」表的 界面 / 入口 / LLM 调用 / 工具审批 / 模型能力 / Session 标题 六行 | VSC 端实现与界面定性 | `docs/vsc/requirements/PROJECT.md` |
| 模型选择契约的 webview 实现形态（hover flyout 子菜单）· 协议 transport 实现登记 | VSC 端实现形态 | 同上（契约本体 = 本档 C5 / C4） |
| 「待决策」节：安全边界 / Multi-root 策略 / Webview 技术选型 / 国际化 | VSC 端产品决策 | 同上 |
| 「会话流时序对齐 CLI」节（2026-09-09 需求点——待设计） | webview 面需求（owning board = panel/webview） | 同上（待设计登记） |
| CLI 侧同名档（`thincoder-cli/docs/requirements/PROJECT.md`） | CLI 产品定性正文（更完整） | 触发 = CLI 迁移轮（迁入时与本档对账） |

## 6. 体量与拆分规划（R24a）

**实测行数**：本档 **83 行**（根层新建 · as-of 2026-09-15）——**低于 300 行软线，无需拆分规划**。

## 变更记录

- 2026-09-15（**B 式迁移轮 · VSC 批 5**）：建档——`thincoder-vscode/docs/requirements/PROJECT.md` **拆分重建**：
  产品级定性面 ⇒ 本档；VSC 专有面 ⇒ `docs/vsc/requirements/PROJECT.md`（切分规则见 §5.2——承 §7.2 D4 归属疑变的父侧裁定）。
